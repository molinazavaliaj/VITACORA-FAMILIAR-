import { PUEDE, type Rol } from "@/lib/panel";
import type { BloqueHistoriaV3 } from "@/lib/v3";
import { BannerAlertaSilencio, CierreAnticipado } from "../acciones";
import { Ajustes, SubirFoto, SumarPreguntaV3 } from "./preguntas/acciones";
import { GaleriaCapitulo, type FotoVista } from "./fotos";
import { Compartir, type InvitadoVista } from "./compartir";
import { CerrarEdicion, ReabrirEdicion } from "./cerrar-edicion";
import { Riel, type HistoriaRiel } from "../riel";
import { ReproductorRespuesta } from "../reproductor";
import { Etiqueta, ProximoPaso, Titulo, estadoEnHumano, fechaCorta, formatearDuracion, tituloHistoria } from "../ui";
import type { Ritmo } from "@/lib/guion";

// La historia de un narrador V3 (entrevista por WhatsApp, 10/10). No hay guion de 30 ni capítulos que
// ordenar: la entrevista va por bloques y lo que viene lo decide el biógrafo. Se muestra lo que se le
// preguntó (como le llegó) y lo que contestó, en orden, con su audio. Sin cantidades: no hay un total.
// La familia puede sumar preguntas suyas (le llegan antes de la foto del final) y fotos al álbum.

const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];
const ESTADOS_QUE_PERMITEN_CIERRE = ["activo", "pausado"];
const MINIMO_RESPUESTAS_CIERRE_ANTICIPADO = 10;

type Narrador = { id: string; nombre: string; como_le_dicen: string; estado: string; alerta_silencio: boolean };

