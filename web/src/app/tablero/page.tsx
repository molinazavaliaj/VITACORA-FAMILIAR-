import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { BannerAlertaSilencio, CierreAnticipado } from "./acciones";

const TOTAL_PREGUNTAS = 30;
const MINIMO_RESPUESTAS_CIERRE_ANTICIPADO = 10;
const ESTADOS_QUE_PERMITEN_CIERRE = ["activo", "pausado"];
const ESTADOS_CON_LIBRO_EN_MARCHA = ["completado", "cerrado_anticipado"];

const MENSAJE_ERROR_CARGA = "No pudimos cargar el tablero. Actualiza la página en un momento.";

const ESTADO_EN_HUMANO: Record<string, string> = {
  invitado: "Le mandamos la invitación, falta que acepte",
  acepto: "Aceptó — pronto le llega la primera pregunta",
  activo: "Está respondiendo, día a día",
  pausado: "Pidió una pausa — un llamado tuyo ayuda",
  completado: "Terminó de contar su historia — ya estamos armando el libro",
  cerrado_anticipado: "Cerramos la bitácora antes de tiempo — armamos el libro con lo que hay",
};

type Narrador = {
  id: string;
  nombre: string;
  como_le_dicen: string;
  estado: string;
  dia_actual: number;
  alerta_silencio: boolean;
};

type Pregunta = {
  narrador_id: string | null;
  orden: number;
  texto: string;
  capitulo: string;
};

type Respuesta = {
  id: string;
  pregunta_orden: number;
  audio_path: string | null;
  texto_directo: string | null;
  es_repregunta: boolean;
  recibido_at: string;
};

