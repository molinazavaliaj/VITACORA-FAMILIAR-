# Vitácora Familiar — Documento de diseño (v1)

**Fecha:** 2026-09-01
**Estado:** Aprobado por Naza sección por sección en sesión de brainstorming.
**Mercados de lanzamiento:** España y Argentina, en simultáneo.
**Equipo:** dos socios (Naza en Barcelona, socio en Argentina), cada uno con su propio Claude. Todo el diseño está partido en dos módulos con frontera limpia para programar en paralelo.

---

## 1. Visión

En 30 días de entrevistas por WhatsApp, capturar la historia de vida de un familiar mayor con su propia voz, y entregarle a la familia **el libro de su vida (PDF listo para imprimir) + el audiolibro contado por él mismo**, más los saludos grabados de sus seres queridos.

**Validación de mercado:** el nicho existe y factura — StoryWorth (email + texto, inglés, decenas de millones USD/año), Remento, HereAfter AI. No hay jugador fuerte en español. El público mayor hispano no escribe emails pero manda audios de WhatsApp todos los días: el canal y la voz son el foso competitivo.

## 2. Decisiones de producto (todas aprobadas)

| Decisión | Elección |
|---|---|
| Usuario v1 | El hijo/a (compradora, "Martina") le regala la bitácora a su padre/madre/abuelo mayor (narrador, "Don Roberto"). |
| Canal del narrador | WhatsApp (Cloud API de Meta). Cero instalación. Responde con audios de voz. |
| Entregable v1 | Libro digital (PDF imprimible) + audiolibro con la voz real, + capítulo bonus de saludos. |
| Modelo de negocio | Freemium puro: grabar los 30 días es gratis; se cobra al descargar el paquete final, con la emoción en su punto máximo. Pago único. |
| Entrevistador | 25 preguntas fijas (columna vertebral = índice del libro) + reconocimiento diario de la respuesta anterior + una sola repregunta si la respuesta viene pobre + días 26-30 adaptativos: el cerebro estudia toda la historia y pregunta lo que falta. |
| Saludos | Martina junta audios de seres queridos vía link compartible sin registro. Se entregan al narrador por WhatsApp al completar su última respuesta, y quedan como capítulo bonus del audiolibro + página del libro. |
| Comprador | Web propia: registro, tablero de progreso con audios escuchables, previsualización y pago. |
| Precio lanzamiento | 49 € (España) / equivalente ajustado en ARS (Argentina). Configurable sin tocar código. |

**Descartado para v1 (mapeado como fase 2):** cuadro físico con chip NFC (el chip cuesta centavos y abre un link a la historia alojada — se suma como upsell sin tocar el software), llamada telefónica con voz IA como upgrade premium, impresión física del libro bajo demanda, modelo híbrido de cobro (gratis 5 días → pago) si el freemium puro muestra demasiado usuario gratis sin convertir, otras voces dentro de la entrevista (descartado definitivo: rompe la intimidad del libro).

## 3. Flujo completo

**Día 0 — el regalo.** Martina entra a la web, ve la promesa ("En 30 días, el libro y el audiolibro de la vida de tu papá, contados con su propia voz"), registra a su papá: nombre, WhatsApp, hora preferida, y 3-4 datos de contexto (dónde nació, oficio, nombre de su esposa). Gratis. Don Roberto recibe un primer mensaje cálido que explica quién lo anotó y qué va a pasar, y pide consentimiento explícito ("Responda SÍ para empezar"). Sin ese sí, no arranca nada.

**Días 1-30.** Cada mañana a su hora: audio + texto con la pregunta del día. Él responde con uno o varios audios, cuando quiere. El sistema transcribe y guarda; al día siguiente el mensaje arranca reconociendo lo que contó. Si no responde: recordatorio suave a las 6-8 hs; si pasa el día, la pregunta se corre (los "30 días" son 30 preguntas, no 30 días calendario). A los 3 días sin señales, aviso a Martina: "un llamadito tuyo ayuda más que cualquier recordatorio nuestro" — la familia como aliada de retención.

**Mientras tanto, Martina** ve el progreso en la web ("Día 12 ✓ — hoy contó cómo conoció a tu mamá 🎧"), escucha los audios a medida que llegan (cada audio la acerca a pagar), y junta los saludos de los seres queridos con el link compartible.

**El cierre.** Última respuesta → el entrevistador se despide, agradece, y le entrega a Don Roberto los saludos de su familia, uno por uno, por WhatsApp. Él grabó 30 días para su familia sin saber que su familia grababa para él. (Es también la escena de contenido orgánico que convierte.)

