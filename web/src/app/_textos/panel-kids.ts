import { CHECKOUT_KIDS } from "./checkout-kids";
import type { IdiomaKids } from "@/lib/kids";
import type { FallaCambioKids, FallaCorreccion } from "@/lib/kids-panel";

// El panel de Vitácora Kids para los padres (/tablero/<id> de un chico, K5, 15/10).
// En vos para Argentina (es-AR) y en tú para España (es-ES, Naza 16/10, tanda 8:
// docs/rediseno-2026-10/kids/textos-es-ES-2026-10-16.md). Cada chico lleva el
// suyo: `ficha.idioma` / `kids_v2.idioma` (sin el campo, es-AR). Lo que el
// chico recibió (sus preguntas, los títulos de las partes) sale del banco de la
// web (kids-banco.json), en vos.
//
// De dónde sale cada texto:
//   - APROBADOS por Naza (rama vitacora-kids, docs/kids/v2/mensajes.md):
//     PANEL-GUIA-* y PANEL-CASILLA (§6), «¿Quién se la manda?» (README y
//     handoff 05/10), la hora y los temas de la compra (§8, COMPRA-2-HORA y
//     COMPRA-3-TEMAS, que ya están en checkout-kids.ts y se usan de ahí), los
//     títulos de los capítulos (banco.md, vienen de kids-banco.json) y
//     «Leé todo, pero no le digas nada hasta el libro.» (AVISO-PADRE). Van
//     literales; los tests los comparan.
//   - Todo lo marcado // TEXTO PARA NAZA es nuevo y espera su aprobación; lo marcado APROBADO ya lo aprobó (tanda 2, 15/10; el libro, tanda 4, 16/10).
//
// Reglas: en vos o en tú según el idioma, frases simples, sin dos puntos, sin «tu hijo» ni «él» fijos
// (se nombra con cómo le dicen), sin «amor», sin prometer tiempos.

// ── Aprobados (literales) ────────────────────────────────────────────────

/** mensajes.md §6. {{nombre}} = cómo le dicen. */
const PANEL_GUIA_AR = {
  titulo: "Tus preguntas para el libro",
  p1: (nombre: string) =>
    `Podés agregar hasta tres preguntas tuyas. Le llegan a ${nombre} cerca del final, entre la cuarta parte y el sobre cerrado. Antes de cada una le decimos que viene de vos, salvo que prefieras que le llegue como una pregunta más.`,
  p2: "Que cada pregunta pida una sola cosa. Si querés saber dos cosas, escribí dos preguntas.",
  p3: "Funciona mejor pedirle una vez concreta que una opinión. \"Contame la vez que…\" saca mucho más que \"¿Qué sentís?\" o \"¿Qué pensás de…?\".",
  p4: (nombre: string) => `Como todas las demás, ${nombre} la puede pasar si no quiere contestarla.`,
  ejemplos: [
    "Contame el día que aprendiste a andar en bici sin rueditas.",
    "Contame el día que se te cayó el primer diente, que fue comiendo un choclo.",
    "Contame la primera noche que dormiste en lo de un amigo y nos llamaste a las dos de la mañana.",
  ] as readonly string[],
  p5: "Las podés escribir o cambiar hasta que empiece la cuarta parte. Después ya no se agregan.",
};

type TextosGuia = typeof PANEL_GUIA_AR;

// APROBADO por Naza 16/10 (tanda 8) · PANEL-GUIA en España (el ejemplo 2 con «manzana»)
const PANEL_GUIA_ES: TextosGuia = {
  // APROBADO por Naza 16/10 (tanda 8)
  titulo: "Tus preguntas para el libro",
  // APROBADO por Naza 16/10 (tanda 8)
  p1: (nombre: string) =>
    `Puedes añadir hasta tres preguntas tuyas. Le llegan a ${nombre} cerca del final, entre la cuarta parte y el sobre cerrado. Antes de cada una le decimos que viene de ti, salvo que prefieras que le llegue como una pregunta más.`,
  // APROBADO por Naza 16/10 (tanda 8)
  p2: "Que cada pregunta pida una sola cosa. Si quieres saber dos cosas, escribe dos preguntas.",
  // APROBADO por Naza 16/10 (tanda 8)
  p3: "Funciona mejor pedirle una vez concreta que una opinión. \"Cuéntame la vez que…\" saca mucho más que \"¿Qué sientes?\" o \"¿Qué piensas de…?\".",
  // APROBADO por Naza 16/10 (tanda 8)
  p4: (nombre: string) => `Como todas las demás, ${nombre} la puede pasar si no quiere contestarla.`,
  // APROBADO por Naza 16/10 (tanda 8)
  ejemplos: [
    "Cuéntame el día que aprendiste a montar en bici sin ruedines.",
    "Cuéntame el día que se te cayó el primer diente, que fue comiendo una manzana.",
    "Cuéntame la primera noche que dormiste en casa de un amigo y nos llamaste a las dos de la mañana.",
  ],
  // APROBADO por Naza 16/10 (tanda 8)
  p5: "Las puedes escribir o cambiar hasta que empiece la cuarta parte. Después ya no se añaden.",
};

