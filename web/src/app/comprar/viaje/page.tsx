import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { catalogo } from "@/lib/productos";
import { regionDelRequest } from "@/lib/region";
import { promoPorcentaje } from "@/lib/promo";
import { headers } from "next/headers";
import { Toroide } from "../../marca";
import { CheckoutViaje, type CatalogoViaje } from "./formulario";

// La Vitácora de viaje (docs/vitacora-de-viaje.md, 18/09): producto aparte, con
// su compra propia en tres pasos — vos · el viaje · pagar. El resto (pago,
// cuenta, panel, bot) es el mismo camino que el libro de una vida.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--fuente-cuerpo", display: "swap" });

export const metadata: Metadata = {
  title: "Vitácora de viaje",
  description: "Tu biógrafo te escribe cada noche del viaje, guarda tus fotos y, al volver, tu viaje es un libro.",
};

export default async function PaginaComprarViaje() {
  // El catálogo por región: la base del viaje y los mismos upsells del Familiar (21/09).
  const catalogos: CatalogoViaje = { ES: catalogo("ES"), AR: catalogo("AR") };
  return (
    <div className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex flex-1 flex-col bg-[#F7F7F5] text-[#14140F]`}>
      <header className="border-b border-[#EBEBE7] bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/viaje" className="flex items-center gap-3">
            <Toroide className="h-6 w-auto" />
            <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora de viaje</span>
          </Link>
          <Link href="/entrar" className="text-sm text-[#5F5F55] underline decoration-[#D4D4CE] underline-offset-4 hover:text-[#14140F] [font-family:var(--fuente-micro)]">
            Ya compré · Entrar
          </Link>
        </div>
      </header>
      <CheckoutViaje catalogo={catalogos} regionInicial={regionDelRequest(await headers())} promo={promoPorcentaje()} />
    </div>
  );
}
