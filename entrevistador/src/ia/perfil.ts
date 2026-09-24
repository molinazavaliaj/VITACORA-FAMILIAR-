import type Anthropic from '@anthropic-ai/sdk';
import { castellanoDe, type Castellano } from '../manual/puro.js';
import { MODELO_FICHA } from './modelos-v2.js';

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
  /** Vínculos que dijo NO tener ("no tuve hijos", "nunca me casé"): el guion no pregunta por ellos ni los supone. */
  noTuvo: string[];
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
    noTuvo: [],
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

export const VINCULOS_NO_TUVO = ['hijos', 'pareja', 'hermanos', 'nietos'] as const;
/** "hijos", "conyuge", "esposo" → el vínculo del guion; otra cosa → null. */
export function vinculoNoTuvo(vinculo: string): (typeof VINCULOS_NO_TUVO)[number] | null {
  const v = vinculo.toLowerCase();
  if (/hij/.test(v)) return 'hijos';
  if (/conyug|espos|marido|mujer|pareja|novi/.test(v)) return 'pareja';
  if (/herman/.test(v)) return 'hermanos';
  if (/niet/.test(v)) return 'nietos';
  return null;
}

/**
 * Los topes de la ficha (esqueleto v2, guion §2): la ficha es una ficha, no una transcripción.
 * `fichaCaracteres` es el objetivo medible ("nunca pasa de 2.500 tokens" = 5.750 caracteres de
 * `perfilEnTexto`); los topes por campo son máximos, pero no alcanzan solos con una vida larga
 * y con mucha familia (fix ronda 1: la ficha real de Naza daba 12.013 con los topes solos).
 */
export const TOPES = { etapaCampo: 220, bisagra: 150, bisagras: 12, notaPersona: 80, personas: 30, noSabemos: 12, tono: 300, fichaCaracteres: 5750 } as const;

/** Corta en la última oración entera que entra; si no hay ninguna, corta seco. Idempotente. */
export function recortar(texto: string, max: number): string {
  const t = texto.trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  const fin = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('; '));
  return fin > max * 0.4 ? corte.slice(0, fin + 1) : corte.trimEnd();
}

const ES_FAMILIAR = /padre|madre|papá|mamá|papa|mama|herman|hij|niet|sobrin|abuel|conyug|espos|marido|mujer|pareja|novi|tío|tía|prim/;
const esFamiliar = (vinculo: string) => ES_FAMILIAR.test(vinculo.toLowerCase());
const TIENE_EDAD = /^a los \d/i;

function dato(d: { valor: string; fuente: string } | null, nombre: string): string {
  return d ? `${nombre}: ${d.valor} (${d.fuente === 'dicho' ? 'lo dijo' : d.fuente === 'ficha' ? 'lo cargó la familia' : 'deducido'})` : `${nombre}: no se sabe`;
}

/**
 * Una etapa en una línea. La ficha de la compra puede dejar etapas a medio llenar (el oficio sin
 * edad ni lugar): se dice lo que hay, sin "- : ; con no se sabe" en el prompt.
 */
function etapaEnTexto(e: Perfil['etapas'][number]): string {
  const cuando = [e.edades, e.anios ? `(${e.anios})` : ''].filter(Boolean).join(' ') || 'edad sin saber';
  const que = [e.lugar, e.conQuien ? `con ${e.conQuien}` : '', e.queHacia].filter(Boolean).join('; ');
  return `- ${cuando}: ${que || 'sin datos'}`;
}

/** La ficha en castellano, para los prompts: lo que no se sabe dice "no se sabe". */
export function perfilEnTexto(p: Perfil): string {
  const lineas = [
    p.persona.edad ? dato(p.persona.edad, 'Edad') : dato(p.persona.anioNacimiento, 'Año de nacimiento'),
    dato(p.persona.genero, 'Mujer u hombre'),
    dato(p.persona.comoHabla, 'Cómo prefiere que le hablen'),
    dato(p.persona.dondeViveHoy, 'Dónde vive hoy'),
    '',
    'Su vida, por etapas:',
    ...(p.etapas.length ? p.etapas.map(etapaEnTexto) : ['- todavía no se sabe']),
    '',
    'Personas:',
    ...(p.personas.length ? p.personas.map((x) => `- ${x.nombre ?? '(sin nombre)'}, ${x.vinculo} — ${x.vive === 'si' ? 'vive' : x.vive === 'no' ? 'murió' : 'no se sabe si vive'}${x.nota ? ` (${x.nota})` : ''}`) : ['- todavía ninguna']),
    ...(p.bisagras.length ? ['', 'Momentos que partieron su vida:', ...p.bisagras.map((b) => `- ${b}`)] : []),
    ...(p.tono ? ['', `Cómo fue esta vida: ${p.tono}`] : []),
    ...(p.noSabemos.length ? ['', 'NO SABÉS (no lo supongas):', ...p.noSabemos.map((x) => `- ${x}`)] : []),
  ];
  return lineas.join('\n');
}

