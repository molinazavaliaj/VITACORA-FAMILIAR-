import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { validarYConstruir, type RegistroBody } from "@/lib/registro";
import { calcularCompra, catalogo, productosParaPedido, validarCarrito, type Carrito } from "@/lib/productos";
import { crearCheckout, type OrigenCompra } from "@/lib/pagos";
import { esIdiomaWeb, regionDeIdioma } from "@/lib/idioma-web";
import { firmarTokenFotos, verificarTokenFotos } from "@/lib/token-fotos";
import { generarCodigo, validarRegalo, type DatosRegalo, type EntregaRegalo } from "@/lib/regalo";
import { entregaWhatsAppPrendida } from "@/lib/regalo-entrega";
import { intenta } from "@/lib/trato";
import { limpiarOrigen } from "@/lib/origen";
import { KIDS_TODAVIA_NO, catalogoKids, compraKids, idiomaKidsDeRegion, kidsVendeEn } from "@/lib/kids";
import { conLinkPanel, leerCompraKids, type CuerpoKids } from "@/lib/kids-compra";
import { obtenerPrecioKids } from "@/lib/precios";
import { esTablaAusente } from "@/lib/tabla-ausente";
import { urlBaseMail } from "@/lib/mail";
import { CHECKOUT_KIDS, KIDS_ERRORES_API_CA, KIDS_MISMO_NUMERO_TEXTOS } from "@/app/_textos/checkout-kids";
import type { Compra } from "@/lib/productos";
import type { SupabaseClient } from "@supabase/supabase-js";
import { carritoDeViaje } from "@/lib/viaje";
import { cuponParaLaCompra } from "@/lib/cupon-base";
import { TEXTOS_CUPON } from "@/app/_textos/cupon";
import type { TratoComprador } from "@/lib/regalo-textos";

// La compra, sin cuenta previa (pago por adelantado, 11/09). Es la única
// entrada al producto: aquí nacen la familia, el narrador y el pedido, y de
// aquí sale al proveedor de pago. Reemplaza al par registro + /api/checkout.
//
// El narrador nace en `pendiente_pago`: el entrevistador no lo mira hasta que
// el webhook confirme el cobro y lo pase a `invitado`. Si la compradora
// abandona en Stripe, quedan una familia sin usuario, un narrador en
// pendiente_pago y un pedido pendiente — inofensivos y fáciles de limpiar.

const MENSAJE_ERROR_GENERICO = (t: TratoComprador = "vos") => `No pudimos iniciar el pago. ${intenta(t)} de nuevo en un momento.`;
const MENSAJE_TELEFONO_REPETIDO = (t: TratoComprador) =>
  `Ese WhatsApp ya tiene un libro en marcha. Si es tuyo, ${t === "tu" ? "entra" : "entrá"} con tu correo.`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type CompraBody = RegistroBody & {
  email?: string;
  /**
   * La versión de la web desde donde se compra (es, ca, ar) y la pantalla
   * (rediseño 2026-10): con esto la pasarela vuelve a la ruta de ese idioma.
   * No va a la base. Sin esto, las vueltas de siempre.
   */
  idiomaWeb?: string;
  pantalla?: string;
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
  /**
   * De qué anuncio vino (F4-5): primer y último toque guardados en el
   * navegador (lib/origen.ts). Se limpia estricto y va a `pedidos.extras.origen`;
   * si viene mal, se descarta sin decir nada.
   */
  origen?: unknown;
  /**
   * Vitácora Kids (15/10): la compra de /comprar/kids manda `producto: "kids"`
   * y va por su propio camino (`comprarKids`, abajo): precio de Kids, ficha del
   * motor y fila de `kids_v2`. Sin esto, un cuerpo de Kids se cobraría como el
   * libro de una vida y el entrevistador le escribiría a un chico con las
   * preguntas de un adulto.
   */
  producto?: unknown;
  /** El código del cupón de bienvenida (rasca y gana, 20/10), tal como lo escribió. Solo el libro de una vida. */
  cupon?: unknown;
} & CuerpoKids;

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

