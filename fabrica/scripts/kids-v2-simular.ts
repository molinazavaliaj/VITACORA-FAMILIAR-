// Simulador de Vitácora Kids V2: corre MUCHOS chicos inventados de punta a
// punta con el motor de verdad (src/kids-v2/) y revisa los controles de
// src/kids-v2/controles.ts sobre TODOS los mensajes. Semilla fija: todo se repite.
//
//   npx tsx scripts/kids-v2-simular.ts            # 800 chicos + docs/kids/v2/simulaciones/resumen.md
//   npx tsx scripts/kids-v2-simular.ts 200        # otra cantidad (no escribe nada)
//   npx tsx scripts/kids-v2-simular.ts --semilla 7  # un chico, mensaje por mensaje, y sus violaciones
//   ... --idioma es-AR | es-ES | mitad            # en qué idioma (por defecto, mitad: las semillas pares en es-ES)
//
// Chicos INVENTADOS. Nunca usar acá la vida de un narrador real.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTROLES } from '../src/kids-v2/controles.js';
import { aLocal } from '../src/kids-v2/horas.js';
import { correrMuchos, correrUno, idiomaDeResultado, idiomaDeSemilla, type IdiomasSimulacion } from '../src/kids-v2/simulacion.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = path.join(FABRICA, '..', 'docs', 'kids', 'v2', 'simulaciones');

const todos = process.argv.slice(2);
const iIdioma = todos.indexOf('--idioma');
const idiomas = (iIdioma >= 0 ? todos[iIdioma + 1] : 'mitad') as IdiomasSimulacion;
if (!['es-AR', 'es-ES', 'mitad'].includes(idiomas)) throw new Error(`--idioma ${idiomas}: va es-AR, es-ES o mitad`);
const arg = iIdioma >= 0 ? todos.filter((_, i) => i !== iIdioma && i !== iIdioma + 1) : todos;
if (arg[0] === '--semilla') {
  const semilla = Number(arg[1]);
  const r = correrUno(semilla, idiomaDeSemilla(semilla, idiomas));
  console.log(`semilla ${r.semilla}: ${r.conducta}, ${idiomaDeResultado(r)}, canal ${r.ficha.canal}, hora ${r.ficha.hora}, ${r.ficha.zona}, temas [${r.ficha.temasSacados.join(', ')}]`);
  for (const l of r.corrida.lineas) {
    const h = aLocal(l.en, r.ficha.zona);
    const que = l.de === 'bot' ? `→ ${l.mensaje.a} ${l.mensaje.id} [${l.mensaje.botones.join('|')}]` : l.de === 'chico' ? `   ${l.dice}` : `   MARCA ${l.motivo}: ${l.detalle}`;
    console.log(`${h.fecha} ${h.hora} ${que}`);
  }
  console.log(r.violaciones.length ? r.violaciones : 'sin violaciones');
} else {
  const n = Number(arg[0] ?? 800);
  const t0 = Date.now();
  const rs = correrMuchos(n, idiomas);
  const porControl = new Map<string, string[]>();
  for (const r of rs) for (const v of r.violaciones) porControl.set(v.control, [...(porControl.get(v.control) ?? []), `semilla ${r.semilla} (${r.conducta}, ${idiomaDeResultado(r)}): ${v.detalle}`]);
  const porIdioma = (['es-AR', 'es-ES'] as const).map((i) => {
    const de = rs.filter((r) => idiomaDeResultado(r) === i);
    return { i, n: de.length, terminaron: de.filter((r) => r.corrida.estado?.fase.tipo === 'terminado').length, violaciones: de.reduce((a, r) => a + r.violaciones.length, 0) };
  }).filter((x) => x.n > 0);
  const dias = rs.map((r) => r.dias).sort((a, b) => a - b);
  const md = [
    '# Kids V2 · Simulaciones · Resumen',
    '',
    `Generado por \`fabrica/scripts/kids-v2-simular.ts\`: ${n} chicos inventados, semillas 1 a ${n}${idiomas === 'mitad' ? ', las pares en castellano de España (es-ES) y las impares en rioplatense (es-AR)' : `, todos en ${idiomas}`}. No editar a mano.`,
    '',
    `- Terminaron: ${rs.filter((r) => r.corrida.estado?.fase.tipo === 'terminado').length} de ${n}.`,
    ...porIdioma.map((x) => `- ${x.i}: ${x.n} chicos, terminaron ${x.terminaron}, ${x.violaciones} violaciones.`),
    `- Días de punta a punta: mediana ${dias[Math.floor(n / 2)]}, máximo ${dias[n - 1]}.`,
    `- Mensajes del bot: ${rs.reduce((a, r) => a + r.mensajes, 0)}.`,
    '',
    '| Control | Qué revisa | Violaciones |',
    '|---|---|---|',
    ...Object.entries(CONTROLES).map(([k, d]) => `| ${k} | ${d} | ${porControl.get(k)?.length ?? 0} |`),
    '',
    ...[...porControl.entries()].flatMap(([k, xs]) => [`## ${k}`, '', ...xs.slice(0, 10).map((x) => `- ${x}`), '']),
  ].join('\n');
  if (!arg[0] && iIdioma < 0) {
    mkdirSync(CARPETA, { recursive: true });
    writeFileSync(path.join(CARPETA, 'resumen.md'), md, 'utf8');
  }
  console.log(md.split('\n').slice(4, 8 + porIdioma.length).join('\n'));
  console.log(`${porControl.size === 0 ? 'cero violaciones' : `${[...porControl.values()].flat().length} violaciones`} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (porControl.size) process.exitCode = 1;
}
