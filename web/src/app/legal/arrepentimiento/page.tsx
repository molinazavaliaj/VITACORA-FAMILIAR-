import { PaginaLegal, metadataLegal } from "../pagina";

// El «Botón de arrepentimiento» que exige la Resolución 424/2020 (Argentina):
// un enlace con esa leyenda, de acceso fácil desde la página de inicio, que
// permita revocar la compra sin trabas. En España la misma página se llama
// «Desistimiento». Es un mailto con el asunto y el cuerpo prellenados: no hay
// formulario que fallar, y la respuesta (dentro de las 24 h) la da una
// persona por el mismo correo.

export const metadata = metadataLegal("es", "arrepentimiento");

export default function Arrepentimiento() {
  return <PaginaLegal idioma="es" documento="arrepentimiento" />;
}
