import type { IdiomaWeb, Textos } from "@/lib/idioma-web";
import type { PasoKids } from "./kids";

// Las landings de anuncio de Vitácora Kids (15/10; maquetas LandingKidsMundo y
// LandingKidsOnce, con la paleta de Kids). Una idea por pantalla, cabecera
// mínima, la compra solo si se vende (KIDS_VENTA y precio).
//
// La tercera maqueta, LandingKidsAbuelos, NO se hizo: vende el libro impreso con
// el marco para los abuelos y «llega unos 9 días después», y Kids no tiene
// definidos ni el marco ni el plazo (PENDIENTES, «Apuntado: Kids»).
//
// Todo es PARA APROBAR (docs/rediseno-2026-10/kids/textos.md): el titular de
// cada una es la opción recomendada; las otras dos están en `titulares`, para
// que Naza elija. Las preguntas de ejemplo son del banco aprobado (K1, K24,
// K44); en España y en catalán, adaptadas.
// ca: PENDIENTE REVISIÓN NATIVA

export type LandingKids = "mundo" | "once";

/** Las rutas de cada landing, sin prefijo de idioma (iguales en los tres). */
export const RUTAS_LANDING_KIDS: Record<LandingKids, string> = {
  mundo: "/kids/su-mundo",
  once: "/kids/a-los-once",
};

export type TextosLandingKids = {
  meta: { titulo: string; descripcion: string };
  etiqueta: string;
  /** El titular recomendado. */
  titulo: string;
  /** Las tres opciones para Naza (la primera es la recomendada, la de `titulo`). */
  titulares: [string, string, string];
  bajada: string;
  /** La sección propia: una lista (mundo) o tres preguntas del banco (once). */
  seccion: { titulo: string; items: string[]; pie?: string; preguntas?: boolean };
  como: { titulo: string; pasos: [PasoKids, PasoKids, PasoKids] };
  /** Las preguntas son tres de /kids (móvil propio, si no le gusta, quién escucha). */
  faqTitulo: string;
  cierre: string;
  altFoto: string;
};

type PorLanding = Record<LandingKids, TextosLandingKids>;

const ES: PorLanding = {
  mundo: {
    meta: { titulo: "Vitácora Kids · Su mundo, con sus palabras", descripcion: "Le preguntamos por WhatsApp y contesta con audios. Con eso hacemos su libro." },
    etiqueta: "Vitácora Kids",
    titulo: "Sus amigos, sus juegos, lo que quiere ser. Con sus palabras.",
    titulares: [
      "Sus amigos, sus juegos, lo que quiere ser. Con sus palabras.",
      "Su mundo de ahora, contado con su voz.",
      "Lo que hoy le importa, en un libro.",
    ],
    bajada: "Un libro que se escribe hablando. Le preguntamos por WhatsApp y contesta con audios.",
    seccion: {
      titulo: "Lo que hoy le importa, en un libro.",
      items: [
        "Sus amigos y sus historias del cole",
        "Las cosas que le importan, contadas con sus palabras",
        "Lo que quiere ser de mayor",
        "Un sobre cerrado, para abrirlo cuando sea mayor",
      ],
    },
    como: {
      titulo: "Habla en vez de hacer scroll.",
      pasos: [
        { titulo: "Le llega una pregunta", texto: "A su WhatsApp o al tuyo, lo eliges al comprar." },
        { titulo: "Contesta con un audio", texto: "Lo largo que quiera, cuando le apetezca. Si una pregunta no le gusta, la pasa." },
        { titulo: "Se vuelve un libro", texto: "Con sus palabras y sus fotos, para leerlo juntos y guardarlo." },
      ],
    },
    faqTitulo: "Antes de decidir.",
    cierre: "Que lo cuente con su voz.",
    altFoto: "Un niño sentado en la alfombra de su cuarto hace una foto a sus juguetes con el móvil",
  },
  once: {
    meta: { titulo: "Vitácora Kids · Cómo piensa a los once", descripcion: "Le preguntamos por su mundo y contesta con audios. Con sus respuestas hacemos su libro." },
    etiqueta: "Vitácora Kids",
    titulo: "Dentro de unos años, nadie recordará cómo pensaba a los once.",
    titulares: [
      "Dentro de unos años, nadie recordará cómo pensaba a los once.",
      "A los once se piensa distinto. Guárdalo antes de que cambie.",
      "Cómo piensa hoy, guardado para cuando crezca.",
    ],
    bajada: "Le preguntamos por su mundo y contesta con audios. Con sus respuestas hacemos su libro, con sus palabras.",
    seccion: {
      titulo: "Preguntas de su edad, no de examen.",
      items: [
        "¿Cuál es el primer recuerdo de tu vida? Lo más viejo que tengas, aunque sea borroso.",
        "¿Qué fue lo mejor que te pasó esta semana? Cuéntame eso.",
        "¿Qué es lo que no quieres olvidar nunca de tu vida de ahora?",
      ],
      pie: "Contesta con audios, como cuando habla con sus amigos.",
      preguntas: true,
    },
    como: {
      titulo: "Habla. Nosotros lo escribimos.",
      pasos: [
        { titulo: "Eliges cómo llegan", texto: "A su WhatsApp o al tuyo, y a qué hora." },
        { titulo: "Contesta con audios", texto: "Desde el móvil, cuando le apetece." },
        { titulo: "Recibes su libro", texto: "Con sus palabras y sus fotos, y un sobre cerrado para cuando sea mayor." },
      ],
    },
    faqTitulo: "Antes de decidir.",
    cierre: "Guarda cómo es hoy.",
    altFoto: "Un niño sentado en su cama graba un audio en el móvil, entre dibujos y un oso de peluche",
  },
};