/** De dónde salió la compra, si el cuerpo lo dice y coincide con la región; si no, nada (vueltas de siempre). */
function origenDe(body: CompraBody, region: "ES" | "AR"): OrigenCompra | undefined {
  if (!esIdiomaWeb(body.idiomaWeb) || regionDeIdioma(body.idiomaWeb) !== region) return undefined;
  if (body.producto === "kids") return { idioma: body.idiomaWeb, pantalla: "kids" };
  // «Vitácora de una historia»: si no se cobró, la pasarela vuelve a /comprar/historia (ahí se restaura lo elegido).
  if (body.narrador?.contexto?.historia !== undefined) return { idioma: body.idiomaWeb, pantalla: "historia" };
  return { idioma: body.idiomaWeb, pantalla: body.pantalla === "regalar" ? "regalar" : "comprar" };
}

/** ¿Es un narrador de Kids? (CONTRATO: `contexto.modo = "kids"`, con su fila en kids_v2). */
function esDeKids(fila: unknown): boolean {
  return (fila as { contexto?: { modo?: unknown } | null } | null)?.contexto?.modo === "kids";
}

/**
 * `pedidos.extras`: los productos, `regalo: true` si es un regalo y `origen`
 * (F4-5) solo si vino uno válido. Sin origen, exactamente lo de antes.
 */
