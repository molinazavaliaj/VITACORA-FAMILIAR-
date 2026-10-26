"use client";

import { useEffect } from "react";
import { medirCompra } from "@/lib/medicion-cliente";

// La compra, para Meta y Google (medición de anuncios, 26/10). No hace nada si
// no aceptó las cookies: medirCompra no encuentra el píxel. El servidor manda
// la misma compra con el mismo id al entrar el pago, y Meta la cuenta una vez.
export function MedirCompra({ pedidoId, monto, moneda }: { pedidoId: string; monto: number; moneda: string }) {
  useEffect(() => {
    // El píxel se carga en el layout en el mismo arranque: se espera un momento a que esté.
    const reloj = setTimeout(() => medirCompra(pedidoId, monto, moneda), 800);
    return () => clearTimeout(reloj);
  }, [pedidoId, monto, moneda]);
  return null;
}
