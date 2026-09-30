// "Simulaciones y lectura de Fable" (banco.md, aprobado por Naza el 30/09).
import { describe, it, expect } from 'vitest';
import {
  armarCalendario,
  validarCompra,
  combinacionDeNoche,
  momentoUC1,
  momentoAlbumSinCA1,
  COMIENZOS,
  CIERRES,
  ORDEN_PUERTAS,
} from '../src/viaje-v2/calendario.js';
import { alDecirSi, preguntaProgramada, reaccion, albumSinRespuesta, ROTACION_INICIAL, type Rotacion } from '../src/viaje-v2/mensajes.js';
import { iniciarAlbum, pasoAlbum, type EstadoAlbum, type EventoAlbum, type SalidaAlbum } from '../src/viaje-v2/album.js';
import { anotarEnvio, nuevoEstado, pendientesParaElViaje, anotarRespuesta } from '../src/viaje-v2/estado.js';
import { porId } from '../src/viaje-v2/banco.js';
import { renderizar, datosDeCompra } from '../src/viaje-v2/texto.js';
import { aInstante, aLocal } from '../src/viaje-v2/horas.js';
import type { Compra } from '../src/viaje-v2/tipos.js';

const BA = 'America/Argentina/Buenos_Aires';
const MADRID = 'Europe/Madrid';
const TOKIO = 'Asia/Tokyo';
const CDMX = 'America/Mexico_City';
const COMPRA: Compra = {
  nombre: 'Lucía',
  salida: '2026-10-10',
  vuelta: '2026-10-17',
  zonaCasa: BA,
  zonaViaje: MADRID,
  regalo: { quienRegala: 'Tomás' },
  preguntasPropias: [],
  formato: 'impreso',
  fotosAlbum: 20,
};
const t = (id: string, extra: Record<string, string> = {}) => renderizar(porId(id).texto, { ...datosDeCompra(COMPRA), ...extra });

describe('la compra: mínimo 3 días y noche entre 19:00 y 22:30', () => {
  it('rechaza viajes de 1 y 2 días con un error claro', () => {
    expect(() => validarCompra({ ...COMPRA, vuelta: '2026-10-10' })).toThrow(/al menos 3 días/);
    expect(() => validarCompra({ ...COMPRA, vuelta: '2026-10-11' })).toThrow(/al menos 3 días/);
    expect(() => validarCompra({ ...COMPRA, vuelta: '2026-10-12' })).not.toThrow();
  });

  it('el código de 1 y 2 días sigue: armarCalendario los arma (la compra es la que no los deja pasar)', () => {
    expect(armarCalendario({ ...COMPRA, vuelta: '2026-10-10' }, []).programados.map((p) => p.tipo)).toEqual(['UC1', 'VU0', 'IV1', 'CA1']);
  });

  it('rechaza la noche fuera de 19:00-22:30 (también en armarCalendario: 23:30 y 07:00 rompían el calendario)', () => {
    for (const h of ['23:30', '07:00', '22:59', '18:59', '22:31']) {
      expect(() => validarCompra({ ...COMPRA, horaNoche: h }), h).toThrow(/19:00 y las 22:30/);
      expect(() => armarCalendario({ ...COMPRA, horaNoche: h }, []), h).toThrow(/19:00 y las 22:30/);
    }
    for (const h of ['19:00', '21:30', '22:30']) expect(() => validarCompra({ ...COMPRA, horaNoche: h }), h).not.toThrow();
  });
});

describe('el SÍ tardío', () => {
  it('si el SÍ llega después del día de salida, AS1 va "ya de viaje"', () => {
    const [, as1] = alDecirSi(COMPRA, aInstante('2026-10-11', '09:00', BA));
    expect(as1.texto).toBe(renderizar(porId('AS1').yaDeViaje!, datosDeCompra(COMPRA)));
  });

  it('el mismo día de salida (o antes), AS1 normal', () => {
    expect(alDecirSi(COMPRA, aInstante('2026-10-10', '22:00', BA))[1].texto).toBe(t('AS1'));
    expect(alDecirSi(COMPRA, aInstante('2026-10-02', '12:00', BA))[1].texto).toBe(t('AS1'));
  });

  it('AS1 mandada "ya de viaje" no vuelve a salir en las noches', () => {
    let e = anotarEnvio(nuevoEstado(), { clave: 'AS1', tipo: 'cadena', ids: ['AS1'], en: 'x', yaDeViaje: true });
    expect(pendientesParaElViaje(e)).toEqual(['AS2', 'IM1', 'VA1']);
    e = anotarEnvio(e, { clave: 'AS2', tipo: 'cadena', ids: ['AS2'], en: 'x' });
    e = anotarRespuesta(e, 'AS2', { tipo: 'audio', en: 'x' });
    expect(pendientesParaElViaje(e)).toEqual(['IM1', 'VA1']);
  });

  it('compra el día de salida y SÍ después de las 10:00: UC1 dos horas después del SÍ, si todavía es ese día', () => {
    const uc1 = armarCalendario(COMPRA, []).programados[0];
    expect(momentoUC1(uc1, aInstante('2026-10-10', '09:00', BA), COMPRA)).toEqual(uc1.instante);
    expect(aLocal(momentoUC1(uc1, aInstante('2026-10-10', '14:20', BA), COMPRA)!, BA)).toEqual({ fecha: '2026-10-10', hora: '16:20' });
    expect(momentoUC1(uc1, aInstante('2026-10-10', '21:30', BA), COMPRA)).toBeNull(); // 23:30: franja → otro día
    expect(momentoUC1(uc1, aInstante('2026-10-11', '09:00', BA), COMPRA)).toBeNull();
  });
});

