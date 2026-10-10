// Pasa una entrevista V3 (el estado.json de v3-entrevista-turno.ts o de la
// página web) al material del escritor V3, con el mismo formato que
// fabrica/prueba-v3-joaquin: respuestas.xml (R01… en el orden en que llegaron)
// y etiquetas.json (pregunta, bloque, palabras, paso). Genérico: no tiene
// datos de nadie adentro. Sin modelos ni API.
//
//   npx tsx scripts/v3-entrevista-a-material.ts <estado.json> <carpeta-salida>
//
// Reglas:
//   - La pregunta es el texto EXACTO que se le mandó (las partes de la charla
//     con ese ID). Si la charla no lo tiene, el texto de hoy del banco,
//     renderizado con la ficha y las respuestas de antes.
//   - Bloque: el del banco; las preguntas de la familia van al 15 (legado: la
//     carta). Si el ID ya no está en el banco, el último título de bloque de la
//     charla antes de esa pregunta.
//   - "paso" (no cuenta para el libro): interpretar() dice paso, vacío, olvido
//     o "ya te lo conté"; o un "no" en una pregunta que no es de historia
//     (cierre "No, está todo", foto "No tengo foto"). Un "no" en una pregunta
//     de historia ("No tuve hijos") es un dato y se queda.
//   - Botón: la marca ⟦botón:…⟧ no llega al escritor. Con "Sí" y audio, queda
//     el audio; con un botón solo, queda el texto del botón.
//   - Foto (FO1): si describió una foto, se queda (bloque 15) y el origen avisa
//     que la imagen no está en el material.
//   - La segunda oportunidad (X~2) y la repregunta del cazador (RP~X) van
//     pegadas a la respuesta X, con el mismo id, sin el texto de lo que se le
//     preguntó (Naza, 01/10, plan del cazador B3). Solo si contaron algo: un
//     olvido, un "no", un "paso" o [Ya lo conté todo] no se suman. Si suman,
//     la respuesta X ya no es "paso" (aunque X haya sido un "no me acuerdo").
//   - AMH inferida de AM0 (Naza, 06/10): si en el repaso de AM0 dijo que hoy
//     no hay nadie, AMH no se le preguntó (la marca ⟦inferida:AM0⟧, o nada si
//     el estado no la guardó). No va como fila: el origen de AM0 lo avisa.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { aMaterial, etiquetas, respuestasXml, type EstadoEntrevista, type Fila } from '../src/escritor/material/de-entrevista.js';

// La lógica vive en src/escritor/material/de-entrevista.ts (la usa el escritor de la fábrica); acá queda el comando.
export { aMaterial, etiquetas, respuestasXml };
export type { Fila };

const LEGADO = 15;

function main(args: string[]): void {
  const [rutaEstado, salida] = args;
  if (!rutaEstado || !salida) throw new Error('Uso: npx tsx scripts/v3-entrevista-a-material.ts <estado.json> <carpeta-salida>');
  const filas = aMaterial(JSON.parse(readFileSync(rutaEstado, 'utf8')) as EstadoEntrevista);
  mkdirSync(salida, { recursive: true });
  writeFileSync(join(salida, 'respuestas.xml'), respuestasXml(filas), 'utf8');
  writeFileSync(join(salida, 'etiquetas.json'), JSON.stringify(etiquetas(filas), null, 2), 'utf8');
  const cuenta: Record<string, number> = {};
  for (const f of filas) cuenta[f.interpretacion] = (cuenta[f.interpretacion] ?? 0) + 1;
  const utiles = filas.filter((f) => !f.paso);
  console.log(`${filas.length} respuestas; ${filas.filter((f) => f.paso).length} marcadas paso (${filas.filter((f) => f.paso).map((f) => f.id).join(',') || 'ninguna'}); ${utiles.reduce((s, f) => s + f.palabras, 0)} palabras que cuentan (${filas.reduce((s, f) => s + f.palabras, 0)} en total)`);
  console.log('interpretación:', JSON.stringify(cuenta), '| bloque 15 (carta):', filas.filter((f) => f.bloque === LEGADO && !f.paso).map((f) => f.id).join(',') || 'ninguna');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(`ERROR: ${(err as Error).message}`);
    process.exit(1);
  }
}
