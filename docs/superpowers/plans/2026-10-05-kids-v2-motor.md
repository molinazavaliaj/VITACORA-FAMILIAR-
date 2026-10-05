# Vitácora Kids V2 · Motor de la entrevista · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Programar el motor puro de «Mi Primer Capítulo» (Kids V2): una máquina de estados que, con la compra y lo que manda el chico por WhatsApp, decide qué mensaje del banco sale, a quién, cuándo y con qué botones, más una lectura corrida y una simulación de cientos de chicos inventados que lo prueban de punta a punta.

**Architecture:** Todo en `fabrica/src/kids-v2/`, puro (sin I/O, sin red, sin modelos de IA, sin `Date.now()`): un parser convierte `docs/kids/v2/banco.md` y `mensajes.md` en `banco.json` (generado y commiteado); `compra.ts` arma el guion efectivo de cada chico; el motor es `paso(estado, evento, ahora) → { estado, salidas }`, partido en archivos chicos por responsabilidad (`motor/flujo.ts`, `rafaga.ts`, `botones.ts`, `reloj.ts`, `sobrio.ts`). Sigue el patrón del motor de Viaje V2 (rama `viajes-v2`, `fabrica/src/viaje-v2/`): parser + json generado + test de "json al día", lectura corrida generada por script y simulador con semilla y controles.

**Tech Stack:** TypeScript 5.9 (ESM, `module: nodenext`, imports con `.js`), vitest 4.1, tsx 4 para los scripts, `Intl.DateTimeFormat` para zonas horarias (sin librerías nuevas).

## Global Constraints

- Worktree `C:\Users\Naza\Desktop\VITACORA KIDS`, rama `vitacora-kids`. Nunca `git checkout` en la carpeta principal (`VITACORA FAMILIAR`). Push solo `git push origin vitacora-kids`.
- Todas las rutas del plan son relativas a la raíz del worktree. Los tests y `tsc` se corren desde `fabrica/`: `npx vitest run test/kids-v2` y `npx tsc --noEmit -p .` (el tsconfig solo chequea `src/`).
- El worktree no tiene `fabrica/node_modules`: la tarea 1 corre `npm ci` en `fabrica/` (no se agregan dependencias).
- Código en `fabrica/src/kids-v2/`, puro: sin I/O, sin red, sin modelos de IA, sin leer el reloj del sistema (el tiempo entra como `ahora`). Los scripts (`fabrica/scripts/kids-v2-*.ts`) son lo único que escribe archivos.
- **Ningún texto que lee una persona se escribe en el código**: sale de `banco.json` (generado desde `banco.md` y `mensajes.md`) por ID. Si al parsear falta un ID que el motor usa, el parseo tira error y el test falla. Las preguntas del padre van tal cual las escribió.
- **No se tocan** `docs/kids/v2/banco.md`, `mensajes.md`, `flujo-vigente.md`, `paso-4-huecos-decisiones.md` ni `plantillas-meta-kids.md` (los aprueba Naza). Si un test muestra un texto mal, se para y se avisa; no se edita el md.
- No pisar: todo es archivo nuevo. Lo único que se reemplaza entero es lo que este mismo plan creó en una tarea anterior (se dice explícitamente).
- Reglas de los textos (banco.md, mensajes.md, `paso-3-sin-dos-puntos.md`): nada que el bot le dice al chico dice que le gusta, le alegra o le encanta, ni guarda algo "con cariño"; ningún dos puntos en lo que lee una persona; ningún `{{` sin llenar.
- Números del flujo (`paso-4-huecos-decisiones.md`, defaults técnicos 05/10), en `reglas.ts`: 90 s de silencio para acusar una ráfaga; "muy corto" = audio de menos de 15 s y texto de menos de 8 palabras; nada entre las 22:00 y las 9:00 (hora del país del número); ventana de 24 h; recordatorios al padre a los 4 y 8 días (y marca a Naza); cierre solo a los 2 días sin respuesta a la oferta de extras; sin tope de preguntas por día; no se acumulan; [Paso] en todas las principales.
- Comentarios y nombres en castellano rioplatense, como el resto de `fabrica/`. Chicos y familias de los ejemplos, INVENTADOS: nunca la vida de un narrador real.
- Cada commit en castellano rioplatense y termina con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## Mapa de archivos

| Archivo | Qué hace | Tarea |
|---|---|---|
| `fabrica/src/kids-v2/tipos.ts` | Tipos del banco: `Pregunta`, `Rama`, `Foto`, `Extra`, `MensajeFijo`, `BancoKids` | 1 |
| `fabrica/src/kids-v2/banco-md.ts` | Parser de `banco.md` + `mensajes.md`; `IDS_REQUERIDOS` | 1 |
| `fabrica/scripts/kids-v2-json.ts` | Genera `banco.json` | 1 |
| `fabrica/src/kids-v2/banco.json` | Generado (commiteado) | 1 |
| `fabrica/src/kids-v2/banco.ts` | `BANCO`, `pregunta(id)`, `fijo(id)`, `extra(id)` | 1 |
| `fabrica/src/kids-v2/texto.ts` | `{{o/a}}`, `{{1}}…`, plural de "quién se lo regala", primer nombre | 2 |
| `fabrica/src/kids-v2/horas.ts` | Zonas, noche (22–9), fechas locales | 3 |
| `fabrica/src/kids-v2/reglas.ts` | Los números del flujo | 3 |
| `fabrica/src/kids-v2/acuses.ts` | Rotación de acuses (texto, cápsula, foto, día feo) | 3 |
| `fabrica/src/kids-v2/compra.ts` | `Ficha`, `validarFicha`, temas, `armarGuion` (guion efectivo, fotos que se mudan) | 4 |
| `fabrica/src/kids-v2/extras.ts` | `extrasDisponibles` | 4 |
| `fabrica/src/kids-v2/motor/tipos.ts` | `Evento`, `Contenido`, `Mensaje`, `Salida`, `Fase`, `Estado` | 5 |
| `fabrica/src/kids-v2/motor/estado.ts` | `nuevoEstado(ficha)` | 5 |
| `fabrica/src/kids-v2/motor/mensajes.ts` | Arma mensajes: destino, género, variables, botones, plantilla | 5 |
| `fabrica/src/kids-v2/motor/flujo.ts` | `Ctx`, `entregar` (24 h / PREG-NUEVA), `empezarItem`, `terminarItem`, acuses | 6 |
| `fabrica/src/kids-v2/motor/rafaga.ts` | Lo que cuenta el chico: ráfaga, muy corto, OP → acuse → foto → seguir | 7 (11 la toca) |
| `fabrica/src/kids-v2/motor/botones.ts` | Todos los botones | 8 (11 la toca) |
| `fabrica/src/kids-v2/motor/reloj.ts` | 90 s, la hora, recordatorios, cierre solo, `proximoDespertar` | 9 (11 la toca) |
| `fabrica/src/kids-v2/motor.ts` | `paso()`: arranque, noche, panel; la puerta de entrada | 10 |
| `fabrica/src/kids-v2/preocupante.ts` | La lista de palabras | 11 |
| `fabrica/src/kids-v2/motor/sobrio.ts` | El día sobrio después de algo preocupante | 11 |
| `fabrica/src/kids-v2/corrida.ts` | Corre un chico inventado contra el motor con reloj simulado | 12 |
| `fabrica/src/kids-v2/lectura.ts` + `fabrica/scripts/kids-v2-lectura.ts` | Lectura corrida → `docs/kids/v2/lectura-corrida.md` | 12 |
| `fabrica/src/kids-v2/conductas.ts` | Chicos inventados (8 conductas, azar con semilla) | 13 |
| `fabrica/src/kids-v2/controles.ts` | Los controles de la simulación | 13 |
| `fabrica/src/kids-v2/simulacion.ts` + `fabrica/scripts/kids-v2-simular.ts` | Simulación → `docs/kids/v2/simulaciones/resumen.md` | 13 |
| `docs/kids/v2/README.md` | Empezar por acá | 14 |
| `fabrica/test/kids-v2-*.test.ts`, `fabrica/test/kids-v2-ayuda.ts` | Tests | 1 a 13 |

## Decisiones que el plan tomó (el diseño no las definía)

Para mostrarle a Naza. Todas son una constante o unas pocas líneas: si quiere otra cosa, se cambia.

1. **IDs de las extras**: el banco no les pone; el plan usa `X{capítulo}-{orden}` (X1-1 … X5-3).
2. **[Paso] también** en la otra puerta, en las preguntas de las ramas (K12-R1…) y en las extras que preguntan. Las fotos llevan solo sus botones.
3. **Pasar una principal con foto pegada**: después de B-PASO (o de un "no aplica" como [No tengo] primos), la foto igual sale.
4. **Contestar sin tocar el botón de la rama** (K12, K13, K16, K20, K25): vale como respuesta. En K12 no se sabe si tiene hermanos: no salen sus extras ni su otra puerta.
5. **K12 "No tengo hermanos"**: a la primera ("¿Te hubiera gustado…?") no se le acusa; sale directo la segunda; el acuse va después de la segunda.
6. **Lo que espera un botón y no se toca vence a la hora del día siguiente**: foto, otra puerta y B-SEGUIR → sale la siguiente principal (esa foto u OP se pierde); "una más" → sale el cierre; el cierre → sigue; la tranquila → K40; el cierre final → la oferta de extras. Lo que **bloquea** (no se acumula): una principal o pregunta del padre sin contestar, el aviso de la seria, la bienvenida y un PREG-NUEVA sin tocar.
7. **Espera del audio** después de [No tengo] o [Hoy no la como]: 10 minutos; después, B-SEGUIR.
8. **La hora espera si el chico está activo**: si mandó algo hace menos de 30 minutos, la pregunta del día no se le cruza; sale 30 minutos después de lo último que mandó.
9. **Nada de noche**: lo que manda entre las 22 y las 9 se procesa a las 9 (el acuse le llega a la mañana). Un [Mañana sigo] tocado de noche no contesta "Ya está por hoy" a la mañana.
10. **Mínimo una por día**: a la hora sale la que toca si ese día todavía no salió ninguna principal y no dijo "mañana". Si ya salió una (por un botón viejo tocado antes de la hora), la hora no manda otra.
11. **Canal B**: a la hora va siempre PREG-NUEVA-PADRE con [Estamos listos], aunque la ventana esté abierta; dentro de una sentada ([Dale, otra]) llega directo. El [Estamos listos] de RECORD-B vuelve a mandar la pregunta pendiente (solo después de un RECORD-B, para no repetirla).
12. **"Nunca dos plantillas sin respuesta"** se aplica a PREG-NUEVA (nunca dos seguidas). Los recordatorios al padre van aparte: en canal B pueden quedar PREG-NUEVA-PADRE, RECORD-B y RECORD-B-8 sin respuesta en el mismo número (es lo que pide el diseño).
13. **Recordatorios**: días de calendario desde el último mensaje del número de las preguntas (o desde la bienvenida si nunca tocó el botón), a la hora elegida; la marca a Naza sale a los 8 días junto con el segundo; no corren en la etapa de extras ni después del final.
14. **Cierre solo a los 2 días**: a esa altura la ventana de 24 h ya está cerrada, así que FINAL-CHICO va detrás de PREG-NUEVA-CHICO ("hay una pregunta esperándote", que para el final no es del todo cierto) y TERMINO-PADRE sale igual. Si ya había un PREG-NUEVA sin tocar, no sale otro: el final queda esperando ese botón.
15. **TERMINO-PADRE en canal B**: al día siguiente de que **llegó** FINAL-CHICO (no del cierre), a la hora.
16. **Algo preocupante**: "ese día" dura hasta la hora del día siguiente; en ese rato, todo lo que cuente recibe un acuse sobrio por ráfaga y los botones no hacen nada; la foto y la otra puerta de esa pregunta se pierden; después sigue con la siguiente. Para que salte en un audio, quien conecte tiene que pasar la transcripción en el evento.
17. **La lista de palabras es un borrador** (en `preocupante.ts`): la aprueban Naza y el abogado. Se dejó afuera "me toca" (en chicos es "me toca a mí"). "me pegó" salta también en una pelea con un primo: la lectura corrida lo muestra.
18. **La extra sensible** ("mal momento en la escuela") usa los acuses del día feo, como K39 ("acuse propio" en la Notación del banco), aunque mensajes.md dice que "Gracias por contarme eso" queda para el día feo.
19. **Acuses de la cápsula** (sin "libro"): también para CIERRE-FINAL y para las extras del cap. 5 que salen al final.
20. **Un "no" contado en un cierre**: si en vez de tocar el botón escribe o manda algo corto, cuenta como [No, eso fue todo] (sin acuse); algo largo, acuse normal.
21. **Si cuenta algo cuando se espera un botón** (seguir, una más, aviso, extras): acuse si no es corto, y sigue esperando el botón. En la bienvenida, escribir vale como [Dale, vamos]; con un PREG-NUEVA sin tocar, escribir suelta lo retenido.
22. **Botones viejos o repetidos** se ignoran.
23. **"Una más de estas"**: la primera extra disponible del capítulo, en orden del banco; si no queda ninguna, no se ofrece. **Extras del final**: en orden del banco (caps. 1 a 5); si no queda ninguna, no hay oferta; si se acaban después de una, EXTRAS-FIN y el final (sin EXTRAS-OTRA).
24. **"Cómo se arreglaron" (X4-3)**: solo si K36 se contó sin que saliera su otra puerta.
25. **Preguntas del padre**: la línea y la pregunta van en dos mensajes seguidos (igual que la entrada y su primera pregunta); la pregunta va tal cual (sin género; puede tener dos puntos); botón [Esta la paso]; sin otra puerta ni foto; después, B-SEGUIR. La línea usa "quién se lo regala".
26. **La compra**: la hora tiene que estar entre 09:00 y 21:59; "quién se lo regala" baja a minúscula solo "Tu"/"Tus" ("Tomás" queda).
27. **Panel (#34)**: la hora se cambia siempre; los temas, solo para lo que todavía no salió (si es lo que se está preguntando ahora, no se toca); las preguntas del padre, hasta que empieza el cap. 4.
28. **Escribe después del final**: no contesta; marca `escribio-despues-del-final` a Naza (sin texto, como dice el hueco 36).
29. **Fotos con otros chicos**: el motor solo la guarda en la ficha (Naza mira el álbum).


## Cambios aprobados por Naza sobre estas decisiones (05/10) — PISAN al código de las tareas

**A. La foto que vence no se pierde (pisa la 6 y la 16).** Cuando una foto pegada vence sin respuesta (botón no tocado hasta la hora del día siguiente) o se pierde por algo preocupante, el ID de su principal se guarda en `estado.fotosVencidas: string[]`. Al final, las fotos vencidas se ofrecen **primero** como extras (mismo texto y botones de la foto original; acuse de foto; [No tengo] como siempre), y después las extras del banco en orden. Con alguna foto vencida siempre hay oferta de extras. La otra puerta vencida sí se pierde (era optativa). Implementar en la Task 9 (guardar al vencer) y en la Task 6 (ofrecer al final), cada una con su test: "foto de K1 vencida → aparece en la oferta de extras antes que X1-1"; "foto perdida por algo preocupante → también vuelve al final". Agregar a la simulación (Task 13) el control: "ninguna foto pegada desaparece: o se contestó, o se tocó [No tengo]/botón propio, o salió de nuevo al final, o el chico cerró con [No, ya está]/[Lo dejamos acá]".

**B. El final llega por plantilla propia (pisa la 14).** FINAL-CHICO y FINAL-CHICO-PL se cargan en Meta como `kids_final` y `kids_final_plural` (ver `docs/kids/v2/plantillas-meta-kids.md`, plantillas 10 y 10b). En el cierre automático a los 2 días, si la ventana de 24 h está cerrada, sale la plantilla directa (sin PREG-NUEVA-CHICO antes) y después TERMINO-PADRE como siempre. Implementar en la Task 6, con test: "cierre a los 2 días con ventana cerrada → salida con plantilla kids_final y sin PREG-NUEVA". Ajustar el control de la simulación que corresponda.

---


### Task 1: El banco, de los md a `banco.json`

**Files:**
- Create: `fabrica/src/kids-v2/tipos.ts`, `fabrica/src/kids-v2/banco-md.ts`, `fabrica/src/kids-v2/banco.ts`, `fabrica/scripts/kids-v2-json.ts`
- Create (generado): `fabrica/src/kids-v2/banco.json`
- Test: `fabrica/test/kids-v2-banco.test.ts`

**Interfaces:**
- Consumes: `docs/kids/v2/banco.md`, `docs/kids/v2/mensajes.md` (solo lectura).
- Produces: tipos `Cap`, `AccionRama`, `Rama`, `Foto`, `Pregunta`, `Extra`, `MensajeFijo`, `BancoKids` (`tipos.ts`); `IDS_REQUERIDOS`, `type IdMensaje`, `TEXTO_PASO`, `TEXTO_NO_PASA_NADA`, `limpiar(s)`, `textoYBotones(linea)`, `respuestaDe(linea)`, `parsearBancoMd(md)`, `parsearMensajesMd(md)`, `parsearBancoKids(bancoMd, mensajesMd): BancoKids` (`banco-md.ts`); `BANCO: BancoKids`, `pregunta(id): Pregunta`, `fijo(id: IdMensaje): MensajeFijo`, `extra(id): Extra` (`banco.ts`). Las tres funciones tiran error si el ID no existe.

- [ ] **Step 1: Instalar dependencias**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
git branch --show-current   # tiene que decir vitacora-kids
npm ci
```
Esperado: `added … packages` sin errores (no cambia `package.json` ni `package-lock.json`).

- [ ] **Step 2: Escribir el test que falla**

`fabrica/test/kids-v2-banco.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDS_REQUERIDOS, parsearBancoKids, parsearBancoMd, parsearMensajesMd, respuestaDe, textoYBotones } from '../src/kids-v2/banco-md.js';
import { BANCO, extra, fijo, pregunta } from '../src/kids-v2/banco.js';
import bancoJson from '../src/kids-v2/banco.json' with { type: 'json' };

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const leer = (f: string) => readFileSync(path.join(RAIZ, 'docs', 'kids', 'v2', f), 'utf8');
const BANCO_MD = leer('banco.md');
const MENSAJES_MD = leer('mensajes.md');

