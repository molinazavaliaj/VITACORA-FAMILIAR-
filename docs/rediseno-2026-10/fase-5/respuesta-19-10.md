# Respuesta: textos legales web nueva (fase 5)

**Para:** Vitácora Familiar / Vitácora de Viaje
**Fecha:** 19 de octubre de 2026
**Sobre:** `para-el-abogado.md` (partes 6 y 7) y `textos-legales-nuevos.md` (21 textos)

---

## Resumen en una tabla

| Punto | Veredicto |
|---|---|
| 1. Rasca y gana + 4 mails | **Se puede hacer.** 6 cambios antes de programarlo. Ninguno es de fondo: son de diseño del popup y de las bases. |
| 2. Garantía en una sola regla | **La dirección es correcta, la redacción actual tiene un punto nulo de pleno derecho.** Con la redacción de abajo se arregla sin perder nada. |
| 3. Cookies sin banner | **Confirmado: no hace falta banner.** Con 3 condiciones, una de ellas sobre la cookie de idioma. |
| 4. Catalán / Argentina | **Catalán: sí hay obligación y es más amplia de lo que pensáis.** Argentina: separar sí. |
| 5. Datos que faltan | **NIF y domicilio bloquean la publicación.** Lo de la plataforma ODR lo tenéis bien resuelto; lo de las reclamaciones, no. |

**No publiquéis el rasca y gana ni la garantía nueva con los textos actuales.** La garantía, tal como está redactada, es peor que no tenerla: una cláusula de "sin devolución" que contradice la ley es nula y, además, arrastra la presunción de que el resto del contrato también lo es.

---

## 0. Cuatro citas que hay que corregir

No cambian la conclusión, pero no pueden salir en un documento publicado.

1. **La devolución proporcional no es el art. 108.3, es el art. 108.4 TRLGDCU.** El 108.3 solo dice que el consumidor se abstendrá de usar el contenido digital. El derecho del empresario a cobrar "la parte ya prestada del servicio" está en el **108.4**, y solo si el consumidor pidió expresamente que el servicio empezara dentro del plazo de desistimiento (arts. 98.8 y 99.3) y se le informó de ello.

2. **"Si ya ha empezado a contestar, sin devolución" no es una regla que exista en la ley española.** El **art. 103.a)** excluye el desistimiento solo cuando el servicio está **completamente ejecutado**, y solo con consentimiento previo expreso y conocimiento de que se pierde el derecho. "Empezó" no es "terminó". Una cláusula que dice "empezó = sin devolución" es abusiva y nula de pleno derecho (arts. 82.1 y 86 TRLGDCU), y la nulidad la declara el juez de oficio.

3. **La regla de los 30 días del precio anterior no está en el art. 20 LGDCU: está en el art. 20 de la Ley 7/1996, de Ordenación del Comercio Minorista (LOCM).** Mismo contenido. Y tiene una excepción que os sirve: no se aplica a "artículos puestos a la venta por primera vez".

4. **No es "+18", es "14 años".** En España, la edad para consentir el tratamiento de datos en servicios de la sociedad de la información es **14** (art. 7 LOPDGDD). En Argentina no hay edad digital específica: rige la representación legal, así que 18.

Y una quinta, que sí tiene consecuencia práctica:

5. **La plataforma ODR: bien cerrado, pero queda un cabo en la ley española.** Efectivamente cerró el 20/7/2025 y el Reglamento (UE) 524/2013 quedó derogado por el Reglamento (UE) 2024/3228. Pero el **art. 40.5 de la Ley 7/2017** (resolución alternativa de litigios) sigue diciendo, literalmente, que los empresarios que contratan en línea "deberán incluir en su sitio web un enlace" a la plataforma ODR. España no lo ha modificado. Mi criterio: **quitad el enlace igual**. Un enlace roto a una plataforma inexistente es peor que su ausencia, y no hay sanción posible por no enlazar a algo que no existe (el art. 41 castiga el incumplimiento de la obligación de *información*, y aquí no hay información que dar). Si alguien lo pregunta, se cita el Reglamento 2024/3228.

---

## 1. Rasca y gana y los cuatro mails

### 1.1 ¿Alcanza con una casilla? No: dos, y con una regla que hoy no está escrita en ninguna parte

Vuestro planteo de dos casillas separadas y sin premarcar es correcto. Falta la regla que hace que funcione o que hunda todo:

> **El cupón tiene que entregarse aunque la segunda casilla esté sin marcar.**

Si el botón "Recibir mi cupón" no funciona sin aceptar los recordatorios, el consentimiento está viciado por condicionado (art. 7.4 RGPD: el consentimiento no puede ser condición para la ejecución de un servicio que no lo necesita). No es un tecnicismo: es la diferencia entre una base de datos de 8.000 correos con consentimiento válido y 8.000 sin él.

