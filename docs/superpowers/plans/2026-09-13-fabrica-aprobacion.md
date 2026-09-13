# La fábrica tras el panel del usuario — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La fábrica no escribe nada sin `narradores.libro_aprobado_at`; cuando lo hay, escribe el libro aplicando la edición (orden de capítulos, tapa, fotos, nombres verificados), publica `libro.html` + `libro.pdf` + audiolibro, entrega y avisa por mail; además manda los mails de "terminó", recordatorios de cierre (3/7/14 días) y el cierre automático a los 30. La web muestra `libro.html` en el lector.

**Architecture:** Todo vive en el worker de la fábrica (`fabrica/src/worker.ts`, un tick por minuto) y en `generarPaquete`. Dos módulos nuevos y puros (`libro/edicion.ts`, `libro/fotos.ts`) alimentan a `generarPaquete` y a la plantilla; un módulo de mails nuevo (`mail/hitos.ts`) reusa el mecanismo del anticipo (Resend por `fetch`, candados en Storage). En la web, una ruta API que redirige al `libro.html` firmado y un `iframe` en la página de descarga.

**Tech Stack:** Node 22 + TypeScript ESM (`fabrica/`, `"type": "module"`, imports con `.js`), vitest 4, supabase-js, Playwright (PDF), Anthropic SDK. Web: Next.js 15 (App Router), vitest.

**Spec:** `docs/superpowers/specs/2026-09-13-fabrica-aprobacion-design.md` — leerlo entero antes de cualquier tarea.

## Global Constraints

- **Castellano rioplatense en comentarios; identificadores y nombres de archivo sin tildes; textos que lee una persona con tildes bien puestas.** Los tests y comentarios existentes marcan el tono — imitarlo.
- **Voz de marca en mails: castellano neutro de "tú"** (ver `fabrica/src/mail/anticipo.ts`). Remitente `Vitácora Familiar <hola@vitacorafamiliar.com>`.
- **Los textos de mails los aprueba Naza antes de commitear** (Task 6 los trae; no se commitea sin su OK explícito en el chat).
- **Todo test nuevo tiene que fallar contra el código viejo.** Pegar la salida roja y la verde en el reporte. No declarar nada verificado sin haber corrido el comando.
- El repo es CRLF (`core.autocrlf=true`); no pelear con eso.
- Correr los tests desde `fabrica/` con `npm test` (vitest run) y desde `web/` con `npm test`. Antes de entregar una tarea: `npm test` completo del paquete tocado en verde y `npx tsc --noEmit` sin errores.
- No tocar `entrevistador/`. No tocar el esquema de la base (las migraciones ya están aplicadas).
- `edicion.excluidas` y `edicion.correcciones` **se ignoran** a propósito (decisión de Naza, spec §1.3). No implementarlos "porque están en el contrato".
- Nombres de archivo en Storage (`{narrador_id}/paquete/`): `libro.html`, `libro.pdf`, `estructura.json`, `nombres.json`, candados `terminado_enviado.txt`, `libro_listo_enviado.txt`, `recordatorio_cierre_3.txt`, `recordatorio_cierre_7.txt`, `recordatorio_cierre_14.txt`, `cierre_automatico_enviado.txt`.

---

## Mapa de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `fabrica/src/worker.ts` | freno por `libro_aprobado_at`; branches nuevos de mails | 1, 7 |
| `fabrica/src/libro/edicion.ts` (nuevo) | `leerEdicion`, `aplicarOrdenCapitulos` — puro | 2 |
| `fabrica/src/libro/fotos.ts` (nuevo) | bajar fotos de Storage → data URIs agrupadas por capítulo | 3 |
| `fabrica/src/libro/plantilla-html.ts` | tapa con título/subtítulo, páginas de foto, sin saludos | 4 |
| `fabrica/src/audio/audiolibro.ts` | sin bonus de saludos | 5 |
| `fabrica/src/libro/generar-paquete.ts` | integra edición + fotos, `nombres.json` opcional, sube `libro.html`, genera estructura si falta | 6 |
| `fabrica/src/mail/hitos.ts` (nuevo) | asuntos, cuerpos y envío de los 6 mails | 7 |
| `fabrica/src/db.ts` | tipo `Narrador` suma `edicion`, `libro_aprobado_at`, `ultima_respuesta_at`, `familia_id`; tipo `Foto` | 2 |
| `web/src/app/api/descarga/libro-html/route.ts` (nuevo) | redirige al `libro.html` firmado | 8 |
| `web/src/app/tablero/[narradorId]/descarga/page.tsx` | el lector: `iframe` del libro | 8 |
| `supabase/CONTRATO.md`, `docs/ROADMAP.md`, `docs/panel-usuario.md` | contrato y roadmap al día | 9 |

---

### Task 1: El freno — sin `libro_aprobado_at` no se reclama el pedido

**Files:**
- Modify: `fabrica/src/worker.ts` (función `procesarPedidosPagados`, ~líneas 290-330, y la constante `ESTADOS_NARRADOR_LISTO`)
- Test: `fabrica/test/worker.test.ts` (describe `tick — branch b (pedidos pagados)`)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: el worker solo llama a `generarPaquete(pedido)` para pedidos `pagado` cuyo narrador tiene `libro_aprobado_at` no nulo. El `select` de narradores pasa a ser `'id, libro_aprobado_at'`.

- [ ] **Step 1: Leer cómo el fake de `narradores` devuelve filas en `worker.test.ts`**

`construirClienteDbMock({ narradores })` devuelve `opciones.narradores` para `db.from('narradores').select(...).in(...)`. Los tests actuales pasan `{ id, estado }`. Van a pasar `{ id, libro_aprobado_at }`.

- [ ] **Step 2: Escribir los tests que fallan**

En `fabrica/test/worker.test.ts`, dentro de `describe('tick — branch b (pedidos pagados)')`, reemplazar el test `'un pedido pagado cuyo narrador todavia NO termino no se reclama ni se genera (pago por adelantado)'` y `'con dos pedidos pagados, genera solo el del narrador que termino'` por estos tres (mantener el resto; donde los tests existentes pasen `estado: 'completado'` en `narradores`, cambiarlo por `libro_aprobado_at: '2026-09-13T10:00:00Z'`):

```ts
  it('un pedido pagado cuyo narrador terminó pero NO cerró el libro (sin libro_aprobado_at) no se reclama ni se genera', async () => {
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', libro_aprobado_at: null }],
      archivosPorNarrador: {},
      pedidosPagados: [{ id: 'p1', narrador_id: 'n1' }],
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await procesarPedidosPagados();

    expect(generarPaqueteMock).not.toHaveBeenCalled();
  });

  it('un pedido pagado cuyo narrador cerró el libro (libro_aprobado_at) se reclama y se genera', async () => {
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', libro_aprobado_at: '2026-09-13T10:00:00Z' }],
      archivosPorNarrador: {},
      pedidosPagados: [{ id: 'p1', narrador_id: 'n1' }],
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await procesarPedidosPagados();

    expect(generarPaqueteMock).toHaveBeenCalledTimes(1);
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'p1', narrador_id: 'n1' });
  });

  it('con dos pedidos pagados, genera solo el del narrador que cerró el libro', async () => {
    const db = construirClienteDbMock({
      narradores: [
        { id: 'n1', libro_aprobado_at: null },
        { id: 'n2', libro_aprobado_at: '2026-09-13T10:00:00Z' },
      ],
      archivosPorNarrador: {},
      pedidosPagados: [
        { id: 'p1', narrador_id: 'n1' },
        { id: 'p2', narrador_id: 'n2' },
      ],
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await procesarPedidosPagados();

    expect(generarPaqueteMock).toHaveBeenCalledTimes(1);
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'p2', narrador_id: 'n2' });
  });
```

- [ ] **Step 3: Correr y ver que fallan**

Run: `cd fabrica && npx vitest run test/worker.test.ts`
Expected: el test "terminó pero NO cerró" FALLA. Ojo: para que falle contra el código viejo (que mira `estado`), las filas de `narradores` de los tres tests tienen que llevar también `estado: 'completado'` — `{ id: 'n1', estado: 'completado', libro_aprobado_at: null }`. Con eso el código viejo genera y el test lo detecta. Pegar la salida roja en el reporte.

- [ ] **Step 4: Implementar**

En `fabrica/src/worker.ts`:

```ts
/**
 * El libro se escribe recién cuando la dueña apretó "Cerrar libro"
 * (`narradores.libro_aprobado_at`). Es el punto de aprobación del cliente:
 * antes de eso no se produce nada, ni digital ni impreso — decisión de los
 * socios del 12/09, y de Naza el 13/09: ella no ve nada escrito antes de
 * cerrar. Que el narrador esté `completado` ya no alcanza.
 */
```

Borrar `ESTADOS_NARRADOR_LISTO`. En `procesarPedidosPagados`:

```ts
  const { data: narradores, error: errorNarradores } = await db
    .from('narradores')
    .select('id, libro_aprobado_at')
    .in('id', pedidosPagados.map((p) => p.narrador_id));
  // ...
  const narradoresListos = new Set(
    ((narradores ?? []) as { id: string; libro_aprobado_at: string | null }[])
      .filter((n) => n.libro_aprobado_at !== null)
      .map((n) => n.id)
  );
```

Actualizar el comentario del bloque ("Con el pago por adelantado…") para que diga que el filtro es `libro_aprobado_at`.

- [ ] **Step 5: Correr todo el paquete**

