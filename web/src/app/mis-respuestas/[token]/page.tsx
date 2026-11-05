import type { Metadata } from "next";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenRespuestas } from "@/lib/token-respuestas";
import { entrevistaV3, historiaV3, respuestasFuera, type FilaHistoriaV3 } from "@/lib/v3";
import { entrevistaHistoria, historiaDeHistoria } from "@/lib/historia-panel";
import { plazoDelNarrador, puedeSacarElNarrador } from "@/lib/fuera-del-libro";
import type { IdiomaFueraDelLibro } from "@/lib/fuera-del-libro-textos";
import { ReproductorRespuesta } from "../../tablero/reproductor";
import { SacarDelLibro } from "../../tablero/[narradorId]/fuera-del-libro";
import { Toroide } from "../../marca";

// La página propia del narrador (Naza y Joaquín, 05/11): sin contraseña, con un link firmado que vence a los 7 días y le
// manda el bot. Escucha lo que contó y saca lo que no quiera en el libro. Mientras cuenta y hasta 48 horas después de su
// último mensaje se puede sacar; pasado eso, escucha y la página lo dice. Es la única que muestra lo contado de un
// regalo, y no pasa por el panel ni por la sesión de nadie.

export const metadata: Metadata = {
  title: "Lo que contaste",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
// Es de una persona: nada de guardarla en ningún lado.
export const dynamic = "force-dynamic";

type Idioma = "es-AR" | "es-ES" | "ca";
const IDIOMA_FUERA: Record<Idioma, IdiomaFueraDelLibro> = { "es-AR": "ar", "es-ES": "es", ca: "ca" };
const LOCALE: Record<Idioma, string> = { "es-AR": "es-AR", "es-ES": "es-ES", ca: "ca" };

const TEXTOS: Record<Idioma, {
  titulo: string; abierto: string; hasta: (fecha: string) => string; cerrado: string; nada: string;
  vencidoTitulo: string; vencido: string; invalidoTitulo: string; invalido: string; sinTexto: string; reservada: string;
}> = {
  "es-AR": {
    titulo: "Lo que contaste",
    abierto: "Solo lo ves vos. Si algo no querés que vaya al libro, tocá el botón que está debajo.",
    hasta: (f) => `Podés sacar lo que quieras hasta el ${f}.`,
    cerrado: "Ya no se puede sacar nada, porque tu libro se está escribiendo. Lo podés seguir escuchando mientras dure este link.",
    nada: "Todavía no hay nada acá. Cuando contestes la primera pregunta, va a aparecer.",
    vencidoTitulo: "Este link ya venció",
    vencido: "Dura 7 días. Escribime mis respuestas por WhatsApp y te mando uno nuevo.",
    invalidoTitulo: "Este link no sirve",
    invalido: "Escribime mis respuestas por WhatsApp y te mando uno nuevo.",
    sinTexto: "Estamos transcribiendo el audio.",
    reservada: "Pediste que esto no vaya al libro.",
  },
  "es-ES": {
    titulo: "Lo que has contado",
    abierto: "Solo lo ves tú. Si hay algo que no quieres que vaya al libro, toca el botón que está debajo.",
    hasta: (f) => `Puedes quitar lo que quieras hasta el ${f}.`,
    cerrado: "Ya no se puede quitar nada, porque tu libro se está escribiendo. Lo puedes seguir escuchando mientras dure este enlace.",
    nada: "Todavía no hay nada aquí. Cuando contestes la primera pregunta, aparecerá.",
    vencidoTitulo: "Este enlace ya ha caducado",
    vencido: "Dura 7 días. Escríbeme mis respuestas por WhatsApp y te envío uno nuevo.",
    invalidoTitulo: "Este enlace no sirve",
    invalido: "Escríbeme mis respuestas por WhatsApp y te envío uno nuevo.",
    sinTexto: "Estamos transcribiendo el audio.",
    reservada: "Pediste que esto no vaya al libro.",
  },
  ca: {
    titulo: "El que has explicat",
    abierto: "Només ho veus tu. Si hi ha alguna cosa que no vols que vagi al llibre, toca el botó que hi ha a sota.",
    hasta: (f) => `Pots treure el que vulguis fins al ${f}.`,
    cerrado: "Ja no es pot treure res, perquè el teu llibre s'està escrivint. Ho pots continuar escoltant mentre duri aquest enllaç.",
    nada: "Encara no hi ha res aquí. Quan contestis la primera pregunta, apareixerà.",
    vencidoTitulo: "Aquest enllaç ja ha caducat",
    vencido: "Dura 7 dies. Escriu-me les meves respostes per WhatsApp i te n'envio un de nou.",
    invalidoTitulo: "Aquest enllaç no serveix",
    invalido: "Escriu-me les meves respostes per WhatsApp i te n'envio un de nou.",
    sinTexto: "Estem transcrivint l'àudio.",
    reservada: "Vas demanar que això no vagi al llibre.",
  },
};

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--fondo)] text-[var(--texto)] [font-family:var(--fuente-cuerpo)]">
      <header className="oscuro flex items-center gap-3 bg-[var(--fondo)] px-6 py-5 text-[var(--texto)]">
        <Toroide className="h-8 w-8" />
        <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
      </header>
      <main className="mx-auto w-full max-w-2xl px-6 py-10">{children}</main>
    </div>
  );
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <Marco>
      <h1 className="text-3xl leading-tight font-medium [font-family:var(--fuente-titulo)]">{titulo}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-[var(--texto-suave)]">{texto}</p>
    </Marco>
  );
}

