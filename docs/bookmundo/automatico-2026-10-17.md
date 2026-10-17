# Bookmundo tapa dura: lo que hace la fábrica sola (17/10/2026)

La receta del libro de Imma (`receta-imprenta.md`, en la carpeta principal) pasada a código en
`fabrica/src/libro/bookmundo/`. Probado con el libro de Imma: sale igual que el armado a mano
(88 págs, 168×240 exacto, 9 fuentes TrueType incrustadas, texto a 21,2 mm del lomo, QR leído del PNG).

## Cuándo sale

- **Al entregar el libro** (escritor V3, `libro-v3.ts`): después de dejar el pedido `entregado`.
- **Cuando la familia confirma las frases** (`imprenta.ts`): se rehace con «Su voz» adentro.
- **A mano**, desde una carpeta: `npx tsx scripts/bookmundo/armar-carpeta.ts <carpeta> [salida]`
  (ver el encabezado del script para el `datos.json`).

Nunca frena la entrega: si falla, queda en el log y el libro de la familia sale igual.

## Qué deja (Storage, bucket `audios`, carpeta `{narrador}/bookmundo/`)

| Archivo | Qué es |
|---|---|
| `interior-168x240.pdf` | El interior para subir |
| `cubierta.png` | La cubierta, 300 ppp, para la plantilla FullEmpty |
| `cubierta-GUIAS-no-subir.png` | La misma con corte, lomo y zona segura dibujados: para mirar |
| `informe.txt` | La verificación de los dos, y los datos para el pedido |

## Interior (modo `imprenta` de `plantilla-html.ts`)

Portadilla + blanca · capítulos siempre en impar · márgenes en espejo (21,6 mm del lomo, 19,3 del corte) ·
riel del lado del corte · cruces a 16 mm del lomo y 12,6 del corte · círculos reflejados en las pares ·
fondo blanco (papel crema), sin grano · **todo en grises puros salvo las fotos** (Naza 17/10: Bookmundo no deja
elegir páginas, solo «color» o «blanco y negro» para todo el interior; con color cuenta sola cada página con
algo de color y cobra ≈ €0,02 c/u; el acento rojo daba 84 de 88, en gris quedan solo las fotos: 5 en Imma) · TrueType estáticas incrustadas (`fabrica/fuentes-imprenta/`) ·
notas rayadas hasta 88 · colofón en la última. El MediaBox se corrige a 476,22 × 680,31 pt (Chromium daba 167,9 × 239,9 mm).
El libro de pantalla no cambia.

## Cubierta (`bookmundo/cubierta.ts`)

Medida de la vista previa real (401,6 × 280 con 88 págs; la calculadora dice 399,6 y está mal): cada tapa
= ancho + 8. Lomo interpolado de lo medido en la calculadora. Lomo negro 1 mm más ancho por lado. Texto en
el lomo solo desde 6 mm. QR vectorial a su voz (`urlVozDeNarrador`), leído de vuelta del PNG con jsQR.
PNG con pHYs de 300 ppp. La foto de tapa va **tal cual** la subió la familia: la cara nunca sale de una IA.

## Verificación (`bookmundo/verificar.ts`)

Abre el PDF con pdf.js dentro de Chromium (anda en Railway, sin Python). Mide: páginas (≥ 88 y par),
tamaño de cada página, fuentes (incrustadas, ninguna Type 3), texto a ≥ 20 mm del lomo, tinta oscura a
≥ 15 mm del lomo y ≥ 10 del corte, adornos claros a ≥ 10 del lomo, fotos (< 200 ppp frena, 200–250 avisa),
enlaces, páginas en color (y dice qué elegir en Bookmundo: COLOR si hay fotos en color, si no BLANCO Y NEGRO), peso. La cubierta: píxeles exactos, 300 ppp, QR que lleva a su voz, foto de tapa
(misma regla de ppp).

## Lo que sigue siendo a mano

- **Subir a Bookmundo y pedir**: no tienen API. Bajar los 3 archivos, leer `informe.txt`, subir, comparar
  la medida de la vista previa con la de la cubierta, declarar IA.
- **Foto de tapa chica** (la de Imma daba 156 ppp): el informe frena. Se resuelve a mano (foto más grande,
  o extender el fondo con IA y pegar encima los píxeles originales de la persona).
- **Fotos por capítulo en la V3**: la V3 no sabe a qué capítulo va cada foto; hoy salen solo en libros viejos
  o desde la carpeta local (`datos.json → fotos`).
- **Aviso**: nadie recibe un mail cuando los archivos están listos; se miran en Storage.
