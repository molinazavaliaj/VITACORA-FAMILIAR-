import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { CampoVF, Toroide } from "./marca";
import { Aparece } from "./aparece";

// Las tres de docs/design.md §4: Playfair grita, Archivo susurra, Source Serif
// habla. Se cargan acá y no en el layout a propósito — la landing es la única
// pantalla pasada al sistema visual; el tablero y el registro todavía no, y
// cambiarles la tipografía de rebote sería tocar pantallas sin revisar.
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
// El orden no es decorativo: la objeción principal de Martina —"mi papá no va a
// saber usarlo"— se desarma SEGUNDA, antes de que aparezca. Lo demás se apoya
// en eso.
//
// ⚠️ MODELO DE COBRO (decidido el 11/09, reemplaza a los dos anteriores): SE
// PAGA ANTES DE EMPEZAR. El CTA compra, no registra. Después del pago llega
// un mail con el acceso al tablero (código de 6 dígitos, la cuenta se crea
// sola con el mail del pago); ahí ve el libro crecer y compra los upsells. Si
// el narrador no acepta, devolución escribiendo a hola@. Las líneas donde esto
// se aparta de brief-landing.md §5 están marcadas abajo.

// Pilar 4 · El libro es la obra, no el papel. El impreso se comunica como
// upsell — regla dura de identidad-de-marca.md §7.
const FORMATOS = [
  {
    nombre: "El libro en PDF",
    detalle: "Escrito con sus palabras, listo para leer y para imprimir.",
    estado: "Incluido",
  },
  {
    nombre: "El audiolibro",
    detalle: "Su historia contada con su propia voz, la de verdad.",
    estado: "Incluido",
  },
  {
    nombre: "El libro impreso",
    detalle: "Tapa dura, con un código en la contratapa que hace sonar su voz.",
    estado: "Aparte",
  },
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
    // ⚠️ Texto a aprobar. Pago por adelantado, único, con devolución si el
    // narrador no acepta (por correo, no automática — decisión del 11/09).
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

// PLACEHOLDER — reemplazar por las 5 reseñas reales (docs/brief-landing.md §7bis).
// REGLA DURA: la landing NO se publica con esta sección visible si las reseñas
// no llegaron. Si el lanzamiento llega antes, se oculta la sección entera.
const TESTIMONIOS_DE_RELLENO = [
  "[Reseña real pendiente — corta, dos líneas: qué pensó que iba a pasar y qué pasó.]",
  "[Reseña real pendiente — mediana: el momento en que escuchó algo de su papá que no sabía, contado con detalle concreto. Este relleno es más largo a propósito, porque las reseñas reales nunca miden lo mismo y una sección diseñada con cinco textos iguales se rompe apenas entran los verdaderos.]",
  "[Reseña real pendiente — sobre la objeción: qué le diría a alguien que cree que su papá no va a saber usarlo. Es la más valiosa de las cinco.]",
  "[Reseña real pendiente — larga: qué pasó en la familia cuando vieron el libro terminado, y qué hicieron con él.]",
  "[Reseña real pendiente — una frase.]",
] as const;

// El violeta toca UNA sola cosa por pantalla (design.md). Acá es el botón.
// ⚠️ Texto a aprobar por Naza: reemplaza a "Empezar gratis" (modelo anterior)
// y a "Probar gratis" (brief §5). Con el pago por adelantado, el botón compra.
function BotonComprar({ enOscuro = false }: { enOscuro?: boolean }) {
  return (
    <Link
      href="/comprar"
      className={`inline-flex h-13 items-center justify-center rounded-full px-8 text-base font-medium transition-colors [font-family:var(--fuente-micro)] ${
        enOscuro
          ? "bg-[#8F7BE0] text-[#14140F] hover:bg-[#A296E6]"
          : "bg-[#5D3FD3] text-white hover:bg-[#4F35BC]"
      }`}
    >
      Comprar el libro
    </Link>
  );
}

// ⚠️ Texto a aprobar. Con el pago por adelantado el microcopy dice qué se lleva
// y que es un solo pago: nada de "sin tarjeta" ni "prueba gratis".
function MicrocopyCta({ clara = false }: { clara?: boolean }) {
  return (
    <p
      className={`text-[13px] [font-family:var(--fuente-micro)] ${clara ? "text-[#AEAEA6]" : "text-[#5F5F55]"}`}
    >
      Pago único · el libro en PDF y el audiolibro con su voz.
    </p>
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

// Espacio reservado para material real que todavía no existe (páginas del libro
// de Osvaldo, captura de WhatsApp, fragmento del audiolibro). Visible como
// pendiente a propósito: la landing no se publica con estos bloques a la vista.
function MaterialPendiente({
  etiqueta,
  className = "",
  enOscuro = false,
}: {
  etiqueta: string;
  className?: string;
  enOscuro?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center border border-dashed p-6 text-center ${
        enOscuro ? "border-[#45453C] bg-[#1C1C16]" : "border-[#AEAEA6] bg-[#F7F7F5]"
      } ${className}`}
    >
      <p
        className={`text-[10px] uppercase leading-relaxed [font-family:var(--fuente-micro)] [letter-spacing:0.24em] ${enOscuro ? "text-[#AEAEA6]" : "text-[#5F5F55]"}`}
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

      {/* ═══ 1 · HERO — apertura en negro ═══════════════════════════════════ */}
      <div className="bg-[#14140F] text-white">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-8">
          <div className="flex items-center gap-3">
            <Toroide className="h-7 w-auto" />
            <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">
              Vitácora Familiar
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/entrar"
              className="text-sm text-[#D4D4CE] underline decoration-[#5F5F55] underline-offset-4 transition-colors hover:text-white [font-family:var(--fuente-micro)]"
            >
              Entrar
            </Link>
            <Link
              href="/comprar"
              className="hidden h-10 items-center rounded-full bg-white px-5 text-sm font-medium text-[#14140F] transition-colors hover:bg-[#EBEBE7] [font-family:var(--fuente-micro)] sm:inline-flex"
            >
              Comprar el libro
            </Link>
          </div>
        </header>

        {/* Dos columnas, como la referencia (Remento): a la izquierda lo que
            vende, a la derecha el video. En el teléfono se apila: texto, botón,
            video. El Campo V·F grande dejó de abrir el hero — con dos columnas
            no cabe; queda el toroide en el encabezado y el Campo en el pie. */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-12 pt-16 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-7">
            {/* Slogan y descriptor van SIEMPRE juntos: el slogan solo se lee como
                "me toca escribirlo a mí" = trabajo. El descriptor lo desarma. */}
            <h1 className="text-4xl leading-[1.12] [font-family:var(--fuente-titulo)] font-medium [letter-spacing:-0.02em] sm:text-5xl sm:leading-[1.1] lg:text-[3.6rem]">
              En cada familia hay un libro sin escribir.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light sm:text-xl">
              Un biógrafo entrevista y escribe el libro de una vida. La de tu
              papá, la de tu abuela, la tuya.
            </p>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-4">
              <BotonComprar enOscuro />
              <a
                href="#como-funciona"
                className="inline-flex h-13 items-center justify-center rounded-full border border-[#45453C] px-7 text-base font-medium text-[#D4D4CE] transition-colors hover:border-[#83837A] hover:text-white [font-family:var(--fuente-micro)]"
              >
                Cómo funciona ↓
              </a>
            </div>
            <MicrocopyCta clara />

            {/* Las cuatro cosas que desarman la objeción, a la vista desde el
                primer segundo. Cada una contesta un miedo de Martina. */}
            <ul className="mt-2 flex flex-col gap-2.5 text-[15px] text-[#AEAEA6] [font-family:var(--fuente-cuerpo)] font-light">
              {[
                "Él solo habla por WhatsApp. Nadie escribe nada.",
                "Sin app ni nada que instalar.",
                "Su voz real, en cada capítulo del audiolibro.",
                "Lo lees crecer mientras él responde.",
              ].map((linea) => (
                <li key={linea} className="flex items-start gap-3">
                  <span aria-hidden className="mt-[3px] inline-block h-4 w-4 shrink-0 rounded-full border border-[#5F5F55] text-center text-[10px] leading-[14px] text-[#8F7BE0]">
                    ✓
                  </span>
                  {linea}
                </li>
              ))}
            </ul>
          </div>

          {/* El video. Espacio reservado con la proporción real (16:9) para
              que el layout ya sea el definitivo cuando exista el material. */}
          <Aparece>
            <MaterialPendiente
              etiqueta="Pendiente · video del hero (16:9)"
              enOscuro
              className="aspect-video w-full rounded-lg"
            />
          </Aparece>
        </section>

        {/* Pilar 1 · LO QUE SE PIERDE — el que abre */}
        <section className="mx-auto w-full max-w-3xl px-6 pb-20 pt-6 text-center sm:pb-24">
          <Aparece>
            <p className="text-2xl leading-[1.35] [font-family:var(--fuente-titulo)] font-medium sm:text-4xl sm:leading-[1.3]">
              Las fotos quedan.
              <br />
              <span className="italic text-[#8F7BE0]">Los recuerdos se van.</span>
            </p>
            <p className="mx-auto mt-6 max-w-lg text-[17px] leading-[1.75] text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
              Tienes el teléfono lleno de fotos suyas y ni una sola de sus
              historias. La cara la guarda el celular. La voz, lo que vivió y
              cómo lo cuenta, no la guarda nadie.
            </p>
          </Aparece>
        </section>

        {/* La luz llega bajando */}
        <div className="h-24 bg-gradient-to-b from-[#14140F] to-[#F7F7F5] sm:h-32" />
      </div>

      {/* ═══ 2 · CÓMO FUNCIONA — desarma la objeción antes de que aparezca ═══ */}
      <section id="como-funciona" className="scroll-mt-8 bg-[#F7F7F5] pb-24 pt-4 sm:pb-28">
        <div className="mx-auto w-full max-w-5xl px-6">
          <Aparece>
            <div className="max-w-2xl">
              <Etiqueta>Cómo funciona</Etiqueta>
              <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
                Él no tiene que aprender nada.
              </h2>
              <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                Lo que frena a la mayoría no es el precio: es imaginarse
                explicándole una aplicación por teléfono. No hay ninguna.
              </p>
            </div>
            <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="flex flex-col gap-3">
                  <span className="text-[11px] text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl [font-family:var(--fuente-titulo)] font-medium">
                    {paso.titulo}
                  </h3>
                  <p className="text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                    {paso.texto}
                  </p>
                </li>
              ))}
            </ol>
          </Aparece>
        </div>
      </section>

      {/* ═══ 3 · SOLO TIENE QUE MANDAR UN AUDIO — la prueba visual ══════════ */}
      <section className="mx-auto grid w-full max-w-4xl items-center gap-12 px-6 py-24 sm:grid-cols-2 sm:py-28">
        <Aparece>
          <Etiqueta>La conversación</Etiqueta>
          <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
            Solo tiene que mandar un audio.
          </h2>
          <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
            Una pregunta por la mañana, a la hora que él prefiera. Contesta
            hablando, apretando el micrófono como hace con sus hijos. Si un día
            no puede, la pregunta espera.
          </p>
        </Aparece>
        <Aparece>
          <MaterialPendiente
            etiqueta="Pendiente · captura real de la conversación de WhatsApp"
            className="min-h-[340px]"
          />
        </Aparece>
      </section>

      {/* ═══ 4 · LA PREVISUALIZACIÓN — el momento en que se decide ══════════ */}
      <section className="border-y border-[#EBEBE7] bg-[#F7F7F5] py-24 sm:py-28">
        <div className="mx-auto grid w-full max-w-4xl items-center gap-12 px-6 sm:grid-cols-2">
          <Aparece>
            <MaterialPendiente
              etiqueta="Pendiente · las primeras páginas reales del libro de Osvaldo"
              className="min-h-[360px]"
            />
          </Aparece>
          <Aparece>
            <Etiqueta>Desde el tercer día</Etiqueta>
            <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              No te lo imaginas: lo vas leyendo.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              A la tercera respuesta te llega un correo con un minuto de su voz y
              las primeras páginas ya escritas: la portada con su nombre, el
              índice de su libro y su primera página, con sus palabras y sus
              modos de decir.
            </p>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              <strong className="font-normal text-[#14140F]">
                Y desde tu panel lo ves crecer día a día
              </strong>
              , mucho antes de que esté terminado. No hay que esperar un mes a
              ciegas.
            </p>
          </Aparece>
        </div>
      </section>

      {/* ═══ 5 · EL OBJETO — pilar 4, el que sostiene el precio ═════════════ */}
      <section className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-28">
        <Aparece>
          <div className="max-w-2xl">
            <Etiqueta>El libro</Etiqueta>
            <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              Una vida merece un libro.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Una vida común tratada como una vida extraordinaria, porque lo es.
              Capítulos, índice, sus frases de siempre en una página aparte.
            </p>
          </div>
          <dl className="mt-14 divide-y divide-[#EBEBE7] border-y border-[#EBEBE7]">
            {FORMATOS.map((f) => (
              <div
                key={f.nombre}
                className="flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
              >
                <div className="sm:max-w-md">
                  <dt className="text-xl [font-family:var(--fuente-titulo)] font-medium">
                    {f.nombre}
                  </dt>
                  <dd className="mt-1 text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                    {f.detalle}
                  </dd>
                </div>
                <span className="shrink-0 text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">
                  {f.estado}
                </span>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[14px] leading-[1.7] text-[#5F5F55] [font-family:var(--fuente-cuerpo)] font-light">
            El libro impreso se pide aparte, cuando el libro ya está terminado.
          </p>
        </Aparece>
      </section>

      {/* ═══ 6 · LA VOZ — el diferencial que nadie tiene en castellano ══════ */}
      <section className="bg-[#F7F7F5] py-24 sm:py-28">
        <div className="mx-auto grid w-full max-w-4xl items-center gap-12 px-6 sm:grid-cols-2">
          <Aparece>
            <Etiqueta>El audiolibro</Etiqueta>
            <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              No solo lo que contó. Cómo lo contaba.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              El libro viene con el audiolibro en su voz real: sus silencios, su
              manera de arrancar las frases, la risa cuando se acuerda de algo.
              Y el libro impreso lleva un código en la contratapa que lo hace
              sonar.
            </p>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              En castellano no existe nada parecido.
            </p>
          </Aparece>
          <Aparece>
            <MaterialPendiente
              etiqueta="Pendiente · fragmento del audiolibro para escuchar acá"
              className="min-h-[220px]"
            />
          </Aparece>
        </div>
      </section>

      {/* ═══ 7 · NAVIDAD — pilar 3, el ángulo de lanzamiento ════════════════ */}
      <section className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-28">
        <Aparece>
          <div className="max-w-2xl">
            <Etiqueta>En diciembre</Etiqueta>
            <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              Este año, algo que no se puede comprar hecho.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Todos los años el mismo problema y todos los años lo mismo. Este
              año hay algo que antes no existía: la historia de la familia, y un
              pedazo de esa historia para cada uno.
            </p>
            <p className="mt-4 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Un libro para la casa, y un marco para cada primo y cada tío: se
              acerca el teléfono y suena su voz. Todos escuchan lo mismo el
              mismo día.
            </p>
          </div>
        </Aparece>
      </section>

      {/* ═══ 8 · LO QUE QUEDA — pilar 2, el que habla al narrador ═══════════ */}
      <section className="bg-[#14140F] pb-28 pt-24 text-white sm:pb-32 sm:pt-28">
        <div className="mx-auto w-full max-w-3xl px-6 text-center">
          <Aparece>
            <Etiqueta clara>Lo que se hereda</Etiqueta>
            <p className="mt-6 text-3xl leading-[1.25] [font-family:var(--fuente-titulo)] font-medium sm:text-5xl sm:leading-[1.2]">
              Ochenta años de aprender, y hoy vive todo en una sola cabeza.
            </p>
            <p className="mx-auto mt-8 max-w-xl text-[17px] leading-[1.75] text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
              No es nostalgia: es transmisión. Lo que aprendió en toda una vida
              les sirve a sus nietos, y a los que todavía no nacieron. Dentro de
              veinte años tus hijos van a tener dónde ir a buscarlo.
            </p>
            <p className="mx-auto mt-10 max-w-lg text-2xl leading-[1.35] [font-family:var(--fuente-titulo)] font-medium italic sm:text-3xl">
              Hay preguntas que un día ya no se pueden hacer.
            </p>
          </Aparece>
        </div>
      </section>

      {/* ═══ TESTIMONIOS — PLACEHOLDER, no publicar visible ═════════════════ */}
      <section className="bg-[#F7F7F5] pb-24 pt-24 sm:pb-28">
        <div className="mx-auto w-full max-w-5xl px-6">
          <Aparece>
            <Etiqueta>Las familias</Etiqueta>
            <p className="mt-3 text-[13px] text-[#5F5F55] [font-family:var(--fuente-micro)]">
              ⚠️ Sección de maqueta. Se publica solo con las cinco reseñas reales
              y su permiso por escrito, o no se publica.
            </p>
            <div className="mt-10 columns-1 gap-8 sm:columns-2 lg:columns-3">
              {TESTIMONIOS_DE_RELLENO.map((texto, i) => (
                <figure
                  key={i}
                  className="mb-8 break-inside-avoid border border-dashed border-[#AEAEA6] bg-white p-6"
                >
                  {/* PLACEHOLDER — reemplazar por reseña real */}
                  <blockquote className="text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                    {texto}
                  </blockquote>
                  <figcaption className="mt-4 text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">
                    Nombre real · Ciudad
                  </figcaption>
                </figure>
              ))}
            </div>
          </Aparece>
        </div>
      </section>

      {/* ═══ 9 · PRECIO, TRANSPARENTE ══════════════════════════════════════ */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-28">
        <Aparece>
          <Etiqueta>El precio</Etiqueta>
          <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
            Un solo pago. Sin sorpresas después.
          </h2>
          <div className="mt-10">
            <p className="text-6xl [font-family:var(--fuente-titulo)] font-medium">{precio}</p>
            <p className="mt-3 text-[15px] text-[#5F5F55] [font-family:var(--fuente-micro)]">
              Pago único · el libro en PDF y el audiolibro con su voz
            </p>
          </div>
          <p className="mx-auto mt-8 max-w-xl text-[16px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
            Es lo que sale hoy un libro de preguntas que él tendría que llenar a
            mano. Aquí lo cuenta hablando, y además le queda su voz grabada. Si
            él no acepta participar, te devolvemos el dinero.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <BotonComprar />
            <MicrocopyCta />
          </div>
        </Aparece>
      </section>

      {/* ═══ 10 · EL AUTO-NARRADOR — corto, y el único "la tuya" ════════════ */}
      <section className="border-y border-[#EBEBE7] bg-[#F7F7F5] py-20">
        <div className="mx-auto w-full max-w-3xl px-6">
          <Aparece>
            <Etiqueta>Otro caso</Etiqueta>
            <h2 className="mt-4 text-2xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-3xl">
              ¿Y si el libro es el tuyo?
            </h2>
            <p className="mt-5 max-w-2xl text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Hay quien no lo hace por un padre ni por un abuelo, sino por sus
              propios hijos: quiere dejar contado de dónde viene, antes de que
              empiece otra etapa. Funciona igual — las preguntas te llegan a ti,
              y el libro es el de tu vida.
            </p>
          </Aparece>
        </div>
      </section>

      {/* ═══ 11 · PREGUNTAS ════════════════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">
        <Aparece>
          <Etiqueta>Preguntas</Etiqueta>
          <h2 className="mt-4 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
            Lo que suelen preguntarnos.
          </h2>
          <dl className="mt-12 divide-y divide-[#EBEBE7] border-y border-[#EBEBE7]">
            {PREGUNTAS.map((p) => (
              <div key={p.pregunta} className="py-7">
                <dt className="text-lg [font-family:var(--fuente-titulo)] font-medium">
                  {p.pregunta}
                </dt>
                <dd className="mt-3 text-[16px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
                  {p.respuesta}
                </dd>
              </div>
            ))}
          </dl>
        </Aparece>
      </section>

      {/* ═══ 12 · CTA FINAL + PIE ══════════════════════════════════════════ */}
      <footer className="bg-[#14140F] text-white">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-24 text-center sm:py-28">
          <Aparece>
            <CampoVF halo="#14140F" className="mx-auto h-28 w-auto" />
            <h2 className="mt-8 text-3xl leading-snug [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">
              En cada familia hay un libro sin escribir.
            </h2>
            <div className="mt-10 flex flex-col items-center gap-3">
              <BotonComprar enOscuro />
              <MicrocopyCta clara />
            </div>
          </Aparece>
        </div>

        <div className="border-t border-[#2B2B24]">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
            <p className="text-[15px] italic text-[#AEAEA6] [font-family:var(--fuente-cuerpo)] font-light">
              Para las vidas que merecen su propio libro
            </p>
            <nav className="flex items-center gap-6 text-[12px] uppercase text-[#83837A] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">
              <Link href="/legal/terminos" className="transition-colors hover:text-white">
                Términos
              </Link>
              <Link href="/legal/privacidad" className="transition-colors hover:text-white">
                Privacidad
              </Link>
              <Link href="/entrar" className="transition-colors hover:text-white">
                Entrar
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
