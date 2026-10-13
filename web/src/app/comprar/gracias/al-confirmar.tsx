"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CLAVE_COMPRA, CLAVE_COMPRA_VIAJE, CLAVE_DIRECCION, leer, olvidar } from "../../_checkout/memoria";
import type { Direccion } from "@/lib/entregas";

// Lo que queda en el navegador después de pagar, en «Pedido confirmado»:
// 1. Se olvida lo elegido para un pago fallido (ya se cobró).
// 2. Si en el checkout se escribió la dirección del impreso, se guarda ahora en
//    su entrega (la fila nace al confirmar el pago, CONTRATO «Entregas»), con la
//    sesión que abrió la vuelta del pago. Si no hay dirección guardada o falla,
//    se avisa con un enlace al panel, donde ya se carga como siempre.

type DireccionGuardada = { destinatarioNombre: string; destinatarioTelefono: string; direccion: Partial<Direccion> };

const sesion = () => window.sessionStorage;

export function AlConfirmar({
  narradorId,
  entregaId,
  textos,
}: {
  narradorId: string | null;
  /** La entrega sin dirección de este narrador, si hay algo que viaja. */
  entregaId: string | null;
  textos: { guardada: string; falta: string; poner: string };
}) {
  const [estado, setEstado] = useState<"esperando" | "guardada" | "falta">("esperando");

  useEffect(() => {
    olvidar(sesion, CLAVE_COMPRA);
    olvidar(sesion, CLAVE_COMPRA_VIAJE);
    if (!narradorId || !entregaId) {
      // Sin entrega que completar (o sin sesión): la dirección no tiene dónde
      // ir desde acá, así que no se deja guardada en el navegador.
      olvidar(sesion, CLAVE_DIRECCION);
      return;
    }
    const guardada = leer<DireccionGuardada>(sesion, CLAVE_DIRECCION, narradorId);
    if (!guardada) {
      setEstado("falta");
      return;
    }
    let vigente = true;
    fetch(`/api/entrega?narrador=${encodeURIComponent(narradorId)}&entrega=${encodeURIComponent(entregaId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guardada),
    })
      .then((r) => {
        if (!vigente) return;
        if (r.ok) olvidar(sesion, CLAVE_DIRECCION);
        setEstado(r.ok ? "guardada" : "falta");
      })
      .catch(() => {
        if (vigente) setEstado("falta");
      });
    return () => {
      vigente = false;
    };
  }, [narradorId, entregaId]);

  if (!narradorId || !entregaId || estado === "esperando") return null;
  if (estado === "guardada") {
    return <p className="m-step m-step-abajo text-[14px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{textos.guardada}</p>;
  }
  return (
    <p className="m-step m-step-abajo flex flex-wrap gap-x-2 text-[15px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]">
      {textos.falta}
      <Link href={`/tablero/${narradorId}/libro`} className="text-[var(--acento-oscuro)] underline underline-offset-4">
        {textos.poner}
      </Link>
    </p>
  );
}
