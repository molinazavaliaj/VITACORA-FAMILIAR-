import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { familiaDelUsuario } from "@/lib/familia";
import { calcularExtras, extrasPosterioresParaPedido, type ExtrasPosteriores } from "@/lib/productos";
import { crearCheckout } from "@/lib/pagos";

// Comprar extras sobre un libro que ya existe (docs/panel-usuario.md §7.3):
// copias impresas con descuento por cantidad, marcos, pasar a color. La dueña
// y los invitados pueden. Cada comprador tiene SU familia y SU pedido sobre el
// mismo narrador (CONTRATO.md): el pedido de un primo no se mezcla con el de
// Martina. El webhook lo confirma igual que la base, sin tocar al narrador.

const GENERICO = "No pudimos iniciar el pago. Intenta de nuevo en un momento.";

export async function POST(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { mensajeError: GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { narrador, user } = acceso;

  let body: Partial<ExtrasPosteriores>;
  try {
    body = (await request.json()) as Partial<ExtrasPosteriores>;
  } catch {
    return NextResponse.json({ error: "El pedido llegó mal formado." }, { status: 400 });
  }
  const elegidos: ExtrasPosteriores = {
    copias: typeof body.copias === "number" ? body.copias : 0,
    acabado: body.acabado === "color" ? "color" : "bn",
    marcos: typeof body.marcos === "number" ? body.marcos : 0,
  };

  // La región es la de la historia (el libro se produce y se envía ahí).
  const { data: familiaDuena } = await admin.from("familias").select("region").eq("id", narrador.familia_id).maybeSingle();
  const region = ((familiaDuena as { region?: "ES" | "AR" } | null)?.region) ?? "AR";

  const compra = calcularExtras(region, elegidos);
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
      extras: extrasPosterioresParaPedido(compra),
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