/** COMPRA-2-HORA y COMPRA-3-TEMAS, como en la compra de su región. */
function deLaCompra(c: (typeof CHECKOUT_KIDS)["ar"]) {
  return {
    hora: { etiqueta: c.hora, ayuda: c.horaAyuda },
    temas: { leyenda: c.temasLeyenda, nombres: c.temas, debajo: c.temasDebajo },
  };
}

// ── Lo del panel ─────────────────────────────────────────────────────────

const PANEL_KIDS_AR = {
  // APROBADO por Naza 16/10 (tanda 6) · KP-ETIQUETA
  etiqueta: "Vitácora Kids",
  // APROBADO por Naza 15/10 (tanda 2) · KP-TITULO
  titulo: (apodo: string) => `El libro de ${apodo}`,

  estado: {
    // APROBADO por Naza 16/10 (tanda 5) · KP-ESTADO-PAGO
    pago: "Estamos confirmando el pago.",
    // APROBADO por Naza 15/10 (tanda 2) · KP-ESTADO-ANTES-A (la primera parte es la del mail aprobado)
    antesA: (apodo: string) => `Todavía no empezó. Le vamos a escribir a ${apodo} a la hora que elegiste.`,
    // APROBADO por Naza 15/10 (tanda 2) · KP-ESTADO-ANTES-B
    antesB: "Todavía no empezó. El primer mensaje te llega a tu WhatsApp.",
    // APROBADO por Naza 15/10 (tanda 2) · KP-ESTADO-ESPERA-A
    esperaA: (apodo: string) => `Ya le escribimos a ${apodo}. La primera pregunta sale cuando toque «Dale, vamos».`,
    // APROBADO por Naza 15/10 (tanda 2) · KP-ESTADO-ESPERA-B (la segunda frase es la de «Pedido confirmado»)
    esperaB: "Ya te escribimos. La primera pregunta sale cuando toquen el botón, juntos.",
    // APROBADO por Naza 15/10 (tanda 2) · KP-ESTADO-PARTE
    parte: (n: number, titulo: string) => `Va por la parte ${n}, «${titulo}».`,
    // APROBADO por Naza 15/10 (tanda 2) · KP-ESTADO-TERMINO (sale de TERMINO-PADRE)
    termino: (apodo: string) => `${apodo} terminó de contar. Ahora empieza el armado del libro.`,
  },
  /** Lo corto, en la lista de historias de la cabecera. */
  estadoCorto: {
    // APROBADO por Naza 16/10 (tanda 6) · KP-CORTO-PAGO
    pago: "confirmando el pago",
    // APROBADO por Naza 16/10 (tanda 6) · KP-CORTO-ANTES
    antes: "todavía no empezó",
    // APROBADO por Naza 16/10 (tanda 6) · KP-CORTO-CONTANDO
    contando: "contando",
    // APROBADO por Naza 16/10 (tanda 6) · KP-CORTO-TERMINO
    termino: "terminó de contar",
  },

  // APROBADO por Naza 16/10 (tanda 5) · KP-LO-QUE-CUENTA
  loQueCuenta: "Lo que cuenta",
  // APROBADO por Naza 15/10 (tanda 2) · KP-VACIO
  vacio: (apodo: string) => `Cuando ${apodo} conteste la primera pregunta, lo que cuente aparece acá.`,
  // APROBADO por Naza 16/10 (tanda 5) · KP-PARTE
  parte: (n: number) => `Parte ${n}`,
  // APROBADO por Naza 16/10 (tanda 5) · KP-ANTES
  antes: "Antes de la primera pregunta",
  // APROBADO por Naza 16/10 (tanda 5) · KP-SOBRE
  sobre: "Del sobre cerrado",
  // APROBADO por Naza 15/10 (tanda 2) · KP-SOBRE-TEXTO (sale de ENTRADA-5)
  sobreTexto: (apodo: string) => `Estas van en un sobre cerrado, pegado al libro, para que ${apodo} lo abra cuando sea grande.`,
  // APROBADO por Naza 16/10 (tanda 6) · KP-TU-PREGUNTA (una pregunta tuya que ya no está en la ficha)
  tuPregunta: (n: number) => `Tu pregunta ${n}`,
  // APROBADO por Naza 16/10 (tanda 6) · KP-TOCO
  toco: (boton: string) => `Tocó «${boton}»`,
  // APROBADO por Naza 16/10 (tanda 5) · KP-TRANSCRIBIENDO
  transcribiendo: "Estamos pasando el audio a texto.",
  // APROBADO por Naza 16/10 (tanda 6) · KP-FOTO-ALT
  fotoAlt: (apodo: string) => `Una foto que mandó ${apodo}`,
  // APROBADO por Naza 16/10 (tanda 6) · KP-ESCUCHAR (lo lee el lector de pantalla en el botón de play)
  escuchar: "su respuesta",

  correccion: {
    // APROBADO por Naza 16/10 (tanda 5) · KP-CORR-BOTON
    boton: "Corregir un nombre",
    // APROBADO por Naza 15/10 (tanda 2) · KP-CORR-AYUDA
    ayuda: "Si un nombre quedó mal escrito, poné cómo dice y cómo es. Lo que contó no se toca, y en el libro sale bien.",
    // APROBADO por Naza 16/10 (tanda 5) · KP-CORR-DICE
    dice: "Cómo dice",
    // APROBADO por Naza 16/10 (tanda 5) · KP-CORR-ES
    es: "Cómo es",
    // APROBADO por Naza 16/10 (tanda 5) · KP-CORR-GUARDAR
    guardar: "Guardar",
    // APROBADO por Naza 16/10 (tanda 5) · KP-CORR-CANCELAR
    cancelar: "Cancelar",
    // APROBADO por Naza 16/10 (tanda 5) · KP-CORR-LINEA
    linea: (dice: string, es: string) => `«${dice}» va como «${es}»`,
    // APROBADO por Naza 16/10 (tanda 5) · KP-CORR-QUITAR
    quitar: "Quitar",
  },

  preguntas: {
    // APROBADO por Naza 16/10 (tanda 6) · KP-PREG-N
    n: (n: number) => `Pregunta ${n}`,
    // APROBADO por Naza 16/10 (tanda 6) · KP-PREG-PISTA (sale de PANEL-GUIA-3)
    pista: "Contame la vez que…",
    // APROBADO por Naza 16/10 (tanda 6) · KP-PREG-EJEMPLOS
    ejemplos: "Por ejemplo",
    // APROBADO por Naza 16/10 (tanda 5) · KP-PREG-GUARDAR
    guardar: "Guardar mis preguntas",
    // APROBADO por Naza 15/10 (tanda 2) · KP-PREG-CERRADAS
    cerradas: "Ya empezó la cuarta parte, así que tus preguntas no se cambian más.",
    // APROBADO por Naza 16/10 (tanda 5) · KP-PREG-NINGUNA
    ninguna: "No escribiste preguntas.",
    // APROBADO por Naza 16/10 (tanda 5) · KP-PREG-CON-LINEA (debajo de una pregunta ya cerrada; adentro va PADRE-PREG-LINEA, aprobada)
    conLinea: (quien: string) => `Antes le llega «Esta pregunta te la ${/^tus\s/i.test(quien) ? "mandan" : "manda"} ${quien}, con sus palabras.»`,
    // APROBADO por Naza 16/10 (tanda 5) · KP-PREG-SIN-LINEA
    sinLinea: "Le llega como una pregunta más.",
  },

  ajustes: {
    // APROBADO por Naza 16/10 (tanda 6) · KP-AJUSTES-TITULO
    titulo: "La hora y los temas",
    // APROBADO por Naza 15/10 (tanda 2) · KP-TEMAS-AYUDA
    temasAyuda: "Lo que marques no se pregunta. Si ya se preguntó, queda como lo contó.",
    // APROBADO por Naza 16/10 (tanda 6) · KP-AJUSTES-GUARDAR
    guardar: "Guardar",
  },

  // APROBADO por Naza 16/10 (tanda 6) · KP-GUARDANDO
  guardando: "Guardando…",
  // APROBADO por Naza 16/10 (tanda 6) · KP-GUARDADO
  guardado: "Guardado.",
  // APROBADO por Naza 15/10 (tanda 2) · KP-PENDIENTE
  pendiente: "Guardado. Se aplica antes de la próxima pregunta.",

  /** `kids_v2.cambios_error`: el motor no tomó el último cambio. */
  errorDelMotor: {
    // APROBADO por Naza 15/10 (tanda 2) · KP-ERROR-CERRADAS
    "preguntas-cerradas": "Tus preguntas no llegaron a tiempo. Ya había empezado la cuarta parte, así que no se las vamos a hacer.",
    // APROBADO por Naza 16/10 (tanda 5) · KP-ERROR-OTRO
    otro: "No pudimos aplicar tu último cambio. Probá de nuevo, y si vuelve a pasar, escribinos.",
  },

  /** Lo que contesta /api/kids/panel y /api/kids/correcciones. */
  errores: {
    // APROBADO por Naza 16/10 (tanda 5) · KP-ERR-GENERICO
    generico: "No pudimos guardar. Probá de nuevo.",
    // APROBADO por Naza 16/10 (tanda 5) · KP-ERR-OCUPADO
    ocupado: "Justo se estaba guardando otro cambio. Probá de nuevo.",
    // APROBADO por Naza 16/10 (tanda 6) · KP-ERR-NO-KIDS
    noKids: "Esta historia no es de Vitácora Kids.",
    // APROBADO por Naza 16/10 (tanda 6) · KP-ERR-HORA
    hora: "Elegí una hora de la lista.",
    // APROBADO por Naza 16/10 (tanda 6) · KP-ERR-TEMAS
    temas: "Elegí los temas de la lista.",
    // APROBADO por Naza 16/10 (tanda 6) · KP-ERR-PREGUNTAS
    preguntas: "Revisá tus preguntas. Son hasta tres, y cada una con su texto.",
    // APROBADO por Naza 16/10 (tanda 6) · KP-ERR-TERMINADO
    terminado: "Ya terminó de contar, así que esto no se cambia más.",
    // APROBADO por Naza 16/10 (tanda 6) · KP-ERR-CORR-VACIO
    vacio: "Completá cómo dice y cómo es.",
    // APROBADO por Naza 16/10 (tanda 6) · KP-ERR-CORR-NO-ESTA
    noEsta: "Ese nombre no aparece en esta respuesta. Copialo como está escrito.",
  },

  /** El libro ya escrito (decisión 9): se ve solo cuando la fábrica dejó listo.json. */
  libro: {
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-TITULO
    titulo: "El libro ya está escrito",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-TEXTO
    texto: (apodo: string) => `Acá está el libro de ${apodo}, con lo que contó. Leelo antes de aprobarlo. El sobre cerrado va aparte.`,
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-VER
    ver: "Ver el libro",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-BAJAR
    bajar: "Descargar el libro",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-VER-SOBRE
    verSobre: "Ver el sobre",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-BAJAR-SOBRE
    bajarSobre: "Descargar el sobre",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-ALGO-MAL
    algoMal: "Si algo no está bien, escribinos antes de aprobarlo.",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-APROBAR
    aprobar: "Aprobar el libro",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-CONFIRMAR
    confirmar: "Cuando lo aprobás, queda así y ya no se cambia.",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-SI
    si: "Sí, aprobarlo",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-NO
    no: "Todavía no",
    // APROBADO por Naza 16/10 (tanda 6) · KP-LIBRO-APROBANDO
    aprobando: "Aprobando…",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-APROBADO
    // «Ahora lo mandamos a imprimir.» va solo si el pedido trae impreso (kidsConImpreso).
    aprobado: (impreso: boolean): string => (impreso ? "Aprobaste el libro. Ahora lo mandamos a imprimir." : "Aprobaste el libro."),
    errores: {
      // APROBADO por Naza 16/10 (tanda 6) · KP-LIBRO-ERR-NO-LISTO
      noListo: "El libro todavía no está listo para aprobar.",
      // APROBADO por Naza 16/10 (tanda 6) · KP-LIBRO-ERR-YA-APROBADO
      yaAprobado: "Este libro ya está aprobado.",
      // APROBADO por Naza 16/10 (tanda 6) · KP-LIBRO-ERR-CONFIRMAR
      confirmar: "Falta confirmar que lo querés aprobar.",
      // APROBADO por Naza 16/10 (tanda 6) · KP-LIBRO-ERR-ARCHIVO
      archivo: "No encontramos ese archivo.",
    },
  },

  inicio: {
    // APROBADO por Naza 16/10 (tanda 5) · KP-INICIO-PREGUNTAS
    preguntas: "Escribí tus preguntas para el libro",
    // APROBADO por Naza 16/10 (tanda 5) · KP-INICIO-VER
    ver: "Mirá todo lo que cuenta",
  },
};

