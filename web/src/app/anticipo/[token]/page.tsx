import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenAnticipo } from "@/lib/token-anticipo";
import { CampoVF, Toroide } from "../../marca";

// Las primeras páginas del libro, con su voz. Llega acá desde el correo que
// manda la fábrica cuando su narrador contestó la tercera pregunta.
//
// Con el pago por adelantado (11/09) esta pantalla ya no vende: ella ya
// compró. Es el primer "mirá cómo va", la previsualización progresiva. Sigue
// siendo PÚBLICA a propósito: el link llega por mail y pedirle un código
// antes de dejarla escuchar a su padre sería arruinar el momento. El token
// firmado es la autorización.
//
// Tipografías cargadas acá, como en la landing: son las dos únicas pantallas
// pasadas al sistema visual de docs/design.md.

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--fuente-titulo",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500"],
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

// El enlace es privado: llega por correo y muestra material de una familia.
// Que ningún buscador lo indexe.
export const metadata: Metadata = {
  title: "El libro que se está escribiendo",
  robots: { index: false, follow: false },
};

type DatosAnticipo = {
  nombre: string;
  capitulos: string[];
  parrafo: string;
};

function Etiqueta({ children, clara = false }: { children: string; clara?: boolean }) {
  return (
    <p
      className={`text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em] ${clara ? "text-[#AEAEA6]" : "text-[#5F5F55]"}`}
    >
      {children}
    </p>
  );
}

