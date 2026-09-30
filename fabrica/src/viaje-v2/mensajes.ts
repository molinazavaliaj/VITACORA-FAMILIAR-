// Arma cada mensaje de WhatsApp de la entrevista de viaje como texto final,
// con los textos del banco (docs/viajes-v2/banco.md). Puro: la rotación de
// acuses y atrasos, y el tope de TXT, viajan en `Rotacion` y se devuelven
// actualizados.
//
// Varias partes en un mismo mensaje van separadas por una línea en blanco.
//
// Reglas de empalme (banco.md: "Decisiones del compilado" y "Revisión de Fable"):
//   · ACA como primera línea de la siguiente de antes de salir. La rotación de
//     ACA arranca por ACA2; ACA1 (con {{nombre}}) nunca arriba de AS2 ni de VA1 (A6).
//   · ACN solo, después de la noche (común, de antes en el viaje, propia, FN1).
//   · Mediodía (MD), VU0 y fotos sueltas: una reacción ❤️ de WhatsApp sobre
//     su mensaje, sin texto (`reacciones`, no `mensajes`) (simulaciones).
//   · ACM solo, después de UC1, ID1, VU1 e IV1. ACM3 y ACM4 dicen "Hasta la
//     noche": solo van si de verdad queda una pregunta de noche ese día
//     (`quedaNoche`, ver quedaNocheEseDia en calendario.ts). Sin el dato, se
//     asume que no: ACM1 o ACM2 (A1 y revisión).
//   · CA1 → AL1 solo: AL1 trae su "Gracias" adentro. "Paso" en CA1 → AL1-P (A3).
//   · ATR solo arriba de la noche común (A2): ATR1-3 rotan; ATR-V con 2 o más
//     seguidas, pero nunca dos noches seguidas: si la noche anterior llevó
//     ATR-V, esta va sin ATR (simulaciones).
//   · "Paso": PAS-A + la siguiente sin acuse (A4); en VA1, PAS-A2 solo; en el viaje,
//     PAS-V2 si ese día todavía llega otra pregunta (`quedaOtra`), si no PAS-V.
//     Si la cadena se calló por la fecha (ya es el día de salida), nada que
//     prometa: ni la siguiente ni PAS-A2 ("silencio hasta el día que te vas");
//     va ACM1 o ACM2 solo, y lo que falta queda para las noches (revisión).
//   · Texto en vez de audio: TXT en lugar del acuse, como mucho MAX_TXT veces,
//     SOLO en su mensaje: si sigue una pregunta, va en otro mensaje (simulaciones).
//   · Si la respuesta fue solo texto o solo fotos, nunca ACA2 ni ACN3 ("Lo escuché") (A5 y simulaciones).
//   · Audio que llegó mal (la señal viene de afuera): COR solo; la pregunta sigue abierta.

import { porId } from './banco.js';
import type { IdAntes, Programado, TipoProgramado } from './calendario.js';
import { aLocal } from './horas.js';
import { datosDeCompra, renderizar } from './texto.js';
import type { Compra, Mensaje } from './tipos.js';

export const MAX_TXT = 2;

export type Grupo = 'ACN' | 'ACM' | 'ACA' | 'ATR';

const GRUPOS: Record<Grupo, readonly string[]> = {
  ACN: ['ACN1', 'ACN2', 'ACN3', 'ACN4'],
  ACM: ['ACM1', 'ACM2', 'ACM3', 'ACM4'],
  ACA: ['ACA1', 'ACA2', 'ACA3', 'ACA4'],
  ATR: ['ATR1', 'ATR2', 'ATR3'],
};

/** Por dónde arranca cada rueda (A6: ACA arranca por ACA2). */
const INICIO: Record<Grupo, string> = { ACN: 'ACN1', ACM: 'ACM1', ACA: 'ACA2', ATR: 'ATR1' };

/** El último que salió de cada grupo, cuántos TXT van, y si la última noche del viaje llevó ATR-V. */
export type Rotacion = { ACN?: string; ACM?: string; ACA?: string; ATR?: string; txtUsados: number; atrVAnterior?: boolean };

export const ROTACION_INICIAL: Rotacion = { txtUsados: 0 };

/** Los ACM que no dicen "Hasta la noche": los únicos si ese día no queda noche. */
const ACM_SIN_NOCHE = ['ACM1', 'ACM2'];

