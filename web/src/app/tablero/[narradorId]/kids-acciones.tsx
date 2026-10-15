"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HORAS_KIDS, TEMAS_KIDS, type TemaKids } from "@/lib/kids";
import type { PreguntaPadre } from "@/lib/kids-compra";
import type { CorreccionKids } from "@/lib/kids-panel";
import { HORA, PANEL_CASILLA, PANEL_KIDS, QUIEN_LA_MANDA, TEMAS } from "../../_textos/panel-kids";

// Lo que el padre toca en el panel de Kids (K5): corregir un nombre, sus
// preguntas para el libro, y la hora y los temas. Todo va por /api/kids/*; la
// página se refresca y muestra lo guardado (o lo pendiente) desde la base.

const T = PANEL_KIDS;
const campo =
  "w-full rounded-md border border-[var(--linea-fuerte)] bg-[var(--relieve)] px-3 text-[15px] text-[var(--texto)] focus:border-[var(--texto)] focus:outline-none";

async function enviar(url: string, metodo: "PATCH" | "POST" | "DELETE", cuerpo: unknown): Promise<string | null> {
  try {
    const r = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    if (r.ok) return null;
    const datos = (await r.json().catch(() => null)) as { error?: string } | null;
    return datos?.error ?? T.errores.generico;
  } catch {
    return T.errores.generico;
  }
}

function Aviso({ error, listo }: { error: string | null; listo: string | null }) {
  if (error) return <p role="alert" className="text-[14px] text-[var(--alerta)]">{error}</p>;
  if (listo) return <p role="status" className="text-[14px] text-[var(--texto-suave)]">{listo}</p>;
  return null;
}

// ── Corregir un nombre ───────────────────────────────────────────────────

