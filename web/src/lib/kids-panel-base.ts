import type { SupabaseClient } from "@supabase/supabase-js";
import { esTablaAusente } from "./tabla-ausente";
import {
  conCorreccion,
  diceEstaEn,
  fichaVigente,
  fusionarCambioKids,
  loQueCuenta,
  sinCorreccion,
  type CambioKids,
  type CambiosPanel,
  type CapituloKids,
  type CorreccionKids,
  type FallaCambioKids,
  type FallaCorreccion,
  type FilaKids,
  type FotoKids,
  type RespuestaKids,
} from "./kids-panel";

// El panel de Kids contra la base (K5, 15/10). Lo que la web escribe en
// `kids_v2` son solo `cambios_panel` y `correcciones` (CONTRATO, «Vitácora
// Kids V2 por WhatsApp»), cada una con su compare-and-swap:
//   - cambios_panel: UPDATE … WHERE cambios_panel IS NOT DISTINCT FROM <lo leído>
//   - correcciones:  UPDATE … WHERE correcciones = <lo leído>
// Ninguna toca `version` (es del entrevistador): así nunca le hace fallar una
// escritura a mitad de un envío. Si no vuelve fila, alguien escribió en el
// medio: se relee y se reintenta.
//
// Sin la tabla (migración sin aplicar), leerFilaKids devuelve null y el tablero
// se comporta como hoy.

/** `fichaMotor` = la ficha del motor (null hasta el arranque): el JSON del estado entero no hace falta. */
const COLUMNAS = "narrador_id, canal, ficha, fichaMotor:estado->motor->ficha, cambios_panel, cambios_error, avance, correcciones, termino_at";

/** Cuántas veces se relee y reintenta un compare-and-swap que perdió. */
export const INTENTOS_CAS = 4;

export async function leerFilaKids(admin: SupabaseClient, narradorId: string): Promise<{ fila: FilaKids | null; error: string | null }> {
  const { data, error } = await admin.from("kids_v2").select(COLUMNAS).eq("narrador_id", narradorId).maybeSingle();
  if (error) return esTablaAusente(error) ? { fila: null, error: null } : { fila: null, error: error.message ?? "kids_v2" };
  if (!data) return { fila: null, error: null };
  const f = data as unknown as FilaKids;
  return { fila: { ...f, fichaMotor: f.fichaMotor ?? null, correcciones: Array.isArray(f.correcciones) ? f.correcciones : [] }, error: null };
}

export type VistaKids = { fila: FilaKids; capitulos: CapituloKids[] };

/** La fila y todo lo que contó, para la página. Null si no es de Kids (o la tabla no existe). */
export async function leerPanelKids(admin: SupabaseClient, narradorId: string): Promise<{ vista: VistaKids | null; error: string | null }> {
  const [{ fila, error }, respuestas, fotos] = await Promise.all([
    leerFilaKids(admin, narradorId),
    admin
      .from("respuestas")
      .select("id, pregunta_orden, clave_kids, audio_path, transcripcion, texto_directo, duracion_segundos, recibido_at")
      .eq("narrador_id", narradorId)
      .order("pregunta_orden", { ascending: true })
      .order("recibido_at", { ascending: true }),
    admin.from("fotos").select("id, pregunta_orden").eq("narrador_id", narradorId).order("pregunta_orden", { ascending: true }),
  ]);
  if (error) return { vista: null, error };
  if (!fila) return { vista: null, error: null };
  if (respuestas.error) return { vista: null, error: respuestas.error.message ?? "respuestas" };
  const capitulos = loQueCuenta(
    (respuestas.data as RespuestaKids[] | null) ?? [],
    fotos.error ? [] : ((fotos.data as FotoKids[] | null) ?? []),
    fichaVigente(fila),
    fila.correcciones ?? [],
  );
  return { vista: { fila, capitulos }, error: null };
}

export type ResultadoGuardar<F extends string> =
  | { ok: true; cambios?: CambiosPanel; correcciones?: CorreccionKids[] }
  | { ok: false; falla: F | "noKids" | "ocupado" | "base" };

/** Guarda un cambio del panel (hora, temas, preguntas) fusionado con lo pendiente. */
export async function guardarCambiosPanel(admin: SupabaseClient, narradorId: string, cambio: CambioKids, ahora: string): Promise<ResultadoGuardar<FallaCambioKids>> {
  for (let i = 0; i < INTENTOS_CAS; i++) {
    const { fila, error } = await leerFilaKids(admin, narradorId);
    if (error) return { ok: false, falla: "base" };
    if (!fila) return { ok: false, falla: "noKids" };
    const fusion = fusionarCambioKids(fila, cambio, ahora);
    if (!fusion.ok) return fusion;
    const base = admin.from("kids_v2").update({ cambios_panel: fusion.cambios, cambios_error: null }).eq("narrador_id", narradorId);
    const condicion = fila.cambios_panel === null ? base.is("cambios_panel", null) : base.eq("cambios_panel", JSON.stringify(fila.cambios_panel));
    const { data, error: errorUpdate } = await condicion.select("narrador_id");
    if (errorUpdate) {
      console.error("kids: fallo guardar cambios_panel", errorUpdate);
      return { ok: false, falla: "base" };
    }
    if ((data as unknown[] | null)?.length) return { ok: true, cambios: fusion.cambios };
  }
  return { ok: false, falla: "ocupado" };
}

/** Agrega (o pisa) o quita una corrección de nombre. No cambia lo guardado en `respuestas`. */
export async function guardarCorreccion(
  admin: SupabaseClient,
  narradorId: string,
  c: { respuestaId: string; dice: string; es: string },
  modo: "agregar" | "quitar",
  ahora: string,
): Promise<ResultadoGuardar<FallaCorreccion | "respuesta">> {
  // La respuesta tiene que ser de este chico, y el nombre tiene que estar en lo que dijo.
  const { data: r, error: errorR } = await admin
    .from("respuestas")
    .select("id, transcripcion, texto_directo")
    .eq("id", c.respuestaId)
    .eq("narrador_id", narradorId)
    .maybeSingle();
  if (errorR) return { ok: false, falla: "base" };
  if (!r) return { ok: false, falla: "respuesta" };
  const resp = r as { transcripcion: string | null; texto_directo: string | null };
  if (modo === "agregar" && !diceEstaEn(resp.transcripcion ?? resp.texto_directo, c.dice)) return { ok: false, falla: "no-esta" };

  for (let i = 0; i < INTENTOS_CAS; i++) {
    const { fila, error } = await leerFilaKids(admin, narradorId);
    if (error) return { ok: false, falla: "base" };
    if (!fila) return { ok: false, falla: "noKids" };
    const leidas = fila.correcciones ?? [];
    const nuevas =
      modo === "agregar" ? conCorreccion(leidas, { respuesta_id: c.respuestaId, dice: c.dice, es: c.es, at: ahora }) : sinCorreccion(leidas, c.respuestaId, c.dice);
    const { data, error: errorUpdate } = await admin
      .from("kids_v2")
      .update({ correcciones: nuevas })
      .eq("narrador_id", narradorId)
      .eq("correcciones", JSON.stringify(leidas))
      .select("narrador_id");
    if (errorUpdate) {
      console.error("kids: fallo guardar correcciones", errorUpdate);
      return { ok: false, falla: "base" };
    }
    if ((data as unknown[] | null)?.length) return { ok: true, correcciones: nuevas };
  }
  return { ok: false, falla: "ocupado" };
}
