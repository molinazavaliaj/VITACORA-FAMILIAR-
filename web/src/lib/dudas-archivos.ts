import type { SupabaseClient } from "@supabase/supabase-js";
import { ARCHIVO_DESTINO_DUDAS, dudasParaQuienRegala, hayDudasSinContestar, leerCorreccionesGuardadas, leerDudas, type DudaFamilia } from "./dudas";
import { loContadoEsPrivado } from "./panel";

// Los archivos del escritor en Storage (`{narrador}/escritor/...`, o `escritor-historia/` en una historia), para la
// pantalla de dudas, su API y el aviso del Inicio. Lo escriben la fábrica, los
// socios a mano y la web: cada lectura pide una URL distinta y sin caché (como
// lib/frases.ts), porque una lectura vieja antes de escribir pisaría lo de otro.

/**
 * ¿Este error de Storage dice "el objeto no está"? Copia de
 * `esErrorDeNoEncontrado` de la fábrica (fabrica/src/libro/comun.ts): según la
 * versión, Storage responde 404, o 400 con `error: 'not_found'`, y un mensaje
 * "Object not found". Cualquier otra cosa (red, 500, permisos) NO es "no está".
 */
export function esNoEncontrado(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { message?: unknown; statusCode?: unknown; status?: unknown; error?: unknown };
  if (typeof e.message === "string" && /not found/i.test(e.message)) return true;
  if (e.statusCode === 404 || e.statusCode === "404" || e.status === 404) return true;
  if (e.error === "not_found") return true;
  return false;
}

/**
 * La carpeta del escritor de ese narrador: `{id}/escritor` (Familiar V3) o, si cuenta una historia (fila en
 * `historias`), `{id}/escritor-historia` (fabrica/src/escritor-historia/produccion). Sin la tabla, la de siempre.
 * Un error de la base vuelve como error: leer la carpeta equivocada diría "no hay dudas".
 */
export async function carpetaDelEscritor(admin: SupabaseClient, narradorId: string): Promise<{ carpeta: string; error: string | null }> {
  const { data, error } = await admin.from("historias").select("narrador_id").eq("narrador_id", narradorId).maybeSingle();
  if (error && error.code !== "42P01" && error.code !== "PGRST205") return { carpeta: `${narradorId}/escritor`, error: error.message };
  return { carpeta: `${narradorId}/${data ? "escritor-historia" : "escritor"}`, error: null };
}

/**
 * Un archivo del escritor como texto. `texto: null` sin error es que no existe
 * (la fábrica los crea a su ritmo). Cualquier otra falla vuelve como error: no
 * es lo mismo "no hay dudas" que "no pudimos leerlas".
 */
export async function leerDelEscritor(
  admin: SupabaseClient,
  narradorId: string,
  archivo: string,
): Promise<{ texto: string | null; error: string | null }> {
  const c = await carpetaDelEscritor(admin, narradorId);
  if (c.error) return { texto: null, error: c.error };
  const { data, error } = await admin.storage
    .from("audios")
    .download(
      `${c.carpeta}/${archivo}`,
      { cacheNonce: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      { cache: "no-store" },
    );
  if (data) return { texto: await data.text(), error: null };
  if (!error || esNoEncontrado(error)) return { texto: null, error: null };
  return { texto: null, error: (error as { message?: string }).message ?? String(error) };
}

/**
 * Lo que hay en la carpeta del escritor, por nombre (un listado, sin descargar).
 * Sirve para saber si `libro.md` ya está sin bajarse el libro entero.
 */
export async function archivosDelEscritor(
  admin: SupabaseClient,
  narradorId: string,
): Promise<{ nombres: Set<string>; error: string | null }> {
  const c = await carpetaDelEscritor(admin, narradorId);
  if (c.error) return { nombres: new Set(), error: c.error };
  const { data, error } = await admin.storage.from("audios").list(c.carpeta);
  if (error) return { nombres: new Set(), error: error.message };
  return { nombres: new Set((data ?? []).map((a) => a.name)), error: null };
}

/** Las dudas tal como las puede ver esta historia: todas o, si lo contado es privado, las que no revelan nada. */
export async function dudasQueVe(admin: SupabaseClient, narrador: { id: string; contexto?: Record<string, unknown> | null }, dudas: DudaFamilia[]): Promise<DudaFamilia[]> {
  if (!loContadoEsPrivado(narrador)) return dudas;
  const destino = await leerDelEscritor(admin, narrador.id, ARCHIVO_DESTINO_DUDAS);
  return dudasParaQuienRegala(dudas, destino.texto);
}

/**
 * ¿Quedan dudas del escritor por contestar? Hay dudas, el libro todavía no se
 * escribió y alguna sigue sin respuesta (no alcanza con que alguien haya
 * contestado una). El listado decide si hace falta bajar los dos archivos.
 *
 * Si el listado o `dudas-familia.json` fallan o vienen rotos, no hay a dónde
 * mandar a nadie: false. Si lo que falla es leer las correcciones, queda en
 * true (mejor de más que perder el plazo). Lo usan el aviso del Inicio y el
 * botón Compartir (invitar a quien sabe las respuestas, 13/10).
 */
export async function hayDudasPendientes(admin: SupabaseClient, narrador: { id: string; contexto?: Record<string, unknown> | null }): Promise<boolean> {
  const narradorId = narrador.id;
  const { nombres, error } = await archivosDelEscritor(admin, narradorId);
  if (error || !nombres.has("dudas-familia.json") || nombres.has("libro.md")) return false;
  const [archivoDudas, archivoCorrecciones] = await Promise.all([
    leerDelEscritor(admin, narradorId, "dudas-familia.json"),
    leerDelEscritor(admin, narradorId, "correcciones.json"),
  ]);
  const todas = archivoDudas.texto !== null ? leerDudas(archivoDudas.texto) : null;
  if (!todas) return false;
  const dudas = await dudasQueVe(admin, narrador, todas);
  const correcciones = archivoCorrecciones.texto !== null ? leerCorreccionesGuardadas(archivoCorrecciones.texto) ?? [] : [];
  return hayDudasSinContestar(dudas, correcciones);
}
