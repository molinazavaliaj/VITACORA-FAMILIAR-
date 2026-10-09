import { notFound } from "next/navigation";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { leerRegalo, numeroPublico } from "@/lib/regalo-datos";
import { linkWhatsApp } from "@/lib/regalo";
import { textosAbuelo } from "@/lib/regalo-textos";
import { Toroide } from "../../marca";
import { AudioRegalo } from "./audio";

// La página que abre el QR de la gift card (spec 2026-10-07-gift-card-design §5):
// corta, sin login, una columna pensada para el celular. Fondo blanco y tinta;
// el violeta va solo en el botón Empezar. Si el regalo no existe o no se pagó,
// 404: el código no revela nada.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500"], style: ["normal", "italic"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], variable: "--fuente-cuerpo", display: "swap" });

export default async function PaginaRegalo({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  let crudo = codigo;
  try {
    crudo = decodeURIComponent(codigo);
  } catch {
    // Un % mal formado no es un código: leerRegalo lo descarta.
  }
  const regalo = await leerRegalo(crearClienteServidor(), crudo);
  if (!regalo) notFound();
  const numero = numeroPublico();
  const textos = textosAbuelo(regalo.idioma);

  return (
    <div lang={regalo.idioma === "ca" ? "ca" : "es"} className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} min-h-full bg-white text-[#14140F] [font-family:var(--fuente-cuerpo)]`}>
      <main className="mx-auto w-full max-w-[28rem] p-6 pb-12">
        <header className="flex items-center gap-3">
          <Toroide className="h-7 w-7" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
        </header>

        <h1 id="titulo-regalo" className="mt-12 text-[28px] font-medium leading-tight [font-family:var(--fuente-titulo)] [text-wrap:balance]">
          {textos.titulo(regalo.comoLeDicen, regalo.quienRegala)}
        </h1>

        {regalo.tieneAudio && <AudioRegalo src={`/api/regalo/${regalo.codigo}/audio`} etiqueta={textos.escucharAudioDe(regalo.quienRegala)} />}

        <blockquote className="mt-8 whitespace-pre-line border-l border-[#14140F] pl-4 text-[20px] italic leading-snug [font-family:var(--fuente-titulo)]">
          {regalo.mensaje}
        </blockquote>

        <p className="mt-8 text-[17px] font-light leading-relaxed">
          {regalo.usado ? textos.yaEmpezo : textos.explica.join(" ")}
        </p>

        {numero && (
          <a
            href={linkWhatsApp(numero.digitos, regalo.codigo, regalo.idioma)}
            className="mt-10 flex h-14 w-full items-center justify-center rounded-full bg-[#5D3FD3] text-[17px] font-medium text-white transition-colors hover:bg-[#4F35BC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D3FD3] [font-family:var(--fuente-micro)] [touch-action:manipulation]"
          >
            {textos.empezar}
          </a>
        )}
        {!numero && (
          <p className="mt-10 text-center text-[28px] font-medium [font-family:var(--fuente-micro)] [letter-spacing:0.12em]">{regalo.codigo}</p>
        )}
      </main>
    </div>
  );
}
