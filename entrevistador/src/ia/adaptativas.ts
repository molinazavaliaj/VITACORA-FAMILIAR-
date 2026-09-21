import Anthropic from '@anthropic-ai/sdk';
import { registrarUso, cuentaDeEsteServicio } from '../costos.js';
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { armarHistoria } from '../db/historia.js';
import { capitulosDe, tieneAdaptativas, ultimoOrden } from '../db/guion.js';
import { textoEvitar } from './evitar.js';
import { tratoDe, type Trato } from './trato.js';

const MODELO = 'claude-opus-5';
/** Cuántas escribe el biógrafo al final. Se insertan después de la última que exista (§11.2). */
export const CANTIDAD = 4;
/**
 * @deprecated Desde el 14/09 las adaptativas van en N+1..N+4 (N = la última del
 * guion propio), no fijas en 27-30. Quedan solo para `scripts/manual.ts` (Naza),
 * que sigue asumiendo el guion de 26. No usar en código nuevo.
 */
export const PRIMERA_ADAPTATIVA = 27;
export const ULTIMA_ADAPTATIVA = 30;
// Con 2000 el modelo se quedaba sin lugar y devolvía un JSON cortado por la mitad:
// JSON.parse explotaba y el narrador quedaba sin las preguntas 27-30 justo el día 26.
export const MAX_TOKENS = 4000;
const INTENTOS = 2;
/**
 * La pausa antes del reintento (bitácora 14 y 28): casi siempre el fallo es un
 * hipo de la API y con dos segundos alcanza. Los tests la apagan con
 * `pausaMs: 0`.
 */
export const PAUSA_REINTENTO_MS = 2000;
const esperar = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());

export const PROMPT_ADAPTATIVAS = (nombre: string, historiaCompleta: string, capitulos: string[], cuantasContestadas = 26, evitar = '', trato: Trato = 'usted') => `
Leíste la historia de vida completa que ${nombre} contó en ${cuantasContestadas} entrevistas
(el guion capítulo por capítulo, y su vida entera resumida en cinco minutos):

${historiaCompleta}
${evitar}
Sos su biógrafo y te quedan exactamente 4 preguntas para completar el libro. Buscá:
- Personas que nombró varias veces pero nunca exploró (un hermano, un amigo, un maestro).
- Épocas o momentos con huecos evidentes.
- Temas emocionales que tocó de pasada y merecen profundidad.
- Algo que claramente disfrutó contar y da para más.

Generá las 4 preguntas en el orden en que se las harías. Cada una debe sonar a que LO ESCUCHASTE
(referí lo que él contó), tratarlo de ${trato}, y ser una sola pregunta clara.

MUY IMPORTANTE — las va a leer en el celular${trato === 'usted' ? ' una persona mayor' : ''}:
- Máximo 45 palabras cada pregunta. Las del guion tienen ese largo; respetalo.
- Un solo detalle concreto para demostrar que lo escuchaste, no una lista de todo lo que contó.
- Una sola pregunta por cada una, no tres encadenadas.

DOS COSAS QUE NO SE HACEN (salieron en el piloto y son dolor gratuito):
1. No preguntes lo que ya contestó: si una de las 4 preguntas cae en algo que él ya dio en la historia, se reemplaza por lo que quedó abierto. Y si negó algo —"no tengo hijos", "nunca me casé", "vamos por otro lado", "no hablemos de eso"— no se le pregunta por eso de ninguna forma, ni como suposición ni como condicional.
2. No supongas la vida del guion: nada de "tus nietos", "el día de la boda", "los domingos en familia" si él no los nombró. La infancia no fue linda por defecto: un narrador contestó "esto no era una película de Disney" cuando le preguntaron por los domingos familiares. Si el material muestra una familia desarticulada, preguntá por lo que había, quién sostenía, qué se rescataba.

Capítulos disponibles del libro: ${capitulos.join(', ')}.

Respondé SOLO con JSON: [{"texto": "...", "capitulo": "..."}, ...] (exactamente 4).`;

type PreguntaGenerada = { texto: string; capitulo: string };

