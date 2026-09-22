"use client";

import { useMemo, useState } from "react";
import { armarCompra, type Carrito, type Catalogo } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import { Ticket, Upsells, formatearPrecio } from "../../../comprar/productos-ui";

// Sumar cosas a un libro que ya existe (catálogo base + upsells, 21/09): las
// MISMAS piezas y la misma función de precios que el checkout, sin base (ya la
// tiene). Lo que este comprador ya tiene (`previos`) decide si paga el primer
// impreso (+49) o copias (+40), el primer marco (+20) o adicionales (+15). El
// precio se muestra acá y se recalcula en el servidor para cobrarlo: nunca se
// confía en el número del navegador.

const boton = "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";
const etiqueta = "text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]";

export function Extras({ narradorId, region, catalogo, previos, titulo = "Sumar", propia = false }: {
  narradorId: string;
  region: Region;
  catalogo: Catalogo;
  /** Lo que este comprador ya tiene de este libro. */
  previos: { impresos: number; marcos: number };
  titulo?: string;
  propia?: boolean;
}) {
  const [carritoElegido, setCarrito] = useState<Carrito>({ base: null, impresos: 0, marcos: 0, impresosPrevios: previos.impresos, marcosPrevios: previos.marcos });
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const compra = useMemo(() => armarCompra(catalogo, region, carritoElegido), [catalogo, region, carritoElegido]);

  if (!catalogo.impreso && !catalogo.marco) {
    return <p className="text-sm text-[var(--texto-menor)]">El impreso y los marcos todavía no tienen precio cargado. Pronto.</p>;
  }

  async function pagar() {
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch(`/api/extras?narrador=${encodeURIComponent(narradorId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impresos: carritoElegido.impresos, marcos: carritoElegido.marcos }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; urlPago?: string };
      if (!r.ok || !j.urlPago) throw new Error(j.error ?? "No pudimos iniciar el pago.");
      window.location.href = j.urlPago;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar el pago.");
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className={etiqueta}>{titulo}</p>
      <Upsells cat={catalogo} region={region} carrito={carritoElegido} setCarrito={setCarrito} propia={propia} />
      {compra.lineas.length > 0 ? (
        <div className="rounded-xl border border-[var(--linea)] p-5">
          <Ticket compra={compra} region={region} titulo="Lo que sumás" />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className={`${boton} bg-[var(--texto)] text-[var(--fondo)] hover:opacity-90`} disabled={ocupado || compra.total <= 0} onClick={pagar}>
          {ocupado ? "Un momento…" : compra.total > 0 ? `Pagar ${formatearPrecio(compra.total, compra.moneda, region)}` : "Elegí qué sumar"}
        </button>
        <span className="text-sm text-[var(--texto-menor)]">Pago único. Envío incluido en lo físico.</span>
      </div>
      {error ? <p className="text-sm text-[var(--alerta)]" role="alert">{error}</p> : null}
    </div>
  );
}
