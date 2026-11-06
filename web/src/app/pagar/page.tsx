import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { esIdiomaWeb, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { leerFormularioPago } from "@/lib/pago-embebido";
import { CascaronCheckout } from "../_checkout/cascaron";
import { FORMULARIO_PAGO } from "../_textos/checkout";
import { FormularioPago } from "./formulario-pago";

// El pago de España sin salir de la web (lib/pago-embebido.ts). Solo se llega
// desde «Pagar», con un enlace firmado de una hora.

export const metadata: Metadata = { title: "Pago", robots: { index: false } };

export default async function Pagar({ searchParams }: PageProps<"/pagar">) {
  const { s, v, t, idioma: crudo } = await searchParams;
  const idioma: IdiomaWeb = esIdiomaWeb(crudo) ? crudo : "es";
  const formulario = await leerFormularioPago({ s, v, t }, ruta(idioma, "/comprar"));
  if (formulario.tipo === "ir") redirect(formulario.a);

  const T = FORMULARIO_PAGO[idioma];
  const viaje = formulario.volver.includes("/viaje");
  return (
    <CascaronCheckout idioma={idioma} inicio={viaje ? "/viaje" : "/"} viaje={viaje}>
      <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-8 px-4 pb-28 pt-14 sm:px-8 sm:pt-20">
        <div className="flex flex-col gap-4">
          <Link href={formulario.volver} className="chk-bajada min-h-11 underline underline-offset-4">
            ← {T.volver}
          </Link>
          <h1 className="chk-h1">{T.titulo}</h1>
        </div>
        <FormularioPago clavePublica={formulario.clavePublica} secretoSesion={formulario.secretoSesion} noCarga={T.noCarga} />
      </main>
    </CascaronCheckout>
  );
}
