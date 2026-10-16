// El panel de Vitácora Kids para los padres (K5, 15/10): lo puro. Sin red ni
// Supabase, para probarlo sin mocks. Lo que lee y escribe la base está en
// lib/kids-panel-base.ts.
//
// La forma de la base es la del CONTRATO, «Vitácora Kids V2 por WhatsApp»
// (migración 20261016000000_kids_v2, PROPUESTA para Joaquín):
//   - `respuestas.clave_kids` dice a qué item del motor responde cada fila
//     (K12, K12-R1, K12-OP, K10-FOTO, X1-2, UNA-MAS-2, CIERRE-3, PADRE-1,
//     CIERRE-FINAL, EXTRAS, BIEN-CHICO, PREG-NUEVA-CHICO…; motor/recibido.ts).
//     Null = el motor todavía no la procesó; ∅ = quedó afuera a propósito.
//     Ninguna de las dos se muestra.
//   - las fotos van en `fotos` con el `pregunta_orden` de la llegada; su fila de
//     `respuestas` (la del mismo `pregunta_orden`) dice `⟦foto⟧`.
//   - `kids_v2.cambios_panel` = `{ hora?, temasSacados?, preguntasPadre?, pedido_at }`,
//     con las listas completas; la web lo valida con las reglas de validarFicha.
//   - `kids_v2.correcciones` = `[{ respuesta_id, dice, es, at }]`.
//
// Los textos de las preguntas salen de una copia del banco del motor
// (kids-banco.json, ver su `_origen`): nada de redacción nueva. Para un chico
// de España, los textos van de kids-banco-es-ES.json (solo textos por ID, que
// pisan los de kids-banco.json: es `bancoDe("es-ES")` del motor, banco.ts).

import bancoJson from "./kids-banco.json";
import bancoEsEsJson from "./kids-banco-es-ES.json";
import { HORAS_KIDS, TEMAS_KIDS, idiomaKidsDe, type IdiomaKids, type TemaKids } from "./kids";
import { LARGO_MAXIMO, normalizarQuienRegala, validarFichaKids, type FichaKids, type PreguntaPadre } from "./kids-compra";

// ── El banco ─────────────────────────────────────────────────────────────

type AccionRama = { tipo: "preguntar"; pasos: string[] } | { tipo: "paso" } | { tipo: "no-aplica" };
type PreguntaBanco = {
  id: string;
  cap: number;
  texto: string;
  ramas: { boton: string; accion: AccionRama }[];
  botonPaso: string;
  op: ({ texto: string } & Record<string, unknown>) | null;
  foto: { de: string; texto: string; botones: string[]; noTengo: string | null } | null;
};
type BancoKids = {
  capitulos: { n: number; titulo: string }[];
  preguntas: PreguntaBanco[];
  extras: { id: string; cap: number; texto: string }[];
  mensajes: { id: string; texto: string; botones: string[] }[];
};

/** El banco de banco.md, rioplatense (vos). */
export const BANCO_KIDS = bancoJson as unknown as BancoKids;

/** El botón genérico de pasar en banco.md (el de K1); las que tienen otro van con Kn-BPASO. */
const BOTON_PASO_AR = BANCO_KIDS.preguntas.find((p) => p.id === "K1")?.botonPaso ?? "Paso";

const idRamaPaso = (p: string, i: number, k: number) => `${p}-R${i + 1}${k > 0 ? `-${k + 1}` : ""}`;

/**
 * El mismo banco con los textos de otro idioma, por ID (la notación de
 * banco-es-ES.md; copia de armarBancoIdioma del motor). Si falta un ID, tira:
 * nunca un texto en el idioma equivocado (un test chequea que estén todos).
 */
