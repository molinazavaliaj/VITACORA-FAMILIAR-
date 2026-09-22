import type { SupabaseClient } from "@supabase/supabase-js";
import type { Edicion } from "./edicion";
import { propuestaPorDefecto } from "./edicion";
import { armarGuion, capitulosDelGuion } from "./guion";

// La muestra de un libro cerrado (docs/panel-usuario.md §8): lo que ve quien
// abre el link público o lo guardó como visitante. Portada, nombres de los
// capítulos, el primer párrafo y un minuto de audio. Nada más: el libro entero
// es lo que Martina pagó.

export type Muestra = {
  narradorId: string;
  nombre: string;
  titulo: string;
  subtitulo: string;
  portadaFotoId: string | null;
  capitulos: string[];
  primerParrafo: string | null;
  tieneAudio: boolean;
};

export async function armarMuestra(admin: SupabaseClient, narradorId: string): Promise<Muestra | null> {
  const { data: n } = await admin
    .from("narradores")
    .select("id, nombre, edicion, libro_aprobado_at")
    .eq("id", narradorId)
    .maybeSingle();
  const narrador = n as { id: string; nombre: string; edicion: Edicion | null; libro_aprobado_at: string | null } | null;
  // Solo un libro CERRADO tiene muestra pública.
  if (!narrador || !narrador.libro_aprobado_at) return null;

  const [{ data: propias }, { data: globales }, { data: primera }, { data: paquete }] = await Promise.all([
    admin.from("preguntas").select("orden, capitulo").eq("narrador_id", narrador.id).order("orden"),
    admin.from("preguntas").select("orden, capitulo").is("narrador_id", null).order("orden"),
    admin
      .from("respuestas")
      .select("transcripcion, texto_directo")
      .eq("narrador_id", narrador.id)
      .eq("es_repregunta", false)
      .order("pregunta_orden")
      .limit(1),
    admin.storage.from("audios").list(`${narrador.id}/paquete`),
  ]);

  // El guion entero (base global + propias), como en el panel; solo las propias
  // son las 4 adaptativas y daban una muestra de 4 capítulos (18/09).
  type PreguntaMuestra = { orden: number; capitulo: string };
  const guion = armarGuion(globales as PreguntaMuestra[] | null, propias as PreguntaMuestra[] | null);
  const capitulosGuion = capitulosDelGuion(guion);
  const edicion = narrador.edicion ?? {};
  const propuesta = propuestaPorDefecto(narrador.nombre, narrador.nombre, capitulosGuion);

  const texto = ((primera as { transcripcion: string | null; texto_directo: string | null }[] | null)?.[0]);
  const crudo = (texto?.transcripcion ?? texto?.texto_directo ?? "").trim();
  const primerParrafo = crudo ? crudo.split(/\n\s*\n/)[0].slice(0, 600) + (crudo.length > 600 ? "…" : "") : null;

  return {
    narradorId: narrador.id,
    nombre: narrador.nombre,
    titulo: edicion.titulo ?? propuesta.titulo,
    subtitulo: edicion.subtitulo ?? propuesta.subtitulo,
    portadaFotoId: edicion.portadaFotoId ?? null,
    // T3.1 (bitácora #36): con los títulos que puso la dueña en Encargar libro,
    // como el panel y el libro impreso. Sin título, el nombre del guion.
    capitulos: (edicion.ordenCapitulos?.length ? edicion.ordenCapitulos : capitulosGuion)
      .map((c) => edicion.titulosCapitulos?.[c]?.trim() || c),
    primerParrafo,
    tieneAudio: (paquete ?? []).some((a) => a.name === "muestra_audiolibro.mp3"),
  };
}
