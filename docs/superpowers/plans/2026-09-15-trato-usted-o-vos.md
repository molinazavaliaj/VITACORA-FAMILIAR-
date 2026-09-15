# El trato del entrevistador (usted o vos) — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el entrevistador decida una sola vez, mirando la ficha del narrador, si le habla de usted o de vos — y que esa decisión mande en los cinco prompts vivos y en los tres textos fijos que el narrador lee.

**Architecture:** Un módulo nuevo (`src/ia/trato.ts`) decide y guarda el valor en `narradores.contexto.trato` (jsonb, sin migración). Todo lo que le escribe al narrador le pide el trato a ese módulo y arma su texto con él. Los dos textos que hoy viven copiados a mano en dos archivos se unifican en `src/manual/puro.ts`, que no depende de nada.

**Tech Stack:** Node 22 + TypeScript (ESM, imports con `.js`), vitest, SDK de Anthropic, Supabase.

**Spec:** `docs/superpowers/specs/2026-09-15-trato-usted-o-vos-design.md` — leerlo antes de empezar.

## Global Constraints

- **Castellano rioplatense:** identificadores y nombres de archivo **sin tildes**; el texto que lee una persona, **con las tildes bien puestas**.
- **Los textos del §4 del spec son ley:** se escriben verbatim y los tests los asertan verbatim. Nada de `expect(x).not.toContain('frase vieja')` — ese test no puede volver a fallar nunca.
- **Cada test nuevo tiene que fallar en rojo contra el código viejo.** Correrlo, ver el rojo, y pegar esa salida en el reporte. No se declara nada verificado sin haber corrido el comando.
- **Dos valores y nada más:** `'usted'` y `'vos'`. No existe `'tu'`.
- **Ante la duda, `'usted'`:** toda ruta de error, respuesta rara o dato faltante cae en usted.
- Los tests corren con `npm test` desde `entrevistador/`. Un test solo: `npx vitest run test/archivo.test.ts -t "nombre"`.
- El repo es CRLF. No reformatear archivos enteros: tocar solo las líneas del plan.
- **No tocar `src/ia/cerebro.ts:68` (`generarReconocimiento`)**: quedó sin uso en producción el 2026-09-14 y no entra en este trabajo.

---

### Task 1: El módulo que decide el trato

**Files:**
- Create: `entrevistador/src/ia/trato.ts`
- Create: `entrevistador/test/trato.test.ts`
- Modify: `entrevistador/scripts/manual.ts:578-628` (la función `crear`, para el flag `--trato`)

**Interfaces:**
- Consumes: `fichaEnTexto` de `src/ia/ficha.js`, `db` de `src/db/cliente.js`, `cargarConfig` de `src/config.js`.
- Produces:
  - `export type Trato = 'usted' | 'vos'`
  - `export function esTrato(valor: unknown): valor is Trato`
  - `export function fichaTieneDatos(contexto: Record<string, any>): boolean`
  - `export const PROMPT_TRATO: (ficha: string) => string`
  - `export type NarradorParaTrato = { id: string; como_le_dicen: string; contexto: Record<string, any> }`
  - `export async function tratoDe(n: NarradorParaTrato): Promise<Trato>`

- [ ] **Step 1: Escribir el test que falla**

Crear `entrevistador/test/trato.test.ts`. Los `stubEnv` y el molde de los mocks salen de `test/personalizar.test.ts` — seguir ese patrón, no inventar otro.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// trato.ts importa config (al importarse lee process.env), el SDK y la base.
vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'clave');
vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

const mocks = vi.hoisted(() => ({
  crear: vi.fn(),
  updates: [] as { tabla: string; p: any }[],
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: mocks.crear }; },
}));

vi.mock('../src/db/cliente.js', () => {
  const cadena = (tabla: string) => {
    const q: any = {
      select: () => q,
      eq: () => q,
      maybeSingle: () => q,
      update: (p: any) => { mocks.updates.push({ tabla, p }); return q; },
      then: (resolver: any) => Promise.resolve({ data: null, error: null }).then(resolver),
    };
    return q;
  };
  return { db: { from: (tabla: string) => cadena(tabla) } };
});

const { tratoDe, fichaTieneDatos, esTrato, PROMPT_TRATO } = await import('../src/ia/trato.js');

const dijo = (texto: string) => ({ content: [{ type: 'text', text: texto }] });
const narrador = (contexto: Record<string, any>) =>
  ({ id: 'n1', como_le_dicen: 'Ciro', contexto });

beforeEach(() => {
  mocks.crear.mockReset();
  mocks.updates.length = 0;
});

describe('fichaTieneDatos', () => {
  it('una ficha vacía no tiene con qué decidir', () => {
    expect(fichaTieneDatos({})).toBe(false);
    expect(fichaTieneDatos({ arbol: {} })).toBe(false);
    expect(fichaTieneDatos({ arbol: { padres: '   ' } })).toBe(false);
    // preguntasEnviadas y modoRapido no son ficha: son mecánica del entrevistador
    expect(fichaTieneDatos({ modoRapido: true, preguntasEnviadas: { 1: 'hola' } })).toBe(false);
  });

  it('alcanza con un solo dato de la ficha', () => {
    expect(fichaTieneDatos({ anioNacimiento: 1998 })).toBe(true);
    expect(fichaTieneDatos({ lugarNacimiento: 'Concordia' })).toBe(true);
    expect(fichaTieneDatos({ oficio: 'mecánico' })).toBe(true);
    expect(fichaTieneDatos({ datosExtra: 'algo' })).toBe(true);
    expect(fichaTieneDatos({ vinculoComprador: 'nieto' })).toBe(true);
    expect(fichaTieneDatos({ arbol: { padres: 'Sandra y Aldo' } })).toBe(true);
  });
});

