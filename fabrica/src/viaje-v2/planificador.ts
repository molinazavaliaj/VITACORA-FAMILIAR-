// El planificador de la entrevista de viaje: con el reloj y con lo que manda
// la persona, decide qué sale y cuándo (flujo-vigente.md, banco.md). Es el
// que va a correr el bot de WhatsApp con un tick por minuto, guardando el
// estado en la base (jsonb). Por eso es:
//   · PURO: sin I/O, sin Date.now, sin setTimeout. La hora entra siempre como
//     parámetro (`ahora`).
//   · SERIALIZABLE: el estado es JSON puro (fechas como ISO). JSON.parse(
//     JSON.stringify(estado)) es el mismo estado.
//   · RE-ENTRANTE: lo que ya salió queda anotado en el estado; llamar dos
//     veces a queToca con el mismo `ahora` no repite nada.
//
// La API (todas devuelven un `Paso`: el estado nuevo, lo que hay que mandar,
// los avisos a los socios y notas para leer):
//   · iniciar(compra, ahora): la persona dijo SÍ a BIEN-1 (o BIEN-1R). Sale
//     BIEN-2 y enseguida AS1; arma el calendario previo (todas las de antes
//     de salir pendientes) y marca lo del día de salida que ya pasó.
//   · alEntrar(compra, estado, entradas, ahora): llegó algo de la persona
//     (audio, texto, foto, botón). Se suma al GRUPO abierto: la reacción sale
//     cuando el grupo se cierra, a los SILENCIO_GRUPO_MS de silencio (o antes,
//     si hay que mandar otra cosa: la pregunta nueva nunca le pasa por encima
//     a la respuesta de la anterior). Antes de sumar, corre queToca(ahora):
//     si el grupo anterior ya tenía que cerrarse, sus reacciones salen acá.
//   · queToca(compra, estado, ahora): lo que toca a esta hora. Cierra el
//     grupo, arma el calendario definitivo (en `armarEn`, como el
//     simulador), larga la cola de salida, REC1/REC1-U, lo programado, AL1,
//     el reloj del álbum, los avisos de álbum sin fotos y el cierre solo.
//   · proximaAccion(estado): cuándo hay que volver a llamar a queToca (ISO),
//     o null si ya no queda nada. El bot puede llamar cada minuto igual.
//   · cerrarAlbum(compra, estado, ahora): los socios cierran un álbum con
//     cero fotos (el script del paso 7).
//   · reubicar(estado, compraNueva, ahora): cambió el país del viaje
//     (zonaViaje). Cada clave pendiente conserva sus ids; solo cambian
//     instante, fecha y hora (con la franja 23-8). Queda el historial.
//
// Reglas propias del planificador (las que el resto del código no tenía):
//   · Respuesta tardía (Naza, 10/10): lo que llega cuenta para la ÚLTIMA
//     pregunta enviada (la que estaba cuando arrancó el grupo).
//   · Grupo: todo lo que llega seguido (menos de 3' entre uno y otro) es UNA
//     respuesta, con una sola reacción. Con algún audio bueno, cuenta como
//     audio; si todo lo que dice es "paso", es "paso"; si solo escribió, es
//     texto; si solo hay fotos, es una respuesta de fotos (A5: ni ACA2 ni
//     ACN3). Las fotos que acompañan a un audio o un texto van a
//     `fotosSueltas`; con el álbum abierto, todo va al álbum.
//   · Una foto (o varias) cuando la última pregunta ya está contestada es
//     una foto suelta: ❤️ sobre la primera, y a `fotosSueltas`.
//   · Algo más (audio o texto) cuando la última pregunta ya está contestada:
//     se anota como respuesta de esa pregunta (el escritor lee todo), sin
//     acuse. Un "paso" a destiempo no hace nada.
//   · audioMal (audioMalo): la descarga falló, o la transcripción vino null o
//     vacía. Un grupo con solo audios malos (y quizás fotos) → COR y la
//     pregunta sigue abierta.
//   · Álbum con cero fotos (Naza, 10/10): aviso a los socios a las 5 horas de
//     AL1, otra vez a las 48 horas del aviso, y a los 7 días se cierra solo
//     con DES (respetando la franja: si cae de noche, a las 10:00).
//   · Lo programado que se atrasa (el bot estuvo caído) no sale de noche
//     (23-8 en su zona): espera a las 8. Sale si el atraso, sin contar las
//     horas de la franja, no pasa de TOLERANCIA_ATRASO_MS; si pasa, queda
//     vencido y no sale. CA1 no vence nunca: sin CA1 no hay álbum ni
//     despedida (revisión 10/10).
//   · Una entrada con un idMensaje que ya está en el grupo o en el álbum es
//     un reenvío del webhook: no se suma otra vez.

import { HORA_ALBUM_TRAS_FRANJA, iniciarAlbum, pasoAlbum, type EventoAlbum } from './album.js';
import {
  armarCalendario,
  CADENA_ANTES,
  HORA_MANANA,
  HORA_MEDIODIA,
  momentoAL1,
  momentoDeLaSiguiente,
  momentoRecordatorio,
  momentoUC1,
  quedaAL1EseDia,
  quedaNocheEseDia,
  quedaOtraEseDia,
  siguienteDeLaCadena,
  validarCompra,
  type Calendario,
  type IdAntes,
  type Programado,
  type TipoProgramado,
} from './calendario.js';
import { anotarEnvio, anotarRespuesta, contestado, nocheAnterior, nochesSinContestar, nuevoEstado, pendientesParaElViaje, type Envio, type Estado } from './estado.js';
import { aInstante, aLocal, diasEntre, FRANJA_DESDE, FRANJA_HASTA, respetarFranja, respetarFranjas, sumarDias } from './horas.js';
import { idiomaDe } from './idioma.js';
import { alDecirSi, mensajeAlbum, momentoDeLaReaccion, preguntaProgramada, reaccion, recordatorioAntes, type Respuesta } from './mensajes.js';
import { entender } from './palabras.js';
import { HORA_NOCHE_POR_DEFECTO, type Compra, type Mensaje, type Zona } from './tipos.js';

// ── Constantes ───────────────────────────────────────────────────────────────

