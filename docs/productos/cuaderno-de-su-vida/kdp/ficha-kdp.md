# El cuaderno de su vida — ficha para Amazon KDP (tapa blanda)

Archivos de esta carpeta, todos salen de `python generar.py` (lee `../preguntas.md`, el texto aprobado):

| Archivo | Qué es |
|---|---|
| `interior.pdf` | El interior, para subir en «Manuscrito» |
| `cubierta.pdf` | La cubierta completa (contratapa + lomo + frente), para subir en «Cubierta» |
| `interior.html`, `cubierta.html` | La maqueta de la que sale cada PDF (Edge headless) |
| `prev-interior.png`, `prev-cubierta.png` | Previsualizaciones |
| `verificacion.json` | Medidas medidas sobre los PDF y el mapa página por página |

## Medidas finales

| | |
|---|---|
| Formato | A5, 5,83 × 8,27 in (148 × 210 mm), tapa blanda |
| Interior | Blanco y negro, papel crema, sin sangrado |
| Páginas | **144** |
| Lomo | 144 × 0,0025 in = **0,36 in (9,14 mm)** |
| Cubierta | **12,27 × 8,52 in (311,66 × 216,41 mm)** = 0,125 + 5,83 + 0,36 + 5,83 + 0,125 de ancho; 0,125 + 8,27 + 0,125 de alto |
| Peso | interior.pdf 0,4 MB, cubierta.pdf 0,05 MB |

Si cambia el número de páginas, el lomo y el ancho de la cubierta se recalculan solos al volver a correr `generar.py`.

## Cómo cumple cada requisito de KDP (verificado con PyMuPDF sobre los PDF)

- **Tamaño de página del interior**: las 144 páginas miden 419,76 × 595,44 pt = 5,83 × 8,27 in exactas. Edge redondea a píxeles, así que imprime con 0,2 in de holgura y el generador recorta cada página a la medida justa, sin escalar.
- **Sin sangrado**: nada llega al borde. Lo más cercano al corte es el folio, a 0,31 in del borde de abajo.
- **Márgenes** (144 páginas, tramo 24–150: interior ≥ 0,375 in, exterior ≥ 0,25 in): interior 17 mm (0,67 in), exterior 13 mm (0,51 in), arriba 15 mm, abajo 17 mm con el folio a 8 mm. Espejados: en las impares el margen grande va a la izquierda, en las pares a la derecha. Medido sobre el texto real, el mínimo es 0,67 in del lomo y 0,51 in del borde exterior. Si algún día pasa de 150 páginas, el interior ya cumple el tramo 151–300 (≥ 0,5 in).
- **Blanco y negro**: todo en negro y grises neutros (R = G = B). El número del capítulo pasa del violeta de la muestra a gris oscuro #333. Fondo de página blanco (KDP pone el papel crema).
- **Fuentes incrustadas**: Playfair Display 500, Source Serif 4 (normal, semibold, cursiva) y Archivo, todas TrueType incrustadas, ninguna Type 3. No se usan las de Google Fonts porque Edge imprime las fuentes variables como Type 3; se usan las estáticas del repo (`fabrica/fuentes-imprenta/` y `web/src/app/_compartir/fuentes/playfair-500.ttf`, licencia OFL).
- **Número de páginas par**: 144.
- **Cubierta**: una sola página de 12,27 × 8,52 in con 0,125 in de sangrado en los cuatro lados (el negro llega hasta el borde). Todo el texto del frente y la contratapa queda a más de 0,7 in del corte.
- **Lomo con texto** (KDP lo permite desde 80 páginas): «El cuaderno de su vida» y «Vitácora Familiar», leído de arriba abajo, con más de 0,0625 in de aire a cada lado del lomo y a 0,45 in de los cortes de arriba y abajo.
- **Código de barras**: recuadro blanco de 2 × 1,2 in abajo a la derecha de la contratapa, a 0,25 in del corte de abajo y del pliegue del lomo. KDP imprime ahí el código.
- **QR**: código real a `https://vitacorafamiliar.com/cuaderno`, vectorial, 34 mm, corrección M. Comprobado leyéndolo con OpenCV desde la página 144.

## Orden del interior

