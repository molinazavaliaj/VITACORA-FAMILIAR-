import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenLibro } from "@/lib/token-libro";
import type { Edicion } from "@/lib/edicion";

// La foto de portada de la muestra pública. Sin sesión: el token es el permiso,
// y solo se sirve la foto que la dueña eligió como portada, ninguna otra.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const datos = verificarTokenLibro(token);
  if (!datos) return NextResponse.json({ error: "Link no válido." }, { status: 404 });

  const admin = crearClienteServidor();
  const { data: n } = await admin.from("narradores").select("edicion, libro_aprobado_at").eq("id", datos.narradorId).maybeSingle();
  const fila = n as { edicion: Edicion | null; libro_aprobado_at: string | null } | null;
  const fotoId = fila?.libro_aprobado_at ? fila.edicion?.portadaFotoId : null;
  if (!fotoId) return NextResponse.json({ error: "Sin portada." }, { status: 404 });

  const { data: foto } = await admin.from("fotos").select("storage_path").eq("id", fotoId).eq("narrador_id", datos.narradorId).maybeSingle();
  const path = (foto as { storage_path?: string } | null)?.storage_path;
  if (!path) return NextResponse.json({ error: "Sin portada." }, { status: 404 });

  const { data: firmado } = await admin.storage.from("audios").createSignedUrl(path, 3600);
  if (!firmado?.signedUrl) return NextResponse.json({ error: "Sin portada." }, { status: 404 });
  return NextResponse.redirect(firmado.signedUrl, 302);
}
