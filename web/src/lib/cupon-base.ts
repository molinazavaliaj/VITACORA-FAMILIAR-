import type { SupabaseClient } from "@supabase/supabase-js";
import { aplicarCupon, generarCodigoCupon, normalizarCodigo, rascaPrendido, recordatorioQueToca, validarCupon, venceEl, vigente, type FilaCupon, type MotivoRechazo } from "./cupon";
import { promoPorcentaje } from "./promo";
import type { Catalogo, Compra } from "./productos";
import { esTablaAusente } from "./tabla-ausente";
import type { IdiomaWeb } from "./idioma-web";
import type { Region } from "./precios";
import { enviarMailConfirmarCupon, enviarMailCupon, enviarMailRecordatorio } from "./mail-cupon";

// Lo que el cupón de bienvenida hace con la base (tabla `cupones`, migración
// 20261020000000, supabase/CONTRATO.md «Cupón de bienvenida»). Las reglas
// puras viven en ./cupon.ts.

const COLUMNAS =
  "id, codigo, email, region, idioma, porcentaje, acepta_recordatorios, created_at, confirmado_at, vence_el, recordatorios_enviados, ultimo_recordatorio_at, baja_at, usado_at";

/** Entre dos mails pedidos desde el popup, al menos 10 minutos; y como mucho 5 en total. */
const ESPERA_ENTRE_MAILS_MS = 10 * 60 * 1000;
const MAILS_MAXIMOS = 5;
/** Pedidos de cupón nuevos por IP y por hora. */
const NUEVOS_POR_IP_Y_HORA = 5;

export type ResultadoBase<T> = { ok: true; valor: T } | { ok: false; falla: "tabla_ausente" | "base" | "freno" };

const fallaDe = (error: unknown): { ok: false; falla: "tabla_ausente" | "base" } => ({
  ok: false,
  falla: esTablaAusente(error as { code?: string; message?: string }) ? "tabla_ausente" : "base",
});

export async function buscarCuponPorCodigo(admin: SupabaseClient, codigo: string): Promise<ResultadoBase<FilaCupon | null>> {
  const { data, error } = await admin.from("cupones").select(COLUMNAS).eq("codigo", codigo).maybeSingle();
  if (error) return fallaDe(error);
  return { ok: true, valor: (data as FilaCupon | null) ?? null };
}

export async function buscarCuponPorId(admin: SupabaseClient, id: string): Promise<ResultadoBase<FilaCupon | null>> {
  const { data, error } = await admin.from("cupones").select(COLUMNAS).eq("id", id).maybeSingle();
  if (error) return fallaDe(error);
  return { ok: true, valor: (data as FilaCupon | null) ?? null };
}

/** Lo que mandó el popup, ya validado por la ruta. */
export type PedidoDeCupon = {
  email: string;
  region: Region;
  idioma: IdiomaWeb;
  aceptaRecordatorios: boolean;
  /** Los textos exactos que vio (las dos casillas) y su versión: la prueba del consentimiento. */
  consentimiento: { textos: string[]; version: string; userAgent?: string };
  ip: string | null;
};

/**
 * Pide el cupón. Una fila por correo y por país, para siempre. Si es nueva, o
 * si todavía no la confirmó, sale el mail de confirmar; si ya la confirmó y el
 * cupón sigue sirviendo, se le vuelve a mandar el código. Nunca dice cuál fue
 * el caso (la ruta contesta siempre lo mismo: nadie averigua si un correo pidió
 * el cupón). Frenos: 5 cupones nuevos por IP y por hora; 10 minutos entre dos
 * mails al mismo correo y 5 en total.
 */
