# Títulos de capítulo del libro V3

> **DESCARTADO el 26/09 a la noche (historial).** Los capítulos ahora son por etapas de la vida ([`diseno-v3.md`](diseno-v3.md) §6, D1-D6; `fabrica/src/v3/etapas.ts`). El título de cada capítulo es una frase del narrador que elige el plan, con los años adelante ("{desde}–{hasta o hoy}. {título}"). No hay coda de "Hoy" ni "El viaje, hasta hoy". Lo de abajo se aprobó el 26/09 a la mañana y quedó sin uso; `indice.ts` tampoco se usa.

**Estado (histórico): aprobados por Naza el 26/09/2026.** Todos los títulos de esta lista los usa el código tal cual; ninguno lo inventa el modelo. Naza aprueba la lista de una vez (o cambia los que quiera) antes de que llegue a un libro.

Sale de: la propuesta de Fable "Agrupaciones fijas de capítulos" (secciones 2 y 3), que Naza aprobó el 26/09, más cinco títulos que agregó el código para combinaciones que la propuesta no cubría (marcados con **nuevo**, al final).

Cómo se eligen (lo hace `fabrica/src/v3/indice.ts`, sin modelo):

- Cada tamaño tiene su lista fija de capítulos, en ese orden. Un capítulo que no llega a su piso de palabras escritas va entero a su **receptor** fijo, y el receptor cambia de título según la tabla de abajo. Una sola pasada, de arriba hacia abajo: el que recibió ya no se mueve, y si el receptor ya no está, el capítulo queda corto con su título de siempre.
- Algunos títulos cambian por la **ficha** (sin pareja, sin hijos, migró joven).
- Si alguna vez aparece una combinación que no está acá, el código deja el título del receptor y avisa ("sin tabla"); un test impide que eso pase en las simulaciones.
- Los subtítulos ("— La Singer", "— Barcelona") no están acá: los propone el escritor y los aprueba la familia en la pantalla de revisión.

## Breve (3–4 capítulos)

| Título | Cuándo |
|---|---|
| «Crecer» | Siempre: bloques 1 a 4 (origen, infancia, escuela, adolescencia). |
| «Crecer y salir al mundo» | "Salir al mundo y el trabajo" no llegó a 500 escritas y vino acá. |
| «Salir al mundo y el trabajo» | Bloques 5 y 7 (juventud y trabajo), si llegan a 500 escritas. |
| «Los míos» | Bloques 6, 8, 9 y 10 (amor, hijos, lugares, amigos), si llegan a 500 escritas. |
| «Los míos, hoy» | "Los míos" no llegó a 500 y fue a Hoy. |
| «Hoy» | Bloque 14 y los puntos altos sin edad, si llegan a 400 escritas. Si no, es la coda (abajo). |

## Estándar (5–7 capítulos)

| Título | Cuándo |
|---|---|
| «De dónde vengo y los primeros años» | Siempre: bloques 1, 2 y 3. Recibe, al final, la muerte de la madre o del padre (PE1, PE2). |
| «Crecer» | "Hacerse grande" no llegó a 700 escritas y vino acá. |
| «Hacerse grande» | Bloques 4 y 5 (adolescencia y juventud), si llegan a 700 escritas. |
| «Hacerse grande y el viaje» | Igual, cuando la ficha dice que migró con 30 años o menos (y no es migrante joven). |
| «Hacerse grande y el trabajo» | "Trabajo y oficio" no llegó a 700 escritas y vino acá. |
| «Amor y la familia que armé» | Bloques 6 y 8 (pareja e hijos), con pareja y con hijos. Piso propio de 500; entre 250 y 500 existe corto; con menos de 250 sus respuestas van a "Mi gente y mis lugares". Nunca se junta con Mi gente por otra razón. |
| «Amor» | Igual, con pareja y sin hijos. |
| «La familia que armé» | Igual, sin pareja y con hijos. Sin pareja y sin hijos, este capítulo no existe. |
| «Trabajo y oficio» | Bloque 7, si llega a 700 escritas. Existe igual si no trabajó fuera de casa (trabajo de la casa, oficio, lo que sabe hacer con las manos). |
| «Mi gente y mis lugares» | Bloques 9 y 10, más lo que recibe (Amor bajo 250, amistades y pérdidas del bloque 11), si llega a 700 escritas. |
| «Mi gente, hoy» | "Mi gente y mis lugares" no llegó a 700 y fue a Hoy. |
| «Hoy» | Bloque 14, los puntos altos sin edad (el día más feliz, la época mala que dejó algo bueno, lo que no hizo) y el cuerpo y la enfermedad (PE5, EC1), si llegan a 600 escritas. Si no, es la coda. |

## Completo (9–10 capítulos, con partes)

