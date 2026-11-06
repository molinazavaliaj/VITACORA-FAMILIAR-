// Privacidad del panel en la fábrica (Naza y Joaquín, 05/11; CONTRATO, «Lo contado es privado»). La misma regla que
// loContadoEsPrivado de la web (web/src/lib/panel.ts): en las ventas nuevas de Familiar e Historia para otra persona, salvo
// que el narrador elija a su familia, quien regala no ve lo contado. Sin la marca `contexto.acceso`, todo sigue como siempre.
//
// Acá viven tres cosas de esa regla: a quién se le pregunta cada duda, cuánto espera el libro al narrador (48 horas para
// sacar lo que quiera) y el freno de la imprenta («Hay un error, avisanos»).
import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import type { Almacen } from '../almacen/tipos.js';
import { HAIKU } from '../modelo/configuracion.js';
import { vigilarClave } from '../../alarma-anthropic.js';
import { avisarSocios } from './avisos.js';

type Db = SupabaseClient;

// Solo las ventas nuevas, y solo si el narrador no eligió a su familia (Joaquín, 05/11; web/src/lib/acceso-contenido.ts).
export function esPrivado(contexto: unknown): boolean {
  const a = (contexto as { acceso?: { elige?: unknown; quien?: unknown } } | null | undefined)?.acceso;
  return a?.elige === true && a.quien !== 'familia';
}

// ---------------------------------------------------------------- las 48 horas del narrador

/** Lo que tiene el narrador, desde su último mensaje, para sacar algo del libro. La web usa el mismo número. */
export const HORAS_PARA_SACAR = 48;
const MS_PARA_SACAR = HORAS_PARA_SACAR * 60 * 60 * 1000;

/** Hasta cuándo puede sacar algo. Null si no es privado o si todavía no contó nada. */
export function plazoParaSacar(n: { contexto?: unknown; ultima_respuesta_at?: string | null }): number | null {
  if (!esPrivado(n.contexto) || !n.ultima_respuesta_at) return null;
  const t = Date.parse(n.ultima_respuesta_at);
  return Number.isFinite(t) ? t + MS_PARA_SACAR : null;
}

