// De qué anuncio vino cada compra (F4-5, aprobado por Naza 14/10; cambiado el
// 19/10). Sin cookies, sin terceros, sin píxel y SIN GUARDAR NADA EN EL
// NAVEGADOR: cuando alguien llega con parámetros de campaña en la URL
// (utm_*, fbclid, gclid), se recuerda en la memoria de la página (una variable
// de este módulo) mientras navega por la web con los `Link` de Next. Si
// recarga, abre otra pestaña o cierra, se olvida, y está bien. El checkout lo
// manda a /api/compra y queda en `pedidos.extras.origen`.
//
// Antes (14/10) iba a localStorage 30 días con la clave `vitacora-origen`; eso
// es medición publicitaria y pediría consentimiento (art. 22.2 LSSI). Ahora esa
// clave solo se borra, una vez, si quedó de una visita vieja.
//
// Lo mismo limpia en los dos lados: el navegador lo pasa por `limpiarOrigen`
// antes de mandarlo, y el servidor lo vuelve a limpiar porque el cuerpo lo
// escribe cualquiera. Cualquier cosa rara se descarta en silencio: el origen
// nunca rompe una compra.

/** La clave que usaba la versión del 14/10. Solo se borra; nunca se lee ni se escribe. */
export const CLAVE_ORIGEN_VIEJA = "vitacora-origen";

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

// La memoria de esta visita. Vive lo que vive la página cargada: los cambios de
// página del lado del cliente la conservan; recargar o cerrar la borra.
let memoria: OrigenVisita | null = null;

/** Anota la visita si la URL trae parámetros: primer toque si no había, si no, último toque. Solo en memoria. */
export function registrarVisita(search: string, pathname: string, ahora: Date): void {
  const toque = toqueDeUrl(search, pathname, ahora);
  if (!toque) return;
  if (!memoria) {
    memoria = { primero: toque };
    return;
  }
  // Recargar el checkout con el mismo enlace no cuenta como otro toque.
  const ultimo = memoria.ultimo ?? memoria.primero;
  if (mismosParametros(ultimo, toque)) return;
  memoria = { primero: memoria.primero, ultimo: toque };
}

function mismosParametros(a: Toque, b: Toque): boolean {
  return a.pagina === b.pagina && PARAMETROS_ORIGEN.every((p) => a[p] === b[p]);
}

/** Lo que se recuerda de esta visita, o null. */
export function origenDeLaVisita(ahora: Date = new Date()): OrigenVisita | null {
  return memoria ? limpiarOrigen(memoria, ahora) : null;
}

/** Solo para las pruebas: empieza una visita nueva. */
export function olvidarOrigen(): void {
  memoria = null;
}

/** Lo que el componente del layout necesita de `window`. */
export type VentanaOrigen = {
  location: { search: string; pathname: string };
  localStorage: Pick<Storage, "removeItem">;
};

/** Al cargar la web: recuerda la URL de llegada y borra la clave vieja de localStorage (sin leerla). Nunca tira. */
export function alCargarLaWeb(ventana: () => VentanaOrigen, ahora: Date): void {
  try {
    const v = ventana();
    registrarVisita(v.location.search, v.location.pathname, ahora);
  } catch {
    // sin URL legible: la compra va sin origen
  }
  try {
    ventana().localStorage.removeItem(CLAVE_ORIGEN_VIEJA);
  } catch {
    // almacenamiento bloqueado: no había nada que borrar
  }
}

/**
 * Para el checkout: lo recordado en esta visita. Si la URL actual trae
 * parámetros (se llegó directo a /comprar desde un anuncio), cuenta también.
 * Nunca tira.
 */
export function origenDelNavegador(): OrigenVisita | null {
  if (typeof window === "undefined") return null;
  try {
    const ahora = new Date();
    registrarVisita(window.location.search, window.location.pathname, ahora);
    return origenDeLaVisita(ahora);
  } catch {
    return null;
  }
}
