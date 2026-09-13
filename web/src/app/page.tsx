import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { CampoVF, Toroide } from "./marca";
import { Aparece } from "./aparece";
import { ChatWhatsApp, Indice, MailAnticipo, PaginaEscrita, PanelMini, Reproductor, TapaLibro } from "./maquetas";
import { CtaSticky } from "./cta-sticky";
import { obtenerPrecio } from "@/lib/precios";

// Las tres de docs/design.md §4: Playfair grita, Archivo susurra, Source Serif
// habla. Se cargan acá y no en el layout a propósito — la landing es la única
// pantalla pasada al sistema visual; el tablero carga las suyas en su layout.
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

// La landing sigue docs/brief-landing.md §4 (el orden de las secciones),
// docs/identidad-de-marca.md §7 (los cuatro pilares, en orden de embudo) y §8
// (las personas), y docs/design.md (los tokens). Las tres mandan sobre
// cualquier criterio estético.
//
// La página se lee como el producto: capítulos numerados, y el tono va de
// negro (lo que se pierde) a papel (cómo funciona, el objeto) y vuelve al
// negro (lo que queda). El producto se VE desde el primer segundo — la
// conversación, la página, el libro, la voz — con maquetas hechas en código
// (./maquetas.tsx) hasta que llegue el material real.
//
// El orden no es decorativo: la objeción principal de Martina —"mi papá no va a
// saber usarlo"— se desarma SEGUNDA, antes de que aparezca. Lo demás se apoya
// en eso.
//
// MODELO DE COBRO (decidido el 11/09): SE PAGA ANTES DE EMPEZAR. El CTA compra,
// no registra. Después del pago llega un mail con el acceso al panel; ahí ve el
// libro crecer y compra los extras. Si el narrador no acepta, devolución
// escribiendo a hola@.
//
// Copy: las frases de brief-landing.md §5 van tal cual. Los títulos nuevos
// están marcados "⚠️ a aprobar" para pasar por los dos socios.

// Pilar 4 · El libro es la obra, no el papel. El impreso se comunica como
// extra — regla dura de identidad-de-marca.md §7.
const FORMATOS = [
  { nombre: "El libro en PDF", detalle: "Escrito con sus palabras, listo para leer y para imprimir.", estado: "Incluido" },
  { nombre: "El audiolibro", detalle: "Su historia contada con su propia voz, la de verdad.", estado: "Incluido" },
  { nombre: "El libro impreso", detalle: "Tapa dura, con un código en la contratapa que hace sonar su voz.", estado: "Aparte" },
] as const;

const PASOS = [
  {
    titulo: "Lo anotas",
    texto:
      "Nos dices su nombre, su WhatsApp y a qué hora prefiere conversar. Le llega un mensaje nuestro contándole que lo anotaste — y no empieza nada hasta que él diga que sí. Si no acepta, te devolvemos el dinero.",
  },
  {
    titulo: "Él solo manda audios",
    texto:
      "Cada mañana le llega una pregunta por WhatsApp. La contesta con un audio, como hace todos los días. Sin apps, sin nada que instalar ni aprender.",
  },
  {
    titulo: "El biógrafo escribe",
    texto:
      "Con sus respuestas, el biógrafo escribe el libro de su vida. Tú lo ves crecer desde el tercer día, mucho antes de que termine.",
  },
] as const;