Las dos casillas, con su base legal:

| Casilla | Texto | Base legal |
|---|---|---|
| 1 | ☐ Quiero recibir el cupón en este correo electrónico. | Art. 6.1.b RGPD — medidas precontractuales a petición del interesado. No es una "aceptación" retirable: es la entrega de lo que pide. |
| 2 | ☐ Quiero que Vitácora Familiar me escriba hasta 4 veces en los próximos 14 días para recordarme el descuento. Puedo darme de baja con un clic. | Art. 6.1.a RGPD + art. 21.1 LSSI-CE. Revocable en cualquier momento. |

Ninguna premarcada: las casillas premarcadas no son consentimiento válido (*Planet49*, C-673/17, que citáis bien).

### 1.2 Doble opt-in: sí, pero por una razón distinta de la que planteáis

Legalmente no es obligatorio. El art. 7.1 RGPD pide poder *demostrar* el consentimiento, y un registro con fecha, hora, IP, texto exacto mostrado y versión de la política lo demuestra.

Pero hacedlo igual, por esto: **sin confirmación, una errata en el correo manda cuatro mensajes publicitarios a un desconocido.** Eso es una infracción del art. 21.1 LSSI, calificada como grave, con multa de 30.001 a 150.000 € (art. 38.3 LSSI). Es el escenario más frecuente en las sanciones reales de la AEPD, y el clic de confirmación lo elimina de raíz: si no confirma, no recibe nada.

Coste: un paso más en el embudo. Beneficio: os quita el único riesgo serio de todo el invento.

### 1.3 El popup, palabra por palabra

```
RASCA Y GANA UN 10 %

Tienes un 10 % de descuento en el libro digital de tu Vitácora.
No es un sorteo: todos recibimos el mismo cupón.

                    [ RASCAR ]

—— después de rascar ——

TU CUPÓN: 10 % EN EL LIBRO DIGITAL
Te lo mandamos a tu correo, con su código y la fecha en que vence.

Correo electrónico  [____________________]

☐  Quiero recibir el cupón en este correo electrónico.
☐  Quiero que Vitácora Familiar me escriba hasta 4 veces en los
   próximos 14 días para recordarme el descuento. Puedo darme
   de baja con un clic en cualquier momento.

        [ Recibir mi cupón ]        [ No, gracias ]

Responsable: Vitácora Familiar, [NIF], [domicilio].
Tratamos tus datos para enviarte el cupón y, si lo aceptas, los
recordatorios. Puedes ejercer tus derechos en [correo].
Política de privacidad · Bases del cupón

Válido 30 días desde que te llega · Solo libro digital ·
Un uso por persona · No acumulable con otros cupones

Si tienes menos de 14 años, pide a un adulto que lo haga por ti.
```

Sobre lo que preguntáis que falta:

- **Identidad del responsable**: sí, obligatoria en el propio popup (art. 13.1.a RGPD), no solo enlazada.
- **Enlace a la privacidad**: sí, y además el enlace tiene que funcionar antes de aceptar, no después.
- **+18**: no. Lo que hace falta es la línea de los 14 años (España) y no recoger nada más que el correo.
- **Informar de los derechos**: basta la frase "puedes ejercer tus derechos en [correo]" con el enlace. La información completa va por capas en la política.
- **"No es un sorteo: todos recibimos el mismo cupón"**: añadidlo. Es la línea que evita el único riesgo real de este montaje, y no es el juego: es la publicidad engañosa (ver 1.7).

### 1.4 La X de cerrar: sí, y es algo más que cortesía

El "No, gracias" tiene que tener el mismo tamaño, color y peso visual que "Recibir mi cupón". No es una exigencia de la ley de cookies: es del RGPD. El Comité Europeo de Protección de Datos (directrices 05/2020, apdos. 77-79) considera desleal —y por tanto inválido— un consentimiento obtenido con una interfaz donde aceptar es más fácil que rechazar.

Concretamente:
- El mismo botón, no un enlace gris de 9 píxeles.
- La X de la esquina cierra y **no vuelve a aparecer en esa visita**. Si reaparece a los 5 segundos, es una práctica agresiva (anexo de la Ley 3/1991) y además garantiza la queja.
- No bloquear el scroll ni el botón de atrás.
- Aparecer a los pocos segundos de cargar, no al instante: el popup inmediato dispara el rebote y no mejora la conversión.

### 1.5 Cada correo

Todo lo que tenéis está bien. Añadid esto:

| Qué | Por qué |
|---|---|
| Remitente, NIF y domicilio en el cuerpo | Art. 21.1 y 20 LSSI + art. 10 LSSI. |
| "PUBLICIDAD" en el asunto o en la primera línea visible | Art. 21.1 LSSI: identificable como comercial sin abrir. |
| Por qué lo recibe: "porque pediste el cupón el 19 de octubre" | Convierte una queja en un clic. |
| El código, visible, y **la fecha exacta de vencimiento** | Si el código está enterrado, el mail no sirve para nada. |
| Baja en un clic, sin login, sin "indícanos tu correo" | Art. 21.2 LSSI: sencillo y gratuito. |
| Cabeceras `List-Unsubscribe` y `List-Unsubscribe-Post` (RFC 8058) | Gmail y Outlook muestran "Cancelar suscripción" arriba. Reduce quejas y protege la reputación del dominio, que es lo que decide si estos mails llegan. |
| Enlace a privacidad y a las bases | Trazabilidad del consentimiento. |
| Dominio propio con SPF y DKIM | Un remitente falsificable es, además de un problema de entregabilidad, un problema de identificación del art. 20 LSSI. |

Y un límite duro: **cuatro son cuatro.** Un quinto mail sale del consentimiento que se pidió y es infracción del art. 21.1.

### 1.6 Las bases del cupón

Sí hacen falta, sí van en página propia, y sí tienen que enlazarse desde el popup, el pie y cada mail. Basta un enlace en el popup **siempre que las condiciones que cambian la decisión estén a la vista antes de rascar**: vigencia, que es solo digital, y que no se acumula. Eso ya está en el popup de arriba.

Los 10 textos de la tanda 2 están bien de fondo. Siete arreglos:

- **#12 — gramática.** "El cupón lo da Vitácora Familiar, con NIF [...] y domicilio en [...]". Ahora dice "de [titulares, NIF y domicilio]", que no es una frase.
- **#13 — el pack.** El texto publicado dice que no se aplica al impreso, a los marcos ni a las copias; la nota interna dice que sí vale con el pack. Un pack lleva digital. Hay que escribirlo: *"Si compras un pack, el 10 % se calcula sobre el precio del libro digital que incluye el pack."* Sin esa frase, el primer cliente que compre un pack y no vea el descuento tiene razón.
- **#14 — mercado.** Un cupón emitido en España no puede valer en la web argentina: otro titular, otra moneda, otros impuestos. Añadid: *"El cupón se emite para el país en el que lo pides y solo vale en la web de ese país."*
- **#15 — el último día.** Añadid *"El último día también vale"* y poned la fecha exacta en cada mail. "Vence solo" invita a la discusión del 30 contra el 31.
- **#16 — personales.** "Una sola vez por persona y por mail" no se puede verificar: no sabéis quién es la persona. Cambiadlo por *"Un solo uso por código. El código es personal: si lo compartes y alguien lo usa antes que tú, el cupón queda gastado."*
- **#17 — acumulación.** "No se suma a otros cupones" está bien, pero aclarad que un pack no es un cupón y añadid *"ni a precios ya rebajados"*.
- **#19 — devoluciones.** Está bien. Añadid que **el cupón no se regenera** si se devuelve la compra.

Falta, además:
- Qué pasa si el código no funciona (canal y plazo de respuesta: 5 días hábiles).
- *"Estas bases no limitan tus derechos como consumidor."*
- *"No es un sorteo: no hay azar y todas las personas reciben el mismo cupón."*

