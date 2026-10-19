import { describe, it, expect, vi, beforeEach } from "vitest";

// La memoria por request del panel (docs/rediseno-2026-10/RENDIMIENTO.md §3.2 y §3.3).
//
// En vitest `react` es el build de cliente, donde `cache` no memoriza: así corren
// todos los demás tests (como un route handler). Acá se simula el render de
// servidor con un `cache` que sí guarda por argumentos, para probar que el layout
// y la página comparten una sola carga y que historiaAccesible sale del panel.

const { memorias } = vi.hoisted(() => ({ memorias: [] as Map<string, unknown>[] }));

vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  // Una memoria por función cacheada, con clave por valor de los argumentos (en
  // el panel son textos: id y mail). Vaciarlas es empezar otro request.
  cache:
    <A extends unknown[], R>(fn: (...args: A) => R) => {
      const memoria = new Map<string, unknown>();
      memorias.push(memoria);
      return (...args: A): R => {
        const clave = JSON.stringify(args);
        if (!memoria.has(clave)) memoria.set(clave, fn(...args));
        return memoria.get(clave) as R;
      };
    },
}));

import { crearAdmin } from "./dobles";
import { historiasDelUsuario, historiaAccesible } from "../src/lib/panel";

const alfredo = { id: "n-alfredo", nombre: "Alfredo", como_le_dicen: "Abuelo", estado: "activo", dia_actual: 4, alerta_silencio: false, familia_id: "fam-martina", created_at: "2026-09-10" };
const osvaldo = { id: "n-osvaldo", nombre: "Osvaldo", como_le_dicen: "Don Osvaldo", estado: "completado", dia_actual: 30, alerta_silencio: false, familia_id: "fam-claudia", created_at: "2026-09-01" };
const ajeno = { ...osvaldo, id: "n-ajeno" };
const martina = { id: "u-martina", email: "martina@mail.com" };

const tablas = {
  familias: [{ id: "fam-martina", region: "AR", auth_user_id: "u-martina" }],
  narradores: [alfredo, osvaldo, ajeno],
  invitados: [{ id: "i1", narrador_id: "n-osvaldo", auth_user_id: "u-martina", email: "martina@mail.com" }],
};

beforeEach(() => memorias.forEach((m) => m.clear()));

describe("memoria del panel en un render de servidor", () => {
  it("el layout y la página cargan las historias una sola vez", async () => {
    const { admin, consultas } = crearAdmin(tablas);
    const primera = await historiasDelUsuario(admin, martina);
    const despues = consultas.length;
    const segunda = await historiasDelUsuario(admin, { ...martina }); // otro objeto, mismo usuario
    expect(segunda).toBe(primera);
    expect(consultas.length).toBe(despues);
  });

  it("historiaAccesible sale del panel ya cargado, con el mismo rol, sin ir a la base", async () => {
    const { admin, consultas } = crearAdmin(tablas);
    await historiasDelUsuario(admin, martina);
    const despues = consultas.length;
    expect((await historiaAccesible(admin, martina, "n-alfredo")).historia?.rol).toBe("duena");
    expect((await historiaAccesible(admin, martina, "n-osvaldo")).historia?.rol).toBe("invitado");
    expect(consultas.length).toBe(despues);
  });

  it("una historia que no está en el panel se consulta como antes y sigue siendo null", async () => {
    const { admin, consultas } = crearAdmin(tablas);
    await historiasDelUsuario(admin, martina);
    const despues = consultas.length;
    expect((await historiaAccesible(admin, martina, "n-ajeno")).historia).toBeNull();
    // Solo el narrador: familia e invitados ya estaban en la memoria.
    expect(consultas.slice(despues).map((c) => c.tabla)).toEqual(["narradores"]);
  });

  it("otro usuario no comparte la memoria", async () => {
    const { admin } = crearAdmin({
      ...tablas,
      familias: [...tablas.familias, { id: "fam-claudia", region: "ES", auth_user_id: "u-claudia" }],
    });
    const deMartina = await historiasDelUsuario(admin, martina);
    const deClaudia = await historiasDelUsuario(admin, { id: "u-claudia", email: "claudia@mail.com" });
    expect(deClaudia).not.toBe(deMartina);
    expect(deClaudia.panel.familia?.id).toBe("fam-claudia");
  });
});
