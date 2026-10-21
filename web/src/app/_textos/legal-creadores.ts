import type { IdiomaWeb, Textos } from "@/lib/idioma-web";
import type { Bloque, SeccionLegal, TextoDocumento } from "./legal";

// Las condiciones del programa de creadores (21/10): la página /legal/creadores
// (/ca/legal/creadores, /ar/legal/creadores). Solo se publica con CREADORES=1
// (legal/pagina.tsx). No va en las solapas de los legales todavía: se llega
// desde el formulario de /colabora y desde los mails al creador.
//
// ⚠️ BORRADOR, PENDIENTE DEL ABOGADO. Va entero en docs/creadores/textos-para-aprobar.md
// (tandas CR-L). Sin porcentajes fijos: la comisión y el descuento son de cada creador.
// Los cambios de la revisión legal del 21/10 (CR-L06, L08, L09, L10, L12 y las nuevas
// L14, L15 y L16) van en la tanda 6 y están marcados «PENDIENTE OK de Naza».
//
// Marcas: las mismas de _textos/legal.ts ({titular:ES}, {soporte}, [enlace](/ruta)).
// ca: falta pasarlo por el corrector de Softcatalà.

const p = (texto: string): Bloque => ({ tipo: "parrafo", texto });
const s = (id: string, titulo: string, ...bloques: Bloque[]): SeccionLegal => ({ id, titulo, bloques });

const ES: TextoDocumento = {
  titulo: "Condiciones del programa de creadores", // CR-L01
  bajada: "Cómo funciona colaborar con Vitácora con tu propio código.", // CR-L01
  descripcion: "Las condiciones del programa de creadores de Vitácora.", // CR-L01
  enCorto: [],
  secciones: [
    s("quien", "Quién lo organiza", p("El programa lo organiza Vitácora Familiar, {titular:ES}.")), // CR-L02
    s(
      "que",
      "Qué es",
      p("Te damos un código propio para compartir con tu comunidad. Cada compra pagada en la web con tu código te deja una comisión."), // CR-L03
      p("Tu código también puede darle un descuento a quien compra. El descuento es sobre el libro digital, también si va dentro del pack."), // CR-L03
    ),
    s(
      "relacion",
      "Qué relación tenemos",
      p("Colaborar con Vitácora no es un trabajo ni te hace agente nuestro. Recomiendas Vitácora por tu cuenta y sin exclusividad. No vendes ni negocias nada en nuestro nombre."), // CR-L14 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    ),
    s("participar", "Quién puede participar", p("Para sumarte tienes que ser mayor de 18 años.")), // CR-L16 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    s(
      "alta",
      "Cómo entras",
      p("Te anotas en la web y revisamos cada solicitud a mano. Podemos decir que no. Si decimos que sí, te mandamos por correo tu código, tu link para compartir y el link a tu panel."), // CR-L04
    ),
    s(
      "porcentajes",
      "La comisión y el descuento",
      p("La comisión y el descuento son de cada creador. Te los decimos en el correo de bienvenida y los ves en tu panel."), // CR-L05
      p("Podemos cambiarlos más adelante. Las ventas que ya se hicieron no cambian."), // CR-L05
    ),
    s(
      "calculo",
      "Cómo se calcula",
      p("La comisión se calcula sobre lo que la persona pagó de verdad, con el descuento ya aplicado."), // CR-L06 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("Cada comisión queda en espera 14 días desde la compra. Pasado ese tiempo pasa a por cobrar."), // CR-L06 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("Una venta es una compra pagada en la web con tu código escrito en el casillero del código, o entrando por tu link."), // CR-L06
    ),
    s(
      "donde",
      "Dónde vale",
      p("Tu código vale al comprar en la web, donde aparece el casillero del código. No se suma a otros cupones ni a precios ya rebajados. Va un solo código por compra."), // CR-L07
    ),
    s("propias", "Tus propias compras", p("Las compras que hagas tú con tu propio código no te dejan comisión.")), // CR-L15 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    s(
      "devoluciones",
      "Si se devuelve una compra",
      p("Si una compra hecha con tu código se devuelve en esos 14 días, su comisión no cuenta. Si se devuelve después, la descontamos de lo que tengas por cobrar."), // CR-L08 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    ),
    s(
      "pago",
      "Cómo te pagamos",
      p("Te pagamos por transferencia lo que tengas por cobrar. Cuando toque, te escribimos para pedirte los datos y la factura que corresponda en tu país. No guardamos tus datos bancarios en la web."), // CR-L09 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("Los impuestos que correspondan por lo que cobras son tuyos."), // CR-L09
    ),
    s(
      "como-compartir",
      "Cómo lo compartes",
      p("Cada vez que hables de Vitácora, di que es publicidad desde el principio y que se vea bien, con #publi o «colaboración pagada». Vale también si la Vitácora te la regalamos nosotros."), // CR-L10 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("No prometas cosas que Vitácora no hace. No uses publicidad pagada con nuestro nombre sin hablarlo antes con nosotros."), // CR-L10
    ),
    s(
      "salir",
      "Si quieres dejarlo",
      p("Puedes dejar el programa cuando quieras. Nos escribes a {soporte} y listo."), // CR-L11
      p("Podemos pausar o cerrar tu código si no se cumplen estas condiciones. Lo que ya tengas por cobrar te lo pagamos igual."), // CR-L11
    ),
    s(
      "datos",
      "Tus datos",
      p("Guardamos tu nombre, tu correo, dónde publicas, tu perfil y lo que nos cuentes. También la fecha, la hora y la dirección IP de cuando te anotaste. Los usamos solo para el programa."), // CR-L12
      p("Guardamos tus datos mientras estés en el programa. Después, solo lo que pide la ley para la contabilidad, durante 6 años."), // CR-L12 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("Tu panel no muestra ningún dato de quien compra. Para borrar tus datos, escríbenos a {soporte}."), // CR-L12
    ),
    s("cambios", "Cambios", p("Si cambiamos estas condiciones, te lo contamos por correo antes de que valgan.")), // CR-L13
  ],
};

