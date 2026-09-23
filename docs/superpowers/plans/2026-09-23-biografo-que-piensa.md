# El biógrafo que piensa — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** dejar el biógrafo v2 completo (entrevista y libro) según el diseño aprobado, con tests y
sin gastar, y una puerta manual v2 para que Naza se entreviste a sí mismo como prueba.

**Architecture:** el entrevistador v2 vive en `entrevistador/src/ia/` (perfil, plan, secuencia,
encargo, pregunta, controles, evaluación) como módulos puros más una llamada al modelo cada uno; la
puerta manual v2 (`scripts/manual-v2.ts`) los orquesta contra la base real. La fábrica v2 suma un
orquestador (`libro-v2.ts`), el lector final y la decisión de revisión; los scripts de prueba se
vuelven delgados. Nada se conecta al flujo automático: eso es el paso siguiente, con Joaquín.

**Tech Stack:** Node 20 + TypeScript ESM, `@anthropic-ai/sdk` (Opus 5 en el entrevistador; Fable 5
escribe y Opus 5 lee en la fábrica), `@supabase/supabase-js`, vitest.

**Spec:** `docs/superpowers/specs/2026-09-23-biografo-que-piensa-design.md` (leerlo entero antes).
**Contexto:** `docs/revision-2026-09-23-biografo-v2.md` y `HERMES.md` (el método de la casa).

## Global Constraints

- Se trabaja en el worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-biografo`, rama
  `biografo-v2-fabrica`. **Nunca checkout en la carpeta principal.** Sin push a `main`.
- **No se corre nada contra el modelo.** Todos los tests usan clientes falsos (`vi.fn()`); la
  prueba paga la corre Naza.
- Comentarios, nombres y commits en **castellano rioplatense**; cada función explica por qué existe.
  Commits con `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` (o el agente que sea).
- **Los textos que hablan con la persona** (la presentación, los temas del núcleo, el encargo, el
  prompt de la pregunta, el de la evaluación) **los aprueba Naza**: cada tarea que los toque los
  imprime en el reporte final. No se mergea nada sin ese OK.
- **Nada de "él"** en prompts ni temas: la persona puede ser mujer u hombre; si no se sabe, formas
  que sirvan para los dos. Test en cada tarea que escribe temas.
- Modelos: entrevistador `claude-opus-5`; fábrica escribe con `claude-fable-5`, el lector es
  `claude-opus-5`. No cambiar sin pedido.
- Tests: `cd entrevistador && npx vitest run && npm run tipos` (tipos mira `src`, `scripts` y
  `test`); `cd fabrica && npx vitest run && npx tsc --noEmit -p .` y además, hasta que se mergee
  `fabrica-tipos`, `npx tsc --noEmit -p tsconfig.revision.json` con
  `{ "extends": "./tsconfig.json", "include": ["src", "scripts/prueba-reparto.ts"] }` (crear el
  archivo, correrlo, borrarlo). **Mirar la línea "Test Files" además de "Tests".** No commitear en rojo.
- **DDL no se aplica**: la migración se escribe (idempotente) y la aplica Naza. Cambios de datos
  compartidos van primero a `supabase/CONTRATO.md`.
- No imprimir claves ni tokens, nunca.
- Techo duro de la entrevista: **40 preguntas**. Piso de variables 8, techo 19.
- Tope de palabras: pregunta y repregunta 50 (el encargo pide 45); presentación 90.
- Objetos: hasta 8 por libro, nunca se insiste, `contexto.sinFotos` los apaga.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `entrevistador/src/ia/perfil.ts` (modificar) | la ficha del biógrafo: nace de la ficha de la compra, aprende de cada respuesta, corrige por número |
| `entrevistador/src/ia/plan-preguntas.ts` (modificar) | cuántas variables y en qué tramos, con techo |
| `entrevistador/src/ia/pregunta-v2.ts` (modificar) | los 21 temas + presentación, el prompt, tres intentos, marca |
| `entrevistador/src/ia/secuencia.ts` (crear) | qué pregunta sigue: pendientes, cubiertos, puerta abierta, objetos |
| `entrevistador/src/ia/encargo-entrevista.ts` (modificar) | el encargo compartido, reescrito |
| `entrevistador/src/ia/control-pregunta.ts` (crear) | controles de lugar/época y supuestos; el control completo |
| `entrevistador/src/ia/evaluar-v2.ts` (modificar) | salida validada, hoy no, no quiero seguir, cansancio |
| `entrevistador/scripts/manual-v2.ts` (crear) | la puerta manual v2: empezar / cargar / siguiente / estado |
| `entrevistador/scripts/prueba-integral.ts` (modificar) | solo C1, C4 y la reserva inventada |
| `fabrica/src/libro/etapas.ts` (modificar) | etapas desde edades por respuesta; el mapeo del guion viejo se va al script |
| `fabrica/src/libro/lector.ts` (crear) | el lector final |
| `fabrica/src/libro/revision.ts` (crear) | el informe, si hay que revisar, el mail |
| `fabrica/src/libro/libro-v2.ts` (crear) | orquesta el libro v2 de punta a punta, sin base |
| `fabrica/scripts/prueba-reparto.ts` (modificar) | delgado: lee la base, llama a `libro-v2`, escribe la carpeta |
| `supabase/migrations/20260924000000_pedidos_revision.sql` (crear) | el estado `revision` |
| `supabase/CONTRATO.md` (modificar) | `contexto.perfil`, `contexto.secuencia`, `contexto.marcas`, el estado `revision` |

Convención de tests: `entrevistador/test/<modulo>.test.ts` y `fabrica/test/<modulo>.test.ts`, vitest,
sin red. Para el modelo, un cliente falso:

```ts
const clienteFalso = (textos: string[]) => {
  const create = vi.fn();
  for (const t of textos) create.mockResolvedValueOnce({ content: [{ type: 'text', text: t }], usage: { input_tokens: 1, output_tokens: 1 } });
  return { cliente: { messages: { create } } as never, create };
};
```

---

### Task 1: El perfil nace de la ficha y aprende lo que la secuencia necesita

**Files:**
- Modify: `entrevistador/src/ia/perfil.ts`
- Test: `entrevistador/test/perfil.test.ts`

**Interfaces:**
- Consumes: `castellanoDe(zonaHoraria, trato)` de `src/manual/puro.ts` (ya existe).
- Produces:
  - `Perfil` suma `castellano: Castellano`, `persona.comoLeDicen: Dato<string>`, `cubiertos: string[]`, `puertaAbierta: string | null`, `hoyFueFuerte: boolean`.
  - `CambiosDePerfil` suma `cubiertos?: string[]`, `puertaAbierta?: string | null`, `hoyFueFuerte?: boolean`.
  - `perfilDesdeFicha(contexto: Record<string, any>, zonaHoraria?: string | null): Perfil`.
  - `aplicarCambios` conserva un dato `dicho` frente a un cambio `deducido`; `puertaAbierta` y `hoyFueFuerte` se reemplazan en cada respuesta (no se acumulan).
  - `PROMPT_PERFIL` pide la edad en cifras, corregir por número, `cubiertos`, `puertaAbierta`, `hoyFueFuerte`; recibe la lista de temas pendientes (`armarPromptPerfil(perfil, pregunta, respuesta, pendientes: { id: string; tema: string }[])`; la ficha de la familia ya no viaja).

- [ ] **Step 1: Escribir los tests que fallan**

Agregar a `entrevistador/test/perfil.test.ts`:

```ts
import { perfilDesdeFicha } from '../src/ia/perfil.js';

describe('perfilDesdeFicha (la ficha de la compra siembra el perfil el día 0)', () => {
  it('toma año de nacimiento, estado civil, árbol, dónde vive, oficio y lugar, todo con fuente ficha', () => {
    const p = perfilDesdeFicha({
      anioNacimiento: 1950, estadoCivil: 'viuda', dondeVive: 'Lanús', oficio: 'costurera', lugarNacimiento: 'Tucumán',
      arbol: { hijos: 'no tuvo', padres: 'Ramón y Haydée' }, trato: 'usted',
    }, 'America/Argentina/Buenos_Aires');
    expect(p.persona.anioNacimiento).toEqual({ valor: '1950', fuente: 'ficha' });
    expect(p.persona.dondeViveHoy?.valor).toBe('Lanús');
    expect(p.persona.comoHabla).toEqual({ valor: 'usted', fuente: 'ficha' });
    expect(p.castellano).toBe('rioplatense');
    expect(p.personas.find((x) => x.vinculo === 'padres')?.nombre).toBe('Ramón y Haydée');
    expect(p.noSabemos).toContain('Si tuvo pareja (la ficha dice viuda: preguntar quién era)');
    expect(p.bisagras).toEqual([]);
  });

  it('hijos "no tuvo" queda dicho por la familia, no como persona', () => {
    const p = perfilDesdeFicha({ arbol: { hijos: 'no tuvo' } });
    expect(p.personas).toEqual([]);
    expect(p.tono).toBe('');
    expect(p.noSabemos).not.toContain('Si tiene hijos');
    expect(JSON.stringify(p)).toContain('no tuvo hijos');
  });

  it('con la ficha vacía es el perfil vacío, con el castellano de la zona', () => {
    const p = perfilDesdeFicha({}, 'Europe/Madrid');
    expect(p.persona.edad).toBeNull();
    expect(p.castellano).toBe('españa');
    expect(p.noSabemos).toEqual(['Edad', 'Cómo prefiere que le hablen', 'Cómo le dicen']);
  });

  it('un narrador de vos en Europe/Madrid es rioplatense (el trato manda)', () => {
    expect(perfilDesdeFicha({ trato: 'vos' }, 'Europe/Madrid').castellano).toBe('rioplatense');
  });
});

describe('aplicarCambios, lo nuevo', () => {
  it('un dato dicho por la persona no lo pisa una deducción posterior; otro dicho sí', () => {
    const p = base();
    p.persona.edad = { valor: '28', fuente: 'dicho' };
    const deducido = aplicarCambios(p, { persona: { edad: { valor: '35', fuente: 'deducido', por: 'x' } } });
    expect(deducido.persona.edad?.valor).toBe('28');
    const dicho = aplicarCambios(p, { persona: { edad: { valor: '29', fuente: 'dicho' } } });
    expect(dicho.persona.edad?.valor).toBe('29');
  });

  it('cubiertos se acumulan sin repetir; puertaAbierta y hoyFueFuerte son de hoy, no se arrastran', () => {
    const uno = aplicarCambios(base(), { cubiertos: ['amigos', 'amigos'], puertaAbierta: 'pruebas', hoyFueFuerte: true });
    expect(uno.cubiertos).toEqual(['amigos']);
    expect(uno.puertaAbierta).toBe('pruebas');
    expect(uno.hoyFueFuerte).toBe(true);
    const dos = aplicarCambios(uno, { cubiertos: ['padres'] });
    expect(dos.cubiertos).toEqual(['amigos', 'padres']);
    expect(dos.puertaAbierta).toBeNull();
    expect(dos.hoyFueFuerte).toBe(false);
  });

  it('una puerta abierta que no es un tema conocido se ignora', () => {
    const p = aplicarCambios(base(), { puertaAbierta: 42 as never });
    expect(p.puertaAbierta).toBeNull();
  });
});

describe('armarPromptPerfil, lo nuevo', () => {
  it('pide la edad en cifras, corregir por número, y devuelve cubiertos / puerta abierta / hoy fue fuerte con la lista de pendientes', () => {
    const prompt = armarPromptPerfil(base(), '¿Sus hermanos?', 'Éramos cinco.', [{ id: 'con-quien-crecio', tema: 'las personas con las que creció' }]);
    expect(prompt).toMatch(/edad[\s\S]*en cifras/i);
    expect(prompt).toContain('"cubiertos"');
    expect(prompt).toContain('"puertaAbierta"');
    expect(prompt).toContain('"hoyFueFuerte"');
    expect(prompt).toContain('con-quien-crecio');
    expect(prompt).not.toContain('LO QUE CARGÓ LA FAMILIA');
  });
});
```

Y actualizar `base()` del test para que tenga los campos nuevos (`castellano: 'rioplatense'`,
`cubiertos: []`, `puertaAbierta: null`, `hoyFueFuerte: false`, `persona.comoLeDicen: null`): usar
`perfilVacio()` como punto de partida en vez de armar el objeto a mano.

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/perfil.test.ts`
Expected: FAIL (`perfilDesdeFicha is not exported`, y los campos nuevos no existen).

- [ ] **Step 3: Implementar**

En `perfil.ts`:

```ts
import { castellanoDe, type Castellano } from '../manual/puro.js';

export type Perfil = {
  persona: {
    anioNacimiento: Dato<string>;
    edad: Dato<string>;
    genero: Dato<string>;
    comoHabla: Dato<string>;
    /** Cómo le dicen en casa (lo pide la presentación): se usa en todo el libro. */
    comoLeDicen: Dato<string>;
    dondeViveHoy: Dato<string>;
  };
  /** Su castellano: decide qué trato se ofrece (vos/usted o tú/usted) y cómo se transcribe. */
  castellano: Castellano;
  etapas: { edades: string; anios?: string; lugar: string; conQuien: string; queHacia: string; fuente: Fuente }[];
  personas: { nombre: string; vinculo: string; vive: 'si' | 'no' | 'no se sabe'; fuente: Fuente; nota?: string }[];
  bisagras: string[];
  tono: string;
  noSabemos: string[];
  /** Temas fijos que ya contó con detalle sin que se los preguntaran: no se preguntan. */
  cubiertos: string[];
  /** Si la respuesta de HOY abrió un tema pendiente que conviene cruzar mañana (id del tema). De hoy, no se arrastra. */
  puertaAbierta: string | null;
  /** Si HOY contó algo que le costó (una pérdida, un quiebre): mañana la pregunta lo reconoce antes de preguntar. */
  hoyFueFuerte: boolean;
};

export function perfilVacio(castellano: Castellano = 'rioplatense'): Perfil {
  return {
    persona: { anioNacimiento: null, edad: null, genero: null, comoHabla: null, comoLeDicen: null, dondeViveHoy: null },
    castellano,
    etapas: [], personas: [], bisagras: [], tono: '',
    noSabemos: ['Edad', 'Cómo prefiere que le hablen', 'Cómo le dicen'],
    cubiertos: [], puertaAbierta: null, hoyFueFuerte: false,
  };
}

const ESTADO_CIVIL_A_PREGUNTAR: Record<string, string> = {
  viuda: 'Si tuvo pareja (la ficha dice viuda: preguntar quién era)',
  viudo: 'Si tuvo pareja (la ficha dice viudo: preguntar quién era)',
  separada: 'Si tuvo pareja (la ficha dice separada: preguntar quién era)',
  separado: 'Si tuvo pareja (la ficha dice separado: preguntar quién era)',
  divorciada: 'Si tuvo pareja (la ficha dice divorciada: preguntar quién era)',
  divorciado: 'Si tuvo pareja (la ficha dice divorciado: preguntar quién era)',
};

/**
 * El perfil del día 0, con lo que cargó la familia al comprar. Cada dato dice "ficha": lo que la
 * persona diga después manda. La ficha deja de viajar en cada llamada al modelo: viaja esto.
 */
export function perfilDesdeFicha(contexto: Record<string, any> = {}, zonaHoraria?: string | null): Perfil {
  const c = contexto ?? {};
  const p = perfilVacio(castellanoDe(zonaHoraria, c.trato));
  const ficha = (valor: unknown): Dato<string> => (valor === undefined || valor === null || String(valor).trim() === '' ? null : { valor: String(valor).trim(), fuente: 'ficha' });
  p.persona.anioNacimiento = ficha(c.anioNacimiento);
  p.persona.dondeViveHoy = ficha(c.dondeVive);
  if (c.trato === 'vos' || c.trato === 'usted') { p.persona.comoHabla = { valor: c.trato, fuente: 'ficha' }; p.noSabemos = p.noSabemos.filter((x) => x !== 'Cómo prefiere que le hablen'); }
  if (c.genero === 'mujer' || c.genero === 'hombre') p.persona.genero = { valor: c.genero, fuente: 'ficha' };
  if (p.persona.anioNacimiento) p.noSabemos = p.noSabemos.filter((x) => x !== 'Edad');
  if (typeof c.lugarNacimiento === 'string' && c.lugarNacimiento.trim()) {
    p.etapas.push({ edades: 'de chico/a', lugar: c.lugarNacimiento.trim(), conQuien: '', queHacia: '', fuente: 'ficha' });
  }
  const arbol = (typeof c.arbol === 'object' && c.arbol) ? c.arbol as Record<string, unknown> : {};
  for (const [vinculo, nombre] of Object.entries(arbol)) {
    if (typeof nombre !== 'string' || !nombre.trim()) continue;
    if (nombre.trim().toLowerCase() === 'no tuvo') { p.noSabemos.push(`(la familia dice que no tuvo ${vinculo})`); continue; }
    p.personas.push({ nombre: nombre.trim(), vinculo, vive: 'no se sabe', fuente: 'ficha' });
  }
  const civil = typeof c.estadoCivil === 'string' ? c.estadoCivil.trim().toLowerCase() : '';
  if (ESTADO_CIVIL_A_PREGUNTAR[civil]) p.noSabemos.push(ESTADO_CIVIL_A_PREGUNTAR[civil]);
  if (typeof c.oficio === 'string' && c.oficio.trim()) p.etapas.push({ edades: '', lugar: '', conQuien: '', queHacia: c.oficio.trim(), fuente: 'ficha' });
  return p;
}
```

