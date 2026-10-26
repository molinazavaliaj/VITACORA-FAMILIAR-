import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  etiquetaCompraGoogle,
  idEventoCompra,
  idGoogleAds,
  idPixelMeta,
  leerConsentimiento,
  medicionConfigurada,
  valorConsentimiento,
} from "../src/lib/medicion";
import { avisarCompraAMeta, eventoCompra, medicionDelRequest, type CompraParaMeta } from "../src/lib/meta-conversiones";
import { confirmarPago } from "../src/lib/confirmar-pago";

// La medición de anuncios (26/10): todo apagado sin ids, nada sin consentimiento.

afterEach(() => {
  vi.unstubAllEnvs();
});

const cookies = (valores: Record<string, string>) => ({
  get: (nombre: string) => (nombre in valores ? { value: valores[nombre] } : undefined),
});

const sha = (t: string) => createHash("sha256").update(t).digest("hex");

const COMPRA: CompraParaMeta = {
  pedidoId: "p1",
  monto: 99,
  moneda: "eur",
  email: " Martina@Ejemplo.com ",
  region: "ES",
  extras: { medicion: { consentimiento: true, fbp: "fb.1.1.2", ip: "1.2.3.4", navegador: "Firefox" } },
  ahora: new Date("2026-11-27T10:00:00Z"),
};

describe("el consentimiento", () => {
  it("lee solo los valores de esta versión", () => {
    expect(leerConsentimiento(valorConsentimiento("si"))).toBe("si");
    expect(leerConsentimiento(valorConsentimiento("no"))).toBe("no");
    expect(leerConsentimiento("v0:si")).toBeNull();
    expect(leerConsentimiento("si")).toBeNull();
    expect(leerConsentimiento(undefined)).toBeNull();
  });
});

describe("los ids de Vercel", () => {
  it("sin ids no hay nada que medir (no aparece el aviso)", () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", "");
    expect(medicionConfigurada()).toBe(false);
  });

  it("un id mal escrito no prende nada", () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "abc");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", "123");
    expect(idPixelMeta()).toBeNull();
    expect(idGoogleAds()).toBeNull();
    expect(medicionConfigurada()).toBe(false);
  });

  it("con el píxel o con Google, sí", () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789012345");
    expect(medicionConfigurada()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", "AW-1234567");
    expect(medicionConfigurada()).toBe(true);
  });

  it("la conversión de Google necesita el id y la etiqueta", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", "AW-1234567");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_COMPRA", "");
    expect(etiquetaCompraGoogle()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_COMPRA", "AbC-dEf12");
    expect(etiquetaCompraGoogle()).toBe("AW-1234567/AbC-dEf12");
  });
});

describe("lo que guarda la compra (medicionDelRequest)", () => {
  const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1", "user-agent": "Firefox" });

  it("sin haber aceptado no guarda nada, aunque estén las cookies de Meta", () => {
    expect(medicionDelRequest(headers, cookies({ _fbp: "fb.1.1.2" }))).toBeUndefined();
    expect(medicionDelRequest(headers, cookies({ "vitacora-cookies": valorConsentimiento("no"), _fbp: "fb.1.1.2" }))).toBeUndefined();
  });

  it("si aceptó, guarda las cookies de Meta, la primera IP y el navegador", () => {
    const m = medicionDelRequest(headers, cookies({ "vitacora-cookies": valorConsentimiento("si"), _fbp: "fb.1.1.2", _fbc: "fb.1.1.abc" }));
    expect(m).toEqual({ consentimiento: true, fbp: "fb.1.1.2", fbc: "fb.1.1.abc", ip: "1.2.3.4", navegador: "Firefox" });
  });
});

