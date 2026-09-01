import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const MENSAJE_ERROR_GENERICO = "No pudimos generar la descarga. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

type Familia = { id: string };
type Narrador = { id: string };
type AudiolibroPaths = { capitulos: string[]; bonus?: string; completo: string };
type Pedido = { id: string; estado: string; audiolibro_paths: AudiolibroPaths | null };

// `indice` es "bonus", "completo", o la posición (0-based) del capítulo
// dentro de audiolibro_paths.capitulos — así lo arma el tablero al listar
// los links de descarga.
function resolverRuta(indice: string, paths: AudiolibroPaths): string | null {
  if (indice === "bonus") return paths.bonus ?? null;
  if (indice === "completo") return paths.completo ?? null;

  if (!/^\d+$/.test(indice)) return null;
  const posicion = Number(indice);
  if (posicion < 0 || posicion >= paths.capitulos.length) return null;
  return paths.capitulos[posicion];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ indice: string }> },
) {
  const { indice } = await params;

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
    console.error("descarga/audio: fallo la busqueda de familia", errorFamilia);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id")
    .eq("familia_id", (familia as Familia).id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("descarga/audio: fallo la busqueda de narrador", errorNarradores);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const narrador = (narradores as Narrador[] | null)?.[0];

  if (!narrador) {
    return NextResponse.json(
      { error: "Todavía no hay una bitácora para esta familia." },
      { status: 404 },
    );
  }

  const { data: pedidos, error: errorPedidos } = await admin
    .from("pedidos")
    .select("id, estado, audiolibro_paths")
    .eq("narrador_id", narrador.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorPedidos) {
    console.error("descarga/audio: fallo la busqueda de pedido", errorPedidos);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const pedido = (pedidos as Pedido[] | null)?.[0];

  if (!pedido || pedido.estado !== "entregado" || !pedido.audiolibro_paths) {
    return NextResponse.json({ error: "Tu audiolibro todavía no está listo." }, { status: 404 });
  }

  const ruta = resolverRuta(indice, pedido.audiolibro_paths);

  if (!ruta) {
    return NextResponse.json({ error: "No encontramos ese audio." }, { status: 404 });
  }

  const { data: firmado, error: errorFirmado } = await admin.storage
    .from("audios")
    .createSignedUrl(ruta, DURACION_URL_FIRMADA_SEGUNDOS);

  if (errorFirmado || !firmado?.signedUrl) {
    console.error("descarga/audio: fallo al firmar la url", errorFirmado);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.redirect(firmado.signedUrl, 302);
}
