import type { Textos } from "@/lib/idioma-web";

// Los textos legales de la web (rediseño 2026-10, fase 5): términos,
// privacidad y desistimiento / botón de arrepentimiento, en los tres idiomas.
//
// NO SE INVENTAN: los redacta un abogado (PENDIENTES B13). Esto es el texto que
// había hasta el 14/10 en web/src/app/legal/*/page.tsx, pasado a diccionario,
// con SOLO estos cambios (listados en docs/rediseno-2026-10/fase-5/textos-legal.md
// y en para-el-abogado.md):
//   - fuera lo que el producto ya no hace (DECISIONES D4, C4): «un audio de
//     WhatsApp por día», el anticipo en la tabla de proveedores, el marco sin
//     el impreso;
//   - la garantía de cada libro, en términos §7 y al final de la página de
//     desistimiento, con el MISMO texto en las dos (GARANTIA, abajo); desde el
//     19/10 es la de la tanda 4 (fase-5/textos-legales-nuevos.md) y absorbe la
//     vieja «8. Si no hay libro»; PENDIENTE DE REVISIÓN DEL ABOGADO;
//   - la página de reclamaciones (tanda 5, 19/10);
//   - las cookies: se suma la del idioma y el guardado de la compra en la
//     pestaña (lo que el código hace hoy);
//   - «En corto» de cada página: resumen nuevo de lo que ya dice el texto, sin
//     compromisos nuevos. A APROBAR POR NAZA Y POR EL ABOGADO.
//
// es = castellano de España, de tú. ar = la misma versión de vos. En España la
// página se llama «Desistimiento»; en Argentina, «Botón de arrepentimiento»
// (Res. 424/2020). Las tres rutas siguen siendo /legal/terminos,
// /legal/privacidad y /legal/arrepentimiento (con /ca y /ar delante).
//
// ca: revisado con el corrector de Softcatalà (19/10) Y ABOGADO. Además, confirmar con el abogado qué
// textos legales tienen que estar en catalán obligatoriamente (DECISIONES D2).
//
// REVISIÓN DEL 17/10 (docs/legal/revision-textos-2026-10-17.md): corregidos los
// seis puntos de «hoy mismo» (sección F), las contradicciones B1-B7 que son
// solo texto y, de «lo que falta», factura, IVA incluido y el formulario del
// Anexo B. Con las decisiones de Joaquín del 17/10: un solo titular en los dos
// países; devolución total mientras dura la entrevista, hasta que el libro está
// listo en la cuenta; audios originales 3 meses desde que se produce el libro;
// Kids fuera de los legales hasta que exista su sección. Los textos nuevos están
// en docs/rediseno-2026-10/fase-5/textos-legal-revision-2026-10-17.md, en tres
// tandas (L1, L2, L3) para Naza. Cada texto cambiado lleva la marca
//   // APROBADO por Naza · L1-03 (18/10, con sus correcciones)
// con su número de la tanda; cuando Naza lo apruebe pasa a
//   // APROBADO por Naza el <fecha> · L1-03
// Hasta entonces no se publica (DECISIONES: los textos que ve una persona los
// aprueba Naza).
//
// Marcas dentro de los textos (las pinta legal/pagina.tsx):
//   **negrita**   [texto](/ruta o https://…)   {hola} {soporte} (correos)
//   {titular:ES} {titular:AR} (nombre, documento y domicilio, en amarillo si falta)
//   {ley:ES} {ley:AR} {autoridad:ES} {autoridad:AR} (de legal/titulares.ts)
// Los enlaces que empiezan por /legal se llevan al idioma de la página.

export type DocumentoLegal = "terminos" | "privacidad" | "arrepentimiento" | "reclamaciones";

export type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "tabla"; columnas: string[]; filas: string[][] }
  /** El botón del correo de desistimiento / arrepentimiento (solo en esa página). */
  | { tipo: "boton" }
  /** Un texto para copiar tal cual: el formulario del Anexo B (solo en la página de desistimiento). */
  | { tipo: "formulario"; lineas: string[] }
  /** Un subtítulo dentro de una sección (la garantía: la ley, lo nuestro, el cierre). */
  | { tipo: "subtitulo"; texto: string }
  /**
   * Un párrafo que depende del WhatsApp de dudas (NEXT_PUBLIC_WHATSAPP_DUDAS):
   * con número se pinta `con` (la marca {whatsapp} es el número, con enlace);
   * sin número, `sin`, que deja solo el correo.
   */
  | { tipo: "whatsapp"; con: string; sin: string }
  /**
   * La hoja oficial de reclamaciones (reclamaciones, texto 36): `con` enlaza al
   * PDF de public/legal/hoja-reclamaciones.pdf si el archivo existe; si no, se
   * pinta `sin` (se pide por correo). PENDIENTES: conseguir el PDF.
   */
  | { tipo: "hoja"; con: string; sin: string };

export type SeccionLegal = {
  id: string;
  titulo: string;
  bloques: Bloque[];
  /** Sección nueva cuyo texto todavía no vio el abogado (no se pinta: es para el código y los tests). */
  pendienteAbogado?: true;
};

export type TextoDocumento = {
  /** El nombre de la página (título, solapa y <title>). */
  titulo: string;
  bajada: string;
  descripcion: string;
  /** Resumen nuevo, sin compromisos nuevos. A APROBAR POR NAZA Y EL ABOGADO. Vacío = no se pinta. */
  enCorto: string[];
  secciones: SeccionLegal[];
};

export type TextosLegal = {
  actualizado: string;
  fecha: string;
  enCorto: string;
  indice: string;
  documentos: string;
  /** El cierre de cada página: dudas, devoluciones, borrar datos. */
  cierre: string;
  conDomicilio: string;
  aCompletar: string;
  /** El correo prellenado del botón de desistimiento / arrepentimiento. */
  boton: string;
  asunto: string;
  cuerpo: string[];
  terminos: TextoDocumento;
  privacidad: TextoDocumento;
  arrepentimiento: TextoDocumento;
  /** Reclamaciones y atención (tanda 5, textos 32–38): una sola sección, sin título ni índice. */
  reclamaciones: TextoDocumento;
};

const p = (texto: string): Bloque => ({ tipo: "parrafo", texto });
const lista = (...items: string[]): Bloque => ({ tipo: "lista", items });
const tabla = (columnas: string[], filas: string[][]): Bloque => ({ tipo: "tabla", columnas, filas });
const BOTON: Bloque = { tipo: "boton" };
const formulario = (...lineas: string[]): Bloque => ({ tipo: "formulario", lineas });
const subtitulo = (texto: string): Bloque => ({ tipo: "subtitulo", texto });
const whatsapp = (con: string, sin: string): Bloque => ({ tipo: "whatsapp", con, sin });
const hoja = (con: string, sin: string): Bloque => ({ tipo: "hoja", con, sin });

/**
 * La garantía de cada libro (tanda 4 de docs/rediseno-2026-10/fase-5/
 * textos-legales-nuevos.md, textos 22–31, APROBADA por Naza el 19/10; falta el
 * abogado). Reemplaza a la de la tanda 1 y a la vieja sección «8. Si no hay
 * libro», que quedó absorbida acá. La ley primero, la garantía nuestra debajo
 * (respuesta-19-10.md §2.2). Va IGUAL en términos §7 y al final de la página de
 * desistimiento / arrepentimiento: las dos dicen exactamente lo mismo.
 * es = España de tú; ar = de vos, 10 días y «arrepentirte»; ca = traducción.
 */
export type TextosGarantia = {
  titulo: string;
  ley: { subtitulo: string; plazo: string; formulario: string; derecho: string };
  nuestra: { subtitulo: string; familiar: string; viaje: string; propia: string };
  cierre: { subtitulo: string; diez: string; regla: string };
};

export const GARANTIA: Textos<TextosGarantia> = {
  // APROBADO por Naza el 19/10 · tanda 4, textos 22–31
  es: {
    titulo: "La garantía de cada libro",
    ley: {
      subtitulo: "Lo que te da la ley",
      plazo: "Tienes 14 días naturales desde la compra para desistir, sin dar explicaciones y sin coste. Te devolvemos el dinero por el mismo medio de pago.",
      formulario: "Lo pides desde [este formulario](/legal/arrepentimiento#formulario).",
      derecho: "Este derecho no lo podemos quitar ni limitar.",
    },
    nuestra: {
      subtitulo: "Lo que añadimos nosotros",
      familiar: "**Familiar.** Si la persona a la que se lo regalas no acepta la entrevista, te devolvemos todo lo que pagaste. Si acepta y contesta menos de diez preguntas, también te devolvemos todo, aunque ya haya empezado.",
      viaje: "**De viaje.** Si el viaje no se hace, por el motivo que sea, y nos avisas antes de que la persona que viaja acepte la entrevista, te devolvemos todo. Si ya aceptó, vale la regla de las diez preguntas.",
      propia: "**Para ti.** Si el libro es el tuyo, te devolvemos todo hasta que mandes tu primera respuesta. Después vale la regla de las diez preguntas.",
    },
    cierre: {
      subtitulo: "Cuándo cerramos el libro",
      diez: "Cuando contesta diez preguntas o más, cerramos su libro con lo que contó. Si todavía estás dentro de los 14 días y desistes, te devolvemos el importe menos la parte del trabajo ya hecho.",
      regla: "Si dos reglas de este documento dicen cosas distintas, vale la que más te favorezca.",
    },
  },
  // ca: revisado con el corrector de Softcatalà (19/10) · traducción de la tanda 4 (textos 22–31)
  ca: {
    titulo: "La garantia de cada llibre",
    ley: {
      subtitulo: "El que et dona la llei",
      plazo: "Tens 14 dies naturals des de la compra per desistir, sense donar explicacions i sense cost. Et retornem els diners pel mateix mitjà de pagament.",
      formulario: "Ho demanes des d'[aquest formulari](/legal/arrepentimiento#formulario).",
      derecho: "Aquest dret no te'l podem treure ni limitar.",
    },
    nuestra: {
      subtitulo: "El que hi afegim nosaltres",
      familiar: "**Familiar.** Si la persona a qui li regales no accepta l'entrevista, et retornem tot el que vas pagar. Si accepta i contesta menys de deu preguntes, també t'ho retornem tot, encara que ja hagi començat.",
      viaje: "**De viatge.** Si el viatge no es fa, sigui pel motiu que sigui, i ens avises abans que la persona que viatja accepti l'entrevista, t'ho retornem tot. Si ja ha acceptat, val la regla de les deu preguntes.",
      propia: "**Per a tu.** Si el llibre és el teu, t'ho retornem tot fins que enviïs la teva primera resposta. Després val la regla de les deu preguntes.",
    },
    cierre: {
      subtitulo: "Quan tanquem el llibre",
      diez: "Quan contesta deu preguntes o més, tanquem el seu llibre amb el que ha explicat. Si encara ets dins dels 14 dies i desisteixes, et retornem l'import menys la part de la feina ja feta.",
      regla: "Si dues regles d'aquest document diuen coses diferents, val la que més t'afavoreixi.",
    },
  },
  // APROBADO por Naza el 19/10 · tanda 4, textos 22–31, de vos con 10 días.
  // El plazo de 10 días corre desde que se recibe el libro (como §6 y A2 de la
  // revisión del 17/10), no desde la compra.
  ar: {
    titulo: "La garantía de cada libro",
    ley: {
      subtitulo: "Lo que te da la ley",
      plazo: "Tenés 10 días corridos desde que recibís el libro (desde la compra, si es solo digital) para arrepentirte, sin dar explicaciones y sin costo. Te devolvemos el dinero por el mismo medio de pago.",
      formulario: "Lo pedís desde el [botón de arrepentimiento](/legal/arrepentimiento).",
      derecho: "Este derecho no lo podemos quitar ni limitar.",
    },
    nuestra: {
      subtitulo: "Lo que añadimos nosotros",
      familiar: "**Familiar.** Si la persona a la que se lo regalás no acepta la entrevista, te devolvemos todo lo que pagaste. Si acepta y contesta menos de diez preguntas, también te devolvemos todo, aunque ya haya empezado.",
      viaje: "**De viaje.** Si el viaje no se hace, por el motivo que sea, y nos avisás antes de que la persona que viaja acepte la entrevista, te devolvemos todo. Si ya aceptó, vale la regla de las diez preguntas.",
      propia: "**Para vos.** Si el libro es el tuyo, te devolvemos todo hasta que mandes tu primera respuesta. Después vale la regla de las diez preguntas.",
    },
    cierre: {
      subtitulo: "Cuándo cerramos el libro",
      diez: "Cuando contesta diez preguntas o más, cerramos su libro con lo que contó. Si todavía estás dentro de los 10 días y te arrepentís, te devolvemos el importe menos la parte del trabajo ya hecho.",
      regla: "Si dos reglas de este documento dicen cosas distintas, vale la que más te favorezca.",
    },
  },
};

/** La sección de la garantía, igual en términos (con número) y en desistimiento (sin número). */
function seccionGarantia(idioma: keyof typeof GARANTIA, numero = ""): SeccionLegal {
  const g = GARANTIA[idioma];
  return {
    id: "garantia",
    titulo: numero ? `${numero}. ${g.titulo}` : g.titulo,
    pendienteAbogado: true,
    bloques: [
      subtitulo(g.ley.subtitulo),
      p(g.ley.plazo),
      p(g.ley.formulario),
      p(g.ley.derecho),
      subtitulo(g.nuestra.subtitulo),
      lista(g.nuestra.familiar, g.nuestra.viaje, g.nuestra.propia),
      subtitulo(g.cierre.subtitulo),
      p(g.cierre.diez),
      p(g.cierre.regla),
    ],
  };
}

// ─── Castellano de España (tú) ────────────────────────────────────────────

