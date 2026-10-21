"use client";

import { useEffect, useRef, useState } from "react";
import type { IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_CUPON } from "../_textos/cupon";
import { AYUDA, CAMPO, ERROR, ETIQUETA } from "./piezas";

// El campo del cupón de bienvenida en el paso del pago (rasca y gana, 20/10).
// «Aplicar» le pregunta al servidor (/api/cupon/validar) si el código sirve y
// cuánto descuenta: el navegador nunca calcula el descuento, solo muestra lo
// que vuelve. Al pagar, /api/compra lo vuelve a calcular todo. Vive dentro del
// formulario del pago: Enter aplica el cupón, no paga.

/**
 * Lo que dijo el servidor. `linea` es el nombre de la línea del resumen (null
 * si no hay descuento: el código de un creador sin descuento igual vale) y
 * `aviso` el texto del casillero para el código de un creador.
 */
export type CuponAplicado = { codigo: string; importe: number; linea?: string | null; aviso?: string };

const BOTON =
  "m-ghost inline-flex min-h-12 shrink-0 items-center rounded-full border border-[var(--borde-oscuro-fuerte)] px-5 text-[15px] text-[var(--texto-oscuro)] disabled:opacity-60 [font-family:var(--fuente-micro)]";

export function CampoCupon({
  idioma,
  productos,
  aplicado,
  alCambiar,
  inicial,
  conPista = true,
}: {
  idioma: IdiomaWeb;
  /** Lo que lleva el carrito (el descuento es el mismo, pero el servidor lo revisa con la compra entera). */
  productos: { impresos: number; marcos: number };
  aplicado: CuponAplicado | null;
  alCambiar: (cupon: CuponAplicado | null) => void;
  /** Un código para aplicar solo al llegar (el link del mail, `?cupon=`). */
  inicial?: string | null;
  /** La pista «VITACORA10-…» es del cupón del rasca: con solo creadores prendido, el casillero va sin pista. */
  conPista?: boolean;
}) {
  const T = TEXTOS_CUPON[idioma].checkout;
  const [codigo, setCodigo] = useState(inicial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [aplicando, setAplicando] = useState(false);
  const yaProbado = useRef(false);

  async function aplicar(valor = codigo) {
    if (aplicando || !valor.trim()) return;
    setAplicando(true);
    setError(null);
    try {
      const r = await fetch("/api/cupon/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: valor.trim(), idiomaWeb: idioma, productos }),
      });
      const json = (await r.json().catch(() => ({}))) as { error?: string; codigo?: string; importe?: number; linea?: string | null; aviso?: string };
      if (!r.ok || typeof json.codigo !== "string" || typeof json.importe !== "number") {
        setError(json.error ?? T.fallo);
        alCambiar(null);
        return;
      }
      setCodigo(json.codigo);
      alCambiar({
        codigo: json.codigo,
        importe: json.importe,
        ...(json.linea !== undefined ? { linea: json.linea } : {}),
        ...(typeof json.aviso === "string" ? { aviso: json.aviso } : {}),
      });
    } catch {
      setError(T.fallo);
    } finally {
      setAplicando(false);
    }
  }

  useEffect(() => {
    if (!inicial || yaProbado.current || aplicado) return;
    yaProbado.current = true;
    void aplicar(inicial);
    // Solo al llegar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicial]);

  if (aplicado) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className={`${AYUDA} m-0`} aria-live="polite">{aplicado.aviso ?? T.aplicado(aplicado.codigo)}</p>
        <button type="button" className={BOTON} onClick={() => alCambiar(null)}>{T.quitar}</button>
      </div>
    );
  }

  return (
    <div>
      <label className={ETIQUETA} htmlFor="cupon">{T.pregunta}</label>
      <div className="mt-2 flex gap-3">
        <input
          id="cupon"
          className={CAMPO}
          value={codigo}
          onChange={(ev) => setCodigo(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              void aplicar();
            }
          }}
          placeholder={conPista ? T.pista : undefined}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          {...(error ? { "aria-invalid": true, "aria-describedby": "cupon-error" } : {})}
        />
        <button type="button" className={BOTON} disabled={aplicando} onClick={() => void aplicar()}>
          {aplicando ? T.aplicando : T.aplicar}
        </button>
      </div>
      {error ? <p id="cupon-error" role="alert" className={`${ERROR} mt-2`}>{error}</p> : null}
    </div>
  );
}
