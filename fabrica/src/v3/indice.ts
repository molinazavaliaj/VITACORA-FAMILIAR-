// El índice del libro V3, calculado por código antes de llamar al modelo:
// AGRUPACIONES FIJAS POR TAMAÑO (Fable, "Agrupaciones fijas de capítulos",
// aprobado por Naza el 26/09). Reemplaza a la fusión en cadena de los diez
// capítulos madre, que en la simulación colapsaba.
//
// Cada tamaño tiene su lista de capítulos con título fijo, los temas (los
// diez capítulos madre de antes, que ahora son la unidad de ubicación) que
// entran en cada uno, un piso en palabras ESCRITAS y un receptor fijo si no
// llega al piso. Pasos, todos deterministas y en este orden:
//
//   1. Ubicar cada respuesta en un tema: ancla por bloque; flotantes (12, 13)
//      por edad dicha, léxico, persona o defecto (13-altos → Hoy); crisis
//      (bloque 11) de antes de los 25 → su etapa; el resto del bloque 11 con
//      un receptor por pregunta (PE1 → origen, CR1 → Trabajo…). En Breve y
//      Estándar "Lo que costó" no existe y el receptor es la ubicación.
//   2. Gates de la ficha: sin pareja ni hijos, "Amor y la familia que armé"
//      no existe (Completo: sin pareja, "Amor" no existe); títulos variantes.
//   3. Modo migrante joven: si migró hace 10 años o menos, el último capítulo
//      es "El viaje, hasta hoy" y absorbe a Hoy (sin coda).
//      Solo recibe lo que es de "después" (señal de texto, edad, oficio o
//      herencia de la pregunta madre en las "b") o va por regla (migración
//      del bloque 5, bloque 14, pareja actual); lo demás, a su etapa o a
//      "Hacerse grande", también cuando un capítulo previo cae bajo el piso.
//   4. Pisos y receptores: una sola pasada, de arriba hacia abajo. El que no
//      llega va entero a su receptor fijo; el que recibió ya no se mueve. Si
//      el receptor ya no está, el capítulo queda corto (avisado): sin cadenas,
//      máximo un salto por respuesta. Hoy bajo el piso es la coda.
//   5. Solo en Completo, particiones por clave fija de la tabla.
//
// NO se prometen páginas: el tamaño solo define cuántas preguntas. Los pisos
// son de palabras escritas = habladas × FACTOR_ESCRITO.
//
// El índice NO decide personas, subtítulos ni orden interno fino: eso viene
// después (subtitulo: null). Ningún título lo inventa el modelo: todos están
// en las tablas de acá y en docs/v3/titulos-capitulos.md.

import { preguntaPorId } from './banco.js';
import { edadActual, edadMigracion, anioMigracion, estado, lista, valor, type FichaV3 } from './ficha.js';
import {
  edadDicha, etapaPorLexico, madrePorEdad, mencionaActividad, nombraLugar, normalizar, ocurrencias, personaDePresentacion, personaNombrada, posicionActividad,
} from './etapa.js';

// ---------------------------------------------------------------- tipos

export type Tamanio = 'B' | 'E' | 'C';

export type RespuestaV3 = {
  id: string;
  preguntaId: string;
  bloque: number;
  sujeto?: string; // 'pareja:1', 'hijo:2', 'oficio:1'
  palabras: number; // habladas
  texto: string;
  paso?: boolean;
};

export type Motivo = 'edad-numero' | 'lexico' | 'persona' | 'defecto' | 'oficio' | 'receptor';

/** Dónde se ubicó una respuesta que no va por el ancla de su bloque (flotantes, crisis, pasiones que son oficio). */
export type Ubicacion = {
  respuestaId: string;
  preguntaId: string;
  tema: number;
  /** Bloque 11: el tema al que va si "Lo que costó" no existe o no llega al piso. */
  receptor?: number;
  motivo: Motivo;
  edad?: number;
  expresion?: string;
  sensible?: boolean;
};

export type Capitulo = {
  clave: string; // 'E3', 'C10', 'VIAJE'
  claves: string[]; // la propia y las de los capítulos que recibió por piso
  titulo: string;
  parte?: { clave: string; nombre: string };
  /** Existe bajo su piso: Amor corto (≥ 250) o un receptor que ya no está. */
  corto?: true;
  /** Hoy bajo el piso: dos páginas sin número antes de la carta. */
  coda?: true;
  subtitulo: null;
  respuestaIds: string[];
  sensibles: string[];
  palabrasHabladas: number;
  palabrasEscritasObjetivo: number;
};

export type Salto = { respuestaId: string; de: string; a: string };

export type Momento = 'antes' | 'despues' | 'sin-senal' | 'regla';

/** Cómo clasificó el modo migrante joven cada respuesta que mira (para vigilar a mano). */
export type Clasificacion = {
  respuestaId: string;
  preguntaId: string;
  bloque: number;
  momento: Momento;
  senal: string;
  /** Edad dicha en el texto (o la de la pandemia en HG4), si la hay. */
  edad?: number;
  capitulo: string; // clave del capítulo donde quedó
};

export type MigranteJoven = {
  edadMigracion: number;
  edadActual: number;
  lugaresDestino: string[];
  clasificacion: Clasificacion[];
};

export type Indice = {
  tamanio: Tamanio;
  capitulos: Capitulo[];
  coda: Capitulo | null;
  cierre: string[]; // legado (bloque 15): carta final, fuera del índice
  flotantes: Ubicacion[];
  saltos: Salto[];
  migranteJoven: MigranteJoven | null;
  avisos: string[];
};

export type OpcionesIndice = { tamanio?: Tamanio; anioActual?: number };

// ---------------------------------------------------------------- constantes

/**
 * Palabras escritas por palabra hablada. El cociente real medido con el
 * escritor sobre el material de Naza (9.489 habladas) es 0,70; Fable había
 * supuesto 0,6.
 */
export const FACTOR_ESCRITO = 0.7;
export const escritas = (habladas: number): number => Math.round(FACTOR_ESCRITO * habladas);

/** Amor bajo su piso (500) existe corto si llega a esto; si no, va a Mi gente. */
export const PISO_AMOR_CORTO = 250;
/** Solo Completo: un capítulo con más escritas que esto se parte… */
export const TOPE_PARTICION = 3000;
/** …y en tres (si su clave da tres partes) con más que esto. */
export const TOPE_SEGUNDA_PARTICION = 6000;
/** Una pasión que suma esto (escritas) parte "Mi gente y mis lugares" en "Mi pasión: X". */
export const PASION_GRANDE = 1200;
/** "El viaje" (título) si migró con esta edad o menos. Por ficha, no por porcentaje. */
export const EDAD_VIAJE = 30;
/** Modo migrante joven: si migró hace esta cantidad de años o menos. */
export const ANIOS_MIGRANTE_JOVEN = 10;
export const ANIO_PANDEMIA = 2020; // HG4 sin fecha dicha: el año se sabe

/** Temas: los diez capítulos madre de antes, más el viaje del migrante joven. */
export const TEMAS: Record<number, string> = {
  1: 'Origen', 2: 'Primeros años', 3: 'Adolescencia', 4: 'Salir al mundo', 5: 'Amor', 6: 'Trabajo',
  7: 'Hijos y nietos', 8: 'Mi gente y mis lugares', 9: 'Lo que costó', 10: 'Hoy', 11: 'El viaje, hasta hoy',
};
const TEMA_VIAJE = 11;

