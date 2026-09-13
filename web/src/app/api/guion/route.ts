import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion, PUEDE, type Rol } from "@/lib/panel";
import {
  esEditable, puedeAgregar, puedeSaltar, renumerar, reordenar, siguienteOrden,
  validarRitmo, validarTexto, type PreguntaGuion,
} from "@/lib/guion";

// El guion de una historia (docs/panel-usuario.md §6). Una sola ruta, varias
// acciones, todas sobre el narrador que dice `?narrador=`. Las reglas viven en
// lib/guion.ts; acá solo se aplica quién puede y se escribe en la base.

const GENERICO = "No pudimos guardar el cambio. Intenta de nuevo.";
const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];

type Accion =
  | { accion: "editar"; id: string; texto: string }
  | { accion: "saltar"; id: string }
  | { accion: "reordenar"; ids: string[] }
  | { accion: "agregar"; texto: string; capitulo: string; fotoId?: string | null }
  | { accion: "ritmo"; ritmo: string }
  | { accion: "evitar"; texto: string };

const SOLO_DUENA: Accion["accion"][] = ["editar", "saltar", "reordenar", "ritmo", "evitar"];

function respuesta(status: number, cuerpo: Record<string, unknown>) {
  return NextResponse.json(cuerpo, { status });
}

/** El guion propio del narrador. Si todavía no lo tiene, se copia de la plantilla global. */
async function guionPropio(admin: SupabaseClient, narradorId: string): Promise<PreguntaGuion[] | null> {
  const campos = "id, orden, texto, capitulo, tipo, foto_id";
  const { data, error } = await admin.from("preguntas").select(campos).eq("narrador_id", narradorId);
  if (error) {
    console.error("guion: fallo la lectura", error);
    return null;
  }
  let propias = (data as PreguntaGuion[] | null) ?? [];
  if (propias.some((p) => p.tipo === "fija")) return propias;

  // Narrador anterior a la migración del 12/09 (o creado sin copia): se le copia el guion ahora.
  const { data: globales, error: errorGlobales } = await admin
    .from("preguntas").select("orden, texto, capitulo").is("narrador_id", null);
  if (errorGlobales) {
    console.error("guion: fallo la lectura de la plantilla", errorGlobales);
    return null;
  }
  const ocupados = new Set(propias.map((p) => p.orden));
  const filas = ((globales as { orden: number; texto: string; capitulo: string }[] | null) ?? [])
    .filter((g) => !ocupados.has(g.orden))
    .map((g) => ({ narrador_id: narradorId, orden: g.orden, texto: g.texto, capitulo: g.capitulo, tipo: "fija" }));
  if (filas.length > 0) {
    const { error: errorCopia } = await admin.from("preguntas").insert(filas);
    if (errorCopia) {
      console.error("guion: fallo la copia de la plantilla", errorCopia);
      return null;
    }
  }
  const { data: relectura } = await admin.from("preguntas").select(campos).eq("narrador_id", narradorId);
  propias = (relectura as PreguntaGuion[] | null) ?? [];
  return propias;
}

/**
 * Aplica cambios de orden en dos pasos para no chocar con unique(narrador_id, orden):
 * primero todos a un orden provisorio, después al definitivo.
 */
async function aplicarOrdenes(admin: SupabaseClient, cambios: { id: string; orden: number }[]): Promise<boolean> {
  for (const c of cambios) {
    const { error } = await admin.from("preguntas").update({ orden: c.orden + 1000 }).eq("id", c.id);
    if (error) { console.error("guion: fallo el orden provisorio", error); return false; }
  }
  for (const c of cambios) {
    const { error } = await admin.from("preguntas").update({ orden: c.orden }).eq("id", c.id);
    if (error) { console.error("guion: fallo el orden definitivo", error); return false; }
  }
  return true;
}

