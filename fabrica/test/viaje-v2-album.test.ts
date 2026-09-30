import { describe, it, expect } from 'vitest';
import { iniciarAlbum, pasoAlbum, HORAS_ESPERA, type EstadoAlbum, type EventoAlbum, type SalidaAlbum } from '../src/viaje-v2/album.js';
import { aInstante, aLocal } from '../src/viaje-v2/horas.js';
import type { Compra } from '../src/viaje-v2/tipos.js';

const BA = 'America/Argentina/Buenos_Aires';
const COMPRA: Compra = {
  nombre: 'Lucía',
  salida: '2026-10-10',
  vuelta: '2026-10-17',
  zonaCasa: BA,
  zonaViaje: 'Europe/Madrid',
  preguntasPropias: [],
  formato: 'impreso',
  fotosAlbum: 20,
};
const hora = (h: string, fecha = '2026-10-18') => aInstante(fecha, h, BA);

/** Aplica los eventos en fila y junta todas las salidas. */
function correr(eventos: EventoAlbum[], inicio = hora('12:00')) {
  let estado: EstadoAlbum = iniciarAlbum(inicio, COMPRA);
  const salidas: SalidaAlbum[] = [];
  for (const e of eventos) {
    const r = pasoAlbum(estado, e, COMPRA);
    estado = r.estado;
    salidas.push(...r.salidas);
  }
  return { estado, salidas };
}
const ids = (ss: SalidaAlbum[]) => ss.map((s) => (s.tipo === 'mensaje' ? s.mensaje.ids.join('+') : s.tipo));

