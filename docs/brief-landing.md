# Brief de la landing — Vitácora Familiar

> **Cómo usar este archivo:** es el prompt. Pasáselo entero a quien construya la
> landing (persona o Claude) junto con `docs/design.md` y `docs/sistema-visual.html`.
> Contiene lo que hay que saber del producto, del comprador y de la conversión.
> Los tokens visuales NO están acá: están en `design.md`, y son obligatorios.
>
> **Ojo con la propiedad:** la landing vive en `web/`, que es **carpeta de Naza**
> (regla de oro del README: nadie toca la carpeta del otro). Este brief se acuerda
> entre los dos y lo implementa él, o se acuerda explícitamente una excepción.

---

## 1. El producto, en frío

**Vitácora Familiar** entrevista por WhatsApp a una persona mayor durante 30 días
y le entrega a su familia **el libro de su vida + el audiolibro con su propia voz**.

Cómo funciona de verdad:

1. La hija entra a la web y **anota a su papá**: nombre, WhatsApp, hora preferida
   y 3-4 datos de contexto. **Gratis.**
2. Él recibe un mensaje de WhatsApp que le explica quién lo anotó y le pide
   permiso. Sin su "sí", no arranca nada.
3. Cada mañana, a su hora, le llega **una pregunta**. Él contesta **con un audio
   de WhatsApp**, como hace todos los días. Nada que instalar, nada que aprender.
4. Mientras tanto, ella ve el progreso en su tablero, escucha los audios a medida
   que llegan, y junta los saludos grabados del resto de la familia con un link.
5. Al terminar, él recibe por WhatsApp los saludos de todos —grabó 30 días para su
   familia sin saber que su familia grababa para él— y ella recibe la
   previsualización del libro.
6. **Recién ahí se paga**, y se descarga el libro (PDF listo para imprimir) y el
   audiolibro.

**Modelo:** freemium puro. Grabar los 30 días es gratis. Se cobra al final, con la
emoción en su punto más alto. Pago único.

**Precio:** ~ARS 65.000 (Argentina). España queda diferida hasta resolver el cobro.

---

## 2. El objetivo de la landing — leer esto antes de escribir una línea

**La landing NO vende el libro. Consigue el registro gratuito del narrador.**

Es la diferencia más importante de todo este documento. El dinero llega 30 días
después; lo que la landing tiene que producir hoy es **un alta**. Todo —el CTA,
la estructura, el orden de los argumentos— se ordena alrededor de eso.

- **CTA único en toda la página: "Empezar gratis".** Nunca "Comprar", nunca
  "Ver precios". Se repite idéntico las veces que haga falta. Un solo verbo en
  toda la landing.
- **Métrica de éxito:** altas de narrador. El evento que se manda al pixel es
  *"el narrador aceptó y empezó"*, no la compra (la compra cae fuera de la ventana
  de atribución de 7 días de Meta y el algoritmo nunca la ve).
- **Fricción mínima en el formulario.** Cada campo extra cuesta altas. Lo
  imprescindible: nombre del narrador, su WhatsApp, hora preferida, email de quien
  lo anota. Los datos de contexto pueden pedirse después del alta.

---

## 3. A quién le habla

**Martina, 42, Buenos Aires.** Trabaja, tiene hijos chicos, ve a su papá los
domingos. Ya regaló marcos con fotos, un álbum, una taza. Carga una culpa suave y
permanente: ve poco a su viejo y lo sabe.

**Su miedo no es el precio. Es la vergüenza:** que le regale algo a su papá, él no
lo use, y quede ahí el regalo, reprochándole. **Compra cuando le sacás ese miedo,
no cuando la emocionás más.** Esto define el orden de la página (ver §4).

Dos figuras más a tener en cuenta:

- **Don Roberto, 76** — el narrador. No paga, pero **tiene derecho a veto**: si
  dice "dejate de joder con eso", la venta muere. Puede llegar a la landing porque
  su hija se la mandó. Que no encuentre nada que lo asuste.
