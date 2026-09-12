# Flujo de experiencia y estrategia de monetización

> **Estado: DECIDIDO el 2026-09-10.** Abierto por Joaquín el 07/09, cerrado en la
> sesión del 10/09. Las decisiones están al final (§7); lo de arriba es el análisis
> que las sostiene y se deja como registro del porqué.
>
> **Manda sobre:** el diseño de la landing y del panel del usuario.

---

## 1. El problema, en una línea

**Nuestros clientes queman tokens durante 30 días antes de poner un peso.**

Es el riesgo estructural del modelo. Todo este documento existe para responder
una sola pregunta: **¿cuál es el momento más temprano en que alguien puede pagar
sin romper la promesa de "probá gratis"?**

---

## 2. Lo que ya está resuelto (y no lo sabíamos)

**La base de datos ya soporta varios narradores por familia.** `narradores` tiene
`familia_id` como FK, y `pedidos` lleva `familia_id` **y** `narrador_id` — o sea
un pedido por libro, no por cuenta. Martina se registra una vez y puede tener el
libro de su papá, el de su suegra y el de su tía.

**No hay cambio de esquema. No toca `supabase/CONTRATO.md`.**

### ⚠️ Pero el tablero descarta todos menos el primero

Las cuatro páginas del tablero hacen `narradores[0]` con `.limit(1)`:

```
web/src/app/tablero/page.tsx:82,89
web/src/app/tablero/saludos/page.tsx:56
web/src/app/tablero/nombres/page.tsx:62
web/src/app/tablero/descarga/page.tsx:47
```

Si alguien anota a un segundo familiar, **ese narrador no aparece en ningún lado
y no salta ningún error**: simplemente no existe para ella. Hoy se arregla
agregando un selector de narrador; con clientes reales encima son cuatro páginas,
rutas y estados a la vez.

**Y es una palanca de venta, no solo un arreglo:** el segundo libro es la venta
más barata que vamos a tener. No hay costo de adquisición, ya confía, ya vio el
resultado. Un tablero que muestre "Osvaldo ✓ terminado — ¿querés empezar con
alguien más?" convierte solo.

---

## 3. Los números que ya tenemos

De `GASTOS.md`, acordados el 2026-09-05:

| Concepto | Costo |
|---|---|
| Entrevista de 30 días (cerebro + Whisper) | ~USD 3-4 |
| Libro + audiolibro | ~USD 5 (**solo se gasta si paga**) |
| WhatsApp (Meta) | ~USD 1-2 |
| **Total de un cliente que completa y compra** | **~USD 9-11** |
| **Costo promedio de un usuario gratis** | **~USD 2-4** (muchos abandonan temprano) |

**El umbral:** el freemium cierra si convierte **más de ~1 de cada 10**. Con ads
encima, más de **1 de cada 7**.

**El hallazgo que respalda la intuición de los upsells** — de los escenarios ya
calculados por cada 100 registros traídos por ads:

| Compran de 100 | Solo digital a 49€ | Con escalón impreso a 99€ |
|---|---|---|
| 10 | **−230€ (pérdida)** | −80€ (casi empata) |
| 20 | +260€ | **+660€** |
| 30 | +670€ | **+1.300€** |

**El upsell no es un extra: es lo que hace viable la pauta.** A 49€ solo-digital
hay que convertir más de 1 de cada 7 o los ads pierden plata. Con ticket promedio
más alto, el mismo 20% de conversión pasa de +260€ a +660€.

---

## 4. Los momentos donde se puede pedir plata

Cinco, ordenados por cuánto se gastó antes de pedirla:

| # | Momento | Gastado hasta ahí | A favor | En contra |
|---|---|---|---|---|
| **A** | **Al registrar**, antes de que el abuelo acepte | ~USD 0 | Cero riesgo. Filtra curiosos | Rompe "probá gratis". Y si el abuelo dice que no, hay que devolver — con el desgaste que eso trae |
| **B** | **Al aceptar el narrador** (dijo que sí, aún no contó nada) | ~USD 0.10 | El "sí" del abuelo es el momento de mayor alivio de ella | Todavía no vio nada del producto |
| **C** | **Con el primer audio** (día 2-3) | ~USD 0.30 | **Ya escuchó la voz de su papá contando algo que no sabía.** Deseo altísimo, costo casi nulo | Hay que tener una previsualización real que valga a esa altura |
| **D** | Al terminar las 30 respuestas | ~USD 3-4 | Emoción máxima. Es el diseño actual | Ya se gastó todo en quien no compra |
| **E** | Upsells después de comprar | — | Margen puro | Solo aplica a quien ya pagó |

