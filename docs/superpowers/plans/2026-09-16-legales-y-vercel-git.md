# Legales completos + Vercel ↔ GitHub — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Términos y privacidad completos y verdaderos (sin `[PENDIENTE]` salvo NIF/CUIT/domicilio), botón de arrepentimiento, y producción deployándose sola desde `main`.

**Architecture:** Los datos que cambian (titulares, contacto, fecha) viven en un solo módulo `titulares.ts`; las tres páginas legales son componentes de servidor de Next que renderizan prosa con componentes de maqueta compartidos en `ui.tsx`. La conexión a GitHub es configuración del proyecto en Vercel, sin código.

**Tech Stack:** Next.js (App Router, RSC), Tailwind, vitest, Vercel CLI 59.

Spec: `docs/superpowers/specs/2026-09-16-legales-y-vercel-git-design.md`.

## Global Constraints

- Tono llano, en "tú", sin jerga. Castellano con tildes en texto de persona; identificadores y archivos sin tildes. Repo CRLF.
- Titulares: España → **Immaculada Collel**; Argentina → **Joaquín Molina**. NIF/CUIT/domicilio quedan vacíos y se pintan en amarillo (`Pendiente`) hasta que se completen. No inventar ningún dato fiscal.
- Devolución en **mínimo legal**: ES 14 días naturales (proporcional si la entrevista empezó a pedido del comprador; sin desistimiento para digital ya entregado ni personalizado); AR 10 días corridos sin costo + "Botón de arrepentimiento" con esa leyenda en la home. Sin libro (narrador no acepta o < 10 respuestas): devolución total sin plazo.
- Pago: único y **por adelantado** (ya no existe el "pagas en la tercera pregunta").
- Proveedores a nombrar en privacidad, todos reales: Supabase (UE), Vercel, Railway, Meta/WhatsApp, OpenAI (transcripción y voz sintética), Anthropic (redacción), proveedor de clonación de voz (todavía no elegido: decirlo así), Stripe, Mercado Pago, Resend, imprenta (a elegir).
- Textos que lee una persona son producto: Naza los aprueba antes del merge.
- Verificación real: nada se declara hecho sin la salida del comando pegada.

---

### Task 1: Conectar Vercel a GitHub

**Files:** ninguno del repo (configuración en Vercel).

- [ ] **Step 1: Conectar el repo**

Run (PowerShell, desde `web/`): `& "C:\Users\Naza\scoop\apps\nodejs-lts\current\bin\vercel.cmd" git connect --yes`
Expected: `Connected GitHub repository molinazavaliaj/VITACORA-FAMILIAR-!` (o un error que pide instalar la GitHub App de Vercel en la cuenta dueña del repo → pasarle a Naza el link para Joaquín y seguir con la Task 2).

- [ ] **Step 2: Root Directory = web**

Run: `& vercel.cmd project inspect vitacora-familiar` y mirar `Root Directory`. Si sigue en `.`: PATCH `https://api.vercel.com/v9/projects/prj_oYk4cfitEdqG2gVzlAlEUY3Q6Isa?teamId=team_Dby99Pb5AzpVpYroZy9VJIdr` con body `{"rootDirectory":"web"}` usando el token de `%APPDATA%\com.vercel.cli\Data\auth.json`; si no se puede, Naza lo cambia en Settings → Build & Deployment → Root Directory.
Expected: `project inspect` muestra `Root Directory  web` y una sección `Git Repository` con el repo.

- [ ] **Step 3: Anotar en el ROADMAP** (2.8 ✅ con la fecha) — se commitea junto con la Task 6.

---

### Task 2: `titulares.ts` + `ui.tsx` (con test)

**Files:**
- Create: `web/src/app/legal/titulares.ts`
- Create: `web/src/app/legal/ui.tsx`
- Test: `web/test/legal.test.ts`

**Interfaces (Produces):**
```ts
export type Region = "ES" | "AR";
export type Titular = {
  region: Region; nombre: string; pais: string;
  documento: { etiqueta: "NIF" | "CUIT"; valor: string };
  domicilio: string; ley: string; autoridad: { nombre: string; url: string };
};
export const TITULARES: Record<Region, Titular>;
export const CONTACTO = { hola: "hola@vitacorafamiliar.com", soporte: "soporte@vitacorafamiliar.com" };
export const ACTUALIZADO = "16 de septiembre de 2026";
/** Campos del titular que todavía no se completaron (se pintan en amarillo). */
export function faltan(t: Titular): string[];
```
`ui.tsx` exporta `Pagina({titulo, bajada, children})` (contenedor `max-w-lg` + "Última actualización"), `Seccion({id, titulo, children})`, `Parrafo`, `Enlace({href, children})`, `Tabla({columnas, filas})` y `Pendiente({etiqueta})`.

- [ ] **Step 1: Test que falla**