const ES: TextosLegal = {
  actualizado: "Última actualización",
  fecha: "19 de octubre de 2026",
  enCorto: "En corto",
  indice: "En esta página",
  documentos: "Textos legales",
  cierre: "¿Dudas, una devolución, o quieres que borremos algo? Escribe a {hola} y te respondemos.",
  conDomicilio: "con domicilio en",
  aCompletar: "a completar",
  boton: "Quiero desistir de mi compra",
  asunto: "Desistimiento de compra",
  cuerpo: [
    "Hola. Quiero desistir de mi compra en Vitácora Familiar.",
    "",
    "Correo con el que compré: ",
    "Nombre del narrador: ",
    "Fecha de la compra (aproximada): ",
    "",
    "Gracias.",
  ],

  terminos: {
    titulo: "Términos del servicio",
    bajada: "Qué te damos, qué te cobramos y cuándo. En castellano, sin letra chica.",
    descripcion: "Qué te damos, qué te cobramos, cuándo puedes desistir y de quién es la historia.",
    // APROBADO por Naza · L2-06 (18/10, con sus correcciones)
    enCorto: [
      "Pago único, por adelantado. Sin suscripción y sin renovación automática.",
      "La entrevista es por WhatsApp, con audios, al ritmo del narrador. Nada empieza sin su permiso. Si no acepta, o si contesta menos de diez preguntas, te devolvemos todo.",
      "Antes de cerrar el libro lo revisas tú. Lo que se imprime es lo que apruebas.",
      "Con el libro ya escrito vale el plazo de la ley, 14 días naturales desde la compra en España y 10 días corridos desde que recibes el libro en Argentina (desde la compra, si es solo digital).",
      "La historia, los audios y la voz son de tu familia. Nunca los publicamos. El libro entero solo se abre con el código del libro impreso, o con el enlace que tú compartas.",
    ],
    secciones: [
      {
        id: "quienes-somos",
        titulo: "1. Quiénes somos",
        bloques: [
          // APROBADO por Naza · L2-02 (18/10, con sus correcciones)
          p("Vitácora Familiar lo presta una sola persona en los dos países donde vendemos, con un alta fiscal en cada uno. Qué datos y qué ley se aplican a tu compra depende de la región que eliges al comprar (la misma que decide la moneda y el medio de pago):"),
          lista(
            "Si compras desde **España** (en euros): {titular:ES}.",
            "Si compras desde **Argentina** (en pesos): {titular:AR}.",
          ),
          p("En estos términos, «nosotros» es esa persona, con los datos de tu región. Para cualquier cosa escribe a {hola} (o a {soporte} si es un problema con la web) y te contestamos."),
        ],
      },
      {
        id: "que-es",
        titulo: "2. Qué es el servicio",
        bloques: [
          p("Entrevistamos por WhatsApp a la persona que nos indicas (el «narrador»): le llega una pregunta, la responde con un audio cuando quiere, sin instalar nada, y cuando termina de contar le llega la siguiente. Con sus respuestas escribimos el libro, en primera persona y con sus propias palabras."),
          // APROBADO por Naza · L2-03 (18/10, con sus correcciones)
          p("Hay tres libros:"),
          lista(
            "**Familiar**: el libro de una vida, la de otra persona, que tú le regalas. El narrador es esa persona.",
            "**Para ti**: tu propio libro. El narrador eres tú, y las preguntas te llegan a tu WhatsApp.",
            "**De viaje**: el libro de un viaje. Las preguntas le llegan al viajero por WhatsApp antes de salir y durante el viaje, las contesta con audios cuando quiere, y al volver nos manda las fotos para el álbum. Con eso escribimos el libro del viaje, con el álbum al final. Puede ser para ti o un regalo.",
          ),
          p("Lo que puedes comprar:"),
          lista(
            // APROBADO por Naza · L1-08 (18/10, con sus correcciones)
            "**El libro en PDF**: se lee en la web, capítulo por capítulo, con las fotos que suba la familia. Incluye **«Su voz»**: sus mejores frases, recortes de sus audios originales con el sonido limpio y parejo (no se clona ni se imita su voz), para escuchar en la web y con un código impreso. Está siempre disponible en tu cuenta.",
            "**El libro impreso**, en blanco y negro o a color: tapa dura, con un código en la contratapa que hace sonar su voz.",
            "**Marcos con su voz**: un marco con su foto y un chip; se acerca el teléfono y suena su voz.",
          ),
          p("Hace falta comprar al menos uno de los dos primeros; los marcos van con el libro impreso. Solo se ofrece lo que tiene precio publicado en tu región."),
          p("Desde tu cuenta puedes invitar a familiares para que lean el libro y suban fotos, y compartir una muestra pública (portada, títulos de los capítulos, el primer párrafo y un minuto de audio). La muestra solo existe si tú compartes el enlace."),
          p("El libro impreso lleva dos códigos: uno al lado de cada frase de «Su voz», que la hace sonar, y otro en la contratapa, que abre en el teléfono el libro entero —el texto y todas sus frases— sin necesidad de cuenta ni contraseña. Quien tenga el libro en la mano puede abrirlos y reenviar ese enlace: cuéntaselo a quien se lo regales."),
        ],
      },
      {
        id: "compra",
        titulo: "3. Cómo se compra",
        bloques: [
          p("Es un **pago único, por adelantado**. No hay suscripción, no hay renovación automática y no guardamos tu tarjeta: el cobro lo hace Stripe (España) o Mercado Pago (Argentina) y ellos son los únicos que ven tus datos de pago."),
          // APROBADO por Naza · L2-04 (18/10, con sus correcciones)
          p("El precio de cada producto aparece antes de pagar, en euros o en pesos según la región que elijas, y es el precio final que pagas (en España, con el IVA incluido). Después del pago te llega un correo para entrar a tu cuenta con un código (sin contraseña) y anotar a tu narrador: su nombre, su WhatsApp y unos pocos datos para que las preguntas le suenen a él."),
          p("Por cada compra te mandamos la factura por correo: en Argentina, la factura electrónica, dentro de los 5 días hábiles después del pago; en España, la factura con el IVA desglosado."),
        ],
      },
      {
        id: "permiso",
        titulo: "4. Nada empieza sin su permiso",
        bloques: [
          // APROBADO por Naza · L2-05 (18/10, con sus correcciones)
          p("Al anotar a alguien nos confirmas que puedes hacerlo y que le va a parecer bien. Antes de la primera pregunta le escribimos por WhatsApp contándole quién lo anotó y le pedimos permiso. **Si no acepta, no empieza nada y te devolvemos el dinero completo** (ver la sección 7). En ese caso, en 15 días borramos su nombre, su número, su ficha y sus fotos, y solo guardamos lo necesario para la factura y la devolución."),
          p("El narrador manda en su historia: puede parar cuando quiera, retomar cuando quiera, responder solo lo que quiera, y pedir que borremos todo lo que grabó. Si deja de responder unos días, te avisamos por correo."),
        ],
      },
      {
        id: "entrega",
        titulo: "5. Qué te entregamos y cuándo",
        bloques: [
          p("El ritmo lo pone el narrador: la entrevista dura lo que él tarde en responder, y puedes seguirla desde tu cuenta mientras avanza. Cuando termina, producimos el libro y te avisamos por correo. Antes de darlo por cerrado lo revisas tú: puedes cambiar el título, el orden y los nombres de los capítulos, las fotos de la portada y la contratapa, dejar fuera alguna respuesta y pedir correcciones de lo que no suene a él."),
          p("El libro en PDF y sus frases en su voz quedan disponibles en tu cuenta. El libro impreso y los marcos se producen después de que apruebas el libro; antes de mandarlos a producir te escribimos para pedirte la dirección de envío y confirmarte el plazo."),
        ],
      },
      {
        id: "arrepentimiento",
        titulo: "6. Si te arrepientes",
        bloques: [
          // APROBADO por Naza · L1-01 (18/10, con sus correcciones) · alineado a la regla de las diez preguntas (Naza 19/10)
          p("Puedes arrepentirte sin dar explicaciones: escríbenos a {hola} o usa el [botón de desistimiento](/legal/arrepentimiento). Te confirmamos que lo recibimos dentro de las 24 horas y te devolvemos el dinero por el mismo medio con el que pagaste, en un plazo máximo de 14 días. Funciona en tres capas, en este orden:"),
          p("**Primero, lo que te damos nosotros.** Además de lo que te da la ley, cada libro tiene su garantía, que explicamos en la [sección 7](/legal/terminos#garantia). Es más de lo que pide la ley."),
          p("**Después, lo que te da la ley, cuando el libro ya está escrito.** Depende de la región en la que compraste:"),
          lista(
            // APROBADO por Naza · L1-03 (18/10, con sus correcciones) · alineado a la regla de las diez preguntas (Naza 19/10)
            "**Si compraste en España (en euros) — 14 días naturales** desde la compra (derecho de desistimiento, arts. 102 a 108 del RDL 1/2007). Al pagar nos pides que la entrevista empiece en cuanto el narrador acepte, sin esperar esos 14 días; aun así, vale la garantía de la sección 7. Una vez que el libro en PDF y sus frases en su voz están a tu disposición en tu cuenta, con tu consentimiento, el desistimiento ya no aplica sobre ellos (art. 103 m).",
            // APROBADO por Naza · L1-02 (18/10, con sus correcciones)
            "**Si compraste en Argentina (en pesos) — 10 días corridos** desde que recibes el libro, o desde la compra si el libro es solo digital, lo que ocurra último (art. 34 de la ley 24.240). Puedes revocar la compra sin costo alguno: te devolvemos el total, y si hay que devolver el libro impreso o el marco, el envío de vuelta lo pagamos nosotros. El botón de arrepentimiento está en la página de inicio, como exige la Resolución 424/2020.",
          ),
          // APROBADO por Naza · L1-04 (18/10, con sus correcciones)
          p("**Por último, lo que no se devuelve.** Si compraste en España: el libro en PDF ya entregado en tu cuenta (art. 103 m), y el libro impreso y los marcos, que se hacen a medida con la historia y las fotos de tu familia y que apruebas antes de imprimir (art. 103 c). En las dos regiones, si algo llega dañado o con un defecto, lo reponemos sin coste."),
          p("Estos plazos son los que marca la ley de cada país; nunca te van a dar menos derechos de los que te corresponden como consumidor donde vives."),
        ],
      },
      seccionGarantia("es", "7"),
      {
        id: "historia",
        titulo: "8. La historia es de tu familia",
        bloques: [
          // APROBADO por Naza · L1-07 (18/10, con sus correcciones)
          p("Lo que cuenta tu narrador es suyo y de tu familia. No nos quedamos con ningún derecho sobre su historia, sus audios, sus fotos ni su voz: nos das únicamente el permiso necesario para transcribir, escribir, maquetar, recortar sus frases e imprimir tu libro. Nunca la usamos como ejemplo, nunca publicamos su historia ni se la mostramos a nadie fuera de tu familia, salvo la muestra que tú decidas compartir y quien tenga el libro en la mano: el código de la contratapa abre el libro completo, y ese enlace se puede reenviar. Si algún día quisiéramos mostrar una página como muestra de nuestro trabajo, te lo pediríamos por escrito y podrías decir que no."),
          // APROBADO por Naza · L1-08 (18/10, con sus correcciones)
          p("Sus frases en su voz son recortes de sus audios originales, con el sonido limpio y parejo; no se clona ni se imita su voz. No se usan para ningún otro fin y se borran cuando el narrador o tú lo pidan."),
        ],
      },
      {
        id: "uso",
        titulo: "9. Lo que te pedimos a ti",
        bloques: [
          lista(
            "Anota solo a alguien a quien puedas anotar y que vaya a estar de acuerdo. El servicio no sirve para grabar, vigilar ni acosar a nadie.",
            "Las fotos y los nombres que subas tú o tus invitados son responsabilidad de quien los sube: no subas material de otras personas sin su permiso.",
            "Tu cuenta es tuya: el código de acceso que te mandamos por correo no lo compartas. Si crees que alguien entró sin permiso, avísanos.",
          ),
        ],
      },
      {
        id: "promesas",
        titulo: "10. Qué te prometemos y qué no",
        bloques: [
          p("Te prometemos que el libro se escribe con las palabras de tu narrador, que para él va a ser fácil —un audio de WhatsApp cuando quiera— y que si algo sale mal lo arreglamos o te devolvemos el dinero."),
          p("Para transcribir los audios y para redactar los capítulos usamos inteligencia artificial, y puede equivocarse: un nombre mal oído, una fecha, un giro que no le pertenece. Por eso el libro no se cierra hasta que lo revisas tú, y por eso te pedimos que lo leas antes de aprobarlo. Lo que se imprime es lo que aprobaste."),
          p("No podemos prometerte cuánto va a querer contar tu narrador ni cuántas preguntas va a responder. Si cuenta poco, el libro sale más corto."),
          // APROBADO por Naza · L1-09 (18/10, con sus correcciones)
          p("Si algo falla por nuestra culpa, respondemos conforme a la ley. No limitamos nuestra responsabilidad por dolo ni por daños a las personas, ni ningún derecho que te dé la ley de tu país."),
        ],
      },
      {
        id: "datos",
        titulo: "11. Tus datos",
        bloques: [
          p("Qué guardamos, quién lo procesa, por cuánto tiempo y cómo borrarlo está en la [política de privacidad](/legal/privacidad). Lo resumido: los audios y la voz son de tu familia, se usan solo para su libro, no se usan para entrenar ningún modelo y se borran cuando lo pidas."),
        ],
      },
      {
        id: "cambios",
        titulo: "12. Si algo cambia",
        bloques: [
          p("Si modificamos estos términos, te avisamos por correo antes de que te afecten. Los cambios nunca se aplican hacia atrás sobre un libro ya pagado: para ese libro valen los términos que aceptaste al comprar."),
        ],
      },
      {
        id: "ley",
        titulo: "13. Ley y jurisdicción",
        bloques: [
          lista(
            "Si compras desde **España**, el contrato se rige por {ley:ES}. Cualquier disputa se resuelve en los juzgados de tu domicilio. También puedes acudir a la oficina de consumo de tu comunidad autónoma o a una Junta Arbitral de Consumo; tienes hojas de reclamaciones a tu disposición pidiéndolas por correo.",
            "Si compras desde **Argentina**, el contrato se rige por {ley:AR}. Puedes reclamar ante la autoridad de Defensa del Consumidor de tu jurisdicción o por la [ventanilla única federal](https://www.argentina.gob.ar/produccion/defensadelconsumidor).",
          ),
          p("En los dos casos conservas siempre los derechos que te da la ley del país donde vives. Antes de cualquier reclamo formal, escríbenos: lo normal es que lo resolvamos en un correo."),
        ],
      },
      {
        id: "contacto",
        titulo: "14. Contacto",
        bloques: [
          p("{hola} para todo lo que tenga que ver con tu libro, tu compra o una devolución. {soporte} si algo no funciona en la web. Contestamos en días hábiles."),
        ],
      },
    ],
  },

  privacidad: {
    titulo: "Privacidad",
    bajada: "Qué guardamos de tu familia, quién lo procesa, por cuánto tiempo y cómo borrarlo.",
    descripcion: "Qué guardamos de tu familia, quién lo procesa, por cuánto tiempo y cómo borrarlo.",
    enCorto: [
      "Usamos tus datos y los de tu familia solo para hacer el libro.",
      "No los vendemos, no los usamos para publicidad y no entrenamos ningún modelo de inteligencia artificial con ellos.",
      // APROBADO por Naza · L3-01 (18/10, con sus correcciones)
      "Los audios originales se borran 3 meses después de producir el libro, o antes si lo pide el narrador o lo pides tú. Quedan solo los recortes de «Su voz».",
      "Solo usamos cookies técnicas, ni de publicidad ni de analítica.",
      "Para cualquier cosa sobre tus datos, basta un correo a {hola}.",
    ],
    secciones: [
      {
        id: "responsables",
        titulo: "1. Quién responde por tus datos",
        bloques: [
          // APROBADO por Naza · L2-02 (18/10, con sus correcciones)
          p("El responsable del tratamiento es el titular del servicio, una sola persona, con los datos de la región que elegiste al comprar:"),
          lista("**España**: {titular:ES}.", "**Argentina**: {titular:AR}."),
          p("Para cualquier cosa sobre tus datos escribe a {hola}. No hace falta formulario ni formalidad: un correo alcanza."),
        ],
      },
      {
        id: "a-quien",
        titulo: "2. A quién aplica",
        bloques: [
          p("Esta política habla de cuatro personas distintas:"),
          lista(
            "**Quien compra** y tiene la cuenta (llamémosla «tú»).",
            "**El narrador**: la persona a la que entrevistamos por WhatsApp.",
            "**Los invitados**: familiares a los que invitas a leer el libro y subir fotos.",
            "**Quien visita la web** sin cuenta, o abre la muestra pública de un libro.",
          ),
        ],
      },
      {
        id: "que-datos",
        titulo: "3. Qué datos guardamos",
        bloques: [
          p("**De ti**: tu nombre, tu correo, la región que elegiste, y qué compraste, cuándo y por qué medio. Tu tarjeta no la vemos nunca: la cobra Stripe o Mercado Pago y a nosotros nos llega solo la confirmación. Cuando entras a tu cuenta guardamos los registros técnicos normales de cualquier web (dirección IP, navegador, hora)."),
          // APROBADO por Naza · L3-03 (18/10, con sus correcciones)
          p("**La dirección de envío**: si compras el libro impreso o un marco, la dirección y el nombre de quien lo recibe. Solo la usamos para mandarlo: se la pasamos a la imprenta y a la mensajería, y después queda con los datos de la compra."),
          p("**Del narrador**: su nombre y cómo le gusta que le digan, su número de WhatsApp, su zona horaria, y los datos que nos das para que las preguntas le suenen a él (dónde y cuándo nació, a qué se dedicó, quién es quién en su familia), y lo importante: los **audios** que graba, las **transcripciones** que hacemos de ellos, los **textos** del libro y las **fotos** que sube la familia."),
          // APROBADO por Naza · L3-02 (18/10, con sus correcciones)
          p("**Del viajero**, en el libro de viaje: además de lo anterior, las fechas de salida y de vuelta y el país principal del viaje (para mandarle los mensajes a una hora razonable allí donde esté), las preguntas propias que escribe quien regala, si las hay, y las fotos del álbum que nos manda por WhatsApp, en las que pueden aparecer otras personas que viajan con él."),
          // APROBADO por Naza · L1-08 (18/10, con sus correcciones)
          p("**Su voz**: sus mejores frases son recortes de sus audios originales, con el sonido limpio y parejo, para escucharlas en la web y con el código impreso en el libro. No se clona ni se imita su voz. Si algún día ofreciéramos un producto con su voz clonada —un **dato biométrico**—, solo lo haríamos con el consentimiento explícito del narrador, pedido por WhatsApp para ese fin concreto."),
          p("**De los invitados**: su correo (para invitarlos), su nombre si entran, y las fotos que suben."),
          p("**De quien visita**: nada que lo identifique. Solo los registros técnicos del servidor y las cookies de la sección 12."),
        ],
      },
      {
        id: "para-que",
        titulo: "4. Para qué los usamos, y con qué derecho",
        bloques: [
          lista(
            "**Para hacer tu libro**: entrevistar, transcribir, escribir, maquetar, recortar sus frases de sus audios, imprimir y mostrarte el resultado. Es el contrato que aceptaste al comprar.",
            "**Para hablar con el narrador por WhatsApp**, hacerle las preguntas y guardar sus respuestas: con su consentimiento, que le pedimos antes de la primera pregunta y que puede retirar cuando quiera.",
            "**Para avisarte** por correo cómo va (cuando acepta, cuando responde la primera, a mitad de camino, si se queda en silencio, cuando el libro está listo). Es parte del servicio.",
            "**Para facturar y cumplir la ley**: guardar los datos de la compra el tiempo que exige la normativa fiscal.",
            "**Para que la web funcione y sea segura**: registros técnicos y cookies de sesión, por interés legítimo en que nadie entre a una cuenta ajena.",
          ),
          p("Nada más. No usamos tus datos ni los de tu familia para publicidad, no los vendemos, no los cedemos a nadie que no necesite tocarlos para hacer tu libro, y no entrenamos ningún modelo de inteligencia artificial con ellos."),
        ],
      },
      {
        id: "quien-procesa",
        titulo: "5. Quién procesa los datos por nosotros",
        bloques: [
          p("Para hacer el libro nos apoyamos en estos servicios. Cada uno ve solo lo que necesita para su parte, con un contrato que le prohíbe usarlo para otra cosa:"),
          tabla(
            ["Quién", "Para qué", "Dónde"],
            [
              ["Supabase", "La base de datos y el almacén de audios, fotos, libros y sus frases en su voz. También el acceso a tu cuenta.", "Unión Europea"],
              ["Vercel", "Aloja la web que estás leyendo y la página de la historia.", "Estados Unidos (red global)"],
              ["Railway", "Corre el entrevistador (el que manda y recibe los WhatsApp) y la fábrica que produce el libro y elige sus frases.", "Estados Unidos"],
              ["Meta (WhatsApp Business)", "Lleva y trae los mensajes y audios entre el narrador y nosotros. Meta ve los mensajes como los vería en cualquier chat de WhatsApp Business.", "Según las reglas de Meta"],
              ["OpenAI", "Transcribe los audios a texto. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
              ["Anthropic", "Redacta los capítulos a partir de las transcripciones, con las palabras del narrador. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
              ["Stripe / Mercado Pago", "Cobran. Son los únicos que ven tu tarjeta.", "Stripe: UE y EE. UU. · Mercado Pago: Argentina"],
              ["Resend", "Manda los correos: el código para entrar y los avisos.", "Brasil (región de América del Sur)"],
              ["Imprenta y mensajería", "Solo si compras el libro impreso o los marcos: reciben el archivo, tu nombre y la dirección de envío.", "Bookmundo, en Países Bajos (Unión Europea), para los libros de España. En Argentina te decimos cuál antes de mandar a imprimir"],
              ["Sentry", "Avisa de los errores técnicos de la web y del entrevistador. No recibe nombres, mensajes ni audios.", "Unión Europea (Alemania)"],
              ["Cloudflare", "Guarda una copia de seguridad de los audios, las fotos y los libros, por si se pierden. Lo que borramos se borra también de la copia a los 30 días.", "Unión Europea"],
            ],
          ),
        ],
      },
      {
        id: "transferencias",
        titulo: "6. Datos que salen de tu país",
        bloques: [
          // APROBADO por Naza · L3-04 (18/10, con sus correcciones)
          p("Como ves en la tabla, algunos de esos servicios están fuera de tu país: en Estados Unidos y, en el caso de los correos, en Brasil."),
          lista(
            "**Si estás en la Unión Europea**: las transferencias a Estados Unidos se hacen bajo el Marco de Privacidad de Datos UE-EE. UU. o con las cláusulas contractuales tipo aprobadas por la Comisión Europea, según el proveedor. Brasil no tiene decisión de adecuación de la Unión Europea: los correos van con las garantías contractuales del proveedor.",
            "**Si estás en Argentina**: tus datos viajan a Estados Unidos (y los correos, a Brasil) para que estos proveedores hagan su parte, bajo sus contratos de tratamiento de datos. La decisión de adecuación de la Unión Europea sobre Argentina sirve para los datos que van de Europa a Argentina; no cubre los que salen de Argentina hacia Estados Unidos, y por eso lo contamos aparte.",
          ),
          p("Si quieres ver los contratos con un proveedor concreto, pídelos por correo."),
        ],
      },
      {
        id: "cuanto-tiempo",
        titulo: "7. Cuánto tiempo los guardamos",
        bloques: [
          // APROBADO por Naza · L3-05 (18/10, con sus correcciones)
          lista(
            "**Los audios originales**: 3 meses desde que producimos el libro. Después los borramos y quedan solo los recortes de «Su voz». Si lo pide el narrador, o lo pides tú, se borran antes.",
            "**El libro, sus frases en su voz y las fotos**: mientras exista tu cuenta, para que la familia vuelva a ellos cuando quiera. Si pides borrar sus frases en su voz, se borran, y los códigos del libro impreso dejan de sonar.",
            "**Si el narrador no acepta participar**: en 15 días borramos su nombre, su número, su ficha y sus fotos.",
            "**Tu cuenta**: hasta que pidas cerrarla. Si la cierras, borramos todo lo de arriba.",
            "**Los datos de la compra** (qué, cuándo, cuánto, a nombre de quién y adónde lo mandamos): el tiempo que exige la ley fiscal de cada país, aunque cierres la cuenta.",
            "**Los registros técnicos**: unos meses, solo para seguridad.",
            "**Las copias de seguridad**: se borran solas. Las de la base de datos, a los 7 días; las de los audios, las fotos y los libros, 30 días después de que los borramos.",
          ),
        ],
      },
      {
        id: "con-quien",
        titulo: "8. Con quién compartimos",
        bloques: [
          p("Con nadie, salvo los proveedores de la sección 5 y la familia que tú elijas: los invitados ven el libro y las fotos, y quien abra un enlace de muestra que tú compartiste ve la portada, los títulos de los capítulos, el primer párrafo y un minuto de audio. El libro impreso lleva además un código en la contratapa (y uno al lado de cada frase de «Su voz») que abre en el teléfono el libro entero y sus frases, sin cuenta: quien tenga el libro en la mano puede abrirlo y reenviar ese enlace, igual que podría prestar el libro. Nunca vendemos datos, nunca los usamos para publicidad y nunca los entregamos a terceros salvo obligación legal."),
        ],
      },
      {
        id: "derechos",
        titulo: "9. Tus derechos (y los del narrador)",
        bloques: [
          p("Tú, el narrador y cada invitado podéis pedir en cualquier momento: **acceder** a sus datos, **corregirlos**, **borrarlos**, **llevárselos** en un formato usable (el libro en PDF, sus frases y los audios originales), **oponerse** a un uso o pedir que lo **limitemos**, y **retirar un consentimiento** (por ejemplo, el del narrador para seguir la entrevista) sin que eso afecte lo hecho hasta entonces."),
          p("Cómo: un correo a {hola} desde la dirección de tu cuenta (o, si eres el narrador, un mensaje por el mismo WhatsApp). Contestamos en un mes como máximo; casi siempre en días. Si crees que no te hicimos caso, puedes reclamar ante la {autoridad:ES} si estás en España o ante la {autoridad:AR} si estás en Argentina."),
        ],
      },
      {
        id: "menores",
        titulo: "10. Menores",
        bloques: [
          p("Para comprar hay que ser mayor de edad. El narrador da su propio permiso por WhatsApp; si el narrador fuera menor de edad, el permiso tiene que darlo quien ejerza su patria potestad, y te pedimos que nos lo digas al anotarlo."),
        ],
      },
      {
        id: "seguridad",
        titulo: "11. Cómo los cuidamos",
        bloques: [
          p("Los audios, las fotos y los libros están en un almacén privado: no tienen enlaces públicos, y cada archivo se entrega solo a quien tiene derecho a verlo, con un enlace que caduca (el código del libro impreso es un enlace firmado por nosotros: abre ese libro y nada más). A tu cuenta se entra con un código de un solo uso que te mandamos por correo; no hay contraseñas que se puedan filtrar. Las conexiones van cifradas. El acceso de los socios a los datos está limitado a lo necesario para producir tu libro y resolver problemas."),
        ],
      },
      {
        id: "cookies",
        titulo: "12. Cookies",
        bloques: [
          p("Usamos solo cookies técnicas, las imprescindibles para que la web funcione: la que mantiene tu sesión abierta cuando entras a tu cuenta, la que recuerda si prefieres la página de la historia en claro o en oscuro y la que recuerda el idioma que eliges en la web. Mientras compras, el navegador guarda en esa pestaña lo que vas rellenando, para no perderlo si vuelves atrás; se borra al cerrarla. Si llegas a la web desde un anuncio, recordamos de cuál solo mientras dura esa visita, sin guardar nada en tu navegador. Si compras en esa misma visita, lo anotamos con tu pedido para saber qué anuncios funcionan. No usamos cookies de publicidad ni de analítica, y por eso no te mostramos ningún aviso. Si algún día sumamos una herramienta de medición, te pediremos consentimiento antes de activarla y esta sección cambiará."),
        ],
      },
      {
        id: "ia",
        titulo: "13. Inteligencia artificial",
        bloques: [
          p("Usamos modelos de inteligencia artificial para tres cosas: transcribir los audios, redactar los capítulos con las palabras del narrador, y elegir, entre lo que dijo, las frases que van en «Su voz». Los modelos son de OpenAI y Anthropic, contratados por API, y ninguno usa lo que les mandamos para entrenar. Nosotros tampoco entrenamos nada con tu familia. Las decisiones que importan las toma una persona: tú apruebas el libro antes de que se cierre, y no hay ninguna decisión automatizada que te afecte legalmente."),
        ],
      },
      {
        id: "cambios",
        titulo: "14. Si esto cambia",
        bloques: [
          p("Si cambiamos esta política de forma que te afecte —un proveedor nuevo, un uso nuevo— te avisamos por correo antes, y si el cambio necesita tu consentimiento, te lo pedimos. La fecha de arriba dice cuándo fue la última vez que la tocamos."),
        ],
      },
      {
        id: "contacto",
        titulo: "15. Contacto",
        bloques: [
          // APROBADO por Naza · L2-02 (18/10, con sus correcciones)
          p("{hola} para todo lo que tenga que ver con tus datos, los del narrador o los de un invitado. Te contesta una persona, no un sistema."),
        ],
      },
    ],
  },

  arrepentimiento: {
    titulo: "Desistimiento",
    bajada: "Si te arrepientes de la compra, esto es todo lo que hay que hacer.",
    descripcion: "Cómo desistir de una compra y pedir la devolución.",
    enCorto: [
      "Se pide con un correo. No hace falta que expliques por qué.",
      "Te confirmamos que lo recibimos dentro de las 24 horas y te devolvemos el dinero por el mismo medio con el que pagaste, en 14 días como máximo.",
      // APROBADO por Naza · L1-10 (18/10, con sus correcciones)
      "Si el narrador contesta menos de diez preguntas, te devolvemos todo. Por ley, 14 días naturales desde la compra en España y 10 días corridos desde que recibes el libro en Argentina, sin coste.",
    ],
    secciones: [
      {
        id: "como",
        titulo: "Cómo se hace",
        bloques: [
          p("Aprieta el botón: se abre un correo a {hola} con el asunto ya escrito. Completa tu correo de compra y el nombre del narrador, y mándalo. No hace falta que expliques por qué."),
          BOTON,
          p("Si el botón no te abre el correo, escribe tú a {hola} con el asunto «Desistimiento de compra»."),
        ],
      },
      {
        id: "despues",
        titulo: "Qué pasa después",
        bloques: [
          lista(
            "Te confirmamos por correo que lo recibimos, dentro de las 24 horas.",
            "Si la entrevista había empezado, la paramos y le avisamos al narrador con cuidado.",
            "Te devolvemos el dinero por el mismo medio con el que pagaste, en un plazo máximo de 14 días.",
          ),
        ],
      },
      {
        id: "plazos",
        titulo: "Plazos",
        bloques: [
          // APROBADO por Naza · L1-10 (18/10, con sus correcciones) · alineado a la regla de las diez preguntas (Naza 19/10)
          lista(
            "**La garantía de cada libro.** Si el narrador no acepta, o si contesta menos de diez preguntas, te devolvemos todo. El detalle está al final de esta página.",
            "**España**: 14 días naturales desde la compra. El libro en PDF (con sus frases en su voz) ya entregado en tu cuenta y los productos a medida (impreso, marcos) no se pueden devolver, salvo que lleguen dañados o con un defecto.",
            "**Argentina**: 10 días corridos desde que recibes el libro, o desde la compra si el libro es solo digital, lo que ocurra último, sin costo (art. 34 de la ley 24.240). Si hay que devolver el libro impreso o el marco, el envío lo pagamos nosotros.",
            "**Aunque no lo pidas**: si el narrador no acepta participar, o la entrevista termina sin material para un libro (ver la sección 7 de los términos), te escribimos y te devolvemos todo en un plazo máximo de 14 días.",
          ),
          p("El detalle está en la sección [«Si te arrepientes» de los términos](/legal/terminos#arrepentimiento)."),
        ],
      },
      {
        // APROBADO por Naza · L2-01 (18/10, con sus correcciones)
        id: "formulario",
        titulo: "Formulario de desistimiento",
        bloques: [
          p("Si prefieres el modelo oficial de formulario de desistimiento (anexo B del RDL 1/2007), copia este texto, rellénalo y mándalo a {hola}. No es obligatorio: el botón de arriba vale lo mismo."),
          formulario(
            "A la atención de {titular:ES}, correo {hola}:",
            "Por la presente le comunico/comunicamos (*) que desisto de mi/desistimos de nuestro (*) contrato de venta del siguiente bien/prestación del siguiente servicio (*):",
            "Pedido el/recibido el (*):",
            "Nombre del consumidor o de los consumidores:",
            "Domicilio del consumidor o de los consumidores:",
            "Firma del consumidor o de los consumidores (solo si el presente formulario se presenta en papel):",
            "Fecha:",
            "(*) Táchese lo que no proceda.",
          ),
        ],
      },
      seccionGarantia("es"),
    ],
  },
  // APROBADO por Naza el 19/10 · tanda 5, textos 32–37 (falta el abogado)
  reclamaciones: {
    titulo: "Reclamaciones y atención",
    bajada: "Si algo no salió bien, escríbenos. Te contesta una persona del equipo de Vitácora.",
    descripcion: "Si algo no salió bien, escríbenos. Te contesta una persona del equipo de Vitácora.",
    enCorto: [],
    secciones: [
      {
        id: "atencion",
        titulo: "",
        bloques: [
          whatsapp(
            "Por WhatsApp al {whatsapp} o por correo a {soporte}, de lunes a viernes de 10 a 18, hora de España.",
            "Por correo a {soporte}, de lunes a viernes de 10 a 18, hora de España.",
          ),
          p("Te respondemos en un plazo máximo de 30 días."),
          hoja(
            "Si prefieres una hoja oficial de reclamaciones, [descárgala aquí](/legal/hoja-reclamaciones.pdf), rellénala y mándanosla por correo.",
            "Pídenos la hoja oficial de reclamaciones por correo y te la mandamos.",
          ),
          p("No estamos adheridos a la Junta Arbitral de Consumo. Si tu reclamación no se resuelve, te diremos qué organismo puede revisarla."),
        ],
      },
    ],
  },
};

// ─── Castellano de Argentina (vos) ────────────────────────────────────────
// La misma versión que ES, pasada a vos. En Argentina la página de
// desistimiento es el «Botón de arrepentimiento» (Res. 424/2020).

const AR: TextosLegal = {
  actualizado: "Última actualización",
  fecha: "19 de octubre de 2026",
  enCorto: "En corto",
  indice: "En esta página",
  documentos: "Textos legales",
  cierre: "¿Dudas, una devolución, o querés que borremos algo? Escribí a {hola} y te respondemos.",
  conDomicilio: "con domicilio en",
  aCompletar: "a completar",
  boton: "Quiero arrepentirme de mi compra",
  asunto: "Arrepentimiento de compra",
  cuerpo: [
    "Hola. Quiero arrepentirme de mi compra en Vitácora Familiar.",
    "",
    "Correo con el que compré: ",
    "Nombre del narrador: ",
    "Fecha de la compra (aproximada): ",
    "",
    "Gracias.",
  ],

  terminos: {
    titulo: "Términos del servicio",
    bajada: "Qué te damos, qué te cobramos y cuándo. En castellano, sin letra chica.",
    descripcion: "Qué te damos, qué te cobramos, cuándo podés arrepentirte y de quién es la historia.",
    // APROBADO por Naza · L2-06 (18/10, con sus correcciones)
    enCorto: [
      "Pago único, por adelantado. Sin suscripción y sin renovación automática.",
      "La entrevista es por WhatsApp, con audios, al ritmo del narrador. Nada empieza sin su permiso. Si no acepta, o si contesta menos de diez preguntas, te devolvemos todo.",
      "Antes de cerrar el libro lo revisás vos. Lo que se imprime es lo que aprobás.",
      "Con el libro ya escrito vale el plazo de la ley, 10 días corridos desde que recibís el libro en Argentina (desde la compra, si es solo digital) y 14 días naturales desde la compra en España.",
      "La historia, los audios y la voz son de tu familia. Nunca los publicamos. El libro entero solo se abre con el código del libro impreso, o con el enlace que vos compartas.",
    ],
    secciones: [
      {
        id: "quienes-somos",
        titulo: "1. Quiénes somos",
        bloques: [
          // APROBADO por Naza · L2-02 (18/10, con sus correcciones)
          p("Vitácora Familiar lo presta una sola persona en los dos países donde vendemos, con un alta fiscal en cada uno. Qué datos y qué ley se aplican a tu compra depende de la región que elegís al comprar (la misma que decide la moneda y el medio de pago):"),
          lista(
            "Si comprás desde **Argentina** (en pesos): {titular:AR}.",
            "Si comprás desde **España** (en euros): {titular:ES}.",
          ),
          p("En estos términos, «nosotros» es esa persona, con los datos de tu región. Para cualquier cosa escribí a {hola} (o a {soporte} si es un problema con la web) y te contestamos."),
        ],
      },
      {
        id: "que-es",
        titulo: "2. Qué es el servicio",
        bloques: [
          p("Entrevistamos por WhatsApp a la persona que nos indicás (el «narrador»): le llega una pregunta, la responde con un audio cuando quiere, sin instalar nada, y cuando termina de contar le llega la siguiente. Con sus respuestas escribimos el libro, en primera persona y con sus propias palabras."),
          // APROBADO por Naza · L2-03 (18/10, con sus correcciones)
          p("Hay tres libros:"),
          lista(
            "**Familiar**: el libro de una vida, la de otra persona, que vos le regalás. El narrador es esa persona.",
            "**Para vos**: tu propio libro. El narrador sos vos, y las preguntas te llegan a tu WhatsApp.",
            "**De viaje**: el libro de un viaje. Las preguntas le llegan al viajero por WhatsApp antes de salir y durante el viaje, las contesta con audios cuando quiere, y al volver nos manda las fotos para el álbum. Con eso escribimos el libro del viaje, con el álbum al final. Puede ser para vos o un regalo.",
          ),
          p("Lo que podés comprar:"),
          lista(
            // APROBADO por Naza · L1-08 (18/10, con sus correcciones)
            "**El libro en PDF**: se lee en la web, capítulo por capítulo, con las fotos que suba la familia. Incluye **«Su voz»**: sus mejores frases, recortes de sus audios originales con el sonido limpio y parejo (no se clona ni se imita su voz), para escuchar en la web y con un código impreso. Está siempre disponible en tu cuenta.",
            "**El libro impreso**, en blanco y negro o a color: tapa dura, con un código en la contratapa que hace sonar su voz.",
            "**Marcos con su voz**: un marco con su foto y un chip; se acerca el celular y suena su voz.",
          ),
          p("Hace falta comprar al menos uno de los dos primeros; los marcos van con el libro impreso. Solo se ofrece lo que tiene precio publicado en tu región."),
          p("Desde tu cuenta podés invitar a familiares para que lean el libro y suban fotos, y compartir una muestra pública (portada, títulos de los capítulos, el primer párrafo y un minuto de audio). La muestra solo existe si vos compartís el enlace."),
          p("El libro impreso lleva dos códigos: uno al lado de cada frase de «Su voz», que la hace sonar, y otro en la contratapa, que abre en el celular el libro entero —el texto y todas sus frases— sin necesidad de cuenta ni contraseña. Quien tenga el libro en la mano puede abrirlos y reenviar ese enlace: contáselo a quien se lo regales."),
        ],
      },
      {
        id: "compra",
        titulo: "3. Cómo se compra",
        bloques: [
          p("Es un **pago único, por adelantado**. No hay suscripción, no hay renovación automática y no guardamos tu tarjeta: el cobro lo hace Stripe (España) o Mercado Pago (Argentina) y ellos son los únicos que ven tus datos de pago."),
          // APROBADO por Naza · L2-04 (18/10, con sus correcciones)
          p("El precio de cada producto aparece antes de pagar, en euros o en pesos según la región que elijas, y es el precio final que pagás (en España, con el IVA incluido). Después del pago te llega un correo para entrar a tu cuenta con un código (sin contraseña) y anotar a tu narrador: su nombre, su WhatsApp y unos pocos datos para que las preguntas le suenen a él."),
          p("Por cada compra te mandamos la factura por correo: en Argentina, la factura electrónica, dentro de los 5 días hábiles después del pago; en España, la factura con el IVA desglosado."),
        ],
      },
      {
        id: "permiso",
        titulo: "4. Nada empieza sin su permiso",
        bloques: [
          // APROBADO por Naza · L2-05 (18/10, con sus correcciones)
          p("Al anotar a alguien nos confirmás que podés hacerlo y que le va a parecer bien. Antes de la primera pregunta le escribimos por WhatsApp contándole quién lo anotó y le pedimos permiso. **Si no acepta, no empieza nada y te devolvemos el dinero completo** (ver la sección 7). En ese caso, en 15 días borramos su nombre, su número, su ficha y sus fotos, y solo guardamos lo necesario para la factura y la devolución."),
          p("El narrador manda en su historia: puede parar cuando quiera, retomar cuando quiera, responder solo lo que quiera, y pedir que borremos todo lo que grabó. Si deja de responder unos días, te avisamos por correo."),
        ],
      },
      {
        id: "entrega",
        titulo: "5. Qué te entregamos y cuándo",
        bloques: [
          p("El ritmo lo pone el narrador: la entrevista dura lo que él tarde en responder, y podés seguirla desde tu cuenta mientras avanza. Cuando termina, producimos el libro y te avisamos por correo. Antes de darlo por cerrado lo revisás vos: podés cambiar el título, el orden y los nombres de los capítulos, las fotos de la portada y la contratapa, dejar fuera alguna respuesta y pedir correcciones de lo que no suene a él."),
          p("El libro en PDF y sus frases en su voz quedan disponibles en tu cuenta. El libro impreso y los marcos se producen después de que aprobás el libro; antes de mandarlos a producir te escribimos para pedirte la dirección de envío y confirmarte el plazo."),
        ],
      },
      {
        id: "arrepentimiento",
        titulo: "6. Si te arrepentís",
        bloques: [
          // APROBADO por Naza · L1-01 (18/10, con sus correcciones) · alineado a la regla de las diez preguntas (Naza 19/10)
          p("Podés arrepentirte sin dar explicaciones: escribinos a {hola} o usá el [botón de arrepentimiento](/legal/arrepentimiento). Te confirmamos que lo recibimos dentro de las 24 horas y te devolvemos el dinero por el mismo medio con el que pagaste, en un plazo máximo de 14 días. Funciona en tres capas, en este orden:"),
          p("**Primero, lo que te damos nosotros.** Además de lo que te da la ley, cada libro tiene su garantía, que explicamos en la [sección 7](/legal/terminos#garantia). Es más de lo que pide la ley."),
          p("**Después, lo que te da la ley, cuando el libro ya está escrito.** Depende de la región en la que compraste:"),
          lista(
            // APROBADO por Naza · L1-02 (18/10, con sus correcciones)
            "**Si compraste en Argentina (en pesos) — 10 días corridos** desde que recibís el libro, o desde la compra si el libro es solo digital, lo que ocurra último (art. 34 de la ley 24.240). Podés revocar la compra sin costo alguno: te devolvemos el total, y si hay que devolver el libro impreso o el marco, el envío de vuelta lo pagamos nosotros. El botón de arrepentimiento está en la página de inicio, como exige la Resolución 424/2020.",
            // APROBADO por Naza · L1-03 (18/10, con sus correcciones) · alineado a la regla de las diez preguntas (Naza 19/10)
            "**Si compraste en España (en euros) — 14 días naturales** desde la compra (derecho de desistimiento, arts. 102 a 108 del RDL 1/2007). Al pagar nos pedís que la entrevista empiece en cuanto el narrador acepte, sin esperar esos 14 días; aun así, vale la garantía de la sección 7. Una vez que el libro en PDF y sus frases en su voz están a tu disposición en tu cuenta, con tu consentimiento, el desistimiento ya no aplica sobre ellos (art. 103 m).",
          ),
          // APROBADO por Naza · L1-04 (18/10, con sus correcciones)
          p("**Por último, lo que no se devuelve.** Si compraste en España: el libro en PDF ya entregado en tu cuenta (art. 103 m), y el libro impreso y los marcos, que se hacen a medida con la historia y las fotos de tu familia y que aprobás antes de imprimir (art. 103 c). En las dos regiones, si algo llega dañado o con un defecto, lo reponemos sin costo."),
          p("Estos plazos son los que marca la ley de cada país; nunca te van a dar menos derechos de los que te corresponden como consumidor donde vivís."),
        ],
      },
      seccionGarantia("ar", "7"),
      {
        id: "historia",
        titulo: "8. La historia es de tu familia",
        bloques: [
          // APROBADO por Naza · L1-07 (18/10, con sus correcciones)
          p("Lo que cuenta tu narrador es suyo y de tu familia. No nos quedamos con ningún derecho sobre su historia, sus audios, sus fotos ni su voz: nos das únicamente el permiso necesario para transcribir, escribir, maquetar, recortar sus frases e imprimir tu libro. Nunca la usamos como ejemplo, nunca publicamos su historia ni se la mostramos a nadie fuera de tu familia, salvo la muestra que vos decidas compartir y quien tenga el libro en la mano: el código de la contratapa abre el libro completo, y ese enlace se puede reenviar. Si algún día quisiéramos mostrar una página como muestra de nuestro trabajo, te lo pediríamos por escrito y podrías decir que no."),
          // APROBADO por Naza · L1-08 (18/10, con sus correcciones)
          p("Sus frases en su voz son recortes de sus audios originales, con el sonido limpio y parejo; no se clona ni se imita su voz. No se usan para ningún otro fin y se borran cuando el narrador o vos lo pidan."),
        ],
      },
      {
        id: "uso",
        titulo: "9. Lo que te pedimos a vos",
        bloques: [
          lista(
            "Anotá solo a alguien a quien puedas anotar y que vaya a estar de acuerdo. El servicio no sirve para grabar, vigilar ni acosar a nadie.",
            "Las fotos y los nombres que subas vos o tus invitados son responsabilidad de quien los sube: no subas material de otras personas sin su permiso.",
            "Tu cuenta es tuya: el código de acceso que te mandamos por correo no lo compartas. Si creés que alguien entró sin permiso, avisanos.",
          ),
        ],
      },
      {
        id: "promesas",
        titulo: "10. Qué te prometemos y qué no",
        bloques: [
          p("Te prometemos que el libro se escribe con las palabras de tu narrador, que para él va a ser fácil —un audio de WhatsApp cuando quiera— y que si algo sale mal lo arreglamos o te devolvemos el dinero."),
          p("Para transcribir los audios y para redactar los capítulos usamos inteligencia artificial, y puede equivocarse: un nombre mal oído, una fecha, un giro que no le pertenece. Por eso el libro no se cierra hasta que lo revisás vos, y por eso te pedimos que lo leas antes de aprobarlo. Lo que se imprime es lo que aprobaste."),
          p("No podemos prometerte cuánto va a querer contar tu narrador ni cuántas preguntas va a responder. Si cuenta poco, el libro sale más corto."),
          // APROBADO por Naza · L1-09 (18/10, con sus correcciones)
          p("Si algo falla por nuestra culpa, respondemos conforme a la ley. No limitamos nuestra responsabilidad por dolo ni por daños a las personas, ni ningún derecho que te dé la ley de tu país."),
        ],
      },
      {
        id: "datos",
        titulo: "11. Tus datos",
        bloques: [
          p("Qué guardamos, quién lo procesa, por cuánto tiempo y cómo borrarlo está en la [política de privacidad](/legal/privacidad). Lo resumido: los audios y la voz son de tu familia, se usan solo para su libro, no se usan para entrenar ningún modelo y se borran cuando lo pidas."),
        ],
      },
      {
        id: "cambios",
        titulo: "12. Si algo cambia",
        bloques: [
          p("Si modificamos estos términos, te avisamos por correo antes de que te afecten. Los cambios nunca se aplican hacia atrás sobre un libro ya pagado: para ese libro valen los términos que aceptaste al comprar."),
        ],
      },
      {
        id: "ley",
        titulo: "13. Ley y jurisdicción",
        bloques: [
          lista(
            "Si comprás desde **España**, el contrato se rige por {ley:ES}. Cualquier disputa se resuelve en los juzgados de tu domicilio. También podés acudir a la oficina de consumo de tu comunidad autónoma o a una Junta Arbitral de Consumo; tenés hojas de reclamaciones a tu disposición pidiéndolas por correo.",
            "Si comprás desde **Argentina**, el contrato se rige por {ley:AR}. Podés reclamar ante la autoridad de Defensa del Consumidor de tu jurisdicción o por la [ventanilla única federal](https://www.argentina.gob.ar/produccion/defensadelconsumidor).",
          ),
          p("En los dos casos conservás siempre los derechos que te da la ley del país donde vivís. Antes de cualquier reclamo formal, escribinos: lo normal es que lo resolvamos en un correo."),
        ],
      },
      {
        id: "contacto",
        titulo: "14. Contacto",
        bloques: [
          p("{hola} para todo lo que tenga que ver con tu libro, tu compra o una devolución. {soporte} si algo no funciona en la web. Contestamos en días hábiles."),
        ],
      },
    ],
  },

  privacidad: {
    titulo: "Privacidad",
    bajada: "Qué guardamos de tu familia, quién lo procesa, por cuánto tiempo y cómo borrarlo.",
    descripcion: "Qué guardamos de tu familia, quién lo procesa, por cuánto tiempo y cómo borrarlo.",
    enCorto: [
      "Usamos tus datos y los de tu familia solo para hacer el libro.",
      "No los vendemos, no los usamos para publicidad y no entrenamos ningún modelo de inteligencia artificial con ellos.",
      // APROBADO por Naza · L3-01 (18/10, con sus correcciones)
      "Los audios originales se borran 3 meses después de producir el libro, o antes si lo pide el narrador o lo pedís vos. Quedan solo los recortes de «Su voz».",
      "Solo usamos cookies técnicas, ni de publicidad ni de analítica.",
      "Para cualquier cosa sobre tus datos, alcanza un correo a {hola}.",
    ],
    secciones: [
      {
        id: "responsables",
        titulo: "1. Quién responde por tus datos",
        bloques: [
          // APROBADO por Naza · L2-02 (18/10, con sus correcciones)
          p("El responsable del tratamiento es el titular del servicio, una sola persona, con los datos de la región que elegiste al comprar:"),
          lista("**Argentina**: {titular:AR}.", "**España**: {titular:ES}."),
          p("Para cualquier cosa sobre tus datos escribí a {hola}. No hace falta formulario ni formalidad: un correo alcanza."),
        ],
      },
      {
        id: "a-quien",
        titulo: "2. A quién aplica",
        bloques: [
          p("Esta política habla de cuatro personas distintas:"),
          lista(
            "**Quien compra** y tiene la cuenta (llamémosla «vos»).",
            "**El narrador**: la persona a la que entrevistamos por WhatsApp.",
            "**Los invitados**: familiares a los que invitás a leer el libro y subir fotos.",
            "**Quien visita la web** sin cuenta, o abre la muestra pública de un libro.",
          ),
        ],
      },
      {
        id: "que-datos",
        titulo: "3. Qué datos guardamos",
        bloques: [
          p("**De vos**: tu nombre, tu correo, la región que elegiste, y qué compraste, cuándo y por qué medio. Tu tarjeta no la vemos nunca: la cobra Stripe o Mercado Pago y a nosotros nos llega solo la confirmación. Cuando entrás a tu cuenta guardamos los registros técnicos normales de cualquier web (dirección IP, navegador, hora)."),
          // APROBADO por Naza · L3-03 (18/10, con sus correcciones)
          p("**La dirección de envío**: si comprás el libro impreso o un marco, la dirección y el nombre de quien lo recibe. Solo la usamos para mandarlo: se la pasamos a la imprenta y a la mensajería, y después queda con los datos de la compra."),
          p("**Del narrador**: su nombre y cómo le gusta que le digan, su número de WhatsApp, su zona horaria, y los datos que nos das para que las preguntas le suenen a él (dónde y cuándo nació, a qué se dedicó, quién es quién en su familia), y lo importante: los **audios** que graba, las **transcripciones** que hacemos de ellos, los **textos** del libro y las **fotos** que sube la familia."),
          // APROBADO por Naza · L3-02 (18/10, con sus correcciones)
          p("**Del viajero**, en el libro de viaje: además de lo anterior, las fechas de salida y de vuelta y el país principal del viaje (para mandarle los mensajes a una hora razonable donde esté), las preguntas propias que escribe quien regala, si las hay, y las fotos del álbum que nos manda por WhatsApp, en las que pueden aparecer otras personas que viajan con él."),
          // APROBADO por Naza · L1-08 (18/10, con sus correcciones)
          p("**Su voz**: sus mejores frases son recortes de sus audios originales, con el sonido limpio y parejo, para escucharlas en la web y con el código impreso en el libro. No se clona ni se imita su voz. Si algún día ofreciéramos un producto con su voz clonada —un **dato biométrico**—, solo lo haríamos con el consentimiento explícito del narrador, pedido por WhatsApp para ese fin concreto."),
          p("**De los invitados**: su correo (para invitarlos), su nombre si entran, y las fotos que suben."),
          p("**De quien visita**: nada que lo identifique. Solo los registros técnicos del servidor y las cookies de la sección 12."),
        ],
      },
      {
        id: "para-que",
        titulo: "4. Para qué los usamos, y con qué derecho",
        bloques: [
          lista(
            "**Para hacer tu libro**: entrevistar, transcribir, escribir, maquetar, recortar sus frases de sus audios, imprimir y mostrarte el resultado. Es el contrato que aceptaste al comprar.",
            "**Para hablar con el narrador por WhatsApp**, hacerle las preguntas y guardar sus respuestas: con su consentimiento, que le pedimos antes de la primera pregunta y que puede retirar cuando quiera.",
            "**Para avisarte** por correo cómo va (cuando acepta, cuando responde la primera, a mitad de camino, si se queda en silencio, cuando el libro está listo). Es parte del servicio.",
            "**Para facturar y cumplir la ley**: guardar los datos de la compra el tiempo que exige la normativa fiscal.",
            "**Para que la web funcione y sea segura**: registros técnicos y cookies de sesión, por interés legítimo en que nadie entre a una cuenta ajena.",
          ),
          p("Nada más. No usamos tus datos ni los de tu familia para publicidad, no los vendemos, no los cedemos a nadie que no necesite tocarlos para hacer tu libro, y no entrenamos ningún modelo de inteligencia artificial con ellos."),
        ],
      },
      {
        id: "quien-procesa",
        titulo: "5. Quién procesa los datos por nosotros",
        bloques: [
          p("Para hacer el libro nos apoyamos en estos servicios. Cada uno ve solo lo que necesita para su parte, con un contrato que le prohíbe usarlo para otra cosa:"),
          tabla(
            ["Quién", "Para qué", "Dónde"],
            [
              ["Supabase", "La base de datos y el almacén de audios, fotos, libros y sus frases en su voz. También el acceso a tu cuenta.", "Unión Europea"],
              ["Vercel", "Aloja la web que estás leyendo y la página de la historia.", "Estados Unidos (red global)"],
              ["Railway", "Corre el entrevistador (el que manda y recibe los WhatsApp) y la fábrica que produce el libro y elige sus frases.", "Estados Unidos"],
              ["Meta (WhatsApp Business)", "Lleva y trae los mensajes y audios entre el narrador y nosotros. Meta ve los mensajes como los vería en cualquier chat de WhatsApp Business.", "Según las reglas de Meta"],
              ["OpenAI", "Transcribe los audios a texto. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
              ["Anthropic", "Redacta los capítulos a partir de las transcripciones, con las palabras del narrador. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
              ["Stripe / Mercado Pago", "Cobran. Son los únicos que ven tu tarjeta.", "Stripe: UE y EE. UU. · Mercado Pago: Argentina"],
              ["Resend", "Manda los correos: el código para entrar y los avisos.", "Brasil (región de América del Sur)"],
              ["Imprenta y mensajería", "Solo si comprás el libro impreso o los marcos: reciben el archivo, tu nombre y la dirección de envío.", "Bookmundo, en Países Bajos (Unión Europea), para los libros de España. En Argentina te decimos cuál antes de mandar a imprimir"],
              ["Sentry", "Avisa de los errores técnicos de la web y del entrevistador. No recibe nombres, mensajes ni audios.", "Unión Europea (Alemania)"],
              ["Cloudflare", "Guarda una copia de seguridad de los audios, las fotos y los libros, por si se pierden. Lo que borramos se borra también de la copia a los 30 días.", "Unión Europea"],
            ],
          ),
        ],
      },
      {
        id: "transferencias",
        titulo: "6. Datos que salen de tu país",
        bloques: [
          // APROBADO por Naza · L3-04 (18/10, con sus correcciones)
          p("Como ves en la tabla, algunos de esos servicios están fuera de tu país: en Estados Unidos y, en el caso de los correos, en Brasil."),
          lista(
            "**Si estás en Argentina**: tus datos viajan a Estados Unidos (y los correos, a Brasil) para que estos proveedores hagan su parte, bajo sus contratos de tratamiento de datos. La decisión de adecuación de la Unión Europea sobre Argentina sirve para los datos que van de Europa a Argentina; no cubre los que salen de Argentina hacia Estados Unidos, y por eso lo contamos aparte.",
            "**Si estás en la Unión Europea**: las transferencias a Estados Unidos se hacen bajo el Marco de Privacidad de Datos UE-EE. UU. o con las cláusulas contractuales tipo aprobadas por la Comisión Europea, según el proveedor. Brasil no tiene decisión de adecuación de la Unión Europea: los correos van con las garantías contractuales del proveedor.",
          ),
          p("Si querés ver los contratos con un proveedor concreto, pedilos por correo."),
        ],
      },
      {
        id: "cuanto-tiempo",
        titulo: "7. Cuánto tiempo los guardamos",
        bloques: [
          // APROBADO por Naza · L3-05 (18/10, con sus correcciones)
          lista(
            "**Los audios originales**: 3 meses desde que producimos el libro. Después los borramos y quedan solo los recortes de «Su voz». Si lo pide el narrador, o lo pedís vos, se borran antes.",
            "**El libro, sus frases en su voz y las fotos**: mientras exista tu cuenta, para que la familia vuelva a ellos cuando quiera. Si pedís borrar sus frases en su voz, se borran, y los códigos del libro impreso dejan de sonar.",
            "**Si el narrador no acepta participar**: en 15 días borramos su nombre, su número, su ficha y sus fotos.",
            "**Tu cuenta**: hasta que pidas cerrarla. Si la cerrás, borramos todo lo de arriba.",
            "**Los datos de la compra** (qué, cuándo, cuánto, a nombre de quién y adónde lo mandamos): el tiempo que exige la ley fiscal de cada país, aunque cierres la cuenta.",
            "**Los registros técnicos**: unos meses, solo para seguridad.",
            "**Las copias de seguridad**: se borran solas. Las de la base de datos, a los 7 días; las de los audios, las fotos y los libros, 30 días después de que los borramos.",
          ),
        ],
      },
      {
        id: "con-quien",
        titulo: "8. Con quién compartimos",
        bloques: [
          p("Con nadie, salvo los proveedores de la sección 5 y la familia que vos elijas: los invitados ven el libro y las fotos, y quien abra un enlace de muestra que vos compartiste ve la portada, los títulos de los capítulos, el primer párrafo y un minuto de audio. El libro impreso lleva además un código en la contratapa (y uno al lado de cada frase de «Su voz») que abre en el celular el libro entero y sus frases, sin cuenta: quien tenga el libro en la mano puede abrirlo y reenviar ese enlace, igual que podría prestar el libro. Nunca vendemos datos, nunca los usamos para publicidad y nunca los entregamos a terceros salvo obligación legal."),
        ],
      },
      {
        id: "derechos",
        titulo: "9. Tus derechos (y los del narrador)",
        bloques: [
          p("Vos, el narrador y cada invitado pueden pedir en cualquier momento: **acceder** a sus datos, **corregirlos**, **borrarlos**, **llevárselos** en un formato usable (el libro en PDF, sus frases y los audios originales), **oponerse** a un uso o pedir que lo **limitemos**, y **retirar un consentimiento** (por ejemplo, el del narrador para seguir la entrevista) sin que eso afecte lo hecho hasta entonces."),
          p("Cómo: un correo a {hola} desde la dirección de tu cuenta (o, si sos el narrador, un mensaje por el mismo WhatsApp). Contestamos en un mes como máximo; casi siempre en días. Si creés que no te hicimos caso, podés reclamar ante la {autoridad:ES} si estás en España o ante la {autoridad:AR} si estás en Argentina."),
        ],
      },
      {
        id: "menores",
        titulo: "10. Menores",
        bloques: [
          p("Para comprar hay que ser mayor de edad. El narrador da su propio permiso por WhatsApp; si el narrador fuera menor de edad, el permiso tiene que darlo quien ejerza su patria potestad, y te pedimos que nos lo digas al anotarlo."),
        ],
      },
      {
        id: "seguridad",
        titulo: "11. Cómo los cuidamos",
        bloques: [
          p("Los audios, las fotos y los libros están en un almacén privado: no tienen enlaces públicos, y cada archivo se entrega solo a quien tiene derecho a verlo, con un enlace que caduca (el código del libro impreso es un enlace firmado por nosotros: abre ese libro y nada más). A tu cuenta se entra con un código de un solo uso que te mandamos por correo; no hay contraseñas que se puedan filtrar. Las conexiones van cifradas. El acceso de los socios a los datos está limitado a lo necesario para producir tu libro y resolver problemas."),
        ],
      },
      {
        id: "cookies",
        titulo: "12. Cookies",
        bloques: [
          p("Usamos solo cookies técnicas, las imprescindibles para que la web funcione: la que mantiene tu sesión abierta cuando entrás a tu cuenta, la que recuerda si preferís la página de la historia en claro o en oscuro y la que recuerda el idioma que elegís en la web. Mientras comprás, el navegador guarda en esa pestaña lo que vas completando, para no perderlo si volvés atrás; se borra al cerrarla. Si llegás a la web desde un anuncio, recordamos de cuál solo mientras dura esa visita, sin guardar nada en tu navegador. Si comprás en esa misma visita, lo anotamos con tu pedido para saber qué anuncios funcionan. No usamos cookies de publicidad ni de analítica, y por eso no te mostramos ningún aviso. Si algún día sumamos una herramienta de medición, te vamos a pedir consentimiento antes de activarla y esta sección va a cambiar."),
        ],
      },
      {
        id: "ia",
        titulo: "13. Inteligencia artificial",
        bloques: [
          p("Usamos modelos de inteligencia artificial para tres cosas: transcribir los audios, redactar los capítulos con las palabras del narrador, y elegir, entre lo que dijo, las frases que van en «Su voz». Los modelos son de OpenAI y Anthropic, contratados por API, y ninguno usa lo que les mandamos para entrenar. Nosotros tampoco entrenamos nada con tu familia. Las decisiones que importan las toma una persona: vos aprobás el libro antes de que se cierre, y no hay ninguna decisión automatizada que te afecte legalmente."),
        ],
      },
      {
        id: "cambios",
        titulo: "14. Si esto cambia",
        bloques: [
          p("Si cambiamos esta política de forma que te afecte —un proveedor nuevo, un uso nuevo— te avisamos por correo antes, y si el cambio necesita tu consentimiento, te lo pedimos. La fecha de arriba dice cuándo fue la última vez que la tocamos."),
        ],
      },
      {
        id: "contacto",
        titulo: "15. Contacto",
        bloques: [
          // APROBADO por Naza · L2-02 (18/10, con sus correcciones)
          p("{hola} para todo lo que tenga que ver con tus datos, los del narrador o los de un invitado. Te contesta una persona, no un sistema."),
        ],
      },
    ],
  },

  arrepentimiento: {
    titulo: "Botón de arrepentimiento",
    bajada: "Si te arrepentiste de la compra, esto es todo lo que hay que hacer.",
    descripcion: "Cómo arrepentirte de una compra y pedir la devolución.",
    enCorto: [
      "Se pide con un correo. No hace falta que expliques por qué.",
      "Te confirmamos que lo recibimos dentro de las 24 horas y te devolvemos el dinero por el mismo medio con el que pagaste, en 14 días como máximo.",
      // APROBADO por Naza · L1-10 (18/10, con sus correcciones)
      "Si el narrador contesta menos de diez preguntas, te devolvemos todo. Por ley, 10 días corridos desde que recibís el libro en Argentina, sin costo, y 14 días naturales desde la compra en España.",
    ],
    secciones: [
      {
        id: "como",
        titulo: "Cómo se hace",
        bloques: [
          p("Apretá el botón: se abre un correo a {hola} con el asunto ya escrito. Completá tu correo de compra y el nombre del narrador, y mandalo. No hace falta que expliques por qué."),
          BOTON,
          p("Si el botón no te abre el correo, escribí vos a {hola} con el asunto «Arrepentimiento de compra»."),
        ],
      },
      {
        id: "despues",
        titulo: "Qué pasa después",
        bloques: [
          lista(
            "Te confirmamos por correo que lo recibimos, dentro de las 24 horas.",
            "Si la entrevista había empezado, la paramos y le avisamos al narrador con cuidado.",
            "Te devolvemos el dinero por el mismo medio con el que pagaste, en un plazo máximo de 14 días.",
          ),
        ],
      },
      {
        id: "plazos",
        titulo: "Plazos",
        bloques: [
          // APROBADO por Naza · L1-10 (18/10, con sus correcciones) · alineado a la regla de las diez preguntas (Naza 19/10)
          lista(
            "**La garantía de cada libro.** Si el narrador no acepta, o si contesta menos de diez preguntas, te devolvemos todo. El detalle está al final de esta página.",
            "**Argentina**: 10 días corridos desde que recibís el libro, o desde la compra si el libro es solo digital, lo que ocurra último, sin costo (art. 34 de la ley 24.240). Si hay que devolver el libro impreso o el marco, el envío lo pagamos nosotros.",
            "**España**: 14 días naturales desde la compra. El libro en PDF (con sus frases en su voz) ya entregado en tu cuenta y los productos a medida (impreso, marcos) no se pueden devolver, salvo que lleguen dañados o con un defecto.",
            "**Aunque no lo pidas**: si el narrador no acepta participar, o la entrevista termina sin material para un libro (ver la sección 7 de los términos), te escribimos y te devolvemos todo en un plazo máximo de 14 días.",
          ),
          p("El detalle está en la sección [«Si te arrepentís» de los términos](/legal/terminos#arrepentimiento)."),
        ],
      },
      {
        // APROBADO por Naza · L2-01 (18/10, con sus correcciones)
        id: "formulario",
        titulo: "Si compraste en España: el formulario de desistimiento",
        bloques: [
          p("La ley española (anexo B del RDL 1/2007) tiene un modelo oficial de formulario de desistimiento. Si compraste en euros y preferís usarlo, copiá este texto, completalo y mandalo a {hola}. No es obligatorio: el botón de arriba vale lo mismo."),
          formulario(
            "A la atención de {titular:ES}, correo {hola}:",
            "Por la presente le comunico/comunicamos (*) que desisto de mi/desistimos de nuestro (*) contrato de venta del siguiente bien/prestación del siguiente servicio (*):",
            "Pedido el/recibido el (*):",
            "Nombre del consumidor o de los consumidores:",
            "Domicilio del consumidor o de los consumidores:",
            "Firma del consumidor o de los consumidores (solo si el presente formulario se presenta en papel):",
            "Fecha:",
            "(*) Táchese lo que no proceda.",
          ),
        ],
      },
      seccionGarantia("ar"),
    ],
  },
  // APROBADO por Naza el 19/10 · tanda 5, textos 32–35 y 38, de vos (falta el abogado)
  reclamaciones: {
    titulo: "Reclamaciones y atención",
    bajada: "Si algo no salió bien, escribinos. Te contesta una persona del equipo de Vitácora.",
    descripcion: "Si algo no salió bien, escribinos. Te contesta una persona del equipo de Vitácora.",
    enCorto: [],
    secciones: [
      {
        id: "atencion",
        titulo: "",
        bloques: [
          whatsapp(
            "Por WhatsApp al {whatsapp} o por correo a {soporte}, de lunes a viernes de 10 a 18, hora de España.",
            "Por correo a {soporte}, de lunes a viernes de 10 a 18, hora de España.",
          ),
          p("Te respondemos en un plazo máximo de 30 días."),
          // Sin los textos 36 (hoja oficial) y 37 (Junta Arbitral): son de España.
          // Solo /ar: Disp. 954/2025 art. 5. El número de seguimiento se manda a mano.
          p("Cuando nos escribas por un reclamo, en menos de 24 horas te mandamos un número para seguirlo."),
        ],
      },
    ],
  },
};

// ─── Catalán (tú) ─────────────────────────────────────────────────────────
// ca: revisado con el corrector de Softcatalà (19/10) Y ABOGADO. Traducción de ES hecha por Claude
// Code el 14/10. Los nombres de leyes y organismos van con su nombre oficial.

const CA: TextosLegal = {
  actualizado: "Darrera actualització",
  fecha: "19 d'octubre de 2026",
  enCorto: "En resum",
  indice: "En aquesta pàgina",
  documentos: "Textos legals",
  cierre: "Dubtes, una devolució, o vols que esborrem alguna cosa? Escriu a {hola} i et responem.",
  conDomicilio: "amb domicili a",
  aCompletar: "per completar",
  boton: "Vull desistir de la meva compra",
  asunto: "Desistiment de compra",
  cuerpo: [
    "Hola. Vull desistir de la meva compra a Vitácora Familiar.",
    "",
    "Correu amb què vaig comprar: ",
    "Nom del narrador: ",
    "Data de la compra (aproximada): ",
    "",
    "Gràcies.",
  ],

  terminos: {
    titulo: "Termes del servei",
    bajada: "Què et donem, què et cobrem i quan. Sense lletra petita.",
    descripcion: "Què et donem, què et cobrem, quan pots desistir i de qui és la història.",
    // APROBADO por Naza · L2-06 (18/10, con sus correcciones)
    enCorto: [
      "Pagament únic, per avançat. Sense subscripció i sense renovació automàtica.",
      "L'entrevista és per WhatsApp, amb àudios, al ritme del narrador. No comença res sense el seu permís. Si no accepta, o si contesta menys de deu preguntes, t'ho retornem tot.",
      "Abans de tancar el llibre el revises tu. El que s'imprimeix és el que aproves.",
      "Amb el llibre ja escrit val el termini de la llei, 14 dies naturals des de la compra a Espanya i 10 dies seguits des que reps el llibre a l'Argentina (des de la compra, si és només digital).",
      "La història, els àudios i la veu són de la teva família. No els publiquem mai. El llibre sencer només s'obre amb el codi del llibre imprès, o amb l'enllaç que tu comparteixis.",
    ],
    secciones: [
      {
        id: "quienes-somos",
        titulo: "1. Qui som",
        bloques: [
          // APROBADO por Naza · L2-02 (18/10, con sus correcciones)
          p("Vitácora Familiar el presta una sola persona als dos països on venem, amb una alta fiscal a cadascun. Quines dades i quina llei s'apliquen a la teva compra depèn de la regió que tries en comprar (la mateixa que decideix la moneda i el mitjà de pagament):"),
          lista(
            "Si compres des d'**Espanya** (en euros): {titular:ES}.",
            "Si compres des de l'**Argentina** (en pesos): {titular:AR}.",
          ),
          p("En aquests termes, «nosaltres» és aquesta persona, amb les dades de la teva regió. Per a qualsevol cosa escriu a {hola} (o a {soporte} si és un problema amb la web) i et contestem."),
        ],
      },
      {
        id: "que-es",
        titulo: "2. Què és el servei",
        bloques: [
          p("Entrevistem per WhatsApp la persona que ens indiques (el «narrador»): li arriba una pregunta, la respon amb un àudio quan vol, sense instal·lar res, i quan acaba d'explicar li arriba la següent. Amb les seves respostes escrivim el llibre, en primera persona i amb les seves pròpies paraules."),
          // APROBADO por Naza · L2-03 (18/10, con sus correcciones)
          p("Hi ha tres llibres:"),
          lista(
            "**Familiar**: el llibre d'una vida, la d'una altra persona, que tu li regales. El narrador és aquesta persona.",
            "**Per a tu**: el teu propi llibre. El narrador ets tu, i les preguntes t'arriben al teu WhatsApp.",
            "**De viatge**: el llibre d'un viatge. Les preguntes arriben al viatger per WhatsApp abans de sortir i durant el viatge, les contesta amb àudios quan vol, i en tornar ens envia les fotos per a l'àlbum. Amb això escrivim el llibre del viatge, amb l'àlbum al final. Pot ser per a tu o un regal.",
          ),
          p("El que pots comprar:"),
          lista(
            // APROBADO por Naza · L1-08 (18/10, con sus correcciones)
            "**El llibre en PDF**: es llegeix a la web, capítol per capítol, amb les fotos que pugi la família. Inclou **«La seva veu»**: les seves millors frases, retalls dels seus àudios originals amb el so net i uniforme (no es clona ni s'imita la seva veu), per escoltar a la web i amb un codi imprès. Sempre està disponible al teu compte.",
            "**El llibre imprès**, en blanc i negre o en color: tapa dura, amb un codi a la contracoberta que fa sonar la seva veu.",
            "**Marcs amb la seva veu**: un marc amb la seva foto i un xip; s'hi apropa el mòbil i sona la seva veu.",
          ),
          p("Cal comprar com a mínim un dels dos primers; els marcs van amb el llibre imprès. Només s'ofereix el que té preu publicat a la teva regió."),
          p("Des del teu compte pots convidar familiars perquè llegeixin el llibre i pugin fotos, i compartir una mostra pública (portada, títols dels capítols, el primer paràgraf i un minut d'àudio). La mostra només existeix si tu comparteixes l'enllaç."),
          p("El llibre imprès porta dos codis: un al costat de cada frase de «La seva veu», que la fa sonar, i un altre a la contracoberta, que obre al mòbil el llibre sencer —el text i totes les seves frases— sense necessitat de compte ni contrasenya. Qui tingui el llibre a la mà els pot obrir i reenviar aquest enllaç: explica-ho a qui li regalis."),
        ],
      },
      {
        id: "compra",
        titulo: "3. Com es compra",
        bloques: [
          p("És un **pagament únic, per avançat**. No hi ha subscripció, no hi ha renovació automàtica i no guardem la teva targeta: el cobrament el fa Stripe (Espanya) o Mercado Pago (Argentina) i són els únics que veuen les teves dades de pagament."),
          // APROBADO por Naza · L2-04 (18/10, con sus correcciones)
          p("El preu de cada producte apareix abans de pagar, en euros o en pesos segons la regió que triïs, i és el preu final que pagues (a Espanya, amb l'IVA inclòs). Després del pagament t'arriba un correu per entrar al teu compte amb un codi (sense contrasenya) i apuntar el teu narrador: el seu nom, el seu WhatsApp i unes quantes dades perquè les preguntes li sonin properes."),
          p("Per cada compra t'enviem la factura per correu: a l'Argentina, la factura electrònica, dins dels 5 dies feiners després del pagament; a Espanya, la factura amb l'IVA desglossat."),
        ],
      },
      {
        id: "permiso",
        titulo: "4. No comença res sense el seu permís",
        bloques: [
          // APROBADO por Naza · L2-05 (18/10, con sus correcciones)
          p("En apuntar algú ens confirmes que ho pots fer i que li semblarà bé. Abans de la primera pregunta li escrivim per WhatsApp explicant-li qui l'ha apuntat i li demanem permís. **Si no accepta, no comença res i et retornem tots els diners** (vegeu la secció 7). En aquest cas, en 15 dies esborrem el seu nom, el seu número, la seva fitxa i les seves fotos, i només guardem el necessari per a la factura i la devolució."),
          p("El narrador mana en la seva història: pot parar quan vulgui, reprendre-ho quan vulgui, respondre només el que vulgui, i demanar que esborrem tot el que ha gravat. Si deixa de respondre uns dies, t'avisem per correu."),
        ],
      },
      {
        id: "entrega",
        titulo: "5. Què et lliurem i quan",
        bloques: [
          p("El ritme el posa el narrador: l'entrevista dura el que ell trigui a respondre, i la pots seguir des del teu compte mentre avança. Quan acaba, produïm el llibre i t'avisem per correu. Abans de donar-lo per tancat el revises tu: pots canviar el títol, l'ordre i els noms dels capítols, les fotos de la portada i la contracoberta, deixar fora alguna resposta i demanar correccions del que no soni a ell."),
          p("El llibre en PDF i les seves frases amb la seva veu queden disponibles al teu compte. El llibre imprès i els marcs es produeixen després que aprovis el llibre; abans d'enviar-los a produir t'escrivim per demanar-te l'adreça d'enviament i confirmar-te el termini."),
        ],
      },
      {
        id: "arrepentimiento",
        titulo: "6. Si te'n desdius",
        bloques: [
          // APROBADO por Naza · L1-01 (18/10, con sus correcciones) · alineado a la regla de las diez preguntas (Naza 19/10)
          p("Pots desistir sense donar explicacions: escriu-nos a {hola} o fes servir el [botó de desistiment](/legal/arrepentimiento). Et confirmem que l'hem rebut dins de les 24 hores i et retornem els diners pel mateix mitjà amb què vas pagar, en un termini màxim de 14 dies. Funciona en tres capes, en aquest ordre:"),
          p("**Primer, el que et donem nosaltres.** A més del que et dona la llei, cada llibre té la seva garantia, que expliquem a la [secció 7](/legal/terminos#garantia). És més del que demana la llei."),
          p("**Després, el que et dona la llei, quan el llibre ja està escrit.** Depèn de la regió on vas comprar:"),
          lista(
            // APROBADO por Naza · L1-03 (18/10, con sus correcciones) · alineado a la regla de las diez preguntas (Naza 19/10)
            "**Si vas comprar a Espanya (en euros) — 14 dies naturals** des de la compra (dret de desistiment, arts. 102 a 108 del RDL 1/2007). En pagar ens demanes que l'entrevista comenci tan bon punt el narrador accepti, sense esperar aquests 14 dies; tot i això, val la garantia de la secció 7. Un cop el llibre en PDF i les seves frases amb la seva veu són a la teva disposició al teu compte, amb el teu consentiment, el desistiment ja no s'hi aplica (art. 103 m).",
            // APROBADO por Naza · L1-02 (18/10, con sus correcciones)
            "**Si vas comprar a l'Argentina (en pesos) — 10 dies seguits** des que reps el llibre, o des de la compra si el llibre és només digital, el que passi més tard (art. 34 de la llei 24.240). Pots revocar la compra sense cap cost: et retornem el total, i si cal retornar el llibre imprès o el marc, l'enviament de tornada el paguem nosaltres. El botó de penediment és a la pàgina d'inici, com exigeix la Resolució 424/2020.",
          ),
          // APROBADO por Naza · L1-04 (18/10, con sus correcciones)
          p("**Finalment, el que no es retorna.** Si vas comprar a Espanya: el llibre en PDF ja lliurat al teu compte (art. 103 m), i el llibre imprès i els marcs, que es fan a mida amb la història i les fotos de la teva família i que aproves abans d'imprimir (art. 103 c). A les dues regions, si alguna cosa arriba malmesa o amb un defecte, la reposem sense cost."),
          p("Aquests terminis són els que marca la llei de cada país; mai no et donaran menys drets dels que et corresponen com a consumidor on vius."),
        ],
      },
      seccionGarantia("ca", "7"),
      {
        id: "historia",
        titulo: "8. La història és de la teva família",
        bloques: [
          // APROBADO por Naza · L1-07 (18/10, con sus correcciones)
          p("El que explica el teu narrador és seu i de la teva família. No ens quedem cap dret sobre la seva història, els seus àudios, les seves fotos ni la seva veu: ens dones únicament el permís necessari per transcriure, escriure, maquetar, retallar les seves frases i imprimir el teu llibre. Mai no la fem servir com a exemple, mai no publiquem la seva història ni l'ensenyem a ningú de fora de la teva família, tret de la mostra que tu decideixis compartir i de qui tingui el llibre a la mà: el codi de la contracoberta obre el llibre complet, i aquest enllaç es pot reenviar. Si algun dia volguéssim mostrar una pàgina com a mostra de la nostra feina, t'ho demanaríem per escrit i podries dir que no."),
          // APROBADO por Naza · L1-08 (18/10, con sus correcciones)
          p("Les seves frases amb la seva veu són retalls dels seus àudios originals, amb el so net i uniforme; no es clona ni s'imita la seva veu. No es fan servir per a cap altra finalitat i s'esborren quan el narrador o tu ho demaneu."),
        ],
      },
      {
        id: "uso",
        titulo: "9. El que et demanem a tu",
        bloques: [
          lista(
            "Apunta només algú que puguis apuntar i que hi estarà d'acord. El servei no serveix per gravar, vigilar ni assetjar ningú.",
            "Les fotos i els noms que pugeu tu o els teus convidats són responsabilitat de qui els puja: no pugis material d'altres persones sense el seu permís.",
            "El teu compte és teu: no comparteixis el codi d'accés que t'enviem per correu. Si creus que algú hi ha entrat sense permís, avisa'ns.",
          ),
        ],
      },
      {
        id: "promesas",
        titulo: "10. Què et prometem i què no",
        bloques: [
          p("Et prometem que el llibre s'escriu amb les paraules del teu narrador, que per a ell serà fàcil —un àudio de WhatsApp quan vulgui— i que si alguna cosa surt malament ho arreglem o et retornem els diners."),
          p("Per transcriure els àudios i per redactar els capítols fem servir intel·ligència artificial, i es pot equivocar: un nom mal entès, una data, un gir que no és seu. Per això el llibre no es tanca fins que el revises tu, i per això et demanem que el llegeixis abans d'aprovar-lo. El que s'imprimeix és el que vas aprovar."),
          p("No et podem prometre quant voldrà explicar el teu narrador ni quantes preguntes respondrà. Si explica poc, el llibre surt més curt."),
          // APROBADO por Naza · L1-09 (18/10, con sus correcciones)
          p("Si alguna cosa falla per culpa nostra, en responem d'acord amb la llei. No limitem la nostra responsabilitat per dol ni per danys a les persones, ni cap dret que et doni la llei del teu país."),
        ],
      },
      {
        id: "datos",
        titulo: "11. Les teves dades",
        bloques: [
          p("Què guardem, qui ho tracta, quant de temps i com esborrar-ho és a la [política de privacitat](/legal/privacidad). En resum: els àudios i la veu són de la teva família, es fan servir només per al seu llibre, no es fan servir per entrenar cap model i s'esborren quan ho demanis."),
        ],
      },
      {
        id: "cambios",
        titulo: "12. Si alguna cosa canvia",
        bloques: [
          p("Si modifiquem aquests termes, t'avisem per correu abans que t'afectin. Els canvis mai no s'apliquen enrere sobre un llibre ja pagat: per a aquest llibre valen els termes que vas acceptar en comprar."),
        ],
      },
      {
        id: "ley",
        titulo: "13. Llei i jurisdicció",
        bloques: [
          lista(
            "Si compres des d'**Espanya**, el contracte es regeix per la llei espanyola i la normativa de la Unió Europea (RGPD, LOPDGDD, LSSI-CE i el text refós de la Llei General per a la Defensa dels Consumidors i Usuaris, RDL 1/2007). Qualsevol disputa es resol als jutjats del teu domicili. També pots acudir a l'oficina de consum de la teva comunitat autònoma o a una Junta Arbitral de Consum; tens fulls de reclamació a la teva disposició demanant-los per correu.",
            "Si compres des de l'**Argentina**, el contracte es regeix per la llei argentina (llei 25.326 de Protecció de les Dades Personals, llei 24.240 de Defensa del Consumidor i Resolució 424/2020 de la Secretaria de Comerç Interior). Pots reclamar davant l'autoritat de Defensa del Consumidor de la teva jurisdicció o per la [finestreta única federal](https://www.argentina.gob.ar/produccion/defensadelconsumidor).",
          ),
          p("En tots dos casos conserves sempre els drets que et dona la llei del país on vius. Abans de qualsevol reclamació formal, escriu-nos: el normal és que ho resolguem en un correu."),
        ],
      },
      {
        id: "contacto",
        titulo: "14. Contacte",
        bloques: [
          p("{hola} per a tot el que tingui a veure amb el teu llibre, la teva compra o una devolució. {soporte} si alguna cosa no funciona a la web. Contestem en dies feiners."),
        ],
      },
    ],
  },

  privacidad: {
    titulo: "Privacitat",
    bajada: "Què guardem de la teva família, qui ho tracta, quant de temps i com esborrar-ho.",
    descripcion: "Què guardem de la teva família, qui ho tracta, quant de temps i com esborrar-ho.",
    enCorto: [
      "Fem servir les teves dades i les de la teva família només per fer el llibre.",
      "No les venem, no les fem servir per a publicitat i no entrenem cap model d'intel·ligència artificial amb elles.",
      // APROBADO por Naza · L3-01 (18/10, con sus correcciones)
      "Els àudios originals s'esborren 3 mesos després de produir el llibre, o abans si ho demana el narrador o ho demanes tu. Només en queden els retalls de «La seva veu».",
      "Només fem servir galetes tècniques, ni de publicitat ni d'analítica.",
      "Per a qualsevol cosa sobre les teves dades, n'hi ha prou amb un correu a {hola}.",
    ],
    secciones: [
      {
        id: "responsables",
        titulo: "1. Qui respon de les teves dades",
        bloques: [
          // APROBADO por Naza · L2-02 (18/10, con sus correcciones)
          p("El responsable del tractament és el titular del servei, una sola persona, amb les dades de la regió que vas triar en comprar:"),
          lista("**Espanya**: {titular:ES}.", "**Argentina**: {titular:AR}."),
          p("Per a qualsevol cosa sobre les teves dades escriu a {hola}. No cal cap formulari ni formalitat: n'hi ha prou amb un correu."),
        ],
      },
      {
        id: "a-quien",
        titulo: "2. A qui s'aplica",
        bloques: [
          p("Aquesta política parla de quatre persones diferents:"),
          lista(
            "**Qui compra** i té el compte (diguem-ne «tu»).",
            "**El narrador**: la persona que entrevistem per WhatsApp.",
            "**Els convidats**: familiars que convides a llegir el llibre i pujar fotos.",
            "**Qui visita la web** sense compte, o obre la mostra pública d'un llibre.",
          ),
        ],
      },
      {
        id: "que-datos",
        titulo: "3. Quines dades guardem",
        bloques: [
          p("**De tu**: el teu nom, el teu correu, la regió que vas triar, i què vas comprar, quan i per quin mitjà. La teva targeta no la veiem mai: la cobra Stripe o Mercado Pago i a nosaltres només ens arriba la confirmació. Quan entres al teu compte guardem els registres tècnics normals de qualsevol web (adreça IP, navegador, hora)."),
          // APROBADO por Naza · L3-03 (18/10, con sus correcciones)
          p("**L'adreça d'enviament**: si compres el llibre imprès o un marc, l'adreça i el nom de qui el rep. Només la fem servir per enviar-lo: la passem a la impremta i a la missatgeria, i després queda amb les dades de la compra."),
          p("**Del narrador**: el seu nom i com li agrada que li diguin, el seu número de WhatsApp, la seva zona horària, i les dades que ens dones perquè les preguntes li sonin properes (on i quan va néixer, a què es va dedicar, qui és qui a la seva família), i el més important: els **àudios** que grava, les **transcripcions** que en fem, els **textos** del llibre i les **fotos** que puja la família."),
          // APROBADO por Naza · L3-02 (18/10, con sus correcciones)
          p("**Del viatger**, en el llibre de viatge: a més del que s'ha dit, les dates de sortida i de tornada i el país principal del viatge (per enviar-li els missatges a una hora raonable allà on sigui), les preguntes pròpies que escriu qui regala, si n'hi ha, i les fotos de l'àlbum que ens envia per WhatsApp, en què poden sortir altres persones que viatgen amb ell."),
          // APROBADO por Naza · L1-08 (18/10, con sus correcciones)
          p("**La seva veu**: les seves millors frases són retalls dels seus àudios originals, amb el so net i uniforme, per escoltar-les a la web i amb el codi imprès al llibre. No es clona ni s'imita la seva veu. Si algun dia oferíssim un producte amb la seva veu clonada —una **dada biomètrica**—, només ho faríem amb el consentiment explícit del narrador, demanat per WhatsApp per a aquesta finalitat concreta."),
          p("**Dels convidats**: el seu correu (per convidar-los), el seu nom si entren, i les fotos que pugen."),
          p("**De qui visita**: res que l'identifiqui. Només els registres tècnics del servidor i les galetes de la secció 12."),
        ],
      },
      {
        id: "para-que",
        titulo: "4. Per a què les fem servir, i amb quin dret",
        bloques: [
          lista(
            "**Per fer el teu llibre**: entrevistar, transcriure, escriure, maquetar, retallar les seves frases dels seus àudios, imprimir i mostrar-te el resultat. És el contracte que vas acceptar en comprar.",
            "**Per parlar amb el narrador per WhatsApp**, fer-li les preguntes i guardar les seves respostes: amb el seu consentiment, que li demanem abans de la primera pregunta i que pot retirar quan vulgui.",
            "**Per avisar-te** per correu de com va (quan accepta, quan respon la primera, a mig camí, si es queda en silenci, quan el llibre està a punt). És part del servei.",
            "**Per facturar i complir la llei**: guardar les dades de la compra el temps que exigeix la normativa fiscal.",
            "**Perquè la web funcioni i sigui segura**: registres tècnics i galetes de sessió, per interès legítim que ningú no entri en un compte aliè.",
          ),
          p("Res més. No fem servir les teves dades ni les de la teva família per a publicitat, no les venem, no les cedim a ningú que no les necessiti tocar per fer el teu llibre, i no entrenem cap model d'intel·ligència artificial amb elles."),
        ],
      },
      {
        id: "quien-procesa",
        titulo: "5. Qui tracta les dades per nosaltres",
        bloques: [
          p("Per fer el llibre ens recolzem en aquests serveis. Cadascun veu només el que necessita per a la seva part, amb un contracte que li prohibeix fer-ho servir per a una altra cosa:"),
          tabla(
            ["Qui", "Per a què", "On"],
            [
              ["Supabase", "La base de dades i el magatzem d'àudios, fotos, llibres i les seves frases amb la seva veu. També l'accés al teu compte.", "Unió Europea"],
              ["Vercel", "Allotja la web que estàs llegint i la pàgina de la història.", "Estats Units (xarxa global)"],
              ["Railway", "Executa l'entrevistador (el que envia i rep els WhatsApp) i la fàbrica que produeix el llibre i tria les seves frases.", "Estats Units"],
              ["Meta (WhatsApp Business)", "Porta i duu els missatges i àudios entre el narrador i nosaltres. Meta veu els missatges com els veuria en qualsevol xat de WhatsApp Business.", "Segons les normes de Meta"],
              ["OpenAI", "Transcriu els àudios a text. Per API: no fa servir el que li enviem per entrenar els seus models.", "Estats Units"],
              ["Anthropic", "Redacta els capítols a partir de les transcripcions, amb les paraules del narrador. Per API: no fa servir el que li enviem per entrenar els seus models.", "Estats Units"],
              ["Stripe / Mercado Pago", "Cobren. Són els únics que veuen la teva targeta.", "Stripe: UE i EUA · Mercado Pago: Argentina"],
              ["Resend", "Envia els correus: el codi per entrar i els avisos.", "Brasil (regió d'Amèrica del Sud)"],
              ["Impremta i missatgeria", "Només si compres el llibre imprès o els marcs: reben l'arxiu, el teu nom i l'adreça d'enviament.", "Bookmundo, als Països Baixos (Unió Europea), per als llibres d'Espanya. A l'Argentina et diem quina abans d'enviar a imprimir"],
              ["Sentry", "Avisa dels errors tècnics del web i de l'entrevistador. No rep noms, missatges ni àudios.", "Unió Europea (Alemanya)"],
              ["Cloudflare", "Guarda una còpia de seguretat dels àudios, les fotos i els llibres, per si es perden. El que esborrem s'esborra també de la còpia al cap de 30 dies.", "Unió Europea"],
            ],
          ),
        ],
      },
      {
        id: "transferencias",
        titulo: "6. Dades que surten del teu país",
        bloques: [
          // APROBADO por Naza · L3-04 (18/10, con sus correcciones)
          p("Com veus a la taula, alguns d'aquests serveis són fora del teu país: als Estats Units i, en el cas dels correus, al Brasil."),
          lista(
            "**Si ets a la Unió Europea**: les transferències als Estats Units es fan sota el Marc de Privacitat de Dades UE-EUA o amb les clàusules contractuals tipus aprovades per la Comissió Europea, segons el proveïdor. El Brasil no té decisió d'adequació de la Unió Europea: els correus van amb les garanties contractuals del proveïdor.",
            "**Si ets a l'Argentina**: les teves dades viatgen als Estats Units (i els correus, al Brasil) perquè aquests proveïdors facin la seva part, sota els seus contractes de tractament de dades. La decisió d'adequació de la Unió Europea sobre l'Argentina serveix per a les dades que van d'Europa a l'Argentina; no cobreix les que surten de l'Argentina cap als Estats Units, i per això ho expliquem a part.",
          ),
          p("Si vols veure els contractes amb un proveïdor concret, demana'ls per correu."),
        ],
      },
      {
        id: "cuanto-tiempo",
        titulo: "7. Quant de temps les guardem",
        bloques: [
          // APROBADO por Naza · L3-05 (18/10, con sus correcciones)
          lista(
            "**Els àudios originals**: 3 mesos des que produïm el llibre. Després els esborrem i només en queden els retalls de «La seva veu». Si ho demana el narrador, o ho demanes tu, s'esborren abans.",
            "**El llibre, les seves frases amb la seva veu i les fotos**: mentre existeixi el teu compte, perquè la família hi torni quan vulgui. Si demanes esborrar les seves frases amb la seva veu, s'esborren, i els codis del llibre imprès deixen de sonar.",
            "**Si el narrador no accepta participar**: en 15 dies esborrem el seu nom, el seu número, la seva fitxa i les seves fotos.",
            "**El teu compte**: fins que demanis tancar-lo. Si el tanques, esborrem tot el que hi ha a dalt.",
            "**Les dades de la compra** (què, quan, quant, a nom de qui i on l'enviem): el temps que exigeix la llei fiscal de cada país, encara que tanquis el compte.",
            "**Els registres tècnics**: uns quants mesos, només per seguretat.",
            "**Les còpies de seguretat**: s'esborren soles. Les de la base de dades, al cap de 7 dies; les dels àudios, les fotos i els llibres, 30 dies després que els esborrem.",
          ),
        ],
      },
      {
        id: "con-quien",
        titulo: "8. Amb qui compartim",
        bloques: [
          p("Amb ningú, tret dels proveïdors de la secció 5 i la família que tu triïs: els convidats veuen el llibre i les fotos, i qui obri un enllaç de mostra que tu has compartit veu la portada, els títols dels capítols, el primer paràgraf i un minut d'àudio. El llibre imprès porta a més un codi a la contracoberta (i un al costat de cada frase de «La seva veu») que obre al mòbil el llibre sencer i les seves frases, sense compte: qui tingui el llibre a la mà el pot obrir i reenviar aquest enllaç, igual que podria deixar el llibre. Mai no venem dades, mai no les fem servir per a publicitat i mai no les lliurem a tercers tret d'obligació legal."),
        ],
      },
      {
        id: "derechos",
        titulo: "9. Els teus drets (i els del narrador)",
        bloques: [
          p("Tu, el narrador i cada convidat podeu demanar en qualsevol moment: **accedir** a les vostres dades, **corregir-les**, **esborrar-les**, **endur-vos-les** en un format útil (el llibre en PDF, les seves frases i els àudios originals), **oposar-vos** a un ús o demanar que el **limitem**, i **retirar un consentiment** (per exemple, el del narrador per continuar l'entrevista) sense que això afecti el que s'ha fet fins aleshores."),
          p("Com: un correu a {hola} des de l'adreça del teu compte (o, si ets el narrador, un missatge pel mateix WhatsApp). Contestem en un mes com a màxim; gairebé sempre en dies. Si creus que no t'hem fet cas, pots reclamar davant la {autoridad:ES} si ets a Espanya o davant la {autoridad:AR} si ets a l'Argentina."),
        ],
      },
      {
        id: "menores",
        titulo: "10. Menors",
        bloques: [
          p("Per comprar cal ser major d'edat. El narrador dona el seu propi permís per WhatsApp; si el narrador fos menor d'edat, el permís l'ha de donar qui n'exerceixi la pàtria potestat, i et demanem que ens ho diguis en apuntar-lo."),
        ],
      },
      {
        id: "seguridad",
        titulo: "11. Com les cuidem",
        bloques: [
          p("Els àudios, les fotos i els llibres són en un magatzem privat: no tenen enllaços públics, i cada arxiu es lliura només a qui té dret a veure'l, amb un enllaç que caduca (el codi del llibre imprès és un enllaç signat per nosaltres: obre aquell llibre i res més). Al teu compte s'hi entra amb un codi d'un sol ús que t'enviem per correu; no hi ha contrasenyes que es puguin filtrar. Les connexions van xifrades. L'accés dels socis a les dades està limitat al necessari per produir el teu llibre i resoldre problemes."),
        ],
      },
      {
        id: "cookies",
        titulo: "12. Galetes",
        bloques: [
          p("Només fem servir galetes tècniques, les imprescindibles perquè la web funcioni: la que manté la teva sessió oberta quan entres al teu compte, la que recorda si prefereixes la pàgina de la història clara o fosca i la que recorda l'idioma que tries a la web. Mentre compres, el navegador guarda en aquella pestanya el que vas omplint, per no perdre-ho si tornes enrere; s'esborra en tancar-la. Si arribes a la web des d'un anunci, recordem de quin només mentre dura aquella visita, sense guardar res al teu navegador. Si compres en aquella mateixa visita, ho anotem amb la teva compra per saber quins anuncis funcionen. No fem servir galetes de publicitat ni d'analítica, i per això no et mostrem cap avís. Si algun dia afegim una eina de mesura, et demanarem el consentiment abans d'activar-la i aquesta secció canviarà."),
        ],
      },
      {
        id: "ia",
        titulo: "13. Intel·ligència artificial",
        bloques: [
          p("Fem servir models d'intel·ligència artificial per a tres coses: transcriure els àudios, redactar els capítols amb les paraules del narrador, i triar, entre el que va dir, les frases que van a «La seva veu». Els models són d'OpenAI i Anthropic, contractats per API, i cap no fa servir el que els enviem per entrenar. Nosaltres tampoc no entrenem res amb la teva família. Les decisions que importen les pren una persona: tu aproves el llibre abans que es tanqui, i no hi ha cap decisió automatitzada que t'afecti legalment."),
        ],
      },
      {
        id: "cambios",
        titulo: "14. Si això canvia",
        bloques: [
          p("Si canviem aquesta política de manera que t'afecti —un proveïdor nou, un ús nou— t'avisem per correu abans, i si el canvi necessita el teu consentiment, te'l demanem. La data de dalt diu quan va ser l'última vegada que la vam tocar."),
        ],
      },
      {
        id: "contacto",
        titulo: "15. Contacte",
        bloques: [
          // APROBADO por Naza · L2-02 (18/10, con sus correcciones)
          p("{hola} per a tot el que tingui a veure amb les teves dades, les del narrador o les d'un convidat. Et contesta una persona, no un sistema."),
        ],
      },
    ],
  },

  arrepentimiento: {
    titulo: "Desistiment",
    bajada: "Si et fas enrere de la compra, això és tot el que cal fer.",
    descripcion: "Com desistir d'una compra i demanar la devolució.",
    enCorto: [
      "Es demana amb un correu. No cal que expliquis per què.",
      "Et confirmem que l'hem rebut dins de les 24 hores i et retornem els diners pel mateix mitjà amb què vas pagar, en 14 dies com a màxim.",
      // APROBADO por Naza · L1-10 (18/10, con sus correcciones)
      "Si el narrador contesta menys de deu preguntes, t'ho retornem tot. Per llei, 14 dies naturals des de la compra a Espanya i 10 dies seguits des que reps el llibre a l'Argentina, sense cost.",
    ],
    secciones: [
      {
        id: "como",
        titulo: "Com es fa",
        bloques: [
          p("Prem el botó: s'obre un correu a {hola} amb l'assumpte ja escrit. Completa el teu correu de compra i el nom del narrador, i envia'l. No cal que expliquis per què."),
          BOTON,
          p("Si el botó no t'obre el correu, escriu tu a {hola} amb l'assumpte «Desistiment de compra»."),
        ],
      },
      {
        id: "despues",
        titulo: "Què passa després",
        bloques: [
          lista(
            "Et confirmem per correu que l'hem rebut, dins de les 24 hores.",
            "Si l'entrevista havia començat, l'aturem i l'hi expliquem al narrador amb cura.",
            "Et retornem els diners pel mateix mitjà amb què vas pagar, en un termini màxim de 14 dies.",
          ),
        ],
      },
      {
        id: "plazos",
        titulo: "Terminis",
        bloques: [
          // APROBADO por Naza · L1-10 (18/10, con sus correcciones) · alineado a la regla de las diez preguntas (Naza 19/10)
          lista(
            "**La garantia de cada llibre.** Si el narrador no accepta, o si contesta menys de deu preguntes, t'ho retornem tot. El detall és al final d'aquesta pàgina.",
            "**Espanya**: 14 dies naturals des de la compra. El llibre en PDF (amb les seves frases amb la seva veu) ja lliurat al teu compte i els productes a mida (imprès, marcs) no es poden retornar, tret que arribin malmesos o amb un defecte.",
            "**Argentina**: 10 dies seguits des que reps el llibre, o des de la compra si el llibre és només digital, el que passi més tard, sense cost (art. 34 de la llei 24.240). Si cal retornar el llibre imprès o el marc, l'enviament el paguem nosaltres.",
            "**Encara que no ho demanis**: si el narrador no accepta participar, o l'entrevista acaba sense material per a un llibre (vegeu la secció 7 dels termes), t'escrivim i t'ho retornem tot en un termini màxim de 14 dies.",
          ),
          p("El detall és a la secció [«Si te'n desdius» dels termes](/legal/terminos#arrepentimiento)."),
        ],
      },
      {
        // APROBADO por Naza · L2-01 (18/10, con sus correcciones)
        id: "formulario",
        titulo: "Formulari de desistiment",
        bloques: [
          p("Si prefereixes el model oficial de formulari de desistiment (annex B del RDL 1/2007), copia aquest text, omple'l i envia'l a {hola}. No és obligatori: el botó de dalt val el mateix."),
          formulario(
            "A l'atenció de {titular:ES}, correu {hola}:",
            "Per la present li comunico/comuniquem (*) que desisteixo del meu/desistim del nostre (*) contracte de venda del bé següent/prestació del servei següent (*):",
            "Demanat el/rebut el (*):",
            "Nom del consumidor o dels consumidors:",
            "Domicili del consumidor o dels consumidors:",
            "Signatura del consumidor o dels consumidors (només si aquest formulari es presenta en paper):",
            "Data:",
            "(*) Ratlleu el que no correspongui.",
          ),
        ],
      },
      seccionGarantia("ca"),
    ],
  },
  // ca: revisado con el corrector de Softcatalà (19/10) · traducción de la tanda 5 (textos 32–37)
  reclamaciones: {
    titulo: "Reclamacions i atenció",
    bajada: "Si alguna cosa no ha sortit bé, escriu-nos. Et respon una persona de l'equip de Vitácora.",
    descripcion: "Si alguna cosa no ha sortit bé, escriu-nos. Et respon una persona de l'equip de Vitácora.",
    enCorto: [],
    secciones: [
      {
        id: "atencion",
        titulo: "",
        bloques: [
          whatsapp(
            "Per WhatsApp al {whatsapp} o per correu a {soporte}, de dilluns a divendres de 10 a 18, hora d'Espanya.",
            "Per correu a {soporte}, de dilluns a divendres de 10 a 18, hora d'Espanya.",
          ),
          p("Et responem en un termini màxim de 30 dies."),
          hoja(
            "Si prefereixes un full oficial de reclamació, [descarrega'l aquí](/legal/hoja-reclamaciones.pdf), omple'l i envia'ns-el per correu.",
            "Demana'ns el full oficial de reclamació per correu i te l'enviem.",
          ),
          p("No estem adherits a la Junta Arbitral de Consum. Si la teva reclamació no es resol, et direm quin organisme la pot revisar."),
        ],
      },
    ],
  },
};

export const TEXTOS_LEGAL: Textos<TextosLegal> = { es: ES, ca: CA, ar: AR };

/** El orden de las solapas: los textos legales. */
export const DOCUMENTOS_LEGALES: readonly DocumentoLegal[] = ["terminos", "privacidad", "arrepentimiento", "reclamaciones"];