function extrasDelPedido(compra: Compra, regalo: boolean, origenCrudo: unknown) {
  let origen: ReturnType<typeof limpiarOrigen> = null;
  try {
    origen = limpiarOrigen(origenCrudo, new Date());
  } catch {
    origen = null;
  }
  return {
    ...productosParaPedido(compra),
    ...(regalo ? { regalo: true } : {}),
    ...(origen ? { origen } : {}),
    ...(compra.creador
      ? {
          // El código de un creador (CONTRATO «Programa de creadores»): NUNCA como
          // `cupon` (lo marcaría usado y saldría el aviso de «cupón usado dos
          // veces»). La comisión nace cuando el pago entra, con este porcentaje.
          creador: { id: compra.creador.id, codigo: compra.creador.codigo, comision: compra.creador.comision },
          ...(compra.descuento ? { descuento_creador: compra.descuento } : {}),
        }
      : // El cupón de bienvenida (CONTRATO «Cupón de bienvenida»): se marca usado cuando el pago entra.
        compra.descuento
        ? { cupon: compra.descuento }
        : {}),
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
  if (body.producto === "kids") return comprarKids(body);
  // Vos o tú: el de la región que eligió en el formulario.
  const trato: TratoComprador = body.region === "ES" ? "tu" : "vos";

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Necesitamos un correo válido para avisarte." }, { status: 400 });
  }

  const esRegalo = body.regalo !== undefined;
  let datosRegalo: DatosRegalo | null = null;
  if (esRegalo) {
    const v = validarRegalo(body.regalo, new Date(), {
      whatsapp: entregaWhatsAppPrendida(),
      trato,
    });
    if (!v.ok) return NextResponse.json({ error: v.mensaje }, { status: 400 });
    datosRegalo = v.regalo;
  }

  const validacion = validarYConstruir(body, { sinTelefono: esRegalo, regalo: esRegalo });
  if (!validacion.ok) {
    // Los de historia («historia: …», lib/historia.ts) son para el log: el formulario no deja mandar nada de eso, y si
    // llega (la venta se apagó con la página abierta), la persona ve el aviso de siempre.
    if (validacion.mensaje.startsWith("historia:")) {
      console.warn(`compra: ${validacion.mensaje}`);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: validacion.status });
    }
    return NextResponse.json({ error: validacion.mensaje }, { status: validacion.status });
  }
  const { familia: familiaAInsertar } = validacion;
  const narradorAInsertar = datosRegalo
    ? { ...validacion.narrador, contexto: contextoDeRegalo(validacion.narrador.contexto, datosRegalo) }
    : validacion.narrador;

  // Viaje V2 (16/10): el carrito sale del viaje ya validado (formato y álbum),
  // no de lo que diga el navegador. Un viaje sin sus datos, o con la tarjeta de
  // regalo (el viaje se regala con el WhatsApp de quien viaja), no se cobra.
  const carritoViaje = carritoDeViaje(narradorAInsertar.contexto);
  const carritoCrudo = leerCarrito(body.productos);
  if ((carritoCrudo.base === "viaje") !== (carritoViaje !== null) || (carritoViaje && esRegalo)) {
    return NextResponse.json({ error: "Faltan los datos del viaje." }, { status: 400 });
  }
  const carrito = carritoViaje ?? carritoCrudo;
  const carritoOk = validarCarrito(familiaAInsertar.region, carrito);
  if (!carritoOk.ok) return NextResponse.json({ error: carritoOk.mensaje }, { status: 400 });
  let compra = calcularCompra(familiaAInsertar.region, carrito);

  const admin = crearClienteServidor();

  // El cupón de bienvenida (rasca y gana, 20/10) o el código de un creador
  // (21/10, mismo casillero): se valida y se calcula acá, nunca en el navegador. Si no sirve, no se cobra: se le dice por qué (nunca
  // se cobra el precio entero a quien esperaba el descuento).
  if (body.cupon !== undefined && body.cupon !== null && body.cupon !== "") {
    const idiomaCupon = esIdiomaWeb(body.idiomaWeb) ? body.idiomaWeb : familiaAInsertar.region === "AR" ? "ar" : "es";
    const TC = TEXTOS_CUPON[idiomaCupon].checkout;
    const conCupon = await cuponParaLaCompra(admin, body.cupon, compra, catalogo(familiaAInsertar.region));
    if (!conCupon.ok) {
      if ("falla" in conCupon) {
        console.error("compra: no pude revisar el cupón", conCupon.falla);
        return NextResponse.json({ error: TC.fallo }, { status: conCupon.falla === "tabla_ausente" ? 409 : 500 });
      }
      return NextResponse.json({ error: TC.motivos[conCupon.motivo], motivoCupon: conCupon.motivo }, { status: 400 });
    }
    compra = conCupon.compra;
  }

  // La familia: la de siempre si ya compró antes (mismo correo), o una nueva.
  // Sin auth_user_id: la cuenta la crea el login la primera vez que entra.
  const { data: existente, error: errorBusqueda } = await admin
    .from("familias")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (errorBusqueda) {
    console.error("compra: fallo la busqueda de familia", errorBusqueda);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
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
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
    }
    familiaId = (creada as { id: string }).id;
  }

  // Si un intento anterior con este WhatsApp quedó sin pagar (falló MP, cerró
  // la pestaña), se retoma ese narrador en vez de chocar con el teléfono
  // repetido. Solo si es la misma familia: un pendiente ajeno sigue dando 409.
  // Un regalo no tiene teléfono: se retoma solo con la prueba de la compra
  // anterior (más abajo). Un pendiente de Kids no se retoma como biografía:
  // tiene su fila en kids_v2 y el entrevistador lo trataría como un chico.
  const { data: pendiente } = narradorAInsertar.telefono_whatsapp
    ? await admin
        .from("narradores")
        .select("id, familia_id, estado, contexto")
        .eq("telefono_whatsapp", narradorAInsertar.telefono_whatsapp)
        .eq("estado", "pendiente_pago")
        .maybeSingle()
    : { data: null };
  let retomable = esDeKids(pendiente) ? null : (pendiente as { id: string; familia_id: string } | null);

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
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
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
        error: esTelefonoRepetido ? MENSAJE_TELEFONO_REPETIDO(trato) : MENSAJE_ERROR_GENERICO(trato),
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
      extras: extrasDelPedido(compra, datosRegalo !== null, body.origen),
    })
    .select("id")
    .single();
  if (errorPedido || !pedido) {
    console.error("compra: fallo crear el pedido", errorPedido);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
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
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
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
        return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
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
        return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
      }
    }
    if (!regaloListo) {
      console.error("compra: cinco códigos de regalo repetidos seguidos");
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
    }
  }

  try {
    // Sin origen (otra pantalla, un cliente viejo), el llamado de siempre.
    const datosPedido = { id: (pedido as { id: string }).id, email };
    const origen = origenDe(body, compra.region);
    const { urlPago } = await (origen ? crearCheckout(datosPedido, compra, origen) : crearCheckout(datosPedido, compra));
    // Paso 5 (17/09): las fotos del álbum se suben antes de ir a pagar, sin
    // sesión, con un token atado a este narrador y de una hora (lib/token-fotos).
    return NextResponse.json(
      { urlPago, narradorId, tokenFotos: firmarTokenFotos(narradorId) },
      { status: 200 },
    );
  } catch (err) {
    console.error("compra: fallo crear el checkout", err);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
  }
}

