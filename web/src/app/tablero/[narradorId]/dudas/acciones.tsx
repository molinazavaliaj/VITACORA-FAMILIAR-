"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DudaFamilia } from "@/lib/dudas";
import { pedidosDeLoQueCambio } from "@/lib/dudas-formulario";
import type { TratoComprador } from "@/lib/regalo-textos";
import { textosPantallaDudas, type TextosPantallaDudas } from "@/lib/dudas-textos";

export type DudaPrefill = DudaFamilia & {
  /**
   * Lo guardado antes, de cualquiera de la familia. `quien` solo si la base
   * tenía su nombre; `fecha` ya armada en el servidor, en la zona de la
   * historia, para que el servidor y el navegador muestren lo mismo.
   */
  guardada?: { texto: string; quien?: string; fecha: string | null };
};

export function FormularioDudas({
  dudas,
  narradorId,
  soloLectura,
  trato = "vos",
  textos = textosPantallaDudas(false, ""),
}: {
  dudas: DudaPrefill[];
  narradorId: string;
  soloLectura: boolean;
  trato?: TratoComprador;
  /** Tercera persona, o primera si el libro es de quien mira («Para mí»). */
  textos?: TextosPantallaDudas;
}) {
  const tu = trato === "tu";
  const router = useRouter();
  // Por id de duda: cada una es independiente y no comparten clave.
  const [iniciales, setIniciales] = useState<Record<string, string>>(
    Object.fromEntries(dudas.map((d) => [d.id, d.guardada?.texto ?? ""])),
  );
  const [valores, setValores] = useState<Record<string, string>>(iniciales);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  async function guardar() {
    setGuardando(true);
    setError(null);
    setGuardado(false);

    const correcciones = pedidosDeLoQueCambio(dudas, iniciales, valores);

    try {
      const respuesta = await fetch(`/api/dudas?narrador=${encodeURIComponent(narradorId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correcciones }),
      });
      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string };
        setError(cuerpo.error ?? (tu ? "No pudimos guardar tus respuestas. Intenta de nuevo." : "No pudimos guardar tus respuestas. Intentá de nuevo."));
        return;
      }
      // Lo guardado pasa a ser el punto de partida del próximo guardado.
      setIniciales({ ...valores });
      setGuardado(true);
      router.refresh();
    } catch {
      setError(tu ? "No pudimos guardar tus respuestas. Revisa tu conexión e intenta de nuevo." : "No pudimos guardar tus respuestas. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (dudas.length === 0) {
    return (
      <p className="text-sm text-[var(--texto-suave)]">
        {textos.ningunaDuda}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {dudas.map((duda, indice) => (
        <div key={duda.id} className="flex flex-col gap-3 border-b border-[var(--linea)] pb-6 last:border-b-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
              {indice + 1}
            </span>
            <p className="text-base text-[var(--texto)]">{duda.pregunta}</p>
          </div>

          {duda.citas && duda.citas.length > 0 ? (
            <div className="flex flex-col gap-2 border-l-2 border-[var(--linea-fuerte)] pl-3">
              <p className="text-xs text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                {textos.loQueDijo}
              </p>
              {duda.citas.map((cita) => (
                <p key={cita.id} className="text-sm italic leading-relaxed text-[var(--texto-suave)]">
                  «{cita.texto}»
                </p>
              ))}
            </div>
          ) : null}

          {duda.opciones && duda.opciones.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {duda.opciones.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  disabled={soloLectura}
                  onClick={() => setValores((v) => ({ ...v, [duda.id]: opcion }))}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-50 ${
                    valores[duda.id] === opcion
                      ? "border-[var(--texto)] bg-[var(--texto)] text-[var(--fondo)]"
                      : "border-[var(--linea-fuerte)] text-[var(--texto-suave)] hover:text-[var(--texto)]"
                  }`}
                >
                  {opcion}
                </button>
              ))}
            </div>
          ) : null}

          <textarea
            id={`duda-${duda.id}`}
            value={valores[duda.id] ?? ""}
            disabled={soloLectura}
            onChange={(e) => setValores((v) => ({ ...v, [duda.id]: e.target.value }))}
            rows={2}
            placeholder={tu ? "Lo que sepas. Si no sabes, déjalo vacío." : "Lo que sepas. Si no sabés, dejalo vacío."}
            className="w-full rounded-md border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-3 py-2 text-sm text-[var(--texto)] disabled:opacity-60"
          />

          {duda.guardada?.quien ? (
            <p className="text-xs text-[var(--texto-menor)]">
              Contestó {duda.guardada.quien}
              {duda.guardada.fecha ? ` · ${duda.guardada.fecha}` : ""}
            </p>
          ) : null}
        </div>
      ))}

      {soloLectura ? null : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="rounded-md bg-[var(--texto)] px-4 py-2 text-sm text-[var(--fondo)] disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar respuestas"}
          </button>
          {error ? <p className="text-sm text-[var(--alerta)]">{error}</p> : null}
          {guardado ? (
            <p className="text-sm text-[var(--texto-suave)]">
              Listo, lo guardamos. {tu ? "Puedes" : "Podés"} volver a cambiarlo mientras el libro no esté escrito.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
