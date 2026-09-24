# Esqueleto v2 — el guion de temas obligatorios (para que apruebe Naza)

> Escrito por Fable el 24/09/2026 después de `docs/analisis-piloto-naza-fable.md` y de la charla con
> Naza ("tenemos que definir temas, pero el biógrafo depende del avatar: tiene que saber si esos
> temas entran o no"). Esto es un documento para aprobar, no código: **cada fila es un tema con
> condición**, no el texto que se manda. El texto lo escribe el modelo por persona, con el encargo
> v2 y la ficha corta, y pasa por los controles de salida. Lo que Naza cambie acá se cambia
> después en el código con su test.
>
> Decisiones que Naza dio por buenas el 24/09: **30-34 fijas + hasta 4 libres, techo 40**; una
> pregunta por hermano y una por hijo **hasta tres**, después una "de todos"; el futuro en **dos
> filas para todos**.

## 1. Cómo se lee una fila y cómo decide el biógrafo si entra

Cada fila tiene:

| Campo | Qué es |
|---|---|
| `id` | el nombre de la fila (va a `contexto.v2`, al panel y a la fábrica) |
| Tema | para el biógrafo: de qué va la pregunta, en una línea |
| Pormenores que junta | lo que puede pedir **en la misma pregunta**, para que la persona lo cuente de una vez (N37). El modelo elige dos o tres según la ficha, no todos |
| Aplica si | la condición, que se decide **en código con la ficha**, gratis |
| Si no se sabe | qué hace la fila cuando la ficha no tiene el dato: casi siempre, se convierte en la puerta ("¿tuviste…?") en vez de saltearse o suponer |
| Se expande | si la fila se repite por persona (hermanos, hijos) |

**Tres niveles para "entra o no", del más barato al más caro:**

1. **Código, con la ficha.** Edad (tramos vividos), árbol (pareja, hijos, hermanos, nietos,
   sobrinos, padres viven), dónde vivió en cada etapa, país de cada etapa (para la historia
   grande). Ya existe: `perfilDesdeFicha`, `edadDe`, `RANGO_TRAMO`.
2. **El perfil, con `cubiertos`.** Si contó un tema con detalle antes de que le toque, la fila
   se cae y queda registrado (`secuencia.cubiertos`), como hoy con el núcleo. Con el esqueleto
   TODO es núcleo, así que funciona para todo. Se cae solo si el perfil lo dice con evidencia
   (una escena, nombres), y nunca las de inicio, hoy, futuro ni reflexión.
3. **La puerta, cuando no se sabe.** La fila no se saltea ni supone: pregunta si hubo. La
   pregunta 3 ("los tuyos hoy", nueva) es el censo que llena el árbol temprano, así el guion se
   expande por persona antes de llegar a esas etapas. Lo que siga ambiguo después del censo
   (¿la música es trabajo o gusto?) lo decide una llamada corta con Sonnet o Haiku, con la ficha
   y la fila, no Opus con 27 mil tokens.

**Modificadores que no son filas** (los aplica el encargo, como hoy):
- `hoyFueFuerte`: mañana se reconoce en una frase y no se tira otro tema pesado.
- `tono` dice infancia dura: las filas de infancia piden "qué había, quién estaba, qué
  rescataba", no "qué era lo lindo" (regla 5 del encargo).
- `evitar`: la fila que toque un tema que pidió dejar se cae, con registro.
- La reserva ("esto no va al libro") se respeta igual que hoy.

## 2. Reglas del guion entero

- **Orden fijo por etapas de la vida**: inicio → infancia → juventud → adulto joven → adultez
  media → segunda mitad → hoy → futuro → reflexión. Solo existen los tramos que vivió
  (`RANGO_TRAMO`: infancia 0-12, juventud 13-22, adulto joven 23-35, adultez media 36-55, segunda
  mitad 56+). El biógrafo **no reordena**: se acabó la puerta abierta como reordenador.
- **Cantidad**: para alguien de 70 con pareja, dos hijos, dos hermanos y nietos dan ~36 fijas;
  para Naza (27, dos hermanos, sin hijos) dan 29. Ver §5.
- **Libres**: al cerrar cada etapa vivida, **una** pregunta elegida de los "no sabemos" de esa
  etapa (lo que nombró y no contó), hasta 4 en todo el libro y sin pasar el techo de 40. No
  nace de un peso ni de bisagras: nace de una lista corta que el perfil ya arma.
- **Repregunta**: como máximo **una por etapa**, y con otro encargo: "de lo obligatorio de esta
  fila, ¿qué faltó? pedilo junto, como una sola pregunta". Nunca "ahondá en el pormenor". No se
  evalúan las respuestas a repreguntas ni a objetos salvo para reserva, tema a dejar, "hoy no" y
  "no quiero seguir" (N29).
- **Objetos**: como el v2: uno al cerrar cada tramo y uno al final, hasta 8, nunca se insiste.
- **Historia grande**: fila propia, calculada por año de nacimiento y país de la etapa (§4).
  Máximo dos por libro.
- **La ficha (el perfil v2 con topes)**: etapas de ≤ 300 caracteres, bisagras de ≤ 150 y una
  por vuelta de vida (máximo 12), personas con nota de ≤ 80 (máximo 30), `noSabemos` ≤ 12 y
  podados al resolverse, `tono` ≤ 300. Corregir pisa de verdad (N34, N35, N40). Objetivo medible:
  **la ficha nunca pasa de 2.500 tokens** y el prompt de la pregunta 40 no pasa de 6.000.
- **Preguntas ya hechas**: al prompt van los `id` y el tema, no los 32 textos enteros.
- **Conversación**: las últimas 3 respuestas con su pregunta (hoy 6).

## 3. Las filas, etapa por etapa

### Inicio (no se mueven ni se caen)

| # | id | Tema | Pormenores que junta | Aplica si | Si no se sabe |
|---|---|---|---|---|---|
| 0 | `presentacion` | La bienvenida: quién soy, quién le regala el libro, una pregunta por día; cómo prefiere que le hablen, edad si falta, cómo le dicen (N3: con el nombre y quién regala) | — | siempre (no cuenta como pregunta) | — |
| 1 | `casa-infancia` | La casa donde pasó la infancia, como escena | qué ve al entrar, quién está, olores, la calle | siempre | — |
| 2 | `los-tuyos-hoy` | **Nueva. El censo:** quiénes son los suyos hoy | pareja, hijos, hermanos, nietos, sobrinos, si los padres viven; nombres y edades como salgan | siempre | es justamente para saberlo; se escribe sin dar por hecho nada ("¿quiénes son los tuyos hoy?") |
| 3 | `mapa-casas` | Las casas de su vida, una tras otra | ciudad, con quién, hasta qué edad; si falta la edad, sale acá | siempre | — |
| 4 | `mapa-capitulos` | Si su vida fuera un libro, los capítulos | qué abrió y cerró cada uno | siempre | — |

### Infancia (0-12)

| # | id | Tema | Pormenores que junta | Aplica si | Si no se sabe | Se expande |
|---|---|---|---|---|---|---|
| 5 | `padres-como-eran` | **Cómo era** su mamá y cómo era su papá (o quienes le criaron): el carácter, no la cronología (N42) | qué decía cada uno, cómo lo trataba, en qué se parece él/ella, una escena de cada uno | siempre | si la ficha no tiene padres, "quienes le criaron" | no |
| 6 | `hermano` | **Cada hermano/a, uno por uno**: cómo es, cómo era de chico, la relación | qué hacían juntos, peleas, con quién se llevaba mejor, cómo es hoy | ficha con vínculo hermano/a | puerta: "¿tuviste hermanos, o fuiste hijo/a único/a?" (y si es único, la fila cambia a `hijo-unico`: cómo era ser el único) | **sí**: una por hermano hasta 3; con 4 o más, una "de todos" y una por el más cercano |
| 7 | `abuelos-y-raices` | Los abuelos y de dónde viene la familia | de qué pueblo o país, cómo llegaron, apellidos, lo que le contaban de antes de que naciera | siempre | si no conoció abuelos, "qué sabe de ellos y de dónde venían" | no |
| 8 | `la-cuadra-y-los-juegos` | La cuadra, los juegos y los amigos del barrio, **en una sola pregunta** (N37) | a qué jugaba, con quién, los animales de la casa, los fines de semana, las vacaciones, hasta qué hora lo dejaban | siempre | — | no |
| 9 | `la-escuela` | La escuela primaria | un maestro, un compañero, cómo le iba, si cambió de colegio y por qué | siempre | — | no |

### Juventud (13-22)

| # | id | Tema | Pormenores que junta | Aplica si | Si no se sabe | Se expande |
|---|---|---|---|---|---|---|
| 10 | `a-los-quince` | Qué hacía a los quince fuera de la escuela, **y con quién** (junta la banda de esa época) | dónde paraban, qué sonaba, cómo se vestían, un sábado a la noche; sin dar por hecho que salía | siempre | — | no |
| 11 | `estudios` | Hasta dónde llegó con los estudios y cómo fue esa decisión | secundaria, facultad u oficio, si lo eligió o lo eligió la vida, quién lo apoyó | siempre | — | no |
| 12 | `primer-trabajo` | El primer trabajo y la primera plata | cómo lo consiguió, qué hizo con esa plata | siempre | si dijo que no trabajó de joven, la fila cambia a "de qué vivía y cuál fue la primera plata propia" | no |
| 13 | `primer-amor` | Si se enamoró, de quién, cómo fue | cómo se conocieron, cómo se dio cuenta, cómo terminó o siguió; sin dar por hecho pareja ni género | siempre (con puerta) | "¿te enamoraste alguna vez en esos años?" | no |
| 14 | `historia-grande` | Lo grande que le tocó al país en esa etapa (§4) | cómo se vivió en su casa, qué cambió, sin dar por hecho de qué lado estuvo | hay un evento de §4 en esta etapa | — | no |

### Adulto joven (23-35)

| # | id | Tema | Pormenores que junta | Aplica si | Si no se sabe | Se expande |
|---|---|---|---|---|---|---|
| 15 | `oficio` | A qué le dedicó la vida y cómo llegó ahí | si lo eligió, lo heredó o se dio; un día de trabajo; qué le gustaba | siempre | si la ficha no lo ubica en el tiempo, va acá igual (la fábrica lo reparte después) | no |
| 16 | `pareja-como-llego` | Con quién hizo su vida y cómo llegó esa persona | el día que se conocieron, quién dio el primer paso, cómo era ella/él, cómo lo recibieron las familias; **no** la boda | ficha con pareja, o estado civil que la implique (viuda, separada) | puerta: "¿hubo alguien con quien hiciste tu vida?"; si dijo que no, la fila cambia a `quienes-fueron-tu-familia` | no |
| 17 | `hijos-llegada` | El día que nació el primer hijo y cómo fueron llegando los demás | dónde estaba, qué sintió, cómo eligieron el nombre | ficha con hijos | si no se sabe, la resuelve el censo (fila 2); si dijo "no tuve", no aparece ni se pregunta | no |
| 18 | `hijo` | **Cada hijo/a, uno por uno**: cómo es, a quién salió, qué admira | de chico cómo era, una escena, cómo es hoy | ficha con hijos | (ídem 17) | **sí**: una por hijo hasta 3; con 4 o más, una "de todos" y una por el que más nombró |
| 19 | `un-lugar-que-cambio-algo` | Un lugar que le cambió la vida: una mudanza, un viaje, otro país, otra ciudad | el primer día ahí, quién lo esperaba (sin suponerlo), qué dejó atrás, por qué se fue | siempre; las anclas salen de `mapa-casas` | si no se mudó nunca, "la esquina de siempre: qué la hace suya" | no |
| 20 | `amigos-de-siempre` | Los amigos de la vida adulta: del trabajo, del club, los que quedaron de antes | una escena con ellos, cómo se mantienen | siempre | — | no |

### Adultez media (36-55) — solo si tiene 36 o más

| # | id | Tema | Pormenores que junta | Aplica si | Si no se sabe | Se expande |
|---|---|---|---|---|---|---|
| 21 | `el-trabajo-y-la-plata` | Los años fuertes del trabajo, y la plata con confianza | la mejor anécdota, un jefe o un socio, épocas flacas, un riesgo (un negocio, una casa), qué relación ve entre la plata y la felicidad | edad ≥ 36 | — | no |
| 22 | `los-hijos-creciendo` | Cómo fue como madre/padre mientras crecían | qué quiso darles que no tuvo, qué le costó, una escena de la mesa o de un viaje | edad ≥ 36 y ficha con hijos | si no tuvo hijos: la fila cambia a "de quién se ocupó y quién fue su familia en esos años" | no |
| 23 | `la-pareja-con-los-anos` | La pareja con los años: las tormentas, cómo siguieron (o cómo terminó) | una crisis, una reconciliación, qué aprendió; si enviudó o se separó, cómo fue y quién estuvo | edad ≥ 36 y ficha con pareja (o viuda/separada) | si no hubo pareja, no aparece | no |
| 24 | `los-padres-de-grande` | Sus padres cuando él/ella ya era grande: cómo envejecieron, cómo los acompañó, cómo fue perderlos | quién se ocupó, una charla que recuerde, qué le dejaron dicho | edad ≥ 45, o la ficha dice que uno de los padres murió | si la ficha dice que viven, la fila pregunta cómo es la relación hoy (sin suponer muerte) | no |
| 25 | `por-gusto` | Lo que hacía por gusto cuando nadie se lo pedía | el club, la huerta, la música, el baile, la pesca; con quién; lo que ya nombró | siempre (para menores de 36 va en adulto joven) | si no nombró nada, abierto | no |
| 26 | `historia-grande` | (§4) | | evento en esta etapa | | |

### Segunda mitad (56+) — solo si tiene 56 o más

| # | id | Tema | Pormenores que junta | Aplica si | Si no se sabe | Se expande |
|---|---|---|---|---|---|---|
| 27 | `dejar-el-trabajo` | La jubilación o dejar el trabajo: cómo fue ese día, qué hizo con el tiempo | qué extraña, qué no, a qué se dedicó después | edad ≥ 60, o dijo que se jubiló o dejó de trabajar | si sigue trabajando, la fila cambia a "por qué sigue y hasta cuándo" | no |
| 28 | `nietos` | Los nietos: quiénes son, cómo es ser abuela/o | uno por uno si son pocos, una escena con ellos, qué les quiere enseñar | ficha con nietos (censo) | si no tiene, no aparece; no se pregunta "¿y nietos?" | no (una sola fila) |
| 29 | `perdidas` | Las personas que perdió en estos años (pareja, hermanos, amigos), con tacto | cómo fue, quién estuvo, cómo las lleva consigo | ficha con personas `vive: no` de esta etapa | si no hay, no aparece | no |
| 30 | `historia-grande` | (§4) | | evento en esta etapa | | |

### Hoy

| # | id | Tema | Pormenores que junta | Aplica si |
|---|---|---|---|---|
| 31 | `un-dia-de-hoy` | Cómo es un día suyo hoy | dónde vive, con quién, qué hace, qué le alegra, qué le duele | siempre |
| 32 | `los-tuyos-hoy-como-estan` | **La familia hoy: cómo está cada uno y cómo es la relación** (N42: sobrinos, hermanos, hijos, la pareja) | quién vive cerca, a quién ve, a quién extraña; los sobrinos y los nietos si los hay; sin dar por hecho nada que el censo no dijo | siempre |

### Futuro (dos filas, para todos)

| # | id | Tema | Pormenores que junta | Aplica si |
|---|---|---|---|---|
| 33 | `lo-que-te-queda-por-hacer` | Lo que quiere para su vida de acá en adelante: sueños, planes, lo que le queda por ver | un viaje, un proyecto, una mudanza, la música, la libertad; a los 27 es la mitad del libro (N42), a los 76 es "qué le queda por hacer y qué ya no" | siempre |
| 34 | `lo-que-esperas-para-los-tuyos` | Lo que espera para los suyos | hijos, nietos, hermanos, la pareja; sin dar por hecho hijos ni nietos (usa el censo) | siempre |

### Reflexión (cierre, no se mueve ni se cae)

| # | id | Tema |
|---|---|---|
| 35 | `pruebas` | Las pruebas que le puso la vida: lo que quiera contar, como quiera |
| 36 | `fuerza` | De dónde sacó fuerza y qué aprendió que quiera dejar dicho |
| 37 | `alegrias` | Sus alegrías más grandes, sus orgullos, los dichos que repite |
| 38 | `lo-que-falta` | Qué no le pregunté que tiene que estar en el libro |
| 39 | `mensaje` | Qué les quiere decir a los que escuchen esto dentro de cincuenta años (sin dar por hecho hijos ni nietos) |
| 40 | `cinco-minutos` | Su vida en cinco minutos (último) |

## 4. La historia grande, por año de nacimiento y país

La fila `historia-grande` entra en una etapa si en esos años pasó algo de esta tabla en el país
donde vivía (según `mapa-casas`) y la persona tenía **entre 6 y 60 años**. Máximo dos por libro:
las de más peso (la pandemia siempre es una si nació antes de 2010). Se pregunta "cómo se vivió en
su casa", nunca de qué lado estuvo.

| Evento | Años | País | Edad mínima para preguntarlo |
|---|---|---|---|
| La dictadura | 1976-1983 | Argentina | 8 |
| Malvinas | 1982 | Argentina | 8 |
| La hiperinflación | 1989-1990 | Argentina | 10 |
| El 2001 (corralito, diciembre) | 2001-2002 | Argentina | 10 |
| La pandemia | 2020-2021 | todos | 6 |
| La muerte de Franco y la transición | 1975-1978 | España | 8 |
| El 23-F | 1981 | España | 10 |
| Los Juegos de Barcelona / la Expo | 1992 | España | 6 |
| El 11-M | 2004 | España | 10 |
| La crisis de 2008 | 2008-2013 | España y Argentina | 15 |
| Un Mundial ganado (78, 86, 22) o la Eurocopa/Mundial de España (2008-2012) | según el país | 6 |

Los Mundiales son opcionales: entran solo si no hay dos eventos más grandes en la vida de esa
persona. Naza (nacido en 1998/99, Argentina hasta ~2022, España después): la pandemia (21 años,
juventud tardía / adulto joven) y el 2001 no entra (tenía 3). Élida (1950, Tucumán y Lanús): la
dictadura (26) y el 2001 (51); la hiper queda afuera por el máximo de dos.

## 5. Cómo queda para dos personas distintas (sin llamar al modelo: solo la ficha)

| Etapa | Naza, 27, hombre, 2 hermanos, sin hijos, de novio, Argentina → España | Élida, 76, mujer, viuda, 2 hijos, 3 nietos, 1 hermana, Tucumán → Lanús |
|---|---|---|
| Inicio | 4 (más la presentación) | 4 |
| Infancia | padres, hermano ×2, abuelos, cuadra, escuela = 6 | padres, hermana ×1, abuelos, cuadra, escuela = 5 |
| Juventud | quince, estudios, primer trabajo (cambia a "de qué vivía"), primer amor, historia grande (la pandemia a los 21) = 5 (la primera versión de esta tabla decía 4: no había contado la pandemia; son 30 fijas, no 29) | quince, estudios, primer trabajo, primer amor, historia grande (dictadura) = 5 |
| Adulto joven | oficio, pareja (puerta → Ima), un lugar (España), amigos, por gusto (baja acá) = 5 | oficio, pareja (Rubén), hijos llegada, hijo ×2, un lugar (Lanús), amigos = 7 |
| Adultez media | no vivió | trabajo y plata, hijos creciendo, pareja con los años, padres de grande, por gusto, historia grande (2001) = 6 |
| Segunda mitad | no vivió | dejar el trabajo, nietos, pérdidas (Rubén) = 3 |
| Hoy | 2 | 2 |
| Futuro | 2 | 2 |
| Reflexión | 6 | 6 |
| **Fijas** | **29** | **40** → las libres quedan en 0 y **sobran 0**: hay que ver §6 |
| Libres | hasta 4 → 33 en total | 0 |

Lo que Naza pidió en N42 queda todo con fila propia: el futuro (33, 34), cada hermano (6),
personalidades (5 para los padres; la de cada hermano va en 6), sobrinos y la familia hoy (32),
la historia grande (14/26/30). Y los pormenores de Martínez (perros, cuadra, recreo) caben en una
sola pregunta (8).

## 6. Lo que no cerraba — DECIDIDO por Naza el 24/09 ("dale" a las recomendaciones)

- **Techo 44 para mayores de 56** (40 para el resto); las libres son hasta 4 sin pasar el techo.
- `los-tuyos-hoy` queda como pregunta 2, escrita cálida por el modelo.
- Repregunta: una por etapa, **más** una cuando la respuesta dura menos de 40 segundos y saltó
  dos o más pormenores de la fila; siempre con el encargo "lo que faltó, junto".
- Modelos: Opus 5 en la pregunta y la repregunta; Sonnet 5 en la ficha y en la evaluación;
  Haiku 4.5 solo en la evaluación reducida de repreguntas y objetos (reserva, dejar, hoy no, parar).
- Los textos fijos siguen; N2 y N3 se corrigen en la presentación.
- El plan de implementación: `docs/superpowers/plans/2026-09-24-esqueleto-v2.md`.

(Lo que sigue es el texto original de la discusión, para que quede el porqué.)

1. **Una vida larga y completa llena el techo de 40 con fijas y no deja libres.** Opciones: (a)
   subir el techo a 44 para mayores de 56 (son los que más tienen para contar y el costo por
   pregunta es ~USD 0,10); (b) que `hijo` y `hermano` expandan hasta 2 en vez de 3; (c) sacar
   `amigos-de-siempre` cuando `a-los-quince` ya cubrió amigos. **Mi recomendación: (a)**, porque
   el problema del v1 era justamente que a los de 60 les faltaban preguntas de su vida adulta.
2. **`los-tuyos-hoy` como pregunta 2**: es un censo y puede sonar a formulario el segundo día.
   Alternativa: pegarla a `mapa-casas` ("con quién" en cada casa ya trae pareja e hijos) y dejar
   hermanos/sobrinos/nietos para que salgan solos, con puertas. **Mi recomendación: dejarla, pero
   escrita como "contame quiénes son los tuyos hoy" en una pregunta cálida de 45 palabras**; el
   modelo la escribe, y es la que evita todos los "supone hijos/pareja" de la bitácora.
3. **La repregunta, una por etapa**: ¿alcanza? Con respuestas de 30 segundos (las últimas del
   piloto) el libro sale corto. Alternativa: una por etapa **más** una cuando la respuesta dura
   menos de 40 segundos y saltó todos los pormenores de la fila. **Mi recomendación: la
   alternativa**, con el encargo nuevo ("lo que faltó, junto").
4. **Modelos**: Opus 5 en la pregunta y la repregunta; Sonnet 5 en la ficha; Haiku 4.5 en la
   evaluación reducida y en la puerta ambigua. Se anota en `HERMES.md` cuando se decida.
5. **Los textos que ve la persona** (la presentación con nombre y quien regala, "hoy no", "no
   quiero seguir", la despedida) siguen siendo los aprobados el 24/09 salvo N2 y N3, que se
   corrigen en la presentación.

## 7. Qué cambia en el código cuando esto esté aprobado (para el plan, no para ahora)

- `pregunta-v2.ts`: `NUCLEO` pasa a ser este guion (id, etapa, tema, pormenores, `aplica`,
  `siNoSeSabe`, `expandePor`); `objetivoEnTexto` manda tema + pormenores + anclas cortas.
- `secuencia.ts`: se va `planificar`/`replanificar` por peso y la puerta abierta como
  reordenador; entra `armarGuion(ficha)` (expande por persona y evalúa `aplica`) y se rearma
  cuando la ficha cambia el árbol (después del censo); `cubiertos` vale para todas las filas
  menos inicio/hoy/futuro/reflexión; las libres nacen de `noSabemos` por etapa.
- `perfil.ts`: los topes de §2 en `aplicarCambios` (recorta, no rechaza) y corregir que pise.
- `evaluar-v2.ts`: el encargo nuevo de la repregunta; no se evalúan repreguntas ni objetos
  salvo reserva/dejar/hoy no/parar.
- `encargo-entrevista.ts`: la regla 7 ("una escena, no un resumen") pasa a valer solo para las
  filas que piden escena; `padres-como-eran` y `hermano` piden "cómo es", con una escena de
  yapa.
- `estado-v2.ts`: `yaHechasDe` devuelve ids y temas; `conversacionDe` con 3.
- CONTRATO: `contexto.v2.guion` (filas con estado: pendiente, hecha, cayó por condición, cubierta,
  evitada) en lugar de `secuencia.pendientes` de variables.
- Tests con el `contexto.v2` real de Naza como fixture: el prompt de la 40 ≤ 6.000 tokens; las
  filas de Naza y de Élida salen como en §5.
