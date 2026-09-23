import { describe, it, expect } from 'vitest';
import { edadDe, rangoDeEtapa, planificar, cuantasVariables, replanificar, TOPE_PREGUNTAS, TECHO_VARIABLES } from '../src/ia/plan-preguntas.js';
import { perfilVacio, type Perfil } from '../src/ia/perfil.js';

// El reparto de preguntas por etapas (biógrafo v2, problema 3, 23/09). Hoy las 26 fijas le dan
// 12 preguntas a los primeros 22 años y ninguna propia a los 35-75. Decisión de Naza y Joaquín:
// una línea de tiempo al principio y las preguntas variables repartidas según ESTA vida.
// Es una cuenta, sin modelo: se prueba gratis y se puede leer por qué eligió cada tramo.

function perfilDe(edad: string | null, etapas: Perfil['etapas'] = [], bisagras: string[] = []): Perfil {
  const p = perfilVacio();
  p.persona.edad = edad ? { valor: edad, fuente: 'dicho' } : null;
  p.etapas = etapas;
  p.bisagras = bisagras;
  return p;
}
const etapa = (edades: string, lugar: string, queHacia = ''): Perfil['etapas'][number] =>
  ({ edades, lugar, conQuien: '', queHacia, fuente: 'dicho' });

// El núcleo que se pregunta siempre, con el tramo al que apunta cada una.
const NUCLEO = [
  { id: 'casa', tramo: 'infancia' }, { id: 'padres', tramo: 'infancia' }, { id: 'juegos', tramo: 'infancia' },
  { id: 'sabado', tramo: 'juventud' }, { id: 'amigos', tramo: 'juventud' },
  { id: 'hoy', tramo: 'hoy' },
] as const;

describe('edadDe', () => {
  it('lee la edad dicha, un rango (toma el medio) o la saca del año de nacimiento', () => {
    expect(edadDe(perfilDe('28'), 2026)).toBe(28);
    expect(edadDe(perfilDe('entre 70 y 80'), 2026)).toBe(75);
    const p = perfilVacio();
    p.persona.anioNacimiento = { valor: '1950', fuente: 'ficha' };
    expect(edadDe(p, 2026)).toBe(76);
  });

  it('si no se sabe, null: no se inventa', () => {
    expect(edadDe(perfilVacio(), 2026)).toBeNull();
  });
});

describe('rangoDeEtapa', () => {
  it('entiende las formas en que el perfil escribe las edades', () => {
    expect(rangoDeEtapa('7 a 17', 70)).toEqual([7, 17]);
    expect(rangoDeEtapa('15 a 17 (aprox.)', 70)).toEqual([15, 17]);
    expect(rangoDeEtapa('desde los 12', 28)).toEqual([12, 28]);
    expect(rangoDeEtapa('68-hoy', 76)).toEqual([68, 76]);
    expect(rangoDeEtapa('hasta al menos los 10', 70)).toEqual([0, 10]);
    expect(rangoDeEtapa('durante la infancia', 70)).toBeNull();
  });
});

