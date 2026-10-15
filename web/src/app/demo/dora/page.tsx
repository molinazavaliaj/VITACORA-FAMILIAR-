import type { Metadata } from "next";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { Toroide } from "../../marca";
import { Etiqueta, Tarjeta, Titulo } from "../../tablero/ui";

// Demo para el video del marco con NFC (12/10): el chip abre esta página y se
// ve "Encargar libro" de Dora con el libro ya terminado. Es una maqueta
// estática del panel — no lee la base ni pide sesión (Dora es piloto real y
// todavía no tiene pedido). El PDF es un libro modelo, no el real.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--fuente-cuerpo", display: "swap" });

export const metadata: Metadata = {
  title: "El libro de Dora",
  robots: { index: false, follow: false },
};

const PDF = "/demo/libro-dora.pdf";

function IconoLibro({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 3.5h12v17H6z" />
      <path d="M6 3.5v17M9 8h6M9 11h6" />
    </svg>
  );
}

const PESTANAS = [
  { nombre: "Inicio", d: ["M4 11.5 12 5l8 6.5", "M6.5 10v9h11v-9"] },
  { nombre: "Historias", d: ["M5 4.5h5.5a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H5z", "M19 4.5h-5.5a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H19z"] },
  { nombre: "Libro", d: ["M6 3.5h12v17H6z", "M6 3.5v17M9 8h6M9 11h6"], activa: true },
];

export default function DemoDora() {
  return (
    <div className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex min-h-dvh flex-1 flex-col bg-[var(--fondo)] text-[var(--texto)] [font-family:var(--fuente-cuerpo)]`}>
      {/* Cabecera como la del panel en el celular */}
      <header className="sticky top-0 z-20 border-b border-[var(--linea)] bg-[var(--fondo)]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-10">
          <Toroide className="h-7 w-7 shrink-0" />
          <p className="min-w-0 flex-1 truncate text-center text-[15px] [font-family:var(--fuente-titulo)] md:text-left">La historia de Dora</p>
          <span className="w-7 shrink-0" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-28 pt-10 md:px-10 md:pt-14">
        <Etiqueta>Encargar libro · La historia de Dora</Etiqueta>
        <div className="mt-1">
          <Titulo>Su libro</Titulo>
        </div>

        <Tarjeta className="mt-6 border-[var(--acento)]">
          <Etiqueta>Terminado</Etiqueta>
          <p className="mt-2 text-2xl font-medium leading-tight [font-family:var(--fuente-titulo)]">El libro de Dora está listo.</p>
          <p className="mt-3 text-[16px] leading-relaxed text-[var(--texto-suave)]">
            Su vida, contada con sus palabras. Queda acá para siempre: volvé cuando quieras.
          </p>
        </Tarjeta>

        <section className="mt-14 border-t border-[var(--linea)] pt-10">
          <Etiqueta>Lo que compraste</Etiqueta>

          {/* El libro en PDF: vivo, se abre al tocarlo */}
          <a
            href={PDF}
            className="group mt-4 flex items-center gap-4 rounded-xl border border-[var(--acento)] bg-[var(--fondo)] p-5 transition-colors hover:bg-[var(--hueco)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)] [touch-action:manipulation]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--acento)] text-[var(--sobre-acento)]">
              <IconoLibro className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-medium leading-snug [font-family:var(--fuente-titulo)]">El libro de Dora</span>
              <span className="mt-1 flex items-center gap-2 text-[13px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--acento)] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--acento)]" />
                </span>
                Listo para leer
              </span>
            </span>
            <span className="shrink-0 text-[15px] font-medium text-[var(--acento)] [font-family:var(--fuente-micro)]">
              Abrir <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </a>

          <Tarjeta className="mt-3">
            <ul className="flex flex-col gap-2 text-[15px]">
              <li className="flex justify-between gap-4">
                <span>Un marco con su voz</span>
                <span className="text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">entregado</span>
              </li>
            </ul>
          </Tarjeta>
        </section>
      </main>

      {/* Pestañas como las del panel en el celular (decorativas) */}
      <nav aria-hidden className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-[var(--linea)] bg-[var(--fondo)] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {PESTANAS.map((p) => (
          <span key={p.nombre} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] [font-family:var(--fuente-micro)] ${p.activa ? "text-[var(--texto)]" : "text-[var(--texto-menor)]"}`}>
            <svg viewBox="0 0 24 24" className="h-5.5 w-5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {p.d.map((d) => <path key={d} d={d} />)}
            </svg>
            {p.nombre}
          </span>
        ))}
      </nav>
    </div>
  );
}
