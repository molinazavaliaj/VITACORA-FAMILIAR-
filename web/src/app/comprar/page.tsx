import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { obtenerPrecio } from "@/lib/precios";
import { extrasDisponibles, NOMBRE_BASE } from "@/lib/productos";
import { Toroide } from "../marca";
import { Checkout, type Catalogo } from "./formulario";

// La compra, pública y sin cuenta (pago por adelantado, 11/09). Paso a paso
// como la referencia (Remento): para quién → el narrador → extras → correo y
// pago. Todo lo que antes hacían /registro + /comprar-con-sesión pasa por acá.
//
// El catálogo se arma en el servidor (los precios viven en variables de
// entorno) y baja al cliente ya resuelto: el navegador nunca decide un precio.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--fuente-cuerpo", display: "swap" });

export const metadata: Metadata = {
  title: "Comprar el libro",
  description: "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida. Pago único.",
};

function catalogoDe(region: "ES" | "AR") {
  const { monto, moneda } = obtenerPrecio(region);
  return {
    moneda,
    base: { nombre: NOMBRE_BASE, precio: monto },
    extras: extrasDisponibles(region),
  };
}

export default function PaginaComprar() {
  const catalogo: Catalogo = { ES: catalogoDe("ES"), AR: catalogoDe("AR") };

  return (
    <div className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex flex-1 flex-col bg-[#F7F7F5] text-[#14140F]`}>
      <header className="border-b border-[#EBEBE7] bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <Toroide className="h-6 w-auto" />
            <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
          </Link>
          <Link href="/entrar" className="text-sm text-[#5F5F55] underline decoration-[#D4D4CE] underline-offset-4 hover:text-[#14140F] [font-family:var(--fuente-micro)]">
            Ya compré · Entrar
          </Link>
        </div>
      </header>

      <Checkout catalogo={catalogo} />
    </div>
  );
}
