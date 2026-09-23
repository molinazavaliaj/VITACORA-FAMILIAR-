import type Anthropic from '@anthropic-ai/sdk';

// El perfil del narrador (biógrafo v2, 23/09 — EXPERIMENTO, todavía no lo usa el flujo).
//
// Quién es la persona y la línea de tiempo de su vida, armados con lo que CUENTA, aunque la
// familia no haya cargado nada. Se actualiza después de cada respuesta. Sirve para dos cosas:
//
// 1. No errarle a con quién se habla (pedido de Naza: "que entienda el avatar para no errar con
//    quién habla o qué edad tiene, y si el familiar no carga contexto que se dé cuenta igual").
//    Los errores que ya pasaron son todos de suponer: usted a un pibe de 28 (hallazgo 1), la
//    pareja mujer sin saberlo (C12), la abuela dada por muerta (C2), la infancia como un lujo
//    (C3), las salidas en Concordia cuando fueron en Buenos Aires (C6).
// 2. Repartir las preguntas según la vida de ESTA persona, no la de un abuelo genérico.
//
// Cada dato dice de dónde salió (lo dijo él, lo cargó la familia, se deduce — y por qué), y lo
// que no se sabe queda en "noSabemos": eso se pregunta, no se supone.

export const MODELO_PERFIL = 'claude-opus-5';

export type Fuente = 'dicho' | 'ficha' | 'deducido';
export type Dato<T> = { valor: T; fuente: Fuente; por?: string } | null;

export type Perfil = {
  persona: {
    anioNacimiento: Dato<string>;
    edad: Dato<string>;
    genero: Dato<string>;
    /** Cómo habla ÉL (vos, usted, tú): el trato se espeja de ahí, no de la edad. */
    comoHabla: Dato<string>;
    dondeViveHoy: Dato<string>;
  };
  /** La línea de tiempo: dónde, con quién y haciendo qué, etapa por etapa. */
  etapas: { edades: string; anios?: string; lugar: string; conQuien: string; queHacia: string; fuente: Fuente }[];
  /** Las personas de su vida. `vive` nunca se supone. */
  personas: { nombre: string; vinculo: string; vive: 'si' | 'no' | 'no se sabe'; fuente: Fuente; nota?: string }[];
  /** Los momentos que partieron su vida en un antes y un después. */
  bisagras: string[];
  /** Cómo fue esta vida, en una o dos líneas (C3: no preguntar por fiestas a quien no las tuvo). */
  tono: string;
  /** Lo que conviene preguntar antes de suponer. */
  noSabemos: string[];
};

export function perfilVacio(): Perfil {
  return {
    persona: { anioNacimiento: null, edad: null, genero: null, comoHabla: null, dondeViveHoy: null },
    etapas: [],
    personas: [],
    bisagras: [],
    tono: '',
    noSabemos: [],
  };
}

const VIVE = new Set(['si', 'no', 'no se sabe']);

/**
 * Lee lo que devolvió el modelo. Si no se entiende, conserva el perfil anterior (ok: false):
 * un error del modelo no puede borrar lo que ya se sabía. Lo que falte se completa con lo
 * anterior, y un "vive" que no sea si/no queda "no se sabe".
 */
export function parsearPerfil(salida: string, anterior: Perfil): { ok: boolean; perfil: Perfil } {
  const limpio = salida.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let crudo: Partial<Perfil>;
  try {
    crudo = JSON.parse(limpio);
    if (!crudo || typeof crudo !== 'object') throw new Error('no es un objeto');
  } catch {
    return { ok: false, perfil: anterior };
  }
  const perfil: Perfil = {
    persona: { ...anterior.persona, ...(crudo.persona ?? {}) },
    etapas: Array.isArray(crudo.etapas) ? crudo.etapas : anterior.etapas,
    personas: (Array.isArray(crudo.personas) ? crudo.personas : anterior.personas)
      .map((p) => ({ ...p, vive: VIVE.has(p.vive) ? p.vive : 'no se sabe' })),
    bisagras: Array.isArray(crudo.bisagras) ? crudo.bisagras : anterior.bisagras,
    tono: typeof crudo.tono === 'string' ? crudo.tono : anterior.tono,
    noSabemos: Array.isArray(crudo.noSabemos) ? crudo.noSabemos : anterior.noSabemos,
  };
  return { ok: true, perfil };
}

