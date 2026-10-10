// El planificador de la entrevista de viaje (src/viaje-v2/planificador.ts):
// puro, serializable y re-entrante. Viajes y personas INVENTADOS.
import { describe, it, expect } from 'vitest';
import {
  alEntrar,
  audioMalo,
  cerrarAlbum,
  iniciar,
  preguntaAbierta,
  proximaAccion,
  proximaDelCalendario,
  queToca,
  reubicar,
  CERRAR_ALBUM_SOLO_MS,
  REPETIR_AVISO_ALBUM_MS,
  SILENCIO_GRUPO_MS,
  TOLERANCIA_ATRASO_MS,
  type Entrada,
  type EstadoViaje,
  type Paso,
  type Saliente,
} from '../src/viaje-v2/planificador.js';
import { aInstante, aLocal } from '../src/viaje-v2/horas.js';
import type { Compra } from '../src/viaje-v2/tipos.js';

const COMPRA: Compra = {
  nombre: 'Olga',
  salida: '2026-11-10',
  vuelta: '2026-11-16',
  zonaCasa: 'America/Argentina/Buenos_Aires',
  zonaViaje: 'Europe/Madrid',
  horaNoche: '21:30',
  preguntasPropias: ['¿Qué te hizo reír?'],
  formato: 'pdf',
  fotosAlbum: 20,
};

const MIN = 60_000;
const SI_EN = aInstante('2026-11-01', '10:00', COMPRA.zonaCasa);
const mas = (t: Date, ms: number) => new Date(t.getTime() + ms);
const ida = (e: EstadoViaje): EstadoViaje => JSON.parse(JSON.stringify(e));

let ids = 0;
const audio = (dice = 'audio: fue un día largo y lindo'): Entrada => ({ tipo: 'audio', idMensaje: `w${++ids}`, transcripcion: dice });
const texto = (t: string): Entrada => ({ tipo: 'texto', idMensaje: `w${++ids}`, texto: t });
const foto = (): Entrada => ({ tipo: 'foto', idMensaje: `w${++ids}` });

/**
 * Un viaje manejado como el bot: el reloj salta a proximaAccion y, cuando
 * llega una pregunta, `responder` dice qué manda la persona (y a qué hora).
 * `json`: el estado pasa por JSON en cada paso (como en la base).
 */
function manejar(
  compra: Compra,
  responder: (s: Saliente, t: Date, e: EstadoViaje) => { en: Date; entradas: Entrada[] }[],
  { json = false, hasta = Infinity }: { json?: boolean; hasta?: number } = {},
) {
  ids = 0;
  const salientes: { t: Date; s: Saliente }[] = [];
  const avisos: { t: Date; clave: string }[] = [];
  const persona: { en: Date; entradas: Entrada[] }[] = [];
  let e!: EstadoViaje;
  const tomar = (r: Paso, t: Date) => {
    e = json ? ida(r.estado) : r.estado;
    for (const a of r.avisos) avisos.push({ t, clave: a.clave });
    for (const s of r.salientes) {
      salientes.push({ t, s });
      persona.push(...responder(s, t, e));
      persona.sort((a, b) => a.en.getTime() - b.en.getTime());
    }
  };
  tomar(iniciar(compra, SI_EN), SI_EN);
  for (let pasos = 0; pasos < 5000; pasos++) {
    const prox = proximaAccion(compra, e);
    const tPlan = prox ? Date.parse(prox) : Infinity;
    const tPer = persona[0]?.en.getTime() ?? Infinity;
    const t = Math.min(tPlan, tPer);
    if (t === Infinity || t > hasta) break;
    if (tPlan <= tPer) tomar(queToca(compra, e, new Date(tPlan)), new Date(tPlan));
    else {
      const x = persona.shift()!;
      tomar(alEntrar(compra, e, x.entradas, x.en), x.en);
    }
  }
  return { e, salientes, avisos };
}

/** Contesta todo con un audio a los 10 minutos; al álbum, 12 fotos y "listo". */
const contestaTodo = (s: Saliente, t: Date) => {
  if (s.tipo !== 'pregunta') return [];
  if (s.clave === 'AL1') return [{ en: mas(t, 30 * MIN), entradas: Array.from({ length: 12 }, foto) }, { en: mas(t, 40 * MIN), entradas: [texto('listo')] }];
  if (s.clave === 'AL2' || s.clave === 'AL3') return [];
  return [{ en: mas(t, 10 * MIN), entradas: [audio()] }];
};

