import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { normalizarCodigo } from "@/lib/regalo";

// Gift card (08/10): escuchar el audio de quien regala desde el código de la
// tarjeta. Redirige a una URL firmada de una hora; sin audio, 404.

export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  let crudo: string;
  try {
    crudo = decodeURIComponent((await params).codigo);
  } catch {
    return new NextResponse(null, { status: 404 }); // % mal formado
  }
  const codigo = normalizarCodigo(crudo);
  if (!codigo) return new NextResponse(null, { status: 404 });
  const admin = crearClienteServidor();
  const { data } = await admin.from("regalos").select("audio_path").eq("codigo", codigo).maybeSingle();
  const path = (data as { audio_path?: string | null } | null)?.audio_path;
  if (!path) return new NextResponse(null, { status: 404 });
  const { data: firmada } = await admin.storage.from("audios").createSignedUrl(path, 3600);
  if (!firmada?.signedUrl) return new NextResponse(null, { status: 404 });
  const respuesta = NextResponse.redirect(firmada.signedUrl, 302);
  respuesta.headers.set("Cache-Control", "no-store"); // la URL firmada vence en una hora
  return respuesta;
}
