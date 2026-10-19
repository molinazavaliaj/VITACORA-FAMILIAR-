import type { TratoComprador } from "@/lib/regalo-textos";
import type { ClavePaso, Titular } from "../tablero/momento";

// Los textos NUEVOS del panel (rediseño 2026-10, fase 2). Los que el panel ya
// tenía (aprobados) siguen donde estaban (ui.tsx, proximo-paso.ts, cada
// pantalla); acá va solo lo que trajo el diseño nuevo, por idioma. Todo lo que
// no es copia literal de un texto aprobado está en
// docs/rediseno-2026-10/fase-2/textos-panel.md para que Naza lo apruebe.
//
// El panel habla según la región de la familia dueña de la historia (como
// hoy, `tratoDeLaFamilia`): `es` = España, de tú; `ar` = Argentina, de vos.
// El catalán del panel queda para después: la base no guarda en qué idioma
// compró cada familia (PENDIENTES, «Apuntado en fase 2»).
//
// `Quien` decide la persona: «su» o «tu» (el libro es de quien compró, «Para
// mí»), y el femenino de la que cuenta (`contexto.genero`).

export type IdiomaPanel = "es" | "ar";
export const idiomaDelTrato = (trato: TratoComprador): IdiomaPanel => (trato === "tu" ? "es" : "ar");

export type Quien = {
  /** Cómo le dicen (nombre de pila o apodo): «El libro de Antonio». */
  como: string;
  propia: boolean;
  ella: boolean;
  viaje: boolean;
};

type TextosPanel = {
  hola: (nombre: string) => string;
  titular: (t: Titular, q: Quien) => string;
  respuestas: (n: number) => string;
  minutosDeVoz: (q: Quien) => string;
  pasos: (q: Quien) => Record<ClavePaso, string>;
  comoVa: string;
  hecho: string;
  ahora: string;

  whatsapp: (q: Quien) => string;
  whatsappFalta: string;
  verTarjeta: string;

  pedido: string;
  lineaBase: string;
  lineaImpreso: (copias: number) => string;
  lineaMarco: (marcos: number) => string;
  cambiarDireccion: string;
  anadirMarco: string;
  /** La tarjeta del marco (arreglos chicos, maqueta Panel): título, texto y la foto. */
  marcoTitulo: (q: Quien) => string;
  marcoTexto: (q: Quien) => string;
  altMarco: string;
  /** La hoja «Cambiar la fecha de inicio» de un regalo sin abrir (arreglos chicos). */
  cambiarFecha: string;
  fechaTexto: string;
  fechaCampo: string;
  guardarFecha: string;
  guardando: string;
  guardado: string;
  errorFecha: string;
  pausarOCerrar: string;
  cancelar: string;
  pausarTitulo: string;
  pausarTexto: (q: Quien) => string;
  cerrarTitulo: string;
  cancelarTexto: string;
  asuntoPausa: string;
  asuntoCancelar: string;
  escribirWhatsApp: string;
  escribirCorreo: string;
  cerrarHoja: string;

  familia: string;
  familiaTexto: (q: Quien) => string;

  fotos: (q: Quien) => string;
  faltaPortada: (q: Quien) => string;
  hayPortada: (q: Quien) => string;
  fotosTexto: (q: Quien) => string;
  elegirTapa: string;
  cuantasFotos: (n: number) => string;

  ultimo: (q: Quien) => string;
  verTodo: string;
  escuchar: string;
  pausar: string;
  sinTexto: string;
  hoy: string;
  ayer: string;
  haceDias: (n: number) => string;

  dudas: string;

  cuenta: string;
  cambiarHistoria: string;
  libroDe: (q: Quien) => string;
};

const tuOSu = (q: Quien) => (q.propia ? "tu" : "su");

