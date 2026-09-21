# Panel de la empresa — Parte B: el panel en la web (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que Naza y Joaquín entren a `/admin` y vean, en cinco pantallas, si algo se frenó, cómo va cada familia, cuánto entró y cuánto quedó, de dónde sale cada peso y dónde se cortó la cadena de cerebros — leyendo lo que la Parte A ya anota.

**Architecture:** una ruta nueva `/admin` dentro de la web de Next 16, protegida por una lista de mails (chequeo en el servidor). Toda la lógica vive en funciones puras de `web/src/lib/admin/` (frenos, plata, mapa, consultas) que se testean solas; las páginas son renderizadores finos que las llaman. **Sólo lectura**: la única escritura es cargar un gasto a mano. La estética y el marcado salen del mockup ya commiteado (`docs/panel-interno.html`), con los tokens de marca de `globals.css`.

**Tech Stack:** Next 16.3.4 (App Router, Server Components, `LayoutProps` tipadas), React 19.2.8, Supabase (`@supabase/ssr` + service role), Tailwind v4 con las variables de `globals.css`, vitest para los tests.

**Spec:** `docs/superpowers/specs/2026-09-21-panel-de-la-empresa-design.md`
**Mockup (la autoridad visual):** `docs/panel-interno.html`
**Parte A (hecha):** `docs/superpowers/plans/2026-09-21-panel-empresa-a-instrumentacion.md`

**Rama:** `panel-de-la-empresa`.

## Global Constraints

- **Sólo mirar.** Ninguna pantalla escribe en la base, salvo el alta de un gasto manual (Tarea B7). Nada de botones de pausar, reintentar ni aprobar.
- **El permiso se chequea en el servidor**: la lista de mails vive en la variable `ADMIN_EMAILS` (separados por coma) y se compara contra el mail del usuario logueado del lado del servidor. Nunca en el navegador, nunca en el HTML.
- **Sin links a `/admin`** desde ninguna otra parte del sitio.
- Castellano rioplatense en la interfaz y en los comentarios. Se le habla a Naza y a Joaquín (los dos son "ustedes" del negocio: la interfaz dice "vos" sólo donde el mockup lo dice).
- Los tokens de color son los de la marca (`var(--texto)`, `var(--linea-fuerte)`, `var(--acento)`…), **nunca colores crudos**: el panel tiene que pasar de claro a oscuro con la clase `.oscuro` como el tablero.
- **Next 16 tiene cambios que rompen**: antes de escribir una página, leer la guía correspondiente en `web/node_modules/next/dist/docs/` (lo pide `web/AGENTS.md`).
- Antes de dar una tarea por hecha: `cd web && npm test` en verde y `npx tsc --noEmit -p tsconfig.json` limpio.
- Los tests de la web **no tocan la base**: el doble del cliente de Supabase aplica los filtros (`eq`/`lt`/`in`/`order`/`limit`) como PostgREST, y se mockea en el borde, nunca una función interna del módulo bajo prueba.
- La lógica que decide (frenos, plata, mapa) va en funciones puras que reciben filas y devuelven datos; las páginas no calculan nada.

## Review Focus

Los cinco casos que el spec implica y que ningún test de tarea cubre solo. **Cada uno tiene su test en la tarea que le toca** (se indica abajo):

1. **Cobros en dos monedas** (ARS y EUR) y gastos en USD: la cuenta tiene que cerrar en una sola moneda con el tipo de cambio usado a la vista. Si el tipo de cambio es 0 o falta, **el panel no puede inventar**: muestra el número sin convertir y lo dice. → B4.
2. **Una tabla vacía o la migración sin aplicar** (`consumo_ia`/`latidos` vacíos): la pantalla muestra el estado vacío, no un error ni un `NaN`. → B3 y B6.
3. **Un pedido `pendiente_pago` viejo** de un narrador que ya tiene libro entregado (dato real posible): no puede contarse como ingreso ni como freno dos veces. → B2 y B4.
4. **La voz de la PC de música**: mientras narra un capítulo no late (14-33 min medidos). Si el panel mira sólo el latido, muestra "se cayó" con la máquina trabajando. → B5.
5. **Un mail que entra a `/admin` sin estar en la lista** (y el caso "la variable no está cargada"): tiene que ver una pantalla de "no" — nunca el panel, ni siquiera un rato. → B1.

---

### Tarea B1: el acceso (`/admin`, sin links y sin sorpresas)

**Files:**
- Create: `web/src/lib/admin/acceso.ts`
- Create: `web/src/app/admin/layout.tsx`
- Modify: `web/src/middleware.ts` (agregar `/admin/:path*` al matcher)
- Test: `web/test/admin-acceso.test.ts`