```ts
import { describe, it, expect } from "vitest";
import { TITULARES, faltan } from "../src/app/legal/titulares";

describe("titulares", () => {
  it("España es Immaculada Collel y Argentina Joaquín Molina", () => {
    expect(TITULARES.ES.nombre).toBe("Immaculada Collel");
    expect(TITULARES.AR.nombre).toBe("Joaquín Molina");
    expect(TITULARES.ES.documento.etiqueta).toBe("NIF");
    expect(TITULARES.AR.documento.etiqueta).toBe("CUIT");
  });
  it("faltan() lista solo los campos vacíos", () => {
    expect(faltan({ ...TITULARES.ES, documento: { etiqueta: "NIF", valor: "" }, domicilio: "" })).toEqual(["NIF", "domicilio"]);
    expect(faltan({ ...TITULARES.ES, documento: { etiqueta: "NIF", valor: "X" }, domicilio: "Calle 1" })).toEqual([]);
  });
});
```

- [ ] **Step 2:** `npm test -- legal` → FAIL (módulo inexistente).
- [ ] **Step 3:** Escribir `titulares.ts` (datos de arriba, `valor: ""` y `domicilio: ""`; `ley` y `autoridad`: ES → "la ley española y la normativa de la Unión Europea (RGPD, LOPDGDD, LSSI-CE, RDL 1/2007)", AEPD `https://www.aepd.es`; AR → "la ley argentina (leyes 25.326 y 24.240, Res. 424/2020)", AAIP `https://www.argentina.gob.ar/aaip`) y `ui.tsx` con las clases que hoy usan las páginas (`text-base font-medium` títulos, `text-sm leading-relaxed text-zinc-700` párrafos, `bg-amber-100 px-1` pendiente).
- [ ] **Step 4:** `npm test -- legal` → PASS; `npx tsc --noEmit` limpio.
- [ ] **Step 5:** Commit `legal: titulares en un solo lugar + maqueta compartida`.

---

### Task 3: `/legal/terminos` reescrito

**Files:** Modify `web/src/app/legal/terminos/page.tsx` (reemplazo completo).

Secciones, en este orden y con estos hechos (la prosa la escribe el implementador en el tono de las páginas actuales):
1. **Quiénes somos** — dos titulares, cuál te aplica según la región elegida en el checkout; NIF/CUIT/domicilio con `Pendiente` si `faltan()`; contacto `hola@`.
2. **Qué es el servicio** — entrevista por WhatsApp, una pregunta por día ~30 días, audios; libro en PDF que se lee en la web; audiolibro con su voz clonada o con narrador; opcionales: libro impreso (B/N o color, tapa dura, código en contratapa), marcos con chip; muestra pública solo si compartes el link; invitados que ven el libro y suben fotos.
3. **Cómo se compra** — pago único por adelantado; precio en EUR o ARS según región, visible antes de pagar; Stripe / Mercado Pago; no guardamos tarjeta; sin suscripción; después del pago anotas al narrador y empieza el proceso de permiso.
4. **Nada empieza sin su permiso** — al anotar a alguien confirmas que puedes; le escribimos por WhatsApp; si no acepta → devolución total; puede parar, retomar o pedir borrado.
5. **Qué te entregamos y cuándo** — el libro se produce al terminar la entrevista (el ritmo lo pone el narrador); lo revisas y apruebas antes de cerrar; impreso y marcos se producen después de aprobar y los plazos se informan antes de mandar a producir; el libro queda disponible en tu cuenta.
6. **Si te arrepientes** — ES: 14 días naturales desde la compra, sin motivos; si pediste empezar antes y desistes, se descuenta la parte proporcional prestada (art. 108.3 RDL 1/2007); PDF/audiolibro ya puestos a tu disposición con tu consentimiento y productos personalizados (impreso, marcos) sin desistimiento (art. 103 c y m). AR: 10 días corridos desde la compra, sin costo (art. 34 ley 24.240), Botón de arrepentimiento (link a `/legal/arrepentimiento`), confirmación dentro de las 24 h. Devolución por el mismo medio en ≤ 14 días.
7. **Si no hay libro** — narrador no acepta o responde menos de diez preguntas: devolución total, sin plazo.
8. **La historia es de tu familia** — no nos quedamos con derechos; licencia limitada para producir tu libro; nunca como muestra sin permiso escrito; voz clonada solo para su audiolibro.
9. **Uso aceptable** — anotar solo a quien puedes; no usar el servicio para vigilar, acosar o grabar a alguien sin saberlo; fotos y textos de terceros bajo tu responsabilidad.
10. **Qué te prometemos y qué no** — con sus palabras; la IA participa en transcribir y redactar y puede equivocarse: por eso revisas antes de aprobar; libro corto si cuenta poco; responsabilidad limitada al precio pagado, salvo lo que la ley no permita limitar.
11. **Tus datos** → link a privacidad.
12. **Si algo cambia** — aviso por correo; nunca hacia atrás sobre un libro pagado.
13. **Ley y jurisdicción** — ES: ley española, tribunales del domicilio del consumidor, plataforma ODR `https://ec.europa.eu/consumers/odr`; AR: ley argentina, Defensa del Consumidor / COPREC; conservas siempre los derechos de tu país.
14. **Contacto** — `hola@` y `soporte@`.

