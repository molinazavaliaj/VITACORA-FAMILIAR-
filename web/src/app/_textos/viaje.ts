import type { Textos } from "@/lib/idioma-web";

// Los textos de /viaje, /ca/viaje y /ar/viaje (rediseño 2026-10, fase 4,
// maquetas Viaje/ViajeMovil pasadas a la dirección «la web es un libro»).
//
// Describen el Viaje que reciben HOY los clientes (el V1: etapas por ciudad,
// una pregunta por día, el libro en la web), no el V2, que está apagado para
// nuevos (aprobados.md, tanda de Viaje del 11/10). Por eso NO va nada de la
// maqueta que es del V2 o que no está decidido: «cada noche os escribimos»
// (PENDIENTES B24: sale también de la versión ar, igual que en la compra de
// Viaje), «podemos contestar los dos», «unos 9 días», reseñas, el popup.
//
// es = España: de vosotros a los que viajan, de tú a quien paga. ar = de vos,
// como hoy (lo de /viaje que ya existía va igual salvo «cada noche»). ca = de
// vosaltres a los que viajan, de tú a quien paga.
//
// Ojo, es y ca: el bot de Viaje V1 escribe en castellano rioplatense («contame»,
// «mandame») también a quien está en España. Por eso «¿Me trata de vos?» solo
// va en ar y la página de España no promete ningún trato (PENDIENTES, fase 4).
// En ca se dice que escribe en castellano.
//
// Todo lo que no es copia literal de un aprobado está en
// docs/rediseno-2026-10/fase-4/textos.md.
// ca: PENDIENTE REVISIÓN NATIVA

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
  como: { titulo: string; pasos: [Paso, Paso, Paso] };
  fotos: [string, string];
  precioBloque: { titulo: string; texto: string; nota: string };
  faq: { titulo: string; preguntas: Duda[] };
  familiar: string;
};

