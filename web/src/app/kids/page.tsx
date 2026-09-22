import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { obtenerPrecioKids } from "@/lib/precios";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { Tachado } from "../comprar/tachado";
import { Toroide } from "../marca";
import { Aparece } from "../aparece";
import { SelectorProducto } from "../selector-producto";
import { CONTACTO } from "../legal/titulares";

// La landing de Vitácora Kids — «Mi Primer Capítulo» (22/09,
// docs/kids/mi-primer-capitulo-design.md). Misma estructura y misma paleta que
// /viaje: hero, cómo funciona, precio, preguntas, cierre.
//
// OJO, a quién le habla: al PADRE, no al chico. El que compra es el que ya se
// olvidó cómo pensaba a los 11; el narrador es su hijo.
//
// Todavía NO se vende: /comprar/kids no existe y PRECIO_KIDS_* no está cargado.
// Mientras no haya precio, el CTA es lista de espera por mail en vez de un link
// a la nada (regla de las hermanas, web/src/lib/precios.ts). Al cargar el precio
// la página pasa sola a vender — no cargarlo hasta que exista el checkout.
//
// ⚠️ Textos a aprobar por Naza (regla de la casa).

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--fuente-cuerpo", display: "swap" });

export const metadata: Metadata = {
  title: "Vitácora Kids — Mi Primer Capítulo",
  description: "Tu hijo tiene 11 y se acuerda de todo. Tres semanas de preguntas por WhatsApp, las fotos de sus cosas, y el primer capítulo de su vida hecho libro.",
  openGraph: { title: "Mi Primer Capítulo — Vitácora Kids", description: "¿Te acordás qué querías ser a los 11? Él sí, ahora. Guardémoslo antes de que se le olvide." },
};

const PASOS = [
  { n: "01", titulo: "Cada día, una pregunta suya", texto: "No le preguntamos como a un grande. A qué jugaba cuando era más chiquito, cómo son sus viejos, quién es su mejor amigo, qué hace cuando algo le sale mal. Contesta con un audio, como le habla a un amigo." },
  { n: "02", titulo: "Y una foto de sus cosas", texto: "Su juguete favorito. El que rompió y no tira. Su mascota. Lo que hay adentro de la mochila. Cada foto va con lo que él dijo abajo — y esas son las páginas que dentro de treinta años lo van a partir al medio." },
  { n: "03", titulo: "El libro, y el sobre cerrado", texto: "Los primeros capítulos los leen ustedes ahora. El último son cuatro preguntas que le contesta a su yo de 40, y va en un sobre pegado a la contratapa. Ese no se abre todavía." },
];

const PREGUNTAS = [
  ["¿Le escriben a mi hijo o a mí?", "Lo elegís vos al comprar. Puede llegarle a su WhatsApp, o al tuyo y lo hacen juntos. En los dos casos vos ves todo lo que contesta desde tu panel, y podés borrar lo que quieras antes de cerrar el libro."],
  ["¿Para qué edad es?", "Para los diez, once, doce. Es la edad justa: todavía se acuerda de cuando era chiquito, y ya sabe contarlo."],
  ["¿Y si contesta con tres palabras?", "Está bien que conteste corto. No lo perseguimos ni lo retamos: si se queda callado, el recordatorio te llega a vos, no a él. Y por eso la mitad de las preguntas son mostrarnos una cosa suya y decir qué es — esas las contesta siempre."],
  ["Hay un tema que prefiero que no toque.", "Lo cargás cuando comprás. Una separación, alguien que se murió, algo de la escuela: el biógrafo no lo toca."],
  ["¿Usan su voz para algo?", "No. Guardamos sus audios tal cual, limpios y ordenados por capítulo, y te los damos junto con el libro. No imitamos su voz ni la clonamos: te la guardamos."],
] as const;

function formatear(monto: number, region: "AR" | "ES") {
  return new Intl.NumberFormat(region === "ES" ? "es-ES" : "es-AR", { style: "currency", currency: region === "ES" ? "EUR" : "ARS", maximumFractionDigits: 0 }).format(monto);
}

const ESPERA = `mailto:${CONTACTO.hola}?subject=${encodeURIComponent("Quiero Vitácora Kids para mi hijo")}&body=${encodeURIComponent("Hola. Quiero que me avisen cuando abra Mi Primer Capítulo.\n\nMi nombre:\nEdad de mi hijo/a:\nDesde dónde escribo:\n")}`;

