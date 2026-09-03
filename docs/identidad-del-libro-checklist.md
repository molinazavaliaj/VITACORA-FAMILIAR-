# Identidad visual del libro — checklist para la sesión de diseño

> Sesión pendiente, con los dos socios en Discord. Este documento junta las decisiones a
> tomar para que un libro de Vitácora Familiar se reconozca a tres metros de distancia.
>
> **DOS direcciones candidatas — se decide en la sesión viendo maquetas de ambas:**
>
> **A. "Templo escondido"** (primera intuición): objeto atemporal y artesanal, solemnidad
> cálida; libro encontrado en una biblioteca antigua. Refs: grabados, exlibris, marcos
> ornamentales, dorados sutiles. Pinterest: `folio society book design`, `vintage book
> cover ornate`, `illuminated letter`.
>
> **B. "El abuelo tenía toda la onda"** (pivote de Naza mirando refs): editorial/fashion —
> la vida tratada como Vogue trata a una leyenda. Tipografía grande, mucho aire, fotos
> protagonistas, dignidad con estilo. El libro que Martina fotografía para Instagram.
> Refs Pinterest: `editorial book design modern`, `kinfolk magazine layout`, `coffee
> table book design`, `fashion lookbook layout`, `duotone photography book`.

## 💡 Feature acoplada a la dirección B (backlog v1.1, post-pilotos): las fotos de la familia

- Martina sube una carpeta de fotos desde la web (nueva sección del tablero).
- Cada capítulo abre con una foto de esa época; fotos intercaladas en las páginas.
- Curaduría: Martina etiqueta cada foto por etapa de vida (o la IA sugiere el capítulo).
- Diseño tolerante a calidad despareja (scans viejos, fotos comprimidas de WhatsApp):
  tratamiento uniforme (duotono/B&N elegante) que empareja todo y da identidad.
- Duplica el valor percibido de los 49€: de "libro" a objeto editorial de una vida.

## La marca dentro del libro

- [ ] **Logo/símbolo de Vitácora Familiar** (aparece en portada chica, lomo y colofón).
- [ ] **El ornamento propio** (idea de Naza): la "manera de subrayar los títulos" es una
      ilustración específica nuestra — un trazo/viñeta que se repite bajo cada título de
      capítulo y en los separadores de escena (hoy son `---`). Es LA firma silenciosa:
      quien vio dos libros la reconoce. Decidir: ¿un solo ornamento siempre, o una familia
      de variantes (una por capítulo)?
- [ ] **Colofón final**: página de cierre tipo "Este libro fue contado por ___ y guardado
      para siempre por Vitácora Familiar" + logo + año. El sello del templo.

## Tipografía

- [ ] **Tipografía de TÍTULOS** (la de la marca — con carácter, algo de cuento serio).
- [ ] **Tipografía de CUERPO** (serif cálida y muy legible para ojos grandes; hoy Georgia
      de relleno — elegir la definitiva y embeberla en la fábrica, sin depender de red).
- [ ] Jerarquías: capítulo / subtítulo / cita destacada / "Sus frases" / muletillas.
- [ ] **Capitulares**: ¿letra capital ilustrada al inicio de cada capítulo? (muy templo).

## La portada (sistema, no diseño único)

- [ ] Composición fija reconocible: la foto del narrador (¿en qué marco? ¿ventana oval,
      marco de grabado?), nombre grande, años ("1952—"), y el subtítulo de la casa
      ("La historia de una vida" — ¿fijo o personalizable?).
- [ ] **Paleta**: ¿color único de marca, o familia de colores que elige la familia
      (tapa vino / azul noche / verde bosque) con el mismo layout?
- [ ] Textura de fondo (tela, papel viejo, liso).

## Contratapa y lomo

- [ ] **Contratapa** (idea a validar): UNA sola frase del propio narrador, elegida por el
      editor entre "Sus frases", en grande. Cada contratapa es única y es de él.
      + texto breve fijo de la casa + logo.
- [ ] **Lomo** (para la impresión física, fase 2): nombre + ornamento + logo. Pensado
      para que una fila de Vitácoras en una biblioteca familiar se vea como colección.

## Interior — páginas especiales

- [ ] Portadilla (página 1 interior) y página de dedicatoria.
- [ ] Índice estilizado (con el ornamento).
- [ ] "Sus frases": diseño propio (¿tipografía manuscrita para las frases? ¿una por página?).
- [ ] "Los saludos de la familia": diseño con los nombres y vínculos.
- [ ] **Página del audiolibro** (reservar desde ya): "Este libro se escucha con su voz" +
      QR al audiolibro. Es el puente al cuadro NFC de fase 2.
- [ ] Foliado (números de página), encabezados, márgenes de imprenta A5, sangrías.
- [ ] Las citas destacadas (los blockquotes): estilo definitivo con el ornamento.

## Coherencia de marca completa

- [ ] Que la web, los mails y el libro hablen el mismo idioma visual (hoy la web es
      neutra-limpia y el libro va a ser templo-cálido: definir el puente).
- [ ] Versión digital (PDF con color) vs. impresa (¿interior B/N? costos de imprenta).

## Cómo se trabaja la sesión

1. Con este checklist, Claude arma **2-3 direcciones visuales completas en maquetas**
   (portada + página de capítulo + "Sus frases" + colofón de cada dirección).
2. Los socios eligen y mezclan en vivo (Discord).
3. La dirección ganadora se implementa en `fabrica/src/libro/plantilla-html.ts` y se
   valida regenerando el libro de Osvaldo (los borradores de texto se guardan — regenerar
   solo el PDF no paga IA de nuevo si se conservan).
