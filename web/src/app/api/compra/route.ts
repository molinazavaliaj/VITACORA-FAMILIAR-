import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { validarYConstruir, type RegistroBody } from "@/lib/registro";
import { calcularCompra, extrasParaPedido, EXTRAS_VACIOS, type ExtrasElegidos } from "@/lib/productos";
import { crearCheckout } from "@/lib/pagos";

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
  extras?: Partial<ExtrasElegidos>;
};

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

  const validacion = validarYConstruir(body);
  if (!validacion.ok) {
    return NextResponse.json({ error: validacion.mensaje }, { status: validacion.status });
  }
  const { familia: familiaAInsertar, narrador: narradorAInsertar } = validacion;

  const elegidos: ExtrasElegidos = {
    impreso: body.extras?.impreso === "bn" || body.extras?.impreso === "color" ? body.extras.impreso : null,
    marcos: typeof body.extras?.marcos === "number" ? body.extras.marcos : EXTRAS_VACIOS.marcos,
  };
  const compra = calcularCompra(familiaAInsertar.region, elegidos);

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

  const { data: narrador, error: errorNarrador } = await admin
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
      extras: extrasParaPedido(compra),
    })
    .select("id")
    .single();
  if (errorPedido || !pedido) {
    console.error("compra: fallo crear el pedido", errorPedido);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  try {
    const { urlPago } = await crearCheckout({ id: (pedido as { id: string }).id, email }, compra);
    return NextResponse.json({ urlPago }, { status: 200 });
  } catch (err) {
    console.error("compra: fallo crear el checkout", err);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
}
