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
    // "amigos" no tiene tramo propio (diseño §2.3): sin ese dato en el perfil, el default es
    // adulto joven, así que la variable que la reemplaza cae ahí.
    const nueva = s.pendientes.find((o) => o.id === 'var-adulto joven-2');
    expect(nueva).toMatchObject({ tramo: 'adulto joven', desde: 23, hasta: 35 });
  });

  it('el techo de variables se respeta: un plan con 15 variables y 5 temas cubiertos termina con hasta 19', () => {
    const muchasVars: Variable[] = (['infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad'] as const)
      .flatMap((tramo) => [1, 2, 3].map(() => ({ tramo, desde: 0, hasta: 99, anclas: [] })));
    expect(muchasVars).toHaveLength(15);
    let s = armarSecuencia(muchasVars);
    const p = perfilVacio();
    p.cubiertos = ['padres', 'con-quien-crecio', 'juegos', 'a-los-quince', 'primer-trabajo'];
    s = aplicarPerfil(s, p);
    const totalVariables = s.pendientes.filter((o) => o.tipo === 'variable').length;
    expect(totalVariables).toBeLessThanOrEqual(19);
    expect(totalVariables).toBe(19); // 15 + 4 de los 5 cubiertos: el quinto ya no entra bajo el techo.
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

  it('una puerta abierta a mitad de un tramo no dispara el objeto antes de tiempo (revisión ronda 1)', () => {
    let s = armarSecuencia(vars);
    for (let i = 0; i < 4; i++) s = avanzar(s, proxima(s)!, i);        // inicio hecho
    // La puerta manda a "amor" (adulto joven) en plena infancia: todavía quedan padres,
    // con-quien-crecio, juegos y var-infancia-1 pendientes, la infancia no se cerró.
    const p = perfilVacio(); p.puertaAbierta = 'amor';
    s = aplicarPerfil(s, p);
    expect(proxima(s)?.id).toBe('amor');
    s = avanzar(s, proxima(s)!, 10);
    expect(tocaObjeto(s, proxima(s)!, false)).toBeNull();               // ni el de adulto joven (sigue abierto)
    expect(proxima(s)?.id).toBe('padres');                              // vuelve a la infancia
    s = avanzar(s, proxima(s)!, 11);
    expect(tocaObjeto(s, proxima(s)!, false)).toBeNull();                // tampoco al volver: la infancia sigue sin cerrarse
  });

  it('al terminar, si el último tramo con objeto pendiente ya lo usó, igual toca uno final', () => {
    let s = armarSecuencia([]);
    while (proxima(s)) s = avanzar(s, proxima(s)!, 1);
    expect(tocaObjeto(s, null, false)).toBe('hoy');
    s = registrarObjeto(s, 'hoy', 101);                 // el objeto normal de "hoy"
    expect(tocaObjeto(s, null, false)).toBe('hoy');      // el final es otra cosa: no se lo come
    s = registrarObjeto(s, 'hoy', 102, true);           // se registra como el final
    expect(tocaObjeto(s, null, false)).toBeNull();        // y no vuelve a tocar
  });
});
