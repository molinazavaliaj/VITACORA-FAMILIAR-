import type { Textos } from "@/lib/idioma-web";

// Los textos de /viaje, /ca/viaje y /ar/viaje (rediseño 2026-10, dirección
// «la web es un libro», paleta azul de Viaje).
//
// 16/10: describen la Vitácora de Viaje V2, la única que se vende
// (docs/viajes-v2/flujo-vigente.md): antes de salir, durante el viaje, la
// vuelta y el libro con el álbum y el código QR. Nada del viaje viejo
// (etapas, «cada ciudad un capítulo», «con quién viajás», «se lee en la web»).
// Sin cadencia ni cantidad de preguntas, sin duración, sin «cada noche».
//
// es = España, de tú (viaja una persona). ar = de vos. ca = de tu.
// TEXTO PARA NAZA: lo nuevo está en docs/rediseno-2026-10/viaje-v2/textos.md
// (tandas 6 y 7). Lo que sigue igual de antes lo dice al lado.
// ca: revisado con el corrector de Softcatalà (19/10).

type Paso = { titulo: string; texto: string };
type Duda = { pregunta: string; respuesta: string };

export type TextosViajePagina = {
  meta: { titulo: string; descripcion: string };
  etiqueta: string;
  titulo: [string, string];
  bajada: string;
  comprar: string;
  /** «{precio} · el viaje entero» */
  precio: (p: string) => string;
  /** Sin PRECIO_VIAJE_* cargado, la página no vende. */
  proximamente: string;
  altHotel: string;
  altLibro: string;
  como: { titulo: string; pasos: [Paso, Paso, Paso, Paso] };
  fotos: [string, string];
  precioBloque: { titulo: string; texto: string; nota: string };
  faq: { titulo: string; preguntas: Duda[] };
  familiar: string;
};

