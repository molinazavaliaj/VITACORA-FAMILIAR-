# Kids: traspaso para terminar de armarlo (15/10/2026)

Para el chat que va a dejar Vitácora Kids («Mi Primer Capítulo», chicos de 11) vendiéndose de
punta a punta. Leé esto, después el README y el handoff de Kids, y recién ahí tocá código.

## Dónde está cada pieza

| Pieza | Dónde | Estado |
|---|---|---|
| **Motor de la entrevista** (banco, mensajes aprobados, flujo, 13 plantillas de Meta) | rama `vitacora-kids`, worktree `C:\Users\Naza\Desktop\01 VITACORA\VITACORA KIDS` (el handoff viejo dice otra ruta). Código en `fabrica/src/kids-v2/`, docs en `docs/kids/v2/` (empezar por `README.md` y `handoff-2026-10-05.md`). | Programado y aprobado: 286 tests, simulación de 800 chicos sin fallas. **No conectado** al entrevistador. Sin mergear a `main`. |
| **Web de Kids** (página `/kids`, compra `/comprar/kids` con las 3 pantallas aprobadas, landings `/kids/su-mundo` y `/kids/a-los-once`, solapa, foto en la portada) | rama `rediseno-web` (worktree `C:\Users\Naza\Desktop\VITACORA FAMILIAR-rediseno`), `web/src/app/_kids/`, `web/src/lib/kids.ts`, `web/src/app/comprar/kids/`, textos en `web/src/app/_textos/{kids,checkout-kids,landing-kids}.ts`. Se ve en https://vitacora-rediseno.vercel.app/kids | Hecho con la paleta de Kids. **No vende**: `KIDS_VENTA` apagado y `/api/compra` responde 409 a `producto: "kids"` a propósito. |
| **Panel de Kids** | — | No hecho (no hay datos de Kids en la base que mostrar). |
| **Libro de Kids** (fábrica: escribir y armar el libro con lo que contó el chico) | — | **No empezado.** |
| **Pendientes K1–K12** | `docs/rediseno-2026-10/PENDIENTES.md`, sección «Apuntado: Kids» (rama `rediseno-web`) | Lista completa con quién decide cada cosa. |

## Qué falta, en orden (lo que destraba lo siguiente)

1. **K1 + K2 · Contrato de datos de Kids.** Cómo se marca un pedido y un narrador Kids (precedente:
   Viaje usa `pedidos.extras.tipo = "viaje"` y `narradores.contexto.modo = "viaje"`), dónde va la
   `Ficha` del motor, dónde se guarda el WhatsApp del padre (canal A le escribe al chico y avisa al
   padre; canal B le escribe al padre), y dónde se guardan las respuestas del motor. Redactar la
   propuesta para `supabase/CONTRATO.md` y, si hace falta, la migración, **como propuesta para
   Joaquín** (la base es compartida: no se aplica nada sin su OK; las migraciones las aplica Naza).
2. **K3 · Conectar el motor al entrevistador** (README de Kids, «Cómo se conecta») y dejar listas
   las 13 plantillas de Meta para que Joaquín las cargue. `entrevistador/` es de Joaquín: todo en PR
   para que él lo revise, nunca directo a `main`.
3. **K4 · Que la compra cree el pedido de Kids** (`web/src/app/api/compra/route.ts` en
   `rediseno-web`): narrador con la ficha, pedido con la marca de K1, `confirmarPago` lo deja donde el
   motor lo lee; quitar el 409; tests. Después, `KIDS_VENTA="1"` y `PRECIO_KIDS_*` en Vercel (las
   carga Naza).
4. **K5 · Panel de Kids** para los padres (con «Tus preguntas para el libro» y «¿Quién se la
   manda?», aprobados en `docs/kids/v2/mensajes.md`), con el estilo nuevo de la web.
5. **El libro de Kids en la fábrica.** El escritor de Familiar (v5.5) **no sirve tal cual** para
   Kids (revisión general 05/10). Hay que diseñarlo con Naza: estructura, voz del chico, fotos.
6. **Textos y decisiones de Naza:** precio de Kids y si lleva impreso/marco (K6); textos del bot en
   es-ES y catalán, hoy solo rioplatense (K7); garantía de Kids (K8); textos de la web de Kids
   (`docs/rediseno-2026-10/kids/textos.md`, 50 líneas + titulares; la tanda 1 se le mandó y falta
   respuesta) (K12); landing «para los abuelos» (K10); fotos generadas (K11).
7. **Abogado (K9)** antes de vender: aviso de «algo preocupante» (LOPIVI / Ley 26.061), que el
   adulto autorice escribirle al chico en el canal A (WhatsApp pide 13 años), términos y privacidad
   de Kids.
8. **Piloto con un chico real** (Naza) antes de abrir la venta.

## Reglas de Kids (no negociables)

- El bot **no dice «me gusta», «me alegra» ni «con cariño»** al chico. Acuse aprobado: «Eso va al
  libro, con tus palabras».
- No se editan los md aprobados de `docs/kids/v2/` (banco, mensajes, flujo, decisiones, plantillas)
  sin Naza. Los textos del bot salen de `banco.json` (`npx tsx scripts/kids-v2-json.ts`), nunca
  escritos en el código.
- Sin amor, sin «tu hijo» ni «él» fijos, sin tiempos prometidos («tres semanas», «9 días»).
- No mergear Kids a `main` sin que Joaquín lo conecte y Naza lo pruebe.
- Cómo trabaja Naza: lo técnico de punta a punta sin preguntarle paso a paso; textos de a 10 en el
  chat, sin dos puntos, una versión recomendada; decisiones de plata y de negocio, juntas. Agente por
  tarea en su worktree, revisión que ejecuta antes de mergear. Le hablás en rioplatense.
