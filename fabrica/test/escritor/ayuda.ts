// Ayudas de los tests del escritor: la carpeta de Nélida (inventada), pasar una Carpeta a disco
// y correr los .mjs originales sobre ella (para comparar el port con el original).
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import { Carpeta } from '../../src/escritor/carpeta.js';

export const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ESC_V55 = path.join(FABRICA, 'scripts', 'escritor-v55');
export const NELIDA = path.join(FABRICA, 'test', 'fijos', 'escritor-v55', 'nelida');

/** Lee una carpeta de disco a una Carpeta (rutas con /). Con `prefijos`, solo esas subcarpetas. */
export function deDisco(dir: string, prefijos?: string[]): Carpeta {
  const c = new Carpeta();
  const recorrer = (sub: string) => {
    for (const n of readdirSync(path.join(dir, sub))) {
      const rel = sub ? `${sub}/${n}` : n;
      if (statSync(path.join(dir, rel)).isDirectory()) recorrer(rel);
      else if (!prefijos || prefijos.some((p) => rel.startsWith(`${p}/`))) c.escribir(rel, readFileSync(path.join(dir, rel), 'utf8'));
    }
  };
  recorrer('');
  return c;
}

/** Escribe la Carpeta en una carpeta temporal nueva y devuelve su ruta. */
export function aDisco(c: Carpeta): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'escritor-'));
  for (const [rel, texto] of Object.entries(c.aObjeto())) {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), texto, 'utf8');
  }
  return dir;
}

export const carpetaNelida = (prefijos: string[] = ['entradas', 'salidas']): Carpeta => deDisco(NELIDA, prefijos);

/** Corre un .mjs de scripts/escritor-v55 y devuelve su código de salida y su stdout. */
export function correrMjs(script: string, args: string[], env: Record<string, string> = {}): { codigo: number; salida: string } {
  const r = spawnSync(process.execPath, [path.join(ESC_V55, script), ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
  if (r.error) throw r.error;
  if (r.status !== 0 && r.status !== 2 && r.status !== 3) throw new Error(`${script} ${args.join(' ')} salió con ${r.status}: ${r.stderr}`);
  return { codigo: r.status ?? 0, salida: r.stdout };
}

/** El archivo `ruta` es igual en la Carpeta y en el disco (donde lo dejó el .mjs). */
export function mismoArchivo(c: Carpeta, dir: string, ruta: string): void {
  expect(c.leer(ruta), ruta).toBe(readFileSync(path.join(dir, ruta), 'utf8').replace(/\r\n/g, '\n'));
}
