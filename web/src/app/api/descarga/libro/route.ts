import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";

const MENSAJE_ERROR_GENERICO = "No pudimos generar la descarga. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

type Familia = { id: string };
type Narrador = { id: string };
type Pedido = { id: string; estado: string; libro_pdf_path: string | null };

export async function GET(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    mensajeError: MENSAJE_ERROR_GENERICO, soloDuena: true,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const narrador = acceso.narrador;

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
