// La cuenta del mes: lo que entró, lo que se gastó y lo que quedó de verdad.
//
// Decisión del spec: la casa cuenta en euros. Lo que entra en pesos o en dólares se
// convierte con el tipo de cambio que se carga a mano (uno por semana), y si ese tipo de
// cambio no está, el panel NO INVENTA: dice que no puede convertir y muestra la plata sin
// sumar. Los gastos de IA vienen en dólares (los precios de los modelos son en dólares) y
// los gastos a mano pueden estar en cualquier moneda.

import type { ConsumoPanel, DatosDelPanel, PedidoPanel } from "./datos";
import { libroListo } from "./frenos";

export type Cambio = { eurArs: number; usdEur: number; fecha: string };

/** Lo que se queda la pasarela. Se carga por pasarela, no por venta. */
export const COMISION_POR_PASARELA: Record<string, number> = {
  stripe: 0.03,
  mercadopago: 0.04,
};

/** Los estados en los que la plata YA entró (la web pasa a `pagado` cuando el cobro confirma). */
const COBRADOS = ["pagado", "generando", "esperando_voz", "entregado"];

export type Cuenta = {
  /** Lo que entró de verdad, en euros. */
  entro: number;
  /** Lo que todavía hay que cobrar (pendientes de narradores sin libro). */
  porCobrar: number;
  /** La IA de todo el mes, en euros. */
  gastoIa: number;
  /** Lo que se quedan Stripe y Mercado Pago. */
  comisiones: number;
  /** Suscripciones, imprenta, lo cargado a mano. */
  fijos: number;
  /** Entró − se gastó. */
  limpia: number;
  /** Lo mismo, pero descontando lo vendido que todavía hay que escribir. */
  limpiaDeVerdad: number;
  /** Lo vendido y cobrado que todavía no es libro entregado (plata que ya es trabajo). */
  comprometido: number;
  /** De cada 100 € que entraron, cuántos quedan. `null` si no entró nada (nunca dividir por cero). */
  porCada100: number | null;
  /** Hubo plata que no se pudo convertir por falta de tipo de cambio. */
  sinConvertir: boolean;
};

export type Venta = {
  familia: string;
  region: string;
  pasarela: string;
  pago: number;
  moneda: string;
  costoIa: number | null;
  quedo: number | null;
  estado: string;
};

/** A euros. `null` cuando no se puede convertir (tipo de cambio en cero o moneda desconocida). */
export function aEuros(
  monto: number,
  moneda: "EUR" | "ARS" | "USD" | string,
  cambio: Cambio,
): number | null {
  if (moneda === "EUR") return monto;
  if (moneda === "ARS") return cambio.eurArs > 0 ? monto / cambio.eurArs : null;
  if (moneda === "USD") return cambio.usdEur > 0 ? monto / cambio.usdEur : null;
  return null;
}

/**
 * El tipo de cambio del día, de las variables de Vercel (`CAMBIO_EUR_ARS`, `CAMBIO_USD_EUR`,
 * `CAMBIO_FECHA`). Se carga a mano, una vez por semana (spec §3.10, decisión 4).
 * Si no están cargadas queda en cero y el panel lo dice en vez de convertir con un número
 * que se inventaría: con cero, `aEuros` devuelve `null` y la cuenta avisa.
 */
