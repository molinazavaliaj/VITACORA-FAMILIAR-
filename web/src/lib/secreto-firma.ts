// El secreto con el que se firman los links sin sesión: el código impreso en el
// libro (/voz), el link para compartir, el anticipo y los tokens cortos
// (fotos, vuelta del pago, cupón).
//
// Hasta el 24/10 se firmaban con SUPABASE_SERVICE_ROLE_KEY. Después del
// incidente de Railway esa clave se cambia, pero los QR ya impresos tienen que
// seguir abriendo. Por eso:
//   FIRMA_TOKENS           firma y verifica (la clave nueva, propia de los links).
//   FIRMA_TOKENS_ANTERIOR  solo verifica: la clave con la que se firmó todo lo
//                          anterior (la service_role vieja). Nunca firma.
// Sin FIRMA_TOKENS se sigue usando SUPABASE_SERVICE_ROLE_KEY, como antes.

export function secretoFirma(): string {
  const s = process.env.FIRMA_TOKENS || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Falta FIRMA_TOKENS (o SUPABASE_SERVICE_ROLE_KEY) para firmar los links.");
  return s;
}

/** Los secretos que se aceptan al verificar: el actual y, si está, el anterior. */
export function secretosVerificacion(): string[] {
  const lista = [secretoFirma()];
  const anterior = process.env.FIRMA_TOKENS_ANTERIOR;
  if (anterior && !lista.includes(anterior)) lista.push(anterior);
  return lista;
}
