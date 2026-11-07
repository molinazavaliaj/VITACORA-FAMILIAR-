// El link propio del narrador (Naza y Joaquín, 05/11; CONTRATO, «Lo contado es privado»): sin contraseña, firmado y con
// vencimiento, para que escuche sus respuestas y saque lo que no quiera en el libro. Lo verifica la web
// (web/src/lib/token-respuestas.ts) con el mismo secreto y el mismo esquema que los otros links firmados.
//
// Desde que deja de contar tiene 48 horas para sacar algo: el libro no se escribe antes (fabrica, esperaPorElNarrador).
// El link dura 7 días: pasado el plazo sigue abriendo para escuchar y dice que ya no se puede sacar nada.

import { createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PLANTILLAS_REVISION } from './config.js';
import type { Idioma } from './v3/nucleo/entrevista/idioma.js';
import { normalizar } from './v3/nucleo/entrevista/respuesta.js';
import { renderizar, type FichaTexto } from './v3/nucleo/entrevista/texto.js';
import { textoFijo } from './v3/textos-fijos.js';

export const DIAS_DEL_LINK = 7;
export const HORAS_PARA_SACAR = 48;
const TIPO = 'respuestas';
const ESTADOS_TERMINADOS = ['completado', 'cerrado_anticipado'];

/** La misma regla que loContadoEsPrivado de la web (web/src/lib/panel.ts). */
// Solo las ventas nuevas, y solo si el narrador no eligió a su familia (Joaquín, 05/11; flujo/acceso.ts).
export function esPrivado(contexto: unknown): boolean {
  const a = (contexto as { acceso?: { elige?: unknown; quien?: unknown } } | null | undefined)?.acceso;
  return a?.elige === true && a.quien !== 'familia';
}

export function firmarTokenRespuestas(narradorId: string, ahora: Date): string {
  const secreto = process.env.FIRMA_TOKENS?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secreto) throw new Error('Falta FIRMA_TOKENS (o SUPABASE_SERVICE_ROLE_KEY) para firmar el link del narrador.');
  const encabezado = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = ahora.getTime() + DIAS_DEL_LINK * 86_400_000;
  const payload = Buffer.from(JSON.stringify({ narradorId, tipo: TIPO, exp })).toString('base64url');
  const datos = `${encabezado}.${payload}`;
  return `${datos}.${createHmac('sha256', secreto).update(datos).digest('base64url')}`;
}

export function urlRespuestas(narradorId: string, ahora: Date): string {
  const base = (process.env.URL_BASE ?? 'https://www.vitacorafamiliar.com').replace(/\/$/, '');
  return `${base}/mis-respuestas/${firmarTokenRespuestas(narradorId, ahora)}`;
}

// ---------------------------------------------------------------- pedirlo por el chat

const COMUNES = [
  'mis respuestas', 'mis audios', 'quiero borrar algo', 'borrar una respuesta', 'borrar algo de lo que', 'mandame el link', 'pasame el link', 'enviame el link',
  'mandame el enlace', 'pasame el enlace', 'enviame el enlace', 'quiero sacar algo', 'sacar una respuesta', 'revisar lo que conte', 'el link de mis',
];
const SOLO_ESPANA = ['quiero quitar algo', 'quitar una respuesta', 'revisar lo que he contado'];
const SOLO_CATALAN = [
  'les meves respostes', 'els meus audios', 'envia m l enllac', 'passa m l enllac', 'vull esborrar alguna cosa', 'esborrar una resposta', 'vull treure alguna cosa',
  'treure una resposta', 'revisar el que he explicat',
];
const POR_IDIOMA: Record<Idioma, string[]> = {
  'es-AR': COMUNES,
  'es-ES': [...COMUNES, ...SOLO_ESPANA],
  ca: [...COMUNES, ...SOLO_ESPANA, ...SOLO_CATALAN],
};
/** Solo en un mensaje corto: «no sé si mis respuestas sirven para algo, mi hermana decía…» es una historia. */
const PALABRAS_PEDIDO_LINK = 8;