describe("la compra para Meta (eventoCompra)", () => {
  it("sin consentimiento en el pedido, no hay nada que mandar", () => {
    expect(eventoCompra({ ...COMPRA, extras: {} })).toBeNull();
    expect(eventoCompra({ ...COMPRA, extras: { medicion: { consentimiento: "si" } } })).toBeNull();
  });

  it("sin importe, tampoco", () => {
    expect(eventoCompra({ ...COMPRA, monto: null })).toBeNull();
  });

  it("manda el correo y el país pasados por SHA-256, el mismo id que el píxel y el importe", () => {
    const cuerpo = eventoCompra(COMPRA) as { data: Record<string, unknown>[] };
    const e = cuerpo.data[0];
    expect(e).toMatchObject({
      event_name: "Purchase",
      event_id: idEventoCompra("p1"),
      event_time: Math.floor(COMPRA.ahora.getTime() / 1000),
      action_source: "website",
      custom_data: { value: 99, currency: "EUR", order_id: "p1" },
    });
    expect(e.user_data).toEqual({
      em: [sha("martina@ejemplo.com")],
      country: [sha("es")],
      fbp: "fb.1.1.2",
      client_ip_address: "1.2.3.4",
      client_user_agent: "Firefox",
    });
    expect(JSON.stringify(cuerpo)).not.toContain("Martina");
  });

  it("sin cookie _fbc pero con fbclid en el origen, arma el fbc como pide Meta", () => {
    const extras = {
      medicion: { consentimiento: true },
      origen: { primero: { fbclid: "IwAR123", fecha: "2026-11-20T10:00:00.000Z", pagina: "/" } },
    };
    const e = (eventoCompra({ ...COMPRA, extras }) as { data: { user_data: { fbc?: string } }[] }).data[0];
    expect(e.user_data.fbc).toBe(`fb.1.${Date.parse("2026-11-20T10:00:00.000Z")}.IwAR123`);
  });
});

describe("el aviso a Meta (avisarCompraAMeta)", () => {
  it("sin píxel o sin token en Vercel no llama a nadie", async () => {
    const fetch = vi.fn();
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "");
    vi.stubEnv("META_CAPI_TOKEN", "secreto");
    expect(await avisarCompraAMeta(COMPRA, { fetch })).toBe("sin-configurar");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789012345");
    vi.stubEnv("META_CAPI_TOKEN", "");
    expect(await avisarCompraAMeta(COMPRA, { fetch })).toBe("sin-configurar");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sin consentimiento no llama a nadie", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789012345");
    vi.stubEnv("META_CAPI_TOKEN", "secreto");
    const fetch = vi.fn();
    expect(await avisarCompraAMeta({ ...COMPRA, extras: {} }, { fetch })).toBe("sin-consentimiento");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("con todo, manda la compra al píxel con el token en el cuerpo, nunca en la URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789012345");
    vi.stubEnv("META_CAPI_TOKEN", "secreto");
    vi.stubEnv("META_GRAPH_VERSION", "");
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await avisarCompraAMeta(COMPRA, { fetch })).toBe("enviado");
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v24.0/123456789012345/events");
    expect(url).not.toContain("secreto");
    expect(JSON.parse(init.body as string)).toMatchObject({ access_token: "secreto", data: [{ event_id: "compra-p1" }] });
  });

  it("si Meta contesta mal o no contesta, devuelve error sin tirar", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789012345");
    vi.stubEnv("META_CAPI_TOKEN", "secreto");
    const malo = vi.fn().mockResolvedValue(new Response("nope", { status: 400 }));
    expect(await avisarCompraAMeta(COMPRA, { fetch: malo })).toBe("error");
    const caido = vi.fn().mockRejectedValue(new Error("red"));
    expect(await avisarCompraAMeta(COMPRA, { fetch: caido })).toBe("error");
  });
});