/**
 * El siguiente del grupo en la rueda, entre los permitidos, que no sea el
 * último que salió. Si no queda ninguno distinto, el primero permitido.
 */
export function elegirRotando(grupo: Grupo, rot: Rotacion, permitidos?: readonly string[]): { id: string; rot: Rotacion } {
  const rueda = GRUPOS[grupo];
  const ok = (id: string) => !permitidos || permitidos.includes(id);
  const ultimo = rot[grupo];
  const desde = ultimo ? rueda.indexOf(ultimo) : rueda.indexOf(INICIO[grupo]) - 1;
  let id: string | undefined;
  for (let k = 1; k <= rueda.length; k++) {
    const c = rueda[(desde + k + rueda.length) % rueda.length];
    if (ok(c) && c !== ultimo) {
      id = c;
      break;
    }
  }
  id ??= rueda.find(ok);
  if (!id) throw new Error(`No hay ${grupo} permitido entre ${permitidos?.join(', ')}`);
  return { id, rot: { ...rot, [grupo]: id } };
}

function texto(id: string, compra: Compra, pregunta?: string): string {
  return renderizar(porId(id).texto, { ...datosDeCompra(compra), pregunta });
}

function textoYaDeViaje(id: string, compra: Compra): string {
  const f = porId(id);
  if (!f.yaDeViaje) throw new Error(`${id} no tiene variante "ya de viaje"`);
  return renderizar(f.yaDeViaje, datosDeCompra(compra));
}

/** Junta partes (id + texto) en un solo mensaje. */
function juntar(partes: { id: string; texto: string }[]): Mensaje {
  return { ids: partes.map((p) => p.id), texto: partes.map((p) => p.texto).join('\n\n') };
}

const parte = (id: string, compra: Compra) => ({ id, texto: texto(id, compra) });

// ── Arranque ─────────────────────────────────────────────────────────────────

/** BIEN-1R si es un regalo; BIEN-1 si es para sí. Plantilla de Meta: pide el SÍ. */
export function arranque(compra: Compra): Mensaje {
  return juntar([parte(compra.regalo ? 'BIEN-1R' : 'BIEN-1', compra)]);
}

/**
 * Con el SÍ: BIEN-2 y enseguida AS1 (dos mensajes). AS1 sale SIEMPRE, aunque
 * ya sea el día de salida: BIEN-2 termina en "Ahí va la primera". Así, si la
 * compra es el mismo día que sale, ese día van BIEN-2, AS1 y UC1 (test en
 * viaje-v2-revision; UC1 puede correrse: momentoUC1). Lo que siga de la
 * cadena ese día ya no sale (momentoDeLaSiguiente da null): queda para las noches.
 *
 * Si el SÍ (`en`) llega después del día de salida (hora de casa), AS1 va en su
 * versión "ya de viaje" (simulaciones). Anotarla con `yaDeViaje: true` en el
 * estado: así no vuelve a salir en las noches (pendientesParaElViaje).
 */
export function alDecirSi(compra: Compra, en?: Date): Mensaje[] {
  const yaSalio = en !== undefined && aLocal(en, compra.zonaCasa).fecha > compra.salida;
  const as1 = yaSalio ? { id: 'AS1', texto: textoYaDeViaje('AS1', compra) } : parte('AS1', compra);
  return [juntar([parte('BIEN-2', compra)]), juntar([as1])];
}

/** CA1 sin respuesta: al día siguiente a las 13:00 sale AL1-P igual (momentoAlbumSinCA1). Abre el álbum. */
export function albumSinRespuesta(compra: Compra): Mensaje {
  return juntar([parte('AL1-P', compra)]);
}

/** Una de la cadena sola (para reenviarla, o para lo que haga falta). */
export function preguntaDeLaCadena(id: IdAntes, compra: Compra): Mensaje {
  return juntar([parte(id, compra)]);
}

/** El recordatorio de antes de salir: REC1-U si la colgada es VA1 (la última), REC1 para las demás. */
export function recordatorioAntes(compra: Compra, colgada: IdAntes): Mensaje {
  return juntar([parte(colgada === 'VA1' ? 'REC1-U' : 'REC1', compra)]);
}

// ── Lo programado ────────────────────────────────────────────────────────────

/**
 * El mensaje de algo del calendario. `nochesSinContestar` son las noches del
 * viaje seguidas sin contestar justo antes de esta (lo cuenta estado.ts): con
 * 1, ATR1-3 rotando; con 2 o más, ATR-V. Solo arriba de la noche común (A2).
 */
