// Simula el índice V3 (capítulos madre) sin gastar nada: las seis fichas de
// E2 en los tres tamaños, la viuda con perfil "parco", 200 fichas al azar y,
// si existe, el material real etiquetado de Naza:
//
//   npx tsx scripts/v3-simular.ts
//
// Imprime el reporte en markdown y lo guarda en
// fabrica/prueba-v3-naza/simulacion.md (carpeta ignorada por git: puede tener
// material real).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { armarIndice, type Capitulo, type Indice, type RespuestaV3 } from '../src/v3/indice.js';
import { crearAzar, estadisticas, fichaAlAzar, FICHAS_E2, simular, type Perfil } from '../src/v3/simulador.js';
import type { FichaV3 } from '../src/v3/ficha.js';

const ANIO = 2026;
const SEMILLA = 1;
const FICHAS_AL_AZAR = 200;
const TAMANIOS = ['B', 'E', 'C'] as const;
const NOMBRE_TAMANIO = { B: 'Breve', E: 'Estándar', C: 'Completo' } as const;

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = path.join(FABRICA, 'prueba-v3-naza');
const ETIQUETAS = path.join(CARPETA, 'etiquetas.json');
const SALIDA = path.join(CARPETA, 'simulacion.md');

/**
 * La ficha de Naza. Lo pedido (varón, 1998, Argentina → España en 2021 a los
 * 23, padres vivos, hermanos Ariel y Juan Manuel, pareja actual Ima, sin
 * hijos, estudios sin terminar, música y programación como oficio, fútbol como
 * pasión) más, de su ficha.xml, las parejas anteriores (Vicky, Chiara), los
 * tres oficios y el Liceo Naval: las etiquetas usan sujetos pareja:3 y
 * oficio:1-3 con ese orden.
 */
const FICHA_NAZA: FichaV3 = {
  nombre: 'Naza', apodo: 'Tricky', anioNacimiento: 1998, genero: 'varon', paisNacimiento: 'Argentina', paisResidencia: 'España',
  padres: { madre: { nombre: 'Amelia', vive: true }, padre: { nombre: 'Juan Domingo', vive: true } },
  hermanos: ['Ariel', 'Juan Manuel'],
  parejas: [
    { nombre: 'Vicky', actual: false, fin: 'separacion' },
    { nombre: 'Chiara', actual: false, fin: 'separacion' },
    { nombre: 'Ima', actual: true, fin: null },
  ],
  hijos: 'no-tiene', nietos: 'no-tiene', nietosACargo: 'no-tiene',
  migracion: { de: 'Buenos Aires', a: 'Berga', anio: 2021, edad: 23 },
  campo: 'no-tiene',
  oficios: [{ nombre: 'músico' }, { nombre: 'programador' }, { nombre: 'jardinero' }],
  actividades: [{ nombre: 'música', marca: 'oficio' }, { nombre: 'programación', marca: 'oficio' }, { nombre: 'fútbol', marca: 'pasion' }],
  estudios: { que: 'Abogacía y Arquitectura', terminado: false },
  militar: { descripcion: 'Liceo Naval' },
};

const miles = (n: number) => n.toLocaleString('es-AR');
const nombreCap = (c: Capitulo) => `${c.titulo}${c.parte ? ` / ${c.parte.nombre}` : ''}`;
const listaCaps = (indice: Indice) => indice.capitulos.map((c) => `${nombreCap(c)} (${miles(c.palabrasEscritasObjetivo)})`).join(' · ');

const salida: string[] = [];
const out = (linea = '') => salida.push(linea);

out('# Simulación del índice V3');
out();
out(`Generado por \`scripts/v3-simular.ts\` (sin modelo, sin costo). Año de referencia ${ANIO}, semilla ${SEMILLA}.`);
out('Largos: log-normal con mediana 127 palabras habladas (58 s), p25 ≈ 88, p75 ≈ 185; perfil "parco" con mediana 75; 15 % "paso".');
out('Umbrales: mínimo 1.500 habladas (De dónde vengo 800), partición > 5.000 (segunda > 9.000, solo Completo). Escritas = 0,6 × habladas.');
out('Entre paréntesis, las palabras escritas objetivo de cada capítulo.');
out();

