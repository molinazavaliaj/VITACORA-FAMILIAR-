# Plan de producción — martes 22 al viernes 25 de septiembre de 2026

> Escrito el 22/09 al mediodía después de revisar `main`, las ramas, los tres roadmaps
> (`docs/ROADMAP.md`, `ROADMAP-AGENTE.md`, `ESTADO.md`), la bitácora y lo que Joaquín
> pusheó anoche. **Objetivo de estos cuatro días: que se pueda vender el libro base
> (PDF + Su voz) sin que nadie tenga que tocar nada a mano.** Lo físico (impreso,
> marcos) se abre cuando exista `entregas`.
>
> Cómo leerlo: primero "Lo verificado hoy" (hechos, no supuestos), después los seis
> portones que frenan la venta, después el día por día. Al final, lo que solo vos
> podés decidir, cada cosa con una recomendación.

---

## Lo verificado hoy (22/09, 12:30 España)

| Qué | Resultado |
|---|---|
| `web/` en `main` | 525 tests verdes, `tsc` limpio |
| `entrevistador/` en `main` | 299 tests verdes, `tsc` limpio |
| `fabrica/` en `main` | 346 verdes **pero 2 archivos no cargaban** (`worker.test.ts`, `anticipo-worker.test.ts`): la llamada `recordarFrasesPendientes()` había quedado **fuera** de `tick()`. En producción no tumba nada, pero el mail de los 15 días corría una sola vez al arrancar. **Arreglado en la rama `fabrica-tick-recordatorio-frases` (4d7dbfb): 412 tests / 33 archivos verdes.** Falta mergear. |
| Deploy de la web | GitHub Actions → Vercel, las últimas 6 corridas verdes; la última a las 23:10 UTC del 21 (merge de promos 8.7) |
| `main` local vs `origin` | Traje los 2 commits de Joaquín (3t.26 migración `entregas`, 3t.27 spec del catálogo). Quedan **8 commits locales sin push** (ROADMAP-AGENTE + el merge). |
| Ramas locales | Había 34. Borré 26 que ya estaban enteras en `main`. Quedan 8 (ver "Limpieza"). |
| Textos aprobados sin mergear | `su-voz-fabrica` tiene 2 commits (mail de los 15 días con tu texto y en tono "tú") que **no están en `main`**: producción sigue con el texto marcado "PENDIENTE DE APROBACIÓN". |
| Base en producción | No la pude leer desde acá (el modo auto bloquea lecturas de producción). Mirá `/admin`: latidos, pedidos de Mariano y Nako, gastos. |

### El choque de anoche (lo más importante que encontré)

Las dos cosas se hicieron la misma noche, sin verse:

- **El agente nocturno** cerró T3.18 y T3.19: "el impreso a 98 € trae el PDF incluido" y
  "la copia extra a 40 €", en las ramas `web-impreso-incluye-pdf` → `web-copia-extra-precio`.
- **Joaquín** escribió el spec **3t.27** (`docs/superpowers/specs/2026-09-22-catalogo-base-y-upsells-design.md`):
  la base (PDF + Su voz, 49 €) **siempre está en el carrito**, el impreso es **+49 €** (siempre
  color, envío incluido), copia extra +40 €, marco +20 € el primero y +15 € los siguientes.
  Muere `calcularExtras` y los descuentos por cantidad. Rama `catalogo-base` (todavía no existe).

**Los números coinciden** (49 + 49 = 98; copia 40). **La estructura no**: el agente parchó el
carrito actual; Joaquín lo reescribe. Recomendación: **se descartan las ramas del agente y va el
3t.27**. Ya frené al agente (T3.20 quedó en `[!]`) para que esta noche no siga construyendo encima.

---

## Los seis portones para vender (qué frena y quién lo abre)

