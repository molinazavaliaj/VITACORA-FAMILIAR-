import type Anthropic from '@anthropic-ai/sdk';
import { encargoDelLibro, type Quien } from './encargo.js';
import { extraerTexto } from './comun.js';

// El lector final (diseño §3.2, idea de Naza): antes de imprimir, otro modelo —no el que
// escribió— lee el libro entero contra los audios de verdad y avisa lo que ningún contador
// automático ve: un hecho inventado, una escena fundida de dos audios distintos, algo que la
// persona pidió reservar y quedó adentro. Con avisos, el libro espera a que un socio los mire;
// sin avisos, sigue. Esfuerzo alto: es el default de Opus 5, no hace falta parámetro.

export const MODELO_LECTOR = 'claude-opus-5';

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
export function parsearLectura(salida: string): { ok: true; avisos: AvisoLector[] } | { ok: false } {
  let crudo: { avisos?: unknown };
  try {
    const limpio = salida.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    crudo = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
  } catch {
    return { ok: false };
  }
  if (!Array.isArray(crudo.avisos)) return { ok: false };
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

/**
 * Le pasa el libro entero al lector (Opus, no el modelo que escribió) y devuelve sus avisos.
 * `usage` sale para que quien llama lo registre como cualquier otro paso pago de la fábrica.
 */
export async function leerLibro(
  cliente: Anthropic,
  quien: Quien,
  libroMarkdown: string,
  transcripciones: string[],
  nombresCorregidos: string,
  reservados: string[]
): Promise<{ resultado: ReturnType<typeof parsearLectura>; usage: Anthropic.Usage }> {
  const stream = cliente.messages.stream({
    model: MODELO_LECTOR,
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: PROMPT_LECTOR(
          encargoDelLibro(quien),
          libroMarkdown,
          transcripciones.join('\n\n---\n\n'),
          nombresCorregidos,
          reservados.join('\n')
        ),
      },
    ],
  });
  const final = await stream.finalMessage();
  return {
    resultado: parsearLectura(extraerTexto(final.content as Array<{ type: string; text?: string }>)),
    usage: final.usage,
  };
}
