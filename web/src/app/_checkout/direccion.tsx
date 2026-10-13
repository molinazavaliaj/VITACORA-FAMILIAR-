"use client";

import type { Direccion } from "@/lib/entregas";
import type { TextosCheckout } from "../_textos/checkout";
import { CAMPO, ETIQUETA, ID_ERROR } from "./piezas";

// La dirección de envío del impreso en el paso del pago (DECISIONES D3). Los
// mismos campos que pide el panel (lib/entregas.ts, PATCH /api/entrega): quién
// lo recibe, un teléfono y la dirección. Se guarda en el navegador al ir a pagar
// y «Pedido confirmado» la escribe en su entrega cuando vuelve pagado.

const CAMPOS = ["linea1", "linea2", "ciudad", "provincia", "cp", "pais"] as const;
const AUTOCOMPLETAR: Record<(typeof CAMPOS)[number], string> = {
  linea1: "address-line1", linea2: "address-line2", ciudad: "address-level2", provincia: "address-level1", cp: "postal-code", pais: "country-name",
};

export type DatosEnvio = { recibe: string; telefonoRecibe: string; direccion: Partial<Direccion> };

export function CamposDireccion({
  textos: T,
  valor,
  onCambio,
  campoConError,
}: {
  textos: Pick<TextosCheckout, "direccionTitulo" | "direccionAyuda" | "recibe" | "recibePista" | "telefonoRecibe" | "telefonoRecibePista" | "siHaceFalta" | "camposDireccion">;
  valor: DatosEnvio;
  onCambio: (cambios: Partial<DatosEnvio>) => void;
  /** El campo marcado por el error del paso («recibe», «telefono-recibe» o «direccion»). */
  campoConError?: string;
}) {
  const marca = (campo: string) => (campoConError === campo ? { "aria-invalid": true, "aria-describedby": ID_ERROR } : {});
  return (
    <fieldset className="flex flex-col gap-4" {...(campoConError === "direccion" ? { "aria-describedby": ID_ERROR } : {})}>
      <legend className="mb-1 text-[22px] font-medium text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">{T.direccionTitulo}</legend>
      <p className="-mt-1 text-[14px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{T.direccionAyuda}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={ETIQUETA} htmlFor="recibe">{T.recibe}</label>
          <input id="recibe" {...marca("recibe")} className={`${CAMPO} mt-2`} value={valor.recibe} onChange={(ev) => onCambio({ recibe: ev.target.value })} placeholder={T.recibePista} autoComplete="name" />
        </div>
        <div>
          <label className={ETIQUETA} htmlFor="telefono-recibe">{T.telefonoRecibe}</label>
          <input id="telefono-recibe" {...marca("telefono-recibe")} className={`${CAMPO} mt-2`} value={valor.telefonoRecibe} onChange={(ev) => onCambio({ telefonoRecibe: ev.target.value })} placeholder={T.telefonoRecibePista} inputMode="tel" autoComplete="tel" />
        </div>
        {CAMPOS.map((c) => (
          <div key={c} className={c === "linea1" ? "sm:col-span-2" : ""}>
            <label className={ETIQUETA} htmlFor={`dir-${c}`}>
              {T.camposDireccion[c].nombre}
              {c === "linea2" || c === "provincia" ? T.siHaceFalta : ""}
            </label>
            <input id={`dir-${c}`} className={`${CAMPO} mt-2`} value={valor.direccion[c] ?? ""} placeholder={T.camposDireccion[c].ejemplo} autoComplete={AUTOCOMPLETAR[c]}
              onChange={(ev) => onCambio({ direccion: { ...valor.direccion, [c]: ev.target.value } })} />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
