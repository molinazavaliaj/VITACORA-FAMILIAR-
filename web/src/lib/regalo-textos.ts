// Los textos de persona de la gift card en la web. Lugar único: los aprueba Naza
// (plan 2026-10-07-gift-card, Task 0). Los de la tarjeta ya están aprobados (spec §3).
//
// Van en dos grupos (plan 2026-10-09-regalo-idiomas):
// - Lo que lee el abuelo (tarjeta, página del regalo, WhatsApp), por el idioma elegido en la compra.
// - Lo que lee quien compra (formulario, mails, tablero), por su trato: vos en AR, tú en ES.

export type IdiomaRegalo = "es-AR" | "es-ES" | "ca";
export type TratoComprador = "vos" | "tu";
export type RegionComprador = "AR" | "ES";

export type TextosAbuelo = {
  tapaSlogan: string;
  esUnRegalo: string;
  explica: readonly string[];
  apunta: string;
  respaldo: (numero: string) => string;
  titulo: (narrador: string, quien: string) => string;
  empezar: string;
  mensajeWhatsApp: (codigo: string) => string;
  yaEmpezo: string;
  escucharAudioDe: (quien: string) => string;
};

export type TextosComprador = {
  mailAsunto: (como: string) => string;
  mailCuerpo: (como: string) => string;
  mailBoton: string;
  estadoPanel: string;
  estadoCorto: string;
  proximoPaso: string;
  botonImprimir: string;
  botonImagen: string;
  aQuien: string;
  comoLeDecis: string;
  comoLeDecisPista: string;
  genero: string;
  generos: { varon: string; mujer: string; otro: string };
  tuMensaje: string;
  audio: string;
  cuando: string;
  tuNombre: string;
  queEsTuyo: string;
  queEsTuyoPista: string;
  tuCorreo: string;
  botonPagar: string;
  tituloPagina: string;
  pasos: readonly string[];
  contador: (n: number, maximo: number) => string;
  grabar: string;
  parar: string;
  escuchar: string;
  borrar: string;
  elegirAudio: string;
  audioNoSirve: string;
  atras: string;
  seguir: string;
  unMomento: string;
  faltaNombre: string;
  faltaComoLeDecis: string;
  faltaGenero: string;
  faltaMensaje: string;
  faltaTuNombre: string;
  faltaQueEsTuyo: string;
  correoMal: string;
  errorPago: string;
  yaCompre: string;
  pagoSeguro: (pasarela: string) => string;
  terminos: string;
  idioma: string;
  idiomas: Record<IdiomaRegalo, string>;
};

const ABUELO: Record<IdiomaRegalo, TextosAbuelo> = {
  "es-AR": {
    // Aprobados (spec §3, 07/10).
    tapaSlogan: "En cada familia hay un libro sin escribir.",
    esUnRegalo: "Esto es un regalo.",
    explica: [
      "Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp.",
      "Vos le contestás con audios, cuando puedas.",
      "Con lo que le cuentes se escribe el libro de tu vida.",
    ],
    apunta: "Apuntá la cámara del celular acá para empezar.",
    respaldo: (numero: string) => `Si la cámara no te anda, mandá un WhatsApp al ${numero} con este código.`,
    titulo: (narrador: string, quien: string) => `${narrador}, ${quien} te hizo un regalo.`,
    empezar: "Empezar",
    mensajeWhatsApp: (codigo: string) => `Hola, quiero empezar mi libro. ${codigo}`,
    // Aprobados por Naza el 07/10 (Task 0, tanda 1).
    yaEmpezo: "Este regalo ya está en marcha. Para seguir, escribile al biógrafo por WhatsApp.",
    // El nombre accesible del botón de play en la página del regalo.
    escucharAudioDe: (quien: string) => `Escuchar el audio de ${quien}`,
  },

  // Aprobados por Naza el 09/10 (regalo-idiomas, Task 0, tanda 3).
  "es-ES": {
    tapaSlogan: "En cada familia hay un libro sin escribir.",
    esUnRegalo: "Esto es un regalo.",
    explica: [
      "Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp.",
      "Tú le contestas con audios, cuando puedas.",
      "Con lo que le cuentes se escribe el libro de tu vida.",
    ],
    apunta: "Apunta la cámara del móvil aquí para empezar.",
    respaldo: (numero: string) => `Si la cámara no te funciona, manda un WhatsApp al ${numero} con este código.`,
    titulo: (narrador: string, quien: string) => `${narrador}, ${quien} te ha hecho un regalo.`,
    empezar: "Empezar",
    mensajeWhatsApp: (codigo: string) => `Hola, quiero empezar mi libro. ${codigo}`,
    yaEmpezo: "Este regalo ya está en marcha. Para seguir, escríbele al biógrafo por WhatsApp.",
    escucharAudioDe: (quien: string) => `Escuchar el audio de ${quien}`,
  },

  // PROPUESTA (regalo-idiomas, Task 0)
  ca: {
    tapaSlogan: "A cada família hi ha un llibre per escriure.",
    esUnRegalo: "Això és un regal.",
    explica: [
      "Un biògraf et farà preguntes sobre la teva vida per WhatsApp.",
      "Tu li respons amb àudios, quan puguis.",
      "Amb el que li expliquis s'escriu el llibre de la teva vida.",
    ],
    apunta: "Apunta la càmera del mòbil aquí per començar.",
    respaldo: (numero: string) => `Si la càmera no et funciona, envia un WhatsApp al ${numero} amb aquest codi.`,
    titulo: (narrador: string, quien: string) => `${narrador}, ${quien} t'ha fet un regal.`,
    empezar: "Començar",
    mensajeWhatsApp: (codigo: string) => `Hola, vull començar el meu llibre. ${codigo}`,
    yaEmpezo: "Aquest regal ja està en marxa. Per continuar, escriu-li al biògraf per WhatsApp.",
    escucharAudioDe: (quien: string) => `Escoltar l'àudio de ${quien}`,
  },
};

