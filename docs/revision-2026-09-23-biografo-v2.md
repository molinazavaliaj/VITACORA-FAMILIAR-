# Revisión del biógrafo v2, antes de la prueba única (23/09/2026, noche)

> Segunda mirada, pedida por Naza: contra el objetivo y contra cada hallazgo, no una continuación.
> Rama `biografo-v2-fabrica`. Todo lo de acá está verificado contra el código, la base y Storage
> (sin imprimir claves). Los arreglos que no gastan ya están hechos y committeados (sección 6).

## 1. Qué entendí

El objetivo es un libro que la persona reconozca como suyo y que emocione: sus historias, nada
inventado ni ajeno, escritas por un escritor de primera con sus palabras. Y una entrevista que sepa
con quién habla aunque la familia no cargue nada, y que cubra la vida entera de alguien de 60+.

La reconstrucción atacó las tres cosas que Joaquín señaló al leer su libro (material ajeno, repetición,
guion que no cubre la vida adulta) y los tres ejes que él propuso (encargo, entrada, control). Nada
está conectado al flujo real salvo la transcripción. Falta una prueba paga con todo junto, que Naza
autoriza, y después la conexión.

## 2. Estado verificado esta noche

| Qué | Resultado |
|---|---|
| Rama | `biografo-v2-fabrica`, pusheada (0 commits pendientes al empezar) |
| Entrevistador | 445 → **452 tests**, 35 archivos; `npm run tipos` (src + scripts + test) limpio |
| Fábrica | 508 → **511 tests**, 45 archivos; `tsc` limpio, también incluyendo `scripts/prueba-reparto.ts` |
| Base | Ciro 18 respuestas, Joaquín 35, Osvaldo 30 (texto, sin audio). `b3bd57db…` es la orden 27 de Joaquín con el audio de Ciro, como dice el 43. C1 y C4 existen tal cual los busca la prueba (Ciro orden 5 y 7); Ciro nombra a la abuela en la orden 1, así que C1 se puede medir |
| Storage | Joaquín: `estructura.json`, `nombres.json`, 8 borradores. Osvaldo: `estructura.json` y `nombres.json`, **0 borradores** (la prueba lo tolera: salta el "antes"). `respuestas_descartadas` **no existe** (migración sin aplicar, esperado) |
| Precios | Opus 5 = 5/25, Fable 5 = 10/50, Haiku = 1/5 por millón. Coinciden con `costos.ts` y con lo que usan los dos scripts |
| Consumo real (`consumo_ia`) | una evaluación de Opus 5 = ~3.700 tokens de entrada, ~325 de salida (pensamiento incluido), **USD 0,027**. La personalización de Haiku, USD 0,004 |

## 3. Cada hallazgo, contra lo hecho

**Resuelto** = hay código y test que lo cubren. **A medias** = la idea está pero falta una parte o no
está conectada. **Sin tocar** = nada en la rama lo mira.

