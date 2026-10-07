# Diseño: la entrevista V3 en el WhatsApp de verdad

**Fecha:** 07/10/2026. **Rama:** `v3-produccion`, que sale de `v3` y ya tiene `main` adentro.
**Antecedente:** [`docs/v3/entrevista/plan-whatsapp.md`](../../v3/entrevista/plan-whatsapp.md), del 30/09. Este diseño lo reemplaza y le suma:
- el cazador;
- la segunda oportunidad;
- los idiomas `es-ES` y `ca`;
- los botones;
- el ritmo;
- el pase de los narradores que ya están en curso.

## Decisiones de Naza (07/10, no re-discutir)

| Tema | Decisión |
|---|---|
| Narradores en curso | **Dora** (día 3, 3 respuestas) y **Mariano** (día 8, 7 respuestas) pasan a la V3. **Imma** (0 respuestas) pasa a la V3 en **catalán**. |
| Lo que ya contaron | **Cuenta como contestado**: cada respuesta vieja se carga en la pregunta V3 que cubre, según una tabla de equivalencias que **aprueba Naza** antes del pase. |
| Usted → vos | **Sin aviso.** Dora deja de recibir el usted y la próxima pregunta le llega de vos. |
| Ritmo | **De a tandas por día.** A su hora sale la primera pregunta. Mientras contesta, las siguientes salen de corrido, cada una después de 3 minutos de silencio. Tope por día según el ritmo: `diario` 4, `dos_por_dia` 8, `seguido` sin tope. Si deja de contestar, retoma al día siguiente donde quedó. |
| Cómo se prueba de verdad | **Merge apagado.** El código entra a `main` sin cambiar nada para nadie: la V3 se prende por narrador. Orden: primero el número de Naza, después Dora, Mariano e Imma, y al final todos los nuevos. |

Fuera de esto:
- Iñaki (Vitácora de Viaje) sigue por su flujo.
- Los dos "Naza" pausados del piloto manual no se tocan.

## Arquitectura

```
entrevistador/src/v3/
  nucleo/          copia EXACTA de fabrica/src/v3/entrevista/* + fabrica/src/v3/ficha.ts
                   (test: falla si la copia difiere del original, byte a byte)
  estado.ts        leer/guardar la fila de entrevistas_v3, con versión (compare-and-swap)
  turno.ts         el motor de un turno, portado de fabrica/scripts/v3-entrevista-turno.ts:
                   responder, tocarBoton, cerrarRespuesta, avanzar y cazarAlCerrar
  entrante.ts      audio / botón / texto / imagen de un narrador V3 (bifurca desde procesar.ts)
  reloj.ts         tick de 1 minuto: cierra respuestas tras 3' de silencio; tanda diaria; M8
  enviar.ts        mandar un turno: textos en orden, botones interactivos al último, plantilla fuera de 24 h
  cazador.ts       cliente de Anthropic (Opus 5.5) para cazarBloque; registra costo
  pasar.ts         alta V3 de un narrador (nuevo o migrado); usado por el script de pase
```

- **Por qué copiar y no compartir el código.** El entrevistador y la fábrica son dos Dockerfiles separados. Copiar no cambia cómo se publica nada, y el test de copia idéntica evita que las dos versiones se separen.
- **Cambio de configuración.** El entrevistador necesita `resolveJsonModule` en su `tsconfig`.
- **Dónde se bifurca.** En `procesar.ts`, antes de todo: antes de las fotos de la familia, de `manejarTexto` (que llama a un modelo) y de la evaluación con Opus. **Un narrador sin fila en `entrevistas_v3` sigue exactamente como hoy.**

## Datos (migración idempotente; la aplica Naza en Supabase)

### Tabla nueva `entrevistas_v3`

Tiene una fila por narrador, que es lo que **prende la V3**.

| Columna | Qué guarda |
|---|---|
| `narrador_id` | Clave primaria y referencia a `narradores`. |
| `idioma` | `es-AR`, `es-ES` o `ca`. |
| `ficha` (jsonb) | `nombre` (= `como_le_dicen`), `genero` y `quienRegala`. |
| `estado` (jsonb) | `respuestas: [clave, texto][]` en orden, `enviados`, `vueltas`, `acuse` pendiente, `esperando`, `tocoSi`, `bloqueActual`, `repreguntas`, `familia`, `cazador {gastoUsd, escenasContadas, registro}` y `charla` (los textos tal como salieron). |
| `version` (int) | Cada escritura es `UPDATE … WHERE version = n`. Si cambió, se relee y se reintenta. |
| `ultimo_audio_at` | Se pone cuando **se guarda la transcripción**, no cuando llega el audio. |
| `tanda_dia` (date, en su zona horaria) y `tanda_cuenta` (int) | Cuántas preguntas salieron en la tanda de ese día. |
| `enviando_hasta` (timestamptz) | Toma corta del turno (unos 2 minutos), para que dos ticks no manden lo mismo. |
| `creada_at`, `migrada_de` | `migrada_de`: `null` o `'v-vieja'`, más el `dia_actual` que tenía. |