describe('esTrato', () => {
  it('solo usted y vos', () => {
    expect(esTrato('usted')).toBe(true);
    expect(esTrato('vos')).toBe(true);
    expect(esTrato('tu')).toBe(false);
    expect(esTrato(undefined)).toBe(false);
  });
});

describe('tratoDe', () => {
  it('con la ficha vacía va usted y NO le pregunta al modelo', async () => {
    const n = narrador({});
    expect(await tratoDe(n)).toBe('usted');
    expect(mocks.crear).not.toHaveBeenCalled();
    // Tampoco lo guarda: si mañana la familia completa la ficha, se decide ahí.
    expect(mocks.updates).toHaveLength(0);
  });

  it('con ficha le pregunta una vez al modelo y guarda lo que eligió', async () => {
    mocks.crear.mockResolvedValue(dijo('vos'));
    const n = narrador({ anioNacimiento: 1998 });
    expect(await tratoDe(n)).toBe('vos');
    expect(mocks.crear).toHaveBeenCalledTimes(1);
    expect(mocks.updates).toEqual([
      { tabla: 'narradores', p: { contexto: { anioNacimiento: 1998, trato: 'vos' } } },
    ]);
  });

  it('la ficha del narrador entra en el prompt', async () => {
    mocks.crear.mockResolvedValue(dijo('vos'));
    await tratoDe(narrador({ anioNacimiento: 1998, lugarNacimiento: 'Concordia' }));
    const prompt = mocks.crear.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain('Concordia');
    expect(prompt).toContain('1998');
  });

  it('una vez decidido no vuelve a preguntar nunca', async () => {
    const n = narrador({ anioNacimiento: 1998, trato: 'vos' });
    expect(await tratoDe(n)).toBe('vos');
    expect(mocks.crear).not.toHaveBeenCalled();
    expect(mocks.updates).toHaveLength(0);
  });

  it('deja el trato en el objeto que ya tiene en la mano quien lo llamó', async () => {
    // Si no, recordarEnviada() de personalizar.ts pisa el contexto entero con su
    // copia vieja y borra el trato recién guardado.
    mocks.crear.mockResolvedValue(dijo('vos'));
    const n = narrador({ anioNacimiento: 1998 });
    const contextoDeOtro = n.contexto;
    await tratoDe(n);
    expect(contextoDeOtro.trato).toBe('vos');
  });

  it('si el modelo contesta cualquier otra cosa, usted', async () => {
    mocks.crear.mockResolvedValue(dijo('depende del caso'));
    expect(await tratoDe(narrador({ anioNacimiento: 1998 }))).toBe('usted');
  });

  it('tolera puntuación y mayúsculas en la respuesta', async () => {
    mocks.crear.mockResolvedValue(dijo('Vos.'));
    expect(await tratoDe(narrador({ anioNacimiento: 1998 }))).toBe('vos');
  });

  it('si la llamada falla NO guarda nada: se reintenta la próxima vez', async () => {
    mocks.crear.mockRejectedValue(new Error('timeout'));
    expect(await tratoDe(narrador({ anioNacimiento: 1998 }))).toBe('usted');
    expect(mocks.updates).toHaveLength(0);
  });

  it('un trato guardado que no es ni usted ni vos se ignora y se vuelve a decidir', async () => {
    mocks.crear.mockResolvedValue(dijo('vos'));
    expect(await tratoDe(narrador({ anioNacimiento: 1998, trato: 'tu' }))).toBe('vos');
    expect(mocks.crear).toHaveBeenCalledTimes(1);
  });

  it('el prompt pide una sola palabra y deja el default escrito', () => {
    expect(PROMPT_TRATO('El narrador es Ciro.')).toContain('Respondé SOLO con una palabra: usted o vos.');
    expect(PROMPT_TRATO('El narrador es Ciro.')).toContain('Ante la duda, usted');
  });
});
```

- [ ] **Step 2: Correrlo y verificar que falla**

Run: `npx vitest run test/trato.test.ts`
Expected: FAIL — `Cannot find module '../src/ia/trato.js'`. **Pegar esta salida en el reporte.**

- [ ] **Step 3: Escribir `src/ia/trato.ts`**

```ts
/**
 * El trato del entrevistador: ¿le habla de usted o de vos?
 *
 * Hasta el 2026-09-15 estaba clavado en el prompt ("Tratalo de usted"), de
 * cuando el narrador era siempre un abuelo. Con el primer narrador de 28 años
 * la pregunta 1 salió "cuénteme... si cierra los ojos", que suena a formulario.
 *
 * Se decide UNA sola vez por narrador, con la ficha que cargó la familia, y
 * queda guardado en `contexto.trato`. No se vuelve a pensar: un narrador que
 * recibe "vos" el lunes y "usted" el martes es peor que uno tratado siempre
 * de usted.
 *
 * Ante cualquier duda —ficha vacía, la API se cayó, el modelo contestó
 * cualquier cosa— gana `usted`: con un desconocido el usted nunca ofende.
 */
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { fichaEnTexto } from './ficha.js';

