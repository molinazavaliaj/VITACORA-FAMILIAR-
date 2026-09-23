import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import { encargoDelBiografo, tratoDelPerfil, controlarTexto } from './encargo-entrevista.js';

// La evaluación v2 (biógrafo v2, 23/09 — BORRADOR de la reescritura, lo aprueba Naza; producción
// sigue con `evaluarRespuesta` de cerebro.ts). Decide si con la respuesta alcanza para escribir la
// página del día y, si no, escribe la repregunta.
//
// La de hoy es el prompt más parcheado del entrevistador (19 cambios, uno por error) y no veía lo
// que la persona ya había contado: por eso le pidió a Ciro sus abuelos cuando el primer día había
// contado que su abuela le cocinaba (C1). Esta parte del encargo compartido —la ficha, cómo
// hablarle, lo que se respeta— y recibe lo último que hablaron, con sus preguntas. La repregunta
// pasa por el mismo control que la pregunta del día (trato, largo, que pregunte algo).
//
// Lo que ya no hace: marcar a qué pregunta anterior pertenece un recuerdo (`temaDeOrden`). Eso
// ahora lo resuelve la fábrica al repartir el material en las etapas del libro.

const MODELO = 'claude-opus-5';

export type EvaluacionV2 = {
  suficiente: boolean;
  repregunta?: string;
  /** Pidió que algo no vaya al libro. Quien llama lo pasa por `reservaDe` (cerebro.ts), como hoy. */
  reservado?: boolean | string;
  reservadoTramo?: string;
  /** Pidió dejar un tema: cuál, en pocas palabras. */
  dejarTema?: string;
};

export const PROMPT_EVALUAR_V2 = (encargo: string, pregunta: string, respuesta: string, segundos: number, conversacion: string) => `
${encargo}

LO ÚLTIMO QUE HABLARON (cada respuesta con la pregunta que la originó):
${conversacion || '(es la primera respuesta)'}

LA PREGUNTA DE HOY:
${pregunta}

LO QUE CONTESTÓ (duró ${segundos} segundos):
${respuesta}

Tu trabajo: decidir si con esta respuesta hay con qué escribir la página de hoy del libro y, si no,
escribir UNA repregunta.

- ALCANZA si hay con qué escribir: dos o tres detalles concretos, con al menos una escena o un
  nombre. El largo no decide: diez segundos pueden valer un capítulo y cuatro minutos no decir
  nada. Si alcanza, no pidas más por costumbre.
- NO ALCANZA solo si hay poco material (generalidades sin una escena, sin un nombre, sin un hecho),
  o si contó algo fuerte y lo dejó en una frase: ahí la repregunta va EXACTAMENTE a eso.
- La repregunta ahonda en lo que dijo hoy (o en la parte valiosa que quedó afuera). Nunca un tema
  nuevo, nunca decir que es una repregunta, nunca pedirle que resuma. Si se fue a otro tema, está
  bien: no se lo reencuadra ni se le pide que vuelva.
- Si pidió cambiar de tema ("vamos por otro lado", "prefiero no hablar de eso"): alcanza, sin
  repregunta, y anotá el tema en "dejarTema" (en pocas palabras). Esquivar no es pedir.
- Si pidió que algo no vaya al libro ("esto no lo pongas", "que quede para mí"): "reservado": true,
  y si es una parte, "reservadoTramo" con ese tramo COPIADO TEXTUAL. Ante la duda, reservá.

Respondé SOLO con JSON: {"suficiente": true} o {"suficiente": false, "repregunta": "..."}, y sumá
"dejarTema", "reservado" y "reservadoTramo" cuando corresponda.`;

export function armarPromptEvaluar(
  perfil: Perfil,
  pregunta: string,
  respuesta: string,
  segundos: number,
  conversacion: { pregunta: string; respuesta: string }[],
  evitar: string[],
): string {
  return PROMPT_EVALUAR_V2(
    encargoDelBiografo(perfil, evitar),
    pregunta,
    respuesta,
    segundos,
    conversacion.map((c) => `P: ${c.pregunta}\nR: ${c.respuesta}`).join('\n\n'),
  );
}

/** Lee el JSON. Si viene roto, alcanza: hoy no hay repregunta, pero el día no se corta. */
export function parsearEvaluacion(salida: string): EvaluacionV2 {
  try {
    const limpio = salida.trim();
    const crudo = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
    if (typeof crudo?.suficiente !== 'boolean') return { suficiente: true };
    return crudo as EvaluacionV2;
  } catch {
    return { suficiente: true };
  }
}

/**
 * Evalúa. Si la repregunta no pasa el control (trato, largo, que pregunte), la pide una vez más
 * diciendo por qué; si vuelve a fallar, la deja con `controlOk: false` para que quien llama decida.
 */
export async function evaluarV2(
  cliente: Anthropic,
  perfil: Perfil,
  pregunta: string,
  respuesta: string,
  segundos: number,
  conversacion: { pregunta: string; respuesta: string }[],
  evitar: string[],
): Promise<{ evaluacion: EvaluacionV2; controlOk: boolean; motivo?: string; usos: Anthropic.Usage[] }> {
  const prompt = armarPromptEvaluar(perfil, pregunta, respuesta, segundos, conversacion, evitar);
  const trato = tratoDelPerfil(perfil);
  const usos: Anthropic.Usage[] = [];
  let evaluacion: EvaluacionV2 = { suficiente: true };
  let motivo: string | undefined;
  for (let intento = 1; intento <= 2; intento++) {
    const contenido = intento === 1 ? prompt : `${prompt}\n\nTu repregunta anterior no sirvió porque ${motivo}. Escribila de nuevo.`;
    const r = await cliente.messages.create({ model: MODELO, max_tokens: 500, messages: [{ role: 'user', content: contenido }] });
    usos.push(r.usage);
    const bloque = r.content.find((b) => b.type === 'text');
    evaluacion = parsearEvaluacion(bloque && bloque.type === 'text' ? bloque.text : '');
    if (evaluacion.suficiente || !evaluacion.repregunta) return { evaluacion, controlOk: true, usos };
    const control = controlarTexto(evaluacion.repregunta, trato);
    if (control.ok) return { evaluacion, controlOk: true, usos };
    motivo = control.motivo;
  }
  return { evaluacion, controlOk: false, motivo, usos };
}
