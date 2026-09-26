import { describe, it, expect } from 'vitest';
import { preguntasPara, datosQueFaltan, renderizar } from '../src/v3/seleccion.js';
import type { FichaV3 } from '../src/v3/ficha.js';

const ANIO = 2026;
const op = { anioActual: ANIO };

// Las dos fichas de la tabla "Resumen de conteos" de docs/v3/banco-v3.md.
const TIPICA: FichaV3 = {
  nombre: 'Rosa', apodo: 'Rosita', anioNacimiento: 1955, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina',
  padres: { madre: { nombre: 'Elsa', vive: false }, padre: { nombre: 'Juan', vive: false } },
  hermanos: ['Pedro', 'Luisa'],
  parejas: [{ nombre: 'Ricardo', actual: true, fin: null }],
  hijos: [{ nombre: 'Pablo', anio: 1980 }, { nombre: 'Ana', anio: 1983 }],
  nietos: ['Juli'], nietosACargo: 'no-tiene',
  migracion: 'no-tiene', campo: 'no-tiene', oficios: [{ nombre: 'modista' }], dejoDeTrabajar: true,
  estudios: 'no-tiene', militar: 'no-tiene', religion: 'no-tiene', personaImportante: 'no-tiene', enfermedadLarga: 'no-tiene',
};

const JOVEN: FichaV3 = {
  nombre: 'Tomás', apodo: 'Tomi', anioNacimiento: 1997, genero: 'varon', paisNacimiento: 'Argentina', paisResidencia: 'España',
  padres: { madre: { nombre: 'Laura', vive: true }, padre: { nombre: 'Jorge', vive: true } },
  hermanos: ['Lucía', 'Martín'], parejas: 'no-tiene', hijos: 'no-tiene', nietos: 'no-tiene', nietosACargo: 'no-tiene',
  migracion: { de: 'Buenos Aires', a: 'Barcelona', anio: 2021 }, campo: 'no-tiene', oficios: [{ nombre: 'diseñador' }],
  estudios: { que: 'Diseño', terminado: true }, militar: 'no-tiene', religion: 'no-tiene', personaImportante: 'no-tiene', enfermedadLarga: 'no-tiene',
};

// [Breve, Estándar, Completo] por bloque, de la tabla del md.
const ESPERADO_TIPICA: Record<number, [number, number, number]> = {
  1: [3, 3, 7], 2: [6, 6, 17], 3: [3, 6, 11], 4: [4, 6, 15], 5: [1, 6, 8], 6: [3, 10, 12], 7: [6, 10, 19], 8: [5, 11, 11],
  9: [2, 5, 8], 10: [2, 3, 6], 11: [3, 8, 10], 12: [2, 2, 5], 13: [2, 4, 15], 14: [4, 6, 12], 15: [4, 7, 8],
};
const ESPERADO_JOVEN: Record<number, [number, number, number]> = {
  1: [3, 3, 7], 2: [6, 8, 17], 3: [3, 8, 10], 4: [4, 8, 15], 5: [3, 13, 17], 6: [0, 1, 3], 7: [6, 11, 19], 8: [0, 1, 1],
  9: [2, 5, 8], 10: [2, 3, 6], 11: [1, 6, 8], 12: [2, 2, 4], 13: [2, 4, 14], 14: [4, 6, 12], 15: [4, 7, 7],
};

function historiaPorBloque(ficha: FichaV3, tamanio: 'B' | 'E' | 'C'): Record<number, number> {
  const cuenta: Record<number, number> = {};
  for (const p of preguntasPara(ficha, tamanio, op)) {
    if (p.clase !== 'historia') continue;
    cuenta[p.bloque] = (cuenta[p.bloque] ?? 0) + 1;
  }
  return cuenta;
}

const ids = (ficha: FichaV3, t: 'B' | 'E' | 'C') => preguntasPara(ficha, t, op).map((p) => p.preguntaId);