**La compra.** Al completarse las 30 respuestas se genera la previsualización (portada, índice, capítulo 1 completo, 1 minuto de audiolibro). Martina paga → se genera el paquete completo → descarga PDF + audiolibro, disponibles en su cuenta para siempre.

## 4. Arquitectura

Tres piezas, dos dueños:

```
┌─────────────────────┐         ┌──────────────────────┐
│  ENTREVISTADOR      │         │  WEB COMPRADOR       │
│  (Socio 1)          │         │  (Socio 2)           │
│ · Webhook WhatsApp  │         │ · Landing + registro │
│ · Scheduler diario  │         │ · Tablero progreso   │
│ · Transcripción     │         │ · Saludos (link)     │
│ · Cerebro entrevista│         │ · Fábrica libro/audio│
│ · Fase adaptativa   │         │ · Stripe + MercadoPago│
└─────────┬───────────┘         └──────────┬───────────┘
          │        lee y escribe           │
          ▼                                ▼
┌──────────────────────────────────────────────────────┐
│  SUPABASE (compartido)                               │
│  Postgres (datos) + Storage (audios) + Auth (web)    │
└──────────────────────────────────────────────────────┘
```

- **Servicio Entrevistador:** Node/TypeScript chico (webhook + trabajos programados), desplegado en Railway o Fly.io.
- **Web Comprador:** Next.js en Vercel. Incluye la fábrica del libro/audiolibro y los pagos.
- **Un solo repo (monorepo) con propiedad exclusiva por carpeta** *(ajuste post-aprobación, mismo aislamiento y menos fricción)*: `/entrevistador` (socio 1), `/web` (socio 2), `/supabase` (migraciones — contrato compartido), `/docs` (specs y planes). Cada servicio se despliega desde su carpeta (Railway y Vercel soportan root directory). Nadie toca la carpeta del otro; solo `/supabase` requiere avisar antes de cambiar.
- **Ningún servicio llama al otro por API en v1.** Se comunican solo por la base de datos. Cada socio desarrolla y despliega sin coordinar, salvo cambios de esquema (migraciones versionadas, con aviso al otro).

### El contrato: esquema de datos (conceptual)

| Tabla | Escribe | Lee | Contenido |
|---|---|---|---|
| `familias` | Web | Entrevistador | Comprador: email, región (ES/AR). |
| `narradores` | Web (crea) / Entrevistador (estado) | Ambos | Nombre, WhatsApp, hora preferida, contexto inicial, estado: `invitado → aceptó → activo → pausado → completado`. Única tabla con escritura compartida; transiciones de estado definidas. |
| `preguntas` | Entrevistador | Web | Las 25 fijas (orden, texto, capítulo destino) + las 5 adaptativas generadas. |
| `respuestas` | Entrevistador | Web | Audio (ref. a Storage), transcripción, duración, día. |
| `saludos` | Web | Entrevistador (para la entrega final) | Audio, nombre, vínculo. |
| `pedidos` | Web | — | Proveedor de pago, estado, refs. a archivos finales. |

**Storage:** convención fija de carpetas `narrador_id/dia_NN.ogg`; saludos en `narrador_id/saludos/`. Almacenamiento privado, URLs firmadas.

## 5. El cerebro entrevistador

**Persona:** el/la "biógrafo/a de la familia". Nombre de marca a definir por los socios. Cálido, de "usted", curioso genuino; escribe un libro sobre él y necesita su ayuda. Guía de estilo propia; una sola voz TTS consistente para los audios.

**Mensaje diario:** (1) reconocimiento de ayer generado por IA — una frase específica, nunca genérica; (2) la pregunta del día; (3) versión en audio TTS. Se envía como plantilla aprobada de Meta con partes variables (obligatorio: fuera de la ventana de 24 hs solo se pueden iniciar conversaciones con plantillas aprobadas).

**Al recibir respuesta:** descargar → guardar → transcribir (Whisper o equivalente de primera línea) → evaluar riqueza. Si es corta o superficial (menos de ~40 segundos o sin sustancia): **una sola** repregunta cálida dentro de la ventana de 24 hs. Nunca dos. Audios múltiples se acumulan al mismo día. Texto en vez de audio: se acepta con gracia, se anima suavemente a usar la voz.

**Días 26-30:** al completarse la respuesta 25, un proceso lee la historia completa y la contrasta con una lista de cobertura (personas clave mencionadas y no exploradas, épocas con huecos, temas emocionales tocados de pasada). Genera 5 preguntas personalizadas, las guarda en `preguntas`, y los últimos días fluyen idéntico al resto.

