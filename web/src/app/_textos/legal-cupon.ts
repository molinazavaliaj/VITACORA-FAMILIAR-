import type { IdiomaWeb, Textos } from "@/lib/idioma-web";
import type { Bloque, SeccionLegal, TextoDocumento } from "./legal";

// Lo legal del cupón de bienvenida (rasca y gana, 20/10): la página «Bases del
// cupón» (/legal/cupon, /ca/legal/cupon, /ar/legal/cupon) y lo que se suma a
// la privacidad. Solo se publica con RASCA_Y_GANA=1 (legal/pagina.tsx).
//
// Bases: los textos 11–20 de la tanda 2 (fase-5/textos-legales-nuevos.md,
// APROBADOS por Naza 19/10, falta el abogado) con los arreglos de
// respuesta-19-10.md §1.6, SIN las notas internas. Cada frase lleva su marca:
//   // T2-NN   = texto NN de la tanda 2, aprobado (castellano de tú)
//   // §1.6    = frase del arreglo de respuesta-19-10.md §1.6 (APROBADO por Naza 20/10, CU-21)
// Dos cambios de forma sobre §1.6, para la regla de la casa (sin dos puntos):
// «El código es personal. Si lo compartes…» y «No es un sorteo. No hay azar…».
// El vos (ar), el catalán (ca) y la privacidad (CU-22 a CU-24 en
// docs/rediseno-2026-10/fase-5/textos-cupon-para-aprobar.md): APROBADOS por Naza
// el 20/10 (falta el abogado; el catalán, falta pasarlo por Softcatalà).
//
// Marcas: las mismas de _textos/legal.ts ({titular:ES}, {soporte}, [enlace](/ruta)).

const p = (texto: string): Bloque => ({ tipo: "parrafo", texto });
const s = (id: string, titulo: string, ...bloques: Bloque[]): SeccionLegal => ({ id, titulo, bloques });

const BASES_ES: TextoDocumento = {
  titulo: "Bases del cupón de bienvenida", // T2-11
  bajada: "Un 10 % de descuento sobre el libro digital, para cada correo que lo pide.", // APROBADO por Naza 20/10 · CU-21
  descripcion: "Las condiciones del cupón de bienvenida de Vitácora.", // APROBADO por Naza 20/10 · CU-21
  enCorto: [],
  secciones: [
    s("quien", "Quién lo da", p("El cupón lo da Vitácora Familiar, {titular:ES}.")), // T2-12 con el arreglo de §1.6
    s(
      "que",
      "Qué es",
      p("Un 10 % de descuento sobre el libro digital. No se aplica al libro impreso, a los marcos ni a las copias."), // T2-13
      p("Si compras un pack, el 10 % se calcula sobre el precio del libro digital que incluye el pack."), // §1.6
    ),
    s(
      "donde",
      "Dónde vale",
      p("Vale para cualquier Vitácora que se venda en la web, en España y en Argentina."), // T2-14
      p("El cupón se emite para el país en el que lo pides y solo vale en la web de ese país."), // §1.6
    ),
    s(
      "cuando",
      "Hasta cuándo",
      p("Vale 30 días desde que te llega por correo. Después caduca solo."), // T2-15
      p("El último día también vale. La fecha exacta va en cada correo."), // §1.6
    ),
    s(
      "cuantas",
      "Cuántas veces",
      p("Un solo uso por código. El código es personal. Si lo compartes y alguien lo usa antes que tú, el cupón queda gastado."), // §1.6 (reemplaza a T2-16)
    ),
    s(
      "otras",
      "Con otras ofertas",
      p("No se suma a otros cupones ni a precios ya rebajados. El pack no es un cupón, así que el cupón también vale con el pack."), // T2-17 con §1.6
    ),
    s("como", "Cómo se usa", p("Escribes tu código al pagar y el descuento aparece en el total antes de confirmar.")), // T2-18
    s("no-funciona", "Si el código no funciona", p("Escríbenos a {soporte} y te respondemos en un plazo máximo de 5 días hábiles.")), // §1.6
    s(
      "devoluciones",
      "Devoluciones",
      p("Si te devolvemos una compra hecha con el cupón, te devolvemos lo que pagaste de verdad, con el descuento ya aplicado. El cupón no se cambia por dinero."), // T2-19
      p("Si se devuelve la compra, el cupón no se vuelve a activar."), // §1.6
    ),
    s("sorteo", "No es un sorteo", p("No es un sorteo. No hay azar y todas las personas reciben el mismo cupón.")), // §1.6
    s(
      "cambios",
      "Cambios",
      p("Si algún día cambiamos estas bases, los cupones que ya entregamos siguen valiendo como estaban."), // T2-20
      p("Estas bases no limitan tus derechos como consumidor."), // §1.6
    ),
  ],
};

