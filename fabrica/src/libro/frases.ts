// Por qué existe: el producto dejó de ser un audiolibro y pasó a ser las mejores frases del
// narrador en su voz (spec 2026-09-20-su-voz-design.md). Este módulo las elige con el mismo
// modelo que escribe el libro —dos pasadas, una para proponer y otra para decidir— y arma el
// `frases.json` que el worker corta y que la web muestra. No toca la base: vive en el paquete
// del narrador.
//
// Lo que NO hace: no corta audio (eso es del worker, sobre los audios reales), no narra nada y
// no decide qué se publica (para eso está `esPublicable`, que mira la reserva del hallazgo 19).
import type Anthropic from '@anthropic-ai/sdk';
import { extraerTexto, esPublicable, type ReservaDeRespuesta } from './comun.js';
import { parsearJsonTolerante } from '../voz/conectores.js';

/** Cuántas frases se imprimen por capítulo (decisión de Naza, 20/09). */
export const FRASES_POR_CAPITULO = 3;
/** Cuántas candidatas le pedimos al modelo por capítulo: el triple, para que elegir sea elegir. */
export const CANDIDATAS_POR_CAPITULO = 5;

/** Una respuesta con audio, lista para que el modelo le saque una frase. */
export type MaterialDeFrase = {
  orden: number;
  respuestaId: string | null;
  /** El archivo real del que el worker va a cortar: sin esto no hay frase posible. */
  audioPath: string | null;
  texto: string;
  reserva?: Partial<ReservaDeRespuesta>;
};

export type FraseCandidata = {
  id: string;
  texto: string;
  respuesta_id: string | null;
  pregunta_orden: number;
  por_que: string;
  elegida: boolean;
  elegida_por: 'modelo';
  /** `pendiente` hasta que el worker la corta y escribe `cortada`. */
  estado: 'pendiente';
  audio_path: null;
  segundos: null;
  inicio: null;
  fin: null;
};

export type CapituloConFrases = { numero: number; capitulo: string; candidatas: FraseCandidata[] };

export type FrasesJson = {
  version: 1;
  narrador_id: string;
  pedido_id: string;
  /** Cuándo la familia dio por buena la selección; la impresión espera esto (o los 15 días). */
  confirmado_at: string | null;
  capitulos: CapituloConFrases[];
};

const CRITERIOS = `Los criterios, en orden:
1. Es la que se repetiría en una mesa, años después.
2. Está en SU voz: un dato no es una frase ("nació en 1943" no sirve).
3. Se entiende sola, sin el resto de la historia.
4. No hiere a alguien que está vivo (nombres, peleas, plata).
5. Una por tema: dos veces lo mismo no entra.`;

export const PROMPT_CANDIDATAS = (nombre: string, capitulo: string) => `Sos el biógrafo de ${nombre}. De las historias de «${capitulo}» que te paso, elegí hasta ${CANDIDATAS_POR_CAPITULO} FRASES para que su familia las escuche en su voz, para siempre.
${CRITERIOS}
Devolvé SOLO un JSON: {"candidatas":[{"texto":"...","por_que":"una línea"}]}. El texto va EXACTAMENTE como él lo dijo: no lo retoques, no lo completes, no lo unas con otra frase. Si la cita no está tal cual en la transcripción, no la propongas.`;

export const PROMPT_ELEGIR = (nombre: string, capitulo: string) => `Sos el editor del libro de ${nombre}. Te paso las candidatas de «${capitulo}». Elegí las ${FRASES_POR_CAPITULO} que de verdad quedarían en la familia y explicá en una línea por qué cada una.
${CRITERIOS}
Devolvé SOLO un JSON: {"indices":[3,0,5],"por_que":["...","...","..."]} — los índices de las elegidas (0 = la primera candidata), en el orden en que las pondrías en el libro.`;

/** Una llamada al modelo, con el mismo parseo tolerante que usan los conectores. */
async function llamar(cliente: Anthropic, prompt: string, material: string): Promise<unknown> {
  const respuesta = await cliente.messages.create({
    model: 'claude-fable-5',
    // 300 tokens corta la lista a la mitad (medido en el entrevistador: un tope corto pierde
    // la última respuesta); 2000 alcanza para 5 frases con su porqué.
    max_tokens: 2000,
    messages: [{ role: 'user', content: `${prompt}\n\n--- MATERIAL ---\n${material}` }],
  });
  return parsearJsonTolerante(extraerTexto(respuesta.content as Array<{ type: string; text?: string }>));
}