/** Frases fijas, sin modelo, como la pausa y la reserva. Ante la duda, no es un pedido. */
export function pideMisRespuestas(texto: string, idioma: Idioma): boolean {
  const t = normalizar(texto);
  if (t.split(' ').filter(Boolean).length > PALABRAS_PEDIDO_LINK) return false;
  const conEspacios = ` ${t} `;
  return POR_IDIOMA[idioma].some((f) => conEspacios.includes(` ${f} `));
}

// ---------------------------------------------------------------- el mensaje

export type DatosDelLink = { estado: string; contexto?: unknown; ultima_respuesta_at?: string | null; zona_horaria?: string | null; como_le_dicen?: string | null };

export async function datosDelLink(db: SupabaseClient, narradorId: string): Promise<DatosDelLink | null> {
  const { data, error } = await db.from('narradores').select('estado, contexto, ultima_respuesta_at, zona_horaria, como_le_dicen').eq('id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer al narrador ${narradorId}: ${error.message}`);
  return (data as DatosDelLink | null) ?? null;
}

/** Hasta cuándo puede sacar algo. Null si todavía no contó nada. */
export function plazoParaSacar(d: Pick<DatosDelLink, 'ultima_respuesta_at'>): number | null {
  const t = d.ultima_respuesta_at ? Date.parse(d.ultima_respuesta_at) : NaN;
  return Number.isFinite(t) ? t + HORAS_PARA_SACAR * 3_600_000 : null;
}

const LOCALE: Record<Idioma, string> = { 'es-AR': 'es-AR', 'es-ES': 'es-ES', ca: 'ca' };

/** «sábado 7 de noviembre a las 18:30» («a les» en catalán), en la hora del narrador. */
export function fechaDelPlazo(ms: number, zona: string | null | undefined, idioma: Idioma): string {
  const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false };
  let formato: Intl.DateTimeFormat;
  try {
    formato = new Intl.DateTimeFormat(LOCALE[idioma], { ...opciones, timeZone: zona ?? undefined });
  } catch {
    formato = new Intl.DateTimeFormat(LOCALE[idioma], opciones);
  }
  const partes = new Map(formato.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  const mes = partes.get('month') ?? '';
  // En catalán el mes ya puede traer su «de» o «d'» («de novembre», «d'abril»).
  const deMes = /^(de |d')/.test(mes) ? mes : idioma === 'ca' && /^[aeiouàèéíòóú]/i.test(mes) ? `d'${mes}` : `de ${mes}`;
  return `${partes.get('weekday')} ${partes.get('day')} ${deMes} ${idioma === 'ca' ? 'a les' : 'a las'} ${partes.get('hour')}:${partes.get('minute')}`;
}

/** El mensaje con el link, según dónde está: contando, con plazo para sacar, o ya sin plazo. Sin texto aprobado, null. */
export function textoDelLink(d: DatosDelLink, narradorId: string, idioma: Idioma, ficha: FichaTexto, ahora: Date): string | null {
  const plazo = plazoParaSacar(d);
  const termino = ESTADOS_TERMINADOS.includes(d.estado);
  const clave = !termino ? 'linkRespuestas' : plazo !== null && plazo > ahora.getTime() ? 'linkFinal' : 'linkCerrado';
  const t = textoFijo(clave, idioma);
  if (!t) return null;
  const lleno = t.replace('{{link}}', urlRespuestas(narradorId, ahora)).replace('{{fecha}}', plazo === null ? '' : fechaDelPlazo(plazo, d.zona_horaria, idioma));
  return renderizar(lleno, ficha);
}

/**
 * Terminó de contar con la ventana de 24 horas cerrada: el link sale con la plantilla `revision`, si está aprobada y
 * todavía puede sacar algo. Devuelve si ya está todo dicho (se marca `linkFinal`): false solo si Meta la rechazó.
 * Nunca lleva el teléfono ni el token a los avisos.
 */
export async function linkConVentanaCerrada(
  deps: {
    db: SupabaseClient;
    wa: { plantilla(telefono: string, nombre: string, idiomaMeta: string, variables: string[], o?: { botonUrl?: string }): Promise<string> };
    avisar(clave: string, asunto: string, detalle: string): Promise<void>;
  },
  narradorId: string,
  datos: DatosDelLink,
  telefono: string,
  idioma: Idioma,
  o: { lista: boolean; nombre: string; ahora: Date },
): Promise<boolean> {
  const plazo = plazoParaSacar(datos);
  if (plazo === null || plazo <= o.ahora.getTime()) return true;
  const asunto = 'Un narrador terminó y no le llegó su link';
  const clave = `link-final-${narradorId}`;
  if (!o.lista) {
    await deps.avisar(clave, asunto, `${narradorId} terminó con la ventana de WhatsApp cerrada y falta «${idioma}:revision» en WA_PLANTILLAS_V3_LISTAS: no se le puede mandar el link para sacar algo.`);
    return true;
  }
  // {{1}} es el nombre y Meta rechaza una variable vacía.
  if (!o.nombre) {
    await deps.avisar(clave, asunto, `${narradorId} terminó con la ventana de WhatsApp cerrada y no tiene como_le_dicen, que la plantilla necesita.`);
    return true;
  }
  const p = PLANTILLAS_REVISION[idioma].revision;
  let waId: string;
  try {
    waId = await deps.wa.plantilla(telefono, p.nombre, p.idiomaMeta, [o.nombre], { botonUrl: firmarTokenRespuestas(narradorId, o.ahora) });
  } catch (err) {
    console.error(`No salió la plantilla del link de ${narradorId}:`, err instanceof Error ? err.message : err);
    await deps.avisar(clave, asunto, `${narradorId} terminó con la ventana de WhatsApp cerrada y Meta rechazó la plantilla «${p.nombre}». No se le manda el link para sacar algo.`);
    return false;
  }
  // Anotado para que el webhook sepa si Meta lo entregó (entregas.ts). Sin la migración, solo queda en el log.
  const { error } = await deps.db.from('envios').insert({ narrador_id: narradorId, tipo: 'revision', pregunta_orden: null, wa_message_id: waId });
  if (error) console.error(`Salió el link de ${narradorId} pero no pude anotar el envío: ${error.message}`);
  return true;
}

/** El aviso de privacidad que recibe quien cuenta una historia, con el SÍ. La V3 lo lleva en su aceptación. */
export function avisoDePrivacidad(idioma: Idioma, ficha: FichaTexto): string | null {
  return textoFijo('avisoPrivacidad', idioma, ficha);
}

/**
 * Un narrador que ya terminó escribe «mis respuestas»: el bot ya no procesa lo que manda, pero el link se lo damos igual.
 * La ventana está abierta: acaba de escribir. Devuelve si le contestó.
 */
export async function contestarLinkSiLoPide(
  db: SupabaseClient,
  n: { id: string; contexto?: unknown },
  texto: string,
  enviar: (texto: string) => Promise<unknown>,
  ahora: Date = new Date(),
): Promise<boolean> {
  if (!esPrivado(n.contexto)) return false;
  const tabla = (n.contexto as { modo?: unknown } | null | undefined)?.modo === 'historia' ? 'historias' : 'entrevistas_v3';
  const { data, error } = await db.from(tabla).select('idioma, ficha').eq('narrador_id', n.id).maybeSingle();
  if (error || !data) return false;
  const fila = data as { idioma: Idioma; ficha: { nombre: string; genero?: FichaTexto['genero'] } };
  if (!pideMisRespuestas(texto, fila.idioma)) return false;
  const datos = await datosDelLink(db, n.id);
  if (!datos) return false;
  const mensaje = textoDelLink(datos, n.id, fila.idioma, { nombre: fila.ficha.nombre, genero: fila.ficha.genero, idioma: fila.idioma } as FichaTexto, ahora);
  if (!mensaje) return false;
  await enviar(mensaje);
  return true;
}