const ES: TextosPanel = {
  hola: (nombre) => `Hola, ${nombre}.`,
  titular: (t, q) => {
    // El viaje lo cuenta quien lo compró: en singular, como el resto del panel de
    // viaje (la maqueta lo decía en vosotros; ver textos-panel.md).
    if (q.viaje) {
      if (t === "antes") return "Todo listo para tu primer mensaje.";
      if (t === "creciendo") return "Tu viaje ya se está guardando.";
      if (t === "pausa") return "Tu viaje está en pausa.";
      if (t === "termino") return "Ya volviste. Falta elegir la tapa.";
      if (t === "escribiendo") return "Estamos escribiendo tu libro de viaje.";
      return "Tu libro de viaje está listo.";
    }
    const libro = q.propia ? "Tu libro" : `El libro de ${q.como}`;
    const libroMin = q.propia ? "tu libro" : `el libro de ${q.como}`;
    if (t === "antes") return `Todo listo para ${tuOSu(q)} primer mensaje.`;
    if (t === "creciendo") return `${libro} va creciendo.`;
    if (t === "pausa") return `${libro} está en pausa.`;
    if (t === "termino") return q.propia ? "Terminaste de contar." : `${q.como} terminó de contar.`;
    if (t === "escribiendo") return `Estamos escribiendo ${libroMin}.`;
    return `${libro} está listo.`;
  },
  respuestas: (n) => (n === 1 ? "respuesta" : "respuestas"),
  minutosDeVoz: (q) => `min de ${q.viaje ? "tu" : tuOSu(q)} voz`,
  pasos: (q) => ({ pagado: "Pagado", primer: "Primer mensaje", contando: q.viaje ? "De viaje" : "Contándolo", listo: "Libro listo", impreso: "Impreso en casa" }),
  comoVa: "Cómo va",
  hecho: "hecho",
  ahora: "ahora",

  whatsapp: (q) => (q.propia ? "Tu WhatsApp" : "Su WhatsApp"),
  whatsappFalta: "Todavía no tenemos su número. Nos llega cuando abre el regalo y nos escribe con su código.",
  verTarjeta: "Ver la tarjeta del regalo",

  pedido: "Tu pedido",
  lineaBase: "Entrevista + libro digital",
  lineaImpreso: (c) => (c > 1 ? `Libro impreso, tapa dura · ${c} ejemplares` : "Libro impreso, tapa dura"),
  lineaMarco: (m) => (m > 1 ? `Foto enmarcada · ${m} marcos` : "Foto enmarcada"),
  cambiarDireccion: "Cambiar la dirección de envío",
  anadirMarco: "Añadir el marco",
  // La tarjeta del marco: el título y el texto son los de la maqueta Panel y
  // del checkout (aprobados); «Tu foto enmarcada» y el texto de «tu libro»,
  // aprobados el 18/10 (tandas 1 y 2 de textos.md).
  marcoTitulo: (q) => (q.propia || q.viaje ? "Tu foto enmarcada" : "Su foto enmarcada"),
  marcoTexto: (q) =>
    q.viaje
      ? "Acercas el móvil al marco y se abre el libro del viaje, con tu voz."
      : q.propia
        ? "Acercas el móvil al marco y se abre tu libro, con tu voz."
        : "Acercas el móvil al marco y se abre su libro, con su voz.",
  altMarco: "Un marco negro pequeño con una foto, sobre un aparador junto a un libro y una lámpara encendida",
  // «Cambiar la fecha de inicio», «Nueva fecha» y «Guardar la nueva fecha»
  // son de la maqueta; «Guardado», del pedido de Naza (18/10). El resto,
  // aprobado por Naza el 18/10 (textos.md, tanda 1).
  cambiarFecha: "Cambiar la fecha de inicio",
  fechaTexto: "El día en que empieza su regalo. Puedes cambiarla mientras no lo haya abierto.",
  fechaCampo: "Nueva fecha",
  guardarFecha: "Guardar la nueva fecha",
  guardando: "Guardando…",
  guardado: "Guardado",
  errorFecha: "No pudimos guardar la fecha. Intenta de nuevo.",
  pausarOCerrar: "Pausar o cerrar el libro",
  cancelar: "Cancelar el pedido",
  pausarTitulo: "Pausar por ahora",
  pausarTexto: (q) =>
    `La pausa la hace una persona del equipo. Escríbenos y paramos las preguntas y los recordatorios. Lo que ya ${q.propia ? "contaste" : "contó"} queda guardado.`,
  cerrarTitulo: "Cerrar el libro con lo que ya hay",
  cancelarTexto: "Escríbenos y lo vemos contigo. Te contesta una persona.",
  asuntoPausa: "Pausar el libro",
  asuntoCancelar: "Cancelar el pedido",
  escribirWhatsApp: "Escribir por WhatsApp",
  escribirCorreo: "Escribir un correo",
  cerrarHoja: "Cerrar",

  familia: "La familia",
  familiaTexto: (q) =>
    q.viaje
      ? "Invita a quien quieras para que siga el viaje y escuche tus audios."
      : q.propia
        ? "Invita a tu familia para que escuche tus audios y proponga preguntas."
        : "Invita a tus hermanos para que escuchen sus audios y propongan preguntas.",

  fotos: (q) => (q.propia || q.viaje ? "Tus fotos" : "Sus fotos"),
  faltaPortada: (q) => `Falta ${q.viaje ? "tu" : tuOSu(q)} foto para la portada.`,
  hayPortada: (q) => (q.propia || q.viaje ? "Tu foto de portada ya está." : "Su foto de portada ya está."),
  fotosTexto: (q) => `La de la portada es la que verá todo el mundo. Puedes añadirla hasta que cerremos ${q.viaje ? "tu" : tuOSu(q)} libro.`,
  elegirTapa: "Elegir la foto de la tapa",
  cuantasFotos: (n) => (n === 1 ? "1 foto en el álbum" : `${n} fotos en el álbum`),

  ultimo: (q) => (q.propia ? "Lo último que contaste" : "Lo último que contó"),
  verTodo: "Ver todo",
  escuchar: "Escuchar",
  pausar: "Pausar",
  sinTexto: "Audio sin transcribir todavía",
  hoy: "Hoy",
  ayer: "Ayer",
  haceDias: (n) => `Hace ${n} días`,

  dudas: "¿Dudas? Escríbenos, te contesta una persona.",

  cuenta: "Tu cuenta y salir",
  cambiarHistoria: "Cambiar de historia",
  libroDe: (q) => (q.viaje ? "Tu libro de viaje" : q.propia ? "Tu libro" : `El libro de ${q.como}`),
};

