import { describe, it, expect, afterEach } from "vitest";
import { firmarTokenVoz, verificarTokenVoz, firmarTokenLibro, verificarTokenLibro } from "../src/lib/token-libro";
import { verificarTokenAnticipo } from "../src/lib/token-anticipo";
import { firmarToken, verificarToken } from "../src/lib/token-firmado";
import { createHmac } from "node:crypto";

// El cambio de claves del 24/10 (incidente de Railway): los links nuevos se
// firman con FIRMA_TOKENS, y los QR ya impresos (firmados con la service_role
// vieja) tienen que seguir abriendo mientras FIRMA_TOKENS_ANTERIOR la tenga.

const VIEJA = "service-role-vieja";
const NUEVA = "firma-nueva";

function conClaves(o: { servicio?: string; firma?: string; anterior?: string }) {
  for (const [k, v] of [["SUPABASE_SERVICE_ROLE_KEY", o.servicio], ["FIRMA_TOKENS", o.firma], ["FIRMA_TOKENS_ANTERIOR", o.anterior]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

/** Un token de anticipo como lo firma la fábrica, con la clave que se le pase. */
function anticipoFirmadoCon(secreto: string): string {
  const enc = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const pay = Buffer.from(JSON.stringify({ narradorId: "nar-1", tipo: "anticipo" })).toString("base64url");
  return `${enc}.${pay}.${createHmac("sha256", secreto).update(`${enc}.${pay}`).digest("base64url")}`;
}

afterEach(() => conClaves({}));

describe("la firma de los links después del cambio de claves", () => {
  it("sin FIRMA_TOKENS sigue firmando con la service_role, como antes", () => {
    conClaves({ servicio: VIEJA });
    const t = firmarTokenVoz("nar-1");
    conClaves({ servicio: "otra", firma: NUEVA, anterior: VIEJA });
    expect(verificarTokenVoz(t)).toEqual({ narradorId: "nar-1" });
  });

  it("el QR impreso con la clave vieja sigue abriendo con FIRMA_TOKENS_ANTERIOR", () => {
    conClaves({ servicio: VIEJA });
    const impreso = firmarTokenVoz("nar-1");
    const compartido = firmarTokenLibro("nar-1");
    conClaves({ servicio: "sb_secret_nueva", firma: NUEVA, anterior: VIEJA });
    expect(verificarTokenVoz(impreso)).toEqual({ narradorId: "nar-1" });
    expect(verificarTokenLibro(compartido)).toEqual({ narradorId: "nar-1" });
    expect(verificarTokenAnticipo(anticipoFirmadoCon(VIEJA))).toEqual({ narradorId: "nar-1" });
  });

  it("sin FIRMA_TOKENS_ANTERIOR, lo firmado con la vieja deja de abrir", () => {
    conClaves({ servicio: VIEJA });
    const impreso = firmarTokenVoz("nar-1");
    conClaves({ servicio: "sb_secret_nueva", firma: NUEVA });
    expect(verificarTokenVoz(impreso)).toBeNull();
  });

  it("lo nuevo se firma con FIRMA_TOKENS, nunca con la anterior", () => {
    conClaves({ servicio: "sb_secret_nueva", firma: NUEVA, anterior: VIEJA });
    const t = firmarTokenVoz("nar-1");
    const corto = firmarToken("cupon-baja", "fila-1");
    conClaves({ firma: NUEVA });
    expect(verificarTokenVoz(t)).toEqual({ narradorId: "nar-1" });
    expect(verificarToken("cupon-baja", corto, "fila-1")).toBe(true);
    conClaves({ firma: VIEJA });
    expect(verificarTokenVoz(t)).toBeNull();
  });

  it("los tokens cortos (baja del cupón) firmados con la vieja siguen valiendo", () => {
    conClaves({ servicio: VIEJA });
    const baja = firmarToken("cupon-baja", "fila-1", Date.now(), 365 * 24 * 3600 * 1000);
    conClaves({ servicio: "sb_secret_nueva", firma: NUEVA, anterior: VIEJA });
    expect(verificarToken("cupon-baja", baja, "fila-1")).toBe(true);
    expect(verificarToken("cupon-baja", baja, "fila-2")).toBe(false);
  });

  it("un anticipo firmado con cualquier otra clave no abre", () => {
    conClaves({ firma: NUEVA, anterior: VIEJA });
    expect(verificarTokenAnticipo(anticipoFirmadoCon("cualquiera"))).toBeNull();
    expect(verificarTokenAnticipo(anticipoFirmadoCon(NUEVA))).toEqual({ narradorId: "nar-1" });
  });
});
