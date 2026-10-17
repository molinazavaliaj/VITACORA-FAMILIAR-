import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { resumenPorMes, type PedidoDelLocal } from "@/lib/cartas";
import { textosPanelLocal } from "@/lib/carta-textos";
import type { IdiomaRegalo } from "@/lib/regalo-textos";
import { Toroide } from "../../marca";

// El panel de solo lectura del local (spec regalo en locales, 17/10): sin login,
// el token de la URL es la llave. Muestra cuántos libritos se le dejaron, cuántas
// cartas se pagaron por mes y lo que le toca. No tiene botones ni formularios.

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500"], style: ["normal", "italic"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], variable: "--fuente-cuerpo", display: "swap" });

type Local = { id: string; nombre: string; idioma: IdiomaRegalo; pais: "ES" | "AR" };

export default async function PanelLocal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = crearClienteServidor();

  const { data: local } = await admin.from("locales").select("id, nombre, idioma, pais").eq("token_panel", token).maybeSingle<Local>();
  if (!local) notFound();

  const { data: lotes, error: errorLotes } = await admin.from("lotes_impresos").select("cantidad").eq("local_id", local.id);
  // Si la base falla, mejor la pantalla de error de Next que un "0 libritos" falso.
  if (errorLotes) throw new Error(`panel local: no pude leer los lotes: ${errorLotes.message}`);
  const libritos = ((lotes ?? []) as { cantidad: number }[]).reduce((s, l) => s + Number(l.cantidad), 0);

  const { data: pedidos, error: errorPedidos } = await admin
    .from("pedidos")
    .select("created_at, comision_local, monto, moneda")
    .eq("local_id", local.id)
    .neq("estado", "pendiente");

  if (errorPedidos) throw new Error(`panel local: no pude leer los pedidos: ${errorPedidos.message}`);

  const es = local.pais === "ES";
  const filas = resumenPorMes((pedidos ?? []) as PedidoDelLocal[], es ? "Europe/Madrid" : "America/Argentina/Buenos_Aires");
  const t = textosPanelLocal(local.idioma);
  const plata = (n: number, moneda: string) => new Intl.NumberFormat(es ? "es-ES" : "es-AR", { style: "currency", currency: moneda }).format(n);

  return (
    <div lang={local.idioma === "ca" ? "ca" : "es"} className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} min-h-full bg-white text-[#14140F] [font-family:var(--fuente-cuerpo)]`}>
      <main className="mx-auto w-full max-w-[28rem] p-6 pb-12">
        <header className="flex items-center gap-3">
          <Toroide className="h-7 w-7" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
        </header>

        <h1 className="mt-12 text-[28px] font-medium leading-tight [font-family:var(--fuente-titulo)] [text-wrap:balance]">{t.titulo(local.nombre)}</h1>
        <p className="mt-4 text-[17px] font-light leading-relaxed">{t.libritos(libritos)}</p>

        {filas.length === 0 ? (
          <p className="mt-8 text-[17px] font-light leading-relaxed">{t.sinVentas}</p>
        ) : (
          <table className="mt-8 w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-[#14140F] text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.15em]">
                <th className="py-2 font-normal">{t.mes}</th>
                <th className="py-2 font-normal">{t.cartas}</th>
                <th className="py-2 text-right font-normal">{t.teToca}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={`${f.mes}-${f.moneda}`} className="border-b border-[#14140F]/20">
                  <td className="py-3">{f.mes}</td>
                  <td className="py-3">{f.cartas}</td>
                  <td className="py-3 text-right">{plata(f.comision, f.moneda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-8 text-[14px] font-light leading-relaxed">{t.pago}</p>
      </main>
    </div>
  );
}
