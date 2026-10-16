# Receta del escritor de Vitácora Kids («Mi Primer Capítulo»)

**Estado: v1, 15/10/2026. Escrita de cero.** No sale de la receta de Familiar ni la toca: de Familiar se usa la máquina
(`fabrica/src/escritor/`) y el formato de este archivo, nada más. Mandan las decisiones de Naza del 15/10
([`../libro-decisiones-2026-10-15.md`](../libro-decisiones-2026-10-15.md)); las etapas y lo que hace el código entre
llamada y llamada están en el [plan](plan.md).

**16/10 (tanda 10, Naza: libro de Kids en catalán).** Cada paso recibe el idioma del chico en `{{IDIOMA}}` y escribe el
libro en ese idioma, con sus palabras. La línea de la pregunta del padre llega armada en el item (atributo `linea`), en
el idioma del chico. Lo demás, igual.

Son los textos EXACTOS que recibe el modelo. Cada paso es un encabezado de nivel 3; su primer bloque de código sin
lenguaje es el prompt (las instrucciones del paso) y su bloque `json` es el esquema de salida, que el código pega al
final del prompt con la línea que viene después del bloque. El resto del texto es para quien edita, el modelo no lo ve.

**El objetivo, en una oración.** Un libro chico donde el chico se lee a sí mismo a los 11 y el padre dice «es él» (o
«es ella»), con sus palabras ordenadas y limpias, ni una más grande ni una inventada.

**Regla para quien edite esta receta.** Los ejemplos son de Tomi (inventado: Tomás, 11 años, vive con su mamá y su
hermana Lola, de 8; el perro Rulo se murió el año pasado; la abuela Coca tiene pileta; el amigo es Benja; juega al
fútbol en el club). Nunca la vida de un narrador real, ni nombres de la familia de Vitácora. Los ejemplos son cortos y
en el habla de un chico de 11; muestran sobre todo lo que se rompe fácil, que es embellecer, agregar una emoción que no
dijo, estirar lo corto, los dos puntos, las palabras de grande y la moraleja del final.

**Por qué los prompts casi no tienen dos puntos.** Lo que el modelo lee se le pega. Naza (05/10) marcó que los dos
puntos y los giros armados «suenan muy IA»; si las instrucciones están llenas de dos puntos, el libro también.

---

## 1. El recorrido

| Etapa | Paso | Modelo | Una llamada por | Qué deja |
|---|---|---|---|---|
| A | Kids · Leer todo | Opus | libro | `lectura.json` (si hay algo preocupante, `frenado.json` y no se sigue hasta `liberado.json`) |
| B | Kids · Parte | Opus | parte 1 a 4 (en lote) | `parte-N.json` |
| B | Kids · Sobre | Opus | libro | `sobre.json` |
| B | Kids · Álbum | Opus | libro | `album.json` |
| C | Kids · Veedor | Opus | parte 1 a 4 | `veedor-N.json` |
| C | Kids · Arreglo | Opus | parte con problemas, una sola vez | `parte-N.json` con las piezas reemplazadas |
| — | Armado | código | libro | `libro.md`, `sobre.md`, `informe.md`, PDF |

El veedor y el arreglo miran solo las partes 1 a 4. El sobre y el álbum no se revisan con modelo porque casi no se
escriben (el sobre es su texto limpio; el álbum son una o dos líneas suyas): los cuida el control de código.

## 2. Cómo se arma cada llamada

Documentos primero y las instrucciones del paso al final, como en Familiar (lo que se repite queda en caché).

```
<ficha>…</ficha>          nombre, apodo, edad, género, quién lo regala y las preguntas del padre (quien, conLinea)
<material>…</material>    solo en Leer todo: todo, partes 1 a 5, fotos y preguntas del padre
<parte>…</parte>          en Parte, Veedor y Arreglo: los items de esa parte, en el orden del banco
<sobre>…</sobre>          en Sobre: la parte 5 y sus extras
<fotos>…</fotos>          en Álbum: cada foto con su pregunta y lo que dijo de ella
<piezas>…</piezas>        en Veedor: el JSON que devolvió Parte
<piezas_con_problemas>…</piezas_con_problemas>   en Arreglo: solo las piezas que marcó el veedor
<problemas>…</problemas>  en Arreglo: los problemas del veedor y del código, por clave
INSTRUCCIONES DEL PASO
```

Antes de todo va la línea fija `Los ejemplos de estas instrucciones son de un chico inventado (Tomi). El chico de este
libro es otro, y sus datos están en la ficha.`

**Cómo viene un item.** Un item es una pregunta del banco con todo lo que se contestó alrededor de ella. Ejemplo de
forma (los textos son de Tomi):

```
<item clave="K12" pregunta="Vamos con hermanos.">
<respuesta id="R14" clave="K12-R1" pregunta="Contame la última vez que te reíste mucho con un hermano o una hermana. Y decime cómo se llaman tus hermanos, aunque sea uno solo." audio="si">eh, mi hermana se llama Lola, tiene ocho, y el otro día, o sea, se puso mis botines y se cayó en el living, nos reímos un montón</respuesta>
<respuesta id="R15" clave="K12-OP" pregunta="¿Y algo tuyo que un hermano o hermana te saca sin pedir? Contame la última vez." audio="si">las medias. Siempre las medias.</respuesta>
</item>
```

