// El índice del libro V3, calculado por código antes de llamar al modelo
// (docs/v3/diseno-v3.md, "Capítulos madre, hilos y forma del libro"; reglas
// finas de la opción C de Fable y su revisión). Diez capítulos madre fijos:
//
//   1 De dónde vengo · 2 Los primeros años · 3 Adolescencia · 4 Salir al mundo
//   (o "El viaje") · 5 Amor · 6 Trabajo y oficio · 7 Hijos y nietos · 8 Mi gente
//   y mis lugares · 9 Lo que costó · 10 Hoy
//
// Pasos, todos deterministas:
//   1. Cada respuesta va al capítulo de su bloque (ancla). Las flotantes
//      (bloques 12 y 13) se ubican por edad dicha, léxico de etapa, persona de
//      la ficha o, si no, por defecto. Puertas y válvulas van al capítulo del
//      bloque que cierran. Crisis (bloque 11) de antes de los 25 → su etapa,
//      marcadas sensibles. PA1/PA2 de una actividad que es oficio → Trabajo.
//   2. Bisagra: si la migración cae entre dos parejas u oficios de la ficha,
//      sus respuestas forman "El viaje" entre esas dos partes.
//   3. Fusión por mínimo con el vecino fijo, en cadena, con títulos de tabla.
//   4. Partición por clave fija de la ficha cuando desborda. Nunca por años.
//
// El índice NO decide personas, subtítulos ni orden interno fino: eso viene
// después (subtitulo: null).

import { preguntaPorId } from './banco.js';
import { anioMigracion, edadMigracion, estado, lista, type FichaV3 } from './ficha.js';
import { edadDicha, etapaPorLexico, madrePorEdad, mencionaActividad, personaNombrada, posicionActividad } from './etapa.js';

// ---------------------------------------------------------------- tipos

export type RespuestaV3 = {
  id: string;
  preguntaId: string;
  bloque: number;
  sujeto?: string; // 'pareja:1', 'hijo:2', 'oficio:1'
  palabras: number; // habladas
  texto: string;
  paso?: boolean;
};

export type Motivo = 'edad-numero' | 'lexico' | 'persona' | 'defecto' | 'oficio';

export type Ubicacion = {
  respuestaId: string;
  preguntaId: string;
  madre: number; // capítulo madre antes de fusiones y particiones
  motivo: Motivo;
  edad?: number;
  expresion?: string;
  sensible?: boolean;
};

export type Capitulo = {
  madre: number; // el capítulo madre anfitrión (el que da la posición)
  madres: number[]; // todos los capítulos madre que contiene (más de uno si hubo fusión)
  titulo: string;
  parte?: { clave: string; nombre: string };
  subtitulo: null;
  respuestaIds: string[];
  sensibles: string[];
  palabrasHabladas: number;
  palabrasEscritasObjetivo: number;
};

export type Indice = {
  capitulos: Capitulo[];
  cierre: string[]; // legado (bloque 15): carta final, fuera del índice
  flotantes: Ubicacion[];
  avisos: string[];
};

export type OpcionesIndice = {
  tamanio?: 'B' | 'E' | 'C';
  anioActual?: number;
  /** Mínimo de palabras habladas para existir (por defecto MINIMO). Solo para calibrar con el simulador. */
  minimo?: number;
};

// ---------------------------------------------------------------- tablas fijas

export const TITULOS: Record<number, string> = {
  1: 'De dónde vengo',
  2: 'Los primeros años',
  3: 'Adolescencia',
  4: 'Salir al mundo',
  5: 'Amor',
  6: 'Trabajo y oficio',
  7: 'Hijos y nietos',
  8: 'Mi gente y mis lugares',
  9: 'Lo que costó',
  10: 'Hoy',
};

export const TITULO_VIAJE = 'El viaje';

