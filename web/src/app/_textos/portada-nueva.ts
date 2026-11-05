import type { Textos } from "@/lib/idioma-web";

// Los textos de la portada nueva (05/11). Propuestas: Naza los aprueba en
// tandas de 10 antes del merge. El catalán falta revisarlo con Imma.
// Reglas: sin dos puntos, ninguna oración empieza con «Y», sin «padre».

export type TextoCaja = { titulo: string; linea: string; ideal: string; enlace: string };
type Paso = { titulo: string; texto: string };

export type TextosPortadaNueva = {
  inicio: { boton: string };
  tienda: { titulo: string; bajada: string; pie: [string, string, string] };
  precios: { impresoDigital: string; soloDigital: string; viaje: string; pronto: string; prontoValor: string; evento: string; consultar: string; biografo: string };
  marcas: { regalo: string; pronto: string };
  cajas: Record<"familiar" | "ti" | "nino" | "viaje" | "evento" | "biografo", TextoCaja>;
  atajos: Record<"familiar" | "ti" | "nino" | "viaje" | "evento" | "biografo", { pista: string; nombre: string }>;
  biografo: { etiqueta: string; nombre: string; rol: string; texto: string; boton: string; fotoFalta: string };
  audios: { titulo: string; capitulos: [string, string] };
  pasos: { titulo: string; lista: [Paso, Paso, Paso, Paso]; ejemplo: [string, string]; agregar: string };
  voz: { titulo: string; texto: string };
  privacidad: { titulo: string; texto: string; enlace: string };
  cierre: { frase: string; boton: string };
  faqAudios: string;
};

