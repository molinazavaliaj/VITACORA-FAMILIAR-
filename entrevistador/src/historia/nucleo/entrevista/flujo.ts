// El flujo de la entrevista de historia (docs/historia/banco.md, "Reglas del
// flujo"): qué cuenta como "no" corto, cuál es la próxima cosa para mandar y
// qué acuse va después. Copia de src/v3/entrevista/flujo.ts sin lo que era de
// la vida entera: el bloque final 15 y su orden (LE9, LE8, FO1), las
// preguntas de la familia (M15), la ronda extra, la segunda oportunidad
// (M33), AMH desde AM0, M1 en las que abren tema y en el bloque 11, el acuse
// del cierre (M24) y las dudas de la ficha (DD1/DD2). Lo que define el orden
// sale del banco del narrador: la foto va después de la última pregunta de su
// tema y las de quien regala antes de la de clase `cierre`. Todo puro, sin
// I/O: el entrevistador guarda el estado y llama a estas funciones.

import { bancoHistoria, condicionesDe, mensajePorId, preguntaPorId, textosDe, type Boton, type CondicionSimple, type PreguntaEntrevista, type ValeBoton } from './banco.js';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';
import { habilitaLasQueDependen, interpretar, PREGUNTA_COMUN, respuestaDeBoton, valeBoton, type Interpretacion, type PreguntaParaInterpretar } from './respuesta.js';
import type { TemaHistoria } from './temas.js';

/** Respuesta a una pregunta: el texto (transcripción) o lo que dijo, incluido "paso". */
export type Respuesta = string;
/** Respuestas por clave (ID del banco, FOTO-H, PR-H1…, RP~X). Solo está lo que se mandó y se contestó. */
export type Respuestas = ReadonlyMap<string, Respuesta>;

export { normalizar, PALABRAS_NO_CORTO } from './respuesta.js';

// ---------------------------------------------------------------- claves que no son preguntas del banco

/** El pedido de fotos (banco.md, regla 6): un mensaje que espera respuesta. Lo que contesta se guarda con esta clave. */
export const FOTO = 'FOTO-H';
/** La despedida, después de la de clase `cierre` (HC10), sin acuse. */
export const FIN = 'FIN-H';
/** Las preguntas de quien regala (banco.md, regla 7): la primera, la segunda y la tercera que dejó escritas. */
export const PROPIAS: readonly string[] = ['PR-H1', 'PR-H2', 'PR-H3'];

/**
 * Las preguntas sumadas desde el panel (banco.md, regla 7; Naza, 23/10): PF-H1 presenta la primera y PF-H2 cada
 * una de las siguientes. Lo que contesta se guarda con "F:<id de la fila de preguntas>", como la familia en V3.
 */
export const MENSAJE_PANEL_PRIMERA = 'PF-H1';
export const MENSAJE_PANEL_SIGUIENTE = 'PF-H2';
export const PREFIJO_PANEL = 'F:';

export function clavePanel(id: string): string {
  return `${PREFIJO_PANEL}${id}`;
}

/** Lo que contesta a una repregunta del cazador sobre la respuesta X se guarda como "RP~X". */
export const PREFIJO_REPREGUNTA = 'RP~';

export function claveRepregunta(origen: string): string {
  return `${PREFIJO_REPREGUNTA}${origen}`;
}

/** Si la clave es "RP~X", X; si no, undefined. */
export function deRepregunta(clave: string): string | undefined {
  return clave.startsWith(PREFIJO_REPREGUNTA) ? clave.slice(PREFIJO_REPREGUNTA.length) : undefined;
}

/**
 * El único botón de una repregunta del cazador: [Ya lo conté todo], que vale
 * "no" (V3, Naza, 01/10). Va acá y no en el banco porque la repregunta no es
 * una fila del banco; en otro idioma sale de su md ("## Repregunta del cazador").
 */
export const BOTON_YA_LO_CONTE: Boton = { texto: 'Ya lo conté todo', vale: 'no' };

