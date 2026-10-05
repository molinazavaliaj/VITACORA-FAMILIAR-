// Simulador de Vitácora Kids V2: corre MUCHOS chicos inventados de punta a
// punta con el motor de verdad (src/kids-v2/) y revisa los controles de
// src/kids-v2/controles.ts sobre TODOS los mensajes. Semilla fija: todo se repite.
//
//   npx tsx scripts/kids-v2-simular.ts            # 800 chicos + docs/kids/v2/simulaciones/resumen.md
//   npx tsx scripts/kids-v2-simular.ts 200        # otra cantidad (no escribe nada)
//   npx tsx scripts/kids-v2-simular.ts --semilla 7  # un chico, mensaje por mensaje, y sus violaciones
//
// Chicos INVENTADOS. Nunca usar acá la vida de un narrador real.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTROLES } from '../src/kids-v2/controles.js';
import { aLocal } from '../src/kids-v2/horas.js';
import { correrMuchos, correrUno } from '../src/kids-v2/simulacion.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = path.join(FABRICA, '..', 'docs', 'kids', 'v2', 'simulaciones');

const arg = process.argv.slice(2);
if (arg[0] === '--semilla') {
  const r = correrUno(Number(arg[1]));
  console.log(`semilla ${r.semilla}: ${r.conducta}, canal ${r.ficha.canal}, hora ${r.ficha.hora}, ${r.ficha.zona}, temas [${r.ficha.temasSacados.join(', ')}]`);
  for (const l of r.corrida.lineas) {
    const h = aLocal(l.en, r.ficha.zona);
    const que = l.de === 'bot' ? `→ ${l.mensaje.a} ${l.mensaje.id} [${l.mensaje.botones.join('|')}]` : l.de === 'chico' ? `   ${l.dice}` : `   MARCA ${l.motivo}: ${l.detalle}`;
    console.log(`${h.fecha} ${h.hora} ${que}`);
  }
  console.log(r.violaciones.length ? r.violaciones : 'sin violaciones');
} else {
  const n = Number(arg[0] ?? 800);
  const t0 = Date.now();
  const rs = correrMuchos(n);
  const porControl = new Map<string, string[]>();
  for (const r of rs) for (const v of r.violaciones) porControl.set(v.control, [...(porControl.get(v.control) ?? []), `semilla ${r.semilla} (${r.conducta}): ${v.detalle}`]);
  const dias = rs.map((r) => r.dias).sort((a, b) => a - b);
  const md = [
    '# Kids V2 · Simulaciones · Resumen',
    '',
    `Generado por \`fabrica/scripts/kids-v2-simular.ts\`: ${n} chicos inventados, semillas 1 a ${n}. No editar a mano.`,
    '',
    `- Terminaron: ${rs.filter((r) => r.corrida.estado?.fase.tipo === 'terminado').length} de ${n}.`,
    `- Días de punta a punta: mediana ${dias[Math.floor(n / 2)]}, máximo ${dias[n - 1]}.`,
    `- Mensajes del bot: ${rs.reduce((a, r) => a + r.mensajes, 0)}.`,
    '',
    '| Control | Qué revisa | Violaciones |',
    '|---|---|---|',
    ...Object.entries(CONTROLES).map(([k, d]) => `| ${k} | ${d} | ${porControl.get(k)?.length ?? 0} |`),
    '',
    ...[...porControl.entries()].flatMap(([k, xs]) => [`## ${k}`, '', ...xs.slice(0, 10).map((x) => `- ${x}`), '']),
  ].join('\n');
  if (!arg[0]) {
    mkdirSync(CARPETA, { recursive: true });
    writeFileSync(path.join(CARPETA, 'resumen.md'), md, 'utf8');
  }
  console.log(md.split('\n').slice(4, 8).join('\n'));
  console.log(`${porControl.size === 0 ? 'cero violaciones' : `${[...porControl.values()].flat().length} violaciones`} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (porControl.size) process.exitCode = 1;
}
