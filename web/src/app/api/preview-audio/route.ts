import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";

const MENSAJE_ERROR_GENERICO = "No pudimos generar la previsualización. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;
const NOMBRE_ARCHIVO = "muestra_audiolibro.mp3";

export async function GET(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    mensajeError: MENSAJE_ERROR_GENERICO,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const narrador = acceso.narrador;

  const { data: archivos, error: errorArchivos } = await admin.storage
    .from("audios")
    .list(`${narrador.id}/paquete`);

  if (errorArchivos) {
    console.error("preview-audio: fallo listar el paquete", errorArchivos);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const existe = (archivos ?? []).some((archivo) => archivo.name === NOMBRE_ARCHIVO);

  if (!existe) {
    return NextResponse.json(
      { error: "Tu previsualización se está preparando." },
      { status: 404 },
    );
  }

  const { data: firmado, error: errorFirmado } = await admin.storage
    .from("audios")
    .createSignedUrl(`${narrador.id}/paquete/${NOMBRE_ARCHIVO}`, DURACION_URL_FIRMADA_SEGUNDOS);

  if (errorFirmado || !firmado?.signedUrl) {
    console.error("preview-audio: fallo al firmar la url", errorFirmado);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.redirect(firmado.signedUrl, 302);
}
