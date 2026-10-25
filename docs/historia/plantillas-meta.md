# Vitácora de una historia · Plantillas de Meta para cargar

Son las 9 plantillas nuevas de «Vitácora de una historia»: tres bienvenidas en tres idiomas. Los textos salen tal cual del banco aprobado ([`banco.md`](banco.md) y [`idiomas/`](idiomas/)); esta hoja la generó el código, no se escribió a mano.

- **Categoría y botones:** las mismas que `bienvenida_v3_*` (la bienvenida de la V3 que ya está aprobada). Sin botones.
- **Variables:** `{{1}}`, `{{2}}` y `{{3}}`, en ese orden. Meta pide un ejemplo por variable: van abajo.
- **La pregunta y el recordatorio** no son nuevos: historia usa los de la V3 (`pregunta_diaria_*` y `m8_*`), que ya están.
- **Cuando Meta apruebe cada una**, se suma a la variable `WA_PLANTILLAS_HISTORIA_LISTAS` de Railway (entrevistador), separadas por coma. Con las 9: `es-AR:bienvenida,es-AR:bienvenida_regalo,es-AR:bienvenida_regalo_abierta,es-ES:bienvenida,es-ES:bienvenida_regalo,es-ES:bienvenida_regalo_abierta,ca:bienvenida,ca:bienvenida_regalo,ca:bienvenida_regalo_abierta`. Hasta que una esté en la lista, esa bienvenida no sale (y llega un aviso a los socios).
- **Prioridad:** las tres `bienvenida_historia_*` (para uno mismo) son las que se usan siempre. Las de regalo son de respaldo: el regalo normalmente recibe la bienvenida como texto al canjear el código, y la plantilla solo sale si ese texto no pudo salir.

## Argentina (vos)

### `bienvenida_historia_vos` · Para uno mismo

- **Idioma en Meta:** `es`
- **Ejemplos:** `{{1}}` = Marta · `{{2}}` = cuando te fuiste a vivir lejos
- **En la lista:** `es-AR:bienvenida` · ID del banco: BIEN-H

```
Hola, {{1}}, ¿cómo estás? Soy quien te va a entrevistar para armar tu libro sobre {{2}}. Lo hacemos acá, por WhatsApp, tranquilos. Te mando una pregunta por vez y vos me la contás en audio, como si me lo estuvieras contando en persona. ¿Arrancamos? Contestame SÍ. Con eso me das permiso para guardar lo que me mandes.
```

### `bienvenida_historia_regalo_vos` · Regalo con tema elegido

- **Idioma en Meta:** `es`
- **Ejemplos:** `{{1}}` = Marta · `{{2}}` = Pablo · `{{3}}` = cuando te fuiste a vivir lejos
- **En la lista:** `es-AR:bienvenida_regalo` · ID del banco: BIEN-HR

```
Hola, {{1}}, ¿cómo estás? Te escribo porque {{2}} te hizo un regalo. Es un libro sobre {{3}}, contado por vos, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos. Te mando una pregunta por vez y vos me la contás en audio, como si me lo estuvieras contando en persona. ¿Arrancamos? Contestame SÍ. Con eso me das permiso para guardar lo que me mandes.
```

### `bienvenida_historia_regalo_abierta_vos` · Regalo con tema abierto (lo elige quien recibe)

- **Idioma en Meta:** `es`
- **Ejemplos:** `{{1}}` = Marta · `{{2}}` = Pablo
- **En la lista:** `es-AR:bienvenida_regalo_abierta` · ID del banco: BIEN-HR-A

```
Hola, {{1}}, ¿cómo estás? Te escribo porque {{2}} te hizo un regalo. Es un libro sobre una historia de tu vida, la que vos elijas, contado por vos. Yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos. Te mando una pregunta por vez y vos me la contás en audio, como si me lo estuvieras contando en persona. ¿Arrancamos? Contestame SÍ. Con eso me das permiso para guardar lo que me mandes.
```

## España (castellano)

### `bienvenida_historia_es_es` · Para uno mismo

- **Idioma en Meta:** `es_ES`
- **Ejemplos:** `{{1}}` = Marta · `{{2}}` = cuando te fuiste a vivir fuera
- **En la lista:** `es-ES:bienvenida` · ID del banco: BIEN-H

