import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenRespuestas } from "@/lib/token-respuestas";
import { entrevistaV3 } from "@/lib/v3";
import { entrevistaHistoria } from "@/lib/historia-panel";
import { esPropia } from "@/lib/panel";
import { leerCorreccionesGuardadas, leerDudas, preguntasParaLaPantalla } from "@/lib/dudas";
import { archivosDelEscritor, dudasAQuienConto, leerDelEscritor } from "@/lib/dudas-archivos";
import { textosMiHistoria, type IdiomaMiHistoria } from "@/lib/mi-historia-textos";
import { Aviso, TEXTOS } from "../../mis-respuestas/[token]/vista";
import { VistaDudas, VistaGracias } from "./vista";

// La puerta del link que le manda el bot a quien contó para las dudas (Naza, 06/11). Sin contraseña, con el mismo token
// firmado que /mis-respuestas. Un GET nunca escribe, porque WhatsApp abre el link solo para la vista previa. Lo que llega
// al navegador es solo lo que quien contó necesita ver: ni qué quedó sin resolver, ni de qué respuesta salió.

export const metadata: Metadata = {
  title: "Unas últimas preguntas",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
// Es de una persona: nada de guardarla en ningún lado.
export const dynamic = "force-dynamic";

const idiomaDe = (v: unknown): IdiomaMiHistoria => (v === "es-ES" || v === "ca" ? v : "es-AR");

async function idiomaDeLaEntrevista(narradorId: string): Promise<IdiomaMiHistoria> {
  const admin = crearClienteServidor();
  // Si tiene las dos entrevistas, manda la historia, como en la carpeta del escritor.
  const entrevista = (await entrevistaHistoria(admin, narradorId).catch(() => null)) ?? (await entrevistaV3(admin, narradorId).catch(() => null));
  return idiomaDe(entrevista?.idioma);
}

export default async function PaginaMiHistoria({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = verificarTokenRespuestas(token);
  const avisos = TEXTOS["es-AR"];
  if (!t.ok) {
    if (t.motivo !== "vencido") return <Aviso titulo={avisos.invalidoTitulo} texto={avisos.invalido} />;
    // La firma es válida: solo se lee en qué idioma decírselo. Si no se puede, es-AR.
    const T = TEXTOS[await idiomaDeLaEntrevista(t.narradorId).catch(() => "es-AR" as const)];
    return <Aviso titulo={T.vencidoTitulo} texto={T.vencido} />;
  }

  const admin = crearClienteServidor();
  const { data } = await admin.from("narradores").select("id, contexto, libro_aprobado_at").eq("id", t.narradorId).maybeSingle();
  const n = data as { id: string; contexto?: Record<string, unknown> | null; libro_aprobado_at?: string | null } | null;
  if (!n) return <Aviso titulo={avisos.invalidoTitulo} texto={avisos.invalido} />;

  const aLoQueContaste = `/mis-respuestas/${token}`;
  // Solo un libro privado o «Para mí»: en lo demás (un regalo no privado, viaje, kids) las dudas siguen en el panel.
  if (!dudasAQuienConto(n)) redirect(aLoQueContaste);

  const { nombres, error } = await archivosDelEscritor(admin, n.id);
  if (error) {
    console.error("mi-historia: fallo el listado de escritor/", error);
    redirect(aLoQueContaste);
  }

  // Si tiene las dos entrevistas, manda la historia, como en la carpeta del escritor.
  const entrevista = (await entrevistaHistoria(admin, n.id).catch(() => null)) ?? (await entrevistaV3(admin, n.id).catch(() => null));
  const idioma = idiomaDe(entrevista?.idioma);

  if (nombres.has("libro.md")) return <Aviso titulo={textosMiHistoria(idioma).libroEscrito} texto="" />;
  if (!nombres.has("carpeta-A.json") || !nombres.has("dudas-familia.json")) redirect(aLoQueContaste);

  const [archivoDudas, archivoCorrecciones] = await Promise.all([
    leerDelEscritor(admin, n.id, "dudas-familia.json"),
    leerDelEscritor(admin, n.id, "correcciones.json"),
  ]);
  const dudas = archivoDudas.texto !== null ? leerDudas(archivoDudas.texto) : null;
  if (!dudas || dudas.length === 0) {
    if (archivoDudas.error) console.error("mi-historia: fallo la descarga de dudas-familia.json", archivoDudas.error);
    redirect(aLoQueContaste);
  }
  // Un archivo roto no tapa la pantalla, pero la API no lo pisa: guardar va a fallar hasta que los socios lo arreglen.
  const correcciones = archivoCorrecciones.texto !== null ? leerCorreccionesGuardadas(archivoCorrecciones.texto) ?? [] : [];

  // «Para mí»: al final, a encargar el libro. Ya encargado, no hay nada más que hacer.
  const linkLibro = esPropia(n) && !n.libro_aprobado_at ? `/tablero/${n.id}/libro` : null;
  const preguntas = preguntasParaLaPantalla(dudas, correcciones);

  if (preguntas.length === 0) return <VistaGracias idioma={idioma} linkLibro={linkLibro} />;
  return <VistaDudas idioma={idioma} token={token} total={dudas.length} preguntas={preguntas} linkLibro={linkLibro} />;
}
