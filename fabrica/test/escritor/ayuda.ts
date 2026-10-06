// Ayudas de los tests del escritor: la carpeta de Nélida (inventada), pasar una Carpeta a disco
// y correr los .mjs originales sobre ella (para comparar el port con el original).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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

/** Lo que "contesta el modelo" en cada paso para Nélida: su propio material (los capítulos, con el JSON de afuera vacío). */
export function salidasModeloNelida(): Record<string, string> {
  const c = carpetaNelida();
  const capitulo = (n: number) => `${c.leer(`salidas/capitulo_0${n}.md`).trim()}\n---\n{"afuera": []}`;
  return {
    '1-registro': c.leer('salidas/registro.json'),
    '2-plan': c.leer('salidas/plan.json'),
    dudas: '{"dudas": [{"id": "D01", "pregunta": "¿Cómo se llamaba la Negra, la amiga del barrio de Nélida?", "opciones": []}]}',
    '2h-armador-01': 'Las historias: la casa de Echesortu, la mercería con Raúl y la noche de la calculadora.',
    '2h-armador-02': 'Las historias: quedarse sola y la tarde del bastidor.',
    '3b-capitulo-01': capitulo(1),
    '3b-capitulo-02': capitulo(2),
    '3r-resumen-cap_1': 'Echesortu, la mercería con Raúl, la noche de la calculadora, la nena en el cajón.',
    '3r-resumen-cap_2': 'Muere Raúl, el mate amargo, el bastidor en el patio.',
    '3d-antes-de-cerrar': c.leer('salidas/antes_de_cerrar.md'),
    '3c-carta': c.leer('salidas/carta.md'),
    '3a-primera': c.leer('salidas/primera_pagina.md'),
    '3e-sus-frases': c.leer('salidas/sus_frases.json'),
    '4-hechos': '{"problemas": []}',
    '5c-veedor': '{"problemas": []}',
    '4-hechos-repaso': '{"problemas": []}',
    '3t-titulo-01': '{"titulo": "La persiana de madera", "por_que": "palabras del capítulo"}',
    '3t-titulo-02': '{"titulo": "El bastidor en la falda", "por_que": "palabras del capítulo"}',
  };
}
export const DEFECTOS_NELIDA: [string, string][] = [['6-arreglo-', '{"cambios": []}'], ['7-estilo-', '{"cambios": []}'], ['disputa-', '{"respalda": true}']];

/** Lo que deja la Etapa B para la C: entradas, registro y plan de Nélida. */
export function carpetaParaC(): Carpeta {
  const c = carpetaNelida(['entradas']);
  const s = carpetaNelida();
  c.escribir('salidas/registro.json', s.leer('salidas/registro.json'));
  c.escribir('salidas/plan.json', s.leer('salidas/plan.json'));
  return c;
}

/**
 * Las respuestas del modelo en la corrida real del v5.5 (la carpeta escritor-v5-5 del libro de Joaquín),
 * por clave. Los capítulos: el texto que dejó afuera.mjs (sin-revision/) más el JSON "afuera" que guardó
 * controles/afuera-cap_N.json, que es lo que había devuelto el novelista.
 */
export function salidasDeCorrida(dir: string): Record<string, string> {
  const leer = (r: string) => readFileSync(path.join(dir, r), 'utf8');
  const hay = (r: string) => existsSync(path.join(dir, r));
  const out: Record<string, string> = { '1-registro': leer('salidas/registro.json'), '2-plan': leer('salidas/plan.json') };
  for (const { n } of JSON.parse(out['2-plan']).capitulos as { n: number }[]) {
    const nn = String(n).padStart(2, '0');
    out[`2h-armador-${nn}`] = leer(`salidas/historias/cap_${n}.md`);
    out[`3b-capitulo-${nn}`] = `${leer(`sin-revision/capitulo_${nn}.md`).trimEnd()}\n---\n${JSON.stringify({ afuera: JSON.parse(leer(`controles/afuera-cap_${n}.json`)).afuera })}`;
    out[`3r-resumen-cap_${n}`] = leer(`salidas/resumenes/cap_${n}.md`);
    out[`3t-titulo-${nn}`] = leer(`salidas/titulos/cap_${n}.json`);
  }
  const sueltas: [string, string][] = [['3d-antes-de-cerrar', 'sin-revision/antes_de_cerrar.md'], ['3c-carta', 'sin-revision/carta.md'], ['3a-primera', 'sin-revision/primera_pagina.md'], ['3e-sus-frases', 'salidas/sus_frases.json'], ['4-hechos', 'salidas/hechos.json'], ['5c-veedor', 'salidas/veedor.json'], ['4-hechos-repaso', 'salidas/hechos-repaso.json']];
  for (const [clave, r] of sueltas) if (hay(r)) out[clave] = leer(r);
  for (const f of readdirSync(path.join(dir, 'arreglos'))) {
    const cambio = f.match(/^cambios-(.+)\.json$/);
    if (cambio) out[`6-arreglo-${cambio[1]}`] = leer(`arreglos/${f}`);
    const disputa = f.match(/^disputa-(.+)\.json$/);
    if (disputa) out[`disputa-${disputa[1]}`] = leer(`arreglos/${f}`);
  }
  for (const f of readdirSync(path.join(dir, 'estilo'))) {
    const m = f.match(/^cambios-(.+)\.json$/);
    if (m) out[`7-estilo-${m[1]}`] = leer(`estilo/${f}`);
  }
  return out;
}
