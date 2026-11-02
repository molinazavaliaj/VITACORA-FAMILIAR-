import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenVoz } from "@/lib/token-libro";
import { accesoVoz } from "@/lib/voz-acceso";
import { RUTA_LIBRO_PDF } from "@/lib/libro-online";

// El PDF del libro desde la página del código impreso (Naza, 02/11): el mismo
// `libro.pdf` que descargó la familia, con el mismo permiso que el libro online
// (token 'voz' + libro cerrado, lib/voz-acceso). Como los mp3, redirige a una URL
// firmada corta; `download` hace que el teléfono lo guarde con un nombre legible.

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const datos = verificarTokenVoz(token);
  if (!datos) return NextResponse.json({ error: "Link no válido." }, { status: 404 });

  const admin = crearClienteServidor();
  const acceso = await accesoVoz(admin, datos.narradorId);
  if (!acceso.abre) return NextResponse.json({ error: "Este libro todavía no está cerrado." }, { status: 404 });

  const archivo = `${acceso.nombre.replace(/[\/:*?"<>|]+/g, "").trim() || "libro"}.pdf`;
  const { data: firmado } = await admin.storage.from("audios").createSignedUrl(RUTA_LIBRO_PDF(datos.narradorId), 600, { download: archivo });
  if (!firmado?.signedUrl) return NextResponse.json({ error: "El PDF todavía no está listo." }, { status: 404 });
  return NextResponse.redirect(firmado.signedUrl, 302);
}