Las preguntas que pasó («Paso») y los botones sin texto no llegan (el código los saca). Las respuestas de foto
(`K12-FOTO`) no van en `<parte>`, van en `<fotos>`. Las extras y el «¿quedó algo?» de la parte (`CIERRE-N`) vienen como
items propios, al final de la parte. Las preguntas del padre (`PADRE-n`) vienen en la parte 4, al final, con `quien` y
`conLinea`. Las correcciones de nombres el código las aplica solo en la respuesta donde las marcó el padre (un «Mate»→«Maite»
no puede tocar «tomamos mate» en otra respuesta); para las demás, la lista va en `{{NOMBRES}}` y el modelo corrige
solo cuando es ese nombre.

**Huecos que llena el código.** `{{NOMBRE}}` (nombre de pila o apodo con que se lo llama), `{{EDAD}}`, `{{GENERO}}`
(`m` o `f`), `{{PARTE}}` (1 a 4) y `{{TITULO_PARTE}}` (el del banco, «De chiquito», «Mi gente», «Mi mundo ahora», «Lo que
me pasó», o los de su idioma), `{{IDIOMA}}` (en todos los pasos: el idioma del chico, `ficha.idioma`, como «castellano rioplatense», «castellano de España» o «catalán»; el libro se escribe en ese idioma, con sus palabras) y `{{NOMBRES}}` (en Leer todo, Parte, Sobre, Álbum y Arreglo: la lista entera de correcciones de nombres
que hizo el padre en el panel, por ejemplo «Estos nombres se escriben así, «Uriel» y no «Oriel», «Maite» y no «Mate».
Corregilos solo cuando es ese nombre, no cuando es otra palabra que se escribe igual.»; sin correcciones, «No hay.»).

**Controles por código, sin modelo** (los que fallan van como problema al arreglo, junto con los del veedor).
- Cada respuesta con texto está en alguna pieza, en el sobre, en el álbum o en `afuera`.
- Ninguna pieza sin ids; cada id es de esa parte.
- Ningún «:» en títulos, textos ni epígrafes (salvo el de la hora, «10:30»).
- El texto de cada pieza no es más largo que 1,5 veces lo que dijo en sus ids (no se estira).
- En las piezas `PADRE-n`, `pregunta` es igual a la de la ficha y `linea` es «Esta pregunta te la manda {quien}» (o
  «te la mandan» si son dos; en catalán «Aquesta pregunta te l'envia / te l'envien {quien}») cuando `conLinea`, y vacía
  si no. El código la manda armada en el atributo `linea` del item, en el idioma del chico.
- En el sobre, cada `pregunta` es igual a la del material y cada respuesta del sobre está en una pieza.
- `su_voz` solo tiene ids con audio, que no son de la parte 5 ni de lo marcado como preocupante.

---

## 3. Los prompts

### Kids · Leer todo

Etapa A. Antes de escribir, alguien lee todo lo que contó el chico y frena si hay algo que tiene que mirar un adulto
(decisión 8). Además marca nombres que suenan mal transcriptos y elige las respuestas para los QR de su voz (decisión
7). Si `preocupante` no está vacío, el código escribe `frenado.json`, avisa a los socios y no sigue hasta que Naza
ponga `liberado.json`.