// ---------------------------------------------------------------- tablas fijas

export type Agrupacion = {
  clave: string;
  titulo: string;
  temas: number[];
  /** Palabras escritas para existir; null = siempre existe. */
  piso: number | null;
  /**
   * A dónde va si no llega al piso: la clave de otro capítulo, 'coda' (Hoy),
   * 'reparto' (Lo que costó: cada respuesta a su receptor por pregunta) o
   * 'amor' (corto desde 250; si no, a Mi gente).
   */
  receptor: string | 'coda' | 'reparto' | 'amor' | null;
};

/** Sección 2 de Fable. El orden de cada lista es el orden del libro y el de la pasada de pisos. */
export const AGRUPACIONES: Record<Tamanio, Agrupacion[]> = {
  B: [
    { clave: 'B1', titulo: 'Crecer', temas: [1, 2, 3], piso: null, receptor: null },
    { clave: 'B2', titulo: 'Salir al mundo y el trabajo', temas: [4, 6], piso: 500, receptor: 'B1' },
    { clave: 'B3', titulo: 'Los míos', temas: [5, 7, 8], piso: 500, receptor: 'B4' },
    { clave: 'B4', titulo: 'Hoy', temas: [10], piso: 400, receptor: 'coda' },
  ],
  E: [
    { clave: 'E1', titulo: 'De dónde vengo y los primeros años', temas: [1, 2], piso: null, receptor: null },
    { clave: 'E2', titulo: 'Hacerse grande', temas: [3, 4], piso: 700, receptor: 'E1' },
    { clave: 'E3', titulo: 'Amor y la familia que armé', temas: [5, 7], piso: 500, receptor: 'amor' },
    { clave: 'E4', titulo: 'Trabajo y oficio', temas: [6], piso: 700, receptor: 'E2' },
    { clave: 'E5', titulo: 'Mi gente y mis lugares', temas: [8], piso: 700, receptor: 'E6' },
    { clave: 'E6', titulo: 'Hoy', temas: [10], piso: 600, receptor: 'coda' },
  ],
  C: [
    { clave: 'C1', titulo: 'De dónde vengo', temas: [1], piso: 600, receptor: 'C2' },
    { clave: 'C2', titulo: 'Los primeros años', temas: [2], piso: null, receptor: null },
    { clave: 'C3', titulo: 'Adolescencia', temas: [3], piso: 900, receptor: 'C2' },
    { clave: 'C4', titulo: 'Salir al mundo', temas: [4], piso: 900, receptor: 'C3' },
    { clave: 'C5', titulo: 'Amor', temas: [5], piso: 500, receptor: 'amor' },
    { clave: 'C6', titulo: 'Trabajo y oficio', temas: [6], piso: 900, receptor: 'C4' },
    { clave: 'C7', titulo: 'Hijos y nietos', temas: [7], piso: 700, receptor: 'C5' },
    { clave: 'C8', titulo: 'Mi gente y mis lugares', temas: [8], piso: 900, receptor: 'C10' },
    { clave: 'C9', titulo: 'Lo que costó', temas: [9], piso: 900, receptor: 'reparto' },
    { clave: 'C10', titulo: 'Hoy', temas: [10], piso: 600, receptor: 'coda' },
  ],
};

export const TITULO_VIAJE_HASTA_HOY = 'El viaje, hasta hoy';
const FILA_VIAJE: Agrupacion = { clave: 'VIAJE', titulo: TITULO_VIAJE_HASTA_HOY, temas: [TEMA_VIAJE], piso: null, receptor: null };

/** Títulos que cambian por la ficha (gates). */
export const TITULOS_GATE = {
  hacerseGrandeYElViaje: 'Hacerse grande y el viaje', // E2, migró con ≤ 30 y no es migrante joven
  amor: 'Amor', // E3 sin hijos
  laFamiliaQueArme: 'La familia que armé', // E3 sin pareja, con hijos
  elViaje: 'El viaje', // C4, migró con ≤ 30 y no es migrante joven
} as const;

/**
 * Título del receptor cuando recibe a otro capítulo por piso, escrito de
 * antemano: `receptor ← el que llega`. Una combinación que no está acá deja
 * el título del receptor y un aviso "sin tabla" (el test de invariantes lo
 * rechaza). "El viaje, hasta hoy" no cambia al recibir.
 */
export const AL_RECIBIR: Record<string, string> = {
  // Estándar
  'De dónde vengo y los primeros años ← Hacerse grande': 'Crecer',
  'De dónde vengo y los primeros años ← Hacerse grande y el viaje': 'Crecer y el viaje',
  'Hacerse grande ← Trabajo y oficio': 'Hacerse grande y el trabajo',
  'Hacerse grande y el viaje ← Trabajo y oficio': 'Hacerse grande, el viaje y el trabajo',
  'Mi gente y mis lugares ← Amor y la familia que armé': 'Mi gente y mis lugares',
  'Mi gente y mis lugares ← Amor': 'Mi gente y mis lugares',
  'Mi gente y mis lugares ← La familia que armé': 'Mi gente y mis lugares',
  'Hoy ← Mi gente y mis lugares': 'Mi gente, hoy',
  // Completo
  'Los primeros años ← De dónde vengo': 'De dónde vengo y los primeros años',
  'Los primeros años ← Adolescencia': 'Crecer',
  'De dónde vengo y los primeros años ← Adolescencia': 'Crecer',
  'Adolescencia ← Salir al mundo': 'Adolescencia y salir al mundo',
  'Adolescencia ← El viaje': 'Adolescencia y el viaje',
  'Salir al mundo ← Trabajo y oficio': 'Salir al mundo y el trabajo',
  'El viaje ← Trabajo y oficio': 'El viaje y el trabajo',
  'Amor ← Hijos y nietos': 'Amor y la familia que armé',
  // Breve
  'Crecer ← Salir al mundo y el trabajo': 'Crecer y salir al mundo',
  'Hoy ← Los míos': 'Los míos, hoy',
};

/** Nombres fijos de las partes (solo Completo). Además: nombre de cada pareja u oficio, "Mi pasión: X" y "Hoy, en {{lugar_destino}}". */
export const NOMBRES_DE_PARTE = [
  'La casa', 'La escuela', 'Irse de casa', 'Los estudios', 'Lo militar', 'El viaje', 'Otras personas', 'El campo', 'Después',
  'Cuando eran chicos', 'Cuando crecieron, y los nietos', 'Mis lugares y pasiones', 'Mi gente', 'Mi gente y mis lugares',
];

export const TITULOS_POSIBLES: ReadonlySet<string> = new Set([
  ...Object.values(AGRUPACIONES).flatMap((filas) => filas.map((f) => f.titulo)),
  TITULO_VIAJE_HASTA_HOY,
  ...Object.values(TITULOS_GATE),
  ...Object.values(AL_RECIBIR),
]);

/** ¿El título de capítulo está en las tablas fijas? */
export function esTituloPosible(titulo: string): boolean {
  return TITULOS_POSIBLES.has(titulo);
}

