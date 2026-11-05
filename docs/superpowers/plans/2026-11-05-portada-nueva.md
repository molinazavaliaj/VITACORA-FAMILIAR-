# Portada nueva: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la portada de `/`, `/ar` y `/ca` por un recorrido de tienda: inicio de una pantalla, seis cajitas con precios, movimiento, cuatro pasos, voz, privacidad, preguntas y cierre.

**Architecture:** `_portada/portada.tsx` se rearma con piezas chicas. Los textos nuevos viven en `_textos/portada-nueva.ts`, porque las landings y `/ejemplo` siguen usando `_textos/portada.ts`. Las cajitas salen de una función pura (`_portada/datos-cajas.ts`) que lee `catalogo()`. La paleta Acuarela vive en `_portada/acuarela.css` y no toca `_direccion/tokens.css`.

**Tech Stack:** Next.js (App Router, página estática), React server components, CSS propio, Vitest con `renderToStaticMarkup`.

## Global Constraints

- Diseño: `docs/superpowers/specs/2026-11-05-portada-nueva-design.md`.
- Trabajar en el worktree `../VITACORA FAMILIAR-portada-nueva`, rama `portada-nueva`. Todos los comandos corren en `web/`.
- La portada es estática: nada de `headers()` ni `cookies()`.
- Textos: sin dos puntos, ninguna oración empieza con «Y», sin «padre», «papá» ni «pare», sin «desde» seguido de número. España de tú, Argentina de vos, catalán.
- Sin «Unión Europea» ni «no los vendemos» en la portada.
- Ningún precio escrito a mano: todos salen de `catalogo()`.
- Sin copiar textos, imágenes ni animaciones de Mila.
- Con «menos movimiento» o sin JS, todo queda visible y quieto.
- Los textos de este plan son propuestas. **No se mergea sin la aprobación de Naza**, en tandas de 10, y el catalán queda marcado como pendiente de revisar con Imma.
- La frase de privacidad no promete quién escucha hasta que el PR del panel de Joaquín esté en producción.

---

### Task 1: El libro se abre y vuelve a cerrarse

**Files:**
- Create: `web/src/app/_direccion/libro-estado.ts`
- Modify: `web/src/app/_direccion/coreografia.tsx` (bloque 4, `alTerminar`)
- Modify: `web/src/app/globals.css` (después de la regla `.l3-seccion[data-libro="abierto"] .l3-sombra`)
- Test: `web/test/libro-estado.test.ts`

**Interfaces:**
- Produces: atributo `data-libro-cierra` en la sección del libro. Quien lo lleva termina cerrado. Sin él, el libro queda abierto como hoy (landings y `/ejemplo`).
- Produces: `siguienteEstadoLibro(animacion: string, cierra: boolean): "abierto" | "cierra" | "quieto" | null`.

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from "vitest";
import { siguienteEstadoLibro } from "../src/app/_direccion/libro-estado";

describe("el estado del libro al terminar cada animación", () => {
  it("sin cerrar, queda abierto como en las landings", () => {
    expect(siguienteEstadoLibro("l3-girar", false)).toBe("abierto");
    expect(siguienteEstadoLibro("l3-cerrar", false)).toBeNull();
  });
  it("con cierre, se abre, se cierra y queda quieto", () => {
    expect(siguienteEstadoLibro("l3-girar", true)).toBe("cierra");
    expect(siguienteEstadoLibro("l3-cerrar", true)).toBe("quieto");
  });
  it("las otras animaciones no cambian nada", () => {
    expect(siguienteEstadoLibro("l3-abrir", true)).toBeNull();
  });
});
```

- [ ] **Step 2: Comprobar que falla**

Run: `npx vitest run test/libro-estado.test.ts`
Expected: FAIL, no existe el módulo.

- [ ] **Step 3: Crear `libro-estado.ts`**

```ts
// Qué estado sigue cuando termina una animación del libro 3D. En la portada
// (data-libro-cierra) se abre, se vuelve a cerrar y queda la tapa a la vista.
export type EstadoLibro = "abierto" | "cierra" | "quieto";

export function siguienteEstadoLibro(animacion: string, cierra: boolean): EstadoLibro | null {
  if (animacion === "l3-girar") return cierra ? "cierra" : "abierto";
  if (animacion === "l3-cerrar" && cierra) return "quieto";
  return null;
}
```

- [ ] **Step 4: Usarlo en `coreografia.tsx`**

Sumar `import { siguienteEstadoLibro } from "./libro-estado";` y reemplazar `alTerminar`:

```ts
const alTerminar = (e: AnimationEvent) => {
  if (e.target !== libro) return;
  const siguiente = siguienteEstadoLibro(e.animationName, "libroCierra" in seccion.dataset);
  if (siguiente) seccion.dataset.libro = siguiente;
};
```

- [ ] **Step 5: Sumar el cierre en `globals.css`**

```css
/* La portada (data-libro-cierra): después de abrirse espera un momento, se
   vuelve a cerrar y queda la tapa. Es el mismo camino, al revés. */
@keyframes l3-cerrar {
  from { transform: translateX(calc(var(--l3-w) * 0.5 * var(--l3-s))) scale(calc(var(--l3-ki) * var(--l3-s))) rotateX(0deg) rotateY(0deg); }
  to { transform: translateX(0) scale(var(--l3-ki)) rotateX(10deg) rotateY(32deg); }
}
.l3-seccion[data-libro="cierra"] { --l3-espera: 2.2s; --l3-cierre: 1.4s; }
.l3-seccion[data-libro="cierra"] .l3-libro { animation: l3-cerrar var(--l3-cierre) var(--ease-io) var(--l3-espera) both; }
.l3-seccion[data-libro="cierra"] .l3-tapa { animation: l3-abrir var(--l3-cierre) var(--ease-io) var(--l3-espera) reverse both; }
.l3-seccion[data-libro="cierra"] .l3-hoja { animation: l3-pasar var(--l3-cierre) var(--ease-io) var(--l3-espera) reverse both; }
.l3-seccion[data-libro="cierra"] .l3-sombra { animation: l3-piso var(--l3-cierre) var(--ease-io) var(--l3-espera) reverse both; }
```

- [ ] **Step 6: Correr los tests**

Run: `npx vitest run test/libro-estado.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/_direccion/libro-estado.ts src/app/_direccion/coreografia.tsx src/app/globals.css test/libro-estado.test.ts
git commit -m "web: el libro 3D puede volver a cerrarse (data-libro-cierra)"
```

---

### Task 2: Textos nuevos y datos de las cajitas

**Files:**
- Create: `web/src/app/_textos/portada-nueva.ts`
- Create: `web/src/app/_portada/datos-cajas.ts`
- Test: `web/test/portada-cajas.test.ts`

**Interfaces:**
- Consumes: `catalogo`, `Catalogo` de `@/lib/productos`; `ruta`, `IdiomaWeb`, `Textos` de `@/lib/idioma-web`.
- Produces: `TEXTOS_PORTADA_NUEVA: Textos<TextosPortadaNueva>`.
- Produces: `cajasPortada(idioma: IdiomaWeb, cat: Catalogo, formatear: (n: number) => string, biografo?: boolean): Caja[]`.
- Produces: `type Caja = { id: IdCaja; textos: TextoCaja; tinte: 1|2|3|4|5|6; foto: string | null; filas: { etiqueta: string; valor: string }[]; href: string | null; marca: "regalo" | "pronto" | null }`, con `type IdCaja = "familiar" | "ti" | "nino" | "viaje" | "evento" | "biografo"`.

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { cajasPortada } from "../src/app/_portada/datos-cajas";
import { catalogo } from "../src/lib/productos";

const eur = (n: number) => `${n} €`;
const filas = (cajas: ReturnType<typeof cajasPortada>, id: string) => cajas.find((c) => c.id === id)!.filas.map((f) => f.valor);

describe("las cajitas de la portada", () => {
  beforeEach(() => {
    process.env.PRECIO_EUR = "49";
    process.env.PRECIO_IMPRESO_EUR = "50";
    process.env.PRECIO_VIAJE_EUR = "45";
    delete process.env.VITACORA_BIOGRAFO;
  });

  it("Biógrafo no se muestra hasta prenderlo", () => {
    expect(cajasPortada("es", catalogo("ES"), eur).map((c) => c.id)).toEqual(["familiar", "ti", "nino", "viaje", "evento"]);
    expect(cajasPortada("es", catalogo("ES"), eur, true).map((c) => c.id)).toEqual(["familiar", "ti", "nino", "viaje", "evento", "biografo"]);
  });

  it("los precios salen del catálogo, impreso y digital", () => {
    const cajas = cajasPortada("es", catalogo("ES"), eur);
    expect(filas(cajas, "familiar")).toEqual(["99 €", "49 €"]);
    expect(filas(cajas, "ti")).toEqual(["99 €", "49 €"]);
    expect(filas(cajas, "viaje")).toEqual(["95 €", "45 €"]);
  });

  it("sin impreso en la región, solo la fila del digital", () => {
    delete process.env.PRECIO_IMPRESO_EUR;
    expect(filas(cajasPortada("es", catalogo("ES"), eur), "familiar")).toEqual(["49 €"]);
  });

  it("sin Viaje en la región, no hay cajita de Viaje", () => {
    delete process.env.PRECIO_VIAJE_EUR;
    expect(cajasPortada("es", catalogo("ES"), eur).map((c) => c.id)).not.toContain("viaje");
  });

  it("los enlaces van a su lugar y respetan el idioma", () => {
    const es = cajasPortada("es", catalogo("ES"), eur);
    expect(es.find((c) => c.id === "familiar")!.href).toBe("/comprar?regalo=1");
    expect(es.find((c) => c.id === "ti")!.href).toBe("/comprar");
    expect(es.find((c) => c.id === "nino")!.href).toBe("/kids");
    expect(es.find((c) => c.id === "viaje")!.href).toBe("/viaje");
    expect(es.find((c) => c.id === "evento")!.href).toBe("/eventos");
    process.env.PRECIO_ARS = "65000";
    expect(cajasPortada("ar", catalogo("AR"), eur).find((c) => c.id === "familiar")!.href).toBe("/ar/comprar?regalo=1");
  });
});
```