export const PROMPT_PERFIL = (perfil: string, ficha: string, pregunta: string, respuesta: string) => `
Sos el biógrafo que está entrevistando a una persona para escribir el libro de su vida. Le
mandás una pregunta por día y te contesta con audios. Antes de preguntarle nada, tenés que
saber con quién hablás: qué edad tiene, si es hombre o mujer, cómo habla, dónde vivió y con
quién, quién de su familia vive. Muchas veces la familia no te cuenta nada: te tenés que dar
cuenta por lo que él o ella cuenta.

LO QUE YA SABÉS (tu ficha de trabajo, en JSON):
${perfil}

LO QUE CARGÓ LA FAMILIA AL COMPRAR:
${ficha}

LA PREGUNTA DE HOY:
${pregunta}

LO QUE CONTESTÓ (transcripción de su audio):
${respuesta}

Actualizá tu ficha con lo que aprendiste hoy. Reglas:

1. Cada dato dice de dónde salió: "dicho" (lo dijo), "ficha" (lo cargó la familia) o
   "deducido". Si es deducido, en "por" poné la evidencia en pocas palabras ("dice que a los
   17 se separaron sus padres y que eso fue en 2014").
2. Lo que no sabés, no lo inventes: dejalo en null y anotalo en "noSabemos" si conviene
   preguntarlo. Una edad se puede deducir de años y edades que nombra; un rango honesto
   ("entre 25 y 35") vale más que un número inventado.
3. Cómo habla: si dijo cómo prefiere que le hablen ("tratame de vos", "de usted está bien"),
   ESO manda, con fuente "dicho". Si no lo dijo, fijate en cómo habla ("vos sabés", "mirá",
   "usted vio"), no en la edad que suponés. El valor es UNA palabra: "vos", "usted" o "tú";
   lo que te hizo darte cuenta va en "por", en pocas palabras.
4. Hombre o mujer: solo si surge de cómo se nombra a sí mismo o de lo que dice ("cuando yo
   era chica", "como padre"). De su pareja, lo mismo: si no lo dijo, no se sabe.
5. Las personas: "vive" es "si" o "no" solo si lo dijo o se desprende sin duda (habla de
   ella en presente como alguien que está, o cuenta su muerte). Si no, "no se sabe".
6. La línea de tiempo: etapas con edades (o años), lugar, con quién vivía y qué hacía. Si
   algo pasó en otra ciudad, que quede claro dónde: no mezcles lugares de etapas distintas.
7. "tono": cómo fue esta vida hasta donde sabés, en una o dos líneas, sin adornar. Si hubo
   una infancia dura, decilo; si no sabés, dejalo vacío.
8. No borres lo que ya sabías salvo que hoy lo haya corregido él.

Devolvé SOLO el JSON completo de la ficha actualizada, con esta forma:
{"persona":{"anioNacimiento":D,"edad":D,"genero":D,"comoHabla":D,"dondeViveHoy":D},
 "etapas":[{"edades":"","anios":"","lugar":"","conQuien":"","queHacia":"","fuente":""}],
 "personas":[{"nombre":"","vinculo":"","vive":"si|no|no se sabe","fuente":"","nota":""}],
 "bisagras":[""],"tono":"","noSabemos":[""]}
donde D es null o {"valor":"","fuente":"dicho|ficha|deducido","por":""}.`;

export function armarPromptPerfil(perfil: Perfil, ficha: string | null, pregunta: string, respuesta: string): string {
  return PROMPT_PERFIL(
    JSON.stringify(perfil, null, 1),
    ficha?.trim() ? ficha : 'La familia no cargó nada.',
    pregunta,
    respuesta,
  );
}

/**
 * Una actualización. Recibe el cliente (así la prueba no escribe en la base); devuelve el
 * uso para que quien llama lo anote o lo sume.
 */
export async function actualizarPerfil(
  cliente: Anthropic,
  perfil: Perfil,
  ficha: string | null,
  pregunta: string,
  respuesta: string,
): Promise<{ ok: boolean; perfil: Perfil; usage: Anthropic.Usage }> {
  const r = await cliente.messages.create({
    model: MODELO_PERFIL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: armarPromptPerfil(perfil, ficha, pregunta, respuesta) }],
  });
  const bloque = r.content.find((b) => b.type === 'text');
  const texto = bloque && bloque.type === 'text' ? bloque.text : '';
  return { ...parsearPerfil(texto, perfil), usage: r.usage };
}
