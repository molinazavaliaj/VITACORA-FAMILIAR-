// Lo elegido en el checkout, guardado en el navegador mientras se paga (Casos 2,
// PASO-DE-MANOS §4.1): si el banco no acepta el pago, la pasarela vuelve a la
// compra con `?pago=fallido` y todo lo que se había elegido aparece de nuevo,
// igual que el regalo ya recordaba su intento con `vitacora-regalo-pendiente`.
// Es `sessionStorage`: vive en esa pestaña y se va al cerrarla. Nada de esto va
// a la base. Funciones puras sobre un almacén chico, para probarlas sin navegador.
//
// Lo que se guarda incluye la prueba de la compra anterior (narradorId y el
// token de una hora que devolvió /api/compra): con ella el reintento retoma el
// mismo narrador y el mismo regalo en vez de crear otros.

/** Lo poco de Storage que se usa. */
export type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** El parámetro con el que vuelve la pasarela cuando no se cobró (lib/pagos.ts). */
export const PARAMETRO_FALLO = "pago";
export const VALOR_FALLO = "fallido";

/** ¿La página se abrió de vuelta de un pago que no se cobró? */
export function vieneDePagoFallido(busqueda: string): boolean {
  return new URLSearchParams(busqueda).get(PARAMETRO_FALLO) === VALOR_FALLO;
}

/**
 * ¿Se llegó desde «Regálalo con una tarjeta»? (26/10) El regalo es uno solo,
 * en /comprar: /regalar redirige acá con ?regalo=1 y la pregunta del regalo
 * llega contestada que sí, con todos los formatos a la vista.
 */
export function vieneParaRegalar(busqueda: string): boolean {
  return new URLSearchParams(busqueda).get("regalo") === "1";
}

/** Lo guardado deja de valer a las dos horas: después ya no es «lo que elegiste hace un momento». */
const VIGENCIA_MS = 2 * 60 * 60 * 1000;

type Sobre<T> = { v: 1; guardado: number; clave: string; datos: T };

/**
 * Guarda lo elegido. `clave` separa una compra de otra (el idioma y la línea:
 * lo guardado en /ar/comprar no se abre en /comprar/viaje). Si el navegador no
 * deja guardar, no pasa nada: el reintento empieza de cero.
 */
export function guardar<T>(almacen: () => Almacen, nombre: string, clave: string, datos: T, ahora = Date.now()): void {
  try {
    const sobre: Sobre<T> = { v: 1, guardado: ahora, clave, datos };
    almacen().setItem(nombre, JSON.stringify(sobre));
  } catch {
    // Sin almacenamiento (modo privado, cuota): se sigue sin recordar.
  }
}

/** Lo guardado con esa clave, si está y no venció; si no, null. */
export function leer<T>(almacen: () => Almacen, nombre: string, clave: string, ahora = Date.now()): T | null {
  try {
    const crudo = almacen().getItem(nombre);
    if (!crudo) return null;
    const sobre = JSON.parse(crudo) as Partial<Sobre<T>> | null;
    if (!sobre || sobre.v !== 1 || sobre.clave !== clave || typeof sobre.guardado !== "number") return null;
    if (ahora - sobre.guardado > VIGENCIA_MS || sobre.guardado > ahora + 60_000) {
      // Vencido: además de ignorarlo, se borra (lleva datos personales).
      almacen().removeItem(nombre);
      return null;
    }
    return (sobre.datos ?? null) as T | null;
  } catch {
    return null;
  }
}

export function olvidar(almacen: () => Almacen, nombre: string): void {
  try {
    almacen().removeItem(nombre);
  } catch {
    // nada que hacer
  }
}

/** Dónde se guarda la compra del libro de una vida, la de viaje y la dirección para después de pagar. */
export const CLAVE_COMPRA = "vitacora-compra-pendiente";
export const CLAVE_COMPRA_VIAJE = "vitacora-compra-viaje-pendiente";
export const CLAVE_DIRECCION = "vitacora-compra-direccion";