### La opción C merece atención especial

El diseño actual asume que **el pico emocional es el día 30**. Probablemente no
lo sea. El pico es la **primera vez que ella escucha a su papá contando algo que
no sabía** — que pasa el día 2 o 3, cuando llevamos gastados **30 centavos**.

A esa altura ella ya tiene la prueba completa de que el producto funciona (él
aceptó, está contando, la voz está ahí) y todavía no gastamos casi nada. Pedir
la plata ahí es **diez veces más barato que en el día 30** y probablemente
convierta parecido.

**Lo que haría falta para poder cobrar en C:** que la previsualización valga sola
—una página del libro ya maquetada con lo que contó el día 1, en la estética
definitiva—. Es trabajo de la fábrica, pero es trabajo que **ya está hecho** (el
preview existe): es correrlo antes, no construirlo.

---

## 5. Los upsells sobre la mesa

Planteados por Joaquín. Ninguno decidido; todos van **después** del paquete base.

| Upsell | Qué es | Estado |
|---|---|---|
| **Cuadro con NFC** | Marco con la foto del narrador y un chip: acercás el celular y escuchás el audiolibro o leés el libro | Ya estaba mapeado como fase 2 en el spec. El chip cuesta centavos |
| **Impresión física** | El libro impreso y enviado | Fase 2. **Es el que cambia el negocio** (ver §3) |
| **Impresión a color** | Escalón sobre la impresión B/N | Depende de la anterior |
| **Más fotos** | Ampliar el cupo de fotos del libro | Barato de dar, alto valor percibido |
| **Elegir la estética del libro** | Variantes de tapa/interior | ⚠️ **Choca con la marca:** la paleta se cerró en blanco y negro sin colores de tapa. Si esto se vende, hay que reabrir esa decisión a propósito |
| **Mensajes de la familia sobre él** | Que ella y los demás escriban/graben sobre su historia, y eso entre al libro | Distinto de los saludos actuales: los saludos son para él, esto es *sobre* él |

**Sobre el último:** es el más interesante de los seis, porque **convierte el
libro en un objeto colectivo** — y cada familiar que escribe es alguien más que
quiere el libro. Es el único upsell que además trae ventas nuevas.

---

## 6. Las decisiones — 2026-09-10

### 6.1 · Pago directo por adelantado — ACTUALIZADO el 11/09

**El usuario paga al comprar.** Pago único, sin prueba gratis, sin tarjeta guardada.
El acceso al servicio es el acceso a algo ya pagado.

> **Historia de esta decisión:** el 10/09 se había acordado "tarjeta el día cero +
> prueba gratis hasta el capítulo 1". El 11/09 los dos socios lo simplificaron a
> pago directo. **La prueba gratis queda como experimento futuro:** cuando haya
> datos de venta, se evalúa si dar unos días de prueba vende más.

