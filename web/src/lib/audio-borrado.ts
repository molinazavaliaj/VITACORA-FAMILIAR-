// Qué se le dice a la familia cuando el audio original ya no está (19/10).
//
// A los 3 meses del libro los audios originales se borran, avisando antes por
// mail con todos para descargar (fabrica/src/audios-originales.ts). El archivo
// desaparece de Storage pero `respuestas.audio_path` queda en la base, así que
// la URL se firma igual y el navegador no encuentra nada: hasta hoy, al tocar
// play no pasaba nada y la familia no sabía por qué.
//
// La ruta /api/audio/[id] devuelve 410 con la fecha, y esto la convierte en una
// frase. Pura a propósito: el reproductor es un componente de cliente y así la
// decisión se puede probar sin montar un navegador.

/** El candado que deja la fábrica al borrar los audios de un narrador. */
export const CANDADO_BORRADO = "audios_borrados.txt";

/** Dónde vive ese candado, dentro del bucket de audios. */
export const rutaCandado = (narradorId: string) => `${narradorId}/paquete/${CANDADO_BORRADO}`;

/**
 * La frase para el reproductor, o null si el audio no está borrado.
 *
 * Sin trato de por medio (ni tú ni vos): el reproductor se usa en seis
 * pantallas y ninguna le pasa la región.
 *
 * APROBADO por Naza el 19/10, con su redacción.
 */
export function textoAudioBorrado(borradoEl: string | null | undefined): string | null {
  if (!borradoEl) return null;
  const fecha = new Date(borradoEl);
  // «acá» no va: la misma pantalla la ven en España (Naza, 19/10).
  const cola = "Sus frases de «Su voz» se pueden seguir escuchando.";
  // Una fecha que no se entiende no se inventa: se dice lo que sí sabemos.
  if (Number.isNaN(fecha.getTime())) return `Este audio ya no está. ${cola}`;
  const cuando = fecha.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  return `Este audio se borró el ${cuando}. ${cola}`;
}
