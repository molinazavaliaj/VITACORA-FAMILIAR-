import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { diasDelViaje, planDeGuion, validarAngulos, validarEtapas, validarFechas, type Viaje, SIN_ETAPA } from "@/lib/viaje";

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
//
// Y las fechas (12/10): `salida` y `vuelta`. Antes de la primera pregunta se
// cambian las dos; con el viaje en marcha, solo la vuelta (lib/viaje.ts
// validarFechas). Estirar suma noches al guion; acortar borra las que sobran y
// todavía no salieron. Lo ya mandado no se toca nunca.

const GENERICO = "No pudimos guardar las etapas. Intenta de nuevo.";

export async function PATCH(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { soloDuena: true, mensajeError: GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { narrador } = acceso;

  let body: { etapas?: unknown; renombres?: unknown; angulos?: unknown; salida?: unknown; vuelta?: unknown };
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

  if (body.etapas === undefined && body.angulos === undefined && body.salida === undefined && body.vuelta === undefined) {
    return NextResponse.json({ error: "No llegó nada para guardar." }, { status: 400 });
  }

  const viaje: Viaje = { ...viajeActual };
  const salida = body.salida ?? viajeActual.salida;
  const vuelta = body.vuelta ?? viajeActual.vuelta;
  const cambianFechas = salida !== viajeActual.salida || vuelta !== viajeActual.vuelta;
  if (cambianFechas) {
    // La Viaje V2 tiene sus fechas en viajes_v2.compra y su propio reloj: cambiarlas
    // acá movería el panel y no el bot. Hasta que la V2 lo resuelva, las mueven los socios.
    const { data: filaV2, error: errorV2 } = await admin.from("viajes_v2").select("narrador_id").eq("narrador_id", narrador.id).maybeSingle();
    if (filaV2 || (errorV2 && errorV2.code !== "42P01")) return NextResponse.json({ error: "Para cambiar las fechas de este viaje, escribinos y lo hacemos nosotros." }, { status: 400 });
    const fechas = validarFechas(viajeActual, salida, vuelta, f.dia_actual);
    if (!fechas.ok) return NextResponse.json({ error: fechas.mensaje }, { status: 400 });
    // Ya pasó la última noche del guion (está en la pregunta de cierre): no hay noches que mover.
    if (f.dia_actual > diasDelViaje(viajeActual)) return NextResponse.json({ error: "El viaje ya está cerrando: las fechas no se cambian más." }, { status: 400 });
    const nuevas = diasDelViaje(fechas);
    // Acortar justo hasta la última noche mandada, si ya la contestó: el bot cierra
    // al recibir la respuesta de la última, y esa respuesta ya llegó. Quedaría colgado.
    if (f.dia_actual >= 1 && nuevas === f.dia_actual) {
      const { data: contestada } = await admin.from("respuestas").select("id").eq("narrador_id", narrador.id).eq("pregunta_orden", f.dia_actual).limit(1);
      if ((contestada?.length ?? 0) > 0) return NextResponse.json({ error: "Esa noche ya la contaste: la vuelta tiene que ser al menos un día después." }, { status: 400 });
    }
    viaje.salida = fechas.salida;
    viaje.vuelta = fechas.vuelta;
  }
  // Las etapas se validan contra las fechas nuevas: si cambian las fechas y no
  // vienen etapas, las de siempre tienen que seguir entrando en el viaje.
  if (body.etapas !== undefined || cambianFechas) {
    const v = validarEtapas(body.etapas ?? viajeActual.etapas, viaje);
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
  if (body.etapas === undefined && !cambianFechas) return NextResponse.json({ ok: true, angulos: viaje.angulos ?? [] });

  for (const r of renombres) {
    await admin.from("preguntas").update({ capitulo: r.a }).eq("narrador_id", narrador.id).eq("capitulo", r.de);
    await admin.from("fotos").update({ capitulo: r.a }).eq("narrador_id", narrador.id).eq("capitulo", r.de);
  }

  // Las noches por venir se rearman con el viaje nuevo: capítulo y texto (el
  // ángulo de llegada/despedida depende de las fechas), más las noches que se
  // sumaron o sobran. Si el guion todavía no nació (no dijo SÍ), no hay nada
  // que tocar: el bot lo arma con las fechas nuevas al aceptar.
  const { count: guionNacido } = await admin.from("preguntas").select("id", { count: "exact", head: true }).eq("narrador_id", narrador.id);
  let reasignadas = 0;
  if ((guionNacido ?? 0) > 0) {
    const { data: porVenir } = await admin.from("preguntas").select("id, orden, tipo, texto, capitulo").eq("narrador_id", narrador.id).gt("orden", f.dia_actual);
    const plan = planDeGuion(viaje, f.dia_actual, (porVenir as Parameters<typeof planDeGuion>[2] | null) ?? []);
    for (const p of plan.actualizar) {
      await admin.from("preguntas").update({ texto: p.texto, capitulo: p.capitulo }).eq("id", p.id);
      if (p.cambiaCapitulo) reasignadas++;
    }
    if (plan.borrar.length > 0) await admin.from("preguntas").delete().in("id", plan.borrar);
    if (plan.agregar.length > 0) {
      const { error: errorAlta } = await admin.from("preguntas").insert(plan.agregar.map((p) => ({ narrador_id: narrador.id, ...p, tipo: "fija" })));
      if (errorAlta) {
        console.error("viaje: fallo sumar las noches nuevas", errorAlta);
        return NextResponse.json({ error: "Guardamos las fechas, pero no pudimos sumar las noches nuevas. Escribinos." }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ ok: true, etapas: viaje.etapas, salida: viaje.salida, vuelta: viaje.vuelta, noches: diasDelViaje(viaje), reasignadas, sinEtapa: SIN_ETAPA });
}
