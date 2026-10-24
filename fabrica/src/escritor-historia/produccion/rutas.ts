// Dónde deja sus cosas el libro de una historia en Storage (bucket `audios`).
export const PREFIJO_HISTORIA = (id: string): string => `${id}/escritor-historia`;
export const RUTA_LIBRO_MD_HISTORIA = (id: string): string => `${PREFIJO_HISTORIA(id)}/libro.md`;
export const RUTA_LIBRO_PDF_HISTORIA = (id: string): string => `${id}/paquete/libro.pdf`;
export const RUTA_LIBRO_HTML_HISTORIA = (id: string): string => `${id}/paquete/libro.html`;
