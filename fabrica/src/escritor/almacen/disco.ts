import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Almacen } from './tipos.js';

/** Para correr local (scripts/escritor-correr.ts): una carpeta del disco. */
export class AlmacenDisco implements Almacen {
  constructor(private readonly raiz: string) {}
  async leer(ruta: string): Promise<string | null> {
    const p = path.join(this.raiz, ruta);
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
  }
  async escribir(ruta: string, texto: string): Promise<void> {
    const p = path.join(this.raiz, ruta);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, texto, 'utf8');
  }
}
