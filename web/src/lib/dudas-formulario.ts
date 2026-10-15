import type { PedidoRespuesta } from "./dudas";

// Lo del formulario de dudas que corre en el navegador. Aparte de lib/dudas.ts
// para no arrastrar al cliente lo del servidor (zonas, registro).

/**
 * Lo que se manda al guardar: solo las dudas que este familiar cambió. Lo que
 * no viaja queda como estaba (la API junta con lo guardado), así dos personas
 * contestando a la vez no se pisan. Un campo que tenía texto y quedó vacío va
 * marcado `borrar`; `antes` es lo que decía al abrir la pantalla, y si otro lo
 * cambió mientras tanto, la API no lo borra.
 */
export function pedidosDeLoQueCambio(
  dudas: { id: string }[],
  iniciales: Record<string, string>,
  valores: Record<string, string>,
): PedidoRespuesta[] {
  const pedidos: PedidoRespuesta[] = [];
  for (const d of dudas) {
    const antes = (iniciales[d.id] ?? "").trim();
    const ahora = (valores[d.id] ?? "").trim();
    if (ahora === antes) continue;
    pedidos.push(ahora === "" ? { dudaId: d.id, texto: "", borrar: true, antes } : { dudaId: d.id, texto: ahora, antes });
  }
  return pedidos;
}
