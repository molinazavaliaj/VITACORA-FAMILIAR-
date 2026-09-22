"use client";

import type { ReactNode } from "react";
import type { Moneda, Catalogo, Carrito, Compra } from "@/lib/productos";
import { DETALLE_IMPRESO, DETALLE_MARCO } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import { precioDeLista } from "@/lib/promo";
import { Tachado } from "./tachado";

// Las piezas del carrito, compartidas por los dos checkouts y por Encargar
// libro (catálogo base + upsells, 21/09): la base fija, el contador de libros
// impresos y el contador de marcos. El precio de cada línea lo calcula la
// misma función que cobra el servidor (`armarCompra`); acá solo se muestra.
//
// `trato` (22/09, lo vio Naza): el checkout del Familiar habla en **castellano
// neutro de "tú"** y el de viaje y el panel, en **vos**. Como las piezas son
// las mismas, la voz viaja como dato. Los mensajes de error salen del servidor
// (`validarCarrito`) y por eso están escritos impersonales.
//
// ⚠️ Textos a revisar por Naza (21/09).

export type Trato = "tu" | "vos";

/** Las palabras que cambian entre "tú" y "vos". */
const VOZ: Record<Trato, { suma: string; tenes: string; marcosGris: string }> = {
  // "Añade" y no "Suma": en España suena natural (lo pidió Naza, 22/09).
  tu: { suma: "Añade", tenes: "Ya tienes", marcosGris: "Los marcos viajan con el libro: añade el libro impreso para agregar marcos." },
  vos: { suma: "Sumá", tenes: "Ya tenés", marcosGris: "Los marcos viajan con el libro: sumá el libro impreso para agregar marcos." },
};

