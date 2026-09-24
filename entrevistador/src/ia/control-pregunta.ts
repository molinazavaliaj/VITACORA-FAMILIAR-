import type { Perfil } from './perfil.js';
import { rangoDeEtapa, edadDe, RANGO_TRAMO } from './plan-preguntas.js';
import { controlarTexto, tratoDelPerfil } from './encargo-entrevista.js';
import type { Objetivo } from './pregunta-v2.js';

// Los controles sobre la SALIDA (diseño §2.7, biógrafo v2): antes solo se controlaba la forma
// (trato, largo, que pregunte algo); estos dos miran el CONTENIDO. C6: cuatro veces se mandó a
// Ciro a Concordia cuando a esa edad ya vivía en Buenos Aires. C12/C13/35: se le preguntó por
// hijos, boda y esposa que el perfil no respalda. `control-pregunta.ts` y `pregunta-v2.ts` se
// importan mutuamente (acá solo tipos, para que no haya ciclo en tiempo de ejecución): por eso
// `esPresentacion` se recalcula acá en vez de importarse.
const esPresentacion = (o: Objetivo) => o.tipo === 'nucleo' && o.id === 'presentacion';

export type Rechazo = { ok: false; control: 'trato' | 'largo' | 'pregunta' | 'lugar' | 'supuestos' | 'genero'; motivo: string };
export type Marca = { control: string; motivo: string; intentos: number };
/** Cuántas veces se le pide al modelo que reescriba antes de mandar la última igual, marcada. */
export const INTENTOS = 3;

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * ¿`textoNormal` nombra `nombreNormal` como palabra (o frase) entera, no como parte de otra?
 * ("Salta" no tiene que cazar "saltabas", ni "Roma" a "romántico", ni "Pilar" a "pilares" —
 * fix ronda 1: antes se usaba `.includes()`, que los confundía a los cuatro).
 */
