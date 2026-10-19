import type { Textos } from "@/lib/idioma-web";
import type { TipoEvento } from "@/lib/eventos";

// Los textos de /eventos, Vitácora Eventos (17/10): vamos al evento,
// entrevistamos a los invitados y hacemos el libro impreso. No se vende en la
// web: es un «contáctanos», el pedido llega por mail a los socios. Numerados
// para aprobar en docs/rediseno-2026-10/eventos/textos.md.
//
// Lo que NO dice, a propósito, porque no está decidido: precio, plazos,
// cuántos invitados como mínimo, en qué ciudades, si va una persona o se graba
// por WhatsApp.
//
// ca: revisado con el corrector de Softcatalà (18/10)

export type TextosEventos = {
  /** #1 */
  meta: { titulo: string; descripcion: string };
  /** #2 */
  etiqueta: string;
  /** #3 (dos líneas) */
  titulo: readonly [string, string];
  /** #4 */
  bajada: string;
  /** #5 */
  irAlFormulario: string;
  /** #5b el segundo botón del inicio */
  verComo: string;
  /** #5c las cuatro líneas con tilde del inicio */
  ventajas: readonly string[];
  /** #5d qué es, en la hoja de papel */
  queEs: { etiqueta: string; titulo: string; bajada: string; altFoto: string };
  /** #6 a #9 */
  como: { titulo: string; bajada: string; paso: string; pasos: readonly { titulo: string; texto: string }[] };
  /** #10 y #11 */
  tipos: { titulo: string; pie: string; altFoto: string };
  /** #12 (los nombres de cada tipo, también en el formulario) */
  tipo: Record<TipoEvento, string>;
  /** #13 a #22 */
  formulario: {
    titulo: string;
    bajada: string;
    nombre: string;
    email: string;
    telefono: string;
    tipo: string;
    elegir: string;
    fecha: string;
    fechaPista: string;
    lugar: string;
    invitados: string;
    invitadosPista: string;
    mensaje: string;
    mensajePista: string;
    enviar: string;
    enviando: string;
    privacidad: string;
    privacidadEnlace: string;
    whatsapp: string;
  };
  /** #23 a #26 */
  errores: { faltan: string; email: string; envio: (correo: string) => string };
  /** #27 */
  gracias: { titulo: string; texto: string };
};

