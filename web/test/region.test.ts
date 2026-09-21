import { describe, it, expect } from "vitest";
import { regionDePais, regionDelRequest } from "../src/lib/region";

// 2.12 (21/09): la región inicial sale del país del visitante. Vercel lo manda
// en `x-vercel-ip-country`. Europa → España (EUR); el resto → Argentina (ARS),
// que era el default de siempre. El selector de la pantalla sigue mandando.
describe("región por IP", () => {
  it("un país europeo arranca en España; Argentina y el resto, en Argentina", () => {
    expect(regionDePais("ES")).toBe("ES");
    expect(regionDePais("PT")).toBe("ES");
    expect(regionDePais("DE")).toBe("ES");
    expect(regionDePais("gb")).toBe("ES");
    expect(regionDePais("AR")).toBe("AR");
    expect(regionDePais("UY")).toBe("AR");
    expect(regionDePais("US")).toBe("AR");
  });
  it("sin país (local, header vacío, basura) → Argentina", () => {
    expect(regionDePais(null)).toBe("AR");
    expect(regionDePais(undefined)).toBe("AR");
    expect(regionDePais("")).toBe("AR");
    expect(regionDePais("XX")).toBe("AR");
  });
  it("lee el header de Vercel (y el de Cloudflare como respaldo)", () => {
    expect(regionDelRequest(new Headers({ "x-vercel-ip-country": "ES" }))).toBe("ES");
    expect(regionDelRequest(new Headers({ "cf-ipcountry": "FR" }))).toBe("ES");
    expect(regionDelRequest(new Headers())).toBe("AR");
  });
});
