// Lo físico que viaja: libro impreso y marcos (3t.26; CONTRATO, sección «Entregas»).
// Acá vive lo que la fábrica hace con la tabla `entregas` —mover estados, abrir el
// portón de impresión— y en `libro/imprenta.ts` vive el armado del PDF que va a la
// imprenta. Separados a propósito: uno decide CUÁNDO, el otro sabe CÓMO.

import { obtenerClienteDb } from './db.js';
import { armarLibroDeImprenta } from './libro/imprenta.js';

type Db = ReturnType<typeof obtenerClienteDb>;

/**
 * El paso del tick: las entregas que ya tienen dirección (`lista`) y frases
 * confirmadas pasan a `en_produccion` con su libro de imprenta armado.
 *
 * Es el único salto `lista → en_produccion` del sistema, y lo escribe la fábrica
 * (CONTRATO, sección Entregas). Una entrega que falla no frena a las demás, y
 * mientras la migración de `entregas` no esté aplicada esto no hace nada: el resto
 * del producto sigue igual.
 */
export async function mandarEntregasAImprenta(db: Db): Promise<void> {
  // La lectura va envuelta: sin la tabla aplicada PostgREST devuelve `{ error }`
  // (PGRST205), pero una red caída o un cliente a medio armar TIRAN — y este paso
  // corre al final de un tick que ya escribió libros: no puede tumbarlo.
  let data: unknown;
  try {
    const respuesta = await db.from('entregas').select('id, narrador_id, estado').eq('estado', 'lista');
    if (respuesta.error) {
      console.warn(`imprenta: no se pudieron leer las entregas listas: ${respuesta.error.message}`);
      return;
    }
    data = respuesta.data;
  } catch (err) {
    console.warn('imprenta: no se pudieron leer las entregas listas:', err);
    return;
  }

  for (const entrega of (data ?? []) as { id: string; narrador_id: string }[]) {
    try {
      const armado = await armarLibroDeImprenta(db, entrega.narrador_id);
      // Todavía sin confirmar: la entrega espera, y el próximo tick vuelve a mirar.
      if (!armado) continue;

      const { error: errorUpdate } = await db
        .from('entregas')
        .update({ estado: 'en_produccion', produccion_at: new Date().toISOString() })
        .eq('id', entrega.id);
      if (errorUpdate) throw new Error(errorUpdate.message);

      console.log(`imprenta: la entrega ${entrega.id} (${entrega.narrador_id}) pasó a en_produccion.`);
    } catch (err) {
      console.error(`imprenta: falló el portón de la entrega ${entrega.id}:`, err);
    }
  }
}
