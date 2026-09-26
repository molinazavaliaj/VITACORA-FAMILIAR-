// A qué etapa de la vida pertenece una respuesta, leyendo solo el texto y la
// ficha, sin modelo. Lo usa el índice para ubicar las flotantes (bloques 12 y
// 13) y las crisis de chico (bloque 11). Tres señales, en este orden:
//
//   1. Edad dicha con sujeto propio ("yo tenía 8", "a mis 17", "a los 15
//      años" sin parentesco detrás) o un año de cuatro cifras (→ edad con el
//      año de nacimiento). Fable 5, crítica 1d.
//   2. Léxico fijo de etapa ("de chica", "en la colimba", "cuando nació
//      {{hijo}}"…). Fable 5, crítica 1c.
//   3. Una persona o un oficio de la ficha nombrados (lo usa el índice cuando
//      no hay edad, o cuando la edad es de adulto).

import { lista, valor, type FichaV3 } from './ficha.js';

/** Minúsculas y sin tildes: el texto de la transcripción viene con o sin tildes según el STT. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------- números

const UNIDADES: Record<string, number> = {
  un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
};
const DECENAS: Record<string, number> = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };

/** "ocho" → 8, "treinta y dos" → 32, "17" → 17. Null si no es un número de 0 a 99. */
export function numeroEnPalabras(texto: string): number | null {
  const t = normalizar(texto.trim());
  if (/^\d{1,2}$/.test(t)) return Number(t);
  if (t in UNIDADES) return UNIDADES[t];
  if (t in DECENAS) return DECENAS[t];
  const compuesto = /^(\w+) y (\w+)$/.exec(t);
  if (compuesto && compuesto[1] in DECENAS && compuesto[2] in UNIDADES && UNIDADES[compuesto[2]] < 10) {
    return DECENAS[compuesto[1]] + UNIDADES[compuesto[2]];
  }
  return null;
}

const NUMERO =
  '(\\d{1,2}|(?:treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)(?: y (?:un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve))?|' +
  Object.keys(UNIDADES).sort((a, b) => b.length - a.length).join('|') + ')';

const PARENTESCO = new Set([
  'hijo', 'hija', 'hijos', 'hijas', 'hermano', 'hermana', 'hermanos', 'nieto', 'nieta', 'nietos', 'mama', 'papa', 'madre', 'padre',
  'viejo', 'vieja', 'marido', 'mujer', 'esposo', 'esposa', 'novio', 'novia', 'abuelo', 'abuela', 'tio', 'tia', 'primo', 'prima',
  'sobrino', 'sobrina', 'suegro', 'suegra', 'cunado', 'cunada', 'chicos', 'nene', 'nena',
]);
const DURACION = new Set(['minutos', 'minuto', 'horas', 'hora', 'dias', 'dia', 'semanas', 'semana', 'meses', 'mes']);

export type EdadDicha = { edad: number; motivo: 'edad-numero'; expresion: string };

/**
 * Edad del narrador dicha en el texto. Primero las formas con sujeto propio
 * (la primera que aparezca); si no hay, el primer año de cuatro cifras que
 * caiga dentro de su vida.
 */
