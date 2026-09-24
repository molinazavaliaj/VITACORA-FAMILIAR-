import type Anthropic from '@anthropic-ai/sdk';
import { castellanoDe, type Castellano } from '../manual/puro.js';

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
    /** Cómo le dicen en casa (lo pide la presentación): se usa en todo el libro. */
    comoLeDicen: Dato<string>;
    dondeViveHoy: Dato<string>;
  };
  /** Su castellano: decide qué trato se ofrece (vos/usted o tú/usted) y cómo se transcribe. */
  castellano: Castellano;
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
  /** Temas fijos que ya contó con detalle sin que se los preguntaran: no se preguntan. */
  cubiertos: string[];
  /** Si la respuesta de HOY abrió un tema pendiente que conviene cruzar mañana (id del tema). De hoy, no se arrastra. */
  puertaAbierta: string | null;
  /** Si HOY contó algo que le costó (una pérdida, un quiebre): mañana la pregunta lo reconoce antes de preguntar. */
  hoyFueFuerte: boolean;
};

export function perfilVacio(castellano: Castellano = 'rioplatense'): Perfil {
  return {
    persona: { anioNacimiento: null, edad: null, genero: null, comoHabla: null, comoLeDicen: null, dondeViveHoy: null },
    castellano,
    etapas: [],
    personas: [],
    bisagras: [],
    tono: '',
    noSabemos: ['Edad', 'Cómo prefiere que le hablen', 'Cómo le dicen'],
    cubiertos: [],
    puertaAbierta: null,
    hoyFueFuerte: false,
  };
}

const ESTADO_CIVIL_A_PREGUNTAR: Record<string, string> = {
  viuda: 'Si tuvo pareja (la ficha dice viuda: preguntar quién era)',
  viudo: 'Si tuvo pareja (la ficha dice viudo: preguntar quién era)',
  separada: 'Si tuvo pareja (la ficha dice separada: preguntar quién era)',
  separado: 'Si tuvo pareja (la ficha dice separado: preguntar quién era)',
  divorciada: 'Si tuvo pareja (la ficha dice divorciada: preguntar quién era)',
  divorciado: 'Si tuvo pareja (la ficha dice divorciado: preguntar quién era)',
};

/**
 * El perfil del día 0, con lo que cargó la familia al comprar. Cada dato dice "ficha": lo que la
 * persona diga después manda (ver `aplicarCambios`). La ficha deja de viajar en cada llamada al
 * modelo (biógrafo v2, 23/09): esto es lo que viaja en su lugar.
 */
