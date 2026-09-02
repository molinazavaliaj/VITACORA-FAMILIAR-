import { NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const MENSAJE_ERROR_GENERICO = "No pudimos generar la descarga. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

type Familia = { id: string };
type Narrador = { id: string };
type Pedido = { id: string; estado: string; libro_pdf_path: string | null };

export async function GET() {
  const supabaseSesion = await crearClienteSesion();

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
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("descarga/libro: fallo la busqueda de familia", errorFamilia);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id")
    .eq("familia_id", (familia as Familia).id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("descarga/libro: fallo la busqueda de narrador", errorNarradores);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const narrador = (narradores as Narrador[] | null)?.[0];

  if (!narrador) {
    return NextResponse.json(
      { error: "Todavía no hay una bitácora para esta familia." },
      { status: 404 },
    );
  }

  const { data: pedidos, error: errorPedidos } = await admin
    .from("pedidos")
    .select("id, estado, libro_pdf_path")
    .eq("narrador_id", narrador.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorPedidos) {
    console.error("descarga/libro: fallo la busqueda de pedido", errorPedidos);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const pedido = (pedidos as Pedido[] | null)?.[0];

  if (!pedido || pedido.estado !== "entregado" || !pedido.libro_pdf_path) {
    return NextResponse.json({ error: "Tu libro todavía no está listo." }, { status: 404 });
  }

  const { data: firmado, error: errorFirmado } = await admin.storage
    .from("audios")
    .createSignedUrl(pedido.libro_pdf_path, DURACION_URL_FIRMADA_SEGUNDOS);

  if (errorFirmado || !firmado?.signedUrl) {
    console.error("descarga/libro: fallo al firmar la url", errorFirmado);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.redirect(firmado.signedUrl, 302);
}
