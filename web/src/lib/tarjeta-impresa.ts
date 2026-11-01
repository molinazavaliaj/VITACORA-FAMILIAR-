// La tarjeta del regalo impresa, en un sobre negro por correo (30/10). Naza la
// imprime, la mete en el sobre C6 y la manda por Correos (carta ordinaria, de
// 3 a 5 días). Solo dentro de España. Lo puro, sin red: lo usan el formulario
// de /regalar, /api/compra y el aviso a los socios de confirmarPago.

import { validarDireccion, type Direccion } from "./entregas";
import type { TextosTarjetaImpresa } from "./regalo-textos";

export type TarjetaImpresa = { aNombreDe: string; direccion: Direccion };

export const A_NOMBRE_DE_MAXIMO = 100;

/** Los días que se le dan a Correos: la tarjeta sale a más tardar 4 días antes de la fecha. */
const DIAS_CORREO = 4;

/** España, Espana, Spain o Espanya, sin importar mayúsculas ni tildes. */
export function esEspana(pais: string): boolean {
  const limpio = pais.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  return ["espana", "spain", "espanya"].includes(limpio);
}

/** Lo que mandó el navegador, revisado. Los mensajes, en el trato o el idioma de quien compra. */
export function validarTarjetaImpresa(
  entrada: unknown, T: Pick<TextosTarjetaImpresa, "faltaANombreDe" | "soloEspana">,
): { ok: true; tarjeta: TarjetaImpresa } | { ok: false; mensaje: string } {
  const e = (entrada && typeof entrada === "object" ? entrada : {}) as { aNombreDe?: unknown; direccion?: unknown };
  const aNombreDe = typeof e.aNombreDe === "string" ? e.aNombreDe.trim().replace(/\s+/g, " ") : "";
  if (!aNombreDe) return { ok: false, mensaje: T.faltaANombreDe };
  // El formulario no deja escribir más (maxLength): si llega, vino mal formado.
  if (aNombreDe.length > A_NOMBRE_DE_MAXIMO) return { ok: false, mensaje: "El pedido llegó mal formado." };
  const d = validarDireccion(e.direccion);
  if (!d.ok) return d;
  if (!esEspana(d.direccion.pais)) return { ok: false, mensaje: T.soloEspana };
  return { ok: true, tarjeta: { aNombreDe, direccion: d.direccion } };
}

/** dd/mm/aaaa de una fecha YYYY-MM-DD. */
const ddmmaaaa = (fecha: string) => fecha.split("-").reverse().join("/");

/** El día en que la tarjeta tiene que salir: 4 días antes de la fecha de entrega (YYYY-MM-DD). */
export function mandarAntesDe(fechaEntrega: string): string {
  const d = new Date(`${fechaEntrega}T00:00:00Z`);
  return new Date(d.getTime() - DIAS_CORREO * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * El mail a los socios cuando entra el pago de un regalo con tarjeta impresa:
 * texto plano, para imprimirla y mandarla a mano. Es interno (no lo ve el cliente).
 */
export function mailTarjetaImpresa(o: {
  codigo: string;
  quienRegala: string | null;
  email: string | null;
  tarjeta: TarjetaImpresa;
  fechaEntrega: string | null;
  urlBase: string;
}): { asunto: string; texto: string } {
  const d = o.tarjeta.direccion;
  const direccion = [
    o.tarjeta.aNombreDe,
    d.linea2 ? `${d.linea1}, ${d.linea2}` : d.linea1,
    `${d.cp} ${d.ciudad}`,
    ...(d.provincia ? [d.provincia] : []),
    d.pais,
  ].join("\n");
  const fecha = o.fechaEntrega ? ddmmaaaa(o.fechaEntrega) : "sin fecha";
  const cuando = o.fechaEntrega ? `Mandala antes del ${ddmmaaaa(mandarAntesDe(o.fechaEntrega))}.` : "Mandala apenas puedas.";
  const texto = [
    "Entró un regalo con la tarjeta impresa. Hay que imprimirla, meterla en el sobre negro y mandarla por Correos.",
    "",
    `Código: ${o.codigo}`,
    `Regala: ${o.quienRegala ?? "(sin nombre)"} · ${o.email ?? "(sin correo)"}`,
    `Fecha de entrega: ${fecha}`,
    cuando,
    "",
    "El sobre va a:",
    direccion,
    "",
    `Para imprimir la tarjeta: ${o.urlBase}/regalo/${encodeURIComponent(o.codigo)}/tarjeta`,
  ].join("\n");
  return { asunto: `Tarjeta impresa para mandar · ${o.codigo}`, texto };
}
