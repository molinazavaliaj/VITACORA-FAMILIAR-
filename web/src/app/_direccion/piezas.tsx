import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

// Piezas chicas de la dirección nueva («la web como un libro») que comparten
// la portada, /viaje y las landings de anuncio (fase 4). Vivían adentro de
// _portada/portada.tsx; se sacaron tal cual para no copiarlas. De servidor:
// ninguna tiene estado.

/** Variables CSS en línea (--i, --paso, --e…) sin pelear con el tipo de React. */
export const conVar = (vars: Record<string, number | string>) => vars as CSSProperties;

/**
 * Alturas fijas de las ondas de audio de muestra: misma forma en el servidor y
 * en el cliente.
 */
export const ONDA = [10, 18, 28, 14, 24, 32, 16, 12, 26, 30, 14, 20, 28, 10, 22, 30, 16, 8, 24, 18, 12, 26, 20, 14];

/**
 * Una frase partida en palabras para encenderlas de a una (Coreografia). El
 * texto entero va aparte para lectores de pantalla; las palabras, ocultas.
 */
export function Palabras({ texto, desde = 0, total, clase = "" }: { texto: string; desde?: number; total: number; clase?: string }) {
  const palabras = texto.split(" ");
  return (
    <>
      {palabras.map((p, j) => (
        <span key={`${p}-${j}`}>
          <span className={`dir-palabra ${clase}`} style={conVar({ "--i": desde + j, "--n": total })}>
            {p}
          </span>
          {j < palabras.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

/** Retrato en óvalo, arco o círculo, que pasa del blanco y negro al sepia. */
export function Foto({
  src,
  alt,
  forma,
  sizes,
  className = "",
  recorte = false,
  href,
  priority = false,
  apaisada = false,
  children,
}: {
  src: string;
  alt: string;
  forma: "ovalo" | "arco" | "circulo";
  sizes: string;
  className?: string;
  /** La foto trae borde de papel: se agranda un poco para que no se vea. */
  recorte?: boolean;
  href?: string;
  /** Solo si la foto está arriba de todo (nunca es el LCP: el titular lo es). */
  priority?: boolean;
  /** Más ancha que alta (16:10), para una foto horizontal en óvalo. */
  apaisada?: boolean;
  children?: ReactNode;
}) {
  const marco = (
    <div className={`dir-marco dir-marco--${forma}`}>
      <div className={`dir-foto dir-foto--${forma}${apaisada ? " dir-foto--apaisada" : ""}`}>
        <div className={`absolute ${recorte ? "-inset-[7%]" : "inset-0"}`}>
          <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="dir-revela object-cover" />
        </div>
      </div>
    </div>
  );
  return (
    <figure className={`flex flex-col gap-5 ${className}`}>
      {href ? (
        <Link prefetch={false} href={href} className="flex flex-col gap-5">
          {marco}
          {children ? <figcaption className="flex flex-col gap-2">{children}</figcaption> : null}
        </Link>
      ) : (
        <>
          {marco}
          {children ? <figcaption className="flex flex-col gap-2">{children}</figcaption> : null}
        </>
      )}
    </figure>
  );
}

/** Una lista con un hilo fino delante de cada línea (sin tildes de check). */
export function ListaHilo({ items, tinta = false }: { items: string[]; tinta?: boolean }) {
  return (
    <ul className={`dir-lista ${tinta ? "dir-lista--tinta" : ""}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * La onda de su voz, quieta: ilustración sin sonido. Se usa mientras no haya
 * un audio de muestra con permiso (PENDIENTES P1): sin botón que prometa algo
 * que no suena.
 */
export function OndaQuieta({ duracion, conPlay = true }: { duracion: string; /** El círculo con el triángulo (la portada lo lleva; las landings, no). */ conPlay?: boolean }) {
  return (
    <div aria-hidden className="flex items-center gap-4">
      {conPlay ? (
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-[var(--dir-hilo-tinta)] text-[var(--dir-sobre-tinta)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
      ) : null}
      <span className="flex h-10 min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
        {ONDA.map((alto, i) => (
          <span key={i} className="block w-[3px] flex-none rounded-full bg-[var(--dir-sobre-tinta)] opacity-70" style={{ height: alto }} />
        ))}
      </span>
      <span className="dir-dato text-[var(--dir-sobre-tinta-suave)]">{duracion}</span>
    </div>
  );
}

/**
 * Las cuatro ventajas con tilde del inicio (las de la portada, «prt-ventajas»),
 * para Viaje, Historia y Kids (revisión del 25/10). El color lo hereda: sirve
 * sobre tinta y sobre el papel claro de Kids. Estilo en globals.css.
 */
export function Ventajas({ items, className = "", style }: { items: readonly string[]; className?: string; style?: CSSProperties }) {
  return (
    <ul className={`dir-ventajas ${className}`} style={style}>
      {items.map((v) => (
        <li key={v}>
          <svg viewBox="0 0 16 16" aria-hidden className="dir-ventajas-tilde" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 8.6c1.3 1 2.3 2.2 3.2 3.6C7.6 8.4 10.2 5.3 13.6 3" />
          </svg>
          <span>{v}</span>
        </li>
      ))}
    </ul>
  );
}
