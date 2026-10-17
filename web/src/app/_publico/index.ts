// Las piezas públicas compartidas del rediseño 2026-10 (fase 1): cabecera,
// pie, botón de WhatsApp de dudas y el selector de idioma. Las usan la
// portada, /ejemplo y el checkout. Carpeta privada de Next (no es una ruta).
// Sus textos viven en ../_textos/publico.ts.

export { Cabecera, Solapas, SelectorIdioma, type Producto, type PropsCabecera } from "./cabecera";
export { Pie } from "./pie";
export { WhatsAppFlotante, IconoWhatsApp } from "./whatsapp-flotante";
// guardarIdioma (la cookie) se importa directo de ./idioma-cliente, desde otro
// componente cliente: desde el servidor no se puede llamar.
export { EnlaceIdioma, SugerenciaCatalan } from "./idioma-cliente";