// Argentina: hoy el alta está cerrada (IDIOMAS_CON_ALTA, lib/creadores.ts), pero
// el texto queda listo para cuando se abra.
const deES = (id: string): SeccionLegal => ES.secciones.find((x) => x.id === id)!;

const AR: TextoDocumento = {
  ...ES,
  bajada: "Cómo funciona colaborar con Vitácora con tu propio código.",
  secciones: [
    s("quien", "Quién lo organiza", p("El programa lo organiza Vitácora Familiar, {titular:AR}.")),
    deES("que"),
    s(
      "relacion",
      "Qué relación tenemos",
      p("Colaborar con Vitácora no es un trabajo ni te hace agente nuestro. Recomendás Vitácora por tu cuenta y sin exclusividad. No vendés ni negociás nada en nuestro nombre."), // CR-L14 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    ),
    s("participar", "Quién puede participar", p("Para sumarte tenés que ser mayor de 18 años.")), // CR-L16 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    s(
      "alta",
      "Cómo entrás",
      p("Te anotás en la web y revisamos cada solicitud a mano. Podemos decir que no. Si decimos que sí, te mandamos por correo tu código, tu link para compartir y el link a tu panel."),
    ),
    deES("porcentajes"),
    deES("calculo"),
    deES("donde"),
    s("propias", "Tus propias compras", p("Las compras que hagas vos con tu propio código no te dejan comisión.")), // CR-L15 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    deES("devoluciones"),
    s(
      "pago",
      "Cómo te pagamos",
      p("Te pagamos por transferencia lo que tengas por cobrar. Cuando toque, te escribimos para pedirte los datos y la factura que corresponda en tu país. No guardamos tus datos bancarios en la web."), // CR-L09 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("Los impuestos que correspondan por lo que cobrás son tuyos."),
    ),
    s(
      "como-compartir",
      "Cómo lo compartís",
      p("Cada vez que hables de Vitácora, decí que es publicidad desde el principio y que se vea bien, con #publi o «colaboración paga». Vale también si la Vitácora te la regalamos nosotros."), // CR-L10 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("No prometas cosas que Vitácora no hace. No uses publicidad paga con nuestro nombre sin hablarlo antes con nosotros."),
    ),
    s(
      "salir",
      "Si querés dejarlo",
      p("Podés dejar el programa cuando quieras. Nos escribís a {soporte} y listo."),
      p("Podemos pausar o cerrar tu código si no se cumplen estas condiciones. Lo que ya tengas por cobrar te lo pagamos igual."),
    ),
    s(
      "datos",
      "Tus datos",
      p("Guardamos tu nombre, tu correo, dónde publicás, tu perfil y lo que nos cuentes. También la fecha, la hora y la dirección IP de cuando te anotaste. Los usamos solo para el programa."),
      p("Guardamos tus datos mientras estés en el programa. Después, solo lo que pide la ley para la contabilidad, durante 6 años."), // CR-L12 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("Tu panel no muestra ningún dato de quien compra. Para borrar tus datos, escribinos a {soporte}."),
    ),
    deES("cambios"),
  ],
};

