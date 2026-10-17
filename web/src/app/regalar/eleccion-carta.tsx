"use client";

import { armarCompra, type Catalogo } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import type { TextosCartaComprador } from "@/lib/carta-textos";
import { DIRECCION_CAMPOS, DIRECCION_CAMPOS_ES, type Direccion } from "@/lib/entregas";
import { formatearPrecio } from "../comprar/productos-ui";
import { campo, etiqueta } from "./estilos";

// Regalo en locales (17/10): en el paso de pagar, desde una carta, se elige
// el libro (digital o impreso), se suma o no la tarjeta negra por correo y se
// ve el total. El servidor vuelve a calcular todo: esto es solo el ticket.

const opcion = (elegido: boolean) =>
  `flex cursor-pointer items-start gap-3 rounded-lg border bg-white px-4 py-3 text-[16px] [font-family:var(--fuente-cuerpo)] ${elegido ? "border-2 border-[#14140F]" : "border-[#D4D4CE]"}`;

export function EleccionCarta({ catalogo, region, textos: T, impresos, onImpresos, tarjeta, onTarjeta }: {
  catalogo: Catalogo; region: Region; textos: TextosCartaComprador;
  impresos: number; onImpresos: (n: number) => void;
  tarjeta: Partial<Direccion> | null; onTarjeta: (d: Partial<Direccion> | null) => void;
}) {
  const total = armarCompra(catalogo, region, { base: "pdf", impresos, marcos: 0, tarjetas: tarjeta ? 1 : 0 }).total;
  const campos = region === "ES" ? DIRECCION_CAMPOS_ES : DIRECCION_CAMPOS;
  const precio = (n: number) => formatearPrecio(n, catalogo.moneda, region);
  return (
    <div className="mt-8 grid gap-6">
      <fieldset>
        <legend className={etiqueta}>{T.queLibro}</legend>
        <div className="mt-3 flex flex-col gap-2">
          <label className={opcion(impresos === 0)}>
            <input type="radio" name="libro" className="mt-1.5" checked={impresos === 0} onChange={() => onImpresos(0)} />
            <span>
              {T.digital}
              <span className="block text-[14px] text-[#5F5F55]">{T.digitalDetalle}</span>
            </span>
          </label>
          {catalogo.impreso && (
            <label className={opcion(impresos > 0)}>
              <input type="radio" name="libro" className="mt-1.5" checked={impresos > 0} onChange={() => onImpresos(1)} />
              <span>
                {T.impreso}
                <span className="block text-[14px] text-[#5F5F55]">{T.impresoDetalle}</span>
              </span>
            </label>
          )}
        </div>
      </fieldset>

      {catalogo.tarjeta !== null && (
        <div>
          <label className={opcion(tarjeta !== null)}>
            <input type="checkbox" className="mt-1.5" checked={tarjeta !== null} onChange={(e) => onTarjeta(e.target.checked ? {} : null)} />
            <span>
              {T.tarjetaTitulo} · {precio(catalogo.tarjeta)}
              <span className="block text-[14px] text-[#5F5F55]">{T.tarjetaDetalle}</span>
            </span>
          </label>
          {tarjeta !== null && (
            <fieldset className="mt-4">
              <legend className={etiqueta}>{T.direccionTitulo}</legend>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {campos.map((c) => (
                  <div key={c.id} className={c.id === "linea1" ? "sm:col-span-2" : ""}>
                    <label className={etiqueta} htmlFor={`tarjeta-${c.id}`}>{c.nombre}</label>
                    <input
                      id={`tarjeta-${c.id}`} className={`${campo} mt-2`} value={tarjeta[c.id] ?? ""} placeholder={c.ejemplo}
                      onChange={(e) => onTarjeta({ ...tarjeta, [c.id]: e.target.value })} autoComplete="off"
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}

      <div className="flex items-baseline justify-between gap-4 rounded-lg border border-[#EBEBE7] bg-white p-5">
        <p className="text-[17px] [font-family:var(--fuente-titulo)]">{catalogo.base.nombre}</p>
        <p className="text-[22px] tabular-nums [font-family:var(--fuente-titulo)]">{precio(total)}</p>
      </div>
    </div>
  );
}
