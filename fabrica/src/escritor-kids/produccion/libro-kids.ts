// El libro de Vitácora Kids enchufado al worker de la fábrica (decisiones 6 a 9 de
// docs/kids/v2/libro-decisiones-2026-10-15.md; CONTRATO, «El libro de Kids en la fábrica»). Corre la receta de
// escritor-kids/orquestador.ts sobre la misma máquina del escritor de la casa (Ejecutor con Batch y tope,
// checkpoints en Storage, consumo_ia, la Cola en segundo plano).
//
//   1. Terminó de contar (kids_v2.termino_at y narrador `completado`) → Etapa A en segundo plano, una vez
//      (candado `real/carpeta-A.json`). Si marca algo preocupante: `real/frenado.json` + mail a los socios, y nada
//      más hasta que Naza suba `real/liberado.json` a mano. Si A no sale: `fallo-A.json` + aviso (no se reintenta).
//   2. Sin freno (o liberado) y con el pedido Kids `pagado` → B, C y el armado en segundo plano. Sube a `paquete/`
//      libro.pdf, sobre.pdf, libro.html y frases.json («Su voz»), y escribe `listo.json` = el libro está para que lo
//      revise el padre. El pedido sigue `pagado`.
//   3. Con listo.json → mail al padre (una vez) de que el libro está en su panel para revisar.
//   4. El padre lo aprueba (la web pone narradores.libro_aprobado_at) → cada pedido `pagado` del chico pasa a
//      `entregado` (CAS) y sale el mail «libro listo» de Kids (una vez). La imprenta lo toma por entregas.ts.
//   5. A los 14 días de listo.json sin aprobar → un aviso a los socios (una vez). La fábrica nunca aprueba sola.
//
// Rutas (bucket `audios`): `{id}/escritor-kids/real/` es el almacén del escritor (pasos/, lotes/, costos.json,
// carpeta-A/B/C.json, frenado.json, liberado.json, libro.md, sobre.md, informe.md); en `{id}/escritor-kids/` van
// los candados y avisos de este módulo. «real» a propósito: lo de las pruebas con el modelo falso nunca se mezcla.
import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { vigilarClave } from '../../alarma-anthropic.js';
import { cargarConfig } from '../../config.js';
import { anotarUsoEscritorKids } from '../../costos.js';
import type { FrasesJson } from '../../libro/frases.js';
import { htmlAPdf } from '../../libro/pdf.js';
import { RUTA_FRASES_JSON } from '../../libro/publicar-frases.js';
import { urlFraseDeVoz, urlVozDeNarrador } from '../../libro/token-voz.js';
import { AlmacenSupabase } from '../../escritor/almacen/supabase.js';
import type { Almacen } from '../../escritor/almacen/tipos.js';
import type { Carpeta } from '../../escritor/carpeta.js';
import { Ejecutor, ErrorJSON, OPCIONES_CLIENTE, TopeDeGasto } from '../../escritor/ejecutor.js';
import { ModeloAnthropic, type ClienteMensajes } from '../../escritor/modelo/anthropic.js';
import { LoteAnthropic, type ClienteLotes } from '../../escritor/modelo/lote-anthropic.js';
import { ErrorDelModelo } from '../../escritor/modelo/tipos.js';
import { cargarSnapshot } from '../../escritor/orquestador/contexto.js';
import { avisarSocios } from '../../escritor/produccion/avisos.js';
import { Cola } from '../../escritor/produccion/cola.js';
import { suVozValida } from '../controles.js';
import type { SalidaLectura } from '../llamadas.js';
import { carpetaDeFilas, materialDe, salidaKids } from '../material/carpeta.js';
import { leerFilasKids } from '../material/de-base-kids.js';
import { correrKids, etapaAKids, RUTA_FRENADO, RUTA_LIBERADO, salidasDe, type ContextoKids } from '../orquestador.js';
import { fuenteDeStorage, type FuenteFotos } from '../salida/fotos.js';
import { armarLibro, type LibroKids } from '../salida/libro-md.js';
import { pdfsKids } from '../salida/pdf.js';
import { enviarMailKids } from './mails.js';

type Db = SupabaseClient;

// ---------------------------------------------------------------- rutas