type TextosPanel = typeof PANEL_KIDS_AR;

// APROBADO por Naza 16/10 (tanda 8) · todo PANEL_KIDS en España, de tú
// (textos-es-ES-2026-10-16.md, con las «A» de la lectura de Marta: «Ver todo
// lo que cuenta», «a la hora que has elegido»; y «Vale, vamos», el botón del
// bot en es-ES).
const PANEL_KIDS_ES: TextosPanel = {
  // APROBADO por Naza 16/10 (tanda 8)
  etiqueta: "Vitácora Kids",
  // APROBADO por Naza 16/10 (tanda 8)
  titulo: (apodo: string) => `El libro de ${apodo}`,

  estado: {
    // APROBADO por Naza 16/10 (tanda 8)
    pago: "Estamos confirmando el pago.",
    // APROBADO por Naza 16/10 (tanda 8)
    antesA: (apodo: string) => `Todavía no ha empezado. Le vamos a escribir a ${apodo} a la hora que has elegido.`,
    // APROBADO por Naza 16/10 (tanda 8)
    antesB: "Todavía no ha empezado. El primer mensaje te llega a tu WhatsApp.",
    // APROBADO por Naza 16/10 (tanda 8)
    esperaA: (apodo: string) => `Ya le hemos escrito a ${apodo}. La primera pregunta sale cuando pulse «Vale, vamos».`,
    // APROBADO por Naza 16/10 (tanda 8)
    esperaB: "Ya te hemos escrito. La primera pregunta sale cuando pulséis el botón, juntos.",
    // APROBADO por Naza 16/10 (tanda 8)
    parte: (n: number, titulo: string) => `Va por la parte ${n}, «${titulo}».`,
    // APROBADO por Naza 16/10 (tanda 8)
    termino: (apodo: string) => `${apodo} ha terminado de contar. Ahora empezamos a preparar el libro.`,
  },
  estadoCorto: {
    // APROBADO por Naza 16/10 (tanda 8)
    pago: "confirmando el pago",
    // APROBADO por Naza 16/10 (tanda 8)
    antes: "todavía no ha empezado",
    // APROBADO por Naza 16/10 (tanda 8)
    contando: "contando",
    // APROBADO por Naza 16/10 (tanda 8)
    termino: "ha terminado de contar",
  },

  // APROBADO por Naza 16/10 (tanda 8)
  loQueCuenta: "Lo que cuenta",
  // APROBADO por Naza 16/10 (tanda 8)
  vacio: (apodo: string) => `Cuando ${apodo} conteste la primera pregunta, lo que cuente aparece aquí.`,
  // APROBADO por Naza 16/10 (tanda 8)
  parte: (n: number) => `Parte ${n}`,
  // APROBADO por Naza 16/10 (tanda 8)
  antes: "Antes de la primera pregunta",
  // APROBADO por Naza 16/10 (tanda 8)
  sobre: "Del sobre cerrado",
  // APROBADO por Naza 16/10 (tanda 8)
  sobreTexto: (apodo: string) => `Estas van en un sobre cerrado, pegado al libro, para que ${apodo} lo abra cuando sea mayor.`,
  // APROBADO por Naza 16/10 (tanda 8)
  tuPregunta: (n: number) => `Tu pregunta ${n}`,
  // APROBADO por Naza 16/10 (tanda 8)
  toco: (boton: string) => `Pulsó «${boton}»`,
  // APROBADO por Naza 16/10 (tanda 8)
  transcribiendo: "Estamos pasando el audio a texto.",
  // APROBADO por Naza 16/10 (tanda 8)
  fotoAlt: (apodo: string) => `Una foto que mandó ${apodo}`,
  // APROBADO por Naza 16/10 (tanda 8)
  escuchar: "su respuesta",

  correccion: {
    // APROBADO por Naza 16/10 (tanda 8)
    boton: "Corregir un nombre",
    // APROBADO por Naza 16/10 (tanda 8)
    ayuda: "Si un nombre ha quedado mal escrito, pon cómo dice y cómo es. Lo que contó no se toca, y en el libro sale bien.",
    // APROBADO por Naza 16/10 (tanda 8)
    dice: "Cómo dice",
    // APROBADO por Naza 16/10 (tanda 8)
    es: "Cómo es",
    // APROBADO por Naza 16/10 (tanda 8)
    guardar: "Guardar",
    // APROBADO por Naza 16/10 (tanda 8)
    cancelar: "Cancelar",
    // APROBADO por Naza 16/10 (tanda 8)
    linea: (dice: string, es: string) => `«${dice}» va como «${es}»`,
    // APROBADO por Naza 16/10 (tanda 8)
    quitar: "Quitar",
  },

  preguntas: {
    // APROBADO por Naza 16/10 (tanda 8)
    n: (n: number) => `Pregunta ${n}`,
    // APROBADO por Naza 16/10 (tanda 8)
    pista: "Cuéntame la vez que…",
    // APROBADO por Naza 16/10 (tanda 8)
    ejemplos: "Por ejemplo",
    // APROBADO por Naza 16/10 (tanda 8)
    guardar: "Guardar mis preguntas",
    // APROBADO por Naza 16/10 (tanda 8)
    cerradas: "Ya ha empezado la cuarta parte, así que tus preguntas ya no se cambian.",
    // APROBADO por Naza 16/10 (tanda 8)
    ninguna: "No has escrito preguntas.",
    // Adentro va PADRE-PREG-LINEA, la del bot en es-ES (banco-es-ES.md), igual que en vos.
    conLinea: (quien: string) => `Antes le llega «Esta pregunta te la ${/^tus\s/i.test(quien) ? "mandan" : "manda"} ${quien}, con sus palabras.»`,
    // APROBADO por Naza 16/10 (tanda 8)
    sinLinea: "Le llega como una pregunta más.",
  },

  ajustes: {
    // APROBADO por Naza 16/10 (tanda 8)
    titulo: "La hora y los temas",
    // APROBADO por Naza 16/10 (tanda 8)
    temasAyuda: "Lo que marques no se pregunta. Si ya se ha preguntado, se queda como lo contó.",
    // APROBADO por Naza 16/10 (tanda 8)
    guardar: "Guardar",
  },

  // APROBADO por Naza 16/10 (tanda 8)
  guardando: "Guardando…",
  // APROBADO por Naza 16/10 (tanda 8)
  guardado: "Guardado.",
  // APROBADO por Naza 16/10 (tanda 8)
  pendiente: "Guardado. Se aplica antes de la próxima pregunta.",

  errorDelMotor: {
    // APROBADO por Naza 16/10 (tanda 8)
    "preguntas-cerradas": "Tus preguntas no han llegado a tiempo. Ya había empezado la cuarta parte, así que no se las vamos a hacer.",
    // APROBADO por Naza 16/10 (tanda 8)
    otro: "No hemos podido aplicar tu último cambio. Prueba de nuevo, y si vuelve a pasar, escríbenos.",
  },

  errores: {
    // APROBADO por Naza 16/10 (tanda 8)
    generico: "No hemos podido guardar. Prueba de nuevo.",
    // APROBADO por Naza 16/10 (tanda 8)
    ocupado: "Justo se estaba guardando otro cambio. Prueba de nuevo.",
    // APROBADO por Naza 16/10 (tanda 8)
    noKids: "Esta historia no es de Vitácora Kids.",
    // APROBADO por Naza 16/10 (tanda 8)
    hora: "Elige una hora de la lista.",
    // APROBADO por Naza 16/10 (tanda 8)
    temas: "Elige los temas de la lista.",
    // APROBADO por Naza 16/10 (tanda 8)
    preguntas: "Revisa tus preguntas. Son hasta tres, y cada una con su texto.",
    // APROBADO por Naza 16/10 (tanda 8)
    terminado: "Ya ha terminado de contar, así que esto ya no se cambia.",
    // APROBADO por Naza 16/10 (tanda 8)
    vacio: "Rellena cómo dice y cómo es.",
    // APROBADO por Naza 16/10 (tanda 8)
    noEsta: "Ese nombre no aparece en esta respuesta. Cópialo como está escrito.",
  },

  libro: {
    // APROBADO por Naza 16/10 (tanda 8)
    titulo: "El libro ya está escrito",
    // APROBADO por Naza 16/10 (tanda 8)
    texto: (apodo: string) => `Aquí está el libro de ${apodo}, con lo que contó. Léelo antes de aprobarlo. El sobre cerrado va aparte.`,
    // APROBADO por Naza 16/10 (tanda 8)
    ver: "Ver el libro",
    // APROBADO por Naza 16/10 (tanda 8)
    bajar: "Descargar el libro",
    // APROBADO por Naza 16/10 (tanda 8)
    verSobre: "Ver el sobre",
    // APROBADO por Naza 16/10 (tanda 8)
    bajarSobre: "Descargar el sobre",
    // APROBADO por Naza 16/10 (tanda 8)
    algoMal: "Si algo no está bien, escríbenos antes de aprobarlo.",
    // APROBADO por Naza 16/10 (tanda 8)
    aprobar: "Aprobar el libro",
    // APROBADO por Naza 16/10 (tanda 8)
    confirmar: "Cuando lo apruebas, se queda así y ya no se cambia.",
    // APROBADO por Naza 16/10 (tanda 8)
    si: "Sí, aprobarlo",
    // APROBADO por Naza 16/10 (tanda 8)
    no: "Todavía no",
    // APROBADO por Naza 16/10 (tanda 8)
    aprobando: "Aprobando…",
    // APROBADO por Naza 16/10 (tanda 8)
    aprobado: (impreso: boolean) => (impreso ? "Has aprobado el libro. Ahora lo mandamos a imprimir." : "Has aprobado el libro."),
    errores: {
      // APROBADO por Naza 16/10 (tanda 8)
      noListo: "El libro todavía no está listo para aprobar.",
      // APROBADO por Naza 16/10 (tanda 8)
      yaAprobado: "Este libro ya está aprobado.",
      // APROBADO por Naza 16/10 (tanda 8)
      confirmar: "Falta confirmar que quieres aprobarlo.",
      // APROBADO por Naza 16/10 (tanda 8)
      archivo: "No hemos encontrado ese archivo.",
    },
  },

  inicio: {
    // APROBADO por Naza 16/10 (tanda 8)
    preguntas: "Escribe tus preguntas para el libro",
    // APROBADO por Naza 16/10 (tanda 8)
    ver: "Ver todo lo que cuenta",
  },
};

