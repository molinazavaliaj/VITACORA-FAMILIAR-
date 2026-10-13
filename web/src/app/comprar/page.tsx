import type { Metadata } from "next";
import Link from "next/link";
import { catalogo } from "@/lib/productos";
import { regionDelRequest } from "@/lib/region";
import { promoPorcentaje } from "@/lib/promo";
import { headers } from "next/headers";
import { Toroide } from "../marca";
import { Checkout, type Catalogo } from "./formulario";

// La compra, pública y sin cuenta (pago por adelantado, 11/09). Paso a paso:
// para quién → el narrador → tu correo → pagar. El último paso muestra los
// dos productos —PDF, impreso— y pide al menos uno (13/09; el audiolibro salió el 21/09,
// docs/panel-usuario.md §15.1). Todo lo que antes hacían /registro +
// /comprar-con-sesión pasa por acá.
//
// El catálogo se arma en el servidor (los precios viven en variables de
// entorno) y baja al cliente ya resuelto: el navegador nunca decide un precio.

export const metadata: Metadata = {
  title: "Comprar el libro",
  description: "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida. Pago único.",
};

export default async function PaginaComprar() {
  const catalogos: Catalogo = { ES: catalogo("ES"), AR: catalogo("AR") };

  return (
    <div className="flex flex-1 flex-col bg-[#F7F7F5] text-[#14140F]">
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

      <Checkout catalogo={catalogos} regionInicial={regionDelRequest(await headers())} promo={promoPorcentaje()} />
    </div>
  );
}
