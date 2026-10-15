import { CHECKOUT_KIDS } from "./checkout-kids";
import type { FallaCambioKids, FallaCorreccion } from "@/lib/kids-panel";

// El panel de Vitácora Kids para los padres (/tablero/<id> de un chico, K5, 15/10).
// Solo es-AR, de vos: Kids no se vende en España todavía (KIDS_REGIONES).
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
// Reglas: en vos, frases simples, sin dos puntos, sin «tu hijo» ni «él» fijos
// (se nombra con cómo le dicen), sin «amor», sin prometer tiempos.

// ── Aprobados (literales) ────────────────────────────────────────────────

/** mensajes.md §6. {{nombre}} = cómo le dicen. */
export const PANEL_GUIA = {
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
  ],
  p5: "Las podés escribir o cambiar hasta que empiece la cuarta parte. Después ya no se agregan.",
} as const;

export const PANEL_CASILLA = "Que le llegue como una pregunta más, sin decir que es mía";

/** README de Kids: el panel pregunta esto con quién se lo regala de entrada. */
export const QUIEN_LA_MANDA = "¿Quién se la manda?";

/** AVISO-PADRE (mensajes.md §2), su última línea. */
export const LEE_TODO = "Leé todo, pero no le digas nada hasta el libro.";

/** COMPRA-2-HORA y COMPRA-3-TEMAS, como en la compra. */
const COMPRA = CHECKOUT_KIDS.ar;
export const HORA = { etiqueta: COMPRA.hora, ayuda: COMPRA.horaAyuda } as const;
export const TEMAS = { leyenda: COMPRA.temasLeyenda, nombres: COMPRA.temas, debajo: COMPRA.temasDebajo } as const;

// ── Nuevos, para que los apruebe Naza ────────────────────────────────────