// APROBADO por Naza 20/10 · CU-22: lo mismo de vos, con el titular de Argentina.
const BASES_AR: TextoDocumento = {
  ...BASES_ES,
  secciones: [
    s("quien", "Quién lo da", p("El cupón lo da Vitácora Familiar, {titular:AR}.")),
    s(
      "que",
      "Qué es",
      p("Un 10 % de descuento sobre el libro digital. No se aplica al libro impreso, a los marcos ni a las copias."),
      p("Si comprás un pack, el 10 % se calcula sobre el precio del libro digital que incluye el pack."),
    ),
    s(
      "donde",
      "Dónde vale",
      p("Vale para cualquier Vitácora que se venda en la web, en España y en Argentina."),
      p("El cupón se emite para el país en el que lo pedís y solo vale en la web de ese país."),
    ),
    BASES_ES.secciones[3],
    s("cuantas", "Cuántas veces", p("Un solo uso por código. El código es personal. Si lo compartís y alguien lo usa antes que vos, el cupón queda gastado.")),
    BASES_ES.secciones[5],
    s("como", "Cómo se usa", p("Escribís tu código al pagar y el descuento aparece en el total antes de confirmar.")),
    s("no-funciona", "Si el código no funciona", p("Escribinos a {soporte} y te respondemos en un plazo máximo de 5 días hábiles.")),
    BASES_ES.secciones[8],
    BASES_ES.secciones[9],
    BASES_ES.secciones[10],
  ],
};

// APROBADO por Naza 20/10 · CU-23: traducción al catalán, a revisar con Softcatalà.
const BASES_CA: TextoDocumento = {
  titulo: "Bases del cupó de benvinguda",
  bajada: "Un 10 % de descompte sobre el llibre digital, per a cada correu que el demana.",
  descripcion: "Les condicions del cupó de benvinguda de Vitácora.",
  enCorto: [],
  secciones: [
    s("quien", "Qui el dona", p("El cupó el dona Vitácora Familiar, {titular:ES}.")),
    s(
      "que",
      "Què és",
      p("Un 10 % de descompte sobre el llibre digital. No s'aplica al llibre imprès, als marcs ni a les còpies."),
      p("Si compres un pack, el 10 % es calcula sobre el preu del llibre digital que inclou el pack."),
    ),
    s(
      "donde",
      "On val",
      p("Val per a qualsevol Vitácora que es vengui a la web, a Espanya i a l'Argentina."),
      p("El cupó s'emet per al país on el demanes i només val a la web d'aquest país."),
    ),
    s("cuando", "Fins quan", p("Val 30 dies des que t'arriba per correu. Després venç sol."), p("L'últim dia també val. La data exacta va a cada correu.")),
    s("cuantas", "Quantes vegades", p("Un sol ús per codi. El codi és personal. Si el comparteixes i algú el fa servir abans que tu, el cupó queda gastat.")),
    s("otras", "Amb altres ofertes", p("No es pot sumar a altres cupons ni a preus ja rebaixats. El pack no és un cupó, així que el cupó també val amb el pack.")),
    s("como", "Com es fa servir", p("Escrius el teu codi en pagar i el descompte apareix al total abans de confirmar.")),
    s("no-funciona", "Si el codi no funciona", p("Escriu-nos a {soporte} i et responem en un termini màxim de 5 dies hàbils.")),
    s(
      "devoluciones",
      "Devolucions",
      p("Si et retornem una compra feta amb el cupó, et retornem el que vas pagar de debò, amb el descompte ja aplicat. El cupó no es canvia per diners."),
      p("Si es retorna la compra, el cupó no es torna a activar."),
    ),
    s("sorteo", "No és un sorteig", p("No és un sorteig. No hi ha atzar i totes les persones reben el mateix cupó.")),
    s(
      "cambios",
      "Canvis",
      p("Si algun dia canviem aquestes bases, els cupons que ja hem lliurat continuen valent com estaven."),
      p("Aquestes bases no limiten els teus drets com a consumidor."),
    ),
  ],
};

export const BASES_CUPON: Textos<TextoDocumento> = { es: BASES_ES, ca: BASES_CA, ar: BASES_AR };

// ── Privacidad (respuesta-19-10.md §1.9) · APROBADO por Naza 20/10 · CU-24 ───────────────
// Finalidad, base, datos, plazo, proveedor y cómo retirar el consentimiento.
// Va como «4 bis», después de «4. Para qué los usamos»; y la frase «no usamos
// tus datos para publicidad» de esa sección suma la excepción.