describe('ID1 nunca el día de salida en casa', () => {
  it('Buenos Aires → Madrid: 10:00 de Madrid (las 10 de casa son más tarde: 15:00 en Madrid)', () => {
    const id1 = armarCalendario(COMPRA, []).programados.find((p) => p.tipo === 'ID1')!;
    // 10:00 BA = 15:00 Madrid, que es más tarde que 10:00 Madrid
    expect(id1.instante.toISOString()).toBe(aInstante('2026-10-11', '10:00', BA).toISOString());
    expect(aLocal(id1.instante, BA).fecha).toBe('2026-10-11');
  });

  it('Madrid → Buenos Aires: 10:00 de Buenos Aires', () => {
    const id1 = armarCalendario({ ...COMPRA, zonaCasa: MADRID, zonaViaje: BA }, []).programados.find((p) => p.tipo === 'ID1')!;
    expect(id1.instante.toISOString()).toBe(aInstante('2026-10-11', '10:00', BA).toISOString());
  });

  it('Buenos Aires → Tokio (12 h): nunca el día de salida en casa, ni en la franja de ninguna de las dos', () => {
    for (const [casa, viaje] of [[BA, TOKIO], [CDMX, TOKIO], [TOKIO, CDMX], [MADRID, TOKIO]]) {
      const c = { ...COMPRA, zonaCasa: casa, zonaViaje: viaje };
      const id1 = armarCalendario(c, []).programados.find((p) => p.tipo === 'ID1')!;
      expect(aLocal(id1.instante, casa).fecha > c.salida, `${casa}→${viaje}`).toBe(true);
      for (const z of [casa, viaje]) {
        const h = aLocal(id1.instante, z).hora;
        expect(h >= '08:00' && h < '23:00', `${casa}→${viaje} en ${z}: ${h}`).toBe(true);
      }
      expect(aLocal(id1.instante, id1.zona)).toEqual({ fecha: id1.fecha, hora: id1.hora });
    }
  });

  it('el calendario queda en orden de tiempo aunque ID1 caiga después de la noche del día 1', () => {
    for (const [casa, viaje] of [[BA, TOKIO], [CDMX, TOKIO]]) {
      const ps = armarCalendario({ ...COMPRA, zonaCasa: casa, zonaViaje: viaje }, []).programados;
      for (let i = 1; i < ps.length; i++) expect(ps[i].instante.getTime()).toBeGreaterThan(ps[i - 1].instante.getTime());
    }
  });
});

describe('"Lo escuché" no va después de solo texto o solo fotos', () => {
  const rot: Rotacion = { ...ROTACION_INICIAL, txtUsados: 2, ACN: 'ACN2', ACA: 'ACA1' };
  it('foto a la noche: no ACN3', () => {
    expect(reaccion({ tipo: 'noche' }, { tipo: 'foto' }, COMPRA, rot).mensajes[0].ids).toEqual(['ACN4']);
  });
  it('foto en la cadena: no ACA2', () => {
    expect(reaccion({ tipo: 'cadena', siguiente: 'IM1' }, { tipo: 'foto' }, COMPRA, rot).mensajes[0].ids[0]).toBe('ACA3');
  });
  it('con audio, sí puede ir', () => {
    expect(reaccion({ tipo: 'noche' }, { tipo: 'audio' }, COMPRA, rot).mensajes[0].ids).toEqual(['ACN3']);
  });
});