/** El grupo de respuesta se cierra a los 3 minutos sin que llegue nada. */
export const SILENCIO_GRUPO_MS = 3 * 60_000;
/** Lo programado que se atrasa más que esto (bot caído) ya no sale: queda vencido. */
export const TOLERANCIA_ATRASO_MS = 2 * 3_600_000;
/** Álbum con cero fotos: el aviso a los socios se repite a las 48 horas (Naza, 10/10). */
export const REPETIR_AVISO_ALBUM_MS = 48 * 3_600_000;
/** Álbum con cero fotos: a los 7 días del aviso se cierra solo, con DES (Naza, 10/10). */
export const CERRAR_ALBUM_SOLO_MS = 7 * 86_400_000;

export type Opciones = {
  /** Para pruebas: otro silencio para cerrar el grupo. Por defecto, SILENCIO_GRUPO_MS. */
  silencioMs?: number;
};

// ── Tipos ────────────────────────────────────────────────────────────────────

/** Lo que manda la persona. `idMensaje`: el id de WhatsApp (para la ❤️ y para encontrarlo después). */
export type Entrada =
  /** `transcripcion`: null si no se pudo transcribir. `descargaFallo`: no se pudo bajar el audio. */
  | { tipo: 'audio'; idMensaje: string; transcripcion: string | null; descargaFallo?: boolean }
  | { tipo: 'texto'; idMensaje: string; texto: string }
  /**
   * `reenviaA`: si el bot reconoce que es una foto que ya estaba en el álbum
   * (la cita, o es el mismo archivo), su id: con AL3, es una de las que saca.
   * Si no, cuenta como foto nueva.
   */
  | { tipo: 'foto'; idMensaje: string; reenviaA?: string }
  /** Un botón de una plantilla: vale como texto. */
  | { tipo: 'boton'; idMensaje: string; texto: string };

export type EntradaGuardada = Entrada & { /** ISO. */ en: string };

/** Un audio que llegó mal: no se pudo bajar, o la transcripción vino null o vacía. */
export function audioMalo(e: Entrada): boolean {
  return e.tipo === 'audio' && (e.descargaFallo === true || e.transcripcion === null || e.transcripcion.trim() === '');
}

export type Origen = 'arranque' | 'cadena' | 'reaccion' | 'programado' | 'recordatorio' | 'album-reloj' | 'album-reaccion' | 'naza';

/**
 * Un mensaje a mandar. `tipo`: 'pregunta' (trae una pregunta: programadas,
 * la cadena, AL1, AL2, AL3), 'recordatorio' (REC1, REC1-U), 'texto' (acuses,
 * BIEN-2, TXT, COR, PAS, DES) o 'reaccion' (la ❤️ sobre `aMensaje`: no lleva
 * texto ni ids). El bot elige con esto la plantilla si la ventana de 24 h
 * está cerrada.
 */
export type Saliente = {
  /** Único dentro del viaje ("s12"): para no mandar dos veces. */
  id: string;
  tipo: 'texto' | 'pregunta' | 'recordatorio' | 'reaccion';
  /** ISO: cuándo tenía que salir. */
  desde: string;
  /** En la hora de qué zona se pensó (casa o viaje). */
  zona: Zona;
  origen: Origen;
  /** Sale por reloj (no como respuesta a algo que mandó la persona). */
  iniciativa: boolean;
  ids: string[];
  texto: string;
  emoji?: '❤️';
  aMensaje?: string | null;
  /** La clave de la pregunta que trae ("AS2", "D3-noche", "AL1"), o la de la colgada en un recordatorio. */
  clave?: string;
  /** Si contesta a algo que mandó la persona: a qué pregunta, cómo se entendió, y el grupo. */
  respondeA?: { clave: string | null; tipo: string; respuesta: Respuesta; abiertoEn: string; cerradoEn: string };
};

/** Un aviso a los socios (mail): `clave` no se repite en un viaje. */
export type Aviso = { clave: string; asunto: string; detalle: string };

/** Para leer (logs, lecturas): nunca le llega a nadie. `tras`: cuántos salientes de este paso salieron antes. */
export type Nota = { en: string; zona: Zona; texto: string; tras: number };

export type Paso = { estado: EstadoViaje; salientes: Saliente[]; avisos: Aviso[]; notas: Nota[] };

export type EstadoProgramado = 'pendiente' | 'enviado' | 'vencido';

/**
 * Un programado del calendario congelado. `instante`: el del calendario
 * (ISO); `sale`: cuando sale de verdad (distinto solo en UC1 con un SÍ
 * tardío: momentoUC1).
 */
export type ProgramadoGuardado = Omit<Programado, 'instante'> & { instante: string; sale: string; estado: EstadoProgramado };

export type Grupo = {
  /** ISO de la primera y la última entrada. */
  abiertoEn: string;
  ultimoEn: string;
  /** A qué va: la última pregunta enviada cuando arrancó el grupo, o el álbum. */
  destino: { tipo: 'pregunta'; clave: string } | { tipo: 'album' };
  entradas: EntradaGuardada[];
};

/** Un mensaje que espera su hora (la siguiente de la cadena cuando contestó de noche). */
export type EnCola = { saliente: Saliente; anotarCadena: IdAntes | null };

export type EstadoViaje = Estado & {
  version: 1;
  /** ISO del SÍ. */
  siEn: string;
  /** ISO: cuándo se arma el calendario definitivo (justo antes de lo primero del día 1). */
  armarEn: string;
  armado: boolean;
  /** El calendario congelado, en orden. Antes de armar: el previo (con todas las de antes de salir pendientes). */
  calendario: ProgramadoGuardado[];
  /** Lo que no entró al armar (también va como aviso). null hasta armar. */
  noEntran: Pick<Calendario, 'avisosNaza' | 'antesQueNoEntran' | 'propiasQueNoEntran'> | null;
  /** La cola de salida: lo que espera su hora. */
  cola: EnCola[];
  /** REC1 / REC1-U pendiente: de qué pregunta de la cadena y cuándo. */
  recordatorio: { clave: IdAntes; en: string } | null;
  grupo: Grupo | null;
  /** ISO del último mensaje de la persona (para la ventana de 24 h). */
  ultimoEntranteAt: string | null;
  /** ISO: cuándo sale AL1 (se sabe al mandar CA1). El álbum (`album`) se abre al mandarlo. */
  al1En: string | null;
  /** Álbum con cero fotos esperando a los socios: desde cuándo, y si ya se repitió el aviso. */
  albumCero: { avisoEn: string; repetido: boolean } | null;
  /** Las claves de los avisos ya pedidos (no se repiten). */
  avisosPedidos: string[];
  /** Fotos que llegaron con el álbum cerrado: van al panel, sin contestar. */
  fotosAlPanel: number;
  /** La zona del viaje y desde cuándo (reubicar suma una). */
  zonas: { zonaViaje: Zona; desde: string }[];
  /** Para los ids de los salientes. */
  secuencia: number;
  /** Salió DES: el viaje terminó. */
  terminado: boolean;
};

