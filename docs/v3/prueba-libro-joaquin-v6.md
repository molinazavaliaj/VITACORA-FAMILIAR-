# Prueba del escritor v6 con la historia de Joaquín — 27/09/2026

Segundo narrador para no afinar el escritor solo con la vida de Naza (Joaquín también tiene 28; el público es 60+). Con permiso de Joaquín (vía Naza). Prompts v6 ([`prompts-escritor-v3.md`](prompts-escritor-v3.md)), índice por etapas (`etapas.ts`), capítulos en secuencia. USD 0 de API. Material y salidas en `fabrica/prueba-v3-joaquin/` (ignorada).

## Material
- 35 respuestas bajadas de Supabase (solo lectura) con las preguntas exactas que se le mandaron (`contexto.preguntasEnviadas`). Se sacó la respuesta de Ciro que se había cargado por error en su orden 27 (`dia_27.ogg`, bitácora del piloto). Quedan 34 (~11.600 palabras).
- **Sin dashboard:** la ficha es mínima (nombre, año, sin hijos) y las 37 dudas de la biblia quedaron sin respuesta. Lo único que hace de revisión es lo que él pidió en sus respuestas (que su socio de un emprendimiento no esté en el libro).

## Cómo salió
| Paso | Resultado |
|---|---|
| Biblia | 31 personas, 74 anécdotas, 44 eventos (24 con cambio), 40 citas, 37 dudas. 19 anécdotas sin año → validación → reintento → 0 |
| Etapas | 7 capítulos (1998–2010 … 2025–hoy); piso 7 % → 600 |
| Plan | "Volar con los tuyos". El prólogo cayó sobre un tema delicado sin respuesta → reintento → el título universitario (no había ninguna escena del presente) |
| Prólogo, 7 capítulos en secuencia, carta | ~7.800 palabras |
| Controles | 15 marcas; 6 reales (repeticiones) |
| Lectura final | 27 problemas, **7 altos** (4 contradicciones, 3 dudas afirmadas) |

## Hallazgos
1. **Sin dashboard, los errores altos son dudas.** La mitad de los 7 altos son cosas que la biblia marcó como duda y el narrador no contestó (con quién vive, cuándo murió una abuela, cuándo fue manager). Confirma que el dashboard no es opcional.
2. **Faltaba una regla: lo delicado sin respuesta se cuenta suave** (agregada al 1c). Sin ella, el prólogo contó con detalle una historia familiar dura.
3. **Pero "suave" se aplicó de más:** la biblia marcó como delicado cosas que no lo son (peleas de hermanos de chicos, una joda en la plaza, cruzar controles en moto en la pandemia para ver a la novia) y el escritor les sacó la escena. La lista de temas delicados tiene que aplicarse al pie de la letra en la biblia (cárcel, drogas, delitos, abuso, violencia real, sexo, suicidio, deudas, infidelidad, enfermedad, muerte), no por tono.
4. **Lo que el narrador pide en sus respuestas ("no me gustaría incluir mucho", "no quiero que esté en mi libro") tiene que llegar al escritor como reserva**, no como un dato más. La lectura final lo marcó como contradicción alta. El contrato ya tiene `respuestas.reservada` / `reservado_tramo` (propuesta del 20/09, sin aplicar): la V3 debería usarlo y mostrarlo en el dashboard.
5. **Sin escenas del presente no hay prólogo.** Joaquín no contó ningún momento de su hoy; el prólogo quedó en resumen. Es el caso exacto para el cazador de escenas (y para una pregunta de "hoy" en formato momento).
6. **Contradicciones del propio material** ("trabajaba con mi vieja… y trabajo no tenía") se copian y se leen como error. Van al dashboard como duda de contradicción.
7. **Una transcripción de nombre ("NASA" por Naza)** quedó como alias y duda: el control de nombres con la lista confirmada del dashboard lo resolvería.
