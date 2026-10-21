import type { Metadata } from "next";
import { Cuaderno } from "../_cuaderno/cuaderno";
import { TEXTOS_CUADERNO } from "../_textos/cuaderno";

// /cuaderno (21/10): la página del QR de «El cuaderno de su vida». Archivo
// fino: todo vive en _cuaderno/cuaderno.tsx. Solo España, noindex, fuera del
// menú y del sitemap: es para quien escanea el QR.

export const metadata: Metadata = {
  title: { absolute: TEXTOS_CUADERNO.meta.titulo },
  description: TEXTOS_CUADERNO.meta.descripcion,
  robots: { index: false, follow: false },
};

export default function PaginaCuaderno() {
  return <Cuaderno />;
}
