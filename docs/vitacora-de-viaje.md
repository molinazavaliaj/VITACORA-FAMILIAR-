# Vitácora de viaje — spec (18/09/2026, Joaquín)

**Qué es.** Un producto aparte, con precio propio: el biógrafo acompaña un viaje. Cada
noche pregunta cómo fue el día, pide la foto del día con su historia, y al volver hay un
libro de viaje. Primer caso: un influencer que sale **en dos días**. El flujo es el real:
entra a la web, compra, paga, le llega el acceso al panel, y el bot le escribe.

## Lo que se reusa (casi todo)

Transcripción, repregunta, ritmo, recordatorio, panel (historias, fotos, compartir,
Encargar libro), pregunta de cierre, fábrica (capítulo = etapa). Lo distinto es **qué**
pregunta y **cómo se ordena**.

## Modelo de datos — sin migración

- `narradores.contexto.modo = 'viaje'`, `contexto.trato = 'vos'`, y
  `contexto.viaje = { salida: 'YYYY-MM-DD', vuelta: 'YYYY-MM-DD', etapas: [{ nombre, desde?, hasta? }],
  compania: 'solo'|'pareja'|'amigos'|'familia', proposito: 'recuerdo'|'compartir'|'publico',
  angulos: string[] }`. Las etapas pueden venir **sin fechas** (el viajero no siempre las
  tiene): las que tienen fecha se asignan por día; las que no, quedan disponibles para
  asignar desde el panel. `hora_preferida` es la hora de la **noche** (default 21:30);
  `zona_horaria` la del viaje.
- `pedidos.extras` lleva `tipo: 'viaje'` (además de `pdf: true`). La fábrica lo lee para
  el layout de viaje (mapa, números) cuando exista; hasta entonces produce el libro común.
- **Guion:** al aceptar (SÍ) se crean las preguntas — **una por día de viaje**
  (`orden` = día 1..N, `capitulo` = la etapa de ese día o "Por definir", `tipo` 'fija',
  `texto` = el ángulo base del día). El último día de cada etapa lleva el ángulo de
  cierre de etapa. La pregunta real de cada noche la escribe el modelo al mandarla
  (itinerario + ángulo + lo de ayer) y queda en `contexto.preguntasEnviadas` como hoy.
- **Etapas vivas:** desde el panel (historia → "Las etapas del viaje") se agregan, renombran
  o fechan etapas; las preguntas **todavía no enviadas** se reasignan al capítulo que
  corresponda. Las ya enviadas no se tocan.

## El bot

- **Bienvenida:** plantilla `bienvenida_viaje` (a crear en Meta). Hasta que esté
  aprobada, el viajero escribe primero "hola" al número y el bot responde la bienvenida
  como texto libre y pide el SÍ.
- **Cada noche**, a su hora: `pregunta_diaria_vos` (aprobada) fuera de la ventana; texto
  libre dentro. La pregunta rota el ángulo (lo mejor del día · una persona · una comida ·
  lo que salió distinto del plan · un lugar inesperado · qué pensaste de vos) y se apoya
  en lo de ayer. Siempre pide **la foto del día y qué pasaba cuando la sacó**.
- **Fotos por WhatsApp:** una imagen entrante se guarda en `fotos` con `capitulo` = la
  etapa del día vigente y `epigrafe` = lo que escribió abajo; el bot confirma "📷 Guardada".
  Puede mandar varias por día. También se suben desde el panel.
- **Fin:** el día de la vuelta es la última pregunta → la pregunta de cierre ("¿faltó
  algo?", hasta dos vueltas) → despedida → `completado`. Sin las 4 finales de biografía.
- **Lo que no cambia:** ritmo, recordatorio, silencio, mails de hitos.

## La compra (`/comprar/viaje`)

1. **Vos:** nombre, cómo te dicen, WhatsApp, correo.
2. **El viaje:** salida y vuelta · etapas (lista libre; las fechas son opcionales) · con
   quién · para qué es el libro (recuerdo / compartir / público) · qué querés que te
   pregunte siempre (chips) · a qué hora termina tu día · zona horaria.
3. **Pagar:** precio de la Vitácora de viaje (`PRECIO_VIAJE_ARS` / `PRECIO_VIAJE_EUR`).
   Términos. Mercado Pago / Stripe como siempre. Al pagar: narrador `invitado`, familia,
   mail de acceso al panel.

## El libro (Naza, cuando termine el primer viaje)

Capítulo = etapa (ya sale solo). Sumar: una página "el mapa del viaje" (ruta y fechas),
"los números" al final (días, ciudades, personas nombradas), una foto por día máximo en el
cuerpo y hoja de contactos al final, frases textuales al margen. Primera persona, en vos.

## Pendientes de cuenta

- El viajero va a la **lista de prueba de Meta** (5° de 5) hasta que haya número propio.
- **Token permanente (1.12)** pasa a urgente: un viaje de semanas no puede depender de
  renovar el token cada 24 h.
- Plantilla `bienvenida_viaje` en Meta (cuerpo en `entrevistador/PLANTILLAS.md`).
