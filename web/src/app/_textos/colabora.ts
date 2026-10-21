import type { Textos } from "@/lib/idioma-web";
import type { RedCreador } from "@/lib/creadores";

// Los textos del programa de creadores, «Colabora con Vitácora» (21/10): la
// página /colabora, su formulario, la línea del código en el checkout, los dos
// mails al creador y su panel privado (/creador/<token>).
//
// ⚠️ BORRADORES: todos van a docs/creadores/textos-para-aprobar.md en tandas de
// 10 con su número (// CR-NN). Nada de esto se ve hasta CREADORES=1.
//
// Lo que NO dice, a propósito: ningún porcentaje fijo (la comisión y el
// descuento son de cada creador; solo los mails y el panel, que son de UN
// creador, dicen los suyos), ni cada cuánto se paga.
//
// ca: falta pasarlo por el corrector de Softcatalà.

export type TextosColabora = {
  /** CR-01 */
  meta: { titulo: string; descripcion: string };
  /** CR-02 la etiqueta, el título (dos líneas) y la bajada del inicio */
  etiqueta: string;
  titulo: readonly [string, string];
  bajada: string;
  /** CR-03 el botón del inicio */
  irAlFormulario: string;
  /** CR-04 las cuatro líneas con tilde */
  ventajas: readonly string[];
  /** CR-05 a CR-07 */
  como: { titulo: string; paso: string; pasos: readonly { titulo: string; texto: string }[] };
  /** CR-08 a CR-13 */
  formulario: {
    titulo: string;
    bajada: string;
    nombre: string;
    email: string;
    red: string;
    elegir: string;
    redes: Record<RedCreador, string>;
    perfil: string;
    perfilPista: string;
    seguidores: string;
    seguidoresPista: string;
    mensaje: string;
    mensajePista: string;
    /** La casilla: antes + [condiciones] + medio + [privacidad] + fin. */
    casilla: { antes: string; condiciones: string; medio: string; privacidad: string; fin: string };
    enviar: string;
    enviando: string;
  };
  /** CR-14 */
  errores: { faltan: string; email: string; perfil: string; condiciones: string; envio: (correo: string) => string };
  /** CR-15 */
  gracias: { titulo: string; texto: string };
  /** CR-16 la línea del código en el resumen del checkout y el aviso del casillero */
  checkout: { linea: (codigo: string, porcentaje: number) => string; aplicado: (codigo: string) => string };
  /** CR-17 a CR-20 */
  mail: {
    etiqueta: string;
    porQue: (fecha: string) => string;
    condiciones: string;
    privacidad: string;
    recibido: { asunto: string; vistaPrevia: string; titulo: string; texto: string; siNoFuiste: string };
    bienvenida: {
      asunto: string;
      vistaPrevia: string;
      titulo: string;
      texto: string;
      tuCodigo: string;
      descuento: (porcentaje: number) => string;
      sinDescuento: string;
      comision: (porcentaje: number) => string;
      compartir: string;
      panel: string;
      boton: string;
    };
  };
  /** CR-21 a CR-25 */
  panel: {
    titulo: (nombre: string) => string;
    tuCodigo: string;
    link: string;
    copiar: string;
    copiado: string;
    descuento: (porcentaje: number) => string;
    sinDescuento: string;
    comision: (porcentaje: number) => string;
    pausado: string;
    ventas: string;
    fecha: string;
    importe: string;
    estado: string;
    estados: { pendiente: string; pagada: string };
    sinVentas: string;
    porCobrar: string;
    cobrado: string;
    pago: string;
    condiciones: string;
  };
};

// ─── Castellano de España (tú) ─────────────────────────────────────────────

