import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { creadoresPrendido, estadoDeComision, pareceTokenPanel, resumenDeComisiones, type PorMoneda } from "@/lib/creadores";
import { panelDelCreador } from "@/lib/creadores-base";
import { urlCompartirCreador } from "@/lib/mail-creadores";
import { langDeIdioma, localeDeIdioma, ruta } from "@/lib/idioma-web";
import { TEXTOS_COLABORA } from "../../_textos/colabora";
import { Toroide } from "../../marca";
import { BotonCopiar } from "./copiar";

// El panel privado del creador (programa de creadores, 21/10): sin login, el
// token de la URL es la llave (como /local/<token> de la rama regalo-locales).
// Muestra su código, el link para compartir, el descuento que da, la comisión
// que le toca, sus ventas (fecha y comisión: NINGÚN dato del cliente) y lo
// que tiene en espera (los 14 días desde la compra), por cobrar y cobrado. Pausado ve el panel con un aviso; pendiente,
// rechazado o un token que no existe, 404. Sin CREADORES=1, 404.

export const dynamic = "force-dynamic";

type Estados = (typeof TEXTOS_COLABORA)["es"]["panel"]["estados"];
/** El estado que ve el creador (las anuladas ni llegan: panelDelCreador las deja afuera). */
const ESTADO_VISIBLE = {
  en_espera: (e: Estados) => e.enEspera,
  por_cobrar: (e: Estados) => e.pendiente,
  pagada: (e: Estados) => e.pagada,
  anulada: () => "",
} as const;
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PanelCreador({ params }: PageProps<"/creador/[token]">) {
  const { token } = await params;
  if (!creadoresPrendido() || !pareceTokenPanel(token)) notFound();

  const r = await panelDelCreador(crearClienteServidor(), token);
  // Si la base falla, mejor la pantalla de error de Next que un «sin ventas» falso.
  if (!r.ok) throw new Error(`panel creador: no pude leerlo (${r.falla})`);
  if (!r.valor) notFound();

  const { creador: c, ventas } = r.valor;
  if (!c.codigo) notFound();
  const t = TEXTOS_COLABORA[c.idioma].panel;
  const locale = localeDeIdioma(c.idioma);
  const plata = (n: number, moneda: string) => new Intl.NumberFormat(moneda === "ARS" ? "es-AR" : locale, { style: "currency", currency: moneda }).format(n);
  const suma = (p: PorMoneda) => {
    const partes = Object.entries(p).map(([moneda, n]) => plata(n, moneda));
    return partes.length === 0 ? plata(0, c.region === "AR" ? "ARS" : "EUR") : partes.join(" + ");
  };
  const fecha = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: c.region === "AR" ? "America/Argentina/Buenos_Aires" : "Europe/Madrid" }).format(new Date(iso));
  const ahora = new Date();
  const totales = resumenDeComisiones(ventas, ahora);
  const link = urlCompartirCreador(c.idioma, c.codigo);

  return (
    <div lang={langDeIdioma(c.idioma)} className="min-h-full bg-white text-[#14140F] [font-family:var(--fuente-cuerpo)]">
      <main className="mx-auto w-full max-w-[34rem] px-4 pb-14 pt-6 sm:px-6">
        <header className="flex items-center gap-3">
          <Toroide className="h-7 w-7" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
        </header>

        <h1 className="mt-12 text-[28px] font-medium leading-tight [font-family:var(--fuente-titulo)] [text-wrap:balance]">{t.titulo(c.nombre)}</h1>

        {c.estado === "pausado" ? (
          <p role="status" className="mt-6 rounded border border-[#8A5F10] px-4 py-3 text-[15px] leading-relaxed text-[#8A5F10]">
            {t.pausado}
          </p>
        ) : null}

        <section className="mt-8 border-y border-[#14140F]/20 py-6">
          <p className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">{t.tuCodigo}</p>
          <p className="mt-1 text-[30px] font-semibold tracking-[0.06em] [font-family:var(--fuente-micro)]">{c.codigo}</p>
          <p className="mt-2 text-[16px] font-light leading-relaxed">{c.descuento && c.descuento > 0 ? t.descuento(c.descuento) : t.sinDescuento}</p>
          {c.comision ? <p className="mt-1 text-[16px] font-light leading-relaxed">{t.comision(c.comision)}</p> : null}

          <p className="mt-6 text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">{t.link}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="min-w-0 flex-1 break-all rounded bg-[#14140F]/5 px-3 py-2 text-[14px]">{link}</code>
            <BotonCopiar texto={link} copiar={t.copiar} copiado={t.copiado} />
          </div>
        </section>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.15em]">{t.enEspera}</p>
            <p className="mt-1 text-[22px] [font-family:var(--fuente-titulo)]">{suma(totales.enEspera)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.15em]">{t.porCobrar}</p>
            <p className="mt-1 text-[22px] [font-family:var(--fuente-titulo)]">{suma(totales.porCobrar)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.15em]">{t.cobrado}</p>
            <p className="mt-1 text-[22px] [font-family:var(--fuente-titulo)]">{suma(totales.pagado)}</p>
          </div>
        </div>

        <h2 className="mt-10 text-[20px] [font-family:var(--fuente-titulo)]">{t.ventas}</h2>
        {ventas.length === 0 ? (
          <p className="mt-4 text-[16px] font-light leading-relaxed">{t.sinVentas}</p>
        ) : (
          <table className="mt-4 w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-[#14140F] text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.15em]">
                <th className="py-2 font-normal">{t.fecha}</th>
                <th className="py-2 text-right font-normal">{t.importe}</th>
                <th className="py-2 text-right font-normal">{t.estado}</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v, i) => (
                <tr key={`${v.created_at}-${i}`} className="border-b border-[#14140F]/20">
                  <td className="py-3">{fecha(v.created_at)}</td>
                  <td className="py-3 text-right tabular-nums">{plata(Number(v.importe), v.moneda)}</td>
                  <td className="py-3 text-right">{ESTADO_VISIBLE[estadoDeComision(v, ahora)](t.estados)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-8 text-[14px] font-light leading-relaxed">{t.espera}</p>
        <p className="mt-3 text-[14px] font-light leading-relaxed">{t.pago}</p>
        <p className="mt-3 text-[14px]">
          <Link prefetch={false} href={ruta(c.idioma, "/legal/creadores")} className="underline underline-offset-4">
            {t.condiciones}
          </Link>
        </p>
      </main>
    </div>
  );
}