const ANCLA: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 8, 11: 9, 14: 10 };
const MIGRACION = new Set(['JU8', 'JU9', 'JU10', 'JU10b', 'JU11', 'MI1', 'MI1.2']);
const ESTUDIOS = new Set(['JU2', 'JU2b', 'JU3', 'JU3b']);
const MILITAR = new Set(['JU5', 'JU6']);
const CAMPO = new Set(['CP1', 'CP2', 'CP3']);
const HIJOS_CHICOS = new Set(['HI1', 'HI2', 'HI3', 'HI3b', 'HI4', 'HI5', 'HI6']);
const HIJOS_FALLECIDOS = new Set(['HF1', 'HF2']);
const PASIONES = new Set(['PA1', 'PA2']);
/** Preguntas de pareja que siguen a una pareja (sujeto pareja:k). */
const DE_PAREJA = new Set(['AM1', 'AM2', 'AM3', 'AM4', 'AM5', 'AM6', 'AM7', 'AM8', 'CS3']);
/** Bloque 13 "bajos": por defecto a Lo que costó (Completo) o a Hoy. GI1, HJ1 y HJ2 son altos: a Hoy. */
const BAJOS_13 = new Set(['GI3', 'GI5', 'HJ9']);
/** HJ5 (volver al lugar donde creció) va por defecto a Mi gente y mis lugares. */
const LUGARES_13 = new Set(['HJ5']);
/**
 * Modo migrante joven: bloques cuyas respuestas van al viaje solo con señal
 * de "después" en el texto. Fable nombra 7 (trabajo) y 10 (amigos); acá se
 * suman 9 (lugares: Fable pone el bloque 9 en el viaje en la sección 3 y en
 * Mi gente en su índice de Naza de la sección 5) y los flotantes 12 y 13
 * (una respuesta fechada después de migrar no puede quedar en "Hacerse
 * grande"). Ver el reporte de la simulación.
 */
const BLOQUES_CON_SENAL = new Set([7, 9, 10, 12, 13]);

// ---------------------------------------------------------------- utilidades

type Item = { r: RespuestaV3; tema: number; receptor?: number; orden: number; indice: number; sensible: boolean };
type Grupo = {
  fila: Agrupacion;
  titulo: string;
  items: Item[];
  claves: string[];
  recibio: boolean; // recibió a otro capítulo entero: ya no se mueve
  destino: string | null; // se fue entero a este receptor
  repartido: boolean; // Lo que costó repartido por pregunta
  corto: boolean;
  coda: boolean;
};
type Parte = { clave: string; nombre: string; items: Item[] };

const palabras = (items: Item[]) => items.reduce((s, x) => s + x.r.palabras, 0);
const escritasDe = (items: Item[]) => escritas(palabras(items));
const miles = (n: number) => n.toLocaleString('es-AR');
const numeroDe = (sujeto: string | undefined, tipo: string): number | null => {
  const m = sujeto ? new RegExp(`^${tipo}:(\\d+)$`).exec(sujeto) : null;
  return m ? Number(m[1]) : null;
};
const unicos = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x && x.trim() !== ''))];

// ---------------------------------------------------------------- 1. ubicar cada respuesta

type Ubicado = { tema: number | 'cierre' | null; receptor?: number; ubicacion?: Omit<Ubicacion, 'respuestaId' | 'preguntaId'> };

function ubicar(r: RespuestaV3, ficha: FichaV3, anioActual: number, avisos: string[]): Ubicado {
  const p = preguntaPorId(r.preguntaId);
  if (!p) avisos.push(`${r.id}: la pregunta ${r.preguntaId} no está en el banco; se ancla por su bloque (${r.bloque}).`);
  const bloque = r.bloque;
  const clase = p?.clase ?? 'historia';

  if (bloque === 15) return { tema: 'cierre' };
  if (HIJOS_FALLECIDOS.has(r.preguntaId)) return { tema: 7 };
  if (bloque === 11) return ubicarCrisis(r, ficha, anioActual);

  // Oficio o pasión: la actividad que es oficio va a Trabajo.
  if (PASIONES.has(r.preguntaId)) {
    const oficios = [
      ...(ficha.actividades ?? []).filter((a) => a.marca === 'oficio').map((a) => a.nombre),
      ...lista(ficha.oficios).map((o) => o.nombre),
    ];
    const pasiones = (ficha.actividades ?? []).filter((a) => a.marca === 'pasion').map((a) => a.nombre);
    const primera = primeraMencion(r.texto, [...oficios.map((n) => ({ n, oficio: true })), ...pasiones.map((n) => ({ n, oficio: false }))]);
    if (primera?.oficio) return { tema: 6, ubicacion: { tema: 6, motivo: 'oficio', expresion: primera.n } };
  }

  if (clase === 'puerta' || clase === 'valvula') {
    const tema = bloque === 8 && estado(ficha.hijos) !== 'lleno' ? 8 : ANCLA[bloque];
    return { tema: tema ?? null, ubicacion: tema ? { tema, motivo: 'defecto' } : undefined };
  }

  if (bloque === 12 || bloque === 13) {
    const u = ubicarFlotante(r, ficha, anioActual);
    return { tema: u.tema, receptor: u.receptor, ubicacion: u };
  }

  if (r.preguntaId === 'HI10') return { tema: 8 };
  const tema = ANCLA[bloque];
  if (tema === 7 && estado(ficha.hijos) !== 'lleno' && !r.preguntaId.startsWith('HI') && !r.preguntaId.startsWith('NC')) return { tema: 8 };
  if (!tema) {
    avisos.push(`${r.id}: bloque ${bloque} desconocido; la respuesta queda fuera del índice.`);
    return { tema: null };
  }
  return { tema };
}

/**
 * Bloque 11 (puerta y válvula incluidas). De antes de los 25, a su etapa
 * (edad dicha o léxico de etapa). Si no, al tema 9 (Lo que costó) con su
 * receptor por pregunta, que es donde va cuando Lo que costó no existe.
 */
function ubicarCrisis(r: RespuestaV3, ficha: FichaV3, anioActual: number): Ubicado {
  const edad = edadDicha(r.texto, ficha, anioActual);
  const porEdad = edad ? madrePorEdad(edad.edad) : null;
  if (edad && porEdad) return { tema: porEdad, ubicacion: { tema: porEdad, motivo: 'edad-numero', edad: edad.edad, expresion: edad.expresion, sensible: true } };
  const lex = etapaPorLexico(r.texto, ficha);
  if (!edad && lex && lex.madre <= 4) return { tema: lex.madre, ubicacion: { tema: lex.madre, motivo: 'lexico', expresion: lex.expresion, sensible: true } };
  const rec = receptorCrisis(r, ficha, lex);
  return {
    tema: 9,
    receptor: rec.tema,
    ubicacion: { tema: 9, receptor: rec.tema, motivo: 'receptor', ...(edad ? { edad: edad.edad } : {}), ...(rec.expresion ? { expresion: rec.expresion } : {}), sensible: true },
  };
}