export function armarBancoIdioma(textos: Readonly<Record<string, string>>, idioma: IdiomaKids): BancoKids {
  const de = (id: string): string => {
    const x = textos[id];
    if (typeof x !== "string") throw new Error(`Banco de kids ${idioma}: falta el texto de ${id}`);
    return x;
  };
  return {
    capitulos: BANCO_KIDS.capitulos.map((c) => ({ ...c, titulo: de(`CAP-${c.n}`) })),
    preguntas: BANCO_KIDS.preguntas.map((p) => {
      const ramas = p.ramas.map((r, i) => ({
        boton: de(`${p.id}-B${i + 1}`),
        accion: r.accion.tipo === "preguntar" ? { tipo: "preguntar" as const, pasos: r.accion.pasos.map((_, k) => de(idRamaPaso(p.id, i, k))) } : r.accion,
      }));
      const soloRama = typeof p.op?.soloRama === "string" ? p.ramas.findIndex((r) => r.boton === p.op!.soloRama) : -1;
      return {
        ...p,
        texto: de(p.id),
        ramas,
        botonPaso: p.botonPaso === BOTON_PASO_AR ? de("BOTON-PASO") : de(`${p.id}-BPASO`),
        op: p.op ? { ...p.op, texto: de(`${p.id}-OP`), ...(p.op.soloRama !== undefined ? { soloRama: soloRama < 0 ? null : ramas[soloRama].boton } : {}) } : null,
        foto: p.foto
          ? { ...p.foto, texto: de(`${p.id}-FOTO`), botones: p.foto.botones.map((_, i) => de(`${p.id}-FOTO-B${i + 1}`)), noTengo: p.foto.noTengo ? de(`${p.id}-FOTO-NOTENGO`) : null }
          : null,
      };
    }),
    extras: BANCO_KIDS.extras.map((x) => ({ ...x, texto: de(x.id) })),
    mensajes: BANCO_KIDS.mensajes.map((m) => ({ ...m, texto: de(m.id), botones: m.botones.map((_, i) => de(`${m.id}-B${i + 1}`)) })),
  };
}

type Armado = { banco: BancoKids; preguntas: Map<string, PreguntaBanco>; extras: Map<string, BancoKids["extras"][number]>; mensajes: Map<string, BancoKids["mensajes"][number]> };

function armado(banco: BancoKids): Armado {
  return {
    banco,
    preguntas: new Map(banco.preguntas.map((p) => [p.id, p])),
    extras: new Map(banco.extras.map((x) => [x.id, x])),
    mensajes: new Map(banco.mensajes.map((m) => [m.id, m])),
  };
}

const BANCOS: Record<IdiomaKids, Armado> = {
  "es-AR": armado(BANCO_KIDS),
  "es-ES": armado(armarBancoIdioma(bancoEsEsJson as unknown as Record<string, string>, "es-ES")),
};

/** El banco en el castellano del chico (sin idioma, o uno raro, el rioplatense). */
export function bancoKidsDe(idioma: IdiomaKids = "es-AR"): BancoKids {
  return (BANCOS[idioma] ?? BANCOS["es-AR"]).banco;
}

const bancoDel = (idioma: IdiomaKids | undefined): Armado => BANCOS[idioma ?? "es-AR"] ?? BANCOS["es-AR"];

/** Los ids del banco que usa el panel por fuera de las preguntas y las extras (un test los chequea). */
export const MENSAJES_DEL_PANEL = ["B-UNA-MAS", "CIERRE-1", "CIERRE-2", "CIERRE-3", "CIERRE-4", "CIERRE-FINAL", "EXTRAS-OFERTA", "BIEN-CHICO"] as const;

/** El capítulo de la cápsula (flujo §9): sus respuestas van en el sobre cerrado. */
export const CAPITULO_CAPSULA = 5;

/** El título de un capítulo del banco del chico («Mi gente»), o null. */
export function tituloCapitulo(n: number, idioma: IdiomaKids = "es-AR"): string | null {
  return bancoDel(idioma).banco.capitulos.find((c) => c.n === n)?.titulo ?? null;
}

/** El botón con que el chico arranca («Dale, vamos» / «Vale, vamos»): BIEN-CHICO-B1 del banco de su idioma. */
export function botonArranque(idioma: IdiomaKids = "es-AR"): string {
  return bancoDel(idioma).mensajes.get("BIEN-CHICO")?.botones[0] ?? "";
}

