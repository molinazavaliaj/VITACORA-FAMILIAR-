import { describe, it, expect } from "vitest";
import { crearLoteConCodigos, type ClienteLotes } from "../src/lib/lote-codigos";

// Doble de Supabase: guarda lo insertado y deja fallar la inserción N de códigos.
function doble(opts: { falla?: (n: number, fila: Record<string, unknown>) => { code?: string; message: string } | null; falloBorrar?: boolean } = {}) {
  const log = { lotes: [] as Record<string, unknown>[], codigos: [] as string[], borrados: [] as string[], intentos: 0 };
  const cliente: ClienteLotes = {
    from: (tabla) => ({
      insert: (fila) => {
        const res = (): { data?: { id: string } | null; error: { code?: string; message: string } | null } => {
          if (tabla === "lotes_impresos") { log.lotes.push(fila); return { data: { id: "LOTE1" }, error: null }; }
          log.intentos++;
          const err = opts.falla?.(log.intentos, fila) ?? null;
          if (!err) log.codigos.push(String(fila.codigo));
          return { error: err };
        };
        const p = Promise.resolve(res()) as Promise<ReturnType<typeof res>> & { select: () => { single: () => Promise<ReturnType<typeof res>> } };
        p.select = () => ({ single: () => Promise.resolve(res()) });
        return p;
      },
      delete: () => ({
        eq: (_c, val) => {
          log.borrados.push(val);
          return Promise.resolve({ error: opts.falloBorrar ? { message: "boom" } : null });
        },
      }),
    }),
  };
  return { cliente, log };
}

let n = 0;
const generar = () => `VF-${String(++n).padStart(6, "A")}`;

describe("crearLoteConCodigos", () => {
  it("camino feliz: devuelve los códigos y no borra nada", async () => {
    const { cliente, log } = doble();
    const r = await crearLoteConCodigos(cliente, { localId: "L", idioma: "ca", cantidad: 3 }, generar);
    expect(r.codigos).toHaveLength(3);
    expect(log.borrados).toEqual([]);
  });

  it("un 23505 pide otro código y sigue", async () => {
    const { cliente } = doble({ falla: (i) => (i === 1 ? { code: "23505", message: "dup" } : null) });
    const r = await crearLoteConCodigos(cliente, { localId: "L", idioma: "ca", cantidad: 2 }, generar);
    expect(r.codigos).toHaveLength(2);
  });

  it("si falla un código, borra el lote y avisa que no quedó nada", async () => {
    const { cliente, log } = doble({ falla: (i) => (i === 2 ? { message: "caída" } : null) });
    await expect(crearLoteConCodigos(cliente, { localId: "L", idioma: "ca", cantidad: 3 }, generar)).rejects.toThrow(/caída.*No quedó nada guardado/);
    expect(log.borrados).toEqual(["LOTE1"]);
  });

  it("5 colisiones seguidas también limpian", async () => {
    const { cliente, log } = doble({ falla: () => ({ code: "23505", message: "dup" }) });
    await expect(crearLoteConCodigos(cliente, { localId: "L", idioma: "ca", cantidad: 1 }, generar)).rejects.toThrow(/5 intentos/);
    expect(log.borrados).toEqual(["LOTE1"]);
  });

  it("si la limpieza falla, el mensaje trae el id del lote", async () => {
    const { cliente } = doble({ falla: () => ({ message: "caída" }), falloBorrar: true });
    await expect(crearLoteConCodigos(cliente, { localId: "L", idioma: "ca", cantidad: 1 }, generar)).rejects.toThrow(/LOTE1.*a mano/);
  });
});