// ---------------------------------------------------------------- fichas de E2
out('## Fichas de E2');
out();
out('| Ficha | Tamaño | Preguntas | Respondidas | Habladas | Capítulos | Índice (escritas objetivo) |');
out('|---|---|---|---|---|---|---|');
const casos: { nombre: string; ficha: FichaV3; perfil: Perfil }[] = [
  ...FICHAS_E2.map((f) => ({ nombre: f.nombre, ficha: f.ficha, perfil: 'normal' as Perfil })),
  { nombre: `${FICHAS_E2[0].nombre} — perfil parco`, ficha: FICHAS_E2[0].ficha, perfil: 'parco' },
];
const avisosE2: string[] = [];
for (const caso of casos) {
  for (const t of TAMANIOS) {
    const s = simular(caso.ficha, t, { semilla: SEMILLA, perfil: caso.perfil, anioActual: ANIO });
    const respondidas = s.respuestas.filter((r) => !r.paso).length;
    out(`| ${caso.nombre} | ${NOMBRE_TAMANIO[t]} | ${s.preguntas} | ${respondidas} | ${miles(s.palabras)} | ${s.indice.capitulos.length} | ${listaCaps(s.indice)} |`);
    for (const a of s.indice.avisos) if (/sin título|no se parte|Bisagra|no hay etapa/.test(a)) avisosE2.push(`${caso.nombre}, ${NOMBRE_TAMANIO[t]}: ${a}`);
  }
}
out();
if (avisosE2.length) {
  out('Avisos que importan (fusiones sin título, capítulos que desbordan sin clave, bisagra, ancla corta):');
  out();
  for (const a of avisosE2) out(`- ${a}`);
  out();
}

// ---------------------------------------------------------------- 200 al azar
out(`## ${FICHAS_AL_AZAR} fichas al azar`);
out();
out('| Tamaño | Perfil | Capítulos promedio | Mín–máx | % capítulos fusionados | % capítulos partidos | Libros con < 4 capítulos | Fusiones sin título |');
out('|---|---|---|---|---|---|---|---|');
const sinTitulo = new Map<string, number>();
for (const t of TAMANIOS) {
  for (const perfil of ['normal', 'parco'] as const) {
    const azar = crearAzar(2026);
    const indices = Array.from({ length: FICHAS_AL_AZAR }, (_x, i) => simular(fichaAlAzar(azar, ANIO), t, { semilla: i + 1, perfil, anioActual: ANIO }).indice);
    for (const a of indices.flatMap((x) => x.avisos)) {
      const m = /Fusión ([\d+]+) sin título/.exec(a);
      if (m) sinTitulo.set(m[1], (sinTitulo.get(m[1]) ?? 0) + 1);
    }
    const e = estadisticas(indices);
    out(`| ${NOMBRE_TAMANIO[t]} | ${perfil} | ${e.capitulosPromedio} | ${e.capitulosMin}–${e.capitulosMax} | ${e.pctFusionados} % | ${e.pctPartidos} % | ${e.menosDe4} de ${e.libros} | ${e.avisosFusionSinTitulo} |`);
  }
}
out();
if (sinTitulo.size) {
  out('Grupos de fusión que no están en la tabla de títulos (usan el título del anfitrión):');
  out();
  for (const [grupo, veces] of [...sinTitulo.entries()].sort((a, b) => b[1] - a[1])) out(`- ${grupo}: ${veces} veces`);
  out();
}

