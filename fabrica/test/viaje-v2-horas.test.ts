import { describe, it, expect } from 'vitest';
import { aInstante, aLocal, respetarFranja, sumarDias, diasEntre, diaDeSemana, nombreDeZona } from '../src/viaje-v2/horas.js';

const BA = 'America/Argentina/Buenos_Aires';
const MADRID = 'Europe/Madrid';

describe('viaje v2: horas', () => {
  it('hora local → instante, con la zona (Buenos Aires -3, Madrid +2 en octubre)', () => {
    expect(aInstante('2026-10-10', '10:00', BA).toISOString()).toBe('2026-10-10T13:00:00.000Z');
    expect(aInstante('2026-10-11', '10:00', MADRID).toISOString()).toBe('2026-10-11T08:00:00.000Z');
    // Madrid pasa a +1 el 25/10
    expect(aInstante('2026-10-26', '13:00', MADRID).toISOString()).toBe('2026-10-26T12:00:00.000Z');
  });

  it('instante → fecha y hora local', () => {
    expect(aLocal(new Date('2026-10-11T02:30:00Z'), BA)).toEqual({ fecha: '2026-10-10', hora: '23:30' });
    expect(aLocal(new Date('2026-10-11T02:30:00Z'), MADRID)).toEqual({ fecha: '2026-10-11', hora: '04:30' });
  });

  it('franja 23:00-8:00: se corre a las 8:00 (del mismo día o del siguiente)', () => {
    const noche = aInstante('2026-10-10', '23:30', BA);
    expect(aLocal(respetarFranja(noche, BA), BA)).toEqual({ fecha: '2026-10-11', hora: '08:00' });
    const madrugada = aInstante('2026-10-10', '03:10', BA);
    expect(aLocal(respetarFranja(madrugada, BA), BA)).toEqual({ fecha: '2026-10-10', hora: '08:00' });
    const justo = aInstante('2026-10-10', '22:59', BA);
    expect(respetarFranja(justo, BA)).toEqual(justo);
    const ocho = aInstante('2026-10-10', '08:00', BA);
    expect(respetarFranja(ocho, BA)).toEqual(ocho);
  });

  it('la franja es la de la zona que se le pasa: las 3 de Madrid son las 22 de Buenos Aires', () => {
    const t = aInstante('2026-10-12', '22:00', BA); // 03:00 en Madrid
    expect(respetarFranja(t, BA)).toEqual(t);
    expect(aLocal(respetarFranja(t, MADRID), MADRID)).toEqual({ fecha: '2026-10-13', hora: '08:00' });
  });

  it('fechas: sumar días, días entre, día de la semana, nombre de la zona', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01');
    expect(sumarDias('2026-10-01', -1)).toBe('2026-09-30');
    expect(diasEntre('2026-10-10', '2026-10-17')).toBe(7);
    expect(diasEntre('2026-10-10', '2026-10-10')).toBe(0);
    expect(diaDeSemana('2026-10-10')).toBe('sábado');
    expect(nombreDeZona(BA)).toBe('Buenos Aires');
    expect(nombreDeZona(MADRID)).toBe('Madrid');
  });
});
