# Regalo en locales — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una carta impresa con un código único, que alguien se llevó gratis de una copistería, se convierte en el regalo al pagarla en la web, y el local que la tenía gana el 20 % del libro.

**Architecture:** Tres tablas nuevas (`locales`, `lotes_impresos`, `codigos_impresos`) y dos columnas en `pedidos` (`local_id`, `comision_local`). La compra de regalo de hoy no cambia de forma: crea su regalo con un código generado como siempre, y lleva el código impreso en `pedidos.extras.codigo_impreso`. Al confirmar el pago, un compare-and-swap toma la carta (`codigos_impresos.pedido_id`) y le cambia el código al regalo por el impreso. Si otra persona la pagó primero, el comprador se queda con su regalo de código generado (que anda igual) y les avisa a los socios. La página `/regalo/[codigo]` suma el estado «carta sin pagar». `/regalar?codigo=` y `/comprar?carta=` arrastran la carta. Un panel de solo lectura `/local/[token]` y un script que genera lotes completan el sistema.

**Tech Stack:** Next.js (App Router, server components) en `web/`, Supabase (Postgres + PostgREST, migraciones a mano en el SQL Editor), vitest, `qrcode`, scripts `.mts` con `npx tsx`.

**Spec:** `docs/superpowers/specs/2026-10-17-regalo-en-locales-design.md`.

## Global Constraints

- Trabajar en el worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-locales` (rama `regalo-locales`). Nunca hacer checkout en la carpeta principal.
- Tests: `npm test` dentro de `web/` (vitest). Toda la suite tiene que quedar en verde al final de cada tarea.
- **El código anda sin la migración.** Una compra que no viene de un local no escribe `local_id` ni `comision_local`. Así, si la migración todavía no se aplicó, nada de lo que existe se rompe. La migración la aplica Naza en el SQL Editor, después del OK de Joaquín.
- Toda tabla nueva lleva `enable row level security` y ninguna policy: solo el service role la lee. Toda vista nueva va con `security_invoker = true`.
- Precios: nunca escritos a mano. Tarjeta negra = `PRECIO_TARJETA_FISICA_EUR` (9) y `PRECIO_TARJETA_FISICA_ARS` (15000). Sin la variable, la opción no existe.
- La tarjeta negra se puede pedir hasta el **15/12 inclusive**, en la hora del país (`Europe/Madrid` para ES, `America/Argentina/Buenos_Aires` para AR). Entre el 16/12 y el 31/12 no aparece.
- Comisión = `comision_pct` % de las líneas `pdf` + `impreso` de la compra. Nunca cuentan `copia`, `marco`, `marco_adicional`, `tarjeta` ni el envío. Se redondea a centavos.
- En la carta, en el cartel y en la página «no activada» no aparece ningún precio.
- Solo se ofrecen digital (`pdf`) e impreso (`pdf` + `impresos: 1`). El pack (109 €) vive en la rama `rediseno-web` y no está en `main`: cuando entre, se suma como tercera opción (fuera de este plan).
- **Textos que ve una persona:** todos viven en `web/src/lib/carta-textos.ts`, marcados como BORRADOR. Naza los aprueba de a 10 antes de mergear (vos, tú, catalán). Reglas: sin dos puntos, sin oraciones que empiecen con «Y», frases simples, sin «tu vida» hacia quien compra.
- Comentarios en castellano, con la densidad y el tono de los archivos vecinos.
- Commits que terminan con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Mapa de archivos

| Archivo | Qué hace |
|---|---|
| `supabase/migrations/20261017000000_regalo_locales.sql` (nuevo) | Tablas, columnas, trigger de códigos únicos, vista de comisiones |
| `supabase/CONTRATO.md` (modificar) | Sección «Regalo en locales» |
| `web/src/lib/productos.ts` (modificar) | Línea `tarjeta`, `Catalogo.tarjeta`, `Carrito.tarjetas`, `tarjetaEnFecha` |
| `web/src/lib/cartas.ts` (nuevo) | `leerCodigoImpreso`, `comisionDelLibro`, `resumenPorMes` |
| `web/src/lib/carta-textos.ts` (nuevo) | Borradores de todos los textos nuevos |
| `web/src/app/api/compra/route.ts` (modificar) | Acepta `regalo.codigoImpreso`, `carta`, `productos.tarjetas`, `tarjeta.direccion` |
| `web/src/lib/confirmar-pago.ts` (modificar) | Toma la carta, cambia el código y avisa de la tarjeta negra |
| `web/src/app/api/webhooks/stripe/route.ts`, `.../mercadopago/route.ts`, `web/src/app/api/pago/vuelta/route.ts` (modificar) | Pasan `avisarSocios` |
| `web/src/app/regalo/[codigo]/page.tsx` (modificar) + `carta-libre.tsx` (nuevo) | Estado «carta sin pagar» |
| `web/src/app/regalar/page.tsx`, `formulario.tsx`, `enviar.ts` (modificar) + `eleccion-carta.tsx` (nuevo) | Compra desde la carta |
| `web/src/app/comprar/page.tsx`, `formulario.tsx` (modificar) | `?carta=` para comprar para uno mismo |
| `web/src/app/local/[token]/page.tsx` (nuevo) | Panel del local, solo lectura |
| `web/src/lib/lote-imprimible.ts` (nuevo) + `web/scripts/lote-local.mts` (nuevo) | Crear local, crear lote y armar el HTML para imprimir |

---

### Task 1: Migración y CONTRATO

**Files:**
- Create: `supabase/migrations/20261017000000_regalo_locales.sql`
- Modify: `supabase/CONTRATO.md` (sección nueva al final, después de «El regalo llega solo el día elegido»)

**Interfaces:**
- Produces: tablas `locales(id, nombre, pais, idioma, contacto, comision_pct, token_panel, activo, created_at)`, `lotes_impresos(id, local_id, idioma, cantidad, nota, created_at)`, `codigos_impresos(codigo, lote_id, pedido_id, created_at)`; columnas `pedidos.local_id uuid`, `pedidos.comision_local numeric(10,2)`; vista `comisiones_locales_mes(local_id, nombre, mes, moneda, cartas, cobrado, comision)`.

- [ ] **Step 1: Escribir la migración**

```sql
-- Regalo en locales (docs/superpowers/specs/2026-10-17-regalo-en-locales-design.md), 17/10.
--
-- Una copistería tiene una caja con sobres. Cada carta trae un código impreso
-- (VF-XXXXXX) que pertenece a un lote, y el lote a un local. Quien paga la
-- carta en la web la convierte en su regalo; el local gana el 20 % del libro.
--
-- ⚠️ Toca supabase/CONTRATO.md: tablas `locales`, `lotes_impresos`,
-- `codigos_impresos`, columnas `pedidos.local_id` y `pedidos.comision_local`,
-- y un trigger que impide que un código de regalo y uno impreso coincidan.
-- La aplica Naza en el SQL Editor, después del OK de Joaquín. La web anda sin
-- ella: sin las tablas, ninguna carta existe.

