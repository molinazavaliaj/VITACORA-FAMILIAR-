import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenRespuestas } from "@/lib/token-respuestas";

// El audio de una respuesta, para el narrador, desde su link. Sin sesión: el token firmado es el permiso, y solo abre
// respuestas de ese narrador.

const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string; respuestaId: string }> }) {
  const { token, respuestaId } = await params;
  const t = verificarTokenRespuestas(token);
  if (!t.ok) return NextResponse.json({ error: "Este link ya no sirve." }, { status: 403 });
  const admin = crearClienteServidor();
  const { data } = await admin.from("respuestas").select("audio_path").eq("id", respuestaId).eq("narrador_id", t.narradorId).maybeSingle();
  const path = (data as { audio_path?: string | null } | null)?.audio_path;
  if (!path) return NextResponse.json({ error: "No encontramos ese audio." }, { status: 404 });
  const { data: firmado } = await admin.storage.from("audios").createSignedUrl(path, DURACION_URL_FIRMADA_SEGUNDOS);
  if (!firmado?.signedUrl) return NextResponse.json({ error: "No pudimos abrir el audio." }, { status: 500 });
  const r = NextResponse.redirect(firmado.signedUrl, 302);
  r.headers.set("Cache-Control", "no-store");
  r.headers.set("Referrer-Policy", "no-referrer");
  return r;
}
