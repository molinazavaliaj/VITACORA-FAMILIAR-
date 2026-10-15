# Kids V2 · La conexión al entrevistador, para Joaquín (15/10/2026)

Rama `kids-conexion`, encadenada sobre `kids-datos` (PR #46, la propuesta de la base). Plan:
[`plan-conexion-bot.md`](plan-conexion-bot.md). Esquema: `supabase/CONTRATO.md`, «Vitácora Kids V2 por WhatsApp».

## Qué hace
- **El motor** (`fabrica/src/kids-v2/`, puro) viene de la rama `vitacora-kids` con tres agregados: la salida
  `recibido` (a qué pregunta fue cada mensaje, también lo que llega de noche y se procesa a las 9), `termino()` y
  `avance()`. Copia byte a byte en `entrevistador/src/kids-v2/nucleo/` (`npm run kids-v2-copiar-nucleo`; un test
  cuida que sean iguales).
- **El bot** (`entrevistador/src/kids-v2/`), con el molde de la Viaje V2: arranque por plantilla cuando el narrador
  pasa a `invitado`, entrante (guarda audio, foto, texto y botón en `respuestas`, transcribe, pasa el evento al motor
  y anota `clave_kids`), cola de envío con toma y compare-and-swap (chico o padre, plantilla, botones o texto; nada
  entre las 22 y las 9; nada de texto libre con la ventana de 24 h cerrada), cambios del panel (`cambios_panel`), marcas
  para Naza (mail a los socios), reloj cada minuto (`tickKids`) y reconciliación de lo que quedó sin clave.
- **Los frenos**: con fila en `kids_v2`, el flujo viejo, la V3 y la Viaje V2 del entrevistador no tocan al chico, y la
  fábrica no le arma ni le manda nada del libro de siempre (lista completa en el CONTRATO). Sin la migración aplicada,
  nadie es chico y todo sigue igual.
- `webhook.ts`: un botón ahora trae `citaA` (el `context.id`), que el motor necesita para ignorar botones viejos.
  Hoy solo lo lee la Viaje V2 para imágenes, así que no cambia nada para V3 ni el Familiar viejo.

## Cómo se probó
- Entrevistador `npm test`: 1119 tests y tipos en verde. Fábrica: kids-v2 y los frenos (325 tests), `tsc` limpio.
- Simulación del motor: 800 chicos, cero violaciones. Simulación del bot de punta a punta (`npm run kids-v2-simular`),
  con webhooks de Meta parseados de verdad, reintentos de Meta, envíos y base que fallan, transcripciones que
  fallan, cambios del panel y plantillas aprobadas tarde: 200 chicos (canal A y B), todos terminan, cero violaciones
  (mediana 30 días, máximo 138). Encontró 3 errores del bot, ya arreglados con su test.

## Para prenderlo
1. Tu OK a la base (PR #46) y Naza aplica la migración `20261016000000_kids_v2.sql`.
2. Cargar las 13 plantillas de [`plantillas-meta-kids.md`](plantillas-meta-kids.md) en Meta (español, Utilidad) y
   ponerlas en `WA_PLANTILLAS_KIDS_LISTAS` (nombres separados por coma, o `*`). Sin las de bienvenida, un chico no
   arranca y se avisa a los socios.
3. La compra de la web tiene que crear narrador, pedido y fila de `kids_v2` (otro PR, en `rediseno-web`).
4. Una prueba con un chico real (Naza) antes de abrir la venta.

## Lo que queda abierto
- El libro de Kids no existe todavía: un impreso de Kids queda quieto en la fábrica hasta que se programe.
- `esChicoKids` es una consulta más por cada mensaje entrante; si la base falla, ese mensaje se pierde igual que hoy
  con `esViajeroV2`. Si preferís, se reintenta una vez.
- Un envío que Meta aceptó pero respondió tarde (timeout) se reintenta y puede llegar dos veces; es el mismo caso que
  en la V3 y la Viaje V2.
- El filtro jsonb de `cambios_panel` (`.filter('cambios_panel','eq', json)`) se probó en la base falsa; conviene una
  prueba contra Supabase cuando esté la migración.
- Las tres preguntas de la propuesta de la base siguen abiertas (mismo WhatsApp en dos chicos, el padre que escribe
  en canal A, dónde vive el motor: acá quedó como copia byte a byte, igual que la Viaje V2).
