// Textos del bot para la gift card. Lugar único: los aprueba Naza (plan
// 2026-10-07-gift-card, Task 0; plan 2026-10-09-regalo-idiomas, Task 0).

import type { Idioma } from '../v3/nucleo/entrevista/idioma.js';

export const TEXTOS_REGALO_BOT = {
  // Aprobados por Naza el 07/10 (Task 0, #1 y #2).
  noExiste: 'No encuentro ese código. Fijate bien en la tarjeta y mandámelo de nuevo, con las letras y los números tal cual.',
  usadoPorOtro: 'Ese código ya se usó desde otro teléfono. Avisale a quien te hizo el regalo para que nos escriba.',

  // Aprobados por Naza el 07/10 (Task 0, #6 y #7). Mail a quien regaló, a los
  // 15 días, si la tarjeta sigue sin usar. Nunca al narrador.
  recordatorioAsunto: (como: string) => `${como} todavía no abrió su regalo`,
  recordatorioCuerpo: 'Pasaron unos días desde la fecha que pusiste y la tarjeta sigue sin usar. Si ya se la diste, capaz necesita una mano para escanearla. La tarjeta está en tu tablero.',
  // El mismo texto aprobado que el botón del mail de la web (web/src/lib/regalo-textos.ts, mailBoton).
  botonTarjeta: 'Ver la tarjeta',
} as const;

/** Cómo se le habla a quien compra: de vos si compra desde Argentina, de tú si desde España. */
export type TratoComprador = 'vos' | 'tu';

/** `familias.region` → trato. 'ES' da tú; cualquier otra cosa (AR, vacío), vos. */
export function tratoDeComprador(region: unknown): TratoComprador {
  return region === 'ES' ? 'tu' : 'vos';
}

/** El recordatorio de los 15 días a quien regaló, según su trato. */
export const RECORDATORIO: Readonly<Record<TratoComprador, { asunto: (como: string) => string; cuerpo: string }>> = {
  vos: { asunto: TEXTOS_REGALO_BOT.recordatorioAsunto, cuerpo: TEXTOS_REGALO_BOT.recordatorioCuerpo },
  // Aprobados por Naza el 09/10 (regalo-idiomas)
  tu: {
    asunto: (como: string) => `${como} todavía no ha abierto su regalo`,
    cuerpo: 'Han pasado unos días desde la fecha que pusiste y la tarjeta sigue sin usar. Si ya se la diste, quizá necesita una mano para escanearla. La tarjeta está en tu tablero.',
  },
};

/**
 * El mail «dijo que sí» de un regalo: su primera pregunta sale con el SÍ (no
 * «mañana») y la V3 no tiene guion para repasar. El de lo que no es regalo
 * sigue en mail/hitos.ts, sin cambios.
 */
/**
 * El «dijo que sí» de la Viaje V2 cuando el viaje es un regalo: va a quien regaló (quien compra para sí no lo
 * recibe). PROPUESTA del 10/10, falta el OK de Naza.
 */
export const HITO_ACEPTO_VIAJE: Readonly<Record<TratoComprador, { asunto: (quien: string) => string; cuerpo: (quien: string) => string }>> = {
  vos: {
    asunto: (quien: string) => `${quien} dijo que sí`,
    cuerpo: (quien: string) => `${quien} dijo que sí y ya le mandamos la primera pregunta de su viaje por WhatsApp. Antes de salir le van a llegar unas pocas más, y en el viaje, dos por día.`,
  },
  tu: {
    asunto: (quien: string) => `${quien} ha dicho que sí`,
    cuerpo: (quien: string) => `${quien} ha dicho que sí y ya le hemos mandado la primera pregunta de su viaje por WhatsApp. Antes de salir le llegarán unas pocas más, y en el viaje, dos al día.`,
  },
};

export const HITO_ACEPTO_REGALO: Readonly<Record<TratoComprador, { asunto: (quien: string) => string; cuerpo: (quien: string) => string }>> = {
  // Aprobados por Naza el 09/10 (regalo-idiomas)
  vos: {
    asunto: (quien: string) => `${quien} dijo que sí`,
    cuerpo: (quien: string) => `${quien} dijo que sí y ya le mandamos la primera pregunta por WhatsApp. Lo que vaya contando lo vas a poder escuchar en tu tablero.`,
  },
  // Aprobados por Naza el 09/10 (regalo-idiomas)
  tu: {
    asunto: (quien: string) => `${quien} ha dicho que sí`,
    cuerpo: (quien: string) => `${quien} ha dicho que sí y ya le hemos mandado la primera pregunta por WhatsApp. Lo que vaya contando lo podrás escuchar en tu tablero.`,
  },
};