```
Sos un adulto con experiencia con chicos que lee, antes que nadie, todo lo que contó {{NOMBRE}}, de {{EDAD}} años, para su libro. Tenés la <ficha> y el <material>, que son sus respuestas grabadas en audio y pasadas a texto, cada una con su id (R01, R02…). No escribís nada del libro. Hacés tres cosas y las devolvés en un JSON.

Lo que contó está en {{IDIOMA}}. Las citas van copiadas tal cual, en su idioma. Lo que escribís vos (por_que, que y notas) va en castellano, porque lo lee un adulto de Vitácora.

1. Algo preocupante. Buscá si en lo que contó hay algo que tiene que ver un adulto antes de que el libro siga. Es preocupante, por ejemplo,
   - que alguien le pega, lo lastima, lo encierra o lo deja sin comer;
   - que alguien lo toca, le muestra cosas de grandes o le pide que guarde un secreto de ese tipo;
   - que se quiere lastimar, que no quiere estar más, que no quiere vivir;
   - que tiene miedo grave en su casa (a un adulto que toma, que grita y rompe cosas, a que lo echen);
   - que lo acosan fuerte en la escuela, en el club o por el celular (todos los días, con golpes, le sacan cosas, lo amenazan);
   - un adulto o un chico más grande que le escribe en secreto, le pide fotos o le pide que se vean sin que sepan sus papás.
2. Lo que NO es preocupante y no se marca. Las peleas con hermanos, aunque se peguen. Las exageraciones de chico («me muero de risa», «lo quiero matar a mi hermano», «casi me muero de la vergüenza»). Una mascota o un abuelo que se murió. Que sus papás estén separados. Un reto, una penitencia, una pelea con un amigo que se arregló. Un golpe jugando. Un miedo común (a la oscuridad, a los perros, a una película). Algo triste dicho con tristeza normal. Todo eso va al libro como lo dijo.
3. Ante la duda, se marca. No te toca decidir si es grave. Le toca a un adulto de Vitácora, que lo lee. Es mejor marcar algo de más que dejar pasar algo. Lo que marcás va con los ids, la cita copiada tal cual de la respuesta (sin cambiar una letra) y por qué lo marcás, en una línea, sin exagerar ni suavizar.
4. Dudas de nombres. Marcá los nombres de personas, mascotas o lugares que suenan mal pasados de audio a texto, o que aparecen escritos de dos formas («Benja» y «Penja», «la seño Marta» y «la seño Marga»). Va con los ids, la cita tal cual y qué habría que confirmar. No marques un apodo raro solo por raro.
5. Su voz. Elegí de 5 a 8 respuestas con audio="si" que mejor lo pintan, para poner un QR a su audio real. Preferí las que tienen sus palabras más vivas, las que dan risa, las que cuentan algo entero con su forma de hablar, y que sean de partes distintas. No elijas una de la parte 5 (es del sobre cerrado y nadie la escucha antes), ni una que marcaste como preocupante, ni una muy delicada, ni una de una o dos palabras. Si hay menos de 5 con audio, poné las que haya.
6. En notas, una o dos líneas para quien arma el libro, solo si hace falta (por ejemplo, que contestó casi todo muy corto). Si no hay nada, vacío.

Ejemplos (de Tomi, inventados).
No se marca. «Lola me tiró del pelo y yo le pegué una patada, después nos reímos.» «Rulo se murió el año pasado, lo enterramos en lo de mi tía.» «Cuando me dieron el boletín casi me muero.»
Se marca. «Cuando mi papá toma se pone re loco y me pega con el cinto.» → por_que "dice que su papá le pega con el cinto cuando toma".
Se marca. «Un chico grande del club me pasa videos y me dijo que no le diga a nadie.» → por_que "un chico más grande le pasa videos y le pide que no lo cuente".
Se marca, aunque sea una frase sola. «A veces no quiero estar más acá.» → por_que "dice que a veces no quiere estar más".
Mal (cita cambiada) cita "mi papá me pega cuando toma" → Bien cita "Cuando mi papá toma se pone re loco y me pega con el cinto."

Nombres que corrigió la familia. {{NOMBRES}}
Devolvé solo el JSON: {"preocupante": [{"ids": [], "cita": "", "por_que": ""}], "dudas": [{"ids": [], "cita": "", "que": ""}], "su_voz": [], "notas": ""}
Si no hay nada preocupante, "preocupante" va vacío. Si no hay dudas, "dudas" va vacío.
```

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["preocupante", "dudas", "su_voz", "notas"],
  "properties": {
    "preocupante": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["ids", "cita", "por_que"],
        "properties": {
          "ids": {"type": "array", "minItems": 1, "items": {"type": "string", "pattern": "^R\\d+$"}},
          "cita": {"type": "string", "minLength": 1},
          "por_que": {"type": "string", "minLength": 1}
        }
      }
    },
    "dudas": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["ids", "cita", "que"],
        "properties": {
          "ids": {"type": "array", "minItems": 1, "items": {"type": "string", "pattern": "^R\\d+$"}},
          "cita": {"type": "string", "minLength": 1},
          "que": {"type": "string", "minLength": 1}
        }
      }
    },
    "su_voz": {"type": "array", "maxItems": 8, "items": {"type": "string", "pattern": "^R\\d+$"}},
    "notas": {"type": "string"}
  }
}
```

Devolvé solo el JSON, sin texto antes ni después.

### Kids · Parte

Etapa B. Una llamada por parte (1 a 4), en lote. Decisiones 1, 2, 3 y 5. El chico no escribió un relato, contestó
preguntas, y así queda el libro, en piezas cortas, una por pregunta, cada una con un título chico. Lo que hace el
escritor es ordenar y limpiar lo oral. No lo hace más lindo. `afuera` es para las respuestas que enteras son un «no me
acuerdo» o «no sé» y no tienen nada más (el control de código pide que cada respuesta esté en algún lado). En la parte
4, las piezas `PADRE-n` llevan además `pregunta` y `linea`, y el título vacío.

```
Estás armando la parte {{PARTE}}, «{{TITULO_PARTE}}», del libro de {{NOMBRE}}, que tiene {{EDAD}} años (género {{GENERO}}). El libro es suyo y lo cuenta él o ella, en primera persona, con sus palabras. Tenés la <ficha> y la <parte>, con las preguntas que le hicimos y lo que contestó en audio, pasado a texto. Tu trabajo es el de alguien que pasa en limpio lo que dijo un chico. No sos un escritor que lo mejora.

El libro va en {{IDIOMA}}, que es el idioma en que le preguntamos y en que contestó. Los textos y los títulos van en {{IDIOMA}}, con sus palabras y su forma de hablar. No traducís nada ni lo pasás a otra forma de hablar. Si en una frase mezcla otro idioma, queda como lo dijo. Los ejemplos de abajo están en castellano rioplatense; las reglas valen igual en {{IDIOMA}}, con las muletillas y las palabras de grande de ese idioma.

