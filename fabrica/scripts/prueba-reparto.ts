// Prueba del reparto de material (biógrafo v2, hallazgo 41). Rehace los capítulos de un libro
// ya terminado repartiendo el material ANTES de escribir, y mide la repetición contra los
// borradores de hoy. No escribe NADA en Supabase (ni base ni Storage, ni costos.json): lee, y
// deja todo en una carpeta local para leerlo.
//
//   npx tsx --env-file=.env scripts/prueba-reparto.ts <narradorId> [--salida <carpeta>] [--solo-reparto] [--excluir <id>,<id>]
//
// --solo-reparto corre solo la llamada del reparto (~USD 0,50) y deja el material de cada
// capítulo para revisarlo antes de pagar los capítulos (~USD 0,22 cada uno). --excluir deja
// afuera respuestas que sabemos que no son de esta persona (ej. el audio de Ciro en la orden 27
// de Joaquín, que su libro real no descartó): solo en esta corrida, la base no se toca.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../src/config.js';
import { obtenerClienteDb, type Pregunta, type Respuesta } from '../src/db.js';
import { descargarTextoOpcional, formatearNombresCorregidos, textoRespuesta, type Nombres } from '../src/libro/comun.js';
import { aplicarOrdenCapitulos, aplicarTitulosCapitulos, leerEdicion } from '../src/libro/edicion.js';
import { numerarRespuestas, materialRepartido, repartir } from '../src/libro/reparto.js';
import { escribirCapituloRepartido } from '../src/libro/escribir-capitulo.js';
import { medirRepeticion, type Medicion } from '../src/libro/medir-repeticion.js';

/** Fable 5, `GASTOS.md` (USD por millón de tokens). */
const PRECIO_ENTRADA = 10;
const PRECIO_SALIDA = 50;
type Uso = { input_tokens?: number; output_tokens?: number };
const costo = (u: Uso) => ((u.input_tokens ?? 0) * PRECIO_ENTRADA + (u.output_tokens ?? 0) * PRECIO_SALIDA) / 1_000_000;

const args = process.argv.slice(2);
const narradorId = args[0]?.startsWith('--') ? undefined : args[0];
const iSalida = args.indexOf('--salida');
const soloReparto = args.includes('--solo-reparto');
const iExcluir = args.indexOf('--excluir');
const excluidas = new Set(iExcluir >= 0 ? args[iExcluir + 1].split(',') : []);
if (!narradorId) {
  console.error('Uso: npx tsx scripts/prueba-reparto.ts <narradorId> [--salida <carpeta>] [--solo-reparto]');
  process.exit(2);
}
const salida = path.resolve(iSalida >= 0 ? args[iSalida + 1] : `prueba-reparto-${narradorId.slice(0, 8)}`);

const db = obtenerClienteDb();
const leer = async <T>(consulta: PromiseLike<{ data: T | null; error: { message: string } | null }>, que: string): Promise<T> => {
  const { data, error } = await consulta;
  if (error || !data) throw new Error(`No pude leer ${que}: ${error?.message ?? 'vacío'}`);
  return data;
};

const narrador = await leer(db.from('narradores').select('*').eq('id', narradorId).single(), 'el narrador') as { nombre: string; edicion: unknown };
const fijas = await leer(db.from('preguntas').select('*').is('narrador_id', null), 'las fijas') as Pregunta[];
const propias = await leer(db.from('preguntas').select('*').eq('narrador_id', narradorId), 'sus preguntas') as Pregunta[];
const respuestas = await leer(db.from('respuestas').select('*').eq('narrador_id', narradorId), 'las respuestas') as Respuesta[];
const estructuraTexto = await descargarTextoOpcional(db, `${narradorId}/paquete/estructura.json`);
if (!estructuraTexto) throw new Error('No hay estructura.json: el libro no llegó a armarse.');
const estructura = JSON.parse(estructuraTexto) as { capitulos: { nombre: string; ordenes: number[] }[] };
const nombresTexto = await descargarTextoOpcional(db, `${narradorId}/paquete/nombres.json`);
const nombres: Nombres = nombresTexto ? JSON.parse(nombresTexto) : { correcciones: [] };

// Los capítulos como salen impresos: el orden y los títulos que eligió la dueña.
const edicion = leerEdicion(narrador.edicion);
const capitulos = aplicarTitulosCapitulos(aplicarOrdenCapitulos(estructura.capitulos, edicion.ordenCapitulos), edicion.titulosCapitulos);

const preguntaDe = new Map<number, string>();
for (const p of [...fijas, ...propias]) preguntaDe.set(p.orden, p.texto);
const publicables = respuestas.filter((r) => !excluidas.has(r.id))
  .sort((a, b) => a.pregunta_orden - b.pregunta_orden || String(a.recibido_at).localeCompare(String(b.recibido_at)))
  .map((r) => ({ r, texto: textoRespuesta(r) }))
  .filter((x): x is { r: Respuesta; texto: string } => Boolean(x.texto));
