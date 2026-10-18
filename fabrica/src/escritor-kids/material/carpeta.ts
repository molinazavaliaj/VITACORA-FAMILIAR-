// El material en la Carpeta del escritor: entradas/material.json (todo, estructurado) y entradas/ficha.json.
// Las salidas de cada paso quedan en salidas/ (lectura.json, parte-N.json, sobre.json, album.json, veedor-N.json…).
import { Carpeta, leerJSON } from '../../escritor/carpeta.js';
import { materialDeFilas } from './de-filas.js';
import type { FilasKids, MaterialKids } from './tipos.js';

export const RUTA_MATERIAL = 'entradas/material.json';
export const RUTA_FICHA = 'entradas/ficha.json';
export const salidaKids = (archivo: string): string => `salidas/${archivo}`;

export function carpetaDeMaterial(m: MaterialKids): Carpeta {
  const c = new Carpeta();
  c.escribir(RUTA_MATERIAL, JSON.stringify(m, null, 1));
  c.escribir(RUTA_FICHA, JSON.stringify(m.ficha, null, 1));
  return c;
}

export const carpetaDeFilas = (f: FilasKids): Carpeta => carpetaDeMaterial(materialDeFilas(f));
export const materialDe = (c: Carpeta): MaterialKids => leerJSON(c, RUTA_MATERIAL) as MaterialKids;