export function CorregirNombre({ narradorId, respuestaId, correcciones }: { narradorId: string; respuestaId: string; correcciones: CorreccionKids[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [dice, setDice] = useState("");
  const [es, setEs] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/kids/correcciones?narrador=${encodeURIComponent(narradorId)}`;

  async function guardar() {
    if (!dice.trim() || !es.trim()) return setError(T.errores.vacio);
    setGuardando(true);
    setError(null);
    const e = await enviar(url, "POST", { respuestaId, dice, es });
    setGuardando(false);
    if (e) return setError(e);
    setAbierto(false);
    setDice("");
    setEs("");
    router.refresh();
  }

  async function quitar(c: CorreccionKids) {
    setError(null);
    const e = await enviar(url, "DELETE", { respuestaId, dice: c.dice });
    if (e) return setError(e);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {correcciones.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {correcciones.map((c) => (
            <li key={c.dice} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-[var(--texto-suave)] [font-family:var(--fuente-micro)]">
              <span>{T.correccion.linea(c.dice, c.es)}</span>
              <button type="button" onClick={() => quitar(c)} className="min-h-9 text-[var(--texto-menor)] underline underline-offset-2 hover:text-[var(--texto)] [touch-action:manipulation]">
                {T.correccion.quitar}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {abierto ? (
        <div className="flex flex-col gap-3 rounded-md border border-[var(--linea)] p-3">
          <p className="text-[13.5px] leading-snug text-[var(--texto-menor)]">{T.correccion.ayuda}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[13px] text-[var(--texto-suave)] [font-family:var(--fuente-micro)]">
              {T.correccion.dice}
              <input value={dice} onChange={(e) => setDice(e.target.value)} maxLength={60} className={`${campo} h-11`} />
            </label>
            <label className="flex flex-col gap-1 text-[13px] text-[var(--texto-suave)] [font-family:var(--fuente-micro)]">
              {T.correccion.es}
              <input value={es} onChange={(e) => setEs(e.target.value)} maxLength={60} className={`${campo} h-11`} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={guardar} disabled={guardando} className="pnl-boton pnl-boton--lleno disabled:opacity-60">
              {guardando ? T.guardando : T.correccion.guardar}
            </button>
            <button type="button" onClick={() => { setAbierto(false); setError(null); }} className="pnl-boton pnl-boton--hilo">
              {T.correccion.cancelar}
            </button>
          </div>
          <Aviso error={error} listo={null} />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="min-h-9 w-fit text-[13.5px] text-[var(--texto-menor)] underline underline-offset-2 hover:text-[var(--texto)] [font-family:var(--fuente-micro)] [touch-action:manipulation]"
          >
            {T.correccion.boton}
          </button>
          <Aviso error={error} listo={null} />
        </div>
      )}
    </div>
  );
}

// ── Tus preguntas para el libro ──────────────────────────────────────────

export type FilaPregunta = { texto: string; quien: string; sinLinea: boolean };

/** Las tres filas del formulario: las preguntas que hay y, de entrada, «¿Quién se la manda?» = quién se lo regala. */
export function filasIniciales(preguntas: PreguntaPadre[], quienRegala: string): FilaPregunta[] {
  return [0, 1, 2].map((i) => {
    const p = preguntas[i];
    return { texto: p?.texto ?? "", quien: p?.quien ?? quienRegala, sinLinea: p ? !p.conLinea : false };
  });
}

/** Lo que se manda: las filas con texto, con conLinea = !casilla (PANEL-CASILLA). */
export function preguntasParaGuardar(filas: FilaPregunta[]): PreguntaPadre[] {
  return filas
    .filter((f) => f.texto.trim() !== "")
    .map((f) => ({ texto: f.texto.trim(), conLinea: !f.sinLinea, ...(f.quien.trim() ? { quien: f.quien.trim() } : {}) }));
}

export function PreguntasDelPadre({
  narradorId,
  preguntas,
  quienRegala,
}: {
  narradorId: string;
  /** Lo pendiente si hay, si no las de la ficha. */
  preguntas: PreguntaPadre[];
  quienRegala: string;
}) {
  const router = useRouter();
  const [filas, setFilas] = useState<FilaPregunta[]>(() => filasIniciales(preguntas, quienRegala));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);

  const cambiar = (i: number, parte: Partial<FilaPregunta>) => {
    setListo(null);
    setFilas((actual) => actual.map((f, j) => (j === i ? { ...f, ...parte } : f)));
  };

  async function guardar() {
    setGuardando(true);
    setError(null);
    setListo(null);
    const e = await enviar(`/api/kids/panel?narrador=${encodeURIComponent(narradorId)}`, "PATCH", { preguntasPadre: preguntasParaGuardar(filas) });
    setGuardando(false);
    if (e) return setError(e);
    setListo(T.pendiente);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {filas.map((f, i) => (
        <fieldset key={i} className="flex flex-col gap-3 border-t border-[var(--linea)] pt-5">
          <legend className="pnl-micro float-left mb-1 w-full">{T.preguntas.n(i + 1)}</legend>
          <textarea
            aria-label={T.preguntas.n(i + 1)}
            value={f.texto}
            onChange={(e) => cambiar(i, { texto: e.target.value })}
            placeholder={T.preguntas.pista}
            maxLength={400}
            rows={3}
            className={`${campo} py-2.5 leading-relaxed`}
          />
          <label className="flex flex-col gap-1 text-[13px] text-[var(--texto-suave)] [font-family:var(--fuente-micro)]">
            {QUIEN_LA_MANDA}
            <input value={f.quien} onChange={(e) => cambiar(i, { quien: e.target.value })} maxLength={60} disabled={f.sinLinea} className={`${campo} h-11 disabled:opacity-50`} />
          </label>
          <label className="flex min-h-11 items-start gap-3 text-[14px] leading-snug text-[var(--texto-suave)] [touch-action:manipulation]">
            <input type="checkbox" checked={f.sinLinea} onChange={(e) => cambiar(i, { sinLinea: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--acento)]" />
            <span>{PANEL_CASILLA}</span>
          </label>
        </fieldset>
      ))}
      <div className="flex flex-col gap-2">
        <button type="button" onClick={guardar} disabled={guardando} className="pnl-boton pnl-boton--lleno w-full disabled:opacity-60 sm:w-fit">
          {guardando ? T.guardando : T.preguntas.guardar}
        </button>
        <Aviso error={error} listo={listo} />
      </div>
    </div>
  );
}

// ── La hora y los temas ──────────────────────────────────────────────────

export function HoraYTemas({ narradorId, hora, temasSacados }: { narradorId: string; hora: string; temasSacados: TemaKids[] }) {
  const router = useRouter();
  const [h, setH] = useState(hora);
  const [temas, setTemas] = useState<TemaKids[]>(temasSacados);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    setListo(null);
    const e = await enviar(`/api/kids/panel?narrador=${encodeURIComponent(narradorId)}`, "PATCH", { hora: h, temasSacados: temas });
    setGuardando(false);
    if (e) return setError(e);
    setListo(T.pendiente);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5 text-[14px] font-medium text-[var(--texto)] [font-family:var(--fuente-micro)]">
        {HORA.etiqueta}
        <select value={h} onChange={(e) => { setH(e.target.value); setListo(null); }} className={`${campo} h-11 w-full sm:w-40`}>
          {HORAS_KIDS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <span className="text-[13px] font-normal text-[var(--texto-menor)]">{HORA.ayuda}</span>
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[14px] font-medium text-[var(--texto)] [font-family:var(--fuente-micro)]">{TEMAS.leyenda}</legend>
        {TEMAS_KIDS.map((t) => (
          <label key={t} className="flex min-h-11 items-start gap-3 text-[14.5px] leading-snug text-[var(--texto-suave)] [touch-action:manipulation]">
            <input
              type="checkbox"
              checked={temas.includes(t)}
              onChange={(e) => {
                setListo(null);
                setTemas((actual) => (e.target.checked ? TEMAS_KIDS.filter((x) => x === t || actual.includes(x)) : actual.filter((x) => x !== t)));
              }}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--acento)]"
            />
            <span>{TEMAS.nombres[t]}</span>
          </label>
        ))}
        <p className="mt-1 text-[13px] leading-snug text-[var(--texto-menor)]">{T.ajustes.temasAyuda}</p>
      </fieldset>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={guardar} disabled={guardando} className="pnl-boton pnl-boton--lleno w-full disabled:opacity-60 sm:w-fit">
          {guardando ? T.guardando : T.ajustes.guardar}
        </button>
        <Aviso error={error} listo={listo} />
      </div>
    </div>
  );
}
