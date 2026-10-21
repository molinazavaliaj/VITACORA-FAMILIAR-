import type { Textos } from "@/lib/idioma-web";

// Los textos de /kids, /ca/kids y /ar/kids (Vitácora Kids, 15/10) y de la
// tarjeta de Kids en «Para quién es» de la portada.
//
// De dónde sale cada uno (detalle en docs/rediseno-2026-10/kids/textos.md):
//   - APROBADO en la rama vitacora-kids (docs/kids/v2, Naza 05/10), en vos: la
//     bajada (COMPRA-1-BAJADA sin «Acá van tus datos»), los capítulos (banco.md),
//     las preguntas de ejemplo (K2, K22, K43), el acuse (ACUSE-3), el sobre
//     cerrado (BIEN-CHICO), «leé todo, pero no le digas nada hasta el libro»
//     (AVISO-PADRE), los temas (COMPRA-3-BAJADA). En /ar van tal cual; en
//     España (tú) y en catalán, adaptados: PARA APROBAR.
//   - De la maqueta Kids (titular, «Los dibujos se pierden», «Preguntas de su
//     edad, no de examen», el cierre): PARA APROBAR.
//   - Lo demás es nuevo: PARA APROBAR.
//
// Reglas (memoria de Naza): sin dos puntos, sin rayas, sin «él»/«tu hijo»
// (Kids es para chicos y chicas: pendientes.md de la rama), sin prometer
// tiempos (ni días, ni semanas, ni «9 días»), sin reseñas, sin marco ni «Su
// voz» (Kids no los define), y el bot nunca dice que algo le gusta o le alegra.
// ca: revisado con el corrector de Softcatalà (18/10)

export type PasoKids = { titulo: string; texto: string };
export type DudaKids = { pregunta: string; respuesta: string };

export type TextosKids = {
  meta: { titulo: string; descripcion: string };
  etiqueta: string;
  /** El titular en dos líneas; la segunda va en la itálica terracota. */
  titulo: [string, string];
  bajada: string;
  empezar: string;
  desde: (precio: string) => string;
  proximamente: string;
  proximamenteTexto: string;
  /** El botón para escribirnos mientras no se vende (WhatsApp de dudas o correo). */
  escribir: string;
  /** El asunto y el cuerpo del correo de «Escríbenos», si no hay WhatsApp de dudas. */
  correo: { asunto: string; cuerpo: string };
  altHero: string;
  /** `altVideo`: el video del libro (arreglos chicos, aprobado por Naza el 18/10, arreglos-chicos/textos.md 15). */
  dibujos: { frase: [string, string]; texto: string; altVideo: string };
  como: { titulo: string; paso: (n: number) => string; pasos: [PasoKids, PasoKids, PasoKids] };
  chat: {
    titulo: string;
    texto: string;
    contacto: string;
    cuenta: string;
    hora: string;
    pregunta: string;
    duracion: string;
    acuse: string;
    ejemplo: string;
    resumen: string;
    altFoto: string;
  };
  libro: { titulo: string; texto: string; capitulos: [string, string, string, string, string]; sobre: string; altFoto: string };
  preguntas: { titulo: string; items: [string, string, string]; pie: string };
  panel: { titulo: string; texto: string; tuyas: string; pedido: string; altFoto: string };
  temas: { titulo: string; texto: string };
  precio: { titulo: string; texto: string; nota: string };
  faq: { titulo: string; preguntas: DudaKids[] };
  cierre: { titulo: [string, string]; familiar: string };
  /** La tarjeta de Kids en «Para quién es» de la portada. */
  portada: { etiqueta: string; texto: string; alt: string };
};