/** Tabla de receptores del bloque 11 (Fable, sección 2). */
function receptorCrisis(r: RespuestaV3, ficha: FichaV3, lex: { madre: number; expresion: string } | null): { tema: number; expresion?: string } {
  switch (r.preguntaId) {
    case 'PE1':
    case 'PE2':
      return { tema: 2 }; // donde se presentó a la madre o al padre, como cierre de su presencia
    case 'PE3': {
      const p = personaDePresentacion(r.texto, ficha);
      return p ?? { tema: 8 };
    }
    case 'HJ7': {
      const p = personaDePresentacion(r.texto, ficha);
      return p ?? { tema: 6 };
    }
    case 'PE5':
    case 'EC1':
      return { tema: 10 };
    case 'PE6':
    case 'PE8':
      return { tema: 8 };
    case 'CR1':
      return { tema: 6 };
    default:
      // PE4, ID1, la puerta y la válvula: por léxico de adulto; si no, Hoy.
      return lex && lex.madre >= 5 ? { tema: lex.madre, expresion: lex.expresion } : { tema: 10 };
  }
}

function primeraMencion<T extends { n: string }>(texto: string, candidatos: T[]): T | null {
  let mejor: { pos: number; c: T } | null = null;
  for (const c of candidatos) {
    const pos = posicionActividad(texto, c.n);
    if (pos < 0) continue;
    if (!mejor || pos < mejor.pos) mejor = { pos, c };
  }
  return mejor?.c ?? null;
}

/** Flotantes (bloques 12 y 13): edad dicha → léxico → persona → defecto. */
function ubicarFlotante(r: RespuestaV3, ficha: FichaV3, anioActual: number): Omit<Ubicacion, 'respuestaId' | 'preguntaId'> {
  const edad = edadDeFlotante(r, ficha, anioActual);
  if (edad && edad.edad >= 0) {
    const etapa = madrePorEdad(edad.edad);
    if (etapa) return { tema: etapa, motivo: 'edad-numero', edad: edad.edad, expresion: edad.expresion };
  }
  const conEdad = edad ? { edad: edad.edad } : {};
  const lex = etapaPorLexico(r.texto, ficha);
  if (lex && !(edad && lex.madre <= 4)) return { tema: lex.madre, motivo: 'lexico', expresion: lex.expresion, ...conEdad };
  const persona = personaNombrada(r.texto, ficha);
  if (persona) return { tema: persona, motivo: 'persona', ...conEdad };
  // Por defecto: bloque 12 y 13-bajos a Lo que costó (con Hoy de receptor); HJ5 a Mi gente; 13-altos a Hoy.
  if (r.bloque === 12 || BAJOS_13.has(r.preguntaId)) return { tema: 9, receptor: 10, motivo: 'defecto', ...conEdad };
  return { tema: LUGARES_13.has(r.preguntaId) ? 8 : 10, motivo: 'defecto', ...conEdad };
}

function edadDeFlotante(r: RespuestaV3, ficha: FichaV3, anioActual: number): { edad: number; expresion: string } | null {
  const dicha = edadDicha(r.texto, ficha, anioActual);
  if (dicha) return dicha;
  return r.preguntaId === 'HG4' ? { edad: ANIO_PANDEMIA - ficha.anioNacimiento, expresion: `pandemia (${ANIO_PANDEMIA})` } : null;
}

// ---------------------------------------------------------------- 3. modo migrante joven

type Migracion = {
  edadMigracion: number;
  anioMigracion: number;
  edadActual: number;
  /** Lugares del destino que se buscan en el texto: `a`, los `lugares` extra de la ficha y el país si es otro. */
  destino: string[];
  origen: string[];
  lugar: string;
  /** Pareja actual y personas de la ficha marcadas como del destino (nombre y alias). */
  personasDestino: string[];
  /** Expresiones de presente en el destino ("acá en el pueblo"): solo si vive en el destino. */
  expresiones: string[];
};

/**
 * Expresiones de presente en el destino. Cuentan solo si la ficha dice que
 * vive en el destino (país de residencia distinto del de nacimiento): quien
 * volvió también dice "acá en el pueblo", y es el de origen. Se suma "acá en
 * {{país de residencia}}".
 */
export const PRESENTE_EN_DESTINO = ['acá en el pueblo'];

/** Migró y (edad actual − edad al migrar) ≤ 10. Null si no, o si la ficha no trae el año ni la edad. */
function detectarMigranteJoven(ficha: FichaV3, anioActual: number): Migracion | null {
  const m = valor(ficha.migracion);
  const edadMig = edadMigracion(ficha);
  const anioMig = anioMigracion(ficha);
  if (!m || edadMig === null || anioMig === null) return null;
  const edad = edadActual(ficha, anioActual);
  if (edad - edadMig > ANIOS_MIGRANTE_JOVEN) return null;
  const otroPais = ficha.paisResidencia !== ficha.paisNacimiento;
  const destino = unicos([m.a, ...(m.lugares ?? []), otroPais ? ficha.paisResidencia : null]);
  const esDestino = (lugar: string | undefined) => !!lugar && destino.some((d) => normalizar(d) === normalizar(lugar));
  return {
    edadMigracion: edadMig,
    anioMigracion: anioMig,
    edadActual: edad,
    destino,
    origen: unicos([m.de, otroPais ? ficha.paisNacimiento : null]),
    lugar: m.a,
    personasDestino: unicos([
      ...lista(ficha.parejas).filter((p) => p.actual).map((p) => p.nombre),
      ...(ficha.personas ?? []).filter((p) => p.despuesDeMigrar === true || esDestino(p.lugar)).flatMap((p) => [p.nombre, ...(p.alias ?? [])]),
    ]),
    expresiones: otroPais ? [...PRESENTE_EN_DESTINO, `acá en ${ficha.paisResidencia}`] : [],
  };
}

function esParejaActual(x: Item, ficha: FichaV3): boolean {
  if (x.r.preguntaId === 'AM13') return true;
  const parejas = lista(ficha.parejas);
  const k = numeroDe(x.r.sujeto, 'pareja');
  if (k !== null) return parejas[k - 1]?.actual === true;
  return DE_PAREJA.has(x.r.preguntaId) && parejas.length === 1 && parejas[0].actual;
}

function oficioDe(x: Item, ficha: FichaV3): { nombre: string; desde?: number } | null {
  const oficios = lista(ficha.oficios);
  const k = numeroDe(x.r.sujeto, 'oficio');
  if (k !== null && oficios[k - 1]) return oficios[k - 1];
  return oficios.find((o) => mencionaActividad(x.r.texto, o.nombre)) ?? null;
}

type Senal = { momento: Exclude<Momento, 'regla'>; senal: string; edad?: number };

/**
 * Las señales de "después" que tiene el texto: lugares del destino, personas
 * del destino (con su mayúscula) y expresiones de presente en el destino.
 * Una expresión que contiene un lugar ("acá en España") cuenta una sola vez.
 */
function marcasDeDespues(texto: string, mig: Migracion): { pos: number; senal: string }[] {
  const todas = [
    ...ocurrencias(texto, mig.destino, false).map((o) => ({ ...o, senal: `nombra "${o.que}"` })),
    ...ocurrencias(texto, mig.personasDestino, true).map((o) => ({ ...o, senal: `nombra a "${o.que}"` })),
    ...ocurrencias(texto, mig.expresiones, false).map((o) => ({ ...o, senal: `dice "${o.que}"` })),
  ].sort((a, b) => a.pos - b.pos || b.fin - a.fin);
  const salida: typeof todas = [];
  for (const m of todas) if (!salida.length || m.pos >= salida[salida.length - 1].fin) salida.push(m);
  return salida;
}

