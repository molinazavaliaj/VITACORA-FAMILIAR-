# Programa de creadores — textos para aprobar (21/10)

Rama `creadores`. Diseño en `docs/superpowers/specs/2026-10-21-programa-creadores-design.md`.
Nada de esto se ve hasta `CREADORES=1` en Vercel.

Cada texto lleva su número (`CR-NN`), el mismo que tiene al lado en el código:
`web/src/app/_textos/colabora.ts` (página, formulario, checkout, mails y panel) y
`web/src/app/_textos/legal-creadores.ts` (condiciones). Abajo va la versión de España (tú),
la recomendada. La de Argentina (vos) es la misma pasada a vos y la catalana es la
traducción; las dos están en el mismo archivo y se cambian igual si cambia la de acá.
El catalán falta pasarlo por el corrector de Softcatalà.

Reglas que se cuidaron: sin dos puntos, sin oraciones que empiezan con «Y» después de
un punto, frases cortas, tú / vos / catalán, nunca usted, ningún porcentaje fijo en lo
público (la comisión y el descuento son de cada creador; solo los mails y el panel de UN
creador dicen los suyos) y no se promete cada cuánto se paga.

Los textos del panel de la empresa (`/admin/creadores`) no van acá: no los ve nadie de afuera.

---

## Tanda 1 — la página /colabora (arriba y cómo funciona) — ✅ APROBADA por Naza el 21/10

1. **CR-01 · Título de la pestaña y descripción para Google**
   «Colabora con Vitácora» · «Comparte Vitácora con tu comunidad y gana una comisión por cada venta con tu código.»
2. **CR-02 · El inicio (etiqueta, título en dos líneas y bajada)**
   «Colabora con Vitácora» · «Comparte Vitácora / con tu comunidad.» · «Si creas contenido y te gusta lo que hacemos, súmate. Te damos un código propio y cada venta con tu código te deja una comisión.»
3. **CR-03 · El botón del inicio** (baja al formulario)
   «Quiero colaborar»
4. **CR-04 · Las cuatro líneas con tilde debajo del botón**
   «Una comisión por cada venta» · «Un descuento para tu comunidad» · «Un panel para ver tus ventas» · «Lo revisamos personas»
5. **CR-05 · Cómo funciona, título y paso 1**
   «Cómo funciona» · **Te anotas** «Nos cuentas quién eres y dónde publicas. Leemos cada solicitud con calma.»
6. **CR-06 · Paso 2**
   **Te damos tu código** «Si encaja, te escribimos con tu código, tu link para compartir y tu panel.»
7. **CR-07 · Paso 3**
   **Lo compartes** «Cada venta con tu código te deja una comisión. Lo ves todo en tu panel.»
8. **CR-08 · El formulario, título y bajada** (hoja de papel, a la izquierda del formulario)
   «Cuéntanos de ti» · «Déjanos tus datos y te escribimos cuando lo revisemos.»
9. **CR-09 · Campos (1)**
   «Tu nombre» · «Tu correo» · «Dónde publicas» con «Elige una opción» y las opciones Instagram, TikTok, YouTube, «Otra»
10. **CR-10 · Campos (2)**
    «El link de tu perfil» (pista «instagram.com/tuperfil») · «Cuántas personas te siguen (si quieres)» (pista «Por ejemplo, 5.000»)

## Tanda 2 — el formulario, el checkout y el mail «lo recibimos» — ✅ APROBADA por Naza el 21/10

11. **CR-11 · Campo libre**
    «Algo que quieras contarnos (si quieres)» (pista «Qué publicas, a quién le hablas…»)
12. **CR-12 · La casilla obligatoria** (con dos enlaces, a las condiciones y a la privacidad; este texto exacto se guarda como prueba de que aceptó) — debajo va otra casilla, la de mayor de 18 (CR-26, tanda 6)
    «He leído y acepto las [condiciones del programa] y la [privacidad].»
13. **CR-13 · El botón**
    «Enviar» · mientras manda, «Enviando…»
14. **CR-14 · Errores del formulario**
    «Faltan datos. Revisa los campos obligatorios.» · «Escribe un correo válido.» · «Escribe el link de tu perfil o tu usuario con @.» · «Marca la casilla para aceptar las condiciones.» · «No pudimos enviarlo. Prueba de nuevo o escríbenos a hola@vitacorafamiliar.com.»
15. **CR-15 · Lo que aparece en lugar del formulario cuando sale**
    «¡Gracias! Lo recibimos.» · «Leemos cada solicitud con calma. Te escribimos a tu correo cuando la revisemos.»
    (Sale igual aunque el correo ya estuviera anotado: así nadie averigua quién se anotó.)
