// v5.3, Paso 7 (corrector de estilo): aplica los cambios de forma con barandas.
// Uso: node estilo.mjs <carpeta> <pieza>
//   lee estilo/cambios-<pieza>.json, aplica a salidas/<pieza> lo que pasa la baranda y deja estilo/aplicado-<pieza>.json
//   (aplicados y frenados con su motivo). La pieza sin corrector queda en estilo/antes-<pieza>.md.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leer, existe, escribir, leerJSON, salida, archivoDe, marcas, palabras } from './lib.mjs';

const numeros = (t) => (t.match(/\d+/g) || []).sort().join(',');
// Nombres propios: palabras con mayúscula que no arrancan una oración ni van después de una raya o comillas.
const nombres = (t) => [...t.replace(/\[\[[^\]]*\]\]/g, '').matchAll(/(?<![.!?¿¡—"«:]\s|^)(?<=\s|\()(\p{Lu}[\p{L}]+)/gmu)].map((m) => m[1]);

/** '' si el cambio pasa; si no, el motivo. */
export function barandaEstilo(c, texto, conocidos = []) {
  const antes = (c.antes || '').trim(), despues = (c.despues || '').trim();
  if (!antes || !texto.includes(antes)) return 'el "antes" no está tal cual en la pieza';
  if (marcas(antes).sort().join(',') !== marcas(despues).sort().join(',')) return 'cambia las marcas [[R..]]';
  if (numeros(antes) !== numeros(despues)) return 'cambia números';
  const nd = ` ${palabras(despues).join(' ')} `;
  // los nombres con mayúscula en medio de la oración, y los del registro (personas y apodos) aunque abran la oración
  const na = ` ${palabras(antes).join(' ')} `;
  const reg = conocidos.map((n) => palabras(n).join(' ')).filter((n) => n && na.includes(` ${n} `));
  const falta = [...nombres(antes).map((n) => palabras(n).join(' ')), ...reg].filter((n) => !nd.includes(` ${n} `));
  if (falta.length) return `se pierden nombres: ${falta.join(', ')}`;
  const a = palabras(antes).length, d = palabras(despues).length;
  if (a >= 8 && (d < a * 0.6 || d > a * 1.4)) return `cambia el largo de ${a} a ${d} palabras`;
  return '';
}

export function aplicarEstilo(texto, cambios, conocidos = []) {
  let t = texto;
  const aplicados = [], frenados = [];
  for (const c of cambios || []) {
    const motivo = barandaEstilo(c, t, conocidos);
    if (motivo) { frenados.push({ ...c, motivo }); continue; }
    t = t.replace(c.antes.trim(), () => c.despues.trim());
    aplicados.push(c);
  }
  return { texto: t, aplicados, frenados };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , dirArg, pieza] = process.argv;
  const dir = path.resolve(dirArg);
  const arch = salida(dir, archivoDe(pieza)), cam = path.join(dir, 'estilo', `cambios-${pieza}.json`);
  if (!existe(cam)) { console.log(`${pieza}: sin cambios de estilo (no hay ${cam})`); process.exit(0); }
  const viejo = leer(arch);
  const reg = existe(salida(dir, 'registro.json')) ? leerJSON(salida(dir, 'registro.json')) : {};
  const conocidos = (reg.personas || []).flatMap((p) => [p.nombre, ...(p.apodos || [])]).filter(Boolean);
  const { texto, aplicados, frenados } = aplicarEstilo(viejo, leerJSON(cam).cambios, conocidos);
  escribir(path.join(dir, 'estilo', `antes-${pieza}.md`), viejo);
  escribir(arch, texto);
  escribir(path.join(dir, 'estilo', `aplicado-${pieza}.json`), JSON.stringify({ aplicados, frenados }, null, 1));
  console.log(`${pieza}: estilo ${aplicados.length} aplicados, ${frenados.length} frenados${frenados.length ? ` (${[...new Set(frenados.map((f) => f.motivo.split(':')[0]))].join('; ')})` : ''}`);
}
