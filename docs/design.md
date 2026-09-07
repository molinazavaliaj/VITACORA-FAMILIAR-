# design.md — Sistema de diseño de Vitácora Familiar

> **Qué es este archivo:** los tokens y las reglas para construir CUALQUIER pieza
> —landing, contenido, libro, mails— sin volver a decidir nada. Copiar y pegar.
>
> **Fecha:** 2026-09-07 · Sesión de dirección de arte, Joaquín + Naza.
>
> **Dónde vive cada cosa:**
> - **Este archivo** = tokens y reglas de ejecución. Es lo que se lee para construir.
> - `docs/identidad-de-marca.md` = las decisiones de marca y **por qué** se tomaron.
> - `marca/Manual-de-marca-Vitacora-Familiar.pdf` = el manual visual presentable.
> - `marca/*.svg` = los archivos del logo, en vector.

---

## 1. El principio

**Minimalismo en escala de grises.** Negro sobre blanco, blanco sobre negro, y
nada más. El violeta existe pero es la excepción: aparece cuando algo tiene que
gritar, y por eso funciona.

Todo lo que en una marca normal se resolvería con color, acá se resuelve con
**grosor, tamaño y aire**. Si una pieza necesita un color para funcionar, la
pieza está mal compuesta.

---

## 2. Color

### Jerarquía (el orden importa)

| Prioridad | Color | Token | Rol |
|---|---|---|---|
| **1 — principal** | Negro | `#14140F` | El color de la marca sobre fondos claros |
| **1 — principal** | Blanco | `#FFFFFF` | El color de la marca sobre fondos oscuros |
| **2 — secundario** | Violeta | `#5D3FD3` | Solo casos especiales donde algo tiene que llevar color |
| **3 — estructura** | Escala de grises | ver abajo | Toda la jerarquía visual |

El negro **no es negro puro**: `#14140F` es levemente cálido. Eso evita el
aspecto frío de pantalla y hace que el blanco y negro se lea como tinta sobre
papel, no como una interfaz.

### La escala de grises

Derivada del negro base, manteniendo su temperatura para que ningún gris se vea
azulado. Contraste medido sobre blanco `#FFFFFF`:

| Token | Hex | Contraste | Para qué sirve |
|---|---|---|---|
| `--negro` | `#14140F` | 18.47 · AAA | Texto principal, titulares, el logo |
| `--grafito` | `#2B2B24` | 14.25 · AAA | Texto sobre fondos muy claros, énfasis |
| `--pizarra` | `#45453C` | 9.68 · AAA | Cuerpo de texto largo (más suave que el negro) |
| `--acero` | `#5F5F55` | 6.45 · AA | Texto secundario, epígrafes, metadatos |
| `--humo` | `#83837A` | 3.82 · AA solo texto grande | Etiquetas grandes, texto deshabilitado |
| `--ceniza` | `#AEAEA6` | 2.23 · **nunca texto** | Reglas divisorias visibles, bordes |
| `--niebla` | `#D4D4CE` | 1.49 · **nunca texto** | Líneas finas, separadores |
| `--bruma` | `#EBEBE7` | 1.20 · **nunca texto** | Fondos de bloque, cajas |
| `--papel` | `#F7F7F5` | 1.07 · **nunca texto** | Fondo alternativo al blanco |
| `--blanco` | `#FFFFFF` | — | Fondo principal |

**Regla dura:** de `--ceniza` para abajo **nunca va texto**, ni chico ni grande.
El público lee en el celular, muchas veces con sol y muchas veces con más de 50
años. Un gris clarito es elegante en el monitor del diseñador e ilegible en la
mano del cliente.

### El violeta y su par para fondo oscuro

`#5D3FD3` funciona **sobre blanco** (contraste 6.74 — cumple AA). **Sobre negro
no**: da 2.74, muy por debajo del mínimo de 4.5. El manual lo usa así en la
portada y en la pieza de Instagram, y ahí no se lee.

Por eso el violeta es **un par, no un color**:

| Token | Hex | Sobre qué | Contraste |
|---|---|---|---|
| `--violeta` | `#5D3FD3` | Fondos claros | 6.74 · AA |
| `--violeta-claro` | `#8F7BE0` | Fondos oscuros | 5.35 · AA |

Mismo tono (252°) y misma saturación: es el mismo violeta, aclarado lo justo
para que se lea. Nadie va a notar que son dos; todos habrían notado que no se
leía.

**Reglas del violeta:** máximo ~5% de la pieza · nunca dentro del logo · nunca
en el libro impreso · nunca dos acentos en la misma pieza. Sus usos legítimos
son cuatro: **un link, un subrayado, el botón principal, un dato destacado.**

### Datos técnicos del violeta

```
HEX   #5D3FD3
RGB   93, 63, 211
HSL   252°, 54%, 63%
```

**Pantone:** el manual del repo **no trae ningún código Pantone** — las 6
páginas solo especifican el HEX. Los equivalentes habituales para un violeta
azulado de esta familia son **PANTONE 2096 C** y **PANTONE 2725 C**, pero
ninguno es exacto y **no hay que darlos por buenos sin verificarlos contra una
guía física** (la conversión por software miente, sobre todo en violetas
saturados, que caen fuera del gamut CMYK).