/**
 * ¿La respuesta es de antes o de después de emigrar? Regla de texto, no de
 * interpretación, en este orden:
 *
 *   1. Una edad dicha menor a la de migración: antes (gana aunque nombre el destino).
 *   2. Señales de texto (lugar, persona o expresión del destino): cuentan si
 *      la primera está en la primera mitad del texto o si hay dos o más. Una
 *      sola, al final, es una mención de pasada: no alcanza.
 *   3. Una edad dicha ≥ la de migración, o un oficio de la ficha que empezó
 *      después: después.
 *   4. Un oficio de antes o un lugar de origen: antes. Si no, sin señal.
 */
function senalMigracion(x: Item, ficha: FichaV3, anioActual: number, mig: Migracion): Senal {
  const edad = edadDeFlotante(x.r, ficha, anioActual);
  const conEdad = edad ? `edad ${edad.edad} ("${edad.expresion}")` : '';
  if (edad && edad.edad < mig.edadMigracion) return { momento: 'antes', senal: conEdad, edad: edad.edad };
  const marcas = marcasDeDespues(x.r.texto, mig);
  const mitad = normalizar(x.r.texto).length / 2;
  if (marcas.length >= 2 || (marcas.length === 1 && marcas[0].pos < mitad)) {
    return { momento: 'despues', senal: marcas[0].senal + (marcas.length > 1 ? ` (${marcas.length} señales)` : ''), ...(edad ? { edad: edad.edad } : {}) };
  }
  if (edad) return { momento: 'despues', senal: conEdad, edad: edad.edad };
  const oficio = oficioDe(x, ficha);
  const conOficio = oficio && typeof oficio.desde === 'number' ? `oficio "${oficio.nombre}" desde ${oficio.desde}` : '';
  if (oficio && typeof oficio.desde === 'number' && oficio.desde >= mig.anioMigracion) return { momento: 'despues', senal: conOficio };
  if (conOficio) return { momento: 'antes', senal: conOficio };
  const origen = nombraLugar(x.r.texto, mig.origen);
  if (origen) return { momento: 'antes', senal: `nombra "${origen}"` };
  if (marcas.length) return { momento: 'sin-senal', senal: `${marcas[0].senal} una sola vez, en la segunda mitad: no alcanza` };
  return { momento: 'sin-senal', senal: 'sin señal' };
}

/** La regla fija que manda una respuesta al viaje sin mirar el texto, o null. */
function reglaDeViaje(x: Item, ficha: FichaV3): string | null {
  if (x.r.bloque === 5 && MIGRACION.has(x.r.preguntaId)) return 'bloque 5, migración';
  if (x.r.bloque === 14) return 'bloque 14';
  if (x.r.bloque === 6 && esParejaActual(x, ficha)) return 'pareja actual';
  return null;
}

/**
 * Clasificador del modo migrante joven para un libro: guarda lo que ya
 * calculó (una respuesta se clasifica una vez) y lo que se reporta.
 *
 * Una pregunta de seguimiento ("TR1b") sin señal propia hereda la
 * clasificación de su pregunta madre ("TR1"): la del mismo sujeto y, entre
 * esas, la última anterior. Si la madre va al viaje por regla, la hija es
 * "después".
 */
function clasificadorMigracion(todos: Item[], ficha: FichaV3, anioActual: number, mig: Migracion) {
  const memo = new Map<string, Senal>();
  const registro = new Map<string, { x: Item; c: Omit<Clasificacion, 'capitulo'> }>();

  const madreDe = (x: Item): Item | null => {
    const m = /^(.*\d)b$/.exec(x.r.preguntaId);
    if (!m) return null;
    const candidatas = todos.filter((y) => y.r.preguntaId === m[1]);
    const mismoSujeto = candidatas.filter((y) => y.r.sujeto === x.r.sujeto);
    const pool = mismoSujeto.length ? mismoSujeto : candidatas;
    const anteriores = pool.filter((y) => y.indice < x.indice);
    return anteriores.length ? anteriores[anteriores.length - 1] : pool[0] ?? null;
  };

  const momento = (x: Item): Senal => {
    const guardado = memo.get(x.r.id);
    if (guardado) return guardado;
    let s = senalMigracion(x, ficha, anioActual, mig);
    const madre = s.momento === 'sin-senal' ? madreDe(x) : null;
    if (madre) {
      const regla = reglaDeViaje(madre, ficha);
      const deMadre: Senal | null = regla ? { momento: 'despues', senal: regla } : momento(madre);
      if (deMadre.momento !== 'sin-senal') s = { momento: deMadre.momento, senal: `hereda de ${madre.r.id} ${madre.r.preguntaId} (${deMadre.senal})` };
    }
    memo.set(x.r.id, s);
    return s;
  };

  const anotar = (x: Item, c: { momento: Momento; senal: string; edad?: number }) =>
    registro.set(x.r.id, { x, c: { respuestaId: x.r.id, preguntaId: x.r.preguntaId, bloque: x.r.bloque, ...c } });

  /** Clasifica y anota una respuesta (para el reporte y el invariante). */
  const clasificar = (x: Item): Senal => {
    const s = momento(x);
    anotar(x, s);
    return s;
  };

  /**
   * El tema de etapa de una respuesta que no es de "después": por la edad
   * dicha, por el léxico de etapa (hasta Salir al mundo) y, si no, Salir al
   * mundo ("Hacerse grande" en Estándar).
   */
  const temaDeEtapa = (x: Item, s: Senal): number => {
    if (s.edad !== undefined) return madrePorEdad(s.edad) ?? 4;
    const lex = etapaPorLexico(x.r.texto, ficha);
    return lex && lex.madre <= 4 ? lex.madre : 4;
  };

  const clasificados = () => [...registro.values()].sort((a, b) => a.x.indice - b.x.indice).map((v) => v.c);

  return { clasificar, anotar, temaDeEtapa, clasificados };
}

type Clasificador = ReturnType<typeof clasificadorMigracion>;

/**
 * Antes de agrupar: pasa al tema del viaje lo que absorbe "El viaje, hasta
 * hoy" por regla (bloque 5 de migración, bloque 14, pareja actual) o por
 * señal de "después" (trabajo, lugares, amigos, flotantes y lo que iría a
 * Hoy). Lo que iría a Hoy sin señal de "después" va a su etapa: en este modo
 * no hay Hoy y el viaje no recibe lo que no es de después.
 */
function clasificarMigracion(items: Item[], ficha: FichaV3, cl: Clasificador): void {
  for (const x of items) {
    const regla = reglaDeViaje(x, ficha);
    if (regla) {
      x.tema = TEMA_VIAJE;
      cl.anotar(x, { momento: 'regla', senal: regla });
    }
  }
  for (const x of items) {
    if (x.tema === TEMA_VIAJE) continue;
    const hoy = x.tema === 10;
    if (!hoy && (!BLOQUES_CON_SENAL.has(x.r.bloque) || x.tema === 9)) continue;
    const s = cl.clasificar(x);
    if (s.momento === 'despues') x.tema = TEMA_VIAJE;
    else if (hoy) x.tema = cl.temaDeEtapa(x, s);
  }
}

