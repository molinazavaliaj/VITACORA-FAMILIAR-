import type { IdiomaKids } from "@/lib/kids";
import { TEXTOS_PANEL_KIDS } from "./panel-kids";

// «Su voz» de Vitácora Kids: la página que abre cada QR del libro de un chico
// (`/voz/<token>`). Es la misma página de la casa con sus textos de Kids: sin
// «La historia de…» ni «El libro de una vida». En vos para Argentina y en tú
// para España (Naza 16/10, tanda 8) y en catalán (tanda 10), según el idioma del chico. Frases simples,
// sin dos puntos, sin «tu hijo» ni «él» y sin tiempos.

const AR = TEXTOS_PANEL_KIDS["es-AR"].panel;
const ES = TEXTOS_PANEL_KIDS["es-ES"].panel;
const CA = TEXTOS_PANEL_KIDS.ca.panel;

const VOZ_KIDS_AR = {
  // APROBADO por Naza 16/10 (tanda 6) · KP-ETIQUETA (el del panel, tal cual)
  etiqueta: AR.etiqueta,
  // APROBADO por Naza 15/10 (tanda 2) · KP-TITULO (el del panel, tal cual)
  titulo: AR.titulo,
  // APROBADO por Naza 16/10 (tanda 5, libro de Kids) · «Su voz» del libro, tal cual
  suVoz: "Su voz",
  // APROBADO por Naza 16/10 (tanda 5, libro de Kids) · «Escuchala» del QR, tal cual
  escuchala: "Escuchala",

  // APROBADO por Naza 16/10 (tanda 7) · KV-BAJADA (debajo de «Su voz»)
  bajada: "Acá están sus respuestas, tal como las dijo. Tocá una para escucharla.",
  // APROBADO por Naza 16/10 (tanda 7) · KV-SIN-AUDIOS (si todavía no hay ningún audio para escuchar)
  sinAudios: "Sus respuestas en audio todavía se están preparando.",
  // APROBADO por Naza 16/10 (tanda 7) · KV-PESTANA-LIBRO (la pestaña y el título de la sección del libro online)
  libro: "El libro",
  // APROBADO por Naza 16/10 (tanda 7) · KV-LIBRO-NO-ESTA (si el libro online todavía no está)
  libroNoEsta: "El libro todavía se está preparando.",
  // APROBADO por Naza 16/10 (tanda 7) · KV-ETIQUETA-AUDIO (no se ve, lo lee el lector de pantalla después de «Escuchar»)
  etiquetaAudio: (texto: string) => `la respuesta «${texto.slice(0, 40)}»`,
};

export type TextosVozKids = typeof VOZ_KIDS_AR;

const VOZ_KIDS_ES: TextosVozKids = {
  // APROBADO por Naza 16/10 (tanda 8) · KP-ETIQUETA
  etiqueta: ES.etiqueta,
  // APROBADO por Naza 16/10 (tanda 8) · KP-TITULO
  titulo: ES.titulo,
  // APROBADO por Naza 16/10 (tanda 8) · suVoz
  suVoz: "Su voz",
  // APROBADO por Naza 16/10 (tanda 8) · escuchala (en España con tilde)
  escuchala: "Escúchala",
  // APROBADO por Naza 16/10 (tanda 8) · KV-BAJADA
  bajada: "Aquí están sus respuestas, tal como las dijo. Toca una para escucharla.",
  // APROBADO por Naza 16/10 (tanda 8) · KV-SIN-AUDIOS
  sinAudios: "Sus respuestas en audio todavía se están preparando.",
  // APROBADO por Naza 16/10 (tanda 8) · KV-PESTANA-LIBRO
  libro: "El libro",
  // APROBADO por Naza 16/10 (tanda 8) · KV-LIBRO-NO-ESTA
  libroNoEsta: "El libro todavía se está preparando.",
  // APROBADO por Naza 16/10 (tanda 8) · KV-ETIQUETA-AUDIO
  etiquetaAudio: (texto: string) => `la respuesta «${texto.slice(0, 40)}»`,
};

// APROBADO por Naza 16/10 (tanda 10) · «La seva veu» en catalán
const VOZ_KIDS_CA: TextosVozKids = {
  // APROBADO por Naza 16/10 (tanda 10) · KP-ETIQUETA
  etiqueta: CA.etiqueta,
  // APROBADO por Naza 16/10 (tanda 10) · KP-TITULO
  titulo: CA.titulo,
  // APROBADO por Naza 16/10 (tanda 10) · suVoz
  suVoz: "La seva veu",
  // APROBADO por Naza 16/10 (tanda 10) · escuchala
  escuchala: "Escolta-la",
  // APROBADO por Naza 16/10 (tanda 10) · KV-BAJADA
  bajada: "Aquí hi ha les seves respostes, tal com les va dir. Toca'n una per escoltar-la.",
  // APROBADO por Naza 16/10 (tanda 10) · KV-SIN-AUDIOS
  sinAudios: "Les seves respostes en àudio encara s'estan preparant.",
  // APROBADO por Naza 16/10 (tanda 10) · KV-PESTANA-LIBRO
  libro: "El llibre",
  // APROBADO por Naza 16/10 (tanda 10) · KV-LIBRO-NO-ESTA
  libroNoEsta: "El llibre encara s'està preparant.",
  // APROBADO por Naza 16/10 (tanda 10) · KV-ETIQUETA-AUDIO
  etiquetaAudio: (texto: string) => `la resposta «${texto.slice(0, 40)}»`,
};

export const TEXTOS_VOZ_KIDS: Record<IdiomaKids, TextosVozKids> = { "es-AR": VOZ_KIDS_AR, "es-ES": VOZ_KIDS_ES, ca: VOZ_KIDS_CA };

/** Los de vos (Argentina), con su nombre de siempre. */
export const VOZ_KIDS = VOZ_KIDS_AR;