export function preguntaProgramada(p: Programado, compra: Compra, nochesSinContestar: number, rot: Rotacion): { mensaje: Mensaje; rot: Rotacion } {
  const partes: { id: string; texto: string }[] = [];
  let r = rot;
  if (p.tipo === 'noche' && nochesSinContestar >= 1) {
    if (nochesSinContestar >= 2) {
      if (!rot.atrVAnterior) partes.push(parte('ATR-V', compra));
    } else {
      const e = elegirRotando('ATR', r);
      r = e.rot;
      partes.push(parte(e.id, compra));
    }
  }
  if (NOCHES_DEL_VIAJE.has(p.tipo)) r = { ...r, atrVAnterior: partes.some((x) => x.id === 'ATR-V') };
  if (p.tipo === 'noche') {
    // Comienzo + " " + puerta + cierre (el cierre ya empieza con ", y").
    const [c, no, f] = p.ids;
    const m = juntar([...partes, { id: c, texto: `${texto(c, compra)} ${texto(no, compra)}${texto(f, compra)}` }]);
    return { mensaje: { ids: [...m.ids, no, f], texto: m.texto }, rot: r };
  }
  if (p.tipo === 'antes-en-viaje') partes.push({ id: p.ids[0], texto: textoYaDeViaje(p.ids[0], compra) });
  else if (p.tipo === 'propia') partes.push({ id: p.ids[0], texto: texto(p.ids[0], compra, p.pregunta) });
  else partes.push(parte(p.ids[0], compra));
  return { mensaje: juntar(partes), rot: r };
}

const NOCHES_DEL_VIAJE: ReadonlySet<string> = new Set(['noche', 'antes-en-viaje', 'propia', 'FN1']);

// ── Reacciones a lo que contesta ─────────────────────────────────────────────

export type QueSeContesta =
  // Antes de salir. `siguiente`: la que sigue; 'fin' si no hay más (se contestó VA1);
  // 'callada' si la cadena se calló por la fecha (el día de salida o después).
  | { tipo: 'cadena'; siguiente: IdAntes | 'fin' | 'callada' }
  // `quedaNoche`: si ese día queda una pregunta de noche más tarde (habilita
  // ACM3/ACM4, "Hasta la noche"). Sin el dato, false.
  // `quedaOtra`: si ese día llega otra pregunta programada más tarde (quedaOtraEseDia):
  // con "paso", PAS-V2 en vez de PAS-V. Sin el dato, false.
  | { tipo: TipoProgramado | 'foto-suelta'; quedaNoche?: boolean; quedaOtra?: boolean };

/** Lo que mandó la persona. `idMensaje`: el id de WhatsApp de su mensaje (para la reacción ❤️). */
export type Respuesta = { tipo: 'audio' | 'texto' | 'foto' | 'paso'; audioMal?: boolean; idMensaje?: string };

/** Una reacción de WhatsApp sobre el mensaje de la persona: no es un mensaje, no lleva texto. */
export type ReaccionEmoji = { tipo: 'reaccion'; emoji: '❤️'; aMensaje: string | null };

export type Reaccion = {
  /** Mensajes de texto a mandar, en orden (cada uno es un mensaje de WhatsApp aparte). */
  mensajes: Mensaje[];
  /** Reacciones ❤️ (mediodía, VU0, fotos sueltas). */
  reacciones: ReaccionEmoji[];
  rot: Rotacion;
  /** false si el audio llegó mal (COR): la pregunta sigue abierta. */
  contestada: boolean;
  /** true después de CA1: acaba de salir AL1 (o AL1-P) y arranca el álbum. */
  abreAlbum: boolean;
};

/** Donde el acuse es una reacción ❤️ (simulaciones). */
const CON_CORAZON: ReadonlySet<string> = new Set(['MD', 'VU0', 'foto-suelta']);

/** Donde un texto dispara TXT: las que piden contar. El mediodía y VU0 son foto o frase. */
const NARRATIVAS: ReadonlySet<string> = new Set(['cadena', 'UC1', 'ID1', 'noche', 'antes-en-viaje', 'propia', 'FN1', 'VU1', 'IV1', 'CA1']);
const DE_NOCHE: ReadonlySet<string> = new Set(['noche', 'antes-en-viaje', 'propia', 'FN1']);