// ── Ayudas ───────────────────────────────────────────────────────────────────

const iso = (d: Date) => d.toISOString();
const ms = (s: string) => Date.parse(s);
const CADENA: readonly string[] = CADENA_ANTES;
const esCadena = (id: string): id is IdAntes => CADENA.includes(id);

function guardar(p: Programado, estado: EstadoProgramado = 'pendiente'): ProgramadoGuardado {
  return { ...p, instante: iso(p.instante), sale: iso(p.instante), estado };
}

/** El programado con su `instante` como Date (el del calendario; con `alSalir`, el que sale de verdad). */
export function aProgramado(g: ProgramadoGuardado, alSalir = false): Programado {
  const { instante, sale, estado: _estado, ...resto } = g;
  return { ...resto, instante: new Date(alSalir ? sale : instante) };
}

/** El calendario congelado como `Calendario` (para leer: los instantes del calendario). */
export function calendarioDe(e: EstadoViaje): Calendario {
  return {
    programados: e.calendario.map((g) => aProgramado(g)),
    avisosNaza: e.noEntran?.avisosNaza ?? [],
    antesQueNoEntran: e.noEntran?.antesQueNoEntran ?? [],
    propiasQueNoEntran: e.noEntran?.propiasQueNoEntran ?? [],
  };
}

/** Lo próximo del calendario que sale después de `t` (lo vencido no cuenta). */
export function proximaDelCalendario(e: EstadoViaje, t: Date): Date | null {
  let min: number | null = null;
  for (const g of e.calendario) {
    if (g.estado === 'vencido') continue;
    const s = ms(g.sale);
    if (s > t.getTime() && (min === null || s < min)) min = s;
  }
  return min === null ? null : new Date(min);
}

/** La última pregunta enviada (la cadena o lo programado). */
export function ultimaPregunta(e: Estado): Envio | undefined {
  return e.envios[e.envios.length - 1];
}

/** ¿Hay una pregunta esperando respuesta? (la última enviada, sin contestar, y el álbum cerrado) */
export function preguntaAbierta(e: EstadoViaje): Envio | null {
  if (e.album) return null;
  const u = ultimaPregunta(e);
  return u && !contestado(u) ? u : null;
}

function enFranja(t: Date, zona: Zona): boolean {
  const h = aLocal(t, zona).hora;
  return h >= FRANJA_DESDE || h < FRANJA_HASTA;
}

const PASO_FRANJA_MS = 5 * 60_000;

/**
 * El atraso que cuenta: el tiempo entre `desde` y `hasta` fuera de la franja 23-8 de `zona` (de noche no se
 * manda, así que esas horas no lo vencen). Corta apenas pasa TOLERANCIA_ATRASO_MS (no hace falta más).
 */
export function atrasoFueraDeFranja(desde: number, hasta: number, zona: Zona): number {
  let fuera = 0;
  for (let t = desde; t < hasta && fuera <= TOLERANCIA_ATRASO_MS; t += PASO_FRANJA_MS) {
    if (!enFranja(new Date(t), zona)) fuera += Math.min(PASO_FRANJA_MS, hasta - t);
  }
  return fuera;
}

/** ¿Lo programado se atrasó tanto que ya no sale? CA1 nunca (abre el álbum). */
function vencido(g: ProgramadoGuardado, t: number): boolean {
  if (g.tipo === 'CA1') return false;
  return atrasoFueraDeFranja(ms(g.sale), t, g.zona) > TOLERANCIA_ATRASO_MS;
}

/** Lo que se va armando en un paso: el estado (se reemplaza, nunca se toca el de entrada) y lo que sale. */
type Ctx = { e: EstadoViaje; compra: Compra; salientes: Saliente[]; avisos: Aviso[]; notas: Nota[] };

function nota(c: Ctx, en: Date, zona: Zona, texto: string) {
  c.notas.push({ en: iso(en), zona, texto, tras: c.salientes.length });
}

function avisar(c: Ctx, a: Aviso) {
  if (c.e.avisosPedidos.includes(a.clave)) return;
  c.e = { ...c.e, avisosPedidos: [...c.e.avisosPedidos, a.clave] };
  c.avisos.push(a);
}

function nuevoSaliente(c: Ctx, s: Omit<Saliente, 'id'>): Saliente {
  const n = c.e.secuencia + 1;
  c.e = { ...c.e, secuencia: n };
  return { id: `s${n}`, ...s };
}

function mensaje(c: Ctx, m: Mensaje, desde: Date, s: { tipo: Saliente['tipo']; zona: Zona; origen: Origen; iniciativa: boolean; clave?: string; respondeA?: Saliente['respondeA'] }): Saliente {
  return nuevoSaliente(c, {
    tipo: s.tipo,
    desde: iso(desde),
    zona: s.zona,
    origen: s.origen,
    iniciativa: s.iniciativa,
    ids: m.ids,
    texto: m.texto,
    ...(s.clave !== undefined ? { clave: s.clave } : {}),
    ...(s.respondeA ? { respondeA: s.respondeA } : {}),
  });
}

function marcar(c: Ctx, clave: string, estado: EstadoProgramado) {
  c.e = { ...c.e, calendario: c.e.calendario.map((g) => (g.clave === clave && g.estado === 'pendiente' ? { ...g, estado } : g)) };
}

/** El REC1 de una pregunta de la cadena recién mandada: a los 3 días, si llega antes de lo próximo (calendario o armado). */
function programarRecordatorio(c: Ctx, clave: IdAntes, t: Date) {
  const rec = momentoRecordatorio(t, c.compra, c.e.recordatorioAntes);
  const prox = proximaDelCalendario(c.e, t);
  const armar = new Date(c.e.armarEn);
  const limite = prox && prox < armar ? prox : armar;
  c.e = { ...c.e, recordatorio: rec && rec < limite ? { clave, en: iso(rec) } : null };
}

/** Anota una de la cadena como mandada (y su REC1). */
function anotarCadena(c: Ctx, clave: IdAntes, t: Date) {
  c.e = anotarEnvio(c.e, { clave, tipo: 'cadena', ids: [clave], en: iso(t) }) as EstadoViaje;
  programarRecordatorio(c, clave, t);
}

function paso(c: Ctx): Paso {
  return { estado: c.e, salientes: c.salientes, avisos: c.avisos, notas: c.notas };
}