describe('preguntasPara: las fichas de la tabla del banco', () => {
  for (const [nombre, ficha, esperado, totales] of [
    ['vida típica 60+', TIPICA, ESPERADO_TIPICA, [50, 93, 164]],
    ['joven de 29 emigrado', JOVEN, ESPERADO_JOVEN, [42, 86, 148]],
  ] as const) {
    it(`${nombre}: preguntas de historia por bloque y tamaño`, () => {
      (['B', 'E', 'C'] as const).forEach((t, i) => {
        const cuenta = historiaPorBloque(ficha, t);
        for (let b = 1; b <= 15; b++) expect(cuenta[b] ?? 0, `${t} bloque ${b}`).toBe(esperado[b][i]);
        expect(preguntasPara(ficha, t, op).filter((p) => p.clase === 'historia')).toHaveLength(totales[i]);
      });
    });
  }

  it('Estándar suma 13 puertas y 12 válvulas; Breve ninguna', () => {
    const e = preguntasPara(TIPICA, 'E', op);
    expect(e.filter((p) => p.clase === 'puerta')).toHaveLength(13);
    expect(e.filter((p) => p.clase === 'valvula')).toHaveLength(12);
    expect(preguntasPara(TIPICA, 'B', op).filter((p) => p.clase !== 'historia')).toHaveLength(0);
  });

  it('orden: bloques crecientes y la puerta y la válvula cierran su bloque', () => {
    const lista = preguntasPara(TIPICA, 'E', op);
    for (let i = 1; i < lista.length; i++) expect(lista[i].bloque).toBeGreaterThanOrEqual(lista[i - 1].bloque);
    const bloque2 = lista.filter((p) => p.bloque === 2);
    expect(bloque2.slice(-2).map((p) => p.clase)).toEqual(['puerta', 'valvula']);
  });
});