const CA: TextoDocumento = {
  titulo: "Condicions del programa de creadors",
  bajada: "Com funciona col·laborar amb Vitácora amb el teu propi codi.",
  descripcion: "Les condicions del programa de creadors de Vitácora.",
  enCorto: [],
  secciones: [
    s("quien", "Qui l'organitza", p("El programa l'organitza Vitácora Familiar, {titular:ES}.")),
    s(
      "que",
      "Què és",
      p("Et donem un codi propi per compartir amb la teva comunitat. Cada compra pagada a la web amb el teu codi et deixa una comissió."),
      p("El teu codi també pot donar un descompte a qui compra. El descompte és sobre el llibre digital, també si va dins del pack."),
    ),
    s(
      "relacion",
      "Quina relació tenim",
      p("Col·laborar amb Vitácora no és una feina ni et fa agent nostre. Recomanes Vitácora pel teu compte i sense exclusivitat. No vens ni negocies res en nom nostre."), // CR-L14 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    ),
    s("participar", "Qui hi pot participar", p("Per sumar-t'hi has de ser major de 18 anys.")), // CR-L16 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    s(
      "alta",
      "Com hi entres",
      p("T'apuntes a la web i revisem cada sol·licitud a mà. Podem dir que no. Si diem que sí, t'enviem per correu el teu codi, el teu enllaç per compartir i l'enllaç al teu panell."),
    ),
    s(
      "porcentajes",
      "La comissió i el descompte",
      p("La comissió i el descompte són de cada creador. Te'ls diem al correu de benvinguda i els veus al teu panell."),
      p("Podem canviar-los més endavant. Les vendes que ja s'han fet no canvien."),
    ),
    s(
      "calculo",
      "Com es calcula",
      p("La comissió es calcula sobre el que la persona va pagar de debò, amb el descompte ja aplicat."), // CR-L06 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("Cada comissió queda en espera 14 dies des de la compra. Passat aquest temps passa a per cobrar."), // CR-L06 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("Una venda és una compra pagada a la web amb el teu codi escrit a la casella del codi, o entrant pel teu enllaç."),
    ),
    s(
      "donde",
      "On val",
      p("El teu codi val en comprar a la web, on apareix la casella del codi. No es pot sumar a altres cupons ni a preus ja rebaixats. Va un sol codi per compra."),
    ),
    s("propias", "Les teves pròpies compres", p("Les compres que facis tu amb el teu propi codi no et deixen comissió.")), // CR-L15 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    s(
      "devoluciones",
      "Si es retorna una compra",
      p("Si una compra feta amb el teu codi es retorna en aquests 14 dies, la seva comissió no compta. Si es retorna després, la descomptem del que tinguis per cobrar."), // CR-L08 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
    ),
    s(
      "pago",
      "Com et paguem",
      p("Et paguem per transferència el que tinguis per cobrar. Quan toqui, t'escriurem per demanar-te les dades i la factura que correspongui al teu país. No guardem les teves dades bancàries a la web."), // CR-L09 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("Els impostos que corresponguin pel que cobres són teus."),
    ),
    s(
      "como-compartir",
      "Com el comparteixes",
      p("Cada vegada que parlis de Vitácora, digues que és publicitat des del principi i que es vegi bé, amb #publi o «col·laboració pagada». També val si la Vitácora te la regalem nosaltres."), // CR-L10 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("No prometis coses que Vitácora no fa. No facis servir publicitat pagada amb el nostre nom sense parlar-ne abans amb nosaltres."),
    ),
    s(
      "salir",
      "Si ho vols deixar",
      p("Pots deixar el programa quan vulguis. Ens escrius a {soporte} i llestos."),
      p("Podem pausar o tancar el teu codi si no es compleixen aquestes condicions. El que ja tinguis per cobrar t'ho paguem igualment."),
    ),
    s(
      "datos",
      "Les teves dades",
      p("Guardem el teu nom, el teu correu, on publiques, el teu perfil i el que ens expliquis. També la data, l'hora i l'adreça IP de quan et vas apuntar. Les fem servir només per al programa."),
      p("Guardem les teves dades mentre siguis al programa. Després, només el que demana la llei per a la comptabilitat, durant 6 anys."), // CR-L12 · PENDIENTE OK de Naza (tanda 6, legal 21/10)
      p("El teu panell no mostra cap dada de qui compra. Per esborrar les teves dades, escriu-nos a {soporte}."),
    ),
    s("cambios", "Canvis", p("Si canviem aquestes condicions, t'ho explicarem per correu abans que valguin.")),
  ],
};