// ── iniciar ──────────────────────────────────────────────────────────────────

/**
 * La persona dijo SÍ a BIEN-1 (o BIEN-1R) en `ahora`: BIEN-2 y enseguida AS1
 * (alDecirSi; "ya de viaje" si el SÍ llega después del día de salida). Lo del
 * día de salida que ya pasó no sale (UC1 se corre 2 horas: momentoUC1). El
 * calendario definitivo se arma en `armarEn`: justo antes de lo primero del
 * día 1 (recién ahí se sabe qué quedó pendiente de antes de salir).
 */
export function iniciar(compra: Compra, ahora: Date): Paso {
  idiomaDe(compra); // un idioma desconocido frena acá
  const casa = compra.zonaCasa;
  const previo = armarCalendario(compra, [...CADENA_ANTES]);
  const primeroEnViaje = Math.min(...previo.programados.filter((p) => p.dia >= 1).map((p) => p.instante.getTime()));
  const armarEn = new Date(Math.max(primeroEnViaje - 1, ahora.getTime() + 1));
  const c: Ctx = {
    compra,
    salientes: [],
    avisos: [],
    notas: [],
    e: {
      ...nuevoEstado(),
      version: 1,
      siEn: iso(ahora),
      armarEn: iso(armarEn),
      armado: false,
      calendario: previo.programados.map((p) => guardar(p)),
      noEntran: null,
      cola: [],
      recordatorio: null,
      grupo: null,
      ultimoEntranteAt: iso(ahora),
      al1En: null,
      albumCero: null,
      avisosPedidos: [],
      fotosAlPanel: 0,
      zonas: [{ zonaViaje: compra.zonaViaje, desde: iso(ahora) }],
      secuencia: 0,
      terminado: false,
    },
  };

  // El día de salida: lo que ya pasó no sale; UC1 con un SÍ tardío, 2 horas después.
  c.e = {
    ...c.e,
    calendario: c.e.calendario.map((g) => {
      if (g.dia !== 0) return g;
      const p = aProgramado(g);
      const t = p.tipo === 'UC1' ? momentoUC1(p, ahora, compra) : p.instante >= ahora ? p.instante : null;
      if (!t) {
        nota(c, ahora, casa, `${p.ids[0]} ya pasó (${p.hora}) cuando dijo SÍ: no sale.`);
        return { ...g, estado: 'vencido' as const };
      }
      if (t.getTime() !== p.instante.getTime()) {
        nota(c, ahora, casa, `${p.ids[0]} ya pasó (${p.hora}) cuando dijo SÍ: sale 2 horas después.`);
        return { ...g, sale: iso(t) };
      }
      return g;
    }),
  };

  const [b2, as1] = alDecirSi(compra, ahora);
  c.salientes.push(mensaje(c, b2, ahora, { tipo: 'texto', zona: casa, origen: 'reaccion', iniciativa: false }));
  c.salientes.push(mensaje(c, as1, ahora, { tipo: 'pregunta', zona: casa, origen: 'arranque', iniciativa: false, clave: 'AS1' }));
  const yaDeViaje = aLocal(ahora, casa).fecha > compra.salida;
  c.e = anotarEnvio(c.e, { clave: 'AS1', tipo: 'cadena', ids: ['AS1'], en: iso(ahora), ...(yaDeViaje ? { yaDeViaje } : {}) }) as EstadoViaje;
  programarRecordatorio(c, 'AS1', ahora);
  return paso(c);
}

// ── queToca ──────────────────────────────────────────────────────────────────

type Pendiente =
  | { que: 'armar'; en: number }
  | { que: 'cola'; en: number; i: number }
  | { que: 'recordatorio'; en: number }
  | { que: 'programado'; en: number; clave: string }
  | { que: 'al1'; en: number }
  | { que: 'album'; en: number }
  | { que: 'cero-48'; en: number }
  | { que: 'cero-7d'; en: number };

const PRIORIDAD: Record<Pendiente['que'], number> = { armar: 0, cola: 1, recordatorio: 2, programado: 3, al1: 4, album: 5, 'cero-48': 6, 'cero-7d': 7 };

const RELOJ_ALBUM: ReadonlySet<string> = new Set(['juntando', 'esperando-al2', 'ultima-espera', 'eligiendo']);

function cierreCero(e: EstadoViaje, compra: Compra): number {
  const t = new Date(ms(e.albumCero!.avisoEn) + CERRAR_ALBUM_SOLO_MS);
  return respetarFranja(t, compra.zonaCasa, HORA_ALBUM_TRAS_FRANJA).getTime();
}

/** Todo lo que espera su hora (sin el grupo), con su hora. */
function pendientes(e: EstadoViaje, compra: Compra): Pendiente[] {
  const out: Pendiente[] = [];
  if (!e.armado) out.push({ que: 'armar', en: ms(e.armarEn) });
  e.cola.forEach((x, i) => out.push({ que: 'cola', en: ms(x.saliente.desde), i }));
  if (e.recordatorio) out.push({ que: 'recordatorio', en: ms(e.recordatorio.en) });
  for (const g of e.calendario) {
    if (g.estado !== 'pendiente' || (!e.armado && g.dia >= 1)) continue;
    out.push({ que: 'programado', en: ms(g.sale), clave: g.clave });
  }
  if (e.al1En && !e.album) out.push({ que: 'al1', en: ms(e.al1En) });
  if (e.album && e.album.vence && RELOJ_ALBUM.has(e.album.fase)) out.push({ que: 'album', en: ms(e.album.vence) });
  if (e.albumCero && e.album?.fase === 'esperando-naza') {
    if (!e.albumCero.repetido) out.push({ que: 'cero-48', en: ms(e.albumCero.avisoEn) + REPETIR_AVISO_ALBUM_MS });
    out.push({ que: 'cero-7d', en: cierreCero(e, compra) });
  }
  return out;
}

function primero(ps: Pendiente[]): Pendiente | null {
  let mejor: Pendiente | null = null;
  for (const p of ps) if (!mejor || p.en < mejor.en || (p.en === mejor.en && PRIORIDAD[p.que] < PRIORIDAD[mejor.que])) mejor = p;
  return mejor;
}

/**
 * Cuándo hay que volver a llamar a queToca (ISO), o null si ya no queda
 * nada. Puede ser una hora que ya pasó (el bot estuvo caído): queToca la
 * resuelve. Para el bot alcanza con el tick de cada minuto; el simulador
 * salta derecho a esta hora.
 */
