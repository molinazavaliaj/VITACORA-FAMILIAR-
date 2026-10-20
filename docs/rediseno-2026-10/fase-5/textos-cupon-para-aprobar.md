# Rasca y gana: textos del cupón (20/10/2026) — APROBADOS por Naza el 20/10

**Naza aprobó las tandas A, B, C y D enteras el 20/10** (falta el abogado; el catalán, pasarlo por Softcatalà). Las decisiones de negocio del final siguen abiertas.

Rama `rasca-y-gana`. Lo **aprobado** ya está en el código tal cual (tanda 1 textos 9 y 10, tanda 2, tanda 3 de
`textos-legales-nuevos.md`, y los arreglos de `respuesta-19-10.md` §1.6). Lo de abajo es lo que **no** estaba
escrito en ningún lado y hacía falta para que funcione. Todo está en castellano de tú (España); el vos y el
catalán van al final. Nada de esto se ve hasta que se prenda `RASCA_Y_GANA=1`.

Dónde vive cada texto: `web/src/app/_textos/cupon.ts` (popup, checkout, páginas, mails) y
`web/src/app/_textos/legal-cupon.ts` (bases y privacidad). Cada uno lleva su número (CU-NN) en el código.

Lo que viene de `respuesta-19-10.md` está marcado **(abogado)**: es la frase del análisis legal, solo pasada a
frases simples sin dos puntos. Igual lo tiene que aprobar Naza.

---

## Tanda A — El popup (10)

1. CU-01 · Botón para descubrir sin rascar **(abogado)**: «Rascar»
2. CU-01 · Ayuda debajo de la tarjeta: «Pasa el dedo o el ratón por la tarjeta, o toca Rascar.»
3. CU-02 · Las condiciones, a la vista antes de rascar **(abogado)**: «Vale 30 días desde que te llega. Solo el libro digital. Un uso por código. No se suma a otros cupones.»
4. CU-03 · **(abogado)**: «No es un sorteo. Todos reciben el mismo cupón.»
5. CU-04 · Etiqueta del campo: «Tu correo» (pista adentro: «nombre@correo.com»)
6. CU-05 · Quién lo da y para qué **(abogado, obligatorio por el art. 13 RGPD)**: «Lo da Vitácora Familiar, de {Joaquín Molina, NIF, domicilio}. Usamos tu correo para mandarte el cupón y, si lo aceptas, los recordatorios. Para ver o borrar tus datos, escribe a soporte@vitacorafamiliar.com.»
7. CU-06 · **(abogado)**: «Si tienes menos de 14 años, pide a un adulto que lo haga por ti.» (en /ar también 14: decidir si va otra edad)
8. CU-07 · Avisos: «Escribe un correo válido.» / «Marca la primera casilla para recibir el cupón.» / «No pudimos mandarlo. Intenta de nuevo en un rato.»
9. CU-08 · Después de tocar «Recibir mi cupón»: título «Revisa tu correo.» y «Te mandamos un mail a {correo}. Toca el botón del mail y te llega tu cupón.»
10. CU-01 · El botón de la X (lo lee el lector de pantalla): «Cerrar». Mientras envía: «Enviando…»

## Tanda B — El checkout y las páginas (10)

11. CU-09 · Arriba del campo: «¿Tienes un cupón?» · botón «Aplicar» (mientras revisa: «Revisando…») · después «Cupón {código} aplicado.» y botón «Quitar»
12. CU-10 · Si el código no existe: «Ese código no existe. Revisa que esté bien escrito.»
13. CU-10 · Sin confirmar: «Ese cupón todavía no está activo. Toca el botón del mail que te mandamos.»
14. CU-10 · «Ese cupón ya venció.» / «Ese cupón ya se usó.»
15. CU-10 · Otro país: «Ese cupón es de la web de otro país. Solo vale allí.»
16. CU-10 · Una compra sin libro digital: «El cupón es para el libro digital. Esta compra no lo lleva.» · Con promo: «El cupón no se suma a precios ya rebajados.»
17. CU-11 · Página del botón del mail: «Confirma tu correo» / «Toca el botón y te mandamos tu cupón.» / botón «Ver mi cupón»
18. CU-12 · Ya confirmado: «Tu cupón ya es tuyo» / «Tu código» / «Vale hasta el {fecha}, ese día incluido. Te lo mandamos también por mail.» / botón «Usar mi cupón»
19. CU-13 · Link vencido: «Este enlace ya no sirve. Pide el cupón otra vez desde la web y te mandamos uno nuevo.» · Ya usado o vencido: «Este cupón ya no se puede usar.»
20. CU-14 · Después de la baja: «Listo» / «No te vamos a mandar más recordatorios. Tu cupón sigue valiendo hasta su fecha.» · Link malo: «Este enlace no sirve. Escríbenos a soporte@vitacorafamiliar.com y te damos de baja a mano.» · «Volver a Vitácora»

## Tanda C — Los mails (10)