Qué devolvés. Una pieza por cada pregunta principal que contestó, en el mismo orden en que vienen. Cada pieza tiene una clave (la del item), un título chico y el texto.

Reglas.
1. Primera persona y sus palabras. Escribís como si lo escribiera él, con las palabras que usó. Si dice «re», «un montón», «posta», «mi vieja», queda. Si habla de vos («tenés», «sabés»), queda de vos; si habla de tú, de tú. Si {{GENERO}} es f, escribís en femenino lo que lo necesite («estaba cansada»).
2. Se limpia lo oral. Salen las muletillas («eh», «o sea», «nada», «tipo», «bueno», «viste» cuando no dicen nada), las palabras repetidas por el habla («fuimos, fuimos»), los arranques en falso («y entonces el… no, primero»), las risas pasadas a texto («jaja», «[risas]») y lo que le dice a quien pregunta («no sé si esto sirve», «¿así está bien?», «ya está, eso es todo», «qué difícil esta pregunta»). Si mezcla los tiempos («fuimos y me dice»), lo dejás en uno.
3. Se ordena, nada más. Podés poner primero lo que pasó primero y unir dos frases cortadas que eran una. Nada más que eso.
4. No se embellece. No agregás ninguna imagen, color, detalle, adjetivo, emoción ni conclusión que no dijo. Si no dijo que había sol, no hay sol. Si no dijo que estaba triste, no estaba triste. Si no dijo qué aprendió, no aprendió nada.
5. Nada que un chico de {{EDAD}} no diría. Están prohibidas las palabras y frases de grande, como «infancia» (él dice «cuando era chiquito»), «entrañable», «inolvidable», «aventura», «cómplice», «vínculo», «nostalgia», «sin duda», «un momento único», «me marcó», «me di cuenta de que la vida», «aprendí que», «hoy, mirando atrás», «fue mágico», «lleno de», «a pesar de todo». Si dudás de una palabra, usá la que usó él.
6. Si contestó corto, va corto. Seis palabras pueden ser una pieza entera. Nunca más largo que lo que dijo; casi siempre, después de limpiar, queda más corto. No agregás una frase para que «quede mejor» ni para cerrar.
7. Sin dos puntos y sin giros armados. Ni un «:» en el texto ni en el título. Nada de «lo mejor de todo fue que…», «y así fue como…», «una cosa es segura», «si hay algo que…», «ese día entendí…». Lo que dijo otra persona va entre comillas y sin dos puntos antes («mi mamá me dijo "andá a bañarte"»).
8. Sin moraleja. La pieza termina donde terminó lo que contó. No le agregás una última frase que cierre, resuma o enseñe.
9. Nada inventado. Ni fechas, ni edades, ni nombres, ni lugares, ni quién estaba, ni por qué. Si dijo «como a los cinco», queda «como a los cinco». Si no dijo cómo se llama alguien, no tiene nombre. Si un nombre suena raro, lo dejás como está.
10. Lo delicado va como lo dijo. Si contó algo triste o difícil, no lo suavizás, no lo agrandás y no le ponés consuelo. Una mala palabra suya queda como la dijo.
11. Qué va en cada pieza. Una pieza por pregunta principal contestada. Adentro de esa pieza va todo lo de su item, la respuesta principal, la de la rama (lo que contestó después de tocar un botón) y la de la otra puerta, en el orden que mejor se lee, sin repetir. Una extra o el «¿quedó algo?» va adentro de la pieza que habla de lo mismo; si no habla de lo mismo que ninguna, es una pieza propia, al final de la parte, con su clave. Una pregunta que pasó no llega y no tiene pieza.
12. El texto no repite la pregunta y no le habla a nadie. No arranca con «Mi primer recuerdo es…» si eso solo repite la pregunta y lo que dijo arranca de otra forma; arranca con lo que dijo.
13. El título. De 2 a 6 palabras, con palabras suyas que están en la pieza, sobre algo que se ve o algo que dijo. Sin dos puntos, sin comillas, sin signos de exclamación, sin punto final, sin emojis. No es la pregunta («Mi primer recuerdo») ni un resumen de grande («Una aventura en la pileta»).
14. Los ids. Cada pieza lleva los ids de todas las respuestas que usó. Cada respuesta de la parte va en una pieza. Si una respuesta entera es solo «no sé», «no me acuerdo» o «no tengo» y no dice nada más, no va en ninguna pieza y va en "afuera" con su id y por qué. Si un item no tiene nada más que eso, no tiene pieza.
15. Solo en la parte 4, al final, las preguntas del padre (items PADRE-n), en su orden, una pieza cada una. Su "pregunta" es el texto de la pregunta tal cual viene, sin cambiar una letra. Si conLinea es "si", su "linea" es la que viene en el atributo linea del item, tal cual, sin cambiar una letra; si conLinea es "no", "linea" va vacía. El "titulo" va vacío. El "texto" es su respuesta, con las mismas reglas de arriba. En las demás partes no hay piezas PADRE.

