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

export type Rechazo = { ok: false; control: 'trato' | 'largo' | 'pregunta' | 'lugar' | 'supuestos'; motivo: string };
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
const SUPUESTOS: { re: RegExp; exime?: RegExp; vinculos: RegExp; nombre: string }[] = [
  {
    re: /\b(tus|sus) (hij[oa]s?|chic[oa]s?)\b|\bhij[oa]s? de chic[oa]s?\b/,
    exime: /\b(tuvi?ste|tuvo|hub[oi]) (hij[oa]s?|chic[oa]s?)\b/,
    vinculos: /hij/,
    nombre: 'hijos',
  },
  {
    re: /\bniet[oa]s?\b/,
    exime: /\b(tuvi?ste|tuvo|hub[oi]) niet[oa]s?\b/,
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
 * Todos los controles juntos, en orden: primero la forma (trato, largo, que pregunte algo —
 * `encargo-entrevista.ts`), y solo si la forma está bien, el lugar y los supuestos. La
 * presentación no es una pregunta del día: se controla la forma nomás (con su propio tope de
 * palabras) y no se le exige lugar ni supuestos.
 */
export function controlarPregunta(texto: string, perfil: Perfil, objetivo: Objetivo): { ok: true } | Rechazo {
  const presentacion = esPresentacion(objetivo);
  const forma = controlarTexto(texto, tratoDelPerfil(perfil), { presentacion });
  if (!forma.ok) {
    const control = /habla de otra manera/.test(forma.motivo) ? 'trato' : /palabras/.test(forma.motivo) ? 'largo' : 'pregunta';
    return { ok: false, control, motivo: forma.motivo };
  }
  if (presentacion) return { ok: true };
  const lugar = controlarLugar(texto, perfil, objetivo);
  if (!lugar.ok) return lugar;
  return controlarSupuestos(texto, perfil);
}
