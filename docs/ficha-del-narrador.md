# La ficha del narrador — qué datos pedimos y para qué sirve cada uno

> **Estado: propuesta de Naza (2026-09-14).** Nada de esto está construido.
> **21/09:** el checkout ya pide año de nacimiento, estado civil, hijos (contexto mínimo),
> **dónde vive** (`contexto.dondeVive`) y el **trato usted/vos** (`contexto.trato`, editable en
> el panel hasta la primera pregunta). Lugar de nacimiento, oficio y el árbol siguen sin pantalla.
> Manda sobre: el paso 2 del checkout (`web/src/app/comprar/formulario.tsx`).
>
> **El hallazgo que la motivó:** el pipeline entero ya sabe usar la ficha del
> narrador (transcripción, biógrafo, capítulos del libro), pero **el formulario
> de compra no pide ninguno de esos datos**. La web acepta, valida y guarda
> `lugarNacimiento`, `anioNacimiento`, `oficio`, `datosExtra` y el árbol familiar
> (`web/src/lib/registro.ts:141-213`) — y no hay una sola pantalla que los pida.
> Resultado: un cliente real compra hoy y su narrador arranca con la ficha vacía.

---

## 1. Qué es la ficha

Son los datos que la familia carga **sobre** el narrador antes de que él cuente
nada: dónde nació, en qué año, a qué se dedicó, cómo se llaman sus padres e
hijos, de dónde venían los abuelos, si mezcla otro idioma.

No es un formulario de marketing: es **el contexto que necesitan los modelos**
para trabajar sobre una vida concreta.

## 2. Quién lee la ficha (cuatro consumidores, todos ya construidos)

| Consumidor | Qué hace con la ficha | Código |
|---|---|---|
| **La transcripción** | Sesga el vocabulario del modelo antes de transcribir | `entrevistador/src/manual/puro.ts:promptDeTranscripcion` |
| **La personalización de la pregunta** | Reescribe la pregunta del día con los nombres y lugares de la familia | `entrevistador/src/ia/personalizar.ts` |
| **El biógrafo** | Apertura de cada día con los nombres y la época ("allá por 1968...") | `entrevistador/src/ia/cerebro.ts:generarReconocimiento` |
| **Las preguntas de reemplazo** | Si el capítulo no aplica a esa vida, inventa otra pregunta | `entrevistador/src/flujo/preguntar.ts:crearReemplazo` |
| **Los capítulos del libro** | Nombres, lugares y oficio bien escritos en el texto final | `fabrica/src/libro/*` |

> La personalización es la que más depende de los **roles**: sin saber que Haydée
> es su madre y Élida su esposa, el modelo confunde a una con la otra
> (ver `entrevistador/src/ia/ficha.ts`).

## 3. Por qué esto no es una lista de deseos: la evidencia

Medido el 2026-09-14 con un audio real de 3 minutos (un narrador porteño):

| | Lo que entendió el modelo |
|---|---|
| Ficha vacía | "...mi viejo llegando de **la URA** a las 8 de la noche" ❌ |
| Ficha con vocabulario + datos | "...mi viejo llegando **de laburar** a las 8 de la noche" ✅ |

La diferencia no la hizo un modelo mejor: la hizo **saber quién estaba hablando**.
Y con nombres propios el efecto es más grande todavía — son lo único que el
modelo no puede deducir del sonido, y lo que peor se ve cuando sale mal en el
libro impreso.

> Contrapartida honesta: la ficha no arregla todo. Una palabra rara que nadie
> anticipó sigue necesitando la revisión de nombres antes de cerrar el libro
> (`nombres.json`). La ficha reduce el problema; no lo elimina.

## 4. Lo que pide hoy el checkout, contra lo que ya se soporta

| Dato | ¿Lo pide la pantalla? | ¿La lógica lo usa? |
|---|---|---|
| Nombre completo del narrador | ✅ | portada del libro |
| Cómo le dicen | ✅ | saludos del biógrafo |
| WhatsApp + hora preferida | ✅ | envío de las preguntas |
| Vínculo del comprador | ✅ | mensaje de bienvenida |
| **Lugar de nacimiento** | ❌ | transcripción, libro |
| **Año de nacimiento** | ❌ | reconocimientos, época |
| **Oficio** | ❌ | transcripción (vocabulario), libro |
| **Árbol familiar** (padres, hermanos, pareja, hijos) | ❌ | transcripción, biógrafo, reemplazos, libro |
| **Datos extra** | ❌ | todo lo anterior |
| **Otro idioma / país de origen de la familia** | ❌ (ni existe el campo) | transcripción |

