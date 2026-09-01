import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const MENSAJE_ERROR_GENERICO = "No pudimos cargar la estructura del libro. Intenta de nuevo.";

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
    console.error("estructura GET: fallo la busqueda de familia", errorFamilia);
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
    console.error("estructura GET: fallo la busqueda de narrador", errorNarradores);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const narrador = (narradores as { id: string }[] | null)?.[0];

  if (!narrador) {
    return NextResponse.json({ error: "Todavía no hay una bitácora para esta familia." }, { status: 404 });
  }

  const { data: descarga, error: errorDescarga } = await admin.storage
    .from("audios")
    .download(`${narrador.id}/paquete/estructura.json`);

  if (errorDescarga || !descarga) {
    return NextResponse.json(
      { error: "Todavía no armamos la estructura del libro." },
      { status: 404 },
    );
  }

  let estructura: unknown;
  try {
    estructura = JSON.parse(await descarga.text());
  } catch (err) {
    console.error("estructura GET: estructura.json invalido", err);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json(estructura, { status: 200 });
}