function nombraLugar(textoNormal: string, nombreNormal: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escaparRegex(nombreNormal)}([^a-z0-9]|$)`).test(textoNormal);
}

/**
 * "Buenos Aires (Núñez)" → [{normal:"buenos aires", original:"Buenos Aires"}, {normal:"nunez",
 * original:"Núñez"}]: la ciudad y lo que va entre paréntesis. `normal` es para comparar (sin
 * acentos ni mayúsculas); `original` es para el motivo que lee Naza, tal como está en el perfil.
 */
function nombresDeLugar(lugar: string): { normal: string; original: string }[] {
  return lugar.split(/[(),/]| y /).map((x) => x.trim()).filter((x) => x.length >= 3).map((x) => ({ normal: sinAcentos(x), original: x }));
}

/**
 * ¿La pregunta nombra una ciudad que no es la de esta persona en esos años? (C6). Si no se puede
 * saber el rango de años del objetivo, o el perfil no tiene etapas con lugar, no controla: mejor
 * dejar pasar que rechazar con datos que no hay. El objeto (la foto de esa época) también pasa
 * por este control — diseño §2.7, "el objeto también pasa por los controles": si pide una foto
 * de Concordia para el tramo en que ya vivía en Buenos Aires, es el mismo error que en una
 * pregunta. El objeto final (de toda su vida) no se controla.
 */
export function controlarLugar(texto: string, perfil: Perfil, objetivo: Objetivo): { ok: true } | Rechazo {
  // El objeto final pide algo de toda la vida: cualquier ciudad donde vivió vale (arreglo final I3).
  if (objetivo.tipo === 'objeto' && objetivo.final) return { ok: true };
  const tramoObjetivo = objetivo.tipo === 'variable' || objetivo.tipo === 'objeto' ? objetivo.tramo : objetivo.tramo ?? null;
  if (!tramoObjetivo) return { ok: true };
  const edad = edadDe(perfil, new Date().getFullYear()) ?? 100;
  const etapas = perfil.etapas.map((e) => ({ rango: rangoDeEtapa(e.edades, edad), nombres: nombresDeLugar(e.lugar) })).filter((e) => e.rango && e.nombres.length);
  if (!etapas.length) return { ok: true };
  const [desde, hasta] = objetivo.tipo === 'variable' ? [objetivo.desde, objetivo.hasta] : (RANGO_TRAMO[tramoObjetivo] ?? [0, 200]);
  const limpio = sinAcentos(texto);
  const nombrados = etapas.flatMap((e) => e.nombres.filter((n) => nombraLugar(limpio, n.normal)));
  if (!nombrados.length) return { ok: true };
  const deLaEpoca = etapas.filter((e) => e.rango![0] <= hasta && e.rango![1] >= desde).flatMap((e) => e.nombres);
  const ajenos = nombrados.filter((n) => !deLaEpoca.some((d) => d.normal === n.normal));
  if (!ajenos.length) return { ok: true };
  const listar = (ns: typeof nombrados) => ns.map((n) => n.original).join(', ') || 'otro lado';
  return { ok: false, control: 'lugar', motivo: `entre los ${desde} y los ${hasta} años vivía en ${listar(deLaEpoca).replace(/, /g, ' / ')}, no en ${listar(ajenos)}` };
}

/**
 * Palabras que dan por hecho una vida, y qué vínculo tiene que estar en el perfil para que
 * valgan. Todos los patrones están escritos SIN acentos: se comparan contra el texto ya pasado
 * por `sinAcentos` ("señora" nunca iba a matchear ahí — fix ronda 1).
 *
 * `exime`: la forma de preguntar SI hubo, pero pegada a ESE sustantivo ("tuviste hijos", "hubo
 * pareja", "te enamoraste"). Antes había un único escape global (`alguna vez`, `tuviste`...) que
 * desactivaba TODOS los supuestos en toda la frase: "¿Alguna vez tus hijos te preguntaron por tu
 * padre?" pasaba con la ficha vacía porque "alguna vez" aparecía en algún lado del texto, no
 * importa dónde. Ahora el escape tiene que estar pegado al mismo sustantivo que dispara el
 * supuesto (fix ronda 1).
 */
/**
 * Arreglo final M1: la pregunta ABIERTA por hijos o nietos ("¿tenés nietos o sobrinos?", "¿tenés
 * pareja, hermanos, nietos?", "tus nietos, si los hay") no da nada por hecho. Las filas del censo y
 * de la familia de hoy nombran hijos y nietos en sus pormenores, y sin esto cada una se rechazaba y
 * gastaba hasta 3 llamadas a Opus. El verbo va antes del sustantivo (con hasta 4 cosas en lista en el
 * medio: "tenés pareja, hermanos, nietos"), o "si los hay" justo después. Las afirmaciones ("tus
 * nietos te quieren", "¿qué hay de tus nietos?") siguen rechazadas.
 */
const preguntaAbierta = (sustantivo: string) =>
  `\\b(tenes|tiene|tenia|hay) ([a-z]+(, | o | y )){0,4}${sustantivo}\\b|\\b${sustantivo},? si (los|las) hay\\b`;

const SUPUESTOS: { re: RegExp; exime?: RegExp; vinculos: RegExp; nombre: string }[] = [
  {
    re: /\b(tus|sus) (hij[oa]s?|chic[oa]s?)\b|\bhij[oa]s? de chic[oa]s?\b/,
    exime: new RegExp(`\\b(tuvi?ste|tuvo|hub[oi]) (hij[oa]s?|chic[oa]s?)\\b|${preguntaAbierta('(hij[oa]s?|chic[oa]s?)')}`),
    vinculos: /hij/,
    nombre: 'hijos',
  },
  {
    re: /\bniet[oa]s?\b/,
    exime: new RegExp(`\\b(tuvi?ste|tuvo|hub[oi]) niet[oa]s?\\b|${preguntaAbierta('niet[oa]s?')}`),
    vinculos: /niet/,
    nombre: 'nietos',
  },
  {
    re: /\b(tu|su) (esposa|esposo|marido|mujer|senora|pareja|novia|novio)\b/,
    exime: /\b(tuvi?ste|tuvo|hub[oi]) (pareja|novi[oa]|esposa|esposo|marido|mujer)\b|\bte enamoraste\b|\bse enamoro\b/,
    vinculos: /espos|marido|mujer|pareja|novi|conyuge/,
    nombre: 'pareja',
  },
  {
    re: /\b(la|tu|su) boda\b|\b(el|tu|su) casamiento\b|\bte casaste\b|\bse caso\b|\bcasarte\b|\bcasarse\b/,
    vinculos: /espos|marido|mujer|conyuge/,
    nombre: 'boda',
  },
];

/** ¿La pregunta da por hecho hijos, nietos, pareja o boda que el perfil no respalda? (C12/C13/35). */
export function controlarSupuestos(texto: string, perfil: Perfil): { ok: true } | Rechazo {
  const limpio = sinAcentos(texto);
  const vinculos = perfil.personas.map((p) => sinAcentos(p.vinculo)).join(' ');
  for (const s of SUPUESTOS) {
    if (!s.re.test(limpio)) continue;
    if (s.exime?.test(limpio)) continue;
    if (s.vinculos.test(vinculos)) continue;
    return { ok: false, control: 'supuestos', motivo: `supone ${s.nombre} y la ficha no dice que los tenga: preguntá si hubo, o no lo nombres` };
  }
  return { ok: true };
}

/**
 * Verbos que se dirigen a la persona con un clítico pegado que ya elige género (conocerLA,
 * llamarLO...). Lista corta y cerrada a propósito: son los que aparecen en la presentación y en
 * preguntas del día (conocer, llamar, escuchar, acompañar). Sin acentos, como todo acá.
 */
const CLITICOS_GENERO = ['conocerla', 'conocerlo', 'llamarla', 'llamarlo', 'escucharla', 'escucharlo', 'acompanarla', 'acompanarlo'];

/**
 * ¿La pregunta se dirige a la persona en un género que la ficha no respalda? Piloto del 24/09:
 * con `perfil.persona.genero` vacío, la presentación salió en femenino ("necesito conocerLA un
 * poco... ¿cómo LA llaman los suyos?") — el encargo ya pide "escribí de manera que sirva para
 * los dos" pero nada lo controlaba, porque trato/largo/pregunta no miran género. Este control
 * agarra los casos más claros y comunes (clíticos pegados a un verbo que se dirige a la
 * persona, "la/lo llaman", y un puñado de adjetivos de saludo) y no más: una lista corta,
 * porque cada rechazo de más es un reintento pago. "solo" (= únicamente) y palabras ambiguas
 * como cansada/tranquila/segura quedan afuera a propósito: no hay forma barata de saber si
 * ahí son de segunda persona sin correr el riesgo de rechazar de más. Cuando el perfil YA sabe
 * el género (mujer u hombre), este control no hace nada nuevo.
 */
export function controlarGenero(texto: string, perfil: Perfil): { ok: true } | Rechazo {
  const g = perfil.persona.genero?.valor?.toLowerCase() ?? '';
  if (g.includes('mujer') || g.includes('hombre')) return { ok: true };
  const limpio = sinAcentos(texto);
  for (const c of CLITICOS_GENERO) {
    if (new RegExp(`\\b${c}\\b`).test(limpio)) {
      return { ok: false, control: 'genero', motivo: `no se sabe si es mujer u hombre y "${c}" ya elige: escribí de manera que sirva para los dos, sin la/lo pegado a la persona` };
    }
  }
  if (/\b(la|lo) llaman\b/.test(limpio)) {
    return { ok: false, control: 'genero', motivo: 'no se sabe si es mujer u hombre y "la/lo llaman" ya elige: probá "cómo le dicen"' };
  }
  if (/(?<!\bla )\bbienvenida\b/.test(limpio) || /\bbienvenido\b/.test(limpio)) {
    return { ok: false, control: 'genero', motivo: 'no se sabe si es mujer u hombre y "bienvenida/bienvenido" ya elige' };
  }
  if (/\bquerida\b/.test(limpio) || /\bquerido\b/.test(limpio)) {
    return { ok: false, control: 'genero', motivo: 'no se sabe si es mujer u hombre y "querida/querido" ya elige' };
  }
  return { ok: true };
}

/**
 * Todos los controles juntos, en orden: primero la forma (trato, largo, que pregunte algo —
 * `encargo-entrevista.ts`), después el género (también en la presentación: ahí fue donde
 * falló). Solo si eso está bien, el lugar y los supuestos. La presentación no es una pregunta
 * del día: no se le exige lugar ni supuestos.
 */
export function controlarPregunta(texto: string, perfil: Perfil, objetivo: Objetivo): { ok: true } | Rechazo {
  const presentacion = esPresentacion(objetivo);
  const forma = controlarTexto(texto, tratoDelPerfil(perfil), { presentacion });
  if (!forma.ok) {
    const control = /habla de otra manera/.test(forma.motivo) ? 'trato' : /palabras/.test(forma.motivo) ? 'largo' : 'pregunta';
    return { ok: false, control, motivo: forma.motivo };
  }
  const genero = controlarGenero(texto, perfil);
  if (!genero.ok) return genero;
  if (presentacion) return { ok: true };
  const lugar = controlarLugar(texto, perfil, objetivo);
  if (!lugar.ok) return lugar;
  return controlarSupuestos(texto, perfil);
}
