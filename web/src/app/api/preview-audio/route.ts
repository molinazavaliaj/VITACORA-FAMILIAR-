import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const MENSAJE_ERROR_GENERICO = "No pudimos generar la previsualización. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;
const NOMBRE_ARCHIVO = "muestra_audiolibro.mp3";

export async function GET() {
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
    console.error("preview-audio: fallo la busqueda de familia", errorFamilia);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id")
    .eq("familia_id", (familia as { id: string }).id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("preview-audio: fallo la busqueda de narrador", errorNarradores);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const narrador = (narradores as { id: string }[] | null)?.[0];

  if (!narrador) {
    return NextResponse.json(
      { error: "Todavía no hay una bitácora para esta familia." },
      { status: 404 },
    );
  }

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