/** «Tu mamá. Contame…»: {{o/a}} según sea chico o chica y {{1}}, {{2}} = cómo le dicen y quién se lo regala (motor/mensajes.ts). */
function render(texto: string, ficha: Pick<FichaKids, "genero" | "apodo" | "quienRegala">): string {
  return texto
    .replace(/\{\{o\/a\}\}/g, ficha.genero === "chica" ? "a" : "o")
    .replace(/\{\{(\d+)\}\}/g, (_m, n: string) => [ficha.apodo, ficha.quienRegala][Number(n) - 1] ?? "");
}

/**
 * K18 nombra a mamá y papá (madre y padre en España) y queda aunque se saque
 * uno de los dos temas: el motor borra palabras de la frase aprobada
 * (compra.ts, BORRADOS_POR_TEMA). Copia de esa regla, para mostrar la pregunta
 * como le llegó.
 */
const BORRADOS_POR_TEMA: { pregunta: string; idioma: IdiomaKids; frase: string; borrar: { mama: string; papa: string; ambos: string } }[] = [
  {
    pregunta: "K18",
    idioma: "es-AR",
    frase: "como la pareja de tu mamá o de tu papá, o alguien",
    borrar: { papa: " o de tu papá", mama: "de tu mamá o ", ambos: "la pareja de tu mamá o de tu papá, o " },
  },
  {
    pregunta: "K18",
    idioma: "es-ES",
    frase: "como la pareja de tu madre o de tu padre, o alguien",
    borrar: { papa: " o de tu padre", mama: "de tu madre o ", ambos: "la pareja de tu madre o de tu padre, o " },
  },
];

function textoSegunTemas(id: string, texto: string, temasSacados: readonly string[], idioma: IdiomaKids): string {
  const b = BORRADOS_POR_TEMA.find((x) => x.pregunta === id && x.idioma === idioma);
  if (!b || !texto.includes(b.frase)) return texto;
  const sinMama = temasSacados.includes("mama");
  const sinPapa = temasSacados.includes("papa");
  if (!sinMama && !sinPapa) return texto;
  const borrar = sinMama && sinPapa ? b.borrar.ambos : sinMama ? b.borrar.mama : b.borrar.papa;
  return texto.replace(b.frase, b.frase.replace(borrar, ""));
}

export type ItemDeClave = {
  /** 0 = antes de la primera pregunta (la bienvenida, el aviso de pregunta nueva); 1 a 5, los capítulos. */
  cap: number;
  /** El texto de lo que se le preguntó, como le llegó. Null si no hay uno que mostrar (la bienvenida). */
  texto: string | null;
  /** PADRE-n: el número de la pregunta del padre (la vista pone «Tu pregunta n» si no encuentra el texto). */
  padre?: number;
};

/**
 * A qué pregunta responde una `clave_kids`, con el texto que le llegó. `ficha`
 * es la que vale (la del motor si ya arrancó). Null para ∅, null o una clave
 * que no se conoce (no se muestran).
 */
