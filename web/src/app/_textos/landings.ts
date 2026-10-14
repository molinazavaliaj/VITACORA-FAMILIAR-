import type { IdiomaWeb, Textos } from "@/lib/idioma-web";

// Lo común de las landings de anuncio (rediseño 2026-10, fase 4; maquetas
// LandingRegalo, LandingPreguntas, LandingVoz y LandingViaje*). Cada landing
// tiene su archivo (landing-regalo.ts, landing-preguntas.ts, landing-voz.ts,
// landing-viaje.ts); acá va lo que comparten y las rutas.
//
// Reglas (DECISIONES D1 y D4, PASO-DE-MANOS §4.1): una idea por pantalla, sin
// cabecera completa (logo + «Comprar»), sin popup ni rasca, la garantía solo en
// la mini FAQ, sin «9 días», sin reseñas, sin cifras escritas a mano. Lo que
// ya está aprobado (pasos, preguntas frecuentes, el limonero, el marco) se
// toma de _textos/portada.ts para no tener dos copias del mismo texto.
//
// Todo lo nuevo está en docs/rediseno-2026-10/fase-4/textos.md.
// ca: PENDIENTE REVISIÓN NATIVA

/** Lo que cada landing tiene sí o sí. */
export type TextosLandingBase = {
  meta: { titulo: string; descripcion: string };
  etiqueta: string;
  /** El titular recomendado (las otras dos opciones están en fase-4/textos.md). */
  titulo: string;
  bajada: string;
  /** El botón de compra de la landing (el mismo en el hero y en el cierre). */
  cta: string;
  faqTitulo: string;
  cierre: string;
};

export type TextosLandingComun = {
  /** El botón chico de la cabecera mínima. */
  comprar: string;
  inicio: string;
  libroTitulo: string;
};

export const TEXTOS_LANDING_COMUN: Textos<TextosLandingComun> = {
  es: { comprar: "Comprar", inicio: "Vitácora, inicio", libroTitulo: "Así queda su libro." },
  ar: { comprar: "Comprar", inicio: "Vitácora, inicio", libroTitulo: "Así queda su libro." },
  // ca: PENDIENTE REVISIÓN NATIVA
  ca: { comprar: "Comprar", inicio: "Vitácora, inici", libroTitulo: "Així queda el seu llibre." },
};

/**
 * Las rutas de cada landing, sin prefijo de idioma. En Argentina, «papá»: la
 * de regalo va en /ar/regalo-para-tu-papa (decisión de la fase 4, anotada en
 * fase-4/textos.md). El catalán usa la misma ruta que el castellano, como
 * /ca/comprar.
 */
export const RUTAS_LANDING = {
  regalo: { es: "/regalo-para-tu-padre", ca: "/regalo-para-tu-padre", ar: "/regalo-para-tu-papa" },
  preguntas: { es: "/lo-que-nunca-le-preguntaste", ca: "/lo-que-nunca-le-preguntaste", ar: "/lo-que-nunca-le-preguntaste" },
  voz: { es: "/su-voz", ca: "/su-voz", ar: "/su-voz" },
  viaje: { es: "/el-libro-del-viaje", ca: "/el-libro-del-viaje", ar: "/el-libro-del-viaje" },
} as const satisfies Record<string, Record<IdiomaWeb, string>>;

export type Landing = keyof typeof RUTAS_LANDING;