| # | Portón | Estado | Quién |
|---|---|---|---|
| 1 | **WhatsApp automático**: las 5 plantillas de Meta aprobadas; `bienvenida` con el permiso de voz y sin vender el audiolibro (3t.25) | Las 5 en PENDING desde el 20/09. No hay nada que hacer salvo mirar todos los días. Editar `bienvenida` **después** de que aprueben. | Meta / J |
| 2 | **Cobro que confirma solo**: el webhook de Mercado Pago marca `pagado` sin que nadie lo toque | Los dos pagos reales del 21 (Mariano, Nako) quedaron `pendiente` y se confirmaron a mano. Desde anoche está en producción: webhook con GET + logs (T3.12/13) y la **vuelta del pago 3t.20** (confirma al volver del proveedor). Falta el próximo pago real para verlo, y la decisión T3.15 (Webhooks vs IPN). España: Stripe cuando exista la cuenta. | A |
| 3 | **Catálogo definitivo** (3t.27) | Spec listo, código no empezado. Orden: tu OK a los números → Joaquín codea → vos cargás variables → deploy → textos de la landing (T3.21). | N decide → J → N |
| 4 | **Lo físico** (3t.26 `entregas`) | Migración escrita, esperando tu OK al CONTRATO. Sin esto, alguien puede pagar un impreso y no hay dónde cargar la dirección. | N aplica → J fase 1 → N fase 2 |
| 5 | **La fábrica entrega bien** | Merge de las dos ramas de fábrica (arreglo del tick + texto del mail). Después: la sección QR de Su voz en el portón de impresión (= `en_produccion` de `entregas`, así que va detrás del portón 4). | N |
| 6 | **Calidad desde el día 1** | T3.5 (2 líneas: la transcripción automática con la ficha, bitácora #17 grave). T3.1 (la muestra pública con los títulos de capítulo). | J / J |

Aparte, **plata e higiene** (no frenan la venta pero se vencen): cancelar el Hobby de Railway de
Naza antes del 1/10; revocar la key de Anthropic del Railway viejo (T6.2); Joaquín rota su key de
OpenAI (quedó impresa el 19/09); recargar crédito de Anthropic (el 18/09 quedaban ~USD 7 y cada
libro sale ~USD 6-8); NIF/CUIT y domicilios en `web/src/app/legal/titulares.ts` (siguen en amarillo).

---

## Día por día

### Martes 22 (hoy)

**Naza**
1. ☐ Correr la limpieza que el modo auto no me dejó (abajo, "Limpieza", 4 comandos).
2. ☐ **Decidir y contestarle a Joaquín** (mensaje listo al final): (a) OK a los números del 3t.27,
   (b) las ramas del agente se descartan, (c) OK al CONTRATO de `entregas`.
3. ☐ Aplicar la migración `supabase/migrations/20260922000000_entregas.sql` en el SQL Editor
   (solo crea una tabla nueva; no toca datos existentes; idempotente).
4. ☐ Mergear a `main` y pushear: `fabrica-tick-recordatorio-frases` y `su-voz-fabrica`
   (Railway deploya solo). Verificar: en `/admin` el latido de la fábrica se mueve después del deploy.
5. ☐ Push de `main` (lleva el ROADMAP-AGENTE al día y el merge de Joaquín).
6. ☐ Plata: cancelar el Hobby de Railway (hoy y listo), revocar la key vieja de Anthropic,
   recargar crédito de Anthropic.
7. ☐ Mirar `/admin`: latidos de los dos servicios, los pedidos de Mariano y Nako, gastos.

**Joaquín**
1. ☐ Con el OK de Naza: arrancar `catalogo-base` (3t.27) desde `origin/main`. Test primero.
   Los textos que ve el cliente → a Naza antes de mergear.
2. ☐ T3.5: `procesar.ts:220` pasa `promptDeTranscripcion(n.contexto, n.como_le_dicen)` como en
   la puerta manual (`manual.ts:475`). 2 líneas, cierra la mitad barata del #17.
3. ☐ Rotar la key de OpenAI (Railway `VITACORA-FAMILIAR-` → `OPENAI_API_KEY`; la fábrica la sigue
   por referencia). Confirmar que hay saldo.
4. ☐ Mirar el panel con las primeras noches reales de Nako.
5. ☐ Meta: estado de las 5 plantillas.

### Miércoles 23

**Naza**
1. ☐ Revisar los textos de `catalogo-base` (pantalla del carrito, panel "Encargar libro") y los
   del panel de viaje (`viaje.tsx`, `angulos.tsx`) — estaban agendados para hoy en el roadmap.
2. ☐ Escribir las tres frases de la landing (T3.21): FAQ, microcopy del CTA y pie de la tabla de
   precios, con "Desde 49 €" y "el impreso trae el libro en PDF".
3. ☐ T3.15: entrar al panel de Mercado Pago → *Tus integraciones* → ver si está configurado
   **Webhooks** (POST con firma) o **IPN** (GET sin firma validable). Recomendación: Webhooks.
4. ☐ Arrancar el trámite de autónoma / Stripe (estaba para el jueves; cuanto antes mejor porque
   España no cobra hasta que exista la cuenta).

**Joaquín**
1. ☐ Terminar `catalogo-base`, merge con el OK de Naza. El deploy sale solo.
2. ☐ Arrancar fase 1 de `entregas` (web): fila al confirmar el pago, dirección obligatoria para
   encargar si hay algo físico, estados a la vista, "ya me llegó".
3. ☐ T3.1: `web/src/lib/muestra.ts` aplica `edicion.titulosCapitulos` (S).

### Jueves 24

**Naza**
1. ☐ Cargar en Vercel las variables nuevas del catálogo (`PRECIO_IMPRESO_*` = el adicional,
   `PRECIO_COPIA_*`, `PRECIO_MARCO_ADICIONAL_*`; desaparecen `PRECIO_IMPRESO_BN_*` y
   `_COLOR_*`) → re-run del workflow → mirar `/comprar` desde España y con VPN/Joaquín desde
   Argentina.
2. ☐ **Pago real de prueba entre los dos** (T5.3): comprar en producción, ver que el pedido quede
   `pagado` **solo** (vuelta del pago o webhook) y devolverlo. Si queda `pendiente`, los logs de
   Vercel ahora dicen por qué (T3.13).
3. ☐ Imma a la lista de permitidos de Meta (máx. 5) y avisarle que la bienvenida le va a llegar.

**Joaquín**
1. ☐ Seguir fase 1 de `entregas`.
2. ☐ 3t.25: escribir el texto nuevo de `bienvenida` / `bienvenida_viaje` (sin audiolibro, con el
   permiso de voz bien explicado) → Naza aprueba. **No tocar la plantilla en Meta hasta que
   aprueben las actuales.**

### Viernes 25

**Naza**
1. ☐ Fábrica, fase 2 de `entregas`: `en_produccion` = portón de impresión de Su voz (congela las
   frases, PDF de imprenta con la sección QR — el enganche que falta desde el 21) + mails de hito.
   Es trabajo para un agente con el spec de 3t.26 y `fabrica/src/libro/qr.ts` ya hecho.
2. ☐ Si sobra tiempo: T3.3, la paleta nueva en la plantilla del libro (vos mirás la maqueta impresa).
3. ☐ Pase de manos del viernes (`docs/handoff-2026-09-25.md`).

**Joaquín**
1. ☐ Merge de fase 1 de `entregas` con el OK de Naza.
2. ☐ Legales: NIF/CUIT y domicilios en `titulares.ts`.
3. ☐ Fin de semana (del roadmap): biógrafo con NotebookLM, INPI, redes.

**Todos los días, uno de los dos:** estado de las plantillas de Meta. Cuando `bienvenida` esté
aprobada → `WA_BIENVENIDA_PIDE_VOZ=1` en Railway; cuando `bienvenida_viaje` →
`WA_PLANTILLA_BIENVENIDA_VIAJE=1`. Dora arranca sola ahí.

---

## Lo que solo vos podés decidir (con mi recomendación)

| Decisión | Recomendación | Por qué |
|---|---|---|
| Números del 3t.27 (49 / +49 / +40 / +20 / +15; pesos ×1750) | **OK** | Son tu propuesta de precios; coinciden con lo que el agente ya había cerrado (98 y 40). |
| Ramas `web-impreso-incluye-pdf` y `web-copia-extra-precio` del agente | **Descartar** | Parchan el carrito viejo; `catalogo-base` lo reescribe. Los tests de precios del agente pueden servirle a Joaquín de referencia (`web/test/precios.test.ts`, `extras-copias.test.ts`). |
| Migración `entregas` | **Aplicar hoy** | Crea una tabla nueva, no toca nada existente. Sin ella Joaquín no puede empezar la fase 1. |
| T3.15 (firma de las notificaciones de MP) | **Webhooks (POST firmado)** | Es el camino con los dos candados. IPN sin firma es defendible pero abre la puerta al abuso. |
| T3.4 (dónde se completa la ficha) | **Cerrar para el lanzamiento** | `alta-contexto-minimo` ya pide año, estado civil e hijos en la compra; el resto va al panel más adelante. |
| ¿Vender impreso y marcos antes de `entregas`? | **Solo a pilotos (`extras.piloto=true`)** | Hoy alguien puede pagar un impreso y no hay dónde cargar la dirección. A desconocidos, cuando esté la fase 1. |
| Ramas viejas `navegacion-tablero` (07/09), `claude/sharp-hamilton-793491` (15/09), `panel-de-la-empresa` (T3.6-3.8) | **Borrar** | Las tres quedaron superadas por código que ya está en `main` (T3.16, `capituloNoAplica` de Joaquín, T3.7/3.8 mergeados). |

---

## Limpieza: lo hecho y lo que te queda a vos

**Hecho hoy (sin riesgo):**
- `main` local con los 2 commits de Joaquín (merge, sin push).
- 26 ramas locales borradas con `git branch -d` (git solo lo permite si están enteras en `main`).
- `ROADMAP-AGENTE.md`: T3.20 frenada con el motivo; T2.4 marcada como resuelta en rama.
- Rama `fabrica-tick-recordatorio-frases` con el arreglo del worker (commit, sin push).
- El árbol estaba limpio; `.autopilot/`, `.agents/` y `skills-lock.json` ya están en `.gitignore`.
  No hay archivos sueltos ni duplicados que sacar.

**Te queda a vos (el modo auto me bloqueó estos; todos son seguros):**

```bash
git branch -D fotos-posicion-foco hermes-script
```
(las dos están enteras en `main`; git frenó el `-d` solo porque su rama remota quedó atrás)

```bash
git worktree remove --force "C:/Users/Naza/AppData/Local/Temp/claude/C--Users-Naza-Desktop-VITACORA-FAMILIAR/888dd4b2-c09a-4a2e-b8a2-665fad3a78f1/scratchpad/deploy-main"
```

```bash
git worktree remove --force ".claude/worktrees/sharp-hamilton-793491"
```

Y si confirmás la fila "Borrar" de la tabla de arriba:

```bash
git branch -D navegacion-tablero claude/sharp-hamilton-793491 panel-de-la-empresa
```

Los dos stashes (`stash@{0}` de seguridad de T1.1 y `stash@{1}` WIP viejo de `fabrica-aprobacion`)
no molestan; el arreglo del worker ya salió de ahí. Se pueden tirar con `git stash drop` cuando quieras.

**Ramas en `origin` que ya están en `main`** (borrarlas es prolijidad, no urgencia; lo decide
quien las creó): `anticipo`, `arrastrar-preguntas`, `audiolibro-completo-tope`, `bitacora-j1/j2/j3`,
`carrito-viaje`, `docs-bitacora-hallazgos-38-39`, `fabrica-aprobacion`, `fabrica-script-narracion-v2`,
`ficha-compra`, `ficha-estado-civil`, `fotos-posicion-foco`, `hora-editable`, `noche-sin-plantilla`,
`pago-vuelta`, `panel-viaje`, `promos`, `region-por-ip`, `su-voz-*`, `alta-contexto-minimo`,
`tema-de-otra-parte`, `trato-usted-o-vos`, `web-precios-invalidos-2`, `web-webhook-mp-*`.

---

## Qué NO hacer estos días

- No mergear `web-impreso-incluye-pdf` ni `web-copia-extra-precio` (chocan con `catalogo-base`).
- No editar las plantillas en Meta hasta que aprueben las actuales (vuelven a revisión).
- No marcar pedidos `pagado` a mano si el libro no está cerrado; los de piloto con `extras.piloto=true`.
- No correr narraciones contra la PC de música: el audiolibro se descartó el 20/09; la PC queda
  para cortar y restaurar audio real de Su voz.
- No imprimir keys ni tokens al verificar variables.
- No tocar `voz/` desde la central salvo revisar parches del buzón.
