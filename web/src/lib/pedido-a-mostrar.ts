import type { SupabaseClient } from "@supabase/supabase-js";

// Qué pedido decide lo que ve la página de descarga y sus rutas (PDF,
// audiolibro, lector online).
//
// Sobre un mismo narrador puede haber varios pedidos: el de la dueña, los
// extras que compró después, la copia de un visitante (CONTRATO.md: un pedido
// por comprador). Tomar "el más nuevo" era un error: un checkout abandonado
// en 'pendiente' por un desconocido escondía el libro ya entregado de la
// dueña. Manda el 'entregado' más nuevo; solo si no hay ninguno, el más nuevo
// de cualquier estado — eso es para las pantallas de estado (pagado,
// generando, fallido, pendiente), no para servir archivos.

// `completo` es opcional: desde el 19/09 la fábrica no sube
// `audiolibro_completo.mp3` cuando pasa los 50 MB; quedan los capítulos.
export type AudiolibroPaths = { capitulos: string[]; bonus?: string; completo?: string };

export type PedidoDescarga = {
  id: string;
  estado: string;
  libro_pdf_path: string | null;
  audiolibro_paths: AudiolibroPaths | null;
};

const COLUMNAS = "id, estado, libro_pdf_path, audiolibro_paths";

type Resultado = { pedido: PedidoDescarga | null; error: { message: string } | null };

export async function pedidoAMostrar(admin: SupabaseClient, narradorId: string): Promise<Resultado> {
  const { data: entregados, error: errorEntregados } = await admin
    .from("pedidos")
    .select(COLUMNAS)
    .eq("narrador_id", narradorId)
    .eq("estado", "entregado")
    .order("created_at", { ascending: false })
    .limit(1);
  if (errorEntregados) return { pedido: null, error: errorEntregados };

  const entregado = (entregados as PedidoDescarga[] | null)?.[0];
  if (entregado) return { pedido: entregado, error: null };

  const { data: pedidos, error: errorPedidos } = await admin
    .from("pedidos")
    .select(COLUMNAS)
    .eq("narrador_id", narradorId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (errorPedidos) return { pedido: null, error: errorPedidos };

  return { pedido: (pedidos as PedidoDescarga[] | null)?.[0] ?? null, error: null };
}