16. **CR-16 · El código en el checkout** (mismo casillero que el cupón del rasca)
    Debajo del casillero, al aplicarlo: «Código LUCIA aplicado.»
    La línea del resumen, y la que ve la persona en Stripe o Mercado Pago, con el % de ESE creador: «Código LUCIA · 10 % del libro digital»
    Si el creador no da descuento no hay línea, solo el aviso. Si el código no sirve se usan los mensajes del cupón que ya están aprobados («Ese código no existe. Revisa que esté bien escrito.»).
    ⚠️ El casillero sigue mostrando la pista «VITACORA10-…» (del rasca). Con el rasca apagado y los creadores prendidos queda raro: decidir si se cambia por algo neutro.
17. **CR-17 · El pie de los dos mails al creador**
    Etiqueta de arriba «COLABORA CON VITÁCORA» · «Recibes este email porque te anotaste en el programa de creadores de Vitácora el 21 de octubre de 2026.» · enlaces «Condiciones del programa» y «Privacidad»
18. **CR-18 · Mail «lo recibimos»** (al anotarse; solo si el correo es nuevo)
    Asunto «Recibimos tu solicitud para colaborar con Vitácora» · vista previa «Te escribimos cuando la revisemos.» · título «Lo recibimos»
    «Gracias por querer sumarte. Leemos cada solicitud con calma. Te escribimos a este correo cuando la revisemos.»
    «Si no te anotaste tú, escríbenos y borramos tus datos.»
19. **CR-19 · Mail de bienvenida (1)** (cuando lo aprueban los socios)
    Asunto «Ya eres parte de Vitácora. Este es tu código» · vista previa «Tu código, tu link para compartir y tu panel.» · título «Ya eres parte de Vitácora»
    «Revisamos tu solicitud y nos encantaría trabajar contigo.» · recuadro «TU CÓDIGO» con el código grande
20. **CR-20 · Mail de bienvenida (2)** (con los números de ESE creador)
    En el recuadro «Con tu código, tu comunidad tiene un 10 % de descuento en el libro digital.» (sin descuento: «Tu código no lleva descuento. Cada venta con tu código cuenta igual.»)
    «Por cada venta con tu código te queda un 20 % de lo que pagó la persona.»
    «Comparte este link. Quien entra por él ya tiene tu código puesto.» + el link
    «En tu panel ves tus ventas y lo que te toca cobrar. Es privado, no lo compartas.» · botón «Ver mi panel»

## Tanda 3 — el panel del creador (/creador/…) — ✅ APROBADA por Naza el 21/10

21. **CR-21 · Arriba**
    «Hola, Lucía» · «Tu código» · «Tu link para compartir» con el botón «Copiar» (al tocarlo, «Copiado»)
22. **CR-22 · Debajo del código** (con los números de ese creador)
    «Tu comunidad tiene un 10 % de descuento en el libro digital.» (sin descuento: «Tu código no lleva descuento. Cada venta cuenta igual.») · «Te queda un 20 % de cada venta.»
23. **CR-23 · Si está en pausa**
    «Tu código está en pausa. Por ahora no suma ventas nuevas. Si tienes dudas, escríbenos.»
24. **CR-24 · Las ventas** (solo fecha, comisión y estado: ningún dato de quien compró) — se suma el estado «En espera» (CR-27, tanda 6)
    «Tus ventas» · columnas «Fecha», «Comisión», «Estado» · estados «Por cobrar» y «Cobrada» · sin ventas «Todavía no hay ventas con tu código. Cuando alguien compre, aparece aquí.»
25. **CR-25 · Totales y pie** — se suma un tercer total «En espera» y la línea de la espera (CR-27, tanda 6)
    «Por cobrar» · «Cobrado» · «Te pagamos por transferencia. Cuando toque, te escribimos para pedirte los datos.» · enlace «Condiciones del programa»

---

## Tanda 4 — las condiciones (/legal/creadores), del 1 al 10 — ✅ APROBADA por Naza el 21/10 (en la forma; falta el abogado)

> ⚠️ **PENDIENTE DEL ABOGADO.** Es un borrador para que Naza lo apruebe en lo de forma; el
> contenido lo tiene que mirar el abogado antes de prender `CREADORES=1`. Puntos para él:
> relación con el creador (no es empleo ni agencia), facturación e impuestos en España y
> en Argentina, la obligación del creador de avisar que es publicidad (en España, Ley
> General de Publicidad y el código de influencers de Autocontrol), devoluciones de una
> comisión ya pagada, y si hace falta sumar a la política de privacidad una sección para
> los creadores (hoy la privacidad no los nombra; la condición CR-L12 dice qué datos guardamos).
> La página no está en las solapas de los legales: se llega desde el formulario y los mails.

