import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { catalogo } from "@/lib/productos";
import { regionDelRequest } from "@/lib/region";
import { idiomaPorDefecto, textosComprador, tratoDeRegion } from "@/lib/regalo-textos";
import { entregaWhatsAppPrendida } from "@/lib/regalo-entrega";
import { Toroide } from "../marca";
import { FormularioRegalo } from "./formulario";

// La compra del regalo (plan 2026-10-07-gift-card, Task 8): pública y sin
// cuenta, como /comprar. La región sale del país del visitante y decide
// moneda y pasarela; no hay bloqueo por país (decisión de Naza): cualquiera
// puede regalar. El catálogo se arma acá porque los precios viven en
// variables de entorno: el navegador nunca decide un precio.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--fuente-cuerpo", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const region = regionDelRequest(await headers());
  return { title: textosComprador(tratoDeRegion(region)).tituloPagina };
}

// Quien compra lee de vos (AR) o de tú (ES); el idioma del regalo arranca en
// el de su región y lo puede cambiar en el paso 1 (plan 2026-10-09-regalo-idiomas).
export default async function PaginaRegalar() {
  const region = regionDelRequest(await headers());
  const trato = tratoDeRegion(region);
  const T = textosComprador(trato);
  return (
    <div className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex flex-1 flex-col bg-[#F7F7F5] text-[#14140F]`}>
      <header className="border-b border-[#EBEBE7] bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Toroide className="h-6 w-auto" />
            <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
          </Link>
          <Link href="/entrar" className="text-sm text-[#5F5F55] underline decoration-[#D4D4CE] underline-offset-4 hover:text-[#14140F] [font-family:var(--fuente-micro)]">
            {T.yaCompre}
          </Link>
        </div>
      </header>
      <FormularioRegalo catalogo={catalogo(region)} region={region} trato={trato} idiomaInicial={idiomaPorDefecto(region)} entregaWhatsApp={entregaWhatsAppPrendida()} />
    </div>
  );
}
