import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { loContadoEsPrivado, narradorDeLaSesion, PUEDE } from "@/lib/panel";
import { aplicarSeleccion, frasesElegidasParaVer, guardarFrases, imprentaFrenada, leerFrases, resumenDeCorte, RUTA_FRENO_IMPRENTA, validarSeleccion } from "@/lib/frases";
import { hayLibroListo } from "@/lib/libro-listo";
import { enviarMailSocios } from "@/lib/mail";
import { intenta, tratoDeLaFamilia } from "@/lib/trato";
import type { TratoComprador } from "@/lib/regalo-textos";

// «Su voz» en el panel (spec 2026-09-20-su-voz-design, "El panel de la
// familia"): GET devuelve frases.json tal cual; POST guarda la selección de la
// familia. Solo la dueña cambia (como los nombres); los invitados leen.

const MENSAJE_ERROR_GENERICO = (t: TratoComprador = "vos") => `No pudimos guardar las frases. ${intenta(t)} de nuevo.`;

export async function GET(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { mensajeError: MENSAJE_ERROR_GENERICO() });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  if (!PUEDE.verHistoriaCompleta(acceso.rol)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const privado = loContadoEsPrivado(acceso.narrador);
  if (privado && !(await hayLibroListo(admin, acceso.narrador.id))) return NextResponse.json({ error: "Todavía no hay frases." }, { status: 404 });
  const frases = await leerFrases(admin, acceso.narrador.id);
  if (!frases) return NextResponse.json({ error: "Todavía no hay frases." }, { status: 404 });
  return NextResponse.json(privado ? frasesElegidasParaVer(frases) : frases, { status: 200 });
}

export async function POST(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    mensajeError: MENSAJE_ERROR_GENERICO(), soloDuena: true,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });

  let body: { seleccion?: unknown; confirmar?: unknown; error?: unknown };
  try {
    body = (await request.json()) as { seleccion?: unknown; confirmar?: unknown; error?: unknown };
  } catch {
    return NextResponse.json({ error: "El pedido llegó mal formado." }, { status: 400 });
  }
  if (loContadoEsPrivado(acceso.narrador)) return postDeQuienRegala(admin, acceso.narrador, acceso.user.email ?? null, body);
  const validada = validarSeleccion(body.seleccion);
  if (!validada.ok) return NextResponse.json({ error: validada.mensaje }, { status: 400 });

  // Se relee justo antes de escribir: el worker de voz puede haber completado
  // audios mientras la familia miraba la página, y esos campos son de él.
  const actual = await leerFrases(admin, acceso.narrador.id);
  if (!actual) return NextResponse.json({ error: "Todavía no hay frases para elegir." }, { status: 404 });

  const resultado = aplicarSeleccion(actual, validada.seleccion, { confirmar: body.confirmar === true });
  if (!resultado.ok) return NextResponse.json({ error: resultado.mensaje }, { status: 400 });

  const { error } = await guardarFrases(admin, resultado.frases);
  if (error) {
    console.error("frases POST: fallo al guardar", error);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(await tratoDeLaFamilia(admin, acceso.narrador.familia_id)) }, { status: 500 });
  }
  return NextResponse.json({ ok: true, cambios: resultado.cambios, confirmado_at: resultado.frases.confirmado_at }, { status: 200 });
}

const LARGO_MINIMO_ERROR = 5;
const LARGO_MAXIMO_ERROR = 2000;
/** Ya salió de nuestras manos: frenarlo acá no lo frena de verdad. */
const ESTADOS_YA_EN_IMPRENTA = ["en_produccion", "impreso", "enviado", "entregado"];

/**
 * Quien regala no cambia las frases (Naza, 05/11). Con el libro listo tiene dos cosas para hacer: confirmar, que manda a
 * imprimir las que eligió el biógrafo, o avisar de un error de datos, que frena la imprenta hasta que los socios lo
 * corrijan a mano. Una selección en el pedido se rechaza: el servidor es quien lo impide, no el botón.
 */
