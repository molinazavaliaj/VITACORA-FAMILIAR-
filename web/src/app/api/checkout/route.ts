import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearCheckout } from "@/lib/pagos";
import { obtenerPrecio } from "@/lib/precios";

const MENSAJE_ERROR_GENERICO = "No pudimos iniciar el pago. Intenta de nuevo.";
const ESTADOS_QUE_PERMITEN_COMPRA = ["completado", "cerrado_anticipado"];
const ESTADOS_PEDIDO_YA_PAGADO = ["pagado", "generando", "entregado"];

type Familia = { id: string; email: string; region: "ES" | "AR" };
type Narrador = { id: string; estado: string };
type Pedido = { id: string; estado: string };

export async function POST() {
  const cookieStore = await cookies();
  const supabaseSesion = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error: errorSesion,
  } = await supabaseSesion.auth.getUser();

  if (errorSesion || !user) {
    return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });
  }

  const admin = crearClienteServidor();

  const { data: familia, error: errorFamilia } = await admin
    .from("familias")
    .select("id, email, region")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("checkout: fallo la busqueda de familia", errorFamilia);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const datosFamilia = familia as Familia;

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id, estado")
    .eq("familia_id", datosFamilia.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("checkout: fallo la busqueda de narrador", errorNarradores);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const narrador = (narradores as Narrador[] | null)?.[0];

  if (!narrador) {
    return NextResponse.json(
      { error: "Todavía no hay una bitácora para esta familia." },
      { status: 404 },
    );
  }

  if (!ESTADOS_QUE_PERMITEN_COMPRA.includes(narrador.estado)) {
    return NextResponse.json(
      { error: "Todavía no terminamos de armar su libro. Te avisamos apenas esté listo." },
      { status: 409 },
    );
  }

  const { data: pedidosExistentes, error: errorPedidos } = await admin
    .from("pedidos")
    .select("id, estado")
    .eq("narrador_id", narrador.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorPedidos) {
    console.error("checkout: fallo la busqueda de pedidos", errorPedidos);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const pedidoExistente = (pedidosExistentes as Pedido[] | null)?.[0];

  if (pedidoExistente && ESTADOS_PEDIDO_YA_PAGADO.includes(pedidoExistente.estado)) {
    return NextResponse.json({ error: "Este pedido ya está pagado." }, { status: 409 });
  }

  let pedidoId: string;

  if (pedidoExistente && pedidoExistente.estado === "pendiente") {
    pedidoId = pedidoExistente.id;
  } else {
    const proveedor = datosFamilia.region === "ES" ? "stripe" : "mercadopago";
    const { monto, moneda } = obtenerPrecio(datosFamilia.region);

    const { data: pedidoCreado, error: errorCrear } = await admin
      .from("pedidos")
      .insert({
        familia_id: datosFamilia.id,
        narrador_id: narrador.id,
        proveedor,
        estado: "pendiente",
        monto,
        moneda,
      })
      .select("id")
      .single();

    if (errorCrear || !pedidoCreado) {
      console.error("checkout: fallo crear el pedido", errorCrear);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }

    pedidoId = (pedidoCreado as { id: string }).id;
  }

  try {
    const { urlPago } = await crearCheckout({
      id: pedidoId,
      region: datosFamilia.region,
      email: datosFamilia.email,
    });
    return NextResponse.json({ urlPago }, { status: 200 });
  } catch (err) {
    console.error("checkout: fallo crear el checkout", err);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
}
