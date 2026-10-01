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
