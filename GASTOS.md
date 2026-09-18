# Gastos del proyecto — recuento corriente

| Fecha | Concepto | Monto | Quién | Tipo |
|---|---|---|---|---|
| 2026-09-01 | Railway plan Hobby (infra: fábrica + futuro entrevistador) | USD 5/mes | Naza | Recurrente |
| (antes del 01/09) | Crédito API Anthropic que Naza ya tenía cargado y que Vitácora se comió (Osvaldo, 02/09) | USD 20 | Naza | Consumible (previo) |
| 2026-09-01 | Crédito API Anthropic (el escritor de los libros) | USD 10 | Naza | Consumible |
| 2026-09-01 | Crédito API OpenAI (transcripción + voz del biógrafo) | USD 5 | Naza | Consumible |
| 2026-09-05 | Dominio vitacorafamiliar (registro año 1) | 15€ | Naza | Recurrente (anual) |
| 2026-09-05 | Recarga crédito API Anthropic (pre-pilotos) | 20€ | Naza | Consumible |
| ~2026-09-03 | Créditos API Anthropic + OpenAI del entrevistador (montos a confirmar por Joaquín) | ~USD 10-20 | Joaquín | Consumible |
| 2026-09-08 | Prueba dirigida del cerebro contra el set dorado (`npm run prueba-cerebro`) | ~USD 1 | Joaquín | Consumible |
| — | Vercel, Supabase, Resend, GitHub | USD 0 | — | Gratis (planes free) |

**Total puesto hasta hoy (18/09): USD 20 + 35€ (Naza, desde el 01/09) + USD 20 de crédito previo de Naza que el proyecto consumió + ~USD 10-20 (Joaquín)** + USD 5/mes de Railway (⚠️ el plan Hobby de Naza quedó sin proyectos el 18/09: cancelarlo).

> Pendiente acordado: unificar las keys de IA en UNA organización de Anthropic del
> proyecto (Naza invita a Joaquín como admin) para que el costeo por libro sea real
> y nadie pague "su mitad del cerebro" por separado. La key de OpenAI (Whisper) de
> Joaquín queda aparte — es chica, USD 5 rinden meses de transcripción.

## Qué se consumió del crédito de Anthropic de Naza — LEÍDO DE LA CONSOLA el 18/09 15:30

**Gasto del mes (1–18 sept): USD 46,07. Saldo: USD 12,18.** Falta que impacte el libro de
Joaquín de hoy (~USD 5): el mes cierra en ~USD 51 y el saldo en ~USD 7. **Recargar antes
del próximo libro** (Osvaldo/Ciro salen ~USD 6 cada uno).

| Día | Modelo | Monto | Qué fue |
|---|---|---|---|
| 02/09 | Fable 5 | ~USD 15–17 | Osvaldo: primer libro completo + reintentos que re-pagaban capítulos (antes del fix de borradores) |
| 06–08/09 | Fable / Haiku | centavos | pruebas chicas |
| **12/09** | **Opus 4.6** | **~USD 22** | **NO es el producto**: nada en el repo usó nunca Opus 4.6. Alguna herramienta (Claude Code / IDE / Workbench) corrió con la key de Naza ese día. *Identificar en la consola: Usage → agrupar por API key.* Casi la mitad del gasto del mes. |
| 13–17/09 | Haiku 4.5 + Opus 5 | ~USD 2 | entrevista de Joaquín (piloto manual desde la PC de Naza) |
| 17/09 | Opus 5 + Fable 5 | ~USD 1,2 | cierre de la entrevista + estructura del libro |
| 18/09 | Fable 5 | 0,61 → ~5,6 | libro de Joaquín (la consola atrasa) |

Lección: **una key por uso** (fábrica, entrevistador, Claude Code de cada uno), así el
gráfico por key dice quién gastó qué sin adivinar.

### (registro viejo, estimado al 05/09 — quedó corto)

- Prueba completa de Osvaldo: estructura + previsualización + libro completo ≈ USD 4.50
- "Matrícula" de aprendizaje: reintentos que re-pagaban capítulos antes del fix de
  borradores ≈ USD 4 (ya no puede volver a pasar).
- **Saldo actual: ~USD 1.50 → recargar USD 10-20 antes de los pilotos.**

