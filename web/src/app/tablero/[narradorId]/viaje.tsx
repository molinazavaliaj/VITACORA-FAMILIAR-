import type { ReactNode } from "react";
import { PUEDE, type Rol } from "@/lib/panel";
import { capitulosDelViaje, diaDeHoy, diasDelViaje, fechaDelDia, SIN_ETAPA, type Viaje } from "@/lib/viaje";
import { BannerAlertaSilencio, CierreAnticipado } from "../acciones";
import { Ajustes, SubirFoto } from "./preguntas/acciones";
import { GaleriaCapitulo, type FotoVista } from "./fotos";
import { Compartir, type InvitadoVista } from "./compartir";
import { CerrarEdicion, ReabrirEdicion } from "./cerrar-edicion";
import { EtapasDelViaje } from "./etapas";
import { AngulosDelViaje } from "./angulos";
import { Riel, type CapituloRiel, type HistoriaRiel } from "../riel";
import { ReproductorRespuesta } from "../reproductor";
import { Etiqueta, ProximoPaso, Respuesta, Titulo, estadoEnHumano, formatearDuracion, type RespuestaVista } from "../ui";
import type { Ritmo } from "@/lib/guion";

// La historia en modo viaje (3t.19, docs/vitacora-de-viaje.md). No es el guion
// del Familiar: los capítulos son las etapas (ciudad + fechas, calculadas desde
// contexto.viaje, así se ve bien aunque el bot todavía no haya creado el guion),
// cada una con su álbum y las noches ya contadas. No hay lista de preguntas por
// venir: en viaje la pregunta nace cada noche (itinerario + ángulo + lo de
// ayer), y acá se muestra la que de verdad le mandó el bot. Pensado para el
// celular primero: el viajero lo abre en el viaje.
//
// ⚠️ Textos a revisar por Naza (regla de la casa; roadmap mié 23/09).

const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];
const ESTADOS_QUE_PERMITEN_CIERRE = ["activo", "pausado"];
const MINIMO_RESPUESTAS_CIERRE_ANTICIPADO = 10;

const botonBarra = "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 [font-family:var(--fuente-micro)] [touch-action:manipulation]";
const botonBarraSec = `${botonBarra} border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--hueco)] focus-visible:outline-[var(--texto)]`;
const micro = "text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]";

/** "22 de septiembre" desde YYYY-MM-DD, sin que la zona del servidor corra el día. */
function fechaLarga(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "long", timeZone: "UTC" });
}
/** "20 – 23 sep" / "24 sep en adelante" para la cabecera de una etapa. */
function rangoCorto(desde?: string, hasta?: string): string | null {
  const f = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "");
  if (desde && hasta) return `${f(desde)} – ${f(hasta)}`;
  if (desde) return `${f(desde)} en adelante`;
  return null;
}

export type NarradorViaje = {
  id: string;
  nombre: string;
  como_le_dicen: string;
  estado: string;
  dia_actual: number;
  alerta_silencio: boolean;
};

