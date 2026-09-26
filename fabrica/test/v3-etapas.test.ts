import { describe, it, expect } from 'vitest';
import { armarEtapas, cambiosDeFicha, cambiosDeEdad, PISO_ETAPA, TECHO_ETAPA, PISO_ROL, type AnecdotaEtapa, type Cambio } from '../src/v3/etapas.js';
import type { FichaV3 } from '../src/v3/ficha.js';

const ANIO = 2026;
const base = { anioNacimiento: 1950, anioActual: ANIO };
const a = (id: string, anio: number | null, palabras: number, rol?: string): AnecdotaEtapa => ({ id, anio, palabras, ...(rol ? { rol } : {}) });
const c = (anio: number, tipo: Cambio['tipo'] = 'mudanza', fuente: Cambio['fuente'] = 'biblia'): Cambio => ({ anio, tipo, que: `${tipo} ${anio}`, fuente });

describe('constantes (decisión de Naza con Fable, 26/09)', () => {
  it('piso 600, techo 2.500, rol propio desde 1.200 palabras escritas', () => {
    expect(PISO_ETAPA).toBe(600);
    expect(TECHO_ETAPA).toBe(2500);
    expect(PISO_ROL).toBe(1200);
  });
});

describe('cambiosDeFicha', () => {
  const ficha: FichaV3 = {
    nombre: 'Rosa', anioNacimiento: 1950, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'España',
    parejas: [{ nombre: 'Ricardo', actual: false, fin: 'fallecio', anioInicio: 1972, anioFin: 2011 }, { nombre: 'Tito', actual: true, fin: null }],
    hijos: [{ nombre: 'Pablo', anio: 1975 }, { nombre: 'Ana', anio: 1979 }],
    oficios: [{ nombre: 'modista', desde: 1968 }, { nombre: 'costurera' }],
    migracion: { de: 'Rosario', a: 'Madrid', edad: 60 },
  };
  const cambios = cambiosDeFicha(ficha, ANIO);

  it('toma pareja (inicio y fin), el primer hijo, cada oficio con año y la migración', () => {
    expect(cambios.map((x) => `${x.anio} ${x.tipo}`).sort()).toEqual(['1968 oficio', '1972 pareja', '1975 hijo', '2010 migracion', '2011 viudez'].sort());
    expect(cambios.every((x) => x.fuente === 'ficha')).toBe(true);
  });

  it('una separación con año es un cambio de pareja; sin año no hay cambio', () => {
    const f: FichaV3 = { ...ficha, parejas: [{ nombre: 'X', actual: false, fin: 'separacion', anioInicio: 1990, anioFin: 1995 }], hijos: 'no-tiene', oficios: 'no-tiene', migracion: 'no-tiene' };
    expect(cambiosDeFicha(f, ANIO).map((x) => `${x.anio} ${x.tipo}`)).toEqual(['1990 pareja', '1995 separacion']);
  });

  it('ignora años fuera de la vida (antes de nacer o en el futuro)', () => {
    const f: FichaV3 = { ...ficha, parejas: 'no-tiene', hijos: [{ nombre: 'P', anio: 2030 }], oficios: [{ nombre: 'o', desde: 1940 }], migracion: 'no-tiene' };
    expect(cambiosDeFicha(f, ANIO)).toEqual([]);
  });
});

describe('cambiosDeEdad', () => {
  it('los cortes universales de la escuela: 13 y 18 años', () => {
    expect(cambiosDeEdad(1998, ANIO).map((x) => [x.anio, x.fuente])).toEqual([[2011, 'edad'], [2016, 'edad']]);
  });
  it('no corta en el futuro de alguien muy joven', () => {
    expect(cambiosDeEdad(2012, ANIO).map((x) => x.anio)).toEqual([2025]);
  });
});

