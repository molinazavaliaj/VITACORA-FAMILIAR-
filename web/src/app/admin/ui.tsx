import Link from "next/link";
import type { ReactNode } from "react";
import { seccionDe } from "./secciones";

// Las piezas del panel de la empresa. La jerarquía y los textos vienen del mockup
// commiteado (docs/panel-interno.html); la piel, desde el rediseño del 02/11, es la del
// libro (panel.css): hojas de papel, títulos de Playfair y un semáforo apagado. Acá
// también viven los formateadores, que son lo único de esta pantalla que se puede romper
// sin que se vea: por eso tienen sus tests.

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

/** La clase del tono: pone --tono y --tono-fondo (panel.css). */
export const tono = (color: Color) => `adm-tono-${color}`;

/** El punto del semáforo. El rojo late. */
export function Punto({ color }: { color: Color }) {
  return <i className={`adm-punto ${tono(color)}`} />;
}

export function Chip({ color = "neutro", children }: { color?: Color; children: ReactNode }) {
  return <span className={`adm-chip ${tono(color)}`}>{children}</span>;
}

/**
 * El encabezado de cada pantalla: el número y el grupo, el nombre en grande y la pregunta
 * que contesta. Salen de `secciones.tsx`, así la barra y el título dicen lo mismo. Lo que
 * va adentro (`children`) es la bajada: cómo se lee la pantalla, en dos líneas.
 */
export function Titulo({ ruta, aclara, children }: { ruta: string; aclara?: string; children?: ReactNode }) {
  const s = seccionDe(ruta);
  return (
    <header className="mb-8">
      <p className="adm-micro">
        {s.numero} · {s.grupo}
      </p>
      <h1 className="adm-h1 mt-3">{s.nombre}</h1>
      <p className="adm-pregunta mt-2">{aclara ?? s.pregunta}</p>
      {children ? <div className="adm-bajada mt-4">{children}</div> : null}
    </header>
  );
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`adm-hoja p-5 ${className}`}>{children}</div>;
}

/**
 * Un número que se mira de un vistazo: qué es, cuánto, y una línea que lo explica. Con
 * `href` es un atajo (la hoja se levanta al pasar); con `color`, lleva el filo del semáforo.
 */
export function Cifra({
  etiqueta,
  valor,
  detalle,
  color,
  href,
  className = "",
}: {
  etiqueta: string;
  valor: ReactNode;
  detalle?: ReactNode;
  color?: Color;
  href?: string;
  className?: string;
}) {
  const clases = `adm-hoja flex flex-col p-5 ${color ? `adm-filo ${tono(color)}` : ""} ${className}`;
  const adentro = (
    <>
      <span className="adm-micro flex items-center gap-2">
        {color ? <Punto color={color} /> : null}
        {etiqueta}
      </span>
      <span className="adm-cifra mt-3">{valor}</span>
      {detalle ? <span className="mt-2 text-sm leading-snug text-[var(--texto-menor)]">{detalle}</span> : null}
    </>
  );
  return href ? (
    <Link href={href} className={clases}>
      {adentro}
    </Link>
  ) : (
    <div className={clases}>{adentro}</div>
  );
}

/** Un grupo de la pantalla de Estado: "Se frenó", "Hay que estar atento", "Va solo". */
export function Grupo({
  color,
  titulo,
  cuenta,
  id,
  children,
}: {
  color: Color;
  titulo: string;
  cuenta: number;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-8 scroll-mt-24">
      <h2 className="adm-micro mb-3">
        <span className="flex items-center gap-2.5">
          <Punto color={color} />
          {titulo}
          <span className={`adm-chip ${tono(color)}`}>{cuenta}</span>
        </span>
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/** Una línea de "esto pasó": el filo del color, qué pasó y cuándo. */
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
    <div className={`adm-hoja adm-hoja--viva adm-filo ${tono(color)} flex items-start gap-3 px-5 py-4`}>
      <span className="pt-2">
        <Punto color={color} />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block font-medium leading-snug">{titulo}</b>
        {detalle ? <p className="mt-0.5 text-sm text-[var(--texto-suave)]">{detalle}</p> : null}
      </div>
      {hace ? <span className="adm-dato whitespace-nowrap pt-1 text-xs text-[var(--texto-menor)]">{hace}</span> : null}
    </div>
  );
}

/** La barra de avance. Crece al aparecer. */
export function Barra({ proporcion, color }: { proporcion: number; color?: Color }) {
  const ancho = Math.max(0, Math.min(100, (Number.isFinite(proporcion) ? proporcion : 0) * 100));
  return (
    <div className={`adm-barra ${color ? tono(color) : ""}`}>
      <i style={{ width: `${ancho}%` }} />
    </div>
  );
}

/** Una barra partida en tonos: cuánto de cada cosa sobre el total. Vacía si no hay nada. */
export function Proporcion({ partes, etiqueta }: { partes: { valor: number; color: Color }[]; etiqueta: string }) {
  const total = partes.reduce((s, p) => s + Math.max(0, p.valor), 0);
  return (
    <div className="adm-barra adm-barra--gruesa" role="img" aria-label={etiqueta}>
      {total > 0
        ? partes
            .filter((p) => p.valor > 0)
            .map((p) => <i key={p.color} className={tono(p.color)} style={{ width: `${(p.valor / total) * 100}%` }} />)
        : null}
    </div>
  );
}

/** Qué quiere decir cada color, al pie de la pantalla que los usa. */
export function Leyenda({ items }: { items: { color: Color; texto: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--texto-menor)]">
      {items.map((i) => (
        <li key={i.color} className="flex items-center gap-2.5">
          <Punto color={i.color} />
          {i.texto}
        </li>
      ))}
    </ul>
  );
}

/** Cuando la lista que alimenta la sección viene vacía. Nunca una tabla con guiones. */
export function SinDatos({ que }: { que: string }) {
  return (
    <p className="rounded-lg border border-dashed border-[var(--linea-fuerte)] px-5 py-4 text-sm leading-relaxed text-[var(--texto-menor)]">
      {que}
    </p>
  );
}

/** La letra chica que explica de dónde sale lo que se ve. */
export function Nota({ children }: { children: ReactNode }) {
  return (
    <div className="adm-nota mt-10">
      <b>Cómo se lee</b>
      <p>{children}</p>
    </div>
  );
}