export function proximaAccion(compra: Compra, e: EstadoViaje, op: Opciones = {}): string | null {
  const silencio = op.silencioMs ?? SILENCIO_GRUPO_MS;
  const p = primero(pendientes(e, compra));
  let t = p?.en ?? null;
  if (e.grupo) {
    const cierre = ms(e.grupo.ultimoEn) + silencio;
    if (t === null || cierre < t) t = cierre;
  }
  return t === null ? null : new Date(t).toISOString();
}

/**
 * Lo que toca a esta hora (ver arriba). Idempotente: lo que sale queda
 * anotado; con el mismo `ahora`, la segunda vez no sale nada.
 */
export function queToca(compra: Compra, estado: EstadoViaje, ahora: Date, op: Opciones = {}): Paso {
  const silencio = op.silencioMs ?? SILENCIO_GRUPO_MS;
  const c: Ctx = { e: estado, compra, salientes: [], avisos: [], notas: [] };
  const t = ahora.getTime();
  for (let vuelta = 0; ; vuelta++) {
    if (vuelta > 10_000) throw new Error('queToca no termina');
    const p = siguiente(c, t);
    // El grupo abierto se cierra a los 3' de silencio, o antes si hay que mandar otra cosa.
    if (c.e.grupo && (ms(c.e.grupo.ultimoEn) + silencio <= t || p)) {
      cerrarGrupo(c, ahora);
      continue;
    }
    if (!p) break;
    hacer(c, p, ahora);
  }
  return paso(c);
}

/** Lo primero que ya tiene que salir (o vencer), o null. Lo programado espera si es de noche en su zona. */
function siguiente(c: Ctx, t: number): Pendiente | null {
  const ps = pendientes(c.e, c.compra).filter((p) => {
    if (p.en > t) return false;
    if (p.que !== 'programado') return true;
    const g = c.e.calendario.find((x) => x.clave === p.clave)!;
    return vencido(g, t) || !enFranja(new Date(t), g.zona);
  });
  return primero(ps);
}

function hacer(c: Ctx, p: Pendiente, ahora: Date) {
  const casa = c.compra.zonaCasa;
  switch (p.que) {
    case 'armar':
      return armar(c);
    case 'cola': {
      const x = c.e.cola[p.i];
      c.e = { ...c.e, cola: c.e.cola.filter((_, i) => i !== p.i) };
      c.salientes.push(x.saliente);
      if (x.anotarCadena) anotarCadena(c, x.anotarCadena, ahora);
      return;
    }
    case 'recordatorio': {
      const { clave } = c.e.recordatorio!;
      c.e = { ...c.e, recordatorio: null };
      const ultima = c.e.envios.filter((x) => x.tipo === 'cadena').pop();
      const envio = c.e.envios.find((x) => x.tipo === 'cadena' && x.clave === clave && contestado(x));
      if (c.e.recordatorioAntes || ultima?.clave !== clave || envio) return;
      nota(c, ahora, casa, `${clave} lleva 3 días sin respuesta.`);
      c.salientes.push(mensaje(c, recordatorioAntes(c.compra, clave), ahora, { tipo: 'recordatorio', zona: casa, origen: 'recordatorio', iniciativa: true, clave }));
      c.e = { ...c.e, recordatorioAntes: true };
      return;
    }
    case 'programado': {
      const g = c.e.calendario.find((x) => x.clave === p.clave)!;
      if (vencido(g, ahora.getTime())) {
        marcar(c, g.clave, 'vencido');
        nota(c, ahora, g.zona, `${g.ids[0]} (${g.fecha} ${g.hora}) no salió a tiempo: no sale.`);
        return;
      }
      return mandarProgramado(c, g, ahora);
    }
    case 'al1': {
      const ca1 = c.e.envios.filter((x) => x.tipo === 'CA1').pop();
      const contesto = ca1?.respuestas.some((r) => !r.audioMal && r.tipo !== 'paso') ?? false;
      if (!ca1?.respuestas.some((r) => !r.audioMal)) nota(c, ahora, casa, 'CA1 quedó sin respuesta: sale AL1-P igual.');
      const cual = contesto ? 'AL1' : 'AL1-P';
      c.salientes.push(mensaje(c, mensajeAlbum(c.compra, cual), ahora, { tipo: 'pregunta', zona: casa, origen: 'album-reloj', iniciativa: true, clave: 'AL1' }));
      c.e = { ...c.e, album: iniciarAlbum(ahora, c.compra) };
      return;
    }
    case 'album':
      return aplicarAlbum(c, { tipo: 'reloj', en: ahora }, 'album-reloj');
    case 'cero-48': {
      c.e = { ...c.e, albumCero: { ...c.e.albumCero!, repetido: true } };
      nota(c, ahora, casa, 'El álbum sigue sin fotos a las 48 horas del aviso: se avisa otra vez.');
      avisar(c, {
        clave: 'album-cero-48h',
        asunto: `Viaje de ${c.compra.nombre}: el álbum sigue sin fotos`,
        detalle: `Pasaron 48 horas del primer aviso y el álbum sigue con cero fotos. Si no hacen nada, el ${aLocal(new Date(cierreCero(c.e, c.compra)), casa).fecha} se cierra solo con la despedida (DES).`,
      });
      return;
    }
    case 'cero-7d': {
      nota(c, ahora, casa, 'Pasaron 7 días del aviso sin fotos: el álbum se cierra solo.');
      avisar(c, { clave: 'album-cero-cerrado', asunto: `Viaje de ${c.compra.nombre}: el álbum se cerró sin fotos`, detalle: 'A los 7 días del aviso, el álbum se cerró solo con la despedida (DES), sin fotos.' });
      return aplicarAlbum(c, { tipo: 'naza-cierra', en: ahora }, 'album-reloj');
    }
  }
}

