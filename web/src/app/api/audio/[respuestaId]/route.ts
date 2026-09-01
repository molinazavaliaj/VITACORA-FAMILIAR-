import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const MENSAJE_ERROR_GENERICO = "No pudimos generar el audio. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ respuestaId: string }> },
) {
  const { respuestaId } = await params;

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
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("audio: fallo la busqueda de familia", errorFamilia);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { data: respuesta, error: errorRespuesta } = await admin
    .from("respuestas")
    .select("id, audio_path, narrador_id")
    .eq("id", respuestaId)
    .maybeSingle();

  if (errorRespuesta) {
    console.error("audio: fallo la busqueda de respuesta", errorRespuesta);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
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
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const datosNarrador = narrador as { id: string; familia_id: string } | null;

  if (!datosNarrador || datosNarrador.familia_id !== (familia as { id: string }).id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (!datosRespuesta.audio_path) {
    return NextResponse.json({ error: "Esta respuesta no tiene audio." }, { status: 404 });
  }

  const { data: firmado, error: errorFirmado } = await admin.storage
    .from("audios")
    .createSignedUrl(datosRespuesta.audio_path, DURACION_URL_FIRMADA_SEGUNDOS);

  if (errorFirmado || !firmado?.signedUrl) {
    console.error("audio: fallo al firmar la url", errorFirmado);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.redirect(firmado.signedUrl, 302);
}
