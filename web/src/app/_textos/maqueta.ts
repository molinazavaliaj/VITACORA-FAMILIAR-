// Los textos de la maqueta escondida /maqueta (y /ar/maqueta): la parte de
// arriba de la portada nueva, con las correcciones del amigo de Naza y el
// brief de Remento (15/10). Salen de docs/rediseno-2026-10/amigo/textos.md,
// tanda 1 (textos 1 a 10, la parte 1), tanda 2 (textos 11 a 20, la parte 2) y
// tanda 3 (textos 21 a 30, la parte 3), con su estado de ahí. Cuando Naza apruebe la
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
  /** 2 · APROBADO (Naza 15/10). */
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
  /** Parte 2 · Cómo funciona. */
  como: {
    /** Título ya aprobado («Cómo funciona», el de la portada). */
    titulo: string;
    /** 11 · PROPUESTA (idea del amigo). */
    bajada: string;
    /** 12 a 15 · PROPUESTA. El 4 es el paso emocional. */
    pasos: [PasoMaqueta, PasoMaqueta, PasoMaqueta, PasoMaqueta];
  };
  /** Parte 2 · La carta. 18, la carta, APROBADA el 14/10: sale de portada.ts sin cambios. */
  carta: {
    /** 16 · PROPUESTA (la de siempre sin «punto y Y»). */
    frase: string;
    /** 17 · PROPUESTA (sin nombres). */
    firma: string;
  };
  /** Parte 2 · Escúchalo. La cita, su capítulo y el reproductor salen de portada.ts. */
  escuchalo: {
    /** 19 · PROPUESTA. */
    titulo: string;
    /** 20 · PROPUESTA. */
    texto: string;
  };
  /** Parte 3 · El libro. El ÚNICO precio de la maqueta: el del impreso con el PDF. */
  libro: {
    /** 21 · PROPUESTA. */
    titulo: string;
    /** 22 · PROPUESTA: tres titulares cortos con su texto. */
    beneficios: [PasoMaqueta, PasoMaqueta, PasoMaqueta];
    /** 23 · PROPUESTA: qué incluye. */
    incluye: [string, string, string, string];
    /** 24 · PROPUESTA: lo que acompaña al precio ({precio} · esto). */
    pagoUnico: string;
  };
  /** Parte 3 · Marcos. 25 · PROPUESTA. */
  marcos: {
    titulo: string;
    /** El precio del marco: en es va literal (19 €); en ar, el de PRECIO_MARCO_ARS o, sin él, la frase sin número. */
    texto: (precioMarco: string | null) => string;
  };
  /** Parte 3 · Regalo. 26 · PROPUESTA. */
  regalo: { titulo: string; texto: string };
  /** Parte 3 · Preguntas. El título y las demás preguntas, aprobados (portada.ts). */
  preguntas: {
    titulo: string;
    /** 29 · PROPUESTA: reemplaza «¿Mi padre va a saber usarlo?»; la respuesta sigue igual. */
    usarlo: string;
    /** 27 y 28 · PROPUESTA: las preguntas nuevas. */
    nuevas: [{ pregunta: string; respuesta: string }, { pregunta: string; respuesta: string }];
  };
  /** Parte 3 · Cierre. 30 · PROPUESTA (lema del amigo). */
  cierre: string;
};

