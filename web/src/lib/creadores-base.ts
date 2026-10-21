import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DIAS_EN_ESPERA,
  codigoCreadorValido,
  creadoresPrendido,
  estadoDeComision,
  finDeLaEspera,
  generarTokenPanel,
  importeComision,
  normalizarCodigoCreador,
  resumenDeComisiones,
  type AltaCreador,
  type CreadorEnLaCompra,
  type FilaComision,
  type FilaCreador,
  type PorMoneda,
} from "./creadores";
import { aplicarCupon, type MotivoRechazo } from "./cupon";
import { promoPorcentaje } from "./promo";
import type { Catalogo, Compra } from "./productos";
import { esTablaAusente } from "./tabla-ausente";
import { regionDeIdioma } from "./idioma-web";
import { enviarMailSocios, urlBaseMail } from "./mail";
import { enviarMailBienvenidaCreador, enviarMailCreadorRecibido } from "./mail-creadores";

// Lo que el programa de creadores hace con la base (tablas `creadores` y
// `comisiones_creadores`, migración 20261021000000, supabase/CONTRATO.md
// «Programa de creadores»). Las reglas puras viven en ./creadores.ts.

export const COLUMNAS_CREADOR =
  "id, created_at, nombre, email, red, perfil, seguidores, mensaje, region, idioma, estado, codigo, comision, descuento, token_panel, aprobado_at, notas";
export const COLUMNAS_COMISION = "id, created_at, creador_id, pedido_id, codigo, total, moneda, porcentaje, importe, estado, pagada_at, anulada_at";

/** Altas nuevas por IP y por hora. */
const ALTAS_POR_IP_Y_HORA = 5;

export type FallaBase = "tabla_ausente" | "base";
export type ResultadoBase<T> = { ok: true; valor: T } | { ok: false; falla: FallaBase | "freno" };

const fallaDe = (error: unknown): { ok: false; falla: FallaBase } => ({
  ok: false,
  falla: esTablaAusente(error as { code?: string; message?: string }) ? "tabla_ausente" : "base",
});

// ── El código en la compra ────────────────────────────────────────────────

/** El creador ACTIVO con ese código, o null (pendiente, pausado o rechazado no valen). */
export async function buscarCreadorActivo(admin: SupabaseClient, codigo: string): Promise<ResultadoBase<FilaCreador | null>> {
  const { data, error } = await admin.from("creadores").select(COLUMNAS_CREADOR).eq("codigo", codigo).eq("estado", "activo").maybeSingle();
  if (error) return fallaDe(error);
  return { ok: true, valor: (data as FilaCreador | null) ?? null };
}

/**
 * El código de un creador aplicado a una compra ya calculada (lo llama
 * `cuponParaLaCompra`, el mismo casillero que el cupón de bienvenida). Con
 * descuento se resta del libro digital igual que el cupón; sin libro digital,
 * o con descuento 0, la compra va sin descuento pero el código igual atribuye
 * la venta. No se suma con la promo global.
 */
export async function creadorParaLaCompra(
  admin: SupabaseClient,
  crudo: unknown,
  compra: Compra,
  cat: Pick<Catalogo, "base" | "moneda">,
): Promise<{ ok: true; compra: Compra } | { ok: false; motivo: MotivoRechazo } | { ok: false; falla: FallaBase }> {
  if (!creadoresPrendido()) return { ok: false, motivo: "no_existe" };
  const codigo = normalizarCodigoCreador(crudo);
  if (!codigo) return { ok: false, motivo: "no_existe" };
  const fila = await buscarCreadorActivo(admin, codigo);
  if (!fila.ok) return { ok: false, falla: fila.falla === "freno" ? "base" : fila.falla };
  const c = fila.valor;
  if (!c || !c.codigo || c.comision === null || c.descuento === null) return { ok: false, motivo: "no_existe" };
  if (promoPorcentaje() !== null) return { ok: false, motivo: "con_promo" };
  const creador: CreadorEnLaCompra = { id: c.id, codigo: c.codigo, comision: c.comision, descuento: c.descuento };
  const conDescuento = c.descuento > 0 ? aplicarCupon(compra, cat, { codigo: c.codigo, porcentaje: c.descuento }) : null;
  return { ok: true, compra: { ...(conDescuento ?? compra), creador } };
}

// ── Cuando el pago entra ──────────────────────────────────────────────────