const AR: TextosPanel = {
  ...ES,
  pausarTexto: (q) =>
    `La pausa la hace una persona del equipo. Escribinos y frenamos las preguntas y los recordatorios. Lo que ya ${q.propia ? "contaste" : "contó"} queda guardado.`,
  cancelarTexto: "Escribinos y lo vemos con vos. Te contesta una persona.",
  familiaTexto: (q) =>
    q.viaje
      ? "Invitá a quien quieras para que siga el viaje y escuche tus audios."
      : q.propia
        ? "Invitá a tu familia para que escuche tus audios y proponga preguntas."
        : "Invitá a tus hermanos para que escuchen sus audios y propongan preguntas.",
  fotosTexto: (q) => `La de la portada es la que va a ver todo el mundo. Podés sumarla hasta que cerremos ${q.viaje ? "tu" : tuOSu(q)} libro.`,
  anadirMarco: "Sumar el marco",
  marcoTexto: (q) =>
    q.viaje
      ? "Acercás el celular al marco y se abre el libro del viaje, con tu voz."
      : q.propia
        ? "Acercás el celular al marco y se abre tu libro, con tu voz."
        : "Acercás el celular al marco y se abre su libro, con su voz.",
  altMarco: "Un marco negro chico con una foto, sobre un aparador junto a un libro y una lámpara prendida",
  fechaTexto: "El día en que empieza su regalo. Podés cambiarla mientras no lo haya abierto.",
  errorFecha: "No pudimos guardar la fecha. Intentá de nuevo.",
  dudas: "¿Dudas? Escribinos, te contesta una persona.",
};

export const PANEL: Record<IdiomaPanel, TextosPanel> = { es: ES, ar: AR };
