// «Que esto no vaya al libro» por respuesta, desde la historia V3 (Naza, 21/10; spec
// docs/superpowers/specs/2026-10-21-respuesta-fuera-del-libro-design.md; CONTRATO, "Respuestas sacadas por la
// familia"). La dueña saca UNA fila de `respuestas` (respuestas_fuera) y puede pedir que se la vuelvan a hacer:
// eso es una pregunta de la familia con el texto con que le llegó (el bot la hace antes de la foto del final).
// Acá las reglas; la ruta (api/fuera-del-libro) solo arma la sesión.

import type { Rol } from "./panel";
import { entrevistaV3, llegoAlFinalV3, MAXIMO_PREGUNTAS_FAMILIA_V3, ORDEN_FAMILIA_V3, preguntaDeLaFila } from "./v3";

// Solo lo que se usa del cliente de Supabase (así el test no necesita uno de verdad).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClienteMinimo = { from: (tabla: string) => any };

const SIN_CLAVE = "∅";
const ESTADOS_CERRADOS = ["completado", "cerrado_anticipado"];
/** El mismo capítulo que usa «Sumar una pregunta» en la V3 (preguntas/acciones.tsx). */
const CAPITULO_FAMILIA_V3 = "Preguntas de la familia";

export type PedidoFueraDelLibro = { accion: "sacar"; respuestaId: string; volverAPreguntar?: boolean } | { accion: "poner"; respuestaId: string };
export type ResultadoFueraDelLibro = { status: number; cuerpo: { ok: true; volvemosAPreguntar?: boolean } | { error: string } };

const mal = (status: number, error: string): ResultadoFueraDelLibro => ({ status, cuerpo: { error } });

export function leerPedido(body: unknown): PedidoFueraDelLibro | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.respuestaId !== "string" || !b.respuestaId) return null;
  if (b.accion === "sacar") return { accion: "sacar", respuestaId: b.respuestaId, volverAPreguntar: b.volverAPreguntar === true };
  if (b.accion === "poner") return { accion: "poner", respuestaId: b.respuestaId };
  return null;
}

/**
 * ¿Se puede ofrecer volver a hacerla? La entrevista sigue (no llegó a FO1 ni terminó) y queda lugar entre las
 * preguntas de la familia. La misma cuenta que «Sumar una pregunta» (api/guion).
 */
export function puedeVolverAPreguntar(o: { estadoNarrador: string; alFinal: boolean; preguntasFamilia: number }): boolean {
  return !ESTADOS_CERRADOS.includes(o.estadoNarrador) && !o.alFinal && o.preguntasFamilia < MAXIMO_PREGUNTAS_FAMILIA_V3;
}

export async function aplicarFueraDelLibro(
  admin: ClienteMinimo,
  o: { narradorId: string; rol: Rol; usuarioId: string; pedido: PedidoFueraDelLibro; error: string },
): Promise<ResultadoFueraDelLibro> {
  if (o.rol !== "duena") return mal(403, "No autorizado.");
  const { narradorId, pedido } = o;

  const nar = await admin.from("narradores").select("estado, libro_aprobado_at").eq("id", narradorId).maybeSingle();
  if (nar.error || !nar.data) return mal(500, o.error);
  const narrador = nar.data as { estado: string; libro_aprobado_at: string | null };
  if (narrador.libro_aprobado_at) return mal(400, "El libro ya está cerrado: no se cambia más.");

  let v3: Awaited<ReturnType<typeof entrevistaV3>>;
  try {
    v3 = await entrevistaV3(admin, narradorId);
  } catch (e) {
    console.error("fuera-del-libro: fallo la lectura V3", e);
    return mal(500, o.error);
  }
  if (!v3) return mal(400, "Esta historia no se edita desde acá.");

  const fila = await admin.from("respuestas").select("id, clave_v3").eq("id", pedido.respuestaId).eq("narrador_id", narradorId).maybeSingle();
  if (fila.error) return mal(500, o.error);
  const clave = (fila.data as { clave_v3: string | null } | null)?.clave_v3;
  if (!clave || clave === SIN_CLAVE) return mal(404, "No encontramos esa respuesta.");

  if (pedido.accion === "poner") {
    const { error } = await admin.from("respuestas_fuera").delete().eq("respuesta_id", pedido.respuestaId).eq("narrador_id", narradorId);
    if (error) { console.error("fuera-del-libro: fallo volver a ponerla", error); return mal(500, o.error); }
    return { status: 200, cuerpo: { ok: true } };
  }

  const { error } = await admin.from("respuestas_fuera")
    .upsert({ respuesta_id: pedido.respuestaId, narrador_id: narradorId, marcada_por: o.usuarioId }, { onConflict: "respuesta_id", ignoreDuplicates: true });
  if (error) { console.error("fuera-del-libro: fallo sacarla", error); return mal(500, o.error); }
  if (!pedido.volverAPreguntar) return { status: 200, cuerpo: { ok: true, volvemosAPreguntar: false } };

  // Volver a hacerla. Si ya no se puede (llegó al final, no hay lugar o no está el texto), la respuesta igual sale.
  // Si falla la base, error: la respuesta ya quedó afuera y la dueña lo intenta de nuevo.
  const texto = preguntaDeLaFila(clave, Array.isArray(v3.estado?.charla) ? v3.estado.charla : []);
  const propias = await admin.from("preguntas").select("orden, tipo, texto").eq("narrador_id", narradorId);
  if (propias.error) { console.error("fuera-del-libro: fallo la lectura de preguntas", propias.error); return mal(500, o.error); }
  const filas = (propias.data as { orden: number; tipo: string; texto: string }[] | null) ?? [];
  const familia = filas.filter((p) => p.tipo === "familia");
  const puede = texto && puedeVolverAPreguntar({ estadoNarrador: narrador.estado, alFinal: llegoAlFinalV3(v3.estado), preguntasFamilia: familia.length });
  if (!puede) return { status: 200, cuerpo: { ok: true, volvemosAPreguntar: false } };
  // Dos clics (o la misma pregunta sacada dos veces): una sola pregunta.
  if (familia.some((p) => p.texto?.trim() === texto)) return { status: 200, cuerpo: { ok: true, volvemosAPreguntar: true } };
  const orden = Math.max(ORDEN_FAMILIA_V3, ...filas.map((p) => p.orden + 1));
  const alta = await admin.from("preguntas")
    .insert({ narrador_id: narradorId, orden, texto, capitulo: CAPITULO_FAMILIA_V3, tipo: "familia", agregada_por: o.usuarioId });
  if (alta.error) { console.error("fuera-del-libro: fallo volver a preguntar", alta.error); return mal(500, o.error); }
  return { status: 200, cuerpo: { ok: true, volvemosAPreguntar: true } };
}