21. CU-15 · Mail de confirmar, asunto: «Confirma tu correo para recibir tu cupón» · arriba «CUPÓN DE BIENVENIDA»
22. CU-15 · Cuerpo: «Pediste el cupón de bienvenida de Vitácora. Toca el botón para confirmar que este correo es tuyo y te mandamos tu código.» · botón «Confirmar mi correo» · «Si no lo pediste tú, no hagas nada. No te vamos a escribir más.»
23. CU-15 · Pie: «Recibes este email porque alguien pidió el cupón con esta dirección el {fecha}.»
24. CU-16 · Mail del código, asunto: «Tu cupón de bienvenida de Vitácora» · título «Tu cupón de bienvenida» · «TU CÓDIGO» · «Vale hasta el {fecha}, ese día incluido.»
25. CU-16 · «Escríbelo al pagar y el descuento aparece en el total antes de confirmar. Es el 10 % del libro digital, también si compras el pack.» · botón «Usar mi cupón»
26. CU-16 · «El código es personal. Si lo compartes y alguien lo usa antes que tú, queda gastado.» · Solo si aceptó los recordatorios: «Te vamos a escribir hasta 4 veces para recordártelo. Si no quieres, date de baja con un clic.» · Pie: «Recibes este email porque pediste el cupón el {fecha}.»
27. CU-17 · Recordatorios, asuntos **(PUBLICIDAD en el asunto, abogado §1.5)**: 1 «Publicidad · Tu cupón de Vitácora sigue activo» · 2 «Publicidad · Tu 10 % del libro digital te espera» · 3 «Publicidad · Quedan pocos días de tu cupón» · 4 «Publicidad · Último aviso de tu cupón»
28. CU-17 · Arriba de cada recordatorio: «PUBLICIDAD · CUPÓN DE BIENVENIDA». Llevan el código, la fecha, el botón «Usar mi cupón» y «Es el recordatorio {n} de 4.»
29. CU-17 · Pie de los recordatorios: «Recibes este email porque pediste el cupón el {fecha} y aceptaste los recordatorios.»
30. CU-18 · En todos los mails del cupón, al pie **(abogado §1.5)**: «Te escribe Vitácora Familiar, de {Joaquín Molina, NIF, domicilio}.» · enlaces «Bases del cupón» · «Privacidad» · y en los recordatorios «No quiero más recordatorios»

## Tanda D — Bases, privacidad y los otros idiomas (6)

31. CU-21 · Bases, la bajada y la descripción de la página: «Un 10 % de descuento sobre el libro digital, para cada correo que lo pide.» / «Las condiciones del cupón de bienvenida de Vitácora.»
32. CU-21 · Los arreglos del abogado (§1.6) ya están puestos. Dos van sin dos puntos: «Un solo uso por código. El código es personal. Si lo compartes y alguien lo usa antes que tú, el cupón queda gastado.» y «No es un sorteo. No hay azar y todas las personas reciben el mismo cupón.» El #16 viejo («una sola vez por persona y por mail») salió porque el abogado dice que no se puede cumplir.
33. CU-24 · Privacidad, sección nueva «4 bis. El cupón de bienvenida» (texto entero en `legal-cupon.ts`): qué guardamos (correo, país, si aceptó los recordatorios, fecha, hora e IP), para qué y con qué derecho (el cupón porque lo pidió; los recordatorios con su consentimiento, que retira con la baja), cuánto (sin confirmar se borra a los 30 días; confirmado, 24 meses) y que los manda Resend.
34. CU-24 · Privacidad, dos retoques: en el punto 4, «No usamos tus datos … para publicidad» pasa a «para publicidad (salvo los recordatorios del cupón, si los pides, ver 4 bis)»; y en la tabla, Resend «Manda los correos: el código para entrar, los avisos y el cupón de bienvenida con sus recordatorios.»
35. CU-19 / CU-22 · Todo lo de arriba **de vos** para /ar (está en el código; mismo texto con vos).
36. CU-20 / CU-23 · Todo lo de arriba **en catalán** (borrador mío, falta pasarlo por Softcatalà).

---

## Decisiones de negocio que quedaron abiertas

- **Viaje, Kids y /regalar**: el cupón solo se puede usar en `/comprar` (el libro de una vida, también como regalo).
  La base #14 aprobada dice «cualquier Vitácora que se venda en la web». Hay que elegir: sumar el campo a Viaje y Kids
  (¿el 10 % de qué precio?) o cambiar el #14 a «el libro de una vida».
- **Con la promo global prendida** (`PROMO_PORCENTAJE`), el cupón no vale («ni a precios ya rebajados»).
- **El código tiene 6 letras** (VITACORA10-K7Q2XM), no 4: con 4 se adivina probando.
- **La edad en /ar**: puse 14 como en España.
- **El remitente de los recordatorios**: salen de hola@ salvo que se cargue `MAIL_REMITENTE_RECORDATORIOS`
  (el abogado recomienda separarlos de los avisos del pedido).
- **Borrado a los 6 meses si no abrió ningún mail** (lo propone el abogado): no está hecho, no medimos aperturas.
  La privacidad dice solo 24 meses.