(El "no tuvo" queda en `noSabemos` como `(la familia dice que no tuvo hijos)` para que el encargo lo
diga sin convertirlo en una persona; el test lo busca como "no tuvo hijos" en el JSON.)

En `CambiosDePerfil` sumar `cubiertos?: string[]; puertaAbierta?: string | null; hoyFueFuerte?: boolean;`.

En `aplicarCambios`:

```ts
  if (esObjeto(cambios.persona)) {
    for (const [campo, dato] of Object.entries(cambios.persona)) {
      if (!(campo in p.persona) || !esObjeto(dato) || typeof dato.valor !== 'string') continue;
      const anterior = (p.persona as Record<string, Dato<string>>)[campo];
      // Lo que la persona dijo no lo pisa una deducción: solo otro "dicho" (o la ficha, si no había nada).
      if (anterior?.fuente === 'dicho' && dato.fuente !== 'dicho') continue;
      (p.persona as Record<string, Dato<string>>)[campo] = dato as Dato<string>;
    }
  }
  …
  p.cubiertos = sinRepetir([...p.cubiertos, ...lista<string>(cambios.cubiertos)]);
  p.puertaAbierta = typeof cambios.puertaAbierta === 'string' && cambios.puertaAbierta.trim() ? cambios.puertaAbierta.trim() : null;
  p.hoyFueFuerte = cambios.hoyFueFuerte === true;
```

`PROMPT_PERFIL(perfil, pregunta, respuesta, pendientes)` reemplaza el bloque "LO QUE CARGÓ LA
FAMILIA" por:

```
LOS TEMAS QUE TODAVÍA NO SE LE PREGUNTARON (id: de qué trata):
${pendientes}
```

y suma a las reglas:

```
9. Las bisagras empiezan con la edad que tenía ("A los 12 se fue a vivir con el padre a Buenos Aires").
10. La edad va SIEMPRE en cifras ("70", "entre 65 y 75"), nunca en letras.
11. Si hoy corrigió algo que la ficha tenía mal ("está viva", "no fue en Concordia"), corregilo en
    la fila que ya existe, por su número: no agregues otra al lado.
12. "cubiertos": los ids de los temas pendientes que HOY contó con detalle sin que se los
    preguntaran (una escena, nombres). Si solo los nombró al pasar, no.
13. "puertaAbierta": si hoy abrió algo que conviene cruzar mañana (nombró una pérdida, un amor,
    una mudanza, un trabajo) y hay un tema pendiente que lo cubre, su id. Si no, null.
14. "hoyFueFuerte": true si hoy contó algo que le costó decir: una muerte, un quiebre, una
    vergüenza. Mañana se le reconoce antes de preguntar.
```

y en el JSON de salida: `"cubiertos":["id"],"puertaAbierta":"id|null","hoyFueFuerte":false`.
`armarPromptPerfil(perfil, pregunta, respuesta, pendientes)` arma la lista como `- id: tema` por
línea (o `- (ninguno)`). `actualizarPerfil(cliente, perfil, pregunta, respuesta, pendientes)`.
Actualizar `scripts/prueba-perfil.ts` y `scripts/prueba-integral.ts` a la firma nueva (pasan `[]`).

- [ ] **Step 4: Correr los tests**

Run: `cd entrevistador && npx vitest run test/perfil.test.ts && npm run tipos`
Expected: PASS, tipos limpios (arreglar los scripts que llamaban con la firma vieja).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/perfil.ts entrevistador/test/perfil.test.ts entrevistador/scripts/prueba-perfil.ts entrevistador/scripts/prueba-integral.ts
git commit -m "entrevistador: el perfil nace de la ficha de la compra y aprende cubiertos, puerta abierta y si hoy fue fuerte"
```

---

### Task 2: Cuántas preguntas: según la vida, con techo

**Files:**
- Modify: `entrevistador/src/ia/plan-preguntas.ts`
- Test: `entrevistador/test/plan-preguntas.test.ts`

**Interfaces:**
- Produces: `PISO_VARIABLES = 8`, `TECHO_VARIABLES = 19`, `TOPE_PREGUNTAS = 40`,
  `cuantasVariables(edad: number, bisagras: number): number`,
  `planificar(perfil, nucleo, cuantas?: number, anioActual?)` (si `cuantas` no viene, sale de
  `cuantasVariables`), `replanificar(perfil, nucleo, yaAsignadas: Variable[], hechas: number): Plan`
  (recalcula sin bajar de lo ya asignado ni pasar el techo).

- [ ] **Step 1: Tests que fallan**

```ts
import { cuantasVariables, replanificar, TOPE_PREGUNTAS } from '../src/ia/plan-preguntas.js';

describe('cuantasVariables (la cantidad sale de la vida, no de un número fijo)', () => {
  it('una cada 6 años más una por bisagra, entre 8 y 19', () => {
    expect(cuantasVariables(27, 0)).toBe(8);   // 4 → piso
    expect(cuantasVariables(76, 0)).toBe(12);
    expect(cuantasVariables(76, 3)).toBe(15);
    expect(cuantasVariables(90, 10)).toBe(19); // techo
  });
  it('con 21 fijas nunca pasa el tope de 40', () => {
    expect(21 + cuantasVariables(120, 40)).toBeLessThanOrEqual(TOPE_PREGUNTAS);
  });
});

describe('planificar sin cuantas', () => {
  it('usa cuantasVariables con la edad y las bisagras del perfil', () => {
    const r = planificar(perfilDe('76', [], ['A los 60 murió Rubén', 'A los 30 se mudó a Lanús']), NUCLEO as never);
    if (!r.ok) throw new Error('debería planificar');
    expect(r.variables).toHaveLength(14);
  });
});