### Columnas nuevas en `respuestas`

| Columna | Qué guarda |
|---|---|
| `clave_v3` (text, null) | La pregunta V3 (`CA1`, `RP~AM9`, `CA4~2`, `F:<id>`). Varios audios pueden tener la misma clave. |
| `wa_message_id` (text, único cuando no es null) | Para que el reintento de Meta no sume el mismo audio dos veces. |

### Reglas para la fila de `respuestas` de un narrador V3

- `pregunta_orden` pasa a ser **el número de llegada**, para no romper el `not null`. El libro viejo no lo lee nunca: lo frena el candado de la fábrica.
- `transcripcion` es el texto del audio.
- `texto_directo` queda para las marcas de botón (`⟦botón:Sí⟧`).

### Lo que no cambia

- `narradores.estado` sigue con las mismas transiciones: `activo` mientras dura la V3, `completado` después de FIN y `pausado` igual que hoy.
- `dia_actual` no se usa en la V3: queda congelado en el valor que tenía.

`supabase/CONTRATO.md` suma la sección "Entrevista V3". La escribe el entrevistador y la lee la fábrica.

## Cómo corre

**Al llegar un mensaje de un narrador V3:**

- **Audio.** Primero se descarta si es un duplicado (`wa_message_id`). Después se guarda la fila en `respuestas` y se transcribe en su idioma: `ca` → `language:'ca'`, con el vocabulario de `nucleo/transcribir.ts`. La transcripción se suma a la respuesta abierta (`sumarAudio`) y se pone `ultimo_audio_at`. **No se contesta nada.**
  - Si la transcripción falla después del reintento → M23.
  - Si el audio llega vacío o cortado → M23.
- **Botón** (llega como texto con el título del botón). Se resuelve con `alTocarBoton`:
  - Sí → M30, y espera audio en la misma pregunta.
  - No o Paso → cierra la respuesta y avanza **en el momento**, sin esperar los 3 minutos.
- **Texto escrito** → **cuenta como respuesta** (Naza 07/10): se suma a la respuesta abierta igual que un audio y corre el mismo reloj de 3 minutos. M22 sale **solo la primera vez** que escribe en toda la entrevista (`estado.m22Enviado`).
  - Excepción: si el narrador está `pausado`, el texto lo reactiva (`pausado → activo`) y se le reenvía la pregunta abierta.
- **Imagen.**
  - Si la abierta es FO1, la foto se guarda (como hoy en `fotos`, con `pregunta_orden` = número de llegada) y FO1 se da por contestada.
  - Si no, se guarda como foto suelta de la familia, igual que hoy.

**El reloj (cada 1 minuto, en `scheduler.ts`):**

1. **Cierre por silencio.** Busca narradores V3 que esperan respuesta, con `ultimo_audio_at` de hace más de 3 minutos y sin toma vigente. Para cada uno:
   1. Toma el turno.
   2. Llama a `cerrarRespuesta` (`mensajesDespues` → acuse).
   3. **Si la tanda no llegó al tope**, `avanzar` y manda: acuse, entrada, pregunta y M1 donde corresponde; los botones al último.
   4. **Si llegó al tope**, guarda el acuse pendiente y no manda nada más. La siguiente sale en la tanda de mañana, con el acuse pegado arriba.
2. **Tanda diaria.** A la `hora_preferida` del narrador, en su zona horaria, si no hay pregunta abierta en espera de audio y no terminó: arranca la tanda del día (`tanda_cuenta = 0`) y manda la siguiente.
   - Si la pregunta del día anterior quedó sin contestar, **no se reenvía** (Naza 07/10): se espera, y a los 2 días llega M8.
   - Fuera de la ventana de 24 h sale con plantilla.
3. **Recordatorio M8** (Naza 07/10). A los **2 días** sin respuesta a la pregunta abierta, una sola vez por pregunta. Fuera de la ventana sale con una plantilla de Meta con el texto de M8, una por idioma.
4. **Alerta de silencio a la familia.** Se usa la que ya existe (3 días), sin cambios.

**El cazador:**
- Cuando se cierra un cierre de bloque (`CIn`), `cazarBloque` corre **en segundo plano**:
  - con `claude-opus-5-5`;
  - con un tope de USD 3 por entrevista;
  - nunca tira error.
- El resultado se suma a `estado.repreguntas` con compare-and-swap y el costo va a `consumo_ia`, que es la tabla que ya usa `costos.ts`.
- Si llega tarde, la repregunta sale en el turno siguiente. Es lo mismo que hoy en la web, y ya estaba anotado como dudoso.

**Ventana de 24 h y plantillas:**
- Dentro de la ventana, todo sale como texto libre y con botones.
- Fuera de la ventana, la primera pregunta de la tanda sale con la plantilla del idioma:
  - `es-AR`: `pregunta_diaria_vos` (ya existe);
  - `es-ES` y `ca`: **plantillas nuevas que carga Joaquín en Meta**.
- Si la plantilla del idioma no existe, se le avisa a los socios y no se manda en otro idioma.

