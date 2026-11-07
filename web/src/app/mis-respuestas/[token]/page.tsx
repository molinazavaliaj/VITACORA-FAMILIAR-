import type { Metadata } from "next";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenRespuestas } from "@/lib/token-respuestas";
import { entrevistaV3, historiaV3, respuestasFuera, type FilaHistoriaV3 } from "@/lib/v3";
import { entrevistaHistoria, historiaDeHistoria } from "@/lib/historia-panel";
import { plazoDelNarrador, puedeSacarElNarrador } from "@/lib/fuera-del-libro";
import { loContadoEsPrivado } from "@/lib/panel";
import { Aviso, LOCALE, TEXTOS, VistaRespuestas, type Idioma } from "./vista";

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
  const n = data as { id: string; estado: string; contexto?: Record<string, unknown> | null; zona_horaria?: string | null; ultima_respuesta_at?: string | null } | null;
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

  return <VistaRespuestas idioma={idioma} bloques={bloques} puede={puede} hasta={puede && termino && fecha ? fecha : null} token={token} narradorId={n.id} privado={loContadoEsPrivado(n)} />;
}