export const TEXTOS_VIAJE: Textos<TextosViajePagina> = {
  /* ─────────── España: vosotros a los que viajan, tú a quien paga ─────────── */
  es: {
    meta: {
      titulo: "Vitácora de Viaje — En cada viaje hay un libro sin escribir",
      descripcion: "Un biógrafo os acompaña por WhatsApp durante el viaje, guarda vuestras fotos con su historia y, al volver, vuestro viaje es un libro.",
    },
    etiqueta: "Vitácora de Viaje",
    titulo: ["En cada viaje hay", "un libro sin escribir."],
    bajada:
      "Un biógrafo que viaja con vosotros por WhatsApp. Os pregunta por el día, guarda vuestras fotos con su historia y, al volver, vuestro viaje es un libro. Cada ciudad, un capítulo.",
    comprar: "Empezar el libro del viaje",
    precio: (p) => `${p} · el viaje entero`,
    proximamente: "Próximamente",
    altHotel: "Una mujer graba un audio sentada en la cama de un hotel, con la maleta abierta y los tejados de Lisboa por la ventana",
    altLibro: "El libro de un viaje a Lisboa y Oporto sobre una mesa, junto a una vela",
    como: {
      titulo: "Cómo funciona.",
      pasos: [
        {
          titulo: "Os pregunta por el día",
          texto:
            "Cuando el día ha terminado, vuestro biógrafo os escribe por WhatsApp. Lo mejor del día, alguien que conocisteis, lo que salió distinto del plan. Le respondéis con un audio, como a un amigo.",
        },
        {
          titulo: "Le mandáis la foto del día",
          texto:
            "Una foto y qué estaba pasando cuando la hicisteis. Queda guardada en su etapa, con vuestra historia al lado. Podéis mandar más cuando queráis.",
        },
        {
          titulo: "Al volver, vuestro viaje es un libro",
          texto: "Cada ciudad, un capítulo. Se lee y se escucha en la web, y tenéis un enlace para compartirlo con vuestra gente.",
        },
      ],
    },
    fotos: ["Las fotos quedan.", "Lo que vivisteis, también."],
    precioBloque: {
      titulo: "Un precio por viaje, no por día.",
      texto:
        "Lo pagas una vez, antes de salir. Incluye el viaje entero, vuestras fotos, el libro para leer y escuchar en la web y el enlace para compartirlo. El impreso y el marco se suman si queréis.",
      nota: "Pago único, sin suscripciones",
    },
    faq: {
      titulo: "Preguntas que nos hacen.",
      preguntas: [
        {
          pregunta: "¿Y si todavía no tenemos todas las fechas?",
          respuesta: "Ponéis lo que sabéis. Las etapas sin fecha se completan después desde tu panel, y si aparece una ciudad nueva, se añade ahí.",
        },
        {
          pregunta: "¿Cuántas fotos podemos mandar?",
          respuesta: "Las que queráis, por WhatsApp, cuando queráis. Para el libro impreso, al volver os pedimos las mejores en su tamaño original.",
        },
        {
          pregunta: "¿Cuándo llega el libro?",
          respuesta:
            "Cuando volvéis, vuestro biógrafo os hace una última pregunta, por si faltó algo, y con eso escribe el libro. Lo leéis en la web a los pocos días.",
        },
        { pregunta: "¿Y si el viaje se cancela?", respuesta: "Si el viaje se cancela, te devolvemos el dinero." },
      ],
    },
    familiar: "¿Buscas el libro de una vida? Vitácora Familiar →",
  },

  /* ─────────────────────────── Argentina, de vos ─────────────────────────── */
  ar: {
    meta: {
      titulo: "Vitácora de Viaje — En cada viaje hay un libro sin escribir",
      descripcion: "Tu biógrafo te acompaña por WhatsApp durante el viaje, guarda tus fotos con su historia y, al volver, tu viaje es un libro.",
    },
    etiqueta: "Vitácora de Viaje",
    titulo: ["En cada viaje hay", "un libro sin escribir."],
    bajada:
      "Un biógrafo que viaja con vos por WhatsApp. Te pregunta por el día, guarda tus fotos con su historia, y al volver, tu viaje es un libro. Cada ciudad, un capítulo.",
    comprar: "Empezar mi Vitácora de viaje",
    precio: (p) => `${p} · el viaje entero`,
    proximamente: "Próximamente",
    altHotel: "Una mujer graba un audio sentada en la cama de un hotel, con la valija abierta y los techos de Lisboa por la ventana",
    altLibro: "El libro de un viaje a Lisboa y Oporto sobre una mesa, junto a una vela",
    como: {
      titulo: "Cómo funciona.",
      pasos: [
        {
          titulo: "Te pregunta por el día",
          texto:
            "Cuando el día terminó, tu biógrafo te escribe por WhatsApp. Lo mejor del día, alguien que conociste, lo que salió distinto del plan. Le respondés con un audio, como a un amigo.",
        },
        {
          titulo: "Le mandás la foto del día",
          texto:
            "Una foto y qué estaba pasando cuando la sacaste. Queda guardada en su etapa, con tu historia al lado. Podés mandar más cuando quieras.",
        },
        {
          titulo: "Al volver, tu viaje es un libro",
          texto: "Cada ciudad, un capítulo. Se lee y se escucha en la web, y tenés un link para compartirlo con tu gente.",
        },
      ],
    },
    fotos: ["Las fotos quedan.", "Lo que viviste, también."],
    precioBloque: {
      titulo: "Un precio por viaje, no por día.",
      texto:
        "Lo pagás una vez, antes de salir. Incluye el viaje entero, tus fotos, el libro para leer y escuchar en la web, y el link para compartirlo. El impreso y el marco se suman si querés.",
      nota: "Pago único, sin suscripciones",
    },
    faq: {
      titulo: "Preguntas que nos hacen.",
      preguntas: [
        {
          pregunta: "¿Y si todavía no tengo todas las fechas?",
          respuesta:
            "Cargás lo que sabés. Las etapas sin fecha se completan después desde tu panel, y si aparece una ciudad nueva la agregás ahí.",
        },
        {
          pregunta: "¿Cuántas fotos puedo mandar?",
          respuesta: "Las que quieras, por WhatsApp, cuando quieras. Para el libro impreso, al volver te pedimos las mejores en su tamaño original.",
        },
        // Aprobado por Naza el 11/10 (tanda de Viaje, #2).
        {
          pregunta: "¿Me trata de vos?",
          respuesta: "Sí. Es tu biógrafo: te habla como te hablaría un amigo que viaja con vos. En castellano.",
        },
        {
          pregunta: "¿Cuándo llega el libro?",
          respuesta:
            "Cuando volvés, tu biógrafo te hace una última pregunta, por si faltó algo, y con eso escribe el libro. Lo leés en la web a los pocos días.",
        },
        { pregunta: "¿Y si el viaje se cancela?", respuesta: "Si el viaje se cancela, te devolvemos el dinero." },
      ],
    },
    familiar: "¿Buscás el libro de una vida? Vitácora Familiar →",
  },

  /* ─────────── Catalán: vosaltres a los que viajan, tu a quien paga ─────────── */
  // ca: PENDIENTE REVISIÓN NATIVA
  ca: {
    meta: {
      titulo: "Vitácora de Viatge — A cada viatge hi ha un llibre per escriure",
      descripcion: "Un biògraf us acompanya per WhatsApp durant el viatge, guarda les vostres fotos amb la seva història i, en tornar, el vostre viatge és un llibre.",
    },
    etiqueta: "Vitácora de Viatge",
    titulo: ["A cada viatge hi ha", "un llibre per escriure."],
    bajada:
      "Un biògraf que viatja amb vosaltres per WhatsApp. Us pregunta pel dia, guarda les vostres fotos amb la seva història i, en tornar, el vostre viatge és un llibre. Cada ciutat, un capítol.",
    comprar: "Començar el llibre del viatge",
    precio: (p) => `${p} · el viatge sencer`,
    proximamente: "Aviat",
    altHotel: "Una dona grava un àudio asseguda al llit d'un hotel, amb la maleta oberta i les teulades de Lisboa a la finestra",
    altLibro: "El llibre d'un viatge a Lisboa i Porto sobre una taula, al costat d'una espelma",
    como: {
      titulo: "Com funciona.",
      pasos: [
        {
          titulo: "Us pregunta pel dia",
          texto:
            "Quan el dia s'ha acabat, el vostre biògraf us escriu per WhatsApp. El millor del dia, algú que heu conegut, el que ha sortit diferent del pla. Li responeu amb un àudio, com a un amic.",
        },
        {
          titulo: "Li envieu la foto del dia",
          texto:
            "Una foto i què passava quan la vau fer. Queda guardada a la seva etapa, amb la vostra història al costat. En podeu enviar més quan vulgueu.",
        },
        {
          titulo: "En tornar, el vostre viatge és un llibre",
          texto: "Cada ciutat, un capítol. Es llegeix i s'escolta al web, i teniu un enllaç per compartir-lo amb la vostra gent.",
        },
      ],
    },
    fotos: ["Les fotos queden.", "El que heu viscut, també."],
    precioBloque: {
      titulo: "Un preu per viatge, no per dia.",
      texto:
        "El pagues una vegada, abans de sortir. Inclou el viatge sencer, les vostres fotos, el llibre per llegir i escoltar al web i l'enllaç per compartir-lo. L'imprès i el marc s'hi sumen si voleu.",
      nota: "Pagament únic, sense subscripcions",
    },
    faq: {
      titulo: "Preguntes que ens fan.",
      preguntas: [
        {
          pregunta: "I si encara no tenim totes les dates?",
          respuesta: "Hi poseu el que sabeu. Les etapes sense data es completen després des del teu panell, i si apareix una ciutat nova, s'hi afegeix.",
        },
        {
          pregunta: "Quantes fotos podem enviar?",
          respuesta: "Les que vulgueu, per WhatsApp, quan vulgueu. Per al llibre imprès, en tornar us demanem les millors a la seva mida original.",
        },
        { pregunta: "En quina llengua us escriu?", respuesta: "En castellà. El biògraf de viatge encara no escriu en català." },
        {
          pregunta: "Quan arriba el llibre?",
          respuesta:
            "Quan torneu, el vostre biògraf us fa una última pregunta, per si hi falta alguna cosa, i amb això escriu el llibre. El llegiu al web al cap de pocs dies.",
        },
        { pregunta: "I si el viatge es cancel·la?", respuesta: "Si el viatge es cancel·la, et retornem els diners." },
      ],
    },
    familiar: "Busques el llibre d'una vida? Vitácora Familiar →",
  },
};
