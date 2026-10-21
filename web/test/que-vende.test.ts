import { afterEach, describe, expect, it } from "vitest";
import { queVende } from "@/lib/que-vende";

// 21/10: lo que lee el bot para comprobar que tiene las plantillas de todo lo que se vende.
describe("qué vende la web, por producto e idioma del bot", () => {
  const antes = { ...process.env };
  afterEach(() => {
    process.env = { ...antes };
  });

  it("Kids: Argentina con su precio; España y catalán solo con el precio en euros", () => {
    Object.assign(process.env, { KIDS_VENTA: "1", PRECIO_KIDS_ARS: "85750", PRECIO_KIDS_EUR: "" });
    expect(queVende().kids).toEqual(["es-AR"]);
    process.env.PRECIO_KIDS_EUR = "49";
    expect(queVende().kids).toEqual(["es-AR", "es-ES", "ca"]);
    process.env.KIDS_VENTA = "";
    expect(queVende().kids).toEqual([]);
  });

  it("el regalo por WhatsApp solo con REGALO_ENTREGA_WHATSAPP=1", () => {
    expect(queVende({ ...process.env, REGALO_ENTREGA_WHATSAPP: "1" } as NodeJS.ProcessEnv).regaloEntrega).toBe(true);
    expect(queVende({ ...process.env, REGALO_ENTREGA_WHATSAPP: "" } as NodeJS.ProcessEnv).regaloEntrega).toBe(false);
  });
});
