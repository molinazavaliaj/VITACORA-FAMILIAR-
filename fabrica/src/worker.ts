import { fileURLToPath } from 'node:url';
import { obtenerClienteDb } from './db.js';
import { generarEstructura } from './libro/estructura.js';
import { generarPrevisualizacion } from './libro/previsualizar.js';
import { generarPaquete } from './libro/generar-paquete.js';

const INTERVALO_MS = 60_000;

let corriendo = false;

/**
 * Ids de pedidos en 'generando' que ESTE proceso reclamó y todavía tiene en
 * curso (generarPaquete no terminó). Un pedido sale del Set apenas
 * generarPaquete resuelve, sea éxito o falla — ella misma es responsable de
 * dejarlo en 'entregado' o 'fallido'. Si el proceso muere a mitad de camino,
 * el Set se pierde con él y `liberarPedidosGenerandoHuerfanos` lo detecta en
 * el próximo tick de OTRO proceso (o de este mismo, si sobrevivió pero el
 * pedido quedó huérfano por algún motivo).
 */
const pedidosGenerandoClaimados = new Set<string>();

/**
 * Un ciclo del worker. Se exporta para poder testearlo directo (sin esperar
 * el setInterval). Guardado por `corriendo` para no solapar ticks si un
 * ciclo tarda más que el intervalo.
 */
export async function tick(): Promise<void> {
  if (corriendo) return;
  corriendo = true;
  try {
    await generarEstructurasFaltantes();
    await generarPrevisualizacionesFaltantes();
    await procesarPedidosPagados();
  } finally {
    corriendo = false;
  }
}

/**
 * Branch (a): narradores completado/cerrado_anticipado sin
 * {narrador_id}/paquete/estructura.json en Storage → generarEstructura.
 */
async function generarEstructurasFaltantes(): Promise<void> {
  const db = obtenerClienteDb();

  const { data: narradores, error } = await db
    .from('narradores')
    .select('id')
    .in('estado', ['completado', 'cerrado_anticipado']);

  if (error) {
    console.error('tick: no se pudieron leer los narradores listos para armar el libro:', error.message);
    return;
  }

  for (const narrador of (narradores ?? []) as { id: string }[]) {
    const { data: archivos, error: errorStorage } = await db.storage
      .from('audios')
      .list(`${narrador.id}/paquete`);

    if (errorStorage) {
      console.error(`tick: no se pudo listar el paquete de ${narrador.id}:`, errorStorage.message);
      continue;
    }

    const yaTieneEstructura = (archivos ?? []).some((archivo) => archivo.name === 'estructura.json');
    if (yaTieneEstructura) continue;

    try {
      await generarEstructura(narrador.id);
    } catch (err) {
      console.error(`tick: falló generarEstructura para ${narrador.id}:`, err);
    }
  }
}

/**
 * Branch (a2): narradores completado/cerrado_anticipado que YA tienen
 * estructura.json Y nombres.json (la familia corrigió los nombres) pero
 * todavía no tienen preview.pdf → generarPrevisualizacion. El momento de
 * enamorar: el capítulo 1 escrito de verdad, con los nombres bien.
 */
async function generarPrevisualizacionesFaltantes(): Promise<void> {
  const db = obtenerClienteDb();

  const { data: narradores, error } = await db
    .from('narradores')
    .select('id')
    .in('estado', ['completado', 'cerrado_anticipado']);

  if (error) {
    console.error('tick: no se pudieron leer los narradores listos para previsualizar:', error.message);
    return;
  }

  for (const narrador of (narradores ?? []) as { id: string }[]) {
    const { data: archivos, error: errorStorage } = await db.storage
      .from('audios')
      .list(`${narrador.id}/paquete`);

    if (errorStorage) {
      console.error(`tick: no se pudo listar el paquete de ${narrador.id}:`, errorStorage.message);
      continue;
    }

    const nombresArchivos = new Set((archivos ?? []).map((archivo) => archivo.name));
    const tieneEstructura = nombresArchivos.has('estructura.json');
    const tieneNombres = nombresArchivos.has('nombres.json');
    const tienePreview = nombresArchivos.has('preview.pdf');

    if (!tieneEstructura || !tieneNombres || tienePreview) continue;

    try {
      await generarPrevisualizacion(narrador.id);
    } catch (err) {
      console.error(`tick: falló generarPrevisualizacion para ${narrador.id}:`, err);
    }
  }
}

