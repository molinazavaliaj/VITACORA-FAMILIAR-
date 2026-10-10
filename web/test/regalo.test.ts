import { describe, it, expect } from "vitest";
import { ALFABETO_CODIGO, generarCodigo, linkWhatsApp, normalizarCodigo, validarRegalo } from "../src/lib/regalo";

describe("generarCodigo", () => {
  it("arma VF- y 6 caracteres del alfabeto sin ambiguos", () => {
    for (let i = 0; i < 200; i++) {
      const c = generarCodigo();
      expect(c).toMatch(/^VF-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
    }
  });
  it("usa el azar que le pasan", () => {
    expect(generarCodigo(() => 0)).toBe("VF-222222");
    expect(generarCodigo(() => ALFABETO_CODIGO.length - 1)).toBe("VF-ZZZZZZ");
  });
});

describe("normalizarCodigo", () => {
  it("acepta minúsculas, espacios, guiones y sin el VF", () => {
    expect(normalizarCodigo("vf-7k3m2q")).toBe("VF-7K3M2Q");
    expect(normalizarCodigo(" VF 7K3 M2Q ")).toBe("VF-7K3M2Q");
    expect(normalizarCodigo("7K3M2Q")).toBe("VF-7K3M2Q");
  });
  it("rechaza largo malo o caracteres fuera del alfabeto", () => {
    expect(normalizarCodigo("VF-7K3M")).toBeNull();
    expect(normalizarCodigo("VF-7K3M2O")).toBeNull(); // O no existe
    expect(normalizarCodigo("")).toBeNull();
  });
  it("un código que empieza con VF se puede escribir pelado", () => {
    expect(normalizarCodigo("VF3K2M")).toBe("VF-VF3K2M");
    expect(normalizarCodigo("VFVF3K2M")).toBe("VF-VF3K2M");
    expect(normalizarCodigo("vf-vf3k2m")).toBe("VF-VF3K2M");
  });
});

describe("validarRegalo", () => {
  const hoy = new Date("2026-10-08T12:00:00Z");
  it("pide el mensaje", () => {
    expect(validarRegalo({ mensaje: "  ", genero: "varon" }, hoy)).toEqual({ ok: false, mensaje: expect.any(String) });
  });
  it("corta mensajes de más de 600", () => {
    const r = validarRegalo({ mensaje: "a".repeat(601), genero: "varon" }, hoy);
    expect(r.ok).toBe(false);
  });
  it("pide un género de la lista", () => {
    expect(validarRegalo({ mensaje: "Hola", genero: "x" }, hoy).ok).toBe(false);
  });
  it("la fecha es opcional, y si viene no puede ser pasada", () => {
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer" }, hoy)).toEqual({ ok: true, regalo: { mensaje: "Hola", genero: "mujer", fechaEntrega: null, idioma: "es-AR", entrega: null } });
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-12-24" }, hoy))
      .toEqual({ ok: true, regalo: { mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-12-24", idioma: "es-AR", entrega: null } });
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-10-01" }, hoy).ok).toBe(false);
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "mañana" }, hoy).ok).toBe(false);
  });
  it("acepta el hoy de quien regala aunque en UTC ya sea mañana", () => {
    const tarde = new Date("2026-10-09T01:00:00Z"); // 22:00 del 08/10 en Argentina
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-10-08" }, tarde).ok).toBe(true);
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-10-07" }, tarde).ok).toBe(false);
  });
  it("rechaza fechas que no existen en el calendario", () => {
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-02-31" }, hoy).ok).toBe(false);
  });
  it("acepta un mensaje de exactamente 600", () => {
    expect(validarRegalo({ mensaje: "a".repeat(600), genero: "varon" }, hoy).ok).toBe(true);
  });
  it("el idioma es opcional: si falta vale es-AR", () => {
    const r = validarRegalo({ mensaje: "Hola", genero: "varon" }, hoy);
    expect(r.ok && r.regalo.idioma).toBe("es-AR");
  });
  it.each(["es-AR", "es-ES", "ca"] as const)("acepta el idioma %s", (idioma) => {
    const r = validarRegalo({ mensaje: "Hola", genero: "varon", idioma }, hoy);
    expect(r.ok && r.regalo.idioma).toBe(idioma);
  });
  it.each(["en", "", "CA", 3, null])("cualquier otro idioma (%s) da error", (idioma) => {
    expect(validarRegalo({ mensaje: "Hola", genero: "varon", idioma }, hoy)).toEqual({ ok: false, mensaje: "El idioma no es válido." });
  });
  it("rechaza lo que no es un objeto", () => {
    expect(validarRegalo(null, hoy).ok).toBe(false);
    expect(validarRegalo("hola", hoy).ok).toBe(false);
  });
});

describe("linkWhatsApp", () => {
  it("arma wa.me con el mensaje ya escrito", () => {
    expect(linkWhatsApp("5491100000000", "VF-7K3M2Q", "es-AR"))
      .toBe("https://wa.me/5491100000000?text=Hola%2C%20quiero%20empezar%20mi%20libro.%20VF-7K3M2Q");
  });

  it("en catalán, con el mensaje catalán", () => {
    expect(linkWhatsApp("34600000000", "VF-7K3M2Q", "ca"))
      .toBe(`https://wa.me/34600000000?text=${encodeURIComponent("Hola, vull començar el meu llibre. VF-7K3M2Q")}`);
  });
});

import { HORAS_ENTREGA, instanteDeEntrega, zonaDeIdioma } from "../src/lib/regalo-reglas";

describe("instanteDeEntrega", () => {
  it("Argentina: las 10 son las 13 UTC", () => {
    expect(instanteDeEntrega("2026-12-24", 10, "America/Argentina/Buenos_Aires").toISOString()).toBe("2026-12-24T13:00:00.000Z");
  });
  it("Madrid en invierno: las 10 son las 9 UTC", () => {
    expect(instanteDeEntrega("2026-12-24", 10, "Europe/Madrid").toISOString()).toBe("2026-12-24T09:00:00.000Z");
  });
  it("Madrid en verano: las 10 son las 8 UTC", () => {
    expect(instanteDeEntrega("2026-07-01", 10, "Europe/Madrid").toISOString()).toBe("2026-07-01T08:00:00.000Z");
  });
  it("Madrid el día del cambio de horario (29/03): las 10 ya son de verano", () => {
    expect(instanteDeEntrega("2026-03-29", 10, "Europe/Madrid").toISOString()).toBe("2026-03-29T08:00:00.000Z");
  });
  it("Madrid el día que vuelve al invierno (25/10): las 10 ya son de invierno", () => {
    expect(instanteDeEntrega("2026-10-25", 10, "Europe/Madrid").toISOString()).toBe("2026-10-25T09:00:00.000Z");
  });
});

describe("zonaDeIdioma y HORAS_ENTREGA", () => {
  it("es-AR va con Buenos Aires; es-ES y ca con Madrid", () => {
    expect(zonaDeIdioma("es-AR")).toBe("America/Argentina/Buenos_Aires");
    expect(zonaDeIdioma("es-ES")).toBe("Europe/Madrid");
    expect(zonaDeIdioma("ca")).toBe("Europe/Madrid");
  });
  it("de 8 a 22", () => {
    expect(HORAS_ENTREGA[0]).toBe(8);
    expect(HORAS_ENTREGA.at(-1)).toBe(22);
    expect(HORAS_ENTREGA).toHaveLength(15);
  });
});

describe("validarRegalo con entrega", () => {
  const HOY = new Date("2026-10-10T12:00:00Z");
  const base = { mensaje: "Te quiero", genero: "varon", fechaEntrega: "2026-12-24" };

  it("sin entrega: entrega null, como siempre", () => {
    const r = validarRegalo(base, HOY);
    expect(r.ok && r.regalo.entrega).toBeNull();
  });
  it("por mail: el correo en minúsculas y la zona según el idioma", () => {
    const r = validarRegalo({ ...base, idioma: "ca", entrega: { canal: "mail", contacto: " Abuelo@Gmail.com ", hora: 10 } }, HOY);
    expect(r).toEqual({ ok: true, regalo: expect.objectContaining({ entrega: { canal: "mail", contacto: "abuelo@gmail.com", hora: 10, zona: "Europe/Madrid" } }) });
  });
  it("por WhatsApp en es-AR: el celular sin el 9 se arregla", () => {
    const r = validarRegalo({ ...base, entrega: { canal: "whatsapp", contacto: "+54 11 5555 1234", hora: 20 } }, HOY, { whatsapp: true });
    expect(r).toEqual({ ok: true, regalo: expect.objectContaining({ entrega: { canal: "whatsapp", contacto: "+5491155551234", hora: 20, zona: "America/Argentina/Buenos_Aires" } }) });
  });
  it("por WhatsApp en es-ES: un móvil local lleva +34", () => {
    const r = validarRegalo({ ...base, idioma: "es-ES", entrega: { canal: "whatsapp", contacto: "612 34 56 78", hora: 9 } }, HOY, { whatsapp: true });
    expect(r.ok && r.regalo.entrega?.contacto).toBe("+34612345678");
  });
  it("WhatsApp con el interruptor apagado: no", () => {
    const r = validarRegalo({ ...base, entrega: { canal: "whatsapp", contacto: "+5491155551234", hora: 10 } }, HOY);
    expect(r).toEqual({ ok: false, mensaje: "Ese canal no está disponible." });
  });
  it("canal desconocido: no", () => {
    expect(validarRegalo({ ...base, entrega: { canal: "paloma", contacto: "x", hora: 10 } }, HOY, { whatsapp: true }).ok).toBe(false);
  });
  it("horas fuera de 8 a 22, o que no son números enteros: Falta la hora.", () => {
    for (const hora of [7, 23, "10", 10.5, undefined]) {
      expect(validarRegalo({ ...base, entrega: { canal: "mail", contacto: "a@b.com", hora } }, HOY)).toEqual({ ok: false, mensaje: "Falta la hora." });
    }
  });
  it("canal sin fecha: no", () => {
    const { fechaEntrega: _f, ...sinFecha } = base;
    expect(validarRegalo({ ...sinFecha, entrega: { canal: "mail", contacto: "a@b.com", hora: 10 } }, HOY)).toEqual({ ok: false, mensaje: "Falta la fecha." });
  });
  it("correo mal escrito", () => {
    expect(validarRegalo({ ...base, entrega: { canal: "mail", contacto: "abuelo@", hora: 10 } }, HOY)).toEqual({ ok: false, mensaje: "Ese correo parece mal escrito." });
  });
  it("celular mal escrito", () => {
    expect(validarRegalo({ ...base, entrega: { canal: "whatsapp", contacto: "123", hora: 10 } }, HOY, { whatsapp: true })).toEqual({ ok: false, mensaje: "Ese celular parece mal escrito." });
  });
  it("hoy a una hora que ya pasó en la zona de quien recibe", () => {
    // 12:00 UTC = 9 en Buenos Aires: las 8 ya pasaron, las 10 no.
    const hoy = { ...base, fechaEntrega: "2026-10-10" };
    expect(validarRegalo({ ...hoy, entrega: { canal: "mail", contacto: "a@b.com", hora: 8 } }, HOY)).toEqual({ ok: false, mensaje: "Esa hora ya pasó." });
    expect(validarRegalo({ ...hoy, entrega: { canal: "mail", contacto: "a@b.com", hora: 10 } }, HOY).ok).toBe(true);
  });
});
