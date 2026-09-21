import { describe, it, expect, beforeAll } from "vitest";
import { firmarToken, verificarToken } from "../src/lib/token-firmado";
import { firmarTokenFotos, verificarTokenFotos } from "../src/lib/token-fotos";

// Un token firmado por el servidor, atado a un propósito y a un sujeto, con
// vencimiento corto. Lo usan las fotos de la compra (17/09) y la vuelta del
// pago (3t.20): el mismo mecanismo, sin que un token sirva para lo otro.
beforeAll(() => { process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-prueba"; });

describe("token firmado", () => {
  it("verifica solo con el mismo propósito y el mismo sujeto", () => {
    const t = firmarToken("vuelta", "pedido-1");
    expect(verificarToken("vuelta", t, "pedido-1")).toBe(true);
    expect(verificarToken("vuelta", t, "pedido-2")).toBe(false);
    expect(verificarToken("fotos", t, "pedido-1")).toBe(false);
    expect(verificarToken("vuelta", null, "pedido-1")).toBe(false);
    expect(verificarToken("vuelta", "basura", "pedido-1")).toBe(false);
  });
  it("vence a la hora", () => {
    const t = firmarToken("vuelta", "pedido-1", 1_000_000);
    expect(verificarToken("vuelta", t, "pedido-1", 1_000_000 + 59 * 60_000)).toBe(true);
    expect(verificarToken("vuelta", t, "pedido-1", 1_000_000 + 61 * 60_000)).toBe(false);
  });
  it("el token de fotos sigue funcionando igual, sobre el mismo mecanismo", () => {
    const t = firmarTokenFotos("nar-1");
    expect(verificarTokenFotos(t, "nar-1")).toBe(true);
    expect(verificarTokenFotos(t, "nar-2")).toBe(false);
    expect(verificarToken("vuelta", t, "nar-1")).toBe(false);
  });
});
