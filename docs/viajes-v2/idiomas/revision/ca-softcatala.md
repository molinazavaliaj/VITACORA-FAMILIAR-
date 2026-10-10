# Revisión de banco-ca.md con el corrector de Softcatalà

Fecha: 05/10/2026. Corrector: API de Softcatalà (`https://api.softcatala.org/corrector/v2/check`, `language=ca`, LanguageTool con normativa IEC). Se pasaron los 87 textos de `banco-ca.md`, uno por llamada (las notas después de `---` no). Las marcas se reemplazaron por ejemplos: {{nombre}} → Laia, {{quien_regala}} → Jordi, {{formato}} → un llibre imprès, {{fotos_album}} → 20, {{fotos_mandadas}} → 23, {{pregunta}} → Què vas menjar?; en la plantilla, {{1}} → Laia, {{2}} → Què vas menjar?, y los `<br>` → salto de línea.

Resultado: 9 avisos, 1 real.

| ID | Aviso del corrector | Fragmento | Sugerencia | ¿Real o falso positivo? |
|---|---|---|---|---|
| BIEN-2 | Cal apostrofar. | si canvies de país i **et arriba** a deshora | t'arriba | **Real.** El pronombre "et" se apostrofa delante de vocal: "i t'arriba a deshora". |
| NO8 | Si no és un títol, falta un punt al final de la frase. | …cansament o gana, el que **sigui** | sigui. | Falso positivo. Las puertas (NO) van sin punto a propósito: se pegan al cierre F (", i a partir d'aquí…"). |
| MD2 | Probablement no s'ha d'accentuar (què). | si vols explica'm en un àudio **què** és | que | Falso positivo. Es interrogativa indirecta ("quina cosa és"): "què" lleva acento. |
| MD8 | Probablement no s'ha d'accentuar (què). | Explica'm en una frase **què** et toca ara | que | Falso positivo. Interrogativa indirecta ("quina cosa et toca"): el acento está bien. |
| DES | Reviseu la construcció de relatiu. | fer el llibre amb **el que** m'has donat | el qual, què, qui | Falso positivo. "El que" con valor neutro (= "allò que") lo admite la gramática del IEC. Si se quiere lo más formal: "amb allò que m'has donat", pero no hace falta. |
| FORMATO-impreso | Aquesta frase no comença amb majúscula. | **un** llibre imprès | Un | Falso positivo. Es un fragmento que se inserta en medio de BIEN-1 y BIEN-1R, va en minúscula. |
| FORMATO-pdf | Aquesta frase no comença amb majúscula. | **un** llibre en PDF | Un | Falso positivo. Mismo caso que FORMATO-impreso. |
| PLANTILLA-mensaje | Possible error ortogràfic. | la teva **Vitácora** de Viaje | Bitàcola | Falso positivo. Es el nombre de la marca (ver nota 8 de banco-ca.md: falta decidir si va "Vitácora de Viatge"). |
| PLANTILLA-mensaje | Possible error ortogràfic. | Vitácora de **Viaje** | Vieja | Falso positivo. Mismo caso: nombre de marca. |

Nota técnica: la API de Softcatalà limita a 30 llamadas por minuto. La primera tanda se cortó en F4; los textos desde F4 en adelante se volvieron a pasar por Softcatalà con 2,5 segundos entre llamadas, así que todos los resultados de esta tabla son de Softcatalà.
