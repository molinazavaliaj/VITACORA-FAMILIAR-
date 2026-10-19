// Cambiar la fecha de inicio de un regalo desde el panel (rediseño 2026-10,
// arreglos chicos; maqueta Panel, hoja «Cambiar la fecha de inicio»). Puro:
// sin red ni Supabase. Lo usan la ruta PATCH /api/regalo/fecha y el panel
// (para saber si ofrecer la fila). Sin migración: se toca solo
// `regalos.fecha_entrega`, con las mismas reglas que al comprar
// (`errorDeFechaEntrega`) y, si el regalo se manda solo ese día, la misma
// condición que `validarEntrega`: el día y la hora elegidos tienen que estar
// por venir.

import { errorDeFechaEntrega, instanteDeEntrega, MENSAJE_FECHA_INVALIDA, MENSAJE_FECHA_PASADA } from "./regalo-reglas";

/** Lo que hace falta leer de la fila de `regalos`. Las columnas de la entrega pueden no estar (base vieja). */
export type RegaloConFecha = {
  id: string;
  fecha_entrega: string | null;
  usado_at: string | null;
  entrega_canal?: string | null;
  entrega_hora?: number | null;
  entrega_zona?: string | null;
  entrega_enviada_at?: string | null;
};

/**
 * Si la fecha todavía se puede cambiar: el regalo no se abrió (narrador en
 * `regalo_pendiente` y sin `usado_at`) y, si se manda solo, todavía no salió
 * (`entrega_enviada_at` es la traba del entrevistador; con ella puesta, el
 * envío ya se tomó o falló y lo resuelve una persona).
 */
export function fechaCambiable(estadoNarrador: string, regalo: RegaloConFecha | null): regalo is RegaloConFecha {
  return estadoNarrador === "regalo_pendiente" && regalo !== null && !regalo.usado_at && !regalo.entrega_enviada_at;
}

/** El problema de la fecha nueva, o null si está bien. Los mensajes son los del checkout. */
export function errorDeNuevaFecha(texto: unknown, regalo: RegaloConFecha, hoy: Date): string | null {
  if (typeof texto !== "string" || texto === "") return MENSAJE_FECHA_INVALIDA;
  const problema = errorDeFechaEntrega(texto, hoy);
  if (problema) return problema;
  // Se manda solo ese día a esa hora: el instante tiene que estar por venir
  // (hoy a las 10 ya no sirve si son las 11), como al comprar.
  if (regalo.entrega_canal && typeof regalo.entrega_hora === "number" && regalo.entrega_zona) {
    if (instanteDeEntrega(texto, regalo.entrega_hora, regalo.entrega_zona).getTime() <= hoy.getTime()) return MENSAJE_FECHA_PASADA;
  }
  return null;
}
