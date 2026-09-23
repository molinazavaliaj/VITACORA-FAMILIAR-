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

type Etapa = Perfil['etapas'][number];
type Persona = Perfil['personas'][number];

/**
 * Lo que cambió con la respuesta de hoy. El modelo devuelve SOLO esto y el código lo aplica:
 * reescribir la ficha entera en cada respuesta costaba ~USD 2 por libro (la salida es lo caro), y
 * un error del modelo podía borrar lo que ya se sabía. `i` es la posición en la lista (desde 0).
 */
export type CambiosDePerfil = {
  persona?: Partial<Record<keyof Perfil['persona'], Dato<string>>>;
  agregarEtapas?: Etapa[];
  corregirEtapas?: (Partial<Etapa> & { i: number })[];
  agregarPersonas?: Persona[];
  corregirPersonas?: (Partial<Persona> & { i: number })[];
  agregarBisagras?: string[];
  tono?: string;
  /** Cosas de "noSabemos" que hoy se resolvieron (el texto tal cual figura). */
  resueltos?: string[];
  agregarNoSabemos?: string[];
};

const lista = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const sinRepetir = (xs: string[]) => [...new Set(xs.filter((x) => typeof x === 'string' && x.trim()))];
const vive = (v: unknown): Persona['vive'] => (VIVE.has(v as string) ? (v as Persona['vive']) : 'no se sabe');

/**
 * Aplica los cambios sobre la ficha anterior. Lo que venga mal armado se ignora pieza por pieza:
 * un índice que no existe, una lista que no es lista, un "vive" dudoso (queda "no se sabe"). Un
 * null en un dato de la persona NO lo borra: lo que ya se sabía se conserva.
 */
export function aplicarCambios(anterior: Perfil, cambios: CambiosDePerfil): Perfil {
  const p: Perfil = structuredClone(anterior);
  if (esObjeto(cambios.persona)) {
    for (const [campo, dato] of Object.entries(cambios.persona)) {
      if (campo in p.persona && esObjeto(dato) && typeof dato.valor === 'string') {
        (p.persona as Record<string, Dato<string>>)[campo] = dato as Dato<string>;
      }
    }
  }
  for (const e of lista<Etapa>(cambios.agregarEtapas)) if (esObjeto(e)) p.etapas.push(e);
  for (const c of lista<Partial<Etapa> & { i: number }>(cambios.corregirEtapas)) {
    if (esObjeto(c) && p.etapas[c.i]) { const { i, ...resto } = c; p.etapas[i] = { ...p.etapas[i], ...resto }; }
  }
  for (const x of lista<Persona>(cambios.agregarPersonas)) if (esObjeto(x)) p.personas.push({ ...x, vive: vive(x.vive) });
  for (const c of lista<Partial<Persona> & { i: number }>(cambios.corregirPersonas)) {
    if (esObjeto(c) && p.personas[c.i]) {
      const { i, ...resto } = c;
      p.personas[i] = { ...p.personas[i], ...resto, vive: vive(resto.vive ?? p.personas[i].vive) };
    }
  }
  p.bisagras = sinRepetir([...p.bisagras, ...lista<string>(cambios.agregarBisagras)]);
  if (typeof cambios.tono === 'string' && cambios.tono.trim()) p.tono = cambios.tono.trim();
  const resueltos = new Set(lista<string>(cambios.resueltos).map((r) => String(r).trim().toLowerCase()));
  p.noSabemos = sinRepetir([...p.noSabemos.filter((n) => !resueltos.has(n.trim().toLowerCase())), ...lista<string>(cambios.agregarNoSabemos)]);
  return p;
}

/**
 * Lee los cambios que devolvió el modelo y los aplica. Si no se entiende, conserva el perfil
 * anterior (ok: false): un error del modelo no puede borrar lo que ya se sabía.
 */
