import type { Textos } from "@/lib/idioma-web";
import type { Bloque, SeccionLegal, TextoDocumento } from "./legal";

// Las condiciones del programa de creadores (21/10): la página /legal/creadores
// (/ca/legal/creadores, /ar/legal/creadores). Solo se publica con CREADORES=1
// (legal/pagina.tsx). No va en las solapas de los legales todavía: se llega
// desde el formulario de /colabora y desde los mails al creador.
//
// ⚠️ BORRADOR, PENDIENTE DEL ABOGADO. Va entero en docs/creadores/textos-para-aprobar.md
// (tandas CR-L). Sin porcentajes fijos: la comisión y el descuento son de cada creador.
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
      p("La comisión se calcula sobre lo que la persona pagó de verdad, con el descuento ya aplicado. Cuenta cuando el pago entra."), // CR-L06
      p("Una venta es una compra pagada en la web con tu código escrito en el casillero del código, o entrando por tu link."), // CR-L06
    ),
    s(
      "donde",
      "Dónde vale",
      p("Tu código vale al comprar en la web, donde aparece el casillero del código. No se suma a otros cupones ni a precios ya rebajados. Va un solo código por compra."), // CR-L07
    ),
    s("devoluciones", "Si se devuelve una compra", p("Si se devuelve una compra hecha con tu código, su comisión se anula.")), // CR-L08
    s(
      "pago",
      "Cómo te pagamos",
      p("Te pagamos por transferencia lo que tengas por cobrar. Cuando toque, te escribimos para pedirte los datos. No guardamos tus datos bancarios en la web."), // CR-L09
      p("Los impuestos que correspondan por lo que cobras son tuyos."), // CR-L09
    ),
    s(
      "como-compartir",
      "Cómo lo compartes",
      p("Habla de Vitácora con tus palabras y con honestidad. Di que es una colaboración y que ganas una comisión con tu código."), // CR-L10
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
      p("Tu panel no muestra ningún dato de quien compra. Para borrar tus datos, escríbenos a {soporte}."), // CR-L12
    ),
    s("cambios", "Cambios", p("Si cambiamos estas condiciones, te lo contamos por correo antes de que valgan.")), // CR-L13
  ],
};

const AR: TextoDocumento = {
  ...ES,
  bajada: "Cómo funciona colaborar con Vitácora con tu propio código.",
  secciones: [
    s("quien", "Quién lo organiza", p("El programa lo organiza Vitácora Familiar, {titular:AR}.")),
    ES.secciones[1],
    s(
      "alta",
      "Cómo entrás",
      p("Te anotás en la web y revisamos cada solicitud a mano. Podemos decir que no. Si decimos que sí, te mandamos por correo tu código, tu link para compartir y el link a tu panel."),
    ),
    ES.secciones[3],
    ES.secciones[4],
    ES.secciones[5],
    ES.secciones[6],
    s(
      "pago",
      "Cómo te pagamos",
      p("Te pagamos por transferencia lo que tengas por cobrar. Cuando toque, te escribimos para pedirte los datos. No guardamos tus datos bancarios en la web."),
      p("Los impuestos que correspondan por lo que cobrás son tuyos."),
    ),
    s(
      "como-compartir",
      "Cómo lo compartís",
      p("Hablá de Vitácora con tus palabras y con honestidad. Decí que es una colaboración y que ganás una comisión con tu código."),
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
      p("Tu panel no muestra ningún dato de quien compra. Para borrar tus datos, escribinos a {soporte}."),
    ),
    ES.secciones[11],
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
      p("La comissió es calcula sobre el que la persona va pagar de debò, amb el descompte ja aplicat. Compta quan entra el pagament."),
      p("Una venda és una compra pagada a la web amb el teu codi escrit a la casella del codi, o entrant pel teu enllaç."),
    ),
    s(
      "donde",
      "On val",
      p("El teu codi val en comprar a la web, on apareix la casella del codi. No es pot sumar a altres cupons ni a preus ja rebaixats. Va un sol codi per compra."),
    ),
    s("devoluciones", "Si es retorna una compra", p("Si es retorna una compra feta amb el teu codi, la seva comissió s'anul·la.")),
    s(
      "pago",
      "Com et paguem",
      p("Et paguem per transferència el que tinguis per cobrar. Quan toqui, t'escriurem per demanar-te les dades. No guardem les teves dades bancàries a la web."),
      p("Els impostos que corresponguin pel que cobres són teus."),
    ),
    s(
      "como-compartir",
      "Com el comparteixes",
      p("Parla de Vitácora amb les teves paraules i amb honestedat. Digues que és una col·laboració i que guanyes una comissió amb el teu codi."),
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
      p("El teu panell no mostra cap dada de qui compra. Per esborrar les teves dades, escriu-nos a {soporte}."),
    ),
    s("cambios", "Canvis", p("Si canviem aquestes condicions, t'ho explicarem per correu abans que valguin.")),
  ],
};

export const CONDICIONES_CREADORES: Textos<TextoDocumento> = { es: ES, ca: CA, ar: AR };
