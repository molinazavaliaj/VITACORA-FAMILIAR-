import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { historiaAccesible, PUEDE } from "@/lib/panel";
import { BannerAlertaSilencio, CierreAnticipado } from "../acciones";
import {
  BarraProgreso,
  Contenedor,
  ESTADO_EN_HUMANO,
  EstadoError,
  Etiqueta,
  ProximoPaso,
  Respuesta,
  Titulo,
  TOTAL_PREGUNTAS_BASE,
  fechaCorta,
  type RespuestaVista,
} from "../ui";

// Una historia (docs/panel-usuario.md §5): organizada POR CAPÍTULO, no por
// fecha, para que se vea el libro formándose. Cada respuesta trae el audio y
// la transcripción. Sin atribución de quién preguntó: pregunta el biógrafo.

const MINIMO_RESPUESTAS_CIERRE_ANTICIPADO = 10;
const ESTADOS_QUE_PERMITEN_CIERRE = ["activo", "pausado"];
const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];

type Pregunta = { orden: number; texto: string; capitulo: string; narrador_id: string | null };

export default async function PaginaHistoria({ params }: PageProps<"/tablero/[narradorId]">) {
  const { narradorId } = await params;

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

  const [{ data: propias, error: e1 }, { data: globales, error: e2 }, { data: respuestas, error: e3 }] =
    await Promise.all([
      admin.from("preguntas").select("orden, texto, capitulo, narrador_id").eq("narrador_id", n.id),
      admin.from("preguntas").select("orden, texto, capitulo, narrador_id").is("narrador_id", null),
      admin
        .from("respuestas")
        .select("id, pregunta_orden, audio_path, texto_directo, transcripcion, duracion_segundos, es_repregunta, recibido_at")
        .eq("narrador_id", n.id)
        .order("pregunta_orden", { ascending: true })
        .order("recibido_at", { ascending: true }),
    ]);

  if (e1 || e2 || e3) {
    console.error("historia: fallo la carga", { e1, e2, e3 });
    return <EstadoError />;
  }

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

  // Los capítulos, en el orden en que aparecen en el guion (el del biógrafo).
  const capitulos: { nombre: string; preguntas: Pregunta[] }[] = [];
  for (const p of guion) {
    const cap = capitulos.find((c) => c.nombre === p.capitulo);
    if (cap) cap.preguntas.push(p);
    else capitulos.push({ nombre: p.capitulo, preguntas: [p] });
  }

  const cerrado = ESTADOS_CERRADOS.includes(n.estado);
  const puedeCerrarAnticipado =
    rol === "duena" && ESTADOS_QUE_PERMITEN_CIERRE.includes(n.estado) && respondidas >= MINIMO_RESPUESTAS_CIERRE_ANTICIPADO;

  return (
    <Contenedor>
      {n.alerta_silencio && rol === "duena" ? (
        <div className="mb-8">
          <BannerAlertaSilencio narradorId={n.id} comoLeDicen={n.como_le_dicen} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Etiqueta>{rol === "invitado" ? "Te invitaron a esta historia" : "Historia"}</Etiqueta>
          <div className="mt-1">
            <Titulo>La historia de {n.nombre}</Titulo>
          </div>
          <p className="mt-2 text-[15px] text-[var(--texto-suave)]">{ESTADO_EN_HUMANO[n.estado] ?? n.estado}</p>
        </div>
        {PUEDE.invitar(rol) ? (
          <span
            title="Pronto: invitar a la familia mientras el libro está abierto; compartir el libro cuando esté cerrado"
            className="inline-flex h-10 cursor-not-allowed items-center rounded-full border border-[var(--linea)] px-5 text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)]"
          >
            Compartir
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <BarraProgreso respondidas={respondidas} total={total} />
      </div>

      {cerrado ? (
        <div className="mt-8">
          <ProximoPaso href={PUEDE.cerrarLibro(rol) ? `/tablero/${n.id}/libro` : `/tablero/${n.id}/descarga`}>
            {PUEDE.cerrarLibro(rol) ? "Dale los últimos retoques y cerrá su libro" : "Leer su libro"}
          </ProximoPaso>
        </div>
      ) : null}

      <div className="mt-12 flex flex-col gap-12">
        {capitulos.map((cap, i) => {
          const contestadas = cap.preguntas.filter((p) => respuestasPorOrden.has(p.orden)).length;
          return (
            <section key={cap.nombre} aria-labelledby={`cap-${i}`}>
              <div className="flex items-baseline justify-between gap-4 border-b border-[var(--texto)] pb-3">
                <h2 id={`cap-${i}`} className="text-xl font-medium [font-family:var(--fuente-titulo)]">
                  <span className="mr-3 text-[var(--texto-menor)] tabular-nums">{i + 1}</span>
                  {cap.nombre}
                </h2>
                <span className="text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)] tabular-nums">
                  {contestadas} de {cap.preguntas.length}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-8">
                {cap.preguntas.map((p) => {
                  const lista = respuestasPorOrden.get(p.orden);
                  if (!lista) {
                    return (
                      <div key={p.orden} className="flex gap-4 text-[var(--texto-menor)]">
                        <span className="w-6 shrink-0 text-right text-sm tabular-nums [font-family:var(--fuente-micro)]">{p.orden}</span>
                        <p className="text-[15px] leading-relaxed">{p.texto}</p>
                      </div>
                    );
                  }
                  const principales = lista.filter((r) => !r.es_repregunta);
                  const ampliaciones = lista.filter((r) => r.es_repregunta);
                  const principal = principales[0] ?? lista[0];
                  return (
                    <article key={p.orden} className="flex gap-4">
                      <span className="w-6 shrink-0 pt-1 text-right text-sm text-[var(--texto-menor)] tabular-nums [font-family:var(--fuente-micro)]">
                        {p.orden}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
                          {fechaCorta(principal.recibido_at)}
                        </p>
                        <h3 className="mt-1 text-[17px] font-medium leading-snug [font-family:var(--fuente-titulo)]">{p.texto}</h3>
                        <div className="mt-4">
                          <Respuesta respuesta={principal} />
                        </div>
                        {ampliaciones.length > 0 ? (
                          <div className="mt-5 flex flex-col gap-4 border-l-2 border-[var(--linea)] pl-4">
                            <Etiqueta>y agregó</Etiqueta>
                            {ampliaciones.map((r) => (
                              <Respuesta key={r.id} respuesta={r} />
                            ))}
                          </div>
                        ) : null}
                        {!cerrado && PUEDE.agregarPreguntasYFotos(rol) ? (
                          <Link
                            href={`/tablero/${n.id}/preguntas?sobre=${p.orden}`}
                            className="mt-4 inline-block text-sm text-[var(--acento)] underline decoration-[var(--linea-fuerte)] underline-offset-4 [font-family:var(--fuente-micro)]"
                          >
                            Pedirle que cuente más sobre esto
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {puedeCerrarAnticipado ? (
        <div className="mt-16">
          <CierreAnticipado narradorId={n.id} />
        </div>
      ) : null}
    </Contenedor>
  );
}
