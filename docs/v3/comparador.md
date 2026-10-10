# Comparador de libros (vara fija)

Prompt fijo para comparar versiones del escritor sobre el mismo material, siempre igual, para que las pruebas se puedan comparar entre sí. Lo corre un agente de contexto limpio; después un segundo agente revisa su informe con `revisor-del-comparador` (abajo). La vara de referencia es el libro de la mañana del 26/09 (prompts v1-2), que le gustó a Naza.

Carpeta de cada comparación (ignorada por git): `libro-A.md`, `libro-B.md`… con las letras mezcladas, `material-respuestas.xml`, `material-ficha.xml` (ficha + lo que confirmó el narrador) y `.clave-no-leer` con qué versión es cada letra.

## Comparador

```
Tenés varias versiones del mismo libro de vida (libro-A.md, libro-B.md, …), escritas por sistemas distintos a partir del mismo material: las respuestas grabadas del narrador. El narrador va a leer tu informe; escribí en castellano rioplatense, directo.

En la carpeta: los libros; material-respuestas.xml (sus respuestas: la verdad); material-ficha.xml (su ficha y lo que confirmó en una revisión: también es verdad y manda sobre las respuestas). No leas nada fuera de la carpeta, y nunca el archivo .clave-no-leer. Material privado: no lo copies a otro lado.

Contestá con evidencia:

1. ¿Cuál tiene menos errores? Recorré CADA libro frase por frase contra el material y listá los errores reales, cada uno con: libro, frase exacta (corta), tipo (inventado | contradice el material o la ficha | fecha o plazo falso | nombre mal | fuera de orden | repetido entre capítulos | repetido dentro del capítulo | presentado dos veces | suena a respuesta de entrevista | dato que se perdió: algo importante del material que el libro no cuenta) y por qué, con el id R.. que lo prueba. No cuentes el estilo ni una paráfrasis fiel. Gravedad: alta (dato falso o importante perdido, que la familia notaría) o baja. El mismo criterio para todos.

2. ¿Cuál se lee con más vida y cuál más tieso? Como lector: ¿suena a él contando (su forma de hablar, sus giros, el humor) o a un informe cuidadoso? ¿Las escenas tienen cuerpo? ¿Va en orden y se entiende el paso del tiempo? ¿Hay relleno o vaguedades donde él dio un dato concreto? Dame ejemplos concretos emparejados: la misma escena en cada libro, citas cortas.

3. Un ranking de 1 a N en cada pregunta, con una línea de por qué.

Escribí el informe completo en informe.md dentro de la carpeta (tabla de errores por tipo y gravedad para cada libro, la lista completa, los ejemplos, el ranking) y respondé con la tabla y el ranking.
```

## Revisor del comparador

```
Sos revisor. Otro agente comparó versiones de un libro de vida contra el material del narrador y escribió informe.md. Verificalo con ojos de escéptico, no lo rehagas. Leé solo la carpeta (nunca .clave-no-leer). Material privado: no lo copies.

1. Cada error listado: CONFIRMADO, FALSO (el material lo respalda, la frase no está, no es error) o DUDOSO, con una línea de por qué.
2. Errores que no vio, sobre todo de gravedad alta, en todos los libros por igual: fechas, plazos, quién decidió qué, orden de los hechos, nombres, datos importantes perdidos.
3. ¿Los ejemplos de vida o tiesura están bien citados y son justos? ¿Hay contraejemplos importantes?
4. La tabla recalculada con lo confirmado y si el ranking se sostiene.
Escribí revision-del-informe.md en la carpeta y respondé con la tabla recalculada, lo FALSO, lo agregado y si el ranking se sostiene.
```
