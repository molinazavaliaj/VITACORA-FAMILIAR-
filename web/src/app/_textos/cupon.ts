import type { Textos } from "@/lib/idioma-web";
import type { MotivoRechazo } from "@/lib/cupon";

// Los textos del cupón de bienvenida (rasca y gana, 20/10): el popup, el campo
// del checkout, las páginas de confirmar y de baja, y los mails.
//
// Marcas (regla de la casa: los textos que ve una persona los aprueba Naza):
//   // APROBADO por Naza 19/10 · tanda N, texto M   (fase-5/textos-legales-nuevos.md)
//   // APROBADO por Naza 20/10 · CU-NN   (docs/rediseno-2026-10/fase-5/textos-cupon-para-aprobar.md;
//      «DE respuesta-19-10.md» = frase del análisis legal, adaptada sin dos puntos)
// Naza aprobó el 20/10 las tandas A-D de ese archivo, con el vos y el catalán
// (el catalán, falta pasarlo por Softcatalà).
// Nada de esto se ve hasta que se prenda RASCA_Y_GANA=1.
//
// Popup simple (Naza, 20/10, al probarlo): salieron «Rascar», la ayuda para
// rascar, las condiciones antes de rascar, «No es un sorteo» (queda en las
// bases), el texto del responsable y el de los 14 años. Quedan «Revelar mi
// descuento» y una sola línea de letra chica: «Solo el libro digital, 30 días.
// Lo da Vitácora.» con los enlaces a las bases y la privacidad.

export type TextosPopup = {
  cerrar: string;
  titulo: string;
  revelar: string;
  premio: string;
  correo: string;
  correoPista: string;
  casillaCupon: string;
  casillaRecordatorios: string;
  recibir: string;
  noGracias: string;
  enviando: string;
  bases: string;
  privacidad: string;
  /** La letra chica debajo de los botones: las condiciones y quién lo da (Naza 20/10). */
  letraChica: string;
  faltaCorreo: string;
  faltaCasilla: string;
  fallo: string;
  enviadoTitulo: string;
  enviadoTexto: (correo: string) => string;
};

export type TextosCuponCheckout = {
  pregunta: string;
  pista: string;
  aplicar: string;
  aplicando: string;
  quitar: string;
  /** La línea del resumen (tanda 3, texto 21). */
  linea: string;
  aplicado: (codigo: string) => string;
  motivos: Record<MotivoRechazo, string>;
  fallo: string;
};

export type TextosPaginasCupon = {
  confirmarTitulo: string;
  confirmarTexto: string;
  confirmarBoton: string;
  listoTitulo: string;
  tuCodigo: string;
  vale: (fecha: string) => string;
  tambienPorMail: string;
  usar: string;
  enlaceVencido: string;
  yaNoVale: string;
  bajaTitulo: string;
  bajaTexto: string;
  bajaMal: string;
  volver: string;
};

export type TextosMailCupon = {
  /** Lo que va arriba de cada mail del cupón. */
  etiqueta: string;
  confirmar: { asunto: string; vistaPrevia: string; titulo: string; texto: string; boton: string; siNoFuiste: string; porQue: (fecha: string) => string };
  cupon: {
    asunto: string;
    vistaPrevia: string;
    titulo: string;
    tuCodigo: string;
    vale: (fecha: string) => string;
    como: string;
    boton: string;
    personal: string;
    conRecordatorios: string;
    porQue: (fecha: string) => string;
  };
  recordatorio: {
    etiqueta: string;
    asuntos: [string, string, string, string];
    texto: (codigo: string, fecha: string) => string;
    cuenta: (n: number) => string;
    boton: string;
    porQue: (fecha: string) => string;
  };
  /** El remitente con su documento y domicilio (art. 10 y 20 LSSI). */
  remitente: (quien: string) => string;
  bases: string;
  privacidad: string;
  baja: string;
};

export type TextosCupon = { popup: TextosPopup; checkout: TextosCuponCheckout; paginas: TextosPaginasCupon; mail: TextosMailCupon };

// ─── Castellano de España (tú) ─────────────────────────────────────────────