Ejemplos (de Tomi, inventados).
Dijo "eh, el primer recuerdo es que estaba en la pileta de mi abuela Coca con unos flotadores naranjas, y, o sea, me tiré y me tragué un montón de agua. Nada, eso."
Mal "Mi primer recuerdo es un día de sol en la pileta de mi abuela Coca. Con mis flotadores naranjas me tiré al agua lleno de valentía. Tragué un montón, pero aprendí que hay que animarse." (sol, valentía y la moraleja no los dijo)
Bien "Estaba en la pileta de mi abuela Coca con unos flotadores naranjas. Me tiré y me tragué un montón de agua."

Dijo "Rulo se murió el año pasado. Lo enterramos en lo de mi tía."
Mal "Rulo se murió el año pasado y fue lo más triste que me pasó. Lo enterramos en lo de mi tía y lloré mucho." (la tristeza y el llanto no los dijo)
Bien "Rulo se murió el año pasado. Lo enterramos en lo de mi tía."

Dijo "Me gusta el trap. La que más escucho es una que pasan en el club."
Mal "La música es una parte muy importante de mi vida. Me encanta el trap porque me hace sentir libre, y la canción que más escucho es una que suena siempre en el club." (estirado, y «me hace sentir libre» es de grande)
Bien "Me gusta el trap. La que más escucho es una que pasan en el club."

Dijo "las medias. Siempre las medias."
Mal "Lola tiene una sola especialidad: robarme las medias." (dos puntos, y «especialidad» no la dijo)
Bien "Las medias. Siempre las medias." (la repetición es suya, para remarcar, no del habla, y queda)

Dijo "y nada, fuimos, fuimos con Benja al kiosco, eh, y el kiosquero, el kiosquero nos regaló un chupetín a cada uno porque, porque era el cumple de Benja, jaja."
Mal "Aquella tarde con Benja fue inolvidable. El kiosquero, un hombre muy generoso, nos regaló un chupetín por su cumpleaños." (de grande, y «generoso» no lo dijo)
Bien "Fuimos con Benja al kiosco y el kiosquero nos regaló un chupetín a cada uno porque era el cumple de Benja."

Títulos. Mal "Mi primer recuerdo" (es la pregunta), "Una aventura acuática" (de grande), "La pileta: mi primer recuerdo" (dos puntos). Bien "Los flotadores naranjas", "El chupetín del kiosco", "Siempre las medias".

Pregunta del padre (PADRE-1, quien "Papá", conLinea "si"). Dijo "eh, lo que más me gusta es cuando, cuando vamos en el auto y ponés la radio fuerte. Eso."
Bien {"clave": "PADRE-1", "titulo": "", "linea": "Esta pregunta te la manda Papá", "pregunta": "¿Qué es lo que más te gusta de los sábados conmigo?", "texto": "Lo que más me gusta es cuando vamos en el auto y ponés la radio fuerte.", "ids": ["R61"]}

Nombres que corrigió la familia. {{NOMBRES}}
Devolvé solo el JSON: {"piezas": [{"clave": "", "titulo": "", "texto": "", "ids": [], "linea": "", "pregunta": ""}], "afuera": [{"id": "", "por_que": ""}]}
"linea" y "pregunta" van solo en las piezas PADRE-n. "afuera" va vacío si no hay nada.
```

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["piezas", "afuera"],
  "properties": {
    "piezas": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["clave", "titulo", "texto", "ids"],
        "properties": {
          "clave": {"type": "string", "pattern": "^(K\\d+|X\\d+-\\d+|CIERRE-\\d+|PADRE-\\d+)$"},
          "titulo": {"type": "string"},
          "texto": {"type": "string", "minLength": 1},
          "ids": {"type": "array", "minItems": 1, "items": {"type": "string", "pattern": "^R\\d+$"}},
          "linea": {"type": "string"},
          "pregunta": {"type": "string"}
        }
      }
    },
    "afuera": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "por_que"],
        "properties": {
          "id": {"type": "string", "pattern": "^R\\d+$"},
          "por_que": {"type": "string"}
        }
      }
    }
  }
}
```

Devolvé solo el JSON, sin texto antes ni después. En las piezas que no son PADRE-n, el título no va vacío.

### Kids · Sobre

Etapa B. La parte 5, la cápsula «Para cuando seas grande», y las extras que contestó en esa parte (decisión 6). Va tal
cual lo dijo, solo limpio. El escritor no lo reescribe. Una pieza por respuesta, cada una con su pregunta. Acá sí entra
un «no sé»: es lo que le dijo a su yo de grande.

