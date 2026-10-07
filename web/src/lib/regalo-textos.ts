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
} as const;