/** Arma el calendario definitivo con lo que quedó pendiente de antes de salir, y lo congela. Lo que ya pasó, vence. */
function armar(c: Ctx) {
  const armarEn = new Date(c.e.armarEn);
  const casa = c.compra.zonaCasa;
  const cal = armarCalendario(c.compra, pendientesParaElViaje(c.e));
  for (const a of cal.avisosNaza) nota(c, armarEn, casa, `Aviso a Naza: ${a}`);
  if (cal.avisosNaza.length) {
    avisar(c, { clave: 'calendario-no-entran', asunto: `Viaje de ${c.compra.nombre}: preguntas que no entran`, detalle: cal.avisosNaza.join(' ') });
  }
  const nuevos: ProgramadoGuardado[] = [];
  for (const p of cal.programados.filter((x) => x.dia >= 1)) {
    if (p.instante.getTime() < armarEn.getTime()) {
      nuevos.push(guardar(p, 'vencido'));
      nota(c, armarEn, p.zona, `${p.ids[0]} ya pasó: no sale.`);
    } else nuevos.push(guardar(p));
  }
  const calendario = [...c.e.calendario.filter((g) => g.dia === 0), ...nuevos].sort((a, b) => ms(a.instante) - ms(b.instante));
  c.e = {
    ...c.e,
    armado: true,
    calendario,
    noEntran: { avisosNaza: cal.avisosNaza, antesQueNoEntran: cal.antesQueNoEntran, propiasQueNoEntran: cal.propiasQueNoEntran },
  };
}

function mandarProgramado(c: Ctx, g: ProgramadoGuardado, ahora: Date) {
  const p = aProgramado(g, true);
  const q = preguntaProgramada(p, c.compra, nochesSinContestar(c.e), c.e.rotacion, nocheAnterior(c.e)?.ids);
  c.e = { ...c.e, rotacion: q.rot };
  if (q.mensaje.ids.some((id) => id.startsWith('ATR'))) nota(c, ahora, p.zona, 'La noche anterior quedó sin contestar.');
  c.salientes.push(mensaje(c, q.mensaje, ahora, { tipo: 'pregunta', zona: p.zona, origen: 'programado', iniciativa: true, clave: p.clave }));
  c.e = anotarEnvio(c.e, { clave: p.clave, tipo: p.tipo, ids: p.ids, en: iso(ahora) }) as EstadoViaje;
  marcar(c, p.clave, 'enviado');
  if (p.tipo === 'CA1') c.e = { ...c.e, al1En: iso(momentoAL1(aProgramado(g), c.compra)) };
}

// ── El álbum ─────────────────────────────────────────────────────────────────

const AVISO_ALBUM_CERO = 'El álbum lleva 5 horas sin fotos: cero fotos.';

function aplicarAlbum(c: Ctx, ev: EventoAlbum, origen: Origen) {
  if (!c.e.album) return;
  const casa = c.compra.zonaCasa;
  const r = pasoAlbum(c.e.album, ev, c.compra);
  c.e = { ...c.e, album: r.estado };
  const ahora = ev.en;
  for (const s of r.salidas) {
    if (s.tipo === 'mensaje') {
      const pide = s.mensaje.ids.includes('AL2') || s.mensaje.ids.includes('AL3');
      c.salientes.push(
        mensaje(c, s.mensaje, ahora, { tipo: pide ? 'pregunta' : 'texto', zona: casa, origen, iniciativa: origen !== 'album-reaccion', ...(pide ? { clave: s.mensaje.ids[0] } : {}) }),
      );
    } else if (s.tipo === 'avisar-naza') {
      nota(c, ahora, casa, `Aviso a Naza: ${s.motivo}`);
      c.e = { ...c.e, albumCero: { avisoEn: iso(ahora), repetido: false } };
      avisar(c, {
        clave: 'album-cero',
        asunto: `Viaje de ${c.compra.nombre}: el álbum sin fotos`,
        detalle: `${AVISO_ALBUM_CERO} Se avisa otra vez a las 48 horas y, si no hacen nada, a los 7 días se cierra solo con la despedida (DES).`,
      });
    } else if (s.tipo === 'cerrado') {
      nota(c, ahora, casa, `Se cierra el álbum: ${c.e.album!.fotos} fotos quedan, guardadas ${s.guardadas}, afuera ${s.descartadas}.`);
      c.e = { ...c.e, terminado: true };
    } else {
      c.e = { ...c.e, fotosAlPanel: c.e.fotosAlPanel + s.cantidad };
      nota(c, ahora, casa, `${s.cantidad} fotos después del cierre: al panel, sin contestar.`);
    }
  }
  if (c.e.albumCero && c.e.album?.fase !== 'esperando-naza') c.e = { ...c.e, albumCero: null };
}

/** Los socios cierran un álbum que espera con cero fotos (el script del paso 7): DES. */
export function cerrarAlbum(compra: Compra, estado: EstadoViaje, ahora: Date): Paso {
  const c: Ctx = { e: estado, compra, salientes: [], avisos: [], notas: [] };
  aplicarAlbum(c, { tipo: 'naza-cierra', en: ahora }, 'naza');
  return paso(c);
}

// ── Lo que llega ─────────────────────────────────────────────────────────────

/**
 * Llegó algo de la persona (una o varias entradas juntas, en `ahora`).
 * Primero corre queToca(ahora) (si el grupo anterior ya tenía que cerrarse,
 * sus reacciones salen acá); después suma las entradas al grupo abierto, o
 * abre uno nuevo. `clave`: a qué pregunta va ("album" con el álbum abierto),
 * para la fila de `respuestas`.
 */
export function alEntrar(compra: Compra, estado: EstadoViaje, entradas: Entrada | Entrada[], ahora: Date, op: Opciones = {}): Paso & { clave: string } {
  const antes = queToca(compra, estado, ahora, op);
  // Lo que ya llegó (el webhook reintenta): no se suma otra vez.
  const ya = new Set([...(antes.estado.grupo?.entradas.map((x) => x.idMensaje) ?? []), ...(antes.estado.album?.ids ?? [])]);
  const lista = (Array.isArray(entradas) ? entradas : [entradas]).filter((x) => !ya.has(x.idMensaje));
  const en = iso(ahora);
  const guardadas: EntradaGuardada[] = lista.map((x) => ({ ...x, en }));
  let e = antes.estado;
  if (guardadas.length === 0) {
    const u = ultimaPregunta(e);
    const destino = e.grupo?.destino ?? (e.album || !u ? { tipo: 'album' as const } : { tipo: 'pregunta' as const, clave: u.clave });
    return { ...antes, clave: destino.tipo === 'album' ? 'album' : destino.clave };
  }
  let grupo: Grupo;
  if (e.grupo) grupo = { ...e.grupo, ultimoEn: en, entradas: [...e.grupo.entradas, ...guardadas] };
  else {
    const u = ultimaPregunta(e);
    const destino: Grupo['destino'] = e.album || !u ? { tipo: 'album' } : { tipo: 'pregunta', clave: u.clave };
    grupo = { abiertoEn: en, ultimoEn: en, destino, entradas: guardadas };
  }
  e = { ...e, grupo, ultimoEntranteAt: en };
  return { ...antes, estado: e, clave: grupo.destino.tipo === 'album' ? 'album' : grupo.destino.clave };
}

