// La entrevista V3 (WhatsApp, desde el 07/10) vista desde la web. Un narrador es V3 si tiene fila en
// `entrevistas_v3` (CONTRATO, "Entrevista V3 por WhatsApp"). Para él no hay guion de 30 preguntas ni
// capítulos que ordenar: el plan del libro lo arma el escritor. Del cierre valen el título, el
// subtítulo, la foto de tapa, «Qué dejar afuera» y las correcciones (CONTRATO, "Escritor V3").

/** La clave "madre" de una repregunta (RP~X) o segunda oportunidad (X~2): salen del libro juntas. */
export const claveMadre = (k: string): string => (k.startsWith("RP~") ? k.slice(3) : k.replace(/~\d+$/, ""));

const SIN_CLAVE = "∅";
// ⟦foto⟧, ⟦botón:Sí⟧, ⟦inferida:CA2⟧: marcas del sistema, no algo que haya contado.
const MARCAS = /⟦[^⟧]*⟧/g;

type Globo = { de?: string; partes?: { id?: string; texto?: string }[] };
export type EstadoV3 = { respuestas?: [string, string][]; charla?: unknown[] };
export type FilaRespuestaV3 = { id: string; clave_v3: string | null };

/** Una pregunta contestada, para «Qué dejar afuera»: destildarla saca todas sus filas (`ids`). */
export type RespuestaV3 = { clave: string; pregunta: string; fragmento: string; ids: string[] };

/** El texto de la pregunta tal como le salió (OR6 puede haber salido como «OR6-con-apodo»). La última vez que salió. */
function preguntaDe(clave: string, charla: unknown[]): string | null {
  let texto: string | null = null;
  for (const g of charla as Globo[]) {
    if (g?.de !== "bio" || !Array.isArray(g.partes)) continue;
    for (const p of g.partes) {
      if (typeof p?.id === "string" && typeof p.texto === "string" && (p.id === clave || p.id.startsWith(`${clave}-`))) texto = p.texto;
    }
  }
  return texto;
}

/**
 * Lo que contó, agrupado por pregunta, en el orden en que lo contó. Solo lo que tiene filas en `respuestas`
 * (sin ellas no se puede dejar afuera) y algo dicho de verdad (sin marcas del sistema).
 */
export function respuestasV3ParaCerrar(estado: EstadoV3 | null | undefined, filas: FilaRespuestaV3[]): RespuestaV3[] {
  const respuestas = Array.isArray(estado?.respuestas) ? estado.respuestas : [];
  const charla = Array.isArray(estado?.charla) ? estado.charla : [];
  const idsPorMadre = new Map<string, string[]>();
  for (const f of filas) {
    if (!f.clave_v3 || f.clave_v3 === SIN_CLAVE) continue;
    const m = claveMadre(f.clave_v3);
    idsPorMadre.set(m, [...(idsPorMadre.get(m) ?? []), f.id]);
  }
  const textoPorMadre = new Map<string, string[]>();
  for (const r of respuestas) {
    if (!Array.isArray(r) || typeof r[0] !== "string" || typeof r[1] !== "string") continue;
    const m = claveMadre(r[0]);
    const limpio = r[1].replace(MARCAS, " ").replace(/\s+/g, " ").trim();
    if (!textoPorMadre.has(m)) textoPorMadre.set(m, []);
    if (limpio) textoPorMadre.get(m)!.push(limpio);
  }
  const out: RespuestaV3[] = [];
  for (const [clave, textos] of textoPorMadre) {
    const ids = idsPorMadre.get(clave);
    const texto = textos.join(" ");
    if (!ids?.length || !texto) continue;
    out.push({
      clave,
      pregunta: preguntaDe(clave, charla) ?? "Algo que contó",
      fragmento: texto.length > 140 ? `${texto.slice(0, 140)}…` : texto,
      ids,
    });
  }
  return out;
}

// Solo lo que se usa del cliente de Supabase (así el test no necesita uno de verdad).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClienteMinimo = { from: (tabla: string) => any };

/**
 * El estado de la entrevista V3 de ese narrador, o null si no es V3. Un error de la base tira: tomar a un
 * narrador V3 por viejo le mostraría a la familia el cierre viejo, que promete cosas que no pasan.
 */
export async function entrevistaV3(admin: ClienteMinimo, narradorId: string): Promise<{ estado: EstadoV3 } | null> {
  const { data, error } = await admin.from("entrevistas_v3").select("estado").eq("narrador_id", narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer la entrevista V3 de ${narradorId}`);
  if (!data) return null;
  return data as { estado: EstadoV3 };
}
