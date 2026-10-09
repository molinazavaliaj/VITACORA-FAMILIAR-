import { describe, it, expect, vi } from "vitest";
import { enviarRegalo, type PedidoRegalo } from "../src/app/regalar/enviar";
import { TEXTOS_REGALO } from "../src/lib/regalo-textos";

// Gift card, Task 8: el camino de pagar de /regalar, con fetch y la
// redirección falsos (no hay jsdom en el proyecto).

const pedido = (extra: Partial<PedidoRegalo> = {}): PedidoRegalo => ({
  nombre: "  Osvaldo Pérez ",
  comoLeDicen: " abuelo ",
  genero: "varon",
  mensaje: "  Quiero tu historia para siempre.\n",
  fechaEntrega: "",
  nombreComprador: " Lucía ",
  vinculoComprador: " nieta ",
  email: " lucia@example.com ",
  region: "AR",
  idioma: "es-AR",
  audio: null,
  ...extra,
});

const OK = { urlPago: "https://pago.example/abc", narradorId: "n-1", tokenFotos: "tok+/=", codigo: "VF-7K3M2Q" };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

function dobles(audio: (init?: RequestInit) => Promise<Response> = async () => respuesta({ ok: true })) {
  const llamadas: { url: string; init?: RequestInit }[] = [];
  const fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    llamadas.push({ url: String(url), init });
    if (String(url) === "/api/compra") return respuesta(OK);
    return audio(init);
  }) as unknown as typeof globalThis.fetch;
  const asignar = vi.fn();
  return { fetch, asignar, llamadas };
}

describe("enviarRegalo", () => {
  it("manda a /api/compra el cuerpo exacto, sin teléfono y sin fecha si no hay", async () => {
    const d = dobles();
    const r = await enviarRegalo(pedido(), d);
    expect(r).toEqual({ ok: true });
    expect(d.llamadas[0].url).toBe("/api/compra");
    expect(d.llamadas[0].init?.method).toBe("POST");
    expect(JSON.parse(String(d.llamadas[0].init?.body))).toEqual({
      nombreComprador: "Lucía",
      vinculoComprador: "nieta",
      region: "AR",
      email: "lucia@example.com",
      narrador: { nombre: "Osvaldo Pérez", comoLeDicen: "abuelo" },
      regalo: { mensaje: "Quiero tu historia para siempre.", genero: "varon", idioma: "es-AR" },
      productos: { impresos: 0, marcos: 0 },
    });
  });

  it("con fecha, la manda tal cual", async () => {
    const d = dobles();
    await enviarRegalo(pedido({ fechaEntrega: "2026-12-24", region: "ES" }), d);
    const cuerpo = JSON.parse(String(d.llamadas[0].init?.body));
    expect(cuerpo.regalo.fechaEntrega).toBe("2026-12-24");
    expect(cuerpo.region).toBe("ES");
  });

  it("manda el idioma elegido en el regalo", async () => {
    const d = dobles();
    await enviarRegalo(pedido({ idioma: "ca", region: "ES" }), d);
    expect(JSON.parse(String(d.llamadas[0].init?.body)).regalo.idioma).toBe("ca");
  });

  it("sin audio no hay subida: una sola llamada y al pago", async () => {
    const d = dobles();
    await enviarRegalo(pedido(), d);
    expect(d.llamadas).toHaveLength(1);
    expect(d.asignar).toHaveBeenCalledWith(OK.urlPago);
  });

  it("con audio, lo sube después de la compra con el narrador y el token devueltos, y va al pago", async () => {
    const d = dobles();
    const audio = new Blob(["x"], { type: "audio/webm" });
    await enviarRegalo(pedido({ audio }), d);
    expect(d.llamadas.map((l) => l.url)).toEqual([
      "/api/compra",
      `/api/regalo/audio?narrador=n-1&token=${encodeURIComponent("tok+/=")}`,
    ]);
    const fd = d.llamadas[1].init?.body as FormData;
    expect(fd.get("audio")).toBeInstanceOf(Blob);
    expect(d.llamadas[1].init?.method).toBe("POST");
    expect(d.asignar).toHaveBeenCalledWith(OK.urlPago);
    // La redirección es lo último: después de la subida.
    expect((d.fetch as unknown as ReturnType<typeof vi.fn>).mock.invocationCallOrder[1]).toBeLessThan(d.asignar.mock.invocationCallOrder[0]);
  });

  it("si la subida del audio falla (red o 4xx), igual va al pago", async () => {
    for (const falla of [async () => { throw new TypeError("red"); }, async () => respuesta({ error: "Ese archivo no es un audio." }, 400)]) {
      const d = dobles(falla);
      const r = await enviarRegalo(pedido({ audio: new Blob(["x"], { type: "audio/webm" }) }), d);
      expect(r).toEqual({ ok: true });
      expect(d.asignar).toHaveBeenCalledWith(OK.urlPago);
    }
  });

  it("si la subida tarda más que la espera, se corta y va al pago", async () => {
    const d = dobles((init) => new Promise((_, rechazar) => {
      init?.signal?.addEventListener("abort", () => rechazar(new DOMException("corte", "AbortError")));
    }));
    const r = await enviarRegalo(pedido({ audio: new Blob(["x"], { type: "audio/webm" }) }), { ...d, esperaAudioMs: 10 });
    expect(r).toEqual({ ok: true });
    expect(d.llamadas[1].init?.signal?.aborted).toBe(true);
    expect(d.asignar).toHaveBeenCalledWith(OK.urlPago);
  });

  it("si la compra no sale bien, devuelve el error del servidor, no sube el audio ni redirige", async () => {
    const llamadas: string[] = [];
    const fetch = (async (url: string) => {
      llamadas.push(url);
      return respuesta({ error: "Falta elegir si es hombre o mujer." }, 400);
    }) as unknown as typeof globalThis.fetch;
    const asignar = vi.fn();
    const r = await enviarRegalo(pedido({ audio: new Blob(["x"], { type: "audio/webm" }) }), { fetch, asignar });
    expect(r).toEqual({ error: "Falta elegir si es hombre o mujer." });
    expect(llamadas).toEqual(["/api/compra"]);
    expect(asignar).not.toHaveBeenCalled();
  });

  it("si la compra falla sin mensaje o por red, devuelve el error genérico", async () => {
    const asignar = vi.fn();
    const sinMensaje = (async () => respuesta({}, 500)) as unknown as typeof globalThis.fetch;
    expect(await enviarRegalo(pedido(), { fetch: sinMensaje, asignar })).toEqual({ error: TEXTOS_REGALO.errorPago });
    const red = (async () => { throw new TypeError("red"); }) as unknown as typeof globalThis.fetch;
    expect(await enviarRegalo(pedido(), { fetch: red, asignar })).toEqual({ error: TEXTOS_REGALO.errorPago });
    expect(asignar).not.toHaveBeenCalled();
  });
});