type Clase = 'audio' | 'texto' | 'foto' | 'paso' | 'audioMal';

/** Qué fue el grupo: ver las reglas arriba. */
export function clasificar(entradas: readonly Entrada[], compra: Compra): Clase {
  const idioma = idiomaDe(compra);
  const buenos = entradas.filter((x) => x.tipo === 'audio' && !audioMalo(x));
  const dichos: string[] = [];
  for (const x of entradas) {
    if (x.tipo === 'audio' && !audioMalo(x)) dichos.push(x.transcripcion!);
    else if (x.tipo === 'texto' || x.tipo === 'boton') dichos.push(x.texto);
  }
  if (dichos.length && dichos.every((t) => entender(t, idioma) === 'paso')) return 'paso';
  if (buenos.length) return 'audio';
  if (dichos.length) return 'texto';
  if (entradas.some((x) => x.tipo === 'audio')) return 'audioMal';
  return 'foto';
}

function cerrarGrupo(c: Ctx, ahora: Date) {
  const g = c.e.grupo!;
  c.e = { ...c.e, grupo: null };
  if (g.destino.tipo === 'album') return grupoAlAlbum(c, g);

  const clave = g.destino.clave;
  const envio = c.e.envios.filter((x) => x.clave === clave).pop()!;
  const clase = clasificar(g.entradas, c.compra);
  const fotos = g.entradas.filter((x) => x.tipo === 'foto').length;
  const primerId = g.entradas[0].idMensaje;
  const respuestaEn = g.abiertoEn;
  const casa = c.compra.zonaCasa;
  const respondeA = (tipo: string, respuesta: Respuesta, deClave: string | null = clave) => ({ clave: deClave, tipo, respuesta, abiertoEn: g.abiertoEn, cerradoEn: iso(ahora) });
  const programados = () => c.e.calendario.map((x) => aProgramado(x));

  if (contestado(envio)) {
    if (clase === 'foto') {
      // Foto suelta: ❤️ sobre la primera.
      const resp: Respuesta = { tipo: 'foto', idMensaje: primerId };
      const r = reaccion({ tipo: 'foto-suelta', quedaNoche: quedaNocheEseDia(programados(), ahora) }, resp, c.compra, c.e.rotacion);
      c.e = { ...c.e, rotacion: r.rot, fotosSueltas: c.e.fotosSueltas + fotos };
      const zona = c.compra.zonaViaje;
      for (const m of r.mensajes) c.salientes.push(mensaje(c, m, ahora, { tipo: 'texto', zona, origen: 'reaccion', iniciativa: false, respondeA: respondeA('foto-suelta', resp, null) }));
      for (const x of r.reacciones) c.salientes.push(nuevoSaliente(c, { tipo: 'reaccion', desde: iso(ahora), zona, origen: 'reaccion', iniciativa: false, ids: [], texto: '', emoji: x.emoji, aMensaje: x.aMensaje, respondeA: respondeA('foto-suelta', resp, null) }));
      return;
    }
    if (clase === 'audioMal') {
      const resp: Respuesta = { tipo: 'audio', audioMal: true, idMensaje: primerId };
      const r = reaccion({ tipo: 'cadena', siguiente: 'callada' }, resp, c.compra, c.e.rotacion);
      c.e = { ...c.e, rotacion: r.rot };
      for (const m of r.mensajes) c.salientes.push(mensaje(c, m, ahora, { tipo: 'texto', zona: casa, origen: 'reaccion', iniciativa: false, respondeA: respondeA(envio.tipo, resp) }));
      return;
    }
    if (clase === 'paso') {
      nota(c, ahora, casa, `"Paso" a ${clave}, que ya estaba contestada: no hace nada.`);
      return;
    }
    // Más de lo mismo a una que ya contestó: se guarda (el escritor lee todo), sin acuse.
    c.e = anotarRespuesta(c.e, clave, { tipo: clase, idMensaje: primerId, en: respuestaEn }) as EstadoViaje;
    c.e = { ...c.e, fotosSueltas: c.e.fotosSueltas + fotos };
    nota(c, ahora, casa, `Llegó más para ${clave}, que ya estaba contestada: se guarda, sin acuse.`);
    return;
  }

  const resp: Respuesta = clase === 'audioMal' ? { tipo: 'audio', audioMal: true, idMensaje: primerId } : { tipo: clase, idMensaje: primerId };
  // Las fotos que no son la respuesta (con un audio o un texto; con fotos solas, la primera es la respuesta).
  const extra = clase === 'foto' ? fotos - 1 : fotos;
  if (envio.tipo === 'cadena') return responderCadena(c, clave as IdAntes, resp, respuestaEn, extra, ahora, respondeA('cadena', resp));
  return responderProgramado(c, envio, resp, respuestaEn, extra, ahora, respondeA(envio.tipo, resp));
}

function responderCadena(c: Ctx, id: IdAntes, resp: Respuesta, respuestaEn: string, extra: number, ahora: Date, respondeA: Saliente['respondeA']) {
  const casa = c.compra.zonaCasa;
  c.e = anotarRespuesta(c.e, id, { ...resp, en: respuestaEn }) as EstadoViaje;
  c.e = { ...c.e, fotosSueltas: c.e.fotosSueltas + extra };
  if (resp.audioMal) {
    const r = reaccion({ tipo: 'cadena', siguiente: 'callada' }, resp, c.compra, c.e.rotacion);
    c.e = { ...c.e, rotacion: r.rot };
    for (const m of r.mensajes) c.salientes.push(mensaje(c, m, ahora, { tipo: 'texto', zona: casa, origen: 'reaccion', iniciativa: false, respondeA }));
    return;
  }
  const sig = siguienteDeLaCadena(id);
  const cuando = momentoDeLaSiguiente(ahora, c.compra);
  const r = reaccion({ tipo: 'cadena', siguiente: !cuando ? 'callada' : (sig ?? 'fin') }, resp, c.compra, c.e.rotacion);
  c.e = { ...c.e, rotacion: r.rot };
  // Lo que contesta sale enseguida (TXT, acuse solo); lo que trae la siguiente, a su hora (momentoDeLaReaccion).
  for (const m of r.mensajes) {
    const en = momentoDeLaReaccion(m, ahora, cuando);
    const trae = m.ids.some(esCadena);
    const s = mensaje(c, m, en, { tipo: trae ? 'pregunta' : 'texto', zona: casa, origen: trae ? 'cadena' : 'reaccion', iniciativa: false, respondeA, ...(trae && sig ? { clave: sig } : {}) });
    const anota = trae && sig && cuando ? sig : null;
    if (en.getTime() > ahora.getTime()) c.e = { ...c.e, cola: [...c.e.cola, { saliente: s, anotarCadena: anota }] };
    else {
      c.salientes.push(s);
      if (anota) anotarCadena(c, anota, ahora);
    }
  }
}