describe('kids v2: banco.md + mensajes.md → banco.json', () => {
  it('el json commiteado está al día con los md (si falla: npx tsx scripts/kids-v2-json.ts)', () => {
    expect(bancoJson).toEqual(parsearBancoKids(BANCO_MD, MENSAJES_MD));
  });

  it('47 principales en 5 capítulos, 16 fotos, 15 ★, 32 extras', () => {
    expect(BANCO.preguntas.map((p) => p.id)).toEqual(Array.from({ length: 47 }, (_, i) => `K${i + 1}`));
    expect(BANCO.capitulos.map((c) => c.n)).toEqual([1, 2, 3, 4, 5]);
    expect([1, 2, 3, 4, 5].map((n) => BANCO.preguntas.filter((p) => p.cap === n).length)).toEqual([9, 11, 10, 10, 7]);
    expect(BANCO.preguntas.filter((p) => p.foto).length).toBe(16);
    expect(BANCO.preguntas.filter((p) => p.estrella).map((p) => p.id)).toEqual(['K1', 'K2', 'K3', 'K10', 'K11', 'K12', 'K13', 'K15', 'K21', 'K22', 'K31', 'K40', 'K42', 'K46', 'K47']);
    expect([1, 2, 3, 4, 5].map((n) => BANCO.extras.filter((x) => x.cap === n).length)).toEqual([7, 11, 6, 5, 3]);
  });

  it('están todos los mensajes fijos que usa el motor', () => {
    const ids = new Set(BANCO.mensajes.map((m) => m.id));
    for (const id of IDS_REQUERIDOS) expect(ids.has(id), id).toBe(true);
    expect(BANCO.mensajes).toHaveLength(IDS_REQUERIDOS.length);
  });

  it('las anotaciones *(05/10)* no se cuelan en los textos', () => {
    expect(pregunta('K10').texto).toBe('Tu mamá. Contame cómo es, y una vez que te cuidó cuando estabas enferm{{o/a}}.');
    expect(pregunta('K1').texto).toBe('¿Cuál es el primer recuerdo de tu vida? Lo más viejo que tengas, aunque sea borroso.');
    expect(fijo('PREG-NUEVA-CHICO').texto).toBe('Hola {{1}}, hay una pregunta esperándote. Tocá el botón y te la mando.');
    expect(fijo('CIERRE-FINAL').texto).toBe('Esas eran todas las preguntas. Contaste un montón, y con todo eso se arma tu libro. ¿Quedó algo que quieras decir, de lo que sea?');
    for (const t of [...BANCO.preguntas.map((p) => p.texto), ...BANCO.mensajes.map((m) => m.texto), ...BANCO.extras.map((x) => x.texto)]) {
      expect(t).not.toMatch(/\*\(|→|\[|<br>/);
    }
  });

  it('botón para pasar: [Paso] salvo K10, K11, K39 ([Esta la paso]) y K41 ([Esta no, gracias])', () => {
    const raros = BANCO.preguntas.filter((p) => p.botonPaso !== 'Paso').map((p) => [p.id, p.botonPaso]);
    expect(raros).toEqual([['K10', 'Esta la paso'], ['K11', 'Esta la paso'], ['K39', 'Esta la paso'], ['K41', 'Esta no, gracias']]);
  });

  it('ramas: K12 con dos pasos en "No tengo hermanos"; los "no" de K16, K18, K20 y K38 no preguntan', () => {
    expect(pregunta('K12').ramas.map((r) => r.boton)).toEqual(['Tengo hermanos', 'No tengo hermanos']);
    const noTengo = pregunta('K12').ramas[1].accion;
    expect(noTengo).toEqual({ tipo: 'preguntar', pasos: ['¿Te hubiera gustado tener un hermano o una hermana?', '¿Y alguien que sea casi como un hermano o hermana para vos? Contame una vez juntos, y decime cómo se llama.'] });
    expect(pregunta('K12').op?.soloRama).toBe('Tengo hermanos');
    for (const [id, boton] of [['K16', 'No tengo'], ['K18', 'No hay nadie así'], ['K20', 'No me pasó'], ['K38', 'No se me ocurre']]) {
      expect(pregunta(id).ramas.find((r) => r.boton === boton)?.accion, id).toEqual({ tipo: 'no-aplica' });
    }
    expect(pregunta('K25').ramas.map((r) => r.boton)).toEqual(['Sí', 'Todavía no']);
  });

  it('fotos: botones propios, K24 con [Hoy no la como], K29 con su respuesta a [No tengo]', () => {
    expect(pregunta('K11').foto?.botones).toEqual(['No hago', 'No tengo']);
    expect(pregunta('K14').foto?.botones).toEqual(['De ninguno', 'No tengo']);
    expect(pregunta('K21').foto?.botones).toEqual(['No miro', 'No tengo']);
    expect(pregunta('K24').foto?.botones).toEqual(['Hoy no la como']);
    expect(pregunta('K29').foto?.noTengo).toBe(fijo('B-FOTO-PLATA').texto);
    expect(pregunta('K10').foto?.texto).toBe('Si tenés mascota, sacale una foto y mandámela. ¿Cómo llegó a tu casa? Y decime cómo se llama.');
  });

  it('marcas: sacables, sensible y aviso', () => {
    expect(BANCO.preguntas.filter((p) => p.sacable).map((p) => p.id)).toEqual(['K10', 'K11', 'K18', 'K38']);
    expect(BANCO.preguntas.filter((p) => p.sensible).map((p) => p.id)).toEqual(['K39']);
    expect(BANCO.preguntas.filter((p) => p.avisoAntes).map((p) => p.id)).toEqual(['K39']);
    expect(pregunta('K39').op).toBeNull();
  });

  it('extras: OP de origen, solo si, livianas, foto, sensible', () => {
    expect(BANCO.extras.filter((x) => x.deOp).map((x) => x.deOp)).toEqual(['K1', 'K2', 'K3', 'K4', 'K8']);
    expect(extra('X1-7')).toMatchObject({ foto: true, texto: 'Mostrame algo que guardás hace años aunque nadie entienda por qué. ¿De dónde salió?' });
    expect(BANCO.extras.filter((x) => x.soloSi === 'hermanos').map((x) => x.id)).toEqual(['X2-9', 'X2-10']);
    expect(extra('X2-9').sacable).toBe(false); // "ya no es sacable" (05/10)
    expect(BANCO.extras.filter((x) => x.soloSi === 'pelea-k36').map((x) => x.id)).toEqual(['X4-3']);
    expect(BANCO.extras.filter((x) => x.liviana).map((x) => x.id)).toEqual(['X4-1', 'X4-2']);
    expect(BANCO.extras.filter((x) => x.sensible).map((x) => x.id)).toEqual(['X3-2']);
  });

  it('mensajes del banco: textos y botones', () => {
    expect(fijo('B-SEGUIR')).toMatchObject({ texto: 'Esa ya está. ¿Seguimos con otra ahora o la dejamos para mañana?', botones: ['Dale, otra', 'Mañana sigo'] });
    expect(fijo('B-MAÑANA').texto).toBe('Ya está por hoy, mañana hay más.');
    expect(fijo('B-PASO').texto).toBe('Dale, esa la salteamos.');
    expect(fijo('B-NO-PASA-NADA').texto).toBe('Dale, no pasa nada.');
    expect(fijo('B-FOTO-NOTENGO').texto).toBe('Dale. Si igual hay algo así pero no lo tenés a mano, contámelo en un audio y vale igual.');
    expect(fijo('B-DIAFEO-ACUSE-1').texto).toBe('Gracias por contarme eso. Lo guardamos con cuidado.');
    expect(fijo('B-DIAFEO-ACUSE-2').texto).toBe('Gracias por confiarme eso. Ya está, ya lo contaste.');
    expect(fijo('B-TRANQUILA')).toMatchObject({ texto: 'Si querés, hay una más tranquila para no cerrar el día así. Vos elegís.', botones: ['Dale, una tranquila', 'Mañana sigo'] });
    expect(fijo('B-AVISO-SERIA').botones).toEqual(['Voy ahora', 'Mañana mejor']);
    expect(fijo('B-UNA-MAS').botones).toEqual(['Dale, otra', 'No, cerramos']);
    for (const id of ['CIERRE-1', 'CIERRE-2', 'CIERRE-3', 'CIERRE-4', 'CIERRE-FINAL'] as const) expect(fijo(id).botones, id).toEqual(['No, eso fue todo', 'Sí, hay algo']);
    expect(fijo('ENTRADA-2').texto).toBe('Ahora vamos con la gente de tu vida. Tu familia, tus amigos y los que querés.');
  });

  it('mensajes.md: plantillas, botones y el plural armado con "el resto, igual que"', () => {
    expect(fijo('BIEN-CHICO')).toMatchObject({ plantilla: 'kids_bienvenida', botones: ['Dale, vamos'] });
    expect(fijo('BIEN-CHICO-PL').plantilla).toBe('kids_bienvenida_plural');
    expect(fijo('BIEN-CHICO-PL').texto).toBe(fijo('BIEN-CHICO').texto.replace('te hizo un regalo', 'te hicieron un regalo'));
    expect(fijo('BIEN-CHICO-PL').botones).toEqual(['Dale, vamos']);
    expect(fijo('BIEN-CHICO').texto.split('\n\n')).toHaveLength(5);
    expect(fijo('RECORD-B-8')).toMatchObject({ plantilla: 'kids_recordatorio_lo_hago_yo_8', botones: ['Estamos listos'] });
    expect(fijo('AVISO-PADRE')).toMatchObject({ plantilla: 'kids_aviso_padre', botones: [] });
    expect(fijo('EXTRAS-OTRA')).toMatchObject({ plantilla: null, botones: ['Dale, otra', 'Lo dejamos acá'] });
    expect(fijo('FINAL-CHICO-PL').texto).toContain('te lo van a dar {{2}}, que fueron quienes te hicieron este regalo');
    expect(fijo('ACUSE-4').texto).toBe('Ya lo escuché, lo tengo.');
    const plantillas = BANCO.mensajes.filter((m) => m.plantilla).map((m) => m.plantilla);
    expect(plantillas.sort()).toEqual([
      'kids_aviso_padre', 'kids_bienvenida', 'kids_bienvenida_padre', 'kids_bienvenida_plural', 'kids_pregunta_nueva', 'kids_pregunta_nueva_padre',
      'kids_recordatorio_lo_hago_yo', 'kids_recordatorio_lo_hago_yo_8', 'kids_recordatorio_padre', 'kids_recordatorio_padre_8', 'kids_termino_padre',
    ]);
  });

  it('ningún texto del banco tiene dos puntos (paso-3-sin-dos-puntos.md)', () => {
    for (const m of BANCO.mensajes) expect(m.texto, m.id).not.toContain(':');
    for (const p of BANCO.preguntas) {
      expect(p.texto, p.id).not.toContain(':');
      if (p.op) expect(p.op.texto, `${p.id} OP`).not.toContain(':');
      if (p.foto) expect(p.foto.texto, `${p.id} foto`).not.toContain(':');
    }
    for (const x of BANCO.extras) expect(x.texto, x.id).not.toContain(':');
  });

  it('si falta un mensaje que el motor usa, el parseo falla con su ID', () => {
    expect(() => parsearBancoKids(BANCO_MD.replace('**Seguir ahora o mañana**', '**Otra cosa**'), MENSAJES_MD)).toThrow(/B-SEGUIR/);
    expect(() => parsearBancoKids(BANCO_MD, MENSAJES_MD.replace('### TERMINO-PADRE', '### OTRO-ID'))).toThrow(/TERMINO-PADRE/);
    expect(() => fijo('NO-EXISTE' as never)).toThrow(/NO-EXISTE/);
    expect(() => pregunta('K99')).toThrow(/K99/);
  });

  it('ayudas del parser', () => {
    expect(textoYBotones('Hola. *(05/10)* — [A] [B, c]  *(nota)*')).toEqual({ texto: 'Hola.', botones: ['A', 'B, c'] });
    expect(respuestaDe('- [No tengo] → Dale. Vale igual. (una sola vez por foto)')).toBe('Dale. Vale igual.');
    expect(respuestaDe('- [Paso] → Dale. *(Naza)* y más cosas')).toBe('Dale.');
    expect(parsearMensajesMd('### X-1 · algo\n- **Plantilla** `kids_x` · {{1}}\n\n> Hola {{1}}.\n>\n> Chau.\n>\n> [Uno] [Dos]\n')).toEqual([
      { id: 'X-1', texto: 'Hola {{1}}.\n\nChau.', botones: ['Uno', 'Dos'], plantilla: 'kids_x' },
    ]);
    const tabla = '## Capítulo 1 · Uno\n\n| ID | Pregunta | Botones | Otra puerta | Foto pegada | Marcas |\n|---|---|---|---|---|---|\n';
    expect(() => parsearBancoMd(`${tabla}| K1 (b1) | Hola | — | — |\n`)).toThrow(/K1.*columnas/);
    expect(() => parsearBancoMd(`${tabla}| K1 (b1) | Hola | [Sí] sin flecha | — | — | |\n`)).toThrow(/K1.*→/);
  });
});
```

- [ ] **Step 3: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-banco.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/banco-md.js` (todavía no existe).

- [ ] **Step 4: Los tipos del banco**

`fabrica/src/kids-v2/tipos.ts`:
```ts
// Los tipos del banco de Vitácora Kids V2 («Mi Primer Capítulo»).
// La fuente de los textos es docs/kids/v2/banco.md y docs/kids/v2/mensajes.md;
// banco-md.ts los parsea y scripts/kids-v2-json.ts genera banco.json.

export type Cap = 1 | 2 | 3 | 4 | 5;

/** Qué pasa al tocar un botón propio de una principal (columna Botones de banco.md). */
export type AccionRama =
  /** Uno o dos mensajes que esperan respuesta (K12 "No tengo hermanos" tiene dos: "Y después, siempre"). */
  | { tipo: 'preguntar'; pasos: string[] }
  /** "Dale, esa la salteamos." */
  | { tipo: 'paso' }
  /** "Dale, no pasa nada." */
  | { tipo: 'no-aplica' };

export type Rama = { boton: string; accion: AccionRama };

export type Foto = {
  /** La principal donde está pegada en el banco (K10…). Si su tema se saca, la foto se muda pero esto no cambia. */
  de: string;
  texto: string;
  /** Tal cual el banco, en orden: "No tengo", "No hago", "De ninguno", "No miro", "Hoy no la como". */
  botones: string[];
  /** Respuesta propia a [No tengo] (solo K29). Si es null, va B-FOTO-NOTENGO. */
  noTengo: string | null;
};

export type Pregunta = {
  id: string;
  cap: Cap;
  texto: string;
  /** Los botones propios que no son "pasar" (K12, K13, K16, K18, K20, K25, K38). */
  ramas: Rama[];
  /** "Paso", salvo K10, K11 y K39 ("Esta la paso") y K41 ("Esta no, gracias"). */
  botonPaso: string;
  op: { texto: string; soloRama: string | null } | null;
  foto: Foto | null;
  estrella: boolean;
  sacable: boolean;
  sensible: boolean;
  avisoAntes: boolean;
};

export type Extra = {
  /** X1-1, X1-2… (capítulo y orden en banco.md; el banco no les pone ID). */
  id: string;
  cap: Cap;
  texto: string;
  /** "Foto: …" en el banco: es un pedido de foto con [No tengo]. */
  foto: boolean;
  /** Si es la otra puerta de una principal ("OP de K1"): no sale si esa OP ya salió. */
  deOp: string | null;
  soloSi: 'hermanos' | 'pelea-k36' | null;
  sacable: boolean;
  sensible: boolean;
  liviana: boolean;
};

export type MensajeFijo = {
  id: string;
  texto: string;
  botones: string[];
  /** Nombre de la plantilla de Meta, si sale como plantilla. */
  plantilla: string | null;
};

export type BancoKids = {
  capitulos: { n: Cap; titulo: string }[];
  preguntas: Pregunta[];
  extras: Extra[];
  mensajes: MensajeFijo[];
};
```

- [ ] **Step 5: El parser**

`fabrica/src/kids-v2/banco-md.ts` (conoce la forma de los md: tablas de preguntas con encabezado exacto, líneas `**Entrada:**` / `**Cierre:**`, viñetas de "Mensajes ya aprobados" y de "Extras", bloques `###` con cita `>` y tablas `| ID | Texto |` de mensajes.md):
```ts
// Parser de docs/kids/v2/banco.md y docs/kids/v2/mensajes.md → BancoKids.
// Lo usa scripts/kids-v2-json.ts para generar banco.json; un test compara el
// json commiteado contra este parseo (el md es la fuente: Naza aprueba ahí).
//
// Los md están escritos para leer, no para máquinas: este parser conoce su
// forma (tablas de preguntas, líneas **Entrada:** / **Cierre:**, viñetas de
// "Mensajes ya aprobados" y de "Extras", bloques ### con cita > en mensajes.md).
// Si un texto o un ID que el motor necesita no aparece, tira error con el
// nombre: nunca un mensaje vacío.

import type { AccionRama, BancoKids, Cap, Extra, Foto, MensajeFijo, Pregunta, Rama } from './tipos.js';

/** Los IDs de mensajes fijos que el motor usa. Si falta uno, el parseo falla. */
export const IDS_REQUERIDOS = [
  'ENTRADA-1', 'ENTRADA-2', 'ENTRADA-3', 'ENTRADA-4', 'ENTRADA-5',
  'CIERRE-1', 'CIERRE-2', 'CIERRE-3', 'CIERRE-4', 'CIERRE-FINAL',
  'B-SEGUIR', 'B-MAÑANA', 'B-AVISO-SERIA', 'B-UNA-MAS', 'B-FOTO-NOTENGO', 'B-FOTO-PLATA',
  'B-PASO', 'B-NO-PASA-NADA', 'B-DIAFEO-ACUSE-1', 'B-DIAFEO-ACUSE-2', 'B-TRANQUILA',
  'BIEN-CHICO', 'BIEN-CHICO-PL', 'BIEN-PADRE', 'AVISO-PADRE',
  'ACUSE-1', 'ACUSE-2', 'ACUSE-3', 'ACUSE-4', 'ACUSE-5', 'ACUSE-6', 'ACUSE-7',
  'ACUSE-FOTO-1', 'ACUSE-FOTO-2', 'ACUSE-FOTO-3',
  'PREG-NUEVA-CHICO', 'PREG-NUEVA-PADRE',
  'RECORD-A-4', 'RECORD-A-8', 'RECORD-B', 'RECORD-B-8',
  'PADRE-PREG-LINEA', 'PADRE-PREG-LINEA-PL',
  'EXTRAS-OFERTA', 'EXTRAS-SI', 'EXTRAS-OTRA', 'EXTRAS-FIN',
  'FINAL-CHICO', 'FINAL-CHICO-PL', 'TERMINO-PADRE',
] as const;

export type IdMensaje = (typeof IDS_REQUERIDOS)[number];

export const TEXTO_PASO = 'Dale, esa la salteamos.';
export const TEXTO_NO_PASA_NADA = 'Dale, no pasa nada.';

const ANOTACION = /\s*\*\([^)]*\)\*/g; // *(05/10)*, *(botones, 05/10; …)*

/** Saca las anotaciones *(…)* y normaliza espacios. */
export function limpiar(s: string): string {
  return s.replace(ANOTACION, '').replace(/\s+/g, ' ').trim();
}

const botonesDe = (s: string) => [...s.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);

/** "Texto — [A] [B] *(nota)*" → texto y botones. */
export function textoYBotones(linea: string): { texto: string; botones: string[] } {
  const s = limpiar(linea);
  const i = s.indexOf(' — [');
  if (i < 0) return { texto: s, botones: [] };
  return { texto: s.slice(0, i).trim(), botones: botonesDe(s.slice(i)) };
}

/** "… → Respuesta. *(nota)* lo que siga" → "Respuesta." (corta en la primera anotación y en un paréntesis final). */
export function respuestaDe(linea: string): string {
  const i = linea.indexOf('→ ');
  if (i < 0) throw new Error(`Falta "→" en: ${linea}`);
  return linea
    .slice(i + 2)
    .replace(/\s*\*\(.*$/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

function celdas(linea: string): string[] {
  return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

const esSeparador = (c: string[]) => c.every((x) => /^:?-+:?$/.test(x));
const vacia = (s: string) => s === '—' || s === '' || s === '(no lleva)';

const ENCABEZADO_PREGUNTAS = 'ID|Pregunta|Botones|Otra puerta|Foto pegada|Marcas';

function parsearRamas(id: string, celda: string): { ramas: Rama[]; botonPaso: string } {
  const ramas: Rama[] = [];
  let botonPaso = 'Paso';
  if (vacia(celda)) return { ramas, botonPaso };
  for (const parte of celda.split('<br>')) {
    const m = /^\[([^\]]+)\]\s*→\s*(.+)$/.exec(parte.trim());
    if (!m) throw new Error(`${id}: botón sin "→": ${parte}`);
    const [, boton, resto] = m;
    const texto = limpiar(resto);
    let accion: AccionRama;
    if (texto === TEXTO_PASO) {
      botonPaso = boton;
      continue;
    } else if (texto === TEXTO_NO_PASA_NADA) accion = { tipo: 'no-aplica' };
    else accion = { tipo: 'preguntar', pasos: texto.split(' Y después, siempre: ').map((p) => p.trim()) };
    ramas.push({ boton, accion });
  }
  return { ramas, botonPaso };
}

function parsearFoto(id: string, celda: string): Foto | null {
  if (vacia(celda)) return null;
  const s = limpiar(celda);
  const i = s.indexOf('[');
  if (i < 0) throw new Error(`${id}: la foto no tiene botones`);
  const resto = s.slice(i);
  const flecha = resto.indexOf('→');
  return {
    de: id,
    texto: s.slice(0, i).trim(),
    botones: botonesDe(flecha >= 0 ? resto.slice(0, flecha) : resto),
    noTengo: flecha >= 0 ? resto.slice(flecha + 1).trim() : null,
  };
}

function parsearPregunta(cap: Cap, c: string[]): Pregunta {
  const m = /^(K\d+)\b/.exec(c[0]);
  if (!m) throw new Error(`ID de pregunta raro: ${c[0]}`);
  const id = m[1];
  if (c.length !== 6) throw new Error(`${id}: la fila tiene ${c.length} columnas y van 6`);
  const { ramas, botonPaso } = parsearRamas(id, c[2]);
  let op: Pregunta['op'] = null;
  if (!vacia(c[3])) {
    const solo = /^Solo en la rama "([^"]+)":\s*(.+)$/.exec(c[3]);
    if (solo) {
      const rama = ramas.find((r) => r.boton.startsWith(solo[1]));
      if (!rama) throw new Error(`${id}: la OP es de la rama "${solo[1]}" y no existe`);
      op = { texto: limpiar(solo[2]), soloRama: rama.boton };
    } else op = { texto: limpiar(c[3]), soloRama: null };
  }
  const marcas = c[5];
  return {
    id,
    cap,
    texto: limpiar(c[1]),
    ramas,
    botonPaso,
    op,
    foto: parsearFoto(id, c[4]),
    estrella: marcas.includes('★'),
    sacable: /\bsacable\b/.test(marcas),
    sensible: /\bsensible\b/.test(marcas),
    avisoAntes: /con aviso antes/.test(marcas),
  };
}

function parsearExtra(cap: Cap, n: number, linea: string): Extra {
  const nota = /\*\(([^)]*)\)\*/.exec(linea)?.[1] ?? '';
  const partes = nota.split(/\s*[;·,]\s*/).map((p) => p.trim());
  let texto = limpiar(linea.replace(/^-\s*/, ''));
  const foto = texto.startsWith('Foto: ');
  if (foto) texto = texto.slice('Foto: '.length);
  texto = texto.replace(/\s*\[[^\]]+\]/g, '').trim();
  const op = partes.map((p) => /^OP de (K\d+)/.exec(p)?.[1]).find(Boolean) ?? null;
  return {
    id: `X${cap}-${n}`,
    cap,
    texto,
    foto,
    deOp: op,
    soloSi: partes.includes('solo si tiene hermanos') ? 'hermanos' : partes.includes('solo si en K36 contó una pelea') ? 'pelea-k36' : null,
    sacable: partes.includes('sacable'),
    sensible: partes.includes('sensible'),
    liviana: partes.includes('liviana'),
  };
}

/** Bloques de "## Mensajes ya aprobados": título en negrita → sus viñetas. */
function bloquesAprobados(lineas: string[]): Map<string, string[]> {
  const bloques = new Map<string, string[]>();
  let actual: string[] | null = null;
  for (const l of lineas) {
    const t = /^\*\*(.+?)\*\*/.exec(l);
    if (t && !l.startsWith('-')) {
      actual = [];
      bloques.set(t[1], actual);
    } else if (actual && l.startsWith('- ')) actual.push(l);
  }
  return bloques;
}

function vineta(bloques: Map<string, string[]>, bloque: string, que: (l: string) => boolean, desc: string): string {
  const l = bloques.get(bloque)?.find(que);
  if (!l) throw new Error(`banco.md: falta ${desc} en "${bloque}"`);
  return l;
}

function mensajesAprobados(lineas: string[]): MensajeFijo[] {
  const b = bloquesAprobados(lineas);
  const fijo = (id: string, texto: string, botones: string[] = []): MensajeFijo => ({ id, texto, botones, plantilla: null });
  const conBotones = (id: string, bloque: string) => {
    const { texto, botones } = textoYBotones(vineta(b, bloque, (l) => l.includes(' — ['), `el mensaje con botones (${id})`).replace(/^- (\*\*[^*]+\*\* → )?/, ''));
    return fijo(id, texto, botones);
  };
  const respuesta = (id: string, bloque: string, que: (l: string) => boolean) => fijo(id, respuestaDe(vineta(b, bloque, que, id)));
  const diaFeo = vineta(b, 'El día feo (K39)', (l) => l.startsWith('- Acuses que rotan'), 'B-DIAFEO-ACUSE');
  const [feo1, feo2] = diaFeo.slice(diaFeo.indexOf(': ') + 2).split(' · ').map((s) => s.trim());
  return [
    conBotones('B-SEGUIR', 'Seguir ahora o mañana'),
    respuesta('B-MAÑANA', 'Seguir ahora o mañana', (l) => l.startsWith('- [Mañana sigo] →')),
    conBotones('B-AVISO-SERIA', 'Aviso antes de la seria'),
    conBotones('B-UNA-MAS', 'Una más antes de cerrar cada capítulo'),
    respuesta('B-FOTO-NOTENGO', 'Fotos', (l) => l.startsWith('- [No tengo] →')),
    respuesta('B-FOTO-PLATA', 'Fotos', (l) => l.startsWith('- Foto de la plata')),
    respuesta('B-PASO', 'Pasar una pregunta', (l) => l.includes('[Paso] →')),
    respuesta('B-NO-PASA-NADA', 'Pasar una pregunta', (l) => l.startsWith('- [No se me ocurre]')),
    fijo('B-DIAFEO-ACUSE-1', feo1),
    fijo('B-DIAFEO-ACUSE-2', feo2),
    conBotones('B-TRANQUILA', 'El día feo (K39)'),
  ];
}

export function parsearBancoMd(md: string): Omit<BancoKids, 'mensajes'> & { mensajes: MensajeFijo[] } {
  const lineas = md.split(/\r?\n/);
  const capitulos: BancoKids['capitulos'] = [];
  const preguntas: Pregunta[] = [];
  const extras: Extra[] = [];
  const mensajes: MensajeFijo[] = [];
  let seccion: 'cap' | 'extras' | 'aprobados' | null = null;
  let cap: Cap = 1;
  let enTabla = false;
  let capExtra: Cap | null = null;
  let nExtra = 0;
  const aprobados: string[] = [];

  for (const l of lineas) {
    const h2 = /^## (.+)$/.exec(l);
    if (h2) {
      const c = /^Capítulo (\d) · (.+)$/.exec(h2[1]);
      if (c) {
        seccion = 'cap';
        cap = Number(c[1]) as Cap;
        capitulos.push({ n: cap, titulo: c[2].trim() });
      } else if (h2[1] === 'Extras') seccion = 'extras';
      else if (h2[1] === 'Mensajes ya aprobados') seccion = 'aprobados';
      else seccion = null;
      enTabla = false;
      continue;
    }
    if (seccion === 'cap') {
      const entrada = /^\*\*Entrada:\*\* (.+)$/.exec(l);
      if (entrada) mensajes.push({ id: `ENTRADA-${cap}`, texto: limpiar(entrada[1]), botones: [], plantilla: null });
      const cierre = /^\*\*Cierre( \(fin de las preguntas\))?:\*\* (.+)$/.exec(l);
      if (cierre) {
        const { texto, botones } = textoYBotones(cierre[2]);
        mensajes.push({ id: cierre[1] ? 'CIERRE-FINAL' : `CIERRE-${cap}`, texto, botones, plantilla: null });
      }
      if (!l.startsWith('|')) {
        enTabla = false;
        continue;
      }
      const c = celdas(l);
      if (c.join('|') === ENCABEZADO_PREGUNTAS) {
        enTabla = true;
        continue;
      }
      if (enTabla && !esSeparador(c)) preguntas.push(parsearPregunta(cap, c));
    } else if (seccion === 'extras') {
      const t = /^\*\*Cap\. (\d)\*\*/.exec(l);
      if (t) {
        capExtra = Number(t[1]) as Cap;
        nExtra = 0;
      } else if (capExtra && l.startsWith('- ')) extras.push(parsearExtra(capExtra, ++nExtra, l));
    } else if (seccion === 'aprobados') aprobados.push(l);
  }
  mensajes.push(...mensajesAprobados(aprobados));
  return { capitulos, preguntas, extras, mensajes };
}

/** Los mensajes de mensajes.md: bloques "### ID · …" con cita (>) y las tablas "| ID | Texto |". */
export function parsearMensajesMd(md: string): MensajeFijo[] {
  const lineas = md.split(/\r?\n/);
  type Crudo = { id: string; parrafos: string[]; botones: string[]; plantilla: string | null; resto: string | null };
  const crudos: Crudo[] = [];
  const tablas: MensajeFijo[] = [];
  let actual: Crudo | null = null;
  let parrafo: string[] = [];
  let enTabla = false;

  const cerrarParrafo = () => {
    if (actual && parrafo.length) actual.parrafos.push(limpiar(parrafo.join(' ')));
    parrafo = [];
  };

  for (const l of lineas) {
    if (/^#{2,3} /.test(l)) {
      cerrarParrafo();
      const m = /^### ([A-Z][A-Z0-9-]*[A-Z0-9])(?=\s|$)/.exec(l);
      actual = m ? { id: m[1], parrafos: [], botones: [], plantilla: null, resto: null } : null;
      if (actual) crudos.push(actual);
      enTabla = false;
      continue;
    }
    if (l.startsWith('|')) {
      const c = celdas(l);
      if (c.join('|') === 'ID|Texto') enTabla = true;
      else if (enTabla && !esSeparador(c)) tablas.push({ id: c[0], texto: limpiar(c[1]), botones: [], plantilla: null });
      continue;
    }
    enTabla = false;
    if (!actual) continue;
    const plantilla = /\*\*Plantilla\*\* `([a-z0-9_]+)`/.exec(l);
    if (plantilla && l.startsWith('- ')) actual.plantilla = plantilla[1];
    const cita = /^>\s?(.*)$/.exec(l);
    if (!cita) {
      cerrarParrafo();
      continue;
    }
    const t = cita[1].trim();
    const resto = /^\(el resto, igual que ([A-Z0-9-]+)\)$/.exec(t);
    if (t === '') cerrarParrafo();
    else if (resto) {
      cerrarParrafo();
      actual.resto = resto[1];
    } else if (/^(\[[^\]]+\]\s*)+$/.test(t)) actual.botones.push(...botonesDe(t));
    else parrafo.push(t);
  }
  cerrarParrafo();

  const porId = new Map(crudos.map((c) => [c.id, c]));
  const fijos = crudos
    .filter((c) => c.parrafos.length > 0)
    .map((c): MensajeFijo => {
      let parrafos = c.parrafos;
      let botones = c.botones;
      if (c.resto) {
        const base = porId.get(c.resto);
        if (!base) throw new Error(`mensajes.md: ${c.id} dice "igual que ${c.resto}" y ${c.resto} no está`);
        parrafos = [...parrafos, ...base.parrafos.slice(parrafos.length)];
        if (botones.length === 0) botones = base.botones;
      }
      return { id: c.id, texto: parrafos.join('\n\n'), botones, plantilla: c.plantilla };
    });
  return [...fijos, ...tablas];
}

/** Los dos md → el banco entero. Valida IDs requeridos y repetidos. */
export function parsearBancoKids(bancoMd: string, mensajesMd: string): BancoKids {
  const b = parsearBancoMd(bancoMd);
  const mensajes = [...b.mensajes, ...parsearMensajesMd(mensajesMd)];
  const vistos = new Set<string>();
  for (const m of mensajes) {
    if (vistos.has(m.id)) throw new Error(`${m.id}: ID repetido entre banco.md y mensajes.md`);
    if (m.texto === '') throw new Error(`${m.id}: sin texto`);
    vistos.add(m.id);
  }
  for (const id of IDS_REQUERIDOS) if (!vistos.has(id)) throw new Error(`Falta el mensaje ${id} en banco.md o mensajes.md`);
  return { ...b, mensajes };
}
```

- [ ] **Step 6: El script que genera el json, y generarlo**

`fabrica/scripts/kids-v2-json.ts`:
```ts
// Genera fabrica/src/kids-v2/banco.json desde docs/kids/v2/banco.md y mensajes.md:
//
//   npx tsx scripts/kids-v2-json.ts
//
// Correrlo cada vez que cambia uno de los dos md (el test kids-v2-banco avisa si quedó viejo).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearBancoKids } from '../src/kids-v2/banco-md.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(FABRICA, '..', 'docs', 'kids', 'v2');
const SALIDA = path.join(FABRICA, 'src', 'kids-v2', 'banco.json');

const banco = parsearBancoKids(readFileSync(path.join(DOCS, 'banco.md'), 'utf8'), readFileSync(path.join(DOCS, 'mensajes.md'), 'utf8'));
writeFileSync(SALIDA, JSON.stringify(banco, null, 2) + '\n', 'utf8');
console.log(`banco.json: ${banco.preguntas.length} preguntas, ${banco.extras.length} extras, ${banco.mensajes.length} mensajes`);
```

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx tsx scripts/kids-v2-json.ts
```
Esperado: `banco.json: 47 preguntas, 32 extras, 50 mensajes`.

- [ ] **Step 7: El acceso tipado**

`fabrica/src/kids-v2/banco.ts`:
```ts
// El banco de Kids V2, tipado. `banco.json` lo genera scripts/kids-v2-json.ts
// desde docs/kids/v2/banco.md y mensajes.md (la fuente); un test chequea que
// esté al día.

import bancoJson from './banco.json' with { type: 'json' };
import type { IdMensaje } from './banco-md.js';
import type { BancoKids, Extra, MensajeFijo, Pregunta } from './tipos.js';

export type { IdMensaje } from './banco-md.js';

export const BANCO: BancoKids = bancoJson as BancoKids;

const PREGUNTAS = new Map(BANCO.preguntas.map((p) => [p.id, p]));
const MENSAJES = new Map(BANCO.mensajes.map((m) => [m.id, m]));
const EXTRAS = new Map(BANCO.extras.map((x) => [x.id, x]));

/** La principal con ese ID (K1…K47). Tira error si no existe. */
export function pregunta(id: string): Pregunta {
  const p = PREGUNTAS.get(id);
  if (!p) throw new Error(`El banco de kids no tiene la pregunta ${id}`);
  return p;
}

/** El mensaje fijo con ese ID. Tira error si no existe: nunca un mensaje vacío. */
export function fijo(id: IdMensaje): MensajeFijo {
  const m = MENSAJES.get(id);
  if (!m) throw new Error(`El banco de kids no tiene el mensaje ${id}`);
  return m;
}

export function extra(id: string): Extra {
  const x = EXTRAS.get(id);
  if (!x) throw new Error(`El banco de kids no tiene la extra ${id}`);
  return x;
}
```

- [ ] **Step 8: Correr el test y el chequeo de tipos**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-banco.test.ts && npx tsc --noEmit -p .
```
Esperado: PASS (14 tests) y `tsc` sin errores. Si algún texto del md no sale como espera el test, **no** se toca el md: se revisa el parser.

- [ ] **Step 9: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/tipos.ts fabrica/src/kids-v2/banco-md.ts fabrica/src/kids-v2/banco.ts fabrica/src/kids-v2/banco.json fabrica/scripts/kids-v2-json.ts fabrica/test/kids-v2-banco.test.ts
git commit -m "$(cat <<'EOF'
kids v2: el banco se lee de banco.md y mensajes.md y se genera banco.json (47 preguntas, 32 extras, 50 mensajes)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 2: Textos (género, variables, plural, primer nombre)

**Files:**
- Create: `fabrica/src/kids-v2/texto.ts`
- Test: `fabrica/test/kids-v2-texto.test.ts`

**Interfaces:**
- Consumes: `BANCO`, `fijo`, `pregunta` (tarea 1).
- Produces: `type Genero = 'chico' | 'chica'`, `conGenero(texto, genero)`, `llenar(texto, variables: readonly string[])` (tira error si falta `{{n}}`), `esPlural(quienRegala)`, `normalizarQuienRegala(s)`, `primerNombre(s)`, `quedanMarcas(texto)`.

- [ ] **Step 1: Escribir el test que falla**

`fabrica/test/kids-v2-texto.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { BANCO, fijo, pregunta } from '../src/kids-v2/banco.js';
import { conGenero, esPlural, llenar, normalizarQuienRegala, primerNombre, quedanMarcas } from '../src/kids-v2/texto.js';

describe('kids v2: texto', () => {
  it('{{o/a}} según chico o chica', () => {
    expect(conGenero(pregunta('K10').texto, 'chico')).toBe('Tu mamá. Contame cómo es, y una vez que te cuidó cuando estabas enfermo.');
    expect(conGenero(pregunta('K30').texto, 'chica')).toBe('Decime algo que todavía no te dejan hacer sola y vos ya te sentís lista.');
    expect(conGenero('nervios{{o/a}} y roj{{o/a}}', 'chica')).toBe('nerviosa y roja');
  });

  it('variables {{1}}, {{2}}, {{3}}', () => {
    expect(llenar(fijo('PREG-NUEVA-CHICO').texto, ['Tini'])).toBe('Hola Tini, hay una pregunta esperándote. Tocá el botón y te la mando.');
    expect(llenar(fijo('AVISO-PADRE').texto, ['Laura', 'Tini', 'vitacora.com/panel/tini'])).toContain('en tu panel, en vitacora.com/panel/tini (audios');
  });

  it('si falta una variable, error con su número', () => {
    expect(() => llenar(fijo('BIEN-CHICO').texto, ['Tini'])).toThrow(/\{\{2\}\}/);
    expect(() => llenar('Hola {{1}}', [' '])).toThrow(/\{\{1\}\}/);
  });

  it('quién se lo regala: plural si empieza con "tus"; "Tu"/"Tus" en minúscula; un nombre propio queda', () => {
    expect(esPlural('Tus abuelos')).toBe(true);
    expect(esPlural('tus padrinos')).toBe(true);
    expect(esPlural('Tu mamá')).toBe(false);
    expect(esPlural('Tusnelda')).toBe(false);
    expect(normalizarQuienRegala('Tu mamá')).toBe('tu mamá');
    expect(normalizarQuienRegala('  Tus   papás ')).toBe('tus papás');
    expect(normalizarQuienRegala('Tomás')).toBe('Tomás');
  });

  it('primer nombre para el saludo al padre', () => {
    expect(primerNombre('Laura Gómez')).toBe('Laura');
    expect(primerNombre('  Ana ')).toBe('Ana');
    expect(() => primerNombre('   ')).toThrow();
  });

  it('todos los textos del banco se llenan sin dejar marcas', () => {
    const vars = ['Uno', 'tu mamá', 'tres'];
    for (const t of [...BANCO.mensajes.map((m) => m.texto), ...BANCO.preguntas.flatMap((p) => [p.texto, p.op?.texto ?? '', p.foto?.texto ?? '']), ...BANCO.extras.map((x) => x.texto)]) {
      for (const g of ['chico', 'chica'] as const) expect(quedanMarcas(llenar(conGenero(t, g), vars)), t).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-texto.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/texto.js`.

- [ ] **Step 3: Implementar**

`fabrica/src/kids-v2/texto.ts`:
```ts
// Llena los textos del banco de Kids: {{o/a}} según sea chico o chica, y las
// variables posicionales {{1}}, {{2}}… de mensajes.md. Puro. Si falta una
// variable, tira error: un "{{2}}" no puede llegar a un WhatsApp.

export type Genero = 'chico' | 'chica';

export function conGenero(texto: string, genero: Genero): string {
  return texto.replace(/\{\{o\/a\}\}/g, genero === 'chico' ? 'o' : 'a');
}

export function llenar(texto: string, variables: readonly string[]): string {
  return texto.replace(/\{\{(\d+)\}\}/g, (_m, n: string) => {
    const v = variables[Number(n) - 1];
    if (v === undefined || v.trim() === '') throw new Error(`Falta la variable {{${n}}} para llenar: "${texto.slice(0, 60)}…"`);
    return v;
  });
}

/** "tus papás", "Tus abuelos" → plural (cambian los verbos: BIEN-CHICO-PL, FINAL-CHICO-PL, PADRE-PREG-LINEA-PL). */
export function esPlural(quienRegala: string): boolean {
  return /^tus\s/i.test(quienRegala.trim());
}

/**
 * "Tu mamá" → "tu mamá" (va en el medio de la oración, 05/10). Solo se baja la
 * mayúscula de "Tu"/"Tus": un nombre propio ("Tomás") queda como está.
 */
export function normalizarQuienRegala(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return /^tus?\s/i.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
}

/** "Laura Gómez" → "Laura" (saludo al padre, 05/10). */
export function primerNombre(s: string): string {
  const p = s.trim().split(/\s+/)[0];
  if (!p) throw new Error('Nombre vacío');
  return p;
}

/** ¿Quedó alguna marca sin llenar? */
export const quedanMarcas = (texto: string) => texto.includes('{{');
```

- [ ] **Step 4: Correr el test**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-texto.test.ts && npx tsc --noEmit -p .
```
Esperado: PASS (6 tests), `tsc` sin errores.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/texto.ts fabrica/test/kids-v2-texto.test.ts
git commit -m "$(cat <<'EOF'
kids v2: textos con género, variables, plural de quién lo regala y primer nombre

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 3: Horas, reglas y acuses

**Files:**
- Create: `fabrica/src/kids-v2/horas.ts`, `fabrica/src/kids-v2/reglas.ts`, `fabrica/src/kids-v2/acuses.ts`
- Test: `fabrica/test/kids-v2-horas-acuses.test.ts`

**Interfaces:**
- Consumes: `fijo` (tarea 1).
- Produces: `horas.ts`: tipos `Fecha`, `Hora`, `Zona`; `NOCHE_DESDE = '22:00'`, `NOCHE_HASTA = '09:00'`, `zonaValida`, `aLocal(instante, zona): { fecha, hora }`, `aInstante(fecha, hora, zona): Date`, `sumarDias`, `diasEntre(desde, hasta)`, `esHora`, `esDeNoche(instante, zona)`, `finDeLaNoche(instante, zona)`, `diaDeSemana(fecha)`. `reglas.ts`: `MIN`, `HORA_MS`, `DIA_MS`, `SILENCIO_MS`, `CORTO_AUDIO_SEG`, `CORTO_PALABRAS`, `VENTANA_MS`, `RECORDATORIO_DIAS`, `CIERRE_SOLO_DIAS`, `ESPERA_AUDIO_FOTO_MS`, `ACTIVO_MS`, `HORA_POR_DEFECTO`, `MAX_PREGUNTAS_PADRE`. `acuses.ts`: `ACUSES`, `ACUSES_FOTO`, `ACUSES_DIA_FEO`, `opcionesAcuse({ capsula, escrito }): string[]`, `siguienteDe(orden, permitidos, ultimo): string`.

- [ ] **Step 1: Escribir el test que falla**

`fabrica/test/kids-v2-horas-acuses.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ACUSES, ACUSES_DIA_FEO, ACUSES_FOTO, opcionesAcuse, siguienteDe } from '../src/kids-v2/acuses.js';
import { fijo } from '../src/kids-v2/banco.js';
import { aInstante, aLocal, diasEntre, esDeNoche, finDeLaNoche, sumarDias } from '../src/kids-v2/horas.js';

const BA = 'America/Argentina/Buenos_Aires';
const MAD = 'Europe/Madrid';

describe('kids v2: horas', () => {
  it('ida y vuelta entre hora local e instante, también con cambio de horario', () => {
    expect(aInstante('2026-10-06', '18:00', BA).toISOString()).toBe('2026-10-06T21:00:00.000Z');
    expect(aLocal(new Date('2026-10-06T21:00:00.000Z'), BA)).toEqual({ fecha: '2026-10-06', hora: '18:00' });
    expect(aInstante('2026-10-25', '18:00', MAD).toISOString()).toBe('2026-10-25T17:00:00.000Z'); // ya en horario de invierno
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(diasEntre('2026-10-06', '2026-10-10')).toBe(4);
  });

  it('noche: de las 22:00 a las 8:59, hora del país del número', () => {
    expect(esDeNoche(aInstante('2026-10-06', '21:59', BA), BA)).toBe(false);
    expect(esDeNoche(aInstante('2026-10-06', '22:00', BA), BA)).toBe(true);
    expect(esDeNoche(aInstante('2026-10-07', '08:59', BA), BA)).toBe(true);
    expect(esDeNoche(aInstante('2026-10-07', '09:00', BA), BA)).toBe(false);
  });

  it('finDeLaNoche: las 9:00 que siguen, o el mismo instante si es de día', () => {
    expect(finDeLaNoche(aInstante('2026-10-06', '23:30', BA), BA)).toEqual(aInstante('2026-10-07', '09:00', BA));
    expect(finDeLaNoche(aInstante('2026-10-07', '03:00', BA), BA)).toEqual(aInstante('2026-10-07', '09:00', BA));
    const t = aInstante('2026-10-07', '15:00', BA);
    expect(finDeLaNoche(t, BA)).toBe(t);
  });
});

describe('kids v2: acuses (mensajes.md §3)', () => {
  it('los que dicen "escuché" y los que dicen "libro" son los que la regla saca', () => {
    for (const id of ACUSES) {
      const t = fijo(id).texto;
      expect(/escuch/i.test(t), id).toBe(['ACUSE-1', 'ACUSE-4', 'ACUSE-6'].includes(id));
      expect(/libro/i.test(t), id).toBe(['ACUSE-3', 'ACUSE-6'].includes(id));
    }
  });

  it('qué acuses van en cada caso', () => {
    expect(opcionesAcuse({ capsula: false, escrito: false })).toEqual([...ACUSES]);
    expect(opcionesAcuse({ capsula: false, escrito: true })).toEqual(['ACUSE-2', 'ACUSE-3', 'ACUSE-5', 'ACUSE-7']);
    expect(opcionesAcuse({ capsula: true, escrito: false })).toEqual(['ACUSE-1', 'ACUSE-2', 'ACUSE-4', 'ACUSE-5', 'ACUSE-7']);
    expect(opcionesAcuse({ capsula: true, escrito: true })).toEqual(['ACUSE-2', 'ACUSE-5', 'ACUSE-7']);
  });

  it('rotan en orden, nunca el mismo dos veces seguidas, y siguen el orden aunque cambie el caso', () => {
    let ultimo: string | null = null;
    const vistos: string[] = [];
    for (let i = 0; i < 9; i++) vistos.push((ultimo = siguienteDe(ACUSES, ACUSES, ultimo)));
    expect(vistos).toEqual(['ACUSE-1', 'ACUSE-2', 'ACUSE-3', 'ACUSE-4', 'ACUSE-5', 'ACUSE-6', 'ACUSE-7', 'ACUSE-1', 'ACUSE-2']);
    expect(siguienteDe(ACUSES, opcionesAcuse({ capsula: false, escrito: true }), 'ACUSE-3')).toBe('ACUSE-5');
    expect(siguienteDe(ACUSES, opcionesAcuse({ capsula: true, escrito: true }), 'ACUSE-7')).toBe('ACUSE-2');
    expect(siguienteDe(ACUSES_FOTO, ACUSES_FOTO, 'ACUSE-FOTO-3')).toBe('ACUSE-FOTO-1');
    expect(siguienteDe(ACUSES_DIA_FEO, ACUSES_DIA_FEO, 'B-DIAFEO-ACUSE-1')).toBe('B-DIAFEO-ACUSE-2');
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-horas-acuses.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/acuses.js`.

- [ ] **Step 3: Horas** (sale de `fabrica/src/viaje-v2/horas.ts` de la rama `viajes-v2`, con la franja de Kids)

`fabrica/src/kids-v2/horas.ts`:
```ts
// Fechas, horas y zonas horarias, sin librerías: Intl alcanza. Todo puro.
// Sale del motor de Viaje V2 (rama viajes-v2, fabrica/src/viaje-v2/horas.ts)
// con la franja de Kids: nada entre las 22:00 y las 9:00, hora del país del número.

export type Fecha = string; // 'YYYY-MM-DD'
export type Hora = string; // 'HH:MM'
export type Zona = string; // IANA, 'America/Argentina/Buenos_Aires'

export const NOCHE_DESDE: Hora = '22:00';
export const NOCHE_HASTA: Hora = '09:00';

const FORMATOS = new Map<Zona, Intl.DateTimeFormat>();

function formato(zona: Zona): Intl.DateTimeFormat {
  let f = FORMATOS.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    FORMATOS.set(zona, f);
  }
  return f;
}

export function zonaValida(zona: Zona): boolean {
  try {
    formato(zona);
    return true;
  } catch {
    return false;
  }
}

export function aLocal(instante: Date, zona: Zona): { fecha: Fecha; hora: Hora } {
  const p = Object.fromEntries(formato(zona).formatToParts(instante).map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

function partesFecha(fecha: Fecha): [number, number, number] {
  const [a, m, d] = fecha.split('-').map(Number);
  return [a, m, d];
}

function desfase(zona: Zona, instante: Date): number {
  const { fecha, hora } = aLocal(instante, zona);
  const [a, m, d] = partesFecha(fecha);
  const [hh, mm] = hora.split(':').map(Number);
  return Date.UTC(a, m - 1, d, hh, mm) - Math.floor(instante.getTime() / 60000) * 60000;
}

/** El instante de una fecha y hora locales (dos pasadas: aguanta el cambio de horario). */
export function aInstante(fecha: Fecha, hora: Hora, zona: Zona): Date {
  const [a, m, d] = partesFecha(fecha);
  const [hh, mm] = hora.split(':').map(Number);
  const base = Date.UTC(a, m - 1, d, hh, mm);
  let t = base - desfase(zona, new Date(base));
  t = base - desfase(zona, new Date(t));
  return new Date(t);
}

export function sumarDias(fecha: Fecha, dias: number): Fecha {
  const [a, m, d] = partesFecha(fecha);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Días de calendario de `desde` a `hasta` (0 si son el mismo día). */
export function diasEntre(desde: Fecha, hasta: Fecha): number {
  const [a1, m1, d1] = partesFecha(desde);
  const [a2, m2, d2] = partesFecha(hasta);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

export const esHora =(s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export function esDeNoche(instante: Date, zona: Zona): boolean {
  const { hora } = aLocal(instante, zona);
  return hora >= NOCHE_DESDE || hora < NOCHE_HASTA;
}

/** Si es de noche, las 9:00 que siguen; si no, el mismo instante. */
export function finDeLaNoche(instante: Date, zona: Zona): Date {
  const { fecha, hora } = aLocal(instante, zona);
  if (hora >= NOCHE_DESDE) return aInstante(sumarDias(fecha, 1), NOCHE_HASTA, zona);
  if (hora < NOCHE_HASTA) return aInstante(fecha, NOCHE_HASTA, zona);
  return instante;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function diaDeSemana(fecha: Fecha): string {
  const [a, m, d] = partesFecha(fecha);
  return DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
}
```

- [ ] **Step 4: Reglas**

`fabrica/src/kids-v2/reglas.ts`:
```ts
// Los números del flujo de Kids (paso-4-huecos-decisiones.md, defaults
// técnicos del 05/10). Si Naza quiere otra cosa, se cambia una constante.

export const MIN = 60_000;
export const HORA_MS = 60 * MIN;
export const DIA_MS = 24 * HORA_MS;

/** #19: varios audios seguidos → un solo acuse, cuando pasan 90 s sin nada nuevo. */
export const SILENCIO_MS = 90_000;
/** #20: "muy corto" = audio de menos de 15 s o texto de menos de 8 palabras. */
export const CORTO_AUDIO_SEG = 15;
export const CORTO_PALABRAS = 8;
/** Ventana de WhatsApp: pasado esto, solo plantillas. */
export const VENTANA_MS = 24 * HORA_MS;
/** Recordatorios al padre: a los 4 y a los 8 días de silencio; a los 8, además, marca a Naza. */
export const RECORDATORIO_DIAS = [4, 8] as const;
/** Si no contesta la oferta de extras del final, a los 2 días cierra solo. */
export const CIERRE_SOLO_DIAS = 2;
/** Después de [No tengo] o [Hoy no la como]: cuánto se espera el audio antes de seguir (lo fijó el plan). */
export const ESPERA_AUDIO_FOTO_MS = 10 * MIN;
/** Si el chico mandó algo hace menos de esto, "la hora" espera: no se le cruza una pregunta nueva mientras está contando (lo fijó el plan). */
export const ACTIVO_MS = 30 * MIN;
export const HORA_POR_DEFECTO = '18:00';
export const MAX_PREGUNTAS_PADRE = 3;
```

- [ ] **Step 5: Acuses**

`fabrica/src/kids-v2/acuses.ts`:
```ts
// Rotación de acuses (mensajes.md §3, "Reglas de rotación"). Las reglas son
// código; los textos salen del banco por ID.

export const ACUSES = ['ACUSE-1', 'ACUSE-2', 'ACUSE-3', 'ACUSE-4', 'ACUSE-5', 'ACUSE-6', 'ACUSE-7'] as const;
export const ACUSES_FOTO = ['ACUSE-FOTO-1', 'ACUSE-FOTO-2', 'ACUSE-FOTO-3'] as const;
export const ACUSES_DIA_FEO = ['B-DIAFEO-ACUSE-1', 'B-DIAFEO-ACUSE-2'] as const;

const DICEN_ESCUCHE = ['ACUSE-1', 'ACUSE-4', 'ACUSE-6'];
const DICEN_LIBRO = ['ACUSE-3', 'ACUSE-6'];

/** Escrito: sin los que dicen "escuché" (quedan 2, 3, 5, 7). Cápsula: sin los que dicen "libro" (quedan 1, 2, 4, 5, 7). */
export function opcionesAcuse(c: { capsula: boolean; escrito: boolean }): string[] {
  return ACUSES.filter((id) => !(c.escrito && DICEN_ESCUCHE.includes(id)) && !(c.capsula && DICEN_LIBRO.includes(id)));
}

/** El siguiente en el orden después del último usado, entre los permitidos. Nunca el mismo dos veces seguidas (si hay más de uno). */
export function siguienteDe(orden: readonly string[], permitidos: readonly string[], ultimo: string | null): string {
  const i = ultimo === null ? -1 : orden.indexOf(ultimo);
  for (let k = 1; k <= orden.length; k++) {
    const c = orden[(i + k) % orden.length];
    if (permitidos.includes(c)) return c;
  }
  throw new Error('No hay acuse permitido');
}
```

- [ ] **Step 6: Correr el test**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-horas-acuses.test.ts && npx tsc --noEmit -p .
```
Esperado: PASS (6 tests), `tsc` sin errores.

- [ ] **Step 7: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/horas.ts fabrica/src/kids-v2/reglas.ts fabrica/src/kids-v2/acuses.ts fabrica/test/kids-v2-horas-acuses.test.ts
git commit -m "$(cat <<'EOF'
kids v2: horas (nada entre las 22 y las 9), los números del flujo y la rotación de acuses

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 4: La compra y el guion efectivo

**Files:**
- Create: `fabrica/src/kids-v2/compra.ts`, `fabrica/src/kids-v2/extras.ts`, `fabrica/test/kids-v2-ayuda.ts`
- Test: `fabrica/test/kids-v2-compra.test.ts`

**Interfaces:**
- Consumes: `BANCO`, `pregunta` (1); `esHora`, `zonaValida`, `NOCHE_DESDE`, `NOCHE_HASTA` (3); `MAX_PREGUNTAS_PADRE` (3); `normalizarQuienRegala`, `Genero` (2).
- Produces: `compra.ts`: `type Canal = 'A' | 'B'`, `TEMAS`, `type Tema = 'mama' | 'papa' | 'abuelo-murio' | 'ensamblada' | 'mudanza' | 'escuela'`, `PREGUNTA_DEL_TEMA`, `temaDeExtra(x)`, `type PreguntaPadre = { texto; conLinea }`, `type Ficha` (campos: `nombre, apodo, genero, edad, quienRegala, canal, nombrePadre, linkPanel, hora, zona, temasSacados, fotosConOtrosChicos, preguntasPadre`), `validarFicha(f): Ficha`, `type ItemGuion` (uniones `principal` con `clave, cap, fotoDe, primeraDelCap, ultimaDelCap`; `una-mas`; `cierre`; `padre` con `n, texto, conLinea`; `extras`; `final`), `armarGuion(f): ItemGuion[]`, `fotoDelItem(item): Foto | null`. `extras.ts`: `type HistorialExtras = { opsUsadas, extrasUsadas, hermanos, peleaK36 }`, `extrasDisponibles(f, h, { cap?, soloLivianas? }): Extra[]`. `test/kids-v2-ayuda.ts` (versión 1): `ZONA`, `FICHA`, `en(fecha, hora)`, `iso(fecha, hora)`.

- [ ] **Step 1: La ayuda de los tests (versión 1)**

`fabrica/test/kids-v2-ayuda.ts`:

```ts
// Ayudas compartidas por los tests de kids-v2 (no es un test: vitest no lo corre solo).
// Chicos INVENTADOS.

import type { Ficha } from '../src/kids-v2/compra.js';
import { aInstante } from '../src/kids-v2/horas.js';

export const ZONA = 'America/Argentina/Buenos_Aires';

export const FICHA: Ficha = {
  nombre: 'Bruno Ibáñez',
  apodo: 'Bruno',
  genero: 'chico',
  edad: 11,
  quienRegala: 'Tu mamá',
  canal: 'A',
  nombrePadre: 'Laura Ibáñez',
  linkPanel: 'vitacora.com/panel/bruno',
  hora: '18:00',
  zona: ZONA,
  temasSacados: [],
  fotosConOtrosChicos: false,
  preguntasPadre: [],
};

/** Instante de una fecha y hora de Buenos Aires. */
export const en = (fecha: string, hora: string) => aInstante(fecha, hora, ZONA);
export const iso = (fecha: string, hora: string) => en(fecha, hora).toISOString();
```

- [ ] **Step 2: Escribir el test que falla**

`fabrica/test/kids-v2-compra.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BANCO } from '../src/kids-v2/banco.js';
import { armarGuion, fotoDelItem, PREGUNTA_DEL_TEMA, temaDeExtra, TEMAS, validarFicha, type Ficha, type ItemGuion } from '../src/kids-v2/compra.js';
import { extrasDisponibles, type HistorialExtras } from '../src/kids-v2/extras.js';
import { FICHA } from './kids-v2-ayuda.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MENSAJES_MD = readFileSync(path.join(RAIZ, 'docs', 'kids', 'v2', 'mensajes.md'), 'utf8');

const claves = (g: ItemGuion[]) => g.map((x) => x.clave);
const principal = (g: ItemGuion[], k: string) => g.find((x) => x.clave === k)!;
const NADA: HistorialExtras = { opsUsadas: [], extrasUsadas: [], hermanos: null, peleaK36: false };

describe('kids v2: la ficha de la compra', () => {
  it('normaliza: "Tu mamá" en minúscula, temas sin repetir, preguntas del padre sin vacías', () => {
    const f = validarFicha({ ...FICHA, quienRegala: 'Tus Abuelos', temasSacados: ['mama', 'mama'], preguntasPadre: [{ texto: '  Contame algo ', conLinea: true }, { texto: ' ', conLinea: false }] });
    expect(f.quienRegala).toBe('tus Abuelos');
    expect(f.temasSacados).toEqual(['mama']);
    expect(f.preguntasPadre).toEqual([{ texto: 'Contame algo', conLinea: true }]);
  });

  it('rechaza lo que no puede andar: hora de noche, zona inventada, más de 3 preguntas, campos vacíos', () => {
    expect(() => validarFicha({ ...FICHA, hora: '22:00' })).toThrow(/hora/);
    expect(() => validarFicha({ ...FICHA, hora: '08:59' })).toThrow(/hora/);
    expect(validarFicha({ ...FICHA, hora: '09:00' }).hora).toBe('09:00');
    expect(() => validarFicha({ ...FICHA, zona: 'Marte/Olympus' })).toThrow(/zona/);
    expect(() => validarFicha({ ...FICHA, preguntasPadre: Array(4).fill({ texto: 'x', conLinea: true }) })).toThrow(/3/);
    expect(() => validarFicha({ ...FICHA, apodo: ' ' })).toThrow(/apodo/);
    expect(() => validarFicha({ ...FICHA, temasSacados: ['separacion' as never] })).toThrow(/tema/);
  });

  it('los temas sacan lo que dice mensajes.md §8', () => {
    const tabla = MENSAJES_MD.slice(MENSAJES_MD.indexOf('| Tema marcado | Qué no sale |'));
    for (const [tema, k] of Object.entries(PREGUNTA_DEL_TEMA)) expect(tabla, tema).toMatch(new RegExp(`\\| [^|]+ \\| ${k}\\b`));
    expect(TEMAS).toHaveLength(6);
    expect(BANCO.extras.filter((x) => temaDeExtra(x) === 'mama').map((x) => x.id)).toEqual(['X2-1', 'X2-2', 'X2-3', 'X2-4']);
    expect(BANCO.extras.filter((x) => temaDeExtra(x) === 'papa').map((x) => x.id)).toEqual(['X2-5', 'X2-6', 'X2-7', 'X2-8']);
    expect(BANCO.extras.filter((x) => temaDeExtra(x) === 'escuela').map((x) => x.id)).toEqual(['X3-2']);
  });
});

describe('kids v2: el guion efectivo', () => {
  const g = armarGuion(validarFicha(FICHA));

  it('sin temas sacados: las 47 en orden, con "una más" y cierre en los caps. 1 a 4, y al final cierre, extras y final', () => {
    expect(g.filter((x) => x.tipo === 'principal')).toHaveLength(47);
    expect(claves(g).slice(8, 12)).toEqual(['K9', 'UNA-MAS-1', 'CIERRE-1', 'K10']);
    expect(claves(g).slice(-4)).toEqual(['K47', 'CIERRE-FINAL', 'EXTRAS', 'FINAL']);
    expect(g.filter((x) => x.tipo === 'principal' && x.primeraDelCap).map((x) => x.clave)).toEqual(['K1', 'K10', 'K21', 'K31', 'K41']);
    expect(g.filter((x) => x.tipo === 'principal' && x.ultimaDelCap).map((x) => x.clave)).toEqual(['K9', 'K20', 'K30', 'K40', 'K47']);
    expect(fotoDelItem(principal(g, 'K10'))?.de).toBe('K10');
    expect(fotoDelItem(principal(g, 'K5'))).toBeNull();
  });

  it('las preguntas del padre van después de CIERRE-4 y antes de K41', () => {
    const conPadre = armarGuion(validarFicha({ ...FICHA, preguntasPadre: [{ texto: 'A', conLinea: true }, { texto: 'B', conLinea: false }] }));
    const i = claves(conPadre).indexOf('CIERRE-4');
    expect(claves(conPadre).slice(i, i + 4)).toEqual(['CIERRE-4', 'PADRE-1', 'PADRE-2', 'K41']);
    expect(conPadre[i + 2]).toMatchObject({ tipo: 'padre', texto: 'B', conLinea: false });
  });

  it('un tema sacado no sale, y su foto pasa a la siguiente principal del capítulo sin foto', () => {
    const sinMama = armarGuion(validarFicha({ ...FICHA, temasSacados: ['mama'] }));
    expect(claves(sinMama)).not.toContain('K10');
    expect(principal(sinMama, 'K11').primeraDelCap).toBe(true);
    expect(fotoDelItem(principal(sinMama, 'K16'))?.de).toBe('K10');

    const todos = armarGuion(validarFicha({ ...FICHA, temasSacados: [...TEMAS] }));
    expect(claves(todos).filter((k) => /^K\d+$/.test(k))).toHaveLength(42);
    for (const k of ['K10', 'K11', 'K13', 'K18', 'K38']) expect(claves(todos), k).not.toContain(k);
    expect(claves(todos)).toContain('K14'); // abuelo que murió saca K13 pero no K14, a propósito
    expect(fotoDelItem(principal(todos, 'K16'))?.de).toBe('K10');
    expect(fotoDelItem(principal(todos, 'K17'))?.de).toBe('K11');
    expect(fotoDelItem(principal(todos, 'K19'))?.de).toBe('K13');
    expect(todos.filter((x) => fotoDelItem(x)).length).toBe(16); // ninguna foto se pierde
  });
});

describe('kids v2: extras disponibles', () => {
  const f = validarFicha(FICHA);

  it('una OP que ya salió no vuelve como extra; las de hermanos solo si tiene; la de la pelea solo si la contó', () => {
    expect(extrasDisponibles(f, NADA, { cap: 1 }).map((x) => x.id)).toEqual(['X1-1', 'X1-2', 'X1-3', 'X1-4', 'X1-5', 'X1-6', 'X1-7']);
    expect(extrasDisponibles(f, { ...NADA, opsUsadas: ['K1', 'K8'] }, { cap: 1 }).map((x) => x.id)).toEqual(['X1-2', 'X1-3', 'X1-4', 'X1-6', 'X1-7']);
    expect(extrasDisponibles(f, NADA, { cap: 2 }).map((x) => x.id)).not.toContain('X2-9');
    expect(extrasDisponibles(f, { ...NADA, hermanos: true }, { cap: 2 }).map((x) => x.id)).toContain('X2-9');
    expect(extrasDisponibles(f, NADA, { cap: 4 }).map((x) => x.id)).toEqual(['X4-1', 'X4-2', 'X4-4', 'X4-5']);
    expect(extrasDisponibles(f, { ...NADA, peleaK36: true }, { cap: 4 }).map((x) => x.id)).toContain('X4-3');
  });

  it('después de K39, solo las livianas; las usadas no vuelven; los temas sacados sacan sus extras', () => {
    expect(extrasDisponibles(f, { ...NADA, peleaK36: true }, { cap: 4, soloLivianas: true }).map((x) => x.id)).toEqual(['X4-1', 'X4-2']);
    expect(extrasDisponibles(f, { ...NADA, extrasUsadas: ['X4-1'] }, { cap: 4, soloLivianas: true }).map((x) => x.id)).toEqual(['X4-2']);
    const sin = validarFicha({ ...FICHA, temasSacados: ['mama', 'escuela'] });
    const ids = extrasDisponibles(sin, NADA).map((x) => x.id);
    for (const id of ['X2-1', 'X2-2', 'X2-3', 'X2-4', 'X3-2']) expect(ids, id).not.toContain(id);
    expect(ids).toContain('X2-5');
  });
});
```

- [ ] **Step 3: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-compra.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/compra.js`.

- [ ] **Step 4: La ficha y el guion**

`fabrica/src/kids-v2/compra.ts` (el guion guarda solo claves: el estado tiene que ser chico, porque el motor lo clona en cada paso):
```ts
// La ficha de la compra de Kids (mensajes.md §8, COMPRA-1 a COMPRA-3) y el
// guion efectivo que sale de ella: qué principales salen, en qué orden, con
// qué foto, y dónde van la "una más", los cierres, las preguntas del padre,
// las extras del final y el final. Puro.

import { BANCO, pregunta as preguntaDelBanco } from './banco.js';
import { esHora, NOCHE_DESDE, NOCHE_HASTA, zonaValida } from './horas.js';
import { MAX_PREGUNTAS_PADRE } from './reglas.js';
import { normalizarQuienRegala, type Genero } from './texto.js';
import type { Cap, Extra, Foto, Pregunta } from './tipos.js';

export type Canal = 'A' | 'B';

/** COMPRA-3-TEMAS, en el orden de la pantalla. */
export const TEMAS = ['mama', 'papa', 'abuelo-murio', 'ensamblada', 'mudanza', 'escuela'] as const;
export type Tema = (typeof TEMAS)[number];

/** Qué principal saca cada tema (mensajes.md §8). "escuela" solo saca una extra. */
export const PREGUNTA_DEL_TEMA: Record<Exclude<Tema, 'escuela'>, string> = {
  mama: 'K10',
  papa: 'K11',
  'abuelo-murio': 'K13',
  ensamblada: 'K18',
  mudanza: 'K38',
};

/** El tema de una extra: las de mamá y papá ("si el padre sacó el tema, sus extras tampoco salen") y la del mal momento en la escuela. */
export function temaDeExtra(x: Extra): Tema | null {
  if (x.texto.includes('tu mamá')) return 'mama';
  if (x.texto.includes('tu papá')) return 'papa';
  if (x.sacable) return 'escuela';
  return null;
}

export type PreguntaPadre = { texto: string; conLinea: boolean };

export type Ficha = {
  /** Su nombre (tapa). */
  nombre: string;
  /** Cómo le dicen: {{1}} al chico y {{2}} en lo que le llega al padre (#31). */
  apodo: string;
  genero: Genero;
  edad: number;
  /** "tu mamá", "tus abuelos", "tu madrina"… (se guarda con "tu" en minúscula). */
  quienRegala: string;
  canal: Canal;
  /** Tu nombre (en el saludo va solo el primero). */
  nombrePadre: string;
  linkPanel: string;
  /** A qué hora le escribimos ('HH:MM'). Entre las 9:00 y las 21:59: nada de noche. */
  hora: string;
  /** Zona IANA del país del número. */
  zona: string;
  temasSacados: Tema[];
  fotosConOtrosChicos: boolean;
  /** Hasta 3. conLinea = false si marcó "sin decir que es mía". */
  preguntasPadre: PreguntaPadre[];
};

/** Valida y normaliza. Tira error con el nombre del campo. */
export function validarFicha(f: Ficha): Ficha {
  for (const campo of ['nombre', 'apodo', 'quienRegala', 'nombrePadre', 'linkPanel'] as const) {
    if (!f[campo] || !f[campo].trim()) throw new Error(`Ficha: falta ${campo}`);
  }
  if (f.genero !== 'chico' && f.genero !== 'chica') throw new Error('Ficha: genero es "chico" o "chica"');
  if (f.canal !== 'A' && f.canal !== 'B') throw new Error('Ficha: canal es "A" o "B"');
  if (!esHora(f.hora) || f.hora < NOCHE_HASTA || f.hora >= NOCHE_DESDE) throw new Error(`Ficha: hora ${f.hora} fuera de 09:00–21:59`);
  if (!zonaValida(f.zona)) throw new Error(`Ficha: zona desconocida ${f.zona}`);
  for (const t of f.temasSacados) if (!(TEMAS as readonly string[]).includes(t)) throw new Error(`Ficha: tema desconocido ${t}`);
  const preguntasPadre = f.preguntasPadre.map((p) => ({ texto: p.texto.trim(), conLinea: p.conLinea })).filter((p) => p.texto !== '');
  if (preguntasPadre.length > MAX_PREGUNTAS_PADRE) throw new Error(`Ficha: hasta ${MAX_PREGUNTAS_PADRE} preguntas del padre`);
  return {
    ...f,
    nombre: f.nombre.trim(),
    apodo: f.apodo.trim(),
    nombrePadre: f.nombrePadre.trim(),
    quienRegala: normalizarQuienRegala(f.quienRegala),
    temasSacados: [...new Set(f.temasSacados)],
    preguntasPadre,
  };
}

export type ItemGuion =
  /** fotoDe: de qué principal es la foto que sale pegada (la suya, o la de un tema sacado que se mudó acá). */
  | { tipo: 'principal'; clave: string; cap: Cap; fotoDe: string | null; primeraDelCap: boolean; ultimaDelCap: boolean }
  | { tipo: 'una-mas'; clave: string; cap: Cap }
  | { tipo: 'cierre'; clave: string; cap: Cap }
  | { tipo: 'padre'; clave: string; cap: Cap; n: number; texto: string; conLinea: boolean }
  | { tipo: 'extras'; clave: 'EXTRAS'; cap: Cap }
  | { tipo: 'final'; clave: 'FINAL'; cap: Cap };

/** Las principales que salen (sin las de temas sacados), con su foto: la de un tema sacado pasa a la siguiente del capítulo que no tenga. */
function principalesDelCap(cap: Cap, sacadas: ReadonlySet<string>): { pregunta: Pregunta; fotoDe: string | null }[] {
  const salen: { pregunta: Pregunta; fotoDe: string | null }[] = [];
  const huerfanas: string[] = [];
  for (const p of BANCO.preguntas.filter((x) => x.cap === cap)) {
    if (sacadas.has(p.id)) {
      if (p.foto) huerfanas.push(p.id);
      continue;
    }
    salen.push({ pregunta: p, fotoDe: p.foto ? p.id : (huerfanas.shift() ?? null) });
  }
  return salen;
}

export function armarGuion(f: Ficha): ItemGuion[] {
  const sacadas = new Set(f.temasSacados.filter((t): t is Exclude<Tema, 'escuela'> => t !== 'escuela').map((t) => PREGUNTA_DEL_TEMA[t]));
  const guion: ItemGuion[] = [];
  for (const cap of [1, 2, 3, 4, 5] as Cap[]) {
    const ps = principalesDelCap(cap, sacadas);
    ps.forEach(({ pregunta, fotoDe }, i) =>
      guion.push({ tipo: 'principal', clave: pregunta.id, cap, fotoDe, primeraDelCap: i === 0, ultimaDelCap: i === ps.length - 1 }),
    );
    if (cap < 5) {
      guion.push({ tipo: 'una-mas', clave: `UNA-MAS-${cap}`, cap });
      guion.push({ tipo: 'cierre', clave: `CIERRE-${cap}`, cap });
    }
    if (cap === 4) f.preguntasPadre.forEach((p, i) => guion.push({ tipo: 'padre', clave: `PADRE-${i + 1}`, cap: 4, n: i + 1, texto: p.texto, conLinea: p.conLinea }));
  }
  guion.push({ tipo: 'cierre', clave: 'CIERRE-FINAL', cap: 5 });
  guion.push({ tipo: 'extras', clave: 'EXTRAS', cap: 5 });
  guion.push({ tipo: 'final', clave: 'FINAL', cap: 5 });
  return guion;
}

/** La foto pegada de un item principal (o null). */
export function fotoDelItem(item: ItemGuion): Foto | null {
  return item.tipo === 'principal' && item.fotoDe ? preguntaDelBanco(item.fotoDe).foto : null;
}
```

- [ ] **Step 5: Las extras disponibles**

`fabrica/src/kids-v2/extras.ts`:
```ts
// Qué extras pueden salir (banco.md, "Extras" y "Reglas del flujo"): una
// antes de cerrar cada capítulo del 1 al 4 y el resto al final. Puro.

import { BANCO } from './banco.js';
import { temaDeExtra, type Ficha } from './compra.js';
import type { Cap, Extra } from './tipos.js';

export type HistorialExtras = {
  /** Principales cuya otra puerta ya salió: esa OP no vuelve como extra. */
  opsUsadas: readonly string[];
  /** Extras que ya salieron (en una "una más" o en el final). */
  extrasUsadas: readonly string[];
  /** Rama de K12: true "Tengo hermanos", false "No tengo hermanos", null si no tocó ninguna. */
  hermanos: boolean | null;
  /** K36 contada (no pasada) y sin su otra puerta. */
  peleaK36: boolean;
};

/** En orden del banco. `cap` filtra un capítulo; `soloLivianas` deja las dos marcadas (cap. 4 después de K39). */
export function extrasDisponibles(f: Ficha, h: HistorialExtras, filtro: { cap?: Cap; soloLivianas?: boolean } = {}): Extra[] {
  return BANCO.extras.filter((x) => {
    if (filtro.cap !== undefined && x.cap !== filtro.cap) return false;
    if (filtro.soloLivianas && !x.liviana) return false;
    if (h.extrasUsadas.includes(x.id)) return false;
    if (x.deOp && h.opsUsadas.includes(x.deOp)) return false;
    const tema = temaDeExtra(x);
    if (tema && f.temasSacados.includes(tema)) return false;
    if (x.soloSi === 'hermanos' && h.hermanos !== true) return false;
    if (x.soloSi === 'pelea-k36' && !h.peleaK36) return false;
    return true;
  });
}
```

- [ ] **Step 6: Correr el test**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-compra.test.ts && npx tsc --noEmit -p .
```
Esperado: PASS (8 tests), `tsc` sin errores.

- [ ] **Step 7: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/compra.ts fabrica/src/kids-v2/extras.ts fabrica/test/kids-v2-ayuda.ts fabrica/test/kids-v2-compra.test.ts
git commit -m "$(cat <<'EOF'
kids v2: la ficha de la compra y el guion efectivo (temas sacados, fotos que se mudan, preguntas del padre, extras)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 5: Motor, parte 1 · tipos, estado inicial y armado de mensajes

**Files:**
- Create: `fabrica/src/kids-v2/motor/tipos.ts`, `fabrica/src/kids-v2/motor/estado.ts`, `fabrica/src/kids-v2/motor/mensajes.ts`
- Modify (reemplazar entero, lo creó la tarea 4): `fabrica/test/kids-v2-ayuda.ts`
- Test: `fabrica/test/kids-v2-mensajes.test.ts`

**Interfaces:**
- Consumes: `fijo`, `IdMensaje` (1); `conGenero`, `llenar`, `esPlural`, `primerNombre`, `quedanMarcas` (2); `Ficha`, `ItemGuion`, `armarGuion`, `validarFicha` (4).
- Produces: `motor/tipos.ts`: `Contenido` (`audio{seg, transcripcion?}` | `texto{texto}` | `foto`), `Evento` (`inicio` | `respuesta{contenido}` | `boton{boton}` | `reloj` | `ficha{cambios}`), `Destino = 'chico' | 'padre'`, `Mensaje = { a, id, texto, botones, plantilla: { nombre, variables } | null }`, `MotivoMarca = 'preocupante' | 'silencio-8-dias' | 'escribio-despues-del-final'`, `Salida`, `Fase` (17 variantes, ver el archivo), `Rafaga`, `Estado` (con `sobrioHasta`, que usa la tarea 11). `motor/estado.ts`: `nuevoEstado(ficha): Estado`. `motor/mensajes.ts`: `destino(e, paraPadre?)`, `render(e, texto, variables?)`, `variables.{chico,padre,avisoPadre,apodo,quien}(f)`, `fijoA(e, id, { variables?, paraPadre? })`, `preguntaMsg(e, p)`, `ramaMsg(e, p, ri, paso)` (IDs `K12-R1`, `K12-R2-2`), `opMsg(e, p)` (`K2-OP`), `fotoMsg(e, foto)` (`K10-FOTO`), `extraMsg(e, x)`, `padreMsgs(e, item, conLinea?)`, `avisoPreguntaNueva(e)`. Ayuda versión 2: `estadoEn(clave, fase, cambiosFicha?, cambiosEstado?)`, `ids(salidas)`, `mensaje(salidas, id)`.

- [ ] **Step 1: La ayuda de los tests (versión 2, reemplaza la de la tarea 4)**

`fabrica/test/kids-v2-ayuda.ts`:

```ts
// Ayudas compartidas por los tests de kids-v2 (no es un test: vitest no lo corre solo).
// Chicos INVENTADOS.

import type { Ficha } from '../src/kids-v2/compra.js';
import { aInstante } from '../src/kids-v2/horas.js';
import { nuevoEstado } from '../src/kids-v2/motor/estado.js';
import type { Estado, Fase, Salida } from '../src/kids-v2/motor/tipos.js';

export const ZONA = 'America/Argentina/Buenos_Aires';

export const FICHA: Ficha = {
  nombre: 'Bruno Ibáñez',
  apodo: 'Bruno',
  genero: 'chico',
  edad: 11,
  quienRegala: 'Tu mamá',
  canal: 'A',
  nombrePadre: 'Laura Ibáñez',
  linkPanel: 'vitacora.com/panel/bruno',
  hora: '18:00',
  zona: ZONA,
  temasSacados: [],
  fotosConOtrosChicos: false,
  preguntasPadre: [],
};

/** Instante de una fecha y hora de Buenos Aires. */
export const en = (fecha: string, hora: string) => aInstante(fecha, hora, ZONA);
export const iso = (fecha: string, hora: string) => en(fecha, hora).toISOString();

/** Un estado parado en el item `clave` del guion, en la fase dada, con la ventana abierta (último mensaje: el 10/10 a las 12:00). */
export function estadoEn(clave: string, fase: Fase, cambios: Partial<Ficha> = {}, extra: Partial<Estado> = {}): Estado {
  const e = nuevoEstado({ ...FICHA, ...cambios });
  const i = e.guion.findIndex((x) => x.clave === clave);
  if (i < 0) throw new Error(`No está ${clave} en el guion`);
  return { ...e, cursor: i, fase, inicio: iso('2026-10-06', '17:30'), ultimaEntrada: iso('2026-10-10', '12:00'), ...extra };
}

/** Los IDs de los mensajes que salieron, en orden. */
export const ids = (s: Salida[]) => s.flatMap((x) => (x.tipo === 'mensaje' ? [x.id] : [`marca:${x.motivo}`]));
export const mensaje = (s: Salida[], id: string) => {
  const m = s.find((x) => x.tipo === 'mensaje' && x.id === id);
  if (!m || m.tipo !== 'mensaje') throw new Error(`No salió ${id}: ${ids(s).join(', ')}`);
  return m;
};
```

- [ ] **Step 2: Escribir el test que falla**

`fabrica/test/kids-v2-mensajes.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { extra, pregunta } from '../src/kids-v2/banco.js';
import { nuevoEstado } from '../src/kids-v2/motor/estado.js';
import { avisoPreguntaNueva, destino, extraMsg, fijoA, fotoMsg, opMsg, padreMsgs, preguntaMsg, ramaMsg, variables } from '../src/kids-v2/motor/mensajes.js';
import { FICHA } from './kids-v2-ayuda.js';

const A = nuevoEstado(FICHA);
const B = nuevoEstado({ ...FICHA, canal: 'B', genero: 'chica', apodo: 'Tini', quienRegala: 'Tus abuelos' });

describe('kids v2: estado inicial', () => {
  it('sin empezar, con la ficha validada y el guion armado', () => {
    expect(A.fase).toEqual({ tipo: 'sin-empezar' });
    expect(A.cursor).toBe(-1);
    expect(A.ficha.quienRegala).toBe('tu mamá');
    expect(A.guion[0].clave).toBe('K1');
    expect(JSON.parse(JSON.stringify(A))).toEqual(A); // serializable
  });
});

describe('kids v2: armar mensajes', () => {
  it('a qué número va: en canal B, todo al padre', () => {
    expect(destino(A)).toBe('chico');
    expect(destino(A, true)).toBe('padre');
    expect(destino(B)).toBe('padre');
  });

  it('una principal: texto con género y botones propios + el de pasar', () => {
    expect(preguntaMsg(A, pregunta('K12'))).toEqual({ a: 'chico', id: 'K12', texto: 'Vamos con hermanos.', botones: ['Tengo hermanos', 'No tengo hermanos', 'Paso'], plantilla: null });
    expect(preguntaMsg(B, pregunta('K10')).texto).toContain('enferma.');
    expect(preguntaMsg(A, pregunta('K39')).botones).toEqual(['Esta la paso']);
    expect(preguntaMsg(A, pregunta('K38')).botones).toEqual(['No se me ocurre', 'Paso']);
  });

  it('rama, otra puerta, foto y extra', () => {
    expect(ramaMsg(A, pregunta('K12'), 1, 1)).toMatchObject({ id: 'K12-R2-2', botones: ['Paso'] });
    expect(ramaMsg(A, pregunta('K12'), 0, 0).id).toBe('K12-R1');
    expect(opMsg(A, pregunta('K2'))).toMatchObject({ id: 'K2-OP', texto: '¿Y una travesura que hizo otro y vos la viste? Contame esa.', botones: ['Paso'] });
    expect(fotoMsg(A, pregunta('K11').foto!)).toMatchObject({ id: 'K11-FOTO', botones: ['No hago', 'No tengo'] });
    expect(extraMsg(A, extra('X1-7')).botones).toEqual(['No tengo']);
    expect(extraMsg(A, extra('X1-6')).botones).toEqual(['Paso']);
  });

  it('plantillas con sus variables: al chico su apodo; al padre su primer nombre', () => {
    const bien = fijoA(A, 'BIEN-CHICO', { variables: variables.chico(A.ficha) });
    expect(bien.texto).toMatch(/^Hola Bruno\. Te escribo porque tu mamá te hizo un regalo/);
    expect(bien.plantilla).toEqual({ nombre: 'kids_bienvenida', variables: ['Bruno', 'tu mamá'] });
    expect(fijoA(A, 'AVISO-PADRE', { variables: variables.avisoPadre(A.ficha), paraPadre: true })).toMatchObject({ a: 'padre', plantilla: { nombre: 'kids_aviso_padre', variables: ['Laura', 'Bruno', 'vitacora.com/panel/bruno'] } });
    expect(avisoPreguntaNueva(A)).toMatchObject({ id: 'PREG-NUEVA-CHICO', a: 'chico', texto: 'Hola Bruno, hay una pregunta esperándote. Tocá el botón y te la mando.' });
    expect(avisoPreguntaNueva(B)).toMatchObject({ id: 'PREG-NUEVA-PADRE', a: 'padre', texto: 'Hola Laura, hay una pregunta nueva para Tini. Cuando estén juntos y con un rato tranquilo, tocá el botón y llega.' });
  });

  it('las preguntas del padre: con la línea (singular o plural) o solas, tal cual las escribió', () => {
    const item = { tipo: 'padre' as const, clave: 'PADRE-1', cap: 4 as const, n: 1, texto: 'Contame la vez: la de la bici', conLinea: true };
    expect(padreMsgs(A, item).map((m) => [m.id, m.texto])).toEqual([
      ['PADRE-PREG-LINEA', 'Esta pregunta te la manda tu mamá, con sus palabras.'],
      ['PADRE-1', 'Contame la vez: la de la bici'],
    ]);
    expect(padreMsgs(B, item)[0].texto).toBe('Esta pregunta te la mandan tus abuelos, con sus palabras.');
    expect(padreMsgs(A, { ...item, conLinea: false }).map((m) => m.id)).toEqual(['PADRE-1']);
    expect(padreMsgs(A, item)[1].botones).toEqual(['Esta la paso']);
  });
});
```

- [ ] **Step 3: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-mensajes.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/motor/estado.js`.

- [ ] **Step 4: Los tipos del motor**

`fabrica/src/kids-v2/motor/tipos.ts`:
```ts
// Tipos del motor de Kids V2: eventos que entran, salidas que salen y el
// estado de un chico. Todo serializable a JSON (lo guarda quien conecte el
// motor a WhatsApp).

import type { Ficha, ItemGuion } from '../compra.js';

/** Lo que manda el chico (o el padre en canal B). La transcripción la pone quien conecta (no es un modelo que decide). */
export type Contenido = { tipo: 'audio'; seg: number; transcripcion?: string } | { tipo: 'texto'; texto: string } | { tipo: 'foto' };

export type Evento =
  /** Pagó: arranca. */
  | { tipo: 'inicio' }
  | { tipo: 'respuesta'; contenido: Contenido }
  /** Tocó un botón: el texto del botón, tal cual. */
  | { tipo: 'boton'; boton: string }
  /** Pasa el tiempo: quien conecta lo llama en `proximoDespertar` (o cada minuto). */
  | { tipo: 'reloj' }
  /** El padre cambió algo en el panel (#34): la hora, los temas, sus preguntas. */
  | { tipo: 'ficha'; cambios: Partial<Pick<Ficha, 'hora' | 'temasSacados' | 'preguntasPadre'>> };

/** A qué número va: en canal B todo lo del chico va al número del padre. */
export type Destino = 'chico' | 'padre';

export type Mensaje = {
  a: Destino;
  /** ID del banco (K12, ACUSE-3, B-SEGUIR…) o derivado (K12-R1, K12-OP, K10-FOTO, PADRE-1). */
  id: string;
  texto: string;
  botones: string[];
  /** Si sale como plantilla de Meta: nombre y variables {{1}}, {{2}}… */
  plantilla: { nombre: string; variables: string[] } | null;
};

export type MotivoMarca = 'preocupante' | 'silencio-8-dias' | 'escribio-despues-del-final';

export type Salida = ({ tipo: 'mensaje' } & Mensaje) | { tipo: 'marca'; motivo: MotivoMarca; detalle: string };

/** Qué estamos esperando. */
export type Fase =
  | { tipo: 'sin-empezar' }
  | { tipo: 'bienvenida' }
  /** Una principal, una pregunta del padre o una extra, sin contestar. `rama`: el botón propio que tocó (K12…). */
  | { tipo: 'pregunta'; clave: string; rama: string | null; pasoRama: number }
  | { tipo: 'op'; clave: string }
  | { tipo: 'foto'; clave: string }
  /** Después de [No tengo] o [Hoy no la como]: espera un audio, hasta ESPERA_AUDIO_FOTO_MS. */
  | { tipo: 'foto-audio'; clave: string; desde: string }
  | { tipo: 'seguir' }
  | { tipo: 'aviso-seria' }
  | { tipo: 'tranquila' }
  | { tipo: 'una-mas' }
  | { tipo: 'cierre' }
  /** Tocó [Sí, hay algo]: espera lo que cuente. */
  | { tipo: 'cierre-cuenta' }
  | { tipo: 'extras-oferta' }
  | { tipo: 'extras-otra' }
  /** Salió PREG-NUEVA (más de 24 h, o canal B): lo que correspondía espera el botón. */
  | { tipo: 'retenido'; mensajes: Mensaje[]; luego: Fase }
  /** Nada pendiente: a la hora sale el item `siguiente` del guion. */
  | { tipo: 'libre'; siguiente: number }
  | { tipo: 'terminado' };

/** Lo que va llegando antes de los 90 s de silencio. */
export type Rafaga = { desde: string; ultima: string; seg: number; palabras: number; fotos: number; textos: string[] };

export type Estado = {
  ficha: Ficha;
  guion: ItemGuion[];
  fase: Fase;
  /** El item del guion en curso (o el último que empezó). -1 antes de K1. */
  cursor: number;
  /** La extra en curso (una más de un capítulo, o del final). */
  extra: string | null;
  /** El item en curso tuvo respuesta (no "paso"): para B-TRANQUILA después de K39. */
  conto: boolean;
  opsUsadas: string[];
  extrasUsadas: string[];
  hermanos: boolean | null;
  peleaK36: boolean;
  rotacion: { acuse: string | null; foto: string | null; diaFeo: string | null };
  rafaga: Rafaga | null;
  /** Lo que llegó entre las 22 y las 9: se procesa a las 9. */
  nocturnos: Evento[];
  /** ISO. */
  inicio: string | null;
  /** ISO: el último mensaje o botón del número de las preguntas (ventana de 24 h, recordatorios). */
  ultimaEntrada: string | null;
  /** Fecha local del último día que ya tuvo su principal (o dijo "mañana"). */
  diaHecho: string | null;
  /** Fecha local del último día en que corrió "la hora". */
  horaHecha: string | null;
  /** ISO: hasta cuándo dura "ese día" después de algo preocupante. */
  sobrioHasta: string | null;
  /** Recordatorios al padre en este silencio: 0, 1 (4 días), 2 (8 días + marca). */
  recordatorios: number;
  /** Canal B: salió RECORD-B y su [Estamos listos] tiene que volver a mandar la pregunta pendiente. */
  reenviar: boolean;
  /** Canal B: fecha local en que sale TERMINO-PADRE (al día siguiente, a la hora). */
  terminoPadre: string | null;
  /** ISO: cuándo empezó la oferta de extras del final (para el cierre solo a los 2 días). */
  extrasDesde: string | null;
};
```

- [ ] **Step 5: El estado inicial**

`fabrica/src/kids-v2/motor/estado.ts`:
```ts
// El estado inicial de un chico: la ficha validada y su guion efectivo.

import { armarGuion, validarFicha, type Ficha } from '../compra.js';
import type { Estado } from './tipos.js';

export function nuevoEstado(ficha: Ficha): Estado {
  const f = validarFicha(ficha);
  return {
    ficha: f,
    guion: armarGuion(f),
    fase: { tipo: 'sin-empezar' },
    cursor: -1,
    extra: null,
    conto: false,
    opsUsadas: [],
    extrasUsadas: [],
    hermanos: null,
    peleaK36: false,
    rotacion: { acuse: null, foto: null, diaFeo: null },
    rafaga: null,
    nocturnos: [],
    inicio: null,
    ultimaEntrada: null,
    diaHecho: null,
    horaHecha: null,
    sobrioHasta: null,
    recordatorios: 0,
    reenviar: false,
    terminoPadre: null,
    extrasDesde: null,
  };
}
```

- [ ] **Step 6: Armar mensajes**

`fabrica/src/kids-v2/motor/mensajes.ts`:
```ts
// Arma los mensajes que salen: textos del banco con género y variables, a qué
// número van, con qué botones y si son plantilla. Nunca escribe un texto.

import { fijo, type IdMensaje } from '../banco.js';
import type { Ficha, ItemGuion } from '../compra.js';
import { conGenero, esPlural, llenar, primerNombre, quedanMarcas } from '../texto.js';
import type { Extra, Foto, Pregunta } from '../tipos.js';
import type { Destino, Estado, Mensaje } from './tipos.js';

/** En canal B, lo del chico también va al número del padre. */
export function destino(e: Estado, paraPadre = false): Destino {
  return paraPadre || e.ficha.canal === 'B' ? 'padre' : 'chico';
}

export function render(e: Estado, texto: string, variables: readonly string[] = []): string {
  const t = llenar(conGenero(texto, e.ficha.genero), variables);
  if (quedanMarcas(t)) throw new Error(`Quedó una marca sin llenar: "${t.slice(0, 60)}…"`);
  return t;
}

/** Variables de mensajes.md: al chico {{1}} cómo le dicen, {{2}} quién se lo regala; al padre {{1}} su primer nombre, {{2}} cómo le dicen (#31). */
export const variables = {
  chico: (f: Ficha) => [f.apodo, f.quienRegala],
  padre: (f: Ficha) => [primerNombre(f.nombrePadre), f.apodo],
  avisoPadre: (f: Ficha) => [primerNombre(f.nombrePadre), f.apodo, f.linkPanel],
  apodo: (f: Ficha) => [f.apodo],
  quien: (f: Ficha) => [f.quienRegala],
};

export function fijoA(e: Estado, id: IdMensaje, o: { variables?: string[]; paraPadre?: boolean } = {}): Mensaje {
  const m = fijo(id);
  const vars = o.variables ?? [];
  return { a: destino(e, o.paraPadre), id, texto: render(e, m.texto, vars), botones: m.botones, plantilla: m.plantilla ? { nombre: m.plantilla, variables: vars } : null };
}

export function preguntaMsg(e: Estado, p: Pregunta): Mensaje {
  return { a: destino(e), id: p.id, texto: render(e, p.texto), botones: [...p.ramas.map((r) => r.boton), p.botonPaso], plantilla: null };
}

/** El mensaje de una rama (paso 0, 1…): K12-R2, K12-R2-2. Lleva el botón para pasar. */
export function ramaMsg(e: Estado, p: Pregunta, ri: number, paso: number): Mensaje {
  const accion = p.ramas[ri].accion;
  if (accion.tipo !== 'preguntar') throw new Error(`${p.id}: la rama ${p.ramas[ri].boton} no pregunta`);
  const id = `${p.id}-R${ri + 1}${paso > 0 ? `-${paso + 1}` : ''}`;
  return { a: destino(e), id, texto: render(e, accion.pasos[paso]), botones: [p.botonPaso], plantilla: null };
}

export function opMsg(e: Estado, p: Pregunta): Mensaje {
  if (!p.op) throw new Error(`${p.id} no tiene otra puerta`);
  return { a: destino(e), id: `${p.id}-OP`, texto: render(e, p.op.texto), botones: ['Paso'], plantilla: null };
}

export function fotoMsg(e: Estado, f: Foto): Mensaje {
  return { a: destino(e), id: `${f.de}-FOTO`, texto: render(e, f.texto), botones: f.botones, plantilla: null };
}

export function extraMsg(e: Estado, x: Extra): Mensaje {
  return { a: destino(e), id: x.id, texto: render(e, x.texto), botones: x.foto ? ['No tengo'] : ['Paso'], plantilla: null };
}

/** La pregunta del padre va tal cual la escribió (sin género ni variables); antes, la línea, salvo "sin decir que es mía". */
export function padreMsgs(e: Estado, item: Extract<ItemGuion, { tipo: 'padre' }>, conLinea = item.conLinea): Mensaje[] {
  const ms: Mensaje[] = [];
  if (conLinea) ms.push(fijoA(e, esPlural(e.ficha.quienRegala) ? 'PADRE-PREG-LINEA-PL' : 'PADRE-PREG-LINEA', { variables: variables.quien(e.ficha) }));
  ms.push({ a: destino(e), id: item.clave, texto: item.texto, botones: ['Esta la paso'], plantilla: null });
  return ms;
}

/** PREG-NUEVA-CHICO (canal A) o PREG-NUEVA-PADRE (canal B). */
export function avisoPreguntaNueva(e: Estado): Mensaje {
  return e.ficha.canal === 'A' ? fijoA(e, 'PREG-NUEVA-CHICO', { variables: variables.apodo(e.ficha) }) : fijoA(e, 'PREG-NUEVA-PADRE', { variables: variables.padre(e.ficha) });
}
```

- [ ] **Step 7: Correr los tests**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p .
```
Esperado: PASS (todos los de kids-v2 hasta acá, 6 nuevos), `tsc` sin errores.

- [ ] **Step 8: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/motor/tipos.ts fabrica/src/kids-v2/motor/estado.ts fabrica/src/kids-v2/motor/mensajes.ts fabrica/test/kids-v2-ayuda.ts fabrica/test/kids-v2-mensajes.test.ts
git commit -m "$(cat <<'EOF'
kids v2: motor, parte 1: tipos, estado inicial y armado de mensajes (a quién, género, variables, botones, plantilla)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 6: Motor, parte 2 · el recorrido del guion (empezar, terminar, 24 h, capítulos, final)

**Files:**
- Create: `fabrica/src/kids-v2/motor/flujo.ts`
- Modify (reemplazar entero): `fabrica/test/kids-v2-ayuda.ts`
- Test: `fabrica/test/kids-v2-flujo.test.ts`

**Interfaces:**
- Consumes: todo lo de las tareas 1 a 5.
- Produces: `type Ctx = { e: Estado; ahora: Date; salidas: Salida[]; replay: boolean }`; `hoy(c)`, `emitir(c, ...ms)`, `marcar(c, motivo, detalle)`, `ventanaAbierta(e, ahora)`, `entregar(c, mensajes, luego: Fase, proactivo: boolean)`, `soltarRetenido(c)`, `extrasDeUnaMas(e)`, `extrasDelFinal(e)`, `mandarExtra(c, x)`, `empezarItem(c, i, proactivo)`, `terminarItem(c)`, `enCurso(e): { capsula, sensible }`, `acusar(c, escrito)`, `acuseFoto(c)`, `acuseSobrio(c)`, `fotoOTerminar(c)`, `manana(c, siguiente)`. Ayuda versión final: agrega `ctx(e, fecha?, hora?)`.

Reglas que baja esta tarea: entrada pegada a la primera del capítulo; aviso antes de K39; "una más" después de la última principal (sin seguir), solo livianas en el cap. 4; cierre; B-SEGUIR después de cada principal y de cada cierre; K47 directo al cierre final; K39 → tranquila si contó o K40 si pasó; extras del final y EXTRAS-FIN; final con TERMINO-PADRE (canal A ya, canal B al día siguiente); fuera de las 24 h (o canal B a la hora) PREG-NUEVA una sola vez y lo demás retenido.

- [ ] **Step 1: La ayuda de los tests (versión final, reemplaza la de la tarea 5)**

`fabrica/test/kids-v2-ayuda.ts`:

```ts
// Ayudas compartidas por los tests de kids-v2 (no es un test: vitest no lo corre solo).
// Chicos INVENTADOS.

import type { Ficha } from '../src/kids-v2/compra.js';
import { aInstante } from '../src/kids-v2/horas.js';
import { nuevoEstado } from '../src/kids-v2/motor/estado.js';
import type { Ctx } from '../src/kids-v2/motor/flujo.js';
import type { Estado, Fase, Salida } from '../src/kids-v2/motor/tipos.js';

export const ZONA = 'America/Argentina/Buenos_Aires';

export const FICHA: Ficha = {
  nombre: 'Bruno Ibáñez',
  apodo: 'Bruno',
  genero: 'chico',
  edad: 11,
  quienRegala: 'Tu mamá',
  canal: 'A',
  nombrePadre: 'Laura Ibáñez',
  linkPanel: 'vitacora.com/panel/bruno',
  hora: '18:00',
  zona: ZONA,
  temasSacados: [],
  fotosConOtrosChicos: false,
  preguntasPadre: [],
};

/** Instante de una fecha y hora de Buenos Aires. */
export const en = (fecha: string, hora: string) => aInstante(fecha, hora, ZONA);
export const iso = (fecha: string, hora: string) => en(fecha, hora).toISOString();

/** Un estado parado en el item `clave` del guion, en la fase dada, con la ventana abierta (último mensaje: el 10/10 a las 12:00). */
export function estadoEn(clave: string, fase: Fase, cambios: Partial<Ficha> = {}, extra: Partial<Estado> = {}): Estado {
  const e = nuevoEstado({ ...FICHA, ...cambios });
  const i = e.guion.findIndex((x) => x.clave === clave);
  if (i < 0) throw new Error(`No está ${clave} en el guion`);
  return { ...e, cursor: i, fase, inicio: iso('2026-10-06', '17:30'), ultimaEntrada: iso('2026-10-10', '12:00'), ...extra };
}

export function ctx(e: Estado, fecha = '2026-10-10', hora = '18:05'): Ctx {
  return { e, ahora: en(fecha, hora), salidas: [], replay: false };
}

/** Los IDs de los mensajes que salieron, en orden. */
export const ids = (s: Salida[]) => s.flatMap((x) => (x.tipo === 'mensaje' ? [x.id] : [`marca:${x.motivo}`]));
export const mensaje = (s: Salida[], id: string) => {
  const m = s.find((x) => x.tipo === 'mensaje' && x.id === id);
  if (!m || m.tipo !== 'mensaje') throw new Error(`No salió ${id}: ${ids(s).join(', ')}`);
  return m;
};
```

- [ ] **Step 2: Escribir el test que falla**

`fabrica/test/kids-v2-flujo.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { BANCO } from '../src/kids-v2/banco.js';
import { acusar, empezarItem, entregar, soltarRetenido, terminarItem, ventanaAbierta } from '../src/kids-v2/motor/flujo.js';
import { fijoA } from '../src/kids-v2/motor/mensajes.js';
import { ctx, estadoEn, ids, iso, mensaje } from './kids-v2-ayuda.js';

const idx = (e: { guion: { clave: string }[] }, k: string) => e.guion.findIndex((x) => x.clave === k);

describe('kids v2: entregar (ventana de 24 h, canal B)', () => {
  it('reactivo o con la ventana abierta: sale directo', () => {
    const c = ctx(estadoEn('K5', { tipo: 'seguir' }));
    entregar(c, [fijoA(c.e, 'B-SEGUIR')], { tipo: 'seguir' }, true);
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
  });

  it('a la hora con la ventana cerrada: PREG-NUEVA-CHICO y lo demás retenido hasta el botón; no sale otro aviso encima', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { ultimaEntrada: iso('2026-10-08', '18:00') }), '2026-10-10', '18:00');
    expect(ventanaAbierta(c.e, c.ahora)).toBe(false);
    entregar(c, [fijoA(c.e, 'B-SEGUIR')], { tipo: 'seguir' }, true);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-CHICO']);
    expect(c.e.fase).toMatchObject({ tipo: 'retenido', luego: { tipo: 'seguir' } });
    entregar(c, [fijoA(c.e, 'B-MAÑANA')], { tipo: 'libre', siguiente: 6 }, true);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-CHICO']); // no se acumulan
    soltarRetenido(c);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-CHICO', 'B-MAÑANA']);
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: 6 });
  });

  it('canal B: a la hora siempre PREG-NUEVA-PADRE, aunque la ventana esté abierta', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, { canal: 'B' }), '2026-10-10', '18:00');
    entregar(c, [fijoA(c.e, 'B-SEGUIR')], { tipo: 'seguir' }, true);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-PADRE']);
    expect(c.salidas[0]).toMatchObject({ a: 'padre', plantilla: { nombre: 'kids_pregunta_nueva_padre' } });
  });
});

describe('kids v2: empezar un item', () => {
  it('la primera del capítulo lleva su entrada; las principales dejan el día hecho', () => {
    const c = ctx(estadoEn('CIERRE-1', { tipo: 'seguir' }));
    empezarItem(c, idx(c.e, 'K10'), false);
    expect(ids(c.salidas)).toEqual(['ENTRADA-2', 'K10']);
    expect(c.e.fase).toEqual({ tipo: 'pregunta', clave: 'K10', rama: null, pasoRama: 0 });
    expect(c.e.diaHecho).toBe('2026-10-10');
  });

  it('K39: antes va el aviso de la seria, no la pregunta', () => {
    const c = ctx(estadoEn('K38', { tipo: 'seguir' }));
    empezarItem(c, idx(c.e, 'K39'), false);
    expect(ids(c.salidas)).toEqual(['B-AVISO-SERIA']);
    expect(c.e.fase).toEqual({ tipo: 'aviso-seria' });
  });

  it('la pregunta del padre, con su línea', () => {
    const c = ctx(estadoEn('CIERRE-4', { tipo: 'seguir' }, { preguntasPadre: [{ texto: 'Contame la bici.', conLinea: true }] }));
    empezarItem(c, idx(c.e, 'PADRE-1'), false);
    expect(ids(c.salidas)).toEqual(['PADRE-PREG-LINEA', 'PADRE-1']);
  });

  it('"una más" sin extras disponibles: directo al cierre', () => {
    const c = ctx(estadoEn('K40', { tipo: 'pregunta', clave: 'K40', rama: null, pasoRama: 0 }, {}, { extrasUsadas: ['X4-1', 'X4-2'] }));
    empezarItem(c, idx(c.e, 'UNA-MAS-4'), false);
    expect(ids(c.salidas)).toEqual(['CIERRE-4']);
  });

  it('el final: canal A, TERMINO-PADRE al padre y FINAL-CHICO (plural si corresponde)', () => {
    const c = ctx(estadoEn('EXTRAS', { tipo: 'extras-otra' }, { quienRegala: 'Tus papás' }));
    empezarItem(c, idx(c.e, 'FINAL'), false);
    expect(ids(c.salidas)).toEqual(['TERMINO-PADRE', 'FINAL-CHICO-PL']);
    expect(mensaje(c.salidas, 'TERMINO-PADRE').a).toBe('padre');
    expect(mensaje(c.salidas, 'FINAL-CHICO-PL').texto).toMatch(/^Bueno Bruno, hasta acá llegamos\..*te lo van a dar tus papás, que fueron quienes/);
    expect(c.e.fase).toEqual({ tipo: 'terminado' });
  });

  it('el final en canal B: TERMINO-PADRE queda para el día siguiente', () => {
    const c = ctx(estadoEn('EXTRAS', { tipo: 'extras-otra' }, { canal: 'B' }));
    empezarItem(c, idx(c.e, 'FINAL'), false);
    expect(ids(c.salidas)).toEqual(['FINAL-CHICO']);
    expect(c.e.terminoPadre).toBe('2026-10-11');
  });
});

describe('kids v2: terminar un item (qué sigue)', () => {
  it('una principal del medio: B-SEGUIR', () => {
    const c = ctx(estadoEn('K5', { tipo: 'pregunta', clave: 'K5', rama: null, pasoRama: 0 }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
  });

  it('la última del capítulo: "una más" (sin seguir); K47: directo al cierre final', () => {
    const c = ctx(estadoEn('K9', { tipo: 'pregunta', clave: 'K9', rama: null, pasoRama: 0 }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['B-UNA-MAS']);
    const d = ctx(estadoEn('K47', { tipo: 'pregunta', clave: 'K47', rama: null, pasoRama: 0 }));
    terminarItem(d);
    expect(ids(d.salidas)).toEqual(['CIERRE-FINAL']);
  });

  it('K39: si contó, la tranquila; si pasó, K40 directo', () => {
    const conto = ctx(estadoEn('K39', { tipo: 'pregunta', clave: 'K39', rama: null, pasoRama: 0 }, {}, { conto: true }));
    terminarItem(conto);
    expect(ids(conto.salidas)).toEqual(['B-TRANQUILA']);
    const paso = ctx(estadoEn('K39', { tipo: 'pregunta', clave: 'K39', rama: null, pasoRama: 0 }));
    terminarItem(paso);
    expect(ids(paso.salidas)).toEqual(['K40']);
  });

  it('el cierre de un capítulo: B-SEGUIR; el cierre final: la oferta de extras', () => {
    const c = ctx(estadoEn('CIERRE-2', { tipo: 'cierre' }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
    const d = ctx(estadoEn('CIERRE-FINAL', { tipo: 'cierre' }));
    terminarItem(d);
    expect(ids(d.salidas)).toEqual(['EXTRAS-OFERTA']);
  });

  it('la extra de "una más": al cierre; una extra del final: EXTRAS-OTRA, o EXTRAS-FIN y el final si no quedan', () => {
    const c = ctx(estadoEn('UNA-MAS-1', { tipo: 'pregunta', clave: 'X1-1', rama: null, pasoRama: 0 }, {}, { extra: 'X1-1' }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['CIERRE-1']);
    const d = ctx(estadoEn('EXTRAS', { tipo: 'pregunta', clave: 'X1-1', rama: null, pasoRama: 0 }, {}, { extra: 'X1-1' }));
    terminarItem(d);
    expect(ids(d.salidas)).toEqual(['EXTRAS-OTRA']);
    const todas = BANCO.extras.map((x) => x.id);
    const e = ctx(estadoEn('EXTRAS', { tipo: 'pregunta', clave: 'X5-3', rama: null, pasoRama: 0 }, {}, { extra: 'X5-3', extrasUsadas: todas }));
    terminarItem(e);
    expect(ids(e.salidas)).toEqual(['EXTRAS-FIN', 'TERMINO-PADRE', 'FINAL-CHICO']);
  });
});

describe('kids v2: acuses según el caso', () => {
  it('rotan; escrito sin "escuché"; en la cápsula sin "libro"; K39 con los del día feo', () => {
    const c = ctx(estadoEn('K5', { tipo: 'pregunta', clave: 'K5', rama: null, pasoRama: 0 }, {}, { rotacion: { acuse: 'ACUSE-2', foto: null, diaFeo: null } }));
    acusar(c, false);
    acusar(c, true);
    expect(ids(c.salidas)).toEqual(['ACUSE-3', 'ACUSE-5']);
    const cap = ctx(estadoEn('K42', { tipo: 'pregunta', clave: 'K42', rama: null, pasoRama: 0 }, {}, { rotacion: { acuse: 'ACUSE-2', foto: null, diaFeo: null } }));
    acusar(cap, false);
    acusar(cap, false);
    expect(ids(cap.salidas)).toEqual(['ACUSE-4', 'ACUSE-5']);
    const feo = ctx(estadoEn('K39', { tipo: 'pregunta', clave: 'K39', rama: null, pasoRama: 0 }));
    acusar(feo, false);
    acusar(feo, false);
    expect(ids(feo.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'B-DIAFEO-ACUSE-2']);
  });
});
```

- [ ] **Step 3: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-flujo.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/motor/flujo.js`.

- [ ] **Step 4: Implementar**

`fabrica/src/kids-v2/motor/flujo.ts`:
```ts
// El recorrido del guion: empezar un item, terminarlo y decidir qué sigue
// (flujo-vigente.md §3 a §10). Trabaja sobre un borrador del estado (Ctx)
// que motor.ts clona al entrar: desde afuera, todo es puro.

import { ACUSES, ACUSES_DIA_FEO, ACUSES_FOTO, opcionesAcuse, siguienteDe } from '../acuses.js';
import { extra as extraDelBanco, pregunta, type IdMensaje } from '../banco.js';
import { fotoDelItem } from '../compra.js';
import { extrasDisponibles, type HistorialExtras } from '../extras.js';
import { aLocal, sumarDias } from '../horas.js';
import { VENTANA_MS } from '../reglas.js';
import { esPlural } from '../texto.js';
import type { Extra } from '../tipos.js';
import { avisoPreguntaNueva, extraMsg, fijoA, fotoMsg, padreMsgs, preguntaMsg, variables } from './mensajes.js';
import type { Estado, Fase, Mensaje, MotivoMarca, Salida } from './tipos.js';

export type Ctx = { e: Estado; ahora: Date; salidas: Salida[]; /** Procesando lo que llegó de noche, a las 9. */ replay: boolean };

export const hoy = (c: Ctx) => aLocal(c.ahora, c.e.ficha.zona).fecha;

export function emitir(c: Ctx, ...ms: Mensaje[]): void {
  for (const m of ms) c.salidas.push({ tipo: 'mensaje', ...m });
}

export function marcar(c: Ctx, motivo: MotivoMarca, detalle: string): void {
  c.salidas.push({ tipo: 'marca', motivo, detalle });
}

export function ventanaAbierta(e: Estado, ahora: Date): boolean {
  return e.ultimaEntrada !== null && ahora.getTime() - new Date(e.ultimaEntrada).getTime() < VENTANA_MS;
}

/**
 * Manda un lote. Si es "a la hora" (proactivo) y la ventana de 24 h está
 * cerrada, o es canal B ("cada pregunta llega al tocar [Estamos listos]"),
 * primero va PREG-NUEVA y el lote queda retenido hasta el botón. Si ya había
 * un PREG-NUEVA sin respuesta, no sale otro: se cambia lo retenido (no se acumulan).
 */
export function entregar(c: Ctx, mensajes: Mensaje[], luego: Fase, proactivo: boolean): void {
  const e = c.e;
  if (!proactivo || (e.ficha.canal === 'A' && ventanaAbierta(e, c.ahora))) {
    emitir(c, ...mensajes);
    e.fase = luego;
    return;
  }
  if (e.fase.tipo !== 'retenido') emitir(c, avisoPreguntaNueva(e));
  e.fase = { tipo: 'retenido', mensajes, luego };
}

export function soltarRetenido(c: Ctx): void {
  const f = c.e.fase;
  if (f.tipo !== 'retenido') return;
  emitir(c, ...f.mensajes);
  c.e.fase = f.luego;
  // Canal B: TERMINO-PADRE va al día siguiente de que le llegó FINAL-CHICO, no del cierre.
  if (f.luego.tipo === 'terminado' && c.e.terminoPadre !== null) c.e.terminoPadre = sumarDias(hoy(c), 1);
}

const historial = (e: Estado): HistorialExtras => ({ opsUsadas: e.opsUsadas, extrasUsadas: e.extrasUsadas, hermanos: e.hermanos, peleaK36: e.peleaK36 });

/** La extra de "una más de estas" del capítulo: la primera disponible; en el cap. 4 (K39 ya salió) solo las livianas. */
export function extrasDeUnaMas(e: Estado): Extra[] {
  const item = e.guion[e.cursor];
  return extrasDisponibles(e.ficha, historial(e), { cap: item.cap, soloLivianas: item.cap === 4 });
}

export function extrasDelFinal(e: Estado): Extra[] {
  return extrasDisponibles(e.ficha, historial(e));
}

export function mandarExtra(c: Ctx, x: Extra): void {
  const e = c.e;
  e.extra = x.id;
  e.extrasUsadas.push(x.id);
  e.conto = false;
  emitir(c, extraMsg(e, x));
  e.fase = x.foto ? { tipo: 'foto', clave: x.id } : { tipo: 'pregunta', clave: x.id, rama: null, pasoRama: 0 };
}

/** Empieza el item i del guion: lo que va antes (entrada, aviso, línea del padre) y la pregunta. */
export function empezarItem(c: Ctx, i: number, proactivo: boolean): void {
  const e = c.e;
  const item = e.guion[i];
  if (!item) throw new Error(`No hay item ${i} en el guion`);
  e.cursor = i;
  e.extra = null;
  e.conto = false;
  switch (item.tipo) {
    case 'principal': {
      const ms: Mensaje[] = [];
      if (item.primeraDelCap) ms.push(fijoA(e, `ENTRADA-${item.cap}`));
      e.diaHecho = hoy(c);
      const p = pregunta(item.clave);
      if (p.avisoAntes) return entregar(c, [...ms, fijoA(e, 'B-AVISO-SERIA')], { tipo: 'aviso-seria' }, proactivo);
      return entregar(c, [...ms, preguntaMsg(e, p)], { tipo: 'pregunta', clave: item.clave, rama: null, pasoRama: 0 }, proactivo);
    }
    case 'una-mas':
      if (extrasDeUnaMas(e).length === 0) return empezarItem(c, i + 1, proactivo);
      return entregar(c, [fijoA(e, 'B-UNA-MAS')], { tipo: 'una-mas' }, proactivo);
    case 'cierre':
      return entregar(c, [fijoA(e, item.clave as IdMensaje)], { tipo: 'cierre' }, proactivo);
    case 'padre':
      e.diaHecho = hoy(c);
      return entregar(c, padreMsgs(e, item), { tipo: 'pregunta', clave: item.clave, rama: null, pasoRama: 0 }, proactivo);
    case 'extras':
      e.extrasDesde = c.ahora.toISOString();
      if (extrasDelFinal(e).length === 0) return empezarItem(c, i + 1, proactivo);
      return entregar(c, [fijoA(e, 'EXTRAS-OFERTA')], { tipo: 'extras-oferta' }, proactivo);
    case 'final': {
      // TERMINO-PADRE: canal A, ya; canal B, al día siguiente a la hora (05/10, Fable 7).
      if (e.ficha.canal === 'A') emitir(c, fijoA(e, 'TERMINO-PADRE', { variables: variables.padre(e.ficha), paraPadre: true }));
      else e.terminoPadre = sumarDias(hoy(c), 1);
      const id = esPlural(e.ficha.quienRegala) ? 'FINAL-CHICO-PL' : 'FINAL-CHICO';
      return entregar(c, [fijoA(e, id, { variables: variables.chico(e.ficha) })], { tipo: 'terminado' }, proactivo);
    }
  }
}

/** Terminó el item en curso (contestó, pasó o no aplicaba): qué sigue (banco.md, "Reglas del flujo"). */
export function terminarItem(c: Ctx): void {
  const e = c.e;
  const item = e.guion[e.cursor];
  if (e.extra) {
    e.extra = null;
    if (item.tipo === 'una-mas') return empezarItem(c, e.cursor + 1, false);
    const quedan = extrasDelFinal(e);
    if (quedan.length > 0) {
      emitir(c, fijoA(e, 'EXTRAS-OTRA'));
      e.fase = { tipo: 'extras-otra' };
      return;
    }
    emitir(c, fijoA(e, 'EXTRAS-FIN'));
    return empezarItem(c, e.cursor + 1, false);
  }
  if (item.tipo === 'principal' && pregunta(item.clave).avisoAntes) {
    // K39: si contó, la tranquila; si pasó, K40 directo (05/10, Fable 9).
    if (!e.conto) return empezarItem(c, e.cursor + 1, false);
    emitir(c, fijoA(e, 'B-TRANQUILA'));
    e.fase = { tipo: 'tranquila' };
    return;
  }
  if (item.tipo === 'principal' && item.ultimaDelCap) return empezarItem(c, e.cursor + 1, false);
  if (item.tipo === 'cierre' && item.clave === 'CIERRE-FINAL') return empezarItem(c, e.cursor + 1, false);
  emitir(c, fijoA(e, 'B-SEGUIR'));
  e.fase = { tipo: 'seguir' };
}

/** Lo que se está preguntando ahora: la principal, la extra o la del padre. */
export function enCurso(e: Estado): { capsula: boolean; sensible: boolean } {
  if (e.extra) {
    const x = extraDelBanco(e.extra);
    return { capsula: x.cap === 5, sensible: x.sensible };
  }
  const item = e.guion[e.cursor];
  return { capsula: item?.cap === 5 && item.tipo !== 'padre', sensible: item?.tipo === 'principal' && pregunta(item.clave).sensible };
}

export function acusar(c: Ctx, escrito: boolean): void {
  const e = c.e;
  const { capsula, sensible } = enCurso(e);
  if (sensible) return acuseSobrio(c);
  const id = siguienteDe(ACUSES, opcionesAcuse({ capsula, escrito }), e.rotacion.acuse);
  e.rotacion.acuse = id;
  emitir(c, fijoA(e, id as (typeof ACUSES)[number]));
}

export function acuseFoto(c: Ctx): void {
  const id = siguienteDe(ACUSES_FOTO, ACUSES_FOTO, c.e.rotacion.foto);
  c.e.rotacion.foto = id;
  emitir(c, fijoA(c.e, id as (typeof ACUSES_FOTO)[number]));
}

/** Los acuses del día feo (B-DIAFEO-ACUSE): K39, la extra sensible y algo preocupante. */
export function acuseSobrio(c: Ctx): void {
  const id = siguienteDe(ACUSES_DIA_FEO, ACUSES_DIA_FEO, c.e.rotacion.diaFeo);
  c.e.rotacion.diaFeo = id;
  emitir(c, fijoA(c.e, id as (typeof ACUSES_DIA_FEO)[number]));
}

/** Después del acuse (o del "paso"): la foto pegada, si la principal tiene; si no, lo que siga. */
export function fotoOTerminar(c: Ctx): void {
  const e = c.e;
  const item = e.guion[e.cursor];
  const foto = e.extra ? null : fotoDelItem(item);
  if (foto) {
    emitir(c, fotoMsg(e, foto));
    e.fase = { tipo: 'foto', clave: item.clave };
    return;
  }
  terminarItem(c);
}

/** "Mañana sigo" / "Mañana mejor": B-MAÑANA y el día queda hecho. De noche (se procesa a las 9) no se dice nada. */
export function manana(c: Ctx, siguiente: number): void {
  if (!c.replay) {
    emitir(c, fijoA(c.e, 'B-MAÑANA'));
    c.e.diaHecho = hoy(c);
  }
  c.e.fase = { tipo: 'libre', siguiente };
}
```

- [ ] **Step 5: Correr los tests**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p .
```
Esperado: PASS (15 nuevos en flujo), `tsc` sin errores.

- [ ] **Step 6: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/motor/flujo.ts fabrica/test/kids-v2-ayuda.ts fabrica/test/kids-v2-flujo.test.ts
git commit -m "$(cat <<'EOF'
kids v2: motor, parte 2: el recorrido del guion (entradas, aviso de la seria, una más, cierres, seguir, extras, final y la ventana de 24 h)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 7: Motor, parte 3 · un día típico (lo que cuenta el chico)

**Files:**
- Create: `fabrica/src/kids-v2/motor/rafaga.ts` (versión sin "algo preocupante": la tarea 11 le agrega tres líneas)
- Test: `fabrica/test/kids-v2-rafaga.test.ts`

**Interfaces:**
- Consumes: `Ctx`, `acusar`, `acuseFoto`, `emitir`, `empezarItem`, `fotoOTerminar`, `marcar`, `soltarRetenido`, `terminarItem` (6); `opMsg`, `ramaMsg` (5); `pregunta` (1); `CORTO_AUDIO_SEG`, `CORTO_PALABRAS` (3).
- Produces: `sumarARafaga(c, contenido)`, `esCorta({ seg, palabras, fotos })`, `procesarRafaga(c)` (la usan botones, reloj y motor).

Reglas: ráfaga (varios audios, un acuse); "muy corto" con otra puerta una sola vez (no en sensibles; la de K12 solo en la rama "Tengo hermanos"); orden OP → acuse → foto → seguir; escrito y cápsula con sus acuses; la segunda pregunta de la rama de K12; un "no" contado en un cierre; contenido cuando se espera un botón; bienvenida y PREG-NUEVA que se sueltan escribiendo; después del final, marca.

- [ ] **Step 1: Escribir el test que falla**

`fabrica/test/kids-v2-rafaga.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { esCorta, procesarRafaga, sumarARafaga } from '../src/kids-v2/motor/rafaga.js';
import type { Contenido, Fase } from '../src/kids-v2/motor/tipos.js';
import type { Ctx } from '../src/kids-v2/motor/flujo.js';
import { ctx, estadoEn, ids } from './kids-v2-ayuda.js';

const AUDIO = (seg: number): Contenido => ({ tipo: 'audio', seg });
const TEXTO = (texto: string): Contenido => ({ tipo: 'texto', texto });
const FOTO: Contenido = { tipo: 'foto' };
const preg = (clave: string, rama: string | null = null, pasoRama = 0): Fase => ({ tipo: 'pregunta', clave, rama, pasoRama });

function cuenta(c: Ctx, ...cs: Contenido[]): Ctx {
  for (const x of cs) sumarARafaga(c, x);
  procesarRafaga(c);
  return c;
}

describe('kids v2: muy corto (#20)', () => {
  it('audio de menos de 15 s y texto de menos de 8 palabras; una foto nunca es corta', () => {
    expect(esCorta({ seg: 14, palabras: 0, fotos: 0 })).toBe(true);
    expect(esCorta({ seg: 15, palabras: 0, fotos: 0 })).toBe(false);
    expect(esCorta({ seg: 0, palabras: 7, fotos: 0 })).toBe(true);
    expect(esCorta({ seg: 0, palabras: 8, fotos: 0 })).toBe(false);
    expect(esCorta({ seg: 0, palabras: 0, fotos: 1 })).toBe(false);
  });

  it('la ráfaga junta varios audios y textos', () => {
    const c = ctx(estadoEn('K5', preg('K5')));
    sumarARafaga(c, AUDIO(10));
    sumarARafaga(c, AUDIO(10));
    sumarARafaga(c, TEXTO('hola che'));
    expect(c.e.rafaga).toMatchObject({ seg: 20, palabras: 2, fotos: 0, textos: ['hola che'] });
  });
});

describe('kids v2: un día típico (orden: otra puerta → acuse → foto → seguir)', () => {
  it('respuesta larga a una principal con foto: acuse y la foto', () => {
    const c = cuenta(ctx(estadoEn('K1', preg('K1'))), AUDIO(60));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'K1-FOTO']);
    expect(c.e.fase).toEqual({ tipo: 'foto', clave: 'K1' });
  });

  it('respuesta larga sin foto: acuse y B-SEGUIR', () => {
    const c = cuenta(ctx(estadoEn('K5', preg('K5'))), AUDIO(60), AUDIO(30));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });

  it('muy corta: la otra puerta, una sola vez; después acuse y foto', () => {
    const c = cuenta(ctx(estadoEn('K2', preg('K2'))), AUDIO(5));
    expect(ids(c.salidas)).toEqual(['K2-OP']);
    expect(c.e.opsUsadas).toEqual(['K2']);
    cuenta(c, AUDIO(4));
    expect(ids(c.salidas)).toEqual(['K2-OP', 'ACUSE-1', 'K2-FOTO']);
  });

  it('una OP que ya salió no vuelve; K39 (sensible) no tiene; la de K12 solo en la rama "Tengo hermanos"', () => {
    const c = cuenta(ctx(estadoEn('K2', preg('K2'), {}, { opsUsadas: ['K2'] })), AUDIO(5));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'K2-FOTO']);
    const k12 = cuenta(ctx(estadoEn('K12', preg('K12'))), AUDIO(5));
    expect(ids(k12.salidas)).toEqual(['ACUSE-1', 'K12-FOTO']);
    const tengo = cuenta(ctx(estadoEn('K12', preg('K12', 'Tengo hermanos'))), AUDIO(5));
    expect(ids(tengo.salidas)).toEqual(['K12-OP']);
  });

  it('rama de dos pasos (K12, "No tengo hermanos"): la segunda sale sin acuse', () => {
    const c = cuenta(ctx(estadoEn('K12', preg('K12', 'No tengo hermanos'))), AUDIO(4));
    expect(ids(c.salidas)).toEqual(['K12-R2-2']);
    cuenta(c, AUDIO(60));
    expect(ids(c.salidas)).toEqual(['K12-R2-2', 'ACUSE-1', 'K12-FOTO']);
  });

  it('escribe en vez de audio: acuses sin "escuché"', () => {
    const c = cuenta(ctx(estadoEn('K5', preg('K5'))), TEXTO('me caí de la bici en la plaza y me raspé toda la rodilla'));
    expect(ids(c.salidas)).toEqual(['ACUSE-2', 'B-SEGUIR']);
  });

  it('la cápsula: acuses sin "libro"', () => {
    const c = cuenta(ctx(estadoEn('K43', preg('K43'), {}, { rotacion: { acuse: 'ACUSE-2', foto: null, diaFeo: null } })), AUDIO(60));
    expect(ids(c.salidas)).toEqual(['ACUSE-4', 'B-SEGUIR']);
  });

  it('foto: acuse de foto y seguir; un audio en vez de la foto también vale', () => {
    const c = cuenta(ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' })), FOTO, FOTO);
    expect(ids(c.salidas)).toEqual(['ACUSE-FOTO-1', 'B-SEGUIR']);
    const d = cuenta(ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' })), AUDIO(30));
    expect(ids(d.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });

  it('el audio después de [No tengo]: acuse y seguir', () => {
    const c = cuenta(ctx(estadoEn('K3', { tipo: 'foto-audio', clave: 'K3', desde: '2026-10-10T21:00:00.000Z' })), AUDIO(20));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });

  it('K39 contado: el acuse del día feo y la tranquila', () => {
    const c = cuenta(ctx(estadoEn('K39', preg('K39'))), AUDIO(90), AUDIO(40));
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'B-TRANQUILA']);
  });

  it('K36 contada sin otra puerta: habilita la extra "cómo se arreglaron"', () => {
    const c = cuenta(ctx(estadoEn('K36', preg('K36'))), AUDIO(60));
    expect(c.e.peleaK36).toBe(true);
    const d = cuenta(ctx(estadoEn('K36', preg('K36'))), AUDIO(5));
    expect(d.e.peleaK36).toBe(false);
  });
});

describe('kids v2: cierres y respuestas fuera de lugar', () => {
  it('cierre: un "no" contado (corto) es como [No, eso fue todo], sin acuse; algo largo lleva acuse', () => {
    const c = cuenta(ctx(estadoEn('CIERRE-1', { tipo: 'cierre' })), TEXTO('no'));
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
    const d = cuenta(ctx(estadoEn('CIERRE-1', { tipo: 'cierre' })), AUDIO(40));
    expect(ids(d.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
    const e = cuenta(ctx(estadoEn('CIERRE-1', { tipo: 'cierre-cuenta' })), AUDIO(40));
    expect(ids(e.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });

  it('esperando un botón: si cuenta algo, acuse y se queda; si es corto, nada', () => {
    const c = cuenta(ctx(estadoEn('K5', { tipo: 'seguir' })), AUDIO(40));
    expect(ids(c.salidas)).toEqual(['ACUSE-1']);
    expect(c.e.fase).toEqual({ tipo: 'seguir' });
    const d = cuenta(ctx(estadoEn('K5', { tipo: 'seguir' })), TEXTO('ok'));
    expect(ids(d.salidas)).toEqual([]);
  });

  it('en la bienvenida, escribir es como tocar el botón; con PREG-NUEVA sin tocar, escribir suelta lo retenido', () => {
    const c = cuenta(ctx(estadoEn('K1', { tipo: 'bienvenida' })), TEXTO('hola'));
    expect(ids(c.salidas)).toEqual(['ENTRADA-1', 'K1']);
    const m = { a: 'chico' as const, id: 'K6', texto: 'x', botones: ['Paso'], plantilla: null };
    const d = cuenta(ctx(estadoEn('K5', { tipo: 'retenido', mensajes: [m], luego: preg('K6') })), TEXTO('hola'));
    expect(ids(d.salidas)).toEqual(['K6']);
    expect(d.e.fase).toEqual(preg('K6'));
  });

  it('después del final: no contesta, marca a Naza', () => {
    const c = cuenta(ctx(estadoEn('FINAL', { tipo: 'terminado' })), AUDIO(20));
    expect(ids(c.salidas)).toEqual(['marca:escribio-despues-del-final']);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-rafaga.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/motor/rafaga.js`.

- [ ] **Step 3: Implementar**

`fabrica/src/kids-v2/motor/rafaga.ts`:
```ts
// Lo que cuenta el chico: se junta en una ráfaga y se contesta una sola vez,
// cuando pasan 90 s sin nada nuevo (#19). Orden después de una respuesta
// (05/10): otra puerta (si fue muy corta) → acuse → foto pegada → seguir.

import { pregunta } from '../banco.js';
import { CORTO_AUDIO_SEG, CORTO_PALABRAS } from '../reglas.js';
import { acusar, acuseFoto, emitir, empezarItem, fotoOTerminar, marcar, soltarRetenido, terminarItem, type Ctx } from './flujo.js';
import { opMsg, ramaMsg } from './mensajes.js';
import type { Contenido } from './tipos.js';

const palabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function sumarARafaga(c: Ctx, contenido: Contenido): void {
  const ahora = c.ahora.toISOString();
  const r = c.e.rafaga ?? { desde: ahora, ultima: ahora, seg: 0, palabras: 0, fotos: 0, textos: [] };
  r.ultima = ahora;
  if (contenido.tipo === 'audio') {
    r.seg += contenido.seg;
    if (contenido.transcripcion) r.textos.push(contenido.transcripcion);
  } else if (contenido.tipo === 'texto') {
    r.palabras += palabras(contenido.texto);
    r.textos.push(contenido.texto);
  } else r.fotos += 1;
  c.e.rafaga = r;
}

/** "Muy corto" (#20): sin foto, audio de menos de 15 s y texto de menos de 8 palabras. */
export function esCorta(r: { seg: number; palabras: number; fotos: number }): boolean {
  return r.fotos === 0 && r.seg < CORTO_AUDIO_SEG && r.palabras < CORTO_PALABRAS;
}

export function procesarRafaga(c: Ctx): void {
  const e = c.e;
  const r = e.rafaga;
  if (!r) return;
  e.rafaga = null;
  const corta = esCorta(r);
  const escrito = r.seg === 0 && r.palabras > 0;
  const f = e.fase;

  if (f.tipo === 'sin-empezar') return;
  if (f.tipo === 'terminado') return marcar(c, 'escribio-despues-del-final', `${r.seg} s de audio, ${r.palabras} palabras, ${r.fotos} fotos`);

  switch (f.tipo) {
    case 'bienvenida':
      return empezarItem(c, 0, false);
    case 'retenido':
      return soltarRetenido(c);
    case 'pregunta':
      return respuestaAPregunta(c, corta, escrito);
    case 'op':
      acusar(c, escrito);
      return fotoOTerminar(c);
    case 'foto':
      if (r.fotos > 0) acuseFoto(c);
      else acusar(c, escrito);
      return terminarItem(c);
    case 'foto-audio':
      acusar(c, escrito);
      return terminarItem(c);
    case 'cierre':
      // Un "no" contado en vez de tocado: como [No, eso fue todo], sin acuse ("va al libro" nunca después de un no).
      if (!corta) acusar(c, escrito);
      return terminarItem(c);
    case 'cierre-cuenta':
      acusar(c, escrito);
      return terminarItem(c);
    default:
      // Esperando un botón (seguir, una más, tranquila, aviso, extras) o nada: si contó algo, acuse y se queda donde está.
      if (!corta) acusar(c, escrito);
  }
}

function respuestaAPregunta(c: Ctx, corta: boolean, escrito: boolean): void {
  const e = c.e;
  const f = e.fase;
  if (f.tipo !== 'pregunta') return;
  const item = e.guion[e.cursor];
  if (!e.extra && item.tipo === 'principal') {
    const p = pregunta(item.clave);
    if (f.rama !== null) {
      const ri = p.ramas.findIndex((x) => x.boton === f.rama);
      const accion = p.ramas[ri].accion;
      if (accion.tipo === 'preguntar' && f.pasoRama < accion.pasos.length - 1) {
        emitir(c, ramaMsg(e, p, ri, f.pasoRama + 1));
        e.fase = { ...f, pasoRama: f.pasoRama + 1 };
        return;
      }
    }
    e.conto = true;
    const op = p.op;
    if (corta && op && !p.sensible && !e.opsUsadas.includes(p.id) && (op.soloRama === null || op.soloRama === f.rama)) {
      e.opsUsadas.push(p.id);
      emitir(c, opMsg(e, p));
      e.fase = { tipo: 'op', clave: p.id };
      return;
    }
    if (p.id === 'K36') e.peleaK36 = true;
  } else e.conto = true;
  acusar(c, escrito);
  fotoOTerminar(c);
}
```

- [ ] **Step 4: Correr los tests**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p .
```
Esperado: PASS (17 nuevos), `tsc` sin errores.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/motor/rafaga.ts fabrica/test/kids-v2-rafaga.test.ts
git commit -m "$(cat <<'EOF'
kids v2: motor, parte 3: un día típico (ráfaga, muy corto, otra puerta, acuse, foto y seguir)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 8: Motor, parte 4 · los botones (capítulos, serias, padre, final)

**Files:**
- Create: `fabrica/src/kids-v2/motor/botones.ts` (versión sin "algo preocupante": la tarea 11 le agrega una línea)
- Test: `fabrica/test/kids-v2-botones.test.ts`

**Interfaces:**
- Consumes: `extra`, `pregunta` (1); `fotoDelItem` (4); de `flujo.ts`: `emitir`, `empezarItem`, `extrasDelFinal`, `extrasDeUnaMas`, `fotoOTerminar`, `hoy`, `manana`, `mandarExtra`, `soltarRetenido`, `terminarItem`, `Ctx`; de `mensajes.ts`: `extraMsg`, `fijoA`, `padreMsgs`, `preguntaMsg`, `ramaMsg`.
- Produces: `alBoton(c, boton: string)`.

Reglas: [Paso]/[Esta la paso]/[Esta no, gracias] → B-PASO (y la foto igual sale; K39 → K40 directo); ramas que preguntan o "no aplica"; [No tengo] → B-FOTO-NOTENGO (K29: B-FOTO-PLATA) y espera el audio; [Hoy no la como] espera el audio sin decir nada; [No hago]/[De ninguno]/[No miro] → B-NO-PASA-NADA; seguir; aviso ([Mañana mejor] cuenta como el día hecho); tranquila; una más; cierres; extras del final; [Dale, vamos]; [Dale, mandámela]; canal B [Estamos listos].

- [ ] **Step 1: Escribir el test que falla**

`fabrica/test/kids-v2-botones.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { alBoton } from '../src/kids-v2/motor/botones.js';
import type { Ctx } from '../src/kids-v2/motor/flujo.js';
import type { Fase } from '../src/kids-v2/motor/tipos.js';
import { ctx, estadoEn, ids } from './kids-v2-ayuda.js';

const preg = (clave: string, rama: string | null = null, pasoRama = 0): Fase => ({ tipo: 'pregunta', clave, rama, pasoRama });
function toca(c: Ctx, ...bs: string[]): Ctx {
  for (const b of bs) alBoton(c, b);
  return c;
}

describe('kids v2: botones de la pregunta', () => {
  it('[Paso] en todas: B-PASO, y la foto pegada igual sale', () => {
    expect(ids(toca(ctx(estadoEn('K5', preg('K5'))), 'Paso').salidas)).toEqual(['B-PASO', 'B-SEGUIR']);
    expect(ids(toca(ctx(estadoEn('K1', preg('K1'))), 'Paso').salidas)).toEqual(['B-PASO', 'K1-FOTO']);
    expect(ids(toca(ctx(estadoEn('K10', preg('K10'))), 'Esta la paso').salidas)).toEqual(['B-PASO', 'K10-FOTO']);
  });

  it('K39 pasada: B-PASO y K40 directo, sin la tranquila', () => {
    expect(ids(toca(ctx(estadoEn('K39', preg('K39'))), 'Esta la paso').salidas)).toEqual(['B-PASO', 'K40']);
  });

  it('ramas: preguntan (K12 marca hermanos) o "no aplica" (B-NO-PASA-NADA y sigue)', () => {
    const c = toca(ctx(estadoEn('K12', preg('K12'))), 'Tengo hermanos');
    expect(ids(c.salidas)).toEqual(['K12-R1']);
    expect(c.e.fase).toEqual(preg('K12', 'Tengo hermanos'));
    expect(c.e.hermanos).toBe(true);
    toca(c, 'No tengo hermanos'); // ya eligió: no hace nada
    expect(ids(c.salidas)).toEqual(['K12-R1']);
    expect(ids(toca(ctx(estadoEn('K16', preg('K16'))), 'No tengo').salidas)).toEqual(['B-NO-PASA-NADA', 'B-SEGUIR']);
    expect(ids(toca(ctx(estadoEn('K38', preg('K38'))), 'No se me ocurre').salidas)).toEqual(['B-NO-PASA-NADA', 'B-SEGUIR']);
  });

  it('otra puerta: [Paso] la saltea y sigue a la foto', () => {
    expect(ids(toca(ctx(estadoEn('K2', { tipo: 'op', clave: 'K2' })), 'Paso').salidas)).toEqual(['B-PASO', 'K2-FOTO']);
  });

  it('pregunta del padre y extra: [Esta la paso] / [Paso]', () => {
    const p = toca(ctx(estadoEn('PADRE-1', preg('PADRE-1'), { preguntasPadre: [{ texto: 'x', conLinea: true }] })), 'Esta la paso');
    expect(ids(p.salidas)).toEqual(['B-PASO', 'B-SEGUIR']);
    const x = toca(ctx(estadoEn('UNA-MAS-1', preg('X1-6'), {}, { extra: 'X1-6' })), 'Paso');
    expect(ids(x.salidas)).toEqual(['B-PASO', 'CIERRE-1']);
  });
});

describe('kids v2: botones de la foto', () => {
  it('[No tengo]: le ofrece contarlo en audio y espera; K29 con su texto', () => {
    const c = toca(ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' })), 'No tengo');
    expect(ids(c.salidas)).toEqual(['B-FOTO-NOTENGO']);
    expect(c.e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K1' });
    expect(ids(toca(ctx(estadoEn('K29', { tipo: 'foto', clave: 'K29' })), 'No tengo').salidas)).toEqual(['B-FOTO-PLATA']);
  });

  it('[Hoy no la como]: no dice nada, espera el audio', () => {
    const c = toca(ctx(estadoEn('K24', { tipo: 'foto', clave: 'K24' })), 'Hoy no la como');
    expect(ids(c.salidas)).toEqual([]);
    expect(c.e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K24' });
  });

  it('[No hago] / [De ninguno] / [No miro]: B-NO-PASA-NADA y sigue; un botón que no es de esta foto no hace nada', () => {
    expect(ids(toca(ctx(estadoEn('K11', { tipo: 'foto', clave: 'K11' })), 'No hago').salidas)).toEqual(['B-NO-PASA-NADA', 'B-SEGUIR']);
    expect(ids(toca(ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' })), 'No hago').salidas)).toEqual([]);
  });

  it('la foto que se mudó por un tema sacado lleva sus botones', () => {
    expect(ids(toca(ctx(estadoEn('K16', { tipo: 'foto', clave: 'K16' }, { temasSacados: ['papa'] })), 'No hago').salidas)).toEqual(['B-NO-PASA-NADA', 'B-SEGUIR']);
  });
});

describe('kids v2: seguir, aviso, tranquila, una más, cierres y extras', () => {
  it('seguir: [Dale, otra] trae la siguiente (con su entrada si cambia de capítulo); [Mañana sigo] B-MAÑANA y el día hecho', () => {
    expect(ids(toca(ctx(estadoEn('K5', { tipo: 'seguir' })), 'Dale, otra').salidas)).toEqual(['K6']);
    expect(ids(toca(ctx(estadoEn('CIERRE-1', { tipo: 'seguir' })), 'Dale, otra').salidas)).toEqual(['ENTRADA-2', 'K10']);
    const c = toca(ctx(estadoEn('K5', { tipo: 'seguir' })), 'Mañana sigo');
    expect(ids(c.salidas)).toEqual(['B-MAÑANA']);
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: c.e.cursor + 1 });
    expect(c.e.diaHecho).toBe('2026-10-10');
  });

  it('aviso: [Voy ahora] sale K39; [Mañana mejor] B-MAÑANA y mañana vuelve el aviso', () => {
    expect(ids(toca(ctx(estadoEn('K39', { tipo: 'aviso-seria' })), 'Voy ahora').salidas)).toEqual(['K39']);
    const c = toca(ctx(estadoEn('K39', { tipo: 'aviso-seria' })), 'Mañana mejor');
    expect(ids(c.salidas)).toEqual(['B-MAÑANA']);
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: c.e.cursor });
  });

  it('tranquila: [Dale, una tranquila] K40; [Mañana sigo] queda K40 para mañana', () => {
    expect(ids(toca(ctx(estadoEn('K39', { tipo: 'tranquila' })), 'Dale, una tranquila').salidas)).toEqual(['K40']);
    const c = toca(ctx(estadoEn('K39', { tipo: 'tranquila' })), 'Mañana sigo');
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: c.e.cursor + 1 });
  });

  it('una más: [Dale, otra] la primera extra disponible (en el cap. 4, liviana); [No, cerramos] el cierre', () => {
    const c = toca(ctx(estadoEn('UNA-MAS-1', { tipo: 'una-mas' }, {}, { opsUsadas: ['K1'] })), 'Dale, otra');
    expect(ids(c.salidas)).toEqual(['X1-2']);
    expect(c.e.extra).toBe('X1-2');
    expect(ids(toca(ctx(estadoEn('UNA-MAS-4', { tipo: 'una-mas' }, {}, { peleaK36: true })), 'Dale, otra').salidas)).toEqual(['X4-1']);
    expect(ids(toca(ctx(estadoEn('UNA-MAS-2', { tipo: 'una-mas' })), 'No, cerramos').salidas)).toEqual(['CIERRE-2']);
  });

  it('cierre: [No, eso fue todo] sigue sin acuse; [Sí, hay algo] espera sin decir nada', () => {
    expect(ids(toca(ctx(estadoEn('CIERRE-3', { tipo: 'cierre' })), 'No, eso fue todo').salidas)).toEqual(['B-SEGUIR']);
    const c = toca(ctx(estadoEn('CIERRE-3', { tipo: 'cierre' })), 'Sí, hay algo');
    expect(ids(c.salidas)).toEqual([]);
    expect(c.e.fase).toEqual({ tipo: 'cierre-cuenta' });
  });

  it('extras del final: [Dale, otra] EXTRAS-SI y la primera; [No, ya está] / [Lo dejamos acá] el final', () => {
    expect(ids(toca(ctx(estadoEn('EXTRAS', { tipo: 'extras-oferta' })), 'Dale, otra').salidas)).toEqual(['EXTRAS-SI', 'X1-1']);
    expect(ids(toca(ctx(estadoEn('EXTRAS', { tipo: 'extras-otra' }, {}, { extrasUsadas: ['X1-1'] })), 'Dale, otra').salidas)).toEqual(['X1-2']);
    expect(ids(toca(ctx(estadoEn('EXTRAS', { tipo: 'extras-oferta' })), 'No, ya está').salidas)).toEqual(['TERMINO-PADRE', 'FINAL-CHICO']);
    expect(ids(toca(ctx(estadoEn('EXTRAS', { tipo: 'extras-otra' })), 'Lo dejamos acá').salidas)).toEqual(['TERMINO-PADRE', 'FINAL-CHICO']);
  });

  it('botones viejos o repetidos no hacen nada', () => {
    expect(ids(toca(ctx(estadoEn('K5', preg('K5'))), 'Dale, otra', 'Mañana sigo', 'No, cerramos', 'Dale, vamos').salidas)).toEqual([]);
  });
});

describe('kids v2: arranque y [Estamos listos] (canal B)', () => {
  it('canal A: [Dale, vamos] → ENTRADA-1 y K1', () => {
    expect(ids(toca(ctx(estadoEn('K1', { tipo: 'bienvenida' })), 'Dale, vamos').salidas)).toEqual(['ENTRADA-1', 'K1']);
  });

  it('PREG-NUEVA: [Dale, mandámela] suelta lo retenido', () => {
    const m = { a: 'chico' as const, id: 'K6', texto: 'x', botones: ['Paso'], plantilla: null };
    expect(ids(toca(ctx(estadoEn('K5', { tipo: 'retenido', mensajes: [m], luego: preg('K6') })), 'Dale, mandámela').salidas)).toEqual(['K6']);
  });

  it('canal B: [Estamos listos] arranca, suelta lo retenido y, solo después de RECORD-B, vuelve a mandar la pendiente', () => {
    const B = { canal: 'B' as const };
    expect(ids(toca(ctx(estadoEn('K1', { tipo: 'bienvenida' }, B)), 'Estamos listos').salidas)).toEqual(['ENTRADA-1', 'K1']);
    expect(ids(toca(ctx(estadoEn('K5', preg('K5'), B)), 'Estamos listos').salidas)).toEqual([]);
    const c = toca(ctx(estadoEn('K5', preg('K5'), B, { reenviar: true })), 'Estamos listos', 'Estamos listos');
    expect(ids(c.salidas)).toEqual(['K5']);
    expect(c.salidas[0]).toMatchObject({ a: 'padre' });
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-botones.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/motor/botones.js`.

- [ ] **Step 3: Implementar**

`fabrica/src/kids-v2/motor/botones.ts`:
```ts
// Los botones (banco.md, "Mensajes ya aprobados" y columna Botones;
// mensajes.md). Un botón que no corresponde a lo que se espera (uno viejo,
// tocado dos veces) no hace nada: nunca rompe ni repite.

import { extra as extraDelBanco, pregunta } from '../banco.js';
import { fotoDelItem } from '../compra.js';
import {
  emitir,
  empezarItem,
  extrasDelFinal,
  extrasDeUnaMas,
  fotoOTerminar,
  hoy,
  manana,
  mandarExtra,
  soltarRetenido,
  terminarItem,
  type Ctx,
} from './flujo.js';
import { extraMsg, fijoA, padreMsgs, preguntaMsg, ramaMsg } from './mensajes.js';
import type { Foto } from '../tipos.js';

const BOTONES_NO_ES_LO_MIO = ['No hago', 'De ninguno', 'No miro'];

function fotoEnCurso(c: Ctx): Foto | null {
  const e = c.e;
  if (e.extra) return { de: e.extra, texto: '', botones: ['No tengo'], noTengo: null };
  const item = e.guion[e.cursor];
  return fotoDelItem(item);
}

/** Canal B: [Estamos listos] (de BIEN-PADRE, PREG-NUEVA-PADRE o RECORD-B) manda lo que está pendiente. */
function estamosListos(c: Ctx): void {
  const e = c.e;
  const f = e.fase;
  const item = e.guion[e.cursor];
  switch (f.tipo) {
    case 'bienvenida':
      return empezarItem(c, 0, false);
    case 'retenido':
      return soltarRetenido(c);
    case 'libre':
      return empezarItem(c, f.siguiente, false);
    case 'aviso-seria':
      if (!e.reenviar) return;
      e.reenviar = false;
      return emitir(c, fijoA(e, 'B-AVISO-SERIA'));
    case 'pregunta': {
      // Solo después de RECORD-B: la pregunta ya está arriba; se manda de nuevo para que quede a mano.
      if (!e.reenviar) return;
      e.reenviar = false;
      if (e.extra) return emitir(c, extraMsg(e, extraDelBanco(e.extra)));
      if (item.tipo === 'padre') return emitir(c, ...padreMsgs(e, item, false));
      if (item.tipo !== 'principal') return;
      const p = pregunta(item.clave);
      const ri = f.rama === null ? -1 : p.ramas.findIndex((r) => r.boton === f.rama);
      return emitir(c, ri < 0 ? preguntaMsg(e, p) : ramaMsg(e, p, ri, f.pasoRama));
    }
  }
}

export function alBoton(c: Ctx, boton: string): void {
  const e = c.e;
  const f = e.fase;
  if (e.ficha.canal === 'B' && boton === 'Estamos listos') return estamosListos(c);
  const item = e.guion[e.cursor];

  switch (f.tipo) {
    case 'bienvenida':
      if (boton === 'Dale, vamos') empezarItem(c, 0, false);
      return;
    case 'retenido':
      if (boton === 'Dale, mandámela') soltarRetenido(c);
      return;
    case 'pregunta': {
      if (e.extra || item.tipo === 'padre') {
        if (boton !== 'Paso' && boton !== 'Esta la paso') return;
        emitir(c, fijoA(e, 'B-PASO'));
        return terminarItem(c);
      }
      if (item.tipo !== 'principal') return;
      const p = pregunta(item.clave);
      if (boton === p.botonPaso) {
        emitir(c, fijoA(e, 'B-PASO'));
        return fotoOTerminar(c);
      }
      const ri = p.ramas.findIndex((r) => r.boton === boton);
      if (ri < 0 || f.rama !== null) return;
      const accion = p.ramas[ri].accion;
      if (p.id === 'K12') e.hermanos = boton.startsWith('Tengo');
      if (accion.tipo === 'preguntar') {
        emitir(c, ramaMsg(e, p, ri, 0));
        e.fase = { ...f, rama: boton, pasoRama: 0 };
        return;
      }
      emitir(c, fijoA(e, accion.tipo === 'paso' ? 'B-PASO' : 'B-NO-PASA-NADA'));
      return fotoOTerminar(c);
    }
    case 'op':
      if (boton !== 'Paso') return;
      emitir(c, fijoA(e, 'B-PASO'));
      return fotoOTerminar(c);
    case 'foto': {
      const foto = fotoEnCurso(c);
      if (!foto || !foto.botones.includes(boton)) return;
      if (boton === 'No tengo') {
        emitir(c, fijoA(e, foto.noTengo ? 'B-FOTO-PLATA' : 'B-FOTO-NOTENGO'));
        e.fase = { tipo: 'foto-audio', clave: f.clave, desde: c.ahora.toISOString() };
        return;
      }
      if (boton === 'Hoy no la como') {
        // La foto ya le pide contar la última vez que la comió: se espera su audio (05/10).
        e.fase = { tipo: 'foto-audio', clave: f.clave, desde: c.ahora.toISOString() };
        return;
      }
      if (BOTONES_NO_ES_LO_MIO.includes(boton)) {
        emitir(c, fijoA(e, 'B-NO-PASA-NADA'));
        return terminarItem(c);
      }
      return;
    }
    case 'seguir':
      if (boton === 'Dale, otra') return empezarItem(c, e.cursor + 1, false);
      if (boton === 'Mañana sigo') return manana(c, e.cursor + 1);
      return;
    case 'aviso-seria':
      if (boton === 'Voy ahora' && item.tipo === 'principal') {
        emitir(c, preguntaMsg(e, pregunta(item.clave)));
        e.diaHecho = hoy(c);
        e.fase = { tipo: 'pregunta', clave: item.clave, rama: null, pasoRama: 0 };
        return;
      }
      if (boton === 'Mañana mejor') return manana(c, e.cursor);
      return;
    case 'tranquila':
      if (boton === 'Dale, una tranquila') return empezarItem(c, e.cursor + 1, false);
      if (boton === 'Mañana sigo') return manana(c, e.cursor + 1);
      return;
    case 'una-mas':
      if (boton === 'Dale, otra') {
        const [x] = extrasDeUnaMas(e);
        if (x) return mandarExtra(c, x);
        return empezarItem(c, e.cursor + 1, false);
      }
      if (boton === 'No, cerramos') return empezarItem(c, e.cursor + 1, false);
      return;
    case 'cierre':
      if (boton === 'No, eso fue todo') return terminarItem(c);
      if (boton === 'Sí, hay algo') e.fase = { tipo: 'cierre-cuenta' };
      return;
    case 'extras-oferta':
    case 'extras-otra': {
      const [x] = extrasDelFinal(e);
      if (boton === 'Dale, otra') {
        if (!x) return empezarItem(c, e.cursor + 1, false);
        if (f.tipo === 'extras-oferta') emitir(c, fijoA(e, 'EXTRAS-SI'));
        return mandarExtra(c, x);
      }
      if (boton === 'No, ya está' || boton === 'Lo dejamos acá') return empezarItem(c, e.cursor + 1, false);
      return;
    }
  }
}
```

- [ ] **Step 4: Correr los tests**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p .
```
Esperado: PASS (19 nuevos), `tsc` sin errores.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/motor/botones.ts fabrica/test/kids-v2-botones.test.ts
git commit -m "$(cat <<'EOF'
kids v2: motor, parte 4: los botones (paso en todas, ramas, fotos, seguir, aviso de la seria, tranquila, una más, cierres, extras y canal B)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 9: Motor, parte 5 · los relojes

**Files:**
- Create: `fabrica/src/kids-v2/motor/reloj.ts` (versión sin "algo preocupante": la tarea 11 la toca en dos líneas)
- Test: `fabrica/test/kids-v2-reloj.test.ts`

**Interfaces:**
- Consumes: `horas.ts` (3); `reglas.ts` (3); de `flujo.ts`: `emitir`, `empezarItem`, `hoy`, `marcar`, `terminarItem`, `Ctx`; `fijoA`, `variables` (5); `procesarRafaga` (7).
- Produces: `bloqueante(e): boolean`, `alReloj(c)`, `proximoDespertar(e, ahora): Date | null`.

Reglas: la ráfaga se acusa a los 90 s de silencio; el audio después de [No tengo] se espera 10 minutos; "la hora" una vez por día (si ese día no tuvo su principal, no dijo "mañana" y no está activo hace menos de 30 minutos) manda la siguiente o hace vencer lo que esperaba un botón; con algo que bloquea, no manda nada (no se acumulan) y corren los recordatorios (4 días, 8 días + marca); en la oferta de extras, a los 2 días cierra solo; TERMINO-PADRE de canal B; nada de noche; `proximoDespertar` dice cuándo volver a llamar.

- [ ] **Step 1: Escribir el test que falla**

`fabrica/test/kids-v2-reloj.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { alReloj, bloqueante, proximoDespertar } from '../src/kids-v2/motor/reloj.js';
import { sumarARafaga } from '../src/kids-v2/motor/rafaga.js';
import type { Fase } from '../src/kids-v2/motor/tipos.js';
import { ctx, en, estadoEn, ids, iso } from './kids-v2-ayuda.js';

const preg = (clave: string): Fase => ({ tipo: 'pregunta', clave, rama: null, pasoRama: 0 });

describe('kids v2: 90 s de silencio (#19)', () => {
  it('la ráfaga se contesta recién cuando pasan 90 s sin nada nuevo', () => {
    const c = ctx(estadoEn('K5', preg('K5'), {}, { diaHecho: '2026-10-10' }), '2026-10-10', '18:05');
    sumarARafaga(c, { tipo: 'audio', seg: 60 });
    const a89 = { ...c, ahora: new Date(c.ahora.getTime() + 89_000) };
    alReloj(a89);
    expect(ids(a89.salidas)).toEqual([]);
    const a90 = { ...a89, ahora: new Date(c.ahora.getTime() + 90_000) };
    alReloj(a90);
    expect(ids(a90.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });
});

describe('kids v2: espera del audio de la foto', () => {
  it('a los 10 minutos sin audio, sigue', () => {
    const c = ctx(estadoEn('K3', { tipo: 'foto-audio', clave: 'K3', desde: iso('2026-10-10', '18:05') }, {}, { diaHecho: '2026-10-10' }), '2026-10-10', '18:14');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
    c.ahora = en('2026-10-10', '18:15');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
  });
});

describe('kids v2: la hora (mínimo una principal por día)', () => {
  it('a la hora, si está libre, sale la siguiente; una sola vez por día', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { diaHecho: '2026-10-09' }), '2026-10-10', '17:59');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
    c.ahora = en('2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K6']);
    c.ahora = en('2026-10-10', '20:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K6']);
  });

  it('si mandó algo hace menos de 30 minutos, la hora espera (no se le cruza una pregunta mientras cuenta)', () => {
    const c = ctx(estadoEn('K5', { tipo: 'seguir' }, {}, { diaHecho: '2026-10-09', ultimaEntrada: iso('2026-10-10', '17:50') }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
    expect(c.e.horaHecha).toBeNull();
    expect(proximoDespertar(c.e, c.ahora)).toEqual(en('2026-10-10', '18:20'));
    c.ahora = en('2026-10-10', '18:20');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K6']);
  });

  it('si ese día ya tuvo su principal o dijo "mañana", la hora no manda nada', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { diaHecho: '2026-10-10' }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
  });

  it('lo que esperaba un botón vence a la hora: seguir → la siguiente; "una más" → el cierre', () => {
    const c = ctx(estadoEn('K5', { tipo: 'seguir' }, {}, { diaHecho: '2026-10-09' }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K6']);
    const d = ctx(estadoEn('UNA-MAS-1', { tipo: 'una-mas' }, {}, { diaHecho: '2026-10-09' }), '2026-10-10', '18:00');
    alReloj(d);
    expect(ids(d.salidas)).toEqual(['CIERRE-1']);
  });

  it('no se acumulan: con una principal sin contestar, la hora no manda otra', () => {
    expect(bloqueante(estadoEn('K5', preg('K5')))).toBe(true);
    expect(bloqueante(estadoEn('K5', { tipo: 'seguir' }))).toBe(false);
    const c = ctx(estadoEn('K5', preg('K5'), {}, { diaHecho: '2026-10-09' }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
  });

  it('a la hora con la ventana cerrada: PREG-NUEVA-CHICO', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { diaHecho: '2026-10-08', ultimaEntrada: iso('2026-10-08', '18:30') }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-CHICO']);
  });

  it('de noche no corre nada', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, { hora: '21:30' }, { diaHecho: '2026-10-09' }), '2026-10-10', '22:10');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
  });
});

describe('kids v2: recordatorios al padre (4 y 8 días)', () => {
  it('canal A: RECORD-A-4 a los 4 días, RECORD-A-8 y marca a los 8; después nada', () => {
    const e = estadoEn('K5', preg('K5'), {}, { ultimaEntrada: iso('2026-10-06', '18:10') });
    const d3 = ctx(e, '2026-10-09', '18:00');
    alReloj(d3);
    expect(ids(d3.salidas)).toEqual([]);
    const d4 = ctx(d3.e, '2026-10-10', '18:00');
    alReloj(d4);
    expect(ids(d4.salidas)).toEqual(['RECORD-A-4']);
    expect(d4.salidas[0]).toMatchObject({ a: 'padre', plantilla: { nombre: 'kids_recordatorio_padre', variables: ['Laura', 'Bruno'] } });
    const d8 = ctx(d4.e, '2026-10-14', '18:00');
    alReloj(d8);
    expect(ids(d8.salidas)).toEqual(['RECORD-A-8', 'marca:silencio-8-dias']);
    const d12 = ctx(d8.e, '2026-10-18', '18:00');
    alReloj(d12);
    expect(ids(d12.salidas)).toEqual([]);
  });

  it('canal B: RECORD-B con [Estamos listos], que después vuelve a mandar la pendiente', () => {
    const c = ctx(estadoEn('K5', preg('K5'), { canal: 'B' }, { ultimaEntrada: iso('2026-10-06', '18:10') }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['RECORD-B']);
    expect(c.salidas[0]).toMatchObject({ botones: ['Estamos listos'] });
    expect(c.e.reenviar).toBe(true);
  });

  it('si nunca tocó [Dale, vamos], cuenta desde el arranque', () => {
    const c = ctx(estadoEn('K1', { tipo: 'bienvenida' }, {}, { cursor: -1, ultimaEntrada: null, inicio: iso('2026-10-06', '17:30') }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['RECORD-A-4']);
  });
});

describe('kids v2: el final por reloj', () => {
  it('sin respuesta a la oferta de extras, a los 2 días cierra solo (la ventana ya está cerrada: PREG-NUEVA)', () => {
    const e = estadoEn('EXTRAS', { tipo: 'extras-oferta' }, {}, { extrasDesde: iso('2026-10-08', '18:30'), ultimaEntrada: iso('2026-10-08', '18:29') });
    const d1 = ctx(e, '2026-10-09', '18:00');
    alReloj(d1);
    expect(ids(d1.salidas)).toEqual([]);
    const d2 = ctx(d1.e, '2026-10-10', '18:00');
    alReloj(d2);
    expect(ids(d2.salidas)).toEqual(['TERMINO-PADRE', 'PREG-NUEVA-CHICO']);
    expect(d2.e.fase).toMatchObject({ tipo: 'retenido', luego: { tipo: 'terminado' } });
  });

  it('canal B: TERMINO-PADRE sale al día siguiente, a la hora', () => {
    const c = ctx(estadoEn('FINAL', { tipo: 'terminado' }, { canal: 'B' }, { terminoPadre: '2026-10-11' }), '2026-10-11', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['TERMINO-PADRE']);
    expect(c.e.terminoPadre).toBeNull();
  });
});

describe('kids v2: proximoDespertar', () => {
  it('la ráfaga a los 90 s; si no, la hora de hoy o de mañana; nunca de noche', () => {
    const e = estadoEn('K5', preg('K5'), {}, { rafaga: { desde: iso('2026-10-10', '18:05'), ultima: iso('2026-10-10', '18:05'), seg: 60, palabras: 0, fotos: 0, textos: [] } });
    expect(proximoDespertar(e, en('2026-10-10', '18:05'))).toEqual(new Date(en('2026-10-10', '18:05').getTime() + 90_000));
    const libre = estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { horaHecha: '2026-10-10' });
    expect(proximoDespertar(libre, en('2026-10-10', '19:00'))).toEqual(en('2026-10-11', '18:00'));
    const tarde = estadoEn('K5', preg('K5'), {}, { rafaga: { desde: iso('2026-10-10', '21:59'), ultima: iso('2026-10-10', '21:59'), seg: 60, palabras: 0, fotos: 0, textos: [] } });
    expect(proximoDespertar(tarde, en('2026-10-10', '21:59'))).toEqual(en('2026-10-11', '09:00'));
    expect(proximoDespertar(estadoEn('FINAL', { tipo: 'terminado' }), en('2026-10-10', '19:00'))).toBeNull();
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-reloj.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/motor/reloj.js`.

- [ ] **Step 3: Implementar**

`fabrica/src/kids-v2/motor/reloj.ts`:
```ts
// El tiempo: los 90 s de silencio, la espera del audio de la foto, "la hora"
// (mínimo una principal por día), los recordatorios al padre (4 y 8 días),
// el cierre solo a los 2 días y TERMINO-PADRE en canal B. Nada de noche.

import { aInstante, aLocal, diasEntre, esDeNoche, finDeLaNoche, sumarDias } from '../horas.js';
import { ACTIVO_MS, CIERRE_SOLO_DIAS, ESPERA_AUDIO_FOTO_MS, RECORDATORIO_DIAS, SILENCIO_MS } from '../reglas.js';
import { emitir, empezarItem, hoy, marcar, terminarItem, type Ctx } from './flujo.js';
import { fijoA, variables } from './mensajes.js';
import { procesarRafaga } from './rafaga.js';
import type { Estado } from './tipos.js';

const ms = (iso: string) => new Date(iso).getTime();

/** Esperando algo que solo puede mandar el chico: a la hora no sale nada nuevo (no se acumulan). */
export function bloqueante(e: Estado): boolean {
  const f = e.fase;
  if (f.tipo === 'bienvenida' || f.tipo === 'aviso-seria' || f.tipo === 'retenido') return true;
  if (f.tipo === 'pregunta') {
    const item = e.guion[e.cursor];
    return !e.extra && (item.tipo === 'principal' || item.tipo === 'padre');
  }
  return false;
}

export function alReloj(c: Ctx): void {
  const e = c.e;
  if (esDeNoche(c.ahora, e.ficha.zona)) return;
  if (e.rafaga && c.ahora.getTime() - ms(e.rafaga.ultima) >= SILENCIO_MS) procesarRafaga(c);
  if (e.fase.tipo === 'foto-audio' && c.ahora.getTime() - ms(e.fase.desde) >= ESPERA_AUDIO_FOTO_MS) terminarItem(c);
  if (e.rafaga) return; // está contando: la hora espera
  const fecha = hoy(c);
  if (e.horaHecha === fecha || c.ahora < aInstante(fecha, e.ficha.hora, e.ficha.zona)) return;
  if (e.ultimaEntrada && c.ahora.getTime() - ms(e.ultimaEntrada) < ACTIVO_MS) return; // está en medio de algo: la hora espera
  e.horaHecha = fecha;
  alaHora(c);
}

function recordatorio(c: Ctx): void {
  const e = c.e;
  const desde = e.ultimaEntrada ?? e.inicio;
  if (!desde) return;
  const dias = diasEntre(aLocal(new Date(desde), e.ficha.zona).fecha, hoy(c));
  const B = e.ficha.canal === 'B';
  const vars = variables.padre(e.ficha);
  if (e.recordatorios === 0 && dias >= RECORDATORIO_DIAS[0]) {
    emitir(c, fijoA(e, B ? 'RECORD-B' : 'RECORD-A-4', { variables: vars, paraPadre: true }));
    e.recordatorios = 1;
    e.reenviar = B;
  } else if (e.recordatorios === 1 && dias >= RECORDATORIO_DIAS[1]) {
    emitir(c, fijoA(e, B ? 'RECORD-B-8' : 'RECORD-A-8', { variables: vars, paraPadre: true }));
    e.reenviar = B;
    marcar(c, 'silencio-8-dias', `${dias} días sin respuesta en ${e.guion[e.cursor]?.clave ?? 'la bienvenida'}`);
    e.recordatorios = 2;
  }
}

function alaHora(c: Ctx): void {
  const e = c.e;
  const fecha = hoy(c);
  if (e.terminoPadre && e.terminoPadre <= fecha) {
    emitir(c, fijoA(e, 'TERMINO-PADRE', { variables: variables.padre(e.ficha), paraPadre: true }));
    e.terminoPadre = null;
  }
  if (e.fase.tipo === 'terminado' || e.fase.tipo === 'sin-empezar') return;
  const item = e.guion[e.cursor];
  if (item?.tipo === 'final') return;
  if (item?.tipo === 'extras') {
    const desde = Math.max(...[e.extrasDesde, e.ultimaEntrada].filter((x): x is string => x !== null).map(ms));
    if (diasEntre(aLocal(new Date(desde), e.ficha.zona).fecha, fecha) >= CIERRE_SOLO_DIAS) empezarItem(c, e.cursor + 1, true);
    return;
  }
  if (bloqueante(e)) return recordatorio(c);
  if (e.diaHecho === fecha) return;
  empezarItem(c, e.fase.tipo === 'libre' ? e.fase.siguiente : e.cursor + 1, true);
}

/** Cuándo hay que volver a llamar con `reloj` (null: nada pendiente). Nunca de noche. */
export function proximoDespertar(e: Estado, ahora: Date): Date | null {
  const z = e.ficha.zona;
  const c: Date[] = [];
  if (e.nocturnos.length) c.push(ahora);
  if (e.rafaga) c.push(new Date(ms(e.rafaga.ultima) + SILENCIO_MS));
  if (e.fase.tipo === 'foto-audio') c.push(new Date(ms(e.fase.desde) + ESPERA_AUDIO_FOTO_MS));
  const sigueLaHora = !(e.fase.tipo === 'terminado' && !e.terminoPadre) && e.fase.tipo !== 'sin-empezar';
  if (sigueLaHora && !e.rafaga) {
    const fecha = aLocal(ahora, z).fecha;
    const hoyHora = aInstante(fecha, e.ficha.hora, z);
    const hora = e.horaHecha !== fecha ? hoyHora : aInstante(sumarDias(fecha, 1), e.ficha.hora, z);
    const activo = e.ultimaEntrada ? ms(e.ultimaEntrada) + ACTIVO_MS : 0;
    c.push(new Date(Math.max(hora.getTime(), activo, ahora.getTime())));
  }
  if (!c.length) return null;
  const t = new Date(Math.min(...c.map((x) => finDeLaNoche(x, z).getTime())));
  return t < ahora ? ahora : t;
}
```

- [ ] **Step 4: Correr los tests**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p .
```
Esperado: PASS (15 nuevos), `tsc` sin errores.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/motor/reloj.ts fabrica/test/kids-v2-reloj.test.ts
git commit -m "$(cat <<'EOF'
kids v2: motor, parte 5: los relojes (90 s, la hora, no se acumulan, recordatorios al padre, cierre solo a los 2 días)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 10: Motor, parte 6 · `paso()`: arranque, noche y panel

**Files:**
- Create: `fabrica/src/kids-v2/motor.ts`
- Test: `fabrica/test/kids-v2-motor.test.ts`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces (la puerta de entrada para quien conecte): `nuevoEstado(ficha)`, `paso(estado, evento, ahora: string /* ISO */): { estado: Estado; salidas: Salida[] }`, `proximoDespertar(estado, ahora: Date)`, y re-exporta los tipos `Contenido`, `Estado`, `Evento`, `Fase`, `Mensaje`, `Salida`.

Reglas: `paso` clona el estado (puro); el arranque por canal (BIEN-CHICO o -PL + AVISO-PADRE; BIEN-PADRE), apenas paga si es de día y si no a las 9 (#37); todo lo que llega de noche se guarda y se procesa a las 9; un botón con una ráfaga abierta primero cierra la ráfaga; cambios del panel (#34).

- [ ] **Step 1: Escribir el test que falla**

`fabrica/test/kids-v2-motor.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { nuevoEstado, paso, type Estado, type Evento, type Salida } from '../src/kids-v2/motor.js';
import { FICHA, ids, iso } from './kids-v2-ayuda.js';

/** Aplica eventos en orden; cada uno con su hora de Buenos Aires. Devuelve el estado y todas las salidas. */
function correr(e: Estado, pasos: [fecha: string, hora: string, ev: Evento][]): { e: Estado; s: Salida[] } {
  const s: Salida[] = [];
  for (const [fecha, hora, ev] of pasos) {
    const r = paso(e, ev, iso(fecha, hora));
    e = r.estado;
    s.push(...r.salidas);
  }
  return { e, s };
}
const RELOJ: Evento = { tipo: 'reloj' };
const audio = (seg: number): Evento => ({ tipo: 'respuesta', contenido: { tipo: 'audio', seg } });
const toca = (boton: string): Evento => ({ tipo: 'boton', boton });

describe('kids v2: paso() es puro', () => {
  it('no toca el estado que recibe y es determinístico', () => {
    const e = nuevoEstado(FICHA);
    const copia = structuredClone(e);
    const a = paso(e, { tipo: 'inicio' }, iso('2026-10-06', '17:30'));
    const b = paso(e, { tipo: 'inicio' }, iso('2026-10-06', '17:30'));
    expect(e).toEqual(copia);
    expect(a).toEqual(b);
  });
});

describe('kids v2: el arranque', () => {
  it('canal A: BIEN-CHICO al chico y AVISO-PADRE al padre; [Dale, vamos] → ENTRADA-1 y K1', () => {
    const { e, s } = correr(nuevoEstado(FICHA), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
    ]);
    expect(ids(s)).toEqual(['BIEN-CHICO', 'AVISO-PADRE', 'ENTRADA-1', 'K1']);
    expect(s.map((x) => (x.tipo === 'mensaje' ? x.a : '-'))).toEqual(['chico', 'padre', 'chico', 'chico']);
    expect(e.fase).toEqual({ tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 });
  });

  it('plural: "Tus abuelos" → BIEN-CHICO-PL', () => {
    const { s } = correr(nuevoEstado({ ...FICHA, quienRegala: 'Tus abuelos' }), [['2026-10-06', '17:30', { tipo: 'inicio' }]]);
    expect(ids(s)).toEqual(['BIEN-CHICO-PL', 'AVISO-PADRE']);
  });

  it('canal B: solo BIEN-PADRE; [Estamos listos] → ENTRADA-1 y K1, al número del padre', () => {
    const { s } = correr(nuevoEstado({ ...FICHA, canal: 'B' }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '20:00', toca('Estamos listos')],
    ]);
    expect(ids(s)).toEqual(['BIEN-PADRE', 'ENTRADA-1', 'K1']);
    expect(s.every((x) => x.tipo === 'mensaje' && x.a === 'padre')).toBe(true);
  });

  it('si paga de noche, la bienvenida sale a las 9 (#37); un segundo inicio no hace nada', () => {
    const { e, s } = correr(nuevoEstado(FICHA), [
      ['2026-10-06', '23:30', { tipo: 'inicio' }],
      ['2026-10-06', '23:31', { tipo: 'inicio' }],
      ['2026-10-07', '08:59', RELOJ],
    ]);
    expect(ids(s)).toEqual([]);
    const r = paso(e, RELOJ, iso('2026-10-07', '09:00'));
    expect(ids(r.salidas)).toEqual(['BIEN-CHICO', 'AVISO-PADRE']);
    expect(ids(paso(r.estado, { tipo: 'inicio' }, iso('2026-10-07', '10:00')).salidas)).toEqual([]);
  });
});

describe('kids v2: un día típico, de punta a punta', () => {
  it('respuesta → (90 s) acuse y foto → foto → acuse de foto y seguir → [Dale, otra] → K2', () => {
    const { s } = correr(nuevoEstado(FICHA), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
      ['2026-10-06', '18:00', audio(40)],
      ['2026-10-06', '18:00', audio(30)],
      ['2026-10-06', '18:01', RELOJ],
      ['2026-10-06', '18:02', RELOJ],
      ['2026-10-06', '18:05', { tipo: 'respuesta', contenido: { tipo: 'foto' } }],
      ['2026-10-06', '18:07', RELOJ],
      ['2026-10-06', '18:08', toca('Dale, otra')],
    ]);
    expect(ids(s)).toEqual(['BIEN-CHICO', 'AVISO-PADRE', 'ENTRADA-1', 'K1', 'ACUSE-1', 'K1-FOTO', 'ACUSE-FOTO-1', 'B-SEGUIR', 'K2']);
  });

  it('un botón que llega con una ráfaga abierta: primero se contesta la ráfaga', () => {
    const { s } = correr(nuevoEstado(FICHA), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
      ['2026-10-06', '18:00', audio(40)],
      ['2026-10-06', '18:00', toca('Paso')],
    ]);
    expect(ids(s).slice(4)).toEqual(['ACUSE-1', 'K1-FOTO']);
  });
});

describe('kids v2: nada de noche', () => {
  it('lo que llega de noche se contesta a las 9; [Mañana sigo] de noche no dice "ya está por hoy" a la mañana', () => {
    const base = correr(nuevoEstado({ ...FICHA, hora: '21:00' }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '21:00', toca('Dale, vamos')],
    ]);
    const noche = correr(base.e, [
      ['2026-10-06', '22:30', audio(60)],
      ['2026-10-06', '22:35', RELOJ],
      ['2026-10-07', '01:00', RELOJ],
    ]);
    expect(ids(noche.s)).toEqual([]);
    const manana = correr(noche.e, [
      ['2026-10-07', '09:00', RELOJ],
      ['2026-10-07', '09:02', RELOJ],
    ]);
    expect(ids(manana.s)).toEqual(['ACUSE-1', 'K1-FOTO']);
    const mas = correr(manana.e, [
      ['2026-10-07', '09:05', { tipo: 'respuesta', contenido: { tipo: 'foto' } }],
      ['2026-10-07', '09:07', RELOJ],
      ['2026-10-07', '23:00', toca('Mañana sigo')],
      ['2026-10-08', '09:00', RELOJ],
    ]);
    expect(ids(mas.s)).toEqual(['ACUSE-FOTO-1', 'B-SEGUIR']);
    expect(mas.e.fase).toMatchObject({ tipo: 'libre' });
    expect(ids(paso(mas.e, RELOJ, iso('2026-10-08', '21:00')).salidas)).toEqual(['K2']);
  });
});

describe('kids v2: cambios desde el panel (#34)', () => {
  const empezado = () =>
    correr(nuevoEstado({ ...FICHA, preguntasPadre: [{ texto: 'Una', conLinea: true }] }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
    ]).e;

  it('la hora y los temas de lo que todavía no salió se pueden cambiar', () => {
    const e = paso(empezado(), { tipo: 'ficha', cambios: { hora: '19:30', temasSacados: ['mama'] } }, iso('2026-10-06', '18:00')).estado;
    expect(e.ficha.hora).toBe('19:30');
    expect(e.guion.map((x) => x.clave)).not.toContain('K10');
    expect(e.guion[e.cursor].clave).toBe('K1');
  });

  it('las preguntas del padre, hasta que empieza el cap. 4; después ya no', () => {
    const e = paso(empezado(), { tipo: 'ficha', cambios: { preguntasPadre: [{ texto: 'Otra', conLinea: false }] } }, iso('2026-10-06', '18:00')).estado;
    expect(e.guion.find((x) => x.clave === 'PADRE-1')).toMatchObject({ texto: 'Otra', conLinea: false });
    const enCap4 = { ...e, cursor: e.guion.findIndex((x) => x.clave === 'K31') };
    const f = paso(enCap4, { tipo: 'ficha', cambios: { preguntasPadre: [] } }, iso('2026-10-20', '18:00')).estado;
    expect(f.guion.find((x) => x.clave === 'PADRE-1')).toMatchObject({ texto: 'Otra' });
  });

  it('sacar el tema de lo que se está preguntando ahora no hace nada (ya salió)', () => {
    const e = empezado();
    const enK10 = { ...e, cursor: e.guion.findIndex((x) => x.clave === 'K10') };
    const f = paso(enK10, { tipo: 'ficha', cambios: { temasSacados: ['mama'] } }, iso('2026-10-10', '18:00')).estado;
    expect(f.guion).toEqual(enK10.guion);
    expect(f.ficha.temasSacados).toEqual([]);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-motor.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/motor.js`.

- [ ] **Step 3: Implementar**

`fabrica/src/kids-v2/motor.ts`:
```ts
// El motor de Vitácora Kids V2 («Mi Primer Capítulo»): una máquina de estados
// pura. paso(estado, evento, ahora) → { estado, salidas }. Sin I/O, sin
// modelos de IA: los textos salen de banco.json (banco.md + mensajes.md).
//
// Quien lo conecte a WhatsApp (Joaquín): guarda el estado, manda las salidas
// (mensaje → texto o plantilla, al número del chico o del padre; marca → panel
// de Naza) y llama `reloj` en proximoDespertar() (o cada minuto).

import { armarGuion, validarFicha } from './compra.js';
import { esDeNoche, esHora } from './horas.js';
import { emitir, type Ctx } from './motor/flujo.js';
import { alBoton } from './motor/botones.js';
import { fijoA, variables } from './motor/mensajes.js';
import { procesarRafaga, sumarARafaga } from './motor/rafaga.js';
import { alReloj } from './motor/reloj.js';
import type { Estado, Evento, Salida } from './motor/tipos.js';
import { esPlural } from './texto.js';

export { nuevoEstado } from './motor/estado.js';
export { proximoDespertar } from './motor/reloj.js';
export type { Contenido, Estado, Evento, Fase, Mensaje, Salida } from './motor/tipos.js';

export function paso(estado: Estado, evento: Evento, ahora: string): { estado: Estado; salidas: Salida[] } {
  const c: Ctx = { e: structuredClone(estado), ahora: new Date(ahora), salidas: [], replay: false };
  aplicar(c, evento);
  return { estado: c.e, salidas: c.salidas };
}

function aplicar(c: Ctx, ev: Evento): void {
  const e = c.e;
  const noche = esDeNoche(c.ahora, e.ficha.zona) && !c.replay;
  switch (ev.tipo) {
    case 'inicio':
      if (e.fase.tipo !== 'sin-empezar' || e.nocturnos.some((x) => x.tipo === 'inicio')) return;
      if (noche) return void e.nocturnos.push(ev);
      return arrancar(c);
    case 'respuesta':
      if (!c.replay) entro(c);
      if (noche) return void e.nocturnos.push(ev);
      return sumarARafaga(c, ev.contenido);
    case 'boton':
      if (!c.replay) entro(c);
      if (noche) return void e.nocturnos.push(ev);
      if (e.rafaga) procesarRafaga(c);
      return alBoton(c, ev.boton);
    case 'reloj':
      if (noche) return;
      if (e.nocturnos.length) {
        const guardados = e.nocturnos;
        e.nocturnos = [];
        c.replay = true;
        for (const g of guardados) aplicar(c, g);
        c.replay = false;
      }
      return alReloj(c);
    case 'ficha':
      return cambiarFicha(c, ev.cambios);
  }
}

/** Llegó algo del número de las preguntas: abre la ventana de 24 h y corta el silencio. */
function entro(c: Ctx): void {
  c.e.ultimaEntrada = c.ahora.toISOString();
  c.e.recordatorios = 0;
}

/** El arranque (flujo-vigente.md §2; #37: apenas paga, entre las 9 y las 22). */
function arrancar(c: Ctx): void {
  const e = c.e;
  e.inicio = c.ahora.toISOString();
  const f = e.ficha;
  if (f.canal === 'A') {
    emitir(c, fijoA(e, esPlural(f.quienRegala) ? 'BIEN-CHICO-PL' : 'BIEN-CHICO', { variables: variables.chico(f) }));
    emitir(c, fijoA(e, 'AVISO-PADRE', { variables: variables.avisoPadre(f), paraPadre: true }));
  } else emitir(c, fijoA(e, 'BIEN-PADRE', { variables: variables.padre(f) }));
  e.fase = { tipo: 'bienvenida' };
}

/**
 * El padre cambia algo en el panel (#34). La hora, siempre. Los temas, solo
 * para lo que todavía no salió. Sus preguntas, hasta que empieza el cap. 4.
 * Lo que ya pasó no se toca.
 */
function cambiarFicha(c: Ctx, cambios: Extract<Evento, { tipo: 'ficha' }>['cambios']): void {
  const e = c.e;
  if (cambios.hora !== undefined && esHora(cambios.hora)) e.ficha = validarFicha({ ...e.ficha, hora: cambios.hora });
  const actual = e.guion[e.cursor];
  const empezoCap4 = actual !== undefined && actual.cap >= 4;
  const nueva = validarFicha({
    ...e.ficha,
    temasSacados: cambios.temasSacados ?? e.ficha.temasSacados,
    preguntasPadre: cambios.preguntasPadre && !empezoCap4 ? cambios.preguntasPadre : e.ficha.preguntasPadre,
  });
  const guion = armarGuion(nueva);
  if (!actual) {
    e.ficha = nueva;
    e.guion = guion;
    return;
  }
  const j = guion.findIndex((x) => x.clave === actual.clave);
  if (j < 0) return; // sacó el tema de lo que se está preguntando ahora: ya salió, no se toca
  e.ficha = nueva;
  e.guion = [...e.guion.slice(0, e.cursor + 1), ...guion.slice(j + 1)];
}
```

- [ ] **Step 4: Correr los tests**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p .
```
Esperado: PASS (11 nuevos; 117 en kids-v2 al cerrar esta tarea), `tsc` sin errores.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/motor.ts fabrica/test/kids-v2-motor.test.ts
git commit -m "$(cat <<'EOF'
kids v2: motor, parte 6: paso() puro, arranque por canal, nada de noche y cambios desde el panel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 11: Algo preocupante

**Files:**
- Create: `fabrica/src/kids-v2/preocupante.ts`, `fabrica/src/kids-v2/motor/sobrio.ts`
- Modify: `fabrica/src/kids-v2/motor/rafaga.ts` (imports y 3 líneas después del chequeo de `terminado`), `fabrica/src/kids-v2/motor/botones.ts` (import y 1 línea al principio de `alBoton`), `fabrica/src/kids-v2/motor/reloj.ts` (2 líneas en `alaHora`)
- Test: `fabrica/test/kids-v2-preocupante.test.ts`

**Interfaces:**
- Consumes: `aInstante`, `sumarDias` (3); `acuseSobrio`, `hoy`, `marcar`, `Ctx` (6); `Fase` (5).
- Produces: `FRASES_PREOCUPANTES`, `normalizar(s)`, `fraseQueSalta(texto): string | null` (`preocupante.ts`); `enDiaSobrio(c)`, `alPreocupante(c, frase)` (`motor/sobrio.ts`).

Regla (Naza, 05/10): una lista de palabras en el código, sin modelo. Si salta (en un texto o en la transcripción de un audio), ese día solo un acuse sobrio (los del día feo), sin foto ni seguir, y marca a Naza. Nada automático hacia los padres. **La lista es un borrador para que la apruebe Naza** (ver Decisiones 16 y 17).

- [ ] **Step 1: Escribir el test que falla**

`fabrica/test/kids-v2-preocupante.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FRASES_PREOCUPANTES, fraseQueSalta, normalizar } from '../src/kids-v2/preocupante.js';
import { alBoton } from '../src/kids-v2/motor/botones.js';
import { procesarRafaga, sumarARafaga } from '../src/kids-v2/motor/rafaga.js';
import { alReloj } from '../src/kids-v2/motor/reloj.js';
import { ctx, en, estadoEn, ids, iso } from './kids-v2-ayuda.js';

const PREOCUPANTE = { tipo: 'audio' as const, seg: 70, transcripcion: 'y encima mi primo me pegó cuando nadie miraba' };

describe('kids v2: la lista de palabras', () => {
  it('compara sin mayúsculas ni tildes y por palabras enteras', () => {
    expect(normalizar('¡Me PEGÓ!')).toBe(' me pego ');
    expect(fraseQueSalta('Mi primo ME PEGÓ ayer')).toBe('me pegó');
    expect(fraseQueSalta('me pegaron en el recreo')).toBe('me pegaron');
    expect(fraseQueSalta('a veces me quiero morir')).toBe('me quiero morir');
    expect(fraseQueSalta('me pegue un golpe en la rodilla')).toBeNull(); // "me pegué" no es "me pegó"
    expect(fraseQueSalta('me toca lavar los platos')).toBeNull();
    expect(fraseQueSalta('jugamos a la mancha')).toBeNull();
  });

  it('ninguna frase de la lista está vacía ni repetida', () => {
    const norm = FRASES_PREOCUPANTES.map(normalizar);
    expect(norm.every((f) => f.trim().length > 0)).toBe(true);
    expect(new Set(norm).size).toBe(norm.length);
  });
});

describe('kids v2: algo preocupante en el momento', () => {
  it('ese día solo un acuse sobrio, sin foto ni seguir, y marca a Naza', () => {
    const c = ctx(estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }));
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante']);
    expect(c.salidas[1]).toMatchObject({ detalle: '"me pegó" en K1' });
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: c.e.cursor + 1 });
    expect(c.e.diaHecho).toBe('2026-10-10');
  });

  it('el resto del día: lo que cuente recibe solo el acuse sobrio; los botones no hacen nada', () => {
    const c = ctx(estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }));
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    sumarARafaga(c, { tipo: 'audio', seg: 40 });
    procesarRafaga(c);
    alBoton(c, 'Dale, otra');
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante', 'B-DIAFEO-ACUSE-2']);
  });

  it('al otro día, a la hora, sigue con la siguiente', () => {
    const c = ctx(estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }, {}, { ultimaEntrada: iso('2026-10-10', '18:05') }));
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    c.ahora = en('2026-10-11', '18:00');
    alReloj(c);
    expect(ids(c.salidas).slice(2)).toEqual(['K2']);
    expect(c.e.sobrioHasta).toBeNull();
  });

  it('en un texto escrito también salta; nada automático hacia el padre', () => {
    const c = ctx(estadoEn('K36', { tipo: 'pregunta', clave: 'K36', rama: null, pasoRama: 0 }));
    sumarARafaga(c, { tipo: 'texto', texto: 'en casa me pegan' });
    procesarRafaga(c);
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante']);
    expect(c.salidas.some((s) => s.tipo === 'mensaje' && s.a === 'padre')).toBe(false);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-preocupante.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/preocupante.js`.

- [ ] **Step 3: La lista**

`fabrica/src/kids-v2/preocupante.ts`:
```ts
// "Algo preocupante" en el momento (paso-4-huecos-decisiones.md, Naza 05/10):
// una lista de palabras en el código, sin modelo. Si salta, ese día solo un
// acuse sobrio (los del día feo), sin foto ni "seguir", y marca a Naza. Nada
// automático hacia los padres. Al final el escritor marca igual.
//
// LA LISTA ES UN PUNTO DE PARTIDA: la aprueba Naza (y el abogado). Se compara
// sin mayúsculas ni tildes y por palabras enteras ("me pegó" = "me pego").

export const FRASES_PREOCUPANTES: readonly string[] = [
  'me pega', 'me pegan', 'me pegó', 'me pegaron', 'me pegaba', 'me pegaban',
  'me lastima', 'me lastiman', 'me lastimó', 'me lastimaron',
  'me manosea', 'me manosean', 'me toca ahí', 'me tocó ahí',
  'abuso', 'abusaron',
  'me amenaza', 'me amenazan', 'me amenazaron',
  'me encierra', 'me encierran',
  'me quiero morir', 'quiero morirme', 'no quiero vivir', 'me quiero matar', 'matarme',
  'suicidarme', 'suicidio', 'me corto', 'cortarme',
  'tengo miedo de volver a casa', 'no quiero volver a mi casa',
  'nadie me quiere',
];

export function normalizar(s: string): string {
  const t = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return ` ${t} `;
}

const FRASES = FRASES_PREOCUPANTES.map(normalizar);

/** La primera frase de la lista que aparece en el texto, o null. */
export function fraseQueSalta(texto: string): string | null {
  const t = normalizar(texto);
  const i = FRASES.findIndex((f) => t.includes(f));
  return i < 0 ? null : FRASES_PREOCUPANTES[i];
}
```

- [ ] **Step 4: El día sobrio**

`fabrica/src/kids-v2/motor/sobrio.ts`:
```ts
// Algo preocupante (paso-4-huecos-decisiones.md, Naza 05/10): si salta la
// lista de palabras, ese día solo un acuse sobrio (los del día feo), nada más
// (ni foto, ni seguir, ni botones), y marca a Naza. "Ese día" dura hasta la
// hora del día siguiente; ahí sigue con lo que tocaba.

import { aInstante, sumarDias } from '../horas.js';
import { acuseSobrio, hoy, marcar, type Ctx } from './flujo.js';
import type { Fase } from './tipos.js';

export const enDiaSobrio = (c: Ctx): boolean => c.e.sobrioHasta !== null && c.ahora < new Date(c.e.sobrioHasta);

/** Qué item sale a la hora del día siguiente (null: no se toca la fase). */
function siguienteDespuesDeSobrio(fase: Fase, cursor: number, enExtras: boolean): number | null {
  if (fase.tipo === 'terminado' || fase.tipo === 'sin-empezar') return null;
  if (fase.tipo === 'libre') return fase.siguiente;
  if (fase.tipo === 'bienvenida') return 0;
  if (enExtras || fase.tipo === 'aviso-seria' || fase.tipo === 'retenido') return cursor;
  return cursor + 1;
}

export function alPreocupante(c: Ctx, frase: string): void {
  const e = c.e;
  acuseSobrio(c);
  marcar(c, 'preocupante', `"${frase}" en ${e.guion[e.cursor]?.clave ?? 'el arranque'}`);
  e.sobrioHasta = aInstante(sumarDias(hoy(c), 1), e.ficha.hora, e.ficha.zona).toISOString();
  e.diaHecho = hoy(c);
  const item = e.guion[e.cursor];
  if (item?.tipo === 'final') return;
  const sig = siguienteDespuesDeSobrio(e.fase, e.cursor, item?.tipo === 'extras');
  if (sig === null) return;
  e.extra = null;
  e.fase = { tipo: 'libre', siguiente: sig };
}
```

- [ ] **Step 5: Conectarlo en `motor/rafaga.ts`**

Reemplazar los imports:

```ts
import { pregunta } from '../banco.js';
import { CORTO_AUDIO_SEG, CORTO_PALABRAS } from '../reglas.js';
import { acusar, acuseFoto, emitir, empezarItem, fotoOTerminar, marcar, soltarRetenido, terminarItem, type Ctx } from './flujo.js';
import { opMsg, ramaMsg } from './mensajes.js';
import type { Contenido } from './tipos.js';
```

por:

```ts
import { pregunta } from '../banco.js';
import { fraseQueSalta } from '../preocupante.js';
import { CORTO_AUDIO_SEG, CORTO_PALABRAS } from '../reglas.js';
import { acusar, acuseFoto, acuseSobrio, emitir, empezarItem, fotoOTerminar, marcar, soltarRetenido, terminarItem, type Ctx } from './flujo.js';
import { opMsg, ramaMsg } from './mensajes.js';
import { alPreocupante, enDiaSobrio } from './sobrio.js';
import type { Contenido } from './tipos.js';
```

y en `procesarRafaga`, reemplazar:

```ts
  if (f.tipo === 'terminado') return marcar(c, 'escribio-despues-del-final', `${r.seg} s de audio, ${r.palabras} palabras, ${r.fotos} fotos`);

  switch (f.tipo) {
```

por:

```ts
  if (f.tipo === 'terminado') return marcar(c, 'escribio-despues-del-final', `${r.seg} s de audio, ${r.palabras} palabras, ${r.fotos} fotos`);

  if (enDiaSobrio(c)) return acuseSobrio(c);
  const frase = r.textos.map(fraseQueSalta).find((x) => x !== null);
  if (frase) return alPreocupante(c, frase);

  switch (f.tipo) {
```

- [ ] **Step 6: Conectarlo en `motor/botones.ts`**

Después de `import { extraMsg, fijoA, padreMsgs, preguntaMsg, ramaMsg } from './mensajes.js';` agregar:

```ts
import { enDiaSobrio } from './sobrio.js';
```

y en `alBoton`, reemplazar:

```ts
  const e = c.e;
  const f = e.fase;
  if (e.ficha.canal === 'B' && boton === 'Estamos listos') return estamosListos(c);
```

por:

```ts
  const e = c.e;
  const f = e.fase;
  if (enDiaSobrio(c)) return;
  if (e.ficha.canal === 'B' && boton === 'Estamos listos') return estamosListos(c);
```

- [ ] **Step 7: Conectarlo en `motor/reloj.ts`**

En `alaHora`, reemplazar:

```ts
  const fecha = hoy(c);
  if (e.terminoPadre && e.terminoPadre <= fecha) {
```

por:

```ts
  const fecha = hoy(c);
  if (e.sobrioHasta && c.ahora >= new Date(e.sobrioHasta)) e.sobrioHasta = null;
  if (e.terminoPadre && e.terminoPadre <= fecha) {
```

y reemplazar:

```ts
  if (e.diaHecho === fecha) return;
```

por:

```ts
  if (e.sobrioHasta || e.diaHecho === fecha) return;
```

- [ ] **Step 8: Correr los tests**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p .
```
Esperado: PASS (6 nuevos; 123 en kids-v2), `tsc` sin errores.

- [ ] **Step 9: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/preocupante.ts fabrica/src/kids-v2/motor/sobrio.ts fabrica/src/kids-v2/motor/rafaga.ts fabrica/src/kids-v2/motor/botones.ts fabrica/src/kids-v2/motor/reloj.ts fabrica/test/kids-v2-preocupante.test.ts
git commit -m "$(cat <<'EOF'
kids v2: algo preocupante (lista de palabras, borrador para Naza): ese día solo acuse sobrio, sin foto ni seguir, y marca a Naza

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 12: La lectura corrida

**Files:**
- Create: `fabrica/src/kids-v2/corrida.ts`, `fabrica/src/kids-v2/lectura.ts`, `fabrica/scripts/kids-v2-lectura.ts`
- Create (generado): `docs/kids/v2/lectura-corrida.md`
- Test: `fabrica/test/kids-v2-lectura.test.ts`

**Interfaces:**
- Consumes: `nuevoEstado`, `paso`, `proximoDespertar`, tipos de `motor.ts` (10); `horas.ts` (3); `Ficha` (4).
- Produces: `corrida.ts`: `type Accion = { trasMs; evento; dice }`, `type Conducta = (llegaron: Mensaje[], ctx: { estado; ahora; todo }) => Accion[]`, `type Linea` (`bot` | `chico` | `marca`), `type Corrida = { lineas; estado; pasos }`, `correr(ficha, conducta, { desde, dias }): Corrida` (tira error si el motor pide reloj otra vez en el mismo instante sin cambiar nada: se trabaría). `lectura.ts`: `FICHA_LECTURA`, `DESDE_LECTURA`, `chicaDeLaLectura()`, `corridaDeLaLectura()`, `lecturaCorrida(): string`.

La chica inventada (Tini, 11, se lo regalan sus abuelos, canal A, a las 18:00 de Buenos Aires, la mamá sacó el tema papá y escribió dos preguntas, una sin decir que es suya) pasa por: otra puerta, escrito, [No tengo] con audio, [Paso], las dos preguntas de "No tengo hermanos", la foto del deporte mudada a K16 con [No hago], un fin de semana que dispara PREG-NUEVA-CHICO, cinco días callada (RECORD-A-4), [Sí, hay algo] en un cierre, [Hoy no la como], algo preocupante en K37, [Mañana mejor] en el aviso, el día feo con la tranquila, las dos preguntas de la mamá, la cápsula, dos extras y el final.

- [ ] **Step 1: Escribir el test que falla**

`fabrica/test/kids-v2-lectura.test.ts` (que la lectura no rompe ningún control se prueba en la tarea 13, cuando existan los controles):

```ts
import { describe, it, expect } from 'vitest';
import { corridaDeLaLectura, FICHA_LECTURA, lecturaCorrida } from '../src/kids-v2/lectura.js';

const md = lecturaCorrida();
const corrida = corridaDeLaLectura();

describe('kids v2: lectura corrida (una chica inventada)', () => {
  it('es la chica pedida: Tini, canal A, se lo regalan sus abuelos, sin el tema papá, dos preguntas de la mamá', () => {
    expect(FICHA_LECTURA).toMatchObject({ apodo: 'Tini', genero: 'chica', canal: 'A', quienRegala: 'Tus abuelos', temasSacados: ['papa'] });
    expect(FICHA_LECTURA.preguntasPadre.map((p) => p.conLinea)).toEqual([true, false]);
  });

  it('llega al final', () => {
    expect(corrida.estado.fase).toEqual({ tipo: 'terminado' });
  });

  it('no queda ninguna marca sin llenar y habla en femenino', () => {
    expect(md).not.toContain('{{');
    expect(md).toContain('Empezamos por cuando eras más chica.');
  });

  it('aparece todo lo que tiene que aparecer', () => {
    for (const id of [
      'BIEN-CHICO-PL', 'AVISO-PADRE', 'ENTRADA-1', 'ENTRADA-2', 'ENTRADA-3', 'ENTRADA-4', 'ENTRADA-5',
      'K2-OP', 'B-FOTO-NOTENGO', 'B-PASO', 'K12-R2', 'K12-R2-2', 'K13-R1', 'B-NO-PASA-NADA', 'K11-FOTO',
      'PREG-NUEVA-CHICO', 'RECORD-A-4', 'K20-R1', 'B-UNA-MAS', 'CIERRE-1', 'CIERRE-2', 'CIERRE-3', 'CIERRE-4',
      'B-AVISO-SERIA', 'K39', 'B-DIAFEO-ACUSE-1', 'B-TRANQUILA', 'B-MAÑANA', 'PADRE-PREG-LINEA-PL', 'PADRE-1', 'PADRE-2',
      'CIERRE-FINAL', 'EXTRAS-OFERTA', 'EXTRAS-SI', 'EXTRAS-OTRA', 'FINAL-CHICO-PL', 'TERMINO-PADRE',
    ]) {
      expect(md, id).toContain(`\`${id}\``);
    }
    expect(md).not.toContain('`K11`'); // la mamá sacó el tema papá
    expect(md).toContain('Marca para Naza en el panel: preocupante');
  });

  it('la pregunta del padre sin línea llega sola; el aviso de la seria sale dos veces (dijo "mañana mejor")', () => {
    expect(md.match(/`PADRE-PREG-LINEA-PL`/g)).toHaveLength(1);
    expect(md.match(/`B-AVISO-SERIA`/g)).toHaveLength(2);
  });

  it('un encabezado por día, con las fechas en orden', () => {
    const dias = md.split('\n').filter((l) => l.startsWith('## '));
    expect(dias.length).toBeGreaterThan(25);
    expect(dias[0]).toBe('## martes 6/10');
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-lectura.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/lectura.js`.

- [ ] **Step 3: La corrida con reloj simulado**

`fabrica/src/kids-v2/corrida.ts`:
```ts
// Corre un chico inventado de punta a punta contra el motor, con un reloj
// simulado: la usan la lectura corrida y la simulación. Pura (sin I/O).
//
// Chicos INVENTADOS. Nunca usar acá la vida de un narrador real.

import type { Ficha } from './compra.js';
import { nuevoEstado, paso, proximoDespertar, type Estado, type Evento, type Mensaje, type Salida } from './motor.js';

/** Lo que hace el chico (o el padre): un evento, tantos ms después, y qué "dice" (para leer). */
export type Accion = { trasMs: number; evento: Evento; dice: string };

/** Ve lo que le acaba de llegar y decide. `todo`: todos los mensajes que le llegaron hasta ahora. */
export type Conducta = (llegaron: Mensaje[], ctx: { estado: Estado; ahora: Date; todo: Mensaje[] }) => Accion[];

export type Linea =
  | { en: Date; de: 'bot'; mensaje: Mensaje }
  | { en: Date; de: 'chico'; dice: string; evento: Evento }
  | { en: Date; de: 'marca'; motivo: string; detalle: string };

export type Corrida = { lineas: Linea[]; estado: Estado; pasos: number };

export function correr(ficha: Ficha, conducta: Conducta, o: { desde: string; dias: number }): Corrida {
  let estado = nuevoEstado(ficha);
  const lineas: Linea[] = [];
  const todo: Mensaje[] = [];
  const fin = new Date(o.desde).getTime() + o.dias * 86_400_000;
  let cola: { en: number; accion: Accion }[] = [];
  let ahora = new Date(o.desde);
  let pasos = 0;

  const aplicar = (ev: Evento, t: Date) => {
    const r = paso(estado, ev, t.toISOString());
    estado = r.estado;
    pasos++;
    const llegaron: Mensaje[] = [];
    for (const s of r.salidas as Salida[]) {
      if (s.tipo === 'marca') lineas.push({ en: t, de: 'marca', motivo: s.motivo, detalle: s.detalle });
      else {
        const { tipo: _t, ...m } = s;
        lineas.push({ en: t, de: 'bot', mensaje: m });
        llegaron.push(m);
        todo.push(m);
      }
    }
    if (llegaron.length) {
      for (const a of conducta(llegaron, { estado, ahora: t, todo })) cola.push({ en: t.getTime() + a.trasMs, accion: a });
      cola.sort((a, b) => a.en - b.en);
    }
  };

  aplicar({ tipo: 'inicio' }, ahora);
  while (pasos < 20_000) {
    const despertar = proximoDespertar(estado, ahora)?.getTime() ?? Infinity;
    const siguiente = Math.min(cola[0]?.en ?? Infinity, despertar);
    if (!Number.isFinite(siguiente) || siguiente > fin) break;
    ahora = new Date(Math.max(siguiente, ahora.getTime()));
    if (cola.length && cola[0].en <= siguiente) {
      const { accion } = cola.shift()!;
      lineas.push({ en: ahora, de: 'chico', dice: accion.dice, evento: accion.evento });
      aplicar(accion.evento, ahora);
    } else {
      const antes = JSON.stringify(estado);
      aplicar({ tipo: 'reloj' }, ahora);
      if (JSON.stringify(estado) === antes && proximoDespertar(estado, ahora)?.getTime() === ahora.getTime()) {
        throw new Error(`El motor pide reloj otra vez a las ${ahora.toISOString()} sin cambiar nada (se trabaría)`);
      }
    }
  }
  return { lineas, estado, pasos };
}
```

- [ ] **Step 4: La lectura**

`fabrica/src/kids-v2/lectura.ts`:
```ts
// La entrevista completa de UNA chica INVENTADA, mensaje por mensaje, tal
// como la vería en WhatsApp: día, hora local y quién habla. Usa el motor de
// verdad (motor.ts) y los textos del banco: si una regla cambia, la lectura
// cambia. Puro: devuelve el md; scripts/kids-v2-lectura.ts lo escribe.
//
// Tini (Martina Sosa) y su familia NO existen. Nunca usar acá la vida de un
// narrador real.

import type { Ficha } from './compra.js';
import { correr, type Accion, type Conducta, type Corrida, type Linea } from './corrida.js';
import { aInstante, aLocal, diaDeSemana, diasEntre, sumarDias } from './horas.js';
import type { Evento, Mensaje } from './motor.js';

export const FICHA_LECTURA: Ficha = {
  nombre: 'Martina Sosa',
  apodo: 'Tini',
  genero: 'chica',
  edad: 11,
  quienRegala: 'Tus abuelos',
  canal: 'A',
  nombrePadre: 'Laura Sosa',
  linkPanel: 'vitacora.com/panel/tini',
  hora: '18:00',
  zona: 'America/Argentina/Buenos_Aires',
  temasSacados: ['papa'],
  fotosConOtrosChicos: false,
  preguntasPadre: [
    { texto: 'Contame el día que aprendiste a andar en bici sin rueditas.', conLinea: true },
    { texto: 'Contame la primera noche que dormiste en lo de una amiga.', conLinea: false },
  ],
};

/** Compra: martes 6/10/2026, 17:30 en Buenos Aires. */
export const DESDE_LECTURA = '2026-10-06T20:30:00.000Z';

const MIN = 60_000;
const audio = (seg: number, dice: string, transcripcion?: string): Omit<Accion, 'trasMs'> => ({
  evento: { tipo: 'respuesta', contenido: { tipo: 'audio', seg, ...(transcripcion ? { transcripcion } : {}) } },
  dice: `audio de ${seg} s: ${dice}`,
});
const texto = (t: string): Omit<Accion, 'trasMs'> => ({ evento: { tipo: 'respuesta', contenido: { tipo: 'texto', texto: t } }, dice: `escribe: ${t}` });
const foto = (dice: string): Omit<Accion, 'trasMs'> => ({ evento: { tipo: 'respuesta', contenido: { tipo: 'foto' } }, dice: `foto: ${dice}` });
const toca = (boton: string): Omit<Accion, 'trasMs'> => ({ evento: { tipo: 'boton', boton } as Evento, dice: `toca «${boton}»` });

/** Lo que hace Tini con cada mensaje que le llega: por ID (la primera vez) o por ID#vez; lo que no está, va por defecto. */
type Plan = { tras: number | { dias: number; hora: string }; hace: Omit<Accion, 'trasMs'> }[];
const GUION: Record<string, Plan> = {
  'BIEN-CHICO-PL': [{ tras: 20 * MIN, hace: toca('Dale, vamos') }],
  K1: [{ tras: 15 * MIN, hace: audio(75, 'la pileta de plástico en el patio de los abuelos, y un perro que se tomaba el agua') }],
  K2: [{ tras: 10 * MIN, hace: audio(6, 'una vez pinté la pared') }],
  'K2-OP': [{ tras: 8 * MIN, hace: audio(48, 'mi primo escondió las llaves del auto del tío adentro del freezer') }],
  K3: [{ tras: 12 * MIN, hace: audio(64, 'mi cumple de siete, con un mago que se olvidó el conejo') }],
  'K3-FOTO': [{ tras: 3 * MIN, hace: toca('No tengo') }],
  'B-FOTO-NOTENGO': [{ tras: 4 * MIN, hace: audio(22, 'un llavero con forma de choclo que me trajo la tía') }],
  K4: [{ tras: 9 * MIN, hace: texto('a la mancha congelada con los del edificio, la última vez fue en el cumple de Sofi') }],
  K5: [{ tras: 2 * MIN, hace: toca('Paso') }],
  K12: [{ tras: 2 * MIN, hace: toca('No tengo hermanos') }],
  'K12-R2': [{ tras: 3 * MIN, hace: audio(5, 'sí, una hermana') }],
  'K12-R2-2': [{ tras: 6 * MIN, hace: audio(70, 'Cami, la de al lado, dormimos juntas los viernes') }],
  K13: [{ tras: 2 * MIN, hace: toca('Sí') }],
  'K13-R1': [{ tras: 10 * MIN, hace: audio(80, 'el domingo con la abuela Nelly y el abuelo Tito haciendo ñoquis') }],
  K16: [{ tras: 2 * MIN, hace: toca('No tengo') }],
  'K11-FOTO': [{ tras: 2 * MIN, hace: toca('No hago') }],
  // Contesta K17 al otro día a la mañana (sábado): el domingo a las 18 ya pasaron más de 24 h.
  K17: [{ tras: { dias: 1, hora: '11:00' }, hace: audio(55, 'la tía Ana, que canta tangos cuando cocina') }],
  'PREG-NUEVA-CHICO': [{ tras: 40 * MIN, hace: toca('Dale, mandámela') }],
  'CIERRE-2': [{ tras: 4 * MIN, hace: toca('Sí, hay algo') }, { tras: 6 * MIN, hace: audio(40, 'la seño Marta del jardín, que me sigue saludando') }],
  // K20: se calla cinco días (a los cuatro sale el recordatorio al padre).
  K20: [{ tras: { dias: 5, hora: '19:10' }, hace: toca('Sí, una vez') }],
  'K20-R1': [{ tras: 8 * MIN, hace: audio(50, 'el portero me prestó un paraguas') }],
  'K24-FOTO': [{ tras: 3 * MIN, hace: toca('Hoy no la como') }, { tras: 6 * MIN, hace: audio(30, 'milanesa con puré, el domingo pasado') }],
  K37: [{ tras: 14 * MIN, hace: audio(85, 'me echaron la culpa de romper un vidrio', 'me echaron la culpa de romper un vidrio y encima mi primo me pegó') }],
  'B-AVISO-SERIA': [{ tras: 5 * MIN, hace: toca('Mañana mejor') }],
  'B-AVISO-SERIA#2': [{ tras: 5 * MIN, hace: toca('Voy ahora') }],
  K39: [
    { tras: 20 * MIN, hace: audio(95, 'el día que se murió Pancho, mi perro') },
    { tras: 21 * MIN, hace: audio(35, 'lo enterramos en lo de los abuelos') },
  ],
  'B-TRANQUILA': [{ tras: 3 * MIN, hace: toca('Mañana sigo') }],
  'B-UNA-MAS': [{ tras: 2 * MIN, hace: toca('Dale, otra') }],
  'B-UNA-MAS#2': [{ tras: 2 * MIN, hace: toca('No, cerramos') }],
  'B-UNA-MAS#3': [{ tras: 2 * MIN, hace: toca('Dale, otra') }],
  // B-UNA-MAS#4 (cap. 4): no la contesta; al otro día, a la hora, sale el cierre.
  'EXTRAS-OFERTA': [{ tras: 10 * MIN, hace: toca('Dale, otra') }],
  'EXTRAS-OTRA': [{ tras: 5 * MIN, hace: toca('Dale, otra') }],
  'EXTRAS-OTRA#2': [{ tras: 5 * MIN, hace: toca('Lo dejamos acá') }],
};

const esPregunta = (m: Mensaje) => /^(K\d+(-R\d+(-\d+)?|-OP)?|X\d-\d+|PADRE-\d)$/.test(m.id) && !m.id.includes('FOTO');
const esFoto = (m: Mensaje) => m.id.endsWith('-FOTO') || (/^X\d-\d+$/.test(m.id) && m.botones[0] === 'No tengo');

export function chicaDeLaLectura(f: Ficha = FICHA_LECTURA): Conducta {
  const veces = new Map<string, number>();
  const seguirPorDia = new Map<string, number>();
  let n = 0;
  return (llegaron, { ahora }) => {
    const mios = llegaron.filter((m) => m.a === 'chico');
    const u = mios[mios.length - 1];
    if (!u) return [];
    const vez = (veces.get(u.id) ?? 0) + 1;
    veces.set(u.id, vez);
    const { fecha } = aLocal(ahora, f.zona);
    const plan = GUION[`${u.id}#${vez}`] ?? (vez === 1 ? GUION[u.id] : undefined);
    const ms = (t: Plan[number]['tras']) => (typeof t === 'number' ? t : aInstante(sumarDias(fecha, t.dias), t.hora, f.zona).getTime() - ahora.getTime());
    if (plan) return plan.map((p) => ({ trasMs: ms(p.tras), ...p.hace }));
    n++;
    if (esFoto(u)) return [{ trasMs: 6 * MIN, ...foto('la sacó con el celu de la mamá') }];
    if (esPregunta(u)) return [{ trasMs: (8 + (n % 7)) * MIN, ...audio(45 + ((n * 13) % 60), 'cuenta con detalle') }];
    if (u.id === 'B-SEGUIR') {
      const k = (seguirPorDia.get(fecha) ?? 0) + 1;
      seguirPorDia.set(fecha, k);
      return [{ trasMs: 2 * MIN, ...toca(k === 1 ? 'Dale, otra' : 'Mañana sigo') }];
    }
    if (/^CIERRE-/.test(u.id)) return [{ trasMs: 3 * MIN, ...toca('No, eso fue todo') }];
    return [];
  };
}

export function corridaDeLaLectura(): Corrida {
  return correr(FICHA_LECTURA, chicaDeLaLectura(), { desde: DESDE_LECTURA, dias: 90 });
}

const fechaCorta = (fecha: string) => `${Number(fecha.slice(8, 10))}/${Number(fecha.slice(5, 7))}`;

function lineaMd(l: Linea, f: Ficha): string[] {
  const { hora } = aLocal(l.en, f.zona);
  if (l.de === 'chico') return [`**${hora} · ${f.apodo}**  `, `_[${l.dice}]_`, ''];
  if (l.de === 'marca') return [`_(${hora} · Marca para Naza en el panel: ${l.motivo}, ${l.detalle}. A los padres no les llega nada.)_`, ''];
  const m = l.mensaje;
  const quien = m.a === 'padre' && f.canal === 'A' ? `Vitácora → ${f.nombrePadre.split(' ')[0]} (su WhatsApp)` : 'Vitácora';
  const extras = [m.botones.length ? m.botones.map((b) => `[${b}]`).join(' ') : '', m.plantilla ? `plantilla \`${m.plantilla.nombre}\`` : ''].filter(Boolean).join(' · ');
  return [`**${hora} · ${quien}** \`${m.id}\`${extras ? ` · ${extras}` : ''}  `, ...m.texto.split('\n').map((x) => `> ${x}`), ''];
}

export function lecturaCorrida(): string {
  const f = FICHA_LECTURA;
  const { lineas } = corridaDeLaLectura();
  const out = [
    '# Vitácora Kids V2 · Lectura corrida',
    '',
    'Una chica **inventada**, mensaje por mensaje, como le llegaría por WhatsApp. Generado por `fabrica/scripts/kids-v2-lectura.ts` con el motor de `fabrica/src/kids-v2/` y los textos de `banco.md` y `mensajes.md`: no editar a mano.',
    '',
    `- ${f.nombre} ("${f.apodo}"), ${f.edad} años. Se lo regalan ${f.quienRegala.toLowerCase()}. Compra ${f.nombrePadre} (la mamá).`,
    `- Las preguntas van a su WhatsApp (canal A), a las ${f.hora}, hora de Buenos Aires.`,
    '- La mamá sacó el tema "Su papá": no sale K11, y su foto (el deporte) pasa a K16.',
    `- Preguntas de la mamá: «${f.preguntasPadre[0].texto}» (con la línea) · «${f.preguntasPadre[1].texto}» (sin decir que es de ella).`,
    '- Lo que contesta Tini va en cursiva y es inventado. Al lado de cada mensaje, el ID del banco de donde sale. Las notas entre paréntesis no las ve nadie: son para leer.',
    '',
  ];
  let fecha = '';
  let anterior: Date | null = null;
  for (const l of lineas) {
    const local = aLocal(l.en, f.zona);
    if (local.fecha !== fecha) {
      if (anterior) {
        const sin = diasEntre(aLocal(anterior, f.zona).fecha, local.fecha) - 1;
        if (sin > 0) out.push(`_(${sin === 1 ? 'Un día' : `${sin} días`} sin mensajes.)_`, '');
      }
      fecha = local.fecha;
      out.push(`## ${diaDeSemana(fecha)} ${fechaCorta(fecha)}`, '');
    }
    out.push(...lineaMd(l, f));
    anterior = l.en;
  }
  return out.join('\n');
}
```

- [ ] **Step 5: El script**

`fabrica/scripts/kids-v2-lectura.ts`:
```ts
// Genera docs/kids/v2/lectura-corrida.md: la entrevista completa de UNA chica
// INVENTADA (Tini, regalo de sus abuelos, canal A), mensaje por mensaje, con
// día, hora local y quién habla. Para leer en el celular.
//
//   npx tsx scripts/kids-v2-lectura.ts [<salida.md>]

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lecturaCorrida } from '../src/kids-v2/lectura.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = process.argv[2] ?? path.join(FABRICA, '..', 'docs', 'kids', 'v2', 'lectura-corrida.md');

const md = lecturaCorrida();
writeFileSync(SALIDA, md, 'utf8');
const globos = md.split('\n').filter((l) => /^\*\*\d\d:\d\d · /.test(l)).length;
console.log(`${path.relative(process.cwd(), SALIDA)}: ${globos} globos`);
```

- [ ] **Step 6: Correr el test y generar la lectura**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p . && npx tsx scripts/kids-v2-lectura.ts
```
Esperado: PASS (6 nuevos; 129 en kids-v2); el script dice `..\docs\kids\v2\lectura-corrida.md: 376 globos` (unas 1200 líneas, del martes 6/10 al jueves 5/11). Leerla entera una vez: tiene que sonar como el banco, en femenino, sin `{{` ni dos puntos en los globos.

- [ ] **Step 7: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/corrida.ts fabrica/src/kids-v2/lectura.ts fabrica/scripts/kids-v2-lectura.ts fabrica/test/kids-v2-lectura.test.ts docs/kids/v2/lectura-corrida.md
git commit -m "$(cat <<'EOF'
kids v2: lectura corrida de una chica inventada, de la bienvenida al final, mensaje por mensaje

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 13: La simulación (cientos de chicos inventados contra los controles)

**Files:**
- Create: `fabrica/src/kids-v2/conductas.ts`, `fabrica/src/kids-v2/controles.ts`, `fabrica/src/kids-v2/simulacion.ts`, `fabrica/scripts/kids-v2-simular.ts`
- Create (generado): `docs/kids/v2/simulaciones/resumen.md`
- Test: `fabrica/test/kids-v2-simulacion.test.ts`

**Interfaces:**
- Consumes: `correr`, `Conducta`, `Accion`, `Corrida`, `Linea` (12); `armarGuion`, `TEMAS`, `Ficha`, `Canal`, `Tema` (4); `horas.ts` (3).
- Produces: `conductas.ts`: `type Azar`, `azar(semilla)`, `TIPOS_DE_CONDUCTA` (`cuenta-mucho`, `contesta-corto`, `pasa-todo`, `escribe`, `se-calla`, `de-noche`, `toca-cualquier-cosa`, `algo-preocupante`), `esPregunta(m)`, `esFoto(m)`, `FRASE_PREOCUPANTE`, `fichaAlAzar(r, canal?)`, `chico(tipo, r, ficha): Conducta`. `controles.ts`: `type Violacion = { control; detalle }`, `CONTROLES: Record<string, string>` (17 controles), `revisar(ficha, corrida, { sigueContestando }): Violacion[]`. `simulacion.ts`: `DESDE_SIMULACION`, `type Resultado`, `correrUno(semilla)`, `correrMuchos(n)`.

Controles: nunca se traba (llega al final), nada de noche, nunca dos PREG-NUEVA sin respuesta, ningún `{{`, ningún dos puntos a una persona (salvo lo del padre y el link), cada principal una vez (o re-mandada con [Estamos listos]) y ninguna salteada, la cápsula sin acuses "para el libro", escrito sin "escuché", nada de acuse después de [No, eso fue todo], OP → acuse → foto, el día sobrio, como mucho 2 recordatorios por silencio y nunca al chico, sin B-SEGUIR al final de un capítulo, K39 después del aviso, TERMINO-PADRE una vez (canal B otro día), hasta 3 botones, canal B todo al padre.

- [ ] **Step 1: Escribir el test que falla**

`fabrica/test/kids-v2-simulacion.test.ts`:

```ts
// Simulación de Kids V2: 240 chicos inventados (semillas 1 a 240) de punta a
// punta con el motor de verdad, contra los controles de controles.ts. La
// corrida grande (800) la hace scripts/kids-v2-simular.ts.
import { describe, it, expect } from 'vitest';
import { TIPOS_DE_CONDUCTA } from '../src/kids-v2/conductas.js';
import { CONTROLES, revisar } from '../src/kids-v2/controles.js';
import { correrMuchos, correrUno } from '../src/kids-v2/simulacion.js';
import { FICHA } from './kids-v2-ayuda.js';
import type { Corrida } from '../src/kids-v2/corrida.js';
import { aInstante } from '../src/kids-v2/horas.js';
import { corridaDeLaLectura, FICHA_LECTURA } from '../src/kids-v2/lectura.js';

const CORRIDAS = correrMuchos(240);
const ids = (c: (typeof CORRIDAS)[number]) => c.corrida.lineas.flatMap((l) => (l.de === 'bot' ? [l.mensaje.id] : l.de === 'marca' ? [`marca:${l.motivo}`] : []));

describe('kids v2: simulación de 240 chicos', () => {
  it('se repite: la misma semilla da el mismo chico, mensaje por mensaje', () => {
    expect(ids(correrUno(17))).toEqual(ids(correrUno(17)));
  });

  it('cubre lo pedido: las 8 conductas, los dos canales, todos los temas sacados, preguntas del padre, algo preocupante, silencios', () => {
    expect(new Set(CORRIDAS.map((c) => c.conducta))).toEqual(new Set(TIPOS_DE_CONDUCTA));
    expect(new Set(CORRIDAS.map((c) => c.ficha.canal))).toEqual(new Set(['A', 'B']));
    expect(CORRIDAS.some((c) => c.ficha.temasSacados.length === 6)).toBe(true);
    expect(CORRIDAS.some((c) => c.ficha.preguntasPadre.length === 3)).toBe(true);
    const todos = CORRIDAS.flatMap(ids);
    for (const id of ['marca:preocupante', 'marca:silencio-8-dias', 'RECORD-A-4', 'RECORD-B', 'PREG-NUEVA-CHICO', 'PREG-NUEVA-PADRE', 'K12-R2-2', 'B-FOTO-PLATA', 'B-TRANQUILA', 'EXTRAS-OTRA', 'FINAL-CHICO-PL', 'marca:escribio-despues-del-final']) {
      expect(todos, id).toContain(id);
    }
  });

  for (const [control, nombre] of Object.entries(CONTROLES)) {
    it(nombre, () => {
      const malas = CORRIDAS.flatMap((c) => c.violaciones.filter((v) => v.control === control).map((v) => `semilla ${c.semilla} (${c.conducta}): ${v.detalle}`));
      expect(malas).toEqual([]);
    });
  }

  it('la lectura corrida no rompe ningún control', () => {
    expect(revisar(FICHA_LECTURA, corridaDeLaLectura(), { sigueContestando: true })).toEqual([]);
  });

  it('los controles detectan lo que tienen que detectar (un mensaje de noche, un acuse "para el libro" en la cápsula)', () => {
    const base = correrUno(3);
    const lineas = base.corrida.lineas;
    const i = lineas.findIndex((l) => l.de === 'bot' && l.mensaje.id === 'K42');
    const trucha: Corrida = {
      ...base.corrida,
      lineas: [
        ...lineas.slice(0, i + 1),
        { en: aInstante('2026-12-01', '23:30', base.ficha.zona), de: 'bot', mensaje: { a: 'chico', id: 'ACUSE-3', texto: 'Eso va al libro, con tus palabras.', botones: [], plantilla: null } },
        ...lineas.slice(i + 1),
      ],
    };
    const v = revisar(base.ficha, trucha, { sigueContestando: true }).map((x) => x.control);
    expect(v).toContain('noche');
    expect(v).toContain('capsula');
    expect(revisar(FICHA, { lineas: [], estado: { ...base.corrida.estado, fase: { tipo: 'seguir' } }, pasos: 0 }, { sigueContestando: true }).map((x) => x.control)).toContain('traba');
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2-simulacion.test.ts
```
Esperado: FAIL, no encuentra `../src/kids-v2/conductas.js`.

- [ ] **Step 3: Los chicos inventados**

`fabrica/src/kids-v2/conductas.ts`:
```ts
// Chicos inventados para la simulación: cómo contestan (corto, largo,
// escrito, pasando todo, callándose días, de noche, tocando cualquier botón,
// contando algo preocupante). Azar con semilla: todo se repite.
//
// Chicos INVENTADOS. Nunca usar acá la vida de un narrador real.

import type { Canal, Ficha, Tema } from './compra.js';
import { TEMAS } from './compra.js';
import type { Accion, Conducta } from './corrida.js';
import { aLocal, aInstante, sumarDias } from './horas.js';
import type { Contenido, Mensaje } from './motor.js';

export type Azar = { (): number; entre(a: number, b: number): number; uno<T>(xs: readonly T[]): T; si(p: number): boolean };

export function azar(semilla: number): Azar {
  let s = semilla >>> 0 || 1;
  const f = (() => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Azar;
  f.entre = (a, b) => a + Math.floor(f() * (b - a + 1));
  f.uno = (xs) => xs[Math.floor(f() * xs.length)];
  f.si = (p) => f() < p;
  return f;
}

export const TIPOS_DE_CONDUCTA = ['cuenta-mucho', 'contesta-corto', 'pasa-todo', 'escribe', 'se-calla', 'de-noche', 'toca-cualquier-cosa', 'algo-preocupante'] as const;
export type TipoConducta = (typeof TIPOS_DE_CONDUCTA)[number];

const MIN = 60_000;
const DIA = 86_400_000;

/** Una pregunta que espera respuesta (no un botón suelto). */
export const esPregunta = (m: Mensaje) => /^(K\d+(-R\d+(-\d+)?|-OP)?|X\d-\d+|PADRE-\d)$/.test(m.id) && !(m.botones.length === 1 && m.botones[0] === 'No tengo');
export const esFoto = (m: Mensaje) => m.id.endsWith('-FOTO') || (/^X\d-\d+$/.test(m.id) && m.botones[0] === 'No tengo');

export const FRASE_PREOCUPANTE = 'y mi primo me pega cuando nadie mira';

export function fichaAlAzar(r: Azar, canal?: Canal): Ficha {
  const genero = r.uno(['chico', 'chica'] as const);
  const temas = r.si(0.1) ? [...TEMAS] : TEMAS.filter(() => r.si(0.2));
  const n = r.entre(0, 3);
  return {
    nombre: genero === 'chico' ? 'Bruno Ibáñez' : 'Martina Sosa',
    apodo: genero === 'chico' ? 'Bruno' : 'Tini',
    genero,
    edad: r.entre(10, 12),
    quienRegala: r.uno(['Tu mamá', 'Tu papá', 'Tus papás', 'Tu abuela', 'Tus abuelos', 'tu madrina']),
    canal: canal ?? r.uno(['A', 'B'] as const),
    nombrePadre: 'Laura Sosa',
    linkPanel: 'vitacora.com/panel/abc123',
    hora: r.uno(['09:00', '13:30', '18:00', '19:15', '21:30']),
    zona: r.uno(['America/Argentina/Buenos_Aires', 'Europe/Madrid', 'America/Mexico_City']),
    temasSacados: temas as Tema[],
    fotosConOtrosChicos: r.si(0.5),
    preguntasPadre: Array.from({ length: n }, (_, i) => ({ texto: `Contame la vez número ${i + 1} que nos reímos juntos`, conLinea: r.si(0.7) })),
  };
}

/**
 * Un chico con una conducta. `numeroPreguntas`: en canal B todo llega al
 * padre (es el mismo celular), así que mira todo.
 */
export function chico(tipo: TipoConducta, r: Azar, ficha: Ficha): Conducta {
  const mios = (ms: Mensaje[]) => (ficha.canal === 'B' ? ms : ms.filter((m) => m.a === 'chico'));
  let preocupanteDicho = false;

  const tarda = (ahora: Date): number => {
    if (tipo === 'se-calla' && r.si(0.08)) return r.entre(3, 12) * DIA + r.entre(0, 600) * MIN;
    if (tipo === 'de-noche') {
      const { fecha } = aLocal(ahora, ficha.zona);
      const noche = aInstante(fecha, r.uno(['22:20', '23:10', '23:50']), ficha.zona).getTime();
      const t = noche > ahora.getTime() ? noche : aInstante(sumarDias(fecha, 1), '23:10', ficha.zona).getTime();
      return t - ahora.getTime();
    }
    return r.entre(1, 50) * MIN;
  };

  const contar = (): { contenido: Contenido; dice: string }[] => {
    const audio = (seg: number, transcripcion?: string) => ({ contenido: { tipo: 'audio' as const, seg, ...(transcripcion ? { transcripcion } : {}) }, dice: `audio de ${seg} s${transcripcion ? `: "${transcripcion}"` : ''}` });
    switch (tipo) {
      case 'contesta-corto':
        return r.si(0.5) ? [audio(r.entre(3, 12))] : [{ contenido: { tipo: 'texto', texto: 'no sé' }, dice: 'texto: no sé' }];
      case 'escribe': {
        const texto = 'me acuerdo que estábamos en lo de mi abuela y llovía muchísimo y nadie quería salir';
        return [{ contenido: { tipo: 'texto', texto }, dice: `texto: ${texto}` }];
      }
      case 'algo-preocupante':
        if (!preocupanteDicho && r.si(0.15)) {
          preocupanteDicho = true;
          return [audio(r.entre(40, 90), FRASE_PREOCUPANTE)];
        }
        return [audio(r.entre(30, 120))];
      default:
        return r.si(0.2) ? [audio(r.entre(30, 90)), audio(r.entre(20, 60))] : [audio(r.entre(25, 180))];
    }
  };

  const contestar = (t: number): Accion[] =>
    contar().map((x, i) => ({ trasMs: t + i * 20_000, evento: { tipo: 'respuesta', contenido: x.contenido }, dice: x.dice }));
  const tocar = (t: number, boton: string): Accion[] => [{ trasMs: t, evento: { tipo: 'boton', boton }, dice: `[${boton}]` }];

  return (llegaron, { ahora, todo }) => {
    const ms = mios(llegaron);
    if (!ms.length) return [];
    const u = ms[ms.length - 1];
    const t = tarda(ahora);
    const acciones: Accion[] = [];
    if (tipo === 'toca-cualquier-cosa' && r.si(0.3)) {
      const viejo = r.uno(mios(todo).filter((m) => m.botones.length));
      if (viejo) acciones.push(...tocar(r.entre(1, 5) * MIN, r.uno(viejo.botones)));
    }
    if (u.plantilla && u.botones.length) return [...acciones, ...tocar(t, u.botones[0])];
    if (esFoto(u)) {
      if (tipo === 'pasa-todo' || r.si(0.3)) return [...acciones, ...tocar(t, r.uno(u.botones))];
      return [...acciones, { trasMs: t, evento: { tipo: 'respuesta', contenido: { tipo: 'foto' } }, dice: 'foto' }];
    }
    if (esPregunta(u)) {
      const ramas = u.botones.slice(0, -1);
      if (tipo === 'pasa-todo' || r.si(0.05)) return [...acciones, ...tocar(t, u.botones[u.botones.length - 1])];
      if (ramas.length && r.si(0.8)) {
        const b = r.uno(ramas);
        return [...acciones, ...tocar(r.entre(1, 3) * MIN, b), ...contestar(t + 5 * MIN)];
      }
      return [...acciones, ...contestar(t)];
    }
    switch (u.id) {
      case 'B-SEGUIR':
        return [...acciones, ...tocar(r.entre(1, 10) * MIN, r.si(0.5) ? 'Dale, otra' : 'Mañana sigo')];
      case 'B-AVISO-SERIA':
        return [...acciones, ...tocar(t, r.si(0.7) ? 'Voy ahora' : 'Mañana mejor')];
      case 'B-TRANQUILA':
        return [...acciones, ...tocar(t, r.si(0.5) ? 'Dale, una tranquila' : 'Mañana sigo')];
      case 'B-UNA-MAS':
        return [...acciones, ...tocar(t, r.si(0.5) ? 'Dale, otra' : 'No, cerramos')];
      case 'EXTRAS-OFERTA':
        if (r.si(0.2)) return acciones; // no contesta: a los 2 días cierra solo
        return [...acciones, ...tocar(t, r.si(0.6) ? 'Dale, otra' : 'No, ya está')];
      case 'EXTRAS-OTRA':
        return [...acciones, ...tocar(t, r.si(0.6) ? 'Dale, otra' : 'Lo dejamos acá')];
      case 'B-FOTO-NOTENGO':
      case 'B-FOTO-PLATA':
        return r.si(0.5) ? [...acciones, ...contestar(r.entre(1, 8) * MIN)] : acciones;
    }
    if (/^CIERRE-/.test(u.id)) {
      if (r.si(0.25)) return [...acciones, ...tocar(t, 'Sí, hay algo'), ...contestar(t + 3 * MIN)];
      return [...acciones, ...tocar(t, 'No, eso fue todo')];
    }
    return acciones;
  };
}
```

- [ ] **Step 4: Los controles**

`fabrica/src/kids-v2/controles.ts`:
```ts
// Los controles que corre la simulación sobre TODOS los mensajes de una
// corrida. Cada uno es una regla del diseño (banco.md, mensajes.md,
// flujo-vigente.md, paso-4-huecos-decisiones.md). Puro.

import { armarGuion, type Ficha } from './compra.js';
import type { Corrida, Linea } from './corrida.js';
import { aLocal, esDeNoche } from './horas.js';
import type { Mensaje } from './motor.js';

export type Violacion = { control: string; detalle: string };

export const CONTROLES: Record<string, string> = {
  traba: 'nunca se traba: si el chico sigue contestando, llega al final',
  noche: 'nada entre las 22 y las 9 (hora del país del número)',
  plantillas: 'nunca dos PREG-NUEVA seguidas sin que el chico conteste en el medio',
  marcas: 'ningún texto con "{{"',
  dosPuntos: 'ningún dos puntos en un texto a una persona (salvo lo que escribe el padre y el link)',
  unaVez: 'cada principal sale una sola vez (o se re-manda con [Estamos listos] en canal B) y ninguna se saltea',
  capsula: 'la cápsula no recibe acuses "para el libro" (ACUSE-3, ACUSE-6)',
  escrito: 'si escribe en vez de mandar audio, ningún acuse dice "escuché"',
  despuesDeNo: 'después de [No, eso fue todo] no va ningún acuse',
  orden: 'después de una respuesta: otra puerta → acuse → foto → seguir',
  preocupante: 'después de algo preocupante, ese día solo acuses sobrios',
  recordatorios: 'como mucho 2 recordatorios por silencio, y nunca al chico',
  seguirFinDeCap: 'no sale B-SEGUIR después de la última principal de un capítulo ni después de K47',
  aviso: 'K39 siempre después de B-AVISO-SERIA',
  termino: 'TERMINO-PADRE una sola vez al terminar; en canal B, otro día que FINAL-CHICO',
  botones: 'como mucho 3 botones por mensaje',
  canalB: 'en canal B todo va al número del padre',
};

const bot = (ls: Linea[]) => ls.filter((l): l is Extract<Linea, { de: 'bot' }> => l.de === 'bot');
const ACUSE = /^ACUSE-\d$/;

export function revisar(ficha: Ficha, c: Corrida, o: { sigueContestando: boolean }): Violacion[] {
  const v: Violacion[] = [];
  const mal = (control: string, detalle: string) => v.push({ control, detalle });
  const mensajes = bot(c.lineas);
  const hora = (d: Date) => aLocal(d, ficha.zona);
  const cuando = (d: Date) => `${hora(d).fecha} ${hora(d).hora}`;
  const guion = armarGuion(ficha);
  const principales = guion.filter((x) => x.tipo === 'principal').map((x) => x.clave);
  const ultimasDeCap = new Set(guion.filter((x) => x.tipo === 'principal' && x.ultimaDelCap).map((x) => x.clave));

  // traba
  if (o.sigueContestando && c.estado.fase.tipo !== 'terminado') mal('traba', `quedó en ${c.estado.fase.tipo} (${guion[c.estado.cursor]?.clave ?? '-'})`);

  let ultimaPregunta: string | null = null;
  const contenidos = new Set<string>();
  let previo: Linea | null = null;
  let avisosSinRespuesta = 0;
  let sobrioHasta: { fecha: string } | null = null;
  let recordatorios = 0;
  let avisoAntesDeK39 = false;
  let contoDesdeCierre = false;
  const enviadas = new Map<string, number>();
  const pendienteOrden = new Map<string, 'op' | 'acuse' | 'foto'>();

  for (const l of c.lineas) {
    if (l.de === 'chico') {
      avisosSinRespuesta = 0;
      recordatorios = 0;
      if (l.evento.tipo === 'respuesta') {
        contenidos.add(l.evento.contenido.tipo);
        contoDesdeCierre = true;
      }
      previo = l;
      continue;
    }
    if (l.de === 'marca') {
      if (l.motivo === 'preocupante') sobrioHasta = { fecha: hora(l.en).fecha };
      previo = l;
      continue;
    }
    const m: Mensaje = l.mensaje;
    const id = m.id;
    if (esDeNoche(l.en, ficha.zona)) mal('noche', `${id} a las ${cuando(l.en)}`);
    if (m.texto.includes('{{')) mal('marcas', `${id}: ${m.texto.slice(0, 50)}`);
    const sinLink = m.texto.split(ficha.linkPanel).join('');
    if (!/^PADRE-\d$/.test(id) && sinLink.includes(':')) mal('dosPuntos', `${id}: ${m.texto.slice(0, 60)}`);
    if (m.botones.length > 3) mal('botones', `${id}: ${m.botones.length}`);
    if (ficha.canal === 'B' && m.a !== 'padre') mal('canalB', `${id} fue a ${m.a}`);

    if (id === 'PREG-NUEVA-CHICO' || id === 'PREG-NUEVA-PADRE') {
      if (avisosSinRespuesta > 0) mal('plantillas', `${id} a las ${cuando(l.en)} sin respuesta al anterior`);
      avisosSinRespuesta++;
    }
    if (/^RECORD-/.test(id)) {
      recordatorios++;
      if (recordatorios > 2) mal('recordatorios', `${id}: el ${recordatorios}º del mismo silencio`);
      if (m.a !== 'padre') mal('recordatorios', `${id} fue al chico`);
    }

    if (sobrioHasta) {
      if (hora(l.en).fecha !== sobrioHasta.fecha || /^RECORD-|TERMINO-PADRE/.test(id)) sobrioHasta = null;
      else if (!/^B-DIAFEO-ACUSE-\d$/.test(id)) mal('preocupante', `${id} el mismo día que algo preocupante (${cuando(l.en)})`);
    }

    if (/^K\d+$/.test(id)) {
      const n = (enviadas.get(id) ?? 0) + 1;
      enviadas.set(id, n);
      const reenvio = previo?.de === 'chico' && previo.evento.tipo === 'boton' && previo.evento.boton === 'Estamos listos';
      if (n > 1 && !reenvio) mal('unaVez', `${id} salió ${n} veces`);
      if (id === 'K39' && !avisoAntesDeK39 && !reenvio) mal('aviso', `K39 sin B-AVISO-SERIA antes (${cuando(l.en)})`);
      if (id === 'K39') avisoAntesDeK39 = false;
    }
    if (id === 'B-AVISO-SERIA') avisoAntesDeK39 = true;
    if (/^CIERRE-/.test(id)) contoDesdeCierre = false;

    const esPreg = /^(K\d+|X\d-\d+|PADRE-\d|CIERRE-.+)$/.test(id);
    if (esPreg) ultimaPregunta = id;
    if (ACUSE.test(id)) {
      const enCapsula = ultimaPregunta !== null && (/^K4[1-7]$/.test(ultimaPregunta) || /^X5-/.test(ultimaPregunta) || ultimaPregunta === 'CIERRE-FINAL');
      if (enCapsula && (id === 'ACUSE-3' || id === 'ACUSE-6')) mal('capsula', `${id} después de ${ultimaPregunta}`);
      if (contenidos.has('texto') && !contenidos.has('audio') && ['ACUSE-1', 'ACUSE-4', 'ACUSE-6'].includes(id)) mal('escrito', `${id} después de un texto (${ultimaPregunta})`);
      if (!contoDesdeCierre && previo?.de === 'chico' && previo.evento.tipo === 'boton' && previo.evento.boton === 'No, eso fue todo') mal('despuesDeNo', `${id} después de [No, eso fue todo]`);
    }
    if (/^K\d+-OP$/.test(id)) pendienteOrden.set(id.replace('-OP', ''), 'op');
    if (/^K\d+-FOTO$/.test(id) && ultimaPregunta && !(previo?.de === 'bot' && (ACUSE.test(previo.mensaje.id) || /^ACUSE-FOTO|^B-(PASO|NO-PASA-NADA)$/.test(previo.mensaje.id)))) {
      mal('orden', `${id} sin acuse o paso justo antes (después de ${previo?.de === 'bot' ? previo.mensaje.id : previo?.de})`);
    }
    if (id === 'B-SEGUIR' && previo?.de === 'bot') {
      const antes = previo.mensaje.id;
      if (ACUSE.test(antes) && ultimaPregunta && (ultimasDeCap.has(ultimaPregunta) || ultimaPregunta === 'K47')) mal('seguirFinDeCap', `B-SEGUIR después de ${ultimaPregunta}`);
    }
    contenidos.clear();
    previo = l;
  }

  const terminados = mensajes.filter((x) => x.mensaje.id === 'TERMINO-PADRE');
  const final = mensajes.find((x) => /^FINAL-CHICO/.test(x.mensaje.id));
  if (c.estado.fase.tipo === 'terminado') {
    if (terminados.length !== 1 && !(ficha.canal === 'B' && c.estado.terminoPadre)) mal('termino', `TERMINO-PADRE salió ${terminados.length} veces`);
    if (ficha.canal === 'B' && final && terminados[0] && hora(terminados[0].en).fecha === hora(final.en).fecha) mal('termino', 'canal B: TERMINO-PADRE el mismo día que FINAL-CHICO');
    for (const k of principales) if (!enviadas.has(k)) mal('unaVez', `${k} nunca salió`);
  } else if (terminados.length > 0) mal('termino', 'TERMINO-PADRE sin haber terminado');
  return v;
}
```

- [ ] **Step 5: La simulación y su script**

`fabrica/src/kids-v2/simulacion.ts`:
```ts
// La simulación: chicos inventados (ficha y conducta al azar, con semilla)
// corridos de punta a punta, con sus violaciones. La usan el script y el test.

import { azar, chico, fichaAlAzar, TIPOS_DE_CONDUCTA, type TipoConducta } from './conductas.js';
import type { Ficha } from './compra.js';
import { revisar, type Violacion } from './controles.js';
import { correr, type Corrida } from './corrida.js';

export const DESDE_SIMULACION = '2026-10-06T15:00:00.000Z';

export type Resultado = { semilla: number; conducta: TipoConducta; ficha: Ficha; corrida: Corrida; violaciones: Violacion[]; dias: number; mensajes: number };

export function correrUno(semilla: number): Resultado {
  const r = azar(semilla);
  const conducta = TIPOS_DE_CONDUCTA[semilla % TIPOS_DE_CONDUCTA.length];
  const ficha = fichaAlAzar(r);
  let corrida: Corrida;
  try {
    corrida = correr(ficha, chico(conducta, r, ficha), { desde: DESDE_SIMULACION, dias: 365 });
  } catch (err) {
    const vacia: Corrida = { lineas: [], estado: undefined as never, pasos: 0 };
    return { semilla, conducta, ficha, corrida: vacia, violaciones: [{ control: 'traba', detalle: (err as Error).message }], dias: 0, mensajes: 0 };
  }
  const ultima = corrida.lineas[corrida.lineas.length - 1]?.en ?? new Date(DESDE_SIMULACION);
  return {
    semilla,
    conducta,
    ficha,
    corrida,
    violaciones: revisar(ficha, corrida, { sigueContestando: true }),
    dias: Math.ceil((ultima.getTime() - new Date(DESDE_SIMULACION).getTime()) / 86_400_000),
    mensajes: corrida.lineas.filter((l) => l.de === 'bot').length,
  };
}

export function correrMuchos(n: number): Resultado[] {
  return Array.from({ length: n }, (_, i) => correrUno(i + 1));
}
```

`fabrica/scripts/kids-v2-simular.ts`:
```ts
// Simulador de Vitácora Kids V2: corre MUCHOS chicos inventados de punta a
// punta con el motor de verdad (src/kids-v2/) y revisa los controles de
// src/kids-v2/controles.ts sobre TODOS los mensajes. Semilla fija: todo se repite.
//
//   npx tsx scripts/kids-v2-simular.ts            # 800 chicos + docs/kids/v2/simulaciones/resumen.md
//   npx tsx scripts/kids-v2-simular.ts 200        # otra cantidad (no escribe nada)
//   npx tsx scripts/kids-v2-simular.ts --semilla 7  # un chico, mensaje por mensaje, y sus violaciones
//
// Chicos INVENTADOS. Nunca usar acá la vida de un narrador real.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTROLES } from '../src/kids-v2/controles.js';
import { aLocal } from '../src/kids-v2/horas.js';
import { correrMuchos, correrUno } from '../src/kids-v2/simulacion.js';

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = path.join(FABRICA, '..', 'docs', 'kids', 'v2', 'simulaciones');

const arg = process.argv.slice(2);
if (arg[0] === '--semilla') {
  const r = correrUno(Number(arg[1]));
  console.log(`semilla ${r.semilla}: ${r.conducta}, canal ${r.ficha.canal}, hora ${r.ficha.hora}, ${r.ficha.zona}, temas [${r.ficha.temasSacados.join(', ')}]`);
  for (const l of r.corrida.lineas) {
    const h = aLocal(l.en, r.ficha.zona);
    const que = l.de === 'bot' ? `→ ${l.mensaje.a} ${l.mensaje.id} [${l.mensaje.botones.join('|')}]` : l.de === 'chico' ? `   ${l.dice}` : `   MARCA ${l.motivo}: ${l.detalle}`;
    console.log(`${h.fecha} ${h.hora} ${que}`);
  }
  console.log(r.violaciones.length ? r.violaciones : 'sin violaciones');
} else {
  const n = Number(arg[0] ?? 800);
  const t0 = Date.now();
  const rs = correrMuchos(n);
  const porControl = new Map<string, string[]>();
  for (const r of rs) for (const v of r.violaciones) porControl.set(v.control, [...(porControl.get(v.control) ?? []), `semilla ${r.semilla} (${r.conducta}): ${v.detalle}`]);
  const dias = rs.map((r) => r.dias).sort((a, b) => a - b);
  const md = [
    '# Kids V2 · Simulaciones · Resumen',
    '',
    `Generado por \`fabrica/scripts/kids-v2-simular.ts\`: ${n} chicos inventados, semillas 1 a ${n}. No editar a mano.`,
    '',
    `- Terminaron: ${rs.filter((r) => r.corrida.estado.fase.tipo === 'terminado').length} de ${n}.`,
    `- Días de punta a punta: mediana ${dias[Math.floor(n / 2)]}, máximo ${dias[n - 1]}.`,
    `- Mensajes del bot: ${rs.reduce((a, r) => a + r.mensajes, 0)}.`,
    '',
    '| Control | Qué revisa | Violaciones |',
    '|---|---|---|',
    ...Object.entries(CONTROLES).map(([k, d]) => `| ${k} | ${d} | ${porControl.get(k)?.length ?? 0} |`),
    '',
    ...[...porControl.entries()].flatMap(([k, xs]) => [`## ${k}`, '', ...xs.slice(0, 10).map((x) => `- ${x}`), '']),
  ].join('\n');
  if (!arg[0]) {
    mkdirSync(CARPETA, { recursive: true });
    writeFileSync(path.join(CARPETA, 'resumen.md'), md, 'utf8');
  }
  console.log(md.split('\n').slice(4, 8).join('\n'));
  console.log(`${porControl.size === 0 ? 'cero violaciones' : `${[...porControl.values()].flat().length} violaciones`} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (porControl.size) process.exitCode = 1;
}
```

- [ ] **Step 6: Correr todo y generar el resumen**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p . && npx tsx scripts/kids-v2-simular.ts
```
Esperado: PASS (150 tests en kids-v2, unos 20 s); el script corre 800 chicos (menos de un minuto), escribe `docs/kids/v2/simulaciones/resumen.md` y termina con `cero violaciones`. Si un control falla: `npx tsx scripts/kids-v2-simular.ts --semilla N` muestra ese chico mensaje por mensaje; arreglar el motor (con un test en el archivo de la parte que corresponde), nunca aflojar el control sin decírselo a Naza.

- [ ] **Step 7: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2/conductas.ts fabrica/src/kids-v2/controles.ts fabrica/src/kids-v2/simulacion.ts fabrica/scripts/kids-v2-simular.ts fabrica/test/kids-v2-simulacion.test.ts docs/kids/v2/simulaciones/resumen.md
git commit -m "$(cat <<'EOF'
kids v2: simulación de 800 chicos inventados (8 conductas, canal A y B) contra 17 controles, cero violaciones

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 14: README de Kids V2

**Files:**
- Create: `docs/kids/v2/README.md`

**Interfaces:**
- Consumes: los nombres de archivos y comandos de las tareas 1 a 13.
- Produces: la puerta de entrada a `docs/kids/v2/`, como `docs/viajes-v2/README.md` de la rama `viajes-v2`.

- [ ] **Step 1: Escribir el README**

`docs/kids/v2/README.md`:

````markdown
# Vitácora Kids V2 · «Mi Primer Capítulo»

Carpeta del rediseño de Kids (30/09 al 05/10/2026), hecho con el método del banco de V3. Rama `vitacora-kids`, worktree `VITACORA KIDS`. **Main no se tocó.**

## Empezar por acá
- [`flujo-vigente.md`](flujo-vigente.md): el proceso de punta a punta (compra, arranque, un día típico, capítulos, la seria, el padre, la cápsula, el final).
- [`banco.md`](banco.md): **fuente de verdad** de las 47 preguntas, otras puertas, fotos, extras, entradas, cierres y los mensajes del banco. El código se genera desde acá.
- [`mensajes.md`](mensajes.md): **fuente de verdad** de los demás mensajes fijos (bienvenidas, acuses, recordatorios, final, compra, panel). El código también se genera desde acá.
- [`paso-4-huecos-decisiones.md`](paso-4-huecos-decisiones.md): lo que decidió Naza el 05/10 y los defaults técnicos (pisan a lo anterior).
- [`plantillas-meta-kids.md`](plantillas-meta-kids.md): las 11 plantillas para cargar en Meta.
- [`lectura-corrida.md`](lectura-corrida.md): una chica inventada, mensaje por mensaje (se genera, no editar a mano).
- [`simulaciones/resumen.md`](simulaciones/resumen.md): 800 chicos inventados contra los controles (se genera).
- Lo que salió y por qué: [`banco-descartadas.md`](banco-descartadas.md).

## Cómo se llegó
`paso-1-*` (método) → `paso-2-*` (el banco, capítulo por capítulo, con Fable) → `paso-3-*` (mensajes fijos) → `paso-4-*` (revisión de Fable leída como el chico y huecos decididos) → el motor (plan en `docs/superpowers/plans/2026-10-05-kids-v2-motor.md`, con las decisiones que el diseño no definía).

## Código
`fabrica/src/kids-v2/` (puro: sin I/O, sin red, sin modelos de IA; los textos salen de `banco.json`):
- `banco-md.ts` → `banco.json` (generado) → `banco.ts`: el banco tipado. Si falta un ID que el motor usa, el parseo falla.
- `texto.ts` (género, variables, plural), `horas.ts` (nada entre las 22 y las 9), `reglas.ts` (los números del flujo), `acuses.ts` (rotación).
- `compra.ts` (la ficha y el guion efectivo: temas sacados, fotos que se mudan, preguntas del padre), `extras.ts`.
- `motor.ts`: `paso(estado, evento, ahora) → { estado, salidas }`, partido en `motor/` (`flujo`, `rafaga`, `botones`, `reloj`, `sobrio`, `mensajes`, `estado`, `tipos`). `preocupante.ts`: la lista de palabras (borrador para Naza).
- `corrida.ts`, `lectura.ts`, `conductas.ts`, `controles.ts`, `simulacion.ts`: la lectura corrida y la simulación.

Tests en `fabrica/test/kids-v2-*.test.ts` (todos en verde, incluida una simulación de 240 chicos).

```bash
cd fabrica
npx tsx scripts/kids-v2-json.ts       # regenera src/kids-v2/banco.json desde banco.md y mensajes.md
npx vitest run test/kids-v2           # tests
npx tsc --noEmit -p .                 # tipos
npx tsx scripts/kids-v2-lectura.ts    # regenera docs/kids/v2/lectura-corrida.md
npx tsx scripts/kids-v2-simular.ts    # 800 chicos + docs/kids/v2/simulaciones/resumen.md
npx tsx scripts/kids-v2-simular.ts --semilla 7   # un chico, mensaje por mensaje
```

## Cómo se conecta (para Joaquín)
- Por chico se guarda el `Estado` (JSON). Se arranca con `nuevoEstado(ficha)` y el evento `inicio` cuando paga.
- Cada cosa que llega del número de las preguntas es un evento: `respuesta` (audio con sus segundos y, si se puede, la transcripción; texto; foto) o `boton` (el texto del botón, tal cual). `paso()` devuelve el estado nuevo y las salidas.
- Salidas: `mensaje` (a `chico` o `padre`; si trae `plantilla`, va como plantilla de Meta con esas variables; si no, texto libre dentro de la ventana de 24 h; los botones son respuestas rápidas) y `marca` (al panel de Naza: `preocupante`, `silencio-8-dias`, `escribio-despues-del-final`).
- El tiempo: llamar `paso(estado, { tipo: 'reloj' }, ahora)` en `proximoDespertar(estado, ahora)` (o cada minuto). Sin eso, no se acusa la ráfaga (90 s), no sale la pregunta del día ni los recordatorios.
- Cambios del panel: evento `ficha` (hora, temas, preguntas del padre).

## Qué falta (no está hecho)
1. **Conectarlo al entrevistador de WhatsApp** (Joaquín): guardar el estado, mandar las salidas, el reloj, la transcripción de los audios (para la lista de palabras) y el payload de los botones.
2. **La compra** (`/comprar/kids`): las tres pantallas de `mensajes.md` §8 (COMPRA-1 a COMPRA-3), con la hora entre 09:00 y 21:59 y la zona del país del número.
3. **El panel**: ver todo (también la cápsula), corregir nombres, escribir hasta 3 preguntas con la casilla "sin decir que es mía" hasta que empieza la cuarta parte, cambiar la hora y los temas; en el de Naza, las marcas.
4. **Meta**: cargar las 11 plantillas de `plantillas-meta-kids.md`.
5. **El libro**: el escritor arma los capítulos desde los audios (las preguntas del padre al final del cap. 4), la cápsula en un sobre pegado al impreso y en un PDF aparte, la revisión de algo preocupante antes de armar, y Naza mira el álbum (fotos con otros chicos) antes de imprimir.
6. **Naza**: aprobar la lista de palabras de `preocupante.ts` (y el abogado, `paso-3-algo-preocupante.md`) y las decisiones que tomó el plan.
7. `pendientes.md`: sacar "tres semanas" de la landing.
````

- [ ] **Step 2: Verificar que los links y comandos andan**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
ls ../docs/kids/v2/{flujo-vigente,banco,mensajes,paso-4-huecos-decisiones,plantillas-meta-kids,lectura-corrida,banco-descartadas}.md ../docs/kids/v2/simulaciones/resumen.md && npx tsx scripts/kids-v2-simular.ts 20
```
Esperado: los 8 archivos existen y la simulación chica termina con `cero violaciones`.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add docs/kids/v2/README.md
git commit -m "$(cat <<'EOF'
kids v2: README para empezar por acá (código, comandos, cómo se conecta y qué falta)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

### Task 15: Revisión por un segundo agente y arreglos con test

**Files:**
- Modify: los de `fabrica/src/kids-v2/` que tengan bugs confirmados.
- Test: el `fabrica/test/kids-v2-*.test.ts` de la parte que corresponde a cada arreglo.

**Interfaces:**
- Consumes: todo lo anterior. No cambia firmas públicas (`paso`, `nuevoEstado`, `proximoDespertar`, los tipos de `motor/tipos.ts`); si un arreglo lo exige, se dice en el commit y se actualiza el README.
- Produces: el motor revisado y la rama subida.

- [ ] **Step 1: Pedir la revisión** (agente `typescript-reviewer` o `code-reviewer`, con este pedido tal cual):

```text
Revisá el motor de Vitácora Kids V2 en C:\Users\Naza\Desktop\VITACORA KIDS\fabrica\src\kids-v2\ (rama vitacora-kids; no hagas checkout, commit ni push) contra el diseño: docs\kids\v2\banco.md, mensajes.md, flujo-vigente.md, paso-4-huecos-decisiones.md, y las "Decisiones que el plan tomó" de docs\superpowers\plans\2026-10-05-kids-v2-motor.md. Buscá BUGS REALES: un chico que se traba, una pregunta que sale dos veces o nunca, un mensaje de noche, un texto con {{ o con dos puntos, un acuse que miente (va al libro en la cápsula, "escuché" a un texto, acuse después de un no), una plantilla de más, un recordatorio de más o al chico, el estado que no se puede serializar, un botón viejo que rompe algo, una regla del diseño que el código no cumple. Para cada uno: archivo:línea, qué pasa, un caso concreto (estado + evento + hora) que lo muestra, y por qué viola el diseño (cita). No reportes estilo ni gustos. Si no encontrás bugs, decilo.
```

- [ ] **Step 2: Confirmar cada hallazgo antes de tocar nada**

Para cada bug reportado: escribir un test que lo reproduzca en el archivo de test de su parte (`kids-v2-flujo`, `-rafaga`, `-botones`, `-reloj`, `-motor`, `-preocupante`), con el estado + evento + hora del reporte, y correrlo:

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2
```
Esperado: el test nuevo FALLA (si pasa, el hallazgo no era un bug: anotarlo como descartado en el commit y borrar el test).

- [ ] **Step 3: Arreglar con lo mínimo y correr todo**

Arreglar en el archivo que corresponde, sin cambiar textos ni md. Después:

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS/fabrica"
npx vitest run test/kids-v2 && npx tsc --noEmit -p . && npx tsx scripts/kids-v2-json.ts && npx tsx scripts/kids-v2-lectura.ts && npx tsx scripts/kids-v2-simular.ts
```
Esperado: todo PASS, `cero violaciones`; `git status` muestra `banco.json` sin cambios (si cambió, alguien tocó un md: parar y avisar).

- [ ] **Step 4: Commit de los arreglos** (uno por bug, o uno solo si son chicos, nombrando cada uno)

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git add fabrica/src/kids-v2 fabrica/test docs/kids/v2/lectura-corrida.md docs/kids/v2/simulaciones/resumen.md
git commit -m "$(cat <<'EOF'
kids v2: arreglos de la revisión (uno por línea: archivo, qué pasaba, el test que lo cubre)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Subir la rama**

```bash
cd "/c/Users/Naza/Desktop/VITACORA KIDS"
git status --short   # limpio
git push origin vitacora-kids
```
Esperado: `vitacora-kids -> vitacora-kids`. Nada más se sube a ningún lado.

---

## Self-review

**1. Cobertura del diseño.** Banco y mensajes por ID, falla si falta (T1). Género, variables `{{1}}…`, plural de "quién se lo regala" (BIEN-CHICO-PL, FINAL-CHICO-PL, PADRE-PREG-LINEA-PL), primer nombre (T2). Nada de noche 22–9 por zona del número, 90 s, "muy corto" 15 s / 8 palabras, 24 h, 4 y 8 días, 2 días (T3, T9). Ficha: nombre, apodo, género, edad, quién regala, canal A/B, hora, zona, temas, fotos con otros chicos, hasta 3 preguntas del padre con o sin línea; guion efectivo con temas sacados y fotos huérfanas mudadas (T4). Bienvenida y arranque por canal (T10). OP una vez si es muy corta (T7). Acuse con debounce y rotación en orden (texto vs audio, cápsula, después de un "no") (T3, T6, T7). Foto pegada con [No tengo] y botones propios, [Hoy no la como], K29 (T8). Seguir/mañana sin tope; [Paso] en todas (T8). Fin de capítulo: una más → cierre con sus botones → seguir con la entrada siguiente (T6, T8). Aviso antes de K39 y tranquila solo si contó (T6, T8). Preguntas del padre después de CIERRE-4 (T4, T6). Cápsula (T3, T7). Cierre final → extras → final y aviso al padre, canal B al día siguiente (T6, T8, T9). Ventana de 24 h → PREG-NUEVA una sola vez, no se acumulan (T6, T9). Recordatorios 4 y 8 días y marca (T9). Cierre solo a los 2 días (T9). Algo preocupante (T11). Lectura corrida (T12). Simulación con las conductas y controles pedidos (T13). README (T14). Revisión con test (T15). Panel (#34): T10. Sin huecos.

**2. Placeholders.** Ninguno: cada paso de código trae el archivo entero o el reemplazo exacto (T11 trae los fragmentos viejo → nuevo). El único texto a completar a mano es el mensaje del commit de arreglos de la T15, que depende de lo que encuentre la revisión.

**3. Consistencia de tipos y nombres.** `ItemGuion.principal.fotoDe` + `fotoDelItem` (T4) es lo que usan `flujo.ts`, `botones.ts` y `rafaga.ts`; `pregunta(item.clave)` en todos lados (el guion no guarda objetos). `Ctx` (T6) es el mismo en `rafaga`, `botones`, `reloj`, `sobrio`. `Estado.reenviar` (T5) lo prende `reloj.ts` (RECORD-B) y lo apaga `botones.ts`. `Estado.sobrioHasta` existe desde T5 y lo usan T11 (`sobrio.ts`) y las dos líneas de `reloj.ts`. Los IDs de mensaje que usa el código (`fijoA(e, 'B-SEGUIR')`, etc.) son `IdMensaje` (chequeados por `tsc` contra `IDS_REQUERIDOS`). El código y los tests de este plan se corrieron enteros antes de escribirlo (150 tests en verde; 800 chicos sin violaciones); las tareas 7 a 9 traen la versión de esos archivos antes de la tarea 11, también probada (117 tests en verde al cerrar la tarea 10).
