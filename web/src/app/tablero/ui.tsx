import Link from "next/link";
import type { ReactNode } from "react";
import { ReproductorRespuesta } from "./reproductor";
import { textosComprador, type TratoComprador } from "@/lib/regalo-textos";

// Piezas compartidas del panel. Todas usan los roles de color de globals.css
// (--texto, --linea, --acento…), nunca colores crudos, así una pieza sirve en
// claro y en oscuro sin reescribirla.

// El estado del regalo se dice igual de vos y de tú.
const REGALO_PENDIENTE = textosComprador("vos").estadoPanel;

export const ESTADO_EN_HUMANO: Record<string, string> = {
  pendiente_pago: "Estamos confirmando el pago — apenas entre, le escribimos",
  regalo_pendiente: REGALO_PENDIENTE,
  invitado: "Le mandamos la invitación, falta que acepte",
  acepto: "Aceptó — pronto le llega la primera pregunta",
  activo: "Está respondiendo, a su ritmo",
  pausado: "Pidió una pausa — un llamado tuyo ayuda",
  completado: "Terminó de contar su historia",
  cerrado_anticipado: "Cerramos la entrevista antes de tiempo",
};

/** Cuando el libro es del que compra ("para mí"): el panel le habla de vos. */
export const ESTADO_EN_HUMANO_PROPIO: Record<string, string> = {
  pendiente_pago: "Estamos confirmando el pago — apenas entre, te escribimos",
  regalo_pendiente: REGALO_PENDIENTE,
  invitado: "Te mandamos el primer mensaje por WhatsApp, falta que aceptes",
  acepto: "Aceptaste — pronto te llega la primera pregunta",
  activo: "Estás respondiendo, a tu ritmo",
  pausado: "Pediste una pausa — retomás cuando quieras",
  completado: "Terminaste de contar tu historia",
  cerrado_anticipado: "Cerramos la entrevista antes de tiempo",
};

/** Lo que cambia de tú (España) en los estados. */
const ESTADO_EN_HUMANO_TU: Record<string, string> = {
  pausado: "Pidió una pausa — una llamada tuya ayuda",
};
const ESTADO_EN_HUMANO_PROPIO_TU: Record<string, string> = {
  pausado: "Pediste una pausa — retomas cuando quieras",
};

export function estadoEnHumano(estado: string, propia: boolean, trato: TratoComprador = "vos"): string {
  const tu = trato === "tu" ? (propia ? ESTADO_EN_HUMANO_PROPIO_TU : ESTADO_EN_HUMANO_TU)[estado] : undefined;
  return tu ?? (propia ? ESTADO_EN_HUMANO_PROPIO : ESTADO_EN_HUMANO)[estado] ?? estado;
}

/** "La historia de Roberto", o "Tu historia" cuando es propia. */
export function tituloHistoria(nombre: string, propia: boolean): string {
  return propia ? "Tu historia" : `La historia de ${nombre}`;
}

export const TOTAL_PREGUNTAS_BASE = 30;

// Rediseño 2026-10 (fase 2): las piezas de abajo son las mismas, con la letra
// y las hojas de la dirección «la web es un libro» (clases pnl-, panel.css).
// Así las sub-pantallas (dudas, frases, nombres, preguntas, libro, leer,
// cuenta) cambian de piel sin tocar su lógica.

export function Contenedor({ children, ancho = "max-w-3xl" }: { children: ReactNode; ancho?: string }) {
  return <div className={`pnl-cuerpo mx-auto w-full ${ancho} px-4 py-8 sm:px-8 md:py-12`}>{children}</div>;
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return (
    <p className="pnl-micro">{children}</p>
  );
}

export function Titulo({ children, nivel = 1 }: { children: ReactNode; nivel?: 1 | 2 | 3 }) {
  const clases = { 1: "pnl-titular", 2: "pnl-h2", 3: "pnl-h3" }[nivel];
  const Tag = (`h${nivel}`) as "h1" | "h2" | "h3";
  return <Tag className={clases}>{children}</Tag>;
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`pnl-hoja p-6 ${className}`}>{children}</div>
  );
}

/** El único próximo paso a la vez: una puerta, no una lista. */
export function ProximoPaso({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="pnl-hoja group flex items-center justify-between gap-4 py-4 pl-5 pr-4 text-[17px] leading-snug text-[var(--texto)] transition-[border-color,transform] duration-200 hover:border-[var(--linea-fuerte)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] [font-family:var(--fuente-titulo)] [touch-action:manipulation]"
    >
      <span>{children}</span>
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--texto)] text-[15px] text-[var(--fondo)] transition-transform duration-200 group-hover:translate-x-0.5 [font-family:var(--fuente-micro)]">→</span>
    </Link>
  );
}

export function BarraProgreso({ respondidas, total }: { respondidas: number; total: number }) {
  const porcentaje = total > 0 ? Math.min(100, Math.round((respondidas / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="h-[2px] w-full overflow-hidden rounded-full bg-[var(--linea)]">
        <div className="h-full rounded-full bg-[var(--texto)] transition-[width] duration-500 ease-out" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="pnl-dato">
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

const ERROR_CARGA: Record<TratoComprador, string> = {
  vos: "No pudimos cargar esta pantalla. Actualizá en un momento.",
  tu: "No pudimos cargar esta pantalla. Actualiza en un momento.",
};

export function EstadoError({ trato = "vos", mensaje = ERROR_CARGA[trato] }: { trato?: TratoComprador; mensaje?: string }) {
  return (
    <Contenedor>
      <p className="text-sm text-[var(--texto-menor)]">{mensaje}</p>
    </Contenedor>
  );
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long" });
}
