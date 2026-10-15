# Kids V2 · Plan de la conexión al entrevistador (15/10/2026)

Rama `kids-conexion` (sale de `kids-datos`, PR #46: la propuesta de la base). Worktree
`C:\Users\Naza\Desktop\VITACORA FAMILIAR-kids-conexion`. PR para Joaquín, **nunca directo a main**.

**Fuente de verdad del esquema:** `supabase/CONTRATO.md`, sección «Vitácora Kids V2 por WhatsApp», y la migración
`supabase/migrations/20261016000000_kids_v2.sql`. **Molde:** la Viaje V2 (`entrevistador/src/viaje-v2/`), que ya
corre en producción: mismo estilo de archivos, nombres, comentarios, compare-and-swap, toma, cola, reloj y pruebas.

**Reglas que no se rompen**
- Ningún texto para personas se escribe en el código. Todo lo que le llega a un chico o a un padre sale del motor
  (`banco.json`, generado desde los md aprobados) o de las plantillas de `docs/kids/v2/plantillas-meta-kids.md`.
  Los avisos a los socios (`deps.avisar`) sí se escriben acá, como en la Viaje V2.
- No se editan los md aprobados de `docs/kids/v2/` (banco, mensajes, flujo, decisiones, plantillas).
- El motor es puro (`fabrica/src/kids-v2/`). Los cambios al motor se hacen en la fábrica y se copian byte a byte al
  entrevistador (`npm run kids-v2-copiar-nucleo`); nunca se edita la copia a mano.
- Sin la fila en `kids_v2` (o sin la migración: 42P01 / PGRST205) todo sigue exactamente como hoy.
- Tests en verde en `fabrica` (`npx vitest run test/kids-v2`, `npx tsc --noEmit -p .`) y en `entrevistador`
  (`npm test`, que corre tipos y vitest). La simulación de 800 chicos del motor tiene que seguir con cero violaciones.

## T1 · El motor: `recibido`, `termino` y el id del evento (fábrica)

Archivos: `fabrica/src/kids-v2/motor/tipos.ts`, `motor.ts`, `motor/*.ts` donde haga falta, tests nuevos en
`fabrica/test/kids-v2-recibido.test.ts`.

1. Los eventos `respuesta` y `boton` llevan un `id?: string` opcional (el `wa_message_id`). Nada cambia si no viene.
2. Salida nueva `{ tipo: 'recibido'; id: string; clave: string }`: una por cada evento `respuesta` o `boton` **con
   id** cuando el motor lo aplica de verdad (también al reprocesar los nocturnos a las 9, y una sola vez: al guardar
   un evento en `nocturnos` no sale; sale cuando se aplica). `clave` = a qué item respondió, con lo que el motor
   esperaba en ese momento:
   - la principal o pregunta del padre o extra en curso (`fase.clave`, o `e.extra` cuando corresponde), con el id de
     la rama si tocó un botón propio (el mismo id que el motor usa para ese mensaje: `K12-R1`, …), la foto
     (`K10-FOTO` / `K16-FOTO`, igual que en `fotosVencidas`), el cierre (`CIERRE-n`), la una-más, `EXTRAS`…;
   - `∅` (`SIN_CLAVE_KIDS`, exportada) si el evento no hizo nada (botón viejo descartado por `aMensaje`, algo que
     llega con la fase `terminado`, un botón que no corresponde).
   La regla exacta la decide quien implementa leyendo el motor; tiene que quedar documentada en un comentario y
   cubierta por tests (una principal, una rama, una foto, una foto mudada, una extra, la pregunta del padre, un
   botón viejo, un nocturno, algo después del final).
3. `termino(estado): boolean` exportada desde `motor.ts`: fase `terminado`, o `retenido` con `luego.tipo ===
   'terminado'`; **y** `terminoPadre === null`. Tests: canal A, canal B (al día siguiente), cierre solo a los 2 días
   con PREG-NUEVA sin tocar (A y B).
4. `avance(estado): { capitulo: number; preguntasPadreAbiertas: boolean; terminado: boolean }` exportada:
   `capitulo` = cap del item en `cursor` (0 si `cursor < 0`); `preguntasPadreAbiertas` = la misma condición que usa
   el evento `ficha` para aceptar `preguntasPadre` (no la dupliques: sacala a una función compartida);
   `terminado` = `termino(estado)`.
5. `npx tsx scripts/kids-v2-simular.ts` y `npx tsx scripts/kids-v2-lectura.ts` siguen dando lo mismo (si cambian
   los md generados, que sea solo porque aparece la salida nueva, y decirlo). Los controles de la simulación
   (`controles.ts`) suman uno: cada evento con id produce exactamente un `recibido`.

## T2 · Copia del núcleo, configuración y fila (entrevistador)

1. `entrevistador/scripts/kids-v2-copiar-nucleo.ts` (como el de viaje, pero **recursivo**: `kids-v2` tiene la
   subcarpeta `motor/`) → `entrevistador/src/kids-v2/nucleo/`. Script `kids-v2-copiar-nucleo` en `package.json`.
   Test `test/kids-v2/copia-nucleo.test.ts` como el de viaje (byte a byte, y que no sobre nada). Si los archivos de
   la simulación (`corrida`, `lectura`, `conductas`, `controles`, `simulacion`) arrastran imports que el
   entrevistador no tiene, se excluyen de la copia con una lista explícita y el test lo refleja.
   Revisá que `tsconfig.check.json` del entrevistador compile la copia.
2. `entrevistador/src/config.ts`: `PLANTILLAS_KIDS` (los 13 nombres, `idiomaMeta: 'es'`) y
   `plantillaKidsLista(nombre, env)`, que lee `WA_PLANTILLAS_KIDS_LISTAS` (lista separada por comas de nombres, o
   `*` para todas). Test.
3. `entrevistador/src/kids-v2/filas.ts`: igual que `viaje-v2/filas.ts` sobre `kids_v2` (`esChicoKids`,
   `chicosKids`, `leerFila`, `listarFilas`, `crearFila` no hace falta: la crea la web), con CAS sobre `version`,
   toma/soltar. Además `conReintento` tiene que poder poner en la misma escritura `avance`, `despertar_at`,
   `termino_at`, `marcas`, `cambios_panel`/`cambios_error`, y la escritura que aplica `cambios_panel` lleva la
   condición extra `cambios_panel IS NOT DISTINCT FROM <lo leído>` (en PostgREST: `.is('cambios_panel', null)` o
   `.eq('cambios_panel', valor)` según corresponda; si no se puede expresar bien, usar `.filter('cambios_panel',
   'eq', JSON.stringify(v))` y testearlo en la base falsa).
4. `entrevistador/src/kids-v2/tipos.ts`: `EstadoBotKids = { motor: Estado; salida: Saliente[]; enviados:
   {envio, wamid}[] (últimos 200); vistos: string[] (200); fallosEnvio; avisoFallos }`. `Saliente` = el `Enviado`
   del motor más `destino` ya resuelto no hace falta: se resuelve al mandar.
5. `deps.ts` / `deps-reales.ts` como en viaje: `wa.texto`, `wa.botones` (`enviarBotones`, respuestas rápidas),
   `wa.plantilla`, `wa.descargar`; `transcribir` en es-AR; `avisar`; `ahora`.

## T3 · El bot: entrante, envío y reloj (entrevistador)

`entrevistador/src/kids-v2/{motor.ts, entrante.ts, enviar.ts, reloj.ts}`.

- **Una función que guarda un paso** (`motor.ts`): recibe la fila y el resultado de `paso()` y arma el cambio:
  `estado.motor` nuevo, la cola con los `mensaje` nuevos (sin repetir `envio`), `avance(motor)`,
  `despertar_at = proximoDespertar(motor, ahora)`, `termino_at` si `termino(motor)` y no estaba, `marcas` con las
  nuevas (`{motivo, detalle, at}`). Después de que la escritura ganó: cada `recibido` → `respuestas.clave_kids` por
  `wa_message_id`; cada marca → `deps.avisar` (clave `kids-<narrador>-<motivo>-<n>`); `silencio-8-dias` →
  `narradores.alerta_silencio = true`; si terminó → `narradores.estado` `activo → completado`.
- **Arranque** (en el reloj): narrador `invitado` con `estado` null. Si `WA_PLANTILLAS_KIDS_LISTAS` no tiene las de
  bienvenida del canal (A: `kids_bienvenida`/`_plural` y `kids_aviso_padre`; B: `kids_bienvenida_padre`), no
  arranca y avisa a los socios una vez. Si están: `nuevoEstado(ficha con cambios_panel aplicado)`, `paso(inicio)`,
  `empezo_at`, narrador `invitado → activo`, y drenar.
- **Entrante** (desde `procesar.ts`, antes de V3 y Viaje V2; narrador con fila y no `pendiente_pago`): misma cola
  por chico que viaje, dedupe con `vistos` y `yaLlego`, `marcarRespondido`. Guarda como viaje (`guardarAudioV3`,
  `guardarFotoV3`, fila en `respuestas` con `wa_message_id`, `clave_kids` null), transcribe (dos intentos), arma el
  evento: audio → `{respuesta, contenido:{audio, seg, transcripcion}, id}`; foto → `{respuesta, foto, id}`; texto →
  `{respuesta, texto, id}`; botón → `{boton, boton: texto, aMensaje: envio de citaA (de enviados), id}`. Aplica
  `paso` con CAS, guarda (arriba) y drena. Un audio que no se pudo bajar: aviso a los socios y fila nada (el motor no
  tiene "audio malo": no se inventa uno).
  Antes del arranque (estado null): se guarda la fila con `∅` y se avisa a los socios; no se contesta.
- **Envío** (`enviar.ts`, como viaje): toma, de a uno, CAS para sacar de la cola e insistir. Destino `chico` →
  `narradores.telefono_whatsapp`; `padre` → `kids_v2.telefono_padre`. `plantilla` → `wa.plantilla` (si
  `plantillaKidsLista` no la tiene: queda, aviso a los socios); si no, con botones → `wa.botones`, sin botones →
  `wa.texto`. Texto libre con la ventana de 24 h de ESE número cerrada (por lo que sabemos: `motor.ultimaEntrada`
  para el número de las preguntas; el padre en canal A nunca escribe al bot) → no se manda, queda, y aviso a los
  socios: el motor no debería pedirlo nunca. Cada envío: fila en `envios` (`tipo 'kids'`) y `{envio, wamid}` en
  `enviados`. Fallos: como viaje (`fallosEnvio`, aviso a los 3).
- **Cambios del panel**: en el reloj y en cada entrante, si `cambios_panel` no es null, se aplica primero como
  evento `ficha` (CONTRATO, «Cambios del panel»). Si `paso` tira: `cambios_error` con el mensaje, `cambios_panel`
  null, aviso a los socios. Si traía `preguntasPadre` y `avance.preguntasPadreAbiertas` era false: se aplica el
  resto y `cambios_error = 'preguntas-cerradas'` (código, no texto: el panel elige qué mostrar).
- **Reloj** (`tickKids`, cada minuto junto al de viaje en `scheduler.ts`/donde se llame `tickViajeV2`): filas con
  `termino_at` null y `despertar_at <= ahora` (o con cola sin vaciar, o `cambios_panel` no null, o sin arrancar),
  `paso(reloj)`, guardar, drenar. Salta `contexto.simulacion === true`. Reconciliar: filas de `respuestas` con
  `clave_kids` null de más de 5 minutos y `wa_message_id` no visto → se pasan al motor como en viaje.

## T4 · Que lo viejo no toque a un chico (entrevistador, fábrica)

Todo con la fila de `kids_v2` (sin migración: nadie es Kids).
- `entrevistador/src/flujo/procesar.ts`: el desvío a Kids antes del de Viaje V2.
- `entrevistador/src/flujo/scheduler.ts`: `narradoresEn` saca también a los chicos.
- La entrada a la V3 (`entraALaV3` en `config.ts`, `v3/pasar.ts` y donde se cree una fila de `entrevistas_v3`):
  un chico nunca entra.
- `mail/no-llega.ts` y cualquier mail o aviso del flujo viejo que se dispare por narrador: no a un chico.
- `fabrica/src/worker.ts`: `narradoresConKids` al estilo de `fabrica/src/v3/candado.ts`, y saltar a los chicos en el
  anticipo, los hitos de cierre (mail «terminó», recordatorios 3/7/14, cierre solo a 30 días), estructura,
  previsualización, paquete y escritor V3. Tests.
- Buscá con grep cualquier otro camino que lea `narradores` por estado y mande algo; nombralo en el PR.

## T5 · Simulación de punta a punta con falsos (entrevistador)

`entrevistador/test/kids-v2/` con `deps-prueba.ts` (como el de viaje, sobre `test/v3/base-falsa.ts`, con
`kids_v2` en la base falsa): un chico canal A y uno canal B de punta a punta (compra → arranque → respuestas por
audio, foto, texto y botones → cambios del panel → silencio con recordatorios → final → `termino_at`, `completado`,
`clave_kids` en todas las filas). Casos: botón viejo, mensaje de noche, plantilla no aprobada, fallo de envío,
reintento de Meta, mensaje antes del arranque, padre que cambia la hora, preguntas del padre tarde. Script
`npm run kids-v2-simular` (solo en memoria; nada de `--real` todavía).

## T6 · Docs y PR

- `docs/kids/v2/conexion-para-joaquin.md` (nuevo): qué hace la conexión, cómo prenderla (migración, plantillas,
  `WA_PLANTILLAS_KIDS_LISTAS`), qué falta (la compra de la web crea la fila: otro PR en `rediseno-web`).
- Ajustar el CONTRATO si la implementación cambió algo de la propuesta.
- PR a `main` para Joaquín, encadenado sobre #46.
