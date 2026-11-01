import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion, PUEDE, type Rol } from "@/lib/panel";
import { calidadDeFoto, AVISO_CALIDAD, AVISO_CALIDAD_TU, TAMANO_MAXIMO_BYTES, errorDeTipoDeFoto } from "@/lib/guion";
import { intenta, tratoDeLaFamilia } from "@/lib/trato";
import type { TratoComprador } from "@/lib/regalo-textos";
import { verificarTokenFotos } from "@/lib/token-fotos";

// Subir una foto (docs/panel-usuario.md §6.3 y §15.2). Con capítulo va a esa
// época del libro; sin capítulo es "del libro" — candidata a tapa, contratapa
// o marco, que se eligen en Encargar libro. Se guarda EL ORIGINAL, sin
// recomprimir: la resolución es lo que decide si se puede imprimir. El
// navegador mide ancho/alto antes de subir y los manda; acá se guardan y se
// le devuelve a la familia qué alcanza a imprimir con eso.
//
// Vercel corta todo pedido de más de 4,5 MB, y una foto de celular pasa eso
// fácil (01/11: las HEIC del padre de Naza, ya en JPG). Por eso la foto no
// pasa por acá: con JSON, el navegador pide permiso (`paso: "pedir"`, vuelve
// una URL firmada de Storage), la sube directo a Supabase y después confirma
// (`paso: "confirmar"`): recién ahí se mira lo que llegó y se crea la fila.
// El multipart de siempre queda para las pestañas abiertas con la versión vieja.

const GENERICO = (t: TratoComprador = "vos") => `No pudimos subir la foto. ${intenta(t)} de nuevo.`;
const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];

// HEIC/HEIF no entran: el navegador que imprime el libro no los decodifica (ver errorDeTipoDeFoto).
const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  const admin = crearClienteServidor();
  const params = request.nextUrl.searchParams;

  // Dos puertas: la sesión del panel, o el token del paso 5 de la compra
  // (17/09) — quien compra todavía no tiene cuenta, pero /api/compra ya le
  // creó el narrador y le firmó un permiso de una hora para ESE narrador.
  let narrador: { id: string; familia_id?: string };
  let subidaPor: string | null;
  const token = params.get("token");
  if (token) {
    const narradorId = params.get("narrador") ?? "";
    if (!narradorId || !verificarTokenFotos(token, narradorId)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    const { data: fila, error } = await admin.from("narradores").select("id, estado, familia_id").eq("id", narradorId).maybeSingle();
    if (error) { console.error("fotos: fallo buscar el narrador del token", error); return NextResponse.json({ error: GENERICO() }, { status: 500 }); }
    // Solo mientras la compra no se pagó: después, las fotos entran por el panel.
    if (!fila || (fila as { estado: string }).estado !== "pendiente_pago") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    narrador = { id: narradorId, familia_id: (fila as { familia_id?: string }).familia_id };
    subidaPor = null;
  } else {
    const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, params, { mensajeError: GENERICO() });
    if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
    if (!PUEDE.agregarPreguntasYFotos(acceso.rol as Rol)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    narrador = acceso.narrador;
    subidaPor = acceso.user.id;
  }
  // Vos o tú: el de la familia dueña de la historia (en la compra, la que se acaba de crear).
  const trato = await tratoDeLaFamilia(admin, narrador.familia_id);

  // Las fotos se pueden seguir subiendo hasta cerrar el libro (aprobación), no solo hasta que termine la entrevista.
  const { data: fila } = await admin.from("narradores").select("libro_aprobado_at").eq("id", narrador.id).maybeSingle();
  if ((fila as { libro_aprobado_at?: string | null } | null)?.libro_aprobado_at) {
    return NextResponse.json({ error: "El libro ya está cerrado: no se agregan más fotos." }, { status: 400 });
  }

  if (request.headers?.get("content-type")?.includes("application/json")) {
    const cuerpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (cuerpo?.paso === "pedir") return pedirSubida(admin, narrador.id, cuerpo, trato);
    if (cuerpo?.paso === "confirmar") return confirmarSubida(admin, narrador.id, cuerpo, subidaPor, trato);
    return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  }

  const archivo = form.get("archivo");
  const capitulo = String(form.get("capitulo") ?? "").trim() || null; // null = foto del libro, sin capítulo
  const epigrafe = String(form.get("epigrafe") ?? "").trim().slice(0, 300) || null;
  const ancho = Number(form.get("ancho") ?? 0) || null;
  const alto = Number(form.get("alto") ?? 0) || null;
  const principal = capitulo !== null && form.get("principal") === "1";

  if (!(archivo instanceof File)) return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  // Sin capítulo = al álbum del libro (13/09). HEIC no entra (Naza, 14/09): la fábrica no lo abre.
  const errorDeTipo = errorDeTipoDeFoto(archivo.type, trato);
  if (errorDeTipo) return NextResponse.json({ error: errorDeTipo }, { status: 400 });
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
    return NextResponse.json({ error: GENERICO(trato) }, { status: 500 });
  }

  return registrar(admin, { id, narradorId: narrador.id, path, capitulo, epigrafe, principal, ancho, alto, subidaPor }, trato);
}