export function itemDeClave(clave: string | null | undefined, ficha: FichaKids, idioma: IdiomaKids = idiomaKidsDe(ficha.idioma)): ItemDeClave | null {
  if (!clave || clave === SIN_CLAVE_KIDS) return null;
  const { preguntas: PREGUNTAS, extras: EXTRAS, mensajes: MENSAJES } = bancoDel(idioma);
  const textoMensaje = (id: string): string | null => {
    const x = MENSAJES.get(id);
    return x ? render(x.texto, ficha) : null;
  };
  let m: RegExpMatchArray | null;

  if ((m = clave.match(/^(K\d+)(?:-(R(\d+)(?:-(\d+))?|OP|FOTO))?$/))) {
    const p = PREGUNTAS.get(m[1]);
    if (!p) return null;
    const sufijo = m[2];
    if (!sufijo) return { cap: p.cap, texto: render(textoSegunTemas(p.id, p.texto, ficha.temasSacados, idioma), ficha) };
    if (sufijo === "OP") return { cap: p.cap, texto: p.op ? render(p.op.texto, ficha) : null };
    if (sufijo === "FOTO") return { cap: p.cap, texto: p.foto ? render(p.foto.texto, ficha) : null };
    const accion = p.ramas[Number(m[3]) - 1]?.accion;
    const paso = m[4] ? Number(m[4]) - 1 : 0;
    // El botón propio de una rama que no pregunta («Dale, esa la salteamos»): va con la principal.
    const texto = accion?.tipo === "preguntar" ? accion.pasos[paso] : undefined;
    return { cap: p.cap, texto: render(texto ?? textoSegunTemas(p.id, p.texto, ficha.temasSacados, idioma), ficha) };
  }
  if ((m = clave.match(/^X\d+-\d+$/))) {
    const x = EXTRAS.get(clave);
    return x ? { cap: x.cap, texto: render(x.texto, ficha) } : null;
  }
  if ((m = clave.match(/^UNA-MAS-(\d)$/))) return { cap: Number(m[1]), texto: textoMensaje("B-UNA-MAS") };
  if ((m = clave.match(/^CIERRE-(\d)$/))) return { cap: Number(m[1]), texto: textoMensaje(clave) };
  if (clave === "CIERRE-FINAL") return { cap: CAPITULO_CAPSULA, texto: textoMensaje(clave) };
  if (clave === "EXTRAS") return { cap: CAPITULO_CAPSULA, texto: textoMensaje("EXTRAS-OFERTA") };
  if ((m = clave.match(/^PADRE-(\d)$/))) {
    const n = Number(m[1]);
    return { cap: 4, texto: ficha.preguntasPadre[n - 1]?.texto ?? null, padre: n };
  }
  // La bienvenida, el aviso de pregunta nueva y los demás mensajes fijos: antes de la primera pregunta.
  if (MENSAJES.has(clave)) return { cap: 0, texto: null };
  return null;
}

// ── Lo que cuenta ────────────────────────────────────────────────────────

/** La clave de lo que llegó y no hizo nada (motor/recibido.ts). */
export const SIN_CLAVE_KIDS = "∅";

export type RespuestaKids = {
  id: string;
  pregunta_orden: number;
  clave_kids: string | null;
  audio_path: string | null;
  transcripcion: string | null;
  texto_directo: string | null;
  duracion_segundos: number | null;
  recibido_at: string;
};

export type FotoKids = { id: string; pregunta_orden: number | null };

export type CorreccionKids = { respuesta_id: string; dice: string; es: string; at: string };

export type EntradaKids = {
  id: string;
  /** Hay audio para escuchar (/api/audio/<id>, URL firmada). */
  audio: boolean;
  duracion: number | null;
  /** Lo que dijo: la transcripción o lo que escribió. Null si es una foto sola o el audio no se transcribió todavía. */
  texto: string | null;
  /** Hay audio y todavía no hay transcripción. */
  transcribiendo: boolean;
  /** Tocó un botón («Paso», «No tengo»…). */
  boton: string | null;
  fotos: string[];
  recibidoAt: string;
  correcciones: CorreccionKids[];
};

export type PreguntaKids = { clave: string; texto: string | null; padre?: number; entradas: EntradaKids[] };

export type CapituloKids = { n: number; titulo: string | null; capsula: boolean; preguntas: PreguntaKids[] };

const MARCA_BOTON = /^⟦botón:(.*)⟧$/;
const MARCA_FOTO = "⟦foto⟧";

/**
 * Todo lo que contó, por capítulo y por pregunta, en el orden en que llegó.
 * Las del capítulo 5 (la cápsula) van marcadas: el padre las ve todas (flujo §9 y §12).
 */