> **Aviso de producción:** las notas `[nota interna: …]` están dentro de textos aprobados (#11, #13, #17 y #21). Si el generador no las filtra, se publican. Que se filtren por marcador, no a mano.

### 1.7 ¿Hace falta autorización?

**España: no.** No hay azar, no se apuesta dinero y el premio es igual para todos: no es juego (art. 3 Ley 13/2011) ni sorteo. No hay autorización que pedir.

Pero el riesgo no está donde lo buscáis. Está en la **Ley 3/1991 de competencia desleal**: una tarjeta que *parece* aleatoria y en la que todos ganan lo mismo, sin decirlo, es una puesta en escena que puede leerse como engañosa. Se resuelve gratis con la línea "No es un sorteo: todos recibimos el mismo cupón". Y no la llaméis nunca "sorteo" ni "premio": en cuanto aparece esa palabra, cambia el régimen y la carga de la prueba.

**Argentina: tampoco, mientras no haya azar.** Las "raspaditas" caen en el régimen provincial de juegos de azar y sorteos (Ley 10.305 en Provincia de Buenos Aires, Lotería de la Ciudad en CABA, etc.), y la Lotería Nacional autoriza concursos y sorteos masivos (Res. 157/1998). Todo eso se activa por el azar o por el premio. Sin azar y con premio idéntico, es un descuento promocional, no un sorteo. Dos condiciones para que siga siéndolo: bases publicadas y no presentarlo como sorteo. El día que introduzcáis azar o premios distintos, necesitaréis autorización **provincia por provincia**, y eso es una decisión de negocio, no un trámite.

### 1.8 El precio tachado

Si tacháis un precio ("antes 399 € / ahora 359 €"), ese precio anterior tiene que ser **el más bajo aplicado en los 30 días precedentes** (art. 20 LOCM, no art. 20 LGDCU). Y sí se aplica a un cupón: lo que dispara la regla es anunciar una reducción, no cómo se llama el mecanismo.

Dos salidas, y recomiendo la primera:
1. **No tachéis nada en el popup.** Enseñad el precio normal y aplicad el descuento como línea en el checkout ("Cupón de bienvenida · 10 % del libro digital −4,90 €"), que es lo que ya tenéis en el texto #21. Sin precio anterior, no hay regla de 30 días. Es más limpio, más honesto y más fácil de defender.
2. Si insistís en tachar y el libro digital se vende por primera vez con la promoción, aplica la excepción de "artículos puestos a la venta por primera vez" (art. 20.1 LOCM). Pero esa excepción se cae en cuanto el producto lleve un día a la venta, así que no sirve como política.

En Argentina no hay regla de 30 días equivalente, pero la Ley 22.802 y el art. 4 de la Ley 24.240 llegan al mismo sitio por la vía de la información veraz. Misma recomendación.

### 1.9 Privacidad: qué hay que añadir

- **Finalidad nueva**: entrega del cupón y comunicaciones comerciales propias. Nada de cesión a terceros.
- **Base**: art. 6.1.b para el cupón; art. 6.1.a + art. 21.1 LSSI para los recordatorios.
- **Plazo**: propongo **24 meses desde la última interacción**, y borrado a los 6 meses si no ha abierto ninguno de los cuatro. Hay que escribirlo: hoy no está.
- **Proveedor de envío** en la tabla del §5. Resend sirve si ya lo usáis, pero comprobad que permite baja en un clic por cabecera y que tiene encargado de tratamiento firmado (art. 28 RGPD). Si no, una herramienta de mailing aparte. Lo que no vale es mandar los cuatro mails desde el mismo flujo transaccional de los avisos: mezcla bases legales y hace imposible demostrar cuál se aplicó a qué.
- **Derecho a retirar el consentimiento**, con el mismo botón de baja.
- **El origen de campaña** (`pedidos.extras.origen`, `fbclid`, `gclid`): nombrarlo en el §5. Base: interés legítimo (art. 6.1.f) en medir las propias ventas. Y una condición: **no reenviar esos identificadores a Meta ni a Google**. En el momento en que se reenvían, dejáis de medir vuestras ventas y pasáis a hacer publicidad comportamental de terceros, y eso sí necesita consentimiento y banner.

---

## 2. La garantía: una sola regla, con la ley primero

### 2.1 Dónde está el problema

Hoy hay tres capas que se contradicen: la garantía comercial ("si ya empezó, sin devolución"), la regla de las diez preguntas ("menos de diez, devolución íntegra") y el desistimiento legal de 14 días. El cliente lee la que más le conviene, y el juez también.

La solución no es elegir una: es **ordenarlas**. La ley arriba e intocable, la garantía comercial debajo y siempre más generosa. Cuando la comercial es más generosa que la legal —y aquí lo es—, la contradicción desaparece sola, porque el resultado práctico es el mismo.

### 2.2 Texto propuesto para el §7 de los términos

```
7. LA GARANTÍA DE CADA LIBRO

7.1. Lo que te da la ley
Tienes 14 días naturales desde la compra para desistir sin dar
explicaciones y sin coste (10 días en Argentina). Te devolvemos el
importe por el mismo medio de pago. Se pide aquí: [enlace al
formulario]. Este derecho no lo podemos quitar ni limitar, y si otra
parte de este documento dijera lo contrario, vale esta.

7.2. Lo que añadimos nosotros
Además de lo anterior, en cada libro:

· Familiar. Si la persona a la que se lo regalas no acepta la
  entrevista, te devolvemos el 100 % de lo que pagaste. Si acepta y
  contesta menos de diez preguntas, también el 100 %, aunque ya haya
  empezado.

· Viaje. Si el viaje no se hace —por el motivo que sea, incluido que
  lo canceles tú— y nos avisas antes de que la persona que viaja
  acepte la entrevista, te devolvemos el 100 %. Si ya aceptó, vale la
  regla de las diez preguntas.

· Para mí. Te devolvemos el 100 % hasta que envíes tu primera
  respuesta. Y si a los 90 días de la compra no has enviado ninguna,
  te devolvemos el dinero sin que tengas que pedirlo.

7.3. Cuándo cerramos el libro
Cuando la persona contesta diez preguntas o más, cerramos el libro
con lo que contó. Si además estás dentro de los 14 días y desistes,
te devolvemos el importe menos la parte proporcional del trabajo ya
hecho. En la práctica casi nunca se aplicará, porque la regla de las
diez preguntas ya te devuelve el 100 %.

7.4. Si dos reglas dicen cosas distintas
Vale la que más te favorezca.
```

### 2.3 Por qué esto es legal y lo otro no

- **7.1** cumple el art. 97.1.j) y el 102. No hay renuncia posible (art. 102.2: son nulas las cláusulas de renuncia).
- **7.2** es garantía comercial voluntaria: se puede dar más que la ley (art. 11 y 47 TRLGDCU), y una vez ofrecida obliga (art. 1256 CC).
- **7.3** es la única forma correcta de decir "a veces no devolvemos": reconoce el art. 108.4 y lo deja sin efecto práctico por la vía de ser más generosos, no por la vía de excluir un derecho.
- **7.4** está alineado con el art. 86 TRLGDCU (interpretación contra el predisponente). No os perjudica: si el juez iba a interpretar así de todos modos, mejor decirlo.