describe('preguntasPara: casos borde de E2', () => {
  it('soltera sin hijos no recibe casamiento ni preguntas de pareja', () => {
    const maestra: FichaV3 = { ...TIPICA, parejas: 'no-tiene', hijos: 'no-tiene', nietos: 'no-tiene' };
    const lista = preguntasPara(maestra, 'C', op);
    expect(lista.some((p) => /^AM([1-9]|1[0-3])$/.test(p.preguntaId))).toBe(false);
    expect(lista.some((p) => /casaron|casarse/.test(p.texto))).toBe(false);
    expect(lista.map((p) => p.preguntaId)).toContain('AM15');
    expect(lista.map((p) => p.preguntaId)).toContain('HI10');
    expect(lista.map((p) => p.preguntaId)).toContain('LE5');
  });

  it('joven no recibe DES1 ni las de 45+/60+', () => {
    const c = ids(JOVEN, 'C');
    for (const id of ['DES1', 'HJ5', 'TR9', 'ES10', 'HG3']) expect(c).not.toContain(id);
    expect(ids(TIPICA, 'C')).toContain('DES1');
  });

  it('LU5 (el vehículo) ya no es de 60+: le llega al joven en Estándar', () => {
    expect(ids(JOVEN, 'E')).toContain('LU5');
    expect(ids(JOVEN, 'B')).not.toContain('LU5');
  });

  it('bloque 14: HO8 y FU1 en Breve, HO9 en Estándar, FU2 solo en Completo', () => {
    expect(ids(TIPICA, 'B')).toEqual(expect.arrayContaining(['HO8', 'FU1']));
    expect(ids(TIPICA, 'B')).not.toContain('HO9');
    expect(ids(TIPICA, 'E')).toEqual(expect.arrayContaining(['HO8', 'HO9', 'FU1']));
    expect(ids(TIPICA, 'E')).not.toContain('FU2');
    expect(ids(TIPICA, 'C')).toContain('FU2');
  });

  it('FU2: "dentro de diez años" al joven, "dentro de unos años" a 60 o más, sin la nota', () => {
    const fu2 = (f: FichaV3) => preguntasPara(f, 'C', op).find((p) => p.preguntaId === 'FU2')!.texto;
    expect(fu2(JOVEN)).toMatch(/dentro de diez años/);
    expect(fu2(TIPICA)).toMatch(/dentro de unos años/);
    expect(fu2(TIPICA)).not.toMatch(/diez|60 o más/);
    expect(fu2(JOVEN)).not.toMatch(/60 o más/);
  });

  it('LE6 al joven le pregunta "dentro de muchos años"', () => {
    const le6 = preguntasPara(JOVEN, 'B', op).find((p) => p.preguntaId === 'LE6')!;
    expect(le6.texto).toMatch(/dentro de muchos años/);
    expect(le6.texto).not.toMatch(/Menos de 45/);
  });

  it('hijo único recibe CA8, no CA6 ni CA7', () => {
    const c = ids({ ...TIPICA, hermanos: 'no-tiene' }, 'C');
    expect(c).toContain('CA8');
    expect(c).not.toContain('CA6');
    expect(c).not.toContain('CA7');
  });

  it('migrante recibe JU8 a JU11; no migrante no', () => {
    const e = ids(JOVEN, 'E');
    for (const id of ['JU8', 'JU9', 'JU10', 'JU10b', 'JU11']) expect(e).toContain(id);
    expect(ids(TIPICA, 'C')).not.toContain('JU8');
  });

  it('sensible sin dato confirmado no se manda; con dato sí; noTocar la saca', () => {
    expect(ids({ ...TIPICA, padres: 'no-sabe' }, 'B')).not.toContain('PE1');
    expect(ids(TIPICA, 'B')).toContain('PE1');
    const sinPe1 = ids({ ...TIPICA, noTocar: { preguntas: ['PE1'] } }, 'B');
    expect(sinPe1).not.toContain('PE1');
    expect(sinPe1).toContain('PE2');
    const sinBloque = preguntasPara({ ...TIPICA, noTocar: { bloques: [11] } }, 'E', op);
    expect(sinBloque.some((p) => p.bloque === 11)).toBe(false);
  });

  it('dos parejas: AM1–AM8 se repiten con sujeto pareja:2 y el prefijo; la separada recibe AM9', () => {
    const gallego: FichaV3 = {
      ...TIPICA, genero: 'varon',
      parejas: [
        { nombre: 'Carmen', actual: false, fin: 'separacion', anioInicio: 1976, anioFin: 1990 },
        { nombre: 'Norma', actual: true, fin: null, anioInicio: 1993 },
      ],
    };
    const lista = preguntasPara(gallego, 'E', op);
    const am1 = lista.filter((p) => p.preguntaId === 'AM1');
    expect(am1.map((p) => p.sujeto)).toEqual(['pareja:1', 'pareja:2']);
    expect(am1[1].texto).toMatch(/^Ahora sobre Norma: Contame el día que conociste a Norma/);
    expect(lista.filter((p) => p.preguntaId === 'AM9').map((p) => p.sujeto)).toEqual(['pareja:1']);
    expect(lista.filter((p) => p.preguntaId === 'AM13').map((p) => p.sujeto)).toEqual(['pareja:2']);
    expect(lista.some((p) => p.preguntaId === 'AM11')).toBe(false);
  });

  it('viuda recibe AM11 y AM12 (sensibles) sobre su pareja', () => {
    const viuda: FichaV3 = { ...TIPICA, parejas: [{ nombre: 'Ricardo', actual: false, fin: 'fallecio' }] };
    const lista = preguntasPara(viuda, 'E', op);
    const am11 = lista.find((p) => p.preguntaId === 'AM11')!;
    expect(am11).toMatchObject({ sujeto: 'pareja:1', sensible: true });
    expect(am11.texto).toMatch(/con Ricardo/);
    expect(lista.some((p) => p.preguntaId === 'AM13')).toBe(false);
  });

  it('HI2 y HI3 una por hijo; con más de 4, HI3 solo primero y último y se suma HI3b', () => {
    const tres = preguntasPara({ ...TIPICA, hijos: [{ nombre: 'A' }, { nombre: 'B' }, { nombre: 'C' }] }, 'E', op);
    expect(tres.filter((p) => p.preguntaId === 'HI2').map((p) => p.sujeto)).toEqual(['hijo:1', 'hijo:2', 'hijo:3']);
    expect(tres.find((p) => p.preguntaId === 'HI2' && p.sujeto === 'hijo:2')!.texto).toMatch(/nació B/);
    const cinco = preguntasPara({ ...TIPICA, hijos: ['A', 'B', 'C', 'D', 'E'].map((nombre) => ({ nombre })) }, 'E', op);
    expect(cinco.filter((p) => p.preguntaId === 'HI3').map((p) => p.sujeto)).toEqual(['hijo:1', 'hijo:5']);
    expect(cinco.map((p) => p.preguntaId)).toContain('HI3b');
    expect(tres.map((p) => p.preguntaId)).not.toContain('HI3b');
  });

  it('hijo fallecido (solo por ficha): HF1 y HF2 con su sujeto', () => {
    const lista = preguntasPara({ ...TIPICA, hijos: [{ nombre: 'Pablo' }, { nombre: 'Ana', fallecio: true }] }, 'E', op);
    expect(lista.filter((p) => p.preguntaId === 'HF1').map((p) => p.sujeto)).toEqual(['hijo:2']);
    expect(lista.find((p) => p.preguntaId === 'HF1')!.texto).toMatch(/^Contame de Ana/);
  });

  it('TR2 lleva sujeto oficio:1 y el nombre del oficio', () => {
    const tr2 = preguntasPara(TIPICA, 'B', op).find((p) => p.preguntaId === 'TR2')!;
    expect(tr2.sujeto).toBe('oficio:1');
    expect(tr2.texto).toMatch(/como modista/);
  });

  it('singular y plural según la lista', () => {
    const uno = preguntasPara({ ...TIPICA, hermanos: ['Pedro'], hijos: [{ nombre: 'Pablo' }] }, 'C', op);
    expect(uno.find((p) => p.preguntaId === 'CA6')!.texto).toMatch(/^Contame de Pedro: cómo era de chico o chica/);
    expect(uno.find((p) => p.preguntaId === 'HI6')!.texto).toMatch(/un momento con Pablo del que/);
    expect(uno.find((p) => p.preguntaId === 'HI7')!.texto).toMatch(/cuando Pablo se fue de casa/);
    const varios = preguntasPara(TIPICA, 'C', op);
    expect(varios.find((p) => p.preguntaId === 'CA6')!.texto).toMatch(/^Contame de tus hermanos, Pedro y Luisa:/);
    expect(varios.find((p) => p.preguntaId === 'HI6')!.texto).toMatch(/con alguno de tus hijos del que/);
  });

  it('género, aposición y genérico', () => {
    const b = preguntasPara(TIPICA, 'C', op);
    expect(b.find((p) => p.preguntaId === 'CA1')!.texto).toMatch(/de chica,/);
    expect(b.find((p) => p.preguntaId === 'CA2')!.texto).toMatch(/^Contame cómo era tu mamá, Elsa:/);
    const sinNombres = preguntasPara({ ...TIPICA, padres: { madre: { vive: false } } }, 'B', op);
    expect(sinNombres.find((p) => p.preguntaId === 'CA2')!.texto).toMatch(/^Contame cómo era tu mamá: cómo era/);
    expect(renderizar('Contame el viaje a {{lugar_destino}} [al lugar nuevo].', { ...TIPICA, migracion: 'no-sabe' }, {}, ANIO)).toBe(
      'Contame el viaje a al lugar nuevo.'.replace('a al', 'al'),
    );
  });

  it('LE4 sin nietos borra "y en {{nietos}}" y la nota', () => {
    const le4 = preguntasPara({ ...TIPICA, nietos: 'no-tiene' }, 'E', op).find((p) => p.preguntaId === 'LE4')!;
    expect(le4.texto).toBe('Pensá en Pablo y Ana. ¿Qué deseás para cada uno? Nombralos uno por uno.');
  });
});

describe('datosQueFaltan', () => {
  it('ficha con los obligatorios: pide los datos de cada gate sin resolver, en orden de bloque', () => {
    const minima: FichaV3 = { nombre: 'Marta', anioNacimiento: 1951, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina' };
    expect(datosQueFaltan(minima, op)).toEqual(['D1', 'D1.1', 'D1.2', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12']);
    expect(datosQueFaltan(TIPICA, op)).toEqual([]);
  });

  it('sin dato, las C:DATO no sensibles tampoco se mandan (el simulador asume que el narrador no contestó los datos)', () => {
    const minima: FichaV3 = { nombre: 'Marta', anioNacimiento: 1951, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina' };
    const lista = ids(minima, 'E');
    expect(lista).not.toContain('CA6');
    expect(lista).not.toContain('CA8');
    expect(lista).toContain('CA1');
  });
});