export function loQueCuenta(
  respuestas: RespuestaKids[],
  fotos: FotoKids[],
  ficha: FichaKids,
  correcciones: CorreccionKids[] = [],
  idioma: IdiomaKids = idiomaKidsDe(ficha.idioma),
): CapituloKids[] {
  const fotosDe = new Map<number, string[]>();
  for (const f of fotos) {
    if (f.pregunta_orden === null) continue;
    fotosDe.set(f.pregunta_orden, [...(fotosDe.get(f.pregunta_orden) ?? []), f.id]);
  }
  const ordenadas = [...respuestas].sort((a, b) => a.pregunta_orden - b.pregunta_orden || a.recibido_at.localeCompare(b.recibido_at));
  const capitulos = new Map<number, CapituloKids>();
  const preguntas = new Map<string, PreguntaKids>();
  const fotosUsadas = new Set<number>();

  for (const r of ordenadas) {
    const item = itemDeClave(r.clave_kids, ficha, idioma);
    if (!item) continue;
    const directo = r.texto_directo?.trim() ?? "";
    const boton = directo.match(MARCA_BOTON)?.[1]?.trim() ?? null;
    const esFoto = directo === MARCA_FOTO;
    // Las fotos de una llegada van una sola vez, con la primera fila de esa llegada.
    const susFotos = fotosUsadas.has(r.pregunta_orden) ? [] : (fotosDe.get(r.pregunta_orden) ?? []);
    fotosUsadas.add(r.pregunta_orden);
    const texto = r.transcripcion?.trim() || (boton || esFoto ? null : directo || null);
    if (!r.audio_path && !texto && !boton && susFotos.length === 0) continue;

    const clave = r.clave_kids as string;
    let cap = capitulos.get(item.cap);
    if (!cap) {
      cap = { n: item.cap, titulo: item.cap > 0 ? tituloCapitulo(item.cap, idioma) : null, capsula: item.cap === CAPITULO_CAPSULA, preguntas: [] };
      capitulos.set(item.cap, cap);
    }
    let p = preguntas.get(clave);
    if (!p) {
      p = { clave, texto: item.texto, ...(item.padre ? { padre: item.padre } : {}), entradas: [] };
      preguntas.set(clave, p);
      cap.preguntas.push(p);
    }
    p.entradas.push({
      id: r.id,
      audio: Boolean(r.audio_path),
      duracion: r.duracion_segundos,
      texto,
      transcribiendo: Boolean(r.audio_path) && !r.transcripcion?.trim(),
      boton,
      fotos: susFotos,
      recibidoAt: r.recibido_at,
      correcciones: correcciones.filter((c) => c.respuesta_id === r.id),
    });
  }
  return [...capitulos.values()].sort((a, b) => a.n - b.n);
}

// ── La fila de kids_v2 ───────────────────────────────────────────────────

export type MotivoMarca = "preocupante" | "silencio-8-dias" | "escribio-despues-del-final" | "cerro-sin-respuesta";
export type MarcaKids = { motivo: MotivoMarca | string; detalle?: string | null; at: string };
export type AvanceKids = { capitulo?: number; preguntasPadreAbiertas?: boolean; terminado?: boolean };
export type CambiosPanel = { hora?: string; temasSacados?: TemaKids[]; preguntasPadre?: PreguntaPadre[]; pedido_at: string };

/** Lo que el panel lee de `kids_v2` (`fichaMotor` = `estado->motor->ficha`: null hasta el arranque). */
export type FilaKids = {
  narrador_id: string;
  canal: "A" | "B";
  /** `kids_v2.idioma` ('es-AR' | 'es-ES'); el mismo que `ficha.idioma`. */
  idioma?: string | null;
  ficha: FichaKids;
  fichaMotor: FichaKids | null;
  cambios_panel: CambiosPanel | null;
  cambios_error: string | null;
  avance: AvanceKids | null;
  correcciones: CorreccionKids[] | null;
  termino_at: string | null;
};

/**
 * En qué castellano se le habla al padre de este chico y de qué banco salen
 * sus preguntas: el de la ficha (`kids_v2.ficha.idioma`, la del motor si ya
 * arrancó), si no `kids_v2.idioma`; sin ninguno, es-AR (como el motor sin el campo).
 */
export function idiomaDeFila(fila: Pick<FilaKids, "ficha" | "fichaMotor"> & { idioma?: string | null }): IdiomaKids {
  return idiomaKidsDe(fichaVigente(fila).idioma ?? fila.idioma);
}