// ── Vitácora Kids (K4, 15/10) ────────────────────────────────────────────────
//
// Lo mismo que la compra de siempre (familia por correo, narrador en
// pendiente_pago, pedido pendiente, pasarela), con lo de Kids del CONTRATO
// («Vitácora Kids V2 por WhatsApp»): el precio de Kids, `contexto.modo =
// "kids"`, `extras.tipo = "kids"` y la fila de `kids_v2` con la ficha. Si algo
// falla después de crear el narrador, se borra lo que nació en ESTE pedido
// (un chico a medias sin su fila en kids_v2 lo agarraría el entrevistador
// como a un adulto). Sin la migración de kids_v2, lo mismo y 409: no se vende.

/** «Todavía no se vende», de tú, de vos o en catalán (lib/kids.ts y _textos/checkout-kids). */
const kidsTodaviaNo = (region: "ES" | "AR", idiomaWeb?: unknown) =>
  region === "AR" ? CHECKOUT_KIDS.ar.proximamenteTexto : idiomaWeb === "ca" ? CHECKOUT_KIDS.ca.proximamenteTexto : KIDS_TODAVIA_NO;

/** Borra lo que nació en este pedido, del último al primero. Si un borrado falla, se loguea y se sigue. */
async function deshacer(admin: SupabaseClient, creado: { familiaId?: string; narradorId?: string; kids?: boolean }) {
  const pasos: [string, string, string | undefined][] = [
    ["kids_v2", "narrador_id", creado.kids ? creado.narradorId : undefined],
    ["narradores", "id", creado.narradorId],
    ["familias", "id", creado.familiaId],
  ];
  for (const [tabla, columna, id] of pasos) {
    if (!id) continue;
    const { error } = await admin.from(tabla).delete().eq(columna, id);
    if (error) console.error(`compra kids: no pude borrar ${tabla} ${id} al deshacer`, error);
  }
}

