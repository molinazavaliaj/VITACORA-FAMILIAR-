// La carpeta del escritor v5.5 (entradas/, salidas/, controles/, arreglos/, estilo/, pendientes/),
// en memoria. Los .mjs leían y escribían archivos; acá lo mismo, sin disco, con las mismas rutas,
// para que el código portado sea el original letra por letra.
import type { Json } from './tipos.js';

const normal = (r: string): string => r.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');

export class Carpeta {
  private readonly archivos = new Map<string, string>();

  constructor(inicial: Record<string, string> = {}) {
    for (const [ruta, texto] of Object.entries(inicial)) this.escribir(ruta, texto);
  }

  existe(ruta: string): boolean {
    return this.archivos.has(normal(ruta));
  }

  /** ¿Hay algún archivo adentro de esta carpeta? (fs.existsSync de un directorio). */
  existeCarpeta(ruta: string): boolean {
    const pre = `${normal(ruta)}/`;
    return [...this.archivos.keys()].some((k) => k.startsWith(pre));
  }

  /** Como lib.mjs `leer`: el texto con \r\n pasado a \n. */
  leer(ruta: string): string {
    const t = this.archivos.get(normal(ruta));
    if (t === undefined) throw new Error(`no existe ${ruta}`);
    return t.replace(/\r\n/g, '\n');
  }

  escribir(ruta: string, texto: string): void {
    this.archivos.set(normal(ruta), texto);
  }

  borrar(ruta: string): void {
    this.archivos.delete(normal(ruta));
  }

  copiar(de: string, a: string): void {
    this.escribir(a, this.leer(de));
  }

  /** Los nombres de los archivos que están directo en `dir` (no en subcarpetas), ordenados con sort(). */
  listar(dir: string): string[] {
    const pre = `${normal(dir)}/`;
    return [...this.archivos.keys()]
      .filter((k) => k.startsWith(pre) && !k.slice(pre.length).includes('/'))
      .map((k) => k.slice(pre.length))
      .sort();
  }

  aObjeto(): Record<string, string> {
    return Object.fromEntries([...this.archivos.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  }

  clonar(): Carpeta {
    return new Carpeta(this.aObjeto());
  }
}

/** lib.mjs `leerJSON`: sin BOM y sin ```json alrededor. */
export function parseJSONTolerante(s: string): Json {
  return JSON.parse(s.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').replace(/^```(json)?\s*/, '').replace(/```\s*$/, ''));
}

export const leerJSON = (c: Carpeta, ruta: string): Json => parseJSONTolerante(c.leer(ruta));