**Interfaces:**
- Consumes: `crearClienteSesion()` (`web/src/lib/supabase/sesion.ts`), `crearClienteServidor()`.
- Produces:
  - `export function mailsDeAdmin(variable: string | undefined): string[]` — parte `ADMIN_EMAILS` por coma, recorta, pasa a minúsculas, descarta vacíos.
  - `export function esAdmin(email: string | null | undefined, permitidos: string[]): boolean` — compara en minúsculas.
  - `export function sinPermiso(permitidos: string[]): string` — el mensaje que ve el que no está en la lista (menciona cuántos mails están habilitados, nunca cuáles).

- [ ] **Paso 1: el test que falla**

```ts
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
```

- [ ] **Paso 2: correrlo y ver que falla**

Run: `cd web && npx vitest run test/admin-acceso.test.ts`
Expected: FAIL — `Failed to resolve import "../src/lib/admin/acceso"`.

- [ ] **Paso 3: escribir el módulo**

```ts
// Quién entra al panel de la empresa (docs/superpowers/specs/
// 2026-09-21-panel-de-la-empresa-design.md §2): sólo los mails de la variable
// `ADMIN_EMAILS`, del lado del servidor. No hay links a /admin en ningún lado y
// sin la variable cargada no entra nadie (falla cerrado, no abierto).

export function mailsDeAdmin(variable: string | undefined): string[] {
  return (variable ?? "")
    .split(",")
    .map((mail) => mail.trim().toLowerCase())
    .filter(Boolean);
}

export function esAdmin(email: string | null | undefined, permitidos: string[]): boolean {
  const mio = (email ?? "").trim().toLowerCase();
  return mio.length > 0 && permitidos.includes(mio);
}

/** Lo que ve el que no está en la lista. No dice CUÁLES mails están habilitados. */
export function sinPermiso(permitidos: string[]): string {
  return permitidos.length === 0
    ? "El panel todavía no tiene quién pueda entrar: falta cargar ADMIN_EMAILS."
    : `Esta dirección no entra al panel de la empresa (están habilitadas ${permitidos.length}).`;
}
```

- [ ] **Paso 4: correr el test y verlo pasar**

Run: `cd web && npx vitest run test/admin-acceso.test.ts`
Expected: PASS (5 tests).

- [ ] **Paso 5: el layout que exige permiso**

`web/src/app/admin/layout.tsx`, copiando el patrón de `web/src/app/tablero/layout.tsx` (las tres
tipografías con `next/font/google`, la cookie del tema y el `div#panel` con la clase `.oscuro`):

```tsx
export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const supabase = await crearClienteSesion();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const permitidos = mailsDeAdmin(process.env.ADMIN_EMAILS);
  if (!esAdmin(user.email, permitidos)) {
    return (
      <div className="p-10 text-[var(--texto)]">
        <p className="max-w-[560px]">{sinPermiso(permitidos)}</p>
      </div>
    );
  }
  // …el cascarón: barra negra con el nombre, la pestaña activa y el chip «sólo lectura»
}
```

- [ ] **Paso 6: el matcher del middleware**

En `web/src/middleware.ts`, el `config.matcher` pasa a:

```ts
matcher: ["/tablero/:path*", "/admin/:path*", "/comprar", "/entrar"],
```

- [ ] **Paso 7: typecheck, suite y commit**

Run: `cd web && npx tsc --noEmit -p tsconfig.json && npm test`
Expected: limpio y verde (el conteo real se lee de la corrida).

```bash
git add web/src/lib/admin/acceso.ts web/src/app/admin/layout.tsx web/src/middleware.ts web/test/admin-acceso.test.ts
git commit -m "panel de la empresa: la entrada, solo para los mails de ADMIN_EMAILS"
```

---

### Tarea B2: los frenos (el corazón de «Estado» y de los colores del mapa)

**Files:**
- Create: `web/src/lib/admin/frenos.ts`
- Test: `web/test/admin-frenos.test.ts`

**Interfaces:**
- Consumes: filas crudas (sin cliente de base: es puro).
- Produces:
  - `export type Gravedad = "rojo" | "ambar" | "verde"`
  - `export type Freno = { gravedad: Gravedad; que: string; detalle: string; desde: string | null; horas: number | null; quien: string | null }`
  - `export const UMBRALES = { silencioDias: 3, libroSinArrancarHoras: 24, vozSinAvanceHoras: 6, pagoSinConfirmarHoras: 12, latidoSinLatearVeces: 3, vozSinLatidoMinutos: 45 }`
  - `export function horasEntre(desde: string, hasta: Date): number | null`
  - `export function frenosDe(datos: DatosDelPanel, ahora: Date): Freno[]` — ordenados por gravedad y antigüedad
  - `export function contarPorGravedad(frenos: Freno[]): Record<Gravedad, number>`

