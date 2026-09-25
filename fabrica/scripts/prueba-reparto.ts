// Prueba del libro v2 de punta a punta (biógrafo v2): etapas de SU vida → reparto → un capítulo
// por etapa → apertura, cierre y «Sus frases» → control → lector final. Todo el camino vive en
// `armarLibroV2` (src/libro/libro-v2.ts); este script solo lee la base, arma la entrada y deja todo
// en una carpeta local para leerlo. No escribe NADA en Supabase (ni base ni Storage, ni costos.json).
//
//   npx tsx --env-file=.env scripts/prueba-reparto.ts <narradorId> [--salida <carpeta>] [--excluir <id>,<id>]
//
// De dónde sale la época de cada respuesta (con eso arranca en su etapa):
// - narrador entrevistado con el cerebro v2 (`contexto.v2`, ej. Naza): el tramo de cada pregunta
//   hecha, y la línea de tiempo del perfil para armar las etapas (ver scripts/contexto-v2.ts);
// - material viejo (Joaquín): el capítulo del guion de su pregunta (`EPOCA_DEL_CAPITULO_GUION`).
//
// --etapas se sigue aceptando y no hace nada: el libro v2 ya es siempre por etapas (el camino por
// capítulos del guion se eliminó). --excluir deja afuera respuestas que sabemos que no son de esta
// persona (ej. el audio de Ciro en la orden 27 de Joaquín): solo en esta corrida, la base no se toca.
// Las `bloqueadas` del candado v2 quedan afuera solas.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../src/config.js';
import { obtenerClienteDb } from '../src/db.js';
import { descargarTextoOpcional, formatearNombresCorregidos } from '../src/libro/comun.js';
import { aplicarOrdenCapitulos, aplicarTitulosCapitulos, leerEdicion } from '../src/libro/edicion.js';
import { medirRepeticion, type Medicion } from '../src/libro/medir-repeticion.js';
import { armarLibroV2, type ErrorLibroV2 } from '../src/libro/libro-v2.js';
import { hayQueRevisar, lineaDelLector } from '../src/libro/revision.js';
import { generoV2 } from './contexto-v2.js';
import { cargarMaterialDelNarrador } from './material-narrador.js';

const args = process.argv.slice(2);
const narradorId = args[0]?.startsWith('--') ? undefined : args[0];
const iSalida = args.indexOf('--salida');
const iExcluir = args.indexOf('--excluir');
if (!narradorId) {
  console.error('Uso: npx tsx --env-file=.env scripts/prueba-reparto.ts <narradorId> [--salida <carpeta>] [--excluir <id>,<id>]');
  process.exit(2);
}
if (args.includes('--solo-reparto')) {
  // Antes de gastar: el v2 corre entero (etapas, reparto, capítulos, páginas, lector) o nada.
  console.error('--solo-reparto ya no existe: el libro v2 corre entero. Sacalo del comando.');
  process.exit(2);
}
const excluidas = new Set(iExcluir >= 0 ? (args[iExcluir + 1] ?? '').split(',').filter(Boolean) : []);
const salida = path.resolve(iSalida >= 0 ? args[iSalida + 1] : `prueba-reparto-${narradorId.slice(0, 8)}`);

const db = obtenerClienteDb();
const { narrador, v2, excluidas: fuera, respuestas, reservados, epocas, lineaDeTiempo, nombres, quien, delMaterial } =
  await cargarMaterialDelNarrador(db, narradorId, excluidas);
const genero = quien.genero;
const fuentes = respuestas.map((r) => ({ id: r.fuenteId, texto: r.texto }));

await mkdir(salida, { recursive: true });
const pad = (i: number) => String(i + 1).padStart(2, '0');
const medir = (m: Medicion) => `${m.porcentaje.toFixed(1)} % copiado (${m.palabrasDuplicadas} de ${m.palabras} palabras, ${m.frasesEnVariosCapitulos.length} frases en varios capítulos) · ${m.sinRespaldo} oraciones sin respaldo`;
const informe: string[] = [
  `# Prueba del libro v2 — ${narrador.nombre}`, '',
  `**Material:** ${v2 ? 'entrevista v2 (épocas del tramo de cada pregunta, línea de tiempo del perfil)' : 'guion viejo (épocas por capítulo del guion, sin línea de tiempo)'}`,
  ...(fuera.size ? [`Excluidas de esta corrida: ${[...fuera].join(', ')}`] : []),
  `${respuestas.length} respuestas · ${reservados.length} reservas (fuera del libro, se le pasan al lector)`, '',
  `**Quién cuenta:** ${genero ?? 'no se sabe'}${v2 && generoV2(v2) ? ' (lo dijo en la entrevista)' : delMaterial.evidencia.length ? ` (${delMaterial.evidencia.slice(0, 4).join(', ')})` : ''}`, '',
];
if (lineaDeTiempo) informe.push('**Línea de tiempo del perfil:**', lineaDeTiempo, '');

// ANTES: los borradores que están hoy en Storage (solo si el libro viejo llegó a armarse).
const estructuraTexto = await descargarTextoOpcional(db, `${narradorId}/paquete/estructura.json`);
if (estructuraTexto) {
  const estructura = JSON.parse(estructuraTexto) as { capitulos: { nombre: string; ordenes: number[] }[] };
  const edicion = leerEdicion(narrador.edicion);
  const capitulosViejos = aplicarTitulosCapitulos(aplicarOrdenCapitulos(estructura.capitulos, edicion.ordenCapitulos), edicion.titulosCapitulos);
  const antes: { nombre: string; texto: string }[] = [];
  for (let i = 0; i < capitulosViejos.length; i++) {
    const t = await descargarTextoOpcional(db, `${narradorId}/paquete/borrador_cap_${pad(i)}.md`);
    if (t) antes.push({ nombre: capitulosViejos[i].nombre, texto: t });
  }
  if (antes.length) informe.push(`**Antes (borradores de hoy):** ${medir(medirRepeticion(antes, fuentes))}`, '');
}