export function perfilDesdeFicha(contexto: Record<string, any> = {}, zonaHoraria?: string | null): Perfil {
  const c = contexto ?? {};
  const p = perfilVacio(castellanoDe(zonaHoraria, c.trato));
  const ficha = (valor: unknown): Dato<string> =>
    valor === undefined || valor === null || String(valor).trim() === '' ? null : { valor: String(valor).trim(), fuente: 'ficha' };
  p.persona.anioNacimiento = ficha(c.anioNacimiento);
  p.persona.dondeViveHoy = ficha(c.dondeVive);
  if (c.trato === 'vos' || c.trato === 'usted') {
    p.persona.comoHabla = { valor: c.trato, fuente: 'ficha' };
    p.noSabemos = p.noSabemos.filter((x) => x !== 'Cómo prefiere que le hablen');
  }
  if (c.genero === 'mujer' || c.genero === 'hombre') p.persona.genero = { valor: c.genero, fuente: 'ficha' };
  if (p.persona.anioNacimiento) p.noSabemos = p.noSabemos.filter((x) => x !== 'Edad');
  if (typeof c.lugarNacimiento === 'string' && c.lugarNacimiento.trim()) {
    p.etapas.push({ edades: 'de chico/a', lugar: c.lugarNacimiento.trim(), conQuien: '', queHacia: '', fuente: 'ficha' });
  }
  const arbol = typeof c.arbol === 'object' && c.arbol ? (c.arbol as Record<string, unknown>) : {};
  for (const [vinculo, nombre] of Object.entries(arbol)) {
    if (typeof nombre !== 'string' || !nombre.trim()) continue;
    if (nombre.trim().toLowerCase() === 'no tuvo') {
      // Queda dicho en "noSabemos" (el encargo lo lee ahí) en vez de armar una persona fantasma.
      p.noSabemos.push(`(la familia dice que no tuvo ${vinculo})`);
      continue;
    }
    p.personas.push({ nombre: nombre.trim(), vinculo, vive: 'no se sabe', fuente: 'ficha' });
  }
  const civil = typeof c.estadoCivil === 'string' ? c.estadoCivil.trim().toLowerCase() : '';
  if (ESTADO_CIVIL_A_PREGUNTAR[civil]) p.noSabemos.push(ESTADO_CIVIL_A_PREGUNTAR[civil]);
  if (typeof c.oficio === 'string' && c.oficio.trim()) {
    p.etapas.push({ edades: '', lugar: '', conQuien: '', queHacia: c.oficio.trim(), fuente: 'ficha' });
  }
  return p;
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
  /** Temas pendientes que hoy contó con detalle sin que se los preguntaran: se suman, sin repetir. */
  cubiertos?: string[];
  /** El tema pendiente que hoy abrió y conviene cruzar mañana (su id), o null. De hoy: no se arrastra. */
  puertaAbierta?: string | null;
  /** Si hoy contó algo que le costó decir. De hoy: no se arrastra. */
  hoyFueFuerte?: boolean;
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
      if (!(campo in p.persona) || !esObjeto(dato) || typeof dato.valor !== 'string') continue;
      const datoAnterior = (p.persona as Record<string, Dato<string>>)[campo];
      // Lo que la persona dijo no lo pisa una deducción: solo otro "dicho" (o la ficha, si no había nada).
      if (datoAnterior?.fuente === 'dicho' && dato.fuente !== 'dicho') continue;
      (p.persona as Record<string, Dato<string>>)[campo] = dato as Dato<string>;
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
  p.cubiertos = sinRepetir([...p.cubiertos, ...lista<string>(cambios.cubiertos)]);
  // puertaAbierta y hoyFueFuerte son de HOY: se reemplazan en cada respuesta, no se acumulan.
  p.puertaAbierta = typeof cambios.puertaAbierta === 'string' && cambios.puertaAbierta.trim() ? cambios.puertaAbierta.trim() : null;
  p.hoyFueFuerte = cambios.hoyFueFuerte === true;
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

/** Un tema pendiente del guion: `armarPromptPerfil` se lo pasa al modelo para "cubiertos" y "puertaAbierta". */
export type TemaPendiente = { id: string; tema: string };

export const PROMPT_PERFIL = (perfil: string, pregunta: string, respuesta: string, pendientes: string) => `
Sos el biógrafo que está entrevistando a una persona para escribir el libro de su vida. Le
mandás una pregunta por día y te contesta con audios. Antes de preguntarle nada, tenés que
saber con quién hablás: qué edad tiene, si es hombre o mujer, cómo habla, dónde vivió y con
quién, quién de su familia vive. Muchas veces la familia no te cuenta nada: te tenés que dar
cuenta por lo que él o ella cuenta.

LO QUE YA SABÉS (tu ficha de trabajo, en JSON; cada etapa y cada persona tiene su número "i"):
${perfil}

LOS TEMAS QUE TODAVÍA NO SE LE PREGUNTARON (id: de qué trata):
${pendientes}

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
9. Las bisagras empiezan con la edad que tenía ("A los 12 se fue a vivir con el padre a
   Buenos Aires"). Si no hay forma de saber la edad, sin número.
10. La edad va SIEMPRE en cifras ("70", "entre 65 y 75"), nunca en letras.
11. Si hoy corrigió algo que la ficha tenía mal ("está viva", "no fue en Concordia"),
    corregilo en la fila que ya existe, por su número: no agregues otra al lado.
12. "cubiertos": los ids de los temas pendientes que HOY contó con detalle sin que se los
    preguntaran (una escena, nombres). Si solo los nombró al pasar, no.
13. "puertaAbierta": si hoy abrió algo que conviene cruzar mañana (nombró una pérdida, un
    amor, una mudanza, un trabajo) y hay un tema pendiente que lo cubre, su id. Si no, null.
14. "hoyFueFuerte": true si hoy contó algo que le costó decir: una muerte, un quiebre, una
    vergüenza. Mañana se le reconoce antes de preguntar.
15. "comoLeDicen": el nombre o apodo con que dice que le dicen en casa, tal cual lo dijo (fuente
    "dicho"). Si hoy lo aprendiste, sacá "Cómo le dicen" de "noSabemos" con "resueltos", como
    hacés con cualquier otro dato que se resuelve.

Devolvé SOLO LO QUE CAMBIÓ, en JSON, usando solo las claves que hagan falta:
{"persona":{"edad":D,"genero":D,"comoHabla":D,"anioNacimiento":D,"dondeViveHoy":D,"comoLeDicen":D},
 "agregarEtapas":[{"edades":"","anios":"","lugar":"","conQuien":"","queHacia":"","fuente":""}],
 "corregirEtapas":[{"i":0,"lugar":"..."}],
 "agregarPersonas":[{"nombre":"","vinculo":"","vive":"si|no|no se sabe","fuente":"","nota":""}],
 "corregirPersonas":[{"i":0,"vive":"si","nota":"..."}],
 "agregarBisagras":["A los 12 se fue a vivir con el padre a Buenos Aires"],"tono":"(solo si cambió)",
 "resueltos":["(el texto de noSabemos que hoy se resolvió, tal cual)"],"agregarNoSabemos":[""],
 "cubiertos":["id"],"puertaAbierta":"id|null","hoyFueFuerte":false}
donde D es {"valor":"","fuente":"dicho|ficha|deducido","por":""}. Si hoy no aprendiste nada
nuevo, devolvé {}.`;

/** La ficha para el prompt: las listas llevan su número, que es lo que el modelo usa para corregir. */
export function armarPromptPerfil(perfil: Perfil, pregunta: string, respuesta: string, pendientes: TemaPendiente[]): string {
  const numerada = {
    ...perfil,
    etapas: perfil.etapas.map((e, i) => ({ i, ...e })),
    personas: perfil.personas.map((x, i) => ({ i, ...x })),
  };
  const listaPendientes = pendientes.length ? pendientes.map((p) => `- ${p.id}: ${p.tema}`).join('\n') : '- (ninguno)';
  return PROMPT_PERFIL(JSON.stringify(numerada, null, 1), pregunta, respuesta, listaPendientes);
}

/**
 * Una actualización. Recibe el cliente (así la prueba no escribe en la base); devuelve el
 * uso para que quien llama lo anote o lo sume.
 */
export async function actualizarPerfil(
  cliente: Anthropic,
  perfil: Perfil,
  pregunta: string,
  respuesta: string,
  pendientes: TemaPendiente[],
): Promise<{ ok: boolean; perfil: Perfil; usage: Anthropic.Usage }> {
  const r = await cliente.messages.create({
    model: MODELO_PERFIL,
    max_tokens: 8000,
    messages: [{ role: 'user', content: armarPromptPerfil(perfil, pregunta, respuesta, pendientes) }],
  });
  const bloque = r.content.find((b) => b.type === 'text');
  const texto = bloque && bloque.type === 'text' ? bloque.text : '';
  return { ...parsearCambios(texto, perfil), usage: r.usage };
}