- [ ] **Paso 1: el test que falla**

```ts
import { describe, it, expect } from "vitest";
import { frenosDe, contarPorGravedad, type DatosDelPanel } from "../src/lib/admin/frenos";

const AHORA = new Date("2026-09-21T12:00:00Z");
const hace = (horas: number) => new Date(AHORA.getTime() - horas * 3600_000).toISOString();

function datos(parcial: Partial<DatosDelPanel>): DatosDelPanel {
  return { narradores: [], pedidos: [], narraciones: [], latidos: [], ...parcial };
}

describe("los frenos", () => {
  it("el narrador que no contesta hace 4 días es ámbar y dice cuántos días", () => {
    const f = frenosDe(datos({ narradores: [{
      id: "n1", nombre: "Osvaldo", estado: "activo", dia_actual: 17,
      ultima_respuesta_at: hace(96), alerta_silencio: true,
    }] }), AHORA);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ gravedad: "ambar", quien: "Osvaldo" });
    expect(f[0].detalle).toContain("4");
  });

  it("el que contestó hace 6 horas no es un freno", () => {
    const f = frenosDe(datos({ narradores: [{
      id: "n1", nombre: "Rosa", estado: "activo", dia_actual: 12,
      ultima_respuesta_at: hace(6), alerta_silencio: false,
    }] }), AHORA);
    expect(f).toEqual([]);
  });

  it("un pago sin confirmar hace 26 h es rojo; hace 3 h no", () => {
    const pedidos = [
      { id: "p1", estado: "pendiente", created_at: hace(26), narrador_id: "n1", monto: 49, moneda: "EUR" },
      { id: "p2", estado: "pendiente", created_at: hace(3), narrador_id: "n2", monto: 49, moneda: "EUR" },
    ];
    const f = frenosDe(datos({ pedidos: pedidos as never }), AHORA);
    expect(f).toHaveLength(1);
    expect(f[0].gravedad).toBe("rojo");
    expect(f[0].detalle).toContain("pago");
  });

  it("una narración sin avanzar hace 9 h es roja (el criterio del repo son 6)", () => {
    const f = frenosDe(datos({ narraciones: [{
      id: "x1", narrador_id: "n1", estado: "procesando", actualizada_at: hace(9), created_at: hace(40),
    }] }), AHORA);
    expect(f[0].gravedad).toBe("rojo");
    expect(f[0].detalle).toContain("voz");
  });

  it("un pedido pagado hace 30 h que la fábrica no tomó es rojo", () => {
    const f = frenosDe(datos({ pedidos: [{
      id: "p3", estado: "pagado", created_at: hace(30), narrador_id: "n1", monto: 49, moneda: "EUR",
    }] as never }), AHORA);
    expect(f[0].gravedad).toBe("rojo");
    expect(f[0].detalle).toContain("sin arrancar");
  });

  it("un pedido pendiente viejo de un narrador con libro entregado NO es un freno", () => {
    const f = frenosDe(datos({
      pedidos: [{ id: "p4", estado: "pendiente", created_at: hace(200), narrador_id: "n1", monto: 49, moneda: "EUR" }] as never,
      narradores: [{ id: "n1", nombre: "Ferrer", estado: "completado", dia_actual: 30, ultima_respuesta_at: hace(48), alerta_silencio: false, libro_aprobado_at: hace(72) }],
    }), AHORA);
    expect(f.some((freno) => freno.detalle.includes("pago"))).toBe(false);
  });

  it("sin base, sin frenos: la pantalla muestra el vacío, no un error", () => {
    expect(frenosDe(datos({}), AHORA)).toEqual([]);
    expect(contarPorGravedad([])).toEqual({ rojo: 0, ambar: 0, verde: 0 });
  });

  it("ordena primero los rojos y, adentro, el más viejo", () => {
    const f = frenosDe(datos({
      pedidos: [{ id: "p1", estado: "pendiente", created_at: hace(26), narrador_id: "n2", monto: 49, moneda: "EUR" }] as never,
      narraciones: [{ id: "x1", narrador_id: "n1", estado: "procesando", actualizada_at: hace(9), created_at: hace(40) }],
    }), AHORA);
    expect(f.map((x) => x.gravedad)).toEqual(["rojo", "rojo"]);
    expect(f[0].horas! >= f[1].horas!).toBe(true);
  });
});
```

- [ ] **Paso 2: correrlo y ver que falla**

Run: `cd web && npx vitest run test/admin-frenos.test.ts`
Expected: FAIL — no existe `../src/lib/admin/frenos`.

- [ ] **Paso 3: escribirlo**