export default async function Tablero() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const admin = crearClienteServidor();

  const { data: familia, error: errorFamilia } = await admin
    .from("familias")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("tablero: fallo la busqueda de familia", errorFamilia);
    return <EstadoError />;
  }

  if (!familia) {
    redirect("/registro");
  }

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id, nombre, como_le_dicen, estado, dia_actual, alerta_silencio")
    .eq("familia_id", (familia as { id: string }).id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("tablero: fallo la busqueda de narradores", errorNarradores);
    return <EstadoError />;
  }

  const narrador = (narradores as Narrador[] | null)?.[0];

  if (!narrador) {
    redirect("/registro");
  }

  const [
    { data: preguntasFijas, error: errorPreguntasFijas },
    { data: preguntasNarrador, error: errorPreguntasNarrador },
    { data: respuestas, error: errorRespuestas },
    { data: pedidos, error: errorPedidos },
  ] = await Promise.all([
    admin.from("preguntas").select("narrador_id, orden, texto, capitulo").is("narrador_id", null),
    admin
      .from("preguntas")
      .select("narrador_id, orden, texto, capitulo")
      .eq("narrador_id", narrador.id),
    admin
      .from("respuestas")
      .select("id, pregunta_orden, audio_path, texto_directo, es_repregunta, recibido_at")
      .eq("narrador_id", narrador.id)
      .order("pregunta_orden", { ascending: true }),
    admin.from("pedidos").select("id").eq("narrador_id", narrador.id).limit(1),
  ]);

  if (errorPreguntasFijas || errorPreguntasNarrador || errorRespuestas || errorPedidos) {
    console.error("tablero: fallo la carga de preguntas/respuestas/pedidos", {
      errorPreguntasFijas,
      errorPreguntasNarrador,
      errorRespuestas,
      errorPedidos,
    });
    return <EstadoError />;
  }

  const tienePedido = ((pedidos as { id: string }[] | null) ?? []).length > 0;

  const preguntasPorOrden = new Map<number, Pregunta>();
  for (const pregunta of (preguntasFijas as Pregunta[] | null) ?? []) {
    preguntasPorOrden.set(pregunta.orden, pregunta);
  }
  // Las preguntas propias del narrador (adaptativas o reemplazos) pisan a la fija del mismo orden.
  for (const pregunta of (preguntasNarrador as Pregunta[] | null) ?? []) {
    preguntasPorOrden.set(pregunta.orden, pregunta);
  }

  const respuestasPorOrden = new Map<number, Respuesta[]>();
  for (const respuesta of (respuestas as Respuesta[] | null) ?? []) {
    const lista = respuestasPorOrden.get(respuesta.pregunta_orden) ?? [];
    lista.push(respuesta);
    respuestasPorOrden.set(respuesta.pregunta_orden, lista);
  }

  const ordenesRespondidos = [...respuestasPorOrden.keys()].sort((a, b) => a - b);
  const totalRespondidas = ordenesRespondidos.length;

  const puedeSolicitarCierre =
    ESTADOS_QUE_PERMITEN_CIERRE.includes(narrador.estado) &&
    totalRespondidas >= MINIMO_RESPUESTAS_CIERRE_ANTICIPADO;

  // El libro solo empieza a armarse cuando el narrador termina — recién ahí
  // tiene sentido pedirle a la familia que revise los nombres y ver la
  // previsualización.
  const libroEnMarcha = ESTADOS_CON_LIBRO_EN_MARCHA.includes(narrador.estado);

  let avisoNombres: "pendiente" | "hecho" | null = null;
  if (libroEnMarcha) {
    const { data: archivosPaquete, error: errorPaquete } = await admin.storage
      .from("audios")
      .list(`${narrador.id}/paquete`);

    if (errorPaquete) {
      console.error("tablero: fallo la busqueda del paquete", errorPaquete);
    } else {
      const tieneNombres = (archivosPaquete ?? []).some((archivo) => archivo.name === "nombres.json");
      avisoNombres = tieneNombres ? "hecho" : "pendiente";
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        {narrador.alerta_silencio ? (
          <div className="mb-8">
            <BannerAlertaSilencio narradorId={narrador.id} />
          </div>
        ) : null}

        {avisoNombres ? (
          <div className="mb-8">
            <AvisoNombres estado={avisoNombres} />
          </div>
        ) : null}

        {libroEnMarcha ? (
          <div className="mb-8">
            <Link
              href="/comprar"
              className="block rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Ver la previsualización y conseguir su libro →
            </Link>
          </div>
        ) : null}

        <h1 className="text-2xl font-semibold text-zinc-900">{narrador.como_le_dicen}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          {ESTADO_EN_HUMANO[narrador.estado] ?? narrador.estado}
        </p>

        <div className="mt-6">
          <BarraProgreso diaActual={narrador.dia_actual} respondidas={totalRespondidas} />
        </div>

        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/tablero/saludos" className="font-medium text-zinc-900 underline underline-offset-2">
            Los saludos de la familia
          </Link>
          {tienePedido ? (
            <Link href="/tablero/descarga" className="font-medium text-zinc-900 underline underline-offset-2">
              Tu descarga
            </Link>
          ) : null}
        </nav>

        <div className="mt-10 flex flex-col gap-6">
          {ordenesRespondidos.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Todavía no hay respuestas para escuchar. En cuanto conteste la primera pregunta,
              aparece acá.
            </p>
          ) : (
            ordenesRespondidos.map((orden) => {
              const pregunta = preguntasPorOrden.get(orden);
              const respuestasDelDia = respuestasPorOrden.get(orden) ?? [];
              const principales = respuestasDelDia.filter((r) => !r.es_repregunta);
              const repreguntas = respuestasDelDia.filter((r) => r.es_repregunta);
              const principal = principales[0] ?? respuestasDelDia[0];
              const fecha = new Date(principal.recibido_at).toLocaleDateString("es", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <div key={orden} className="border-b border-zinc-100 pb-6 last:border-none">
                  <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                    Día {orden} — {fecha}
                  </p>
                  <h3 className="mt-1 text-base font-medium text-zinc-900">
                    {pregunta?.texto ?? `Pregunta ${orden}`}
                  </h3>
                  <div className="mt-3">
                    <RespuestaAudioOTexto respuesta={principal} />
                  </div>
                  {repreguntas.length > 0 ? (
                    <div className="mt-4 flex flex-col gap-3 border-l-2 border-zinc-100 pl-4">
                      <p className="text-xs font-medium text-zinc-400">y agregó:</p>
                      {repreguntas.map((repregunta) => (
                        <RespuestaAudioOTexto key={repregunta.id} respuesta={repregunta} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {puedeSolicitarCierre ? <CierreAnticipado narradorId={narrador.id} /> : null}
      </div>
    </div>
  );
}

function AvisoNombres({ estado }: { estado: "pendiente" | "hecho" }) {
  if (estado === "hecho") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm text-zinc-600">Nombres revisados ✓</p>
      </div>
    );
  }

  return (
    <Link
      href="/tablero/nombres"
      className="block rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
    >
      Revisa los nombres antes de que imprimamos su libro →
    </Link>
  );
}

function EstadoError() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center text-zinc-900">
      <p className="text-sm text-zinc-600">{MENSAJE_ERROR_CARGA}</p>
    </div>
  );
}

function BarraProgreso({
  diaActual,
  respondidas,
}: {
  diaActual: number;
  respondidas: number;
}) {
  const porcentaje = Math.min(100, Math.round((diaActual / TOTAL_PREGUNTAS) * 100));
  return (
    <div className="flex flex-col gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-900 transition-all"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="text-sm text-zinc-600">
        {respondidas} de {TOTAL_PREGUNTAS} respuestas
      </p>
    </div>
  );
}

function RespuestaAudioOTexto({ respuesta }: { respuesta: Respuesta }) {
  if (respuesta.audio_path) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <audio controls src={`/api/audio/${respuesta.id}`} className="w-full" />
    );
  }

  if (respuesta.texto_directo) {
    return (
      <p className="text-sm leading-relaxed text-zinc-700 italic">
        &ldquo;{respuesta.texto_directo}&rdquo;
      </p>
    );
  }

  return <p className="text-sm text-zinc-400">Sin contenido todavía.</p>;
}
