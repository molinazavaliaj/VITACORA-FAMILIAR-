import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";
import { tratoDeLaFamilia } from "@/lib/trato";
import { hoyEn, mensajesDeFechas, validarFechas, viajeDelContexto } from "@/lib/viaje";

// Las fechas del viaje desde la página del viaje (Vitácora de Viaje V2, 16/10;
// antes «Fechas y etapas», commit 2c363ea5). Solo `salida` y `vuelta`: en la
// V2 no hay etapas ni ángulos que tocar.
//
// Se cambian en `contexto.viaje` mientras el bot NO tomó el viaje (sin fila en
// `viajes_v2`): el bot crea esa fila con lo que lee del contexto, así que
// arranca con las fechas nuevas. Con la fila creada, las fechas viven en
// `viajes_v2.compra` y su reloj (escrituras con versión, del bot): la web no
// las pisa y las cambia el equipo. Las reglas son las de la compra (mínimo 3
// días, la salida no puede haber pasado; lib/viaje.ts validarFechas).

export async function PATCH(request: NextRequest) {
  const admin = crearClienteServidor();
  const GENERICO = "No pudimos guardar las fechas. Intenta de nuevo.";
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { soloDuena: true, mensajeError: GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const { narrador } = acceso;
  const tu = (await tratoDeLaFamilia(admin, narrador.familia_id)) === "tu";

  let body: { salida?: unknown; vuelta?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "No llegó nada para guardar." }, { status: 400 });
  }

  const { data: fila } = await admin.from("narradores").select("contexto, estado").eq("id", narrador.id).maybeSingle();
  const f = fila as { contexto?: Record<string, unknown>; estado: string } | null;
  const viaje = viajeDelContexto(f?.contexto);
  if (!f || !viaje) return NextResponse.json({ error: "Esta historia no es un viaje." }, { status: 400 });
  // TEXTO PARA NAZA: los errores de las fechas en la página del viaje.
  if (["completado", "cerrado_anticipado"].includes(f.estado)) return NextResponse.json({ error: "El viaje ya terminó. Las fechas no se cambian más." }, { status: 400 });

  // El bot ya tomó el viaje: las fechas son suyas. (Si el bot crea su fila justo entre
  // esta lectura y la escritura de abajo, el cambio queda solo en el contexto y el bot
  // no lo ve: la ventana es de milisegundos y el equipo lo corrige a mano.)
  const { data: filaV2, error: errorV2 } = await admin.from("viajes_v2").select("narrador_id").eq("narrador_id", narrador.id).maybeSingle();
  const tablaAusente = errorV2 && (errorV2.code === "42P01" || errorV2.code === "PGRST205");
  if (filaV2 || (errorV2 && !tablaAusente)) {
    return NextResponse.json({ error: `El viaje ya empezó. Para cambiar las fechas, ${tu ? "escríbenos" : "escribinos"} y lo hacemos nosotros.` }, { status: 400 });
  }

  const zonaCasa = typeof viaje.zonaCasa === "string" ? viaje.zonaCasa : "UTC";
  // «La salida ya pasó» solo cuenta si la cambia: con la salida de siempre (aunque ya
  // haya pasado), se puede correr la vuelta.
  const salida = body.salida ?? viaje.salida;
  const hoy = salida === viaje.salida ? "" : hoyEn(zonaCasa);
  const fechas = validarFechas(salida, body.vuelta ?? viaje.vuelta, hoy, mensajesDeFechas(tu));
  if (!fechas.ok) return NextResponse.json({ error: fechas.mensaje }, { status: 400 });

  const contexto = { ...(f.contexto ?? {}), viaje: { ...viaje, salida: fechas.salida, vuelta: fechas.vuelta } };
  const { error } = await admin.from("narradores").update({ contexto }).eq("id", narrador.id);
  if (error) {
    console.error("viaje: fallo guardar las fechas", error);
    return NextResponse.json({ error: GENERICO }, { status: 500 });
  }
  return NextResponse.json({ ok: true, salida: fechas.salida, vuelta: fechas.vuelta });
}
