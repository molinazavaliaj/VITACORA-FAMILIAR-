import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { obtenerPrecioViaje } from "@/lib/precios";
import { Toroide } from "../marca";
import { Aparece } from "../aparece";
import { SelectorProducto } from "../selector-producto";

// La landing de la Vitácora de viaje (19/09, docs/vitacora-de-viaje.md): mínima
// a propósito — hero, cómo funciona, qué recibís, precio, preguntas, CTA. Un
// influencer manda a su gente a este link: tiene que explicar antes de pedir
// datos. En vos: el viajero se compra a sí mismo. Misma paleta que la home.
//
// ⚠️ Textos a aprobar por Naza (regla de la casa).

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--fuente-cuerpo", display: "swap" });

export const metadata: Metadata = {
  title: "Vitácora de viaje",
  description: "Tu biógrafo te escribe cada noche del viaje, guarda tus fotos con su historia y, al volver, tu viaje es un libro.",
  openGraph: { title: "Vitácora de viaje — un libro en cada viaje", description: "Cada noche, una pregunta por WhatsApp. Cada etapa, un capítulo. Al volver, el libro." },
};

const PASOS = [
  { n: "01", titulo: "Cada noche te pregunta", texto: "Cuando el día terminó, tu biógrafo te escribe por WhatsApp: lo mejor del día, alguien que conociste, lo que salió distinto del plan. Le respondés con un audio, como a un amigo." },
  { n: "02", titulo: "Le mandás la foto del día", texto: "Una foto y qué estaba pasando cuando la sacaste. Queda guardada en su etapa, con tu historia al lado. Podés mandar más cuando quieras." },
  { n: "03", titulo: "Al volver, tu viaje es un libro", texto: "Cada ciudad, un capítulo. Se lee y se escucha en la web, y tenés un link para compartirlo con tu gente." },
];

const PREGUNTAS = [
  ["¿Y si todavía no tengo todas las fechas?", "Cargás lo que sabés. Las etapas sin fecha se completan después desde tu panel, y si aparece una ciudad nueva la agregás ahí: las noches que faltan se acomodan solas."],
  ["¿Cuántas fotos puedo mandar?", "Las que quieras, por WhatsApp, cuando quieras. Para el libro impreso, al volver te pedimos las mejores en su tamaño original."],
  ["¿Me trata de vos?", "Sí. Es tu biógrafo: te habla como te hablaría un amigo que viaja contigo. En castellano."],
  ["¿Cuándo llega el libro?", "Cuando volvés, tu biógrafo te hace una última pregunta —¿faltó algo?— y con eso escribe el libro. Lo leés en la web a los pocos días."],
] as const;

function formatear(monto: number, region: "AR" | "ES") {
  return new Intl.NumberFormat(region === "ES" ? "es-ES" : "es-AR", { style: "currency", currency: region === "ES" ? "EUR" : "ARS", maximumFractionDigits: 0 }).format(monto);
}