export function HistoriaViaje({
  n,
  rol,
  viaje,
  zonaHoraria,
  respuestas,
  fotos,
  preguntasEnviadas,
  repreguntasEnviadas,
  usuarioId,
  historiasRiel,
  aprobado,
  historiaCerrada,
  linkPublico,
  invitados,
  ritmo,
  evitar,
  horario,
}: {
  n: NarradorViaje;
  rol: Rol;
  viaje: Viaje;
  zonaHoraria: string;
  respuestas: RespuestaVista[];
  fotos: FotoVista[];
  preguntasEnviadas: Record<string, string>;
  repreguntasEnviadas: Record<string, string>;
  usuarioId: string;
  historiasRiel: HistoriaRiel[];
  aprobado: boolean;
  historiaCerrada: boolean;
  linkPublico: string | null;
  invitados: InvitadoVista[];
  ritmo: Ritmo;
  evitar: string;
  horario?: { hora: string; zona: string };
}) {
  const duena = rol === "duena";
  const cerrado = ESTADOS_CERRADOS.includes(n.estado);
  const noches = diasDelViaje(viaje);
  const hoy = diaDeHoy(viaje, new Date(), zonaHoraria);
  const capitulos = capitulosDelViaje(viaje);

  const respuestasPorOrden = new Map<number, RespuestaVista[]>();
  for (const r of respuestas) {
    const lista = respuestasPorOrden.get(r.pregunta_orden) ?? [];
    lista.push(r);
    respuestasPorOrden.set(r.pregunta_orden, lista);
  }
  const contadas = [...respuestasPorOrden.keys()].filter((o) => o >= 1 && o <= noches).length;
  const segundosDeVoz = respuestas.reduce((acc, r) => acc + (r.duracion_segundos ?? 0), 0);
  // Lo que cayó fuera de las noches (la pregunta de cierre al volver): va al final.
  const alVolver = [...respuestasPorOrden.keys()].filter((o) => o > noches).sort((a, b) => a - b);

  // Las fotos: por etapa; las sin etapa (el bot guarda "Por definir" como null) van a esa sección.
  const fotosPorCapitulo = new Map<string, FotoVista[]>();
  for (const f of fotos) {
    const clave = f.capitulo ?? SIN_ETAPA;
    const lista = fotosPorCapitulo.get(clave) ?? [];
    lista.push(f);
    fotosPorCapitulo.set(clave, lista);
  }
  // "Por definir" existe si alguna noche o alguna foto no tiene etapa.
  const secciones = capitulos.some((c) => c.nombre === SIN_ETAPA) || fotosPorCapitulo.has(SIN_ETAPA)
    ? capitulos.some((c) => c.nombre === SIN_ETAPA) ? capitulos : [...capitulos, { nombre: SIN_ETAPA, dias: [] }]
    : capitulos;
  const etapasParaFotos = viaje.etapas.map((e) => e.nombre);

  const capitulosRiel: CapituloRiel[] = secciones.map((c) => ({
    nombre: c.nombre,
    contestadas: c.dias.filter((d) => respuestasPorOrden.has(d)).length,
    total: c.dias.length,
  }));
  // Antes de que el bot arranque (pago sin confirmar, invitación sin aceptar) y
  // después de cerrar, no hay "hoy" que marcar.
  const arranco = !["pendiente_pago", "invitado"].includes(n.estado);
  const capituloDeHoy = hoy && arranco && !cerrado ? secciones.find((c) => c.dias.includes(hoy))?.nombre : null;

  const puedeAgregarFotos = !aprobado && !historiaCerrada && PUEDE.agregarPreguntasYFotos(rol);
  const puedeCerrarAnticipado = duena && ESTADOS_QUE_PERMITEN_CIERRE.includes(n.estado) && contadas >= MINIMO_RESPUESTAS_CIERRE_ANTICIPADO;

  // Dónde está hoy, en una línea.
  let estadoLinea: string;
  if (cerrado || !arranco) estadoLinea = estadoEnHumano(n.estado, duena);
  else if (hoy) estadoLinea = `Día ${hoy} de ${noches}${capituloDeHoy && capituloDeHoy !== SIN_ETAPA ? ` · ${capituloDeHoy}` : ""}`;
  else if (Date.parse(`${viaje.salida}T00:00:00Z`) > Date.now()) estadoLinea = `${duena ? "Salís" : "Sale"} el ${fechaLarga(viaje.salida)}. ${noches} ${noches === 1 ? "noche" : "noches"} de viaje.`;
  else estadoLinea = duena ? "Ya volviste. El biógrafo te hace la última pregunta." : "Ya volvió. El biógrafo le hace la última pregunta.";

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-6 py-8 md:px-10 md:py-10">
      <Riel historias={historiasRiel} actual={n.id} capitulos={capitulosRiel} respondidas={contadas} total={noches} segundosDeVoz={segundosDeVoz} />

      <div className="min-w-0 flex-1">
        {n.alerta_silencio && duena ? (
          <div className="mb-8">
            <BannerAlertaSilencio narradorId={n.id} comoLeDicen={n.como_le_dicen} />
          </div>
        ) : null}

        {/* ── Cabecera ──────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 md:pr-14">
          <div className="min-w-0">
            <Etiqueta>{rol === "invitado" ? "Te invitaron a este viaje" : "Vitácora de viaje"}</Etiqueta>
            <div className="mt-1">
              <Titulo>{duena ? "Tu viaje" : `El viaje de ${n.nombre}`}</Titulo>
            </div>
            <p className="mt-2 text-[15px] text-[var(--texto-suave)]">
              Del {fechaLarga(viaje.salida)} al {fechaLarga(viaje.vuelta)} · {estadoLinea}
            </p>
          </div>
          <div className={`flex flex-wrap items-center gap-2 ${historiaCerrada && !aprobado ? "opacity-50" : ""}`}>
            {puedeAgregarFotos ? (
              <SubirFoto narradorId={n.id} capitulos={etapasParaFotos} variante="barra">
                <IconoFoto />
                Agregar fotos
              </SubirFoto>
            ) : historiaCerrada && !aprobado && PUEDE.agregarPreguntasYFotos(rol) ? (
              <span aria-disabled className={`${botonBarraSec} cursor-not-allowed`} title="La edición está cerrada. Las fotos siguen en Encargar libro.">
                <IconoFoto />
                Agregar fotos
              </span>
            ) : null}
            {PUEDE.invitar(rol) ? (
              <span className={historiaCerrada && !aprobado ? "pointer-events-none" : ""} aria-disabled={historiaCerrada && !aprobado ? true : undefined}>
                <Compartir narradorId={n.id} nombre={n.nombre} cerrado={cerrado} aprobado={aprobado} linkPublico={linkPublico} invitados={invitados} />
              </span>
            ) : null}
            {cerrado && !aprobado && !historiaCerrada && PUEDE.cerrarLibro(rol) ? <CerrarEdicion narradorId={n.id} propia={duena} /> : null}
          </div>
        </header>

        {/* ── En el celular: progreso + las etapas en pastillas ───────────── */}
        <div className="mt-6 lg:hidden">
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)] tabular-nums">{contadas} de {noches} noches contadas</p>
            {segundosDeVoz > 0 ? (
              <p className="text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                <span className="text-[var(--texto)] tabular-nums">{formatearDuracion(segundosDeVoz)}</span> {duena ? "de tu voz" : "de su voz"}
              </p>
            ) : null}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--hueco)]">
            <div className="h-full rounded-full bg-[var(--texto)]" style={{ width: `${noches > 0 ? Math.min(100, Math.round((contadas / noches) * 100)) : 0}%` }} />
          </div>
          <nav aria-label="Etapas" className="-mx-6 mt-5 overflow-x-auto px-6 md:mx-0 md:px-0">
            <ol className="flex gap-2 pb-1">
              {capitulosRiel.map((cap, i) => {
                const completo = cap.total > 0 && cap.contestadas === cap.total;
                const esHoy = cap.nombre === capituloDeHoy;
                return (
                  <li key={cap.nombre} className="shrink-0">
                    <a
                      href={`#etapa-${i}`}
                      aria-current={esHoy ? "location" : undefined}
                      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors hover:border-[var(--texto)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] [font-family:var(--fuente-micro)] ${
                        completo ? "border-[var(--texto)] bg-[var(--texto)] text-[var(--fondo)]" : cap.contestadas > 0 || esHoy ? "border-[var(--texto)]" : "border-[var(--linea)] text-[var(--texto-menor)]"
                      }`}
                    >
                      <span className="tabular-nums opacity-70">{i + 1}</span>
                      {cap.nombre}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Terminó el viaje: el paso siguiente (igual que en el Familiar). */}
        {cerrado && (historiaCerrada || aprobado || !PUEDE.cerrarLibro(rol)) ? (
          <div className="mt-8 flex flex-col gap-3">
            <ProximoPaso href={aprobado || !PUEDE.cerrarLibro(rol) ? `/tablero/${n.id}/leer` : `/tablero/${n.id}/libro`}>
              {aprobado ? (duena ? "Leer tu libro de viaje" : "Leer su libro de viaje") : PUEDE.cerrarLibro(rol) ? "Dale los últimos retoques y encargá tu libro de viaje" : "Leer su libro de viaje"}
            </ProximoPaso>
            {historiaCerrada && !aprobado && PUEDE.cerrarLibro(rol) ? (
              <div className="flex items-center gap-3 text-[13px] text-[var(--texto-menor)]">
                <span>Edición cerrada. Las fotos se siguen sumando en Encargar libro.</span>
                <ReabrirEdicion narradorId={n.id} />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Las etapas, como capítulos ─────────────────────────────────── */}
        <div className="mt-10 flex flex-col gap-14">
          {secciones.map((cap, i) => {
            const esPorDefinir = cap.nombre === SIN_ETAPA;
            const nochesContadas = cap.dias.filter((d) => respuestasPorOrden.has(d));
            // Cerrado (terminó o cortó antes): no queda nada por venir.
            const porVenir = cerrado ? 0 : hoy ? cap.dias.filter((d) => d > hoy).length : cap.dias.length;
            const esHoy = cap.nombre === capituloDeHoy;
            const rango = esPorDefinir ? null : rangoCorto(cap.desde ?? (cap.dias[0] ? fechaDelDia(viaje, cap.dias[0]) : undefined), cap.hasta ?? (cap.dias.length > 0 ? fechaDelDia(viaje, cap.dias[cap.dias.length - 1]) : undefined));
            const fotosDeEsta = fotosPorCapitulo.get(cap.nombre) ?? [];
            return (
              <section key={cap.nombre} id={`etapa-${i}`} aria-labelledby={`etapa-titulo-${i}`} className="scroll-mt-20">
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-[var(--texto)] pb-4">
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span aria-hidden className="text-3xl leading-none text-[var(--linea-fuerte)] [font-family:var(--fuente-titulo)] tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h2 id={`etapa-titulo-${i}`} className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">{cap.nombre}</h2>
                      {rango ? <p className="mt-2 text-[13px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">{rango}</p> : null}
                    </div>
                  </div>
                  <span className={`shrink-0 tabular-nums ${micro}`}>
                    {cap.dias.length === 0 ? (esPorDefinir ? "" : "sin fechas todavía") : `${esHoy ? "estás acá · " : ""}${nochesContadas.length} de ${cap.dias.length} noches`}
                  </span>
                </div>

                {esPorDefinir ? (
                  <p className="mt-4 text-[15px] leading-relaxed text-[var(--texto-suave)]">
                    Noches y fotos que todavía no tienen etapa. Cuando le pongas fechas a las etapas, abajo, se acomodan solas.
                  </p>
                ) : null}

                <GaleriaCapitulo fotos={fotosDeEsta} usuarioId={usuarioId} esDuena={duena} />

                {nochesContadas.length > 0 ? (
                  <div className="mt-6 flex flex-col gap-4">
                    {nochesContadas.map((dia) => (
                      <Noche key={dia} dia={dia} fecha={fechaLarga(fechaDelDia(viaje, dia))} respuestas={respuestasPorOrden.get(dia)!} preguntaEnviada={preguntasEnviadas[String(dia)]} repreguntaEnviada={repreguntasEnviadas[String(dia)]} />
                    ))}
                  </div>
                ) : null}

                {porVenir > 0 || (esHoy && !respuestasPorOrden.has(hoy!)) ? (
                  <p className={`mt-5 ${micro}`}>
                    {esHoy && !respuestasPorOrden.has(hoy!) ? (duena ? "esta noche te escribimos" : "esta noche le escribimos") : null}
                    {esHoy && !respuestasPorOrden.has(hoy!) && porVenir > 0 ? " · " : null}
                    {porVenir > 0 ? `${porVenir} ${porVenir === 1 ? "noche por venir" : "noches por venir"}` : null}
                  </p>
                ) : null}

                {puedeAgregarFotos && !esPorDefinir ? (
                  <div className="mt-5">
                    <SubirFoto narradorId={n.id} capitulos={etapasParaFotos} capituloInicial={cap.nombre}>
                      + Agregar fotos de {cap.nombre}
                    </SubirFoto>
                  </div>
                ) : null}
              </section>
            );
          })}

          {alVolver.length > 0 ? (
            <section aria-labelledby="al-volver">
              <div className="flex items-end justify-between gap-4 border-b border-[var(--texto)] pb-4">
                <h2 id="al-volver" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">Al volver</h2>
              </div>
              <div className="mt-6 flex flex-col gap-4">
                {alVolver.map((orden) => (
                  <Noche key={orden} dia={null} fecha={fechaLarga(respuestasPorOrden.get(orden)![0].recibido_at.slice(0, 10))} respuestas={respuestasPorOrden.get(orden)!} preguntaEnviada={preguntasEnviadas[String(orden)]} repreguntaEnviada={repreguntasEnviadas[String(orden)]} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* ── Sobre qué te preguntamos: los ángulos (solo el viajero, mientras dura el viaje) ── */}
        {!cerrado && PUEDE.cambiarRitmo(rol) ? (
          <section className="mt-16 border-t border-[var(--linea)] pt-10">
            <Etiqueta>Sobre qué te preguntamos</Etiqueta>
            <div className="mt-6">
              <AngulosDelViaje narradorId={n.id} angulos={viaje.angulos ?? []} />
            </div>
          </section>
        ) : null}

        {/* ── Las etapas, vivas ── */}
        {!cerrado && PUEDE.cambiarRitmo(rol) ? (
          <section className="mt-16 border-t border-[var(--linea)] pt-10">
            <Etiqueta>Las etapas del viaje</Etiqueta>
            <div className="mt-6">
              <EtapasDelViaje narradorId={n.id} viaje={viaje} />
            </div>
          </section>
        ) : null}

        {!cerrado && PUEDE.cambiarRitmo(rol) ? (
          <section className="mt-16 border-t border-[var(--linea)] pt-10">
            <Etiqueta>Ajustes</Etiqueta>
            <div className="mt-6">
              <Ajustes narradorId={n.id} ritmo={ritmo} evitar={evitar} sinRitmo horario={horario} propia={duena} />
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

/** Una noche contada: la fecha, lo que de verdad le preguntó el bot, y la respuesta. */
function Noche({ dia, fecha, respuestas, preguntaEnviada, repreguntaEnviada }: { dia: number | null; fecha: string; respuestas: RespuestaVista[]; preguntaEnviada?: string; repreguntaEnviada?: string }) {
  const principales = respuestas.filter((r) => !r.es_repregunta);
  const ampliaciones = respuestas.filter((r) => r.es_repregunta);
  const principal = principales[0] ?? respuestas[0];
  const texto = (principal.transcripcion ?? principal.texto_directo ?? "").trim();
  return (
    <article className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 rounded-xl border border-[var(--linea)] p-4 sm:grid-cols-[40px_minmax(0,1fr)_220px] sm:gap-x-4 sm:px-5 sm:py-5">
      <span className="text-[22px] leading-[1.2] text-[var(--linea-fuerte)] [font-family:var(--fuente-titulo)] tabular-nums">{dia ?? "✓"}</span>
      <div className="min-w-0 flex flex-col gap-2.5">
        <h3 className="text-[16.5px] font-medium leading-[1.4] [font-family:var(--fuente-titulo)]">{dia ? `Noche ${dia} · ${fecha}` : fecha}</h3>
        {preguntaEnviada ? (
          <p className="text-[14px] leading-relaxed text-[var(--texto-suave)] [font-family:var(--fuente-titulo)]">Te preguntamos: «{preguntaEnviada}»</p>
        ) : null}
        {texto ? (
          <p className="text-[15.5px] leading-[1.7] text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)] font-light">{texto}</p>
        ) : principal.audio_path ? (
          <p className="text-sm text-[var(--texto-menor)]">Estamos transcribiendo el audio…</p>
        ) : null}
        {ampliaciones.length > 0 ? (
          <div className="mt-1 flex flex-col gap-4 border-l-2 border-[var(--linea)] pl-4">
            {repreguntaEnviada ? <p className="text-[14px] leading-relaxed text-[var(--texto-suave)] [font-family:var(--fuente-titulo)]">Te repreguntamos: «{repreguntaEnviada}»</p> : null}
            <Etiqueta>y agregaste</Etiqueta>
            {ampliaciones.map((r) => (
              <Respuesta key={r.id} respuesta={r} />
            ))}
          </div>
        ) : null}
      </div>
      {principal.audio_path ? (
        <div className="col-start-2 sm:col-start-3 sm:row-start-1">
          <ReproductorRespuesta src={`/api/audio/${principal.id}`} duracion={principal.duracion_segundos} etiqueta={dia ? `noche ${dia}` : "al volver"} />
        </div>
      ) : null}
    </article>
  );
}

function IconoFoto(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M20 15l-4.5-4.5L8 18" />
    </svg>
  );
}
