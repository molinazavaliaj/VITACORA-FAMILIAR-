// Simulador de Vitácora de Viaje V2: corre MUCHOS viajes inventados de punta
// a punta con el código de verdad (src/viaje-v2/) y revisa invariantes sobre
// TODOS los mensajes que salen. Semilla fija: todo se puede repetir.
//
//   npx tsx scripts/viaje-v2-simular.ts                 # 2400 viajes + resumen.md + las 3 lecturas
//   npx tsx scripts/viaje-v2-simular.ts 500             # otra cantidad (no escribe nada)
//   npx tsx scripts/viaje-v2-simular.ts --semilla 123   # un viaje, mensaje por mensaje, y sus violaciones
//   npx tsx scripts/viaje-v2-simular.ts --semilla 123 --idioma ca
//
// Idiomas: las 2400 semillas en es-AR, y 800 en ca y 800 en es-ES (la misma
// semilla da el mismo viaje; cambia el idioma de la compra y lo que escribe la
// persona). Lo que la persona escribe ("paso", "ja està", "vale"…) pasa por el
// detector de verdad (palabras.ts): si no lo entiende, invariante l3.
//
// El "planificador" de acá imita a lectura.ts (el que falta conectar a
// WhatsApp lo va a hacer Joaquín), con estas decisiones propias, anotadas en
// docs/viajes-v2/simulaciones/resumen.md:
//   · BIEN-1 sale al comprar (corrido a las 8:00 si cae en la franja).
//   · UC1 con un SÍ tardío el día de salida: 2 horas después (momentoUC1);
//     lo demás programado que ya pasó cuando dice SÍ no sale (queda "vencido").
//   · AL1 sale a las 10:00 del día siguiente de CA1 (momentoAL1); AL1-P si CA1
//     fue "paso" o quedó sin respuesta.
//   · El calendario definitivo se arma justo antes de ID1 (o IV1): recién ahí
//     se sabe qué quedó pendiente de antes de salir.
//   · La persona contesta cada pregunta antes de que llegue la siguiente.
//
// Personas y viajes INVENTADOS. Nunca usar acá la vida de un narrador real.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { iniciarAlbum, pasoAlbum, type EstadoAlbum, type EventoAlbum } from '../src/viaje-v2/album.js';
import { porId } from '../src/viaje-v2/banco.js';
import { idiomaDe, IDIOMAS, type Idioma } from '../src/viaje-v2/idioma.js';
import { entender, type Entendido } from '../src/viaje-v2/palabras.js';
import {
  armarCalendario,
  CADENA_ANTES,
  momentoAL1,
  quedaAL1EseDia,
  momentoUC1,
  validarCompra,
  momentoDeLaSiguiente,
  momentoRecordatorio,
  pendientesAntes,
  quedaNocheEseDia,
  quedaOtraEseDia,
  siguienteDeLaCadena,
  type Calendario,
  type IdAntes,
  type Programado,
} from '../src/viaje-v2/calendario.js';
import { anotarEnvio, anotarRespuesta, contestadasAntes, nocheAnterior, nochesSinContestar, nuevoEstado, pendientesParaElViaje, type Estado } from '../src/viaje-v2/estado.js';
import { aInstante, aLocal, diaDeSemana, diasEntre, nombreDeZona, respetarFranja, sumarDias } from '../src/viaje-v2/horas.js';
import { alDecirSi, arranque, mensajeAlbum, partirDes, preguntaProgramada, reaccion, recordatorioAntes, type ReaccionEmoji, type Respuesta } from '../src/viaje-v2/mensajes.js';
import { datosDeCompra, renderizar } from '../src/viaje-v2/texto.js';
import type { Compra, Mensaje, Zona } from '../src/viaje-v2/tipos.js';

// ── Azar con semilla ─────────────────────────────────────────────────────────

export type Azar = { (): number; entre(a: number, b: number): number; uno<T>(xs: readonly T[]): T; si(p: number): boolean };

