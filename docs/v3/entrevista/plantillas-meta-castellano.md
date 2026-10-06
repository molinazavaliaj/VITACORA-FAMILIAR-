# Plantillas de WhatsApp (Meta) para la entrevista V3 en castellano — 06/10/2026

Mismo molde que las catalanas ([`catala/plantillas-meta.md`](catala/plantillas-meta.md)): BIEN, M8 y M9 de cada banco, con `{{nombre}}` → `{{1}}`. Las únicas frases nuevas son las de `pregunta_v3`. Reglas de Meta (`entrevistador/PLANTILLAS.md`): variables posicionales, nunca al principio ni al final del cuerpo, cada una con su ejemplo. Ejemplos inventados.

Dentro de las 24 h todo va como texto libre. Las plantillas son solo para abrir la charla. Categoría: bienvenida y pregunta, Marketing; recordatorio y aviso, Utilidad.

Reemplazan a las viejas (`bienvenida`, `pregunta_diaria`, `pregunta_diaria_vos`, `recordatorio`), que prometen cosas que la V3 no hace ("cada mañana", "la pregunta de hoy", "responda SÍ").

**El trato sale del país (Naza, 05/10):** Argentina, de vos (`es_AR`, `contexto.idioma` vacío o `es-AR`); España, de tú (`es_ES`, `contexto.idioma = es-ES`); catalán, en catalán. "Usted" ya no existe.

---

## Argentina, de vos (idioma `es_AR`) — se le pasaron a Joaquín el 05/10

### `bienvenida_v3` — {{1}} cómo le dicen · botón de respuesta rápida **Empecemos**
```
Hola, {{1}}, ¿cómo estás? Una persona que te quiere mucho te regaló un libro con la historia de tu vida, y yo soy quien te va a entrevistar para armarlo. Lo hacemos acá, por WhatsApp, tranquilos.

Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines no hace falta que me avises: si pasan unos minutos sin audios nuevos, te mando la pregunta que sigue.

Si alguna pregunta no tiene que ver con tu vida, me decís que no, o me contás lo que sí te pasó a vos. Y sin apuro: esto lo hacemos al ritmo que vos quieras.
```
Ejemplo {{1}}: Marta

### `pregunta_v3` — {{1}} cómo le dicen · {{2}} la pregunta en una línea
```
Hola, {{1}}. Te dejo la pregunta que sigue.

{{2}}

Cuando quieras, me contestás con un audio. Sin apuro.
```
Ejemplos: {{1}} Marta · {{2}} ¿Cómo era la casa donde creciste? Contame qué te acordás de cuando entrabas.

### `recordatorio_v3` — {{1}} cómo le dicen
```
Hola, {{1}}. Pasaron unos días y quería saber cómo andás. Tu historia está acá, guardada tal como la dejaste. Cuando tengas un rato me contestás la que quedó pendiente. Sin apuro.
```
Ejemplo {{1}}: Marta

### `aviso_familia_v3` — {{1}} quién regaló · {{2}} cómo le dicen al narrador
```
Hola, {{1}}. Te aviso que {{2}} hace una semana que no manda audios. Puede ser cualquier cosa: que ande con otras cosas, que no mire mucho el celular o que le cueste un poco arrancar de nuevo. Si podés, pegale un llamado o hacele una visita y preguntale cómo viene con el libro; muchas veces con una charla con alguien de la familia se vuelve a enganchar. Lo que ya contó está guardado. Si hay algo que tenga que saber, me avisás.
```
Ejemplos: {{1}} Pablo · {{2}} Marta

---

## España, de tú (idioma `es_ES`) — textos de `banco-es-ES.md`, aprobado por Naza el 06/10

### `bienvenida_v3_es` — {{1}} cómo le dicen · botón de respuesta rápida **Empecemos**
```
Hola, {{1}}, ¿cómo estás? Una persona que te quiere mucho te ha regalado un libro con la historia de tu vida, y yo soy quien te va a entrevistar para hacerlo. Lo hacemos aquí, por WhatsApp, con calma.

Funciona así: te mando una pregunta y tú me contestas en un audio, como si me lo estuvieras contando en persona. Mándame todos los audios que quieras. Cuando termines no hace falta que me avises: si pasan unos minutos sin audios nuevos, te mando la pregunta siguiente.

Si alguna pregunta no tiene que ver con tu vida, me dices que no, o me cuentas lo que sí te pasó a ti. Y sin prisa: esto lo hacemos al ritmo que tú quieras.
```
Ejemplo {{1}}: Carmen

### `pregunta_v3_es` — {{1}} cómo le dicen · {{2}} la pregunta en una línea
```
Hola, {{1}}. Te dejo la pregunta siguiente.

{{2}}

Cuando quieras, me contestas con un audio. Sin prisa.
```
Ejemplos: {{1}} Carmen · {{2}} ¿Cómo era la casa donde creciste? Cuéntame qué recuerdas de cuando entrabas.

### `recordatorio_v3_es` — {{1}} cómo le dicen
```
Hola, {{1}}. Han pasado unos días y quería saber cómo estás. Tu historia está aquí, guardada tal como la dejaste. Cuando tengas un rato me contestas la que se ha quedado pendiente. Sin prisa.
```
Ejemplo {{1}}: Carmen

### `aviso_familia_v3_es` — {{1}} quién regaló · {{2}} cómo le dicen al narrador
```
Hola, {{1}}. Te aviso de que {{2}} lleva una semana sin mandar audios. Puede ser cualquier cosa: que esté con otras cosas, que no mire mucho el móvil o que le cueste un poco volver a ponerse. Si puedes, llámale por teléfono o hazle una visita y pregúntale cómo va con el libro; muchas veces con una charla con alguien de la familia se vuelve a enganchar. Lo que ya ha contado está guardado. Si hay algo que tenga que saber, me avisas.
```
Ejemplos: {{1}} Javier · {{2}} Carmen

Ojo: el aviso le llega a **quien regaló**. Si quien regala es de otro país que el narrador, mandarle la versión de su país.
