// "Lectura corrida y viajes cortos" (banco.md, aprobado por Naza el 30/09):
// PAS-V2, REC1-U, viajes de 1 y 2 días, y los avisos de lo que no entra.
import { describe, it, expect } from 'vitest';
import { armarCalendario, quedaOtraEseDia, type Programado } from '../src/viaje-v2/calendario.js';
import { reaccion, recordatorioAntes, ROTACION_INICIAL } from '../src/viaje-v2/mensajes.js';
import { porId } from '../src/viaje-v2/banco.js';
import { renderizar, datosDeCompra } from '../src/viaje-v2/texto.js';
import { aInstante } from '../src/viaje-v2/horas.js';
import type { Compra } from '../src/viaje-v2/tipos.js';

const BA = 'America/Argentina/Buenos_Aires';
const MADRID = 'Europe/Madrid';
const COMPRA: Compra = {
  nombre: 'Lucía',
  salida: '2026-10-10',
  vuelta: '2026-10-17',
  zonaCasa: BA,
  zonaViaje: MADRID,
  preguntasPropias: [],
  formato: 'impreso',
  fotosAlbum: 20,
};
const t = (id: string) => renderizar(porId(id).texto, datosDeCompra(COMPRA));
const resumen = (ps: readonly Programado[]) => ps.map((p) => `${p.dia} ${p.tipo} ${p.hora} ${p.zona === BA ? 'casa' : 'viaje'}`);

describe('PAS-V2: "paso" cuando ese día todavía llega otra pregunta', () => {
  const cal = armarCalendario(COMPRA, []).programados;

  it('quedaOtraEseDia: después del mediodía queda la noche; después de la noche, nada; UC1 es la única del día de salida', () => {
    expect(quedaOtraEseDia(cal, aInstante('2026-10-13', '13:10', MADRID))).toBe(true);
    expect(quedaOtraEseDia(cal, aInstante('2026-10-13', '22:30', MADRID))).toBe(false);
    expect(quedaOtraEseDia(cal, aInstante('2026-10-10', '10:30', BA))).toBe(false);
    expect(quedaOtraEseDia(cal, aInstante('2026-10-18', '10:30', BA))).toBe(true); // VU1 → CA1
  });

  it('con otra pregunta ese día: PAS-V2 ("Dale, esta la salteamos.")', () => {
    for (const tipo of ['MD', 'ID1', 'VU1', 'UC1', 'VU0'] as const) {
      expect(reaccion({ tipo, quedaOtra: true }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL).mensajes, tipo).toEqual([{ ids: ['PAS-V2'], texto: t('PAS-V2') }]);
    }
  });

  it('sin nada más ese día (o sin el dato): PAS-V ("…Mañana hay otra.")', () => {
    expect(reaccion({ tipo: 'noche', quedaOtra: false }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL).mensajes[0].ids).toEqual(['PAS-V']);
    expect(reaccion({ tipo: 'MD' }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL).mensajes[0].ids).toEqual(['PAS-V']);
  });
});

describe('REC1-U: el recordatorio cuando la colgada es VA1', () => {
  it('VA1 → REC1-U; las demás → REC1', () => {
    expect(recordatorioAntes(COMPRA, 'VA1')).toEqual({ ids: ['REC1-U'], texto: t('REC1-U') });
    for (const id of ['AS1', 'AS2', 'IM1'] as const) expect(recordatorioAntes(COMPRA, id).ids).toEqual(['REC1']);
  });
});

describe('viaje de 1 día (salida = vuelta)', () => {
  const c = { ...COMPRA, vuelta: COMPRA.salida, preguntasPropias: ['¿a?'] };
  const r = armarCalendario(c, ['VA1']);

  it('ese día UC1 10:00 y VU0 13:00, las dos en hora de casa; al otro IV1 10:00 y CA1 a la noche', () => {
    expect(resumen(r.programados)).toEqual(['0 UC1 10:00 casa', '0 VU0 13:00 casa', '1 IV1 10:00 casa', '1 CA1 21:30 casa']);
    expect(r.programados.find((p) => p.tipo === 'IV1')!.ids).toEqual(['IV1']);
  });

  it('sin ID1, VU1, FN1 ni noches comunes', () => {
    const tipos = r.programados.map((p) => p.tipo);
    for (const no of ['ID1', 'VU1', 'FN1', 'noche', 'MD'] as const) expect(tipos).not.toContain(no);
  });

  it('lo que no entra va a los avisos para Naza', () => {
    expect(r.antesQueNoEntran).toEqual(['VA1']);
    expect(r.avisosNaza.some((a) => a.includes('VA1'))).toBe(true);
    expect(r.avisosNaza.some((a) => a.includes('«¿a?»'))).toBe(true);
  });

  it('"paso" en UC1 ese día: PAS-V2 (después llega VU0)', () => {
    const t0 = aInstante(c.salida, '10:30', BA);
    expect(quedaOtraEseDia(r.programados, t0)).toBe(true);
  });

  it('IV1 contestada: ACM (queda CA1 esa noche); en texto, TXT', () => {
    expect(reaccion({ tipo: 'IV1', quedaNoche: true }, { tipo: 'audio' }, c, { ...ROTACION_INICIAL, ACM: 'ACM2' }).mensajes[0].ids).toEqual(['ACM3']);
    expect(reaccion({ tipo: 'IV1' }, { tipo: 'texto' }, c, ROTACION_INICIAL).mensajes[0].ids).toEqual(['TXT']);
  });
});

describe('viaje de 2 días', () => {
  const r = armarCalendario({ ...COMPRA, vuelta: '2026-10-11' }, ['AS2', 'VA1']);

  it('día 1 solo UC1; día 2 ID1 y VU0 sin noche; al otro VU1 10:00 y CA1', () => {
    // ID1 a las 10 de casa (la más tarde; simulaciones): en Madrid son las 15, después de VU0.
    expect(resumen(r.programados)).toEqual(['0 UC1 10:00 casa', '1 VU0 13:00 viaje', '1 ID1 10:00 casa', '2 VU1 10:00 casa', '2 CA1 21:30 casa']);
  });

  it('las de antes que no entran van a los avisos para Naza', () => {
    expect(r.antesQueNoEntran).toEqual(['AS2', 'VA1']);
    expect(r.avisosNaza[0]).toContain('AS2, VA1');
  });
});

describe('viajes de 3 días en adelante no cambian', () => {
  it('3 días: ID1 + FN1, VU0; al otro VU1 + CA1', () => {
    const r = armarCalendario({ ...COMPRA, vuelta: '2026-10-12' }, []);
    expect(r.programados.map((p) => `${p.dia} ${p.tipo}`)).toEqual(['0 UC1', '1 ID1', '1 FN1', '2 VU0', '3 VU1', '3 CA1']);
  });
});
