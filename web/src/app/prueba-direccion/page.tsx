import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Direccion } from "../_direccion/direccion";

// Prototipo de dirección visual de la portada (13/10), para que Naza lo compare
// con / en la preview. Como /sistema: en producción no existe (404) y nunca se
// indexa.

export const metadata: Metadata = {
  title: "Prueba de dirección",
  robots: { index: false, follow: false },
};

export default async function PaginaPruebaDireccion() {
  // Se decide en cada request: la misma build sirve en local y en la preview,
  // y en producción da 404.
  await connection();
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main className="flex flex-1 flex-col">
      <Direccion />
    </main>
  );
}
