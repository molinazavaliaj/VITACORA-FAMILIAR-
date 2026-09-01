import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const MENSAJE_ERROR_GENERICO = "No pudimos borrar el saludo. Intenta de nuevo.";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ saludoId: string }> },
) {
  const { saludoId } = await params;

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
    console.error("saludos DELETE: fallo la busqueda de familia", errorFamilia);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { data: saludo, error: errorSaludo } = await admin
    .from("saludos")
    .select("id, audio_path, narrador_id, entregado")
    .eq("id", saludoId)
    .maybeSingle();

  if (errorSaludo) {
    console.error("saludos DELETE: fallo la busqueda de saludo", errorSaludo);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  if (!saludo) {
    return NextResponse.json({ error: "No encontramos ese saludo." }, { status: 404 });
  }

  const datosSaludo = saludo as {
    id: string;
    audio_path: string;
    narrador_id: string;
    entregado: boolean;
  };

  const { data: narrador, error: errorNarrador } = await admin
    .from("narradores")
    .select("id, familia_id")
    .eq("id", datosSaludo.narrador_id)
    .maybeSingle();

  if (errorNarrador) {
    console.error("saludos DELETE: fallo la busqueda de narrador", errorNarrador);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const datosNarrador = narrador as { id: string; familia_id: string } | null;

  if (!datosNarrador || datosNarrador.familia_id !== (familia as { id: string }).id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (datosSaludo.entregado) {
    return NextResponse.json(
      { error: "Este saludo ya se entregó y no se puede borrar." },
      { status: 409 },
    );
  }

  const { error: errorRemove } = await admin.storage.from("audios").remove([datosSaludo.audio_path]);

  if (errorRemove) {
    console.error("saludos DELETE: fallo borrar el archivo", errorRemove);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const { error: errorDelete } = await admin.from("saludos").delete().eq("id", saludoId);

  if (errorDelete) {
    console.error("saludos DELETE: fallo borrar la fila", errorDelete);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
