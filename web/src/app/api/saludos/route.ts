import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenSaludo } from "@/lib/token-saludo";

const MENSAJE_ERROR_GENERICO = "No pudimos enviar el saludo. Intenta de nuevo.";
const TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no es válido." },
      { status: 400 },
    );
  }

  const token = formData.get("token");
  if (typeof token !== "string" || token.trim().length === 0) {
    return NextResponse.json({ error: "Falta el link para enviar el saludo." }, { status: 401 });
  }

  const datosToken = verificarTokenSaludo(token);
  if (!datosToken) {
    return NextResponse.json({ error: "Este link ya no es válido." }, { status: 401 });
  }

  const nombre = formData.get("nombre");
  if (typeof nombre !== "string" || nombre.trim().length === 0) {
    return NextResponse.json({ error: "Falta tu nombre." }, { status: 400 });
  }

  const vinculo = formData.get("vinculo");
  if (typeof vinculo !== "string" || vinculo.trim().length === 0) {
    return NextResponse.json({ error: "Falta contar qué eres de él/ella." }, { status: 400 });
  }

  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "Falta grabar o subir el audio del saludo." }, { status: 400 });
  }

  if (audio.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json(
      { error: "El audio es demasiado largo. Intenta con uno más corto." },
      { status: 400 },
    );
  }

  const admin = crearClienteServidor();

  const buffer = Buffer.from(await audio.arrayBuffer());
  const path = `${datosToken.narradorId}/saludos/${randomUUID()}.webm`;

  const { error: errorSubida } = await admin.storage
    .from("audios")
    .upload(path, buffer, { contentType: audio.type || "audio/webm" });

  if (errorSubida) {
    console.error("saludos POST: fallo la subida del audio", errorSubida);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const { error: errorInsert } = await admin.from("saludos").insert({
    narrador_id: datosToken.narradorId,
    nombre: nombre.trim(),
    vinculo: vinculo.trim(),
    audio_path: path,
  });

  if (errorInsert) {
    console.error("saludos POST: fallo insertar la fila", errorInsert);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
