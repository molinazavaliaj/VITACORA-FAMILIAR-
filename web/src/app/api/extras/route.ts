import { NextRequest, NextResponse } from "next/server";
import { regionDelRequest } from "@/lib/region";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { familiaDelUsuario } from "@/lib/familia";
import { calcularCompra, productosDelPedido, productosParaPedido, validarCarrito, type Carrito } from "@/lib/productos";
import { crearCheckout } from "@/lib/pagos";

// Comprar más sobre un libro que ya existe (catálogo base + upsells, 21/09):
// impresos y marcos, con las MISMAS reglas y la misma función que el checkout
// (`calcularCompra` sin base). Lo que este comprador ya tiene cuenta como
// "previo": si ya tiene impreso paga copias (+40); si ya tiene marco, marcos
// adicionales (+15). La dueña y los invitados pueden. Cada comprador tiene SU
// familia y SU pedido sobre el mismo narrador (CONTRATO.md): el pedido de un
// primo no se mezcla con el de Martina, y sus "previos" son los suyos. El
// webhook lo confirma igual que la base, sin tocar al narrador.

const GENERICO = "No pudimos iniciar el pago. Intenta de nuevo en un momento.";

export async function POST(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { mensajeError: GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { narrador, user } = acceso;

  let body: { impresos?: unknown; marcos?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "El pedido llegó mal formado." }, { status: 400 });
  }

  // La región es la de QUIEN COMPRA (2.12, 21/09): el primo que abre el link
  // desde Argentina paga en pesos por Mercado Pago aunque el libro se haya
  // comprado en España. Sale del país del request, como en los checkouts.
  const region = regionDelRequest(request.headers);

  // Lo que este comprador ya tiene de este libro (sus pedidos no fallidos).
  const { data: familiaPrevia } = await admin.from("familias").select("id").ilike("email", user.email ?? "").maybeSingle();
  const previos = { impresos: 0, marcos: 0 };
  if (familiaPrevia) {
    const { data: pedidosPrevios } = await admin.from("pedidos").select("extras, estado").eq("narrador_id", narrador.id).eq("familia_id", (familiaPrevia as { id: string }).id).neq("estado", "fallido");
    for (const p of (pedidosPrevios as { extras: unknown }[] | null) ?? []) {
      const q = productosDelPedido(p.extras);
      previos.impresos += q.copias;
      previos.marcos += q.marcos;
    }
  }

  const carrito: Carrito = {
    base: null,
    impresos: typeof body.impresos === "number" ? body.impresos : 0,
    marcos: typeof body.marcos === "number" ? body.marcos : 0,
    impresosPrevios: previos.impresos,
    marcosPrevios: previos.marcos,
  };
  const carritoOk = validarCarrito(region, carrito);
  if (!carritoOk.ok) return NextResponse.json({ error: carritoOk.mensaje }, { status: 400 });
  const compra = calcularCompra(region, carrito);
  if (compra.lineas.length === 0 || compra.total <= 0) {
    return NextResponse.json({ error: "Elegí al menos una cosa." }, { status: 400 });
  }

  // La familia del comprador: la suya. Un invitado que nunca compró nada
  // recibe una ahora, con su correo, para que el pedido sea suyo.
  const { familia, error: errorFamilia } = await familiaDelUsuario(admin, user);
  if (errorFamilia) {
    console.error("extras: fallo la familia", errorFamilia);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }
  let familiaId = familia?.id ?? null;
  if (!familiaId) {
    if (!user.email) return NextResponse.json({ error: "Tu cuenta no tiene correo." }, { status: 400 });
    const { data: creada, error } = await admin
      .from("familias")
      .insert({ email: user.email.toLowerCase(), nombre: user.email.split("@")[0], region, auth_user_id: user.id })
      .select("id")
      .single();
    if (error || !creada) {
      console.error("extras: fallo crear la familia del comprador", error);
      return NextResponse.json({ error: GENERICO }, { status: 500 });
    }
    familiaId = (creada as { id: string }).id;
  }

  const { data: pedido, error: errorPedido } = await admin
    .from("pedidos")
    .insert({
      familia_id: familiaId,
      narrador_id: narrador.id,
      proveedor: region === "ES" ? "stripe" : "mercadopago",
      estado: "pendiente",
      monto: compra.total,
      moneda: compra.moneda,
      extras: productosParaPedido(compra),
    })
    .select("id")
    .single();
  if (errorPedido || !pedido) {
    console.error("extras: fallo crear el pedido", errorPedido);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }

  try {
    const { urlPago } = await crearCheckout({ id: (pedido as { id: string }).id, email: user.email ?? "" }, compra);
    return NextResponse.json({ urlPago }, { status: 200 });
  } catch (err) {
    console.error("extras: fallo crear el checkout", err);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }
}
