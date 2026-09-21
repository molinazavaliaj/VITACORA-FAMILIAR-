import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { etapaDeFecha, fechaDelDia, validarAngulos, validarEtapas, type Viaje, SIN_ETAPA } from "@/lib/viaje";

// Las etapas del viaje, vivas (docs/vitacora-de-viaje.md): el viajero agrega,
// renombra o fecha etapas desde el panel. Se guardan en contexto.viaje.etapas
// y las preguntas que TODAVÍA NO se mandaron se reasignan al capítulo que les
// toca por fecha. Las ya mandadas no se tocan (salvo que la etapa cambie de
// nombre: ahí el capítulo se renombra para que el libro quede consistente).
//
// También los ángulos (3t.19, "sobre qué te preguntamos"): van a
// contexto.viaje.angulos y el bot los lee al armar la pregunta de cada noche
// (entrevistador anguloDelDia), así que el cambio rige desde mañana. Cada
// clave del cuerpo es independiente: si no viene, no se toca.

const GENERICO = "No pudimos guardar las etapas. Intenta de nuevo.";

export async function PATCH(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { soloDuena: true, mensajeError: GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { narrador } = acceso;

  let body: { etapas?: unknown; renombres?: unknown; angulos?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "No llegó nada para guardar." }, { status: 400 });
  }

  const { data: fila } = await admin.from("narradores").select("contexto, dia_actual, estado").eq("id", narrador.id).maybeSingle();
  const f = fila as { contexto?: Record<string, unknown>; dia_actual: number; estado: string } | null;
  const viajeActual = f?.contexto?.viaje as Viaje | undefined;
  if (!f || f.contexto?.modo !== "viaje" || !viajeActual) return NextResponse.json({ error: "Esta historia no es un viaje." }, { status: 400 });
  if (["completado", "cerrado_anticipado"].includes(f.estado)) return NextResponse.json({ error: "El viaje ya terminó: las etapas no se cambian más." }, { status: 400 });

  if (body.etapas === undefined && body.angulos === undefined) return NextResponse.json({ error: "No llegó nada para guardar." }, { status: 400 });

  const viaje: Viaje = { ...viajeActual };
  if (body.etapas !== undefined) {
    const v = validarEtapas(body.etapas, viajeActual);
    if (!v.ok) return NextResponse.json({ error: v.mensaje }, { status: 400 });
    viaje.etapas = v.etapas;
  }
  if (body.angulos !== undefined) {
    const a = validarAngulos(body.angulos);
    if (!a.ok) return NextResponse.json({ error: a.mensaje }, { status: 400 });
    viaje.angulos = a.angulos;
  }

  // Renombres: [{ de, a }] — el capítulo de las preguntas ya mandadas sigue al nombre nuevo.
  const renombres = Array.isArray(body.renombres)
    ? (body.renombres as { de?: unknown; a?: unknown }[]).filter((r) => typeof r.de === "string" && typeof r.a === "string" && r.de !== r.a) as { de: string; a: string }[]
    : [];

  const contexto = { ...(f.contexto ?? {}), viaje };
  const { error } = await admin.from("narradores").update({ contexto }).eq("id", narrador.id);
  if (error) {
    console.error("viaje: fallo guardar", error);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }
  // Solo ángulos: no hay capítulos que reasignar.
  if (body.etapas === undefined) return NextResponse.json({ ok: true, angulos: viaje.angulos ?? [] });

  for (const r of renombres) {
    await admin.from("preguntas").update({ capitulo: r.a }).eq("narrador_id", narrador.id).eq("capitulo", r.de);
    await admin.from("fotos").update({ capitulo: r.a }).eq("narrador_id", narrador.id).eq("capitulo", r.de);
  }

  // Las preguntas por venir se reasignan por fecha. Si el guion todavía no nació (no dijo SÍ), no hay nada que tocar.
  const { data: preguntas } = await admin.from("preguntas").select("id, orden, capitulo").eq("narrador_id", narrador.id).gt("orden", f.dia_actual);
  let reasignadas = 0;
  for (const p of (preguntas as { id: string; orden: number; capitulo: string }[] | null) ?? []) {
    const capitulo = etapaDeFecha(viaje, fechaDelDia(viaje, p.orden));
    if (capitulo !== p.capitulo) {
      await admin.from("preguntas").update({ capitulo }).eq("id", p.id);
      reasignadas++;
    }
  }
  return NextResponse.json({ ok: true, etapas: viaje.etapas, reasignadas, sinEtapa: SIN_ETAPA });
}
