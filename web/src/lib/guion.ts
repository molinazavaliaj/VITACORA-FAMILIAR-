// El guion de un narrador: las reglas puras (docs/panel-usuario.md §6).
// Sin red ni base, para probarlas solas. Quien las aplica es /api/guion.

export const PISO = 15;       // con menos no hay libro
export const TOPE = 40;       // contando las 4 adaptativas
export const ADAPTATIVAS = 4; // siempre existen, las escribe el cerebro al final
export const MAXIMO_FAMILIA = TOPE - ADAPTATIVAS; // 36: lo más que puede armar la familia

/**
 * «Sus objetos preciados» (3t.30): los pedidos de objeto viven en la banda
 * 101-108, ARRIBA de este número y fuera de la secuencia de días. No cuentan
 * como preguntas del guion, no se arrastran con las otras y no aparecen en el
 * libro como capítulos aparte: su foto cierra el capítulo al que pertenecen.
 *
 * Se reconocen por el orden y no por el tipo a propósito: `totalDelGuion`
 * recibe filas que solo traen `orden`, y así no hace falta cambiar su firma.
 */
export const ORDEN_OBJETOS = 100;

/** ¿Esta fila es un pedido de objeto y no una pregunta del recorrido? */
export function esPreguntaDeObjeto(p: { orden: number }): boolean {
  return p.orden > ORDEN_OBJETOS;
}

export const TEXTO_MINIMO = 10;
export const TEXTO_MAXIMO = 300;

export const RITMOS = ["diario", "dos_por_dia", "seguido"] as const;
export type Ritmo = (typeof RITMOS)[number];
export const RITMO_DEFAULT: Ritmo = "diario";
/** Cómo se explica cada ritmo, en el panel (Ajustes) y en el paso 5 de la compra (17/09): un solo texto. */
export const NOMBRE_RITMO: Record<Ritmo, { titulo: string; detalle: string }> = {
  diario: { titulo: "Una por día", detalle: "A su hora, todos los días. Es el ritmo que más gente termina." },
  dos_por_dia: { titulo: "Dos por día", detalle: "Una a la mañana y otra a la tarde. Para quien tiene ganas de contar." },
  seguido: { titulo: "Apenas responde", detalle: "En cuanto termina una, le llega la siguiente. Puede terminar en pocos días." },
};
/** `contexto.evitar`: los temas que el biógrafo no toca. Mismo tope en la compra y en el panel. */
export const EVITAR_MAXIMO = 1000;

export type PreguntaGuion = {
  id: string;
  orden: number;
  texto: string;
  capitulo: string;
  tipo: "fija" | "adaptativa" | "familia" | "sugerida" | "objeto";
  foto_id?: string | null;
};

/**
 * Cuántas preguntas tiene el guion de un narrador: sus filas propias más las
 * de la plantilla global (`narrador_id` null) que no pisan un orden propio.
 * Un narrador de la puerta manual puede tener SOLO sus 4 adaptativas como
 * filas propias y las 26 fijas en la plantilla — contar únicamente las
 * propias daba "30 de 4" en Inicio (Naza, 17/09). Historias e Inicio usan esto.
 */
export function totalDelGuion(propias: { orden: number }[], globales: { orden: number }[], base = 30): number {
  const ordenes = new Set<number>();
  for (const p of globales) if (!esPreguntaDeObjeto(p)) ordenes.add(p.orden);
  for (const p of propias) if (!esPreguntaDeObjeto(p)) ordenes.add(p.orden);
  return ordenes.size > 0 ? ordenes.size : base;
}

/**
 * El guion entero de un narrador: la plantilla global (`narrador_id` null) más
 * sus filas propias, que pisan a la global del mismo orden. Ordenado por orden.
 * Es la misma unión que cuenta `totalDelGuion`. Un narrador de la puerta manual
 * tiene como propias SOLO las 4 adaptativas (orden 27-30); leer únicamente esas
 * daba un libro de 4 capítulos que empezaba por "Las pruebas" (Joaquín, 18/09).
 * Lo usan el panel, el wizard de cerrar libro y la muestra pública.
 */