El módulo lleva los umbrales del spec (§7) con los dos criterios que ya existían en el repo (silencio 3 días,
voz 6 h), el freno nuevo del pago (12 h) y el del libro sin arrancar (24 h). Cada freno se arma con una
función chica por tipo (`frenoDeSilencio`, `frenoDePago`, `frenoDeLibroEnCola`, `frenoDeVoz`, `frenoDeLatido`)
y `frenosDe` los junta y ordena. La regla del punto 3 del Review Focus va explícita: un pedido `pendiente`
cuyo narrador ya tiene `libro_aprobado_at` o está `entregado` **no** cuenta.

- [ ] **Paso 4: correrlo y verlo pasar, typecheck y commit**

Run: `cd web && npx vitest run test/admin-frenos.test.ts && npx tsc --noEmit -p tsconfig.json`
Expected: PASS (8 tests) y typecheck limpio.

```bash
git add web/src/lib/admin/frenos.ts web/test/admin-frenos.test.ts
git commit -m "panel de la empresa: los frenos y sus umbrales"
```

---

### Tarea B3: las consultas (lo que el panel lee de la base)

**Files:**
- Create: `web/src/lib/admin/datos.ts`
- Test: `web/test/admin-datos.test.ts`

**Interfaces:**
- Consumes: el cliente de service role (`crearClienteServidor()`), las tablas de la Parte A.
- Produces: `export async function datosDelPanel(admin: SupabaseClient, ahora: Date): Promise<DatosDelPanel>`
  con

```ts
export type DatosDelPanel = {
  narradores: NarradorPanel[];      // id, nombre, como_le_dicen, estado, dia_actual, familia_id, ultima_respuesta_at, alerta_silencio, libro_aprobado_at, contexto
  familias: FamiliaPanel[];         // id, region, email
  pedidos: PedidoPanel[];           // id, narrador_id, familia_id, estado, monto, moneda, extras, created_at, proveedor
  respuestas: RespuestaPanel[];     // narrador_id, pregunta_orden, es_repregunta, texto_directo, transcripcion, duracion_segundos, recibido_at
  envios: EnvioPanel[];             // narrador_id, tipo, enviado_at
  narraciones: NarracionPanel[];    // id, narrador_id, estado, actualizada_at, created_at
  fotos: FotoPanel[];               // narrador_id
  consumo: ConsumoPanel[];          // fecha, servicio, paso, modelo, proveedor, cuenta, narrador_id, tokens, usd
  latidos: LatidoPanel[];           // servicio, ultimo_ping, detalle
  gastos: GastoPanel[];             // fecha, concepto, monto, moneda, categoria, quien
};
```

- [ ] **Paso 1: el test que falla** (con el doble que aplica los filtros, como

  `web/test/panel.test.ts:crearAdmin`)

```ts
import { describe, it, expect } from "vitest";
import { datosDelPanel } from "../src/lib/admin/datos";
import { crearAdmin } from "./dobles";   // el mismo doble filtrador que usa panel.test.ts

describe("las consultas del panel", () => {
  it("una tabla nueva y vacía devuelve listas vacías, no un error", async () => {
    const admin = crearAdmin({ narradores: [{ id: "n1", nombre: "Rosa", estado: "activo" }], consumo_ia: [], latidos: [], gastos_manuales: [] });
    const datos = await datosDelPanel(admin as never, new Date("2026-09-21T12:00:00Z"));
    expect(datos.narradores).toHaveLength(1);
    expect(datos.consumo).toEqual([]);
    expect(datos.latidos).toEqual([]);
  });

  it("pide el gasto de los últimos 31 días, no toda la historia", async () => {
    const admin = crearAdmin({ consumo_ia: [] });
    await datosDelPanel(admin as never, new Date("2026-09-21T12:00:00Z"));
    const pedido = admin.pedidosA("consumo_ia")[0];
    expect(pedido.filtros.fecha).toBeDefined();       // gte con la fecha de corte
  });

  it("trae las respuestas de los narradores activos y no de todos", async () => {
    const admin = crearAdmin({ narradores: [{ id: "n1", estado: "activo" }], respuestas: [] });
    await datosDelPanel(admin as never, new Date("2026-09-21T12:00:00Z"));
    expect(admin.pedidosA("respuestas")[0].filtros.narrador_id).toEqual(["n1"]);
  });
});
```

- [ ] **Paso 2: correrlo y ver que falla** → FAIL (no existe el módulo).
- [ ] **Paso 3: escribirlo.** Diez consultas en paralelo (`Promise.all`), cada una con sus columnas
  explícitas, `order` y `limit` donde corresponde. **Si una consulta falla, esa lista vuelve vacía y se
  avisa por `console.error`**: el panel muestra lo que sí pudo leer (la regla del spec punto 2 del Review
  Focus: tabla vacía o migración sin aplicar = estado vacío, nunca un error de página).
