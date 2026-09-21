import { describe, it, expect } from "vitest";
import { mailsDeAdmin, esAdmin, sinPermiso } from "../src/lib/admin/acceso";

describe("la entrada al panel de la empresa", () => {
  it("parte la lista de mails y la normaliza", () => {
    expect(mailsDeAdmin(" Naza@ejemplo.com , joaquin@ejemplo.com ,, ")).toEqual([
      "naza@ejemplo.com",
      "joaquin@ejemplo.com",
    ]);
  });

  it("sin la variable cargada no habilita a nadie", () => {
    expect(mailsDeAdmin(undefined)).toEqual([]);
    expect(esAdmin("naza@ejemplo.com", mailsDeAdmin(undefined))).toBe(false);
  });

  it("el mail del socio entra aunque venga con otra caja o con espacios", () => {
    const permitidos = mailsDeAdmin("naza@ejemplo.com");
    expect(esAdmin(" NAZA@ejemplo.com ", permitidos)).toBe(true);
  });

  it("un mail que no está en la lista no entra, ni el vacío", () => {
    const permitidos = mailsDeAdmin("naza@ejemplo.com");
    expect(esAdmin("cualquiera@ejemplo.com", permitidos)).toBe(false);
    expect(esAdmin(null, permitidos)).toBe(false);
    expect(esAdmin("", permitidos)).toBe(false);
  });

  it("el mensaje de rechazo no revela la lista", () => {
    const mensaje = sinPermiso(mailsDeAdmin("naza@ejemplo.com,joaquin@ejemplo.com"));
    expect(mensaje).not.toContain("naza@ejemplo.com");
    expect(mensaje).not.toContain("joaquin@ejemplo.com");
    expect(mensaje).toContain("2");
  });
});