/**
 * El pago entró (confirmarPago) y el pedido llevaba el código de un creador:
 * nace su comisión, con el porcentaje congelado en la compra. Una por pedido
 * (`pedido_id` único): si el webhook reintenta, el insert choca y no pasa nada.
 * Nunca tira: el cobro ya está hecho. Si falla, se loguea y se avisa a los socios.
 */
export async function registrarComision(
  admin: SupabaseClient,
  pedido: { id: string; total: number; moneda: string },
  creador: { id: string; codigo: string; comision: number },
  ahora = new Date(),
): Promise<void> {
  try {
    const { error } = await admin.from("comisiones_creadores").insert({
      creador_id: creador.id,
      pedido_id: pedido.id,
      codigo: creador.codigo,
      total: pedido.total,
      moneda: pedido.moneda,
      porcentaje: creador.comision,
      importe: importeComision(pedido.total, pedido.moneda, creador.comision),
      created_at: ahora.toISOString(),
    });
    if (error && (error as { code?: string }).code !== "23505") throw new Error(error.message);
  } catch (err) {
    const aviso = `El pedido ${pedido.id} se pagó con el código ${creador.codigo} (creador ${creador.id}), pero no pude anotar su comisión. Hay que cargarla a mano.`;
    console.error(`creadores: ${aviso}`, err);
    await enviarMailSocios("Comisión de creador sin anotar", aviso).catch(() => false);
  }
}

// ── El alta (/colabora) ───────────────────────────────────────────────────

export type PedidoDeAlta = {
  alta: AltaCreador;
  /** El texto exacto de la casilla que marcó y su versión: la prueba del consentimiento. */
  consentimiento: { textos: string[]; version: string; userAgent?: string };
  ip: string | null;
};

/**
 * Anota a un creador como pendiente. Si el correo ya está (en cualquier
 * estado), no se duplica ni se le manda nada: la ruta contesta lo mismo, así
 * nadie averigua quién se anotó. Freno: 5 altas por IP y por hora. Si es
 * nuevo, mail al creador («lo recibimos») y a los socios (con el link al panel).
 */
export async function anotarCreador(admin: SupabaseClient, p: PedidoDeAlta, ahora = new Date()): Promise<ResultadoBase<"nuevo" | "nada">> {
  const { alta } = p;
  if (p.ip) {
    const desde = new Date(ahora.getTime() - 60 * 60 * 1000).toISOString();
    const { count, error } = await admin.from("creadores").select("id", { count: "exact", head: true }).eq("ip", p.ip).gte("created_at", desde);
    if (error) return fallaDe(error);
    if ((count ?? 0) >= ALTAS_POR_IP_Y_HORA) return { ok: false, falla: "freno" };
  }
  const { data, error } = await admin
    .from("creadores")
    .insert({
      nombre: alta.nombre,
      email: alta.email,
      red: alta.red,
      perfil: alta.perfil,
      seguidores: alta.seguidores || null,
      mensaje: alta.mensaje || null,
      region: regionDeIdioma(alta.idioma),
      idioma: alta.idioma,
      consentimiento: { ...p.consentimiento, fecha: ahora.toISOString() },
      ip: p.ip,
    })
    .select(COLUMNAS_CREADOR)
    .single();
  if (error) {
    // El correo ya estaba: lo mismo que un alta nueva, sin mails.
    if ((error as { code?: string }).code === "23505") return { ok: true, valor: "nada" };
    return fallaDe(error);
  }
  const fila = data as FilaCreador;
  try {
    await enviarMailCreadorRecibido(fila);
  } catch (err) {
    console.error(`creadores: se anotó ${fila.id} pero no salió el mail de «lo recibimos»:`, err);
  }
  await enviarMailSocios(`Colabora · ${alta.nombre} se anotó como creador`, mailAltaSocios(fila));
  return { ok: true, valor: "nuevo" };
}

const PAIS = { es: "España (castellano, de tú)", ca: "España (catalán)", ar: "Argentina (de vos)" } as const;

