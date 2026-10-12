// La alarma de variables al arrancar (12/10). En una semana pasó tres veces lo
// mismo: el código estaba bien y lo apagaba la configuración, sin avisar. La key de
// Anthropic revocada (eso ya lo vigila ia/alarma.ts), WA_PLANTILLAS_V3_LISTAS que no
// existía en Railway (ninguna plantilla V3 salía fuera de las 24 h) y MAIL_SOCIOS
// que faltaba. Y una plantilla cargada con un nombre que el código no busca.
//
// Al arrancar, el servidor revisa las variables que el entrevistador lee y, si falta
// alguna, la anota en el log y manda UN mail a los socios (avisarSocios, una vez por
// día con la marca en Storage). Nunca frena el arranque y nunca tira.
//
// Regla del proyecto: nunca se muestra el valor de una variable, solo su nombre. La
// única excepción son las entradas que no se reconocen en las dos listas de
// plantillas (no son secretas y sin verlas no se encuentra el error de tipeo).
//
// Los interruptores apagados (V3_PARA_NUEVOS, VIAJE_V2_PARA_NUEVOS,
// REGALO_ENTREGA_WHATSAPP, WA_BIENVENIDA_PIDE_VOZ, WA_PLANTILLA_BIENVENIDA_VIAJE,
// V3_CAZADOR=0) están así a propósito: no son una falta. Prendidos, se revisa que
// tengan lo que necesitan.

import { createHash } from 'node:crypto';
import { PLANTILLAS_V3, PLANTILLAS_VIAJE_V2, PLANTILLA_REGALO_ENTREGA } from './config.js';
import { avisarSocios } from './v3/avisos.js';

export type Falta = { variable: string; problema: string };

type Env = NodeJS.ProcessEnv;
const IDIOMAS = ['es-AR', 'es-ES', 'ca'] as const;