export const PANEL_KIDS = {
  // TEXTO PARA NAZA · KP-ETIQUETA
  etiqueta: "Vitácora Kids",
  // APROBADO por Naza 15/10 (tanda 2) · KP-TITULO
  titulo: (apodo: string) => `El libro de ${apodo}`,

  estado: {
    // TEXTO PARA NAZA · KP-ESTADO-PAGO
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
    // TEXTO PARA NAZA · KP-CORTO-PAGO
    pago: "confirmando el pago",
    // TEXTO PARA NAZA · KP-CORTO-ANTES
    antes: "todavía no empezó",
    // TEXTO PARA NAZA · KP-CORTO-CONTANDO
    contando: "contando",
    // TEXTO PARA NAZA · KP-CORTO-TERMINO
    termino: "terminó de contar",
  },

  // TEXTO PARA NAZA · KP-LO-QUE-CUENTA
  loQueCuenta: "Lo que cuenta",
  // APROBADO por Naza 15/10 (tanda 2) · KP-VACIO
  vacio: (apodo: string) => `Cuando ${apodo} conteste la primera pregunta, lo que cuente aparece acá.`,
  // TEXTO PARA NAZA · KP-PARTE
  parte: (n: number) => `Parte ${n}`,
  // TEXTO PARA NAZA · KP-ANTES
  antes: "Antes de la primera pregunta",
  // TEXTO PARA NAZA · KP-SOBRE
  sobre: "Del sobre cerrado",
  // APROBADO por Naza 15/10 (tanda 2) · KP-SOBRE-TEXTO (sale de ENTRADA-5)
  sobreTexto: (apodo: string) => `Estas van en un sobre cerrado, pegado al libro, para que ${apodo} lo abra cuando sea grande.`,
  // TEXTO PARA NAZA · KP-TU-PREGUNTA (una pregunta tuya que ya no está en la ficha)
  tuPregunta: (n: number) => `Tu pregunta ${n}`,
  // TEXTO PARA NAZA · KP-TOCO
  toco: (boton: string) => `Tocó «${boton}»`,
  // TEXTO PARA NAZA · KP-TRANSCRIBIENDO
  transcribiendo: "Estamos pasando el audio a texto.",
  // TEXTO PARA NAZA · KP-FOTO-ALT
  fotoAlt: (apodo: string) => `Una foto que mandó ${apodo}`,
  // TEXTO PARA NAZA · KP-ESCUCHAR (lo lee el lector de pantalla en el botón de play)
  escuchar: "su respuesta",

  correccion: {
    // TEXTO PARA NAZA · KP-CORR-BOTON
    boton: "Corregir un nombre",
    // APROBADO por Naza 15/10 (tanda 2) · KP-CORR-AYUDA
    ayuda: "Si un nombre quedó mal escrito, poné cómo dice y cómo es. Lo que contó no se toca, y en el libro sale bien.",
    // TEXTO PARA NAZA · KP-CORR-DICE
    dice: "Cómo dice",
    // TEXTO PARA NAZA · KP-CORR-ES
    es: "Cómo es",
    // TEXTO PARA NAZA · KP-CORR-GUARDAR
    guardar: "Guardar",
    // TEXTO PARA NAZA · KP-CORR-CANCELAR
    cancelar: "Cancelar",
    // TEXTO PARA NAZA · KP-CORR-LINEA
    linea: (dice: string, es: string) => `«${dice}» va como «${es}»`,
    // TEXTO PARA NAZA · KP-CORR-QUITAR
    quitar: "Quitar",
  },

  preguntas: {
    // TEXTO PARA NAZA · KP-PREG-N
    n: (n: number) => `Pregunta ${n}`,
    // TEXTO PARA NAZA · KP-PREG-PISTA (sale de PANEL-GUIA-3)
    pista: "Contame la vez que…",
    // TEXTO PARA NAZA · KP-PREG-EJEMPLOS
    ejemplos: "Por ejemplo",
    // TEXTO PARA NAZA · KP-PREG-GUARDAR
    guardar: "Guardar mis preguntas",
    // APROBADO por Naza 15/10 (tanda 2) · KP-PREG-CERRADAS
    cerradas: "Ya empezó la cuarta parte, así que tus preguntas no se cambian más.",
    // TEXTO PARA NAZA · KP-PREG-NINGUNA
    ninguna: "No escribiste preguntas.",
    // TEXTO PARA NAZA · KP-PREG-CON-LINEA (debajo de una pregunta ya cerrada; adentro va PADRE-PREG-LINEA, aprobada)
    conLinea: (quien: string) => `Antes le llega «Esta pregunta te la ${/^tus\s/i.test(quien) ? "mandan" : "manda"} ${quien}, con sus palabras.»`,
    // TEXTO PARA NAZA · KP-PREG-SIN-LINEA
    sinLinea: "Le llega como una pregunta más.",
  },

  ajustes: {
    // TEXTO PARA NAZA · KP-AJUSTES-TITULO
    titulo: "La hora y los temas",
    // APROBADO por Naza 15/10 (tanda 2) · KP-TEMAS-AYUDA
    temasAyuda: "Lo que marques no se pregunta. Si ya se preguntó, queda como lo contó.",
    // TEXTO PARA NAZA · KP-AJUSTES-GUARDAR
    guardar: "Guardar",
  },

  // TEXTO PARA NAZA · KP-GUARDANDO
  guardando: "Guardando…",
  // TEXTO PARA NAZA · KP-GUARDADO
  guardado: "Guardado.",
  // APROBADO por Naza 15/10 (tanda 2) · KP-PENDIENTE
  pendiente: "Guardado. Se aplica antes de la próxima pregunta.",

  /** `kids_v2.cambios_error`: el motor no tomó el último cambio. */
  errorDelMotor: {
    // APROBADO por Naza 15/10 (tanda 2) · KP-ERROR-CERRADAS
    "preguntas-cerradas": "Tus preguntas no llegaron a tiempo. Ya había empezado la cuarta parte, así que no se las vamos a hacer.",
    // TEXTO PARA NAZA · KP-ERROR-OTRO
    otro: "No pudimos aplicar tu último cambio. Probá de nuevo, y si vuelve a pasar, escribinos.",
  },

  /** Lo que contesta /api/kids/panel y /api/kids/correcciones. */
  errores: {
    // TEXTO PARA NAZA · KP-ERR-GENERICO
    generico: "No pudimos guardar. Probá de nuevo.",
    // TEXTO PARA NAZA · KP-ERR-OCUPADO
    ocupado: "Justo se estaba guardando otro cambio. Probá de nuevo.",
    // TEXTO PARA NAZA · KP-ERR-NO-KIDS
    noKids: "Esta historia no es de Vitácora Kids.",
    // TEXTO PARA NAZA · KP-ERR-HORA
    hora: "Elegí una hora de la lista.",
    // TEXTO PARA NAZA · KP-ERR-TEMAS
    temas: "Elegí los temas de la lista.",
    // TEXTO PARA NAZA · KP-ERR-PREGUNTAS
    preguntas: "Revisá tus preguntas. Son hasta tres, y cada una con su texto.",
    // TEXTO PARA NAZA · KP-ERR-TERMINADO
    terminado: "Ya terminó de contar, así que esto no se cambia más.",
    // TEXTO PARA NAZA · KP-ERR-CORR-VACIO
    vacio: "Completá cómo dice y cómo es.",
    // TEXTO PARA NAZA · KP-ERR-CORR-NO-ESTA
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
    // TEXTO PARA NAZA · KP-LIBRO-APROBANDO
    aprobando: "Aprobando…",
    // APROBADO por Naza 16/10 (tanda 4) · KP-LIBRO-APROBADO
    // «Ahora lo mandamos a imprimir.» va solo si el pedido trae impreso (kidsConImpreso).
    aprobado: (impreso: boolean) => (impreso ? "Aprobaste el libro. Ahora lo mandamos a imprimir." : "Aprobaste el libro."),
    errores: {
      // TEXTO PARA NAZA · KP-LIBRO-ERR-NO-LISTO
      noListo: "El libro todavía no está listo para aprobar.",
      // TEXTO PARA NAZA · KP-LIBRO-ERR-YA-APROBADO
      yaAprobado: "Este libro ya está aprobado.",
      // TEXTO PARA NAZA · KP-LIBRO-ERR-CONFIRMAR
      confirmar: "Falta confirmar que lo querés aprobar.",
      // TEXTO PARA NAZA · KP-LIBRO-ERR-ARCHIVO
      archivo: "No encontramos ese archivo.",
    },
  },

  inicio: {
    // TEXTO PARA NAZA · KP-INICIO-PREGUNTAS
    preguntas: "Escribí tus preguntas para el libro",
    // TEXTO PARA NAZA · KP-INICIO-VER
    ver: "Mirá todo lo que cuenta",
  },
} as const;

