import type { Textos } from "@/lib/idioma-web";

// Los textos de la portada (/, /ar, /ca), por idioma. Desde el 15/10 la
// portada es la maqueta que aprobó Naza con las correcciones de su amigo y el
// brief de Remento: inicio → qué es (con el teléfono) → cómo funciona → la
// carta → escúchalo → el libro (un solo precio, el del impreso) → marcos →
// regalo → preguntas → «¿Te queda alguna duda?» → cierre. Esos textos salen de
// docs/rediseno-2026-10/amigo/textos.md (1 a 30, todos APROBADOS por Naza el
// 15/10, es y ar). Los demás (la carta, las preguntas, el marco con chip, el
// libro de Osvaldo) son los aprobados antes (docs/rediseno-2026-10/fase-*).
//
// Reglas (amigo/textos.md): sin dos puntos, ninguna oración empieza con «Y»
// después de punto, sin «padre» en la portada (se dice «tu familiar»), sin
// «desde 49 €», el panel se llama «la página de su historia».
//
// Algunos textos los usan también las landings de anuncio (_landing/
// landing.tsx) y /ejemplo: hero.titulo y hero.desde, como, dudas.hablar,
// libro.mas, voz, marco, diciembre, faq, sticky y direccion. Están marcados.
//
// es = España, de tú · ar = Argentina, de vos · ca = catalán, de tú.
// ca: revisado con el corrector de Softcatalà (18/10)

type Paso = { titulo: string; texto: string };
type Duda = { pregunta: string; respuesta: string };

export type TextosPortada = {
  /** El <title>, la description y el OpenGraph: titular + bajada aprobados (1 y 2). */
  meta: { titulo: string; descripcion: string };

  /* ─────────────── La portada (maqueta aprobada el 15/10) ─────────────── */

  /** 3 · el botón de compra de toda la portada (y la barra fija del móvil). */
  iniciar: string;
  inicio: {
    /** 2 · la bajada. */
    bajada: string;
    /** 4 · baja a «Cómo funciona». */
    comoFunciona: string;
    /** 5 · las cuatro ventajas. */
    ventajas: [string, string, string, string];
    /** 6 · tu propio libro: la pregunta y el enlace a la compra. */
    propio: { pregunta: string; enlace: string };
  };
  /** 7 y 8 · «Qué es», con su etiqueta chica. */
  queEs: { etiqueta: string; titulo: string; bajada: string };
  /** 9 · quien regala lo va siguiendo. */
  siguiendo: { titulo: string; pasos: [string, string, string] };
  /** Debajo de «lo vas siguiendo»: cómo cuidamos lo que cuenta (Naza, 25/10). Solo dice lo que ya promete la política de privacidad. */
  privacidad: { titulo: string; texto: string; enlace: string };
  /** 10 · el pie del teléfono con la página de su historia. */
  pieTelefono: string;
  /** 11 a 15 · «Cómo funciona» en cuatro pasos (el 4, el que emociona). */
  funciona: { titulo: string; bajada: string; pasos: [Paso, Paso, Paso, Paso] };
  /** 16 a 18 · la carta de los fundadores (el texto, aprobado el 14/10). */
  carta: { frase: string; texto: string; firma: string };
  /**
   * 19 y 20 · «Escúchalo», con el fragmento de la voz de Naza (el campo,
   * public/rediseno/su-voz-campo.mp3, con su permiso). La cita es literal y
   * va igual en los tres idiomas porque es su voz.
   */
  escuchalo: { titulo: string; texto: string; etiqueta: string; cita: string; duracion: string };
  /** 21 a 24 · el libro y el ÚNICO precio de la portada, el del impreso. */
  elLibro: { titulo: string; beneficios: [Paso, Paso, Paso]; incluye: [string, string, string, string]; pagoUnico: string };
  /** 25 · marcos. En es y ca el precio va literal (19 €); en ar, el de PRECIO_MARCO_ARS o, sin él, la frase sin número. */
  marcos: { titulo: string; texto: (precioMarco: string | null) => string };
  /** 26 · regalo. */
  regalo: { titulo: string; texto: string };
  /** 27 a 29 · la primera pregunta cambiada y las dos nuevas (al final). */
  preguntas: { usarlo: string; nuevas: [Duda, Duda] };
  /** 30 · el lema del cierre. */
  lema: string;

  /* ─────────── Compartidos con la portada, las landings y /ejemplo ─────────── */

  /** Landings: el titular (también el de la portada) y el «desde» de su hero. */
  hero: { titulo: [string, string]; desde: (precio: string) => string };
  /** Landings: el enlace al libro de ejemplo. */
  verEjemplo: string;
  /** Landings: los tres pasos de «Cómo funciona» de antes. */
  como: { paso: (n: number) => string; pasos: [Paso, Paso, Paso] };
  /** Portada (en las preguntas) y landings. */
  dudas: { hablar: { pregunta: string; texto: string; temas: string[] } };
  libro: { altPortada: string; mas: (precio: string) => string };
  voz: {
    texto: string;
    capitulo: string;
    cita: string;
    duracion: string;
    escuchar: string;
    pausar: string;
    altContraportada: string;
  };
  marco: {
    titulo: [string, string];
    texto: string;
    nfcTitulo: string;
    nfcTexto: string;
    nota: string;
    pasos: [string, string, string];
    telefonoQuieto: string;
    telefonoLibro: string;
    altMarco: string;
  };
  diciembre: { regalo: { texto: string }; altFoto: string };
  faq: { titulo: string; duda: { titulo: string; texto: string; boton: string }; preguntas: Duda[] };
  /** Landings: la barra fija del móvil (la portada usa la suya, sin «desde»). */
  sticky: { desde: string; conImpreso: string; sinImpreso: string };
  /**
   * - como.bajada: APROBADA por Naza (3.ª vuelta), la usan las landings.
   * - libro: lo que va impreso en el libro de ejemplo de Osvaldo (tapa, lomo
   *   y contratapa), copiado del diseño real (vf_book_atlas). El libro de
   *   ejemplo está en castellano en los tres idiomas, como el de /ejemplo.
   */
  direccion: {
    como: { bajada: string };
    /** El botón chico para repetir el giro del libro (landings). */
    libroOtraVez: string;
    libro: {
      etiqueta: string;
      nombre: [string, string];
      paraSiempre: string;
      iniciales: string;
      lomo: string;
      contra: string;
      escucha: string;
      web: string;
    };
  };
};

