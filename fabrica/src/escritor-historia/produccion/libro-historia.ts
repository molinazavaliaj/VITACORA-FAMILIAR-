// El libro de «Vitácora de una historia» enchufado al worker de la fábrica (plan 2026-10-21, Task 5.3). Mismo
// recorrido que el libro V3 de Familiar (escritor/produccion/libro-v3.ts, que no se toca), con el escritor de historia
// (escritor-historia/orquestador.ts) y su propia carpeta en Storage:
//
//   1. La entrevista terminó (narrador `completado` o `cerrado_anticipado`) → Etapa A en segundo plano: registro,
//      plan y dudas de datos. Hecha = `{id}/escritor-historia/carpeta-A.json`. Si no pasa sus controles, queda
//      `fallo-A.json` y se avisa a los socios (no se reintenta sola).
//   2. Las dudas de datos van por mail a los socios, una vez (`dudas-avisadas.txt`). Las correcciones se escriben en
//      `{id}/escritor-historia/correcciones.json` (como en V3) antes de que se escriba el libro.
//   3. Pedido `pagado` + libro cerrado (`libro_aprobado_at`) → en segundo plano: A si faltaba (o si el material
//      cambió), la espera por las dudas, B con las correcciones, C, plantilla → libro.html y libro.pdf, «Su voz» y el
//      pedido a `entregado`. Después, la imprenta (imprenta.ts: Bookmundo sin Notas, o el aviso de libro flaco).
//      Si algo falla: `fallido` y aviso. Sin los textos de tapa aprobados del idioma (textos-tapa.ts), el libro espera.
//
// Se prende con `ESCRITOR_HISTORIA` (`1` = todos, `solo:<id>,<id>` = esos): apagado no se escribe nada, ni la A.
// Tope por trabajo: `ESCRITOR_HISTORIA_TOPE_USD` (10 por defecto). Cada llamada va a consumo_ia con
// `paso='escritor-historia-A|B|C'`. Todo lo que se le paga al modelo queda en el almacén (`pasos/`, `lotes/`): si el
// proceso se corta, volver a correr retoma sin pagar de nuevo.
import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { vigilarClave } from '../../alarma-anthropic.js';
import { cargarConfig } from '../../config.js';
import { anotarUsoEscritorHistoria } from '../../costos.js';
import { esTextual, FRASES_POR_CAPITULO, type FrasesJson } from '../../libro/frases.js';
import { htmlAPdf } from '../../libro/pdf.js';
import { publicarFrases } from '../../libro/publicar-frases.js';
import { AlmacenSupabase } from '../../escritor/almacen/supabase.js';
import type { Almacen } from '../../escritor/almacen/tipos.js';
import { Carpeta, leerJSON, parseJSONTolerante } from '../../escritor/carpeta.js';
import { Ejecutor, ErrorJSON, OPCIONES_CLIENTE, TopeDeGasto } from '../../escritor/ejecutor.js';
import { salida, trato } from '../../escritor/lectura.js';
import type { CorreccionFamilia } from '../../escritor/material/a-carpeta.js';
import { ModeloAnthropic, type ClienteMensajes } from '../../escritor/modelo/anthropic.js';
import { LoteAnthropic, type ClienteLotes } from '../../escritor/modelo/lote-anthropic.js';
import { ErrorDelModelo } from '../../escritor/modelo/tipos.js';
import { cargarSnapshot } from '../../escritor/orquestador/contexto.js';
import { avisarSocios, hayAQuienAvisar } from '../../escritor/produccion/avisos.js';
import { Cola } from '../../escritor/produccion/cola.js';
import { frasesParaSuVoz, libroParaPlantilla, paraPlantilla, type FuenteDeFrase } from '../../escritor/salida/plantilla.js';
import { leerEdicion } from '../../libro/edicion.js';
import { cargarFotos } from '../../libro/fotos.js';
import { construirHtmlLibro } from '../../libro/plantilla-html.js';
import { esTablaAusente } from '../../historia/candado.js';
import { carpetaDeHistoria } from '../material/carpeta.js';
import { leerEntrevistaHistoria, type AudioHistoria } from '../material/de-base.js';
import { etapaAHistoria, etapaBHistoria, etapaCHistoria, type ContextoHistoria, type ResultadoAHistoria } from '../orquestador.js';
import { imprentaHistoria } from './imprenta.js';
import { PREFIJO_HISTORIA, RUTA_LIBRO_HTML_HISTORIA, RUTA_LIBRO_MD_HISTORIA, RUTA_LIBRO_PDF_HISTORIA } from './rutas.js';
import { lenguaDeHistoria, textosTapaHistoria, type TextosTapaHistoria } from './textos-tapa.js';

type Db = SupabaseClient;

// ---------------------------------------------------------------- rutas

