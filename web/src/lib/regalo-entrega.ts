// ¿Se puede elegir WhatsApp para mandar el regalo el día elegido? (spec 2026-10-10)
// Se prende en Vercel con REGALO_ENTREGA_WHATSAPP=1 cuando Meta apruebe las
// plantillas `regalo_entrega`. Apagado, la opción no aparece y /api/compra la rechaza.
export function entregaWhatsAppPrendida(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.REGALO_ENTREGA_WHATSAPP === "1";
}
