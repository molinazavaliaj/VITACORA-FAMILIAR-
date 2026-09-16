// Vuelve a poner `pendiente` una narración fallida para que el worker de voz
// la tome de nuevo:
//
//   npm run narracion -- reintentar <id>
//
// El id viene en el mail de aviso a los socios ("La narración de ... falló").
//
// OJO: según CONTRATO.md, `narraciones.estado` lo escribe el worker de voz,
// no la fábrica. Este comando es la excepción explícita que nombra el diseño
// ("Reintento: `npm run narracion -- reintentar <id>` en la fábrica pone
// `pendiente`"): lo dispara una persona a mano, nunca el tick. Solo se
// reintenta una `fallida`: una `pendiente` ya está en cola, una
// `procesando` la tiene el worker (ponerla `pendiente` haría que la tome dos
// veces) y una `lista` ya está narrada (se volvería a narrar entera).
//
// Además borra el candado del aviso `fallida` (`aviso_narracion_{id}_fallida.txt`
// en el paquete del narrador): el candado es por (narración, motivo), y sin
// borrarlo un segundo fallo no le avisaría a nadie. Mismo par de pasos que
// `python -m voz.reintentar` en la PC de voz.
import { fileURLToPath } from 'node:url';
import { obtenerClienteDb } from './db.js';
import { CANDADO_AVISO } from './mail/socios.js';

type Db = ReturnType<typeof obtenerClienteDb>;

const USO = 'Uso: npm run narracion -- reintentar <id>';

export async function reintentarNarracion(db: Db, id: string): Promise<void> {
  const { data, error } = await db
    .from('narraciones')
    .update({ estado: 'pendiente', error: null, actualizada_at: new Date().toISOString() })
    .eq('id', id)
    .eq('estado', 'fallida')
    .select('id, narrador_id');
  if (error) throw new Error(`No se pudo reintentar la narración ${id}: ${error.message}`);
  const filas = (data ?? []) as { id: string; narrador_id: string }[];
  if (filas.length === 0) {
    throw new Error(`Narración ${id}: solo se reintenta una narración fallida (o el id no existe).`);
  }
  console.log(`Narración ${id} vuelve a pendiente: el worker de voz la toma en su próxima vuelta.`);

  // Secundario: la narración ya volvió a pendiente. Si el candado no está
  // (nunca se avisó) o Storage falla, se avisa por consola y no se tira.
  const candado = `${filas[0].narrador_id}/paquete/${CANDADO_AVISO(id, 'fallida')}`;
  const { error: errorCandado } = await db.storage.from('audios').remove([candado]);
  if (errorCandado) {
    console.warn(`No se pudo borrar el candado ${candado} (${errorCandado.message}); si vuelve a fallar, no va a avisar.`);
  }
}

async function main(): Promise<void> {
  const [accion, id] = process.argv.slice(2);
  if (accion !== 'reintentar' || !id) {
    console.error(USO);
    process.exit(1);
  }
  await reintentarNarracion(obtenerClienteDb(), id);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
