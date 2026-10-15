// Los textos de la maqueta escondida /maqueta (y /ar/maqueta): la parte de
// arriba de la portada nueva, con las correcciones del amigo de Naza y el
// brief de Remento (15/10). Salen de docs/rediseno-2026-10/amigo/textos.md,
// tanda 1, líneas 1 a 10, con su estado de ahí. Cuando Naza apruebe la
// maqueta, estos textos pasan a portada.ts y este archivo se borra.
//
// Reglas de esa tanda: sin dos puntos, ninguna oración empieza con «Y»
// después de punto, sin «padre» (se dice «tu familiar»), sin «desde 49 €» ni
// «pago único» arriba.
//
// es = España, de tú · ar = Argentina, de vos. El catalán, cuando se apruebe.

export type TextosMaqueta = {
  /** 1 · APROBADO (el de siempre), partido en dos líneas como en la portada. */
  titulo: [string, string];
  /** 2 · PROPUESTA, falta OK de Naza. */
  bajada: string;
  /** 3 · APROBADO. */
  iniciar: string;
  /** 4 · APROBADO. */
  comoFunciona: string;
  /** 5 · APROBADO. */
  ventajas: [string, string, string, string];
  /** 6 · APROBADO: la pregunta y el enlace a la compra propia. */
  propio: { pregunta: string; enlace: string };
  queEs: {
    /** La etiqueta chica de la maqueta 1. */
    etiqueta: string;
    /** 7 · APROBADO. */
    titulo: string;
    /** 8 · APROBADO. */
    bajada: string;
  };
  /** 9 · APROBADO: título y los tres pasos de quien regala. */
  siguiendo: { titulo: string; pasos: [string, string, string] };
  /** 10 · APROBADO: el pie del teléfono. */
  pieTelefono: string;
  /** Texto de servicio de la maqueta (no se aprueba ni pasa a la portada). */
  sigue: string;
};

export const TEXTOS_MAQUETA: Record<"es" | "ar", TextosMaqueta> = {
  es: {
    titulo: ["En cada familia hay", "un libro sin escribir."],
    bajada:
      "Tu familiar nos cuenta su vida con audios de WhatsApp. Nosotros nos encargamos de escribir su libro y que quede en tu familia para siempre.",
    iniciar: "Iniciar Vitácora",
    comoFunciona: "Cómo funciona ↓",
    ventajas: ["Solo manda audios, no escribe nada", "Sin apps ni contraseñas", "Su libro impreso, en tapa dura", "Sus mejores frases, con su voz"],
    propio: { pregunta: "¿Quieres contar tu propia vida?", enlace: "También puedes hacer tu libro." },
    queEs: {
      etiqueta: "Qué es Vitácora",
      titulo: "Un regalo para quien cuenta y otro para toda la familia.",
      bajada:
        "A tu familiar le llegan preguntas sobre su vida, desde su infancia hasta hoy, y alguien que le escucha. La familia se queda con un libro que va a pasar de generación en generación.",
    },
    siguiendo: {
      titulo: "Tú lo vas siguiendo de cerca.",
      pasos: [
        "Escuchas cada audio en cuanto lo manda.",
        "Le sumas preguntas y fotos para su libro.",
        "Lo ves terminado y eliges la tapa antes de imprimirlo.",
      ],
    },
    pieTelefono: "Así se ve la página de su historia.",
    sigue: "Sigue · Cómo funciona en 4 pasos, la carta, escúchalo, el libro y los marcos, regalo, preguntas.",
  },
  ar: {
    titulo: ["En cada familia hay", "un libro sin escribir."],
    bajada:
      "Tu familiar nos cuenta su vida con audios de WhatsApp. Nosotros nos encargamos de escribir su libro y que quede en tu familia para siempre.",
    iniciar: "Iniciar Vitácora",
    comoFunciona: "Cómo funciona ↓",
    ventajas: ["Solo manda audios, no escribe nada", "Sin apps ni contraseñas", "Su libro impreso, en tapa dura", "Sus mejores frases, con su voz"],
    propio: { pregunta: "¿Querés contar tu propia vida?", enlace: "También podés hacer tu libro." },
    queEs: {
      etiqueta: "Qué es Vitácora",
      titulo: "Un regalo para quien cuenta y otro para toda la familia.",
      bajada:
        "A tu familiar le llegan preguntas sobre su vida, desde su infancia hasta hoy, y alguien que le escucha. La familia se queda con un libro que va a pasar de generación en generación.",
    },
    siguiendo: {
      titulo: "Vos lo vas siguiendo de cerca.",
      pasos: [
        "Escuchás cada audio en cuanto lo manda.",
        "Le sumás preguntas y fotos para su libro.",
        "Lo ves terminado y elegís la tapa antes de imprimirlo.",
      ],
    },
    pieTelefono: "Así se ve la página de su historia.",
    sigue: "Sigue · Cómo funciona en 4 pasos, la carta, escuchalo, el libro y los marcos, regalo, preguntas.",
  },
};
