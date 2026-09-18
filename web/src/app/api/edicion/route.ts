import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { validarEdicion, type Edicion } from "@/lib/edicion";
import { armarGuion, capitulosDelGuion } from "@/lib/guion";

// La edición final y el cierre del libro (docs/panel-usuario.md §7.2 y Regla 0).
//   PATCH → guarda lo que decidió (título, portada, orden, excluidas, correcciones)
//   POST  → "Cerrar libro": libro_aprobado_at. Sin vuelta atrás.
// Solo la dueña, y solo cuando la entrevista terminó.

const GENERICO = "No pudimos guardar. Intenta de nuevo.";
const ESTADOS_TERMINADOS = ["completado", "cerrado_anticipado"];

type Fila = { edicion: Edicion | null; libro_aprobado_at: string | null; estado: string };

type Preparado =
  | { error: NextResponse; admin?: undefined; narrador?: undefined; fila?: undefined }
  | { error?: undefined; admin: ReturnType<typeof crearClienteServidor>; narrador: { id: string; nombre: string }; fila: Fila };

// Las tres fotos del libro se pueden elegir en cualquier momento (§15.2): un
// cuerpo que trae SOLO esas claves no espera a que termine de contar.
const CLAVES_FOTOS = new Set(["portadaFotoId", "contratapaFotoId", "marcoFotoId", "marcosFotoIds"]);
function soloFotos(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const claves = Object.keys(body as Record<string, unknown>);
  return claves.length > 0 && claves.every((k) => CLAVES_FOTOS.has(k));
}

async function prepararRequest(request: NextRequest, opciones: { permitirAntes?: boolean } = {}): Promise<Preparado> {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    soloDuena: true,
    mensajeError: GENERICO,
  });
  if (!acceso.ok) return { error: NextResponse.json({ error: acceso.error }, { status: acceso.status }) };
  const { narrador } = acceso;

  const { data } = await admin.from("narradores").select("edicion, libro_aprobado_at, estado").eq("id", narrador.id).maybeSingle();
  const fila = data as Fila | null;
  if (!fila) return { error: NextResponse.json({ error: "No encontramos la historia." }, { status: 404 }) };
  if (!opciones.permitirAntes && !ESTADOS_TERMINADOS.includes(fila.estado)) {
    return { error: NextResponse.json({ error: "El libro se edita cuando termina de contar su historia." }, { status: 400 }) };
  }
  if (fila.libro_aprobado_at) {
    return { error: NextResponse.json({ error: "El libro ya está cerrado: no se cambia más." }, { status: 400 }) };
  }
  return { admin, narrador, fila };
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "No llegó nada para guardar." }, { status: 400 });
  }

  const prep = await prepararRequest(request, { permitirAntes: soloFotos(body) });
  if (prep.error) return prep.error;
  const { admin, narrador, fila } = prep;

  // Los capítulos válidos salen del guion entero: las base son globales
  // (narrador_id null) y el narrador solo tiene las suyas (bitácora 34).
  const [{ data: propias }, { data: globales }, { data: respuestas }] = await Promise.all([
    admin.from("preguntas").select("orden, capitulo").eq("narrador_id", narrador.id),
    admin.from("preguntas").select("orden, capitulo").is("narrador_id", null),
    admin.from("respuestas").select("id").eq("narrador_id", narrador.id),
  ]);
  type PreguntaCapitulo = { orden: number; capitulo: string };
  const capitulosValidos = capitulosDelGuion(armarGuion(globales as PreguntaCapitulo[] | null, propias as PreguntaCapitulo[] | null));
  const respuestasValidas = new Set(((respuestas as { id: string }[] | null) ?? []).map((r) => r.id));

  const v = validarEdicion(body, { capitulosValidos, respuestasValidas });
  if (!v.ok) return NextResponse.json({ error: v.mensaje }, { status: 400 });

  const edicion: Edicion = { ...(fila.edicion ?? {}), ...v.cambios };
  const { error } = await admin.from("narradores").update({ edicion }).eq("id", narrador.id);
  if (error) {
    console.error("edicion: fallo guardar", error);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }
  return NextResponse.json({ ok: true, edicion });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const prep = await prepararRequest(request);
  if (prep.error) return prep.error;
  const { admin, narrador } = prep;

  let body: { accion?: string; confirmo?: boolean };
  try {
    body = (await request.json()) as { accion?: string; confirmo?: boolean };
  } catch {
    body = {};
  }
  if (body.accion !== "cerrar") return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  // El cliente manda confirmo:true solo después de que ella leyó el aviso de que no hay vuelta atrás.
  if (body.confirmo !== true) return NextResponse.json({ error: "Falta confirmar que leíste que no hay vuelta atrás." }, { status: 400 });

  // Compare-and-swap: si se cerró en otra pestaña un segundo antes, no se pisa la fecha.
  const { data, error } = await admin
    .from("narradores")
    .update({ libro_aprobado_at: new Date().toISOString() })
    .eq("id", narrador.id)
    .is("libro_aprobado_at", null)
    .select("libro_aprobado_at");
  if (error) {
    console.error("edicion: fallo cerrar", error);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }
  const cerrado = (data as { libro_aprobado_at: string }[] | null)?.[0];
  return NextResponse.json({ ok: true, libroAprobadoAt: cerrado?.libro_aprobado_at ?? null, yaEstaba: !cerrado });
}
