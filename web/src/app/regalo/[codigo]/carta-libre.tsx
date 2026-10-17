import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import type { IdiomaRegalo } from "@/lib/regalo-textos";
import { textosCartaLibre } from "@/lib/carta-textos";
import { Toroide } from "../../marca";

// La carta de un local que nadie pagó todavía (spec 2026-10-17 §3). La abre
// quien la tiene en la mano: casi siempre quien la va a regalar. Sin precio:
// el precio aparece en /regalar.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], variable: "--fuente-cuerpo", display: "swap" });

export function CartaLibre({ codigo, idioma }: { codigo: string; idioma: IdiomaRegalo }) {
  const T = textosCartaLibre(idioma);
  const c = encodeURIComponent(codigo);
  return (
    <div lang={idioma === "ca" ? "ca" : "es"} className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} min-h-full bg-white text-[#14140F] [font-family:var(--fuente-cuerpo)]`}>
      <main className="mx-auto w-full max-w-[28rem] p-6 pb-12">
        <header className="flex items-center gap-3">
          <Toroide className="h-7 w-7" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
        </header>
        <h1 className="mt-12 text-[28px] font-medium leading-tight [font-family:var(--fuente-titulo)] [text-wrap:balance]">{T.titulo}</h1>
        <p className="mt-6 text-[17px] font-light leading-relaxed">{T.cuerpo}</p>
        <Link href={`/regalar?codigo=${c}`} className="mt-10 flex h-14 w-full items-center justify-center rounded-full bg-[#5D3FD3] text-[17px] font-medium text-white transition-colors hover:bg-[#4F35BC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D3FD3] [font-family:var(--fuente-micro)]">
          {T.regalarla}
        </Link>
        <p className="mt-6 text-center">
          <Link href={`/comprar?carta=${c}`} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">{T.paraVos}</Link>
        </p>
        <p className="mt-10 text-[14px] text-[#83837A]">{T.siTeLaRegalaron}</p>
        <p className="mt-2 text-[13px] tracking-[0.2em] text-[#83837A] [font-family:var(--fuente-micro)]">{codigo}</p>
      </main>
    </div>
  );
}