export const PREFIJO_KIDS = (id: string): string => `${id}/escritor-kids`;
/** El almacén del escritor (checkpoints, frenado.json, liberado.json, libro.md, informe.md). */
export const PREFIJO_KIDS_REAL = (id: string): string => `${PREFIJO_KIDS(id)}/real`;
export const RUTA_LIBRO_PDF_KIDS = (id: string): string => `${id}/paquete/libro.pdf`;
export const RUTA_SOBRE_PDF_KIDS = (id: string): string => `${id}/paquete/sobre.pdf`;
export const RUTA_LIBRO_HTML_KIDS = (id: string): string => `${id}/paquete/libro.html`;

/** En `{id}/escritor-kids/`. */
export const LISTO = 'listo.json';
export const FALLO_A = 'fallo-A.json';
export const FALLO_LIBRO = 'fallo-libro.json';
export const FRENADO_AVISADO = 'frenado-avisado.txt';
export const MAIL_REVISAR = 'mail-revisar.txt';
export const AVISO_14_DIAS = 'aviso-14-dias.txt';
export const MAIL_LIBRO_LISTO = 'mail-libro-listo.txt';
export const TRABAJANDO = 'trabajando.json';
/** En `{id}/escritor-kids/real/` (los escribe el orquestador; liberado.json, Naza a mano). */
export const CARPETA_A = 'carpeta-A.json';
export { RUTA_FRENADO as FRENADO, RUTA_LIBERADO as LIBERADO };

export type Listo = { at: string; paginas: number; sobrePaginas: number };

const MS_DIA = 24 * 60 * 60 * 1000;
/** Decisión 9: si en 14 días el padre no aprobó el libro, se avisa a Naza. */
export const DIAS_SIN_APROBAR = 14;
const ESPERA_TRAS_ERROR_MS = 30 * 60 * 1000;
const ESPERA_LIBRO_MS = 15 * 60 * 1000;
const REINTENTOS_LIBRO = 3;

// ---------------------------------------------------------------- el motor (los tests ponen el modelo falso)

export type MotorKids = {
  ejecutor(a: { almacen: Almacen; narradorId: string; log: (s: string) => void }): { ej: Ejecutor; usarLote: boolean };
  /** El material (la carpeta con entradas/) y de dónde salen las fotos del álbum. */
  material(db: Db, narradorId: string): Promise<{ c: Carpeta; fotos: FuenteFotos }>;
  /** HTML → PDF (Playwright en producción). */
  aPdf?: (html: string) => Promise<Buffer>;
};

export class SinMaterialKids extends Error {
  constructor(id: string) { super(`${id}: no hay fila de kids_v2 o no tiene ninguna respuesta`); this.name = 'SinMaterialKids'; }
}
export class FalloDelLibroKids extends Error {
  constructor(m: string) { super(m); this.name = 'FalloDelLibroKids'; }
}

/** Tope por trabajo: `ESCRITOR_KIDS_TOPE_USD` (8 por defecto). */
export function topeKids(): number {
  const t = Number(process.env.ESCRITOR_KIDS_TOPE_USD ?? 8);
  return Number.isFinite(t) && t > 0 ? t : 8;
}

/** Producción: Opus por Batch, tope por trabajo, cada llamada a consumo_ia (`escritor-kids-A/B/C`). */
export function motorRealKids(db: Db): MotorKids {
  return {
    ejecutor({ almacen, narradorId, log }) {
      const cliente = vigilarClave(new Anthropic({ ...OPCIONES_CLIENTE, apiKey: cargarConfig().anthropicApiKey }), 'el escritor de Kids');
      const ej = new Ejecutor({
        modelo: new ModeloAnthropic(cliente as unknown as ClienteMensajes),
        lote: new LoteAnthropic(cliente as unknown as ClienteLotes, almacen, { log }),
        todoPorLote: true,
        almacen,
        topeUsd: topeKids(),
        log,
        alAnotar: (fila) => anotarUsoEscritorKids(db, narradorId, fila),
      });
      return { ej, usarLote: true };
    },
    async material(db_, id) {
      const f = await leerFilasKids(db_, id);
      if (!f || !f.respuestas.length) throw new SinMaterialKids(id);
      return { c: carpetaDeFilas(f), fotos: fuenteDeStorage(db_) };
    },
  };
}

