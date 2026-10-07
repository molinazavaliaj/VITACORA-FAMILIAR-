// El alta V3 (spec 2026-10-07, "El alta"):
//   - narradores EN CURSO: `npm run v3-pasar` arma el plan (dry-run) y, con
//     --aplicar, crea la fila con las respuestas viejas cargadas en sus claves
//     V3 (equivalencias.json, aprobada por Naza). No le manda nada: la próxima
//     sale en su tanda, a su hora preferida (la abre el reloj).
//   - narradores NUEVOS: al pasar acepto → activo con V3_PARA_NUEVOS=1. Sin
//     género, se frena y se avisa a los socios.
//
// El reloj (reloj.ts) solo trabaja a los narradores 'activo' y cuenta M8 desde
// `estado.abiertaDesde`: el alta deja al narrador activo y, si deja una
// pregunta abierta, anota desde cuándo.

import type { SupabaseClient } from '@supabase/supabase-js';
import { fechaLocal } from '../flujo/tiempo.js';
import type { DepsV3 } from './deps.js';
import { drenar } from './enviar.js';
import equivalenciasJson from './equivalencias.json' with { type: 'json' };
import { conReintento, crearFila, esNarradorV3 } from './estado.js';
import { preguntaPorId } from './nucleo/entrevista/banco.js';
import type { PreguntaFamilia } from './nucleo/entrevista/flujo.js';
import { esIdioma, idiomaDe, type Idioma } from './nucleo/entrevista/idioma.js';
import { respuestaInferida, sumarAudio } from './nucleo/entrevista/respuesta.js';
import { yaEsLaHora } from './tanda.js';
import { esGenero, estadoInicial, fichaTexto, SIN_CLAVE_V3, type EstadoV3, type FichaFila, type Genero, type MigradaDe, type NarradorV3 } from './tipos.js';
import { avanzar } from './turno.js';

// ---------------------------------------------------------------- equivalencias

/**
 * Texto viejo → clave V3, o varias claves (Naza, 07/10: "¿Cómo eran su mamá y
 * su papá?" → CA2 y CA3). Con varias, la respuesta entera va a la primera y
 * las demás quedan contestadas con la marca de inferida ("⟦inferida:CA2⟧"
 * en CA3): el motor no las pregunta y el texto no se duplica.
 */
export type Equivalencias = { version: 1; porTexto: Record<string, string | string[]> };

/** Las claves de una entrada, siempre como lista (la primera recibe el texto). */
export function clavesDe(valor: string | string[]): string[] {
  return typeof valor === 'string' ? [valor] : valor;
}

