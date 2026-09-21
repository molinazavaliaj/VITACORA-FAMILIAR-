import type { ReactNode } from "react";

// Las piezas del panel de la empresa. El marcado sigue al mockup commiteado
// (docs/panel-interno.html), que es la autoridad visual: misma jerarquía, mismos textos,
// mismas cajas. Acá también viven los formateadores, que son lo único de esta pantalla
// que se puede romper sin que se vea: por eso tienen sus tests.

/** Los euros, como se escriben acá: con coma y con el símbolo. */
export function euros(n: number): string {
  return `${(Number.isFinite(n) ? n : 0).toFixed(2).replace(".", ",")} €`;
}

/** Los tiempos, como los dice una persona: minutos, horas o días. Nunca "0,5 h". */
export function horasEnPalabras(horas: number): string {
  if (!Number.isFinite(horas) || horas < 0) return "—";
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
  if (horas < 48) return `${Math.round(horas)} hs`;
  return `${Math.floor(horas / 24)} días`;
}

/** La fecha corta. Sin dato NO se inventa: guion. */
export function fechaCorta(iso: string | null, conAnio = false): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const d = new Date(t);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return conAnio ? `${dd}/${mm}/${d.getUTCFullYear()}` : `${dd}/${mm}`;
}

/** "hace 6 hs", "sin uso". Es lo que va en la esquina de cada caja. */
export function cuando(iso: string | null, ahora: Date = new Date()): string {
  if (!iso) return "sin uso";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "sin uso";
  const horas = (ahora.getTime() - t) / 3600_000;
  if (horas < 0) return "recién";
  if (horas < 1) return `hace ${Math.max(1, Math.round(horas * 60))} min`;
  if (horas < 24) return `hace ${Math.round(horas)} hs`;
  return `hace ${Math.floor(horas / 24)} días`;
}

export type Color = "verde" | "ambar" | "rojo" | "neutro";

const PUNTO: Record<Color, string> = {
  verde: "bg-[var(--acento)]",
  ambar: "bg-[#B07A18]",
  rojo: "bg-[var(--alerta)]",
  neutro: "bg-[var(--ceniza)]",
};

export function Punto({ color }: { color: Color }) {
  return <i className={`mr-2 inline-block h-2 w-2 shrink-0 rounded-full ${PUNTO[color]}`} />;
}

const CHIP: Record<Color, string> = {
  verde: "border-[var(--acento)] text-[var(--acento)]",
  ambar: "border-[#B07A18] text-[#8A5F10]",
  rojo: "border-[var(--alerta)] text-[var(--alerta)]",
  neutro: "border-[var(--linea-fuerte)] text-[var(--texto-menor)]",
};

export function Chip({ color = "neutro", children }: { color?: Color; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${CHIP[color]}`}>
      {children}
    </span>
  );
}

/** El encabezado de cada pantalla: el número, el nombre y la pregunta que contesta. */
export function Titulo({ numero, nombre, aclara }: { numero: string; nombre: string; aclara: string }) {
  return (
    <div className="mb-1 flex flex-wrap items-baseline gap-3 border-b border-[var(--linea)] pb-3">
      <span className="text-xs text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">{numero}</span>
      <h1 className="text-2xl [font-family:var(--fuente-titulo)]">{nombre}</h1>
      <em className="text-sm text-[var(--texto-menor)]">{aclara}</em>
    </div>
  );
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[var(--linea)] bg-[var(--relieve)] p-5 ${className}`}>
      {children}
    </div>
  );
}

/** Un grupo de la pantalla de Estado: "Se frenó", "Hay que estar atento", "Va solo". */
export function Grupo({
  color,
  titulo,
  cuenta,
  children,
}: {
  color: Color;
  titulo: string;
  cuenta: number;
  children: ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
        <Punto color={color} />
        {titulo}
        <span className="text-[var(--texto)]">{cuenta}</span>
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/** Una línea de "esto pasó": el punto, qué pasó y cuándo. */
export function Item({
  color,
  titulo,
  detalle,
  hace,
}: {
  color: Color;
  titulo: string;
  detalle?: string;
  hace?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded border border-[var(--linea)] px-4 py-3">
      <span className="pt-1.5">
        <Punto color={color} />
      </span>
      <div className="flex-1">
        <b className="block">{titulo}</b>
        {detalle ? <p className="text-sm text-[var(--texto-suave)]">{detalle}</p> : null}
      </div>
      {hace ? <span className="whitespace-nowrap text-xs text-[var(--texto-menor)]">{hace}</span> : null}
    </div>
  );
}

export function Barra({ proporcion }: { proporcion: number }) {
  const ancho = Math.max(0, Math.min(100, proporcion * 100));
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--hueco)]">
      <div className="h-1.5 rounded-full bg-[var(--acento)]" style={{ width: `${ancho}%` }} />
    </div>
  );
}

/** Cuando la lista que alimenta la sección viene vacía. Nunca una tabla con guiones. */
export function SinDatos({ que }: { que: string }) {
  return <p className="rounded border border-dashed border-[var(--linea-fuerte)] px-4 py-3 text-sm text-[var(--texto-menor)]">{que}</p>;
}

export function Nota({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-sm leading-relaxed text-[var(--texto-menor)]">{children}</p>;
}