Run: `cd fabrica && npm test && npx tsc --noEmit`
Expected: todo verde; ningún test viejo roto (si alguno de branch b pasaba `estado: 'completado'` y ahora espera generación, sumarle `libro_aprobado_at`).

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/worker.ts fabrica/test/worker.test.ts
git commit -m "fabrica: no producir nada sin libro_aprobado_at — el freno del Cerrar libro"
```

---

### Task 2: `edicion.ts` — leer `narradores.edicion` sin tirar nunca

**Files:**
- Create: `fabrica/src/libro/edicion.ts`
- Modify: `fabrica/src/db.ts` (tipo `Narrador`)
- Test: `fabrica/test/edicion.test.ts` (nuevo)

**Interfaces:**
- Produces:
  ```ts
  export type Edicion = {
    ordenCapitulos: string[];        // [] = orden de estructura.json
    titulo: string | null;           // null = default de la plantilla
    subtitulo: string | null;
    portadaFotoId: string | null;
  };
  export function leerEdicion(valor: unknown): Edicion;
  export function aplicarOrdenCapitulos<T extends { nombre: string }>(capitulos: T[], orden: string[]): T[];
  ```
- En `db.ts`, `Narrador` suma: `familia_id: string; edicion: unknown; libro_aprobado_at: string | null; ultima_respuesta_at: string | null;`. Y un tipo nuevo:
  ```ts
  export type Foto = {
    id: string;
    narrador_id: string;
    capitulo: string;
    storage_path: string;
    epigrafe: string | null;
    principal: boolean;
    orden: number;
  };
  ```

- [ ] **Step 1: Escribir los tests**

`fabrica/test/edicion.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { leerEdicion, aplicarOrdenCapitulos } from '../src/libro/edicion.js';

describe('leerEdicion', () => {
  it('{} → todos los defaults', () => {
    expect(leerEdicion({})).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null });
  });

  it('null / undefined / string → defaults, sin tirar', () => {
    for (const valor of [null, undefined, 'hola', 42, []]) {
      expect(leerEdicion(valor)).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null });
    }
  });

  it('lee las cuatro claves que aplica la fábrica', () => {
    expect(
      leerEdicion({
        ordenCapitulos: ['El amor', 'La infancia'],
        titulo: 'Mi abuela Rosa',
        subtitulo: 'Rosa Pérez',
        portadaFotoId: '0b1c9e2a-1111-4222-8333-944455566677',
      })
    ).toEqual({
      ordenCapitulos: ['El amor', 'La infancia'],
      titulo: 'Mi abuela Rosa',
      subtitulo: 'Rosa Pérez',
      portadaFotoId: '0b1c9e2a-1111-4222-8333-944455566677',
    });
  });

  it('un valor con tipo inesperado se descarta (default) y se loguea, sin tirar', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const edicion = leerEdicion({ ordenCapitulos: 'La infancia', titulo: 7, subtitulo: ['x'], portadaFotoId: 12 });
    expect(edicion).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('ordenCapitulos con elementos que no son string: se filtran', () => {
    expect(leerEdicion({ ordenCapitulos: ['A', 3, null, 'B'] }).ordenCapitulos).toEqual(['A', 'B']);
  });

  it('strings vacíos o solo espacios en titulo/subtitulo cuentan como null', () => {
    expect(leerEdicion({ titulo: '   ', subtitulo: '' })).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null });
  });

  it('ignora excluidas y correcciones (decisión de Naza 13/09) y claves desconocidas', () => {
    const edicion = leerEdicion({ excluidas: ['r1'], correcciones: 'cambiá Rosana por Rosa', loQueSea: 1 });
    expect(edicion).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null });
    expect('excluidas' in edicion).toBe(false);
  });
});