| Título | Cuándo |
|---|---|
| «De dónde vengo» | Bloque 1, si llega a 600 escritas. |
| «De dónde vengo y los primeros años» | "De dónde vengo" no llegó a 600 y vino a "Los primeros años". |
| «Los primeros años» | Siempre: bloques 2 y 3. |
| «Crecer» | "Adolescencia" no llegó a 900 y vino a "Los primeros años" (con o sin "De dónde vengo" adentro). |
| «Adolescencia» | Bloque 4, si llega a 900 escritas. |
| «Adolescencia y salir al mundo» | "Salir al mundo" no llegó a 900 y vino acá. |
| «Salir al mundo» | Bloque 5, si llega a 900 escritas. |
| «El viaje» | Igual, cuando migró con 30 años o menos (y no es migrante joven). |
| «Salir al mundo y el trabajo» | "Trabajo y oficio" no llegó a 900 y vino a "Salir al mundo". |
| «Amor» | Bloque 6, piso propio de 500 (corto desde 250; con menos, a "Mi gente y mis lugares"). Sin pareja no existe. |
| «Amor y la familia que armé» | "Hijos y nietos" no llegó a 700 y vino a "Amor". |
| «Trabajo y oficio» | Bloque 7, si llega a 900 escritas. |
| «Hijos y nietos» | Bloque 8, si llega a 700 escritas. Sin hijos no existe. |
| «Mi gente y mis lugares» | Bloques 9 y 10, si llegan a 900 escritas. |
| «Mi gente, hoy» | "Mi gente y mis lugares" no llegó a 900 y fue a Hoy. |
| «Lo que costó» | Bloque 11 (lo de adulto), si llega a 900 escritas. Si no, no existe y cada respuesta va a su receptor por pregunta (muerte de los padres al capítulo de origen, la pérdida grande a Trabajo, el cuerpo a Hoy, las traiciones a Mi gente, el hijo fallecido al final de los hijos). |
| «Hoy» | Bloque 14 y lo que recibe, si llega a 600 escritas. Si no, es la coda. |

## El migrante joven (los tres tamaños)

| Título | Cuándo |
|---|---|
| «El viaje, hasta hoy» | La ficha dice que migró hace 10 años o menos. Es el último capítulo y reemplaza a Hoy (no hay coda): la migración del bloque 5, el bloque 14, la pareja actual, los puntos altos sin edad, y el trabajo, los lugares y los amigos que el texto ubica después de migrar. Recibe también a "Mi gente y mis lugares" (o "Los míos") si no llegan al piso. No cambia de título al recibir. |

## La coda

| Título | Cuándo |
|---|---|
| «Hoy» | Hoy no llegó a su piso (400 en Breve, 600 en Estándar y Completo) y no recibió a nadie: dos páginas sin número, en cuerpo menor, entre el último capítulo y la carta, que vuelven a la escena del prólogo. Sin epígrafe ni subtítulo. |

## Nombres de las partes (solo Completo, capítulos de más de 3.000 escritas)

El capítulo conserva su título y cada parte lleva uno de estos nombres.

| Capítulo | Partes |
|---|---|
| Los primeros años | «La casa» / «La escuela» |
| Salir al mundo (o El viaje) | «Irse de casa» / «Los estudios» / «Lo militar» / «El viaje» (solo las que tienen material) |
| Amor | El nombre de cada pareja de la ficha, en orden; los amores sin pareja de la ficha van en «Otras personas» (o con la vecina, si quedan cortos) |
| Trabajo y oficio | El nombre de cada oficio de la ficha; si no hay dos oficios y vivió en el campo: «El campo» / «Después» |
| Hijos y nietos | «Cuando eran chicos» / «Cuando crecieron, y los nietos» |
| Mi gente y mis lugares | «Mis lugares y pasiones» / «Mi gente»; o, si una pasión llega a 1.200 escritas, «Mi gente y mis lugares» / «Mi pasión: {{pasión}}» |
| El viaje, hasta hoy | «El viaje» / «Hoy, en {{lugar_destino}}» (lo de hasta un año después de migrar va en la primera) |
| Adolescencia | No se parte todavía: la clave de Fable (los capítulos que el narrador nombró en LE7) no la lee el código. |

## Títulos que agregó el código (no estaban en la propuesta de Fable)

Combinaciones que la tabla de Fable no cubría y que pueden pasar. Hay que aprobarlas o cambiarlas:

| Título | Cuándo | Por qué |
|---|---|---|
| «Crecer y el viaje» | Estándar: "Hacerse grande y el viaje" no llegó a 700 y vino a "De dónde vengo y los primeros años". | Con "Crecer" solo, el viaje desaparecería del índice. |
| «Hacerse grande, el viaje y el trabajo» | Estándar: "Trabajo y oficio" no llegó a 700 y vino a "Hacerse grande y el viaje". | Fable solo escribió "Hacerse grande y el trabajo". |
| «Adolescencia y el viaje» | Completo: "El viaje" no llegó a 900 y vino a "Adolescencia". | Fable solo escribió "Adolescencia y salir al mundo". |
| «El viaje y el trabajo» | Completo: "Trabajo y oficio" no llegó a 900 y vino a "El viaje". | Fable solo escribió "Salir al mundo y el trabajo". |

Nombres de parte que también agregó el código: «Irse de casa» (lo del bloque 5 que no es estudios, lo militar ni migración), «Otras personas» (amores fuera de la ficha) y «Mi gente y mis lugares» como nombre del resto cuando se separa «Mi pasión: {{pasión}}».
