// La compra de Vitácora Kids del lado del servidor (K4, 15/10): lo puro de
// /api/compra con `producto: "kids"`. Lee el cuerpo SIN confiar en el cliente,
// arma la `Ficha` del motor y la valida con las mismas reglas que el motor, y
// dice qué va a `narradores` y a `kids_v2`. Sin red ni Supabase.
//
// La forma de la base es la del CONTRATO, «Vitácora Kids V2 por WhatsApp»
// (rama de la conexión, migración 20261016000000_kids_v2):
//   - narrador `pendiente_pago`, `contexto.modo = "kids"`, `nombre` (tapa),
//     `como_le_dicen` = apodo, `telefono_whatsapp` = el número de las preguntas
//     (canal A, el del chico; canal B, el del padre), `hora_preferida` y
//     `zona_horaria` = copia de la ficha;
//   - pedido con `extras.tipo = "kids"`;
//   - fila de `kids_v2`: `canal`, `telefono_padre` (E.164), `idioma` y `ficha`.

import { normalizarTelefono, type Region } from "./registro";
import { edadValida, zonaKids } from "./kids";

/** Así lo guarda `kids_v2.idioma`: el banco de Kids está solo en rioplatense (CONTRATO). */
export const IDIOMA_KIDS = "es-AR";

// ── La Ficha del motor, copiada ─────────────────────────────────────────────
//
// Todo lo de este bloque sale TAL CUAL de la rama de la conexión de Kids
// (fabrica/src/kids-v2/): `Ficha` y `validarFicha` de compra.ts, `esHora`,
// `NOCHE_DESDE`, `NOCHE_HASTA` y `zonaValida` de horas.ts, `TEMAS` de
// compra.ts, `MAX_PREGUNTAS_PADRE` de reglas.ts y `normalizarQuienRegala` de
// texto.ts. La web no puede importar la fábrica (CONTRATO, «Para decidir con
// Joaquín» 3: la web usa una copia de validarFicha). Si el motor cambia una
// regla, esta copia cambia igual.

const NOCHE_DESDE = "22:00";
const NOCHE_HASTA = "09:00";
const MAX_PREGUNTAS_PADRE = 3;
const TEMAS = ["mama", "papa", "abuelo-murio", "ensamblada", "mudanza", "escuela"] as const;
type Tema = (typeof TEMAS)[number];

const esHora = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

function zonaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    return true;
  } catch {
    return false;
  }
}

/** "Tu mamá" → "tu mamá": solo se baja la mayúscula de "Tu"/"Tus" (texto.ts). */
export function normalizarQuienRegala(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  return /^tus?\s/i.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
}

export type PreguntaPadre = { texto: string; conLinea: boolean; quien?: string };

export type FichaKids = {
  nombre: string;
  apodo: string;
  genero: "chico" | "chica";
  edad: number;
  quienRegala: string;
  canal: "A" | "B";
  nombrePadre: string;
  linkPanel: string;
  hora: string;
  zona: string;
  temasSacados: Tema[];
  fotosConOtrosChicos: boolean;
  preguntasPadre: PreguntaPadre[];
};

/** `validarFicha` del motor: valida y normaliza; tira error con el nombre del campo. */
export function validarFichaKids(f: FichaKids): FichaKids {
  for (const campo of ["nombre", "apodo", "quienRegala", "nombrePadre", "linkPanel"] as const) {
    if (!f[campo] || !f[campo].trim()) throw new Error(`Ficha: falta ${campo}`);
  }
  if (f.genero !== "chico" && f.genero !== "chica") throw new Error('Ficha: genero es "chico" o "chica"');
  if (f.canal !== "A" && f.canal !== "B") throw new Error('Ficha: canal es "A" o "B"');
  if (!esHora(f.hora) || f.hora < NOCHE_HASTA || f.hora >= NOCHE_DESDE) throw new Error(`Ficha: hora ${f.hora} fuera de 09:00–21:59`);
  if (!zonaValida(f.zona)) throw new Error(`Ficha: zona desconocida ${f.zona}`);
  for (const t of f.temasSacados) if (!(TEMAS as readonly string[]).includes(t)) throw new Error(`Ficha: tema desconocido ${t}`);
  const preguntasPadre = f.preguntasPadre
    .map((p): PreguntaPadre => ({ texto: p.texto.trim(), conLinea: p.conLinea, ...(p.quien?.trim() ? { quien: normalizarQuienRegala(p.quien) } : {}) }))
    .filter((p) => p.texto !== "");
  if (preguntasPadre.length > MAX_PREGUNTAS_PADRE) throw new Error(`Ficha: hasta ${MAX_PREGUNTAS_PADRE} preguntas del padre`);
  return {
    ...f,
    nombre: f.nombre.trim(),
    apodo: f.apodo.trim(),
    nombrePadre: f.nombrePadre.trim(),
    quienRegala: normalizarQuienRegala(f.quienRegala),
    temasSacados: [...new Set(f.temasSacados)],
    preguntasPadre,
  };
}

// ── El cuerpo de la compra ──────────────────────────────────────────────────

/** El número tal como lo guarda la base: E.164 (el `check` de `kids_v2.telefono_padre` y el de registro.ts). */
const TELEFONO_E164 = /^\+[1-9]\d{7,14}$/;

/** Lo que manda /comprar/kids (lib/kids.ts, `cuerpoKids`); nada de esto se cree sin mirarlo. */
export type CuerpoKids = {
  nombreComprador?: unknown;
  whatsappComprador?: unknown;
  whatsappChico?: unknown;
  kids?: unknown;
};

