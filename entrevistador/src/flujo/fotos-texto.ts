// Lo puro de las fotos que llegan por WhatsApp. Vive aparte de fotos.ts (que
// importa la base) para que la V3 lo use sin arrastrarla.

/** La extensión según lo que dijo Meta. Todo lo que no reconocemos se guarda como jpg. */
export function extensionDe(mimeType: string | undefined): string {
  return mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
}

/** El epígrafe: lo que escribió abajo de la foto, recortado. Vacío = null. */
export function epigrafeDe(caption: string | undefined): string | null {
  return caption?.trim().slice(0, 300) || null;
}
