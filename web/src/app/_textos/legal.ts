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
//   - la garantía de cada línea (DECISIONES D1), en términos §7 y en la página
//     de desistimiento, con el MISMO texto en las dos (GARANTIAS, abajo);
//     PENDIENTE DE REVISIÓN DEL ABOGADO;
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
// ca: PENDIENTE REVISIÓN NATIVA Y ABOGADO. Además, confirmar con el abogado qué
// textos legales tienen que estar en catalán obligatoriamente (DECISIONES D2).
//
// Marcas dentro de los textos (las pinta legal/pagina.tsx):
//   **negrita**   [texto](/ruta o https://…)   {hola} {soporte} (correos)
//   {titular:ES} {titular:AR} (nombre, documento y domicilio, en amarillo si falta)
//   {ley:ES} {ley:AR} {autoridad:ES} {autoridad:AR} (de legal/titulares.ts)
// Los enlaces que empiezan por /legal se llevan al idioma de la página.

export type DocumentoLegal = "terminos" | "privacidad" | "arrepentimiento";

export type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "tabla"; columnas: string[]; filas: string[][] }
  /** El botón del correo de desistimiento / arrepentimiento (solo en esa página). */
  | { tipo: "boton" };

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
  /** Resumen nuevo, sin compromisos nuevos. A APROBAR POR NAZA Y EL ABOGADO. */
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
};

const p = (texto: string): Bloque => ({ tipo: "parrafo", texto });
const lista = (...items: string[]): Bloque => ({ tipo: "lista", items });
const tabla = (columnas: string[], filas: string[][]): Bloque => ({ tipo: "tabla", columnas, filas });
const BOTON: Bloque = { tipo: "boton" };

/**
 * La garantía de cada línea (DECISIONES D1), con el texto EXACTO del checkout
 * (_textos/checkout.ts garantiaFamiliar / garantiaPropia, _textos/checkout-viaje.ts
 * garantia) y de la FAQ de la portada. Va igual en términos §7 y en la página de
 * desistimiento: legales y política de devoluciones dicen lo mismo.
 * PENDIENTE DE REVISIÓN DEL ABOGADO.
 */
export const GARANTIAS: Textos<{ familiar: string; familiarEmpezado: string; viaje: string; propia: string }> = {
  es: {
    familiar: "Si no quiere hacerlo, te devolvemos el dinero.",
    familiarEmpezado: "Si ya ha empezado a contestar, el libro se cierra con lo que haya, sin devolución.",
    viaje: "Si el viaje se cancela, te devolvemos el dinero.",
    propia: "Si cambias de idea antes de contestar la primera pregunta, te devolvemos el dinero.",
  },
  ca: {
    familiar: "Si no ho vol fer, et retornem els diners.",
    familiarEmpezado: "Si ja ha començat a contestar, el llibre es tanca amb el que hi hagi, sense devolució.",
    viaje: "Si el viatge es cancel·la, et retornem els diners.",
    propia: "Si canvies d'idea abans de contestar la primera pregunta, et retornem els diners.",
  },
  ar: {
    familiar: "Si no quiere hacerlo, te devolvemos el dinero.",
    familiarEmpezado: "Si ya empezó a contestar, el libro se cierra con lo que haya, sin devolución.",
    viaje: "Si el viaje se cancela, te devolvemos el dinero.",
    propia: "Si cambiás de idea antes de contestar la primera pregunta, te devolvemos el dinero.",
  },
};

function seccionGarantia(
  idioma: keyof typeof GARANTIAS,
  id: string,
  titulo: string,
  intro: string,
  nombres: { familiar: string; viaje: string; propia: string },
): SeccionLegal {
  const g = GARANTIAS[idioma];
  return {
    id,
    titulo,
    pendienteAbogado: true,
    bloques: [
      p(intro),
      lista(
        `**${nombres.familiar}**: ${g.familiar} ${g.familiarEmpezado}`,
        `**${nombres.viaje}**: ${g.viaje}`,
        `**${nombres.propia}**: ${g.propia}`,
      ),
    ],
  };
}

// ─── Castellano de España (tú) ────────────────────────────────────────────

const GARANTIA_ES = (id: string, titulo: string) =>
  seccionGarantia("es", id, titulo, "Además de lo anterior, cada libro tiene su garantía:", {
    familiar: "Familiar (el libro de otra persona)",
    viaje: "De viaje",
    propia: "Para ti (tu propio libro)",
  });