/** [Ya lo conté todo] en el idioma de la entrevista. */
export function botonRepregunta(idioma: Idioma = IDIOMA_POR_DEFECTO): Boton {
  return idioma === 'es-AR' ? BOTON_YA_LO_CONTE : { texto: textosDe(idioma).repregunta.boton, vale: 'no' };
}

/**
 * El botón de FOTO-H, [No tengo fotos], que vale "no" (banco.md, regla 6). En
 * es-AR el texto sale de la columna "Cuándo" de FOTO-H en banco.md (`botón [No
 * tengo fotos]`); en es-ES y ca, de la sección "## Botones" de su md (Naza,
 * 23/10). Sin texto aprobado, undefined (la foto va sin botón y sin M31) en
 * lugar de inventarlo.
 */
export function botonFoto(idioma: Idioma = IDIOMA_POR_DEFECTO): Boton | undefined {
  const texto = idioma === 'es-AR' ? /botón \[([^\]]+)\]/.exec(mensajePorId(FOTO)?.cuando ?? '')?.[1] : textosDe(idioma).botones[FOTO]?.[0];
  return texto ? { texto, vale: 'no' } : undefined;
}

/**
 * Una repregunta del cazador de escenas (cazador.ts): sobre la respuesta
 * `origen` (un ID del banco) del bloque `bloque`, con la `cita` textual y la
 * `pregunta` que escribió el modelo; `tema` es el momento que pide, para que
 * no se repita. Lo que contesta se guarda con `clave` ("RP~<origen>").
 */
export type Repregunta = { clave: string; origen: string; bloque: number; cita: string; pregunta: string; tema: string };

/** Lo que hace falta de una pregunta para interpretar su respuesta y elegir el acuse. */
export type PreguntaDeClave = PreguntaParaInterpretar & Pick<PreguntaEntrevista, 'bloque'>;

/**
 * La pregunta detrás de una clave de `respuestas`: la del banco; FOTO-H (con
 * su botón, para que [No tengo fotos] valga "no"); PR-H1…PR-H3, una común;
 * "RP~X", una común del bloque de X con el botón [Ya lo conté todo]. Una clave
 * desconocida da undefined.
 */
export function preguntaDeClave(clave: string, idioma: Idioma = IDIOMA_POR_DEFECTO): PreguntaDeClave | undefined {
  const delBanco = preguntaPorId(clave, idioma);
  if (delBanco) return delBanco;
  if (clave === FOTO) {
    const boton = botonFoto(idioma);
    return { id: FOTO, bloque: 0, clase: 'historia', sensible: false, texto: mensajePorId(FOTO, idioma)?.texto, ...(boton ? { botones: [boton] } : {}) };
  }
  if (PROPIAS.includes(clave) || clave.startsWith(PREFIJO_PANEL)) return { id: clave, bloque: 0, clase: 'historia', sensible: false };
  const origen = deRepregunta(clave);
  if (origen !== undefined) return { id: clave, bloque: preguntaPorId(origen)?.bloque ?? 0, clase: 'historia', sensible: false, botones: [botonRepregunta(idioma)] };
  return undefined;
}

/** Los botones de lo que está esperando respuesta: [No tengo fotos] en FOTO-H, [Ya lo conté todo] en una repregunta. */
export function botonesDeClave(clave: string, idioma: Idioma = IDIOMA_POR_DEFECTO): readonly Boton[] | undefined {
  return preguntaDeClave(clave, idioma)?.botones;
}

/** La pregunta de esa clave; si no se conoce, una común. */
function preguntaDe(id: string, idioma: Idioma): PreguntaParaInterpretar {
  return preguntaDeClave(id, idioma) ?? { ...PREGUNTA_COMUN, id };
}

