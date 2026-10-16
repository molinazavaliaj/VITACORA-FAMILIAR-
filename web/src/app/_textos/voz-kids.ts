import { PANEL_KIDS } from "./panel-kids";

// «Su voz» de Vitácora Kids: la página que abre cada QR del libro de un chico
// (`/voz/<token>`). Es la misma página de la casa con sus textos de Kids: sin
// «La historia de…» ni «El libro de una vida». En vos (Kids es de Argentina),
// frases simples, sin dos puntos, sin «tu hijo» ni «él» y sin tiempos.

export const VOZ_KIDS = {
  // APROBADO por Naza 16/10 (tanda 6) · KP-ETIQUETA (el del panel, tal cual)
  etiqueta: PANEL_KIDS.etiqueta,
  // APROBADO por Naza 15/10 (tanda 2) · KP-TITULO (el del panel, tal cual)
  titulo: PANEL_KIDS.titulo,
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
} as const;
