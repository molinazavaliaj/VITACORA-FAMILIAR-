import type Anthropic from '@anthropic-ai/sdk';
import { encargoDelLibro, type Quien } from './encargo.js';
import { extraerTexto } from './comun.js';
import { calcularUsd } from '../costos.js';

// El lector final (diseño §3.2, idea de Naza): antes de imprimir, otro modelo —no el que
// escribió— lee el libro entero contra los audios de verdad y avisa lo que ningún contador
// automático ve: un hecho inventado, una escena fundida de dos audios distintos, algo que la
// persona pidió reservar y quedó adentro. Con avisos, el libro espera a que un socio los mire;
// sin avisos, sigue. Esfuerzo alto: es el default de Opus 5, no hace falta parámetro.
//
// El tope (25/09): Opus 5 piensa aunque no se le pida (sin `thinking` corre adaptativo), y lo que
// piensa cuenta dentro de `max_tokens` junto con la respuesta. Con 8000 y un libro de ~30 mil
// caracteres contra ~34 mil de audios, el pensamiento se comió el tope y el JSON no llegó
// ("no devolvió una lista", libro de prueba de Naza). 32000 deja lugar; con streaming el techo del
// modelo es 128K. Y si igual se corta, se dice ESO, no "no es una lista".

export const MODELO_LECTOR = 'claude-opus-5';
export const TOPE_LECTOR = 32000;

/** Por qué el lector no dejó una lista. Va al informe, al mail y al script, tal cual. */
export type MotivoFalloLector = 'cortada por el tope de tokens' | 'sin texto' | 'no es JSON' | 'sin lista de avisos' | 'el modelo se negó a leerlo';
export type ResultadoLector = { ok: true; avisos: AvisoLector[] } | { ok: false; motivo: MotivoFalloLector };

export type ProblemaLector = 'inventado' | 'epoca-o-lugar' | 'fundido' | 'reservado' | 'genero' | 'nombre' | 'otro';
const PROBLEMAS = new Set<ProblemaLector>(['inventado', 'epoca-o-lugar', 'fundido', 'reservado', 'genero', 'nombre', 'otro']);

export type AvisoLector = { capitulo: string; frase: string; problema: ProblemaLector; evidencia: string };

export const PROMPT_LECTOR = (encargo: string, libro: string, transcripciones: string, nombres: string, reservado: string) => `
Sos el lector final de este libro, antes de que se imprima. No lo escribiste vos. Tu trabajo es leerlo
entero contra lo que la persona dijo de verdad y avisar lo que está mal. Si está bien, decís que está bien.

EL ENCARGO QUE RECIBIÓ QUIEN LO ESCRIBIÓ:
${encargo}

EL LIBRO:
${libro}

LO QUE LA PERSONA DIJO EN SUS AUDIOS, TEXTUAL (la única fuente de verdad):
${transcripciones}

NOMBRES CORREGIDOS POR LA FAMILIA (la forma correcta):
${nombres || '(ninguno)'}

LO QUE LA PERSONA PIDIÓ QUE NO VAYA AL LIBRO:
${reservado || '(nada)'}

Buscá SOLO estas cosas, frase por frase:
- inventado: un hecho, un detalle, una emoción o una conclusión que no está en ningún audio.
- epoca-o-lugar: un recuerdo puesto en la ciudad o la edad equivocada según lo que contó.
- fundido: dos cosas que contó por separado juntadas en una sola escena.
- reservado: algo que pidió que no vaya, o que lo roza.
- genero: el libro habla en un género que no es el de la persona (o los mezcla).
- nombre: un nombre distinto al corregido por la familia.
- otro: algo que el narrador no reconocería como suyo (decí por qué).

No marques estilo, ni frases reescritas que dicen lo mismo que el audio, ni repeticiones. Ante la
duda de si está en el audio, buscalo; si no está, es "inventado".

Devolvé SOLO un JSON: {"avisos":[{"capitulo":"","frase":"(la frase del libro, textual)","problema":"inventado|epoca-o-lugar|fundido|reservado|genero|nombre|otro","evidencia":"(la cita del audio que lo contradice, o: no está en ningún audio)"}]}
Si el libro está bien: {"avisos":[]}`;

/**
 * Parsea la salida del lector: un JSON con "avisos". Se descarta un aviso mal formado (falta un
 * campo, o el problema no es uno de los siete) en vez de tirar todo el resultado — un aviso raro
 * no debería tapar el resto de lo que el lector encontró. Sin JSON reconocible, `ok: false`: el
 * que llama decide qué hacer (reintentar, avisar a mano) sin inventar un "libro sin problemas".
 */
