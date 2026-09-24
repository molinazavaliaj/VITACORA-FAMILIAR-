import { perfilEnTexto, type Perfil } from './perfil.js';
import { RANGO_TRAMO, edadDe, rangoDeEtapa, type Tramo } from './plan-preguntas.js';
import { slug } from '../manual/puro.js';

// El guion del esqueleto v2 (`docs/esqueleto-v2-guion-para-aprobar.md`, aprobado por Naza el 24/09).
// Cada fila es un TEMA con condición. Quién decide si entra: el código, con la ficha (`arbolDe`,
// la edad, los países de las etapas). Cuando la ficha no sabe, la fila se vuelve PUERTA (pregunta si
// hubo) en vez de suponer o saltearse. El modelo no elige qué preguntar: elige cómo (pregunta-v2.ts).
//
// Fix ronda 1 (revisión + decisiones del controlador, `task-4-fix1-spec.md`): el guion aprobado
// (§3-§5) manda sobre el código del plan. Cambios: la historia grande enganchaba mal o se perdía
// (A); el regex de pareja daba falsos positivos con complementos ("compañero de trabajo") (B);
// `perdidas` re-testeaba vínculos por su cuenta y perdía medio hermanos (C); pormenores, temas,
// variantes/condiciones e ids de puerta se alinearon con §3 fila por fila (D).
//
// Fix ronda 2 (`task-4-fix2-spec.md`): pormenores todavía no eran verbatim de §3 en varias filas;
// varios temas de reflexión y de las variantes tenían contenido agregado; `dejar-el-trabajo`
// necesitaba que "sigue trabajando" se chequeara ANTES que la edad y que "se jubiló" (si no, a los
// 70 "sigue trabajando" quedaba con la fila normal); `pareja-como-llego` y `los-hijos-creciendo`
// comparten una sola variante `quienes-fueron-tu-familia` (antes tenían dos ids distintos, y podían
// entrar las dos juntas); "el que más aparece" ahora cuenta la palabra completa, no un substring
// ("Ana" ya no suma por aparecer dentro de "Anastasia"); `esPareja` excluye también "del".

export type Etapa = 'inicio' | Tramo | 'futuro' | 'reflexion';
export type Bloque = 'presentacion' | Etapa;
export type Condicion =
  | 'siempre'
  | { edadMin: number }
  | { arbol: 'hermanos' | 'hijos' | 'pareja' | 'nietos' | 'padresGrandes' | 'perdidas' }
  | { evento: true };
export type Fila = {
  id: string;
  etapa: Etapa;
  /** Para la fábrica (época de la respuesta) y los objetos. null = cruza la vida o no es una época. */
  tramo: Tramo | null;
  tema: string;
  pormenores: string[];
  aplica: Condicion;
  /** Si la ficha dice explícitamente que NO tuvo (`noTuvo`): variante, o se cae. Sin esto, se cae. */
  siNoTuvo?: { modo: 'variante'; id: string; tema: string; pormenores?: string[] } | { modo: 'cae' };
  /** Si no se sabe (ni consta que tuvo ni que no tuvo): puerta, variante, o se cae (default). */
  siNoSeSabe?: { modo: 'puerta'; id: string; tema: string } | { modo: 'variante'; id: string; tema: string; pormenores?: string[] } | { modo: 'cae' };
  expandePor?: 'hermanos' | 'hijos';
  inamovible?: boolean;
  pideEscena?: boolean;
};
export type FilaObjetivo = { id: string; tramo: Tramo | null; bloque: Bloque; tema: string; pormenores: string[]; pideEscena?: boolean; fila: string };
export type Caida = { id: string; motivo: string };

export const MAX_LIBRES = 4;
export const TOPE = 40;
export const TOPE_MAYORES = 44;
/** Más expansiones que esto por vínculo: una "de todos" y una por el que más aparece en la ficha. */
const MAX_POR_VINCULO = 3;

export function tope(edad: number | null): number {
  return edad !== null && edad >= 56 ? TOPE_MAYORES : TOPE;
}

const S = 'siempre' as const;
const puerta = (id: string, tema: string) => ({ modo: 'puerta' as const, id, tema });
const variante = (id: string, tema: string, pormenores?: string[]) => ({ modo: 'variante' as const, id, tema, pormenores });
const cae = { modo: 'cae' as const };
// §4: se pregunta "cómo se vivió en su casa" y "qué cambió", nunca de qué lado estuvo (esa
// instrucción va en el tema, no es un pormenor preguntable — fix D.1, sacado "quién estaba", que
// no está en §3 ni en §4).
const HISTORIA = 'Lo grande que le tocó al país en esa época ({EVENTO}). Sin dar por hecho de qué lado estuvo.';
const HISTORIA_PORMENORES = ['cómo se vivió en su casa', 'qué cambió'];
/**
 * Fix ronda 2, ítem D.3: §3 le da el mismo destino ("quienes-fueron-tu-familia") a la fila 16
 * (pareja-como-llego, si dijo que no) y a la fila 22 (los-hijos-creciendo, si dijo que no): una
 * sola variante compartida, con el texto de la fila 22 (la que lo dice más completo). Si las dos
 * filas la disparan para la misma persona (sin pareja NI hijos), `armarGuion` deja pasar solo la
 * primera y cae la segunda con motivo "ya entra quienes-fueron-tu-familia".
 */