/** Vecino de fusión (opción C de Fable). 2 es el ancla; 10 (Hoy) siempre existe. */
export const VECINO_FUSION: Record<number, number> = { 1: 2, 3: 2, 4: 3, 5: 8, 6: 4, 7: 5, 8: 6, 9: 8 };

/**
 * Títulos de fusión, escritos de antemano (Fable 5, crítica 1b). La clave son
 * los capítulos madre que quedaron juntos, ordenados. Como cada capítulo se
 * fusiona hacia su vecino fijo, los grupos posibles son los subárboles del
 * árbol 2 ← 1, 2 ← 3 ← 4 ← 6 ← 8 ← {5 ← 7, 9}:
 *
 *   pares:  1+2, 2+3, 3+4, 4+6, 6+8, 5+8, 8+9, 5+7
 *   tríos y más: los que aparecen en la simulación con alguna frecuencia.
 *
 * Un grupo que no está en la tabla usa el título de su anfitrión y deja un
 * aviso (así se ve en la simulación y se agrega acá, nunca lo inventa el modelo).
 * "{viaje}" = el título del capítulo 4 ("Salir al mundo" o "El viaje").
 * Un 2 sin 3 (Adolescencia sin material) se trata como 2+3.
 */
export const TITULOS_FUSION: Record<string, string> = {
  '1+2': 'De dónde vengo y los primeros años',
  '2+3': 'Crecer',
  '1+2+3': 'Crecer',
  '2+4': 'Crecer',
  '2+3+4': 'Crecer',
  '1+2+3+4': 'Crecer',
  '1+2+4': 'Crecer',
  '3+4': 'Hacerse grande',
  '3+4+6': 'Hacerse grande',
  '2+3+4+6': 'Crecer',
  '1+2+3+4+6': 'Crecer',
  '4+6': '{viaje}',
  '5+8': 'Mi gente',
  '5+7': 'La familia',
  '5+7+8': 'La familia y mi gente',
  '6+8': 'El trabajo y mi gente',
  '5+6+8': 'El trabajo y mi gente',
  '8+9': 'Mi gente y lo que costó',
  '5+8+9': 'Mi gente y lo que costó',
  '6+8+9': 'El trabajo y lo que costó',
  '5+6+8+9': 'El trabajo y lo que costó',
  '4+6+8': '{viaje}',
  '4+6+8+9': '{viaje}',
};

export const MINIMO = 1500; // palabras habladas para existir
export const MINIMO_ORIGEN = 800; // De dónde vengo abre el libro: existe con menos
export const MAXIMO = 5000; // más que esto se parte
export const MAXIMO_SEGUNDA = 9000; // segunda partición, solo Completo
export const PASION_GRANDE = 2000; // una pasión que suma esto parte "Mi gente y mis lugares"
export const FACTOR_ESCRITO = 0.6; // palabras escritas ≈ 0,6 × habladas
export const EDAD_VIAJE = 30; // "El viaje" si migró con esto o menos…
export const PROPORCION_VIAJE = 0.6; // …y la migración es al menos esto del capítulo 4
export const ANIO_PANDEMIA = 2020; // HG4 sin fecha dicha: el año se sabe

const ANCLA: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 8, 11: 9, 14: 10 };
const MIGRACION = new Set(['JU8', 'JU9', 'JU10', 'JU10b', 'JU11', 'MI1', 'MI1.2']);
const ESTUDIOS = new Set(['JU2', 'JU2b', 'JU3', 'JU3b']);
const MILITAR = new Set(['JU5', 'JU6']);
const CAMPO = new Set(['CP1', 'CP2', 'CP3']);
const HIJOS_CHICOS = new Set(['HI1', 'HI2', 'HI3', 'HI3b', 'HI4', 'HI5', 'HI6']);
const HIJOS_FALLECIDOS = new Set(['HF1', 'HF2']);
const PASIONES = new Set(['PA1', 'PA2']);
/** Bloque 13 "bajos" (por defecto a Lo que costó); el resto son altos o giros (por defecto a Hoy). */
const BAJOS_13 = new Set(['GI3', 'HJ1', 'HJ2', 'GI5', 'HJ9']);
/** HJ5 (volver al lugar donde creció) va por defecto a Mi gente y mis lugares. */
const LUGARES_13 = new Set(['HJ5']);

