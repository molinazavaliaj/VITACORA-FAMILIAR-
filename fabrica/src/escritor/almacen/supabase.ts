// Producción: Supabase Storage, bucket `audios`, bajo un prefijo por narrador (p. ej. `<narradorId>/escritor`).
// Usa los mismos ayudantes que los checkpoints de borrador del libro (sin caché del bucket).
import type { obtenerClienteDb } from '../../db.js';
import { descargarTextoOpcional, subirTexto } from '../../libro/comun.js';
import type { Almacen } from './tipos.js';

export class AlmacenSupabase implements Almacen {
  constructor(private readonly db: ReturnType<typeof obtenerClienteDb>, private readonly prefijo: string) {}
  leer(ruta: string): Promise<string | null> {
    return descargarTextoOpcional(this.db, `${this.prefijo}/${ruta}`);
  }
  escribir(ruta: string, texto: string): Promise<void> {
    return subirTexto(this.db, `${this.prefijo}/${ruta}`, texto, ruta.endsWith('.json') ? 'application/json' : 'text/markdown');
  }
}