export function parsearLectura(salida: string): ResultadoLector {
  let crudo: { avisos?: unknown };
  try {
    const limpio = salida.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    crudo = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
  } catch {
    return { ok: false, motivo: 'no es JSON' };
  }
  if (!crudo || !Array.isArray(crudo.avisos)) return { ok: false, motivo: 'sin lista de avisos' };
  const avisos = (crudo.avisos as Record<string, unknown>[])
    .filter(
      (a) =>
        a &&
        typeof a.capitulo === 'string' &&
        typeof a.frase === 'string' &&
        typeof a.problema === 'string' &&
        PROBLEMAS.has(a.problema as ProblemaLector)
    )
    .map((a) => ({
      capitulo: a.capitulo as string,
      frase: a.frase as string,
      problema: a.problema as ProblemaLector,
      evidencia: typeof a.evidencia === 'string' ? a.evidencia : '',
    }));
  return { ok: true, avisos };
}

/** El pedido entero, tal cual lo recibe el lector (lo usan `leerLibro` y la estimación). */
function promptDelLector(quien: Quien, libro: string, transcripciones: string[], nombres: string, reservados: string[]): string {
  return PROMPT_LECTOR(encargoDelLibro(quien), libro, transcripciones.join('\n\n---\n\n'), nombres, reservados.join('\n'));
}

/**
 * Cuánto va a costar una lectura, ANTES de pagarla (para `releer-libro.ts`). La entrada se cuenta
 * a 3 caracteres por token (castellano con el tokenizer de Opus 5: tira para arriba, a propósito).
 * La salida no se sabe: va de una lectura corta (~4000 tokens entre pensar y la lista) al tope entero.
 */
export function estimarLector(quien: Quien, libro: string, transcripciones: string[], nombres: string, reservados: string[]) {
  const tokensEntrada = Math.ceil(promptDelLector(quien, libro, transcripciones, nombres, reservados).length / 3);
  const usd = (salida: number) => calcularUsd(MODELO_LECTOR, { input_tokens: tokensEntrada, output_tokens: salida });
  return { tokensEntrada, usdMin: usd(4000), usdMax: usd(TOPE_LECTOR) };
}

/** Los avisos agrupados por capítulo, en el orden en que aparece cada capítulo. */
export function avisosPorCapitulo(avisos: AvisoLector[]): [string, AvisoLector[]][] {
  const grupos = new Map<string, AvisoLector[]>();
  for (const a of avisos) grupos.set(a.capitulo, [...(grupos.get(a.capitulo) ?? []), a]);
  return [...grupos];
}

/**
 * Le pasa el libro entero al lector (Opus, no el modelo que escribió) y devuelve sus avisos.
 * `usage` sale para que quien llama lo registre como cualquier otro paso pago de la fábrica, y
 * `crudo` (el texto tal cual lo devolvió) para guardarlo: si falla, es lo único que dice por qué.
 * Cortada por el tope gana a todo lo demás: un pedazo de JSON que por casualidad parsea no es
 * la lista entera.
 */
export async function leerLibro(
  cliente: Anthropic,
  quien: Quien,
  libroMarkdown: string,
  transcripciones: string[],
  nombresCorregidos: string,
  reservados: string[]
): Promise<{ resultado: ResultadoLector; usage: Anthropic.Usage; crudo: string }> {
  const stream = cliente.messages.stream({
    model: MODELO_LECTOR,
    max_tokens: TOPE_LECTOR,
    messages: [
      {
        role: 'user',
        content: promptDelLector(quien, libroMarkdown, transcripciones, nombresCorregidos, reservados),
      },
    ],
  });
  const final = await stream.finalMessage();
  const bloques = (final.content ?? []) as Array<{ type: string; text?: string }>;
  const crudo = extraerTexto(bloques);
  const stop = (final as { stop_reason?: string | null }).stop_reason;
  const resultado: ResultadoLector =
    stop === 'max_tokens' ? { ok: false, motivo: 'cortada por el tope de tokens' }
    : stop === 'refusal' ? { ok: false, motivo: 'el modelo se negó a leerlo' }
    : !bloques.some((b) => b.type === 'text') || !crudo.trim() ? { ok: false, motivo: 'sin texto' }
    : parsearLectura(crudo);
  return { resultado, usage: final.usage, crudo };
}