// ---------------------------------------------------------------- ayudas de Storage

async function listar(db: Db, ruta: string): Promise<Set<string>> {
  const { data, error } = await db.storage.from('audios').list(ruta);
  if (error) throw new Error(`No se pudo listar ${ruta}: ${error.message}`);
  return new Set(((data ?? []) as { name: string }[]).map((a) => a.name));
}

async function subir(db: Db, ruta: string, cuerpo: string | Buffer, tipo: string): Promise<void> {
  const { error } = await db.storage.from('audios').upload(ruta, cuerpo, { contentType: tipo, upsert: true, cacheControl: '0' });
  if (error) throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
}

const almacenKids = (db: Db, id: string): AlmacenSupabase => new AlmacenSupabase(db, PREFIJO_KIDS(id));
const almacenReal = (db: Db, id: string): AlmacenSupabase => new AlmacenSupabase(db, PREFIJO_KIDS_REAL(id));

/** Cuántas páginas tiene un PDF de Chromium (cuenta los objetos /Type /Page; aproximado, para el panel). */
export function contarPaginas(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;
}

async function quienEs(db: Db, id: string): Promise<string> {
  try {
    const { data } = await db.from('narradores').select('como_le_dicen').eq('id', id).maybeSingle();
    const n = (data as { como_le_dicen?: string } | null)?.como_le_dicen?.trim();
    return n ? `${n} (${id})` : id;
  } catch {
    return id;
  }
}

// ---------------------------------------------------------------- dos copias de la fábrica a la vez
// Como el escritor de la casa (libro-v3.ts, conMarca): mientras trabaja, `{id}/escritor-kids/trabajando.json` se
// renueva cada minuto; otra copia no toca a ese chico mientras la marca tenga menos de 10 minutos.

const PROCESO = randomUUID();
const MARCA_VIGENTE_MS = 10 * 60 * 1000;