export async function PATCH(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { mensajeError: GENERICO });
  if (!acceso.ok) return respuesta(acceso.status, { error: acceso.error });
  const { narrador, rol, user } = acceso;

  let body: Accion;
  try {
    body = (await request.json()) as Accion;
  } catch {
    return respuesta(400, { error: "El cuerpo de la solicitud no es JSON válido." });
  }
  if (!body || typeof body.accion !== "string") return respuesta(400, { error: "Falta la acción." });

  if (SOLO_DUENA.includes(body.accion) && !PUEDE.editarGuion(rol as Rol)) {
    return respuesta(403, { error: "Solo quien compró el libro puede cambiar el guion." });
  }
  if (ESTADOS_CERRADOS.includes(narrador.estado)) {
    return respuesta(400, { error: "La entrevista ya terminó: el guion no se cambia más." });
  }

  // Ritmo y evitar viven en contexto, no en preguntas.
  if (body.accion === "ritmo" || body.accion === "evitar") {
    const { data: fila } = await admin.from("narradores").select("contexto").eq("id", narrador.id).maybeSingle();
    const contexto = ((fila as { contexto?: Record<string, unknown> } | null)?.contexto) ?? {};
    if (body.accion === "ritmo") {
      if (!validarRitmo(body.ritmo)) return respuesta(400, { error: "Ritmo no reconocido." });
      contexto.ritmo = body.ritmo;
      // Los pilotos usaban modoRapido; 'seguido' es lo mismo. Se mantiene coherente.
      contexto.modoRapido = body.ritmo === "seguido";
    } else {
      const texto = typeof body.texto === "string" ? body.texto.trim().slice(0, 1000) : "";
      contexto.evitar = texto;
    }
    const { error } = await admin.from("narradores").update({ contexto }).eq("id", narrador.id);
    if (error) { console.error("guion: fallo contexto", error); return respuesta(500, { error: GENERICO }); }
    return respuesta(200, { ok: true });
  }

  const guion = await guionPropio(admin, narrador.id);
  if (!guion) return respuesta(500, { error: GENERICO });
  const diaActual = narrador.dia_actual;

  if (body.accion === "agregar") {
    if (!PUEDE.agregarPreguntasYFotos(rol as Rol)) return respuesta(403, { error: "No autorizado." });
    const texto = validarTexto(body.texto);
    if (!texto.ok) return respuesta(400, { error: texto.mensaje });
    const cupo = puedeAgregar(guion);
    if (!cupo.ok) return respuesta(400, { error: cupo.mensaje });
    const capitulo = typeof body.capitulo === "string" && body.capitulo.trim() ? body.capitulo.trim() : null;
    if (!capitulo) return respuesta(400, { error: "Elegí en qué capítulo va." });
    const fila: Record<string, unknown> = {
      narrador_id: narrador.id, orden: siguienteOrden(guion), texto: texto.texto, capitulo,
      tipo: "familia", agregada_por: user.id,
    };
    if (body.fotoId) fila.foto_id = body.fotoId;
    const { data, error } = await admin.from("preguntas").insert(fila).select("id, orden").single();
    if (error) { console.error("guion: fallo agregar", error); return respuesta(500, { error: GENERICO }); }
    return respuesta(200, { ok: true, pregunta: data });
  }

  if (body.accion === "editar") {
    const p = guion.find((q) => q.id === body.id);
    if (!p) return respuesta(404, { error: "No encontramos esa pregunta." });
    if (!esEditable(p, diaActual)) return respuesta(400, { error: "Esa pregunta ya se mandó o la escribe el biógrafo: no se cambia." });
    const texto = validarTexto(body.texto);
    if (!texto.ok) return respuesta(400, { error: texto.mensaje });
    const { error } = await admin.from("preguntas").update({ texto: texto.texto }).eq("id", p.id);
    if (error) { console.error("guion: fallo editar", error); return respuesta(500, { error: GENERICO }); }
    return respuesta(200, { ok: true });
  }

  if (body.accion === "saltar") {
    const p = guion.find((q) => q.id === body.id);
    if (!p) return respuesta(404, { error: "No encontramos esa pregunta." });
    if (!esEditable(p, diaActual)) return respuesta(400, { error: "Esa pregunta ya se mandó o la escribe el biógrafo: no se saca." });
    const piso = puedeSaltar(guion);
    if (!piso.ok) return respuesta(400, { error: piso.mensaje });
    const { error } = await admin.from("preguntas").delete().eq("id", p.id);
    if (error) { console.error("guion: fallo saltar", error); return respuesta(500, { error: GENERICO }); }
    const cambios = renumerar(guion.filter((q) => q.id !== p.id), diaActual);
    if (!(await aplicarOrdenes(admin, cambios))) return respuesta(500, { error: GENERICO });
    return respuesta(200, { ok: true });
  }

  if (body.accion === "reordenar") {
    if (!Array.isArray(body.ids) || !body.ids.every((id) => typeof id === "string")) {
      return respuesta(400, { error: "El orden tiene que ser una lista de preguntas." });
    }
    const r = reordenar(guion, diaActual, body.ids);
    if (!r.ok) return respuesta(400, { error: r.mensaje });
    if (!(await aplicarOrdenes(admin, r.cambios))) return respuesta(500, { error: GENERICO });
    return respuesta(200, { ok: true });
  }

  return respuesta(400, { error: "Acción no reconocida." });
}