export function reaccion(de: QueSeContesta, respuesta: Respuesta, compra: Compra, rot: Rotacion): Reaccion {
  const listo = (mensajes: Mensaje[], r: Rotacion, abreAlbum = false): Reaccion => ({ mensajes, reacciones: [], rot: r, contestada: true, abreAlbum });

  if (respuesta.audioMal) return { mensajes: [juntar([parte('COR', compra)])], reacciones: [], rot, contestada: false, abreAlbum: false };

  const escribio = respuesta.tipo === 'texto';
  const usaTxt = escribio && NARRATIVAS.has(de.tipo) && rot.txtUsados < MAX_TXT;
  const conTxt: Rotacion = usaTxt ? { ...rot, txtUsados: rot.txtUsados + 1 } : rot;
  // "Lo escuché" no va si no hubo nada que escuchar: solo texto o solo fotos.
  const sinAudio = respuesta.tipo === 'texto' || respuesta.tipo === 'foto';
  const sinLoEscuche = (ids: readonly string[], fuera: string) => (sinAudio ? ids.filter((id) => id !== fuera) : ids);
  const txt = juntar([parte('TXT', compra)]);

  if (de.tipo === 'cadena') {
    const sig = de.siguiente;
    const soloAcm = () => {
      const e = elegirRotando('ACM', rot, ACM_SIN_NOCHE);
      return listo([juntar([parte(e.id, compra)])], e.rot);
    };
    if (sig === 'callada') {
      // Ya es el día de salida: no se promete nada (ni PAS-A2 ni la siguiente).
      if (usaTxt) return listo([txt], conTxt);
      return soloAcm();
    }
    if (sig === 'fin') {
      if (respuesta.tipo === 'paso') return listo([juntar([parte('PAS-A2', compra)])], rot);
      if (usaTxt) return listo([txt], conTxt);
      return soloAcm();
    }
    if (respuesta.tipo === 'paso') return listo([juntar([parte('PAS-A', compra), parte(sig, compra)])], rot);
    // TXT va solo; la siguiente, en su propio mensaje.
    if (usaTxt) return listo([txt, juntar([parte(sig, compra)])], conTxt);
    let permitidos = sinLoEscuche(GRUPOS.ACA, 'ACA2');
    if (sig === 'AS2' || sig === 'VA1') permitidos = permitidos.filter((id) => id !== 'ACA1');
    const e = elegirRotando('ACA', rot, permitidos);
    return listo([juntar([parte(e.id, compra), parte(sig, compra)])], e.rot);
  }

  if (de.tipo === 'CA1') {
    if (respuesta.tipo === 'paso') return listo([juntar([parte('AL1-P', compra)])], rot, true);
    if (usaTxt) return listo([txt, juntar([parte('AL1-P', compra)])], conTxt, true);
    return listo([juntar([parte('AL1', compra)])], rot, true);
  }

  if (respuesta.tipo === 'paso') return listo([juntar([parte(de.quedaOtra ? 'PAS-V2' : 'PAS-V', compra)])], rot);
  if (usaTxt) return listo([txt], conTxt);
  if (CON_CORAZON.has(de.tipo)) {
    return { mensajes: [], reacciones: [{ tipo: 'reaccion', emoji: '❤️', aMensaje: respuesta.idMensaje ?? null }], rot, contestada: true, abreAlbum: false };
  }

  const e = DE_NOCHE.has(de.tipo)
    ? elegirRotando('ACN', rot, sinLoEscuche(GRUPOS.ACN, 'ACN3'))
    : elegirRotando('ACM', rot, de.quedaNoche ? undefined : ACM_SIN_NOCHE);
  return listo([juntar([parte(e.id, compra)])], e.rot);
}

// ── Despedida ────────────────────────────────────────────────────────────────

const ANTES_DE_DES_MAS = 'Fue lindo acompañarte';

/** DES; con DES+ adentro, antes de "Fue lindo acompañarte", si mandó más fotos de las que entran. */
export function despedida(compra: Compra, fotosMandadas: number): Mensaje {
  const des = texto('DES', compra);
  if (fotosMandadas <= compra.fotosAlbum) return { ids: ['DES'], texto: des };
  if (!des.includes(ANTES_DE_DES_MAS)) throw new Error(`DES ya no dice "${ANTES_DE_DES_MAS}": no sé dónde meter DES+`);
  return { ids: ['DES', 'DES+'], texto: des.replace(ANTES_DE_DES_MAS, `${texto('DES+', compra)} ${ANTES_DE_DES_MAS}`) };
}
