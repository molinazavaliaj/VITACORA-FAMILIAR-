// El escritor nuevo (etapas A/B/C) enchufado al worker de la fábrica, para los narradores con entrevista V3
// (fila en `entrevistas_v3`). Los narradores viejos siguen con generarPaquete; el candado (v3/candado.ts)
// sigue cuidando que el camino viejo no toque a uno nuevo.
//
//   1. La entrevista terminó (narradores.estado completado o cerrado_anticipado) → Etapa A en segundo plano:
//      registro, plan y dudas de datos. Hecha = `{id}/escritor/carpeta-A.json`. Si no pasa sus controles,
//      queda `{id}/escritor/fallo-A.json` y se avisa a los socios (no se reintenta sola).
//   2. Las dudas de datos (dudas-familia.json) van por mail a los socios, una vez (`dudas-avisadas.txt`).
//      La pantalla para la familia no existe todavía: si alguien quiere corregir algo, se escribe en
//      `{id}/escritor/correcciones.json` antes de que la dueña cierre el libro (CONTRATO, "Escritor V3").
//   3. Pedido pagado + libro cerrado (libro_aprobado_at) → en segundo plano: A si faltaba, B con las
//      correcciones (sin correcciones no llama a ningún modelo), C, plantilla → libro.html y libro.pdf,
//      «Su voz» (frases.json + pedido de corte) y el pedido a 'entregado'. Si algo falla: 'fallido' y aviso.
//
// Todo lo que se le paga al modelo queda en el almacén del narrador (`{id}/escritor/pasos`, `lotes`):
// si el proceso se corta (Railway reinicia), volver a correr retoma sin pagar de nuevo.
import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cargarConfig } from '../../config.js';
import { anotarUsoEscritor } from '../../costos.js';
import { htmlAPdf } from '../../libro/pdf.js';
import { esTextual, FRASES_POR_CAPITULO, type FrasesJson } from '../../libro/frases.js';
import { publicarFrases } from '../../libro/publicar-frases.js';
import { AlmacenSupabase } from '../almacen/supabase.js';
import type { Almacen } from '../almacen/tipos.js';
import { Carpeta, leerJSON, parseJSONTolerante } from '../carpeta.js';
import { Ejecutor, ErrorJSON, OPCIONES_CLIENTE, TopeDeGasto } from '../ejecutor.js';
import { salida } from '../lectura.js';
import { materialACarpeta, type CorreccionFamilia } from '../material/a-carpeta.js';
import { leerEntrevistaV3, type AudioV3 } from '../material/de-base.js';
import type { FichaParaXml } from '../material/ficha-xml.js';
import { ModeloAnthropic, type ClienteMensajes } from '../modelo/anthropic.js';
import { LoteAnthropic, type ClienteLotes } from '../modelo/lote-anthropic.js';
import { ErrorDelModelo } from '../modelo/tipos.js';
import { cargarSnapshot, type Contexto } from '../orquestador/contexto.js';
import { etapaA, type ResultadoEtapaA } from '../orquestador/etapa-a.js';
import { etapaB } from '../orquestador/etapa-b.js';
import { etapaC } from '../orquestador/etapa-c.js';
import { frasesParaSuVoz, paraPlantilla, type FuenteDeFrase } from '../salida/plantilla.js';
import { avisarSocios } from './avisos.js';
import { Cola } from './cola.js';
import { htmlLibroV3, type NarradorParaLibro } from './html.js';

type Db = SupabaseClient;

export const PREFIJO_ESCRITOR = (narradorId: string): string => `${narradorId}/escritor`;
export const RUTA_LIBRO_MD_V3 = (narradorId: string): string => `${PREFIJO_ESCRITOR(narradorId)}/libro.md`;
export const CARPETA_A = 'carpeta-A.json';
export const FALLO_A = 'fallo-A.json';
export const DUDAS = 'dudas-familia.json';
export const DUDAS_AVISADAS = 'dudas-avisadas.txt';
export const CORRECCIONES = 'correcciones.json';

const RUTA_LIBRO_PDF = (narradorId: string): string => `${narradorId}/paquete/libro.pdf`;
const RUTA_LIBRO_HTML = (narradorId: string): string => `${narradorId}/paquete/libro.html`;

