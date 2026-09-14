// El guion de un narrador: las reglas puras (docs/panel-usuario.md §6).
// Sin red ni base, para probarlas solas. Quien las aplica es /api/guion.

export const PISO = 15;       // con menos no hay libro
export const TOPE = 40;       // contando las 4 adaptativas
export const ADAPTATIVAS = 4; // siempre existen, las escribe el cerebro al final
export const MAXIMO_FAMILIA = TOPE - ADAPTATIVAS; // 36: lo más que puede armar la familia

export const TEXTO_MINIMO = 10;
export const TEXTO_MAXIMO = 300;

export const RITMOS = ["diario", "dos_por_dia", "seguido"] as const;
export type Ritmo = (typeof RITMOS)[number];

export type PreguntaGuion = {
  id: string;
  orden: number;
  texto: string;
  capitulo: string;
  tipo: "fija" | "adaptativa" | "familia" | "sugerida";
  foto_id?: string | null;
};

/** Enviada = congelada. Las adaptativas tampoco se tocan: las escribe el cerebro. */
export function esEditable(p: PreguntaGuion, diaActual: number): boolean {
  return p.orden > diaActual && p.tipo !== "adaptativa";
}

export function validarTexto(texto: unknown): { ok: true; texto: string } | { ok: false; mensaje: string } {
  if (typeof texto !== "string") return { ok: false, mensaje: "La pregunta tiene que ser un texto." };
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (limpio.length < TEXTO_MINIMO) return { ok: false, mensaje: "La pregunta es muy corta. Contale un poco más qué querés que cuente." };
  if (limpio.length > TEXTO_MAXIMO) return { ok: false, mensaje: `La pregunta es muy larga (máximo ${TEXTO_MAXIMO} letras). Él la lee en el celular.` };
  return { ok: true, texto: limpio };
}

export function validarRitmo(valor: unknown): valor is Ritmo {
  return typeof valor === "string" && (RITMOS as readonly string[]).includes(valor);
}

/** Las que armó la familia o vinieron del guion: todo menos las adaptativas. */
function delaFamilia(guion: PreguntaGuion[]) {
  return guion.filter((p) => p.tipo !== "adaptativa");
}

export function lugarLibre(guion: PreguntaGuion[]): number {
  return Math.max(0, MAXIMO_FAMILIA - delaFamilia(guion).length);
}

export function puedeAgregar(guion: PreguntaGuion[]): { ok: true } | { ok: false; mensaje: string } {
  if (lugarLibre(guion) === 0) {
    return { ok: false, mensaje: `Ya hay ${MAXIMO_FAMILIA} preguntas; con las 4 finales del biógrafo son ${TOPE}. Para sumar una, sacá otra.` };
  }
  return { ok: true };
}

export function puedeSaltar(guion: PreguntaGuion[]): { ok: true } | { ok: false; mensaje: string } {
  if (delaFamilia(guion).length <= PISO) {
    return { ok: false, mensaje: `Con menos de ${PISO} preguntas no alcanza para un libro.` };
  }
  return { ok: true };
}

/** El orden que sigue al final del guion (para agregar). */
export function siguienteOrden(guion: PreguntaGuion[]): number {
  return guion.reduce((max, p) => Math.max(max, p.orden), 0) + 1;
}

/**
 * Deja las preguntas futuras contiguas después de dia_actual, respetando el
 * orden relativo que tienen. Devuelve solo lo que cambia: [{id, orden}].
 * Se usa después de saltar una. Las enviadas no se tocan nunca.
 */
export function renumerar(guion: PreguntaGuion[], diaActual: number): { id: string; orden: number }[] {
  const futuras = guion.filter((p) => p.orden > diaActual).sort((a, b) => a.orden - b.orden);
  const cambios: { id: string; orden: number }[] = [];
  futuras.forEach((p, i) => {
    const nuevo = diaActual + 1 + i;
    if (nuevo !== p.orden) cambios.push({ id: p.id, orden: nuevo });
  });
  return cambios;
}

/**
 * Reordena las futuras editables según `ids` (todas, en el orden nuevo).
 * Las adaptativas, si ya existen, quedan al final en su orden.
 */
export function reordenar(
  guion: PreguntaGuion[],
  diaActual: number,
  ids: string[],
): { ok: true; cambios: { id: string; orden: number }[] } | { ok: false; mensaje: string } {
  const editables = guion.filter((p) => esEditable(p, diaActual));
  const esperados = new Set(editables.map((p) => p.id));
  if (ids.length !== esperados.size || !ids.every((id) => esperados.has(id))) {
    return { ok: false, mensaje: "El orden no coincide con las preguntas que se pueden mover." };
  }
  const porId = new Map(editables.map((p) => [p.id, p]));
  const adaptativas = guion.filter((p) => p.orden > diaActual && p.tipo === "adaptativa").sort((a, b) => a.orden - b.orden);
  const nuevoOrden = [...ids.map((id) => porId.get(id)!), ...adaptativas];
  const cambios: { id: string; orden: number }[] = [];
  nuevoOrden.forEach((p, i) => {
    const orden = diaActual + 1 + i;
    if (orden !== p.orden) cambios.push({ id: p.id, orden });
  });
  return { ok: true, cambios };
}

// ── Fotos ──────────────────────────────────────────────────────────────

/** Mínimos de resolución para imprimir bien (docs/panel-usuario.md §6.3). */
export const MINIMO_LIBRO = { ancho: 1200, alto: 1800 };
export const MINIMO_MARCO = { ancho: 2400, alto: 3000 };
export const TAMANO_MAXIMO_BYTES = 25 * 1024 * 1024;
export const TIPOS_DE_IMAGEN = ["image/jpeg", "image/png", "image/webp"];

/** El iPhone saca en HEIC por defecto; el navegador que imprime el libro no lo decodifica. */
const TIPOS_HEIC = ["image/heic", "image/heif"];

export const MENSAJE_HEIC =
  "Esa foto está en formato HEIC. Exporta la foto como JPG (en el iPhone: Ajustes → Cámara → Formatos → Más compatible) y vuelve a subirla.";

export const MENSAJE_TIPO_INVALIDO = "Tiene que ser una imagen (JPG, PNG o WebP).";

/** Por qué no se acepta este tipo de archivo como foto; null si se acepta. */
export function errorDeTipoDeFoto(tipo: string): string | null {
  if (TIPOS_DE_IMAGEN.includes(tipo)) return null;
  if (TIPOS_HEIC.includes(tipo)) return MENSAJE_HEIC;
  return MENSAJE_TIPO_INVALIDO;
}

export type CalidadFoto = "marco" | "libro" | "baja";

/** Qué alcanza a imprimir con esta resolución. Se mide el lado largo contra el corto. */
export function calidadDeFoto(ancho: number, alto: number): CalidadFoto {
  const largo = Math.max(ancho, alto);
  const corto = Math.min(ancho, alto);
  if (largo >= MINIMO_MARCO.alto && corto >= MINIMO_MARCO.ancho) return "marco";
  if (largo >= MINIMO_LIBRO.alto && corto >= MINIMO_LIBRO.ancho) return "libro";
  return "baja";
}

export const AVISO_CALIDAD: Record<CalidadFoto, string> = {
  marco: "Sirve para el libro y para un marco.",
  libro: "Sirve para el libro. Para un marco de 20×25 haría falta más resolución.",
  baja: "Se va a ver pixelada impresa. Si es una foto de papel, sacale otra foto apoyada en una mesa, con luz de día, sin flash.",
};
