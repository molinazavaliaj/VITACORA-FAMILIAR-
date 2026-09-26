// Simula el índice V3 (agrupaciones fijas por tamaño) sin gastar nada: las
// seis fichas de E2 en los tres tamaños, la viuda con perfil "parco", 200
// fichas al azar y, si existe, el material real etiquetado de Naza:
//
//   npx tsx scripts/v3-simular.ts
//
// Imprime el reporte en markdown y lo guarda en
// fabrica/prueba-v3-naza/simulacion.md (carpeta ignorada por git: puede tener
// material real).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { armarIndice, FACTOR_ESCRITO, escritas, type Capitulo, type Indice, type RespuestaV3, type Tamanio } from '../src/v3/indice.js';
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
 * oficio:1-3 con ese orden. Los oficios no traen años (la ficha nueva los
 * pide): la señal "oficio posterior a la migración" no se puede usar.
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
const nombreCap = (c: Capitulo) => `${c.titulo}${c.parte ? ` / ${c.parte.nombre}` : ''}${c.corto ? ' (corto)' : ''}`;
const listaCaps = (indice: Indice) =>
  indice.capitulos.map((c, i) => `${i + 1}. ${nombreCap(c)} (${miles(c.palabrasEscritasObjetivo)})`).join(' · ') +
  (indice.coda ? ` · coda: Hoy (${miles(indice.coda.palabrasEscritasObjetivo)})` : '');
const celdaIndice = (indice: Indice) =>
  indice.capitulos.map((c, i) => `${i + 1}. ${nombreCap(c)} (${miles(c.palabrasEscritasObjetivo)})`).join('<br>') +
  (indice.coda ? `<br>coda: Hoy (${miles(indice.coda.palabrasEscritasObjetivo)})` : '');

const salida: string[] = [];
const out = (linea = '') => salida.push(linea);

out('# Simulación del índice V3 — agrupaciones fijas por tamaño');
out();
out(`Generado por \`scripts/v3-simular.ts\` (sin modelo, sin costo). Año de referencia ${ANIO}, semilla ${SEMILLA}.`);
out('Largos: log-normal con mediana 127 palabras habladas (58 s), p25 ≈ 88, p75 ≈ 185; perfil "parco" con mediana 75; 15 % "paso".');
out(`Escritas = ${String(FACTOR_ESCRITO).replace('.', ',')} × habladas (cociente real medido). Pisos en escritas: los de la tabla de Fable (Breve 500/400, Estándar 700, Amor 500, Hoy 600, Completo 900/700/600). Particiones solo en Completo, desde 3.000 escritas.`);
out('Entre paréntesis, las palabras escritas objetivo de cada capítulo. "(corto)": existe bajo su piso (Amor entre 250 y 500, o su receptor ya no estaba). "coda": Hoy bajo su piso, sin número.');
out();

// ---------------------------------------------------------------- 200 al azar
out(`## ${FICHAS_AL_AZAR} fichas al azar`);
out();
out('| Tamaño | Perfil | Capítulos promedio | Mín–máx | % con coda | % con receptores usados | % con capítulo corto | % partes | % migrante joven | Libros con < 4 | Combinaciones sin título |');
out('|---|---|---|---|---|---|---|---|---|---|---|');
for (const t of TAMANIOS) {
  for (const perfil of ['normal', 'parco'] as const) {
    const azar = crearAzar(2026);
    const indices = Array.from({ length: FICHAS_AL_AZAR }, (_x, i) => simular(fichaAlAzar(azar, ANIO), t, { semilla: i + 1, perfil, anioActual: ANIO }).indice);
    const e = estadisticas(indices);
    out(`| ${NOMBRE_TAMANIO[t]} | ${perfil} | ${String(e.capitulosPromedio).replace('.', ',')} | ${e.capitulosMin}–${e.capitulosMax} | ${e.pctConCoda} % | ${e.pctConReceptor} % | ${e.pctConCorto} % | ${e.pctPartidos} % | ${e.pctMigranteJoven} % | ${e.menosDe4} | ${e.avisosSinTitulo} |`);
  }
}
out();
out('"Receptores usados": algún capítulo no llegó a su piso y fue entero a su receptor (o, en Completo, Lo que costó se repartió). "Partes": capítulos que son una parte de una partición, sobre el total de capítulos.');
out();

