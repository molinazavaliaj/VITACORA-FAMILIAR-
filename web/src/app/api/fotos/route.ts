import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion, PUEDE, type Rol } from "@/lib/panel";
import { calidadDeFoto, AVISO_CALIDAD, TAMANO_MAXIMO_BYTES, TIPOS_DE_IMAGEN } from "@/lib/guion";

// Subir una foto a un capítulo (docs/panel-usuario.md §6.3). Se guarda EL
// ORIGINAL, sin recomprimir: la resolución es lo que decide si se puede
// imprimir. El navegador mide ancho/alto antes de subir y los manda; acá se
// guardan y se le devuelve a la familia qué alcanza a imprimir con eso.

const GENERICO = "No pudimos subir la foto. Intenta de nuevo.";
const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif",
};

export async function POST(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { mensajeError: GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { narrador, rol, user } = acceso;

  if (!PUEDE.agregarPreguntasYFotos(rol as Rol)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  // Las fotos se pueden seguir subiendo hasta cerrar el libro (aprobación), no solo hasta que termine la entrevista.
  const { data: fila } = await admin.from("narradores").select("libro_aprobado_at").eq("id", narrador.id).maybeSingle();
  if ((fila as { libro_aprobado_at?: string | null } | null)?.libro_aprobado_at) {
    return NextResponse.json({ error: "El libro ya está cerrado: no se agregan más fotos." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  }

  const archivo = form.get("archivo");
  const capitulo = String(form.get("capitulo") ?? "").trim();
  const epigrafe = String(form.get("epigrafe") ?? "").trim().slice(0, 300) || null;
  const ancho = Number(form.get("ancho") ?? 0) || null;
  const alto = Number(form.get("alto") ?? 0) || null;
  const principal = form.get("principal") === "1";

  if (!(archivo instanceof File)) return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  if (!capitulo) return NextResponse.json({ error: "Elegí en qué capítulo va la foto." }, { status: 400 });
  if (!TIPOS_DE_IMAGEN.includes(archivo.type)) {
    return NextResponse.json({ error: "Tiene que ser una imagen (JPG, PNG, WebP o HEIC)." }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json({ error: "La foto pesa más de 25 MB." }, { status: 400 });
  }

  const id = randomUUID();
  const path = `${narrador.id}/fotos/${id}.${EXTENSION[archivo.type] ?? "jpg"}`;
  const bytes = Buffer.from(await archivo.arrayBuffer());

  const { error: errorSubida } = await admin.storage
    .from("audios")
    .upload(path, bytes, { contentType: archivo.type, upsert: false });
  if (errorSubida) {
    console.error("fotos: fallo la subida", errorSubida);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }

  // Si esta es la principal del capítulo, la anterior deja de serlo.
  if (principal) {
    await admin.from("fotos").update({ principal: false }).eq("narrador_id", narrador.id).eq("capitulo", capitulo).eq("principal", true);
  }

  const { error: errorFila } = await admin.from("fotos").insert({
    id, narrador_id: narrador.id, capitulo, storage_path: path, epigrafe, principal,
    ancho_px: ancho, alto_px: alto, subida_por: user.id,
  });
  if (errorFila) {
    console.error("fotos: fallo la fila", errorFila);
    await admin.storage.from("audios").remove([path]);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }

  const calidad = ancho && alto ? calidadDeFoto(ancho, alto) : null;
  return NextResponse.json({ ok: true, id, calidad, aviso: calidad ? AVISO_CALIDAD[calidad] : null }, { status: 200 });
}
