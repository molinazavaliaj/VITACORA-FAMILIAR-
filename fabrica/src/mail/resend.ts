// Cuánto se espera a Resend antes de cortar. Sin esto, un Resend colgado deja el fetch esperando para
// siempre y traba el worker entero (lo mismo que entrevistador/src/mail/hitos.ts). El corte tira un
// TimeoutError que quien llama trata como cualquier otro fallo de Resend.
export const TIMEOUT_RESEND_MS = 15_000;