/** ¿Dijo "paso"? Sin pregunta, se toma como una común. */
export function esPaso(respuesta: Respuesta, pregunta: PreguntaParaInterpretar = PREGUNTA_COMUN, idioma: Idioma = IDIOMA_POR_DEFECTO): boolean {
  return interpretar(pregunta, respuesta, idioma) === 'paso';
}

/** ¿Fue un "no" corto (o tocó un botón de "No")? Hasta 15 palabras en una común y hasta 40 en el cierre y las sensibles. */
export function esNoCorto(respuesta: Respuesta, pregunta: PreguntaParaInterpretar = PREGUNTA_COMUN, idioma: Idioma = IDIOMA_POR_DEFECTO): boolean {
  return interpretar(pregunta, respuesta, idioma) === 'no';
}

/** Qué dijo en X (undefined si X no se contestó). */
export function interpretacionDe(respuestas: Respuestas, id: string, idioma: Idioma = IDIOMA_POR_DEFECTO): Interpretacion | undefined {
  const r = respuestas.get(id);
  return r === undefined ? undefined : interpretar(preguntaDe(id, idioma), r, idioma);
}

/** X se contestó con un "no" corto o un botón de "No" (FIN-H usa «sino:FOTO-H: … ‖ …»). */
export function respondioNo(respuestas: Respuestas, id: string, idioma: Idioma = IDIOMA_POR_DEFECTO): boolean {
  return interpretacionDe(respuestas, id, idioma) === 'no';
}

/** X se contestó contando algo: no un "no", un "paso", un olvido ni nada. */
export function contoAlgo(respuestas: Respuestas, id: string, idioma: Idioma = IDIOMA_POR_DEFECTO): boolean {
  const i = interpretacionDe(respuestas, id, idioma);
  return i === 'conto' || i === 'ya-conto' || i === 'olvido-a-medias' || i === 'no-ahondar';
}

/**
 * ¿Se manda la pregunta, según su "Depende de"? Sin condiciones, sí (hoy
 * todas las de historia). Igual que en V3: alcanza un término (OR) y un
 * término con " y " pide todas sus condiciones.
 */
export function cumple(pregunta: Pick<PreguntaEntrevista, 'depende'>, respuestas: Respuestas, idioma: Idioma = IDIOMA_POR_DEFECTO): boolean {
  if (pregunta.depende.length === 0) return true;
  const simple = (c: CondicionSimple) => {
    const i = interpretacionDe(respuestas, c.de, idioma);
    if (i === undefined) return false;
    return c.tipo === 'si' ? habilitaLasQueDependen(i) : c.tipo === 'sino' ? i === 'no' : i === 'paso';
  };
  return pregunta.depende.some((c) => condicionesDe(c).every(simple));
}

// ---------------------------------------------------------------- orden

export type EstadoEntrevista = {
  /** Lo contestado (incluye "paso"), en el orden en que llegó: IDs del banco, FOTO-H, PR-H1…, RP~X. */
  respuestas: Respuestas;
  /**
   * Lo que se mandó y ya no espera respuesta: FIN-H, y FOTO-H si pasaron las
   * 24 horas sin foto ni audio (lo anota el entrevistador).
   */
  enviados?: ReadonlySet<string>;
  /** El tema del narrador (docs/historia/temas.md). */
  tema: TemaHistoria;
  /** ¿Eligió su historia en TEMA-ABIERTO? Entonces va HC1-A en lugar de HC1 (banco.md, reglas 2 y 4). */
  temaAbierto?: boolean;
  /** Las preguntas que dejó escritas quien regala, en el orden de la compra (hasta 3). Van tal cual, sin revisión. */
  propias?: readonly string[];
  /** Las preguntas sumadas desde el panel, en el orden en que se sumaron. Van tal cual, sin revisión. */
  panel?: readonly PreguntaPanel[];
  /** La cola de repreguntas del cazador: las que entraron, en orden; las que ya tienen respuesta ("RP~X") no salen más. */
  repreguntas?: readonly Repregunta[];
  /** El idioma de la entrevista. Sin idioma, es-AR. */
  idioma?: Idioma;
};