/** Tras un error (no un control que no pasa: eso es fallo-A.json), la Etapa A espera esto antes de reintentar. */
const ESPERA_TRAS_ERROR_MS = 30 * 60 * 1000;
/** Un libro que se corta por un error pasajero (API, red, Storage) vuelve a 'pagado' y se reintenta tras esta espera… */
const ESPERA_LIBRO_MS = 15 * 60 * 1000;
/** …hasta esta cantidad de veces por pedido (en este proceso); después, 'fallido' y aviso. */
const REINTENTOS_LIBRO = 3;

// ---------------------------------------------------------------- el motor (los tests ponen el modelo falso)

export type Motor = {
  /** Un ejecutor por trabajo: la Etapa A y el libro de un pedido no comparten gasto ni tope. */
  ejecutor(a: { almacen: Almacen; narradorId: string; log: (s: string) => void }): { ej: Ejecutor; usarLote: boolean };
  /** De dónde sale el material. Sin esto, de la base (carpetaDeLaBase); los tests ponen una carpeta fija. */
  material?: (db: Db, narradorId: string) => Promise<{ c: Carpeta; audios: AudioV3[] }>;
};

/** Producción: Opus/Haiku por Batch (configuración económica), tope por libro y cada llamada a consumo_ia. */
export function motorReal(db: Db): Motor {
  return {
    ejecutor({ almacen, narradorId, log }) {
      const cliente = new Anthropic({ ...OPCIONES_CLIENTE, apiKey: cargarConfig().anthropicApiKey });
      const tope = Number(process.env.ESCRITOR_TOPE_USD ?? 15);
      const ej = new Ejecutor({
        modelo: new ModeloAnthropic(cliente as unknown as ClienteMensajes),
        lote: new LoteAnthropic(cliente as unknown as ClienteLotes, almacen, { log }),
        todoPorLote: true,
        almacen,
        topeUsd: Number.isFinite(tope) && tope > 0 ? tope : 15,
        log,
        alAnotar: (fila) => anotarUsoEscritor(db, narradorId, fila),
      });
      return { ej, usarLote: true };
    },
  };
}

// ---------------------------------------------------------------- el material

type Contexto_ = { anioNacimiento?: unknown; lugarNacimiento?: unknown; dondeVive?: unknown; arbol?: unknown };
const texto = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/**
 * La ficha del libro: la de la entrevista (nombre, género, trato, idioma) más lo que la familia cargó al
 * registrarse (narradores.contexto): año, lugar de nacimiento, dónde vive y el árbol en texto libre.
 * `datosExtra` NO va: son impresiones de la familia, no palabras de quien narra.
 */
export function fichaParaLibro(ficha: FichaParaXml, contexto: unknown): FichaParaXml {
  const c = (contexto ?? {}) as Contexto_;
  const arbol = (c.arbol && typeof c.arbol === 'object' ? c.arbol : {}) as Record<string, unknown>;
  const anio = typeof c.anioNacimiento === 'number' ? c.anioNacimiento : Number.parseInt(String(c.anioNacimiento ?? ''), 10);
  const arbolTexto = { padres: texto(arbol.padres), hermanos: texto(arbol.hermanos), conyuge: texto(arbol.conyuge), hijos: texto(arbol.hijos) };
  return {
    ...ficha,
    ...(Number.isInteger(anio) && anio > 1880 ? { anioNacimiento: anio } : {}),
    ...(texto(c.lugarNacimiento) ? { lugarNacimiento: texto(c.lugarNacimiento) } : {}),
    ...(texto(c.dondeVive) ? { paisResidencia: texto(c.dondeVive) } : {}),
    ...(Object.values(arbolTexto).some(Boolean) ? { arbolTexto } : {}),
  };
}

export class SinMaterial extends Error {
  constructor(narradorId: string) {
    super(`${narradorId}: la entrevista V3 no tiene ninguna respuesta que cuente para el libro`);
    this.name = 'SinMaterial';
  }
}