export function armarGuion<T extends { orden: number }>(globales: T[] | null | undefined, propias: T[] | null | undefined): T[] {
  return unirPorOrden(globales, propias).filter((p) => !esPreguntaDeObjeto(p));
}

/**
 * Los pedidos de objeto, en el mismo armado. Van aparte del guion: el panel los
 * muestra en su propia sección, no numerados entre las preguntas del día.
 */
export function objetosDelGuion<T extends { orden: number }>(globales: T[] | null | undefined, propias: T[] | null | undefined): T[] {
  return unirPorOrden(globales, propias).filter(esPreguntaDeObjeto);
}

function unirPorOrden<T extends { orden: number }>(globales: T[] | null | undefined, propias: T[] | null | undefined): T[] {
  const porOrden = new Map<number, T>();
  for (const p of globales ?? []) porOrden.set(p.orden, p);
  for (const p of propias ?? []) porOrden.set(p.orden, p);
  return [...porOrden.values()].sort((a, b) => a.orden - b.orden);
}

/** Los capítulos, únicos y en el orden en que aparecen en el guion (el del biógrafo). */
export function capitulosDelGuion(guion: { capitulo: string }[]): string[] {
  return [...new Set(guion.map((p) => p.capitulo))];
}

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
export const MINIMO_LIBRO = { ancho: 1200, alto: 1800 }; // página entera, tapa, portada de capítulo
export const MINIMO_MARCO = { ancho: 2400, alto: 3000 };
/**
 * A tamaño chico dentro de una página (una foto entre el texto, ~9×12 cm a
 * 250 dpi) alcanza con mucho menos. Antes todo lo que no llegaba a página
 * entera salía en rojo como "pixelada" — una tapa de disco de 1500×1500 o
 * una foto de 1920×1080 daban miedo sin motivo (Naza, 17/09).
 */
export const MINIMO_CHICA = { ancho: 800, alto: 1000 };
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

/** marco ⊃ libro (página entera) ⊃ chica (dentro de una página) ⊃ baja (pixelada en cualquier tamaño). */
export type CalidadFoto = "marco" | "libro" | "chica" | "baja";

/** Qué alcanza a imprimir con esta resolución. Se mide el lado largo contra el corto. */
export function calidadDeFoto(ancho: number, alto: number): CalidadFoto {
  const largo = Math.max(ancho, alto);
  const corto = Math.min(ancho, alto);
  if (largo >= MINIMO_MARCO.alto && corto >= MINIMO_MARCO.ancho) return "marco";
  if (largo >= MINIMO_LIBRO.alto && corto >= MINIMO_LIBRO.ancho) return "libro";
  if (largo >= MINIMO_CHICA.alto && corto >= MINIMO_CHICA.ancho) return "chica";
  return "baja";
}

/** Solo `baja` es una alerta; el resto informa. */
export const AVISO_CALIDAD: Record<CalidadFoto, string> = {
  marco: "Sirve para el libro y para un marco.",
  libro: "Sirve para el libro, incluso a página entera o en la tapa. Para un marco de 20×25 haría falta más resolución.",
  chica: "Sirve para el libro a tamaño chico, entre el texto. A página entera, en la tapa o en un marco se vería pixelada.",
  baja: "Se va a ver pixelada impresa. Si es una foto de papel, sacale otra foto apoyada en una mesa, con luz de día, sin flash.",
};

/**
 * Reordenar arrastrando (3t.24): el orden nuevo de ids cuando `movido` se suelta
 * sobre `destino`. Hacia abajo queda después del destino; hacia arriba, antes.
 * Es lo mismo que la acción `reordenar` recibe; las flechas siguen existiendo.
 */
export function idsTrasArrastrar(ids: string[], movido: string, destino: string): string[] {
  const i = ids.indexOf(movido);
  const j = ids.indexOf(destino);
  if (i < 0 || j < 0 || i === j) return ids;
  const sin = ids.filter((id) => id !== movido);
  const k = sin.indexOf(destino);
  sin.splice(i < j ? k + 1 : k, 0, movido);
  return sin;
}