export type Trato = 'usted' | 'vos';

/** Una decisión de una palabra: el modelo más chico alcanza y de sobra. */
const MODELO = 'claude-haiku-4-5';
const MAX_TOKENS = 10;

export type NarradorParaTrato = {
  id: string;
  como_le_dicen: string;
  contexto: Record<string, any>;
};

export function esTrato(valor: unknown): valor is Trato {
  return valor === 'usted' || valor === 'vos';
}

/**
 * ¿Hay algo en la ficha con qué decidir?
 *
 * Importa más de lo que parece: hoy el checkout no pide un solo dato de la
 * ficha, así que un cliente real llega con el contexto lleno de mecánica
 * (`modoRapido`, `preguntasEnviadas`) y cero datos de la persona. Preguntarle
 * al modelo con eso es pagar una llamada para que adivine.
 */
export function fichaTieneDatos(contexto: Record<string, any> = {}): boolean {
  const c = contexto ?? {};
  const arbol = c.arbol;
  const hayArbol =
    typeof arbol === 'object' && arbol !== null &&
    Object.values(arbol).some((v) => typeof v === 'string' && v.trim() !== '');
  return Boolean(
    c.anioNacimiento || c.lugarNacimiento || c.oficio || c.datosExtra || c.vinculoComprador || hayArbol,
  );
}

export const PROMPT_TRATO = (ficha: string) => `Sos el biógrafo que le va a escribir todos los días por WhatsApp a esta persona, durante un mes, para escribir el libro de su vida.

QUIÉN ES:
${ficha}

¿Le hablás de usted o de vos? Pensalo como lo pensaría alguien con calle: la edad que tiene, de dónde es, quién lo mandó a entrevistar. Ante la duda, usted: con un desconocido el usted nunca ofende, el vos sí puede.

Respondé SOLO con una palabra: usted o vos.`;

let _cliente: Anthropic | null = null;
const cliente = () => (_cliente ??= new Anthropic({ apiKey: cargarConfig().anthropicKey }));

/** null = no se pudo decidir (y entonces no se guarda nada: se reintenta después). */
async function decidir(n: NarradorParaTrato): Promise<Trato | null> {
  if (!fichaTieneDatos(n.contexto)) return null;
  try {
    const respuesta = await cliente().messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: PROMPT_TRATO(fichaEnTexto(n.contexto, n.como_le_dicen)) }],
    });
    const bloque = respuesta.content.find((b) => b.type === 'text');
    const palabra = bloque && bloque.type === 'text'
      ? bloque.text.trim().toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')
      : '';
    return esTrato(palabra) ? palabra : 'usted';
  } catch (err) {
    console.warn(`trato: no pude decidir el de ${n.id}, va usted:`, err);
    return null;
  }
}

/**
 * El trato de este narrador. Lo decide la primera vez y lo guarda; de ahí en
 * más devuelve lo guardado sin pensar ni pagar.
 */
