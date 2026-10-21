# Receta: libro de la fábrica → Bookmundo tapa dura

17/10/2026. Hecha a mano con el libro de Imma. Es el paso a paso que la fábrica tiene que hacer sola.
Las reglas de Bookmundo, con sus fuentes, están en `especificaciones-bookmundo-2026-10.md` (al lado).

## Lo que aprendimos con Imma

1. **Bookmundo no hace A5 en tapa dura.** En tapa dura solo hay 155×235, 168×240, 177×254, 193×260 y 200×200
   (calculadora, 17/10). Nuestra plantilla es A5. **168×240 tiene la misma proporción que el A5**: el diseño
   se escala entero (×1,135) sin rediseñar, y la letra queda más grande, mejor para lectores de 60+.
2. **El PDF que entrega la fábrica no sirve tal cual para imprenta:**
   - trae tapa y contratapa como páginas (en Bookmundo la cubierta va aparte);
   - los márgenes no se alternan: el adorno lateral («riel») y el texto quedaban a 8 mm del lomo en las páginas derechas;
   - fondo crema hasta el borde sin sangrado → al cortar quedaría un filete blanco. Se pasa a blanco y se pide **papel crema**;
   - los capítulos caen en página izquierda o derecha según venga; en un libro van a la derecha (impar);
   - Chromium imprime las fuentes variables de Google como **Type 3**: hay que usar fuentes estáticas (TrueType) incrustadas;
   - tenía 34 páginas; el mínimo de tapa dura es 87–88 (crema). Se completa con páginas de notas.
3. El PDF del 14/10 de Imma tenía textos fijos en castellano en un libro catalán. Rearmado desde
   `escritor/libro.md` con el código actual ya sale todo en catalán.
4. Las frases de «Su voz» de Imma fallaron todas al recortar el audio (`frases.json`, estado `fallida`):
   el libro impreso no lleva QR por frase. El QR de la voz entera va en la cubierta.

## Pasos (lo que hace `armar-imprenta.mts`)

1. Bajar `{id}/escritor/libro.md` y armar el HTML con `htmlLibroV3` (idioma y trato de `entrevistas_v3`).
2. Cambiar el link de Google Fonts por `@font-face` con TTF estáticos incrustados (instanciados con fontTools desde los variables de google/fonts, OFL).
3. Paginar como siempre (el script de la plantilla) y después reordenar:
   portadilla (eyebrow + nombre de la tapa) · blanca · prólogo · blanca · capítulos siempre en impar
   (antes de cada apertura van las fotos de ese capítulo y blancas hasta quedar en impar) · cierre · «Notes» en impar ·
   páginas rayadas hasta el total − 1 · colofón en la última.
4. Espejo: en impar el lomo está a la izquierda. Columna, cabecera y pie con 19 mm (×1,135 = 21,6 mm) del lado del lomo.
5. Fondo blanco, `body { zoom: 168/148 }`, lienzo de 240/1,135 mm de alto, PDF 168×240 sin márgenes.
6. Verificar con `maquetador.py verificar --formato 168x240 --papel crema` y además medir la **tinta** de cada página
   (la caja del número grande de capítulo da un falso aviso: la tinta está a 12 mm del corte).

## Lo que falta para que sea automático

- Pasar los pasos 2 a 5 a la plantilla (`fabrica/src/libro/plantilla-html.ts`) como un modo «imprenta», en vez de parchar el HTML afuera.
- Fotos por capítulo: hoy la V3 no las pone (solo la tapa). Hay que saber a qué capítulo va cada foto y su epígrafe.
- La cubierta 168×240 con el lomo que da Bookmundo al subir el interior (el `maquetador.py` arma la cubierta Vitácora).
- Subir a Bookmundo: **no tienen API ni carga masiva** (sí cuenta para editoriales). Hoy se sube a mano.
- El texto de las frases que vienen escritas por WhatsApp («q», «d») sale así en «Les seves frases».
- **Declaración de IA**: Bookmundo obliga a declarar el uso de IA en el texto y prohíbe libros «generados total o
  sustancialmente por IA sin una aportación creativa, edición y reestructuración significativas por parte del autor».
  Decisión de negocio pendiente (Naza): cómo se declara un libro hecho con las palabras del narrador.
- `maquetador.py` (artifact Maquetador Vitácora) tiene 170×240 como formato: la calculadora dice 168×240. Corregirlo y republicar.

## Cubierta (17/10, libro de Imma)

- Medidas de la calculadora `covercalc` (tapa dura 168×240, 88 págs crema): **399,6 × 280 mm**, lomo 9,6 mm, 20 mm que se doblan sobre el cartón (no se ven). Cada tapa visible = 175 × 240.
- Generador: `Desktop\IMMA BOOKMUNDO\herramienta\cubierta-bookmundo.js` (copia del de la sobrecubierta del video, sin marcas ni solapas). PNG a 300 ppp, se sube con la plantilla FullEmpty. El QR se verifica leyéndolo del PNG.
- Foto de tapa: la de Imma era chica (156 ppp) y con ella al costado. Se extendió el fondo con Higgsfield, se borraron personas y se agrandó a 4K, **pero la IA cambia la cara aunque se le pida que no** (Naza lo notó). Solución que aprobó: pegar encima los píxeles de la foto original (silueta con OpenCV GrabCut + máscara suave) y dejar la IA solo en el fondo nuevo. Regla para la fábrica: **la cara del narrador nunca sale de la IA**.
- **Ojo con la medida:** la calculadora dio 399,6 × 280, pero la plantilla real de la vista previa de cubierta mide **401,6 × 280** (corte 361,6 × 240; el resumen del libro dice «Mediano 2 (170 × 240)»). Bookmundo estira la imagen para que entre. Usar siempre la medida de la vista previa y el lomo negro 1 mm más ancho de cada lado.
- **Color:** Bookmundo contó 84 de 88 páginas en color, porque el acento rojo del diseño (folios, cabeceras, cruces) está en casi todas. Unos €0,02 por página. Si se quiere solo color en fotos, pasar el acento a gris.
- **GPSR:** Bookmundo agrega una página legal al final (89). No cambia nada.
