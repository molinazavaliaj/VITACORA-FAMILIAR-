import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { validarYConstruir, type RegistroBody } from "@/lib/registro";
import { calcularCompra, productosParaPedido, validarCarrito, type Carrito } from "@/lib/productos";
import { crearCheckout } from "@/lib/pagos";
import { firmarTokenFotos } from "@/lib/token-fotos";
import { generarCodigo, validarRegalo, type DatosRegalo } from "@/lib/regalo";

// La compra, sin cuenta previa (pago por adelantado, 11/09). Es la única
// entrada al producto: aquí nacen la familia, el narrador y el pedido, y de
// aquí sale al proveedor de pago. Reemplaza al par registro + /api/checkout.
//
// El narrador nace en `pendiente_pago`: el entrevistador no lo mira hasta que
// el webhook confirme el cobro y lo pase a `invitado`. Si la compradora
// abandona en Stripe, quedan una familia sin usuario, un narrador en
// pendiente_pago y un pedido pendiente — inofensivos y fáciles de limpiar.

const MENSAJE_ERROR_GENERICO = "No pudimos iniciar el pago. Intenta de nuevo en un momento.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type CompraBody = RegistroBody & {
  email?: string;
  /** El carrito (21/09, catálogo base + upsells): la base va siempre; se suman impresos y marcos. */
  productos?: { viaje?: boolean; impresos?: number; marcos?: number };
  /** Gift card (08/10): sin teléfono del narrador; nace un código. */
  regalo?: { mensaje?: string; fechaEntrega?: string; genero?: string; idioma?: string };
};

function leerCarrito(crudo: CompraBody["productos"]): Carrito {
  return {
    base: crudo?.viaje === true ? "viaje" : "pdf",
    impresos: typeof crudo?.impresos === "number" ? crudo.impresos : 0,
    marcos: typeof crudo?.marcos === "number" ? crudo.marcos : 0,
  };
}

/**
 * El contexto del narrador de un regalo (plan 2026-10-09-regalo-idiomas).
 * es-AR va de vos y sin `idioma` (CONTRATO: es-AR no se escribe); es-ES y ca
 * llevan `idioma` y no `trato`. Lo que el cuerpo haya pedido de trato o idioma
 * no cuenta: manda el idioma elegido. Como el contexto se escribe entero,
 * un reintento con otro idioma también lo actualiza.
 */
function contextoDeRegalo(base: Record<string, unknown>, regalo: DatosRegalo): Record<string, unknown> {
  const { trato: _trato, idioma: _idioma, ...resto } = base;
  const voz = regalo.idioma === "es-AR" ? { trato: "vos" } : { idioma: regalo.idioma };
  return { ...resto, regalo: true, ...voz, genero: regalo.genero };
}

