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
import { fusionarCorrecciones, leerCorreccionesGuardadas, leerDudas, validarCorreccionesFamilia } from "@/lib/dudas";
import { archivosDelEscritor, leerDelEscritor } from "@/lib/dudas-archivos";

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
  const id = historia.narrador.id;

  let body: { correcciones?: unknown };
  try {
    body = (await request.json()) as { correcciones?: unknown };
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }

  // Con el libro escrito, lo que se conteste ya no entra: no se guarda para que
  // nadie crea que sí. El cliente muestra su mensaje de falla de siempre.
  const { nombres, error: errorListado } = await archivosDelEscritor(admin, id);
  if (errorListado) {
    console.error("dudas POST: fallo el listado de escritor/", errorListado);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
  if (nombres.has("libro.md")) {
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 409 });
  }

  // Las dudas mandan: una respuesta que no apunta a ninguna no se sabe dónde
  // aplicar. Sin el archivo no hay nada que contestar; si no se pudo leer, es un error.
  const archivoDudas = await leerDelEscritor(admin, id, "dudas-familia.json");
  if (archivoDudas.error) {
    console.error("dudas POST: fallo la descarga de dudas-familia.json", archivoDudas.error);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
  if (archivoDudas.texto === null) {
    return NextResponse.json({ error: "Esta historia no tiene dudas para contestar." }, { status: 404 });
  }
  const dudas = leerDudas(archivoDudas.texto);
  if (!dudas) {
    console.error("dudas POST: dudas-familia.json invalido");
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  const resultado = validarCorreccionesFamilia(body.correcciones, dudas);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.mensaje }, { status: 400 });
  }

  // Lo que ya está guardado, de otros familiares y de los socios. Si no se pudo
  // leer o está roto, no se escribe: reescribirlo perdería lo que había.
  const archivoCorrecciones = await leerDelEscritor(admin, id, "correcciones.json");
  if (archivoCorrecciones.error) {
    console.error("dudas POST: fallo la descarga de correcciones.json", archivoCorrecciones.error);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }
  let guardadas: unknown[] = [];
  if (archivoCorrecciones.texto !== null) {
    const leidas = leerCorreccionesGuardadas(archivoCorrecciones.texto);
    if (!leidas) {
      console.error("dudas POST: correcciones.json invalido, no se pisa");
      return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
    }
    guardadas = leidas;
  }

  const autor = { quien: await nombreDeQuienContesta(admin, historia), mail: user.email ?? undefined };
  const correcciones = fusionarCorrecciones(guardadas, resultado.correcciones, dudas, autor);

  const { error: errorSubida } = await admin.storage
    .from("audios")
    .upload(`${id}/escritor/correcciones.json`, JSON.stringify({ correcciones }), {
      contentType: "application/json",
      upsert: true,
      cacheControl: "0",
    });

  if (errorSubida) {
    console.error("dudas POST: fallo la subida de correcciones.json", errorSubida);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

/**
 * El nombre de quien contesta, para mostrárselo a los otros familiares. La base
 * solo lo tiene de la dueña (`familias.nombre`); de un invitado no hay nombre y
 * no se inventa uno con el mail: queda solo el mail, para los socios.
 */
async function nombreDeQuienContesta(
  admin: ReturnType<typeof crearClienteServidor>,
  historia: { rol: string; narrador: { familia_id: string } },
): Promise<string | undefined> {
  if (historia.rol !== "duena") return undefined;
  const { data, error } = await admin.from("familias").select("nombre").eq("id", historia.narrador.familia_id).maybeSingle();
  if (error) {
    console.warn("dudas POST: no se pudo leer el nombre de la familia", error.message);
    return undefined;
  }
  const nombre = (data as { nombre?: unknown } | null)?.nombre;
  return typeof nombre === "string" && nombre.trim() !== "" ? nombre.trim().slice(0, 120) : undefined;
}
