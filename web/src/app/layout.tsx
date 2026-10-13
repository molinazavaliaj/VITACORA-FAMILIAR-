import type { Metadata } from "next";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import "./globals.css";

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
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--fuente-titulo",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fuente-micro",
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--fuente-cuerpo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vitacorafamiliar.com"),
  title: {
    default: "Vitácora Familiar — En cada familia hay un libro sin escribir",
    // La marca paraguas (19/09): Vitácora, con dos productos. La home sigue siendo Familiar.
    template: "%s · Vitácora",
  },
  description:
    "Vitácora: un biógrafo por WhatsApp. Vitácora Familiar escribe el libro de una vida, con sus mejores frases en su propia voz; Vitácora de viaje, el libro de tu viaje, noche a noche.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