/** El aviso a los socios de un alta nueva: los datos y el link al panel. */
export function mailAltaSocios(c: Pick<FilaCreador, "nombre" | "email" | "red" | "perfil" | "seguidores" | "mensaje" | "idioma">): string {
  const linea = (etiqueta: string, valor: string | null) => `${etiqueta}: ${valor || "(no lo puso)"}`;
  return [
    "Se anotó un creador nuevo en /colabora. Queda pendiente hasta que lo aprueben.",
    "",
    linea("Nombre", c.nombre),
    linea("Correo", c.email),
    linea("Red", c.red),
    linea("Perfil", c.perfil),
    linea("Seguidores", c.seguidores),
    linea("Web", PAIS[c.idioma]),
    "",
    "Mensaje:",
    c.mensaje || "(no escribió nada)",
    "",
    `Para aprobarlo o rechazarlo: ${urlBaseMail()}/admin/creadores`,
  ].join("\n");
}

// ── El panel de la empresa (/admin/creadores) ─────────────────────────────

export type ErrorAdmin = { error: string };

/** ¿El código ya lo tiene otro creador? */
async function codigoOcupado(admin: SupabaseClient, codigo: string, salvoId: string): Promise<ResultadoBase<boolean>> {
  const { data, error } = await admin.from("creadores").select("id").eq("codigo", codigo).maybeSingle();
  if (error) return fallaDe(error);
  const otro = (data as { id: string } | null)?.id;
  return { ok: true, valor: Boolean(otro && otro !== salvoId) };
}

/**
 * Aprobar a un pendiente: su código (validado y libre), comisión y descuento,
 * el token de su panel, `activo`, y el mail de bienvenida. Compare-and-swap
 * sobre `estado = 'pendiente'`: dos socios aprobando a la vez mandan un solo mail.
 */
export async function aprobarCreador(
  admin: SupabaseClient,
  id: string,
  datos: { codigo: string; comision: number; descuento: number },
  ahora = new Date(),
): Promise<{ ok: true } | ErrorAdmin> {
  if (!codigoCreadorValido(datos.codigo)) return { error: "El código tiene que tener de 3 a 20 letras o números, sin VITACORA10 adelante." };
  const ocupado = await codigoOcupado(admin, datos.codigo, id);
  if (!ocupado.ok) return { error: "No pude revisar el código. Probá de nuevo." };
  if (ocupado.valor) return { error: `El código ${datos.codigo} ya lo tiene otro creador.` };
  const { data, error } = await admin
    .from("creadores")
    .update({
      estado: "activo",
      codigo: datos.codigo,
      comision: datos.comision,
      descuento: datos.descuento,
      token_panel: generarTokenPanel(),
      aprobado_at: ahora.toISOString(),
    })
    .eq("id", id)
    .eq("estado", "pendiente")
    .select(COLUMNAS_CREADOR);
  if (error) {
    if ((error as { code?: string }).code === "23505") return { error: `El código ${datos.codigo} ya lo tiene otro creador.` };
    console.error("creadores: no pude aprobar", error);
    return { error: "No se pudo guardar. Probá de nuevo." };
  }
  const fila = (data as FilaCreador[] | null)?.[0];
  if (!fila) return { error: "Ese creador ya no está pendiente (¿lo aprobó otro socio?)." };
  try {
    const salio = await enviarMailBienvenidaCreador(fila);
    if (!salio) return { error: "Quedó aprobado, pero no salió el mail de bienvenida (¿RESEND_API_KEY?). Mandale el link del panel a mano." };
  } catch (err) {
    console.error(`creadores: aprobé ${id} pero no salió el mail de bienvenida:`, err);
    return { error: "Quedó aprobado, pero no salió el mail de bienvenida. Mandale el link del panel a mano." };
  }
  return { ok: true };
}

/** Cambiar el código, la comisión o el descuento de un activo o pausado (las ventas viejas no cambian). */
export async function cambiarCreador(
  admin: SupabaseClient,
  id: string,
  datos: { codigo: string; comision: number; descuento: number; notas: string | null },
): Promise<{ ok: true } | ErrorAdmin> {
  if (!codigoCreadorValido(datos.codigo)) return { error: "El código tiene que tener de 3 a 20 letras o números, sin VITACORA10 adelante." };
  const ocupado = await codigoOcupado(admin, datos.codigo, id);
  if (!ocupado.ok) return { error: "No pude revisar el código. Probá de nuevo." };
  if (ocupado.valor) return { error: `El código ${datos.codigo} ya lo tiene otro creador.` };
  const { data, error } = await admin.from("creadores").update(datos).eq("id", id).in("estado", ["activo", "pausado"]).select("id");
  if (error) {
    console.error("creadores: no pude cambiar", error);
    return { error: "No se pudo guardar. Probá de nuevo." };
  }
  if (((data as unknown[] | null) ?? []).length === 0) return { error: "Ese creador no está activo ni pausado." };
  return { ok: true };
}

