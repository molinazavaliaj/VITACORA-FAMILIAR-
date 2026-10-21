import type { Metadata } from "next";
import Link from "next/link";
import { esIdiomaWeb, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_CUPON } from "../../_textos/cupon";
import { CascaronCheckout } from "../../_checkout/cascaron";
import { clasesBoton } from "../../_ui";

// Después de la baja de un clic de los recordatorios del cupón (20/10). La
// baja ya la hizo /api/cupon/baja; esto solo lo cuenta, en el idioma de la fila.

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cupón de bienvenida", robots: { index: false } };

export default async function BajaCupon({ searchParams }: PageProps<"/cupon/baja">) {
  const { listo, idioma: crudo } = await searchParams;
  const idioma: IdiomaWeb = esIdiomaWeb(crudo) ? crudo : "es";
  const P = TEXTOS_CUPON[idioma].paginas;
  const ok = listo === "1";
  return (
    <CascaronCheckout idioma={idioma}>
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 pb-28 pt-14 sm:px-8 sm:pt-20">
        {ok ? <h1 className="chk-h1">{P.bajaTitulo}</h1> : null}
        <p className="chk-bajada">{ok ? P.bajaTexto : P.bajaMal}</p>
        <Link href={ruta(idioma, "/")} className={clasesBoton("fantasma", "min-h-14 self-start px-7")}>
          {P.volver}
        </Link>
      </main>
    </CascaronCheckout>
  );
}