const vacia = (env: Env, nombre: string) => !(env[nombre] ?? '').trim();
const prendido = (env: Env, nombre: string) => (env[nombre] ?? '').trim() === '1';
const entradas = (env: Env, nombre: string) => (env[nombre] ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/** Las que el código exige (config.ts): sin ellas el servidor no arranca. */
const OBLIGATORIAS = [
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY',
  'WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN',
] as const;

/** Las que no frenan el arranque pero, si faltan, apagan algo sin avisar. */
const NECESARIAS: ReadonlyArray<readonly [string, string]> = [
  ['RESEND_API_KEY', 'No sale ningún mail del entrevistador (hitos y regalos a las familias, avisos a los socios).'],
  ['MAIL_SOCIOS', 'Los avisos a los socios quedan solo en el log de Railway y nadie se entera.'],
  ['WA_PLANTILLAS_V3_LISTAS', 'Fuera de la ventana de 24 h no sale ninguna plantilla V3 salvo la pregunta en es-AR. Ni recordatorios, ni bienvenidas V3 y de regalo, ni preguntas en es-ES y ca, ni el regalo por WhatsApp el día elegido.'],
  ['WHATSAPP_NUMERO_PUBLICO', 'El mail del regalo del día elegido sale sin el código para escribirle al bot.'],
  ['SUGERIDAS_CLAVE', 'La ruta /sugeridas no existe y el panel de la web no puede pedir sugerencias de preguntas.'],
];

const VALIDAS_V3 = new Set(IDIOMAS.flatMap((i) => [...Object.keys(PLANTILLAS_V3[i]), 'regalo_entrega'].map((c) => `${i}:${c}`)));
const VALIDAS_VIAJE = new Set(IDIOMAS.flatMap((i) => Object.keys(PLANTILLAS_VIAJE_V2[i]).map((c) => `${i}:${c}`)));

/** Nombre de Meta → la entrada que va en la lista (el error de regalo_entrega_vos). */
const POR_NOMBRE_META_V3 = new Map<string, string>(IDIOMAS.flatMap((i) => [
  ...Object.entries(PLANTILLAS_V3[i]).map(([c, p]) => [p.nombre, `${i}:${c}`] as [string, string]),
  [PLANTILLA_REGALO_ENTREGA[i].nombre, `${i}:regalo_entrega`] as [string, string],
]));
const POR_NOMBRE_META_VIAJE = new Map<string, string>(IDIOMAS.flatMap((i) =>
  Object.entries(PLANTILLAS_VIAJE_V2[i]).map(([c, p]) => [p.nombre, `${i}:${c}`] as [string, string])));

function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

/** Qué entrada quiso poner: la del nombre de Meta, o una válida a 2 letras o menos. */
function sugerencia(entrada: string, validas: Set<string>, porNombreMeta: Map<string, string>): string | null {
  const cual = entrada.slice(entrada.indexOf(':') + 1);
  const porMeta = porNombreMeta.get(cual);
  if (porMeta) return porMeta;
  let mejor: string | null = null;
  let menor = 3;
  for (const v of validas) {
    const dd = distancia(entrada, v);
    if (dd < menor) { menor = dd; mejor = v; }
  }
  return mejor;
}

function desconocidas(env: Env, nombre: string, validas: Set<string>, porNombreMeta: Map<string, string>): Falta[] {
  const malas = entradas(env, nombre).filter((e) => !validas.has(e));
  if (malas.length === 0) return [];
  const detalle = malas.map((e) => {
    const s = sugerencia(e, validas, porNombreMeta);
    return s ? `«${e}» (¿quisiste poner «${s}»?)` : `«${e}»`;
  }).join(', ');
  return [{
    variable: nombre,
    problema: `Tiene entradas que el código no reconoce y por eso no cuentan, ${detalle}. Cada entrada es idioma:clave (por ejemplo es-AR:bienvenida), no el nombre de la plantilla en Meta.`,
  }];
}

/** Lo que necesita un interruptor prendido y no está en la lista. */
function faltanEnLista(env: Env, interruptor: string, lista: string, requeridas: string[], queHace: string): Falta[] {
  if (!prendido(env, interruptor)) return [];
  const hay = new Set(entradas(env, lista));
  return requeridas.filter((r) => !hay.has(r)).map((r) => ({
    variable: lista,
    problema: `${interruptor} está prendido pero la lista no tiene «${r}». ${queHace}`,
  }));
}

/**
 * Qué variables faltan o están mal, con qué deja de andar por cada una. Puro: solo
 * lee `env`. Nunca devuelve valores (salvo entradas desconocidas de las listas de plantillas).
 */
export function revisarVariables(env: Env = process.env): Falta[] {
  const faltas: Falta[] = [];
  for (const nombre of OBLIGATORIAS) {
    if (vacia(env, nombre)) faltas.push({ variable: nombre, problema: 'Es obligatoria. Sin ella el entrevistador no arranca.' });
  }
  for (const [nombre, problema] of NECESARIAS) {
    if (vacia(env, nombre)) faltas.push({ variable: nombre, problema: `No existe o está vacía. ${problema}` });
  }

  faltas.push(...desconocidas(env, 'WA_PLANTILLAS_V3_LISTAS', VALIDAS_V3, POR_NOMBRE_META_V3));
  faltas.push(...desconocidas(env, 'WA_PLANTILLAS_VIAJE_V2_LISTAS', VALIDAS_VIAJE, POR_NOMBRE_META_VIAJE));

  faltas.push(...faltanEnLista(env, 'V3_PARA_NUEVOS', 'WA_PLANTILLAS_V3_LISTAS', ['es-AR:bienvenida', 'es-AR:recordatorio'],
    'Los narradores nuevos entran a la V3 y sin esa plantilla no les sale la bienvenida o el recordatorio.'));
  faltas.push(...faltanEnLista(env, 'VIAJE_V2_PARA_NUEVOS', 'WA_PLANTILLAS_VIAJE_V2_LISTAS', ['es-AR:bienvenida', 'es-AR:mensaje'],
    'Los viajeros nuevos van a la Viaje V2 y sin esa plantilla no les sale la bienvenida o los mensajes.'));
  // REGALO_ENTREGA_WHATSAPP vive en Vercel (la web ofrece WhatsApp). Si también está en
  // Railway, se revisa acá que el bot tenga las tres plantillas: sin ellas el regalo cae en «dásela vos».
  faltas.push(...faltanEnLista(env, 'REGALO_ENTREGA_WHATSAPP', 'WA_PLANTILLAS_V3_LISTAS', IDIOMAS.map((i) => `${i}:regalo_entrega`),
    'La web ofrece mandar el regalo por WhatsApp el día elegido y en ese idioma no sale.'));

  // Si la lista de Viaje V2 falta del todo con el interruptor prendido, se dice una vez.
  if (prendido(env, 'VIAJE_V2_PARA_NUEVOS') && vacia(env, 'WA_PLANTILLAS_VIAJE_V2_LISTAS')) {
    const sinDuplicar = faltas.filter((f) => f.variable !== 'WA_PLANTILLAS_VIAJE_V2_LISTAS');
    sinDuplicar.push({
      variable: 'WA_PLANTILLAS_VIAJE_V2_LISTAS',
      problema: 'No existe o está vacía y VIAJE_V2_PARA_NUEVOS está prendido. A los viajeros nuevos no les sale ninguna plantilla de la Viaje V2.',
    });
    return sinDuplicar;
  }
  return faltas;
}

export const CLAVE_AVISO_VARIABLES = 'variables-entrevistador';
export const ASUNTO_VARIABLES = 'Al entrevistador le faltan variables en Railway';

/**
 * Al arrancar: revisa, anota en el log y avisa a los socios una vez por día (la clave
 * lleva una huella de la lista, así que si cambia vuelve a avisar). Sin
 * MAIL_SOCIOS o sin RESEND_API_KEY no hay a quién mandarlo: solo log fuerte. Nunca tira.
 */
export async function avisarVariablesAlArrancar(o: {
  env?: Env;
  avisar?: (clave: string, asunto: string, detalle: string) => Promise<boolean>;
} = {}): Promise<'ok' | 'avisado' | 'solo-log'> {
  try {
    const env = o.env ?? process.env;
    const faltas = revisarVariables(env);
    if (faltas.length === 0) {
      console.log('variables: el entrevistador tiene todas las variables que necesita.');
      return 'ok';
    }
    const lista = faltas.map((f) => `- ${f.variable}. ${f.problema}`).join('\n');
    console.error(`VARIABLES QUE FALTAN EN EL ENTREVISTADOR (${faltas.length})\n${lista}`);
    if (vacia(env, 'MAIL_SOCIOS') || vacia(env, 'RESEND_API_KEY')) {
      console.error('variables: sin MAIL_SOCIOS o sin RESEND_API_KEY no hay a quién mandar este aviso. Queda solo en este log.');
      return 'solo-log';
    }
    const detalle =
      'Al arrancar, el entrevistador encontró esto en sus variables de Railway.\n\n' +
      `${lista}\n\n` +
      'Acá van solo los nombres, nunca los valores.\n' +
      'Este aviso sale una vez por día mientras siga igual.';
    // La clave lleva una huella de la lista: si mañana falta otra cosa (o se arregla una), es otro aviso.
    const huella = createHash('sha1').update(lista).digest('hex').slice(0, 12);
    await (o.avisar ?? avisarSocios)(`${CLAVE_AVISO_VARIABLES}:${huella}`, ASUNTO_VARIABLES, detalle);
    return 'avisado';
  } catch (err) {
    console.error('variables: no pude avisar las variables que faltan:', err instanceof Error ? err.message : err);
    return 'solo-log';
  }
}