export { PREFIJO_HISTORIA, RUTA_LIBRO_HTML_HISTORIA, RUTA_LIBRO_MD_HISTORIA, RUTA_LIBRO_PDF_HISTORIA };
export const CARPETA_A = 'carpeta-A.json';
export const FALLO_A = 'fallo-A.json';
export const DUDAS = 'dudas-familia.json';
export const DUDAS_AVISADAS = 'dudas-avisadas.txt';
export const CORRECCIONES = 'correcciones.json';
export const TRABAJANDO = 'trabajando.json';
export const AVISO_SIN_TEXTOS = 'aviso-sin-textos-tapa.txt';

const ESTADOS_TERMINADO = ['completado', 'cerrado_anticipado'];
/** Tras un error (no un control que no pasa: eso es fallo-A.json), la Etapa A espera esto antes de reintentar. */
const ESPERA_TRAS_ERROR_MS = 30 * 60 * 1000;
/** Un libro que se corta por un error pasajero vuelve a 'pagado' y se reintenta tras esta espera… */
const ESPERA_LIBRO_MS = 15 * 60 * 1000;
/** …hasta esta cantidad de veces por pedido (en este proceso); después, 'fallido' y aviso. */
const REINTENTOS_LIBRO = 3;
/** Si el mail de dudas no salió, el libro reintenta mandarlo en este rato. */
const REINTENTO_AVISO_DUDAS_MS = 60 * 60 * 1000;

// ---------------------------------------------------------------- prendido y tope

/** `ESCRITOR_HISTORIA`: `1` (todos) o `solo:<id>,<id>` (esos). Sin la variable, apagado. */
export function escritorHistoriaPrendido(narradorId: string): boolean {
  const v = (process.env.ESCRITOR_HISTORIA ?? '').trim();
  if (v === '1') return true;
  if (!v.startsWith('solo:')) return false;
  return v.slice(5).split(',').map((s) => s.trim()).filter(Boolean).includes(narradorId);
}

/** Tope por trabajo: `ESCRITOR_HISTORIA_TOPE_USD` (10 por defecto). */
export function topeHistoria(): number {
  const t = Number(process.env.ESCRITOR_HISTORIA_TOPE_USD ?? 10);
  return Number.isFinite(t) && t > 0 ? t : 10;
}

/** Desde que salió el mail de dudas, el libro espera esto (`ESCRITOR_ESPERA_DUDAS_HORAS`, como V3; 24 por defecto). */
const esperaPorDudasMs = (): number => {
  const h = Number(process.env.ESCRITOR_ESPERA_DUDAS_HORAS ?? 24);
  return (Number.isFinite(h) && h >= 0 ? h : 24) * 60 * 60 * 1000;
};

// ---------------------------------------------------------------- el motor (los tests ponen el modelo falso)

export type MaterialHistoriaBase = { c: Carpeta; audios: AudioHistoria[]; propia: boolean };
export type MotorHistoria = {
  ejecutor(a: { almacen: Almacen; narradorId: string; log: (s: string) => void }): { ej: Ejecutor; usarLote: boolean };
  /** De dónde sale el material. Sin esto, de la base (carpetaHistoriaDeLaBase). */
  material?: (db: Db, narradorId: string) => Promise<MaterialHistoriaBase>;
  /** HTML → PDF (Playwright en producción). */
  aPdf?: (html: string) => Promise<Buffer>;
};

/** Producción: Opus/Haiku por Batch (la configuración de Familiar), tope por trabajo y cada llamada a consumo_ia. */
export function motorRealHistoria(db: Db): MotorHistoria {
  return {
    ejecutor({ almacen, narradorId, log }) {
      const cliente = vigilarClave(new Anthropic({ ...OPCIONES_CLIENTE, apiKey: cargarConfig().anthropicApiKey }), 'el escritor de historia');
      const ej = new Ejecutor({
        modelo: new ModeloAnthropic(cliente as unknown as ClienteMensajes),
        lote: new LoteAnthropic(cliente as unknown as ClienteLotes, almacen, { log }),
        todoPorLote: true,
        almacen,
        topeUsd: topeHistoria(),
        log,
        alAnotar: (fila) => anotarUsoEscritorHistoria(db, narradorId, fila),
      });
      return { ej, usarLote: true };
    },
  };
}

// ---------------------------------------------------------------- el material

export class SinMaterialHistoria extends Error {
  constructor(id: string) { super(`${id}: la historia no tiene ninguna respuesta que cuente para el libro`); this.name = 'SinMaterialHistoria'; }
}
export class FalloDelEscritorHistoria extends Error {
  constructor(m: string) { super(m); this.name = 'FalloDelEscritorHistoria'; }
}

/** «Para mí» en la compra: el libro es de quien lo compró (el mismo criterio que V3, esLibroPropio). */
const esPropia = (contexto: unknown): boolean => (contexto as { vinculoComprador?: unknown } | null | undefined)?.vinculoComprador === 'yo mismo';

