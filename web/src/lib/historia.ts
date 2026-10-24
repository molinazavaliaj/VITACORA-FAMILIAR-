import type { IdiomaWeb } from "./idioma-web";
import type { Region } from "./precios";

// Vitácora de una historia en la web (spec 2026-10-21, plan Task 4.1). Lo que la web sabe del producto, sin red.
//
// Es una compra de Familiar con un tema: el narrador queda con `contexto.modo = "historia"` y `contexto.historia`
// (CONTRATO, «Vitácora de una historia»), y la fila de `historias` la crea el bot (entrevistador/src/historia/alta.ts).
// Las claves de los temas son las de docs/historia/temas.md; los nombres que ve la persona van en _textos, no acá. El
// precio es el de Familiar (obtenerPrecio): no hay variable propia. Nada se vende sin HISTORIA_VENTA=1.

export const HISTORIA_TEMAS = ["mudanza", "negocio", "enfermedad", "conocimos", "padres", "trabajo", "otra"] as const;
export type TemaHistoria = (typeof HISTORIA_TEMAS)[number];

/** Hasta 3 preguntas de quien regala (entrevistador: MAX_PROPIAS), de hasta 300 caracteres. */
export const MAX_PROPIAS_HISTORIA = 3;
export const PROPIA_MAXIMO = 300;
/** «Otra historia», con sus palabras: una línea. */
export const TEMA_LIBRE_MAXIMO = 120;

/** Lo que va en `narrador.contexto.historia`. Con el tema abierto, `tema` es "otra" y lo elige quien la cuenta. */
export type CompraHistoria = { tema: TemaHistoria; temaLibre?: string; temaAbierto?: boolean; preguntasPropias: string[] };

/** ¿Se vende historia en esa región? Solo con HISTORIA_VENTA=1, en las dos. */
export function historiaVende(_region: Region, env: NodeJS.ProcessEnv = process.env): boolean {
  return env.HISTORIA_VENTA === "1";
}

/** Como `historiaVende`, con la región de la web (/ca es España). */
export function historiaVendeEn(idioma: IdiomaWeb, env: NodeJS.ProcessEnv = process.env): boolean {
  return historiaVende(idioma === "ar" ? "AR" : "ES", env);
}

export const esTemaHistoria = (x: unknown): x is TemaHistoria =>
  typeof x === "string" && (HISTORIA_TEMAS as readonly string[]).includes(x);

/**
 * La compra de historia que llega en el cuerpo, validada. Los mensajes son para el log y la respuesta 400 (el
 * formulario ya no deja mandar nada de esto): no los ve la persona.
 */
export function validarHistoria(
  entrada: unknown,
  o: { regalo: boolean },
): { ok: true; historia: CompraHistoria } | { ok: false; mensaje: string } {
  const e = (entrada ?? {}) as Record<string, unknown>;
  const propias = Array.isArray(e.preguntasPropias)
    ? e.preguntasPropias.filter((p): p is string => typeof p === "string").map((p) => p.trim()).filter(Boolean)
    : [];
  if (propias.length > 0 && !o.regalo) return { ok: false, mensaje: "historia: preguntas propias solo en regalo" };
  if (propias.length > MAX_PROPIAS_HISTORIA) return { ok: false, mensaje: "historia: más de 3 preguntas propias" };
  if (propias.some((p) => p.length > PROPIA_MAXIMO)) return { ok: false, mensaje: "historia: pregunta propia muy larga" };
  if (e.temaAbierto === true) {
    if (!o.regalo) return { ok: false, mensaje: "historia: tema abierto solo en regalo" };
    return { ok: true, historia: { tema: "otra", temaAbierto: true, preguntasPropias: propias } };
  }
  if (!esTemaHistoria(e.tema)) return { ok: false, mensaje: "historia: tema desconocido" };
  if (e.tema === "otra") {
    const libre = typeof e.temaLibre === "string" ? e.temaLibre.trim() : "";
    if (!libre) return { ok: false, mensaje: "historia: falta la historia" };
    if (libre.length > TEMA_LIBRE_MAXIMO) return { ok: false, mensaje: "historia: la historia es muy larga" };
    return { ok: true, historia: { tema: "otra", temaLibre: libre, preguntasPropias: propias } };
  }
  return { ok: true, historia: { tema: e.tema, preguntasPropias: propias } };
}