// ---------------------------------------------------------------- 5. partición

type Clave = { orden: { clave: string; nombre: string }[]; claveDe: (x: Item) => string | null };

/** La clave fija de partición de cada capítulo de Completo (y del viaje), o null si no se parte. */
function claveDeParticion(g: Grupo, ficha: FichaV3, mig: Migracion | null, anioActual: number): Clave | null {
  const tema = g.fila.temas[0];
  const propios = (x: Item) => x.tema === tema;
  switch (g.fila.clave) {
    case 'C2':
      return {
        orden: [{ clave: 'casa', nombre: 'La casa' }, { clave: 'escuela', nombre: 'La escuela' }],
        claveDe: (x) => (x.r.bloque === 3 ? 'escuela' : 'casa'),
      };
    case 'C4':
      return {
        orden: [
          { clave: 'general', nombre: 'Irse de casa' }, { clave: 'estudios', nombre: 'Los estudios' },
          { clave: 'militar', nombre: 'Lo militar' }, { clave: 'migracion', nombre: 'El viaje' },
        ],
        claveDe: (x) => (ESTUDIOS.has(x.r.preguntaId) ? 'estudios' : MILITAR.has(x.r.preguntaId) ? 'militar' : MIGRACION.has(x.r.preguntaId) ? 'migracion' : 'general'),
      };
    case 'C5': {
      const parejas = lista(ficha.parejas);
      if (parejas.length < 2) return null;
      const actual = parejas.findIndex((p) => p.actual) + 1;
      return {
        orden: [...parejas.map((p, i) => ({ clave: `pareja:${i + 1}`, nombre: p.nombre })), { clave: 'otros', nombre: 'Otras personas' }],
        claveDe: (x) => {
          const k = numeroDe(x.r.sujeto, 'pareja') ?? (x.r.preguntaId === 'AM13' && actual > 0 ? actual : null);
          return k && k <= parejas.length ? `pareja:${k}` : 'otros';
        },
      };
    }
    case 'C6': {
      const oficios = lista(ficha.oficios);
      if (oficios.length >= 2) {
        return {
          orden: oficios.map((o, i) => ({ clave: `oficio:${i + 1}`, nombre: o.nombre })),
          claveDe: (x) => {
            const k = numeroDe(x.r.sujeto, 'oficio');
            if (k && k <= oficios.length) return `oficio:${k}`;
            const i = oficios.findIndex((o) => mencionaActividad(x.r.texto, o.nombre));
            return i >= 0 ? `oficio:${i + 1}` : null;
          },
        };
      }
      if (estado(ficha.campo) === 'lleno') {
        return {
          orden: [{ clave: 'campo', nombre: 'El campo' }, { clave: 'despues', nombre: 'Después' }],
          claveDe: (x) => (CAMPO.has(x.r.preguntaId) ? 'campo' : 'despues'),
        };
      }
      return null;
    }
    case 'C7':
      return {
        orden: [{ clave: 'chicos', nombre: 'Cuando eran chicos' }, { clave: 'grandes', nombre: 'Cuando crecieron, y los nietos' }],
        claveDe: (x) => (HIJOS_CHICOS.has(x.r.preguntaId) ? 'chicos' : 'grandes'),
      };
    case 'C8': {
      // "Mi pasión: X" si una pasión suma PASION_GRANDE escritas o más.
      for (const a of (ficha.actividades ?? []).filter((x) => x.marca === 'pasion')) {
        const suyas = g.items.filter((x) => propios(x) && mencionaActividad(x.r.texto, a.nombre));
        if (escritasDe(suyas) >= PASION_GRANDE) {
          const ids = new Set(suyas.map((x) => x.r.id));
          return {
            orden: [{ clave: 'resto', nombre: 'Mi gente y mis lugares' }, { clave: 'pasion', nombre: `Mi pasión: ${a.nombre}` }],
            claveDe: (x) => (ids.has(x.r.id) ? 'pasion' : 'resto'),
          };
        }
      }
      return {
        orden: [{ clave: 'lugares', nombre: 'Mis lugares y pasiones' }, { clave: 'gente', nombre: 'Mi gente' }],
        claveDe: (x) => (x.r.bloque === 10 || x.r.preguntaId === 'HI10' ? 'gente' : 'lugares'),
      };
    }
    case 'VIAJE': {
      if (!mig) return null;
      // Edad de instalación = edad de migración + 1: lo de antes va a "El viaje".
      return {
        orden: [{ clave: 'viaje', nombre: 'El viaje' }, { clave: 'hoy', nombre: `Hoy, en ${mig.lugar}` }],
        claveDe: (x) => {
          if (MIGRACION.has(x.r.preguntaId)) return 'viaje';
          const edad = edadDeFlotante(x.r, ficha, anioActual);
          return edad && edad.edad <= mig.edadMigracion + 1 ? 'viaje' : 'hoy';
        },
      };
    }
    default:
      return null;
  }
}

/** Junta la parte i con su vecina más chica; la juntada se queda con el nombre de la más grande. */
function juntarConVecina(partes: Parte[], i: number): void {
  const izq = i > 0 ? partes[i - 1] : null;
  const der = i < partes.length - 1 ? partes[i + 1] : null;
  const j = !izq ? i + 1 : !der ? i - 1 : palabras(izq.items) <= palabras(der.items) ? i - 1 : i + 1;
  const [a, b] = j < i ? [partes[j], partes[i]] : [partes[i], partes[j]];
  const mayor = palabras(b.items) > palabras(a.items) ? b : a;
  partes.splice(Math.min(i, j), 2, { clave: mayor.clave, nombre: mayor.nombre, items: [...a.items, ...b.items] });
}

/**
 * Parte un capítulo por su clave. Lo recibido de otro tema va a la primera
 * parte si su tema es anterior y a la última si es posterior; lo que la
 * clave no reconoce, a la primera. Ninguna parte bajo `minimo` escritas y no
 * más de `maxPartes`.
 */
function partir(g: Grupo, clave: Clave, maxPartes: number, minimo: number): Parte[] | null {
  const tema = g.fila.temas[0];
  const partes: Parte[] = clave.orden.map((o) => ({ ...o, items: [] as Item[] }));
  const sueltos: { antes: Item[]; despues: Item[] } = { antes: [], despues: [] };
  for (const x of g.items) {
    if (g.fila.clave !== 'VIAJE' && x.tema !== tema) {
      (x.tema < tema ? sueltos.antes : sueltos.despues).push(x);
      continue;
    }
    const c = clave.claveDe(x);
    const parte = partes.find((p) => p.clave === c);
    if (parte) parte.items.push(x);
    else sueltos.antes.push(x);
  }
  const conMaterial = partes.filter((p) => p.items.length > 0);
  if (!conMaterial.length) return null;
  conMaterial[0].items.unshift(...sueltos.antes);
  conMaterial[conMaterial.length - 1].items.push(...sueltos.despues);

  for (;;) {
    const chica = conMaterial.findIndex((p) => escritasDe(p.items) < minimo);
    if (chica < 0 || conMaterial.length === 1) break;
    const menor = conMaterial.reduce((m, p, i) => (palabras(p.items) < palabras(conMaterial[m].items) ? i : m), chica);
    juntarConVecina(conMaterial, menor);
  }
  while (conMaterial.length > maxPartes) {
    const menor = conMaterial.reduce((m, p, i) => (palabras(p.items) < palabras(conMaterial[m].items) ? i : m), 0);
    juntarConVecina(conMaterial, menor);
  }
  return conMaterial;
}

