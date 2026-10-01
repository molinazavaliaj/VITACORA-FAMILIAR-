# Prueba 3 — receta v3 con la entrevista V3 de Naza (01/10/2026)

Libro entero con el workflow (`fabrica/scripts/escritor/workflow-libro.js`): 34 agentes, Opus escribe, USD 0 de API. Salida fuera de git (`VITACORA FAMILIAR-v3/audios-crudos/v3-web/nazareno/escritor-v3/`, con `informe.md` y `juicio-ciego/`). 8 capítulos + Antes de cerrar + Sus frases + carta, 7.174 palabras.

Bug encontrado al correr: C13 hacía imposible el plan cuando una R está en un episodio y en un balance (arreglado con test, c04fa08).

## Juicio a ciegas de Fable (un capítulo + el último)
| Par | Receta v3 | Libro anterior |
|---|---|---|
| Capítulo del hecho más fuerte | 5 | **6,5** |
| Último capítulo | **6** | 5 |

- Último: dejó de ser bolsa (columna, cierra en una imagen de hoy, 1 párrafo de reflexión contra 4). Pero perdió "el motor" del hoy y tiene un pasado sobre una persona viva.
- Capítulo fuerte: pierde. El hecho fuerte quedó en resumen en el medio, el título no apunta a él, un motivo pegado de otra respuesta, y es bolsa.
- Común a los dos libros: no buscan escenas en el material; respuestas con escena real quedaron sin usar.
- Ojo: Fable vio un capítulo por libro; parte de lo "perdido" puede estar en otro capítulo. Hay que cotejarlo antes de corregir.

## Controles del código (libro entero)
- Deriva del arreglo: 9 de 11 piezas con menos del 70 % de párrafos sin problema idénticos (la primera página y el último, 0 %): la única ronda reescribe de más.
- Abiertos después del arreglo: 10 (5 repeticiones C7 del último contra la primera página, 1 bolsa que siguió).
- C10 marcó "vos ya lo sabés" como tuteo: falsa alarma probable (al sacar tildes, "sabés" queda igual a "sabes").

## Decisión pendiente
No se corrió Joaquín: la v3 pierde el capítulo principal. Según la regla, se corrige la receta, no el libro.

---

# Prueba 3.1 — receta v3.1 (01/10/2026, misma entrevista)

Fable redactó la v3.1 (la v3 quedó en `historial/receta-v3.md`); código y 32 tests en `fabrica/scripts/escritor/`. Libro entero de nuevo (44 agentes), salida fuera de git en `escritor-v3-1/`.

## Qué mejoró (código, libro entero)
| | v3 | v3.1 |
|---|---|---|
| Piezas sin deriva en el arreglo (100 % de párrafos sin problema iguales) | 0 de 11 | 7 de 11 |
| Abiertos después del arreglo | 10 | 9 (5 son Sus frases) |
| Hechos fuertes sin escena que van a repreguntar | no se pedían | 6 en faltantes |
| "Era el chef" (pasado de persona viva) | impreso | lo marca C27 |

Bug encontrado: `[[FICHA]]` salía impreso (27 veces; 2 en la v3). Arreglado con test; el libro se reimprimió (solo código).

## Juicio a ciegas (Fable, mismo capítulo, contra el libro anterior)
| Corrida | v3.1 | Anterior |
|---|---|---|
| Con las marcas impresas | 5,5 | 6 |
| Sin las marcas (otro Fable) | 5,5 | **6,5** |

La v3.1 abre mejor (imagen concreta) y no inventa, pero **sigue perdiendo por el hilo**: el plan mete en ese capítulo cosas de hoy (sobrinos, un deseo de hoy), presenta el negocio dos veces y el arreglo cambió el título (el lector lo marcó genérico) por uno que ya no apunta al hecho fuerte. Lo que les falta a los dos: cómo terminó el hecho fuerte (la entrevista no lo trae) y párrafos de una línea "de golpe".

## Qué falta corregir (propuesta, sin hacer)
1. **Plan por época**: un capítulo lleva solo episodios de su tiempo; lo de "hoy" (estado `sigue_hoy` sin pasado propio) va al último o a Antes de cerrar. Control en C13 con `cuando` y el bloque "hoy".
2. **Título fijo**: el arreglo no cambia el título del plan; si el lector lo marca, va al informe.
3. **Un episodio, una vez en el texto** (el negocio presentado dos veces): C7 lo ve solo si repite 6 palabras.
4. Sin párrafos de una sola oración para hacer peso (C1).

Joaquín: no se corrió (la regla era correrlo si ganaba).