export const TEXTOS_VIAJE: Textos<TextosViajePagina> = {
  /* ─────────────────────────── España, de tú ─────────────────────────── */
  es: {
    meta: {
      // Igual que antes (el lema de Viaje).
      titulo: "Vitácora de Viaje — En cada viaje hay un libro sin escribir",
      // TEXTO PARA NAZA
      descripcion: "Un biógrafo te pregunta por WhatsApp antes, durante y después del viaje. Al volver, tu viaje es un libro con tus fotos y tu voz.",
    },
    etiqueta: "Vitácora de Viaje",
    titulo: ["En cada viaje hay", "un libro sin escribir."],
    // TEXTO PARA NAZA
    bajada: "Un biógrafo te acompaña por WhatsApp. Tú le cuentas el viaje con audios y al volver tienes un libro con tus fotos y tu voz.",
    comprar: "Empezar el libro del viaje",
    precio: (p) => `${p} · el viaje entero`,
    proximamente: "Próximamente",
    // TEXTO PARA NAZA: sin Lisboa.
    altHotel: "Una mujer graba un audio sentada en la cama de un hotel, con la maleta abierta y los tejados de una ciudad por la ventana",
    altLibro: "El libro de un viaje sobre una mesa, junto a una vela",
    como: {
      titulo: "Cómo funciona.",
      // TEXTO PARA NAZA
      pasos: [
        { titulo: "Antes de salir", texto: "El biógrafo te escribe por WhatsApp para saber cómo planeaste el viaje. Le contestas con un audio cuando puedes." },
        { titulo: "Durante el viaje", texto: "Te pregunta por el día y te pide alguna foto de lo que estás viendo. Si un día no tienes ganas, dices «paso» y seguimos." },
        { titulo: "La vuelta", texto: "Al volver te pregunta por la llegada a casa. Eliges tus fotos favoritas y van al álbum del final." },
        { titulo: "Tu libro", texto: "Tu viaje contado con tus palabras, con el álbum y un código QR para escuchar tus audios. Impreso o en PDF." },
      ],
    },
    // Igual que antes.
    fotos: ["Las fotos quedan.", "Lo que viviste, también."],
    precioBloque: {
      titulo: "Un precio por viaje, no por día.",
      // TEXTO PARA NAZA
      texto: "Lo pagas una vez, antes de salir. Incluye el viaje entero, el libro en PDF con el álbum de fotos y el código para escuchar tu voz. El libro impreso se suma si quieres.",
      nota: "Pago único, sin suscripciones",
    },
    faq: {
      titulo: "Preguntas que nos hacen.",
      // TEXTO PARA NAZA (menos la última, la garantía aprobada)
      preguntas: [
        { pregunta: "¿Tengo que saber las ciudades?", respuesta: "No. Solo la fecha de salida, la de vuelta y el país principal. Las ciudades salen de lo que cuentas." },
        { pregunta: "¿Se lo puedo regalar a alguien?", respuesta: "Sí. Nos dejas su WhatsApp y el biógrafo le escribe para contarle que es tu regalo. Si quieres, le sumas hasta cinco preguntas tuyas." },
        { pregunta: "¿Cuántas fotos puedo mandar?", respuesta: "Las que quieras, durante todo el viaje. Al volver eliges tus favoritas y van al álbum del final del libro." },
        { pregunta: "¿En qué idioma me escribe?", respuesta: "En castellano de España, de Argentina o en catalán. Lo eliges al comprar." },
        { pregunta: "¿Cuándo llega el libro?", respuesta: "Cuando vuelves y mandas las fotos del álbum, lo escribimos. Lo revisas en la página del viaje antes de cerrarlo y, si es impreso, te avisamos cuando salga de imprenta." },
        // APROBADO por Naza el 19/10 · tanda 6, texto 9 (la garantía de Viaje vive solo acá y en el pago)
        { pregunta: "¿Y si el viaje se cancela?", respuesta: "Si nos avisas antes de que la persona que viaja acepte la entrevista, te devolvemos todo. Si ya aceptó y contesta menos de diez preguntas, también te devolvemos todo." },
      ],
    },
    familiar: "¿Buscas el libro de una vida? Vitácora Familiar →",
  },

  /* ─────────────────────────── Argentina, de vos ─────────────────────────── */
  ar: {
    meta: {
      titulo: "Vitácora de Viaje — En cada viaje hay un libro sin escribir",
      descripcion: "Un biógrafo te pregunta por WhatsApp antes, durante y después del viaje. Al volver, tu viaje es un libro con tus fotos y tu voz.",
    },
    etiqueta: "Vitácora de Viaje",
    titulo: ["En cada viaje hay", "un libro sin escribir."],
    bajada: "Un biógrafo te acompaña por WhatsApp. Vos le contás el viaje con audios y al volver tenés un libro con tus fotos y tu voz.",
    comprar: "Empezar mi Vitácora de viaje",
    precio: (p) => `${p} · el viaje entero`,
    proximamente: "Próximamente",
    altHotel: "Una mujer graba un audio sentada en la cama de un hotel, con la valija abierta y los techos de una ciudad por la ventana",
    altLibro: "El libro de un viaje sobre una mesa, junto a una vela",
    como: {
      titulo: "Cómo funciona.",
      pasos: [
        { titulo: "Antes de salir", texto: "El biógrafo te escribe por WhatsApp para saber cómo planeaste el viaje. Le contestás con un audio cuando podés." },
        { titulo: "Durante el viaje", texto: "Te pregunta por el día y te pide alguna foto de lo que estás viendo. Si un día no tenés ganas, decís «paso» y seguimos." },
        { titulo: "La vuelta", texto: "Al volver te pregunta por la llegada a casa. Elegís tus fotos favoritas y van al álbum del final." },
        { titulo: "Tu libro", texto: "Tu viaje contado con tus palabras, con el álbum y un código QR para escuchar tus audios. Impreso o en PDF." },
      ],
    },
    fotos: ["Las fotos quedan.", "Lo que viviste, también."],
    precioBloque: {
      titulo: "Un precio por viaje, no por día.",
      texto: "Lo pagás una vez, antes de salir. Incluye el viaje entero, el libro en PDF con el álbum de fotos y el código para escuchar tu voz. El libro impreso se suma si querés.",
      nota: "Pago único, sin suscripciones",
    },
    faq: {
      titulo: "Preguntas que nos hacen.",
      preguntas: [
        { pregunta: "¿Tengo que saber las ciudades?", respuesta: "No. Solo la fecha de salida, la de vuelta y el país principal. Las ciudades salen de lo que contás." },
        { pregunta: "¿Se lo puedo regalar a alguien?", respuesta: "Sí. Nos dejás su WhatsApp y el biógrafo le escribe para contarle que es tu regalo. Si querés, le sumás hasta cinco preguntas tuyas." },
        { pregunta: "¿Cuántas fotos puedo mandar?", respuesta: "Las que quieras, durante todo el viaje. Al volver elegís tus favoritas y van al álbum del final del libro." },
        { pregunta: "¿En qué idioma me escribe?", respuesta: "En castellano de Argentina, de España o en catalán. Lo elegís al comprar." },
        { pregunta: "¿Cuándo llega el libro?", respuesta: "Cuando volvés y mandás las fotos del álbum, lo escribimos. Lo revisás en la página del viaje antes de cerrarlo y, si es impreso, te avisamos cuando salga de imprenta." },
        // APROBADO por Naza el 19/10 · tanda 6, texto 10
        { pregunta: "¿Y si el viaje se cancela?", respuesta: "Si nos avisás antes de que la persona que viaja acepte la entrevista, te devolvemos todo. Si ya aceptó y contesta menos de diez preguntas, también te devolvemos todo." },
      ],
    },
    familiar: "¿Buscás el libro de una vida? Vitácora Familiar →",
  },

  /* ─────────────────────── Catalán, de tu (revisado con Softcatalà, 19/10) ─────────────────────── */
  ca: {
    meta: {
      titulo: "Vitácora de Viatge — A cada viatge hi ha un llibre per escriure",
      descripcion: "Un biògraf et pregunta per WhatsApp abans, durant i després del viatge. En tornar, el teu viatge és un llibre amb les teves fotos i la teva veu.",
    },
    etiqueta: "Vitácora de Viatge",
    titulo: ["A cada viatge hi ha", "un llibre per escriure."],
    bajada: "Un biògraf t'acompanya per WhatsApp. Tu li expliques el viatge amb àudios i en tornar tens un llibre amb les teves fotos i la teva veu.",
    comprar: "Començar el llibre del viatge",
    precio: (p) => `${p} · el viatge sencer`,
    proximamente: "Aviat",
    altHotel: "Una dona grava un àudio asseguda al llit d'un hotel, amb la maleta oberta i les teulades d'una ciutat a la finestra",
    altLibro: "El llibre d'un viatge sobre una taula, al costat d'una espelma",
    como: {
      titulo: "Com funciona.",
      pasos: [
        { titulo: "Abans de sortir", texto: "El biògraf t'escriu per WhatsApp per saber com vas planejar el viatge. Li contestes amb un àudio quan pots." },
        { titulo: "Durant el viatge", texto: "Et pregunta pel dia i et demana alguna foto del que estàs veient. Si un dia no en tens ganes, dius «passo» i seguim." },
        { titulo: "La tornada", texto: "En tornar et pregunta per l'arribada a casa. Tries les teves fotos preferides i van a l'àlbum del final." },
        { titulo: "El teu llibre", texto: "El teu viatge explicat amb les teves paraules, amb l'àlbum i un codi QR per escoltar els teus àudios. Imprès o en PDF." },
      ],
    },
    fotos: ["Les fotos queden.", "El que has viscut, també."],
    precioBloque: {
      titulo: "Un preu per viatge, no per dia.",
      texto: "El pagues una vegada, abans de sortir. Inclou el viatge sencer, el llibre en PDF amb l'àlbum de fotos i el codi per escoltar la teva veu. El llibre imprès s'hi suma si vols.",
      nota: "Pagament únic, sense subscripcions",
    },
    faq: {
      titulo: "Preguntes que ens fan.",
      preguntas: [
        { pregunta: "He de saber les ciutats?", respuesta: "No. Només la data de sortida, la de tornada i el país principal. Les ciutats surten del que expliques." },
        { pregunta: "Ho puc regalar a algú?", respuesta: "Sí. Ens deixes el seu WhatsApp i el biògraf li escriu per explicar-li que és el teu regal. Si vols, hi afegeixes fins a cinc preguntes teves." },
        { pregunta: "Quantes fotos puc enviar?", respuesta: "Les que vulguis, durant tot el viatge. En tornar tries les preferides i van a l'àlbum del final del llibre." },
        { pregunta: "En quina llengua m'escriu?", respuesta: "En català, en castellà d'Espanya o d'Argentina. Ho tries en comprar." },
        { pregunta: "Quan arriba el llibre?", respuesta: "Quan tornes i envies les fotos de l'àlbum, l'escrivim. El revises a la pàgina del viatge abans de tancar-lo i, si és imprès, t'avisem quan surti d'impremta." },
        // PENDIENTE REVISIÓN NATIVA (Imma) · traducción de la tanda 6, texto 9
        { pregunta: "I si el viatge es cancel·la?", respuesta: "Si ens avises abans que la persona que viatja accepti l'entrevista, t'ho retornem tot. Si ja ha acceptat i contesta menys de deu preguntes, també t'ho retornem tot." },
      ],
    },
    familiar: "Busques el llibre d'una vida? Vitácora Familiar →",
  },
};

