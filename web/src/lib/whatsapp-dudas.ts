// El WhatsApp de dudas de la web (rediseño 2026-10, PASO-DE-MANOS C17,
// PENDIENTES B11): la cuenta de empresa «Vitácora», donde contesta una
// persona. El número va en NEXT_PUBLIC_WHATSAPP_DUDAS, en formato E.164
// (+34611222333). Sin la variable, o con un valor que no es un número, no hay
// botón ni caja: devuelve null y la pantalla no los pinta.
//
// Es NEXT_PUBLIC a propósito: se lee al construir y queda en el HTML estático,
// así las pantallas públicas no necesitan el servidor para mostrarlo.

const E164 = /^\+?[1-9]\d{7,14}$/;

/** El número limpio (solo dígitos), o null si la variable no está o no sirve. */
export function numeroWhatsAppDudas(crudo = process.env.NEXT_PUBLIC_WHATSAPP_DUDAS): string | null {
  const limpio = (crudo ?? "").replace(/[\s().-]/g, "");
  if (!E164.test(limpio)) return null;
  return limpio.replace(/^\+/, "");
}

/** El enlace wa.me para escribir a Vitácora, o null si no hay número. */
export function urlWhatsAppDudas(crudo = process.env.NEXT_PUBLIC_WHATSAPP_DUDAS): string | null {
  const numero = numeroWhatsAppDudas(crudo);
  return numero ? `https://wa.me/${numero}` : null;
}