/** Todo lo que ve el padre en el panel, en su castellano. */
export type TextosPanelKids = {
  guia: TextosGuia;
  casilla: string;
  quienLaManda: string;
  leeTodo: string;
  hora: { etiqueta: string; ayuda: string };
  temas: { leyenda: string; nombres: (typeof CHECKOUT_KIDS)["ar"]["temas"]; debajo: string };
  panel: TextosPanel;
};

export const TEXTOS_PANEL_KIDS: Record<IdiomaKids, TextosPanelKids> = {
  "es-AR": {
    guia: PANEL_GUIA_AR,
    casilla: "Que le llegue como una pregunta más, sin decir que es mía",
    // README de Kids: el panel pregunta esto con quién se lo regala de entrada.
    quienLaManda: "¿Quién se la manda?",
    // AVISO-PADRE (mensajes.md §2), su última línea.
    leeTodo: "Leé todo, pero no le digas nada hasta el libro.",
    ...deLaCompra(CHECKOUT_KIDS.ar),
    panel: PANEL_KIDS_AR,
  },
  "es-ES": {
    guia: PANEL_GUIA_ES,
    // APROBADO por Naza 16/10 (tanda 8) · PANEL-CASILLA
    casilla: "Que le llegue como una pregunta más, sin decir que es mía",
    // APROBADO por Naza 16/10 (tanda 8) · QUIEN_LA_MANDA
    quienLaManda: "¿Quién se la manda?",
    // APROBADO por Naza 16/10 (tanda 8) · LEE_TODO (AVISO-PADRE)
    leeTodo: "Léelo todo, pero no le digas nada hasta el libro.",
    // APROBADO por Naza 16/10 (tanda 8) · HORA y TEMAS, los de la compra de España
    ...deLaCompra(CHECKOUT_KIDS.es),
    panel: PANEL_KIDS_ES,
  },
};