async function postDeQuienRegala(
  admin: ReturnType<typeof crearClienteServidor>,
  narrador: { id: string; nombre: string; familia_id: string },
  email: string | null,
  body: { seleccion?: unknown; confirmar?: unknown; error?: unknown },
): Promise<NextResponse> {
  const trato = await tratoDeLaFamilia(admin, narrador.familia_id);
  const tu = trato === "tu";
  if (body.seleccion !== undefined) return NextResponse.json({ error: "Estas frases las elige el biógrafo." }, { status: 403 });
  if (!(await hayLibroListo(admin, narrador.id))) return NextResponse.json({ error: "El libro todavía no está listo." }, { status: 409 });
  const actual = await leerFrases(admin, narrador.id);
  if (!actual) return NextResponse.json({ error: "Todavía no hay frases." }, { status: 404 });

  if (typeof body.error === "string") {
    const detalle = body.error.trim().slice(0, LARGO_MAXIMO_ERROR);
    if (detalle.length < LARGO_MINIMO_ERROR) return NextResponse.json({ error: tu ? "Cuéntanos cuál es el error." : "Contanos cuál es el error." }, { status: 400 });
    const { data: entrega } = await admin.from("entregas").select("estado").eq("narrador_id", narrador.id).in("estado", ESTADOS_YA_EN_IMPRENTA).limit(1);
    if ((entrega as unknown[] | null)?.length) {
      return NextResponse.json({ error: tu ? "El libro ya está en la imprenta. Escríbenos a soporte@vitacorafamiliar.com." : "El libro ya está en la imprenta. Escribinos a soporte@vitacorafamiliar.com." }, { status: 409 });
    }
    const { error } = await admin.storage.from("audios").upload(
      RUTA_FRENO_IMPRENTA(narrador.id),
      JSON.stringify({ reportado_at: new Date().toISOString(), por: email, detalle }, null, 2),
      { contentType: "application/json", upsert: true, cacheControl: "0" },
    );
    if (error) {
      console.error("frases POST: fallo frenar la imprenta", error);
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
    }
    await enviarMailSocios(
      `Hay un error en el libro de ${narrador.nombre}: la imprenta quedó frenada`,
      `Quien compró avisó de un error de datos en el libro de ${narrador.nombre} (${narrador.id}).\n\n${detalle}\n\nLa imprenta no sale hasta corregirlo a mano y borrar ${RUTA_FRENO_IMPRENTA(narrador.id)}. No sirve para sacar historias: si pide eso, hay que hablarlo con el narrador.`,
    );
    return NextResponse.json({ ok: true, frenada: true }, { status: 200 });
  }

  if (body.confirmar !== true) return NextResponse.json({ error: "El pedido llegó mal formado." }, { status: 400 });
  if (await imprentaFrenada(admin, narrador.id)) {
    return NextResponse.json({ error: tu ? "Estamos corrigiendo el error que nos avisaste. Te escribimos cuando esté." : "Estamos corrigiendo el error que nos avisaste. Te escribimos cuando esté." }, { status: 409 });
  }
  if (resumenDeCorte(actual).pendientes > 0) {
    return NextResponse.json({ error: tu ? "Todavía estamos recortando los audios. Vuelve en un rato." : "Todavía estamos recortando los audios. Volvé en un rato." }, { status: 409 });
  }
  if (actual.confirmado_at) return NextResponse.json({ ok: true, confirmado_at: actual.confirmado_at }, { status: 200 });
  const resultado = aplicarSeleccion(actual, [], { confirmar: true });
  if (!resultado.ok) return NextResponse.json({ error: resultado.mensaje }, { status: 400 });
  const { error } = await guardarFrases(admin, resultado.frases);
  if (error) {
    console.error("frases POST: fallo confirmar", error);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO(trato) }, { status: 500 });
  }
  return NextResponse.json({ ok: true, confirmado_at: resultado.frases.confirmado_at }, { status: 200 });
}
