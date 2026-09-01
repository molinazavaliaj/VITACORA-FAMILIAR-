import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const MENSAJE_ERROR_GENERICO = "No pudimos guardar los nombres. Intenta de nuevo.";
const MAXIMO_CORRECCIONES = 200;

type Correccion = { original: string; corregido: string };

async function obtenerNarradorDeLaSesion(): Promise<
  | { ok: true; narrador: { id: string }; admin: ReturnType<typeof crearClienteServidor> }
  | { ok: false; status: number; error: string }
> {
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
    return { ok: false, status: 401, error: "No hay sesión activa." };
  }

  const admin = crearClienteServidor();

  const { data: familia, error: errorFamilia } = await admin
    .from("familias")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("nombres: fallo la busqueda de familia", errorFamilia);
    return { ok: false, status: 500, error: MENSAJE_ERROR_GENERICO };
  }

  if (!familia) {
    return { ok: false, status: 403, error: "No autorizado." };
  }

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id")
    .eq("familia_id", (familia as { id: string }).id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("nombres: fallo la busqueda de narrador", errorNarradores);
    return { ok: false, status: 500, error: MENSAJE_ERROR_GENERICO };
  }

  const narrador = (narradores as { id: string }[] | null)?.[0];

  if (!narrador) {
    return { ok: false, status: 404, error: "Todavía no hay una bitácora para esta familia." };
  }

  return { ok: true, narrador, admin };
}

function validarCorrecciones(valor: unknown): { ok: true; correcciones: Correccion[] } | { ok: false; mensaje: string } {
  if (!Array.isArray(valor)) {
    return { ok: false, mensaje: "Las correcciones tienen que ser una lista." };
  }
  if (valor.length > MAXIMO_CORRECCIONES) {
    return { ok: false, mensaje: `No puede haber más de ${MAXIMO_CORRECCIONES} correcciones.` };
  }
  const correcciones: Correccion[] = [];
  for (const item of valor) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as { original?: unknown }).original !== "string" ||
      typeof (item as { corregido?: unknown }).corregido !== "string"
    ) {
      return { ok: false, mensaje: "Cada corrección necesita un nombre original y uno corregido." };
    }
    const original = (item as { original: string }).original.trim();
    const corregido = (item as { corregido: string }).corregido.trim();
    if (original === "" || corregido === "") {
      return { ok: false, mensaje: "Ninguna corrección puede quedar vacía." };
    }
    correcciones.push({ original, corregido });
  }
  return { ok: true, correcciones };
}

export async function GET() {
  const sesion = await obtenerNarradorDeLaSesion();
  if (!sesion.ok) {
    return NextResponse.json({ error: sesion.error }, { status: sesion.status });
  }

  const { data: descarga } = await sesion.admin.storage
    .from("audios")
    .download(`${sesion.narrador.id}/paquete/nombres.json`);

  if (!descarga) {
    return NextResponse.json({ correcciones: [] }, { status: 200 });
  }

  try {
    const nombres = JSON.parse(await descarga.text());
    return NextResponse.json(nombres, { status: 200 });
  } catch (err) {
    console.error("nombres GET: nombres.json invalido", err);
    return NextResponse.json({ correcciones: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerNarradorDeLaSesion();
  if (!sesion.ok) {
    return NextResponse.json({ error: sesion.error }, { status: sesion.status });
  }

  let body: { correcciones?: unknown };
  try {
    body = (await request.json()) as { correcciones?: unknown };
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no es JSON válido." },
      { status: 400 },
    );
  }

  const resultado = validarCorrecciones(body.correcciones);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.mensaje }, { status: 400 });
  }

  const contenido = JSON.stringify({ correcciones: resultado.correcciones });

  const { error: errorSubida } = await sesion.admin.storage
    .from("audios")
    .upload(`${sesion.narrador.id}/paquete/nombres.json`, contenido, {
      contentType: "application/json",
      upsert: true,
    });

  if (errorSubida) {
    console.error("nombres POST: fallo la subida de nombres.json", errorSubida);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