export function parsearCambios(salida: string, anterior: Perfil): { ok: boolean; perfil: Perfil } {
  const limpio = salida.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const crudo = JSON.parse(limpio);
    if (!esObjeto(crudo)) throw new Error('no es un objeto');
    return { ok: true, perfil: aplicarCambios(anterior, crudo as CambiosDePerfil) };
  } catch {
    return { ok: false, perfil: anterior };
  }
}

export const PROMPT_PERFIL = (perfil: string, ficha: string, pregunta: string, respuesta: string) => `
Sos el biógrafo que está entrevistando a una persona para escribir el libro de su vida. Le
mandás una pregunta por día y te contesta con audios. Antes de preguntarle nada, tenés que
saber con quién hablás: qué edad tiene, si es hombre o mujer, cómo habla, dónde vivió y con
quién, quién de su familia vive. Muchas veces la familia no te cuenta nada: te tenés que dar
cuenta por lo que él o ella cuenta.

LO QUE YA SABÉS (tu ficha de trabajo, en JSON; cada etapa y cada persona tiene su número "i"):
${perfil}

LO QUE CARGÓ LA FAMILIA AL COMPRAR:
${ficha}

LA PREGUNTA DE HOY:
${pregunta}

LO QUE CONTESTÓ (transcripción de su audio):
${respuesta}

Anotá en tu ficha lo que aprendiste hoy. Reglas:

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
4. Hombre o mujer: solo si surge de cómo se nombra ("cuando yo era chica", "como padre") o si
   lo dijo. De su pareja, lo mismo: si no lo dijo, no se sabe.
5. Las personas: "vive" es "si" o "no" solo si lo dijo o se desprende sin duda (habla de
   ella en presente como alguien que está, o cuenta su muerte). Si no, "no se sabe".
6. La línea de tiempo: etapas con edades (o años), lugar, con quién vivía y qué hacía. Si
   algo pasó en otra ciudad, que quede claro dónde: no mezcles lugares de etapas distintas.
7. "tono": cómo fue esta vida hasta donde sabés, en una o dos líneas, sin adornar. Si hubo
   una infancia dura, decilo; si no sabés, dejalo vacío.
8. Lo que ya sabías queda: solo se corrige si hoy lo corrigió la persona.

Devolvé SOLO LO QUE CAMBIÓ, en JSON, usando solo las claves que hagan falta:
{"persona":{"edad":D,"genero":D,"comoHabla":D,"anioNacimiento":D,"dondeViveHoy":D},
 "agregarEtapas":[{"edades":"","anios":"","lugar":"","conQuien":"","queHacia":"","fuente":""}],
 "corregirEtapas":[{"i":0,"lugar":"..."}],
 "agregarPersonas":[{"nombre":"","vinculo":"","vive":"si|no|no se sabe","fuente":"","nota":""}],
 "corregirPersonas":[{"i":0,"vive":"si","nota":"..."}],
 "agregarBisagras":[""],"tono":"(solo si cambió)",
 "resueltos":["(el texto de noSabemos que hoy se resolvió, tal cual)"],"agregarNoSabemos":[""]}
donde D es {"valor":"","fuente":"dicho|ficha|deducido","por":""}. Si hoy no aprendiste nada
nuevo, devolvé {}.`;

/** La ficha para el prompt: las listas llevan su número, que es lo que el modelo usa para corregir. */
export function armarPromptPerfil(perfil: Perfil, ficha: string | null, pregunta: string, respuesta: string): string {
  const numerada = {
    ...perfil,
    etapas: perfil.etapas.map((e, i) => ({ i, ...e })),
    personas: perfil.personas.map((x, i) => ({ i, ...x })),
  };
  return PROMPT_PERFIL(
    JSON.stringify(numerada, null, 1),
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
    max_tokens: 2000,
    messages: [{ role: 'user', content: armarPromptPerfil(perfil, ficha, pregunta, respuesta) }],
  });
  const bloque = r.content.find((b) => b.type === 'text');
  const texto = bloque && bloque.type === 'text' ? bloque.text : '';
  return { ...parsearCambios(texto, perfil), usage: r.usage };
}