describe('viaje v2: álbum', () => {
  it('espera 5 horas', () => expect(HORAS_ESPERA).toBe(5));

  it('"listo" cierra: DES, sin DES+ si no mandó de más', () => {
    const { estado, salidas } = correr([
      { tipo: 'foto', en: hora('12:30'), cantidad: 12 },
      { tipo: 'listo', en: hora('12:40') },
    ]);
    expect(estado.fase).toBe('cerrado');
    expect(ids(salidas)).toEqual(['DES', 'cerrado']);
    expect(salidas[1]).toEqual({ tipo: 'cerrado', guardadas: 12, descartadas: 0 });
  });

  it('a las 5 horas sin fotos nuevas: AL2; cada foto corre el reloj', () => {
    const { estado, salidas } = correr([
      { tipo: 'foto', en: hora('12:30'), cantidad: 3 },
      { tipo: 'reloj', en: hora('17:00') }, // 4:30 desde la última foto: nada
      { tipo: 'foto', en: hora('17:10'), cantidad: 2 },
      { tipo: 'reloj', en: hora('22:00') }, // 4:50: nada
      { tipo: 'reloj', en: hora('22:10') },
    ]);
    expect(ids(salidas)).toEqual(['AL2']);
    expect(estado.fase).toBe('esperando-al2');
    expect(estado.fotos).toBe(5);
  });

  it('el AL2 respeta la franja: si las 5 horas caen de madrugada, sale a las 8:00', () => {
    let estado = iniciarAlbum(hora('22:10'), COMPRA);
    estado = pasoAlbum(estado, { tipo: 'foto', en: hora('22:30'), cantidad: 15 }, COMPRA).estado;
    expect(aLocal(new Date(estado.vence!), BA)).toEqual({ fecha: '2026-10-19', hora: '08:00' });
    const r = pasoAlbum(estado, { tipo: 'reloj', en: hora('03:30', '2026-10-19') }, COMPRA);
    expect(r.salidas).toEqual([]);
  });

  it('sí a AL2 cierra; no contestar AL2 en 5 horas cierra', () => {
    const base: EventoAlbum[] = [
      { tipo: 'foto', en: hora('12:30'), cantidad: 20 },
      { tipo: 'reloj', en: hora('17:30') },
    ];
    expect(ids(correr([...base, { tipo: 'si', en: hora('17:40') }]).salidas)).toEqual(['AL2', 'DES', 'cerrado']);
    expect(ids(correr([...base, { tipo: 'reloj', en: hora('22:30') }]).salidas)).toEqual(['AL2', 'DES', 'cerrado']);
  });

  it('"no" o más fotos después de AL2: otras 5 horas y AL2 una vez más como mucho; después se cierra igual', () => {
    const { salidas, estado } = correr([
      { tipo: 'foto', en: hora('12:30'), cantidad: 5 },
      { tipo: 'reloj', en: hora('17:30') }, // AL2
      { tipo: 'no', en: hora('17:45') },
      { tipo: 'reloj', en: hora('22:45') }, // AL2 otra vez
      { tipo: 'foto', en: hora('09:00', '2026-10-19'), cantidad: 3 }, // más fotos: no hay tercer AL2
      { tipo: 'reloj', en: hora('14:00', '2026-10-19') },
    ]);
    expect(ids(salidas)).toEqual(['AL2', 'AL2', 'DES', 'cerrado']);
    expect(estado.fotos).toBe(8);
  });

  it('manda de más: se guardan las primeras N y va DES+', () => {
    const { salidas } = correr([
      { tipo: 'foto', en: hora('12:30'), cantidad: 15 },
      { tipo: 'foto', en: hora('13:00'), cantidad: 8 },
      { tipo: 'listo', en: hora('13:05') },
    ]);
    expect(ids(salidas)).toEqual(['DES+DES+', 'cerrado']);
    expect(salidas[1]).toEqual({ tipo: 'cerrado', guardadas: 20, descartadas: 3 });
  });

  it('cero fotos: a las 5 horas se avisa a Naza (un evento, no un mensaje), sin AL2; la despedida espera', () => {
    const { estado, salidas } = correr([
      { tipo: 'reloj', en: hora('17:00') },
      { tipo: 'reloj', en: hora('23:59') },
    ]);
    expect(ids(salidas)).toEqual(['avisar-naza']);
    expect(estado.fase).toBe('esperando-naza');
    const cierra = pasoAlbum(estado, { tipo: 'naza-cierra', en: hora('10:00', '2026-10-19') }, COMPRA);
    expect(ids(cierra.salidas)).toEqual(['DES', 'cerrado']);
    expect(cierra.salidas[0].tipo === 'mensaje' && cierra.salidas[0].mensaje.ids).toEqual(['DES']);
  });

  it('"listo" con cero fotos también avisa a Naza en vez de cerrar', () => {
    const { estado, salidas } = correr([{ tipo: 'listo', en: hora('12:10') }]);
    expect(ids(salidas)).toEqual(['avisar-naza']);
    expect(estado.fase).toBe('esperando-naza');
  });

  it('si llegan fotos mientras se espera a Naza, se sigue como siempre', () => {
    const { estado } = correr([
      { tipo: 'reloj', en: hora('17:00') },
      { tipo: 'foto', en: hora('18:00'), cantidad: 4 },
    ]);
    expect(estado.fase).toBe('juntando');
    expect(estado.fotos).toBe(4);
  });

  it('cerrado es cerrado: lo que llega después no cambia nada', () => {
    const { estado } = correr([
      { tipo: 'foto', en: hora('12:30'), cantidad: 2 },
      { tipo: 'listo', en: hora('12:40') },
    ]);
    const r = pasoAlbum(estado, { tipo: 'foto', en: hora('13:00'), cantidad: 5 }, COMPRA);
    expect(r.estado).toEqual(estado);
    expect(r.salidas).toEqual([]);
  });

  it('un "sí" suelto antes de AL2 no cierra nada', () => {
    const { estado, salidas } = correr([
      { tipo: 'foto', en: hora('12:30'), cantidad: 2 },
      { tipo: 'si', en: hora('12:35') },
    ]);
    expect(salidas).toEqual([]);
    expect(estado.fase).toBe('juntando');
  });
});