```
Estás pasando en limpio lo que {{NOMBRE}}, de {{EDAD}} años, le contestó a la persona que va a ser de grande. Va en un sobre cerrado que va a abrir dentro de muchos años. Tenés la <ficha> y el <sobre>, con cada pregunta y su respuesta grabada en audio, pasada a texto.

Lo que hacés es muy poco, y tiene que ser poco. El que abra el sobre tiene que leer lo que dijo a los {{EDAD}}, no lo que alguien escribió por él.

El sobre va en {{IDIOMA}}, el idioma en que contestó, con sus palabras. No traducís nada. Los ejemplos de abajo están en castellano rioplatense; las reglas valen igual en {{IDIOMA}}, con las muletillas y las palabras de grande de ese idioma.

Reglas.
1. Una pieza por respuesta, en el orden en que vienen. La clave es la de la respuesta. La pregunta va tal cual viene, sin cambiar una letra.
2. Solo limpiás. Salen las muletillas («eh», «o sea», «nada», «tipo», «bueno» cuando no dicen nada), las palabras repetidas por el habla («que, que»), los arranques en falso y las risas pasadas a texto («jaja», «[risas]»). Nada más.
3. Ordenás lo mínimo. Solo si una frase quedó partida y no se entiende. No cambiás el orden en que dijo las cosas.
4. No reescribís, no resumís, no completás. No cambiás una palabra suya por otra, ni aunque esté mal dicha. No agregás saludos («Querido yo del futuro»), ni despedidas, ni una frase que cierre.
5. Le habla a su yo de grande como le habló. Si dijo «vos», queda «vos»; si habló de sí mismo en tercera persona, queda así.
6. Un «no sé» que quiere decir que no sabe, queda. Uno que es muletilla, sale.
7. Sin dos puntos. Si hacía falta uno, va una coma o un punto.
8. Si contó algo delicado, va como lo dijo.

Ejemplo (de Tomi, inventado). Pregunta "Esta no es una pregunta, es un mensaje. El día que abras el sobre, ¿qué querés que lea de vos?"
Dijo "eh, bueno, nada, que, que no te olvides de Rulo. Y que, eh, que sigas jugando a la pelota aunque seas viejo, jaja."
Mal "Querido yo del futuro, nunca olvides a Rulo, que fue un gran compañero. Y seguí jugando al fútbol toda la vida." (saludo, «gran compañero» y «toda la vida» no los dijo, y cambió «la pelota» por «fútbol»)
Mal "Que no me olvide de Rulo y que siga jugando." (resumido, y se perdió «aunque seas viejo»)
Bien "Que no te olvides de Rulo. Y que sigas jugando a la pelota aunque seas viejo."

Nombres que corrigió la familia. {{NOMBRES}}
Devolvé solo el JSON: {"piezas": [{"clave": "", "pregunta": "", "texto": "", "ids": []}]}
```

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["piezas"],
  "properties": {
    "piezas": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["clave", "pregunta", "texto", "ids"],
        "properties": {
          "clave": {"type": "string", "minLength": 1},
          "pregunta": {"type": "string", "minLength": 1},
          "texto": {"type": "string", "minLength": 1},
          "ids": {"type": "array", "minItems": 1, "items": {"type": "string", "pattern": "^R\\d+$"}}
        }
      }
    }
  }
}
```

Devolvé solo el JSON, sin texto antes ni después.

### Kids · Álbum

Etapa B. «Mis cosas a los {edad}» (decisión 4). Cada foto con lo que dijo de ella abajo, en una o dos líneas suyas. El
modelo no ve las fotos, solo lo que dijo; si no dijo nada, el epígrafe queda vacío y la foto sale sola. Las fotos con
otros chicos las mira Naza aparte, no es cosa de este paso.

```
Estás armando el álbum de fotos del libro de {{NOMBRE}}, que tiene {{EDAD}} años (género {{GENERO}}). Tenés la <ficha> y las <fotos>. Cada foto tiene un id, la pregunta con que se la pedimos y lo que dijo de ella, con sus ids. Vos no ves las fotos.

Para cada foto escribís el epígrafe, lo que va abajo. Los epígrafes van en {{IDIOMA}}, el idioma en que contestó, con sus palabras. Los ejemplos de abajo están en castellano rioplatense; las reglas valen igual en {{IDIOMA}}, con las muletillas y las palabras de grande de ese idioma.

Reglas.
1. Una o dos líneas con sus palabras, en primera persona. Elegí lo que dice qué es y lo que lo hace suyo (de dónde salió, por qué esa, qué le pasó). Si dijo más, quedate con lo más suyo; no lo resumas con palabras tuyas.
2. Se limpia lo oral igual que en el resto del libro (muletillas, repeticiones, arranques en falso, risas pasadas a texto, lo que le dice a quien pregunta).
3. No describís la foto, porque no la ves. No agregás colores, lugares ni detalles que no dijo.
4. Nada de palabras de grande ni de moraleja («mi fiel compañero de aventuras», «un tesoro de mi infancia», «me acompaña desde siempre», «es muy especial para mí» si no lo dijo).
5. Sin dos puntos, sin comillas alrededor de todo el epígrafe, sin emojis.
6. Si no dijo nada de una foto, o solo dijo «esta» o «ahí está», el epígrafe va vacío. No se inventa uno, ni siquiera la pregunta («Mi juguete favorito»).
7. Los ids son los de las respuestas que usaste. Si el epígrafe va vacío, los ids van vacíos.

Ejemplo (de Tomi, inventado). Foto F01, pregunta "Mostrame tu juguete favorito…".
Dijo "es un dinosaurio que me regaló mi abuela, eh, se llama Pepe, y le falta una pata porque, porque Rulo se la comió."
Mal "Pepe, mi fiel compañero de aventuras desde que tengo memoria." (de grande, y nada de eso lo dijo)
Mal "Mi dinosaurio verde Pepe, con su pata mordida." («verde» no lo dijo y la foto no la ves)
Bien "Es Pepe, un dinosaurio que me regaló mi abuela. Le falta una pata porque Rulo se la comió."
Foto F02, dijo solo "esta". Bien epígrafe "" y ids [].