// Cuántas veces cae cada capítulo bajo su piso (para ver qué receptor trabaja más).
out('### Qué capítulos caen bajo el piso (perfil normal, 200 fichas)');
out();
out('| Tamaño | Capítulo → receptor (veces) |');
out('|---|---|');
for (const t of TAMANIOS) {
  const azar = crearAzar(2026);
  const cuenta = new Map<string, number>();
  for (let i = 0; i < FICHAS_AL_AZAR; i++) {
    const indice = simular(fichaAlAzar(azar, ANIO), t, { semilla: i + 1, anioActual: ANIO }).indice;
    const pares = new Set(indice.saltos.map((s) => `${s.de} → ${s.a}`));
    for (const p of pares) cuenta.set(p, (cuenta.get(p) ?? 0) + 1);
    if (indice.coda) cuenta.set(`${indice.coda.clave} → coda`, (cuenta.get(`${indice.coda.clave} → coda`) ?? 0) + 1);
    for (const c of indice.capitulos.filter((x) => x.corto)) cuenta.set(`${c.clave} corto`, (cuenta.get(`${c.clave} corto`) ?? 0) + 1);
  }
  out(`| ${NOMBRE_TAMANIO[t]} | ${[...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} (${v})`).join(', ')} |`);
}
out();

// ---------------------------------------------------------------- fichas de E2
out('## Fichas de E2 (respuestas sintéticas, semilla 1)');
out();
out('| Ficha | Tamaño | Preguntas | Respondidas | Habladas | Escritas | Capítulos | Índice (escritas objetivo) |');
out('|---|---|---|---|---|---|---|---|');
const casos: { nombre: string; ficha: FichaV3; perfil: Perfil }[] = [
  ...FICHAS_E2.map((f) => ({ nombre: f.nombre, ficha: f.ficha, perfil: 'normal' as Perfil })),
  { nombre: `${FICHAS_E2[0].nombre} — perfil parco`, ficha: FICHAS_E2[0].ficha, perfil: 'parco' },
];
const avisosE2: string[] = [];
for (const caso of casos) {
  for (const t of TAMANIOS) {
    const s = simular(caso.ficha, t, { semilla: SEMILLA, perfil: caso.perfil, anioActual: ANIO });
    const respondidas = s.respuestas.filter((r) => !r.paso).length;
    out(`| ${caso.nombre} | ${NOMBRE_TAMANIO[t]} | ${s.preguntas} | ${respondidas} | ${miles(s.palabras)} | ${miles(escritas(s.palabras))} | ${s.indice.capitulos.length}${s.indice.coda ? ' + coda' : ''} | ${listaCaps(s.indice)} |`);
    for (const a of s.indice.avisos) if (/corto|coda|va a|no existe|se parte|no se parte/.test(a)) avisosE2.push(`${caso.nombre}, ${NOMBRE_TAMANIO[t]}: ${a}`);
  }
}
out();
out('Avisos (pisos, receptores, cortos, codas, particiones):');
out();
for (const a of avisosE2) out(`- ${a}`);
out();

// ---------------------------------------------------------------- Naza
let naza: { respuestas: RespuestaV3[]; indices: Record<Tamanio, Indice> } | null = null;
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
  const indices = { B: armarIndice(respuestas, FICHA_NAZA, { tamanio: 'B', anioActual: ANIO }), E: armarIndice(respuestas, FICHA_NAZA, { tamanio: 'E', anioActual: ANIO }), C: armarIndice(respuestas, FICHA_NAZA, { tamanio: 'C', anioActual: ANIO }) };
  naza = { respuestas, indices };
  const indice = indices.E;
  const habladas = respuestas.filter((r) => !r.paso).reduce((s, r) => s + r.palabras, 0);
  const porId = (id: string) => respuestas.find((r) => r.id === id)!;
  out(`${respuestas.length} respuestas (${respuestas.filter((r) => r.paso).length} "paso"), ${miles(habladas)} palabras habladas ≈ ${miles(escritas(habladas))} escritas. Estándar → ${indice.capitulos.length} capítulos${indice.coda ? ' + coda' : ''}.`);
  out();
  out('| # | Capítulo | Claves | Habladas | Escritas objetivo | Respuestas |');
  out('|---|---|---|---|---|---|');
  indice.capitulos.forEach((c, i) => {
    const ids = c.respuestaIds.map((id) => `${id} ${porId(id).preguntaId}${c.sensibles.includes(id) ? ' (S)' : ''}`).join(', ');
    out(`| ${i + 1} | ${nombreCap(c)} | ${c.claves.join('+')} | ${miles(c.palabrasHabladas)} | ${miles(c.palabrasEscritasObjetivo)} | ${ids} |`);
  });
  if (indice.coda) out(`| coda | Hoy | ${indice.coda.clave} | ${miles(indice.coda.palabrasHabladas)} | ${miles(indice.coda.palabrasEscritasObjetivo)} | ${indice.coda.respuestaIds.join(', ')} |`);
  out();
  out(`Cierre (legado): ${indice.cierre.join(', ') || '—'}`);
  out();
  out('Saltos por piso:');
  out();
  for (const s of indice.saltos) out(`- ${s.respuestaId} ${porId(s.respuestaId).preguntaId}: ${s.de} → ${s.a}`);
  if (!indice.saltos.length) out('- ninguno');
  out();
  out('Flotantes, crisis y reubicadas:');
  out();
  for (const f of indice.flotantes) {
    out(`- ${f.respuestaId} ${f.preguntaId} → tema ${f.tema}${f.receptor !== undefined ? ` (receptor ${f.receptor})` : ''} (${f.motivo}${f.edad !== undefined ? `, edad ${f.edad}` : ''}${f.expresion ? `, "${f.expresion}"` : ''}${f.sensible ? ', sensible' : ''})`);
  }
  out();
  out('Avisos:');
  out();
  for (const a of indice.avisos) out(`- ${a}`);
  out();

  // 9a. Vigilancia del modo migrante joven.
  out('### Vigilancia: antes / después de emigrar (modo migrante joven, Estándar)');
  out();
  const mj = indice.migranteJoven;
  if (!mj) out('La ficha de Naza no activa el modo migrante joven.');
  else {
    out(`Edad al migrar ${mj.edadMigracion}, edad actual ${mj.edadActual}; lugares de destino que se buscan en el texto: ${mj.lugaresDestino.join(', ')}.`);
    out();
    out('| Respuesta | Pregunta | Bloque | Clasificación | Señal | Quedó en | Comienzo del texto |');
    out('|---|---|---|---|---|---|---|');
    for (const c of mj.clasificacion) {
      const texto = porId(c.respuestaId).texto.replace(/\s+/g, ' ').slice(0, 160).replace(/\|/g, '/');
      out(`| ${c.respuestaId} | ${c.preguntaId} | ${c.bloque} | ${c.momento} | ${c.senal} | ${c.capitulo} | ${texto}… |`);
    }
  }
  out();
}

// ---------------------------------------------------------------- 9c. lado a lado
out('## La misma ficha en Breve, Estándar y Completo');
out();
const viuda = FICHAS_E2.find((f) => f.clave === 'viuda')!;
const filasLado: { nombre: string; indices: Record<Tamanio, Indice> }[] = [
  { nombre: 'Viuda de 82 (sintética, semilla 1)', indices: { B: simular(viuda.ficha, 'B', { semilla: SEMILLA, anioActual: ANIO }).indice, E: simular(viuda.ficha, 'E', { semilla: SEMILLA, anioActual: ANIO }).indice, C: simular(viuda.ficha, 'C', { semilla: SEMILLA, anioActual: ANIO }).indice } },
  ...(naza ? [{ nombre: 'Naza (material real: las mismas 57 respuestas en los tres)', indices: naza.indices }] : []),
];
out('| Ficha | Breve | Estándar | Completo |');
out('|---|---|---|---|');
for (const f of filasLado) out(`| ${f.nombre} | ${celdaIndice(f.indices.B)} | ${celdaIndice(f.indices.E)} | ${celdaIndice(f.indices.C)} |`);
out();

// ---------------------------------------------------------------- contra Fable
out('## Contra los índices que predijo Fable (sección 5)');
out();
const gallego = FICHAS_E2.find((f) => f.clave === 'gallego')!;
const predicciones: { nombre: string; fable: string; indice: Indice | null }[] = [
  { nombre: 'Naza, Estándar (real)', fable: 'De dónde vengo y los primeros años (1.300) · Hacerse grande (1.500) · Mi gente y mis lugares (900) · El viaje, hasta hoy (2.000)', indice: naza?.indices.E ?? null },
  { nombre: 'Viuda de 82, Estándar', fable: 'De dónde vengo y los primeros años (2.000) · Hacerse grande (1.000) · Amor y la familia que armé (2.300) · Trabajo y oficio (1.100) · Mi gente y mis lugares (1.000) · Hoy (900)', indice: simular(viuda.ficha, 'E', { semilla: SEMILLA, anioActual: ANIO }).indice },
  { nombre: 'Gallego de 71, Estándar', fable: 'De dónde vengo y los primeros años (1.800) · Hacerse grande y el viaje (1.500) · Amor y la familia que armé (2.600) · Trabajo y oficio (1.400) · Mi gente y mis lugares (1.000) · Hoy (800)', indice: simular(gallego.ficha, 'E', { semilla: SEMILLA, anioActual: ANIO }).indice },
  { nombre: 'Viuda parca, Breve', fable: 'Crecer y salir al mundo (1.050) · Los míos (550) · coda: Hoy (300)', indice: simular(viuda.ficha, 'B', { semilla: SEMILLA, perfil: 'parco', anioActual: ANIO }).indice },
];
out('| Caso | Fable | Código |');
out('|---|---|---|');
for (const p of predicciones) out(`| ${p.nombre} | ${p.fable} | ${p.indice ? listaCaps(p.indice) : '—'} |`);
out();

const texto = salida.join('\n') + '\n';
mkdirSync(CARPETA, { recursive: true });
writeFileSync(SALIDA, texto, 'utf8');
console.log(texto);
console.log(`Guardado en ${path.relative(FABRICA, SALIDA)}`);
