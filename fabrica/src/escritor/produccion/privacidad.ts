// Privacidad del panel en la fábrica (Naza y Joaquín, 05/11; CONTRATO, «Lo contado es privado»). La misma regla que
// loContadoEsPrivado de la web (web/src/lib/panel.ts): en Familiar y en una historia, si el libro es para otra persona,
// quien regala no ve lo contado. Viaje y Kids siguen igual, y «para mí» no cambia. Sin vínculo cargado, cuenta como regalo.
//
// Acá viven las dos esperas por quien contó: 48 horas desde su último mensaje para sacar lo que quiera y 72 para
// contestar las dudas (Naza, 06/11: las dudas de un libro privado o «Para mí» van a quien contó; un regalo no privado sigue
// con el mail a la familia y la espera de siempre). Las dos tienen fin aunque nadie escriba nada: un mensaje que no salió
// nunca traba un libro.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Almacen } from '../almacen/tipos.js';
import { avisarSocios } from './avisos.js';

type Db = SupabaseClient;

export function esPrivado(contexto: unknown): boolean {
  const c = contexto as { modo?: unknown; vinculoComprador?: unknown } | null | undefined;
  if (c?.modo === 'viaje' || c?.modo === 'kids') return false;
  return c?.vinculoComprador !== 'yo mismo';
}

/**
 * Por donde pasan las decisiones de las dudas y las esperas. `esPrivado` sigue siendo la única fuente de la regla; esto
 * deja que un test simule sus dos respuestas (`vi.spyOn(regla, 'esPrivado')`), sin depender de la definición de hoy.
 */
export const regla = { esPrivado };

/** «Para mí» en la compra: el libro es de quien lo compró (mismo criterio que esPropia en web/src/lib/panel.ts). */
export function esLibroPropio(contexto: unknown): boolean {
  return (contexto as { vinculoComprador?: unknown } | null | undefined)?.vinculoComprador === 'yo mismo';
}

// ---------------------------------------------------------------- las 48 horas del narrador

/** Lo que tiene el narrador, desde su último mensaje, para sacar algo del libro. La web usa el mismo número. */
export const HORAS_PARA_SACAR = 48;
const MS_PARA_SACAR = HORAS_PARA_SACAR * 60 * 60 * 1000;