const ES: TextosCupon = {
  popup: {
    cerrar: "Cerrar", // APROBADO por Naza 20/10 · CU-01
    titulo: "Rasca y descubre tu descuento.", // APROBADO por Naza 19/10 · tanda 1, texto 9
    revelar: "Revelar mi descuento", // APROBADO por Naza 20/10 (popup simple)
    premio: "Tienes un 10 % de descuento en tu Vitácora.", // APROBADO por Naza 19/10 · tanda 1, texto 9
    correo: "Tu correo", // APROBADO por Naza 20/10 · CU-04
    correoPista: "nombre@correo.com", // APROBADO por Naza 20/10 · CU-04
    casillaCupon: "Quiero recibir el cupón en este mail.", // APROBADO por Naza 19/10 · tanda 1, texto 10
    // APROBADO por Naza 19/10 · tanda 1, texto 10
    casillaRecordatorios: "Acepto que Vitácora me escriba hasta 4 veces para recordarme el descuento. Me doy de baja con un clic.",
    recibir: "Recibir mi cupón", // APROBADO por Naza 19/10 · tanda 1, texto 9
    noGracias: "No, gracias", // APROBADO (pedido de Naza 20/10)
    enviando: "Enviando…", // APROBADO por Naza 20/10 · CU-04
    bases: "Bases del cupón", // APROBADO por Naza 19/10 · tanda 1, texto 10
    privacidad: "Privacidad", // el nombre del enlace del pie (ya aprobado)
    letraChica: "Solo el libro digital, 30 días. Lo da Vitácora.", // APROBADO por Naza 20/10 (popup simple)
    faltaCorreo: "Escribe un correo válido.", // APROBADO por Naza 20/10 · CU-07
    faltaCasilla: "Marca la primera casilla para recibir el cupón.", // APROBADO por Naza 20/10 · CU-07
    fallo: "No pudimos mandarlo. Intenta de nuevo en un rato.", // APROBADO por Naza 20/10 · CU-07
    enviadoTitulo: "Revisa tu correo.", // APROBADO por Naza 20/10 · CU-08
    enviadoTexto: (correo) => `Te mandamos un mail a ${correo}. Toca el botón del mail y te llega tu cupón.`, // APROBADO por Naza 20/10 · CU-08
  },
  checkout: {
    pregunta: "¿Tienes un cupón?", // APROBADO por Naza 20/10 · CU-09
    pista: "VITACORA10-…", // APROBADO por Naza 20/10 · CU-09
    aplicar: "Aplicar", // APROBADO por Naza 20/10 · CU-09
    aplicando: "Revisando…", // APROBADO por Naza 20/10 · CU-09
    quitar: "Quitar", // APROBADO por Naza 20/10 · CU-09
    linea: "Cupón de bienvenida · 10 % del libro digital", // APROBADO por Naza 19/10 · tanda 3, texto 21
    aplicado: (codigo) => `Cupón ${codigo} aplicado.`, // APROBADO por Naza 20/10 · CU-09
    motivos: {
      // APROBADO por Naza 20/10 · CU-10
      no_existe: "Ese código no existe. Revisa que esté bien escrito.",
      sin_confirmar: "Ese cupón todavía no está activo. Toca el botón del mail que te mandamos.",
      vencido: "Ese cupón ya venció.",
      usado: "Ese cupón ya se usó.",
      otra_region: "Ese cupón es de la web de otro país. Solo vale allí.",
      no_aplica: "El cupón es para el libro digital. Esta compra no lo lleva.",
      con_promo: "El cupón no se suma a precios ya rebajados.",
    },
    fallo: "No pudimos revisar el cupón. Intenta de nuevo en un momento.", // APROBADO por Naza 20/10 · CU-10
  },
  paginas: {
    // APROBADO por Naza 20/10 · CU-11
    confirmarTitulo: "Confirma tu correo",
    confirmarTexto: "Toca el botón y te mandamos tu cupón.",
    confirmarBoton: "Ver mi cupón",
    // APROBADO por Naza 20/10 · CU-12
    listoTitulo: "Tu cupón ya es tuyo",
    tuCodigo: "Tu código",
    vale: (fecha) => `Vale hasta el ${fecha}, ese día incluido.`,
    tambienPorMail: "Te lo mandamos también por mail.",
    usar: "Usar mi cupón",
    // APROBADO por Naza 20/10 · CU-13
    enlaceVencido: "Este enlace ya no sirve. Pide el cupón otra vez desde la web y te mandamos uno nuevo.",
    yaNoVale: "Este cupón ya no se puede usar.",
    // APROBADO por Naza 20/10 · CU-14
    bajaTitulo: "Listo",
    bajaTexto: "No te vamos a mandar más recordatorios. Tu cupón sigue valiendo hasta su fecha.",
    bajaMal: "Este enlace no sirve. Escríbenos a soporte@vitacorafamiliar.com y te damos de baja a mano.",
    volver: "Volver a Vitácora",
  },
  mail: {
    etiqueta: "CUPÓN DE BIENVENIDA", // APROBADO por Naza 20/10 · CU-15
    confirmar: {
      // APROBADO por Naza 20/10 · CU-15
      asunto: "Confirma tu correo para recibir tu cupón",
      vistaPrevia: "Toca el botón y te llega tu cupón de Vitácora.",
      titulo: "Confirma tu correo",
      texto: "Pediste el cupón de bienvenida de Vitácora. Toca el botón para confirmar que este correo es tuyo y te mandamos tu código.",
      boton: "Confirmar mi correo",
      siNoFuiste: "Si no lo pediste tú, no hagas nada. No te vamos a escribir más.",
      porQue: (fecha) => `Recibes este email porque alguien pidió el cupón con esta dirección el ${fecha}.`,
    },
    cupon: {
      // APROBADO por Naza 20/10 · CU-16
      asunto: "Tu cupón de bienvenida de Vitácora",
      vistaPrevia: "Tu código y la fecha en que vence.",
      titulo: "Tu cupón de bienvenida",
      tuCodigo: "TU CÓDIGO",
      vale: (fecha) => `Vale hasta el ${fecha}, ese día incluido.`,
      como: "Escríbelo al pagar y el descuento aparece en el total antes de confirmar. Es el 10 % del libro digital, también si compras el pack.",
      boton: "Usar mi cupón",
      personal: "El código es personal. Si lo compartes y alguien lo usa antes que tú, queda gastado.",
      conRecordatorios: "Te vamos a escribir hasta 4 veces para recordártelo. Si no quieres, date de baja con un clic.",
      porQue: (fecha) => `Recibes este email porque pediste el cupón el ${fecha}.`,
    },
    recordatorio: {
      // APROBADO por Naza 20/10 · CU-17 (PUBLICIDAD en el asunto y arriba, respuesta-19-10.md §1.5)
      etiqueta: "PUBLICIDAD · CUPÓN DE BIENVENIDA",
      asuntos: [
        "Publicidad · Tu cupón de Vitácora sigue activo",
        "Publicidad · Tu 10 % del libro digital te espera",
        "Publicidad · Quedan pocos días de tu cupón",
        "Publicidad · Último aviso de tu cupón",
      ],
      texto: (codigo, fecha) => `Tu código ${codigo} te da el 10 % del libro digital. Vale hasta el ${fecha}, ese día incluido.`,
      cuenta: (n) => `Es el recordatorio ${n} de 4.`,
      boton: "Usar mi cupón",
      porQue: (fecha) => `Recibes este email porque pediste el cupón el ${fecha} y aceptaste los recordatorios.`,
    },
    remitente: (quien) => `Te escribe Vitácora Familiar, de ${quien}.`, // APROBADO por Naza 20/10 · CU-18 (respuesta-19-10.md §1.5 )
    bases: "Bases del cupón", // APROBADO por Naza 19/10 · tanda 1, texto 10
    privacidad: "Privacidad",
    baja: "No quiero más recordatorios", // APROBADO por Naza 20/10 · CU-18
  },
};

