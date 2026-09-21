import { vi } from "vitest";

// Base falsa que se comporta como PostgREST en lo que el panel usa: guarda los filtros
// que recibió cada consulta (para poder mirarlos desde el test) y los aplica de verdad
// sobre las filas. Es el mismo doble para `panel.test.ts` (el panel del cliente) y para
// las consultas del panel de la empresa: una sola pieza, un solo comportamiento.

export type Fila = Record<string, unknown>;

type Operador = "eq" | "in" | "gte" | "lte" | "lt" | "gt" | "is" | "ilike";

export type Consulta = {
  tabla: string;
  op: "select" | "update";
  /** El valor tal cual lo pidió el código: array en `in`, texto en `ilike`. */
  filtros: Fila;
  operadores: Record<string, Operador>;
  columnas: string | null;
  orden: { col: string; asc: boolean } | null;
  limite: number | null;
  valores?: Fila;
};

/** Compara como Postgres: fechas si las dos se pueden leer como fecha, si no números. */
function comparar(a: unknown, b: unknown): number {
  const fechaA = Date.parse(String(a));
  const fechaB = Date.parse(String(b));
  if (!Number.isNaN(fechaA) && !Number.isNaN(fechaB)) return fechaA - fechaB;
  return Number(a) - Number(b);
}

function aplicar(filas: Fila[], c: Consulta): Fila[] {
  let out = filas.filter((f) =>
    Object.entries(c.filtros).every(([col, val]) => {
      const v = f[col];
      switch (c.operadores[col]) {
        case "in":
          return Array.isArray(val) && val.includes(v);
        case "ilike":
          return String(v ?? "").toLowerCase() === val;
        case "gte":
          return comparar(v, val) >= 0;
        case "lte":
          return comparar(v, val) <= 0;
        case "lt":
          return comparar(v, val) < 0;
        case "gt":
          return comparar(v, val) > 0;
        case "is":
          return val === null ? v === null || v === undefined : v === val;
        default:
          return v === val;
      }
    }),
  );
  if (c.orden) {
    const { col, asc } = c.orden;
    out = [...out].sort((x, y) => (asc ? comparar(x[col], y[col]) : comparar(y[col], x[col])));
  }
  if (c.limite !== null) out = out.slice(0, c.limite);
  return out;
}

export function crearAdmin(
  tablas: Record<string, Fila[]>,
  opciones: { sinInvitados?: boolean } = {},
) {
  const updates: { tabla: string; valores: Fila; filtros: Fila }[] = [];
  const consultas: Consulta[] = [];

  function builder(tabla: string) {
    const c: Consulta = {
      tabla,
      op: "select",
      filtros: {},
      operadores: {},
      columnas: null,
      orden: null,
      limite: null,
    };
    consultas.push(c); // se guarda ya mismo: el test la mira después del await

    const b: Record<string, unknown> = {};
    const encadenar = () => b;
    b.select = (cols?: string) => {
      c.columnas = cols ?? null;
      return b;
    };
    b.order = (col: string, o: { ascending?: boolean } = {}) => {
      c.orden = { col, asc: o.ascending !== false };
      return b;
    };
    b.limit = (n: number) => {
      c.limite = n;
      return b;
    };
    b.eq = (col: string, val: unknown) => {
      c.filtros[col] = val;
      c.operadores[col] = "eq";
      return b;
    };
    b.is = (col: string, val: unknown) => {
      c.filtros[col] = val;
      c.operadores[col] = "is";
      return b;
    };
    b.ilike = (col: string, val: unknown) => {
      c.filtros[col] = String(val).toLowerCase();
      c.operadores[col] = "ilike";
      return b;
    };
    b.in = (col: string, vals: unknown[]) => {
      c.filtros[col] = vals;
      c.operadores[col] = "in";
      return b;
    };
    b.gte = (col: string, val: unknown) => {
      c.filtros[col] = val;
      c.operadores[col] = "gte";
      return b;
    };
    b.lte = (col: string, val: unknown) => {
      c.filtros[col] = val;
      c.operadores[col] = "lte";
      return b;
    };
    b.lt = (col: string, val: unknown) => {
      c.filtros[col] = val;
      c.operadores[col] = "lt";
      return b;
    };
    b.gt = (col: string, val: unknown) => {
      c.filtros[col] = val;
      c.operadores[col] = "gt";
      return b;
    };
    b.update = (v: Fila) => {
      c.op = "update";
      c.valores = v;
      return b;
    };

    const resolver = () => {
      if (tabla === "invitados" && opciones.sinInvitados) {
        return { data: null, error: { message: 'relation "invitados" does not exist' } };
      }
      if (c.op === "update") {
        updates.push({ tabla, valores: c.valores ?? {}, filtros: c.filtros });
        return { data: null, error: null };
      }
      return { data: aplicar(tablas[tabla] ?? [], c), error: null };
    };

    b.maybeSingle = () => Promise.resolve({ ...resolver(), data: resolver().data?.[0] ?? null });
    b.single = () => Promise.resolve({ ...resolver(), data: resolver().data?.[0] ?? null });
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolver()).then(res, rej);
    return b;
  }

  return {
    admin: { from: vi.fn(builder) } as never,
    updates,
    consultas,
    /** Las consultas que se hicieron a una tabla, en orden. */
    pedidosA: (tabla: string) => consultas.filter((c) => c.tabla === tabla),
  };
}