// ---------------------------------------------------------------- armado

export function armarIndice(respuestas: RespuestaV3[], ficha: FichaV3, opciones: OpcionesIndice = {}): Indice {
  const anioActual = opciones.anioActual ?? new Date().getFullYear();
  const tamanio = opciones.tamanio ?? 'E';
  const avisos: string[] = [];
  const flotantes: Ubicacion[] = [];
  const cierre: string[] = [];
  const saltos: Salto[] = [];
  const items: Item[] = [];

  // 1. Ubicar.
  respuestas.forEach((r, indice) => {
    if (r.paso) return;
    const u = ubicar(r, ficha, anioActual, avisos);
    if (u.tema === 'cierre') {
      cierre.push(r.id);
      return;
    }
    if (u.tema === null) return;
    const p = preguntaPorId(r.preguntaId);
    const sensible = !!p?.sensible || r.bloque === 11 || !!u.ubicacion?.sensible;
    items.push({ r, tema: u.tema, ...(u.receptor !== undefined ? { receptor: u.receptor } : {}), orden: p?.orden ?? Number.MAX_SAFE_INTEGER, indice, sensible });
    if (u.ubicacion) flotantes.push({ respuestaId: r.id, preguntaId: r.preguntaId, ...u.ubicacion });
  });
  // En Breve y Estándar "Lo que costó" no es capítulo: el receptor es la ubicación.
  if (tamanio !== 'C') for (const x of items) if (x.tema === 9) x.tema = x.receptor ?? 10;

  // 2. Gates de la ficha.
  const conPareja = estado(ficha.parejas) === 'lleno';
  const conHijos = estado(ficha.hijos) === 'lleno';
  // Estándar: sin pareja y sin hijos, E3 no existe. Completo: sin pareja, C5
  // no existe; sin hijos, C7 no existe (lo que cae en hijos por léxico, "cuando
  // nacieron los chicos" de otro, iría a un capítulo de hijos de nadie).
  const quitados =
    tamanio === 'E' ? (!conPareja && !conHijos ? [5, 7] : [])
    : tamanio === 'C' ? [...(!conPareja ? [5] : []), ...(!conHijos ? [7] : [])]
    : [];
  if (quitados.length) {
    for (const x of items) {
      if (quitados.includes(x.tema)) x.tema = 8;
      if (x.receptor !== undefined && quitados.includes(x.receptor)) x.receptor = 8;
    }
    const cual = tamanio === 'E' ? ['"Amor y la familia que armé"'] : [...(quitados.includes(5) ? ['"Amor"'] : []), ...(quitados.includes(7) ? ['"Hijos y nietos"'] : [])];
    avisos.push(`Por la ficha (${[!conPareja ? 'sin pareja' : '', !conHijos ? 'sin hijos' : ''].filter(Boolean).join(', ')}), ${cual.join(' y ')} no existe; sus respuestas (PI, AM15, HI10…) van a "Mi gente y mis lugares".`);
  }
  const edadMig = estado(ficha.migracion) === 'lleno' ? edadMigracion(ficha) : null;
  if (estado(ficha.migracion) === 'lleno' && edadMig === null) avisos.push('La ficha no trae el año ni la edad de la migración: no se puede titular "El viaje" ni ver si es migrante joven.');

  // 3. Modo migrante joven.
  const mig = detectarMigranteJoven(ficha, anioActual);
  const cl = mig ? clasificadorMigracion(items, ficha, anioActual, mig) : null;
  if (cl) clasificarMigracion(items, ficha, cl);
  const conViaje = edadMig !== null && edadMig <= EDAD_VIAJE && !mig;

  // Grupos por la tabla del tamaño.
  const filas = mig ? [...AGRUPACIONES[tamanio], FILA_VIAJE] : AGRUPACIONES[tamanio];
  const grupos = new Map<string, Grupo>();
  for (const fila of filas) {
    grupos.set(fila.clave, {
      fila,
      titulo: tituloInicial(fila, { conPareja, conHijos, conViaje }),
      items: items.filter((x) => fila.temas.includes(x.tema)),
      claves: [fila.clave],
      recibio: false,
      destino: null,
      repartido: false,
      corto: false,
      coda: false,
    });
  }
  const posicion = (clave: string) => filas.findIndex((f) => f.clave === clave);
  const esHoy = (clave: string) => AGRUPACIONES[tamanio].find((f) => f.clave === clave)?.temas.includes(10) ?? false;
  const claveDeTema = (tema: number): string | null =>
    tema === TEMA_VIAJE || (mig && tema === 10) ? 'VIAJE' : filas.find((f) => f.temas.includes(tema))?.clave ?? null;
  const huesped = (clave: string): Grupo => {
    let g = grupos.get(clave)!;
    while (g.destino) g = grupos.get(g.destino)!;
    return g;
  };
  /**
   * Modo migrante joven: el viaje solo recibe lo que es de "después". Lo
   * demás va al capítulo de su etapa (edad, léxico; si no, "Hacerse grande"),
   * o al último que exista antes si ese no está.
   */
  const grupoDeEtapa = (tema: number): Grupo => {
    const g = huesped(claveDeTema(tema)!);
    if (g.items.length) return g;
    for (let i = posicion(g.fila.clave) - 1; i >= 0; i--) {
      const otro = grupos.get(filas[i].clave)!;
      if (!otro.destino && !otro.repartido && otro.items.length) return otro;
    }
    return g;
  };
  const destinoDe = (x: Item, a: Grupo): Grupo => {
    if (!cl || a.fila.clave !== 'VIAJE') return a;
    const s = cl.clasificar(x);
    return s.momento === 'despues' ? a : grupoDeEtapa(cl.temaDeEtapa(x, s));
  };
  /** Mueve cada respuesta (un salto) y devuelve los grupos que recibieron. */
  const mover = (xs: Item[], de: Grupo, a: Grupo): Set<Grupo> => {
    const recibieron = new Set<Grupo>();
    for (const x of xs) {
      const d = destinoDe(x, a);
      d.items.push(x);
      recibieron.add(d);
      saltos.push({ respuestaId: x.r.id, de: de.fila.clave, a: d.fila.clave });
    }
    return recibieron;
  };
  const recibirEntero = (g: Grupo, a: Grupo) => {
    const recibieron = mover(g.items, g, a);
    a.recibio = true;
    for (const d of recibieron) if (d !== a) d.claves.push(...g.claves.filter((k) => !d.claves.includes(k)));
    if (recibieron.has(a) || a.fila.clave !== 'VIAJE') a.claves.push(...g.claves);
    if (a.fila.clave !== 'VIAJE') a.titulo = alRecibir(a.titulo, g.titulo, avisos);
    else if ([...recibieron].some((d) => d !== a)) {
      avisos.push(`Modo migrante joven: de "${g.titulo}", al viaje solo lo que tiene señal de "después"; lo demás va a ${[...recibieron].filter((d) => d !== a).map((d) => `"${d.titulo}"`).join(' y ')}.`);
    }
    g.items = [];
    g.destino = a.fila.clave;
  };

  // 4. Pisos y receptores: una sola pasada, de arriba hacia abajo.
  for (const fila of filas) {
    const g = grupos.get(fila.clave)!;
    if (mig && esHoy(fila.clave)) continue; // Hoy lo absorbe "El viaje, hasta hoy"
    if (!g.items.length) {
      if (esHoy(fila.clave)) avisos.push('Hoy no tiene material: no hay capítulo ni coda.');
      continue;
    }
    const w = escritasDe(g.items);
    if (fila.piso === null || g.recibio || w >= fila.piso) continue;
    const bajo = `"${g.titulo}" (${miles(w)} escritas, piso ${miles(fila.piso)})`;

    if (fila.receptor === 'coda') {
      g.coda = true;
      avisos.push(`${bajo} se vuelve la coda: dos páginas sin número antes de la carta.`);
    } else if (fila.receptor === 'reparto') {
      avisos.push(`${bajo} no existe: sus respuestas se reparten por pregunta.`);
      for (const x of g.items) mover([x], g, destinoDeReparto(x.receptor ?? 10));
      g.items = [];
      g.repartido = true;
    } else if (fila.receptor === 'amor') {
      if (w >= PISO_AMOR_CORTO) {
        g.corto = true;
        avisos.push(`Amor: ${bajo} existe corto (tiene ${miles(PISO_AMOR_CORTO)} o más) y no se funde.`);
      } else {
        const gente = huesped(claveDeTema(8)!);
        avisos.push(`Amor: ${bajo} tiene menos de ${miles(PISO_AMOR_CORTO)}: sus respuestas van a "${gente.titulo}".`);
        recibirEntero(g, gente);
      }
    } else if (fila.receptor) {
      const clave = mig && esHoy(fila.receptor) ? 'VIAJE' : fila.receptor;
      const rec = grupos.get(clave)!;
      const usable = !rec.destino && !rec.repartido && (rec.items.length > 0 || posicion(clave) > posicion(fila.clave));
      if (usable) {
        avisos.push(`${bajo} va a "${rec.titulo}".`);
        recibirEntero(g, rec);
      } else {
        g.corto = true;
        avisos.push(`${bajo} queda corto: su receptor "${rec.fila.titulo}" ya no está (sin cadenas).`);
      }
    }
  }

  /** Lo que costó bajo el piso: cada respuesta a su receptor, directo al capítulo que hoy lo tiene (un salto). */
  function destinoDeReparto(tema: number): Grupo {
    const aca = posicion('C9');
    for (const t of [tema, 8, 10]) {
      const clave = claveDeTema(t);
      if (!clave) continue;
      const g = huesped(clave);
      if (!g.repartido && (g.items.length > 0 || posicion(g.fila.clave) > aca)) return g;
    }
    return huesped(claveDeTema(10)!);
  }

  // 5. Capítulos, coda y particiones (solo Completo).
  const capitulos: Capitulo[] = [];
  let coda: Capitulo | null = null;
  for (const fila of filas) {
    const g = grupos.get(fila.clave)!;
    if (g.destino || g.repartido || !g.items.length) continue;
    if (g.coda) {
      coda = armarCapitulo(g, g.titulo, undefined, g.items, true);
      continue;
    }
    const w = escritasDe(g.items);
    let partes: Parte[] | null = null;
    if (tamanio === 'C' && w > TOPE_PARTICION) {
      const clave = claveDeParticion(g, ficha, mig, anioActual);
      const maxPartes = w > TOPE_SEGUNDA_PARTICION ? 3 : 2;
      if (!clave) {
        avisos.push(`"${g.titulo}" tiene ${miles(w)} escritas (más de ${miles(TOPE_PARTICION)}) y no se parte: ${fila.clave === 'C3' ? 'su clave son los capítulos de LE7, que el código no lee' : 'no tiene clave de partición'}.`);
      } else {
        partes = partir(g, clave, maxPartes, fila.piso ?? 900);
        if (partes && partes.length === 1) {
          avisos.push(`"${g.titulo}" tiene ${miles(w)} escritas y no se parte: su clave no da dos partes sobre el piso.`);
          partes = null;
        } else if (partes) {
          avisos.push(`"${g.titulo}" (${miles(w)} escritas) se parte en ${partes.length}: ${partes.map((p) => p.nombre).join(' / ')}.`);
        }
      }
    }
    if (!partes) capitulos.push(armarCapitulo(g, g.titulo, undefined, g.items));
    else for (const p of partes) capitulos.push(armarCapitulo(g, g.titulo, { clave: p.clave, nombre: p.nombre }, p.items));
  }

  const dondeQuedo = (id: string) => [...capitulos, ...(coda ? [coda] : [])].find((c) => c.respuestaIds.includes(id))?.clave ?? '';
  const migranteJoven: MigranteJoven | null = mig
    ? {
        edadMigracion: mig.edadMigracion,
        edadActual: mig.edadActual,
        lugaresDestino: mig.destino,
        clasificacion: cl!.clasificados().map((c) => ({ ...c, capitulo: dondeQuedo(c.respuestaId) })),
      }
    : null;

  return { tamanio, capitulos, coda, cierre, flotantes, saltos, migranteJoven, avisos };
}