const firma = (xs: { t: Date; s: Saliente }[]) => xs.map(({ t, s }) => `${t.toISOString()} ${s.tipo} ${s.ids.join('+')}${s.aMensaje ? ` ❤️${s.aMensaje}` : ''}`);

describe('viaje v2 planificador: arranque', () => {
  it('con el SÍ salen BIEN-2 y AS1, y AS1 queda como la pregunta abierta', () => {
    const r = iniciar(COMPRA, SI_EN);
    expect(r.salientes.map((s) => [s.tipo, s.ids.join('+')])).toEqual([
      ['texto', 'BIEN-2'],
      ['pregunta', 'AS1'],
    ]);
    expect(r.estado.envios.map((x) => x.clave)).toEqual(['AS1']);
    expect(preguntaAbierta(r.estado)?.clave).toBe('AS1');
    expect(r.estado.armado).toBe(false);
    expect(ida(r.estado)).toEqual(r.estado);
  });

  it('el viaje entero termina con DES, y todo lo programado sale una vez', () => {
    const { e, salientes } = manejar(COMPRA, contestaTodo);
    expect(e.terminado).toBe(true);
    expect(salientes.filter(({ s }) => s.ids.includes('DES'))).toHaveLength(1);
    expect(e.calendario.every((g) => g.estado === 'enviado')).toBe(true);
    const claves = salientes.filter(({ s }) => s.origen === 'programado').map(({ s }) => s.clave);
    expect(new Set(claves).size).toBe(claves.length);
    expect(proximaAccion(COMPRA, e)).toBeNull();
  });
});

describe('viaje v2 planificador: re-entrante y serializable', () => {
  it('JSON ida y vuelta en cada paso: el mismo viaje, mensaje por mensaje', () => {
    const a = manejar(COMPRA, contestaTodo);
    const b = manejar(COMPRA, contestaTodo, { json: true });
    expect(firma(b.salientes)).toEqual(firma(a.salientes));
    expect(b.e).toEqual(a.e);
  });

  it('queToca dos veces con la misma hora no repite nada (en cada paso del viaje)', () => {
    let revisados = 0;
    manejar(COMPRA, (s, t, e) => {
      // Después de cada cosa que sale, otra vuelta con la misma hora no manda nada.
      const otra = queToca(COMPRA, e, t);
      expect(otra.salientes).toEqual([]);
      expect(otra.estado.calendario).toEqual(e.calendario);
      revisados++;
      return contestaTodo(s, t);
    });
    expect(revisados).toBeGreaterThan(20);
  });

  it('el estado es JSON puro en cada paso (sin Date, sin undefined)', () => {
    manejar(COMPRA, (s, t, e) => {
      const txt = JSON.stringify(e);
      expect(JSON.parse(txt)).toEqual(e);
      expect(txt).not.toContain('undefined');
      return contestaTodo(s, t);
    });
  });

  it('el bot con un tick por minuto da lo mismo que saltar a proximaAccion', () => {
    const saltando = manejar(COMPRA, contestaTodo, { hasta: aInstante('2026-11-12', '00:00', COMPRA.zonaCasa).getTime() });
    // Tick por minuto desde la salida hasta el día 2, con la persona del primer manejo.
    const { e: e0 } = manejar(COMPRA, contestaTodo, { hasta: aInstante('2026-11-10', '00:00', COMPRA.zonaCasa).getTime() });
    let e = e0;
    const salen: string[] = [];
    const pendientes: { en: Date; entradas: Entrada[] }[] = [];
    for (let t = aInstante('2026-11-10', '00:00', COMPRA.zonaCasa).getTime(); t <= aInstante('2026-11-12', '00:00', COMPRA.zonaCasa).getTime(); t += MIN) {
      const ahora = new Date(t);
      const llegan = pendientes.filter((x) => x.en.getTime() === t);
      const r = llegan.length ? alEntrar(COMPRA, e, llegan[0].entradas, ahora) : queToca(COMPRA, e, ahora);
      e = r.estado;
      for (const s of r.salientes) {
        salen.push(`${s.ids.join('+')}`);
        pendientes.push(...contestaTodo(s, ahora));
      }
    }
    const esperado = saltando.salientes.filter(({ t }) => t.getTime() >= aInstante('2026-11-10', '00:00', COMPRA.zonaCasa).getTime()).map(({ s }) => s.ids.join('+'));
    expect(salen).toEqual(esperado);
  });
});