- **Nicolás, 36**, va a ser padre y quiere dejarle su historia a su hijo. Se hace
  el libro **de su propia vida**. Segmento chico pero de conversión alta: decide y
  compra solo, sin convencer a nadie. Es el único caso donde se dice "la tuya".

---

## 4. La estructura, en orden, y por qué ese orden

**El orden importa más que el copy.** La objeción va segunda, no al final.

| # | Sección | Qué hace |
|---|---|---|
| 1 | **Hero** | Slogan + descriptor + CTA + una imagen real del libro |
| 2 | **Cómo funciona, en 3 pasos** | **Desarma la objeción principal antes de que aparezca** |
| 3 | **"Solo tiene que mandar un audio"** | La prueba visual: una captura real de WhatsApp |
| 4 | **El objeto** | Fotos de páginas reales del libro. Justifica el precio |
| 5 | **La voz** | El audiolibro: el diferencial que nadie más tiene en castellano |
| 6 | **El cierre emocional** | Los saludos de la familia entregados el último día |
| 7 | **Precio, transparente** | Qué es gratis, cuánto sale, cuándo se paga |
| 8 | **Preguntas** | Las objeciones que quedan, respondidas en su idioma |
| 9 | **CTA final** | El mismo botón |

**Por qué "cómo funciona" va segundo y no penúltimo:** el freno de Martina no es
el deseo, es imaginarse explicándole una app a su papá de 78 por teléfono. Si esa
imagen no se desarma en los primeros 10 segundos, se va. La respuesta —*no hay app,
manda un audio de WhatsApp como todos los días*— es tan buena que hay que darla
temprano, no guardarla.

---

## 5. El copy aprobado

Estas frases están cerradas. **No inventar variantes** sin pasar por los dos socios.

| Dónde | Texto |
|---|---|
| **Hero, titular** | En cada familia hay un libro sin escribir. |
| **Hero, bajada** | Un biógrafo entrevista y escribe el libro de una vida. La de tu papá, la de tu abuela, la tuya. |
| **CTA** | Empezar gratis |
| **Sección emocional** | Hay preguntas que un día ya no se pueden hacer. |
| **Sección del objeto** | Una vida merece un libro. |
| **Cierre / pie** | Para las vidas que merecen su propio libro |

**Slogan y descriptor van SIEMPRE juntos.** El slogan solo se puede leer como "me
toca escribirlo a mí" = trabajo. El descriptor lo desarma en la línea siguiente:
*un biógrafo entrevista **y escribe***.

### Reglas de escritura

- **Castellano neutro, de "tú".** Nada de voseo en la landing. El voseo vive en los
  ads argentinos, que Meta segmenta por país.
- **Regla del posesivo — la más fácil de romper:** nunca *"el libro de TU vida"*
  cuando hablás del caso regalo. Quien compra es la hija; el libro es de la vida
  **de su padre**. Decir "tu vida" hace entender que le escribimos la autobiografía
  al comprador, que es otro producto. Cuando no sepas de quién es, usá **"el libro
  de una vida"**.
- **La palabra "biógrafo" se usa y se repite.** Convierte un servicio raro (¿un bot
  de WhatsApp?) en un oficio de prestigio que existe hace siglos. Suena caro y
  justifica los ARS 65.000 antes de que aparezca el precio.
- **Nunca "IA", "bot", "algoritmo" o "automático"** en el texto visible. El
  producto es un biógrafo. Cómo funciona por dentro no es parte de la promesa, y
  nombrarlo la rompe.
- **Nunca se nombra la muerte.** La urgencia invita a actuar hoy; el enemigo es
  "el algún día", no la parca. "Hay preguntas que un día ya no se pueden hacer" es
  todo lo lejos que se llega.