**Por qué directo:**
- Es el modelo más simple de construir: pago único en Mercado Pago / Stripe, sin
  tarjeta guardada ni período de prueba. Ya está implementado (PR #1).
- El costo de un curioso es **cero**: nadie entra sin pagar.
- La previsualización a la 3ª respuesta (el "anticipo") deja de ser la palanca de
  conversión y pasa a ser **el primer momento de alegría de quien ya pagó**: le
  llega por mail, sin login, con lo que su abuelo ya contó.

**Lo que queda pendiente de esta decisión:** el miedo de Martina ("¿y si mi papá
no quiere?") ahora se desarma **antes del pago**, en la landing. Por eso "cómo
funciona" y "solo tiene que mandar un audio" van segundo y tercero.

**El copy:** el CTA es **"Comprar el libro"** con microcopy *"Pago único · el libro
en PDF y el audiolibro con su voz"*. Ya está en `web/src/app/page.tsx`.

**Precios sin correlación entre monedas.** `PRECIO_EUR` y `PRECIO_ARS` son
independientes (ya es así en `web/src/lib/precios.ts`). Argentina puede ser más
barata para ser más accesible y vender más. La región la elige el comprador en el
paso 2 del checkout, y eso decide moneda, monto y pasarela (Stripe / Mercado Pago).

### 6.2 · Previsualización progresiva

El comprador ve **el libro creciendo** mientras su narrador responde, no solo al
final. Es lo que convierte la prueba en venta: al tercer día no se imagina el
producto, lo está leyendo.

### 6.3 · Panel multi-narrador AHORA

Se arregla el `limit(1)` ya, no después de los pilotos. Es prerequisito del panel
donde el usuario arma varios libros ("proyectos") desde la misma cuenta.

### 6.4 · Todos los upsells entran

Audiolibro + PDF, libro impreso B/N, libro impreso a color, y marcos con NFC.
**Se cobran antes de producirse**, y la entrevista de 30 días da el margen de
producción. Detalle en `GASTOS.md`.

**Fase 2:** que el usuario elija la estética del libro.

### 6.5 · Los saludos salen de la fase 1

El receptor del regalo ya no es el narrador sino quien compra, así que grabarle
sorpresas a él perdió sentido. Y en el caso del auto-narrador nunca lo tuvo.

**Ya ejecutado en `entrevistador/`** (el cierre ya no los entrega). **Pendiente
en `web/`** — ver §8. La tabla `saludos` **se deja en la base**: no cuesta nada y
la fase 2 puede revivirlos como material *sobre* el narrador para el libro.

### 6.6 · Fotos por capítulo — el problema abierto

Ver §8. Es lo único de este documento que todavía no tiene solución cerrada.

---

## 7. Lo que ya no aplica

- ~~"No tocar el modelo hasta tener los datos de los 3 pilotos"~~ (regla del
  05/09). **Dada de baja por los dos socios el 10/09.**
- ~~Freemium de 30 días~~ (01/09) → ~~tarjeta + prueba hasta el cap. 1~~ (10/09) →
  **pago directo por adelantado (11/09)**.
- ~~El CTA "Empezar gratis"~~ y ~~"Probar gratis"~~ → **"Comprar el libro"**.
- ~~Los saludos como canal de adquisición a 0€.~~ Los reemplazan los marcos NFC.

---

## 8. Fotos por capítulo — a resolver

Es el pendiente que destraba tanto el libro ilustrado como los marcos.

**Hoy:** `narradores.foto_url` guarda **una sola** foto, la de portada.

### Lo que hace falta

| Necesidad | Requisito |
|---|---|
| Fotos repartidas por capítulos del libro | Varias fotos, cada una con capítulo y epígrafe |
| Impresión del libro | ~300 ppp al tamaño de impresión (una foto de 10×15 cm pide ~1200×1800 px) |
| Marco enmarcado (20×25 cm) | ~2400×3000 px — el requisito más exigente |

### Recomendación

1. **Tabla `fotos` nueva** (`narrador_id`, `capitulo`, `storage_path`,
   `epigrafe`, `orden`) en vez de meterlas en `contexto`. Es una feature central
   ahora, no un dato suelto. **Toca `supabase/CONTRATO.md` → lo acuerdan los dos.**
2. **El momento de cargarlas es la previsualización.** Cuando ella ve el capítulo
   1 escrito, ahí aparece el hueco: *"¿tenés una foto de esta época?"*. Es
   contextual y llega justo cuando está más enganchada — mucho mejor que un
   formulario de 20 fotos el día cero.
3. **Subir el original, sin redimensionar.** El error clásico es que la web
   comprima antes de subir y después no alcance para imprimir. Validar la
   resolución **en la subida** y avisar en el momento, no cuando ya es tarde.
4. **Instrucciones en castellano, no en píxeles:** *"apoyá la foto en una mesa,
   con luz de día, sin flash y sin sombra encima"*. La mayoría son fotos de papel
   sacadas con el celular.
5. **Para el marco se elige una**, aparte de las del libro: es otro producto y
   otro recorte.
