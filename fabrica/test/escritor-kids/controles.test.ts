import { describe, expect, it } from 'vitest';
import { aplicarArreglo, controlarAlbum, controlarParte, controlarSobre, cubiertas, formaLectura, formaParte, suVozValida, tieneDosPuntos, type Salidas } from '../../src/escritor-kids/controles.js';
import { albumFalso, parteFalsa, sobreFalso } from '../../src/escritor-kids/falso.js';
import { materialDeFilas } from '../../src/escritor-kids/material/de-filas.js';
import { filasDeFijo } from '../../src/escritor-kids/material/de-fijo.js';
import type { SalidaParte } from '../../src/escritor-kids/llamadas.js';

const m = materialDeFilas(filasDeFijo('chico-inventado'));
const salidas = (): Salidas => ({ partes: new Map(m.partes.map((p) => [p.n, parteFalsa(m, p.n)])), sobre: sobreFalso(m), album: albumFalso(m) });
const parte = (n: number) => m.partes[n - 1];

describe('controles de código del libro de Kids', () => {
  it('con todo bien, no marca nada', () => {
    const s = salidas();
    const cub = cubiertas(m, s);
    for (const p of m.partes) expect(controlarParte(m, p, s.partes.get(p.n)!, cub), `parte ${p.n}`).toEqual([]);
    expect(controlarSobre(m, s.sobre, cub)).toEqual([]);
    expect(controlarAlbum(m, s.album)).toEqual([]);
  });

  it('dos puntos, salvo los de la hora', () => {
    expect(tieneDosPuntos('a las 10:30 llegamos')).toBe(false);
    expect(tieneDosPuntos('Lo mejor: el gol')).toBe(true);
  });

  it('marca la respuesta que no está en ningún lado, la pieza sin ids, ids ajenos, dos puntos, estirada y título vacío', () => {
    const s = salidas();
    const p1 = s.partes.get(1)!;
    const k2 = p1.piezas.find((p) => p.clave === 'K2')!;
    p1.piezas = p1.piezas.filter((p) => p.clave !== 'K5'); // falta K5 entera
    k2.titulo = 'La sal: travesura';
    k2.ids = [...k2.ids, 'R40']; // R40 es de la parte 2
    const k3 = p1.piezas.find((p) => p.clave === 'K3')!;
    k3.texto = `${k3.texto} ${k3.texto}`; // estirada
    const k6 = p1.piezas.find((p) => p.clave === 'K6')!;
    k6.titulo = '';
    const k7 = p1.piezas.find((p) => p.clave === 'K7')!;
    k7.ids = [];
    const probs = controlarParte(m, parte(1), p1, cubiertas(m, s));
    const como = probs.map((p) => `${p.clave} ${p.tipo}`);
    expect(como).toContain('K5 falta');
    expect(como).toContain('K2 dos_puntos');
    expect(como).toContain('K2 otro'); // id ajeno
    expect(como).toContain('K3 estirado');
    expect(como).toContain('K6 otro'); // sin título
    expect(como).toContain('K7 otro'); // sin ids
    expect(probs.find((p) => p.clave === 'K5')!.cita).toMatch(/^R12 · Me caí de la bici/);
  });

  it('las preguntas del padre: pregunta tal cual, línea si va, título vacío', () => {
    const s = salidas();
    const p4 = s.partes.get(4)!;
    const padre1 = p4.piezas.find((p) => p.clave === 'PADRE-1')!;
    padre1.linea = 'Esta pregunta te la manda Carolina';
    const padre2 = p4.piezas.find((p) => p.clave === 'PADRE-2')!;
    padre2.pregunta = '¿Qué te acordás de cuando nació Simón?';
    padre2.titulo = 'Simón';
    const probs = controlarParte(m, parte(4), p4, cubiertas(m, s)).map((p) => `${p.clave} ${p.arreglo}`);
    expect(probs).toContain('PADRE-1 la línea es «Esta pregunta te la manda tu mamá»');
    expect(probs).toContain('PADRE-2 la pregunta va tal cual, «¿Qué te acordás del día que nació Simón?»');
    expect(probs).toContain('PADRE-2 en las preguntas del padre el título va vacío');
  });

  it('lo que es solo «no sé» puede ir a afuera; lo que va al álbum o al sobre también cuenta', () => {
    const s = salidas();
    const p1: SalidaParte = s.partes.get(1)!;
    const k1 = p1.piezas.find((p) => p.clave === 'K1')!;
    k1.ids = k1.ids.filter((i) => i !== 'R01');
    p1.afuera.push({ id: 'R01', por_que: 'es solo un no sé' });
    expect(controlarParte(m, parte(1), p1, cubiertas(m, s))).toEqual([]);
    const sinAlbum = { ...s, album: { fotos: [] } };
    expect(controlarAlbum(m, sinAlbum.album)).toContain('F01 no está en el álbum');
  });

  it('el sobre: pregunta igual a la del material y nada afuera', () => {
    const s = salidas();
    s.sobre!.piezas[0].pregunta = 'otra';
    s.sobre!.piezas.pop();
    const probs = controlarSobre(m, s.sobre, cubiertas(m, s));
    expect(probs.some((p) => p.startsWith('K41: la pregunta no es la del material'))).toBe(true);
    expect(probs.some((p) => /R84 \(CIERRE-FINAL\) no está en el sobre/.test(p))).toBe(true);
  });

  it('«Su voz»: solo con audio, nunca del sobre ni de lo preocupante', () => {
    const r = suVozValida(m, { preocupante: [{ ids: ['R14'], cita: 'x', por_que: 'y' }], dudas: [], su_voz: ['R04', 'R03', 'R82', 'R14', 'R04', 'R99'], notas: '' });
    expect(r.ids).toEqual(['R04']);
    expect(r.sacadas.map((x) => `${x.id} ${x.por_que}`)).toEqual(['R03 no tiene audio', 'R82 es del sobre cerrado', 'R14 está marcada como preocupante', 'R04 repetida', 'R99 no existe']);
  });

  it('formas de los JSON', () => {
    expect(formaParte({ piezas: [] })).toEqual(['falta "afuera" (una lista, vacía si no hay nada)']);
    expect(formaParte({ piezas: [{ clave: 'K1', titulo: 't', texto: 'x', ids: ['R01'] }], afuera: [] })).toEqual([]);
    expect(formaLectura({ preocupante: [], dudas: [], su_voz: ['R1'], notas: '' })).toEqual([]);
    expect(formaLectura({ preocupante: [], dudas: [] })).toHaveLength(2);
  });

  it('el arreglo reemplaza solo las claves con problemas y deja el orden del banco', () => {
    const vieja = parteFalsa(m, 1);
    const nueva = { piezas: [{ ...vieja.piezas[2], texto: 'nuevo' }, { ...vieja.piezas[0], texto: 'ajeno' }], afuera: [] };
    const r = aplicarArreglo(parte(1), vieja, nueva, new Set([vieja.piezas[2].clave]));
    expect(r.ignoradas).toEqual([vieja.piezas[0].clave]);
    expect(r.salida.piezas[2].texto).toBe('nuevo');
    expect(r.salida.piezas[0].texto).toBe(vieja.piezas[0].texto);
  });
});