- [ ] **Step 2: Comprobar que falla**

Run: `npx vitest run test/portada-cajas.test.ts`
Expected: FAIL, no existe el módulo.

- [ ] **Step 3: Crear `_textos/portada-nueva.ts`**

```ts
import type { Textos } from "@/lib/idioma-web";

// Los textos de la portada nueva (05/11). Propuestas: Naza los aprueba en
// tandas de 10 antes del merge. El catalán falta revisarlo con Imma.
// Reglas: sin dos puntos, ninguna oración empieza con «Y», sin «padre».

export type TextoCaja = { titulo: string; linea: string; ideal: string; enlace: string };
type Paso = { titulo: string; texto: string };

export type TextosPortadaNueva = {
  inicio: { boton: string };
  tienda: { titulo: string; bajada: string; pie: [string, string, string] };
  precios: { impresoDigital: string; soloDigital: string; viaje: string; pronto: string; prontoValor: string; evento: string; consultar: string; biografo: string };
  marcas: { regalo: string; pronto: string };
  cajas: Record<"familiar" | "ti" | "nino" | "viaje" | "evento" | "biografo", TextoCaja>;
  atajos: Record<"familiar" | "ti" | "nino" | "viaje" | "evento" | "biografo", { pista: string; nombre: string }>;
  biografo: { etiqueta: string; nombre: string; rol: string; texto: string; boton: string; fotoFalta: string };
  audios: { titulo: string };
  pasos: { titulo: string; lista: [Paso, Paso, Paso, Paso]; ejemplo: [string, string]; agregar: string };
  voz: { titulo: string; texto: string };
  privacidad: { titulo: string; texto: string; enlace: string };
  cierre: { frase: string; boton: string };
};

export const TEXTOS_PORTADA_NUEVA: Textos<TextosPortadaNueva> = {
  es: {
    inicio: { boton: "¿Para quién es?" },
    tienda: {
      titulo: "Vitácora convierte una vida en un libro para siempre.",
      bajada: "Solo hay que responder preguntas por WhatsApp. Nosotros nos encargamos del resto. Un regalo emotivo, un libro que va a pasar de generación en generación.",
      pie: ["Envío incluido", "Sin apps ni contraseñas", "Con un QR para escuchar su voz"],
    },
    precios: { impresoDigital: "Impreso y digital", soloDigital: "Solo digital", viaje: "Vitácora de Viaje", pronto: "Mi Primer Capítulo", prontoValor: "Pronto", evento: "Según el evento", consultar: "Consultar", biografo: "Vitácora Biógrafo" },
    marcas: { regalo: "El regalo", pronto: "Próximamente" },
    cajas: {
      familiar: { titulo: "Para un familiar", linea: "La vida de tu abuela, tu abuelo o quien quieras, con sus palabras.", ideal: "Ideal si se la quieres regalar.", enlace: "Ver Vitácora Familiar" },
      ti: { titulo: "Para ti", linea: "Tu propia historia, para que quede en tu familia.", ideal: "Ideal si quieres dejarla escrita.", enlace: "Ver Vitácora para ti" },
      nino: { titulo: "Para un niño", linea: "Su primer libro, con sus propias palabras.", ideal: "Ideal si tiene 11 años.", enlace: "Ver Mi Primer Capítulo" },
      viaje: { titulo: "Para un viaje", linea: "Una pregunta cada noche y, al volver, su libro.", ideal: "Ideal si tiene un viaje por delante.", enlace: "Ver Vitácora de Viaje" },
      evento: { titulo: "Para un evento", linea: "Entrevistamos a tus invitados y hacemos el libro de ese día.", ideal: "Ideal si tienes una boda o una fiesta.", enlace: "Ver Vitácora Eventos" },
      biografo: { titulo: "Con una editora", linea: "Una editora especializada se encarga de tu libro.", ideal: "Ideal si quieres que lo edite una persona.", enlace: "Ver Vitácora Biógrafo" },
    },
    atajos: {
      familiar: { pista: "¿Para tu familia?", nombre: "Un familiar" },
      ti: { pista: "¿Tu propia vida?", nombre: "Para ti" },
      nino: { pista: "¿Tiene 11 años?", nombre: "Un niño" },
      viaje: { pista: "¿Se va de viaje?", nombre: "Un viaje" },
      evento: { pista: "¿Hay una fiesta?", nombre: "Un evento" },
      biografo: { pista: "¿Prefieres a una editora?", nombre: "Con una editora" },
    },
    biografo: { etiqueta: "Vitácora Biógrafo", nombre: "Florencia Monfort", rol: "Editora especializada", texto: "Es la persona que edita estos libros.", boton: "Escribir por WhatsApp", fotoFalta: "Florencia Monfort" },
    audios: { titulo: "Sus audios de WhatsApp se vuelven capítulos." },
    pasos: {
      titulo: "Así se hace su libro.",
      lista: [
        { titulo: "Se lo regalas", texto: "Con la tarjeta en sus manos o el día que nos digas." },
        { titulo: "Responde por WhatsApp", texto: "Con audios o escribiendo, cuando tiene un rato." },
        { titulo: "Añades tus preguntas", texto: "Lo que siempre quisiste saber, y las fotos para su libro." },
        { titulo: "Llega a casa", texto: "Escribimos su biografía, un libro de memorias con sus palabras. Eliges la tapa y te lo enviamos." },
      ],
      ejemplo: ["¿Qué le preguntarías tú?", "¿Cómo conociste a la abuela?"],
      agregar: "Añadir pregunta",
    },
    voz: { titulo: "Se lee y también se escucha.", texto: "El libro lleva sus mejores frases con su voz real, en un QR de la contraportada." },
    privacidad: { titulo: "Su historia es de tu familia.", texto: "Sabemos que lo que cuenta es personal. Los audios originales se borran tres meses después de terminar el libro, o antes si lo pides.", enlace: "Cómo cuidamos sus datos" },
    cierre: { frase: "Un día vas a querer preguntarle algo.", boton: "Iniciar Vitácora" },
  },
  ar: {
    inicio: { boton: "¿Para quién es?" },
    tienda: {
      titulo: "Vitácora convierte una vida en un libro para siempre.",
      bajada: "Solo hay que responder preguntas por WhatsApp. Nosotros nos encargamos del resto. Un regalo emotivo, un libro que va a pasar de generación en generación.",
      pie: ["Envío incluido", "Sin apps ni contraseñas", "Con un QR para escuchar su voz"],
    },
    precios: { impresoDigital: "Impreso y digital", soloDigital: "Solo digital", viaje: "Vitácora de Viaje", pronto: "Mi Primer Capítulo", prontoValor: "Pronto", evento: "Según el evento", consultar: "Consultar", biografo: "Vitácora Biógrafo" },
    marcas: { regalo: "El regalo", pronto: "Próximamente" },
    cajas: {
      familiar: { titulo: "Para un familiar", linea: "La vida de tu abuela, tu abuelo o quien quieras, con sus palabras.", ideal: "Ideal si se la querés regalar.", enlace: "Ver Vitácora Familiar" },
      ti: { titulo: "Para vos", linea: "Tu propia historia, para que quede en tu familia.", ideal: "Ideal si querés dejarla escrita.", enlace: "Ver Vitácora para vos" },
      nino: { titulo: "Para un chico", linea: "Su primer libro, con sus propias palabras.", ideal: "Ideal si tiene 11 años.", enlace: "Ver Mi Primer Capítulo" },
      viaje: { titulo: "Para un viaje", linea: "Una pregunta cada noche y, al volver, su libro.", ideal: "Ideal si tiene un viaje por delante.", enlace: "Ver Vitácora de Viaje" },
      evento: { titulo: "Para un evento", linea: "Entrevistamos a tus invitados y hacemos el libro de ese día.", ideal: "Ideal si tenés un casamiento o una fiesta.", enlace: "Ver Vitácora Eventos" },
      biografo: { titulo: "Con una editora", linea: "Una editora especializada se encarga de tu libro.", ideal: "Ideal si querés que lo edite una persona.", enlace: "Ver Vitácora Biógrafo" },
    },
    atajos: {
      familiar: { pista: "¿Para tu familia?", nombre: "Un familiar" },
      ti: { pista: "¿Tu propia vida?", nombre: "Para vos" },
      nino: { pista: "¿Tiene 11 años?", nombre: "Un chico" },
      viaje: { pista: "¿Se va de viaje?", nombre: "Un viaje" },
      evento: { pista: "¿Hay una fiesta?", nombre: "Un evento" },
      biografo: { pista: "¿Preferís a una editora?", nombre: "Con una editora" },
    },
    biografo: { etiqueta: "Vitácora Biógrafo", nombre: "Florencia Monfort", rol: "Editora especializada", texto: "Es la persona que edita estos libros.", boton: "Escribir por WhatsApp", fotoFalta: "Florencia Monfort" },
    audios: { titulo: "Sus audios de WhatsApp se vuelven capítulos." },
    pasos: {
      titulo: "Así se hace su libro.",
      lista: [
        { titulo: "Se lo regalás", texto: "Con la tarjeta en sus manos o el día que nos digas." },
        { titulo: "Responde por WhatsApp", texto: "Con audios o escribiendo, cuando tiene un rato." },
        { titulo: "Sumás tus preguntas", texto: "Lo que siempre quisiste saber, y las fotos para su libro." },
        { titulo: "Llega a casa", texto: "Escribimos su biografía, un libro de memorias con sus palabras. Elegís la tapa y te lo mandamos." },
      ],
      ejemplo: ["¿Qué le preguntarías vos?", "¿Cómo conociste a la abuela?"],
      agregar: "Sumar pregunta",
    },
    voz: { titulo: "Se lee y también se escucha.", texto: "El libro lleva sus mejores frases con su voz real, en un QR de la contratapa." },
    privacidad: { titulo: "Su historia es de tu familia.", texto: "Sabemos que lo que cuenta es personal. Los audios originales se borran tres meses después de terminar el libro, o antes si lo pedís.", enlace: "Cómo cuidamos sus datos" },
    cierre: { frase: "Un día vas a querer preguntarle algo.", boton: "Iniciar Vitácora" },
  },
  ca: {
    inicio: { boton: "Per a qui és?" },
    tienda: {
      titulo: "Vitácora converteix una vida en un llibre per sempre.",
      bajada: "Només cal respondre preguntes per WhatsApp. Nosaltres ens encarreguem de la resta. Un regal emotiu, un llibre que passarà de generació en generació.",
      pie: ["Enviament inclòs", "Sense apps ni contrasenyes", "Amb un QR per escoltar la seva veu"],
    },
    precios: { impresoDigital: "Imprès i digital", soloDigital: "Només digital", viaje: "Vitácora de Viatge", pronto: "El meu primer capítol", prontoValor: "Aviat", evento: "Segons l'esdeveniment", consultar: "Consultar", biografo: "Vitácora Biògraf" },
    marcas: { regalo: "El regal", pronto: "Aviat" },
    cajas: {
      familiar: { titulo: "Per a un familiar", linea: "La vida de la teva àvia, el teu avi o qui vulguis, amb les seves paraules.", ideal: "Ideal si la hi vols regalar.", enlace: "Veure Vitácora Familiar" },
      ti: { titulo: "Per a tu", linea: "La teva pròpia història, perquè quedi a la teva família.", ideal: "Ideal si la vols deixar escrita.", enlace: "Veure Vitácora per a tu" },
      nino: { titulo: "Per a un infant", linea: "El seu primer llibre, amb les seves paraules.", ideal: "Ideal si té 11 anys.", enlace: "Veure El meu primer capítol" },
      viaje: { titulo: "Per a un viatge", linea: "Una pregunta cada nit i, en tornar, el seu llibre.", ideal: "Ideal si té un viatge per endavant.", enlace: "Veure Vitácora de Viatge" },
      evento: { titulo: "Per a un esdeveniment", linea: "Entrevistem els teus convidats i fem el llibre d'aquell dia.", ideal: "Ideal si tens un casament o una festa.", enlace: "Veure Vitácora Esdeveniments" },
      biografo: { titulo: "Amb una editora", linea: "Una editora especialitzada s'encarrega del teu llibre.", ideal: "Ideal si vols que l'editi una persona.", enlace: "Veure Vitácora Biògraf" },
    },
    atajos: {
      familiar: { pista: "Per a la teva família?", nombre: "Un familiar" },
      ti: { pista: "La teva pròpia vida?", nombre: "Per a tu" },
      nino: { pista: "Té 11 anys?", nombre: "Un infant" },
      viaje: { pista: "Se'n va de viatge?", nombre: "Un viatge" },
      evento: { pista: "Hi ha una festa?", nombre: "Un esdeveniment" },
      biografo: { pista: "Prefereixes una editora?", nombre: "Amb una editora" },
    },
    biografo: { etiqueta: "Vitácora Biògraf", nombre: "Florencia Monfort", rol: "Editora especialitzada", texto: "És la persona que edita aquests llibres.", boton: "Escriure per WhatsApp", fotoFalta: "Florencia Monfort" },
    audios: { titulo: "Els seus àudios de WhatsApp es tornen capítols." },
    pasos: {
      titulo: "Així es fa el seu llibre.",
      lista: [
        { titulo: "L'hi regales", texto: "Amb la targeta a les seves mans o el dia que ens diguis." },
        { titulo: "Respon per WhatsApp", texto: "Amb àudios o escrivint, quan té una estona." },
        { titulo: "Afegeixes les teves preguntes", texto: "El que sempre has volgut saber, i les fotos per al seu llibre." },
        { titulo: "Arriba a casa", texto: "Escrivim la seva biografia, un llibre de memòries amb les seves paraules. Tries la tapa i te'l enviem." },
      ],
      ejemplo: ["Què li preguntaries tu?", "Com vas conèixer l'àvia?"],
      agregar: "Afegir pregunta",
    },
    voz: { titulo: "Es llegeix i també s'escolta.", texto: "El llibre porta les seves millors frases amb la seva veu real, en un QR de la contraportada." },
    privacidad: { titulo: "La seva història és de la teva família.", texto: "Sabem que el que explica és personal. Els àudios originals s'esborren tres mesos després d'acabar el llibre, o abans si ho demanes.", enlace: "Com cuidem les seves dades" },
    cierre: { frase: "Un dia voldràs preguntar-li alguna cosa.", boton: "Iniciar Vitácora" },
  },
};
```

