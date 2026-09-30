// Decisiones de Naza después de leer la entrevista de corrido (30/09,
// docs/v3/entrevista/correcciones-lectura.md): los cierres de todos los
// bloques van en el núcleo, M1 solo donde aplica y después de LE9 va directo
// el final.

import { describe, expect, it } from 'vitest';
import { BANCO, mensajePorId, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { entradaDeBloque, mensajesDespues, siguientePregunta } from '../src/v3/entrevista/flujo.js';
import { simularRecorrido, type PasoRecorrido } from '../src/v3/entrevista/seleccion.js';
import { VIDAS_EJEMPLO } from '../src/v3/entrevista/vidas-ejemplo.js';

const vida = (clave: string) => VIDAS_EJEMPLO.find((v) => v.clave === clave)!;
const recorrer = (clave: string) => {
  const v = vida(clave);
  return simularRecorrido(v.ficha, (id) => v.respuestas[id]);
};
const preguntas = (pasos: PasoRecorrido[]) => pasos.flatMap((p) => (p.tipo === 'pregunta' ? [p] : []));

describe('los cierres de todos los bloques van en el núcleo (Naza, 30/09)', () => {
  it('CI1 a CI14 son del núcleo', () => {
    const cierres = BANCO.filter((p) => p.clase === 'cierre');
    expect(cierres.map((p) => p.id)).toEqual(['CI1', 'CI2', 'CI3', 'CI4', 'CI5', 'CI6', 'CI7', 'CI8', 'CI9', 'CI10', 'CI11', 'CI12', 'CI13', 'CI14']);
    expect(cierres.every((p) => p.parte === 'nucleo')).toBe(true);
  });

  it('a una vida completa le llegan los 14 cierres, cada uno al final de su bloque', () => {
    const ps = preguntas(recorrer('sigue-con-la-primera')).map((p) => p.pregunta);
    for (let b = 1; b <= 14; b++) {
      const delBloque = ps.filter((p) => p.bloque === b);
      expect(delBloque.at(-1)!.id, `bloque ${b}`).toBe(`CI${b}`);
    }
  });

  it('después de cada cierre: M10 en las etapas (bloques 2 a 5), M24 en los demás', () => {
    for (let b = 1; b <= 14; b++) {
      const esperado = b >= 2 && b <= 5 ? ['M10'] : ['M24'];
      expect(mensajesDespues(preguntaPorId(`CI${b}`)!, 'Sí, una cosa más que me acordé.'), `CI${b}`).toEqual(esperado);
    }
  });
});

describe('M1 solo donde aplica (Naza, 30/09)', () => {
  const conM1 = (clave: string) => preguntas(recorrer(clave)).filter((p) => p.conM1).map((p) => p.pregunta.id);

  it('vida completa: las 3 primeras, las 6 que abren tema y las del bloque 11', () => {
    expect(conM1('sigue-con-la-primera')).toEqual(['OR1', 'OR2', 'OR5', 'CA6', 'JU8', 'AM0', 'AM9', 'HI0', 'HI8', 'PE1', 'PE5', 'PE4']);
  });

  it('sin pareja: AM9 no llega, así que tampoco su M1', () => {
    expect(conM1('nunca-pareja-sin-hijos')).toEqual(['OR1', 'OR2', 'OR5', 'CA6', 'JU8', 'AM0', 'HI0', 'HI8', 'PE1', 'PE5', 'PE4']);
  });

  it('las 3 primeras son las 3 primeras que se mandan, aunque se conteste "paso"', () => {
    const r = new Map([['OR1', 'paso']]);
    const s = siguientePregunta({ respuestas: r });
    expect(s).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'OR2' }, conM1: true });
    r.set('OR2', 'Te cuento lo de mis abuelos.').set('OR5', 'Se conocieron en un baile.');
    const cuarta = siguientePregunta({ respuestas: r });
    expect(cuarta).toMatchObject({ tipo: 'pregunta', conM1: false });
  });

  it('los cierres, el aviso, la foto y el final siguen sin M1', () => {
    const sinM1 = preguntas(recorrer('sigue-con-la-primera')).filter((p) => p.pregunta.clase !== 'historia');
    expect(sinM1.length).toBeGreaterThan(0);
    expect(sinM1.every((p) => !p.conM1)).toBe(true);
  });
});

describe('después de LE9 va directo el final (Naza, 30/09)', () => {
  it('LE9 no lleva acuse; "paso" en LE9 tampoco', () => {
    expect(mensajesDespues(preguntaPorId('LE9')!, 'No, creo que está todo.')).toEqual([]);
    expect(mensajesDespues(preguntaPorId('LE9')!, 'paso')).toEqual([]);
  });

  it('las demás del bloque 15 siguen con su acuse', () => {
    expect(mensajesDespues(preguntaPorId('LE8')!, 'Les digo que los quiero.')).toEqual(['M3']);
    expect(mensajesDespues(preguntaPorId('FO1')!, 'Te mando la del casamiento.')).toEqual(['M3']);
  });
});

describe('frases de entrada de bloque (Naza, 30/09)', () => {
  it('hay entrada en todos los bloques menos el 1, el 6 y el 11', () => {
    const con = Array.from({ length: 15 }, (_, i) => i + 1).filter((b) => entradaDeBloque(b));
    expect(con).toEqual([2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 15]);
  });

  it('va antes de la primera pregunta que se manda de cada bloque, y una sola vez', () => {
    const ps = preguntas(recorrer('sigue-con-la-primera'));
    const conEntrada = ps.filter((p) => p.entrada).map((p) => [p.entrada, p.pregunta.id]);
    expect(conEntrada).toEqual([
      ['EN2', 'CA1'], ['EN3', 'ES1'], ['EN4', 'AD2'], ['EN5', 'JU1'], ['EN7', 'TR1'], ['EN8', 'PG1'],
      ['EN9', 'LU4'], ['EN10', 'AS1'], ['EN12', 'HG1'], ['EN13', 'GI1'], ['EN14', 'HO1'], ['EN15', 'LE1'],
    ]);
  });

  it('si ya se mandó algo del bloque, la que sigue no lleva entrada', () => {
    const r = new Map([['OR1', 'a'], ['OR2', 'b'], ['OR5', 'c'], ['CI1', 'd']]);
    expect(siguientePregunta({ respuestas: r })).toMatchObject({ pregunta: { id: 'CA1' }, entrada: 'EN2' });
    r.set('CA1', 'Te cuento de la casa.');
    const s = siguientePregunta({ respuestas: r });
    expect(s.tipo === 'pregunta' && s.entrada).toBeFalsy();
  });

  it('textos aprobados: CI14 pregunta y ningún M24 suena a que terminó', () => {
    expect(preguntaPorId('CI14')!.texto).toContain('¿Quedó algo de tu vida de ahora que no tuvo su pregunta?');
    for (const n of [1, 2, 3, 4]) expect(mensajePorId(`M24.${n}`)!.texto).not.toMatch(/cerramos|terminamos|listo|hasta acá|pasamos|seguimos/i);
  });
});