describe('reacción ❤️ al mediodía y a las fotos sueltas', () => {
  it('mediodía (foto, audio o texto), VU0 y foto suelta: una reacción ❤️ sobre su mensaje, sin texto', () => {
    for (const tipo of ['MD', 'VU0', 'foto-suelta'] as const) {
      for (const r of ['foto', 'audio', 'texto'] as const) {
        const x = reaccion({ tipo, quedaNoche: true }, { tipo: r, idMensaje: 'wamid.1' }, COMPRA, ROTACION_INICIAL);
        expect(x.mensajes, `${tipo} ${r}`).toEqual([]);
        expect(x.reacciones, `${tipo} ${r}`).toEqual([{ tipo: 'reaccion', emoji: '❤️', aMensaje: 'wamid.1' }]);
        expect(x.rot).toEqual(ROTACION_INICIAL);
      }
    }
  });

  it('sin id del mensaje, aMensaje es null', () => {
    expect(reaccion({ tipo: 'MD' }, { tipo: 'foto' }, COMPRA, ROTACION_INICIAL).reacciones).toEqual([{ tipo: 'reaccion', emoji: '❤️', aMensaje: null }]);
  });

  it('UC1, ID1, VU1 siguen con ACM en texto; la noche con ACN; sin reacción', () => {
    for (const tipo of ['UC1', 'ID1', 'VU1'] as const) {
      const x = reaccion({ tipo }, { tipo: 'audio' }, COMPRA, ROTACION_INICIAL);
      expect(x.mensajes[0].ids[0], tipo).toMatch(/^ACM/);
      expect(x.reacciones).toEqual([]);
    }
    expect(reaccion({ tipo: 'noche' }, { tipo: 'audio' }, COMPRA, ROTACION_INICIAL).mensajes[0].ids[0]).toMatch(/^ACN/);
  });

  it('"paso" al mediodía sigue siendo PAS-V2 / PAS-V (texto), y un audio malo, COR', () => {
    expect(reaccion({ tipo: 'MD', quedaOtra: true }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL).mensajes[0].ids).toEqual(['PAS-V2']);
    expect(reaccion({ tipo: 'MD' }, { tipo: 'audio', audioMal: true }, COMPRA, ROTACION_INICIAL).mensajes[0].ids).toEqual(['COR']);
  });
});

describe('la segunda vuelta del mediodía usa las 12', () => {
  it('en 60 días, después de las 12 vuelven las 12 en el mismo orden (salvo choques)', () => {
    const mds = armarCalendario({ ...COMPRA, salida: '2026-10-01', vuelta: '2026-11-29' }, [])
      .programados.filter((p) => p.tipo === 'MD')
      .map((p) => p.ids[0]);
    const orden = ['MD1', 'MD5', 'MD3', 'MD4', 'MD9', 'MD2', 'MD10', 'MD6', 'MD7', 'MD12', 'MD8', 'MD11'];
    for (const id of ['MD9', 'MD2', 'MD10', 'MD7', 'MD12', 'MD11']) expect(mds.filter((x) => x === id).length, id).toBeGreaterThanOrEqual(3);
    let k = 0;
    for (const md of mds) {
      while (orden[k % 12] !== md) {
        expect(['MD2', 'MD8']).toContain(orden[k % 12]); // solo se saltean por choque
        k++;
      }
      k++;
    }
  });
});

describe('la noche: 5 comienzos × 9 puertas × 5 cierres', () => {
  it('hay 5 comienzos y 5 cierres', () => {
    expect(COMIENZOS).toEqual(['C1', 'C2', 'C3', 'C4', 'C5']);
    expect(CIERRES).toEqual(['F1', 'F2', 'F3', 'F4', 'F5']);
  });

  it('225 noches: las 225 combinaciones, sin repetir comienzo, puerta ni cierre dos noches seguidas', () => {
    const ns = Array.from({ length: 225 }, (_, i) => combinacionDeNoche(i));
    expect(new Set(ns.map((x) => x.join('+'))).size).toBe(225);
    for (let i = 1; i < 300; i++) {
      const [a, b] = [combinacionDeNoche(i - 1), combinacionDeNoche(i)];
      for (let j = 0; j < 3; j++) expect(a[j], `noche ${i}`).not.toBe(b[j]);
    }
    expect(combinacionDeNoche(0)).toEqual(['C1', 'NO1', 'F1']);
    expect(ns.slice(0, 9).map((x) => x[1])).toEqual(ORDEN_PUERTAS);
  });

  it('en 45 noches, las 45 de comienzo+puerta; los 5 comienzos y los 5 cierres salen en las primeras 5', () => {
    const ns = Array.from({ length: 45 }, (_, i) => combinacionDeNoche(i));
    expect(new Set(ns.map((x) => `${x[0]}+${x[1]}`)).size).toBe(45);
    expect(new Set(ns.slice(0, 5).map((x) => x[0])).size).toBe(5);
    expect(new Set(ns.slice(0, 5).map((x) => x[2])).size).toBe(5);
  });
});

