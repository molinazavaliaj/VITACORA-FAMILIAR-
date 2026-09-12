import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";

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

  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    mensajeError: MENSAJE_ERROR_GENERICO, soloDuena: true,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const narrador = acceso.narrador;

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
