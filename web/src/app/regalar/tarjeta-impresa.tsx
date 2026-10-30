"use client";

import { armarCompra, type Catalogo, type Compra } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import { puedeTarjetaImpresa } from "@/lib/regalo-reglas";
import type { TextosTarjetaImpresa } from "@/lib/regalo-textos";
import { A_NOMBRE_DE_MAXIMO, type TarjetaImpresa } from "@/lib/tarjeta-impresa";
import { DIRECCION_CAMPOS_ES } from "@/lib/entregas";
import { formatearPrecio } from "../comprar/productos-ui";
import { CAMPO } from "../_checkout/piezas";

// La tarjeta impresa en un sobre por correo (30/10): la casilla y la dirección
// del paso 3 de /regalar, y la cuenta del ticket. Aparte del formulario para
// probarlo sin navegador. La regla fuerte la tiene el servidor (/api/compra):
// acá se avisa antes de seguir.

/** Lo que va cargando quien compra. El país no se carga: va fijo, España. */
export type EleccionTarjeta = {
  quiere: boolean;
  aNombreDe: string;
  linea1: string;
  linea2: string;
  ciudad: string;
  provincia: string;
  cp: string;
};

export const SIN_TARJETA: EleccionTarjeta = { quiere: false, aNombreDe: "", linea1: "", linea2: "", ciudad: "", provincia: "", cp: "" };

/** Los campos de la dirección que se cargan (todos menos el país), con sus ejemplos de España. */
const CAMPOS = DIRECCION_CAMPOS_ES.filter((c) => c.id !== "pais") as readonly { id: Exclude<keyof EleccionTarjeta, "quiere" | "aNombreDe">; obligatorio: boolean; ejemplo: string }[];

/** ¿Se ofrece la tarjeta? Si la región la vende y la fecha deja tiempo. */
export function ofreceTarjeta(cat: Catalogo, fecha: string, ahora: Date): boolean {
  return cat.tarjeta !== null && puedeTarjetaImpresa(fecha, ahora);
}

/** El ticket del regalo: la base y, si la pidió, la tarjeta. La misma cuenta que el servidor. */
export function compraDelRegalo(cat: Catalogo, region: Region, conTarjeta: boolean): Compra {
  return armarCompra(cat, region, { base: "pdf", impresos: 0, marcos: 0, tarjeta: conTarjeta });
}

/** El problema de lo cargado, con el campo a marcar; null si está bien o si no la quiere. */
export function errorDeTarjeta(e: EleccionTarjeta, T: TextosTarjetaImpresa): { texto: string; campo: string } | null {
  if (!e.quiere) return null;
  if (!e.aNombreDe.trim()) return { texto: T.faltaANombreDe, campo: "tarjeta-aNombreDe" };
  for (const c of CAMPOS) {
    if (c.obligatorio && !e[c.id].trim()) return { texto: T.faltaCampo(T.campos[c.id]), campo: `tarjeta-${c.id}` };
  }
  return null;
}

/** Lo que va a /api/compra (`regalo.tarjeta`), o null si no la quiere. */
export function tarjetaParaEnviar(e: EleccionTarjeta): TarjetaImpresa | null {
  if (!e.quiere) return null;
  const opcional = (v: string) => (v.trim() ? v.trim() : undefined);
  return {
    aNombreDe: e.aNombreDe.trim(),
    direccion: {
      linea1: e.linea1.trim(),
      ...(opcional(e.linea2) ? { linea2: opcional(e.linea2) } : {}),
      ciudad: e.ciudad.trim(),
      ...(opcional(e.provincia) ? { provincia: opcional(e.provincia) } : {}),
      cp: e.cp.trim(),
      pais: "España",
    },
  };
}

const etiqueta = "block text-[13.5px] font-medium text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]";
const pista = "mt-2 text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]";

export function CamposTarjeta({
  catalogo, region, fecha, ahora, eleccion, onCambio, textos: T, marca,
}: {
  catalogo: Catalogo;
  region: Region;
  fecha: string;
  ahora: Date;
  eleccion: EleccionTarjeta;
  onCambio: (e: EleccionTarjeta) => void;
  textos: TextosTarjetaImpresa;
  marca: (campo: string) => Record<string, unknown>;
}) {
  // Sin PRECIO_TARJETA_* no existe: ni la casilla ni el aviso.
  if (!catalogo.tarjeta) return null;
  if (!puedeTarjetaImpresa(fecha, ahora)) return <p className={`mt-8 ${pista}`}>{T.fechaCerca}</p>;
  const precio = `+ ${formatearPrecio(catalogo.tarjeta.precio, catalogo.moneda, region, true)}`;
  const marcado = eleccion.quiere;
  const cambiar = (campo: keyof EleccionTarjeta, valor: string) => onCambio({ ...eleccion, [campo]: valor });
  return (
    <div className="mt-8">
      <div className="chk-extra" data-marcado={marcado || undefined}>
        <label className="chk-extra-marca">
          <input type="checkbox" className="sr-only" name="tarjeta" checked={marcado} onChange={(ev) => onCambio({ ...eleccion, quiere: ev.target.checked })} />
          <span aria-hidden className="chk-extra-caja">
            {marcado ? (
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            ) : null}
          </span>
          <span className="chk-extra-textos">
            <span className="chk-extra-titulo">{T.casilla}</span>
            <span className="chk-extra-detalle">{T.detalle}</span>
          </span>
          <span className="chk-extra-precio">{precio}</span>
        </label>
      </div>
      {marcado && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={etiqueta} htmlFor="tarjeta-aNombreDe">{T.aNombreDe}</label>
            <input
              id="tarjeta-aNombreDe" {...marca("tarjeta-aNombreDe")} className={`${CAMPO} mt-2`} value={eleccion.aNombreDe}
              maxLength={A_NOMBRE_DE_MAXIMO} onChange={(ev) => cambiar("aNombreDe", ev.target.value)} autoComplete="name"
            />
            <p className={pista}>{T.aNombreDePista}</p>
          </div>
          {CAMPOS.map((c) => (
            <div key={c.id}>
              <label className={etiqueta} htmlFor={`tarjeta-${c.id}`}>{T.campos[c.id]}</label>
              <input
                id={`tarjeta-${c.id}`} {...marca(`tarjeta-${c.id}`)} className={`${CAMPO} mt-2`} value={eleccion[c.id]}
                placeholder={c.ejemplo} onChange={(ev) => cambiar(c.id, ev.target.value)}
                {...(c.id === "cp" ? { inputMode: "numeric" as const, autoComplete: "postal-code" } : {})}
              />
            </div>
          ))}
          <div>
            <p className={etiqueta}>{T.campos.pais}</p>
            <p className="mt-2 flex h-[52px] items-center text-[16px] text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">{T.pais}</p>
          </div>
        </div>
      )}
    </div>
  );
}
