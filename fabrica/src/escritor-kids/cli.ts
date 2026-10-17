// Lo testeable del comando local (scripts/escritor-kids-correr.ts): los argumentos, de dónde salen las filas y
// dónde queda todo.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirDeFijo } from './material/de-fijo.js';
import type { ExtrasFalsos } from './falso.js';

export type ArgsKids = { dir: string; nombre: string; si: boolean; lote: boolean; topeUsd: number; falso: boolean };

/** fabrica/salidas/escritor-kids (gitignoreada). */
export const DIR_SALIDAS_KIDS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'salidas', 'escritor-kids');

export function leerArgsKids(argv: string[]): ArgsKids {
  let dir: string | undefined;
  let nombre: string | undefined;
  const a = { si: false, lote: true, topeUsd: 8, falso: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const valor = (): string => { const v = argv[++i]; if (v === undefined) throw new Error(`falta el valor de ${k}`); return v; };
    if (k === '--fijo') { nombre = valor(); dir = dirDeFijo(nombre); }
    else if (k === '--carpeta') { dir = path.resolve(valor()); nombre = path.basename(dir); }
    else if (k === '--tope') { const n = Number(valor()); if (!(n > 0)) throw new Error('--tope es un monto en USD mayor que 0'); a.topeUsd = n; }
    else if (k === '--sin-lote') a.lote = false;
    else if (k === '--si') a.si = true;
    else if (k === '--falso') a.falso = true;
    else throw new Error(`argumento desconocido: ${k}`);
  }
  if (!dir || !nombre) throw new Error('falta --fijo <chico> o --carpeta <dir> (con kids_v2.json, narrador.json, respuestas.json y fotos.json)');
  if (!existsSync(path.join(dir, 'kids_v2.json'))) throw new Error(`no hay kids_v2.json en ${dir}`);
  if (a.si && a.falso) throw new Error('--si y --falso no van juntos (--falso no gasta; --si llama al modelo de verdad)');
  return { dir, nombre, ...a };
}

/** Lo escrito a mano para el modelo falso de un chico (si lo tiene): <dir>/modelo-falso.json. */
export function extrasFalsosDe(dir: string): ExtrasFalsos {
  const p = path.join(dir, 'modelo-falso.json');
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as ExtrasFalsos) : {};
}

/** El link de prueba de los QR (no hay todavía página de la voz de Kids): no lo escanea nadie. */
export const urlAudioDePrueba = (narradorId: string, respuestaId: string): string => `https://vitacorafamiliar.com/kids/voz/PRUEBA-${narradorId.slice(0, 8)}#r-${respuestaId}`;
