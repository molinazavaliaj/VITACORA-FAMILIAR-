import type { SupabaseClient } from "@supabase/supabase-js";
import type { FilaAviso, Servicio } from "@/lib/avisos";

// 08 · Notificaciones — los mismos avisos que les llegan por mail a los socios, leídos de
// `avisos` (lib/avisos.ts). Como en datos.ts: si la consulta falla (la migración
// 20261102000000 sin aplicar, por ejemplo) vuelve vacío y se dice por qué, nunca una
// página rota.

/** Cuántos avisos trae la pantalla de una vez: los últimos, del más nuevo al más viejo. */
export const TOPE_AVISOS = 200;

export const SERVICIOS: Servicio[] = ["web", "entrevistador", "fabrica"];

export const NOMBRE_SERVICIO: Record<Servicio, string> = {
  web: "La web",
  entrevistador: "El entrevistador",
  fabrica: "La fábrica",
};

export type Filtro = { de: Servicio | null; soloSinVer: boolean };

/** Lo que viene en la URL (?de=fabrica&ver=sin-ver); lo que no se entiende, se ignora. */
export function filtroDe(params: { de?: string | string[]; ver?: string | string[] }): Filtro {
  const de = typeof params.de === "string" && (SERVICIOS as string[]).includes(params.de) ? (params.de as Servicio) : null;
  return { de, soloSinVer: params.ver === "sin-ver" };
}

export type LecturaAvisos = { avisos: FilaAviso[]; sinVer: number; error: string | null };

export async function leerAvisos(db: SupabaseClient, filtro: Filtro): Promise<LecturaAvisos> {
  let q = db
    .from("avisos")
    .select("id, creado_at, servicio, asunto, detalle, clave, salio_mail, visto_at")
    .order("creado_at", { ascending: false })
    .limit(TOPE_AVISOS);
  if (filtro.de) q = q.eq("servicio", filtro.de);
  if (filtro.soloSinVer) q = q.is("visto_at", null);
  const [{ data, error }, sinVer] = await Promise.all([q, contarSinVer(db)]);
  if (error) {
    console.error("panel: no se pudieron leer los avisos", error.message);
    return { avisos: [], sinVer: 0, error: "Todavía no se pueden leer los avisos: falta aplicar la migración 20261102000000_avisos_y_contenido.sql." };
  }
  return { avisos: (data ?? []) as FilaAviso[], sinVer: sinVer ?? 0, error: null };
}

/** Los que nadie marcó como vistos. null si no se pudo saber (la pestaña no muestra número). */
export async function contarSinVer(db: SupabaseClient): Promise<number | null> {
  try {
    const { count, error } = await db.from("avisos").select("id", { count: "exact", head: true }).is("visto_at", null);
    return error ? null : (count ?? 0);
  } catch {
    return null;
  }
}

/** Los avisos agrupados por día (en la hora de Madrid, que es donde se miran), en el orden en que vienen. */
export function porDia(avisos: FilaAviso[]): { dia: string; avisos: FilaAviso[] }[] {
  const grupos: { dia: string; avisos: FilaAviso[] }[] = [];
  for (const a of avisos) {
    const dia = diaDe(a.creado_at);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === dia) ultimo.avisos.push(a);
    else grupos.push({ dia, avisos: [a] });
  }
  return grupos;
}

const FORMATO_DIA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" });
const FORMATO_HORA = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });

/** "2026-11-02", en la hora de Madrid. */
export function diaDe(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "—" : FORMATO_DIA.format(new Date(t));
}

/** "13:05", en la hora de Madrid. */
export function horaDe(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "—" : FORMATO_HORA.format(new Date(t));
}

/** Qué pasó con el mail, en palabras. */
export function estadoDelMail(salio: boolean | null): { texto: string; color: "verde" | "rojo" | "neutro" } {
  if (salio === true) return { texto: "llegó por mail", color: "verde" };
  if (salio === false) return { texto: "el mail no salió", color: "rojo" };
  return { texto: "sin mail (falta MAIL_SOCIOS)", color: "neutro" };
}