/** Cuántos ms faltan para que el libro se pueda escribir (0 = ya). Si la base falla, tira: quien llama reintenta. */
export async function esperaPorElNarrador(db: Db, narradorId: string, ahora: number = Date.now()): Promise<number> {
  const { data, error } = await db.from('narradores').select('contexto, ultima_respuesta_at').eq('id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer al narrador ${narradorId}: ${error.message}`);
  const plazo = plazoParaSacar((data as { contexto?: unknown; ultima_respuesta_at?: string | null } | null) ?? {});
  return plazo === null ? 0 : Math.max(0, plazo - ahora);
}

// ---------------------------------------------------------------- a quién se le pregunta cada duda

/** Lo deja la fábrica en la carpeta del escritor; lo lee la web. Mismo nombre en web/src/lib/dudas.ts. */
export const DESTINO_DUDAS = 'dudas-destino.json';
const OCULTAS_AVISADAS = 'dudas-ocultas-avisadas.txt';
const OCULTAS_AL_ESCRIBIR = 'dudas-ocultas-al-escribir.txt';

export type DudaParaClasificar = { id: string; pregunta: string; opciones?: string[] };
export type Destino = 'familia' | 'narrador';
export type DudaConDestino = { id: string; pregunta: string; destino: Destino };

/** Una sola llamada al modelo: recibe el pedido y devuelve el texto. Inyectable, para probar sin red. */
export type PedirClasificacion = (sistema: string, pedido: string) => Promise<string>;

export const PROMPT_CLASIFICAR_DUDAS = `Una persona le regaló a un familiar un libro con su historia. El familiar la cuenta por WhatsApp y lo que cuenta es privado: quien regaló no lo conoce hasta que el libro esté listo.

El escritor del libro tiene dudas de datos. Para cada duda, decidí si se le puede preguntar a quien regaló sin revelarle nada de lo que contó el narrador.

- "familia": un dato que no revela nada, porque cualquier familiar lo sabe sin haber oído la entrevista. Por ejemplo, cómo se escribe el apellido de la familia, o el año en que nació el narrador.
- "narrador": la pregunta o sus opciones dejan ver una persona, un hecho, un lugar, un episodio o un sentimiento que contó el narrador.

Si no estás seguro, es "narrador".

Respondé solo con JSON, sin nada más: {"dudas":[{"id":"D01","destino":"familia"}]}`;

async function pedirAlModelo(sistema: string, pedido: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('falta ANTHROPIC_API_KEY');
  const r = await vigilarClave(new Anthropic({ apiKey, maxRetries: 2 }), 'las dudas').messages.create({ model: HAIKU, max_tokens: 2000, system: sistema, messages: [{ role: 'user', content: pedido }] });
  return r.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
}

/** Lo que no vuelve clasificado como `familia`, va al narrador. Si la respuesta no se entiende, tira. */
export function leerClasificacion(texto: string, dudas: DudaParaClasificar[]): DudaConDestino[] {
  const desde = texto.indexOf('{');
  const hasta = texto.lastIndexOf('}');
  const j = JSON.parse(desde >= 0 ? texto.slice(desde, hasta + 1) : texto) as { dudas?: { id?: unknown; destino?: unknown }[] };
  if (!Array.isArray(j?.dudas)) throw new Error('la clasificación no trae la lista "dudas"');
  const familia = new Set(j.dudas.filter((d) => d?.destino === 'familia').map((d) => d.id));
  return dudas.map((d) => ({ id: d.id, pregunta: d.pregunta, destino: familia.has(d.id) ? 'familia' : 'narrador' }));
}

/** ¿El archivo clasifica todas estas dudas, con este mismo texto? Una Etapa A nueva puede traer otras. */
export function clasificacionVigente(dudas: { id?: string; pregunta?: string }[], destinoTexto: string | null): boolean {
  if (!destinoTexto) return false;
  try {
    const lista = (JSON.parse(destinoTexto) as { dudas?: DudaConDestino[] }).dudas ?? [];
    return dudas.every((d) => lista.some((x) => x.id === d.id && x.pregunta === d.pregunta));
  } catch {
    return false;
  }
}

/** Las dudas que se le pueden preguntar a quien regala. Como dudasParaQuienRegala de la web. Sin clasificar, ninguna. */
export function dudasVisibles<T extends { id?: string; pregunta?: string }>(dudas: T[], destinoTexto: string | null): T[] {
  if (!destinoTexto) return [];
  try {
    const lista = (JSON.parse(destinoTexto) as { dudas?: DudaConDestino[] }).dudas ?? [];
    return dudas.filter((d) => lista.some((x) => x.id === d.id && x.pregunta === d.pregunta && x.destino === 'familia'));
  } catch {
    return [];
  }
}

async function contextoDe(db: Db, narradorId: string): Promise<unknown> {
  const { data, error } = await db.from('narradores').select('contexto').eq('id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer al narrador ${narradorId}: ${error.message}`);
  return (data as { contexto?: unknown } | null)?.contexto ?? null;
}

const leerDudasDe = async (almacen: Almacen, archivo: string): Promise<DudaParaClasificar[]> => {
  const t = await almacen.leer(archivo);
  return (t ? ((JSON.parse(t) as { dudas?: DudaParaClasificar[] }).dudas ?? []) : []).filter((d) => typeof d?.id === 'string');
};

/**
 * Las dudas tal como cuentan para esta historia: todas o, si es privada, solo las que no revelan nada. Las ocultas no
 * cuentan como pendientes en la espera, en el aviso del panel ni en los mails a la familia. Null: es privada y todavía
 * no se clasificaron, así que no se sabe.
 */
export async function dudasQueCuentan<T extends { id?: string; pregunta?: string }>(db: Db, narradorId: string, almacen: Almacen, dudas: T[]): Promise<T[] | null> {
  if (!dudas.length || !esPrivado(await contextoDe(db, narradorId))) return dudas;
  const destino = await almacen.leer(DESTINO_DUDAS);
  if (!clasificacionVigente(dudas, destino)) return null;
  return dudasVisibles(dudas, destino);
}

/**
 * Clasifica las dudas de una historia privada, si faltan, y avisa a los socios de las que quedan ocultas: entre este PR
 * y el que se las pregunta al narrador por WhatsApp, un libro puede salir con ellas sin contestar (Naza, 05/11).
 *
 * `siFalla`: `esperar` no escribe nada y se reintenta en el próximo tick. `alNarrador` las oculta todas, para no frenar
 * un libro ya encargado: ante la duda, va al narrador.
 */
export async function asegurarDestinoDudas(
  db: Db,
  narradorId: string,
  almacen: Almacen,
  o: { quien: string; archivoDudas: string; siFalla: 'esperar' | 'alNarrador'; pedir?: PedirClasificacion },
): Promise<void> {
  const dudas = await leerDudasDe(almacen, o.archivoDudas);
  if (!dudas.length) return;
  if (!esPrivado(await contextoDe(db, narradorId))) return;
  if (clasificacionVigente(dudas, await almacen.leer(DESTINO_DUDAS))) return;
  let clasificadas: DudaConDestino[];
  try {
    const pedido = JSON.stringify(dudas.map((d) => ({ id: d.id, pregunta: d.pregunta, opciones: d.opciones ?? [] })));
    clasificadas = leerClasificacion(await (o.pedir ?? pedirAlModelo)(PROMPT_CLASIFICAR_DUDAS, pedido), dudas);
  } catch (err) {
    console.error(`escritor ${narradorId}: no pude clasificar las dudas:`, err instanceof Error ? err.message : err);
    if (o.siFalla === 'esperar') return;
    clasificadas = dudas.map((d) => ({ id: d.id, pregunta: d.pregunta, destino: 'narrador' }));
  }
  await almacen.escribir(DESTINO_DUDAS, JSON.stringify({ dudas: clasificadas }, null, 2));
  await almacen.escribir(OCULTAS_AVISADAS, '');
  await almacen.escribir(OCULTAS_AL_ESCRIBIR, '');
  const ocultas = clasificadas.filter((d) => d.destino === 'narrador');
  if (!ocultas.length) return;
  const salio = await avisarSocios(
    `El libro de ${o.quien} tiene ${ocultas.length === 1 ? 'una duda oculta' : `${ocultas.length} dudas ocultas`}`,
    `Estas dudas revelan algo de lo que contó, así que no se le preguntan a quien regaló. Todavía no le llegan al narrador por WhatsApp: si nadie las contesta, el libro sale sin esas respuestas.\n\n`
      + `${ocultas.map((d) => `- ${d.id}: ${d.pregunta}`).join('\n')}\n\n`
      + `Para contestar alguna a mano, sumala a correcciones.json antes de que se escriba el libro (${narradorId}).`,
  );
  if (salio) await almacen.escribir(OCULTAS_AVISADAS, new Date().toISOString());
}

/** Justo antes de escribir el libro: una última vez, si quedan dudas ocultas sin contestar. Una vez por clasificación. */
export async function avisarOcultasSinContestar(
  db: Db,
  narradorId: string,
  almacen: Almacen,
  o: { quien: string; archivoDudas: string; contestadas: ReadonlySet<string | undefined> },
): Promise<void> {
  const dudas = await leerDudasDe(almacen, o.archivoDudas);
  if (!dudas.length || !esPrivado(await contextoDe(db, narradorId))) return;
  if ((await almacen.leer(OCULTAS_AL_ESCRIBIR))?.trim()) return;
  const visibles = new Set(dudasVisibles(dudas, await almacen.leer(DESTINO_DUDAS)).map((d) => d.id));
  const sinContestar = dudas.filter((d) => !visibles.has(d.id) && !o.contestadas.has(d.id));
  if (!sinContestar.length) return;
  const salio = await avisarSocios(
    `Se empieza a escribir el libro de ${o.quien} con ${sinContestar.length} dudas ocultas sin contestar`,
    `El libro sale sin estas respuestas. Si alguna es importante, frená el pedido ahora.\n\n${sinContestar.map((d) => `- ${d.id}: ${d.pregunta}`).join('\n')}\n\n(${narradorId})`,
  );
  if (salio) await almacen.escribir(OCULTAS_AL_ESCRIBIR, new Date().toISOString());
}
