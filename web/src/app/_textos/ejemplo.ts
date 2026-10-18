import type { Textos } from "@/lib/idioma-web";

// Los textos de /ejemplo (rediseño 2026-10, maquetas Ejemplo/EjemploMovil): el
// libro hojeable de Osvaldo, una historia INVENTADA, y la página lo dice dos
// veces (arriba y junto al botón). Respecto de la maqueta: sin «anticipo» ni
// «tras su tercera respuesta» (DECISIONES D4), sin la garantía junto al botón
// (D1), sin el código QR dibujado que invitaba a escanear algo que no suena,
// sin fecha fija en la foto. Capítulos sin amor. Todo listado en
// docs/rediseno-2026-10/fase-1/textos-portada.md.
//
// ca: revisado con el corrector de Softcatalà (18/10)

export type TextosEjemplo = {
  meta: { titulo: string; descripcion: string };
  volver: string;
  etiqueta: string;
  inventada: string;
  titulo: string;
  bajada: string;
  anterior: string;
  siguiente: string;
  /** «2 de 5 · Dedicatoria e índice» */
  posicion: (actual: number, total: number, nombre: string) => string;
  /** Los nombres de los cinco pliegos (escritorio) y de las ocho páginas (teléfono). */
  pliegos: [string, string, string, string, string];
  paginas: [string, string, string, string, string, string, string, string];
  cta: (precio: string) => string;
  nota: string;
  libro: {
    altPortada: string;
    altContraportada: string;
    dedicatoria: [string, string, string];
    firma: string;
    indice: string;
    capitulos: string[];
    frases: string;
    capitulo: string;
    tituloCapitulo: string;
    citaCapitulo: string;
    parrafos: [string, string];
    altFoto: string;
    pieFoto: string;
    voz: string;
    vozTitulo: string;
    vozTexto: string;
    vozDuracion: string;
    vozCita: string;
  };
};

const CAPITULOS_ES = ["La infancia", "Las raíces", "La juventud", "Salir al mundo", "El oficio", "Los hijos", "Las pruebas", "La sabiduría"];

const PARRAFOS_ES: [string, string] = [
  "Mi madre se levantaba antes que el sol. La oía desde la cama. Primero el cerrojo de la puerta del corral, luego la estufa de leña, que tardaba en prender y se quejaba como un viejo. Cuando el olor del café llegaba a la habitación, mi hermano y yo sabíamos que teníamos cinco minutos antes de que nos llamara por segunda vez. A la tercera no llamaba, subía.",
  "Éramos cuatro en una casa de dos habitaciones, en el pueblo, y a mí me parecía un palacio. Tenía un patio con una higuera que daba más sombra que higos, y debajo de esa higuera aprendí casi todo lo que sé. A perder a las cartas, a guardar un secreto y a escuchar a mi abuelo cuando contaba la guerra sin contarla.",
];

