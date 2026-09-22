"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DIRECCION_CAMPOS, estadoEnHumano, type Direccion, type EstadoEntrega } from "@/lib/entregas";

// La sección Envío de Encargar libro (3t.26): adónde va lo físico y cómo va.
// Aparece solo si el pedido lleva libro impreso o marcos. La dirección es
// OBLIGATORIA para encargar (decisión de Joaquín, 21/09): sin ella el botón
// Encargar no se habilita. Se puede corregir hasta que entre en producción.
//
// ⚠️ Textos a revisar por Naza (22/09).

export type EntregaVista = {
  id: string;
  estado: EstadoEntrega;
  destinatarioNombre: string | null;
  destinatarioTelefono: string | null;
  direccion: Direccion | null;
  nota: string | null;
  transportista: string | null;
  seguimiento: string | null;
  seguimientoUrl: string | null;
  problema: string | null;
};

const campo = "w-full rounded-lg border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-4 py-3 text-[16px] text-[var(--texto)] outline-none focus:border-[var(--texto)]";
const etiqueta = "text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]";
const boton = "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";

/** Los estados en los que la dirección todavía se puede escribir. */
const EDITABLES: EstadoEntrega[] = ["sin_direccion", "lista", "con_problema"];

export function Envio({ narradorId, entrega, queViaja }: { narradorId: string; entrega: EntregaVista; queViaja: string }) {
  const router = useRouter();
  const editable = EDITABLES.includes(entrega.estado);
  const [nombre, setNombre] = useState(entrega.destinatarioNombre ?? "");
  const [telefono, setTelefono] = useState(entrega.destinatarioTelefono ?? "");
  const [direccion, setDireccion] = useState<Partial<Direccion>>(entrega.direccion ?? {});
  const [nota, setNota] = useState(entrega.nota ?? "");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function llamar(cuerpo: Record<string, unknown>, exito: string) {
    setOcupado(true);
    setError(null);
    setAviso(null);
    try {
      const r = await fetch(`/api/entrega?narrador=${encodeURIComponent(narradorId)}&entrega=${encodeURIComponent(entrega.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "No pudimos guardar.");
      setAviso(exito);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={etiqueta}>Envío</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--texto-suave)]">
          {queViaja} viaja hasta la puerta. Decinos adónde lo mandamos; el envío ya está incluido.
        </p>
      </div>

      {/* Cómo va: la línea de estado, con lo que haya. */}
      <div className="rounded-xl border border-[var(--linea)] p-5">
        <p className="text-[16px] [font-family:var(--fuente-titulo)]">{estadoEnHumano(entrega.estado)}</p>
        {entrega.estado === "enviado" && entrega.seguimiento ? (
          <p className="mt-2 text-[15px] text-[var(--texto-suave)]">
            {entrega.transportista ? `${entrega.transportista} · ` : ""}
            {entrega.seguimientoUrl ? (
              <a href={entrega.seguimientoUrl} target="_blank" rel="noreferrer" className="underline decoration-[var(--linea-fuerte)] underline-offset-4">{entrega.seguimiento}</a>
            ) : entrega.seguimiento}
          </p>
        ) : null}
        {entrega.problema ? <p className="mt-2 text-[15px] text-[var(--alerta)]">{entrega.problema} — escribinos y lo resolvemos.</p> : null}
        {entrega.estado === "enviado" ? (
          <button type="button" className={`${boton} mt-4 border border-[var(--linea-fuerte)]`} disabled={ocupado} onClick={() => llamar({ accion: "ya_llego" }, "¡Gracias! Nos alegra que haya llegado.")}>
            Ya me llegó
          </button>
        ) : null}
      </div>

      {/* Adónde va. */}
      <fieldset disabled={!editable || ocupado} className={editable ? "" : "opacity-60"}>
        <legend className={etiqueta}>Adónde lo mandamos</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={etiqueta}>Quién lo recibe</span>
            <input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Martina Fernández" autoComplete="name" />
          </label>
          <label className="flex flex-col gap-1">
            <span className={etiqueta}>Teléfono</span>
            <input className={campo} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="11 5555 1234" inputMode="tel" autoComplete="tel" />
          </label>
          {DIRECCION_CAMPOS.map((c) => (
            <label key={c.id} className={`flex flex-col gap-1 ${c.id === "linea1" ? "sm:col-span-2" : ""}`}>
              <span className={etiqueta}>{c.nombre}{c.obligatorio ? "" : " (si hace falta)"}</span>
              <input className={campo} value={direccion[c.id] ?? ""} onChange={(e) => setDireccion((d) => ({ ...d, [c.id]: e.target.value }))} placeholder={c.ejemplo} />
            </label>
          ))}
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className={etiqueta}>Algo que ayude a entregarlo (opcional)</span>
            <input className={campo} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="El timbre no anda, llamar al llegar." />
          </label>
        </div>
        {editable ? (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" className={`${boton} bg-[var(--texto)] text-[var(--fondo)] hover:opacity-90`} disabled={ocupado} onClick={() => llamar({ destinatarioNombre: nombre, destinatarioTelefono: telefono, direccion, nota }, "Dirección guardada.")}>
              {ocupado ? "Guardando…" : "Guardar la dirección"}
            </button>
            {aviso ? <span className="text-sm text-[var(--texto-menor)]">{aviso}</span> : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--texto-menor)]">Ya entró en producción con esta dirección. Si hay que cambiarla, escribinos.</p>
        )}
      </fieldset>
      {error ? <p className="text-sm text-[var(--alerta)]" role="alert">{error}</p> : null}
    </div>
  );
}
