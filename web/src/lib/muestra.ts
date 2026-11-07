import type { SupabaseClient } from "@supabase/supabase-js";
import type { Edicion } from "./edicion";
import { propuestaPorDefecto } from "./edicion";
import { armarGuion, capitulosDelGuion } from "./guion";
import { idiomaDelLibro, type IdiomaLibro } from "./tapa";
import { loContadoEsPrivado } from "./panel";
import { hayLibroListo } from "./libro-listo";
import { leerDelEscritor } from "./dudas-archivos";

// La muestra de un libro cerrado (docs/panel-usuario.md §8): lo que ve quien
// abre el link público o lo guardó como visitante. Portada, nombres de los
// capítulos, el primer párrafo y un minuto de audio. Nada más: el libro entero
// es lo que Martina pagó.

export type Muestra = {
  narradorId: string;
  nombre: string;
  titulo: string;
  portadaFotoId: string | null;
  /** El idioma del libro: la tapa dice «el libro de su vida» o «el llibre de la seva vida». */
  idioma: IdiomaLibro;
  capitulos: string[];
  primerParrafo: string | null;
  tieneAudio: boolean;
};

/** El primer párrafo del libro escrito, sin títulos ni marcas: lo que se muestra si lo contado es privado. */
export function primerParrafoDelLibro(md: string | null): string | null {
  for (const bloque of (md ?? "").split(/\n\s*\n/)) {
    const t = bloque.trim();
    if (!t || /^(#|---|!\[|<|>)/.test(t)) continue;
    const limpio = t.replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
    if (limpio.length < 40) continue;
    return limpio.length > 600 ? `${limpio.slice(0, 600)}…` : limpio;
  }
  return null;
}

async function libroEscrito(admin: SupabaseClient, narradorId: string): Promise<string | null> {
  const delEscritor = await leerDelEscritor(admin, narradorId, "libro.md");
  if (delEscritor.texto) return delEscritor.texto;
  const { data } = await admin.storage.from("audios").download(`${narradorId}/paquete/borrador_libro.md`);
  return data ? data.text() : null;
}

export async function armarMuestra(admin: SupabaseClient, narradorId: string): Promise<Muestra | null> {
  const { data: n } = await admin
    .from("narradores")
    .select("id, nombre, edicion, libro_aprobado_at, contexto")
    .eq("id", narradorId)
    .maybeSingle();
  const narrador = n as { id: string; nombre: string; edicion: Edicion | null; libro_aprobado_at: string | null; contexto?: Record<string, unknown> | null } | null;
  // Solo un libro CERRADO tiene muestra pública.
  if (!narrador || !narrador.libro_aprobado_at) return null;
  // Privado (Naza, 05/11): con el libro listo, y con el primer párrafo del libro, nunca con la transcripción.
  const privado = loContadoEsPrivado(narrador);
  if (privado && !(await hayLibroListo(admin, narrador.id))) return null;

  const [{ data: propias }, { data: globales }, { data: primera }, { data: paquete }, { data: entrevista }] = await Promise.all([
    admin.from("preguntas").select("orden, capitulo").eq("narrador_id", narrador.id).order("orden"),
    admin.from("preguntas").select("orden, capitulo").is("narrador_id", null).order("orden"),
    admin
      .from("respuestas")
      .select(privado ? "id" : "transcripcion, texto_directo")
      .eq("narrador_id", narrador.id)
      .eq("es_repregunta", false)
      .order("pregunta_orden")
      .limit(1),
    admin.storage.from("audios").list(`${narrador.id}/paquete`),
    // Sin fila (flujo viejo) o sin la tabla, castellano.
    admin.from("entrevistas_v3").select("idioma").eq("narrador_id", narrador.id).maybeSingle(),
  ]);

  // El guion entero (base global + propias), como en el panel; solo las propias
  // son las 4 adaptativas y daban una muestra de 4 capítulos (18/09).
  type PreguntaMuestra = { orden: number; capitulo: string };
  const guion = armarGuion(globales as PreguntaMuestra[] | null, propias as PreguntaMuestra[] | null);
  const capitulosGuion = capitulosDelGuion(guion);
  const edicion = narrador.edicion ?? {};
  const propuesta = propuestaPorDefecto(narrador.nombre, capitulosGuion);

  const texto = ((primera as unknown as { transcripcion?: string | null; texto_directo?: string | null }[] | null)?.[0]);
  const crudo = privado ? "" : (texto?.transcripcion ?? texto?.texto_directo ?? "").trim();
  const primerParrafo = privado
    ? primerParrafoDelLibro(await libroEscrito(admin, narrador.id))
    : crudo ? crudo.split(/\n\s*\n/)[0].slice(0, 600) + (crudo.length > 600 ? "…" : "") : null;

  return {
    narradorId: narrador.id,
    nombre: narrador.nombre,
    titulo: edicion.titulo ?? propuesta.titulo,
    portadaFotoId: edicion.portadaFotoId ?? null,
    idioma: idiomaDelLibro((entrevista as { idioma?: string | null } | null)?.idioma),
    // T3.1 (bitácora #36): con los títulos que puso la dueña en Encargar libro,
    // como el panel y el libro impreso. Sin título, el nombre del guion.
    capitulos: (edicion.ordenCapitulos?.length ? edicion.ordenCapitulos : capitulosGuion)
      .map((c) => edicion.titulosCapitulos?.[c]?.trim() || c),
    primerParrafo,
    tieneAudio: (paquete ?? []).some((a) => a.name === "muestra_audiolibro.mp3"),
  };
}
