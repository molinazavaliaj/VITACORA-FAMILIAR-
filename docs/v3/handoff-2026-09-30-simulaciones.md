# Pase de manos V3 — 30/09/2026 (tercer chat: las simulaciones)

Estado verificado al cierre (rama `v3`, worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-v3`, todo pusheado a `origin v3`). Sigue a [`handoff-2026-09-30-lectura.md`](handoff-2026-09-30-lectura.md).

**Empezar por:** [`entrevista/flujo-vigente.md`](entrevista/flujo-vigente.md) (el flujo de hoy, con botones) y [`entrevista/simulaciones/hallazgos.md`](entrevista/simulaciones/hallazgos.md) (qué se encontró, qué decidió Naza y qué está aplicado).

## Qué se hizo
1. **Script que hace de WhatsApp:** `fabrica/scripts/v3-entrevista-turno.ts` (`nueva`, `responder` con audio o `--boton`, `md`). Con las mismas respuestas manda exactamente lo mismo que la lectura corrida (test).
2. **Ronda 1:** 6 narradores inventados (Nelly, madre soltera; Amalia, viuda; Aníbal, solterón; Chela, tres matrimonios; Manuel, gallego reservado; Elsa, no se acuerda), contestados por Haiku; Fable leyó cada charla. Fallas S1–S13 en [`simulaciones/consolidado-fable.md`](entrevista/simulaciones/consolidado-fable.md); página para el celular: https://claude.ai/artifact/XP4TCmK6BmxC3vPn1nGoTf.
3. **Decisiones de Naza** (todas en `hallazgos.md`): **botones de WhatsApp** en las que abren tema, en los 14 cierres ([No, está todo]), en las sensibles ([Paso esta], y [No, nada así] en los momentos difíciles) y en la foto ([No tengo foto]); reglas de respaldo para quien contesta con audio; textos nuevos redactados por Fable y aprobados en tres tandas ([`simulaciones/textos-finales.md`](entrevista/simulaciones/textos-finales.md)); HI2b afuera; S6 descartado; S13 para el dashboard.
4. **Programado** (plan: [`simulaciones/PLAN-codigo.md`](entrevista/simulaciones/PLAN-codigo.md)): banco con sección `## Botones`, `respuesta.ts` (`interpretar`: no, paso, olvido, olvido a medias, "no ahondar", "ya te lo conté"), acuses nuevos M27–M32, AM20 nueva, dependencias con " y " y `paso:X`. Banco y flujo anteriores en `entrevista/historial/`.
5. **Ronda 2** con los mismos 6, tocando botones ([`simulaciones/ronda-2/`](entrevista/simulaciones/ronda-2/)): de ~70 "no"/"paso" mal leídos a 5; ninguna pregunta que no corresponde. Naza aprobó 8 arreglos más (sección "Ronda 2" de `hallazgos.md`), programados.
6. Cada tanda la revisó un segundo agente; los falsos positivos que encontró (historias leídas como "no", "paso" u olvido) se arreglaron con test.

**Verificado:** `cd fabrica; npx vitest run` → **1082 tests verdes**; `npx tsc --noEmit -p .` limpio; `npx tsx scripts/v3-entrevista-recorrido.ts` anda. Vida completa: 88 preguntas (antes 89).

## Lo que sigue
1. **Paso 3 del plan de V3:** que Naza haga la entrevista él mismo por WhatsApp. Mirar el piloto manual del entrevistador (`entrevistador/`, código de Joaquín, **no tocarlo**) y armar el plan: cómo conectar el flujo nuevo (con botones de respuesta de WhatsApp, M30 al tocar "Sí", la espera de la foto sin reloj de minutos y con tope de 24 h, la foto que llega tarde se pega a FO1), costo de transcripción, y el **mensaje para Joaquín** (Naza: "a Joaquín lo actualizamos al terminar"). No construir nada hasta que Naza apruebe.
2. Lo que las simulaciones no pudieron mostrar (los narradores Haiku casi nunca dijeron "No me acuerdo." o "De eso no." cortitos y solos; está cubierto por tests): mirarlo en la prueba real.
3. Dashboard (S13): marcas "no quiso" / "pidió no ahondar" / "no se acuerda", nombres pendientes con nietos y hermanos, que la familia complete nombres y fechas.
4. Pendiente de antes: el "tú" para España (cuando esté todo cerrado).

## Qué NO hacer
- No pisar archivos: lo nuevo en archivos nuevos; las charlas de la ronda 1 y la `lectura-corrida.md` quedan como historia.
- No usar vidas reales como ejemplo.
- Nada pago sin avisarle el costo a Naza.
- No hacer checkout en la carpeta principal ni pushear a `main`; no tocar `entrevistador/`.
