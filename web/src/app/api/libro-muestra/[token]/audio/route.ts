import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenLibro } from "@/lib/token-libro";

// El minuto de audio de la muestra pública. Sin sesión: el token firmado es el permiso.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const datos = verificarTokenLibro(token);
  if (!datos) return NextResponse.json({ error: "Link no válido." }, { status: 404 });

  const admin = crearClienteServidor();
  const { data: n } = await admin.from("narradores").select("libro_aprobado_at").eq("id", datos.narradorId).maybeSingle();
  if (!(n as { libro_aprobado_at?: string | null } | null)?.libro_aprobado_at) {
    return NextResponse.json({ error: "Este libro todavía no está cerrado." }, { status: 404 });
  }

  const { data: firmado } = await admin.storage
    .from("audios")
    .createSignedUrl(`${datos.narradorId}/paquete/muestra_audiolibro.mp3`, 3600);
  if (!firmado?.signedUrl) return NextResponse.json({ error: "Todavía no hay muestra de audio." }, { status: 404 });
  return NextResponse.redirect(firmado.signedUrl, 302);
}
