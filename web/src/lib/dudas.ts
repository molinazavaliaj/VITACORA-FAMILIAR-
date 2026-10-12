// Las dudas del escritor V3 (CONTRATO, "Escritor V3 en la fábrica"). La Etapa A
// deja en `{narrador}/escritor/dudas-familia.json` lo que no pudo resolver de los
// audios —un nombre que se oye de dos formas, un año que no cierra— y la familia
// lo contesta acá. Lo que se guarda va a `{narrador}/escritor/correcciones.json`,
// que la Etapa B lee antes de escribir el libro.
//
// El plazo manda: la fábrica espera ESCRITOR_ESPERA_DUDAS_HORAS desde el mail de
// dudas y después escribe igual, con o sin correcciones. Esto es lo puro: qué se
// puede guardar y cuánto tiempo queda. Sin red.

/** Lo que la fábrica escribe en `dudas-familia.json`. Solo `id` y `pregunta` se muestran siempre. */
export type DudaFamilia = {
  id: string;
  pregunta: string;
  tipo?: string;
  /** Qué quedó sin resolver, en palabras del escritor. */
  que?: string;
  /** Las respuestas del narrador de donde salió la duda. */
  ids?: string[];
  citas?: { id: string; texto: string }[];
  /** Si vienen, se ofrecen como botones; el campo libre queda igual. */
  opciones?: string[];
};

/** Una respuesta de la familia. `quien` y `cuando` son nuestros: la fábrica lee solo `dudaId` y `texto`. */
export type CorreccionFamilia = {
  dudaId: string;
  texto: string;
  quien?: string;
  cuando?: string;
};

/** Lo que espera la fábrica (ESCRITOR_ESPERA_DUDAS_HORAS, 24 por defecto). */
export const HORAS_PLAZO_DUDAS = 24;

/** Una respuesta de persona: se corta, no se rechaza. Perder lo que escribió es peor que guardarlo largo. */
const LARGO_MAXIMO = 2000;

export type EstadoPlazo = {
  /** `abierto`: se puede contestar. `vencido`: pasó el plazo pero el libro no salió. `libro_escrito`: ya no sirve. */
  estado: "abierto" | "vencido" | "libro_escrito";
  /** Cuándo deja de servir contestar. Null si no sabemos desde cuándo corre. */
  venceAt: Date | null;
};

/**
 * Hasta cuándo sirve contestar. `avisadasAt` es el contenido de `dudas-avisadas.txt`
 * (cuándo salió el mail): sin esa fecha no se inventa un plazo, porque mostrar una
 * cuenta regresiva equivocada es peor que no mostrar ninguna.
 *
 * Que el plazo haya vencido no cierra la pantalla: mientras el libro no esté escrito,
 * lo que la familia conteste todavía puede entrar (la fábrica reintenta si el mail falló).
 */
export function estadoDelPlazo(
  avisadasAt: string | null,
  libroEscrito: boolean,
  ahora: Date = new Date(),
): EstadoPlazo {
  if (libroEscrito) return { estado: "libro_escrito", venceAt: null };

  const desde = avisadasAt ? Date.parse(avisadasAt.trim()) : NaN;
  if (!Number.isFinite(desde)) return { estado: "abierto", venceAt: null };

  const venceAt = new Date(desde + HORAS_PLAZO_DUDAS * 3600_000);
  return { estado: ahora >= venceAt ? "vencido" : "abierto", venceAt };
}

/**
 * Valida lo que manda el formulario contra las dudas que existen de verdad.
 *
 * Un `dudaId` inventado se rechaza entero: el archivo lo lee la fábrica para
 * corregir el libro, y una corrección que no apunta a ninguna duda no se sabe
 * dónde aplicar. Las vacías se descartan en silencio (es un campo sin tocar).
 * Si la misma duda viene dos veces, gana la última: son dos personas de la
 * familia contestando y la pantalla muestra siempre la más reciente.
 */
export function validarCorreccionesFamilia(
  valor: unknown,
  dudas: DudaFamilia[],
): { ok: true; correcciones: CorreccionFamilia[] } | { ok: false; mensaje: string } {
  if (!Array.isArray(valor)) {
    return { ok: false, mensaje: "Las respuestas tienen que ser una lista." };
  }
  if (valor.length > dudas.length * 2 + 10) {
    return { ok: false, mensaje: "Llegaron más respuestas de las que hay dudas." };
  }

  const idsValidos = new Set(dudas.map((d) => d.id));
  const porDuda = new Map<string, CorreccionFamilia>();

  for (const item of valor) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, mensaje: "Cada respuesta tiene que decir a qué duda contesta." };
    }
    const { dudaId, texto, quien } = item as { dudaId?: unknown; texto?: unknown; quien?: unknown };
    if (typeof dudaId !== "string" || typeof texto !== "string") {
      return { ok: false, mensaje: "Cada respuesta tiene que decir a qué duda contesta." };
    }
    if (!idsValidos.has(dudaId)) {
      return { ok: false, mensaje: "Una de las respuestas no corresponde a ninguna duda." };
    }
    const limpio = texto.trim().slice(0, LARGO_MAXIMO);
    if (limpio === "") continue; // campo sin tocar

    porDuda.set(dudaId, {
      dudaId,
      texto: limpio,
      ...(typeof quien === "string" && quien.trim() !== "" ? { quien: quien.trim().slice(0, 120) } : {}),
      cuando: new Date().toISOString(),
    });
  }

  return { ok: true, correcciones: [...porDuda.values()] };
}

/** Lo guardado, por duda, para precargar el formulario y mostrar quién contestó. */
export function correccionesPorDuda(correcciones: CorreccionFamilia[]): Map<string, CorreccionFamilia> {
  const mapa = new Map<string, CorreccionFamilia>();
  for (const c of correcciones ?? []) {
    if (c && typeof c.dudaId === "string") mapa.set(c.dudaId, c);
  }
  return mapa;
}
