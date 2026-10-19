import type { SupabaseClient } from "@supabase/supabase-js";
import { esTablaAusente } from "../tabla-ausente";
import type { AvanceKids, MarcaKids } from "../kids-panel";

// Los chicos de Vitácora Kids para el panel de la empresa (/admin/kids, K5).
// Las `marcas` las agrega el entrevistador con las salidas `marca` del motor
// (CONTRATO: `[{ motivo, detalle, at }]`, motivo = preocupante,
// silencio-8-dias, escribio-despues-del-final o cerro-sin-respuesta). Los
// padres no las ven: esto es solo para Naza. Lo preocupante, primero.

export type ChicoKids = {
  narradorId: string;
  nombre: string | null;
  comoLeDicen: string | null;
  estado: string | null;
  canal: "A" | "B";
  avance: AvanceKids;
  marcas: MarcaKids[];
  creadaAt: string | null;
  empezoAt: string | null;
  terminoAt: string | null;
  ultimaRespuestaAt: string | null;
};

/** Cuánto pesa cada marca: menos = más arriba. */
export const GRAVEDAD_MARCA: Record<string, number> = {
  preocupante: 0,
  "silencio-8-dias": 1,
  "cerro-sin-respuesta": 2,
  "escribio-despues-del-final": 3,
};
const SIN_MARCAS = 9;
const OTRA_MARCA = 4;

export function gravedad(c: Pick<ChicoKids, "marcas">): number {
  return c.marcas.reduce((g, m) => Math.min(g, GRAVEDAD_MARCA[m.motivo] ?? OTRA_MARCA), SIN_MARCAS);
}

const ultimaMarca = (c: Pick<ChicoKids, "marcas">) => c.marcas.reduce((u, m) => (m.at > u ? m.at : u), "");

/** Lo preocupante primero; con la misma gravedad, la marca más nueva arriba; sin marcas, los más nuevos. */
export function ordenarChicos<T extends Pick<ChicoKids, "marcas" | "creadaAt">>(chicos: T[]): T[] {
  return [...chicos].sort(
    (a, b) => gravedad(a) - gravedad(b) || ultimaMarca(b).localeCompare(ultimaMarca(a)) || (b.creadaAt ?? "").localeCompare(a.creadaAt ?? ""),
  );
}

/** Las marcas de un chico, la más nueva arriba. */
export function marcasOrdenadas(marcas: MarcaKids[]): MarcaKids[] {
  return [...marcas].sort((a, b) => (GRAVEDAD_MARCA[a.motivo] ?? OTRA_MARCA) - (GRAVEDAD_MARCA[b.motivo] ?? OTRA_MARCA) || b.at.localeCompare(a.at));
}

type FilaAdmin = {
  narrador_id: string;
  canal: "A" | "B";
  avance: AvanceKids | null;
  marcas: MarcaKids[] | null;
  creada_at: string | null;
  empezo_at: string | null;
  termino_at: string | null;
  /** El embed de PostgREST: un objeto (la referencia es a uno), o una lista según cómo lo infiera. */
  narradores: DatosNarrador | DatosNarrador[] | null;
};
type DatosNarrador = { nombre: string | null; como_le_dicen: string | null; estado: string | null; ultima_respuesta_at: string | null };

/** Todos los chicos, ordenados. `tabla: false` si la migración de kids_v2 no está aplicada. */
export async function chicosKids(admin: SupabaseClient): Promise<{ chicos: ChicoKids[]; tabla: boolean; error: string | null }> {
  const { data, error } = await admin
    .from("kids_v2")
    .select("narrador_id, canal, avance, marcas, creada_at, empezo_at, termino_at, narradores(nombre, como_le_dicen, estado, ultima_respuesta_at)")
    .order("creada_at", { ascending: false });
  if (error) {
    if (esTablaAusente(error)) return { chicos: [], tabla: false, error: null };
    console.warn("admin kids: no se pudo leer kids_v2", error.message);
    return { chicos: [], tabla: true, error: error.message ?? "kids_v2" };
  }
  const chicos = ((data as unknown as FilaAdmin[] | null) ?? []).map((f): ChicoKids => {
    const nar = Array.isArray(f.narradores) ? (f.narradores[0] ?? null) : f.narradores;
    return {
      narradorId: f.narrador_id,
      nombre: nar?.nombre ?? null,
      comoLeDicen: nar?.como_le_dicen ?? null,
      estado: nar?.estado ?? null,
      canal: f.canal,
      avance: f.avance ?? {},
      marcas: Array.isArray(f.marcas) ? f.marcas : [],
      creadaAt: f.creada_at,
      empezoAt: f.empezo_at,
      terminoAt: f.termino_at,
      ultimaRespuestaAt: nar?.ultima_respuesta_at ?? null,
    };
  });
  return { chicos: ordenarChicos(chicos), tabla: true, error: null };
}
