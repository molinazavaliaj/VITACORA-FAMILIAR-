import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { validarYConstruir, type RegistroBody } from "@/lib/registro";
import { calcularCompra, productosParaPedido, validarCarrito, type Carrito } from "@/lib/productos";
import { crearCheckout } from "@/lib/pagos";
import { firmarTokenFotos, verificarTokenFotos } from "@/lib/token-fotos";
import { generarCodigo, validarRegalo, type DatosRegalo, type EntregaRegalo } from "@/lib/regalo";
import { entregaWhatsAppPrendida } from "@/lib/regalo-entrega";

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
  /**
   * Gift card (08/10): sin teléfono del narrador; nace un código. `retomar`
   * (09/10) es la prueba de un intento anterior sin pagar: el narradorId y el
   * tokenFotos que devolvió aquella compra.
   */
  regalo?: {
    mensaje?: string;
    fechaEntrega?: string;
    genero?: string;
    idioma?: string;
    /** Mandárselo solo el día elegido (10/10). La zona no viene: sale del idioma. */
    entrega?: { canal?: unknown; contacto?: unknown; hora?: unknown };
    retomar?: { narradorId?: unknown; token?: unknown };
  };
};

/**
 * La prueba para retomar un regalo sin pagar, si viene y el token verifica
 * para ese narrador. Un token malo no es un error: se ignora y nace otro regalo.
 */
function leerRetomar(regalo: CompraBody["regalo"]): { narradorId: string } | null {
  const crudo = regalo?.retomar as unknown;
  if (!crudo || typeof crudo !== "object") return null;
  const { narradorId, token } = crudo as { narradorId?: unknown; token?: unknown };
  if (typeof narradorId !== "string" || !narradorId || typeof token !== "string") return null;
  return verificarTokenFotos(token, narradorId) ? { narradorId } : null;
}

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

/** Las columnas de la entrega en `regalos` (migración 20261010000000), o todas en null. */
function columnasEntrega(e: EntregaRegalo | null) {
  return {
    entrega_canal: e?.canal ?? null,
    entrega_contacto: e?.contacto ?? null,
    entrega_hora: e?.hora ?? null,
    entrega_zona: e?.zona ?? null,
  };
}

