import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenFotos } from "@/lib/token-fotos";

// Gift card (08/10): el audio que quien regala le deja al narrador. Se sube en
// la compra, antes de pagar, con el mismo token de una hora que las fotos del
// álbum. Uno por regalo: si graba de nuevo, se pisa. El path es FIJO y sin
// extensión: regrabar en otro formato pisa el mismo objeto (sin huérfanos), y
// el contentType que guarda Storage es el que sirve la URL firmada.

const MAXIMO = 10 * 1024 * 1024;
const TIPOS = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/x-m4a"];
// Algunos navegadores mandan el archivo sin tipo: se deduce de la extensión.
const POR_EXTENSION: Record<string, string> = {
  m4a: "audio/mp4", mp4: "audio/mp4", mp3: "audio/mpeg", ogg: "audio/ogg", opus: "audio/ogg", webm: "audio/webm",
};

function tipoDe(archivo: File): string {
  const dado = archivo.type.split(";")[0].trim();
  if (dado) return dado;
  const extension = /\.([a-z0-9]+)$/i.exec(archivo.name ?? "")?.[1]?.toLowerCase() ?? "";
  return POR_EXTENSION[extension] ?? "";
}

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
  const tipo = tipoDe(archivo);
  if (!TIPOS.includes(tipo)) return NextResponse.json({ error: "Ese archivo no es un audio." }, { status: 400 });
  if (archivo.size > MAXIMO) return NextResponse.json({ error: "El audio es muy largo." }, { status: 400 });

  const path = `${narradorId}/regalo/mensaje`;
  const { error: errorSubida } = await admin.storage.from("audios").upload(path, Buffer.from(await archivo.arrayBuffer()), { contentType: tipo, upsert: true });
  if (errorSubida) {
    console.error("regalo/audio: falló la subida", errorSubida);
    return NextResponse.json({ error: "No pudimos guardar el audio." }, { status: 500 });
  }
  const { data: filas, error } = await admin.from("regalos").update({ audio_path: path }).eq("narrador_id", narradorId).select("id");
  if (error) {
    // No se borra: el archivo está en el único path al que una fila puede apuntar.
    console.error("regalo/audio: falló guardar el path", error);
    return NextResponse.json({ error: "No pudimos guardar el audio." }, { status: 500 });
  }
  if (!filas || (filas as unknown[]).length === 0) {
    // Narrador sin regalo: el audio no tiene a quién pertenecer.
    await admin.storage.from("audios").remove([path]);
    return NextResponse.json({ error: "No autorizado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