create table if not exists locales (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  pais          text not null check (pais in ('ES', 'AR')),
  idioma        text not null check (idioma in ('es-AR', 'es-ES', 'ca')),
  contacto      text,
  comision_pct  numeric(5,2) not null default 20 check (comision_pct >= 0 and comision_pct <= 100),
  token_panel   text not null unique,                 -- el link privado del panel
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists lotes_impresos (
  id          uuid primary key default gen_random_uuid(),
  local_id    uuid not null references locales(id) on delete restrict,
  idioma      text not null check (idioma in ('es-AR', 'es-ES', 'ca')),
  cantidad    integer not null check (cantidad > 0),
  nota        text,
  created_at  timestamptz not null default now()
);

create table if not exists codigos_impresos (
  codigo      text primary key,                       -- 'VF-7K3M2Q'
  lote_id     uuid not null references lotes_impresos(id) on delete cascade,
  pedido_id   uuid references pedidos(id) on delete set null,  -- null = sin pagar
  created_at  timestamptz not null default now()
);

create index if not exists codigos_impresos_por_lote on codigos_impresos (lote_id);

alter table pedidos add column if not exists local_id uuid references locales(id) on delete set null;
alter table pedidos add column if not exists comision_local numeric(10,2);
create index if not exists pedidos_por_local on pedidos (local_id) where local_id is not null;

-- Un código vive en un solo lugar. Un regalo puede tomar un código impreso
-- solo si esa carta ya es de su pedido (confirmarPago la toma primero). El
-- error usa 23505 para que /api/compra, que ya reintenta con otro código ante
-- un unique_violation, siga andando igual.
create or replace function codigo_regalo_libre() returns trigger
language plpgsql as $$
begin
  if tg_table_name = 'regalos' then
    if exists (select 1 from codigos_impresos c
               where c.codigo = new.codigo
                 and c.pedido_id is distinct from new.pedido_id) then
      raise exception 'el código % es de una carta impresa', new.codigo using errcode = '23505';
    end if;
  else
    if exists (select 1 from regalos r where r.codigo = new.codigo) then
      raise exception 'el código % ya es de un regalo', new.codigo using errcode = '23505';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists regalos_codigo_libre on regalos;
create trigger regalos_codigo_libre before insert or update of codigo on regalos
  for each row execute function codigo_regalo_libre();

drop trigger if exists codigos_impresos_libre on codigos_impresos;
create trigger codigos_impresos_libre before insert on codigos_impresos
  for each row execute function codigo_regalo_libre();

alter table locales enable row level security;
alter table lotes_impresos enable row level security;
alter table codigos_impresos enable row level security;

-- La cuenta del mes, para pagarle a cada local. security_invoker: la vista no
-- se saltea RLS (sin esto, PostgREST la expondría a cualquiera).
create or replace view comisiones_locales_mes with (security_invoker = true) as
select
  l.id as local_id,
  l.nombre,
  date_trunc('month', p.created_at at time zone
    case when l.pais = 'ES' then 'Europe/Madrid' else 'America/Argentina/Buenos_Aires' end)::date as mes,
  p.moneda,
  count(*)               as cartas,
  sum(p.monto)           as cobrado,
  sum(p.comision_local)  as comision
from pedidos p
join locales l on l.id = p.local_id
where p.estado in ('pagado', 'generando', 'esperando_voz', 'entregado')
group by l.id, l.nombre, mes, p.moneda;
```

- [ ] **Step 2: Sección en CONTRATO.md**

Agregar al final de `supabase/CONTRATO.md`:

```markdown
## Regalo en locales (17/10, migración `20261017000000_regalo_locales.sql`)

Spec: `docs/superpowers/specs/2026-10-17-regalo-en-locales-design.md`.

| Tabla / columna | Quién escribe | Qué es |
|---|---|---|
| `locales` | script `web/scripts/lote-local.mts` | La copistería o librería. `token_panel` es su link privado de solo lectura |
| `lotes_impresos` | el mismo script | Una tanda de cartas impresas para un local, en un idioma |
| `codigos_impresos.codigo` | el mismo script | El código impreso en la carta. Nunca coincide con un `regalos.codigo` (trigger) |
| `codigos_impresos.pedido_id` | web, `confirmarPago` | Null hasta que alguien la paga. Se escribe una sola vez (compare-and-swap sobre `pedido_id is null`) |
| `pedidos.local_id` | web, `/api/compra` | El local de la carta, si la compra vino de una |
| `pedidos.comision_local` | web, `/api/compra` | Lo que le toca al local, en la moneda del pedido |
| `pedidos.extras.codigo_impreso` | web, `/api/compra` | La carta que se está pagando (solo regalos) |
| `pedidos.extras.tarjeta` | web, `/api/compra` | `{ direccion }` si se pidió la tarjeta negra por correo |

- El regalo nace con un código generado, como siempre. Al confirmar el pago, la web toma la carta y
  cambia `regalos.codigo` al impreso. Si la carta ya era de otro pedido, el regalo se queda con su
  código generado y la web avisa a `MAIL_SOCIOS` para devolver o resolver a mano.
- El entrevistador no cambia: canjea el código que tenga `regalos.codigo` en ese momento.
- `comisiones_locales_mes` es la cuenta mensual: cartas pagadas, total cobrado y comisión por local.
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20261017000000_regalo_locales.sql supabase/CONTRATO.md
git commit -m "Regalo en locales: migración (locales, lotes, códigos impresos) y CONTRATO"
```

---

### Task 2: Catálogo con la tarjeta negra

**Files:**
- Modify: `web/src/lib/productos.ts`
- Test: `web/test/productos-tarjeta.test.ts` (nuevo)

**Interfaces:**
- Produces:
  - `type LineaId = ... | "tarjeta"`
  - `NOMBRES.tarjeta: string`
  - `tarjetaEnFecha(region: Region, ahora: Date): boolean`
  - `catalogo(region: Region, ahora?: Date): Catalogo` con `Catalogo.tarjeta: number | null`
  - `Carrito.tarjetas?: number`
  - `ProductosDelPedido.tarjetas?: number` (la clave existe solo si es > 0)

- [ ] **Step 1: Escribir el test que falla**

```ts
// web/test/productos-tarjeta.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { armarCompra, catalogo, productosParaPedido, tarjetaEnFecha, validarCarrito } from "../src/lib/productos";

const ENTORNO = { ...process.env };

describe("tarjeta negra (regalo en locales)", () => {
  beforeEach(() => {
    process.env.PRECIO_EUR = "49";
    process.env.PRECIO_IMPRESO_EUR = "50";
    process.env.PRECIO_TARJETA_FISICA_EUR = "9";
    process.env.PRECIO_TARJETA_FISICA_ARS = "15000";
  });
  afterEach(() => { process.env = { ...ENTORNO }; });

  it("se puede pedir hasta el 15/12 inclusive, en la hora del país", () => {
    // 15/12 23:30 en Madrid = 22:30 UTC
    expect(tarjetaEnFecha("ES", new Date("2026-12-15T22:30:00Z"))).toBe(true);
    // 16/12 00:30 en Madrid = 15/12 23:30 UTC
    expect(tarjetaEnFecha("ES", new Date("2026-12-15T23:30:00Z"))).toBe(false);
    // 16/12 en Buenos Aires
    expect(tarjetaEnFecha("AR", new Date("2026-12-16T12:00:00Z"))).toBe(false);
    expect(tarjetaEnFecha("AR", new Date("2027-01-02T12:00:00Z"))).toBe(true);
    expect(tarjetaEnFecha("ES", new Date("2026-10-17T12:00:00Z"))).toBe(true);
  });

  it("el catálogo trae el precio solo con variable y en fecha", () => {
    expect(catalogo("ES", new Date("2026-10-17T12:00:00Z")).tarjeta).toBe(9);
    expect(catalogo("AR", new Date("2026-10-17T12:00:00Z")).tarjeta).toBe(15000);
    expect(catalogo("ES", new Date("2026-12-20T12:00:00Z")).tarjeta).toBeNull();
    delete process.env.PRECIO_TARJETA_FISICA_EUR;
    expect(catalogo("ES", new Date("2026-10-17T12:00:00Z")).tarjeta).toBeNull();
  });

  it("suma la línea tarjeta y la anota en el pedido", () => {
    const cat = catalogo("ES", new Date("2026-10-17T12:00:00Z"));
    const compra = armarCompra(cat, "ES", { base: "pdf", impresos: 1, marcos: 0, tarjetas: 1 });
    expect(compra.lineas.map((l) => l.id)).toEqual(["pdf", "impreso", "tarjeta"]);
    expect(compra.total).toBe(108);
    expect(productosParaPedido(compra).tarjetas).toBe(1);
  });

  it("sin tarjeta, el pedido no trae la clave (los pedidos de hoy no cambian)", () => {
    const cat = catalogo("ES", new Date("2026-10-17T12:00:00Z"));
    const compra = armarCompra(cat, "ES", { base: "pdf", impresos: 0, marcos: 0 });
    expect("tarjetas" in productosParaPedido(compra)).toBe(false);
  });

  it("validarCarrito rechaza la tarjeta si no está disponible", () => {
    delete process.env.PRECIO_TARJETA_FISICA_EUR;
    const r = validarCarrito("ES", { base: "pdf", impresos: 0, marcos: 0, tarjetas: 1 });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd web && npx vitest run test/productos-tarjeta.test.ts`
Expected: FAIL (`tarjetaEnFecha` is not a function).

- [ ] **Step 3: Implementar en `productos.ts`**

Cambios exactos:

```ts
// LineaId:
export type LineaId = "pdf" | "viaje" | "impreso" | "copia" | "marco" | "marco_adicional" | "tarjeta";

// NOMBRES (⚠️ texto a aprobar por Naza, 17/10):
export const NOMBRES: Record<Exclude<LineaId, "pdf" | "viaje">, string> = {
  impreso: "El libro impreso",
  copia: "Copia extra del libro impreso",
  marco: "Marco con su voz",
  marco_adicional: "Marco adicional",
  tarjeta: "Tarjeta negra por correo",
};

// Después de precioDeEntorno:
/**
 * La tarjeta negra por correo (regalo en locales, 17/10) se puede pedir hasta
 * el 15/12 inclusive en la hora del país, para que llegue antes del 24. Del
 * 16/12 al 31/12 no existe. En enero vuelve.
 */
export function tarjetaEnFecha(region: Region, ahora: Date): boolean {
  const zona = region === "ES" ? "Europe/Madrid" : "America/Argentina/Buenos_Aires";
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: zona, month: "numeric", day: "numeric" }).formatToParts(ahora);
  const mes = Number(partes.find((p) => p.type === "month")?.value);
  const dia = Number(partes.find((p) => p.type === "day")?.value);
  return !(mes === 12 && dia >= 16);
}

// Catalogo: agregar el campo
  /** La tarjeta negra por correo; null = no se vende (sin variable o fuera de fecha). */
  tarjeta: number | null;

// catalogo(region, ahora = new Date()): en el return agregar
    tarjeta: tarjetaEnFecha(region, ahora) ? precioDeEntorno("PRECIO_TARJETA_FISICA", region) : null,

// Carrito: agregar
  /** La tarjeta negra por correo (0 o 1). */
  tarjetas?: number;

// armarCompra, antes del redondeo del total:
  if (entero(carrito.tarjetas) > 0 && cat.tarjeta !== null) {
    lineas.push({ id: "tarjeta", nombre: NOMBRES.tarjeta, cantidad: 1, precioUnitario: cat.tarjeta });
  }

// validarCarrito, antes del chequeo de "Falta elegir al menos una cosa":
  if (entero(carrito.tarjetas) > 0 && cat.tarjeta === null) return { ok: false, mensaje: "La tarjeta por correo no está disponible ahora." };

// ProductosDelPedido: agregar
  /** Tarjeta negra por correo (17/10). Solo existe si es > 0: los pedidos de antes no la traen. */
  tarjetas?: number;

// productosParaPedido: en el objeto devuelto agregar al final
    ...(cantidad("tarjeta") > 0 ? { tarjetas: cantidad("tarjeta") } : {}),
```

`productosDelPedido` no cambia: la tarjeta no pasa por `entregas` (se avisa por mail, Task 5). `necesitaEntrega` no cambia.

- [ ] **Step 4: Correr el test nuevo y toda la suite**

Run: `cd web && npx vitest run test/productos-tarjeta.test.ts && npm test`
Expected: PASS. Si un test viejo compara `catalogo(...)` con `toEqual`, agregarle `tarjeta: null` (sin variable cargada es null).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/productos.ts web/test/productos-tarjeta.test.ts
git commit -m "Catálogo: tarjeta negra por correo, hasta el 15/12"
```

---

### Task 3: Cartas, comisión y textos

**Files:**
- Create: `web/src/lib/cartas.ts`
- Create: `web/src/lib/carta-textos.ts`
- Test: `web/test/cartas.test.ts`

**Interfaces:**
- Consumes: `normalizarCodigo` (`lib/regalo.ts`), `esTablaAusente` (`lib/tabla-ausente.ts`), `Compra` (`lib/productos.ts`), `IdiomaRegalo` / `TratoComprador` (`lib/regalo-textos.ts`).
- Produces:
  - `type CodigoImpreso = { codigo: string; pagado: boolean; localId: string; idioma: IdiomaRegalo; comisionPct: number; localActivo: boolean }`
  - `leerCodigoImpreso(admin: SupabaseClient, codigoCrudo: string): Promise<CodigoImpreso | null>`
  - `comisionDelLibro(compra: Compra, pct: number): number`
  - `type PedidoDelLocal = { created_at: string; comision_local: number | string | null; monto: number | string; moneda: string }`
  - `resumenPorMes(pedidos: PedidoDelLocal[], zona: string): { mes: string; cartas: number; comision: number; moneda: string }[]`, con el mes como `"2026-11"` y los más nuevos primero.
  - `textosCartaLibre(idioma: IdiomaRegalo)`, `textosCartaComprador(trato: TratoComprador)` y `textosPanelLocal(idioma: IdiomaRegalo)`, con las formas exactas del Step 3.

- [ ] **Step 1: Test que falla**

```ts
// web/test/cartas.test.ts
import { describe, it, expect } from "vitest";
import { comisionDelLibro, leerCodigoImpreso, resumenPorMes } from "../src/lib/cartas";
import type { Compra } from "../src/lib/productos";

const compra = (ids: [string, number, number][]): Compra => ({
  region: "ES", moneda: "EUR", total: 0,
  lineas: ids.map(([id, cantidad, precioUnitario]) => ({ id: id as never, nombre: id, cantidad, precioUnitario })),
});

describe("comisionDelLibro", () => {
  it("20 % del libro: digital, impreso", () => {
    expect(comisionDelLibro(compra([["pdf", 1, 49]]), 20)).toBe(9.8);
    expect(comisionDelLibro(compra([["pdf", 1, 49], ["impreso", 1, 50]]), 20)).toBe(19.8);
  });
  it("los extras no cuentan", () => {
    expect(comisionDelLibro(compra([["pdf", 1, 49], ["impreso", 1, 50], ["tarjeta", 1, 9], ["marco", 1, 19], ["copia", 2, 30]]), 20)).toBe(19.8);
  });
  it("redondea a centavos", () => {
    expect(comisionDelLibro(compra([["pdf", 1, 85750]]), 20)).toBe(17150);
    expect(comisionDelLibro(compra([["pdf", 1, 49.99]]), 20)).toBe(10);
  });
});

/** Un admin de mentira: devuelve `fila` para codigos_impresos y anota el código pedido. */
function admin(fila: unknown, error: unknown = null) {
  const pedidos: string[] = [];
  const cadena = {
    select: () => cadena,
    eq: (_c: string, v: string) => { pedidos.push(v); return cadena; },
    maybeSingle: async () => ({ data: fila, error }),
  };
  return { cliente: { from: () => cadena } as never, pedidos };
}

describe("leerCodigoImpreso", () => {
  const fila = { codigo: "VF-7K3M2Q", pedido_id: null, lotes_impresos: { idioma: "ca", locales: { id: "loc-1", comision_pct: "20.00", activo: true } } };

  it("normaliza el código y devuelve la carta libre", async () => {
    const a = admin(fila);
    const c = await leerCodigoImpreso(a.cliente, " vf-7k3m2q ");
    expect(a.pedidos).toEqual(["VF-7K3M2Q"]);
    expect(c).toEqual({ codigo: "VF-7K3M2Q", pagado: false, localId: "loc-1", idioma: "ca", comisionPct: 20, localActivo: true });
  });
  it("pagada si tiene pedido", async () => {
    expect((await leerCodigoImpreso(admin({ ...fila, pedido_id: "p-1" }).cliente, "VF-7K3M2Q"))?.pagado).toBe(true);
  });
  it("null si no existe, si el código es basura o si la tabla falta", async () => {
    expect(await leerCodigoImpreso(admin(null).cliente, "VF-7K3M2Q")).toBeNull();
    expect(await leerCodigoImpreso(admin(fila).cliente, "hola")).toBeNull();
    expect(await leerCodigoImpreso(admin(null, { code: "42P01", message: "no existe" }).cliente, "VF-7K3M2Q")).toBeNull();
  });
});

describe("resumenPorMes", () => {
  it("agrupa por mes en la zona del local, el más nuevo primero", () => {
    const r = resumenPorMes([
      { created_at: "2026-10-31T23:30:00Z", comision_local: "19.80", monto: "99", moneda: "EUR" }, // 1/11 en Madrid
      { created_at: "2026-10-10T10:00:00Z", comision_local: 9.8, monto: 49, moneda: "EUR" },
      { created_at: "2026-10-12T10:00:00Z", comision_local: "19.80", monto: "99", moneda: "EUR" },
    ], "Europe/Madrid");
    expect(r).toEqual([
      { mes: "2026-11", cartas: 1, comision: 19.8, moneda: "EUR" },
      { mes: "2026-10", cartas: 2, comision: 29.6, moneda: "EUR" },
    ]);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd web && npx vitest run test/cartas.test.ts`
Expected: FAIL (no se encuentra el módulo `../src/lib/cartas`).

- [ ] **Step 3: Implementar `cartas.ts` y `carta-textos.ts`**

```ts
// web/src/lib/cartas.ts
// Regalo en locales (spec 2026-10-17-regalo-en-locales-design): las cartas que
// la gente se lleva gratis de una copistería. Cada una trae un código impreso
// que es de un lote, y el lote de un local. Lo que se lee de la base y las
// cuentas puras del 20 %.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Compra } from "./productos";
import { normalizarCodigo } from "./regalo";
import { esIdiomaRegalo } from "./regalo-reglas";
import type { IdiomaRegalo } from "./regalo-textos";
import { esTablaAusente } from "./tabla-ausente";

export type CodigoImpreso = {
  codigo: string;
  /** Alguien ya la pagó: es un regalo, o de otro. */
  pagado: boolean;
  localId: string;
  /** El idioma del lote: el de la carta impresa. */
  idioma: IdiomaRegalo;
  comisionPct: number;
  localActivo: boolean;
};

export async function leerCodigoImpreso(admin: SupabaseClient, codigoCrudo: string): Promise<CodigoImpreso | null> {
  const codigo = normalizarCodigo(codigoCrudo);
  if (!codigo) return null;
  const { data, error } = await admin
    .from("codigos_impresos")
    .select("codigo, pedido_id, lotes_impresos(idioma, locales(id, comision_pct, activo))")
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) {
    if (esTablaAusente(error)) console.warn("cartas: la tabla codigos_impresos todavía no existe");
    else console.error("cartas: falló leer el código impreso", error);
    return null;
  }
  const f = data as null | {
    codigo: string; pedido_id: string | null;
    lotes_impresos: { idioma: unknown; locales: { id: string; comision_pct: number | string; activo: boolean } | null } | null;
  };
  const local = f?.lotes_impresos?.locales;
  if (!f || !local) return null;
  const idioma = f.lotes_impresos?.idioma;
  return {
    codigo: f.codigo,
    pagado: f.pedido_id !== null,
    localId: local.id,
    idioma: esIdiomaRegalo(idioma) ? idioma : "es-AR",
    comisionPct: Number(local.comision_pct),
    localActivo: local.activo,
  };
}

/** Las líneas que son «el libro»: lo único sobre lo que el local cobra su parte. */
const LINEAS_DEL_LIBRO = new Set(["pdf", "impreso"]);

/** La parte del local: `pct` % del libro elegido, sin extras ni envío, en centavos. */
export function comisionDelLibro(compra: Compra, pct: number): number {
  const libro = compra.lineas
    .filter((l) => LINEAS_DEL_LIBRO.has(l.id))
    .reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  return Math.round(libro * pct) / 100;
}

export type PedidoDelLocal = { created_at: string; comision_local: number | string | null; monto: number | string; moneda: string };

/** Lo que ve el local en su panel: cartas pagadas y su parte, por mes, el más nuevo primero. */
export function resumenPorMes(pedidos: PedidoDelLocal[], zona: string): { mes: string; cartas: number; comision: number; moneda: string }[] {
  const formato = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit" });
  const porMes = new Map<string, { mes: string; cartas: number; centavos: number; moneda: string }>();
  for (const p of pedidos) {
    const mes = formato.format(new Date(p.created_at)).slice(0, 7);
    const clave = `${mes}|${p.moneda}`;
    const actual = porMes.get(clave) ?? { mes, cartas: 0, centavos: 0, moneda: p.moneda };
    actual.cartas += 1;
    actual.centavos += Math.round(Number(p.comision_local ?? 0) * 100);
    porMes.set(clave, actual);
  }
  return [...porMes.values()]
    .sort((a, b) => b.mes.localeCompare(a.mes))
    .map(({ mes, cartas, centavos, moneda }) => ({ mes, cartas, comision: centavos / 100, moneda }));
}
```

Antes de escribir `carta-textos.ts`, revisar que `esIdiomaRegalo` esté exportado por `lib/regalo-reglas.ts` (`:42`, sí lo está).

```ts
// web/src/lib/carta-textos.ts
// ⚠️ BORRADOR (17/10). Ningún texto de este archivo está aprobado. Naza los
// aprueba de a 10 antes de mergear (vos, tú y catalán). Reglas: sin dos
// puntos, sin oraciones que empiecen con «Y», sin precio, sin «tu vida» hacia
// quien compra.

import type { IdiomaRegalo, TratoComprador } from "./regalo-textos";

/** La página que abre el QR de una carta que nadie pagó todavía. La lee quien la tiene en la mano. */
export type TextosCartaLibre = {
  titulo: string;
  cuerpo: string;
  regalarla: string;
  paraVos: string;
  siTeLaRegalaron: string;
};

const CARTA_LIBRE: Record<IdiomaRegalo, TextosCartaLibre> = {
  "es-AR": {
    titulo: "Esta carta es un regalo que todavía no se activó",
    cuerpo: "Con ella alguien que querés cuenta su vida por WhatsApp y nosotros escribimos su libro. Se activa cuando la regalás desde acá.",
    regalarla: "Regalarla",
    paraVos: "¿La querés para vos?",
    siTeLaRegalaron: "Si te la dieron como regalo, avisale a quien te la dio.",
  },
  "es-ES": {
    titulo: "Esta carta es un regalo que todavía no se ha activado",
    cuerpo: "Con ella alguien a quien quieres cuenta su vida por WhatsApp y nosotros escribimos su libro. Se activa cuando la regalas desde aquí.",
    regalarla: "Regalarla",
    paraVos: "¿La quieres para ti?",
    siTeLaRegalaron: "Si te la han dado como regalo, avísale a quien te la dio.",
  },
  ca: {
    titulo: "Aquesta carta és un regal que encara no s'ha activat",
    cuerpo: "Amb ella algú que estimes explica la seva vida per WhatsApp i nosaltres n'escrivim el llibre. S'activa quan la regales des d'aquí.",
    regalarla: "Regalar-la",
    paraVos: "La vols per a tu?",
    siTeLaRegalaron: "Si te l'han donat com a regal, avisa qui te la va donar.",
  },
};

export function textosCartaLibre(idioma: IdiomaRegalo): TextosCartaLibre {
  return CARTA_LIBRE[idioma];
}

/** Lo nuevo de /regalar cuando se llega desde una carta. Lo lee quien compra. */
export type TextosCartaComprador = {
  avisoCarta: (codigo: string) => string;
  cartaUsada: string;
  queLibro: string;
  digital: string;
  digitalDetalle: string;
  impreso: string;
  impresoDetalle: string;
  tarjetaTitulo: string;
  tarjetaDetalle: string;
  direccionTitulo: string;
};

const CARTA_COMPRADOR: Record<TratoComprador, TextosCartaComprador> = {
  vos: {
    avisoCarta: (codigo) => `Estás regalando la carta ${codigo}. Cuando pagues, esa misma carta queda activada.`,
    cartaUsada: "Esta carta ya fue regalada. Podés regalar igual un libro nuevo desde acá.",
    queLibro: "Qué libro le regalás",
    digital: "El libro digital",
    digitalDetalle: "Se lee en la web, con sus fotos y su voz.",
    impreso: "El libro impreso",
    impresoDetalle: "Tapa dura, a color, con su voz en un código. Incluye el digital.",
    tarjetaTitulo: "Sumar la tarjeta negra por correo",
    tarjetaDetalle: "Te la mandamos a tu casa en un sobre negro, para dársela en mano.",
    direccionTitulo: "Dónde te la mandamos",
  },
  tu: {
    avisoCarta: (codigo) => `Estás regalando la carta ${codigo}. Cuando pagues, esa misma carta queda activada.`,
    cartaUsada: "Esta carta ya se ha regalado. Puedes regalar igualmente un libro nuevo desde aquí.",
    queLibro: "Qué libro le regalas",
    digital: "El libro digital",
    digitalDetalle: "Se lee en la web, con sus fotos y su voz.",
    impreso: "El libro impreso",
    impresoDetalle: "Tapa dura, a color, con su voz en un código. Incluye el digital.",
    tarjetaTitulo: "Añadir la tarjeta negra por correo",
    tarjetaDetalle: "Te la enviamos a casa en un sobre negro, para dársela en mano.",
    direccionTitulo: "Dónde te la enviamos",
  },
};

export function textosCartaComprador(trato: TratoComprador): TextosCartaComprador {
  return CARTA_COMPRADOR[trato];
}

/** El panel de solo lectura del local. */
export type TextosPanelLocal = {
  titulo: (nombre: string) => string;
  sobres: (n: number) => string;
  sinVentas: string;
  mes: string;
  cartas: string;
  teToca: string;
  pago: string;
};

const PANEL: Record<IdiomaRegalo, TextosPanelLocal> = {
  "es-AR": {
    titulo: (nombre) => `Vitácora Familiar en ${nombre}`,
    sobres: (n) => `Te dejamos ${n} sobres.`,
    sinVentas: "Todavía no se pagó ninguna carta de tu caja.",
    mes: "Mes", cartas: "Cartas pagadas", teToca: "Te toca",
    pago: "Lo de cada mes te lo pagamos a principios del mes siguiente.",
  },
  "es-ES": {
    titulo: (nombre) => `Vitácora Familiar en ${nombre}`,
    sobres: (n) => `Os hemos dejado ${n} sobres.`,
    sinVentas: "Todavía no se ha pagado ninguna carta de vuestra caja.",
    mes: "Mes", cartas: "Cartas pagadas", teToca: "Os toca",
    pago: "Lo de cada mes os lo pagamos a principios del mes siguiente.",
  },
  ca: {
    titulo: (nombre) => `Vitácora Familiar a ${nombre}`,
    sobres: (n) => `Us hem deixat ${n} sobres.`,
    sinVentas: "Encara no s'ha pagat cap carta de la vostra caixa.",
    mes: "Mes", cartas: "Cartes pagades", teToca: "Us toca",
    pago: "El de cada mes us el paguem a principis del mes següent.",
  },
};

export function textosPanelLocal(idioma: IdiomaRegalo): TextosPanelLocal {
  return PANEL[idioma];
}
```

- [ ] **Step 4: Correr el test nuevo y toda la suite**

Run: `cd web && npx vitest run test/cartas.test.ts && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/cartas.ts web/src/lib/carta-textos.ts web/test/cartas.test.ts
git commit -m "Cartas de locales: lectura del código impreso, comisión y borradores de textos"
```

---

### Task 4: /api/compra con carta, comisión y tarjeta

**Files:**
- Modify: `web/src/app/api/compra/route.ts`
- Test: `web/test/compra-carta.test.ts` (nuevo; copia el helper `crearAdmin` de `web/test/compra-regalo.test.ts`)

**Interfaces:**
- Consumes: `leerCodigoImpreso`, `comisionDelLibro` (Task 3), `Carrito.tarjetas` (Task 2), `validarDireccion` (`lib/entregas.ts:50`), `textosCartaComprador` (Task 3).
- Produces: el cuerpo de `/api/compra` acepta además:
  - `regalo.codigoImpreso?: string`
  - `carta?: string` (compra para uno mismo)
  - `productos.tarjetas?: number`
  - `tarjeta?: { direccion?: unknown }`

  El pedido nace con `local_id` y `comision_local` (solo si hay local) y con `extras.codigo_impreso` / `extras.tarjeta`.

Reglas:

| Caso | Respuesta |
|---|---|
| `regalo.codigoImpreso` que no existe | 404 con `cartaUsada` |
| `regalo.codigoImpreso` ya pagado | 409 con `cartaUsada` |
| Carta de un local inactivo | Sigue, sin local |
| `productos.tarjetas > 0` sin `regalo.codigoImpreso` | 400: la tarjeta solo existe en la compra desde una carta |
| `productos.tarjetas > 0` con dirección inválida | 400 con el mensaje de `validarDireccion` |
| Hay `codigoImpreso` | `datosRegalo.fechaEntrega` y `datosRegalo.entrega` se fuerzan a null: la carta se da en mano |
| `carta` (no regalo) | Si existe y el local está activo, solo atribuye. No consume la carta y no da error si no existe |

- [ ] **Step 1: Test que falla**

Copiar de `web/test/compra-regalo.test.ts` los `vi.mock`, el helper `crearAdmin` y el `beforeEach` de variables tal cual. La tabla `codigos_impresos` responde a `maybeSingle` con la fila del caso. Casos:

```ts
// web/test/compra-carta.test.ts (cuerpo de los casos; el andamiaje viene de compra-regalo.test.ts)
const CARTA = { codigo: "VF-7K3M2Q", pedido_id: null, lotes_impresos: { idioma: "es-ES", locales: { id: "loc-1", comision_pct: 20, activo: true } } };

const cuerpoCarta = (extra: Record<string, unknown> = {}) => ({
  nombreComprador: "Lucía", vinculoComprador: "nieta", region: "ES", email: "lucia@ejemplo.com",
  narrador: { nombre: "Osvaldo", comoLeDicen: "abuelo" },
  regalo: { mensaje: "Para vos", genero: "varon", idioma: "es-ES", codigoImpreso: "VF-7K3M2Q", fechaEntrega: "2026-12-24" },
  productos: { impresos: 1, marcos: 0 },
  ...extra,
});

it("regalo desde carta: pedido con local, comisión y código impreso; sin fecha de entrega", async () => {
  const admin = crearAdmin({ codigos_impresos: [{ data: CARTA }], familias: [{ data: null }, { data: { id: "fam-1" } }], narradores: [{ data: { id: "nar-1" } }], pedidos: [{ data: { id: "ped-1" } }], regalos: [{ error: null }] });
  // ... (crearClienteServidor devuelve admin; crearCheckout devuelve { urlPago: "https://pago" })
  const r = await POST(pedido(cuerpoCarta()));
  expect(r.status).toBe(200);
  const insertPedido = admin.inserts.pedidos[0];
  expect(insertPedido.local_id).toBe("loc-1");
  expect(insertPedido.comision_local).toBe(19.8);
  expect(insertPedido.extras).toMatchObject({ regalo: true, codigo_impreso: "VF-7K3M2Q" });
  expect(admin.inserts.regalos[0].fecha_entrega).toBeNull();
  expect(admin.inserts.regalos[0].codigo).not.toBe("VF-7K3M2Q"); // nace con código generado
});

it("carta ya pagada: 409 y no se crea nada", async () => {
  const admin = crearAdmin({ codigos_impresos: [{ data: { ...CARTA, pedido_id: "otro" } }] });
  const r = await POST(pedido(cuerpoCarta()));
  expect(r.status).toBe(409);
  expect(admin.inserts.pedidos ?? []).toHaveLength(0);
});

it("carta inexistente: 404", async () => {
  crearAdmin({ codigos_impresos: [{ data: null }] });
  expect((await POST(pedido(cuerpoCarta()))).status).toBe(404);
});

it("tarjeta negra: necesita carta y dirección; queda en extras y en el total", async () => {
  process.env.PRECIO_TARJETA_FISICA_EUR = "9";
  crearAdmin({});
  const sinCarta = cuerpoCarta({ productos: { impresos: 1, marcos: 0, tarjetas: 1 } });
  delete (sinCarta.regalo as Record<string, unknown>).codigoImpreso;
  expect((await POST(pedido(sinCarta))).status).toBe(400);

  crearAdmin({ codigos_impresos: [{ data: CARTA }] });
  expect((await POST(pedido(cuerpoCarta({ productos: { impresos: 1, marcos: 0, tarjetas: 1 } })))).status).toBe(400); // sin dirección

  const admin = crearAdmin({ codigos_impresos: [{ data: CARTA }], familias: [{ data: null }, { data: { id: "fam-1" } }], narradores: [{ data: { id: "nar-1" } }], pedidos: [{ data: { id: "ped-1" } }], regalos: [{ error: null }] });
  const direccion = { linea1: "Carrer Major 3", ciudad: "Berga", cp: "08600", pais: "España" };
  const r = await POST(pedido(cuerpoCarta({ productos: { impresos: 1, marcos: 0, tarjetas: 1 }, tarjeta: { direccion } })));
  expect(r.status).toBe(200);
  expect(admin.inserts.pedidos[0].extras.tarjeta).toEqual({ direccion });
  expect(admin.inserts.pedidos[0].monto).toBe(108);
  expect(admin.inserts.pedidos[0].comision_local).toBe(19.8); // la tarjeta no suma comisión
});

it("compra para uno mismo con ?carta: atribuye sin consumir la carta", async () => {
  const admin = crearAdmin({ codigos_impresos: [{ data: CARTA }], familias: [{ data: null }, { data: { id: "fam-1" } }], narradores: [{ data: null }, { data: { id: "nar-1" } }], pedidos: [{ data: { id: "ped-1" } }] });
  const r = await POST(pedido({
    nombreComprador: "Jordi", vinculoComprador: "yo mismo", region: "ES", email: "jordi@ejemplo.com",
    narrador: { nombre: "Jordi", comoLeDicen: "Jordi", telefonoWhatsapp: "+34600000000", horaPreferida: "10:00", contexto: {} },
    productos: { impresos: 0, marcos: 0 }, carta: "VF-7K3M2Q",
  }));
  expect(r.status).toBe(200);
  expect(admin.inserts.pedidos[0].local_id).toBe("loc-1");
  expect(admin.inserts.pedidos[0].comision_local).toBe(9.8);
  expect(admin.inserts.pedidos[0].extras.codigo_impreso).toBeUndefined();
});

it("regalo sin carta: el pedido no trae local_id ni comision_local (anda sin la migración)", async () => {
  const admin = crearAdmin({ familias: [{ data: null }, { data: { id: "fam-1" } }], narradores: [{ data: { id: "nar-1" } }], pedidos: [{ data: { id: "ped-1" } }], regalos: [{ error: null }] });
  const cuerpo = cuerpoCarta({ productos: { impresos: 0, marcos: 0 } });
  delete (cuerpo.regalo as Record<string, unknown>).codigoImpreso;
  const r = await POST(pedido(cuerpo));
  expect(r.status).toBe(200);
  expect("local_id" in admin.inserts.pedidos[0]).toBe(false);
  expect("comision_local" in admin.inserts.pedidos[0]).toBe(false);
  expect(admin.inserts.pedidos[0].extras.codigo_impreso).toBeUndefined();
  expect(admin.inserts.regalos[0].fecha_entrega).toBe("2026-12-24"); // sin carta, la fecha se respeta
});
```

Ajustar las secuencias de `crearAdmin` al orden real de consultas que haga la ruta. El helper devuelve las respuestas en cola por tabla.

- [ ] **Step 2: Correr y ver que falla**

Run: `cd web && npx vitest run test/compra-carta.test.ts`
Expected: FAIL (el pedido no trae `local_id`).

- [ ] **Step 3: Implementar en la ruta**

```ts
// imports nuevos
import { comisionDelLibro, leerCodigoImpreso, type CodigoImpreso } from "@/lib/cartas";
import { textosCartaComprador } from "@/lib/carta-textos";
import { validarDireccion, type Direccion } from "@/lib/entregas";

// CompraBody: sumar
  /** Regalo en locales (17/10): compra para uno mismo que vino de una carta. Solo atribuye. */
  carta?: string;
  /** La tarjeta negra por correo: a dónde mandarla. */
  tarjeta?: { direccion?: unknown };
// productos: { viaje?, impresos?, marcos?, tarjetas?: number }
// regalo: sumar codigoImpreso?: string;

// leerCarrito: sumar
    tarjetas: typeof crudo?.tarjetas === "number" ? crudo.tarjetas : 0,
```

En `POST`, justo después de `const admin = crearClienteServidor();`:

```ts
  // Regalo en locales (17/10). Un regalo desde una carta tiene que poder
  // pagarse: la carta existe y nadie la pagó. La compra para uno mismo con
  // ?carta solo atribuye el local y no consume la carta.
  const codigoImpreso = typeof body.regalo?.codigoImpreso === "string" ? body.regalo.codigoImpreso : null;
  let carta: CodigoImpreso | null = null;
  if (datosRegalo && codigoImpreso) {
    carta = await leerCodigoImpreso(admin, codigoImpreso);
    if (!carta || carta.pagado) {
      return NextResponse.json({ error: textosCartaComprador(trato).cartaUsada }, { status: carta ? 409 : 404 });
    }
    // La carta se da en mano: no hay día de entrega.
    datosRegalo = { ...datosRegalo, fechaEntrega: null, entrega: null };
  } else if (!datosRegalo && typeof body.carta === "string") {
    carta = await leerCodigoImpreso(admin, body.carta);
  }
  const local = carta?.localActivo ? carta : null;

  let tarjeta: { direccion: Direccion } | null = null;
  if (carrito.tarjetas && carrito.tarjetas > 0) {
    if (!(datosRegalo && carta)) {
      return NextResponse.json({ error: "La tarjeta por correo solo se puede sumar al regalar una carta." }, { status: 400 });
    }
    const d = validarDireccion(body.tarjeta?.direccion);
    if (!d.ok) return NextResponse.json({ error: d.mensaje }, { status: 400 });
    tarjeta = { direccion: d.direccion };
  }
```

`validarCarrito` y `calcularCompra` ya corren antes con `carrito.tarjetas`, porque `leerCarrito` lo trae. `datosRegalo` tiene que ser `let`: hoy es `let datosRegalo: DatosRegalo | null = null;`, así que alcanza.

En el insert del pedido:

```ts
    .insert({
      familia_id: familiaId,
      narrador_id: narradorId,
      proveedor: compra.region === "ES" ? "stripe" : "mercadopago",
      estado: "pendiente",
      monto: compra.total,
      moneda: compra.moneda,
      extras: {
        ...productosParaPedido(compra),
        ...(datosRegalo ? { regalo: true } : {}),
        ...(datosRegalo && carta ? { codigo_impreso: carta.codigo } : {}),
        ...(tarjeta ? { tarjeta } : {}),
      },
      // Solo con local: una compra común no escribe columnas que la migración
      // 20261017000000 todavía puede no haber creado.
      ...(local ? { local_id: local.localId, comision_local: comisionDelLibro(compra, local.comisionPct) } : {}),
    })
```

`fecha_entrega` del regalo nuevo ya sale de `datosRegalo.fechaEntrega`, que quedó en null.

- [ ] **Step 4: Correr el test nuevo y toda la suite**

Run: `cd web && npx vitest run test/compra-carta.test.ts && npm test`
Expected: PASS. `compra-regalo.test.ts` y `comprar.test.ts` siguen en verde: sin carta, el pedido es igual que antes.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/api/compra/route.ts web/test/compra-carta.test.ts
git commit -m "Compra: regalo desde una carta impresa, comisión del local y tarjeta negra"
```

---

### Task 5: confirmarPago toma la carta y avisa la tarjeta

**Files:**
- Modify: `web/src/lib/confirmar-pago.ts`
- Modify: `web/src/app/api/webhooks/stripe/route.ts:33`, `web/src/app/api/webhooks/mercadopago/route.ts:141`, `web/src/app/api/pago/vuelta/route.ts:66` (pasan `avisarSocios: enviarMailSocios`)
- Test: `web/test/confirmar-pago-carta.test.ts` (nuevo; el fake viene de `web/test/confirmar-pago.test.ts`)

**Interfaces:**
- Consumes: `enviarMailSocios(asunto: string, texto: string): Promise<boolean>` (`lib/mail.ts:57`).
- Produces: `confirmarPago(admin, { ..., avisarSocios?: (asunto: string, texto: string) => Promise<boolean> })`. `codigoRegalo` devuelve el código impreso cuando la carta se tomó.

- [ ] **Step 1: Test que falla**

Usar el fake de `confirmar-pago.test.ts`, extendido para que `codigos_impresos.update(...).eq(...).is("pedido_id", null).select(...)` devuelva la fila configurada. Casos:

1. **Pago de un regalo con `extras.codigo_impreso = "VF-7K3M2Q"` y la carta libre.**
   - Se hace `update({ pedido_id: "ped-1" })` en `codigos_impresos` con `is("pedido_id", null)`.
   - Se hace `update({ codigo: "VF-7K3M2Q" })` en `regalos` por `narrador_id`.
   - `codigoRegalo === "VF-7K3M2Q"`, y el mail del regalo sale con ese código.
2. **La carta ya la tomó otro pedido** (el update devuelve 0 filas).
   - El regalo no cambia.
   - Se llama `avisarSocios` con un asunto que contiene `VF-7K3M2Q`.
   - `codigoRegalo` es el código generado.
3. **`extras.tarjeta = { direccion }`.** Se llama `avisarSocios` con un asunto que contiene «Tarjeta negra» y un texto que lleva la dirección y la región.
4. **Reintento (`yaEstaba`).** No se toca `codigos_impresos` ni se avisa nada.
5. **Pedido sin carta ni tarjeta.** No se llama `avisarSocios`.

- [ ] **Step 2: Correr y ver que falla**

Run: `cd web && npx vitest run test/confirmar-pago-carta.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

En `opciones` agregar `avisarSocios?: (asunto: string, texto: string) => Promise<boolean>`. Después del paso 3 (entregas) y antes del paso 4 (mail):

```ts
  // 3b. Regalo en locales (17/10). La carta se toma recién ahora que está
  //     pagada (compare-and-swap: la primera que paga gana). Si otra persona
  //     la pagó antes, este regalo se queda con su código generado, que anda
  //     igual, y los socios lo resuelven a mano.
  const codigoImpreso = typeof extras?.codigo_impreso === "string" ? extras.codigo_impreso : null;
  if (esRegalo && codigoImpreso) {
    try {
      const { data: tomadas, error } = await admin
        .from("codigos_impresos")
        .update({ pedido_id: pedido.id })
        .eq("codigo", codigoImpreso)
        .is("pedido_id", null)
        .select("codigo");
      if (error) throw new Error(error.message);
      if (((tomadas as { codigo: string }[] | null) ?? []).length > 0) {
        const { error: errorCodigo } = await admin.from("regalos").update({ codigo: codigoImpreso }).eq("narrador_id", pedido.narrador_id);
        if (errorCodigo) throw new Error(errorCodigo.message);
      } else {
        await opciones.avisarSocios?.(
          `Carta ${codigoImpreso} pagada dos veces`,
          `El pedido ${pedidoId} pagó la carta ${codigoImpreso}, pero ya era de otro pedido. El regalo quedó con su código generado y anda. Hay que avisarle a quien compró y ver si se devuelve.`,
        );
      }
    } catch (err) {
      console.error(`confirmarPago: el pedido ${pedidoId} quedó pagado pero no pude tomar la carta ${codigoImpreso}:`, err);
      await opciones.avisarSocios?.(`Carta ${codigoImpreso} sin tomar`, `El pedido ${pedidoId} está pagado pero la carta no quedó tomada: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3c. La tarjeta negra por correo: no pasa por `entregas` (no es un libro).
  //     Se avisa a los socios con la dirección para imprimirla y mandarla desde
  //     el país (en Argentina se hace todo desde allá).
  const pedidoTarjeta = extras?.tarjeta as { direccion?: Record<string, string> } | undefined;
  if (pedidoTarjeta?.direccion) {
    const d = pedidoTarjeta.direccion;
    const lineas = [d.linea1, d.linea2, `${d.cp} ${d.ciudad}`, d.provincia, d.pais].filter(Boolean).join("\n");
    await opciones.avisarSocios?.(
      `Tarjeta negra para mandar (${region ?? "AR"})`,
      `Pedido ${pedidoId}. Imprimir la tarjeta negra${codigoImpreso ? ` de la carta ${codigoImpreso}` : ""} y mandarla en sobre negro a\n\n${lineas}`,
    );
  }
```

`enviarMailSocios` nunca tira error (`lib/mail.ts:57`). Aun así, como `avisarSocios` es inyectable, envolver cada llamada en `try {} catch {}` si el test de un fake que tira error lo pide.

En los tres llamadores agregar `avisarSocios: enviarMailSocios` (import de `@/lib/mail`).

- [ ] **Step 4: Correr el test nuevo y toda la suite**

Run: `cd web && npx vitest run test/confirmar-pago-carta.test.ts && npm test`
Expected: PASS. `confirmar-pago.test.ts`, `webhook-mp.test.ts` y `pago-vuelta.test.ts` siguen en verde. Si alguno mockea `@/lib/mail` sin `enviarMailSocios`, agregarlo al mock.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/confirmar-pago.ts web/src/app/api/webhooks web/src/app/api/pago/vuelta/route.ts web/test/confirmar-pago-carta.test.ts
git commit -m "Pago: la carta se toma al pagar y la tarjeta negra avisa a los socios"
```

---

### Task 6: /regalo/[codigo] con carta sin pagar

**Files:**
- Modify: `web/src/app/regalo/[codigo]/page.tsx`
- Create: `web/src/app/regalo/[codigo]/carta-libre.tsx`
- Test: `web/test/regalo-pagina.test.tsx` (sumar casos y mockear `@/lib/cartas`)

**Interfaces:**
- Consumes: `leerCodigoImpreso` (Task 3) y `textosCartaLibre` (Task 3).
- Produces: el componente `CartaLibre({ codigo, idioma })`.

- [ ] **Step 1: Test que falla**

En `regalo-pagina.test.tsx` sumar al estado `vi.hoisted` un `carta: null as CodigoImpreso | null` y mockear:

```ts
vi.mock("@/lib/cartas", () => ({ leerCodigoImpreso: async () => estado.carta }));
```

Casos nuevos:

```ts
it("carta sin pagar: muestra que no se activó y lleva a regalarla", async () => {
  estado.regalo = null;
  estado.carta = { codigo: "VF-7K3M2Q", pagado: false, localId: "l", idioma: "ca", comisionPct: 20, localActivo: true };
  const html = renderToStaticMarkup(await PaginaRegalo({ params: Promise.resolve({ codigo: "VF-7K3M2Q" }) }) as ReactElement);
  expect(html).toContain(textosCartaLibre("ca").titulo);
  expect(html).toContain('href="/regalar?codigo=VF-7K3M2Q"');
  expect(html).toContain('href="/comprar?carta=VF-7K3M2Q"');
  expect(html).not.toMatch(/€|ARS|\$/); // sin precio
});

it("carta pagada pero sin regalo legible, o código inexistente: 404", async () => {
  estado.regalo = null;
  estado.carta = { codigo: "VF-7K3M2Q", pagado: true, localId: "l", idioma: "ca", comisionPct: 20, localActivo: true };
  await expect(PaginaRegalo({ params: Promise.resolve({ codigo: "VF-7K3M2Q" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  estado.carta = null;
  await expect(PaginaRegalo({ params: Promise.resolve({ codigo: "VF-7K3M2Q" }) })).rejects.toThrow("NEXT_NOT_FOUND");
});
```

En el `beforeEach` existente poner `estado.carta = null`.

- [ ] **Step 2: Correr y ver que falla**

Run: `cd web && npx vitest run test/regalo-pagina.test.tsx`
Expected: FAIL en los casos nuevos.

- [ ] **Step 3: Implementar**

En `page.tsx`, reemplazar `if (!regalo) notFound();` por:

```ts
  if (!regalo) {
    // Regalo en locales (17/10): una carta que alguien se llevó y nadie pagó.
    // Una pagada sin regalo legible (narrador pendiente) sigue siendo 404.
    const carta = await leerCodigoImpreso(crearClienteServidor(), crudo);
    if (carta && !carta.pagado) return <CartaLibre codigo={carta.codigo} idioma={carta.idioma} />;
    notFound();
  }
```

`carta-libre.tsx` (server component, mismas fuentes y paleta que `page.tsx`: fondo blanco, tinta `#14140F`, violeta `#5D3FD3` solo en el botón):

```tsx
import Link from "next/link";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import type { IdiomaRegalo } from "@/lib/regalo-textos";
import { textosCartaLibre } from "@/lib/carta-textos";
import { Toroide } from "../../marca";

// La carta de un local que nadie pagó todavía (spec 2026-10-17 §3). La abre
// quien la tiene en la mano: casi siempre quien la va a regalar. Sin precio:
// el precio aparece en /regalar.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], variable: "--fuente-cuerpo", display: "swap" });

export function CartaLibre({ codigo, idioma }: { codigo: string; idioma: IdiomaRegalo }) {
  const T = textosCartaLibre(idioma);
  const c = encodeURIComponent(codigo);
  return (
    <div lang={idioma === "ca" ? "ca" : "es"} className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} min-h-full bg-white text-[#14140F] [font-family:var(--fuente-cuerpo)]`}>
      <main className="mx-auto w-full max-w-[28rem] p-6 pb-12">
        <header className="flex items-center gap-3">
          <Toroide className="h-7 w-7" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
        </header>
        <h1 className="mt-12 text-[28px] font-medium leading-tight [font-family:var(--fuente-titulo)] [text-wrap:balance]">{T.titulo}</h1>
        <p className="mt-6 text-[17px] font-light leading-relaxed">{T.cuerpo}</p>
        <Link href={`/regalar?codigo=${c}`} className="mt-10 flex h-14 w-full items-center justify-center rounded-full bg-[#5D3FD3] text-[17px] font-medium text-white transition-colors hover:bg-[#4F35BC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D3FD3] [font-family:var(--fuente-micro)]">
          {T.regalarla}
        </Link>
        <p className="mt-6 text-center">
          <Link href={`/comprar?carta=${c}`} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">{T.paraVos}</Link>
        </p>
        <p className="mt-10 text-[14px] text-[#83837A]">{T.siTeLaRegalaron}</p>
        <p className="mt-2 text-[13px] tracking-[0.2em] text-[#83837A] [font-family:var(--fuente-micro)]">{codigo}</p>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Correr el test y toda la suite**

Run: `cd web && npx vitest run test/regalo-pagina.test.tsx && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/regalo web/test/regalo-pagina.test.tsx
git commit -m "Página del regalo: carta de un local sin pagar"
```

---

### Task 7: /regalar desde una carta

**Files:**
- Modify: `web/src/app/regalar/page.tsx`, `web/src/app/regalar/formulario.tsx`, `web/src/app/regalar/enviar.ts`
- Create: `web/src/app/regalar/eleccion-carta.tsx`
- Test: `web/test/regalar-enviar.test.ts` (sumar casos) y `web/test/regalar-carta.test.tsx` (nuevo, render de la página)

**Interfaces:**
- Consumes: `leerCodigoImpreso`, `textosCartaComprador` (Task 3), `armarCompra`, `Catalogo.tarjeta` (Task 2), `DIRECCION_CAMPOS` / `DIRECCION_CAMPOS_ES` / `Direccion` (`lib/entregas.ts`).
- Produces:
  - `PedidoRegalo` suma `codigoImpreso?: string`, `impresos?: number` y `tarjeta?: Direccion | null`.
  - `cuerpoCompra` manda `regalo.codigoImpreso`, `productos: { impresos, marcos: 0, tarjetas }` y `tarjeta: { direccion }`.
  - `FormularioRegalo` suma la prop `carta?: { codigo: string } | null`.

- [ ] **Step 1: Tests que fallan**

En `regalar-enviar.test.ts`:

```ts
it("desde una carta: manda el código, el libro elegido y la tarjeta", () => {
  const direccion = { linea1: "Carrer Major 3", ciudad: "Berga", cp: "08600", pais: "España" };
  const c = cuerpoCompra({ ...pedidoBase, codigoImpreso: "VF-7K3M2Q", impresos: 1, tarjeta: direccion, fechaEntrega: "" });
  expect(c.regalo.codigoImpreso).toBe("VF-7K3M2Q");
  expect(c.productos).toEqual({ impresos: 1, marcos: 0, tarjetas: 1 });
  expect(c.tarjeta).toEqual({ direccion });
});

it("sin carta: igual que antes", () => {
  const c = cuerpoCompra(pedidoBase);
  expect(c.productos).toEqual({ impresos: 0, marcos: 0 });
  expect("tarjeta" in c).toBe(false);
  expect("codigoImpreso" in c.regalo).toBe(false);
});
```

(`pedidoBase` es el `PedidoRegalo` que ya usa ese archivo.)

En `regalar-carta.test.tsx` se renderiza `PaginaRegalar`, mockeando `next/headers` (región ES), fuentes y `@/lib/cartas`. Casos:

- Con `searchParams: Promise.resolve({ codigo: "VF-7K3M2Q" })` y la carta libre (idioma `ca`), el HTML contiene `avisoCarta("VF-7K3M2Q")`.
- Con la carta pagada, el HTML contiene `cartaUsada`.
- Sin `codigo`, no contiene ninguno de los dos.

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd web && npx vitest run test/regalar-enviar.test.ts test/regalar-carta.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

**`enviar.ts`.** En `PedidoRegalo` agregar:

```ts
  /** Regalo en locales (17/10): la carta impresa que se está pagando. */
  codigoImpreso?: string;
  /** 1 = libro impreso (solo desde una carta; el regalo común sigue siendo el digital). */
  impresos?: number;
  /** La tarjeta negra por correo: a dónde mandarla. */
  tarjeta?: Direccion | null;
```

En `cuerpoCompra`:

```ts
    regalo: {
      ...lo de hoy...,
      ...(p.codigoImpreso ? { codigoImpreso: p.codigoImpreso } : {}),
    },
    productos: { impresos: p.impresos ?? 0, marcos: 0, ...(p.tarjeta ? { tarjetas: 1 } : {}) },
    ...(p.tarjeta ? { tarjeta: { direccion: p.tarjeta } } : {}),
```

**`page.tsx`.** Recibe `searchParams`:

```tsx
export default async function PaginaRegalar({ searchParams }: { searchParams: Promise<{ codigo?: string | string[] }> }) {
  const region = regionDelRequest(await headers());
  const trato = tratoDeRegion(region);
  const T = textosComprador(trato);
  const crudo = (await searchParams).codigo;
  const codigo = typeof crudo === "string" ? crudo : null;
  // Regalo en locales (17/10): se llega desde la página de una carta sin pagar.
  const carta = codigo ? await leerCodigoImpreso(crearClienteServidor(), codigo) : null;
  const cartaLibre = carta && !carta.pagado ? { codigo: carta.codigo } : null;
  const cartaUsada = codigo !== null && !cartaLibre;
  ...
      {cartaUsada && (
        <p role="status" className="mx-auto mt-8 w-full max-w-6xl px-4 text-[15px] text-[#45453C] sm:px-6 [font-family:var(--fuente-cuerpo)]">
          {textosCartaComprador(trato).cartaUsada}
        </p>
      )}
      <FormularioRegalo
        catalogo={catalogo(region)} region={region} trato={trato}
        idiomaInicial={carta && !carta.pagado ? carta.idioma : idiomaPorDefecto(region)}
        entregaWhatsApp={entregaWhatsAppPrendida()}
        carta={cartaLibre}
      />
```

**`eleccion-carta.tsx`** (client). Se elige el libro (radio digital o impreso, con el impreso marcado si `catalogo.impreso`), se marca la tarjeta (solo si `catalogo.tarjeta !== null`) y, si está marcada, se completan los campos de dirección con `DIRECCION_CAMPOS_ES` o `DIRECCION_CAMPOS` según la región. El total se arma con `armarCompra(catalogo, region, { base: "pdf", impresos, marcos: 0, tarjetas })` y `formatearPrecio`, el que ya usa el formulario. Props:

```tsx
export function EleccionCarta(props: {
  catalogo: Catalogo; region: Region; textos: TextosCartaComprador;
  impresos: number; onImpresos: (n: number) => void;
  tarjeta: Partial<Direccion> | null; onTarjeta: (d: Partial<Direccion> | null) => void;
}): JSX.Element
```

Mismas clases que el formulario: radios con `rounded-lg border bg-white px-4 py-3`, borde `border-2 border-[#14140F]` cuando está elegido y `etiqueta`/`campo` para los inputs. Copiar esas constantes de `formulario.tsx` o exportarlas desde ahí.

**`formulario.tsx`:**

- Nueva prop `carta?: { codigo: string } | null`.
- Estado nuevo: `impresos` (inicial `carta && catalogo.impreso ? 1 : 0`) y `tarjeta` (`Partial<Direccion> | null`, inicial null).
- Paso 2: si `carta`, no se muestran el `input type="date"` ni `<CamposEntrega>`, y en `siguiente` se saltean las validaciones de fecha y entrega.
- Arriba del paso 1, si `carta`: `<p role="status">{textosCartaComprador(trato).avisoCarta(carta.codigo)}</p>`.
- Paso 4: si `carta`, en lugar del recuadro `catalogo.base.nombre / precio` va `<EleccionCarta .../>`, que muestra el total.
- Antes de pagar, si `tarjeta` no es null, se valida con `validarDireccion(tarjeta)`. Si falla, `fallar(r.mensaje)`.
- `pagar()` pasa `codigoImpreso: carta?.codigo`, `impresos` y `tarjeta: validada ?? null` a `enviarRegalo`.
- El `<aside>` del costado: si `carta`, muestra el total de `armarCompra` en lugar de `precio`.

Sin carta, el formulario queda idéntico. `regalar-formulario` y el resto de los tests existentes siguen en verde.

- [ ] **Step 4: Correr los tests y toda la suite**

Run: `cd web && npx vitest run test/regalar-enviar.test.ts test/regalar-carta.test.tsx && npm test`
Expected: PASS.

- [ ] **Step 5: Probar en el navegador (dev server)**

Con `.env.local` apuntando a la base de desarrollo y la migración aplicada ahí:

1. Crear un local y un lote de 2 con el script (Task 9). Si el script todavía no existe, insertar a mano en el SQL Editor de desarrollo.
2. Abrir `/regalo/<código>` y ver la página «no activada».
3. Tocar *Regalarla*: en `/regalar` aparece el aviso con el código, no se pide fecha y en el paso 4 se elige el libro, con el impreso marcado.
4. Pagar con la tarjeta de prueba de Stripe (4242…).
5. Volver a `/regalo/<código>`: ahora es la página del regalo con el mensaje.

Si no hay base de desarrollo con la migración, anotarlo en el handoff como **no verificado** y no darlo por probado.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/regalar web/test/regalar-enviar.test.ts web/test/regalar-carta.test.tsx
git commit -m "Regalar desde una carta: libro a elegir, sin día de entrega y tarjeta negra"
```

---

### Task 8: /comprar?carta= para uno mismo

**Files:**
- Modify: `web/src/app/comprar/page.tsx`, `web/src/app/comprar/formulario.tsx`
- Test: `web/test/comprar.test.ts` (sumar un caso si prueba el cuerpo; si no, uno de render de la página)

**Interfaces:**
- Consumes: el `carta?: string` del cuerpo de `/api/compra` (Task 4).
- Produces: `Checkout` suma la prop `carta?: string | null`.

- [ ] **Step 1: Test que falla**

Con `searchParams: Promise.resolve({ carta: "VF-7K3M2Q" })`, el `Checkout` renderizado recibe `carta="VF-7K3M2Q"`. Hacer `vi.mock("./formulario")` en el test de página y verificar las props. Sin el parámetro, recibe `null`.

- [ ] **Step 2: Correr y ver que falla**

Run: `cd web && npx vitest run test/comprar.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- En `page.tsx`, `PaginaComprar({ searchParams })` lee `carta` (string o null). Solo pasa el valor si coincide con `/^VF-[0-9A-Z]{6}$/i`, y se lo pasa a `<Checkout carta={...} />`. No valida contra la base: la ruta lo hace.
- En `formulario.tsx`, `Checkout` recibe `carta` y en el `JSON.stringify` del POST suma `...(carta ? { carta } : {})`.

- [ ] **Step 4: Correr y suite**

Run: `cd web && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/comprar web/test/comprar.test.ts
git commit -m "Comprar para uno mismo desde una carta: el local queda atribuido"
```

---

### Task 9: Panel del local y generador de lotes

**Files:**
- Create: `web/src/app/local/[token]/page.tsx`
- Create: `web/src/lib/lote-imprimible.ts`
- Create: `web/scripts/lote-local.mts`
- Test: `web/test/panel-local.test.tsx`, `web/test/lote-imprimible.test.ts`

**Interfaces:**
- Consumes: `resumenPorMes`, `textosPanelLocal` (Task 3), `generarCodigo`, `normalizarCodigo` (`lib/regalo.ts`), `qrDataUri`, `urlRegalo` (`lib/qr.ts`).
- Produces:
  - `armarHojaLote(cartas: { codigo: string; qr: string }[], idioma: IdiomaRegalo): string` (HTML completo para imprimir).
  - Script con estos comandos:
    - `npx tsx scripts/lote-local.mts crear-local --nombre "…" --pais ES --idioma ca [--contacto "…"]`
    - `npx tsx scripts/lote-local.mts lote --local <uuid> --cantidad 10`

- [ ] **Step 1: Tests que fallan**

`panel-local.test.tsx` mockea `@/lib/supabase/servidor` con un admin que devuelve, por tabla:

- `locales`: `{ id, nombre: "Copistería Berga", idioma: "ca", pais: "ES" }` para el token bueno y null para otro;
- `lotes_impresos`: `[{ cantidad: 10 }, { cantidad: 5 }]`;
- `pedidos`: dos pedidos de octubre.

Casos:

- Con el token bueno, el HTML contiene `textosPanelLocal("ca").sobres(15)`, la fila `2026-10` con 2 cartas y la suma de comisión formateada.
- Con un token desconocido, tira `NEXT_NOT_FOUND`.

`lote-imprimible.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { armarHojaLote } from "../src/lib/lote-imprimible";

it("una carta por código, con su código y su QR, sin precio", () => {
  const html = armarHojaLote([{ codigo: "VF-7K3M2Q", qr: "data:image/png;base64,AAA" }, { codigo: "VF-8P4N3R", qr: "data:image/png;base64,BBB" }], "ca");
  expect(html.startsWith("<!doctype html>")).toBe(true);
  expect(html).toContain("VF-7K3M2Q");
  expect(html).toContain("VF-8P4N3R");
  expect(html.match(/<img class="qr"/g)).toHaveLength(2);
  expect(html).not.toMatch(/€|ARS/);
  expect(html).toContain("@page");
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `cd web && npx vitest run test/panel-local.test.tsx test/lote-imprimible.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar el panel**

`web/src/app/local/[token]/page.tsx` es un server component sin login.

1. Lee `locales` por `token_panel`. Si no hay fila, `notFound()`.
2. Lee la suma de `lotes_impresos.cantidad` del local.
3. Lee `pedidos(created_at, comision_local, monto, moneda)` con `.eq("local_id", id).in("estado", ["pagado", "generando", "esperando_voz", "entregado"])`.
4. Arma el resumen con `resumenPorMes(pedidos, pais === "ES" ? "Europe/Madrid" : "America/Argentina/Buenos_Aires")`.
5. Muestra una tabla `mes | cartas | te toca`. Formatea la plata con `Intl.NumberFormat(pais === "ES" ? "es-ES" : "es-AR", { style: "currency", currency: moneda })`.

Lleva `export const dynamic = "force-dynamic"` y `metadata = { robots: { index: false } }`. Estilo de `/regalo/[codigo]`: una columna, fondo blanco, tinta negra.

- [ ] **Step 4: Implementar el imprimible y el script**

`lote-imprimible.ts` usa solo imports relativos, porque el script lo corre `tsx` sin el alias `@`. Arma el HTML A4 a doble faz:

- 2 cartas A5 por hoja (cada A5 doblado al medio es una carta A6).
- **Cara exterior:** tapa con el toroide en SVG inline, «Vitácora Familiar» y «En cada familia hay un libro sin escribir», y contratapa en blanco.
- **Cara interior:**
  - a la izquierda, «Para» y «De» con líneas para escribir a mano;
  - a la derecha, el texto corto de qué es, `<img class="qr" src="…">`, el código en letras grandes y la línea «Se activa cuando la pagás en vitacorafamiliar.com» en el idioma del lote.
- Una última hoja de 12 stickers redondos de 40 mm, blancos con el toroide y «El libro de su vida · Gift card», sin código.

Los textos de la carta van en un objeto `TEXTOS_CARTA: Record<IdiomaRegalo, {...}>` dentro de `lote-imprimible.ts`, marcado como **⚠️ BORRADOR** igual que `carta-textos.ts`. Arrancan con estos textos (es-AR; para es-ES y ca, la misma frase traducida):

- tapa: «En cada familia hay un libro sin escribir»;
- adentro: «Esto es un regalo. Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp. Vos le contestás con audios, cuando puedas. Con lo que le cuentes se escribe el libro de tu vida.»;
- pie: «Se activa cuando la pagás en vitacorafamiliar.com».

Fuentes con `<link>` a Google Fonts (Playfair Display, Archivo, Source Serif 4) y colores `#14140F` sobre blanco. CSS con `@page { size: A4; margin: 0 }`.

`scripts/lote-local.mts` copia la carga de `.env.local` y el cliente de `scripts/codigo-local.mts`.

- **`crear-local`:**
  - inserta en `locales` con `token_panel = randomBytes(24).toString("base64url")`;
  - imprime el id y `${URL_BASE}/local/${token}`.
- **`lote`:**
  1. Lee el local (su `idioma`).
  2. Inserta `lotes_impresos` con la cantidad.
  3. Por cada carta prueba `generarCodigo()` hasta 5 veces, insertando en `codigos_impresos`; un 23505 (el trigger o la PK) pide otro código.
  4. Arma los QR con `qrDataUri(urlRegalo(codigo))`.
  5. Escribe `scripts/salida/lote-<AAAA-MM-DD>-<id corto del local>.html` e imprime la ruta.

Agregar `web/scripts/salida/` a `.gitignore`.

Antes, confirmar que `lib/regalo.ts` y `lib/qr.ts` se pueden importar con `tsx` desde el script. `regalo.ts` importa `./regalo-textos`, `./regalo-reglas` y `./registro` con rutas relativas; si alguno usa `@/`, en el script se replica `generarCodigo` (es corto: `ALFABETO_CODIGO` y 6 caracteres con `randomInt`), con un comentario que diga dónde vive el original.

- [ ] **Step 5: Correr tests y suite**

Run: `cd web && npx vitest run test/panel-local.test.tsx test/lote-imprimible.test.ts && npm test`
Expected: PASS.

- [ ] **Step 6: Probar el script contra la base de desarrollo**

Run: `cd web && npx tsx scripts/lote-local.mts crear-local --nombre "Prueba" --pais ES --idioma ca`, después `npx tsx scripts/lote-local.mts lote --local <id> --cantidad 2`, y abrir el HTML en el navegador.

Expected: 2 cartas con QR que abren `/regalo/<código>` y una hoja de stickers. Si no hay base de desarrollo con la migración, anotarlo como no verificado.

- [ ] **Step 7: Commit**

```bash
git add web/src/app/local web/src/lib/lote-imprimible.ts web/scripts/lote-local.mts web/test/panel-local.test.tsx web/test/lote-imprimible.test.ts web/.gitignore
git commit -m "Locales: panel de solo lectura y generador de lotes para imprimir"
```

---

### Task 10: Cierre

**Files:**
- Create: `docs/regalo/locales/handoff-2026-10-17.md`

- [ ] **Step 1: Suite completa y build**

Run: `cd web && npm test && npm run build`
Expected: todo en verde y el build sin errores de tipos.

- [ ] **Step 2: Handoff**

Escribir `docs/regalo/locales/handoff-2026-10-17.md` con:

- qué quedó hecho;
- qué se verificó en el navegador y qué no;
- los pasos para salir:
  1. OK de Joaquín a la migración.
  2. Naza la aplica en el SQL Editor.
  3. Cargar `PRECIO_TARJETA_FISICA_EUR=9` y `PRECIO_TARJETA_FISICA_ARS=15000` en Vercel (Preview y Production).
  4. Aprobar los textos de `carta-textos.ts` y de `lote-imprimible.ts` en tandas de 10.
  5. Crear el local de Berga y su primer lote con el script.
  6. Imprimir en la copistería: cartas A4 doble faz cortadas en A5, sobres negros C6 comprados y la hoja de stickers.
  7. Prueba real: pagar una carta con la clave de prueba, escanearla como narrador y ver la comisión en el panel del local.
- lo que queda fuera: el pack de 109 € (entra con `rediseno-web`), el libro gigante y la percha de ropa.

- [ ] **Step 3: Commit y push de la rama**

```bash
git add docs/regalo/locales/handoff-2026-10-17.md
git commit -m "Regalo en locales: handoff"
git push
```

No mergear a `main`: falta la aprobación de textos y el OK de Joaquín a la migración.
