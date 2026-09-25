// Corre SOLO el lector final sobre un libro de prueba que ya está en una carpeta (el que dejó
// `prueba-reparto.ts`): lee `<carpeta>/libro.md`, carga de la base el mismo material con el que se
// escribió (transcripciones, quién cuenta, nombres corregidos, reservas; ver material-narrador.ts)
// y le pide al lector que lo lea contra los audios. Existe porque el 25/09 el lector se quedó sin
// tope y no devolvió la lista: rehacer el libro entero para eso eran varios dólares tirados.
//
//   npx tsx --env-file=.env scripts/releer-libro.ts <narradorId> --carpeta <carpeta> [--excluir <id>,<id>] [--si]
//
// Sin --si no llama al modelo: muestra cuánto costaría y el comando exacto para hacerlo. Deja en la
// carpeta `lector.json` (avisos + motivo si falló) y `lector-crudo.txt` (lo que devolvió, tal cual).
// No escribe NADA en Supabase: solo lee.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../src/config.js';
import { obtenerClienteDb } from '../src/db.js';
import { formatearNombresCorregidos } from '../src/libro/comun.js';
import { leerLibro, estimarLector, avisosPorCapitulo, MODELO_LECTOR } from '../src/libro/lector.js';
import { calcularUsd } from '../src/costos.js';
import { cargarMaterialDelNarrador } from './material-narrador.js';

const USO = 'Uso: npx tsx --env-file=.env scripts/releer-libro.ts <narradorId> --carpeta <carpeta> [--excluir <id>,<id>] [--si]';
const args = process.argv.slice(2);
const narradorId = args[0]?.startsWith('--') ? undefined : args[0];
const valor = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const carpetaArg = valor('--carpeta');
if (!narradorId || !carpetaArg) {
  console.error(USO);
  process.exit(2);
}
const excluirArg = valor('--excluir') ?? '';
const excluidas = excluirArg.split(',').filter(Boolean);
const carpeta = path.resolve(carpetaArg);

let libro: string;
try {
  libro = await readFile(path.join(carpeta, 'libro.md'), 'utf8');
} catch {
  console.error(`No encuentro ${path.join(carpeta, 'libro.md')}: ¿es la carpeta que dejó prueba-reparto.ts?`);
  process.exit(2);
}

const db = obtenerClienteDb();
const m = await cargarMaterialDelNarrador(db, narradorId, excluidas);
const transcripciones = m.respuestas.map((r) => r.texto);
const nombres = formatearNombresCorregidos(m.nombres.correcciones);
const est = estimarLector(m.quien, libro, transcripciones, nombres, m.reservados);

console.log(`Libro de ${m.narrador.nombre} (${m.quien.genero ?? 'género no se sabe'}): ${libro.length} caracteres · ${m.respuestas.length} respuestas (${transcripciones.join('').length} caracteres) · ${m.reservados.length} reservas`);
if (m.excluidas.size) console.log(`Excluidas: ${[...m.excluidas].join(', ')}`);
console.log(`Estimado con ${MODELO_LECTOR}: ~${est.tokensEntrada.toLocaleString('es-AR')} tokens de entrada → entre USD ${est.usdMin.toFixed(2)} y USD ${est.usdMax.toFixed(2)} (según cuánto piense y escriba).`);

if (!args.includes('--si')) {
  const comando = ['npx tsx --env-file=.env scripts/releer-libro.ts', narradorId, '--carpeta', `"${carpetaArg}"`, ...(excluirArg ? ['--excluir', excluirArg] : []), '--si'].join(' ');
  console.log(`\nNo llamé al modelo. Para hacerlo (desde fabrica/):\n\n  ${comando}\n`);
  process.exit(0);
}

const cliente = new Anthropic({ apiKey: cargarConfig().anthropicApiKey });
console.log('\nEl lector final está leyendo…');
const lectura = await leerLibro(cliente, m.quien, libro, transcripciones, nombres, m.reservados);
const usd = calcularUsd(MODELO_LECTOR, lectura.usage);

await writeFile(path.join(carpeta, 'lector-crudo.txt'), lectura.crudo);
const r = lectura.resultado;
await writeFile(path.join(carpeta, 'lector.json'), JSON.stringify({
  narrador: m.narrador.nombre,
  fecha: new Date().toISOString().slice(0, 10),
  ok: r.ok,
  avisos: r.ok ? r.avisos : [],
  ...(r.ok ? {} : { motivo: r.motivo }),
  usage: lectura.usage,
  usd,
}, null, 2));

console.log('');
if (!r.ok) {
  console.log(`⚠ el lector final falló: ${r.motivo} (lo que devolvió está en lector-crudo.txt)`);
} else if (!r.avisos.length) {
  console.log('Lector final: sin avisos.');
} else {
  console.log(`Lector final: ${r.avisos.length} aviso(s).`);
  for (const [capitulo, avisos] of avisosPorCapitulo(r.avisos)) {
    console.log(`\n## ${capitulo}`);
    for (const a of avisos) console.log(`- «${a.frase}» — ${a.problema}: ${a.evidencia}`);
  }
}
const u = lectura.usage;
console.log(`\nCosto real: USD ${usd.toFixed(2)} (${u.input_tokens} de entrada, ${u.output_tokens} de salida).`);
console.log(`Todo en ${carpeta} (lector.json, lector-crudo.txt).`);
