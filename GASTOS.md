# Gastos del proyecto — recuento corriente

| Fecha | Concepto | Monto | Quién | Tipo |
|---|---|---|---|---|
| 2026-09-01 | Railway plan Hobby (infra: fábrica + futuro entrevistador) | USD 5/mes | Naza | Recurrente |
| 2026-09-01 | Crédito API Anthropic (el escritor de los libros) | USD 10 | Naza | Consumible |
| 2026-09-01 | Crédito API OpenAI (transcripción + voz del biógrafo) | USD 5 | Naza | Consumible |
| 2026-09-05 | Dominio vitacorafamiliar (registro año 1) | 15€ | Naza | Recurrente (anual) |
| 2026-09-05 | Recarga crédito API Anthropic (pre-pilotos) | 20€ | Naza | Consumible |
| ~2026-09-03 | Créditos API Anthropic + OpenAI del entrevistador (montos a confirmar por Joaquín) | ~USD 10-20 | Joaquín | Consumible |
| — | Vercel, Supabase, Resend, GitHub | USD 0 | — | Gratis (planes free) |

**Total puesto hasta hoy: ~USD 20 + 35€ (Naza) + ~USD 10-20 (Joaquín)** + USD 5/mes de Railway.

> Pendiente acordado: unificar las keys de IA en UNA organización de Anthropic del
> proyecto (Naza invita a Joaquín como admin) para que el costeo por libro sea real
> y nadie pague "su mitad del cerebro" por separado. La key de OpenAI (Whisper) de
> Joaquín queda aparte — es chica, USD 5 rinden meses de transcripción.

## Qué se consumió del crédito de Anthropic (~USD 8.50 de los 10)

- Prueba completa de Osvaldo: estructura + previsualización + libro completo ≈ USD 4.50
- "Matrícula" de aprendizaje: reintentos que re-pagaban capítulos antes del fix de
  borradores ≈ USD 4 (ya no puede volver a pasar).
- **Saldo actual: ~USD 1.50 → recargar USD 10-20 antes de los pilotos.**

## Costo unitario por cliente (dato de negocio — acordado 2026-09-05)

| Concepto | Quién lo paga hoy | Costo |
|---|---|---|
| Entrevista de 30 días (cerebro + Whisper) | Joaquín (API propia) | ~USD 3-4 |
| Libro + audiolibro (escritura + edición + PDF) | Naza (API propia) | ~USD 5 |
| WhatsApp (Meta, por conversación) | — (llega con narradores reales) | ~USD 1-2 |
| **Total por cliente que completa y compra** | | **~USD 9-11** |

Contra 49€ de precio: **margen bruto ~80%** antes de ads.

Matiz importante del freemium: el costo NO es 9-11 por cada curioso que prueba.
La entrevista gasta día a día — el que abandona el día 5 costó ~USD 1, no 4. El
costo completo solo lo paga quien llegó al final… que es justo el que más
probablemente compra (30 días de vínculo emocional + el libro ya existe).

## ⚖️ La cuenta del freemium (decisión pendiente POST-pilotos — Naza + Joaquín)

Duda planteada por Naza (2026-09-05): si un usuario freemium cuesta hasta USD 9-11
y encima pagamos el ad que lo trajo, ¿cierra 49€? ¿O hay que cobrar para empezar?

La cuenta que hay que hacer (con datos reales de los pilotos, no a ciegas):
**margen por venta (~44€) ÷ costo por usuario gratis (~USD 2-4 promedio, contando
abandonos tempranos) = cuántos gratis banca cada venta** (≈ 10-15). O sea: el
freemium cierra si convierte más de ~1 de cada 10. Los pilotos deben medir
EXACTAMENTE eso: qué % termina los 30 días y qué % compra.

Opciones sobre la mesa si la conversión viniera floja (ninguna decidida):
1. **Seña de entrada** (ej. 9€ al empezar, descontados del precio final) —
   filtra curiosos sin matar el "probá gratis".
2. **Recorte del gratis**: entrevista completa gratis pero previsualización más
   corta (ya existe el preview velado — es la palanca de conversión).
3. **Pago adelantado con garantía de devolución** — modelo Storyworth.
4. Subir el precio (los comparables cobran USD 99+ por menos producto: sin voz
   real, sin audiolibro).

Regla acordada: no tocar el modelo hasta tener los datos de los 3 pilotos.

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

**Palanca 1 — ticket más alto (precios de mercado verificados 2026-09-05):**
Storyworth cobra $59/$109/$199 CON libro impreso incluido; Remento $99 con tapa
dura de 200 págs. y vende copias extra a $69. Opciones nuestras: escalón impreso
89-99€ (imprenta bajo demanda ~15-25€), copias extra 29-39€, digital quizás a 59€.
El diferencial se mantiene en todos los escalones: nadie da la voz real en castellano.

**Palanca 2 — crecer sin ads (el producto es viral por diseño):**
1. **CTA en los saludos** ⭐ feature chica post-pilotos: por cada libro, 5-10
   parientes YA entran a la web a grabar su saludo — al terminar, botón
   "¿Y la historia de tu mamá? Empezala gratis". Cliente por esta vía: 0€ de
   adquisición → ~39€ limpios contra ~13€ del de ads.
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
