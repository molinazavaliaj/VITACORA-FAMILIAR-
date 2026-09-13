import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion, PUEDE } from "@/lib/panel";

// El lector online: el mismo libro que el PDF, pero en HTML para leerlo en la
// página de descarga. A diferencia de `descarga/libro`, acá NO va `soloDuena`:
// los invitados leen el libro, lo que no pueden es bajarlo (spec §2 y §5).
// El visitante (guardó el link público) ve solo la muestra, no el libro.

const MENSAJE_ERROR_GENERICO = "No pudimos abrir el libro. Intenta de nuevo.";
const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

type Pedido = { id: string; estado: string };

export async function GET(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    mensajeError: MENSAJE_ERROR_GENERICO,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  if (!PUEDE.verHistoriaCompleta(acceso.rol)) {
    return NextResponse.json({ error: "La muestra no incluye el libro completo." }, { status: 403 });
  }
  const narrador = acceso.narrador;

  const { data: pedidos, error: errorPedidos } = await admin
    .from("pedidos")
    .select("id, estado")
    .eq("narrador_id", narrador.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorPedidos) {
    console.error("descarga/libro-html: fallo la busqueda de pedido", errorPedidos);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const pedido = (pedidos as Pedido[] | null)?.[0];

  // Solo el estado del pedido decide. La fábrica sube libro.html antes que el
  // PDF, así que el archivo puede existir con el pedido todavía en
  // 'generando' o 'fallido' — y en ese caso no se muestra.
  if (!pedido || pedido.estado !== "entregado") {
    return NextResponse.json({ error: "El libro todavía no está listo." }, { status: 404 });
  }

  // El path es fijo (no depende de una columna del pedido): la fábrica siempre
  // lo deja en `{narrador_id}/paquete/libro.html`.
  const { data: firmado, error: errorFirmado } = await admin.storage
    .from("audios")
    .createSignedUrl(`${narrador.id}/paquete/libro.html`, DURACION_URL_FIRMADA_SEGUNDOS);

  if (errorFirmado || !firmado?.signedUrl) {
    console.error("descarga/libro-html: fallo al firmar la url", errorFirmado);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.redirect(firmado.signedUrl, 302);
}
