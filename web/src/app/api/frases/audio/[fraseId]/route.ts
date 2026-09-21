import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion, PUEDE } from "@/lib/panel";
import { leerFrases, tieneAudio } from "@/lib/frases";

// El mp3 de UNA frase, para el panel (dueña e invitados; el visitante no).
// Cualquier candidata cortada se puede escuchar, elegida o no: la familia
// tiene que poder oír las alternativas para cambiar.

const MENSAJE_ERROR_GENERICO = "No pudimos abrir el audio. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

export async function GET(request: NextRequest, { params }: { params: Promise<{ fraseId: string }> }) {
  const { fraseId } = await params;
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { mensajeError: MENSAJE_ERROR_GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  if (!PUEDE.verHistoriaCompleta(acceso.rol)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const frases = await leerFrases(admin, acceso.narrador.id);
  const frase = frases?.capitulos.flatMap((c) => c.candidatas).find((f) => f.id === fraseId);
  if (!frase || !tieneAudio(frase)) return NextResponse.json({ error: "Esa frase todavía no tiene audio." }, { status: 404 });

  const { data: firmado, error } = await admin.storage.from("audios").createSignedUrl(frase.audio_path!, DURACION_URL_FIRMADA_SEGUNDOS);
  if (error || !firmado?.signedUrl) {
    console.error("frases/audio: fallo al firmar la url", error);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
  return NextResponse.redirect(firmado.signedUrl, 302);
}
