// Simulador de libros V3 sin modelo: para una ficha y un tamaño genera
// respuestas sintéticas (qué preguntas le llegan sale de seleccion.ts; cuánto
// habla sale de la distribución empírica de E1) y arma el índice. Sirve para
// calibrar los umbrales del índice (mínimo, máximo, fusiones) contra cientos de
// vidas, gratis y con semilla fija (Fable 5, punto 7). Con las agrupaciones
// fijas ya no hay umbrales que calibrar: sirve para ver cuántos capítulos,
// codas y receptores salen por tamaño y perfil.

import { edadActual, lista, type FichaV3, type Hijo, type Oficio, type Pareja } from './ficha.js';
import { preguntasPara, type PreguntaInstanciada } from './seleccion.js';
import { armarIndice, type Indice, type RespuestaV3 } from './indice.js';
import { LEXICO_ETAPA } from './etapa.js';

export type Perfil = 'normal' | 'parco';
export type Azar = () => number;

/** E1 (narrador de 27): mediana 58 s ≈ 127 palabras habladas; p25 ≈ 88, p75 ≈ 185. */
export const MEDIANA_PALABRAS = 127;
/** "Mayor parco" (Fable 5): mediana 35 s ≈ 75 palabras. */
export const MEDIANA_PARCO = 75;
/** Dispersión de la log-normal: ln(185/88) / (2 × 0,6745) ≈ 0,55. */
export const SIGMA_LOG = Math.log(185 / 88) / (2 * 0.6745);
export const PROPORCION_PASO = 0.15;
/** Parte de las flotantes (y crisis, puertas, válvulas) que dicen una edad o una expresión de etapa. */
export const PROPORCION_CON_EDAD = 0.4;

