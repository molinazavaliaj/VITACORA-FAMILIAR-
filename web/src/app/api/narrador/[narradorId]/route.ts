import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

const MENSAJE_ERROR_GENERICO = "No pudimos completar la acción. Intenta de nuevo.";
const MINIMO_RESPUESTAS_CIERRE_ANTICIPADO = 10;
const ESTADOS_QUE_PERMITEN_CIERRE = ["activo", "pausado"];

type Accion = "apagar_alerta" | "cierre_anticipado";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ narradorId: string }> },
) {
  const { narradorId } = await params;

  const supabaseSesion = await crearClienteSesion();

  const {
    data: { user },
    error: errorSesion,
  } = await supabaseSesion.auth.getUser();

  if (errorSesion || !user) {
    return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });
  }

  let body: { accion?: Accion };
  try {
    body = (await request.json()) as { accion?: Accion };
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no es JSON válido." },
      { status: 400 },
    );
  }

  if (body.accion !== "apagar_alerta" && body.accion !== "cierre_anticipado") {
    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  }

  const admin = crearClienteServidor();

  const { data: familia, error: errorFamilia } = await admin
    .from("familias")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("narrador PATCH: fallo la busqueda de familia", errorFamilia);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { data: narrador, error: errorNarrador } = await admin
    .from("narradores")
    .select("id, familia_id, estado")
    .eq("id", narradorId)
    .maybeSingle();

  if (errorNarrador) {
    console.error("narrador PATCH: fallo la busqueda de narrador", errorNarrador);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const datosNarrador = narrador as { id: string; familia_id: string; estado: string } | null;

  if (!datosNarrador || datosNarrador.familia_id !== (familia as { id: string }).id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (body.accion === "apagar_alerta") {
    const { error: errorUpdate } = await admin
      .from("narradores")
      .update({ alerta_silencio: false })
      .eq("id", narradorId);

    if (errorUpdate) {
      console.error("narrador PATCH: fallo apagar_alerta", errorUpdate);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // accion === "cierre_anticipado"
  if (!ESTADOS_QUE_PERMITEN_CIERRE.includes(datosNarrador.estado)) {
    return NextResponse.json(
      { error: "La bitácora no está en un estado que permita cerrarla antes de tiempo." },
      { status: 400 },
    );
  }

  const { data: respuestas, error: errorRespuestas } = await admin
    .from("respuestas")
    .select("pregunta_orden")
    .eq("narrador_id", narradorId);

  if (errorRespuestas) {
    console.error("narrador PATCH: fallo contar respuestas", errorRespuestas);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const ordenesDistintos = new Set(
    ((respuestas as { pregunta_orden: number }[] | null) ?? []).map((r) => r.pregunta_orden),
  );

  if (ordenesDistintos.size < MINIMO_RESPUESTAS_CIERRE_ANTICIPADO) {
    return NextResponse.json(
      {
        error: `Todavía no llegó a las ${MINIMO_RESPUESTAS_CIERRE_ANTICIPADO} respuestas necesarias para cerrar antes de tiempo.`,
      },
      { status: 400 },
    );
  }

  const { error: errorUpdate } = await admin
    .from("narradores")
    .update({ estado: "cerrado_anticipado" })
    .eq("id", narradorId);

  if (errorUpdate) {
    console.error("narrador PATCH: fallo cierre_anticipado", errorUpdate);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
