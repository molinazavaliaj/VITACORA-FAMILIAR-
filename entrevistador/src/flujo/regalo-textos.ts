// Textos del bot para la gift card. Lugar único: los aprueba Naza (plan
// 2026-10-07-gift-card, Task 0). v1 solo es-AR, de vos.

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