**Modelos:** todo lo que piensa (reconocimientos, evaluación, repreguntas, las 5 finales) con el mejor modelo disponible de Claude. Costo por narrador por día: centavos.

## 6. La fábrica del libro y el audiolibro

**Cuándo se genera qué:** al completar la respuesta 30 → solo la previsualización (portada, índice, capítulo 1 completo, 1 minuto de audiolibro). El paquete completo se genera **al confirmarse el pago** — el costo pesado de IA solo se gasta en quien convirtió.

**Libro (PDF imprimible, A5):**
1. Estructura fija: cada pregunta ya está mapeada a un capítulo (Infancia · La casa familiar · Juventud · El amor · El oficio · Los hijos · Las pérdidas · La sabiduría, entre otros — el índice definitivo sale del brainstorming de preguntas). Adaptativas y repreguntas se inyectan al capítulo correspondiente.
2. **Regla de estilo n.º 1:** primera persona, con SUS palabras. La IA edita y ordena, no "redacta bonito": conserva giros, muletillas y frases textuales (las mejores, destacadas como citas). Prohibido el perfume a IA genérica. Acá va el mejor modelo sin escatimar.
3. Pasada de editor: coherencia entre capítulos, referencias cruzadas, apertura y cierre del libro escritos a partir de la historia completa.
4. Corrección de nombres propios: antes de la generación final, Martina revisa la lista de personas y lugares detectados y corrige la escritura.
5. Objeto final: portada con foto subida por Martina, título tipo "Roberto — La historia de una vida", página de saludos con los nombres, tipografía de libro real, listo para cualquier imprenta.

**Audiolibro:** audios originales ordenados por capítulo, limpiados (volumen parejo, silencios recortados), intro TTS breve por capítulo. Capítulo bonus: los saludos. Escuchable en la web para siempre + descargable por capítulo y completo.

## 7. Pagos

Una abstracción de cobro, dos proveedores: **Stripe Checkout** (España, EUR) y **Mercado Pago Checkout Pro** (Argentina, ARS), según la región de la familia. El webhook de pago confirmado dispara la generación del paquete completo. Precio configurable por región sin tocar código.

## 8. Casos borde y privacidad

- **"Quiero parar":** detectado por el cerebro (no por palabras mágicas) → pausa cálida + aviso a Martina. Reanudar = responder cualquier cosa.
- **Cierre anticipado:** si el narrador abandona definitivamente o fallece, Martina puede generar el libro con lo que haya (mínimo 10 respuestas). Lo grabado nunca se pierde; el libro se adapta a los capítulos existentes. Trato del caso fallecimiento con máximo cuidado en todos los textos.
- **Audio ininteligible / transcripción fallida:** el audio original es sagrado — se guarda igual, se marca; solo se pide de nuevo si la respuesta quedó vacía.
- **Número equivocado / responde otro:** el consentimiento inicial frena arranques en falso.
- **Privacidad (RGPD, crítico con España):** consentimiento explícito del narrador, storage privado con URLs firmadas, derecho a borrado total (audios + transcripciones + archivos generados), datos usados exclusivamente para su libro.

## 9. Validación y métricas

**Riesgos, en orden:** (1) que el narrador complete las 30 respuestas — EL riesgo del producto; (2) calidad del libro — si huele a IA, no pagan; (3) distribución — ads + orgánico (el cierre con los saludos es la escena viral natural).

**Antes de un euro en ads:**
1. Piloto con las propias familias de los socios (el primer narrador: un padre o abuelo propio).
2. 5-10 familias conocidas, gratis o precio simbólico.
3. Métricas que deciden todo: **% de narradores que completan las 30 respuestas**, **% de previsualizaciones que pagan**, **calidad percibida** (¿lloraron o dijeron "está lindo"?).

**Testing técnico:** cada módulo se prueba solo — el entrevistador con un arnés que simula WhatsApp; la fábrica con un "set dorado" de transcripciones fijas para iterar calidad del libro sin esperar 30 días reales.

## 10. Próximos pasos

1. **Brainstorming de las 25 preguntas** (sesión propia, pendiente): el guion de la película. Define también el índice definitivo de capítulos del libro. Hacerlo antes de implementar el entrevistador.
2. Plan de implementación en paralelo (skill writing-plans): dos planes coordinados, uno por socio/módulo, + el esquema de base de datos como primer entregable conjunto.
3. Trámites en paralelo al desarrollo: cuenta WhatsApp Business + verificación Meta + aprobación de plantillas; cuentas Stripe y Mercado Pago.