const FAMILIA_VARIANTE = variante('quienes-fueron-tu-familia', 'De quién se ocupó y quién fue su familia en esos años.', ['de quién se ocupó', 'quién fue su familia']);

export const GUION: readonly Fila[] = [
  // Inicio
  { id: 'presentacion', etapa: 'inicio', tramo: null, inamovible: true, aplica: S, pormenores: [], tema: 'Es el PRIMER mensaje: la bienvenida. Saludá por su nombre, decí quién sos (el biógrafo que va a escribir el libro de su vida) y quién le regala este libro (si la ficha lo dice), cómo va a ser esto (una pregunta por día, se contesta con un audio cuando pueda, sin apuro), y lo que necesitás saber para escribirle bien: cómo prefiere que le hablen ({TRATOS}), {EDAD}cómo le dicen en casa. Entre 70 y 90 palabras, cálido, sin barras ("la/lo"): escribí de manera que sirva para los dos. No es una pregunta del día: no preguntes todavía por su vida.' },
  { id: 'casa-infancia', etapa: 'inicio', tramo: 'infancia', inamovible: true, aplica: S, pideEscena: true, tema: 'La casa donde pasó su infancia, como una escena: si cierra los ojos y entra por la puerta, qué ve, qué huele, quién está. Usá lo que la presentación ya sacó (el trato, cómo le dicen).', pormenores: ['qué ve al entrar', 'quién está', 'olores', 'la calle'] },
  { id: 'los-tuyos-hoy', etapa: 'inicio', tramo: null, inamovible: true, aplica: S, tema: 'El censo: quiénes son los suyos hoy. Es para saber con quién habla el libro. Escrita cálida, no como formulario, y sin dar por hecho que tiene ninguno de ellos ("contame quiénes son los tuyos hoy").', pormenores: ['pareja', 'hijos', 'hermanos', 'nietos', 'sobrinos', 'si los padres viven', 'nombres y edades como salgan'] },
  { id: 'mapa-casas', etapa: 'inicio', tramo: null, inamovible: true, aplica: S, tema: 'Las casas de su vida, una tras otra. Si todavía no sabés su edad, este es el lugar para que salga sola.', pormenores: ['ciudad', 'con quién', 'hasta qué edad'] },
  { id: 'mapa-capitulos', etapa: 'inicio', tramo: null, inamovible: true, aplica: S, tema: 'Si su vida fuera un libro, los capítulos.', pormenores: ['qué abrió y cerró cada uno'] },
  // Infancia
  { id: 'padres-como-eran', etapa: 'infancia', tramo: 'infancia', aplica: S, tema: 'Cómo era su mamá y cómo era su papá (o quienes le criaron): el carácter, no la cronología. Si la ficha no tiene padres, "quienes le criaron".', pormenores: ['qué decía cada uno', 'cómo lo trataba', 'en qué se parece él/ella', 'una escena de cada uno'] },
  { id: 'hermano', etapa: 'infancia', tramo: 'infancia', aplica: { arbol: 'hermanos' }, expandePor: 'hermanos', tema: 'Cada hermano/a {NOMBRE}, uno por uno: cómo es, cómo era de chico, la relación.', pormenores: ['qué hacían juntos', 'peleas', 'con quién se llevaba mejor', 'cómo es hoy'], siNoTuvo: variante('hijo-unico', 'Cómo era ser el único/a.', []), siNoSeSabe: puerta('hermanos-puerta', '¿Tuviste hermanos, o fuiste hijo/a único/a?') },
  { id: 'abuelos-y-raices', etapa: 'infancia', tramo: 'infancia', aplica: S, tema: 'Los abuelos y de dónde viene la familia. Si no conoció abuelos, qué sabe de ellos y de dónde venían.', pormenores: ['de qué pueblo o país', 'cómo llegaron', 'apellidos', 'lo que le contaban'] },
  { id: 'la-cuadra-y-los-juegos', etapa: 'infancia', tramo: 'infancia', aplica: S, pideEscena: true, tema: 'La cuadra, los juegos y los amigos del barrio, en UNA sola pregunta. Elegí dos o tres pormenores según lo que ya contó y pedilos juntos.', pormenores: ['a qué jugaba', 'con quién', 'los animales de la casa', 'los fines de semana', 'las vacaciones', 'hasta qué hora lo dejaban'] },
  { id: 'la-escuela', etapa: 'infancia', tramo: 'infancia', aplica: S, tema: 'La escuela primaria.', pormenores: ['un maestro', 'un compañero', 'cómo le iba', 'si cambió de colegio y por qué'] },
  // Juventud
  { id: 'a-los-quince', etapa: 'juventud', tramo: 'juventud', aplica: S, tema: 'Qué hacía a los quince fuera de la escuela, y con quién (junta la banda de esa época). Sin dar por hecho que salía.', pormenores: ['dónde paraban', 'qué sonaba', 'cómo se vestían', 'un sábado a la noche'] },
  { id: 'estudios', etapa: 'juventud', tramo: 'juventud', aplica: S, tema: 'Hasta dónde llegó con los estudios y cómo fue esa decisión.', pormenores: ['secundaria, facultad u oficio', 'si lo eligió o lo eligió la vida', 'quién lo apoyó'] },
  { id: 'primer-trabajo', etapa: 'juventud', tramo: 'juventud', aplica: S, tema: 'El primer trabajo y la primera plata. Si ya contó que no trabajó de joven, preguntá de qué vivía y cuál fue la primera plata propia.', pormenores: ['cómo lo consiguió', 'qué hizo con esa plata'] },
  { id: 'primer-amor', etapa: 'juventud', tramo: 'juventud', aplica: S, tema: 'Si se enamoró, de quién, cómo fue. Sin dar por hecho pareja ni género: si no sabés, preguntá si hubo alguna vez en esos años.', pormenores: ['cómo se conocieron', 'cómo se dio cuenta', 'cómo terminó o siguió'] },
  { id: 'historia-grande', etapa: 'juventud', tramo: 'juventud', aplica: { evento: true }, tema: HISTORIA, pormenores: HISTORIA_PORMENORES },
  // Adulto joven
  { id: 'oficio', etapa: 'adulto joven', tramo: 'adulto joven', aplica: S, tema: 'A qué le dedicó la vida y cómo llegó ahí. Si la ficha no lo ubica en el tiempo, va acá igual.', pormenores: ['si lo eligió, lo heredó o se dio', 'un día de trabajo', 'qué le gustaba'] },
  { id: 'pareja-como-llego', etapa: 'adulto joven', tramo: 'adulto joven', aplica: { arbol: 'pareja' }, tema: 'Con quién hizo su vida y cómo llegó esa persona ({NOMBRE}). NO la boda.', pormenores: ['el día que se conocieron', 'quién dio el primer paso', 'cómo era ella/él', 'cómo lo recibieron las familias'], siNoTuvo: FAMILIA_VARIANTE, siNoSeSabe: puerta('pareja-puerta', '¿Hubo alguien con quien hiciste tu vida?') },
  { id: 'hijos-llegada', etapa: 'adulto joven', tramo: 'adulto joven', aplica: { arbol: 'hijos' }, tema: 'El día que nació su primer hijo/a y cómo fueron llegando los demás.', pormenores: ['dónde estaba', 'qué sintió', 'cómo eligieron el nombre'] },
  { id: 'hijo', etapa: 'adulto joven', tramo: 'adulto joven', aplica: { arbol: 'hijos' }, expandePor: 'hijos', tema: 'Cada hijo/a {NOMBRE}, uno por uno: cómo es, a quién salió, qué admira.', pormenores: ['cómo era de chico/a', 'una escena', 'cómo es hoy'] },
  { id: 'un-lugar-que-cambio-algo', etapa: 'adulto joven', tramo: null, aplica: S, tema: 'Un lugar que le cambió la vida: una mudanza, un viaje, otro país, otra ciudad. Quién lo esperaba, sin suponerlo. Si no se mudó nunca: la esquina de siempre, qué la hace suya.', pormenores: ['el primer día ahí', 'quién lo esperaba', 'qué dejó atrás', 'por qué se fue'] },
  { id: 'amigos-de-siempre', etapa: 'adulto joven', tramo: null, aplica: S, tema: 'Los amigos de la vida adulta: del trabajo, del club, los que quedaron de antes.', pormenores: ['una escena con ellos', 'cómo se mantienen'] },
  // Adultez media (por-gusto cruza la vida: si no vivió esta etapa, armarGuion la baja al adulto joven)
  { id: 'el-trabajo-y-la-plata', etapa: 'adultez media', tramo: 'adultez media', aplica: { edadMin: 36 }, tema: 'Los años fuertes del trabajo, y la plata con confianza.', pormenores: ['la mejor anécdota', 'un jefe o un socio', 'épocas flacas', 'un riesgo (un negocio, una casa)', 'qué relación ve entre la plata y la felicidad'] },
  { id: 'los-hijos-creciendo', etapa: 'adultez media', tramo: 'adultez media', aplica: { arbol: 'hijos' }, tema: 'Cómo fue como madre/padre mientras crecían.', pormenores: ['qué quiso darles que no tuvo', 'qué le costó', 'una escena de la mesa o de un viaje'], siNoTuvo: FAMILIA_VARIANTE },
  { id: 'la-pareja-con-los-anos', etapa: 'adultez media', tramo: 'adultez media', aplica: { arbol: 'pareja' }, tema: 'La pareja con los años ({NOMBRE}): las tormentas, cómo siguieron o cómo terminó. Si enviudó o se separó, cómo fue y quién estuvo.', pormenores: ['una crisis', 'una reconciliación', 'qué aprendió'] },
  { id: 'los-padres-de-grande', etapa: 'adultez media', tramo: 'adultez media', aplica: { arbol: 'padresGrandes' }, tema: 'Sus padres cuando ya era grande: cómo envejecieron, cómo los acompañó, cómo fue perderlos. Si viven, cómo es la relación hoy: no supongas la muerte.', pormenores: ['quién se ocupó', 'una charla que recuerde', 'qué le dejaron dicho'] },
  { id: 'por-gusto', etapa: 'adultez media', tramo: null, aplica: S, tema: 'Lo que hacía por gusto, cuando nadie se lo pedía: lo que ya nombró. Si no nombró nada, preguntá abierto.', pormenores: ['el club', 'la huerta', 'la música', 'el baile', 'la pesca', 'con quién'] },
  { id: 'historia-grande', etapa: 'adultez media', tramo: 'adultez media', aplica: { evento: true }, tema: HISTORIA, pormenores: HISTORIA_PORMENORES },
  // Segunda mitad
  { id: 'dejar-el-trabajo', etapa: 'segunda mitad', tramo: 'segunda mitad', aplica: { edadMin: 60 }, tema: 'La jubilación o dejar el trabajo: cómo fue ese día, qué hizo con el tiempo.', pormenores: ['qué extraña', 'qué no', 'a qué se dedicó después'] },
  { id: 'nietos', etapa: 'segunda mitad', tramo: 'segunda mitad', aplica: { arbol: 'nietos' }, tema: 'Los nietos ({NOMBRES}): quiénes son, cómo es ser abuela/o.', pormenores: ['uno por uno si son pocos', 'una escena con ellos', 'qué les quiere enseñar'] },
  { id: 'perdidas', etapa: 'segunda mitad', tramo: 'segunda mitad', aplica: { arbol: 'perdidas' }, tema: 'Las personas que perdió en estos años ({NOMBRES}) (pareja, hermanos, amigos), con tacto. Solo las que la ficha dice que murieron.', pormenores: ['cómo fue', 'quién estuvo', 'cómo las lleva consigo'] },
  { id: 'historia-grande', etapa: 'segunda mitad', tramo: 'segunda mitad', aplica: { evento: true }, tema: HISTORIA, pormenores: HISTORIA_PORMENORES },
  // Hoy
  { id: 'un-dia-de-hoy', etapa: 'hoy', tramo: 'hoy', inamovible: true, aplica: S, tema: 'Cómo es un día suyo hoy.', pormenores: ['dónde vive', 'con quién', 'qué hace', 'qué le alegra', 'qué le duele'] },
  { id: 'los-tuyos-hoy-como-estan', etapa: 'hoy', tramo: 'hoy', inamovible: true, aplica: S, tema: 'La familia hoy: cómo está cada uno y cómo es la relación (sobrinos, hermanos, hijos, la pareja). Sin dar por hecho nada que el censo no dijo.', pormenores: ['quién vive cerca', 'a quién ve', 'a quién extraña', 'los sobrinos y los nietos si los hay'] },
  // Futuro
  { id: 'lo-que-te-queda-por-hacer', etapa: 'futuro', tramo: null, inamovible: true, aplica: S, tema: 'Lo que quiere para su vida de acá en adelante: sueños, planes, lo que le queda por ver. A los veinte es la mitad del libro; a los ochenta es "qué le queda por hacer y qué ya no".', pormenores: ['un viaje', 'un proyecto', 'una mudanza', 'la música', 'la libertad'] },
  { id: 'lo-que-esperas-para-los-tuyos', etapa: 'futuro', tramo: null, inamovible: true, aplica: S, tema: 'Lo que espera para los suyos. Sin dar por hecho hijos ni nietos: usa el censo.', pormenores: ['hijos', 'nietos', 'hermanos', 'la pareja'] },
  // Reflexión
  { id: 'pruebas', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Las pruebas que le puso la vida. Lo que quiera contar, como quiera.', pormenores: [] },
  { id: 'fuerza', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'De dónde sacó fuerza y qué aprendió que quiera dejar dicho.', pormenores: [] },
  { id: 'alegrias', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Sus alegrías más grandes, sus orgullos, los dichos que repite.', pormenores: [] },
  { id: 'lo-que-falta', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Qué no le preguntaste que tiene que estar en el libro.', pormenores: [] },
  { id: 'mensaje', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Qué les quiere decir a los que escuchen esto dentro de cincuenta años (sin dar por hecho que tiene hijos o nietos).', pormenores: [] },
  { id: 'cinco-minutos', etapa: 'reflexion', tramo: null, inamovible: true, aplica: S, tema: 'Su vida en cinco minutos.', pormenores: [] },
];

// ── El árbol ────────────────────────────────────────────────────────────────
export type Arbol = {
  hermanos: string[]; hijos: string[]; pareja: string[]; nietos: string[]; sobrinos: string[];
  padres: { nombre: string; vive: 'si' | 'no' | 'no se sabe' }[];
  perdidas: string[];
  noTuvo: string[];
};

const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
/**
 * El vínculo tiene que EMPEZAR por la palabra ("hijo mayor" sí; "hijo de un amigo" no). El
 * `\b` en `(?! de\b)` es necesario: sin él, "hermano DEL medio" quedaba excluido por error,
 * porque " de" es prefijo de " del" (fix ronda 1, con el test de los 4 hermanos).
 */
const empieza = (vinculo: string, re: RegExp) => re.test(norm(vinculo));

/** "hermano", "hermano del medio", pero también "hermano de padre/madre" y "medio hermano" (fix ronda 1, ítem C). */
const esHermano = (v: string) =>
  empieza(v, /^herman[oa]s?\b(?! de\b)/) ||
  empieza(v, /^herman[oa]s?\s+de\s+(padre|madre)\b/) ||
  empieza(v, /^medio\s*herman[oa]s?\b/);

/**
 * Pareja, pero no un complemento con "de"/"del" ("compañero de trabajo", "novia de Ariel", "mujer
 * de mi hermano", "compañero del club", "novia del colegio"): mismo criterio que hermano/hijo/
 * nieto, pero excluyendo también "del" (fix ronda 1, ítem B; "del" sumado en la ronda 2). "Compañero/a"
 * solo cuenta solo o como "compañera/o de vida".
 */
const esPareja = (v: string) => {
  if (empieza(v, /^companer[oa]\s+de\s+vida\b/)) return true;
  return empieza(v, /^(pareja|novi[oa]|espos[oa]|marido|mujer|conyuge|companer[oa])\b(?!\s+(de|del)\b)/);
};

export function arbolDe(p: Perfil): Arbol {
  const a: Arbol = { hermanos: [], hijos: [], pareja: [], nietos: [], sobrinos: [], padres: [], perdidas: [], noTuvo: [...(p.noTuvo ?? [])] };
  const amigos: string[] = [];
  for (const x of p.personas) {
    const v = x.vinculo;
    if (esHermano(v)) a.hermanos.push(x.nombre);
    else if (empieza(v, /^hij[oa]s?\b(?! de\b)/)) a.hijos.push(x.nombre);
    else if (esPareja(v)) a.pareja.push(x.nombre);
    else if (empieza(v, /^niet[oa]s?\b(?! de\b)/)) a.nietos.push(x.nombre);
    else if (empieza(v, /^sobrin[oa]s?\b(?! de\b)/)) a.sobrinos.push(x.nombre);
    else if (empieza(v, /^(padre|madre|papa|mama|padrastro|madrastra)\b(?! de\b)/)) a.padres.push({ nombre: x.nombre, vive: x.vive });
    else if (empieza(v, /^amig[oa]s?\b(?! de\b)/)) amigos.push(x.nombre);
  }
  // fix ronda 1, ítem C: `perdidas` se arma desde las listas YA clasificadas (pareja, hermanos,
  // hijos, amigos), no re-testeando el vínculo crudo: así "hermano de padre" cuenta como pérdida
  // solo si ya cuenta como hermano, sin duplicar ni perder criterio con la clasificación de arriba.
  const muertos = new Set(p.personas.filter((x) => x.vive === 'no').map((x) => x.nombre));
  a.perdidas = [...a.pareja, ...a.hermanos, ...a.hijos, ...amigos].filter((n) => muertos.has(n));
  return a;
}

/**
 * Cuenta un nombre como PALABRA completa, no como substring: "Ana" no cuenta las veces que
 * aparece dentro de "Anastasia" (fix ronda 2). `\p{L}` en vez de `\w` porque `\b` no marca bien el
 * borde con letras acentuadas ("Ñaco"). Requiere el flag `u`.
 */
function contarNombre(texto: string, nombre: string): number {
  const escapado = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![\\p{L}])${escapado}(?![\\p{L}])`, 'gu');
  return (texto.match(re) ?? []).length;
}

/** Cuántas veces aparece cada nombre en la ficha en texto; desempate por orden (guion §3, "el que más aparece"). */
function masNombrado(p: Perfil, nombres: string[]): string {
  const texto = perfilEnTexto(p);
  let mejor = nombres[0];
  let mejorCuenta = -1;
  for (const n of nombres) {
    const cuenta = contarNombre(texto, n);
    if (cuenta > mejorCuenta) { mejor = n; mejorCuenta = cuenta; }
  }
  return mejor;
}

// ── La historia grande (guion §4) ───────────────────────────────────────────
type Pais = 'AR' | 'ES';
const EVENTOS: { id: string; nombre: string; desde: number; hasta: number; pais: Pais | '*'; edadMin: number; peso: number }[] = [
  { id: 'dictadura', nombre: 'la dictadura', desde: 1976, hasta: 1983, pais: 'AR', edadMin: 8, peso: 10 },
  { id: 'malvinas', nombre: 'la guerra de Malvinas', desde: 1982, hasta: 1982, pais: 'AR', edadMin: 8, peso: 7 },
  { id: 'hiperinflacion', nombre: 'la hiperinflación', desde: 1989, hasta: 1990, pais: 'AR', edadMin: 10, peso: 6 },
  { id: 'crisis-2001', nombre: 'el 2001 (el corralito, diciembre)', desde: 2001, hasta: 2002, pais: 'AR', edadMin: 10, peso: 9 },
  { id: 'pandemia', nombre: 'la pandemia', desde: 2020, hasta: 2021, pais: '*', edadMin: 6, peso: 8 },
  { id: 'transicion', nombre: 'la muerte de Franco y la transición', desde: 1975, hasta: 1978, pais: 'ES', edadMin: 8, peso: 10 },
  { id: '23f', nombre: 'el 23-F', desde: 1981, hasta: 1981, pais: 'ES', edadMin: 10, peso: 5 },
  { id: 'barcelona-92', nombre: 'los Juegos de Barcelona y la Expo', desde: 1992, hasta: 1992, pais: 'ES', edadMin: 6, peso: 4 },
  { id: '11m', nombre: 'el 11-M', desde: 2004, hasta: 2004, pais: 'ES', edadMin: 10, peso: 6 },
  { id: 'crisis-2008', nombre: 'la crisis de 2008', desde: 2008, hasta: 2013, pais: '*', edadMin: 15, peso: 6 },
  { id: 'mundial', nombre: 'un Mundial ganado', desde: 1978, hasta: 2022, pais: 'AR', edadMin: 6, peso: 1 },
];
const EDAD_MAX_EVENTO = 60;
const MUNDIALES = [1978, 1986, 2022];

export function paisDe(lugar: string): Pais | null {
  const l = norm(lugar);
  if (/espan|barcelona|madrid|catal|berga|valencia|sevilla|andaluc|bilbao|zaragoza|malaga|galicia/.test(l)) return 'ES';
  if (/argentin|buenos aires|rosario|tucum|cordoba|mendoza|martinez|lanus|provincia|conurbano|santa fe|salta|neuquen/.test(l)) return 'AR';
  return null;
}

function tramoDeEdad(e: number): Tramo {
  for (const t of ['infancia', 'juventud', 'adulto joven', 'adultez media'] as const) if (e >= RANGO_TRAMO[t][0] && e <= RANGO_TRAMO[t][1]) return t;
  return 'segunda mitad';
}

/** En qué país vivía a tal edad, según las etapas de la ficha con lugar. null si no se sabe. */
function paisA(p: Perfil, edadActual: number, edad: number): Pais | null {
  for (const e of p.etapas) {
    const r = rangoDeEtapa(e.edades, edadActual);
    if (r && edad >= r[0] && edad <= r[1]) { const pais = paisDe(e.lugar); if (pais) return pais; }
  }
  return null;
}

export function eventosDe(p: Perfil, anioActual = new Date().getFullYear()): { id: string; nombre: string; tramo: Tramo; edad: number }[] {
  const edad = edadDe(p, anioActual);
  if (edad === null) return [];
  const nacio = anioActual - edad;
  const candidatos = EVENTOS.flatMap((ev) => {
    let anio = Math.max(ev.desde, nacio + ev.edadMin);
    if (ev.id === 'mundial') { const m = MUNDIALES.find((x) => x - nacio >= ev.edadMin && x - nacio <= EDAD_MAX_EVENTO); if (!m) return []; anio = m; }
    if (anio > ev.hasta) return [];
    const e = anio - nacio;
    if (e < ev.edadMin || e > EDAD_MAX_EVENTO) return [];
    if (ev.pais !== '*' && paisA(p, edad, e) !== ev.pais) return [];
    return [{ id: ev.id, nombre: ev.nombre, tramo: tramoDeEdad(e), edad: e, peso: ev.peso, anio }];
  });
  const grandes = candidatos.filter((c) => c.id !== 'mundial').sort((a, b) => b.peso - a.peso).slice(0, 2);
  const elegidos = grandes.length < 2 ? [...grandes, ...candidatos.filter((c) => c.id === 'mundial')].slice(0, 2) : grandes;
  return elegidos.sort((a, b) => a.anio - b.anio).map(({ id, nombre, tramo, edad: e }) => ({ id, nombre, tramo, edad: e }));
}

// ── Armar el guion de ESTA persona ──────────────────────────────────────────
const TRAMOS_ORDEN: Tramo[] = ['infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad'];
const ETAPAS_ORDEN: Etapa[] = ['inicio', ...TRAMOS_ORDEN, 'hoy', 'futuro', 'reflexion'];
const bloqueDe = (f: Fila): Bloque => (f.id === 'presentacion' ? 'presentacion' : f.etapa);

function objetivoDe(f: Fila, id = f.id, tema = f.tema, pormenores = f.pormenores): FilaObjetivo {
  return { id, tramo: f.tramo, bloque: bloqueDe(f), tema, pormenores, pideEscena: f.pideEscena, fila: f.id };
}
const conNombre = (f: Fila, nombre: string) => f.tema.replace('{NOMBRE}', nombre).replace('{NOMBRES}', nombre);

/** guion §3: "de todos" y una por el/la que más aparece en la ficha (no el primero) — fix ronda 1. */
function expandir(f: Fila, nombres: string[], p: Perfil): FilaObjetivo[] {
  if (nombres.length <= MAX_POR_VINCULO) return nombres.map((n) => objetivoDe(f, `${f.id}-${slug(n)}`, conNombre(f, n)));
  const plural = f.expandePor === 'hijos' ? 'Sus hijos' : 'Sus hermanos';
  const elegido = masNombrado(p, nombres);
  return [
    objetivoDe(f, `${f.id}s-todos`, `${plural} (${nombres.join(', ')}), todos juntos: cómo es cada uno en una frase, con quién se lleva mejor.`),
    objetivoDe(f, `${f.id}-${slug(elegido)}`, conNombre(f, elegido)),
  ];
}

/**
 * Las filas `historia-grande` solo existen en juventud, adultez media y segunda mitad (guion §3):
 * no hay una para "adulto joven". Fix ronda 1, ítem A: el mapeo es el de §5 (la dictadura de
 * Élida, a los 26/adulto joven, va en Juventud), no "la próxima etapa que tenga fila" (eso mandaba
 * a alguien de 30 años a perder la pandemia entera, porque adulto joven quedaba sin destino hacia
 * adelante y el evento cae en el vacío). infancia y adulto joven van a juventud; adultez media y
 * segunda mitad quedan en su propia fila.
 */
function etapaHistoriaDe(t: Tramo): Etapa {
  switch (t) {
    case 'infancia':
    case 'juventud':
    case 'adulto joven':
      return 'juventud';
    case 'adultez media':
      return 'adultez media';
    default:
      return 'segunda mitad';
  }
}

type Resuelto = { entra: FilaObjetivo[] } | { cae: string };

// Fix ronda 2, ítem D.3: "sigue trabajando" tiene que chequearse ANTES que la edad y que "se
// jubiló", porque "no se jubiló" contiene la palabra "jubil" y el regex de jubilación la
// agarraba igual (alguien de 70 "sigue trabajando" quedaba con la fila normal, no la variante).
// `seJubilo` además no cuenta si la frase está negada cerca ("no se jubiló", "no dejó de
// trabajar"), como red aparte del orden.
const RE_SIGUE_TRABAJANDO = /sigue trabajando|no se jubil|no piensa dejar|no dejó de trabajar/i;
const RE_JUBILO = /jubil|dej[oó] de trabajar/i;
const RE_JUBILO_NEGADO = /\bno\b[^.]{0,15}?(jubil|dej[oó] de trabajar)/i;
const seJubilo = (texto: string) => RE_JUBILO.test(texto) && !RE_JUBILO_NEGADO.test(texto);
const textoDe = (p: Perfil) => [...p.etapas.map((e) => e.queHacia), ...p.bisagras].join(' \n ');

/** Qué pasa con una fila para esta persona: entra (con qué objetivos), se cae (por qué), o se vuelve puerta/variante. */
function resolver(f: Fila, arbol: Arbol, edad: number | null, eventos: ReturnType<typeof eventosDe>, p: Perfil): Resuelto {
  const resolverNoTuvo = (vinculo: string): Resuelto => {
    const s = f.siNoTuvo;
    return s?.modo === 'variante' ? { entra: [objetivoDe(f, s.id, s.tema, s.pormenores ?? f.pormenores)] } : { cae: `dijo que no tuvo ${vinculo}` };
  };
  const resolverNoSabe = (vinculo: string): Resuelto => {
    const s = f.siNoSeSabe;
    if (s?.modo === 'puerta') return { entra: [objetivoDe(f, s.id, s.tema)] };
    if (s?.modo === 'variante') return { entra: [objetivoDe(f, s.id, s.tema, s.pormenores ?? f.pormenores)] };
    return { cae: `no se sabe si tiene ${vinculo}` };
  };
  const porArbol = (vinculo: 'hermanos' | 'hijos' | 'pareja', nombres: string[], entra: () => FilaObjetivo[]): Resuelto =>
    nombres.length ? { entra: entra() } : arbol.noTuvo.includes(vinculo) ? resolverNoTuvo(vinculo) : resolverNoSabe(vinculo);
  const c = f.aplica;
  if (c === 'siempre') return { entra: [objetivoDe(f)] };
  if ('edadMin' in c) {
    // guion §3, fila 27: "sigue trabajando" manda primero (antes de la edad y de "se jubiló"): a
    // los 70 con "sigue trabajando en el taller" le toca la variante, no la fila normal (fix ronda 2).
    if (f.id === 'dejar-el-trabajo') {
      const texto = textoDe(p);
      if (RE_SIGUE_TRABAJANDO.test(texto)) return { entra: [objetivoDe(f, 'dejar-el-trabajo-sigue', 'Por qué sigue trabajando y hasta cuándo.', ['por qué sigue', 'hasta cuándo'])] };
      if (edad !== null && edad >= c.edadMin) return { entra: [objetivoDe(f)] };
      if (seJubilo(texto)) return { entra: [objetivoDe(f)] };
      return { cae: `tiene menos de ${c.edadMin}` };
    }
    return edad !== null && edad >= c.edadMin ? { entra: [objetivoDe(f)] } : { cae: `tiene menos de ${c.edadMin}` };
  }
  if ('evento' in c) {
    const ev = eventos.filter((e) => etapaHistoriaDe(e.tramo) === f.etapa);
    return ev.length ? { entra: ev.map((e) => objetivoDe(f, `historia-grande-${e.id}`, f.tema.replace('{EVENTO}', `${e.nombre}, cuando tenía ${e.edad} años`))) } : { cae: 'no le tocó nada grande en esa etapa' };
  }
  switch (c.arbol) {
    case 'hermanos': return porArbol('hermanos', arbol.hermanos, () => expandir(f, arbol.hermanos, p));
    case 'hijos': return porArbol('hijos', arbol.hijos, () => (f.expandePor ? expandir(f, arbol.hijos, p) : [objetivoDe(f)]));
    case 'pareja': return porArbol('pareja', arbol.pareja, () => [objetivoDe(f, f.id, conNombre(f, arbol.pareja.join(' y ')))]);
    case 'nietos': return arbol.nietos.length ? { entra: [objetivoDe(f, f.id, conNombre(f, arbol.nietos.join(', ')))] } : { cae: arbol.noTuvo.includes('nietos') ? 'dijo que no tuvo nietos' : 'la ficha no tiene nietos' };
    case 'padresGrandes': return (edad !== null && edad >= 45) || arbol.padres.some((x) => x.vive === 'no') ? { entra: [objetivoDe(f)] } : { cae: 'tiene menos de 45 y sus padres no figuran muertos' };
    case 'perdidas': return arbol.perdidas.length ? { entra: [objetivoDe(f, f.id, conNombre(f, arbol.perdidas.join(', ')))] } : { cae: 'la ficha no tiene pérdidas' };
  }
}

/** Recorta al techo sacando, en este orden: el segundo evento, las terceras expansiones, amigos-de-siempre. Nunca inamovibles. */
export function recortarAlTope(filas: FilaObjetivo[], max: number, caidas: Caida[]): FilaObjetivo[] {
  const r = [...filas];
  const cuenta = () => r.filter((f) => f.id !== 'presentacion').length;
  const sacar = (pred: (f: FilaObjetivo) => boolean): boolean => {
    const i = r.map((f, idx) => ({ f, idx })).filter(({ f }) => pred(f)).at(-1)?.idx;
    if (i === undefined) return false;
    caidas.push({ id: r[i].id, motivo: `no entra en el techo de ${max}` });
    r.splice(i, 1);
    return true;
  };
  const pasos: ((f: FilaObjetivo) => boolean)[] = [
    (f) => f.fila === 'historia-grande' && r.filter((x) => x.fila === 'historia-grande').length > 1,
    (f) => (f.fila === 'hijo' || f.fila === 'hermano') && r.filter((x) => x.fila === f.fila).length > 2,
    (f) => f.id === 'amigos-de-siempre',
  ];
  for (const paso of pasos) while (cuenta() > max && sacar(paso));
  return r;
}

export function armarGuion(p: Perfil, anioActual = new Date().getFullYear()): { filas: FilaObjetivo[]; caidas: Caida[] } {
  const edad = edadDe(p, anioActual);
  const arbol = arbolDe(p);
  const eventos = eventosDe(p, anioActual);
  // Sin edad todavía (día 0 y 1): se arma con infancia, juventud y adulto joven; se rearma cuando la edad llega.
  const vividos = new Set<Etapa>(['inicio', 'hoy', 'futuro', 'reflexion', ...TRAMOS_ORDEN.filter((t) => (edad === null ? RANGO_TRAMO[t][0] <= 23 : RANGO_TRAMO[t][0] <= edad))]);
  const caidas: Caida[] = [];
  const filas: FilaObjetivo[] = [];
  // fix ronda 2, ítem D.3: `pareja-como-llego` y `los-hijos-creciendo` comparten la misma variante
  // ("quienes-fueron-tu-familia") cuando dijo que no tuvo pareja o hijos; si las dos se disparan
  // para la misma persona, entra una sola vez (la que aparece primero en el guion) y la segunda cae.
  let familiaEmitida = false;
  for (const f of GUION) {
    if (!vividos.has(f.etapa)) {
      if (f.id === 'por-gusto') { filas.push({ ...objetivoDe(f), bloque: 'adulto joven' }); continue; }
      caidas.push({ id: f.id, motivo: `no vivió ${f.etapa}` });
      continue;
    }
    const r = resolver(f, arbol, edad, eventos, p);
    if ('cae' in r) { caidas.push({ id: f.id, motivo: r.cae }); continue; }
    for (const obj of r.entra) {
      if (obj.id === 'quienes-fueron-tu-familia') {
        if (familiaEmitida) { caidas.push({ id: f.id, motivo: 'ya entra quienes-fueron-tu-familia' }); continue; }
        familiaEmitida = true;
      }
      filas.push(obj);
    }
  }
  const orden = (f: FilaObjetivo) => ETAPAS_ORDEN.indexOf(f.bloque === 'presentacion' ? 'inicio' : (f.bloque as Etapa));
  const ordenadas = filas.map((f, i) => ({ f, i })).sort((a, b) => orden(a.f) - orden(b.f) || a.i - b.i).map((x) => x.f);
  return { filas: recortarAlTope(ordenadas, tope(edad), caidas), caidas };
}

/** Lo que decide el guion: edad, árbol, noTuvo, eventos. Si esto no cambia, el guion no se rearma. */
export function firmaGuion(p: Perfil, anioActual = new Date().getFullYear()): string {
  return JSON.stringify({ edad: edadDe(p, anioActual), a: arbolDe(p), ev: eventosDe(p, anioActual).map((e) => e.id) });
}