// ─── Castellano de Argentina (vos) ─────────────────────────────────────────
// Lo mismo que ES pasado a vos (CU-19, APROBADO por Naza 20/10).

const AR: TextosCupon = {
  popup: {
    ...ES.popup,
    titulo: "Rascá y descubrí tu descuento.",
    premio: "Tenés un 10 % de descuento en tu Vitácora.",
    faltaCorreo: "Escribí un correo válido.",
    faltaCasilla: "Marcá la primera casilla para recibir el cupón.",
    fallo: "No pudimos mandarlo. Intentá de nuevo en un rato.",
    enviadoTitulo: "Revisá tu correo.",
    enviadoTexto: (correo) => `Te mandamos un mail a ${correo}. Tocá el botón del mail y te llega tu cupón.`,
  },
  checkout: {
    ...ES.checkout,
    pregunta: "¿Tenés un cupón?",
    motivos: {
      ...ES.checkout.motivos,
      no_existe: "Ese código no existe. Revisá que esté bien escrito.",
      sin_confirmar: "Ese cupón todavía no está activo. Tocá el botón del mail que te mandamos.",
    },
    fallo: "No pudimos revisar el cupón. Intentá de nuevo en un momento.",
  },
  paginas: {
    ...ES.paginas,
    confirmarTitulo: "Confirmá tu correo",
    confirmarTexto: "Tocá el botón y te mandamos tu cupón.",
    enlaceVencido: "Este enlace ya no sirve. Pedí el cupón otra vez desde la web y te mandamos uno nuevo.",
    bajaMal: "Este enlace no sirve. Escribinos a soporte@vitacorafamiliar.com y te damos de baja a mano.",
  },
  mail: {
    ...ES.mail,
    confirmar: {
      asunto: "Confirmá tu correo para recibir tu cupón",
      vistaPrevia: "Tocá el botón y te llega tu cupón de Vitácora.",
      titulo: "Confirmá tu correo",
      texto: "Pediste el cupón de bienvenida de Vitácora. Tocá el botón para confirmar que este correo es tuyo y te mandamos tu código.",
      boton: "Confirmar mi correo",
      siNoFuiste: "Si no lo pediste vos, no hagas nada. No te vamos a escribir más.",
      porQue: (fecha) => `Recibís este mail porque alguien pidió el cupón con esta dirección el ${fecha}.`,
    },
    cupon: {
      ...ES.mail.cupon,
      como: "Escribilo al pagar y el descuento aparece en el total antes de confirmar. Es el 10 % del libro digital, también si comprás el pack.",
      personal: "El código es personal. Si lo compartís y alguien lo usa antes que vos, queda gastado.",
      conRecordatorios: "Te vamos a escribir hasta 4 veces para recordártelo. Si no querés, date de baja con un clic.",
      porQue: (fecha) => `Recibís este mail porque pediste el cupón el ${fecha}.`,
    },
    recordatorio: {
      ...ES.mail.recordatorio,
      porQue: (fecha) => `Recibís este mail porque pediste el cupón el ${fecha} y aceptaste los recordatorios.`,
    },
  },
};