/** El viaje hasta que sale algo que cumple `cual`: devuelve el estado y la hora. */
function hastaQueSale(compra: Compra, cual: (s: Saliente) => boolean, responder: (s: Saliente, t: Date, e: EstadoViaje) => { en: Date; entradas: Entrada[] }[] = contestaTodo) {
  let encontrado: { t: Date; s: Saliente } | null = null;
  let estado!: EstadoViaje;
  manejar(compra, (s, t, e) => {
    if (!encontrado && cual(s)) {
      encontrado = { t, s };
      estado = e;
    }
    return encontrado ? [] : responder(s, t, e);
  });
  if (!encontrado) throw new Error('No salió');
  return { ...(encontrado as { t: Date; s: Saliente }), e: estado };
}

describe('viaje v2 planificador: el grupo de respuesta', () => {
  it('audio, fotos y un texto seguidos son una sola respuesta: una reacción, y las fotos a fotosSueltas', () => {
    const { t, e } = hastaQueSale(COMPRA, (s) => s.origen === 'programado' && s.ids.some((id) => /^NO\d$/.test(id)));
    const sueltasAntes = e.fotosSueltas;
    let r = alEntrar(COMPRA, e, audio(), mas(t, 20 * MIN));
    r = alEntrar(COMPRA, r.estado, [foto(), foto()], mas(t, 22 * MIN));
    r = alEntrar(COMPRA, r.estado, texto('y la cena estuvo buenísima'), mas(t, 24 * MIN));
    expect(r.salientes).toEqual([]);
    // A los 2' del último todavía no se cierra.
    expect(queToca(COMPRA, r.estado, mas(t, 26 * MIN)).salientes).toEqual([]);
    expect(proximaAccion(COMPRA, r.estado)).toBe(mas(t, 24 * MIN + SILENCIO_GRUPO_MS).toISOString());
    const cierre = queToca(COMPRA, r.estado, mas(t, 27 * MIN));
    expect(cierre.salientes).toHaveLength(1);
    expect(cierre.salientes[0].ids[0]).toMatch(/^ACN/);
    expect(cierre.salientes[0].respondeA?.respuesta.tipo).toBe('audio');
    expect(cierre.estado.fotosSueltas).toBe(sueltasAntes + 2);
    const envio = cierre.estado.envios.at(-1)!;
    expect(envio.respuestas).toHaveLength(1);
    expect(envio.respuestas[0].en).toBe(mas(t, 20 * MIN).toISOString());
  });

  it('si llega la hora de otra pregunta con el grupo abierto, primero sale la reacción y después la pregunta', () => {
    const { t, e } = hastaQueSale(COMPRA, (s) => s.ids[0] === 'UC1');
    const proxima = proximaDelCalendario(e, t)!;
    const r = alEntrar(COMPRA, e, audio(), mas(proxima, -1 * MIN));
    const paso = queToca(COMPRA, r.estado, proxima);
    expect(paso.salientes.map((s) => s.origen)).toEqual(['reaccion', 'programado']);
    expect(paso.estado.envios.find((x) => x.clave === 'D0-manana')!.respuestas).toHaveLength(1);
    expect(t.getTime()).toBeLessThan(proxima.getTime());
  });

  it('un grupo que arrancó con la pregunta vieja cuenta para ella aunque llegue otra en el medio', () => {
    const { t, e } = hastaQueSale(COMPRA, (s) => s.ids[0] === 'UC1');
    const proxima = proximaDelCalendario(e, t)!;
    const r = alEntrar(COMPRA, e, audio(), mas(proxima, -1 * MIN));
    expect(r.clave).toBe('D0-manana');
  });
});