describe('ATR-V nunca dos noches seguidas', () => {
  const cal = armarCalendario(COMPRA, []).programados;
  const noches = cal.filter((p) => p.tipo === 'noche');
  it('con la noche anterior con ATR-V, esta va sin ATR; la siguiente puede volver a llevarlo', () => {
    const a = preguntaProgramada(noches[0], COMPRA, 2, ROTACION_INICIAL);
    expect(a.mensaje.ids[0]).toBe('ATR-V');
    const b = preguntaProgramada(noches[1], COMPRA, 3, a.rot);
    expect(b.mensaje.ids.some((id) => id.startsWith('ATR'))).toBe(false);
    const c = preguntaProgramada(noches[2], COMPRA, 4, b.rot);
    expect(c.mensaje.ids[0]).toBe('ATR-V');
  });

  it('una noche sin ATR-V en el medio (por ejemplo una propia) también corta la racha', () => {
    const propia = { ...noches[1], tipo: 'propia' as const, ids: ['PR-R'], pregunta: '¿x?' };
    const a = preguntaProgramada(noches[0], COMPRA, 2, ROTACION_INICIAL);
    const b = preguntaProgramada(propia, COMPRA, 3, a.rot);
    expect(preguntaProgramada(noches[2], COMPRA, 4, b.rot).mensaje.ids[0]).toBe('ATR-V');
  });
});

describe('TXT va solo', () => {
  it('en la cadena: TXT en un mensaje y la siguiente en otro', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: 'IM1' }, { tipo: 'texto' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes.map((m) => m.ids)).toEqual([['TXT'], ['IM1']]);
    expect(r.mensajes[1].texto).toBe(t('IM1'));
  });

  it('en CA1: TXT y después AL1-P, en dos mensajes', () => {
    const r = reaccion({ tipo: 'CA1' }, { tipo: 'texto' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes.map((m) => m.ids)).toEqual([['TXT'], ['AL1-P']]);
  });

  it('ningún mensaje junta TXT con otra cosa', () => {
    for (const de of [{ tipo: 'noche' as const }, { tipo: 'cadena' as const, siguiente: 'AS2' as const }, { tipo: 'CA1' as const }, { tipo: 'cadena' as const, siguiente: 'fin' as const }]) {
      for (const m of reaccion(de, { tipo: 'texto' }, COMPRA, ROTACION_INICIAL).mensajes) if (m.ids.includes('TXT')) expect(m.ids).toEqual(['TXT']);
    }
  });
});

describe('CA1 sin respuesta', () => {
  it('al día siguiente a las 13:00 (hora de casa) sale AL1-P igual', () => {
    const ca1 = armarCalendario(COMPRA, []).programados.find((p) => p.tipo === 'CA1')!;
    expect(aLocal(momentoAlbumSinCA1(ca1, COMPRA), BA)).toEqual({ fecha: '2026-10-19', hora: '13:00' });
    expect(albumSinRespuesta(COMPRA)).toEqual({ ids: ['AL1-P'], texto: t('AL1-P') });
  });
});

