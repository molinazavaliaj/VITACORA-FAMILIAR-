// Las compras y sus envíos, para /admin/pedidos (Naza, 05/11; CONTRATO, «Número de pedido»
// y «Entregas»). Lo puro, sin red. Lo que toca la base vive en ./pedidos-admin-base.ts.
//
// Dos números distintos: `numero` (VF-1001) lo generamos nosotros y va en la etiqueta como
// referencia; `seguimiento` lo da el correo.
//
// Hoy despacha una persona desde su casa: Bookmundo le manda el libro, lo pone en la caja y
// lo lleva al correo. Por eso la etiqueta sale de acá y el seguimiento se carga a mano.

import { nombreDelProducto } from "./aviso-venta";
import { necesitaEntrega, type Direccion, type EstadoEntrega } from "./entregas";
import { productosDelPedido } from "./productos";

export type EntregaAdmin = {
  id: string;
  estado: EstadoEntrega;
  origen: string | null;
  destinatario_nombre: string | null;
  destinatario_telefono: string | null;
  destinatario_email: string | null;
  direccion: Direccion | null;
  nota: string | null;
  transportista: string | null;
  seguimiento: string | null;
  seguimiento_url: string | null;
  peso_g: number | null;
  dimensiones: string | null;
  problema: string | null;
  direccion_at: string | null;
  produccion_at: string | null;
  impreso_at: string | null;
  enviado_at: string | null;
  entregado_at: string | null;
};

export type PedidoAdmin = {
  id: string;
  numero: number | null;
  estado: string;
  monto: number | null;
  moneda: string | null;
  proveedor: string | null;
  extras: Record<string, unknown>;
  created_at: string;
  familia_id: string;
  narrador_id: string;
  comprador: { nombre: string | null; email: string | null; region: string | null } | null;
  narrador: { nombre: string | null; como_le_dicen: string | null; modo: string | null } | null;
  entrega: EntregaAdmin | null;
};

export type Filtro = "compras" | "falta" | "sin_pagar";
/** Lo que se ve en la columna Envío: un estado de la entrega, o que no hay o falta su fila. */
export type EstadoEnvio = EstadoEntrega | "sin_fila" | "nada";

export const numeroDePedido = (numero: number | null): string => (numero === null ? "—" : `VF-${numero}`);

/** Estados en los que la plata ya entró (los mismos que da número el trigger de la base). */
const COBRADOS = new Set(["pagado", "generando", "esperando_voz", "entregado"]);

/** `fallido` con número pasó por `pagado`: se cobró y falló el libro. Sin número, el pago no se completó. */
export const seCobro = (p: Pick<PedidoAdmin, "estado" | "numero">): boolean => COBRADOS.has(p.estado) || (p.estado === "fallido" && p.numero !== null);

export function estadoDelPago(p: Pick<PedidoAdmin, "estado" | "numero">): { texto: string; color: "verde" | "ambar" | "rojo" | "neutro" } {
  if (p.estado === "pendiente") return { texto: "sin pagar", color: "neutro" };
  if (p.estado === "fallido") return p.numero !== null ? { texto: "pagado, falló el libro", color: "rojo" } : { texto: "no se completó", color: "neutro" };
  return { texto: "pagado", color: "verde" };
}

const conPlural = (n: number, una: string, varias: string) => `${n} ${n === 1 ? una : varias}`;

export function lineasDelProducto(p: Pick<PedidoAdmin, "extras" | "narrador">): string[] {
  const { copias, marcos } = productosDelPedido(p.extras);
  return [
    nombreDelProducto({ extras: p.extras, modo: p.narrador?.modo }),
    ...(copias > 0 ? [conPlural(copias, "impreso", "impresos")] : []),
    ...(marcos > 0 ? [conPlural(marcos, "marco", "marcos")] : []),
    ...(p.extras.regalo === true ? ["regalo"] : []),
    ...(tarjetaDe(p) ? ["tarjeta por correo"] : []),
  ];
}

/** La tarjeta impresa del regalo: viaja aparte y no tiene fila en `entregas` (CONTRATO, `tarjeta`). */
export function tarjetaDe(p: Pick<PedidoAdmin, "extras">): { aNombreDe: string; direccion: Direccion } | null {
  const t = p.extras.tarjeta as { aNombreDe?: unknown; direccion?: unknown } | undefined;
  if (!t || typeof t.aNombreDe !== "string" || !t.direccion || typeof t.direccion !== "object") return null;
  return { aNombreDe: t.aNombreDe, direccion: t.direccion as Direccion };
}

