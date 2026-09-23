import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import { encargoDelBiografo } from './encargo-entrevista.js';
import { controlarPregunta, INTENTOS, type Marca } from './control-pregunta.js';
import type { Objetivo } from './pregunta-v2.js';

// La evaluación v2 (biógrafo v2, 23/09 — BORRADOR de la reescritura, lo aprueba Naza; producción
// sigue con `evaluarRespuesta` de cerebro.ts). Decide si con la respuesta alcanza para escribir la
// página del día y, si no, escribe la repregunta.
//
// La de hoy es el prompt más parcheado del entrevistador (19 cambios, uno por error) y no veía lo
// que la persona ya había contado: por eso le pidió a Ciro sus abuelos cuando el primer día había
// contado que su abuela le cocinaba (C1). Esta parte del encargo compartido —la ficha, cómo
// hablarle, lo que se respeta— y recibe lo último que hablaron, con sus preguntas. La repregunta
// pasa por los MISMOS controles que la pregunta del día (trato, largo, que pregunte algo, lugar,
// supuestos — Task 6) y los mismos `INTENTOS`; si falla el último, queda marcada (§2.8).
//
// Lo que ya no hace: marcar a qué pregunta anterior pertenece un recuerdo (`temaDeOrden`). Eso
// ahora lo resuelve la fábrica al repartir el material en las etapas del libro.

const MODELO = 'claude-opus-5';

export type EvaluacionV2 = {
  suficiente: boolean;
  repregunta?: string;
  /** Pidió que algo no vaya al libro. Quien llama lo pasa por `reservaDe` (cerebro.ts), como hoy. */
  reservado?: boolean;
  reservadoTramo?: string;
  /** Pidió dejar un tema: cuál, en pocas palabras. */
  dejarTema?: string;
  /** Hoy no puede: mañana se retoma la MISMA pregunta (no es dejarTema, no hay repregunta). */
  hoyNo?: boolean;
  /** No quiere seguir con la entrevista: el biógrafo no decide solo, avisa a la familia (quien llama). */
  quiereParar?: boolean;
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
- Si dice que HOY no puede ("hoy no", "mañana te contesto", "estoy cansado hoy"): alcanza, sin
  repregunta, y "hoyNo": true. No es dejar un tema: mañana se retoma la misma pregunta.
- Si dice que no quiere seguir con la entrevista ("no quiero seguir", "dejemos esto", "no me
  manden más"): alcanza, sin repregunta, y "quiereParar": true. No lo convenzas: el biógrafo no
  decide solo; avisa a la familia.
- Si pidió que algo no vaya al libro ("esto no lo pongas", "que quede para mí"): "reservado": true,
  y si es una parte, "reservadoTramo" con ese tramo COPIADO TEXTUAL. Ante la duda, reservá.

Respondé SOLO con JSON: {"suficiente": true} o {"suficiente": false, "repregunta": "..."}, y sumá
"dejarTema", "reservado", "reservadoTramo", "hoyNo" y "quiereParar" cuando corresponda.`;

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

/** Lee el JSON, campo por campo: lo que viene con el tipo equivocado se ignora en vez de colarse
 * tal cual al libro o a la base (antes `return crudo as EvaluacionV2` dejaba pasar cualquier cosa).
 * Si viene roto, alcanza: hoy no hay repregunta, pero el día no se corta (§2.8). */
export function parsearEvaluacion(salida: string): EvaluacionV2 {
  try {
    const limpio = salida.trim();
    const c = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1)) as Record<string, unknown>;
    if (typeof c?.suficiente !== 'boolean') return { suficiente: true };
    const e: EvaluacionV2 = { suficiente: c.suficiente };
    if (typeof c.repregunta === 'string' && c.repregunta.trim()) e.repregunta = c.repregunta.trim();
    if (c.reservado === true) e.reservado = true;
    if (typeof c.reservadoTramo === 'string' && c.reservadoTramo.trim()) e.reservadoTramo = c.reservadoTramo.trim();
    if (typeof c.dejarTema === 'string' && c.dejarTema.trim()) e.dejarTema = c.dejarTema.trim();
    if (c.hoyNo === true) e.hoyNo = true;
    if (c.quiereParar === true) e.quiereParar = true;
    return e;
  } catch {
    return { suficiente: true };
  }
}

export const DIAS_SIN_REPREGUNTAR = 3;

/** Cansancio: si las dos últimas repreguntas quedaron sin contestar, no se repregunta por unos
 * días (`DIAS_SIN_REPREGUNTAR`) aunque la respuesta de hoy diera para repreguntar. Lo decide quien
 * llama (Task 8), esto solo mira el patrón. */
export function hayCansancio(ultimasRepreguntas: { contestada: boolean }[]): boolean {
  const dos = ultimasRepreguntas.slice(-2);
  return dos.length === 2 && dos.every((r) => !r.contestada);
}

/**
 * Evalúa. La repregunta pasa por los MISMOS controles que la pregunta del día (`controlarPregunta`,
 * con el objetivo de la pregunta de hoy: por eso también se le controla el lugar y los supuestos,
 * no solo la forma) y los mismos `INTENTOS`; si el último intento también falla, se devuelve igual
 * —mejor una repregunta imperfecta que ninguna— pero con `marca` para que quien llama lo sepa.
 */
export async function evaluarV2(
  cliente: Anthropic,
  perfil: Perfil,
  objetivo: Objetivo,
  pregunta: string,
  respuesta: string,
  segundos: number,
  conversacion: { pregunta: string; respuesta: string }[],
  evitar: string[],
): Promise<{ evaluacion: EvaluacionV2; marca?: Marca; usos: Anthropic.Usage[] }> {
  const prompt = armarPromptEvaluar(perfil, pregunta, respuesta, segundos, conversacion, evitar);
  const usos: Anthropic.Usage[] = [];
  let evaluacion: EvaluacionV2 = { suficiente: true };
  let ultimo: { control: string; motivo: string } | null = null;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    const contenido = intento === 1 ? prompt : `${prompt}\n\nTu versión anterior no sirvió porque ${ultimo!.motivo}. Escribila de nuevo, cuidando eso.`;
    const r = await cliente.messages.create({ model: MODELO, max_tokens: 500, messages: [{ role: 'user', content: contenido }] });
    usos.push(r.usage);
    const bloque = r.content.find((b) => b.type === 'text');
    evaluacion = parsearEvaluacion(bloque && bloque.type === 'text' ? bloque.text : '');
    if (evaluacion.suficiente || !evaluacion.repregunta) return { evaluacion, usos };
    const control = controlarPregunta(evaluacion.repregunta, perfil, objetivo);
    if (control.ok) return { evaluacion, usos };
    ultimo = control;
  }
  // Campo por campo: `ultimo` es un Rechazo y trae "ok: false" de arrastre, que no pertenece a la
  // Marca (mismo fix que escribirPregunta en pregunta-v2.ts).
  return { evaluacion, marca: { control: ultimo!.control, motivo: ultimo!.motivo, intentos: INTENTOS }, usos };
}