**Y la buena noticia: no hace falta todavía.** El violeta nunca va al libro
impreso, así que el Pantone solo importa si algún día se hace papelería, packaging
o merch. No bloquea nada.

### Negro para imprenta

Lo que sí hay que fijar antes de mandar el libro a imprenta:

- **Texto y líneas finas → negro 100K** (solo la plancha de negro). Si se usa
  negro rico, cualquier mínimo desregistro entre planchas hace que el texto
  chico se vea con bordes de color.
- **Áreas negras grandes** (tapa, páginas oscuras) **→ negro rico**
  `C60 M40 Y40 K100`. El 100K solo, en una superficie grande, se ve gris lavado.

### Tokens listos para copiar

```css
:root {
  /* principales */
  --negro:         #14140F;
  --blanco:        #FFFFFF;

  /* escala de grises */
  --grafito:       #2B2B24;
  --pizarra:       #45453C;
  --acero:         #5F5F55;
  --humo:          #83837A;
  --ceniza:        #AEAEA6;
  --niebla:        #D4D4CE;
  --bruma:         #EBEBE7;
  --papel:         #F7F7F5;

  /* acento — el par */
  --violeta:       #5D3FD3;  /* sobre fondos claros */
  --violeta-claro: #8F7BE0;  /* sobre fondos oscuros */

  /* roles semánticos: usar ESTOS en el código, no los de arriba */
  --fondo:         var(--blanco);
  --texto:         var(--negro);
  --texto-suave:   var(--pizarra);
  --texto-menor:   var(--acero);
  --linea:         var(--niebla);
  --linea-fuerte:  var(--ceniza);
  --acento:        var(--violeta);
}

/* pieza en negativo: invertir los roles, no reescribir los componentes */
.oscuro {
  --fondo:        var(--negro);
  --texto:        var(--blanco);
  --texto-suave:  var(--niebla);
  --texto-menor:  var(--ceniza);
  --linea:        #2B2B24;
  --linea-fuerte: var(--pizarra);
  --acento:       var(--violeta-claro);
}
```

Usar siempre los **roles semánticos** (`--texto`, `--acento`) y nunca los
colores crudos. Así una pieza pasa de claro a oscuro agregando una clase, sin
tocar nada más.

---

## 3. Logo

### Las versiones que existen — y solo estas

| Archivo | Qué es | Cuándo se usa |
|---|---|---|
| `marca/logo-campo-vf-negro.svg` | El Campo V·F completo, tinta sobre claro | La principal sobre fondos claros |
| `marca/logo-campo-vf-blanco.svg` | El Campo V·F completo, blanco sobre oscuro | La principal sobre fondos oscuros |
| `marca/toroide-negro.svg` · `toroide-blanco.svg` | Solo los anillos, sin letras y sin eje | Todo lo que sea chico |
| `marca/avatar-toroide-negro.svg` · `-blanco.svg` | El toroide centrado en un cuadrado 512 | Avatar de IG, favicon |
| `marca/lockup-horizontal-negro.svg` · `-blanco.svg` | Toroide solo + VITÁCORA FAMILIAR en dos líneas | Encabezados de web y documentos |

### ❌ Versiones eliminadas — no se usan nunca

Decisión de Joaquín en la sesión del 07/09, corrigiendo el manual:

- **El reducido de 3 anillos: eliminado.** Los anillos son siete. Un toroide de
  tres es otro logo.
- **El apilado: eliminado.**
- **La portadilla del libro con el reducido: eliminada.** Va el principal o va
  el toroide solo. No hay tercera opción.

**La regla, en una línea:** o el **Campo completo**, o el **toroide solo**.
Nada intermedio.

El lockup horizontal se conserva **en su disposición**, pero con el **toroide
solo** en lugar del campo reducido. Ya está así en los SVG.

### Reglas de uso

- **Siempre monocromo.** Nunca en violeta, nunca dos colores adentro, nunca
  degradados, nunca sombras ni brillos.
- **Nunca estirado ni inclinado.** Nunca cambiar la tipografía de las iniciales.
- **Área de respiro:** alrededor del logo, un espacio libre igual a la altura de
  la V. Nada lo toca.
- **Tamaños mínimos:** Campo completo **120 px de alto** · toroide solo **24 px**.
  Por debajo de 120 px no se usa el Campo: se usa el toroide.

### ⚠️ Dos cosas técnicas a saber sobre los SVG

1. **Los que llevan letras dependen de Playfair Display.** Los archivos traen un
   `@import` de Google Fonts, así que abiertos en un navegador se ven bien. Pero
   **para imprenta o PDF hay que vectorizar el texto** (convertir las letras a
   trazos), o la imprenta las va a sustituir por otra fuente. El toroide solo no
   tiene este problema: es geometría pura y sirve en cualquier lado.
