import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { validarYConstruir, type RegistroBody } from "@/lib/registro";

const MENSAJE_ERROR_GENERICO = "No pudimos completar el registro. Intenta de nuevo.";

export async function POST(request: NextRequest) {
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

  if (errorSesion || !user || !user.email) {
    return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });
  }

  let body: RegistroBody;
  try {
    body = (await request.json()) as RegistroBody;
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no es JSON válido." },
      { status: 400 },
    );
  }

  const resultado = validarYConstruir(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.mensaje }, { status: resultado.status });
  }

  const admin = crearClienteServidor();

  const { data: familiaExistente, error: errorBusqueda } = await admin
    .from("familias")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorBusqueda) {
    console.error("registro: fallo la busqueda de familia", errorBusqueda);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  let familiaId = (familiaExistente as { id: string } | null)?.id;

  if (!familiaId) {
    const { data: familiaCreada, error: errorFamilia } = await admin
      .from("familias")
      .insert({
        auth_user_id: user.id,
        email: user.email,
        nombre: resultado.familia.nombre,
        region: resultado.familia.region,
      })
      .select("id")
      .single();

    if (errorFamilia || !familiaCreada) {
      console.error("registro: fallo crear familia", errorFamilia);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }
    familiaId = (familiaCreada as { id: string }).id;
  }

  const { data: narradorCreado, error: errorNarrador } = await admin
    .from("narradores")
    .insert({
      familia_id: familiaId,
      ...resultado.narrador,
    })
    .select("id")
    .single();

  if (errorNarrador) {
    if ((errorNarrador as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "Ese número de WhatsApp ya tiene una bitácora en marcha." },
        { status: 409 },
      );
    }
    console.error("registro: fallo crear narrador", errorNarrador);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json(
    { narradorId: (narradorCreado as { id: string }).id },
    { status: 200 },
  );
}
