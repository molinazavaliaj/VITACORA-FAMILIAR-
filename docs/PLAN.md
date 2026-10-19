# PLAN — el orden de ataque, al 17/10/2026

> **Qué es esto y qué no.** El `ROADMAP.md` dice **qué** falta y **quién** lo hace: es la fuente
> de verdad y manda. Este documento dice **en qué orden** y **qué espera a qué**. Si los dos se
> contradicen, vale el ROADMAP y hay que corregir este.
>
> Sale de la revisión del 17/10 y de la charla con Naza del mismo día.

---

## El camino crítico

Para **vender en Argentina** hacen falta seis cosas, y solo las dos primeras están en serie:

```
1. main al día (las 6 fases de merge)      ← Naza, en curso
2. la prueba de punta a punta pasada       ← necesita la 1
3. titular de Argentina cargado + OK del abogado   ┐
4. packaging producido                              ├─ en paralelo, sin depender de 1 ni 2
5. proveedor de impresión AR con libro de muestra  ┘
6. contenido orgánico subiendo              ← en paralelo
```

Para **vender en España** hace falta todo eso **más**: el alta de autónomo → el NIF →
los titulares de España → Stripe activo. Ese reloj no lo manejamos nosotros.

**Entonces el lanzamiento es Argentina**, y la fecha la pone la prueba de punta a punta.

---

## Ahora mismo · mientras Naza mergea

> **Regla de esta etapa: nadie más toca código.** Hay 8 PR y 200 commits del rediseño entrando.
> Cualquier rama nueva sobre `web/`, `entrevistador/` o `fabrica/` le suma un conflicto a Naza.
> Lo único que se puede tocar sin riesgo es `.github/` y los documentos.

| Quién | Qué | Estado |
|---|---|---|
| **Naza** | Las 6 fases de merge, en el orden probado | 🔄 |
| **Naza** | La consulta SQL de las tres migraciones (abajo, «La consulta que falta») | ☐ |
| **Claude** | La Action de tests en cada PR — solo toca `.github/`, cero conflicto | ✅ PR #60 |
| **Joaquín** | Editar el crudo de Dora y dejarlo listo para subir | ☐ |
| **Joaquín** | Llamar proveedores de impresión en Argentina | ☐ |
| **Joaquín** | Abrir cuenta **Correos Pymes** en España (tarda días, va junto al alta de autónomo) | ☐ |
| **Joaquín** | Revisar los textos de las landings **en la preview**, sin esperar el merge | ☐ |
| **Joaquín** | **Presentar INPI** | ☐ urgente |
| **Joaquín** | El alta de autónomo (reloj externo) | 🔄 en trámite |
| **Joaquín** | Mandarle el PDF de legales al abogado | 🔄 |

---

## Cuando main esté al día · fin del bloque 1

El orden importa: primero lo que toca la fábrica, porque la prueba de punta a punta
necesita que el libro salga bien.

| # | Qué | Quién | Necesita |
|---|---|---|---|
| 1 | El **pie del libro** (hoja de firma + 2 en blanco) en el `libro-imprenta.pdf` | Claude | la maqueta definida |
| 2 | **Avisar si un libro queda bajo 45 páginas**: el proveedor no lo imprime | Claude | — |
| 3 | **«Envío gratis»** en la landing y el checkout | Claude, textos de Naza | — |
| 4 | La pantalla de **Envíos en `/admin`** | Naza o Claude | la consulta SQL |
| 5 | **La prueba de punta a punta** (bloque 2 del ROADMAP), paso por paso | Joaquín | 1 a 4 |

---

## Después de la prueba · lo que ella misma va a pedir

No se planifica antes a propósito: el bloque 3 del ROADMAP (panel y avisos) **sale de lo que
falle en la prueba**. Hoy `/admin` ya tiene Estado, Familias, Cerebros, Gastos y Plata, y hay
17 puntos que mandan mail a los socios. Planificar «terminar el panel» antes de pasarle una
venta real por encima es adivinar.

Lo único que ya se sabe que falta: el **agente que lea el Gmail y avise por Telegram**.

---

## En paralelo, todo el tiempo

| Frente | Qué | Quién |
|---|---|---|
| **Físico** | Proveedores AR y ES, libro de muestra, estética e imágenes adentro, marcos | Joaquín |
| **Packaging** | Diseñar el de envío y el de la gift card, y mandarlos a producir **para el día 1** | Joaquín |
| **Contenido** | Dora editado, catalán con Imma, calendario de posteo | Joaquín |
| **Ads** | Decidir orgánico-primero vs. ads-ya, y la estructura de campaña | Joaquín |

---

## Lo último, para abrir la puerta

1. OK del abogado sobre los legales.
2. Titular de Argentina cargado (CUIT y domicilio).
3. Packaging en mano.
4. Un libro impreso de muestra con el proveedor definitivo.
5. **Recién entonces se prende la venta en Argentina.**

Y para España, cuando salga el alta: NIF → titulares de España (hay que **cambiar el nombre**,
hoy dice Immaculada Collel) → Stripe activo → se prende España.

---

## La consulta que falta

Tres migraciones de septiembre quedaron con el estado de aplicación **desconocido** y el código
que las usa está en main desde el 27/09. Si alguna no está aplicada, esa función está muerta en
silencio. En el SQL Editor de Supabase:

```sql
select
  to_regclass('public.entregas') is not null as envios,
  exists(select 1 from information_schema.columns
         where table_name='fotos' and column_name='pregunta_orden') as objetos_preciados,
  exists(select 1 from information_schema.columns
         where table_name='envios' and column_name='entrega') as entrega_whatsapp;
```

- **`envios` en false** → no hay sistema de envíos: nadie puede cargar una dirección y el
  bloque 4 pasa a ser lo primero de todo.
- **`objetos_preciados` en false** → el bot no puede pedir la foto de un objeto concreto.
- **`entrega_whatsapp` en false** → no sabemos si un mensaje llegó de verdad.

El resultado se anota en `supabase/CONTRATO.md`, que es donde quedó la pregunta.

---

## Lo que está esperando a una persona

| Qué | A quién espera |
|---|---|
| Titular de Argentina en los legales | Joaquín manda CUIT y domicilio |
| Titular de España, Stripe, vender en España | el alta de autónomo |
| OK de los legales | el abogado |
| Transportista de España | Joaquín decide (recomendado: Correos vía Sendcloud) |
| La maqueta del pie del libro | Joaquín y Naza |
| Las 26 plantillas de Kids en catalán y castellano de España | Meta |