/** Tolera que el modelo envuelva el JSON en ```json ... ``` y valida que vengan las 4. */
export function parsearCuatro(crudo: string): PreguntaGenerada[] {
  const limpio = crudo.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const lista = JSON.parse(limpio) as PreguntaGenerada[];
  if (!Array.isArray(lista) || lista.length < CANTIDAD) {
    throw new Error(`esperaba ${CANTIDAD} preguntas y vinieron ${Array.isArray(lista) ? lista.length : 0}`);
  }
  for (const p of lista.slice(0, CANTIDAD)) {
    if (!p?.texto?.trim() || !p?.capitulo?.trim()) throw new Error('una pregunta vino sin texto o sin capítulo');
  }
  return lista.slice(0, CANTIDAD);
}

/**
 * Genera las 4 preguntas finales personalizadas, a continuación de la última
 * que exista para este narrador (§11.2: la familia puede haber sacado o sumado
 * preguntas, así que no es "27-30", es "N+1..N+4"). Idempotente: si ya hay
 * adaptativas, no hace nada.
 */
export type OpcionesAdaptativas = { pausaMs?: number };

export async function generarPreguntasAdaptativas(
  narradorId: string, opciones: OpcionesAdaptativas = {},
): Promise<void> {
  const pausaMs = opciones.pausaMs ?? PAUSA_REINTENTO_MS;

  // Todo el cuerpo va adentro de un try —el chequeo de idempotencia incluido—:
  // esta función se llama desde el medio del flujo (al responder la última
  // pregunta) y no puede tumbar la entrevista, ni por el modelo ni por la base.
  // Si el modelo no devuelve las 4, el narrador sigue con su guion y el cierre
  // sale igual — la puerta manual (`siguiente`) las puede generar después,
  // porque la función es idempotente (bitácora 28).
  try {
    if (await tieneAdaptativas(narradorId)) return;

    const { data: narrador } = await db.from('narradores')
      .select('como_le_dicen, contexto').eq('id', narradorId).maybeSingle();
    const n = narrador as { como_le_dicen?: string; contexto?: Record<string, unknown> } | null;
    const comoLeDicen = n?.como_le_dicen ?? 'el narrador';

    const capitulos = await capitulosDe(narradorId);
    const desde = (await ultimoOrden(narradorId)) + 1;

    const historia = await armarHistoria(narradorId);
    const trato = await tratoDe({ id: narradorId, como_le_dicen: comoLeDicen, contexto: (n?.contexto ?? {}) as Record<string, any> });
    const prompt = PROMPT_ADAPTATIVAS(comoLeDicen, historia, capitulos, desde - 1, textoEvitar(n?.contexto), trato);

    // Estas 4 preguntas son el final del libro: si el modelo devuelve algo raro,
    // reintentamos (con una pausa) antes de dejar al narrador sin preguntas
    // después de 26 días.
    let preguntas: PreguntaGenerada[] | null = null;
    let ultimoError: unknown = null;
    for (let intento = 1; intento <= INTENTOS && !preguntas; intento++) {
      try {
        const respuesta = await cliente().messages.create({
          model: MODELO, max_tokens: MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }],
        });
        await registrarUso(db, {
          servicio: 'entrevistador', paso: 'adaptativas', modelo: MODELO, proveedor: 'anthropic',
          cuenta: cuentaDeEsteServicio(), narradorId: narradorId, uso: respuesta.usage,
        });
        const bloque = respuesta.content.find((b) => b.type === 'text');
        if (!bloque || bloque.type !== 'text') throw new Error('Claude no devolvió texto');
        preguntas = parsearCuatro(bloque.text.trim());
      } catch (err) {
        ultimoError = err;
        console.error(`Adaptativas del narrador ${narradorId}: falló el intento ${intento}/${INTENTOS}:`, err);
        if (intento < INTENTOS) await esperar(pausaMs);
      }
    }
    if (!preguntas) {
      console.warn(
        `Adaptativas del narrador ${narradorId}: el modelo no devolvió las 4 preguntas (${ultimoError}); ` +
        'la entrevista sigue y se pueden generar después (la función es idempotente).',
      );
      return;
    }

    const filas = preguntas.map((p, i) => ({
      narrador_id: narradorId,
      orden: desde + i,
      texto: p.texto,
      capitulo: p.capitulo,
      tipo: 'adaptativa',
    }));
    const { error } = await db.from('preguntas').insert(filas);
    if (error) throw new Error(`No pude guardar las preguntas adaptativas: ${error.message}`);
  } catch (err) {
    console.warn(`Adaptativas del narrador ${narradorId}: quedaron sin generar (la entrevista sigue):`, err);
  }
}

let _cliente: Anthropic | null = null;
const cliente = () => (_cliente ??= new Anthropic({ apiKey: cargarConfig().anthropicKey }));
