// El iPhone saca las fotos en HEIC y el servidor no las acepta (la fábrica no
// las abre, ver errorDeTipoDeFoto). Antes de medir y subir, el navegador las
// pasa a JPG. La librería pesa 3 MB: se carga solo cuando llega una HEIC.
// Si la conversión falla se devuelve la original y el servidor avisa como siempre.

const EXTENSION_HEIC = /\.(heic|heif)$/i;

/** Windows a veces la manda sin tipo: alcanza con el nombre. */
export function esHeic(archivo: File): boolean {
  return archivo.type === "image/heic" || archivo.type === "image/heif" || EXTENSION_HEIC.test(archivo.name);
}

export async function aJpgSiEsHeic(archivo: File): Promise<File> {
  if (!esHeic(archivo)) return archivo;
  try {
    const { heicTo } = await import("heic-to/next");
    const jpg = await heicTo({ blob: archivo, type: "image/jpeg", quality: 0.92 });
    return new File([jpg], archivo.name.replace(EXTENSION_HEIC, "") + ".jpg", { type: "image/jpeg", lastModified: archivo.lastModified });
  } catch (e) {
    console.error("foto-heic: no se pudo pasar a JPG", archivo.name, e);
    return archivo;
  }
}