async function comprarKids(body: CompraBody): Promise<NextResponse> {
  if (body.region !== "ES" && body.region !== "AR") {
    return NextResponse.json({ error: "La región debe ser España o Argentina." }, { status: 400 });
  }
  const region = body.region;
  const trato: TratoComprador = region === "ES" ? "tu" : "vos";
  // KIDS_VENTA, precio y región (KIDS_REGIONES: AR y ES). /ar es Argentina; la
  // web de España en castellano y /ca son España (mismo precio, zona y hora; la
  // de /ca en catalán, Naza 16/10, tanda 10). Sin idiomaWeb, el de la región.
  const idiomaWeb = body.idiomaWeb === undefined ? (region === "AR" ? "ar" : "es") : body.idiomaWeb;
  const idiomaDeLaRegion = region === "AR" ? idiomaWeb === "ar" : idiomaWeb === "es" || idiomaWeb === "ca";
  if (!idiomaDeLaRegion || !kidsVendeEn(idiomaWeb as "ar" | "es" | "ca")) return NextResponse.json({ error: kidsTodaviaNo(region, body.idiomaWeb) }, { status: 409 });
  const precio = obtenerPrecioKids(region) as number;
  // En catalán, los avisos del servidor también (KIDS_ERRORES_API_CA).
  const ca = idiomaWeb === "ca";

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: ca ? KIDS_ERRORES_API_CA.correo : "Necesitamos un correo válido para avisarte." }, { status: 400 });
  }
  const leida = leerCompraKids({ ...body, idiomaWeb }, region);
  if (!leida.ok) {
    // mismoNumero: el aviso aprobado (en vos el 15/10, en tú el 16/10, tanda 8; en catalán, tanda 10).
    const error =
      leida.falla === "mismoNumero"
        ? KIDS_MISMO_NUMERO_TEXTOS[idiomaKidsDeRegion(region, idiomaWeb)]
        : leida.falla === "telefono"
        ? ca
          ? KIDS_ERRORES_API_CA.telefono
          : trato === "tu"
          ? "El WhatsApp no parece un número válido. Revísalo e intenta de nuevo."
          : "El WhatsApp no parece un número válido. Revisalo e intentá de nuevo."
        : ca
        ? KIDS_ERRORES_API_CA.malFormado
        : "El pedido llegó mal formado.";
    return NextResponse.json({ error }, { status: 400 });
  }
  const { familia: familiaAInsertar, narrador: narradorAInsertar, canal, telefonoPadre, ficha, idioma } = leida.compra;

  // El libro impreso (Naza 15/10, tanda 3, punto 10): como la casa, el cliente
  // manda solo cuántos impresos; el precio sale del catálogo de la casa
  // (PRECIO_IMPRESO_*, PRECIO_COPIA_*) sumado al de Kids. Cualquier monto, total
  // o marco que mande el cliente se ignora. La base va con id "pdf" para que
  // `extras` diga lo de siempre (`pdf: true`: trae la base).
  const carrito: Carrito = { base: "pdf", impresos: leerCarrito(body.productos).impresos, marcos: 0 };
  const carritoOk = validarCarrito(region, carrito);
  if (!carritoOk.ok) return NextResponse.json({ error: carritoOk.mensaje }, { status: 400 });
  const compra: Compra = compraKids(catalogoKids(catalogo(region), precio), region, carrito.impresos);

  const admin = crearClienteServidor();
  const generico = () => NextResponse.json({ error: ca ? KIDS_ERRORES_API_CA.generico : MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });

  // eq y no ilike: el correo ya va en minúsculas, y en ilike un «_» o un «%»
  // del correo son comodines (la biografía, arriba, tiene el mismo problema).
  const { data: existente, error: errorBusqueda } = await admin.from("familias").select("id").eq("email", email).maybeSingle();
  if (errorBusqueda) {
    console.error("compra kids: fallo la busqueda de familia", errorBusqueda);
    return generico();
  }
  let familiaId = (existente as { id: string } | null)?.id ?? null;
  let familiaCreada: string | undefined;
  if (!familiaId) {
    const { data: creada, error: errorFamilia } = await admin
      .from("familias")
      .insert({ ...familiaAInsertar, email })
      .select("id")
      .single();
    if (errorFamilia || !creada) {
      console.error("compra kids: fallo crear la familia", errorFamilia);
      return generico();
    }
    familiaId = (creada as { id: string }).id;
    familiaCreada = familiaId;
  }

  // Un intento anterior sin pagar con el mismo número de las preguntas, de esta
  // familia y de Kids, se retoma (como la compra de siempre). Un pendiente que
  // no es de Kids, o de otra familia, sigue dando 409 al insertar.
  const { data: pendiente } = await admin
    .from("narradores")
    .select("id, familia_id, estado, contexto")
    .eq("telefono_whatsapp", narradorAInsertar.telefono_whatsapp)
    .eq("estado", "pendiente_pago")
    .maybeSingle();
  const previo = pendiente as { id: string; familia_id: string } | null;
  const retomable = previo && previo.familia_id === familiaId && esDeKids(previo) ? previo : null;

  let narradorId: string | null = null;
  let narradorCreado: string | undefined;
  let errorNarrador: unknown = null;
  if (retomable) {
    const retomado = await admin
      .from("narradores")
      .update({ ...narradorAInsertar, familia_id: familiaId, estado: "pendiente_pago" })
      .eq("id", retomable.id)
      .eq("estado", "pendiente_pago")
      .select("id")
      .maybeSingle();
    if (retomado.error) errorNarrador = retomado.error;
    else if (retomado.data) narradorId = (retomado.data as { id: string }).id;
  }
  if (!narradorId && !errorNarrador) {
    const creado = await admin
      .from("narradores")
      .insert({ ...narradorAInsertar, familia_id: familiaId, estado: "pendiente_pago" })
      .select("id")
      .single();
    errorNarrador = creado.error;
    narradorId = (creado.data as { id: string } | null)?.id ?? null;
    narradorCreado = narradorId ?? undefined;
  }
  if (errorNarrador || !narradorId) {
    console.error("compra kids: fallo crear el narrador", errorNarrador);
    await deshacer(admin, { familiaId: familiaCreada });
    const repetido = (errorNarrador as { code?: string } | null)?.code === "23505";
    return repetido ? NextResponse.json({ error: ca ? KIDS_ERRORES_API_CA.repetido : MENSAJE_TELEFONO_REPETIDO(trato) }, { status: 409 }) : generico();
  }

  // La fila del chico. upsert: un reintento del mismo chico ya tiene la suya
  // (sin arrancar: el entrevistador no mira un pendiente_pago).
  const { error: errorKids } = await admin.from("kids_v2").upsert(
    {
      narrador_id: narradorId,
      // El mismo que ficha.idioma (lib/kids-compra.ts): si no son iguales, el bot no arranca.
      idioma,
      canal,
      telefono_padre: telefonoPadre,
      ficha: conLinkPanel(ficha, narradorId, urlBaseMail()),
    },
    { onConflict: "narrador_id" },
  );
  if (errorKids) {
    console.error("compra kids: fallo crear la fila de kids_v2", errorKids);
    await deshacer(admin, { familiaId: familiaCreada, narradorId: narradorCreado });
    return esTablaAusente(errorKids) ? NextResponse.json({ error: kidsTodaviaNo(region, idiomaWeb) }, { status: 409 }) : generico();
  }

  const { data: pedido, error: errorPedido } = await admin
    .from("pedidos")
    .insert({
      familia_id: familiaId,
      narrador_id: narradorId,
      proveedor: region === "ES" ? "stripe" : "mercadopago",
      estado: "pendiente",
      monto: compra.total,
      moneda: compra.moneda,
      extras: { ...extrasDelPedido(compra, false, body.origen), tipo: "kids" },
    })
    .select("id")
    .single();
  if (errorPedido || !pedido) {
    console.error("compra kids: fallo crear el pedido", errorPedido);
    await deshacer(admin, { familiaId: familiaCreada, narradorId: narradorCreado, kids: true });
    return generico();
  }

  try {
    // Si la pasarela falla, queda todo en pendiente (como la compra de siempre): el reintento lo retoma.
    const datosPedido = { id: (pedido as { id: string }).id, email };
    const origen = origenDe(body, region);
    const { urlPago } = await (origen ? crearCheckout(datosPedido, compra, origen) : crearCheckout(datosPedido, compra));
    return NextResponse.json({ urlPago, narradorId, tokenFotos: firmarTokenFotos(narradorId) }, { status: 200 });
  } catch (err) {
    console.error("compra kids: fallo crear el checkout", err);
    return generico();
  }
}