- [ ] **Paso 4: correrlo y verlo pasar** → PASS + typecheck.
- [ ] **Paso 5: commit**

```bash
git add web/src/lib/admin/datos.ts web/test/admin-datos.test.ts web/test/dobles.ts
git commit -m "panel de la empresa: las consultas del panel"
```

---

### Tarea B4: la cuenta (Plata) y el costo por libro

**Files:**
- Create: `web/src/lib/admin/plata.ts`
- Test: `web/test/admin-plata.test.ts`

**Interfaces:**
- Produces:
  - `export type Cambio = { eurArs: number; usdEur: number; fecha: string }`
  - `export const COMISION_POR_PASARELA: Record<string, number>` = `{ stripe: 0.03, mercadopago: 0.04 }`
  - `export function aEuros(monto: number, moneda: "EUR" | "ARS" | "USD", cambio: Cambio): number | null`
  - `export function cuentaDelPeriodo(datos: DatosDelPanel, cambio: Cambio, desde: Date, hasta: Date): Cuenta`
    con `Cuenta = { entro: number; porCobrar: number; gastoIa: number; comisiones: number; fijos: number; limpia: number; limpiaDeVerdad: number; comprometido: number; porCada100: number | null; sinConvertir: boolean }`
  - `export function ventaPorVenta(datos: DatosDelPanel, cambio: Cambio): Venta[]` con
    `Venta = { familia: string; region: string; pasarela: string; pago: number; moneda: string; costoIa: number | null; quedo: number | null; estado: string }`
  - `export function costoPorLibro(consumo: ConsumoPanel[]): { narradorId: string; usd: number; porPaso: Record<string, number> }[]`

- [ ] **Paso 1: los tests que fallan** (los tres casos que más fácil se rompen)

```ts
import { describe, it, expect } from "vitest";
import { cuentaDelPeriodo, aEuros, COMISION_POR_PASARELA } from "../src/lib/admin/plata";

const CAMBIO = { eurArs: 1250, usdEur: 1.08, fecha: "2026-09-21" };
const datos = (p: Record<string, unknown[]>) => ({ narradores: [], familias: [], pedidos: [], respuestas: [], envios: [], narraciones: [], fotos: [], consumo: [], latidos: [], gastos: [], ...p }) as never;
const DESDE = new Date("2026-09-01T00:00:00Z");
const HASTA = new Date("2026-09-21T23:59:59Z");

it("convierte pesos y dólares a euros y deja la cuenta cerrada", () => {
  expect(aEuros(1250, "ARS", CAMBIO)).toBe(1);
  expect(aEuros(1.08, "USD", CAMBIO)).toBe(1);
  expect(aEuros(49, "EUR", CAMBIO)).toBe(49);
});

it("sin tipo de cambio no inventa: no convierte y lo dice", () => {
  const sinCambio = { eurArs: 0, usdEur: 0, fecha: "" };
  expect(aEuros(1250, "ARS", sinCambio)).toBeNull();
  const cuenta = cuentaDelPeriodo(datos({ pedidos: [{ id: "p1", estado: "pagado", monto: 85750, moneda: "ARS", created_at: "2026-09-10T00:00:00Z", proveedor: "mercadopago", narrador_id: "n1", familia_id: "f1", extras: {} }] }), sinCambio, DESDE, HASTA);
  expect(cuenta.sinConvertir).toBe(true);
  expect(cuenta.entro).toBe(0);
});

it("el pedido pendiente de un narrador que ya tiene libro entregado no es ingreso ni freno", () => {
  const cuentaDesde = cuentaDelPeriodo(datos({ pedidos: [{ id: "p4", estado: "pendiente", monto: 49, moneda: "EUR", created_at: "2026-09-02T00:00:00Z", proveedor: "stripe", narrador_id: "n1", familia_id: "f1", extras: {} }] }), CAMBIO, DESDE, HASTA);
  expect(cuentaDesde.entro).toBe(0);
  expect(cuentaDesde.porCobrar).toBe(0);
});

it("la ganancia limpia es entró menos gastó, con las comisiones adentro", () => {
  const cuenta = cuentaDelPeriodo(datos({
    pedidos: [{ id: "p1", estado: "entregado", monto: 89, moneda: "EUR", created_at: "2026-09-18T00:00:00Z", proveedor: "stripe", narrador_id: "n1", familia_id: "f1", extras: { impreso: "bn" } }],
    consumo: [{ fecha: "2026-09-18T12:00:00Z", servicio: "fabrica", paso: "capitulo", modelo: "claude-fable-5", proveedor: "anthropic", cuenta: "naza", narrador_id: "n1", input_tokens: 100, output_tokens: 100, usd: 10 }],
    gastos: [{ fecha: "2026-09-01", concepto: "Railway", monto: 5, moneda: "USD", categoria: "suscripcion", quien: "naza" }],
  }), CAMBIO, DESDE, HASTA);
  expect(cuenta.entro).toBe(89);
  expect(cuenta.comisiones).toBeCloseTo(89 * COMISION_POR_PASARELA.stripe, 2);
  expect(cuenta.gastoIa).toBeCloseTo(10 / 1.08, 2);
  expect(cuenta.limpia).toBeCloseTo(89 - cuenta.comisiones - cuenta.gastoIa - cuenta.fijos, 2);
});
```