/**
 * Poda lo que ya está dentro de los topes por campo cuando, aun así, `perfilEnTexto` supera
 * `TOPES.fichaCaracteres` (fix ronda 1). Orden fijo, un escalón completo antes del siguiente, y
 * se corta apenas entra en el presupuesto:
 *   a. la nota de las personas NO familiares, de la más vieja a la más nueva;
 *   b. las personas NO familiares mismas, de la más vieja a la más nueva (familiares: nunca);
 *   c. `noSabemos`: los más viejos, dejando como mínimo 6;
 *   d. etapas: `queHacia` a 120, de la más vieja a la más nueva sin tocar la última; después
 *      `lugar` y `conQuien` a 120, mismo orden;
 *   e. bisagras: las más viejas sin edad primero, después las más viejas con edad, mínimo 6;
 *   f. notas de familiares a 40, de la más vieja a la más nueva;
 *   g. si todavía no entra, se deja así: no se inventa más poda.
 * `persona`, `noTuvo` y los nombres/vínculos/vive de los familiares nunca se tocan.
 */
function ajustarAlPresupuesto(p: Perfil): Perfil {
  const r: Perfil = structuredClone(p);
  const entra = () => perfilEnTexto(r).length <= TOPES.fichaCaracteres;
  if (entra()) return r;

  // a. la nota de las personas no familiares, de la más vieja a la más nueva
  for (const x of r.personas) {
    if (entra()) break;
    if (x.nota && !esFamiliar(x.vinculo)) delete x.nota;
  }

  // b. las personas no familiares, de la más vieja a la más nueva (nunca las familiares)
  while (!entra()) {
    const i = r.personas.findIndex((x) => !esFamiliar(x.vinculo));
    if (i < 0) break;
    r.personas.splice(i, 1);
  }

  // c. noSabemos: los más viejos, dejando como mínimo 6
  while (!entra() && r.noSabemos.length > 6) r.noSabemos.shift();

  // d. etapas: queHacia a 120 (sin tocar la última), después lugar y conQuien a 120
  for (let i = 0; i < r.etapas.length - 1 && !entra(); i++) {
    r.etapas[i] = { ...r.etapas[i], queHacia: recortar(r.etapas[i].queHacia, 120) };
  }
  for (let i = 0; i < r.etapas.length - 1 && !entra(); i++) {
    r.etapas[i] = { ...r.etapas[i], lugar: recortar(r.etapas[i].lugar, 120), conQuien: recortar(r.etapas[i].conQuien, 120) };
  }

  // e. bisagras: las más viejas sin edad primero, después las más viejas con edad; mínimo 6
  while (!entra() && r.bisagras.length > 6) {
    const iSinEdad = r.bisagras.findIndex((b) => !TIENE_EDAD.test(b));
    r.bisagras.splice(iSinEdad >= 0 ? iSinEdad : 0, 1);
  }

  // f. notas de familiares a 40, de la más vieja a la más nueva
  for (let i = 0; i < r.personas.length && !entra(); i++) {
    const x = r.personas[i];
    if (x.nota && esFamiliar(x.vinculo)) r.personas[i] = { ...x, nota: recortar(x.nota, 40) };
  }

  // g. si todavía no entra, se deja así: no se inventa más poda.
  return r;
}