/** Pasar de un estado a otro (rechazar, pausar, reactivar), solo desde los estados que tienen sentido. */
export async function cambiarEstadoCreador(admin: SupabaseClient, id: string, a: "rechazado" | "pausado" | "activo"): Promise<{ ok: true } | ErrorAdmin> {
  const desde = a === "rechazado" ? "pendiente" : a === "pausado" ? "activo" : "pausado";
  const { data, error } = await admin.from("creadores").update({ estado: a }).eq("id", id).eq("estado", desde).select("id");
  if (error) {
    console.error("creadores: no pude cambiar el estado", error);
    return { error: "No se pudo guardar. Probá de nuevo." };
  }
  if (((data as unknown[] | null) ?? []).length === 0) return { error: `Ese creador no estaba ${desde}.` };
  return { ok: true };
}

/**
 * «Marcar pagado»: las comisiones por cobrar de ese creador pasan a pagadas,
 * con la fecha. Solo las que ya pasaron los 14 días de espera: las que siguen
 * en espera no se pagan todavía (una devolución todavía puede anularlas).
 */
export async function marcarComisionesPagadas(admin: SupabaseClient, creadorId: string, ahora = new Date()): Promise<{ ok: true; cuantas: number } | ErrorAdmin> {
  const { data, error } = await admin
    .from("comisiones_creadores")
    .update({ estado: "pagada", pagada_at: ahora.toISOString() })
    .eq("creador_id", creadorId)
    .eq("estado", "pendiente")
    .lt("created_at", finDeLaEspera(ahora).toISOString())
    .select("id");
  if (error) {
    console.error("creadores: no pude marcar pagado", error);
    return { error: "No se pudo guardar. Probá de nuevo." };
  }
  return { ok: true, cuantas: ((data as unknown[] | null) ?? []).length };
}

/** Anular una comisión (una devolución). Pendiente o pagada: si ya se pagó, queda para descontar a mano. */
export async function anularComision(admin: SupabaseClient, id: string, ahora = new Date()): Promise<{ ok: true } | ErrorAdmin> {
  const { data, error } = await admin
    .from("comisiones_creadores")
    .update({ estado: "anulada", anulada_at: ahora.toISOString() })
    .eq("id", id)
    .in("estado", ["pendiente", "pagada"])
    .select("id");
  if (error) {
    console.error("creadores: no pude anular", error);
    return { error: "No se pudo guardar. Probá de nuevo." };
  }
  if (((data as unknown[] | null) ?? []).length === 0) return { error: "Esa comisión ya estaba anulada." };
  return { ok: true };
}

/** Todo lo del panel de la empresa: los creadores y sus comisiones, las más nuevas primero. */
export async function datosCreadores(admin: SupabaseClient): Promise<ResultadoBase<{ creadores: FilaCreador[]; comisiones: FilaComision[] }>> {
  const [c, k] = await Promise.all([
    admin.from("creadores").select(COLUMNAS_CREADOR).order("created_at", { ascending: false }).limit(1000),
    admin.from("comisiones_creadores").select(COLUMNAS_COMISION).order("created_at", { ascending: false }).limit(2000),
  ]);
  if (c.error) return fallaDe(c.error);
  if (k.error) return fallaDe(k.error);
  return { ok: true, valor: { creadores: (c.data as FilaCreador[] | null) ?? [], comisiones: (k.data as FilaComision[] | null) ?? [] } };
}

// ── El panel del creador (/creador/<token>) ───────────────────────────────

/**
 * El creador de ese token y sus comisiones (sin las anuladas, sin ningún dato
 * del cliente: ni el pedido sale). null si el token no existe o el creador no
 * está activo ni pausado.
 */