// ─── Català ───────────────────────────────────────────────────────────────
// CU-20, APROBADO por Naza 20/10: traducción de lo de arriba (falta pasarla por Softcatalà).

const CA: TextosCupon = {
  popup: {
    cerrar: "Tancar",
    titulo: "Grata i descobreix el teu descompte.",
    revelar: "Revelar el meu descompte",
    premio: "Tens un 10 % de descompte a la teva Vitácora.",
    correo: "El teu correu",
    correoPista: "nom@correu.com",
    casillaCupon: "Vull rebre el cupó en aquest correu.",
    casillaRecordatorios: "Accepto que Vitácora m'escrigui fins a 4 vegades per recordar-me el descompte. Em dono de baixa amb un clic.",
    recibir: "Rebre el meu cupó",
    noGracias: "No, gràcies",
    enviando: "Enviant…",
    bases: "Bases del cupó",
    privacidad: "Privacitat",
    letraChica: "Només el llibre digital, 30 dies. El dona Vitácora.",
    faltaCorreo: "Escriu un correu vàlid.",
    faltaCasilla: "Marca la primera casella per rebre el cupó.",
    fallo: "No l'hem pogut enviar. Torna-ho a provar d'aquí a una estona.",
    enviadoTitulo: "Revisa el teu correu.",
    enviadoTexto: (correo) => `T'hem enviat un correu a ${correo}. Toca el botó del correu i t'arribarà el cupó.`,
  },
  checkout: {
    pregunta: "Tens un cupó?",
    pista: "VITACORA10-…",
    aplicar: "Aplicar",
    aplicando: "Revisant…",
    quitar: "Treure",
    linea: "Cupó de benvinguda · 10 % del llibre digital",
    aplicado: (codigo) => `Cupó ${codigo} aplicat.`,
    motivos: {
      no_existe: "Aquest codi no existeix. Revisa que estigui ben escrit.",
      sin_confirmar: "Aquest cupó encara no està actiu. Toca el botó del correu que t'hem enviat.",
      vencido: "Aquest cupó ja ha vençut.",
      usado: "Aquest cupó ja s'ha fet servir.",
      otra_region: "Aquest cupó és de la web d'un altre país. Només val allà.",
      no_aplica: "El cupó és per al llibre digital. Aquesta compra no el porta.",
      con_promo: "El cupó no es pot sumar a preus ja rebaixats.",
    },
    fallo: "No hem pogut revisar el cupó. Torna-ho a provar d'aquí a un moment.",
  },
  paginas: {
    confirmarTitulo: "Confirma el teu correu",
    confirmarTexto: "Toca el botó i t'enviem el cupó.",
    confirmarBoton: "Veure el meu cupó",
    listoTitulo: "El cupó ja és teu",
    tuCodigo: "El teu codi",
    vale: (fecha) => `Val fins al ${fecha}, aquell dia inclòs.`,
    tambienPorMail: "També te l'hem enviat per correu.",
    usar: "Fer servir el cupó",
    enlaceVencido: "Aquest enllaç ja no serveix. Torna a demanar el cupó des de la web i t'enviarem un enllaç nou.",
    yaNoVale: "Aquest cupó ja no es pot fer servir.",
    bajaTitulo: "Fet",
    bajaTexto: "No t'enviarem més recordatoris. El cupó continua valent fins a la seva data.",
    bajaMal: "Aquest enllaç no serveix. Escriu-nos a soporte@vitacorafamiliar.com i et donem de baixa a mà.",
    volver: "Tornar a Vitácora",
  },
  mail: {
    etiqueta: "CUPÓ DE BENVINGUDA",
    confirmar: {
      asunto: "Confirma el teu correu per rebre el cupó",
      vistaPrevia: "Toca el botó i t'arribarà el cupó de Vitácora.",
      titulo: "Confirma el teu correu",
      texto: "Has demanat el cupó de benvinguda de Vitácora. Toca el botó per confirmar que aquest correu és teu i t'enviarem el codi.",
      boton: "Confirmar el meu correu",
      siNoFuiste: "Si no l'has demanat tu, no cal que facis res. No t'escriurem més.",
      porQue: (fecha) => `Reps aquest correu perquè algú ha demanat el cupó amb aquesta adreça el ${fecha}.`,
    },
    cupon: {
      asunto: "El teu cupó de benvinguda de Vitácora",
      vistaPrevia: "El teu codi i la data en què venç.",
      titulo: "El teu cupó de benvinguda",
      tuCodigo: "EL TEU CODI",
      vale: (fecha) => `Val fins al ${fecha}, aquell dia inclòs.`,
      como: "Escriu-lo en pagar i el descompte apareix al total abans de confirmar. És el 10 % del llibre digital, també si compres el pack.",
      boton: "Fer servir el cupó",
      personal: "El codi és personal. Si el comparteixes i algú el fa servir abans que tu, queda gastat.",
      conRecordatorios: "T'escriurem fins a 4 vegades per recordar-t'ho. Si no vols, dona't de baixa amb un clic.",
      porQue: (fecha) => `Reps aquest correu perquè vas demanar el cupó el ${fecha}.`,
    },
    recordatorio: {
      etiqueta: "PUBLICITAT · CUPÓ DE BENVINGUDA",
      asuntos: [
        "Publicitat · El teu cupó de Vitácora continua actiu",
        "Publicitat · El teu 10 % del llibre digital t'espera",
        "Publicitat · Queden pocs dies del teu cupó",
        "Publicitat · Últim avís del teu cupó",
      ],
      texto: (codigo, fecha) => `El teu codi ${codigo} et dona el 10 % del llibre digital. Val fins al ${fecha}, aquell dia inclòs.`,
      cuenta: (n) => `És el recordatori ${n} de 4.`,
      boton: "Fer servir el cupó",
      porQue: (fecha) => `Reps aquest correu perquè vas demanar el cupó el ${fecha} i vas acceptar els recordatoris.`,
    },
    remitente: (quien) => `T'escriu Vitácora Familiar, de ${quien}.`,
    bases: "Bases del cupó",
    privacidad: "Privacitat",
    baja: "No vull més recordatoris",
  },
};

export const TEXTOS_CUPON: Textos<TextosCupon> = { es: ES, ca: CA, ar: AR };