export type TextosArranque = { pedidoSi: string; aceptacion: string; noEntendi: string; noQuiere: string };
export type TextosAvisos = { noExiste: string; usadoPorOtro: string };

// El arranque del regalo: el pedido de SÍ va debajo del BIEN del banco; la
// aceptación, el «no te entendí» y el «todavía no» contestan al SÍ (o a lo que
// no es SÍ). {{nombre}} se llena con como_le_dicen (renderizar del banco).
// Aprobados por Naza el 09/10 (regalo-idiomas, Task 0).
export const ARRANQUE: Readonly<Record<Idioma, TextosArranque>> = {
  'es-AR': {
    pedidoSi: 'Antes de empezar, una cosa. Tus mejores frases van a quedar en el libro tal cual las contaste, como recortes de estos mismos audios, y al responder SÍ nos das permiso para guardar tus audios y usarlos así. Respondé SÍ y arrancamos.',
    aceptacion: 'Gracias, {{nombre}}. Ahí te mando la primera pregunta. Sin apuro, y no hay respuestas incorrectas.',
    noEntendi: 'Perdón, no te entendí. Para arrancar necesito que me escribas SÍ. ¿Vamos?',
    noQuiere: 'Sin problema, {{nombre}}. Cuando tengas ganas me escribís SÍ y arrancamos. Acá voy a estar.',
  },
  'es-ES': {
    pedidoSi: 'Antes de empezar, una cosa. Tus mejores frases quedarán en el libro tal cual las has contado, como recortes de estos mismos audios, y al responder SÍ nos das permiso para guardar tus audios y usarlos así. Responde SÍ y empezamos.',
    aceptacion: 'Gracias, {{nombre}}. Ahora mismo te mando la primera pregunta. Sin prisa, y no hay respuestas incorrectas.',
    noEntendi: 'Perdona, no te he entendido. Para empezar necesito que me escribas SÍ. ¿Vamos?',
    noQuiere: 'Sin problema, {{nombre}}. Cuando te apetezca me escribes SÍ y empezamos. Aquí estaré.',
  },
  ca: {
    pedidoSi: "Abans de començar, una cosa. Les teves millors frases quedaran al llibre tal com les has explicat, com a retalls d'aquests mateixos àudios, i en respondre SÍ ens dones permís per guardar els teus àudios i fer-los servir així. Respon SÍ i comencem.",
    aceptacion: "Gràcies, {{nombre}}. Ara mateix t'envio la primera pregunta. Sense pressa, i no hi ha respostes incorrectes.",
    noEntendi: "Perdona, no t'he entès. Per començar necessito que m'escriguis SÍ. Som-hi?",
    noQuiere: "Cap problema, {{nombre}}. Quan et vingui de gust m'escrius SÍ i comencem. Aquí em tindràs.",
  },
};

// «No encuentro ese código» y «ya se usó». El es-AR es el aprobado el 07/10, sin cambios.
// Aprobados por Naza el 09/10 (regalo-idiomas, Task 0).
export const AVISOS: Readonly<Record<Idioma, TextosAvisos>> = {
  'es-AR': { noExiste: TEXTOS_REGALO_BOT.noExiste, usadoPorOtro: TEXTOS_REGALO_BOT.usadoPorOtro },
  'es-ES': {
    noExiste: 'No encuentro ese código. Fíjate bien en la tarjeta y mándamelo de nuevo, con las letras y los números tal cual.',
    usadoPorOtro: 'Ese código ya se ha usado desde otro teléfono. Avisa a quien te hizo el regalo para que nos escriba.',
  },
  ca: {
    noExiste: "No trobo aquest codi. Mira bé la targeta i torna-me'l a enviar, amb les lletres i els números tal com són.",
    usadoPorOtro: "Aquest codi ja s'ha fet servir des d'un altre telèfon. Avisa qui t'ha fet el regal perquè ens escrigui.",
  },
};

// ── El regalo llega solo el día elegido (spec 2026-10-10) ─────────────
// Aprobados por Naza el 10/10 (docs/regalo/dia-de-entrega-textos.md).

