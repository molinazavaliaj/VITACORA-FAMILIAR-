import { fileURLToPath } from 'node:url';
import { obtenerClienteDb } from './db.js';
import { generarEstructura } from './libro/estructura.js';
import { generarPrevisualizacion } from './libro/previsualizar.js';
import { generarPaquete } from './libro/generar-paquete.js';

const INTERVALO_MS = 60_000;

let corriendo = false;

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
 * Branch (b): pedidos en estado 'pagado' → armar el libro y el audiolibro
 * (generarPaquete). Antes de nada, cada pedido se reclama poniéndolo en
 * 'generando' — así si el tick tarda más que el intervalo y se solapa con el
 * próximo (o dos instancias del worker corren a la vez), el segundo no lo
 * vuelve a tomar. generarPaquete es responsable de dejarlo en 'entregado' o
 * 'fallido'; acá no hay try/catch porque esa responsabilidad ya es suya —
 * ver su propio manejo de errores.
 */
export async function procesarPedidosPagados(): Promise<void> {
  const db = obtenerClienteDb();

  const { data: pedidos, error } = await db
    .from('pedidos')
    .select('id, narrador_id')
    .eq('estado', 'pagado');

  if (error) {
    console.error('tick: no se pudieron leer los pedidos pagados:', error.message);
    return;
  }

  for (const pedido of (pedidos ?? []) as { id: string; narrador_id: string }[]) {
    const { error: errorClaim } = await db
      .from('pedidos')
      .update({ estado: 'generando' })
      .eq('id', pedido.id);

    if (errorClaim) {
      console.error(`tick: no se pudo reclamar el pedido ${pedido.id}:`, errorClaim.message);
      continue;
    }

    await generarPaquete(pedido);
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
