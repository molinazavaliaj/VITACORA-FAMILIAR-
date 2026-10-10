import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Los mails de la web por país (Naza, 09/10): vos para Argentina, tú para España. El de acceso y la
// invitación son los aprobados el 06/10: sin "te devolvemos el dinero", sin "tercera pregunta" ni
// "primeras páginas", sin "día a día".

const enviados: { subject: string; html: string }[] = [];

beforeEach(() => {
  enviados.length = 0;
  vi.stubEnv("RESEND_API_KEY", "clave-prueba");
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: { body: string }) => {
    enviados.push(JSON.parse(init.body));
    return new Response("{}", { status: 200 });
  }));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("mails de la web por país", () => {
  it("acceso: el texto aprobado; entrá (Argentina o sin región) / entra (España)", async () => {
    const { enviarMailAcceso } = await import("../src/lib/mail");
    await enviarMailAcceso({ para: "a@x.com", comoLeDicen: "abuela", region: "AR" });
    await enviarMailAcceso({ para: "e@x.com", comoLeDicen: "abuela", region: "ES" });
    await enviarMailAcceso({ para: "s@x.com", comoLeDicen: "abuela" });
    const [ar, es, sin] = enviados.map((m) => m.html.replace(/\s+/g, " "));
    expect(enviados[0].subject).toBe("Listo. Hoy le escribimos a tu abuela.");
    expect(ar).toContain("contándole de qué se trata. <strong style=\"font-weight:normal;\">Arranca cuando quiera.</strong>");
    expect(ar).toContain("Cuando empiece a contar su historia te avisamos por acá, y vas a poder escuchar su voz desde tu panel.");
    expect(ar).toContain("Para ir escuchando lo que cuenta, entrá a la página con este mismo correo:");
    expect(es).toContain("Para ir escuchando lo que cuenta, entra a la página con este mismo correo:");
    expect(sin).toContain("entrá a la página");
    for (const t of [ar, es]) expect(t).not.toMatch(/devolvemos el dinero|tercera pregunta|primeras páginas|día a día/);
  });

  it("invitación: el texto aprobado; Entrá / Entra", async () => {
    const { enviarMailInvitacion } = await import("../src/lib/mail");
    await enviarMailInvitacion({ para: "a@x.com", nombreNarrador: "Dora", quienInvita: "Marta", region: "AR" });
    await enviarMailInvitacion({ para: "e@x.com", nombreNarrador: "Imma", quienInvita: "Pere", region: "ES" });
    const [ar, es] = enviados.map((m) => m.html.replace(/\s+/g, " "));
    expect(enviados[0].subject).toBe("Marta te invita a la historia de Dora");
    expect(ar).toContain("Marta te invitó a seguir su historia. Vas a poder escuchar lo que va contando, sumar preguntas que te gustaría que le hagan y agregar fotos de cada época.");
    expect(ar).toContain("Entrá con este mismo correo:");
    expect(es).toContain("Entra con este mismo correo:");
    expect(ar).not.toContain("leer sus páginas");
  });
});
