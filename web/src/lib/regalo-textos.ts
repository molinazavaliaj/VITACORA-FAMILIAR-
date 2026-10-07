// Los textos de persona de la gift card en la web. Lugar único: los aprueba Naza
// (plan 2026-10-07-gift-card, Task 0). Los de la tarjeta ya están aprobados (spec §3).

export const TEXTOS_REGALO = {
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
  mailAsunto: (como: string) => `Tu regalo para ${como} está listo`,
  mailCuerpo: (como: string) =>
    `Ya podés descargar la tarjeta. Imprimila o mandala por WhatsApp. Cuando ${como} la escanee, empieza su entrevista y lo vas a ver en tu tablero.`,
  mailBoton: "Ver la tarjeta",
  estadoPanel: "Esperando que abra su regalo",
  estadoCorto: "esperando que abra el regalo",
  proximoPaso: "Descargá la tarjeta del regalo",

  // PROPUESTA (Task 0, tanda 2), hasta que Naza apruebe.
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

  // PROPUESTA (tanda 3), hasta que Naza apruebe. Lo demás que pide el formulario de /regalar.
  tituloPagina: "Regalar el libro",
  pasos: ["A quién", "Tu mensaje", "Tus datos", "Pagar"],
  contador: (n: number, maximo: number) => `${n}/${maximo}`,
  grabar: "Grabar",
  parar: "Parar",
  escuchar: "Escuchar",
  borrar: "Borrar",
  elegirAudio: "Elegí un audio",
  audioNoSirve: "Ese audio no sirve. Probá con otro.",
  atras: "Atrás",
  seguir: "Seguir",
  unMomento: "Un momento…",
  faltaNombre: "Falta su nombre.",
  faltaComoLeDecis: "Falta cómo le decís.",
  faltaGenero: "Falta elegir si es hombre o mujer.",
  faltaMensaje: "Falta tu mensaje para la tarjeta.",
  faltaTuNombre: "Falta tu nombre.",
  faltaQueEsTuyo: "Falta qué es tuyo.",
  correoMal: "Revisá el correo. Así no te llega la tarjeta.",
  errorPago: "No pudimos ir al pago. Probá de nuevo.",
} as const;
