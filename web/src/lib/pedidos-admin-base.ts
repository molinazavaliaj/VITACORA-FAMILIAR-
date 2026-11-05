// Lo que /admin/pedidos hace con la base. Las reglas viven en ./pedidos-admin.ts. Todo con
// la service role, desde el servidor (RLS prendido y sin políticas en `entregas`).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EstadoEntrega } from "./entregas";
import type { EntregaAdmin, PedidoAdmin } from "./pedidos-admin";
import { esTablaAusente } from "./tabla-ausente";

const COLUMNAS_ENTREGA =
  "id, estado, origen, destinatario_nombre, destinatario_telefono, destinatario_email, direccion, nota, transportista, seguimiento, seguimiento_url, peso_g, dimensiones, problema, direccion_at, produccion_at, impreso_at, enviado_at, entregado_at";

// `modo:contexto->>modo` trae solo el modo: el contexto entero de un narrador es grande.
const SELECCION = `id, numero, estado, monto, moneda, proveedor, extras, created_at, familia_id, narrador_id, comprador:familias(nombre, email, region), narrador:narradores(nombre, como_le_dicen, modo:contexto->>modo), entrega:entregas(${COLUMNAS_ENTREGA})`;

/** Más que esto no entra en una pantalla; si un día se llega, se pagina. */
const TOPE = 1000;

export type FallaPedidos = "sin_migracion" | "base";
export type Lectura<T> = { ok: true; valor: T } | { ok: false; falla: FallaPedidos };

/** La columna `numero` o la tabla `entregas` todavía no están: falta aplicar la migración. */
function fallaDe(error: { code?: string; message?: string }): { ok: false; falla: FallaPedidos } {
  const ausente = esTablaAusente(error) || error.code === "42703" || /relationship between/i.test(error.message ?? "");
  if (!ausente) console.error("pedidos-admin: no pude leer los pedidos:", error.message);
  return { ok: false, falla: ausente ? "sin_migracion" : "base" };
}

/** PostgREST trae `entrega` como objeto porque `pedido_id` es único; se acepta la lista por las dudas. */
const uno = <T>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

function aPedido(fila: Record<string, unknown>): PedidoAdmin {
  return {
    ...(fila as unknown as PedidoAdmin),
    monto: fila.monto === null || fila.monto === undefined ? null : Number(fila.monto),
    extras: (fila.extras as Record<string, unknown> | null) ?? {},
    comprador: uno(fila.comprador as PedidoAdmin["comprador"]),
    narrador: uno(fila.narrador as PedidoAdmin["narrador"]),
    entrega: uno(fila.entrega as EntregaAdmin | null),
  };
}

export async function leerPedidos(admin: SupabaseClient): Promise<Lectura<PedidoAdmin[]>> {
  const { data, error } = await admin.from("pedidos").select(SELECCION).order("created_at", { ascending: false }).limit(TOPE);
  if (error) return fallaDe(error);
  return { ok: true, valor: ((data ?? []) as unknown as Record<string, unknown>[]).map(aPedido) };
}

export async function leerPedido(admin: SupabaseClient, id: string): Promise<Lectura<PedidoAdmin | null>> {
  const { data, error } = await admin.from("pedidos").select(SELECCION).eq("id", id).maybeSingle();
  if (error) return fallaDe(error);
  return { ok: true, valor: data ? aPedido(data as unknown as Record<string, unknown>) : null };
}

/**
 * ¿Ya salió el mail de ese hito? La fábrica deja un candado en Storage solo cuando Resend lo
 * confirmó (fabrica/src/entregas.ts). null si no se pudo mirar: no se afirma nada.
 */
export async function mailDeEntregaSalio(admin: SupabaseClient, narradorId: string, entregaId: string, hito: "enviado" | "entregado"): Promise<boolean | null> {
  try {
    const nombre = `entrega_${entregaId}_${hito}.txt`;
    const { data, error } = await admin.storage.from("audios").list(`${narradorId}/paquete`, { search: nombre });
    if (error) return null;
    return (data ?? []).some((archivo) => archivo.name === nombre);
  } catch {
    return null;
  }
}

export type ResultadoEscritura = { ok: true } | { error: string };

const SE_MOVIO: ResultadoEscritura = { error: "Esta entrega cambió mientras tanto (quizá la familia marcó que le llegó). Recargá la página." };

/**
 * Guarda los cambios solo si la entrega sigue en el estado que se vio. Todo va en un solo
 * update: el mail de la fábrica lee el seguimiento apenas ve `enviado`, así que no puede
 * haber un momento con el estado cambiado y el número todavía sin escribir.
 */
export async function cambiarEntrega(admin: SupabaseClient, entregaId: string, estadoVisto: EstadoEntrega, cambios: Record<string, unknown>): Promise<ResultadoEscritura> {
  const { data, error } = await admin.from("entregas").update(cambios).eq("id", entregaId).eq("estado", estadoVisto).select("id");
  if (error) {
    console.error(`pedidos-admin: no pude guardar la entrega ${entregaId}:`, error.message);
    return { error: "No se pudo guardar. Probá de nuevo." };
  }
  return ((data as unknown[] | null) ?? []).length > 0 ? { ok: true } : SE_MOVIO;
}

/** La fila que confirmarPago no pudo crear. `pedido_id` es único: dos clics no hacen dos entregas. */
export async function crearEntregaFaltante(admin: SupabaseClient, p: Pick<PedidoAdmin, "id" | "narrador_id" | "familia_id" | "comprador">): Promise<ResultadoEscritura> {
  const { error } = await admin.from("entregas").insert({
    pedido_id: p.id,
    narrador_id: p.narrador_id,
    familia_id: p.familia_id,
    estado: "sin_direccion",
    origen: p.comprador?.region === "ES" ? "ES" : "AR",
  });
  if (!error || error.code === "23505") return { ok: true };
  console.error(`pedidos-admin: no pude crear la entrega del pedido ${p.id}:`, error.message);
  return { error: "No se pudo crear la entrega. Probá de nuevo." };
}