describe('viaje v2 planificador: respuesta tardía (cuenta para la última pregunta enviada)', () => {
  it('la noche sin contestar y llega un audio después del mediodía: es del mediodía (❤️), y la noche sigue sin contestar', () => {
    // No contesta la noche del día 2; el mediodía del día 3 sí, tarde.
    const { t, e } = hastaQueSale(COMPRA, (s) => s.origen === 'programado' && s.ids[0].startsWith('MD') && s.clave === 'D3-mediodia', (s, t) =>
      s.clave === 'D2-noche' ? [] : contestaTodo(s, t),
    );
    expect(e.envios.find((x) => x.clave === 'D2-noche')!.respuestas).toEqual([]);
    const a = audio('audio: anoche fuimos a un bar chiquito');
    const r = alEntrar(COMPRA, e, a, mas(t, 40 * MIN));
    expect(r.clave).toBe('D3-mediodia');
    const cierre = queToca(COMPRA, r.estado, mas(t, 43 * MIN));
    expect(cierre.salientes).toEqual([expect.objectContaining({ tipo: 'reaccion', emoji: '❤️', aMensaje: a.idMensaje })]);
    expect(cierre.estado.envios.find((x) => x.clave === 'D2-noche')!.respuestas).toEqual([]);
    expect(cierre.estado.envios.find((x) => x.clave === 'D3-mediodia')!.respuestas).toHaveLength(1);
  });

  it('algo más para una pregunta ya contestada se guarda sin acuse; una foto sola es suelta (❤️)', () => {
    const { t, e } = hastaQueSale(COMPRA, (s) => s.origen === 'programado' && s.clave === 'D2-noche');
    let r = alEntrar(COMPRA, e, audio(), mas(t, 10 * MIN));
    r = queToca(COMPRA, r.estado, mas(t, 13 * MIN)) as typeof r;
    expect(r.salientes[0].ids[0]).toMatch(/^ACN/);
    // Otro audio a la misma pregunta: se guarda, sin acuse.
    r = alEntrar(COMPRA, r.estado, audio('audio: me olvidé de contarte algo'), mas(t, 30 * MIN));
    r = queToca(COMPRA, r.estado, mas(t, 33 * MIN)) as typeof r;
    expect(r.salientes).toEqual([]);
    expect(r.estado.envios.find((x) => x.clave === 'D2-noche')!.respuestas).toHaveLength(2);
    // Una foto sola: suelta, con su ❤️.
    const f = foto();
    const antes = r.estado.fotosSueltas;
    r = alEntrar(COMPRA, r.estado, f, mas(t, 50 * MIN));
    const cierre = queToca(COMPRA, r.estado, mas(t, 53 * MIN));
    expect(cierre.salientes).toEqual([expect.objectContaining({ tipo: 'reaccion', aMensaje: f.idMensaje, respondeA: expect.objectContaining({ tipo: 'foto-suelta' }) })]);
    expect(cierre.estado.fotosSueltas).toBe(antes + 1);
  });

  it('con la pregunta abierta, una foto sola es la respuesta (A5: sin "Lo escuché")', () => {
    const { t, e } = hastaQueSale(COMPRA, (s) => s.origen === 'programado' && s.clave === 'D2-noche');
    const r = alEntrar(COMPRA, e, foto(), mas(t, 10 * MIN));
    const cierre = queToca(COMPRA, r.estado, mas(t, 13 * MIN));
    expect(cierre.salientes).toHaveLength(1);
    expect(cierre.salientes[0].ids[0]).toMatch(/^ACN[124]$/);
    expect(cierre.salientes[0].respondeA?.respuesta.tipo).toBe('foto');
  });
});

