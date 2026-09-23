import { describe, it, expect } from 'vitest';
import { armarSecuencia, proxima, avanzar, aplicarPerfil, tocaObjeto, registrarObjeto, MAX_OBJETOS } from '../src/ia/secuencia.js';
import { NUCLEO } from '../src/ia/pregunta-v2.js';
import { perfilVacio } from '../src/ia/perfil.js';
import type { Variable } from '../src/ia/plan-preguntas.js';

// La secuencia viva (diseño 23/09, §2.5): columna vertebral cronológica, pero el biógrafo elige la
// próxima si la persona abrió una puerta, y un tema fijo que ya contó se cae.

const vars: Variable[] = [
  { tramo: 'infancia', desde: 0, hasta: 12, anclas: [] },
  { tramo: 'adulto joven', desde: 23, hasta: 35, anclas: [] },
  { tramo: 'segunda mitad', desde: 56, hasta: 76, anclas: [] },
];
const ids = (s: ReturnType<typeof armarSecuencia>) => s.pendientes.map((o) => o.id);

describe('armarSecuencia', () => {
  it('presentación, casa, mapa de casas y capítulos primero; después la vida en orden (fijas del tramo antes que sus variables); un día de hoy; la reflexión al final con cinco-minutos último', () => {
    const s = armarSecuencia(vars);
    const l = ids(s);
    expect(l.slice(0, 4)).toEqual(['presentacion', 'casa-infancia', 'mapa-casas', 'mapa-capitulos']);
    expect(l.indexOf('juegos')).toBeLessThan(l.indexOf('var-infancia-1'));
    expect(l.indexOf('var-infancia-1')).toBeLessThan(l.indexOf('a-los-quince'));
    expect(l.indexOf('var-segunda mitad-1')).toBeLessThan(l.indexOf('un-dia-de-hoy'));
    expect(l.indexOf('lo-que-falta')).toBeLessThan(l.indexOf('mensaje'));
    expect(l.at(-1)).toBe('cinco-minutos');
    expect(l).toHaveLength(NUCLEO.length + vars.length);
  });
});

describe('proxima y avanzar', () => {
  it('devuelve la primera pendiente; avanzar la pasa a hechas con su orden y tramo; al final null', () => {
    let s = armarSecuencia([]);
    expect(proxima(s)?.id).toBe('presentacion');
    s = avanzar(s, proxima(s)!, 0);
    expect(proxima(s)?.id).toBe('casa-infancia');
    expect(s.hechas[0]).toMatchObject({ id: 'presentacion', orden: 0, tramo: null });
    expect(s.hechas[0].objetivo.id).toBe('presentacion');
    for (let i = 1; proxima(s); i++) s = avanzar(s, proxima(s)!, i);
    expect(proxima(s)).toBeNull();
    expect(s.hechas).toHaveLength(NUCLEO.length);
  });
});

describe('aplicarPerfil', () => {
  const pasadas = (s: ReturnType<typeof armarSecuencia>, n: number) => { for (let i = 0; i < n; i++) s = avanzar(s, proxima(s)!, i); return s; };

  it('una puerta abierta adelanta ese tema pendiente al frente (también "pruebas"), salvo el arranque y el cierre', () => {
    let s = pasadas(armarSecuencia(vars), 5); // ya pasó el inicio
    const p = perfilVacio(); p.puertaAbierta = 'pruebas';
    s = aplicarPerfil(s, p);
    expect(proxima(s)?.id).toBe('pruebas');
    // Si todavía está en el inicio, no se mueve nada.
    let t = pasadas(armarSecuencia(vars), 1);
    t = aplicarPerfil(t, p);
    expect(proxima(t)?.id).toBe('casa-infancia');
    // cinco-minutos nunca se adelanta.
    const q = perfilVacio(); q.puertaAbierta = 'cinco-minutos';
    expect(proxima(aplicarPerfil(s, q))?.id).toBe('pruebas');
  });

  it('un tema cubierto se cae y su lugar lo toma una variable de su tramo (dentro del techo)', () => {
    let s = pasadas(armarSecuencia(vars), 4);
    const p = perfilVacio(); p.cubiertos = ['amigos'];
    s = aplicarPerfil(s, p);
    expect(ids(s)).not.toContain('amigos');
    expect(s.cubiertos).toEqual(['amigos']);
    expect(s.pendientes.filter((o) => o.tipo === 'variable')).toHaveLength(vars.length + 1);
  });

  it('nunca se cae una hecha, ni los cuatro primeros, ni la reflexión', () => {
    let s = pasadas(armarSecuencia(vars), 2);
    const p = perfilVacio(); p.cubiertos = ['presentacion', 'mapa-capitulos', 'mensaje'];
    s = aplicarPerfil(s, p);
    expect(ids(s)).toContain('mapa-capitulos');
    expect(ids(s)).toContain('mensaje');
  });

  it('variables nuevas (replanificar) se suman al final de su tramo, sin repetir ids', () => {
    let s = armarSecuencia(vars);
    s = aplicarPerfil(s, perfilVacio(), [...vars, { tramo: 'adulto joven', desde: 23, hasta: 35, anclas: [] }]);
    const l = ids(s);
    expect(l.filter((x) => x.startsWith('var-adulto joven-'))).toEqual(['var-adulto joven-1', 'var-adulto joven-2']);
    expect(new Set(l).size).toBe(l.length);
  });
});

describe('objetos', () => {
  it('toca un objeto cuando la siguiente cambia de tramo, no en el inicio, hasta 8; sinFotos apaga', () => {
    let s = armarSecuencia(vars);
    for (let i = 0; i < 4; i++) s = avanzar(s, proxima(s)!, i);        // inicio hecho
    expect(tocaObjeto(s, proxima(s)!, false)).toBeNull();               // primer tramo: nada todavía
    while (proxima(s)!.id !== 'a-los-quince') s = avanzar(s, proxima(s)!, 10);
    expect(tocaObjeto(s, proxima(s)!, false)).toBe('infancia');         // se cierra la infancia
    expect(tocaObjeto(s, proxima(s)!, true)).toBeNull();
    for (let i = 0; i < MAX_OBJETOS; i++) s = registrarObjeto(s, 'infancia', 101 + i);
    expect(tocaObjeto(s, proxima(s)!, false)).toBeNull();
  });
  it('al terminar, si quedan objetos, toca uno final', () => {
    let s = armarSecuencia([]);
    while (proxima(s)) s = avanzar(s, proxima(s)!, 1);
    expect(tocaObjeto(s, null as never, false)).toBe('hoy');
  });
});
