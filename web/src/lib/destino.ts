// El camino de ida y vuelta de la entrada.
//
// Todo lo que decide "a dónde va el que todavía no entró" y "a dónde vuelve después de
// entrar" vive acá, porque lo usan cinco lugares que si deciden por su cuenta se
// desincronizan: el proxy de sesión (src/middleware.ts), el formulario de /entrar, el
// layout del panel de la empresa y el callback del enlace mágico.
//
// Desincronizados fue exactamente el bug (hallazgo de Naza, 2026-09-21): el que mandaba a
// /entrar no decía a dónde volver, /entrar caía en /tablero y el tablero de un admin que
// nunca compró terminaba en el carrito. Alguien que entra a /admin entra a /admin.

/** Las partes del sitio que no se miran sin sesión. */
const RUTAS_CON_SESION = ["/tablero", "/admin"];

/** ¿Esta ruta pide sesión? Por prefijo, y solo por prefijo entero: /tableros es otra cosa. */
export function pideSesion(pathname: string): boolean {
  return RUTAS_CON_SESION.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}

/** La dirección de /entrar con la vuelta puesta, escapada (puede traer su propia query). */
export function rutaDeEntrada(volver: string): string {
  return volver ? `/entrar?volver=${encodeURIComponent(volver)}` : "/entrar";
}

/**
 * La vuelta pedida, si sirve; null si no. Sirve solo si es una ruta propia: "/algo".
 * Nunca otro sitio —`//malo.example` es una URL de otro sitio con el esquema escondido—
 * y nunca /entrar, que sería volver a la pantalla de entrar.
 */
export function rutaDeVuelta(volver: string | null): string | null {
  if (!volver || !volver.startsWith("/") || volver.startsWith("//")) return null;
  if (volver === "/entrar" || volver.startsWith("/entrar/") || volver.startsWith("/entrar?")) {
    return null;
  }
  return volver;
}

/**
 * A dónde ir después de entrar: la vuelta pedida si sirve, y si no el destino de siempre.
 * El default lo elige el que llama, porque no es el mismo para todos: el formulario cae
 * en /tablero y el callback, según tenga familia o no (el que nunca compró va al carrito).
 */
export function destinoSeguro(volver: string | null, porDefecto = "/tablero"): string {
  return rutaDeVuelta(volver) ?? porDefecto;
}
