// web/src/lib/cartas.ts
// Regalo en locales (spec 2026-10-17-regalo-en-locales-design): las cartas que
// la gente se lleva gratis de una copistería. Cada una trae un código impreso
// que es de un lote, y el lote de un local. Lo que se lee de la base y las
// cuentas puras del 20 %.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Compra } from "./productos";
import { normalizarCodigo } from "./regalo";
import { esIdiomaRegalo } from "./regalo-reglas";
import type { IdiomaRegalo } from "./regalo-textos";
import { esTablaAusente } from "./tabla-ausente";

export type CodigoImpreso = {
  codigo: string;
  /** Alguien ya la pagó: es un regalo, o de otro. */
  pagado: boolean;
  localId: string;
  /** El idioma del lote: el de la carta impresa. */
  idioma: IdiomaRegalo;
  comisionPct: number;
  localActivo: boolean;
};

export async function leerCodigoImpreso(admin: SupabaseClient, codigoCrudo: string): Promise<CodigoImpreso | null> {
  const codigo = normalizarCodigo(codigoCrudo);
  if (!codigo) return null;
  const { data, error } = await admin
    .from("codigos_impresos")
    .select("codigo, pedido_id, lotes_impresos(idioma, locales(id, comision_pct, activo))")
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) {
    if (esTablaAusente(error)) console.warn("cartas: la tabla codigos_impresos todavía no existe");
    else console.error("cartas: falló leer el código impreso", error);
    return null;
  }
  const f = data as null | {
    codigo: string; pedido_id: string | null;
    lotes_impresos: { idioma: unknown; locales: { id: string; comision_pct: number | string; activo: boolean } | null } | null;
  };
  const local = f?.lotes_impresos?.locales;
  if (!f || !local) return null;
  const idioma = f.lotes_impresos?.idioma;
  return {
    codigo: f.codigo,
    pagado: f.pedido_id !== null,
    localId: local.id,
    idioma: esIdiomaRegalo(idioma) ? idioma : "es-AR",
    comisionPct: Number(local.comision_pct),
    localActivo: local.activo,
  };
}

/** Las líneas que son «el libro»: lo único sobre lo que el local cobra su parte. */
const LINEAS_DEL_LIBRO = new Set(["pdf", "impreso"]);

/** La parte del local: `pct` % del libro elegido, sin extras ni envío, en centavos. */
export function comisionDelLibro(compra: Compra, pct: number): number {
  const libro = compra.lineas
    .filter((l) => LINEAS_DEL_LIBRO.has(l.id))
    .reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  return Math.round(libro * pct) / 100;
}

export type PedidoDelLocal = { created_at: string; comision_local: number | string | null; monto: number | string; moneda: string };

/** Lo que ve el local en su panel: cartas pagadas y su parte, por mes, el más nuevo primero.
 *  El mes sale de created_at del pedido, no de la fecha de pago (se paga casi enseguida). */
export function resumenPorMes(pedidos: PedidoDelLocal[], zona: string): { mes: string; cartas: number; comision: number; moneda: string }[] {
  const formato = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit" });
  const porMes = new Map<string, { mes: string; cartas: number; centavos: number; moneda: string }>();
  for (const p of pedidos) {
    const mes = formato.format(new Date(p.created_at)).slice(0, 7);
    const clave = `${mes}|${p.moneda}`;
    const actual = porMes.get(clave) ?? { mes, cartas: 0, centavos: 0, moneda: p.moneda };
    actual.cartas += 1;
    actual.centavos += Math.round(Number(p.comision_local ?? 0) * 100);
    porMes.set(clave, actual);
  }
  return [...porMes.values()]
    .sort((a, b) => b.mes.localeCompare(a.mes))
    .map(({ mes, cartas, centavos, moneda }) => ({ mes, cartas, comision: centavos / 100, moneda }));
}