const config = cargarConfig();
const cliente = new Anthropic({ apiKey: config.anthropicApiKey });

// Cada capítulo se guarda apenas está: ya se pagó, y si algo se cae después no se pierde.
const guardarCapitulo = (i: number, nombre: string, texto: string) =>
  writeFile(path.join(salida, `capitulo_${pad(i)}.md`), `# ${nombre}\n\n${texto}\n`);

let r: Awaited<ReturnType<typeof armarLibroV2>>;
try {
  r = await armarLibroV2({
    cliente, quien, respuestas, epocas, lineaDeTiempo,
    nombresCorregidos: formatearNombresCorregidos(nombres.correcciones), reservados,
    alPaso: (p) => console.log(p),
    alCapitulo: guardarCapitulo,
  });
} catch (err) {
  // Lo que ya se pagó se guarda igual (salidas, capítulos, gasto): sin eso no hay cómo saber por qué
  // falló ni leer lo que salió.
  const e = err as Partial<ErrorLibroV2> & { message?: string };
  for (const [archivo, texto] of Object.entries(e.salidas ?? {})) await writeFile(path.join(salida, archivo), texto);
  const capitulosHechos = e.capitulos ?? [];
  for (let i = 0; i < capitulosHechos.length; i++) await guardarCapitulo(i, capitulosHechos[i].nombre, capitulosHechos[i].texto);
  const gasto = e.gastoUsd ?? 0;
  informe.push(
    `**⚠ La corrida se cortó:** ${e.message ?? String(err)}`, '',
    `Quedó guardado: ${Object.keys(e.salidas ?? {}).join(', ') || 'nada del modelo'}${capitulosHechos.length ? ` · ${capitulosHechos.length} capítulo(s): ${capitulosHechos.map((c) => c.nombre).join(', ')}` : ''}.`, '',
    `**Gasto hasta el error:** USD ${gasto.toFixed(2)}`,
  );
  await writeFile(path.join(salida, 'informe.md'), informe.join('\n') + '\n');
  console.error(informe.join('\n'));
  console.error(`\nLo que quedó, en ${salida}`);
  throw err;
}

for (const [archivo, texto] of Object.entries(r.salidas)) await writeFile(path.join(salida, archivo), texto);
for (let i = 0; i < r.etapas.length; i++) {
  await writeFile(path.join(salida, `material_cap_${pad(i)}.md`), `# ${r.etapas[i].nombre}\n\n${r.materiales[i] ?? ''}\n`);
}
if (r.libroMarkdown) await writeFile(path.join(salida, 'libro.md'), r.libroMarkdown);
await writeFile(path.join(salida, 'revision.json'), JSON.stringify(r.informe, null, 2));
// Lo que devolvió el lector tal cual: si falló, es lo único que dice por qué (y se puede releer con releer-libro.ts).
if (r.lectorCrudo) await writeFile(path.join(salida, 'lector-crudo.txt'), r.lectorCrudo);

const d = r.detalle;
informe.push('**Etapas:**', ...r.etapas.map((e, i) => `${i + 1}. ${e.nombre}${e.desde !== null ? ` (${e.desde}-${e.hasta ?? '?'})` : ''}: ${e.deQueTrata}`), '');
informe.push(`**Reparto en etapas:** ${d.oraciones} oraciones · ${d.movidas} ubicadas por el modelo · ${d.ignoradas.length} líneas ignoradas · ${d.sueltas} que no ubicó (fueron con el resto de su respuesta, o a la reflexión)`);
for (const l of d.ignoradas) informe.push(`- ignorada: \`${l}\``);
informe.push('', `**Cobertura:** ${d.afuera.length === 0 ? 'todas las oraciones están en algún capítulo' : `⚠ ${d.afuera.length} oraciones afuera`}`);
for (const f of d.afuera) informe.push(`- afuera: ${f}`);
informe.push('', `**Después (libro v2):** ${medir(r.medicion)}`);
for (const f of r.medicion.frasesEnVariosCapitulos) informe.push(`- ${f.fuente} en ${f.capitulos.join(' + ')}: «${f.oracion.slice(0, 100)}»`);
informe.push('', d.frases
  ? `**Editor v2:** ${d.frases.suyas} suyas, ${d.frases.heredadas} heredadas, ${d.frases.muletillas} muletillas · ${d.caidas.length} frases caídas por no ser textuales${d.caidas.length ? `: ${d.caidas.map((c) => `«${c}»`).join(', ')}` : ''}`
  : '**Editor v2:** ⚠ no devolvió un JSON legible (no hay libro.md; el lector leyó los capítulos solos)');
informe.push('', `**Control antes de imprimir:** ${r.informe.control.length ? r.informe.control.map((a) => `\n- ⚠ ${a}`).join('') : 'sin avisos'}`);
informe.push('', `**Lector final:** ${lineaDelLector(r.informe)}`);
for (const a of r.informe.lector) informe.push(`- **${a.capitulo}** — «${a.frase}» — *${a.problema}*: ${a.evidencia}`);
informe.push('', `**¿Se imprimiría?** ${hayQueRevisar(r.informe) ? 'no: espera revisión (ver revision.json)' : 'sí, sin avisos'}`);
informe.push('', `**Gasto de la prueba:** USD ${r.gastoUsd.toFixed(2)}`);
await writeFile(path.join(salida, 'informe.md'), informe.join('\n') + '\n');
console.log(informe.join('\n'));
console.log(`\nTodo en ${salida}`);