const ES: TextosLegal = {
  actualizado: "Última actualización",
  fecha: "14 de octubre de 2026",
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
    enCorto: [
      "Pago único, por adelantado. Sin suscripción y sin renovación automática.",
      "La entrevista es por WhatsApp, con audios, al ritmo del narrador. Nada empieza sin su permiso: si no acepta, te devolvemos el dinero completo.",
      "Antes de cerrar el libro lo revisas tú. Lo que se imprime es lo que apruebas.",
      "Puedes desistir: 14 días naturales en España, 10 días corridos en Argentina.",
      "La historia, los audios y la voz son de tu familia. Nunca los publicamos.",
    ],
    secciones: [
      {
        id: "quienes-somos",
        titulo: "1. Quiénes somos",
        bloques: [
          p("Vitácora Familiar lo prestan dos personas, una en cada país donde vendemos. Con quién contratas depende de la región que eliges al comprar (la misma que decide la moneda y el medio de pago):"),
          lista(
            "Si compras desde **España** (en euros): {titular:ES}.",
            "Si compras desde **Argentina** (en pesos): {titular:AR}.",
          ),
          p("En estos términos, «nosotros» es el titular que te corresponde. Para cualquier cosa escribe a {hola} (o a {soporte} si es un problema con la web) y te contestamos."),
        ],
      },
      {
        id: "que-es",
        titulo: "2. Qué es el servicio",
        bloques: [
          p("Entrevistamos por WhatsApp a la persona que nos indicas (el «narrador»): le llega una pregunta, la responde con un audio cuando quiere, sin instalar nada, y cuando termina de contar le llega la siguiente. Con sus respuestas escribimos el libro de su vida, en primera persona y con sus propias palabras."),
          p("Lo que puedes comprar:"),
          lista(
            "**El libro en PDF**: se lee en la web, capítulo por capítulo, con las fotos que suba la familia. Incluye **«Su voz»**: sus mejores frases, recortadas de sus audios originales tal como las dijo, para escuchar en la web y con un código impreso. Está siempre disponible en tu cuenta.",
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
          p("El precio de cada producto aparece antes de pagar, en euros o en pesos según la región que elijas, y es el precio final que pagas. Después del pago te llega un correo para entrar a tu cuenta con un código (sin contraseña) y anotar a tu narrador: su nombre, su WhatsApp y unos pocos datos para que las preguntas le suenen a él."),
        ],
      },
      {
        id: "permiso",
        titulo: "4. Nada empieza sin su permiso",
        bloques: [
          p("Al anotar a alguien nos confirmas que puedes hacerlo y que le va a parecer bien. Antes de la primera pregunta le escribimos por WhatsApp contándole quién lo anotó y le pedimos permiso. **Si no acepta, no empieza nada y te devolvemos el dinero completo** (ver la sección 8)."),
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
          p("Puedes arrepentirte de la compra sin dar explicaciones. Escríbenos a {hola} o usa el [botón de desistimiento](/legal/arrepentimiento); te confirmamos que lo recibimos dentro de las 24 horas y te devolvemos el dinero por el mismo medio con el que pagaste, en un plazo máximo de 14 días. El plazo para arrepentirte depende de dónde compraste:"),
          lista(
            "**España — 14 días naturales** desde la compra (derecho de desistimiento, arts. 102 a 108 del RDL 1/2007). Al pagar nos pides que la entrevista empiece en cuanto el narrador acepte, sin esperar esos 14 días; si te arrepientes con la entrevista ya en marcha, te devolvemos el precio menos la parte proporcional a las preguntas ya hechas (art. 108.3). Una vez que el libro en PDF y sus frases en su voz están a tu disposición en tu cuenta, con tu consentimiento, el desistimiento ya no aplica sobre ellos (art. 103 m); tampoco sobre el libro impreso ni los marcos, que se hacen a medida (art. 103 c). Si algo llega dañado o con un defecto, lo reponemos.",
            "**Argentina — 10 días corridos** desde la compra (art. 34 de la ley 24.240). Puedes revocar la compra sin costo alguno y te devolvemos el total. El botón de arrepentimiento está en la página de inicio, como exige la Resolución 424/2020.",
          ),
          p("Estos plazos son los que marca la ley de cada país; nunca te van a dar menos derechos que los que te corresponden como consumidor donde vives."),
        ],
      },
      GARANTIA_ES("garantia", "7. La garantía de cada libro"),
      {
        id: "sin-libro",
        titulo: "8. Si no hay libro",
        bloques: [
          p("Si el narrador no acepta participar, o responde menos de diez preguntas y por eso no hay material para un libro, te devolvemos el importe completo, sin plazo y sin descuento: no te entregamos lo que compraste, así que no te lo cobramos. Preferimos un libro breve y verdadero antes que uno largo y relleno, pero por debajo de diez respuestas no hay libro."),
        ],
      },
      {
        id: "historia",
        titulo: "9. La historia es de tu familia",
        bloques: [
          p("Lo que cuenta tu narrador es suyo y de tu familia. No nos quedamos con ningún derecho sobre su historia, sus audios, sus fotos ni su voz: nos das únicamente el permiso necesario para transcribir, escribir, maquetar, recortar sus frases e imprimir tu libro. Nunca publicamos su historia, nunca la usamos como ejemplo y nunca se la mostramos a nadie fuera de tu familia. Si algún día quisiéramos mostrar una página como muestra de nuestro trabajo, te lo pediríamos por escrito y podrías decir que no."),
          p("Sus frases en su voz son recortes de sus propios audios, sin ninguna voz sintética. No se usan para ningún otro fin y se borran cuando el narrador o tú lo pidan."),
        ],
      },
      {
        id: "uso",
        titulo: "10. Lo que te pedimos a ti",
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
        titulo: "11. Qué te prometemos y qué no",
        bloques: [
          p("Te prometemos que el libro se escribe con las palabras de tu narrador, que para él va a ser fácil —un audio de WhatsApp cuando quiera— y que si algo sale mal lo arreglamos o te devolvemos el dinero."),
          p("Para transcribir los audios y para redactar los capítulos usamos inteligencia artificial, y puede equivocarse: un nombre mal oído, una fecha, un giro que no le pertenece. Por eso el libro no se cierra hasta que lo revisas tú, y por eso te pedimos que lo leas antes de aprobarlo. Lo que se imprime es lo que aprobaste."),
          p("No podemos prometerte cuánto va a querer contar tu narrador ni cuántas preguntas va a responder. Si cuenta poco, el libro sale más corto."),
          p("Si algo falla por nuestra culpa, respondemos hasta el importe que pagaste. Esto no limita ningún derecho que la ley de tu país no permita limitar, ni nuestra responsabilidad por dolo o por daños a las personas."),
        ],
      },
      {
        id: "datos",
        titulo: "12. Tus datos",
        bloques: [
          p("Qué guardamos, quién lo procesa, por cuánto tiempo y cómo borrarlo está en la [política de privacidad](/legal/privacidad). Lo resumido: los audios y la voz son de tu familia, se usan solo para su libro, no se usan para entrenar ningún modelo y se borran cuando lo pidas."),
        ],
      },
      {
        id: "cambios",
        titulo: "13. Si algo cambia",
        bloques: [
          p("Si modificamos estos términos, te avisamos por correo antes de que te afecten. Los cambios nunca se aplican hacia atrás sobre un libro ya pagado: para ese libro valen los términos que aceptaste al comprar."),
        ],
      },
      {
        id: "ley",
        titulo: "14. Ley y jurisdicción",
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
        titulo: "15. Contacto",
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
      "Los audios originales se borran en cuanto tú o el narrador lo pidan.",
      "Solo usamos cookies técnicas: ni de publicidad ni de analítica.",
      "Para cualquier cosa sobre tus datos, basta un correo a {hola}.",
    ],
    secciones: [
      {
        id: "responsables",
        titulo: "1. Quién responde por tus datos",
        bloques: [
          p("El responsable del tratamiento es el titular del servicio en tu región, la que elegiste al comprar:"),
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
          p("**Del narrador**: su nombre y cómo le gusta que le digan, su número de WhatsApp, su zona horaria, y los datos que nos das para que las preguntas le suenen a él (dónde y cuándo nació, a qué se dedicó, quién es quién en su familia). Y lo importante: los **audios** que graba, las **transcripciones** que hacemos de ellos, los **textos** del libro y las **fotos** que sube la familia."),
          p("**Su voz**: sus mejores frases se recortan de sus propios audios, tal como las dijo, para escucharlas en la web y con el código impreso en el libro. No creamos ninguna voz sintética. Si algún día ofreciéramos un producto con su voz clonada —un **dato biométrico**—, solo lo haríamos con el consentimiento explícito del narrador, pedido por WhatsApp para ese fin concreto."),
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
              ["Vercel", "Aloja la web que estás leyendo y tu panel.", "Estados Unidos (red global)"],
              ["Railway", "Corre el entrevistador (el que manda y recibe los WhatsApp) y la fábrica que produce el libro y elige sus frases.", "Estados Unidos"],
              ["Meta (WhatsApp Business)", "Lleva y trae los mensajes y audios entre el narrador y nosotros. Meta ve los mensajes como los vería en cualquier chat de WhatsApp Business.", "Según las reglas de Meta"],
              ["OpenAI", "Transcribe los audios a texto. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
              ["Anthropic", "Redacta los capítulos a partir de las transcripciones, con las palabras del narrador. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
              ["Stripe / Mercado Pago", "Cobran. Son los únicos que ven tu tarjeta.", "Stripe: UE y EE. UU. · Mercado Pago: Argentina"],
              ["Resend", "Manda los correos: el código para entrar y los avisos.", "Brasil (región de América del Sur)"],
              ["Imprenta y mensajería", "Solo si compras el libro impreso o los marcos: reciben el archivo, tu nombre y la dirección de envío.", "En tu país; te decimos cuál antes de mandar a producir"],
            ],
          ),
        ],
      },
      {
        id: "transferencias",
        titulo: "6. Datos que salen de tu país",
        bloques: [
          p("Como ves en la tabla, algunos de esos servicios están en Estados Unidos. Si estás en la Unión Europea, esas transferencias se hacen bajo el Marco de Privacidad de Datos UE-EE. UU. o con las cláusulas contractuales tipo aprobadas por la Comisión Europea, según el proveedor. Argentina tiene decisión de adecuación de la Unión Europea, así que los datos pueden circular entre los dos países sin garantías adicionales. Si quieres ver los contratos con un proveedor concreto, pídelos por correo."),
        ],
      },
      {
        id: "cuanto-tiempo",
        titulo: "7. Cuánto tiempo los guardamos",
        bloques: [
          lista(
            "**El libro, sus frases en su voz, las fotos y los audios**: mientras el libro esté en tu cuenta. Están ahí para que la familia vuelva a ellos cuando quiera.",
            "**Los audios originales**: además, se borran en cuanto tú o el narrador lo pidan, aunque el libro siga en tu cuenta. Sus frases en su voz son recortes de esos mismos audios: si pides borrar los originales, también se borran los recortes, y los códigos del libro impreso dejan de sonar.",
            "**Tu cuenta**: hasta que pidas cerrarla. Si la cierras, borramos todo lo de arriba.",
            "**Los datos de la compra** (qué, cuándo, cuánto, a nombre de quién): el tiempo que exige la ley fiscal de cada país, aunque cierres la cuenta.",
            "**Los registros técnicos**: unos meses, solo para seguridad.",
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
          p("Tú, el narrador y cada invitado pueden pedir en cualquier momento: **acceder** a sus datos, **corregirlos**, **borrarlos**, **llevárselos** en un formato usable (el libro en PDF, sus frases y los audios originales), **oponerse** a un uso o pedir que lo **limitemos**, y **retirar un consentimiento** (por ejemplo, el del narrador para seguir la entrevista) sin que eso afecte lo hecho hasta entonces."),
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
          p("Usamos solo cookies técnicas, las imprescindibles para que la web funcione: la que mantiene tu sesión abierta cuando entras a tu cuenta, la que recuerda si prefieres el panel en claro o en oscuro y la que recuerda el idioma que eliges en la web. Mientras compras, el navegador guarda en esa pestaña lo que vas rellenando, para no perderlo si vuelves atrás; se borra al cerrarla. No usamos cookies de publicidad ni de analítica, y por eso no te mostramos ningún aviso. Si algún día sumamos una herramienta de medición, te pediremos consentimiento antes de activarla y esta sección cambiará."),
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
          p("{hola} para todo lo que tenga que ver con tus datos, los del narrador o los de un invitado. Te contesta una de las dos personas de la sección 1, no un sistema."),
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
      "España: 14 días naturales desde la compra. Argentina: 10 días corridos, sin costo.",
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
          lista(
            "**Argentina**: 10 días corridos desde la compra, sin costo (art. 34 de la ley 24.240).",
            "**España**: 14 días naturales desde la compra. Si la entrevista ya empezó a tu pedido, se descuenta la parte ya hecha; el PDF (con sus frases en su voz) ya entregado y los productos a medida (impreso, marcos) no se pueden devolver.",
            "**Sin plazo**: si el narrador no acepta participar o responde menos de diez preguntas, te devolvemos todo, siempre.",
          ),
          p("El detalle está en la sección [«Si te arrepientes» de los términos](/legal/terminos#arrepentimiento)."),
        ],
      },
      GARANTIA_ES("garantia", "La garantía de cada libro"),
    ],
  },
};

// ─── Castellano de Argentina (vos) ────────────────────────────────────────
// La misma versión que ES, pasada a vos. En Argentina la página de
// desistimiento es el «Botón de arrepentimiento» (Res. 424/2020).

const GARANTIA_AR = (id: string, titulo: string) =>
  seccionGarantia("ar", id, titulo, "Además de lo anterior, cada libro tiene su garantía:", {
    familiar: "Familiar (el libro de otra persona)",
    viaje: "De viaje",
    propia: "Para vos (tu propio libro)",
  });

const AR: TextosLegal = {
  actualizado: "Última actualización",
  fecha: "14 de octubre de 2026",
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
    enCorto: [
      "Pago único, por adelantado. Sin suscripción y sin renovación automática.",
      "La entrevista es por WhatsApp, con audios, al ritmo del narrador. Nada empieza sin su permiso: si no acepta, te devolvemos el dinero completo.",
      "Antes de cerrar el libro lo revisás vos. Lo que se imprime es lo que aprobás.",
      "Podés arrepentirte: 10 días corridos en Argentina, 14 días naturales en España.",
      "La historia, los audios y la voz son de tu familia. Nunca los publicamos.",
    ],
    secciones: [
      {
        id: "quienes-somos",
        titulo: "1. Quiénes somos",
        bloques: [
          p("Vitácora Familiar lo prestan dos personas, una en cada país donde vendemos. Con quién contratás depende de la región que elegís al comprar (la misma que decide la moneda y el medio de pago):"),
          lista(
            "Si comprás desde **España** (en euros): {titular:ES}.",
            "Si comprás desde **Argentina** (en pesos): {titular:AR}.",
          ),
          p("En estos términos, «nosotros» es el titular que te corresponde. Para cualquier cosa escribí a {hola} (o a {soporte} si es un problema con la web) y te contestamos."),
        ],
      },
      {
        id: "que-es",
        titulo: "2. Qué es el servicio",
        bloques: [
          p("Entrevistamos por WhatsApp a la persona que nos indicás (el «narrador»): le llega una pregunta, la responde con un audio cuando quiere, sin instalar nada, y cuando termina de contar le llega la siguiente. Con sus respuestas escribimos el libro de su vida, en primera persona y con sus propias palabras."),
          p("Lo que podés comprar:"),
          lista(
            "**El libro en PDF**: se lee en la web, capítulo por capítulo, con las fotos que suba la familia. Incluye **«Su voz»**: sus mejores frases, recortadas de sus audios originales tal como las dijo, para escuchar en la web y con un código impreso. Está siempre disponible en tu cuenta.",
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
          p("El precio de cada producto aparece antes de pagar, en euros o en pesos según la región que elijas, y es el precio final que pagás. Después del pago te llega un correo para entrar a tu cuenta con un código (sin contraseña) y anotar a tu narrador: su nombre, su WhatsApp y unos pocos datos para que las preguntas le suenen a él."),
        ],
      },
      {
        id: "permiso",
        titulo: "4. Nada empieza sin su permiso",
        bloques: [
          p("Al anotar a alguien nos confirmás que podés hacerlo y que le va a parecer bien. Antes de la primera pregunta le escribimos por WhatsApp contándole quién lo anotó y le pedimos permiso. **Si no acepta, no empieza nada y te devolvemos el dinero completo** (ver la sección 8)."),
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
          p("Podés arrepentirte de la compra sin dar explicaciones. Escribinos a {hola} o usá el [botón de arrepentimiento](/legal/arrepentimiento); te confirmamos que lo recibimos dentro de las 24 horas y te devolvemos el dinero por el mismo medio con el que pagaste, en un plazo máximo de 14 días. El plazo para arrepentirte depende de dónde compraste:"),
          lista(
            "**España — 14 días naturales** desde la compra (derecho de desistimiento, arts. 102 a 108 del RDL 1/2007). Al pagar nos pedís que la entrevista empiece en cuanto el narrador acepte, sin esperar esos 14 días; si te arrepentís con la entrevista ya en marcha, te devolvemos el precio menos la parte proporcional a las preguntas ya hechas (art. 108.3). Una vez que el libro en PDF y sus frases en su voz están a tu disposición en tu cuenta, con tu consentimiento, el desistimiento ya no aplica sobre ellos (art. 103 m); tampoco sobre el libro impreso ni los marcos, que se hacen a medida (art. 103 c). Si algo llega dañado o con un defecto, lo reponemos.",
            "**Argentina — 10 días corridos** desde la compra (art. 34 de la ley 24.240). Podés revocar la compra sin costo alguno y te devolvemos el total. El botón de arrepentimiento está en la página de inicio, como exige la Resolución 424/2020.",
          ),
          p("Estos plazos son los que marca la ley de cada país; nunca te van a dar menos derechos que los que te corresponden como consumidor donde vivís."),
        ],
      },
      GARANTIA_AR("garantia", "7. La garantía de cada libro"),
      {
        id: "sin-libro",
        titulo: "8. Si no hay libro",
        bloques: [
          p("Si el narrador no acepta participar, o responde menos de diez preguntas y por eso no hay material para un libro, te devolvemos el importe completo, sin plazo y sin descuento: no te entregamos lo que compraste, así que no te lo cobramos. Preferimos un libro breve y verdadero antes que uno largo y relleno, pero por debajo de diez respuestas no hay libro."),
        ],
      },
      {
        id: "historia",
        titulo: "9. La historia es de tu familia",
        bloques: [
          p("Lo que cuenta tu narrador es suyo y de tu familia. No nos quedamos con ningún derecho sobre su historia, sus audios, sus fotos ni su voz: nos das únicamente el permiso necesario para transcribir, escribir, maquetar, recortar sus frases e imprimir tu libro. Nunca publicamos su historia, nunca la usamos como ejemplo y nunca se la mostramos a nadie fuera de tu familia. Si algún día quisiéramos mostrar una página como muestra de nuestro trabajo, te lo pediríamos por escrito y podrías decir que no."),
          p("Sus frases en su voz son recortes de sus propios audios, sin ninguna voz sintética. No se usan para ningún otro fin y se borran cuando el narrador o vos lo pidan."),
        ],
      },
      {
        id: "uso",
        titulo: "10. Lo que te pedimos a vos",
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
        titulo: "11. Qué te prometemos y qué no",
        bloques: [
          p("Te prometemos que el libro se escribe con las palabras de tu narrador, que para él va a ser fácil —un audio de WhatsApp cuando quiera— y que si algo sale mal lo arreglamos o te devolvemos el dinero."),
          p("Para transcribir los audios y para redactar los capítulos usamos inteligencia artificial, y puede equivocarse: un nombre mal oído, una fecha, un giro que no le pertenece. Por eso el libro no se cierra hasta que lo revisás vos, y por eso te pedimos que lo leas antes de aprobarlo. Lo que se imprime es lo que aprobaste."),
          p("No podemos prometerte cuánto va a querer contar tu narrador ni cuántas preguntas va a responder. Si cuenta poco, el libro sale más corto."),
          p("Si algo falla por nuestra culpa, respondemos hasta el importe que pagaste. Esto no limita ningún derecho que la ley de tu país no permita limitar, ni nuestra responsabilidad por dolo o por daños a las personas."),
        ],
      },
      {
        id: "datos",
        titulo: "12. Tus datos",
        bloques: [
          p("Qué guardamos, quién lo procesa, por cuánto tiempo y cómo borrarlo está en la [política de privacidad](/legal/privacidad). Lo resumido: los audios y la voz son de tu familia, se usan solo para su libro, no se usan para entrenar ningún modelo y se borran cuando lo pidas."),
        ],
      },
      {
        id: "cambios",
        titulo: "13. Si algo cambia",
        bloques: [
          p("Si modificamos estos términos, te avisamos por correo antes de que te afecten. Los cambios nunca se aplican hacia atrás sobre un libro ya pagado: para ese libro valen los términos que aceptaste al comprar."),
        ],
      },
      {
        id: "ley",
        titulo: "14. Ley y jurisdicción",
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
        titulo: "15. Contacto",
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
      "Los audios originales se borran en cuanto vos o el narrador lo pidan.",
      "Solo usamos cookies técnicas: ni de publicidad ni de analítica.",
      "Para cualquier cosa sobre tus datos, alcanza un correo a {hola}.",
    ],
    secciones: [
      {
        id: "responsables",
        titulo: "1. Quién responde por tus datos",
        bloques: [
          p("El responsable del tratamiento es el titular del servicio en tu región, la que elegiste al comprar:"),
          lista("**España**: {titular:ES}.", "**Argentina**: {titular:AR}."),
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
          p("**Del narrador**: su nombre y cómo le gusta que le digan, su número de WhatsApp, su zona horaria, y los datos que nos das para que las preguntas le suenen a él (dónde y cuándo nació, a qué se dedicó, quién es quién en su familia). Y lo importante: los **audios** que graba, las **transcripciones** que hacemos de ellos, los **textos** del libro y las **fotos** que sube la familia."),
          p("**Su voz**: sus mejores frases se recortan de sus propios audios, tal como las dijo, para escucharlas en la web y con el código impreso en el libro. No creamos ninguna voz sintética. Si algún día ofreciéramos un producto con su voz clonada —un **dato biométrico**—, solo lo haríamos con el consentimiento explícito del narrador, pedido por WhatsApp para ese fin concreto."),
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
              ["Vercel", "Aloja la web que estás leyendo y tu panel.", "Estados Unidos (red global)"],
              ["Railway", "Corre el entrevistador (el que manda y recibe los WhatsApp) y la fábrica que produce el libro y elige sus frases.", "Estados Unidos"],
              ["Meta (WhatsApp Business)", "Lleva y trae los mensajes y audios entre el narrador y nosotros. Meta ve los mensajes como los vería en cualquier chat de WhatsApp Business.", "Según las reglas de Meta"],
              ["OpenAI", "Transcribe los audios a texto. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
              ["Anthropic", "Redacta los capítulos a partir de las transcripciones, con las palabras del narrador. Por API: no usa lo que le mandamos para entrenar sus modelos.", "Estados Unidos"],
              ["Stripe / Mercado Pago", "Cobran. Son los únicos que ven tu tarjeta.", "Stripe: UE y EE. UU. · Mercado Pago: Argentina"],
              ["Resend", "Manda los correos: el código para entrar y los avisos.", "Brasil (región de América del Sur)"],
              ["Imprenta y mensajería", "Solo si comprás el libro impreso o los marcos: reciben el archivo, tu nombre y la dirección de envío.", "En tu país; te decimos cuál antes de mandar a producir"],
            ],
          ),
        ],
      },
      {
        id: "transferencias",
        titulo: "6. Datos que salen de tu país",
        bloques: [
          p("Como ves en la tabla, algunos de esos servicios están en Estados Unidos. Si estás en la Unión Europea, esas transferencias se hacen bajo el Marco de Privacidad de Datos UE-EE. UU. o con las cláusulas contractuales tipo aprobadas por la Comisión Europea, según el proveedor. Argentina tiene decisión de adecuación de la Unión Europea, así que los datos pueden circular entre los dos países sin garantías adicionales. Si querés ver los contratos con un proveedor concreto, pedilos por correo."),
        ],
      },
      {
        id: "cuanto-tiempo",
        titulo: "7. Cuánto tiempo los guardamos",
        bloques: [
          lista(
            "**El libro, sus frases en su voz, las fotos y los audios**: mientras el libro esté en tu cuenta. Están ahí para que la familia vuelva a ellos cuando quiera.",
            "**Los audios originales**: además, se borran en cuanto vos o el narrador lo pidan, aunque el libro siga en tu cuenta. Sus frases en su voz son recortes de esos mismos audios: si pedís borrar los originales, también se borran los recortes, y los códigos del libro impreso dejan de sonar.",
            "**Tu cuenta**: hasta que pidas cerrarla. Si la cerrás, borramos todo lo de arriba.",
            "**Los datos de la compra** (qué, cuándo, cuánto, a nombre de quién): el tiempo que exige la ley fiscal de cada país, aunque cierres la cuenta.",
            "**Los registros técnicos**: unos meses, solo para seguridad.",
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
          p("Usamos solo cookies técnicas, las imprescindibles para que la web funcione: la que mantiene tu sesión abierta cuando entrás a tu cuenta, la que recuerda si preferís el panel en claro o en oscuro y la que recuerda el idioma que elegís en la web. Mientras comprás, el navegador guarda en esa pestaña lo que vas completando, para no perderlo si volvés atrás; se borra al cerrarla. No usamos cookies de publicidad ni de analítica, y por eso no te mostramos ningún aviso. Si algún día sumamos una herramienta de medición, te vamos a pedir consentimiento antes de activarla y esta sección va a cambiar."),
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
          p("{hola} para todo lo que tenga que ver con tus datos, los del narrador o los de un invitado. Te contesta una de las dos personas de la sección 1, no un sistema."),
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
      "Argentina: 10 días corridos desde la compra, sin costo. España: 14 días naturales.",
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
          lista(
            "**Argentina**: 10 días corridos desde la compra, sin costo (art. 34 de la ley 24.240).",
            "**España**: 14 días naturales desde la compra. Si la entrevista ya empezó a tu pedido, se descuenta la parte ya hecha; el PDF (con sus frases en su voz) ya entregado y los productos a medida (impreso, marcos) no se pueden devolver.",
            "**Sin plazo**: si el narrador no acepta participar o responde menos de diez preguntas, te devolvemos todo, siempre.",
          ),
          p("El detalle está en la sección [«Si te arrepentís» de los términos](/legal/terminos#arrepentimiento)."),
        ],
      },
      GARANTIA_AR("garantia", "La garantía de cada libro"),
    ],
  },
};

// ─── Catalán (tú) ─────────────────────────────────────────────────────────
// ca: PENDIENTE REVISIÓN NATIVA Y ABOGADO. Traducción de ES hecha por Claude
// Code el 14/10. Los nombres de leyes y organismos van con su nombre oficial.

const GARANTIA_CA = (id: string, titulo: string) =>
  seccionGarantia("ca", id, titulo, "A més del que s'ha dit, cada llibre té la seva garantia:", {
    familiar: "Familiar (el llibre d'una altra persona)",
    viaje: "De viatge",
    propia: "Per a tu (el teu propi llibre)",
  });

const CA: TextosLegal = {
  actualizado: "Darrera actualització",
  fecha: "14 d'octubre de 2026",
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
    enCorto: [
      "Pagament únic, per avançat. Sense subscripció i sense renovació automàtica.",
      "L'entrevista és per WhatsApp, amb àudios, al ritme del narrador. No comença res sense el seu permís: si no accepta, et retornem tots els diners.",
      "Abans de tancar el llibre el revises tu. El que s'imprimeix és el que aproves.",
      "Pots desistir: 14 dies naturals a Espanya, 10 dies seguits a l'Argentina.",
      "La història, els àudios i la veu són de la teva família. No els publiquem mai.",
    ],
    secciones: [
      {
        id: "quienes-somos",
        titulo: "1. Qui som",
        bloques: [
          p("Vitácora Familiar el presten dues persones, una a cada país on venem. Amb qui contractes depèn de la regió que tries en comprar (la mateixa que decideix la moneda i el mitjà de pagament):"),
          lista(
            "Si compres des d'**Espanya** (en euros): {titular:ES}.",
            "Si compres des de l'**Argentina** (en pesos): {titular:AR}.",
          ),
          p("En aquests termes, «nosaltres» és el titular que et correspon. Per a qualsevol cosa escriu a {hola} (o a {soporte} si és un problema amb la web) i et contestem."),
        ],
      },
      {
        id: "que-es",
        titulo: "2. Què és el servei",
        bloques: [
          p("Entrevistem per WhatsApp la persona que ens indiques (el «narrador»): li arriba una pregunta, la respon amb un àudio quan vol, sense instal·lar res, i quan acaba d'explicar li arriba la següent. Amb les seves respostes escrivim el llibre de la seva vida, en primera persona i amb les seves pròpies paraules."),
          p("El que pots comprar:"),
          lista(
            "**El llibre en PDF**: es llegeix a la web, capítol per capítol, amb les fotos que pugi la família. Inclou **«La seva veu»**: les seves millors frases, retallades dels seus àudios originals tal com les va dir, per escoltar a la web i amb un codi imprès. Sempre està disponible al teu compte.",
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
          p("El preu de cada producte apareix abans de pagar, en euros o en pesos segons la regió que triïs, i és el preu final que pagues. Després del pagament t'arriba un correu per entrar al teu compte amb un codi (sense contrasenya) i apuntar el teu narrador: el seu nom, el seu WhatsApp i unes quantes dades perquè les preguntes li sonin properes."),
        ],
      },
      {
        id: "permiso",
        titulo: "4. No comença res sense el seu permís",
        bloques: [
          p("En apuntar algú ens confirmes que ho pots fer i que li semblarà bé. Abans de la primera pregunta li escrivim per WhatsApp explicant-li qui l'ha apuntat i li demanem permís. **Si no accepta, no comença res i et retornem tots els diners** (vegeu la secció 8)."),
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
          p("Pots desistir de la compra sense donar explicacions. Escriu-nos a {hola} o fes servir el [botó de desistiment](/legal/arrepentimiento); et confirmem que l'hem rebut dins de les 24 hores i et retornem els diners pel mateix mitjà amb què vas pagar, en un termini màxim de 14 dies. El termini per desistir depèn d'on vas comprar:"),
          lista(
            "**Espanya — 14 dies naturals** des de la compra (dret de desistiment, arts. 102 a 108 del RDL 1/2007). En pagar ens demanes que l'entrevista comenci tan bon punt el narrador accepti, sense esperar aquests 14 dies; si te'n desdius amb l'entrevista ja en marxa, et retornem el preu menys la part proporcional a les preguntes ja fetes (art. 108.3). Un cop el llibre en PDF i les seves frases amb la seva veu són a la teva disposició al teu compte, amb el teu consentiment, el desistiment ja no s'hi aplica (art. 103 m); tampoc al llibre imprès ni als marcs, que es fan a mida (art. 103 c). Si alguna cosa arriba malmesa o amb un defecte, la reposem.",
            "**Argentina — 10 dies seguits** des de la compra (art. 34 de la llei 24.240). Pots revocar la compra sense cap cost i et retornem el total. El botó de penediment és a la pàgina d'inici, com exigeix la Resolució 424/2020.",
          ),
          p("Aquests terminis són els que marca la llei de cada país; mai no et donaran menys drets dels que et corresponen com a consumidor on vius."),
        ],
      },
      GARANTIA_CA("garantia", "7. La garantia de cada llibre"),
      {
        id: "sin-libro",
        titulo: "8. Si no hi ha llibre",
        bloques: [
          p("Si el narrador no accepta participar, o respon menys de deu preguntes i per això no hi ha material per a un llibre, et retornem l'import complet, sense termini i sense descompte: no et lliurem el que vas comprar, així que no t'ho cobrem. Preferim un llibre breu i veritable abans que un de llarg i farcit, però per sota de deu respostes no hi ha llibre."),
        ],
      },
      {
        id: "historia",
        titulo: "9. La història és de la teva família",
        bloques: [
          p("El que explica el teu narrador és seu i de la teva família. No ens quedem cap dret sobre la seva història, els seus àudios, les seves fotos ni la seva veu: ens dones únicament el permís necessari per transcriure, escriure, maquetar, retallar les seves frases i imprimir el teu llibre. Mai no publiquem la seva història, mai no la fem servir com a exemple i mai no l'ensenyem a ningú de fora de la teva família. Si algun dia volguéssim mostrar una pàgina com a mostra de la nostra feina, t'ho demanaríem per escrit i podries dir que no."),
          p("Les seves frases amb la seva veu són retalls dels seus propis àudios, sense cap veu sintètica. No es fan servir per a cap altra finalitat i s'esborren quan el narrador o tu ho demaneu."),
        ],
      },
      {
        id: "uso",
        titulo: "10. El que et demanem a tu",
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
        titulo: "11. Què et prometem i què no",
        bloques: [
          p("Et prometem que el llibre s'escriu amb les paraules del teu narrador, que per a ell serà fàcil —un àudio de WhatsApp quan vulgui— i que si alguna cosa surt malament ho arreglem o et retornem els diners."),
          p("Per transcriure els àudios i per redactar els capítols fem servir intel·ligència artificial, i es pot equivocar: un nom mal entès, una data, un gir que no és seu. Per això el llibre no es tanca fins que el revises tu, i per això et demanem que el llegeixis abans d'aprovar-lo. El que s'imprimeix és el que vas aprovar."),
          p("No et podem prometre quant voldrà explicar el teu narrador ni quantes preguntes respondrà. Si explica poc, el llibre surt més curt."),
          p("Si alguna cosa falla per culpa nostra, en responem fins a l'import que vas pagar. Això no limita cap dret que la llei del teu país no permeti limitar, ni la nostra responsabilitat per dol o per danys a les persones."),
        ],
      },
      {
        id: "datos",
        titulo: "12. Les teves dades",
        bloques: [
          p("Què guardem, qui ho tracta, quant de temps i com esborrar-ho és a la [política de privacitat](/legal/privacidad). En resum: els àudios i la veu són de la teva família, es fan servir només per al seu llibre, no es fan servir per entrenar cap model i s'esborren quan ho demanis."),
        ],
      },
      {
        id: "cambios",
        titulo: "13. Si alguna cosa canvia",
        bloques: [
          p("Si modifiquem aquests termes, t'avisem per correu abans que t'afectin. Els canvis mai no s'apliquen enrere sobre un llibre ja pagat: per a aquest llibre valen els termes que vas acceptar en comprar."),
        ],
      },
      {
        id: "ley",
        titulo: "14. Llei i jurisdicció",
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
        titulo: "15. Contacte",
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
      "Els àudios originals s'esborren tan bon punt tu o el narrador ho demaneu.",
      "Només fem servir galetes tècniques: ni de publicitat ni d'analítica.",
      "Per a qualsevol cosa sobre les teves dades, n'hi ha prou amb un correu a {hola}.",
    ],
    secciones: [
      {
        id: "responsables",
        titulo: "1. Qui respon de les teves dades",
        bloques: [
          p("El responsable del tractament és el titular del servei a la teva regió, la que vas triar en comprar:"),
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
          p("**Del narrador**: el seu nom i com li agrada que li diguin, el seu número de WhatsApp, la seva zona horària, i les dades que ens dones perquè les preguntes li sonin properes (on i quan va néixer, a què es va dedicar, qui és qui a la seva família). I el més important: els **àudios** que grava, les **transcripcions** que en fem, els **textos** del llibre i les **fotos** que puja la família."),
          p("**La seva veu**: les seves millors frases es retallen dels seus propis àudios, tal com les va dir, per escoltar-les a la web i amb el codi imprès al llibre. No creem cap veu sintètica. Si algun dia oferíssim un producte amb la seva veu clonada —una **dada biomètrica**—, només ho faríem amb el consentiment explícit del narrador, demanat per WhatsApp per a aquesta finalitat concreta."),
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
            "**Per avisar-te** per correu de com va (quan accepta, quan respon la primera, a mig camí, si es queda en silenci, quan el llibre és a punt). És part del servei.",
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
              ["Vercel", "Allotja la web que estàs llegint i el teu panell.", "Estats Units (xarxa global)"],
              ["Railway", "Executa l'entrevistador (el que envia i rep els WhatsApp) i la fàbrica que produeix el llibre i tria les seves frases.", "Estats Units"],
              ["Meta (WhatsApp Business)", "Porta i duu els missatges i àudios entre el narrador i nosaltres. Meta veu els missatges com els veuria en qualsevol xat de WhatsApp Business.", "Segons les normes de Meta"],
              ["OpenAI", "Transcriu els àudios a text. Per API: no fa servir el que li enviem per entrenar els seus models.", "Estats Units"],
              ["Anthropic", "Redacta els capítols a partir de les transcripcions, amb les paraules del narrador. Per API: no fa servir el que li enviem per entrenar els seus models.", "Estats Units"],
              ["Stripe / Mercado Pago", "Cobren. Són els únics que veuen la teva targeta.", "Stripe: UE i EUA · Mercado Pago: Argentina"],
              ["Resend", "Envia els correus: el codi per entrar i els avisos.", "Brasil (regió d'Amèrica del Sud)"],
              ["Impremta i missatgeria", "Només si compres el llibre imprès o els marcs: reben l'arxiu, el teu nom i l'adreça d'enviament.", "Al teu país; et diem quina abans d'enviar-ho a produir"],
            ],
          ),
        ],
      },
      {
        id: "transferencias",
        titulo: "6. Dades que surten del teu país",
        bloques: [
          p("Com veus a la taula, alguns d'aquests serveis són als Estats Units. Si ets a la Unió Europea, aquestes transferències es fan sota el Marc de Privacitat de Dades UE-EUA o amb les clàusules contractuals tipus aprovades per la Comissió Europea, segons el proveïdor. L'Argentina té decisió d'adequació de la Unió Europea, així que les dades poden circular entre els dos països sense garanties addicionals. Si vols veure els contractes amb un proveïdor concret, demana'ls per correu."),
        ],
      },
      {
        id: "cuanto-tiempo",
        titulo: "7. Quant de temps les guardem",
        bloques: [
          lista(
            "**El llibre, les seves frases amb la seva veu, les fotos i els àudios**: mentre el llibre sigui al teu compte. Hi són perquè la família hi torni quan vulgui.",
            "**Els àudios originals**: a més, s'esborren tan bon punt tu o el narrador ho demaneu, encara que el llibre continuï al teu compte. Les seves frases amb la seva veu són retalls d'aquests mateixos àudios: si demanes esborrar els originals, també s'esborren els retalls, i els codis del llibre imprès deixen de sonar.",
            "**El teu compte**: fins que demanis tancar-lo. Si el tanques, esborrem tot el que hi ha a dalt.",
            "**Les dades de la compra** (què, quan, quant, a nom de qui): el temps que exigeix la llei fiscal de cada país, encara que tanquis el compte.",
            "**Els registres tècnics**: uns quants mesos, només per seguretat.",
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
          p("Només fem servir galetes tècniques, les imprescindibles perquè la web funcioni: la que manté la teva sessió oberta quan entres al teu compte, la que recorda si prefereixes el panell clar o fosc i la que recorda l'idioma que tries a la web. Mentre compres, el navegador guarda en aquella pestanya el que vas omplint, per no perdre-ho si tornes enrere; s'esborra en tancar-la. No fem servir galetes de publicitat ni d'analítica, i per això no et mostrem cap avís. Si algun dia afegim una eina de mesura, et demanarem el consentiment abans d'activar-la i aquesta secció canviarà."),
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
          p("{hola} per a tot el que tingui a veure amb les teves dades, les del narrador o les d'un convidat. Et contesta una de les dues persones de la secció 1, no un sistema."),
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
      "Espanya: 14 dies naturals des de la compra. Argentina: 10 dies seguits, sense cost.",
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
          lista(
            "**Argentina**: 10 dies seguits des de la compra, sense cost (art. 34 de la llei 24.240).",
            "**Espanya**: 14 dies naturals des de la compra. Si l'entrevista ja va començar a petició teva, es descompta la part ja feta; el PDF (amb les seves frases amb la seva veu) ja lliurat i els productes a mida (imprès, marcs) no es poden retornar.",
            "**Sense termini**: si el narrador no accepta participar o respon menys de deu preguntes, t'ho retornem tot, sempre.",
          ),
          p("El detall és a la secció [«Si te'n desdius» dels termes](/legal/terminos#arrepentimiento)."),
        ],
      },
      GARANTIA_CA("garantia", "La garantia de cada llibre"),
    ],
  },
};

export const TEXTOS_LEGAL: Textos<TextosLegal> = { es: ES, ca: CA, ar: AR };

/** El orden de las solapas: los tres textos legales. */
export const DOCUMENTOS_LEGALES: readonly DocumentoLegal[] = ["terminos", "privacidad", "arrepentimiento"];
