# Textos a aprobar: legales (fase 5)

Todo lo que no es copia del texto legal anterior. Aprueban **Naza y el abogado**. Las versiones en
catalán están en `web/src/app/_textos/legal.ts` (PENDIENTE REVISIÓN NATIVA Y ABOGADO). Los cambios
dentro del texto legal están en `para-el-abogado.md` §2.

## «En corto» (resumen nuevo de lo que ya dice el texto; ningún compromiso nuevo)

| Página | es (tú) | ar (vos) | Sale de |
|---|---|---|---|
| Términos | Pago único, por adelantado. Sin suscripción y sin renovación automática. | igual | §3 |
| Términos | La entrevista es por WhatsApp, con audios, al ritmo del narrador. Nada empieza sin su permiso: si no acepta, te devolvemos el dinero completo. | igual | §2, §4, §5 |
| Términos | Antes de cerrar el libro lo revisas tú. Lo que se imprime es lo que apruebas. | …lo revisás vos. …lo que aprobás. | §5, §11 |
| Términos | Puedes desistir: 14 días naturales en España, 10 días corridos en Argentina. | Podés arrepentirte: 10 días corridos en Argentina, 14 días naturales en España. | §6 |
| Términos | La historia, los audios y la voz son de tu familia. Nunca los publicamos. | igual | §9 |
| Privacidad | Usamos tus datos y los de tu familia solo para hacer el libro. | igual | §4 |
| Privacidad | No los vendemos, no los usamos para publicidad y no entrenamos ningún modelo de inteligencia artificial con ellos. | igual | §4 |
| Privacidad | Los audios originales se borran en cuanto tú o el narrador lo pidan. | …vos o el narrador… | §7 |
| Privacidad | Solo usamos cookies técnicas: ni de publicidad ni de analítica. | igual | §12 |
| Privacidad | Para cualquier cosa sobre tus datos, basta un correo a hola@… | …alcanza un correo… | §1 |
| Desistimiento | Se pide con un correo. No hace falta que expliques por qué. | igual | «Cómo se hace» |
| Desistimiento | Te confirmamos que lo recibimos dentro de las 24 horas y te devolvemos el dinero por el mismo medio con el que pagaste, en 14 días como máximo. | igual | «Qué pasa después» |
| Desistimiento | España: 14 días naturales desde la compra. Argentina: 10 días corridos, sin costo. | Argentina: 10 días corridos desde la compra, sin costo. España: 14 días naturales. | «Plazos» |

## Rótulos de la página

| Dónde | es | ar | ca | Sale de |
|---|---|---|---|---|
| Etiqueta del resumen | En corto | En corto | En resum | maqueta Legal |
| Índice | En esta página | En esta página | En aquesta pàgina | nuevo |
| Nombre del grupo de solapas (lector de pantalla) | Textos legales | Textos legales | Textos legals | nuevo |
| Título de la página de desistimiento | Desistimiento | Botón de arrepentimiento | Desistiment | pie aprobado (fase 1) |
| Botón del correo | Quiero desistir de mi compra | Quiero arrepentirme de mi compra (como antes) | Vull desistir de la meva compra | adaptado del anterior |
| Asunto del correo | Desistimiento de compra | Arrepentimiento de compra (como antes) | Desistiment de compra | adaptado del anterior |
| Bajada de desistimiento | Si te arrepientes de la compra, esto es todo lo que hay que hacer. | Si te arrepentiste de la compra… (como antes) | Si et fas enrere de la compra, això és tot el que cal fer. | adaptado del anterior |
| Sección nueva | 7. La garantía de cada libro | igual | 7. La garantia de cada llibre | nuevo (D1) |
| Intro de la garantía | Además de lo anterior, cada libro tiene su garantía: | igual | A més del que s'ha dit, cada llibre té la seva garantia: | nuevo |
| Nombres de línea | Familiar (el libro de otra persona) · De viaje · Para ti (tu propio libro) | …Para vos (tu propio libro) | Familiar (el llibre d'una altra persona) · De viatge · Per a tu (el teu propi llibre) | nuevo |

## Diferencias entre checkout, FAQ y legales (no se tocaron textos aprobados: para decidir)

1. **Catalán, FAQ vs checkout**: la FAQ de la portada dice «Si no ho vol fer, **et tornem** els
   diners» y el checkout «Si no ho vol fer, **et retornem** els diners». Los legales usan el del
   checkout. Elegir uno (lo decide la revisión nativa) y cambiar el otro.
2. **La FAQ y el checkout no dicen** «si ya ha empezado a contestar, el libro se cierra con lo que
   haya, sin devolución»; los legales sí (D1). Y los legales además dicen «menos de diez respuestas →
   devolución completa» (ver `para-el-abogado.md` §1).
3. **Checkout de España**: la letra pequeña habla del desistimiento («sin esperar los 14 días…; se
   descuenta la parte ya hecha») y después dice la garantía; en **Argentina** la letra pequeña no
   menciona el arrepentimiento de 10 días. Coherente con los legales, pero distinto entre países.
4. **El enlace «términos» del checkout y de /regalar** va siempre a `/legal/terminos` (castellano de
   España), también desde `/ca/comprar` y `/ar/comprar` (`comprar/formulario.tsx:578`,
   `comprar/viaje/formulario.tsx:346`, `regalar/formulario.tsx:298`). Debería ir a
   `ruta(idioma, "/legal/terminos")`. No se cambió aquí para no pisar la fase del checkout.
5. En catalán el checkout dice «les **condicions**» y el pie «**Termes**»; la página se titula
   «Termes del servei». Unificar.