/** mulberry32: azar determinista con semilla. */
export function crearAzar(semilla: number): Azar {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(azar: Azar): number {
  const u = Math.max(azar(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * azar());
}

/** Palabras habladas de una respuesta: log-normal con la mediana del perfil. */
export function largoRespuesta(azar: Azar, perfil: Perfil): number {
  const mediana = perfil === 'parco' ? MEDIANA_PARCO : MEDIANA_PALABRAS;
  return Math.max(5, Math.round(Math.exp(Math.log(mediana) + SIGMA_LOG * normal(azar))));
}

const elegir = <T>(azar: Azar, xs: T[]): T => xs[Math.floor(azar() * xs.length)];

function textoSintetico(p: PreguntaInstanciada, ficha: FichaV3, azar: Azar, anioActual: number): string {
  const partes = [`Respuesta a ${p.preguntaId}`];
  const edad = edadActual(ficha, anioActual);
  const ubicable = p.bloque === 11 || p.bloque === 12 || p.bloque === 13 || p.clase !== 'historia';
  if (ubicable && azar() < PROPORCION_CON_EDAD) {
    if (azar() < 0.5) partes.push(`yo tenía ${3 + Math.floor(azar() * Math.max(1, edad - 3))} años`);
    else partes.push(elegir(azar, LEXICO_ETAPA).expresion);
  }
  const nombres = [...lista(ficha.parejas).map((x) => x.nombre), ...lista(ficha.hijos).map((x) => x.nombre)];
  if (nombres.length && azar() < 0.2) partes.push(`con ${elegir(azar, nombres)}`);
  const oficios = lista(ficha.oficios);
  if (p.bloque === 7 && oficios.length && azar() < 0.6) partes.push(`de ${elegir(azar, oficios).nombre}`);
  const actividades = ficha.actividades ?? [];
  if ((p.preguntaId === 'PA1' || p.preguntaId === 'PA2') && actividades.length) partes.push(elegir(azar, actividades).nombre);
  const pasiones = actividades.filter((a) => a.marca === 'pasion');
  if ((p.bloque === 9 || p.bloque === 10 || p.bloque === 14) && pasiones.length && azar() < 0.3) partes.push(elegir(azar, pasiones).nombre);
  return partes.join('. ') + '.';
}

export type OpcionesSimulacion = { semilla?: number; perfil?: Perfil; anioActual?: number };

/** Una respuesta por pregunta que le llega, con su sujeto; ~15 % "paso". */
export function respuestasSinteticas(ficha: FichaV3, tamanio: 'B' | 'E' | 'C', opciones: OpcionesSimulacion = {}): RespuestaV3[] {
  const anioActual = opciones.anioActual ?? new Date().getFullYear();
  const azar = crearAzar(opciones.semilla ?? 1);
  const perfil = opciones.perfil ?? 'normal';
  return preguntasPara(ficha, tamanio, { anioActual }).map((p, i) => {
    const paso = azar() < PROPORCION_PASO;
    return {
      id: `S${String(i + 1).padStart(3, '0')}`,
      preguntaId: p.preguntaId,
      bloque: p.bloque,
      ...(p.sujeto ? { sujeto: p.sujeto } : {}),
      palabras: paso ? 3 : largoRespuesta(azar, perfil),
      texto: paso ? 'Paso.' : textoSintetico(p, ficha, azar, anioActual),
      paso,
    };
  });
}

export type Simulacion = { preguntas: number; respuestas: RespuestaV3[]; palabras: number; indice: Indice };

export function simular(ficha: FichaV3, tamanio: 'B' | 'E' | 'C', opciones: OpcionesSimulacion = {}): Simulacion {
  const anioActual = opciones.anioActual ?? new Date().getFullYear();
  const respuestas = respuestasSinteticas(ficha, tamanio, opciones);
  const indice = armarIndice(respuestas, ficha, { tamanio, anioActual });
  const palabras = respuestas.filter((r) => !r.paso).reduce((s, r) => s + r.palabras, 0);
  return { preguntas: respuestas.length, respuestas, palabras, indice };
}

export type Estadisticas = {
  libros: number;
  capitulosPromedio: number; // capítulos numerados (la coda no cuenta; cada parte cuenta)
  capitulosMin: number;
  capitulosMax: number;
  pctConCoda: number; // libros con coda
  pctConReceptor: number; // libros donde algún capítulo no llegó al piso y fue a su receptor (Lo que costó repartido incluido)
  pctConCorto: number; // libros con algún capítulo corto (Amor corto o receptor que ya no estaba)
  pctPartidos: number; // capítulos que son una parte de una partición / capítulos
  pctMigranteJoven: number; // libros en modo migrante joven
  menosDe4: number; // libros con menos de 4 capítulos
  avisosSinTitulo: number; // combinaciones de receptor sin título en la tabla (tiene que ser 0)
};

export function estadisticas(indices: Indice[]): Estadisticas {
  const caps = indices.map((i) => i.capitulos.length);
  const todos = indices.flatMap((i) => i.capitulos);
  const pct = (n: number, de: number) => (de ? Math.round((1000 * n) / de) / 10 : 0);
  const libros = indices.length;
  return {
    libros,
    capitulosPromedio: Math.round((10 * caps.reduce((s, x) => s + x, 0)) / Math.max(1, caps.length)) / 10,
    capitulosMin: Math.min(...caps),
    capitulosMax: Math.max(...caps),
    pctConCoda: pct(indices.filter((i) => i.coda).length, libros),
    pctConReceptor: pct(indices.filter((i) => i.saltos.length > 0).length, libros),
    pctConCorto: pct(indices.filter((i) => i.capitulos.some((c) => c.corto)).length, libros),
    pctPartidos: pct(todos.filter((c) => c.parte).length, todos.length),
    pctMigranteJoven: pct(indices.filter((i) => i.migranteJoven).length, libros),
    menosDe4: caps.filter((n) => n < 4).length,
    avisosSinTitulo: indices.flatMap((i) => i.avisos).filter((a) => /sin tabla/.test(a)).length,
  };
}

// ---------------------------------------------------------------- fichas

/** Las seis fichas de E2 (docs/v3/diseno-v3.md §8), completadas con supuestos razonables donde E2 no decía nada. */
export const FICHAS_E2: { clave: string; nombre: string; ficha: FichaV3 }[] = [
  {
    clave: 'viuda',
    nombre: 'Viuda de Rosario, 82, modista, 3 hijos y 6 nietos',
    ficha: {
      nombre: 'Elena', apodo: 'Chela', anioNacimiento: 1944, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina',
      padres: { madre: { nombre: 'Rosa', vive: false }, padre: { nombre: 'Aldo', vive: false } },
      hermanos: ['Nelly', 'Tito'],
      parejas: [{ nombre: 'Ricardo', actual: false, fin: 'fallecio', anioInicio: 1962, anioFin: 2015 }],
      hijos: [{ nombre: 'Marcelo', anio: 1965 }, { nombre: 'Silvia', anio: 1968 }, { nombre: 'Gustavo', anio: 1972 }],
      nietos: ['Juli', 'Tomás', 'Sofi', 'Nico', 'Mica', 'Lauti'], nietosACargo: 'no-tiene',
      migracion: 'no-tiene', campo: 'no-tiene', oficios: [{ nombre: 'modista' }], dejoDeTrabajar: true,
      actividades: [{ nombre: 'costura', marca: 'oficio' }],
      estudios: 'no-tiene', militar: 'no-tiene', religion: 'católica', personaImportante: 'no-tiene', enfermedadLarga: 'no-tiene',
    },
  },
  {
    clave: 'gallego',
    nombre: 'Gallego, 71, a Buenos Aires a los 19 (1974), dos parejas, 2 hijos, bar',
    ficha: {
      nombre: 'Manuel', apodo: 'Manolo', anioNacimiento: 1955, genero: 'varon', paisNacimiento: 'España', paisResidencia: 'Argentina',
      padres: { madre: { nombre: 'Carmen', vive: false }, padre: { nombre: 'José', vive: false } },
      hermanos: ['Pilar', 'Ramón'],
      parejas: [
        { nombre: 'Marta', actual: false, fin: 'separacion', anioInicio: 1978, anioFin: 1990 },
        { nombre: 'Norma', actual: true, fin: null, anioInicio: 1993 },
      ],
      hijos: [{ nombre: 'Pablo', anio: 1980 }, { nombre: 'Lucía', anio: 1995 }], nietos: 'no-tiene', nietosACargo: 'no-tiene',
      migracion: { de: 'Galicia', a: 'Buenos Aires', anio: 1974 }, campo: true,
      oficios: [{ nombre: 'mozo', desde: 1974 }, { nombre: 'dueño del bar', desde: 1986 }], dejoDeTrabajar: false,
      actividades: [{ nombre: 'fútbol', marca: 'pasion' }],
      estudios: 'no-tiene', militar: 'no-tiene', religion: 'católica', personaImportante: 'no-tiene', enfermedadLarga: 'no-tiene',
    },
  },
  {
    clave: 'maestra',
    nombre: 'Maestra soltera de Madrid, 66, sin hijos, 2 hermanos',
    ficha: {
      nombre: 'Pilar', anioNacimiento: 1960, genero: 'mujer', paisNacimiento: 'España', paisResidencia: 'España',
      padres: { madre: { nombre: 'Encarna', vive: false }, padre: { nombre: 'Luis', vive: false } },
      hermanos: ['Javier', 'Maite'], parejas: 'no-tiene', hijos: 'no-tiene', nietos: 'no-tiene', nietosACargo: 'no-tiene',
      migracion: 'no-tiene', campo: 'no-tiene', oficios: [{ nombre: 'maestra' }], dejoDeTrabajar: true,
      actividades: [{ nombre: 'lectura', marca: 'pasion' }],
      estudios: { que: 'Magisterio', terminado: true }, militar: 'no-tiene', religion: 'no-tiene', personaImportante: 'no-tiene', enfermedadLarga: 'no-tiene',
    },
  },
  {
    clave: 'taxista',
    nombre: 'Taxista, 68, hijo único, separado, 1 hijo',
    ficha: {
      nombre: 'Roberto', apodo: 'Beto', anioNacimiento: 1958, genero: 'varon', paisNacimiento: 'Argentina', paisResidencia: 'Argentina',
      padres: { madre: { nombre: 'Irma', vive: false }, padre: { nombre: 'Héctor', vive: false } },
      hermanos: 'no-tiene', parejas: [{ nombre: 'Susana', actual: false, fin: 'separacion' }],
      hijos: [{ nombre: 'Diego', anio: 1985 }], nietos: 'no-tiene', nietosACargo: 'no-tiene',
      migracion: 'no-tiene', campo: 'no-tiene', oficios: [{ nombre: 'taxista' }], dejoDeTrabajar: false,
      actividades: [{ nombre: 'fútbol', marca: 'pasion' }],
      estudios: 'no-tiene', militar: { descripcion: 'la colimba' }, religion: 'no-tiene', personaImportante: 'no-tiene', enfermedadLarga: 'no-tiene',
    },
  },
  {
    clave: 'minima',
    nombre: 'Mujer de 75, solo los campos obligatorios',
    ficha: { nombre: 'Marta', anioNacimiento: 1951, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina' },
  },
  {
    clave: 'joven',
    nombre: 'Varón de 29, a Barcelona en 2021, sin pareja ni hijos, estudios sin terminar, café',
    ficha: {
      nombre: 'Tomás', apodo: 'Tomi', anioNacimiento: 1997, genero: 'varon', paisNacimiento: 'Argentina', paisResidencia: 'España',
      padres: { madre: { nombre: 'Laura', vive: true }, padre: { nombre: 'Jorge', vive: true } },
      hermanos: ['Lucía'], parejas: 'no-tiene', hijos: 'no-tiene', nietos: 'no-tiene', nietosACargo: 'no-tiene',
      migracion: { de: 'Buenos Aires', a: 'Barcelona', anio: 2021 }, campo: 'no-tiene',
      oficios: [{ nombre: 'barista' }], actividades: [{ nombre: 'fútbol', marca: 'pasion' }],
      estudios: { que: 'Ingeniería', terminado: false }, militar: 'no-tiene', religion: 'no-tiene', personaImportante: 'no-tiene', enfermedadLarga: 'no-tiene',
    },
  },
];

const NOMBRES_F = ['Ana', 'Marta', 'Rosa', 'Elsa', 'Silvia', 'Lucía', 'Carmen', 'Norma', 'Susana', 'Laura', 'Pilar', 'Inés'];
const NOMBRES_M = ['Juan', 'Pedro', 'Carlos', 'Jorge', 'Luis', 'Pablo', 'Diego', 'Raúl', 'Héctor', 'Tito', 'Ramón', 'Mario'];
const OFICIOS = ['albañil', 'maestra', 'enfermera', 'mecánico', 'modista', 'panadero', 'taxista', 'contador', 'peluquera', 'carpintero', 'vendedor', 'bancario'];
const ACTIVIDADES = ['fútbol', 'huerta', 'pesca', 'tejido', 'música', 'baile', 'ajedrez', 'cocina'];

/** Una ficha verosímil al azar (edad 25-95, con todos los campos resueltos para ver el banco entero). */
export function fichaAlAzar(azar: Azar, anioActual: number): FichaV3 {
  const edad = 25 + Math.floor(azar() * 71);
  const anioNacimiento = anioActual - edad;
  const genero = azar() < 0.5 ? 'mujer' : 'varon';
  const nombre = () => elegir(azar, azar() < 0.5 ? NOMBRES_F : NOMBRES_M);
  const varios = (max: number) => Array.from({ length: 1 + Math.floor(azar() * max) }, nombre);
  const vive = (p: number) => azar() < p;
  const pVive = edad < 50 ? 0.9 : edad < 70 ? 0.5 : 0.1;

  const nParejas = azar() < 0.2 ? 0 : azar() < 0.75 ? 1 : 2;
  const parejas: Pareja[] = Array.from({ length: nParejas }, (_x, i) => {
    const ultima = i === nParejas - 1;
    const fin = !ultima ? 'separacion' : azar() < 0.65 ? null : edad > 60 && azar() < 0.6 ? 'fallecio' : 'separacion';
    const conAnios = azar() < 0.5;
    const inicio = anioNacimiento + 20 + i * 12 + Math.floor(azar() * 8);
    return { nombre: nombre(), actual: fin === null, fin, ...(conAnios ? { anioInicio: Math.min(inicio, anioActual) } : {}) };
  });

  const nHijos = edad < 30 ? (azar() < 0.8 ? 0 : 1) : azar() < 0.2 ? 0 : 1 + Math.floor(azar() * (azar() < 0.1 ? 6 : 4));
  const hijos: Hijo[] = Array.from({ length: nHijos }, (_x, i) => ({
    nombre: nombre(), anio: anioNacimiento + 22 + i * 3 + Math.floor(azar() * 3), ...(azar() < 0.03 ? { fallecio: true } : {}),
  }));
  const nietos = nHijos && edad > 55 && azar() < 0.75 ? varios(6) : [];

  const nOficios = azar() < 0.05 ? 0 : 1 + Math.floor(azar() * 3);
  const oficios: Oficio[] = Array.from({ length: nOficios }, (_x, i) => ({
    nombre: elegir(azar, OFICIOS), ...(azar() < 0.5 ? { desde: anioNacimiento + 16 + i * 10 } : {}), ...(azar() < 0.08 ? { casa: true } : {}),
  }));
  const migra = azar() < 0.2;
  const edadMig = 17 + Math.floor(azar() * 35);
  const actividades = Array.from({ length: Math.floor(azar() * 3) }, () => ({
    nombre: elegir(azar, ACTIVIDADES), marca: (azar() < 0.15 ? 'oficio' : 'pasion') as 'oficio' | 'pasion',
  }));

  return {
    nombre: nombre(), ...(azar() < 0.5 ? { apodo: nombre() } : {}), anioNacimiento, genero,
    paisNacimiento: azar() < 0.7 ? 'Argentina' : 'España', paisResidencia: 'Argentina',
    padres: { madre: { nombre: elegir(azar, NOMBRES_F), vive: vive(pVive) }, padre: { nombre: elegir(azar, NOMBRES_M), vive: vive(pVive * 0.8) } },
    hermanos: azar() < 0.15 ? 'no-tiene' : varios(5),
    parejas: nParejas ? parejas : 'no-tiene',
    hijos: nHijos ? hijos : 'no-tiene',
    nietos: nietos.length ? nietos : 'no-tiene',
    nietosACargo: nietos.length && azar() < 0.05 ? [nietos[0]] : 'no-tiene',
    migracion: migra ? { de: 'su pueblo', a: 'la ciudad', ...(edadMig <= edad ? { edad: edadMig } : {}) } : 'no-tiene',
    campo: azar() < 0.15,
    oficios: nOficios ? oficios : 'no-tiene',
    dejoDeTrabajar: edad > 62,
    actividades,
    estudios: azar() < 0.4 ? 'no-tiene' : { terminado: azar() < 0.7 },
    militar: azar() < 0.25 ? { descripcion: 'la colimba' } : 'no-tiene',
    religion: azar() < 0.4 ? 'católica' : 'no-tiene',
    personaImportante: azar() < 0.1 ? { nombre: nombre() } : 'no-tiene',
    enfermedadLarga: azar() < 0.1 ? {} : 'no-tiene',
    ...(azar() < 0.05 ? { noTocar: { bloques: [11] } } : {}),
  };
}
