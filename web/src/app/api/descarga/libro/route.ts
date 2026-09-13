import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { pedidoAMostrar } from "@/lib/pedido-a-mostrar";

const MENSAJE_ERROR_GENERICO = "No pudimos generar la descarga. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

type Familia = { id: string };
type Narrador = { id: string };

export async function GET(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    mensajeError: MENSAJE_ERROR_GENERICO, soloDuena: true,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const narrador = acceso.narrador;

  const { pedido, error: errorPedidos } = await pedidoAMostrar(admin, narrador.id);

  if (errorPedidos) {
    console.error("descarga/libro: fallo la busqueda de pedido", errorPedidos);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

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