const ES: TextosColabora = {
  meta: {
    titulo: "Colabora con Vitácora", // CR-01
    descripcion: "Comparte Vitácora con tu comunidad y gana una comisión por cada venta con tu código.", // CR-01
  },
  etiqueta: "Colabora con Vitácora", // CR-02
  titulo: ["Comparte Vitácora", "con tu comunidad."], // CR-02
  bajada: "Si creas contenido y te gusta lo que hacemos, súmate. Te damos un código propio y cada venta con tu código te deja una comisión.", // CR-02
  irAlFormulario: "Quiero colaborar", // CR-03
  ventajas: ["Una comisión por cada venta", "Un descuento para tu comunidad", "Un panel para ver tus ventas", "Lo revisamos personas"], // CR-04
  como: {
    titulo: "Cómo funciona", // CR-05
    paso: "Paso",
    pasos: [
      { titulo: "Te anotas", texto: "Nos cuentas quién eres y dónde publicas. Leemos cada solicitud con calma." }, // CR-05
      { titulo: "Te damos tu código", texto: "Si encaja, te escribimos con tu código, tu link para compartir y tu panel." }, // CR-06
      { titulo: "Lo compartes", texto: "Cada venta con tu código te deja una comisión. Lo ves todo en tu panel." }, // CR-07
    ],
  },
  formulario: {
    titulo: "Cuéntanos de ti", // CR-08
    bajada: "Déjanos tus datos y te escribimos cuando lo revisemos.", // CR-08
    nombre: "Tu nombre", // CR-09
    email: "Tu correo", // CR-09
    red: "Dónde publicas", // CR-09
    elegir: "Elige una opción", // CR-09
    redes: { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", otra: "Otra" }, // CR-09
    perfil: "El link de tu perfil", // CR-10
    perfilPista: "instagram.com/tuperfil", // CR-10
    seguidores: "Cuántas personas te siguen (si quieres)", // CR-10
    seguidoresPista: "Por ejemplo, 5.000", // CR-10
    mensaje: "Algo que quieras contarnos (si quieres)", // CR-11
    mensajePista: "Qué publicas, a quién le hablas…", // CR-11
    casilla: { antes: "He leído y acepto las ", condiciones: "condiciones del programa", medio: " y la ", privacidad: "privacidad", fin: "." }, // CR-12
    enviar: "Enviar", // CR-13
    enviando: "Enviando…", // CR-13
  },
  errores: {
    faltan: "Faltan datos. Revisa los campos obligatorios.", // CR-14
    email: "Escribe un correo válido.", // CR-14
    perfil: "Escribe el link de tu perfil o tu usuario con @.", // CR-14
    condiciones: "Marca la casilla para aceptar las condiciones.", // CR-14
    envio: (correo) => `No pudimos enviarlo. Prueba de nuevo o escríbenos a ${correo}.`, // CR-14
  },
  gracias: { titulo: "¡Gracias! Lo recibimos.", texto: "Leemos cada solicitud con calma. Te escribimos a tu correo cuando la revisemos." }, // CR-15
  checkout: {
    linea: (codigo, porcentaje) => `Código ${codigo} · ${porcentaje} % del libro digital`, // CR-16
    aplicado: (codigo) => `Código ${codigo} aplicado.`, // CR-16
  },
  mail: {
    etiqueta: "COLABORA CON VITÁCORA", // CR-17
    porQue: (fecha) => `Recibes este email porque te anotaste en el programa de creadores de Vitácora el ${fecha}.`, // CR-17
    condiciones: "Condiciones del programa", // CR-17
    privacidad: "Privacidad",
    recibido: {
      asunto: "Recibimos tu solicitud para colaborar con Vitácora", // CR-18
      vistaPrevia: "Te escribimos cuando la revisemos.", // CR-18
      titulo: "Lo recibimos", // CR-18
      texto: "Gracias por querer sumarte. Leemos cada solicitud con calma. Te escribimos a este correo cuando la revisemos.", // CR-18
      siNoFuiste: "Si no te anotaste tú, escríbenos y borramos tus datos.", // CR-18
    },
    bienvenida: {
      asunto: "Ya eres parte de Vitácora. Este es tu código", // CR-19
      vistaPrevia: "Tu código, tu link para compartir y tu panel.", // CR-19
      titulo: "Ya eres parte de Vitácora", // CR-19
      texto: "Revisamos tu solicitud y nos encantaría trabajar contigo.", // CR-19
      tuCodigo: "TU CÓDIGO", // CR-19
      descuento: (porcentaje) => `Con tu código, tu comunidad tiene un ${porcentaje} % de descuento en el libro digital.`, // CR-20
      sinDescuento: "Tu código no lleva descuento. Cada venta con tu código cuenta igual.", // CR-20
      comision: (porcentaje) => `Por cada venta con tu código te queda un ${porcentaje} % de lo que pagó la persona.`, // CR-20
      compartir: "Comparte este link. Quien entra por él ya tiene tu código puesto.", // CR-20
      panel: "En tu panel ves tus ventas y lo que te toca cobrar. Es privado, no lo compartas.", // CR-20
      boton: "Ver mi panel", // CR-20
    },
  },
  panel: {
    titulo: (nombre) => `Hola, ${nombre}`, // CR-21
    tuCodigo: "Tu código", // CR-21
    link: "Tu link para compartir", // CR-21
    copiar: "Copiar", // CR-21
    copiado: "Copiado", // CR-21
    descuento: (porcentaje) => `Tu comunidad tiene un ${porcentaje} % de descuento en el libro digital.`, // CR-22
    sinDescuento: "Tu código no lleva descuento. Cada venta cuenta igual.", // CR-22
    comision: (porcentaje) => `Te queda un ${porcentaje} % de cada venta.`, // CR-22
    pausado: "Tu código está en pausa. Por ahora no suma ventas nuevas. Si tienes dudas, escríbenos.", // CR-23
    ventas: "Tus ventas", // CR-24
    fecha: "Fecha", // CR-24
    importe: "Comisión", // CR-24
    estado: "Estado", // CR-24
    estados: { pendiente: "Por cobrar", pagada: "Cobrada" }, // CR-24
    sinVentas: "Todavía no hay ventas con tu código. Cuando alguien compre, aparece aquí.", // CR-24
    porCobrar: "Por cobrar", // CR-25
    cobrado: "Cobrado", // CR-25
    pago: "Te pagamos por transferencia. Cuando toque, te escribimos para pedirte los datos.", // CR-25
    condiciones: "Condiciones del programa", // CR-25
  },
};

// ─── Castellano de Argentina (vos) ─────────────────────────────────────────

const AR: TextosColabora = {
  ...ES,
  meta: { titulo: ES.meta.titulo, descripcion: "Compartí Vitácora con tu comunidad y ganá una comisión por cada venta con tu código." },
  titulo: ["Compartí Vitácora", "con tu comunidad."],
  bajada: "Si creás contenido y te gusta lo que hacemos, sumate. Te damos un código propio y cada venta con tu código te deja una comisión.",
  como: {
    ...ES.como,
    pasos: [
      { titulo: "Te anotás", texto: "Nos contás quién sos y dónde publicás. Leemos cada solicitud con calma." },
      ES.como.pasos[1],
      { titulo: "Lo compartís", texto: "Cada venta con tu código te deja una comisión. Lo ves todo en tu panel." },
    ],
  },
  formulario: {
    ...ES.formulario,
    titulo: "Contanos de vos",
    bajada: "Dejanos tus datos y te escribimos cuando lo revisemos.",
    red: "Dónde publicás",
    elegir: "Elegí una opción",
    seguidores: "Cuántas personas te siguen (si querés)",
    mensaje: "Algo que quieras contarnos (si querés)",
    casilla: { ...ES.formulario.casilla, antes: "Leí y acepto las " },
  },
  errores: {
    faltan: "Faltan datos. Revisá los campos obligatorios.",
    email: "Escribí un correo válido.",
    perfil: "Escribí el link de tu perfil o tu usuario con @.",
    condiciones: "Marcá la casilla para aceptar las condiciones.",
    envio: (correo) => `No pudimos enviarlo. Probá de nuevo o escribinos a ${correo}.`,
  },
  mail: {
    ...ES.mail,
    porQue: (fecha) => `Recibís este email porque te anotaste en el programa de creadores de Vitácora el ${fecha}.`,
    recibido: { ...ES.mail.recibido, siNoFuiste: "Si no te anotaste vos, escribinos y borramos tus datos." },
    bienvenida: {
      ...ES.mail.bienvenida,
      asunto: "Ya sos parte de Vitácora. Este es tu código",
      titulo: "Ya sos parte de Vitácora",
      compartir: "Compartí este link. Quien entra por él ya tiene tu código puesto.",
      panel: "En tu panel ves tus ventas y lo que te toca cobrar. Es privado, no lo compartas.",
    },
  },
  panel: {
    ...ES.panel,
    pausado: "Tu código está en pausa. Por ahora no suma ventas nuevas. Si tenés dudas, escribinos.",
  },
};

// ─── Catalán ───────────────────────────────────────────────────────────────

const CA: TextosColabora = {
  meta: {
    titulo: "Col·labora amb Vitácora",
    descripcion: "Comparteix Vitácora amb la teva comunitat i guanya una comissió per cada venda amb el teu codi.",
  },
  etiqueta: "Col·labora amb Vitácora",
  titulo: ["Comparteix Vitácora", "amb la teva comunitat."],
  bajada: "Si crees contingut i t'agrada el que fem, suma-t'hi. Et donem un codi propi i cada venda amb el teu codi et deixa una comissió.",
  irAlFormulario: "Vull col·laborar",
  ventajas: ["Una comissió per cada venda", "Un descompte per a la teva comunitat", "Un panell per veure les teves vendes", "Ho revisem persones"],
  como: {
    titulo: "Com funciona",
    paso: "Pas",
    pasos: [
      { titulo: "T'apuntes", texto: "Ens expliques qui ets i on publiques. Llegim cada sol·licitud amb calma." },
      { titulo: "Et donem el teu codi", texto: "Si encaixa, t'escrivim amb el teu codi, el teu enllaç per compartir i el teu panell." },
      { titulo: "El comparteixes", texto: "Cada venda amb el teu codi et deixa una comissió. Ho veus tot al teu panell." },
    ],
  },
  formulario: {
    titulo: "Explica'ns qui ets",
    bajada: "Deixa'ns les teves dades i t'escrivim quan ho revisem.",
    nombre: "El teu nom",
    email: "El teu correu",
    red: "On publiques",
    elegir: "Tria una opció",
    redes: { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", otra: "Una altra" },
    perfil: "L'enllaç del teu perfil",
    perfilPista: "instagram.com/elteuperfil",
    seguidores: "Quantes persones et segueixen (si vols)",
    seguidoresPista: "Per exemple, 5.000",
    mensaje: "Alguna cosa que ens vulguis explicar (si vols)",
    mensajePista: "Què publiques, a qui parles…",
    casilla: { antes: "He llegit i accepto les ", condiciones: "condicions del programa", medio: " i la ", privacidad: "privacitat", fin: "." },
    enviar: "Enviar",
    enviando: "Enviant…",
  },
  errores: {
    faltan: "Falten dades. Revisa els camps obligatoris.",
    email: "Escriu un correu vàlid.",
    perfil: "Escriu l'enllaç del teu perfil o el teu usuari amb @.",
    condiciones: "Marca la casella per acceptar les condicions.",
    envio: (correo) => `No l'hem pogut enviar. Torna-ho a provar o escriu-nos a ${correo}.`,
  },
  gracias: { titulo: "Gràcies! Ho hem rebut.", texto: "Llegim cada sol·licitud amb calma. T'escriurem al teu correu quan la revisem." },
  checkout: {
    linea: (codigo, porcentaje) => `Codi ${codigo} · ${porcentaje} % del llibre digital`,
    aplicado: (codigo) => `Codi ${codigo} aplicat.`,
  },
  mail: {
    etiqueta: "COL·LABORA AMB VITÁCORA",
    porQue: (fecha) => `Reps aquest correu perquè et vas apuntar al programa de creadors de Vitácora el ${fecha}.`,
    condiciones: "Condicions del programa",
    privacidad: "Privacitat",
    recibido: {
      asunto: "Hem rebut la teva sol·licitud per col·laborar amb Vitácora",
      vistaPrevia: "T'escriurem quan la revisem.",
      titulo: "Ho hem rebut",
      texto: "Gràcies per voler sumar-t'hi. Llegim cada sol·licitud amb calma. T'escriurem a aquest correu quan la revisem.",
      siNoFuiste: "Si no t'hi has apuntat tu, escriu-nos i esborrem les teves dades.",
    },
    bienvenida: {
      asunto: "Ja formes part de Vitácora. Aquest és el teu codi",
      vistaPrevia: "El teu codi, el teu enllaç per compartir i el teu panell.",
      titulo: "Ja formes part de Vitácora",
      texto: "Hem revisat la teva sol·licitud i ens encantaria treballar amb tu.",
      tuCodigo: "EL TEU CODI",
      descuento: (porcentaje) => `Amb el teu codi, la teva comunitat té un ${porcentaje} % de descompte en el llibre digital.`,
      sinDescuento: "El teu codi no porta descompte. Cada venda amb el teu codi compta igual.",
      comision: (porcentaje) => `Per cada venda amb el teu codi et queda un ${porcentaje} % del que va pagar la persona.`,
      compartir: "Comparteix aquest enllaç. Qui hi entra ja té el teu codi posat.",
      panel: "Al teu panell veus les teves vendes i el que et toca cobrar. És privat, no el comparteixis.",
      boton: "Veure el meu panell",
    },
  },
  panel: {
    titulo: (nombre) => `Hola, ${nombre}`,
    tuCodigo: "El teu codi",
    link: "El teu enllaç per compartir",
    copiar: "Copiar",
    copiado: "Copiat",
    descuento: (porcentaje) => `La teva comunitat té un ${porcentaje} % de descompte en el llibre digital.`,
    sinDescuento: "El teu codi no porta descompte. Cada venda compta igual.",
    comision: (porcentaje) => `Et queda un ${porcentaje} % de cada venda.`,
    pausado: "El teu codi està en pausa. De moment no suma vendes noves. Si tens dubtes, escriu-nos.",
    ventas: "Les teves vendes",
    fecha: "Data",
    importe: "Comissió",
    estado: "Estat",
    estados: { pendiente: "Per cobrar", pagada: "Cobrada" },
    sinVentas: "Encara no hi ha vendes amb el teu codi. Quan algú compri, apareixerà aquí.",
    porCobrar: "Per cobrar",
    cobrado: "Cobrat",
    pago: "Et paguem per transferència. Quan toqui, t'escriurem per demanar-te les dades.",
    condiciones: "Condicions del programa",
  },
};

export const TEXTOS_COLABORA: Textos<TextosColabora> = { es: ES, ca: CA, ar: AR };

/** La casilla de las condiciones como texto corrido: lo que se guarda como prueba del consentimiento. */
export function textoCasilla(t: TextosColabora): string {
  const c = t.formulario.casilla;
  return `${c.antes}${c.condiciones}${c.medio}${c.privacidad}${c.fin}`;
}

/** La línea del código de un creador en las pasarelas (Stripe y Mercado Pago la muestran). CR-16 */
export const lineaCreadorPasarela = (codigo: string, porcentaje: number) => ES.checkout.linea(codigo, porcentaje);