// ---------------------------------------------------------------- utilidades

type Item = { r: RespuestaV3; madre: number; orden: number; indice: number; sensible: boolean };
type Parte = { clave: string; nombre: string; items: Item[] };

const palabras = (items: Item[]) => items.reduce((s, x) => s + x.r.palabras, 0);
const miles = (n: number) => n.toLocaleString('es-AR');
const numeroDe = (sujeto: string | undefined, tipo: string): number | null => {
  const m = sujeto ? new RegExp(`^${tipo}:(\\d+)$`).exec(sujeto) : null;
  return m ? Number(m[1]) : null;
};

// ---------------------------------------------------------------- 1. ubicar cada respuesta

function ubicar(
  r: RespuestaV3,
  ficha: FichaV3,
  anioActual: number,
  avisos: string[],
): { madre: number | 'cierre' | null; ubicacion?: Omit<Ubicacion, 'respuestaId' | 'preguntaId'> } {
  const p = preguntaPorId(r.preguntaId);
  if (!p) avisos.push(`${r.id}: la pregunta ${r.preguntaId} no está en el banco; se ancla por su bloque (${r.bloque}).`);
  const bloque = r.bloque;
  const clase = p?.clase ?? 'historia';

  if (bloque === 15) return { madre: 'cierre' };
  if (HIJOS_FALLECIDOS.has(r.preguntaId)) return { madre: 7 };

  // Crisis (bloque 11, puerta y válvula incluidas): de chico, a su etapa.
  if (bloque === 11) {
    const edad = edadDicha(r.texto, ficha, anioActual);
    const porEdad = edad ? madrePorEdad(edad.edad) : null;
    if (edad && porEdad) return { madre: porEdad, ubicacion: { madre: porEdad, motivo: 'edad-numero', edad: edad.edad, expresion: edad.expresion, sensible: true } };
    if (!edad) {
      const lex = etapaPorLexico(r.texto, ficha);
      if (lex && lex.madre <= 4) return { madre: lex.madre, ubicacion: { madre: lex.madre, motivo: 'lexico', expresion: lex.expresion, sensible: true } };
    }
    return clase === 'historia' ? { madre: 9 } : { madre: 9, ubicacion: { madre: 9, motivo: 'defecto', sensible: true } };
  }

  // Oficio o pasión: la actividad que es oficio va a Trabajo.
  if (PASIONES.has(r.preguntaId)) {
    const oficios = [
      ...(ficha.actividades ?? []).filter((a) => a.marca === 'oficio').map((a) => a.nombre),
      ...lista(ficha.oficios).map((o) => o.nombre),
    ];
    const pasiones = (ficha.actividades ?? []).filter((a) => a.marca === 'pasion').map((a) => a.nombre);
    const primera = primeraMencion(r.texto, [...oficios.map((n) => ({ n, oficio: true })), ...pasiones.map((n) => ({ n, oficio: false }))]);
    if (primera?.oficio) return { madre: 6, ubicacion: { madre: 6, motivo: 'oficio', expresion: primera.n } };
  }

  if (clase === 'puerta' || clase === 'valvula') {
    const madre = bloque === 8 && estado(ficha.hijos) !== 'lleno' ? 8 : ANCLA[bloque];
    return { madre: madre ?? null, ubicacion: madre ? { madre, motivo: 'defecto' } : undefined };
  }

  if (bloque === 12 || bloque === 13) {
    const u = ubicarFlotante(r, ficha, anioActual);
    return { madre: u.madre, ubicacion: u };
  }

  if (r.preguntaId === 'HI10') return { madre: 8 };
  const madre = ANCLA[bloque];
  if (madre === 7 && estado(ficha.hijos) !== 'lleno' && !r.preguntaId.startsWith('HI') && !r.preguntaId.startsWith('NC')) return { madre: 8 };
  if (!madre) {
    avisos.push(`${r.id}: bloque ${bloque} desconocido; la respuesta queda fuera del índice.`);
    return { madre: null };
  }
  return { madre };
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

function defectoFlotante(r: RespuestaV3): number {
  if (r.bloque === 12) return 9;
  if (LUGARES_13.has(r.preguntaId)) return 8;
  return BAJOS_13.has(r.preguntaId) ? 9 : 10;
}

/** Flotantes (bloques 12 y 13): edad dicha → léxico → persona → defecto. */
function ubicarFlotante(r: RespuestaV3, ficha: FichaV3, anioActual: number): Omit<Ubicacion, 'respuestaId' | 'preguntaId'> {
  const dicha = edadDicha(r.texto, ficha, anioActual);
  const edad = dicha ?? (r.preguntaId === 'HG4' ? { edad: ANIO_PANDEMIA - ficha.anioNacimiento, expresion: `pandemia (${ANIO_PANDEMIA})` } : null);
  if (edad && edad.edad >= 0) {
    const etapa = madrePorEdad(edad.edad);
    if (etapa) return { madre: etapa, motivo: 'edad-numero', edad: edad.edad, expresion: edad.expresion };
  }
  const conEdad = edad ? { edad: edad.edad } : {};
  const lex = etapaPorLexico(r.texto, ficha);
  if (lex && !(edad && lex.madre <= 4)) return { madre: lex.madre, motivo: 'lexico', expresion: lex.expresion, ...conEdad };
  const persona = personaNombrada(r.texto, ficha);
  if (persona) return { madre: persona, motivo: 'persona', ...conEdad };
  return { madre: defectoFlotante(r), motivo: 'defecto', ...conEdad };
}

// ---------------------------------------------------------------- 4. partición

type Clave = { orden: { clave: string; nombre: string }[]; claveDe: (x: Item) => string | null };

/** La clave fija de partición de cada capítulo madre, o null si no se parte (1, 3, 9, 10). */
function claveDePartición(madre: number, items: Item[], ficha: FichaV3): Clave | null {
  switch (madre) {
    case 2:
      return {
        orden: [{ clave: 'casa', nombre: 'La casa' }, { clave: 'escuela', nombre: 'La escuela' }],
        claveDe: (x) => (x.r.bloque === 3 ? 'escuela' : 'casa'),
      };
    case 4:
      return {
        orden: [
          { clave: 'general', nombre: 'Irse de casa' }, { clave: 'estudios', nombre: 'Los estudios' },
          { clave: 'militar', nombre: 'Lo militar' }, { clave: 'migracion', nombre: TITULO_VIAJE },
        ],
        claveDe: (x) => (ESTUDIOS.has(x.r.preguntaId) ? 'estudios' : MILITAR.has(x.r.preguntaId) ? 'militar' : MIGRACION.has(x.r.preguntaId) ? 'migracion' : 'general'),
      };
    case 5: {
      const parejas = lista(ficha.parejas);
      if (parejas.length < 2) return null;
      const actual = parejas.findIndex((p) => p.actual) + 1;
      return {
        orden: [...parejas.map((p, i) => ({ clave: `pareja:${i + 1}`, nombre: p.nombre })), { clave: 'otros', nombre: 'Otras personas' }],
        claveDe: (x) => {
          const n = numeroDe(x.r.sujeto, 'pareja') ?? (x.r.preguntaId === 'AM13' && actual > 0 ? actual : null);
          return n && n <= parejas.length ? `pareja:${n}` : 'otros';
        },
      };
    }
    case 6: {
      const oficios = lista(ficha.oficios);
      if (oficios.length >= 2) {
        return {
          orden: oficios.map((o, i) => ({ clave: `oficio:${i + 1}`, nombre: o.nombre })),
          claveDe: (x) => {
            const n = numeroDe(x.r.sujeto, 'oficio');
            if (n && n <= oficios.length) return `oficio:${n}`;
            const i = oficios.findIndex((o) => mencionaActividad(x.r.texto, o.nombre));
            return i >= 0 ? `oficio:${i + 1}` : null;
          },
        };
      }
      if (estado(ficha.campo) === 'lleno') {
        return {
          orden: [{ clave: 'campo', nombre: 'El campo' }, { clave: 'despues', nombre: 'Después del campo' }],
          claveDe: (x) => (CAMPO.has(x.r.preguntaId) ? 'campo' : 'despues'),
        };
      }
      return null;
    }
    case 7:
      return {
        orden: [{ clave: 'chicos', nombre: 'Cuando eran chicos' }, { clave: 'grandes', nombre: 'Cuando crecieron y los nietos' }],
        claveDe: (x) => (HIJOS_CHICOS.has(x.r.preguntaId) ? 'chicos' : 'grandes'),
      };
    case 8: {
      // "Mi pasión: X" si una pasión suma PASION_GRANDE o más.
      for (const a of (ficha.actividades ?? []).filter((x) => x.marca === 'pasion')) {
        const suyas = items.filter((x) => mencionaActividad(x.r.texto, a.nombre));
        if (palabras(suyas) >= PASION_GRANDE) {
          const ids = new Set(suyas.map((x) => x.r.id));
          return {
            orden: [{ clave: 'resto', nombre: TITULOS[8] }, { clave: 'pasion', nombre: `Mi pasión: ${a.nombre}` }],
            claveDe: (x) => (ids.has(x.r.id) ? 'pasion' : 'resto'),
          };
        }
      }
      return {
        orden: [{ clave: 'lugares', nombre: 'Lugares y pasiones' }, { clave: 'gente', nombre: 'Mi gente' }],
        claveDe: (x) => (x.r.bloque === 10 || x.r.preguntaId === 'HI10' ? 'gente' : 'lugares'),
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
 * Parte los items de un capítulo (anfitrión + fusionados) por la clave de su
 * anfitrión. Los de un capítulo fusionado van a la primera parte si su madre
 * es anterior al anfitrión y a la última si es posterior; los que la clave no
 * reconoce, a la primera. Después: ninguna parte bajo el mínimo y no más de
 * `maxPartes`.
 */
function partir(host: number, items: Item[], ficha: FichaV3, maxPartes: number, minimo: number): Parte[] | null {
  const clave = claveDePartición(host, items.filter((x) => x.madre === host), ficha);
  if (!clave) return null;
  const partes: Parte[] = clave.orden.map((o) => ({ ...o, items: [] as Item[] }));
  const sueltos: { antes: Item[]; despues: Item[] } = { antes: [], despues: [] };
  for (const x of items) {
    if (x.madre !== host) {
      (x.madre < host ? sueltos.antes : sueltos.despues).push(x);
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
    const chica = conMaterial.findIndex((p) => palabras(p.items) < minimo);
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

// ---------------------------------------------------------------- 2. bisagra

type Bisagra = { tipo: 'pareja' | 'oficio'; k: number } | null;

/** ¿El año de migración cae entre la pareja (u oficio) k y la k+1 de la ficha? Solo con años en la ficha. */
function detectarBisagra(ficha: FichaV3, avisos: string[]): Bisagra {
  if (estado(ficha.migracion) !== 'lleno') return null;
  const anio = anioMigracion(ficha);
  const parejas = lista(ficha.parejas);
  const oficios = lista(ficha.oficios);
  const hayPares = parejas.length >= 2 || oficios.length >= 2;
  if (anio === null) {
    if (hayPares) avisos.push('Bisagra: la ficha no trae el año ni la edad de la migración; no se puede ver si cae entre dos parejas u oficios.');
    return null;
  }
  if (parejas.length >= 2) {
    if (parejas.every((p) => typeof p.anioInicio === 'number')) {
      for (let k = 1; k < parejas.length; k++) {
        if (parejas[k - 1].anioInicio! < anio && anio < parejas[k].anioInicio!) return { tipo: 'pareja', k };
      }
    } else {
      avisos.push('Bisagra: faltan los años de las parejas en la ficha; no se puede ver si la migración cae entre dos.');
    }
  }
  if (oficios.length >= 2) {
    if (oficios.every((o) => typeof o.desde === 'number')) {
      for (let k = 1; k < oficios.length; k++) {
        if (oficios[k - 1].desde! < anio && anio < oficios[k].desde!) return { tipo: 'oficio', k };
      }
    } else {
      avisos.push('Bisagra: faltan los años de los oficios en la ficha; no se puede ver si la migración cae entre dos.');
    }
  }
  return null;
}

// ---------------------------------------------------------------- armado

export function armarIndice(respuestas: RespuestaV3[], ficha: FichaV3, opciones: OpcionesIndice = {}): Indice {
  const anioActual = opciones.anioActual ?? new Date().getFullYear();
  const tamanio = opciones.tamanio ?? 'E';
  const minimo = opciones.minimo ?? MINIMO;
  const avisos: string[] = [];
  const flotantes: Ubicacion[] = [];
  const cierre: string[] = [];
  const items: Item[] = [];

  respuestas.forEach((r, indice) => {
    if (r.paso) return;
    const u = ubicar(r, ficha, anioActual, avisos);
    if (u.madre === 'cierre') {
      cierre.push(r.id);
      return;
    }
    if (u.madre === null) return;
    const p = preguntaPorId(r.preguntaId);
    const sensible = !!p?.sensible || r.bloque === 11 || !!u.ubicacion?.sensible;
    items.push({ r, madre: u.madre, orden: p?.orden ?? Number.MAX_SAFE_INTEGER, indice, sensible });
    if (u.ubicacion) flotantes.push({ respuestaId: r.id, preguntaId: r.preguntaId, ...u.ubicacion });
  });

  // 2. Bisagra: se separan las respuestas de migración antes de calcular el
  // título del capítulo 4 y antes de fusionar. Si no se hace en este orden,
  // el capítulo 4 (o su fusión) puede quedar titulado "El viaje" por su
  // proporción de migración ANTES de la bisagra, mientras la bisagra inserta
  // otro capítulo, también "El viaje", con las respuestas ya sacadas: dos
  // capítulos con el mismo título.
  let bisagra = detectarBisagra(ficha, avisos);
  let viaje: Item[] = [];
  if (bisagra) {
    const destino = bisagra.tipo === 'pareja' ? 5 : 6;
    const migracion = items.filter((x) => x.madre === 4 && MIGRACION.has(x.r.preguntaId));
    const propias = items.filter((x) => x.madre === destino);
    const partesDestino = partir(destino, propias, ficha, 2, minimo);
    if (palabras(migracion) < minimo) {
      avisos.push(`Bisagra: la migración cae entre dos ${bisagra.tipo === 'pareja' ? 'parejas' : 'oficios'}, pero sus respuestas suman ${miles(palabras(migracion))} palabras (mínimo ${miles(minimo)}); "El viaje" queda en su capítulo.`);
      bisagra = null;
    } else if (!partesDestino || partesDestino.length < 2) {
      avisos.push(`Bisagra: la migración cae entre dos ${bisagra.tipo === 'pareja' ? 'parejas' : 'oficios'}, pero "${TITULOS[destino]}" no da dos partes con material; "El viaje" queda en su capítulo.`);
      bisagra = null;
    } else {
      viaje = migracion;
      const ids = new Set(viaje.map((x) => x.r.id));
      for (let i = items.length - 1; i >= 0; i--) if (ids.has(items[i].r.id)) items.splice(i, 1);
    }
  }

  // "El viaje" como título del capítulo 4, con las respuestas de la bisagra
  // (si hubo) ya afuera de `items`.
  const del4 = items.filter((x) => x.madre === 4);
  const edadMig = edadMigracion(ficha);
  const palabrasMig4 = palabras(del4.filter((x) => MIGRACION.has(x.r.preguntaId)));
  const esViaje = edadMig !== null && edadMig <= EDAD_VIAJE && palabras(del4) > 0 && palabrasMig4 / palabras(del4) >= PROPORCION_VIAJE;
  const titulo4 = esViaje ? TITULO_VIAJE : TITULOS[4];

  // 3. Fusión por mínimo.
  const W = (m: number) => palabras(items.filter((x) => x.madre === m));
  const grupos = new Map<number, { madres: number[]; W: number }>(); // anfitrión → grupo
  for (let m = 1; m <= 10; m++) if (W(m) > 0 || m === 10) grupos.set(m, { madres: [m], W: W(m) });
  if (W(10) === 0) avisos.push('Hoy no tiene material; el capítulo existe igual (lleva el prólogo espejo).');
  const anfitrionDe = (m: number): number | null => {
    for (const [h, g] of grupos) if (g.madres.includes(m)) return h;
    return null;
  };
  const minimoDe = (h: number) => (h === 1 && grupos.get(1)!.madres.length === 1 ? Math.min(MINIMO_ORIGEN, minimo) : minimo);
  for (;;) {
    const bajo = [...grupos.entries()]
      .filter(([h, g]) => h !== 2 && h !== 10 && g.W < minimoDe(h))
      .sort((a, b) => a[1].W - b[1].W || b[0] - a[0]);
    if (!bajo.length) break;
    const [h, g] = bajo[0];
    let destino = VECINO_FUSION[h];
    for (;;) {
      const a = anfitrionDe(destino);
      if (a !== null) {
        destino = a;
        break;
      }
      if (destino === 2) {
        grupos.set(2, { madres: [2], W: 0 });
        break;
      }
      destino = VECINO_FUSION[destino];
    }
    const d = grupos.get(destino)!;
    avisos.push(`"${nombreGrupo(g.madres, h, titulo4)}" (${miles(g.W)} palabras, mínimo ${miles(minimoDe(h))}) se fusiona con "${nombreGrupo(d.madres, destino, titulo4)}".`);
    d.madres = [...d.madres, ...g.madres].sort((a, b) => a - b);
    d.W += g.W;
    grupos.delete(h);
  }
  // El ancla (2) no tiene vecino hacia atrás: si quedó corta, absorbe al
  // capítulo de etapa que le sigue (3, o 4 si no hay 3), no al revés.
  while (grupos.has(2) && grupos.get(2)!.W < minimo) {
    const siguiente = [3, 4].find((h) => grupos.has(h));
    const g2 = grupos.get(2)!;
    if (siguiente === undefined) {
      avisos.push(`"${nombreGrupo(g2.madres, 2, titulo4)}" quedó con ${miles(g2.W)} palabras (bajo el mínimo) y no hay etapa siguiente con qué juntarla.`);
      break;
    }
    const s = grupos.get(siguiente)!;
    avisos.push(`"${nombreGrupo(g2.madres, 2, titulo4)}" (${miles(g2.W)} palabras) es el ancla y quedó corta: absorbe a "${nombreGrupo(s.madres, siguiente, titulo4)}".`);
    g2.madres = [...g2.madres, ...s.madres].sort((a, b) => a - b);
    g2.W += s.W;
    grupos.delete(siguiente);
  }

  // 4. Capítulos, con partición.
  const capitulos: Capitulo[] = [];
  for (const host of [...grupos.keys()].sort((a, b) => a - b)) {
    const g = grupos.get(host)!;
    const titulo = tituloGrupo(g.madres, host, titulo4, avisos);
    const suyos = items.filter((x) => g.madres.includes(x.madre));
    const forzada = bisagra && host === (bisagra.tipo === 'pareja' ? 5 : 6);
    const maxPartes = forzada ? Math.max(2, g.W > MAXIMO_SEGUNDA && tamanio === 'C' ? 3 : 2) : g.W > MAXIMO_SEGUNDA && tamanio === 'C' ? 3 : g.W > MAXIMO ? 2 : 1;
    let partes: Parte[] | null = null;
    if (maxPartes > 1) {
      partes = partir(host, suyos, ficha, maxPartes, minimo);
      if (!partes) avisos.push(`"${titulo}" tiene ${miles(g.W)} palabras (más de ${miles(MAXIMO)}) y no se parte: no tiene clave de partición.`);
      else if (partes.length === 1) {
        avisos.push(`"${titulo}" tiene ${miles(g.W)} palabras (más de ${miles(MAXIMO)}) y no se parte: su clave (${partes[0].clave}) no da dos partes de ${miles(minimo)}.`);
        partes = null;
      } else {
        avisos.push(`"${titulo}" (${miles(g.W)} palabras) se parte en ${partes.length}: ${partes.map((p) => p.nombre).join(' / ')}.`);
      }
    }
    if (!partes) {
      capitulos.push(armarCapitulo(host, g.madres, titulo, undefined, suyos));
      continue;
    }
    const clavesViaje = bisagra && forzada ? `${bisagra.tipo}:${bisagra.k}` : null;
    partes.forEach((parte) => {
      capitulos.push(armarCapitulo(host, g.madres, titulo, { clave: parte.clave, nombre: parte.nombre }, parte.items));
      if (clavesViaje && parte.items.some((x) => claveDePartición(host, [], ficha)?.claveDe(x) === clavesViaje) && viaje.length) {
        capitulos.push(armarCapitulo(4, [4], TITULO_VIAJE, undefined, viaje));
        avisos.push(`Bisagra: "El viaje" (${miles(palabras(viaje))} palabras) va entre las partes de "${titulo}".`);
        viaje = [];
      }
    });
  }

  if (viaje.length) {
    // No debería pasar (la bisagra se chequea antes), pero ninguna respuesta se pierde.
    const i = capitulos.findIndex((c) => c.madre > 4);
    capitulos.splice(i < 0 ? capitulos.length : i, 0, armarCapitulo(4, [4], TITULO_VIAJE, undefined, viaje));
    avisos.push('Bisagra: no se encontró dónde insertar "El viaje"; queda después de Salir al mundo.');
  }

  return { capitulos, cierre, flotantes, avisos };
}

function nombreGrupo(madres: number[], host: number, titulo4: string): string {
  if (madres.length === 1) return host === 4 ? titulo4 : TITULOS[host];
  return madres.map((m) => (m === 4 ? titulo4 : TITULOS[m])).join(' + ');
}

function tituloGrupo(madres: number[], host: number, titulo4: string, avisos: string[]): string {
  if (madres.length === 1) return host === 4 ? titulo4 : TITULOS[host];
  const fijo = TITULOS_FUSION[madres.join('+')];
  if (fijo) return fijo.replace('{viaje}', titulo4);
  avisos.push(`Fusión ${madres.join('+')} sin título en la tabla: se usa el del anfitrión ("${TITULOS[host]}").`);
  return host === 4 ? titulo4 : TITULOS[host];
}

function armarCapitulo(madre: number, madres: number[], titulo: string, parte: Capitulo['parte'], items: Item[]): Capitulo {
  const ordenados = [...items].sort((a, b) => a.r.bloque - b.r.bloque || a.orden - b.orden || a.indice - b.indice);
  const W = palabras(items);
  return {
    madre,
    madres,
    titulo,
    ...(parte ? { parte } : {}),
    subtitulo: null,
    respuestaIds: ordenados.map((x) => x.r.id),
    sensibles: ordenados.filter((x) => x.sensible).map((x) => x.r.id),
    palabrasHabladas: W,
    palabrasEscritasObjetivo: Math.round(FACTOR_ESCRITO * W),
  };
}

