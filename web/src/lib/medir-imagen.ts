// Mide una foto en el navegador antes de subirla (ancho × alto en píxeles).
// Lo usan el panel (agregar fotos) y el paso 5 de la compra. El servidor no
// vuelve a medir: guarda lo que mandó el navegador y con eso decide si la foto
// alcanza para el libro o para un marco (`calidadDeFoto`).
export async function medirImagen(archivo: File): Promise<{ ancho: number; alto: number } | null> {
  try {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.src = url;
    await img.decode();
    URL.revokeObjectURL(url);
    return { ancho: img.naturalWidth, alto: img.naturalHeight };
  } catch {
    return null; // si el navegador no la decodifica se sube igual, sin medir (el servidor valida el tipo)
  }
}
