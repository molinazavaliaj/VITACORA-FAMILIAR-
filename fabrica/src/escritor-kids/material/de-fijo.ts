// Las filas de un chico desde una carpeta del disco con el formato de test/fijos/escritor-kids/<chico>/:
// kids_v2.json, narrador.json, respuestas.json y, si hay, fotos.json y fotos/<id>.<ext> (las imágenes).
// Lo usan los tests y scripts/escritor-kids-correr.ts.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FilasKids } from './tipos.js';

/** test/fijos/escritor-kids (los chicos inventados). */
export const DIR_FIJOS_KIDS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'test', 'fijos', 'escritor-kids');

const leer = <T>(dir: string, archivo: string, siFalta?: T): T => {
  const p = path.join(dir, archivo);
  if (!existsSync(p)) {
    if (siFalta !== undefined) return siFalta;
    throw new Error(`falta ${archivo} en ${dir}`);
  }
  return JSON.parse(readFileSync(p, 'utf8').replace(/^FEFF/, '')) as T;
};

export function filasDeCarpeta(dir: string): FilasKids {
  return {
    kids: leer(dir, 'kids_v2.json'),
    narrador: leer(dir, 'narrador.json'),
    respuestas: leer(dir, 'respuestas.json'),
    fotos: leer(dir, 'fotos.json', []),
  };
}

export const dirDeFijo = (nombre: string): string => path.join(DIR_FIJOS_KIDS, nombre);
export const filasDeFijo = (nombre: string): FilasKids => filasDeCarpeta(dirDeFijo(nombre));