| # | Qué | Estado | Dónde / por qué |
|---|---|---|---|
| 43 | Audio de otro narrador en el libro | **Resuelto** (v2) | candado que frena (`manual.ts` cargar), auditoría (`auditar-material.ts`), descartar sin borrar (`descartar.ts` + migración). Falta aplicar la migración (Naza) y el caso "reenviado" del webhook (Joaquín) |
| 41 | El libro repite | **Resuelto** (medido) | reparto (`reparto.ts`), capítulo sin la historia completa, `medir-repeticion.ts`, control en `paginas.ts:136`. 17,3 % → 1,1 % |
| 42 | El guion no cubre la vida adulta | **A medias** | `plan-preguntas.ts` reparte 11 variables por tramos; a un 76 le da 0 a la infancia y 8 a los 23-76 (calculado con el núcleo real). Pero **sin edad no planifica** (`plan-preguntas.ts:79`) y no hay plan B: ver 4.A1 |
| 40 | Fusión de dos escenas | **Resuelto** | regla 2 del encargo (`encargo.ts` HECHOS) y la marca `[…]` en el material repartido |
| 1 | Usted por defecto con ficha vacía | **A medias** | el primer mensaje pregunta vos/usted y el perfil lo espeja. Pero para España "vos o usted" no es la pregunta (4.D1), y el `Trato` de producción no conoce `tú` |
| 4, 18 | Repregunta / fija en usted a un narrador de vos | **Resuelto** | `control-texto.ts` mira la salida en pregunta y repregunta; segundo intento con el motivo |
| 13 | La infancia se alarga | **A medias** | regla 2 del encargo ("nunca le pidas lo que ya contó") y el reparto por tramos. `pregunta-v2.ts:83` sigue diciendo "enganchá con algo que contó": es la misma instrucción que produjo 13 y C5, ahora contrapesada |
| 14 | Evaluación vacía corta el día | **Resuelto** | `parsearEvaluacion` da suficiente si no entiende |
| 16 | Una corrección no pisa el resumen viejo | **A medias** | el perfil aplica correcciones por número (`corregirEtapas`/`corregirPersonas`), pero nada obliga al modelo a corregir en vez de agregar: se mide en la prueba |
| 17 | Nombres mal transcriptos | Sin tocar (fuera de alcance) | la transcripción cambia castellano y saca el texto libre; los nombres siguen en la revisión del panel |
| 19 | "Esto que no vaya al libro" | **A medias** | la v2 lo pide (`evaluar-v2.ts:55`) pero **la prueba única no lo mide**: en la base no hay ninguna respuesta reservada. Ver 4.F |
| 20-27, 35, C12, C13 | Las fijas suponen boda, hijos, nietos, mujer | **Resuelto** en el v2 | el guion da el tema, no el texto (`NUCLEO`); el amor "sin dar por hecho que hubo pareja, boda ni de qué género". Ojo: los 8 objetos siguen con el texto fijo en usted y masculino (4.A3) |
| C1 | La repregunta pide lo que ya contó | **Resuelto** | `evaluar-v2` recibe el encargo con el perfil y las últimas 6 con su pregunta; `cerebro.ts` tiene `loQueYaConto` para producción. La prueba lo compara |
| C2 | Dar por muerta o viva a alguien | **Resuelto** (en el perfil) | `vive: 'si' \| 'no' \| 'no se sabe'` nunca se supone; el encargo lo dice |
| C3 | La infancia como un lujo | **Resuelto** | `tono` en el perfil + regla 5 del encargo; el tema "juegos" ya lo contempla |
| C4 | Insiste donde pidió cambiar | **Resuelto** (ahora sí en los dos lados) | la evaluación anota `dejarTema`; la pregunta del día **no recibía `evitar`** hasta esta noche (`6efc033`) |
| C5 | Repite lo recién contestado, lidera con sustancias | **Resuelto** | reglas 2 y 6 del encargo |
| C6, C14 | La ciudad equivocada | **Resuelto** | la línea de tiempo del perfil (etapas con lugar) + cada respuesta con su pregunta + regla 7; los temas del núcleo dicen "en la ciudad donde vivía ENTONCES" |
| C7 | Dos sesiones se pisan | Sin tocar | operativo, no es del v2 |
| C8 | `tsc` no mira `scripts/` | **Resuelto** en el entrevistador (`tsconfig.check.json`); en la fábrica vive en otra rama (`fabrica-tipos`), no en esta: `prueba-reparto.ts` lo verifiqué a mano |
| C9, C10 | Nombres, key desfasada | Sin tocar (operativo) | |
| C11 | Pregunta entera en usted | **Resuelto** | el control caza los imperativos de usted; test con el caso real |

## 4. Lo que falta o se puede mejorar

Ordenado por lo que más le pega al producto. Cada punto con dónde y por qué.

### A. Producto (los decide Naza)