export function cambioDeEntorno(env: Record<string, string | undefined>): Cambio {
  const numero = (v: string | undefined) => {
    const n = Number((v ?? "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    eurArs: numero(env.CAMBIO_EUR_ARS),
    usdEur: numero(env.CAMBIO_USD_EUR),
    fecha: env.CAMBIO_FECHA ?? "",
  };
}

const enRango = (iso: string | null, desde: Date, hasta: Date): boolean => {
  if (!iso) return false;
  const t = Date.parse(iso);
  return !Number.isNaN(t) && t >= desde.getTime() && t <= hasta.getTime();
};

export function cuentaDelPeriodo(
  datos: DatosDelPanel,
  cambio: Cambio,
  desde: Date,
  hasta: Date,
): Cuenta {
  let entro = 0;
  let porCobrar = 0;
  let comisiones = 0;
  let comprometido = 0;
  let sinConvertir = false;

  for (const p of datos.pedidos) {
    if (!enRango(p.created_at, desde, hasta)) continue;
    const euros = aEuros(p.monto ?? 0, p.moneda ?? "", cambio);

    if (p.estado === "pendiente") {
      // Un pendiente se cuenta sólo si sabemos que hay que cobrarlo: su narrador está en
      // los datos y no tiene el libro listo. Si no, es el cobro viejo de un libro ya
      // entregado y contarlo sería contar dos veces (spec, Review Focus 3).
      const conocido = datos.narradores.some((n) => n.id === p.narrador_id);
      if (conocido && !libroListo(datos.narradores, datos.pedidos, p.narrador_id)) {
        if (euros === null) sinConvertir = true;
        else porCobrar += euros;
      }
      continue;
    }
    if (!COBRADOS.includes(p.estado)) continue; // fallido: no es plata
    if (euros === null) {
      sinConvertir = true;
      continue;
    }

    const comision = euros * (COMISION_POR_PASARELA[p.proveedor ?? ""] ?? 0);
    entro += euros;
    comisiones += comision;
    if (p.estado !== "entregado") comprometido += euros - comision;
  }

  const convertirUsd = (usd: number): number | null => {
    if (cambio.usdEur > 0) return usd / cambio.usdEur;
    sinConvertir = true;
    return null;
  };

  let gastoIa = 0;
  for (const c of datos.consumo) {
    if (!enRango(c.fecha, desde, hasta)) continue;
    const euros = convertirUsd(c.usd ?? 0);
    if (euros !== null) gastoIa += euros;
  }

  let fijos = 0;
  for (const g of datos.gastos) {
    if (!enRango(g.fecha, desde, hasta)) continue;
    const euros = aEuros(g.monto, g.moneda, cambio);
    if (euros === null) sinConvertir = true;
    else fijos += euros;
  }

  const limpia = entro - comisiones - gastoIa - fijos;
  return {
    entro,
    porCobrar,
    gastoIa,
    comisiones,
    fijos,
    limpia,
    limpiaDeVerdad: limpia - comprometido,
    comprometido,
    porCada100: entro > 0 ? (limpia / entro) * 100 : null,
    sinConvertir,
  };
}

/** Lo que costó la IA de cada libro, con el desglose por paso. */
export function costoPorLibro(
  consumo: ConsumoPanel[],
): { narradorId: string; usd: number; porPaso: Record<string, number> }[] {
  const porLibro = new Map<string, { narradorId: string; usd: number; porPaso: Record<string, number> }>();
  for (const c of consumo) {
    // Lo que no tiene narrador (una llamada suelta, una prueba) no es de ningún libro:
    // igual suma al gasto del mes, pero no se le puede cargar a nadie.
    if (!c.narrador_id) continue;
    const actual = porLibro.get(c.narrador_id) ?? { narradorId: c.narrador_id, usd: 0, porPaso: {} };
    const usd = c.usd ?? 0;
    actual.usd += usd;
    actual.porPaso[c.paso] = (actual.porPaso[c.paso] ?? 0) + usd;
    porLibro.set(c.narrador_id, actual);
  }
  return [...porLibro.values()].sort((a, b) => b.usd - a.usd);
}

/** Una fila por venta, con la familia, la pasarela y lo que quedó después del costo del libro. */
export function ventaPorVenta(datos: DatosDelPanel, cambio: Cambio): Venta[] {
  const porLibro = new Map(costoPorLibro(datos.consumo).map((c) => [c.narradorId, c.usd]));
  const familia = new Map(datos.familias.map((f) => [f.id, f]));

  return datos.pedidos.map((p: PedidoPanel) => {
    const f = p.familia_id ? familia.get(p.familia_id) : undefined;
    const pago = aEuros(p.monto ?? 0, p.moneda ?? "", cambio);
    const usdLibro = p.narrador_id ? porLibro.get(p.narrador_id) : undefined;
    const costoIa = usdLibro === undefined ? null : aEuros(usdLibro, "USD", cambio);
    const comision = pago === null ? null : pago * (COMISION_POR_PASARELA[p.proveedor ?? ""] ?? 0);

    return {
      familia: f?.nombre ?? f?.email ?? "—",
      region: f?.region ?? "—",
      pasarela: p.proveedor ?? "—",
      pago: p.monto ?? 0,
      moneda: p.moneda ?? "EUR",
      costoIa,
      quedo: pago === null || costoIa === null || comision === null ? null : pago - comision - costoIa,
      estado: p.estado,
    };
  });
}
