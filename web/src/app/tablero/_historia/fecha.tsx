"use client";

import { useRef, useState } from "react";
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

/**
 * Manda la fecha nueva (PATCH /api/regalo/fecha). Si el pedido no llega o el
 * servidor no encuentra la sesión (401), prueba una vez más: la primera vez que
 * se guardaba después de un rato, el token vencido se renovaba en el medio y
 * esa respuesta volvía sin sesión aunque la sesión estuviera bien (19/10, la
 * fecha que no se guardaba a la primera). El reintento ya sale con las cookies
 * nuevas. Si igual falla, devuelve el error para mostrarlo y dejar reintentar:
 * el del servidor cuando dice qué está mal (fecha pasada, regalo ya abierto),
 * `errorGenerico` cuando no (sin sesión, caída, sin red).
 */
export async function pedirCambioDeFecha(
  narradorId: string,
  fecha: string,
  errorGenerico: string,
  pedir: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `/api/regalo/fecha?narrador=${encodeURIComponent(narradorId)}`;
  const init: RequestInit = {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fecha }),
  };
  for (let intento = 1; ; intento++) {
    let r: Response;
    try {
      r = await pedir(url, init);
    } catch {
      if (intento < 2) continue;
      return { ok: false, error: errorGenerico };
    }
    if (r.ok) return { ok: true };
    if (r.status === 401 && intento < 2) continue;
    if (r.status === 401 || r.status >= 500) return { ok: false, error: errorGenerico };
    const cuerpo = (await r.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: cuerpo?.error ?? errorGenerico };
  }
}

export function CambiarFecha({ narradorId, fecha, textos }: { narradorId: string; fecha: string | null; textos: TextosFecha }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [valor, setValor] = useState(fecha ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardados, setGuardados] = useState(0);

  // Un toque doble (o Enter y el botón) mandaba dos pedidos a la vez antes de
  // que el botón se deshabilitara: con uno en camino, el otro no sale.
  const enCamino = useRef(false);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enCamino.current) return;
    enCamino.current = true;
    setError(null);
    setGuardando(true);
    const resultado = await pedirCambioDeFecha(narradorId, valor, textos.error);
    enCamino.current = false;
    setGuardando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
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