export async function panelDelCreador(
  admin: SupabaseClient,
  token: string,
): Promise<ResultadoBase<{ creador: FilaCreador; ventas: Pick<FilaComision, "created_at" | "moneda" | "importe" | "estado">[] } | null>> {
  const { data, error } = await admin.from("creadores").select(COLUMNAS_CREADOR).eq("token_panel", token).in("estado", ["activo", "pausado"]).maybeSingle();
  if (error) return fallaDe(error);
  const creador = data as FilaCreador | null;
  if (!creador) return { ok: true, valor: null };
  const { data: filas, error: errorFilas } = await admin
    .from("comisiones_creadores")
    .select("created_at, moneda, importe, estado")
    .eq("creador_id", creador.id)
    .in("estado", ["pendiente", "pagada"])
    .order("created_at", { ascending: false })
    .limit(500);
  if (errorFilas) return fallaDe(errorFilas);
  return { ok: true, valor: { creador, ventas: (filas as Pick<FilaComision, "created_at" | "moneda" | "importe" | "estado">[] | null) ?? [] } };
}

// ── El resumen mensual ────────────────────────────────────────────────────

const plata = (p: PorMoneda) =>
  Object.entries(p)
    .map(([moneda, n]) => `${moneda === "ARS" ? Math.round(n).toLocaleString("es-AR") : n.toFixed(2).replace(".", ",")} ${moneda}`)
    .join(" + ");

type PendienteResumen = Pick<FilaComision, "creador_id" | "estado" | "created_at" | "moneda" | "importe">;

/**
 * El mail del día 1 a los socios: por creador, lo que ya se puede pagar (las
 * comisiones que pasaron los 14 días de espera), cuántas ventas, lo que sigue
 * en espera y su correo para pedirle los datos. Un creador con todo en espera
 * no sale: se paga el mes que viene. null si no hay nada para pagar.
 */
export function textoResumenMensual(creadores: Pick<FilaCreador, "id" | "nombre" | "email" | "codigo">[], pendientes: PendienteResumen[], ahora = new Date()): string | null {
  const bloques: string[] = [];
  for (const c of creadores) {
    const suyas = pendientes.filter((k) => k.creador_id === c.id && k.estado === "pendiente");
    const listas = suyas.filter((k) => estadoDeComision(k, ahora) === "por_cobrar");
    if (listas.length === 0) continue;
    const r = resumenDeComisiones(suyas, ahora);
    const espera = Object.keys(r.enEspera).length > 0 ? `\n  En espera (todavía no se paga): ${plata(r.enEspera)}` : "";
    bloques.push(`${c.nombre} (código ${c.codigo ?? "—"})\n  Para pagar: ${plata(r.porCobrar)}\n  Ventas: ${listas.length}${espera}\n  Correo para pedirle los datos: ${c.email}`);
  }
  if (bloques.length === 0) return null;
  return [
    `Comisiones de creadores para pagar (las que ya pasaron los ${DIAS_EN_ESPERA} días de espera).`,
    "",
    ...bloques.flatMap((b) => [b, ""]),
    `Cuando las paguen, márquenlas en ${urlBaseMail()}/admin/creadores («Marcar pagado» paga solo las que pasaron la espera).`,
  ].join("\n");
}

/** El cron mensual: arma el resumen y, si hay algo para pagar (pasada la espera), lo manda. */
export async function mandarResumenMensual(admin: SupabaseClient, ahora = new Date()): Promise<ResultadoBase<{ creadores: number; enviado: boolean }>> {
  const { data: pendientes, error } = await admin.from("comisiones_creadores").select("creador_id, estado, created_at, moneda, importe").eq("estado", "pendiente").limit(5000);
  if (error) return fallaDe(error);
  const filas = (pendientes as PendienteResumen[] | null) ?? [];
  // Solo los creadores con algo que ya pasó la espera; el resto se paga el mes que viene.
  const ids = [...new Set(filas.filter((f) => estadoDeComision(f, ahora) === "por_cobrar").map((f) => f.creador_id))];
  if (ids.length === 0) return { ok: true, valor: { creadores: 0, enviado: false } };
  const { data: creadores, error: errorCreadores } = await admin.from("creadores").select("id, nombre, email, codigo").in("id", ids);
  if (errorCreadores) return fallaDe(errorCreadores);
  const texto = textoResumenMensual((creadores as Pick<FilaCreador, "id" | "nombre" | "email" | "codigo">[] | null) ?? [], filas, ahora);
  if (!texto) return { ok: true, valor: { creadores: 0, enviado: false } };
  const enviado = await enviarMailSocios("Comisiones de creadores pendientes", texto);
  return { ok: true, valor: { creadores: ids.length, enviado } };
}
