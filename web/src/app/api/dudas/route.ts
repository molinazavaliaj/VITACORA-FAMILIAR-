// Las dudas del escritor V3: la familia contesta lo que la Etapa A no pudo
// resolver de los audios. Lee `{narrador}/escritor/dudas-familia.json` y escribe
// `{narrador}/escritor/correcciones.json`, que la Etapa B lee antes de escribir
// el libro (supabase/CONTRATO.md, "Escritor V3 en la fábrica").
//
// Contestan la dueña y los invitados (son los que conocen los datos reales); el
// visitante no. A diferencia de `nombres`, esto NO es `soloDuena`.

import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { validarCorreccionesFamilia, type DudaFamilia } from "@/lib/dudas";

const MENSAJE_ERROR_GENERICO = "No pudimos guardar tus respuestas. Intenta de nuevo.";

export async function POST(request: NextRequest) {
  const narradorId = request.nextUrl.searchParams.get("narrador");
  if (!narradorId) {
    return NextResponse.json({ error: "Falta la historia." }, { status: 400 });
  }

  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Hay que entrar de nuevo." }, { status: 401 });
  }

  const admin = crearClienteServidor();
  const { historia, error: errorHistoria } = await historiaAccesible(admin, user, narradorId);
  if (errorHistoria) {
    console.error("dudas POST: fallo el acceso", errorHistoria);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
  if (!historia || !PUEDE.contestarDudas(historia.rol)) {
    return NextResponse.json({ error: "No tenés acceso a esta historia." }, { status: 404 });
  }

  let body: { correcciones?: unknown };
  try {
    body = (await request.json()) as { correcciones?: unknown };
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }

  // Las dudas mandan: una respuesta que no apunta a ninguna no se sabe dónde
  // aplicar. Sin el archivo no hay nada que contestar.
  const { data: descargaDudas } = await admin.storage
    .from("audios")
    .download(`${historia.narrador.id}/escritor/dudas-familia.json`);
  if (!descargaDudas) {
    return NextResponse.json({ error: "Esta historia no tiene dudas para contestar." }, { status: 404 });
  }

  let dudas: DudaFamilia[];
  try {
    dudas = (JSON.parse(await descargaDudas.text()) as { dudas?: DudaFamilia[] }).dudas ?? [];
  } catch (err) {
    console.error("dudas POST: dudas-familia.json invalido", err);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const resultado = validarCorreccionesFamilia(body.correcciones, dudas);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.mensaje }, { status: 400 });
  }

  // Se reescribe el archivo entero con lo que mandó el formulario, que ya viene
  // precargado con lo guardado antes: así una respuesta nueva de un hermano no
  // borra la que dejó la hija, y la última sobre la misma duda gana.
  const contenido = JSON.stringify({ correcciones: resultado.correcciones });
  const { error: errorSubida } = await admin.storage
    .from("audios")
    .upload(`${historia.narrador.id}/escritor/correcciones.json`, contenido, {
      contentType: "application/json",
      upsert: true,
    });

  if (errorSubida) {
    console.error("dudas POST: fallo la subida de correcciones.json", errorSubida);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
