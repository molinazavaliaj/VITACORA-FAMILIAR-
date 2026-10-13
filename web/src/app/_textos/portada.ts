import type { Textos } from "@/lib/idioma-web";

// Los textos de la portada (rediseño 2026-10, maquetas Main/Movil + Resto/
// RestoMovil), por idioma. Mandan, en este orden: los aprobados por Naza
// (docs/web-textos-v3/aprobados.md y el POR_TRATO del 13/10 que vivía en
// app/page.tsx), DECISIONES.md y después la maqueta. Lo que no es copia literal
// de un aprobado está listado en docs/rediseno-2026-10/fase-1/textos-portada.md.
//
// Lo que NO va, a propósito (DECISIONES D1 y D4, TEXTOS-Y-REGLAS §1): Kids,
// reseñas de ejemplo, la cita de IFEMA, «Quiénes somos» con huecos, «lo lees
// mientras se escribe», el anticipo, la garantía fuera de la FAQ, «una
// pregunta por día», fechas o pedidos de ejemplo.
//
// es = España, de tú · ar = Argentina, de vos · ca = catalán, de tú.
// ca: PENDIENTE REVISIÓN NATIVA

/** Un trozo de párrafo: texto suelto o un nombre en negrita. */
export type Segmento = string | { fuerte: string };

type Paso = { titulo: string; texto: string };
type Duda = { pregunta: string; respuesta: string };
type TarjetaFoto = { etiqueta: string; texto: string; alt: string };
type Formato = { nota: string; nombre: string; detalle: string };

