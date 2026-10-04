// Prueba del cazador en catalán SIN API (Naza, 04/10: "la prueba la hace Opus
// en la sesión", USD 0). Dos pasos:
//
//   npx tsx scripts/v3-catala-cazador-sesion.ts armar <estado.json> <bloque> <salida-entrada.txt>
//     escribe el mensaje de usuario exacto que recibiría el modelo (el prompt es
//     docs/v3/entrevista/cazador/prompt-v3-1-ca.md, sección "## Prompt");
//   npx tsx scripts/v3-catala-cazador-sesion.ts controlar <estado.json> <bloque> <salida-del-modelo.json>
//     pasa lo que devolvió el modelo por los mismos controles del código
//     (cita textual, una pregunta, tiempos relativos en catalán…) e imprime el
//     mensaje que le llegaría al narrador.
//
// El estado es el de la simulación por turnos (v3-entrevista-turno.ts).

import { readFileSync, writeFileSync } from 'node:fs';
import { armarEntrada, fichaCorta, leerSalida, mensajeRepregunta, respuestasParaCazar, revisarElegidas } from '../src/v3/entrevista/cazador.js';
import { idiomaDe } from '../src/v3/entrevista/idioma.js';
import { textoMandado, type EstadoSimulacion } from './v3-entrevista-turno.js';

const [comando, rutaEstado, bloqueTxt, ruta] = process.argv.slice(2);
if (!comando || !rutaEstado || !bloqueTxt || !ruta) throw new Error('Uso: armar|controlar <estado.json> <bloque> <archivo>');
const e = JSON.parse(readFileSync(rutaEstado, 'utf8')) as EstadoSimulacion;
const bloque = Number(bloqueTxt);
const idioma = idiomaDe(e.ficha);
const delBloque = respuestasParaCazar(new Map(e.respuestas), bloque, (id) => textoMandado(e, id), idioma);

if (comando === 'armar') {
  writeFileSync(ruta, armarEntrada({ ficha: fichaCorta(e.ficha), bloque, respuestas: delBloque, yaRepreguntado: [], escenasContadas: [], idioma }), 'utf8');
  console.log(`Entrada del bloque ${bloque} (${delBloque.length} respuestas) en ${ruta}`);
} else if (comando === 'controlar') {
  const salida = leerSalida(readFileSync(ruta, 'utf8'));
  if (!salida) throw new Error('La salida del modelo no se puede leer (¿JSON con "elegidas"?).');
  const { repreguntas, descartadas } = revisarElegidas(salida.elegidas, delBloque, bloque, [], idioma);
  for (const r of repreguntas) console.log(`PASA ${r.origen}: ${mensajeRepregunta(r, idioma)}`);
  for (const d of descartadas) console.log(`DESCARTADA ${d.id} (${d.fallas.join(', ')}): «${d.cita}» ${d.pregunta}`);
  console.log(`escenas contadas: ${salida.escenasContadas.join(' | ')}`);
} else throw new Error(`Comando desconocido: ${comando}`);
