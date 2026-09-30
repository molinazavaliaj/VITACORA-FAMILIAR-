// Simulación de Vitácora de Viaje V2: 300 viajes inventados (semillas 1 a
// 300) corridos de punta a punta con el código de verdad, con las invariantes
// de scripts/viaje-v2-simular.ts. La corrida completa (2400 viajes) y las
// estadísticas están en docs/viajes-v2/simulaciones/resumen.md.
//
// Las invariantes que HOY se rompen van con `it.fails`: el test pasa mientras
// el bug siga, y se pone en rojo el día que se arregle (ahí se le saca el
// `.fails`). Todas vienen de tres causas del código, sin arreglar a propósito
// (este agente no toca src/viaje-v2/):
//   1. horaNoche 23:30: respetarFranja (calendario.ts:184) corre la noche a
//      las 8:00 del día siguiente; FN1 cae el día de vuelta, junto con VU0 (b3).
//   2. horaNoche 07:00: la noche sale a las 8:00, antes que ID1/VU1/IV1 (10:00):
//      el calendario queda desordenado (h1), CA1 abre el álbum y VU1 llega en
//      el medio (h3) o después de DES (h2), y un "paso" a VU1/IV1 dice "Mañana
//      hay otra" sin otra (d2). También la versión "ya de viaje" puede llegar
//      el día de salida en hora de casa (d6).
//   3. SÍ que llega después del día de salida: alDecirSi (mensajes.ts:107)
//      manda AS1 en versión normal aunque ya esté de viaje (d6).
import { describe, it, expect } from 'vitest';
import { correr, correrMuchos, INVARIANTES, lecturaUnDia, lecturaDosDias, lecturaTreintaDias, revisar, escenario } from '../scripts/viaje-v2-simular.js';

const CORRIDAS = correrMuchos(300);
const ROTAS_HOY = new Set(['b3', 'd2', 'd6', 'h1', 'h3']);

const violan = (inv: string) =>
  CORRIDAS.filter((c) => c.violaciones.some((x) => x.inv === inv)).map((c) => `semilla ${c.e.semilla}: ${c.violaciones.find((x) => x.inv === inv)!.detalle}`);

describe('viaje v2: simulación de 300 viajes', () => {
  it('se repite: la misma semilla da el mismo viaje, mensaje por mensaje', () => {
    const a = correr(123).res.enviados.map((m) => `${m.en.toISOString()} ${m.ids.join('+')}`);
    const b = correr(123).res.enviados.map((m) => `${m.en.toISOString()} ${m.ids.join('+')}`);
    expect(a).toEqual(b);
    expect(escenario(7)).toEqual(escenario(7));
  });

  it('cubre lo pedido: todas las duraciones, conductas, álbumes, noches y compras', () => {
    const vistos = (f: (c: (typeof CORRIDAS)[number]) => unknown) => new Set(CORRIDAS.map(f));
    for (const d of [1, 2, 3, 4, 7, 15, 30, 60]) expect(vistos((c) => c.e.dias).has(d), `${d} días`).toBe(true);
    expect(vistos((c) => c.e.conducta).size).toBe(8);
    expect(vistos((c) => c.e.conductaAlbum).size).toBeGreaterThanOrEqual(4);
    expect(vistos((c) => c.e.compra.horaNoche ?? 'defecto').size).toBe(6);
    expect(vistos((c) => c.e.antelacion)).toEqual(new Set([0, 1, 3, 20]));
    expect(CORRIDAS.some((c) => c.e.cruzaCambioDeHora)).toBe(true);
  });

  for (const [inv, nombre] of Object.entries(INVARIANTES)) {
    if (ROTAS_HOY.has(inv)) {
      it.fails(`${nombre} [HOY SE ROMPE: ver la nota de arriba]`, () => {
        expect(violan(inv)).toEqual([]);
      });
    } else {
      it(nombre, () => {
        expect(violan(inv)).toEqual([]);
      });
    }
  }

  it('las tres lecturas nuevas no rompen ninguna invariante', () => {
    for (const f of [lecturaUnDia, lecturaDosDias, lecturaTreintaDias]) {
      const { res, md } = f();
      expect(revisar(res).violaciones, f.name).toEqual([]);
      expect(md).not.toContain('{{');
    }
  });

  it('lectura de 30 días: trae lo que tiene que traer', () => {
    const { md } = lecturaTreintaDias();
    for (const id of ['REC1-U', 'VA1', 'ATR-V', 'TXT', 'PR-R', 'FN1', 'VU0', 'VU1', 'CA1', 'AL1', 'DES', 'DES+']) expect(md, id).toContain(`\`${id}\``);
    expect(md.match(/`TXT`/g)!.length).toBe(2);
  });

  it('lectura de 2 días: la propia no entra y queda en los avisos a Naza', () => {
    const { res } = lecturaDosDias();
    expect(res.cal!.propiasQueNoEntran).toHaveLength(1);
    expect(res.cal!.avisosNaza.join(' ')).toContain('¿Qué te hizo acordar a nosotros?');
    expect(res.enviados.some((m) => m.ids.includes('PR-R'))).toBe(false);
  });
});