// La cita del fragmento: la voz de Naza, literal (rioplatense), igual en los
// tres idiomas.
const CITA_CAMPO =
  "«En el campo andábamos a caballo, hacíamos vida de campo, cortábamos el pasto, comíamos asado. Ni bien llegábamos abríamos la tranquera, saludábamos a los animales que se acercaban caminando al camino, abríamos toda la casa…»";

const CARTA_ES =
  "Hicimos Vitácora porque no todas las familias tienen la suerte de que los abuelos sigan ahí cuando los nietos crecen. Muchos niños van a conocer a sus abuelos solo por fotos, sin saber cómo hablaban, qué vivieron ni qué aprendieron. Queremos que eso no se pierda. Que cada nieto, cuando sea mayor, pueda abrir un libro y leer quién fue su abuelo, con sus propias palabras.";

const LIBRO_OSVALDO: TextosPortada["direccion"]["libro"] = {
  etiqueta: "El libro de su vida",
  nombre: ["Osvaldo", "Toroide"],
  paraSiempre: "para siempre",
  iniciales: "O · T",
  lomo: "Osvaldo Toroide · El libro de su vida",
  contra: "Estas páginas guardan la vida de Osvaldo Toroide, contada con sus propias palabras. Sus mejores historias, tal como él las vivió. En este QR, sus mejores frases.",
  escucha: "Escucha su voz",
  web: "vitacorafamiliar.com",
};