// PROPUESTA (regalo-idiomas, Task 0): la pregunta del idioma y sus opciones, iguales en vos y en tú.
const PREGUNTA_IDIOMA = {
  idioma: "¿En qué idioma le hablamos?",
  idiomas: {
    "es-AR": "Castellano de Argentina",
    "es-ES": "Castellano de España",
    ca: "Català",
  },
} as const;

const COMPRADOR: Record<TratoComprador, TextosComprador> = {
  vos: {
    // Aprobados por Naza el 07/10 (Task 0, tanda 1).
    mailAsunto: (como: string) => `Tu regalo para ${como} está listo`,
    mailCuerpo: (como: string) =>
      `Ya podés descargar la tarjeta. Imprimila o mandala por WhatsApp. Cuando ${como} la escanee, empieza su entrevista y lo vas a ver en tu tablero.`,
    mailBoton: "Ver la tarjeta",
    estadoPanel: "Esperando que abra su regalo",
    estadoCorto: "esperando que abra el regalo",
    proximoPaso: "Descargá la tarjeta del regalo",

    // Aprobados por Naza el 08/10 (Task 0, tanda 3). Los botones de la tarjeta.
    botonImprimir: "Imprimir o guardar en PDF",
    botonImagen: "Descargar la imagen para WhatsApp",

    // Aprobados por Naza el 08/10 (Task 0, tanda 2). El formulario de /regalar, 11 a 20.
    aQuien: "¿A quién se lo regalás?",
    comoLeDecis: "¿Cómo le decís?",
    comoLeDecisPista: "abuelo, papá, su nombre",
    genero: "¿Es hombre o mujer? Lo necesita el biógrafo para hablarle bien.",
    generos: { varon: "Hombre", mujer: "Mujer", otro: "Prefiero no decirlo" },
    tuMensaje: "Tu mensaje para la tarjeta",
    audio: "Si querés, grabale un audio. Lo escucha cuando escanea la tarjeta.",
    cuando: "¿Cuándo se lo vas a dar? (opcional)",
    tuNombre: "Tu nombre, como va a aparecer en la tarjeta",
    queEsTuyo: "¿Qué es tuyo?",
    queEsTuyoPista: "nieta, hijo…",
    tuCorreo: "Tu correo. Ahí te llega la tarjeta.",
    botonPagar: "Pagar y descargar la tarjeta",

    // Aprobados por Naza el 08/10 (Task 0, tanda 3). Lo demás que pide el formulario de /regalar.
    tituloPagina: "Regalar el libro",
    pasos: ["A quién", "Tu mensaje", "Tus datos", "Pagar"],
    contador: (n: number, maximo: number) => `${n}/${maximo}`,
    grabar: "Grabar",
    parar: "Parar",
    escuchar: "Escuchar",
    borrar: "Borrar",
    elegirAudio: "Elegí un audio",
    audioNoSirve: "No pudimos usar ese audio. Probá grabarlo de nuevo.",
    atras: "Atrás",
    seguir: "Seguir",
    unMomento: "Un momento…",
    faltaNombre: "Falta su nombre.",
    faltaComoLeDecis: "Falta cómo le decís.",
    faltaGenero: "Falta elegir si es hombre o mujer.",
    faltaMensaje: "Falta tu mensaje para la tarjeta.",
    faltaTuNombre: "Falta tu nombre.",
    faltaQueEsTuyo: "Falta qué es tuyo.",
    correoMal: "Ese correo parece mal escrito. Revisalo, ahí te llega la tarjeta.",
    errorPago: "No pudimos ir al pago. Probá de nuevo.",
    // Los que la página ya tenía fijos, con las mismas palabras: el encabezado y la línea de pago.
    yaCompre: "Ya compré · Entrar",
    pagoSeguro: (pasarela: string) => `Pago único y seguro con ${pasarela}. Al pagar aceptás los`,
    terminos: "términos",

    ...PREGUNTA_IDIOMA,
  },

  // PROPUESTA (regalo-idiomas, Task 0): cada texto de vos pasado a tú de España, con el mismo sentido.
  tu: {
    mailAsunto: (como: string) => `Tu regalo para ${como} está listo`,
    mailCuerpo: (como: string) =>
      `Ya puedes descargar la tarjeta. Imprímela o mándala por WhatsApp. Cuando ${como} la escanee, empieza su entrevista y lo vas a ver en tu tablero.`,
    mailBoton: "Ver la tarjeta",
    estadoPanel: "Esperando que abra su regalo",
    estadoCorto: "esperando que abra el regalo",
    proximoPaso: "Descarga la tarjeta del regalo",
    botonImprimir: "Imprimir o guardar en PDF",
    botonImagen: "Descargar la imagen para WhatsApp",
    aQuien: "¿A quién se lo regalas?",
    comoLeDecis: "¿Cómo le dices?",
    comoLeDecisPista: "abuelo, papá, su nombre",
    genero: "¿Es hombre o mujer? Lo necesita el biógrafo para hablarle bien.",
    generos: { varon: "Hombre", mujer: "Mujer", otro: "Prefiero no decirlo" },
    tuMensaje: "Tu mensaje para la tarjeta",
    audio: "Si quieres, grábale un audio. Lo escucha cuando escanea la tarjeta.",
    cuando: "¿Cuándo se lo vas a dar? (opcional)",
    tuNombre: "Tu nombre, como va a aparecer en la tarjeta",
    queEsTuyo: "¿Qué es tuyo?",
    queEsTuyoPista: "nieta, hijo…",
    tuCorreo: "Tu correo. Ahí te llega la tarjeta.",
    botonPagar: "Pagar y descargar la tarjeta",
    tituloPagina: "Regalar el libro",
    pasos: ["A quién", "Tu mensaje", "Tus datos", "Pagar"],
    contador: (n: number, maximo: number) => `${n}/${maximo}`,
    grabar: "Grabar",
    parar: "Parar",
    escuchar: "Escuchar",
    borrar: "Borrar",
    elegirAudio: "Elige un audio",
    audioNoSirve: "No hemos podido usar ese audio. Prueba a grabarlo de nuevo.",
    atras: "Atrás",
    seguir: "Seguir",
    unMomento: "Un momento…",
    faltaNombre: "Falta su nombre.",
    faltaComoLeDecis: "Falta cómo le dices.",
    faltaGenero: "Falta elegir si es hombre o mujer.",
    faltaMensaje: "Falta tu mensaje para la tarjeta.",
    faltaTuNombre: "Falta tu nombre.",
    faltaQueEsTuyo: "Falta qué es tuyo.",
    correoMal: "Ese correo parece mal escrito. Revísalo, ahí te llega la tarjeta.",
    errorPago: "No hemos podido ir al pago. Prueba de nuevo.",
    yaCompre: "Ya he comprado · Entrar",
    pagoSeguro: (pasarela: string) => `Pago único y seguro con ${pasarela}. Al pagar aceptas los`,
    terminos: "términos",

    ...PREGUNTA_IDIOMA,
  },
};

export function textosAbuelo(idioma: IdiomaRegalo): TextosAbuelo {
  return ABUELO[idioma];
}

export function textosComprador(trato: TratoComprador): TextosComprador {
  return COMPRADOR[trato];
}

export function tratoDeRegion(region: RegionComprador): TratoComprador {
  return region === "ES" ? "tu" : "vos";
}

export function idiomaPorDefecto(region: RegionComprador): IdiomaRegalo {
  return region === "ES" ? "es-ES" : "es-AR";
}