export async function tratoDe(n: NarradorParaTrato): Promise<Trato> {
  if (esTrato(n.contexto?.trato)) return n.contexto.trato;

  const elegido = await decidir(n);
  if (!elegido) return 'usted';

  // Se muta el MISMO objeto (no se reemplaza): `recordarEnviada` de
  // personalizar.ts guarda `{ ...n.contexto, preguntasEnviadas }` con la copia
  // que tiene en la mano, y si el trato no está ahí adentro lo borra de la base.
  n.contexto ??= {};
  n.contexto.trato = elegido;
  const { error } = await db.from('narradores').update({ contexto: n.contexto }).eq('id', n.id);
  if (error) console.error(`trato: no pude guardar el de ${n.id}:`, error.message);
  return elegido;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run test/trato.test.ts`
Expected: PASS, todos.

- [ ] **Step 5: El escape a mano en el CLI**

En `entrevistador/scripts/manual.ts`, dentro de `crear()`, después de la línea `if (!flags['no-rapido']) contexto.modoRapido = true;`:

```ts
  // El escape a mano de los pilotos: Naza conoce al narrador mejor que su ficha.
  const trato = flag('trato');
  if (trato === 'usted' || trato === 'vos') contexto.trato = trato;
  else if (trato) throw new Error(`--trato acepta 'usted' o 'vos', no «${trato}».`);
```

Y en la línea del `throw` de datos faltantes de esa misma función, sumar `[--trato usted|vos]` al texto de uso. En `ayuda()`, en el bloque de `crear`, dejar la línea:

```
      [--trato usted|vos] fuerza el trato sin preguntarle al modelo.
```

- [ ] **Step 6: Correr todo y commitear**

Run: `npm test`
Expected: PASS (los que ya estaban + los nuevos).

```bash
git add entrevistador/src/ia/trato.ts entrevistador/test/trato.test.ts entrevistador/scripts/manual.ts
git commit -m "entrevistador: el modelo decide el trato del narrador (usted o vos) una sola vez"
```

---

### Task 2: La pregunta del día usa el trato

**Files:**
- Modify: `entrevistador/src/ia/personalizar.ts:64-84` (el prompt) y `:196-202` (la llamada)
- Modify: `entrevistador/test/personalizar.test.ts`

**Interfaces:**
- Consumes: `tratoDe`, `Trato` de `src/ia/trato.js` (Task 1).
- Produces: `PROMPT_PERSONALIZAR(original, ficha, previas, resumenes, evitar, trato)` — el sexto parámetro es nuevo, `trato: Trato = 'usted'`.

- [ ] **Step 1: Escribir el test que falla**

Agregar a `entrevistador/test/personalizar.test.ts` (el archivo ya tiene los mocks armados; importar `PROMPT_PERSONALIZAR` ya se importa arriba):

```ts
describe('el trato manda en el prompt de la pregunta del día', () => {
  it('con vos: tutea y cambia el ejemplo del año de nacimiento', () => {
    const p = PROMPT_PERSONALIZAR('¿Cómo era su casa?', 'El narrador es Ciro.', '', '', '', 'vos');
    expect(p).toContain('Tratalo de vos, cálido, en castellano rioplatense (Argentina).');
    expect(p).toContain('"cuando tenías seis años"');
    expect(p).not.toContain('Tratalo de usted');
  });

  it('con usted: queda como estaba', () => {
    const p = PROMPT_PERSONALIZAR('¿Cómo era su casa?', 'El narrador es Don Osvaldo.', '', '', '', 'usted');
    expect(p).toContain('Tratalo de usted, cálido, en castellano rioplatense (Argentina).');
    expect(p).toContain('"cuando usted tenía seis años"');
  });

  it('personalizarPregunta le pasa al modelo el trato guardado del narrador', async () => {
    mocks.crear.mockResolvedValue({ content: [{ type: 'text', text: '¿Cómo era tu casa de Concordia?' }] });
    const n = { id: 'n1', como_le_dicen: 'Ciro', contexto: { anioNacimiento: 1998, trato: 'vos' } };
    await personalizarPregunta(n as any, '¿Cómo era su casa?', 1, { recordar: false });
    const prompt = mocks.crear.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain('Tratalo de vos');
  });

  it('el trato sobrevive a que se guarde la pregunta enviada', async () => {
    // recordarEnviada pisa el contexto entero: si tratoDe guardó el trato justo
    // antes, tiene que seguir estando en ese update.
    mocks.crear
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'vos' }] })              // tratoDe
      .mockResolvedValueOnce({ content: [{ type: 'text', text: '¿Cómo era tu casa?' }] }); // la pregunta
    const n = { id: 'n1', como_le_dicen: 'Ciro', contexto: { anioNacimiento: 1998 } };
    await personalizarPregunta(n as any, '¿Cómo era su casa?', 1);
    const guardado = mocks.updates.filter((u) => u.tabla === 'narradores').at(-1);
    expect(guardado!.p.contexto.trato).toBe('vos');
    expect(guardado!.p.contexto.preguntasEnviadas['1']).toBe('¿Cómo era tu casa?');
  });
});
```

- [ ] **Step 2: Correrlo y verificar que falla**

Run: `npx vitest run test/personalizar.test.ts -t "el trato manda"`
Expected: FAIL — el prompt dice "Tratalo de usted" aunque se le pase `'vos'` (el sexto parámetro se ignora). **Pegar la salida.**

- [ ] **Step 3: Implementar**

En `src/ia/personalizar.ts`, importar arriba:

```ts
import { tratoDe, type Trato } from './trato.js';
```

Cambiar la firma del prompt (línea 64) y sus dos líneas de trato (79-80):

```ts
export const PROMPT_PERSONALIZAR = (original: string, ficha: string, previas: string, resumenes = '', evitar = '', trato: Trato = 'usted') => `Sos el biógrafo de esta persona: le escribís todos los días por WhatsApp y querés que sienta que lo venís escuchando.
```

```ts
- El AÑO DE NACIMIENTO (si figura arriba) es para anclar la época, no es un lugar: se dice ${trato === 'vos' ? '"cuando tenías seis años"' : '"cuando usted tenía seis años"'} o "allá por 1945", NUNCA "su infancia en 1939".
- Tratalo de ${trato}, cálido, en castellano rioplatense (Argentina). Máximo ${MAX_PALABRAS} palabras.
```

En `personalizarPregunta`, dentro del `try`, antes de armar el mensaje:

```ts
    const trato = await tratoDe(n);
```

y pasarlo como sexto argumento:

```ts
      messages: [{ role: 'user', content: PROMPT_PERSONALIZAR(original, fichaEnTexto(n.contexto, n.como_le_dicen), previas, resumenes, textoEvitar(n.contexto), trato) }],
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run test/personalizar.test.ts`
Expected: PASS, todos (los viejos incluidos).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/personalizar.ts entrevistador/test/personalizar.test.ts
git commit -m "entrevistador: la pregunta del dia se escribe con el trato del narrador"
```

---

### Task 3: La repregunta y la pregunta de reemplazo usan el trato

**Files:**
- Modify: `entrevistador/src/ia/cerebro.ts:25-29` (`ESTILO_CEREBRO`), `:113-124` (`evaluarRespuesta`), `:130-146` (`generarPreguntaReemplazo`)
- Modify: `entrevistador/src/flujo/procesar.ts` (llamada a `evaluarRespuesta`)
- Modify: `entrevistador/src/flujo/preguntar.ts` (`crearReemplazo`, llamada a `generarPreguntaReemplazo`)
- Modify: `entrevistador/scripts/manual.ts:383` y `:276` (las dos llamadas de la puerta manual)
- Modify: `entrevistador/test/cerebro.test.ts`

**Interfaces:**
- Consumes: `tratoDe`, `Trato` de `src/ia/trato.js`.
- Produces:
  - `export function estiloCerebro(trato: Trato = 'usted'): string` — **reemplaza a la constante `ESTILO_CEREBRO`**, que deja de existir.
  - `evaluarRespuesta(pregunta, transcripcion, duracionSegundos, evitar = '', trato: Trato = 'usted')`
  - `generarPreguntaReemplazo(comoLeDicen, historiaCompleta, capitulos, capituloQueNoAplica, evitar = '', trato: Trato = 'usted')`

- [ ] **Step 1: Escribir el test que falla**

Agregar a `entrevistador/test/cerebro.test.ts`:

```ts
describe('el estilo del cerebro sigue el trato', () => {
  it('con vos tutea y no habla de una persona mayor', async () => {
    const { estiloCerebro } = await import('../src/ia/cerebro.js');
    const e = estiloCerebro('vos');
    expect(e).toContain('Le hablás de vos, con respeto y afecto genuino');
    expect(e).toContain('de la vida de una persona a partir de sus relatos por WhatsApp.');
    expect(e).not.toContain('de usted');
    expect(e).not.toContain('señor o señora mayor');
  });

  it('con usted queda como estaba', async () => {
    const { estiloCerebro } = await import('../src/ia/cerebro.js');
    const e = estiloCerebro('usted');
    expect(e).toContain('Le hablás de usted, con respeto y afecto genuino');
    expect(e).toContain('de la vida de un señor o señora mayor a partir de sus relatos por WhatsApp.');
  });

  it('el default es usted', async () => {
    const { estiloCerebro } = await import('../src/ia/cerebro.js');
    expect(estiloCerebro()).toContain('Le hablás de usted');
  });
});
```

Y un test que verifique que el trato viaja hasta la llamada. **Ojo con el nombre del mock:** este archivo usa `crearMock` suelto (línea 12), no el `mocks.crear` de `personalizar.test.ts`. Seguir el del archivo.

```ts
describe('el trato llega a la llamada', () => {
  it('evaluarRespuesta manda el estilo en vos', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": true}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    await evaluarRespuesta('¿Cómo era tu casa?', 'Era linda.', 12, '', 'vos');
    const llamada = crearMock.mock.calls.at(-1)![0];
    expect(llamada.system).toContain('Le hablás de vos');
  });

  it('generarPreguntaReemplazo pide tratarlo de vos', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"texto": "¿Y el taller?", "capitulo": "El trabajo"}' }] });
    const { generarPreguntaReemplazo } = await import('../src/ia/cerebro.js');
    await generarPreguntaReemplazo('Ciro', 'Contó del taller.', ['La infancia'], 'Los hijos', '', 'vos');
    const llamada = crearMock.mock.calls.at(-1)![0];
    expect(llamada.messages[0].content).toContain('tratarlo de vos');
    expect(llamada.system).toContain('Le hablás de vos');
  });

  it('sin trato explícito sigue siendo usted', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": true}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    await evaluarRespuesta('¿Cómo era su casa?', 'Era linda.', 12);
    expect(crearMock.mock.calls.at(-1)![0].system).toContain('Le hablás de usted');
  });
});
```

- [ ] **Step 2: Correrlo y verificar que falla**

Run: `npx vitest run test/cerebro.test.ts`
Expected: FAIL — `estiloCerebro is not a function`. **Pegar la salida.**

- [ ] **Step 3: Implementar en `cerebro.ts`**

Reemplazar la constante por la función (y borrar la constante: no dejar las dos):

```ts
export function estiloCerebro(trato: Trato = 'usted'): string {
  return `Sos el biógrafo de la familia: una persona cálida que está escribiendo el libro
de la vida de ${trato === 'vos' ? 'una persona' : 'un señor o señora mayor'} a partir de sus relatos por WhatsApp.
Le hablás de ${trato}, con respeto y afecto genuino, en español neutro (nada de modismos regionales).
Sos breve. Jamás sonás a robot ni a formulario.`;
}
```

Importar el tipo arriba: `import type { Trato } from './trato.js';`

En `evaluarRespuesta`: agregar `trato: Trato = 'usted'` al final de la firma y usar `system: estiloCerebro(trato)`.

En `generarPreguntaReemplazo`: agregar `trato: Trato = 'usted'` al final de la firma, usar `system: estiloCerebro(trato)`, y en el texto del prompt cambiar `tratarlo de usted` por `tratarlo de ${trato}`.

En `detectarIntencion` y cualquier otro uso de `ESTILO_CEREBRO`: pasar a `estiloCerebro()` sin argumento (es un clasificador, el trato no lo afecta).

- [ ] **Step 4: Actualizar los tres llamadores**

En `src/flujo/procesar.ts`, donde llama a `evaluarRespuesta(...)`: sumar el trato como último argumento, con `const trato = await tratoDe(narrador);` arriba (importar `tratoDe` de `../ia/trato.js`).

En `src/flujo/preguntar.ts`, en `crearReemplazo`: sumar `await tratoDe(n)` como último argumento de `generarPreguntaReemplazo`.

En `scripts/manual.ts`: en `trasResponderManual` sumar el trato a `evaluarRespuesta` (el narrador `n` está en la mano), y en `siguiente()` sumarlo a `generarPreguntaReemplazo`. Importar `tratoDe` en el bloque de imports dinámicos de `modulos()`, siguiendo el patrón que ya usa el archivo.

- [ ] **Step 5: Correr todo y commitear**

Run: `npm test`
Expected: PASS.

```bash
git add entrevistador/src/ia/cerebro.ts entrevistador/src/flujo/procesar.ts entrevistador/src/flujo/preguntar.ts entrevistador/scripts/manual.ts entrevistador/test/cerebro.test.ts
git commit -m "entrevistador: la repregunta y el reemplazo siguen el trato del narrador"
```

---

### Task 4: Las adaptativas y las sugeridas usan el trato

**Files:**
- Modify: `entrevistador/src/ia/adaptativas.ts:23-46` (prompt) y `:68-80` (`generarPreguntasAdaptativas`)
- Modify: `entrevistador/src/ia/sugeridas.ts:20-38` (prompt) y `:56-64` (`sugerirPreguntas`)
- Modify: `entrevistador/test/adaptativas.test.ts`, `entrevistador/test/hitos-y-sugeridas.test.ts`

**Interfaces:**
- Consumes: `tratoDe`, `Trato` de `src/ia/trato.js`.
- Produces:
  - `PROMPT_ADAPTATIVAS(nombre, historiaCompleta, capitulos, cuantasContestadas = 26, evitar = '', trato: Trato = 'usted')`
  - `PROMPT_SUGERIDAS(nombre, historia, guion, capitulos, evitar = '', trato: Trato = 'usted')`

- [ ] **Step 1: Escribir los tests que fallan**

En `test/adaptativas.test.ts`:

```ts
describe('el trato en las 4 preguntas finales', () => {
  it('con vos: tutea y no dice que la lee una persona mayor', () => {
    const p = PROMPT_ADAPTATIVAS('Ciro', 'Contó del taller.', ['La infancia'], 26, '', 'vos');
    expect(p).toContain('tratarlo de vos');
    expect(p).toContain('MUY IMPORTANTE — las va a leer en el celular:');
    expect(p).not.toContain('tratarlo de usted');
  });

  it('con usted queda como estaba', () => {
    const p = PROMPT_ADAPTATIVAS('Don Osvaldo', 'Contó del taller.', ['La infancia'], 26, '', 'usted');
    expect(p).toContain('tratarlo de usted');
    expect(p).toContain('MUY IMPORTANTE — las va a leer en el celular una persona mayor:');
  });
});
```

En `test/hitos-y-sugeridas.test.ts`:

```ts
describe('el trato en las sugeridas', () => {
  it('con vos pide tutearlo', () => {
    const p = PROMPT_SUGERIDAS('Ciro', 'Contó del taller.', ['¿Cómo era su casa?'], ['La infancia'], '', 'vos');
    expect(p).toContain('Cada pregunta: tratarlo de vos');
    expect(p).not.toContain('tratarlo de usted');
  });

  it('con usted queda como estaba', () => {
    const p = PROMPT_SUGERIDAS('Don Osvaldo', 'Contó del taller.', ['¿Cómo era su casa?'], ['La infancia'], '', 'usted');
    expect(p).toContain('Cada pregunta: tratarlo de usted');
  });
});
```

- [ ] **Step 2: Correrlos y verificar que fallan**

Run: `npx vitest run test/adaptativas.test.ts test/hitos-y-sugeridas.test.ts`
Expected: FAIL — los prompts ignoran el sexto parámetro. **Pegar la salida.**

- [ ] **Step 3: Implementar**

En `adaptativas.ts`, firma del prompt + las dos líneas:

```ts
export const PROMPT_ADAPTATIVAS = (nombre: string, historiaCompleta: string, capitulos: string[], cuantasContestadas = 26, evitar = '', trato: Trato = 'usted') => `
```