// ca: PENDIENTE REVISIÓN NATIVA
const CA: PorLanding = {
  mundo: {
    meta: { titulo: "Vitácora Kids · El seu món, amb les seves paraules", descripcion: "Li preguntem per WhatsApp i contesta amb àudios. Amb això fem el seu llibre." },
    etiqueta: "Vitácora Kids",
    titulo: "Els seus amics, els seus jocs, el que vol ser. Amb les seves paraules.",
    titulares: [
      "Els seus amics, els seus jocs, el que vol ser. Amb les seves paraules.",
      "El seu món d'ara, explicat amb la seva veu.",
      "El que avui li importa, en un llibre.",
    ],
    bajada: "Un llibre que s'escriu parlant. Li preguntem per WhatsApp i contesta amb àudios.",
    seccion: {
      titulo: "El que avui li importa, en un llibre.",
      items: [
        "Els seus amics i les seves històries de l'escola",
        "Les coses que li importen, explicades amb les seves paraules",
        "El que vol ser de gran",
        "Un sobre tancat, per obrir-lo quan sigui gran",
      ],
    },
    como: {
      titulo: "Parla en lloc de fer scroll.",
      pasos: [
        { titulo: "Li arriba una pregunta", texto: "Al seu WhatsApp o al teu, ho tries en comprar." },
        { titulo: "Contesta amb un àudio", texto: "Tan llarg com vulgui, quan li vingui de gust. Si una pregunta no li agrada, la passa." },
        { titulo: "Es converteix en un llibre", texto: "Amb les seves paraules i les seves fotos, per llegir-lo junts i guardar-lo." },
      ],
    },
    faqTitulo: "Abans de decidir.",
    cierre: "Que ho expliqui amb la seva veu.",
    altFoto: "Un nen assegut a la catifa de la seva habitació fa una foto a les seves joguines amb el mòbil",
  },
  once: {
    meta: { titulo: "Vitácora Kids · Com pensa als onze anys", descripcion: "Li preguntem pel seu món i contesta amb àudios. Amb les seves respostes fem el seu llibre." },
    etiqueta: "Vitácora Kids",
    titulo: "D'aquí a uns anys, ningú no recordarà com pensava als onze anys.",
    titulares: [
      "D'aquí a uns anys, ningú no recordarà com pensava als onze anys.",
      "Als onze anys es pensa diferent. Guarda-ho abans que canviï.",
      "Com pensa avui, guardat per quan creixi.",
    ],
    bajada: "Li preguntem pel seu món i contesta amb àudios. Amb les seves respostes fem el seu llibre, amb les seves paraules.",
    seccion: {
      titulo: "Preguntes de la seva edat, no d'examen.",
      items: [
        "Quin és el primer record de la teva vida? El més antic que tinguis, encara que sigui borrós.",
        "Què és el millor que t'ha passat aquesta setmana? Explica-m'ho.",
        "Què és el que no vols oblidar mai de la teva vida d'ara?",
      ],
      pie: "Contesta amb àudios, com quan parla amb els seus amics.",
      preguntas: true,
    },
    como: {
      titulo: "Parla. Nosaltres ho escrivim.",
      pasos: [
        { titulo: "Tries com arriben", texto: "Al seu WhatsApp o al teu, i a quina hora." },
        { titulo: "Contesta amb àudios", texto: "Des del mòbil, quan li ve de gust." },
        { titulo: "Reps el seu llibre", texto: "Amb les seves paraules i les seves fotos, i un sobre tancat per quan sigui gran." },
      ],
    },
    faqTitulo: "Abans de decidir.",
    cierre: "Guarda com és avui.",
    altFoto: "Un nen assegut al llit grava un àudio amb el mòbil, entre dibuixos i un ós de peluix",
  },
};