export const TEXTOS_EVENTOS: Textos<TextosEventos> = {
  es: {
    meta: {
      titulo: "Vitácora Eventos",
      descripcion: "Vamos a tu evento, entrevistamos a tus invitados y hacemos el libro impreso de ese día.",
    },
    etiqueta: "Vitácora Eventos",
    titulo: ["Tu evento,", "contado por quienes estuvieron."],
    bajada:
      "Vamos a tu boda, tu cumpleaños o tu fiesta. Entrevistamos a tus invitados y con lo que cuentan hacemos el libro impreso de ese día.",
    irAlFormulario: "Cuéntanos tu evento",
    verComo: "Cómo funciona ↓",
    ventajas: ["Vamos nosotros a tu evento", "Tus invitados solo hablan", "Un libro impreso con sus palabras", "Para cualquier celebración"],
    queEs: {
      etiqueta: "Qué es Vitácora Eventos",
      titulo: "Lo que tus invitados dicen ese día, en un libro.",
      bajada: "Una fiesta pasa rápido y casi nada queda escrito. Escuchamos a quienes estuvieron y guardamos sus palabras en un libro para ti.",
      altFoto: "Un invitado cuenta un recuerdo en el rincón de Vitácora durante una boda.",
    },
    como: {
      titulo: "Cómo funciona",
      bajada: "Tú nos cuentas el evento, nosotros escuchamos a tus invitados y escribimos el libro.",
      paso: "Paso",
      pasos: [
        { titulo: "Nos cuentas tu evento", texto: "Qué celebras, cuándo y dónde. Lo hablamos contigo y lo preparamos a tu medida." },
        {
          titulo: "Vamos y escuchamos",
          texto: "El día del evento entrevistamos a tus invitados. Cada uno cuenta un recuerdo, una anécdota o lo que te quiere decir.",
        },
        { titulo: "Te llega el libro", texto: "Con sus palabras escribimos el libro de tu evento y te lo entregamos impreso." },
      ],
    },
    tipos: { titulo: "Para cualquier celebración", pie: "Si lo tuyo no está en la lista, cuéntanoslo igual.", altFoto: "La carpa negra de Vitácora en una boda, con una entrevista adentro." },
    tipo: {
      boda: "Bodas",
      cumpleanos: "Cumpleaños",
      aniversario: "Aniversarios",
      despedida: "Despedidas y jubilaciones",
      show: "Shows y conciertos",
      empresa: "Eventos de empresa",
      otro: "Otro",
    },
    formulario: {
      titulo: "Cuéntanos tu evento",
      bajada: "Déjanos tus datos y te escribimos para prepararlo juntos.",
      nombre: "Tu nombre",
      email: "Tu email",
      telefono: "Teléfono (si quieres)",
      tipo: "Qué celebras",
      elegir: "Elige una opción",
      fecha: "Fecha",
      fechaPista: "Por ejemplo, junio de 2027",
      lugar: "Ciudad",
      invitados: "Invitados, más o menos",
      invitadosPista: "Por ejemplo, 80",
      mensaje: "Algo más que quieras contarnos",
      mensajePista: "Quién celebra, qué te gustaría que tenga el libro…",
      enviar: "Enviar",
      enviando: "Enviando…",
      privacidad: "Usamos estos datos solo para contestarte.",
      privacidadEnlace: "Política de privacidad",
      whatsapp: "Prefiero escribir por WhatsApp",
    },
    errores: {
      faltan: "Falta tu nombre, tu email o qué celebras.",
      email: "Revisa el email, parece que no está bien escrito.",
      envio: (correo) => `No pudimos enviarlo. Inténtalo de nuevo o escríbenos a ${correo}.`,
    },
    gracias: { titulo: "Gracias, ya nos llegó.", texto: "Te escribiremos para hablar de tu evento." },
  },
  ca: {
    meta: {
      titulo: "Vitácora Esdeveniments",
      descripcion: "Venim al teu esdeveniment, entrevistem els teus convidats i fem el llibre imprès d'aquell dia.",
    },
    etiqueta: "Vitácora Esdeveniments",
    titulo: ["El teu esdeveniment,", "explicat per qui hi era."],
    bajada:
      "Venim al teu casament, al teu aniversari o a la teva festa. Entrevistem els teus convidats i amb el que expliquen fem el llibre imprès d'aquell dia.",
    irAlFormulario: "Explica'ns el teu esdeveniment",
    verComo: "Com funciona ↓",
    ventajas: ["Venim nosaltres al teu esdeveniment", "Els teus convidats només parlen", "Un llibre imprès amb les seves paraules", "Per a qualsevol celebració"],
    queEs: {
      etiqueta: "Què és Vitácora Esdeveniments",
      titulo: "El que els teus convidats diuen aquell dia, en un llibre.",
      bajada: "Una festa passa de pressa i gairebé res no queda escrit. Escoltem qui hi era i guardem les seves paraules en un llibre per a tu.",
      altFoto: "Un convidat explica un record al racó de Vitácora durant un casament.",
    },
    como: {
      titulo: "Com funciona",
      bajada: "Tu ens expliques l'esdeveniment, nosaltres escoltem els teus convidats i escrivim el llibre.",
      paso: "Pas",
      pasos: [
        { titulo: "Ens expliques el teu esdeveniment", texto: "Què celebres, quan i on. Ho parlem amb tu i ho preparem a la teva mida." },
        {
          titulo: "Hi anem i escoltem",
          texto: "El dia de l'esdeveniment entrevistem els teus convidats. Cadascú explica un record, una anècdota o el que et vol dir.",
        },
        { titulo: "T'arriba el llibre", texto: "Amb les seves paraules escrivim el llibre del teu esdeveniment i te'l lliurem imprès." },
      ],
    },
    tipos: { titulo: "Per a qualsevol celebració", pie: "Si el teu no és a la llista, explica-ho igualment.", altFoto: "La carpa negra de Vitácora en un casament, amb una entrevista a dins." },
    tipo: {
      boda: "Casaments",
      cumpleanos: "Aniversaris",
      aniversario: "Aniversaris de parella",
      despedida: "Comiats i jubilacions",
      show: "Espectacles i concerts",
      empresa: "Esdeveniments d'empresa",
      otro: "Un altre",
    },
    formulario: {
      titulo: "Explica'ns el teu esdeveniment",
      bajada: "Deixa'ns les teves dades i t'escrivim per preparar-ho junts.",
      nombre: "El teu nom",
      email: "El teu correu",
      telefono: "Telèfon (si vols)",
      tipo: "Què celebres",
      elegir: "Tria una opció",
      fecha: "Data",
      fechaPista: "Per exemple, juny de 2027",
      lugar: "Ciutat",
      invitados: "Convidats, més o menys",
      invitadosPista: "Per exemple, 80",
      mensaje: "Alguna cosa més que ens vulguis explicar",
      mensajePista: "Qui ho celebra, què t'agradaria que tingués el llibre…",
      enviar: "Enviar",
      enviando: "Enviant…",
      privacidad: "Fem servir aquestes dades només per respondre't.",
      privacidadEnlace: "Política de privacitat",
      whatsapp: "Prefereixo escriure per WhatsApp",
    },
    errores: {
      faltan: "Falta el teu nom, el teu correu o què celebres.",
      email: "Revisa el correu, sembla que no està ben escrit.",
      envio: (correo) => `No l'hem pogut enviar. Torna-ho a provar o escriu-nos a ${correo}.`,
    },
    gracias: { titulo: "Gràcies, ja ens ha arribat.", texto: "T'escriurem per parlar del teu esdeveniment." },
  },
  ar: {
    meta: {
      titulo: "Vitácora Eventos",
      descripcion: "Vamos a tu evento, entrevistamos a tus invitados y hacemos el libro impreso de ese día.",
    },
    etiqueta: "Vitácora Eventos",
    titulo: ["Tu evento,", "contado por quienes estuvieron."],
    bajada:
      "Vamos a tu casamiento, tu cumpleaños o tu fiesta. Entrevistamos a tus invitados y con lo que cuentan hacemos el libro impreso de ese día.",
    irAlFormulario: "Contanos tu evento",
    verComo: "Cómo funciona ↓",
    ventajas: ["Vamos nosotros a tu evento", "Tus invitados solo hablan", "Un libro impreso con sus palabras", "Para cualquier celebración"],
    queEs: {
      etiqueta: "Qué es Vitácora Eventos",
      titulo: "Lo que tus invitados dicen ese día, en un libro.",
      bajada: "Una fiesta pasa rápido y casi nada queda escrito. Escuchamos a quienes estuvieron y guardamos sus palabras en un libro para vos.",
      altFoto: "Un invitado cuenta un recuerdo en el rincón de Vitácora durante un casamiento.",
    },
    como: {
      titulo: "Cómo funciona",
      bajada: "Vos nos contás el evento, nosotros escuchamos a tus invitados y escribimos el libro.",
      paso: "Paso",
      pasos: [
        { titulo: "Nos contás tu evento", texto: "Qué celebrás, cuándo y dónde. Lo hablamos con vos y lo preparamos a tu medida." },
        {
          titulo: "Vamos y escuchamos",
          texto: "El día del evento entrevistamos a tus invitados. Cada uno cuenta un recuerdo, una anécdota o lo que te quiere decir.",
        },
        { titulo: "Te llega el libro", texto: "Con sus palabras escribimos el libro de tu evento y te lo entregamos impreso." },
      ],
    },
    tipos: { titulo: "Para cualquier celebración", pie: "Si lo tuyo no está en la lista, contanos igual.", altFoto: "La carpa negra de Vitácora en un casamiento, con una entrevista adentro." },
    tipo: {
      boda: "Casamientos",
      cumpleanos: "Cumpleaños",
      aniversario: "Aniversarios",
      despedida: "Despedidas y jubilaciones",
      show: "Shows y recitales",
      empresa: "Eventos de empresa",
      otro: "Otro",
    },
    formulario: {
      titulo: "Contanos tu evento",
      bajada: "Dejanos tus datos y te escribimos para prepararlo juntos.",
      nombre: "Tu nombre",
      email: "Tu email",
      telefono: "Teléfono (si querés)",
      tipo: "Qué celebrás",
      elegir: "Elegí una opción",
      fecha: "Fecha",
      fechaPista: "Por ejemplo, junio de 2027",
      lugar: "Ciudad",
      invitados: "Invitados, más o menos",
      invitadosPista: "Por ejemplo, 80",
      mensaje: "Algo más que quieras contarnos",
      mensajePista: "Quién celebra, qué te gustaría que tenga el libro…",
      enviar: "Enviar",
      enviando: "Enviando…",
      privacidad: "Usamos estos datos solo para contestarte.",
      privacidadEnlace: "Política de privacidad",
      whatsapp: "Prefiero escribir por WhatsApp",
    },
    errores: {
      faltan: "Falta tu nombre, tu email o qué celebrás.",
      email: "Revisá el email, parece que no está bien escrito.",
      envio: (correo) => `No pudimos enviarlo. Probá de nuevo o escribinos a ${correo}.`,
    },
    gracias: { titulo: "Gracias, ya nos llegó.", texto: "Te vamos a escribir para hablar de tu evento." },
  },
};