/** Los mails a quien compró: «Hoy le llegó» (tandas 1 y 2, fila 9) y «dásela vos» (fila 10). */
export const ENTREGA_COMPRADOR: Readonly<Record<TratoComprador, {
  llegoAsunto: (como: string) => string; llegoCuerpo: (contacto: string) => string;
  falloAsunto: (como: string) => string; falloCuerpo: (contacto: string) => string;
}>> = {
  vos: {
    llegoAsunto: (como) => `Hoy le llegó tu regalo a ${como}`,
    llegoCuerpo: (contacto) => `Se lo mandamos a ${contacto}. Cuando empiece su entrevista lo vas a ver en tu tablero.`,
    falloAsunto: (como) => `No pudimos mandarle el regalo a ${como}`,
    falloCuerpo: (contacto) => `Probamos mandárselo a ${contacto} y no llegó. Dale la tarjeta vos, impresa o por WhatsApp.`,
  },
  tu: {
    llegoAsunto: (como) => `Hoy le ha llegado tu regalo a ${como}`,
    llegoCuerpo: (contacto) => `Se lo hemos enviado a ${contacto}. Cuando empiece su entrevista lo verás en tu tablero.`,
    falloAsunto: (como) => `No hemos podido enviarle el regalo a ${como}`,
    falloCuerpo: (contacto) => `Intentamos enviárselo a ${contacto} y no llegó. Dale tú la tarjeta, impresa o por WhatsApp.`,
  },
};

export type TextosEntregaAbuelo = {
  asunto: (quien: string) => string;
  /** Copia de `titulo` y `explica` de la tarjeta (web/src/lib/regalo-textos.ts, aprobados el 07/10 y el 09/10). */
  titulo: (narrador: string, quien: string) => string;
  explica: readonly string[];
  antesDelMensaje: string;
  siHayAudio: string;
  boton: string;
  debajoDelBoton: (numero: string) => string;
};

/** El mail a quien recibe, en el idioma del regalo (tanda 3, filas 1 a 5). */
export const ENTREGA_ABUELO: Readonly<Record<Idioma, TextosEntregaAbuelo>> = {
  'es-AR': {
    asunto: (quien) => `${quien} te hizo un regalo`,
    titulo: (narrador, quien) => `${narrador}, ${quien} te hizo un regalo.`,
    explica: [
      'Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp.',
      'Vos le contestás con audios, cuando puedas.',
      'Con lo que le cuentes se escribe el libro de tu vida.',
    ],
    antesDelMensaje: 'Te dejó este mensaje.',
    siHayAudio: 'También te grabó un audio. Lo escuchás cuando abrís tu regalo.',
    boton: 'Abrir mi regalo',
    debajoDelBoton: (numero) => `Si el botón no te anda, mandá un WhatsApp al ${numero} con este código.`,
  },
  'es-ES': {
    asunto: (quien) => `${quien} te ha hecho un regalo`,
    titulo: (narrador, quien) => `${narrador}, ${quien} te ha hecho un regalo.`,
    explica: [
      'Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp.',
      'Tú le contestas con audios, cuando puedas.',
      'Con lo que le cuentes se escribe el libro de tu vida.',
    ],
    antesDelMensaje: 'Te ha dejado este mensaje.',
    siHayAudio: 'También te ha grabado un audio. Lo escucharás cuando abras tu regalo.',
    boton: 'Abrir mi regalo',
    debajoDelBoton: (numero) => `Si el botón no te funciona, manda un WhatsApp al ${numero} con este código.`,
  },
  ca: {
    asunto: (quien) => `${quien} t'ha fet un regal`,
    titulo: (narrador, quien) => `${narrador}, ${quien} t'ha fet un regal.`,
    explica: [
      'Un biògraf et farà preguntes sobre la teva vida per WhatsApp.',
      'Tu li respons amb àudios, quan puguis.',
      "Amb el que li expliquis s'escriu el llibre de la teva vida.",
    ],
    antesDelMensaje: "T'ha deixat aquest missatge.",
    siHayAudio: "També t'ha gravat un àudio. L'escoltaràs quan obris el teu regal.",
    boton: 'Obrir el meu regal',
    debajoDelBoton: (numero) => `Si el botó no et funciona, envia un WhatsApp al ${numero} amb aquest codi.`,
  },
};
