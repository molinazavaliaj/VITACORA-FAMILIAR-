import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenVoz } from "@/lib/token-libro";
import { frasesPublicables, leerFrases } from "@/lib/frases";
import { hayLibroOnline } from "@/lib/libro-online";
import { accesoVoz } from "@/lib/voz-acceso";
import { langDeIdioma, ruta } from "@/lib/idioma-web";
import { Toroide } from "../../marca";
import { conVar } from "../../_direccion/piezas";
import { COOKIE_IDIOMA, idiomaDelVisitante } from "../../_publico/idioma-visitante";
import { TEXTOS_VOZ } from "../../_textos/voz";
import { PaginaVozKids } from "./kids";
import { BotonPlay, BotonPortada, OndaFrase, ReproductorVoz } from "./reproductor-voz";
import { Capitulos, type CapituloVista } from "./capitulos";
import { CompartirPagina } from "./compartir";
import "../../_direccion/direccion.css";
import "./voz.css";

// La página del cliente (spec 2026-09-20-su-voz-design, "La página pública";
// rediseño 2026-10 con la maqueta SuVoz): una sola, sin login, con todo
// adentro. Arriba, su foto a pantalla entera y el botón que hace sonar su voz;
// después sus frases capítulo a capítulo, sus frases de siempre, el libro
// online, el bloque para compartir con la familia y el cierre a la portada.
// Dos entradas a la misma página: el código de la contratapa abre desde arriba;
// el QR de la sección de frases y el chip del marco caen en #frases. Cada frase
// tiene su ancla (#f-<id>) para mandar UNA por WhatsApp. El token es 'voz',
// distinto del de la muestra: el link que se reenvía para vender copias sigue
// mostrando solo la muestra.
//
// En el lenguaje de la web («la web es un libro»): tinta con tela, la hoja de
// papel crema para sus frases de siempre, Playfair. Sin violeta.