export function envioDe(p: PedidoAdmin): EstadoEnvio {
  if (p.entrega) return p.entrega.estado;
  return seCobro(p) && necesitaEntrega(productosDelPedido(p.extras)) ? "sin_fila" : "nada";
}

export function faltaDespachar(p: PedidoAdmin): boolean {
  if (!seCobro(p)) return false;
  const envio = envioDe(p);
  return envio !== "nada" && envio !== "enviado" && envio !== "entregado";
}

/** Lo que se puede hacer ya, primero; lo que espera a la familia, al final. */
const URGENCIA: Record<string, number> = { sin_fila: 0, con_problema: 1, impreso: 2, en_produccion: 3, lista: 4, sin_direccion: 5 };

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Por número como se dicta (VF-1001, vf 1001, 1001), o por nombre o mail de cualquiera de los involucrados. */
export function coincide(p: PedidoAdmin, busqueda: string): boolean {
  const q = sinTildes(busqueda.trim());
  if (!q) return true;
  const comoNumero = q.match(/^(?:vf[\s-]*)?(\d+)$/);
  if (comoNumero) return String(p.numero ?? "") === comoNumero[1];
  return [p.comprador?.nombre, p.comprador?.email, p.narrador?.nombre, p.narrador?.como_le_dicen, p.entrega?.destinatario_nombre]
    .some((campo) => campo && sinTildes(campo).includes(q));
}

export function filtrar(pedidos: PedidoAdmin[], filtro: Filtro, busqueda: string): PedidoAdmin[] {
  const encontrados = pedidos.filter((p) => coincide(p, busqueda));
  if (filtro === "sin_pagar") return encontrados.filter((p) => !seCobro(p));
  if (filtro === "compras") return encontrados.filter(seCobro);
  // sort es estable: dentro de la misma urgencia queda el orden de la base.
  return encontrados.filter(faltaDespachar).sort((a, b) => URGENCIA[envioDe(a)] - URGENCIA[envioDe(b)]);
}

export function resumen(pedidos: PedidoAdmin[]): { compras: number; paraDespachar: number; esperando: number; enCamino: number } {
  const cobrados = pedidos.filter(seCobro);
  const cuenta = (...estados: EstadoEnvio[]) => cobrados.filter((p) => estados.includes(envioDe(p))).length;
  return {
    compras: cobrados.length,
    paraDespachar: cuenta("impreso", "en_produccion"),
    esperando: cuenta("sin_direccion", "lista"),
    enCamino: cuenta("enviado"),
  };
}

export const destinatarioDe = (p: Pick<PedidoAdmin, "entrega" | "narrador">): string =>
  p.entrega?.destinatario_nombre ?? p.narrador?.nombre ?? "—";

/** Una dirección, renglón por renglón, como va en un paquete. */
export function direccionEnLineas(d: Direccion | null): string[] {
  if (!d) return [];
  return [d.linea1, d.linea2, [d.cp, d.ciudad].filter(Boolean).join(" "), d.provincia, d.pais].filter((l): l is string => Boolean(l));
}

export type Etiqueta = {
  referencia: string;
  de: string[];
  para: string[];
  telefono: string | null;
  nota: string | null;
  contenido: string;
  peso: string | null;
  medidas: string | null;
};

/**
 * `remitente` viene de la variable REMITENTE_ES o REMITENTE_AR, con `|` entre renglones. Va
 * en una variable y no en el código porque es una dirección particular y el repo es público.
 */
export function datosEtiqueta(p: PedidoAdmin, remitente: string | undefined): Etiqueta {
  const { copias, marcos } = productosDelPedido(p.extras);
  const e = p.entrega;
  const direccion = direccionEnLineas(e?.direccion ?? null);
  return {
    referencia: numeroDePedido(p.numero),
    de: (remitente ?? "").split("|").map((l) => l.trim()).filter(Boolean),
    para: direccion.length > 0 ? [e?.destinatario_nombre, ...direccion].filter((l): l is string => Boolean(l)) : [],
    telefono: e?.destinatario_telefono ?? null,
    nota: e?.nota ?? null,
    contenido: [...(copias > 0 ? [conPlural(copias, "libro", "libros")] : []), ...(marcos > 0 ? [conPlural(marcos, "marco", "marcos")] : [])].join(", "),
    peso: e?.peso_g ? `${e.peso_g} g` : null,
    medidas: e?.dimensiones ? `${e.dimensiones.split("x").join(" × ")} cm` : null,
  };
}

