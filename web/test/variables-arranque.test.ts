// La alarma de variables al arrancar la web (13/10): la mitad que faltaba del PR #23
// (entrevistador y fábrica). Si a la web le falta una variable en Vercel, avisa a los
// socios una vez por día con los NOMBRES, nunca los valores.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { avisarVariablesAlArrancar, marcaEnStorage, olvidarAvisosDeVariables, revisarVariables } from "../src/lib/variables";

const AHORA = new Date("2026-10-13T15:00:00Z");

function envCompleto(): NodeJS.ProcessEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-secreta",
    SUPABASE_SERVICE_ROLE_KEY: "srk-secreta",
    STRIPE_SECRET_KEY: "sk_secreta",
    STRIPE_WEBHOOK_SECRET: "whsec_secreta",
    MP_ACCESS_TOKEN: "mp-secreta",
    MP_WEBHOOK_SECRET: "mpw-secreta",
    RESEND_API_KEY: "re_secreta",
    MAIL_SOCIOS: "uno@ejemplo.com,dos@ejemplo.com",
    WHATSAPP_NUMERO_PUBLICO: "5491100000000",
    NEXT_PUBLIC_WA_NUMERO: "5491100000000",
    ADMIN_EMAILS: "uno@ejemplo.com",
    ENTREVISTADOR_URL: "https://bot.ejemplo.com",
    SUGERIDAS_CLAVE: "clave-secreta",
  };
}

function storageFalso() {
  const subidos = new Set<string>();
  const upload = vi.fn(async (path: string) => {
    if (subidos.has(path)) return { data: null, error: { message: "The resource already exists", statusCode: "409" } };
    subidos.add(path);
    return { data: { path }, error: null };
  });
  return { subidos, db: { storage: { from: () => ({ upload }) } } as never };
}

beforeEach(() => {
  olvidarAvisosDeVariables();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("revisarVariables (web)", () => {
  it("con todo cargado no hay faltas", () => {
    expect(revisarVariables(envCompleto())).toEqual([]);
  });

  it("faltante, vacía o solo espacios es una falta, con qué deja de andar", () => {
    const env = envCompleto();
    delete env.MAIL_SOCIOS;
    env.STRIPE_WEBHOOK_SECRET = "  ";
    const faltas = revisarVariables(env);
    expect(faltas.map((f) => f.variable).sort()).toEqual(["MAIL_SOCIOS", "STRIPE_WEBHOOK_SECRET"]);
    expect(faltas.find((f) => f.variable === "STRIPE_WEBHOOK_SECRET")!.problema).toMatch(/pedido queda sin pagar/);
  });

  it("las que tienen valor por defecto, los precios de productos aparte y la promo no son una falta", () => {
    const env = envCompleto();
    for (const n of ["URL_BASE", "PRECIO_ARS", "PRECIO_EUR", "PRECIO_IMPRESO_ARS", "PRECIO_VIAJE_EUR", "PROMO_PORCENTAJE", "REGALO_ENTREGA_WHATSAPP"]) delete env[n];
    expect(revisarVariables(env)).toEqual([]);
  });

  it("nunca devuelve un valor, solo nombres", () => {
    const env = envCompleto();
    delete env.ADMIN_EMAILS;
    const texto = JSON.stringify(revisarVariables(env));
    for (const v of Object.values(envCompleto())) expect(texto).not.toContain(v as string);
  });
});

describe("avisarVariablesAlArrancar (web)", () => {
  it("sin faltas no avisa", async () => {
    const avisar = vi.fn(async () => true);
    expect(await avisarVariablesAlArrancar({ env: envCompleto(), avisar, marca: null, ahora: AHORA })).toBe("ok");
    expect(avisar).not.toHaveBeenCalled();
  });

  it("con una falta avisa una vez, con el nombre y sin valores; otra instancia el mismo día no repite", async () => {
    const env = envCompleto();
    delete env.ADMIN_EMAILS;
    const avisar = vi.fn(async () => true);
    const { db } = storageFalso();
    const marca = marcaEnStorage(db);
    expect(await avisarVariablesAlArrancar({ env, avisar, marca, ahora: AHORA })).toBe("avisado");
    const [asunto, detalle] = avisar.mock.calls[0] as unknown as [string, string];
    expect(asunto).toBe("A la web le faltan variables en Vercel");
    expect(detalle).toContain("ADMIN_EMAILS");
    expect(detalle).not.toContain("srk-secreta");
    olvidarAvisosDeVariables(); // otra instancia: sin memoria, con la misma marca en Storage
    expect(await avisarVariablesAlArrancar({ env, avisar, marca, ahora: AHORA })).toBe("ya-avisado");
    expect(avisar).toHaveBeenCalledTimes(1);
  });

  it("sin MAIL_SOCIOS no hay a quién avisar: solo log", async () => {
    const env = envCompleto();
    delete env.MAIL_SOCIOS;
    const avisar = vi.fn(async () => true);
    expect(await avisarVariablesAlArrancar({ env, avisar, marca: null, ahora: AHORA })).toBe("solo-log");
    expect(avisar).not.toHaveBeenCalled();
  });

  it("REGALO_ENTREGA_WHATSAPP prendida sin número es una falta", () => {
    const env = { ...envCompleto(), REGALO_ENTREGA_WHATSAPP: "1" };
    delete env.WHATSAPP_NUMERO_PUBLICO;
    expect(revisarVariables(env).map((f) => f.variable)).toEqual(["WHATSAPP_NUMERO_PUBLICO"]);
  });

  it("si el aviso no sale, otro arranque lo vuelve a intentar", async () => {
    const env = envCompleto();
    delete env.ADMIN_EMAILS;
    const avisar = vi.fn(async () => false);
    expect(await avisarVariablesAlArrancar({ env, avisar, marca: null, ahora: AHORA })).toBe("solo-log");
    expect(await avisarVariablesAlArrancar({ env, avisar, marca: null, ahora: AHORA })).toBe("solo-log");
    expect(avisar).toHaveBeenCalledTimes(2);
  });

  it("nunca tira", async () => {
    const env = envCompleto();
    delete env.ADMIN_EMAILS;
    const avisar = vi.fn(async () => { throw new Error("Resend caído"); });
    expect(await avisarVariablesAlArrancar({ env, avisar, marca: null, ahora: AHORA })).toBe("solo-log");
  });
});