export async function proponerCandidatas(
  cliente: Anthropic,
  args: { nombre: string; capitulo: string; material: MaterialDeFrase[] }
): Promise<{ texto: string; por_que: string }[]> {
  const crudo = (await llamar(
    cliente,
    PROMPT_CANDIDATAS(args.nombre, args.capitulo),
    args.material.map((m) => `[${m.orden}] ${m.texto}`).join('\n\n')
  )) as { candidatas?: { texto?: unknown; por_que?: unknown }[] };

  const dichos = args.material.map((m) => m.texto);
  return (crudo.candidatas ?? [])
    .filter((c): c is { texto: string; por_que?: unknown } => typeof c.texto === 'string' && c.texto.trim() !== '')
    .map((c) => ({ texto: c.texto.trim(), por_que: typeof c.por_que === 'string' ? c.por_que.trim() : '' }))
    // La cita tiene que estar TAL CUAL en la transcripción: si el modelo la retocó, el corte no
    // alinea contra el audio y lo impreso no coincide con lo que se escucha.
    .filter((c) => dichos.some((d) => d.includes(c.texto)))
    .slice(0, CANDIDATAS_POR_CAPITULO);
}

export async function elegirFinales(
  cliente: Anthropic,
  args: { nombre: string; capitulo: string; candidatas: { texto: string; por_que: string }[] }
): Promise<{ indices: number[]; porQue: string[] }> {
  if (args.candidatas.length <= FRASES_POR_CAPITULO) {
    // Menos candidatas que lugares: no se le paga al modelo por ordenar dos cosas.
    return { indices: args.candidatas.map((_, i) => i), porQue: args.candidatas.map((c) => c.por_que) };
  }
  const crudo = (await llamar(
    cliente,
    PROMPT_ELEGIR(args.nombre, args.capitulo),
    args.candidatas.map((c, i) => `[${i}] ${c.texto}`).join('\n')
  )) as { indices?: unknown; por_que?: unknown };

  const indices = (Array.isArray(crudo.indices) ? crudo.indices : []).filter(
    (i): i is number => typeof i === 'number' && i >= 0 && i < args.candidatas.length
  );
  const porQue = Array.isArray(crudo.por_que) ? crudo.por_que.filter((p): p is string => typeof p === 'string') : [];
  return { indices: indices.slice(0, FRASES_POR_CAPITULO), porQue };
}

/**
 * Las dos pasadas, capítulo por capítulo, y el JSON del paquete. Un capítulo sin audios
 * utilizables (o con todas sus respuestas reservadas) no aparece: no es un error, es que no hay
 * nada que su familia pueda escuchar.
 */
export async function armarFrasesJson(
  args: {
    narradorId: string;
    pedidoId: string;
    nombre: string;
    capitulos: { nombre: string; numero: number; material: MaterialDeFrase[] }[];
  },
  deps: { cliente: Anthropic; proponer: typeof proponerCandidatas; elegir: typeof elegirFinales }
): Promise<FrasesJson> {
  const capitulos: CapituloConFrases[] = [];

  for (const capitulo of args.capitulos) {
    const material = capitulo.material.filter((m) => esPublicable(m.reserva ?? {}) && m.texto.trim() !== '');
    if (material.length === 0) continue;

    const candidatas = await deps.proponer(deps.cliente, { nombre: args.nombre, capitulo: capitulo.nombre, material });
    if (candidatas.length === 0) continue;

    const { indices, porQue } = await deps.elegir(deps.cliente, { nombre: args.nombre, capitulo: capitulo.nombre, candidatas });
    const elegidas = new Set(indices);

    capitulos.push({
      numero: capitulo.numero,
      capitulo: capitulo.nombre,
      candidatas: candidatas.map((c, i) => {
        const origen = material.find((m) => m.texto.includes(c.texto));
        return {
          id: `c${String(capitulo.numero).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
          texto: c.texto,
          respuesta_id: origen?.respuestaId ?? null,
          pregunta_orden: origen?.orden ?? 0,
          por_que: porQue[indices.indexOf(i)] ?? c.por_que,
          elegida: elegidas.has(i),
          elegida_por: 'modelo' as const,
          estado: 'pendiente' as const,
          audio_path: null,
          segundos: null,
          inicio: null,
          fin: null,
        };
      }),
    });
  }

  return { version: 1, narrador_id: args.narradorId, pedido_id: args.pedidoId, confirmado_at: null, capitulos };
}