/** Minúsculas, sin acentos ni signos, espacios simples: "¿Cómo era tu casa?" → "como era tu casa". */
export function normalizarPregunta(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function leerEquivalencias(crudo: unknown = equivalenciasJson): Equivalencias {
  const e = crudo as Partial<Equivalencias> | null;
  if (!e || e.version !== 1 || typeof e.porTexto !== 'object' || e.porTexto === null) {
    throw new Error('equivalencias: formato inválido (se espera { "version": 1, "porTexto": { "<texto de la pregunta vieja>": "<clave V3>" } }).');
  }
  const porTexto: Record<string, string | string[]> = {};
  for (const [texto, valor] of Object.entries(e.porTexto as Record<string, unknown>)) {
    const lista = typeof valor === 'string' ? [valor] : Array.isArray(valor) ? (valor as unknown[]) : [valor];
    if (lista.length === 0) throw new Error(`equivalencias: «${texto}» no tiene ninguna clave V3.`);
    for (const clave of lista) {
      if (typeof clave !== 'string' || !preguntaPorId(clave)) throw new Error(`equivalencias: «${String(clave)}» no es una pregunta del banco V3 (para «${texto}»).`);
    }
    const claves = lista as string[];
    if (new Set(claves).size !== claves.length) throw new Error(`equivalencias: «${texto}» repite una clave (${claves.join(', ')}).`);
    const normal = normalizarPregunta(texto);
    // Dos textos que se normalizan igual y van a claves distintas: no se adivina cuál vale.
    const antes = porTexto[normal];
    if (antes !== undefined && clavesDe(antes).join(',') !== claves.join(',')) {
      throw new Error(`equivalencias: «${texto}» se normaliza igual que otra entrada y van a claves distintas (${clavesDe(antes).join('+')} y ${claves.join('+')}).`);
    }
    porTexto[normal] = typeof valor === 'string' ? valor : claves;
  }
  return { version: 1, porTexto };
}

// ---------------------------------------------------------------- el plan (puro)

export type FilaGuion = { id: string; orden: number; texto: string; tipo: string };
export type RespuestaVieja = {
  id: string; pregunta_orden: number; transcripcion: string | null; texto_directo: string | null; recibido_at: string;
  /** "Esto que no vaya al libro" (migración 20260920000100). Ausentes = nada reservado. */
  reservada?: boolean | null; reservado_tramo?: string | null;
  /** SIN_CLAVE_V3 = una fila que la V3 dejó afuera a propósito: el pase no la carga. */
  clave_v3?: string | null;
};
export type Cargada = { clave: string; ordenes: number[]; respuestaIds: string[]; texto: string; palabras: number };
/** Una clave V3 que se da por contestada porque su texto ya está en `de` (marca ⟦inferida:de⟧). */
export type Inferida = { clave: string; de: string; ordenes: number[] };
export type PlanDePase = {
  narradorId: string;
  estadoNarrador: string;
  idioma: Idioma;
  ficha: FichaFila;
  migradaDe: MigradaDe;
  familia: PreguntaFamilia[];
  ultimoEntranteAt: string | null;
  cargadas: Cargada[];
  /** Claves cubiertas por la respuesta de otra (tabla con varias claves): van con la marca de inferida. */
  inferidas: Inferida[];
  sinEquivalencia: { orden: number; pregunta: string; respuestas: number }[];
  sinTexto: number[];
  /** Órdenes con alguna respuesta reservada entera: no se cargan ni llevan clave_v3. */
  reservadas: number[];
  /** Órdenes con un tramo reservado: decide una persona; mientras haya, no se aplica. */
  tramosReservados: number[];
  /**
   * La pregunta vieja que le salió (orden = dia_actual) y no contestó. Con
   * respuestas cargadas, no se aplica (lo que conteste tarde se pegaría a la
   * última cargada, con la clave equivocada). Sin nada cargado, solo se avisa.
   */
  pendiente: number | null;
};

const palabras = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function armarPase(e: {
  narradorId: string; estadoNarrador: string; diaActual: number; ultimaRespuestaAt: string | null;
  idioma: Idioma; ficha: FichaFila; guion: FilaGuion[]; respuestas: RespuestaVieja[]; equivalencias: Equivalencias;
}): PlanDePase {
  const porOrden = new Map<number, RespuestaVieja[]>();
  for (const r of [...e.respuestas].sort((a, b) => a.recibido_at.localeCompare(b.recibido_at))) {
    if (r.clave_v3 === SIN_CLAVE_V3) continue;
    porOrden.set(r.pregunta_orden, [...(porOrden.get(r.pregunta_orden) ?? []), r]);
  }
  const guion = new Map(e.guion.map((p) => [p.orden, p]));
  const cargadas: Cargada[] = [];
  const inferidas: Inferida[] = [];
  const sinEquivalencia: PlanDePase['sinEquivalencia'] = [];
  const sinTexto: number[] = [];
  const reservadas: number[] = [];
  const tramosReservados: number[] = [];
  for (const orden of [...porOrden.keys()].sort((a, b) => a - b)) {
    const todas = porOrden.get(orden)!;
    // Lo reservado no entra nunca a la V3 (el escritor lee estado.respuestas).
    // Con tramo: decide una persona qué queda; sin tramo: afuera entera.
    if (todas.some((r) => !!r.reservado_tramo?.trim())) tramosReservados.push(orden);
    else if (todas.some((r) => r.reservada)) reservadas.push(orden);
    const filas = todas.filter((r) => !r.reservada && !r.reservado_tramo?.trim());
    if (filas.length === 0) continue;
    const texto = filas.reduce((acc, r) => sumarAudio(acc, r.transcripcion?.trim() || r.texto_directo?.trim() || ''), '');
    if (!texto) {
      sinTexto.push(orden);
      continue;
    }
    const pregunta = guion.get(orden);
    const enTabla = pregunta && pregunta.tipo !== 'familia' ? e.equivalencias.porTexto[normalizarPregunta(pregunta.texto)] : undefined;
    const [clave, ...cubiertas] = pregunta?.tipo === 'familia' ? [`F:${pregunta.id}`] : enTabla !== undefined ? clavesDe(enTabla) : [];
    if (!clave) {
      sinEquivalencia.push({ orden, pregunta: pregunta?.texto ?? '(sin pregunta en el guion)', respuestas: filas.length });
      continue;
    }
    const ya = cargadas.find((c) => c.clave === clave);
    if (ya) {
      ya.texto = sumarAudio(ya.texto, texto);
      ya.ordenes.push(orden);
      ya.respuestaIds.push(...filas.map((r) => r.id));
    } else {
      cargadas.push({ clave, ordenes: [orden], respuestaIds: filas.map((r) => r.id), texto, palabras: 0 });
    }
    for (const cubierta of cubiertas) {
      const inf = inferidas.find((i) => i.clave === cubierta);
      if (inf) inf.ordenes.push(orden);
      else inferidas.push({ clave: cubierta, de: clave, ordenes: [orden] });
    }
  }
  for (const c of cargadas) c.palabras = palabras(c.texto);
  return {
    narradorId: e.narradorId,
    estadoNarrador: e.estadoNarrador,
    idioma: e.idioma,
    ficha: e.ficha,
    migradaDe: { de: 'v-vieja', dia_actual: e.diaActual },
    familia: e.guion.filter((p) => p.tipo === 'familia').map((p) => ({ id: `F:${p.id}`, texto: p.texto })),
    ultimoEntranteAt: e.ultimaRespuestaAt,
    cargadas,
    // Si la clave tiene respuesta propia (otra pregunta vieja va directo ahí), gana la respuesta.
    inferidas: inferidas.filter((i) => !cargadas.some((c) => c.clave === i.clave)),
    sinEquivalencia,
    sinTexto,
    reservadas,
    tramosReservados,
    pendiente: e.diaActual >= 1 && !porOrden.has(e.diaActual) ? e.diaActual : null,
  };
}

// ---------------------------------------------------------------- base

/** El guion del narrador como lo resuelve db/guion.ts: si tiene fijas propias, solo lo propio; si no, la plantilla con lo propio encima. */
async function guionDe(db: SupabaseClient, narradorId: string): Promise<FilaGuion[]> {
  const { data: propias, error } = await db.from('preguntas').select('id,orden,texto,tipo').eq('narrador_id', narradorId).order('orden');
  if (error) throw new Error(`No pude leer el guion de ${narradorId}: ${error.message}`);
  const lista = (propias as FilaGuion[] | null) ?? [];
  if (lista.some((p) => p.tipo === 'fija')) return lista;
  const { data: globales, error: errorGlobales } = await db.from('preguntas').select('id,orden,texto,tipo').is('narrador_id', null).order('orden');
  if (errorGlobales) throw new Error(`No pude leer la plantilla de preguntas: ${errorGlobales.message}`);
  const porOrden = new Map<number, FilaGuion>();
  for (const p of (globales as FilaGuion[] | null) ?? []) porOrden.set(p.orden, p);
  for (const p of lista) porOrden.set(p.orden, p);
  return [...porOrden.values()].sort((a, b) => a.orden - b.orden);
}

async function quienRegala(db: SupabaseClient, familiaId: string): Promise<string | undefined> {
  const { data } = await db.from('familias').select('nombre').eq('id', familiaId).maybeSingle();
  return (data as { nombre?: string } | null)?.nombre || undefined;
}

async function leerNarrador(db: SupabaseClient, narradorId: string): Promise<NarradorV3> {
  const { data, error } = await db.from('narradores').select('*').eq('id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer el narrador ${narradorId}: ${error.message}`);
  if (!data) throw new Error(`No existe el narrador ${narradorId}.`);
  return data as NarradorV3;
}

const CAMPOS_RESPUESTA = 'id,pregunta_orden,transcripcion,texto_directo,recibido_at';

/** Las columnas opcionales, de más a menos: sin una migración aplicada (42703) se prueba sin esas columnas. */
const COLUMNAS_OPCIONALES = [',clave_v3,reservada,reservado_tramo', ',reservada,reservado_tramo', ',clave_v3', ''];

/**
 * Las respuestas viejas con su marca de reservada y su clave_v3. Si la
 * migración de las reservas (o la de la V3) no está aplicada (columna
 * inexistente, 42703), nadie pudo marcar nada: se leen sin esas columnas.
 */
async function respuestasViejas(db: SupabaseClient, narradorId: string): Promise<RespuestaVieja[]> {
  for (const extra of COLUMNAS_OPCIONALES) {
    const { data, error } = await db.from('respuestas').select(`${CAMPOS_RESPUESTA}${extra}`).eq('narrador_id', narradorId);
    if (!error) return (data as unknown as RespuestaVieja[] | null) ?? [];
    if (error.code !== '42703') throw new Error(`No pude leer las respuestas de ${narradorId}: ${error.message}`);
  }
  throw new Error(`No pude leer las respuestas de ${narradorId}: falta una columna de respuestas.`);
}

/** Lo que entra a estado.respuestas: cada cargada y, pegadas detrás, las claves que se infieren de ella. */
export function respuestasDelPase(plan: Pick<PlanDePase, 'cargadas' | 'inferidas'>): [string, string][] {
  return plan.cargadas.flatMap((c) => [
    [c.clave, c.texto] as [string, string],
    ...plan.inferidas.filter((i) => i.de === c.clave).map((i) => [i.clave, respuestaInferida(i.de)] as [string, string]),
  ]);
}

/** Por qué no se puede aplicar todavía (vacío = se puede). */
export function bloqueosDePase(plan: PlanDePase): string[] {
  const b: string[] = [];
  if (plan.pendiente !== null && plan.cargadas.length > 0) b.push(`tiene la pregunta orden ${plan.pendiente} pendiente: pasar después de que conteste`);
  if (plan.tramosReservados.length > 0) b.push(`tramo reservado en órdenes ${plan.tramosReservados.join(', ')}: decide una persona`);
  // Lo que no entra a la V3 no llega nunca al libro: sin override, se completa la tabla o se revisa a mano.
  if (plan.sinEquivalencia.length > 0) b.push(`sin equivalencia en órdenes ${plan.sinEquivalencia.map((s) => s.orden).join(', ')}: completar la tabla (la aprueba Naza)`);
  if (plan.sinTexto.length > 0) b.push(`sin texto en órdenes ${plan.sinTexto.join(', ')}: transcribir o revisar a mano`);
  return b;
}

export async function planDePase(db: SupabaseClient, narradorId: string, o: { genero: Genero; idioma?: Idioma; equivalencias: Equivalencias }): Promise<PlanDePase> {
  const n = await leerNarrador(db, narradorId);
  if (n.contexto?.modo === 'viaje') throw new Error(`${narradorId} es de la Vitácora de Viaje: sigue por su flujo.`);
  if (!['acepto', 'activo', 'pausado'].includes(n.estado)) throw new Error(`${narradorId} está '${n.estado}': solo se pasan acepto, activo o pausado.`);
  if (await esNarradorV3(db, narradorId)) throw new Error(`${narradorId} ya tiene entrevista V3.`);
  const respuestas = await respuestasViejas(db, narradorId);
  const regala = await quienRegala(db, n.familia_id);
  return armarPase({
    narradorId,
    estadoNarrador: n.estado,
    diaActual: n.dia_actual,
    ultimaRespuestaAt: n.ultima_respuesta_at,
    idioma: o.idioma ?? idiomaDe(n.contexto),
    ficha: { nombre: n.como_le_dicen, genero: o.genero, ...(regala ? { quienRegala: regala } : {}) },
    guion: await guionDe(db, narradorId),
    respuestas,
    equivalencias: o.equivalencias,
  });
}

/**
 * Crea la fila V3 con lo viejo cargado y marca `clave_v3` en las respuestas que
 * se cargaron (las demás quedan como estaban). No manda nada: queda sin
 * pregunta abierta y el reloj le abre la tanda a su hora preferida. Si hoy su
 * hora ya pasó, la tanda de hoy se da por hecha (tanda_dia = hoy, cuenta 0):
 * la próxima sale mañana a su hora, no un minuto después del pase.
 * Un acepto pasa a activo (el reloj solo trabaja a los activos); un activo sigue
 * activo. Un pausado SIGUE PAUSADO (spec): el reloj no le manda nada hasta que
 * se reactive. No aplica nada si tiene la pregunta vieja pendiente (con algo cargado), un tramo
 * reservado, respuestas sin equivalencia o sin texto (bloqueosDePase), ni si ya es V3.
 */
export async function aplicarPase(db: SupabaseClient, plan: PlanDePase, ahora: Date = new Date()): Promise<void> {
  const bloqueos = bloqueosDePase(plan);
  if (bloqueos.length > 0) throw new Error(`No se aplica el pase de ${plan.narradorId}: ${bloqueos.join('; ')}. No se cambió nada.`);
  if (await esNarradorV3(db, plan.narradorId)) throw new Error(`${plan.narradorId} ya tiene entrevista V3: no se toca.`);
  const n = await leerNarrador(db, plan.narradorId);
  const hoy = fechaLocal(ahora, n.zona_horaria);
  // clave_v3 primero: si algo se corta en el medio, repetir el pase vuelve a poner lo mismo.
  for (const c of plan.cargadas) {
    const { error } = await db.from('respuestas').update({ clave_v3: c.clave }).in('id', c.respuestaIds);
    if (error) throw new Error(`No pude poner clave_v3 = ${c.clave}: ${error.message}`);
  }
  const estado: EstadoV3 = {
    ...estadoInicial(plan.familia),
    respuestas: respuestasDelPase(plan),
    ...(plan.ultimoEntranteAt ? { ultimoEntranteAt: plan.ultimoEntranteAt } : {}),
  };
  const creada = await crearFila(db, {
    narrador_id: plan.narradorId, idioma: plan.idioma, ficha: plan.ficha, estado,
    ultimo_audio_at: null,
    tanda_dia: yaEsLaHora(n.hora_preferida, n.zona_horaria, ahora) ? hoy : null,
    tanda_cuenta: 0,
    migrada_de: plan.migradaDe,
  });
  if (creada === 'ya-existia') throw new Error(`${plan.narradorId} ya tiene entrevista V3: no se toca.`);
  if (plan.estadoNarrador === 'acepto') {
    const { error } = await db.from('narradores').update({ estado: 'activo' }).eq('id', plan.narradorId).eq('estado', 'acepto');
    if (error) throw new Error(`No pude pasar a ${plan.narradorId} a activo: ${error.message}`);
  }
}

/** Lo que muestra el dry-run: preguntas, cantidades e IDs V3; nunca lo que contó (no se copian vidas a la consola ni a los docs). */
export function describirPase(plan: PlanDePase): string {
  const l = [
    `Pase a la V3 de ${plan.narradorId} (${plan.estadoNarrador}, dia_actual ${plan.migradaDe.dia_actual}) — idioma ${plan.idioma}, género ${plan.ficha.genero}.`,
    `Se cargan ${plan.cargadas.length} respuestas viejas:`,
    ...plan.cargadas.map((c) => `  ${c.clave} ← orden${c.ordenes.length > 1 ? 'es' : ''} ${c.ordenes.join(', ')} (${c.palabras} palabras)`),
  ];
  if (plan.inferidas.length > 0) {
    l.push('Contestadas por otra (no se preguntan; van con la marca de inferida, sin repetir el texto):');
    for (const i of plan.inferidas) l.push(`  ${i.clave} ← ya está en ${i.de} (orden${i.ordenes.length > 1 ? 'es' : ''} ${i.ordenes.join(', ')})`);
  }
  if (plan.sinEquivalencia.length > 0) {
    l.push('Sin equivalencia (no entrarían a la V3; mientras haya, --aplicar no aplica nada):');
    for (const s of plan.sinEquivalencia) l.push(`  orden ${s.orden}: «${s.pregunta}» (${s.respuestas} respuesta${s.respuestas > 1 ? 's' : ''})`);
  }
  if (plan.sinTexto.length > 0) l.push(`Sin texto (audio sin transcripción): órdenes ${plan.sinTexto.join(', ')}. Mientras haya, --aplicar no aplica nada.`);
  if (plan.reservadas.length > 0) l.push(`Reservada, no se carga (ni lleva clave_v3): órdenes ${plan.reservadas.join(', ')}.`);
  if (plan.tramosReservados.length > 0) l.push(`Tramo reservado: decide una persona (órdenes ${plan.tramosReservados.join(', ')}). Mientras esté, --aplicar no aplica nada.`);
  if (plan.pendiente !== null && plan.cargadas.length > 0) {
    l.push(`Tiene la pregunta orden ${plan.pendiente} pendiente: pasar después de que conteste. Mientras tanto, --aplicar no aplica nada.`);
  } else if (plan.pendiente !== null) {
    l.push(`Aviso: tenía la pregunta orden ${plan.pendiente} pendiente; si contesta esa antes de que salga la primera V3, lo que mande queda guardado en respuestas (con clave_v3 = ${SIN_CLAVE_V3}: afuera) pero no entra a la entrevista V3: revisarlo a mano.`);
  }
  l.push('No se le manda nada en el momento: la próxima pregunta sale en su tanda, a su hora preferida.');
  return l.join('\n');
}

export type ArgsPase = { narradorId: string; genero: Genero; idioma?: Idioma; aplicar: boolean; equivalencias?: string };

export function argumentosDePase(args: string[]): ArgsPase {
  const opcion = (nombre: string) => {
    const i = args.indexOf(nombre);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const narradorId = args[0];
  if (!narradorId || narradorId.startsWith('--')) throw new Error('Uso: npm run v3-pasar -- <narrador> --genero varon|mujer|otro [--idioma es-AR|es-ES|ca] [--aplicar] [--equivalencias <ruta>]');
  const genero = opcion('--genero');
  if (!esGenero(genero)) throw new Error('Falta --genero varon|mujer|otro.');
  const idioma = opcion('--idioma');
  if (idioma !== undefined && !esIdioma(idioma)) throw new Error(`--idioma desconocido: ${idioma} (es-AR, es-ES o ca).`);
  const equivalencias = opcion('--equivalencias');
  return { narradorId, genero, ...(idioma ? { idioma } : {}), aplicar: args.includes('--aplicar'), ...(equivalencias ? { equivalencias } : {}) };
}

// ---------------------------------------------------------------- nuevos

async function familiaDe(db: SupabaseClient, narradorId: string): Promise<PreguntaFamilia[]> {
  const { data } = await db.from('preguntas').select('id,orden,texto,tipo').eq('narrador_id', narradorId).eq('tipo', 'familia').order('orden');
  return ((data as FilaGuion[] | null) ?? []).map((p) => ({ id: `F:${p.id}`, texto: p.texto }));
}

/** Crea la fila (si no está) y manda la primera tanda: OR1 con M1. Sin BIEN: ya recibió la bienvenida. */
export async function arrancarV3(deps: DepsV3, n: NarradorV3, idioma: Idioma, ficha: FichaFila, o: { ventanaAbierta: boolean }): Promise<void> {
  const ahora = deps.ahora();
  const hoy = fechaLocal(ahora, n.zona_horaria);
  const inicial: EstadoV3 = { ...estadoInicial(await familiaDe(deps.db, n.id)), ...(o.ventanaAbierta ? { ultimoEntranteAt: ahora.toISOString() } : {}) };
  await crearFila(deps.db, { narrador_id: n.id, idioma, ficha, estado: inicial, ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null });
  await conReintento(deps.db, n.id, (f) => {
    if (f.tanda_dia !== null || f.estado.esperando || f.estado.respuestas.length > 0) return null; // ya arrancó
    const a = avanzar(f.estado, fichaTexto(f));
    // abiertaDesde: M8 cuenta desde acá (reloj.ts).
    return { cambio: { estado: a.abrio ? { ...a.estado, abiertaDesde: ahora.toISOString() } : a.estado, tanda_dia: hoy, tanda_cuenta: a.abrio ? 1 : 0 }, resultado: true };
  });
  // El reloj solo trabaja a los activos.
  await deps.db.from('narradores').update({ estado: 'activo' }).eq('id', n.id).eq('estado', 'acepto');
  await drenar(deps, n.id);
}

export async function altaNuevo(deps: DepsV3, n: NarradorV3, o: { ventanaAbierta: boolean }): Promise<'mandada' | 'frenada'> {
  const genero = n.contexto?.genero;
  if (!esGenero(genero)) {
    await deps.avisar(`alta-sin-genero-${n.id}`, `Alta V3 frenada: ${n.como_le_dicen} no tiene género`,
      `${n.id} aceptó, pero contexto.genero no vino (varon | mujer | otro). No le sale nada hasta cargarlo: npm run v3-pasar -- ${n.id} --genero <varon|mujer|otro> --aplicar`);
    return 'frenada';
  }
  let idioma: Idioma;
  try {
    idioma = idiomaDe(n.contexto);
  } catch (err) {
    await deps.avisar(`alta-idioma-${n.id}`, `Alta V3 frenada: idioma desconocido para ${n.como_le_dicen}`, err instanceof Error ? err.message : String(err));
    return 'frenada';
  }
  const regala = await quienRegala(deps.db, n.familia_id);
  await arrancarV3(deps, n, idioma, { nombre: n.como_le_dicen, genero, ...(regala ? { quienRegala: regala } : {}) }, o);
  return 'mandada';
}