describe('planificar', () => {
  it('sin edad no planifica: lo primero es saberla', () => {
    const r = planificar(perfilDe(null), NUCLEO as never, 11);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.falta).toBe('edad');
  });

  it('a una persona de 76 le da la mayoría de las variables a la vida adulta, no a la infancia', () => {
    const r = planificar(perfilDe('76'), NUCLEO as never, 11);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const cuantas = (t: string) => r.variables.filter((v) => v.tramo === t).length;
    expect(r.variables).toHaveLength(11);
    expect(cuantas('infancia')).toBe(0); // ya tiene 3 del núcleo
    expect(cuantas('adultez media') + cuantas('segunda mitad')).toBeGreaterThanOrEqual(5);
  });

  it('a alguien de 28 no le pregunta por la jubilación: los tramos que no vivió no existen', () => {
    const r = planificar(perfilDe('28'), NUCLEO as never, 11);
    if (!r.ok) throw new Error('debería planificar');
    expect(r.variables.every((v) => ['infancia', 'juventud', 'adulto joven', 'hoy'].includes(v.tramo))).toBe(true);
  });

  it('una bisagra suma peso a su tramo y viaja como ancla de la pregunta', () => {
    const sin = planificar(perfilDe('76'), NUCLEO as never, 11);
    const con = planificar(perfilDe('76', [], ['A los 60 murió Rubén']), NUCLEO as never, 11);
    if (!sin.ok || !con.ok) throw new Error('debería planificar');
    const segunda = (r: typeof sin) => (r.ok ? r.variables.filter((v) => v.tramo === 'segunda mitad').length : 0);
    expect(segunda(con)).toBeGreaterThan(segunda(sin));
    expect(con.variables.find((v) => v.tramo === 'segunda mitad')?.anclas).toContain('A los 60 murió Rubén');
  });

  it('las etapas del perfil viajan como anclas del tramo donde caen (lugar y qué hacía)', () => {
    const r = planificar(perfilDe('76', [etapa('27 a 60', 'Lanús', 'su taller de costura')]), NUCLEO as never, 11);
    if (!r.ok) throw new Error('debería planificar');
    const media = r.variables.find((v) => v.tramo === 'adultez media');
    expect(media?.anclas.join(' ')).toContain('Lanús');
  });

  it('reparte exactamente las que se le piden', () => {
    for (const n of [0, 1, 4, 11, 20]) {
      const r = planificar(perfilDe('70'), NUCLEO as never, n);
      if (!r.ok) throw new Error('debería planificar');
      expect(r.variables).toHaveLength(n);
    }
  });
});

describe('cuantasVariables (la cantidad sale de la vida, no de un número fijo)', () => {
  it('una cada 6 años más una por bisagra, entre 8 y 19', () => {
    expect(cuantasVariables(27, 0)).toBe(8);   // 4 → piso
    expect(cuantasVariables(76, 0)).toBe(12);
    expect(cuantasVariables(76, 3)).toBe(15);
    expect(cuantasVariables(90, 10)).toBe(19); // techo
  });
  it('con 21 fijas nunca pasa el tope de 40', () => {
    expect(21 + cuantasVariables(120, 40)).toBeLessThanOrEqual(TOPE_PREGUNTAS);
  });
});

describe('planificar sin cuantas', () => {
  it('usa cuantasVariables con la edad y las bisagras del perfil', () => {
    const r = planificar(perfilDe('76', [], ['A los 60 murió Rubén', 'A los 30 se mudó a Lanús']), NUCLEO as never);
    if (!r.ok) throw new Error('debería planificar');
    expect(r.variables).toHaveLength(14);
  });
});

describe('replanificar (aparecen bisagras nuevas a mitad de camino)', () => {
  it('suma variables si la vida las pide, y nunca baja de lo ya asignado ni pasa el techo', () => {
    const inicial = planificar(perfilDe('76'), NUCLEO as never);
    if (!inicial.ok) throw new Error('x');
    const conBisagras = replanificar(perfilDe('76', [], ['A los 60 murió Rubén']), NUCLEO as never, inicial.variables, 5);
    if (!conBisagras.ok) throw new Error('x');
    expect(conBisagras.variables.length).toBe(inicial.variables.length + 1);
    // Las 5 ya hechas (las primeras) se conservan tal cual.
    expect(conBisagras.variables.slice(0, 5)).toEqual(inicial.variables.slice(0, 5));
    const muchas = replanificar(perfilDe('90', [], Array.from({ length: 30 }, (_, i) => `A los ${i + 1} algo`)), NUCLEO as never, inicial.variables, 5);
    if (!muchas.ok) throw new Error('x');
    expect(muchas.variables.length).toBeLessThanOrEqual(TECHO_VARIABLES);
  });
});
