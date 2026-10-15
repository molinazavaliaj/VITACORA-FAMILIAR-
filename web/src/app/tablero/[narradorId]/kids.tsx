import type { NarradorPanel } from "@/lib/panel";
import {
  arranco,
  capituloActual,
  fichaVigente,
  preguntasAbiertas,
  terminoKids,
  tituloCapitulo,
  valoresDelPanel,
  type CapituloKids,
  type FilaKids,
  type LibroKids,
} from "@/lib/kids-panel";
import { ReproductorRespuesta } from "../reproductor";
import { fechaCorta } from "../ui";
import { estadoKids, errorDelMotor, LEE_TODO, PANEL_GUIA, PANEL_KIDS } from "../../_textos/panel-kids";
import { AprobarLibro, CorregirNombre, HoraYTemas, PreguntasDelPadre } from "./kids-acciones";

// El panel de Vitácora Kids para los padres (K5, 15/10). Lo ve solo quien
// compró (la página lo cuida). Sale en /tablero/<id> cuando el narrador tiene
// fila en `kids_v2`, en lugar del de biografía (flujo-vigente §12):
//   - lo que cuenta, por capítulo y pregunta, con audio, lo que dijo y fotos;
//     también lo del sobre cerrado (la cápsula), marcado;
//   - al lado de cada respuesta, corregir cómo se escribe un nombre;
//   - sus preguntas para el libro (hasta 3, hasta que empieza la cuarta parte);
//   - la hora y los temas que no se tocan;
//   - cuando la fábrica dejó listo.json, el libro escrito para ver, descargar
//     y aprobar (decisión 9). Antes, esa parte no aparece.
// Con la paleta de Kids (panel.css, data-producto="kids"). En el celular, una
// columna: lo que se cambia arriba, después lo que cuenta.

const T = PANEL_KIDS;

