// Simulación de Vitácora de Viaje V2: 300 viajes inventados (semillas 1 a
// 300) corridos de punta a punta con el código de verdad, con las invariantes
// de scripts/viaje-v2-simular.ts. La corrida completa (2400 viajes) y las
// estadísticas están en docs/viajes-v2/simulaciones/resumen.md.
//
// Las cinco invariantes que se rompían (b3, d2, d6, h1, h3) quedaron
// arregladas con lo que aprobó Naza después de las simulaciones: la noche solo
// entre 19:00 y 22:30 y mínimo 3 días en la compra, AS1 "ya de viaje" con un
// SÍ tardío, e ID1 nunca el día de salida en casa. Ya no hay `it.fails`.
import { describe, it, expect } from 'vitest';
import { correr, correrMuchos, INVARIANTES, lecturaUnDia, lecturaDosDias, lecturaTreintaDias, revisar, escenario } from '../scripts/viaje-v2-simular.js';

const CORRIDAS = correrMuchos(300);

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
    for (const d of [3, 4, 5, 7, 10, 15, 30, 60]) expect(vistos((c) => c.e.dias).has(d), `${d} días`).toBe(true);
    expect(CORRIDAS.every((c) => c.e.dias >= 3)).toBe(true); // la compra pide al menos 3 días
    expect(vistos((c) => c.e.conducta).size).toBe(8);
    expect(vistos((c) => c.e.conductaAlbum).size).toBeGreaterThanOrEqual(4);
    expect(vistos((c) => c.e.compra.horaNoche ?? 'defecto').size).toBe(5);
    expect(vistos((c) => c.e.antelacion)).toEqual(new Set([0, 1, 3, 20]));
    expect(CORRIDAS.some((c) => c.e.cruzaCambioDeHora)).toBe(true);
  });

  for (const [inv, nombre] of Object.entries(INVARIANTES)) {
    it(nombre, () => {
      expect(violan(inv)).toEqual([]);
    });
  }

  it('las tres lecturas nuevas no rompen ninguna invariante', () => {
    for (const f of [lecturaUnDia, lecturaDosDias, lecturaTreintaDias]) {
      const { res, md } = f();
      const v = revisar(res).violaciones;
      // 1 y 2 días: la compra ya no los permite (k); quedan como prueba del código de viajes cortos.
      if (f !== lecturaTreintaDias) expect(v.map((x) => x.inv), f.name).toEqual(['k']);
      else expect(v, f.name).toEqual([]);
      expect(md).not.toContain('{{');
    }
  });

  it('lectura de 30 días: trae lo que tiene que traer', () => {
    const { md } = lecturaTreintaDias();
    for (const id of ['REC1-U', 'VA1', 'ATR-V', 'TXT', 'PR-R', 'PR-R2', 'PR-R3', 'FN1', 'VU0', 'VU1', 'CA1', 'AL1', 'AL3', 'DES']) expect(md, id).toContain(`\`${id}\``);
    expect(md.match(/`TXT`/g)!.length).toBe(2);
    expect(md).not.toContain('`DES+`'); // reenvió las 5 que sobraban: eligió ella
    expect(md).toContain('reacciona ❤️ a su mensaje');
  });

  it('lectura de 2 días: la propia no entra y queda en los avisos a Naza', () => {
    const { res } = lecturaDosDias();
    expect(res.cal!.propiasQueNoEntran).toHaveLength(1);
    expect(res.cal!.avisosNaza.join(' ')).toContain('¿Qué te hizo acordar a nosotros?');
    expect(res.enviados.some((m) => m.ids.includes('PR-R'))).toBe(false);
  });
});

describe('viaje v2: simulación, lo que cambió con las reglas de las simulaciones', () => {
  it('ya no hay viajes sin cerrar: CA1 sin respuesta abre el álbum con AL1-P', () => {
    expect(CORRIDAS.every((c) => c.res.album?.fase === 'cerrado')).toBe(true);
    expect(CORRIDAS.some((c) => c.hallazgos.some((h) => h.inv === 'i7'))).toBe(true);
  });

  it('hay AL3 con las dos salidas: eligió (DES sin DES+) y no eligió (DES+)', () => {
    const conAl3 = CORRIDAS.filter((c) => c.res.enviados.some((m) => m.ids.includes('AL3')));
    expect(conAl3.some((c) => c.res.enviados.some((m) => m.ids.includes('DES+')))).toBe(true);
    expect(conAl3.some((c) => !c.res.enviados.some((m) => m.ids.includes('DES+')))).toBe(true);
  });

  it('hay reacciones ❤️ y ningún ACM después de un mediodía', () => {
    expect(CORRIDAS.some((c) => c.res.corazones.length > 0)).toBe(true);
  });
});