export async function pedirCupon(admin: SupabaseClient, p: PedidoDeCupon, ahora = new Date()): Promise<ResultadoBase<"nuevo" | "reenviado" | "nada">> {
  const { data: previa, error: errorPrevia } = await admin.from("cupones").select(`${COLUMNAS}, confirmaciones_enviadas, confirmacion_enviada_at`).eq("email", p.email).eq("region", p.region).maybeSingle();
  if (errorPrevia) return fallaDe(errorPrevia);
  const fila = previa as (FilaCupon & { confirmaciones_enviadas: number; confirmacion_enviada_at: string | null }) | null;

  const consentimiento = { ...p.consentimiento, fecha: ahora.toISOString() };

  if (!fila) {
    if (p.ip) {
      const desde = new Date(ahora.getTime() - 60 * 60 * 1000).toISOString();
      const { count, error } = await admin.from("cupones").select("id", { count: "exact", head: true }).eq("ip", p.ip).gte("created_at", desde);
      if (error) return fallaDe(error);
      if ((count ?? 0) >= NUEVOS_POR_IP_Y_HORA) return { ok: false, falla: "freno" };
    }
    // El código es único: si choca (casi imposible), se prueba otro. Si choca el
    // correo (dos pedidos a la vez), el otro ya mandó el mail.
    for (let intento = 0; intento < 5; intento++) {
      const { data, error } = await admin
        .from("cupones")
        .insert({
          codigo: generarCodigoCupon(),
          email: p.email,
          region: p.region,
          idioma: p.idioma,
          acepta_recordatorios: p.aceptaRecordatorios,
          consentimiento,
          ip: p.ip,
          confirmaciones_enviadas: 1,
          confirmacion_enviada_at: ahora.toISOString(),
        })
        .select(COLUMNAS)
        .single();
      if (!error && data) {
        await enviarMailConfirmarCupon(p.email, data as FilaCupon);
        return { ok: true, valor: "nuevo" };
      }
      const code = (error as { code?: string; message?: string } | null)?.code;
      const mensaje = (error as { message?: string } | null)?.message ?? "";
      if (code === "23505" && /email/.test(mensaje)) return { ok: true, valor: "nada" };
      if (code !== "23505") return fallaDe(error);
    }
    console.error("cupon: cinco códigos repetidos seguidos");
    return { ok: false, falla: "base" };
  }

  // Ya pidió antes: freno de mails.
  const ultimo = fila.confirmacion_enviada_at ? new Date(fila.confirmacion_enviada_at).getTime() : 0;
  if (fila.confirmaciones_enviadas >= MAILS_MAXIMOS || ahora.getTime() - ultimo < ESPERA_ENTRE_MAILS_MS) return { ok: true, valor: "nada" };
  // Ya usado o vencido: no se manda nada (el cupón no se regenera).
  if (fila.usado_at || (fila.confirmado_at && fila.vence_el && !vigente(fila.vence_el, fila.region, ahora))) return { ok: true, valor: "nada" };

  // Compare-and-swap sobre el contador: dos pedidos a la vez mandan un solo mail.
  const cambios: Record<string, unknown> = {
    confirmaciones_enviadas: fila.confirmaciones_enviadas + 1,
    confirmacion_enviada_at: ahora.toISOString(),
  };
  // Sin confirmar, vale lo último que eligió (y su prueba). Ya confirmado, el
  // consentimiento no se cambia desde acá: quien escribe el correo puede no ser su dueño.
  if (!fila.confirmado_at) Object.assign(cambios, { acepta_recordatorios: p.aceptaRecordatorios, consentimiento, ip: p.ip, idioma: p.idioma });
  const { data: tomadas, error: errorTomar } = await admin
    .from("cupones")
    .update(cambios)
    .eq("id", fila.id)
    .eq("confirmaciones_enviadas", fila.confirmaciones_enviadas)
    .select(COLUMNAS);
  if (errorTomar) return fallaDe(errorTomar);
  const tomada = (tomadas as FilaCupon[] | null)?.[0];
  if (!tomada) return { ok: true, valor: "nada" };

  if (!tomada.confirmado_at) await enviarMailConfirmarCupon(p.email, tomada);
  else if (tomada.vence_el) await enviarMailCupon(p.email, { ...tomada, vence_el: tomada.vence_el });
  return { ok: true, valor: "reenviado" };
}

/**
 * El botón del mail de confirmar (doble opt-in). Solo la primera vez: escribe
 * `confirmado_at` y `vence_el` y manda el mail con el código. Si ya estaba
 * confirmado, no hace nada (no vuelve a mandar el mail).
 */
export async function confirmarCupon(admin: SupabaseClient, id: string, ahora = new Date()): Promise<ResultadoBase<FilaCupon | null>> {
  const { data: fila, error } = await admin.from("cupones").select("region").eq("id", id).maybeSingle();
  if (error) return fallaDe(error);
  const region = (fila as { region?: Region } | null)?.region;
  if (!region) return { ok: true, valor: null };
  const { data: confirmadas, error: errorConfirmar } = await admin
    .from("cupones")
    .update({ confirmado_at: ahora.toISOString(), vence_el: venceEl(region, ahora) })
    .eq("id", id)
    .is("confirmado_at", null)
    .select(COLUMNAS);
  if (errorConfirmar) return fallaDe(errorConfirmar);
  const confirmada = (confirmadas as FilaCupon[] | null)?.[0];
  if (confirmada?.vence_el) {
    try {
      await enviarMailCupon(confirmada.email, { ...confirmada, vence_el: confirmada.vence_el });
    } catch (err) {
      // El cupón ya está confirmado y la página muestra el código: un mail que no sale no tumba nada.
      console.error(`cupon: se confirmó ${id} pero no salió el mail del código:`, err);
    }
  }
  return buscarCuponPorId(admin, id);
}

/** La baja de un clic. Idempotente. */
export async function darDeBajaCupon(admin: SupabaseClient, id: string, ahora = new Date()): Promise<ResultadoBase<boolean>> {
  const { error } = await admin.from("cupones").update({ baja_at: ahora.toISOString() }).eq("id", id).is("baja_at", null);
  if (error) return fallaDe(error);
  return { ok: true, valor: true };
}