/** Una pregunta sumada desde el panel (tabla `preguntas`, tipo 'familia'). */
export type PreguntaPanel = { id: string; texto: string };

export type Siguiente =
  /** Mandar la pregunta; si `conM1`, con M1 abajo en línea aparte y en cursiva. Siempre espera respuesta. */
  | { tipo: 'pregunta'; pregunta: PreguntaEntrevista; conM1: boolean }
  /**
   * Mandar FOTO-H (banco.md, regla 6). No corre el reloj de minutos: se
   * espera una foto o un audio hasta 24 horas (eso lo hace el entrevistador).
   * Con `botones`, [No tengo fotos], y `ayudaBotones`: M31 debajo (es el
   * primer mensaje del banco con botones).
   */
  | { tipo: 'foto'; clave: typeof FOTO; esperaFoto: true; botones?: readonly Boton[]; ayudaBotones?: true }
  /** Mandar el mensaje `clave` (PR-H1…) con {{pregunta}} = `pregunta`, tal cual la escribió quien regala; lo que contesta va con `clave`. */
  | { tipo: 'propia'; clave: string; pregunta: string }
  /**
   * Una pregunta sumada desde el panel: el mensaje `mensaje` (PF-H1 la primera, PF-H2 las siguientes) con
   * {{pregunta}} = `pregunta`; lo que contesta va con `clave` ("F:<id>").
   */
  | { tipo: 'panel'; clave: string; pregunta: string; mensaje: typeof MENSAJE_PANEL_PRIMERA | typeof MENSAJE_PANEL_SIGUIENTE }
  /** Una repregunta del cazador: `mensajeRepregunta` (cazador.ts) con `botones` ([Ya lo conté todo]); lo que contesta va con `repregunta.clave`. */
  | { tipo: 'repregunta'; repregunta: Repregunta; botones: readonly Boton[] }
  /** Mandar FIN-H (sin acuse delante) y anotarlo en `enviados`. */
  | { tipo: 'fin'; clave: typeof FIN }
  /** No queda nada por mandar. */
  | { tipo: 'terminada' };

/** Hasta cuántas preguntas deja escribir la compra a quien regala. */
export const MAX_PROPIAS = PROPIAS.length;

/** M1 va debajo de las primeras preguntas que se mandan: estas (banco.md, regla 5: HC1 o HC1-A, HC2 y HC3). */
export const M1_PRIMERAS = 3;

/** ¿Va M1 debajo? Solo en preguntas de clase `historia` y solo mientras se contestaron menos de 3 del banco. */
export function llevaM1(p: Pick<PreguntaEntrevista, 'id' | 'clase'>, respuestas: Respuestas, banco: readonly PreguntaEntrevista[]): boolean {
  if (p.clase !== 'historia') return false;
  const yaContestadas = banco.filter((q) => q.clase === 'historia' && respuestas.has(q.id)).length;
  return yaContestadas < M1_PRIMERAS;
}

/** Qué vale tocar un botón: la respuesta queda cerrada así y sigue el flujo. Historia no tiene botones de "Sí" (no hay M30). */
export type AlTocarBoton = { vale: ValeBoton; respuesta: string };

/** Tocó un botón: la respuesta que se guarda (la marca del botón; si después manda audio, se suma atrás con `sumarAudio`). */
export function alTocarBoton(pregunta: Pick<PreguntaParaInterpretar, 'botones'>, texto: string): AlTocarBoton {
  return { vale: valeBoton(pregunta, texto), respuesta: respuestaDeBoton(texto) };
}

/** El banco del narrador, si no se pasa otro. */
function bancoDelEstado(e: EstadoEntrevista): readonly PreguntaEntrevista[] {
  return bancoHistoria(e.tema, e.idioma, { temaAbierto: e.temaAbierto }).preguntas;
}

