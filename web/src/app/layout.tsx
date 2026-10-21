import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { OrigenVisita } from "./origen-visita";
import { origenPublico } from "@/lib/seo";

// Las tipografías de marca (Playfair Display, Archivo, Source Serif 4, las mismas
// de siempre) se sirven desde web/src/app/fuentes: subsets propios con solo los
// caracteres de castellano, catalán y la interfaz (ASCII, Latin-1, comillas,
// guiones, €, flechas), con el eje de peso recortado a lo que se usa y los
// otros ejes fijos donde los dejaba Google (Archivo ancho 100, Source Serif
// opsz 14). Pesan ~25% menos. Licencias OFL junto a los archivos. La de
// Playfair tiene nombre reservado: el subset va renombrado («Vitacora Titulo»).
// La letra de reserva está en globals.css, con los valores de siempre.
//
// Las tipografías de marca se cargan acá una sola vez (rediseño 2026-10,
// RENDIMIENTO.md §3.8). Antes las declaraba cada página para no cambiar de
// golpe el registro y el login: eso no pasa, porque acá solo se definen las
// variables (--fuente-titulo, --fuente-micro, --fuente-cuerpo) y el body sigue
// en Arial. Una pantalla tiene las letras de marca solo si las pide con
// var(--fuente-…), igual que antes.
//
// Pesos: los que ya usaban las pantallas, ni uno más. Las tres son fuentes
// variables, así que un peso más no suma archivos, pero sí cambia cómo se ve
// un texto que pide un peso que hoy no está (el navegador usa el más cercano):
// - Playfair 500 y 600 + itálica. Sin 400: más de 70 textos sin peso
//   explícito hoy salen en 500; con 400 pasarían a verse más finos. La
//   tarjeta del regalo, que sí quería 400, lo pide con font-variation-settings.
// - Archivo 400, 500 y 600 (600: el código de la tarjeta y los botones del
//   rediseño).
// - Source Serif 300 y 400 + itálica (300: el cuerpo largo, font-light).
//
// Sin preload: desde el layout raíz, el preload mete los 5 woff2 (~210 kB) en
// TODAS las páginas, también en /entrar y /legal, que no los usan (la medición
// del 13/10 dio /entrar de 232 a 448 kB). Sin preload, cada página baja solo
// las letras que de verdad pinta, apenas el CSS las pide.
const playfair = localFont({
  src: [
    { path: "./fuentes/playfair-display.woff2", weight: "500 600", style: "normal" },
    { path: "./fuentes/playfair-display-cursiva.woff2", weight: "500 600", style: "italic" },
  ],
  variable: "--fuente-titulo",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Fallback Titulo"],
});
const archivo = localFont({
  src: [{ path: "./fuentes/archivo.woff2", weight: "400 600", style: "normal" }],
  variable: "--fuente-micro",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Fallback Micro"],
});
const sourceSerif = localFont({
  src: [
    { path: "./fuentes/source-serif-4.woff2", weight: "300 400", style: "normal" },
    { path: "./fuentes/source-serif-4-cursiva.woff2", weight: "300 400", style: "italic" },
  ],
  variable: "--fuente-cuerpo",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Fallback Cuerpo"],
});

export const metadata: Metadata = {
  // El dominio real en producción; en la preview, la preview (lib/seo.ts).
  metadataBase: new URL(origenPublico()),
  title: {
    default: "Vitácora Familiar — En cada familia hay un libro sin escribir",
    // La marca paraguas (19/09): Vitácora, con dos productos. La home sigue siendo Familiar.
    template: "%s · Vitácora",
  },
  description:
    "Vitácora es un biógrafo por WhatsApp. Vitácora Familiar escribe el libro de una vida, con sus mejores frases en su propia voz. Vitácora de viaje escribe el libro de tu viaje.",
  openGraph: {
    title: "En cada familia hay un libro sin escribir",
    description:
      "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida. La de tu papá, la de tu abuela, la tuya.",
    siteName: "Vitácora",
    locale: "es_ES",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <OrigenVisita />
      </body>
    </html>
  );
}