/** Los textos del panel en el castellano del chico (sin idioma, o uno raro, los de vos). */
export function textosPanelKids(idioma: IdiomaKids = "es-AR"): TextosPanelKids {
  return TEXTOS_PANEL_KIDS[idioma] ?? TEXTOS_PANEL_KIDS["es-AR"];
}

// Los de vos (Argentina), con sus nombres de siempre.
export const PANEL_KIDS = PANEL_KIDS_AR;
export const PANEL_GUIA = PANEL_GUIA_AR;
export const PANEL_CASILLA = TEXTOS_PANEL_KIDS["es-AR"].casilla;
export const QUIEN_LA_MANDA = TEXTOS_PANEL_KIDS["es-AR"].quienLaManda;
export const LEE_TODO = TEXTOS_PANEL_KIDS["es-AR"].leeTodo;
export const HORA = TEXTOS_PANEL_KIDS["es-AR"].hora;
export const TEMAS = TEXTOS_PANEL_KIDS["es-AR"].temas;

/** El texto de error para cada falla de las rutas del panel. */
export function errorCambioKids(falla: FallaCambioKids | FallaCorreccion | "noKids" | "ocupado" | "base" | "respuesta", idioma: IdiomaKids = "es-AR"): string {
  const P = textosPanelKids(idioma).panel;
  const e = P.errores;
  switch (falla) {
    case "hora":
      return e.hora;
    case "temas":
      return e.temas;
    case "preguntas":
      return e.preguntas;
    case "preguntas-cerradas":
      return P.preguntas.cerradas;
    case "terminado":
      return e.terminado;
    case "vacio":
      return e.vacio;
    case "no-esta":
      return e.noEsta;
    case "noKids":
      return e.noKids;
    case "ocupado":
      return e.ocupado;
    default:
      return e.generico;
  }
}

