import { fileURLToPath } from 'node:url';
import { obtenerClienteDb } from './db.js';
import { cargarConfig } from './config.js';
import { generarAnticipo } from './libro/anticipo.js';
import { firmarTokenAnticipo } from './libro/token-anticipo.js';
import { subirTexto } from './libro/comun.js';
import { enviarMailAnticipo } from './mail/anticipo.js';
import { generarEstructura } from './libro/estructura.js';
import { generarPrevisualizacion } from './libro/previsualizar.js';
import { generarPaquete } from './libro/generar-paquete.js';

const INTERVALO_MS = 60_000;

/**
 * A la tercera respuesta se le manda a la familia el anticipo del libro.
 * Configurable por entorno, como acordaron los socios: mover este momento
 * tiene que ser cambiar un valor, no reescribir el producto.
 */
const RESPUESTAS_PARA_ANTICIPO = Number(process.env.RESPUESTAS_PARA_ANTICIPO ?? 3);

/** El libro se escribe recién cuando el narrador terminó, se haya pagado cuando se haya pagado. */
const ESTADOS_NARRADOR_LISTO = ['completado', 'cerrado_anticipado'];

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
    await generarAnticiposFaltantes();
    await generarEstructurasFaltantes();
    await generarPrevisualizacionesFaltantes();
    await procesarPedidosPagados();
  } finally {
    corriendo = false;
  }
}

/**
 * Branch (a0): narradores que ya contestaron 3 preguntas y todavía no
 * recibieron el anticipo → generarlo y avisarle a la familia por mail.
 *
 * Es el momento de la venta: el material más barato que tenemos (30 centavos
 * de entrevista) contra la prueba completa de que el producto funciona.
 *
 * DOS candados separados, y es a propósito:
 *   - `anticipo.pdf` corta la generación (lo caro: la llamada al modelo).
 *   - `anticipo_enviado.txt` corta el envío del mail.
 * Si el mail falla después de generar, el próximo tick reintenta SOLO el
 * mail y no vuelve a pagarle al modelo. Con un candado único habría que
 * elegir entre repagar o no reintentar nunca.
 */
async function generarAnticiposFaltantes(): Promise<void> {
  const db = obtenerClienteDb();

  const { data: narradores, error } = await db
    .from('narradores')
    .select('id, como_le_dicen, familia_id')
    .in('estado', ['activo', 'pausado']);

  if (error) {
    console.error('tick: no se pudieron leer los narradores para el anticipo:', error.message);
    return;
  }

  for (const narrador of (narradores ?? []) as {
    id: string;
    como_le_dicen: string;
    familia_id: string;
  }[]) {
    try {
      const { data: archivos, error: errorStorage } = await db.storage
        .from('audios')
        .list(`${narrador.id}/paquete`);
      if (errorStorage) {
        console.error(`tick: no se pudo listar el paquete de ${narrador.id}:`, errorStorage.message);
        continue;
      }

      const nombresArchivos = new Set((archivos ?? []).map((archivo) => archivo.name));
      if (nombresArchivos.has('anticipo_enviado.txt')) continue;

      const { count, error: errorCuenta } = await db
        .from('respuestas')
        .select('*', { count: 'exact', head: true })
        .eq('narrador_id', narrador.id);
      if (errorCuenta) {
        console.error(`tick: no se pudieron contar las respuestas de ${narrador.id}:`, errorCuenta.message);
        continue;
      }
      if ((count ?? 0) < RESPUESTAS_PARA_ANTICIPO) continue;

      if (!nombresArchivos.has('anticipo.pdf')) {
        await generarAnticipo(narrador.id);
      }

      await avisarDelAnticipo(narrador);
    } catch (err) {
      console.error(`tick: falló el anticipo de ${narrador.id}:`, err);
    }
  }
}

/**
 * El mail que le avisa a la familia que ya hay algo para ver. Solo deja el
 * candado `anticipo_enviado.txt` si Resend confirmó el envío: si falta la
 * clave, `enviarMailAnticipo` devuelve false y el próximo tick reintenta
 * (así, cargar RESEND_API_KEY alcanza para que salgan los pendientes).
 */
async function avisarDelAnticipo(narrador: {
  id: string;
  como_le_dicen: string;
  familia_id: string;
}): Promise<void> {
  const db = obtenerClienteDb();

  const { data: familia, error: errorFamilia } = await db
    .from('familias')
    .select('email')
    .eq('id', narrador.familia_id)
    .single();
  if (errorFamilia || !familia) {
    throw new Error(`No se pudo leer la familia de ${narrador.id}: ${errorFamilia?.message ?? 'sin datos'}`);
  }

  // La primera pregunta que efectivamente contestó, para citarla en el mail.
  const { data: respuestas } = await db
    .from('respuestas')
    .select('pregunta_orden')
    .eq('narrador_id', narrador.id)
    .order('pregunta_orden', { ascending: true })
    .limit(1);
  const primerOrden = (respuestas ?? [])[0]?.pregunta_orden ?? 1;

  const { data: pregunta } = await db
    .from('preguntas')
    .select('texto')
    .is('narrador_id', null)
    .eq('orden', primerOrden)
    .single();

  const enviado = await enviarMailAnticipo({
    para: (familia as { email: string }).email,
    comoLeDicen: narrador.como_le_dicen,
    primeraPregunta: (pregunta as { texto: string } | null)?.texto ?? '',
    enlace: `${cargarConfig().urlBase}/anticipo/${firmarTokenAnticipo(narrador.id)}`,
  });

  if (enviado) {
    await subirTexto(db, `${narrador.id}/paquete/anticipo_enviado.txt`, new Date().toISOString());
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

  const pedidosPagados = (pedidos ?? []) as { id: string; narrador_id: string }[];
  if (pedidosPagados.length === 0) return;

  // Con el pago por adelantado (11/09) un pedido está 'pagado' desde el día
  // cero, mucho antes de que haya un libro que escribir. Sin este filtro, el
  // worker reclamaría el pedido, generarPaquete fallaría por falta de
  // estructura.json/nombres.json y el pedido quedaría en 'fallido' para que
  // alguien lo resetee a mano. Solo se generan los del narrador que terminó.
  const { data: narradores, error: errorNarradores } = await db
    .from('narradores')
    .select('id, estado')
    .in('id', pedidosPagados.map((p) => p.narrador_id));

  if (errorNarradores) {
    console.error('tick: no se pudieron leer los narradores de los pedidos pagados:', errorNarradores.message);
    return;
  }

  const narradoresListos = new Set(
    ((narradores ?? []) as { id: string; estado: string }[])
      .filter((n) => ESTADOS_NARRADOR_LISTO.includes(n.estado))
      .map((n) => n.id)
  );

  for (const pedido of pedidosPagados) {
    if (!narradoresListos.has(pedido.narrador_id)) continue;
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