// Las cuatro cosas que desarman la objeción, a la vista desde el primer
// segundo. Cada una contesta un miedo de Martina.
const GARANTIAS = [
  { icono: "whatsapp", texto: "Él solo habla por WhatsApp. Nadie escribe nada." },
  { icono: "sin-app", texto: "Sin app ni nada que instalar." },
  { icono: "voz", texto: "Su voz real, en cada capítulo del audiolibro." },
  { icono: "ojo", texto: "Lo lees crecer mientras él responde." },
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
      "Le pedimos permiso antes de empezar y él decide. Puede parar cuando quiera y retomar cuando quiera. Y a muchos les cambia el ánimo cuando entienden que es para sus nietos, no para lucirse.",
  },
  {
    pregunta: "¿Quién escucha sus audios?",
    respuesta:
      "Solo su familia. Los audios son privados, se usan únicamente para su libro, y se pueden borrar todos cuando quiera.",
  },
  {
    pregunta: "¿Y si empieza y no termina?",
    respuesta:
      "Son 30 preguntas, no 30 días de calendario: si un día no contesta, la pregunta espera. Y con diez respuestas ya se puede hacer un libro.",
  },
  {
    pregunta: "¿Cuánto sale y cuándo se paga?",
    respuesta:
      "Se paga una sola vez, al comprar, y el precio está a la vista antes de pagar. Incluye el libro en PDF y el audiolibro con su voz. Si él no acepta participar, nos escribes y te devolvemos el dinero completo.",
  },
  {
    pregunta: "¿Se puede tener el libro impreso?",
    respuesta:
      "Sí, y se pide aparte cuando el libro está terminado. Lo que incluye el precio es el libro en PDF y el audiolibro con su voz.",
  },
] as const;

// REGLA DURA (brief §7): la landing NO se publica con reseñas inventadas. La
// sección existe en el código y se enciende cuando estén las cinco reales con
// permiso por escrito. Hasta entonces, no se renderiza.
const TESTIMONIOS: ReadonlyArray<{ texto: string; nombre: string; ciudad: string }> = [];

/* ───────────────────────── piezas ───────────────────────── */

// El violeta toca UNA sola cosa por pantalla (design.md). Acá es el botón.
function BotonComprar({ enOscuro = false, secundario = false }: { enOscuro?: boolean; secundario?: boolean }) {
  const base =
    "inline-flex h-13 items-center justify-center rounded-full px-8 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 [font-family:var(--fuente-micro)] [touch-action:manipulation]";
  const color = secundario
    ? "bg-[#14140F] text-white hover:bg-[#2B2B24] focus-visible:outline-[#14140F]"
    : enOscuro
      ? "bg-[#8F7BE0] text-[#14140F] hover:bg-[#A296E6] focus-visible:outline-white"
      : "bg-[#5D3FD3] text-white hover:bg-[#4F35BC] focus-visible:outline-[#5D3FD3]";
  return (
    <Link href="/comprar" className={`${base} ${color}`}>
      Comprar el libro
    </Link>
  );
}

function MicrocopyCta({ clara = false }: { clara?: boolean }) {
  return (
    <p className={`text-[13px] [font-family:var(--fuente-micro)] ${clara ? "text-[#AEAEA6]" : "text-[#5F5F55]"}`}>
      Pago único · el libro en PDF y el audiolibro con su voz.
    </p>
  );
}

// Cada sección es un capítulo: folio chico arriba, como en el libro.
function Capitulo({ numero, children, clara = false }: { numero: string; children: string; clara?: boolean }) {
  return (
    <p className={`flex items-center gap-3 text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em] ${clara ? "text-[#AEAEA6]" : "text-[#5F5F55]"}`}>
      <span className="tabular-nums">{numero}</span>
      <span aria-hidden className={`h-px w-6 ${clara ? "bg-[#45453C]" : "bg-[#D4D4CE]"}`} />
      {children}
    </p>
  );
}

function Titulo({ children, clara = false, grande = false }: { children: React.ReactNode; clara?: boolean; grande?: boolean }) {
  return (
    <h2
      className={`mt-4 [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] ${
        grande ? "text-4xl leading-[1.1] sm:text-5xl lg:text-6xl" : "text-3xl leading-[1.15] sm:text-4xl lg:text-[2.75rem]"
      } ${clara ? "text-white" : "text-[#14140F]"}`}
    >
      {children}
    </h2>
  );
}

function Cuerpo({ children, clara = false, className = "" }: { children: React.ReactNode; clara?: boolean; className?: string }) {
  return (
    <p className={`text-[17px] leading-[1.7] [font-family:var(--fuente-cuerpo)] font-light ${clara ? "text-[#D4D4CE]" : "text-[#45453C]"} ${className}`}>
      {children}
    </p>
  );
}