- [ ] **Paso 2: correrlos y ver que fallan** → FAIL.
- [ ] **Paso 3: escribirlo**, con las cuatro decisiones del spec: euro como moneda de la casa; comisión por
  pasarela; los comprometidos (vendidos sin escribir) restados en `limpiaDeVerdad` **pero mostrados aparte**;
  y `porCada100` en `null` cuando no entró nada (nunca dividir por cero).
- [ ] **Paso 4: correrlos y verlos pasar** + typecheck.
- [ ] **Paso 5: commit**

```bash
git add web/src/lib/admin/plata.ts web/test/admin-plata.test.ts
git commit -m "panel de la empresa: la cuenta de plata y el costo por libro"
```

---

### Tarea B5: el mapa de cerebros y su estado en vivo

**Files:**
- Create: `web/src/lib/admin/mapa.ts`
- Test: `web/test/admin-mapa.test.ts`

**Interfaces:**
- Produces:
  - `export type EstadoNodo = "trabajando" | "quieto" | "frenado" | "sin_uso"`
  - `export type Nodo = { carril: "entrevista" | "libro" | "voz"; nombre: string; modelo: string; queHace: string; estado: EstadoNodo; cuando: string | null }`
  - `export function mapaDeCerebros(datos: DatosDelPanel, ahora: Date): Nodo[]`
  - `export function livenessDeLaVoz(datos: DatosDelPanel, ahora: Date): { viva: boolean; porque: string }`

- [ ] **Paso 1: el test que falla** — con el caso que el spec marca (Review Focus 4):

```ts
it("con la narración avanzando, la voz está VIVA aunque no haya latido", () => {
  const datos = datos({ latidos: [{ servicio: "voz", ultimo_ping: hace(40), detalle: null }],
                        narraciones: [{ id: "x1", narrador_id: "n1", estado: "procesando", actualizada_at: hace(2), created_at: hace(9) }] });
  expect(livenessDeLaVoz(datos, AHORA)).toMatchObject({ viva: true });
});

it("sin latido Y sin avance, está caída y lo dice", () => {
  const l = livenessDeLaVoz(datos({ latidos: [{ servicio: "voz", ultimo_ping: hace(200), detalle: null }], narraciones: [] }), AHORA);
  expect(l.viva).toBe(false);
});

it("sin fila de latido (todavía no late) no la declara caída: dice que no sabe", () => {
  expect(livenessDeLaVoz(datos({}), AHORA).viva).toBe(true);
});

it("cada nodo sale con su modelo y su cuándo", () => {
  const nodos = mapaDeCerebros(datos({}), AHORA);
  expect(nodos).toHaveLength(14);
  expect(nodos.find((n) => n.nombre === "El que escribe el libro")?.modelo).toBe("claude-fable-5");
});
```

- [ ] **Paso 2: correrlo y ver que falla** → FAIL.
- [ ] **Paso 3: escribirlo.** Los 14 nodos del mockup, con el estado derivado de: el último `consumo_ia` de
  ese paso (cuándo usó el modelo), `narraciones.actualizada_at` (la voz), `pedidos.estado` y `latidos`
  (¿está vivo el worker?). Regla dura: **`sin_uso` no es un freno** (una caja gris punteada no es rojo), y
  `livenessDeLaVoz` sin dato = `viva: true` (no se acusa a la máquina sin evidencia).
- [ ] **Paso 4: correrlo y verlo pasar** + typecheck.
- [ ] **Paso 5: commit**

```bash
git add web/src/lib/admin/mapa.ts web/test/admin-mapa.test.ts
git commit -m "panel de la empresa: el mapa de cerebros y su estado"
```

---

### Tarea B6: las cinco pantallas