// Fake mínimo del cliente admin para confirmarPago (como en confirmar-pago.test.ts).
function admin(pedidoActualizado: { id: string; narrador_id: string; familia_id: string } | null, extras: Record<string, unknown>) {
  const from = (tabla: string) => {
    const cadena: Record<string, unknown> = {};
    cadena.update = () => cadena;
    cadena.insert = () => Promise.resolve({ error: null });
    cadena.select = () => cadena;
    cadena.eq = () => cadena;
    cadena.maybeSingle = () => {
      if (tabla === "pedidos") return Promise.resolve({ data: { extras, familia_id: "f1", monto: 99, moneda: "EUR" }, error: null });
      if (tabla === "familias") return Promise.resolve({ data: { email: "martina@ejemplo.com", region: "ES" }, error: null });
      if (tabla === "narradores") return Promise.resolve({ data: { como_le_dicen: "papá" }, error: null });
      return Promise.resolve({ data: null, error: null });
    };
    cadena.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(
        tabla === "pedidos"
          ? { data: pedidoActualizado ? [pedidoActualizado] : [], error: null }
          : tabla === "narradores"
            ? { data: [{ id: "n1" }], error: null }
            : { data: null, error: null },
      ).then(resolve);
    return cadena;
  };
  return { from } as unknown as SupabaseClient;
}

describe("confirmarPago le pasa la compra a Meta", () => {
  const PEDIDO = { id: "p1", narrador_id: "n1", familia_id: "f1" };
  const extras = { pdf: true, medicion: { consentimiento: true } };

  it("la primera confirmación avisa una vez, con el importe, el correo y la región", async () => {
    const avisarCompra = vi.fn().mockResolvedValue("enviado");
    const r = await confirmarPago(admin(PEDIDO, extras), { pedidoId: "p1", referenciaExterna: "cs_1", enviarMailAcceso: vi.fn().mockResolvedValue(true), avisarCompra });
    expect(r.ok).toBe(true);
    expect(avisarCompra).toHaveBeenCalledTimes(1);
    expect(avisarCompra.mock.calls[0][0]).toMatchObject({ pedidoId: "p1", monto: 99, moneda: "EUR", email: "martina@ejemplo.com", region: "ES", extras });
  });

  it("un reintento (el pedido ya estaba pagado) no avisa dos veces", async () => {
    const avisarCompra = vi.fn().mockResolvedValue("enviado");
    await confirmarPago(admin(null, extras), { pedidoId: "p1", referenciaExterna: "cs_1", enviarMailAcceso: vi.fn(), avisarCompra });
    expect(avisarCompra).not.toHaveBeenCalled();
  });

  it("si avisar tira, el pago igual queda confirmado", async () => {
    const avisarCompra = vi.fn().mockRejectedValue(new Error("caído"));
    const r = await confirmarPago(admin(PEDIDO, extras), { pedidoId: "p1", referenciaExterna: "cs_1", enviarMailAcceso: vi.fn().mockResolvedValue(true), avisarCompra });
    expect(r).toMatchObject({ ok: true, yaEstaba: false });
  });
});

describe("los textos de privacidad", () => {
  it("con la medición prendida, dejan de decir que no hay cookies de publicidad", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789012345");
    vi.resetModules();
    const { TEXTOS_LEGAL } = await import("../src/app/_textos/legal");
    for (const idioma of ["es", "ar", "ca"] as const) {
      const texto = JSON.stringify(TEXTOS_LEGAL[idioma].privacidad);
      expect(texto).not.toMatch(/no los usamos para publicidad|no les fem servir per a publicitat/);
      expect(texto).not.toMatch(/ningún aviso|cap avís/);
      expect(texto).toMatch(/_fbp/);
    }
  });

  it("apagada, dicen lo de siempre", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_ID", "");
    vi.resetModules();
    const { TEXTOS_LEGAL } = await import("../src/app/_textos/legal");
    expect(JSON.stringify(TEXTOS_LEGAL.es.privacidad)).toMatch(/no te mostramos ningún aviso/);
    expect(JSON.stringify(TEXTOS_LEGAL.es.privacidad)).not.toMatch(/_fbp/);
  });
});