- [ ] Escribir la página · `npx tsc --noEmit` · `npm run build` verde · abrir `/legal/terminos` en el navegador (móvil y escritorio) · commit `legal: términos completos`.

---

### Task 4: `/legal/privacidad` reescrito

**Files:** Modify `web/src/app/legal/privacidad/page.tsx` (reemplazo completo).

Secciones: 1 Responsables (dos, por región, `Pendiente` si falta) · 2 A quién aplica (comprador, narrador, invitados, visitantes) · 3 Qué datos: comprador (nombre, email, región, pedido; la tarjeta la ve solo Stripe/MP; IP y registros técnicos), narrador (nombre, WhatsApp, año de nacimiento, ficha, audios, transcripciones, textos, fotos; **su voz para clonar es un dato biométrico y se usa solo con su consentimiento explícito**), invitados (email, nombre, fotos que suben), visitantes (cookies técnicas) · 4 Para qué y con qué base (contrato; consentimiento del narrador para la voz y para participar; obligación legal de facturación; interés legítimo en seguridad) · 5 Quién procesa los datos — `Tabla` con columnas Quién / Para qué / Dónde: Supabase (base y archivos, UE) · Vercel (web) · Railway (entrevistador y fábrica) · Meta / WhatsApp (mensajes) · OpenAI (transcripción, voz sintética; no entrena con datos de API) · Anthropic (redacción; no entrena con datos de API) · proveedor de clonación de voz (a elegir; solo si compras esa opción) · Stripe / Mercado Pago (cobro) · Resend (correos) · imprenta (solo si compras impreso o marcos: nombre y dirección de envío) · 6 Transferencias internacionales (UE↔EE. UU. con cláusulas contractuales tipo / DPF; Argentina con decisión de adecuación de la UE) · 7 Cuánto tiempo (mientras el libro esté en tu cuenta; audios y voz clonada se borran a pedido; datos de facturación el plazo legal) · 8 Con quién compartimos (nunca vendemos; muestra pública solo si compartes; invitados) · 9 Tus derechos (acceso, rectificación, supresión, portabilidad, oposición, limitación; cómo: `hola@`; plazo un mes; AEPD / AAIP) · 10 Menores (comprador mayor de edad; el narrador da su permiso) · 11 Seguridad · 12 Cookies (solo técnicas: sesión y tema; sin analítica; si sumamos medición te pediremos consentimiento antes) · 13 IA (no entrenamos modelos con tus datos) · 14 Cambios · 15 Contacto.

- [ ] Escribir · `tsc` · `build` · abrir en navegador · commit `legal: privacidad completa`.

---

### Task 5: `/legal/arrepentimiento` + link en el footer

**Files:** Create `web/src/app/legal/arrepentimiento/page.tsx`; Modify `web/src/app/page.tsx:636-646` (footer nav).

- Página: título "Botón de arrepentimiento"; plazos por país (ES 14 / AR 10) con link a la sección 6 de términos; botón `<a href="mailto:hola@vitacorafamiliar.com?subject=Arrepentimiento%20de%20compra&body=...">` con cuerpo que pide correo de compra y nombre del narrador; "te confirmamos por correo dentro de las 24 horas".
- Footer: `<Link href="/legal/arrepentimiento">Arrepentimiento</Link>` junto a Términos y Privacidad, con las mismas clases.

- [ ] Escribir · `tsc` · `build` · abrir `/` y `/legal/arrepentimiento` · commit `legal: botón de arrepentimiento`.

---

### Task 6: Revisión de la rama, aprobación de Naza, merge y deploy

- [ ] Revisor con contexto limpio: corre `npm test`, `npm run build`, abre las tres páginas y contrasta cada sección contra el spec y las Global Constraints (pago por adelantado, mínimo legal, proveedores reales, sin `[PENDIENTE]` salvo fiscales). Reporta con salida pegada.
- [ ] Naza lee los textos (son producto) y veta lo que quiera.
- [ ] ROADMAP: 2.3 ✅ y 2.8 ✅ (16/09). Commit.
- [ ] `git checkout main && git merge --ff-only legales && git push origin main`.
- [ ] Si la Task 1 quedó conectada: esperar el deploy de Vercel y verificar `https://www.vitacorafamiliar.com/legal/terminos` con el texto nuevo. Si no: Naza corre `& vercel.cmd --prod --yes` desde una worktree limpia de `origin/main` (procedimiento de la memoria) y se verifica igual.