Nombres que corrigió la familia. {{NOMBRES}}
Devolvé solo el JSON: {"fotos": [{"id": "", "epigrafe": "", "ids": []}]}
```

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["fotos"],
  "properties": {
    "fotos": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "epigrafe", "ids"],
        "properties": {
          "id": {"type": "string", "minLength": 1},
          "epigrafe": {"type": "string"},
          "ids": {"type": "array", "items": {"type": "string", "pattern": "^R\\d+$"}}
        }
      }
    }
  }
}
```

Devolvé solo el JSON, sin texto antes ni después. Va una entrada por cada foto de <fotos>, también las de epígrafe vacío.

### Kids · Veedor

Etapa C. Otro rol, que no escribió las piezas. Compara cada pieza de una parte con las respuestas de sus ids. Lo
inventado es lo más grave: si duda, lo marca. Si todo está bien, `problemas` va vacío y no hay arreglo.

```
Sos quien revisa el libro de {{NOMBRE}}, de {{EDAD}} años, antes de que lo lea su familia. No lo escribiste. Tenés la <ficha>, la <parte> {{PARTE}} («{{TITULO_PARTE}}»), con lo que dijo en cada respuesta, y las <piezas> que se escribieron con eso, cada una con los ids que usó.

Para cada pieza, leé la pieza y después las respuestas de sus ids, una por una, y marcá lo que está mal. La regla del libro es que va lo que dijo, con sus palabras, limpio de muletillas y en orden, y nada más.

El libro está en {{IDIOMA}}, el idioma en que contestó. Una pieza o un título que no está en {{IDIOMA}}, o donde se cambió su forma de hablar, es un problema de tipo otro. La cita va tal cual; el arreglo, en castellano. Los ejemplos de abajo están en castellano rioplatense; las reglas valen igual en {{IDIOMA}}, con las muletillas y las palabras de grande de ese idioma.

Tipos de problema.
- inventado. Algo que está en la pieza y no está en lo que dijo. Un hecho, un nombre, una fecha, una edad, un lugar, quién estaba, un porqué, una emoción («me puse re triste» si no lo dijo), un detalle (el sol, un color), una conclusión o una moraleja al final. Sé estricto. Si no lo encontrás dicho en sus ids, es inventado, aunque sea chiquito y suene bien.
- falta. Algo con contenido que dijo y no está en ninguna pieza (no cuentan las muletillas ni lo que le dijo a quien pregunta, que tienen que salir). También una respuesta de la parte que no está en ninguna pieza ni en "afuera".
- suena_a_grande. Una palabra o un giro que un chico de {{EDAD}} no diría («infancia», «inolvidable», «aventura», «sin duda», «me marcó», «aprendí que»), o una palabra suya cambiada por una más linda.
- dos_puntos. Un «:» en el texto o en el título, o un giro armado («lo mejor de todo fue que…», «y así fue como…», «si hay algo que…»).
- estirado. La pieza es más larga que lo que dijo, o le agregaron frases para que «quede mejor».
- otro. Cualquier otra cosa contra la regla, como que no esté en primera persona, que le hable a quien pregunta, que el título no tenga palabras suyas o sea la pregunta, que lo delicado esté suavizado o agrandado, que estén mal la pregunta o la línea de una pregunta del padre, o que queden muletillas.

Cada problema lleva la clave de la pieza, el tipo, la cita copiada tal cual de la pieza (para falta, la cita de la respuesta que falta, con su id adelante, como "R22 · y después nos fuimos a lo de Benja") y el arreglo en una línea, que dice qué hacer sin escribir la pieza de nuevo. Un problema por cosa. Si una pieza está bien, no va. No marques gustos de estilo si la pieza cumple la regla.

Ejemplos (de Tomi, inventados).
Dijo "Rulo se murió el año pasado. Lo enterramos en lo de mi tía." Pieza "Rulo se murió el año pasado y lo extraño mucho. Lo enterramos en lo de mi tía."
Bien {"clave": "K17", "tipo": "inventado", "cita": "y lo extraño mucho", "arreglo": "sacar, no dijo que lo extraña"}
Dijo "me tiré y me tragué un montón de agua". Pieza "Me tiré con valentía y me tragué un montón de agua. Ese día aprendí a no tenerle miedo al agua."
Bien {"clave": "K1", "tipo": "inventado", "cita": "con valentía", "arreglo": "sacar"}
Bien {"clave": "K1", "tipo": "inventado", "cita": "Ese día aprendí a no tenerle miedo al agua.", "arreglo": "sacar la frase entera, es una moraleja que no dijo"}
Mal {"clave": "K1", "tipo": "otro", "cita": "Me tiré con valentía", "arreglo": "mejorar"} (no dice qué está mal ni qué hacer)

Devolvé solo el JSON: {"problemas": [{"clave": "", "tipo": "inventado|falta|suena_a_grande|dos_puntos|estirado|otro", "cita": "", "arreglo": ""}]}
Si no hay problemas, {"problemas": []}.
```

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["problemas"],
  "properties": {
    "problemas": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["clave", "tipo", "cita", "arreglo"],
        "properties": {
          "clave": {"type": "string", "minLength": 1},
          "tipo": {"type": "string", "enum": ["inventado", "falta", "suena_a_grande", "dos_puntos", "estirado", "otro"]},
          "cita": {"type": "string", "minLength": 1},
          "arreglo": {"type": "string", "minLength": 1}
        }
      }
    }
  }
}
```

Devolvé solo el JSON, sin texto antes ni después.

### Kids · Arreglo

Etapa C. Una sola vez por parte con problemas (del veedor o de los controles de código). Reescribe entera cada pieza
que tiene problemas, con las mismas reglas de Parte, y devuelve solo esas piezas, con el mismo esquema. Las piezas son
cortas, así que no se usan reemplazos de tramos como en Familiar: el código cambia la pieza entera por la nueva, por su
clave. Lo que no se arregló queda en el informe para los socios.

```
Estás corrigiendo piezas de la parte {{PARTE}}, «{{TITULO_PARTE}}», del libro de {{NOMBRE}}, que tiene {{EDAD}} años (género {{GENERO}}). Tenés la <ficha>, la <parte> con lo que dijo en cada respuesta, las <piezas_con_problemas> y los <problemas> de cada una, por clave.

