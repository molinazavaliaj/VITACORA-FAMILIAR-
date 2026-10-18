import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { intenta } from "@/lib/trato";
import { tratoDeRegion, type TratoComprador } from "@/lib/regalo-textos";
import { rutaCandado } from "@/lib/audio-borrado";

const MENSAJE_ERROR_GENERICO = (t: TratoComprador = "vos") => `No pudimos generar el audio. ${intenta(t)} de nuevo.`;
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;
/**
 * Cuándo se borraron los audios originales de ese narrador, o null si siguen.
 * El candado guarda la fecha en ISO. Si Storage falla, se devuelve null: ante la
 * duda es mejor intentar reproducir que decirle a una familia que su audio no está.
 */
async function fechaDeBorrado(admin: ReturnType<typeof crearClienteServidor>, narradorId: string): Promise<string | null> {
  try {
    const { data, error } = await admin.storage.from("audios").download(rutaCandado(narradorId));
    if (error || !data) return null;
    const texto = (await data.text()).trim();
    return texto || null;
  } catch (err) {
    console.error("audio: no pude leer el candado de borrado", err);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ respuestaId: string }> },
) {
  const { respuestaId } = await params;

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
    .select("id, region")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("audio: fallo la busqueda de familia", errorFamilia);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO() }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  // Vos o tú: la familia es la dueña de la historia (se verifica abajo).
  const trato = tratoDeRegion((familia as { region?: string }).region === "ES" ? "ES" : "AR");

  const { data: respuesta, error: errorRespuesta } = await admin
    .from("respuestas")
    .select("id, audio_path, narrador_id")
    .eq("id", respuestaId)
    .maybeSingle();

  if (errorRespuesta) {
    console.error("audio: fallo la busqueda de respuesta", errorRespuesta);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
  }

  if (!respuesta) {
    return NextResponse.json({ error: "No encontramos ese audio." }, { status: 404 });
  }

  const datosRespuesta = respuesta as {
    id: string;
    audio_path: string | null;
    narrador_id: string;
  };

  const { data: narrador, error: errorNarrador } = await admin
    .from("narradores")
    .select("id, familia_id")
    .eq("id", datosRespuesta.narrador_id)
    .maybeSingle();

  if (errorNarrador) {
    console.error("audio: fallo la busqueda de narrador", errorNarrador);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
  }

  const datosNarrador = narrador as { id: string; familia_id: string } | null;

  if (!datosNarrador || datosNarrador.familia_id !== (familia as { id: string }).id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (!datosRespuesta.audio_path) {
    return NextResponse.json({ error: "Esta respuesta no tiene audio." }, { status: 404 });
  }

  // Los audios originales se borran a los 3 meses del libro, avisando antes por
  // mail (fabrica/src/audios-originales.ts). El archivo desaparece de Storage
  // pero `respuestas.audio_path` queda: sin esto la URL se firma igual, el
  // navegador no encuentra nada y el reproductor se queda mudo al tocar play.
  // Mejor decir qué pasó, y cuándo.
  const borradoEl = await fechaDeBorrado(admin, datosNarrador.id);
  if (borradoEl) {
    return NextResponse.json({ error: "Este audio ya no está.", borradoEl }, { status: 410 });
  }

  const { data: firmado, error: errorFirmado } = await admin.storage
    .from("audios")
    .createSignedUrl(datosRespuesta.audio_path, DURACION_URL_FIRMADA_SEGUNDOS);

  if (errorFirmado || !firmado?.signedUrl) {
    console.error("audio: fallo al firmar la url", errorFirmado);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
  }

  return NextResponse.redirect(firmado.signedUrl, 302);
}
