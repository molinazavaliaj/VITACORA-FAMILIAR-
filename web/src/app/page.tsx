import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { CampoVF, Toroide } from "./marca";
import { Aparece } from "./aparece";

// La landing sigue docs/brief-landing.md y docs/design.md al pie de la letra:
// consigue el alta gratuita (no vende el libro), el CTA es uno solo, el orden
// de las secciones desarma la objeción principal antes de que aparezca, y la
// jerarquía se hace con tamaño y aire — el violeta toca una sola cosa.

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--fuente-titulo",
});
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--fuente-micro",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--fuente-cuerpo",
});

export const metadata: Metadata = {
  title: "Vitácora Familiar — En cada familia hay un libro sin escribir",
  description:
    "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida, con el audiolibro en su propia voz. Empezar es gratis.",
  openGraph: {
    title: "En cada familia hay un libro sin escribir",
    description:
      "Un biógrafo entrevista por WhatsApp y escribe el libro de una vida. La de tu papá, la de tu abuela, la tuya.",
    siteName: "Vitácora Familiar",
    locale: "es",
    type: "website",
  },
};

const PASOS = [
  {
    titulo: "Lo anotas, gratis",
    texto:
      "Nos dices su nombre, su WhatsApp y a qué hora prefiere conversar. Le llega un mensaje nuestro contándole que lo anotaste — y no empieza nada hasta que él diga que sí.",
  },
  {
    titulo: "Él solo manda audios",
    texto:
      "Cada mañana le llega una pregunta por WhatsApp. La contesta con un audio, como hace todos los días. Sin apps, sin nada que instalar ni aprender.",
  },
  {
    titulo: "El biógrafo escribe su libro",
    texto:
      "Con sus respuestas, el biógrafo escribe el libro de su vida. Al final lo recibes en PDF listo para imprimir, junto al audiolibro con su propia voz.",
  },
] as const;

const PREGUNTAS = [
  {
    pregunta: "¿Mi papá va a saber usarlo?",
    respuesta:
      "No hay nada que instalar ni que aprender. Le llega un mensaje de WhatsApp y contesta con un audio, como hace todos los días.",
  },
  {
    pregunta: "¿Y si no quiere, o le da vergüenza?",
    respuesta:
      "Le pedimos permiso antes de empezar y él decide. Puede parar cuando quiera y retomar cuando quiera.",
  },
  {
    pregunta: "¿Quién escucha sus audios?",
    respuesta:
      "Solo su familia. Los audios son privados, se usan únicamente para su libro, y se pueden borrar todos cuando quiera.",
  },
  {
    pregunta: "¿Y si empieza y no termina?",
    respuesta:
      "Son 30 preguntas, no 30 días de calendario: si un día no contesta, la pregunta espera. Y con 10 respuestas ya se puede hacer el libro.",
  },
  {
    pregunta: "¿Cuánto sale?",
    respuesta:
      "Empezar es gratis, y los 30 días de entrevista también. El libro y el audiolibro se pagan una sola vez, al final, y solo si los quieres.",
  },
] as const;

// PLACEHOLDER — reemplazar por las 5 reseñas reales (docs/brief-landing.md §7bis).
// La landing NO se publica con esta sección visible si las reseñas no llegaron.
const TESTIMONIOS_DE_RELLENO = [
  "[Reseña real pendiente — corta, dos líneas: qué pensó que iba a pasar y qué pasó.]",
  "[Reseña real pendiente — mediana: el momento en que escuchó algo de su papá que no sabía, contado con detalle concreto. Este relleno es más largo a propósito, porque las reseñas reales nunca miden lo mismo.]",
  "[Reseña real pendiente — sobre la objeción: qué le diría a alguien que cree que su papá no va a saber usarlo.]",
  "[Reseña real pendiente — larga: la reacción del narrador al recibir los saludos de la familia el último día, y qué hicieron con el libro cuando lo tuvieron. De nuevo: los largos desparejos son parte del diseño.]",
  "[Reseña real pendiente — una frase.]",
] as const;