export async function carpetaHistoriaDeLaBase(db: Db, narradorId: string): Promise<MaterialHistoriaBase> {
  const r = await leerEntrevistaHistoria(db, narradorId);
  if (!r) throw new SinMaterialHistoria(narradorId);
  const c = carpetaDeHistoria(r.entrevista);
  if (!/<respuesta id=/.test(c.leer('entradas/respuestas.xml'))) throw new SinMaterialHistoria(narradorId);
  const { data, error } = await db.from('narradores').select('contexto').eq('id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer el contexto de ${narradorId}: ${error.message}`);
  return { c, audios: r.audios, propia: esPropia((data as { contexto?: unknown } | null)?.contexto) };
}

// ---------------------------------------------------------------- ayudas

const almacenDe = (db: Db, id: string): AlmacenSupabase => new AlmacenSupabase(db, PREFIJO_HISTORIA(id));

function contexto(db: Db, id: string, motor: MotorHistoria, c: Carpeta, propia: boolean): ContextoHistoria {
  const almacen = almacenDe(db, id);
  const log = (s: string): void => console.log(`historia ${id}: ${s}`);
  const { ej, usarLote } = motor.ejecutor({ almacen, narradorId: id, log });
  return { c, ej, almacen, log, usarLote, propia };
}

async function quienEs(db: Db, id: string): Promise<string> {
  try {
    const { data } = await db.from('narradores').select('como_le_dicen').eq('id', id).maybeSingle();
    const nombre = (data as { como_le_dicen?: string } | null)?.como_le_dicen?.trim();
    return nombre ? `${nombre} (${id})` : id;
  } catch {
    return id;
  }
}

async function listar(db: Db, ruta: string): Promise<Set<string>> {
  const { data, error } = await db.storage.from('audios').list(ruta);
  if (error) throw new Error(`No se pudo listar ${ruta}: ${error.message}`);
  return new Set(((data ?? []) as { name: string }[]).map((a) => a.name));
}

async function subir(db: Db, ruta: string, cuerpo: string | Uint8Array | Buffer, tipo: string): Promise<void> {
  const { error } = await db.storage.from('audios').upload(ruta, cuerpo, { contentType: tipo, upsert: true });
  if (error) throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
}

// ---------------------------------------------------------------- dos copias de la fábrica a la vez (como V3)

const PROCESO = randomUUID();
const MARCA_VIGENTE_MS = 10 * 60 * 1000;

async function conMarca<T>(db: Db, id: string, que: string, f: () => Promise<T>): Promise<T> {
  const almacen = almacenDe(db, id);
  const marcar = (latido: string): Promise<void> =>
    almacen.escribir(TRABAJANDO, JSON.stringify({ proceso: PROCESO, que, latido })).catch((err) => {
      console.error(`historia ${id}: no pude dejar la marca de trabajo:`, err instanceof Error ? err.message : err);
    });
  await marcar(new Date().toISOString());
  let enVuelo: Promise<void> = Promise.resolve();
  const reloj = setInterval(() => { enVuelo = marcar(new Date().toISOString()); }, 60_000);
  reloj.unref?.();
  try {
    return await f();
  } finally {
    clearInterval(reloj);
    await enVuelo;
    await marcar(new Date(0).toISOString());
  }
}

/** ¿Otra copia de la fábrica está trabajando ahora con este narrador? Si no se puede leer la marca, no. */
async function trabajaOtraCopia(db: Db, id: string, ahora: number = Date.now()): Promise<boolean> {
  try {
    const t = await almacenDe(db, id).leer(TRABAJANDO);
    if (t === null) return false;
    const m = JSON.parse(t) as { proceso?: string; latido?: string };
    return m.proceso !== PROCESO && ahora - Date.parse(m.latido ?? '') < MARCA_VIGENTE_MS;
  } catch {
    return false;
  }
}

const maximoEnParalelo = (): number => Math.max(1, Number(process.env.ESCRITOR_LIBROS_EN_PARALELO ?? 3) || 3);
const cola = new Cola(maximoEnParalelo);
export const colaHistoria = cola;
const ultimoErrorA = new Map<string, number>();
const esperaLibro = new Map<string, number>();
const erroresLibro = new Map<string, number>();
/** Una Etapa A (que se paga antes de que haya pedido) nunca ocupa el último lugar de la cola. */
const hayLugarParaEtapaA = (id: string): boolean => cola.hayLugar(id) && (maximoEnParalelo() <= 1 || cola.cuantos < maximoEnParalelo() - 1);

// ---------------------------------------------------------------- Etapa A y dudas

/** Corre la Etapa A. Un control que no pasa (o el tope, o sin material) deja fallo-A.json y avisa; un error de la API tira. */
export async function correrEtapaAHistoria(db: Db, id: string, motor: MotorHistoria = motorRealHistoria(db)): Promise<ResultadoAHistoria> {
  let r: ResultadoAHistoria;
  try {
    const m = await (motor.material ?? carpetaHistoriaDeLaBase)(db, id);
    r = await etapaAHistoria(contexto(db, id, motor, m.c, m.propia));
  } catch (err) {
    if (!(err instanceof TopeDeGasto) && !(err instanceof SinMaterialHistoria)) throw err;
    r = { ok: false, motivo: err.message };
  }
  if (!r.ok) {
    await almacenDe(db, id).escribir(FALLO_A, JSON.stringify({ motivo: r.motivo, fecha: new Date().toISOString() }, null, 1));
    await avisarSocios(
      `La Etapa A del libro de historia de ${await quienEs(db, id)} no salió`,
      `${r.motivo}\n\nNo se reintenta sola. Lo que se pagó quedó en ${PREFIJO_HISTORIA(id)}/ (pasos/, costos.json). Para reintentar, borrar ${PREFIJO_HISTORIA(id)}/${FALLO_A}; si la familia ya cerró el libro y pagó, el pedido la corre igual antes de escribir.`,
    );
  }
  return r;
}

type DudaGuardada = { id: string; pregunta: string; opciones: string[]; que: string; citas: { id: string; texto: string }[] };

/** El mail de las dudas a los socios (una vez). La pantalla de dudas de la web todavía no lee historia: van a mano. */
async function avisarDudas(db: Db, id: string): Promise<boolean> {
  const almacen = almacenDe(db, id);
  const t = await almacen.leer(DUDAS);
  const dudas = (t ? (JSON.parse(t) as { dudas?: DudaGuardada[] }).dudas : []) ?? [];
  if (dudas.length) {
    const lineas = dudas.map((d) => [
      `${d.id}. ${d.pregunta}${d.opciones.length ? ` (opciones: ${d.opciones.join(' / ')})` : ''}`,
      `   Qué vio el lector: ${d.que}`,
      ...d.citas.map((c) => `   ${c.id}: «${c.texto.length > 300 ? `${c.texto.slice(0, 300)}…` : c.texto}»`),
    ].join('\n'));
    const salio = await avisarSocios(
      `Dudas de datos del libro de historia de ${await quienEs(db, id)} (${dudas.length})`,
      `La Etapa A terminó y encontró estas dudas de datos. La pantalla de dudas de la web todavía no muestra las de historia: hay que preguntarle a la familia por otro lado.\n\n${lineas.join('\n\n')}\n\nEl libro no se escribe hasta ${Math.round(esperaPorDudasMs() / 3_600_000)} horas después de este mail (aunque la dueña ya lo haya cerrado). Las respuestas se escriben en ese rato en ${PREFIJO_HISTORIA(id)}/${CORRECCIONES}:\n{"correcciones": [{"dudaId": "D01", "texto": "El cuñado de Toni se llamaba Salva."}]}\nSin ese archivo, el libro se escribe sin correcciones.`,
    );
    if (!salio) return false;
  }
  await almacen.escribir(DUDAS_AVISADAS, new Date().toISOString());
  return true;
}

/** Las correcciones (como V3). Sin archivo, ninguna. Roto: tira (un libro sin las correcciones pedidas está mal). */
export async function leerCorreccionesHistoria(almacen: Almacen): Promise<CorreccionFamilia[]> {
  const t = await almacen.leer(CORRECCIONES);
  if (t === null) return [];
  let j: { correcciones?: unknown } | unknown[];
  try {
    j = parseJSONTolerante(t) as { correcciones?: unknown } | unknown[];
  } catch (err) {
    throw new FalloDelEscritorHistoria(`${CORRECCIONES} no es un JSON válido: ${(err as Error).message}`);
  }
  const lista = Array.isArray(j) ? j : (j as { correcciones?: unknown }).correcciones;
  if (!Array.isArray(lista)) throw new FalloDelEscritorHistoria(`${CORRECCIONES} no tiene la lista "correcciones"`);
  return lista.map((x, i) => {
    const k = x as { texto?: unknown; dudaId?: unknown };
    if (typeof k?.texto !== 'string') throw new FalloDelEscritorHistoria(`${CORRECCIONES}: la corrección ${i + 1} no tiene "texto"`);
    return { texto: k.texto, ...(typeof k.dudaId === 'string' ? { dudaId: k.dudaId } : {}) };
  });
}

/** Lo que la dueña escribió en «Correcciones» al cerrar el libro (`narradores.edicion.correcciones`), como en V3. */
async function correccionesDeLaFamilia(db: Db, id: string): Promise<CorreccionFamilia[]> {
  const { data, error } = await db.from('narradores').select('edicion').eq('id', id).maybeSingle();
  if (error) throw new Error(`No pude leer la edición de ${id}: ${error.message}`);
  const t = (data as { edicion?: { correcciones?: unknown } | null } | null)?.edicion?.correcciones;
  return typeof t === 'string' && t.trim() ? [{ texto: t.trim() }] : [];
}

/** Cuántos ms faltan para escribir el libro por las dudas (0 = ya). Como esperaPorDudas de V3. */
async function esperaPorDudas(db: Db, id: string, almacen: Almacen, ahora: number = Date.now()): Promise<number> {
  const t = await almacen.leer(DUDAS);
  const dudas = (t ? (JSON.parse(t) as { dudas?: { id?: string }[] }).dudas : []) ?? [];
  if (!dudas.length || esperaPorDudasMs() === 0) return 0;
  let correcciones: CorreccionFamilia[] = [];
  try { correcciones = await leerCorreccionesHistoria(almacen); } catch { /* roto: se espera el plazo */ }
  const conTexto = new Set(correcciones.filter((c) => c.dudaId && c.texto.trim()).map((c) => c.dudaId));
  if (dudas.every((d) => typeof d?.id === 'string' && conTexto.has(d.id))) return 0;
  if (!hayAQuienAvisar()) return 0;
  let avisadas = await almacen.leer(DUDAS_AVISADAS);
  if (!avisadas?.trim()) {
    if (!(await avisarDudas(db, id))) return REINTENTO_AVISO_DUDAS_MS;
    avisadas = await almacen.leer(DUDAS_AVISADAS);
  }
  const desde = Date.parse(avisadas ?? '');
  return Number.isFinite(desde) ? Math.max(0, desde + esperaPorDudasMs() - ahora) : 0;
}

/** Del tick: lanza la Etapa A si falta (y no falló ni está corriendo) y avisa las dudas cuando ya está. Nunca tira. */
async function revisarEtapaA(db: Db, id: string, o: { motor?: MotorHistoria; ahora?: number }): Promise<void> {
  try {
    const archivos = await listar(db, PREFIJO_HISTORIA(id));
    if (archivos.has(CARPETA_A)) {
      const avisadas = archivos.has(DUDAS_AVISADAS) ? await almacenDe(db, id).leer(DUDAS_AVISADAS) : null;
      if (!avisadas?.trim() && !cola.ocupada(id)) await avisarDudas(db, id);
      return;
    }
    if (archivos.has(FALLO_A) || !hayLugarParaEtapaA(id)) return;
    const ahora = o.ahora ?? Date.now();
    if (ahora - (ultimoErrorA.get(id) ?? -Infinity) < ESPERA_TRAS_ERROR_MS) return;
    if (await trabajaOtraCopia(db, id)) return;
    cola.lanzar(id, async () => {
      try {
        const r = await conMarca(db, id, 'etapa A', () => correrEtapaAHistoria(db, id, o.motor ?? motorRealHistoria(db)));
        ultimoErrorA.delete(id);
        console.log(`historia ${id}: Etapa A ${r.ok ? `lista (${r.capitulos} capítulos, ${r.dudas.length} dudas)` : `no salió: ${r.motivo}`}`);
      } catch (err) {
        ultimoErrorA.set(id, Date.now());
        throw err;
      }
    });
  } catch (err) {
    console.error(`historia ${id}: no pude revisar la Etapa A:`, err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------- el libro

/** R.. → la fila de `respuestas` de la que se corta la frase: la de esa clave (o su repregunta), con audio, que la dice tal cual. */
export function fuentesDeFrasesHistoria(c: Carpeta, audios: AudioHistoria[]): Record<string, FuenteDeFrase> {
  const etiquetas = c.existe('entradas/etiquetas.json') ? (JSON.parse(c.leer('entradas/etiquetas.json')) as { id: string; clave: string }[]) : [];
  const claveDe = new Map(etiquetas.map((e) => [e.id, e.clave]));
  const frases: { id: string; texto: string }[] = leerJSON(c, salida('sus_frases.json')).frases || [];
  const out: Record<string, FuenteDeFrase> = {};
  for (const f of frases) {
    const k = claveDe.get(f.id);
    const audio = k ? audios.find((a) => a.audioPath && a.transcripcion && (a.clave === k || a.clave === `RP~${k}`) && esTextual(String(f.texto), [a.transcripcion])) : undefined;
    out[f.id] = { respuestaId: audio?.respuestaId ?? null, preguntaOrden: 0 };
  }
  return out;
}

/** «Su voz» solo con frases que tienen de dónde cortarse (como soloConAudio de V3). */
function soloConAudio(f: FrasesJson): FrasesJson {
  const capitulos = f.capitulos
    .map((c) => {
      const conAudio = c.candidatas.filter((k) => k.respuesta_id);
      return { ...c, candidatas: conAudio.map((k, i) => ({ ...k, elegida: i < FRASES_POR_CAPITULO })) };
    })
    .filter((c) => c.candidatas.length > 0);
  return { ...f, capitulos };
}

/** Las entradas de dos carpetas (respuestas, etiquetas, ficha, material), iguales. */
function mismasEntradas(a: Carpeta, b: Carpeta): boolean {
  const de = (c: Carpeta): string => JSON.stringify(Object.entries(c.aObjeto()).filter(([k]) => k.startsWith('entradas/') && k !== 'entradas/confirmado.xml'));
  return de(a) === de(b);
}

/** Un error que reintentar no arregla. */
function esDefinitivo(err: unknown): boolean {
  return err instanceof FalloDelEscritorHistoria || err instanceof TopeDeGasto || err instanceof SinMaterialHistoria || err instanceof ErrorJSON || (err instanceof ErrorDelModelo && !err.reintentable);
}

type NarradorParaLibro = { id: string; nombre: string; foto_url: string | null; edicion: unknown };

/** El HTML del libro (libro.html y libro.pdf), como htmlLibroV3 de Familiar pero con la tapa de historia. */
export async function htmlLibroHistoria(db: Db, a: { narrador: NarradorParaLibro; libroMd: string; idioma: 'es' | 'ca'; trato: 'vos' | 'tu'; textos: TextosTapaHistoria }): Promise<string> {
  const p = libroParaPlantilla(a.libroMd);
  const edicion = leerEdicion(a.narrador.edicion);
  const fotoTapa = edicion.portadaFotoId ? (await cargarFotos(db, a.narrador.id)).porId.get(edicion.portadaFotoId) : undefined;
  return construirHtmlLibro({
    titulo: p.titulo,
    nombreNarrador: a.narrador.nombre,
    tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
    anioNacimiento: null,
    fotoUrl: fotoTapa?.dataUri ?? a.narrador.foto_url,
    fotoFoco: fotoTapa?.foco,
    indice: p.indice,
    libroMarkdown: p.libroMarkdown,
    idioma: a.idioma,
    trato: a.trato,
    tapaEyebrow: a.textos.eyebrow,
  });
}

/** Los textos de tapa aprobados del idioma de esta historia, o null si todavía no están. */
async function textosDe(db: Db, id: string): Promise<TextosTapaHistoria | null> {
  const { data, error } = await db.from('historias').select('idioma').eq('narrador_id', id).maybeSingle();
  if (error) throw new Error(`No pude leer el idioma de la historia de ${id}: ${error.message}`);
  return textosTapaHistoria(lenguaDeHistoria((data as { idioma?: string } | null)?.idioma));
}

/** Lo que hace la fábrica con el libro ya entregado: la imprenta (Task 5.4). Los tests lo cambian. */
export type DespuesDeEntregar = (db: Db, narradorId: string) => Promise<void>;
const imprentaPorDefecto: DespuesDeEntregar = async (db, id) => { await imprentaHistoria(db, id); };
let despuesDeEntregar: DespuesDeEntregar = imprentaPorDefecto;
export const alEntregarHistoria = (f: DespuesDeEntregar | null): void => { despuesDeEntregar = f ?? imprentaPorDefecto; };

/**
 * El libro entero de un pedido ya reclamado ('generando'), como escribirLibroV3. Deja el pedido en 'entregado'. Ante
 * un error pasajero lo devuelve a 'pagado' (se reintenta a los 15 minutos, hasta 3 veces por proceso); ante uno
 * definitivo, o pasados esos reintentos, 'fallido' con aviso a los socios. Nunca tira.
 */
export async function escribirLibroHistoria(db: Db, pedido: { id: string; narrador_id: string }, motor: MotorHistoria = motorRealHistoria(db)): Promise<void> {
  const id = pedido.narrador_id;
  try {
    const desdeBase = await (motor.material ?? carpetaHistoriaDeLaBase)(db, id);
    const almacen = almacenDe(db, id);
    let snapA = await cargarSnapshot(almacen, 'A');
    // Si el material cambió desde la Etapa A (una reserva, algo sacado, una transcripción tarde), la A se rehace.
    if (snapA && !mismasEntradas(snapA, desdeBase.c)) {
      console.log(`historia ${id}: el material cambió desde la Etapa A; se rehace con el de hoy`);
      snapA = null;
    }
    const x = contexto(db, id, motor, snapA ?? desdeBase.c, desdeBase.propia);
    if (!snapA) {
      if ((await almacen.leer(DUDAS_AVISADAS)) !== null) await almacen.escribir(DUDAS_AVISADAS, '');
      const a = await etapaAHistoria(x);
      if (!a.ok) throw new FalloDelEscritorHistoria(`Etapa A: ${a.motivo}`);
    }
    const espera = await esperaPorDudas(db, id, almacen);
    if (espera > 0) {
      esperaLibro.set(id, Date.now() + espera);
      const { error } = await db.from('pedidos').update({ estado: 'pagado' }).eq('id', pedido.id).eq('estado', 'generando');
      if (error) console.error(`historia ${id}: no se pudo devolver a 'pagado' el pedido ${pedido.id}:`, error.message);
      x.log(`hay dudas de datos: el libro espera ${Math.ceil(espera / 3_600_000)} horas más por las correcciones`);
      return;
    }
    const b = await etapaBHistoria(x, [...(await leerCorreccionesHistoria(almacen)), ...(await correccionesDeLaFamilia(db, id))]);
    if (!b.ok) throw new FalloDelEscritorHistoria(`Etapa B: ${b.motivo}`);
    const r = await etapaCHistoria(x);
    x.log(`libro escrito: ${r.capitulos} capítulos, ${r.controlesFinal}, USD ${r.usd.toFixed(2)}`);

    const { data: n, error } = await db.from('narradores').select('id, nombre, contexto, foto_url, edicion').eq('id', id).maybeSingle();
    if (error || !n) throw new Error(`No se pudo leer el narrador ${id}: ${error?.message ?? 'no existe'}`);
    const textos = await textosDe(db, id);
    if (!textos) throw new FalloDelEscritorHistoria('faltan los textos de tapa de historia aprobados en este idioma (docs/historia/libro-textos-borrador.md)');
    const html = await htmlLibroHistoria(db, { narrador: n as NarradorParaLibro, libroMd: x.c.leer('libro.md'), idioma: paraPlantilla(x.c).idioma, trato: trato(x.c), textos });
    await subir(db, RUTA_LIBRO_HTML_HISTORIA(id), html, 'text/html; charset=utf-8');
    await subir(db, RUTA_LIBRO_PDF_HISTORIA(id), await (motor.aPdf ?? htmlAPdf)(html), 'application/pdf');

    // «Su voz»: no frena la entrega.
    try {
      if (x.c.existe(salida('sus_frases.md'))) await publicarFrases(db, soloConAudio(frasesParaSuVoz(x.c, { narradorId: id, pedidoId: pedido.id, fuentes: fuentesDeFrasesHistoria(x.c, desdeBase.audios) })));
    } catch (err) {
      x.log(`«Su voz» no salió (el libro se entrega igual): ${err instanceof Error ? err.message : err}`);
    }

    const { error: errorUpdate } = await db.from('pedidos').update({ estado: 'entregado', libro_pdf_path: RUTA_LIBRO_PDF_HISTORIA(id), audiolibro_paths: null }).eq('id', pedido.id);
    if (errorUpdate) throw new Error(`No se pudo dejar entregado el pedido ${pedido.id}: ${errorUpdate.message}`);
    erroresLibro.delete(pedido.id);
    try {
      await despuesDeEntregar(db, id);
    } catch (err) {
      const motivo = err instanceof Error ? err.message : String(err);
      console.error(`historia ${id}: lo de después de entregar falló (el libro ya está entregado):`, motivo);
      // No se reintenta solo (el pedido ya está entregado): que lo sepan los socios y cómo rehacerlo.
      await avisarSocios(
        `La imprenta del libro de historia de ${await quienEs(db, id)} no salió`,
        `El libro está escrito y entregado, pero armar los archivos de Bookmundo falló: ${motivo}\n\nPara rehacerlo (no le paga nada al modelo):\n  cd fabrica && npx tsx scripts/historia-imprenta.ts ${id}`,
      );
    }
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error(`historia ${id}: el libro del pedido ${pedido.id} falló:`, motivo);
    const veces = (erroresLibro.get(pedido.id) ?? 0) + 1;
    if (!esDefinitivo(err) && veces <= REINTENTOS_LIBRO) {
      erroresLibro.set(pedido.id, veces);
      esperaLibro.set(id, Date.now() + ESPERA_LIBRO_MS);
      const { error } = await db.from('pedidos').update({ estado: 'pagado' }).eq('id', pedido.id).eq('estado', 'generando');
      if (error) console.error(`historia ${id}: no se pudo devolver a 'pagado' el pedido ${pedido.id}:`, error.message);
      return;
    }
    erroresLibro.delete(pedido.id);
    const { error } = await db.from('pedidos').update({ estado: 'fallido' }).eq('id', pedido.id);
    if (error) console.error(`historia ${id}: no se pudo marcar 'fallido' el pedido ${pedido.id}:`, error.message);
    await avisarSocios(
      `El libro de historia de ${await quienEs(db, id)} no salió (pedido ${pedido.id})`,
      `${motivo}\n\nEl pedido quedó 'fallido'. Lo pagado al modelo quedó en ${PREFIJO_HISTORIA(id)}/: para reintentar, volver el pedido a 'pagado' (retoma sin repagar).`,
    );
  }
}

async function avisarSinTextos(db: Db, id: string): Promise<void> {
  const almacen = almacenDe(db, id);
  if ((await almacen.leer(AVISO_SIN_TEXTOS)) !== null) return;
  const salio = await avisarSocios(
    `El libro de historia de ${await quienEs(db, id)} espera los textos de tapa`,
    `El pedido está pagado y el libro cerrado, pero faltan los textos de tapa de «Vitácora de una historia» aprobados en su idioma (docs/historia/libro-textos-borrador.md). La fábrica no escribe el libro hasta que estén en fabrica/src/escritor-historia/produccion/textos-tapa.ts. Cuando estén, sigue solo. Este aviso sale una vez.`,
  );
  if (salio) await almacen.escribir(AVISO_SIN_TEXTOS, new Date().toISOString());
}

// ---------------------------------------------------------------- el tick

type NarradorFila = { id: string; estado: string; libro_aprobado_at: string | null };
type PedidoFila = { id: string; narrador_id: string; estado: string };

/**
 * Del tick: todo lo del libro de historia. Para cada narrador de historia prendido (`ESCRITOR_HISTORIA`) con la
 * entrevista terminada: la Etapa A y sus dudas; con un pedido 'pagado' y el libro cerrado, el libro. Lanza los
 * trabajos en segundo plano (no los espera). Nunca tira.
 */
export async function revisarLibrosHistoria(db: Db, o: { motor?: MotorHistoria; ahora?: number } = {}): Promise<void> {
  try {
    const h = await db.from('historias').select('narrador_id');
    if (h.error) {
      if (esTablaAusente(h.error)) return;
      throw new Error(`no pude leer historias: ${h.error.message}`);
    }
    const ids = ((h.data ?? []) as { narrador_id: string }[]).map((f) => f.narrador_id).filter(escritorHistoriaPrendido);
    if (!ids.length) return;
    const n = await db.from('narradores').select('id, estado, libro_aprobado_at').in('id', ids);
    if (n.error) throw new Error(`no pude leer los narradores de historia: ${n.error.message}`);
    const p = await db.from('pedidos').select('id, narrador_id, estado').in('narrador_id', ids);
    if (p.error) throw new Error(`no pude leer los pedidos de historia: ${p.error.message}`);
    const pedidos = (p.data ?? []) as PedidoFila[];
    for (const narrador of (n.data ?? []) as NarradorFila[]) {
      if (!ESTADOS_TERMINADO.includes(narrador.estado)) continue;
      const suyos = pedidos.filter((x) => x.narrador_id === narrador.id);
      // Un libro ya entregado no se vuelve a escribir (un segundo pedido es un extra: eso es de la web y la imprenta).
      if (suyos.some((x) => x.estado === 'entregado')) continue;
      const pagado = suyos.find((x) => x.estado === 'pagado');
      // Sin pedido pagado o sin el libro cerrado, la Etapa A sola (y sus dudas). Con los dos, el libro, que corre la A
      // adentro si falta: lanzar la A aparte ocuparía la cola y el libro esperaría una vuelta más.
      if (!pagado || !narrador.libro_aprobado_at) {
        await revisarEtapaA(db, narrador.id, o);
        continue;
      }
      const ahora = o.ahora ?? Date.now();
      if (!cola.hayLugar(narrador.id) || ahora < (esperaLibro.get(narrador.id) ?? 0)) continue;
      // Sin los textos de tapa aprobados de su idioma, el libro no se escribe (saldría con la tapa de Familiar). Un aviso.
      if (!(await textosDe(db, narrador.id))) {
        await avisarSinTextos(db, narrador.id);
        // La Etapa A no depende de la tapa: se adelanta (y sus dudas van a los socios) mientras se esperan los textos.
        await revisarEtapaA(db, narrador.id, o);
        continue;
      }
      if (await trabajaOtraCopia(db, narrador.id)) continue;
      const { data: reclamado, error } = await db.from('pedidos').update({ estado: 'generando' }).eq('id', pagado.id).eq('estado', 'pagado').select('id');
      if (error) { console.error(`historia ${narrador.id}: no se pudo reclamar el pedido ${pagado.id}:`, error.message); continue; }
      if (!reclamado || (reclamado as unknown[]).length !== 1) continue;
      const lanzado = cola.lanzar(narrador.id, () => conMarca(db, narrador.id, `libro ${pagado.id}`, () => escribirLibroHistoria(db, pagado, o.motor ?? motorRealHistoria(db))));
      // Sin lugar (no debería pasar: se miró antes), el pedido vuelve a 'pagado' para el próximo tick.
      if (!lanzado) await db.from('pedidos').update({ estado: 'pagado' }).eq('id', pagado.id).eq('estado', 'generando');
    }
  } catch (err) {
    console.error('historia: no pude revisar los libros:', err instanceof Error ? err.message : err);
  }
}

/**
 * ¿Hay un trabajo de historia en marcha con este narrador, en esta copia de la fábrica o en otra? Lo usa el worker
 * para no tomar por huérfano un pedido de historia en 'generando' (lo reclama revisarLibrosHistoria, no el worker).
 */
export async function historiaTrabaja(db: Db, id: string): Promise<boolean> {
  return cola.ocupada(id) || (await trabajaOtraCopia(db, id));
}

/** Para el panel y la imprenta: ¿el libro de historia de este narrador ya está escrito? */
export async function libroHistoriaEscrito(db: Db, id: string): Promise<boolean> {
  return (await listar(db, PREFIJO_HISTORIA(id))).has('libro.md');
}
