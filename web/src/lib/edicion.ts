// La edición final del libro (docs/panel-usuario.md §7.2): lo que la dueña
// decide antes de cerrar. Vive en narradores.edicion (jsonb, CONTRATO.md) y
// la fábrica lo lee al producir. Acá, la forma y la validación.

export type Edicion = {
  titulo?: string;
  subtitulo?: string;
  portadaFotoId?: string | null;
  ordenCapitulos?: string[];
  excluidas?: string[]; // respuestas.id
  correcciones?: string;
};

export const TITULO_MAXIMO = 80;
export const SUBTITULO_MAXIMO = 80;
export const CORRECCIONES_MAXIMO = 4000;

/** La propuesta de la casa: lo que se produce si ella no toca nada. */
export function propuestaPorDefecto(nombre: string, nombreCompleto: string, capitulos: string[]): Required<Omit<Edicion, "portadaFotoId">> & { portadaFotoId: string | null } {
  return {
    titulo: `${nombre} — La historia de una vida`,
    subtitulo: nombreCompleto,
    portadaFotoId: null,
    ordenCapitulos: capitulos,
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
  if ("portadaFotoId" in e) {
    if (e.portadaFotoId !== null && (typeof e.portadaFotoId !== "string" || !UUID_RE.test(e.portadaFotoId))) {
      return { ok: false, mensaje: "La foto de portada no es válida." };
    }
    cambios.portadaFotoId = e.portadaFotoId as string | null;
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
