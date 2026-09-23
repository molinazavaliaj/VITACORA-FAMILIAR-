// Lo físico que viaja: libro impreso y marcos (3t.26; CONTRATO, sección «Entregas»).
// Acá vive lo que la fábrica hace con la tabla `entregas` —mover estados, abrir el
// portón de impresión— y en `libro/imprenta.ts` vive el armado del PDF que va a la
// imprenta. Separados a propósito: uno decide CUÁNDO, el otro sabe CÓMO.

import { obtenerClienteDb } from './db.js';
import { armarLibroDeImprenta } from './libro/imprenta.js';
import { cargarConfig } from './config.js';
import { enviarMailHito, type Hito } from './mail/hitos.js';
import { productosDelPedido } from './libro/productos.js';
import { calcularBulto } from './envio/bulto.js';
import { proveedorDe } from './envio/proveedor.js';

type Db = ReturnType<typeof obtenerClienteDb>;

/** Donde la familia deja la reseña cuando el libro llegó (Joaquín, 22/09). */
export const URL_RESENA = 'https://es.trustpilot.com/evaluate/vitacorafamiliar.com';

/** A los 3 días sin dirección se pregunta a dónde va; antes, no se molesta. */
const DIAS_PARA_PEDIR_DIRECCION = 3;

/**
 * Los estados de la entrega que le importan a la familia. Los del medio
 * (`lista`, `en_produccion`, `impreso`) no mandan nada: "lo estamos imprimiendo"
 * no es una noticia, es la espera normal, y un mail de más gasta la atención que
 * hace falta cuando llegue la buena.
 */
const HITO_POR_ESTADO: Record<string, Hito> = {
  sin_direccion: 'falta_direccion',
  enviado: 'enviado',
  entregado: 'entregado',
};

/** El candado lleva el id de la entrega: dos pedidos del mismo narrador no se tapan. */
const candadoDeEntrega = (narradorId: string, entregaId: string, hito: Hito) =>
  `${narradorId}/paquete/entrega_${entregaId}_${hito}.txt`;

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
    const respuesta = await db.from('entregas').select('id, narrador_id, pedido_id, estado, origen, destinatario_nombre, destinatario_telefono, destinatario_email, direccion').eq('estado', 'lista');
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

      // La etiqueta se pide en el mismo momento, para que la imprenta imprima el
      // libro y la etiqueta en una sola pasada (spec 21/09). Si algo de esto falla,
      // el libro igual sale: el envío se resuelve a mano, un libro sin imprimir no.
      const envio = await datosDeEnvio(db, entrega);

      const { error: errorUpdate } = await db
        .from('entregas')
        .update({ estado: 'en_produccion', produccion_at: new Date().toISOString(), ...envio })
        .eq('id', entrega.id);
      if (errorUpdate) throw new Error(errorUpdate.message);

      console.log(`imprenta: la entrega ${entrega.id} (${entrega.narrador_id}) pasó a en_produccion.`);
    } catch (err) {
      console.error(`imprenta: falló el portón de la entrega ${entrega.id}:`, err);
    }
  }
}

/**
 * Los mails de lo físico: "¿a dónde lo mandamos?", "va en camino" y "ya está en
 * casa". Un mail por ENTREGA y una sola vez, con el candado en Storage que deja
 * el patrón de la casa: se sube SOLO si Resend confirmó el envío, así que un
 * fallo de correo se reintenta en el próximo tick en vez de perderse.
 *
 * Los estados que avisan son tres (`HITO_POR_ESTADO`); el resto es la espera
 * normal y no molesta a nadie.
 */
export async function avisarHitosDeEntrega(db: Db): Promise<void> {
  const estados = Object.keys(HITO_POR_ESTADO);
  let entregas: EntregaParaAviso[];
  try {
    const respuesta = await db
      .from('entregas')
      .select('id, narrador_id, familia_id, estado, seguimiento, created_at')
      .in('estado', estados);
    if (respuesta.error) {
      console.warn(`entregas: no se pudieron leer para avisar: ${respuesta.error.message}`);
      return;
    }
    entregas = (respuesta.data ?? []) as EntregaParaAviso[];
  } catch (err) {
    console.warn('entregas: no se pudieron leer para avisar:', err);
    return;
  }

  const { urlBase } = cargarConfig();

  for (const entrega of entregas) {
    try {
      const hito = HITO_POR_ESTADO[entrega.estado];
      if (!hito) continue;

      // Pedir la dirección el mismo día que encargó es apurar a alguien que quizá
      // está buscando el código postal de su tía: se espera.
      if (hito === 'falta_direccion' && !pasaronDias(entrega.created_at, DIAS_PARA_PEDIR_DIRECCION)) continue;

      const candado = candadoDeEntrega(entrega.narrador_id, entrega.id, hito);
      if (await existeCandado(db, entrega.narrador_id, candado)) continue;

      const { data: familia } = await db
        .from('familias')
        .select('email')
        .eq('id', entrega.familia_id)
        .maybeSingle();
      const para = (familia as { email?: string } | null)?.email;
      if (!para) {
        console.warn(`entregas: la entrega ${entrega.id} no tiene mail de familia; no se avisa.`);
        continue;
      }

      const { data: narrador } = await db
        .from('narradores')
        .select('como_le_dicen')
        .eq('id', entrega.narrador_id)
        .maybeSingle();

      const enviado = await enviarMailHito({
        hito,
        para,
        comoLeDicen: (narrador as { como_le_dicen?: string } | null)?.como_le_dicen ?? 'familiar',
        // El de "llegó" lleva a dejar la reseña, que es el momento de más alegría
        // del producto; los otros, al panel.
        enlace: hito === 'entregado' ? URL_RESENA : `${urlBase}/tablero/${entrega.narrador_id}`,
        seguimiento: entrega.seguimiento ?? null,
      });

      // Sin candado si el mail no salió: el próximo tick reintenta.
      if (!enviado) continue;
      const { error } = await db.storage
        .from('audios')
        .upload(candado, new Blob([`${hito} ${new Date().toISOString()}`]), { upsert: true });
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error(`entregas: falló el aviso de la entrega ${entrega.id}:`, err);
    }
  }
}