export async function POST(request: NextRequest) {
  let body: CompraBody;
  try {
    body = (await request.json()) as CompraBody;
  } catch {
    return NextResponse.json({ error: "El pedido llegó mal formado." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Necesitamos un correo válido para avisarte." }, { status: 400 });
  }

  const esRegalo = body.regalo !== undefined;
  let datosRegalo: DatosRegalo | null = null;
  if (esRegalo) {
    const v = validarRegalo(body.regalo, new Date());
    if (!v.ok) return NextResponse.json({ error: v.mensaje }, { status: 400 });
    datosRegalo = v.regalo;
  }

  const validacion = validarYConstruir(body, { sinTelefono: esRegalo });
  if (!validacion.ok) {
    return NextResponse.json({ error: validacion.mensaje }, { status: validacion.status });
  }
  const { familia: familiaAInsertar } = validacion;
  const narradorAInsertar = datosRegalo
    ? { ...validacion.narrador, contexto: contextoDeRegalo(validacion.narrador.contexto, datosRegalo) }
    : validacion.narrador;

  const carrito = leerCarrito(body.productos);
  const carritoOk = validarCarrito(familiaAInsertar.region, carrito);
  if (!carritoOk.ok) return NextResponse.json({ error: carritoOk.mensaje }, { status: 400 });
  const compra = calcularCompra(familiaAInsertar.region, carrito);

  const admin = crearClienteServidor();

  // La familia: la de siempre si ya compró antes (mismo correo), o una nueva.
  // Sin auth_user_id: la cuenta la crea el login la primera vez que entra.
  const { data: existente, error: errorBusqueda } = await admin
    .from("familias")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (errorBusqueda) {
    console.error("compra: fallo la busqueda de familia", errorBusqueda);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  let familiaId = (existente as { id: string } | null)?.id ?? null;
  if (!familiaId) {
    const { data: creada, error: errorFamilia } = await admin
      .from("familias")
      .insert({ ...familiaAInsertar, email })
      .select("id")
      .single();
    if (errorFamilia || !creada) {
      console.error("compra: fallo crear la familia", errorFamilia);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }
    familiaId = (creada as { id: string }).id;
  }

  // Si un intento anterior con este WhatsApp quedó sin pagar (falló MP, cerró
  // la pestaña), se retoma ese narrador en vez de chocar con el teléfono
  // repetido. Solo si es la misma familia: un pendiente ajeno sigue dando 409.
  // Un regalo no tiene teléfono: se busca por familia y nombre (más abajo).
  const { data: pendiente } = narradorAInsertar.telefono_whatsapp
    ? await admin
        .from("narradores")
        .select("id, familia_id, estado")
        .eq("telefono_whatsapp", narradorAInsertar.telefono_whatsapp)
        .eq("estado", "pendiente_pago")
        .maybeSingle()
    : { data: null };
  let retomable = pendiente as { id: string; familia_id: string } | null;

  // Un regalo se reintenta sin teléfono: se retoma el de la misma familia que
  // quedó sin pagar, marcado como regalo y para la misma persona (mismo nombre).
  // Así un pago fallido no deja historias fantasma y el código no cambia.
  // Solo si la familia ya existía: una recién creada no tiene nada pendiente.
  if (datosRegalo && existente) {
    const { data: pendientesRegalo, error: errorPendientes } = await admin
      .from("narradores")
      .select("id, familia_id, nombre, contexto")
      .eq("familia_id", familiaId)
      .eq("estado", "pendiente_pago");
    if (errorPendientes) {
      console.error("compra: fallo la busqueda de un regalo sin pagar", errorPendientes);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }
    const mismoNombre = (n: string | null | undefined) =>
      (n ?? "").trim().toLowerCase() === narradorAInsertar.nombre.trim().toLowerCase();
    retomable =
      ((pendientesRegalo ?? []) as { id: string; familia_id: string; nombre: string | null; contexto: { regalo?: unknown } | null }[])
        .find((n) => n.contexto?.regalo === true && mismoNombre(n.nombre)) ?? null;
  }

  const { data: narrador, error: errorNarrador } =
    retomable && retomable.familia_id === familiaId
      ? await admin
          .from("narradores")
          .update({ ...narradorAInsertar, familia_id: familiaId, estado: "pendiente_pago" })
          .eq("id", retomable.id)
          .select("id")
          .single()
      : await admin
          .from("narradores")
          .insert({ ...narradorAInsertar, familia_id: familiaId, estado: "pendiente_pago" })
          .select("id")
          .single();
  if (errorNarrador || !narrador) {
    console.error("compra: fallo crear el narrador", errorNarrador);
    const esTelefonoRepetido = (errorNarrador as { code?: string } | null)?.code === "23505";
    return NextResponse.json(
      {
        error: esTelefonoRepetido
          ? "Ese WhatsApp ya tiene un libro en marcha. Si es tuyo, entra con tu correo."
          : MENSAJE_ERROR_GENERICO,
      },
      { status: esTelefonoRepetido ? 409 : 500 },
    );
  }
  const narradorId = (narrador as { id: string }).id;

  const { data: pedido, error: errorPedido } = await admin
    .from("pedidos")
    .insert({
      familia_id: familiaId,
      narrador_id: narradorId,
      proveedor: compra.region === "ES" ? "stripe" : "mercadopago",
      estado: "pendiente",
      monto: compra.total,
      moneda: compra.moneda,
      extras: datosRegalo ? { ...productosParaPedido(compra), regalo: true } : productosParaPedido(compra),
    })
    .select("id")
    .single();
  if (errorPedido || !pedido) {
    console.error("compra: fallo crear el pedido", errorPedido);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  let codigo: string | null = null;
  if (datosRegalo && retomable) {
    // Reintento del mismo regalo: se actualiza su fila y se queda con su código.
    const { data: previo, error: errorPrevio } = await admin
      .from("regalos")
      .select("id, codigo")
      .eq("narrador_id", narradorId)
      .maybeSingle();
    if (errorPrevio) {
      console.error("compra: fallo la busqueda del regalo a retomar", errorPrevio);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }
    if (previo) {
      const { id: regaloId, codigo: codigoPrevio } = previo as { id: string; codigo: string };
      const { error: errorRetomar } = await admin
        .from("regalos")
        .update({
          mensaje: datosRegalo.mensaje,
          fecha_entrega: datosRegalo.fechaEntrega,
          quien_regala: familiaAInsertar.nombre,
          pedido_id: (pedido as { id: string }).id,
        })
        .eq("id", regaloId);
      if (errorRetomar) {
        console.error("compra: fallo retomar el regalo", errorRetomar);
        return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
      }
      codigo = codigoPrevio;
    }
  }
  if (datosRegalo && !codigo) {
    // El código es único en la base: si choca (casi imposible), se prueba otro.
    for (let intento = 0; intento < 5 && !codigo; intento++) {
      const candidato = generarCodigo();
      const { error } = await admin.from("regalos").insert({
        codigo: candidato,
        narrador_id: narradorId,
        pedido_id: (pedido as { id: string }).id,
        quien_regala: familiaAInsertar.nombre,
        mensaje: datosRegalo.mensaje,
        fecha_entrega: datosRegalo.fechaEntrega,
      });
      if (!error) codigo = candidato;
      else if ((error as { code?: string }).code !== "23505") {
        console.error("compra: fallo crear el regalo", error);
        return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
      }
    }
    if (!codigo) {
      console.error("compra: cinco códigos de regalo repetidos seguidos");
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }
  }

  try {
    const { urlPago } = await crearCheckout({ id: (pedido as { id: string }).id, email }, compra);
    // Paso 5 (17/09): las fotos del álbum se suben antes de ir a pagar, sin
    // sesión, con un token atado a este narrador y de una hora (lib/token-fotos).
    return NextResponse.json(
      { urlPago, narradorId, tokenFotos: firmarTokenFotos(narradorId), ...(codigo ? { codigo } : {}) },
      { status: 200 },
    );
  } catch (err) {
    console.error("compra: fallo crear el checkout", err);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
}