/** El texto de error para cada falla de las rutas del panel. */
export function errorCambioKids(falla: FallaCambioKids | FallaCorreccion | "noKids" | "ocupado" | "base" | "respuesta"): string {
  const e = PANEL_KIDS.errores;
  switch (falla) {
    case "hora":
      return e.hora;
    case "temas":
      return e.temas;
    case "preguntas":
      return e.preguntas;
    case "preguntas-cerradas":
      return PANEL_KIDS.preguntas.cerradas;
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
export function errorLibroKids(falla: "noKids" | "noListo" | "yaAprobado" | "confirmar" | "archivo" | "base"): string {
  const e = PANEL_KIDS.libro.errores;
  switch (falla) {
    case "noKids":
      return PANEL_KIDS.errores.noKids;
    case "noListo":
      return e.noListo;
    case "yaAprobado":
      return e.yaAprobado;
    case "confirmar":
      return e.confirmar;
    case "archivo":
      return e.archivo;
    default:
      return PANEL_KIDS.errores.generico;
  }
}

/** Lo que dice `cambios_error`, en palabras. */
export function errorDelMotor(motivo: string): string {
  return motivo === "preguntas-cerradas" ? PANEL_KIDS.errorDelMotor["preguntas-cerradas"] : PANEL_KIDS.errorDelMotor.otro;
}

/** La línea de cómo va, según el estado del narrador y el avance del motor. */
export function estadoKids(o: { estado: string; canal: "A" | "B"; apodo: string; arranco: boolean; capitulo: number; titulo: string | null; termino: boolean }): string {
  const e = PANEL_KIDS.estado;
  if (o.termino || o.estado === "completado") return e.termino(o.apodo);
  if (o.estado === "pendiente_pago") return e.pago;
  if (!o.arranco) return o.canal === "A" ? e.antesA(o.apodo) : e.antesB;
  if (o.capitulo < 1 || !o.titulo) return o.canal === "A" ? e.esperaA(o.apodo) : e.esperaB;
  return e.parte(o.capitulo, o.titulo);
}

/** Lo corto, para la lista de la cabecera (sin leer kids_v2: alcanza el estado del narrador). */
export function estadoCortoKids(estado: string): string {
  const c = PANEL_KIDS.estadoCorto;
  if (estado === "completado") return c.termino;
  if (estado === "pendiente_pago") return c.pago;
  if (estado === "activo") return c.contando;
  return c.antes;
}