```
Hola, {{1}}, ¿cómo estás? Soy quien te va a entrevistar para hacer tu libro sobre {{2}}. Lo hacemos aquí, por WhatsApp, con calma. Te mando las preguntas de una en una y tú me contestas con un audio, como si me lo estuvieras contando en persona. ¿Empezamos? Contéstame SÍ. Con eso me das permiso para guardar lo que me mandes.
```

### `bienvenida_historia_regalo_es_es` · Regalo con tema elegido

- **Idioma en Meta:** `es_ES`
- **Ejemplos:** `{{1}}` = Marta · `{{2}}` = Pablo · `{{3}}` = cuando te fuiste a vivir fuera
- **En la lista:** `es-ES:bienvenida_regalo` · ID del banco: BIEN-HR

```
Hola, {{1}}, ¿cómo estás? Te escribo porque {{2}} te ha hecho un regalo. Es un libro sobre {{3}}, contado por ti, y yo soy quien te va a entrevistar para hacerlo. Lo hacemos aquí, por WhatsApp, con calma. Te mando las preguntas de una en una y tú me contestas con un audio, como si me lo estuvieras contando en persona. ¿Empezamos? Contéstame SÍ. Con eso me das permiso para guardar lo que me mandes.
```

### `bienvenida_historia_regalo_abierta_es_es` · Regalo con tema abierto (lo elige quien recibe)

- **Idioma en Meta:** `es_ES`
- **Ejemplos:** `{{1}}` = Marta · `{{2}}` = Pablo
- **En la lista:** `es-ES:bienvenida_regalo_abierta` · ID del banco: BIEN-HR-A

```
Hola, {{1}}, ¿cómo estás? Te escribo porque {{2}} te ha hecho un regalo. Es un libro sobre una historia de tu vida, la que tú elijas, contado por ti. Yo soy quien te va a entrevistar para hacerlo. Lo hacemos aquí, por WhatsApp, con calma. Te mando las preguntas de una en una y tú me contestas con un audio, como si me lo estuvieras contando en persona. ¿Empezamos? Contéstame SÍ. Con eso me das permiso para guardar lo que me mandes.
```

## Catalán

### `bienvenida_historia_ca` · Para uno mismo

- **Idioma en Meta:** `ca`
- **Ejemplos:** `{{1}}` = Marta · `{{2}}` = quan te'n vas anar a viure lluny
- **En la lista:** `ca:bienvenida` · ID del banco: BIEN-H

```
Hola, {{1}}, com estàs? Soc qui t'entrevistarà per fer el teu llibre sobre {{2}}. Ho farem aquí, per WhatsApp, amb calma. T'aniré enviant les preguntes d'una en una i tu m'ho expliques amb un àudio, com si parléssim en persona. Comencem? Contesta'm SÍ. Amb això em dones permís per guardar el que m'enviïs.
```

### `bienvenida_historia_regalo_ca` · Regalo con tema elegido

- **Idioma en Meta:** `ca`
- **Ejemplos:** `{{1}}` = Marta · `{{2}}` = Pablo · `{{3}}` = quan te'n vas anar a viure lluny
- **En la lista:** `ca:bienvenida_regalo` · ID del banco: BIEN-HR

```
Hola, {{1}}, com estàs? T'escric perquè {{2}} t'ha fet un regal. És un llibre sobre {{3}}, explicat per tu, i jo soc qui t'entrevistarà per fer-lo. Ho farem aquí, per WhatsApp, amb calma. T'aniré enviant les preguntes d'una en una i tu m'ho expliques amb un àudio, com si parléssim en persona. Comencem? Contesta'm SÍ. Amb això em dones permís per guardar el que m'enviïs.
```

### `bienvenida_historia_regalo_abierta_ca` · Regalo con tema abierto (lo elige quien recibe)

- **Idioma en Meta:** `ca`
- **Ejemplos:** `{{1}}` = Marta · `{{2}}` = Pablo
- **En la lista:** `ca:bienvenida_regalo_abierta` · ID del banco: BIEN-HR-A

```
Hola, {{1}}, com estàs? T'escric perquè {{2}} t'ha fet un regal. És un llibre sobre una història de la teva vida, la que tu triïs, explicada per tu. Jo soc qui t'entrevistarà per fer-lo. Ho farem aquí, per WhatsApp, amb calma. T'aniré enviant les preguntes d'una en una i tu m'ho expliques amb un àudio, com si parléssim en persona. Comencem? Contesta'm SÍ. Amb això em dones permís per guardar el que m'enviïs.
```
