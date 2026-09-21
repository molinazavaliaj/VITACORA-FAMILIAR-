/**
 * El trato del entrevistador: ¿le habla de usted o de vos?
 *
 * Hasta el 2026-09-15 estaba clavado en el prompt ("Tratalo de usted"), de
 * cuando el narrador era siempre un abuelo. Con el primer narrador de 28 años
 * la pregunta 1 salió "cuénteme... si cierra los ojos", que suena a formulario.
 *
 * Se decide UNA sola vez por narrador, con la ficha que cargó la familia, y
 * queda guardado en `contexto.trato`. No se vuelve a pensar: un narrador que
 * recibe "vos" el lunes y "usted" el martes es peor que uno tratado siempre
 * de usted.
 *
 * Ante cualquier duda —ficha vacía, la API se cayó, el modelo contestó
 * cualquier cosa— gana `usted`: con un desconocido el usted nunca ofende.
 */
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { fichaEnTexto } from './ficha.js';
import { registrarUso, cuentaDeEsteServicio } from '../costos.js';

export type Trato = 'usted' | 'vos';

/** Una decisión de una palabra: el modelo más chico alcanza y de sobra. */
const MODELO = 'claude-haiku-4-5';
const MAX_TOKENS = 10;

export type NarradorParaTrato = {
  id: string;
  como_le_dicen: string;
  contexto: Record<string, any>;
};

export function esTrato(valor: unknown): valor is Trato {
  return valor === 'usted' || valor === 'vos';
}

/**
 * ¿Hay algo en la ficha con qué decidir?
 *
 * Importa más de lo que parece: hoy el checkout no pide un solo dato de la
 * ficha, así que un cliente real llega con el contexto lleno de mecánica
 * (`modoRapido`, `preguntasEnviadas`) y cero datos de la persona. Preguntarle
 * al modelo con eso es pagar una llamada para que adivine.
 */
export function fichaTieneDatos(contexto: Record<string, any> = {}): boolean {
  const c = contexto ?? {};
  const arbol = c.arbol;
  const hayArbol =
    typeof arbol === 'object' && arbol !== null &&
    Object.values(arbol).some((v) => typeof v === 'string' && v.trim() !== '');
  return Boolean(
    c.anioNacimiento || c.lugarNacimiento || c.oficio || c.datosExtra || c.vinculoComprador || hayArbol,
  );
}

/**
 * La edad de hoy, no el año de nacimiento.
 *
 * El modelo tiene que poder decidir sin calcular: qué año es hoy es justamente
 * lo que peor sabe. Devuelve null si el año no es creíble.
 */
export function edadHoy(anioNacimiento: unknown, hoy = new Date()): number | null {
  const anio = Number(anioNacimiento);
  if (!Number.isInteger(anio)) return null;
  const edad = hoy.getFullYear() - anio;
  return edad >= 0 && edad <= 120 ? edad : null;
}

export const PROMPT_TRATO = (ficha: string, edad: number | null = null) => `Sos el biógrafo que le va a escribir todos los días por WhatsApp a esta persona, durante un mes, para escribir el libro de su vida.

QUIÉN ES:
${ficha}${edad === null ? '' : `\nHoy tiene alrededor de ${edad} años.`}

¿Le hablás de usted o de vos? Pensalo como lo pensaría alguien con calle: la edad que tiene, de dónde es, quién lo mandó a entrevistar.
${edad === null ? '' : `
Si sabés la edad, ese dato MANDA: a una persona mayor se le habla de usted; a un adulto joven, de vos. Tratar de usted a alguien de treinta años no es respeto — lo convierte en un trámite, y lo que queremos es que se suelte a contar.
`}
Ante la duda, usted: con un desconocido el usted nunca ofende, el vos sí puede. Pero la duda es no tener el dato, no tenerlo y no animarse.

Respondé SOLO con una palabra: usted o vos.`;

let _cliente: Anthropic | null = null;
const cliente = () => (_cliente ??= new Anthropic({ apiKey: cargarConfig().anthropicKey }));

/** null = no se pudo decidir (y entonces no se guarda nada: se reintenta después). */
async function decidir(n: NarradorParaTrato): Promise<Trato | null> {
  if (!fichaTieneDatos(n.contexto)) return null;
  try {
    const respuesta = await cliente().messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      messages: [{
        role: 'user',
        content: PROMPT_TRATO(fichaEnTexto(n.contexto, n.como_le_dicen), edadHoy(n.contexto?.anioNacimiento)),
      }],
    });
    await registrarUso(db, {
      servicio: 'entrevistador', paso: 'trato', modelo: MODELO, proveedor: 'anthropic',
      cuenta: cuentaDeEsteServicio(), narradorId: n.id, uso: respuesta.usage,
    });
    const bloque = respuesta.content.find((b) => b.type === 'text');
    const palabra = bloque && bloque.type === 'text'
      ? bloque.text.trim().toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')
      : '';
    return esTrato(palabra) ? palabra : 'usted';
  } catch (err) {
    console.warn(`trato: no pude decidir el de ${n.id}, va usted:`, err);
    return null;
  }
}

/**
 * El trato de este narrador. Lo decide la primera vez y lo guarda; de ahí en
 * más devuelve lo guardado sin pensar ni pagar.
 */
export async function tratoDe(n: NarradorParaTrato): Promise<Trato> {
  if (esTrato(n.contexto?.trato)) return n.contexto.trato;

  const elegido = await decidir(n);
  if (!elegido) return 'usted';

  // Se muta el MISMO objeto (no se reemplaza): `recordarEnviada` de
  // personalizar.ts guarda `{ ...n.contexto, preguntasEnviadas }` con la copia
  // que tiene en la mano, y si el trato no está ahí adentro lo borra de la base.
  n.contexto ??= {};
  n.contexto.trato = elegido;
  const { error } = await db.from('narradores').update({ contexto: n.contexto }).eq('id', n.id);
  if (error) console.error(`trato: no pude guardar el de ${n.id}:`, error.message);
  return elegido;
}