/** PostgREST no conoce la columna: la migración de la entrega todavía no se aplicó. */
function faltaColumna(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "PGRST204" || code === "42703";
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
    const v = validarRegalo(body.regalo, new Date(), { whatsapp: entregaWhatsAppPrendida() });
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
  // Un regalo no tiene teléfono: se retoma solo con la prueba de la compra
  // anterior (más abajo).
  const { data: pendiente } = narradorAInsertar.telefono_whatsapp
    ? await admin
        .from("narradores")
        .select("id, familia_id, estado")
        .eq("telefono_whatsapp", narradorAInsertar.telefono_whatsapp)
        .eq("estado", "pendiente_pago")
        .maybeSingle()
    : { data: null };
  let retomable = pendiente as { id: string; familia_id: string } | null;

  // Un regalo se reintenta sin teléfono (09/10, antes de vender): se retoma
  // SOLO con la prueba de la compra anterior, el tokenFotos que devolvió esta
  // misma ruta (una hora, atado al narrador). Saber el correo y el nombre del
  // abuelo no alcanza. Además el narrador tiene que ser de esta familia, seguir
  // en pendiente_pago, ser un regalo y ser para la misma persona (mismo nombre,
  // sin mayúsculas ni espacios de más): un regalo para otro abuelo en la misma
  // pestaña no pisa el anterior sin pagar. Si algo falla, nace un regalo nuevo.
  // Solo si la familia ya existía: una recién creada no tiene nada pendiente.
  const prueba = datosRegalo && existente ? leerRetomar(body.regalo) : null;
  if (prueba) {
    const { data: candidato, error: errorCandidato } = await admin
      .from("narradores")
      .select("id, familia_id, nombre, estado, contexto")
      .eq("id", prueba.narradorId)
      .maybeSingle();
    if (errorCandidato) {
      console.error("compra: fallo la busqueda del regalo a retomar", errorCandidato);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }
    const n = candidato as
      | { id: string; familia_id: string; nombre: string | null; estado: string; contexto: { regalo?: unknown } | null }
      | null;
    const mismoNombre = (nombre: string | null | undefined) =>
      (nombre ?? "").trim().toLowerCase() === narradorAInsertar.nombre.trim().toLowerCase();
    retomable =
      n &&
      n.familia_id === familiaId &&
      n.estado === "pendiente_pago" &&
      n.contexto?.regalo === true &&
      mismoNombre(n.nombre)
        ? { id: n.id, familia_id: n.familia_id }
        : null;
  }

  let narrador: unknown = null;
  let errorNarrador: unknown = null;
  if (retomable && retomable.familia_id === familiaId) {
    // Solo si sigue en pendiente_pago: si el pago viejo entró entre la búsqueda
    // y este update, no se lo devuelve a pendiente_pago. Sin fila, se sigue
    // como una primera compra (narrador y regalo nuevos).
    const retomado = await admin
      .from("narradores")
      .update({ ...narradorAInsertar, familia_id: familiaId, estado: "pendiente_pago" })
      .eq("id", retomable.id)
      .eq("estado", "pendiente_pago")
      .select("id")
      .maybeSingle();
    if (retomado.error) errorNarrador = retomado.error;
    else if (retomado.data) narrador = retomado.data;
    else retomable = null;
  }
  if (!narrador && !errorNarrador) {
    const creado = await admin
      .from("narradores")
      .insert({ ...narradorAInsertar, familia_id: familiaId, estado: "pendiente_pago" })
      .select("id")
      .single();
    narrador = creado.data;
    errorNarrador = creado.error;
  }
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

  // El código del regalo no sale en la respuesta (09/10): la tarjeta se busca en
  // la base después del pago (pago/vuelta y confirmarPago).
  let regaloListo = false;
  if (datosRegalo && retomable) {
    // Reintento del mismo regalo: se actualiza su fila y se queda con su código.
    const { data: previo, error: errorPrevio } = await admin
      .from("regalos")
      .select("id")
      .eq("narrador_id", narradorId)
      .maybeSingle();
    if (errorPrevio) {
      console.error("compra: fallo la busqueda del regalo a retomar", errorPrevio);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }
    if (previo) {
      const { id: regaloId } = previo as { id: string };
      const cambios = {
        mensaje: datosRegalo.mensaje,
        fecha_entrega: datosRegalo.fechaEntrega,
        quien_regala: familiaAInsertar.nombre,
        pedido_id: (pedido as { id: string }).id,
      };
      // Siempre con las columnas de la entrega: sin entrega, se borra la que
      // hubiera elegido antes. Si la migración todavía no está y no pidió
      // entrega, se reintenta sin ellas (con entrega, el error sigue: no se
      // puede guardar lo que pidió).
      let { error: errorRetomar } = await admin
        .from("regalos")
        .update({ ...cambios, ...columnasEntrega(datosRegalo.entrega) })
        .eq("id", regaloId);
      if (errorRetomar && !datosRegalo.entrega && faltaColumna(errorRetomar)) {
        ({ error: errorRetomar } = await admin.from("regalos").update(cambios).eq("id", regaloId));
      }
      if (errorRetomar) {
        console.error("compra: fallo retomar el regalo", errorRetomar);
        return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
      }
      regaloListo = true;
    }
  }
  if (datosRegalo && !regaloListo) {
    // El código es único en la base: si choca (casi imposible), se prueba otro.
    for (let intento = 0; intento < 5 && !regaloListo; intento++) {
      const candidato = generarCodigo();
      const { error } = await admin.from("regalos").insert({
        codigo: candidato,
        narrador_id: narradorId,
        pedido_id: (pedido as { id: string }).id,
        quien_regala: familiaAInsertar.nombre,
        mensaje: datosRegalo.mensaje,
        fecha_entrega: datosRegalo.fechaEntrega,
        // Solo si pidió entrega: así un regalo sin entrega anda sin la migración.
        ...(datosRegalo.entrega ? columnasEntrega(datosRegalo.entrega) : {}),
      });
      if (!error) regaloListo = true;
      else if ((error as { code?: string }).code !== "23505") {
        console.error("compra: fallo crear el regalo", error);
        return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
      }
    }
    if (!regaloListo) {
      console.error("compra: cinco códigos de regalo repetidos seguidos");
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }
  }

  try {
    const { urlPago } = await crearCheckout({ id: (pedido as { id: string }).id, email }, compra);
    // Paso 5 (17/09): las fotos del álbum se suben antes de ir a pagar, sin
    // sesión, con un token atado a este narrador y de una hora (lib/token-fotos).
    return NextResponse.json(
      { urlPago, narradorId, tokenFotos: firmarTokenFotos(narradorId) },
      { status: 200 },
    );
  } catch (err) {
    console.error("compra: fallo crear el checkout", err);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
}
