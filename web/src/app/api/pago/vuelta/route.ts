import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion, usuarioDeLaSesion } from "@/lib/supabase/sesion";
import { confirmarPago } from "@/lib/confirmar-pago";
import { enviarMailAcceso, enviarMailRegalo } from "@/lib/mail";
import { verificarToken } from "@/lib/token-firmado";
import { esIdiomaWeb } from "@/lib/idioma-web";

// Adonde vuelve el proveedor después de cobrar (3t.20, 21/09). Tres cosas, en
// orden, y ninguna confía en los query params más allá de los ids:
//   1. El pago se verifica CON EL PROVEEDOR (MP: Payment.get; Stripe: la
//      sesión de checkout). Aprobado y del mismo pedido, o no seguimos.
//   2. El pedido se confirma con la misma confirmarPago del webhook. Es
//      idempotente: si el webhook llegó antes, `yaEstaba` y seguimos. Si el
//      webhook falla (21/09: dos pagos reales quedaron pendientes), acá se
//      confirma igual.
//   3. La sesión de la compradora se abre sin mail ni código SOLO si la cuenta
//      nace con esta compra: un magic link generado en el servidor y verificado
//      acá mismo (el token no sale del servidor). /api/compra no comprueba el
//      correo, así que pagar no prueba que sea de quien paga: si ese correo ya
//      tiene algo (correoConAlgoAdentro), hay que entrar con el código que le
//      llega a su dueña (toma de cuenta, 04/11). Con eso, una compra nueva cae en «Pedido confirmado»
//      (/comprar/gracias con el narrador, rediseño 2026-10: de ahí «Ir a mi
//      panel» y, si es un regalo, «Descargar la tarjeta»); un pedido de extras
//      desde el panel vuelve a /tablero/<narrador>.
// La puerta es el token firmado de la URL (1 hora, atado al pedido): solo lo
// tiene el navegador que pagó. Si algo falla, se cae a /comprar/gracias, la
// pantalla de siempre — nunca un error crudo a quien acaba de pagar.

export const dynamic = "force-dynamic";

type Admin = ReturnType<typeof crearClienteServidor>;

/**
 * ¿Hay algo a nombre de este correo además de la compra que está volviendo? Otro
 * pedido pagado, otra historia (los pilotos no tienen pedido) o una invitación
 * sin aceptar, que se vincula sola con solo entrar (lib/panel.ts). Si la consulta
 * falla, cuenta como que sí: lo peor es que tenga que entrar con el código.
 */
