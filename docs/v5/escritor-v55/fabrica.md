# Escritor v5.5 en la fábrica: los prompts que la receta no tiene (06/10/2026)

**BORRADOR: Naza lo aprueba antes de la prueba paga.** Sobre todo "Dudas para la familia", porque lo que sale de ahí lo lee la familia.

La receta v5.5 ([`receta.md`](receta.md)) y la guía no cambian. Estos tres prompts existen porque en la sesión los hacía otra cosa (el workflow) o porque son pasos nuevos del diseño del 06/10 ([spec](../../superpowers/specs/2026-10-06-escritor-v55-fabrica-design.md)). Los compila `fabrica/scripts/escritor-prompts-json.ts` junto con la receta.

- **Disputa**: el texto que `fabrica/scripts/escritor-v55/workflow-libro.js` (línea 133) le daba al agente, sin lo que era de la sesión (leer y escribir archivos). Recibe los mismos documentos que la llamada `4-hechos`.
- **Dudas para la familia**, **Corrección del registro** y **Corrección del plan**: nuevos. **Borrador**: lo que sale de "Dudas para la familia" lo lee la familia en el dashboard, así que Naza aprueba este texto antes de la prueba paga.

Huecos que llena el código: `{{FRASE}}`, `{{ID}}`, `{{CITA}}` (disputa), `{{NOMBRE}}` y `{{IDIOMA}}` (dudas).

### Disputa

```
Sos el verificador de hechos de una biografía. Usá solo los documentos de arriba (guía, ficha, respuestas, registro); IGNORÁ el libro y las listas que vienen después de él.
Tu única tarea:
El escritor dice que esta frase del libro está respaldada por una respuesta. Frase del libro: "{{FRASE}}". Respuesta {{ID}}, frase que cita: "{{CITA}}". ¿La respuesta respalda la frase tal como está en el libro, incluido el tiempo verbal? Contestá solo {"respalda": true} o {"respalda": false, "por_que": ""}.
```

### Dudas para la familia

```
Preparás las preguntas que la familia de {{NOMBRE}} contesta antes de que se escriba su libro. Te paso la ficha y unas dudas de datos que encontró quien leyó la entrevista: nombres que pueden estar mal escritos, fechas que no cierran, dos personas que pueden ser la misma, respuestas que se contradicen. Cada duda trae lo que dijo {{NOMBRE}}, textual.

Para cada duda escribí una pregunta para la familia, en {{IDIOMA}}, que se pueda contestar sin haber escuchado la entrevista.
1. Una sola cosa por pregunta. Contá de qué se habla con lo que dijo, entre comillas, y preguntá el dato.
2. Frases simples y cortas. Nada de palabras de oficio (registro, transcripción, episodio, id, respuesta R..).
3. Si se contesta eligiendo, dos o tres opciones cortas con las palabras de lo que dijo. Si no, la lista de opciones va vacía.
4. No agregues nada que no esté en la duda o en lo que dijo.

Devolvé solo el JSON del esquema, una entrada por duda y con los mismos ids.
```

```json
{"dudas": [{"id": "D01", "pregunta": "", "opciones": []}]}
```

### Corrección del registro

```
Pasás al registro de hechos las correcciones que hizo la familia. Es una tarea mecánica: no escribís nada nuevo.
En la ficha, dentro de <confirmado_por_el_narrador>, están las correcciones: cada línea que empieza con "- " es una. Mandan sobre las respuestas y sobre el registro.
1. Cambiá solo lo que una corrección toca: un nombre, un apodo, una fecha, una relación, un lugar, dos personas que son la misma.
2. Devolvé ENTERA cada entrada que cambiaste, con su id y todos sus campos, tal como está en el registro pero con el cambio hecho. Las entradas de linea_de_tiempo se reconocen por "orden".
3. Si dos personas son la misma, devolvé la que queda, con todo junto, y poné el id de la otra en "borrar".
4. "confirmados" va completo: una entrada por cada línea de <confirmado_por_el_narrador>, con "usado_en" (los ids de las entradas del registro donde se usa ese dato).
5. No toques los ids de las respuestas (R01…) ni nada que ninguna corrección nombre.

Devolvé solo el JSON del esquema.
```

```json
{"personas": [], "lugares": [], "episodios": [], "linea_de_tiempo": [], "borrar": [], "confirmados": [{"texto": "", "usado_en": []}]}
```

### Corrección del plan

BORRADOR para que Naza lo apruebe. Va con el modelo barato, después de la corrección del registro y solo si C14 pasó. Recibe la ficha, el registro ya corregido y el plan actual.

```
Pasás al plan del libro las correcciones que hizo la familia. Es una tarea mecánica: no escribís nada nuevo y no reorganizás nada.
En la ficha, dentro de <confirmado_por_el_narrador>, están las correcciones: cada línea que empieza con "- " es una. Mandan sobre todo lo demás. El registro de arriba ya las tiene hechas.
1. Cambiá solo lo que una corrección toca: un nombre, un apodo, una fecha, una relación, un lugar, dos personas que son la misma. Cambialo en todos los lugares del plan donde aparezca (títulos, aperturas, cierres, piezas, frases, carta, faltantes).
2. Los mismos capítulos, en el mismo orden, con los mismos números, los mismos hilo_ids, las mismas piezas y los mismos ids. No agregues, no saques, no muevas ni reescribas nada que ninguna corrección toque.
3. Si dos personas son la misma, usá en el plan el id que quedó en el registro.
4. No toques los ids de las respuestas (R01…).

Devolvé el plan ENTERO, con el mismo esquema que tiene, y solo el JSON.
```

```json
{"titulo_libro": {}, "primera_pagina": {}, "capitulos": [], "antes_de_cerrar": {}, "sus_frases": [], "carta": {}, "faltantes": []}
```
