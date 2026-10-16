# Vitácora Kids · Traspaso para Joaquín (16/10/2026)

Todo lo técnico para vender Kids de punta a punta está hecho, en cinco PR encadenados. Ninguno está mergeado y todo
llega **apagado**: sin la migración, sin plantillas y sin variables, producción se comporta exactamente como hoy.

## Los PR, en orden

| # | Rama → base | Qué es | Qué mirar |
|---|---|---|---|
| [#46](https://github.com/molinazavaliaj/VITACORA-FAMILIAR-/pull/46) | `kids-datos` → `main` | La base: tabla `kids_v2`, `respuestas.clave_kids`, `envios.tipo 'kids'`, sección del CONTRATO. | Las 3 preguntas de «Para decidir con Joaquín» (la del padre en canal A ya la resolvió Naza). |
| [#47](https://github.com/molinazavaliaj/VITACORA-FAMILIAR-/pull/47) | `kids-conexion` → `kids-datos` | El motor (fábrica) copiado byte a byte al entrevistador y el bot de Kids (`entrevistador/src/kids-v2/`), los frenos para que lo viejo no toque a un chico, la respuesta al padre que escribe en canal A. | `docs/kids/v2/conexion-para-joaquin.md`. `webhook.ts` (un botón ahora trae `citaA`). |
| [#48](https://github.com/molinazavaliaj/VITACORA-FAMILIAR-/pull/48) | `kids-compra` → `rediseno-web` | La compra de Kids crea familia, narrador, pedido y fila de `kids_v2`; impreso como la casa; mail de acceso y «Pedido confirmado» de Kids. Solo AR (`KIDS_REGIONES`). | `web/src/app/api/compra/route.ts` (`comprarKids`), `web/src/lib/kids-compra.ts`. |
| [#49](https://github.com/molinazavaliaj/VITACORA-FAMILIAR-/pull/49) | `kids-panel` → `kids-compra` | El panel de los padres en `/tablero/<id>` (lo que cuenta, corregir nombres, sus preguntas, hora y temas, ver y aprobar el libro), `/admin/kids` para Naza y la página `/voz` de Kids. | Solo escribe `cambios_panel`, `correcciones` y `libro_aprobado_at`, como dice el CONTRATO. |
| [#50](https://github.com/molinazavaliaj/VITACORA-FAMILIAR-/pull/50) | `kids-libro` → `kids-conexion` | El libro: receta nueva sobre la máquina del escritor (`fabrica/src/escritor-kids/`), enchufada al worker con el interruptor `ESCRITOR_KIDS` (apagado). Audios de «Su voz» a mp3 por el worker de la PC (cambio mínimo en `voz/voz/cortar_frases.py`). | `docs/kids/v2/escritor/plan.md`, sección «El libro de Kids en la fábrica» del CONTRATO. |

Los textos que ve una persona están todos aprobados por Naza (tandas 1 a 7, 15 y 16/10;
`docs/rediseno-2026-10/kids/textos-aprobados-2026-10-15.md`, `docs/kids/v2/textos-aprobados-2026-10-16.md` y las
marcas `// APROBADO por Naza` en el código).

## Cómo se probó

- Entrevistador: 1136 tests y tipos. Fábrica: 2727 tests y `tsc`. Web: 1334 tests y `tsc`. Worker de voz: 164 tests.
- Motor: simulación de 800 chicos sin violaciones. Bot de punta a punta: 200 chicos en memoria (canal A y B), con
  reintentos de Meta, envíos y base que fallan y plantillas aprobadas tarde, sin violaciones.
- Libro: todo con el modelo falso sobre un chico inventado; el libro y el sobre salen en PDF. **Ninguna corrida
  paga**: Naza decidió que la primera sea con el chico real del piloto.
- Cada pieza pasó por una revisión aparte que corre los tests.
- **No probado contra Supabase ni WhatsApp de verdad.** En particular, el filtro jsonb de `cambios_panel` y
  `correcciones` (`.eq` con el JSON) conviene probarlo apenas esté la migración.

## Para prenderlo, en este orden

1. Revisar y mergear #46 → #47 → #50 (base, bot, libro) y #48 → #49 (web). Naza aplica la migración
   `20261016000000_kids_v2.sql`.
2. Cargar las 13 plantillas de `docs/kids/v2/plantillas-meta-kids.md` (español, Utilidad) las 13 de
   `docs/kids/v2/idiomas/plantillas-meta-kids-es-ES.md` (sufijo `_es_es`, idioma es_ES) y las 13 de
   `docs/kids/v2/idiomas/plantillas-meta-kids-ca.md` (sufijo `_ca`, idioma ca), 39 en total, y ponerlas en
   `WA_PLANTILLAS_KIDS_LISTAS` (Railway, entrevistador).
3. Actualizar el worker de voz en la PC de Naza (el cambio de `cortar_frases.py`).
4. Piloto con un chico real: compra de prueba, `ESCRITOR_KIDS=solo:<narrador_id>` en Railway (fábrica).
5. Recién después, en Vercel: `KIDS_VENTA=1` y `PRECIO_KIDS_ARS=85750`.

## Lo que falta y no es código

- Abogado: el aviso de algo preocupante, el permiso del adulto para escribirle al chico (WhatsApp pide 13 años),
  términos y privacidad de Kids.
- España: hecho el 16/10 (tanda 8). El bot, el libro y la web hablan en tú para España (`ficha.idioma = "es-ES"`), `KIDS_REGIONES = ["AR", "ES"]`, hora por defecto 20:00. Catalán: hecho el 16/10 (tanda 10), mismo camino (`ficha.idioma = "ca"`, `/ca` vende, 20:00 por defecto).
- La imprenta tiene que pegar el sobre (`sobre-imprenta.pdf`) a la contratapa.