/** Aplica los TOPES. Puro e idempotente: se llama después de cada cambio y sobre lo guardado. */
export function recortarPerfil(p: Perfil): Perfil {
  const r: Perfil = structuredClone(p);
  r.etapas = r.etapas.map((e) => ({ ...e, lugar: recortar(e.lugar, TOPES.etapaCampo), conQuien: recortar(e.conQuien, TOPES.etapaCampo), queHacia: recortar(e.queHacia, TOPES.etapaCampo) }));
  const conEdad = r.bisagras.filter((b) => TIENE_EDAD.test(b));
  const sinEdad = r.bisagras.filter((b) => !TIENE_EDAD.test(b));
  const cupo = TOPES.bisagras - conEdad.length;
  r.bisagras = [...conEdad, ...(cupo > 0 ? sinEdad.slice(-cupo) : [])].slice(-TOPES.bisagras).map((b) => recortar(b, TOPES.bisagra));
  r.personas = r.personas.map((x) => (x.nota ? { ...x, nota: recortar(x.nota, TOPES.notaPersona) } : x));
  if (r.personas.length > TOPES.personas) {
    const familia = r.personas.filter((x) => esFamiliar(x.vinculo));
    const resto = r.personas.filter((x) => !esFamiliar(x.vinculo));
    r.personas = [...familia, ...resto].slice(0, TOPES.personas);
  }
  r.noSabemos = r.noSabemos.slice(-TOPES.noSabemos);
  r.tono = recortar(r.tono, TOPES.tono);
  r.noTuvo = [...new Set((r.noTuvo ?? []).filter((v): v is (typeof VINCULOS_NO_TUVO)[number] => (VINCULOS_NO_TUVO as readonly string[]).includes(v)))];
  return ajustarAlPresupuesto(r);
}

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
      const v = vinculoNoTuvo(vinculo);
      if (v && !p.noTuvo.includes(v)) p.noTuvo.push(v);
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
  /** Corrige una bisagra por su número (el texto entero nuevo). Corregir pisa, no agrega (N34, N40). */
  corregirBisagras?: { i: number; texto: string }[];
  /** Vínculos que hoy dijo no tener: "hijos" | "pareja" | "hermanos" | "nietos". */
  noTuvo?: string[];
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

const palabrasClave = (t: string) => new Set(t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]{5,}/g) ?? []);
/** Dos bisagras son la misma vuelta de vida si tienen la misma edad ("A los N") y comparten la mitad de sus palabras largas. */
export function mismaVuelta(a: string, b: string): boolean {
  const ea = /^a los (\d+)/i.exec(a)?.[1], eb = /^a los (\d+)/i.exec(b)?.[1];
  if (!ea || ea !== eb) return false;
  const pa = palabrasClave(a), pb = palabrasClave(b);
  if (!pa.size || !pb.size) return false;
  const comunes = [...pa].filter((w) => pb.has(w)).length;
  return comunes >= Math.min(pa.size, pb.size) / 2;
}

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
  for (const c of lista<{ i: number; texto: string }>(cambios.corregirBisagras)) {
    if (esObjeto(c) && typeof c.texto === 'string' && c.texto.trim() && p.bisagras[c.i] !== undefined) p.bisagras[c.i] = c.texto.trim();
  }
  for (const nueva of lista<string>(cambios.agregarBisagras)) {
    if (typeof nueva !== 'string' || !nueva.trim()) continue;
    const gemela = p.bisagras.findIndex((vieja) => mismaVuelta(vieja, nueva));
    if (gemela >= 0) p.bisagras[gemela] = nueva.trim();
    else p.bisagras.push(nueva.trim());
  }
  p.bisagras = sinRepetir(p.bisagras);
  p.noTuvo = sinRepetir([...(p.noTuvo ?? []), ...lista<string>(cambios.noTuvo)]);
  if (typeof cambios.tono === 'string' && cambios.tono.trim()) p.tono = cambios.tono.trim();
  const resueltos = new Set(lista<string>(cambios.resueltos).map((r) => String(r).trim().toLowerCase()));
  p.noSabemos = sinRepetir([...p.noSabemos.filter((n) => !resueltos.has(n.trim().toLowerCase())), ...lista<string>(cambios.agregarNoSabemos)]);
  p.cubiertos = sinRepetir([...p.cubiertos, ...lista<string>(cambios.cubiertos)]);
  // puertaAbierta y hoyFueFuerte son de HOY: se reemplazan en cada respuesta, no se acumulan.
  p.puertaAbierta = typeof cambios.puertaAbierta === 'string' && cambios.puertaAbierta.trim() ? cambios.puertaAbierta.trim() : null;
  p.hoyFueFuerte = cambios.hoyFueFuerte === true;
  return recortarPerfil(p);
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
6. La línea de tiempo: etapas con edades (o años), lugar, con quién vivía y qué hacía, en DOS ORACIONES
   como mucho por campo. No reescribas una etapa que ya está: corregí por su número solo lo que
   cambió. Si algo pasó en otra ciudad, que quede claro dónde.