- De "usted" solo cuando el texto le habla al narrador (por ejemplo, el botón
  "Empezar su libro" en piezas dirigidas a él).

---

## 6. Las objeciones, y cómo se contestan

Estas son las cinco que matan la venta. Cada una necesita su respuesta visible en
la página, no escondida en un FAQ colapsado.

| Objeción | Respuesta |
|---|---|
| **"Mi viejo no va a saber usarlo"** | No hay nada que instalar ni que aprender. Le llega un mensaje de WhatsApp y contesta con un audio, como hace todos los días. Mostrarlo con una captura real |
| **"¿Y si no quiere / le da vergüenza?"** | Le pedimos permiso antes de empezar y él decide. Puede parar cuando quiera y retomar cuando quiera |
| **"¿Quién escucha los audios de mi papá?"** | Solo su familia. Los audios son privados, se usan únicamente para su libro, y se pueden borrar todos cuando quiera |
| **"¿Y si empieza y no termina?"** | Los 30 días son 30 preguntas, no 30 días de calendario: si un día no contesta, la pregunta espera. Y con 10 respuestas ya se puede hacer el libro |
| **"¿Cuánto sale?"** | Decirlo, claro y temprano. Empezar es gratis; se paga al final, solo si querés el libro |

**Sobre el precio: no lo escondas.** Con un producto emocional y desconocido, no
mostrar el precio se lee como trampa. El encuadre correcto es el competidor:
**lo mismo que sale hoy un libro de preguntas para llenar a mano** — mismo precio,
y acá se lo cuenta hablando y le queda su voz grabada.

---

## 7. Prohibiciones — leerlas antes de buscar imágenes

1. **Nunca caras humanas generadas por IA.** Ni una. La promesa de la marca son
   las voces y las historias REALES; un abuelo de IA en la landing la contradice
   y, si alguien lo nota, destruye la confianza que todo el producto necesita.
   Ornamentos, texturas y objetos sí se pueden generar.
2. **Nunca fotos de stock de abuelos sonrientes.** Se reconocen a un kilómetro y
   dicen "esto no es real". Preferible una foto de familia auténtica —con permiso—
   o solo tipografía y fotos del libro.
3. **Testimonios: sí va a haber, pero reales.** Decisión del 07/09: se consiguen
   **5 personas que prueben el producto antes de salir a la venta** y dejen una
   reseña real. Hasta entonces, la sección se construye con **texto de relleno
   marcado como tal** (ver §7bis) — sirve para diseñar, no para publicar.
   **Regla dura: la landing no se publica con testimonios inventados.** Si el
   lanzamiento llega antes que las reseñas, la sección se oculta hasta tenerlas.
   No es escrúpulo: son reseñas falsas en publicidad, lo más fácil de denunciar
   bajo Lealtad Comercial y Defensa del Consumidor, y hunde a una marca chica.
4. **Nunca urgencia falsa:** contadores, "quedan 3 lugares", descuentos que
   vencen. Este producto ya tiene la urgencia más real que existe; inventar una de
   marketing la abarata.
5. **Nunca prometer lo que no hay:** el libro impreso físico no existe todavía
   (es fase 2). Se entrega **PDF listo para imprimir** + audiolibro. Decirlo así.

**Mientras tanto**, el resto de la prueba: las páginas reales del libro de Osvaldo
(el piloto), la captura real de WhatsApp, y que en castellano no existe nada
parecido.

---

## 7bis. Testimonios — cómo se hace bien

**En la maqueta** se usan cinco de relleno, con largos desparejos (los reales
nunca miden todos lo mismo, y una sección diseñada con cinco textos iguales se
rompe apenas entran los verdaderos). Cada uno lleva en el código un
`{/* PLACEHOLDER — reemplazar por reseña real */}`, y mientras la landing no
esté publicada conviene que se vean marcados en pantalla.