```ts
(referí lo que él contó), tratarlo de ${trato}, y ser una sola pregunta clara.

MUY IMPORTANTE — las va a leer en el celular${trato === 'usted' ? ' una persona mayor' : ''}:
```

En `generarPreguntasAdaptativas`, después de leer al narrador (la query ya trae `como_le_dicen, contexto`):

```ts
  const trato = await tratoDe({ id: narradorId, como_le_dicen: comoLeDicen, contexto: (n?.contexto ?? {}) as Record<string, any> });
  const prompt = PROMPT_ADAPTATIVAS(comoLeDicen, historia, capitulos, desde - 1, textoEvitar(n?.contexto), trato);
```

En `sugeridas.ts`, firma + la línea:

```ts
export const PROMPT_SUGERIDAS = (nombre: string, historia: string, guion: string[], capitulos: string[], evitar = '', trato: Trato = 'usted') => `
```

```ts
Cada pregunta: tratarlo de ${trato}, una sola pregunta clara, máximo 45 palabras, con un solo detalle concreto si lo hay.
```

Y en `sugerirPreguntas`, igual que arriba: `const trato = await tratoDe({ id: narradorId, como_le_dicen: n.como_le_dicen ?? 'el narrador', contexto: (n.contexto ?? {}) as Record<string, any> });` y pasarlo como sexto argumento.

- [ ] **Step 4: Correr y commitear**

Run: `npm test`
Expected: PASS.

```bash
git add entrevistador/src/ia/adaptativas.ts entrevistador/src/ia/sugeridas.ts entrevistador/test/adaptativas.test.ts entrevistador/test/hitos-y-sugeridas.test.ts
git commit -m "entrevistador: las adaptativas y las sugeridas siguen el trato del narrador"
```

---

### Task 5: Los tres textos fijos, en un solo lugar

**Files:**
- Modify: `entrevistador/src/manual/puro.ts:98-120` (`mensajeDePregunta` y `despedida`), + `bienvenidaAceptacion` nueva
- Modify: `entrevistador/src/flujo/preguntar.ts:135` (borrar la copia inline)
- Modify: `entrevistador/src/flujo/cierre.ts:4-6` (borrar la copia)
- Modify: `entrevistador/src/flujo/procesar.ts:119-122` (la bienvenida)
- Modify: `entrevistador/test/manual.test.ts`, `entrevistador/test/cierre.test.ts`, `entrevistador/test/procesar.test.ts`
- Modify: `entrevistador/PLANTILLAS.md`

**Interfaces:**
- Consumes: `Trato` de `src/ia/trato.js` (solo el tipo — `puro.ts` no debe importar nada que toque red ni base: hoy no importa nada y eso es a propósito).
- Produces:
  - `mensajeDePregunta(pregunta: string, trato: Trato = 'usted'): string`
  - `despedida(comoLeDicen: string, trato: Trato = 'usted'): string`
  - `bienvenidaAceptacion(comoLeDicen: string, trato: Trato = 'usted'): string`

- [ ] **Step 1: Escribir los tests que fallan**

En `test/manual.test.ts` (asertos **verbatim**, texto aprobado por Naza el 2026-09-15):

```ts
describe('los textos fijos en los dos tratos', () => {
  it('la cola de la pregunta, en usted', () => {
    expect(mensajeDePregunta('¿Cómo era su casa?')).toBe(
      'La pregunta de hoy: ¿Cómo era su casa?\n\nCuando quiera, me responde con un audio. Sin apuro. 🎙️',
    );
  });

  it('la cola de la pregunta, en vos', () => {
    expect(mensajeDePregunta('¿Cómo era tu casa?', 'vos')).toBe(
      'La pregunta de hoy: ¿Cómo era tu casa?\n\nCuando quieras, me respondés con un audio. Sin apuro. 🎙️',
    );
  });

  it('la despedida, en usted', () => {
    expect(despedida('Don Osvaldo')).toBe(
      'Don Osvaldo... llegamos al final del viaje. Treinta charlas, una vida entera. Fue un honor enorme escucharlo. Su historia ya está siendo convertida en su libro.',
    );
  });

  it('la despedida, en vos', () => {
    expect(despedida('Ciro', 'vos')).toBe(
      'Ciro... llegamos al final del viaje. Treinta charlas, una vida entera. Fue un honor enorme escucharte. Tu historia ya está siendo convertida en tu libro.',
    );
  });

  it('la bienvenida, en usted', () => {
    expect(bienvenidaAceptacion('Don Osvaldo')).toBe(
      '¡Qué alegría, Don Osvaldo! Mañana a la mañana le llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre usted y yo, a su ritmo. 📖',
    );
  });

  it('la bienvenida, en vos', () => {
    expect(bienvenidaAceptacion('Ciro', 'vos')).toBe(
      '¡Qué alegría, Ciro! Mañana a la mañana te llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre vos y yo, a tu ritmo. 📖',
    );
  });
});
```

Los literales viejos están asertados en exactamente **dos** archivos (verificado con `grep -rln "Cuando quiera\|honor enorme\|Qué alegría" test/`): `test/manual.test.ts` y `test/procesar.test.ts`. En `test/procesar.test.ts`, donde hoy se aserta el texto de la bienvenida a mano, cambiar el literal por `bienvenidaAceptacion('...')` importado de `puro.js` — así queda una sola verdad y el aserto verbatim vive en `manual.test.ts`.

Además, un test que prueba que el flujo **usa** la función y no una copia nueva:

```ts
it('la bienvenida sale con el trato del narrador', async () => {
  // narrador con contexto.trato = 'vos' → el texto que se envía es el gemelo en vos
  // (montar el narrador como hacen los tests de arriba de este archivo y
  // asertar sobre el mock de enviarTexto)
  expect(textoEnviado).toBe(bienvenidaAceptacion('Ciro', 'vos'));
});
```

- [ ] **Step 2: Correrlos y verificar que fallan**

Run: `npx vitest run test/manual.test.ts -t "los textos fijos"`
Expected: FAIL — `bienvenidaAceptacion is not a function` y las variantes en vos devuelven el texto en usted. **Pegar la salida.**

- [ ] **Step 3: Implementar en `puro.ts`**

```ts
import type { Trato } from '../ia/trato.js';
```

> Es un `import type`: se borra al compilar, así que `puro.ts` sigue sin depender de nada en tiempo de ejecución.

```ts
/**
 * El texto que se le pega al narrador: la pregunta sola.
 *
 * Es el mismo texto que arma el camino de WhatsApp en `preguntar.ts` — de
 * hecho ahora es LITERALMENTE el mismo: hasta el 2026-09-15 vivía escrito dos
 * veces, acá y allá, y con dos tratos serían cuatro frases sueltas.
 */
