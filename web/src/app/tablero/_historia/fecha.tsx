"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hoja } from "../../_ui/hoja";
import { AvisoGuardado } from "../../_ui/aviso-guardado";

// «Cambiar la fecha de inicio» de un regalo que todavía no se abrió (rediseño
// 2026-10, arreglos chicos; maqueta Panel). Una fila de «Tu pedido» que abre
// la hoja (MOTION 8) con la fecha; al guardar, la hoja se cierra y sale el
// aviso «✓ Guardado». Lo valida el servidor (PATCH /api/regalo/fecha) con las
// reglas del checkout; acá solo se pone `min` en el calendario.

export type TextosFecha = {
  fila: string;
  titulo: string;
  texto: string;
  campo: string;
  guardar: string;
  guardando: string;
  guardado: string;
  cerrar: string;
  error: string;
};

/** Hoy en el reloj de quien mira, como AAAA-MM-DD (el mínimo del calendario). */
function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CambiarFecha({ narradorId, fecha, textos }: { narradorId: string; fecha: string | null; textos: TextosFecha }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [valor, setValor] = useState(fecha ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardados, setGuardados] = useState(0);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const r = await fetch(`/api/regalo/fecha?narrador=${encodeURIComponent(narradorId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: valor }),
      });
      if (!r.ok) {
        const cuerpo = (await r.json().catch(() => null)) as { error?: string } | null;
        setError(cuerpo?.error ?? textos.error);
        setGuardando(false);
        return;
      }
    } catch {
      setError(textos.error);
      setGuardando(false);
      return;
    }
    setGuardando(false);
    setAbierta(false);
    setGuardados((n) => n + 1);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="pnl-fila"
        aria-haspopup="dialog"
        onClick={() => {
          setValor(fecha ?? "");
          setError(null);
          setAbierta(true);
        }}
      >
        <span>{textos.fila}</span>
        <span aria-hidden>›</span>
      </button>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo={textos.titulo} etiquetaCerrar={textos.cerrar}>
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <p className="pnl-parrafo">{textos.texto}</p>
          <input
            type="date"
            required
            aria-label={textos.campo}
            min={hoyLocal()}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="h-[50px] w-full rounded-xl border border-[var(--linea-fuerte)] bg-transparent px-3.5 text-[16px] text-[var(--texto)] outline-none [color-scheme:inherit] [font-family:var(--fuente-micro)] focus:border-[var(--texto)]"
          />
          {error ? (
            <p role="alert" className="text-[14px] text-[var(--alerta)] [font-family:var(--fuente-micro)]">
              {error}
            </p>
          ) : null}
          <div>
            <button type="submit" disabled={guardando || !valor} className="pnl-boton pnl-boton--lleno disabled:opacity-60">
              {guardando ? textos.guardando : textos.guardar}
            </button>
          </div>
        </form>
      </Hoja>
      <AvisoGuardado vez={guardados} texto={textos.guardado} />
    </>
  );
}