**Los cinco reales** salen de las 5 personas que prueben el producto antes de la
venta. Un testimonio bueno no sale de "¿te gustó?" — sale de preguntas que
obligan a un detalle concreto:

1. ¿Qué pensabas que iba a pasar cuando lo anotaste, y qué pasó en realidad?
2. ¿Hubo algún momento en que te sorprendió algo que contó? ¿Cuál?
3. ¿Cómo reaccionó él/ella cuando recibió los saludos de la familia?
4. ¿Qué le dirías a alguien que duda porque cree que su papá no va a saber usarlo?
5. ¿Qué hiciste con el libro cuando lo tuviste?

La 4 es la más valiosa: **un cliente desarmando la objeción principal convence
mucho más que nosotros haciéndolo.** La 2 y la 3 son las que dan la frase que
emociona.

**Cada testimonio publicado necesita:** nombre real, ciudad, permiso explícito por
escrito, y —si se usa foto— permiso aparte para la imagen.

---

## 8. Lo visual

**Todo sale de `docs/design.md`. No inventar colores, fuentes ni versiones del
logo.** Resumen para no equivocarse:

- **Blanco y negro.** Negro `#14140F`, blanco `#FFFFFF`. La jerarquía se hace con
  tamaño, grosor y aire — nunca con color.
- **El violeta es el único acento** y toca **una sola cosa por pantalla**: el botón
  principal, un link, un subrayado. Sobre fondo claro `#5D3FD3`; **sobre fondo
  oscuro `#8F7BE0`** (el primero no se lee sobre negro).
- **Tipografías:** Playfair Display (titulares y citas), Archivo (etiquetas
  chiquitas en mayúsculas con tracking), Source Serif 4 (cuerpo).
- **Logo:** o el Campo V·F completo (`marca/logo-campo-vf-*.svg`, mínimo 120 px de
  alto), o el toroide solo (`marca/toroide-*.svg`) para tamaños chicos. **No existe
  ninguna versión intermedia.**
- **Las fotos de familia van en blanco y negro parejo.** Empareja calidad
  despareja y da identidad.
- **Mobile primero.** Martina llega desde Instagram, en el teléfono, probablemente
  de noche y cansada.

---

## 9. Qué tiene que pasar después del clic

El formulario de alta es donde se gana o se pierde todo el trabajo de arriba.

- **Lo mínimo:** nombre del narrador, su WhatsApp, hora preferida, email de quien
  lo anota. Nada más en el primer paso.
- **El campo del WhatsApp es el más delicado.** Es el número del papá, no el de
  ella: decirlo explícito en la etiqueta, con el formato de ejemplo, para que nadie
  ponga el suyo por reflejo.
- **Decir qué va a pasar inmediatamente después:** "Le va a llegar un mensaje
  nuestro presentándose y contándole que lo anotaste. No empieza nada hasta que él
  diga que sí." Eso saca el miedo a que le llegue algo raro a su papá sin aviso.
- **Guardar el click id de Meta** (`fbclid` / `fbp` / `fbc`) en el alta. Sin eso no
  se puede medir el CAC, y con ~USD 5 de costo contra ARS 65.000 de precio, saber
  el CAC es la diferencia entre un negocio y una fuga de plata. ⚠️ Es un cambio de
  esquema: coordinar por `supabase/CONTRATO.md`.

---

## 10. Lo que hay que tener listo antes de publicar

- [ ] `/legal/privacidad` y términos — **requisito duro de la API de WhatsApp**, sin
      eso no hay producto
- [ ] Fotos reales de páginas del libro de Osvaldo, con su permiso
- [ ] Una captura real de la conversación de WhatsApp
- [ ] Un fragmento del audiolibro que se pueda escuchar en la página
- [ ] Metadatos y Open Graph, para que el link se vea bien cuando lo compartan
- [ ] El pixel configurado con el evento correcto (alta, no compra)
- [ ] **Los 5 testimonios reales, con permiso por escrito** — o la sección oculta