async function conMarca<T>(db: Db, id: string, que: string, f: () => Promise<T>): Promise<T> {
  const a = almacenKids(db, id);
  const marcar = (latido: string): Promise<void> => a.escribir(TRABAJANDO, JSON.stringify({ proceso: PROCESO, que, latido })).catch((err) => {
    console.error(`kids ${id}: no pude dejar la marca de trabajo:`, err instanceof Error ? err.message : err);
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

async function trabajaOtraCopia(db: Db, id: string, ahora: number): Promise<boolean> {
  try {
    const t = await almacenKids(db, id).leer(TRABAJANDO);
    if (t === null) return false;
    const m = JSON.parse(t) as { proceso?: string; latido?: string };
    return m.proceso !== PROCESO && ahora - Date.parse(m.latido ?? '') < MARCA_VIGENTE_MS;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- la cola (propia: los libros de Kids no le quitan lugar a los de la casa)

const cola = new Cola(() => Math.max(1, Number(process.env.ESCRITOR_LIBROS_EN_PARALELO ?? 3) || 3));
export const colaKids = cola;
const ultimoErrorA = new Map<string, number>();
const esperaLibro = new Map<string, number>();
const erroresLibro = new Map<string, number>();

// ---------------------------------------------------------------- el contexto del escritor

function contexto(db: Db, id: string, motor: MotorKids, c: Carpeta): ContextoKids {
  const almacen = almacenReal(db, id);
  const log = (s: string): void => console.log(`kids ${id}: ${s}`);
  const { ej, usarLote } = motor.ejecutor({ almacen, narradorId: id, log });
  return {
    c, ej, almacen, log, usarLote,
    // El orquestador llama una sola vez, al escribir frenado.json. Si el mail no sale, el tick lo reintenta
    // (sin FRENADO_AVISADO).
    avisar: async (asunto, texto) => {
      if (await avisarSocios(asunto, textoFrenadoConRuta(id, texto))) await almacenKids(db, id).escribir(FRENADO_AVISADO, new Date().toISOString());
    },
  };
}

const textoFrenadoConRuta = (id: string, texto: string): string =>
  `${texto}\n\nPara liberarlo, subir a mano ${PREFIJO_KIDS_REAL(id)}/${RUTA_LIBERADO} (por ejemplo {"por": "Naza", "at": "2026-10-16", "nota": "lo hablé con la familia"}). Mientras no esté, el libro no se escribe.`;

/** Las entradas de dos carpetas (material y ficha), iguales. */
function mismasEntradas(a: Carpeta, b: Carpeta): boolean {
  const de = (c: Carpeta): string => JSON.stringify(Object.entries(c.aObjeto()).filter(([k]) => k.startsWith('entradas/')));
  return de(a) === de(b);
}

// ---------------------------------------------------------------- Etapa A

/** Corre la Etapa A de Kids. Si no sale (un control, el tope, sin material): fallo-A.json y aviso. Un error de la API tira. */
export async function correrEtapaAKids(db: Db, id: string, motor: MotorKids = motorRealKids(db)): Promise<'lista' | 'frenada' | 'fallo'> {
  let motivo: string;
  try {
    const { c } = await motor.material(db, id);
    const a = await etapaAKids(contexto(db, id, motor, c));
    if (a.ok) return a.frenado ? 'frenada' : 'lista';
    motivo = a.motivo;
  } catch (err) {
    if (!(err instanceof TopeDeGasto) && !(err instanceof SinMaterialKids)) throw err;
    motivo = err.message;
  }
  await almacenKids(db, id).escribir(FALLO_A, JSON.stringify({ motivo, fecha: new Date().toISOString() }, null, 1));
  await avisarSocios(
    `La lectura del libro de Kids de ${await quienEs(db, id)} no salió`,
    `${motivo}\n\nNo se reintenta sola. Para reintentar, borrar ${PREFIJO_KIDS(id)}/${FALLO_A}; si hay un pedido pagado, el libro la corre igual antes de escribir.`,
  );
  return 'fallo';
}

// ---------------------------------------------------------------- el libro

/** «Su voz» de Kids en el frases.json de siempre: cada respuesta elegida, entera, con su audio real (sin corte). */
export function frasesKids(libro: LibroKids, narradorId: string, pedidoId: string, ahora: string): FrasesJson {
  const porParte = new Map<string, LibroKids['suVoz']>();
  for (const v of libro.suVoz) {
    if (!v.respuesta.audioPath) continue;
    porParte.set(v.parte, [...(porParte.get(v.parte) ?? []), v]);
  }
  return {
    version: 1,
    narrador_id: narradorId,
    pedido_id: pedidoId,
    // No hay selección que confirmar: las eligió el escritor y ya están impresas en el libro.
    confirmado_at: ahora,
    capitulos: [...porParte].map(([parte, voces], i) => ({
      numero: i + 1,
      capitulo: parte,
      candidatas: voces.map((v) => ({
        id: v.id,
        texto: v.respuesta.texto,
        origen: 'cita' as const,
        grupo: null,
        respuesta_id: v.respuesta.respuestaId,
        pregunta_orden: v.respuesta.orden,
        por_que: 'la eligió el escritor del libro de Kids',
        elegida: true,
        elegida_por: 'modelo' as const,
        // El audio entero de la respuesta, tal cual lo mandó: no hay nada que cortar (sin frases_pedido.txt).
        estado: 'cortada' as const,
        audio_path: v.respuesta.audioPath,
        segundos: null,
        inicio: null,
        fin: null,
      })),
    })),
  };
}

/**
 * El libro entero de un chico con el pedido pagado: A (si faltaba o cambió el material), B, C, armado, PDFs,
 * «Su voz» y listo.json. Frenado: no hace nada más (el aviso ya salió). Un error que reintentar no arregla tira
 * FalloDelLibroKids / TopeDeGasto / …; los demás, tal cual.
 */
export async function escribirLibroKids(db: Db, pedido: { id: string; narrador_id: string }, motor: MotorKids = motorRealKids(db)): Promise<'listo' | 'frenado'> {
  const id = pedido.narrador_id;
  const desdeBase = await motor.material(db, id);
  let snapA = await cargarSnapshot(almacenReal(db, id), 'A');
  if (snapA && !mismasEntradas(snapA, desdeBase.c)) {
    console.log(`kids ${id}: el material cambió desde la Etapa A; se lee otra vez`);
    snapA = null;
  }
  const x = contexto(db, id, motor, snapA ?? desdeBase.c);
  const r = await correrKids(x);
  if (r.estado === 'frenado') return 'frenado';
  if (r.estado === 'fallido') throw new FalloDelLibroKids(r.motivo);
  x.log(`libro escrito: ${r.llamadas} llamadas, ${r.problemasFinales} problemas en el informe, USD ${x.ej.gastado.toFixed(2)}`);

  const m = materialDe(x.c);
  const lectura = JSON.parse(x.c.leer(salidaKids('lectura.json'))) as SalidaLectura;
  const libro = armarLibro(m, salidasDe(x, m), suVozValida(m, lectura));
  const urlVoz = urlVozDeNarrador(id);
  const p = await pdfsKids(libro, { fotos: desdeBase.fotos, urlDeAudio: (v) => urlFraseDeVoz(urlVoz, v.id), aPdf: motor.aPdf ?? htmlAPdf });
  await subir(db, RUTA_LIBRO_HTML_KIDS(id), p.libroHtml, 'text/html; charset=utf-8');
  await subir(db, RUTA_LIBRO_PDF_KIDS(id), p.libro, 'application/pdf');
  await subir(db, RUTA_SOBRE_PDF_KIDS(id), p.sobre, 'application/pdf');
  const ahora = new Date().toISOString();
  await subir(db, RUTA_FRASES_JSON(id), JSON.stringify(frasesKids(libro, id, pedido.id, ahora), null, 2), 'application/json');
  // Último: listo.json es la señal de que todo lo de arriba está.
  const listo: Listo = { at: ahora, paginas: contarPaginas(p.libro), sobrePaginas: contarPaginas(p.sobre) };
  await almacenKids(db, id).escribir(LISTO, JSON.stringify(listo, null, 1));
  return 'listo';
}

function esDefinitivo(err: unknown): boolean {
  return err instanceof FalloDelLibroKids || err instanceof TopeDeGasto || err instanceof SinMaterialKids || err instanceof ErrorJSON || (err instanceof ErrorDelModelo && !err.reintentable);
}

/** El trabajo del libro en la cola. Nunca tira: un error pasajero espera 15 minutos (hasta 3); otro, fallo-libro.json y aviso. */
async function trabajoLibro(db: Db, pedido: { id: string; narrador_id: string }, motor: MotorKids): Promise<void> {
  const id = pedido.narrador_id;
  try {
    const r = await conMarca(db, id, `libro ${pedido.id}`, () => escribirLibroKids(db, pedido, motor));
    erroresLibro.delete(id);
    console.log(`kids ${id}: libro ${r === 'listo' ? 'listo para que lo revise el padre' : 'frenado por algo preocupante'}`);
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error(`kids ${id}: el libro del pedido ${pedido.id} no salió:`, motivo);
    const veces = (erroresLibro.get(id) ?? 0) + 1;
    if (!esDefinitivo(err) && veces <= REINTENTOS_LIBRO) {
      erroresLibro.set(id, veces);
      esperaLibro.set(id, Date.now() + ESPERA_LIBRO_MS);
      return;
    }
    erroresLibro.delete(id);
    await almacenKids(db, id).escribir(FALLO_LIBRO, JSON.stringify({ motivo, pedido: pedido.id, fecha: new Date().toISOString() }, null, 1)).catch(() => {});
    await avisarSocios(
      `El libro de Kids de ${await quienEs(db, id)} no salió (pedido ${pedido.id})`,
      `${motivo}\n\nEl pedido sigue 'pagado'. Lo pagado al modelo quedó en ${PREFIJO_KIDS_REAL(id)}/. Para reintentar (retoma sin repagar), borrar ${PREFIJO_KIDS(id)}/${FALLO_LIBRO}.`,
    );
  }
}

// ---------------------------------------------------------------- el tick

type ChicoFila = { narrador_id: string; ficha?: { apodo?: string; linkPanel?: string } | null; termino_at?: string | null };
type NarradorFila = { id: string; estado: string; familia_id: string | null; como_le_dicen: string | null; libro_aprobado_at: string | null };
type PedidoFila = { id: string; narrador_id: string; estado: string };

function esTablaAusente(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message ?? '');
}

/**
 * Del tick: todo lo del libro de Kids, para cada chico que terminó de contar. Lanza los trabajos en segundo plano
 * (no los espera), manda los mails y mueve los pedidos aprobados. Nunca tira.
 */
export async function revisarLibrosKids(db: Db, o: { motor?: MotorKids; ahora?: number } = {}): Promise<void> {
  try {
    const k = await db.from('kids_v2').select('narrador_id, ficha, termino_at');
    if (k.error) {
      if (esTablaAusente(k.error)) return;
      throw new Error(`no pude leer kids_v2: ${k.error.message}`);
    }
    const chicos = ((k.data ?? []) as ChicoFila[]).filter((c) => c.termino_at);
    if (!chicos.length) return;
    const ids = chicos.map((c) => c.narrador_id);
    const n = await db.from('narradores').select('id, estado, familia_id, como_le_dicen, libro_aprobado_at').in('id', ids);
    if (n.error) throw new Error(`no pude leer los narradores de Kids: ${n.error.message}`);
    const p = await db.from('pedidos').select('id, narrador_id, estado').in('narrador_id', ids);
    if (p.error) throw new Error(`no pude leer los pedidos de Kids: ${p.error.message}`);
    const narradores = new Map(((n.data ?? []) as NarradorFila[]).map((x) => [x.id, x]));
    const pedidos = (p.data ?? []) as PedidoFila[];
    for (const chico of chicos) {
      const narrador = narradores.get(chico.narrador_id);
      // Terminó de contar = termino_at y el narrador en `completado` (CONTRATO, «Transiciones de un chico»).
      if (narrador?.estado !== 'completado') continue;
      try {
        await revisarChico(db, chico, narrador, pedidos.filter((x) => x.narrador_id === chico.narrador_id), o);
      } catch (err) {
        console.error(`kids ${chico.narrador_id}: no pude revisar su libro:`, err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    console.error('kids: no pude revisar los libros:', err instanceof Error ? err.message : err);
  }
}

async function revisarChico(db: Db, chico: ChicoFila, n: NarradorFila, pedidos: PedidoFila[], o: { motor?: MotorKids; ahora?: number }): Promise<void> {
  const id = n.id;
  const ahora = o.ahora ?? Date.now();
  const motor = (): MotorKids => o.motor ?? motorRealKids(db);
  if (cola.ocupada(id)) return;
  const archivos = await listar(db, PREFIJO_KIDS(id));
  const a = almacenKids(db, id);
  const listoTexto = archivos.has(LISTO) ? await a.leer(LISTO) : null;

  if (listoTexto === null) {
    const real = await listar(db, PREFIJO_KIDS_REAL(id));
    if (real.has(RUTA_FRENADO) && !real.has(RUTA_LIBERADO)) {
      // Frenado: nada hasta liberado.json. Solo se reintenta el aviso si no había salido.
      if (!archivos.has(FRENADO_AVISADO)) {
        const t = await almacenReal(db, id).leer(RUTA_FRENADO);
        const texto = t ? ((JSON.parse(t) as { texto?: string }).texto ?? t) : 'El libro quedó frenado.';
        if (await avisarSocios(`Libro de Kids frenado: ${n.como_le_dicen ?? id}`, textoFrenadoConRuta(id, texto))) await a.escribir(FRENADO_AVISADO, new Date(ahora).toISOString());
      }
      return;
    }
    const pagado = pedidos.find((x) => x.estado === 'pagado');
    if (pagado) {
      if (archivos.has(FALLO_LIBRO) || !cola.hayLugar(id) || ahora < (esperaLibro.get(id) ?? 0)) return;
      if (await trabajaOtraCopia(db, id, ahora)) return;
      const m = motor();
      cola.lanzar(id, () => trabajoLibro(db, pagado, m));
      return;
    }
    if (real.has(CARPETA_A) || archivos.has(FALLO_A) || !cola.hayLugar(id)) return;
    if (ahora - (ultimoErrorA.get(id) ?? -Infinity) < ESPERA_TRAS_ERROR_MS) return;
    if (await trabajaOtraCopia(db, id, ahora)) return;
    const m = motor();
    cola.lanzar(id, async () => {
      try {
        const r = await conMarca(db, id, 'etapa A', () => correrEtapaAKids(db, id, m));
        ultimoErrorA.delete(id);
        console.log(`kids ${id}: lectura ${r}`);
      } catch (err) {
        ultimoErrorA.set(id, Date.now());
        throw err;
      }
    });
    return;
  }

  // El libro está escrito (listo.json).
  const listo = JSON.parse(listoTexto) as Listo;
  const enlace = chico.ficha?.linkPanel?.trim() || cargarConfig().urlBase;
  const apodo = chico.ficha?.apodo?.trim() || n.como_le_dicen?.trim() || 'tu hijo';

  if (!n.libro_aprobado_at) {
    if (!archivos.has(MAIL_REVISAR)) {
      const para = await mailDeLaDuena(db, n);
      if (para && (await enviarMailKids('revisar', { para, apodo, enlace }))) await a.escribir(MAIL_REVISAR, new Date(ahora).toISOString());
    }
    const desde = Date.parse(listo.at);
    if (Number.isFinite(desde) && ahora - desde >= DIAS_SIN_APROBAR * MS_DIA && !archivos.has(AVISO_14_DIAS)) {
      const salio = await avisarSocios(
        `El padre de ${await quienEs(db, id)} no aprobó el libro de Kids en ${DIAS_SIN_APROBAR} días`,
        `El libro está escrito desde ${listo.at} (${listo.paginas} páginas, sobre de ${listo.sobrePaginas}) y el padre todavía no lo aprobó en su panel. No se imprime ni se entrega hasta que lo apruebe; la fábrica no lo aprueba sola. Este aviso sale una sola vez.`,
      );
      if (salio) await a.escribir(AVISO_14_DIAS, new Date(ahora).toISOString());
    }
    return;
  }

  // El padre lo aprobó: cada pedido pagado del chico pasa a entregado (mismo CAS que siempre).
  let entregados = pedidos.filter((x) => x.estado === 'entregado').length;
  for (const pedido of pedidos.filter((x) => x.estado === 'pagado')) {
    const { data, error } = await db
      .from('pedidos')
      .update({ estado: 'entregado', libro_pdf_path: RUTA_LIBRO_PDF_KIDS(id), audiolibro_paths: null })
      .eq('id', pedido.id)
      .eq('estado', 'pagado')
      .select('id');
    if (error) { console.error(`kids ${id}: no se pudo entregar el pedido ${pedido.id}:`, error.message); continue; }
    if (data && (data as unknown[]).length === 1) entregados++;
  }
  if (entregados > 0 && !archivos.has(MAIL_LIBRO_LISTO)) {
    const para = await mailDeLaDuena(db, n);
    if (para && (await enviarMailKids('libro_listo', { para, apodo, enlace }))) await a.escribir(MAIL_LIBRO_LISTO, new Date(ahora).toISOString());
  }
}

async function mailDeLaDuena(db: Db, n: NarradorFila): Promise<string | null> {
  if (!n.familia_id) { console.warn(`kids ${n.id}: el narrador no tiene familia; no hay a quién mandarle el mail`); return null; }
  const { data, error } = await db.from('familias').select('email').eq('id', n.familia_id).maybeSingle();
  const email = (data as { email?: string } | null)?.email?.trim();
  if (error || !email) { console.warn(`kids ${n.id}: no pude leer el mail de la familia (${error?.message ?? 'sin mail'})`); return null; }
  return email;
}

// ---------------------------------------------------------------- para la imprenta (entregas.ts)

/** ¿El libro de este chico está escrito (listo.json) y aprobado por el padre? Solo entonces va a la imprenta. */
export async function libroKidsAprobado(db: Db, id: string): Promise<boolean> {
  const { data, error } = await db.from('narradores').select('libro_aprobado_at').eq('id', id).maybeSingle();
  if (error || !(data as { libro_aprobado_at?: string | null } | null)?.libro_aprobado_at) return false;
  return (await almacenKids(db, id).leer(LISTO)) !== null;
}