export default async function PaginaAnticipo({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const datosToken = verificarTokenAnticipo(token);
  if (!datosToken) return <EstadoInvalido />;

  const admin = crearClienteServidor();

  const { data: narrador, error: errorNarrador } = await admin
    .from("narradores")
    .select("id, como_le_dicen, familia_id")
    .eq("id", datosToken.narradorId)
    .maybeSingle();

  if (errorNarrador) {
    console.error("anticipo/[token]: fallo la busqueda de narrador", errorNarrador);
    return <EstadoInvalido />;
  }
  const datosNarrador = narrador as
    | { id: string; como_le_dicen: string; familia_id: string }
    | null;
  if (!datosNarrador) return <EstadoInvalido />;

  const { data: archivos } = await admin.storage
    .from("audios")
    .list(`${datosNarrador.id}/paquete`);
  const nombresArchivos = new Set((archivos ?? []).map((a) => a.name));

  // Sin anticipo.json no hay nada que mostrar: probablemente el correo salió
  // antes de que la fábrica terminara, o alguien guardó el enlace de un
  // narrador que todavía no arrancó.
  if (!nombresArchivos.has("anticipo.json")) return <EstadoEnCamino />;

  const { data: blob, error: errorDescarga } = await admin.storage
    .from("audios")
    .download(`${datosNarrador.id}/paquete/anticipo.json`);
  if (errorDescarga || !blob) {
    console.error("anticipo/[token]: fallo la descarga del anticipo", errorDescarga);
    return <EstadoEnCamino />;
  }

  let datos: DatosAnticipo;
  try {
    datos = JSON.parse(await blob.text()) as DatosAnticipo;
  } catch (err) {
    console.error("anticipo/[token]: anticipo.json ilegible", err);
    return <EstadoEnCamino />;
  }

  const hayAudio = nombresArchivos.has("anticipo_muestra.mp3");

  return (
    <div
      className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex flex-1 flex-col bg-white text-[#14140F]`}
    >
      {/* ─── Su voz: lo primero, porque es lo que convence ─────────────── */}
      <div className="bg-[#14140F] text-white">
        <header className="mx-auto flex w-full max-w-3xl items-center gap-3 px-6 pt-8">
          <Toroide className="h-6 w-auto" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">
            Vitácora Familiar
          </span>
        </header>

        <section className="mx-auto w-full max-w-2xl px-6 pb-16 pt-14 text-center sm:pb-20 sm:pt-16">
          <Etiqueta clara>Ya empezó a contar</Etiqueta>
          <h1 className="mt-6 text-3xl leading-[1.15] [font-family:var(--fuente-titulo)] font-medium sm:text-5xl sm:leading-[1.1]">
            Esto es lo que lleva escrito el libro de {datos.nombre}.
          </h1>

          {hayAudio ? (
            <div className="mt-10">
              <p className="text-[15px] leading-relaxed text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
                Un minuto de su primera respuesta, con su voz, tal como la grabó.
              </p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio
                controls
                preload="none"
                src={`/api/anticipo/${token}/audio`}
                className="mx-auto mt-5 w-full max-w-md"
              />
            </div>
          ) : (
            <p className="mt-8 text-[15px] leading-relaxed text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
              Todavía no hay audio suyo: sus primeras respuestas llegaron
              escritas.
            </p>
          )}
        </section>

        <div className="h-20 bg-gradient-to-b from-[#14140F] to-[#F7F7F5] sm:h-24" />
      </div>

      {/* ─── El libro, como se está armando ────────────────────────────── */}
      <section className="bg-[#F7F7F5] pb-20 pt-6 sm:pb-24">
        <div className="mx-auto w-full max-w-2xl px-6">
          {/* La portada */}
          <div className="border border-[#D4D4CE] bg-white px-8 py-16 text-center shadow-[0_1px_3px_rgba(20,20,15,0.06)] sm:px-12 sm:py-20">
            <p className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              {datos.nombre}
            </p>
            <p className="mt-5 text-[11px] uppercase text-[#83837A] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">
              El libro de su vida
            </p>
            <div className="mt-10 flex justify-center">
              <CampoVF halo="#FFFFFF" className="h-20 w-auto text-[#14140F]" />
            </div>
          </div>

          {/* El índice */}
          {datos.capitulos.length > 0 && (
            <div className="mt-10 border border-[#D4D4CE] bg-white px-8 py-12 sm:px-12">
              <Etiqueta>Índice</Etiqueta>
              <ol className="mt-6 space-y-3">
                {datos.capitulos.map((capitulo, i) => (
                  <li
                    key={capitulo}
                    className="flex items-baseline gap-4 text-[17px] [font-family:var(--fuente-cuerpo)] font-light"
                  >
                    <span className="text-[12px] text-[#83837A] [font-family:var(--fuente-micro)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{capitulo}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Su primera página */}
          <div className="mt-10 border border-[#D4D4CE] bg-white px-8 py-12 sm:px-12 sm:py-14">
            <Etiqueta>Su primera página</Etiqueta>
            <p className="mt-6 text-[19px] leading-[1.75] [font-family:var(--fuente-cuerpo)] font-light">
              {datos.parrafo}
            </p>
            <div className="mt-12 border-t border-[#EBEBE7] pt-8 text-center">
              <p className="text-[26px] tracking-[0.4em] text-[#AEAEA6]">…</p>
              <p className="mt-3 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light italic">
                Y sigue contando.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Y sigue ───────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-2xl px-6 py-20 text-center sm:py-24">
        <Etiqueta>Esto recién empieza</Etiqueta>
        <h2 className="mt-5 text-2xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-3xl">
          Él va a seguir contando, una pregunta por día.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-[17px] leading-[1.75] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
          Desde tu panel vas a ver el libro crecer capítulo a capítulo. Cuando
          esté terminado, te avisamos por correo y lo descargas de ahí: el
          libro en PDF y el audiolibro con su voz.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/entrar"
            className="inline-flex h-13 items-center justify-center rounded-full bg-[#5D3FD3] px-8 text-base font-medium text-white transition-colors hover:bg-[#4F35BC] [font-family:var(--fuente-micro)]"
          >
            Seguir el libro de {datos.nombre.split(" ")[0]}
          </Link>
          <p className="text-[13px] text-[#5F5F55] [font-family:var(--fuente-micro)]">
            Entras con tu correo y un código de 6 números.
          </p>
        </div>
      </section>

      <footer className="mt-auto border-t border-[#EBEBE7]">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 text-center">
          <p className="text-[15px] italic text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
            Para las vidas que merecen su propio libro
          </p>
        </div>
      </footer>
    </div>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-24 text-center text-[#14140F]">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function EstadoInvalido() {
  return (
    <Marco>
      <h1 className="text-2xl font-semibold">Este enlace no es válido</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#45453C]">
        Puede que esté incompleto. Prueba a abrirlo otra vez desde el correo que
        te enviamos.
      </p>
      <Link href="/" className="mt-8 inline-block text-[15px] text-[#5D3FD3] underline underline-offset-4">
        Ir al inicio
      </Link>
    </Marco>
  );
}

function EstadoEnCamino() {
  return (
    <Marco>
      <h1 className="text-2xl font-semibold">Todavía se está escribiendo</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#45453C]">
        Las primeras páginas aparecen acá en cuanto estén listas. Vuelve a abrir
        este enlace en un rato.
      </p>
      <Link href="/" className="mt-8 inline-block text-[15px] text-[#5D3FD3] underline underline-offset-4">
        Ir al inicio
      </Link>
    </Marco>
  );
}