const AR: PorLanding = {
  mundo: {
    meta: { titulo: "Vitácora Kids · Su mundo, con sus palabras", descripcion: "Le preguntamos por WhatsApp y contesta con audios. Con eso hacemos su libro." },
    etiqueta: "Vitácora Kids",
    titulo: "Sus amigos, sus juegos, lo que quiere ser. Con sus palabras.",
    titulares: [
      "Sus amigos, sus juegos, lo que quiere ser. Con sus palabras.",
      "Su mundo de ahora, contado con su voz.",
      "Lo que hoy le importa, en un libro.",
    ],
    bajada: "Un libro que se escribe hablando. Le preguntamos por WhatsApp y contesta con audios.",
    seccion: {
      titulo: "Lo que hoy le importa, en un libro.",
      items: [
        "Sus amigos y sus historias de la escuela",
        "Las cosas que le importan, contadas con sus palabras",
        "Lo que quiere ser de grande",
        "Un sobre cerrado, para abrirlo cuando sea grande",
      ],
    },
    como: {
      titulo: "Habla en vez de scrollear.",
      pasos: [
        { titulo: "Le llega una pregunta", texto: "A su WhatsApp o al tuyo, lo elegís al comprar." },
        { titulo: "Contesta con un audio", texto: "Lo largo que quiera, cuando tenga ganas. Si una pregunta no le gusta, la pasa." },
        { titulo: "Se vuelve un libro", texto: "Con sus palabras y sus fotos, para leerlo juntos y guardarlo." },
      ],
    },
    faqTitulo: "Antes de decidir.",
    cierre: "Que lo cuente con su voz.",
    altFoto: "Un chico sentado en la alfombra de su cuarto le saca una foto a sus juguetes con el celular",
  },
  once: {
    meta: { titulo: "Vitácora Kids · Cómo piensa a los once", descripcion: "Le preguntamos por su mundo y contesta con audios. Con sus respuestas hacemos su libro." },
    etiqueta: "Vitácora Kids",
    titulo: "En unos años, nadie se va a acordar de cómo pensaba a los once.",
    titulares: [
      "En unos años, nadie se va a acordar de cómo pensaba a los once.",
      "A los once se piensa distinto. Guardalo antes de que cambie.",
      "Cómo piensa hoy, guardado para cuando crezca.",
    ],
    bajada: "Le preguntamos por su mundo y contesta con audios. Con sus respuestas hacemos su libro, con sus palabras.",
    seccion: {
      titulo: "Preguntas de su edad, no de prueba.",
      items: [
        "¿Cuál es el primer recuerdo de tu vida? Lo más viejo que tengas, aunque sea borroso.",
        "¿Qué fue lo mejor que te pasó esta semana? Contame eso.",
        "¿Qué es lo que no querés olvidarte nunca de tu vida de ahora?",
      ],
      pie: "Contesta con audios, como cuando habla con sus amigos.",
      preguntas: true,
    },
    como: {
      titulo: "Habla. Nosotros lo escribimos.",
      pasos: [
        { titulo: "Elegís cómo llegan", texto: "A su WhatsApp o al tuyo, y a qué hora." },
        { titulo: "Contesta con audios", texto: "Desde el celular, cuando tiene ganas." },
        { titulo: "Recibís su libro", texto: "Con sus palabras y sus fotos, y un sobre cerrado para cuando sea grande." },
      ],
    },
    faqTitulo: "Antes de decidir.",
    cierre: "Guardá cómo es hoy.",
    altFoto: "Un chico sentado en su cama graba un audio en el celular, entre dibujos y un oso de peluche",
  },
};

export const TEXTOS_LANDING_KIDS: Textos<PorLanding> = { es: ES, ca: CA, ar: AR };

/** El botón de compra de las landings (el mismo en la cabecera, el inicio y el cierre). */
export const CTA_LANDING_KIDS: Record<IdiomaWeb, { comprar: string; inicio: string }> = {
  es: { comprar: "Empezar su libro", inicio: "Vitácora, inicio" },
  ca: { comprar: "Començar el seu llibre", inicio: "Vitácora, inici" },
  ar: { comprar: "Empezar su libro", inicio: "Vitácora, inicio" },
};