2. **Grosor mínimo de línea en papel: 0.25 mm.** Los siete anillos están muy
   juntos; impresos más finos que eso se empastan y el logo queda como una
   mancha gris. Como el Campo mide mínimo 120 px (≈31 mm de alto), a ese tamaño
   el trazo cae en ~0.3 mm y pasa. **Por debajo de ese tamaño en papel, va el
   toroide solo** — que tiene el trazo más grueso.

---

## 4. Tipografía

| Tipografía | Rol | Cómo se usa |
|---|---|---|
| **Playfair Display** | Iniciales del logo, titulares, nombres propios, citas | Peso 500 para el logo. **Nunca en textos largos** |
| **Archivo** | Microtipografía: etiquetas en mayúsculas, folios, créditos | Tracking `0.2em`–`0.34em`. Siempre chiquita, siempre con aire |
| **Source Serif 4** | Cuerpo del libro y todo texto largo | Peso 300–400, interlineado generoso |

```css
--fuente-titulo: 'Playfair Display', Georgia, 'Times New Roman', serif;
--fuente-micro:  'Archivo', Helvetica, Arial, sans-serif;
--fuente-cuerpo: 'Source Serif 4', Georgia, 'Times New Roman', serif;
```

**La regla que las mantiene en su lugar:** Playfair grita, Archivo susurra,
Source Serif habla. Si una pieza tiene dos que gritan, sobra una.

Ya están implementadas tal cual en `fabrica/src/libro/plantilla-html.ts`.

---

## 5. Las frases y dónde va cada una

| Slot | Frase |
|---|---|
| **Slogan** | En cada familia hay un libro sin escribir. |
| **Descriptor** | Un biógrafo entrevista y escribe el libro de una vida. La de tu papá, la de tu abuela, la tuya. |
| **Gancho de campaña** | Hay preguntas que un día ya no se pueden hacer. |
| **Frase de la casa** | Para las vidas que merecen su propio libro *(sin punto final)* |
| Orgullo editorial | Una vida merece un libro. |

**Slogan y descriptor van siempre juntos** en cualquier pieza donde el producto
todavía no se explicó. El slogan solo puede leerse como "me toca escribirlo a
mí"; el descriptor lo desarma.

**❌ Eliminada:** *"Se lee con los ojos y se escucha con su voz"*. No se usa más,
en ningún lado. Ver la tarea pendiente en la sección 7.

El porqué de cada frase está en `docs/identidad-de-marca.md`.

---

## 6. Reglas de composición

- **El aire es el material.** Si dudás entre agregar algo y sacar algo, sacá.
- **Una sola voz por pieza.** Un titular grande, todo lo demás en su lugar.
- **La jerarquía se hace con tamaño y grosor, no con color.** Es lo que
  reemplaza al vino: donde antes había un acento de color, ahora hay un salto de
  escala o un peso distinto.
- **El violeta toca una sola cosa por pieza.** Si toca dos, no destaca ninguna.
- **Nunca caras humanas generadas por IA.** La promesa de la marca son las voces
  y las historias reales; un abuelo de IA en un anuncio la contradice.
  Ornamentos, texturas y objetos sí se pueden generar. Dentro del libro de un
  cliente, jamás imágenes generadas de su familia.
- **Las fotos de familia van en blanco y negro parejo.** Empareja calidad
  despareja (escaneos, WhatsApp) y da identidad.

---

## 7. Pendientes de implementación

Estos cambios tocan `fabrica/`, que es **carpeta de Naza** — por la regla de oro
del repo no se tocan desde acá. Quedan especificados línea por línea para que
los aplique él (tarea 3.7 del ROADMAP):

| Archivo | Línea | Cambio |
|---|---|---|
| `fabrica/src/libro/plantilla-html.ts` | 293 | `--papel: #faf7f1` → `#FFFFFF` |
| `fabrica/src/libro/plantilla-html.ts` | 294 | `--tinta: #1c1917` → `#14140F` |
| `fabrica/src/libro/plantilla-html.ts` | 890 | `acento = '#6e2618'` → `'#14140F'` |
| `fabrica/src/libro/plantilla-html.ts` | 494, 642 | medallón `#faf7f1` → `#FFFFFF` |
| `fabrica/src/libro/plantilla-html.ts` | 258 | `colorPuntos = '#6e2618'` → `'#14140F'` |
| `fabrica/src/libro/plantilla-html.ts` | 649 | **borrar** la frase "se lee con los ojos y se escucha con su voz" |
| `fabrica/test/plantilla.test.ts` | 56, 63 | actualizar el `#6e2618` esperado |

**El código es de 5 líneas; el trabajo real es otro.** El vino se usaba en **15
lugares** como jerarquía visual (folios, medallones, reglas, el borde de las
citas). Con el acento en negro, todo eso queda al mismo peso que el texto y el
diseño se aplana. Hace falta **una pasada de diseño en monocromo** que recupere
esas jerarquías con grosor, tamaño y aire — y verla impresa antes de darla por
buena.

Los grises de la sección 2 son la herramienta para eso: `--acero` y `--humo`
para lo secundario, `--niebla` para las reglas finas.
