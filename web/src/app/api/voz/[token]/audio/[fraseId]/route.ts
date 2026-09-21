import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenVoz } from "@/lib/token-libro";
import { frasesPublicables, leerFrases } from "@/lib/frases";

// El mp3 de una frase desde la página pública (el código impreso, el chip del
// marco). Sin sesión: el token firmado es el permiso. Solo las ELEGIDAS con
// audio: lo que la familia dejó afuera no se publica por ningún link.

const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string; fraseId: string }> }) {
  const { token, fraseId } = await params;
  const datos = verificarTokenVoz(token);
  if (!datos) return NextResponse.json({ error: "Link no válido." }, { status: 404 });

  const admin = crearClienteServidor();
  const { data: n } = await admin.from("narradores").select("libro_aprobado_at").eq("id", datos.narradorId).maybeSingle();
  if (!(n as { libro_aprobado_at?: string | null } | null)?.libro_aprobado_at) {
    return NextResponse.json({ error: "Este libro todavía no está cerrado." }, { status: 404 });
  }

  const frases = await leerFrases(admin, datos.narradorId);
  const frase = frases ? frasesPublicables(frases).flatMap((p) => p.frases).find((f) => f.id === fraseId) : undefined;
  if (!frase) return NextResponse.json({ error: "No encontramos esa frase." }, { status: 404 });

  const { data: firmado } = await admin.storage.from("audios").createSignedUrl(frase.audio_path!, DURACION_URL_FIRMADA_SEGUNDOS);
  if (!firmado?.signedUrl) return NextResponse.json({ error: "No pudimos abrir el audio." }, { status: 500 });
  return NextResponse.redirect(firmado.signedUrl, 302);
}
