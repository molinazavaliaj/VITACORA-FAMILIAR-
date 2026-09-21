import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenLibro } from "@/lib/token-libro";
import { armarMuestra } from "@/lib/muestra";
import { VistaMuestra } from "../../muestra";
import { Toroide } from "../../marca";

// El link público del libro cerrado (docs/panel-usuario.md §8). Lo abre un
// primo sin cuenta: ve la muestra y tiene dos puertas — guardarlo en su cuenta,
// o comprar su copia impresa. Las dos pasan por el login de siempre y vuelven
// acá con la sesión puesta (/libro/[token]/guardar).

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], variable: "--fuente-cuerpo", display: "swap" });

export default async function PaginaLibroPublico({ params }: PageProps<"/libro/[token]">) {
  const { token } = await params;
  const datos = verificarTokenLibro(token);
  if (!datos) notFound();

  const admin = crearClienteServidor();
  const muestra = await armarMuestra(admin, datos.narradorId);
  if (!muestra) notFound();

  const volver = encodeURIComponent(`/libro/${token}/guardar`);
  const volverComprar = encodeURIComponent(`/libro/${token}/guardar?comprar=1`);
  const boton = "inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium transition-colors [font-family:var(--fuente-micro)]";

  return (
    <div className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} min-h-full bg-[var(--fondo)] text-[var(--texto)] [font-family:var(--fuente-cuerpo)]`}>
      <header className="oscuro flex items-center justify-between bg-[var(--fondo)] px-6 py-5 text-[var(--texto)]">
        <Link href="/" className="flex items-center gap-3">
          <Toroide className="h-8 w-8" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
        </Link>
        <Link href="/entrar" className="text-sm text-[var(--texto-suave)] underline underline-offset-4 [font-family:var(--fuente-micro)]">Entrar</Link>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16">
        <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Te compartieron un libro</p>
        <h1 className="mt-2 text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium md:text-4xl [text-wrap:balance]">
          La historia de {muestra.nombre}
        </h1>
        <p className="mt-3 max-w-prose text-[17px] leading-relaxed text-[var(--texto-suave)] font-light">
          Un biógrafo lo entrevistó durante un mes por WhatsApp y escribió el libro de su vida, con sus mejores frases en su propia voz. Esta es una muestra.
        </p>

        <div className="mt-12">
          <VistaMuestra
            muestra={muestra}
            urlAudio={`/api/libro-muestra/${token}/audio`}
            urlPortada={muestra.portadaFotoId ? `/api/libro-muestra/${token}/portada` : null}
          />
        </div>

        <div className="mt-14 rounded-xl border border-[var(--texto)] p-6 md:p-8">
          <p className="text-xl leading-snug [font-family:var(--fuente-titulo)] [text-wrap:balance]">¿Querés el libro de {muestra.nombre} en tu casa?</p>
          <p className="mt-3 max-w-prose text-[16px] leading-relaxed text-[var(--texto-suave)]">
            Podés pedir tu copia impresa, tapa dura, con un código en la contratapa que hace sonar su voz. Te llega a donde estés. O guardalo en tu cuenta para volver a esta muestra cuando quieras.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/entrar?volver=${volverComprar}`} className={`${boton} bg-[var(--acento)] text-white hover:opacity-90`}>
              Comprar mi copia impresa
            </Link>
            <Link href={`/entrar?volver=${volver}`} className={`${boton} border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--bruma)]`}>
              Guardarlo en mi cuenta
            </Link>
          </div>
          <p className="mt-4 text-sm text-[var(--texto-menor)]">Entrás con tu correo y un código de 6 números. Sin contraseñas.</p>
        </div>

        <p className="mt-16 text-sm italic text-[var(--texto-menor)]">En cada familia hay un libro sin escribir.</p>
      </main>
    </div>
  );
}