1. **CR-L01 · Título, bajada y descripción**
   «Condiciones del programa de creadores» · «Cómo funciona colaborar con Vitácora con tu propio código.» · «Las condiciones del programa de creadores de Vitácora.»
2. **CR-L02 · Quién lo organiza**
   «El programa lo organiza Vitácora Familiar, {titular}.» (en España el titular de España; en `/ar` el de Argentina)
3. **CR-L03 · Qué es**
   «Te damos un código propio para compartir con tu comunidad. Cada compra pagada en la web con tu código te deja una comisión.»
   «Tu código también puede darle un descuento a quien compra. El descuento es sobre el libro digital, también si va dentro del pack.»
4. **CR-L04 · Cómo entras**
   «Te anotas en la web y revisamos cada solicitud a mano. Podemos decir que no. Si decimos que sí, te mandamos por correo tu código, tu link para compartir y el link a tu panel.»
5. **CR-L05 · La comisión y el descuento**
   «La comisión y el descuento son de cada creador. Te los decimos en el correo de bienvenida y los ves en tu panel.»
   «Podemos cambiarlos más adelante. Las ventas que ya se hicieron no cambian.»
   (No promete avisar por mail cuando cambian: el panel de la empresa no manda nada al cambiarlos.)
6. **CR-L06 · Cómo se calcula** — ⚠️ REEMPLAZADO en la tanda 6 (sale «Cuenta cuando el pago entra», entran los 14 días de espera)
   «La comisión se calcula sobre lo que la persona pagó de verdad, con el descuento ya aplicado. Cuenta cuando el pago entra.»
   «Una venta es una compra pagada en la web con tu código escrito en el casillero del código, o entrando por tu link.»
7. **CR-L07 · Dónde vale**
   «Tu código vale al comprar en la web, donde aparece el casillero del código. No se suma a otros cupones ni a precios ya rebajados. Va un solo código por compra.»
8. **CR-L08 · Si se devuelve una compra** — ⚠️ REEMPLAZADO en la tanda 6
   «Si se devuelve una compra hecha con tu código, su comisión se anula.»
9. **CR-L09 · Cómo te pagamos** — ⚠️ el primer párrafo se REEMPLAZA en la tanda 6 (suma la factura)
   «Te pagamos por transferencia lo que tengas por cobrar. Cuando toque, te escribimos para pedirte los datos. No guardamos tus datos bancarios en la web.»
   «Los impuestos que correspondan por lo que cobras son tuyos.»
10. **CR-L10 · Cómo lo compartes** — ⚠️ el primer párrafo se REEMPLAZA en la tanda 6 (decir que es publicidad)
    «Habla de Vitácora con tus palabras y con honestidad. Di que es una colaboración y que ganas una comisión con tu código.»
    «No prometas cosas que Vitácora no hace. No uses publicidad pagada con nuestro nombre sin hablarlo antes con nosotros.»
## Tanda 5 — las condiciones, del 11 al 13 — ✅ APROBADA por Naza el 21/10 (en la forma; falta el abogado)

11. **CR-L11 · Si quieres dejarlo**
    «Puedes dejar el programa cuando quieras. Nos escribes a soporte@vitacorafamiliar.com y listo.»
    «Podemos pausar o cerrar tu código si no se cumplen estas condiciones. Lo que ya tengas por cobrar te lo pagamos igual.»
12. **CR-L12 · Tus datos** — se suma un párrafo en la tanda 6 (cuánto guardamos los datos)
    «Guardamos tu nombre, tu correo, dónde publicas, tu perfil y lo que nos cuentes. También la fecha, la hora y la dirección IP de cuando te anotaste. Los usamos solo para el programa.»
    «Tu panel no muestra ningún dato de quien compra. Para borrar tus datos, escríbenos a soporte@vitacorafamiliar.com.»
13. **CR-L13 · Cambios**
    «Si cambiamos estas condiciones, te lo contamos por correo antes de que valgan.»
    (Es una promesa: si se cambian, hay que mandar el mail a mano a los creadores activos.)

---

## Tanda 6 — cambios legales (21/10) — ⏳ PENDIENTE del OK de Naza

> Salen de la revisión legal que Naza aprobó el 21/10. Lo de las condiciones (CR-L) sigue
> **pendiente del abogado** antes de prender `CREADORES=1`. Va la versión de España (tú),
> la recomendada; la de Argentina es la misma pasada a vos y la catalana su traducción, en
> los mismos archivos. En el código cada uno lleva `PENDIENTE OK de Naza (tanda 6)`.
> Comportamiento nuevo que acompaña a estos textos: cada comisión queda 14 días en espera
> antes de poder pagarse, la casilla de mayor de 18 es obligatoria y el alta de Argentina
> (`/ar/colabora`) queda cerrada por ahora (los textos de Argentina siguen en su lugar).