**A1. Sin edad no hay entrevista, y nada dice qué pasa entonces.** `plan-preguntas.ts:79` devuelve
`falta: 'edad'` y `secuencia()` (`pregunta-v2.ts:60`) no tiene variables que ordenar. Si la persona
no contesta la edad en el primer mensaje (o el perfil no la saca), el v2 no sabe qué preguntar el día
4. Hoy la ficha de la compra tiene `anioNacimiento` (a veces vacío). Propuesta: si no hay edad después
del mensaje 2, planificar como si tuviera 70 (el público) y marcar `noSabemos: ['Edad']` para que la
pregunte de nuevo; nunca frenar la entrevista.

**A2. El primer mensaje pide tres cosas en 45 palabras.** `pregunta-v2.ts:28` (edad, vos/usted y la
escena de la casa) contra la regla 8 del encargo (`encargo-entrevista.ts:79`, una pregunta, dos como
mucho) y el control de 50 palabras (`encargo-entrevista.ts:83`). El modelo va a fallar el control o
recortar la escena. Hasta esta noche **el primer mensaje no estaba en la prueba única**; ahora se
escribe con la ficha vacía, que es el caso real. Decisión: ¿dos mensajes (edad + trato hoy, la casa
mañana) o el primer mensaje exento del tope?