function BotonEmpezar({ oscuro = false }: { oscuro?: boolean }) {
  // El par del violeta (design.md): #5D3FD3 sobre claro, #8F7BE0 sobre oscuro.
  return (
    <Link
      href="/entrar"
      className={`inline-flex h-13 items-center justify-center rounded-md px-8 text-base font-medium transition-colors [font-family:var(--fuente-micro)] ${
        oscuro
          ? "bg-[#8F7BE0] text-[#14140F] hover:bg-[#A296E6]"
          : "bg-[#5D3FD3] text-white hover:bg-[#4F35BC]"
      }`}
    >
      Empezar gratis
    </Link>
  );
}

function Etiqueta({ children, clara = false }: { children: string; clara?: boolean }) {
  return (
    <p
      className={`text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em] ${clara ? "text-[#AEAEA6]" : "text-[#5F5F55]"}`}
    >
      {children}
    </p>
  );
}

// Espacio reservado para un material real que todavía no está (fotos del libro
// de Osvaldo, captura de WhatsApp, fragmento del audiolibro). Visible como
// pendiente a propósito: la landing no se publica con estos bloques.
function MaterialPendiente({
  etiqueta,
  className = "",
  oscuro = false,
}: {
  etiqueta: string;
  className?: string;
  oscuro?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center border border-dashed p-6 text-center ${
        oscuro ? "border-[#45453C] bg-[#1C1C16]" : "border-[#AEAEA6] bg-[#F7F7F5]"
      } ${className}`}
    >
      <p
        className={`text-[10px] uppercase leading-relaxed [font-family:var(--fuente-micro)] [letter-spacing:0.24em] ${oscuro ? "text-[#AEAEA6]" : "text-[#5F5F55]"}`}
      >
        {etiqueta}
      </p>
    </div>
  );
}

export default function Home() {
  const monto = Number(process.env.PRECIO_ARS ?? 65000);
  const precio = `$${new Intl.NumberFormat("es-AR").format(monto)}`;

  return (
    <div
      className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex flex-1 flex-col bg-white text-[#14140F]`}
    >
      <style>{`
        @supports (animation-timeline: view()) {
          .aparece {
            animation: aparecer both;
            animation-timeline: view();
            animation-range: entry 5% entry 45%;
          }
          @keyframes aparecer {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: none; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .aparece { animation: none; }
        }
      `}</style>
      {/* Apertura en negro: el campo abre la página y la luz llega bajando */}
      <div className="bg-[#14140F] text-white">
        {/* Encabezado mínimo */}
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-8">
          <div className="flex items-center gap-3">
            <Toroide className="h-7 w-auto text-white" />
            <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">
              Vitácora Familiar
            </span>
          </div>
          <Link
            href="/entrar"
            className="text-sm text-[#D4D4CE] underline decoration-[#5F5F55] underline-offset-4 transition-colors hover:text-white [font-family:var(--fuente-micro)]"
          >
            Entrar
          </Link>
        </header>

        {/* 1 · Hero */}
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 pb-10 pt-20 text-center sm:pt-24">
          <CampoVF halo="#14140F" className="h-[150px] w-auto text-white" />
          <h1 className="text-4xl leading-[1.12] [font-family:var(--fuente-titulo)] font-medium [letter-spacing:-0.02em] sm:text-6xl sm:leading-[1.08]">
            En cada familia hay un libro sin escribir.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light sm:text-xl">
            Un biógrafo entrevista y escribe el libro de una vida. La de tu
            papá, la de tu abuela, la tuya.
          </p>
          <BotonEmpezar oscuro />
          <MaterialPendiente
            oscuro
            etiqueta="Foto real del libro de Osvaldo — pendiente, con su permiso"
            className="mt-6 h-64 w-full max-w-xl"
          />
        </section>

        {/* La página se aclara de a poco: del negro del campo al papel */}
        <div className="h-[38vh] bg-gradient-to-b from-[#14140F] to-[#F7F7F5]" aria-hidden />
      </div>

      <main className="flex flex-1 flex-col">
        {/* 2 · Cómo funciona — va segundo a propósito (brief §4) */}
        <section className="bg-[#F7F7F5] pb-24 pt-4 sm:pb-28">
          <div className="mx-auto w-full max-w-4xl px-6">
            <Aparece>
              <Etiqueta>Cómo funciona</Etiqueta>
              <h2 className="mt-4 max-w-2xl text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
                Tres pasos, y ninguno es de él.
              </h2>
            </Aparece>
            <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-3">
              {PASOS.map((paso, indice) => (
                <Aparece key={paso.titulo}>
                  <div className="flex flex-col gap-3 border-t border-[#D4D4CE] pt-5">
                    <span className="text-[11px] text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">
                      0{indice + 1}
                    </span>
                    <h3 className="text-xl [font-family:var(--fuente-titulo)] font-medium">
                      {paso.titulo}
                    </h3>
                    <p className="text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                      {paso.texto}
                    </p>
                  </div>
                </Aparece>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · La prueba: el audio de WhatsApp */}
        <section className="mx-auto grid w-full max-w-4xl items-center gap-12 px-6 py-24 sm:grid-cols-2 sm:py-28">
          <Aparece>
            <Etiqueta>Sin apps, sin aprender nada</Etiqueta>
            <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              Solo tiene que mandar un audio.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              No hay nada que instalar ni que aprender. Le llega un mensaje de
              WhatsApp y contesta con un audio, como hace todos los días con
              sus hijos y sus nietos.
            </p>
          </Aparece>
          <Aparece>
            <MaterialPendiente
              etiqueta="Captura real de la conversación de WhatsApp — pendiente"
              className="h-96"
            />
          </Aparece>
        </section>

        {/* 4 · El objeto */}
        <section className="border-t border-[#EBEBE7] py-24 sm:py-28">
          <div className="mx-auto w-full max-w-4xl px-6">
            <Aparece>
              <Etiqueta>El libro</Etiqueta>
              <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
                Una vida merece un libro.
              </h2>
              <p className="mt-5 max-w-2xl text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                Portada con su nombre, capítulos, sus frases, las fotos de la
                familia. Maquetado como un libro de librería, en PDF listo para
                imprimir.
              </p>
            </Aparece>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <Aparece>
                <MaterialPendiente etiqueta="Página real del libro — pendiente" className="h-72" />
              </Aparece>
              <Aparece>
                <MaterialPendiente etiqueta="Doble página con foto — pendiente" className="h-72" />
              </Aparece>
              <Aparece>
                <MaterialPendiente etiqueta="La página de sus frases — pendiente" className="h-72" />
              </Aparece>
            </div>
          </div>
        </section>

        {/* 5 · La voz */}
        <section className="mx-auto grid w-full max-w-4xl items-center gap-12 px-6 py-24 sm:grid-cols-2 sm:py-28">
          <Aparece>
            <MaterialPendiente
              etiqueta="Fragmento del audiolibro, para escuchar acá — pendiente"
              className="h-40 sm:order-1"
            />
          </Aparece>
          <Aparece>
            <Etiqueta>El audiolibro</Etiqueta>
            <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              El libro también se escucha, con su propia voz.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Sus pausas, sus palabras, su manera de contar: el audiolibro se
              arma con los audios reales de la entrevista. En castellano no
              existe nada parecido.
            </p>
          </Aparece>
        </section>

        {/* Oscurece de a poco hacia el cierre emocional */}
        <div className="h-[38vh] bg-gradient-to-b from-white to-[#14140F]" aria-hidden />

        {/* 6 · El cierre emocional */}
        <section className="bg-[#14140F] pb-28 pt-10 text-white sm:pb-36 sm:pt-14">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 text-center">
            <Aparece>
              <Etiqueta clara>El último día</Etiqueta>
            </Aparece>
            <Aparece>
              <p className="text-3xl leading-[1.25] [font-family:var(--fuente-titulo)] font-medium sm:text-5xl sm:leading-[1.2]">
                Hay preguntas que un día
                <br />
                ya no se pueden hacer.
              </p>
            </Aparece>
            <Aparece>
              <p className="max-w-xl text-[17px] leading-[1.7] text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
                El último día, él recibe los saludos grabados de toda la
                familia: grabó 30 días para ustedes sin saber que ustedes
                grababan para él.
              </p>
            </Aparece>
            <Aparece>
              <Link
                href="/entrar"
                className="inline-flex h-13 items-center justify-center rounded-md bg-[#8F7BE0] px-8 text-base font-medium text-[#14140F] transition-colors hover:bg-[#A296E6] [font-family:var(--fuente-micro)]"
              >
                Empezar gratis
              </Link>
            </Aparece>
          </div>
        </section>

        {/* Vuelve la luz, de a poco */}
        <div className="h-[38vh] bg-gradient-to-b from-[#14140F] to-[#F7F7F5]" aria-hidden />

        {/* Testimonios — PLACEHOLDER: ocultar u obtener las 5 reseñas reales antes de publicar */}
        <section className="bg-[#F7F7F5] pb-24 pt-6 sm:pb-28">
          <div className="mx-auto w-full max-w-4xl px-6">
            <Aparece>
              <Etiqueta>Familias que ya lo hicieron</Etiqueta>
              <p className="mt-3 text-[13px] text-[#5F5F55] [font-family:var(--fuente-micro)]">
                Sección en preparación: estas cinco reseñas son de relleno y se
                reemplazan por las reales antes de publicar.
              </p>
            </Aparece>
            <div className="mt-10 columns-1 gap-6 sm:columns-2 [&>*]:mb-6 [&>*]:break-inside-avoid">
              {TESTIMONIOS_DE_RELLENO.map((texto, indice) => (
                <figure
                  key={indice}
                  className="border border-[#D4D4CE] bg-white p-6"
                >
                  <blockquote className="text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                    {texto}
                  </blockquote>
                  <figcaption className="mt-4 text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">
                    [Nombre real] · [Ciudad]
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 7 · Precio, transparente */}
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-28">
          <Aparece>
            <Etiqueta>El precio, claro</Etiqueta>
          </Aparece>
          <Aparece>
            <h2 className="text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              Empezar es gratis. Los 30 días, también.
            </h2>
          </Aparece>
          <Aparece>
            <p className="text-6xl [font-family:var(--fuente-titulo)] font-medium">{precio}</p>
            <p className="mt-3 text-[15px] text-[#5F5F55] [font-family:var(--fuente-micro)]">
              Pago único, en pesos argentinos, al final — y solo si quieres el
              libro.
            </p>
          </Aparece>
          <Aparece>
            <p className="max-w-xl text-[16px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Lo mismo que sale hoy un libro de preguntas para llenar a mano.
              Solo que este se lo cuenta hablando — y su voz queda.
            </p>
          </Aparece>
        </section>

        {/* 8 · Preguntas */}
        <section className="border-t border-[#EBEBE7] py-24 sm:py-28">
          <div className="mx-auto w-full max-w-2xl px-6">
            <Aparece>
              <Etiqueta>Las preguntas de todos</Etiqueta>
            </Aparece>
            <div className="mt-8">
              {PREGUNTAS.map((item) => (
                <details
                  key={item.pregunta}
                  className="group border-b border-[#D4D4CE] py-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg [font-family:var(--fuente-titulo)] font-medium [&::-webkit-details-marker]:hidden">
                    {item.pregunta}
                    <span
                      aria-hidden
                      className="text-2xl font-light text-[#5F5F55] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                    {item.respuesta}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 9 · CTA final */}
        <section className="border-t border-[#EBEBE7] bg-[#F7F7F5] py-24 sm:py-28">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 text-center">
            <Aparece>
              <h2 className="text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
                En cada familia hay un libro sin escribir.
              </h2>
            </Aparece>
            <Aparece>
              <BotonEmpezar />
            </Aparece>
            <Aparece>
              <p className="max-w-md text-[14px] leading-[1.7] text-[#5F5F55] [font-family:var(--fuente-cuerpo)]">
                Le va a llegar un mensaje nuestro presentándose y contándole
                que lo anotaste. No empieza nada hasta que él diga que sí.
              </p>
            </Aparece>
          </div>
        </section>
      </main>

      {/* La página termina como empezó: fundiéndose al negro */}
      <div className="h-[38vh] bg-gradient-to-b from-[#F7F7F5] to-[#14140F]" aria-hidden />

      <footer className="bg-[#14140F] pb-16 pt-4 text-white">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-6 text-center">
          <Toroide className="h-8 w-auto text-white" />
          <p className="text-[15px] italic [font-family:var(--fuente-titulo)]">
            Para las vidas que merecen su propio libro
          </p>
          <div className="flex items-center gap-6 text-[12px] text-[#AEAEA6] [font-family:var(--fuente-micro)]">
            <Link href="/legal/privacidad" className="transition-colors hover:text-white">
              Política de privacidad
            </Link>
            <span aria-hidden>·</span>
            <span>Vitácora Familiar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