function Icono({ nombre, className = "" }: { nombre: (typeof GARANTIAS)[number]["icono"]; className?: string }) {
  const comun = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, viewBox: "0 0 24 24" };
  switch (nombre) {
    case "whatsapp":
      return (
        <svg {...comun}>
          <path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19.1z" />
          <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z" />
        </svg>
      );
    case "sin-app":
      return (
        <svg {...comun}>
          <rect x="7" y="2.5" width="10" height="19" rx="2" />
          <path d="M11 18h2M9.5 9.5l5 5M14.5 9.5l-5 5" />
        </svg>
      );
    case "voz":
      return (
        <svg {...comun}>
          <path d="M4 12h1M7 9v6M10 6v12M13 8v8M16 10v4M19 11.5v1" />
        </svg>
      );
    case "ojo":
      return (
        <svg {...comun}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
  }
}

/* ───────────────────────── la página ───────────────────────── */

export default function Home() {
  const { monto } = obtenerPrecio("AR");
  const precio = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(monto);
  const fragmentoAudio = process.env.NEXT_PUBLIC_URL_FRAGMENTO_AUDIO; // el mp3 real, cuando exista

  return (
    <div className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex flex-1 flex-col bg-white text-[#14140F]`}>
      {/* ═══ 1 · HERO — apertura en negro ═══════════════════════════════════ */}
      <div className="bg-[#14140F] text-white">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-7">
          <Link href="/" className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="Vitácora Familiar, inicio">
            <Toroide className="h-7 w-auto" />
            <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/entrar"
              className="text-sm text-[#D4D4CE] underline decoration-[#5F5F55] underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white [font-family:var(--fuente-micro)]"
            >
              Entrar
            </Link>
            <Link
              href="/comprar"
              className="hidden h-10 items-center rounded-full bg-white px-5 text-sm font-medium text-[#14140F] transition-colors hover:bg-[#EBEBE7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [font-family:var(--fuente-micro)] sm:inline-flex"
            >
              Comprar el libro
            </Link>
          </div>
        </header>

        <section id="hero" className="mx-auto grid overflow-x-clip w-full max-w-6xl items-center gap-14 px-6 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-24">
          <div className="flex flex-col gap-7">
            {/* Slogan y descriptor van SIEMPRE juntos (design.md §5). */}
            <h1 className="text-[2.6rem] leading-[1.06] [font-family:var(--fuente-titulo)] font-medium [letter-spacing:-0.02em] [text-wrap:balance] sm:text-6xl sm:leading-[1.04] lg:text-[4.1rem]">
              En cada familia hay un libro sin escribir.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light sm:text-[1.35rem]">
              Un biógrafo entrevista y escribe el libro de una vida. La de tu papá, la de tu abuela, la tuya.
            </p>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-4">
              <BotonComprar enOscuro />
              <a
                href="#como-funciona"
                className="inline-flex h-13 items-center justify-center rounded-full border border-[#45453C] px-7 text-base font-medium text-[#D4D4CE] transition-colors hover:border-[#83837A] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [font-family:var(--fuente-micro)] [touch-action:manipulation]"
              >
                Cómo funciona ↓
              </a>
            </div>
            <MicrocopyCta clara />
          </div>

          {/* El producto en seis segundos: la pregunta llega, él manda un
              audio, y a la derecha aparece la página del libro ya escrita. */}
          <div className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:justify-self-end">
            <ChatWhatsApp animado className="relative z-10 lg:mr-auto" />
            <div className="pointer-events-none absolute right-0 bottom-8 z-20 hidden w-[240px] rotate-[3deg] lg:block">
              <PaginaEscrita animado />
            </div>
          </div>
        </section>

        {/* Las garantías: cuatro respuestas a cuatro miedos, en una fila. */}
        <div className="border-y border-[#2B2B24]">
          <ul className="mx-auto grid w-full max-w-6xl grid-cols-1 divide-y divide-[#2B2B24] px-6 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
            {GARANTIAS.map((g, i) => (
              <li
                key={g.icono}
                className={`flex items-center gap-4 py-5 text-[15px] text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light sm:pr-6 ${i > 0 ? "lg:border-l lg:border-[#2B2B24] lg:pl-6" : ""}`}
              >
                <Icono nombre={g.icono} className="h-6 w-6 shrink-0 text-[#AEAEA6]" />
                {g.texto}
              </li>
            ))}
          </ul>
        </div>

        {/* Pilar 1 · LO QUE SE PIERDE — el que abre */}
        <section className="mx-auto w-full max-w-4xl px-6 pb-16 pt-24 text-center sm:pb-20 sm:pt-32">
          <Aparece>
            <p className="text-4xl leading-[1.15] [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-6xl sm:leading-[1.1]">
              Las fotos quedan.
              <br />
              <span className="italic text-[#AEAEA6]">Los recuerdos se van.</span>
            </p>
            <Cuerpo clara className="mx-auto mt-8 max-w-lg">
              Tienes el teléfono lleno de fotos suyas y ni una sola de sus historias. La cara la guarda el celular.
              La voz, lo que vivió y cómo lo cuenta, no la guarda nadie.
            </Cuerpo>
          </Aparece>
        </section>

        {/* La luz llega bajando */}
        <div className="h-28 bg-gradient-to-b from-[#14140F] to-[#F7F7F5] sm:h-36" />
      </div>

      {/* ═══ 2 · CÓMO FUNCIONA — desarma la objeción antes de que aparezca ═══ */}
      <section id="como-funciona" className="scroll-mt-8 bg-[#F7F7F5] pb-24 pt-2 sm:pb-32">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Aparece>
            <div className="max-w-2xl">
              <Capitulo numero="01">Cómo funciona</Capitulo>
              <Titulo>Él no tiene que aprender nada.</Titulo>
              <Cuerpo className="mt-5">
                Lo que frena a la mayoría no es el precio: es imaginarse explicándole una aplicación por teléfono.
                No hay ninguna.
              </Cuerpo>
            </div>
          </Aparece>
          <Aparece>
            <ol className="mt-16 grid gap-12 lg:grid-cols-3 lg:gap-10">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="relative border-t border-[#D4D4CE] pt-6">
                  <span className="text-5xl leading-none text-[#AEAEA6] [font-family:var(--fuente-titulo)] tabular-nums">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-2xl [font-family:var(--fuente-titulo)] font-medium">{paso.titulo}</h3>
                  <p className="mt-3 text-[15.5px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                    {paso.texto}
                  </p>
                </li>
              ))}
            </ol>
          </Aparece>
        </div>
      </section>

      {/* ═══ 3 · SOLO TIENE QUE MANDAR UN AUDIO — la prueba visual ══════════ */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
        <Aparece>
          <Capitulo numero="02">La conversación</Capitulo>
          <Titulo>Solo tiene que mandar un audio.</Titulo>
          <Cuerpo className="mt-5 max-w-lg">
            Una pregunta por la mañana, a la hora que él prefiera. Contesta hablando, apretando el micrófono como
            hace con sus hijos. Si un día no puede, la pregunta espera.
          </Cuerpo>
          <Cuerpo className="mt-4 max-w-lg">
            Las preguntas van de la infancia a la sabiduría, en ocho capítulos. Las primeras son fáciles; las
            últimas, las que nadie se anima a hacer en la mesa.
          </Cuerpo>
        </Aparece>
        <Aparece>
          <ChatWhatsApp
            dia={12}
            duracion="5:48"
            pregunta="Ahora cuénteme ESA historia: la que se cuenta en las sobremesas cuando todos ya se rieron dos veces. Todos tenemos una. ¿Cuál es la suya?"
          />
        </Aparece>
      </section>

      {/* ═══ 4 · LA PREVISUALIZACIÓN — el momento en que se decide ══════════ */}
      <section className="border-y border-[#EBEBE7] bg-[#F7F7F5] py-24 lg:py-32">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
          <Aparece>
            <div className="relative mx-auto max-w-[440px] lg:mx-0">
              <PanelMini />
              <MailAnticipo className="mt-4 sm:-mr-6 sm:ml-16 sm:-mt-8 sm:shadow-[0_24px_60px_-36px_rgba(20,20,15,0.45)]" />
            </div>
          </Aparece>
          <Aparece>
            <Capitulo numero="03">Desde el tercer día</Capitulo>
            <Titulo>No te lo imaginas: lo vas leyendo.</Titulo>
            <Cuerpo className="mt-5 max-w-lg">
              A la tercera respuesta te llega un correo con un minuto de su voz y las primeras páginas ya escritas:
              la portada con su nombre, el índice de su libro y su primera página, con sus palabras y sus modos de
              decir.
            </Cuerpo>
            <Cuerpo className="mt-4 max-w-lg">
              <strong className="font-normal text-[#14140F]">Y desde tu panel lo ves crecer día a día</strong>, mucho
              antes de que esté terminado. No hay que esperar un mes a ciegas.
            </Cuerpo>
          </Aparece>
        </div>
      </section>

      {/* ═══ 5 · EL OBJETO — pilar 4, el que sostiene el precio ═════════════ */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
        <Aparece>
          <div className="max-w-2xl">
            <Capitulo numero="04">El libro</Capitulo>
            <Titulo>Una vida merece un libro.</Titulo>
            <Cuerpo className="mt-5">
              Una vida común tratada como una vida extraordinaria, porque lo es. Capítulos, índice, sus frases de
              siempre en una página aparte.
            </Cuerpo>
          </div>
        </Aparece>
        <div className="mt-16 grid items-center gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
          <Aparece>
            <TapaLibro />
          </Aparece>
          <Aparece>
            <p className="text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Índice</p>
            <Indice className="mt-3" />
          </Aparece>
        </div>
        <Aparece>
          <dl className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-[#EBEBE7] bg-[#EBEBE7] sm:grid-cols-3">
            {FORMATOS.map((f) => (
              <div key={f.nombre} className="flex flex-col gap-3 bg-white p-6 sm:p-7">
                <span className={`self-start rounded-full px-2.5 py-1 text-[10px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.22em] ${f.estado === "Incluido" ? "bg-[#14140F] text-white" : "border border-[#D4D4CE] text-[#5F5F55]"}`}>
                  {f.estado}
                </span>
                <dt className="text-xl [font-family:var(--fuente-titulo)] font-medium">{f.nombre}</dt>
                <dd className="text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{f.detalle}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[14px] leading-[1.7] text-[#5F5F55] [font-family:var(--fuente-cuerpo)] font-light">
            El libro impreso se pide aparte, cuando el libro ya está terminado.
          </p>
        </Aparece>
      </section>

      {/* ═══ 6 · LA VOZ — el diferencial que nadie tiene en castellano ══════ */}
      <section className="bg-[#F7F7F5] py-24 lg:py-32">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
          <Aparece>
            <Capitulo numero="05">El audiolibro</Capitulo>
            <Titulo>No solo lo que contó. Cómo lo contaba.</Titulo>
            <Cuerpo className="mt-5 max-w-lg">
              El libro viene con el audiolibro en su voz real: sus silencios, su manera de arrancar las frases, la
              risa cuando se acuerda de algo. Y el libro impreso lleva un código en la contratapa que lo hace sonar.
            </Cuerpo>
            <Cuerpo className="mt-4 max-w-lg">En castellano no existe nada parecido.</Cuerpo>
          </Aparece>
          <Aparece>
            <Reproductor src={fragmentoAudio} />
          </Aparece>
        </div>
      </section>

      {/* ═══ 7 · NAVIDAD — pilar 3, el ángulo de lanzamiento ════════════════ */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
        <Aparece>
          <div className="max-w-2xl">
            <Capitulo numero="06">En diciembre</Capitulo>
            <Titulo>Este año, algo que no se puede comprar hecho.</Titulo>
            <Cuerpo className="mt-5">
              Todos los años el mismo problema y todos los años lo mismo. Este año hay algo que antes no existía:
              la historia de la familia, y un pedazo de esa historia para cada uno.
            </Cuerpo>
          </div>
        </Aparece>
        <Aparece>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#14140F] p-8 text-white sm:p-10">
              <p className="text-[11px] uppercase text-[#AEAEA6] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Para la casa</p>
              <p className="mt-4 text-3xl [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance]">Un libro</p>
              <p className="mt-4 text-[15.5px] leading-[1.7] text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
                Impreso, en tapa dura, con su voz en la contratapa. El que queda en la biblioteca de la familia.
              </p>
            </div>
            <div className="rounded-2xl border border-[#D4D4CE] p-8 sm:p-10">
              <p className="text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Para cada uno</p>
              <p className="mt-4 text-3xl [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance]">Un marco</p>
              <p className="mt-4 text-[15.5px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                Para cada primo y cada tío: se acerca el teléfono y suena su voz. Todos escuchan lo mismo el mismo
                día.
              </p>
            </div>
          </div>
        </Aparece>
      </section>

      {/* ═══ 8 · LO QUE QUEDA — pilar 2, el que habla al narrador ═══════════ */}
      <section className="bg-[#14140F] pb-28 pt-24 text-white sm:pb-36 sm:pt-32">
        <div className="mx-auto w-full max-w-4xl px-6 text-center">
          <Aparece>
            <Capitulo numero="07" clara>Lo que se hereda</Capitulo>
            <p className="mt-6 text-4xl leading-[1.15] [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-6xl sm:leading-[1.1]">
              Ochenta años de aprender, y hoy vive todo en una sola cabeza.
            </p>
            <Cuerpo clara className="mx-auto mt-8 max-w-xl">
              No es nostalgia: es transmisión. Lo que aprendió en toda una vida les sirve a sus nietos, y a los que
              todavía no nacieron. Dentro de veinte años tus hijos van a tener dónde ir a buscarlo.
            </Cuerpo>
            <p className="mx-auto mt-12 max-w-lg text-2xl leading-[1.35] [font-family:var(--fuente-titulo)] font-medium italic [text-wrap:balance] sm:text-3xl">
              Hay preguntas que un día ya no se pueden hacer.
            </p>
          </Aparece>
        </div>
      </section>

      {/* ═══ TESTIMONIOS — solo con las cinco reseñas reales ════════════════ */}
      {TESTIMONIOS.length > 0 ? (
        <section className="bg-[#F7F7F5] py-24">
          <div className="mx-auto w-full max-w-6xl px-6">
            <Aparece>
              <Capitulo numero="08">Las familias</Capitulo>
              <div className="mt-10 columns-1 gap-8 sm:columns-2 lg:columns-3">
                {TESTIMONIOS.map((t) => (
                  <figure key={t.nombre} className="mb-8 break-inside-avoid rounded-2xl border border-[#EBEBE7] bg-white p-6">
                    <blockquote className="text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{t.texto}</blockquote>
                    <figcaption className="mt-4 text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">
                      {t.nombre} · {t.ciudad}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Aparece>
          </div>
        </section>
      ) : null}

      {/* ═══ 9 · PRECIO, TRANSPARENTE ══════════════════════════════════════ */}
      <section data-cta-propio className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
        <Aparece>
          <div className="grid gap-12 rounded-3xl border border-[#EBEBE7] bg-[#F7F7F5] p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:p-16">
            <div>
              <Capitulo numero="08">El precio</Capitulo>
              <Titulo>Un solo pago. Sin sorpresas después.</Titulo>
              <p className="mt-10 text-6xl [font-family:var(--fuente-titulo)] font-medium tabular-nums sm:text-7xl">{precio}</p>
              <Cuerpo className="mt-6 max-w-md">
                Es lo que sale hoy un libro de preguntas que él tendría que llenar a mano. Aquí lo cuenta hablando,
                y además le queda su voz grabada.
              </Cuerpo>
              <div className="mt-10 flex flex-col items-start gap-3">
                <BotonComprar />
                <MicrocopyCta />
              </div>
            </div>
            <div className="lg:border-l lg:border-[#D4D4CE] lg:pl-16">
              <p className="text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Incluye</p>
              <ul className="mt-5 flex flex-col gap-4 text-[16px] leading-[1.6] text-[#2B2B24] [font-family:var(--fuente-cuerpo)] font-light">
                {[
                  "El libro de su vida, escrito, en PDF listo para imprimir",
                  "El audiolibro completo, capítulo por capítulo, con su voz",
                  "El anticipo a la tercera respuesta y el panel para verlo crecer",
                  "Las 30 preguntas del biógrafo, adaptadas a lo que él va contando",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#14140F]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-8 border-t border-[#D4D4CE] pt-6 text-[14px] leading-[1.7] text-[#5F5F55] [font-family:var(--fuente-cuerpo)] font-light">
                Si él no acepta participar, te devolvemos el dinero completo. El libro impreso y los marcos se piden
                aparte, cuando el libro está terminado.
              </p>
            </div>
          </div>
        </Aparece>
      </section>

      {/* ═══ 10 · EL AUTO-NARRADOR — corto, y el único "la tuya" ════════════ */}
      <section className="border-y border-[#EBEBE7] bg-[#F7F7F5] py-20">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Aparece>
            <Capitulo numero="09">Otro caso</Capitulo>
            <h2 className="mt-4 text-2xl leading-snug [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-3xl">
              ¿Y si el libro es el tuyo?
            </h2>
            <Cuerpo className="mt-5 max-w-2xl">
              Hay quien no lo hace por un padre ni por un abuelo, sino por sus propios hijos: quiere dejar contado de
              dónde viene, antes de que empiece otra etapa. Funciona igual — las preguntas te llegan a ti, y el libro
              es el de tu vida.
            </Cuerpo>
          </Aparece>
        </div>
      </section>

      {/* ═══ 11 · PREGUNTAS ════════════════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <Aparece>
            <Capitulo numero="10">Preguntas</Capitulo>
            <Titulo>Lo que suelen preguntarnos.</Titulo>
          </Aparece>
          <Aparece>
            <dl className="divide-y divide-[#EBEBE7] border-y border-[#EBEBE7]">
              {PREGUNTAS.map((p) => (
                <div key={p.pregunta} className="py-7">
                  <dt className="text-xl [font-family:var(--fuente-titulo)] font-medium">{p.pregunta}</dt>
                  <dd className="mt-3 text-[16px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{p.respuesta}</dd>
                </div>
              ))}
            </dl>
          </Aparece>
        </div>
      </section>

      {/* ═══ 12 · CTA FINAL + PIE ══════════════════════════════════════════ */}
      <footer data-cta-propio className="bg-[#14140F] text-white">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-24 text-center sm:py-32">
          <Aparece>
            <CampoVF halo="#14140F" className="mx-auto h-32 w-auto" />
            <h2 className="mt-10 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-5xl sm:leading-[1.1]">
              En cada familia hay un libro sin escribir.
            </h2>
            <div className="mt-10 flex flex-col items-center gap-3">
              <BotonComprar enOscuro />
              <MicrocopyCta clara />
            </div>
          </Aparece>
        </div>

        <div className="border-t border-[#2B2B24]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
            <p className="text-[15px] italic text-[#AEAEA6] [font-family:var(--fuente-cuerpo)] font-light">
              Para las vidas que merecen su propio libro
            </p>
            <nav className="flex items-center gap-6 text-[12px] uppercase text-[#83837A] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">
              <Link href="/legal/terminos" className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Términos
              </Link>
              <Link href="/legal/privacidad" className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Privacidad
              </Link>
              <Link href="/entrar" className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Entrar
              </Link>
            </nav>
          </div>
        </div>
      </footer>

      <CtaSticky precio={precio} />
    </div>
  );
}