type Admin = ReturnType<typeof crearClienteServidor>;

async function registrar(
  admin: Admin,
  { id, narradorId, path, capitulo, epigrafe, principal, ancho, alto, subidaPor }: { id: string; narradorId: string; path: string; capitulo: string | null; epigrafe: string | null; principal: boolean; ancho: number | null; alto: number | null; subidaPor: string | null },
  trato: TratoComprador,
) {
  // Si esta es la principal del capítulo, la anterior deja de serlo.
  if (principal) {
    await admin.from("fotos").update({ principal: false }).eq("narrador_id", narradorId).eq("capitulo", capitulo).eq("principal", true);
  }

  const { error: errorFila } = await admin.from("fotos").insert({
    id, narrador_id: narradorId, capitulo, storage_path: path, epigrafe, principal,
    ancho_px: ancho, alto_px: alto, subida_por: subidaPor,
  });
  if (errorFila) {
    console.error("fotos: fallo la fila", errorFila);
    await admin.storage.from("audios").remove([path]);
    return NextResponse.json({ error: GENERICO(trato) }, { status: 500 });
  }

  const calidad = ancho && alto ? calidadDeFoto(ancho, alto) : null;
  return NextResponse.json({ ok: true, id, calidad, aviso: calidad ? (trato === "tu" ? AVISO_CALIDAD_TU : AVISO_CALIDAD)[calidad] : null }, { status: 200 });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const rutaDeLaFoto = (narradorId: string, id: string, tipo: string) => `${narradorId}/fotos/${id}.${EXTENSION[tipo] ?? "jpg"}`;

async function pedirSubida(admin: Admin, narradorId: string, cuerpo: Record<string, unknown>, trato: TratoComprador) {
  const tipo = String(cuerpo.tipo ?? "");
  const tamano = Number(cuerpo.tamano ?? 0);
  const errorDeTipo = errorDeTipoDeFoto(tipo, trato);
  if (errorDeTipo) return NextResponse.json({ error: errorDeTipo }, { status: 400 });
  if (tamano > TAMANO_MAXIMO_BYTES) return NextResponse.json({ error: "La foto pesa más de 25 MB." }, { status: 400 });

  const id = randomUUID();
  const path = rutaDeLaFoto(narradorId, id, tipo);
  const { data, error } = await admin.storage.from("audios").createSignedUploadUrl(path);
  if (error || !data) {
    console.error("fotos: fallo pedir la URL de subida", error);
    return NextResponse.json({ error: GENERICO(trato) }, { status: 500 });
  }
  return NextResponse.json({ id, path, token: data.token }, { status: 200 });
}

async function confirmarSubida(admin: Admin, narradorId: string, cuerpo: Record<string, unknown>, subidaPor: string | null, trato: TratoComprador) {
  const id = String(cuerpo.id ?? "");
  const tipo = String(cuerpo.tipo ?? "");
  if (!UUID.test(id) || errorDeTipoDeFoto(tipo, trato)) return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  const path = rutaDeLaFoto(narradorId, id, tipo);

  // Lo que manda es lo que quedó en Storage, no lo que dice el navegador.
  const { data: lista, error } = await admin.storage.from("audios").list(`${narradorId}/fotos`, { search: id, limit: 1 });
  if (error) {
    console.error("fotos: fallo mirar la subida directa", error);
    return NextResponse.json({ error: GENERICO(trato) }, { status: 500 });
  }
  const objeto = (lista ?? []).find((o) => `${narradorId}/fotos/${o.name}` === path);
  if (!objeto) return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  const tamano = Number((objeto.metadata as { size?: number } | null)?.size ?? 0);
  if (tamano > TAMANO_MAXIMO_BYTES) {
    await admin.storage.from("audios").remove([path]);
    return NextResponse.json({ error: "La foto pesa más de 25 MB." }, { status: 400 });
  }

  // Confirmar dos veces la misma no crea otra fila (ni borra el archivo de la primera al chocar el id).
  const { data: yaEsta } = await admin.from("fotos").select("id").eq("id", id).maybeSingle();
  if (yaEsta) return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });

  const capitulo = String(cuerpo.capitulo ?? "").trim() || null;
  return registrar(admin, {
    id, narradorId, path, capitulo,
    epigrafe: String(cuerpo.epigrafe ?? "").trim().slice(0, 300) || null,
    principal: capitulo !== null && cuerpo.principal === true,
    ancho: Number(cuerpo.ancho ?? 0) || null,
    alto: Number(cuerpo.alto ?? 0) || null,
    subidaPor,
  }, trato);
}