// El libro de viaje de ejemplo que gira en el inicio de /viaje (Libro3D con la
// variante «viaje», como el de Osvaldo en Familiar). APROBADO por Naza el 19/10
// (los 10 textos del libro). Es inventado y va en castellano en los tres
// idiomas, como el libro de Osvaldo.
export const LIBRO_VIAJE_EJEMPLO = {
  etiqueta: "El libro de nuestro viaje",
  nombre: ["Lisboa ·", "Oporto"] as [string, string],
  paraSiempre: "Sara y Dani",
  iniciales: "S · D",
  lomo: "Lisboa · Oporto · El libro de nuestro viaje",
  contra: "Estas páginas guardan el viaje de Sara y Dani a Lisboa y Oporto, contado con sus propias palabras y sus fotos. En este QR, sus audios del viaje.",
  escucha: "Escucha el viaje",
  web: "vitacorafamiliar.com",
};

export const CAPITULO_VIAJE_EJEMPLO = {
  capitulo: "Día 1",
  tituloCapitulo: "Alfama",
  citaCapitulo: "«Nos perdimos tres veces antes de encontrar el mirador.»",
  parrafos: [
    "Llegamos con las mochilas y sin reserva para cenar. Dani quería subir caminando y yo quería el tranvía. Subimos caminando.",
    "Arriba había un señor tocando la guitarra y el río se ponía naranja. Nos quedamos hasta que no se veía nada.",
  ] as [string, string],
  altFoto: "Sara grabando un audio en la cama del hotel",
  pieFoto: "La primera tarde en el hotel, contando el día.",
};
