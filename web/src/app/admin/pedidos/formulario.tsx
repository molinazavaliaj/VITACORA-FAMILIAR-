"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ResultadoPedido } from "./acciones";

// Un formulario de /admin/pedidos. No usa `<form action>` a propósito: React vacía el
// formulario cuando la acción termina, aunque haya vuelto con un error, y un link mal pegado
// haría perder el número de seguimiento recién copiado del correo. La pregunta de confirmar
// va después de la validación del navegador: no se confirma un formulario incompleto.

const BOTON = { lleno: "adm-boton", hilo: "adm-boton adm-boton--hilo" };

export function FormPedido({
  accion,
  boton,
  estilo = "lleno",
  confirmar,
  children,
  className = "",
}: {
  accion: (datos: FormData) => Promise<ResultadoPedido>;
  boton: string;
  estilo?: keyof typeof BOTON;
  confirmar?: string;
  children?: ReactNode;
  className?: string;
}) {
  const [estado, setEstado] = useState<ResultadoPedido>({ error: null });
  const [pendiente, empezar] = useTransition();

  return (
    <form
      className={`flex flex-wrap items-end gap-2 ${className}`}
      onSubmit={(ev) => {
        ev.preventDefault();
        if (confirmar && !window.confirm(confirmar)) return;
        const datos = new FormData(ev.currentTarget);
        empezar(async () => {
          try {
            setEstado(await accion(datos));
          } catch {
            setEstado({ error: "No se pudo guardar. Probá de nuevo." });
          }
        });
      }}
    >
      {children}
      <button type="submit" disabled={pendiente} className={BOTON[estilo]}>
        {pendiente ? "guardando…" : boton}
      </button>
      {estado.error ? (
        <p className="w-full text-sm text-[var(--alerta)]" role="alert">{estado.error}</p>
      ) : estado.listo ? (
        <p className="w-full text-sm text-[var(--texto-suave)]" role="status">{estado.listo}</p>
      ) : null}
    </form>
  );
}
