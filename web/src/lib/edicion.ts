// La edición final del libro (docs/panel-usuario.md §7.2): lo que la dueña
// decide antes de cerrar. Vive en narradores.edicion (jsonb, CONTRATO.md) y
// la fábrica lo lee al producir. Acá, la forma y la validación.

export type Edicion = {
  titulo?: string;
  subtitulo?: string;
  portadaFotoId?: string | null;
  contratapaFotoId?: string | null; // 13/09: las tres se eligen en Encargar libro
  marcoFotoId?: string | null;      // = marcosFotoIds[0]; se mantiene para la fábrica
  /** Un marco por primo, cada uno con su foto (13/09). null = todavía sin elegir. */
  marcosFotoIds?: (string | null)[];
  ordenCapitulos?: string[];
  /** Capítulo del guion → título en el libro (13/09). Sin entrada = el del guion. */
  titulosCapitulos?: Record<string, string>;
  excluidas?: string[]; // respuestas.id
  correcciones?: string;
};

export const TITULO_MAXIMO = 80;
export const SUBTITULO_MAXIMO = 80;
export const CORRECCIONES_MAXIMO = 4000;
export const TITULO_CAPITULO_MAXIMO = 60;

/** La propuesta de la casa: lo que se produce si ella no toca nada. */
export const MARCOS_MAXIMO = 20;

export type EdicionCompleta = Required<Omit<Edicion, "portadaFotoId" | "contratapaFotoId" | "marcoFotoId" | "titulosCapitulos" | "marcosFotoIds">> & {
  titulosCapitulos: Record<string, string>;
  marcosFotoIds: (string | null)[];
  portadaFotoId: string | null;
  contratapaFotoId: string | null;
  marcoFotoId: string | null;
};

export function propuestaPorDefecto(nombre: string, nombreCompleto: string, capitulos: string[]): EdicionCompleta {
  return {
    titulo: `${nombre} — La historia de una vida`,
    subtitulo: nombreCompleto,
    portadaFotoId: null,
    contratapaFotoId: null,
    marcoFotoId: null,
    marcosFotoIds: [],
    ordenCapitulos: capitulos,
    titulosCapitulos: {},
    excluidas: [],
    correcciones: "",
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valida lo que llega y devuelve solo los campos presentes, limpios.
 * `capitulosValidos` y `respuestasValidas` son los del narrador: nada de afuera entra.
 */
export function validarEdicion(
  entrada: unknown,
  contexto: { capitulosValidos: string[]; respuestasValidas: Set<string> },
): { ok: true; cambios: Edicion } | { ok: false; mensaje: string } {
  if (!entrada || typeof entrada !== "object") return { ok: false, mensaje: "No llegó nada para guardar." };
  const e = entrada as Record<string, unknown>;
  const cambios: Edicion = {};

  if ("titulo" in e) {
    if (typeof e.titulo !== "string") return { ok: false, mensaje: "El título tiene que ser un texto." };
    const t = e.titulo.trim().replace(/\s+/g, " ");
    if (!t) return { ok: false, mensaje: "El libro necesita un título." };
    if (t.length > TITULO_MAXIMO) return { ok: false, mensaje: `El título es muy largo (máximo ${TITULO_MAXIMO} letras).` };
    cambios.titulo = t;
  }
  if ("subtitulo" in e) {
    if (typeof e.subtitulo !== "string") return { ok: false, mensaje: "El subtítulo tiene que ser un texto." };
    const s = e.subtitulo.trim().replace(/\s+/g, " ");
    if (s.length > SUBTITULO_MAXIMO) return { ok: false, mensaje: `El subtítulo es muy largo (máximo ${SUBTITULO_MAXIMO} letras).` };
    cambios.subtitulo = s;
  }
  // Las tres fotos del libro: tapa, contratapa y la del marco. Un uuid o null.
  const FOTOS = [
    ["portadaFotoId", "La foto de portada no es válida."],
    ["contratapaFotoId", "La foto de contratapa no es válida."],
    ["marcoFotoId", "La foto del marco no es válida."],
  ] as const;
  for (const [campo, mensaje] of FOTOS) {
    if (!(campo in e)) continue;
    const v = e[campo];
    if (v !== null && (typeof v !== "string" || !UUID_RE.test(v))) return { ok: false, mensaje };
    cambios[campo] = v as string | null;
  }
  if ("marcosFotoIds" in e) {
    const lista = e.marcosFotoIds;
    if (!Array.isArray(lista) || lista.length > MARCOS_MAXIMO || !lista.every((v) => v === null || (typeof v === "string" && UUID_RE.test(v)))) {
      return { ok: false, mensaje: "Las fotos de los marcos no son válidas." };
    }
    cambios.marcosFotoIds = lista as (string | null)[];
    cambios.marcoFotoId = (lista[0] as string | null | undefined) ?? null;
  }
  if ("titulosCapitulos" in e) {
    const t = e.titulosCapitulos;
    if (!t || typeof t !== "object" || Array.isArray(t)) return { ok: false, mensaje: "Los títulos de capítulos no son válidos." };
    const validos = new Set(contexto.capitulosValidos);
    const limpio: Record<string, string> = {};
    for (const [cap, valor] of Object.entries(t as Record<string, unknown>)) {
      if (!validos.has(cap)) return { ok: false, mensaje: `El capítulo "${cap}" no existe en este libro.` };
      if (typeof valor !== "string") return { ok: false, mensaje: "El título tiene que ser un texto." };
      const v = valor.trim().replace(/\s+/g, " ");
      if (v.length > TITULO_CAPITULO_MAXIMO) return { ok: false, mensaje: `El título de "${cap}" es muy largo (máximo ${TITULO_CAPITULO_MAXIMO} letras).` };
      if (v) limpio[cap] = v; // vacío = vuelve al del guion
    }
    cambios.titulosCapitulos = limpio;
  }
  if ("ordenCapitulos" in e) {
    const lista = e.ordenCapitulos;
    if (!Array.isArray(lista) || !lista.every((c) => typeof c === "string")) return { ok: false, mensaje: "El orden de capítulos no es válido." };
    const esperados = new Set(contexto.capitulosValidos);
    const recibidos = new Set(lista as string[]);
    if (recibidos.size !== lista.length || recibidos.size !== esperados.size || ![...esperados].every((c) => recibidos.has(c))) {
      return { ok: false, mensaje: "El orden tiene que incluir todos los capítulos, una vez cada uno." };
    }
    cambios.ordenCapitulos = lista as string[];
  }
  if ("excluidas" in e) {
    const lista = e.excluidas;
    if (!Array.isArray(lista) || !lista.every((id) => typeof id === "string")) return { ok: false, mensaje: "La lista de respuestas a excluir no es válida." };
    const ajenas = (lista as string[]).filter((id) => !contexto.respuestasValidas.has(id));
    if (ajenas.length > 0) return { ok: false, mensaje: "Hay respuestas que no son de esta historia." };
    cambios.excluidas = [...new Set(lista as string[])];
  }
  if ("correcciones" in e) {
    if (typeof e.correcciones !== "string") return { ok: false, mensaje: "Las correcciones tienen que ser un texto." };
    cambios.correcciones = e.correcciones.trim().slice(0, CORRECCIONES_MAXIMO);
  }

  return { ok: true, cambios };
}
