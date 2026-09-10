import type { Metadata } from "next";
import "./globals.css";

// Las tipografías de marca NO se cargan acá: viven en la landing
// (web/src/app/page.tsx), que es la única pantalla pasada al sistema visual de
// docs/design.md. Ponerlas en el layout cambiaría de golpe el tablero, el
// registro y el login, que todavía no están revisados.

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vitacorafamiliar.com"),
  title: {
    default: "Vitácora Familiar — En cada familia hay un libro sin escribir",
    template: "%s · Vitácora Familiar",
  },
  description:
    "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida, con el audiolibro en su propia voz. La de tu papá, la de tu abuela, la tuya.",
  openGraph: {
    title: "En cada familia hay un libro sin escribir",
    description:
      "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida. La de tu papá, la de tu abuela, la tuya.",
    siteName: "Vitácora Familiar",
    locale: "es_ES",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