/** Hasta cuándo puede sacar algo. Null si no es privado o si todavía no contó nada. */
export function plazoParaSacar(n: { contexto?: unknown; ultima_respuesta_at?: string | null }): number | null {
  if (!regla.esPrivado(n.contexto) || !n.ultima_respuesta_at) return null;
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

// ---------------------------------------------------------------- las esperas

/** ISO, lo escribe el entrevistador: salió el aviso de las dudas. Vacío: una Etapa A rehecha lo dejó sin valor (CONTRATO). */
export const DUDAS_NARRADOR_AVISADAS = 'dudas-narrador-avisadas.txt';
const MS_PLAZO_DUDAS = 72 * 60 * 60 * 1000;
const MS_VOLVER_A_MIRAR = 15 * 60 * 1000;
/** La marca la escribe otro servicio: unos minutos de diferencia entre relojes no la hacen «del futuro». */
const MS_RELOJES = 5 * 60 * 1000;

/**
 * ¿Las dudas se las preguntamos a quien contó, con el plazo de 72 horas? Privados y «Para mí». Lo demás (un regalo en curso
 * sin marca, alguien que eligió a su familia, viaje, kids) no recibe ese WhatsApp: sigue con el prompt para la familia, el
 * mail `dudas` y la espera de `ESCRITOR_ESPERA_DUDAS_HORAS`. Es la única decisión: nada de esto mira el vínculo por su cuenta.
 */
export function dudasAQuienConto(contexto: unknown): boolean {
  return regla.esPrivado(contexto) || esLibroPropio(contexto);
}

/** El `contexto` del narrador. Si la base falla, tira: quien llama reintenta. */
export async function contextoDe(db: Db, narradorId: string): Promise<unknown> {
  const { data, error } = await db.from('narradores').select('contexto').eq('id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer al narrador ${narradorId}: ${error.message}`);
  return (data as { contexto?: unknown } | null)?.contexto ?? null;
}

/**
 * Cuánto tarda en volver a reclamarse un pedido que espera: poco, porque lo que lo libera llega de afuera (la última
 * respuesta a las dudas) y el libro tiene que seguir enseguida, no al vencer el plazo.
 */
export const volverAMirarEn = (espera: number): number => Math.min(espera, MS_VOLVER_A_MIRAR);

/** La fecha de una marca. Ausente, vacía, rota o del futuro, null: se la toma como si no estuviera. */
const fecha = (texto: string | null, ahora: number): number | null => {
  const f = Date.parse(texto?.trim() ?? '');
  return Number.isFinite(f) && f <= ahora + MS_RELOJES ? f : null;
};

/** ¿Esta marca sirve para contar el plazo? Si no, hay que volver a escribirla. */
export const marcaVigente = (texto: string | null, ahora: number = Date.now()): boolean => fecha(texto, ahora) !== null;

/**
 * Cuántos ms faltan del plazo de las dudas: desde dudas-narrador-avisadas.txt o, si nunca salió, desde `desdeRespaldo`
 * (el ISO de dudas-avisadas.txt, el mail a los socios). Una fecha del futuro no cuenta: trabaría el libro hasta esa fecha.
 * Sin ninguna que sirva, el plazo entero.
 */
export async function restaPlazoDudas(almacen: Almacen, desdeRespaldo: string | null, ahora: number = Date.now()): Promise<number> {
  const desde = fecha(await almacen.leer(DUDAS_NARRADOR_AVISADAS), ahora) ?? fecha(desdeRespaldo, ahora) ?? ahora;
  return Math.max(0, Math.min(MS_PLAZO_DUDAS, desde + MS_PLAZO_DUDAS - ahora));
}

// ---------------------------------------------------------------- venció el plazo sin todas las respuestas

/** ISO: los socios ya saben que este libro se escribe con dudas sin contestar. Vacío: una Etapa A rehecha lo dejó sin valor. */
export const DUDAS_SIN_CONTESTAR_AVISADAS = 'dudas-sin-contestar-avisadas.txt';

/**
 * El libro de quien contó va a empezar a escribirse: llamar recién cuando ya no hay nada que esperar. Si quedan dudas sin
 * contestar, venció el plazo y los socios se enteran, una vez. La marca se escribe solo si el mail salió. Nunca tira: el
 * libro no se frena por un aviso.
 */
export async function avisarDudasSinContestar(
  almacen: Almacen,
  o: { contexto: unknown; archivoDudas: string; quien: () => Promise<string>; correcciones: () => Promise<{ dudaId?: string; texto: string }[]> },
): Promise<void> {
  try {
    if (!dudasAQuienConto(o.contexto)) return;
    if ((await almacen.leer(DUDAS_SIN_CONTESTAR_AVISADAS))?.trim()) return;
    const t = await almacen.leer(o.archivoDudas);
    const dudas = (t ? (JSON.parse(t) as { dudas?: { id?: unknown }[] }).dudas : []) ?? [];
    const conTexto = new Set((await o.correcciones()).filter((c) => c.dudaId && c.texto.trim()).map((c) => c.dudaId));
    const n = dudas.filter((d) => typeof d?.id !== 'string' || !conTexto.has(d.id)).length;
    if (n === 0) return;
    const quien = await o.quien();
    const cuantas = n === 1 ? '1 duda' : `${n} dudas`;
    const salio = await avisarSocios(
      `El libro de ${quien} empieza con ${cuantas} sin contestar`,
      `Se empieza a escribir el libro de ${quien} con ${cuantas} sin contestar. Quien contó no las respondió en el plazo.`,
    );
    if (salio) await almacen.escribir(DUDAS_SIN_CONTESTAR_AVISADAS, new Date().toISOString());
  } catch (err) {
    console.error('escritor: no pude avisar de las dudas sin contestar:', err instanceof Error ? err.message : err);
  }
}
