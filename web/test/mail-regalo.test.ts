import { describe, it, expect, vi, afterEach } from "vitest";
import { enviarMailRegalo } from "../src/lib/mail";
import { TEXTOS_REGALO } from "../src/lib/regalo-textos";

// Gift card (08/10): el mail que llega al confirmar el pago de un regalo.
// Lleva los textos aprobados y el link a la tarjeta del código.
describe("enviarMailRegalo", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("manda asunto y cuerpo aprobados con el botón a /regalo/<codigo>/tarjeta", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_prueba");
    vi.stubEnv("URL_BASE", "https://vitacorafamiliar.com");
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
    vi.stubGlobal("fetch", fetchFalso);

    const r = await enviarMailRegalo({ para: "martina@ejemplo.com", comoLeDicen: "abuelo", codigo: "VF-7K3M2Q" });

    expect(r).toBe(true);
    const cuerpo = JSON.parse(fetchFalso.mock.calls[0][1].body);
    expect(cuerpo.to).toEqual(["martina@ejemplo.com"]);
    expect(cuerpo.subject).toBe(TEXTOS_REGALO.mailAsunto("abuelo"));
    expect(cuerpo.html).toContain(TEXTOS_REGALO.mailCuerpo("abuelo"));
    expect(cuerpo.html).toContain(TEXTOS_REGALO.mailBoton);
    expect(cuerpo.html).toContain('href="https://vitacorafamiliar.com/regalo/VF-7K3M2Q/tarjeta"');
  });

  it("sin RESEND_API_KEY no tira: devuelve false", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchFalso = vi.fn();
    vi.stubGlobal("fetch", fetchFalso);
    expect(await enviarMailRegalo({ para: "a@b.com", comoLeDicen: "abuela", codigo: "VF-AAAAAA" })).toBe(false);
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