export const TEXTOS_KIDS: Textos<TextosKids> = {
  /* ─────────────────────────── España, de tú ─────────────────────────── */
  es: {
    meta: {
      titulo: "Vitácora Kids · Mi Primer Capítulo",
      descripcion: "Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se vuelve un libro de verdad.",
    },
    etiqueta: "Vitácora Kids · Mi Primer Capítulo",
    titulo: ["Un día no vas a recordar", "cómo pensabas a los once."],
    bajada: "Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se vuelve un libro de verdad.",
    empezar: "Empezar su libro",
    desde: (p) => `Un solo pago, ${p}`,
    proximamente: "Próximamente",
    proximamenteTexto: "Todavía no se vende. Escríbenos y te avisamos cuando abra.",
    escribir: "Escríbenos",
    correo: { asunto: "Vitácora Kids", cuerpo: "Hola. Quiero que me aviséis cuando abra Vitácora Kids." },
    altHero: "Un niño sentado en su cama graba un audio en el móvil, entre dibujos y un oso de peluche",
    dibujos: {
      frase: ["Los dibujos se pierden.", "Lo que pensaba, también."],
      texto: "Guardamos sus fotos y sus notas del cole, pero no cómo pensaba a esa edad. Ni siquiera lo va a recordar.",
      altVideo: "El libro de Nico sobre una colcha de colores, entre sus dibujos",
    },
    como: {
      titulo: "Si sabe mandar un audio, ya puede contar su libro.",
      paso: (n) => `Paso ${n}`,
      pasos: [
        { titulo: "Le escribimos por WhatsApp", texto: "A su WhatsApp o al tuyo, lo eliges al comprar. Si es al tuyo, os sentáis juntos y responde con sus palabras." },
        { titulo: "Contesta con audios y fotos", texto: "Preguntas de su mundo, su gente, sus cosas y lo que le pasó. Si una no le gusta, la salta y seguimos." },
        { titulo: "Se vuelve un libro de verdad", texto: "Con sus palabras y sus fotos. La última parte va en un sobre cerrado, para que lo abra cuando sea mayor." },
      ],
    },
    chat: {
      titulo: "Pregunta a pregunta, a su ritmo.",
      texto: "Una pregunta de su mundo, un audio como cuando le cuenta algo a un amigo, y seguimos. Sin deberes ni aplicaciones nuevas.",
      contacto: "Vitácora",
      cuenta: "cuenta de empresa",
      hora: "18:00",
      pregunta: "Ahora una del futuro. ¿Qué quieres hacer de mayor?",
      duracion: "1:12",
      acuse: "Eso va al libro, con tus palabras.",
      ejemplo: "Conversación de ejemplo",
      resumen: "Ejemplo de conversación. Vitácora le pregunta qué quiere hacer de mayor, contesta con un audio de un minuto y doce segundos, y Vitácora le dice que eso va al libro, con sus palabras.",
      altFoto: "Un niño sentado en la alfombra de su cuarto hace una foto a sus juguetes con el móvil",
    },
    libro: {
      titulo: "Cinco partes, y la última cerrada.",
      texto: "Con sus palabras y sus fotos, contado como un relato. La quinta parte es lo que le dice a quien va a ser de mayor, y va en un sobre cerrado.",
      capitulos: ["De pequeño", "Mi gente", "Mi mundo ahora", "Lo que me pasó", "Para cuando seas mayor"],
      sobre: "en un sobre cerrado",
      altFoto: "Un libro abierto por el capítulo 1, con la foto de un niño sonriendo, sobre una colcha de colores",
    },
    preguntas: {
      titulo: "Preguntas de su edad, no de examen.",
      items: [
        "Ahora una travesura. Una que hiciste tú y que todavía te da risa cuando te acuerdas.",
        "Ahora una del futuro. ¿Qué quieres hacer de mayor?",
        "Hazle una pregunta a la persona que vas a ser cuando abras el sobre. La que quieras.",
      ],
      pie: "Todas tienen un botón para pasar.",
    },
    panel: {
      titulo: "Tú lo ves todo.",
      texto: "Todo lo que cuente lo ves en la página de su historia. Audios, fotos y respuestas, también las del sobre cerrado.",
      tuyas: "Puedes añadir hasta tres preguntas tuyas. Le llegan cerca del final.",
      pedido: "Una sola cosa te pedimos. Lee todo, pero no le digas nada hasta el libro.",
      altFoto: "Una madre, un padre y su hijo leen un libro juntos en el sofá",
    },
    temas: {
      titulo: "Lo que prefieres que no toquemos, no se pregunta.",
      texto: "Hay cosas que solo tú sabes si conviene tocar. Lo que marques al comprar no se pregunta, y el libro se arma igual con el resto.",
    },
    precio: {
      titulo: "Un solo pago.",
      texto: "Las preguntas, sus audios y sus fotos, y su libro con el sobre cerrado.",
      nota: "Sin suscripciones.",
    },
    faq: {
      titulo: "Lo que suelen preguntarnos.",
      preguntas: [
        {
          pregunta: "¿Necesita un móvil propio?",
          respuesta: "No. Las preguntas pueden llegar a su WhatsApp o al tuyo, y entonces os sentáis juntos y responde con sus palabras. Lo eliges al comprar.",
        },
        {
          pregunta: "¿Para qué edad es?",
          respuesta: "Está pensado para niños y niñas de unos once años, que ya saben contar sus cosas y todavía se acuerdan de cuando eran pequeños.",
        },
        {
          pregunta: "¿Y si una pregunta no le gusta?",
          respuesta: "Todas tienen un botón para pasar. Si una no le gusta o no se le ocurre nada, la salta y seguimos.",
        },
        {
          pregunta: "¿Le escribís a cualquier hora?",
          respuesta: "No. Tú eliges a qué hora le escribimos, y nunca entre las diez de la noche y las nueve de la mañana.",
        },
        {
          pregunta: "¿Y si tarda en contestar?",
          respuesta: "Las preguntas le esperan. No le metemos prisa ni le reñimos. Si pasan cuatro días sin respuesta, te escribimos a ti.",
        },
        {
          pregunta: "¿Quién escucha sus audios?",
          respuesta: "Tú, desde la página de su historia, y el equipo que escribe su libro. Nadie más.",
        },
      ],
    },
    cierre: { titulo: ["Lo que hoy le importa,", "guardado para cuando crezca."], familiar: "¿Buscas el libro de una vida? Vitácora Familiar" },
    portada: {
      etiqueta: "Vitácora Kids · Para los once",
      texto: "Su mundo de ahora, guardado para cuando crezca.",
      alt: "Un niño sentado en su cama graba un audio en el móvil",
    },
  },

  /* ─────────────────────────── Catalán, de tú ─────────────────────────── */
  // ca: revisado con el corrector de Softcatalà (18/10)
  ca: {
    meta: {
      titulo: "Vitácora Kids · El meu primer capítol",
      descripcion: "Li fem preguntes per WhatsApp, respon amb àudios i amb fotos, i tot això es converteix en un llibre de debò.",
    },
    etiqueta: "Vitácora Kids · El meu primer capítol",
    titulo: ["Un dia no recordaràs", "com pensaves als onze anys."],
    bajada: "Li fem preguntes per WhatsApp, respon amb àudios i amb fotos, i tot això es converteix en un llibre de debò.",
    empezar: "Començar el seu llibre",
    desde: (p) => `Un sol pagament, ${p}`,
    proximamente: "Aviat",
    proximamenteTexto: "Encara no es ven. Escriu-nos i t'avisem quan obri.",
    escribir: "Escriu-nos",
    correo: { asunto: "Vitácora Kids", cuerpo: "Hola. Vull que m'aviseu quan obri Vitácora Kids." },
    altHero: "Un nen assegut al llit grava un àudio amb el mòbil, entre dibuixos i un os de peluix",
    dibujos: {
      frase: ["Els dibuixos es perden.", "El que pensava, també."],
      texto: "Guardem les seves fotos i les notes de l'escola, però no com pensava a aquesta edat. Ni tan sols se'n recordarà.",
      // ca: revisado con el corrector de Softcatalà (19/10)
      altVideo: "El llibre del Nico sobre un cobrellit de colors, entre els seus dibuixos",
    },
    como: {
      titulo: "Si sap enviar un àudio, ja pot explicar el seu llibre.",
      paso: (n) => `Pas ${n}`,
      pasos: [
        { titulo: "Li escrivim per WhatsApp", texto: "Al seu WhatsApp o al teu, ho tries en comprar. Si és al teu, us asseieu junts i respon amb les seves paraules." },
        { titulo: "Contesta amb àudios i fotos", texto: "Preguntes del seu món, la seva gent, les seves coses i el que li va passar. Si una no li agrada, se la salta i seguim." },
        { titulo: "Es converteix en un llibre de debò", texto: "Amb les seves paraules i les seves fotos. L'última part va en un sobre tancat, perquè l'obri quan sigui gran." },
      ],
    },
    chat: {
      titulo: "Pregunta a pregunta, al seu ritme.",
      texto: "Una pregunta del seu món, un àudio com quan explica una cosa a un amic, i seguim. Sense deures ni aplicacions noves.",
      contacto: "Vitácora",
      cuenta: "compte d'empresa",
      hora: "18:00",
      pregunta: "Ara una del futur. Què vols fer de gran?",
      duracion: "1:12",
      acuse: "Això va al llibre, amb les teves paraules.",
      ejemplo: "Conversa d'exemple",
      resumen: "Exemple de conversa. Vitácora li pregunta què vol fer de gran, contesta amb un àudio d'un minut i dotze segons, i Vitácora li diu que això va al llibre, amb les seves paraules.",
      altFoto: "Un nen assegut a la catifa de la seva habitació fa una foto a les seves joguines amb el mòbil",
    },
    libro: {
      titulo: "Cinc parts, i l'última tancada.",
      texto: "Amb les seves paraules i les seves fotos, explicat com un relat. La cinquena part és el que li diu a qui serà de gran, i va en un sobre tancat.",
      capitulos: ["De petit", "La meva gent", "El meu món ara", "El que em va passar", "Per a quan siguis gran"],
      sobre: "en un sobre tancat",
      altFoto: "Un llibre obert pel capítol 1, amb la foto d'un nen somrient, sobre un cobrellit de colors",
    },
    preguntas: {
      titulo: "Preguntes de la seva edat, no d'examen.",
      items: [
        "Ara una entremaliadura. Una que vas fer tu i que encara et fa riure quan te'n recordes.",
        "Ara una del futur. Què vols fer de gran?",
        "Fes-li una pregunta a la persona que seràs quan obris el sobre. La que vulguis.",
      ],
      pie: "Totes tenen un botó per passar.",
    },
    panel: {
      titulo: "Tu ho veus tot.",
      texto: "Tot el que expliqui ho veus a la pàgina de la seva història. Àudios, fotos i respostes, també les del sobre tancat.",
      tuyas: "Pots afegir fins a tres preguntes teves. Li arriben cap al final.",
      pedido: "Només et demanem una cosa. Llegeix-ho tot, però no li diguis res fins al llibre.",
      altFoto: "Una mare, un pare i el seu fill llegeixen un llibre junts al sofà",
    },
    temas: {
      titulo: "El que prefereixes que no toquem, no es pregunta.",
      texto: "Hi ha coses que només tu saps si convé tocar. El que marquis en comprar no es pregunta, i el llibre es fa igual amb la resta.",
    },
    precio: {
      titulo: "Un sol pagament.",
      texto: "Les preguntes, els seus àudios i les seves fotos, i el seu llibre amb el sobre tancat.",
      nota: "Sense subscripcions.",
    },
    faq: {
      titulo: "El que ens solen preguntar.",
      preguntas: [
        {
          pregunta: "Necessita un mòbil propi?",
          respuesta: "No. Les preguntes poden arribar al seu WhatsApp o al teu, i aleshores us asseieu junts i respon amb les seves paraules. Ho tries en comprar.",
        },
        {
          pregunta: "Per a quina edat és?",
          respuesta: "Està pensat per a nens i nenes d'uns onze anys, que ja saben explicar les seves coses i encara se'n recorden de quan eren petits.",
        },
        {
          pregunta: "I si una pregunta no li agrada?",
          respuesta: "Totes tenen un botó per passar. Si una no li agrada o no se li acut res, se la salta i seguim.",
        },
        {
          pregunta: "Li escriviu a qualsevol hora?",
          respuesta: "No. Tu tries a quina hora li escrivim, i mai entre les deu de la nit i les nou del matí.",
        },
        {
          pregunta: "I si triga a contestar?",
          respuesta: "Les preguntes es queden esperant. No hi ha presses ni renys. Si passen quatre dies sense resposta, t'escrivim a tu.",
        },
        {
          pregunta: "Qui escolta els seus àudios?",
          respuesta: "Tu, des de la pàgina de la seva història, i l'equip que escriu el seu llibre. Ningú més.",
        },
      ],
    },
    cierre: { titulo: ["El que avui li importa,", "guardat per a quan creixi."], familiar: "Busques el llibre d'una vida? Vitácora Familiar" },
    portada: {
      etiqueta: "Vitácora Kids · Per als onze",
      texto: "El seu món d'ara, guardat per a quan creixi.",
      alt: "Un nen assegut al llit grava un àudio amb el mòbil",
    },
  },

  /* ─────────────────────────── Argentina, de vos ─────────────────────────── */
  ar: {
    meta: {
      titulo: "Vitácora Kids · Mi Primer Capítulo",
      descripcion: "Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se vuelve un libro de verdad.",
    },
    etiqueta: "Vitácora Kids · Mi Primer Capítulo",
    titulo: ["Un día no te vas a acordar", "de cómo pensabas a los once."],
    bajada: "Le hacemos preguntas por WhatsApp, responde con audios y con fotos, y todo eso se vuelve un libro de verdad.",
    empezar: "Empezar su libro",
    desde: (p) => `Un solo pago, ${p}`,
    proximamente: "Próximamente",
    proximamenteTexto: "Todavía no se vende. Escribinos y te avisamos cuando abra.",
    escribir: "Escribinos",
    correo: { asunto: "Vitácora Kids", cuerpo: "Hola. Quiero que me avisen cuando abra Vitácora Kids." },
    altHero: "Un chico sentado en su cama graba un audio en el celular, entre dibujos y un oso de peluche",
    dibujos: {
      frase: ["Los dibujos se pierden.", "Lo que pensaba, también."],
      texto: "Guardamos sus fotos y sus boletines, pero no cómo pensaba a esa edad. Ni siquiera se va a acordar.",
      altVideo: "El libro de Nico sobre una colcha de colores, entre sus dibujos",
    },
    como: {
      titulo: "Si sabe mandar un audio, ya puede contar su libro.",
      paso: (n) => `Paso ${n}`,
      pasos: [
        { titulo: "Le escribimos por WhatsApp", texto: "A su WhatsApp o al tuyo, lo elegís al comprar. Si es al tuyo, te sentás al lado y responde con sus palabras." },
        { titulo: "Contesta con audios y fotos", texto: "Preguntas de su mundo, su gente, sus cosas y lo que le pasó. Si una pregunta no le gusta, la salta y seguimos." },
        { titulo: "Se vuelve un libro de verdad", texto: "Con sus palabras y sus fotos. La última parte va en un sobre cerrado, para que lo abra cuando sea grande." },
      ],
    },
    chat: {
      titulo: "Pregunta a pregunta, a su ritmo.",
      texto: "Una pregunta de su mundo, un audio como cuando le cuenta algo a un amigo, y seguimos. Sin tarea ni aplicaciones nuevas.",
      contacto: "Vitácora",
      cuenta: "cuenta de empresa",
      hora: "18:00",
      pregunta: "Ahora una del futuro. ¿Qué querés hacer de grande?",
      duracion: "1:12",
      acuse: "Eso va al libro, con tus palabras.",
      ejemplo: "Conversación de ejemplo",
      resumen: "Ejemplo de conversación. Vitácora le pregunta qué quiere hacer de grande, contesta con un audio de un minuto y doce segundos, y Vitácora le dice que eso va al libro, con sus palabras.",
      altFoto: "Un chico sentado en la alfombra de su cuarto les saca una foto a sus juguetes con el celular",
    },
    libro: {
      titulo: "Cinco partes, y la última cerrada.",
      texto: "Con sus palabras y sus fotos, contado como un relato. La quinta parte es lo que le dice a quien va a ser de grande, y va en un sobre cerrado.",
      capitulos: ["De chiquito", "Mi gente", "Mi mundo ahora", "Lo que me pasó", "Para cuando seas grande"],
      sobre: "en un sobre cerrado",
      altFoto: "Un libro abierto en el capítulo 1, con la foto de un chico sonriendo, sobre una colcha de colores",
    },
    preguntas: {
      titulo: "Preguntas de su edad, no de prueba.",
      items: [
        "Ahora una travesura. Una que hiciste vos y que todavía te da risa cuando te acordás.",
        "Ahora una del futuro. ¿Qué querés hacer de grande?",
        "Hacele una pregunta a la persona que vas a ser cuando abras el sobre. La que quieras.",
      ],
      pie: "Todas tienen un botón para pasar.",
    },
    panel: {
      titulo: "Vos ves todo.",
      texto: "Todo lo que cuente lo podés ver en la página de su historia. Audios, fotos y respuestas, también las del sobre cerrado.",
      tuyas: "Podés agregar hasta tres preguntas tuyas. Le llegan cerca del final.",
      pedido: "Una sola cosa te pedimos. Leé todo, pero no le digas nada hasta el libro.",
      altFoto: "Una mamá, un papá y su hijo leen un libro juntos en el sillón",
    },
    temas: {
      titulo: "Lo que preferís que no toquemos, no se pregunta.",
      texto: "Hay cosas que solo vos sabés si conviene tocar. Lo que marques al comprar no se pregunta, y el libro se arma igual con el resto.",
    },
    precio: {
      titulo: "Un solo pago.",
      texto: "Las preguntas, sus audios y sus fotos, y su libro con el sobre cerrado.",
      nota: "Sin suscripciones.",
    },
    faq: {
      titulo: "Lo que nos suelen preguntar.",
      preguntas: [
        {
          pregunta: "¿Necesita un celular propio?",
          respuesta: "No. Las preguntas pueden llegar a su WhatsApp o al tuyo, y entonces te sentás al lado y responde con sus palabras. Lo elegís al comprar.",
        },
        {
          pregunta: "¿Para qué edad es?",
          respuesta: "Está pensado para chicos y chicas de alrededor de once años, que ya saben contar sus cosas y todavía se acuerdan de cuando eran chiquitos.",
        },
        {
          pregunta: "¿Y si una pregunta no le gusta?",
          respuesta: "Todas tienen botón para pasar. Si una pregunta no le gusta o no se le ocurre nada, la salta y seguimos.",
        },
        {
          pregunta: "¿Le escriben a cualquier hora?",
          respuesta: "No. Vos elegís a qué hora le escribimos, y nunca entre las diez de la noche y las nueve de la mañana.",
        },
        {
          pregunta: "¿Y si tarda en contestar?",
          respuesta: "Las preguntas quedan esperando. No hay retos ni apuros de nuestro lado. Si pasan cuatro días sin respuesta, te escribimos a vos.",
        },
        {
          pregunta: "¿Quién escucha sus audios?",
          respuesta: "Vos, desde la página de su historia, y el equipo que escribe su libro. Nadie más.",
        },
      ],
    },
    cierre: { titulo: ["Lo que hoy le importa,", "guardado para cuando crezca."], familiar: "¿Buscás el libro de una vida? Vitácora Familiar" },
    portada: {
      etiqueta: "Vitácora Kids · Para los once",
      texto: "Su mundo de ahora, guardado para cuando crezca.",
      alt: "Un chico sentado en su cama graba un audio en el celular",
    },
  },
};
