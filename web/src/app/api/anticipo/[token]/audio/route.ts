import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenAnticipo } from "@/lib/token-anticipo";

// El minuto de su voz, servido por token y SIN sesión: es la pieza que
// convence, y pedirle un código de 6 dígitos antes de dejarla escuchar sería
// perder la venta en la puerta. El token firmado es la autorización.

const DURACION_URL_FIRMADA_SEGUNDOS = 3600;
const NOMBRE_ARCHIVO = "anticipo_muestra.mp3";

export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const datosToken = verificarTokenAnticipo(token);
  if (!datosToken) {
    return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });
  }

  const admin = crearClienteServidor();

  const { data: firmado, error } = await admin.storage
    .from("audios")
    .createSignedUrl(
      `${datosToken.narradorId}/paquete/${NOMBRE_ARCHIVO}`,
      DURACION_URL_FIRMADA_SEGUNDOS,
    );

  if (error || !firmado?.signedUrl) {
    // Sin muestra no es un error del enlace: hay narradores que responden
    // escribiendo y nunca mandan un audio. La página lo contempla.
    return NextResponse.json({ error: "Todavía no hay audio." }, { status: 404 });
  }

  return NextResponse.redirect(firmado.signedUrl, 302);
}