export function formatearPrecio(monto: number, moneda: Moneda, region: Region) {
  return new Intl.NumberFormat(region === "ES" ? "es-ES" : "es-AR", { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(monto);
}

/** El precio de lista de la promo, ya formateado, para `Tachado`. */
export function listaDe(precio: number, moneda: Moneda, region: Region, porcentaje: number): { texto: string; porcentaje: number } {
  return { texto: formatearPrecio(precioDeLista(precio, moneda, porcentaje), moneda, region), porcentaje };
}

/** La base: siempre en el carrito, sin botón de sacar. */
export function BaseFija({ nota, titulo, detalle, precio, lista, incluye }: { nota: string; titulo: string; detalle: string; precio: string; lista?: { texto: string; porcentaje: number } | null; incluye?: string[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#14140F] bg-white p-5">
      <span className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">{nota}</span>
        <span className="rounded-full bg-[#14140F] px-2.5 py-0.5 text-[10px] uppercase text-white [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">incluido</span>
      </span>
      <span className="block text-[21px] leading-tight [font-family:var(--fuente-titulo)] font-medium">{titulo}</span>
      <span className="block text-[14px] leading-[1.6] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{detalle}</span>
      {incluye && incluye.length > 0 ? (
        <ul className="flex flex-col gap-1 text-[13px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
          {incluye.map((i) => <li key={i}>✓ {i}</li>)}
        </ul>
      ) : null}
      <span className="mt-auto block pt-2 text-[24px] tabular-nums [font-family:var(--fuente-titulo)]">
        {lista ? <Tachado lista={lista.texto} porcentaje={lista.porcentaje} className="mr-2" /> : null}
        {precio}
      </span>
    </div>
  );
}

/** Un contador − n + con título, detalle y la regla de precio ("el primero +49, los siguientes +40"). */
export function Contador({ titulo, detalle, regla, valor, onChange, max = 20, deshabilitado = false, motivo, children }: {
  titulo: string;
  detalle: string;
  regla: string;
  valor: number;
  onChange: (n: number) => void;
  max?: number;
  deshabilitado?: boolean;
  /** Por qué está en gris ("sumá el libro impreso para agregar marcos"). */
  motivo?: string | null;
  children?: ReactNode;
}) {
  const activo = valor > 0;
  return (
    <div className={`flex flex-wrap items-center gap-4 rounded-xl border bg-white p-5 transition-opacity ${activo ? "border-[#14140F]" : "border-[#D4D4CE]"} ${deshabilitado ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] [font-family:var(--fuente-micro)] font-medium">{titulo}</p>
        <p className="mt-1 text-[14px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{detalle}</p>
        <p className="mt-1 text-[13px] text-[#83837A] [font-family:var(--fuente-micro)]">{deshabilitado && motivo ? motivo : regla}</p>
        {children}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Uno menos: ${titulo}`} disabled={deshabilitado || valor <= 0} onClick={() => onChange(Math.max(0, valor - 1))} className="h-9 w-9 rounded-full border border-[#D4D4CE] text-lg disabled:opacity-40 [touch-action:manipulation]">−</button>
        <span className="w-6 text-center text-[16px] tabular-nums [font-family:var(--fuente-micro)]">{valor}</span>
        <button type="button" aria-label={`Uno más: ${titulo}`} disabled={deshabilitado || valor >= max} onClick={() => onChange(Math.min(max, valor + 1))} className="h-9 w-9 rounded-full border border-[#D4D4CE] text-lg disabled:opacity-40 [touch-action:manipulation]">+</button>
      </div>
    </div>
  );
}

/**
 * Los dos upsells sobre un catálogo ya resuelto. `previos` = lo que el
 * comprador ya tiene (panel post-venta); en el checkout, 0. Los marcos se
 * habilitan solo con impreso (viajan juntos).
 */
export function Upsells({ cat, region, carrito, setCarrito, propia = false, trato = "vos" }: {
  cat: Catalogo;
  region: Region;
  carrito: Carrito;
  setCarrito: (f: (c: Carrito) => Carrito) => void;
  /** "tu voz" en vez de "su voz": autobiografía o viaje. */
  propia?: boolean;
  /** "tú" en el checkout del Familiar; "vos" en el de viaje y en el panel. */
  trato?: Trato;
}) {
  const voz = VOZ[trato];
  const f = (n: number) => formatearPrecio(n, cat.moneda, region);
  const impresosPrevios = carrito.impresosPrevios ?? 0;
  const marcosPrevios = carrito.marcosPrevios ?? 0;
  const hayImpreso = impresosPrevios + carrito.impresos > 0;
  const reglaImpreso = cat.impreso
    ? impresosPrevios > 0
      ? cat.impreso.precioCopia !== null ? `Cada copia extra +${f(cat.impreso.precioCopia)}.` : `${voz.tenes} el libro impreso.`
      : cat.impreso.precioCopia !== null ? `El primero +${f(cat.impreso.precio)}; cada copia extra +${f(cat.impreso.precioCopia)}.` : `+${f(cat.impreso.precio)}.`
    : "";
  const reglaMarco = cat.marco
    ? marcosPrevios > 0
      ? cat.marco.precioAdicional !== null ? `Cada marco +${f(cat.marco.precioAdicional)}.` : `${voz.tenes} tu marco.`
      : cat.marco.precioAdicional !== null ? `El primero +${f(cat.marco.precio)}; los siguientes +${f(cat.marco.precioAdicional)}.` : `+${f(cat.marco.precio)}.`
    : "";
  const maxImpresos = cat.impreso?.precioCopia === null ? (impresosPrevios > 0 ? 0 : 1) : 20;
  const maxMarcos = cat.marco?.precioAdicional === null ? (marcosPrevios > 0 ? 0 : 1) : 20;
  return (
    <div className="flex flex-col gap-4">
      {cat.impreso ? (
        <Contador
          titulo={impresosPrevios > 0 ? "Otra copia impresa" : `${voz.suma} el libro impreso`}
          detalle={propia ? DETALLE_IMPRESO.replace("su voz", "tu voz") : DETALLE_IMPRESO}
          regla={reglaImpreso}
          valor={carrito.impresos}
          max={maxImpresos}
          onChange={(n) => setCarrito((c) => ({ ...c, impresos: n, marcos: n + impresosPrevios > 0 ? c.marcos : 0 }))}
        />
      ) : null}
      {cat.marco ? (
        <Contador
          titulo={marcosPrevios > 0 ? "Otro marco" : `${voz.suma} marcos con su voz`}
          detalle={propia ? DETALLE_MARCO.replace("su foto", "tu foto").replace("su voz", "tu voz") : DETALLE_MARCO}
          regla={reglaMarco}
          valor={carrito.marcos}
          max={maxMarcos}
          deshabilitado={!hayImpreso}
          motivo={voz.marcosGris}
          onChange={(n) => setCarrito((c) => ({ ...c, marcos: n }))}
        />
      ) : null}
    </div>
  );
}

/** El ticket: una línea por cosa y el total. */
export function Ticket({ compra, region, titulo = "Tu compra", nota }: { compra: Compra; region: Region; titulo?: string; nota?: string }) {
  const f = (n: number) => formatearPrecio(n, compra.moneda, region);
  return (
    <div>
      <p className="text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">{titulo}</p>
      <div className="mt-5 flex flex-col gap-2 border-b border-[#EBEBE7] pb-3">
        {compra.lineas.map((l) => (
          <div key={l.id} className="flex items-baseline justify-between gap-4">
            <span className="text-[15px] [font-family:var(--fuente-cuerpo)] font-light">{l.nombre}{l.cantidad > 1 ? ` × ${l.cantidad}` : ""}{nota && (l.id === "pdf" || l.id === "viaje") ? ` · ${nota}` : ""}</span>
            <span className="shrink-0 text-[15px] [font-family:var(--fuente-micro)]">{f(l.cantidad * l.precioUnitario)}</span>
          </div>
        ))}
        {compra.lineas.length === 0 ? <p className="text-[14px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">Nada elegido todavía.</p> : null}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <span className="text-[15px] [font-family:var(--fuente-micro)] font-medium">Total</span>
        <span className="shrink-0 text-[20px] tabular-nums [font-family:var(--fuente-titulo)] font-medium">{f(compra.total)}</span>
      </div>
    </div>
  );
}