## Qué se consumió de la key de Joaquín (entrevistador)

- Prueba dirigida del cerebro del 2026-09-08 ≈ **USD 1**: reconocimientos, evaluación
  de respuestas, las 4 adaptativas y la pregunta de reemplazo, corridas contra las 30
  respuestas reales del set dorado. Encontró el bug del día 26 (ver `ESTADO.md`).
  Es repetible con `npm run prueba-cerebro` y se puede correr por secciones (A/B/C/D)
  para gastar menos.

## Qué costó el libro de Joaquín (piloto, 14–18/09) — dos cuentas

| Paso | Cuándo | Modelo | Cuenta | Estimado |
|---|---|---|---|---|
| Entrevista: 35 audios transcriptos, evaluación por respuesta, adaptativas, TTS de las preguntas | 14–17/09 | gpt-transcribe, Opus 5, Haiku 4.5, gpt-4o-mini-tts | Joaquín (entrevistador) | ~USD 1,15 |
| Anticipo + estructura + previsualización (cap. 1 + muestra) | 15–18/09 | Fable 5 + TTS | Naza (la fábrica vieja seguía viva con su key) | ~USD 1,1 |
| **8 capítulos** — los escribió la **fábrica vieja** (bitácora #37), sin aprobación | 18/09 12:16–12:22 UTC | Fable 5 | **Naza** | ~USD 4,5 |
| Pasada de editor + PDF + `narracion.json` — fábrica nueva | 18/09 12:34 UTC | Fable 5 | **Joaquín** (key en `dazzling-friendship`) | ~USD 1–1,5 |
| Voz clonada (qwen3tts en la PC de música) | pendiente | — | — | USD 0 |
| **Total** | | | | **~USD 8** (≈ 5,6 Naza · 2,4 Joaquín) |

Base del cálculo: Fable 5 a USD 10/M entrada y USD 50/M salida, sin caché de
prompt; ~18K tokens de transcripciones que viajan enteros en cada capítulo
(≈ USD 0,5–0,6 por capítulo). La consola de Anthropic atrasa horas: el 18/09 a
las 15:00 la de Naza mostraba USD 0,61 del día. **Confirmar con las dos consolas
a la noche** y corregir acá.

Dos lecciones que ya están en la bitácora: (1) el proyecto viejo de Railway se
apagó el 18/09 (`railway down`); un servicio olvidado con una key cargada gasta
solo. (2) La organización única de Anthropic (pendiente de arriba) hubiera
evitado sumar dos consolas.

## Costo unitario por cliente (ACTUALIZADO 2026-09-14 — reemplaza la tabla del 05/09)

Lo que se optimizó desde el 05/09: se sacó el saludo diario generado por IA (era
el 70% del costo de la entrevista) y se personaliza la pregunta con memoria
destilada por capítulo. La entrevista pasó de ~USD 4,5-5 a ~USD 1,4.

| Concepto | Antes (05/09) | Hoy | Nota |
|---|---|---|---|
| Saludo diario (Opus + historia completa) | ~USD 3,36 | **USD 0** | eliminado por decisión de producto |
| Transcripción de los 30 audios | ~USD 0,30-0,40 | **~USD 0,30-0,45** | gpt-transcribe; medido 191 s por respuesta real |
| Evaluación de cada respuesta | ~USD 0,50 | **~USD 0,20-0,28** | medido: Opus + los 5 casos del set dorado |
| Voz de las preguntas (TTS) | ~USD 0,15 | ~USD 0,15 | gpt-4o-mini-tts |
| Personalización del biógrafo | — | ~USD 0,12 | Haiku + memoria por capítulo |
| Adaptativas (una vez, al cerrar el 26) | ~USD 0,26 | ~USD 0,26 | Opus |
| **Subtotal entrevista** | **~USD 4,5-5** | **~USD 1,15** | |
| Libro + audiolibro (escritura + edición + PDF) | ~USD 5 | **~USD 4,50-5** | medido con Osvaldo; **no se tocó** (lee todo completo) |
| WhatsApp (Meta, por conversación) | ~USD 1-2 | ~USD 1-2 | llega con los narradores reales |
| **Total por cliente que completa y compra** | **~USD 9-11** | **~USD 6 (digital) · ~USD 7,5 (con WhatsApp)** | |

Contra 49€ de precio (**≈ USD 53**): **margen bruto ~86-89%** (antes ~80%).

**El dato que importa de acá en adelante:** el libro es ahora **~el 80% del costo**
(USD 4,75 de USD 6). La entrevista ya es barata — optimizarla más no mueve la
aguja; el libro sí, y se decidió que lea todo completo con el modelo grande
porque ahí está la calidad del producto.

Matiz del abandono (sigue valiendo): el costo se gasta día a día. Un narrador que
abandona el día 5 costó ~USD 0,25, no 1,15.

> La tabla vieja del 05/09 queda arriba de este párrafo reemplazada por esta. Los
> escenarios con ads de más abajo siguen siendo del modelo freemium: **hay que
> rehacerlos** con el pago directo del 11/09.

## 💳 El modelo de cobro — DECIDIDO el 2026-09-11

**Pago directo por adelantado.** El usuario paga al comprar, pago único, y accede al
servicio. Sin prueba gratis, sin tarjeta guardada.

**Historia:** freemium de 30 días (01/09) → tarjeta + prueba hasta el capítulo 1
(10/09) → **pago directo (11/09, los dos socios)**. La prueba gratis queda como
**experimento futuro**: con datos de venta se evalúa si unos días de prueba venden más.

**Por qué:**
- Es lo más simple de construir y ya está implementado (PR #1 de Naza).
- **El costo de un curioso es cero.** Nadie entra sin pagar; toda la IA se gasta
  en clientes.
- El anticipo a la 3ª respuesta pasa de palanca de conversión a **primer momento
  de alegría de quien ya pagó**.

**Precios sin correlación entre monedas:** `PRECIO_EUR` y `PRECIO_ARS` son
independientes. Argentina puede ser más barata para vender más.

> Reemplaza la regla del 05/09 ("no tocar el modelo hasta los pilotos"), dada de
> baja el 10/09.

## 🎁 Catálogo y precios — DEFINIDOS el 2026-09-12

| Producto | Argentina | España | Variable en Vercel |
|---|---|---|---|
| **El libro en PDF** (se lee en la web, no se descarga) | **ARS 85.750** | **49 €** | `PRECIO_ARS` / `PRECIO_EUR` |
| **El audiolibro** (voz clonada o narrador; se escucha en la web) | ARS 61.250 | 35 € | `PRECIO_AUDIOLIBRO_ARS` / `_EUR` — ⚠️ nuevas, 13/09 |
| **Libro impreso B/N** (tapa dura, QR) | ARS 70.000 | 40 € | `PRECIO_IMPRESO_BN_ARS` / `_EUR` |
| **Libro impreso a color** | ARS 80.500 | 46 € | `PRECIO_IMPRESO_COLOR_ARS` / `_EUR` |
| **Marco con NFC** (por unidad) | ARS 35.000 | 20 € | `PRECIO_MARCO_ARS` / `_EUR` |

Los extras se venden **después** de la base y se producen después de venderse. Un
extra sin variable cargada **no aparece** en el checkout (regla de `productos.ts`).

**Pendiente: cargarlos en Vercel** (Naza, en curso el 16/09). Hasta entonces la landing
vende solo el PDF con los defaults del código (ARS 49.999 / 49 €).

**Las otras variables de la web en Vercel** (además de Supabase, Stripe y los precios):

| Variable | Qué es | Estado |
|---|---|---|
| `MP_ACCESS_TOKEN` | Access token de **producción** de Mercado Pago | ✅ 15/09 |
| `MP_WEBHOOK_SECRET` | Clave del webhook de **producción** (panel de MP → Webhooks, al lado de la URL). Desde el 16/09 la web rechaza con 401 las notificaciones mal firmadas: si es la de prueba, los pagos reales quedan "pendientes". | ⚠️ confirmar que sea la de producción |
| `RESEND_API_KEY` | La de la cuenta de Joaquín (15/09) | ✅ |
| `URL_BASE` | `https://www.vitacorafamiliar.com` | ✅ |
| `ENTREVISTADOR_URL` | `https://vitacora-familiar-production.up.railway.app` — para "Sugerime preguntas" | ☐ nueva, 16/09 |
| `SUGERIDAS_CLAVE` | La misma que en el servicio entrevistador de Railway (la generó Joaquín con `openssl rand -hex 24`) | ☐ nueva, 16/09 |

Sin `ENTREVISTADOR_URL` + `SUGERIDAS_CLAVE` el botón existe pero dice "todavía no está
disponible"; nada se rompe.

> Nota: el roadmap del 04/09 decía "~ARS 65.000, a la par del competidor de llenar a
> mano". El precio definido hoy es ARS 85.750. Decisión de los socios del 12/09.

**El QR de la contratapa** es parte del producto base impreso, no un extra:
lleva al audiolibro y deja escuchar fragmentos con la voz real.

**Diferido a fase 2:** que el usuario elija la estética del libro. Se decide
cuando el producto esté andando y se pueda pulir bien la estética completa.

## 📈 Escenarios con ads y las dos palancas (charlado Naza + Claude, 2026-09-05)

**La cuenta por cada 100 registros freemium traídos por ads** (supuestos a validar:
registro a ~3€, 60% abandona temprano, WhatsApp ~1€/usuario):
costos fijos del lote ≈ 720€ (300 ads + 220 IA entrevistas + 100 WhatsApp + ~100 libros).

| Compran de 100 | A 49€ (solo digital) | Con escalón impreso 99€ (ticket prom. 74€, −20€ imprenta) |
|---|---|---|
| 10 | **−230€ (pérdida)** | −80€ (casi empata) |
| 20 | +260€ | **+660€** |
| 30 | +670€ | **+1.300€** |

Lectura: a 49€ solo-digital, los ads exigen convertir >1 de cada 7. Con ticket más
alto hay margen de error. Los pilotos + una campañita chica deben medir LOS TRES
números: costo real por registro, % que completa, % que compra.

> ⚠️ **Estos escenarios son del modelo viejo (freemium de 30 días).** Con el pago
> directo del 11/09, los 220€ de IA y los 100€ de WhatsApp del lote **solo se
> gastan en quien pagó**: el costo por registro gratis desaparece. La cuenta pasa a
> ser: ads ÷ compras = CAC, contra un margen de ~44€ por venta base más los extras.
> **Hay que rehacer la tabla** — queda pendiente.

**Palanca 1 — ticket más alto (precios de mercado verificados 2026-09-05):**
Storyworth cobra $59/$109/$199 CON libro impreso incluido; Remento $99 con tapa
dura de 200 págs. y vende copias extra a $69. Opciones nuestras: escalón impreso
89-99€ (imprenta bajo demanda ~15-25€), copias extra 29-39€, digital quizás a 59€.
El diferencial se mantiene en todos los escalones: nadie da la voz real en castellano.

**Palanca 2 — crecer sin ads (el producto es viral por diseño):**
1. ~~**CTA en los saludos**~~ — **eliminado el 2026-09-10**: los saludos salen de
   la fase 1 (el receptor del regalo ya no es el narrador). **Lo reemplazan los
   marcos con NFC**, y rinden más: cada marco es un objeto físico en el living de
   un familiar que suena con la voz del abuelo. El que lo recibe pide **su copia
   impresa** — venta con 0€ de adquisición y sin entrevista nueva que pagar.
2. **QR en la última página del libro**: "Este libro se hizo con Vitácora
   Familiar" — cada PDF reenviado y cada impreso en un living es un anuncio
   eterno que pagó el cliente.
3. **"La vida en 5 minutos"** (pregunta 26): la pieza compartible por diseño.
4. **Referido familiar**: descuento a la segunda familia del mismo clan.

## Gastos por venir (estimados)

- Recarga Anthropic pre-pilotos: USD 10-20.
- ~~Dominio propio~~ → comprado el 2026-09-05 (15€, ver tabla). Renovación anual.
- Meta/WhatsApp: por conversación (~USD 1-2 por narrador por los 30 días).
- Cuando haya ventas reales: Vercel Pro (USD 20/mes, lo piden sus términos comerciales)
  y Supabase Pro (USD 25/mes cuando el storage supere 1 GB ≈ 15 narradores).