describe('viaje v2 planificador: audioMal', () => {
  it('audioMalo: descarga fallida, transcripción null o vacía', () => {
    expect(audioMalo({ tipo: 'audio', idMensaje: 'a', transcripcion: 'hola' })).toBe(false);
    expect(audioMalo({ tipo: 'audio', idMensaje: 'a', transcripcion: null })).toBe(true);
    expect(audioMalo({ tipo: 'audio', idMensaje: 'a', transcripcion: '   ' })).toBe(true);
    expect(audioMalo({ tipo: 'audio', idMensaje: 'a', transcripcion: 'hola', descargaFallo: true })).toBe(true);
    expect(audioMalo({ tipo: 'texto', idMensaje: 'a', texto: '' })).toBe(false);
  });

  it('solo audios malos → COR y la pregunta sigue abierta; el siguiente bueno la contesta', () => {
    const { t, e } = hastaQueSale(COMPRA, (s) => s.origen === 'programado' && s.clave === 'D2-noche');
    let r = alEntrar(COMPRA, e, { tipo: 'audio', idMensaje: 'malo1', transcripcion: null }, mas(t, 10 * MIN));
    r = queToca(COMPRA, r.estado, mas(t, 13 * MIN)) as typeof r;
    expect(r.salientes.map((s) => s.ids[0])).toEqual(['COR']);
    expect(preguntaAbierta(r.estado)?.clave).toBe('D2-noche');
    r = alEntrar(COMPRA, r.estado, audio(), mas(t, 30 * MIN));
    r = queToca(COMPRA, r.estado, mas(t, 33 * MIN)) as typeof r;
    expect(r.salientes[0].ids[0]).toMatch(/^ACN/);
    expect(preguntaAbierta(r.estado)).toBeNull();
  });

  it('un audio malo y uno bueno en el mismo grupo cuentan como audio (sin COR)', () => {
    const { t, e } = hastaQueSale(COMPRA, (s) => s.origen === 'programado' && s.clave === 'D2-noche');
    let r = alEntrar(COMPRA, e, { tipo: 'audio', idMensaje: 'malo2', transcripcion: '', descargaFallo: true }, mas(t, 10 * MIN));
    r = alEntrar(COMPRA, r.estado, audio(), mas(t, 11 * MIN));
    const cierre = queToca(COMPRA, r.estado, mas(t, 14 * MIN));
    expect(cierre.salientes.map((s) => s.ids[0])).toEqual([expect.stringMatching(/^ACN/)]);
  });

  it('"paso" escrito o dicho en un audio es "paso"', () => {
    const { t, e } = hastaQueSale(COMPRA, (s) => s.origen === 'programado' && s.clave === 'D2-noche');
    for (const entrada of [texto('paso'), audio('Paso.')]) {
      const r = alEntrar(COMPRA, e, entrada, mas(t, 10 * MIN));
      const cierre = queToca(COMPRA, r.estado, mas(t, 13 * MIN));
      expect(cierre.salientes[0].ids[0]).toMatch(/^PAS-V/);
    }
  });
});

describe('viaje v2 planificador: álbum con cero fotos', () => {
  const sinFotos = (s: Saliente, t: Date) => (s.clave === 'AL1' ? [] : contestaTodo(s, t));

  it('aviso a las 5 horas, otro a las 48, y a los 7 días se cierra solo con DES', () => {
    const { e, salientes, avisos } = manejar(COMPRA, sinFotos);
    const al1 = salientes.find(({ s }) => s.clave === 'AL1')!;
    const aviso = avisos.find((a) => a.clave === 'album-cero')!;
    expect(aviso.t.getTime() - al1.t.getTime()).toBe(5 * 3_600_000);
    const otro = avisos.find((a) => a.clave === 'album-cero-48h')!;
    expect(otro.t.getTime() - aviso.t.getTime()).toBe(REPETIR_AVISO_ALBUM_MS);
    const des = salientes.find(({ s }) => s.ids.includes('DES'))!;
    expect(des.t.getTime() - aviso.t.getTime()).toBeGreaterThanOrEqual(CERRAR_ALBUM_SOLO_MS);
    const h = aLocal(des.t, COMPRA.zonaCasa).hora;
    expect(h >= '08:00' && h < '23:00').toBe(true);
    expect(avisos.map((a) => a.clave)).toEqual(['album-cero', 'album-cero-48h', 'album-cero-cerrado']);
    expect(e.terminado).toBe(true);
    expect(e.album?.fase).toBe('cerrado');
  });

  it('si manda fotos después del aviso, no hay segundo aviso ni cierre solo', () => {
    const { avisos, salientes } = manejar(COMPRA, (s, t) => {
      if (s.clave === 'AL1') return [{ en: mas(t, 6 * 3_600_000), entradas: [foto(), foto()] }];
      if (s.clave === 'AL2') return [{ en: mas(t, 30 * MIN), entradas: [texto('sí')] }];
      return contestaTodo(s, t);
    });
    expect(avisos.map((a) => a.clave)).toEqual(['album-cero']);
    expect(salientes.filter(({ s }) => s.ids.includes('DES'))).toHaveLength(1);
  });

  it('los socios lo pueden cerrar antes (cerrarAlbum)', () => {
    const { t, e } = hastaQueSale(COMPRA, (s) => s.clave === 'AL1', sinFotos);
    const r = queToca(COMPRA, e, mas(t, 5 * 3_600_000));
    expect(r.avisos.map((a) => a.clave)).toEqual(['album-cero']);
    const c = cerrarAlbum(COMPRA, r.estado, mas(t, 20 * 3_600_000));
    expect(c.salientes.map((s) => [s.ids[0], s.origen])).toEqual([['DES', 'naza']]);
    expect(c.estado.terminado).toBe(true);
    expect(proximaAccion(COMPRA, c.estado)).toBeNull();
  });
});

