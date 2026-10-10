// Pasa un narrador en curso a la entrevista V3 (spec 2026-10-07).
//
//   npm run v3-pasar -- <narrador> --genero varon|mujer|otro [--idioma es-AR|es-ES|ca] [--equivalencias <ruta>]
//       muestra lo que haría (no cambia nada)
//   npm run v3-pasar -- <narrador> --genero … --aplicar
//       crea la fila, carga las respuestas viejas en sus claves V3 y les pone clave_v3. No manda nada:
//       la próxima pregunta sale en su tanda, a su hora preferida.
//
// La tabla de equivalencias (src/v3/equivalencias.json) la aprueba Naza ANTES de cualquier --aplicar.
// La salida muestra preguntas, cantidades e IDs V3: nunca lo que contó el narrador ni una key.

import { readFileSync } from 'node:fs';
import { cargarEntorno } from './cargar-entorno.js';

cargarEntorno();
const { aplicarPase, argumentosDePase, describirPase, leerEquivalencias, planDePase } = await import('../src/v3/pasar.js');
const { db } = await import('../src/db/cliente.js');

try {
  const args = argumentosDePase(process.argv.slice(2));
  const equivalencias = leerEquivalencias(args.equivalencias ? JSON.parse(readFileSync(args.equivalencias, 'utf8')) : undefined);
  const tablaVacia = Object.keys(equivalencias.porTexto).length === 0;
  const plan = await planDePase(db, args.narradorId, { genero: args.genero, ...(args.idioma ? { idioma: args.idioma } : {}), equivalencias });
  console.log(describirPase(plan));
  if (tablaVacia) console.log('\nOJO: la tabla de equivalencias está vacía (todavía no la aprobó Naza).');
  if (!args.aplicar) {
    console.log('\nDry-run: no se cambió nada. Para aplicarlo, lo mismo con --aplicar.');
  } else if (tablaVacia && plan.sinEquivalencia.length > 0) {
    // Con la tabla vacía solo se puede pasar a quien no contestó nada todavía (o solo preguntas de la familia).
    throw new Error('La tabla de equivalencias está vacía y hay respuestas viejas: la arma la sesión principal y la aprueba Naza antes de aplicar. No se aplicó nada.');
  } else {
    await aplicarPase(db, plan);
    console.log('\nAplicado: la próxima pregunta le sale en su tanda (a su hora preferida).');
  }
} catch (err) {
  console.error(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
