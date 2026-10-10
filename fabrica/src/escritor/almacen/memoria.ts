import type { Almacen } from './tipos.js';

/** Para los tests: los archivos quedan a la vista en `archivos`. */
export class AlmacenMemoria implements Almacen {
  readonly archivos = new Map<string, string>();
  async leer(ruta: string): Promise<string | null> {
    return this.archivos.get(ruta) ?? null;
  }
  async escribir(ruta: string, texto: string): Promise<void> {
    this.archivos.set(ruta, texto);
  }
}