/**
 * La próxima cosa para mandar (banco.md, regla 3): las preguntas del banco
 * del narrador en orden, salteando lo hecho y lo que no cumple; FOTO-H justo
 * después de la última pregunta de su tema (las que no son comunes ni
 * variantes); las de quien regala y después las sumadas desde el panel antes de la de clase `cierre`; y al final
 * FIN-H. Algo está hecho si tiene respuesta o figura en `enviados`. Antes de
 * todo eso, una repregunta del cazador, si toca.
 */
export function siguientePregunta(e: EstadoEntrevista, banco: readonly PreguntaEntrevista[] = bancoDelEstado(e)): Siguiente {
  const idioma = e.idioma ?? IDIOMA_POR_DEFECTO;
  const delBanco = siguienteDelBanco(e, banco);
  const repregunta = repreguntaLista(e, delBanco);
  return repregunta ? { tipo: 'repregunta', repregunta, botones: [botonRepregunta(idioma)] } : delBanco;
}

/** Cuántas respuestas del banco tienen que pasar después de la de origen para mandar su repregunta (V3, Naza, 01/10). */
export const RESPUESTAS_ANTES_DE_REPREGUNTAR = 3;

/**
 * ¿Sale una repregunta de la cola? La primera pendiente que ya tiene 3 o más
 * respuestas del banco después de la de origen (FOTO-H, las de quien regala y
 * las repreguntas no cuentan), si lo último que contestó no fue una
 * repregunta: nunca dos seguidas. Antes de las de quien regala o del cierre
 * salen todas las que queden. Después del cierre no sale ninguna: FIN-H va
 * directo después de HC10 (banco.md, regla 8).
 */
function repreguntaLista(e: EstadoEntrevista, delBanco: Siguiente): Repregunta | undefined {
  const pendientes = (e.repreguntas ?? []).filter((r) => !e.respuestas.has(r.clave));
  if (pendientes.length === 0) return undefined;
  if (delBanco.tipo === 'fin' || delBanco.tipo === 'terminada') return undefined;
  const entraAlFinal = delBanco.tipo === 'propia' || delBanco.tipo === 'panel' || (delBanco.tipo === 'pregunta' && delBanco.pregunta.clase === 'cierre');
  if (entraAlFinal) return pendientes[0];
  const claves = [...e.respuestas.keys()];
  const ultima = claves.at(-1);
  if (ultima !== undefined && deRepregunta(ultima) !== undefined) return undefined;
  return pendientes.find((r) => {
    const desde = claves.indexOf(r.origen);
    if (desde < 0) return false;
    return claves.slice(desde + 1).filter((k) => preguntaPorId(k) !== undefined).length >= RESPUESTAS_ANTES_DE_REPREGUNTAR;
  });
}

/** El índice del último que cumple, o -1 (findLastIndex es de ES2023 y fabrica compila a ES2022). */
function ultimoIndice<T>(xs: readonly T[], f: (x: T) => boolean): number {
  for (let i = xs.length - 1; i >= 0; i--) if (f(xs[i])) return i;
  return -1;
}