export default async function PaginaVoz({ params }: PageProps<"/voz/[token]">) {
  const { token } = await params;
  const datos = verificarTokenVoz(token);
  if (!datos) notFound();

  const admin = crearClienteServidor();
  const [acceso, frases, libroListo] = await Promise.all([
    accesoVoz(admin, datos.narradorId),
    leerFrases(admin, datos.narradorId),
    hayLibroOnline(admin, datos.narradorId),
  ]);
  // La casa: libro cerrado. Kids: desde listo.json, para que el padre la pruebe al revisar.
  if (!acceso.abre) notFound();
  if (acceso.producto === "kids") {
    return <PaginaVozKids token={token} apodo={acceso.apodo} idioma={acceso.idioma} publicables={frases ? frasesPublicables(frases) : []} libroListo={libroListo} />;
  }

  // Página pública, sin cuenta: el idioma (y con él el trato) sale de quien la abre.
  const idioma = idiomaDelVisitante(await headers(), (await cookies()).get(COOKIE_IDIOMA)?.value);
  const T = TEXTOS_VOZ[idioma];
  const nombre = acceso.nombre;
  const corto = acceso.comoLeDicen;

  const publicables = frases ? frasesPublicables(frases) : [];
  const capitulos: CapituloVista[] = publicables.map(({ capitulo, frases: lista }) => ({
    numero: capitulo.numero,
    titulo: capitulo.capitulo,
    frases: lista.map((f) => ({ id: f.id, texto: f.texto, segundos: f.segundos })),
  }));
  const todas = publicables.flatMap((p) => p.frases);
  const primera = todas[0];
  const capituloDePrimera = publicables[0]?.capitulo.capitulo;
  const minutos = Math.round(todas.reduce((s, f) => s + (f.segundos ?? 0), 0) / 60);
  // Sus frases de siempre: las que la fábrica sacó de «sus frases» (las que repetía), no las citas.
  const deSiempre = todas.filter((f) => f.origen === "sus-frases");

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina voz-pagina min-h-full text-[var(--dir-sobre-tinta)]">
      <ReproductorVoz token={token}>
        {/* ── Su foto, a pantalla entera ─────────────────────────────────── */}
        <section className="voz-portada dir-tinta" aria-label={nombre}>
          <div aria-hidden className="voz-portada-foto" style={conVar({ "--foto": `url("/api/voz/${token}/portada")` })} />
          <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
            <Link href={ruta(idioma, "/")} className="flex items-center gap-3 text-[var(--dir-sobre-tinta)]">
              <Toroide className="h-7 w-7" />
              <span className="text-[12px] font-medium uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.22em]">Vitácora</span>
            </Link>
            <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{T.privado}</span>
          </header>
          <div className="relative z-10 mt-auto flex flex-col items-center px-6 pb-[max(72px,12svh)] text-center">
            {primera ? (
              <BotonPortada id={primera.id} nombre={corto} idioma={idioma} />
            ) : (
              <>
                <p className="dir-titular text-[clamp(2.4rem,1.6rem+3vw,4.2rem)] leading-[1.02] text-white">{corto}</p>
                <p className="mt-5 max-w-[30ch] text-[16px] leading-relaxed text-white/80">{T.sinFrases}</p>
              </>
            )}
          </div>
        </section>

        <main className="dir-tinta relative">
          {/* ── Quién es y por dónde empezar ───────────────────────────────── */}
          <section id="empieza" className="voz-columna scroll-mt-4 flex flex-col gap-6 pb-12 pt-14 sm:pt-20">
            <div className="flex flex-col gap-3">
              <p className="dir-micro text-[var(--dir-dorado-claro)]">{T.etiqueta}</p>
              <h1 className="dir-titular text-[clamp(2.5rem,1.7rem+3.4vw,4.4rem)] leading-[1.04] text-white">{nombre}</h1>
              {todas.length > 0 ? <p className="dir-dato text-[var(--dir-sobre-tinta-suave)]">{T.datos(todas.length, minutos)}</p> : null}
            </div>

            {primera ? (
              <div className="flex flex-col gap-4 rounded-[22px] border border-[var(--dir-hilo-tinta)] bg-[#121210] p-5 sm:p-6">
                <p className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{T.empieza}</p>
                <div className="flex items-center gap-4">
                  <BotonPlay id={primera.id} texto={primera.texto} idioma={idioma} clase="h-[60px] w-[60px] voz-play--claro" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {capituloDePrimera ? <span className="truncate text-[15px] [font-family:var(--fuente-micro)]">{capituloDePrimera}</span> : null}
                    <OndaFrase id={primera.id} segundos={primera.segundos} barras={24} />
                  </div>
                </div>
                <p className="text-[18px] italic leading-[1.45] text-[#e4e0d6] [font-family:var(--fuente-titulo)] [text-wrap:pretty]">«{primera.texto}»</p>
              </div>
            ) : null}

            {libroListo ? (
              <a href="#libro" className="dir-boton dir-boton--lleno w-full sm:w-auto sm:self-start">
                {T.leer}
              </a>
            ) : null}
          </section>

          {/* ── Su voz, capítulo a capítulo ─────────────────────────────────── */}
          <section id="frases" className="voz-columna scroll-mt-4 border-t border-[var(--dir-hilo-tinta)] py-12 sm:py-16" aria-labelledby="titulo-frases">
            <p className="dir-micro text-[var(--dir-dorado-claro)]">{T.capEtiqueta}</p>
            <h2 id="titulo-frases" className="dir-titular mb-6 mt-2 text-[clamp(1.8rem,1.4rem+1.6vw,2.6rem)] leading-[1.1] text-white">
              {T.capTitulo}
            </h2>
            {capitulos.length > 0 ? (
              <Capitulos capitulos={capitulos} nombre={corto} idioma={idioma} />
            ) : (
              <p className="dir-parrafo">{T.sinFrases}</p>
            )}
          </section>

          {/* ── Sus frases de siempre: la hoja de papel ─────────────────────── */}
          {deSiempre.length > 0 ? (
            <section className="dir-deckle dir-hoja relative text-[var(--dir-sobre-papel)]" aria-labelledby="titulo-siempre">
              <div className="voz-columna pb-14 pt-14 sm:pt-16">
                <h2 id="titulo-siempre" className="dir-micro text-[var(--dir-dorado)]">
                  {T.frasesDeSiempre}
                </h2>
              </div>
              <ul className="voz-carrusel pb-16">
                {deSiempre.map((f) => (
                  <li key={f.id} className="voz-tarjeta flex flex-col justify-between gap-6 rounded-[18px] border border-[var(--dir-hilo-papel)] bg-[var(--dir-papel-pagina)] p-6">
                    <p className="text-[clamp(1.3rem,1.15rem+0.6vw,1.6rem)] italic leading-[1.3] [font-family:var(--fuente-titulo)] font-medium [text-wrap:pretty]">«{f.texto}»</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="dir-dato text-[var(--dir-sobre-papel-suave)]">{corto}</span>
                      <BotonPlay id={f.id} texto={f.texto} idioma={idioma} clase="h-11 w-11 voz-play--tinta" />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ── El libro ─────────────────────────────────────────────────── */}
          <section id="libro" className="voz-columna voz-columna--ancha scroll-mt-4 border-t border-[var(--dir-hilo-tinta)] py-12 sm:py-16" aria-labelledby="titulo-libro">
            <h2 id="titulo-libro" className="dir-titular text-[clamp(1.8rem,1.4rem+1.6vw,2.6rem)] leading-[1.1] text-white">
              {T.libro}
            </h2>
            {libroListo ? (
              <div className="mt-6 overflow-hidden rounded-[18px] border border-[var(--dir-hilo-tinta)]">
                {/* El mismo libro.html de la fábrica que lee la familia, en un iframe sin permisos. */}
                <iframe src={`/api/voz/${token}/libro`} title={`${T.libro} · ${nombre}`} sandbox="" className="h-[80vh] w-full bg-white" />
              </div>
            ) : (
              <p className="dir-parrafo mt-4">{T.libroNoEsta}</p>
            )}
          </section>

          {/* ── Para la familia ──────────────────────────────────────────── */}
          <section className="voz-columna flex flex-col gap-4 border-t border-[var(--dir-hilo-tinta)] py-12 sm:py-16">
            <h2 className="dir-micro text-[var(--dir-dorado-claro)]">{T.familiaEtiqueta}</h2>
            <p className="max-w-[46ch] text-[17px] font-light leading-[1.6] text-[#cfcbc1]">{T.familiaTexto}</p>
            <CompartirPagina nombre={corto} idioma={idioma} />
          </section>

          {/* ── El cierre ────────────────────────────────────────────────── */}
          <footer className="voz-columna flex flex-col items-center gap-5 border-t border-[var(--dir-hilo-tinta)] pb-16 pt-14 text-center">
            <p className="dir-pie text-[var(--dir-sobre-tinta-suave)]">{T.cierre}</p>
            <Link href={ruta(idioma, "/")} className="dir-boton dir-boton--lleno dir-boton--envuelve">
              {T.cierreBoton}
            </Link>
            <span className="dir-dato text-[12px] text-[#7d7970]">{T.hechoCon}</span>
          </footer>
        </main>
      </ReproductorVoz>
    </div>
  );
}