describe('aplicarOrdenCapitulos', () => {
  const capitulos = [
    { nombre: 'La infancia', ordenes: [1, 2] },
    { nombre: 'El amor', ordenes: [3] },
    { nombre: 'El trabajo', ordenes: [4] },
  ];

  it('sin orden → los mismos capítulos en el mismo orden', () => {
    expect(aplicarOrdenCapitulos(capitulos, [])).toEqual(capitulos);
  });

  it('reordena por nombre; los no nombrados van al final en su orden original', () => {
    expect(aplicarOrdenCapitulos(capitulos, ['El trabajo']).map((c) => c.nombre)).toEqual([
      'El trabajo',
      'La infancia',
      'El amor',
    ]);
  });

  it('nombres que no existen se ignoran; repetidos cuentan una vez', () => {
    expect(aplicarOrdenCapitulos(capitulos, ['Nada', 'El amor', 'El amor']).map((c) => c.nombre)).toEqual([
      'El amor',
      'La infancia',
      'El trabajo',
    ]);
  });

  it('no muta la lista original', () => {
    const copia = structuredClone(capitulos);
    aplicarOrdenCapitulos(capitulos, ['El amor']);
    expect(capitulos).toEqual(copia);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd fabrica && npx vitest run test/edicion.test.ts`
Expected: FAIL — `Cannot find module '../src/libro/edicion.js'`.

- [ ] **Step 3: Implementar `edicion.ts`**

```ts
// La edición final que la dueña deja en `narradores.edicion` (jsonb, la
// escribe la web — spec docs/panel-usuario.md §7.2). La fábrica aplica
// SOLO orden de capítulos, título, subtítulo y foto de tapa. `excluidas` y
// `correcciones` existen en el contrato pero se ignoran a propósito: una
// vez respondida una pregunta no se modifica nada (decisión de Naza,
// 13/09, ver docs/superpowers/specs/2026-09-13-fabrica-aprobacion-design.md).
//
// Nunca tira: un jsonb roto no puede tumbar un pedido pagado. Lo que no se
// entiende se descarta con un aviso y se usa el default.

export type Edicion = {
  ordenCapitulos: string[];
  titulo: string | null;
  subtitulo: string | null;
  portadaFotoId: string | null;
};

const EDICION_VACIA: Edicion = { ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null };

function textoONull(valor: unknown, clave: string): string | null {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') {
    console.warn(`leerEdicion: "${clave}" no es texto, se ignora.`);
    return null;
  }
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

export function leerEdicion(valor: unknown): Edicion {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    return { ...EDICION_VACIA };
  }
  const objeto = valor as Record<string, unknown>;

  let ordenCapitulos: string[] = [];
  if (objeto.ordenCapitulos !== undefined && objeto.ordenCapitulos !== null) {
    if (Array.isArray(objeto.ordenCapitulos)) {
      ordenCapitulos = objeto.ordenCapitulos.filter((n): n is string => typeof n === 'string');
    } else {
      console.warn('leerEdicion: "ordenCapitulos" no es una lista, se ignora.');
    }
  }

  return {
    ordenCapitulos,
    titulo: textoONull(objeto.titulo, 'titulo'),
    subtitulo: textoONull(objeto.subtitulo, 'subtitulo'),
    portadaFotoId: textoONull(objeto.portadaFotoId, 'portadaFotoId'),
  };
}

/**
 * Reordena los capítulos según los nombres que eligió la dueña. Los nombres
 * que no existen se ignoran; los capítulos que no nombró van al final, en
 * el orden que tenían. No muta la entrada.
 */
export function aplicarOrdenCapitulos<T extends { nombre: string }>(capitulos: T[], orden: string[]): T[] {
  if (orden.length === 0) return [...capitulos];
  const porNombre = new Map(capitulos.map((c) => [c.nombre, c]));
  const elegidos: T[] = [];
  const vistos = new Set<string>();
  for (const nombre of orden) {
    const capitulo = porNombre.get(nombre);
    if (!capitulo || vistos.has(nombre)) continue;
    vistos.add(nombre);
    elegidos.push(capitulo);
  }
  const resto = capitulos.filter((c) => !vistos.has(c.nombre));
  return [...elegidos, ...resto];
}
```

- [ ] **Step 4: Ampliar los tipos en `db.ts`**

En `Narrador` agregar después de `estado: string;`:

```ts
  familia_id: string;
  /** jsonb que escribe la web con la edición final; lo interpreta `libro/edicion.ts`. */
  edicion: unknown;
  /** "Cerrar libro": sin esto no se produce nada. Lo escribe la web, o la fábrica a los 30 días. */
  libro_aprobado_at: string | null;
  ultima_respuesta_at: string | null;
```

Y el tipo `Foto` (ver Interfaces) después de `Respuesta`. `Pregunta.tipo` pasa a `'fija' | 'adaptativa' | 'familia' | 'sugerida'`.

- [ ] **Step 5: Correr**

Run: `cd fabrica && npm test && npx tsc --noEmit`
Expected: verde. Si algún test construye un `Narrador` literal y tsc se queja por las claves nuevas, agregarlas al fixture (`familia_id: 'f1', edicion: {}, libro_aprobado_at: null, ultima_respuesta_at: null`).

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/libro/edicion.ts fabrica/src/db.ts fabrica/test/edicion.test.ts
git commit -m "fabrica: leer narradores.edicion — orden de capitulos, tapa; excluidas y correcciones se ignoran"
```

---

### Task 3: `fotos.ts` — bajar las fotos y agruparlas por capítulo

**Files:**
- Create: `fabrica/src/libro/fotos.ts`
- Test: `fabrica/test/fotos.test.ts` (nuevo)

**Interfaces:**
- Consumes: `Foto` de `db.ts` (Task 2); `db.storage.from('audios').download(path)` como en `comun.ts`.
- Produces:
  ```ts
  export type FotoLibro = { dataUri: string; epigrafe: string | null };
  export type FotosCapitulo = { apertura: FotoLibro | null; cierre: FotoLibro[] };
  export type FotosDelLibro = {
    porCapitulo: Map<string, FotosCapitulo>;   // clave = fotos.capitulo
    porId: Map<string, FotoLibro>;             // clave = fotos.id (para portadaFotoId)
  };
  export function mimeDeRuta(ruta: string): string;
  export async function cargarFotos(db: SupabaseClient, narradorId: string): Promise<FotosDelLibro>;
  ```

- [ ] **Step 1: Escribir los tests**

`fabrica/test/fotos.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { cargarFotos, mimeDeRuta } from '../src/libro/fotos.js';

function blobFake(bytes: string) {
  return { arrayBuffer: async () => Buffer.from(bytes).buffer.slice(0) };
}

function construirDb(opciones: {
  fotos: { data: unknown; error: unknown };
  archivos: Record<string, string>; // storage_path → bytes; ausente = error de descarga
}) {
  const download = vi.fn((ruta: string) => {
    const bytes = opciones.archivos[ruta];
    return Promise.resolve(
      bytes === undefined ? { data: null, error: { message: 'Object not found' } } : { data: blobFake(bytes), error: null }
    );
  });
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => Promise.resolve(opciones.fotos),
  };
  return {
    from: vi.fn(() => builder),
    storage: { from: vi.fn(() => ({ download })) },
    download,
  };
}

describe('mimeDeRuta', () => {
  it('jpg/jpeg/png/webp; desconocido → image/jpeg', () => {
    expect(mimeDeRuta('n/fotos/a.jpg')).toBe('image/jpeg');
    expect(mimeDeRuta('n/fotos/a.JPEG')).toBe('image/jpeg');
    expect(mimeDeRuta('n/fotos/a.png')).toBe('image/png');
    expect(mimeDeRuta('n/fotos/a.webp')).toBe('image/webp');
    expect(mimeDeRuta('n/fotos/a')).toBe('image/jpeg');
  });
});

describe('cargarFotos', () => {
  it('sin fotos → mapas vacíos', async () => {
    const db = construirDb({ fotos: { data: [], error: null }, archivos: {} });
    const fotos = await cargarFotos(db as never, 'n1');
    expect(fotos.porCapitulo.size).toBe(0);
    expect(fotos.porId.size).toBe(0);
  });

  it('la principal abre, las demás cierran en su orden, con epígrafe y data URI', async () => {
    const db = construirDb({
      fotos: {
        data: [
          { id: 'f2', narrador_id: 'n1', capitulo: 'La infancia', storage_path: 'n1/fotos/f2.png', epigrafe: 'En el patio', principal: false, orden: 2 },
          { id: 'f1', narrador_id: 'n1', capitulo: 'La infancia', storage_path: 'n1/fotos/f1.jpg', epigrafe: null, principal: true, orden: 0 },
          { id: 'f3', narrador_id: 'n1', capitulo: 'La infancia', storage_path: 'n1/fotos/f3.jpg', epigrafe: 'Con mamá', principal: false, orden: 1 },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/f1.jpg': 'AAA', 'n1/fotos/f2.png': 'BBB', 'n1/fotos/f3.jpg': 'CCC' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('La infancia')!;
    expect(cap.apertura).toEqual({ dataUri: `data:image/jpeg;base64,${Buffer.from('AAA').toString('base64')}`, epigrafe: null });
    expect(cap.cierre.map((f) => f.epigrafe)).toEqual(['Con mamá', 'En el patio']);
    expect(cap.cierre[1].dataUri.startsWith('data:image/png;base64,')).toBe(true);
    expect(fotos.porId.get('f3')?.epigrafe).toBe('Con mamá');
  });

  it('con dos principales en el mismo capítulo, abre la de menor orden y la otra cierra', async () => {
    const db = construirDb({
      fotos: {
        data: [
          { id: 'a', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/a.jpg', epigrafe: null, principal: true, orden: 5 },
          { id: 'b', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/b.jpg', epigrafe: null, principal: true, orden: 1 },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/a.jpg': 'a', 'n1/fotos/b.jpg': 'b' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('X')!;
    expect(cap.apertura?.dataUri).toContain(Buffer.from('b').toString('base64'));
    expect(cap.cierre).toHaveLength(1);
  });

  it('una foto que no se puede bajar se omite con aviso; el resto sigue', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const db = construirDb({
      fotos: {
        data: [
          { id: 'a', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/rota.jpg', epigrafe: null, principal: true, orden: 0 },
          { id: 'b', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/b.jpg', epigrafe: 'ok', principal: false, orden: 1 },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/b.jpg': 'b' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('X')!;
    expect(cap.apertura).toBeNull();
    expect(cap.cierre).toHaveLength(1);
    expect(fotos.porId.has('a')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('rota.jpg'));
    warn.mockRestore();
  });

  it('si la consulta a la tabla falla, tira (eso sí es un error del pedido)', async () => {
    const db = construirDb({ fotos: { data: null, error: { message: 'boom' } }, archivos: {} });
    await expect(cargarFotos(db as never, 'n1')).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd fabrica && npx vitest run test/fotos.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar `fotos.ts`**

```ts
// Las fotos que la familia subió por capítulo (tabla `fotos`, la escribe la
// web — spec docs/panel-usuario.md §6.3). La principal abre el capítulo, las
// demás lo cierran en su orden. Se bajan del bucket privado y se embeben
// como data URI: el PDF se imprime desde un HTML autocontenido, y el lector
// online carga ese mismo HTML.
//
// Original sin recomprimir (la resolución la valida la web al subir): el
// impreso necesita los píxeles. Una foto que no baja no frena el libro — se
// avisa y se omite.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Foto } from '../db.js';

export type FotoLibro = { dataUri: string; epigrafe: string | null };
export type FotosCapitulo = { apertura: FotoLibro | null; cierre: FotoLibro[] };
export type FotosDelLibro = {
  porCapitulo: Map<string, FotosCapitulo>;
  porId: Map<string, FotoLibro>;
};

const MIME_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export function mimeDeRuta(ruta: string): string {
  const extension = ruta.split('.').pop()?.toLowerCase() ?? '';
  return MIME_POR_EXTENSION[extension] ?? 'image/jpeg';
}

async function bajarComoDataUri(db: SupabaseClient, ruta: string): Promise<string | null> {
  const { data, error } = await db.storage.from('audios').download(ruta);
  if (error || !data) {
    console.warn(`cargarFotos: no se pudo bajar ${ruta} (${error?.message ?? 'sin datos'}); la foto se omite.`);
    return null;
  }
  const bytes = Buffer.from(await data.arrayBuffer());
  return `data:${mimeDeRuta(ruta)};base64,${bytes.toString('base64')}`;
}

export async function cargarFotos(db: SupabaseClient, narradorId: string): Promise<FotosDelLibro> {
  const { data, error } = await db
    .from('fotos')
    .select('id, narrador_id, capitulo, storage_path, epigrafe, principal, orden')
    .eq('narrador_id', narradorId)
    .order('orden', { ascending: true });
  if (error) throw new Error(`No se pudieron leer las fotos de ${narradorId}: ${error.message}`);

  const porCapitulo = new Map<string, FotosCapitulo>();
  const porId = new Map<string, FotoLibro>();

  // Ya vienen por `orden`; entre dos principales gana la primera (menor orden).
  for (const foto of (data ?? []) as Foto[]) {
    const dataUri = await bajarComoDataUri(db, foto.storage_path);
    if (dataUri === null) continue;
    const fotoLibro: FotoLibro = { dataUri, epigrafe: foto.epigrafe?.trim() || null };
    porId.set(foto.id, fotoLibro);

    const capitulo = porCapitulo.get(foto.capitulo) ?? { apertura: null, cierre: [] };
    if (foto.principal && capitulo.apertura === null) {
      capitulo.apertura = fotoLibro;
    } else {
      capitulo.cierre.push(fotoLibro);
    }
    porCapitulo.set(foto.capitulo, capitulo);
  }

  return { porCapitulo, porId };
}
```

- [ ] **Step 4: Correr**

Run: `cd fabrica && npx vitest run test/fotos.test.ts && npx tsc --noEmit`
Expected: verde.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/libro/fotos.ts fabrica/test/fotos.test.ts
git commit -m "fabrica: cargar las fotos por capitulo como data URI — principal abre, el resto cierra"
```

---

### Task 4: La plantilla — tapa con título/subtítulo, páginas de foto, sin saludos

**Files:**
- Modify: `fabrica/src/libro/plantilla-html.ts` (`construirHtmlLibro` ~línea 879, `construirPortada` ~474, `construirCapitulo` ~530, `construirSaludos` ~592 y su CSS ~442-445)
- Modify: los llamadores de `construirHtmlLibro` que pasan `saludos` (`grep -rn "construirHtmlLibro" fabrica/src` — `generar-paquete.ts`, `previsualizar.ts`, y `anticipo.ts` si lo usa): quitar `saludos: ...`.
- Test: `fabrica/test/plantilla.test.ts`

**Interfaces:**
- Consumes: `FotosCapitulo`, `FotoLibro` de `fotos.ts` (Task 3).
- Produces: la firma nueva
  ```ts
  export function construirHtmlLibro(datos: {
    titulo: string;                       // título del documento y default de la tapa
    nombreNarrador?: string;              // default: extraerNombreNarrador(titulo)
    tapa?: { titulo: string | null; subtitulo: string | null };  // lo que eligió la dueña
    anioNacimiento?: number | null;
    fotoUrl?: string | null;              // frontispicio (URL o data URI)
    indice: string[];
    libroMarkdown: string;
    fotosPorCapitulo?: Map<string, FotosCapitulo>;
    acento?: string;
  }): string;
  ```
  `saludos` desaparece de la firma. Sin `tapa`, sin `fotosPorCapitulo` y con el mismo `titulo`, el HTML es **idéntico** al de hoy salvo la sección de saludos (que ya no existe).

- [ ] **Step 1: Ver qué asertan hoy los tests de la plantilla**

`grep -n "saludos\|it(" fabrica/test/plantilla.test.ts`. Los tests que pasan `saludos: []` pasan a no pasar nada; el que pruebe la sección de saludos (si existe) se borra — y **buscar cualquier otro test que nombre "Los saludos de la familia"** para borrarlo también (regla de la casa: al retirar una frase, buscar todos los tests que la nombran).

- [ ] **Step 2: Escribir los tests nuevos**

Agregar a `fabrica/test/plantilla.test.ts` (usar el mismo `libroMarkdown` de ejemplo que ya usan los tests del archivo; si no hay uno reutilizable, definir `const LIBRO = '# A mis lectores\n\nHola.\n\n# La infancia\n\nNací en 1940.\n\n# Sus frases\n\n> Todo pasa.\n'`):

```ts
describe('construirHtmlLibro — tapa de la edición', () => {
  it('sin tapa: la portada lleva el nombre del narrador y "LA HISTORIA DE UNA VIDA"', () => {
    const html = construirHtmlLibro({ titulo: 'Rosa Pérez — La historia de una vida', indice: ['La infancia'], libroMarkdown: LIBRO });
    expect(html).toContain('<div class="portada-nombre-narrador">Rosa Pérez</div>');
    expect(html).toContain('LA HISTORIA DE UNA VIDA');
  });

  it('con tapa: el título elegido va grande y el subtítulo reemplaza la frase fija', () => {
    const html = construirHtmlLibro({
      titulo: 'Rosa Pérez — La historia de una vida',
      nombreNarrador: 'Rosa Pérez',
      tapa: { titulo: 'Mi abuela Rosa', subtitulo: 'Rosa Pérez de Gómez' },
      indice: ['La infancia'],
      libroMarkdown: LIBRO,
    });
    expect(html).toContain('<div class="portada-nombre-narrador">Mi abuela Rosa</div>');
    expect(html).toContain('<div class="tag">Rosa Pérez de Gómez</div>');
    // el nombre del narrador sigue mandando en cabeceras y aperturas
    expect(html).toContain('<div class="marca-narrador">Rosa Pérez</div>');
  });

  it('nombreNarrador explícito manda sobre el que se saca del título', () => {
    const html = construirHtmlLibro({ titulo: 'Mi abuela', nombreNarrador: 'Rosa Pérez', indice: ['La infancia'], libroMarkdown: LIBRO });
    expect(html).toContain('<div class="marca-narrador">Rosa Pérez</div>');
  });
});

describe('construirHtmlLibro — fotos por capítulo', () => {
  const foto = (tag: string, epigrafe: string | null) => ({ dataUri: `data:image/jpeg;base64,${tag}`, epigrafe });

  it('sin fotos: ninguna página de foto', () => {
    const html = construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO });
    expect(html).not.toContain('class="lienzo foto quiebre"');
  });

  it('la de apertura va entre la apertura del capítulo y el texto; las de cierre después del texto, con epígrafe', () => {
    const fotosPorCapitulo = new Map([
      ['La infancia', { apertura: foto('APERTURA', 'En el patio'), cierre: [foto('CIERRE1', null), foto('CIERRE2', 'Con mamá')] }],
    ]);
    const html = construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    const iApertura = html.indexOf('class="lienzo apertura quiebre"');
    const iFotoApertura = html.indexOf('base64,APERTURA');
    const iTexto = html.indexOf('Nací en 1940');
    const iCierre1 = html.indexOf('base64,CIERRE1');
    const iCierre2 = html.indexOf('base64,CIERRE2');
    expect(iApertura).toBeGreaterThan(-1);
    expect(iFotoApertura).toBeGreaterThan(iApertura);
    expect(iTexto).toBeGreaterThan(iFotoApertura);
    expect(iCierre1).toBeGreaterThan(iTexto);
    expect(iCierre2).toBeGreaterThan(iCierre1);
    expect(html).toContain('<div class="foto-epigrafe">En el patio</div>');
    expect(html).toContain('<div class="foto-epigrafe">Con mamá</div>');
    expect((html.match(/class="lienzo foto quiebre"/g) ?? []).length).toBe(3);
  });

  it('el epígrafe se escapa', () => {
    const fotosPorCapitulo = new Map([['La infancia', { apertura: foto('A', '<b>x</b>'), cierre: [] }]]);
    const html = construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  it('fotos de un capítulo que no está en el índice se ignoran', () => {
    const fotosPorCapitulo = new Map([['Otro', { apertura: foto('A', null), cierre: [] }]]);
    const html = construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    expect(html).not.toContain('base64,A"');
  });
});

describe('construirHtmlLibro — sin saludos', () => {
  it('no acepta ni emite la sección de saludos', () => {
    const html = construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO });
    expect(html).not.toContain('saludos');
  });
});
```

- [ ] **Step 3: Correr y ver que fallan**

Run: `cd fabrica && npx vitest run test/plantilla.test.ts`
Expected: fallan los de tapa (no existe `tapa`), fotos (no existe `fotosPorCapitulo`) y "sin saludos" (hoy `saludos` es obligatorio → tsc/vitest se quejan o el HTML contiene `.saludos-` en el CSS). Pegar la salida.

- [ ] **Step 4: Implementar**

En `plantilla-html.ts`:

1. Importar el tipo: `import type { FotosCapitulo, FotoLibro } from './fotos.js';`
2. `construirPortada` recibe además `tapa: { titulo: string | null; subtitulo: string | null }`:
   ```ts
   const textoGrande = tapa.titulo ?? nombreNarrador;
   const textoTag = tapa.subtitulo
     ? escaparHtml(tapa.subtitulo)
     : `LA HISTORIA DE UNA VIDA${anioTexto ? ` · DESDE ${escaparHtml(anioTexto)}` : ''}`;
   ```
   y usa `<div class="portada-nombre-narrador">${escaparHtml(textoGrande)}</div>` y `<div class="tag">${textoTag}</div>`. La `franja` y la contratapa no cambian.
3. Nueva función:
   ```ts
   function construirPaginaFoto(opts: { foto: FotoLibro; nombreCapitulo: string; nombreNarrador: string }): string {
     const { foto, nombreCapitulo, nombreNarrador } = opts;
     return `<div class="lienzo foto quiebre">
       <div class="foto-cabecera"><span>${escaparHtml(nombreCapitulo)}</span><span>${escaparHtml(nombreNarrador)}</span></div>
       <div class="foto-marco"><img class="foto-img" src="${escaparHtml(foto.dataUri)}" alt="" /></div>
       ${foto.epigrafe ? `<div class="foto-epigrafe">${escaparHtml(foto.epigrafe)}</div>` : ''}
     </div>`;
   }
   ```
   CSS a sumar en `construirEstilos` (junto a `.frontispicio-*`):
   ```css
   .lienzo.foto { background: var(--papel); }
   .foto-cabecera { position: absolute; top: 40px; left: 44px; right: 44px; display: flex; justify-content: space-between; font-family: Archivo, Arial, sans-serif; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gris1); }
   .foto-marco { position: absolute; top: 76px; left: 44px; right: 44px; bottom: 110px; display: flex; align-items: center; justify-content: center; }
   .foto-img { max-width: 100%; max-height: 100%; object-fit: contain; }
   .foto-epigrafe { position: absolute; left: 44px; right: 44px; bottom: 56px; font-family: 'Source Serif 4', Georgia, serif; font-style: italic; font-size: 13px; line-height: 1.4; color: var(--gris1); text-align: center; }
   ```
   (Sin filtro de grises: existe la edición a color. El frontispicio conserva su filtro porque es identidad.)
4. `construirCapitulo` recibe `fotos: FotosCapitulo | undefined` y arma:
   ```ts
   const paginasApertura = fotos?.apertura ? construirPaginaFoto({ foto: fotos.apertura, nombreCapitulo, nombreNarrador }) : '';
   const paginasCierre = (fotos?.cierre ?? []).map((foto) => construirPaginaFoto({ foto, nombreCapitulo, nombreNarrador })).join('\n');
   return `${construirAperturaCapitulo({...})}
   ${paginasApertura}
   <section class="fuente-texto antes" ...>${seccion.html}</section>
   ${paginasCierre}`;
   ```
   El paginador embebido inserta las páginas de texto **antes** de cada `.fuente-texto` y deja los `.lienzo` estáticos donde están, así que el orden apertura → foto → texto → fotos de cierre se mantiene en el PDF. Verificar leyendo `crearPagina` (usa `fuente.parentNode.insertBefore(lienzo, fuente)`).
5. `construirHtmlLibro`: nueva firma (ver Interfaces). `const nombreNarrador = datos.nombreNarrador ?? extraerNombreNarrador(titulo);` `const tapa = datos.tapa ?? { titulo: null, subtitulo: null };` Pasar `fotosPorCapitulo?.get(seccion.titulo)` a `construirCapitulo`. Borrar `construirSaludos`, su llamada, `${saludosHtml}` y las reglas CSS `.saludos-*`.
6. Actualizar los llamadores (Step 1) para que compilen: quitar `saludos`.

- [ ] **Step 5: Correr**

Run: `cd fabrica && npm test && npx tsc --noEmit`
Expected: verde. Si `generar-paquete.test.ts` o `previsualizar.test.ts` asertan sobre `saludos` en el HTML, ajustarlos (esa limpieza se completa en Task 6, pero tsc tiene que pasar ya).

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/libro/plantilla-html.ts fabrica/test/plantilla.test.ts fabrica/src/libro/generar-paquete.ts fabrica/src/libro/previsualizar.ts fabrica/src/libro/anticipo.ts
git commit -m "fabrica(plantilla): tapa con titulo y subtitulo de la edicion, paginas de foto por capitulo, fuera los saludos"
```

---

### Task 5: Audiolibro sin bonus de saludos

**Files:**
- Modify: `fabrica/src/audio/audiolibro.ts` (`generarAudiolibro` ~línea 101, `RUTA_BONUS` ~56, bloque `if (saludos.length > 0)` ~129-157)
- Test: `fabrica/test/audiolibro.test.ts`, `fabrica/test/audiolibro-orquestacion.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export async function generarAudiolibro(
    narradorId: string,
    estructura: { capitulos: { nombre: string; ordenes: number[] }[] },
    nombresArchivos: string[]
  ): Promise<{ capitulos: string[]; completo: string }>;
  ```
  El cuarto parámetro `saludos` y la clave `bonus` desaparecen.

- [ ] **Step 1: Ver los tests que nombran saludos/bonus**

`grep -n "saludos\|bonus" fabrica/test/audiolibro*.test.ts`. Los que prueban el bonus se borran; los que pasan `[]` como cuarto argumento dejan de pasarlo.

- [ ] **Step 2: Escribir el test que falla**

En `fabrica/test/audiolibro-orquestacion.test.ts` agregar (con el mismo setup que usan los tests de ese archivo para `generarAudiolibro`):

```ts
  it('el resultado no tiene clave bonus ni sube audiolibro_bonus_saludos.mp3 (los saludos quedaron fuera de la fase 1)', async () => {
    // usar el mismo fixture de estructura/archivos que el test "un mp3 por capítulo + completo" del archivo
    const resultado = await generarAudiolibro('n1', estructura, nombresArchivos);
    expect(Object.keys(resultado).sort()).toEqual(['capitulos', 'completo']);
    const rutasSubidas = uploadMock.mock.calls.map((c) => c[0] as string);
    expect(rutasSubidas.some((r) => r.includes('bonus'))).toBe(false);
  });
```

(Adaptar `uploadMock`, `estructura`, `nombresArchivos` a los nombres reales del archivo.)

- [ ] **Step 3: Correr y ver que falla**

Run: `cd fabrica && npx vitest run test/audiolibro-orquestacion.test.ts`
Expected: FAIL por tipo (falta el 4.º argumento) o porque `Object.keys` incluye algo más.

- [ ] **Step 4: Implementar**

Quitar `RUTA_BONUS`, el parámetro `saludos`, el bloque que arma el bonus, y devolver `{ capitulos, completo }`. Actualizar el comentario de cabecera de `generarAudiolibro` (ya no dice "más el bonus de saludos"). Si el "completo" concatenaba el bonus al final, ahora concatena solo los capítulos.

- [ ] **Step 5: Correr**

Run: `cd fabrica && npm test && npx tsc --noEmit`
Expected: verde (arreglar los llamadores: `generar-paquete.ts` deja de pasar `saludos` — Task 6 termina esa limpieza, pero tsc tiene que pasar acá).

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/audio/audiolibro.ts fabrica/test/audiolibro.test.ts fabrica/test/audiolibro-orquestacion.test.ts fabrica/src/libro/generar-paquete.ts
git commit -m "fabrica(audiolibro): fuera el bonus de saludos"
```

---

### Task 6: `generarPaquete` con la edición, las fotos y `libro.html`

**Files:**
- Modify: `fabrica/src/libro/generar-paquete.ts`
- Test: `fabrica/test/generar-paquete.test.ts`

**Interfaces:**
- Consumes: `leerEdicion`, `aplicarOrdenCapitulos` (Task 2); `cargarFotos` (Task 3); `construirHtmlLibro` con `tapa`, `nombreNarrador`, `fotosPorCapitulo` (Task 4); `generarAudiolibro(narradorId, estructura, nombresArchivos)` (Task 5); `generarEstructura(narradorId): Promise<Estructura>` de `estructura.ts` (ya devuelve la estructura que subió).
- Produces: `generarPaquete(pedido)` sube además `{narrador_id}/paquete/libro.html` (`contentType: 'text/html; charset=utf-8'`, upsert) y nada más cambia hacia afuera. El pedido `entregado` sigue llevando `libro_pdf_path` y `audiolibro_paths` (`{capitulos, completo}`).

- [ ] **Step 1: Ajustar el fake de la DB en el test**

En `construirDbFake` de `generar-paquete.test.ts`: quitar `saludos`; agregar `fotos?: { data: unknown; error: unknown }` → `if (tabla === 'fotos') return construirBuilder(opciones.fotos ?? { data: [], error: null });`. `construirBuilder` ya soporta `.order()`. El `download` fake ya sirve para fotos si `descargas[ruta]` devuelve `{ data: blobFake(bytes), error: null }` (el `blobFake` ya tiene `arrayBuffer`).

Mockear también `generarEstructura`:
```ts
const { generarEstructuraMock } = vi.hoisted(() => ({ generarEstructuraMock: vi.fn() }));
vi.mock('../src/libro/estructura.js', async () => {
  const actual = await vi.importActual<typeof import('../src/libro/estructura.js')>('../src/libro/estructura.js');
  return { ...actual, generarEstructura: generarEstructuraMock };
});
```

- [ ] **Step 2: Escribir los tests que fallan**

Agregar al `describe('generarPaquete')` (reusar los fixtures `narrador`, `preguntasFijas`, `respuestas`, `descargas` del primer test del archivo; el `narrador` fixture suma `edicion`, `familia_id: 'f1'`, `libro_aprobado_at: '2026-09-13T10:00:00Z'`, `ultima_respuesta_at: null`):

```ts
  it('sin nombres.json escribe igual (la dueña puede no haber revisado nombres; a los 30 días se cierra solo)', async () => {
    // mismo setup que el primer test pero SIN la entrada de nombres.json en `descargas`
    // ...
    await generarPaquete({ id: 'p1', narrador_id: 'n1' });
    expect(escribirCapituloMock).toHaveBeenCalled();
    // el último argumento de escribirCapitulo (nombresCorregidos) va vacío
    expect(escribirCapituloMock.mock.calls[0][4]).toBe('');
    expect(pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
  });

  it('aplica ordenCapitulos de la edición: escribe, pagina y graba los capítulos en ese orden', async () => {
    // estructura.json con capítulos ['La infancia', 'El amor']; edicion.ordenCapitulos = ['El amor']
    // ...
    await generarPaquete({ id: 'p1', narrador_id: 'n1' });
    expect(escribirCapituloMock.mock.calls.map((c) => c[1])).toEqual(['El amor', 'La infancia']);
    const estructuraAlAudiolibro = generarAudiolibroMock.mock.calls[0][1];
    expect(estructuraAlAudiolibro.capitulos.map((c: { nombre: string }) => c.nombre)).toEqual(['El amor', 'La infancia']);
    const html = setContentMock.mock.calls[0][0] as string;
    expect(html.indexOf('El amor')).toBeLessThan(html.indexOf('La infancia'));
  });

  it('título, subtítulo y foto de tapa de la edición llegan a la plantilla; la foto de tapa sale de la tabla fotos', async () => {
    // edicion = { titulo: 'Mi abuela Rosa', subtitulo: 'Rosa Pérez', portadaFotoId: 'f9' }
    // fotos = [{ id: 'f9', capitulo: 'La infancia', storage_path: 'n1/fotos/f9.jpg', principal: false, orden: 0, epigrafe: null }]
    // descargas['n1/fotos/f9.jpg'] = { data: blobFake('TAPA'), error: null }
    await generarPaquete({ id: 'p1', narrador_id: 'n1' });
    const html = setContentMock.mock.calls[0][0] as string;
    expect(html).toContain('<div class="portada-nombre-narrador">Mi abuela Rosa</div>');
    expect(html).toContain('<div class="tag">Rosa Pérez</div>');
    expect(html).toContain(`data:image/jpeg;base64,${Buffer.from('TAPA').toString('base64')}`);
  });

  it('portadaFotoId que no existe → frontispicio con narrador.foto_url como siempre', async () => {
    // edicion = { portadaFotoId: 'no-existe' }, narrador.foto_url = 'https://x/foto.jpg', fotos = []
    await generarPaquete({ id: 'p1', narrador_id: 'n1' });
    const html = setContentMock.mock.calls[0][0] as string;
    expect(html).toContain('src="https://x/foto.jpg"');
  });

  it('las fotos de un capítulo entran al HTML', async () => {
    // fotos = [{ id: 'f1', capitulo: 'La infancia', storage_path: 'n1/fotos/f1.jpg', principal: true, orden: 0, epigrafe: 'En el patio' }]
    await generarPaquete({ id: 'p1', narrador_id: 'n1' });
    const html = setContentMock.mock.calls[0][0] as string;
    expect(html).toContain('<div class="foto-epigrafe">En el patio</div>');
  });

  it('sube libro.html además de libro.pdf', async () => {
    await generarPaquete({ id: 'p1', narrador_id: 'n1' });
    const rutas = upload.mock.calls.map((c) => c[0] as string);
    expect(rutas).toContain('n1/paquete/libro.html');
    const llamadaHtml = upload.mock.calls.find((c) => c[0] === 'n1/paquete/libro.html')!;
    expect(llamadaHtml[2]).toMatchObject({ contentType: 'text/html; charset=utf-8', upsert: true });
  });

  it('excluidas y correcciones en la edición no cambian nada', async () => {
    // edicion = { excluidas: ['r1', 'r2'], correcciones: 'cambiá todo' } — mismo setup que el primer test
    await generarPaquete({ id: 'p1', narrador_id: 'n1' });
    // se escriben todos los capítulos con todo el material (mismas llamadas que el primer test)
    expect(escribirCapituloMock).toHaveBeenCalledTimes(/* la cantidad del primer test */ 2);
    const material = escribirCapituloMock.mock.calls[0][2] as string;
    expect(material).not.toContain('cambiá todo');
  });

  it('si falta estructura.json pero el libro está aprobado, la genera ahí mismo en vez de fallar', async () => {
    // descargas sin 'n1/paquete/estructura.json'; generarEstructuraMock devuelve la estructura
    generarEstructuraMock.mockResolvedValue({ titulo: 'Rosa — La historia de una vida', capitulos: [{ nombre: 'La infancia', ordenes: [1] }], entidades: [] });
    await generarPaquete({ id: 'p1', narrador_id: 'n1' });
    expect(generarEstructuraMock).toHaveBeenCalledWith('n1');
    expect(pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
  });

  it('ya no lee la tabla saludos', async () => {
    await generarPaquete({ id: 'p1', narrador_id: 'n1' });
    expect(from).not.toHaveBeenCalledWith('saludos');
  });
```

Completar cada `// ...` con el setup concreto copiado del primer test del archivo (el implementador ve el archivo; el plan fija los asertos).

- [ ] **Step 3: Correr y ver que fallan**

Run: `cd fabrica && npx vitest run test/generar-paquete.test.ts`
Expected: fallan "sin nombres.json" (hoy tira → `fallido`), orden, tapa, fotos, libro.html, estructura faltante, y "ya no lee saludos". Pegar la salida.

- [ ] **Step 4: Implementar en `generar-paquete.ts`**

```ts
import { generarEstructura, type Estructura } from './estructura.js';
import { leerEdicion, aplicarOrdenCapitulos } from './edicion.js';
import { cargarFotos } from './fotos.js';

const RUTA_LIBRO_HTML = (narradorId: string) => `${narradorId}/paquete/libro.html`;
```

Dentro del `try`:

```ts
    // La estructura la arma el tick al ver al narrador completado. Si la
    // dueña cerró el libro antes de ese tick (o el tick falló), no es motivo
    // para dejar el pedido en 'fallido': se arma acá.
    let estructura: Estructura;
    try {
      estructura = await descargarJson<Estructura>(db, RUTA_ESTRUCTURA(narradorId), 'estructura.json');
    } catch {
      estructura = await generarEstructura(narradorId);
    }

    // nombres.json es opcional: la dueña puede no haber revisado nombres
    // (Regla 0 del panel) y a los 30 días el libro se cierra solo.
    const nombresTexto = await descargarTextoOpcional(db, RUTA_NOMBRES(narradorId));
    const nombres: Nombres = nombresTexto ? (JSON.parse(nombresTexto) as Nombres) : { correcciones: [] };

    // ... lectura de narrador, preguntas, respuestas como hoy (sin saludos) ...

    const edicion = leerEdicion(narrador.edicion);
    const capitulosOrdenados = aplicarOrdenCapitulos(estructura.capitulos, edicion.ordenCapitulos);
    const estructuraFinal: Estructura = { ...estructura, capitulos: capitulosOrdenados };
    const fotos = await cargarFotos(db, narradorId);
```

Los pasos 1a/1b iteran `estructuraFinal.capitulos` (el número de borrador `i + 1` sigue al orden final — la edición está congelada, así que un reintento reusa el mismo mapeo). En 1c:

```ts
    const fotoTapa = edicion.portadaFotoId ? fotos.porId.get(edicion.portadaFotoId) : undefined;
    const html = construirHtmlLibro({
      titulo: estructuraFinal.titulo,
      nombreNarrador: narrador.nombre,
      tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
      anioNacimiento: contexto?.anioNacimiento ?? null,
      fotoUrl: fotoTapa?.dataUri ?? narrador.foto_url,
      indice: estructuraFinal.capitulos.map((c) => c.nombre),
      libroMarkdown,
      fotosPorCapitulo: fotos.porCapitulo,
    });
    await subirHtml(db, narradorId, html);
    await generarPdf(db, narradorId, html);
```

con

```ts
async function subirHtml(db: ReturnType<typeof obtenerClienteDb>, narradorId: string, html: string): Promise<void> {
  const { error } = await db.storage.from('audios').upload(RUTA_LIBRO_HTML(narradorId), html, {
    contentType: 'text/html; charset=utf-8',
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir libro.html: ${error.message}`);
}
```

Paso 2: `generarAudiolibro(narradorId, estructuraFinal, nombresArchivos)`. Borrar el tipo `Saludo` y la consulta a `saludos`. Actualizar el comentario de cabecera de `generarPaquete` (sin "bonus de saludos"; decir que solo corre con `libro_aprobado_at`, ver worker). El JSON.parse de nombres: si tira (archivo corrupto), que caiga al `catch` general como hoy — no es un caso a tolerar.

- [ ] **Step 5: Correr**

Run: `cd fabrica && npm test && npx tsc --noEmit`
Expected: verde.

- [ ] **Step 6: Commit**

```bash
git add fabrica/src/libro/generar-paquete.ts fabrica/test/generar-paquete.test.ts
git commit -m "fabrica: generarPaquete aplica la edicion (orden, tapa, fotos), nombres.json opcional, publica libro.html"
```

---

### Task 7: Los mails de hitos y sus branches en el worker

**Files:**
- Create: `fabrica/src/mail/hitos.ts`
- Modify: `fabrica/src/worker.ts` (`tick`, nuevas funciones `avisarTerminados`, `recordarCierres`, `avisarLibrosListos`)
- Test: `fabrica/test/hitos.test.ts` (nuevo), `fabrica/test/worker.test.ts`

**⚠️ Antes de escribir una línea: los textos de abajo son un borrador. Naza los aprueba en el chat, uno por uno. Si cambia alguno, se cambia acá y en el código. No commitear sin ese OK.**

**Interfaces:**
- Produces:
  ```ts
  export type Hito = 'terminado' | 'libro_listo' | 'recordatorio_3' | 'recordatorio_7' | 'recordatorio_14' | 'cierre_automatico';
  export function asuntoHito(hito: Hito, comoLeDicen: string): string;
  export function cuerpoHito(hito: Hito, opciones: { comoLeDicen: string; enlace: string }): string;
  export async function enviarMailHito(opciones: { hito: Hito; para: string; comoLeDicen: string; enlace: string }): Promise<boolean>;
  export const CANDADO_POR_HITO: Record<Hito, string>; // nombre de archivo en {narrador_id}/paquete/
  ```

**Textos (borrador para aprobar):**

| Hito | Asunto | Cuerpo (párrafos) | Botón |
|---|---|---|---|
| `terminado` | `Tu {quien} terminó de contar` | "Tu {quien} respondió la última pregunta. Su historia está completa." / "Ahora te toca a ti: entra, revisa los nombres y lugares que anotamos, elige el orden de los capítulos y la foto de la tapa, y cierra el libro." / "Cuando lo cierres, lo escribimos con sus palabras y te avisamos." | `Cerrar el libro` |
| `recordatorio_3` | `El libro de tu {quien} espera que lo cierres` | "Hace tres días que tu {quien} terminó de contar. El libro no se escribe hasta que lo cierres." / "Son cinco minutos: revisar nombres, elegir el orden de los capítulos y la foto de la tapa." | `Cerrar el libro` |
| `recordatorio_7` | `Una semana sin cerrar el libro de tu {quien}` | "Pasó una semana desde que tu {quien} terminó. Su libro sigue esperándote." / "Si no tienes nada que cambiar, entra y ciérralo tal como te lo proponemos: queda perfecto igual." | `Cerrar el libro` |
| `recordatorio_14` | `Todavía no cerraste el libro de tu {quien}` | "Hace dos semanas que la historia de tu {quien} está completa y sin cerrar." / "Si en dos semanas más no lo cierras, lo cerramos nosotros con nuestra propuesta y lo escribimos igual — está en los términos, para que ningún libro quede sin hacer." | `Cerrar el libro` |
| `cierre_automatico` | `Cerramos el libro de tu {quien} por ti` | "Pasaron treinta días desde que tu {quien} terminó de contar y el libro seguía abierto, así que lo cerramos nosotros con la propuesta que te habíamos hecho." / "Ya lo estamos escribiendo con sus palabras. Cuando esté, te avisamos." | `Ver el libro` |
| `libro_listo` | `El libro de tu {quien} está listo` | "Ya está. El libro de tu {quien}, escrito con sus palabras, y el audiolibro con su voz." / "Queda ahí para siempre. Entra cuando quieras a leerlo, escucharlo o descargarlo." | `Leer el libro` |

Pie en todos: "En cada familia hay un libro sin escribir." (el mismo del anticipo). Mismo HTML de tabla que `cuerpoAnticipo`; `{quien}` es `como_le_dicen` escapado.

- [ ] **Step 1: Tests de `hitos.ts`**

`fabrica/test/hitos.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asuntoHito, cuerpoHito, enviarMailHito, CANDADO_POR_HITO, type Hito } from '../src/mail/hitos.js';

