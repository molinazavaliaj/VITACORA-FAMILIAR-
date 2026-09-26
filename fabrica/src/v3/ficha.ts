// La ficha V3 (docs/v3/diseno-v3.md §4): la carga quien regala. Los campos
// opcionales tienen tres estados: lleno (resuelve el gate), 'no-tiene'
// (resuelve en negativo y habilita las "sin": hijo único, sin pareja, sin
// hijos) y 'no-sabe' o vacío (dispara la pregunta de datos al abrir el bloque).

export type NoTiene = 'no-tiene';
export type NoSabe = 'no-sabe';
export type Opcional<T> = T | NoTiene | NoSabe | undefined;
export type EstadoCampo = 'lleno' | 'no-tiene' | 'no-sabe';

export type Genero = 'varon' | 'mujer' | 'otro';

export type Pareja = {
  nombre: string;
  actual: boolean;
  fin: 'separacion' | 'fallecio' | null;
  anioInicio?: number;
  anioFin?: number;
};

export type Hijo = { nombre: string; anio?: number; fallecio?: boolean };

export type Oficio = { nombre: string; desde?: number; casa?: boolean };

export type Actividad = { nombre: string; marca: 'oficio' | 'pasion' };

export type Persona = { nombre?: string; vive?: boolean };

export type FichaV3 = {
  // Obligatorios
  nombre: string;
  anioNacimiento: number;
  genero: Genero;
  paisNacimiento: string;
  paisResidencia: string;
  // Obligatorios en el diseño pero opcionales acá (el simulador los rellena)
  apodo?: string;
  formaTrato?: 'masculino' | 'femenino'; // si género = otro: cómo prefiere que le hablen
  destinatarios?: string;
  // Opcionales con tres estados
  padres?: Opcional<{ madre?: Persona; padre?: Persona }>;
  hermanos?: Opcional<string[]>;
  parejas?: Opcional<Pareja[]>;
  hijos?: Opcional<Hijo[]>;
  nietos?: Opcional<string[]>;
  nietosACargo?: Opcional<string[]>;
  ciudadInfancia?: string;
  migracion?: Opcional<{ de: string; a: string; anio?: number; edad?: number }>;
  campo?: Opcional<boolean>;
  oficios?: Opcional<Oficio[]>;
  dejoDeTrabajar?: Opcional<boolean>;
  actividades?: Actividad[]; // del dashboard: [Mi oficio] [Mi pasión]
  estudios?: Opcional<{ que?: string; terminado: boolean | 'sigue' }>;
  militar?: Opcional<{ descripcion?: string }>;
  religion?: Opcional<string>;
  // Solo por ficha, sin botón
  personaImportante?: Opcional<{ nombre: string; descripcion?: string }>;
  enfermedadLarga?: Opcional<{ nombre?: string }>;
  noTocar?: { preguntas?: string[]; bloques?: number[]; texto?: string };
};

/** Estado de un campo opcional. Una lista vacía cuenta como vacío (no-sabe); `false` como no-tiene. */
export function estado(valor: unknown): EstadoCampo {
  if (valor === 'no-tiene' || valor === false) return 'no-tiene';
  if (valor === 'no-sabe' || valor === undefined || valor === null) return 'no-sabe';
  if (Array.isArray(valor) && valor.length === 0) return 'no-sabe';
  return 'lleno';
}

/** El contenido de un campo-lista si está lleno; si no, []. */
export function lista<T>(valor: Opcional<T[]>): T[] {
  return Array.isArray(valor) ? valor : [];
}

/** El contenido de un campo-objeto si está lleno; si no, null. */
export function valor<T extends object>(v: Opcional<T>): T | null {
  return typeof v === 'object' && v !== null ? v : null;
}

export function edadActual(ficha: Pick<FichaV3, 'anioNacimiento'>, anioActual: number): number {
  return anioActual - ficha.anioNacimiento;
}

export function anioMigracion(ficha: FichaV3): number | null {
  const m = valor(ficha.migracion);
  if (!m) return null;
  if (typeof m.anio === 'number') return m.anio;
  if (typeof m.edad === 'number') return ficha.anioNacimiento + m.edad;
  return null;
}

export function edadMigracion(ficha: FichaV3): number | null {
  const anio = anioMigracion(ficha);
  return anio === null ? null : anio - ficha.anioNacimiento;
}