describe('el álbum', () => {
  const h = (x: string, f = '2026-10-18') => aInstante(f, x, BA);
  function correr(eventos: EventoAlbum[], inicio = h('12:00')) {
    let e: EstadoAlbum = iniciarAlbum(inicio, COMPRA);
    const salidas: SalidaAlbum[] = [];
    for (const ev of eventos) {
      const r = pasoAlbum(e, ev, COMPRA);
      e = r.estado;
      salidas.push(...r.salidas);
    }
    return { e, salidas };
  }
  const ids = (ss: SalidaAlbum[]) => ss.map((s) => (s.tipo === 'mensaje' ? s.mensaje.ids.join('+') : s.tipo));

  it('AL2 que cae en la franja 23-8 se corre a las 10:00, no a las 8:00', () => {
    const { e } = correr([{ tipo: 'foto', en: h('22:30'), cantidad: 3 }], h('22:10'));
    expect(aLocal(new Date(e.vence!), BA)).toEqual({ fecha: '2026-10-19', hora: '10:00' });
  });

  it('fotos de más: antes de DES va AL3, con {{fotos_mandadas}} y {{fotos_album}}', () => {
    const { e, salidas } = correr([
      { tipo: 'foto', en: h('12:30'), cantidad: 23 },
      { tipo: 'listo', en: h('12:40') },
    ]);
    expect(ids(salidas)).toEqual(['AL3']);
    expect(e.fase).toBe('eligiendo');
    const al3 = salidas[0].tipo === 'mensaje' ? salidas[0].mensaje.texto : '';
    expect(al3).toBe(t('AL3', { fotos_mandadas: '23' }));
    expect(al3).toMatch(/^Mandaste 23 fotos y en el álbum entran 20\./);
  });

  it('reenvía las que saca: se sacan; si quedan las que entran, DES sin DES+', () => {
    const { e, salidas } = correr([
      { tipo: 'foto', en: h('12:30'), ids: Array.from({ length: 23 }, (_, i) => `f${i + 1}`) },
      { tipo: 'listo', en: h('12:40') },
      { tipo: 'reenvio', en: h('13:00'), ids: ['f2', 'f7', 'f20'] },
    ]);
    expect(ids(salidas)).toEqual(['AL3', 'DES', 'cerrado']);
    const cerrado = salidas[2];
    expect(cerrado.tipo === 'cerrado' && cerrado.quedan).toEqual(Array.from({ length: 23 }, (_, i) => `f${i + 1}`).filter((x) => !['f2', 'f7', 'f20'].includes(x)));
    expect(e.fase).toBe('cerrado');
  });

  it('reenvía de a poco: espera; si a las 5 horas todavía sobran, las primeras N y DES+', () => {
    const { salidas } = correr([
      { tipo: 'foto', en: h('12:30'), cantidad: 25 },
      { tipo: 'listo', en: h('12:40') },
      { tipo: 'reenvio', en: h('13:00'), ids: ['f1'] },
      { tipo: 'reloj', en: h('17:59') },
      { tipo: 'reloj', en: h('18:00') },
    ]);
    expect(ids(salidas)).toEqual(['AL3', 'DES+DES+', 'cerrado']);
    const c = salidas[2];
    expect(c.tipo === 'cerrado' && [c.guardadas, c.descartadas, c.quedan[0]]).toEqual([20, 4, 'f2']);
  });

  it('si contesta otra cosa, o no contesta en 5 horas: las primeras N y DES con DES+', () => {
    const base: EventoAlbum[] = [
      { tipo: 'foto', en: h('12:30'), cantidad: 23 },
      { tipo: 'listo', en: h('12:40') },
    ];
    expect(ids(correr([...base, { tipo: 'otra', en: h('13:00') }]).salidas)).toEqual(['AL3', 'DES+DES+', 'cerrado']);
    expect(ids(correr([...base, { tipo: 'reloj', en: h('17:40') }]).salidas)).toEqual(['AL3', 'DES+DES+', 'cerrado']);
  });

  it('fotos después del cierre: al panel, sin contestar', () => {
    const { e } = correr([
      { tipo: 'foto', en: h('12:30'), cantidad: 2 },
      { tipo: 'listo', en: h('12:40') },
    ]);
    const r = pasoAlbum(e, { tipo: 'foto', en: h('14:00'), cantidad: 3 }, COMPRA);
    expect(r.salidas).toEqual([{ tipo: 'al-panel', cantidad: 3 }]);
    expect(r.estado).toEqual(e);
  });
});

describe('PR-R rota entre PR-R, PR-R2 y PR-R3', () => {
  it('en orden, y vuelve a empezar', () => {
    const c = { ...COMPRA, salida: '2026-10-01', vuelta: '2026-10-30', preguntasPropias: ['1', '2', '3', '4', '5'] };
    expect(armarCalendario(c, []).programados.filter((p) => p.tipo === 'propia').map((p) => p.ids[0])).toEqual(['PR-R', 'PR-R2', 'PR-R3', 'PR-R', 'PR-R2']);
  });

  it('PR-R2 y PR-R3 llevan la pregunta tal cual entre «»', () => {
    const c = { ...COMPRA, salida: '2026-10-01', vuelta: '2026-10-30', preguntasPropias: ['¿uno?', '¿dos?'] };
    const p = armarCalendario(c, []).programados.filter((x) => x.tipo === 'propia')[1];
    expect(preguntaProgramada(p, c, 0, ROTACION_INICIAL).mensaje.texto).toBe(t('PR-R2', { pregunta: '¿dos?' }));
  });

  it('sin regalo, siempre PR-P', () => {
    const c = { ...COMPRA, regalo: undefined, salida: '2026-10-01', vuelta: '2026-10-30', preguntasPropias: ['1', '2', '3'] };
    expect(armarCalendario(c, []).programados.filter((p) => p.tipo === 'propia').map((p) => p.ids[0])).toEqual(['PR-P', 'PR-P', 'PR-P']);
  });
});
