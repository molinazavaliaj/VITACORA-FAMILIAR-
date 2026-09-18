import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible } from "@/lib/panel";
import { validarFoco, validarPosicion, type Foco, type Posicion } from "@/lib/encuadre";

// Ver una foto: URL firmada, corta, solo para quien puede ver esa historia.
// Mismo criterio que /api/audio/[respuestaId].

const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ fotoId: string }> }) {
  const { fotoId } = await params;
  const sesion = await crearClienteSesion();
  const { data: { user } } = await sesion.auth.getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });

  const admin = crearClienteServidor();
  const { data: foto } = await admin.from("fotos").select("id, narrador_id, storage_path").eq("id", fotoId).maybeSingle();
  const f = foto as { id: string; narrador_id: string; storage_path: string } | null;
  if (!f) return NextResponse.json({ error: "No encontramos esa foto." }, { status: 404 });

  const { historia } = await historiaAccesible(admin, user, f.narrador_id);
  if (!historia) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { data: firmado, error } = await admin.storage.from("audios").createSignedUrl(f.storage_path, DURACION_URL_FIRMADA_SEGUNDOS);
  if (error || !firmado?.signedUrl) {
    console.error("fotos: fallo al firmar", error);
    return NextResponse.json({ error: "No pudimos mostrar la foto." }, { status: 500 });
  }
  return NextResponse.redirect(firmado.signedUrl, 302);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ fotoId: string }> }) {
  const { fotoId } = await params;
  const sesion = await crearClienteSesion();
  const { data: { user } } = await sesion.auth.getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });

  const admin = crearClienteServidor();
  const { data: foto } = await admin.from("fotos").select("id, narrador_id, storage_path, subida_por").eq("id", fotoId).maybeSingle();
  const f = foto as { id: string; narrador_id: string; storage_path: string; subida_por: string | null } | null;
  if (!f) return NextResponse.json({ error: "No encontramos esa foto." }, { status: 404 });

  const { historia } = await historiaAccesible(admin, user, f.narrador_id);
  if (!historia) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  // La dueña borra cualquiera; un invitado, solo las que subió él.
  if (historia.rol !== "duena" && f.subida_por !== user.id) {
    return NextResponse.json({ error: "Solo podés borrar las fotos que subiste vos." }, { status: 403 });
  }

  // Si una pregunta la usaba, esa pregunta se queda sin foto pero sigue existiendo.
  await admin.from("preguntas").update({ foto_id: null }).eq("foto_id", f.id);
  const { error } = await admin.from("fotos").delete().eq("id", f.id);
  if (error) {
    console.error("fotos: fallo al borrar", error);
    return NextResponse.json({ error: "No pudimos borrar la foto." }, { status: 500 });
  }
  await admin.storage.from("audios").remove([f.storage_path]);
  return NextResponse.json({ ok: true });
}

// Dos cosas sobre una foto, solo la dueña y solo mientras el libro no esté encargado:
//  - MOVERLA (docs/panel-usuario.md §15.2): `{capitulo, principal}` — del álbum a un
//    capítulo (como portada o adicional) o de vuelta al álbum (`capitulo: null`).
//  - ENCUADRARLA (3b.6, 18/09): `{foco}` y/o `{posicion}` — el punto que queda
//    centrado al recortar, y si la principal va arriba o debajo del título.
// Un cuerpo puede traer una cosa o la otra; sin ninguna, 400.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ fotoId: string }> }) {
  const { fotoId } = await params;
  const sesion = await crearClienteSesion();
  const { data: { user } } = await sesion.auth.getUser();
  if (!user) return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });

  let body: { capitulo?: unknown; principal?: unknown; foco?: unknown; posicion?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "No llegó nada para guardar." }, { status: 400 });
  }
  const mueve = "capitulo" in body;
  const encuadra = "foco" in body || "posicion" in body;
  if (!mueve && !encuadra) return NextResponse.json({ error: "Decinos a qué capítulo va, o cómo se encuadra." }, { status: 400 });

  const capitulo = !mueve ? undefined : body.capitulo === null ? null : typeof body.capitulo === "string" && body.capitulo.trim() ? body.capitulo.trim() : undefined;
  if (mueve && capitulo === undefined) return NextResponse.json({ error: "Decinos a qué capítulo va, o null para el álbum." }, { status: 400 });
  const principal = capitulo != null && body.principal === true;

  const encuadre: { foco?: Foco; posicion?: Posicion } = {};
  if ("foco" in body) {
    const foco = validarFoco(body.foco);
    if (!foco) return NextResponse.json({ error: "El punto de la foto no es válido." }, { status: 400 });
    encuadre.foco = foco;
  }
  if ("posicion" in body) {
    if (!validarPosicion(body.posicion)) return NextResponse.json({ error: "La posición tiene que ser arriba o abajo." }, { status: 400 });
    encuadre.posicion = body.posicion;
  }

  const admin = crearClienteServidor();
  const { data: foto } = await admin.from("fotos").select("id, narrador_id").eq("id", fotoId).maybeSingle();
  const f = foto as { id: string; narrador_id: string } | null;
  if (!f) return NextResponse.json({ error: "No encontramos esa foto." }, { status: 404 });

  const { historia } = await historiaAccesible(admin, user, f.narrador_id);
  if (!historia || historia.rol !== "duena") return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { data: fila } = await admin.from("narradores").select("libro_aprobado_at").eq("id", f.narrador_id).maybeSingle();
  if ((fila as { libro_aprobado_at?: string | null } | null)?.libro_aprobado_at) {
    return NextResponse.json({ error: "El libro ya está encargado: las fotos no se mueven más." }, { status: 400 });
  }

  if (!mueve) {
    const { error } = await admin.from("fotos").update(encuadre).eq("id", f.id);
    if (error) {
      console.error("fotos: fallo al encuadrar", error);
      return NextResponse.json({ error: "No pudimos guardar el encuadre." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (capitulo != null) {
    // El capítulo tiene que existir en el guion de esta historia (propio o de la plantilla).
    const [{ data: propias }, { data: globales }] = await Promise.all([
      admin.from("preguntas").select("capitulo").eq("narrador_id", f.narrador_id),
      admin.from("preguntas").select("capitulo").is("narrador_id", null),
    ]);
    const conocidos = new Set([...((propias as { capitulo: string }[] | null) ?? []), ...((globales as { capitulo: string }[] | null) ?? [])].map((p) => p.capitulo));
    if (!conocidos.has(capitulo)) return NextResponse.json({ error: "Ese capítulo no existe en este libro." }, { status: 400 });
    if (principal) {
      await admin.from("fotos").update({ principal: false }).eq("narrador_id", f.narrador_id).eq("capitulo", capitulo).eq("principal", true);
    }
  }

  const { error } = await admin.from("fotos").update({ capitulo, principal, ...encuadre }).eq("id", f.id);
  if (error) {
    console.error("fotos: fallo al mover", error);
    return NextResponse.json({ error: "No pudimos mover la foto." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
