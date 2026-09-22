// Logística de lo físico (3t.26; spec docs/superpowers/specs/2026-09-21-logistica-fisica-propuesta.md,
// CONTRATO "Entregas"). Un pedido con libro impreso o marcos tiene que llegar a
// algún lado: la familia carga la dirección al encargar (es obligatoria si hay
// algo físico) y desde ahí ve en qué anda. Lo puro, sin red.

import type { ProductosDelPedido } from "./productos";

export type EstadoEntrega =
  | "sin_direccion" | "lista" | "en_produccion" | "impreso" | "enviado" | "entregado" | "con_problema";

export type Direccion = {
  linea1: string;
  linea2?: string;
  ciudad: string;
  provincia?: string;
  cp: string;
  pais: string;
};

/** Los campos del formulario, en orden. `nombre` es lo que ve la familia. */
export const DIRECCION_CAMPOS = [
  { id: "linea1", nombre: "Calle y número", obligatorio: true, ejemplo: "Pelliza 1234" },
  { id: "linea2", nombre: "Piso, departamento", obligatorio: false, ejemplo: "3º B" },
  { id: "ciudad", nombre: "Ciudad", obligatorio: true, ejemplo: "Vicente López" },
  { id: "provincia", nombre: "Provincia o comunidad", obligatorio: false, ejemplo: "Buenos Aires" },
  { id: "cp", nombre: "Código postal", obligatorio: true, ejemplo: "1638" },
  { id: "pais", nombre: "País", obligatorio: true, ejemplo: "Argentina" },
] as const satisfies readonly { id: keyof Direccion; nombre: string; obligatorio: boolean; ejemplo: string }[];

const LARGO_MAXIMO = 200;

/**
 * ¿Este pedido tiene algo que viaja? Impreso, copias o marcos. Un pedido de solo
 * PDF (o solo viaje) no tiene entrega: no hay nada que mandar.
 */
export function necesitaEntrega(productos: Pick<ProductosDelPedido, "impreso" | "copias" | "marcos">): boolean {
  return productos.impreso !== null || (productos.copias ?? 0) > 0 || (productos.marcos ?? 0) > 0;
}

export function validarDireccion(entrada: unknown): { ok: true; direccion: Direccion } | { ok: false; mensaje: string } {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    return { ok: false, mensaje: "Falta la dirección de envío." };
  }
  const e = entrada as Record<string, unknown>;
  const direccion = {} as Direccion;
  for (const campo of DIRECCION_CAMPOS) {
    const crudo = e[campo.id];
    const valor = typeof crudo === "string" ? crudo.trim().replace(/\s+/g, " ").slice(0, LARGO_MAXIMO) : "";
    if (!valor) {
      if (campo.obligatorio) return { ok: false, mensaje: `Falta ${campo.nombre.toLowerCase()}.` };
      continue; // un opcional vacío no se guarda
    }
    direccion[campo.id] = valor;
  }
  return { ok: true, direccion };
}

/** En qué anda, en palabras de familia (nada de `en_produccion`). */
export function estadoEnHumano(estado: EstadoEntrega): string {
  return {
    sin_direccion: "Falta la dirección de envío",
    lista: "Con la dirección lista, esperando que se cierre el libro",
    en_produccion: "Lo estamos imprimiendo",
    impreso: "Impreso, preparando el envío",
    enviado: "En camino",
    entregado: "Entregado",
    con_problema: "Hubo un problema con el envío",
  }[estado];
}
