import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenVoz } from "@/lib/token-libro";
import { frasesPublicables, leerFrases } from "@/lib/frases";
import { hayLibroOnline } from "@/lib/libro-online";
import { Toroide } from "../../marca";
import { ReproductorRespuesta } from "../../tablero/reproductor";
import { CompartirFrase } from "./compartir";

// La página del cliente (spec 2026-09-20-su-voz-design, "La página pública"):
// una sola, sin login, con todo adentro — el libro online y sus mejores frases
// para escuchar. Dos entradas a la misma página: el código de la contratapa
// abre desde arriba; el QR de la sección de frases y el chip del marco caen en
// #frases. Cada frase tiene su ancla (#f-<id>) para mandar UNA por WhatsApp.
// El token es 'voz', distinto del de la muestra: el link que se reenvía para
// vender copias sigue mostrando solo la muestra.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], variable: "--fuente-cuerpo", display: "swap" });

export default async function PaginaVoz({ params }: PageProps<"/voz/[token]">) {
  const { token } = await params;
  const datos = verificarTokenVoz(token);
  if (!datos) notFound();

  const admin = crearClienteServidor();
  const [{ data: narrador }, frases, libroListo] = await Promise.all([
    admin.from("narradores").select("nombre, como_le_dicen, libro_aprobado_at").eq("id", datos.narradorId).maybeSingle(),
    leerFrases(admin, datos.narradorId),
    hayLibroOnline(admin, datos.narradorId),
  ]);
  const n = narrador as { nombre: string; como_le_dicen: string; libro_aprobado_at: string | null } | null;
  if (!n?.libro_aprobado_at) notFound();

  const publicables = frases ? frasesPublicables(frases) : [];
  const total = publicables.reduce((s, p) => s + p.frases.length, 0);
  const tab = "inline-flex h-11 items-center justify-center rounded-full px-6 text-[15px] font-medium transition-colors [font-family:var(--fuente-micro)]";

  return (
    <div className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} min-h-full bg-[var(--fondo)] text-[var(--texto)] [font-family:var(--fuente-cuerpo)]`}>
      <header className="oscuro flex items-center justify-between bg-[var(--fondo)] px-6 py-5 text-[var(--texto)]">
        <Link href="/" className="flex items-center gap-3">
          <Toroide className="h-8 w-8" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16">
        <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">El libro de una vida</p>
        <h1 className="mt-2 text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium md:text-4xl [text-wrap:balance]">
          La historia de {n.nombre}
        </h1>

        <nav className="mt-8 flex flex-wrap gap-3" aria-label="Secciones">
          <a href="#frases" className={`${tab} bg-[var(--texto)] text-[var(--fondo)]`}>Su voz</a>
          <a href="#libro" className={`${tab} border border-[var(--linea-fuerte)] hover:bg-[var(--bruma)]`}>El libro</a>
        </nav>

        {/* ── Su voz ──────────────────────────────────────────────────── */}
        <section id="frases" className="mt-14 scroll-mt-8" aria-labelledby="titulo-frases">
          <div className="border-b border-[var(--texto)] pb-4">
            <h2 id="titulo-frases" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">Su voz</h2>
            <p className="mt-3 max-w-prose text-[16px] leading-relaxed text-[var(--texto-suave)] font-light">
              {total > 0
                ? `Las frases que más suenan a ${n.como_le_dicen}, tal como las dijo. Tocá una para escucharla.`
                : "Sus mejores frases, en su voz, se están preparando. Volvé en un rato."}
            </p>
          </div>
          {publicables.map(({ capitulo, frases: lista }) => (
            <div key={capitulo.numero} className="mt-10">
              <h3 className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
                {capitulo.numero}. {capitulo.capitulo}
              </h3>
              <ul className="mt-3 flex flex-col gap-3">
                {lista.map((f) => (
                  <li key={f.id} id={`f-${f.id}`} className="scroll-mt-8 rounded-xl border border-[var(--linea)] p-4 sm:p-5">
                    <p className="text-[19px] leading-snug [font-family:var(--fuente-titulo)]">«{f.texto}»</p>
                    <div className="mt-3">
                      <ReproductorRespuesta src={`/api/voz/${token}/audio/${f.id}`} duracion={f.segundos} etiqueta={`la frase «${f.texto.slice(0, 40)}»`} />
                    </div>
                    <CompartirFrase texto={f.texto} nombre={n.como_le_dicen} ancla={`f-${f.id}`} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* ── El libro ────────────────────────────────────────────────── */}
        <section id="libro" className="mt-16 scroll-mt-8" aria-labelledby="titulo-libro">
          <div className="border-b border-[var(--texto)] pb-4">
            <h2 id="titulo-libro" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">El libro</h2>
          </div>
          {libroListo ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-[var(--linea)] bg-[var(--relieve)]">
              {/* El mismo libro.html de la fábrica que lee la familia, en un iframe sin permisos. */}
              <iframe
                src={`/api/voz/${token}/libro`}
                title={`El libro de ${n.nombre}`}
                sandbox=""
                className="h-[80vh] w-full bg-white"
              />
            </div>
          ) : (
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--texto-suave)] font-light">El libro se está armando. Volvé en un rato.</p>
          )}
        </section>

        <p className="mt-16 text-sm italic text-[var(--texto-menor)]">En cada familia hay un libro sin escribir.</p>
      </main>
    </div>
  );
}