export function azar(semilla: number): Azar {
  let s = semilla >>> 0 || 1;
  const f = (() => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Azar;
  f.entre = (a, b) => a + Math.floor(f() * (b - a + 1));
  f.uno = (xs) => xs[Math.floor(f() * xs.length)];
  f.si = (p) => f() < p;
  return f;
}

const MIN = 60_000;
const HORA = 3_600_000;
const mas = (t: Date, ms: number) => new Date(t.getTime() + ms);

// ── La persona ───────────────────────────────────────────────────────────────

export type Intento = { en: Date; respuesta: Respuesta; dice: string; fotos?: number };
/** Una pregunta que le llegó: qué, cuándo, y hasta cuándo puede contestar (lo próximo que llega). */
export type Pregunta = { clave: string; tipo: string; ids: string[]; enviada: Date; zona: Zona; fecha: string; limite: Date | null; dia?: number };
export type GestoAlbum = { en: Date; evento: 'foto' | 'listo' | 'si' | 'no' | 'otra' | 'reenvio'; cantidad?: number; ids?: string[]; dice: string };

export interface Persona {
  si(bien1: Date): { en: Date; dice: string };
  contestar(q: Pregunta): Intento[];
  trasRecordatorio(q: Pregunta): Intento[];
  sueltas(programados: readonly Programado[]): { en: Date; dice: string }[];
  album(al1: Date): GestoAlbum[];
  alAL2(al2: Date, numero: number): GestoAlbum | null;
  /** Qué hace con AL3 ("reenviame las que saco"): `ids` son las del álbum, entran `entran`. */
  alAL3(al3: Date, ids: readonly string[], entran: number): GestoAlbum | null;
  /** Cuándo decide Naza cerrar un álbum con cero fotos. */
  nazaCierra(aviso: Date): Date;
}

// ── Lo que queda del viaje ───────────────────────────────────────────────────

export type Origen = 'arranque' | 'cadena' | 'reaccion' | 'programado' | 'recordatorio' | 'album-reloj' | 'album-reaccion' | 'naza';

export type Enviado = {
  en: Date;
  zona: Zona;
  ids: string[];
  texto: string;
  origen: Origen;
  /** Sale por reloj (no como respuesta inmediata a algo que mandó la persona). */
  iniciativa: boolean;
  programado?: Programado;
  reaccionA?: { tipo: string; respuesta: Respuesta };
};

export type Linea = { instante: Date; zona: Zona; de: 'vita' | 'persona' | 'nota' | 'corazon'; texto: string; ids?: string[] };
/**
 * Una reacción ❤️ de WhatsApp (no es un mensaje): a qué tipo de pregunta
 * respondía, a qué mensaje apunta (`aMensaje`, lo que devolvió el código) y a
 * cuál tenía que apuntar (`esperado`, el id del mensaje de la persona).
 */
export type Corazon = { en: Date; zona: Zona; a: string; aMensaje: string | null; esperado: string };

export type Resultado = {
  compra: Compra;
  enviados: Enviado[];
  corazones: Corazon[];
  /** Los ids de las fotos sueltas que llegaron fuera del álbum (cada una tiene que llevar su ❤️). */
  sueltasIds: string[];
  lineas: Linea[];
  calPrevio: Calendario;
  cal: Calendario | null;
  estado: Estado;
  album: EstadoAlbum | null;
  siEn: Date;
  al1En: Date | null;
  desEn: Date | null;
  avisosAlbum: Date[];
  nazaDecide: Date | null;
  vencidos: Programado[];
  fotosTarde: number;
  /** Lo que escribió la persona y el detector entendió mal (invariante l3). */
  malEntendidos: string[];
  error?: string;
};

// ── La cola de eventos ───────────────────────────────────────────────────────

class Cola {
  private evs: { t: number; n: number; f: () => void }[] = [];
  private n = 0;
  push(t: Date, f: () => void) {
    const ev = { t: t.getTime(), n: this.n++, f };
    let i = this.evs.length;
    while (i > 0 && (this.evs[i - 1].t > ev.t || (this.evs[i - 1].t === ev.t && this.evs[i - 1].n > ev.n))) i--;
    this.evs.splice(i, 0, ev);
  }
  pop() {
    return this.evs.shift();
  }
}

const NOCHES = new Set(['noche', 'antes-en-viaje', 'propia', 'FN1']);
export const esCadena = (id: string): id is IdAntes => (CADENA_ANTES as readonly string[]).includes(id);

/** Un viaje de punta a punta con el código de verdad. */
export function simular(compra: Compra, compraEn: Date, persona: Persona): Resultado {
  const cola = new Cola();
  const casa = compra.zonaCasa;
  const enviados: Enviado[] = [];
  const corazones: Corazon[] = [];
  const sueltasIds: string[] = [];
  let idsPersona = 0;
  /** Un id de WhatsApp inventado para cada mensaje de la persona. */
  const nuevoId = () => `wamid.${++idsPersona}`;
  const lineas: Linea[] = [];
  let estado: Estado = nuevoEstado();
  const calPrevio = armarCalendario(compra, [...CADENA_ANTES]);
  let cal: Calendario | null = null;
  let album: EstadoAlbum | null = null;
  const vencidos: Programado[] = [];
  const avisosAlbum: Date[] = [];
  let al1En: Date | null = null;
  let desEn: Date | null = null;
  let nazaDecide: Date | null = null;
  let fotosTarde = 0;
  const programados = () => (cal ?? calPrevio).programados;
  const idioma = idiomaDe(compra);
  const malEntendidos: string[] = [];
  /** Lo que escribió (si `dice` es "texto: …"), por el detector del idioma. */
  const escrito = (dice: string): string | null => (dice.startsWith('texto: ') ? dice.slice('texto: '.length) : null);
  /** La respuesta como la entiende el sistema: "paso" solo si el detector lo entiende. */
  const leer = (it: Intento): Intento => {
    const t = escrito(it.dice);
    if (t === null) return it;
    const e = entender(t, idioma);
    const quiso: Entendido | null = it.respuesta.tipo === 'paso' ? 'paso' : null;
    if (e !== quiso && !(quiso === null && e !== 'paso')) malEntendidos.push(`"${t}" (${idioma}): quiso ${quiso ?? 'contar'} y entendió ${e ?? 'nada'}`);
    if (quiso === 'paso' && e !== 'paso') return { ...it, respuesta: { ...it.respuesta, tipo: 'texto' } };
    if (quiso === null && e === 'paso') return { ...it, respuesta: { ...it.respuesta, tipo: 'paso' } };
    return it;
  };

  const mandar = (en: Date, zona: Zona, m: Mensaje, origen: Origen, iniciativa: boolean, extra: Partial<Enviado> = {}) => {
    enviados.push({ en, zona, ids: m.ids, texto: m.texto, origen, iniciativa, ...extra });
    lineas.push({ instante: en, zona, de: 'vita', texto: m.texto, ids: m.ids });
  };
  const decir = (en: Date, zona: Zona, dice: string) => lineas.push({ instante: en, zona, de: 'persona', texto: dice });
  const nota = (en: Date, zona: Zona, texto: string) => lineas.push({ instante: en, zona, de: 'nota', texto });
  const corazon = (en: Date, zona: Zona, x: ReaccionEmoji, a: string, esperado: string) => {
    corazones.push({ en, zona, a, aMensaje: x.aMensaje, esperado });
    lineas.push({ instante: en, zona, de: 'corazon', texto: x.emoji });
  };
  const vencido = (p: Programado) => vencidos.includes(p);
  /** Lo próximo que llega por reloj después de t (del calendario vigente). */
  const proxima = (t: Date): Date | null => {
    let min: Date | null = null;
    for (const p of programados()) if (p.instante > t && !vencido(p) && (!min || p.instante < min)) min = p.instante;
    return min;
  };
  const minDate = (a: Date | null, b: Date | null) => (!a ? b : !b ? a : a < b ? a : b);

  // ── Arranque ──
  const bien1En = respetarFranja(compraEn, casa);
  mandar(bien1En, casa, arranque(compra), 'arranque', true);
  const si = persona.si(bien1En);
  const siEn = si.en;
  // El primero en el tiempo (no en la lista: con la noche a las 07:00, la noche del día 1 sale antes que ID1).
  const primeroEnViaje = Math.min(...calPrevio.programados.filter((p) => p.dia >= 1).map((p) => p.instante.getTime()));
  const armarEn = new Date(Math.max(primeroEnViaje - 1, siEn.getTime() + 1));
  const limiteCadena = (t: Date) => minDate(proxima(t), armarEn);

  cola.push(siEn, () => {
    decir(siEn, casa, si.dice);
    const t = escrito(si.dice);
    if (t !== null && entender(t, idioma) !== 'si') malEntendidos.push(`"${t}" (${idioma}): quiso SÍ y entendió ${entender(t, idioma) ?? 'nada'}`);
    const [b2, as1] = alDecirSi(compra, siEn);
    mandar(siEn, casa, b2, 'reaccion', false);
    mandar(siEn, casa, as1, 'arranque', false);
    const yaDeViaje = aLocal(siEn, casa).fecha > compra.salida;
    estado = anotarEnvio(estado, { clave: 'AS1', tipo: 'cadena', ids: ['AS1'], en: siEn.toISOString(), ...(yaDeViaje ? { yaDeViaje } : {}) });
    preguntarCadena('AS1', siEn);
  });

  for (const p of calPrevio.programados.filter((x) => x.dia === 0)) {
    const t = p.tipo === 'UC1' ? momentoUC1(p, siEn, compra) : p.instante >= siEn ? p.instante : null;
    if (!t) {
      vencidos.push(p);
      nota(siEn, casa, `${p.ids[0]} ya pasó (${p.hora}) cuando dijo SÍ: no sale.`);
    } else if (t.getTime() !== p.instante.getTime()) {
      const corrido = { ...p, instante: t, ...aLocal(t, p.zona) };
      nota(siEn, casa, `${p.ids[0]} ya pasó (${p.hora}) cuando dijo SÍ: sale 2 horas después.`);
      cola.push(t, () => enviarProgramado(corrido));
    } else cola.push(p.instante, () => enviarProgramado(p));
  }

  cola.push(armarEn, () => {
    cal = armarCalendario(compra, pendientesParaElViaje(estado));
    for (const aviso of cal.avisosNaza) nota(armarEn, casa, `Aviso a Naza: ${aviso}`);
    for (const p of cal.programados.filter((x) => x.dia >= 1)) {
      if (p.instante.getTime() < armarEn.getTime()) {
        vencidos.push(p);
        nota(armarEn, p.zona, `${p.ids[0]} ya pasó: no sale.`);
      } else cola.push(p.instante, () => enviarProgramado(p));
    }
    for (const s of persona.sueltas(cal.programados)) {
      if (s.en <= armarEn) continue; // antes de armar el calendario todavía no está de viaje
      cola.push(s.en, () => {
        if (al1En) return; // ya está el álbum abierto: esas van al álbum, no son sueltas
        decir(s.en, compra.zonaViaje, s.dice);
        const idMensaje = nuevoId();
        sueltasIds.push(idMensaje);
        const r = reaccion({ tipo: 'foto-suelta', quedaNoche: quedaNocheEseDia(programados(), s.en) }, { tipo: 'foto', idMensaje }, compra, estado.rotacion);
        estado = { ...estado, rotacion: r.rot, fotosSueltas: estado.fotosSueltas + 1 };
        for (const m of r.mensajes) mandar(s.en, compra.zonaViaje, m, 'reaccion', false, { reaccionA: { tipo: 'foto-suelta', respuesta: { tipo: 'foto' } } });
        for (const x of r.reacciones) corazon(s.en, compra.zonaViaje, x, 'foto-suelta', idMensaje);
      });
    }
  });

  // ── Antes de salir ──
  function preguntarCadena(id: IdAntes, t: Date) {
    const q: Pregunta = { clave: id, tipo: 'cadena', ids: [id], enviada: t, zona: casa, fecha: aLocal(t, casa).fecha, limite: limiteCadena(t) };
    for (const it of persona.contestar(q)) if (it.en > t && (!q.limite || it.en < q.limite)) cola.push(it.en, () => responderCadena(id, it));
    const rec = momentoRecordatorio(t, compra, estado.recordatorioAntes);
    if (rec && (!q.limite || rec < q.limite)) cola.push(rec, () => recordar(id, rec));
  }

  function recordar(id: IdAntes, en: Date) {
    const ultima = estado.envios.filter((x) => x.tipo === 'cadena').pop();
    if (estado.recordatorioAntes || ultima?.clave !== id || contestadasAntes(estado).has(id)) return;
    nota(en, casa, `${id} lleva 3 días sin respuesta.`);
    mandar(en, casa, recordatorioAntes(compra, id), 'recordatorio', true);
    estado = { ...estado, recordatorioAntes: true };
    const q: Pregunta = { clave: id, tipo: 'cadena', ids: [id], enviada: en, zona: casa, fecha: aLocal(en, casa).fecha, limite: limiteCadena(en) };
    for (const it of persona.trasRecordatorio(q)) if (it.en > en && (!q.limite || it.en < q.limite)) cola.push(it.en, () => responderCadena(id, it));
  }

  function responderCadena(id: IdAntes, it0: Intento) {
    if (contestadasAntes(estado).has(id)) return;
    const it = leer(it0);
    decir(it.en, casa, it.dice);
    estado = anotarRespuesta(estado, id, { ...it.respuesta, en: it.en.toISOString() });
    const reaccionA = { tipo: 'cadena', respuesta: it.respuesta };
    if (it.respuesta.audioMal) {
      const r = reaccion({ tipo: 'cadena', siguiente: 'callada' }, it.respuesta, compra, estado.rotacion);
      estado = { ...estado, rotacion: r.rot };
      for (const m of r.mensajes) mandar(it.en, casa, m, 'reaccion', false, { reaccionA });
      return;
    }
    const sig = siguienteDeLaCadena(id);
    const cuando = momentoDeLaSiguiente(it.en, compra);
    const r = reaccion({ tipo: 'cadena', siguiente: !cuando ? 'callada' : (sig ?? 'fin') }, it.respuesta, compra, estado.rotacion);
    estado = { ...estado, rotacion: r.rot };
    const en = cuando ?? it.en;
    const salir = () => {
      for (const m of r.mensajes) mandar(en, casa, m, m.ids.some(esCadena) ? 'cadena' : 'reaccion', false, { reaccionA });
      if (sig && cuando) {
        estado = anotarEnvio(estado, { clave: sig, tipo: 'cadena', ids: [sig], en: cuando.toISOString() });
        preguntarCadena(sig, cuando);
      }
    };
    if (en > it.en) cola.push(en, salir);
    else salir();
  }

  // ── El viaje ──
  function enviarProgramado(p: Programado) {
    const q0 = preguntaProgramada(p, compra, nochesSinContestar(estado), estado.rotacion, nocheAnterior(estado)?.ids);
    estado = { ...estado, rotacion: q0.rot };
    if (q0.mensaje.ids.some((id) => id.startsWith('ATR'))) nota(p.instante, p.zona, 'La noche anterior quedó sin contestar.');
    mandar(p.instante, p.zona, q0.mensaje, 'programado', true, { programado: p });
    estado = anotarEnvio(estado, { clave: p.clave, tipo: p.tipo, ids: p.ids, en: p.instante.toISOString() });
    const al1 = p.tipo === 'CA1' ? momentoAL1(p, compra) : null;
    const q: Pregunta = { clave: p.clave, tipo: p.tipo, ids: p.ids, enviada: p.instante, zona: p.zona, fecha: p.fecha, limite: al1 ?? proxima(p.instante), dia: p.dia };
    for (const it of persona.contestar(q)) if (it.en > p.instante && (!q.limite || it.en < q.limite)) cola.push(it.en, () => responder(p, it));
    if (al1) {
      // AL1 a las 10:00 del día siguiente: AL1 si contestó CA1; AL1-P si dijo "paso" o no contestó.
      cola.push(al1, () => {
        const envio = estado.envios.filter((x) => x.clave === p.clave).pop();
        const contesto = envio?.respuestas.some((r) => !r.audioMal && r.tipo !== 'paso') ?? false;
        if (!envio?.respuestas.some((r) => !r.audioMal)) nota(al1, casa, 'CA1 quedó sin respuesta: sale AL1-P igual.');
        mandar(al1, casa, mensajeAlbum(compra, contesto ? 'AL1' : 'AL1-P'), 'album-reloj', true);
        abrirAlbum(al1);
      });
    }
  }

  function responder(p: Programado, it0: Intento) {
    const it = leer(it0);
    const envio = estado.envios.filter((x) => x.clave === p.clave).pop();
    if (envio?.respuestas.some((r) => !r.audioMal)) return;
    decir(it.en, p.zona, it.fotos ? `${it.dice} + ${it.fotos === 1 ? 'una foto' : `${it.fotos} fotos`}` : it.dice);
    const idMensaje = nuevoId();
    const r = reaccion(
      {
        tipo: p.tipo,
        quedaNoche: quedaNocheEseDia(programados(), it.en),
        quedaOtra: quedaOtraEseDia(programados(), it.en) || (p.tipo === 'CA1' && quedaAL1EseDia(p, it.en, compra)),
      },
      { ...it.respuesta, idMensaje },
      compra,
      estado.rotacion,
    );
    estado = { ...estado, rotacion: r.rot, fotosSueltas: estado.fotosSueltas + (it.fotos ?? 0) };
    estado = anotarRespuesta(estado, p.clave, { ...it.respuesta, en: it.en.toISOString() });
    for (const m of r.mensajes) mandar(it.en, p.zona, m, 'reaccion', false, { reaccionA: { tipo: p.tipo, respuesta: it.respuesta } });
    for (const x of r.reacciones) corazon(it.en, p.zona, x, p.tipo, idMensaje);
  }

  // ── El álbum ──
  function abrirAlbum(t: Date) {
    al1En = t;
    album = iniciarAlbum(t, compra);
    reloj();
    for (const g of persona.album(t)) cola.push(g.en, () => gesto(g));
  }

  function reloj() {
    if (album?.vence) {
      const v = new Date(album.vence);
      cola.push(v, () => aplicar({ tipo: 'reloj', en: v }, 'album-reloj'));
    }
  }

  function gesto(g: GestoAlbum) {
    decir(g.en, casa, g.dice);
    if (!album) return;
    // Lo escrito pasa por el detector: "listo", "sí", "no" o cualquier otra cosa.
    let evento = g.evento;
    const t = escrito(g.dice);
    if (t !== null && evento !== 'foto' && evento !== 'reenvio') {
      const e = entender(t, idioma);
      const leido = e === 'listo' || e === 'si' || e === 'no' ? e : 'otra';
      if (leido !== evento) malEntendidos.push(`"${t}" (${idioma}, álbum): quiso ${evento} y entendió ${leido}`);
      evento = leido;
    }
    const ev: EventoAlbum =
      evento === 'foto'
        ? { tipo: 'foto', en: g.en, cantidad: g.cantidad }
        : evento === 'reenvio'
          ? { tipo: 'reenvio', en: g.en, ids: g.ids ?? [] }
          : { tipo: evento, en: g.en };
    aplicar(ev, 'album-reaccion');
  }

  function aplicar(ev: EventoAlbum, origen: Origen) {
    if (!album) return;
    const antes = album.vence;
    const r = pasoAlbum(album, ev, compra);
    album = r.estado;
    for (const s of r.salidas) {
      if (s.tipo === 'mensaje') {
        mandar(ev.en, casa, s.mensaje, origen, origen !== 'album-reaccion');
        if (s.mensaje.ids.includes('AL2')) {
          const g = persona.alAL2(ev.en, album.al2Mandados);
          if (g) cola.push(g.en, () => gesto(g));
        }
        if (s.mensaje.ids.includes('AL3')) {
          const g = persona.alAL3(ev.en, album.ids, compra.fotosAlbum);
          if (g) cola.push(g.en, () => gesto(g));
        }
        if (s.mensaje.ids.includes('DES')) desEn = ev.en;
      } else if (s.tipo === 'avisar-naza') {
        avisosAlbum.push(ev.en);
        nota(ev.en, casa, `Aviso a Naza: ${s.motivo}`);
        const d = persona.nazaCierra(ev.en);
        nazaDecide = d;
        cola.push(d, () => {
          nota(d, casa, 'Naza decide cerrar el álbum.');
          aplicar({ tipo: 'naza-cierra', en: d }, 'naza');
        });
      } else if (s.tipo === 'cerrado') {
        nota(ev.en, casa, `Se cierra el álbum: ${album.fotos} fotos quedan, guardadas ${s.guardadas}, afuera ${s.descartadas}.`);
      } else {
        fotosTarde += s.cantidad;
        nota(ev.en, casa, `${s.cantidad} fotos después del cierre: al panel, sin contestar.`);
      }
    }
    if (album.vence && album.vence !== antes) reloj();
  }

  let error: string | undefined;
  try {
    let pasos = 0;
    for (let ev = cola.pop(); ev; ev = cola.pop()) {
      ev.f();
      if (++pasos > 100_000) throw new Error('El viaje no termina (más de 100.000 eventos)');
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return { compra, enviados, corazones, sueltasIds, lineas, calPrevio, cal, estado, album, siEn, al1En, desEn, avisosAlbum, nazaDecide, vencidos, fotosTarde, malEntendidos, error };
}

// ── Los viajes inventados ────────────────────────────────────────────────────

export const ZONAS = {
  ba: 'America/Argentina/Buenos_Aires',
  madrid: 'Europe/Madrid',
  cdmx: 'America/Mexico_City',
  tokio: 'Asia/Tokyo',
  ny: 'America/New_York',
  montevideo: 'America/Montevideo',
} as const;

/** La compra pide al menos 3 días (banco.md, simulaciones). */
export const DURACIONES = [3, 4, 5, 7, 10, 15, 30, 60] as const;
export const CONDUCTAS = ['todo', 'nunca', 'azar', 'paso', 'escribe', 'cortados', 'saltea', 'sueltas'] as const;
export const ALBUMES = ['cero', 'pocas', 'justas', 'demas', 'tandas'] as const;
export type Conducta = (typeof CONDUCTAS)[number];
export type ConductaAlbum = (typeof ALBUMES)[number];

// Por idioma, con el mismo largo en cada lista: así la misma semilla da el
// mismo viaje en los tres (cambian el idioma, los nombres y las palabras).
const NOMBRES_DE: Record<Idioma, string[]> = {
  'es-AR': ['Aurora', 'Benicio', 'Clara', 'Dante', 'Elena', 'Fermín', 'Greta', 'Hugo', 'Inés', 'Julián'],
  'es-ES': ['Alba', 'Bruno', 'Carmen', 'Diego', 'Elena', 'Fermín', 'Gloria', 'Hugo', 'Inés', 'Javier'],
  ca: ['Aina', 'Biel', 'Clara', 'Dídac', 'Elna', 'Ferran', 'Gemma', 'Hug', 'Ivet', 'Jan'],
};
const REGALAN_DE: Record<Idioma, string[]> = {
  'es-AR': ['su hija', 'Pilar', 'Matías', 'la abuela Rosa', 'Tere'],
  'es-ES': ['su hija', 'Pilar', 'Matías', 'la abuela Rosa', 'Tere'],
  ca: ['la seva filla', 'Pilar', 'Martí', "l'àvia Rosa", 'Tere'],
};
const PROPIAS_DE: Record<Idioma, string[]> = {
  'es-AR': [
    '¿Qué fue lo más rico que probaste?',
    '¿A quién te acordaste de contarle algo?',
    '¿Qué te dio miedo y lo hiciste igual?',
    '¿Qué lugar volverías a visitar mañana mismo?',
    '¿Qué te sorprendió de vos en este viaje?',
    '¿Qué canción te acompañó?',
    '¿Cómo te trató la gente de allá?',
  ],
  'es-ES': [
    '¿Qué es lo más rico que has probado?',
    '¿De quién te has acordado para contarle algo?',
    '¿Qué te dio miedo y lo hiciste igualmente?',
    '¿Qué sitio volverías a visitar mañana mismo?',
    '¿Qué te ha sorprendido de ti en este viaje?',
    '¿Qué canción te ha acompañado?',
    '¿Cómo te ha tratado la gente de allí?',
  ],
  ca: [
    'Què és el més bo que has tastat?',
    "De qui t'has recordat per explicar-li alguna cosa?",
    'Què et va fer por i ho vas fer igualment?',
    'Quin lloc tornaries a visitar demà mateix?',
    "Què t'ha sorprès de tu en aquest viatge?",
    "Quina cançó t'ha acompanyat?",
    "Com t'ha tractat la gent d'allà?",
  ],
};

/** Cómo escribe la gente las palabras del sistema, en cada idioma (y en catalán, mezclando). */
export const DICHOS: Record<Idioma, Record<Entendido | 'otra', string[]>> = {
  'es-AR': { si: ['SÍ', 'sí', 'Sí!', 'dale', 'si'], paso: ['paso', 'Paso', 'paso!'], listo: ['listo', 'Listo!', 'listo, son esas', 'ya está'], no: ['no, me faltan', 'no', 'todavía no'], otra: ['dejá, elegí vos'] },
  'es-ES': { si: ['SÍ', 'sí', 'vale', 'Vale!', 'venga', 'ok'], paso: ['paso', 'Paso de esta', 'me la salto'], listo: ['ya está', 'Ya está!', 'hecho', 'terminado', 'listo'], no: ['no, me faltan', 'todavía no', 'aún no'], otra: ['déjalo, elige tú'] },
  ca: { si: ['SÍ', 'sí', "d'acord", 'D’acord!', 'vale', 'ok'], paso: ['passo', 'Passo!', 'paso', 'la següent'], listo: ['ja està', 'Ja està!', 'fet', 'listo', 'ya está'], no: ["no, me'n falten", 'encara no', 'no'], otra: ['tria-les tu mateix'] },
};
/** Días cerca de un cambio de horario (Europa: 25/10/2026 y 28/3/2027; Estados Unidos: 1/11/2026 y 14/3/2027). */
const CAMBIOS_DE_HORA = ['2026-10-25', '2026-11-01', '2027-03-14', '2027-03-28'];
/** La compra pide la noche entre 19:00 y 22:30 (banco.md, simulaciones). */
const NOCHES_POSIBLES = ['21:30', '20:00', '19:00', '22:30', undefined] as const;

export type Escenario = {
  semilla: number;
  idioma: Idioma;
  compra: Compra;
  compraEn: Date;
  antelacion: number;
  dias: number;
  conducta: Conducta;
  conductaAlbum: ConductaAlbum;
  cruzaCambioDeHora: boolean;
};

/** El viaje número `semilla`: la duración y la conducta rotan con la semilla (cobertura pareja); lo demás, al azar. */
export function escenario(semilla: number, idioma: Idioma = 'es-AR'): Escenario {
  const NOMBRES = NOMBRES_DE[idioma];
  const REGALAN = REGALAN_DE[idioma];
  const PROPIAS = PROPIAS_DE[idioma];
  const r = azar(semilla * 7919 + 17);
  const k = semilla % 9;
  const dias = k < 8 ? DURACIONES[k] : r.entre(3, 45);
  const conducta = CONDUCTAS[Math.floor(semilla / 9) % CONDUCTAS.length];
  const conductaAlbum = ALBUMES[Math.floor(semilla / 72) % ALBUMES.length];
  const cruza = r.si(0.35);
  let salida: string;
  if (cruza) {
    const cambio = r.uno(CAMBIOS_DE_HORA);
    salida = sumarDias(cambio, -r.entre(0, Math.max(0, dias - 1)));
  } else {
    salida = sumarDias('2026-10-05', r.entre(0, 270));
  }
  const vuelta = sumarDias(salida, dias - 1);
  const casa = r.uno([ZONAS.ba, ZONAS.madrid, ZONAS.cdmx]);
  const viaje = r.uno([ZONAS.madrid, ZONAS.tokio, ZONAS.ba, ZONAS.ny]);
  const antelacion = r.uno([0, 1, 3, 20]);
  const hh = r.entre(8, 22);
  const mm = r.entre(0, 59);
  const compraEn = aInstante(sumarDias(salida, -antelacion), `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, casa);
  const regalo = r.si(0.5) ? { quienRegala: r.uno(REGALAN) } : undefined;
  const cuantas = r.entre(0, 5);
  const propias = Array.from({ length: cuantas }, (_, i) => PROPIAS[(semilla + i) % PROPIAS.length]);
  const horaNoche = r.uno(NOCHES_POSIBLES);
  const compra: Compra = {
    nombre: r.uno(NOMBRES),
    salida,
    vuelta,
    zonaCasa: casa,
    zonaViaje: viaje,
    ...(horaNoche ? { horaNoche } : {}),
    ...(regalo ? { regalo } : {}),
    preguntasPropias: propias,
    formato: r.si(0.5) ? 'pdf' : 'impreso',
    fotosAlbum: r.si(0.5) ? 20 : 40,
    ...(idioma !== 'es-AR' ? { idioma } : {}),
  };
  const cruzaCambioDeHora = CAMBIOS_DE_HORA.some((c) => diasEntre(sumarDias(compraEn.toISOString().slice(0, 10), -1), c) >= 0 && diasEntre(c, sumarDias(vuelta, 3)) >= 0);
  return { semilla, idioma, compra, compraEn, antelacion, dias, conducta, conductaAlbum, cruzaCambioDeHora };
}

const corta = (z: Zona) => ({ [ZONAS.ba]: 'Buenos Aires', [ZONAS.madrid]: 'Madrid', [ZONAS.cdmx]: 'CDMX', [ZONAS.tokio]: 'Tokio', [ZONAS.ny]: 'Nueva York', [ZONAS.montevideo]: 'Montevideo' })[z] ?? z;

export function describir(e: Escenario): string {
  const c = e.compra;
  const compraLocal = aLocal(e.compraEn, c.zonaCasa);
  return [
    `semilla ${e.semilla}${e.idioma !== 'es-AR' ? ` (${e.idioma})` : ''}: ${e.dias} ${e.dias === 1 ? 'día' : 'días'} (${c.salida} → ${c.vuelta})`,
    `compra ${e.antelacion === 0 ? 'el mismo día' : `${e.antelacion} ${e.antelacion === 1 ? 'día' : 'días'} antes`} a las ${compraLocal.hora}`,
    `${corta(c.zonaCasa)} → ${corta(c.zonaViaje)}`,
    `noche ${c.horaNoche ?? '21:30 (por defecto)'}`,
    c.regalo ? 'regalo' : 'para uno',
    `${c.preguntasPropias.length} propias`,
    `${c.formato}, álbum de ${c.fotosAlbum}`,
    `conducta ${e.conducta}, álbum ${e.conductaAlbum}`,
    e.cruzaCambioDeHora ? 'cruza cambio de hora' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** La persona inventada: contesta según su conducta, con su propio azar. */
export class PersonaSimulada implements Persona {
  private r: Azar;
  /** Aparte, para que elegir palabras no cambie el resto del viaje (es-AR queda igual que antes). */
  private rp: Azar;
  private salteadas = new Set<number>();
  constructor(
    private e: Escenario,
    semilla = e.semilla,
  ) {
    this.r = azar(semilla * 104729 + 3);
    this.rp = azar(semilla * 7307 + 11);
    if (e.conducta === 'saltea') {
      // Tandas de 2 a 4 noches seguidas sin contestar.
      for (let d = 1; d < e.dias + 1; ) {
        d += this.r.entre(1, 4);
        const largo = this.r.entre(2, 4);
        for (let k = 0; k < largo; k++) this.salteadas.add(d + k);
        d += largo;
      }
    }
  }

  /** Lo que escribe para decir eso, en su idioma. */
  private escribe(que: Entendido | 'otra'): string {
    return `texto: ${this.rp.uno(DICHOS[this.e.idioma][que])}`;
  }

  si(bien1: Date) {
    const d = this.r.si(0.06) ? this.r.entre(8 * 60, 26 * 60) : this.r.entre(2, 180);
    return { en: mas(bien1, d * MIN), dice: this.escribe('si') };
  }

  private demora(q: Pregunta): number {
    if (q.tipo === 'cadena') return this.r.entre(15, 36 * 60) * MIN;
    if (q.tipo === 'MD' || q.tipo === 'VU0') return this.r.entre(3, 120) * MIN;
    return this.r.entre(10, 240) * MIN;
  }

  private una(q: Pregunta, tipo: Respuesta['tipo'], extra = 0): Intento {
    const corta = q.tipo === 'MD' || q.tipo === 'VU0';
    const en = mas(q.enviada, this.demora(q) + extra);
    const fotos = !corta && NOCHES.has(q.tipo) && tipo !== 'paso' && this.r.si(0.4) ? this.r.entre(1, 4) : undefined;
    const dice = tipo === 'paso' ? this.escribe('paso') : tipo === 'texto' ? 'texto: lo cuenta por escrito' : tipo === 'foto' ? 'foto' : 'audio';
    return { en, respuesta: { tipo }, dice, ...(fotos ? { fotos } : {}) };
  }

  contestar(q: Pregunta): Intento[] {
    const corta = q.tipo === 'MD' || q.tipo === 'VU0';
    const normal: Respuesta['tipo'] = corta ? this.r.uno(['foto', 'audio'] as const) : 'audio';
    switch (this.e.conducta) {
      case 'nunca':
        return [];
      case 'todo':
      case 'sueltas':
        return [this.una(q, normal)];
      case 'azar': {
        if (this.r.si(0.45)) return [];
        const tipo = this.r.uno(['audio', 'audio', 'audio', 'texto', 'foto', 'paso'] as const);
        return [this.una(q, tipo)];
      }
      case 'paso':
        if (this.r.si(0.1)) return [];
        return [this.una(q, this.r.si(0.65) ? 'paso' : normal)];
      case 'escribe':
        return [this.una(q, corta ? this.r.uno(['foto', 'texto'] as const) : 'texto')];
      case 'cortados': {
        if (!this.r.si(0.45)) return [this.una(q, normal)];
        const mal = this.una(q, 'audio');
        const intentos: Intento[] = [{ ...mal, respuesta: { tipo: 'audio', audioMal: true }, dice: 'audio cortado, no se entiende', fotos: undefined }];
        if (this.r.si(0.7)) intentos.push({ ...mal, en: mas(mal.en, this.r.entre(5, 40) * MIN), dice: 'audio (de nuevo)' });
        return intentos;
      }
      case 'saltea':
        if (q.dia !== undefined && this.salteadas.has(q.dia) && (NOCHES.has(q.tipo) || this.r.si(0.5))) return [];
        return [this.una(q, normal)];
    }
  }

  trasRecordatorio(q: Pregunta): Intento[] {
    if (this.e.conducta === 'nunca' || !this.r.si(0.6)) return [];
    const pasa = this.e.conducta === 'paso';
    return [{ en: mas(q.enviada, this.r.entre(30, 24 * 60) * MIN), respuesta: { tipo: pasa ? 'paso' : 'audio' }, dice: pasa ? this.escribe('paso') : 'audio' }];
  }

  sueltas(programados: readonly Programado[]) {
    const c = this.e.compra;
    const n = diasEntre(c.salida, c.vuelta);
    const fuera: { en: Date; dice: string }[] = [];
    for (let d = 1; d <= n; d++) {
      const cuantas = this.e.conducta === 'sueltas' ? this.r.entre(1, 3) : this.r.si(0.1) ? 1 : 0;
      for (let k = 0; k < cuantas; k++) {
        const hh = this.r.entre(7, 24) % 24;
        const en = aInstante(sumarDias(c.salida, d + (hh < 7 ? 1 : 0)), `${String(hh).padStart(2, '0')}:${String(this.r.entre(0, 59)).padStart(2, '0')}`, c.zonaViaje);
        // Que no pise una pregunta abierta en el mismo minuto.
        if (programados.some((p) => Math.abs(p.instante.getTime() - en.getTime()) < 2 * MIN)) continue;
        fuera.push({ en, dice: 'foto suelta' });
      }
    }
    return fuera;
  }

  album(al1: Date): GestoAlbum[] {
    const n = this.e.compra.fotosAlbum;
    let t = mas(al1, this.r.entre(10, 12 * 60) * MIN);
    const gestos: GestoAlbum[] = [];
    const tanda = (cantidad: number) => {
      gestos.push({ en: t, evento: 'foto', cantidad, dice: `${cantidad} ${cantidad === 1 ? 'foto' : 'fotos'}` });
    };
    const listo = (p: number) => {
      if (this.r.si(p)) gestos.push({ en: mas(t, this.r.entre(2, 30) * MIN), evento: 'listo', dice: this.escribe('listo') });
    };
    const repartir = (total: number) => {
      const partes = this.r.entre(1, 3);
      let queda = total;
      for (let i = 0; i < partes && queda > 0; i++) {
        const c = i === partes - 1 ? queda : Math.max(1, Math.floor(queda / (partes - i)));
        tanda(c);
        queda -= c;
        t = mas(t, this.r.entre(2, 40) * MIN);
      }
    };
    switch (this.e.conductaAlbum) {
      case 'cero':
        listo(0.5);
        break;
      case 'pocas':
        tanda(this.r.entre(1, 5));
        listo(0.5);
        break;
      case 'justas':
        repartir(n);
        listo(0.7);
        break;
      case 'demas':
        repartir(n + this.r.entre(1, 25));
        listo(0.5);
        break;
      case 'tandas': {
        const cuantas = this.r.entre(3, 5);
        for (let i = 0; i < cuantas; i++) {
          tanda(this.r.entre(3, 12));
          if (i < cuantas - 1) t = mas(t, this.r.entre(6 * 60, 30 * 60) * MIN);
        }
        listo(0.4);
        break;
      }
    }
    return gestos;
  }

  alAL2(al2: Date): GestoAlbum | null {
    const en = mas(al2, this.r.entre(5, 6 * 60) * MIN);
    const x = this.r();
    if (x < 0.3) return { en, evento: 'si', dice: this.escribe('si') };
    if (x < 0.5) return { en, evento: 'no', dice: this.escribe('no') };
    if (x < 0.65) {
      const c = this.r.entre(1, 5);
      return { en, evento: 'foto', cantidad: c, dice: `${c} fotos más` };
    }
    return null;
  }

  alAL3(al3: Date, ids: readonly string[], entran: number): GestoAlbum | null {
    const en = mas(al3, this.r.entre(5, 8 * 60) * MIN);
    const sobran = ids.length - entran;
    const x = this.r();
    const elegir = (cuantas: number) => {
      const quedan = [...ids];
      const saca: string[] = [];
      for (let i = 0; i < cuantas && quedan.length; i++) saca.push(quedan.splice(this.r.entre(0, quedan.length - 1), 1)[0]);
      return saca;
    };
    if (x < 0.4) {
      const saca = elegir(sobran);
      return { en, evento: 'reenvio', ids: saca, dice: `reenvía ${saca.length} fotos para sacar` };
    }
    if (x < 0.55 && sobran > 1) {
      const saca = elegir(this.r.entre(1, sobran - 1));
      return { en, evento: 'reenvio', ids: saca, dice: `reenvía ${saca.length} fotos para sacar (le faltan)` };
    }
    if (x < 0.7) return { en, evento: 'otra', dice: this.escribe('otra') };
    return null;
  }

  nazaCierra(aviso: Date): Date {
    const casa = this.e.compra.zonaCasa;
    return aInstante(sumarDias(aLocal(aviso, casa).fecha, 1), '12:00', casa);
  }
}

export function correr(semilla: number, idioma: Idioma = 'es-AR'): { e: Escenario; res: Resultado; violaciones: Violacion[]; hallazgos: Violacion[] } {
  const e = escenario(semilla, idioma);
  const res = simular(e.compra, e.compraEn, new PersonaSimulada(e));
  const { violaciones, hallazgos } = revisar(res);
  return { e, res, violaciones, hallazgos };
}

// ── Invariantes ──────────────────────────────────────────────────────────────

export const INVARIANTES: Record<string, string> = {
  a: 'a) Mensaje por reloj (o de la cadena) entre las 23:00 y las 8:00 locales',
  b1: 'b) Más de 2 preguntas en un mismo día',
  b2: 'b) El día de salida llega algo más que UC1',
  b3: 'b) El día de vuelta llega algo más que VU0',
  c1: 'c) Marca {{…}} sin completar',
  c2: 'c) Texto que no sale del banco',
  d1: 'd) "Hasta la noche" sin noche más tarde ese día',
  d2: 'd) "Mañana hay otra" con otra ese día, o sin otra al día siguiente',
  d3: 'd) PAS-A ("Seguimos con la próxima") sin próxima',
  d4: 'd) "Lo escuché" (ACA2/ACN3) después de una respuesta que fue solo texto o solo fotos',
  d5: 'd) ATR arriba de algo que no es la noche común',
  d6: 'd) Versión "ya de viaje" antes de salir, o la normal ya de viaje',
  d7: 'd) "Ayer" (ID1) fuera del día siguiente a la salida',
  d8: 'd) ATR-V dos noches seguidas',
  d9: 'd) Acuse en texto (ACM) al mediodía, a VU0 o a una foto suelta (va la reacción ❤️), una respuesta o foto suelta sin su ❤️, o una ❤️ que apunta a otro mensaje',
  d10: 'd) ID1 el mismo día de salida en hora de casa',
  d13: 'd) ATR-PR sin una pregunta de quien regala (PR-R, PR-R2, PR-R3) sin contestar la noche anterior',
  d12: 'd) PAS-V2 ("esta la salteamos") sin otra pregunta ese día, o PAS-V ("Mañana hay otra") con otra ese día',
  d11: 'd) ID1 después de la noche del día 1 (con 12 h o más de diferencia, ID1 ocupa esa noche)',
  e1: 'e) Una de antes de salir sale dos veces (misma versión), o "ya de viaje" después de contestada',
  e2: 'e) Una de antes de salir no contestada, que no sale ni queda en avisosNaza',
  e3: 'e) Una pregunta propia sale dos veces',
  e4: 'e) Una pregunta propia que no sale ni queda en avisosNaza',
  e5: 'e) Dos preguntas propias de regalo seguidas con el mismo envoltorio (PR-R, PR-R2, PR-R3)',
  f1: 'f) Mediodía fuera de orden (las 12 en cada vuelta) o en un día que no va',
  f2: 'f) Choque MD2/NO1 o MD8/NO6 el mismo día',
  f3: 'f) Mismo comienzo, puerta o cierre dos noches comunes seguidas',
  f4: 'f) C3 ("con lo que valga la pena") con F4 ("después contame lo demás") en la misma noche: se contradicen',
  l1: 'l) Texto de otro idioma (un texto del banco de otro idioma, o una palabra típica de otro idioma)',
  l2: 'l) Marca sin reemplazar o salto escrito ({{…}}, <br>, \\n)',
  l3: 'l) El detector no entiende lo que escribió la persona ("paso", "ja està", "vale", el SÍ…)',
  g1: 'g) TXT más de 2 veces',
  g2: 'g) REC1/REC1-U más de 1 vez',
  g3: 'g) AL2 más de 2 veces',
  g4: 'g) DES no sale exactamente 1 vez con el álbum cerrado (o sale sin cerrar)',
  g5: 'g) Álbum con 0 fotos: sin aviso a Naza, o DES sin esperar su decisión',
  g6: 'g) TXT pegado a otra cosa en el mismo mensaje',
  g7: 'g) El viaje termina sin DES (el álbum nunca se cierra)',
  g8: 'g) DES+ sin AL3 antes (no le preguntó cuáles sacar)',
  h4: 'h) AL1 (o AL1-P) el mismo día que CA1 (va a las 10:00 del día siguiente)',
  g9: 'g) Viaje de 3 días o más sin FN1 (salvo el caso aceptado: 3 días con ID1 en la noche del día 1)',
  h1: 'h) El calendario no está en orden creciente de tiempo',
  h2: 'h) Algún mensaje después de DES',
  h3: 'h) Otra pregunta entre AL1 y DES',
  k: 'La compra del escenario no pasa validarCompra (mínimo 3 días, noche 19:00-22:30)',
  x: 'El código tira un error (el viaje no termina)',
};

export const HALLAZGOS: Record<string, string> = {
  i3: 'Una noche común ("cómo fue hoy", "ya terminó el día") sale antes de las 12:00',
  i4: 'FN1 ("Mañana te volvés") no sale la víspera de la vuelta',
  i5: 'Algo programado ya pasó cuando dice SÍ y no sale nunca (UC1, VU0; si el SÍ llega muy tarde, también ID1 y noches)',
  i6: 'AS1 (versión normal) llega el día de salida, con el SÍ (documentado en alDecirSi)',
  i7: 'CA1 sin respuesta: el álbum se abre igual a la mañana siguiente con AL1-P',
  i8: 'Fotos del álbum que llegan después de cerrado (van al panel, sin contestar)',
  i9: 'Una de antes de salir mandada y sin respuesta vuelve "ya de viaje" (por diseño)',
  i10: 'Una reacción con pregunta adentro (AS1 con el SÍ, o COR) sale entre las 23:00 y las 8:00',
  i11: 'AL2, AL3 o DES por reloj a las 8:00 justas: no es un error (5 horas después de algo de las 3:00); lo que la franja corre sale a las 10:00',
  i12: 'ID1 ocupa la noche del día 1 (12 horas o más de diferencia: las 10 de casa son la noche de allá)',
  i13: 'UC1 corrida 2 horas después de un SÍ tardío el día de salida',
};

export type Violacion = { inv: string; detalle: string };

/**
 * Palabras típicas de cada idioma que no tendrían que aparecer en un mensaje
 * de otro (fuera de los datos de la persona). Una red gruesa: la fina es c2
 * (cada mensaje tiene que salir del banco de SU idioma) y l1 con los textos.
 */
const RASGOS: Record<Idioma, string[]> = {
  'es-AR': ['Contame', 'contame', 'contás', 'tenés', 'querés', 'podés', 'acá', 'valija', 'Arrancá', 'mandalas', 'Mandame', 'mandame', 'vos', 'Dale'],
  'es-ES': ['Cuéntame', 'cuéntame', 'tienes', 'quieres', 'puedes', 'móvil', 'Empieza', 'Mándame', 'mándame', 'Vale'],
  ca: ['Explica\'m', 'explica\'m', 'gràcies', 'Gràcies', 'teva', 'viatge', 'Avui', 'avui', 'Ahir', 'nit', 'quan'],
};
/** Las que comparte con su propio idioma (ninguna por ahora). */
const RASGOS_PERMITIDOS: Record<Idioma, string[]> = { 'es-AR': [], 'es-ES': [], ca: [] };

const PRIMERA_VUELTA_MD = ['MD1', 'MD5', 'MD3', 'MD4', 'MD9', 'MD2', 'MD10', 'MD6', 'MD7', 'MD12', 'MD8', 'MD11']; // banco.md, tabla del mediodía
const SEGUNDA_VUELTA = PRIMERA_VUELTA_MD; // simulaciones: la segunda vuelta usa las 12
const CHOQUES: Record<string, string> = { MD2: 'NO1', MD8: 'NO6' };
const hora = (t: Date, z: Zona) => aLocal(t, z).hora;
const fecha = (t: Date, z: Zona) => aLocal(t, z).fecha;
const enFranja = (t: Date, z: Zona) => {
  const h = hora(t, z);
  return h >= '23:00' || h < '08:00';
};
const cuando = (m: Enviado) => `${fecha(m.en, m.zona)} ${hora(m.en, m.zona)} ${corta(m.zona)}`;
const PREGUNTAS_PROGRAMADAS = new Set(['UC1', 'ID1', 'MD', 'noche', 'antes-en-viaje', 'propia', 'FN1', 'VU0', 'VU1', 'IV1', 'CA1']);
const esPregunta = (m: Enviado) => m.origen === 'programado' || m.ids.some(esCadena);
const NOCHE_TIPOS = new Set(['noche', 'antes-en-viaje', 'propia', 'FN1', 'CA1']);

/** Las formas posibles de cada ID, ya llenas (normal y "ya de viaje"; las propias, con cada pregunta), en el idioma de la compra. */
function formas(id: string, compra: Compra): string[] {
  const f = porId(id, idiomaDe(compra));
  const datos = datosDeCompra(compra);
  const r = (t: string, pregunta?: string) => {
    try {
      return renderizar(t, { ...datos, pregunta });
    } catch {
      return null;
    }
  };
  const out: (string | null)[] = [];
  if (id.startsWith('PR-')) for (const p of compra.preguntasPropias) out.push(r(f.texto, p));
  else out.push(r(f.texto));
  if (f.yaDeViaje) out.push(r(f.yaDeViaje));
  return out.filter((x): x is string => x !== null);
}

/** ¿El mensaje se puede armar con los textos del banco de sus IDs, con las reglas de empalme? */
function saleDelBanco(m: Enviado, compra: Compra): boolean {
  const idioma = idiomaDe(compra);
  if (m.ids.includes('AL3')) {
    const ns = [...m.texto.matchAll(/\d+/g)].map((x) => x[0]);
    return ns.some((n) => m.texto === renderizar(porId('AL3', idioma).texto, { ...datosDeCompra(compra), fotos_mandadas: n }));
  }
  if (m.ids.includes('DES+')) {
    const [antes, despues] = partirDes(porId('DES', idioma).texto);
    return m.texto === renderizar(`${antes} ${porId('DES+', idioma).texto} ${despues}`, datosDeCompra(compra));
  }
  const c = m.ids.findIndex((id) => /^C\d$/.test(id));
  let partes: string[][];
  if (c >= 0) {
    const [ci, no, fi] = m.ids.slice(c, c + 3);
    const noche = formas(ci, compra).flatMap((a) => formas(no, compra).flatMap((b) => formas(fi, compra).map((z) => `${a} ${b}${z}`)));
    partes = [...m.ids.slice(0, c).map((id) => formas(id, compra)), noche];
  } else partes = m.ids.map((id) => formas(id, compra));
  let posibles = [''];
  partes.forEach((ps, i) => {
    posibles = posibles.flatMap((a) => ps.map((b) => (i === 0 ? b : `${a}\n\n${b}`)));
  });
  return posibles.includes(m.texto);
}

export function revisar(res: Resultado): { violaciones: Violacion[]; hallazgos: Violacion[] } {
  const v: Violacion[] = [];
  const h: Violacion[] = [];
  const mal = (inv: string, detalle: string) => v.push({ inv, detalle });
  const ojo = (inv: string, detalle: string) => h.push({ inv, detalle });
  const c = res.compra;
  const casa = c.zonaCasa;
  const n = diasEntre(c.salida, c.vuelta);
  const env = res.enviados;
  const preguntas = env.filter(esPregunta);

  if (res.error) mal('x', res.error);
  try {
    validarCompra(c);
  } catch (e) {
    mal('k', e instanceof Error ? e.message : String(e));
  }

  // a) franja
  for (const m of env) {
    const porReloj = m.iniciativa || m.origen === 'cadena';
    if (porReloj && enFranja(m.en, m.zona)) mal('a', `${m.ids.join('+')} a las ${cuando(m)}`);
    else if (!porReloj && m.ids.some((id) => esCadena(id)) && enFranja(m.en, m.zona)) ojo('i10', `${m.ids.join('+')} a las ${cuando(m)}`);
    if ((m.origen === 'album-reloj' || m.origen === 'naza') && hora(m.en, m.zona) === '08:00') ojo('i11', `${m.ids.join('+')} ${cuando(m)}`);
  }

  // b) preguntas por día (desde el día de salida)
  const porDia = new Map<string, Enviado[]>();
  for (const m of preguntas) {
    const f = fecha(m.en, m.zona);
    if (f < c.salida) continue;
    if (m.origen === 'arranque' && m.ids.includes('AS1')) {
      ojo('i6', `AS1 el ${cuando(m)}`);
      continue;
    }
    porDia.set(f, [...(porDia.get(f) ?? []), m]);
  }
  for (const [f, ms] of porDia) {
    const ids = ms.map((m) => m.ids.filter((id) => !id.startsWith('ATR')).join('+'));
    if (ms.length > 2) mal('b1', `${f}: ${ids.join(', ')}`);
    if (f === c.salida) {
      const permitidos = n === 0 ? ['UC1', 'VU0'] : ['UC1'];
      if (ms.some((m) => !permitidos.includes(m.ids[0]))) mal('b2', `${f}: ${ids.join(', ')}`);
    }
    if (f === c.vuelta && n > 0) {
      const permitidos = n === 1 ? ['ID1', 'VU0'] : ['VU0'];
      if (ms.some((m) => !permitidos.includes(m.ids[0]))) mal('b3', `${f}: ${ids.join(', ')}`);
    }
  }

  // l) idiomas
  const idioma = idiomaDe(c);
  const datosPersona = [c.nombre, c.regalo?.quienRegala, ...c.preguntasPropias].filter((x): x is string => !!x);
  for (const m of env) {
    if (/\{\{|\}\}|<br|\\n/.test(m.texto)) mal('l2', `${m.ids.join('+')}: ${m.texto.slice(0, 80)}`);
    let limpio = m.texto;
    for (const d of datosPersona) limpio = limpio.split(d).join(' ');
    const propias = new Set(m.ids.flatMap((id) => formas(id, c)));
    for (const otro of IDIOMAS.filter((x) => x !== idioma)) {
      const ajeno = m.ids.flatMap((id) => formas(id, { ...c, idioma: otro })).find((t) => t.length > 12 && !propias.has(t) && m.texto.includes(t));
      if (ajeno) mal('l1', `${m.ids.join('+')} (${idioma}) trae el texto ${otro}: "${ajeno.slice(0, 50)}…"`);
      const palabra = RASGOS[otro].find((w) => !RASGOS_PERMITIDOS[idioma].includes(w) && new RegExp(`(^|[^\\p{L}'])${w}([^\\p{L}']|$)`, 'u').test(limpio));
      if (palabra) mal('l1', `${m.ids.join('+')} (${idioma}) dice "${palabra}", que es ${otro}`);
    }
  }
  for (const x of res.malEntendidos) mal('l3', x);

  // c) marcas y banco
  for (const m of env) {
    if (/\{\{|\}\}/.test(m.texto)) mal('c1', `${m.ids.join('+')}: ${m.texto.slice(0, 80)}`);
    if (!saleDelBanco(m, c)) mal('c2', `${m.ids.join('+')} (${cuando(m)})`);
  }

  // d) nada que mienta
  for (const m of env) {
    if (m.ids.includes('ACM3') || m.ids.includes('ACM4')) {
      const hay = preguntas.some((q) => q.programado && NOCHE_TIPOS.has(q.programado.tipo) && q.en > m.en && fecha(q.en, q.zona) === fecha(m.en, q.zona));
      if (!hay) mal('d1', `${m.ids.join('+')} ${cuando(m)}`);
    }
    if (m.ids.includes('PAS-V')) {
      const otraHoy = preguntas.find((q) => q.en > m.en && fecha(q.en, q.zona) === fecha(m.en, q.zona));
      // "Mañana": el día siguiente en la hora del que lo dice o en la de la pregunta que llega (al volver cambia la zona).
      // AL1/AL1-P (a la mañana siguiente de CA1) también es "otra" (A3, lectura final).
      const siguen = env.filter((q) => esPregunta(q) || q.ids[0] === 'AL1' || q.ids[0] === 'AL1-P');
      const manana = siguen.some((q) => q.en > m.en && [fecha(m.en, q.zona), fecha(m.en, m.zona)].some((f) => fecha(q.en, q.zona) === sumarDias(f, 1)));
      if (otraHoy) mal('d2', `PAS-V ${cuando(m)} y el mismo día ${otraHoy.ids.join('+')} ${cuando(otraHoy)}`);
      else if (!manana) mal('d2', `PAS-V ${cuando(m)} y al otro día no llega nada`);
    }
    const iPas = m.ids.indexOf('PAS-A');
    if (iPas >= 0 && !esCadena(m.ids[iPas + 1] ?? '')) mal('d3', `${m.ids.join('+')} ${cuando(m)}`);
    const sinAudio = m.reaccionA?.respuesta.tipo === 'texto' || m.reaccionA?.respuesta.tipo === 'foto';
    if (sinAudio && (m.ids.includes('ACA2') || m.ids.includes('ACN3'))) mal('d4', `${m.ids.join('+')} después de ${m.reaccionA!.respuesta.tipo} (${m.reaccionA!.tipo}) ${cuando(m)}`);
    if (m.reaccionA && ['MD', 'VU0', 'foto-suelta'].includes(m.reaccionA.tipo) && m.ids.some((id) => id.startsWith('ACM'))) mal('d9', `${m.ids.join('+')} después de ${m.reaccionA.tipo} ${cuando(m)}`);
    if (m.ids.includes('TXT') && m.ids.length > 1) mal('g6', `${m.ids.join('+')} ${cuando(m)}`);
    if (m.ids.some((id) => id.startsWith('ATR')) && !m.ids.some((id) => /^C\d$/.test(id))) mal('d5', `${m.ids.join('+')} ${cuando(m)}`);
    for (const id of m.ids.filter(esCadena)) {
      const f = porId(id, idiomaDe(c));
      const yaDeViaje = f.yaDeViaje !== null && m.texto.includes(renderizar(f.yaDeViaje, datosDeCompra(c)));
      const fCasa = fecha(m.en, casa);
      if (yaDeViaje && (fCasa <= c.salida || fecha(m.en, m.zona) <= c.salida)) mal('d6', `${id} "ya de viaje" el ${cuando(m)}`);
      if (!yaDeViaje && fCasa > c.salida) mal('d6', `${id} versión normal el ${cuando(m)} (ya de viaje)`);
    }
    if (m.ids.includes('ID1')) {
      if (fecha(m.en, m.zona) !== sumarDias(c.salida, 1)) mal('d7', `ID1 ${cuando(m)}`);
      if (fecha(m.en, casa) === c.salida) mal('d10', `ID1 ${cuando(m)} = ${hora(m.en, casa)} en casa, el día de salida`);
      const noche1 = preguntas.find((q) => q.programado?.dia === 1 && q.programado.momento === 'noche' && q.programado.tipo !== 'ID1');
      if (noche1 && noche1.en < m.en) mal('d11', `ID1 ${cuando(m)} después de ${noche1.ids.filter((id) => !id.startsWith('ATR')).join('+')} ${cuando(noche1)}`);
      if (m.programado?.momento === 'noche') ojo('i12', `ID1 ${cuando(m)} en lugar de la noche`);
    }
    if (m.ids.some((id) => /^C\d$/.test(id)) && hora(m.en, m.zona) < '12:00') ojo('i3', `${m.ids.join('+')} ${cuando(m)}`);
    if (m.ids.includes('FN1') && fecha(m.en, m.zona) !== sumarDias(c.vuelta, -1)) ojo('i4', `FN1 ${cuando(m)} (vuelta ${c.vuelta})`);
  }
  // d8) ATR-V dos noches del viaje seguidas
  const nochesViaje = env.filter((m) => m.programado && ['noche', 'antes-en-viaje', 'propia', 'FN1'].includes(m.programado.tipo));
  // d13) ATR-PR solo después de una pregunta de quien regala que quedó sin contestar
  for (let i = 0; i < nochesViaje.length; i++) {
    if (!nochesViaje[i].ids.includes('ATR-PR')) continue;
    const ant = i > 0 ? nochesViaje[i - 1] : null;
    const envio = ant ? res.estado.envios.filter((x) => x.clave === ant.programado!.clave).pop() : undefined;
    const fueDeRegalo = !!ant && ant.ids.some((id) => /^PR-R\d?$/.test(id));
    if (!fueDeRegalo || !envio || envio.respuestas.length > 0) mal('d13', `ATR-PR ${cuando(nochesViaje[i])} después de ${ant ? ant.ids.join('+') : 'nada'}`);
  }
  for (let i = 1; i < nochesViaje.length; i++) {
    if (nochesViaje[i].ids.includes('ATR-V') && nochesViaje[i - 1].ids.includes('ATR-V')) mal('d8', `${cuando(nochesViaje[i - 1])} y ${cuando(nochesViaje[i])}`);
  }
  // d9) el mediodía, VU0 y las fotos sueltas contestadas llevan ❤️
  const respuestasCorazon = res.estado.envios.filter((x) => (x.tipo === 'MD' || x.tipo === 'VU0') && x.respuestas.some((r) => !r.audioMal && r.tipo !== 'paso')).length;
  const corazonesProgramados = res.corazones.filter((x) => x.a === 'MD' || x.a === 'VU0').length;
  if (corazonesProgramados !== respuestasCorazon) mal('d9', `${respuestasCorazon} mediodías contestados y ${corazonesProgramados} ❤️`);
  for (const id of res.sueltasIds) if (!res.corazones.some((k) => k.a === 'foto-suelta' && k.aMensaje === id)) mal('d9', `foto suelta ${id} sin su ❤️`);
  for (const k of res.corazones) if (k.aMensaje !== k.esperado) mal('d9', `❤️ a ${k.aMensaje ?? 'nada'} y tenía que ir a ${k.esperado} (${k.a})`);
  // d12) PAS-V2 / PAS-V según si ese día queda otra pregunta
  for (const m of env) {
    if (m.ids[0] !== 'PAS-V2' && m.ids[0] !== 'PAS-V') continue;
    // AL1/AL1-P también cuenta como "otra" (llega después de CA1).
    const otra = env.some((q) => (esPregunta(q) || q.ids[0] === 'AL1' || q.ids[0] === 'AL1-P') && q.en > m.en && fecha(q.en, q.zona) === fecha(m.en, q.zona));
    if (m.ids[0] === 'PAS-V2' && !otra) mal('d12', `PAS-V2 ${cuando(m)} y ese día no llega nada más`);
    if (m.ids[0] === 'PAS-V' && otra) mal('d12', `PAS-V ${cuando(m)} y ese día llega otra`);
  }
  // g9) FN1 en todo viaje de 3 días o más (salvo 3 días con ID1 en la noche del día 1)
  const id1EnLaNoche = (res.cal ?? res.calPrevio).programados.some((p) => p.tipo === 'ID1' && p.momento === 'noche');
  const fn1Vencida = res.vencidos.some((p) => p.tipo === 'FN1');
  if (n >= 2 && !env.some((m) => m.ids.includes('FN1')) && !fn1Vencida && !(n === 2 && id1EnLaNoche)) mal('g9', `${n + 1} días sin FN1`);
  const uc1 = env.find((m) => m.ids[0] === 'UC1' && m.origen === 'programado');
  if (uc1 && uc1.programado && uc1.en.getTime() !== res.calPrevio.programados[0].instante.getTime()) ojo('i13', `UC1 ${cuando(uc1)} (SÍ a las ${hora(res.siEn, casa)})`);
  for (const p of res.vencidos) ojo('i5', `${p.ids[0]} (${p.fecha} ${p.hora}) vence: SÍ a las ${hora(res.siEn, casa)}`);

  // e) de antes de salir y propias
  const avisos = (res.cal?.avisosNaza ?? []).join(' ');
  for (const id of CADENA_ANTES) {
    const con = env.filter((m) => m.ids.includes(id));
    const f = porId(id, idiomaDe(c));
    const ydvTexto = f.yaDeViaje ? renderizar(f.yaDeViaje, datosDeCompra(c)) : null;
    const ydv = con.filter((m) => ydvTexto !== null && m.texto.includes(ydvTexto));
    const normal = con.filter((m) => !ydv.includes(m));
    const envio = res.estado.envios.find((x) => x.clave === id && x.tipo === 'cadena');
    const contestadaEn = envio?.respuestas.find((r) => !r.audioMal)?.en;
    if (normal.length > 1 || ydv.length > 1) mal('e1', `${id}: ${normal.length} normal, ${ydv.length} ya de viaje`);
    if (ydv.length && contestadaEn && Date.parse(contestadaEn) < ydv[0].en.getTime()) mal('e1', `${id} ya de viaje después de contestada`);
    const seVencio = res.vencidos.some((p) => p.tipo === 'antes-en-viaje' && p.ids[0] === id); // ya cuenta en i5
    if (!contestadaEn && ydv.length === 0 && !seVencio && !(avisos.includes(id) && res.cal?.antesQueNoEntran.includes(id))) {
      mal('e2', `${id}: ${normal.length ? 'mandada sin respuesta' : 'nunca mandada'}, sin aviso (avisos: ${avisos || 'ninguno'})`);
    }
    if (normal.length && !contestadaEn && ydv.length) ojo('i9', `${id}`);
  }
  const propiasEnviadas = env.filter((m) => m.ids.some((id) => id.startsWith('PR-')));
  const envoltorios = propiasEnviadas.map((m) => m.ids.find((id) => id.startsWith('PR-R'))).filter((x): x is string => !!x);
  for (let i = 1; i < envoltorios.length; i++) if (envoltorios[i] === envoltorios[i - 1]) mal('e5', `${envoltorios[i]} dos veces seguidas`);
  const vistas = new Map<string, number>();
  for (const p of c.preguntasPropias) vistas.set(p, (vistas.get(p) ?? 0) + 1);
  for (const [p, veces] of vistas) {
    const salio = propiasEnviadas.filter((m) => m.texto.includes(`«${p}»`)).length;
    if (salio > veces) mal('e3', `«${p}» sale ${salio} veces`);
    const vencidas = res.vencidos.filter((x) => x.tipo === 'propia' && x.pregunta === p).length; // ya cuentan en i5
    if (salio + vencidas < veces && !avisos.includes(`«${p}»`)) mal('e4', `«${p}» no sale y no está en avisosNaza`);
  }

  // f) mediodía y noches
  const mds = env.filter((m) => m.programado?.tipo === 'MD');
  const puertaDe = new Map<number, string>();
  for (const m of env) if (m.programado?.tipo === 'noche') puertaDe.set(m.programado.dia, m.programado.ids[1]);
  const flujo = (k: number) => (k < PRIMERA_VUELTA_MD.length ? PRIMERA_VUELTA_MD[k] : SEGUNDA_VUELTA[(k - PRIMERA_VUELTA_MD.length) % SEGUNDA_VUELTA.length]);
  let k = 0;
  for (const m of mds) {
    const p = m.programado!;
    const md = p.ids[0];
    if (p.dia < 2 || p.dia > n - 1) mal('f1', `${md} el día ${p.dia}`);
    let saltos = 0;
    while (flujo(k) !== md && saltos < 30) {
      const saltada = flujo(k);
      if (CHOQUES[saltada] !== puertaDe.get(p.dia)) {
        mal('f1', `día ${p.dia}: sale ${md} y tocaba ${saltada}`);
        break;
      }
      k++;
      saltos++;
    }
    if (flujo(k) === md) k++;
    if (CHOQUES[md] && CHOQUES[md] === puertaDe.get(p.dia)) mal('f2', `día ${p.dia}: ${md} con ${puertaDe.get(p.dia)}`);
  }
  const comunes = env.filter((m) => m.programado?.tipo === 'noche').map((m) => m.programado!);
  for (const p of comunes) if (p.ids[0] === 'C3' && p.ids[2] === 'F4') mal('f4', `día ${p.dia}: ${p.ids.join('+')}`);
  for (let i = 1; i < comunes.length; i++) {
    const [a, b] = [comunes[i - 1].ids, comunes[i].ids];
    for (let j = 0; j < 3; j++) if (a[j] === b[j]) mal('f3', `días ${comunes[i - 1].dia} y ${comunes[i].dia}: ${a[j]} dos veces`);
  }

  // g) topes
  const cuenta = (id: string) => env.filter((m) => m.ids.includes(id)).length;
  if (cuenta('TXT') > 2) mal('g1', `TXT ${cuenta('TXT')} veces`);
  if (cuenta('REC1') + cuenta('REC1-U') > 1) mal('g2', `REC ${cuenta('REC1') + cuenta('REC1-U')} veces`);
  if (cuenta('AL2') > 2) mal('g3', `AL2 ${cuenta('AL2')} veces`);
  const cerrado = res.album?.fase === 'cerrado';
  if (cerrado ? cuenta('DES') !== 1 : cuenta('DES') !== 0) mal('g4', `DES ${cuenta('DES')} veces, álbum ${res.album?.fase ?? 'sin abrir'}`);
  if (cerrado && res.album!.fotos === 0) {
    const des = env.find((m) => m.ids.includes('DES'))!;
    if (!res.avisosAlbum.length || des.origen !== 'naza') mal('g5', `DES con 0 fotos (${des.origen}), avisos: ${res.avisosAlbum.length}`);
  }
  if (env.some((m) => m.ids.includes('AL1-P') && m.origen === 'album-reloj')) ojo('i7', 'CA1 sin respuesta: AL1-P al día siguiente');
  if (!res.error && !cerrado) mal('g7', `álbum ${res.album?.fase ?? 'sin abrir'}`);
  const iDes = env.findIndex((m) => m.ids.includes('DES+'));
  if (iDes >= 0 && !env.slice(0, iDes).some((m) => m.ids.includes('AL3'))) mal('g8', `DES+ ${cuando(env[iDes])} sin AL3`);
  if (res.fotosTarde) ojo('i8', `${res.fotosTarde} fotos`);

  // h) orden
  const cal = res.cal ?? res.calPrevio;
  for (let i = 1; i < cal.programados.length; i++) {
    const [a, b] = [cal.programados[i - 1], cal.programados[i]];
    if (b.instante < a.instante) mal('h1', `${a.ids[0]} (día ${a.dia}, ${a.fecha} ${a.hora}) antes que ${b.ids[0]} (día ${b.dia}, ${b.fecha} ${b.hora})`);
  }
  for (let i = 1; i < env.length; i++) if (env[i].en < env[i - 1].en) mal('h1', `${env[i].ids.join('+')} sale antes que ${env[i - 1].ids.join('+')}`);
  const des = env.find((m) => m.ids.includes('DES'));
  if (des) for (const m of env.filter((x) => x.en > des.en)) mal('h2', `${m.ids.join('+')} ${cuando(m)} después de DES`);
  const al1 = env.find((m) => m.ids.includes('AL1') || m.ids.includes('AL1-P'));
  const ca1 = env.find((m) => m.ids[0] === 'CA1' && m.origen === 'programado');
  if (al1 && ca1 && fecha(al1.en, casa) <= fecha(ca1.en, casa)) mal('h4', `AL1 ${cuando(al1)} y CA1 ${cuando(ca1)}`);
  if (al1) for (const m of preguntas.filter((x) => x.en > al1.en && (!des || x.en < des.en))) mal('h3', `${m.ids.join('+')} ${cuando(m)} entre AL1 y DES`);

  return { violaciones: v, hallazgos: h };
}

// ── Estadísticas ─────────────────────────────────────────────────────────────

type Corrida = ReturnType<typeof correr>;
const prom = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const f1 = (x: number) => x.toFixed(1).replace('.', ',');

export function resumenMd(corridas: Corrida[], otros: Corrida[] = []): string {
  const out: string[] = [];
  const total = corridas.length;
  out.push(
    '# Vitácora de Viaje V2 · Simulaciones',
    '',
    `Generado por \`fabrica/scripts/viaje-v2-simular.ts\` (no editar a mano): **${total} viajes inventados** corridos de punta a punta con el código de \`fabrica/src/viaje-v2/\`, semillas 1 a ${total}. Cualquier viaje se repite con \`npx tsx scripts/viaje-v2-simular.ts --semilla N\`.`,
    '',
    '## Qué varía',
    '- Duración: 3, 4, 5, 7, 10, 15, 30 y 60 días, y al azar (3 a 45). Rotan con la semilla, parejo. (La compra pide al menos 3 días; las escapadas de 1 y 2 días quedan en sus lecturas.)',
    '- Compra: el mismo día que sale, 1, 3 o 20 días antes, a cualquier hora entre las 8 y las 23.',
    '- Casa en Buenos Aires, Madrid o Ciudad de México; viaje en Madrid, Tokio, Buenos Aires o Nueva York. Un 35% cae sobre un cambio de horario (Europa 25/10/2026 y 28/3/2027; EE. UU. 1/11/2026 y 14/3/2027).',
    '- Noche: 21:30, 20:00, 19:00, 22:30 o sin elegir (la compra pide entre 19:00 y 22:30). Regalo o para uno; 0 a 5 propias; PDF o impreso; álbum de 20 o 40.',
    '- Conducta: contesta todo · no contesta nunca · al azar · "paso" seguido · escribe · audios cortados · se saltea noches seguidas · manda fotos sueltas.',
    '- Álbum: 0 fotos · pocas · justas · de más · de a tandas con pausas de 6 a 30 horas. Al AL2: sí, no, más fotos o silencio. Al AL3: reenvía las que sobran, reenvía menos, contesta otra cosa o nada.',
    '',
    '## Decisiones del simulador (el planificador todavía no existe)',
    '- BIEN-1 sale al comprar (corrido a las 8:00 si cae en la franja). La persona siempre dice SÍ (a veces 8 a 26 horas después).',
    '- Con un SÍ tardío el día de salida, UC1 sale 2 horas después (i13); lo demás programado que ya pasó cuando dice SÍ no sale ("vencido"; ver i5). Un SÍ después del día de salida trae AS1 "ya de viaje".',
    '- AL1 sale a las 10:00 del día siguiente de CA1 (hora de casa); AL1-P si CA1 fue "paso" o quedó sin respuesta (i7).',
    '- El calendario definitivo se arma justo antes de ID1 (o IV1), con lo que quedó pendiente de antes de salir. La persona contesta cada pregunta antes de que llegue la siguiente.',
    '- Mensajes "por reloj" (los que revisa la invariante a): todo lo programado, BIEN-1, REC1, AL1/AL1-P, AL2, AL3 y DES por reloj o por Naza, y las de la cadena. Las reacciones inmediatas (acuses, COR, DES con "listo") no.',
    '- Las reacciones ❤️ (mediodía, VU0, fotos sueltas) no son mensajes: no cuentan en los totales y van en su propia columna.',
    '- Naza cierra un álbum con cero fotos al día siguiente del aviso, a las 12:00 (hora de casa).',
  );

  // Invariantes
  out.push('', '## Invariantes', '', '| Invariante | Viajes que la rompen | Ejemplo más chico |', '|---|---|---|');
  const tabla = (claves: Record<string, string>, de: (c: Corrida) => Violacion[]) => {
    for (const [inv, nombre] of Object.entries(claves)) {
      const rompen = corridas.filter((c) => de(c).some((x) => x.inv === inv));
      let ej = '—';
      if (rompen.length) {
        const chico = [...rompen].sort((a, b) => a.e.dias - b.e.dias || a.res.enviados.length - b.res.enviados.length || a.e.semilla - b.e.semilla)[0];
        const det = de(chico).find((x) => x.inv === inv)!.detalle;
        ej = `${describir(chico.e)}. **${det.replace(/\|/g, '/')}**`;
      }
      out.push(`| ${nombre.replace(/\|/g, '/')} | ${rompen.length} de ${total} | ${ej} |`);
    }
  };
  tabla(INVARIANTES, (c) => c.violaciones);
  out.push('', '## Hallazgos (no son invariantes pedidas, pero conviene mirarlos)', '', '| Hallazgo | Viajes | Ejemplo más chico |', '|---|---|---|');
  tabla(HALLAZGOS, (c) => c.hallazgos);

  // Por duración
  out.push('', '## Mensajes que le llegan, por duración', '', 'Mensajes de Vitácora (todo lo que sale, acuses incluidos). "Por día": total dividido por los días de calendario entre el primer y el último mensaje; "máx. en un día": el día más cargado (fecha local de cada mensaje).', '', '| Días | Viajes | Total (prom.) | Total (máx.) | Por día (prom.) | Máx. en un día | Preguntas por día de viaje (prom.) | Reacciones ❤️ (prom.) |', '|---|---|---|---|---|---|---|---|');
  const grupos = new Map<string, Corrida[]>();
  for (const c of corridas) {
    const g = (DURACIONES as readonly number[]).includes(c.e.dias) ? String(c.e.dias) : 'otras (3-45)';
    grupos.set(g, [...(grupos.get(g) ?? []), c]);
  }
  const orden = [...DURACIONES.map(String), 'otras (3-45)'];
  for (const g of orden) {
    const cs = grupos.get(g) ?? [];
    if (!cs.length) continue;
    const totales = cs.map((c) => c.res.enviados.length);
    const porDia = cs.map((c) => {
      const env = c.res.enviados;
      if (!env.length) return 0;
      const d = diasEntre(fecha(env[0].en, c.e.compra.zonaCasa), fecha(env[env.length - 1].en, c.e.compra.zonaCasa)) + 1;
      return env.length / d;
    });
    const maxDia = cs.map((c) => {
      const m = new Map<string, number>();
      for (const x of c.res.enviados) m.set(fecha(x.en, x.zona), (m.get(fecha(x.en, x.zona)) ?? 0) + 1);
      return Math.max(0, ...m.values());
    });
    const pregDia = cs.map((c) => c.res.enviados.filter((m) => m.origen === 'programado').length / (c.e.dias + 1));
    const cor = cs.map((c) => c.res.corazones.length);
    out.push(`| ${g} | ${cs.length} | ${f1(prom(totales))} | ${Math.max(...totales)} | ${f1(prom(porDia))} | ${Math.max(...maxDia)} | ${f1(prom(pregDia))} | ${f1(prom(cor))} |`);
  }

  // Repeticiones
  for (const d of [30, 60]) {
    const cs = corridas.filter((c) => c.e.dias === d && c.e.conducta !== 'nunca');
    out.push('', `## Cuántas veces se repite cada texto en un viaje de ${d} días`, '', `${cs.length} viajes de ${d} días (sin contar la conducta "no contesta nunca"). Veces que sale cada ID en un mismo viaje.`, '', '| ID | Promedio por viaje | Máximo |', '|---|---|---|');
    const ids = new Map<string, number[]>();
    for (const c of cs) {
      const m = new Map<string, number>();
      for (const x of c.res.enviados) for (const id of x.ids) m.set(id, (m.get(id) ?? 0) + 1);
      for (const [id, v] of m) ids.set(id, [...(ids.get(id) ?? []), v]);
    }
    const filas = [...ids].map(([id, vs]) => ({ id, p: vs.reduce((a, b) => a + b, 0) / cs.length, max: Math.max(...vs) })).sort((a, b) => b.p - a.p || a.id.localeCompare(b.id));
    for (const f of filas) if (f.max > 1) out.push(`| ${f.id} | ${f1(f.p)} | ${f.max} |`);
    // Mensajes enteros idénticos
    const iguales = cs.map((c) => {
      const m = new Map<string, number>();
      for (const x of c.res.enviados) if (x.origen === 'programado') m.set(x.texto, (m.get(x.texto) ?? 0) + 1);
      return Math.max(0, ...m.values());
    });
    out.push('', `Preguntas enteras idénticas (el mismo texto, letra por letra) en un viaje de ${d} días: como mucho ${Math.max(0, ...iguales)} veces el mismo (promedio del peor por viaje: ${f1(prom(iguales))}).`);
  }

  // Álbum
  out.push('', '## Cuánto tarda en cerrarse el álbum', '', 'Desde AL1 hasta DES, en horas.', '', '| Álbum | Viajes con álbum abierto | Cerrados | Promedio | Máximo | AL2 por viaje (prom.) |', '|---|---|---|---|---|---|');
  for (const a of [...ALBUMES, 'todos'] as const) {
    const cs = corridas.filter((c) => (a === 'todos' || c.e.conductaAlbum === a) && c.res.al1En);
    const cerrados = cs.filter((c) => c.res.desEn);
    const horas = cerrados.map((c) => (c.res.desEn!.getTime() - c.res.al1En!.getTime()) / HORA);
    const al2 = cs.map((c) => c.res.enviados.filter((m) => m.ids.includes('AL2')).length);
    out.push(`| ${a} | ${cs.length} | ${cerrados.length} | ${f1(prom(horas))} | ${f1(Math.max(0, ...horas))} | ${f1(prom(al2))} |`);
  }
  const sinAlbum = corridas.filter((c) => !c.res.al1En).length;
  const conAl3 = corridas.filter((c) => c.res.enviados.some((m) => m.ids.includes('AL3')));
  const eligio = conAl3.filter((c) => !c.res.enviados.some((m) => m.ids.includes('DES+'))).length;
  out.push(
    '',
    `${sinAlbum} viajes no abren el álbum. Con CA1 sin respuesta, el álbum se abre igual al día siguiente con AL1-P.`,
    `AL3 (fotos de más): ${conAl3.length} viajes; en ${eligio} eligió cuáles sacar (DES sin DES+), en ${conAl3.length - eligio} quedaron las primeras (DES+).`,
  );

  // Otros idiomas
  if (otros.length) {
    out.push(
      '',
      '## Otros idiomas (catalán y castellano de España)',
      '',
      'Las mismas semillas (1 a 800) con la compra en `ca` y en `es-ES`: el mismo viaje, con los textos del idioma, nombres y preguntas propias en ese idioma, y la persona escribiendo como se escribe ahí ("passo", "ja està", "d\'acord", "vale", "ya está", "me la salto"…). Todo lo que escribe pasa por el detector de verdad (`palabras.ts`). Además de todas las invariantes de arriba: l1 (texto de otro idioma), l2 (marca sin reemplazar) y l3 (el detector no entiende).',
      '',
      '| Idioma | Viajes | Invariantes rotas | Mensajes (prom.) |',
      '|---|---|---|---|',
    );
    for (const idioma of ['ca', 'es-ES'] as const) {
      const cs = otros.filter((c) => c.e.idioma === idioma);
      if (!cs.length) continue;
      const rotas = Object.keys(INVARIANTES).filter((inv) => cs.some((c) => c.violaciones.some((x) => x.inv === inv)));
      out.push(`| ${idioma} | ${cs.length} | ${rotas.length ? rotas.map((inv) => `${inv} (${cs.filter((c) => c.violaciones.some((x) => x.inv === inv)).length})`).join(', ') : 'ninguna'} | ${f1(prom(cs.map((c) => c.res.enviados.length)))} |`);
    }
  }
  return out.join('\n') + '\n';
}

// ── El md de una lectura (mismo formato que lectura-corrida.md) ─────────────

function tituloDelDia(f: string, zona: Zona, compra: Compra): string {
  const [, m, d] = f.split('-').map(Number);
  const desdeSalida = diasEntre(compra.salida, f);
  const n = diasEntre(compra.salida, compra.vuelta);
  let que: string;
  if (desdeSalida < 0) que = 'Antes de salir';
  else if (desdeSalida === 0) que = n === 0 ? 'Día 1 · salida y vuelta' : 'Día 1 · salida';
  else if (desdeSalida === n) que = `Día ${desdeSalida + 1} · vuelta`;
  else if (desdeSalida < n) que = `Día ${desdeSalida + 1} del viaje`;
  else que = 'Ya en casa';
  return `## ${que} · ${diaDeSemana(f)} ${d}/${m} (hora de ${nombreDeZona(zona)})`;
}

export function lecturaMd(res: Resultado, titulo: string, encabezado: string[]): string {
  const orden = res.lineas
    .map((l, i) => ({ l, i }))
    .sort((a, b) => a.l.instante.getTime() - b.l.instante.getTime() || a.i - b.i)
    .map((x) => x.l);
  const out: string[] = [
    `# Vitácora de Viaje V2 · ${titulo}`,
    '',
    `Un viaje **inventado**, mensaje por mensaje, como le llegaría por WhatsApp. Generado por \`fabrica/scripts/viaje-v2-simular.ts\` con el código de \`fabrica/src/viaje-v2/\` y los textos de ${res.compra.idioma && res.compra.idioma !== 'es-AR' ? `\`idiomas/banco-${res.compra.idioma}.md\` (la estructura, de \`banco.md\`)` : '`banco.md`'}: no editar a mano.`,
    '',
    ...encabezado.map((x) => `- ${x}`),
    '- Las respuestas van en cursiva y son inventadas. Al lado de cada mensaje, los IDs del banco de donde sale. Las notas entre paréntesis no las ve nadie: son para leer.',
  ];
  let t = '';
  for (const l of orden) {
    const { fecha: f, hora: hh } = aLocal(l.instante, l.zona);
    const tt = tituloDelDia(f, l.zona, res.compra);
    if (tt !== t) {
      out.push('', tt);
      t = tt;
    }
    out.push('');
    if (l.de === 'nota') out.push(`_(${l.texto})_`);
    else if (l.de === 'persona') out.push(`**${hh} · ${res.compra.nombre}**  `, `_[${l.texto}]_`);
    else if (l.de === 'corazon') out.push(`**${hh} · Vitácora** reacciona ${l.texto} a su mensaje`);
    else {
      out.push(`**${hh} · Vitácora** ${l.ids!.map((id) => `\`${id}\``).join(' + ')}  `);
      out.push(...l.texto.split('\n\n').flatMap((p, i) => (i === 0 ? [`> ${p}`] : ['>', `> ${p}`])));
    }
  }
  const { violaciones } = revisar(res);
  out.push('', '---', '', violaciones.length ? `**Invariantes rotas en este viaje:** ${violaciones.map((x) => `${x.inv} (${x.detalle})`).join('; ')}` : '_(Este viaje no rompe ninguna invariante del simulador.)_');
  return out.join('\n') + '\n';
}

// ── Persona con guion (para las lecturas) ────────────────────────────────────

export type Dicho = { hora: string; masDias?: number; respuesta: Respuesta; dice: string; fotos?: number };
export type Guion = {
  si: { minutos: number };
  contestar: (q: Pregunta) => Dicho[];
  trasRecordatorio?: (q: Pregunta) => Dicho[];
  sueltas?: { dia: number; hora: string; dice: string }[];
  album: { masDias: number; hora: string; evento: GestoAlbum['evento']; cantidad?: number; dice: string }[];
  alAL2?: ({ minutos: number; evento: GestoAlbum['evento']; cantidad?: number; dice: string } | null)[];
  /** A AL3: reenvía las últimas `sacaUltimas` fotos, o contesta otra cosa. */
  alAL3?: { minutos: number; sacaUltimas?: number; dice: string };
};

export class PersonaGuion implements Persona {
  constructor(
    private compra: Compra,
    private g: Guion,
  ) {}
  si(bien1: Date) {
    return { en: mas(bien1, this.g.si.minutos * MIN), dice: 'texto: SÍ' };
  }
  private aIntentos(q: Pregunta, ds: Dicho[]): Intento[] {
    return ds.map((d) => ({ en: aInstante(sumarDias(q.fecha, d.masDias ?? 0), d.hora, q.zona), respuesta: d.respuesta, dice: d.dice, ...(d.fotos ? { fotos: d.fotos } : {}) }));
  }
  contestar(q: Pregunta) {
    return this.aIntentos(q, this.g.contestar(q));
  }
  trasRecordatorio(q: Pregunta) {
    return this.aIntentos(q, this.g.trasRecordatorio?.(q) ?? []);
  }
  sueltas() {
    return (this.g.sueltas ?? []).map((s) => ({ en: aInstante(sumarDias(this.compra.salida, s.dia), s.hora, this.compra.zonaViaje), dice: s.dice }));
  }
  album(al1: Date): GestoAlbum[] {
    const f = aLocal(al1, this.compra.zonaCasa).fecha;
    return this.g.album.map((a) => ({ en: aInstante(sumarDias(f, a.masDias), a.hora, this.compra.zonaCasa), evento: a.evento, cantidad: a.cantidad, dice: a.dice }));
  }
  alAL2(al2: Date, numero: number): GestoAlbum | null {
    const a = this.g.alAL2?.[numero - 1];
    return a ? { en: mas(al2, a.minutos * MIN), evento: a.evento, cantidad: a.cantidad, dice: a.dice } : null;
  }
  alAL3(al3: Date, ids: readonly string[]): GestoAlbum | null {
    const a = this.g.alAL3;
    if (!a) return null;
    const en = mas(al3, a.minutos * MIN);
    return a.sacaUltimas ? { en, evento: 'reenvio', ids: ids.slice(-a.sacaUltimas), dice: a.dice } : { en, evento: 'otra', dice: a.dice };
  }
  nazaCierra(aviso: Date): Date {
    return mas(aviso, 20 * HORA);
  }
}

const audio = (hora: string, dice: string, extra: Partial<Dicho> = {}): Dicho => ({ hora, respuesta: { tipo: 'audio' }, dice: `audio: ${dice}`, ...extra });
const escrito = (hora: string, dice: string, extra: Partial<Dicho> = {}): Dicho => ({ hora, respuesta: { tipo: 'texto' }, dice: `texto: ${dice}`, ...extra });
const foto = (hora: string, dice: string, extra: Partial<Dicho> = {}): Dicho => ({ hora, respuesta: { tipo: 'foto' }, dice: `foto: ${dice}`, ...extra });
const paso = (hora: string): Dicho => ({ hora, respuesta: { tipo: 'paso' }, dice: 'texto: paso' });

/** Escapada de un día: compra el mismo día que sale, para uno, PDF. Persona inventada. */
export function lecturaUnDia(): { res: Resultado; md: string } {
  const compra: Compra = {
    nombre: 'Nora',
    salida: '2026-11-14',
    vuelta: '2026-11-14',
    zonaCasa: ZONAS.ba,
    zonaViaje: ZONAS.ba,
    horaNoche: '21:30',
    preguntasPropias: [],
    formato: 'pdf',
    fotosAlbum: 20,
  };
  const g: Guion = {
    si: { minutos: 6 },
    contestar: (q) =>
      ((
        {
          AS1: [audio('09:15', 'hace años que digo que quiero ver el río desde el otro lado; hoy a la mañana me desperté y dije "hoy"')],
          'D0-manana': [audio('10:25', 'el termo cargado, las llaves en la mano y la gata mirándome desde la silla')],
          'D0-mediodia': [foto('13:50', 'un frasco de dulce de leche casero y una piedra lisa')],
          'D1-manana': [audio('11:05', 'a la vuelta, en el micro, con la cabeza contra el vidrio, mirando los campos ponerse naranjas')],
          'D1-noche': [audio('21:55', 'que la casa estaba igual pero yo no; y que la gata ni se enteró que me fui', { fotos: 1 })],
        } as Record<string, Dicho[]>
      )[q.clave] ?? []),
    album: [
      // AL1 sale a las 10:00 del día siguiente de CA1: las fotos van después.
      { masDias: 0, hora: '10:40', evento: 'foto', cantidad: 9, dice: '9 fotos' },
      { masDias: 0, hora: '10:44', evento: 'listo', dice: 'texto: listo, son esas' },
    ],
  };
  const res = simular(compra, aInstante('2026-11-14', '08:20', compra.zonaCasa), new PersonaGuion(compra, g));
  const md = lecturaMd(res, 'Lectura: escapada de un día', [
    '**La compra ya no permite viajes de 1 día (mínimo 3; simulaciones).** Esta lectura queda como prueba del código de viajes cortos, que sigue.',
    'Nora, para ella; escapada de un día (sale y vuelve el 2026-11-14). **Compra el mismo día que sale**, a las 8:20.',
    'Casa y viaje: Buenos Aires. Noche a las 21:30. Libro en PDF, álbum de 20. Sin preguntas propias.',
  ]);
  return { res, md };
}

/** Buenos Aires → Montevideo, 2 días, regalo, 1 pregunta propia. Persona inventada. */
export function lecturaDosDias(): { res: Resultado; md: string } {
  const compra: Compra = {
    nombre: 'Ramiro',
    salida: '2026-12-05',
    vuelta: '2026-12-06',
    zonaCasa: ZONAS.ba,
    zonaViaje: ZONAS.montevideo,
    horaNoche: '21:30',
    regalo: { quienRegala: 'Celeste' },
    preguntasPropias: ['¿Qué te hizo acordar a nosotros?'],
    formato: 'impreso',
    fotosAlbum: 20,
  };
  const g: Guion = {
    si: { minutos: 35 },
    contestar: (q) =>
      ((
        {
          AS1: [audio('20:40', 'Celeste lo planeó todo a escondidas; yo me enteré con el pasaje impreso arriba de la almohada')],
          AS2: [audio('19:10', 'ganas; y un poco de culpa por dejar el taller dos días', { masDias: 1 })],
          IM1: [{ ...paso('09:30'), masDias: 1 }],
          VA1: [escrito('22:05', 'el mate de mi viejo, el de calabaza, que no se lo presto a nadie')],
          'D0-manana': [audio('10:40', 'regando las plantas a las apuradas y buscando el pasaporte que estaba en la campera')],
          'D1-manana': [audio('12:00', 'el buque saliendo del puerto, el agua marrón, y nadie hablando en la cubierta')],
          'D1-mediodia': [foto('13:35', 'una bolsa con alfajores y una tabla de picar de madera')],
          'D2-manana': [audio('10:50', 'cuando vi la costanera de acá desde el barco; se me cerró algo en el pecho')],
          'D2-noche': [audio('21:40', 'el olor a encierro y el reloj de la cocina, que no había notado nunca que hacía tanto ruido')],
        } as Record<string, Dicho[]>
      )[q.clave] ?? []),
    album: [
      // AL1 sale a las 10:00 del día siguiente de CA1: las fotos van después.
      { masDias: 0, hora: '10:30', evento: 'foto', cantidad: 12, dice: '12 fotos' },
      { masDias: 0, hora: '15:00', evento: 'foto', cantidad: 5, dice: '5 fotos más, a la tarde' },
    ],
    alAL2: [{ minutos: 40, evento: 'si', dice: 'texto: sí, están todas' }],
  };
  const res = simular(compra, aInstante('2026-11-30', '19:40', compra.zonaCasa), new PersonaGuion(compra, g));
  const md = lecturaMd(res, 'Lectura: dos días en Montevideo', [
    '**La compra ya no permite viajes de 2 días (mínimo 3; simulaciones).** Esta lectura queda como prueba del código de viajes cortos, que sigue.',
    'Ramiro, regalo de su pareja Celeste; 2 días (sale el 2026-12-05, emprende la vuelta el 2026-12-06). Compra el 30/11.',
    'Casa: Buenos Aires. Viaje: Montevideo. Noche a las 21:30. Libro impreso, álbum de 20.',
    'Pregunta de Celeste: «¿Qué te hizo acordar a nosotros?» (un viaje de 2 días no tiene noches comunes: no entra y queda en los avisos a Naza).',
  ]);
  return { res, md };
}

/** Madrid → Tokio, 30 días: se saltea 3 noches seguidas, escribe a veces, álbum de 40, 5 propias. Persona inventada. */
export function lecturaTreintaDias(): { res: Resultado; md: string } {
  const compra: Compra = {
    nombre: 'Irene',
    salida: '2026-10-12',
    vuelta: '2026-11-10',
    zonaCasa: ZONAS.madrid,
    zonaViaje: ZONAS.tokio,
    horaNoche: '21:30',
    regalo: { quienRegala: 'Bruno' },
    preguntasPropias: [
      '¿Qué comida te gustaría que aprendamos a cocinar juntos?',
      '¿Hubo algún momento en que te sentiste perdida?',
      '¿Qué palabra de allá te vas a quedar?',
      '¿Qué le mostrarías a mamá si estuviera ahí?',
      '¿Qué te dio más vergüenza?',
    ],
    formato: 'impreso',
    fotosAlbum: 40,
  };
  const noches = [
    'unos fideos en un puesto de seis asientos; el cocinero no me miró ni una vez y fue lo mejor del día',
    'me perdí en la estación y un señor me acompañó tres andenes sin decir una palabra',
    'un templo chiquito entre dos edificios, con una señora barriendo hojas',
    'llovió todo el día y me quedé leyendo en un café con gatos',
    'el tren bala: me dormí y me desperté con la montaña en la ventana',
    'un baño público de aguas termales; me costó entrar y después no quería salir',
    'una chica me enseñó a doblar una grulla de papel en el andén',
    'caminé hasta que me dolieron los pies y terminé en un parque lleno de ciervos',
  ];
  const mediodias = ['una esquina con cables', 'mis zapatillas mojadas', 'diez segundos de cigarras', 'el cielo blanco', 'un cartel que no entiendo', 'un vaso de té frío'];
  const salteadas = new Set([9, 10, 11]);
  const escribe = new Set([4, 15, 22]);
  const g: Guion = {
    si: { minutos: 50 },
    contestar: (q) => {
      const d = q.dia ?? 0;
      switch (q.tipo) {
        case 'cadena':
          return (
            {
              AS1: [audio('21:00', 'Bruno me regaló la guía hace cinco años y nunca la abrí; en el cumple me la devolvió con el pasaje adentro')],
              AS2: [escrito('13:20', 'nervios de los buenos; el que me cayó fue cuando compré el adaptador de enchufe', { masDias: 2 })],
              IM1: [audio('18:45', 'una calle angosta con farolitos rojos, y yo sola caminando de noche', { masDias: 1 })],
            } as Record<string, Dicho[]>
          )[q.clave] ?? [];
        case 'UC1':
          return [audio('10:30', 'cerrando la maleta con la rodilla y la radio puesta, como hacía mi padre')];
        case 'ID1':
          return [audio('11:40', 'el avión apagó las luces y alguien abrió la ventanilla: todo blanco abajo')];
        case 'MD':
          return d % 5 === 3 ? [] : [foto('13:25', mediodias[d % mediodias.length])];
        case 'VU0':
          return [foto('14:10', 'un paquete de té, unos palillos envueltos en tela')];
        case 'VU1':
          return [audio('11:30', 'en el aeropuerto de escala, cuando oí a alguien hablar en español')];
        case 'CA1':
          return [audio('21:50', 'la luz: mi casa tiene una luz amarilla que no sabía que tenía', { fotos: 1 })];
        default: {
          if (salteadas.has(d)) return [];
          const t = noches[d % noches.length];
          if (escribe.has(d)) return [escrito('22:35', t)];
          return [audio('22:20', t, d % 4 === 0 ? { fotos: 2 } : {})];
        }
      }
    },
    trasRecordatorio: () => [],
    sueltas: [
      { dia: 6, hora: '17:10', dice: 'foto suelta: un gato durmiendo sobre una moto' },
      { dia: 18, hora: '19:40', dice: 'foto suelta: el monte Fuji desde el tren' },
    ],
    album: [
      // AL1 sale a las 10:00 del día siguiente de CA1: las fotos van después.
      { masDias: 0, hora: '11:00', evento: 'foto', cantidad: 25, dice: '25 fotos' },
      { masDias: 0, hora: '15:00', evento: 'foto', cantidad: 20, dice: '20 fotos más' },
    ],
    alAL2: [{ minutos: 30, evento: 'si', dice: 'texto: sí, ya están' }],
    alAL3: { minutos: 25, sacaUltimas: 5, dice: 'reenvía 5 fotos para sacar' },
  };
  const res = simular(compra, aInstante('2026-09-22', '17:30', compra.zonaCasa), new PersonaGuion(compra, g));
  const md = lecturaMd(res, 'Lectura: treinta días en Japón', [
    'Irene, regalo de su hermano Bruno; 30 días (sale el 2026-10-12, emprende la vuelta el 2026-11-10). Compra el 22/9. Cruza el cambio de hora de Europa (25/10).',
    'Casa: Madrid. Viaje: Tokio (+7 h en octubre, +8 h desde el 25/10). Noche a las 21:30. Libro impreso, álbum de 40.',
    `Preguntas de Bruno: ${compra.preguntasPropias.map((p) => `«${p}»`).join(' · ')}`,
    'Deja VA1 colgada (le llega REC1-U y tampoco contesta), se saltea las noches de los días 10, 11 y 12, escribe tres noches y manda dos fotos sueltas. Al álbum le manda 45 fotos y, con AL3, reenvía las 5 que saca.',
  ]);
  return { res, md };
}

/** Una respuesta escrita con una palabra del sistema ("passo", "paso"): pasa por el detector. */
const pasoDicho = (hora: string, palabra: string, extra: Partial<Dicho> = {}): Dicho => ({ hora, respuesta: { tipo: 'paso' }, dice: `texto: ${palabra}`, ...extra });

/**
 * En catalán: Laia, regalo de Jordi; 8 días de Barcelona a Lisboa; impreso,
 * álbum de 20, 2 preguntas de Jordi. Dice "passo" a una pregunta de antes de
 * salir y a una noche, deja una noche sin contestar y manda fotos de más.
 * Persona inventada.
 */
export function lecturaCa(): { res: Resultado; md: string } {
  const compra: Compra = {
    nombre: 'Laia',
    salida: '2026-10-16',
    vuelta: '2026-10-23',
    zonaCasa: ZONAS.madrid, // Barcelona usa la hora de Madrid
    zonaViaje: 'Europe/Lisbon',
    horaNoche: '21:30',
    regalo: { quienRegala: 'Jordi' },
    preguntasPropias: ['Quin racó de Lisboa voldries ensenyar-me?', 'Què has menjat que no havies tastat mai?'],
    formato: 'impreso',
    fotosAlbum: 20,
    idioma: 'ca',
  };
  const noches: Record<number, Dicho[]> = {
    1: [audio('22:10', "vaig dinar sardines a la brasa en una terrassa petita; el cambrer em parlava en portuguès i jo li contestava en català, i ens enteníem", { fotos: 2 })],
    2: [audio('22:30', 'el tramvia 28 ple a vessar; una senyora em va fer lloc i em va explicar on baixar')],
    3: [pasoDicho('21:50', 'passo')],
    4: [],
    5: [audio('22:05', "a Belém, la cua dels pastissos; me'n vaig menjar tres asseguda al riu", { fotos: 1 })],
  };
  const g: Guion = {
    si: { minutos: 25 },
    contestar: (q) => {
      const d = q.dia ?? 0;
      switch (q.tipo) {
        case 'cadena':
          return (
            {
              AS1: [audio('20:30', "en Jordi em va dir: «fa deu anys que dius que vols veure Lisboa». I va comprar els bitllets aquella mateixa nit")],
              AS2: [audio('19:15', 'ganes i una mica de por de viatjar sola; me n\'he adonat fent la llista de coses a la nevera', { masDias: 1 })],
              IM1: [{ ...pasoDicho('09:40', 'passo'), masDias: 1 }],
              VA1: [audio('22:00', "la llibreta de tapes vermelles on dibuixo; va a tots els viatges")],
            } as Record<string, Dicho[]>
          )[q.clave] ?? [];
        case 'UC1':
          return [audio('10:40', 'regant les plantes i deixant la clau a la veïna; el gat ja sabia que marxava')];
        case 'ID1':
          return [audio('11:20', "a l'avió, quan es va veure el mar i després el riu tan ample; vaig pensar que ja era lluny")];
        case 'MD':
          return d === 4 ? [] : [foto('13:30', ['una paret de rajoles blaves', 'les meves vambes a la pujada', 'un tramvia groc', 'el cel net sobre el riu'][d % 4])];
        case 'FN1':
          return [audio('22:15', 'el miradouro de la Graça al vespre, amb una noia cantant fado fluixet; aquesta no la vull oblidar')];
        case 'VU0':
          return [foto('13:40', 'una llauna de sardines i un tovalló brodat')];
        case 'VU1':
          return [audio('11:00', "quan vaig sentir l'avís en català a l'aeroport del Prat")];
        case 'CA1':
          return [audio('21:45', 'que el pis fa olor de casa, i que el rellotge de la cuina fa molt de soroll')];
        default:
          return noches[d] ?? [audio('22:00', 'un dia de caminar molt; pujades i baixades')];
      }
    },
    album: [
      // AL1 sale a las 10:00 del día siguiente de CA1: las fotos van después.
      { masDias: 0, hora: '10:30', evento: 'foto', cantidad: 15, dice: '15 fotos' },
      { masDias: 0, hora: '11:10', evento: 'foto', cantidad: 11, dice: '11 fotos més' },
      { masDias: 0, hora: '11:15', evento: 'listo', dice: 'texto: ja està' },
    ],
    // A AL3 no contesta: a las 5 horas quedan las primeras 20 y va DES con DES+.
  };
  const res = simular(compra, aInstante('2026-10-08', '18:00', compra.zonaCasa), new PersonaGuion(compra, g));
  const md = lecturaMd(res, 'Lectura en catalán', [
    'Laia, regalo de Jordi; 8 días (sale el 2026-10-16, emprende la vuelta el 2026-10-23). Compra el 8/10. **Idioma: catalán** (textos de `idiomas/banco-ca.md`).',
    'Casa: Barcelona (hora de Madrid). Viaje: Lisboa (una hora menos). Noche a las 21:30. Libro impreso, álbum de 20.',
    `Preguntas de Jordi: ${compra.preguntasPropias.map((p) => `«${p}»`).join(' · ')}`,
    'Dice "passo" a IM1 y a una noche, deja sin contestar un mediodía y la segunda pregunta de Jordi (la noche siguiente lleva ATR-PR), y al álbum le manda 26 fotos, escribe "ja està" y no contesta AL3.',
  ]);
  return { res, md };
}

/**
 * En castellano de España: Marta, para ella; 8 días de Madrid a Roma; PDF,
 * álbum de 20. Dice "paso" a un mediodía y a una noche, deja una noche sin
 * contestar y manda fotos de más. Persona inventada.
 */
export function lecturaEsES(): { res: Resultado; md: string } {
  const compra: Compra = {
    nombre: 'Marta',
    salida: '2026-11-06',
    vuelta: '2026-11-13',
    zonaCasa: ZONAS.madrid,
    zonaViaje: 'Europe/Rome',
    horaNoche: '21:00',
    preguntasPropias: [],
    formato: 'pdf',
    fotosAlbum: 20,
    idioma: 'es-ES',
  };
  const noches: Record<number, Dicho[]> = {
    1: [audio('22:00', 'una carbonara en una trattoria del Trastevere; el dueño me sacó un limoncello sin pedirlo', { fotos: 1 })],
    2: [audio('21:40', 'me senté una hora en la escalinata de una iglesia a ver pasar a la gente; nadie tenía prisa')],
    3: [],
    4: [pasoDicho('21:20', 'paso de esta')],
    5: [audio('22:20', 'en el Panteón empezó a llover por el agujero del techo y todo el mundo se quedó mirando hacia arriba', { fotos: 2 })],
  };
  const g: Guion = {
    si: { minutos: 10 },
    contestar: (q) => {
      const d = q.dia ?? 0;
      switch (q.tipo) {
        case 'cadena':
          return (
            {
              AS1: [audio('21:00', 'llevaba años diciendo que quería ir sola a algún sitio; un domingo abrí el ordenador y lo reservé antes de pensarlo dos veces')],
              AS2: [audio('20:10', 'con ganas y con algo de vértigo; me di cuenta cuando pedí los días en el trabajo', { masDias: 1 })],
              IM1: [audio('09:15', 'una plaza con una fuente y yo sentada con un café', { masDias: 1 })],
              VA1: [escrito('23:05', 'un libro de poemas que era de mi abuela; viaja siempre conmigo')],
            } as Record<string, Dicho[]>
          )[q.clave] ?? [];
        case 'UC1':
          return [audio('10:20', 'cerrando la maleta sentada encima y repasando que el gas estuviera cerrado')];
        case 'ID1':
          return [audio('12:00', 'en el tren del aeropuerto, viendo pinos y casas amarillas; ahí supe que ya estaba lejos')];
        case 'MD':
          return d === 3 ? [pasoDicho('13:20', 'paso')] : [foto('13:35', ['un cartel de una farmacia antigua', 'mis zapatillas en los adoquines', 'el cielo entre dos tejados', 'una taza de café vacía'][d % 4])];
        case 'FN1':
          return [audio('22:00', 'la luz naranja sobre los tejados desde el Gianicolo; esa quiero guardarla')];
        case 'VU0':
          return [foto('13:50', 'un paquete de pasta y una postal')];
        case 'VU1':
          return [audio('11:30', 'cuando el avión giró y vi la sierra; ya estaba volviendo')];
        case 'CA1':
          return [audio('21:10', 'que mi casa es más silenciosa de lo que pensaba')];
        default:
          return noches[d] ?? [audio('21:30', 'un día de caminar sin plan')];
      }
    },
    album: [
      { masDias: 0, hora: '10:45', evento: 'foto', cantidad: 18, dice: '18 fotos' },
      { masDias: 0, hora: '12:30', evento: 'foto', cantidad: 6, dice: '6 fotos más' },
      { masDias: 0, hora: '12:35', evento: 'listo', dice: 'texto: ya está' },
    ],
    alAL3: { minutos: 20, dice: 'texto: déjalo, elige tú' },
  };
  const res = simular(compra, aInstante('2026-10-28', '20:15', compra.zonaCasa), new PersonaGuion(compra, g));
  const md = lecturaMd(res, 'Lectura en castellano de España', [
    'Marta, para ella; 8 días (sale el 2026-11-06, emprende la vuelta el 2026-11-13). Compra el 28/10. **Idioma: castellano de España** (textos de `idiomas/banco-es-ES.md`).',
    'Casa: Madrid. Viaje: Roma (misma hora). Noche a las 21:00. Libro en PDF, álbum de 20. Sin preguntas propias.',
    'Escribe una vez en vez de audio, dice "paso" a un mediodía y "paso de esta" a una noche, deja una noche sin contestar, y al álbum le manda 24 fotos, escribe "ya está" y a AL3 le contesta "déjalo, elige tú".',
  ]);
  return { res, md };
}

// ── Correr ───────────────────────────────────────────────────────────────────

export function correrMuchos(cantidad: number, desde = 1, idioma: Idioma = 'es-AR'): Corrida[] {
  const out: Corrida[] = [];
  for (let s = desde; s < desde + cantidad; s++) out.push(correr(s, idioma));
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const iSem = args.indexOf('--semilla');
  const iIdi = args.indexOf('--idioma');
  const idiomaArg = iIdi >= 0 ? idiomaDe({ idioma: args[iIdi + 1] }) : 'es-AR';
  if (iSem >= 0) {
    const s = Number(args[iSem + 1]);
    const c = correr(s, idiomaArg);
    console.log(lecturaMd(c.res, `Simulación, semilla ${s}`, [describir(c.e)]));
    for (const x of c.hallazgos) console.log(`hallazgo ${x.inv}: ${x.detalle}`);
    return;
  }
  const cantidad = args[0] ? Number(args[0]) : 2400;
  const t0 = Date.now();
  const corridas = correrMuchos(cantidad);
  const seg = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${cantidad} viajes en ${seg} s`);
  for (const [inv, nombre] of Object.entries(INVARIANTES)) {
    const n = corridas.filter((c) => c.violaciones.some((x) => x.inv === inv)).length;
    if (n) console.log(`  ${inv.padEnd(4)} ${String(n).padStart(5)}  ${nombre}`);
  }
  console.log('Hallazgos:');
  for (const [inv, nombre] of Object.entries(HALLAZGOS)) {
    const n = corridas.filter((c) => c.hallazgos.some((x) => x.inv === inv)).length;
    if (n) console.log(`  ${inv.padEnd(4)} ${String(n).padStart(5)}  ${nombre}`);
  }
  // Los otros idiomas: 800 semillas cada uno.
  const otros: Corrida[] = [];
  for (const idioma of ['ca', 'es-ES'] as const) {
    const n = args[0] ? Math.min(cantidad, 800) : 800;
    const cs = correrMuchos(n, 1, idioma);
    otros.push(...cs);
    const rotas = Object.keys(INVARIANTES).filter((inv) => cs.some((c) => c.violaciones.some((x) => x.inv === inv)));
    console.log(`${idioma}: ${n} viajes, ${rotas.length ? `invariantes rotas: ${rotas.map((inv) => `${inv} (${cs.filter((c) => c.violaciones.some((x) => x.inv === inv)).length})`).join(', ')}` : 'ninguna invariante rota'}`);
  }
  if (args[0]) return;
  const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = path.join(FABRICA, '..', 'docs', 'viajes-v2', 'simulaciones');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'resumen.md'), resumenMd(corridas, otros), 'utf8');
  writeFileSync(path.join(dir, 'lectura-1-dia.md'), lecturaUnDia().md, 'utf8');
  writeFileSync(path.join(dir, 'lectura-2-dias.md'), lecturaDosDias().md, 'utf8');
  writeFileSync(path.join(dir, 'lectura-30-dias.md'), lecturaTreintaDias().md, 'utf8');
  writeFileSync(path.join(dir, 'lectura-ca.md'), lecturaCa().md, 'utf8');
  writeFileSync(path.join(dir, 'lectura-es-ES.md'), lecturaEsES().md, 'utf8');
  console.log(`Escrito: ${path.relative(process.cwd(), dir)}/ (resumen.md y 5 lecturas)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