export default function PaginaKids() {
  const precios = { AR: obtenerPrecioKids("AR"), ES: obtenerPrecioKids("ES") };
  const abierto = precios.AR !== null || precios.ES !== null;
  const promo = promoPorcentaje();
  const cta = "inline-flex h-13 items-center justify-center rounded-full bg-[#5D3FD3] px-8 text-base font-medium text-white transition-colors hover:bg-[#4F35BC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D3FD3] [font-family:var(--fuente-micro)]";
  const destino = abierto ? "/comprar/kids" : ESPERA;
  const textoCta = abierto ? "Empezar su primer capítulo" : "Avisame cuando abra";

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
            <SelectorProducto actual="kids" />
            <Link href="/entrar" className="text-sm text-[#D4D4CE] underline decoration-[#5F5F55] underline-offset-4 transition-colors hover:text-white [font-family:var(--fuente-micro)]">Entrar</Link>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
          <div className="flex flex-col gap-7">
            <p className="text-[11px] uppercase text-[#AEAEA6] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Kids · Mi Primer Capítulo</p>
            <h1 className="text-[2.6rem] leading-[1.06] [font-family:var(--fuente-titulo)] font-medium [letter-spacing:-0.02em] [text-wrap:balance] sm:text-6xl sm:leading-[1.04] lg:text-[4.1rem]">
              ¿Te acordás qué querías ser a los 11?
            </h1>
            <p className="max-w-xl text-[18px] leading-[1.7] text-[#D4D4CE] [font-family:var(--fuente-cuerpo)] font-light">
              Tu hijo sí. Ahora. Durante tres semanas un biógrafo le pregunta por WhatsApp y le pide fotos de sus cosas — el juguete, la mascota, lo que guarda y nadie entiende por qué. Al final, el primer capítulo de su vida es un libro. Para ustedes hoy. Para él a los 40.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link href={destino} className={cta}>{textoCta}</Link>
              {abierto ? (
                <span className="text-[14px] text-[#AEAEA6] [font-family:var(--fuente-micro)]">
                  {precios.AR !== null ? formatear(precios.AR, "AR") : ""}{precios.AR !== null && precios.ES !== null ? " · " : ""}{precios.ES !== null ? formatear(precios.ES, "ES") : ""} · el libro entero
                </span>
              ) : (
                <span className="text-[14px] text-[#AEAEA6] [font-family:var(--fuente-micro)]">Abre en unas semanas · te escribimos a vos primero</span>
              )}
            </div>
          </div>
          <Aparece>
            {/* Un día del chico, como se ve en el teléfono */}
            <div className="mx-auto w-full max-w-sm rounded-3xl border border-[#45453C] bg-[#1C1C16] p-5 text-[15px] leading-relaxed [font-family:var(--fuente-cuerpo)]">
              <p className="text-[10px] uppercase text-[#AEAEA6] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Día 3 · Mis cosas</p>
              <p className="mt-4 rounded-2xl rounded-tl-sm bg-[#2B2B24] p-4 text-[#F7F7F5]">
                Mostrame tu juguete favorito. El que elegirías si tuvieras que quedarte con uno solo. ¿Por qué ese?
              </p>
              <p className="mt-3 ml-10 rounded-2xl rounded-tr-sm bg-[#5D3FD3] p-3 text-white">🎙️ 0:48</p>
              <p className="mt-3 ml-10 rounded-2xl rounded-tr-sm bg-[#5D3FD3] p-3 text-white">📷 <span className="text-[#D4D4CE]">Me lo regaló el abuelo. Le puse cinta en el mango porque se me rompió y así queda mejor.</span></p>
              <p className="mt-3 rounded-2xl rounded-tl-sm bg-[#2B2B24] p-3 text-[#D4D4CE]">📷 Guardada en Mis cosas.</p>
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
            <h2 className="text-3xl leading-[1.15] [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-4xl">Un precio por el libro, no por pregunta.</h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
              Se paga una vez. Incluye las tres semanas de preguntas, sus fotos, el libro para leer y escuchar en la web, sus audios ordenados y el sobre cerrado. El impreso se suma aparte — y en este, el impreso es el regalo: un PDF de tu hijo de 11 no se regala en un cumpleaños.
            </p>
          </Aparece>
          <Aparece>
            <div className="rounded-2xl border-2 border-[#14140F] bg-white p-7">
              <p className="text-[10px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">el libro entero</p>
              <p className="mt-2 text-[24px] [font-family:var(--fuente-titulo)] font-medium">Mi Primer Capítulo</p>
              <dl className="mt-5 grid grid-cols-2 gap-4">
                {(["AR", "ES"] as const).map((r) => (
                  <div key={r}>
                    <dt className="text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">{r === "AR" ? "Argentina" : "España"}</dt>
                    <dd className="mt-1 text-[26px] tabular-nums [font-family:var(--fuente-titulo)]">
                      {precios[r] !== null && promo ? <Tachado lista={formatear(precioDeLista(precios[r]!, r === "ES" ? "EUR" : "ARS", promo), r)} porcentaje={promo} className="mr-2" /> : null}
                      {precios[r] !== null ? formatear(precios[r]!, r) : "Próximamente"}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link href={destino} className={`${cta} mt-7 w-full`}>{textoCta}</Link>
              <p className="mt-3 text-center text-[13px] text-[#83837A] [font-family:var(--fuente-micro)]">
                {abierto ? "Pago único · Mercado Pago o Stripe" : "Todavía no se vende. Te avisamos cuando abra."}
              </p>
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
            <h2 className="text-4xl leading-[1.1] [font-family:var(--fuente-titulo)] font-medium [text-wrap:balance] sm:text-5xl">A los 40 no se va a acordar. <span className="italic text-[#AEAEA6]">Salvo que lo guardes ahora.</span></h2>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link href={destino} className={cta}>{textoCta}</Link>
              <Link href="/" className="text-sm text-[#AEAEA6] underline decoration-[#45453C] underline-offset-4 hover:text-white [font-family:var(--fuente-micro)]">¿Buscás el libro de una vida? Vitácora Familiar →</Link>
            </div>
          </Aparece>
        </div>
      </section>
    </div>
  );
}