/** La ficha que vale: la del motor si ya arrancó; si no, la de la compra. */
export function fichaVigente(fila: Pick<FilaKids, "ficha" | "fichaMotor">): FichaKids {
  return fila.fichaMotor ?? fila.ficha;
}

/** Arrancó = hay estado del motor (CONTRATO: `estado` null hasta el arranque). */
export const arranco = (fila: Pick<FilaKids, "fichaMotor">) => fila.fichaMotor !== null;

export function terminoKids(fila: Pick<FilaKids, "avance" | "termino_at">): boolean {
  return Boolean(fila.termino_at) || fila.avance?.terminado === true;
}

/** En qué capítulo va (0 antes de K1). */
export function capituloActual(fila: Pick<FilaKids, "avance">): number {
  const c = fila.avance?.capitulo;
  return typeof c === "number" && c >= 0 && c <= 5 ? c : 0;
}

/**
 * ¿Se pueden escribir o cambiar las preguntas del padre? Antes del arranque,
 * sí; después, lo que diga `avance.preguntasPadreAbiertas` (false desde que
 * empieza el capítulo 4). Si terminó, no.
 */
export function preguntasAbiertas(fila: Pick<FilaKids, "fichaMotor" | "avance" | "termino_at">): boolean {
  if (terminoKids(fila)) return false;
  if (!arranco(fila)) return true;
  return fila.avance?.preguntasPadreAbiertas !== false;
}

/** Lo que el padre ve en el formulario: lo pendiente si hay, si no lo que vale. */
export function valoresDelPanel(fila: Pick<FilaKids, "ficha" | "fichaMotor" | "cambios_panel">): { hora: string; temasSacados: TemaKids[]; preguntasPadre: PreguntaPadre[] } {
  const f = fichaVigente(fila);
  const p = fila.cambios_panel;
  return {
    hora: p?.hora ?? f.hora,
    temasSacados: p?.temasSacados ?? (f.temasSacados as TemaKids[]),
    preguntasPadre: p?.preguntasPadre ?? f.preguntasPadre,
  };
}

// ── Cambios del panel ────────────────────────────────────────────────────

export type CambioKids = { hora?: string; temasSacados?: TemaKids[]; preguntasPadre?: PreguntaPadre[] };

export type FallaCambioKids = "malFormado" | "hora" | "temas" | "preguntas" | "preguntas-cerradas" | "terminado";

/** Largo máximo de una pregunta del padre (la ficha no lo limita; es para que no entre un texto sin fin). */
export const LARGO_PREGUNTA_PADRE = 400;

/** Lee el cuerpo del panel SIN confiar en el cliente: solo las tres claves, con su forma. */
export function leerCambioKids(body: unknown): { ok: true; cambio: CambioKids } | { ok: false; falla: FallaCambioKids } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, falla: "malFormado" };
  const b = body as Record<string, unknown>;
  const cambio: CambioKids = {};
  if (b.hora !== undefined) {
    if (typeof b.hora !== "string" || !(HORAS_KIDS as readonly string[]).includes(b.hora)) return { ok: false, falla: "hora" };
    cambio.hora = b.hora;
  }
  if (b.temasSacados !== undefined) {
    if (!Array.isArray(b.temasSacados) || b.temasSacados.some((t) => typeof t !== "string" || !(TEMAS_KIDS as readonly string[]).includes(t))) {
      return { ok: false, falla: "temas" };
    }
    // En el orden de la pantalla (COMPRA-3-TEMAS), sin repetidos.
    cambio.temasSacados = TEMAS_KIDS.filter((t) => (b.temasSacados as string[]).includes(t));
  }
  if (b.preguntasPadre !== undefined) {
    if (!Array.isArray(b.preguntasPadre)) return { ok: false, falla: "preguntas" };
    const lista: PreguntaPadre[] = [];
    for (const p of b.preguntasPadre as unknown[]) {
      if (!p || typeof p !== "object") return { ok: false, falla: "preguntas" };
      const { texto, conLinea, quien } = p as Record<string, unknown>;
      if (typeof texto !== "string" || typeof conLinea !== "boolean" || (quien !== undefined && typeof quien !== "string")) return { ok: false, falla: "preguntas" };
      if (texto.trim().length > LARGO_PREGUNTA_PADRE || (typeof quien === "string" && quien.trim().length > LARGO_MAXIMO)) return { ok: false, falla: "preguntas" };
      lista.push({ texto, conLinea, ...(typeof quien === "string" ? { quien } : {}) });
    }
    cambio.preguntasPadre = lista;
  }
  if (cambio.hora === undefined && cambio.temasSacados === undefined && cambio.preguntasPadre === undefined) return { ok: false, falla: "malFormado" };
  return { ok: true, cambio };
}

