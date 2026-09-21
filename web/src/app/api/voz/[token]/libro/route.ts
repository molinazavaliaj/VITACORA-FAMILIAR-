import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenVoz } from "@/lib/token-libro";
import { responderLibroOnline } from "@/lib/libro-online";

// El libro online entero desde la página del código impreso (spec: "el que
// tiene el libro en la mano ya lo pagó"). Mismo libro.html que lee la dueña
// en /tablero/[id]/leer; sin sesión, el token 'voz' es el permiso. El criterio
// es el mismo que el de las frases (libro cerrado + el archivo existe), no el
// estado del pedido: el código tiene que abrir con el libro en la mano.

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const datos = verificarTokenVoz(token);
  if (!datos) return NextResponse.json({ error: "Link no válido." }, { status: 404 });

  const admin = crearClienteServidor();
  const { data: n } = await admin.from("narradores").select("libro_aprobado_at").eq("id", datos.narradorId).maybeSingle();
  if (!(n as { libro_aprobado_at?: string | null } | null)?.libro_aprobado_at) {
    return NextResponse.json({ error: "Este libro todavía no está cerrado." }, { status: 404 });
  }
  const respuesta = await responderLibroOnline(admin, datos.narradorId);
  return respuesta ?? NextResponse.json({ error: "El libro todavía no está listo." }, { status: 404 });
}
