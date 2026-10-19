import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenVoz } from "@/lib/token-libro";
import { accesoVoz } from "@/lib/voz-acceso";
import type { Edicion } from "@/lib/edicion";

// La foto de arriba de «Su voz» (maqueta SuVoz: el narrador a pantalla entera).
// Es la misma que ya sirve la muestra (/api/libro-muestra/[token]/portada): la
// que la familia eligió como portada del libro, ninguna otra. Sin sesión, el
// token 'voz' es el permiso, con el mismo criterio que los audios (lib/voz-acceso).
// Solo la casa: Kids no elige portada en `edicion`. Si no hay, 404 y la página
// queda con la tela de fondo.

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const datos = verificarTokenVoz(token);
  if (!datos) return NextResponse.json({ error: "Link no válido." }, { status: 404 });

  const admin = crearClienteServidor();
  const acceso = await accesoVoz(admin, datos.narradorId);
  if (!acceso.abre || acceso.producto !== "casa") return NextResponse.json({ error: "Sin portada." }, { status: 404 });

  const { data: n } = await admin.from("narradores").select("edicion").eq("id", datos.narradorId).maybeSingle();
  const fotoId = (n as { edicion: Edicion | null } | null)?.edicion?.portadaFotoId;
  if (!fotoId) return NextResponse.json({ error: "Sin portada." }, { status: 404 });

  const { data: foto } = await admin.from("fotos").select("storage_path").eq("id", fotoId).eq("narrador_id", datos.narradorId).maybeSingle();
  const path = (foto as { storage_path?: string } | null)?.storage_path;
  if (!path) return NextResponse.json({ error: "Sin portada." }, { status: 404 });

  const { data: firmado } = await admin.storage.from("audios").createSignedUrl(path, 3600);
  if (!firmado?.signedUrl) return NextResponse.json({ error: "Sin portada." }, { status: 404 });
  return NextResponse.redirect(firmado.signedUrl, 302);
}