### 2.4 Lo que no hay que hacer

**No pongáis en el checkout una casilla de "renuncio al derecho de desistimiento".** Para que el art. 103.a) funcione hacen falta tres cosas a la vez: que el consumidor lo pida expresamente, que se le informe de que pierde el derecho y que el servicio esté **completamente** ejecutado. La renuncia anticipada no vale, y una casilla mal puesta convierte una cláusula regular en una abusiva.

**Cuidado con el art. 105.** Si no informáis del derecho de desistimiento como pide el art. 97.1.j) —con el formulario modelo del anexo—, el plazo de 14 días **se convierte en 12 meses**. Es el error más caro y más frecuente en comercio electrónico, y no se nota hasta que hay una reclamación.

### 2.5 Respuestas concretas a los cinco puntos del §1

1. **Contradicción garantía / "si no hay libro"**: se resuelve con 7.2 y 7.3. Manda la regla de las diez preguntas; el "sin devolución" desaparece.
2. **Desistimiento de 14 días**: con 7.1 y 7.3. "Sin devolución" no puede quitar el derecho legal, pero tampoco hace falta: la garantía comercial ya cubre el mismo supuesto con un resultado mejor para el cliente.
3. **"Se cancela el viaje"**: definido en 7.2. Mi propuesta es deliberadamente amplia ("por el motivo que sea, incluido que lo canceles tú") pero acotada por el disparador: antes de que la persona que viaja acepte. Después de esa aceptación ya hay trabajo hecho y la regla de las diez preguntas hace de red.
4. **"Antes de contestar la primera pregunta"**: 7.2 lo fija en el envío de la primera respuesta (audio o texto, lo que use el cliente), no en la compra, y añade la red de los 90 días para que no quede abierto para siempre.
5. **Los términos no describen Viaje ni "Para mí"**: es la corrección más importante de todas y no aparece en vuestra lista. **Un contrato no puede garantizar lo que no describe.** El §2 tiene que describir las tres líneas —qué se entrega, en cuánto tiempo, cuántas preguntas, qué pasa con el audio— antes de que el §7 las garantice. Si no, la garantía de Viaje y de "Para mí" es inaplicable por falta de objeto.

---

## 3. Cookies: confirmado, sin banner

**Sí, podéis seguir sin banner.** El razonamiento del §7.3 es correcto y el cambio del 19/10 es la decisión adecuada. Con tres condiciones.

### 3.1 Las tres cookies exentas

| Cookie | Duración | Exenta |
|---|---|---|
| `sb-…` (sesión Supabase) | sesión | Sí — estrictamente necesaria para el servicio pedido (art. 22.2 LSSI). |
| `tema` | 1 año | Sí — preferencia elegida a mano. |
| `idioma` | 1 año | Sí, **pero solo si la escribe el usuario**. |

La duración de un año no es problema: la propia AEPD dice que las cookies de preferencia "no necesariamente tendrán que ser de sesión", porque pedirle al usuario que rehaga su elección en cada visita "puede resultar molesto y provocarle fatiga" (Guía sobre el uso de las cookies, apdo. sobre cookies exentas, letra b).

