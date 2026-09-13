import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, historiasDelUsuario, PUEDE } from "@/lib/panel";
import { ADAPTATIVAS, lugarLibre, puedeSaltar, validarRitmo, type PreguntaGuion, type Ritmo } from "@/lib/guion";
import { BannerAlertaSilencio, CierreAnticipado } from "../acciones";
import { AgregarPregunta, Ajustes, EditorGuion, SubirFoto } from "./preguntas/acciones";
import { GaleriaCapitulo, type FotoVista } from "./fotos";
import { Compartir, type InvitadoVista } from "./compartir";
import { Riel, type CapituloRiel } from "../riel";
import { firmarTokenLibro } from "@/lib/token-libro";
import { armarMuestra } from "@/lib/muestra";
import { VistaMuestra } from "../../muestra";
import { ReproductorRespuesta } from "../reproductor";
import {
  Contenedor,
  ESTADO_EN_HUMANO,
  EstadoError,
  Etiqueta,
  ProximoPaso,
  Respuesta,
  Titulo,
  TOTAL_PREGUNTAS_BASE,
  fechaCorta,
  formatearDuracion,
  type RespuestaVista,
} from "../ui";

// Una historia (docs/panel-usuario.md §5 y §15.3): ES el guion completo,
// por capítulo. Las contestadas traen el audio y la transcripción; las que
// faltan dicen "todavía no". Con ?editar=1 las que vienen se editan acá
// mismo (antes era la sección Preguntas, que ya no existe). Sin atribución de
// quién preguntó: pregunta el biógrafo.

const MINIMO_RESPUESTAS_CIERRE_ANTICIPADO = 10;
const ESTADOS_QUE_PERMITEN_CIERRE = ["activo", "pausado"];
const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];

type Pregunta = PreguntaGuion & { narrador_id: string | null };

const botonBarra = "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 [font-family:var(--fuente-micro)] [touch-action:manipulation]";
const botonBarraSec = `${botonBarra} border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--hueco)] focus-visible:outline-[var(--texto)]`;
const botonBarraPri = `${botonBarra} bg-[var(--acento)] text-[var(--sobre-acento)] hover:opacity-90 focus-visible:outline-[var(--acento)]`;

