import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Direccion } from "../_direccion/direccion";

// Prototipo de dirección visual de la portada (13/10), para que Naza lo compare
// con / en la preview. Como /sistema: en producción no existe (404) y nunca se
// indexa.

export const metadata: Metadata = {
  title: "Prueba de dirección",
  robots: { index: false, follow: false },
};

export default function PaginaPruebaDireccion() {
  // Se decide al construir (3.ª vuelta): Vercel construye aparte cada entorno,
  // así que en producción la página sale como 404 y en la preview, estática
  // como la portada real. Antes se decidía en cada request (connection(),
  // como /sistema), pero eso la volvía dinámica: el HTML llegaba en partes y
  // el primer pintado salía ~0,5 s más tarde, y la comparación con / no era
  // pareja.
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main className="flex flex-1 flex-col">
      <Direccion />
    </main>
  );
}