**El final:** AV11 y FIN se mandan sin esperar respuesta. Después de FIN → `completado`. No hay un mail de hito propio: el aviso de terminado lo sigue mandando la fábrica (`worker.ts`).

**El alta:**
- **Narradores nuevos:** al pasar de `acepto` a `activo`, si la V3 está prendida para nuevos (`V3_PARA_NUEVOS=1` en Railway; **apagada hasta que Naza diga**), se crea su fila y sale OR1 con M1. El idioma sale de `contexto.idioma`; si no hay, `es-AR`. El género sale de `contexto.genero` si la web lo manda; si no viene, el alta queda frenada (no sale nada) y se avisa a los socios para cargarlo con `npm run v3-pasar`.
- **Narradores en curso:** `npm run v3-pasar -- <narrador> [--idioma ca] --genero mujer [--aplicar]`.
  - Sin `--aplicar` muestra todo lo que haría.
  - Con `--aplicar`:
    1. crea la fila;
    2. carga las respuestas viejas en sus claves V3, según `entrevistador/src/v3/equivalencias.json` (aprobado por Naza);
    3. les pone `clave_v3` a esas filas de `respuestas`.
  - **No le manda nada en el momento.** La siguiente sale en su próxima tanda.

**Textos fijos del entrevistador.** Para narradores V3 no se usan los textos de `reactivar` ni los otros que están en usted. Se usan los del banco: M22, M23, M30, M8. Si hace falta algún texto que el banco no tiene, se le trae a Naza para aprobar.

## Fábrica

- **Candado.** `generar-paquete`, `anticipo`, `previsualizar` y `worker` no arman nada viejo de un narrador con fila en `entrevistas_v3`: lo saltean y les avisan a los socios.
- **Lector `de-base.ts`.** Lee `entrevistas_v3` y `respuestas` y devuelve `{ficha, familia, respuestas, charla}`, que es lo que espera `escritor/material/de-entrevista.ts`. Tiene test.
- **Fuera de este trabajo:** enchufar el escritor nuevo al worker le toca al chat del escritor (`docs/v5/escritor-fabrica/`).

## Errores

| Caso | Qué pasa |
|---|---|
| Meta reintenta el webhook | `wa_message_id` único: el segundo se ignora. |
| Dos ticks a la vez | Toma con `enviando_hasta` más `version`: uno solo manda. |
| Se cae Railway en el medio | Todo está en la base; el tick siguiente retoma. No hay `setTimeout` en memoria. |
| Falla un envío de WhatsApp | No se marca la pregunta como mandada; el tick siguiente reintenta. A los 3 fallos seguidos, aviso a los socios (le pasa hoy a Iñaki). |
| Audio mientras se manda un turno | Cuenta para la pregunta nueva, como dice el plan del 30/09. |
| El cazador falla o se pasa del tope | Ese bloque queda sin repreguntas; la entrevista sigue. |

## Pruebas

1. **Tests unitarios** de cada pieza, con base y WhatsApp falsos:
   - el test de copia idéntica;
   - turno, reloj, tanda, toma y duplicados;
   - botones y FO1;
   - ventana y plantilla por idioma;
   - el pase con equivalencias;
   - el candado y el lector de la fábrica.
   Además, que el flujo viejo siga verde: los 380 tests de hoy.
2. **Simulación de punta a punta en local.** Va contra la base real, con un narrador inventado ("Prueba V3") y WhatsApp falso. Los "audios" van como texto, sin gastar transcripción. Se corre la entrevista entera en los 3 idiomas. El cazador va con tope, en un solo idioma y avisando el costo antes.
3. **Revisión de otro agente** antes de mergear. Lo confirmado se arregla con test.
4. **Merge apagado.** Joaquín revisa la rama; Naza aplica la migración; merge a `main` con `V3_PARA_NUEVOS` apagado. Con la V3 apagada nadie nota nada.
5. **Prueba real.** Se pasa el número de prueba de Naza (`npm run v3-pasar`), Naza contesta un par de bloques por WhatsApp y se anota todo en `docs/v3/entrevista/prueba-whatsapp.md`.
6. **Recién ahí** se pasan Dora, Mariano e Imma (Imma después de que su plantilla catalana esté aprobada en Meta). Al final se prende `V3_PARA_NUEVOS`.

## Lo que necesita Joaquín
- Revisar la rama antes del merge.
- Cargar en Meta las plantillas `es-ES` y `ca`: pregunta del día y recordatorio.
- Que la web mande `contexto.idioma` y el género al comprar.
- Estar el día del merge.

## Qué NO hacer
- No cambiar textos del banco para que "anden" en WhatsApp: si algo suena mal, se anota y decide Naza.
- No tocar el flujo viejo para los narradores sin fila V3.
- No pasar a nadie sin el OK de Naza sobre las equivalencias.
- No prender `V3_PARA_NUEVOS` sin su OK.
- No copiar vidas reales a docs, commits ni prompts. La tabla de equivalencias es de preguntas, no de respuestas.
