import { fileURLToPath } from 'node:url';
import { obtenerClienteDb } from './db.js';
import { generarEstructura } from './libro/estructura.js';

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
 * Branch (b): pedidos en estado 'pagado' → armar PDF/audiolibro (playwright).
 * Implementado en Task 9. Por ahora es un no-op para que tick() ya tenga el
 * hueco donde va a enchufarse.
 */
export async function procesarPedidosPagados(): Promise<void> {
  // Task 9: leer pedidos.estado = 'pagado', generar libro_pdf_path / audiolibro_paths.
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