function tituloInicial(fila: Agrupacion, f: { conPareja: boolean; conHijos: boolean; conViaje: boolean }): string {
  if (fila.clave === 'E2' && f.conViaje) return TITULOS_GATE.hacerseGrandeYElViaje;
  if (fila.clave === 'C4' && f.conViaje) return TITULOS_GATE.elViaje;
  if (fila.clave === 'E3' && f.conPareja && !f.conHijos) return TITULOS_GATE.amor;
  if (fila.clave === 'E3' && !f.conPareja && f.conHijos) return TITULOS_GATE.laFamiliaQueArme;
  return fila.titulo;
}

function alRecibir(receptor: string, llega: string, avisos: string[]): string {
  const titulo = AL_RECIBIR[`${receptor} ← ${llega}`];
  if (titulo) return titulo;
  avisos.push(`Título sin tabla: "${receptor}" recibe a "${llega}"; queda "${receptor}".`);
  return receptor;
}

function armarCapitulo(g: Grupo, titulo: string, parte: Capitulo['parte'], items: Item[], coda = false): Capitulo {
  const ordenados = [...items].sort((a, b) => a.r.bloque - b.r.bloque || a.orden - b.orden || a.indice - b.indice);
  const W = palabras(items);
  return {
    clave: g.fila.clave,
    claves: [...g.claves],
    titulo,
    ...(parte ? { parte } : {}),
    ...(g.corto ? { corto: true as const } : {}),
    ...(coda ? { coda: true as const } : {}),
    subtitulo: null,
    respuestaIds: ordenados.map((x) => x.r.id),
    sensibles: ordenados.filter((x) => x.sensible).map((x) => x.r.id),
    palabrasHabladas: W,
    palabrasEscritasObjetivo: escritas(W),
  };
}