export function PanelKids({
  n,
  fila,
  capitulos,
  libro = null,
}: {
  n: Pick<NarradorPanel, "id" | "nombre" | "como_le_dicen" | "estado">;
  fila: FilaKids;
  capitulos: CapituloKids[];
  /** El libro escrito: null mientras no haya listo.json. */
  libro?: LibroKids | null;
}) {
  const ficha = fichaVigente(fila);
  const apodo = n.como_le_dicen?.trim() || ficha.apodo;
  const capitulo = capituloActual(fila);
  const termino = terminoKids(fila);
  const abiertas = preguntasAbiertas(fila);
  const valores = valoresDelPanel(fila);
  const pendiente = fila.cambios_panel;
  const estado = estadoKids({ estado: n.estado, canal: fila.canal, apodo, arranco: arranco(fila), capitulo, titulo: tituloCapitulo(capitulo), termino });

  return (
    <div data-producto="kids" className="pnl-marco mx-auto w-full max-w-[1240px] px-4 pb-20 pt-8 sm:px-8 md:pt-12">
      <header className="flex flex-col gap-3">
        <p className="pnl-micro">{T.etiqueta}</p>
        <h1 className="pnl-titular">{T.titulo(apodo)}</h1>
        <p className="pnl-parrafo">{estado}</p>
        <Partes actual={termino ? 6 : capitulo} />
        <p className="pnl-dato mt-1">{LEE_TODO}</p>
      </header>

      {fila.cambios_error ? (
        <p role="alert" className="mt-8 rounded-md border border-[var(--alerta)] bg-[var(--alerta-fondo)] px-4 py-3 text-[15px] leading-snug text-[var(--alerta)]">
          {errorDelMotor(fila.cambios_error)}
        </p>
      ) : null}

      {libro ? <TuLibro narradorId={n.id} apodo={apodo} libro={libro} /> : null}

      <div className="mt-10 grid grid-cols-1 gap-x-14 gap-y-10 md:mt-14 lg:grid-cols-[minmax(0,1fr)_380px]">
        <aside className="flex min-w-0 flex-col gap-8 lg:col-start-2 lg:row-start-1">
          <section id="tus-preguntas" aria-labelledby="titulo-preguntas" className="pnl-hoja scroll-mt-24 p-5 sm:p-6">
            <h2 id="titulo-preguntas" className="pnl-h3">{PANEL_GUIA.titulo}</h2>
            {abiertas ? (
              <>
                <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-[var(--texto-suave)]">
                  <p>{PANEL_GUIA.p1(apodo)}</p>
                  <p>{PANEL_GUIA.p2}</p>
                  <p>{PANEL_GUIA.p3}</p>
                  <p>{PANEL_GUIA.p4(apodo)}</p>
                </div>
                <div className="mt-4">
                  <p className="pnl-micro">{T.preguntas.ejemplos}</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {PANEL_GUIA.ejemplos.map((e) => (
                      <li key={e} className="pnl-renglon italic">{e}</li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 text-[14px] leading-snug text-[var(--texto-menor)]">{PANEL_GUIA.p5}</p>
                <div className="mt-6">
                  <PreguntasDelPadre narradorId={n.id} preguntas={valores.preguntasPadre} quienRegala={ficha.quienRegala} />
                </div>
                {pendiente?.preguntasPadre ? <p className="mt-3 text-[13.5px] text-[var(--texto-menor)]">{T.pendiente}</p> : null}
              </>
            ) : (
              <div className="mt-3 flex flex-col gap-4">
                <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">{termino ? T.errores.terminado : T.preguntas.cerradas}</p>
                {ficha.preguntasPadre.length === 0 ? (
                  <p className="text-[14px] text-[var(--texto-menor)]">{T.preguntas.ninguna}</p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {ficha.preguntasPadre.map((p, i) => (
                      <li key={i} className="border-t border-[var(--linea)] pt-3">
                        <p className="pnl-micro">{T.preguntas.n(i + 1)}</p>
                        <p className="mt-1 text-[15px] leading-relaxed text-[var(--texto)]">{p.texto}</p>
                        <p className="mt-1 text-[13px] text-[var(--texto-menor)]">{p.conLinea ? T.preguntas.conLinea(p.quien ?? ficha.quienRegala) : T.preguntas.sinLinea}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </section>

          {!termino ? (
            <section aria-labelledby="titulo-ajustes" className="pnl-hoja p-5 sm:p-6">
              <h2 id="titulo-ajustes" className="pnl-h3">{T.ajustes.titulo}</h2>
              <div className="mt-5">
                <HoraYTemas narradorId={n.id} hora={valores.hora} temasSacados={valores.temasSacados} />
              </div>
              {pendiente && (pendiente.hora !== undefined || pendiente.temasSacados !== undefined) ? (
                <p className="mt-3 text-[13.5px] text-[var(--texto-menor)]">{T.pendiente}</p>
              ) : null}
            </section>
          ) : null}
        </aside>

        <section id="lo-contado" aria-labelledby="titulo-cuenta" className="pnl-cuerpo min-w-0 scroll-mt-24 lg:col-start-1 lg:row-start-1">
          <h2 id="titulo-cuenta" className="pnl-h2">{T.loQueCuenta}</h2>
          {capitulos.length === 0 ? <p className="pnl-parrafo mt-4">{T.vacio(apodo)}</p> : null}
          <div className="mt-8 flex flex-col gap-14">
            {capitulos.map((c) => (
              <Capitulo key={c.n} c={c} narradorId={n.id} apodo={apodo} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/** El libro ya escrito: verlo, bajarlo y aprobarlo (una sola vez). */
function TuLibro({ narradorId, apodo, libro }: { narradorId: string; apodo: string; libro: LibroKids }) {
  const L = T.libro;
  const url = (archivo: "libro" | "sobre", descargar = false) =>
    `/api/kids/libro?narrador=${encodeURIComponent(narradorId)}&archivo=${archivo}${descargar ? "&descargar=1" : ""}`;
  return (
    <section id="tu-libro" aria-labelledby="titulo-libro" data-libro={libro.aprobadoAt ? "aprobado" : "por-aprobar"} className="pnl-hoja mt-10 scroll-mt-24 p-5 sm:p-6 md:mt-14">
      <h2 id="titulo-libro" className="pnl-h3">{L.titulo}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--texto-suave)]">{L.texto(apodo)}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={url("libro")} target="_blank" rel="noopener" className="pnl-boton pnl-boton--hilo">{L.ver}</a>
        <a href={url("libro", true)} className="pnl-boton pnl-boton--hilo">{L.bajar}</a>
      </div>
      <p className="mt-5 text-[14.5px] leading-snug text-[var(--texto-suave)]">{L.sobre}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <a href={url("sobre")} target="_blank" rel="noopener" className="pnl-boton pnl-boton--hilo">{L.verSobre}</a>
        <a href={url("sobre", true)} className="pnl-boton pnl-boton--hilo">{L.bajarSobre}</a>
      </div>
      <div className="mt-6 border-t border-[var(--linea)] pt-5">
        {libro.aprobadoAt ? (
          <p role="status" className="text-[15px] leading-relaxed text-[var(--texto)]">{L.aprobado}</p>
        ) : (
          <>
            <p className="mb-4 text-[14px] leading-snug text-[var(--texto-menor)]">{L.algoMal}</p>
            <AprobarLibro narradorId={narradorId} />
          </>
        )}
      </div>
    </section>
  );
}

/** Las cinco partes como hilos: las que pasaron llenas, la actual a medias. */
function Partes({ actual }: { actual: number }) {
  return (
    <ol className="pnl-linea mt-2 max-w-[640px]" style={{ ["--n" as string]: 5 }}>
      {[1, 2, 3, 4, 5].map((p, i) => (
        <li key={p} className="pnl-paso" data-estado={p < actual ? "hecho" : p === actual ? "actual" : "falta"} style={{ ["--i" as string]: i }}>
          <span className="pnl-paso-hilo" aria-hidden>
            <span />
          </span>
          <span className="pnl-paso-nombre">{tituloCapitulo(p)}</span>
        </li>
      ))}
    </ol>
  );
}

function Capitulo({ c, narradorId, apodo }: { c: CapituloKids; narradorId: string; apodo: string }) {
  const id = `parte-${c.n}`;
  return (
    <section aria-labelledby={id}>
      <div className="border-b border-[var(--texto)] pb-4">
        {c.n > 0 ? <p className="pnl-micro">{c.capsula ? T.sobre : T.parte(c.n)}</p> : null}
        <h3 id={id} className="mt-1 text-2xl font-medium leading-tight [font-family:var(--fuente-titulo)]">
          {c.n > 0 ? c.titulo ?? T.parte(c.n) : T.antes}
        </h3>
        {c.capsula ? <p className="mt-2 text-[14.5px] leading-snug text-[var(--texto-suave)]">{T.sobreTexto(apodo)}</p> : null}
      </div>
      <div className="mt-6 flex flex-col gap-4">
        {c.preguntas.map((p) => (
          <article key={p.clave} data-clave={p.clave} className={`flex flex-col gap-4 rounded-xl border p-4 sm:px-5 sm:py-5 ${c.capsula ? "border-dashed border-[var(--linea-fuerte)]" : "border-[var(--linea)]"}`}>
            {p.texto || p.padre ? (
              <h4 className="text-[16.5px] font-medium leading-[1.4] [font-family:var(--fuente-titulo)]">{p.texto ?? T.tuPregunta(p.padre as number)}</h4>
            ) : null}
            {p.entradas.map((e, j) => (
              <div key={e.id} className={`flex flex-col gap-3 ${j > 0 ? "border-t border-[var(--linea)] pt-4" : ""}`}>
                {e.boton ? <p className="pnl-dato">{T.toco(e.boton)}</p> : null}
                {e.fotos.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {e.fotos.map((f) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={f} src={`/api/fotos/${f}`} alt={T.fotoAlt(apodo)} loading="lazy" className="h-auto max-h-80 w-full max-w-[320px] rounded-md object-cover sm:w-auto" />
                    ))}
                  </div>
                ) : null}
                {e.texto ? (
                  <p className="text-[15.5px] leading-[1.7] text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)] font-light">{e.texto}</p>
                ) : e.transcribiendo ? (
                  <p className="text-sm text-[var(--texto-menor)]">{T.transcribiendo}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{fechaCorta(e.recibidoAt)}</span>
                  {e.audio ? <ReproductorRespuesta src={`/api/audio/${e.id}`} duracion={e.duracion} etiqueta={T.escuchar} /> : null}
                </div>
                {e.texto ? <CorregirNombre narradorId={narradorId} respuestaId={e.id} correcciones={e.correcciones} /> : null}
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