**A3. Los ocho objetos siguen fuera del v2.** `objetos.ts:63` los manda por `personalizarPregunta`
(Haiku, el prompt viejo de 14 reglas). Con el v2 conectado, la persona recibiría preguntas escritas
por dos cerebros con dos encargos. Y los textos de la plantilla (base, órdenes 101-108) están en
usted y masculino: 101 "cuando era chico", 106 da por hecho hijos, 107 "lo acompañó". Son los tres
que Naza tiene que aprobar; propongo que el v2 los trate como un tema más ("un objeto de esa época,
con foto") y no como texto fijo.

**A4. El núcleo no garantiza a los hijos ni a los hermanos.** `NUCLEO` (`pregunta-v2.ts:27-42`)
tiene casa, mapa, padres, juegos, sábado, primer trabajo, amor, oficio, hoy y cinco de reflexión.
La familia que formó (hijos, si los hay) y la de origen (hermanos, abuelos) dependen de que el modelo
las elija en una variable. Quien compra el libro es un hijo o un nieto: que ese capítulo exista no
puede depender de una tirada. Propuesta: un tema del núcleo "las personas con las que hizo su vida
(pareja, hijos, o quienes fueron su familia), sin dar por hecho cuáles".

**A5. "Un sábado a la noche de sus quince" supone salidas.** `pregunta-v2.ts:33`. Para una mujer de
80 criada en el campo, no hubo sábados así. Es el mismo error que "las fiestas y tradiciones" (C3),
más chico. Propuesta: "qué hacía a los quince cuando no estaba en la escuela o trabajando".

**A6. Vos/usted no es la pregunta en España.** `pregunta-v2.ts:28` pregunta "vos o usted"; a una
narradora de Madrid le suena raro. El castellano ya se deduce para la transcripción
(`puro.ts:254`), pero el encargo de la entrevista no lo recibe (ver B2).

### B. Entradas que el modelo no recibe

**B1. La ficha de la compra no siembra el perfil.** `perfil.ts:140` le pega el texto de la ficha al
modelo en cada respuesta y confía en que la copie. No hay `perfilDesdeFicha(contexto)`: el año de
nacimiento, el estado civil (el checkout ya lo pide), `arbol.hijos = 'no tuvo'`, y el mujer/hombre
que la compra va a preguntar, deberían entrar al perfil el día 0 con `fuente: 'ficha'`, y la ficha
dejar de viajar en cada llamada.

**B2. El castellano no llega al encargo.** `castellanoDe` existe solo para la transcripción. El
perfil y el encargo no saben si la persona es de España, así que el primer mensaje ofrece "vos o
usted" y el `Trato` de producción (`trato.ts:22`) no tiene `tú`. Esta noche el control sí lo
conoce (`control-texto.ts`, `TratoControlable`); el flujo, la puerta manual y los mensajes de
`puro.ts` (despedida, bienvenida) siguen sin conocerlo. Es de Joaquín.

**B3. El plan de preguntas no recibe la edad de las bisagras.** `plan-preguntas.ts:62` solo entiende
"a los N". El prompt del perfil no lo pedía: arreglado esta noche (`df43cf5`), pero es un ejemplo
de regla que supone un formato.

**B4. Las etapas del guion viejo se mapean a mano.** `etapas.ts:86` traduce "la infancia",
"las raíces", "la juventud" y "la sabiduría" a edades; el amor, el oficio, los hijos y las pruebas
arrancan "sin capítulo". Sirve para la prueba con material viejo; con el guion v2 sale del tramo de
cada pregunta. Que no quede como código de producción.

### C. Salidas que nadie controla

**C1. Qué se manda cuando el control rechaza dos veces.** `pregunta-v2.ts:132` y
`evaluar-v2.ts:119` devuelven `ok: false` "para que quien llama decida". Nadie decidió. Hoy la v1
manda la fija original; en el v2 no hay fija. Opciones: mandar la última igual (con la marca en el
panel), o pedir un tercer intento con el modelo grande y el motivo. Producto.

**C2. El control del libro no frena.** `paginas.ts:136-137` avisa si repite más del 3 % o si más
del 8 % no tiene respaldo, pero solo devuelve `avisos`; en la prueba se imprimen. Al conectar: ¿qué
pasa con un aviso? ¿Se imprime igual, se avisa al panel, se rehace el capítulo? Producto.

**C3. `sinRespaldo` mide reescritura, no invento.** `medir-repeticion.ts:56`, umbral 0,5 de
palabras de contenido compartidas. Con el encargo nuevo ("redactado por un escritor de primera") las
oraciones se reescriben más y la métrica va a subir sin que haya invento. En la prueba hay que leer
las 7 (o las que salgan) y no tomar el número como verdad; el tope del 8 % puede quedar corto.

**C4. La evaluación v2 no valida `repregunta` ni `reservadoTramo`.** `evaluar-v2.ts:84` devuelve
`crudo as EvaluacionV2`. Si el modelo pone `reservado: "sí"` o `dejarTema: true`, nadie lo ve. Un
`typeof` por campo, como hace `perfil.ts`.

### D. Reglas que suponen cosas

**D1. Zona horaria = castellano.** `puro.ts:254`. En la base hay un narrador en `Europe/Madrid` con
trato vos (Joaco, un argentino en Madrid) y uno en `Asia/Bangkok` (Ñako). Arreglado a medias esta
noche (`15a7b8c`: el trato vos manda), pero la fuente segura es preguntarlo en la compra, junto con
mujer/hombre.

**D2. "Usted" cuando no se sabe.** `encargo-entrevista.ts:45`. Es lo que decidió Naza (usted
cálido hasta que elija), y está bien. Anoto que el hallazgo 1 sigue siendo posible el día 1: si la
persona no contesta la pregunta del trato, queda en usted hasta que el perfil lo deduzca.

**D3. La edad "entre 25 y 35" se toma como 30.** `plan-preguntas.ts:41`. Aceptable, pero el perfil
puede devolver "unos 70" (un número) o "setenta" (ninguno): con letras no planifica. Pedirle al
prompt del perfil que la edad vaya siempre en cifras.

### E. Costos

**E1. El entrevistador v2 cuesta ~USD 2 por libro, no +0,68.** El documento del cerebro calculó
pasar Haiku a Opus (+0,68). El v2 además agrega **una llamada a Opus por respuesta para el perfil**
(`perfil.ts:18`, ~USD 0,03 medido por llamada equivalente), y la pregunta y la evaluación también
en Opus. Cuenta: 30 perfiles (0,9) + 30 preguntas (0,9) + 30 evaluaciones (0,8) ≈ **USD 2,6 por
libro**, contra ~1 hoy. Sigue siendo el 5 % del precio, pero `GASTOS.md` no lo dice. Con caché
de prompt (el encargo y el perfil se repiten en cada llamada) bajaría a la mitad: es el primer
ahorro cuando esté conectado, no ahora.

**E2. La fábrica v2 sale más barata.** Joaquín costó 2,62 (5 capítulos con la historia completa)
+ 2,08 (editor). Con reparto: ~0,5 (etapas + reparto) + 8 × 0,22 + 0,4 (páginas) ≈ **USD 2,7**.
Bien.

### F. Lo que la prueba única no mide

1. **La reserva (hallazgo 19, el más grave del triage).** Ninguna respuesta real la tiene. Habría
   que agregar un caso sintético (una respuesta con "esto que no vaya al libro") a la prueba: cuesta
   USD 0,03.
2. **Una persona de 60+.** Todo el material real es de 28. Osvaldo es el único "mayor" y es
   texto inventado. Lo que salga sobre cobertura de la vida adulta hay que leerlo así.
3. **El perfil con la ficha de la familia.** La prueba lo arma sin ficha a propósito (la pregunta
   de Naza); el caso con ficha, que es el de un cliente que sí cargó, no se prueba.
4. **La secuencia entera.** Se escriben 5 del núcleo + 11 variables con el perfil final; no se
   simula la entrevista día a día (perfil parcial, preguntas ya hechas creciendo). Es lo que más se
   parece a producción y es lo más caro: no para esta prueba, sí antes de conectar.
5. **Cómo queda un capítulo nuevo leído.** Los números (repetición, respaldo) no dicen si emociona.
   Naza y Joaquín tienen que leer al menos dos capítulos de cada libro, como pide el 41.

## 5. Los scripts de la prueba única

**`entrevistador/scripts/prueba-integral.ts`** (revisado línea por línea, tipos limpios):

- Lo que podía fallar y arreglé (`05c5899`): un error de la API a mitad de camino (el crédito se
  acabó el 23/09) tiraba TODO lo pagado de ese narrador y de los siguientes. Ahora el perfil se
  guarda apenas termina, `--reusar-perfil` lo lee, y cada narrador va en su `try`: uno que falla
  se anota y siguen los otros.
- Lo que no medía: el primer mensaje (ahora sí, con ficha vacía) y los temas que pidió dejar
  (`contexto.evitar`, ahora llega a la pregunta del día).
- El guion mezclaba plantilla y preguntas propias en un `Map` sin orden: ahora las propias pisan.
- Verificado contra la base: los tres `como_le_dicen` existen, `preguntasEnviadas` y
  `repreguntasEnviadas` son objetos por orden (lo que el script espera), `b3bd57db…` es el audio
  ajeno, C1 y C4 se encuentran. El `import` dinámico de `cerebro.js` necesita `WA_*` y
  `OPENAI_API_KEY`: el script los rellena.

**`fabrica/scripts/prueba-reparto.ts`**:

- **Bug real** (`d44a336`): con `--etapas`, si el modelo ubicaba solo una parte de una respuesta
  "sin capítulo", la respuesta ENTERA iba a la reflexión y las oraciones ya ubicadas quedaban dos
  veces. Justo lo que el reparto vino a arreglar, y la medición lo habría contado como éxito parcial.
  Ahora cada oración suelta va con el resto de su respuesta.
- Verificado: Joaquín y Osvaldo tienen `estructura.json`, `nombres.json` y `edicion`. Osvaldo no
  tiene borradores (salta el "antes" sin fallar). Con `--excluir` para Osvaldo no pasa nada.
- Si las etapas no se entienden, tira después de pagar esa llamada (~0,3) y deja `etapas-salida.txt`.
  Aceptable.
- **La fábrica no tipa `scripts/`** en esta rama (`fabrica-tipos` es otro worktree). Lo compilé a
  mano con un tsconfig que lo incluye: limpio. Mergear `fabrica-tipos` antes de la próxima sesión.

**Las carpetas de salida no estaban en `.gitignore`** (`2ddca99`): `prueba-integral/`,
`prueba-perfil-*/` y `prueba-reparto-*/` llevan las transcripciones de Joaquín y Ciro. Un
`git add -A` las subía.

### Costo de la prueba única, con los números medidos

| Parte | Llamadas | Costo |
|---|---|---|
| Perfil (83 respuestas, Opus) | 83 × ~0,03 | ~2,5 |
| Preguntas (16 por narrador × 3, Opus, con reintentos) | ~50 × ~0,03 | ~1,5 |
| C1 y C4 (hoy vs v2) | 4 | ~0,1 |
| **Entrevistador** | | **~USD 4** |
| Etapas + reparto (Fable, por narrador) | 2 | ~0,5 |
| Capítulos (5-8 por narrador) | ~14 | ~3 |
| Páginas (apertura, cierre, frases) | 2 | ~0,8 |
| **Fábrica (Joaquín + Osvaldo)** | | **~USD 4-5** |
| **Total** | | **USD 8-10** |

Los comandos son los del handoff. Antes de correr: `ANTHROPIC_API_KEY` la misma en los dos `.env`
(C10) y crédito cargado.

## 6. Arreglos hechos esta noche (sin gastar, con tests)

| Commit | Qué |
|---|---|
| `2ddca99` | `.gitignore`: las salidas de las pruebas no van al repo |
| `d44a336` | fábrica: `ubicarSueltas` — lo no ubicado no se duplica (3 tests) |
| `6efc033` | entrevistador: la pregunta v2 recibe `evitar`; el control conoce el `tú`; "Año de nacimiento" en vez de "Edad" (4 tests) |
| `df43cf5` | entrevistador: el perfil pide las bisagras "A los N…" (1 test) |
| `15a7b8c` | entrevistador: el trato vos manda sobre la zona horaria en la transcripción (1 test). **Toca producción al mergear**, como el resto de `puro.ts` |
| `05c5899` | entrevistador: prueba única reanudable, tolerante a fallas, con el primer mensaje y `evitar` |

Ningún texto que vea una persona cambió. El único prompt tocado es el del perfil (regla 9, las
bisagras), que le habla al modelo, no a la persona.

## 7. Propuestas, priorizadas

1. **Antes de la prueba** (no gastan, 1 hora): el caso sintético de reserva (F1); `typeof` por
   campo en `parsearEvaluacion` (C4); la edad siempre en cifras en el prompt del perfil (D3).
2. **Decisiones de Naza antes de conectar**: A1 (sin edad), A2 (primer mensaje), A3 (objetos en
   el v2), A4 (hijos/hermanos en el núcleo), C1 (qué se manda si el control rechaza), C2 (qué
   hace un aviso del control del libro).
3. **Para Joaquín** (código suyo y web): `tú` en `Trato` y en los mensajes de `puro.ts`; la compra
   pregunta mujer/hombre y castellano (D1, A6); `perfilDesdeFicha` con los datos del checkout (B1);
   mergear `fabrica-tipos`; aplicar la migración de descartadas (la aplica Naza).
4. **Después de la prueba**: leer los capítulos (F5); reescribir `GASTOS.md` con el costo v2 (E1);
   caché de prompt en el encargo y el perfil.
5. **Sin tocar hasta que Naza lo pida**: NotebookLM.

## 8. Dos cosas que vi de paso, para Joaquín

- **Ñako** (`370b1cd0`, IÑAKI MURO) está `activo`, día 1, zona `Asia/Bangkok`, con **58 preguntas
  propias** (órdenes 1-58, todas `fija`, sin objetos). Si es un cliente real, está recibiendo el
  guion viejo ahora mismo; si las 58 no son a propósito, algo copió el guion de más.
- **Joaco** (`e9ef083f`) en `Europe/Madrid` con trato vos: es el caso que motivó `15a7b8c`.