function responderProgramado(c: Ctx, envio: Envio, resp: Respuesta, respuestaEn: string, extra: number, ahora: Date, respondeA: Saliente['respondeA']) {
  const g = c.e.calendario.find((x) => x.clave === envio.clave)!;
  const programados = c.e.calendario.map((x) => aProgramado(x));
  const tipo = envio.tipo as TipoProgramado;
  const r = reaccion(
    {
      tipo,
      quedaNoche: quedaNocheEseDia(programados, ahora),
      quedaOtra: quedaOtraEseDia(programados, ahora) || (tipo === 'CA1' && quedaAL1EseDia(aProgramado(g), ahora, c.compra)),
    },
    resp,
    c.compra,
    c.e.rotacion,
  );
  c.e = { ...c.e, rotacion: r.rot, fotosSueltas: c.e.fotosSueltas + extra };
  c.e = anotarRespuesta(c.e, envio.clave, { ...resp, en: respuestaEn }) as EstadoViaje;
  for (const m of r.mensajes) c.salientes.push(mensaje(c, m, ahora, { tipo: 'texto', zona: g.zona, origen: 'reaccion', iniciativa: false, respondeA }));
  for (const x of r.reacciones) {
    c.salientes.push(nuevoSaliente(c, { tipo: 'reaccion', desde: iso(ahora), zona: g.zona, origen: 'reaccion', iniciativa: false, ids: [], texto: '', emoji: x.emoji, aMensaje: x.aMensaje, ...(respondeA ? { respondeA } : {}) }));
  }
}

/**
 * Un grupo con el álbum abierto: en orden. Las fotos que llegaron juntas (el
 * mismo instante) son un solo evento; las que reenvía (`reenviaA`) son las
 * que saca (AL3). Lo que escribe o dice pasa por el detector: "listo", "sí",
 * "no" u otra cosa. Un audio que llegó mal no cuenta.
 */
function grupoAlAlbum(c: Ctx, g: Grupo) {
  const idioma = idiomaDe(c.compra);
  const es = g.entradas;
  for (let i = 0; i < es.length; ) {
    const x = es[i];
    const en = new Date(x.en);
    if (x.tipo === 'foto') {
      const reenvio = x.reenviaA !== undefined;
      let j = i;
      const ids: string[] = [];
      while (j < es.length) {
        const y = es[j];
        if (y.tipo !== 'foto' || y.en !== x.en || (y.reenviaA !== undefined) !== reenvio) break;
        ids.push(reenvio ? y.reenviaA! : y.idMensaje);
        j++;
      }
      aplicarAlbum(c, reenvio ? { tipo: 'reenvio', en, ids } : { tipo: 'foto', en, ids }, 'album-reaccion');
      i = j;
      continue;
    }
    i++;
    if (audioMalo(x)) continue;
    const dicho = x.tipo === 'audio' ? x.transcripcion! : x.texto;
    const e = entender(dicho, idioma);
    const ev: EventoAlbum = e === 'listo' || e === 'si' || e === 'no' ? { tipo: e, en } : { tipo: 'otra', en };
    aplicarAlbum(c, ev, 'album-reaccion');
  }
}

// ── Cambio de país ───────────────────────────────────────────────────────────

/**
 * Cambió el país del viaje: `compraNueva` es la misma compra con otra
 * `zonaViaje` (lo demás no se mira). Lo que ya salió o venció no se toca. Lo
 * pendiente conserva su clave, su tipo y sus ids (qué pregunta va cada día
 * quedó congelado); se recalculan solo instante, fecha y hora, con las mismas
 * reglas del calendario (10:00, 13:00, la noche; la franja 23-8; ID1 a la
 * más tarde de las dos zonas). Lo de casa (el día de salida y el de después
 * de volver) no cambia. Antes de armar, también se corre `armarEn`. Queda el
 * historial en `zonas`. Desde acá, el bot pasa `compraNueva` en cada llamada.
 */
export function reubicar(estado: EstadoViaje, compraNueva: Compra, ahora: Date): EstadoViaje {
  validarCompra(compraNueva, { minimoDias: 1 });
  const c = compraNueva;
  const n = diasEntre(c.salida, c.vuelta);
  const horaNoche = c.horaNoche ?? HORA_NOCHE_POR_DEFECTO;
  const deCasa = (dia: number) => n === 0 || dia === 0 || dia === n + 1;
  const calendario = estado.calendario
    .map((g) => {
      if (g.estado !== 'pendiente' || deCasa(g.dia)) return g;
      const fechaDia = sumarDias(c.salida, g.dia);
      let instante: Date;
      let zona: Zona;
      if (g.tipo === 'ID1' && g.momento === 'manana') {
        const enViaje = aInstante(fechaDia, HORA_MANANA, c.zonaViaje);
        const enCasa = aInstante(fechaDia, HORA_MANANA, c.zonaCasa);
        zona = enCasa > enViaje ? c.zonaCasa : c.zonaViaje;
        instante = respetarFranjas(enCasa > enViaje ? enCasa : enViaje, [c.zonaViaje, c.zonaCasa]);
      } else {
        zona = c.zonaViaje;
        const hora = g.momento === 'manana' ? HORA_MANANA : g.momento === 'mediodia' ? HORA_MEDIODIA : horaNoche;
        instante = respetarFranja(aInstante(fechaDia, hora, zona), zona);
      }
      const local = aLocal(instante, zona);
      return { ...g, zona, fecha: local.fecha, hora: local.hora, instante: iso(instante), sale: iso(instante) };
    })
    .sort((a, b) => ms(a.instante) - ms(b.instante));
  let armarEn = estado.armarEn;
  if (!estado.armado) {
    const primero = Math.min(...calendario.filter((g) => g.dia >= 1).map((g) => ms(g.instante)));
    armarEn = iso(new Date(Math.max(primero - 1, ms(estado.siEn) + 1)));
  }
  return { ...estado, calendario, armarEn, zonas: [...estado.zonas, { zonaViaje: c.zonaViaje, desde: iso(ahora) }] };
}

