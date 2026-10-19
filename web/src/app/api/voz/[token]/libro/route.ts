import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenVoz } from "@/lib/token-libro";
import { accesoVoz } from "@/lib/voz-acceso";
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
  // La casa: libro cerrado. Kids: desde listo.json (lib/voz-acceso).
  if (!(await accesoVoz(admin, datos.narradorId)).abre) {
    return NextResponse.json({ error: "Este libro todavía no está cerrado." }, { status: 404 });
  }
  const respuesta = await responderLibroOnline(admin, datos.narradorId);
  return respuesta ?? NextResponse.json({ error: "El libro todavía no está listo." }, { status: 404 });
}
