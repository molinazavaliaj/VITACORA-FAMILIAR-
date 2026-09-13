import { Toroide } from "./marca";

// Maquetas del producto hechas en código, para que la landing se vea completa
// sin esperar el material real (video, captura, mp3). Respetan docs/design.md:
// escala de grises, el violeta no toca nada acá (lo tiene el botón), tipografía
// de marca. Nada de caras ni de stock — son objetos: un teléfono, un libro, una
// onda de sonido, un panel.
//
// El narrador es ficticio ("Roberto"); las preguntas y los capítulos son los
// reales del guion (supabase/seed.sql). Cuando exista material real, cada
// maqueta se reemplaza por la pieza real sin tocar la estructura de la página.
//
// Las animaciones viven en globals.css (.maqueta-*) y fallan hacia el estado
// final: con prefers-reduced-motion todo se ve quieto y completo.

export const CAPITULOS = [
  "La infancia",
  "Las raíces",
  "La juventud",
  "El amor",
  "El oficio",
  "Los hijos",
  "Las pruebas",
  "La sabiduría",
] as const;

const NARRADOR = "Roberto";

// Una onda de sonido determinista (nada de Math.random: renderiza igual en el
// servidor y en el cliente, sin errores de hidratación).
function alturas(n: number, semilla: number) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const v = Math.abs(Math.sin(i * 1.7 + semilla) * 0.6 + Math.sin(i * 0.45 + semilla * 2) * 0.4);
    out.push(0.18 + v * 0.82);
  }
  return out;
}

function Onda({ barras = 34, semilla = 1, className = "" }: { barras?: number; semilla?: number; className?: string }) {
  const hs = alturas(barras, semilla);
  return (
    <svg viewBox={`0 0 ${barras * 3} 24`} className={className} aria-hidden preserveAspectRatio="none">
      {hs.map((h, i) => (
        <rect key={i} x={i * 3} y={12 - h * 11} width={1.8} height={h * 22} rx={0.9} fill="currentColor" />
      ))}
    </svg>
  );
}

function IconoMic({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  );
}