async function correoConAlgoAdentro(admin: Admin, email: string, pedido: { id: string; familia_id: string; narrador_id: string }) {
  const consultas = await Promise.all([
    admin.from("pedidos").select("id").eq("familia_id", pedido.familia_id).in("estado", ["pagado", "generando", "esperando_voz", "entregado"]).neq("id", pedido.id).limit(1).maybeSingle(),
    admin.from("narradores").select("id").eq("familia_id", pedido.familia_id).neq("id", pedido.narrador_id).limit(1).maybeSingle(),
    admin.from("invitados").select("id").ilike("email", email).limit(1).maybeSingle(),
  ]);
  return consultas.some(({ data, error }) => error || data);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const pedidoId = params.get("pedido");
  const esViaje = params.get("viaje") === "1";
  // El idioma de la web desde donde se compró (lib/pagos.ts lo agrega): «Pedido confirmado» habla igual.
  const idioma = params.get("idioma");
  const urlBase = process.env.URL_BASE ?? request.nextUrl.origin;
  const consulta = (extra: Record<string, string> = {}) => {
    const q = new URLSearchParams({ ...(esViaje ? { viaje: "1" } : {}), ...(esIdiomaWeb(idioma) ? { idioma } : {}), ...extra });
    const texto = q.toString();
    return texto ? `?${texto}` : "";
  };
  const gracias = NextResponse.redirect(`${urlBase}/comprar/gracias${consulta()}`);

  if (!pedidoId || !verificarToken("vuelta", params.get("t"), pedidoId)) return gracias;

  const admin = crearClienteServidor();
  const { data: fila } = await admin.from("pedidos").select("id, proveedor, estado, familia_id, narrador_id, extras").eq("id", pedidoId).maybeSingle();
  const pedido = fila as { id: string; proveedor: string; estado: string; familia_id: string; narrador_id: string; extras?: Record<string, unknown> | null } | null;
  if (!pedido) return gracias;

  // 1. Verificar el pago con el proveedor.
  let referencia: string | null = null;
  try {
    if (pedido.proveedor === "mercadopago") {
      const paymentId = params.get("payment_id") ?? params.get("collection_id");
      if (!paymentId) return gracias;
      const pago = await new Payment(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })).get({ id: paymentId });
      if (pago.status !== "approved" || pago.external_reference !== pedido.id) return gracias;
      referencia = String(pago.id ?? paymentId);
    } else if (pedido.proveedor === "stripe") {
      const sessionId = params.get("session_id");
      if (!sessionId) return gracias;
      const sesion = await new Stripe(process.env.STRIPE_SECRET_KEY!).checkout.sessions.retrieve(sessionId);
      if (sesion.payment_status !== "paid" || sesion.metadata?.pedido_id !== pedido.id) return gracias;
      referencia = sesion.id;
    } else {
      return gracias;
    }
  } catch (err) {
    console.error(`pago/vuelta: no pude verificar el pago del pedido ${pedido.id}:`, err);
    return gracias;
  }

  // 2. Confirmar el pedido (idempotente con el webhook).
  const resultado = await confirmarPago(admin, { pedidoId: pedido.id, referenciaExterna: referencia, enviarMailAcceso, enviarMailRegalo });
  if (!resultado.ok) {
    console.error(`pago/vuelta: el pago ${referencia} está aprobado pero no pude confirmar el pedido ${pedido.id}:`, resultado.error);
    return gracias;
  }

  // 3. Abrir la sesión de la compradora y llevarla a su libro. A la cuenta que ya
  // existe se entra con el código: «Pedido confirmado» sin sesión no muestra nada
  // de la base y lleva a entrar, y de ahí vuelve a esta misma pantalla.
  const aEntrar = NextResponse.redirect(`${urlBase}/comprar/gracias${consulta({ n: pedido.narrador_id })}`);
  try {
    const { data: familia } = await admin.from("familias").select("email, auth_user_id").eq("id", pedido.familia_id).maybeSingle();
    const f = familia as { email?: string; auth_user_id?: string | null } | null;
    const email = f?.email?.trim().toLowerCase();
    if (!email) return gracias;

    // Quien ya está adentro con este mismo correo no necesita nada más.
    const usuario = await usuarioDeLaSesion();
    if (usuario?.email?.trim().toLowerCase() !== email) {
      if (f?.auth_user_id || (await correoConAlgoAdentro(admin, email, pedido))) return aEntrar;

      // La cuenta nace con esta compra. Si Auth ya la tiene (entró antes, o es de
      // otro lado), no es nueva: createUser es quien lo sabe con certeza.
      const { error: errorUsuario } = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (errorUsuario) {
        if (/already|exists|registered/i.test(errorUsuario.message)) return aEntrar;
        throw errorUsuario;
      }
      const { data: link, error: errorLink } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      const tokenHash = link?.properties?.hashed_token;
      if (errorLink || !tokenHash) throw errorLink ?? new Error("sin hashed_token");

      const sesion = await crearClienteSesion();
      const { data, error } = await sesion.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
      if (error || !data?.session) throw error ?? new Error("sin sesión");
    }
  } catch (err) {
    console.error(`pago/vuelta: el pedido ${pedido.id} quedó confirmado pero no pude abrir la sesión:`, err);
    return gracias;
  }

  // Una compra nueva (trae la base: el libro o el viaje) va a «Pedido confirmado»
  // con su narrador; la página lee el resto con la sesión recién abierta. El
  // regalo también: de ahí sale «Descargar la tarjeta» (/tablero/<id>/regalo,
  // que lleva a la tarjeta sin poner el código en ninguna URL).
  if (pedido.extras?.pdf === true || pedido.extras?.regalo === true || resultado.codigoRegalo) {
    return NextResponse.redirect(`${urlBase}/comprar/gracias${consulta({ n: pedido.narrador_id })}`);
  }

  // Un pedido de extras (copias, marcos) desde el panel: de vuelta a su historia.
  return NextResponse.redirect(`${urlBase}/tablero/${pedido.narrador_id}`);
}