const numeradas = numerarRespuestas(publicables.map(({ r, texto }) => ({
  orden: r.pregunta_orden, pregunta: preguntaDe.get(r.pregunta_orden) ?? `Pregunta ${r.pregunta_orden}`, texto,
})));
const fuentes = publicables.map(({ r, texto }) => ({ id: r.audio_path?.split('/').pop() ?? `orden_${r.pregunta_orden}`, texto }));

await mkdir(salida, { recursive: true });
const informe: string[] = [`# Prueba del reparto — ${narrador.nombre}`, '', ...(excluidas.size ? [`Excluidas de esta corrida: ${[...excluidas].join(', ')}`, ''] : []), `${numeradas.length} respuestas · ${numeradas.reduce((n, r) => n + r.oraciones.length, 0)} oraciones · ${capitulos.length} capítulos`, ''];
const medir = (m: Medicion) => `${m.porcentaje.toFixed(1)} % copiado (${m.palabrasDuplicadas} de ${m.palabras} palabras, ${m.frasesEnVariosCapitulos.length} frases en varios capítulos) · ${m.sinRespaldo} oraciones sin respaldo`;

// ANTES: los borradores que están hoy en Storage.
const antes: { nombre: string; texto: string }[] = [];
for (let i = 0; i < capitulos.length; i++) {
  const t = await descargarTextoOpcional(db, `${narradorId}/paquete/borrador_cap_${String(i + 1).padStart(2, '0')}.md`);
  if (t) antes.push({ nombre: capitulos[i].nombre, texto: t });
}
if (antes.length) informe.push(`**Antes (borradores de hoy):** ${medir(medirRepeticion(antes, fuentes))}`, '');

// El reparto.
const config = cargarConfig();
const cliente = new Anthropic({ apiKey: config.anthropicApiKey });
console.log('Reparto…');
const reparto = await repartir(cliente, { nombre: narrador.nombre }, numeradas, capitulos);
let gasto = costo(reparto.usage as Uso);
await writeFile(path.join(salida, 'reparto-salida.txt'), reparto.salida);
const { porCapitulo, sinCapitulo } = materialRepartido(numeradas, capitulos, reparto.movidas);
informe.push(`**Reparto:** ${reparto.movidas.size} oraciones mudadas de capítulo · ${reparto.ignoradas.length} líneas ignoradas · USD ${gasto.toFixed(2)}`);
for (const l of reparto.ignoradas) informe.push(`- ignorada: \`${l}\``);
if (sinCapitulo.length) informe.push(`- ⚠ sin capítulo (no entran al libro): ${sinCapitulo.map((r) => `${r.id} (orden ${r.orden})`).join(', ')}`);

// Cobertura: cada oración en exactamente un material. Es así por construcción; se verifica igual.
const todo = porCapitulo.join('\n');
const faltan = numeradas.flatMap((r) => r.oraciones.filter((o) => !todo.includes(o)).map((o) => `${r.id}: ${o.slice(0, 60)}`));
informe.push(`**Cobertura:** ${faltan.length === 0 ? 'todas las oraciones están en algún capítulo' : `⚠ ${faltan.length} oraciones afuera`}`, '');
for (const f of faltan) informe.push(`- afuera: ${f}`);
for (let i = 0; i < capitulos.length; i++) {
  await writeFile(path.join(salida, `material_cap_${String(i + 1).padStart(2, '0')}.md`), `# ${capitulos[i].nombre}\n\n${porCapitulo[i]}\n`);
}

if (!soloReparto) {
  const despues: { nombre: string; texto: string }[] = [];
  for (let i = 0; i < capitulos.length; i++) {
    console.log(`Capítulo ${i + 1}/${capitulos.length}: ${capitulos[i].nombre}…`);
    const { texto, usage } = await escribirCapituloRepartido({ nombre: narrador.nombre }, capitulos[i].nombre, porCapitulo[i], formatearNombresCorregidos(nombres.correcciones));
    gasto += costo(usage as Uso);
    despues.push({ nombre: capitulos[i].nombre, texto });
    await writeFile(path.join(salida, `capitulo_${String(i + 1).padStart(2, '0')}.md`), `# ${capitulos[i].nombre}\n\n${texto}\n`);
  }
  const m = medirRepeticion(despues, fuentes);
  informe.push(`**Después (con reparto):** ${medir(m)}`, '');
  for (const f of m.frasesEnVariosCapitulos) informe.push(`- ${f.fuente} en ${f.capitulos.join(' + ')}: «${f.oracion.slice(0, 100)}»`);
}
informe.push('', `**Gasto de la prueba:** USD ${gasto.toFixed(2)}`);
await writeFile(path.join(salida, 'informe.md'), informe.join('\n'));
console.log(informe.join('\n'));
console.log(`\nTodo en ${salida}`);