**La condición del idioma es la única delicada.** La exención de la AEPD exige que "sea el propio usuario quien elija esas características", y que la cookie obedezca *exclusivamente* a la finalidad elegida. Si la cookie `idioma` se escribe sola —por IP, por `Accept-Language`, por redirección de país— deja de ser una preferencia y pasa a ser una decisión del prestador: ya no está exenta y necesitáis consentimiento.

Regla operativa: **la cookie persistente se escribe solo cuando alguien toca el selector.** La detección automática puede redirigir, pero con `sessionStorage`, no con cookie de un año. Y ojo con el detalle que mencionáis ("y no redirigir por país"): si ese es el comportamiento que os importa, es exactamente el caso en que no puede ser persistente sin consentimiento.

### 3.2 El origen de campaña: bien resuelto

Con el origen en memoria de la página y sin escribir nada en el navegador, el art. 22.2 LSSI no llega a aplicarse: no hay almacenamiento en el equipo del usuario. Confirmado, no necesita consentimiento ni banner.

Tres precisiones:

- **`sessionStorage` del checkout**: técnicamente el art. 22.2 cubre "cualquier dispositivo de almacenamiento", no solo cookies. Pero guardar el formulario mientras se compra es estrictamente necesario para prestar el servicio pedido, así que está exento. Está bien que lo digáis en el §12.
- **`fbclid` y `gclid`**: no cambian nada del banner. Llegan en la URL que la persona pulsó y viajan con el pedido; eso es tratamiento, no almacenamiento. Lo que sí cambia es la política: hay que nombrarlos y fijar la base (interés legítimo). Y la condición de 1.9: no reenviarlos a Meta ni a Google.
- **La cookie de sesión para atribuir otro día**: la descartasteis bien. Si algún día la queréis, es consentimiento y banner. No hay atajo.

### 3.3 ¿Hace falta la tabla de cookies en el §12?

Sí, y ponedla. No por el art. 22.2 —que solo exige consentimiento para las no exentas— sino por el deber de información del art. 13 RGPD y porque es vuestra prueba si alguien reclama. Cuatro columnas: nombre, finalidad, duración, proveedor. Y una frase que vale más que la tabla:

> "No usamos cookies de publicidad, de analítica ni de terceros. Las tres que hay son técnicas y de preferencia, y no necesitan consentimiento."

Una página de cookies aparte no es obligatoria. Yo la haría igual, corta, enlazada desde el pie: cuesta una hora y os ahorra explicaciones.

### 3.4 Lo que os obligaría a poner banner mañana

Cualquiera de estas, y conviene tenerlo escrito para que nadie lo instale "un momentito":

- Píxel de Meta o etiqueta de Google Ads.
- GA4 o cualquier analítica, incluida la "anónima" y la "sin cookies" sin configurar.
- YouTube, Vimeo, Google Maps o Calendly incrustados.
- Google Fonts servidas desde el CDN de Google (las alojadas en vuestro dominio, no).
- Un chat de soporte (Intercom, Crisp, WhatsApp widget).
- Cualquier herramienta de A/B testing o de grabación de sesión.
- Una cookie propia para recordar el origen de campaña más de una visita.

---

## 4. Catalán y Argentina

### 4.1 Qué tiene que estar sí o sí en catalán

La obligación no es "tener una versión en catalán". Es que la **información comercial y la documentación contractual** dirigidas a consumidores en Cataluña estén, como mínimo, en catalán (Llei 22/2010, Codi de consum; Llei 18/2017 de comerç; Llei 1/1998 de política lingüística). La Agència Catalana del Consum lo enumera así: invitaciones de compra, documentación contractual, presupuestos, resguardos, facturas, contratos de adhesión e informaciones necesarias para el consumo.

Traducido a vuestra web, la lista cerrada:

1. **Las tres páginas legales completas** (términos, privacidad, desistimiento).
2. **Las bases del cupón** — es información comercial.
3. **El checkout entero**: precios, condiciones, botón de pago, casillas.
4. **La confirmación de compra y la factura** — es el documento contractual.
5. **El formulario de desistimiento** (modelo del anexo del TRLGDCU).
6. **El popup del rasca y gana y los cuatro correos** — son información y comunicación comercial.
7. **Los fulls de reclamació i denúncia**, en el modelo oficial catalán (Decret 121/2013).
8. **La atención al cliente**: poder ser atendido en catalán por el mismo canal, correo o WhatsApp incluidos. Un WhatsApp que solo contesta en castellano es un problema distinto del de la web, y del mismo capítulo.

Lo que no hace falta: el blog, el copy de marketing, los textos internos. Aunque si la versión catalana es la buena, traducid también eso: una web a medio traducir se lee como una web que no quiere atender en catalán.

### 4.2 ¿Tiene que ser el catalán la versión por defecto?

