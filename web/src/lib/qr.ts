import QRCode from "qrcode";

/** El QR de la tarjeta, como data URI. Negro de la marca sobre blanco. */
export function qrDataUri(texto: string): Promise<string> {
  return QRCode.toDataURL(texto, { errorCorrectionLevel: "M", margin: 2, width: 512, color: { dark: "#14140F", light: "#FFFFFF" } });
}

/** La URL que lleva el QR de la gift card: la página que abre el regalo. */
export function urlRegalo(codigo: string): string {
  const urlBase = process.env.URL_BASE || "https://www.vitacorafamiliar.com";
  return `${urlBase}/regalo/${codigo}`;
}