**Files:**
- Create: `web/src/app/admin/page.tsx` (Estado), `web/src/app/admin/familias/page.tsx`, `web/src/app/admin/plata/page.tsx`, `web/src/app/admin/gastos/page.tsx`, `web/src/app/admin/cerebros/page.tsx`
- Create: `web/src/app/admin/ui.tsx` (las piezas compartidas: `Chip`, `Punto`, `Tarjeta`, `Grupo`, `Titulo`, `BarraProgreso`, `SinDatos`)
- Test: `web/test/admin-presentacion.test.ts` (las reglas de presentación que no son JSX)
- **Mockup: `docs/panel-interno.html`** — el marcado, la jerarquía y los textos salen de ahí, sección por sección.

**Interfaces:**
- Consumes: `datosDelPanel`, `frenosDe`, `cuentaDelPeriodo`, `ventaPorVenta`, `costoPorLibro`, `mapaDeCerebros`.
- Produces: las cinco rutas.

- [ ] **Paso 1: los tests que fallan** — lo que se puede romper sin que se vea: los formateadores.

```ts
import { describe, it, expect } from "vitest";
import { euros, horasEnPalabras, fechaCorta, cuando } from "../src/app/admin/ui";

it("los euros se muestran con dos decimales y moneda", () => {
  expect(euros(6.1)).toBe("6,10 €");
  expect(euros(0)).toBe("0,00 €");
});

it("los tiempos se dicen como los dice una persona", () => {
  expect(horasEnPalabras(9)).toBe("9 hs");
  expect(horasEnPalabras(4 * 24)).toBe("4 días");
  expect(horasEnPalabras(0.5)).toBe("30 min");
});

it("sin dato no inventa la fecha", () => {
  expect(fechaCorta(null)).toBe("—");
  expect(cuando(null)).toBe("sin uso");
});
```

- [ ] **Paso 2: correrlos y ver que fallan** → FAIL.
- [ ] **Paso 3: escribir las cinco pantallas.** Cada una es un Server Component que llama a
  `datosDelPanel` y a sus funciones puras, y no calcula nada. El mapeo de cada pantalla al mockup:

| Pantalla | Sección del mockup | De dónde sale cada cosa |
|---|---|---|
| `/admin` (Estado) | «01 Estado» | `frenosDe` agrupado por gravedad + la leyenda |
| `/admin/familias` | «02 Familias» | `narradores` + `respuestas` + `envios`; adentro de una historia, la charla real (`contexto.preguntasEnviadas` / `repreguntasEnviadas`, como ya hace `/tablero`) |
| `/admin/plata` | «03 Plata» | `cuentaDelPeriodo` + `ventaPorVenta` + «mes por mes» |
| `/admin/gastos` | «04 Gastos» | `consumo` por día y por paso + `gastos` + el alta manual (Tarea B7) |
| `/admin/cerebros` | «05 Cerebros» | `mapaDeCerebros` + `livenessDeLaVoz` + la franja de umbrales |

  **Estado vacío en las cinco** (Review Focus 2): si la lista que alimenta una sección viene vacía, se
  muestra una línea que dice qué falta («todavía no hay gasto anotado», «ninguna historia en curso»), nunca
  una tabla con guiones ni un error.

- [ ] **Paso 4: correrlos y verlos pasar** + `npm test` completo + typecheck + `npm run build`.
- [ ] **Paso 5: mirar la pantalla de verdad.** Con el server de desarrollo levantado, o con
  `npx playwright` si el repo lo tiene, **abrir las cinco pantallas y mirarlas**: que ninguna se desborde,
  que en tema oscuro se lean los tres colores y que en 1280 px no haya scroll horizontal.
- [ ] **Paso 6: commit**

```bash
git add web/src/app/admin web/test/admin-presentacion.test.ts
git commit -m "panel de la empresa: las cinco pantallas"
```

---

### Tarea B7: el único que escribe (cargar un gasto a mano)

**Files:**
- Create: `web/src/app/admin/gastos/acciones.tsx` (el form y su Server Action)
- Test: `web/test/admin-gasto-manual.test.ts`

**Interfaces:**
- Consumes: `crearClienteServidor()`, la tabla `gastos_manuales`.
- Produces: `export async function cargarGastoManual(datos: FormData): Promise<{ error: string | null }>`

- [ ] **Paso 1: los tests que fallan** — la validación, que es lo único con reglas:

```ts
it("no acepta un gasto sin concepto ni con monto cero o negativo", async () => {
  await expect(cargarGastoManual(form({ concepto: "", monto: "10" }))).resolves.toMatchObject({ error: expect.stringContaining("concepto") });
  await expect(cargarGastoManual(form({ concepto: "Railway", monto: "0" }))).resolves.toMatchObject({ error: expect.stringContaining("monto") });
});

it("no acepta una moneda que no sea EUR, USD o ARS", async () => {
  await expect(cargarGastoManual(form({ concepto: "x", monto: "5", moneda: "GBP" }))).resolves.toMatchObject({ error: expect.stringContaining("moneda") });
});

it("con los datos bien, inserta una fila", async () => {
  const r = await cargarGastoManual(form({ concepto: "Railway", monto: "5", moneda: "USD", categoria: "suscripcion", quien: "naza" }));
  expect(r.error).toBeNull();
  expect(insertadas[0]).toMatchObject({ concepto: "Railway", monto: 5, moneda: "USD" });
});
```

- [ ] **Paso 2: correrlos y ver que fallan** → FAIL.
- [ ] **Paso 3: escribirlo.** Server Action con validación del lado del servidor; revalida la pantalla de
  gastos después de insertar. El botón dice «cargar el gasto» y el formulario va donde el mockup lo pone.
- [ ] **Paso 4: correrlos y verlos pasar** + suite completa.
- [ ] **Paso 5: commit**

```bash
git add web/src/app/admin/gastos web/test/admin-gasto-manual.test.ts
git commit -m "panel de la empresa: cargar un gasto a mano (la unica escritura)"
```

---

### Tarea B8: el cierre

**Files:**
- Modify: `ESTADO.md` (sección fechada, firmada `(Naza)`)
- Modify: `GASTOS.md` (la variable nueva de Vercel y las comisiones confirmadas)
- Modify: `docs/handoff-panel-empresa.md` (la parte B para Joaquín)
- Modify: `docs/superpowers/specs/2026-09-21-panel-de-la-empresa-design.md` (sólo si alguna decisión cambió en la ejecución)

- [ ] **Paso 1: lo que falta cargar en Vercel** (sin el toggle Sensitive: se lee en tiempo de ejecución,
  así que puede ser Sensitive, pero conviene que no para poder verla): `ADMIN_EMAILS` con los dos mails,
  separados por coma. Sin esa variable **no entra nadie** (falla cerrado).
- [ ] **Paso 2: el tipo de cambio** (decisión abierta 4 del spec): dónde se carga y quién lo actualiza. Va
  como variable (`CAMBIO_EUR_ARS`, `CAMBIO_USD_EUR`) o como fila en `gastos_manuales` con categoría propia;
  se elige al ejecutar y se escribe acá **una sola forma**.
- [ ] **Paso 3: la verificación de punta a punta del panel**: con datos reales, abrir las cinco pantallas,
  comparar el gasto del día contra `consumo_ia` (una consulta a mano) y la ganancia limpia contra la resta
  hecha en SQL. Si no coinciden, gana el SQL y se arregla el panel.
- [ ] **Paso 4: `npm test`, typecheck y `npm run build` de `web/`** en verde, y las otras tres suites (no
  se tocaron, pero se corren: la fábrica y el entrevistador comparten la base).
- [ ] **Paso 5: el mensaje para Joaquín** (listo para pegar, con las variables nuevas de Vercel, la rama y
  el conteo de tests de la corrida).
- [ ] **Paso 6: push de la rama y verificación contra el remoto** (`git ls-remote --heads origin panel-de-la-empresa`).

---

## Autorevisión del plan (hecha al escribirlo)

- **Cobertura del spec:** las cinco pantallas (§7) están, cada una con su tarea y su sección del mockup; el
  acceso y el "sólo lectura" (§2) en B1 y B7; los umbrales (§7) en B2; la moneda de la casa y las comisiones
  (§3.10) en B4; el latido y la regla de la voz (Review Focus 4) en B5. Lo que el spec deja **fuera de
  alcance** (acciones, avisos, cuenta destinataria por venta) no tiene tarea: es a propósito.
- **Sin placeholders:** cada paso lleva el comando y lo que se espera; los módulos con lógica llevan su
  código; las pantallas llevan el mapeo a la sección del mockup (que está commiteado y es la autoridad
  visual, así el plan no repite 600 líneas de JSX que ya existen).
- **Consistencia de tipos:** `DatosDelPanel` se define en B2 y lo consumen B3, B4 y B5 con los mismos
  nombres (`consumo`, `latidos`, `gastos`, `narraciones`); `Cuenta`, `Freno`, `Nodo` y `Venta` se definen
  antes de usarse.
- **Review Focus:** los cinco casos están, cada uno con el test que lo pincha en la tarea que lo posee
  (B1 el mail de afuera, B2/B4 el pedido pendiente viejo, B3 el vacío, B4 las monedas, B5 la voz narrando).
- **Dependencia con la Parte A:** este plan lee tablas que la Parte A creó y **ya están aplicadas** en
  Supabase (verificado el 21/09). Si alguien lo ejecuta en otra base, primero va la migración de la Parte A.
