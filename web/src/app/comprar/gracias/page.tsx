import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { CampoVF } from "../../marca";

// Adonde vuelve Stripe/Mercado Pago después de cobrar. La compradora todavía
// no tiene sesión: acá no se muestra nada de la base, solo qué va a pasar y
// cómo entrar. El mail de acceso lo manda el webhook, que puede llegar unos
// segundos después que esta pantalla — por eso no se promete "ya te llegó".

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], variable: "--fuente-cuerpo", display: "swap" });

export const metadata: Metadata = { title: "Ya está en marcha", robots: { index: false } };

export default function Gracias() {
  return (
    <div className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex flex-1 flex-col items-center justify-center bg-[#14140F] px-6 py-24 text-center text-white`}>
      <div className="w-full max-w-lg">
        <CampoVF halo="#14140F" className="mx-auto h-24 w-auto" />
        <p className="mt-10 text-[11px] uppercase text-[#AEAEA6] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Listo</p>
        <h1 className="mt-4 text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
          Gracias. Ya está en marcha.
        </h1>
        <p className="mt-6 text-[17px] leading-[1.75] text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
          En un rato le llega un mensaje nuestro por WhatsApp, contándole que lo
          anotaste y pidiéndole permiso. No empieza nada hasta que diga que sí.
        </p>
        <p className="mt-4 text-[17px] leading-[1.75] text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
          Te mandamos un correo con todo esto y con cómo entrar a tu panel para
          seguir el libro día a día. Si no lo ves, mira en promociones o en spam.
        </p>
        <Link
          href="/entrar"
          className="mt-10 inline-flex h-13 items-center justify-center rounded-full bg-[#8F7BE0] px-8 text-base font-medium text-[#14140F] transition-colors hover:bg-[#A296E6] [font-family:var(--fuente-micro)]"
        >
          Entrar a mi panel
        </Link>
        <p className="mt-3 text-[13px] text-[#AEAEA6] [font-family:var(--fuente-micro)]">
          Con tu correo y un código de 6 números. Sin contraseñas.
        </p>
      </div>
    </div>
  );
}