const HITOS: Hito[] = ['terminado', 'libro_listo', 'recordatorio_3', 'recordatorio_7', 'recordatorio_14', 'cierre_automatico'];

describe('asuntoHito / cuerpoHito', () => {
  it('cada hito tiene asunto con el como_le_dicen y cuerpo con el enlace', () => {
    for (const hito of HITOS) {
      expect(asuntoHito(hito, 'papá')).toContain('papá');
      const cuerpo = cuerpoHito(hito, { comoLeDicen: 'papá', enlace: 'https://x/tablero/n1' });
      expect(cuerpo).toContain('https://x/tablero/n1');
      expect(cuerpo).toContain('En cada familia hay un libro sin escribir.');
    }
  });

  it('escapa el como_le_dicen', () => {
    expect(cuerpoHito('terminado', { comoLeDicen: '<b>', enlace: 'https://x' })).toContain('&lt;b&gt;');
    expect(cuerpoHito('terminado', { comoLeDicen: '<b>', enlace: 'https://x' })).not.toContain('<b>');
  });

  it('cada hito tiene su candado, todos distintos', () => {
    expect(new Set(Object.values(CANDADO_POR_HITO)).size).toBe(HITOS.length);
    expect(CANDADO_POR_HITO.recordatorio_7).toBe('recordatorio_cierre_7.txt');
    expect(CANDADO_POR_HITO.libro_listo).toBe('libro_listo_enviado.txt');
  });
});

