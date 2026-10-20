import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { confirmarCupon } from "@/lib/cupon-base";
import { rascaPrendido } from "@/lib/cupon";
import { verificarToken } from "@/lib/token-firmado";

// El botón «Ver mi cupón» de /cupon/confirmar (doble opt-in, 20/10). Es un POST
// a propósito: los antivirus del correo abren solos los links del mail (GET),
// y eso confirmaría un correo que nadie confirmó. Después vuelve a la misma
// página, que ya muestra el código.

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const c = form?.get("c");
  const t = form?.get("t");
  const id = typeof c === "string" ? c : "";
  const token = typeof t === "string" ? t : "";
  const vuelta = new URL("/cupon/confirmar", process.env.URL_BASE ?? request.nextUrl.origin);
  vuelta.searchParams.set("c", id);
  vuelta.searchParams.set("t", token);
  if (rascaPrendido() && id && verificarToken("cupon-confirmar", token, id)) {
    try {
      const r = await confirmarCupon(crearClienteServidor(), id);
      if (!r.ok) console.error("cupon confirmar: no pude confirmar", id, r.falla);
    } catch (err) {
      console.error("cupon confirmar: falló", err);
    }
  }
  return NextResponse.redirect(vuelta, { status: 303 });
}