function IconoBarra({ nombre }: { nombre: "lapiz" | "foto" | "check" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {nombre === "lapiz" ? <path d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.1l-1.9-1.9a1.5 1.5 0 0 0-2.1 0L4 16zM13 7l4 4" /> : null}
      {nombre === "foto" ? <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M20 15l-4.5-4.5L8 18" /></> : null}
      {nombre === "check" ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : null}
    </svg>
  );
}

export default async function PaginaHistoria({ params, searchParams }: PageProps<"/tablero/[narradorId]">) {
  const { narradorId } = await params;
  const { editar, sobre } = await searchParams;

  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const admin = crearClienteServidor();
  const { historia, error } = await historiaAccesible(admin, user, narradorId);
  if (error) {
    console.error("historia: fallo el acceso", error);
    return <EstadoError />;
  }
  if (!historia) notFound();

  const { narrador: n, rol } = historia;

  // El visitante (guardó el link del libro cerrado) ve la muestra, no la historia.
  if (!PUEDE.verHistoriaCompleta(rol)) {
    const muestra = await armarMuestra(admin, n.id);
    return (
      <Contenedor>
        <Etiqueta>Lo guardaste · La historia de {n.nombre}</Etiqueta>
        <div className="mt-1">
          <Titulo>La historia de {n.nombre}</Titulo>
        </div>
        {muestra ? (
          <>
            <div className="mt-8">
              <VistaMuestra muestra={muestra} urlAudio={`/api/preview-audio?narrador=${n.id}`} urlPortada={muestra.portadaFotoId ? `/api/fotos/${muestra.portadaFotoId}` : null} />
            </div>
            <div className="mt-10">
              <ProximoPaso href={`/tablero/${n.id}/libro`}>Pedir mi copia impresa</ProximoPaso>
            </div>
          </>
        ) : (
          <p className="mt-6 text-[15px] text-[var(--texto-suave)]">Este libro todavía no está cerrado.</p>
        )}
      </Contenedor>
    );
  }

  const [
    { data: propias, error: e1 },
    { data: globales, error: e2 },
    { data: respuestas, error: e3 },
    { data: fotosData },
    { data: invitadosData },
    { data: filaNarrador },
    { panel },
  ] = await Promise.all([
    admin.from("preguntas").select("id, orden, texto, capitulo, tipo, foto_id, narrador_id").eq("narrador_id", n.id),
    admin.from("preguntas").select("id, orden, texto, capitulo, tipo, narrador_id").is("narrador_id", null),
    admin
      .from("respuestas")
      .select("id, pregunta_orden, audio_path, texto_directo, transcripcion, duracion_segundos, es_repregunta, recibido_at")
      .eq("narrador_id", n.id)
      .order("pregunta_orden", { ascending: true })
      .order("recibido_at", { ascending: true }),
    // Tolerante: la tabla la crea la migración del 12/09; sin ella, no hay fotos.
    admin.from("fotos").select("id, capitulo, epigrafe, principal, orden, subida_por").eq("narrador_id", n.id).order("principal", { ascending: false }).order("orden"),
    rol === "duena"
      ? admin.from("invitados").select("id, email, aceptado_at, rol").eq("narrador_id", n.id).order("created_at")
      : Promise.resolve({ data: null }),
    admin.from("narradores").select("contexto, libro_aprobado_at").eq("id", n.id).maybeSingle(),
    historiasDelUsuario(admin, user),
  ]);

  if (e1 || e2 || e3) {
    console.error("historia: fallo la carga", { e1, e2, e3 });
    return <EstadoError />;
  }

  const fila = (filaNarrador as { contexto?: Record<string, unknown>; libro_aprobado_at?: string | null } | null) ?? {};
  const aprobado = Boolean(fila.libro_aprobado_at);
  const urlBase = process.env.URL_BASE ?? "https://www.vitacorafamiliar.com";
  const linkPublico = rol === "duena" && aprobado ? `${urlBase}/libro/${firmarTokenLibro(n.id)}` : null;
  // Los que guardaron el link no cuentan como invitados en la lista de Compartir.
  const soloInvitados = ((invitadosData as (InvitadoVista & { rol?: string })[] | null) ?? []).filter((i) => i.rol !== "visitante");

  // El guion del narrador: sus filas propias; si todavía no tiene (anterior a la
  // migración), la plantilla global. Las propias siempre pisan a la global del mismo orden.
  const porOrden = new Map<number, Pregunta>();
  for (const p of (globales as Pregunta[] | null) ?? []) porOrden.set(p.orden, p);
  for (const p of (propias as Pregunta[] | null) ?? []) porOrden.set(p.orden, p);
  const guion = [...porOrden.values()].sort((a, b) => a.orden - b.orden);
  const total = guion.length > 0 ? guion.length : TOTAL_PREGUNTAS_BASE;

  const respuestasPorOrden = new Map<number, RespuestaVista[]>();
  for (const r of (respuestas as RespuestaVista[] | null) ?? []) {
    const lista = respuestasPorOrden.get(r.pregunta_orden) ?? [];
    lista.push(r);
    respuestasPorOrden.set(r.pregunta_orden, lista);
  }
  const respondidas = respuestasPorOrden.size;
  const segundosDeVoz = ((respuestas as RespuestaVista[] | null) ?? []).reduce((acc, r) => acc + (r.duracion_segundos ?? 0), 0);

  // Los capítulos, en el orden en que aparecen en el guion (el del biógrafo).
  const capitulos: { nombre: string; preguntas: Pregunta[] }[] = [];
  for (const p of guion) {
    const cap = capitulos.find((c) => c.nombre === p.capitulo);
    if (cap) cap.preguntas.push(p);
    else capitulos.push({ nombre: p.capitulo, preguntas: [p] });
  }
  const capitulosRiel: CapituloRiel[] = capitulos.map((c) => ({
    nombre: c.nombre,
    contestadas: c.preguntas.filter((p) => respuestasPorOrden.has(p.orden)).length,
    total: c.preguntas.length,
  }));

  const fotosPorCapitulo = new Map<string, FotoVista[]>();
  const fotosDelLibro: FotoVista[] = []; // sin capítulo: tapa, contratapa, marco (§15.2)
  for (const f of (fotosData as FotoVista[] | null) ?? []) {
    if (f.capitulo === null) {
      fotosDelLibro.push(f);
      continue;
    }
    const lista = fotosPorCapitulo.get(f.capitulo) ?? [];
    lista.push(f);
    fotosPorCapitulo.set(f.capitulo, lista);
  }
  const capitulosConocidos = [...new Set(guion.map((p) => p.capitulo))];

  const cerrado = ESTADOS_CERRADOS.includes(n.estado);
  const puedeCerrarAnticipado =
    rol === "duena" && ESTADOS_QUE_PERMITEN_CIERRE.includes(n.estado) && respondidas >= MINIMO_RESPUESTAS_CIERRE_ANTICIPADO;

  // El modo edición: las que vienen se editan, sacan, mueven y suman.
  const puedeAgregar = !cerrado && PUEDE.agregarPreguntasYFotos(rol);
  const editando = puedeAgregar && editar === "1";
  const futuras = guion.filter((p) => p.orden > n.dia_actual);
  const lugar = lugarLibre(guion);
  const contexto = fila.contexto ?? {};
  const ritmo: Ritmo = validarRitmo(contexto.ritmo) ? contexto.ritmo : contexto.modoRapido === true ? "seguido" : "diario";
  const evitar = typeof contexto.evitar === "string" ? contexto.evitar : "";
  const sobreOrden = typeof sobre === "string" ? Number(sobre) : null;
  const preguntaSobre = sobreOrden ? porOrden.get(sobreOrden) : null;

  const historiasRiel = panel.historias.map((h) => ({ id: h.narrador.id, nombre: h.narrador.nombre, rol: h.rol, estado: h.narrador.estado }));

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-6 py-8 md:px-10 md:py-10">
      <Riel
        historias={historiasRiel}
        actual={n.id}
        capitulos={capitulosRiel}
        respondidas={respondidas}
        total={total}
        segundosDeVoz={segundosDeVoz}
      />

      <div className="min-w-0 flex-1">
        {n.alerta_silencio && rol === "duena" ? (
          <div className="mb-8">
            <BannerAlertaSilencio narradorId={n.id} comoLeDicen={n.como_le_dicen} />
          </div>
        ) : null}

        {/* ── Cabecera: título + estado, y los botones a la derecha ─────── */}
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 md:pr-14">
          <div className="min-w-0">
            <Etiqueta>{rol === "invitado" ? "Te invitaron a esta historia" : editando ? "Historia · editando el guion" : "Historia"}</Etiqueta>
            <div className="mt-1">
              <Titulo>La historia de {n.nombre}</Titulo>
            </div>
            <p className="mt-2 text-[15px] text-[var(--texto-suave)]">
              {editando ? "Las que ya se mandaron no se tocan. Las que vienen, sí: editá, sacá, mové." : (ESTADO_EN_HUMANO[n.estado] ?? n.estado)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {editando ? (
              <Link href={`/tablero/${n.id}`} className={botonBarraPri}>
                <IconoBarra nombre="check" />
                Listo
              </Link>
            ) : (
              <>
                {puedeAgregar ? (
                  <Link href={`/tablero/${n.id}?editar=1`} className={botonBarraSec}>
                    <IconoBarra nombre="lapiz" />
                    {PUEDE.editarGuion(rol) ? "Editar preguntas" : "Sumar preguntas"}
                  </Link>
                ) : null}
                {puedeAgregar ? (
                  <SubirFoto narradorId={n.id} capitulos={capitulosConocidos} variante="barra">
                    <IconoBarra nombre="foto" />
                    Agregar fotos
                  </SubirFoto>
                ) : null}
                {PUEDE.invitar(rol) ? (
                  <Compartir narradorId={n.id} nombre={n.nombre} cerrado={cerrado} aprobado={aprobado} linkPublico={linkPublico} invitados={soloInvitados} />
                ) : null}
              </>
            )}
          </div>
        </header>

        {/* ── En el celular: progreso + índice en pastillas ──────────────── */}
        <div className="mt-6 lg:hidden">
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)] tabular-nums">{respondidas} de {total} respuestas</p>
            {segundosDeVoz > 0 ? (
              <p className="text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                <span className="text-[var(--texto)] tabular-nums">{formatearDuracion(segundosDeVoz)}</span> de su voz
              </p>
            ) : null}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--hueco)]">
            <div className="h-full rounded-full bg-[var(--texto)]" style={{ width: `${total > 0 ? Math.min(100, Math.round((respondidas / total) * 100)) : 0}%` }} />
          </div>
          <nav aria-label="Capítulos" className="-mx-6 mt-5 overflow-x-auto px-6 md:mx-0 md:px-0">
            <ol className="flex gap-2 pb-1">
              {capitulosRiel.map((cap, i) => {
                const completo = cap.contestadas === cap.total;
                return (
                  <li key={cap.nombre} className="shrink-0">
                    <a
                      href={`#cap-${i}`}
                      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors hover:border-[var(--texto)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] [font-family:var(--fuente-micro)] ${
                        completo ? "border-[var(--texto)] bg-[var(--texto)] text-[var(--fondo)]" : cap.contestadas > 0 ? "border-[var(--texto)]" : "border-[var(--linea)] text-[var(--texto-menor)]"
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

        {cerrado ? (
          <div className="mt-8">
            <ProximoPaso href={PUEDE.cerrarLibro(rol) ? `/tablero/${n.id}/libro` : `/tablero/${n.id}/descarga`}>
              {PUEDE.cerrarLibro(rol) ? "Dale los últimos retoques y cerrá su libro" : "Leer su libro"}
            </ProximoPaso>
          </div>
        ) : null}

        {editando ? (
          <div className="mt-8">
            <AgregarPregunta
              narradorId={n.id}
              capitulos={capitulosConocidos}
              lugarLibre={lugar}
              textoInicial={preguntaSobre ? `Me gustaría que me cuente más sobre esto: "${preguntaSobre.texto}"` : ""}
              capituloInicial={preguntaSobre?.capitulo}
            />
          </div>
        ) : null}

        {/* ── Los capítulos ───────────────────────────────────────────────── */}
        <div className="mt-10 flex flex-col gap-14">
          {capitulos.map((cap, i) => {
            const contestadas = capitulosRiel[i].contestadas;
            const porVenir = cap.preguntas.filter((p) => p.orden > n.dia_actual);
            const todoEnviado = porVenir.length === 0;
            return (
              <section key={cap.nombre} id={`cap-${i}`} aria-labelledby={`cap-titulo-${i}`} className="scroll-mt-20">
                <div className="flex items-end justify-between gap-4 border-b border-[var(--texto)] pb-4">
                  <div className="flex items-baseline gap-3">
                    <span aria-hidden className="text-3xl leading-none text-[var(--linea-fuerte)] [font-family:var(--fuente-titulo)] tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 id={`cap-titulo-${i}`} className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">{cap.nombre}</h2>
                  </div>
                  <span className="shrink-0 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em] tabular-nums">
                    {editando ? (todoEnviado ? "ya se mandaron · no se tocan" : "las que vienen") : `${contestadas} de ${cap.preguntas.length}`}
                  </span>
                </div>

                {!editando ? (
                  <GaleriaCapitulo fotos={fotosPorCapitulo.get(cap.nombre) ?? []} usuarioId={user.id} esDuena={rol === "duena"} />
                ) : null}

                <div className="mt-6 flex flex-col gap-4">
                  {cap.preguntas.map((p) => {
                    const lista = respuestasPorOrden.get(p.orden);
                    const porVenirEsta = p.orden > n.dia_actual;

                    // En edición, las que vienen las dibuja el editor (abajo).
                    if (editando && porVenirEsta) return null;

                    if (!lista) {
                      return (
                        <div
                          key={p.orden}
                          className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 rounded-xl border border-dashed border-[var(--linea-fuerte)] px-4 py-3.5 text-[var(--texto-menor)] sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5"
                        >
                          <span className="text-[22px] leading-[1.2] text-[var(--linea)] [font-family:var(--fuente-titulo)] tabular-nums">{p.orden}</span>
                          <p className="text-[14.5px] leading-[1.55] [font-family:var(--fuente-cuerpo)] font-light">{p.texto}</p>
                          <span className="col-start-2 text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.18em] sm:col-start-3">
                            {porVenirEsta ? "todavía no" : "enviada · esperando su audio"}
                          </span>
                        </div>
                      );
                    }

                    const principales = lista.filter((r) => !r.es_repregunta);
                    const ampliaciones = lista.filter((r) => r.es_repregunta);
                    const principal = principales[0] ?? lista[0];
                    const texto = (principal.transcripcion ?? principal.texto_directo ?? "").trim();
                    return (
                      <article
                        key={p.orden}
                        className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 rounded-xl border border-[var(--linea)] p-4 sm:grid-cols-[40px_minmax(0,1fr)_220px] sm:gap-x-4 sm:px-5 sm:py-5"
                      >
                        <span className="text-[22px] leading-[1.2] text-[var(--linea-fuerte)] [font-family:var(--fuente-titulo)] tabular-nums">{p.orden}</span>
                        <div className="min-w-0 flex flex-col gap-2.5">
                          <h3 className="text-[16.5px] font-medium leading-[1.4] [font-family:var(--fuente-titulo)]">{p.texto}</h3>
                          {p.foto_id ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`/api/fotos/${p.foto_id}`} alt="" className="max-h-64 self-start rounded-lg border border-[var(--linea)] object-contain" />
                          ) : null}
                          {texto ? (
                            <p className="text-[15.5px] leading-[1.7] text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)] font-light">{texto}</p>
                          ) : principal.audio_path ? (
                            <p className="text-sm text-[var(--texto-menor)]">Estamos transcribiendo el audio…</p>
                          ) : null}
                          {ampliaciones.length > 0 ? (
                            <div className="mt-1 flex flex-col gap-4 border-l-2 border-[var(--linea)] pl-4">
                              <Etiqueta>y agregó</Etiqueta>
                              {ampliaciones.map((r) => (
                                <Respuesta key={r.id} respuesta={r} />
                              ))}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{fechaCorta(principal.recibido_at)}</span>
                            {puedeAgregar ? (
                              <Link
                                href={`/tablero/${n.id}?editar=1&sobre=${p.orden}`}
                                className="text-[13px] text-[var(--acento)] underline decoration-[var(--linea-fuerte)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento)] [font-family:var(--fuente-micro)]"
                              >
                                Pedirle que cuente más
                              </Link>
                            ) : null}
                          </div>
                        </div>
                        {principal.audio_path ? (
                          <div className="col-start-2 sm:col-start-3 sm:row-start-1">
                            <ReproductorRespuesta src={`/api/audio/${principal.id}`} duracion={principal.duracion_segundos} etiqueta={`respuesta ${p.orden}`} />
                          </div>
                        ) : null}
                      </article>
                    );
                  })}

                  {editando ? (
                    <EditorGuion
                      narradorId={n.id}
                      futuras={futuras}
                      puedeEditar={PUEDE.editarGuion(rol)}
                      puedeSaltar={puedeSaltar(guion).ok}
                      capitulo={cap.nombre}
                    />
                  ) : null}
                </div>

                {!editando && puedeAgregar ? (
                  <div className="mt-5">
                    <SubirFoto narradorId={n.id} capitulos={capitulosConocidos} capituloInicial={cap.nombre}>
                      + Agregar una foto de esta época
                    </SubirFoto>
                  </div>
                ) : null}
              </section>
            );
          })}

          {!editando && (fotosDelLibro.length > 0 || puedeAgregar) ? (
            <section aria-labelledby="fotos-del-libro">
              <div className="flex items-end justify-between gap-4 border-b border-[var(--linea)] pb-4">
                <h2 id="fotos-del-libro" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">Fotos del libro</h2>
                <span className="shrink-0 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">tapa · contratapa · marco</span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--texto-suave)]">
                Las que no son de una época: las que querés para la tapa, la contratapa o el marco. Cuál va a dónde se elige en{" "}
                <Link href={`/tablero/${n.id}/libro`} className="underline decoration-[var(--linea-fuerte)] underline-offset-4">Encargar libro</Link>.
              </p>
              <GaleriaCapitulo fotos={fotosDelLibro} usuarioId={user.id} esDuena={rol === "duena"} />
              {puedeAgregar ? (
                <div className="mt-5">
                  <SubirFoto narradorId={n.id} capitulos={capitulosConocidos}>+ Agregar una foto del libro</SubirFoto>
                </div>
              ) : null}
            </section>
          ) : null}

          {!cerrado && !guion.some((p) => p.tipo === "adaptativa") ? (
            <p className="flex gap-4 text-[var(--texto-menor)]">
              <span className="w-8 shrink-0 text-right text-sm tabular-nums [font-family:var(--fuente-micro)]">+{ADAPTATIVAS}</span>
              <span className="text-[15px] italic">Las cuatro finales las escribe el biógrafo con todo lo que él haya contado.</span>
            </p>
          ) : null}
        </div>

        {/* ── Al final de todo: ajustes de la entrevista (solo dueña) ───── */}
        {!cerrado && PUEDE.cambiarRitmo(rol) ? (
          <section className="mt-16 border-t border-[var(--linea)] pt-10">
            <Etiqueta>Ajustes de la entrevista</Etiqueta>
            <div className="mt-6">
              <Ajustes narradorId={n.id} ritmo={ritmo} evitar={evitar} />
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