/** El texto de error de /api/kids/libro. */
export function errorLibroKids(falla: "noKids" | "noListo" | "yaAprobado" | "confirmar" | "archivo" | "base", idioma: IdiomaKids = "es-AR"): string {
  const P = textosPanelKids(idioma).panel;
  const e = P.libro.errores;
  switch (falla) {
    case "noKids":
      return P.errores.noKids;
    case "noListo":
      return e.noListo;
    case "yaAprobado":
      return e.yaAprobado;
    case "confirmar":
      return e.confirmar;
    case "archivo":
      return e.archivo;
    default:
      return P.errores.generico;
  }
}

/** Lo que dice `cambios_error`, en palabras. */
export function errorDelMotor(motivo: string, idioma: IdiomaKids = "es-AR"): string {
  const m = textosPanelKids(idioma).panel.errorDelMotor;
  return motivo === "preguntas-cerradas" ? m["preguntas-cerradas"] : m.otro;
}

/** La línea de cómo va, según el estado del narrador y el avance del motor. */
export function estadoKids(o: { estado: string; canal: "A" | "B"; apodo: string; arranco: boolean; capitulo: number; titulo: string | null; termino: boolean; idioma?: IdiomaKids }): string {
  const e = textosPanelKids(o.idioma).panel.estado;
  if (o.termino || o.estado === "completado") return e.termino(o.apodo);
  if (o.estado === "pendiente_pago") return e.pago;
  if (!o.arranco) return o.canal === "A" ? e.antesA(o.apodo) : e.antesB;
  if (o.capitulo < 1 || !o.titulo) return o.canal === "A" ? e.esperaA(o.apodo) : e.esperaB;
  return e.parte(o.capitulo, o.titulo);
}

/** Lo corto, para la lista de la cabecera (sin leer kids_v2: alcanza el estado del narrador). */
export function estadoCortoKids(estado: string, idioma: IdiomaKids = "es-AR"): string {
  const c = textosPanelKids(idioma).panel.estadoCorto;
  if (estado === "completado") return c.termino;
  if (estado === "pendiente_pago") return c.pago;
  if (estado === "activo") return c.contando;
  return c.antes;
}