/** Lo que sigue del banco, la foto, las de quien regala y el final, sin las repreguntas. */
function siguienteDelBanco(e: EstadoEntrevista, banco: readonly PreguntaEntrevista[]): Siguiente {
  const enviados = e.enviados ?? new Set<string>();
  const idioma = e.idioma ?? IDIOMA_POR_DEFECTO;
  const hecha = (clave: string) => e.respuestas.has(clave) || enviados.has(clave);
  const propias = e.propias ?? [];
  if (propias.length > MAX_PROPIAS) throw new Error(`historia: quien regala deja hasta ${MAX_PROPIAS} preguntas y llegaron ${propias.length}`);
  const ultimaDelTema = ultimoIndice(banco, (p) => p.tema !== 'comun' && !p.reemplaza);
  const cierre = ultimoIndice(banco, (p) => p.clase === 'cierre');
  // Las de quien regala van antes del cierre: si el cierre ya se contestó (o ya salió FIN-H), no van más.
  const cierreHecho = hecha(FIN) || (cierre >= 0 && hecha(banco[cierre].id));
  const propia = cierreHecho ? undefined : propias.map((pregunta, i) => ({ clave: PROPIAS[i], pregunta })).find((x) => !hecha(x.clave));
  // Las sumadas desde el panel van después de las de quien regala, también antes del cierre.
  const delPanel = (e.panel ?? []).map((p) => ({ clave: clavePanel(p.id), pregunta: p.texto }));
  const iPanel = cierreHecho ? -1 : delPanel.findIndex((x) => !hecha(x.clave));
  const panel: Siguiente | undefined = iPanel < 0 ? undefined : {
    tipo: 'panel', ...delPanel[iPanel],
    mensaje: delPanel.slice(0, iPanel).some((x) => hecha(x.clave)) ? MENSAJE_PANEL_SIGUIENTE : MENSAJE_PANEL_PRIMERA,
  };
  const antesDelCierre: Siguiente | undefined = propia ? { tipo: 'propia', ...propia } : panel;
  const foto = (): Siguiente => {
    const boton = botonFoto(idioma);
    return { tipo: 'foto', clave: FOTO, esperaFoto: true, ...(boton ? { botones: [boton], ayudaBotones: true as const } : {}) };
  };

  for (const [i, p] of banco.entries()) {
    if (ultimaDelTema >= 0 && i > ultimaDelTema && !hecha(FOTO)) return foto();
    if (i === cierre && antesDelCierre) return antesDelCierre;
    if (!hecha(p.id) && cumple(p, e.respuestas, idioma)) return { tipo: 'pregunta', pregunta: p, conM1: llevaM1(p, e.respuestas, banco) };
  }
  if (ultimaDelTema >= 0 && !hecha(FOTO)) return foto();
  if (antesDelCierre) return antesDelCierre;
  return hecha(FIN) ? { tipo: 'terminada' } : { tipo: 'fin', clave: FIN };
}

// ---------------------------------------------------------------- acuses

/**
 * Las familias de acuse (banco.md, regla 8). Rotan M3 (8), M4 (4), M25 (3),
 * M27 (3), M32 (2) y M28.4 (M28.4 y M28.5); M28 tiene uno solo en uso
 * (M28.1); M21, M26 y M29 son uno. M24 (el acuse del cierre de V3) no se usa:
 * después de HC10 va FIN-H directo.
 */
export type FamiliaAcuse = 'M3' | 'M4' | 'M21' | 'M25' | 'M26' | 'M27' | 'M28' | 'M28.4' | 'M29' | 'M32';

/** M29 va una sola vez, al tercer olvido seguido. */
export const OLVIDOS_PARA_M29 = 3;

/** ¿Después de esta clave puede ir un acuse de olvido? (no después del cierre, que no lleva acuse). */
function llevaAcuseDeOlvido(id: string): boolean {
  return preguntaPorId(id)?.clase !== 'cierre';
}

/**
 * ¿Este olvido lleva M29? Solo el primero que llega con 3 o más olvidos
 * seguidos y que lleva acuse; después, nunca más en la entrevista. Se recorren
 * las respuestas anteriores en el orden en que llegaron.
 */
function esElOlvidoDeM29(pregunta: Pick<PreguntaEntrevista, 'id'>, anteriores: Respuestas, idioma: Idioma): boolean {
  let seguidos = 0;
  let usado = false;
  for (const [id, r] of anteriores) {
    if (id === pregunta.id) continue;
    // Lo que contesta a una repregunta no suma ni corta la cuenta (V3, Naza, 01/10).
    if (deRepregunta(id) !== undefined) continue;
    const i = interpretar(preguntaDe(id, idioma), r, idioma);
    // El olvido a medias no suma ni corta la cuenta.
    if (i === 'olvido-a-medias') continue;
    if (i !== 'olvido') {
      seguidos = 0;
      continue;
    }
    seguidos++;
    if (!usado && seguidos >= OLVIDOS_PARA_M29 && llevaAcuseDeOlvido(id)) usado = true;
  }
  return !usado && seguidos + 1 >= OLVIDOS_PARA_M29;
}