describe('viaje v2 planificador: reubicar (cambio de país)', () => {
  it('conserva los ids de cada clave y recalcula solo la hora en la zona nueva; lo mandado no se toca', () => {
    const { e, t } = hastaQueSale(COMPRA, (s) => s.clave === 'D2-noche');
    const nueva: Compra = { ...COMPRA, zonaViaje: 'Asia/Tokyo' };
    const r = reubicar(e, nueva, mas(t, 60 * MIN));
    expect(r.zonas.map((z) => z.zonaViaje)).toEqual(['Europe/Madrid', 'Asia/Tokyo']);
    for (const g of e.calendario) {
      const h = r.calendario.find((x) => x.clave === g.clave)!;
      expect(h.ids, g.clave).toEqual(g.ids);
      expect(h.tipo).toBe(g.tipo);
      if (g.estado !== 'pendiente') expect(h).toEqual(g);
    }
    const md = r.calendario.find((x) => x.clave === 'D3-mediodia')!;
    expect(md.zona).toBe('Asia/Tokyo');
    expect(aLocal(new Date(md.instante), 'Asia/Tokyo')).toEqual({ fecha: '2026-11-13', hora: '13:00' });
    const ca1 = r.calendario.find((x) => x.tipo === 'CA1')!;
    expect(ca1).toEqual(e.calendario.find((x) => x.tipo === 'CA1')); // de casa: no cambia
    for (const g of r.calendario.filter((x) => x.estado === 'pendiente')) {
      const { hora } = aLocal(new Date(g.sale), g.zona);
      expect(hora >= '08:00' && hora < '23:00', g.clave).toBe(true);
    }
    expect(ida(r)).toEqual(r);
    // El viaje sigue con la compra nueva y termina.
    let estado = r;
    for (let i = 0; i < 200 && !estado.terminado; i++) {
      const prox = proximaAccion(nueva, estado);
      if (!prox) break;
      const p = queToca(nueva, estado, new Date(prox));
      estado = p.estado;
      if (p.salientes.some((s) => s.clave === 'AL1')) estado = alEntrar(nueva, estado, texto('listo'), new Date(Date.parse(prox) + MIN)).estado;
    }
    expect(estado.envios.find((x) => x.clave === 'D3-mediodia')!.ids).toEqual(md.ids);
  });

  it('antes de armar, también corre armarEn', () => {
    const e = iniciar(COMPRA, SI_EN).estado;
    const r = reubicar(e, { ...COMPRA, zonaViaje: 'Asia/Tokyo' }, SI_EN);
    expect(r.armarEn).not.toBe(e.armarEn);
    const primero = Math.min(...r.calendario.filter((g) => g.dia >= 1).map((g) => Date.parse(g.instante)));
    expect(Date.parse(r.armarEn)).toBe(primero - 1);
  });
});

describe('viaje v2 planificador: el bot estuvo caído', () => {
  it('lo programado que se atrasó más de 2 horas no sale (queda vencido); lo que llega a tiempo, sí', () => {
    const { e } = manejar(COMPRA, contestaTodo, { hasta: aInstante('2026-11-11', '12:00', 'Europe/Madrid').getTime() });
    const d2md = e.calendario.find((x) => x.clave === 'D2-mediodia')!;
    // Vuelve 3 horas después del mediodía del día 2: no sale.
    const r = queToca(COMPRA, e, new Date(Date.parse(d2md.sale) + TOLERANCIA_ATRASO_MS + 60 * MIN));
    expect(r.salientes.map((s) => s.clave)).not.toContain('D2-mediodia');
    expect(r.estado.calendario.find((x) => x.clave === 'D2-mediodia')!.estado).toBe('vencido');
    // Vuelve 30 minutos después: sale.
    const r2 = queToca(COMPRA, e, new Date(Date.parse(d2md.sale) + 30 * MIN));
    expect(r2.salientes.map((s) => s.clave)).toContain('D2-mediodia');
  });
});