function IconoPlay({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

/* ───────────────────────── El teléfono ───────────────────────── */

type ChatProps = {
  /** Con animación: la pregunta llega, él contesta, se escribe la página. */
  animado?: boolean;
  pregunta?: string;
  dia?: number;
  duracion?: string;
  className?: string;
};

/**
 * La conversación de WhatsApp, en gris. Es "cómo funciona" sin leer nada:
 * llega una pregunta, él aprieta el micrófono, listo.
 */
export function ChatWhatsApp({
  animado = false,
  pregunta = "Cuénteme de la casa donde pasó su infancia. Si cierra los ojos y entra por la puerta, ¿qué ve, qué huele, quién está?",
  dia = 1,
  duracion = "2:14",
  className = "",
}: ChatProps) {
  const paso = (n: number) => (animado ? `maqueta-paso maqueta-paso-${n}` : "");
  return (
    <figure className={`mx-auto w-full max-w-[320px] ${className}`}>
      <div className="overflow-hidden rounded-[2rem] border border-[#2B2B24] bg-[#1C1C16] p-2 text-[#EBEBE7] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
        <div className="overflow-hidden rounded-[1.5rem] bg-[#14140F]">
          {/* Cabecera del chat */}
          <div className="flex items-center gap-3 border-b border-[#2B2B24] px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2B2B24]">
              <Toroide className="h-4 w-auto text-[#EBEBE7]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium [font-family:var(--fuente-micro)]">Vitácora Familiar</p>
              <p className="text-[11px] text-[#83837A] [font-family:var(--fuente-micro)]">tu biógrafo</p>
            </div>
          </div>

          {/* La conversación */}
          <div className="flex min-h-[300px] flex-col gap-3 px-3 py-4">
            <p className="self-center rounded-full bg-[#2B2B24] px-3 py-1 text-[10px] uppercase text-[#AEAEA6] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">
              Día {dia} · 9:30
            </p>

            <div className={`max-w-[88%] self-start rounded-2xl rounded-tl-sm bg-[#2B2B24] px-3.5 py-2.5 ${paso(1)}`}>
              <p className="text-[13.5px] leading-[1.5] [font-family:var(--fuente-cuerpo)]">
                Buen día, {NARRADOR}. {pregunta}
              </p>
            </div>

            {/* Él graba */}
            <div className={`flex items-center gap-2 self-end text-[11px] text-[#83837A] [font-family:var(--fuente-micro)] ${paso(2)}`}>
              <IconoMic className="h-3.5 w-3.5" />
              grabando…
            </div>

            {/* El audio */}
            <div className={`flex w-[82%] items-center gap-3 self-end rounded-2xl rounded-tr-sm bg-[#EBEBE7] px-3 py-2.5 text-[#14140F] ${paso(3)}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#14140F] text-[#EBEBE7]">
                <IconoPlay className="h-4 w-4" />
              </span>
              <Onda barras={28} semilla={3} className="h-6 min-w-0 flex-1 text-[#45453C]" />
              <span className="shrink-0 text-[11px] tabular-nums text-[#5F5F55] [font-family:var(--fuente-micro)]">{duracion}</span>
            </div>

            <div className={`max-w-[88%] self-start rounded-2xl rounded-tl-sm bg-[#2B2B24] px-3.5 py-2.5 ${paso(4)}`}>
              <p className="text-[13.5px] leading-[1.5] [font-family:var(--fuente-cuerpo)]">
                Qué lindo eso del patio con la parra. Mañana le pregunto por sus padres.
              </p>
            </div>
          </div>

          {/* La barra de escribir */}
          <div className="flex items-center gap-2 border-t border-[#2B2B24] px-3 py-2.5">
            <span className="h-8 flex-1 rounded-full bg-[#2B2B24]" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBEBE7] text-[#14140F]">
              <IconoMic className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        Una conversación de WhatsApp: el biógrafo pregunta, {NARRADOR} contesta con un audio.
      </figcaption>
    </figure>
  );
}

/* ───────────────────────── La página que se escribe ───────────────────────── */

/**
 * La página del libro que aparece cuando él termina de hablar. Va al lado del
 * teléfono en el hero: audio a la izquierda, libro a la derecha.
 */
export function PaginaEscrita({ animado = false, className = "" }: { animado?: boolean; className?: string }) {
  return (
    <figure
      className={`w-full max-w-[300px] bg-white px-7 py-8 text-[#14140F] shadow-[0_30px_60px_-30px_rgba(20,20,15,0.5)] ${animado ? "maqueta-paso maqueta-paso-5" : ""} ${className}`}
    >
      <p className="text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.28em]">
        Capítulo uno
      </p>
      <p className="mt-2 text-2xl [font-family:var(--fuente-titulo)] font-medium">La infancia</p>
      <p className="mt-5 text-[13.5px] leading-[1.75] text-[#2B2B24] [font-family:var(--fuente-cuerpo)] font-light">
        <span className="float-left mr-2 mt-[2px] text-[2.6rem] leading-[0.8] [font-family:var(--fuente-titulo)]">L</span>
        a casa tenía un patio largo con una parra que mi padre había plantado el año que nací. En verano
        almorzábamos debajo, y yo me acuerdo del olor a uva caliente y de mi madre gritando desde la cocina
        que nos laváramos las manos. Éramos cinco chicos y un perro que se llamaba Tango…
      </p>
      <p className="mt-6 text-center text-[10px] text-[#AEAEA6] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
        7
      </p>
      <figcaption className="sr-only">La primera página del libro, escrita con lo que contó.</figcaption>
    </figure>
  );
}

/* ───────────────────────── El libro ───────────────────────── */

/** La tapa del libro, en negro, con el índice de sus ocho capítulos al lado. */
export function TapaLibro({ nombre = NARRADOR, className = "" }: { nombre?: string; className?: string }) {
  return (
    <figure className={`relative mx-auto w-full max-w-[260px] ${className}`}>
      {/* el canto */}
      <div aria-hidden className="absolute -right-2 top-2 h-full w-full rounded-r-sm bg-[#D4D4CE]" />
      <div aria-hidden className="absolute -right-1 top-1 h-full w-full rounded-r-sm bg-[#EBEBE7]" />
      <div className="relative flex aspect-[2/3] flex-col justify-between rounded-r-sm border-l-[6px] border-[#2B2B24] bg-[#14140F] px-7 py-9 text-white">
        <Toroide className="h-7 w-auto text-[#AEAEA6]" />
        <div>
          <p className="text-[3rem] leading-[1] [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance]">{nombre}</p>
          <p className="mt-4 text-[13px] italic leading-relaxed text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
            La historia de una vida
          </p>
        </div>
        <p className="text-[9px] uppercase text-[#83837A] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">
          Vitácora Familiar
        </p>
      </div>
      <figcaption className="sr-only">La tapa del libro de {nombre}.</figcaption>
    </figure>
  );
}

export function Indice({ className = "" }: { className?: string }) {
  return (
    <ol className={`divide-y divide-[#EBEBE7] [font-family:var(--fuente-cuerpo)] ${className}`}>
      {CAPITULOS.map((c, i) => (
        <li key={c} className="flex items-baseline justify-between gap-4 py-3">
          <span className="flex items-baseline gap-4">
            <span className="w-6 text-[11px] tabular-nums text-[#83837A] [font-family:var(--fuente-micro)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[17px] [font-family:var(--fuente-titulo)] font-medium">{c}</span>
          </span>
          <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-[#D4D4CE]" />
          <span className="text-[12px] tabular-nums text-[#83837A] [font-family:var(--fuente-micro)]">{7 + i * 11}</span>
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────────── El audiolibro ───────────────────────── */

/**
 * El reproductor. Con `src` es un reproductor de verdad; sin `src` es la
 * pieza visual, para que la sección tenga cuerpo mientras no hay mp3.
 */
export function Reproductor({
  src,
  capitulo = "El amor",
  numero = 4,
  duracion = "6:12",
  className = "",
}: {
  src?: string;
  capitulo?: string;
  numero?: number;
  duracion?: string;
  className?: string;
}) {
  return (
    <figure className={`rounded-2xl border border-[#2B2B24] bg-[#14140F] p-6 text-white sm:p-8 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase text-[#83837A] [font-family:var(--fuente-micro)] [letter-spacing:0.28em]">
            Capítulo {numero}
          </p>
          <p className="mt-1.5 text-2xl [font-family:var(--fuente-titulo)] font-medium">{capitulo}</p>
        </div>
        <Toroide className="h-6 w-auto text-[#5F5F55]" />
      </div>

      <div className="mt-8 flex items-center gap-4">
        {src ? (
          <audio controls preload="none" src={src} className="w-full" />
        ) : (
          <>
            <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#14140F]">
              <IconoPlay className="h-5 w-5" />
            </span>
            <Onda barras={60} semilla={7} className="h-12 min-w-0 flex-1 text-[#83837A] maqueta-onda" />
            <span className="shrink-0 text-[12px] tabular-nums text-[#AEAEA6] [font-family:var(--fuente-micro)]">{duracion}</span>
          </>
        )}
      </div>

      <p className="mt-6 text-[13px] italic leading-relaxed text-[#AEAEA6] [font-family:var(--fuente-cuerpo)] font-light">
        «…y ahí la vi, en la puerta del club, y me dije: con esa me caso. Tardé dos años en animarme a hablarle.»
      </p>
      <figcaption className="sr-only">El audiolibro, capítulo {numero}: {capitulo}, con su voz.</figcaption>
    </figure>
  );
}

/* ───────────────────────── El panel ───────────────────────── */

/** El panel de Martina en chico: la historia creciendo día a día. */
export function PanelMini({ className = "" }: { className?: string }) {
  const respuestas = [
    { dia: 11, capitulo: "La juventud", dur: "3:40" },
    { dia: 10, capitulo: "La juventud", dur: "2:05" },
    { dia: 9, capitulo: "La juventud", dur: "4:51" },
  ];
  return (
    <figure className={`rounded-2xl border border-[#D4D4CE] bg-white p-6 text-[#14140F] shadow-[0_24px_60px_-36px_rgba(20,20,15,0.45)] sm:p-7 ${className}`}>
      <p className="text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.28em]">Historia</p>
      <p className="mt-1 text-2xl [font-family:var(--fuente-titulo)] font-medium">La historia de {NARRADOR}</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <p className="text-[13px] text-[#45453C] [font-family:var(--fuente-micro)]">
          <span className="text-[#14140F] tabular-nums">11</span> de 30 respuestas
        </p>
        <p className="text-right text-[13px] text-[#45453C] [font-family:var(--fuente-micro)]">
          <span className="text-[#14140F] tabular-nums">34 min</span> de su voz
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EBEBE7]">
        <div className="h-full w-[37%] rounded-full bg-[#14140F] maqueta-barra" />
      </div>

      <ul className="mt-6 divide-y divide-[#EBEBE7]">
        {respuestas.map((r) => (
          <li key={r.dia} className="flex items-center gap-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#14140F] text-white">
              <IconoPlay className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] [font-family:var(--fuente-cuerpo)]">Día {r.dia} · {r.capitulo}</span>
            </span>
            <span className="text-[11px] tabular-nums text-[#83837A] [font-family:var(--fuente-micro)]">{r.dur}</span>
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">El panel: 11 de 30 respuestas, 34 minutos de su voz.</figcaption>
    </figure>
  );
}

/* ───────────────────────── El anticipo ───────────────────────── */

/** El mail que llega a la tercera respuesta. */
export function MailAnticipo({ className = "" }: { className?: string }) {
  return (
    <figure className={`rounded-2xl border border-[#D4D4CE] bg-[#F7F7F5] p-5 text-[#14140F] ${className}`}>
      <div className="flex items-center gap-3 border-b border-[#EBEBE7] pb-3">
        <Toroide className="h-4 w-auto" />
        <div className="min-w-0">
          <p className="truncate text-[13px] [font-family:var(--fuente-micro)]">
            <span className="font-medium">Vitácora Familiar</span>
            <span className="text-[#83837A]"> · día 3</span>
          </p>
        </div>
      </div>
      <p className="mt-3 text-[15px] [font-family:var(--fuente-titulo)] font-medium">{NARRADOR} ya contó sus primeras tres historias</p>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
        Te dejamos la portada, el índice de su libro y la primera página escrita. Y un minuto de su voz, para
        que lo escuches contarlo.
      </p>
      <p className="mt-3 text-[13px] underline decoration-[#AEAEA6] underline-offset-4 [font-family:var(--fuente-micro)]">
        Leer el anticipo →
      </p>
      <figcaption className="sr-only">El mail del anticipo, a la tercera respuesta.</figcaption>
    </figure>
  );
}