describe('enviarMailHito', () => {
  const fetchOriginal = globalThis.fetch;
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
    process.env.ANTHROPIC_API_KEY = 'k';
    process.env.OPENAI_API_KEY = 'k';
  });
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    delete process.env.RESEND_API_KEY;
  });

  it('sin RESEND_API_KEY devuelve false y no llama a fetch', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as never;
    const ok = await enviarMailHito({ hito: 'libro_listo', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' });
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con clave, POSTea a Resend con el asunto del hito y devuelve true', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as never;
    const ok = await enviarMailHito({ hito: 'recordatorio_3', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' });
    expect(ok).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['a@b.c']);
    expect(body.subject).toBe(asuntoHito('recordatorio_3', 'papá'));
  });

  it('si Resend rechaza, tira', async () => {
    process.env.RESEND_API_KEY = 're_test';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'nope' }) as never;
    await expect(enviarMailHito({ hito: 'terminado', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' })).rejects.toThrow('422');
  });
});
```

(`cargarConfig` lee `process.env` en cada llamada — confirmar en `config.ts`; sí, no cachea.)

- [ ] **Step 2: Correr y ver que falla**

Run: `cd fabrica && npx vitest run test/hitos.test.ts` → FAIL, módulo inexistente.

- [ ] **Step 3: Implementar `hitos.ts`**

Estructura: un `Record<Hito, { asunto: (quien) => string; parrafos: (quien) => string[]; boton: string }>` con los textos aprobados; `cuerpoHito` arma el mismo HTML de tabla que `cuerpoAnticipo` (copiar la envoltura, no importar — son textos distintos y cada uno se aprueba solo) con un `<tr>` por párrafo, el botón con el enlace y el pie. `enviarMailHito` es un calco de `enviarMailAnticipo` con `subject: asuntoHito(...)` y `html: cuerpoHito(...)`. Cabecera del archivo: "Textos aprobados por Naza el 2026-09-13" (solo cuando lo haya hecho). `CANDADO_POR_HITO = { terminado: 'terminado_enviado.txt', libro_listo: 'libro_listo_enviado.txt', recordatorio_3: 'recordatorio_cierre_3.txt', recordatorio_7: 'recordatorio_cierre_7.txt', recordatorio_14: 'recordatorio_cierre_14.txt', cierre_automatico: 'cierre_automatico_enviado.txt' }`.

- [ ] **Step 4: Tests del worker**

En `worker.test.ts`, mockear `../src/mail/hitos.js` (`enviarMailHitoMock` con `vi.hoisted`, default `mockResolvedValue(true)`; exportar también `CANDADO_POR_HITO` real vía `importActual`). Ampliar `construirClienteDbMock` para que `narradores` acepte filas con `como_le_dicen, familia_id, ultima_respuesta_at, libro_aprobado_at`, que `familias` devuelva `{ email }` (`select().eq().single()`), que `pedidos.select().eq('estado','entregado')` devuelva `opciones.pedidosEntregados ?? []`, que `narradores.update({libro_aprobado_at}).eq('id').is('libro_aprobado_at', null).select('id')` devuelva `{ data: [{ id }], error: null }` (registrar la llamada en `opciones.cierresAutomaticos: string[]`), y que `storage.upload` registre en `archivosPorNarrador` el nombre subido (así un candado subido en el tick aparece en el `list` siguiente). Usar `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-09-20T12:00:00Z'))` en los tests de recordatorios.

```ts
describe('tick — mails de hitos', () => {
  it('narrador completado sin terminado_enviado.txt → manda "terminado" y deja el candado', async () => {
    // narradores: [{ id: 'n1', estado: 'completado', como_le_dicen: 'papá', familia_id: 'f1', ultima_respuesta_at: '2026-09-19T00:00:00Z', libro_aprobado_at: null }]
    // familias: { f1: 'a@b.c' }
    await tick();
    expect(enviarMailHitoMock).toHaveBeenCalledWith(expect.objectContaining({ hito: 'terminado', para: 'a@b.c', comoLeDicen: 'papá', enlace: expect.stringContaining('/tablero/n1') }));
    expect(db.subidos['n1']).toContain('terminado_enviado.txt');
  });

  it('con terminado_enviado.txt ya presente, no lo manda de nuevo', async () => { /* archivosPorNarrador: { n1: ['terminado_enviado.txt'] } */ });

  it('si enviarMailHito devuelve false (sin clave), no deja candado', async () => { /* mockResolvedValueOnce(false) → subidos sin candado */ });

  it('a los 3 días sin libro_aprobado_at manda recordatorio_3; a los 2, nada', async () => {
    // ultima_respuesta_at = 2026-09-17T12:00:00Z (3 días exactos) → recordatorio_3
    // ultima_respuesta_at = 2026-09-18T13:00:00Z (< 3 días) → ningún recordatorio
  });

  it('a los 9 días con ninguno mandado, manda SOLO recordatorio_7 y marca también el candado del 3', async () => {
    // ultima_respuesta_at = 2026-09-11T00:00:00Z; archivos: ['terminado_enviado.txt']
    // esperado: una sola llamada con hito 'recordatorio_7'; subidos incluye recordatorio_cierre_3.txt y recordatorio_cierre_7.txt
  });

  it('con libro_aprobado_at puesto, no manda recordatorios aunque hayan pasado 10 días', async () => {});

  it('a los 30 días sin cierre: pone libro_aprobado_at, manda cierre_automatico y deja candado', async () => {
    // ultima_respuesta_at = 2026-08-20T00:00:00Z
    // esperado: db.cierresAutomaticos = ['n1']; hito 'cierre_automatico'; candado cierre_automatico_enviado.txt; NO se manda recordatorio_14
  });

  it('pedido entregado sin libro_listo_enviado.txt → manda "libro_listo" y deja candado; con candado no repite', async () => {
    // pedidosEntregados: [{ id: 'p1', narrador_id: 'n1' }]; narradores incluye n1 con familia f1
  });

  it('un narrador cuya familia no se puede leer no frena a los demás', async () => {});
});
```

Escribir cada test completo (el bloque de arriba fija los datos y los asertos; el implementador arma el fixture con el helper).

- [ ] **Step 5: Correr y ver que fallan**

Run: `cd fabrica && npx vitest run test/worker.test.ts` → los nuevos fallan (no existen los branches).

- [ ] **Step 6: Implementar en `worker.ts`**

```ts
import { enviarMailHito, CANDADO_POR_HITO, type Hito } from './mail/hitos.js';

const ESTADOS_TERMINADO = ['completado', 'cerrado_anticipado'];
const DIAS_RECORDATORIO = [3, 7, 14] as const;
const DIAS_CIERRE_AUTOMATICO = 30;
const MS_POR_DIA = 24 * 60 * 60 * 1000;
```

`tick()` suma, después de `generarPrevisualizacionesFaltantes()`: `await avisarHitosDeCierre(); await procesarPedidosPagados(); await avisarLibrosListos();`.

```ts
/**
 * Los mails que acompañan el cierre del libro (spec §9 y §6 del diseño):
 * "terminó" cuando el narrador pasa a completado, recordatorios a los 3, 7 y
 * 14 días sin Cerrar libro, y a los 30 el cierre automático con la
 * propuesta (la fábrica pone `libro_aprobado_at` ella misma — es el único
 * caso en que lo escribe alguien que no es la web, ver CONTRATO.md).
 * Un candado por mail en Storage; se deja SOLO si Resend confirmó.
 * Si la fábrica estuvo caída y pasaron varios hitos, se manda una sola vez
 * el más reciente y se marcan los anteriores.
 */
async function avisarHitosDeCierre(): Promise<void> {
  const db = obtenerClienteDb();
  const { urlBase } = cargarConfig();
  const { data: narradores, error } = await db
    .from('narradores')
    .select('id, como_le_dicen, familia_id, ultima_respuesta_at, libro_aprobado_at')
    .in('estado', ESTADOS_TERMINADO);
  if (error) { console.error('tick: no se pudieron leer los narradores terminados:', error.message); return; }

  for (const narrador of (narradores ?? []) as NarradorTerminado[]) {
    try {
      const archivos = await listarPaquete(db, narrador.id);
      const enlace = `${urlBase}/tablero/${narrador.id}`;
      const mandar = (hito: Hito) => mandarHito(db, narrador, hito, enlace, archivos);

      if (!archivos.has(CANDADO_POR_HITO.terminado)) await mandar('terminado');

      if (narrador.libro_aprobado_at !== null || !narrador.ultima_respuesta_at) continue;
      const dias = Math.floor((Date.now() - new Date(narrador.ultima_respuesta_at).getTime()) / MS_POR_DIA);

      if (dias >= DIAS_CIERRE_AUTOMATICO) {
        if (archivos.has(CANDADO_POR_HITO.cierre_automatico)) continue;
        const { data: cerrado, error: errorCierre } = await db
          .from('narradores')
          .update({ libro_aprobado_at: new Date().toISOString() })
          .eq('id', narrador.id)
          .is('libro_aprobado_at', null)
          .select('id');
        if (errorCierre) throw new Error(`no se pudo cerrar solo: ${errorCierre.message}`);
        if (!cerrado || (cerrado as unknown[]).length !== 1) continue; // lo cerró la web en el medio
        await mandar('cierre_automatico');
        continue;
      }

      const vencidos = DIAS_RECORDATORIO.filter((d) => dias >= d);
      if (vencidos.length === 0) continue;
      const mayor = vencidos[vencidos.length - 1];
      const hitoMayor = `recordatorio_${mayor}` as Hito;
      if (archivos.has(CANDADO_POR_HITO[hitoMayor])) continue;
      const enviado = await mandar(hitoMayor);
      if (enviado) {
        for (const d of vencidos.slice(0, -1)) {
          const candado = CANDADO_POR_HITO[`recordatorio_${d}` as Hito];
          if (!archivos.has(candado)) await subirTexto(db, `${narrador.id}/paquete/${candado}`, 'ok');
        }
      }
    } catch (err) {
      console.error(`tick: fallaron los mails de cierre de ${narrador.id}:`, err);
    }
  }
}
```

Helpers: `listarPaquete(db, narradorId): Promise<Set<string>>` (el `.list(`${id}/paquete`)` que ya se repite tres veces en el archivo — extraerlo y usarlo también en los branches existentes); `mandarHito(db, narrador, hito, enlace, archivos)` lee `familias.email` por `familia_id`, llama `enviarMailHito`, y si devuelve `true` sube el candado `subirTexto(db, `${id}/paquete/${CANDADO_POR_HITO[hito]}`, 'ok')` y lo agrega al Set; devuelve el boolean. `avisarLibrosListos()`: `pedidos.select('id, narrador_id').eq('estado','entregado')` → por narrador (dedupe con un Set) → si no tiene `libro_listo_enviado.txt` → leer `narradores.select('id, como_le_dicen, familia_id').eq('id').single()` → `mandarHito(..., 'libro_listo', ...)`. `subirTexto` sube con `contentType: 'text/markdown'` — está bien para un candado (el del anticipo ya se sube así; verificar en `avisarDelAnticipo` y usar el mismo helper).

- [ ] **Step 7: Correr**

Run: `cd fabrica && npm test && npx tsc --noEmit` → verde.

- [ ] **Step 8: Pedir el OK de los textos a Naza (si no se hizo antes) y commitear**

```bash
git add fabrica/src/mail/hitos.ts fabrica/src/worker.ts fabrica/test/hitos.test.ts fabrica/test/worker.test.ts
git commit -m "fabrica: mails de cierre — termino, recordatorios 3/7/14, cierre automatico a los 30 y libro listo"
```

---

### Task 8: El lector online en la web

**Files:**
- Create: `web/src/app/api/descarga/libro-html/route.ts`
- Modify: `web/src/app/tablero/[narradorId]/descarga/page.tsx` (componente `Entregado` y el gate de acceso)
- Test: `web/test/descarga-libro-html.test.ts` (nuevo; mirar cómo testean rutas API los tests existentes en `web/test/`, p. ej. el del webhook o de `api/compra`, y copiar el patrón de mocks de `@/lib/supabase/*` y `@/lib/panel`)

**Interfaces:**
- Consumes: `narradorDeLaSesion(sesion, admin, searchParams, { mensajeError, soloDuena })` de `@/lib/panel` (igual que `api/descarga/libro/route.ts`, pero **sin** `soloDuena`: los invitados leen, no bajan — spec §5). `historiaAccesible` y `PUEDE` de `@/lib/panel` (leer `PUEDE` para saber el nombre del permiso de "ver"; si no hay uno, `historia !== null` alcanza).
- Produces: `GET /api/descarga/libro-html?narrador={id}` → 302 a la URL firmada de `{id}/paquete/libro.html` si el último pedido está `entregado`; 404 si no.

- [ ] **Step 1: Test de la ruta**

Copiar el patrón del test de `api/descarga/libro` si existe (`grep -rln "descarga/libro" web/test`); si no existe, usar el patrón de mocks del test más parecido de `web/test/` (buscar `vi.mock("@/lib/panel"`). Casos:

```ts
it('pedido entregado → 302 a la url firmada de libro.html', ...)   // createSignedUrl llamado con 'n1/paquete/libro.html'
it('pedido no entregado → 404', ...)
it('un invitado (no dueña) también recibe el 302', ...)            // narradorDeLaSesion mockeado sin soloDuena devuelve ok
```

- [ ] **Step 2: Correr y ver que falla** — módulo inexistente.

- [ ] **Step 3: Implementar la ruta**

Calco de `api/descarga/libro/route.ts` con: sin `soloDuena`, el path fijo `` `${narrador.id}/paquete/libro.html` `` (no depende de una columna del pedido), mensaje 404 `"El libro todavía no está listo."`.

- [ ] **Step 4: El lector en la página**

En `descarga/page.tsx`:
- El gate: hoy `if (!historia || !PUEDE.descargar(historia.rol)) notFound();`. Pasar a: `if (!historia) notFound();` y `const puedeDescargar = PUEDE.descargar(historia.rol);`. Pasar `puedeDescargar` a `Entregado`. Los estados previos (`SinPedido`, `PagoIncompleto`, `EnFabricacion`, `Fallido`) siguen igual para cualquiera con acceso.
- En `Entregado`, arriba de los botones de descarga:
  ```tsx
  <div className="mt-8">
    <p className="mb-2 text-sm font-medium text-zinc-700">Leer el libro</p>
    <iframe
      title={`El libro de ${comoLeDicen}`}
      src={`/api/descarga/libro-html?narrador=${narradorId}`}
      sandbox="allow-scripts"
      className="h-[80vh] w-full rounded-lg border border-zinc-200 bg-white"
    />
  </div>
  ```
  (`allow-scripts` porque el HTML pagina con su propio script; sin `allow-same-origin` el iframe no toca cookies ni la página.) Los botones "Descargar el libro (PDF)" y los `<a>Descargar</a>` de audio se muestran solo si `puedeDescargar`; los `<audio controls>` por capítulo se muestran siempre (§5: "con el audio de cada uno").
- Ajustar el comentario "Descargar es de la dueña; el invitado ve el libro pero no lo baja".
- Si hay un test de la página en `web/test/` que asertaba el 404 para invitado, cambiarlo: invitado ve la página, no ve los links de descarga.

- [ ] **Step 5: Correr**

Run: `cd web && npm test && npx tsc --noEmit` → verde. Después `npm run lint` si existe.

- [ ] **Step 6: Probar en el navegador** (verificación real, no opcional)

`preview_start` con `vitacora-web` (`.claude/launch.json`), entrar como la familia de Osvaldo (completado; su pedido no está `entregado` con `libro.html` todavía, así que el iframe va a dar 404 — eso es correcto). Si hay un `libro.html` de prueba, subirlo a `d55d75b8-…/paquete/libro.html` en Storage con la service role y verificar que el iframe lo muestre paginado. Captura en el reporte.

- [ ] **Step 7: Commit**

```bash
git add web/src/app/api/descarga/libro-html/route.ts "web/src/app/tablero/[narradorId]/descarga/page.tsx" web/test/descarga-libro-html.test.ts
git commit -m "web: el lector online — libro.html en la pagina de descarga, invitados leen sin bajar"
```

---

### Task 9: Contrato, roadmap y spec de Joaquín al día

**Files:**
- Modify: `supabase/CONTRATO.md`, `docs/ROADMAP.md` (frente 3ter), `docs/panel-usuario.md` (§12)

- [ ] **Step 1: `CONTRATO.md`**
  - Fila `narradores`: en "quién escribe" agregar `fábrica (solo libro_aprobado_at, a los 30 días sin cierre)`.
  - Fila `fotos`: "la fábrica lee" ya está; agregar "embebidas como data URI en libro.html".
  - Sección "Cerrar el libro": reemplazar "Si pasan 30 días desde completado sin cierre, la web lo cierra" por "…**la fábrica** lo cierra (pone `libro_aprobado_at`, manda el aviso) y lo produce en el mismo tick". Agregar: "La fábrica aplica `ordenCapitulos`, `titulo`, `subtitulo` y `portadaFotoId`; **ignora `excluidas` y `correcciones`** (decisión 13/09, ver `docs/superpowers/specs/2026-09-13-fabrica-aprobacion-design.md`)."
  - Listado de Storage: agregar `libro.html`, y los seis candados de mails junto a `anticipo_enviado.txt`.
  - Fila `saludos`: agregar "la fábrica tampoco la lee desde el 13/09".
- [ ] **Step 2: `ROADMAP.md`**: 3t.8, 3t.9 y 3t.11 → ✅ 13/09 con una línea de qué quedó (3t.9: "los 5 de la fábrica; los del entrevistador siguen en 3t.10").
- [ ] **Step 3: `panel-usuario.md` §12**: una nota al principio: "Construido el 13/09 según `docs/superpowers/specs/2026-09-13-fabrica-aprobacion-design.md`, que difiere en dos puntos: (1) antes de cerrar no hay libro escrito, el lector muestra la propuesta; (2) `excluidas` y `correcciones` no se aplican." Y en §7.2 paso 4, al lado de "Ve el libro completo": "⚠️ ver nota en §12".
- [ ] **Step 4: Commit**

```bash
git add supabase/CONTRATO.md docs/ROADMAP.md docs/panel-usuario.md
git commit -m "docs: contrato y roadmap al dia con la fabrica tras el panel — libro_aprobado_at, libro.html, mails de cierre"
```

---

## Cierre de la rama

Después de la Task 9: revisión de la rama completa (`superpowers:requesting-code-review` con un agente que **corra** `npm test` en `fabrica/` y `web/`, y lea el diff completo `git diff main...fabrica-aprobacion`), arreglar lo que salga, y PR `fabrica-aprobacion` → `main` con el resumen de las decisiones de producto y la lista "para conversar con Joaquín" del spec §11. Como toca `CONTRATO.md`, lo mergea Joaquín.