export const TEXTOS_PORTADA_NUEVA: Textos<TextosPortadaNueva> = {
  es: {
    inicio: { boton: "¿Para quién es?" },
    tienda: {
      titulo: "Vitácora convierte una vida en un libro para siempre.",
      bajada: "Solo hay que responder preguntas por WhatsApp. Nosotros nos encargamos del resto. Un regalo emotivo, un libro que va a pasar de generación en generación.",
      pie: ["Envío incluido", "Sin apps ni contraseñas", "Con un QR para escuchar su voz"],
    },
    precios: { impresoDigital: "Impreso y digital", soloDigital: "Solo digital", viaje: "Vitácora de Viaje", pronto: "Mi Primer Capítulo", prontoValor: "Pronto", evento: "Según el evento", consultar: "Consultar", biografo: "Vitácora Biógrafo" },
    marcas: { regalo: "El regalo", pronto: "Próximamente" },
    cajas: {
      familiar: { titulo: "Para un familiar", linea: "La vida de tu abuela, tu abuelo o quien quieras, con sus palabras.", ideal: "Ideal si se la quieres regalar.", enlace: "Ver Vitácora Familiar" },
      ti: { titulo: "Para ti", linea: "Tu propia historia, para que quede en tu familia.", ideal: "Ideal si quieres dejarla escrita.", enlace: "Ver Vitácora para ti" },
      nino: { titulo: "Para un niño", linea: "Su primer libro, con sus propias palabras.", ideal: "Ideal si tiene 11 años.", enlace: "Ver Mi Primer Capítulo" },
      viaje: { titulo: "Para un viaje", linea: "Una pregunta cada noche y, al volver, su libro.", ideal: "Ideal si tiene un viaje por delante.", enlace: "Ver Vitácora de Viaje" },
      evento: { titulo: "Para un evento", linea: "Entrevistamos a tus invitados y hacemos el libro de ese día.", ideal: "Ideal si tienes una boda o una fiesta.", enlace: "Ver Vitácora Eventos" },
      biografo: { titulo: "Con una editora", linea: "Una editora especializada se encarga de tu libro.", ideal: "Ideal si quieres que lo edite una persona.", enlace: "Ver Vitácora Biógrafo" },
    },
    atajos: {
      familiar: { pista: "¿Para tu familia?", nombre: "Un familiar" },
      ti: { pista: "¿Tu propia vida?", nombre: "Para ti" },
      nino: { pista: "¿Tiene 11 años?", nombre: "Un niño" },
      viaje: { pista: "¿Se va de viaje?", nombre: "Un viaje" },
      evento: { pista: "¿Hay una fiesta?", nombre: "Un evento" },
      biografo: { pista: "¿Prefieres a una editora?", nombre: "Con una editora" },
    },
    biografo: { etiqueta: "Vitácora Biógrafo", nombre: "Florencia Monfort", rol: "Editora especializada", texto: "Es la persona que edita estos libros.", boton: "Escribir por WhatsApp", fotoFalta: "Florencia Monfort" },
    audios: { titulo: "Sus audios de WhatsApp se vuelven capítulos.", capitulos: ["La infancia", "Sus primeros años"] },
    pasos: {
      titulo: "Así se hace su libro.",
      lista: [
        { titulo: "Se lo regalas", texto: "Con la tarjeta en sus manos o el día que nos digas." },
        { titulo: "Responde por WhatsApp", texto: "Con audios o escribiendo, cuando tiene un rato." },
        { titulo: "Añades tus preguntas", texto: "Lo que siempre quisiste saber, y las fotos para su libro." },
        { titulo: "Llega a casa", texto: "Escribimos su biografía, un libro de memorias con sus palabras. Eliges la tapa y te lo enviamos." },
      ],
      ejemplo: ["¿Qué le preguntarías tú?", "¿Cómo conociste a la abuela?"],
      agregar: "Añadir pregunta",
    },
    voz: { titulo: "Se lee y también se escucha.", texto: "El libro lleva sus mejores frases con su voz real, en un QR de la contraportada." },
    privacidad: { titulo: "Su historia es de tu familia.", texto: "Sabemos que lo que cuenta es personal. Los audios originales se borran tres meses después de terminar el libro, o antes si lo pides.", enlace: "Cómo cuidamos sus datos" },
    cierre: { frase: "Un día vas a querer preguntarle algo.", boton: "Iniciar Vitácora" },
    faqAudios: "Los audios son privados, se usan únicamente para su libro y se pueden borrar todos cuando quiera.",
  },
  ar: {
    inicio: { boton: "¿Para quién es?" },
    tienda: {
      titulo: "Vitácora convierte una vida en un libro para siempre.",
      bajada: "Solo hay que responder preguntas por WhatsApp. Nosotros nos encargamos del resto. Un regalo emotivo, un libro que va a pasar de generación en generación.",
      pie: ["Envío incluido", "Sin apps ni contraseñas", "Con un QR para escuchar su voz"],
    },
    precios: { impresoDigital: "Impreso y digital", soloDigital: "Solo digital", viaje: "Vitácora de Viaje", pronto: "Mi Primer Capítulo", prontoValor: "Pronto", evento: "Según el evento", consultar: "Consultar", biografo: "Vitácora Biógrafo" },
    marcas: { regalo: "El regalo", pronto: "Próximamente" },
    cajas: {
      familiar: { titulo: "Para un familiar", linea: "La vida de tu abuela, tu abuelo o quien quieras, con sus palabras.", ideal: "Ideal si se la querés regalar.", enlace: "Ver Vitácora Familiar" },
      ti: { titulo: "Para vos", linea: "Tu propia historia, para que quede en tu familia.", ideal: "Ideal si querés dejarla escrita.", enlace: "Ver Vitácora para vos" },
      nino: { titulo: "Para un chico", linea: "Su primer libro, con sus propias palabras.", ideal: "Ideal si tiene 11 años.", enlace: "Ver Mi Primer Capítulo" },
      viaje: { titulo: "Para un viaje", linea: "Una pregunta cada noche y, al volver, su libro.", ideal: "Ideal si tiene un viaje por delante.", enlace: "Ver Vitácora de Viaje" },
      evento: { titulo: "Para un evento", linea: "Entrevistamos a tus invitados y hacemos el libro de ese día.", ideal: "Ideal si tenés un casamiento o una fiesta.", enlace: "Ver Vitácora Eventos" },
      biografo: { titulo: "Con una editora", linea: "Una editora especializada se encarga de tu libro.", ideal: "Ideal si querés que lo edite una persona.", enlace: "Ver Vitácora Biógrafo" },
    },
    atajos: {
      familiar: { pista: "¿Para tu familia?", nombre: "Un familiar" },
      ti: { pista: "¿Tu propia vida?", nombre: "Para vos" },
      nino: { pista: "¿Tiene 11 años?", nombre: "Un chico" },
      viaje: { pista: "¿Se va de viaje?", nombre: "Un viaje" },
      evento: { pista: "¿Hay una fiesta?", nombre: "Un evento" },
      biografo: { pista: "¿Preferís a una editora?", nombre: "Con una editora" },
    },
    biografo: { etiqueta: "Vitácora Biógrafo", nombre: "Florencia Monfort", rol: "Editora especializada", texto: "Es la persona que edita estos libros.", boton: "Escribir por WhatsApp", fotoFalta: "Florencia Monfort" },
    audios: { titulo: "Sus audios de WhatsApp se vuelven capítulos.", capitulos: ["La infancia", "Sus primeros años"] },
    pasos: {
      titulo: "Así se hace su libro.",
      lista: [
        { titulo: "Se lo regalás", texto: "Con la tarjeta en sus manos o el día que nos digas." },
        { titulo: "Responde por WhatsApp", texto: "Con audios o escribiendo, cuando tiene un rato." },
        { titulo: "Sumás tus preguntas", texto: "Lo que siempre quisiste saber, y las fotos para su libro." },
        { titulo: "Llega a casa", texto: "Escribimos su biografía, un libro de memorias con sus palabras. Elegís la tapa y te lo mandamos." },
      ],
      ejemplo: ["¿Qué le preguntarías vos?", "¿Cómo conociste a la abuela?"],
      agregar: "Sumar pregunta",
    },
    voz: { titulo: "Se lee y también se escucha.", texto: "El libro lleva sus mejores frases con su voz real, en un QR de la contratapa." },
    privacidad: { titulo: "Su historia es de tu familia.", texto: "Sabemos que lo que cuenta es personal. Los audios originales se borran tres meses después de terminar el libro, o antes si lo pedís.", enlace: "Cómo cuidamos sus datos" },
    cierre: { frase: "Un día vas a querer preguntarle algo.", boton: "Iniciar Vitácora" },
    faqAudios: "Los audios son privados, se usan únicamente para su libro y se pueden borrar todos cuando quiera.",
  },
  ca: {
    inicio: { boton: "Per a qui és?" },
    tienda: {
      titulo: "Vitácora converteix una vida en un llibre per sempre.",
      bajada: "Només cal respondre preguntes per WhatsApp. Nosaltres ens encarreguem de la resta. Un regal emotiu, un llibre que passarà de generació en generació.",
      pie: ["Enviament inclòs", "Sense apps ni contrasenyes", "Amb un QR per escoltar la seva veu"],
    },
    precios: { impresoDigital: "Imprès i digital", soloDigital: "Només digital", viaje: "Vitácora de Viatge", pronto: "El meu primer capítol", prontoValor: "Aviat", evento: "Segons l'esdeveniment", consultar: "Consultar", biografo: "Vitácora Biògraf" },
    marcas: { regalo: "El regal", pronto: "Aviat" },
    cajas: {
      familiar: { titulo: "Per a un familiar", linea: "La vida de la teva àvia, el teu avi o qui vulguis, amb les seves paraules.", ideal: "Ideal si la hi vols regalar.", enlace: "Veure Vitácora Familiar" },
      ti: { titulo: "Per a tu", linea: "La teva pròpia història, perquè quedi a la teva família.", ideal: "Ideal si la vols deixar escrita.", enlace: "Veure Vitácora per a tu" },
      nino: { titulo: "Per a un infant", linea: "El seu primer llibre, amb les seves paraules.", ideal: "Ideal si té 11 anys.", enlace: "Veure El meu primer capítol" },
      viaje: { titulo: "Per a un viatge", linea: "Una pregunta cada nit i, en tornar, el seu llibre.", ideal: "Ideal si té un viatge per endavant.", enlace: "Veure Vitácora de Viatge" },
      evento: { titulo: "Per a un esdeveniment", linea: "Entrevistem els teus convidats i fem el llibre d'aquell dia.", ideal: "Ideal si tens un casament o una festa.", enlace: "Veure Vitácora Esdeveniments" },
      biografo: { titulo: "Amb una editora", linea: "Una editora especialitzada s'encarrega del teu llibre.", ideal: "Ideal si vols que l'editi una persona.", enlace: "Veure Vitácora Biògraf" },
    },
    atajos: {
      familiar: { pista: "Per a la teva família?", nombre: "Un familiar" },
      ti: { pista: "La teva pròpia vida?", nombre: "Per a tu" },
      nino: { pista: "Té 11 anys?", nombre: "Un infant" },
      viaje: { pista: "Se'n va de viatge?", nombre: "Un viatge" },
      evento: { pista: "Hi ha una festa?", nombre: "Un esdeveniment" },
      biografo: { pista: "Prefereixes una editora?", nombre: "Amb una editora" },
    },
    biografo: { etiqueta: "Vitácora Biògraf", nombre: "Florencia Monfort", rol: "Editora especialitzada", texto: "És la persona que edita aquests llibres.", boton: "Escriure per WhatsApp", fotoFalta: "Florencia Monfort" },
    audios: { titulo: "Els seus àudios de WhatsApp es tornen capítols.", capitulos: ["La infància", "Els seus primers anys"] },
    pasos: {
      titulo: "Així es fa el seu llibre.",
      lista: [
        { titulo: "L'hi regales", texto: "Amb la targeta a les seves mans o el dia que ens diguis." },
        { titulo: "Respon per WhatsApp", texto: "Amb àudios o escrivint, quan té una estona." },
        { titulo: "Afegeixes les teves preguntes", texto: "El que sempre has volgut saber, i les fotos per al seu llibre." },
        { titulo: "Arriba a casa", texto: "Escrivim la seva biografia, un llibre de memòries amb les seves paraules. Tries la tapa i te l'enviem." },
      ],
      ejemplo: ["Què li preguntaries tu?", "Com vas conèixer l'àvia?"],
      agregar: "Afegir pregunta",
    },
    voz: { titulo: "Es llegeix i també s'escolta.", texto: "El llibre porta les seves millors frases amb la seva veu real, en un QR de la contraportada." },
    privacidad: { titulo: "La seva història és de la teva família.", texto: "Sabem que el que explica és personal. Els àudios originals s'esborren tres mesos després d'acabar el llibre, o abans si ho demanes.", enlace: "Com cuidem les seves dades" },
    cierre: { frase: "Un dia voldràs preguntar-li alguna cosa.", boton: "Iniciar Vitácora" },
    faqAudios: "Els àudios són privats, només es fan servir per al seu llibre i es poden esborrar tots quan vulgui.",
  },
};
