import { describe, it, expect } from "vitest";
import { crearAdmin } from "./dobles";
import { historiasDelUsuario, historiaAccesible, PUEDE } from "../src/lib/panel";

const alfredo = { id: "n-alfredo", nombre: "Alfredo", como_le_dicen: "Abuelo", estado: "activo", dia_actual: 4, alerta_silencio: false, familia_id: "fam-martina", created_at: "2026-09-10" };
const dora = { id: "n-dora", nombre: "Dora", como_le_dicen: "Abuela", estado: "invitado", dia_actual: 0, alerta_silencio: false, familia_id: "fam-martina", created_at: "2026-09-12" };
const osvaldo = { id: "n-osvaldo", nombre: "Osvaldo", como_le_dicen: "Don Osvaldo", estado: "completado", dia_actual: 30, alerta_silencio: false, familia_id: "fam-claudia", created_at: "2026-09-01" };

const martina = { id: "u-martina", email: "martina@mail.com" };

describe("historiasDelUsuario", () => {
  it("la dueña ve sus narradores, del más nuevo al más viejo, como dueña", async () => {
    const { admin } = crearAdmin({
      familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
      narradores: [alfredo, dora],
      invitados: [],
    });
    const { panel, error } = await historiasDelUsuario(admin, martina);
    expect(error).toBeNull();
    // El fixture va a propósito al revés (Alfredo es del 10/09 y Dora del 12/09):
    // así esta expectativa prueba de verdad que el orden es el más nuevo primero.
    expect(panel.historias.map((h) => [h.narrador.nombre, h.rol])).toEqual([
      ["Dora", "duena"],
      ["Alfredo", "duena"],
    ]);
  });

  it("una historia compartida aparece después de las propias, como invitado", async () => {
    const { admin } = crearAdmin({
      familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
      narradores: [alfredo, osvaldo],
      invitados: [{ id: "i1", narrador_id: "n-osvaldo", auth_user_id: "u-martina", email: "martina@mail.com" }],
    });
    const { panel } = await historiasDelUsuario(admin, martina);
    expect(panel.historias.map((h) => [h.narrador.nombre, h.rol])).toEqual([
      ["Alfredo", "duena"],
      ["Osvaldo", "invitado"],
    ]);
  });

  it("una invitación por mail todavía no abierta se vincula al entrar", async () => {
    const { admin, updates } = crearAdmin({
      familias: [],
      narradores: [osvaldo],
      invitados: [{ id: "i1", narrador_id: "n-osvaldo", auth_user_id: null, email: "Martina@Mail.com" }],
    });
    const { panel } = await historiasDelUsuario(admin, martina);
    expect(panel.familia).toBeNull(); // nunca compró nada
    expect(panel.historias).toHaveLength(1);
    expect(panel.historias[0].rol).toBe("invitado");
    expect(updates[0]).toMatchObject({ tabla: "invitados", valores: { auth_user_id: "u-martina" } });
  });

  it("si la tabla invitados no existe todavía, el panel funciona igual sin invitados", async () => {
    const { admin } = crearAdmin(
      { familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }], narradores: [alfredo] },
      { sinInvitados: true },
    );
    const { panel, error } = await historiasDelUsuario(admin, martina);
    expect(error).toBeNull();
    expect(panel.historias).toHaveLength(1);
  });
});

describe("historiaAccesible", () => {
  const tablas = {
    familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
    narradores: [alfredo, osvaldo],
    invitados: [{ id: "i1", narrador_id: "n-osvaldo", auth_user_id: "u-martina", email: "martina@mail.com" }],
  };

  it("el propio narrador: dueña", async () => {
    const { historia } = await historiaAccesible(crearAdmin(tablas).admin, martina, "n-alfredo");
    expect(historia?.rol).toBe("duena");
  });

  it("uno compartido: invitado", async () => {
    const { historia } = await historiaAccesible(crearAdmin(tablas).admin, martina, "n-osvaldo");
    expect(historia?.rol).toBe("invitado");
  });

  it("uno ajeno: null (la página responde 404, no 403, para no confirmar que existe)", async () => {
    const ajeno = { ...osvaldo, id: "n-ajeno" };
    const { historia } = await historiaAccesible(
      crearAdmin({ ...tablas, narradores: [alfredo, ajeno] }).admin, martina, "n-ajeno",
    );
    expect(historia).toBeNull();
  });
});

describe("PUEDE", () => {
  it("la dueña puede todo; el invitado solo agrega", () => {
    expect(PUEDE.editarGuion("duena")).toBe(true);
    expect(PUEDE.editarGuion("invitado")).toBe(false);
    expect(PUEDE.agregarPreguntasYFotos("invitado")).toBe(true);
    expect(PUEDE.cerrarLibro("invitado")).toBe(false);
    expect(PUEDE.descargar("invitado")).toBe(false);
  });
});

describe("token del libro público", async () => {
  const { firmarTokenLibro, verificarTokenLibro, firmarTokenVoz, verificarTokenVoz } = await import("../src/lib/token-libro");
  it("firma y verifica con el secreto; un token tocado no pasa", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secreto-de-prueba";
    const t = firmarTokenLibro("n-osvaldo");
    expect(verificarTokenLibro(t)).toEqual({ narradorId: "n-osvaldo" });
    expect(verificarTokenLibro(t.slice(0, -2) + "xx")).toBeNull();
    expect(verificarTokenLibro("nada")).toBeNull();
  });
  // El código impreso abre el libro entero (spec "Su voz"): es OTRO tipo, así el
  // link que el comprador reenvía para vender copias no abre más que la muestra.
  it("el token 'voz' no abre la muestra ni al revés", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secreto-de-prueba";
    const voz = firmarTokenVoz("n-osvaldo");
    expect(verificarTokenVoz(voz)).toEqual({ narradorId: "n-osvaldo" });
    expect(verificarTokenLibro(voz)).toBeNull();
    expect(verificarTokenVoz(firmarTokenLibro("n-osvaldo"))).toBeNull();
  });
});
