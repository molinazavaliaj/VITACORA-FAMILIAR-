// Imprime el recorrido de la entrevista para 6 vidas de ejemplo (inventadas:
// nunca la vida de un narrador real). Sirve para ver a quién le llega qué,
// sobre todo en el bloque 6 (amor) y el 8 (hijos).
//
//   npx tsx scripts/v3-entrevista-recorrido.ts          # resumen por vida
//   npx tsx scripts/v3-entrevista-recorrido.ts --todo   # con la lista de IDs de cada una

import { cuentaComoPregunta, simularRecorrido } from '../src/v3/entrevista/seleccion.js';
import { VIDAS_EJEMPLO } from '../src/v3/entrevista/vidas-ejemplo.js';

const todo = process.argv.includes('--todo');

for (const vida of VIDAS_EJEMPLO) {
  for (const aceptaExtra of [false, true]) {
    const pasos = simularRecorrido(vida.ficha, (id) => vida.respuestas[id], { aceptaExtra });
    const preguntas = pasos.flatMap((p) => (p.tipo === 'pregunta' ? [p.pregunta] : []));
    const historia = preguntas.filter(cuentaComoPregunta);
    const amor = preguntas.filter((p) => p.bloque === 6).map((p) => p.id);
    const hijos = preguntas.filter((p) => p.bloque === 8).map((p) => p.id);
    console.log(`\n${vida.nombre}${aceptaExtra ? ' (acepta la ronda extra)' : ' (solo núcleo)'}`);
    console.log(`  preguntas de historia: ${historia.length} · turnos en total: ${preguntas.length}`);
    console.log(`  bloque 6: ${amor.join(' → ')}`);
    console.log(`  bloque 8: ${hijos.join(' → ')}`);
    const am7 = preguntas.find((p) => p.id === 'AM7');
    if (am7) console.log(`  AM7: …${/una frase que (\S+)/.exec(am7.texto)?.[1] ?? '?'}…`);
    if (todo) console.log(`  ${preguntas.map((p) => p.id).join(' ')}`);
  }
}