export type CompraKidsLeida = {
  familia: { nombre: string; region: Region };
  narrador: {
    nombre: string;
    como_le_dicen: string;
    telefono_whatsapp: string;
    hora_preferida: string;
    zona_horaria: string;
    contexto: { modo: "kids" };
  };
  canal: "A" | "B";
  telefonoPadre: string;
  /** Ya validada, sin `linkPanel`: el link lleva el id del narrador y se pone al crearlo (`conLinkPanel`). */
  ficha: Omit<FichaKids, "linkPanel">;
};

export type FallaCompraKids = "malFormado" | "telefono" | "mismoNumero";

const texto = (v: unknown): string => (typeof v === "string" ? v : "");

/** Largo máximo de nombre, apodo, quién se lo regala y el nombre de quien compra. */
export const LARGO_MAXIMO = 60;

function telefono(crudo: unknown, region: Region): string | null {
  if (typeof crudo !== "string" || !crudo.trim()) return null;
  const n = normalizarTelefono(crudo, region);
  return TELEFONO_E164.test(n) ? n : null;
}

/**
 * Lee el cuerpo de una compra de Kids. La ficha se arma acá con lo que se
 * puede creer: `nombrePadre` es el nombre de quien compra, la `zona` sale de la
 * región (no del cliente), `preguntasPadre` nace vacía (se escriben desde el
 * panel) y cualquier otra clave que mande el cliente se tira.
 */
export function leerCompraKids(body: CuerpoKids, region: Region): { ok: true; compra: CompraKidsLeida } | { ok: false; falla: FallaCompraKids } {
  const k = body.kids;
  if (!k || typeof k !== "object" || Array.isArray(k)) return { ok: false, falla: "malFormado" };
  const c = k as Record<string, unknown>;

  // Tipos primero: validarFicha supone una Ficha bien tipada.
  const temas = c.temasSacados ?? [];
  if (!Array.isArray(temas) || temas.some((t) => typeof t !== "string")) return { ok: false, falla: "malFormado" };
  if (typeof c.fotosConOtrosChicos !== "boolean") return { ok: false, falla: "malFormado" };
  // La edad no la mira el motor, pero va en la tapa: la misma regla que la pantalla (edadValida).
  const edad = typeof c.edad === "number" ? edadValida(String(c.edad)) : null;
  if (edad === null) return { ok: false, falla: "malFormado" };

  // Tope de largo (van en la tapa y en los mensajes): lo que la pantalla no
  // deja escribir tampoco entra por el servidor. quienRegala trae también
  // «Otra persona» (quienOtra) y nombrePadre es «Tu nombre» (tuNombre).
  for (const v of [c.nombre, c.apodo, c.quienRegala, body.nombreComprador]) {
    if (texto(v).trim().length > LARGO_MAXIMO) return { ok: false, falla: "malFormado" };
  }

  let ficha: FichaKids;
  try {
    ficha = validarFichaKids({
      nombre: texto(c.nombre),
      apodo: texto(c.apodo),
      genero: c.genero as FichaKids["genero"],
      edad,
      quienRegala: texto(c.quienRegala),
      canal: c.canal as FichaKids["canal"],
      nombrePadre: texto(body.nombreComprador),
      // Provisorio para validar: el de verdad lleva el id del narrador (conLinkPanel).
      linkPanel: "pendiente",
      hora: texto(c.hora),
      zona: zonaKids(region),
      temasSacados: temas as Tema[],
      fotosConOtrosChicos: c.fotosConOtrosChicos,
      preguntasPadre: [],
    });
  } catch {
    return { ok: false, falla: "malFormado" };
  }

  const telefonoPadre = telefono(body.whatsappComprador, region);
  if (!telefonoPadre) return { ok: false, falla: "telefono" };
  // Canal A: las preguntas van al WhatsApp del chico; canal B («lo hago yo»), al del padre,
  // y entonces los dos números son el mismo (CONTRATO: lo cuida la web).
  const telefonoPreguntas = ficha.canal === "A" ? telefono(body.whatsappChico, region) : telefonoPadre;
  if (!telefonoPreguntas) return { ok: false, falla: "telefono" };
  // Canal A con el mismo número que el padre: el motor tomaría al padre por el
  // chico (lo que manda ese número entra como respuesta). Eso es el canal B.
  if (ficha.canal === "A" && telefonoPreguntas === telefonoPadre) return { ok: false, falla: "mismoNumero" };

  const { linkPanel: _provisorio, ...sinLink } = ficha;
  return {
    ok: true,
    compra: {
      familia: { nombre: ficha.nombrePadre, region },
      narrador: {
        nombre: ficha.nombre,
        como_le_dicen: ficha.apodo,
        telefono_whatsapp: telefonoPreguntas,
        hora_preferida: ficha.hora,
        zona_horaria: ficha.zona,
        contexto: { modo: "kids" },
      },
      canal: ficha.canal,
      telefonoPadre,
      ficha: sinLink,
    },
  };
}

/**
 * La ficha con su `linkPanel`: el tablero del narrador, con la misma base que
 * los links del mail de acceso (lib/mail.ts). Sin sesión, el tablero manda a
 * /entrar y vuelve. Cuando exista el panel de Kids (K5), cambia acá.
 */
export function conLinkPanel(ficha: Omit<FichaKids, "linkPanel">, narradorId: string, urlBase: string): FichaKids {
  return { ...ficha, linkPanel: `${urlBase}/tablero/${narradorId}` };
}
