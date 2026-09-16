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
import { fileURLToPath } from 'node:url';
import { obtenerClienteDb } from './db.js';

const USO = 'Uso: npm run narracion -- reintentar <id>';

export async function reintentarNarracion(id: string): Promise<void> {
  const db = obtenerClienteDb();
  const { data, error } = await db
    .from('narraciones')
    .update({ estado: 'pendiente', error: null, actualizada_at: new Date().toISOString() })
    .eq('id', id)
    .eq('estado', 'fallida')
    .select('id');
  if (error) throw new Error(`No se pudo reintentar la narración ${id}: ${error.message}`);
  if (!data || (data as unknown[]).length === 0) {
    throw new Error(`Narración ${id}: solo se reintenta una narración fallida (o el id no existe).`);
  }
  console.log(`Narración ${id} vuelve a pendiente: el worker de voz la toma en su próxima vuelta.`);
}

async function main(): Promise<void> {
  const [accion, id] = process.argv.slice(2);
  if (accion !== 'reintentar' || !id) {
    console.error(USO);
    process.exit(1);
  }
  await reintentarNarracion(id);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