/**
 * Los pasos que se dan desde el panel (CONTRATO, «Entregas»). `lista → en_produccion` no está:
 * es el portón de la fábrica, que congela las frases y arma el PDF. Saltear `impreso` vale
 * porque el paquete puede salir el mismo día que llega. Una historia va a imprenta por su
 * lado y el portón no la toca: su entrega sale de `lista` a mano.
 */
export function puedePasar(desde: EstadoEntrega, hacia: "impreso" | "enviado" | "entregado" | "con_problema", esHistoria: boolean): boolean {
  if (hacia === "con_problema") return desde !== "entregado" && desde !== "con_problema";
  if (hacia === "entregado") return desde === "enviado";
  if (desde === "lista") return esHistoria;
  if (hacia === "impreso") return desde === "en_produccion";
  return desde === "en_produccion" || desde === "impreso";
}

/**
 * El peso y las medidas se cargan desde que la fábrica mandó a imprenta: antes, el portón los
 * pisaría con los estimados. Una historia no pasa por el portón.
 */
export const puedeCargarBulto = (estado: EstadoEntrega, esDeHistoria: boolean): boolean =>
  estado !== "sin_direccion" && (estado !== "lista" || esDeHistoria);

/** A dónde vuelve una entrega con problema: la fila no guarda el estado de antes, pero sí las fechas. */
export function estadoAnterior(e: Pick<EntregaAdmin, "direccion_at" | "produccion_at" | "impreso_at" | "enviado_at" | "entregado_at">): EstadoEntrega {
  if (e.entregado_at) return "entregado";
  if (e.enviado_at) return "enviado";
  if (e.impreso_at) return "impreso";
  if (e.produccion_at) return "en_produccion";
  return e.direccion_at ? "lista" : "sin_direccion";
}

export const esHistoria = (p: Pick<PedidoAdmin, "narrador">): boolean => p.narrador?.modo === "historia";

/** La fábrica no les manda los mails de entrega a Kids ni a Historia (fabrica/src/entregas.ts): hay que avisar a mano. */
export const sinMailDeEnvio = (p: Pick<PedidoAdmin, "extras" | "narrador">): boolean => p.extras.tipo === "kids" || esHistoria(p);

const LARGO_TRANSPORTISTA = 80;
const LARGO_SEGUIMIENTO = 120;
const LARGO_URL = 500;

export function validarDespacho(datos: { transportista: string; seguimiento: string; url: string }):
  | { transportista: string; seguimiento: string | null; seguimiento_url: string | null }
  | { error: string } {
  const transportista = datos.transportista.trim().slice(0, LARGO_TRANSPORTISTA);
  if (!transportista) return { error: "Falta el transportista." };
  const url = datos.url.trim().slice(0, LARGO_URL);
  // La familia abre este link desde su panel: nada que no sea una dirección web.
  if (url && !/^https?:\/\/\S+$/i.test(url)) return { error: "El link de seguimiento tiene que empezar con https://" };
  return { transportista, seguimiento: datos.seguimiento.trim().slice(0, LARGO_SEGUIMIENTO) || null, seguimiento_url: url || null };
}

/** El peso, en gramos, y las medidas como las piden los correos: "30x18x8.4", en cm. */
export function validarBulto(peso: string, medidas: string): { peso_g: number; dimensiones: string } | { error: string } {
  const gramos = Number(peso.trim());
  if (!Number.isInteger(gramos) || gramos <= 0) return { error: "El peso va en gramos, un número entero." };
  const partes = medidas.trim().toLowerCase().replace(/,/g, ".").split(/\s*[x×]\s*/);
  if (partes.length !== 3 || !partes.every((n) => /^\d+(\.\d+)?$/.test(n) && Number(n) > 0)) {
    return { error: "Las medidas van como largo x ancho x alto, en cm." };
  }
  return { peso_g: gramos, dimensiones: partes.join("x") };
}