/**
 * El pago entró (confirmarPago): el código queda usado por este pedido. Con
 * compare-and-swap: si otro pedido ya lo usó, este se cobró igual con el
 * descuento y se avisa en los logs. Nunca tira: el cobro ya está hecho.
 */
export async function marcarCuponUsado(admin: SupabaseClient, codigo: string, pedidoId: string, ahora = new Date()): Promise<void> {
  try {
    const { data, error } = await admin
      .from("cupones")
      .update({ usado_at: ahora.toISOString(), pedido_id: pedidoId })
      .eq("codigo", codigo)
      .is("usado_at", null)
      .select("id");
    if (error) throw new Error(error.message);
    if (((data as unknown[] | null) ?? []).length === 0) {
      console.error(`cupon: el pedido ${pedidoId} se pagó con el cupón ${codigo}, pero el cupón ya estaba usado (o no existe). Se cobró con el descuento.`);
    }
  } catch (err) {
    console.error(`cupon: el pedido ${pedidoId} se pagó con el cupón ${codigo}, pero no pude marcarlo usado:`, err);
  }
}

/**
 * El cron diario: a cada uno el recordatorio que le toca (como mucho uno por
 * día y 4 en total, ver `recordatorioQueToca`), y la limpieza (los sin
 * confirmar de más de 30 días y todos los de más de 24 meses).
 */
export async function correrRecordatorios(admin: SupabaseClient, ahora = new Date()): Promise<ResultadoBase<{ enviados: number; fallidos: number; borrados: number }>> {
  const desde = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("cupones")
    .select(COLUMNAS)
    .eq("acepta_recordatorios", true)
    .not("confirmado_at", "is", null)
    .gte("confirmado_at", desde)
    .is("baja_at", null)
    .is("usado_at", null)
    .lt("recordatorios_enviados", 4)
    .limit(500);
  if (error) return fallaDe(error);

  let enviados = 0;
  let fallidos = 0;
  for (const fila of (data as FilaCupon[] | null) ?? []) {
    const n = recordatorioQueToca(fila, ahora);
    if (!n || !fila.vence_el) continue;
    // Primero se cuenta (compare-and-swap), después se manda: si el mail falla
    // se pierde un recordatorio, pero nunca sale un quinto.
    const { data: tomadas, error: errorTomar } = await admin
      .from("cupones")
      .update({ recordatorios_enviados: n, ultimo_recordatorio_at: ahora.toISOString() })
      .eq("id", fila.id)
      .eq("recordatorios_enviados", n - 1)
      .is("baja_at", null)
      .is("usado_at", null)
      .select("id");
    if (errorTomar || ((tomadas as unknown[] | null) ?? []).length === 0) continue;
    try {
      if (await enviarMailRecordatorio(fila.email, { ...fila, vence_el: fila.vence_el }, n)) enviados++;
      else fallidos++;
    } catch (err) {
      fallidos++;
      console.error(`cupon: no salió el recordatorio ${n} del cupón ${fila.id}:`, err);
    }
  }

  let borrados = 0;
  const hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const hace24Meses = new Date(Date.UTC(ahora.getUTCFullYear() - 2, ahora.getUTCMonth(), ahora.getUTCDate())).toISOString();
  for (const consulta of [
    admin.from("cupones").delete().is("confirmado_at", null).lt("created_at", hace30).select("id"),
    admin.from("cupones").delete().lt("created_at", hace24Meses).select("id"),
  ]) {
    const { data: idos, error: errorBorrar } = await consulta;
    if (errorBorrar) console.error("cupon: falló la limpieza", errorBorrar);
    else borrados += ((idos as unknown[] | null) ?? []).length;
  }

  return { ok: true, valor: { enviados, fallidos, borrados } };
}

/**
 * El cupón que escribió la persona, aplicado a una compra ya calculada: lo usan
 * /api/compra (lo que se cobra) y /api/cupon/validar (lo que se muestra antes
 * de pagar). La cuenta es SIEMPRE del servidor.
 */
export async function cuponParaLaCompra(
  admin: SupabaseClient,
  crudo: unknown,
  compra: Compra,
  cat: Pick<Catalogo, "base" | "moneda">,
  ahora = new Date(),
): Promise<{ ok: true; compra: Compra } | { ok: false; motivo: MotivoRechazo } | { ok: false; falla: "tabla_ausente" | "base" }> {
  if (!rascaPrendido()) return { ok: false, motivo: "no_existe" };
  const codigo = normalizarCodigo(crudo);
  if (!codigo) return { ok: false, motivo: "no_existe" };
  const fila = await buscarCuponPorCodigo(admin, codigo);
  if (!fila.ok) return fila.falla === "freno" ? { ok: false, falla: "base" } : { ok: false, falla: fila.falla };
  const valido = validarCupon(fila.valor, compra.region, ahora, promoPorcentaje());
  if (!valido.ok) return valido;
  const conCupon = aplicarCupon(compra, cat, valido);
  return conCupon ? { ok: true, compra: conCupon } : { ok: false, motivo: "no_aplica" };
}
