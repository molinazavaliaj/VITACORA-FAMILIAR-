// Las dudas del escritor V3: la familia contesta lo que la Etapa A no pudo
// resolver de los audios. Lee `{narrador}/escritor/dudas-familia.json` y escribe
// `{narrador}/escritor/correcciones.json` (en una historia, `escritor-historia/`), que la Etapa B lee antes de escribir
// el libro (supabase/CONTRATO.md, "Escritor V3 en la fábrica").
//
// Contestan la dueña y los invitados (son los que conocen los datos reales); el
// visitante no. A diferencia de `nombres`, esto NO es `soloDuena`. Si lo contado es
// privado, nadie contesta por acá: las dudas van a quien contó, por su link (Naza, 06/11).

import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, loContadoEsPrivado, PUEDE } from "@/lib/panel";
import { ESTADO_DE_LA_FALLA, guardarRespuestasDudas } from "@/lib/dudas-guardar";
import { intenta, tratoDeLaFamilia } from "@/lib/trato";
import { tratoDeRegion, type TratoComprador } from "@/lib/regalo-textos";
import { regionDelRequest } from "@/lib/region";

const MENSAJE_ERROR_GENERICO = (t: TratoComprador = "vos") => `No pudimos guardar tus respuestas. ${intenta(t)} de nuevo.`;

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
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO() }, { status: 500 });
  }
  if (!historia || !PUEDE.contestarDudas(historia.rol) || loContadoEsPrivado(historia.narrador)) {
    // Sin acceso no se lee la familia de la historia: el trato sale del país del pedido.
    const tu = tratoDeRegion(regionDelRequest(request.headers)) === "tu";
    return NextResponse.json({ error: tu ? "No tienes acceso a esta historia." : "No tenés acceso a esta historia." }, { status: 404 });
  }
  const id = historia.narrador.id;
  // Vos o tú: el de la familia dueña de la historia.
  const trato = await tratoDeLaFamilia(admin, historia.narrador.familia_id);

  let body: { correcciones?: unknown };
  try {
    body = (await request.json()) as { correcciones?: unknown };
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }

  const autor = { quien: await nombreDeQuienContesta(admin, historia), mail: user.email ?? undefined };
  const resultado = await guardarRespuestasDudas(admin, id, body.correcciones, autor);
  if (resultado.ok) return NextResponse.json({ ok: true }, { status: 200 });

  // Con el libro escrito o con una falla, el cliente muestra su mensaje de siempre.
  const mensaje = resultado.motivo === "sin_dudas" ? "Esta historia no tiene dudas para contestar." : resultado.mensaje ?? MENSAJE_ERROR_GENERICO(trato);
  return NextResponse.json({ error: mensaje }, { status: ESTADO_DE_LA_FALLA[resultado.motivo] });
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