- [ ] **Step 4: Crear `_portada/datos-cajas.ts`**

```ts
import type { Catalogo } from "@/lib/productos";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_PORTADA_NUEVA, type TextoCaja } from "../_textos/portada-nueva";

// Las cajitas de la portada, puras: reciben el catálogo y devuelven lo que se
// pinta. Sin un precio en el catálogo, esa fila no existe. Biógrafo se prende
// con VITACORA_BIOGRAFO=1 cuando estén el permiso, la foto y el texto de
// Florencia. «Para un niño» sigue en Próximamente hasta que se venda Kids.

export type IdCaja = "familiar" | "ti" | "nino" | "viaje" | "evento" | "biografo";
export type Caja = {
  id: IdCaja;
  textos: TextoCaja;
  tinte: 1 | 2 | 3 | 4 | 5 | 6;
  foto: string | null;
  filas: { etiqueta: string; valor: string }[];
  href: string | null;
  marca: "regalo" | "pronto" | null;
};

export function cajasPortada(
  idioma: IdiomaWeb,
  cat: Catalogo,
  formatear: (n: number) => string,
  biografo = process.env.VITACORA_BIOGRAFO === "1",
): Caja[] {
  const t = TEXTOS_PORTADA_NUEVA[idioma];
  const p = t.precios;
  const adicional = cat.impreso?.precio ?? null;
  const dos = (digital: number) => [
    ...(adicional === null ? [] : [{ etiqueta: p.impresoDigital, valor: formatear(digital + adicional) }]),
    { etiqueta: p.soloDigital, valor: formatear(digital) },
  ];
  const comprar = ruta(idioma, "/comprar");

  const cajas: Caja[] = [
    { id: "familiar", textos: t.cajas.familiar, tinte: 1, foto: "/rediseno/para-tu-abuelo.jpg", filas: dos(cat.base.precio), href: `${comprar}?regalo=1`, marca: "regalo" },
    { id: "ti", textos: t.cajas.ti, tinte: 2, foto: "/rediseno/juan-domingo-tapa-foto.jpg", filas: dos(cat.base.precio), href: comprar, marca: null },
    { id: "nino", textos: t.cajas.nino, tinte: 3, foto: "/rediseno/kids-audio-cama.jpg", filas: [{ etiqueta: p.pronto, valor: p.prontoValor }], href: ruta(idioma, "/kids"), marca: "pronto" },
  ];
  if (cat.viaje !== null) {
    cajas.push({ id: "viaje", textos: t.cajas.viaje, tinte: 4, foto: "/rediseno/viaje-audio-hotel.jpg", filas: dos(cat.viaje), href: ruta(idioma, "/viaje"), marca: null });
  }
  cajas.push({ id: "evento", textos: t.cajas.evento, tinte: 5, foto: "/rediseno/eventos-casamiento-stand.jpg", filas: [{ etiqueta: p.evento, valor: p.consultar }], href: ruta(idioma, "/eventos"), marca: null });
  if (biografo) {
    cajas.push({ id: "biografo", textos: t.cajas.biografo, tinte: 6, foto: null, filas: [{ etiqueta: p.biografo, valor: p.consultar }], href: null, marca: null });
  }
  return cajas;
}
```