export function HistoriaV3({
  n, rol, propia, bloques, fotos, usuarioId, historiasRiel, aprobado, historiaCerrada, linkPublico, invitados, ritmo, horario, alFinal,
}: {
  /** Ya llegó a la foto del final (FO1): las preguntas de la familia ya no le llegan. */
  alFinal: boolean;
  n: Narrador;
  rol: Rol;
  propia: boolean;
  bloques: BloqueHistoriaV3[];
  fotos: FotoVista[];
  usuarioId: string;
  historiasRiel: HistoriaRiel[];
  aprobado: boolean;
  historiaCerrada: boolean;
  linkPublico: string | null;
  invitados: InvitadoVista[];
  ritmo: Ritmo;
  horario?: { hora: string; zona: string };
}) {
  const cerrado = ESTADOS_CERRADOS.includes(n.estado);
  const preguntas = bloques.flatMap((b) => b.preguntas);
  // Para el cierre anticipado: solo lo que contó de verdad (con respuesta a la vista o reservado).
  const contestadas = preguntas.filter((p) => p.respuestas.length > 0 || p.reservada).length;
  const segundosDeVoz = preguntas.flatMap((p) => p.respuestas).reduce((acc, r) => acc + (r.duracion ?? 0), 0);
  const puedeSumar = !cerrado && !alFinal && PUEDE.agregarPreguntasYFotos(rol);
  const puedeAgregarFotos = !aprobado && !historiaCerrada && PUEDE.agregarPreguntasYFotos(rol);
  const puedeCerrarAnticipado = rol === "duena" && ESTADOS_QUE_PERMITEN_CIERRE.includes(n.estado) && contestadas >= MINIMO_RESPUESTAS_CIERRE_ANTICIPADO;
  const suya = propia ? "tu" : "su";

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-6 py-8 md:px-10 md:py-10">
      <Riel historias={historiasRiel} actual={n.id} />

      <div className="min-w-0 flex-1">
        {n.alerta_silencio && rol === "duena" ? (
          <div className="mb-8">
            <BannerAlertaSilencio narradorId={n.id} comoLeDicen={n.como_le_dicen} />
          </div>
        ) : null}

        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 md:pr-14">
          <div className="min-w-0">
            <Etiqueta>{rol === "invitado" ? "Te invitaron a esta historia" : "Historia"}</Etiqueta>
            <div className="mt-1">
              <Titulo>{tituloHistoria(n.nombre, propia)}</Titulo>
            </div>
            <p className="mt-2 text-[15px] text-[var(--texto-suave)]">{estadoEnHumano(n.estado, propia)}</p>
            {segundosDeVoz > 0 ? (
              <p className="mt-1 text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                <span className="text-[var(--texto)] tabular-nums">{formatearDuracion(segundosDeVoz)}</span> de {suya} voz
              </p>
            ) : null}
          </div>
          <div className={`flex flex-wrap items-center gap-2 ${historiaCerrada && !aprobado ? "opacity-50" : ""}`}>
            {puedeAgregarFotos ? (
              <SubirFoto narradorId={n.id} capitulos={[]} variante="barra">Agregar fotos</SubirFoto>
            ) : null}
            {PUEDE.invitar(rol) ? (
              <span className={historiaCerrada && !aprobado ? "pointer-events-none" : ""} aria-disabled={historiaCerrada && !aprobado ? true : undefined}>
                <Compartir narradorId={n.id} nombre={n.nombre} cerrado={cerrado} aprobado={aprobado} linkPublico={linkPublico} invitados={invitados} />
              </span>
            ) : null}
            {cerrado && !aprobado && !historiaCerrada && PUEDE.cerrarLibro(rol) ? <CerrarEdicion narradorId={n.id} propia={propia} /> : null}
          </div>
        </header>

        {cerrado && (historiaCerrada || aprobado || !PUEDE.cerrarLibro(rol)) ? (
          <div className="mt-8 flex flex-col gap-3">
            <ProximoPaso href={aprobado || !PUEDE.cerrarLibro(rol) ? `/tablero/${n.id}/leer` : `/tablero/${n.id}/libro`}>
              {aprobado
                ? (propia ? "Leer tu libro y escuchar tu voz" : "Leer su libro y escuchar su voz")
                : PUEDE.cerrarLibro(rol)
                  ? (propia ? "Elegí la tapa y encargá tu libro" : "Elegí la tapa y encargá su libro")
                  : "Leer su libro"}
            </ProximoPaso>
            {historiaCerrada && !aprobado && PUEDE.cerrarLibro(rol) ? (
              <div className="flex items-center gap-3 text-[13px] text-[var(--texto-menor)]">
                <span>Edición cerrada. Las fotos se siguen sumando en Encargar libro.</span>
                <ReabrirEdicion narradorId={n.id} />
              </div>
            ) : null}
          </div>
        ) : null}

        {puedeSumar ? (
          <div className="mt-8">
            <SumarPreguntaV3 narradorId={n.id} propia={propia} />
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-14">
          {bloques.length === 0 ? (
            <p className="text-[15px] text-[var(--texto-suave)]">
              {propia ? "Cuando contestes la primera pregunta, lo que cuentes aparece acá." : "Cuando conteste la primera pregunta, lo que cuente aparece acá."}
            </p>
          ) : null}
          {bloques.map((b, i) => (
            <section key={`${b.nombre ?? "antes"}-${i}`} aria-labelledby={`bloque-${i}`}>
              <div className="border-b border-[var(--texto)] pb-4">
                <h2 id={`bloque-${i}`} className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">
                  {b.nombre ?? (propia ? "Lo primero que contaste" : "Lo primero que contó")}
                </h2>
              </div>
              <div className="mt-6 flex flex-col gap-4">
                {b.preguntas.map((p) => {
                  if (p.estado !== "contestada" || p.respuestas.length === 0) {
                    return (
                      <div key={p.clave} className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--linea-fuerte)] px-4 py-3.5 text-[var(--texto-menor)] sm:px-5">
                        <p className="text-[14.5px] leading-[1.55] [font-family:var(--fuente-cuerpo)] font-light">{p.pregunta}</p>
                        <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">
                          {p.reservada
                            ? (propia ? "pediste que esto no vaya al libro" : "pidió que esto no vaya al libro")
                            : p.estado === "esperando"
                              ? (propia ? "esperando tu respuesta" : "esperando su respuesta")
                              : p.estado === "contestada"
                                ? "contestada"
                                : "sin respuesta"}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <article key={p.clave} className="flex flex-col gap-3 rounded-xl border border-[var(--linea)] p-4 sm:px-5 sm:py-5">
                      <h3 className="text-[16.5px] font-medium leading-[1.4] [font-family:var(--fuente-titulo)]">{p.pregunta}</h3>
                      {p.respuestas.map((r, j) => (
                        <div key={r.id} className={`flex flex-col gap-2 ${j > 0 ? "border-t border-[var(--linea)] pt-3" : ""}`}>
                          {r.texto ? (
                            <p className="text-[15.5px] leading-[1.7] text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)] font-light">{r.texto}</p>
                          ) : (
                            <p className="text-sm text-[var(--texto-menor)]">Estamos transcribiendo el audio…</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{fechaCorta(r.recibidoAt)}</span>
                            {r.audio ? <ReproductorRespuesta src={`/api/audio/${r.id}`} duracion={r.duracion} etiqueta={p.pregunta.slice(0, 60)} /> : null}
                          </div>
                        </div>
                      ))}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {fotos.length > 0 || puedeAgregarFotos ? (
            <section aria-labelledby="fotos-del-libro">
              <div className="border-b border-[var(--linea)] pb-4">
                <h2 id="fotos-del-libro" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">El álbum</h2>
              </div>
              <GaleriaCapitulo fotos={fotos} usuarioId={usuarioId} esDuena={rol === "duena"} />
              {puedeAgregarFotos ? (
                <div className="mt-5">
                  <SubirFoto narradorId={n.id} capitulos={[]}>+ Agregar una foto al álbum</SubirFoto>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        {!cerrado && PUEDE.cambiarRitmo(rol) && horario ? (
          <section className="mt-16 border-t border-[var(--linea)] pt-10">
            <Etiqueta>Ajustes de la entrevista</Etiqueta>
            <div className="mt-6">
              <Ajustes narradorId={n.id} ritmo={ritmo} evitar="" horario={horario} propia={propia} v3 />
            </div>
          </section>
        ) : null}

        {puedeCerrarAnticipado ? (
          <div className="mt-8">
            <CierreAnticipado narradorId={n.id} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
