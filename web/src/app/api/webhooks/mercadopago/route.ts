import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { confirmarPago } from "@/lib/confirmar-pago";
import { enviarMailAcceso } from "@/lib/mail";
import { verificarFirmaMP } from "@/lib/firma-mp";

// Dos candados. (1) La firma: MP manda `x-signature` (HMAC con la clave del
// webhook, MP_WEBHOOK_SECRET); si no coincide, 401 y no gastamos una llamada
// (bitácora #9, 16/09). (2) La verdad: consultamos el pago DIRECTO contra la
// API de MP con nuestro access token y solo confiamos en esa respuesta — nunca
// en el payload de la notificación. La firma se calcula sobre el id de la
// notificación, venga como venga.
//
// MP llama a este webhook de dos maneras: el Webhooks nuevo manda POST con
// `?data.id=`, y el IPN viejo manda sus parámetros en la query primero. Los dos
// entran por acá a propósito — un solo lugar donde se verifica la firma y se
// consulta el pago — porque el método que no está exportado NO llega a
// ejecutarse: Next contesta 405 sin correr una sola línea (incidente del 21/09,
// pedido 4333e8fd: dos GET a las 19:37 se comieron el 405 y el pago quedó
// aprobado en MP con el pedido en `pendiente`).
//
// T3.13 — el rastro: CADA salida de este handler escribe una línea, con el
// motivo. El mismo incidente tardó en detectarse porque las dos salidas más
// probables eran MUDAS: una notificación sin id de pago contesta 200
// `{received:true}` y MP se da por notificado (no reintenta), y un pago que
// llega pero no está aprobado (o no trae `external_reference`) contesta 200 sin
// escribir nada. Sin estas líneas, la próxima vez que un pago no confirme hay
// que ir a la base y deducir a mano por qué.
//
// La línea es una sola, greppable, con el motivo adelante y los campos atrás:
//
//     webhook mercadopago: <motivo> | metodo=… id=… origen=… firma=… pago=…
//
// `origen` dice de dónde salió el id (query o cuerpo), que es lo que distingue
// al Webhooks nuevo del IPN viejo; `pago` es lo que contestó MP.
type Firma = "valida" | "invalida" | "no-evaluada";

type Rastro = {
  metodo: string;
  id: string | null;
  origen: "query" | "cuerpo" | null;
  firma: Firma;
  pago: string;
};

function registrarSalida(
  rastro: Rastro,
  motivo: string,
  opciones: { confirmado?: boolean; error?: unknown } = {},
) {
  const linea =
    `webhook mercadopago: ${motivo}` +
    ` | metodo=${rastro.metodo} id=${rastro.id ?? "ninguno"} origen=${rastro.origen ?? "ninguno"}` +
    ` firma=${rastro.firma} pago=${rastro.pago}`;
  // El error va como segundo argumento para que Vercel muestre también su stack.
  if (opciones.error !== undefined) console.error(linea, opciones.error);
  else if (opciones.confirmado) console.log(linea);
  else console.warn(linea);
}

async function procesarNotificacion(request: NextRequest) {
  const url = new URL(request.url);
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  // El rastro se arma una vez y se completa camino a la salida; cada return lo
  // escribe. Si una salida nueva no llama a registrarSalida, el test que cuenta
  // las líneas se cae.
  const rastro: Rastro = {
    metodo: request.method ?? "desconocido",
    id: paymentId,
    origen: paymentId ? "query" : null,
    firma: "no-evaluada",
    pago: "no-consultado",
  };

  // La firma se calcula sobre el data.id de la URL, así que se verifica antes
  // de mirar el cuerpo. Sin secreto configurado se avisa y se sigue (entorno
  // local); en producción la variable está.
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (secreto && paymentId) {
    const valida = verificarFirmaMP({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId: paymentId,
      secreto,
    });
    rastro.firma = valida ? "valida" : "invalida";
    if (!valida) {
      registrarSalida(rastro, "firma inválida, se ignora");
      return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
    }
  } else if (!secreto) {
    console.warn("webhook mercadopago: MP_WEBHOOK_SECRET no configurado, no se verifica la firma");
  }

  if (!paymentId) {
    try {
      const body = (await request.json()) as { data?: { id?: string | number } };
      paymentId = body?.data?.id != null ? String(body.data.id) : null;
      if (paymentId) {
        rastro.id = paymentId;
        rastro.origen = "cuerpo";
      }
    } catch {
      // Sin cuerpo JSON válido: seguimos sin id.
    }
  }

  if (!paymentId) {
    // El agujero más peligroso del incidente: este 200 sin línea hacía que MP se
    // diera por notificado (y no reintentara) sin dejar rastro de nada.
    registrarSalida(rastro, "no trae id de pago, no hay nada que confirmar");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let payment: Awaited<ReturnType<InstanceType<typeof Payment>["get"]>>;
  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    payment = await new Payment(client).get({ id: paymentId });
  } catch (err) {
    // La llamada en sí falló (red caída, 5xx transitorio de MP, etc.) — esto
    // es NUESTRO, no un juicio sobre la notificación. Devolver 500 para que
    // MP reintente; un 200 acá lo daría por "notificación irrelevante" y el
    // pedido se quedaría cobrado pero marcado "pendiente" para siempre.
    rastro.pago = "error";
    registrarSalida(rastro, "no se pudo consultar el pago a Mercado Pago", { error: err });
    return NextResponse.json({ error: "No se pudo consultar el pago." }, { status: 500 });
  }

  rastro.pago = payment.status ?? "sin-status";

  // A partir de acá, la consulta a MP respondió: si no está aprobado o no
  // trae referencia, es una notificación irrelevante de verdad (pago
  // rechazado, pendiente, etc.) — un 200 es correcto.
  if (payment.status === "approved" && payment.external_reference) {
    // Misma confirmación que Stripe: pedido, narrador y mail de acceso en un
    // solo lugar. Un error ahí es NUESTRO (la base, no la notificación) —
    // devolver 500 para que MP reintente, en vez de un 200 que lo daría por
    // hecho y dejaría el pedido cobrado pero marcado "pendiente" para siempre.
    const resultado = await confirmarPago(crearClienteServidor(), {
      pedidoId: payment.external_reference,
      referenciaExterna: String(payment.id),
      enviarMailAcceso,
    });
    if (!resultado.ok) {
      registrarSalida(rastro, "no se pudo actualizar el pedido", { error: resultado.error });
      return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
    }
    // También el caso feliz deja su línea: un 200 sin confirmación y un 200 con
    // confirmación se veían igual en los logs, y no son lo mismo.
    registrarSalida(rastro, `pedido confirmado (${payment.external_reference})`, { confirmado: true });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Las dos notificaciones que NO confirman nada, cada una con su motivo (antes
  // salían por el mismo return mudo del final).
  if (payment.status !== "approved") {
    registrarSalida(rastro, "el pago no está aprobado");
  } else {
    registrarSalida(rastro, "el pago está aprobado pero no trae external_reference");
  }
  return NextResponse.json({ received: true }, { status: 200 });
}

// Los dos métodos, el mismo handler por nombre y no por copia: así el camino
// no se puede separar sin que se note (y sin que un test lo agarre).
export const POST = procesarNotificacion;
export const GET = procesarNotificacion;