// ---------------------------------------------------------------- sensibilidad al mínimo
out('### Sensibilidad al mínimo (mismas 200 fichas, perfil normal)');
out();
out('Para decidir el umbral con datos: capítulos promedio y libros con < 4 capítulos según el mínimo de palabras habladas.');
out();
out('| Mínimo | Breve: capítulos | Breve: < 4 | Estándar: capítulos | Estándar: < 4 | Completo: capítulos | Completo: < 4 |');
out('|---|---|---|---|---|---|---|');
for (const minimo of [1500, 1200, 1000, 800]) {
  const celdas: string[] = [];
  for (const t of TAMANIOS) {
    const azar = crearAzar(2026);
    const e = estadisticas(Array.from({ length: FICHAS_AL_AZAR }, (_x, i) => simular(fichaAlAzar(azar, ANIO), t, { semilla: i + 1, anioActual: ANIO, minimo }).indice));
    celdas.push(`${e.capitulosPromedio} (${e.capitulosMin}–${e.capitulosMax})`, `${e.menosDe4}`);
  }
  out(`| ${miles(minimo)} | ${celdas.join(' | ')} |`);
}
out();

// ---------------------------------------------------------------- Naza
out('## Naza (material real etiquetado)');
out();
if (!existsSync(ETIQUETAS)) {
  const aviso = `No está ${path.relative(FABRICA, ETIQUETAS)} todavía: se saltea.`;
  console.warn(aviso);
  out(aviso);
} else {
  const crudas = JSON.parse(readFileSync(ETIQUETAS, 'utf8')) as Record<string, unknown>[];
  const respuestas: RespuestaV3[] = crudas.map((x) => ({
    id: String(x.id),
    preguntaId: String(x.preguntaId),
    bloque: Number(x.bloque),
    ...(typeof x.sujeto === 'string' ? { sujeto: x.sujeto } : {}),
    palabras: Number(x.palabras),
    texto: String(x.texto ?? ''),
    paso: x.paso === true,
  }));
  const indice = armarIndice(respuestas, FICHA_NAZA, { tamanio: 'E', anioActual: ANIO });
  const habladas = respuestas.filter((r) => !r.paso).reduce((s, r) => s + r.palabras, 0);
  out(`${respuestas.length} respuestas (${respuestas.filter((r) => r.paso).length} "paso"), ${miles(habladas)} palabras habladas → ${indice.capitulos.length} capítulos, ${miles(Math.round(0.6 * habladas))} escritas.`);
  out();
  out('| # | Capítulo | Madres | Habladas | Escritas objetivo | Respuestas |');
  out('|---|---|---|---|---|---|');
  indice.capitulos.forEach((c, i) => {
    const ids = c.respuestaIds.map((id) => `${id} ${respuestas.find((r) => r.id === id)!.preguntaId}${c.sensibles.includes(id) ? ' (S)' : ''}`).join(', ');
    out(`| ${i + 1} | ${nombreCap(c)} | ${c.madres.join('+')} | ${miles(c.palabrasHabladas)} | ${miles(c.palabrasEscritasObjetivo)} | ${ids} |`);
  });
  out();
  out(`Cierre (legado): ${indice.cierre.join(', ') || '—'}`);
  out();
  out('Flotantes y reubicadas:');
  out();
  for (const f of indice.flotantes) {
    out(`- ${f.respuestaId} ${f.preguntaId} → ${f.madre} (${f.motivo}${f.edad !== undefined ? `, edad ${f.edad}` : ''}${f.expresion ? `, "${f.expresion}"` : ''}${f.sensible ? ', sensible' : ''})`);
  }
  out();
  out('Avisos:');
  out();
  for (const a of indice.avisos) out(`- ${a}`);
  out();
  out('Con otro mínimo (solo para comparar):');
  out();
  for (const minimo of [1000, 800]) {
    const otro = armarIndice(respuestas, FICHA_NAZA, { tamanio: 'E', anioActual: ANIO, minimo });
    out(`- Mínimo ${miles(minimo)}: ${otro.capitulos.length} capítulos — ${listaCaps(otro)}`);
  }
}

const texto = salida.join('\n') + '\n';
mkdirSync(CARPETA, { recursive: true });
writeFileSync(SALIDA, texto, 'utf8');
console.log(texto);
console.log(`Guardado en ${path.relative(FABRICA, SALIDA)}`);