La ley no impone que el catalán sea la lengua por defecto: impone que esté disponible, completa y sin fricción. Un consumidor tiene derecho a expresarse y ser atendido en catalán **o** en castellano, y a elegir.

Pero hay dos cosas que sí son obligatorias en la práctica:
- **Que no haya callejones sin salida**: desde cualquier página, un clic al catalán, y la versión catalana tiene que estar completa. Un enlace que lleva a una página a medio traducir es peor que no tener enlace.
- **Que la detección no imponga el castellano**: si el navegador viene en catalán, servid catalán. Si viene en castellano desde Cataluña, servid castellano pero con el selector visible y persistente.

Recomendación operativa: `hreflang` correcto, selector persistente en cabecera, y cookies de idioma que solo se escriban por elección (3.1). Con eso cumplís sin necesidad de geolocalizar.

### 4.3 Cláusula de prevalencia

La propuesta ("prevalece la versión en el idioma en que se celebró el contrato") es correcta, pero **hoy es inaplicable**, porque no hay ningún sitio donde conste en qué idioma se celebró. Hay que cerrarlo:

> "El contrato se celebra en el idioma que elijas en el selector al pagar. Ese idioma figura en la confirmación de compra que te enviamos. Si hay discrepancias entre versiones, prevalece esa."

Y la confirmación de compra tiene que imprimir el idioma. Es una línea de código y convierte una cláusula decorativa en una cláusula que se puede probar.

### 4.4 Argentina: separar, sí

Separan. Hoy las tres versiones describen los dos mercados en el mismo texto, y eso produce cuatro problemas concretos: qué titular contrata, en qué moneda, con qué impuestos y ante qué autoridad se reclama. Ninguno se arregla con redacción; se arregla separando.

Cláusula propuesta:

> "Si compras desde España contratas con [titular ES], con NIF [...] y domicilio en [...]. Si compras desde Argentina contratas con [titular AR], con CUIT [...] y domicilio en [...]. En los dos casos se aplican las normas imperativas del país en el que vives, y nada de este documento las reduce."

Esa última frase es la que os protege y la que os obliga: en la UE, el art. 6.2 del Reglamento Roma I impide que un consumidor pierda la protección de su país por una cláusula de ley aplicable; en Argentina, el art. 3 de la Ley 24.240 y el 2654 del Código Civil y Comercial van al mismo sitio.

Y en `/ar` no puede aparecer ni la palabra "Desistimiento" ni el botón español: allí es **"Botón de arrepentimiento"**, en la portada, a la vista, sin registro previo (Disp. 954/2025, art. 1). El enlace desde la portada que ya tenéis cumple, pero comprobad que está **en el primer acceso y sin scroll**: la norma dice "a simple vista, en lugar destacado", que es más exigente que "de fácil acceso".

---

## 5. Datos que faltan

### 5.1 NIF y domicilio: bloquean la publicación

Sí, son obligatorios y sí, bloquean. Art. 10.1 LSSI (nombre o razón social, NIF, domicilio, correo electrónico y, si es sociedad, datos registrales) y art. 97.1.b TRLGDCU. No es un "completar luego": publicar con "[a completar]" en amarillo es, además de un incumplimiento, una prueba de que sabíais que faltaba.

Lo mismo para los dos titulares: cada mercado con su titular, su identificación fiscal y su domicilio.

### 5.2 Plataforma ODR: quitadla, pero leed el punto 0.5

Cerrada el 20/7/2025, Reglamento 524/2013 derogado por el 2024/3228. Vuestra decisión es correcta. Queda el cabo del art. 40.5 de la Ley 7/2017, que sigue en el BOE sin modificar. Mi criterio: quitad el enlace, no prometáis la plataforma en ninguna página, y si alguien lo plantea, se cita el Reglamento 2024/3228.

### 5.3 Lo que sí hay que poner en su lugar: la sección de reclamaciones

Aquí hay un hueco que no está en vuestra lista y que es infracción **grave** si se incumple (art. 41 Ley 7/2017):

- Si estáis adheridos a una Junta Arbitral de Consumo, tenéis que identificarla con nombre y web, en la web y en las condiciones generales (art. 40.1 y 40.2).
- Si **no** estáis adheridos, no hay obligación de informar por adelantado, pero **sí** cuando una reclamación no se resuelve: hay que indicar al menos una entidad competente y decir si vais a participar en el procedimiento (art. 40.3). Y hay que hacerlo en el plazo de un mes desde la reclamación si no habéis contestado antes.

Traducido: hace falta una página de "Reclamaciones" con canal, plazo de respuesta, y la posición sobre arbitraje. La adhesión a la Junta Arbitral es voluntaria, pero pesa mucho en la decisión de compra de un producto de 399 € y en la actitud de una autoridad de consumo si hay un expediente.