const idiomaDe = (v: unknown): Idioma => (v === "es-ES" || v === "ca" ? v : "es-AR");

export default async function PaginaMisRespuestas({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = verificarTokenRespuestas(token);
  if (!t.ok) {
    const T = TEXTOS["es-AR"];
    return t.motivo === "vencido" ? <Aviso titulo={T.vencidoTitulo} texto={T.vencido} /> : <Aviso titulo={T.invalidoTitulo} texto={T.invalido} />;
  }

  const admin = crearClienteServidor();
  const { data } = await admin.from("narradores").select("id, estado, contexto, zona_horaria, ultima_respuesta_at").eq("id", t.narradorId).maybeSingle();
  const n = data as { id: string; estado: string; contexto?: { modo?: unknown } | null; zona_horaria?: string | null; ultima_respuesta_at?: string | null } | null;
  if (!n) return <Aviso titulo={TEXTOS["es-AR"].invalidoTitulo} texto={TEXTOS["es-AR"].invalido} />;

  const esHistoria = n.contexto?.modo === "historia";
  const entrevista = esHistoria ? await entrevistaHistoria(admin, n.id) : await entrevistaV3(admin, n.id);
  const idioma = idiomaDe(entrevista?.idioma);
  const T = TEXTOS[idioma];
  const [{ data: filas }, fuera] = await Promise.all([
    admin
      .from("respuestas")
      .select(`id, ${esHistoria ? "clave_v3:clave_historia" : "clave_v3"}, audio_path, transcripcion, texto_directo, duracion_segundos, recibido_at, reservada, reservado_tramo`)
      .eq("narrador_id", n.id)
      .order("recibido_at", { ascending: true }),
    respuestasFuera(admin, n.id),
  ]);
  const lista = (filas as unknown as FilaHistoriaV3[] | null) ?? [];
  const bloques = esHistoria ? historiaDeHistoria(entrevista?.estado as never, lista, fuera) : historiaV3(entrevista?.estado as never, lista, fuera);

  const ahora = Date.now();
  const puede = puedeSacarElNarrador(n, ahora);
  const plazo = plazoDelNarrador(n);
  const termino = n.estado === "completado" || n.estado === "cerrado_anticipado";
  const fecha = plazo === null ? "" : new Date(plazo).toLocaleString(LOCALE[idioma], { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: n.zona_horaria ?? undefined });
  const trato = idioma === "es-AR" ? "vos" : "tu";

  return (
    <Marco>
      <h1 className="text-3xl leading-tight font-medium [font-family:var(--fuente-titulo)]">{T.titulo}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-[var(--texto-suave)]">{puede ? T.abierto : T.cerrado}</p>
      {puede && termino && fecha ? <p className="mt-2 text-[17px] font-medium leading-relaxed">{T.hasta(fecha)}</p> : null}

      <div className="mt-10 flex flex-col gap-10">
        {bloques.length === 0 ? <p className="text-[15px] text-[var(--texto-suave)]">{T.nada}</p> : null}
        {bloques.map((b, i) => (
          <section key={`${b.nombre ?? "antes"}-${i}`} className="flex flex-col gap-4">
            {b.nombre ? <h2 className="border-b border-[var(--texto)] pb-3 text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">{b.nombre}</h2> : null}
            {b.preguntas.filter((p) => p.respuestas.length > 0 || p.reservada).map((p) => (
              <article key={p.clave} className="flex flex-col gap-3 rounded-xl border border-[var(--linea)] p-4 sm:p-5">
                <h3 className="text-[16.5px] font-medium leading-[1.4] [font-family:var(--fuente-titulo)]">{p.pregunta}</h3>
                {p.reservada ? <p className="text-sm text-[var(--texto-menor)]">{T.reservada}</p> : null}
                {p.respuestas.map((r, j) => (
                  <div key={r.id} className={`flex flex-col gap-2 ${j > 0 ? "border-t border-[var(--linea)] pt-3" : ""}`}>
                    <p className={`text-[15.5px] leading-[1.7] font-light ${r.fuera ? "text-[var(--texto-menor)] opacity-70" : "text-[var(--texto-suave)]"}`}>{r.texto || T.sinTexto}</p>
                    {r.audio ? <ReproductorRespuesta src={`/api/mis-respuestas/${token}/audio/${r.id}`} duracion={r.duracion} etiqueta={p.pregunta.slice(0, 60)} /> : null}
                    {puede ? (
                      <SacarDelLibro narradorId={n.id} respuestaId={r.id} fuera={r.fuera === true} propia trato={trato} puedeVolverAPreguntar={false} endpoint={`/api/mis-respuestas/${token}/fuera`} idioma={IDIOMA_FUERA[idioma]} />
                    ) : null}
                  </div>
                ))}
              </article>
            ))}
          </section>
        ))}
      </div>
    </Marco>
  );
}