const SECCION_PRIVACIDAD: Record<IdiomaWeb, SeccionLegal> = {
  es: s(
    "cupon",
    "4 bis. El cupón de bienvenida",
    p("Si pides el cupón de bienvenida en la web, guardamos tu correo, el país, si aceptaste los recordatorios, y la fecha, la hora y la dirección IP de cuando lo pediste y lo confirmaste. Así podemos demostrar que lo pediste tú."),
    p("**Para mandarte el cupón** usamos tu correo porque lo pediste tú. Es una medida previa a una compra que tú solicitas."),
    p("**Para los recordatorios** (hasta 4 en los 14 días siguientes) solo si marcaste esa casilla. Es tu consentimiento, y lo retiras cuando quieras con el enlace de baja de cada correo, sin dar explicaciones."),
    p("No mandamos nada hasta que confirmas tu correo. Si no lo confirmas, borramos el pedido a los 30 días. Si lo confirmas, guardamos el cupón 24 meses desde que lo pediste."),
    p("Los mails los manda Resend (ver la tabla del punto 5). No le damos tu correo a nadie más."),
  ),
  ar: s(
    "cupon",
    "4 bis. El cupón de bienvenida",
    p("Si pedís el cupón de bienvenida en la web, guardamos tu correo, el país, si aceptaste los recordatorios, y la fecha, la hora y la dirección IP de cuando lo pediste y lo confirmaste. Así podemos demostrar que lo pediste vos."),
    p("**Para mandarte el cupón** usamos tu correo porque lo pediste vos. Es una medida previa a una compra que vos solicitás."),
    p("**Para los recordatorios** (hasta 4 en los 14 días siguientes) solo si marcaste esa casilla. Es tu consentimiento, y lo retirás cuando quieras con el enlace de baja de cada mail, sin dar explicaciones."),
    p("No mandamos nada hasta que confirmás tu correo. Si no lo confirmás, borramos el pedido a los 30 días. Si lo confirmás, guardamos el cupón 24 meses desde que lo pediste."),
    p("Los mails los manda Resend (ver la tabla del punto 5). No le damos tu correo a nadie más."),
  ),
  ca: s(
    "cupon",
    "4 bis. El cupó de benvinguda",
    p("Si demanes el cupó de benvinguda a la web, guardem el teu correu, el país, si vas acceptar els recordatoris, i la data, l'hora i l'adreça IP de quan el vas demanar i el vas confirmar. Així podem demostrar que el vas demanar tu."),
    p("**Per enviar-te el cupó** fem servir el teu correu perquè el vas demanar tu. És una mesura prèvia a una compra que tu sol·licites."),
    p("**Per als recordatoris** (fins a 4 en els 14 dies següents) només si vas marcar aquella casella. És el teu consentiment, i el retires quan vulguis amb l'enllaç de baixa de cada correu, sense donar explicacions."),
    p("No enviem res fins que confirmes el teu correu. Si no el confirmes, esborrem la petició als 30 dies. Si el confirmes, guardem el cupó 24 mesos des que el vas demanar."),
    p("Els correus els envia Resend (vegeu la taula del punt 5). No donem el teu correu a ningú més."),
  ),
};

const PUBLICIDAD: Record<IdiomaWeb, [string, string]> = {
  es: ["para publicidad,", "para publicidad (salvo los recordatorios del cupón, si los pides, ver 4 bis),"],
  ar: ["para publicidad,", "para publicidad (salvo los recordatorios del cupón, si los pedís, ver 4 bis),"],
  ca: ["per a publicitat,", "per a publicitat (excepte els recordatoris del cupó, si els demanes, vegeu 4 bis),"],
};

const RESEND: Record<IdiomaWeb, [string, string]> = {
  es: ["Manda los correos: el código para entrar y los avisos.", "Manda los correos: el código para entrar, los avisos y el cupón de bienvenida con sus recordatorios."],
  ar: ["Manda los correos: el código para entrar y los avisos.", "Manda los correos: el código para entrar, los avisos y el cupón de bienvenida con sus recordatorios."],
  ca: ["Envia els correus: el codi per entrar i els avisos.", "Envia els correus: el codi per entrar, els avisos i el cupó de benvinguda amb els seus recordatoris."],
};

/** La privacidad con lo del cupón: la sección 4 bis, la excepción a «publicidad» y Resend en la tabla. */
export function privacidadConCupon(doc: TextoDocumento, idioma: IdiomaWeb): TextoDocumento {
  const [publicidad, conExcepcion] = PUBLICIDAD[idioma];
  const [resend, resendConCupon] = RESEND[idioma];
  const cambiarBloque = (b: Bloque): Bloque => {
    if (b.tipo === "parrafo") return { ...b, texto: b.texto.replace(publicidad, conExcepcion) };
    if (b.tipo === "tabla") return { ...b, filas: b.filas.map((fila) => fila.map((celda) => (celda === resend ? resendConCupon : celda))) };
    return b;
  };
  const secciones: SeccionLegal[] = [];
  for (const seccion of doc.secciones) {
    secciones.push({ ...seccion, bloques: seccion.bloques.map(cambiarBloque) });
    if (seccion.id === "para-que") secciones.push(SECCION_PRIVACIDAD[idioma]);
  }
  return { ...doc, secciones };
}
