import Link from "next/link";
import type { Rol } from "@/lib/panel";

// El riel de la izquierda de una historia (docs/panel-usuario.md §15.3):
// primero las historias creadas con el botón violeta de empezar otra, y
// debajo los capítulos de la historia abierta, con cuántas ya contestó. En el
// celular no se ve: las historias viven en el selector de la cabecera y los
// capítulos, en la fila de pastillas.

export type HistoriaRiel = { id: string; nombre: string; rol: Rol; estado: string };
export type CapituloRiel = { nombre: string; contestadas: number; total: number };

const ESTADO_CORTO: Record<string, string> = {
  pendiente_pago: "confirmando el pago",
  invitado: "esperando que acepte",
  acepto: "aceptó, arranca pronto",
  activo: "respondiendo",
  pausado: "en pausa",
  completado: "terminó de contar",
  cerrado_anticipado: "cerrada antes de tiempo",
};

const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)]";

export function Riel({
  historias,
  actual,
  capitulos,
  respondidas,
  total,
  segundosDeVoz,
  capituloActivo,
}: {
  historias: HistoriaRiel[];
  actual: string;
  capitulos?: CapituloRiel[];
  respondidas?: number;
  total?: number;
  segundosDeVoz?: number;
  capituloActivo?: number;
}) {
  const minutos = Math.floor((segundosDeVoz ?? 0) / 60);
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-4 self-start lg:sticky lg:top-10 lg:flex" aria-label="Historias y capítulos">
      <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Historias</p>
      <nav className="flex flex-col gap-0.5" aria-label="Tus historias">
        {historias.map((h) => {
          const activa = h.id === actual;
          return (
            <Link
              key={h.id}
              href={`/tablero/${h.id}`}
              aria-current={activa ? "page" : undefined}
              className={`flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--hueco)] ${foco} ${activa ? "bg-[var(--hueco)]" : ""}`}
            >
              <span className="truncate text-[15px] [font-family:var(--fuente-titulo)]">La historia de {h.nombre}</span>
              <span className="truncate text-[11px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                {h.rol === "invitado" ? "te invitaron · " : h.rol === "visitante" ? "la guardaste · " : ""}
                {ESTADO_CORTO[h.estado] ?? h.estado}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="flex justify-center">
        <Link
          href="/comprar"
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--acento)] px-5 text-[14px] font-medium text-[var(--sobre-acento)] transition-opacity hover:opacity-90 [font-family:var(--fuente-micro)] ${foco}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
          Empezar una historia
        </Link>
      </div>

      {capitulos && capitulos.length > 0 ? (
        <>
          <div className="my-1 h-px bg-[var(--linea)]" />
          {typeof respondidas === "number" && typeof total === "number" ? (
            <div className="flex flex-col gap-2.5 rounded-xl bg-[var(--relieve)] p-4">
              <div className="flex justify-between text-[12px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)] tabular-nums">
                <span>{respondidas} de {total}</span>
                {minutos > 0 ? <span>{minutos} min de voz</span> : null}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--linea-fuerte)]">
                <div className="h-full rounded-full bg-[var(--texto)] transition-[width] duration-500 ease-out" style={{ width: `${total > 0 ? Math.min(100, Math.round((respondidas / total) * 100)) : 0}%` }} />
              </div>
            </div>
          ) : null}
          <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Capítulos</p>
          <nav className="flex flex-col gap-0.5" aria-label="Capítulos">
            {capitulos.map((c, i) => {
              const activo = i === capituloActivo;
              const empezado = c.contestadas > 0;
              return (
                <a
                  key={c.nombre}
                  href={`#cap-${i}`}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[14px] transition-colors hover:bg-[var(--hueco)] [font-family:var(--fuente-micro)] ${foco} ${activo ? "bg-[var(--hueco)]" : ""} ${empezado ? "text-[var(--texto)]" : "text-[var(--texto-menor)]"}`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="tabular-nums text-[var(--texto-menor)]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">{c.nombre}</span>
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--texto-menor)]">
                    {c.contestadas}/{c.total}
                  </span>
                </a>
              );
            })}
          </nav>
        </>
      ) : null}
    </aside>
  );
}
