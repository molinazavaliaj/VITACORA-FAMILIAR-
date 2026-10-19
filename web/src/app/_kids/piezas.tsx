import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { CONTACTO } from "../legal/titulares";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { langDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import type { TextosKids } from "../_textos/kids";
import "./kids.css";

// Piezas chicas de Vitácora Kids (15/10) que comparten /kids, sus landings y
// la compra. De servidor: ninguna tiene estado. Los estilos, en ./kids.css.

/** Variables CSS en línea (--e) sin pelear con el tipo de React. */
export const conVar = (vars: Record<string, number | string>) => vars as CSSProperties;

/** Las fotos de Kids (personas generadas, solo como ilustración: PENDIENTES B10). */
export const FOTOS_KIDS = {
  audio: { src: "/rediseno/kids-audio-cama.jpg", ancho: 1000, alto: 1242 },
  cuarto: { src: "/rediseno/kids-cuarto-juguetes.jpg", ancho: 1000, alto: 1242 },
  familia: { src: "/rediseno/kids-familia-sofa.jpg", ancho: 1200, alto: 896 },
  libroAbierto: { src: "/rediseno/kids-libro-abierto.jpg", ancho: 1200, alto: 670 },
  libroTapa: { src: "/rediseno/kids-libro-tapa.jpg", ancho: 1200, alto: 686 },
} as const;

/** La hoja de una página de Kids: idioma y la paleta con alcance propio. */
export function PaginaKids({ idioma, children }: { idioma: IdiomaWeb; children: ReactNode }) {
  return (
    <div lang={langDeIdioma(idioma)} data-producto="kids" className="kids flex flex-1 flex-col">
      {children}
    </div>
  );
}

/** Una foto con forma (arco, óvalo, redondeada o ancha) y el hilo que la repite. A color. */
export function FotoKids({
  src,
  alt,
  forma,
  sizes,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  forma: "arco" | "ovalo" | "suave" | "ancha";
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const radio = forma === "arco" ? "rounded-t-full rounded-b-[24px]" : forma === "ovalo" ? "rounded-[50%]" : "rounded-[28px]";
  return (
    <div className={`kids-marco ${radio} ${className}`}>
      <div className={`kids-foto kids-foto--${forma}`}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    </div>
  );
}

/**
 * Adónde lleva «Escríbenos» mientras Kids no se vende: el WhatsApp de dudas
 * si está la variable (B11); si no, un correo a hola@ con el asunto puesto.
 */
export function enlaceEscribir(t: Pick<TextosKids, "correo">): { href: string; externo: boolean } {
  const wa = urlWhatsAppDudas();
  if (wa) return { href: wa, externo: true };
  const q = `subject=${encodeURIComponent(t.correo.asunto)}&body=${encodeURIComponent(t.correo.cuerpo)}`;
  return { href: `mailto:${CONTACTO.hola}?${q}`, externo: false };
}

/** El botón «Escríbenos» (lleno o de hilo). */
export function BotonEscribir({ t, hilo = false, className = "" }: { t: Pick<TextosKids, "correo" | "escribir">; hilo?: boolean; className?: string }) {
  const { href, externo } = enlaceEscribir(t);
  return (
    <a
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`kids-boton ${hilo ? "kids-boton--hilo" : ""} ${className}`}
    >
      {t.escribir}
    </a>
  );
}

/**
 * Una conversación de WhatsApp de ejemplo, hecha con HTML (no es una captura):
 * la pregunta del banco, el audio y el acuse aprobado (ACUSE-3, sin afecto: el
 * bot nunca dice que algo le gusta). Para el lector de pantalla, un resumen.
 */
export function ChatKids({ c }: { c: TextosKids["chat"] }) {
  return (
    <figure className="kids-chat w-full max-w-[380px]">
      <figcaption className="sr-only">{c.resumen}</figcaption>
      <div aria-hidden className="flex flex-col gap-3">
        <div className="flex items-center gap-3 border-b border-[var(--kids-hilo)] pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--kids-texto)] text-[13px] font-semibold text-[var(--kids-fondo)] [font-family:var(--fuente-micro)]">
            V
          </span>
          <span className="flex flex-col">
            <span className="text-[14.5px] font-semibold [font-family:var(--fuente-micro)]">{c.contacto}</span>
            <span className="text-[12px] text-[var(--kids-texto-menor)] [font-family:var(--fuente-micro)]">{c.cuenta}</span>
          </span>
          <span className="ml-auto text-[12px] text-[var(--kids-texto-menor)] [font-family:var(--fuente-micro)]">{c.hora}</span>
        </div>
        <p className="kids-burbuja kids-burbuja--bot">{c.pregunta}</p>
        <div className="kids-burbuja kids-burbuja--chico flex items-center gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--kids-acento)] text-white">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
          <span className="flex h-6 flex-1 items-center gap-[3px]">
            {ONDA.map((h, i) => (
              <span key={i} className="block w-[3px] flex-none rounded-full bg-[var(--kids-acento)] opacity-70" style={{ height: h }} />
            ))}
          </span>
          <span className="text-[12px] tabular-nums text-[var(--kids-texto-suave)]">{c.duracion}</span>
        </div>
        <p className="kids-burbuja kids-burbuja--bot">{c.acuse}</p>
      </div>
      <p className="kids-dato mt-4 text-center">{c.ejemplo}</p>
    </figure>
  );
}

/** Alturas fijas de la onda de audio de ejemplo: la misma en el servidor y en el cliente. */
const ONDA = [8, 14, 20, 10, 18, 24, 12, 9, 20, 22, 10, 15, 21, 8, 16, 22, 12, 6, 18];
