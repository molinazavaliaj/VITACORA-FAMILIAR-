"use client";

import { useEffect } from "react";
import { medirCompra } from "@/lib/medicion-cliente";
import { contarPaso } from "@/lib/embudo-cliente";
import type { RegionEmbudo } from "@/lib/embudo";

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

// El embudo (06/11): «pagado» se cuenta acá y no al entrar a gracias, porque este componente
// solo se pinta cuando el servidor encontró el pedido en estado pagado. Una vez por pedido.
// No usa cookies ni el aviso: es un contador por día, sin datos de persona.
export function ContarPagado({ pedidoId, region }: { pedidoId: string; region: RegionEmbudo }) {
  useEffect(() => {
    contarPaso("pagado", region, pedidoId);
  }, [pedidoId, region]);
  return null;
}