/**
 * Valida el cambio con las reglas de validarFicha sobre la ficha que vale con
 * lo pendiente encima, y devuelve el `cambios_panel` nuevo: lo pendiente
 * fusionado con el cambio (si cambió la hora y enseguida los temas, van los
 * dos), con las listas completas y normalizadas como las guarda la ficha.
 */
export function fusionarCambioKids(
  fila: Pick<FilaKids, "ficha" | "fichaMotor" | "cambios_panel" | "avance" | "termino_at">,
  cambio: CambioKids,
  ahora: string,
): { ok: true; cambios: CambiosPanel } | { ok: false; falla: FallaCambioKids } {
  if (terminoKids(fila)) return { ok: false, falla: "terminado" };
  if (cambio.preguntasPadre !== undefined && !preguntasAbiertas(fila)) return { ok: false, falla: "preguntas-cerradas" };
  const pendiente = fila.cambios_panel ?? null;
  const { pedido_at: _antes, ...pendienteSinFecha } = pendiente ?? { pedido_at: "" };
  const junto: CambioKids = { ...pendienteSinFecha, ...cambio };
  let validada: FichaKids;
  try {
    validada = validarFichaKids({ ...fichaVigente(fila), ...junto });
  } catch {
    return { ok: false, falla: cambio.preguntasPadre !== undefined ? "preguntas" : cambio.hora !== undefined ? "hora" : "temas" };
  }
  const cambios: CambiosPanel = { pedido_at: ahora };
  if (junto.hora !== undefined) cambios.hora = validada.hora;
  if (junto.temasSacados !== undefined) cambios.temasSacados = validada.temasSacados as TemaKids[];
  if (junto.preguntasPadre !== undefined) cambios.preguntasPadre = validada.preguntasPadre;
  return { ok: true, cambios };
}

/** La pregunta con «¿Quién se la manda?» de entrada: quién se lo regala (README de Kids). */
export function quienDeEntrada(p: PreguntaPadre | undefined, ficha: FichaKids): string {
  return p?.quien ?? normalizarQuienRegala(ficha.quienRegala);
}

// ── Correcciones de nombres ──────────────────────────────────────────────

export type FallaCorreccion = "malFormado" | "vacio" | "no-esta";

/** Lee {respuestaId, dice, es}. `es` puede faltar para quitar. */
export function leerCorreccion(body: unknown, paraQuitar = false): { ok: true; respuestaId: string; dice: string; es: string } | { ok: false; falla: FallaCorreccion } {
  if (!body || typeof body !== "object") return { ok: false, falla: "malFormado" };
  const { respuestaId, dice, es } = body as Record<string, unknown>;
  if (typeof respuestaId !== "string" || !respuestaId || typeof dice !== "string" || (!paraQuitar && typeof es !== "string")) return { ok: false, falla: "malFormado" };
  const d = dice.trim().replace(/\s+/g, " ");
  const e = typeof es === "string" ? es.trim().replace(/\s+/g, " ") : "";
  if (!d || (!paraQuitar && !e)) return { ok: false, falla: "vacio" };
  if (d.length > LARGO_MAXIMO || e.length > LARGO_MAXIMO) return { ok: false, falla: "malFormado" };
  return { ok: true, respuestaId, dice: d, es: e };
}