describe('replanificar (aparecen bisagras nuevas a mitad de camino)', () => {
  it('suma variables si la vida las pide, y nunca baja de lo ya asignado ni pasa el techo', () => {
    const inicial = planificar(perfilDe('76'), NUCLEO as never);
    if (!inicial.ok) throw new Error('x');
    const conBisagras = replanificar(perfilDe('76', [], ['A los 60 murió Rubén']), NUCLEO as never, inicial.variables, 5);
    if (!conBisagras.ok) throw new Error('x');
    expect(conBisagras.variables.length).toBe(inicial.variables.length + 1);
    // Las 5 ya hechas (las primeras) se conservan tal cual.
    expect(conBisagras.variables.slice(0, 5)).toEqual(inicial.variables.slice(0, 5));
    const muchas = replanificar(perfilDe('90', [], Array.from({ length: 30 }, (_, i) => `A los ${i + 1} algo`)), NUCLEO as never, inicial.variables, 5);
    if (!muchas.ok) throw new Error('x');
    expect(muchas.variables.length).toBeLessThanOrEqual(TECHO_VARIABLES);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `cd entrevistador && npx vitest run test/plan-preguntas.test.ts` → FAIL (no exportados).

- [ ] **Step 3: Implementar**

```ts
export const PISO_VARIABLES = 8;
export const TECHO_VARIABLES = 19;
/** 21 fijas + 19 variables. La entrevista SIEMPRE termina (decisión de Naza, 23/09). */
export const TOPE_PREGUNTAS = 40;
/** Cada cuántos años de vida una pregunta variable. */
const ANIOS_POR_VARIABLE = 6;

/** Una variable cada 6 años vividos, más una por cada bisagra; nunca menos de 8 ni más de 19. */
export function cuantasVariables(edad: number, bisagras: number): number {
  return Math.min(TECHO_VARIABLES, Math.max(PISO_VARIABLES, Math.floor(edad / ANIOS_POR_VARIABLE) + bisagras));
}
```

`planificar(perfil, nucleo, cuantas?, anioActual = …)`: después de obtener `edad`, `const n = cuantas ?? cuantasVariables(edad, perfil.bisagras.length);` y usar `n` donde usaba `cuantas`.

```ts
/**
 * Recalcula el plan cuando el perfil cambió (bisagras nuevas, edad corregida). Las variables ya
 * asignadas se conservan (las hechas no se pueden deshacer, y las pendientes no se le sacan); si la
 * vida pide más, se agregan al final, hasta el techo.
 */
export function replanificar(perfil: Perfil, nucleo: readonly { tramo: Tramo | null }[], yaAsignadas: Variable[], hechas: number, anioActual = new Date().getFullYear()): Plan {
  const nuevo = planificar(perfil, nucleo, undefined, anioActual);
  if (!nuevo.ok) return { ok: true, variables: yaAsignadas };
  if (nuevo.variables.length <= yaAsignadas.length) return { ok: true, variables: yaAsignadas };
  const faltan = Math.min(TECHO_VARIABLES, nuevo.variables.length) - yaAsignadas.length;
  // Las nuevas van a los tramos donde el plan nuevo tiene más que el viejo.
  const cuenta = (vs: Variable[], t: Tramo) => vs.filter((v) => v.tramo === t).length;
  const extra: Variable[] = [];
  for (const v of nuevo.variables) {
    if (extra.length >= faltan) break;
    if (cuenta(yaAsignadas, v.tramo) + cuenta(extra, v.tramo) < cuenta(nuevo.variables, v.tramo)) extra.push(v);
  }
  return { ok: true, variables: [...yaAsignadas, ...extra] };
}
```

(`hechas` se recibe para dejar explícito que las primeras `hechas` no se tocan; el algoritmo no las
toca porque conserva `yaAsignadas` entero.)

- [ ] **Step 4: Correr** → PASS. `npm run tipos` limpio.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/plan-preguntas.ts entrevistador/test/plan-preguntas.test.ts
git commit -m "entrevistador: las variables salen de la vida (una cada 6 años más las bisagras), con piso 8, techo 19 y tope 40"
```

---

### Task 3: El núcleo de 21 temas, la presentación y la historia grande

**Files:**
- Modify: `entrevistador/src/ia/pregunta-v2.ts`
- Test: `entrevistador/test/pregunta-v2.test.ts`

**Interfaces:**
- Produces:
  - `NUCLEO`: 22 entradas con `id`, `tramo`, `bloque`, `tema`; ids exactos:
    `presentacion, casa-infancia, mapa-casas, mapa-capitulos, padres, con-quien-crecio, juegos, a-los-quince, primer-trabajo, amor, con-quien-hizo-su-vida, oficio, por-gusto, amigos, un-lugar, un-dia-de-hoy, pruebas, fuerza, alegrias, lo-que-falta, mensaje, cinco-minutos`.
  - `BLOQUES = ['presentacion', 'inicio', 'infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad', 'hoy', 'reflexion']`.
  - `type Objetivo = ({ tipo: 'nucleo' } & NucleoItem) | ({ tipo: 'variable'; id: string } & Variable) | { tipo: 'objeto'; id: string; tramo: Tramo }`.
  - `objetivoEnTexto(o: Objetivo, perfil: Perfil): string` (exportada; las variables llevan la regla de la historia grande; el objeto pide foto).
  - `esPresentacion(o: Objetivo): boolean`.
  - `secuencia()` se va de acá (la reemplaza `secuencia.ts`, Task 4). Borrarla y su test.

- [ ] **Step 1: Tests que fallan**

Reemplazar el bloque `describe('NUCLEO')` y `describe('secuencia')` por:

```ts
describe('NUCLEO (21 temas fijos + la presentación)', () => {
  it('tiene los 22 ids del diseño, en ese orden', () => {
    expect(NUCLEO.map((n) => n.id)).toEqual([
      'presentacion', 'casa-infancia', 'mapa-casas', 'mapa-capitulos', 'padres', 'con-quien-crecio', 'juegos',
      'a-los-quince', 'primer-trabajo', 'amor', 'con-quien-hizo-su-vida', 'oficio', 'por-gusto', 'amigos', 'un-lugar',
      'un-dia-de-hoy', 'pruebas', 'fuerza', 'alegrias', 'lo-que-falta', 'mensaje', 'cinco-minutos',
    ]);
  });

  it('ningún tema dice "él" ni "ella" ni da por hecho hijos, nietos, boda, esposa o marido', () => {
    for (const n of NUCLEO) {
      expect(n.tema, n.id).not.toMatch(/\b(él|ella)\b/);
      expect(n.tema, n.id).not.toMatch(/\b(su esposa|su marido|sus hijos|sus nietos|la boda|su mujer)\b/i);
    }
  });

  it('la presentación no es una pregunta del día: pide el trato, la edad si falta y cómo le dicen', () => {
    const p = NUCLEO.find((n) => n.id === 'presentacion')!;
    expect(p.bloque).toBe('presentacion');
    expect(p.tema).toMatch(/cómo le dicen/i);
    expect(p.tema).toMatch(/solo si/i);
  });

  it('a-los-quince no supone salidas; con-quien-crecio pregunta de dónde venía la familia', () => {
    expect(NUCLEO.find((n) => n.id === 'a-los-quince')!.tema).not.toMatch(/sábado/i);
    expect(NUCLEO.find((n) => n.id === 'con-quien-crecio')!.tema).toMatch(/de dónde venía/i);
  });
});

describe('objetivoEnTexto', () => {
  it('una variable lleva su tramo, sus anclas y la regla de la historia grande de su país', () => {
    const t = objetivoEnTexto({ tipo: 'variable', id: 'var-1', tramo: 'adultez media', desde: 36, hasta: 55, anclas: ['Lanús — su taller (27 a 60)'] }, perfilDe({}));
    expect(t).toContain('entre los 36 y los 55');
    expect(t).toContain('Lanús — su taller');
    expect(t).toMatch(/algo grande en su país o su ciudad/i);
    expect(t).toMatch(/sin dar por hecho de qué lado/i);
  });
  it('un objeto pide UNA cosa de esa época con foto y de dónde salió, y avisa que no se insiste', () => {
    const t = objetivoEnTexto({ tipo: 'objeto', id: 'objeto-juventud', tramo: 'juventud' }, perfilDe({}));
    expect(t).toMatch(/foto/i);
    expect(t).toMatch(/de dónde salió/i);
    expect(t).toMatch(/no se insiste|si no tiene, no pasa nada/i);
  });
  it('la presentación ofrece tú/usted en España y vos/usted en el resto', () => {
    const p = NUCLEO[0];
    expect(objetivoEnTexto({ tipo: 'nucleo', ...p }, perfilDe({}, { castellano: 'españa' }))).toContain('tú o de usted');
    expect(objetivoEnTexto({ tipo: 'nucleo', ...p }, perfilDe({}))).toContain('vos o de usted');
  });
  it('la presentación no pide la edad si la ficha ya la trajo', () => {
    const p = NUCLEO[0];
    expect(objetivoEnTexto({ tipo: 'nucleo', ...p }, perfilDe({ anioNacimiento: { valor: '1950', fuente: 'ficha' } }))).not.toMatch(/cuántos años/i);
  });
});
```

(Actualizar `perfilDe` del test para aceptar `extra: Partial<Perfil>`, como en `evaluar-v2.test.ts`.)

- [ ] **Step 2: Correr y ver que falla** → FAIL.

- [ ] **Step 3: Implementar**

Reemplazar `NUCLEO` entero (los textos son para el biógrafo, no para la persona; igual los aprueba
Naza porque salen en la pregunta):

```ts
export const NUCLEO = [
  { id: 'presentacion', tramo: null, bloque: 'presentacion', tema: 'Es el PRIMER mensaje: la bienvenida. Quién sos (el biógrafo que va a escribir el libro de su vida), cómo va a ser esto (una pregunta por día, se contesta con un audio cuando pueda, sin apuro), y lo que necesitás saber para escribirle bien: cómo prefiere que le hablen ({TRATOS}), {EDAD}cómo le dicen en casa. Entre 70 y 90 palabras, cálido, con ganas; que se pueda contestar con una línea o un audio corto. No es una pregunta del día: no preguntes todavía por su vida.' },
  { id: 'casa-infancia', tramo: 'infancia', bloque: 'inicio', tema: 'La casa donde pasó su infancia, como una escena: si cierra los ojos y entra por la puerta, qué ve, qué huele, quién está. Usá lo que la presentación ya sacó (el trato, cómo le dicen).' },
  { id: 'mapa-casas', tramo: null, bloque: 'inicio', tema: 'El mapa de su vida por las casas: después de aquella casa, para dónde fue la vida. Las casas en que vivió, una tras otra: en qué ciudad, con quién, hasta qué edad más o menos. Que se sienta como un recorrido, no como un formulario. Si todavía no sabés su edad, este es el lugar para que salga sola ("hasta qué edad, más o menos, en cada una").' },
  { id: 'mapa-capitulos', tramo: null, bloque: 'inicio', tema: 'Si su vida fuera un libro, cuáles serían sus capítulos: los grandes pedazos, y qué hizo que uno terminara y empezara otro.' },
  { id: 'padres', tramo: 'infancia', bloque: 'infancia', tema: 'Cómo eran su mamá y su papá (o quienes le criaron), cómo recuerda a cada uno.' },
  { id: 'con-quien-crecio', tramo: 'infancia', bloque: 'infancia', tema: 'Las personas con las que creció (hermanos, abuelos, quien haya estado en esa casa) y de dónde venía la familia: de qué pueblo, de qué país, cómo llegaron.' },
  { id: 'juegos', tramo: 'infancia', bloque: 'infancia', tema: 'A qué jugaba en la infancia y con quién; alguna escena que todavía le haga sonreír. Si la infancia fue dura: qué había, quién estaba, qué rescataba.' },
  { id: 'a-los-quince', tramo: 'juventud', bloque: 'juventud', tema: 'Qué hacía a los quince, dieciséis años cuando no estaba en la escuela ni trabajando: dónde, con quién, qué sonaba. En la ciudad donde vivía ENTONCES. Sin dar por hecho que salía.' },
  { id: 'primer-trabajo', tramo: 'juventud', bloque: 'juventud', tema: 'Su primer trabajo y su primer sueldo: cómo lo consiguió, qué hizo con esa plata.' },
  { id: 'amor', tramo: null, bloque: 'adulto joven', tema: 'El amor: si se enamoró, de quién, cómo fue. Sin dar por hecho que hubo pareja, boda ni de qué género; si no sabés, preguntá si hubo.' },
  { id: 'con-quien-hizo-su-vida', tramo: null, bloque: 'adulto joven', tema: 'Las personas con las que hizo su vida: pareja, hijos, o quienes fueron su familia. Quiénes son y cómo llegaron a su vida; no cómo fue la boda. Si la ficha dice que no tuvo hijos o pareja, preguntá por quienes fueron su familia igual.' },
  { id: 'oficio', tramo: null, bloque: 'adulto joven', tema: 'A qué le dedicó la vida y cómo llegó ahí; la anécdota de trabajo que contaba al llegar a casa.' },
  { id: 'por-gusto', tramo: null, bloque: 'adultez media', tema: 'Lo que hacía por gusto, cuando nadie se lo pedía: el deporte, el club, la música, el baile, la huerta, lo que sea que ya nombró. Si no nombró nada, preguntá abierto qué hacía por gusto.' },
  { id: 'amigos', tramo: null, bloque: 'adultez media', tema: 'Los amigos de siempre: los de la cuadra, los del trabajo, quiénes quedaron. Una escena con ellos.' },
  { id: 'un-lugar', tramo: null, bloque: 'adultez media', tema: 'Un lugar que le cambió algo: un viaje, una mudanza, un barrio, un pueblo. Sin dar por hecho que viajó: puede ser la esquina de siempre.' },
  { id: 'un-dia-de-hoy', tramo: 'hoy', bloque: 'hoy', tema: 'Cómo es un día suyo hoy: dónde vive, con quién, qué hace, qué le alegra.' },
  { id: 'pruebas', tramo: null, bloque: 'reflexion', tema: 'Las pruebas que le puso la vida: una pérdida, un fracaso, una época que dolió. Lo que quiera contar, como quiera.' },
  { id: 'fuerza', tramo: null, bloque: 'reflexion', tema: 'De dónde sacó fuerza en esas épocas y qué aprendió que le quiera dejar dicho a los suyos.' },
  { id: 'alegrias', tramo: null, bloque: 'reflexion', tema: 'Sus alegrías más grandes y lo que más orgullo le da; los dichos que repite desde siempre.' },
  { id: 'lo-que-falta', tramo: null, bloque: 'reflexion', tema: 'Qué no le preguntaste que tiene que estar en el libro: una persona, una época, una historia que se quedó con ganas de contar. Es su turno de traer lo que vos no viste.' },
  { id: 'mensaje', tramo: null, bloque: 'reflexion', tema: 'Qué les quiere decir a los que escuchen esto dentro de cincuenta años (sin dar por hecho que tiene hijos o nietos).' },
  { id: 'cinco-minutos', tramo: null, bloque: 'reflexion', tema: 'Su vida en cinco minutos, para alguien que no le conoce: lo que no puede faltar.' },
] as const;

export type NucleoItem = (typeof NUCLEO)[number];
export type Objetivo =
  | ({ tipo: 'nucleo' } & NucleoItem)
  | ({ tipo: 'variable'; id: string } & Variable)
  | { tipo: 'objeto'; id: string; tramo: Tramo };

export const BLOQUES = ['presentacion', 'inicio', 'infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad', 'hoy', 'reflexion'] as const;
export type Bloque = (typeof BLOQUES)[number];

export const esPresentacion = (o: Objetivo): boolean => o.tipo === 'nucleo' && o.id === 'presentacion';

const HISTORIA_GRANDE = 'Si en esos años pasó algo grande en su país o su ciudad (una dictadura, una guerra, una crisis, una inundación), preguntá cómo lo vivió esta persona, en su casa, sin dar por hecho de qué lado estuvo.';

export function objetivoEnTexto(o: Objetivo, perfil: Perfil): string {
  if (o.tipo === 'objeto') {
    return `Pedile UNA cosa que tenga en casa de esa época (${o.tramo}): un objeto, un papel, una foto vieja, lo que haya guardado. Con una foto, y que cuente de dónde salió. Si no tiene, no pasa nada: no se insiste nunca.`;
  }
  if (o.tipo === 'nucleo') {
    if (o.id !== 'presentacion') return o.tema;
    const tratos = perfil.castellano === 'españa' ? 'de tú o de usted' : 'de vos o de usted';
    const edad = perfil.persona.edad || perfil.persona.anioNacimiento ? '' : 'cuántos años tiene, ';
    return o.tema.replace('{TRATOS}', tratos).replace('{EDAD}', edad);
  }
  const anclas = o.anclas.length ? `\nLo que sabés de esos años:\n${o.anclas.map((a) => `- ${a}`).join('\n')}` : '';
  const cuando = o.tramo === 'hoy' ? 'su vida de hoy' : `algo de su vida entre los ${o.desde} y los ${o.hasta} años`;
  return `${cuando}. Buscá lo que todavía no contó de esa época: una casa, un trabajo, una persona, un cambio. ${HISTORIA_GRANDE}${anclas}`;
}
```

Borrar `secuencia()` y su test (`describe('secuencia')`). `armarPromptPregunta` pasa
`objetivoEnTexto(objetivo, perfil)`. Sacar la exportación `export type { Tramo }` si nadie la usa.

- [ ] **Step 4: Correr** → PASS; `npm run tipos` limpio (el `prueba-integral.ts` que usa `secuencia`/`NUCLEO_A_PROBAR` se arregla en Task 13; mientras tanto comentar la parte rota NO es opción: ajustarlo mínimamente para que tipe, usando `objetivoEnTexto` y sin `secuencia`).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/pregunta-v2.ts entrevistador/test/pregunta-v2.test.ts entrevistador/scripts/prueba-integral.ts
git commit -m "entrevistador: el núcleo de 21 temas con la presentación, la historia grande en las variables y el objeto como tema"
```

---

### Task 4: La secuencia viva

**Files:**
- Create: `entrevistador/src/ia/secuencia.ts`
- Test: `entrevistador/test/secuencia.test.ts`

**Interfaces:**
- Consumes: `NUCLEO`, `Objetivo`, `BLOQUES`, `esPresentacion` (Task 3); `Variable`, `Tramo` (plan); `Perfil` (Task 1).
- Produces:
  ```ts
  export type Hecha = { id: string; orden: number; tramo: Tramo | null; objetivo: Objetivo }; // el objetivo entero: la evaluación lo necesita para el control de lugar
  export type Secuencia = {
    pendientes: Objetivo[];      // en el orden en que se van a preguntar
    hechas: Hecha[];             // en el orden en que se hicieron
    cubiertos: string[];         // ids de fijas que se cayeron por cubiertas
    objetos: { orden: number; tramo: Tramo }[]; // los pedidos de objeto ya hechos (orden 101+n)
    ultimoTramo: Tramo | null;   // el tramo de la última pregunta hecha
  };
  export const MAX_OBJETOS = 8;
  export function armarSecuencia(variables: Variable[]): Secuencia;
  export function proxima(s: Secuencia): Objetivo | null;          // null = terminó
  export function avanzar(s: Secuencia, o: Objetivo, orden: number): Secuencia;
  export function aplicarPerfil(s: Secuencia, perfil: Perfil, variablesNuevas?: Variable[]): Secuencia;
  export function tocaObjeto(s: Secuencia, siguiente: Objetivo, sinFotos: boolean): Tramo | null;
  export function registrarObjeto(s: Secuencia, tramo: Tramo, orden: number): Secuencia;
  export function tramoDe(o: Objetivo, perfil: Perfil): Tramo | null; // dónde lo vivió, para los "null"
  ```
  Todo puro e inmutable (devuelve copias): se guarda en `contexto.secuencia` tal cual (JSON).

- [ ] **Step 1: Tests que fallan**

```ts
import { describe, it, expect } from 'vitest';
import { armarSecuencia, proxima, avanzar, aplicarPerfil, tocaObjeto, registrarObjeto, MAX_OBJETOS } from '../src/ia/secuencia.js';
import { NUCLEO } from '../src/ia/pregunta-v2.js';
import { perfilVacio } from '../src/ia/perfil.js';
import type { Variable } from '../src/ia/plan-preguntas.js';

// La secuencia viva (diseño 23/09, §2.5): columna vertebral cronológica, pero el biógrafo elige la
// próxima si la persona abrió una puerta, y un tema fijo que ya contó se cae.

const vars: Variable[] = [
  { tramo: 'infancia', desde: 0, hasta: 12, anclas: [] },
  { tramo: 'adulto joven', desde: 23, hasta: 35, anclas: [] },
  { tramo: 'segunda mitad', desde: 56, hasta: 76, anclas: [] },
];
const ids = (s: ReturnType<typeof armarSecuencia>) => s.pendientes.map((o) => o.id);

describe('armarSecuencia', () => {
  it('presentación, casa, mapa de casas y capítulos primero; después la vida en orden (fijas del tramo antes que sus variables); un día de hoy; la reflexión al final con cinco-minutos último', () => {
    const s = armarSecuencia(vars);
    const l = ids(s);
    expect(l.slice(0, 4)).toEqual(['presentacion', 'casa-infancia', 'mapa-casas', 'mapa-capitulos']);
    expect(l.indexOf('juegos')).toBeLessThan(l.indexOf('var-infancia-1'));
    expect(l.indexOf('var-infancia-1')).toBeLessThan(l.indexOf('a-los-quince'));
    expect(l.indexOf('var-segunda mitad-1')).toBeLessThan(l.indexOf('un-dia-de-hoy'));
    expect(l.indexOf('lo-que-falta')).toBeLessThan(l.indexOf('mensaje'));
    expect(l.at(-1)).toBe('cinco-minutos');
    expect(l).toHaveLength(NUCLEO.length + vars.length);
  });
});

describe('proxima y avanzar', () => {
  it('devuelve la primera pendiente; avanzar la pasa a hechas con su orden y tramo; al final null', () => {
    let s = armarSecuencia([]);
    expect(proxima(s)?.id).toBe('presentacion');
    s = avanzar(s, proxima(s)!, 0);
    expect(proxima(s)?.id).toBe('casa-infancia');
    expect(s.hechas[0]).toMatchObject({ id: 'presentacion', orden: 0, tramo: null });
    expect(s.hechas[0].objetivo.id).toBe('presentacion');
    for (let i = 1; proxima(s); i++) s = avanzar(s, proxima(s)!, i);
    expect(proxima(s)).toBeNull();
    expect(s.hechas).toHaveLength(NUCLEO.length);
  });
});

describe('aplicarPerfil', () => {
  const pasadas = (s: ReturnType<typeof armarSecuencia>, n: number) => { for (let i = 0; i < n; i++) s = avanzar(s, proxima(s)!, i); return s; };

  it('una puerta abierta adelanta ese tema pendiente al frente (también "pruebas"), salvo el arranque y el cierre', () => {
    let s = pasadas(armarSecuencia(vars), 5); // ya pasó el inicio
    const p = perfilVacio(); p.puertaAbierta = 'pruebas';
    s = aplicarPerfil(s, p);
    expect(proxima(s)?.id).toBe('pruebas');
    // Si todavía está en el inicio, no se mueve nada.
    let t = pasadas(armarSecuencia(vars), 1);
    t = aplicarPerfil(t, p);
    expect(proxima(t)?.id).toBe('casa-infancia');
    // cinco-minutos nunca se adelanta.
    const q = perfilVacio(); q.puertaAbierta = 'cinco-minutos';
    expect(proxima(aplicarPerfil(s, q))?.id).toBe('pruebas');
  });

  it('un tema cubierto se cae y su lugar lo toma una variable de su tramo (dentro del techo)', () => {
    let s = pasadas(armarSecuencia(vars), 4);
    const p = perfilVacio(); p.cubiertos = ['amigos'];
    s = aplicarPerfil(s, p);
    expect(ids(s)).not.toContain('amigos');
    expect(s.cubiertos).toEqual(['amigos']);
    expect(s.pendientes.filter((o) => o.tipo === 'variable')).toHaveLength(vars.length + 1);
  });

  it('nunca se cae una hecha, ni los cuatro primeros, ni la reflexión', () => {
    let s = pasadas(armarSecuencia(vars), 2);
    const p = perfilVacio(); p.cubiertos = ['presentacion', 'mapa-capitulos', 'mensaje'];
    s = aplicarPerfil(s, p);
    expect(ids(s)).toContain('mapa-capitulos');
    expect(ids(s)).toContain('mensaje');
  });

  it('variables nuevas (replanificar) se suman al final de su tramo, sin repetir ids', () => {
    let s = armarSecuencia(vars);
    s = aplicarPerfil(s, perfilVacio(), [...vars, { tramo: 'adulto joven', desde: 23, hasta: 35, anclas: [] }]);
    const l = ids(s);
    expect(l.filter((x) => x.startsWith('var-adulto joven-'))).toEqual(['var-adulto joven-1', 'var-adulto joven-2']);
    expect(new Set(l).size).toBe(l.length);
  });
});

describe('objetos', () => {
  it('toca un objeto cuando la siguiente cambia de tramo, no en el inicio, hasta 8; sinFotos apaga', () => {
    let s = armarSecuencia(vars);
    for (let i = 0; i < 4; i++) s = avanzar(s, proxima(s)!, i);        // inicio hecho
    expect(tocaObjeto(s, proxima(s)!, false)).toBeNull();               // primer tramo: nada todavía
    while (proxima(s)!.id !== 'a-los-quince') s = avanzar(s, proxima(s)!, 10);
    expect(tocaObjeto(s, proxima(s)!, false)).toBe('infancia');         // se cierra la infancia
    expect(tocaObjeto(s, proxima(s)!, true)).toBeNull();
    for (let i = 0; i < MAX_OBJETOS; i++) s = registrarObjeto(s, 'infancia', 101 + i);
    expect(tocaObjeto(s, proxima(s)!, false)).toBeNull();
  });
  it('al terminar, si quedan objetos, toca uno final', () => {
    let s = armarSecuencia([]);
    while (proxima(s)) s = avanzar(s, proxima(s)!, 1);
    expect(tocaObjeto(s, null as never, false)).toBe('hoy');
  });
});
```

- [ ] **Step 2: Correr y ver que falla** → FAIL (módulo no existe).

- [ ] **Step 3: Implementar `secuencia.ts`**

```ts
import { NUCLEO, BLOQUES, esPresentacion, type Objetivo, type Bloque } from './pregunta-v2.js';
import type { Variable, Tramo } from './plan-preguntas.js';
import type { Perfil } from './perfil.js';

// La secuencia viva (diseño 23/09, §2.5). Hasta acá la lista de preguntas estaba fija de antemano y
// el biógrafo no podía moverse aunque la persona le abriera una puerta: Naza lo marcó como una de
// las causas principales de las preguntas que fallan. Ahora hay una columna vertebral cronológica y
// el biógrafo elige la próxima entre las pendientes. Todo puro: se guarda tal cual en
// `contexto.secuencia`.

export type Hecha = { id: string; orden: number; tramo: Tramo | null; objetivo: Objetivo };
export type Secuencia = {
  pendientes: Objetivo[];
  hechas: Hecha[];
  cubiertos: string[];
  objetos: { orden: number; tramo: Tramo }[];
  ultimoTramo: Tramo | null;
};

export const MAX_OBJETOS = 8;
/** Los que no se mueven ni se caen: el arranque y el cierre. */
const FIJOS_INAMOVIBLES = new Set(['presentacion', 'casa-infancia', 'mapa-casas', 'mapa-capitulos']);
const BLOQUE_REFLEXION: Bloque = 'reflexion';
/** El cierre: nunca se adelantan (la reflexión va al final), aunque se puedan "cubrir" no se caen. */
const CIERRE = new Set(['lo-que-falta', 'mensaje', 'cinco-minutos']);

const bloqueDe = (o: Objetivo): Bloque => (o.tipo === 'nucleo' ? o.bloque : o.tipo === 'variable' ? (o.tramo as Bloque) : (o.tramo as Bloque));
const posicion = (o: Objetivo) => BLOQUES.indexOf(bloqueDe(o));

function variablesConId(vs: Variable[], desde = 0): Objetivo[] {
  const cuenta = new Map<Tramo, number>();
  return vs.map((v) => {
    const n = (cuenta.get(v.tramo) ?? 0) + 1; cuenta.set(v.tramo, n);
    return { tipo: 'variable' as const, id: `var-${v.tramo}-${n + desde}`, ...v };
  });
}

/** Ordena por bloque; dentro del bloque, el orden de llegada (fijas antes que variables). */
function ordenar(objetivos: Objetivo[]): Objetivo[] {
  return objetivos.map((o, i) => ({ o, i })).sort((a, b) => posicion(a.o) - posicion(b.o) || a.i - b.i).map((x) => x.o);
}

export function armarSecuencia(variables: Variable[]): Secuencia {
  const nucleo: Objetivo[] = NUCLEO.map((n) => ({ tipo: 'nucleo' as const, ...n }));
  return { pendientes: ordenar([...nucleo, ...variablesConId(variables)]), hechas: [], cubiertos: [], objetos: [], ultimoTramo: null };
}

export function proxima(s: Secuencia): Objetivo | null {
  return s.pendientes[0] ?? null;
}

export function tramoDe(o: Objetivo, perfil: Perfil): Tramo | null {
  if (o.tipo !== 'nucleo') return o.tramo;
  if (o.tramo) return o.tramo;
  // Un tema "donde lo vivió": sin más dato, el bloque en que está.
  const b = o.bloque;
  return b === 'reflexion' || b === 'inicio' || b === 'presentacion' ? null : (b as Tramo);
}

export function avanzar(s: Secuencia, o: Objetivo, orden: number): Secuencia {
  const tramo = o.tipo === 'nucleo' ? (o.tramo ?? (['reflexion', 'inicio', 'presentacion'].includes(o.bloque) ? null : (o.bloque as Tramo))) : o.tramo;
  return {
    ...s,
    pendientes: s.pendientes.filter((p) => p.id !== o.id),
    hechas: [...s.hechas, { id: o.id, orden, tramo, objetivo: o }],
    ultimoTramo: tramo ?? s.ultimoTramo,
  };
}

const enElInicio = (s: Secuencia) => s.pendientes.some((o) => o.tipo === 'nucleo' && FIJOS_INAMOVIBLES.has(o.id));

/**
 * Lo que el perfil de hoy le dice a la secuencia: un tema cubierto se cae (y una variable de su
 * tramo toma su día), una puerta abierta adelanta ese tema al frente, y las variables nuevas de un
 * replanificar se suman. Nada de esto toca los cuatro primeros ni la reflexión.
 */
export function aplicarPerfil(s: Secuencia, perfil: Perfil, variablesNuevas?: Variable[]): Secuencia {
  let pendientes = [...s.pendientes];
  const cubiertos = [...s.cubiertos];
  const puedeCaerse = (o: Objetivo) => o.tipo === 'nucleo' && !FIJOS_INAMOVIBLES.has(o.id) && o.bloque !== BLOQUE_REFLEXION;

  for (const id of perfil.cubiertos) {
    const o = pendientes.find((p) => p.id === id);
    if (!o || !puedeCaerse(o)) continue;
    pendientes = pendientes.filter((p) => p.id !== id);
    cubiertos.push(id);
    const tramo = (o.tipo === 'nucleo' && o.tramo) ? o.tramo : (o.tipo === 'nucleo' ? (o.bloque as Tramo) : null);
    if (tramo && total(s) < 40) {
      const n = pendientes.filter((p) => p.tipo === 'variable' && p.tramo === tramo).length + s.hechas.filter((h) => h.id.startsWith(`var-${tramo}-`)).length + 1;
      const rango = RANGO[tramo] ?? [0, 200];
      pendientes.push({ tipo: 'variable', id: `var-${tramo}-${n}`, tramo, desde: rango[0], hasta: rango[1], anclas: [] });
    }
  }

  if (variablesNuevas) {
    const existentes = new Set(pendientes.filter((p) => p.tipo === 'variable').map((p) => p.id).concat(s.hechas.map((h) => h.id)));
    const yaHay = (t: Tramo) => [...existentes].filter((id) => id.startsWith(`var-${t}-`)).length;
    const porTramo = new Map<Tramo, Variable[]>();
    for (const v of variablesNuevas) porTramo.set(v.tramo, [...(porTramo.get(v.tramo) ?? []), v]);
    for (const [tramo, vs] of porTramo) {
      const faltan = vs.slice(yaHay(tramo));
      pendientes.push(...variablesConId(faltan, yaHay(tramo)));
    }
  }

  pendientes = ordenar(pendientes);

  if (perfil.puertaAbierta && !enElInicio(s)) {
    const o = pendientes.find((p) => p.id === perfil.puertaAbierta);
    const puedeAdelantarse = o && !(o.tipo === 'nucleo' && (FIJOS_INAMOVIBLES.has(o.id) || CIERRE.has(o.id)));
    if (o && puedeAdelantarse) pendientes = [o, ...pendientes.filter((p) => p.id !== o.id)];
  }
  return { ...s, pendientes, cubiertos };
}

const RANGO: Record<Tramo, [number, number]> = {
  infancia: [0, 12], juventud: [13, 22], 'adulto joven': [23, 35], 'adultez media': [36, 55], 'segunda mitad': [56, 200], hoy: [0, 200],
};
const total = (s: Secuencia) => s.pendientes.length + s.hechas.length;

/** Un objeto cuando la siguiente pregunta cambia de tramo (se cerró uno), o uno final cuando terminó. */
export function tocaObjeto(s: Secuencia, siguiente: Objetivo | null, sinFotos: boolean): Tramo | null {
  if (sinFotos || s.objetos.length >= MAX_OBJETOS || s.ultimoTramo === null) return null;
  if (siguiente === null) return s.objetos.some((o) => o.tramo === s.ultimoTramo) ? null : s.ultimoTramo;
  if (enElInicio(s)) return null;
  const tramoSiguiente = siguiente.tipo === 'nucleo' ? siguiente.tramo ?? (siguiente.bloque as Tramo) : siguiente.tramo;
  if (tramoSiguiente === s.ultimoTramo) return null;
  return s.objetos.some((o) => o.tramo === s.ultimoTramo) ? null : s.ultimoTramo;
}

export function registrarObjeto(s: Secuencia, tramo: Tramo, orden: number): Secuencia {
  return { ...s, objetos: [...s.objetos, { orden, tramo }] };
}
```

Ajustar hasta que los tests pasen sin cambiar su intención (en especial la cuenta de tramos en el
test de objetos: el objeto de la infancia toca cuando la próxima es `a-los-quince` y
`ultimoTramo` es `infancia`).

- [ ] **Step 4: Correr** → PASS. `npm run tipos` limpio.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/secuencia.ts entrevistador/test/secuencia.test.ts
git commit -m "entrevistador: la secuencia viva — el biógrafo elige la próxima, un tema cubierto se cae, los objetos por cambio de tramo"
```

---

### Task 5: El encargo reescrito de una vez

**Files:**
- Modify: `entrevistador/src/ia/encargo-entrevista.ts`
- Test: `entrevistador/test/evaluar-v2.test.ts` (sección `encargoDelBiografo`) y `entrevistador/test/pregunta-v2.test.ts`

**Interfaces:**
- Consumes: `Perfil` con `castellano`, `hoyFueFuerte`, `comoLeDicen` (Task 1).
- Produces: `encargoDelBiografo(p: Perfil, evitar: string[] = []): string` (misma firma, texto nuevo);
  `controlarTexto(texto: string, trato: TratoControlable | null, opciones?: { presentacion?: boolean })`
  (presentación: hasta 90 palabras y sin exigir signo de pregunta).
  `MAX_PALABRAS = 50`, `MAX_PALABRAS_PRESENTACION = 90`.

- [ ] **Step 1: Tests que fallan**

En `evaluar-v2.test.ts`, dentro de `describe('encargoDelBiografo')`:

```ts
  it('dice su castellano y ofrece el trato que corresponde', () => {
    const esp = encargoDelBiografo(perfilDe({}, { castellano: 'españa' }));
    expect(esp).toMatch(/castellano de España/);
    expect(esp).not.toMatch(/rioplatense/);
    expect(encargoDelBiografo(perfilDe({}))).toMatch(/rioplatense/);
  });

  it('si hoy fue fuerte, pide reconocerlo antes de preguntar y no tirarle otro tema pesado', () => {
    const t = encargoDelBiografo(perfilDe({}, { hoyFueFuerte: true }));
    expect(t).toMatch(/reconoc[eé]/i);
    expect(t).toMatch(/otro tema pesado/i);
    expect(encargoDelBiografo(perfilDe({}))).not.toMatch(/otro tema pesado/i);
  });

  it('el puente reemplaza al "enganchá": la pregunta va a lo que todavía no contó', () => {
    const t = encargoDelBiografo(perfilDe({}));
    expect(t).not.toMatch(/enganch/i);
    expect(t).toMatch(/sirve de puente/i);
    expect(t).toMatch(/lo que todavía no contó/i);
  });

  it('usa cómo le dicen si se sabe', () => {
    expect(encargoDelBiografo(perfilDe({ comoLeDicen: { valor: 'Tito', fuente: 'dicho' } }))).toContain('Tito');
  });

  it('la presentación admite 90 palabras y no exige signo de pregunta', () => {
    const larga = `${'palabra '.repeat(80)}.`;
    expect(controlarTexto(larga, 'vos').ok).toBe(false);
    expect(controlarTexto(larga, 'vos', { presentacion: true })).toEqual({ ok: true });
    expect(controlarTexto(`${'palabra '.repeat(95)}.`, 'vos', { presentacion: true }).ok).toBe(false);
  });
```

En `pregunta-v2.test.ts`, en `armarPromptPregunta`: reemplazar la aserción de "Enganchá" (si la
hubiera) por `expect(p).not.toMatch(/enganch/i)`.

- [ ] **Step 2: Correr** → FAIL.

- [ ] **Step 3: Implementar**

`comoHablarle(p)`: la línea del trato ahora respeta `castellano` ("Todavía no sabés cómo prefiere
que le hablen: usá usted, cálido y sin formalidad de oficina" sigue igual); suma
`Su castellano es ${p.castellano === 'españa' ? 'el de España' : p.castellano === 'latinoamerica' ? 'el de Latinoamérica' : 'rioplatense'}: escribile así, con sus palabras, no con las tuyas.`
y, si `p.persona.comoLeDicen`, `Le dicen ${valor}: usalo.`. Si `p.hoyFueFuerte`:
`Hoy contó algo que le costó. Mañana, antes de preguntar, reconocelo en una frase (no lo repitas, no lo analices), y no le tires encima otro tema pesado.`

`encargoDelBiografo` reescribe "LO QUE SE RESPETA SIEMPRE" así (texto final, lo aprueba Naza):

```
LO QUE SE RESPETA SIEMPRE
1. No supongas nada que tu ficha no diga: ni pareja, ni hijos, ni nietos, ni que alguien vive o
   murió, ni que la infancia fue linda, ni que salía, ni que viajó. Si hace falta saberlo, se
   pregunta, con cuidado.
2. Nunca le pidas lo que ya contó. Si algo que contó sirve de puente, usalo en una frase; la
   pregunta va a lo que todavía no contó.
3. Si pidió dejar un tema, no se vuelve ahí nunca más, de ninguna forma.
4. Si pidió que algo no vaya al libro, se respeta: eso no se toca.
5. Si una época fue dura, no la adornes: preguntá por lo que había, quién estaba, qué le dio sostén.
6. No abras con algo que nombró de pasada y duele o avergüenza (el alcohol, una pelea, una
   enfermedad): si lo trae, se escucha; no lo convertís vos en el tema.
7. Pedí una escena, no un resumen: un día, un lugar, una persona concreta. Y en el lugar y la
   época en que pasó: la ciudad que tu ficha tiene para esos años, no otra.
8. Una pregunta clara (dos como mucho, si van juntas), de hasta 45 palabras: la lee en el
   celular. La presentación es la excepción: hasta 90.
```

`controlarTexto(texto, trato, opciones = {})`:

```ts
export const MAX_PALABRAS = 50;
export const MAX_PALABRAS_PRESENTACION = 90;
export function controlarTexto(texto: string, trato: TratoControlable | null, opciones: { presentacion?: boolean } = {}): { ok: true } | { ok: false; motivo: string } {
  const t = texto.trim();
  const tope = opciones.presentacion ? MAX_PALABRAS_PRESENTACION : MAX_PALABRAS;
  if (!opciones.presentacion && contarPreguntas(t) === 0) return { ok: false, motivo: 'no tiene ninguna pregunta' };
  if (contarPalabras(t) > tope) return { ok: false, motivo: `tiene ${contarPalabras(t)} palabras (máximo ${tope})` };
  …
```

- [ ] **Step 4: Correr** → PASS. Tipos limpios.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/encargo-entrevista.ts entrevistador/test/evaluar-v2.test.ts entrevistador/test/pregunta-v2.test.ts
git commit -m "entrevistador: el encargo reescrito — su castellano, el tacto después de algo fuerte, el puente en vez del enganche"
```

---

### Task 6: Los controles de lugar/época y supuestos, tres intentos y la marca

**Files:**
- Create: `entrevistador/src/ia/control-pregunta.ts`
- Modify: `entrevistador/src/ia/pregunta-v2.ts` (`escribirPregunta`)
- Test: `entrevistador/test/control-pregunta.test.ts`, `entrevistador/test/pregunta-v2.test.ts`

**Interfaces:**
- Consumes: `Perfil`, `rangoDeEtapa` (plan), `controlarTexto`/`tratoDelPerfil` (encargo), `Objetivo`, `esPresentacion`.
- Produces:
  ```ts
  export type Rechazo = { ok: false; control: 'trato' | 'largo' | 'pregunta' | 'lugar' | 'supuestos'; motivo: string };
  export type Marca = { control: string; motivo: string; intentos: number };
  export const INTENTOS = 3;
  export function controlarLugar(texto: string, perfil: Perfil, objetivo: Objetivo): { ok: true } | Rechazo;
  export function controlarSupuestos(texto: string, perfil: Perfil): { ok: true } | Rechazo;
  export function controlarPregunta(texto: string, perfil: Perfil, objetivo: Objetivo): { ok: true } | Rechazo;
  ```
  `escribirPregunta(cliente, perfil, objetivo, conversacion, yaHechas, evitar = [])` devuelve
  `{ texto: string; ok: boolean; marca?: Marca; usos: Anthropic.Usage[] }`: hasta 3 intentos; el 2.º y el 3.º llevan el motivo; si el 3.º falla, `ok: false` con `marca` y el texto del último intento (se manda igual).

- [ ] **Step 1: Tests que fallan**

`control-pregunta.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { controlarLugar, controlarSupuestos, controlarPregunta } from '../src/ia/control-pregunta.js';
import { perfilVacio, type Perfil } from '../src/ia/perfil.js';
import type { Objetivo } from '../src/ia/pregunta-v2.js';

// Los dos controles nuevos (diseño §2.7). C6: cuatro veces se mandó a Ciro a la ciudad equivocada;
// C12/C13/35: hijos, boda y esposa dados por hecho. Son controles sobre la salida, gratis.

function ciro(): Perfil {
  const p = perfilVacio();
  p.persona.edad = { valor: '28', fuente: 'dicho' };
  p.etapas = [
    { edades: '0 a 12', lugar: 'Concordia', conQuien: 'la madre y la abuela', queHacia: 'la escuela', fuente: 'dicho' },
    { edades: 'desde los 12', lugar: 'Buenos Aires (Núñez)', conQuien: 'el padre', queHacia: '', fuente: 'dicho' },
  ];
  return p;
}
const variable = (desde: number, hasta: number): Objetivo => ({ tipo: 'variable', id: 'v', tramo: 'juventud', desde, hasta, anclas: [] });

describe('controlarLugar', () => {
  it('rechaza la ciudad equivocada para esos años, y dice cuál es la correcta', () => {
    const r = controlarLugar('¿Cómo eran esos sábados en Concordia a tus 16?', ciro(), variable(13, 22));
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.control).toBe('lugar'); expect(r.motivo).toMatch(/Buenos Aires/); expect(r.motivo).toMatch(/Concordia/); }
  });
  it('acepta la ciudad correcta, una ciudad de la época que abarca el tramo, y preguntas sin ciudad', () => {
    expect(controlarLugar('¿Cómo eran esos sábados en Buenos Aires a tus 16?', ciro(), variable(13, 22)).ok).toBe(true);
    expect(controlarLugar('¿Cómo era la casa de Concordia?', ciro(), variable(0, 12)).ok).toBe(true);
    expect(controlarLugar('¿Con quién jugabas?', ciro(), variable(0, 12)).ok).toBe(true);
  });
  it('acentos y mayúsculas no importan; sin etapas en el perfil no controla; un tema sin tramo no controla', () => {
    expect(controlarLugar('¿Y en CONCORDIA?', ciro(), variable(0, 12)).ok).toBe(true);
    expect(controlarLugar('¿Y en Concordia?', perfilVacio(), variable(13, 22)).ok).toBe(true);
    expect(controlarLugar('¿Y en Concordia?', ciro(), { tipo: 'nucleo', id: 'amor', tramo: null, bloque: 'adulto joven', tema: '' } as never).ok).toBe(true);
  });
});

describe('controlarSupuestos', () => {
  it('rechaza hijos, nietos, esposa/marido, boda o novia sin respaldo en el perfil', () => {
    for (const t of ['¿Cómo eran tus hijos de chicos?', '¿Qué le dirías a un nieto?', '¿Cómo conociste a tu esposa?', '¿Cómo fue la boda?', '¿La llegaste a presentar a tu novia en casa?']) {
      const r = controlarSupuestos(t, perfilVacio());
      expect(r.ok, t).toBe(false);
      if (!r.ok) expect(r.control).toBe('supuestos');
    }
  });
  it('acepta lo que el perfil respalda (dicho o ficha) y las preguntas que preguntan SI hubo', () => {
    const p = perfilVacio();
    p.personas = [{ nombre: 'Rubén', vinculo: 'marido', vive: 'no', fuente: 'dicho' }, { nombre: 'Ana y Luis', vinculo: 'hijos', vive: 'si', fuente: 'ficha' }];
    expect(controlarSupuestos('¿Cómo conociste a tu marido, Rubén?', p).ok).toBe(true);
    expect(controlarSupuestos('¿Cómo eran tus hijos de chicos?', p).ok).toBe(true);
    expect(controlarSupuestos('¿Tuviste hijos?', perfilVacio()).ok).toBe(true);
    expect(controlarSupuestos('¿Te enamoraste alguna vez?', perfilVacio()).ok).toBe(true);
  });
});

describe('controlarPregunta (todos juntos)', () => {
  it('trato, largo, pregunta, lugar y supuestos, en ese orden; y la presentación solo largo y trato', () => {
    const p = ciro(); p.persona.comoHabla = { valor: 'vos', fuente: 'dicho' };
    expect(controlarPregunta('Cuénteme de Concordia.', p, variable(13, 22))).toMatchObject({ ok: false, control: 'trato' });
    expect(controlarPregunta('¿Y tus hijos en Concordia a los 16?', p, variable(13, 22))).toMatchObject({ ok: false, control: 'lugar' });
    expect(controlarPregunta('¿Y tus hijos en Buenos Aires a los 16?', p, variable(13, 22))).toMatchObject({ ok: false, control: 'supuestos' });
    expect(controlarPregunta('Hola, soy tu biógrafo. Voy a escribir el libro de tu vida con lo que me cuentes. Decime cómo te dicen en casa.', p, { tipo: 'nucleo', id: 'presentacion', tramo: null, bloque: 'presentacion', tema: '' } as never)).toEqual({ ok: true });
  });
});
```

En `pregunta-v2.test.ts`, `describe('escribirPregunta')` suma:

```ts
  it('tres intentos con el motivo; si el tercero falla, se manda igual, marcada', async () => {
    const malo = { content: [{ type: 'text', text: 'Cuénteme de su casa: ¿qué veía?' }], usage: { input_tokens: 1, output_tokens: 1 } };
    const create = vi.fn().mockResolvedValue(malo);
    const r = await escribirPregunta({ messages: { create } } as never, perfilDe({ comoHabla: { valor: 'vos', fuente: 'dicho' } }), nucleo(1), [], []);
    expect(create).toHaveBeenCalledTimes(3);
    expect(r.ok).toBe(false);
    expect(r.marca).toMatchObject({ control: 'trato', intentos: 3 });
    expect(r.texto).toBe('Cuénteme de su casa: ¿qué veía?');
    expect(JSON.stringify(create.mock.calls[2])).toContain('no sirvió porque');
  });

  it('el control de lugar corre sobre la salida (C6)', async () => {
    const create = vi.fn()
      .mockResolvedValueOnce({ content: [{ type: 'text', text: '¿Cómo eran tus sábados en Concordia a los 16?' }], usage: { input_tokens: 1, output_tokens: 1 } })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: '¿Cómo eran tus sábados en Buenos Aires a los 16?' }], usage: { input_tokens: 1, output_tokens: 1 } });
    const p = perfilDe({ comoHabla: { valor: 'vos', fuente: 'dicho' } });
    p.etapas = [{ edades: '0 a 12', lugar: 'Concordia', conQuien: '', queHacia: '', fuente: 'dicho' }, { edades: 'desde los 12', lugar: 'Buenos Aires', conQuien: '', queHacia: '', fuente: 'dicho' }];
    p.persona.edad = { valor: '28', fuente: 'dicho' };
    const r = await escribirPregunta({ messages: { create } } as never, p, { tipo: 'variable', id: 'v', tramo: 'juventud', desde: 13, hasta: 22, anclas: [] }, [], []);
    expect(r.ok).toBe(true);
    expect(r.texto).toContain('Buenos Aires');
  });
```

- [ ] **Step 2: Correr** → FAIL.

- [ ] **Step 3: Implementar `control-pregunta.ts`**

```ts
import type { Perfil } from './perfil.js';
import { rangoDeEtapa, edadDe } from './plan-preguntas.js';
import { controlarTexto, tratoDelPerfil } from './encargo-entrevista.js';
import type { Objetivo } from './pregunta-v2.js';

const esPresentacion = (o: Objetivo) => o.tipo === 'nucleo' && o.id === 'presentacion';

export type Rechazo = { ok: false; control: 'trato' | 'largo' | 'pregunta' | 'lugar' | 'supuestos'; motivo: string };
export type Marca = { control: string; motivo: string; intentos: number };
export const INTENTOS = 3;

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** "Buenos Aires (Núñez)" → ["buenos aires", "nunez"]: la ciudad y lo que va entre paréntesis. */
function nombresDeLugar(lugar: string): string[] {
  return sinAcentos(lugar).split(/[(),/]| y /).map((x) => x.trim()).filter((x) => x.length >= 3);
}

/** La ciudad que el perfil tiene para el rango de años del objetivo, o null si no se puede saber. */
export function controlarLugar(texto: string, perfil: Perfil, objetivo: Objetivo): { ok: true } | Rechazo {
  if (objetivo.tipo === 'nucleo' && !objetivo.tramo) return { ok: true };
  if (objetivo.tipo === 'objeto') return { ok: true };
  const edad = edadDe(perfil, new Date().getFullYear()) ?? 100;
  const etapas = perfil.etapas.map((e) => ({ rango: rangoDeEtapa(e.edades, edad), nombres: nombresDeLugar(e.lugar) })).filter((e) => e.rango && e.nombres.length);
  if (!etapas.length) return { ok: true };
  const [desde, hasta] = objetivo.tipo === 'variable' ? [objetivo.desde, objetivo.hasta] : (RANGO_TRAMO[objetivo.tramo!] ?? [0, 200]);
  const limpio = sinAcentos(texto);
  const nombrados = etapas.flatMap((e) => e.nombres.filter((n) => limpio.includes(n)));
  if (!nombrados.length) return { ok: true };
  const deLaEpoca = etapas.filter((e) => e.rango![0] <= hasta && e.rango![1] >= desde).flatMap((e) => e.nombres);
  const ajenos = nombrados.filter((n) => !deLaEpoca.includes(n));
  if (!ajenos.length) return { ok: true };
  return { ok: false, control: 'lugar', motivo: `entre los ${desde} y los ${hasta} años vivía en ${deLaEpoca.join(' / ') || 'otro lado'}, no en ${ajenos.join(', ')}` };
}

const RANGO_TRAMO: Record<string, [number, number]> = { infancia: [0, 12], juventud: [13, 22], 'adulto joven': [23, 35], 'adultez media': [36, 55], 'segunda mitad': [56, 200], hoy: [0, 200] };

/** Palabras que dan por hecho una vida, y qué tiene que haber en el perfil para que valgan. */
const SUPUESTOS: { re: RegExp; vinculos: RegExp; nombre: string }[] = [
  { re: /\b(tus|sus) hij[oa]s?\b|\bhij[oa]s? de chic[oa]s?\b/, vinculos: /hij/, nombre: 'hijos' },
  { re: /\bniet[oa]s?\b/, vinculos: /niet/, nombre: 'nietos' },
  { re: /\b(tu|su) (esposa|esposo|marido|mujer|señora|pareja|novia|novio)\b/, vinculos: /espos|marido|mujer|pareja|novi|conyuge|cónyuge/, nombre: 'pareja' },
  { re: /\b(la boda|el casamiento|te casaste|se cas[oó])\b/, vinculos: /espos|marido|mujer|conyuge|cónyuge/, nombre: 'boda' },
];
/** Preguntar SI hubo no es suponer. */
const PREGUNTA_SI_HUBO = /\b(tuviste|tuvo|hubo|te enamoraste|se enamoró|alguna vez)\b/;

export function controlarSupuestos(texto: string, perfil: Perfil): { ok: true } | Rechazo {
  const limpio = sinAcentos(texto);
  if (PREGUNTA_SI_HUBO.test(limpio)) return { ok: true };
  const vinculos = perfil.personas.map((p) => sinAcentos(p.vinculo)).join(' ');
  for (const s of SUPUESTOS) {
    if (s.re.test(limpio) && !s.vinculos.test(vinculos)) {
      return { ok: false, control: 'supuestos', motivo: `supone ${s.nombre} y la ficha no dice que los tenga: preguntá si hubo, o no lo nombres` };
    }
  }
  return { ok: true };
}

export function controlarPregunta(texto: string, perfil: Perfil, objetivo: Objetivo): { ok: true } | Rechazo {
  const presentacion = esPresentacion(objetivo);
  const forma = controlarTexto(texto, tratoDelPerfil(perfil), { presentacion });
  if (!forma.ok) {
    const control = /habla de otra manera/.test(forma.motivo) ? 'trato' : /palabras/.test(forma.motivo) ? 'largo' : 'pregunta';
    return { ok: false, control, motivo: forma.motivo };
  }
  if (presentacion) return { ok: true };
  const lugar = controlarLugar(texto, perfil, objetivo);
  if (!lugar.ok) return lugar;
  return controlarSupuestos(texto, perfil);
}
```

En `pregunta-v2.ts`, `escribirPregunta`:

```ts
import { controlarPregunta, INTENTOS, type Marca } from './control-pregunta.js';
…
  let ultimo: { control: string; motivo: string } | null = null;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    const contenido = intento === 1 ? prompt : `${prompt}\n\nTu versión anterior no sirvió porque ${ultimo!.motivo}. Escribila de nuevo, cuidando eso.`;
    const r = await cliente.messages.create({ model: MODELO, max_tokens: 400, messages: [{ role: 'user', content: contenido }] });
    usos.push(r.usage);
    const bloque = r.content.find((b) => b.type === 'text');
    texto = (bloque && bloque.type === 'text' ? bloque.text : '').trim().replace(/^["«]|["»]$/g, '');
    const control = controlarPregunta(texto, perfil, objetivo);
    if (control.ok) return { texto, ok: true, usos };
    ultimo = control;
  }
  return { texto, ok: false, marca: { ...ultimo!, intentos: INTENTOS }, usos };
```

(`control-pregunta.ts` y `pregunta-v2.ts` se importan mutuamente: para que no haya ciclo en tiempo de
ejecución, `control-pregunta.ts` importa de `pregunta-v2.ts` **solo tipos** (`import type { Objetivo }`)
y comprueba la presentación localmente: `const esPresentacion = (o: Objetivo) => o.tipo === 'nucleo' && o.id === 'presentacion';`.)

- [ ] **Step 4: Correr** → PASS. Tipos limpios.

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/control-pregunta.ts entrevistador/src/ia/pregunta-v2.ts entrevistador/test/control-pregunta.test.ts entrevistador/test/pregunta-v2.test.ts
git commit -m "entrevistador: controles de lugar/época y de supuestos sobre la salida, tres intentos y la marca"
```

---

### Task 7: La evaluación: salida validada, hoy no, no quiero seguir, cansancio

**Files:**
- Modify: `entrevistador/src/ia/evaluar-v2.ts`
- Test: `entrevistador/test/evaluar-v2.test.ts`

**Interfaces:**
- Consumes: `controlarPregunta`, `INTENTOS`, `Marca` (Task 6); `Objetivo` (para el control de lugar de la repregunta se pasa el objetivo de la pregunta de hoy).
- Produces:
  ```ts
  export type EvaluacionV2 = { suficiente: boolean; repregunta?: string; reservado?: boolean; reservadoTramo?: string; dejarTema?: string; hoyNo?: boolean; quiereParar?: boolean };
  export function parsearEvaluacion(salida: string): EvaluacionV2;  // valida por campo
  export function hayCansancio(ultimasRepreguntas: { contestada: boolean }[]): boolean; // las dos últimas sin contestar
  export const DIAS_SIN_REPREGUNTAR = 3;
  export async function evaluarV2(cliente, perfil, objetivo: Objetivo, pregunta, respuesta, segundos, conversacion, evitar): Promise<{ evaluacion: EvaluacionV2; marca?: Marca; usos: Anthropic.Usage[] }>;
  ```

- [ ] **Step 1: Tests que fallan**

```ts
describe('parsearEvaluacion valida por campo', () => {
  it('ignora lo que viene con el tipo equivocado', () => {
    const r = parsearEvaluacion('{"suficiente": false, "repregunta": 42, "reservado": "sí", "dejarTema": true, "hoyNo": "no", "quiereParar": true}');
    expect(r).toEqual({ suficiente: false, quiereParar: true });
  });
  it('lee hoyNo y quiereParar', () => {
    expect(parsearEvaluacion('{"suficiente": true, "hoyNo": true}')).toEqual({ suficiente: true, hoyNo: true });
  });
});

describe('hayCansancio', () => {
  it('las dos últimas repreguntas sin contestar → cansancio; una sola, no', () => {
    expect(hayCansancio([{ contestada: true }, { contestada: false }, { contestada: false }])).toBe(true);
    expect(hayCansancio([{ contestada: false }, { contestada: true }])).toBe(false);
    expect(hayCansancio([])).toBe(false);
  });
});

describe('el prompt de la evaluación', () => {
  it('distingue "hoy no" de "no quiero seguir" y de "vamos por otro lado"', () => {
    const p = armarPromptEvaluar(perfilDe(), '¿?', '…', 5, [], []);
    expect(p).toContain('"hoyNo"');
    expect(p).toContain('"quiereParar"');
    expect(p).toContain('"dejarTema"');
  });
});

describe('evaluarV2 con marca', () => {
  it('si la repregunta falla tres veces, queda marcada y se devuelve igual', async () => {
    const malo = '{"suficiente": false, "repregunta": "¿Cómo se llamaba? Cuénteme de ella."}';
    const { cliente: c, create } = cliente([malo, malo, malo]);
    const r = await evaluarV2(c, perfilDe({ comoHabla: { valor: 'vos', fuente: 'dicho' } }), objetivoDePrueba, '¿Su abuela?', 'Sí.', 5, [], []);
    expect(create).toHaveBeenCalledTimes(3);
    expect(r.marca).toMatchObject({ control: 'trato', intentos: 3 });
    expect(r.evaluacion.repregunta).toContain('Cuénteme');
  });
});
```

(`objetivoDePrueba` = `{ tipo: 'nucleo', id: 'padres', tramo: 'infancia', bloque: 'infancia', tema: '' } as never`. Actualizar los tests existentes de `evaluarV2` a la firma nueva.)

- [ ] **Step 2: Correr** → FAIL.

- [ ] **Step 3: Implementar**

`PROMPT_EVALUAR_V2` suma, después del bloque "Si pidió cambiar de tema":

```
- Si dice que HOY no puede ("hoy no", "mañana te contesto", "estoy cansado hoy"): alcanza, sin
  repregunta, y "hoyNo": true. No es dejar un tema: mañana se retoma la misma pregunta.
- Si dice que no quiere seguir con la entrevista ("no quiero seguir", "dejemos esto", "no me
  manden más"): alcanza, sin repregunta, y "quiereParar": true. No lo convenzas: el biógrafo no
  decide solo; avisa a la familia.
```

y en la línea del JSON: `"hoyNo" y "quiereParar" cuando corresponda`.

```ts
export function parsearEvaluacion(salida: string): EvaluacionV2 {
  try {
    const limpio = salida.trim();
    const c = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1)) as Record<string, unknown>;
    if (typeof c?.suficiente !== 'boolean') return { suficiente: true };
    const e: EvaluacionV2 = { suficiente: c.suficiente };
    if (typeof c.repregunta === 'string' && c.repregunta.trim()) e.repregunta = c.repregunta.trim();
    if (c.reservado === true) e.reservado = true;
    if (typeof c.reservadoTramo === 'string' && c.reservadoTramo.trim()) e.reservadoTramo = c.reservadoTramo.trim();
    if (typeof c.dejarTema === 'string' && c.dejarTema.trim()) e.dejarTema = c.dejarTema.trim();
    if (c.hoyNo === true) e.hoyNo = true;
    if (c.quiereParar === true) e.quiereParar = true;
    return e;
  } catch { return { suficiente: true }; }
}

export const DIAS_SIN_REPREGUNTAR = 3;
/** Cansancio: si las dos últimas repreguntas quedaron sin contestar, no se repregunta por unos días. */
export function hayCansancio(ultimasRepreguntas: { contestada: boolean }[]): boolean {
  const dos = ultimasRepreguntas.slice(-2);
  return dos.length === 2 && dos.every((r) => !r.contestada);
}
```

`evaluarV2(cliente, perfil, objetivo, pregunta, respuesta, segundos, conversacion, evitar)`: el
bucle va hasta `INTENTOS`; el control es `controlarPregunta(evaluacion.repregunta, perfil, objetivo)`;
al fallar el tercero devuelve `{ evaluacion, marca: { ...ultimo, intentos: INTENTOS }, usos }`.
`reservado` pasa a ser solo boolean (el tramo va aparte, como ya estaba).

- [ ] **Step 4: Correr** → PASS. Tipos (ajustar `prueba-integral.ts` a la firma).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/src/ia/evaluar-v2.ts entrevistador/test/evaluar-v2.test.ts entrevistador/scripts/prueba-integral.ts
git commit -m "entrevistador: la evaluación valida lo que devuelve, entiende \"hoy no\" y \"no quiero seguir\", y sabe del cansancio"
```

---

### Task 8: La puerta manual v2 (Naza de narrador)

**Files:**
- Create: `entrevistador/scripts/manual-v2.ts`
- Create: `entrevistador/src/manual/estado-v2.ts` (lo puro: leer/escribir `contexto.perfil`, `contexto.secuencia`, `contexto.marcas`)
- Modify: `entrevistador/package.json` (script `"manual-v2": "tsx scripts/manual-v2.ts"`)
- Test: `entrevistador/test/estado-v2.test.ts`

**Interfaces:**
- Consumes: todo lo anterior; `guardarRespuestaAudio` (`src/db/respuestas.ts`), `transcribirYActualizar` (`src/ia/transcribir.ts`), `promptDeTranscripcion`, `slug`, `castellanoDe` (`src/manual/puro.ts`), `buscarCruce` (`src/db/duplicados.ts`), `guardarReserva`.
- Produces (`estado-v2.ts`):
  ```ts
  export type EstadoV2 = { perfil: Perfil; secuencia: Secuencia; marcas: Record<string, Marca>; preguntasEnviadas: Record<string, string>; repreguntasEnviadas: Record<string, string>; sinRepreguntarHasta?: string };
  export function leerEstado(contexto: Record<string, any>, zonaHoraria: string): EstadoV2 | null; // null si no empezó
  export function estadoNuevo(contexto: Record<string, any>, zonaHoraria: string): EstadoV2;      // perfilDesdeFicha + secuencia con plan vacío
  export function contextoConEstado(contexto: Record<string, any>, estado: EstadoV2): Record<string, any>; // mezcla sin pisar otras claves
  export function planSiHaceFalta(estado: EstadoV2): EstadoV2; // si hay edad y la secuencia no tiene variables, planifica; si cambiaron las bisagras, replanifica
  ```

- [ ] **Step 1: Tests que fallan (`estado-v2.test.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { estadoNuevo, leerEstado, contextoConEstado, planSiHaceFalta } from '../src/manual/estado-v2.js';
import { proxima } from '../src/ia/secuencia.js';

describe('estado-v2 (lo que la puerta manual v2 guarda en contexto)', () => {
  it('nace con el perfil de la ficha y la secuencia sin variables; la primera es la presentación', () => {
    const e = estadoNuevo({ anioNacimiento: 1999, trato: 'vos' }, 'America/Argentina/Buenos_Aires');
    expect(e.perfil.persona.anioNacimiento?.valor).toBe('1999');
    expect(proxima(e.secuencia)?.id).toBe('presentacion');
    expect(e.secuencia.pendientes.filter((o) => o.tipo === 'variable')).toHaveLength(0);
  });
  it('planifica recién cuando hay edad, y no dos veces', () => {
    const sin = planSiHaceFalta(estadoNuevo({}, 'America/Argentina/Buenos_Aires'));
    expect(sin.secuencia.pendientes.filter((o) => o.tipo === 'variable')).toHaveLength(0);
    const con = planSiHaceFalta(estadoNuevo({ anioNacimiento: 1999 }, 'America/Argentina/Buenos_Aires'));
    const vars = con.secuencia.pendientes.filter((o) => o.tipo === 'variable').length;
    expect(vars).toBeGreaterThanOrEqual(8);
    expect(planSiHaceFalta(con).secuencia.pendientes.filter((o) => o.tipo === 'variable')).toHaveLength(vars);
  });
  it('va y vuelve del contexto sin pisar otras claves', () => {
    const e = estadoNuevo({}, 'Europe/Madrid');
    const c = contextoConEstado({ modoRapido: true, evitar: 'x' }, e);
    expect(c.modoRapido).toBe(true);
    expect(leerEstado(c, 'Europe/Madrid')?.perfil.castellano).toBe('españa');
    expect(leerEstado({}, 'Europe/Madrid')).toBeNull();
  });
});
```

- [ ] **Step 2: Correr** → FAIL.

- [ ] **Step 3: Implementar `estado-v2.ts` y `manual-v2.ts`**

`estado-v2.ts`:

```ts
import { perfilDesdeFicha, type Perfil } from '../ia/perfil.js';
import { armarSecuencia, aplicarPerfil, type Secuencia } from '../ia/secuencia.js';
import { planificar, replanificar, type Variable } from '../ia/plan-preguntas.js';
import { NUCLEO } from '../ia/pregunta-v2.js';
import type { Marca } from '../ia/control-pregunta.js';

export type EstadoV2 = { perfil: Perfil; secuencia: Secuencia; marcas: Record<string, Marca>; preguntasEnviadas: Record<string, string>; repreguntasEnviadas: Record<string, string>; sinRepreguntarHasta?: string; bisagrasPlanificadas: number };

export function estadoNuevo(contexto: Record<string, any>, zonaHoraria: string): EstadoV2 {
  return { perfil: perfilDesdeFicha(contexto, zonaHoraria), secuencia: armarSecuencia([]), marcas: {}, preguntasEnviadas: {}, repreguntasEnviadas: {}, bisagrasPlanificadas: -1 };
}
export function leerEstado(contexto: Record<string, any>, zonaHoraria: string): EstadoV2 | null {
  const v2 = contexto?.v2;
  if (!v2 || typeof v2 !== 'object' || !v2.perfil || !v2.secuencia) return null;
  return { ...estadoNuevo(contexto, zonaHoraria), ...v2 };
}
export function contextoConEstado(contexto: Record<string, any>, estado: EstadoV2): Record<string, any> {
  return { ...contexto, v2: estado };
}
const variablesDe = (s: Secuencia): Variable[] => s.pendientes.filter((o) => o.tipo === 'variable').map((o) => ({ tramo: o.tramo, desde: o.desde, hasta: o.hasta, anclas: o.anclas }));
export function planSiHaceFalta(estado: EstadoV2): EstadoV2 {
  const { perfil, secuencia } = estado;
  const yaTiene = secuencia.pendientes.some((o) => o.tipo === 'variable') || secuencia.hechas.some((h) => h.id.startsWith('var-'));
  if (!yaTiene) {
    const plan = planificar(perfil, NUCLEO);
    if (!plan.ok) return estado;
    return { ...estado, secuencia: aplicarPerfil(secuencia, { ...perfil, cubiertos: [], puertaAbierta: null }, plan.variables), bisagrasPlanificadas: perfil.bisagras.length };
  }
  if (perfil.bisagras.length > estado.bisagrasPlanificadas) {
    const plan = replanificar(perfil, NUCLEO, variablesDe(secuencia), secuencia.hechas.length);
    if (!plan.ok) return estado;
    return { ...estado, secuencia: aplicarPerfil(secuencia, { ...perfil, cubiertos: [], puertaAbierta: null }, plan.variables), bisagrasPlanificadas: perfil.bisagras.length };
  }
  return estado;
}
```

(Todo el estado v2 va bajo una sola clave `contexto.v2` para no chocar con las claves del flujo v1;
CONTRATO en Task 14.)

`manual-v2.ts` (estructura; el estilo de `manual.ts`: `titulo()`, `linea()`, `.env` cargado a mano,
`slug` de `puro.ts`; NO importa `manual.ts`):

```ts
/**
 * La puerta manual v2 (diseño 23/09, §4.1): la entrevista entera con el cerebro nuevo, para que
 * Naza se entreviste a sí mismo. No toca el flujo automático ni la puerta manual vieja. Todo el
 * estado vive en `narradores.contexto.v2`.
 *
 *   npm run manual-v2 -- empezar naza [--nombre "Naza"] [--zona America/Argentina/Buenos_Aires]
 *   npm run manual-v2 -- cargar naza <audio.ogg> | --texto "..."   [--repregunta]
 *   npm run manual-v2 -- siguiente naza
 *   npm run manual-v2 -- estado naza
 */
```

Comandos:

- `empezar`: busca el narrador por `como_le_dicen` (slug); si no existe lo crea como `crear` de
  `manual.ts` (mismos campos: `familia_id` de la primera familia de Naza, `estado: 'activo'`,
  `dia_actual: 0`, `contexto: { modoRapido: true }`, `zona_horaria`, `hora_preferida: '10:00'`,
  `telefono_whatsapp: '+manual-<slug>'`). Arma `estadoNuevo`, escribe la presentación con
  `escribirPregunta(cliente, perfil, proxima(secuencia), [], [], [])`, la guarda en
  `preguntasEnviadas['0']` (+ `marcas['0']` si `!ok`), avanza la secuencia con orden 0, guarda el
  contexto y **la imprime entera para pegar**.
- `cargar`: lee el estado; la pregunta abierta es la última de `hechas` (orden N) o su repregunta si
  `--repregunta`. Con audio: `guardarRespuestaAudio(n.id, N, buffer, esRepregunta)` →
  `transcribirYActualizar(id, buffer, promptDeTranscripcion(contexto, comoLeDicen, zona))`; el
  candado de audio cruzado (`buscarCruce` contra las transcripciones de los otros narradores) frena
  y dice cómo descartar, como en `manual.ts`. Con `--texto`: inserta la fila con `texto_directo`.
  Después: `actualizarPerfil(cliente, perfil, pregunta, texto, pendientesComoLista)`;
  `planSiHaceFalta`; `aplicarPerfil(secuencia, perfil)`; si la pregunta era `presentacion` no
  evalúa (solo perfil); si no, `evaluarV2(cliente, perfil, hecha.objetivo, pregunta, texto, segundos, ultimas6, evitar)`
  (el objetivo sale de `secuencia.hechas.at(-1)`) con `hayCansancio` (mira las últimas repreguntas
  enviadas y si tienen respuesta `es_repregunta` en su orden) y `sinRepreguntarHasta`: si hay
  cansancio, no manda repregunta y anota la fecha; si `reservado`, `guardarReserva`; si
  `dejarTema`, lo suma a `contexto.evitar`; si `hoyNo`, no evalúa más y avisa "mañana se retoma";
  si `quiereParar`, pone `estado: 'pausado'`, imprime un cierre cálido para pegar y **el mail para
  los dueños** (texto), y termina. Guarda todo. Imprime la repregunta (si hay) para pegar, con su
  marca si la tuvo, y el gasto acumulado (`contexto.v2.gastoUsd`).
- `siguiente`: `proxima(secuencia)`; si null, imprime la despedida (`despedida()` de `puro.ts` con
  el trato del perfil) y pone `estado: 'completado'`. Si no: `tocaObjeto(secuencia, proxima, sinFotos)`
  → si toca, escribe el objeto (`escribirPregunta` con `{tipo:'objeto'}`), lo registra con orden
  `101 + objetos.length`, lo imprime como **segundo mensaje** y sigue; escribe la pregunta con las
  últimas 6 respuestas (con su pregunta) y `yaHechas` = todas las enviadas; guarda
  `preguntasEnviadas[orden]`, la marca si la hay, avanza (`orden = hechas.length`), `dia_actual`,
  e **imprime la pregunta entera para pegar** y cuántos intentos llevó.
- `estado`: `perfilEnTexto(perfil)`, pendientes (id y bloque), cubiertos, marcas, objetos, gasto.

El gasto se calcula con `USD` como en `prueba-integral.ts` y se acumula en `contexto.v2.gastoUsd`.

- [ ] **Step 4: Correr** → PASS; `npm run tipos` limpio (el script está en `scripts/`, lo mira).

- [ ] **Step 5: Commit**

```bash
git add entrevistador/scripts/manual-v2.ts entrevistador/src/manual/estado-v2.ts entrevistador/test/estado-v2.test.ts entrevistador/package.json
git commit -m "entrevistador: la puerta manual v2 — empezar, cargar, siguiente, estado — para que Naza se entreviste con el cerebro nuevo"
```

---

### Task 9: Etapas del libro desde edades por respuesta; el mapeo viejo se va al script

**Files:**
- Modify: `fabrica/src/libro/etapas.ts`
- Modify: `fabrica/scripts/prueba-reparto.ts` (el mapeo `EPOCA_DEL_CAPITULO_GUION` vive acá)
- Test: `fabrica/test/etapas.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type EpocaDeRespuesta = { orden: number; desde: number | null; hasta: number | null; reflexion?: boolean };
  export function capitulosDeEtapas(etapas: Etapa[], respuestas: EpocaDeRespuesta[]): CapituloParaRepartir[];
  export function capituloDeObjeto(tramo: [number, number], etapas: Etapa[]): number | null; // índice de la etapa que cubre el medio del tramo
  export const PROMPT_ETAPAS = (nombre: string, historia: string, lineaDeTiempo: string) => string; // la línea de tiempo del perfil, si hay
  export async function armarEtapas(cliente, quien, historia, lineaDeTiempo = ''): …
  ```

- [ ] **Step 1: Tests que fallan**

Reemplazar el test de `capitulosDeEtapas`:

```ts
describe('capitulosDeEtapas (por edades, no por el capítulo del guion viejo)', () => {
  it('cada respuesta arranca en la etapa que cubre el medio de su época; sin época, sin capítulo; la reflexión, al final', () => {
    const caps = capitulosDeEtapas(ETAPAS, [
      { orden: 1, desde: 0, hasta: 12 },
      { orden: 8, desde: 13, hasta: 22 },
      { orden: 13, desde: null, hasta: null },
      { orden: 24, desde: null, hasta: null, reflexion: true },
    ]);
    expect(caps.map((c) => c.ordenes)).toEqual([[1, 8], [], [], [24]]);
  });
});

describe('capituloDeObjeto', () => {
  it('el objeto de la juventud (13-22) va a la etapa que cubre los 17', () => {
    expect(capituloDeObjeto([13, 22], ETAPAS)).toBe(0); // Tucumán 0-18
    expect(capituloDeObjeto([56, 76], ETAPAS)).toBeNull();
  });
});

describe('PROMPT_ETAPAS con la línea de tiempo del perfil', () => {
  it('la incluye cuando hay', () => {
    expect(PROMPT_ETAPAS('Élida', 'x', '- 0 a 18: Tucumán')).toContain('LO QUE EL BIÓGRAFO YA SABE');
    expect(PROMPT_ETAPAS('Élida', 'x', '')).not.toContain('LO QUE EL BIÓGRAFO YA SABE');
  });
});
```

- [ ] **Step 2: Correr** → FAIL.

- [ ] **Step 3: Implementar**

```ts
export type EpocaDeRespuesta = { orden: number; desde: number | null; hasta: number | null; reflexion?: boolean };

function indiceDeEpoca(etapas: Etapa[], desde: number, hasta: number): number | null {
  const medio = (desde + hasta) / 2;
  const i = etapas.findIndex((e) => !e.reflexion && e.desde !== null && e.hasta !== null && medio >= e.desde && medio <= e.hasta);
  return i >= 0 ? i : null;
}

export function capitulosDeEtapas(etapas: Etapa[], respuestas: EpocaDeRespuesta[]): CapituloParaRepartir[] {
  const capitulos: CapituloParaRepartir[] = etapas.map((e) => ({ nombre: e.nombre, ordenes: [] }));
  for (const r of respuestas) {
    const i = r.reflexion ? etapas.findIndex((e) => e.reflexion) : (r.desde !== null && r.hasta !== null ? indiceDeEpoca(etapas, r.desde, r.hasta) : null);
    if (i !== null && i >= 0 && !capitulos[i].ordenes.includes(r.orden)) capitulos[i].ordenes.push(r.orden);
  }
  return capitulos;
}

/** La foto de un objeto cierra el capítulo de la etapa de su época (diseño §3.4). */
export function capituloDeObjeto(tramo: [number, number], etapas: Etapa[]): number | null {
  return indiceDeEpoca(etapas, tramo[0], tramo[1]);
}
```

`PROMPT_ETAPAS(nombre, historia, lineaDeTiempo)`: si `lineaDeTiempo` no está vacía, antes de "LO QUE
CONTÓ" va:

```
LO QUE EL BIÓGRAFO YA SABE (su línea de tiempo, de la ficha):
${lineaDeTiempo}
```

`armarEtapas(cliente, quien, historia, lineaDeTiempo = '')`. Borrar `EPOCA_DEL_CAPITULO_GUION` y
`clave` de `etapas.ts`; en `prueba-reparto.ts` se define el mapeo (mismo contenido) y se traduce
cada respuesta a `EpocaDeRespuesta` antes de llamar a `capitulosDeEtapas`.

- [ ] **Step 4: Correr** → PASS. `tsc` limpio, también con el script.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/libro/etapas.ts fabrica/test/etapas.test.ts fabrica/scripts/prueba-reparto.ts
git commit -m "fábrica: las etapas se arman con edades por respuesta y la línea de tiempo del perfil; el mapeo del guion viejo queda en el script"
```

---

### Task 10: El lector final

**Files:**
- Create: `fabrica/src/libro/lector.ts`
- Test: `fabrica/test/lector.test.ts`

**Interfaces:**
- Consumes: `encargoDelLibro(quien)` (`encargo.ts`), `extraerTexto` (`comun.ts`).
- Produces:
  ```ts
  export type ProblemaLector = 'inventado' | 'epoca-o-lugar' | 'fundido' | 'reservado' | 'genero' | 'nombre' | 'otro';
  export type AvisoLector = { capitulo: string; frase: string; problema: ProblemaLector; evidencia: string };
  export const MODELO_LECTOR = 'claude-opus-5';
  export const PROMPT_LECTOR = (encargo: string, libro: string, transcripciones: string, nombres: string, reservado: string) => string;
  export function parsearLectura(salida: string): { ok: true; avisos: AvisoLector[] } | { ok: false };
  export async function leerLibro(cliente: Anthropic, quien: Quien, libroMarkdown: string, transcripciones: string[], nombresCorregidos: string, reservados: string[]): Promise<{ resultado: ReturnType<typeof parsearLectura>; usage: Anthropic.Usage }>;
  ```

- [ ] **Step 1: Tests que fallan**

```ts
import { describe, it, expect, vi } from 'vitest';
import { parsearLectura, leerLibro, PROMPT_LECTOR } from '../src/libro/lector.js';

// El lector final (diseño §3.2, idea de Naza): otro modelo lee el libro entero contra los audios y
// avisa lo que ningún contador ve. Con avisos, el libro espera a un socio.

describe('parsearLectura', () => {
  it('lee la lista y deja solo los avisos bien formados', () => {
    const r = parsearLectura('```json\n{"avisos":[{"capitulo":"Tucumán","frase":"Jugábamos con muñecos en el balcón","problema":"fundido","evidencia":"los muñecos en dia_03, el balcón en dia_27"},{"frase":"x"},{"capitulo":"A","frase":"B","problema":"lo que sea","evidencia":""}]}\n```');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.avisos).toEqual([{ capitulo: 'Tucumán', frase: 'Jugábamos con muñecos en el balcón', problema: 'fundido', evidencia: 'los muñecos en dia_03, el balcón en dia_27' }]);
  });
  it('lista vacía = libro sin problemas; sin JSON = no pudo', () => {
    expect(parsearLectura('{"avisos":[]}')).toEqual({ ok: true, avisos: [] });
    expect(parsearLectura('todo bien').ok).toBe(false);
  });
});

describe('PROMPT_LECTOR', () => {
  it('lleva el encargo, el libro, los audios, los nombres y lo reservado, y pide los siete problemas', () => {
    const p = PROMPT_LECTOR('ENCARGO', 'LIBRO', 'AUDIOS', 'Bausá', 'lo de la plata');
    for (const x of ['ENCARGO', 'LIBRO', 'AUDIOS', 'Bausá', 'lo de la plata', 'inventado', 'epoca-o-lugar', 'fundido', 'reservado', 'genero', 'nombre']) expect(p).toContain(x);
    expect(p).toMatch(/no está en ningún audio/);
  });
});

describe('leerLibro', () => {
  it('llama al lector con Opus y devuelve los avisos', async () => {
    const stream = vi.fn().mockReturnValue({ finalMessage: async () => ({ content: [{ type: 'text', text: '{"avisos":[]}' }], usage: { input_tokens: 10, output_tokens: 2 } }) });
    const r = await leerLibro({ messages: { stream } } as never, { nombre: 'Élida', genero: 'mujer' }, '# A', ['audio'], '', []);
    expect(stream.mock.calls[0][0].model).toBe('claude-opus-5');
    expect(r.resultado).toEqual({ ok: true, avisos: [] });
  });
});
```

- [ ] **Step 2: Correr** → FAIL.

- [ ] **Step 3: Implementar**

```ts
import type Anthropic from '@anthropic-ai/sdk';
import { encargoDelLibro, type Quien } from './encargo.js';
import { extraerTexto } from './comun.js';

export const MODELO_LECTOR = 'claude-opus-5';
export type ProblemaLector = 'inventado' | 'epoca-o-lugar' | 'fundido' | 'reservado' | 'genero' | 'nombre' | 'otro';
const PROBLEMAS = new Set<ProblemaLector>(['inventado', 'epoca-o-lugar', 'fundido', 'reservado', 'genero', 'nombre', 'otro']);
export type AvisoLector = { capitulo: string; frase: string; problema: ProblemaLector; evidencia: string };

export const PROMPT_LECTOR = (encargo: string, libro: string, transcripciones: string, nombres: string, reservado: string) => `
Sos el lector final de este libro, antes de que se imprima. No lo escribiste vos. Tu trabajo es leerlo
entero contra lo que la persona dijo de verdad y avisar lo que está mal. Si está bien, decís que está bien.

EL ENCARGO QUE RECIBIÓ QUIEN LO ESCRIBIÓ:
${encargo}

EL LIBRO:
${libro}

LO QUE LA PERSONA DIJO EN SUS AUDIOS, TEXTUAL (la única fuente de verdad):
${transcripciones}

NOMBRES CORREGIDOS POR LA FAMILIA (la forma correcta):
${nombres || '(ninguno)'}

LO QUE LA PERSONA PIDIÓ QUE NO VAYA AL LIBRO:
${reservado || '(nada)'}

Buscá SOLO estas cosas, frase por frase:
- inventado: un hecho, un detalle, una emoción o una conclusión que no está en ningún audio.
- epoca-o-lugar: un recuerdo puesto en la ciudad o la edad equivocada según lo que contó.
- fundido: dos cosas que contó por separado juntadas en una sola escena.
- reservado: algo que pidió que no vaya, o que lo roza.
- genero: el libro habla en un género que no es el de la persona (o los mezcla).
- nombre: un nombre distinto al corregido por la familia.
- otro: algo que el narrador no reconocería como suyo (decí por qué).

No marques estilo, ni frases reescritas que dicen lo mismo que el audio, ni repeticiones. Ante la
duda de si está en el audio, buscalo; si no está, es "inventado".

Devolvé SOLO un JSON: {"avisos":[{"capitulo":"","frase":"(la frase del libro, textual)","problema":"inventado|epoca-o-lugar|fundido|reservado|genero|nombre|otro","evidencia":"(la cita del audio que lo contradice, o: no está en ningún audio)"}]}
Si el libro está bien: {"avisos":[]}`;

export function parsearLectura(salida: string): { ok: true; avisos: AvisoLector[] } | { ok: false } {
  let crudo: { avisos?: unknown };
  try {
    const limpio = salida.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    crudo = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
  } catch { return { ok: false }; }
  if (!Array.isArray(crudo.avisos)) return { ok: false };
  const avisos = (crudo.avisos as Record<string, unknown>[]).filter((a) =>
    a && typeof a.capitulo === 'string' && typeof a.frase === 'string' && typeof a.problema === 'string' && PROBLEMAS.has(a.problema as ProblemaLector),
  ).map((a) => ({ capitulo: a.capitulo as string, frase: a.frase as string, problema: a.problema as ProblemaLector, evidencia: typeof a.evidencia === 'string' ? a.evidencia : '' }));
  return { ok: true, avisos };
}

export async function leerLibro(cliente: Anthropic, quien: Quien, libroMarkdown: string, transcripciones: string[], nombresCorregidos: string, reservados: string[]) {
  const stream = cliente.messages.stream({
    model: MODELO_LECTOR, max_tokens: 8000,
    messages: [{ role: 'user', content: PROMPT_LECTOR(encargoDelLibro(quien), libroMarkdown, transcripciones.join('\n\n---\n\n'), nombresCorregidos, reservados.join('\n')) }],
  });
  const final = await stream.finalMessage();
  return { resultado: parsearLectura(extraerTexto(final.content as Array<{ type: string; text?: string }>)), usage: final.usage };
}
```

(Esfuerzo alto: es el default de Opus 5, no hace falta parámetro.)

- [ ] **Step 4: Correr** → PASS.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/libro/lector.ts fabrica/test/lector.test.ts
git commit -m "fábrica: el lector final — Opus lee el libro entero contra los audios y avisa lo que ningún contador ve"
```

---

### Task 11: La revisión: el informe, si hay que esperar, el mail a los dueños

**Files:**
- Create: `fabrica/src/libro/revision.ts`
- Test: `fabrica/test/revision.test.ts`

**Interfaces:**
- Consumes: `AvisoLector` (Task 10), `controlarLibro` (`paginas.ts`), `avisarSocios` (`mail/socios.ts`), `subirTexto` (`comun.ts`).
- Produces:
  ```ts
  export type InformeRevision = { narrador: string; lector: AvisoLector[]; control: string[]; lectorFallo: boolean; fecha: string };
  export function hayQueRevisar(i: InformeRevision): boolean;   // algún aviso, o el lector no pudo leer
  export function mailDeRevision(i: InformeRevision, pedidoId: string): { asunto: string; html: string };
  export const RUTA_REVISION = (narradorId: string) => `${narradorId}/paquete/revision.json`;
  export async function dejarEnRevision(db, pedidoId: string, narradorId: string, informe: InformeRevision): Promise<void>; // sube revision.json, pedido → 'revision', mail
  ```

- [ ] **Step 1: Tests que fallan**

```ts
import { describe, it, expect } from 'vitest';
import { hayQueRevisar, mailDeRevision } from '../src/libro/revision.js';

const base = { narrador: 'Élida', lector: [], control: [], lectorFallo: false, fecha: '2026-09-24' };

describe('hayQueRevisar', () => {
  it('sin avisos y con el lector sano, no; con un aviso de cualquiera, sí; si el lector no pudo leer, sí', () => {
    expect(hayQueRevisar(base)).toBe(false);
    expect(hayQueRevisar({ ...base, control: ['repite'] })).toBe(true);
    expect(hayQueRevisar({ ...base, lector: [{ capitulo: 'A', frase: 'x', problema: 'inventado', evidencia: 'no está en ningún audio' }] })).toBe(true);
    expect(hayQueRevisar({ ...base, lectorFallo: true })).toBe(true);
  });
});

describe('mailDeRevision', () => {
  it('va a los dueños con el detalle: capítulo, frase, problema, evidencia, y el id del pedido', () => {
    const m = mailDeRevision({ ...base, lector: [{ capitulo: 'Tucumán', frase: 'muñecos en el balcón', problema: 'fundido', evidencia: 'dia_03 / dia_27' }], control: ['El libro repite: 4 %'] }, 'ped-1');
    expect(m.asunto).toContain('Élida');
    expect(m.asunto).toMatch(/revis/i);
    for (const x of ['Tucumán', 'muñecos en el balcón', 'fundido', 'dia_03', 'El libro repite', 'ped-1']) expect(m.html).toContain(x);
    expect(m.html).toMatch(/espera/i);
  });
});
```

- [ ] **Step 2: Correr** → FAIL.

- [ ] **Step 3: Implementar**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AvisoLector } from './lector.js';
import { avisarSocios } from '../mail/socios.js';
import { escaparHtml, subirTexto } from './comun.js';

// La revisión (diseño §3.3, decisión de Naza): con avisos el libro ESPERA y los dueños reciben el
// detalle. Un invento impreso no tiene arreglo. Nada de esto le llega a la familia.

export type InformeRevision = { narrador: string; lector: AvisoLector[]; control: string[]; lectorFallo: boolean; fecha: string };
export const RUTA_REVISION = (narradorId: string) => `${narradorId}/paquete/revision.json`;

export function hayQueRevisar(i: InformeRevision): boolean {
  return i.lectorFallo || i.lector.length > 0 || i.control.length > 0;
}

export function mailDeRevision(i: InformeRevision, pedidoId: string): { asunto: string; html: string } {
  const filas = i.lector.map((a) => `<li><b>${escaparHtml(a.capitulo)}</b> — «${escaparHtml(a.frase)}» — <i>${a.problema}</i>: ${escaparHtml(a.evidencia)}</li>`).join('');
  const control = i.control.map((c) => `<li>${escaparHtml(c)}</li>`).join('');
  const html = `<p>El libro de <b>${escaparHtml(i.narrador)}</b> (pedido ${pedidoId}) <b>espera</b> a que uno de ustedes lo mire antes de entregarse.</p>
${i.lectorFallo ? '<p>⚠ El lector final no pudo leerlo (no devolvió una lista): revisar a mano.</p>' : ''}
${filas ? `<p>Lo que vio el lector:</p><ul>${filas}</ul>` : ''}
${control ? `<p>Controles:</p><ul>${control}</ul>` : ''}
<p>Para seguir: corregir a mano, rehacer el capítulo señalado, o entregar igual (desde el panel de la empresa; mientras no exista, con la fábrica a mano).</p>`;
  return { asunto: `Libro de ${i.narrador} en revisión: ${i.lector.length + i.control.length} aviso(s)`, html };
}

export async function dejarEnRevision(db: SupabaseClient, pedidoId: string, narradorId: string, informe: InformeRevision): Promise<void> {
  await subirTexto(db, RUTA_REVISION(narradorId), JSON.stringify(informe, null, 2), 'application/json');
  const { error } = await db.from('pedidos').update({ estado: 'revision' }).eq('id', pedidoId);
  if (error) throw new Error(`No se pudo dejar el pedido ${pedidoId} en revisión: ${error.message}`);
  const { asunto, html } = mailDeRevision(informe, pedidoId);
  await avisarSocios(asunto, html);
}
```

(`subirTexto(db, ruta, contenido, contentType = 'text/markdown')` es la firma de `comun.ts`: acá va con `'application/json'`; `escaparHtml` también vive ahí.)

- [ ] **Step 4: Correr** → PASS.

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/libro/revision.ts fabrica/test/revision.test.ts
git commit -m "fábrica: la revisión — con avisos el libro espera y los dueños reciben el detalle por mail"
```

---

### Task 12: El orquestador del libro v2 y el script delgado

**Files:**
- Create: `fabrica/src/libro/libro-v2.ts`
- Modify: `fabrica/scripts/prueba-reparto.ts`
- Test: `fabrica/test/libro-v2.test.ts`

**Interfaces:**
- Consumes: `armarEtapas`, `repartirEnEtapas`, `capitulosDeEtapas`, `ubicarSueltas`, `EpocaDeRespuesta` (etapas); `numerarRespuestas`, `materialRepartido` (reparto); `escribirCapituloRepartido` (escribir-capitulo); `escribirPaginas`, `armarLibro`, `controlarLibro` (paginas); `leerLibro` (lector); `medirRepeticion`; `generoDelMaterial`.
- Produces:
  ```ts
  export type EntradaLibroV2 = {
    cliente: Anthropic; quien: Quien;
    respuestas: { orden: number; pregunta: string; texto: string; fuenteId: string }[];
    epocas: EpocaDeRespuesta[]; lineaDeTiempo?: string; nombresCorregidos: string; reservados: string[];
    /** Para escribir cada capítulo (inyectable en tests). */
    escribirCapitulo?: (quien: Quien, nombre: string, material: string, nombres: string) => Promise<{ texto: string; usage: unknown }>;
    alPaso?: (paso: string) => void;
  };
  export type SalidaLibroV2 = { etapas: Etapa[]; capitulos: { nombre: string; texto: string }[]; materiales: string[]; libroMarkdown: string | null; medicion: Medicion; informe: InformeRevision; salidas: Record<string, string>; gastoUsd: number };
  export async function armarLibroV2(e: EntradaLibroV2): Promise<SalidaLibroV2>;
  ```

- [ ] **Step 1: Test que falla**

```ts
import { describe, it, expect, vi } from 'vitest';
import { armarLibroV2 } from '../src/libro/libro-v2.js';

// El orquestador del libro v2: etapas → reparto → capítulos → páginas → control → lector. Sin base:
// lo usan el script de prueba y, al conectar, la fábrica.

const respuesta = (text: string) => ({ finalMessage: async () => ({ content: [{ type: 'text', text }], usage: { input_tokens: 100, output_tokens: 10 } }) });

describe('armarLibroV2', () => {
  it('encadena los pasos, mide, lee y arma el informe; cada oración queda una vez', async () => {
    const stream = vi.fn()
      .mockReturnValueOnce(respuesta('{"etapas":[{"nombre":"Tucumán","desde":0,"hasta":18,"deQueTrata":"x"},{"nombre":"Lanús","desde":19,"hasta":80,"deQueTrata":"y"}],"reflexion":{"nombre":"Lo que aprendí","deQueTrata":"z"}}'))
      .mockReturnValueOnce(respuesta('R2.1 → 2'))                                  // reparto
      .mockReturnValueOnce(respuesta('{"apertura":"Hola.","cierre":"Chau.","suyas":[],"heredadas":[],"muletillas":[]}'))
      .mockReturnValueOnce(respuesta('{"avisos":[]}'));                            // lector
    const escribirCapitulo = vi.fn(async (_q, nombre, material) => ({ texto: `${nombre}: ${material.replace(/^P:.*\n/gm, '')}`, usage: { input_tokens: 1, output_tokens: 1 } }));
    const r = await armarLibroV2({
      cliente: { messages: { stream } } as never,
      quien: { nombre: 'Élida', genero: 'mujer' },
      respuestas: [
        { orden: 1, pregunta: '¿Su casa?', texto: 'La casa de mis abuelos en Tucumán tenía un patio enorme.', fuenteId: 'dia_01' },
        { orden: 13, pregunta: '¿El amor?', texto: 'A Rubén lo conocí en el taller de Lanús.', fuenteId: 'dia_13' },
      ],
      epocas: [{ orden: 1, desde: 0, hasta: 12 }, { orden: 13, desde: null, hasta: null }],
      nombresCorregidos: '', reservados: [], escribirCapitulo,
    });
    expect(r.etapas.map((e) => e.nombre)).toEqual(['Tucumán', 'Lanús', 'Lo que aprendí']);
    expect(escribirCapitulo).toHaveBeenCalledTimes(3);
    expect(r.capitulos[1].texto).toContain('Rubén');
    expect(r.capitulos[0].texto).not.toContain('Rubén');
    expect(r.libroMarkdown).toContain('# A mis lectores');
    expect(r.informe.lector).toEqual([]);
    expect(r.informe.lectorFallo).toBe(false);
    expect(r.gastoUsd).toBeGreaterThan(0);
  });

  it('si el lector no devuelve una lista, el informe lo dice (y hay que revisar)', async () => {
    const stream = vi.fn()
      .mockReturnValueOnce(respuesta('{"etapas":[{"nombre":"A","desde":0,"hasta":40,"deQueTrata":""},{"nombre":"B","desde":41,"hasta":80,"deQueTrata":""}]}'))
      .mockReturnValueOnce(respuesta('NADA'))
      .mockReturnValueOnce(respuesta('{"apertura":"a","cierre":"b"}'))
      .mockReturnValueOnce(respuesta('no sé'));
    const r = await armarLibroV2({ cliente: { messages: { stream } } as never, quien: { nombre: 'X', genero: null }, respuestas: [{ orden: 1, pregunta: 'p', texto: 'Texto con cinco palabras de contenido importantes aquí.', fuenteId: 'f' }], epocas: [{ orden: 1, desde: 0, hasta: 12 }], nombresCorregidos: '', reservados: [], escribirCapitulo: async (_q, n, m) => ({ texto: m, usage: {} }) });
    expect(r.informe.lectorFallo).toBe(true);
  });
});
```

- [ ] **Step 2: Correr** → FAIL.

- [ ] **Step 3: Implementar `libro-v2.ts`**

```ts
import type Anthropic from '@anthropic-ai/sdk';
import { armarEtapas, repartirEnEtapas, capitulosDeEtapas, ubicarSueltas, type Etapa, type EpocaDeRespuesta } from './etapas.js';
import { numerarRespuestas, materialRepartido } from './reparto.js';
import { escribirCapituloRepartido } from './escribir-capitulo.js';
import { escribirPaginas, armarLibro, controlarLibro } from './paginas.js';
import { medirRepeticion, type Medicion } from './medir-repeticion.js';
import { leerLibro } from './lector.js';
import type { Quien } from './encargo.js';
import type { InformeRevision } from './revision.js';

// Precios por millón (GASTOS.md): Fable 5 escribe, Opus 5 lee.
const PRECIO: Record<string, [number, number]> = { 'claude-fable-5': [10, 50], 'claude-opus-5': [5, 25] };
type Uso = { input_tokens?: number; output_tokens?: number };
const costo = (modelo: string, u: Uso) => ((u.input_tokens ?? 0) * PRECIO[modelo][0] + (u.output_tokens ?? 0) * PRECIO[modelo][1]) / 1_000_000;

export type EntradaLibroV2 = {
  cliente: Anthropic; quien: Quien;
  respuestas: { orden: number; pregunta: string; texto: string; fuenteId: string }[];
  epocas: EpocaDeRespuesta[]; lineaDeTiempo?: string; nombresCorregidos: string; reservados: string[];
  escribirCapitulo?: (quien: Quien, nombre: string, material: string, nombres: string) => Promise<{ texto: string; usage: unknown }>;
  alPaso?: (paso: string) => void;
};
export type SalidaLibroV2 = {
  etapas: Etapa[]; capitulos: { nombre: string; texto: string }[]; materiales: string[];
  libroMarkdown: string | null; medicion: Medicion; informe: InformeRevision; salidas: Record<string, string>; gastoUsd: number;
};

export async function armarLibroV2(e: EntradaLibroV2): Promise<SalidaLibroV2> {
  const paso = e.alPaso ?? (() => {});
  const salidas: Record<string, string> = {};
  let gastoUsd = 0;
  const escribir = e.escribirCapitulo ?? escribirCapituloRepartido;

  paso('Etapas…');
  const historia = e.respuestas.map((r) => `P: ${r.pregunta}\nR: ${r.texto}`).join('\n\n');
  const et = await armarEtapas(e.cliente, e.quien, historia, e.lineaDeTiempo ?? '');
  gastoUsd += costo('claude-fable-5', et.usage as Uso);
  salidas['etapas-salida.txt'] = et.salida;
  if (!et.resultado.ok) throw new Error('El modelo no devolvió etapas legibles: ver etapas-salida.txt');
  const etapas = et.resultado.etapas;

  paso('Reparto en etapas…');
  const numeradas = numerarRespuestas(e.respuestas.map(({ orden, pregunta, texto }) => ({ orden, pregunta, texto })));
  const capitulosEtapas = capitulosDeEtapas(etapas, e.epocas);
  const reparto = await repartirEnEtapas(e.cliente, e.quien, numeradas, capitulosEtapas, etapas);
  gastoUsd += costo('claude-fable-5', reparto.usage as Uso);
  salidas['reparto-salida.txt'] = reparto.salida;
  const ubicadas = ubicarSueltas(numeradas, capitulosEtapas, reparto.movidas);
  const { porCapitulo } = materialRepartido(numeradas, capitulosEtapas, ubicadas.movidas);

  const capitulos: { nombre: string; texto: string }[] = [];
  for (let i = 0; i < etapas.length; i++) {
    paso(`Capítulo ${i + 1}/${etapas.length}: ${etapas[i].nombre}…`);
    const { texto, usage } = await escribir(e.quien, etapas[i].nombre, porCapitulo[i], e.nombresCorregidos);
    gastoUsd += costo('claude-fable-5', (usage ?? {}) as Uso);
    capitulos.push({ nombre: etapas[i].nombre, texto });
  }

  const fuentes = e.respuestas.map((r) => ({ id: r.fuenteId, texto: r.texto }));
  const medicion = medirRepeticion(capitulos, fuentes);

  paso('Apertura, cierre y «Sus frases»…');
  const transcripciones = e.respuestas.map((r) => r.texto);
  const paginas = await escribirPaginas(e.cliente, e.quien, capitulos, transcripciones);
  gastoUsd += costo('claude-fable-5', paginas.usage as Uso);
  const libroMarkdown = paginas.resultado.ok ? armarLibro(paginas.resultado.paginas, capitulos) : null;

  const control = controlarLibro(capitulos, fuentes, e.quien.genero);
  paso('El lector final…');
  const lectura = await leerLibro(e.cliente, e.quien, libroMarkdown ?? capitulos.map((c) => `# ${c.nombre}\n\n${c.texto}`).join('\n\n'), transcripciones, e.nombresCorregidos, e.reservados);
  gastoUsd += costo('claude-opus-5', lectura.usage as Uso);
  const informe: InformeRevision = {
    narrador: e.quien.nombre,
    lector: lectura.resultado.ok ? lectura.resultado.avisos : [],
    control: [...control.avisos, ...(paginas.resultado.ok ? [] : ['El editor no devolvió apertura y cierre legibles.'])],
    lectorFallo: !lectura.resultado.ok,
    fecha: new Date().toISOString().slice(0, 10),
  };
  return { etapas, capitulos, materiales: porCapitulo, libroMarkdown, medicion, informe, salidas, gastoUsd };
}
```

`prueba-reparto.ts` queda: leer la base (como hoy), armar `respuestas` y `epocas`, `antes` (los
borradores, si hay), llamar `armarLibroV2`, y escribir en la carpeta: `salidas` (cada archivo),
`material_cap_NN.md` (de `materiales`), `capitulo_NN.md`, `libro.md`, `revision.json` (el informe) e
`informe.md` con antes/después, cobertura, lector y gasto. Las `epocas` salen de dos lugares:
- si el narrador tiene `contexto.v2` (Naza): de `secuencia.hechas`, con el rango del tramo de cada
  hecha (`RANGO_TRAMO` como en `control-pregunta.ts`; `null` si el tramo es null; `reflexion: true`
  si el objetivo es del bloque `reflexion`), y `lineaDeTiempo` de `perfil.etapas` + `perfil.bisagras`
  en texto (`perfilEnTexto` no: solo la línea de tiempo, una etapa por línea);
- si no (Joaquín, material viejo): del mapeo `EPOCA_DEL_CAPITULO_GUION` definido en el script
  (`'la infancia'`/`'las raices'` → 0-12, `'la juventud'` → 13-22, `'la sabiduria'` → reflexión, el
  resto sin época), sin `lineaDeTiempo`.
El camino sin `--etapas` (capítulos del guion) se elimina: el v2 es por etapas. Sigue sin escribir
nada en Supabase.

- [ ] **Step 4: Correr** → PASS; `tsc` limpio con el script (`tsconfig.revision.json`).

- [ ] **Step 5: Commit**

```bash
git add fabrica/src/libro/libro-v2.ts fabrica/test/libro-v2.test.ts fabrica/scripts/prueba-reparto.ts
git commit -m "fábrica: el libro v2 de punta a punta en un orquestador (etapas, reparto, capítulos, páginas, control, lector); el script queda delgado"
```

---

### Task 13: La prueba integral, reducida a C1, C4 y la reserva inventada

**Files:**
- Modify: `entrevistador/scripts/prueba-integral.ts`

**Interfaces:**
- Consumes: `actualizarPerfil`, `evaluarV2`, `PROMPT_EVALUAR`/`estiloCerebro` (como hoy).

- [ ] **Step 1: Reescribir el script**

Se queda solo con Ciro. Casos: `C1` y `C4` como hoy, y `RESERVA` (inventado): pregunta
«¿Cómo era su padre?», respuesta «Mi viejo tomaba. Esto que te cuento de la plata que se llevó
prefiero que no vaya al libro, que quede entre nosotros. Pero era un tipo que cuando estaba bien te
hacía reír.», 40 segundos. Para cada caso: la evaluación de hoy (`PROMPT_EVALUAR`) y la v2
(`evaluarV2(cliente, perfilAntes, objetivo 'padres', …)`), y en el informe: `suficiente`,
`repregunta`, `dejarTema`, `reservado`, `reservadoTramo`, `marca`. El perfil se arma como hoy (con
`--reusar-perfil`) porque la v2 lo necesita; se saca la sección "Las preguntas que le haría" (eso
ahora lo mide Naza en vivo). Costo esperado: ~USD 0,7 (18 perfiles + 6 evaluaciones).

- [ ] **Step 2: `npm run tipos` limpio.**

- [ ] **Step 3: Commit**

```bash
git add entrevistador/scripts/prueba-integral.ts
git commit -m "entrevistador: la prueba integral queda con C1, C4 y una reserva inventada; las preguntas en vivo las mide el piloto de Naza"
```

---

### Task 14: La migración del estado `revision`, el CONTRATO y el handoff

**Files:**
- Create: `supabase/migrations/20260924000000_pedidos_revision.sql`
- Modify: `supabase/CONTRATO.md`
- Modify: `docs/handoff-2026-09-23-biografo-v2.md` (o el handoff del día que corresponda)

- [ ] **Step 1: La migración (idempotente, NO se aplica: la aplica Naza)**

```sql
-- El estado 'revision' del pedido (diseño 23/09, §3.3, decisión de Naza): con avisos del lector
-- final o de los controles, el libro ESPERA a que un socio lo mire, y los dueños reciben el detalle
-- por mail. La familia no ve nada hasta que se entrega.
-- ⚠️ La aplica Naza en el SQL Editor. Idempotente, no toca datos.
alter table pedidos drop constraint if exists pedidos_estado_check;
alter table pedidos add constraint pedidos_estado_check
  check (estado in ('pendiente','pagado','generando','esperando_voz','revision','entregado','fallido'));
```

(Copiar la lista de estados vigente de `20260917000000_narraciones.sql:31` y sumar `revision`; si hay
una migración posterior que la cambió, partir de esa.)

- [ ] **Step 2: CONTRATO**

Sumar: en la tabla de `pedidos`, el estado `revision` (quién lo pone: fábrica; quién lo saca: la web
desde el panel de la empresa, o la fábrica a mano) y `{narrador}/paquete/revision.json`. Sección
nueva "El biógrafo v2 en `narradores.contexto.v2`" con las claves: `perfil` (la ficha del biógrafo,
la escribe el entrevistador, la lee la fábrica para las etapas), `secuencia` (pendientes, hechas,
cubiertos, objetos), `marcas` (por orden: control, motivo, intentos; la web las muestra),
`preguntasEnviadas` y `repreguntasEnviadas` (como en v1, pero adentro de `v2`), `gastoUsd`. Y que
hasta conectar el v2, solo la puerta manual v2 escribe `contexto.v2`.

- [ ] **Step 3: Handoff**

En el handoff del día: qué quedó hecho de este plan (por tarea, con commits), cómo corre Naza su
piloto (los cuatro comandos), qué aprueba antes (los textos que salieron en los reportes de las
tareas 3, 5 y 7), el costo (~USD 10 en total), y "qué NO hacer" (no conectar, no aplicar la
migración sin acordar con Joaquín, no correr nada contra el modelo sin el OK de Naza).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260924000000_pedidos_revision.sql supabase/CONTRATO.md docs/handoff-*.md
git commit -m "docs: el estado revision del pedido (migración sin aplicar), contexto.v2 en el CONTRATO y el handoff del biógrafo que piensa"
```

---

## Verificación final (antes de cerrar el plan)

1. `cd entrevistador && npx vitest run && npm run tipos` y `cd fabrica && npx vitest run && npx tsc --noEmit -p . && npx tsc --noEmit -p tsconfig.revision.json` (crear y borrar): todo verde, y **"Test Files" con todos los archivos cargados**.
2. Sacar los textos que ve la persona para el OK de Naza: los 22 temas de `NUCLEO`, el encargo (`encargoDelBiografo` con un perfil vacío y uno con vos/mujer), el prompt de la pregunta y el de la evaluación, el prompt del perfil, el del lector, el mail de revisión. Un archivo `docs/biografo-v2-textos-para-aprobar.md` con todo, generado con un script de una vez (no se commitea el script).
3. `git push origin biografo-v2-fabrica`.
4. El mensaje para Naza, al final: cómo correr `empezar naza`, qué va a ver, cuánto cuesta, y qué aprobar antes.