- [ ] **Step 5: Correr los tests**

Run: `npx vitest run test/portada-cajas.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/_textos/portada-nueva.ts src/app/_portada/datos-cajas.ts test/portada-cajas.test.ts
git commit -m "web: textos de la portada nueva y datos de las cajitas"
```

---

### Task 3: Piezas nuevas y paleta Acuarela

**Files:**
- Create: `web/src/app/_portada/cajas.tsx`
- Create: `web/src/app/_portada/audios-libro.tsx`
- Create: `web/src/app/_portada/acuarela.css`
- Modify: `web/src/app/_portada/portada.css` (primera línea)

**Interfaces:**
- Consumes: `cajasPortada`, `Caja` (Task 2), `TEXTOS_PORTADA_NUEVA`.
- Produces: `<Cajas idioma cajas whatsapp />`, con `cajas: Caja[]` y `whatsapp: string | null`; `<AudiosLibro />`.

- [ ] **Step 1: Crear `cajas.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_PORTADA_NUEVA } from "../_textos/portada-nueva";
import type { Caja } from "./datos-cajas";

// La tienda: la fila de atajos y las cajitas. Es server component: Biógrafo se
// abre con <details>, sin JS.
export function Cajas({ idioma, cajas, whatsapp }: { idioma: IdiomaWeb; cajas: Caja[]; whatsapp: string | null }) {
  const t = TEXTOS_PORTADA_NUEVA[idioma];
  return (
    <>
      <nav className="acu-ruta" aria-label={t.inicio.boton}>
        {cajas.map((c) => (
          <a key={c.id} href={`#caja-${c.id}`} className={`acu-tinte-${c.tinte}`}>
            <small>{t.atajos[c.id].pista}</small>
            {t.atajos[c.id].nombre}
          </a>
        ))}
      </nav>
      <div className="acu-cajas">
        {cajas.map((c) => (
          <article key={c.id} id={`caja-${c.id}`} className={`acu-caja${c.marca === "regalo" ? " acu-caja--regalo" : ""}`}>
            {c.marca ? <span className={`acu-marca${c.marca === "pronto" ? " acu-marca--gris" : ""}`}>{t.marcas[c.marca]}</span> : null}
            <div className={`acu-foto acu-tinte-${c.tinte}`}>
              {c.foto ? <Image src={c.foto} alt="" fill sizes="(min-width: 640px) 244px, 46vw" /> : null}
            </div>
            <div className="acu-cuerpo">
              <h3>{c.textos.titulo}</h3>
              <p>{c.textos.linea}</p>
              <p className={`acu-ideal acu-tinte-${c.tinte}`}>{c.textos.ideal}</p>
              <dl className="acu-precios">
                {c.filas.map((f) => (
                  <div key={f.etiqueta}>
                    <dt>{f.etiqueta}</dt>
                    <dd>{f.valor}</dd>
                  </div>
                ))}
              </dl>
              {c.href ? (
                <Link prefetch={false} href={c.href} className="acu-ir">
                  {c.textos.enlace} <span aria-hidden>→</span>
                </Link>
              ) : (
                <details className="acu-biografo">
                  <summary className="acu-ir">
                    {c.textos.enlace} <span aria-hidden>→</span>
                  </summary>
                  <div>
                    <span className="dir-micro">{t.biografo.etiqueta}</span>
                    <strong>{t.biografo.nombre}</strong>
                    <span>{t.biografo.rol}</span>
                    <p>{t.biografo.texto}</p>
                    {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer">{t.biografo.boton}</a> : null}
                  </div>
                </details>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Crear `audios-libro.tsx`**

```tsx
// Los audios que entran al libro y se vuelven líneas. Diseño propio, solo CSS.
// Es ilustración: aria-hidden. Con «menos movimiento» queda todo a la vista.
const ONDAS = [
  "M1 7v0M6 3v8M11 5v4M16 1v12M21 4v6M26 2v10M31 5v4M36 3v8M41 6v2",
  "M1 6v2M6 2v10M11 5v4M16 3v8M21 1v12M26 5v4M31 2v10M36 4v6M41 6v2",
  "M1 5v4M6 3v8M11 1v12M16 5v4M21 2v10M26 4v6M31 1v12M36 5v4M41 6v2",
];
const DURACIONES = ["2:14", "4:51", "3:40"];

export function AudiosLibro({ capitulos }: { capitulos: [string, string] }) {
  return (
    <div className="acu-escena" aria-hidden>
      <div className="acu-abierto">
        {capitulos.map((c) => (
          <div key={c} className="acu-hoja">
            <small>{c}</small>
            <i /><i /><i />
          </div>
        ))}
      </div>
      {ONDAS.map((d, i) => (
        <div key={d} className={`acu-audio acu-audio--${i + 1}`}>
          <svg viewBox="0 0 46 14"><path d={d} stroke="currentColor" strokeWidth="2" /></svg>
          {DURACIONES[i]}
        </div>
      ))}
    </div>
  );
}
```

`capitulos` son dos títulos que se pasan desde `portada.tsx`. Agregar a `TextosPortadaNueva.audios` el campo `capitulos: [string, string]`, con `["La infancia", "Sus primeros años"]` en es y ar, y `["La infància", "Els seus primers anys"]` en ca.

- [ ] **Step 3: Crear `acuarela.css`**

```css
/* La paleta Acuarela de la portada (05/11): blanco cálido, manchas de rosa
   bordó y aqua, bordó en títulos y botones. Vive acá: los tokens compartidos
   con el checkout y el panel no cambian. Prefijo acu-. */
.dir-portada {
  --acu-blanco: #fffdfa;
  --acu-tinta: #2a1c1c;
  --acu-suave: #6a5a57;
  --acu-bordo: #7a1f2e;
  --acu-titulo: #6d1b2a;
  --acu-sobre-bordo: #fff9f1;
  --acu-linea: rgba(90, 40, 45, 0.17);
  --acu-t1: #f8e4e3; --acu-t2: #dff0ec; --acu-t3: #fbeee0; --acu-t4: #ede3ef; --acu-t5: #fbf3d6; --acu-t6: #e4eedd;
  --acu-banda: #e5f2ef; --acu-banda2: #fbf0ee;
  --acu-lavado:
    radial-gradient(60% 75% at 12% 12%, rgba(201, 108, 120, 0.34), transparent 72%),
    radial-gradient(55% 70% at 90% 22%, rgba(128, 197, 186, 0.4), transparent 72%),
    radial-gradient(70% 60% at 62% 104%, rgba(226, 160, 160, 0.3), transparent 72%);
}
.acu-tinte-1 { background-color: var(--acu-t1); } .acu-tinte-2 { background-color: var(--acu-t2); }
.acu-tinte-3 { background-color: var(--acu-t3); } .acu-tinte-4 { background-color: var(--acu-t4); }
.acu-tinte-5 { background-color: var(--acu-t5); } .acu-tinte-6 { background-color: var(--acu-t6); }

.acu-hoja-lisa { background: var(--acu-blanco); color: var(--acu-tinta); }
.acu-hoja-banda { background: var(--acu-banda); color: var(--acu-tinta); }
.acu-hoja-banda2 { background: var(--acu-banda2); color: var(--acu-tinta); }
.dir-portada .acu-hoja-lisa .dir-titular, .dir-portada .acu-hoja-banda2 .dir-titular { color: var(--acu-tinta); }
.dir-portada .acu-hoja-banda .dir-titular { color: var(--acu-titulo); }

/* El inicio y el cierre: la acuarela. La cabecera lee --texto-oscuro. */
.acu-lavado {
  --texto-oscuro: var(--acu-titulo);
  --texto-oscuro-fuerte: var(--acu-titulo);
  --texto-oscuro-suave: var(--acu-suave);
  --texto-oscuro-menor: var(--acu-suave);
  --linea-oscura: var(--acu-linea);
  --borde-oscuro: var(--acu-linea);
  --borde-oscuro-fuerte: var(--acu-linea);
  --boton: var(--acu-bordo);
  --sobre-boton: var(--acu-sobre-bordo);
  background-color: #fdf6f1;
  background-image: var(--acu-lavado);
  color: var(--acu-titulo);
}
.acu-lavado .dir-titular { color: var(--acu-titulo); }
.dir-portada .dir-boton--lleno.acu-boton { background: var(--acu-bordo); color: var(--acu-sobre-bordo); }
.dir-portada .dir-boton--lleno.acu-boton:hover { background: #631826; }
.dir-portada .dir-boton--lleno.acu-boton:focus-visible { outline-color: var(--acu-bordo); }
.prt-libro.acu-libro .l3-sombra { background: radial-gradient(closest-side, rgba(90, 30, 40, 0.28), rgba(90, 30, 40, 0)); }

/* La tienda */
.acu-bajada { max-width: 60ch; margin-inline: auto; color: var(--acu-suave); font-size: clamp(16px, 1.7vw, 18px); line-height: 1.55; }
.acu-ruta { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; max-width: 1000px; margin: 28px auto 0; padding: 10px; border: 1px solid var(--acu-linea); border-radius: 20px; background: #fff; }
.acu-ruta a { display: block; padding: 8px 14px; border-radius: 12px; font-size: 13px; font-weight: 600; line-height: 1.2; color: var(--acu-tinta); text-align: left; }
.acu-ruta small { display: block; margin-bottom: 2px; font-size: 11px; font-weight: 400; color: var(--acu-suave); }
.acu-cajas { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; max-width: 760px; margin: 20px auto 0; text-align: left; }
.acu-caja { position: relative; display: flex; flex-direction: column; width: calc((100% - 28px) / 3); min-width: 0; overflow: hidden; background: #fff; border: 1px solid var(--acu-linea); border-radius: 14px; scroll-margin-top: 24px; }
@media (max-width: 640px) { .acu-cajas { gap: 10px; } .acu-caja { width: calc((100% - 10px) / 2); } }
.acu-caja--regalo { border: 2px solid var(--acu-bordo); box-shadow: 0 18px 30px -24px rgba(122, 31, 46, 0.7); }
.acu-marca { position: absolute; top: 10px; left: 50%; z-index: 1; transform: translateX(-50%); padding: 4px 11px; border-radius: 999px; background: var(--acu-bordo); color: var(--acu-sobre-bordo); font-size: 11px; font-weight: 600; white-space: nowrap; }
.acu-marca--gris { background: var(--acu-suave); }
.acu-foto { position: relative; aspect-ratio: 4 / 3; }
.acu-foto img { object-fit: cover; object-position: center 30%; filter: saturate(0.88) brightness(1.03); }
.acu-cuerpo { display: flex; flex: 1; flex-direction: column; gap: 8px; padding: 12px; }
.acu-cuerpo h3 { font-family: var(--fuente-titulo, inherit); font-size: 19px; line-height: 1.1; color: var(--acu-tinta); }
.acu-cuerpo > p { font-size: 13px; line-height: 1.4; color: var(--acu-suave); }
.acu-cuerpo > p.acu-ideal { padding: 8px 10px; border-radius: 9px; font-size: 12px; font-weight: 500; line-height: 1.3; color: var(--acu-tinta); }
.acu-precios { margin: auto 0 0; border: 1px solid var(--acu-linea); border-radius: 9px; font-variant-numeric: tabular-nums; }
.acu-precios > div { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 7px 10px; font-size: 12px; color: var(--acu-suave); }
.acu-precios > div + div { border-top: 1px solid var(--acu-linea); }
.acu-precios dd { margin: 0; font-size: 14px; font-weight: 600; color: var(--acu-tinta); white-space: nowrap; }
.acu-ir { font-size: 13px; font-weight: 600; color: var(--acu-bordo); cursor: pointer; }
.acu-biografo > div { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; font-size: 13px; color: var(--acu-suave); }
.acu-biografo strong { font-size: 16px; color: var(--acu-tinta); }
.acu-biografo a { color: var(--acu-bordo); text-decoration: underline; }
.acu-pie { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 24px; max-width: 760px; margin: 20px auto 0; padding: 13px 18px; border-radius: 12px; background: var(--acu-banda2); font-size: 14px; color: var(--acu-tinta); }
.acu-pie li::before { content: "✓ "; font-weight: 700; color: var(--acu-bordo); }

/* Los audios que se vuelven libro */
.acu-escena { position: relative; max-width: 760px; height: 320px; margin: 20px auto 0; overflow: hidden; }
.acu-abierto { position: absolute; top: 36px; left: 50%; display: grid; grid-template-columns: 1fr 1fr; width: min(430px, 88%); height: 250px; transform: translateX(-50%); box-shadow: 0 24px 34px -24px rgba(60, 20, 20, 0.6); }
.acu-hoja { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 18px 16px; background: #fffcf4; color: #2a241e; text-align: left; }
.acu-hoja:first-child { border-right: 1px solid #e0d7c5; }
.acu-hoja small { font-family: var(--fuente-titulo, inherit); font-size: 15px; font-style: italic; }
.acu-hoja i { height: 6px; border-radius: 1px; background: #3d352c; opacity: 0; animation: acu-linea 9s infinite; }
.acu-hoja i:nth-of-type(1) { animation-delay: 1.3s; }
.acu-hoja i:nth-of-type(2) { width: 92%; animation-delay: 1.6s; }
.acu-hoja i:nth-of-type(3) { width: 97%; animation-delay: 1.9s; }
.acu-audio { position: absolute; display: flex; align-items: center; gap: 8px; padding: 8px 13px; border-radius: 18px; background: #fff; color: var(--acu-bordo); font-size: 12px; font-weight: 600; white-space: nowrap; box-shadow: 0 6px 16px -8px rgba(60, 20, 20, 0.5); animation: acu-entra 9s infinite both; }
.acu-audio svg { width: 46px; height: 14px; }
.acu-audio--1 { top: 22px; left: 2%; }
.acu-audio--2 { top: 118px; right: 2%; --acu-x: -120px; animation-delay: 2.2s; }
.acu-audio--3 { top: 244px; left: 3%; animation-delay: 4.4s; }
@keyframes acu-linea { 0% { opacity: 0; transform: scaleX(0.2); transform-origin: left; } 6%, 88% { opacity: 0.72; transform: scaleX(1); } 96%, 100% { opacity: 0; } }
@keyframes acu-entra { 0% { opacity: 0; transform: translate(0, 8px); } 5%, 14% { opacity: 1; transform: none; } 24%, 100% { opacity: 0; transform: translate(var(--acu-x, 120px), 10px) scale(0.5); } }

/* Los pasos */
.acu-pasos { display: grid; grid-template-columns: repeat(auto-fit, minmax(205px, 1fr)); gap: 18px; max-width: 1040px; margin: 28px auto 0; text-align: left; }
.acu-paso { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.acu-paso-img { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 12px; background: var(--acu-t2); }
.acu-paso-img img { object-fit: cover; }
.acu-paso small { font-size: 12px; color: var(--acu-suave); }
.acu-paso h3 { font-family: var(--fuente-titulo, inherit); font-size: 20px; line-height: 1.15; color: var(--acu-tinta); }
.acu-paso p { font-size: 14px; line-height: 1.45; color: var(--acu-suave); }
.acu-pantallita { display: flex; flex-direction: column; justify-content: center; gap: 8px; height: 100%; padding: 16px; font-size: 12px; color: var(--acu-suave); }
.acu-pantallita span { padding: 7px 10px; border: 1px solid var(--acu-linea); border-radius: 7px; background: #fff; }
.acu-pantallita span:last-child { border: 0; background: var(--acu-bordo); color: var(--acu-sobre-bordo); font-weight: 600; text-align: center; }

@media (prefers-reduced-motion: reduce) {
  .acu-hoja i, .acu-audio { animation: none; }
  .acu-hoja i { opacity: 0.72; }
  .acu-audio { opacity: 1; }
}
```

- [ ] **Step 4: Sumarlo a la hoja de la portada**

Agregar `@import "./acuarela.css";` en `portada.css`, debajo de `@import "../_direccion/direccion.css";`.

- [ ] **Step 5: Comprobar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/app/_portada/cajas.tsx src/app/_portada/audios-libro.tsx src/app/_portada/acuarela.css src/app/_portada/portada.css src/app/_textos/portada-nueva.ts
git commit -m "web: las cajitas, los audios que se vuelven libro y la paleta Acuarela"
```

---

### Task 4: Rearmar la portada y sus tests

**Files:**
- Modify: `web/src/app/_portada/portada.tsx` (reemplazar el cuerpo de `Portada`)
- Modify: `web/src/lib/seo.ts` (`Foto` y `datosEstructurados`)
- Modify: `web/test/portada-trato.test.tsx`, `web/test/seo.test.tsx`, `web/test/portada-arreglos-amigo.test.tsx`

**Interfaces:**
- Consumes: `<Cajas>`, `<AudiosLibro>`, `cajasPortada`, `TEXTOS_PORTADA_NUEVA`, `data-libro-cierra`.
- Consumes sin cambios: `Cabecera`, `Pie`, `WhatsAppFlotante`, `CtaSticky`, `Acordeon`, `Libro3D`, `Coreografia`, `OndaQuieta`, y de `TEXTOS_PORTADA`: `hero.titulo`, `direccion.libro`, `faq`, `preguntas`, `dudas.hablar`, `elLibro.pagoUnico`, `libro.altPortada`, `voz.altContraportada`, `escuchalo.duracion`.

- [ ] **Step 1: Reescribir los tests que describen la portada**

En `portada-trato.test.tsx`:

- Reemplazar `DE_TU` y `DE_VOS` por:

```ts
const DE_TU = ["Ideal si se la quieres regalar.", "Se lo regalas", "Añades tus preguntas", "Eliges la tapa y te lo enviamos.", "o antes si lo pides."];
const DE_VOS = ["Ideal si se la querés regalar.", "Se lo regalás", "Sumás tus preguntas", "Elegís la tapa y te lo mandamos.", "o antes si lo pedís."];
```

- En los tests de `/` y `/ar`, cambiar los `toContain('src="/telefono-historia"')` y `'src="/ar/telefono-historia"'` por `not.toContain("telefono-historia")`.
- En `beforeEach`, sumar `process.env.PRECIO_VIAJE_EUR = "45"; process.env.PRECIO_VIAJE_ARS = "60000"; delete process.env.VITACORA_BIOGRAFO;`.
- En `PROHIBIDO`, sumar `"Unión Europea"`, `"Unió Europea"`, `"no los vendemos"`, `"Tú lo vas siguiendo"`, `"Vos lo vas siguiendo"`, `"Escuchas cada audio"`, `"Escuchás cada audio"`, `"Un regalo para quien cuenta"`, `"Nuestras ediciones"`, `"Florencia Monfort"`, y mantener `"Lo que dicen las familias"`, porque esa sección no sale hasta tener videos reales.
- Reemplazar el test del orden por:

```ts
it("el orden: inicio, tienda, audios, pasos, voz, privacidad, preguntas y cierre", () => {
  process.env.NEXT_PUBLIC_WHATSAPP_DUDAS = "+34600000000";
  const html = portada("es");
  const orden = [
    "En cada familia hay",
    "Vitácora convierte una vida en un libro para siempre.",
    "Para un familiar",
    "Sus audios de WhatsApp se vuelven capítulos.",
    "Así se hace su libro.",
    "Se lee y también se escucha.",
    "Su historia es de tu familia.",
    'id="preguntas"',
    "¿Te queda alguna duda?",
    "Un día vas a querer preguntarle algo.",
  ].map((s) => (s.startsWith("id=") ? s : escapar(s)));
  const posiciones = orden.map((s) => html.indexOf(s));
  posiciones.forEach((p, i) => expect(p, orden[i]).toBeGreaterThan(-1));
  expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
  delete process.env.NEXT_PUBLIC_WHATSAPP_DUDAS;
});
```

- Reemplazar el test del único precio por:

```ts
it("los dos precios en las cajitas, del catálogo y sin «desde»", () => {
  const es = portada("es");
  for (const n of [49 + 50, 49, 45 + 50, 45]) expect(es, String(n)).toContain(escapar(eur(n)));
  expect(es).not.toMatch(/[Dd]esde\s*(<!-- -->)?\s*\d/);
  const ar = portada("ar");
  for (const n of [65000 + 90000, 65000, 60000 + 90000, 60000]) expect(ar, String(n)).toContain(escapar(ars(n)));
  delete process.env.PRECIO_IMPRESO_EUR;
  const sinImpreso = portada("es");
  expect(sinImpreso).toContain(escapar(eur(49)));
  expect(sinImpreso).not.toContain("fixed inset-x-0 bottom-0");
});
```

- Cambiar el test «Iniciar Vitácora» para pedir al menos 2 apariciones (cabecera y cierre) y que ya no busque el lema.
- Cambiar el test de Escúchalo por:

```ts
it("Se lee y se escucha muestra la onda quieta, sin audio que suene (Naza, 25/10)", () => {
  const html = portada("es");
  expect(html).not.toContain("su-voz-campo.mp3");
  expect(html).not.toContain("<audio");
  expect(html).toContain("0:30");
});
```

- En `seo.test.tsx`, el test «las fotos del JSON-LD son las mismas» pide que `juan-domingo-portada.jpg` aparezca en el HTML. Si `Libro3D` no la pinta en ese HTML, sumarla como miniatura real de la sección 5, no quitar la comprobación.
- Sumar:

```ts
it("el inicio: una sola pantalla, con el libro que se cierra y sin el aire de abajo", () => {
  const es = portada("es");
  const inicio = es.slice(0, es.indexOf('id="hero"'));
  expect(inicio).toContain("data-libro-cierra");
  expect(inicio).toContain("min-h-[100svh]");
  expect(inicio).not.toContain("pb-[40svh]");
  expect(inicio).toContain('href="#tienda"');
});

it("las cajitas: cinco sin Biógrafo, y Florencia solo cuando se prende", () => {
  expect(portada("es").match(/id="caja-/g)?.length).toBe(5);
  process.env.VITACORA_BIOGRAFO = "1";
  const con = portada("es");
  expect(con.match(/id="caja-/g)?.length).toBe(6);
  expect(con).toContain("Florencia Monfort");
  expect(con).toContain("<details");
});

it("el regalo lleva a la compra con el regalo elegido, en su idioma", () => {
  expect(portada("es")).toContain('href="/comprar?regalo=1"');
  expect(portada("ar")).toContain('href="/ar/comprar?regalo=1"');
  expect(portada("ca")).toContain('href="/ca/comprar?regalo=1"');
});

it("la frase de Google sigue a la vista", () => {
  const html = portada("es");
  expect(html).toContain("biografía");
  expect(html).toContain("memorias");
});
```

Conservar sin cambios: estática, `/ca` (reemplazar el lema por `escapar("Vitácora converteix una vida en un llibre per sempre.")`), `padre`, prohibido, garantía, preguntas, sin vídeo, libro 3D con QR, una sola capa y sin violeta.

En `portada-arreglos-amigo.test.tsx`, reemplazar la expresión del deckle por la comprobación de que `.dir-portada > section + section { margin-top: -1px; }` sigue en el CSS.

En `seo.test.tsx`, reemplazar el test del marco por:

```ts
it("el marco no se anuncia, porque la portada ya no lo muestra", () => {
  const { datos } = jsonLdDe(idioma);
  expect(productos(datos).find((p) => p.name === "Marco con su voz")).toBeUndefined();
});
```

- [ ] **Step 2: Comprobar que fallan**

Run: `npx vitest run test/portada-trato.test.tsx test/seo.test.tsx test/portada-arreglos-amigo.test.tsx`
Expected: FAIL en orden, cajitas, inicio, regalo y marco.

- [ ] **Step 3: Cambiar `seo.ts`**

Hacer opcional `marco` en el tipo `Foto` y condicionar el producto:

```ts
const precioMarco = fotos.marco ? precioMarcoQueMuestraLaPagina(idioma, cat) : null;
if (precioMarco !== null && fotos.marco) {
```

- [ ] **Step 4: Reescribir `portada.tsx`**

Reemplazar los imports de piezas que ya no se usan y el cuerpo por:

```tsx
export function Portada({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PORTADA[idioma];
  const n = TEXTOS_PORTADA_NUEVA[idioma];
  const ej = TEXTOS_EJEMPLO[idioma];
  const cat = catalogo(regionDeIdioma(idioma));
  const formatear = (monto: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(monto);
  const precioLibro = cat.impreso ? formatear(cat.base.precio + cat.impreso.precio) : null;
  const jsonLd = datosEstructurados(idioma, { libro: FOTOS.portada });
  const comprar = ruta(idioma, "/comprar");
  const whatsapp = urlWhatsAppDudas();
  const cajas = cajasPortada(idioma, cat, formatear);
  const preguntas = [{ ...t.faq.preguntas[0], pregunta: t.preguntas.usarlo }, ...t.faq.preguntas.slice(1), ...t.preguntas.nuevas];
  const FOTOS_PASOS = [FOTOS.regalo, FOTOS.audio, null, FOTOS.familia] as const;

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada flex flex-1 flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Coreografia />

      {/* 1 · Inicio: una pantalla. Es la única capa: la tienda sube y lo tapa apenas se baja. */}
      <section data-capa className="acu-lavado relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-10 pt-24 text-center sm:px-8">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma={idioma} camino="/" sobreHero />
          </div>
          <h1 className="dir-titular dir-t2 dir-asienta max-w-[13ch] sm:max-w-none">
            {t.hero.titulo[0]} <br className="hidden sm:block" />
            {t.hero.titulo[1]}
          </h1>
          <div data-libro-3d data-libro-cierra className="l3-seccion prt-libro acu-libro dir-entra mt-6 w-full" style={conVar({ "--e": "0.5s" })}>
            <Libro3D idioma={idioma} b={t.direccion.libro} c={ej.libro} />
          </div>
          <a href="#tienda" className="dir-boton dir-boton--lleno acu-boton dir-entra mt-4" style={conVar({ "--e": "0.7s" })}>
            {n.inicio.boton}
          </a>
        </div>
      </section>
      <div id="hero" aria-hidden className="relative z-[2] h-px" />

      {/* 2 · La tienda */}
      <section id="tienda" className="acu-hoja-lisa dir-hoja dir-sobre-1 relative z-[2] -mt-px scroll-mt-0 px-4 py-14 text-center sm:px-8 md:py-20">
        <h2 className="dir-titular dir-t3 mx-auto max-w-[20ch]">{n.tienda.titulo}</h2>
        <p className="acu-bajada mt-4">{n.tienda.bajada}</p>
        <Cajas idioma={idioma} cajas={cajas} whatsapp={whatsapp} />
        <ul className="acu-pie">
          {n.tienda.pie.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </section>

      {/* 3 · Los audios que se vuelven capítulos */}
      <section className="acu-hoja-banda relative z-[3] px-4 py-14 text-center sm:px-8 md:py-20">
        <h2 className="dir-titular dir-t3 mx-auto max-w-[18ch]">{n.audios.titulo}</h2>
        <AudiosLibro capitulos={n.audios.capitulos} />
      </section>

      {/* 4 · Los cuatro pasos */}
      <section id="como-funciona" className="acu-hoja-lisa relative z-[4] scroll-mt-6 px-4 py-14 text-center sm:px-8 md:py-20">
        <h2 className="dir-titular dir-t3">{n.pasos.titulo}</h2>
        <ol className="acu-pasos">
          {n.pasos.lista.map((paso, i) => {
            const foto = FOTOS_PASOS[i];
            return (
              <li key={paso.titulo} className="acu-paso">
                <div className="acu-paso-img">
                  {foto ? (
                    <Image src={foto} alt="" fill sizes="(min-width: 768px) 25vw, 90vw" />
                  ) : (
                    <div aria-hidden className="acu-pantallita">
                      <span>{n.pasos.ejemplo[0]}</span>
                      <span>{n.pasos.ejemplo[1]}</span>
                      <span>{n.pasos.agregar}</span>
                    </div>
                  )}
                </div>
                <small>{t.como.paso(i + 1)}</small>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 5 · Se lee y se escucha: quieta, sin reproducir (Naza, 25/10). */}
      <section className="acu-hoja-banda2 relative z-[5] px-4 py-14 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-[1040px] grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
            <Image src={FOTOS.familia} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="dir-titular dir-t3">{n.voz.titulo}</h2>
            <p className="text-[17px] text-[var(--acu-suave)]">{n.voz.texto}</p>
            <div className="max-w-[420px] text-[var(--acu-bordo)]"><OndaQuieta duracion={t.escuchalo.duracion} conPlay={false} /></div>
          </div>
        </div>
      </section>

      {/* 6 · Privacidad: no promete quién escucha hasta que el panel cambie. */}
      <section className="acu-hoja-lisa relative z-[6] px-4 pt-14 text-center sm:px-8">
        <div className="mx-auto flex max-w-[640px] flex-col items-center gap-3">
          <h2 className="dir-titular text-[28px]">{n.privacidad.titulo}</h2>
          <p className="text-[15px] text-[var(--acu-suave)]">{n.privacidad.texto}</p>
          <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")} className="text-[14px] font-semibold text-[var(--acu-bordo)] underline">
            {n.privacidad.enlace}
          </Link>
        </div>
      </section>

      {/* 7 · Preguntas: la garantía vive acá y solo acá (DECISIONES D1). */}
      <section id="preguntas" className="dir-papel acu-hoja-lisa relative z-[7] scroll-mt-6">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-10 px-4 py-14 sm:px-8 md:grid-cols-12 md:gap-8 md:py-20">
          <div className="md:col-span-4">
            <h2 className="dir-titular dir-t3">{t.faq.titulo}</h2>
          </div>
          <div className="flex flex-col gap-12 md:col-span-7 md:col-start-6">
            <div className="border-t border-[var(--dir-hilo-papel)]">
              {preguntas.map((q, i) => (
                <Fragment key={q.pregunta}>
                  <Acordeon pregunta={q.pregunta} abierta={i === 0} grupo="preguntas">
                    {q.respuesta}
                  </Acordeon>
                  {i === 1 ? (
                    <Acordeon pregunta={t.dudas.hablar.pregunta} grupo="preguntas">
                      {t.dudas.hablar.texto}
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {t.dudas.hablar.temas.map((tema) => <li key={tema} className="dir-tema">{tema}</li>)}
                      </ul>
                    </Acordeon>
                  ) : null}
                </Fragment>
              ))}
            </div>
            {whatsapp ? (
              <div className="flex flex-col gap-3">
                <span className="dir-pie">{t.faq.duda.titulo}</span>
                <p className="text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-papel-suave)]">{t.faq.duda.texto}</p>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="dir-boton dir-boton--lleno acu-boton self-start">
                  <IconoWhatsApp className="mr-2 h-4 w-4" />
                  {t.faq.duda.boton}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 8 · Cierre */}
      <section data-cta-propio className="acu-lavado relative z-[8] flex flex-col items-center gap-6 px-4 py-20 text-center sm:px-8">
        <h2 className="dir-titular dir-t3 max-w-[18ch]">{n.cierre.frase}</h2>
        <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno acu-boton">
          {n.cierre.boton}
        </Link>
      </section>
      <div className="dir-tinta relative z-[8]">
        <Pie idioma={idioma} camino="/" rasca landings={["preguntas", "voz"]} />
      </div>

      <WhatsAppFlotante idioma={idioma} />
      {precioLibro ? (
        <CtaSticky
          precio={precioLibro}
          href={comprar}
          textos={{ desde: "", conImpreso: t.elLibro.pagoUnico, sinImpreso: t.elLibro.pagoUnico, boton: t.iniciar }}
        />
      ) : null}
    </div>
  );
}
```

Reemplazar la constante `FOTOS` por:

```ts
const FOTOS = {
  portada: "/rediseno/juan-domingo-portada.jpg",
  regalo: "/rediseno/para-tu-abuelo.jpg",
  audio: "/rediseno/viaje-audio-hotel.jpg",
  familia: "/rediseno/familia-con-el-libro.jpg",
} as const;
```

Imports finales: `Image`, `Link`, `Fragment`, `Acordeon`, `Cabecera`, `IconoWhatsApp`, `Pie`, `WhatsAppFlotante`, `CtaSticky`, `TEXTOS_PORTADA`, `TEXTOS_PORTADA_NUEVA`, `TEXTOS_EJEMPLO`, `catalogo`, `datosEstructurados`, `langDeIdioma`, `localeDeIdioma`, `regionDeIdioma`, `ruta`, `IdiomaWeb`, `urlWhatsAppDudas`, `Coreografia`, `Libro3D`, `OndaQuieta`, `conVar`, `Cajas`, `AudiosLibro`, `cajasPortada`, y `./portada.css`. Actualizar el comentario de cabecera con el orden nuevo. No borrar `ediciones.tsx`, `demo-marco.tsx` ni `/telefono-historia` en este cambio: siguen compilando y otras pantallas pueden usarlos.

- [ ] **Step 5: Correr los tests de la portada**

Run: `npx vitest run test/portada-trato.test.tsx test/seo.test.tsx test/portada-arreglos-amigo.test.tsx test/portada-cajas.test.ts test/libro-estado.test.ts`
Expected: PASS. Si un test de la pregunta frecuente menciona `¿Mi padre va a saber usarlo?`, recordar que la primera se reemplaza con `t.preguntas.usarlo`.

- [ ] **Step 6: Correr todo**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: sin errores. Si otro test depende de la portada vieja, ajustarlo solo si describía secciones que este diseño saca.

- [ ] **Step 7: Commit**

```bash
git add src/app/_portada/portada.tsx src/lib/seo.ts test/portada-trato.test.tsx test/seo.test.tsx test/portada-arreglos-amigo.test.tsx
git commit -m "web: la portada nueva, con la tienda en la segunda pantalla"
```

---

### Task 5: Comprobar en el navegador y medir

**Files:**
- Modify: según lo que aparezca. Solo arreglos de lo que la comprobación encuentre.

**Interfaces:**
- Consumes: la página completa de la Task 4.

- [ ] **Step 1: Levantar la web**

Agregar a `.claude/launch.json` una configuración `web-portada` si no existe, con `npm run dev` en `web/`, y abrirla con `preview_start`.

- [ ] **Step 2: Recorrer a 1440 y 390 px**

Comprobar, con capturas:
- El libro gira, se abre, espera y queda cerrado. Al volver arriba se ve la tapa.
- La hoja blanca sube con el primer movimiento de bajada, sin negro ni vacío.
- Las cinco cajitas se ven parejas, con sus dos precios y el color de cada «Ideal si…». Los enlaces van a su lugar.
- La cabecera se lee sobre la acuarela y el menú del celular funciona.
- No hay movimiento horizontal y la barra fija del móvil no tapa contenido.
- Con `prefers-reduced-motion`, todo queda quieto y completo.
- `/ar` en pesos y de vos, `/ca` en catalán.

- [ ] **Step 3: Medir las metas**

Correr en la consola de la página la misma medición del 05/11 y anotar el resultado en el PR:

```js
const H = document.documentElement.scrollHeight;
for (let y = 0; y < H; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
scrollTo(0, 0);
const c = document.body.cloneNode(true);
c.querySelectorAll("script,style,noscript,svg,template,.sr-only,[aria-hidden=true]").forEach(e => e.remove());
const palabras = c.textContent.split(/\s+/).filter(Boolean).length;
const grandes = [...document.querySelectorAll("img,video,iframe")].filter(e => { const r = e.getBoundingClientRect(); return r.width >= 120 && r.height >= 90; });
const area = grandes.reduce((a, e) => { const r = e.getBoundingClientRect(); return a + r.width * r.height; }, 0);
({ alto: H, palabras, media: Math.round(100 * area / (H * innerWidth)), precio: Math.round(document.querySelector(".acu-precios").getBoundingClientRect().top + scrollY) });
```

Metas: imagen o video al menos 35 %, primer precio antes de 1.800 px, alrededor de 600 palabras y hasta 9.000 px. El informe tiene que decir qué meta no se alcanzó y por qué. La de imagen depende de sumar fotos y videos, y no se fuerza con fotos de relleno.

- [ ] **Step 4: Subir la rama y abrir el PR**

Solo con la aprobación de textos de Naza en curso. PR a `main`, sin mergear. En la descripción: capturas, medición, lista de textos pendientes y el aviso de coordinar con el PR del panel de Joaquín.

---

## Después de este plan

- Pedir a Naza la aprobación de los textos en tandas de 10.
- Revisar el catalán con el corrector de Softcatalà y con Imma.
- Cuando el PR del panel esté en producción, proponer el texto nuevo de privacidad a Naza.
- Con el permiso, la foto y el texto de Florencia, prender `VITACORA_BIOGRAFO=1` y definir su precio.