/**
 * Qué acuse va después de contestar (banco.md, regla 8, que sigue a V3).
 * Después de la de clase `cierre`, nada: va FIN-H directo. Si no, según lo
 * que dijo (`interpretar`):
 *   - "no" corto o botón de "No", y "ya te lo conté" → M25;
 *   - "paso" → M27 en una sensible, M21 en una común;
 *   - olvido → M28 (M28.1), o M29 al tercero seguido, una sola vez;
 *   - olvido a medias → M28.4; se negó pero siguió contando → M32;
 *   - contó algo → M4 en una sensible, M3 en las demás.
 * Lo que contesta a una repregunta lleva su acuse (`acuseDeRepregunta`). Si
 * M3 cambia por lo que sigue (M26 delante de una sensible o del cierre):
 * `acuseDeTurno` en mensajes.ts.
 */
export function mensajesDespues(
  pregunta: Pick<PreguntaEntrevista, 'id' | 'clase' | 'sensible'> & Pick<PreguntaParaInterpretar, 'botones'>,
  respuesta: Respuesta,
  anteriores: Respuestas = new Map(),
  idioma: Idioma = IDIOMA_POR_DEFECTO,
): FamiliaAcuse[] {
  if (pregunta.clase === 'cierre') return [];
  const dijo = interpretar(pregunta, respuesta, idioma);
  if (deRepregunta(pregunta.id) !== undefined) return acuseDeRepregunta(dijo);
  if (dijo === 'no' || dijo === 'ya-conto') return ['M25'];
  if (dijo === 'paso') return [pregunta.sensible ? 'M27' : 'M21'];
  if (dijo === 'olvido') return [esElOlvidoDeM29(pregunta, anteriores, idioma) ? 'M29' : 'M28'];
  if (dijo === 'olvido-a-medias') return ['M28.4'];
  if (dijo === 'no-ahondar') return ['M32'];
  return [pregunta.sensible ? 'M4' : 'M3'];
}

/**
 * El acuse de lo que contesta a una repregunta del cazador (V3, Naza, 01/10):
 * contó → M3 (que con `acuseAntesDe` pasa a M26 delante del cierre o de una
 * sensible); [Ya lo conté todo], un "no" corto o "ya te lo conté" → M25;
 * olvido → M28.1, nunca M29; "paso" → M21.
 */
function acuseDeRepregunta(dijo: Interpretacion): FamiliaAcuse[] {
  if (dijo === 'no' || dijo === 'ya-conto') return ['M25'];
  if (dijo === 'paso') return ['M21'];
  if (dijo === 'olvido') return ['M28'];
  if (dijo === 'olvido-a-medias') return ['M28.4'];
  if (dijo === 'no-ahondar') return ['M32'];
  return ['M3'];
}

/** Las familias que rotan y cuántos tienen (los que hay en banco.md). */
export const ROTAN = { M3: 8, M4: 4, M25: 3, M27: 3, M32: 2, 'M28.4': 2 } as const;

/** El olvido a medias rota entre estos dos: nunca dos "Con ese pedacito" seguidos. */
export const OLVIDO_A_MEDIAS = ['M28.4', 'M28.5'] as const;

/** El acuse de turno de una familia que rota: M3 tiene 8 (M3.1…M3.8), M4 tiene 4, M25 y M27 tienen 3; M28.4 da M28.4 o M28.5. */
export function acuseRotado(familia: keyof typeof ROTAN, n: number): string {
  const total = ROTAN[familia];
  const i = ((n % total) + total) % total;
  return familia === 'M28.4' ? OLVIDO_A_MEDIAS[i] : `${familia}.${i + 1}`;
}