describe('armarEtapas', () => {
  it('corta en cada cambio y ordena las anécdotas por año', () => {
    const r = armarEtapas([a('A2', 1975, 900), a('A1', 1960, 900), a('A3', 1990, 900)], [c(1970), c(1985)], base);
    expect(r.capitulos.map((x) => [x.desde, x.hasta, x.anecdotas])).toEqual([
      [1950, 1970, ['A1']],
      [1970, 1985, ['A2']],
      [1985, null, ['A3']],
    ]);
  });

  it('un cambio en el año de una anécdota abre el capítulo nuevo (la anécdota va al nuevo)', () => {
    const r = armarEtapas([a('A1', 1960, 900), a('A2', 1970, 900)], [c(1970)], base);
    expect(r.capitulos.map((x) => x.anecdotas)).toEqual([['A1'], ['A2']]);
  });

  it('un tramo sin anécdotas no es capítulo: el anterior se estira', () => {
    const r = armarEtapas([a('A1', 1960, 900), a('A3', 1990, 900)], [c(1970), c(1980)], base);
    expect(r.capitulos.map((x) => [x.desde, x.hasta])).toEqual([[1950, 1980], [1980, null]]);
  });

  it('bajo el piso se pega al vecino más chico', () => {
    const r = armarEtapas([a('A1', 1960, 2000), a('A2', 1972, 300), a('A3', 1990, 900)], [c(1970), c(1985)], base);
    expect(r.capitulos.map((x) => x.anecdotas)).toEqual([['A1'], ['A2', 'A3']]);
    expect(r.capitulos[1].desde).toBe(1970);
  });

  it('el primero bajo el piso se pega al siguiente y el último al anterior', () => {
    const r = armarEtapas([a('A1', 1955, 200), a('A2', 1975, 900), a('A3', 2000, 200)], [c(1970), c(1990)], base);
    expect(r.capitulos.map((x) => x.anecdotas)).toEqual([['A1', 'A2', 'A3']]);
  });

  it('nunca corta por un año solo: si pasa el techo sin cambios, queda largo y avisa', () => {
    const r = armarEtapas([a('A1', 1960, 2000), a('A2', 1980, 2000)], [], base);
    expect(r.capitulos).toHaveLength(1);
    expect(r.avisos.join(' ')).toMatch(/techo/);
  });

  it('si pegarse lo pasa del techo, igual se pega (manda el piso) y avisa', () => {
    const r = armarEtapas([a('A1', 1960, 2400), a('A2', 1972, 300), a('A3', 1990, 2450)], [c(1970), c(1985)], base);
    expect(r.capitulos.map((x) => x.anecdotas)).toEqual([['A1', 'A2'], ['A3']]);
    expect(r.avisos.join(' ')).toMatch(/techo/);
  });

  it('las anécdotas se ordenan por año dentro del capítulo (empate: el orden de entrada)', () => {
    const r = armarEtapas([a('B', 1965, 500), a('A', 1960, 500), a('C', 1965, 500)], [], base);
    expect(r.capitulos[0].anecdotas).toEqual(['A', 'B', 'C']);
  });

  it('una anécdota sin año no se ubica: queda aparte con aviso', () => {
    const r = armarEtapas([a('A1', 1960, 900), a('X', null, 100)], [], base);
    expect(r.sinAnio).toEqual(['X']);
    expect(r.capitulos[0].anecdotas).toEqual(['A1']);
  });

  it('suma las palabras de cada capítulo', () => {
    const r = armarEtapas([a('A1', 1960, 500), a('A2', 1961, 400)], [], base);
    expect(r.capitulos[0].palabras).toBe(900);
  });

  it('el último capítulo llega a hoy (hasta = null)', () => {
    const r = armarEtapas([a('A1', 1960, 900)], [], base);
    expect(r.capitulos[0]).toMatchObject({ desde: 1950, hasta: null });
  });

  it('guarda el cambio que abre cada capítulo', () => {
    const r = armarEtapas([a('A1', 1960, 900), a('A2', 1975, 900)], [c(1970, 'pareja', 'ficha')], base);
    expect(r.capitulos[0].abre).toBeNull();
    expect(r.capitulos[1].abre).toMatchObject({ anio: 1970, tipo: 'pareja' });
  });

  it('dos cambios en el mismo año son un solo corte (gana la ficha)', () => {
    const r = armarEtapas([a('A1', 1960, 900), a('A2', 1975, 900)], [c(1970, 'mudanza', 'biblia'), c(1970, 'pareja', 'ficha')], base);
    expect(r.capitulos).toHaveLength(2);
    expect(r.capitulos[1].abre?.fuente).toBe('ficha');
  });

  it('avisa de una anécdota con año fuera de la vida (igual se ubica en el primer o último capítulo)', () => {
    const r = armarEtapas([a('A1', 1940, 900), a('A2', 2030, 900)], [], base);
    expect(r.capitulos[0].anecdotas).toEqual(['A1', 'A2']);
    expect(r.avisos.join(' ')).toMatch(/A1.*fuera de la vida|fuera de la vida.*A1/);
  });

  it('ignora cortes antes de nacer o después de hoy', () => {
    const r = armarEtapas([a('A1', 1960, 900)], [c(1940), c(2030)], base);
    expect(r.capitulos).toHaveLength(1);
  });

  describe('capítulo de rol (pareja u oficio grande)', () => {
    it('desde 1.200 palabras va aparte, intercalado en el año en que empieza', () => {
      const r = armarEtapas(
        [a('A1', 1960, 900), a('R1', 1972, 700, 'pareja:Ricardo'), a('R2', 2005, 600, 'pareja:Ricardo'), a('A2', 1980, 900), a('A3', 2000, 900)],
        [c(1975), c(1995)],
        base,
      );
      expect(r.capitulos.map((x) => x.rol ?? x.anecdotas.join(','))).toEqual(['A1', 'pareja:Ricardo', 'A2', 'A3']);
      const rol = r.capitulos[1];
      expect(rol).toMatchObject({ desde: 1972, hasta: 2005, anecdotas: ['R1', 'R2'], palabras: 1300 });
    });

    it('bajo 1.200 el rol no se separa: sus anécdotas van a su época', () => {
      const r = armarEtapas([a('A1', 1960, 900), a('R1', 1962, 500, 'oficio:modista')], [], base);
      expect(r.capitulos).toHaveLength(1);
      expect(r.capitulos[0].anecdotas).toEqual(['A1', 'R1']);
      expect(r.capitulos[0].rol).toBeUndefined();
    });

    it('un rol que empieza dentro del último capítulo va antes de él: el libro siempre termina en el que llega a hoy', () => {
      const r = armarEtapas([a('A1', 1960, 900), a('A2', 1975, 900), a('R1', 1980, 700, 'pareja:Z'), a('R2', 1990, 700, 'pareja:Z')], [c(1972)], base);
      expect(r.capitulos.map((x) => x.rol ?? x.anecdotas.join(','))).toEqual(['A1', 'pareja:Z', 'A2']);
      expect(r.capitulos[r.capitulos.length - 1].hasta).toBeNull();
    });

    it('si todo el material con año es de un rol, no queda un capítulo vacío', () => {
      const r = armarEtapas([a('R1', 1950, 700, 'pareja:Z'), a('R2', 1990, 700, 'pareja:Z')], [], base);
      expect(r.capitulos.map((x) => x.rol)).toEqual(['pareja:Z']);
    });

    it('un rol cuyas anécdotas no tienen año no se separa', () => {
      const r = armarEtapas([a('A1', 1960, 900), a('R1', null, 1500, 'pareja:X')], [], base);
      expect(r.capitulos.every((x) => !x.rol)).toBe(true);
      expect(r.sinAnio).toEqual(['R1']);
    });
  });

  it('cada anécdota con año queda en exactamente un capítulo', () => {
    const ans = Array.from({ length: 40 }, (_x, i) => a(`A${i}`, 1950 + ((i * 7) % 76), 100 + ((i * 37) % 400), i % 9 === 0 ? 'pareja:P' : undefined));
    const r = armarEtapas(ans, [c(1963), c(1968), c(1972), c(1990), c(2010)], base);
    const todas = r.capitulos.flatMap((x) => x.anecdotas).sort();
    expect(todas).toEqual(ans.map((x) => x.id).sort());
  });
});
