import Image from "next/image";
import { ReproductorOnda } from "../_ui/reproductor-onda";
import { TEXTOS_MAQUETA } from "../_textos/maqueta";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { DibujoAudio, DibujoLibreta, DibujoLibro } from "../_direccion/dibujos";
import { Foto, OndaQuieta, Palabras, conVar } from "../_direccion/piezas";

// La PARTE 2 de la maqueta escondida (15/10): Cómo funciona en 4 pasos, la
// carta de los fundadores sobre la vidriera y «Escúchalo» con el fragmento de
// su voz. Textos 11 a 20 de docs/rediseno-2026-10/amigo/textos.md (en
// _textos/maqueta.ts); la carta, la cita del limonero y el reproductor salen
// tal cual de portada.ts. Las secciones copian el armado de la portada real
// (_portada/portada.tsx, secciones 4, 5 y 11) sin tocarla.
//
// Capas: ninguna de estas es [data-capa]. Bajan con la página, cada una con
// su borde (sombra arriba y, en el papel, el corte a mano), así nunca tapan
// algo que se está leyendo. Van en un fragmento porque las reglas de las
// hojas solapadas (direccion.css) miran a los hijos directos de .dir-portada.

const FOTOS = {
  vidriera: "/rediseno/vidriera-vitacora.jpg",
  guitarra: "/rediseno/osvaldo-guitarra.jpg",
  portada: "/rediseno/libro-osvaldo-portada.jpg",
  contraportada: "/rediseno/libro-osvaldo-contraportada.jpg",
} as const;

const DIBUJOS = [DibujoLibreta, DibujoAudio, DibujoLibro] as const;