type EntregaParaAviso = {
  id: string;
  narrador_id: string;
  familia_id: string;
  estado: string;
  seguimiento: string | null;
  created_at: string;
};

function pasaronDias(desde: string | null | undefined, dias: number): boolean {
  if (!desde) return false;
  const cuando = new Date(desde).getTime();
  if (Number.isNaN(cuando)) return false;
  return Date.now() - cuando >= dias * 24 * 60 * 60 * 1000;
}

/** Los candados viven en el paquete del narrador, como los de los otros mails. */
async function existeCandado(db: Db, narradorId: string, ruta: string): Promise<boolean> {
  const { data, error } = await db.storage.from('audios').list(`${narradorId}/paquete`);
  if (error) throw new Error(`No se pudo listar el paquete de ${narradorId}: ${error.message}`);
  const nombre = ruta.split('/').pop();
  return (data ?? []).some((archivo: { name: string }) => archivo.name === nombre);
}

/**
 * El peso, las medidas y la etiqueta de una entrega que sale a producción.
 *
 * Devuelve las columnas a escribir junto al cambio de estado, o `{}` si no se
 * pudo averiguar: **la etiqueta nunca frena el libro**. Un paquete sin etiqueta se
 * despacha a mano en cinco minutos; un libro que no se imprimió porque el correo
 * tenía la API caída es una familia esperando.
 */
async function datosDeEnvio(db: Db, entrega: EntregaParaImprimir): Promise<Record<string, unknown>> {
  try {
    if (!entrega.pedido_id) return {};

    const { data: pedido } = await db
      .from('pedidos')
      .select('extras')
      .eq('id', entrega.pedido_id)
      .maybeSingle();
    const productos = productosDelPedido((pedido as { extras?: unknown } | null)?.extras);

    const bulto = calcularBulto(productos);
    if (!bulto) return {};
    if (bulto.estimado) {
      console.warn(
        `envio: la entrega ${entrega.id} se despacha con el peso ESTIMADO de la casa (${bulto.pesoG} g). ` +
          'Confirmar con la imprenta: el envío va incluido en el precio.'
      );
    }

    // El origen es el centro que despacha. Sin él, España por defecto no sirve:
    // se deja el bulto y la etiqueta se decide a mano.
    const origen = entrega.origen === 'AR' || entrega.origen === 'ES' ? entrega.origen : null;
    if (!origen) {
      console.warn(`envio: la entrega ${entrega.id} no dice desde qué país sale; se despacha a mano.`);
      return { peso_g: bulto.pesoG, dimensiones: bulto.dimensiones, etiqueta_proveedor: 'manual' };
    }

    const proveedor = proveedorDe(origen);
    const etiqueta = await proveedor.emitir({
      origen,
      destinatario: {
        nombre: entrega.destinatario_nombre ?? null,
        telefono: entrega.destinatario_telefono ?? null,
        email: entrega.destinatario_email ?? null,
      },
      direccion: (entrega.direccion as Record<string, unknown> | null) ?? null,
      bulto,
      referencia: `Vitácora ${entrega.id.slice(0, 8)}`,
    });

    return {
      peso_g: bulto.pesoG,
      dimensiones: bulto.dimensiones,
      etiqueta_proveedor: etiqueta.proveedor,
      etiqueta_url: etiqueta.etiquetaUrl,
      envio_externo_id: etiqueta.envioExternoId,
      transportista: etiqueta.transportista,
      seguimiento: etiqueta.seguimiento,
      seguimiento_url: etiqueta.seguimientoUrl,
    };
  } catch (err) {
    console.error(`envio: no se pudo preparar el envío de ${entrega.id} (el libro sale igual):`, err);
    return {};
  }
}

type EntregaParaImprimir = {
  id: string;
  narrador_id: string;
  pedido_id?: string | null;
  origen?: string | null;
  destinatario_nombre?: string | null;
  destinatario_telefono?: string | null;
  destinatario_email?: string | null;
  direccion?: unknown;
};