| Páginas | Qué |
|---|---|
| 1 | Portadilla de título |
| 2 | De quien regala |
| 3 | Para quien escribe |
| 4 | Índice (con las páginas reales) |
| 5 | Capítulo 1, portadilla |
| 6–15 | Preguntas 1 a 5 |
| 16, 30, 42, 56, 70, 84, 98, 112, 124 | En blanco, para que la portadilla siguiente caiga en impar |
| 17, 31, 43, 57, 71, 85, 99, 113, 125 | Portadillas de los capítulos 2 a 10 |
| 134–136 | Pregunta 56 con sus dos páginas de renglones |
| 137 | En blanco |
| 138–143 | Tus fotos (6 páginas, 4 recuadros cada una) |
| 144 | ¿Ya lo has terminado? con el QR |

**Por qué así.** Cada pregunta empieza en página par, así la pregunta (izquierda) y su vuelta de renglones (derecha) quedan abiertas a la vez y quien escribe no tiene que pasar la hoja a mitad de la respuesta. Como la portadilla va en impar y el capítulo termina en impar, entre capítulo y capítulo queda una página en blanco a la izquierda de la portadilla (9 en total), que además da un respiro entre capítulos. Las fotos empiezan en par para que vayan de dos en dos enfrentadas, y el QR queda en la última página del libro. Folio en todas menos la portadilla de título, las de capítulo y las blancas. Arriba de cada página de pregunta va la etiqueta del capítulo, como en la muestra («De dónde vengo · 1» = capítulo 1).

**Cambios respecto de la muestra**, solo por imprenta. El violeta del número de capítulo pasa a gris oscuro (interior B/N). Las líneas de renglón pasan de beige a gris neutro para que se vean en papel crema. El fondo crema #F7F5EF era solo para pantalla. La portadilla de título (página 1) es nueva y usa solo el título, el toroide y «Vitácora Familiar».

**Distinto de lo que dice `preguntas.md`.** Ahí pone «tapa dura, unas 120 páginas»; esta edición es tapa blanda de KDP y sale en 144 páginas.

## Textos nuevos para aprobar

✅ **Los 6 textos APROBADOS por Naza el 21/10.** El 1 ya está impreso en `cubierta.pdf`.

**1. Texto de la contratapa**

> Un cuaderno para que alguien de tu familia escriba su vida a mano. Son cincuenta y seis preguntas en diez capítulos, desde la casa donde empezó todo hasta lo que quiere decir a los que vienen detrás. Cada pregunta tiene dos páginas de renglones para escribir sin prisa. Al final hay sitio para sus fotos. Lo que escriba se queda en la familia.

**2. Título en Amazon**

> El cuaderno de su vida

**3. Subtítulo en Amazon**

> Un diario guiado para que tus padres o tus abuelos escriban su historia a mano

**4. Descripción del producto**

> El cuaderno de su vida es un diario guiado para regalar a tu padre, tu madre, tu abuelo o tu abuela. Trae cincuenta y seis preguntas sobre su vida, ordenadas en diez capítulos que van de la casa donde nació a lo que quiere decir a su familia. Cada pregunta tiene dos páginas de renglones para escribir con calma y a mano. Las preguntas buscan recuerdos concretos, un día, una persona, una casa. No hace falta ir en orden ni contestarlas todas. Al final hay seis páginas para pegar fotos y anotar quién sale en cada una. Cuando lo termine, el cuaderno queda en la familia con su letra.

**5. Palabras clave** (KDP deja 7)

1. diario guiado para padres
2. libro para escribir tu vida
3. regalo para abuelos
4. cuaderno de memorias para rellenar
5. preguntas para la abuela
6. regalo día de la madre
7. historia familiar para escribir

**6. Categorías sugeridas** (comprobar el nombre exacto en el selector de KDP, cambia según el mercado)

1. Biografías, diarios y hechos reales › Memorias (en inglés, Biography & Autobiography › Personal Memoirs)
2. Familia y relaciones › Etapas de la vida › Tercera edad (en inglés, Family & Relationships › Life Stages › Later Years)

## Lo que falta antes de subir

- Aprobar los textos 1 a 6. Si cambia el 1, se edita `TEXTO_CONTRATAPA` en `generar.py` y se vuelve a correr.
- Decidir ISBN (el gratuito de KDP o uno propio) y el acabado de la cubierta (mate le queda mejor al negro, sugerencia).
- La URL del QR es provisional (`vitacorafamiliar.com/cuaderno`): la página tiene que existir antes de vender.
- Pedir una prueba impresa (copia de prueba de KDP) antes de publicar.
