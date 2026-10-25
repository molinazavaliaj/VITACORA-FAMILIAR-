// «Vitácora de una historia» vista desde el panel (plan 2026-10-21, Task 4.5). Un narrador de historia tiene
// `contexto.modo = "historia"` y, desde que el bot le da el alta, su fila en `historias` (CONTRATO, «Vitácora de
// una historia»): el estado tiene la misma charla que la V3, así que el panel reusa su pantalla (v3.tsx) con
// estas reglas. Lo que contestó está en `respuestas.clave_historia`.

import { historiaV3, preguntasDeLaFamiliaV3, type BloqueHistoriaV3, type FilaHistoriaV3, type FilaPreguntaFamiliaV3, type PreguntaFamiliaV3, type ReglasHistoria } from "./v3";

type ClienteMinimo = { from: (tabla: string) => any };

/** La clave con que el bot guarda la historia que eligió en TEMA-ABIERTO (entrevistador/src/historia/tipos.ts). */
export const CLAVE_TEMA = "TEMA";
/** La última pregunta (la de clase `cierre`) y la despedida (docs/historia/banco.md). */
const CIERRE = "HC10";
const FIN = "FIN-H";

/**
 * Las preguntas de un globo de historia: las del banco (HC1, HM3, HC1-A, HC8-Q), FOTO-H, las de quien regala
 * (PR-H1…), las sumadas desde el panel (F:…), las repreguntas (RP~X) y la elección de la historia (TEMA-ABIERTO y
 * TEMA-LISTA, que guardan con la clave TEMA). No lo son los mensajes (M3.1, COMO, TEMA-OK, BIEN-H, FIN-H).
 */
const PREGUNTA = /^(?:RP~)?(?:H[A-Z]\d+(?:-[A-Z])?|FOTO-H|PR-H[1-3]|F:.+)$/;
export const REGLAS_HISTORIA: ReglasHistoria = {
  esPregunta: (id) => PREGUNTA.test(id) || id === "TEMA-ABIERTO" || id === "TEMA-LISTA",
  clave: (id) => (id === "TEMA-ABIERTO" || id === "TEMA-LISTA" ? CLAVE_TEMA : id),
};

export type EstadoHistoriaPanel = {
  respuestas?: [string, string][];
  charla?: unknown[];
  reservadas?: string[];
  esperando?: string;
  terminada?: boolean;
  enviados?: string[];
};

/**
 * El estado de la historia de ese narrador, o null si el bot todavía no le dio el alta (o falta la migración). Un
 * error de la base tira: la página muestra el error en vez de una historia vacía.
 */
export async function entrevistaHistoria(admin: ClienteMinimo, narradorId: string): Promise<{ estado: EstadoHistoriaPanel; idioma?: string | null } | null> {
  const { data, error } = await admin.from("historias").select("estado, idioma").eq("narrador_id", narradorId).maybeSingle();
  if (error?.code === "42P01" || error?.code === "PGRST205") return null;
  if (error) throw new Error(`No pude leer la historia de ${narradorId}`);
  return (data as { estado: EstadoHistoriaPanel; idioma?: string | null } | null) ?? null;
}

/** Lo contado, por bloque, como en la V3. Las filas traen la clave de historia en `clave_v3` (alias en la consulta). */
export function historiaDeHistoria(estado: EstadoHistoriaPanel | null | undefined, filas: FilaHistoriaV3[], fuera: ReadonlySet<string> = new Set()): BloqueHistoriaV3[] {
  return historiaV3(estado, filas, fuera, REGLAS_HISTORIA);
}

/** ¿Ya llegó a la última pregunta (HC10) o terminó? Las preguntas sumadas desde el panel van antes: después no llegan. */
export function llegoAlFinalHistoria(estado: EstadoHistoriaPanel | null | undefined): boolean {
  if (!estado) return false;
  if (estado.terminada === true || estado.esperando === CIERRE) return true;
  if (Array.isArray(estado.enviados) && estado.enviados.includes(FIN)) return true;
  return Array.isArray(estado.respuestas) && estado.respuestas.some((r) => Array.isArray(r) && r[0] === CIERRE);
}

/** Las preguntas sumadas desde el panel y en qué quedaron, como en la V3, con el final de historia. */
export function preguntasDelPanelHistoria(estado: EstadoHistoriaPanel | null | undefined, filas: FilaPreguntaFamiliaV3[]): PreguntaFamiliaV3[] {
  return preguntasDeLaFamiliaV3(estado, filas, llegoAlFinalHistoria(estado));
}
