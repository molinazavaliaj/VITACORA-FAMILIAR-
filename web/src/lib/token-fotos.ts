import { firmarToken, verificarToken } from "./token-firmado";

// Permiso para subir fotos SIN sesión, en el paso 5 de la compra (17/09).
// Quien compra todavía no entró nunca al panel (la cuenta nace con el primer
// login), pero ya tiene un narrador creado en `pendiente_pago`. /api/compra le
// devuelve este token, atado a ESE narrador y con vencimiento corto: alcanza
// para subir las fotos y pasar a pagar, y no sirve para nada más (ni leer, ni
// mover, ni otro narrador). El mecanismo vive en token-firmado.ts (3t.20).

export function firmarTokenFotos(narradorId: string, ahora = Date.now()): string {
  return firmarToken("fotos", narradorId, ahora);
}

export function verificarTokenFotos(token: string | null, narradorId: string, ahora = Date.now()): boolean {
  return verificarToken("fotos", token, narradorId, ahora);
}
