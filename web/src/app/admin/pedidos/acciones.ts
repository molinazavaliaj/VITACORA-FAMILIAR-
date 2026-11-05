"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { esAdminQuienLlama } from "@/lib/admin/quien-llama";
import { envioDe, esHistoria, estadoAnterior, puedePasar, validarBulto, validarDespacho, type PedidoAdmin } from "@/lib/pedidos-admin";
import { cambiarEntrega, crearEntregaFaltante, leerPedido, type ResultadoEscritura } from "@/lib/pedidos-admin-base";

// Las escrituras de /admin/pedidos. Cada acción vuelve a chequear que quien llama esté en
// ADMIN_EMAILS: una server action es un endpoint suelto (se puede llamar con un POST sin
// pasar por la pantalla) y el layout de /admin NO la protege. También vuelve a leer el pedido
// y a validar el paso: no se confía en lo que la pantalla creía.

export type ResultadoPedido = { error: string | null; listo?: string };

const texto = (v: FormDataEntryValue | null): string => (typeof v === "string" ? v.trim() : "");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LARGO_PROBLEMA = 300;

async function portero(datos: FormData): Promise<{ pedido: PedidoAdmin } | ResultadoPedido> {
  if (!(await esAdminQuienLlama())) return { error: "No tenés permiso para esto." };
  const id = texto(datos.get("id"));
  if (!UUID.test(id)) return { error: "Falta el id." };
  const leido = await leerPedido(crearClienteServidor(), id);
  if (!leido.ok) return { error: "No pude leer el pedido. Probá de nuevo." };
  if (!leido.valor) return { error: "Ese pedido no existe." };
  return { pedido: leido.valor };
}

function terminar(r: ResultadoEscritura, id: string, listo: string): ResultadoPedido {
  if ("error" in r) return { error: r.error };
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  return { error: null, listo };
}

const NO_SE_PUEDE: ResultadoPedido = { error: "Este paso no se puede dar desde el estado en que está la entrega." };
const SIN_ENTREGA: ResultadoPedido = { error: "Este pedido no tiene entrega." };

export async function marcarImpreso(datos: FormData): Promise<ResultadoPedido> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const { pedido } = p;
  if (!pedido.entrega) return SIN_ENTREGA;
  if (!puedePasar(pedido.entrega.estado, "impreso", esHistoria(pedido))) return NO_SE_PUEDE;
  const r = await cambiarEntrega(crearClienteServidor(), pedido.entrega.id, pedido.entrega.estado, { estado: "impreso", impreso_at: new Date().toISOString() });
  return terminar(r, pedido.id, "Marcado como impreso.");
}

const datosDeDespacho = (datos: FormData) =>
  validarDespacho({ transportista: texto(datos.get("transportista")), seguimiento: texto(datos.get("seguimiento")), url: texto(datos.get("url")) });

export async function marcarEnviado(datos: FormData): Promise<ResultadoPedido> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const { pedido } = p;
  if (!pedido.entrega) return SIN_ENTREGA;
  if (!puedePasar(pedido.entrega.estado, "enviado", esHistoria(pedido))) return NO_SE_PUEDE;
  const despacho = datosDeDespacho(datos);
  if ("error" in despacho) return { error: despacho.error };
  const r = await cambiarEntrega(crearClienteServidor(), pedido.entrega.id, pedido.entrega.estado, { ...despacho, estado: "enviado", enviado_at: new Date().toISOString() });
  return terminar(r, pedido.id, "Marcado como enviado.");
}

/** Corrige los datos de un paquete que ya salió. No cambia el estado ni vuelve a mandar el mail. */
export async function corregirSeguimiento(datos: FormData): Promise<ResultadoPedido> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const { pedido } = p;
  if (!pedido.entrega) return SIN_ENTREGA;
  if (pedido.entrega.estado !== "enviado" && pedido.entrega.estado !== "entregado") return NO_SE_PUEDE;
  const despacho = datosDeDespacho(datos);
  if ("error" in despacho) return { error: despacho.error };
  const r = await cambiarEntrega(crearClienteServidor(), pedido.entrega.id, pedido.entrega.estado, despacho);
  return terminar(r, pedido.id, "Guardado. La familia lo ve en su panel; el mail no sale de nuevo.");
}

export async function marcarEntregado(datos: FormData): Promise<ResultadoPedido> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const { pedido } = p;
  if (!pedido.entrega) return SIN_ENTREGA;
  if (!puedePasar(pedido.entrega.estado, "entregado", esHistoria(pedido))) return NO_SE_PUEDE;
  const r = await cambiarEntrega(crearClienteServidor(), pedido.entrega.id, pedido.entrega.estado, { estado: "entregado", entregado_at: new Date().toISOString() });
  return terminar(r, pedido.id, "Marcado como entregado.");
}

export async function marcarProblema(datos: FormData): Promise<ResultadoPedido> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const { pedido } = p;
  if (!pedido.entrega) return SIN_ENTREGA;
  if (!puedePasar(pedido.entrega.estado, "con_problema", esHistoria(pedido))) return NO_SE_PUEDE;
  const problema = texto(datos.get("problema")).slice(0, LARGO_PROBLEMA);
  if (!problema) return { error: "Escribí cuál es el problema." };
  const r = await cambiarEntrega(crearClienteServidor(), pedido.entrega.id, pedido.entrega.estado, { estado: "con_problema", problema });
  return terminar(r, pedido.id, "Marcado con problema. Nadie recibe un mail por esto.");
}

export async function resolverProblema(datos: FormData): Promise<ResultadoPedido> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const { pedido } = p;
  if (pedido.entrega?.estado !== "con_problema") return NO_SE_PUEDE;
  const vuelve = estadoAnterior(pedido.entrega);
  const r = await cambiarEntrega(crearClienteServidor(), pedido.entrega.id, "con_problema", { estado: vuelve, problema: null });
  return terminar(r, pedido.id, "Problema resuelto.");
}

export async function guardarBulto(datos: FormData): Promise<ResultadoPedido> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const { pedido } = p;
  if (!pedido.entrega) return SIN_ENTREGA;
  const bulto = validarBulto(texto(datos.get("peso")), texto(datos.get("medidas")));
  if ("error" in bulto) return { error: bulto.error };
  const r = await cambiarEntrega(crearClienteServidor(), pedido.entrega.id, pedido.entrega.estado, bulto);
  return terminar(r, pedido.id, "Peso y medidas guardados.");
}

export async function crearEntrega(datos: FormData): Promise<ResultadoPedido> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const { pedido } = p;
  if (envioDe(pedido) !== "sin_fila") return { error: "Este pedido no necesita una entrega nueva." };
  return terminar(await crearEntregaFaltante(crearClienteServidor(), pedido), pedido.id, "Entrega creada. Falta que la familia cargue la dirección.");
}