export const CONDICIONES_CREADORES: Textos<TextoDocumento> = { es: ES, ca: CA, ar: AR };

// ── Privacidad (legal, 21/10) · CR-L17 · APROBADO por Naza 21/10 (tanda 6) ──────────────
// Con CREADORES=1 la política de privacidad suma una sección para los creadores
// (qué datos, para qué, con qué base, cuánto tiempo y cómo pedir verlos o
// borrarlos), igual que el cupón suma su «4 bis» con RASCA_Y_GANA=1. Va después
// de «4. Para qué los usamos» y, si está el del cupón, después del «4 bis».

const PRIVACIDAD_CREADORES: Record<IdiomaWeb, { titulo: string; texto: string }> = {
  es: {
    titulo: "Programa de creadores",
    texto:
      "Si te anotas como creador, tratamos tu nombre, tu correo, dónde publicas, tu perfil y lo que nos cuentes para gestionar el programa y pagarte las comisiones. Lo hacemos porque lo pides al anotarte. Guardamos tus datos mientras estés en el programa y después 6 años por la contabilidad. Puedes pedirnos verlos, corregirlos o borrarlos en {soporte}.",
  },
  ar: {
    titulo: "Programa de creadores",
    texto:
      "Si te anotás como creador, tratamos tu nombre, tu correo, dónde publicás, tu perfil y lo que nos cuentes para gestionar el programa y pagarte las comisiones. Lo hacemos porque lo pedís al anotarte. Guardamos tus datos mientras estés en el programa y después 6 años por la contabilidad. Podés pedirnos verlos, corregirlos o borrarlos en {soporte}.",
  },
  ca: {
    titulo: "Programa de creadors",
    texto:
      "Si t'apuntes com a creador, tractem el teu nom, el teu correu, on publiques, el teu perfil i el que ens expliquis per gestionar el programa i pagar-te les comissions. Ho fem perquè ho demanes en apuntar-te. Guardem les teves dades mentre siguis al programa i després 6 anys per la comptabilitat. Pots demanar-nos veure-les, corregir-les o esborrar-les a {soporte}.",
  },
};

/** La privacidad con la sección del programa de creadores: «4 bis» o, si ya está la del cupón, «4 ter». */
export function privacidadConCreadores(doc: TextoDocumento, idioma: IdiomaWeb): TextoDocumento {
  const conCupon = doc.secciones.some((x) => x.id === "cupon");
  const despuesDe = conCupon ? "cupon" : "para-que";
  const { titulo, texto } = PRIVACIDAD_CREADORES[idioma];
  const seccion = s("creadores", `4 ${conCupon ? "ter" : "bis"}. ${titulo}`, p(texto));
  const secciones: SeccionLegal[] = [];
  for (const x of doc.secciones) {
    secciones.push(x);
    if (x.id === despuesDe) secciones.push(seccion);
  }
  return { ...doc, secciones };
}
