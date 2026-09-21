"use client";

import { useState } from "react";
import { descuentoPorCopias } from "@/lib/productos";

// Sumar cosas a un libro que ya existe (docs/panel-usuario.md §7.3 y §15.1):
// el PDF si no lo compró, copias impresas con descuento por
// cantidad (solo en el mismo pedido), marcos con NFC, y el acabado. El precio
// se calcula acá para mostrarlo y se recalcula en el servidor para cobrarlo:
// nunca se confía en el número del navegador.

export type PrecioExtra = { id: "impreso_bn" | "impreso_color" | "marco"; nombre: string; detalle: string; precio: number };

type Props = {
  narradorId: string;
  moneda: "EUR" | "ARS";
  region: "ES" | "AR";
  extras: PrecioExtra[];
  yaTieneImpreso: boolean;
  titulo?: string;
  /** El de la nube: precio del PDF (con «Su voz» incluida). */
  nube?: { pdf: number };
  /** Qué ya compró la dueña, para no ofrecérselo otra vez. */
  yaTiene?: { pdf: boolean; impreso: boolean };
};

const boton = "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";
const etiqueta = "text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]";

function formatear(monto: number, moneda: "EUR" | "ARS", region: "ES" | "AR") {
  return new Intl.NumberFormat(region === "ES" ? "es-ES" : "es-AR", { style: "currency", currency: moneda, maximumFractionDigits: moneda === "ARS" ? 0 : 2 }).format(monto);
}

function Contador({ valor, onChange, min = 0, max = 20, etiquetaMenos, etiquetaMas }: { valor: number; onChange: (v: number) => void; min?: number; max?: number; etiquetaMenos: string; etiquetaMas: string }) {
  const b = "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--linea-fuerte)] text-lg leading-none hover:bg-[var(--hueco)] disabled:opacity-40";
  return (
    <span className="inline-flex items-center gap-3">
      <button type="button" aria-label={etiquetaMenos} className={b} disabled={valor <= min} onClick={() => onChange(valor - 1)}>−</button>
      <span className="w-6 text-center text-[17px] tabular-nums">{valor}</span>
      <button type="button" aria-label={etiquetaMas} className={b} disabled={valor >= max} onClick={() => onChange(valor + 1)}>+</button>
    </span>
  );
}

export function Extras({ narradorId, moneda, region, extras, yaTieneImpreso, titulo = "Sumar", nube, yaTiene }: Props) {
  const bn = extras.find((e) => e.id === "impreso_bn");
  const color = extras.find((e) => e.id === "impreso_color");
  const marco = extras.find((e) => e.id === "marco");

  const [pdf, setPdf] = useState(false);
  const [copias, setCopias] = useState(0);
  const [acabado, setAcabado] = useState<"bn" | "color">(color && !bn ? "color" : "bn");
  const [marcos, setMarcos] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const precioCopia = acabado === "color" ? color?.precio : bn?.precio;
  const descuento = descuentoPorCopias(copias);
  const totalCopias = precioCopia ? Math.round(precioCopia * (1 - descuento) * copias * 100) / 100 : 0;
  const totalMarcos = marco ? marco.precio * marcos : 0;
  const totalNube = pdf && nube ? nube.pdf : 0;
  const total = Math.round((totalNube + totalCopias + totalMarcos) * 100) / 100;

  const ofrecerPdf = Boolean(nube && yaTiene && !yaTiene.pdf);

  if (extras.length === 0 && !ofrecerPdf) {
    return <p className="text-sm text-[var(--texto-menor)]">Los extras todavía no tienen precio cargado. Pronto.</p>;
  }

  async function pagar() {
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch(`/api/extras?narrador=${encodeURIComponent(narradorId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf, copias, acabado, marcos }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; urlPago?: string };
      if (!r.ok || !j.urlPago) throw new Error(j.error ?? "No pudimos iniciar el pago.");
      window.location.href = j.urlPago;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar el pago.");
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <p className={etiqueta}>{titulo}</p>

      {ofrecerPdf ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {ofrecerPdf && nube ? (
            <button type="button" aria-pressed={pdf} onClick={() => setPdf((v) => !v)} className={`flex flex-col gap-2 rounded-xl border p-5 text-left transition-colors ${pdf ? "border-[var(--texto)]" : "border-[var(--linea)] hover:border-[var(--linea-fuerte)]"}`}>
              <span className="text-[17px] [font-family:var(--fuente-titulo)]">El libro en PDF</span>
              <span className="text-sm text-[var(--texto-suave)]">Para leerlo acá, capítulo por capítulo, con sus fotos. Incluye sus mejores frases, en su voz.</span>
              <span className="mt-auto pt-1 text-[15px] tabular-nums">{formatear(nube.pdf, moneda, region)}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {(bn || color) ? (
        <div className="rounded-xl border border-[var(--linea)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[17px] [font-family:var(--fuente-titulo)]">{yaTieneImpreso ? "Más copias impresas" : "El libro impreso"}</p>
              <p className="mt-1 text-sm text-[var(--texto-suave)]">Tapa dura, con un código en la contratapa que hace sonar su voz.</p>
              <p className="mt-2 text-sm text-[var(--texto-menor)]">2 copias −10 % · 3 copias −15 % · 4 o más −20 %. Solo en el mismo pedido.</p>
            </div>
            <Contador valor={copias} onChange={setCopias} etiquetaMenos="Una copia menos" etiquetaMas="Una copia más" />
          </div>
          {bn && color ? (
            <div className="mt-4 flex gap-2">
              {(["bn", "color"] as const).map((a) => (
                <button key={a} type="button" onClick={() => setAcabado(a)} className={`${boton} h-9 px-4 ${acabado === a ? "bg-[var(--texto)] text-[var(--fondo)]" : "border border-[var(--linea-fuerte)]"}`}>
                  {a === "bn" ? `Blanco y negro · ${formatear(bn.precio, moneda, region)}` : `A color · ${formatear(color.precio, moneda, region)}`}
                </button>
              ))}
            </div>
          ) : null}
          {copias > 0 && precioCopia ? (
            <p className="mt-4 text-[15px] tabular-nums">
              {copias} × {formatear(precioCopia, moneda, region)}
              {descuento > 0 ? <span className="text-[var(--texto-menor)]"> − {Math.round(descuento * 100)} %</span> : null}
              {" = "}<strong className="font-medium">{formatear(totalCopias, moneda, region)}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      {marco ? (
        <div className="rounded-xl border border-[var(--linea)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[17px] [font-family:var(--fuente-titulo)]">{marco.nombre}</p>
              <p className="mt-1 text-sm text-[var(--texto-suave)]">{marco.detalle}</p>
              <p className="mt-2 text-sm tabular-nums">{formatear(marco.precio, moneda, region)} cada uno</p>
            </div>
            <Contador valor={marcos} onChange={setMarcos} etiquetaMenos="Un marco menos" etiquetaMas="Un marco más" />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--alerta)]">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" disabled={ocupado || total <= 0} onClick={pagar} className={`${boton} bg-[var(--acento)] px-8 text-[var(--sobre-acento)] hover:opacity-90`}>
          {ocupado ? "Un momento…" : total > 0 ? `Pagar ${formatear(total, moneda, region)}` : "Elegí algo para sumar"}
        </button>
        <span className="text-sm text-[var(--texto-menor)]">Pago único. Se produce y se envía cuando el libro esté cerrado.</span>
      </div>
    </div>
  );
}