**El formulario y el panel** (`web/src/app/_textos/colabora.ts`)

1. **CR-26 · La casilla de mayor de 18** (en /colabora, debajo de la de las condiciones; obligatoria, y su texto exacto también se guarda como prueba)
   «Soy mayor de 18 años.» · si no la marca, «Marca la casilla para confirmar que eres mayor de 18 años.»
2. **CR-27 · La espera de 14 días en el panel del creador** (/creador/…)
   Estado de una venta «En espera» (al lado de «Por cobrar» y «Cobrada») · un tercer total «En espera» (al lado de «Por cobrar» y «Cobrado») · debajo de la tabla, antes de «Te pagamos por transferencia…», «Cada comisión queda en espera 14 días desde la compra. Después pasa a por cobrar.»

**Las condiciones** (`/legal/creadores`, `web/src/app/_textos/legal-creadores.ts`)

3. **CR-L14 · Qué relación tenemos** (nueva, después de «Qué es»)
   «Colaborar con Vitácora no es un trabajo ni te hace agente nuestro. Recomiendas Vitácora por tu cuenta y sin exclusividad. No vendes ni negocias nada en nuestro nombre.»
4. **CR-L16 · Quién puede participar** (nueva, después de «Qué relación tenemos»)
   «Para sumarte tienes que ser mayor de 18 años.»
5. **CR-L06 · Cómo se calcula** (reemplaza a la de la tanda 4)
   «La comisión se calcula sobre lo que la persona pagó de verdad, con el descuento ya aplicado.»
   «Cada comisión queda en espera 14 días desde la compra. Pasado ese tiempo pasa a por cobrar.»
   «Una venta es una compra pagada en la web con tu código escrito en el casillero del código, o entrando por tu link.» (sin cambios)
6. **CR-L15 · Tus propias compras** (nueva, después de «Dónde vale»)
   «Las compras que hagas tú con tu propio código no te dejan comisión.»
   (No hay detección automática: si aparece una, los socios la anulan desde `/admin/creadores`.)
7. **CR-L08 · Si se devuelve una compra** (reemplaza a la de la tanda 4)
   «Si una compra hecha con tu código se devuelve en esos 14 días, su comisión no cuenta. Si se devuelve después, la descontamos de lo que tengas por cobrar.»
8. **CR-L09 · Cómo te pagamos** (cambia el primer párrafo)
   «Te pagamos por transferencia lo que tengas por cobrar. Cuando toque, te escribimos para pedirte los datos y la factura que corresponda en tu país. No guardamos tus datos bancarios en la web.»
   «Los impuestos que correspondan por lo que cobras son tuyos.» (sin cambios)
9. **CR-L10 · Cómo lo compartes** (cambia el primer párrafo)
   «Cada vez que hables de Vitácora, di que es publicidad desde el principio y que se vea bien, con #publi o «colaboración pagada». Vale también si la Vitácora te la regalamos nosotros.»
   «No prometas cosas que Vitácora no hace. No uses publicidad pagada con nuestro nombre sin hablarlo antes con nosotros.» (sin cambios)
10. **CR-L12 · Tus datos** (se suma un párrafo, después del primero)
    «Guardamos tus datos mientras estés en el programa. Después, solo lo que pide la ley para la contabilidad, durante 6 años.»

**La privacidad** (`/legal/privacidad`, solo con `CREADORES=1`; `privacidadConCreadores` en `legal-creadores.ts`)

11. **CR-L17 · Programa de creadores** (sección nueva, «4 bis» después de «4. Para qué los usamos», o «4 ter» si ya está el «4 bis» del cupón)
    Título «Programa de creadores» · «Si te anotas como creador, tratamos tu nombre, tu correo, dónde publicas, tu perfil y lo que nos cuentes para gestionar el programa y pagarte las comisiones. Lo hacemos porque lo pides al anotarte. Guardamos tus datos mientras estés en el programa y después 6 años por la contabilidad. Puedes pedirnos verlos, corregirlos o borrarlos en soporte@vitacorafamiliar.com.»

**Lo que no cambió y se revisó por si quedaba mintiendo:** el pie del panel («Te pagamos por
transferencia. Cuando toque, te escribimos para pedirte los datos.») sigue siendo cierto y no
se tocó; si Naza quiere que nombre la factura como CR-L09, es un cambio de una línea. La
página /colabora, los mails y el resto de las condiciones no hablan de cuándo cuenta una
comisión ni de Argentina, así que no cambian.
