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
export type EstadoV3 = { respuestas?: [string, string][]; charla?: unknown[]; reservadas?: string[] };
export type FilaRespuestaV3 = { id: string; clave_v3: string | null; reservada?: boolean | null; reservado_tramo?: string | null };

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
 * (sin ellas no se puede dejar afuera) y algo dicho de verdad (sin marcas del sistema). Lo que el narrador ya
 * pidió que no vaya al libro (por WhatsApp: `estado.reservadas`, o la fila reservada entera) no aparece: ya está
 * afuera y no se puede volver a meter desde acá.
 */
export function respuestasV3ParaCerrar(estado: EstadoV3 | null | undefined, filas: FilaRespuestaV3[]): RespuestaV3[] {
  const respuestas = Array.isArray(estado?.respuestas) ? estado.respuestas : [];
  const charla = Array.isArray(estado?.charla) ? estado.charla : [];
  // Como en la fábrica: reservar X saca también RP~X y X~2; reservar solo RP~X deja a X.
  const reservadas = new Set((Array.isArray(estado?.reservadas) ? estado.reservadas : []).filter((k) => typeof k === "string"));
  // Como en la fábrica: reservar X saca también RP~X y X~2; reservar solo RP~X deja a X en el libro.
  for (const f of filas) if (f.clave_v3 && f.clave_v3 === claveMadre(f.clave_v3) && f.reservada === true && !f.reservado_tramo?.trim()) reservadas.add(f.clave_v3);
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
    if (!ids?.length || !texto || reservadas.has(clave)) continue;
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

// ── La historia en el panel (10/10): lo que se le preguntó y lo que contestó, en orden, por bloque ──

export type FilaHistoriaV3 = FilaRespuestaV3 & {
  audio_path: string | null; transcripcion: string | null; texto_directo: string | null;
  duracion_segundos: number | null; recibido_at: string;
};
export type RespuestaHistoriaV3 = { id: string; texto: string; audio: boolean; duracion: number | null; recibidoAt: string };
export type PreguntaHistoriaV3 = {
  clave: string;
  /** El texto tal como le llegó (la última vez que salió). */
  pregunta: string;
  /** contestada · esperando (es la abierta) · sin respuesta (pasó de largo o la cerró sin contar). */
  estado: "contestada" | "esperando" | "sin respuesta";
  /** El narrador pidió que no vaya al libro: no se muestra lo que dijo. */
  reservada: boolean;
  respuestas: RespuestaHistoriaV3[];
};
export type BloqueHistoriaV3 = { nombre: string | null; preguntas: PreguntaHistoriaV3[] };

// Las partes de un globo que son preguntas: del banco (OR1, CA16, OR6.2, OR6-con-apodo, G1, AMH, AD2b),
// repreguntas (RP~X), segundas oportunidades (X~2) y las de la familia (F:…). No lo son los mensajes (M3.1),
// las entradas a un bloque (EN3), los avisos (AV11) ni la despedida (FIN).
const FORMA_PREGUNTA = /^(?:F:.+|(?:RP~)?[A-Z]+\d*[a-z]?(?:\.\d+)?(?:~\d+)?(?:-[\w-]+)?)$/;
const NO_ES_PREGUNTA = /^(?:M\d|EN\d|AV\d|FIN$)/;
const esPregunta = (id: string): boolean => FORMA_PREGUNTA.test(id) && !NO_ES_PREGUNTA.test(id.replace(/^RP~/, ""));
const sinVariante = (id: string): string => (id.startsWith("F:") ? id : id.replace(/-[\w-]+$/, ""));

type GloboHistoria = { de?: string; nombre?: unknown; partes?: { id?: unknown; texto?: unknown }[] };

/**
 * La entrevista como la ve la familia: por bloque, cada pregunta con lo que contestó (sus filas de
 * `respuestas`, con audio). Lo que quedó afuera a propósito (∅) no aparece. Lo reservado por WhatsApp se
 * marca y no se muestra.
 */
export function historiaV3(estado: (EstadoV3 & { esperando?: string }) | null | undefined, filas: FilaHistoriaV3[]): BloqueHistoriaV3[] {
  const charla = (Array.isArray(estado?.charla) ? estado.charla : []) as GloboHistoria[];
  const contestadas = new Set((Array.isArray(estado?.respuestas) ? estado.respuestas : []).map((r) => (Array.isArray(r) ? r[0] : "")));
  // Como en la fábrica: reservar X saca también RP~X y X~2; reservar solo RP~X deja a X.
  const reservadas = new Set((Array.isArray(estado?.reservadas) ? estado.reservadas : []).filter((k) => typeof k === "string"));
  const porClave = new Map<string, FilaHistoriaV3[]>();
  for (const f of filas) {
    if (!f.clave_v3 || f.clave_v3 === SIN_CLAVE) continue;
    porClave.set(f.clave_v3, [...(porClave.get(f.clave_v3) ?? []), f]);
  }
  const bloques: BloqueHistoriaV3[] = [{ nombre: null, preguntas: [] }];
  const vistas = new Map<string, PreguntaHistoriaV3>();
  for (const g of charla) {
    if (g?.de === "bloque") {
      bloques.push({ nombre: typeof g.nombre === "string" ? g.nombre : null, preguntas: [] });
      continue;
    }
    if (g?.de !== "bio" || !Array.isArray(g.partes)) continue;
    for (const p of g.partes) {
      if (typeof p?.id !== "string" || typeof p.texto !== "string" || !esPregunta(p.id)) continue;
      const clave = sinVariante(p.id);
      const ya = vistas.get(clave);
      if (ya) { ya.pregunta = p.texto; continue; } // la reenviada: vale la última, en su lugar de antes
      const item: PreguntaHistoriaV3 = { clave, pregunta: p.texto, estado: "sin respuesta", reservada: false, respuestas: [] };
      vistas.set(clave, item);
      bloques[bloques.length - 1].preguntas.push(item);
    }
  }
  for (const item of vistas.values()) {
    const propias = porClave.get(item.clave) ?? [];
    // Un tramo reservado también oculta la respuesta entera: ante la duda, se muestra menos.
    item.reservada = reservadas.has(item.clave) || reservadas.has(claveMadre(item.clave)) || propias.some((f) => f.reservada === true || !!f.reservado_tramo?.trim());
    item.respuestas = item.reservada ? [] : propias.map((f) => {
      const crudo = (f.transcripcion ?? f.texto_directo ?? "").trim();
      const boton = /⟦botón:([^⟧]*)⟧/.exec(crudo)?.[1];
      const texto = crudo.replace(MARCAS, " ").replace(/\s+/g, " ").trim() || (boton ? `«${boton}»` : "");
      return { id: f.id, texto, audio: Boolean(f.audio_path), duracion: f.duracion_segundos, recibidoAt: f.recibido_at };
    }).filter((r) => r.texto || r.audio);
    item.estado = estado?.esperando === item.clave ? "esperando" : contestadas.has(item.clave) || item.respuestas.length > 0 || item.reservada ? "contestada" : "sin respuesta";
  }
  return bloques.filter((b) => b.preguntas.length > 0);
}

/**
 * ¿La entrevista ya llegó a la foto del final (FO1) o terminó? Las preguntas de la familia van antes de FO1:
 * después ya no le llegan (entrevistador/src/v3/turno.ts, pasoFO1).
 */
export function llegoAlFinalV3(estado: (EstadoV3 & { esperando?: string; terminada?: boolean; enviados?: string[] }) | null | undefined): boolean {
  if (!estado) return false;
  if (estado.terminada === true || estado.esperando === "FO1") return true;
  if (Array.isArray(estado.enviados) && estado.enviados.includes("FO1")) return true;
  if (Array.isArray(estado.respuestas) && estado.respuestas.some((r) => Array.isArray(r) && r[0] === "FO1")) return true;
  const charla = (Array.isArray(estado.charla) ? estado.charla : []) as GloboHistoria[];
  return charla.some((g) => g?.de === "bio" && Array.isArray(g.partes) && g.partes.some((p) => p?.id === "FO1"));
}

/** Cuántas preguntas suyas puede sumar la familia en la V3. */
export const MAXIMO_PREGUNTAS_FAMILIA_V3 = 10;
/** La banda de `orden` de las preguntas de la familia V3: lejos del guion viejo (1-40) y de los objetos (101-108). */
export const ORDEN_FAMILIA_V3 = 200;
