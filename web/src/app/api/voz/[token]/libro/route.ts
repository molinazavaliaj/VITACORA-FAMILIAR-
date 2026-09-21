import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenVoz } from "@/lib/token-libro";
import { pedidoAMostrar } from "@/lib/pedido-a-mostrar";

// El libro online entero desde la página del código impreso (spec: "el que
// tiene el libro en la mano ya lo pagó"). Mismo libro.html que lee la dueña
// en /tablero/[id]/leer; sin sesión, el token 'voz' es el permiso.

const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const datos = verificarTokenVoz(token);
  if (!datos) return NextResponse.json({ error: "Link no válido." }, { status: 404 });

  const admin = crearClienteServidor();
  const { pedido, error } = await pedidoAMostrar(admin, datos.narradorId);
  if (error) {
    console.error("voz/libro: fallo la busqueda de pedido", error);
    return NextResponse.json({ error: "No pudimos abrir el libro." }, { status: 500 });
  }
  if (!pedido || pedido.estado !== "entregado") return NextResponse.json({ error: "El libro todavía no está listo." }, { status: 404 });

  const { data: firmado } = await admin.storage.from("audios").createSignedUrl(`${datos.narradorId}/paquete/libro.html`, DURACION_URL_FIRMADA_SEGUNDOS);
  if (!firmado?.signedUrl) return NextResponse.json({ error: "No pudimos abrir el libro." }, { status: 500 });
  return NextResponse.redirect(firmado.signedUrl, 302);
}
