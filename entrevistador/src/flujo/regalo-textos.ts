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
  // PROPUESTA (regalo-idiomas)
  tu: {
    asunto: (como: string) => `${como} todavía no ha abierto su regalo`,
    cuerpo: 'Pasaron unos días desde la fecha que pusiste y la tarjeta sigue sin usar. Si ya se la diste, quizá necesita una mano para escanearla. La tarjeta está en tu tablero.',
  },
};

/**
 * El mail «dijo que sí» de un regalo: su primera pregunta sale con el SÍ (no
 * «mañana») y la V3 no tiene guion para repasar. El de lo que no es regalo
 * sigue en mail/hitos.ts, sin cambios.
 */
export const HITO_ACEPTO_REGALO: Readonly<Record<TratoComprador, { asunto: (quien: string) => string; cuerpo: (quien: string) => string }>> = {
  // PROPUESTA (regalo-idiomas)
  vos: {
    asunto: (quien: string) => `${quien} dijo que sí`,
    cuerpo: (quien: string) => `${quien} dijo que sí y ya le mandamos la primera pregunta por WhatsApp. Lo que vaya contando lo vas a poder escuchar en tu tablero.`,
  },
  // PROPUESTA (regalo-idiomas)
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
