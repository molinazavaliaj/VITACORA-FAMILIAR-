import { describe, it, expect } from 'vitest';
import { ACUSES, ACUSES_DIA_FEO, ACUSES_FOTO, opcionesAcuse, siguienteDe } from '../src/kids-v2/acuses.js';
import { fijo } from '../src/kids-v2/banco.js';
import { aInstante, aLocal, diasEntre, esDeNoche, finDeLaNoche, sumarDias } from '../src/kids-v2/horas.js';

const BA = 'America/Argentina/Buenos_Aires';
const MAD = 'Europe/Madrid';

describe('kids v2: horas', () => {
  it('ida y vuelta entre hora local e instante, también con cambio de horario', () => {
    expect(aInstante('2026-10-06', '18:00', BA).toISOString()).toBe('2026-10-06T21:00:00.000Z');
    expect(aLocal(new Date('2026-10-06T21:00:00.000Z'), BA)).toEqual({ fecha: '2026-10-06', hora: '18:00' });
    expect(aInstante('2026-10-25', '18:00', MAD).toISOString()).toBe('2026-10-25T17:00:00.000Z'); // ya en horario de invierno
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(diasEntre('2026-10-06', '2026-10-10')).toBe(4);
  });

  it('noche: de las 22:00 a las 8:59, hora del país del número', () => {
    expect(esDeNoche(aInstante('2026-10-06', '21:59', BA), BA)).toBe(false);
    expect(esDeNoche(aInstante('2026-10-06', '22:00', BA), BA)).toBe(true);
    expect(esDeNoche(aInstante('2026-10-07', '08:59', BA), BA)).toBe(true);
    expect(esDeNoche(aInstante('2026-10-07', '09:00', BA), BA)).toBe(false);
  });

  it('finDeLaNoche: las 9:00 que siguen, o el mismo instante si es de día', () => {
    expect(finDeLaNoche(aInstante('2026-10-06', '23:30', BA), BA)).toEqual(aInstante('2026-10-07', '09:00', BA));
    expect(finDeLaNoche(aInstante('2026-10-07', '03:00', BA), BA)).toEqual(aInstante('2026-10-07', '09:00', BA));
    const t = aInstante('2026-10-07', '15:00', BA);
    expect(finDeLaNoche(t, BA)).toBe(t);
  });
});

describe('kids v2: acuses (mensajes.md §3)', () => {
  it('los que dicen "escuché" y los que dicen "libro" son los que la regla saca', () => {
    for (const id of ACUSES) {
      const t = fijo(id).texto;
      expect(/escuch/i.test(t), id).toBe(['ACUSE-1', 'ACUSE-4', 'ACUSE-6'].includes(id));
      expect(/libro/i.test(t), id).toBe(['ACUSE-3', 'ACUSE-6'].includes(id));
    }
  });

  it('qué acuses van en cada caso', () => {
    expect(opcionesAcuse({ capsula: false, escrito: false })).toEqual([...ACUSES]);
    expect(opcionesAcuse({ capsula: false, escrito: true })).toEqual(['ACUSE-2', 'ACUSE-3', 'ACUSE-5', 'ACUSE-7']);
    expect(opcionesAcuse({ capsula: true, escrito: false })).toEqual(['ACUSE-1', 'ACUSE-2', 'ACUSE-4', 'ACUSE-5', 'ACUSE-7']);
    expect(opcionesAcuse({ capsula: true, escrito: true })).toEqual(['ACUSE-2', 'ACUSE-5', 'ACUSE-7']);
  });

  it('rotan en orden, nunca el mismo dos veces seguidas, y siguen el orden aunque cambie el caso', () => {
    let ultimo: string | null = null;
    const vistos: string[] = [];
    for (let i = 0; i < 9; i++) vistos.push((ultimo = siguienteDe(ACUSES, ACUSES, ultimo)));
    expect(vistos).toEqual(['ACUSE-1', 'ACUSE-2', 'ACUSE-3', 'ACUSE-4', 'ACUSE-5', 'ACUSE-6', 'ACUSE-7', 'ACUSE-1', 'ACUSE-2']);
    expect(siguienteDe(ACUSES, opcionesAcuse({ capsula: false, escrito: true }), 'ACUSE-3')).toBe('ACUSE-5');
    expect(siguienteDe(ACUSES, opcionesAcuse({ capsula: true, escrito: true }), 'ACUSE-7')).toBe('ACUSE-2');
    expect(siguienteDe(ACUSES_FOTO, ACUSES_FOTO, 'ACUSE-FOTO-3')).toBe('ACUSE-FOTO-1');
    expect(siguienteDe(ACUSES_DIA_FEO, ACUSES_DIA_FEO, 'B-DIAFEO-ACUSE-1')).toBe('B-DIAFEO-ACUSE-2');
  });
});