Para cada pieza con problemas, escribila de nuevo entera, desde lo que dijo en sus respuestas y no desde la pieza vieja, arreglando todos sus problemas. Solo esas piezas. Las demás no se tocan y no van en la respuesta. Las piezas van en {{IDIOMA}}, el idioma en que contestó, con sus palabras, como el resto del libro.

Cómo se arregla cada problema.
- inventado. Sale. No lo cambiás por otra cosa que tampoco dijo.
- falta. Entra con sus palabras, limpio, en la pieza que corresponde, y su id va en los ids.
- suena_a_grande. Va la palabra que usó él, o una que un chico de {{EDAD}} usa.
- dos_puntos. Sale el «:» y el giro armado. Queda una frase simple, o dos.
- estirado. Queda del largo de lo que dijo o más corto.
- otro. Lo que dice el arreglo.

Las reglas de siempre siguen valiendo todas. Primera persona y sus palabras. Se limpia lo oral (muletillas, repeticiones, arranques en falso, risas pasadas a texto, lo que le dice a quien pregunta). No se embellece, no se agrega ninguna imagen, detalle, emoción ni conclusión. Nada de palabras de grande. Corto si contestó corto. Sin dos puntos y sin moraleja. Nada inventado. Lo delicado como lo dijo. El título de 2 a 6 palabras suyas, sin dos puntos ni signos raros. En las piezas PADRE-n, la pregunta tal cual, la línea como dice la regla y el título vacío.

Arreglar nunca saca algo que dijo, salvo lo oral que tiene que salir. Si para arreglar un problema tendrías que inventar algo, no lo arregles así; sacá lo que estaba mal y dejá la pieza más corta.

Ejemplo (de Tomi, inventado). Dijo "Rulo se murió el año pasado. Lo enterramos en lo de mi tía." Pieza "Rulo, mi mejor amigo: se murió el año pasado y lo extraño mucho." Problemas "dos_puntos en «Rulo, mi mejor amigo:»", "inventado «mi mejor amigo»", "inventado «y lo extraño mucho»", "falta R22 · Lo enterramos en lo de mi tía".
Mal "Rulo se murió el año pasado. Lo enterramos en lo de mi tía, en un lugar lindo del jardín." (sacó lo inventado y metió otra cosa inventada)
Bien "Rulo se murió el año pasado. Lo enterramos en lo de mi tía."

Nombres que corrigió la familia. {{NOMBRES}}
Devolvé solo el JSON: {"piezas": [{"clave": "", "titulo": "", "texto": "", "ids": [], "linea": "", "pregunta": ""}], "afuera": [{"id": "", "por_que": ""}]}
"linea" y "pregunta" van solo en las piezas PADRE-n. En "afuera" va solo lo que cambió de lugar en este arreglo; si no hay, vacío.
```

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["piezas", "afuera"],
  "properties": {
    "piezas": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["clave", "titulo", "texto", "ids"],
        "properties": {
          "clave": {"type": "string", "pattern": "^(K\\d+|X\\d+-\\d+|CIERRE-\\d+|PADRE-\\d+)$"},
          "titulo": {"type": "string"},
          "texto": {"type": "string", "minLength": 1},
          "ids": {"type": "array", "minItems": 1, "items": {"type": "string", "pattern": "^R\\d+$"}},
          "linea": {"type": "string"},
          "pregunta": {"type": "string"}
        }
      }
    },
    "afuera": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "por_que"],
        "properties": {
          "id": {"type": "string", "pattern": "^R\\d+$"},
          "por_que": {"type": "string"}
        }
      }
    }
  }
}
```

Devolvé solo el JSON, sin texto antes ni después. Cada clave que devolvés tiene que ser una de <piezas_con_problemas>.
