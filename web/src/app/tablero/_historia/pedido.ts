import type { SupabaseClient } from "@supabase/supabase-js";
import { productosDelPedido } from "@/lib/productos";

// Lo que la cabecera y «Tu pedido» necesitan saber de lo comprado (rediseño
// 2026-10, fase 2): qué compró la familia dueña (para las líneas y para saber
// si hay «Impreso en casa»), si el libro ya está (un pedido `entregado`: la
// fábrica lo terminó) y si el impreso llegó (`entregas.estado = 'entregado'`).
// Dos consultas en la misma ronda, que salen junto con las de la página. Nunca
// rechaza: si la base falla, la línea de tiempo sale sin esos dos pasos hechos.

export type DatosPedido = {
  impresos: number;
  marcos: number;
  libroEntregado: boolean;
  impresoEnCasa: boolean;
  /** Hay algo que viaja y todavía no salió: la dirección se puede cambiar en Encargar libro. */
  direccionEditable: boolean;
};

const VACIO: DatosPedido = { impresos: 0, marcos: 0, libroEntregado: false, impresoEnCasa: false, direccionEditable: false };
const DIRECCION_EDITABLE = ["sin_direccion", "lista", "con_problema"];

type FilaPedido = { estado: string; extras: unknown; familia_id: string };

export function resumirPedido(pedidos: FilaPedido[], entregas: { estado: string }[], familiaId: string): DatosPedido {
  const propios = pedidos.filter((p) => p.familia_id === familiaId && p.estado !== "fallido" && p.estado !== "pendiente");
  const productos = propios.map((p) => productosDelPedido(p.extras));
  return {
    impresos: productos.reduce((s, p) => s + (p.impreso ? Math.max(1, p.copias) : 0), 0),
    marcos: productos.reduce((s, p) => s + p.marcos, 0),
    libroEntregado: propios.some((p) => p.estado === "entregado"),
    impresoEnCasa: entregas.some((e) => e.estado === "entregado"),
    direccionEditable: entregas.some((e) => DIRECCION_EDITABLE.includes(e.estado)),
  };
}

export async function leerPedido(admin: SupabaseClient, n: { id: string; familia_id: string }): Promise<DatosPedido> {
  try {
    const [pedidos, entregas] = await Promise.all([
      admin.from("pedidos").select("estado, extras, familia_id").eq("narrador_id", n.id),
      admin.from("entregas").select("estado").eq("narrador_id", n.id).eq("familia_id", n.familia_id),
    ]);
    if (pedidos.error) return VACIO;
    // Sin la tabla de entregas (o con un error), como si no hubiera envío todavía.
    return resumirPedido((pedidos.data as FilaPedido[] | null) ?? [], entregas.error ? [] : ((entregas.data as { estado: string }[] | null) ?? []), n.familia_id);
  } catch {
    return VACIO;
  }
}