export type PasoMaqueta = { titulo: string; texto: string };

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
    como: {
      titulo: "Cómo funciona",
      bajada:
        "Entrevistamos a tu familiar por WhatsApp, a su ritmo, y con lo que nos cuenta escribimos el libro de su vida. Si sabe mandar un audio, ya sabe hacerlo.",
      pasos: [
        {
          titulo: "Nos dices quién es",
          texto: "Nos dejas su nombre, su WhatsApp y el día en que quieres que empiece. Si es un regalo, te damos una tarjeta para entregárselo.",
        },
        {
          titulo: "Solo manda audios",
          texto: "Le llega una pregunta por WhatsApp y la contesta con un audio cuando quiere, como hace todos los días. Sin apps ni nada que aprender.",
        },
        {
          titulo: "Escribimos su libro",
          texto: "Con todo lo que cuenta, nuestro biógrafo escribe el libro de su vida con sus propias palabras.",
        },
        {
          titulo: "Su familia lo lee y lo escucha",
          texto: "Llega el libro impreso a casa. Lo abren, leen su vida y con el código de la contratapa vuelven a escuchar su voz.",
        },
      ],
    },
    carta: {
      frase: "Un día vas a querer preguntarle algo y ya no va a estar para contártelo.",
      firma: "Los fundadores de Vitácora",
    },
    escuchalo: {
      titulo: "Su voz, guardada en su libro.",
      texto:
        "El libro lleva sus mejores frases con su voz real, su forma de contar y su risa. Las escuchas con el código de la contratapa o desde el móvil, cuando quieras.",
    },
    libro: {
      titulo: "Cada vida merece su propio libro.",
      beneficios: [
        { titulo: "Léelo", texto: "Su vida contada con sus palabras, capítulo a capítulo, con sus fotos." },
        { titulo: "Escúchalo", texto: "Sus mejores frases suenan con su voz desde el código de la contratapa." },
        { titulo: "Para siempre", texto: "Tapa dura y su foto en la portada, para que pase de mano en mano en tu familia." },
      ],
      incluye: [
        "La entrevista entera por WhatsApp, hasta completar su historia",
        "La página de su historia, para escuchar cada audio",
        "El libro impreso en tapa dura, con el envío incluido",
        "El libro en PDF, con sus mejores frases en su voz",
      ],
      pagoUnico: "pago único, sin suscripciones",
    },
    marcos: {
      titulo: "Un marco con su voz para cada uno.",
      // Naza: el marco a 19 € todos, literal en España.
      texto: () =>
        "Un marco con su foto y un chip por dentro. Acercas el móvil y suena su voz. Puedes pedir uno para cada hermano, cada hijo o cada nieto, a 19 € cada uno.",
    },
    regalo: {
      titulo: "No le regales la misma camisa de todos los años.",
      texto: "Regálale algo que va a quedar para toda la vida. Eliges el día en que empieza y te damos una tarjeta para entregárselo.",
    },
    preguntas: {
      titulo: "Lo que suelen preguntarnos.",
      usarlo: "¿Va a saber usarlo?",
      nuevas: [
        {
          pregunta: "¿Puedo ver el libro antes de que se imprima?",
          respuesta: "Sí. Cuando está terminado lo ves en la página de su historia, eliges la tapa y recién ahí se imprime.",
        },
        { pregunta: "¿Y si quiero hacer mi propio libro?", respuesta: "Funciona igual. Las preguntas te llegan a ti y el libro es el de tu vida." },
      ],
    },
    cierre: "Todas las vidas merecen su propio libro.",
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
    como: {
      titulo: "Cómo funciona",
      bajada:
        "Entrevistamos a tu familiar por WhatsApp, a su ritmo, y con lo que nos cuenta escribimos el libro de su vida. Si sabe mandar un audio, ya sabe hacerlo.",
      pasos: [
        {
          titulo: "Nos decís quién es",
          texto: "Nos dejás su nombre, su WhatsApp y el día en que querés que empiece. Si es un regalo, te damos una tarjeta para entregárselo.",
        },
        {
          titulo: "Solo manda audios",
          texto: "Le llega una pregunta por WhatsApp y la contesta con un audio cuando quiere, como hace todos los días. Sin apps ni nada que aprender.",
        },
        {
          titulo: "Escribimos su libro",
          texto: "Con todo lo que cuenta, nuestro biógrafo escribe el libro de su vida con sus propias palabras.",
        },
        {
          titulo: "Su familia lo lee y lo escucha",
          texto: "Llega el libro impreso a casa. Lo abren, leen su vida y con el código de la contratapa vuelven a escuchar su voz.",
        },
      ],
    },
    carta: {
      frase: "Un día vas a querer preguntarle algo y ya no va a estar para contártelo.",
      firma: "Los fundadores de Vitácora",
    },
    escuchalo: {
      titulo: "Su voz, guardada en su libro.",
      texto:
        "El libro lleva sus mejores frases con su voz real, su forma de contar y su risa. Las escuchás con el código de la contratapa o desde el celular, cuando quieras.",
    },
    libro: {
      titulo: "Cada vida merece su propio libro.",
      beneficios: [
        { titulo: "Leelo", texto: "Su vida contada con sus palabras, capítulo a capítulo, con sus fotos." },
        { titulo: "Escuchalo", texto: "Sus mejores frases suenan con su voz desde el código de la contratapa." },
        { titulo: "Para siempre", texto: "Tapa dura y su foto en la portada, para que pase de mano en mano en tu familia." },
      ],
      incluye: [
        "La entrevista entera por WhatsApp, hasta completar su historia",
        "La página de su historia, para escuchar cada audio",
        "El libro impreso en tapa dura, con el envío incluido",
        "El libro en PDF, con sus mejores frases en su voz",
      ],
      pagoUnico: "pago único, sin suscripciones",
    },
    marcos: {
      titulo: "Un marco con su voz para cada uno.",
      // En pesos, de PRECIO_MARCO_ARS; sin esa variable, la frase va sin número.
      texto: (p) =>
        `Un marco con su foto y un chip por dentro. Acercás el celular y suena su voz. Podés pedir uno para cada hermano, cada hijo o cada nieto${p ? `, a ${p} cada uno` : ""}.`,
    },
    regalo: {
      titulo: "No le regales la misma camisa de todos los años.",
      texto: "Regalale algo que va a quedar para toda la vida. Elegís el día en que empieza y te damos una tarjeta para entregárselo.",
    },
    preguntas: {
      titulo: "Lo que suelen preguntarnos.",
      usarlo: "¿Va a saber usarlo?",
      nuevas: [
        {
          pregunta: "¿Puedo ver el libro antes de que se imprima?",
          respuesta: "Sí. Cuando está terminado lo ves en la página de su historia, elegís la tapa y recién ahí se imprime.",
        },
        { pregunta: "¿Y si quiero hacer mi propio libro?", respuesta: "Funciona igual. Las preguntas te llegan a vos y el libro es el de tu vida." },
      ],
    },
    cierre: "Todas las vidas merecen su propio libro.",
  },
};