export type TextosPortada = {
  meta: { titulo: string; descripcion: string };
  hero: {
    titulo: [string, string];
    bajada: string;
    comprar: string;
    verComo: string;
    desde: (precio: string) => string;
  };
  banda: string[];
  fotos: { titulo: [string, string]; texto: string };
  como: { etiqueta: string; titulo: string; bajada: string; paso: (n: number) => string; pasos: [Paso, Paso, Paso] };
  recibe: {
    etiqueta: string;
    titulo: string;
    bajada: string;
    el: { etiqueta: string; titulo: string; items: string[] };
    tu: { etiqueta: string; titulo: string; escuchas: string; pdf: string; impreso: string; impresoYMarco: string };
  };
  paraQuien: {
    etiqueta: string;
    titulo: string;
    bajada: Segmento[];
    padre: TarjetaFoto;
    abuelo: TarjetaFoto;
    viaje: TarjetaFoto;
  };
  dudas: {
    etiqueta: string;
    titulo: string;
    movil: { pregunta: string; texto: string };
    hablar: { pregunta: string; texto: string; temas: string[] };
    medias: { pregunta: string; texto: string };
    verTodas: string;
  };
  conversacion: {
    etiqueta: string;
    titulo: string;
    parrafos: [string, string];
    chat: {
      contacto: string;
      cuenta: string;
      hora: string;
      /** El primer mensaje entero: saludo, nombre y pregunta. */
      mensaje: string;
      duracion: string;
      respuesta: string;
      grabando: string;
      pie: string;
      resumen: string;
    };
  };
  mientras: {
    etiqueta: string;
    titulo: string;
    texto: string;
    fuerte: string;
    cierre: string;
    panel: { etiqueta: string; titulo: string; respuestas: string; voz: string; filas: { texto: string; dur: string }[]; resumen: string };
    mail: { remitente: string; cuando: string; asunto: string; cuerpo: string; enlace: string; resumen: string };
  };
  libro: {
    etiqueta: string;
    titulo: string;
    texto: string;
    capitulos: string[];
    altPortada: string;
    pdf: Formato;
    impreso: Formato;
    marco: Formato;
    mas: (precio: string) => string;
  };
  voz: {
    etiqueta: string;
    titulo: string;
    texto: string;
    capitulo: string;
    cita: string;
    duracion: string;
    escuchar: string;
    pausar: string;
    altContraportada: string;
  };
  marco: {
    etiqueta: string;
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
  diciembre: {
    etiqueta: string;
    titulo: string;
    texto: string;
    casa: { etiqueta: string; titulo: string; texto: string };
    cadaUno: { etiqueta: string; titulo: string; texto: string };
    regalo: { titulo: string; texto: string };
    altFoto: string;
  };
  hereda: { etiqueta: string; titulo: string; texto: string; cierre: string };
  precio: {
    etiqueta: string;
    titulo: string;
    desde: string;
    texto: string;
    siempre: string;
    items: string[];
    marcos: string;
  };
  viaje: {
    etiqueta: string;
    titulo: string;
    texto: string;
    items: [string, string][];
    enlace: string;
    desde: (precio: string) => string;
  };
  elTuyo: { etiqueta: string; titulo: string; texto: string; enlace: string };
  faq: {
    etiqueta: string;
    titulo: string;
    duda: { titulo: string; texto: string; boton: string };
    preguntas: Duda[];
  };
  cierre: { titulo: [string, string]; pie: (precio: string) => string };
  sticky: { desde: string; conImpreso: string; sinImpreso: string };
  comprar: string;
  /**
   * Prototipo de dirección visual (/prueba-direccion). Estado de cada texto
   * (ca, siempre pendiente de revisión nativa):
   * - bajada: APROBADA por Naza el 14/10.
   * - como (título y bajada): APROBADOS por Naza (3.ª vuelta).
   * - dolor.frase: APROBADA por Naza (3.ª vuelta).
   * - dolor.carta y dolor.firma: APROBADAS por Naza el 14/10.
   * - paraQuien: APROBADO por Naza (3.ª vuelta).
   * - libro: lo que va impreso en el libro de ejemplo de Osvaldo (tapa, lomo
   *   y contratapa), copiado del diseño real (vf_book_atlas). El libro de
   *   ejemplo está en castellano en los tres idiomas, como el de /ejemplo.
   */
  direccion: {
    bajada: string;
    como: { titulo: string; bajada: string };
    dolor: { frase: string; carta: string; firma: string };
    paraQuien: string;
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

const CAPITULOS_ES = ["La infancia", "Las raíces", "La juventud", "Salir al mundo", "El oficio", "Los hijos", "Las pruebas", "La sabiduría"];

export const TEXTOS_PORTADA: Textos<TextosPortada> = {
  /* ─────────────────────────── España, de tú ─────────────────────────── */
  es: {
    meta: {
      titulo: "Vitácora Familiar — En cada familia hay un libro sin escribir",
      descripcion:
        "Tu padre lo cuenta con audios de WhatsApp. Nosotros lo convertimos en el libro de su vida, con sus mejores frases en su propia voz.",
    },
    direccion: {
      bajada: "En Vitácora Familiar escribimos biografías. La vida de tu padre, contada por él, en un libro que se queda para siempre en tu familia.",
      como: {
        titulo: "Cómo funciona",
        bajada: "Lo entrevistamos por WhatsApp, a su ritmo, y con lo que cuenta escribimos su libro. Si sabe mandar un audio, ya sabe hacerlo.",
      },
      dolor: {
        frase: "Un día vas a querer preguntarle algo. Y ya no va a estar para contártelo.",
        // Carta y firma APROBADAS por Naza el 14/10.
        carta:
          "Hicimos Vitácora porque no todas las familias tienen la suerte de que los abuelos sigan ahí cuando los nietos crecen. Muchos niños van a conocer a sus abuelos solo por fotos, sin saber cómo hablaban, qué vivieron ni qué aprendieron. Queremos que eso no se pierda. Que cada nieto, cuando sea grande, pueda abrir un libro y leer quién fue su abuelo, con sus propias palabras.",
        firma: "Naza y Joaquín, fundadores de Vitácora",
      },
      paraQuien: "Para las vidas que merecen su propio libro.",
      libro: {
        etiqueta: "El libro de su vida",
        nombre: ["Osvaldo", "Toroide"],
        paraSiempre: "para siempre",
        iniciales: "O · T",
        lomo: "Osvaldo Toroide · El libro de su vida",
        contra: "Estas páginas guardan la vida de Osvaldo Toroide, contada con sus propias palabras: sus mejores historias, tal como él las vivió. En este QR, sus mejores frases.",
        escucha: "Escucha su voz",
        web: "vitacorafamiliar.com",
      },
    },
    hero: {
      titulo: ["En cada familia hay", "un libro sin escribir."],
      bajada: "Tu padre lo cuenta con audios de WhatsApp. Nosotros lo convertimos en el libro de su vida.",
      comprar: "Comprar el libro",
      verComo: "Ver cómo queda",
      desde: (p) => `Desde ${p} · pago único`,
    },
    banda: [
      "Hojea un libro de ejemplo antes de comprar",
      "Pago único, sin suscripciones",
      "Mientras responde, tú vas escuchando su historia desde tu panel.",
      "Sus audios son privados",
    ],
    fotos: {
      titulo: ["Las fotos quedan.", "Los recuerdos se van."],
      texto:
        "Tienes el teléfono lleno de fotos suyas y ni una sola de sus historias. La cara la guarda el móvil. La voz, lo que vivió y cómo lo cuenta, no la guarda nadie.",
    },
    como: {
      etiqueta: "01 · Cómo funciona",
      titulo: "Si sabe mandar un audio, ya sabe hacerlo.",
      bajada: "Él solo tiene que hablar. Del resto nos ocupamos nosotros.",
      paso: (n) => `Paso ${n}`,
      pasos: [
        {
          titulo: "Lo anotas",
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
            "Con sus respuestas, el biógrafo escribe el libro de su vida. Mientras tanto, desde tu panel vas escuchando lo que cuenta.",
        },
      ],
    },
    recibe: {
      etiqueta: "02 · Qué recibe cada uno",
      titulo: "Un regalo para él. Y otro para ti.",
      bajada: "Él tiene a alguien que le pregunta por su vida. Tú te quedas con lo que contó.",
      el: {
        etiqueta: "Lo que recibe él",
        titulo: "Alguien que le pregunta por su vida y le escucha.",
        items: [
          "Preguntas por WhatsApp, de su infancia a hoy",
          "Contesta con audios, a su ritmo y cuando quiere",
          "Su historia escrita con sus palabras, no con las nuestras",
          "Un libro suyo para enseñárselo a quien quiera",
        ],
      },
      tu: {
        etiqueta: "Lo que recibes tú",
        titulo: "Lo que nunca te contó. Y su voz, guardada.",
        escuchas: "Escuchas sus audios mientras cuenta, desde tu panel",
        pdf: "El libro en PDF, con su voz dentro",
        impreso: "Si quieres, impreso en tapa dura",
        impresoYMarco: "Si quieres, impreso en tapa dura y su foto en un marco",
      },
    },
    paraQuien: {
      etiqueta: "03 · Para quién es",
      titulo: "La de tu padre, la de tu abuelo, la de tu abuela.",
      bajada: [
        "Cada vida tiene su libro. ",
        { fuerte: "Vitácora Familiar" },
        ", para padres y abuelos. Y ",
        { fuerte: "Vitácora de Viaje" },
        ", para que cada viaje termine siendo un libro.",
      ],
      padre: {
        etiqueta: "Vitácora Familiar · Para tu padre",
        texto: "Lo que nunca le preguntaste, por fin en un libro.",
        alt: "Un padre y su hijo se ríen en el sofá mientras miran juntos un libro",
      },
      abuelo: {
        etiqueta: "Vitácora Familiar · Para tu abuelo",
        texto: "Este año, algo que no se puede comprar hecho.",
        alt: "Un abuelo abre una tarjeta de regalo junto al árbol de Navidad",
      },
      viaje: {
        etiqueta: "Vitácora de Viaje · Para tu viaje",
        texto: "En cada viaje hay un libro sin escribir.",
        alt: "Una pareja hace fotos desde un mirador sobre los tejados de Lisboa",
      },
    },
    dudas: {
      etiqueta: "04 · Antes de decidir",
      titulo: "Lo que nos preguntan antes de regalarlo.",
      movil: {
        pregunta: "«Mi padre no se aclara con el móvil.»",
        texto: "Si manda audios por WhatsApp, ya sabe. No instala nada ni escribe una línea. Aprieta el micrófono y habla.",
      },
      hablar: {
        pregunta: "«No le gusta hablar de sí mismo.»",
        texto: "No le pedimos que se describa. Le preguntamos por momentos concretos, y él decide si empieza y cuándo para.",
        temas: ["Su primera casa", "Su primer sueldo", "Un domingo de niño"],
      },
      medias: {
        pregunta: "«¿Y si lo deja a medias?»",
        texto: "Si un día no contesta, la pregunta le espera, y cuando retoma, la entrevista sigue donde quedó.",
      },
      verTodas: "Ver todas las preguntas →",
    },
    conversacion: {
      etiqueta: "La conversación",
      titulo: "Solo tiene que mandar un audio.",
      parrafos: [
        "Le escribimos por WhatsApp a la hora que prefiere, y contesta hablando, apretando el micrófono como cuando les manda un audio a sus hijos. Si un día no puede, la pregunta le espera.",
        "Las preguntas van de la infancia a lo que aprendió en la vida, etapa por etapa. Las primeras son fáciles; las últimas, las que nadie se anima a hacer en la mesa.",
      ],
      chat: {
        contacto: "Vitácora",
        cuenta: "cuenta de empresa",
        hora: "Hoy · 9:30",
        mensaje:
          "Buenos días, Roberto. Cuéntame el primer recuerdo que tengas de la casa donde creciste. Un día, qué estabas haciendo, quién andaba por ahí.",
        duracion: "2:14",
        respuesta: "Qué bonito eso del patio con el limonero. Cuando quieras, seguimos con tus padres.",
        grabando: "grabando…",
        pie: "Así le llega una pregunta por WhatsApp.",
        resumen: "Una conversación de WhatsApp: el biógrafo pregunta y Roberto contesta con un audio.",
      },
    },
    mientras: {
      etiqueta: "Mientras cuenta",
      titulo: "No hace falta imaginarlo. Lo vas escuchando.",
      texto: "Desde la primera respuesta, en tu panel aparecen sus audios, uno por uno, con su voz y sus modos de decir.",
      fuerte: "Y cuando termina de contar, el biógrafo escribe su libro.",
      cierre: "No hay que esperar a ciegas. Lo has ido escuchando todo el camino.",
      panel: {
        etiqueta: "Tu panel",
        titulo: "La historia de Roberto",
        respuestas: "11 respuestas",
        voz: "34 min de su voz",
        filas: [
          { texto: "La juventud · el camión de leche", dur: "5:48" },
          { texto: "La juventud · el primer sueldo", dur: "3:40" },
          { texto: "Las raíces · la casa del pueblo", dur: "4:51" },
        ],
        resumen: "El panel: 11 respuestas, 34 minutos de su voz.",
      },
      mail: {
        remitente: "Vitácora",
        cuando: "hoy",
        asunto: "Roberto ya empezó a contar",
        cuerpo: "Sus primeros audios ya están en tu panel. Entra cuando quieras a escucharlo.",
        enlace: "Escuchar →",
        resumen: "El correo que avisa que empezó a contar.",
      },
    },
    libro: {
      etiqueta: "El libro",
      titulo: "Una vida merece un libro.",
      texto:
        "Una vida corriente tratada como una vida extraordinaria, porque lo es. Capítulos, índice y sus frases de siempre en una página aparte.",
      capitulos: CAPITULOS_ES,
      altPortada: "Portada del libro de ejemplo: El libro de su vida, Osvaldo Toroide",
      pdf: {
        nota: "En la nube · va siempre",
        nombre: "El libro en PDF + Su voz",
        detalle: "Escrito con sus palabras. Se lee en la web, capítulo a capítulo, con sus fotos y sus mejores frases en su voz real.",
      },
      impreso: {
        nota: "En la estantería",
        nombre: "El libro impreso",
        detalle: "Tapa dura, con su foto en la portada y un código QR para escuchar su voz. Lleva también el PDF con «Su voz».",
      },
      marco: {
        nota: "Para cada uno",
        nombre: "Marcos con su voz",
        detalle: "Un marco con su foto y un chip. Acercas el móvil y suena su voz. Van con el libro impreso.",
      },
      mas: (p) => `+ ${p}`,
    },
    voz: {
      etiqueta: "Su voz",
      titulo: "Con esto vas a tener la historia de su vida completa.",
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
      etiqueta: "Su foto, en casa",
      titulo: ["Su libro en la estantería.", "Su foto, a la vista."],
      texto:
        "Un marco negro pequeño, con la foto suya que elijas. Para poner encima de un mueble, junto a su libro, o para regalar a los hermanos.",
      nfcTitulo: "Acerca el móvil al marco y se abre su libro.",
      nfcTexto: "Por dentro lleva un chip que no se ve. Basta con acercar el móvil y se abre su libro, con su voz. Sin apps ni códigos.",
      nota: "Lo añades al comprar o después, desde tu panel. Va con el libro impreso.",
      pasos: ["Acercas el móvil al marco", "Se abre su libro", "Escuchas su voz"],
      telefonoQuieto: "Acerca el móvil",
      telefonoLibro: "El libro de Osvaldo",
      altMarco: "Un marco negro pequeño con una foto, sobre un aparador junto a un libro y una lámpara encendida",
    },
    diciembre: {
      etiqueta: "En diciembre",
      titulo: "Este año, regala algo que no está en ninguna tienda.",
      texto:
        "Todos los años el mismo problema y todos los años lo mismo. Este año hay algo que antes no existía, la historia de la familia, y un trozo de esa historia para cada uno.",
      casa: {
        etiqueta: "Para la casa",
        titulo: "Un libro",
        texto: "Impreso, en tapa dura, con su voz en la contraportada. El que queda en la estantería de la familia.",
      },
      cadaUno: { etiqueta: "Para cada uno", titulo: "Un marco", texto: "Para cada primo y cada tío. Acercas el móvil y suena su voz." },
      regalo: {
        titulo: "Es un regalo. Tú eliges cuándo le llega.",
        texto: "Eliges el día en que empieza y te damos una tarjeta para entregárselo.",
      },
      altFoto: "Un abuelo abre una tarjeta de regalo junto al árbol de Navidad",
    },
    hereda: {
      etiqueta: "Lo que se hereda",
      titulo: "Todo lo que aprendió en una vida, guardado para los que vienen.",
      texto:
        "No es nostalgia, es transmisión. Lo que aprendió en toda una vida les sirve a sus nietos, y a los que todavía no han nacido.",
      cierre: "Hay preguntas que un día ya no se pueden hacer.",
    },
    precio: {
      etiqueta: "El precio",
      titulo: "Un solo pago. Sin sorpresas después.",
      desde: "desde",
      texto:
        "Lo que cuesta hoy un libro de preguntas que él tendría que rellenar a mano. Aquí lo cuenta hablando, y le queda su voz grabada.",
      siempre: "Siempre va la entrevista entera del biógrafo, hasta completar su historia, y el panel para escuchar lo que va contando.",
      items: ["El libro en PDF con «Su voz», para leer y escuchar siempre"],
      marcos: "Los marcos con su voz se suman al libro impreso.",
    },
    viaje: {
      etiqueta: "Vitácora de Viaje",
      titulo: "También hay un libro en cada viaje.",
      texto:
        "El mismo biógrafo, pero de viaje contigo. Cada noche te pregunta por el día, guarda las fotos que le mandas con su historia, y al volver tu viaje es un libro.",
      items: [
        ["Cada noche, una pregunta", "Por WhatsApp, cuando el día terminó. Le respondes con un audio, como a un amigo."],
        ["Tus fotos, con su historia", "Le mandas la foto del día y le cuentas qué pasaba. Queda guardada con su historia."],
        ["Al volver, un libro", "Con lo que contaste cada noche y tus fotos, el biógrafo escribe el libro de tu viaje."],
      ],
      enlace: "Conocer la Vitácora de viaje",
      desde: (p) => `desde ${p}`,
    },
    elTuyo: {
      etiqueta: "Otro caso",
      titulo: "¿Y si el libro es el tuyo?",
      texto:
        "Hay quien no lo hace por un padre ni por un abuelo, sino por sus propios hijos. Quiere dejar guardada su vida, de dónde viene, antes de que empiece otra etapa. Funciona igual. Las preguntas te llegan a ti, y el libro es el de tu vida.",
      enlace: "Empezar mi propio libro",
    },
    faq: {
      etiqueta: "Preguntas",
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
        { pregunta: "¿Y si no quiere hacerlo?", respuesta: "Si no quiere hacerlo, te devolvemos el dinero." },
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
            "Se paga una sola vez, al comprar, y los precios están a la vista antes de pagar. El libro en PDF con «Su voz» va siempre, y el impreso y los marcos se suman si quieres.",
        },
        {
          pregunta: "¿Se puede tener el libro impreso?",
          respuesta:
            "Sí. Se suma al comprar o después, desde tu panel, con el libro ya terminado. Tapa dura, a color, con un código en la contratapa que hace sonar su voz.",
        },
      ],
    },
    cierre: { titulo: ["En cada familia hay", "un libro sin escribir."], pie: (p) => `Pago único · desde ${p}.` },
    sticky: { desde: "desde", conImpreso: "Pago único · Libro impreso + PDF con «Su voz»", sinImpreso: "Pago único · PDF con «Su voz»" },
    comprar: "Comprar el libro",
  },

  /* ─────────────────────────── Argentina, de vos ─────────────────────────── */
  ar: {
    meta: {
      titulo: "Vitácora Familiar — En cada familia hay un libro sin escribir",
      descripcion:
        "Tu papá lo cuenta con audios de WhatsApp. Nosotros lo convertimos en el libro de su vida, con sus mejores frases en su propia voz.",
    },
    direccion: {
      bajada: "En Vitácora Familiar escribimos biografías. La vida de tu papá, contada por él, en un libro que se queda para siempre en tu familia.",
      como: {
        titulo: "Cómo funciona",
        bajada: "Lo entrevistamos por WhatsApp, a su ritmo, y con lo que cuenta escribimos su libro. Si sabe mandar un audio, ya sabe hacerlo.",
      },
      dolor: {
        frase: "Un día vas a querer preguntarle algo. Y ya no va a estar para contártelo.",
        // Carta y firma APROBADAS por Naza el 14/10.
        carta:
          "Hicimos Vitácora porque no todas las familias tienen la suerte de que los abuelos sigan ahí cuando los nietos crecen. Muchos chicos van a conocer a sus abuelos solo por fotos, sin saber cómo hablaban, qué vivieron ni qué aprendieron. Queremos que eso no se pierda. Que cada nieto, cuando sea grande, pueda abrir un libro y leer quién fue su abuelo, con sus propias palabras.",
        firma: "Naza y Joaquín, fundadores de Vitácora",
      },
      paraQuien: "Para las vidas que merecen su propio libro.",
      libro: {
        etiqueta: "El libro de su vida",
        nombre: ["Osvaldo", "Toroide"],
        paraSiempre: "para siempre",
        iniciales: "O · T",
        lomo: "Osvaldo Toroide · El libro de su vida",
        contra: "Estas páginas guardan la vida de Osvaldo Toroide, contada con sus propias palabras: sus mejores historias, tal como él las vivió. En este QR, sus mejores frases.",
        escucha: "Escucha su voz",
        web: "vitacorafamiliar.com",
      },
    },
    hero: {
      titulo: ["En cada familia hay", "un libro sin escribir."],
      bajada: "Tu papá lo cuenta con audios de WhatsApp. Nosotros lo convertimos en el libro de su vida.",
      comprar: "Comprar el libro",
      verComo: "Ver cómo queda",
      desde: (p) => `Desde ${p} · pago único`,
    },
    banda: [
      "Hojeá un libro de ejemplo antes de comprar",
      "Pago único, sin suscripciones",
      "Mientras responde, vos vas escuchando su historia desde tu panel.",
      "Sus audios son privados",
    ],
    fotos: {
      titulo: ["Las fotos quedan.", "Los recuerdos se van."],
      texto:
        "Tenés el teléfono lleno de fotos suyas y ni una sola de sus historias. La cara la guarda el celular. La voz, lo que vivió y cómo lo cuenta, no la guarda nadie.",
    },
    como: {
      etiqueta: "01 · Cómo funciona",
      titulo: "Si sabe mandar un audio, ya sabe hacerlo.",
      bajada: "Él solo tiene que hablar. Del resto nos ocupamos nosotros.",
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
            "Con sus respuestas, el biógrafo escribe el libro de su vida. Mientras tanto, desde tu panel vas escuchando lo que cuenta.",
        },
      ],
    },
    recibe: {
      etiqueta: "02 · Qué recibe cada uno",
      titulo: "Un regalo para él. Y otro para vos.",
      bajada: "Él tiene a alguien que le pregunta por su vida. Vos te quedás con lo que contó.",
      el: {
        etiqueta: "Lo que recibe él",
        titulo: "Alguien que le pregunta por su vida y lo escucha.",
        items: [
          "Preguntas por WhatsApp, de su infancia a hoy",
          "Contesta con audios, a su ritmo y cuando quiere",
          "Su historia escrita con sus palabras, no con las nuestras",
          "Un libro suyo para mostrárselo a quien quiera",
        ],
      },
      tu: {
        etiqueta: "Lo que recibís vos",
        titulo: "Lo que nunca te contó. Y su voz, guardada.",
        escuchas: "Escuchás sus audios mientras cuenta, desde tu panel",
        pdf: "El libro en PDF, con su voz adentro",
        impreso: "Si querés, impreso en tapa dura",
        impresoYMarco: "Si querés, impreso en tapa dura y su foto en un marco",
      },
    },
    paraQuien: {
      etiqueta: "03 · Para quién es",
      titulo: "La de tu papá, la de tu abuelo, la de tu abuela.",
      bajada: [
        "Cada vida tiene su libro. ",
        { fuerte: "Vitácora Familiar" },
        ", para padres y abuelos. Y ",
        { fuerte: "Vitácora de Viaje" },
        ", para que cada viaje termine siendo un libro.",
      ],
      padre: {
        etiqueta: "Vitácora Familiar · Para tu papá",
        texto: "Lo que nunca le preguntaste, por fin en un libro.",
        alt: "Un padre y su hijo se ríen en el sillón mientras miran juntos un libro",
      },
      abuelo: {
        etiqueta: "Vitácora Familiar · Para tu abuelo",
        texto: "Este año, algo que no se puede comprar hecho.",
        alt: "Un abuelo abre una tarjeta de regalo junto al arbolito de Navidad",
      },
      viaje: {
        etiqueta: "Vitácora de Viaje · Para tu viaje",
        texto: "En cada viaje hay un libro sin escribir.",
        alt: "Una pareja saca fotos desde un mirador sobre los techos de Lisboa",
      },
    },
    dudas: {
      etiqueta: "04 · Antes de decidir",
      titulo: "Lo que nos preguntan antes de regalarlo.",
      movil: {
        pregunta: "«Mi papá no se lleva bien con el celular.»",
        texto: "Si manda audios por WhatsApp, ya sabe. No instala nada ni escribe una línea. Aprieta el micrófono y habla.",
      },
      hablar: {
        pregunta: "«No le gusta hablar de sí mismo.»",
        texto: "No le pedimos que se describa. Le preguntamos por momentos concretos, y él decide si empieza y cuándo para.",
        temas: ["Su primera casa", "Su primer sueldo", "Un domingo de chico"],
      },
      medias: {
        pregunta: "«¿Y si lo deja por la mitad?»",
        texto: "Si un día no contesta, la pregunta lo espera, y cuando retoma, la entrevista sigue donde quedó.",
      },
      verTodas: "Ver todas las preguntas →",
    },
    conversacion: {
      etiqueta: "La conversación",
      titulo: "Solo tiene que mandar un audio.",
      parrafos: [
        "Le escribimos por WhatsApp a la hora que prefiere, y contesta hablando, apretando el micrófono como cuando les manda un audio a sus hijos. Si un día no puede, la pregunta lo espera.",
        "Las preguntas van de la infancia a lo que aprendió en la vida, etapa por etapa. Las primeras son fáciles; las últimas, las que nadie se anima a hacer en la mesa.",
      ],
      chat: {
        contacto: "Vitácora",
        cuenta: "cuenta de empresa",
        hora: "Hoy · 9:30",
        mensaje:
          "Buen día, Roberto. Contame el primer recuerdo que tengas de la casa donde creciste. Un día, qué estabas haciendo, quién andaba por ahí.",
        duracion: "2:14",
        respuesta: "Qué lindo eso del patio con el limonero. Cuando quieras, seguimos con tus papás.",
        grabando: "grabando…",
        pie: "Así le llega una pregunta por WhatsApp.",
        resumen: "Una conversación de WhatsApp: el biógrafo pregunta y Roberto contesta con un audio.",
      },
    },
    mientras: {
      etiqueta: "Mientras cuenta",
      titulo: "No hace falta imaginarlo. Lo vas escuchando.",
      texto: "Desde la primera respuesta, en tu panel aparecen sus audios, uno por uno, con su voz y sus modos de decir.",
      fuerte: "Y cuando termina de contar, el biógrafo escribe su libro.",
      cierre: "No hay que esperar a ciegas. Lo fuiste escuchando todo el camino.",
      panel: {
        etiqueta: "Tu panel",
        titulo: "La historia de Roberto",
        respuestas: "11 respuestas",
        voz: "34 min de su voz",
        filas: [
          { texto: "La juventud · el camión de la leche", dur: "5:48" },
          { texto: "La juventud · el primer sueldo", dur: "3:40" },
          { texto: "Las raíces · la casa del pueblo", dur: "4:51" },
        ],
        resumen: "El panel: 11 respuestas, 34 minutos de su voz.",
      },
      mail: {
        remitente: "Vitácora",
        cuando: "hoy",
        asunto: "Roberto ya empezó a contar",
        cuerpo: "Sus primeros audios ya están en tu panel. Entrá cuando quieras a escucharlo.",
        enlace: "Escuchar →",
        resumen: "El mail que avisa que empezó a contar.",
      },
    },
    libro: {
      etiqueta: "El libro",
      titulo: "Una vida merece un libro.",
      texto: "Una vida común tratada como una vida extraordinaria, porque lo es. Capítulos, índice y sus frases de siempre en una página aparte.",
      capitulos: CAPITULOS_ES,
      altPortada: "Tapa del libro de ejemplo: El libro de su vida, Osvaldo Toroide",
      pdf: {
        nota: "En la nube · va siempre",
        nombre: "El libro en PDF + Su voz",
        detalle: "Escrito con sus palabras. Se lee en la web, capítulo a capítulo, con sus fotos y sus mejores frases en su voz real.",
      },
      impreso: {
        nota: "En la biblioteca",
        nombre: "El libro impreso",
        detalle: "Tapa dura, con su foto en la tapa y un código QR para escuchar su voz. Lleva también el PDF con «Su voz».",
      },
      marco: {
        nota: "Para cada uno",
        nombre: "Marcos con su voz",
        detalle: "Un marco con su foto y un chip. Acercás el celular y suena su voz. Van con el libro impreso.",
      },
      mas: (p) => `+ ${p}`,
    },
    voz: {
      etiqueta: "Su voz",
      titulo: "Con esto vas a tener la historia de su vida completa.",
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
      etiqueta: "Su foto, en casa",
      titulo: ["Su libro en la biblioteca.", "Su foto, a la vista."],
      texto:
        "Un marco negro chico, con la foto suya que elijas. Para poner arriba de un mueble, junto a su libro, o para regalarles a los hermanos.",
      nfcTitulo: "Acercá el celular al marco y se abre su libro.",
      nfcTexto: "Por dentro lleva un chip que no se ve. Alcanza con acercar el celular y se abre su libro, con su voz. Sin apps ni códigos.",
      nota: "Lo sumás al comprar o después, desde tu panel. Va con el libro impreso.",
      pasos: ["Acercás el celular al marco", "Se abre su libro", "Escuchás su voz"],
      telefonoQuieto: "Acercá el celular",
      telefonoLibro: "El libro de Osvaldo",
      altMarco: "Un marco negro chico con una foto, sobre un aparador junto a un libro y una lámpara prendida",
    },
    diciembre: {
      etiqueta: "En diciembre",
      titulo: "Este año, regalá algo que no está en ninguna tienda.",
      texto:
        "Todos los años el mismo problema y todos los años lo mismo. Este año hay algo que antes no existía, la historia de la familia, y un pedazo de esa historia para cada uno.",
      casa: {
        etiqueta: "Para la casa",
        titulo: "Un libro",
        texto: "Impreso, en tapa dura, con su voz en la contratapa. El que queda en la biblioteca de la familia.",
      },
      cadaUno: { etiqueta: "Para cada uno", titulo: "Un marco", texto: "Para cada primo y cada tío. Se acerca el teléfono y suena su voz." },
      regalo: {
        titulo: "Es un regalo. Vos elegís cuándo le llega.",
        texto: "Elegís el día en que empieza y te damos una tarjeta para dárselo.",
      },
      altFoto: "Un abuelo abre una tarjeta de regalo junto al arbolito de Navidad",
    },
    hereda: {
      etiqueta: "Lo que se hereda",
      titulo: "Todo lo que aprendió en una vida, guardado para los que vienen.",
      texto: "No es nostalgia, es transmisión. Lo que aprendió en toda una vida les sirve a sus nietos, y a los que todavía no nacieron.",
      cierre: "Hay preguntas que un día ya no se pueden hacer.",
    },
    precio: {
      etiqueta: "El precio",
      titulo: "Un solo pago. Sin sorpresas después.",
      desde: "desde",
      texto:
        "Lo que cuesta hoy un libro de preguntas que él tendría que completar a mano. Acá lo cuenta hablando, y le queda su voz grabada.",
      siempre: "Siempre va la entrevista entera del biógrafo, hasta completar su historia, y el panel para escuchar lo que va contando.",
      items: ["El libro en PDF con «Su voz», para leer y escuchar siempre"],
      marcos: "Los marcos con su voz se suman al libro impreso.",
    },
    viaje: {
      etiqueta: "Vitácora de Viaje",
      titulo: "También hay un libro en cada viaje.",
      texto:
        "El mismo biógrafo, pero de viaje con vos. Cada noche te pregunta por el día, guarda las fotos que le mandás con su historia, y al volver tu viaje es un libro.",
      items: [
        ["Cada noche, una pregunta", "Por WhatsApp, cuando el día terminó. Le respondés con un audio, como a un amigo."],
        ["Tus fotos, con su historia", "Le mandás la foto del día y le contás qué pasaba. Queda guardada con su historia."],
        ["Al volver, un libro", "Con lo que contaste cada noche y tus fotos, el biógrafo escribe el libro de tu viaje."],
      ],
      enlace: "Conocer la Vitácora de viaje",
      desde: (p) => `desde ${p}`,
    },
    elTuyo: {
      etiqueta: "Otro caso",
      titulo: "¿Y si el libro es el tuyo?",
      texto:
        "Hay quien no lo hace por un padre ni por un abuelo, sino por sus propios hijos. Quiere dejar guardada su vida, de dónde viene, antes de que empiece otra etapa. Funciona igual. Las preguntas te llegan a vos, y el libro es el de tu vida.",
      enlace: "Empezar mi propio libro",
    },
    faq: {
      etiqueta: "Preguntas",
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
        { pregunta: "¿Y si no quiere hacerlo?", respuesta: "Si no quiere hacerlo, te devolvemos el dinero." },
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
            "Sí. Se suma al comprar o después, desde tu panel, con el libro ya terminado. Tapa dura, a color, con un código en la contratapa que hace sonar su voz.",
        },
      ],
    },
    cierre: { titulo: ["En cada familia hay", "un libro sin escribir."], pie: (p) => `Pago único · desde ${p}.` },
    sticky: { desde: "desde", conImpreso: "Pago único · Libro impreso + PDF con «Su voz»", sinImpreso: "Pago único · PDF con «Su voz»" },
    comprar: "Comprar el libro",
  },

  /* ─────────────────────────── Catalán, de tú ─────────────────────────── */
  // ca: PENDIENTE REVISIÓN NATIVA (todo este bloque)
  ca: {
    meta: {
      titulo: "Vitácora Familiar — En cada família hi ha un llibre per escriure",
      descripcion:
        "El teu pare ho explica amb àudios de WhatsApp. Nosaltres ho convertim en el llibre de la seva vida, amb les seves millors frases amb la seva pròpia veu.",
    },
    // ca: PENDIENTE REVISIÓN NATIVA
    direccion: {
      bajada: "A Vitácora Familiar escrivim biografies. La vida del teu pare, explicada per ell, en un llibre que es queda per sempre a la teva família.",
      como: {
        titulo: "Com funciona",
        bajada: "L'entrevistem per WhatsApp, al seu ritme, i amb el que explica escrivim el seu llibre. Si sap enviar un àudio, ja sap fer-ho.",
      },
      dolor: {
        frase: "Un dia li voldràs preguntar alguna cosa. I ja no hi serà per explicar-t'ho.",
        // Carta y firma APROBADAS por Naza el 14/10.
        carta:
          "Vam fer Vitácora perquè no totes les famílies tenen la sort que els avis encara hi siguin quan els néts es fan grans. Molts nens coneixeran els seus avis només per fotos, sense saber com parlaven, què van viure ni què van aprendre. Volem que això no es perdi. Que cada nét, quan sigui gran, pugui obrir un llibre i llegir qui va ser el seu avi, amb les seves pròpies paraules.",
        firma: "Naza i Joaquín, fundadors de Vitácora",
      },
      paraQuien: "Per a les vides que mereixen el seu propi llibre.",
      libro: {
        etiqueta: "El libro de su vida",
        nombre: ["Osvaldo", "Toroide"],
        paraSiempre: "para siempre",
        iniciales: "O · T",
        lomo: "Osvaldo Toroide · El libro de su vida",
        contra: "Estas páginas guardan la vida de Osvaldo Toroide, contada con sus propias palabras: sus mejores historias, tal como él las vivió. En este QR, sus mejores frases.",
        escucha: "Escucha su voz",
        web: "vitacorafamiliar.com",
      },
    },
    hero: {
      titulo: ["En cada família hi ha", "un llibre per escriure."],
      bajada: "El teu pare ho explica amb àudios de WhatsApp. Nosaltres ho convertim en el llibre de la seva vida.",
      comprar: "Comprar el llibre",
      verComo: "Veure com queda",
      desde: (p) => `Des de ${p} · pagament únic`,
    },
    banda: [
      "Fulleja un llibre d'exemple abans de comprar",
      "Pagament únic, sense subscripcions",
      "Mentre respon, tu vas escoltant la seva història des del teu panell.",
      "Els seus àudios són privats",
    ],
    fotos: {
      titulo: ["Les fotos queden.", "Els records se'n van."],
      texto:
        "Tens el telèfon ple de fotos seves i ni una sola de les seves històries. La cara la guarda el mòbil. La veu, el que va viure i com ho explica, no ho guarda ningú.",
    },
    como: {
      etiqueta: "01 · Com funciona",
      titulo: "Si sap enviar un àudio, ja sap fer-ho.",
      bajada: "Ell només ha de parlar. De la resta ens n'ocupem nosaltres.",
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
            "Amb les seves respostes, el biògraf escriu el llibre de la seva vida. Mentrestant, des del teu panell vas escoltant el que explica.",
        },
      ],
    },
    recibe: {
      etiqueta: "02 · Què rep cadascú",
      titulo: "Un regal per a ell. I un altre per a tu.",
      bajada: "Ell té algú que li pregunta per la seva vida. Tu et quedes amb el que va explicar.",
      el: {
        etiqueta: "El que rep ell",
        titulo: "Algú que li pregunta per la seva vida i l'escolta.",
        items: [
          "Preguntes per WhatsApp, de la seva infància a avui",
          "Contesta amb àudios, al seu ritme i quan vol",
          "La seva història escrita amb les seves paraules, no amb les nostres",
          "Un llibre seu per ensenyar-lo a qui vulgui",
        ],
      },
      tu: {
        etiqueta: "El que reps tu",
        titulo: "El que mai no t'havia explicat. I la seva veu, guardada.",
        escuchas: "Escoltes els seus àudios mentre explica, des del teu panell",
        pdf: "El llibre en PDF, amb la seva veu a dins",
        impreso: "Si vols, imprès en tapa dura",
        impresoYMarco: "Si vols, imprès en tapa dura i la seva foto en un marc",
      },
    },
    paraQuien: {
      etiqueta: "03 · Per a qui és",
      titulo: "La del teu pare, la del teu avi, la de la teva àvia.",
      bajada: [
        "Cada vida té el seu llibre. ",
        { fuerte: "Vitácora Familiar" },
        ", per a pares i avis. I ",
        { fuerte: "Vitácora de Viaje" },
        ", perquè cada viatge acabi sent un llibre.",
      ],
      padre: {
        etiqueta: "Vitácora Familiar · Per al teu pare",
        texto: "El que mai no li vas preguntar, per fi en un llibre.",
        alt: "Un pare i el seu fill riuen al sofà mentre miren junts un llibre",
      },
      abuelo: {
        etiqueta: "Vitácora Familiar · Per al teu avi",
        texto: "Aquest any, una cosa que no es pot comprar feta.",
        alt: "Un avi obre una targeta de regal al costat de l'arbre de Nadal",
      },
      viaje: {
        etiqueta: "Vitácora de Viaje · Per al teu viatge",
        texto: "En cada viatge hi ha un llibre per escriure.",
        alt: "Una parella fa fotos des d'un mirador sobre les teulades de Lisboa",
      },
    },
    dudas: {
      etiqueta: "04 · Abans de decidir",
      titulo: "El que ens pregunten abans de regalar-lo.",
      movil: {
        pregunta: "«El meu pare no se'n surt, amb el mòbil.»",
        texto: "Si envia àudios per WhatsApp, ja en sap. No instal·la res ni escriu ni una línia. Prem el micròfon i parla.",
      },
      hablar: {
        pregunta: "«No li agrada parlar de si mateix.»",
        texto: "No li demanem que es descrigui. Li preguntem per moments concrets, i ell decideix si comença i quan para.",
        temas: ["La seva primera casa", "El seu primer sou", "Un diumenge de petit"],
      },
      medias: {
        pregunta: "«I si ho deixa a mitges?»",
        texto: "Si un dia no contesta, la pregunta l'espera, i quan ho reprèn, l'entrevista continua on s'havia quedat.",
      },
      verTodas: "Veure totes les preguntes →",
    },
    conversacion: {
      etiqueta: "La conversa",
      titulo: "Només ha d'enviar un àudio.",
      parrafos: [
        "Li escrivim per WhatsApp a l'hora que prefereix, i contesta parlant, prement el micròfon com quan envia un àudio als seus fills. Si un dia no pot, la pregunta l'espera.",
        "Les preguntes van de la infància al que ha après a la vida, etapa per etapa. Les primeres són fàcils; les últimes, les que ningú no s'atreveix a fer a taula.",
      ],
      chat: {
        contacto: "Vitácora",
        cuenta: "compte d'empresa",
        hora: "Avui · 9:30",
        mensaje:
          "Bon dia, Roberto. Explica'm el primer record que tinguis de la casa on vas créixer. Un dia, què feies, qui hi havia per allà.",
        duracion: "2:14",
        respuesta: "Que bonic això del pati amb el llimoner. Quan vulguis, seguim amb els teus pares.",
        grabando: "gravant…",
        pie: "Així li arriba una pregunta per WhatsApp.",
        resumen: "Una conversa de WhatsApp: el biògraf pregunta i en Roberto contesta amb un àudio.",
      },
    },
    mientras: {
      etiqueta: "Mentre explica",
      titulo: "No cal imaginar-ho. Ho vas escoltant.",
      texto: "Des de la primera resposta, al teu panell hi apareixen els seus àudios, un per un, amb la seva veu i la seva manera de dir les coses.",
      fuerte: "I quan acaba d'explicar, el biògraf escriu el seu llibre.",
      cierre: "No cal esperar a cegues. L'has anat escoltant tot el camí.",
      panel: {
        etiqueta: "El teu panell",
        titulo: "La història d'en Roberto",
        respuestas: "11 respostes",
        voz: "34 min de la seva veu",
        filas: [
          { texto: "La joventut · el camió de la llet", dur: "5:48" },
          { texto: "La joventut · el primer sou", dur: "3:40" },
          { texto: "Les arrels · la casa del poble", dur: "4:51" },
        ],
        resumen: "El panell: 11 respostes, 34 minuts de la seva veu.",
      },
      mail: {
        remitente: "Vitácora",
        cuando: "avui",
        asunto: "En Roberto ja ha començat a explicar",
        cuerpo: "Els seus primers àudios ja són al teu panell. Entra-hi quan vulguis per escoltar-lo.",
        enlace: "Escoltar →",
        resumen: "El correu que avisa que ha començat a explicar.",
      },
    },
    libro: {
      etiqueta: "El llibre",
      titulo: "Una vida es mereix un llibre.",
      texto:
        "Una vida corrent tractada com una vida extraordinària, perquè ho és. Capítols, índex i les seves frases de sempre en una pàgina a part.",
      capitulos: ["La infància", "Les arrels", "La joventut", "Sortir al món", "L'ofici", "Els fills", "Les proves", "La saviesa"],
      altPortada: "Portada del llibre d'exemple: El llibre de la seva vida, Osvaldo Toroide",
      pdf: {
        nota: "Al núvol · sempre inclòs",
        nombre: "El llibre en PDF + La seva veu",
        detalle:
          "Escrit amb les seves paraules. Es llegeix a la web, capítol a capítol, amb les seves fotos i les seves millors frases amb la seva veu real.",
      },
      impreso: {
        nota: "A la prestatgeria",
        nombre: "El llibre imprès",
        detalle: "Tapa dura, amb la seva foto a la portada i un codi QR per escoltar la seva veu. Inclou també el PDF amb «La seva veu».",
      },
      marco: {
        nota: "Per a cadascú",
        nombre: "Marcs amb la seva veu",
        detalle: "Un marc amb la seva foto i un xip. Hi apropes el mòbil i sona la seva veu. Van amb el llibre imprès.",
      },
      mas: (p) => `+ ${p}`,
    },
    voz: {
      etiqueta: "La seva veu",
      titulo: "Amb això tindràs la història de la seva vida completa.",
      texto:
        "El llibre porta les seves millors frases amb la seva veu real. Les seves dites, la seva manera de començar les frases, el riure quan recorda alguna cosa. S'escolten a la web, es reenvien per WhatsApp, i el llibre imprès porta un codi QR que les fa sonar.",
      capitulo: "Capítol 1 · La infància",
      cita: "«…el meu pare va plantar el llimoner del pati l'any que vaig néixer. A l'estiu menjàvem a sota, i encara recordo l'olor de les llimones i la meva mare cridant que ens rentéssim les mans.»",
      duracion: "0:42",
      escuchar: "Escoltar el fragment",
      pausar: "Pausar",
      altContraportada: "Contraportada del llibre d'exemple, amb el codi QR per escoltar la seva veu",
    },
    marco: {
      etiqueta: "La seva foto, a casa",
      titulo: ["El seu llibre a la prestatgeria.", "La seva foto, a la vista."],
      texto:
        "Un marc negre petit, amb la foto seva que triïs. Per posar damunt d'un moble, al costat del seu llibre, o per regalar als germans.",
      nfcTitulo: "Apropa el mòbil al marc i s'obre el seu llibre.",
      nfcTexto: "Per dins porta un xip que no es veu. N'hi ha prou d'apropar-hi el mòbil i s'obre el seu llibre, amb la seva veu. Sense apps ni codis.",
      nota: "L'afegeixes en comprar o després, des del teu panell. Va amb el llibre imprès.",
      pasos: ["Apropes el mòbil al marc", "S'obre el seu llibre", "Escoltes la seva veu"],
      telefonoQuieto: "Apropa el mòbil",
      telefonoLibro: "El llibre d'Osvaldo",
      altMarco: "Un marc negre petit amb una foto, sobre un aparador al costat d'un llibre i un llum encès",
    },
    diciembre: {
      etiqueta: "Al desembre",
      titulo: "Aquest any, regala una cosa que no és a cap botiga.",
      texto:
        "Cada any el mateix problema i cada any el mateix. Aquest any hi ha una cosa que abans no existia, la història de la família, i un tros d'aquesta història per a cadascú.",
      casa: {
        etiqueta: "Per a casa",
        titulo: "Un llibre",
        texto: "Imprès, en tapa dura, amb la seva veu a la contraportada. El que queda a la prestatgeria de la família.",
      },
      cadaUno: { etiqueta: "Per a cadascú", titulo: "Un marc", texto: "Per a cada cosí i cada oncle. Hi apropes el mòbil i sona la seva veu." },
      regalo: {
        titulo: "És un regal. Tu tries quan li arriba.",
        texto: "Tries el dia que comença i et donem una targeta per donar-l'hi.",
      },
      altFoto: "Un avi obre una targeta de regal al costat de l'arbre de Nadal",
    },
    hereda: {
      etiqueta: "El que s'hereta",
      titulo: "Tot el que va aprendre en una vida, guardat per als que vénen.",
      texto:
        "No és nostàlgia, és transmissió. El que va aprendre en tota una vida els serveix als seus néts, i als que encara no han nascut.",
      cierre: "Hi ha preguntes que un dia ja no es poden fer.",
    },
    precio: {
      etiqueta: "El preu",
      titulo: "Un sol pagament. Sense sorpreses després.",
      desde: "des de",
      texto:
        "El que costa avui un llibre de preguntes que ell hauria d'omplir a mà. Aquí ho explica parlant, i li queda la veu gravada.",
      siempre: "Sempre hi ha l'entrevista sencera del biògraf, fins a completar la seva història, i el panell per escoltar el que va explicant.",
      items: ["El llibre en PDF amb «La seva veu», per llegir i escoltar sempre"],
      marcos: "Els marcs amb la seva veu se sumen al llibre imprès.",
    },
    viaje: {
      etiqueta: "Vitácora de Viaje",
      titulo: "També hi ha un llibre en cada viatge.",
      texto:
        "El mateix biògraf, però de viatge amb tu. Cada nit et pregunta pel dia, guarda les fotos que li envies amb la seva història, i en tornar el teu viatge és un llibre.",
      items: [
        ["Cada nit, una pregunta", "Per WhatsApp, quan el dia s'ha acabat. Li respons amb un àudio, com a un amic."],
        ["Les teves fotos, amb la seva història", "Li envies la foto del dia i li expliques què passava. Queda guardada amb la seva història."],
        ["En tornar, un llibre", "Amb el que vas explicar cada nit i les teves fotos, el biògraf escriu el llibre del teu viatge."],
      ],
      enlace: "Conèixer la Vitácora de Viaje",
      desde: (p) => `des de ${p}`,
    },
    elTuyo: {
      etiqueta: "Un altre cas",
      titulo: "I si el llibre és el teu?",
      texto:
        "Hi ha qui no ho fa per un pare ni per un avi, sinó pels seus propis fills. Vol deixar guardada la seva vida, d'on ve, abans que comenci una altra etapa. Funciona igual. Les preguntes t'arriben a tu, i el llibre és el de la teva vida.",
      enlace: "Començar el meu propi llibre",
    },
    faq: {
      etiqueta: "Preguntes",
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
        { pregunta: "I si no ho vol fer?", respuesta: "Si no ho vol fer, et tornem els diners." },
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
            "Sí. S'afegeix en comprar o després, des del teu panell, amb el llibre ja acabat. Tapa dura, a color, amb un codi a la contraportada que fa sonar la seva veu.",
        },
      ],
    },
    cierre: { titulo: ["En cada família hi ha", "un llibre per escriure."], pie: (p) => `Pagament únic · des de ${p}.` },
    sticky: {
      desde: "des de",
      conImpreso: "Pagament únic · Llibre imprès + PDF amb «La seva veu»",
      sinImpreso: "Pagament únic · PDF amb «La seva veu»",
    },
    comprar: "Comprar el llibre",
  },
};
