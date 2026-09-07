# Flujo de experiencia y estrategia de monetización

> **Estado: A DEFINIR.** Tema abierto por Joaquín el 2026-09-07. Este documento
> junta el material masticado para esa sesión: lo que ya está resuelto sin que lo
> supiéramos, los números que ya existen, y las decisiones a tomar.
>
> **No hay decisiones tomadas acá todavía.** Va después de los layouts del libro
> en el orden de trabajo (punto 3.7 del ROADMAP).

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

## 6. La tensión que hay que resolver a propósito

`GASTOS.md` tiene una **regla acordada el 05/09**: *"no tocar el modelo hasta
tener los datos de los 3 pilotos"*. Y la duda que la originó (Naza) es
exactamente la que plantea Joaquín ahora.

**La salida no es romper el acuerdo ni esperar de brazos cruzados:**

- **Diseñar el flujo completo ahora** — los momentos de venta, la pantalla de
  cada uno, los upsells, el panel multi-narrador. Todo eso hay que construirlo
  igual, y hacerlo ahora no compromete ninguna decisión.
- **Dejar configurable CUÁNDO se cobra**, igual que el precio ya es configurable
  por región. Que mover el cobro del día 30 al día 3 sea cambiar un valor, no
  reescribir el producto.
- **Decidir el cuándo con los datos de los pilotos**, como estaba acordado.

Así se avanza sin apostar a ciegas y sin romper lo que los dos ya habían firmado.

---

## 7. Decisiones a tomar en la sesión

1. **Panel multi-narrador:** ¿se arregla ahora el `limit(1)` o se deja para
   después de los pilotos? (Recomendación: ahora — es barato y es la venta más
   barata que vamos a tener.)
2. **¿Cuál es el momento de cobro por defecto?** A, B, C o D.
3. **¿Se construye la previsualización temprana** que haría posible la opción C?
4. **¿Cuáles de los seis upsells entran en la v1** y cuáles quedan para fase 2?
5. **¿Se reabre la decisión de la estética elegible del libro**, que la paleta
   cerró? Es un upsell contra una decisión de marca: hay que elegir a propósito.
6. **¿Cómo se ordena el flujo de registro** para que anotar a un segundo familiar
   sea obvio y no un callejón?