El hueco es **una pantalla**, no un sistema: el formulario arma el objeto
`narrador` sin `contexto`, y `/api/compra` inserta lo que le llegan.

## 5. Qué proponemos pedir

| Dato | Cómo se lo preguntamos a la familia | Para qué sirve |
|---|---|---|
| Lugar de nacimiento | "¿Dónde nació?" | ciudades y pueblos bien escritos; ancla la época |
| Año de nacimiento | "¿En qué año nació? (si no estás seguro, el año aproximado)" | "allá por 1968..." en cada apertura |
| De dónde viene la familia | "¿Sus padres nacieron acá o vinieron de otro país? ¿De dónde?" | apellidos y nombres en otro idioma, acentos, palabras que va a mezclar — y es material del capítulo "Las raíces" |
| Oficio | "¿A qué se dedicó?" | el vocabulario del oficio (un mecánico dice biela, cigüeñal, torno) |
| Los nombres de su gente | "Escribinos los nombres de sus padres, hermanos, pareja e hijos — **como se escriben**" | es lo que más se deforma y lo que más duele ver mal impreso |
| Otro idioma | "¿Habla o mezcla otro idioma? (catalán, gallego, italiano, quechua...)" | el modelo tiene que saber que esas palabras pueden aparecer |
| Palabras de la casa | "¿Hay alguna palabra que usen solo en su casa o en su barrio?" | apodos y regionalismos |
| Algo más | "¿Algo más que debamos saber de él?" | el comodín (`datosExtra`) |

La pregunta concreta que planteó Naza —**"¿qué nacionalidad es el padre?"**— cae
en la tercera fila, y es de las que más rinde: un narrador catalán con un padre
"Michele" y una hermana "Paki" le da al modelo tres palabras que de otra forma
adivina mal.

## 6. Reglas para escribir esas preguntas

1. **Palabras de familia, no técnicas.** "¿De dónde venían sus padres?" gana a
   "nacionalidad del padre". Quien completa esto es un nieto desde el celular.
2. **Todo opcional, y se puede completar después.** Nadie tiene que llamar a su
   tía para poder pagar.
3. **Los nombres, como se escriben** — con ejemplo: *"Itzel, no Itcel"*.
4. **Cortas y de a una.** Seis preguntas es el techo; en el checkout, una por
   pantalla.
5. **Si el narrador es el comprador** ("quiero la mía"), las mismas preguntas en
   segunda persona.
6. **Nada de píxeles ni jerga:** ni "contexto", ni "metadatos", ni "árbol
   familiar" de cara al usuario.

## 7. Dónde se completa (decisión abierta — la toman los dos socios)

| Opción | A favor | En contra |
|---|---|---|
| **A. Todo en el checkout** | La ficha está completa antes de la primera pregunta | Fricción justo antes de pagar; la familia todavía no vio nada y no tiene ganas de investigar |
| **B. Todo en el panel** | Se completa cuando ya hay algo que mirar | La primera pregunta sale con la ficha vacía |
| **C. Las dos cosas (recomendada)** | 3 datos al comprar (lugar, año, oficio) + los nombres propios y el idioma en el panel, cuando llega el anticipo | Dos lugares donde mirar; hay que construir las dos pantallas |

**Recomendación:** la opción C, con el disparador del anticipo. Cuando la familia
recibe el primer capítulo y escucha la voz, ya sabe de quién está hablando y
contesta esos nombres en 30 segundos. Antes del pago, no.

## 8. Cómo verificarlo desde la consola (ya funciona)

```bash
# lo que el modelo sabe hoy de ese narrador antes de transcribir
npm run manual -- contexto imma

# y si la ficha se completa después de que ya hay audios cargados,
# las transcripciones viejas se pueden rehacer con la ficha nueva:
npm run manual -- retranscribir imma --si
```

## 9. Lo que NO hay que pedir

- Documento, dirección, fecha exacta de nacimiento: no cambian nada del producto.
- Un formulario largo "por si sirve": cada campo que no se completa es ruido en
  el prompt (se recorta a ~224 tokens) y una razón más para abandonar la compra.
- Nada que el narrador pueda contar mejor que la familia: la ficha es contexto,
  no la historia.