export function mensajeDePregunta(pregunta: string, trato: Trato = 'usted'): string {
  const cierre = trato === 'vos'
    ? 'Cuando quieras, me respondés con un audio. Sin apuro. 🎙️'
    : 'Cuando quiera, me responde con un audio. Sin apuro. 🎙️';
  return `La pregunta de hoy: ${pregunta}\n\n${cierre}`;
}

/** La despedida final. Único hogar del texto: `cierre.ts` la importa de acá. */
export function despedida(comoLeDicen: string, trato: Trato = 'usted'): string {
  const final = trato === 'vos'
    ? 'Fue un honor enorme escucharte. Tu historia ya está siendo convertida en tu libro.'
    : 'Fue un honor enorme escucharlo. Su historia ya está siendo convertida en su libro.';
  return `${comoLeDicen}... llegamos al final del viaje. Treinta charlas, una vida entera. ${final}`;
}

/** Lo que recibe cuando dice que SÍ. */
export function bienvenidaAceptacion(comoLeDicen: string, trato: Trato = 'usted'): string {
  return trato === 'vos'
    ? `¡Qué alegría, ${comoLeDicen}! Mañana a la mañana te llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre vos y yo, a tu ritmo. 📖`
    : `¡Qué alegría, ${comoLeDicen}! Mañana a la mañana le llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre usted y yo, a su ritmo. 📖`;
}
```

- [ ] **Step 4: Borrar las copias**

`src/flujo/preguntar.ts`: borrar la línea 135 (`const mensaje = \`La pregunta de hoy: ...\``) y poner:

