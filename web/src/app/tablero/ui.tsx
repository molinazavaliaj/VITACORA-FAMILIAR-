import Link from "next/link";
import type { ReactNode } from "react";
import { ReproductorRespuesta } from "./reproductor";

// Piezas compartidas del panel. Todas usan los roles de color de globals.css
// (--texto, --linea, --acento…), nunca colores crudos, así una pieza sirve en
// claro y en oscuro sin reescribirla.

export const ESTADO_EN_HUMANO: Record<string, string> = {
  pendiente_pago: "Estamos confirmando el pago — apenas entre, le escribimos",
  invitado: "Le mandamos la invitación, falta que acepte",
  acepto: "Aceptó — pronto le llega la primera pregunta",
  activo: "Está respondiendo, día a día",
  pausado: "Pidió una pausa — un llamado tuyo ayuda",
  completado: "Terminó de contar su historia",
  cerrado_anticipado: "Cerramos la entrevista antes de tiempo",
};

export const TOTAL_PREGUNTAS_BASE = 30;

export function Contenedor({ children, ancho = "max-w-3xl" }: { children: ReactNode; ancho?: string }) {
  return <div className={`mx-auto w-full ${ancho} px-6 py-10 md:px-10 md:py-14`}>{children}</div>;
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">
      {children}
    </p>
  );
}

export function Titulo({ children, nivel = 1 }: { children: ReactNode; nivel?: 1 | 2 | 3 }) {
  const clases = {
    1: "text-3xl md:text-4xl leading-[1.15] [letter-spacing:-0.01em]",
    2: "text-2xl leading-snug",
    3: "text-lg leading-snug",
  }[nivel];
  const Tag = (`h${nivel}`) as "h1" | "h2" | "h3";
  return <Tag className={`${clases} font-medium [font-family:var(--fuente-titulo)] [text-wrap:balance]`}>{children}</Tag>;
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--linea)] bg-[var(--fondo)] p-6 ${className}`}>{children}</div>
  );
}

/** El único próximo paso a la vez: una puerta, no una lista. */
export function ProximoPaso({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-xl border border-[var(--acento)] bg-[var(--fondo)] p-5 text-[15px] font-medium text-[var(--texto)] transition-colors hover:bg-[var(--hueco)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)] [font-family:var(--fuente-micro)] [touch-action:manipulation]"
    >
      <span>{children}</span>
      <span aria-hidden className="shrink-0 text-[var(--acento)]">→</span>
    </Link>
  );
}

export function BarraProgreso({ respondidas, total }: { respondidas: number; total: number }) {
  const porcentaje = total > 0 ? Math.min(100, Math.round((respondidas / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--hueco)]">
        <div className="h-full rounded-full bg-[var(--texto)] transition-[width] duration-500 ease-out" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)] tabular-nums">
        {respondidas} de {total} respuestas
      </p>
    </div>
  );
}

export function formatearDuracion(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return `${segundos} s`;
}

export type RespuestaVista = {
  id: string;
  pregunta_orden: number;
  audio_path: string | null;
  texto_directo: string | null;
  transcripcion: string | null;
  duracion_segundos: number | null;
  es_repregunta: boolean;
  recibido_at: string;
};

/** Una respuesta: el audio y, debajo, lo que dijo (la transcripción o el texto). */
export function Respuesta({ respuesta }: { respuesta: RespuestaVista }) {
  const texto = respuesta.transcripcion ?? respuesta.texto_directo;
  return (
    <div className="flex flex-col gap-3">
      {respuesta.audio_path ? (
        <ReproductorRespuesta
          src={`/api/audio/${respuesta.id}`}
          duracion={respuesta.duracion_segundos}
          etiqueta={`respuesta ${respuesta.pregunta_orden}`}
        />
      ) : null}
      {texto ? (
        <p className="text-[16px] leading-[1.7] text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)] font-light">
          {texto}
        </p>
      ) : respuesta.audio_path ? (
        <p className="text-sm text-[var(--texto-menor)]">Estamos transcribiendo el audio…</p>
      ) : (
        <p className="text-sm text-[var(--texto-menor)]">Sin contenido todavía.</p>
      )}
    </div>
  );
}

export function EstadoError({ mensaje = "No pudimos cargar esta pantalla. Actualizá en un momento." }) {
  return (
    <Contenedor>
      <p className="text-sm text-[var(--texto-menor)]">{mensaje}</p>
    </Contenedor>
  );
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long" });
}
