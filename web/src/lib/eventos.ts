import type { IdiomaWeb } from "./idioma-web";

// Vitácora Eventos (17/10): el formulario de /eventos no vende, avisa. La
// consulta llega por mail a los socios (MAIL_SOCIOS) y ellos contestan a mano.
// Acá vive lo que no depende de Next: los tipos de evento, la validación del
// cuerpo y el texto del aviso. Lo usa app/api/eventos/route.ts.

export const TIPOS_EVENTO = ["boda", "cumpleanos", "aniversario", "despedida", "show", "empresa", "otro"] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

/** Los nombres para el mail de los socios: siempre en castellano. */
const NOMBRE_TIPO: Record<TipoEvento, string> = {
  boda: "Boda / casamiento",
  cumpleanos: "Cumpleaños",
  aniversario: "Aniversario",
  despedida: "Despedida o jubilación",
  show: "Show o concierto",
  empresa: "Evento de empresa",
  otro: "Otro",
};

export type ConsultaEvento = {
  idioma: IdiomaWeb;
  nombre: string;
  email: string;
  telefono: string;
  tipo: TipoEvento;
  fecha: string;
  lugar: string;
  invitados: string;
  mensaje: string;
};

export type ErrorConsulta = "faltan" | "email";

const CORTO = 200;
const LARGO = 3000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * El cuerpo del formulario, limpio. Nombre, email y tipo son obligatorios; lo
 * demás puede venir vacío. Todo se recorta a un largo razonable.
 */
export function validarConsultaEvento(cuerpo: unknown): { ok: true; consulta: ConsultaEvento } | { ok: false; error: ErrorConsulta } {
  const c = (cuerpo && typeof cuerpo === "object" ? cuerpo : {}) as Record<string, unknown>;
  const nombre = texto(c.nombre, CORTO);
  const email = texto(c.email, CORTO);
  const tipo = TIPOS_EVENTO.find((t) => t === c.tipo);
  if (!nombre || !email || !tipo) return { ok: false, error: "faltan" };
  if (!EMAIL.test(email)) return { ok: false, error: "email" };
  const idioma: IdiomaWeb = c.idioma === "ca" || c.idioma === "ar" ? c.idioma : "es";
  return {
    ok: true,
    consulta: {
      idioma,
      nombre,
      email,
      tipo,
      telefono: texto(c.telefono, CORTO),
      fecha: texto(c.fecha, CORTO),
      lugar: texto(c.lugar, CORTO),
      invitados: texto(c.invitados, CORTO),
      mensaje: texto(c.mensaje, LARGO),
    },
  };
}

/** El campo trampa: un robot lo llena, una persona no lo ve. */
export const CAMPO_TRAMPA = "sitio";

export function esRobot(cuerpo: unknown): boolean {
  const c = (cuerpo && typeof cuerpo === "object" ? cuerpo : {}) as Record<string, unknown>;
  return typeof c[CAMPO_TRAMPA] === "string" && c[CAMPO_TRAMPA].trim() !== "";
}

const PAIS: Record<IdiomaWeb, string> = { es: "España (castellano, de tú)", ca: "España (catalán)", ar: "Argentina (de vos)" };

/** El aviso a los socios: asunto y texto plano. */
export function mailConsultaEvento(c: ConsultaEvento): { asunto: string; texto: string } {
  const linea = (etiqueta: string, valor: string) => `${etiqueta}: ${valor || "(no lo puso)"}`;
  return {
    asunto: `Vitácora Eventos · ${NOMBRE_TIPO[c.tipo]} · ${c.nombre}`,
    texto: [
      "Llegó una consulta nueva desde /eventos.",
      "",
      linea("Nombre", c.nombre),
      linea("Email", c.email),
      linea("Teléfono", c.telefono),
      linea("Evento", NOMBRE_TIPO[c.tipo]),
      linea("Fecha", c.fecha),
      linea("Ciudad", c.lugar),
      linea("Invitados", c.invitados),
      linea("Web", PAIS[c.idioma]),
      "",
      "Mensaje:",
      c.mensaje || "(no escribió nada)",
      "",
      `Para contestar, escribirle a ${c.email}.`,
    ].join("\n"),
  };
}
