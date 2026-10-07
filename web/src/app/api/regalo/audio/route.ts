import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenFotos } from "@/lib/token-fotos";

// Gift card (08/10): el audio que quien regala le deja al narrador. Se sube en
// la compra, antes de pagar, con el mismo token de una hora que las fotos del
// álbum. Uno por regalo: si graba de nuevo, se pisa.

const MAXIMO = 10 * 1024 * 1024;
const EXTENSIONES: Record<string, string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/x-m4a": "m4a" };

export async function POST(request: NextRequest) {
  const narradorId = request.nextUrl.searchParams.get("narrador") ?? "";
  const token = request.nextUrl.searchParams.get("token");
  if (!narradorId || !verificarTokenFotos(token, narradorId)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const admin = crearClienteServidor();
  const { data: fila } = await admin.from("narradores").select("estado").eq("id", narradorId).maybeSingle();
  if (!fila || (fila as { estado: string }).estado !== "pendiente_pago") return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const archivo = form?.get("audio");
  if (!(archivo instanceof File)) return NextResponse.json({ error: "Falta el audio." }, { status: 400 });
  const tipo = archivo.type.split(";")[0];
  const ext = EXTENSIONES[tipo];
  if (!ext) return NextResponse.json({ error: "Ese archivo no es un audio." }, { status: 400 });
  if (archivo.size > MAXIMO) return NextResponse.json({ error: "El audio es muy largo." }, { status: 400 });

  const path = `${narradorId}/regalo/mensaje.${ext}`;
  const { error: errorSubida } = await admin.storage.from("audios").upload(path, Buffer.from(await archivo.arrayBuffer()), { contentType: tipo, upsert: true });
  if (errorSubida) {
    console.error("regalo/audio: falló la subida", errorSubida);
    return NextResponse.json({ error: "No pudimos guardar el audio." }, { status: 500 });
  }
  const { error } = await admin.from("regalos").update({ audio_path: path }).eq("narrador_id", narradorId);
  if (error) {
    await admin.storage.from("audios").remove([path]);
    console.error("regalo/audio: falló guardar el path", error);
    return NextResponse.json({ error: "No pudimos guardar el audio." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