/** La carpeta del escritor con entradas/ armadas desde la base. Los audios vuelven aparte (para «Su voz»). */
export async function carpetaDeLaBase(db: Db, narradorId: string): Promise<{ c: Carpeta; audios: AudioV3[] }> {
  const e = await leerEntrevistaV3(db, narradorId);
  if (!e) throw new Error(`${narradorId} no tiene fila en entrevistas_v3`);
  const { data, error } = await db.from('narradores').select('contexto').eq('id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer el contexto de ${narradorId}: ${error.message}`);
  const c = new Carpeta();
  const r = materialACarpeta(c, { estado: { ...e, ficha: fichaParaLibro(e.ficha as FichaParaXml, (data as { contexto?: unknown } | null)?.contexto) }, confirmadoNarrador: [] });
  if (!r.filas.some((f) => !f.paso)) throw new SinMaterial(narradorId);
  return { c, audios: e.audios };
}

// ---------------------------------------------------------------- Etapa A (al terminar la entrevista)

function armarContexto(db: Db, narradorId: string, motor: Motor, c: Carpeta): Contexto {
  const almacen = new AlmacenSupabase(db, PREFIJO_ESCRITOR(narradorId));
  const log = (s: string): void => console.log(`escritor ${narradorId}: ${s}`);
  const { ej, usarLote } = motor.ejecutor({ almacen, narradorId, log });
  return { c, ej, almacen, log, usarLote };
}

/** Corre la Etapa A. Un control que no pasa (o el tope, o sin material) deja fallo-A.json y avisa; un error de la API tira. */
export async function correrEtapaAV3(db: Db, narradorId: string, motor: Motor = motorReal(db)): Promise<ResultadoEtapaA> {
  const almacen = new AlmacenSupabase(db, PREFIJO_ESCRITOR(narradorId));
  let r: ResultadoEtapaA;
  try {
    const { c } = await (motor.material ?? carpetaDeLaBase)(db, narradorId);
    r = await etapaA(armarContexto(db, narradorId, motor, c));
  } catch (err) {
    if (!(err instanceof TopeDeGasto) && !(err instanceof SinMaterial)) throw err;
    r = { ok: false, motivo: err.message };
  }
  if (!r.ok) {
    await almacen.escribir(FALLO_A, JSON.stringify({ motivo: r.motivo, fecha: new Date().toISOString() }, null, 1));
    await avisarSocios(
      `La Etapa A de ${narradorId} no salió`,
      `${r.motivo}\n\nNo se reintenta sola. Lo que se pagó quedó en ${PREFIJO_ESCRITOR(narradorId)}/ (pasos/, costos.json). Para reintentar, borrar ${PREFIJO_ESCRITOR(narradorId)}/${FALLO_A}; si la familia ya cerró el libro y pagó, el pedido la corre igual antes de escribir.`,
    );
  }
  return r;
}

/** Lo que el worker comparte entre ticks: la cola y cuándo falló por última vez cada Etapa A. */
const maximoEnParalelo = (): number => Math.max(1, Number(process.env.ESCRITOR_LIBROS_EN_PARALELO ?? 3) || 3);
const cola = new Cola(maximoEnParalelo);
const ultimoErrorA = new Map<string, number>();
/** Narrador → hasta cuándo espera su libro tras un error pasajero; pedido → cuántos errores pasajeros lleva. */
const esperaLibro = new Map<string, number>();
const erroresLibro = new Map<string, number>();

/**
 * Una Etapa A (que se paga antes de que haya pedido) nunca ocupa el último lugar de la cola: queda para un
 * libro pagado. Con un solo lugar no se reserva nada.
 */
const hayLugarParaEtapaA = (narradorId: string): boolean =>
  cola.hayLugar(narradorId) && (maximoEnParalelo() <= 1 || cola.cuantos < maximoEnParalelo() - 1);

export const colaDelEscritor = cola;

/** Los nombres de lo que hay en `{id}/escritor/` (sin subcarpetas). Tira si Storage no responde. */
async function listarEscritor(db: Db, narradorId: string): Promise<Set<string>> {
  const { data, error } = await db.storage.from('audios').list(PREFIJO_ESCRITOR(narradorId));
  if (error) throw new Error(`No se pudo listar ${PREFIJO_ESCRITOR(narradorId)}: ${error.message}`);
  return new Set(((data ?? []) as { name: string }[]).map((a) => a.name));
}

/**
 * Del tick, para un narrador V3 con la entrevista terminada: lanza la Etapa A si falta (y no falló, ni
 * está corriendo, ni falló por un error hace menos de media hora) y avisa las dudas cuando ya está.
 * No espera a la etapa. Nunca tira.
 */
export async function revisarEtapaAV3(db: Db, narradorId: string, o: { motor?: Motor; ahora?: number } = {}): Promise<void> {
  try {
    const archivos = await listarEscritor(db, narradorId);
    if (archivos.has(CARPETA_A)) {
      if (!archivos.has(DUDAS_AVISADAS)) await avisarDudas(db, narradorId, archivos);
      return;
    }
    if (archivos.has(FALLO_A) || !hayLugarParaEtapaA(narradorId)) return;
    const ahora = o.ahora ?? Date.now();
    if (ahora - (ultimoErrorA.get(narradorId) ?? -Infinity) < ESPERA_TRAS_ERROR_MS) return;
    cola.lanzar(narradorId, async () => {
      try {
        const r = await correrEtapaAV3(db, narradorId, o.motor ?? motorReal(db));
        ultimoErrorA.delete(narradorId);
        console.log(`escritor ${narradorId}: Etapa A ${r.ok ? `lista (${r.capitulos} capítulos, ${r.dudas.length} dudas)` : `no salió: ${r.motivo}`}`);
      } catch (err) {
        ultimoErrorA.set(narradorId, Date.now());
        throw err;
      }
    });
  } catch (err) {
    console.error(`escritor ${narradorId}: no pude revisar la Etapa A:`, err instanceof Error ? err.message : err);
  }
}

type DudaGuardada = { id: string; pregunta: string; opciones: string[]; que: string; citas: { id: string; texto: string }[] };

async function avisarDudas(db: Db, narradorId: string, archivos: Set<string>): Promise<void> {
  const almacen = new AlmacenSupabase(db, PREFIJO_ESCRITOR(narradorId));
  const t = archivos.has(DUDAS) ? await almacen.leer(DUDAS) : null;
  const dudas = (t ? (JSON.parse(t) as { dudas?: DudaGuardada[] }).dudas : []) ?? [];
  if (dudas.length) {
    const lineas = dudas.map((d) => [
      `${d.id}. ${d.pregunta}${d.opciones.length ? ` (opciones: ${d.opciones.join(' / ')})` : ''}`,
      `   Qué vio el lector: ${d.que}`,
      ...d.citas.map((c) => `   ${c.id}: «${c.texto.length > 300 ? `${c.texto.slice(0, 300)}…` : c.texto}»`),
    ].join('\n'));
    const salio = await avisarSocios(
      `Dudas de datos del libro de ${narradorId} (${dudas.length})`,
      `La Etapa A terminó y encontró estas dudas de datos. La familia no las ve (la pantalla no existe todavía).\n\n${lineas.join('\n\n')}\n\nSi hay que corregir algo, se escribe en ${PREFIJO_ESCRITOR(narradorId)}/${CORRECCIONES} ANTES de que la dueña cierre el libro:\n{"correcciones": [{"dudaId": "D01", "texto": "La Negra se llamaba Ofelia."}]}\nSin ese archivo, el libro se escribe sin correcciones.`,
    );
    if (!salio) return;
  }
  await almacen.escribir(DUDAS_AVISADAS, new Date().toISOString());
}

// ---------------------------------------------------------------- el libro (pedido pagado y libro cerrado)

/** Las correcciones (CONTRATO, "Escritor V3"). Sin archivo, ninguna. Roto: tira (un libro sin las correcciones pedidas está mal). */
export async function leerCorrecciones(almacen: Almacen): Promise<CorreccionFamilia[]> {
  const t = await almacen.leer(CORRECCIONES);
  if (t === null) return [];
  let j: { correcciones?: unknown } | unknown[];
  try {
    j = parseJSONTolerante(t) as { correcciones?: unknown } | unknown[];
  } catch (err) {
    throw new FalloDelEscritor(`${CORRECCIONES} no es un JSON válido: ${(err as Error).message}`);
  }
  const lista = Array.isArray(j) ? j : (j as { correcciones?: unknown }).correcciones;
  if (!Array.isArray(lista)) throw new FalloDelEscritor(`${CORRECCIONES} no tiene la lista "correcciones"`);
  return lista.map((x, i) => {
    const k = x as { texto?: unknown; dudaId?: unknown };
    if (typeof k?.texto !== 'string') throw new FalloDelEscritor(`${CORRECCIONES}: la corrección ${i + 1} no tiene "texto"`);
    return { texto: k.texto, ...(typeof k.dudaId === 'string' ? { dudaId: k.dudaId } : {}) };
  });
}

/** Las claves de la entrevista que cuentan para una fila R..: la suya, su segunda oportunidad (X~2) y su repregunta (RP~X). */
const esDeLaClave = (clave: string, pid: string): boolean => clave === pid || clave === `RP~${pid}` || clave.replace(/~\d+$/, '') === pid;

/**
 * R.. → la fila de `respuestas` de la que el worker de audio corta la frase: la de esa pregunta, con audio
 * publicable, que la dice tal cual. Si ninguna la dice tal cual, la frase va sin audio (respuesta null).
 */
export function fuentesDeFrases(c: Carpeta, audios: AudioV3[]): Record<string, FuenteDeFrase> {
  const etiquetas = c.existe('entradas/etiquetas.json') ? (JSON.parse(c.leer('entradas/etiquetas.json')) as { id: string; preguntaId: string }[]) : [];
  const pidDe = new Map(etiquetas.map((e) => [e.id, e.preguntaId]));
  const frases: { id: string; texto: string }[] = leerJSON(c, salida('sus_frases.json')).frases || [];
  const out: Record<string, FuenteDeFrase> = {};
  for (const f of frases) {
    const pid = pidDe.get(f.id);
    const audio = pid ? audios.find((a) => a.audioPath && a.transcripcion && esDeLaClave(a.clave, pid) && esTextual(String(f.texto), [a.transcripcion])) : undefined;
    out[f.id] = { respuestaId: audio?.respuestaId ?? null, preguntaOrden: 0 };
  }
  return out;
}

export class FalloDelEscritor extends Error {
  constructor(m: string) {
    super(m);
    this.name = 'FalloDelEscritor';
  }
}

/**
 * El libro entero de un pedido ya reclamado ('generando'). Deja el pedido en 'entregado'. Ante un error pasajero
 * lo devuelve a 'pagado' (se reintenta a los 15 minutos, hasta 3 veces por proceso); ante uno definitivo, o pasados
 * esos reintentos, 'fallido' con aviso a los socios. Nunca tira. Un 'fallido' se reintenta volviéndolo a 'pagado'
 * a mano: retoma de los checkpoints.
 */
export async function escribirLibroV3(db: Db, pedido: { id: string; narrador_id: string }, motor: Motor = motorReal(db)): Promise<void> {
  const narradorId = pedido.narrador_id;
  try {
    const desdeBase = await (motor.material ?? carpetaDeLaBase)(db, narradorId);
    const almacen = new AlmacenSupabase(db, PREFIJO_ESCRITOR(narradorId));
    let snapA = await cargarSnapshot(almacen, 'A');
    // Si el material cambió desde la Etapa A (una reserva pedida después, una respuesta transcripta tarde, la ficha
    // que la familia corrigió), la A se rehace con el de hoy: lo reservado no puede salir impreso.
    if (snapA && !mismasEntradas(snapA, desdeBase.c)) {
      console.log(`escritor ${narradorId}: el material cambió desde la Etapa A; se rehace con el de hoy`);
      snapA = null;
    }
    const x = armarContexto(db, narradorId, motor, snapA ?? desdeBase.c);
    if (!snapA) {
      const a = await etapaA(x);
      if (!a.ok) throw new FalloDelEscritor(`Etapa A: ${a.motivo}`);
    }
    const b = await etapaB(x, await leerCorrecciones(almacen));
    if (!b.ok) throw new FalloDelEscritor(`Etapa B: ${b.motivo}`);
    const r = await etapaC(x);
    x.log(`libro escrito: ${r.capitulos} capítulos, ${r.controlesFinal}, USD ${r.usd.toFixed(2)}`);

    // La plantilla y el PDF (el lector online carga libro.html; la familia descarga libro.pdf).
    const { data: n, error } = await db.from('narradores').select('id, nombre, contexto, foto_url, edicion').eq('id', narradorId).maybeSingle();
    if (error || !n) throw new Error(`No se pudo leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
    const html = await htmlLibroV3(db, { narrador: n as NarradorParaLibro, libroMd: x.c.leer('libro.md'), idioma: paraPlantilla(x.c).idioma });
    await subir(db, RUTA_LIBRO_HTML(narradorId), html, 'text/html; charset=utf-8');
    await subir(db, RUTA_LIBRO_PDF(narradorId), await htmlAPdf(html), 'application/pdf');

    // «Su voz»: no frena la entrega (como en el libro viejo). Sin frases, el panel no muestra nada que cortar.
    try {
      const frases = soloConAudio(frasesParaSuVoz(x.c, { narradorId, pedidoId: pedido.id, fuentes: fuentesDeFrases(x.c, desdeBase.audios) }));
      await publicarFrases(db, frases);
    } catch (err) {
      x.log(`«Su voz» no salió (el libro se entrega igual): ${err instanceof Error ? err.message : err}`);
    }

    const { error: errorUpdate } = await db
      .from('pedidos')
      .update({ estado: 'entregado', libro_pdf_path: RUTA_LIBRO_PDF(narradorId), audiolibro_paths: null })
      .eq('id', pedido.id);
    if (errorUpdate) throw new Error(`No se pudo dejar entregado el pedido ${pedido.id}: ${errorUpdate.message}`);
    erroresLibro.delete(pedido.id);
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error(`escritor ${narradorId}: el libro del pedido ${pedido.id} falló:`, motivo);
    const veces = (erroresLibro.get(pedido.id) ?? 0) + 1;
    if (!esDefinitivo(err) && veces <= REINTENTOS_LIBRO) {
      // Pasajero (API, red, Storage): vuelve a 'pagado' y se reintenta en un rato; retoma sin repagar.
      erroresLibro.set(pedido.id, veces);
      esperaLibro.set(narradorId, Date.now() + ESPERA_LIBRO_MS);
      const { error: errorVuelta } = await db.from('pedidos').update({ estado: 'pagado' }).eq('id', pedido.id).eq('estado', 'generando');
      if (errorVuelta) console.error(`escritor ${narradorId}: no se pudo devolver a 'pagado' el pedido ${pedido.id}:`, errorVuelta.message);
      console.warn(`escritor ${narradorId}: error pasajero ${veces} de ${REINTENTOS_LIBRO}; se reintenta en ${ESPERA_LIBRO_MS / 60_000} minutos`);
      return;
    }
    erroresLibro.delete(pedido.id);
    const { error } = await db.from('pedidos').update({ estado: 'fallido' }).eq('id', pedido.id);
    if (error) console.error(`escritor ${narradorId}: no se pudo marcar 'fallido' el pedido ${pedido.id}:`, error.message);
    await avisarSocios(
      `El libro de ${narradorId} no salió (pedido ${pedido.id})`,
      `${motivo}\n\nEl pedido quedó 'fallido'. Lo pagado al modelo quedó en ${PREFIJO_ESCRITOR(narradorId)}/: para reintentar, volver el pedido a 'pagado' (retoma sin repagar).`,
    );
  }
}

/** Un error que reintentar no arregla: un control que no pasa, el tope, sin material, un JSON roto, un rechazo del modelo. */
function esDefinitivo(err: unknown): boolean {
  return err instanceof FalloDelEscritor || err instanceof TopeDeGasto || err instanceof SinMaterial || err instanceof ErrorJSON || (err instanceof ErrorDelModelo && !err.reintentable);
}

/** Las entradas de dos carpetas (respuestas, etiquetas, ficha), iguales. */
function mismasEntradas(a: Carpeta, b: Carpeta): boolean {
  const de = (c: Carpeta): string => JSON.stringify(Object.entries(c.aObjeto()).filter(([k]) => k.startsWith('entradas/')));
  return de(a) === de(b);
}

/**
 * «Su voz» solo con frases que tienen de dónde cortarse: una frase sin respuesta no suena nunca, y elegida dejaría
 * el panel "preparando" para siempre. En cada capítulo se eligen las primeras con audio.
 */
export function soloConAudio(f: FrasesJson): FrasesJson {
  const capitulos = f.capitulos
    .map((c) => {
      const conAudio = c.candidatas.filter((k) => k.respuesta_id);
      return { ...c, candidatas: conAudio.map((k, i) => ({ ...k, elegida: i < FRASES_POR_CAPITULO })) };
    })
    .filter((c) => c.candidatas.length > 0);
  return { ...f, capitulos };
}

async function subir(db: Db, ruta: string, cuerpo: string | Uint8Array | Buffer, tipo: string): Promise<void> {
  const { error } = await db.storage.from('audios').upload(ruta, cuerpo, { contentType: tipo, upsert: true });
  if (error) throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
}

/**
 * Del tick: ¿hay lugar para un libro de este narrador? (Se pregunta ANTES de reclamar el pedido: un pedido
 * reclamado sin trabajo en marcha quedaría huérfano.)
 */
export const hayLugarParaLibroV3 = (narradorId: string, ahora: number = Date.now()): boolean =>
  cola.hayLugar(narradorId) && ahora >= (esperaLibro.get(narradorId) ?? 0);

/**
 * Del tick, con el pedido ya reclamado: lanza el libro en segundo plano. `alTerminar` corre siempre al final
 * (el worker saca el pedido de los reclamados). Devuelve false si no se pudo lanzar (el worker lo devuelve).
 */
export function lanzarLibroV3(db: Db, pedido: { id: string; narrador_id: string }, alTerminar: () => void, motor?: Motor): boolean {
  return cola.lanzar(pedido.narrador_id, async () => {
    try {
      await escribirLibroV3(db, pedido, motor ?? motorReal(db));
    } finally {
      alTerminar();
    }
  });
}

// ---------------------------------------------------------------- alerta: un libro que no sale

/** Un libro tarda de 4 a 9 horas por Batch: a las 24 horas del cierre sin entregar, algo se trabó. */
export const DEMORA_ALERTA_MS = 24 * 60 * 60 * 1000;
export const ALERTA_DEMORADO = 'alerta-libro-demorado.txt';

/**
 * Del tick: un narrador V3 con el libro cerrado hace más de 24 horas y sin ningún pedido entregado (el suyo en
 * 'pagado', 'generando' o 'fallido') → un mail a los socios, una sola vez por narrador. Cubre lo que no avisa
 * solo: un trabajo colgado, un proceso que murió y no volvió, una cola que no se libera. Nunca tira.
 */
export async function alertarLibrosDemorados(db: Db, v3: Set<string>, ahora: number = Date.now()): Promise<void> {
  try {
    const { data: pedidos, error } = await db.from('pedidos').select('id, narrador_id, estado').in('estado', ['pagado', 'generando', 'fallido', 'entregado']);
    if (error) throw new Error(`no pude leer los pedidos: ${error.message}`);
    const lista = (pedidos ?? []) as { id: string; narrador_id: string; estado: string }[];
    const entregados = new Set(lista.filter((p) => p.estado === 'entregado').map((p) => p.narrador_id));
    const pendientes = new Map<string, { id: string; estado: string }>();
    for (const p of lista) if (p.estado !== 'entregado' && v3.has(p.narrador_id) && !entregados.has(p.narrador_id)) pendientes.set(p.narrador_id, p);
    if (!pendientes.size) return;
    const { data: narradores, error: errorN } = await db.from('narradores').select('id, libro_aprobado_at').in('id', [...pendientes.keys()]);
    if (errorN) throw new Error(`no pude leer los narradores: ${errorN.message}`);
    for (const n of (narradores ?? []) as { id: string; libro_aprobado_at: string | null }[]) {
      const cerrado = n.libro_aprobado_at ? new Date(n.libro_aprobado_at).getTime() : NaN;
      if (!Number.isFinite(cerrado) || ahora - cerrado < DEMORA_ALERTA_MS) continue;
      const almacen = new AlmacenSupabase(db, PREFIJO_ESCRITOR(n.id));
      if ((await almacen.leer(ALERTA_DEMORADO)) !== null) continue;
      const p = pendientes.get(n.id)!;
      const horas = Math.floor((ahora - cerrado) / 3_600_000);
      const salio = await avisarSocios(
        `El libro de ${n.id} lleva ${horas} horas sin salir`,
        `La familia cerró el libro hace ${horas} horas y todavía no se entregó (un libro tarda de 4 a 9 horas). Pedido ${p.id}, estado '${p.estado}'.\n\n` +
          `Qué mirar: los logs de la fábrica en Railway (buscar "escritor ${n.id}"), ${PREFIJO_ESCRITOR(n.id)}/costos.json (si sigue sumando, está trabajando) y ${PREFIJO_ESCRITOR(n.id)}/lotes/ (los lotes de Batch que espera). ` +
          `Si quedó 'fallido', volverlo a 'pagado' retoma sin repagar. Este aviso sale una sola vez.`,
      );
      if (salio) await almacen.escribir(ALERTA_DEMORADO, new Date(ahora).toISOString());
    }
  } catch (err) {
    console.error('escritor: no pude revisar los libros demorados:', err instanceof Error ? err.message : err);
  }
}