/**
 * Un pedido en 'generando' que este proceso NO tiene en
 * `pedidosGenerandoClaimados` es huérfano: nadie lo está procesando ahora
 * mismo (el proceso que lo reclamó murió antes de que generarPaquete
 * pudiera dejarlo en 'entregado' o 'fallido'). Se devuelve a 'pagado' para
 * que el próximo `for` de este mismo tick (o el de otro proceso) lo vuelva
 * a intentar. El `.eq('estado','generando')` en el reset es la misma
 * precaución que el CAS del claim: si justo en este instante otro proceso
 * lo terminó (pasó a 'entregado'/'fallido') entre nuestro SELECT y este
 * UPDATE, no lo pisamos.
 */
async function liberarPedidosGenerandoHuerfanos(db: ReturnType<typeof obtenerClienteDb>): Promise<void> {
  const { data: pedidosGenerando, error } = await db.from('pedidos').select('id').eq('estado', 'generando');

  if (error) {
    console.error('tick: no se pudieron leer los pedidos en generando:', error.message);
    return;
  }

  for (const pedido of (pedidosGenerando ?? []) as { id: string }[]) {
    if (pedidosGenerandoClaimados.has(pedido.id)) continue;

    console.warn(
      `tick: el pedido ${pedido.id} quedó huérfano en 'generando' (el proceso que lo reclamó no lo terminó) — lo devolvemos a 'pagado'.`
    );

    const { error: errorReset } = await db
      .from('pedidos')
      .update({ estado: 'pagado' })
      .eq('id', pedido.id)
      .eq('estado', 'generando');

    if (errorReset) {
      console.error(`tick: no se pudo devolver a 'pagado' el pedido huérfano ${pedido.id}:`, errorReset.message);
    }
  }
}

/**
 * Branch (b): pedidos en estado 'pagado' → armar el libro y el audiolibro
 * (generarPaquete). Antes de nada, cada pedido se reclama con un
 * compare-and-swap: `update estado='generando' where id=... and
 * estado='pagado'`, devolviendo la fila afectada. Si no vuelve ninguna fila,
 * alguien más (otra instancia del worker, u otro tick solapado) ya lo
 * reclamó primero — no lo procesamos dos veces. generarPaquete es
 * responsable de dejar el pedido en 'entregado' o 'fallido'; acá no hay
 * try/catch alrededor de esa llamada porque esa responsabilidad ya es
 * suya — ver su propio manejo de errores. Antes de reclamar nada, se
 * liberan los pedidos que quedaron huérfanos en 'generando' de un proceso
 * anterior que murió a mitad de camino.
 */
export async function procesarPedidosPagados(): Promise<void> {
  const db = obtenerClienteDb();

  await liberarPedidosGenerandoHuerfanos(db);

  const { data: pedidos, error } = await db
    .from('pedidos')
    .select('id, narrador_id')
    .eq('estado', 'pagado');

  if (error) {
    console.error('tick: no se pudieron leer los pedidos pagados:', error.message);
    return;
  }

  for (const pedido of (pedidos ?? []) as { id: string; narrador_id: string }[]) {
    const { data: reclamado, error: errorClaim } = await db
      .from('pedidos')
      .update({ estado: 'generando' })
      .eq('id', pedido.id)
      .eq('estado', 'pagado')
      .select('id');

    if (errorClaim) {
      console.error(`tick: no se pudo reclamar el pedido ${pedido.id}:`, errorClaim.message);
      continue;
    }

    // Compare-and-swap: si no volvió ninguna fila, otro proceso ya lo
    // reclamó entre el SELECT de arriba y este UPDATE.
    if (!reclamado || (reclamado as unknown[]).length !== 1) {
      continue;
    }

    pedidosGenerandoClaimados.add(pedido.id);
    try {
      await generarPaquete(pedido);
    } finally {
      pedidosGenerandoClaimados.delete(pedido.id);
    }
  }
}

export function iniciarWorker(): void {
  setInterval(() => {
    void tick();
  }, INTERVALO_MS);
}

// Arranca solo cuando el archivo se ejecuta directamente (dev/start), no cuando
// se importa desde los tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  iniciarWorker();
}