/** ¿Lo que dice está en la respuesta? (sin mayúsculas). Si no, la corrección no serviría para nada. */
export function diceEstaEn(texto: string | null, dice: string): boolean {
  return Boolean(texto) && (texto as string).toLocaleLowerCase("es").includes(dice.toLocaleLowerCase("es"));
}

/** La lista nueva con la corrección: si ya había una para ese nombre en esa respuesta, la pisa. */
export function conCorreccion(lista: CorreccionKids[], c: CorreccionKids): CorreccionKids[] {
  return [...sinCorreccion(lista, c.respuesta_id, c.dice), c];
}

export function sinCorreccion(lista: CorreccionKids[], respuestaId: string, dice: string): CorreccionKids[] {
  const d = dice.toLocaleLowerCase("es");
  return lista.filter((x) => !(x.respuesta_id === respuestaId && x.dice.toLocaleLowerCase("es") === d));
}

/** ¿La compra lo marcó como Kids? (CONTRATO: `narradores.contexto.modo = "kids"`). Lo que manda es la fila de `kids_v2`. */
export function esKids(n: { contexto?: Record<string, unknown> | null }): boolean {
  return (n.contexto as { modo?: unknown } | null | undefined)?.modo === "kids";
}

// ── El libro escrito (decisión 9 de Naza, 15/10) ─────────────────────────
//
// Cuando la fábrica termina de escribir el libro deja, en el bucket `audios`:
//   {id}/paquete/libro.pdf, {id}/paquete/sobre.pdf y
//   {id}/escritor-kids/listo.json = { at, paginas, sobrePaginas }.
// El padre lo ve en su panel y lo aprueba: eso es `narradores.libro_aprobado_at`
// para Kids (con eso la fábrica entrega y lo manda al impreso).

export const RUTA_LISTO_KIDS = (narradorId: string) => `${narradorId}/escritor-kids/listo.json`;

export const ARCHIVOS_LIBRO_KIDS = { libro: "libro.pdf", sobre: "sobre.pdf" } as const;
export type ArchivoLibroKids = keyof typeof ARCHIVOS_LIBRO_KIDS;

export const rutaArchivoKids = (narradorId: string, archivo: ArchivoLibroKids) => `${narradorId}/paquete/${ARCHIVOS_LIBRO_KIDS[archivo]}`;

export type ListoKids = { at: string; paginas: number | null; sobrePaginas: number | null };

/** Lo que dice listo.json, o null si no es un objeto con `at`. */
export function leerListoKids(texto: string): ListoKids | null {
  try {
    const j = JSON.parse(texto) as Record<string, unknown> | null;
    if (!j || typeof j !== "object" || Array.isArray(j) || typeof j.at !== "string" || !j.at) return null;
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
    return { at: j.at, paginas: n(j.paginas), sobrePaginas: n(j.sobrePaginas) };
  } catch {
    return null;
  }
}

/**
 * El libro para el panel: null mientras no esté escrito (no hay listo.json).
 * `impreso` = el pedido trae libro impreso (al aprobar, se manda a imprimir).
 */
export type LibroKids = { listo: ListoKids; aprobadoAt: string | null; impreso: boolean };

/**
 * ¿Lo que se compró trae el libro impreso? Mira `pedidos.extras` con la forma de
 * la biografía (`impreso`, `copias`): hoy Kids guarda `impreso: null` y
 * `copias: 0`. Cuenta un pedido pagado (no 'pendiente') con `impreso` no null o
 * con `copias > 0`, sea el de la compra o uno de extras de después.
 */
export function kidsConImpreso(pedidos: { estado?: string | null; extras?: unknown }[]): boolean {
  return pedidos.some((p) => {
    if (p.estado === "pendiente") return false;
    const e = p.extras as { impreso?: unknown; copias?: unknown } | null | undefined;
    if (!e || typeof e !== "object") return false;
    return (e.impreso !== null && e.impreso !== undefined) || (typeof e.copias === "number" && e.copias > 0);
  });
}

export function esArchivoLibroKids(x: unknown): x is ArchivoLibroKids {
  return x === "libro" || x === "sobre";
}
