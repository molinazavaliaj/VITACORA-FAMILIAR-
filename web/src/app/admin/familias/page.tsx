import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosDelPanel } from "@/lib/admin/datos";
import { frenosDe, horasEntre, UMBRALES } from "@/lib/admin/frenos";
import { Barra, Chip, Nota, SinDatos, Tarjeta, Titulo, cuando, fechaCorta, horasEnPalabras } from "../ui";

// 02 · Familias — «la relación con el biógrafo, historia por historia».
// Primero las que piden algo; adentro de una, la charla real: lo que el biógrafo preguntó
// de verdad (reescrito con lo que el narrador ya contó) y lo que el narrador contestó.
// Esta es la trastienda: nada de esto lo ve el cliente.

type Color = "verde" | "ambar" | "rojo" | "neutro";

export default async function PantallaFamilias() {
  const ahora = new Date();
  const datos = await datosDelPanel(crearClienteServidor(), ahora);
  const frenos = frenosDe(datos, ahora);
  const familiaDe = new Map(datos.familias.map((f) => [f.id, f]));

  const enCurso = datos.narradores.filter((n) => ["invitado", "acepto", "activo", "pausado"].includes(n.estado));
  const terminadas = datos.narradores.filter((n) => !["invitado", "acepto", "activo", "pausado"].includes(n.estado));
  const historias = [...enCurso, ...terminadas];

  const frenosDeNarrador = (nombre: string | null) => frenos.filter((f) => f.quien === nombre);

  function estadoDe(n: (typeof historias)[number]): { color: Color; texto: string; detalle: string } {
    const propios = frenosDeNarrador(n.nombre);
    const rojo = propios.find((f) => f.gravedad === "rojo");
    if (rojo) {
      return {
        color: "rojo",
        texto: rojo.que === "pago" ? "sin empezar" : "trabado",
        detalle: rojo.horas === null ? rojo.detalle : `hace ${horasEnPalabras(rojo.horas)}`,
      };
    }
    const ambar = propios.find((f) => f.gravedad === "ambar");
    if (ambar) {
      return {
        color: "ambar",
        texto: "llamarlo",
        detalle: ambar.detalle,
      };
    }
    if (n.estado === "completado" || n.estado === "cerrado_anticipado") {
      return { color: "neutro", texto: "terminado", detalle: n.libro_aprobado_at ? `libro listo el ${fechaCorta(n.libro_aprobado_at)}` : "entrevista cerrada" };
    }
    if (n.estado === "pendiente_pago") {
      return { color: "ambar", texto: "sin pagar", detalle: "la compra existe pero el cobro no se confirmó" };
    }
    return { color: "verde", texto: "al día", detalle: "sin nada pendiente" };
  }

  const contexto = (n: (typeof historias)[number]) => (n.contexto ?? {}) as Record<string, unknown>;
  const enviadas = (n: (typeof historias)[number]) =>
    (contexto(n).preguntasEnviadas ?? {}) as Record<string, string>;
  const repreguntas = (n: (typeof historias)[number]) =>
    (contexto(n).repreguntasEnviadas ?? {}) as Record<string, string>;

  const elegida = historias.find((n) => frenosDeNarrador(n.nombre).length > 0) ?? historias[0] ?? null;
  const respuestasDeElegida = elegida
    ? datos.respuestas.filter((r) => r.narrador_id === elegida.id).sort((a, b) => b.pregunta_orden - a.pregunta_orden)
    : [];
  const ultimaRespuesta = respuestasDeElegida[0] ?? null;

  return (
    <div>
      <Titulo numero="02" nombre="Familias" aclara="la relación con el biógrafo, historia por historia" />

      <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-[var(--texto-suave)]">
        La entrevista son treinta días, una pregunta por día; la barra muestra cuánto falta. Primero las que piden
        algo.
      </p>

      {historias.length === 0 ? (
        <div className="mt-4">
          <SinDatos que="Todavía no hay ninguna familia con una historia empezada." />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3">
        {historias.map((n) => {
          const estado = estadoDe(n);
          const f = n.familia_id ? familiaDe.get(n.familia_id) : undefined;
          const orden = n.dia_actual ?? 0;
          const pregunta = enviadas(n)[String(orden)] ?? null;
          const dias = Math.min(30, orden);
          return (
            <div
              key={n.id}
              className="grid gap-3 rounded border border-[var(--linea)] px-4 py-3 lg:grid-cols-[1fr_1.2fr_1.4fr_auto] lg:items-center"
            >
              <div>
                <b className="block">{n.nombre ?? "Sin nombre"}</b>
                <span className="text-xs text-[var(--texto-menor)]">
                  {f ? `Familia ${f.nombre ?? f.email ?? "—"}` : "sin familia"}
                  {f?.region ? ` · ${f.region === "AR" ? "Argentina" : "España"}` : ""}
                </span>
              </div>
              <div>
                <Barra proporcion={dias / 30} />
                <span className="mt-1 block text-xs text-[var(--texto-menor)]">
                  {orden} de 30 días · {" "}
                  {n.ultima_respuesta_at ? `contestó por última vez el ${fechaCorta(n.ultima_respuesta_at)}` : "todavía no contestó"}
                </span>
              </div>
              <div className="text-sm">
                {pregunta ? (
                  <>
                    <em className="block text-[var(--texto-menor)]">«{pregunta}»</em>
                    <span className="text-xs text-[var(--texto-menor)]">es la última que salió, personalizada con lo que contó</span>
                  </>
                ) : (
                  <span className="text-xs text-[var(--texto-menor)]">
                    {orden === 0 ? "la pregunta 1 sale cuando la entrevista arranque" : "todavía no hay pregunta escrita"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 lg:justify-end">
                <Chip color={estado.color}>{estado.texto}</Chip>
                <span className="text-xs text-[var(--texto-menor)]">{estado.detalle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {elegida ? (
        <div className="mt-8">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            Adentro de una historia · {elegida.nombre ?? "sin nombre"}
          </h2>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Tarjeta>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-baseline gap-2">
                  <Chip color="neutro">compró</Chip>
                  <span className="text-[var(--texto-menor)]">
                    {elegida.familia_id ? familiaDe.get(elegida.familia_id)?.email ?? "—" : "—"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <Chip color={elegida.estado === "activo" ? "verde" : "neutro"}>{elegida.estado}</Chip>
                  <span className="text-[var(--texto-menor)]">va por el día {elegida.dia_actual ?? 0} de 30</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <Chip color="neutro">respuestas</Chip>
                  <span className="text-[var(--texto-menor)]">
                    {respuestasDeElegida.length} guardadas
                    {respuestasDeElegida.some((r) => r.duracion_segundos)
                      ? ` · ${Math.round(
                          respuestasDeElegida.reduce((s, r) => s + (r.duracion_segundos ?? 0), 0) / 60,
                        )} minutos de audio`
                      : ""}
                  </span>
                </div>
                {elegida.alerta_silencio ? (
                  <div className="flex items-baseline gap-2">
                    <Chip color="ambar">silencio</Chip>
                    <span className="text-[var(--texto-menor)]">
                      el entrevistador marcó que no contesta: es el caso de levantar el teléfono
                    </span>
                  </div>
                ) : null}
              </div>
            </Tarjeta>

            <Tarjeta>
              <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                La charla
              </p>
              <div className="mt-3 flex flex-col gap-3 text-sm">
                <div>
                  <span className="block text-xs text-[var(--texto-menor)]">lo que le preguntó el biógrafo de verdad</span>
                  <b>{enviadas(elegida)[String(elegida.dia_actual ?? 0)] ?? "todavía no salió la pregunta de hoy"}</b>
                  <p className="text-xs text-[var(--texto-menor)]">
                    No es el texto del guion: el biógrafo lo reescribe con lo que {elegida.nombre ?? "el narrador"} ya contó.
                  </p>
                </div>
                {repreguntas(elegida)[String(elegida.dia_actual ?? 0)] ? (
                  <div>
                    <span className="block text-xs text-[var(--texto-menor)]">y la repregunta del mismo día</span>
                    <b>{repreguntas(elegida)[String(elegida.dia_actual ?? 0)]}</b>
                  </div>
                ) : null}
                <div>
                  <span className="block text-xs text-[var(--texto-menor)]">lo que contestó</span>
                  {ultimaRespuesta ? (
                    <>
                      <b>
                        {ultimaRespuesta.duracion_segundos
                          ? `Audio de ${Math.floor(ultimaRespuesta.duracion_segundos / 60)} min ${ultimaRespuesta.duracion_segundos % 60} s`
                          : `Respuesta del día ${ultimaRespuesta.pregunta_orden}`}
                        {ultimaRespuesta.es_repregunta ? " (repregunta)" : ""}
                      </b>
                      <p className="text-xs text-[var(--texto-menor)]">
                        {(ultimaRespuesta.transcripcion ?? ultimaRespuesta.texto_directo ?? "sin texto todavía").slice(0, 220)}
                      </p>
                    </>
                  ) : (
                    <b className="text-[var(--texto-menor)]">todavía no contestó ninguna</b>
                  )}
                </div>
              </div>
            </Tarjeta>
          </div>

          <Nota>
            El audio y la transcripción son la trastienda: sirven para entender por qué el biógrafo preguntó lo que
            preguntó y para poder ayudar a la familia cuando algo se traba. Nada de esto lo ve el comprador.
          </Nota>
        </div>
      ) : null}
    </div>
  );
}