export function edadDicha(texto: string, ficha: Pick<FichaV3, 'anioNacimiento'>, anioActual: number): EdadDicha | null {
  const t = normalizar(texto);
  // Solo "a los N" puede ser la edad de otro ("a los 17 de mi hija"): el
  // chequeo de parentesco y de duración va solo ahí. "Yo tenía 8 años y mi
  // papá…" es del narrador aunque después venga un pariente.
  const patrones: [RegExp, boolean][] = [
    [new RegExp(`\\byo tenia ${NUMERO}\\b`, 'g'), false],
    [new RegExp(`\\btenia yo ${NUMERO}\\b`, 'g'), false],
    [new RegExp(`\\bcuando tenia ${NUMERO}\\b`, 'g'), false],
    [new RegExp(`\\ba mis ${NUMERO}\\b`, 'g'), false],
    [new RegExp(`\\ba los ${NUMERO}\\b`, 'g'), true],
  ];
  const candidatos: { pos: number; edad: number; expresion: string }[] = [];
  for (const [re, ambiguo] of patrones) {
    for (const m of t.matchAll(re)) {
      const edad = numeroEnPalabras(m[1]);
      if (edad === null) continue;
      if (!ambiguo) {
        candidatos.push({ pos: m.index!, edad, expresion: m[0] });
        continue;
      }
      const despues = t.slice(m.index! + m[0].length).split(/[^a-zñ0-9]+/).filter(Boolean);
      if (DURACION.has(despues[0])) continue; // "a los 5 minutos"
      if (/^anos?$/.test(despues[0] ?? '') && despues[1] === 'de') continue; // "a los dos años de casados"
      const siguientes = (/^anos?$/.test(despues[0] ?? '') ? despues.slice(1, 4) : despues.slice(0, 3));
      if (siguientes.some((p) => PARENTESCO.has(p))) continue; // "a los 17 de mi hija"
      candidatos.push({ pos: m.index!, edad, expresion: m[0] });
    }
  }
  if (candidatos.length) {
    const primero = candidatos.sort((a, b) => a.pos - b.pos)[0];
    return { edad: primero.edad, motivo: 'edad-numero', expresion: primero.expresion };
  }
  for (const m of t.matchAll(/\b(19\d\d|20\d\d)\b/g)) {
    const edad = Number(m[1]) - ficha.anioNacimiento;
    if (edad >= 0 && edad <= anioActual - ficha.anioNacimiento) return { edad, motivo: 'edad-numero', expresion: m[0] };
  }
  return null;
}

/** Edad → capítulo madre de etapa: 0-12 → 2, 13-18 → 3, 19-25 → 4; de 26 en adelante no hay etapa (null). */
export function madrePorEdad(edad: number): number | null {
  if (edad <= 12) return 2;
  if (edad <= 18) return 3;
  if (edad <= 25) return 4;
  return null;
}

// ---------------------------------------------------------------- léxico

/**
 * Léxico fijo de etapa (en minúsculas y sin tildes). Se audita a mano: si
 * una expresión manda respuestas al lugar equivocado, se saca de acá.
 */
export const LEXICO_ETAPA: { expresion: string; madre: number }[] = [
  // Los primeros años
  ...['de chico', 'de chica', 'de chiquito', 'de chiquita', 'de nene', 'de nena', 'de nino', 'de nina', 'de pequeno', 'de pequena',
    'cuando era chico', 'cuando era chica', 'cuando era chiquito', 'cuando era chiquita', 'cuando era nene', 'cuando era nena',
    'cuando era nino', 'cuando era nina', 'cuando era pequeno', 'cuando era pequena', 'en la primaria', 'en la escuela primaria',
    'en el jardin', 'en primer grado'].map((expresion) => ({ expresion, madre: 2 })),
  // Adolescencia
  ...['de adolescente', 'en el secundario', 'en la secundaria', 'en el liceo', 'en el instituto', 'en el bachillerato',
    'de pibe', 'de piba', 'a los quince', 'de jovencito', 'de jovencita', 'cuando cumpli quince', 'en mis quince']
    .map((expresion) => ({ expresion, madre: 3 })),
  // Salir al mundo
  ...['de soltero', 'de soltera', 'en la colimba', 'en la mili', 'en el servicio militar', 'en la facultad', 'en la facu',
    'en la universidad', 'de estudiante', 'cuando me fui de casa', 'cuando me fui de la casa', 'de joven']
    .map((expresion) => ({ expresion, madre: 4 })),
  // Amor
  ...['de recien casados', 'cuando me case', 'cuando nos casamos', 'cuando enviude'].map((expresion) => ({ expresion, madre: 5 })),
  // Hijos
  ...['cuando nacieron los chicos', 'cuando nacio mi hijo', 'cuando nacio mi hija', 'cuando nacio el mayor', 'cuando nacio la mayor',
    'cuando los chicos eran chicos', 'cuando quede embarazada'].map((expresion) => ({ expresion, madre: 7 })),
];

export type EtapaLexico = { madre: number; motivo: 'lexico'; expresion: string };