```ts
  const mensaje = mensajeDePregunta(texto, await tratoDe(n));
```

con `import { mensajeDePregunta } from '../manual/puro.js';` arriba.

`src/flujo/cierre.ts`: borrar la constante local `despedida` y usar la de `puro.ts`. Necesita el trato, así que la query de `cerrarBitacora` tiene que traer también `id` y `contexto`:

```ts
  const { data: narrador } = await db.from('narradores')
    .select('id,como_le_dicen,telefono_whatsapp,estado,contexto').eq('id', narradorId).maybeSingle();
```

y después `await enviarTexto(n.telefono_whatsapp, despedida(n.como_le_dicen, await tratoDe(n)))`.

`src/flujo/procesar.ts`: en `manejarConsentimiento`, reemplazar el literal por `bienvenidaAceptacion(narrador.como_le_dicen, await tratoDe(narrador))`.

- [ ] **Step 5: La nota en PLANTILLAS.md**

Debajo del bloque de `pregunta_diaria`, agregar:

```markdown
> **El trato (2026-09-15).** Este cuerpo está en USTED y es el que aprueba Meta.
> Cuando el mensaje sale por plantilla (fuera de la ventana de 24 h), el narrador
> lee "Cuando quiera, me responde" aunque su trato sea `vos` — el texto libre
> del modo rápido y de la puerta manual sí respeta el trato. Si hace falta,
> el gemelo es una plantilla nueva `pregunta_diaria_vos` con el cuerpo:
>
> La pregunta de hoy: {{1}}
>
> Cuando quieras, me respondés con un audio. Sin apuro. 🎙️
>
> **No está cargada en Meta:** mandar a esa plantilla sin haberla aprobado deja
> al narrador sin mensaje. Primero se carga, después se cambia el código.
```

- [ ] **Step 6: Correr todo y commitear**

Run: `npm test`
Expected: PASS.

```bash
git add entrevistador/src/manual/puro.ts entrevistador/src/flujo/preguntar.ts entrevistador/src/flujo/cierre.ts entrevistador/src/flujo/procesar.ts entrevistador/test/ entrevistador/PLANTILLAS.md
git commit -m "entrevistador: los tres textos fijos siguen el trato y viven en un solo lugar"
```

---

### Task 6: Revisión final de la rama

- [ ] **Step 1: `npm test` en `entrevistador/` y `npx tsc --noEmit`**

Expected: todo verde, tsc limpio. Pegar las dos salidas.

- [ ] **Step 2: Buscar "usted" suelto**

Run: `grep -rn "de usted\|tratarlo de\|Tratalo de" entrevistador/src/`
Expected: ninguna aparición con "usted" escrito a mano — todas tienen que ser `${trato}` o estar dentro de una rama `trato === 'usted'`.

- [ ] **Step 3: Buscar textos duplicados**

Run: `grep -rn "Cuando quiera\|Cuando quieras\|honor enorme" entrevistador/src/`
Expected: solo `src/manual/puro.ts`.

---

## Después del plan (operación, no código)

Regenerar la pregunta 1 de Ciro en vos: borrarle `contexto.preguntasEnviadas["1"]` y correr `npm run manual -- siguiente ciro`. Su ficha (nacido en 1998) tiene datos, así que el modelo va a decidir en esa misma corrida. La pregunta vieja, en usted, no se le mandó a nadie.
