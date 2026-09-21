import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion, PUEDE, type Rol } from "@/lib/panel";
import { pedidoAMostrar, type AudiolibroPaths } from "@/lib/pedido-a-mostrar";

const MENSAJE_ERROR_GENERICO = "No pudimos abrir el audio. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

type Familia = { id: string };
type Narrador = { id: string };

// `indice` es "bonus", "completo", o la posición (0-based) del capítulo
// dentro de audiolibro_paths.capitulos — así lo arma el tablero al listar
// los reproductores del lector.
function resolverRuta(indice: string, paths: AudiolibroPaths): string | null {
  if (indice === "bonus") return paths.bonus ?? null;
  if (indice === "completo") return paths.completo ?? null;

  if (!/^\d+$/.test(indice)) return null;
  const posicion = Number(indice);
  if (posicion < 0 || posicion >= paths.capitulos.length) return null;
  return paths.capitulos[posicion];
}

// Quién escucha qué (spec §2, §5 y §15.1): nada se descarga, todo se escucha
// en la web. Los capítulos y el completo los oye cualquiera que vea la
// historia completa — dueña e invitado —, no el visitante de la muestra.
function puedeEscuchar(_indice: string, rol: Rol): boolean {
  return PUEDE.verHistoriaCompleta(rol);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ indice: string }> },
) {
  const { indice } = await params;

  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    mensajeError: MENSAJE_ERROR_GENERICO,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  if (!puedeEscuchar(indice, acceso.rol)) {
    return NextResponse.json(
      { error: "La muestra no incluye los audios del libro." },
      { status: 403 },
    );
  }
  const narrador = acceso.narrador;

  const { pedido, error: errorPedidos } = await pedidoAMostrar(admin, narrador.id);

  if (errorPedidos) {
    console.error("libro/audio: fallo la busqueda de pedido", errorPedidos);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  if (!pedido || pedido.estado !== "entregado" || !pedido.audiolibro_paths) {
    return NextResponse.json({ error: "Ese audio todavía no está listo." }, { status: 404 });
  }

  const ruta = resolverRuta(indice, pedido.audiolibro_paths);

  if (!ruta) {
    return NextResponse.json({ error: "No encontramos ese audio." }, { status: 404 });
  }

  const { data: firmado, error: errorFirmado } = await admin.storage
    .from("audios")
    .createSignedUrl(ruta, DURACION_URL_FIRMADA_SEGUNDOS);

  if (errorFirmado || !firmado?.signedUrl) {
    console.error("libro/audio: fallo al firmar la url", errorFirmado);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.redirect(firmado.signedUrl, 302);
}