/** Expresiones que dependen de la ficha: "cuando nació {{hijo}}", "en la época de {{oficio}}", "cuando murió {{pareja}}". */
function lexicoDeLaFicha(ficha: FichaV3): { expresion: string; madre: number }[] {
  const salida: { expresion: string; madre: number }[] = [];
  for (const h of lista(ficha.hijos)) {
    const n = normalizar(h.nombre);
    salida.push({ expresion: `cuando nacio ${n}`, madre: 7 }, { expresion: `cuando nacio el ${n}`, madre: 7 }, { expresion: `cuando nacio la ${n}`, madre: 7 });
  }
  for (const o of lista(ficha.oficios)) {
    const n = normalizar(o.nombre);
    salida.push({ expresion: `en la epoca de ${n}`, madre: 6 }, { expresion: `en la epoca del ${n}`, madre: 6 }, { expresion: `cuando trabajaba de ${n}`, madre: 6 });
  }
  for (const p of lista(ficha.parejas)) {
    const n = normalizar(p.nombre);
    salida.push({ expresion: `cuando murio ${n}`, madre: 5 }, { expresion: `cuando murio el ${n}`, madre: 5 }, { expresion: `cuando se murio ${n}`, madre: 5 });
  }
  const migracion = valor(ficha.migracion);
  if (migracion?.a) salida.push({ expresion: `cuando llegue a ${normalizar(migracion.a)}`, madre: 4 });
  return salida;
}

/** La primera expresión del léxico (fijo + ficha) que aparece en el texto. */
export function etapaPorLexico(texto: string, ficha: FichaV3): EtapaLexico | null {
  const t = normalizar(texto);
  let mejor: { pos: number; expresion: string; madre: number } | null = null;
  for (const e of [...LEXICO_ETAPA, ...lexicoDeLaFicha(ficha)]) {
    const m = new RegExp(`\\b${escapar(e.expresion)}\\b`).exec(t);
    if (m && (!mejor || m.index < mejor.pos)) mejor = { pos: m.index, ...e };
  }
  return mejor ? { madre: mejor.madre, motivo: 'lexico', expresion: mejor.expresion } : null;
}

// ---------------------------------------------------------------- personas y actividades

/** Raíz de una actividad u oficio para buscarla: primera palabra de 4+ letras, sus primeras 5 letras. */
function raiz(nombre: string): string {
  const palabras = normalizar(nombre).split(/[^a-zñ]+/).filter((p) => p.length >= 4);
  const p = palabras[0] ?? normalizar(nombre);
  return p.slice(0, 5);
}

/** ¿El texto nombra esa actividad? Por raíz: "música" encuentra "músico"; "programación", "programador". */
export function mencionaActividad(texto: string, actividad: string): boolean {
  return new RegExp(`\\b${escapar(raiz(actividad))}`).test(normalizar(texto));
}

/**
 * Capítulo de la primera persona u oficio de la ficha que nombra el texto:
 * pareja o persona importante → 5 (Amor), hijo o nieto → 7, oficio → 6. Los
 * nombres propios se buscan con su mayúscula (así "Ana" no aparece en "semana").
 */
export function personaNombrada(texto: string, ficha: FichaV3): number | null {
  const conMayus = sinTildes(texto);
  const candidatos: { nombre: string; madre: number }[] = [
    ...lista(ficha.parejas).map((p) => ({ nombre: p.nombre, madre: 5 })),
    ...(valor(ficha.personaImportante) ? [{ nombre: valor(ficha.personaImportante)!.nombre, madre: 5 }] : []),
    ...lista(ficha.hijos).map((h) => ({ nombre: h.nombre, madre: 7 })),
    ...lista(ficha.nietos).map((nombre) => ({ nombre, madre: 7 })),
  ];
  let mejor: { pos: number; madre: number } | null = null;
  for (const c of candidatos) {
    const m = new RegExp(`\\b${escapar(sinTildes(c.nombre))}\\b`).exec(conMayus);
    if (m && (!mejor || m.index < mejor.pos)) mejor = { pos: m.index, madre: c.madre };
  }
  if (mejor) return mejor.madre;
  if (lista(ficha.oficios).some((o) => mencionaActividad(texto, o.nombre))) return 6;
  return null;
}
