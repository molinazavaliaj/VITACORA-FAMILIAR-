# Guía de traducción al catalán — entrevista Vitácora (V3)

Producto: un "biógrafo" entrevista por WhatsApp a una persona mayor (60–90 años) para escribir el libro de su vida. Quien regala eligió que la entrevista sea en catalán. La persona contesta con audios. Los textos originales están en castellano rioplatense (vos) y ya fueron aprobados y probados: NO se tocan. Vos producís la versión catalana.

## Cómo traducir
- Catalán central (Barcelona/Cataluña), normativa IEC actual (2016: "soc", "os", "dona", "net"... sin diacríticos viejos). No valenciano ni balear.
- Tuteo ("tu"), cálido, cercano, simple, frases cortas como se habla. Que suene a una persona que escribe por WhatsApp, no a formulario ni a traducción.
- Traducción **adaptada, no literal**: si una frase no tiene sentido en catalán, se cambia en catalán para que lo tenga, manteniendo la intención (qué pide la pregunta, qué tono tiene).
- "Contar (una historia)" → "explicar" (nunca "contar", que en catalán es "comptar"). "Contame" → "explica'm".
- Evitá castellanismos y calcos: "anem per una altra" (calco de "vamos por otra") → "passem a una altra"; "vale" → "d'acord"; "bueno" → "bé"; "pues" → "doncs"; "apuntar/guardar" bien.
- Palabras locales rioplatenses → su equivalente natural en Cataluña: colimba / servicio militar → la mili; la barra (de amigos) → la colla; tus viejos → els teus pares; changa → una feineta; laburo → la feina; colectivo → l'autobús; liceo / secundaria → l'institut; primaria → l'escola; la maestra → la mestra; "el campo" → el camp / la pagesia (según contexto); asado → un dinar / una costellada (según contexto); mate → café o lo que corresponda, o se omite. Si algo es muy argentino/uruguayo (Malvinas, etc.), hacelo genérico ("el teu país", "la història del país") sin inventar hechos.
- Las personas pueden haber nacido en Cataluña o haber migrado; no supongas nada que el original no suponga.

## Marcas que hay que respetar (el código las reemplaza)
- `{{nombre}}`, `{{quien_regala}}`, `{{tema}}`, `{{etapa}}`: van igual, la misma cantidad de veces (podés moverlas de lugar).
- Género: `{{o/a}}` o `{{padre/madre}}` = forma masculina/femenina según el narrador. En catalán escribí la palabra entera con las dos formas: `{{tranquil/tranquil·la}}`, `{{nen/nena}}`, `{{orgullós/orgullosa}}`, `{{pare/mare}}`, `{{nascut/nascuda}}`. Formato: `{{masculino/femenino}}`, sin llaves ni barras dentro. Usalas cada vez que el catalán marque género del narrador (aunque el castellano no lo marcara).
- Variante: `«sino:X: texto A ‖ texto B»` — se queda con la misma X y la misma estructura; traducís A y B.
- `<br>` = salto de línea: mismos `<br>` en el mismo lugar.
- `_..._` = cursiva (M1, M31): mantenela.

## Botones (WhatsApp)
- Cada pregunta con botones los trae entre corchetes `[BOTONES: texto (vale) / ...]`. Traducí cada uno: **máximo 20 caracteres** (contando espacios), mismo orden, mismo sentido (sí / no / paso). Que se entienda solo, sin la pregunta.

## Formato de salida (archivo de texto plano, UTF-8)
Una línea por texto, sin tabla markdown, sin comentarios entre medio:
```
ID | texto en catalán
BOTON ID 1 | texto del botón 1
BOTON ID 2 | texto del botón 2
```
Todos los IDs del archivo de entrada, en el mismo orden, también los `[extra]` y los mensajes "sin uso". Después de la última línea, una línea `---` y abajo, en castellano, hasta 10 notas cortas de decisiones que tomaste (adaptaciones fuertes, palabras locales, dudas que convendría que mire un nativo).