### 5.4 Hojas de reclamaciones

Sí, en España, y sí hay que decir cómo se piden. En Cataluña, los fulls de reclamació i denúncia están regulados por el Decret 121/2013, se editan en catalán y el establecimiento tiene que anunciar que los tiene.

Para una web sin local, la forma correcta es: página de Reclamaciones con el formulario descargable en PDF (modelo oficial), un correo donde enviarlo, y el plazo en que respondéis. Poned 30 días y cumplidlo; es lo que se espera y lo que os deja bien si hay inspección.

### 5.5 Argentina: el canal de atención, con horario

La Disp. 954/2025 (BO 4/9/2025) es real y está en vigor. Lo que exige, y conviene tenerlo literal:

- **Art. 6**: publicar en la web el número de teléfono, canal alternativo o sitio electrónico para consultas y reclamos, **indicando el área responsable**, y con un horario que no puede ser inferior al comercial. Si la atención es solo telefónica o electrónica, **mínimo 8 horas al día, de lunes a viernes**.
- **Art. 1**: "Botón de arrepentimiento" a simple vista, en lugar destacado y **en el primer acceso**, sin registro previo ni trámite adicional.
- **Art. 5**: dentro de las 24 horas siguientes a la solicitud, hay que devolver un código de identificación de la gestión.
- **Art. 4**: "Botón de baja de servicio". Si vendéis una cosa puntual, discutible; si hay pagos escalonados o cualquier continuidad, obligatorio. Decididlo ahora y no cuando aparezca.

Vuestro WhatsApp de dudas y los dos correos sirven como canal, pero **hay que publicar el horario y el área responsable**. Hoy no está. Es un renglón.

---

## 6. Tres cosas que no preguntasteis y bloquean igual

**a) Los datos del familiar entrevistado.** El libro se escribe sobre la vida de una tercera persona que no ha dado su consentimiento a nada. Cuando alguien compra, está entregando datos de otro: nombre, salud, familia, a veces conflictos. Eso exige (i) una base legal para tratar esos datos, que en la práctica es el consentimiento del entrevistado, y (ii) informarle (arts. 13-14 RGPD) en el momento en que empieza la entrevista. No es un problema de la web nueva, es del producto, y es el riesgo más serio de todo el conjunto porque afecta a personas que no son clientes y que pueden reclamar. Hay que resolverlo con una cláusula y un paso de consentimiento al inicio de la entrevista.

**b) El formulario modelo de desistimiento.** El anexo del TRLGDCU es obligatorio y su ausencia convierte los 14 días en 12 meses (art. 105). Tiene que estar, enlazado desde la política de desistimiento y desde la confirmación de compra, en castellano y en catalán.

**c) Los términos no describen las tres líneas.** Ya está en el punto 2.5.5, pero lo repito porque es el que más consecuencias tiene: el §7 garantiza Viaje y "Para mí" y el resto del contrato no las menciona. Un contrato que garantiza un producto que no describe es un contrato que se interpreta contra quien lo redactó.

---

## 7. Orden de trabajo

**Antes de publicar la garantía nueva:**
1. Reescribir el §7 con el texto de 2.2.
2. Añadir el §2 con las tres líneas.
3. Poner el formulario modelo y el enlace en el §7.1 y en la confirmación.
4. Corregir la cita del 108.3 al 108.4 y quitar cualquier "sin devolución" que no vaya precedido de "diez preguntas".

**Antes de programar el rasca y gana:**
5. Popup con las dos casillas, la segunda opcional y el cupón entregándose igual.
6. "No, gracias" del mismo tamaño que el botón.
7. Doble opt-in.
8. Bases con los siete arreglos y sin notas internas.
9. Privacidad con finalidad, base, plazo y proveedor.

**Antes de publicar nada:**
10. NIF y domicilio de los dos titulares.
11. Página de Reclamaciones (canal, plazo, posición sobre arbitraje).
12. Canal y horario de atención en `/ar`.
13. Quitar el enlace ODR de todas las páginas.
14. Filtrar las `[nota interna]` del generador.

---

*Análisis redactado con la normativa vigente a 19 de octubre de 2026: TRLGDCU (RDL 1/2007), Ley 7/1996 LOCM, Ley 7/2017, LSSI-CE, RGPD y LOPDGDD, Llei 22/2010 y Decret 121/2013, Ley 24.240, Disp. 954/2025 y Reglamentos (UE) 2016/679, 2024/3228 y Roma I. Debe revisarlo y firmarlo un abogado colegiado antes de su publicación.*