export const TEXTOS_EJEMPLO: Textos<TextosEjemplo> = {
  es: {
    meta: {
      titulo: "Un libro de ejemplo",
      descripcion: "Así es por dentro un libro de Vitácora Familiar. Un ejemplo con una historia inventada, para pasar las páginas antes de comprar.",
    },
    volver: "← Volver a la web",
    etiqueta: "Ejemplo · El libro de Osvaldo",
    inventada: "Historia inventada",
    titulo: "Así es su libro por dentro.",
    bajada: "Un libro de ejemplo, con una historia inventada, para que veas cómo queda. Pasa las páginas.",
    anterior: "Página anterior",
    siguiente: "Página siguiente",
    posicion: (a, n, nombre) => `${a} de ${n} · ${nombre}`,
    pliegos: ["Portada", "Dedicatoria e índice", "Capítulo 1", "Su foto y su voz", "Contraportada"],
    paginas: ["Portada", "Dedicatoria", "Índice", "Capítulo 1", "Capítulo 1", "Su foto", "Su voz", "Contraportada"],
    cta: (p) => `Empezar el libro de tu padre · ${p}`,
    nota: "Libro de ejemplo con una historia inventada. El de tu familia se escribe con sus palabras.",
    libro: {
      altPortada: "Portada: El libro de su vida, Osvaldo Toroide",
      altContraportada: "Contraportada del libro de Osvaldo",
      dedicatoria: ["Para mis nietos,", "que todavía no saben", "todo esto."],
      firma: "Osvaldo",
      indice: "Índice",
      capitulos: CAPITULOS_ES,
      frases: "Sus frases de siempre · 95",
      capitulo: "Capítulo 1",
      tituloCapitulo: "La infancia",
      citaCapitulo: "«En casa no sobraba nada, pero nunca faltó la risa.»",
      parrafos: PARRAFOS_ES,
      altFoto: "Osvaldo de joven tocando la guitarra en una calle del pueblo, en blanco y negro",
      pieFoto: "Con la guitarra en la calle de abajo, un verano de juventud. «Tocaba fatal, pero tocaba fuerte.»",
      voz: "Su voz",
      vozTitulo: "Así lo contó él.",
      vozTexto: "Sus mejores frases quedan en su voz real. Se escuchan con el código QR del libro o desde la web.",
      vozDuracion: "3:40",
      vozCita: "«El primer sueldo se lo di entero a mi madre. Me devolvió veinte duros y me dijo: “Para que aprendas a gastarlos”.»",
    },
  },
  ar: {
    meta: {
      titulo: "Un libro de ejemplo",
      descripcion: "Así es por dentro un libro de Vitácora Familiar. Un ejemplo con una historia inventada, para pasar las páginas antes de comprar.",
    },
    volver: "← Volver a la web",
    etiqueta: "Ejemplo · El libro de Osvaldo",
    inventada: "Historia inventada",
    titulo: "Así es su libro por dentro.",
    bajada: "Un libro de ejemplo, con una historia inventada, para que veas cómo queda. Pasá las páginas.",
    anterior: "Página anterior",
    siguiente: "Página siguiente",
    posicion: (a, n, nombre) => `${a} de ${n} · ${nombre}`,
    pliegos: ["Tapa", "Dedicatoria e índice", "Capítulo 1", "Su foto y su voz", "Contratapa"],
    paginas: ["Tapa", "Dedicatoria", "Índice", "Capítulo 1", "Capítulo 1", "Su foto", "Su voz", "Contratapa"],
    cta: (p) => `Empezar el libro de tu papá · ${p}`,
    nota: "Libro de ejemplo con una historia inventada. El de tu familia se escribe con sus palabras.",
    libro: {
      altPortada: "Tapa: El libro de su vida, Osvaldo Toroide",
      altContraportada: "Contratapa del libro de Osvaldo",
      dedicatoria: ["Para mis nietos,", "que todavía no saben", "todo esto."],
      firma: "Osvaldo",
      indice: "Índice",
      capitulos: CAPITULOS_ES,
      frases: "Sus frases de siempre · 95",
      capitulo: "Capítulo 1",
      tituloCapitulo: "La infancia",
      citaCapitulo: "«En casa no sobraba nada, pero nunca faltó la risa.»",
      parrafos: PARRAFOS_ES,
      altFoto: "Osvaldo de joven tocando la guitarra en una calle del pueblo, en blanco y negro",
      pieFoto: "Con la guitarra en la calle de abajo, un verano de juventud. «Tocaba pésimo, pero tocaba fuerte.»",
      voz: "Su voz",
      vozTitulo: "Así lo contó él.",
      vozTexto: "Sus mejores frases quedan en su voz real. Se escuchan con el código QR del libro o desde la web.",
      vozDuracion: "3:40",
      vozCita: "«El primer sueldo se lo di entero a mi madre. Me devolvió unas monedas y me dijo: “Para que aprendas a gastarlas”.»",
    },
  },
  // ca: revisado con el corrector de Softcatalà (18/10)
  ca: {
    meta: {
      titulo: "Un llibre d'exemple",
      descripcion: "Així és per dins un llibre de Vitácora Familiar. Un exemple amb una història inventada, per passar les pàgines abans de comprar.",
    },
    volver: "← Tornar a la web",
    etiqueta: "Exemple · El llibre d'Osvaldo",
    inventada: "Història inventada",
    titulo: "Així és el seu llibre per dins.",
    bajada: "Un llibre d'exemple, amb una història inventada, perquè vegis com queda. Passa les pàgines.",
    anterior: "Pàgina anterior",
    siguiente: "Pàgina següent",
    posicion: (a, n, nombre) => `${a} de ${n} · ${nombre}`,
    pliegos: ["Portada", "Dedicatòria i índex", "Capítol 1", "La seva foto i la seva veu", "Contraportada"],
    paginas: ["Portada", "Dedicatòria", "Índex", "Capítol 1", "Capítol 1", "La seva foto", "La seva veu", "Contraportada"],
    cta: (p) => `Començar el llibre del teu pare · ${p}`,
    nota: "Llibre d'exemple amb una història inventada. El de la teva família s'escriu amb les seves paraules.",
    libro: {
      altPortada: "Portada: El llibre de la seva vida, Osvaldo Toroide",
      altContraportada: "Contraportada del llibre d'Osvaldo",
      dedicatoria: ["Per als meus nets,", "que encara no saben", "tot això."],
      firma: "Osvaldo",
      indice: "Índex",
      capitulos: ["La infància", "Les arrels", "La joventut", "Sortir al món", "L'ofici", "Els fills", "Les proves", "La saviesa"],
      frases: "Les seves frases de sempre · 95",
      capitulo: "Capítol 1",
      tituloCapitulo: "La infància",
      citaCapitulo: "«A casa no sobrava res, però mai no hi va faltar el riure.»",
      parrafos: [
        "La meva mare es llevava abans que el sol. La sentia des del llit. Primer el forrellat de la porta del corral, després l'estufa de llenya, que trigava a encendre's i es queixava com un vell. Quan l'olor del cafè arribava a l'habitació, el meu germà i jo sabíem que teníem cinc minuts abans que ens cridés per segona vegada. A la tercera no cridava, pujava.",
        "Érem quatre en una casa de dues habitacions, al poble, i a mi em semblava un palau. Tenia un pati amb una figuera que feia més ombra que figues, i sota aquella figuera vaig aprendre gairebé tot el que sé. A perdre a les cartes, a guardar un secret i a escoltar el meu avi quan explicava la guerra sense explicar-la.",
      ],
      altFoto: "L'Osvaldo de jove tocant la guitarra en un carrer del poble, en blanc i negre",
      pieFoto: "Amb la guitarra al carrer de baix, un estiu de joventut. «Tocava fatal, però tocava fort.»",
      voz: "La seva veu",
      vozTitulo: "Així ho va explicar ell.",
      vozTexto: "Les seves millors frases queden amb la seva veu real. S'escolten amb el codi QR del llibre o des de la web.",
      vozDuracion: "3:40",
      vozCita: "«El primer sou l'hi vaig donar sencer a la meva mare. Me'n va tornar vint duros i em va dir: “Perquè aprenguis a gastar-los”.»",
    },
  },
};
