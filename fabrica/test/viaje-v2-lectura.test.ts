import { describe, it, expect } from 'vitest';
import { lecturaCorrida, COMPRA_LECTURA } from '../src/viaje-v2/lectura.js';
import { armarCalendario } from '../src/viaje-v2/calendario.js';
import { diasEntre } from '../src/viaje-v2/horas.js';

const md = lecturaCorrida();

describe('viaje v2: lectura corrida (un viaje inventado)', () => {
  it('es el viaje pedido: Lucía, regalo de Tomás, 8 días, impreso, álbum de 20, 2 propias, Buenos Aires → Madrid', () => {
    expect(COMPRA_LECTURA).toMatchObject({
      nombre: 'Lucía',
      regalo: { quienRegala: 'Tomás' },
      formato: 'impreso',
      fotosAlbum: 20,
      zonaCasa: 'America/Argentina/Buenos_Aires',
      zonaViaje: 'Europe/Madrid',
    });
    expect(diasEntre(COMPRA_LECTURA.salida, COMPRA_LECTURA.vuelta) + 1).toBe(8);
    expect(COMPRA_LECTURA.preguntasPropias).toHaveLength(2);
  });

  it('no queda ninguna marca sin llenar', () => {
    expect(md).not.toContain('{{');
  });

  it('aparece todo lo que tiene que aparecer', () => {
    for (const id of ['BIEN-1R', 'BIEN-2', 'AS1', 'AS2', 'IM1', 'PAS-A', 'REC1-U', 'UC1', 'ID1', 'VA1', 'ATR1', 'PR-R', 'PAS-V2', 'TXT', 'COR', 'FN1', 'VU0', 'VU1', 'CA1', 'AL1', 'AL2', 'DES', 'DES+']) {
      expect(md, id).toContain(`\`${id}\``);
    }
  });

  it('el "paso" del mediodía del día 4 es PAS-V2 (esa noche llega otra); la colgada VA1 lleva REC1-U', () => {
    const dia4 = md.slice(md.indexOf('## Día 4 del viaje'), md.indexOf('## Día 5 del viaje'));
    expect(dia4).toContain('`PAS-V2`');
    expect(md).not.toContain('`PAS-V`');
    expect(md).not.toContain('`REC1`');
  });

  it('TXT como mucho 2 veces', () => {
    expect(md.match(/`TXT`/g)!.length).toBeLessThanOrEqual(2);
  });

  it('las propias van tal cual, entre «»', () => {
    for (const p of COMPRA_LECTURA.preguntasPropias) expect(md).toContain(`«${p}»`);
  });

  it('un encabezado por día, con las fechas en orden', () => {
    const titulos = md.split('\n').filter((l) => l.startsWith('## '));
    expect(titulos.length).toBeGreaterThanOrEqual(10);
    expect(titulos.some((l) => l.includes('salida'))).toBe(true);
    expect(titulos.some((l) => l.includes('vuelta'))).toBe(true);
  });

  it('las 23 fotos del álbum: guarda 20', () => {
    expect(md).toContain('23 fotos');
    expect(md).toContain('guardadas 20');
  });

  it('el calendario del viaje no dejó nada afuera', () => {
    const cal = armarCalendario(COMPRA_LECTURA, ['VA1']);
    expect(cal.propiasQueNoEntran).toEqual([]);
    expect(cal.antesQueNoEntran).toEqual([]);
  });
});