export const TEXTOS_PORTADA: Textos<TextosPortada> = {
  /* ─────────────────────────── España, de tú ─────────────────────────── */
  es: {
    meta: {
      titulo: "Vitácora Familiar — En cada familia hay un libro sin escribir",
      descripcion:
        "Tu familiar nos cuenta su vida con audios de WhatsApp. Nosotros nos encargamos de escribir su libro y que quede en tu familia para siempre.",
    },
    iniciar: "Iniciar Vitácora",
    inicio: {
      bajada:
        "Tu familiar nos cuenta su vida con audios de WhatsApp. Nosotros nos encargamos de escribir su libro y que quede en tu familia para siempre.",
      comoFunciona: "Cómo funciona ↓",
      ventajas: ["Responde con audios o escribiendo, como se sienta más cómodo", "Sin apps ni contraseñas", "Su libro impreso, en tapa dura", "Sus mejores historias, contadas con su voz y guardadas para siempre"],
      propio: { pregunta: "¿Quieres contar tu propia vida?", enlace: "También puedes hacer tu libro." },
    },
    queEs: {
      etiqueta: "Qué es Vitácora",
      titulo: "Un regalo para quien cuenta y otro para toda la familia.",
      bajada:
        "Entrevistamos a tu familiar por WhatsApp. Le hacemos preguntas sobre su vida, desde su infancia hasta hoy. Al terminar la entrevista escribimos la historia de su vida. Vitácora es un regalo emotivo, un libro que va a pasar de generación en generación.",
    },
    siguiendo: {
      titulo: "Tú lo vas siguiendo de cerca.",
      pasos: [
        "Escuchas cada audio en cuanto lo manda.",
        "Le añades preguntas y fotos para su libro.",
        "Lo ves terminado y eliges la tapa antes de imprimirlo.",
      ],
    },
    // PARA NAZA (25/10): el aviso de privacidad, con lo que ya dice la política (§5, §6 y §8).
    privacidad: {
      titulo: "Su historia es de tu familia.",
      texto: "Sabemos que lo que cuenta es personal. Sus audios y su libro solo los ven tu familia y quienes lo escriben. Se guardan en la Unión Europea, no los vendemos, no los usamos para publicidad y no entrenamos ninguna inteligencia artificial con ellos. Los audios originales se borran tres meses después de terminar el libro, o antes si lo pides.",
      enlace: "Cómo cuidamos sus datos",
    },
    pieTelefono: "Así se ve la página de su historia.",
    funciona: {
      titulo: "Cómo funciona",
      bajada:
        "Entrevistamos a tu familiar por WhatsApp, a su ritmo, y con lo que nos cuenta escribimos el libro de su vida. Si sabe mandar un audio, ya sabe hacerlo.",
      // PARA NAZA (25/10): pasos nuevos de «Cómo funciona».
      pasos: [
        {
          titulo: "¿Para quién es?",
          texto: "Si la Vitácora es para ti, la empezamos ahora mismo. Si es un regalo, puedes llevarte la tarjeta de regalo al pagar o dejarnos sus datos para que empecemos su libro el día que nos digas.",
        },
        {
          titulo: "Con audios o escribiendo",
          texto: "Las preguntas le llegan por WhatsApp y nos contesta como más cómodo se sienta, cuando tiene un rato libre. Sin apps ni nada que aprender.",
        },
        {
          titulo: "Escribimos su libro",
          texto: "Con todas las historias que nos cuenta, nuestro biógrafo escribe el libro de su vida con sus propias palabras, como si fuera el autor.",
        },
        {
          titulo: "Cuando llega a casa",
          texto: "Llega el día de tenerlo en casa, para siempre. Si otro familiar quiere su ejemplar, nos pide otra copia y se la mandamos. En la contraportada hay un código QR que abre sus historias contadas con su voz, guardadas para siempre.",
        },
      ],
    },
    carta: {
      frase: "Un día vas a querer preguntarle algo y ya no va a estar para contártelo.",
      // La carta APROBADA por Naza el 14/10, sin cambios.
      texto: CARTA_ES,
      firma: "Los fundadores de Vitácora",
    },
    escuchalo: {
      titulo: "Su voz, guardada en su libro.",
      texto:
        "El libro lleva sus mejores frases con su voz real y su forma de hablar. Las escuchas con el código de la contraportada o desde el móvil, cuando quieras.",
      etiqueta: "El campo",
      cita: CITA_CAMPO,
      duracion: "0:30",
    },
    elLibro: {
      titulo: "Cada vida merece su propio libro.",
      beneficios: [
        { titulo: "Léelo", texto: "Su vida contada con sus palabras, capítulo a capítulo, con sus fotos." },
        { titulo: "Escúchalo", texto: "Sus mejores frases suenan con su voz desde el código de la contraportada." },
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
      // PARA NAZA (25/10): título y texto nuevos. Naza: el marco a 19 € todos, literal en España.
      titulo: "Una foto para sus fans.",
      texto: () =>
        "En Vitácora creemos que la forma más bonita de celebrar este regalo es compartirlo con la familia. Por eso, estas Navidades, puedes sumar una foto enmarcada para regalar a cada hermano, hijo o nieto, a 19 € cada una. Lleva un chip por dentro: acercas el móvil y se abre su historia, con su voz.",
    },
    regalo: {
      titulo: "No le regales la misma camisa de todos los años.",
      texto: "Regálale algo que va a quedar para toda la vida. Eliges el día en que empieza y te damos una tarjeta para entregárselo.",
    },
    preguntas: {
      usarlo: "¿Va a saber usarlo?",
      nuevas: [
        {
          pregunta: "¿Puedo ver el libro antes de que se imprima?",
          respuesta: "Sí. Cuando está terminado lo ves en la página de su historia, eliges la tapa y solo entonces se imprime.",
        },
        { pregunta: "¿Y si quiero hacer mi propio libro?", respuesta: "Funciona igual. Las preguntas te llegan a ti y el libro es el de tu vida." },
      ],
    },
    lema: "Todas las vidas merecen su propio libro.",

    hero: {
      titulo: ["En cada familia hay", "un libro sin escribir."],
      desde: (p) => `Desde ${p} · pago único`,
    },
    verEjemplo: "Hojea un libro de ejemplo antes de comprar",
    como: {
      paso: (n) => `Paso ${n}`,
      pasos: [
        {
          titulo: "Lo apuntas",
          texto:
            "Nos dices su nombre, su WhatsApp y a qué hora prefiere que le escribamos. Le llega un mensaje nuestro contándole de qué se trata, y arranca cuando quiera.",
        },
        {
          titulo: "Solo manda audios",
          texto:
            "Le llega una pregunta por WhatsApp. La contesta con un audio cuando quiere, como hace todos los días, y cuando termina de contar le llega la siguiente. Sin apps, sin nada que instalar ni aprender.",
        },
        {
          titulo: "El biógrafo escribe",
          texto:
            "Con sus respuestas, el biógrafo escribe el libro de su vida. Mientras tanto, desde la página de su historia vas escuchando lo que cuenta.",
        },
      ],
    },
    dudas: {
      hablar: {
        pregunta: "«No le gusta hablar de sí mismo.»",
        texto: "No le pedimos que se describa. Le preguntamos por momentos concretos, y él decide si empieza y cuándo para.",
        temas: ["Su primera casa", "Su primer sueldo", "Un domingo de niño"],
      },
    },
    libro: {
      altPortada: "Portada del libro de ejemplo: El libro de su vida, Osvaldo Toroide",
      mas: (p) => `+ ${p}`,
    },
    voz: {
      texto:
        "El libro viene con sus mejores frases en su voz real. Sus dichos, su manera de empezar las frases, la risa cuando se acuerda de algo. Se escuchan en la web, se reenvían por WhatsApp, y el libro impreso lleva un código QR que las hace sonar.",
      capitulo: "Capítulo 1 · La infancia",
      cita: "«…mi padre plantó el limonero del patio el año que nací. En verano comíamos debajo, y todavía me acuerdo del olor de los limones y de mi madre gritando que nos laváramos las manos.»",
      duracion: "0:42",
      escuchar: "Escuchar el fragmento",
      pausar: "Pausar",
      altContraportada: "Contraportada del libro de ejemplo, con el código QR para escuchar su voz",
    },
    marco: {
      titulo: ["Su libro en la estantería.", "Su foto, a la vista."],
      texto:
        "Un marco negro pequeño, con la foto suya que elijas. Para poner encima de un mueble, junto a su libro, o para regalar a los hermanos.",
      nfcTitulo: "Acerca el móvil al marco y se abre su libro.",
      nfcTexto: "Por dentro lleva un chip que no se ve. Basta con acercar el móvil y se abre su libro, con su voz. Sin apps ni códigos.",
      nota: "Lo añades al comprar o después, desde la página de su historia. Va con el libro impreso.",
      pasos: ["Acercas el móvil al marco", "Se abre su libro", "Escuchas su voz"],
      telefonoQuieto: "Acerca el móvil",
      telefonoLibro: "El libro de Osvaldo",
      altMarco: "Un marco negro pequeño con una foto, sobre un aparador junto a un libro y una lámpara encendida",
    },
    diciembre: {
      regalo: { texto: "Eliges el día en que empieza y te damos una tarjeta para entregárselo." },
      altFoto: "Un abuelo abre una tarjeta de regalo junto al árbol de Navidad",
    },
    faq: {
      titulo: "Lo que suelen preguntarnos.",
      duda: { titulo: "¿Te queda alguna duda?", texto: "Escríbenos y te contesta una persona, no un robot.", boton: "Escribir por WhatsApp" },
      preguntas: [
        {
          pregunta: "¿Mi padre va a saber usarlo?",
          respuesta: "No hay nada que instalar ni que aprender. Le llega un mensaje de WhatsApp y contesta con un audio, como hace todos los días.",
        },
        {
          pregunta: "¿Y si no quiere, o le da vergüenza?",
          respuesta: "Le pedimos permiso antes de empezar la entrevista. Puede parar cuando quiera y retomar cuando quiera.",
        },
        // APROBADO por Naza el 19/10 · tanda 6, texto 8
        { pregunta: "¿Y si no quiere hacerlo?", respuesta: "Te devolvemos todo lo que pagaste. Si empieza y contesta menos de diez preguntas, también te devolvemos todo." },
        {
          pregunta: "¿Quién escucha sus audios?",
          respuesta: "Solo su familia. Los audios son privados, se usan únicamente para su libro, y se pueden borrar todos cuando quiera.",
        },
        {
          pregunta: "¿Y si empieza y no termina?",
          respuesta: "No hay calendario ni prisa. Si un día no contesta, la pregunta lo espera, y cuando retoma, la entrevista sigue donde quedó.",
        },
        {
          pregunta: "¿Cuánto cuesta y cuándo se paga?",
          respuesta:
            "Se paga una sola vez, al comprar, y los precios están a la vista antes de pagar. El libro en PDF con «Su voz» va siempre, y el impreso y los marcos se suman si quieres.",
        },
        {
          pregunta: "¿Se puede tener el libro impreso?",
          respuesta:
            "Sí. Se añade al comprar o después, desde la página de su historia, con el libro ya terminado. Tapa dura, en color, con un código en la contraportada que hace sonar su voz.",
        },
      ],
    },
    sticky: { desde: "desde", conImpreso: "Pago único · Libro impreso + PDF con «Su voz»", sinImpreso: "Pago único · PDF con «Su voz»" },
    direccion: {
      como: {
        bajada: "Lo entrevistamos por WhatsApp, a su ritmo, y con lo que cuenta escribimos su libro. Si sabe mandar un audio, ya sabe hacerlo.",
      },
      libroOtraVez: "Ver otra vez",
      libro: LIBRO_OSVALDO,
    },
  },

  /* ─────────────────────────── Argentina, de vos ─────────────────────────── */
  ar: {
    meta: {
      titulo: "Vitácora Familiar — En cada familia hay un libro sin escribir",
      descripcion:
        "Tu familiar nos cuenta su vida con audios de WhatsApp. Nosotros nos encargamos de escribir su libro y que quede en tu familia para siempre.",
    },
    iniciar: "Iniciar Vitácora",
    inicio: {
      bajada:
        "Tu familiar nos cuenta su vida con audios de WhatsApp. Nosotros nos encargamos de escribir su libro y que quede en tu familia para siempre.",
      comoFunciona: "Cómo funciona ↓",
      ventajas: ["Responde con audios o escribiendo, como se sienta más cómodo", "Sin apps ni contraseñas", "Su libro impreso, en tapa dura", "Sus mejores historias, contadas con su voz y guardadas para siempre"],
      propio: { pregunta: "¿Querés contar tu propia vida?", enlace: "También podés hacer tu libro." },
    },
    queEs: {
      etiqueta: "Qué es Vitácora",
      titulo: "Un regalo para quien cuenta y otro para toda la familia.",
      bajada:
        "Entrevistamos a tu familiar por WhatsApp. Le hacemos preguntas sobre su vida, desde su infancia hasta hoy. Al terminar la entrevista escribimos la historia de su vida. Vitácora es un regalo emotivo, un libro que va a pasar de generación en generación.",
    },
    siguiendo: {
      titulo: "Vos lo vas siguiendo de cerca.",
      pasos: [
        "Escuchás cada audio en cuanto lo manda.",
        "Le sumás preguntas y fotos para su libro.",
        "Lo ves terminado y elegís la tapa antes de imprimirlo.",
      ],
    },
    // PARA NAZA (25/10): el aviso de privacidad, con lo que ya dice la política (§5, §6 y §8).
    privacidad: {
      titulo: "Su historia es de tu familia.",
      texto: "Sabemos que lo que cuenta es personal. Sus audios y su libro solo los ven tu familia y quienes lo escriben. Se guardan en la Unión Europea, no los vendemos, no los usamos para publicidad y no entrenamos ninguna inteligencia artificial con ellos. Los audios originales se borran tres meses después de terminar el libro, o antes si lo pedís.",
      enlace: "Cómo cuidamos sus datos",
    },
    pieTelefono: "Así se ve la página de su historia.",
    funciona: {
      titulo: "Cómo funciona",
      bajada:
        "Entrevistamos a tu familiar por WhatsApp, a su ritmo, y con lo que nos cuenta escribimos el libro de su vida. Si sabe mandar un audio, ya sabe hacerlo.",
      // PARA NAZA (25/10): pasos nuevos de «Cómo funciona».
      pasos: [
        {
          titulo: "¿Para quién es?",
          texto: "Si la Vitácora es para vos, la empezamos ahora mismo. Si es un regalo, podés llevarte la tarjeta de regalo al pagar o dejarnos sus datos para que empecemos su libro el día que nos digas.",
        },
        {
          titulo: "Con audios o escribiendo",
          texto: "Las preguntas le llegan por WhatsApp y nos contesta como más cómodo se sienta, cuando tiene un rato libre. Sin apps ni nada que aprender.",
        },
        {
          titulo: "Escribimos su libro",
          texto: "Con todas las historias que nos cuenta, nuestro biógrafo escribe el libro de su vida con sus propias palabras, como si fuera el autor.",
        },
        {
          titulo: "Cuando llega a casa",
          texto: "Llega el día de tenerlo en casa, para siempre. Si otro familiar quiere su ejemplar, nos pide otra copia y se la mandamos. En la contratapa hay un código QR que abre sus historias contadas con su voz, guardadas para siempre.",
        },
      ],
    },
    carta: {
      frase: "Un día vas a querer preguntarle algo y ya no va a estar para contártelo.",
      // La carta APROBADA por Naza el 14/10, sin cambios.
      texto:
        "Hicimos Vitácora porque no todas las familias tienen la suerte de que los abuelos sigan ahí cuando los nietos crecen. Muchos chicos van a conocer a sus abuelos solo por fotos, sin saber cómo hablaban, qué vivieron ni qué aprendieron. Queremos que eso no se pierda. Que cada nieto, cuando sea grande, pueda abrir un libro y leer quién fue su abuelo, con sus propias palabras.",
      firma: "Los fundadores de Vitácora",
    },
    escuchalo: {
      titulo: "Su voz, guardada en su libro.",
      texto:
        "El libro lleva sus mejores frases con su voz real y su forma de hablar. Las escuchás con el código de la contratapa o desde el celular, cuando quieras.",
      etiqueta: "El campo",
      cita: CITA_CAMPO,
      duracion: "0:30",
    },
    elLibro: {
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
      // PARA NAZA (25/10): título y texto nuevos. En pesos, de PRECIO_MARCO_ARS; sin esa variable, la frase va sin número.
      titulo: "Una foto para sus fanáticos.",
      texto: (p) =>
        `En Vitácora creemos que la forma más linda de celebrar este regalo es compartirlo con la familia. Por eso, para estas fiestas, podés sumar una foto enmarcada para regalarle a cada hermano, hijo o nieto${p ? `, a ${p} cada una` : ""}. Lleva un chip por dentro: acercás el celular y se abre su historia, con su voz.`,
    },
    regalo: {
      titulo: "No le regales la misma camisa de todos los años.",
      texto: "Regalale algo que va a quedar para toda la vida. Elegís el día en que empieza y te damos una tarjeta para entregárselo.",
    },
    preguntas: {
      usarlo: "¿Va a saber usarlo?",
      nuevas: [
        {
          pregunta: "¿Puedo ver el libro antes de que se imprima?",
          respuesta: "Sí. Cuando está terminado lo ves en la página de su historia, elegís la tapa y recién ahí se imprime.",
        },
        { pregunta: "¿Y si quiero hacer mi propio libro?", respuesta: "Funciona igual. Las preguntas te llegan a vos y el libro es el de tu vida." },
      ],
    },
    lema: "Todas las vidas merecen su propio libro.",

    hero: {
      titulo: ["En cada familia hay", "un libro sin escribir."],
      desde: (p) => `Desde ${p} · pago único`,
    },
    verEjemplo: "Hojeá un libro de ejemplo antes de comprar",
    como: {
      paso: (n) => `Paso ${n}`,
      pasos: [
        {
          titulo: "Lo anotás",
          texto:
            "Nos decís su nombre, su WhatsApp y a qué hora prefiere que le escribamos. Le llega un mensaje nuestro contándole de qué se trata, y arranca cuando quiera.",
        },
        {
          titulo: "Solo manda audios",
          texto:
            "Le llega una pregunta por WhatsApp. La contesta con un audio cuando quiere, como hace todos los días, y cuando termina de contar le llega la siguiente. Sin apps, sin nada que instalar ni aprender.",
        },
        {
          titulo: "El biógrafo escribe",
          texto:
            "Con sus respuestas, el biógrafo escribe el libro de su vida. Mientras tanto, desde la página de su historia vas escuchando lo que cuenta.",
        },
      ],
    },
    dudas: {
      hablar: {
        pregunta: "«No le gusta hablar de sí mismo.»",
        texto: "No le pedimos que se describa. Le preguntamos por momentos concretos, y él decide si empieza y cuándo para.",
        temas: ["Su primera casa", "Su primer sueldo", "Un domingo de chico"],
      },
    },
    libro: {
      altPortada: "Tapa del libro de ejemplo: El libro de su vida, Osvaldo Toroide",
      mas: (p) => `+ ${p}`,
    },
    voz: {
      texto:
        "El libro viene con sus mejores frases en su voz real. Sus dichos, su manera de arrancar las frases, la risa cuando se acuerda de algo. Se escuchan en la web, se reenvían por WhatsApp, y el libro impreso lleva un código QR que las hace sonar.",
      capitulo: "Capítulo 1 · La infancia",
      cita: "«…mi papá plantó el limonero del patio el año que nací. En verano comíamos abajo, y todavía me acuerdo del olor de los limones y de mi mamá gritando que nos laváramos las manos.»",
      duracion: "0:42",
      escuchar: "Escuchar el fragmento",
      pausar: "Pausar",
      altContraportada: "Contratapa del libro de ejemplo, con el código QR para escuchar su voz",
    },
    marco: {
      titulo: ["Su libro en la biblioteca.", "Su foto, a la vista."],
      texto:
        "Un marco negro chico, con la foto suya que elijas. Para poner arriba de un mueble, junto a su libro, o para regalarles a los hermanos.",
      nfcTitulo: "Acercá el celular al marco y se abre su libro.",
      nfcTexto: "Por dentro lleva un chip que no se ve. Alcanza con acercar el celular y se abre su libro, con su voz. Sin apps ni códigos.",
      nota: "Lo sumás al comprar o después, desde la página de su historia. Va con el libro impreso.",
      pasos: ["Acercás el celular al marco", "Se abre su libro", "Escuchás su voz"],
      telefonoQuieto: "Acercá el celular",
      telefonoLibro: "El libro de Osvaldo",
      altMarco: "Un marco negro chico con una foto, sobre un aparador junto a un libro y una lámpara prendida",
    },
    diciembre: {
      regalo: { texto: "Elegís el día en que empieza y te damos una tarjeta para dárselo." },
      altFoto: "Un abuelo abre una tarjeta de regalo junto al arbolito de Navidad",
    },
    faq: {
      titulo: "Lo que suelen preguntarnos.",
      duda: { titulo: "¿Te queda alguna duda?", texto: "Escribinos y te contesta una persona, no un robot.", boton: "Escribir por WhatsApp" },
      preguntas: [
        {
          pregunta: "¿Mi papá va a saber usarlo?",
          respuesta: "No hay nada que instalar ni que aprender. Le llega un mensaje de WhatsApp y contesta con un audio, como hace todos los días.",
        },
        {
          pregunta: "¿Y si no quiere, o le da vergüenza?",
          respuesta: "Le pedimos permiso antes de empezar la entrevista. Puede parar cuando quiera y retomar cuando quiera.",
        },
        // APROBADO por Naza el 19/10 · tanda 6, texto 8
        { pregunta: "¿Y si no quiere hacerlo?", respuesta: "Te devolvemos todo lo que pagaste. Si empieza y contesta menos de diez preguntas, también te devolvemos todo." },
        {
          pregunta: "¿Quién escucha sus audios?",
          respuesta: "Solo su familia. Los audios son privados, se usan únicamente para su libro, y se pueden borrar todos cuando quiera.",
        },
        {
          pregunta: "¿Y si empieza y no termina?",
          respuesta: "No hay calendario ni apuro. Si un día no contesta, la pregunta lo espera, y cuando retoma, la entrevista sigue donde quedó.",
        },
        {
          pregunta: "¿Cuánto sale y cuándo se paga?",
          respuesta:
            "Se paga una sola vez, al comprar, y los precios están a la vista antes de pagar. El libro en PDF con «Su voz» va siempre, y el impreso y los marcos se suman si querés.",
        },
        {
          pregunta: "¿Se puede tener el libro impreso?",
          respuesta:
            "Sí. Se suma al comprar o después, desde la página de su historia, con el libro ya terminado. Tapa dura, a color, con un código en la contratapa que hace sonar su voz.",
        },
      ],
    },
    sticky: { desde: "desde", conImpreso: "Pago único · Libro impreso + PDF con «Su voz»", sinImpreso: "Pago único · PDF con «Su voz»" },
    direccion: {
      como: {
        bajada: "Lo entrevistamos por WhatsApp, a su ritmo, y con lo que cuenta escribimos su libro. Si sabe mandar un audio, ya sabe hacerlo.",
      },
      libroOtraVez: "Ver otra vez",
      libro: LIBRO_OSVALDO,
    },
  },

  /* ─────────────────────────── Catalán, de tú ─────────────────────────── */
  // ca: revisado con el corrector de Softcatalà (18/10) (todo este bloque; los textos de la portada
  // nueva, 15/10, los traduje del castellano aprobado y los revisa Imma)
  ca: {
    meta: {
      titulo: "Vitácora Familiar — En cada família hi ha un llibre per escriure",
      descripcion:
        "El teu familiar ens explica la seva vida amb àudios de WhatsApp. Nosaltres ens encarreguem d'escriure el seu llibre i que quedi a la teva família per sempre.",
    },
    iniciar: "Iniciar Vitácora",
    inicio: {
      bajada:
        "El teu familiar ens explica la seva vida amb àudios de WhatsApp. Nosaltres ens encarreguem d'escriure el seu llibre i que quedi a la teva família per sempre.",
      comoFunciona: "Com funciona ↓",
      ventajas: [
        "Respon amb àudios o escrivint, com se senti més còmode",
        "Sense aplicacions ni contrasenyes",
        "El seu llibre imprès, en tapa dura",
        "Les seves millors històries, explicades amb la seva veu i guardades per sempre",
      ],
      propio: { pregunta: "Vols explicar la teva pròpia vida?", enlace: "També pots fer el teu llibre." },
    },
    queEs: {
      etiqueta: "Què és Vitácora",
      titulo: "Un regal per a qui explica i un altre per a tota la família.",
      bajada:
        "Entrevistem el teu familiar per WhatsApp. Li fem preguntes sobre la seva vida, des de la infància fins avui. En acabar l'entrevista escrivim la història de la seva vida. Vitácora és un regal emotiu, un llibre que passarà de generació en generació.",
    },
    siguiendo: {
      titulo: "Tu ho vas seguint de prop.",
      pasos: [
        "Escoltes cada àudio tan bon punt l'envia.",
        "Li afegeixes preguntes i fotos per al seu llibre.",
        "El veus acabat i tries la tapa abans d'imprimir-lo.",
      ],
    },
    // PARA NAZA (25/10): el aviso de privacidad, con lo que ya dice la política (§5, §6 y §8).
    privacidad: {
      titulo: "La seva història és de la teva família.",
      texto: "Sabem que el que explica és personal. Els seus àudios i el seu llibre només els veuen la teva família i qui l'escriu. Es guarden a la Unió Europea, no els venem, no els fem servir per a publicitat i no entrenem cap intel·ligència artificial amb ells. Els àudios originals s'esborren tres mesos després d'acabar el llibre, o abans si ho demanes.",
      enlace: "Com cuidem les seves dades",
    },
    pieTelefono: "Així es veu la pàgina de la seva història.",
    funciona: {
      titulo: "Com funciona",
      bajada:
        "Entrevistem el teu familiar per WhatsApp, al seu ritme, i amb el que ens explica escrivim el llibre de la seva vida. Si sap enviar un àudio, ja sap fer-ho.",
      // PARA NAZA (25/10): pasos nuevos de «Cómo funciona».
      pasos: [
        {
          titulo: "Per a qui és?",
          texto: "Si la Vitácora és per a tu, la comencem ara mateix. Si és un regal, pots endur-te la targeta de regal en pagar o deixar-nos les seves dades perquè comencem el seu llibre el dia que ens diguis.",
        },
        {
          titulo: "Amb àudios o escrivint",
          texto: "Les preguntes li arriben per WhatsApp i ens contesta com més còmode se senti, quan té una estona lliure. Sense aplicacions ni res a aprendre.",
        },
        {
          titulo: "Escrivim el seu llibre",
          texto: "Amb totes les històries que ens explica, el nostre biògraf escriu el llibre de la seva vida amb les seves pròpies paraules, com si en fos l'autor.",
        },
        {
          titulo: "Quan arriba a casa",
          texto: "Arriba el dia de tenir-lo a casa, per sempre. Si un altre familiar en vol un exemplar, ens demana una altra còpia i l'hi enviem. A la contraportada hi ha un codi QR que obre les seves històries explicades amb la seva veu, guardades per sempre.",
        },
      ],
    },
    carta: {
      frase: "Un dia li voldràs preguntar alguna cosa i ja no hi serà per explicar-t'ho.",
      // La carta APROBADA por Naza el 14/10 (su traducción, pendiente de Imma).
      texto:
        "Vam fer Vitácora perquè no totes les famílies tenen la sort que els avis encara hi siguin quan els nets es fan grans. Molts nens coneixeran els seus avis només per fotos, sense saber com parlaven, què van viure ni què van aprendre. Volem que això no es perdi. Que cada net, quan sigui gran, pugui obrir un llibre i llegir qui va ser el seu avi, amb les seves pròpies paraules.",
      firma: "Els fundadors de Vitácora",
    },
    escuchalo: {
      titulo: "La seva veu, guardada al seu llibre.",
      texto:
        "El llibre porta les seves millors frases amb la seva veu real i la seva manera de parlar. Les escoltes amb el codi de la contraportada o des del mòbil, quan vulguis.",
      etiqueta: "El camp",
      cita: CITA_CAMPO,
      duracion: "0:30",
    },
    elLibro: {
      titulo: "Cada vida mereix el seu propi llibre.",
      beneficios: [
        { titulo: "Llegeix-lo", texto: "La seva vida explicada amb les seves paraules, capítol a capítol, amb les seves fotos." },
        { titulo: "Escolta'l", texto: "Les seves millors frases sonen amb la seva veu des del codi de la contraportada." },
        { titulo: "Per sempre", texto: "Tapa dura i la seva foto a la portada, perquè passi de mà en mà a la teva família." },
      ],
      incluye: [
        "L'entrevista sencera per WhatsApp, fins a completar la seva història",
        "La pàgina de la seva història, per escoltar cada àudio",
        "El llibre imprès en tapa dura, amb l'enviament inclòs",
        "El llibre en PDF, amb les seves millors frases amb la seva veu",
      ],
      pagoUnico: "pagament únic, sense subscripcions",
    },
    marcos: {
      // PARA NAZA (25/10): traducción del texto nuevo.
      titulo: "Una foto per als seus fans.",
      texto: () =>
        "A Vitácora creiem que la manera més bonica de celebrar aquest regal és compartir-lo amb la família. Per això, aquest Nadal, pots afegir una foto emmarcada per regalar a cada germà, fill o net, a 19 € cadascuna. Porta un xip a dins: hi apropes el mòbil i s'obre la seva història, amb la seva veu.",
    },
    regalo: {
      titulo: "No li regalis la mateixa camisa de cada any.",
      texto: "Regala-li una cosa que quedarà per a tota la vida. Tries el dia que comença i et donem una targeta per donar-li.",
    },
    preguntas: {
      usarlo: "Sabrà fer-lo servir?",
      nuevas: [
        {
          pregunta: "Puc veure el llibre abans que s'imprimeixi?",
          respuesta: "Sí. Quan està acabat el veus a la pàgina de la seva història, tries la tapa i només llavors s'imprimeix.",
        },
        { pregunta: "I si vull fer el meu propi llibre?", respuesta: "Funciona igual. Les preguntes t'arriben a tu i el llibre és el de la teva vida." },
      ],
    },
    lema: "Totes les vides mereixen el seu propi llibre.",

    hero: {
      titulo: ["En cada família hi ha", "un llibre per escriure."],
      desde: (p) => `Des de ${p} · pagament únic`,
    },
    verEjemplo: "Fulleja un llibre d'exemple abans de comprar",
    como: {
      paso: (n) => `Pas ${n}`,
      pasos: [
        {
          titulo: "L'apuntes",
          texto:
            "Ens dius el seu nom, el seu WhatsApp i a quina hora prefereix que li escrivim. Li arriba un missatge nostre explicant-li de què va, i comença quan vulgui.",
        },
        {
          titulo: "Només envia àudios",
          texto:
            "Li arriba una pregunta per WhatsApp. La contesta amb un àudio quan vol, com fa cada dia, i quan acaba d'explicar li arriba la següent. Sense apps, sense res a instal·lar ni a aprendre.",
        },
        {
          titulo: "El biògraf escriu",
          texto:
            "Amb les seves respostes, el biògraf escriu el llibre de la seva vida. Mentrestant, des de la pàgina de la seva història vas escoltant el que explica.",
        },
      ],
    },
    dudas: {
      hablar: {
        pregunta: "«No li agrada parlar de si mateix.»",
        texto: "No li demanem que es descrigui. Li preguntem per moments concrets, i ell decideix si comença i quan para.",
        temas: ["La seva primera casa", "El seu primer sou", "Un diumenge de petit"],
      },
    },
    libro: {
      altPortada: "Portada del llibre d'exemple: El llibre de la seva vida, Osvaldo Toroide",
      mas: (p) => `+ ${p}`,
    },
    voz: {
      texto:
        "El llibre porta les seves millors frases amb la seva veu real. Les seves dites, la seva manera de començar les frases, el riure quan recorda alguna cosa. S'escolten a la web, es reenvien per WhatsApp, i el llibre imprès porta un codi QR que les fa sonar.",
      capitulo: "Capítol 1 · La infància",
      cita: "«…el meu pare va plantar el llimoner del pati l'any que vaig néixer. A l'estiu menjàvem a sota, i encara recordo l'olor de les llimones i la meva mare cridant que ens rentéssim les mans.»",
      duracion: "0:42",
      escuchar: "Escoltar el fragment",
      pausar: "Aturar",
      altContraportada: "Contraportada del llibre d'exemple, amb el codi QR per escoltar la seva veu",
    },
    marco: {
      titulo: ["El seu llibre a la prestatgeria.", "La seva foto, a la vista."],
      texto:
        "Un marc negre petit, amb la foto seva que triïs. Per posar damunt d'un moble, al costat del seu llibre, o per regalar als germans.",
      nfcTitulo: "Apropa el mòbil al marc i s'obre el seu llibre.",
      nfcTexto: "Per dins porta un xip que no es veu. N'hi ha prou d'apropar-hi el mòbil i s'obre el seu llibre, amb la seva veu. Sense apps ni codis.",
      nota: "L'afegeixes en comprar o després, des de la pàgina de la seva història. Va amb el llibre imprès.",
      pasos: ["Apropes el mòbil al marc", "S'obre el seu llibre", "Escoltes la seva veu"],
      telefonoQuieto: "Apropa el mòbil",
      telefonoLibro: "El llibre d'Osvaldo",
      altMarco: "Un marc negre petit amb una foto, sobre un aparador al costat d'un llibre i un llum encès",
    },
    diciembre: {
      regalo: { texto: "Tries el dia que comença i et donem una targeta per donar-l'hi." },
      altFoto: "Un avi obre una targeta de regal al costat de l'arbre de Nadal",
    },
    faq: {
      titulo: "El que ens solen preguntar.",
      duda: { titulo: "Et queda algun dubte?", texto: "Escriu-nos i et contesta una persona, no un robot.", boton: "Escriure per WhatsApp" },
      preguntas: [
        {
          pregunta: "El meu pare en sabrà?",
          respuesta: "No hi ha res a instal·lar ni a aprendre. Li arriba un missatge de WhatsApp i contesta amb un àudio, com fa cada dia.",
        },
        {
          pregunta: "I si no vol, o li fa vergonya?",
          respuesta: "Li demanem permís abans de començar l'entrevista. Pot parar quan vulgui i reprendre-ho quan vulgui.",
        },
        // PENDIENTE REVISIÓN NATIVA (Imma) · traducción de la tanda 6, texto 8
        { pregunta: "I si no ho vol fer?", respuesta: "Et retornem tot el que vas pagar. Si comença i contesta menys de deu preguntes, també t'ho retornem tot." },
        {
          pregunta: "Qui escolta els seus àudios?",
          respuesta: "Només la seva família. Els àudios són privats, s'utilitzen únicament per al seu llibre, i es poden esborrar tots quan vulgui.",
        },
        {
          pregunta: "I si comença i no acaba?",
          respuesta: "No hi ha calendari ni pressa. Si un dia no contesta, la pregunta l'espera, i quan ho reprèn, l'entrevista continua on s'havia quedat.",
        },
        {
          pregunta: "Quant costa i quan es paga?",
          respuesta:
            "Es paga una sola vegada, en comprar, i els preus són a la vista abans de pagar. El llibre en PDF amb «La seva veu» hi va sempre, i l'imprès i els marcs se sumen si vols.",
        },
        {
          pregunta: "Es pot tenir el llibre imprès?",
          respuesta:
            "Sí. S'afegeix en comprar o després, des de la pàgina de la seva història, amb el llibre ja acabat. Tapa dura, a color, amb un codi a la contraportada que fa sonar la seva veu.",
        },
      ],
    },
    sticky: {
      desde: "des de",
      conImpreso: "Pagament únic · Llibre imprès + PDF amb «La seva veu»",
      sinImpreso: "Pagament únic · PDF amb «La seva veu»",
    },
    direccion: {
      como: {
        bajada: "L'entrevistem per WhatsApp, al seu ritme, i amb el que explica escrivim el seu llibre. Si sap enviar un àudio, ja sap fer-ho.",
      },
      libroOtraVez: "Tornar-ho a veure",
      libro: LIBRO_OSVALDO,
    },
  },
};
