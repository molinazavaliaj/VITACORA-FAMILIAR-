// De qué anuncio vino cada compra (F4-5, aprobado por Naza 14/10). Sin
// cookies, sin terceros, sin píxel: cuando alguien llega con parámetros de
// campaña en la URL (utm_*, fbclid, gclid), se guarda en localStorage un
// «primer toque» que dura 30 días. Una visita posterior SIN parámetros no lo
// pisa; una CON parámetros se guarda aparte como «último toque». El checkout
// lo manda a /api/compra y queda en `pedidos.extras.origen`.
//
// Lo mismo limpia en los dos lados: el navegador lo relee con `limpiarOrigen`
// antes de mandarlo, y el servidor lo vuelve a limpiar porque el cuerpo lo
// escribe cualquiera. Cualquier cosa rara se descarta en silencio: el origen
// nunca rompe una compra.

export const CLAVE_ORIGEN = "vitacora-origen";
export const DURACION_ORIGEN_MS = 30 * 24 * 60 * 60 * 1000;

export const PARAMETROS_ORIGEN = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const;
export type ParametroOrigen = (typeof PARAMETROS_ORIGEN)[number];

/** Un toque: los parámetros que trajo, la página donde cayó (sin query) y cuándo. */
export type Toque = Partial<Record<ParametroOrigen, string>> & { pagina: string; fecha: string };
export type OrigenVisita = { primero: Toque; ultimo?: Toque };

/** Lo poco de Storage que se usa. */
export type AlmacenOrigen = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const LARGO_MAXIMO = 200;
// Lo que sobra de un valor de campaña: marcas de HTML, comillas y controles.
const SOBRA = /[<>"'`\\\u0000-\u001f\u007f]/g;

function texto(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const limpio = v.replace(SOBRA, "").trim().slice(0, LARGO_MAXIMO).trim();
  return limpio || null;
}

/** Un toque válido o null: al menos un parámetro, página que empieza con «/» y fecha real, no del futuro. */
export function limpiarToque(crudo: unknown, ahora: Date): Toque | null {
  if (!crudo || typeof crudo !== "object" || Array.isArray(crudo)) return null;
  const c = crudo as Record<string, unknown>;
  const parametros: Partial<Record<ParametroOrigen, string>> = {};
  for (const p of PARAMETROS_ORIGEN) {
    const v = texto(c[p]);
    if (v) parametros[p] = v;
  }
  if (Object.keys(parametros).length === 0) return null;
  const pagina = texto(c.pagina);
  if (!pagina || !pagina.startsWith("/") || pagina.startsWith("//")) return null;
  if (typeof c.fecha !== "string") return null;
  const ms = Date.parse(c.fecha);
  // Un día de tolerancia por relojes adelantados; más que eso es inventado.
  if (!Number.isFinite(ms) || ms > ahora.getTime() + 24 * 60 * 60 * 1000) return null;
  return { ...parametros, pagina, fecha: new Date(ms).toISOString() };
}

/** `{ primero, ultimo? }` limpio, o null. Sin primer toque válido no hay origen. */
export function limpiarOrigen(crudo: unknown, ahora: Date): OrigenVisita | null {
  if (!crudo || typeof crudo !== "object" || Array.isArray(crudo)) return null;
  const c = crudo as Record<string, unknown>;
  const primero = limpiarToque(c.primero, ahora);
  if (!primero) return null;
  const ultimo = limpiarToque(c.ultimo, ahora);
  return ultimo ? { primero, ultimo } : { primero };
}

/** El toque de esta URL, o null si no trae ningún parámetro de campaña. */
export function toqueDeUrl(search: string, pathname: string, ahora: Date): Toque | null {
  let q: URLSearchParams;
  try {
    q = new URLSearchParams(search);
  } catch {
    return null;
  }
  const crudo: Record<string, string> = { pagina: pathname || "/", fecha: ahora.toISOString() };
  for (const p of PARAMETROS_ORIGEN) {
    const v = q.get(p);
    if (v) crudo[p] = v;
  }
  return limpiarToque(crudo, ahora);
}

/** Lo guardado, si es válido y el primer toque tiene menos de 30 días; si caducó o está roto, se borra. */
export function leerOrigen(almacen: () => AlmacenOrigen, ahora: Date): OrigenVisita | null {
  try {
    const a = almacen();
    const crudo = a.getItem(CLAVE_ORIGEN);
    if (!crudo) return null;
    let valor: unknown = null;
    try {
      valor = JSON.parse(crudo);
    } catch {
      // roto: se borra abajo
    }
    const origen = limpiarOrigen(valor, ahora);
    if (!origen || ahora.getTime() - Date.parse(origen.primero.fecha) > DURACION_ORIGEN_MS) {
      a.removeItem(CLAVE_ORIGEN);
      return null;
    }
    return origen;
  } catch {
    return null;
  }
}

/** Anota la visita si trae parámetros: primer toque si no había (o caducó), si no, último toque. */
export function registrarVisita(almacen: () => AlmacenOrigen, search: string, pathname: string, ahora: Date): void {
  const toque = toqueDeUrl(search, pathname, ahora);
  if (!toque) return;
  const previo = leerOrigen(almacen, ahora);
  const nuevo: OrigenVisita = previo ? { primero: previo.primero, ultimo: toque } : { primero: toque };
  try {
    almacen().setItem(CLAVE_ORIGEN, JSON.stringify(nuevo));
  } catch {
    // Sin almacenamiento (modo privado, bloqueado): la compra va sin origen.
  }
}

/** Para el checkout: lo guardado en este navegador, o null. Nunca tira. */
export function origenDelNavegador(): OrigenVisita | null {
  if (typeof window === "undefined") return null;
  return leerOrigen(() => window.localStorage, new Date());
}