7. "tono": cómo fue esta vida hasta donde sabés, en una o dos líneas, sin adornar. Si hubo
   una infancia dura, decilo; si no sabés, dejalo vacío.
8. Lo que ya sabías queda: solo se corrige si hoy lo corrigió la persona.
9. Las bisagras son las vueltas de vida (una mudanza, una pérdida, un cambio de país, dejar un
   trabajo), no cada anécdota: como mucho una vuelta de vida por respuesta, de hasta 25 palabras, y
   empiezan con la edad ("A los 12 se fue a Buenos Aires"). Una anécdota va en "queHacia" de su
   etapa, corta.
10. La edad va SIEMPRE en cifras ("70", "entre 65 y 75"), nunca en letras.
11. Si hoy corrigió algo ("está viva", "no fue en Concordia", "se llamaba Homero", "no me fui a
    vivir solo a los 18"), corregilo en la fila que ya existe, por su número, con "corregirEtapas",
    "corregirPersonas" o "corregirBisagras": no agregues otra al lado.
12. "cubiertos": los ids de los temas pendientes que HOY contó con detalle sin que se los
    preguntaran (una escena, nombres). Si solo los nombró al pasar, no.
13. "noTuvo": si hoy dijo que NO tuvo hijos, pareja, hermanos o nietos, el vínculo ("hijos",
    "pareja", "hermanos", "nietos"). Nunca por deducción: solo si lo dijo.
14. "hoyFueFuerte": true si hoy contó algo que le costó decir: una muerte, un quiebre, una
    vergüenza. Mañana se le reconoce antes de preguntar.
15. "comoLeDicen": el nombre o apodo con que dice que le dicen en casa, tal cual lo dijo (fuente
    "dicho"). Si hoy lo aprendiste, sacá "Cómo le dicen" de "noSabemos" con "resueltos", como
    hacés con cualquier otro dato que se resuelve.
16. "agregarNoSabemos": solo lo que conviene preguntar después, como mucho 3 por respuesta, y
    cada uno empieza con la etapa entre corchetes: [infancia], [juventud], [adulto joven],
    [adultez media], [segunda mitad] o [hoy]. Lo que hoy se contestó va en "resueltos".

Devolvé SOLO LO QUE CAMBIÓ, en JSON, usando solo las claves que hagan falta:
{"persona":{"edad":D,"genero":D,"comoHabla":D,"anioNacimiento":D,"dondeViveHoy":D,"comoLeDicen":D},
 "agregarEtapas":[{"edades":"","anios":"","lugar":"","conQuien":"","queHacia":"","fuente":""}],
 "corregirEtapas":[{"i":0,"lugar":"..."}],
 "agregarPersonas":[{"nombre":"","vinculo":"","vive":"si|no|no se sabe","fuente":"","nota":""}],
 "corregirPersonas":[{"i":0,"vive":"si","nota":"..."}],
 "agregarBisagras":["A los 12 se fue a vivir con el padre a Buenos Aires"],
 "corregirBisagras":[{"i":0,"texto":"A los 22 se mudó por primera vez"}],"tono":"(solo si cambió)",
 "resueltos":["(el texto de noSabemos que hoy se resolvió, tal cual)"],"agregarNoSabemos":["[juventud] ..."],
 "cubiertos":["id"],"noTuvo":["hijos"],"hoyFueFuerte":false}
donde D es {"valor":"","fuente":"dicho|ficha|deducido","por":""}. Si hoy no aprendiste nada
nuevo, devolvé {}.`;

/** La ficha para el prompt: las listas llevan su número, que es lo que el modelo usa para corregir. */
export function armarPromptPerfil(perfil: Perfil, pregunta: string, respuesta: string, pendientes: TemaPendiente[]): string {
  // puertaAbierta ya no lo pide el prompt (esqueleto v2): queda en el tipo solo para no romper lo
  // ya guardado en contexto.v2, así que no viaja en la ficha que ve el modelo.
  const { puertaAbierta: _puertaAbierta, ...sinPuertaAbierta } = perfil;
  const numerada = {
    ...sinPuertaAbierta,
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
    model: MODELO_FICHA,
    max_tokens: 4000,
    messages: [{ role: 'user', content: armarPromptPerfil(perfil, pregunta, respuesta, pendientes) }],
  });
  const bloque = r.content.find((b) => b.type === 'text');
  const texto = bloque && bloque.type === 'text' ? bloque.text : '';
  return { ...parsearCambios(texto, perfil), usage: r.usage };
}