export default function PaginaViaje() {
  const precios = { AR: obtenerPrecioViaje("AR"), ES: obtenerPrecioViaje("ES") };
  const cta = "inline-flex h-13 items-center justify-center rounded-full bg-[#5D3FD3] px-8 text-base font-medium text-white transition-colors hover:bg-[#4F35BC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D3FD3] [font-family:var(--fuente-micro)]";

  return (
    <div className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} flex flex-1 flex-col bg-white text-[#14140F]`}>
      {/* ── Hero, en negro como la home ── */}
      <div className="bg-[#14140F] text-white">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-7">
          <Link href="/" className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="Vitácora, inicio">
            <Toroide className="h-7 w-auto" />
            <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <SelectorProducto actual="viaje" />
            <Link href="/entrar" className="text-sm text-[#D4D4CE] underline decoration-[#5F5F55] underline-offset-4 transition-colors hover:text-white [font-family:var(--fuente-micro)]">Entrar</Link>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
          <div className="flex flex-col gap-7">
            <p className="text-[11px] uppercase text-[#AEAEA6] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora de viaje</p>
            <h1 className="text-[2.6rem] leading-[1.06] [font-family:var(--fuente-titulo)] font-medium [letter-spacing:-0.02em] [text-wrap:balance] sm:text-6xl sm:leading-[1.04] lg:text-[4.1rem]">
              También hay un libro en cada viaje.
            </h1>
            <p className="max-w-xl text-[18px] leading-[1.7] text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
              Un biógrafo que viaja contigo por WhatsApp: cada noche te pregunta por el día, guarda tus fotos con su historia, y al volver, tu viaje es un libro. Cada ciudad, un capítulo.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/comprar/viaje" className={cta}>Empezar mi Vitácora de viaje</Link>
              {precios.AR !== null ? <span className="text-[14px] text-[#AEAEA6] [font-family:var(--fuente-micro)]">{formatear(precios.AR, "AR")}{precios.ES !== null ? ` · ${formatear(precios.ES, "ES")}` : ""} · el viaje entero</span> : null}
            </div>
          </div>
          <Aparece>
            {/* Una noche del viaje, como se ve en el teléfono */}
            <div className="mx-auto w-full max-w-sm rounded-3xl border border-[#45453C] bg-[#1C1C16] p-5 text-[15px] leading-relaxed [font-family:var(--fuente-cuerpo)]">
              <p className="text-[10px] uppercase text-[#AEAEA6] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Noche 3 · Lisboa</p>
              <p className="mt-4 rounded-2xl rounded-tl-sm bg-[#2B2B24] p-4 text-[#F7F7F5]">
                Ayer dijiste que el de la pensión te iba a llevar a la feria. ¿Fuiste? Contame qué comiste hoy que no vas a olvidar, y dónde. Y mandame la foto de hoy con lo que estaba pasando.
              </p>
              <p className="mt-3 ml-10 rounded-2xl rounded-tr-sm bg-[#5D3FD3] p-3 text-white">🎙️ 2:41</p>
              <p className="mt-3 ml-10 rounded-2xl rounded-tr-sm bg-[#5D3FD3] p-3 text-white">📷 <span className="text-[#D4D4CE]">Los pasteles de Belém, con el señor que me contó cómo se hacen.</span></p>
              <p className="mt-3 rounded-2xl rounded-tl-sm bg-[#2B2B24] p-3 text-[#D4D4CE]">📷 Guardada en Lisboa.</p>
            </div>
          </Aparece>
        </section>
        <div className="h-24 bg-gradient-to-b from-[#14140F] to-[#F7F7F5] sm:h-32" />
      </div>

      {/* ── Cómo funciona ── */}
      <section className="bg-[#F7F7F5] pb-24 pt-2 sm:pb-32">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Aparece>
            <h2 className="text-3xl leading-[1.15] [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-4xl">Cómo funciona.</h2>
          </Aparece>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {PASOS.map((p) => (
              <Aparece key={p.n}>
                <li className="flex h-full flex-col gap-3 rounded-2xl border border-[#EBEBE7] bg-white p-7">
                  <span className="text-[11px] tabular-nums text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">{p.n}</span>
                  <p className="text-xl [font-family:var(--fuente-titulo)] font-medium">{p.titulo}</p>
                  <p className="text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{p.texto}</p>
                </li>
              </Aparece>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Precio ── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Aparece>
            <h2 className="text-3xl leading-[1.15] [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-4xl">Un precio por viaje, no por noche.</h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Lo pagás una vez, antes de salir. Incluye todas las noches del viaje, tus fotos, el libro para leer y escuchar en la web, y el link para compartirlo. El impreso y el audiolibro con tu voz se suman después, si querés.
            </p>
          </Aparece>
          <Aparece>
            <div className="rounded-2xl border-2 border-[#14140F] bg-white p-7">
              <p className="text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">el viaje entero</p>
              <p className="mt-2 text-[24px] [font-family:var(--fuente-titulo)] font-medium">Vitácora de viaje</p>
              <dl className="mt-5 grid grid-cols-2 gap-4">
                {(["AR", "ES"] as const).map((r) => (
                  <div key={r}>
                    <dt className="text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">{r === "AR" ? "Argentina" : "España"}</dt>
                    <dd className="mt-1 text-[26px] tabular-nums [font-family:var(--fuente-titulo)]">{precios[r] !== null ? formatear(precios[r]!, r) : "Próximamente"}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/comprar/viaje" className={`${cta} mt-7 w-full`}>Empezar mi Vitácora de viaje</Link>
              <p className="mt-3 text-center text-[13px] text-[#83837A] [font-family:var(--fuente-micro)]">Pago único · Mercado Pago o Stripe</p>
            </div>
          </Aparece>
        </div>
      </section>

      {/* ── Preguntas ── */}
      <section className="border-y border-[#EBEBE7] bg-[#F7F7F5] py-24">
        <div className="mx-auto w-full max-w-3xl px-6">
          <Aparece>
            <h2 className="text-3xl leading-[1.15] [font-family:var(--fuente-titulo)] font-medium sm:text-4xl">Preguntas que nos hacen.</h2>
          </Aparece>
          <dl className="mt-10 divide-y divide-[#D4D4CE]">
            {PREGUNTAS.map(([q, a]) => (
              <Aparece key={q}>
                <div className="py-6">
                  <dt className="text-[19px] [font-family:var(--fuente-titulo)] font-medium">{q}</dt>
                  <dd className="mt-2 text-[16px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{a}</dd>
                </div>
              </Aparece>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Cierre ── */}
      <section className="bg-[#14140F] py-24 text-white lg:py-32">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center">
          <Aparece>
            <h2 className="text-4xl leading-[1.1] [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-5xl">Las fotos quedan. <span className="italic text-[#AEAEA6]">Lo que viviste, también.</span></h2>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link href="/comprar/viaje" className={cta}>Empezar mi Vitácora de viaje</Link>
              <Link href="/" className="text-sm text-[#AEAEA6] underline decoration-[#45453C] underline-offset-4 hover:text-white [font-family:var(--fuente-micro)]">¿Buscás el libro de una vida? Vitácora Familiar →</Link>
            </div>
          </Aparece>
        </div>
      </section>
    </div>
  );
}
