"use client";

import type { ReactNode } from "react";
import type { Extra, Moneda, ProductosElegidos } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import { precioDeLista } from "@/lib/promo";
import { Tachado } from "./tachado";

// Las piezas del carrito, compartidas por los dos checkouts (2.10, 21/09): la
// tarjeta de un producto, el selector B/N · color y el contador de marcos.
// Antes vivían solo en el Familiar; la Vitácora de viaje las usa igual.

export function formatearPrecio(monto: number, moneda: Moneda, region: Region) {
  return new Intl.NumberFormat(region === "ES" ? "es-ES" : "es-AR", { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(monto);
}

/** El precio de lista de la promo, ya formateado, para `Producto`/`Tachado`. */
export function listaDe(precio: number, moneda: Moneda, region: Region, porcentaje: number): { texto: string; porcentaje: number } {
  return { texto: formatearPrecio(precioDeLista(precio, moneda, porcentaje), moneda, region), porcentaje };
}

export function Producto({ activa, onClick, nota, titulo, detalle, precio, lista, children }: { activa: boolean; onClick: () => void; nota: string; titulo: string; detalle: string; precio: string; lista?: { texto: string; porcentaje: number } | null; children?: ReactNode }) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border bg-white p-5 transition-colors ${activa ? "border-2 border-[#14140F]" : "border-[#D4D4CE] hover:border-[#83837A]"}`}>
      <button type="button" onClick={onClick} aria-pressed={activa} className="flex flex-1 flex-col gap-3 text-left [touch-action:manipulation]">
        <span className="flex items-center justify-between gap-3">
          <span className="text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">{nota}</span>
          <span aria-hidden className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border ${activa ? "border-[#14140F] bg-[#14140F] text-white" : "border-[#AEAEA6]"}`}>
            {activa ? (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
            ) : null}
          </span>
        </span>
        <span className="block text-[21px] leading-tight [font-family:var(--fuente-titulo)] font-medium">{titulo}</span>
        <span className="block text-[14px] leading-[1.6] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{detalle}</span>
        <span className="mt-auto block pt-2 text-[24px] tabular-nums [font-family:var(--fuente-titulo)]">
          {lista ? <Tachado lista={lista.texto} porcentaje={lista.porcentaje} className="mr-2" /> : null}
          {precio}
        </span>
      </button>
      {children}
    </div>
  );
}

export function Segmentos({ valor, opciones, onChange }: { valor: string; opciones: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5" role="radiogroup">
      {opciones.map(([v, nombre]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={valor === v}
          onClick={() => onChange(v)}
          className={`rounded-full border px-3 py-2 text-left text-[13px] transition-colors [font-family:var(--fuente-micro)] [touch-action:manipulation] ${valor === v ? "border-[#14140F] bg-[#14140F] text-white" : "border-[#D4D4CE] hover:border-[#83837A]"}`}
        >
          {nombre}
        </button>
      ))}
    </div>
  );
}

/** El libro impreso: la tarjeta con B/N · color adentro. Solo si hay precio cargado en la región. */
export function TarjetaImpreso({ productos, setProductos, impresoBn, impresoColor, moneda, region, detalle, promo = null }: {
  productos: ProductosElegidos;
  setProductos: (f: (x: ProductosElegidos) => ProductosElegidos) => void;
  impresoBn?: Extra;
  impresoColor?: Extra;
  moneda: Moneda;
  region: Region;
  detalle: string;
  /** 8.7: el porcentaje de la promo, o null. */
  promo?: number | null;
}) {
  if (!impresoBn && !impresoColor) return null;
  const precioImpreso = (productos.impreso === "color" ? impresoColor : impresoBn)?.precio ?? impresoBn?.precio ?? impresoColor?.precio ?? 0;
  return (
    <Producto
      activa={productos.impreso !== null}
      onClick={() => setProductos((x) => ({ ...x, impreso: x.impreso ? null : impresoBn ? "bn" : "color" }))}
      nota="en tu repisa"
      titulo="El libro impreso"
      detalle={detalle}
      precio={formatearPrecio(precioImpreso, moneda, region)}
      lista={promo ? listaDe(precioImpreso, moneda, region, promo) : null}
    >
      {productos.impreso && impresoBn && impresoColor ? (
        <Segmentos
          valor={productos.impreso}
          opciones={[["bn", "Blanco y negro"], ["color", `A color · ${formatearPrecio(impresoColor.precio, moneda, region)}`]]}
          onChange={(v) => setProductos((x) => ({ ...x, impreso: v as "bn" | "color" }))}
        />
      ) : null}
    </Producto>
  );
}

/** Los marcos con NFC: de a varios. Solo si hay precio cargado en la región. */
export function ContadorMarcos({ productos, setProductos, marco, moneda, region, detalle }: {
  productos: ProductosElegidos;
  setProductos: (f: (x: ProductosElegidos) => ProductosElegidos) => void;
  marco?: Extra;
  moneda: Moneda;
  region: Region;
  /** Texto propio (el del catálogo habla del narrador en tercera persona). */
  detalle?: string;
}) {
  if (!marco) return null;
  return (
    <div className={`mt-4 flex flex-wrap items-center gap-4 rounded-xl border bg-white p-5 ${productos.marcos > 0 ? "border-[#14140F]" : "border-[#D4D4CE]"}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] [font-family:var(--fuente-micro)] font-medium">{marco.nombre}</p>
        <p className="mt-1 text-[14px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{detalle ?? marco.detalle} {formatearPrecio(marco.precio, moneda, region)} cada uno.</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Un marco menos" onClick={() => setProductos((x) => ({ ...x, marcos: Math.max(0, x.marcos - 1) }))} className="h-9 w-9 rounded-full border border-[#D4D4CE] text-lg [touch-action:manipulation]">−</button>
        <span className="w-6 text-center text-[16px] tabular-nums [font-family:var(--fuente-micro)]">{productos.marcos}</span>
        <button type="button" aria-label="Un marco más" onClick={() => setProductos((x) => ({ ...x, marcos: Math.min(20, x.marcos + 1) }))} className="h-9 w-9 rounded-full border border-[#D4D4CE] text-lg [touch-action:manipulation]">+</button>
      </div>
    </div>
  );
}
