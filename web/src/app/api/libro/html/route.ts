import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion, PUEDE } from "@/lib/panel";
import { pedidoAMostrar } from "@/lib/pedido-a-mostrar";
import { responderLibroOnline } from "@/lib/libro-online";

// El lector (spec §15.1): el mismo libro que el PDF, en HTML, para leerlo en
// /tablero/[id]/leer. Nada se descarga. Los invitados leen igual que la dueña
// (spec §2 y §5); el visitante (guardó el link público) ve solo la muestra.

const MENSAJE_ERROR_GENERICO = "No pudimos abrir el libro. Intenta de nuevo.";

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

  const { pedido, error: errorPedidos } = await pedidoAMostrar(admin, narrador.id);

  if (errorPedidos) {
    console.error("libro/html: fallo la busqueda de pedido", errorPedidos);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  // Solo el estado del pedido decide. La fábrica sube libro.html antes que el
  // PDF, así que el archivo puede existir con el pedido todavía en
  // 'generando' o 'fallido' — y en ese caso no se muestra.
  if (!pedido || pedido.estado !== "entregado") {
    return NextResponse.json({ error: "El libro todavía no está listo." }, { status: 404 });
  }

  // El path es fijo (no depende de una columna del pedido): la fábrica siempre
  // lo deja en `{narrador_id}/paquete/libro.html`. Se sirve desde acá, no por
  // redirección a la URL firmada: Supabase la entregaría como text/plain (21/09).
  const respuesta = await responderLibroOnline(admin, narrador.id);
  if (!respuesta) {
    console.error("libro/html: no se pudo bajar libro.html de", narrador.id);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
  return respuesta;
}