export function MaquetaParte2({ idioma }: { idioma: "es" | "ar" }) {
  const t = TEXTOS_MAQUETA[idioma];
  const p = TEXTOS_PORTADA[idioma];
  // El mismo fragmento que la portada: sin un audio de muestra con permiso,
  // la onda queda quieta, sin botón que prometa un sonido que no está.
  const fragmentoAudio = process.env.NEXT_PUBLIC_URL_FRAGMENTO_AUDIO;
  const [paso1, paso2, paso3, paso4] = t.como.pasos;
  const nFrase = t.carta.frase.split(" ").length;

  return (
    <>
      {/* ═══ 3 · CÓMO FUNCIONA, sobre tinta: el título queda quieto al costado
          (en la pantalla grande) y los tres primeros pasos pasan con su dibujo
          a lápiz. El cuarto, el que emociona, va aparte, con el libro. ═══ */}
      <section id="como-funciona" className="mq-como dir-tinta dir-hoja dir-diferido relative z-[3] scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 pt-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:pt-36 lg:px-12">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-24">
              <h2 className="dir-titular dir-t2 aparece">{t.como.titulo}</h2>
              <p className="aparece mt-7 max-w-[32ch] text-[20px] font-light leading-[1.5] text-[var(--dir-sobre-tinta-suave)] sm:text-[23px]">
                {t.como.bajada}
              </p>
            </div>
          </div>
          <ol className="mt-14 md:col-span-6 md:col-start-7 md:mt-0">
            {[paso1, paso2, paso3].map((paso, i) => {
              const Dibujo = DIBUJOS[i];
              return (
                <li
                  key={paso.titulo}
                  data-revela
                  className="dir-momento flex flex-col gap-7 border-t border-[var(--dir-hilo-tinta)] py-12 md:min-h-[60vh] md:justify-center md:py-16"
                >
                  <div className="flex items-end justify-between gap-6">
                    <span aria-hidden className="dir-numero">
                      {i + 1}
                    </span>
                    <Dibujo />
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="sr-only">{p.como.paso(i + 1)}</span>
                    <h3 className="dir-titular text-[30px] leading-[1.1] sm:text-[38px] lg:text-[44px]">{paso.titulo}</h3>
                    <p className="max-w-[40ch] text-[18px] font-light leading-[1.6] text-[var(--dir-sobre-tinta-suave)] sm:text-[19px] lg:text-[21px]">
                      {paso.texto}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* El paso 4: a todo el ancho, con el libro de verdad en la mano. */}
        <div className="mx-auto max-w-[1360px] px-4 pb-24 sm:px-8 md:pb-36 lg:px-12">
          <div className="mq-paso-final grid grid-cols-1 items-center gap-12 pt-14 md:grid-cols-12 md:gap-8 md:pt-24">
            <div className="aparece flex justify-center md:col-span-5">
              <div className="mq-tapa">
                <Image src={FOTOS.portada} alt={p.libro.altPortada} width={376} height={520} sizes="(min-width: 768px) 300px, 62vw" />
              </div>
            </div>
            <div data-revela className="flex flex-col gap-6 md:col-span-6 md:col-start-7">
              <span aria-hidden className="dir-numero mq-numero-dorado">
                4
              </span>
              <span className="sr-only">{p.como.paso(4)}</span>
              <h3 className="dir-titular dir-t3 max-w-[14ch]">{paso4.titulo}</h3>
              <p className="dir-parrafo max-w-[38ch]">{paso4.texto}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4 · LA CARTA de los fundadores, sobre la vidriera (como la portada) ═══ */}
      <section className="dir-tinta dir-hoja dir-diferido relative z-[4] overflow-hidden">
        <div aria-hidden className="dir-carta-fondo pointer-events-none absolute inset-0">
          <Image src={FOTOS.vidriera} alt="" fill sizes="100vw" quality={60} className="object-cover object-[46%_45%]" />
        </div>
        <div className="relative mx-auto max-w-[1360px] px-4 pb-28 pt-28 sm:px-8 md:pb-40 md:pt-40 lg:px-12">
          <h2 data-revela className="dir-titular dir-t15 max-w-[17ch]" style={conVar({ "--paso": "0.11s" })}>
            <span className="sr-only">{t.carta.frase}</span>
            <span aria-hidden>
              <Palabras texto={t.carta.frase} total={nFrase} />
            </span>
          </h2>
          <div className="mt-20 grid grid-cols-1 items-start gap-12 md:mt-28 md:grid-cols-12 md:gap-8">
            <Foto
              src={FOTOS.guitarra}
              alt=""
              forma="arco"
              recorte
              sizes="(min-width: 768px) 24vw, 46vw"
              className="w-[46%] justify-self-end md:order-2 md:col-span-3 md:col-start-10 md:mt-24 md:w-full"
            />
            <article className="dir-carta aparece md:order-1 md:col-span-7 md:col-start-2">
              <div className="dir-carta-hoja">
                {/* 18 · la carta aprobada el 14/10, sin cambios. */}
                <p className="dir-carta-texto">{p.direccion.dolor.carta}</p>
                <footer data-revela className="mt-10 flex flex-col gap-1">
                  <span className="dir-firma">{t.carta.firma}</span>
                  <svg viewBox="0 0 220 18" className="dir-firma-trazo" aria-hidden>
                    <path
                      className="dir-linea"
                      style={conVar({ "--k": 2 })}
                      d="M3 12 C40 4 70 15 104 9 S170 3 216 8"
                      pathLength={1}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </footer>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ═══ 5 · ESCÚCHALO, en papel: el único lugar que explica «su voz».
          La cita del limonero con su fragmento y la contratapa con el QR. ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-diferido relative z-[5]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 pb-24 pt-28 sm:px-8 md:grid-cols-12 md:gap-8 md:pb-36 md:pt-40 lg:px-12">
          <div className="flex flex-col gap-10 md:col-span-7">
            <div className="aparece flex flex-col gap-6">
              <h2 className="dir-titular dir-t3 max-w-[16ch]">{t.escuchalo.titulo}</h2>
              <p className="dir-parrafo max-w-[44ch]">{t.escuchalo.texto}</p>
            </div>
            <figure className="aparece flex flex-col gap-8 border-t border-[var(--dir-hilo-papel)] pt-10">
              <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{p.voz.capitulo}</span>
              <blockquote className="dir-cita mq-cita">{p.voz.cita}</blockquote>
              <div className="dir-sobre-papel-onda max-w-[560px]">
                {fragmentoAudio ? (
                  <ReproductorOnda src={fragmentoAudio} etiquetaReproducir={p.voz.escuchar} etiquetaPausar={p.voz.pausar} />
                ) : (
                  <OndaQuieta duracion={p.voz.duracion} />
                )}
              </div>
            </figure>
          </div>
          <div className="aparece flex justify-center md:col-span-4 md:col-start-9">
            <div className="mq-contra">
              <Image src={FOTOS.contraportada} alt={p.voz.altContraportada} width={378} height={520} sizes="(min-width: 768px) 320px, 66vw" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
