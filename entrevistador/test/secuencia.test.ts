import { describe, it, expect } from 'vitest';
import { armarSecuencia, rearmar, proxima, avanzar, aplicarCubiertos, etapaCerrada, agregarLibre, tocaObjeto, registrarObjeto, tramoDe, MAX_OBJETOS } from '../src/ia/secuencia.js';
import { perfilVacio, aplicarCambios, type Perfil } from '../src/ia/perfil.js';
import type { Objetivo } from '../src/ia/pregunta-v2.js';
import { tope } from '../src/ia/guion-v2.js';

const ANIO = 2026;
const dicho = (valor: string) => ({ valor, fuente: 'dicho' as const });
const persona = (nombre: string, vinculo: string) => ({ nombre, vinculo, vive: 'si' as const, fuente: 'dicho' as const });
function naza(): Perfil {
  const p = perfilVacio(); p.persona.edad = dicho('27');
  p.personas.push(persona('Ariel', 'hermano mayor'), persona('Juan Manuel', 'hermano del medio'), persona('Ima', 'pareja actual'));
  p.etapas.push({ edades: '0 a 22', lugar: 'Martínez, provincia de Buenos Aires', conQuien: '', queHacia: '', fuente: 'dicho' });
  return p;
}
const ids = (s: ReturnType<typeof armarSecuencia>) => s.pendientes.map((o) => o.id);
/** Avanza hasta que la próxima sea `id` (sin incluirla). */
function hastaAntesDe(s: ReturnType<typeof armarSecuencia>, id: string) {
  let orden = 0;
  while (proxima(s) && proxima(s)!.id !== id) s = avanzar(s, proxima(s)!, orden++);
  return { s, orden };
}

describe('armarSecuencia y rearmar', () => {
  it('con la ficha vacía arma el guion sin edad (infancia, juventud, adulto joven, hoy, futuro, reflexión) y la presentación primero', () => {
    const s = armarSecuencia(perfilVacio(), ANIO);
    expect(proxima(s)?.id).toBe('presentacion');
    expect(ids(s)).toContain('oficio'); expect(ids(s)).not.toContain('el-trabajo-y-la-plata');
    expect(s.libres).toBe(0); expect(s.caidas.length).toBeGreaterThan(0);
  });
  it('rearmar con la ficha nueva respeta lo hecho y agrega lo que ahora aplica (los hermanos después del censo)', () => {
    let s = armarSecuencia(perfilVacio(), ANIO);
    for (let i = 0; i < 3; i++) s = avanzar(s, proxima(s)!, i); // presentación, casa, los-tuyos-hoy
    expect(ids(s).some((id) => id.startsWith('hermano-'))).toBe(false);
    const r = rearmar(s, naza(), ANIO);
    expect(r.hechas).toHaveLength(3);
    expect(ids(r)).toContain('hermano-ariel'); expect(ids(r)).toContain('pareja-como-llego');
    expect(ids(r)).not.toContain('casa-infancia');
    expect(proxima(r)?.id).toBe('mapa-casas');
  });
  it('rearmar no resucita una fila cubierta ni borra una libre ya agregada', () => {
    let s = armarSecuencia(naza(), ANIO);
    s = aplicarCubiertos(s, aplicarCambios(naza(), { cubiertos: ['la-escuela'] }));
    const libre: Objetivo = { tipo: 'variable', id: 'libre-infancia-1', tramo: 'infancia', desde: 0, hasta: 12, anclas: ['x'] };
    s = { ...s, pendientes: [...s.pendientes, libre], libres: 1 };
    const r = rearmar(s, aplicarCambios(naza(), { agregarPersonas: [persona('Lola', 'hija')] }), ANIO);
    expect(ids(r)).not.toContain('la-escuela'); expect(ids(r)).toContain('libre-infancia-1'); expect(ids(r)).toContain('hijo-lola');
    expect(r.cubiertos).toEqual(['la-escuela']);
  });
  it('fix ronda 1, ítem 3: rearmar no pasa el techo aunque hechas viejas (dos puertas) ya no existan en el guion nuevo', () => {
    const base = perfilVacio(); base.persona.edad = dicho('70');
    base.etapas.push({ edades: '0 a 70', lugar: 'Buenos Aires, Argentina', conQuien: '', queHacia: '', fuente: 'dicho' });
    let s = armarSecuencia(base, ANIO); // sin pareja ni hermanos en la ficha: entran las puertas
    expect(ids(s)).toEqual(expect.arrayContaining(['hermanos-puerta', 'pareja-puerta']));
    let orden = 0;
    // responde las dos puertas (y todo lo del medio): quedan hechas, con la ficha vieja.
    while (proxima(s) && s.hechas.filter((h) => h.id === 'pareja-puerta').length === 0) s = avanzar(s, proxima(s)!, orden++);
    expect(ids(s).concat(s.hechas.map((h) => h.id))).toEqual(expect.arrayContaining(['hermanos-puerta', 'pareja-puerta']));

    // ahora se sabe: pareja, hijos, nietos, hermanos y una pérdida — las dos puertas ya no existen
    // en el guion nuevo (las reemplazan pareja-como-llego y las filas de cada hermano), y la ficha
    // nueva, con lugar (para que entre la historia grande) y bastante familia, llena el resto de los
    // cupos hasta el techo de un 70 (44).
    const p0 = aplicarCambios(base, {
      agregarPersonas: [
        persona('Marta', 'marido'), persona('Ana', 'hija'), persona('Bruno', 'hijo'), persona('Cora', 'hijo'),
        persona('Dora', 'hermana'), persona('Emilio', 'hermano'), persona('Facundo', 'hermano'),
        persona('Hugo', 'nieto'), persona('Ines', 'nieto'),
      ],
    });
    const p = aplicarCambios(p0, { corregirPersonas: [{ i: p0.personas.findIndex((x) => x.nombre === 'Facundo'), vive: 'no' }] });
    const fresco = armarSecuencia(p, ANIO);
    expect(fresco.pendientes.length).toBe(tope(70)); // el guion fresco ya está en el techo por sí solo

    const r = rearmar(s, p, ANIO);
    expect(ids(r)).not.toContain('hermanos-puerta'); expect(ids(r)).not.toContain('pareja-puerta');
    const total = r.pendientes.length + r.hechas.length - 1; // -1: la presentación no cuenta para el techo
    expect(total).toBeLessThanOrEqual(tope(70));
  });
});

describe('proxima y avanzar', () => {
  it('avanzar pasa a hechas con orden y tramo, y al final null; el objetivo va entero (la fábrica lo lee)', () => {
    let s = armarSecuencia(naza(), ANIO);
    s = avanzar(s, proxima(s)!, 0);
    expect(s.hechas[0]).toMatchObject({ id: 'presentacion', orden: 0, tramo: null });
    expect((s.hechas[0].objetivo as { bloque: string }).bloque).toBe('presentacion');
    for (let i = 1; proxima(s); i++) s = avanzar(s, proxima(s)!, i);
    expect(proxima(s)).toBeNull();
    expect(s.hechas.at(-1)?.id).toBe('cinco-minutos');
  });
});

describe('aplicarCubiertos', () => {
  it('una fila que la ficha da por contada se cae, con registro; el inicio, hoy, futuro y la reflexión nunca', () => {
    const s = aplicarCubiertos(armarSecuencia(naza(), ANIO), aplicarCambios(naza(), { cubiertos: ['abuelos-y-raices', 'mapa-casas', 'cinco-minutos', 'un-dia-de-hoy', 'lo-que-te-queda-por-hacer', 'no-existe'] }));
    expect(ids(s)).not.toContain('abuelos-y-raices');
    expect(ids(s)).toEqual(expect.arrayContaining(['mapa-casas', 'cinco-minutos', 'un-dia-de-hoy', 'lo-que-te-queda-por-hacer']));
    expect(s.cubiertos).toEqual(['abuelos-y-raices']);
  });
  it('una fila expandida se cubre por su id instanciado', () => {
    const s = aplicarCubiertos(armarSecuencia(naza(), ANIO), aplicarCambios(naza(), { cubiertos: ['hermano-ariel'] }));
    expect(ids(s)).not.toContain('hermano-ariel'); expect(ids(s)).toContain('hermano-juan-manuel');
  });
});

describe('etapaCerrada y agregarLibre', () => {
  it('cerrar la infancia (última fila del tramo hecha) devuelve infancia; si quedan pendientes del tramo, null', () => {
    const { s } = hastaAntesDe(armarSecuencia(naza(), ANIO), 'la-escuela');
    const laEscuela = proxima(s)!;
    const antes = etapaCerrada(s, laEscuela);
    expect(antes).toBeNull();
    const despues = etapaCerrada(avanzar(s, laEscuela, 99), laEscuela);
    expect(despues).toBe('infancia');
  });
  it('fix ronda 1, ítem 1: una libre hecha no vuelve a cerrar su propia etapa (no encadena)', () => {
    const p = aplicarCambios(naza(), { agregarNoSabemos: ['[infancia] Por qué no conoció a sus abuelos', '[infancia] Qué pasó con los perros'] });
    const { s: s0 } = hastaAntesDe(armarSecuencia(p, ANIO), 'la-escuela');
    let s = avanzar(s0, proxima(s0)!, 99); // cierra la infancia
    const a = agregarLibre(s, p, 'infancia', ANIO);
    expect(a.libre?.id).toBe('libre-infancia-1');
    s = avanzar(a.secuencia, a.libre!, 100);
    expect(etapaCerrada(s, a.libre!)).toBeNull(); // una `variable` nunca cierra etapa, aunque queden anclas sin usar
  });
  it('la libre nace del primer noSabemos de esa etapa ([infancia] …), va primera, y una sola por etapa (aunque queden anclas sin usar); sin noSabemos de la etapa, nada', () => {
    const p = aplicarCambios(naza(), { agregarNoSabemos: ['[juventud] Cómo se arreglaron con Ciano', '[infancia] Por qué no conoció a sus abuelos', '[infancia] Qué pasó con los perros'] });
    const s0 = armarSecuencia(p, ANIO);
    const a = agregarLibre(s0, p, 'infancia', ANIO);
    expect(a.libre).toMatchObject({ tipo: 'variable', id: 'libre-infancia-1', tramo: 'infancia', desde: 0, hasta: 12, anclas: ['Por qué no conoció a sus abuelos'] });
    expect(proxima(a.secuencia)?.id).toBe('libre-infancia-1');
    expect(a.secuencia.libres).toBe(1);
    // fix ronda 1, ítem 1: una sola libre por etapa — aunque quede "Qué pasó con los perros" sin usar, no se agrega otra.
    const b = agregarLibre(a.secuencia, p, 'infancia', ANIO);
    expect(b.libre).toBeNull();
    expect(agregarLibre(a.secuencia, p, 'adulto joven', ANIO).libre).toBeNull(); // sin noSabemos de esa etapa
  });
  it('fix ronda 1, ítem 4: el id de la libre es un slug del tramo, no el tramo crudo con espacio', () => {
    const p = aplicarCambios(naza(), { agregarNoSabemos: ['[adulto joven] Qué pasó con el oficio'] });
    const a = agregarLibre(armarSecuencia(p, ANIO), p, 'adulto joven', ANIO);
    expect(a.libre?.id).toBe('libre-adulto-joven-1');
  });
  it('no pasa de MAX_LIBRES (una por etapa) ni del techo', () => {
    const base = perfilVacio(); base.persona.edad = dicho('40'); // vive infancia, juventud, adulto joven y adultez media
    const p = aplicarCambios(base, { agregarNoSabemos: ['[infancia] a', '[juventud] b', '[adulto joven] c', '[adultez media] d', '[hoy] e'] });
    let s = armarSecuencia(p, ANIO);
    for (const tramo of ['infancia', 'juventud', 'adulto joven', 'adultez media'] as const) {
      const r = agregarLibre(s, p, tramo, ANIO);
      expect(r.libre).not.toBeNull();
      s = r.secuencia;
    }
    expect(s.libres).toBe(4);
    expect(agregarLibre(s, p, 'hoy', ANIO).libre).toBeNull(); // MAX_LIBRES ya alcanzado, aunque haya ancla [hoy]

    const grande = perfilVacio(); grande.persona.edad = dicho('82');
    grande.personas.push(persona('Rubén', 'marido'), persona('A', 'hija'), persona('B', 'hijo'), persona('C', 'hijo'), persona('D', 'hermana'), persona('E', 'hermano'), persona('F', 'nieto'));
    const g = aplicarCambios(grande, { agregarNoSabemos: ['[infancia] algo'] });
    const sg = armarSecuencia(g, ANIO);
    const total = (x: typeof sg) => x.pendientes.length + x.hechas.length - 1;
    if (total(sg) >= 44) expect(agregarLibre(sg, g, 'infancia', ANIO).libre).toBeNull();
    else expect(total(agregarLibre(sg, g, 'infancia', ANIO).secuencia)).toBeLessThanOrEqual(44);
  });
});

describe('tramoDe', () => {
  it('la fila trae su tramo; inicio, futuro y reflexión dan null; ya no hay default a adulto joven', () => {
    const s = armarSecuencia(naza(), ANIO);
    const de = (id: string) => tramoDe(s.pendientes.find((o) => o.id === id)!);
    expect(de('oficio')).toBe('adulto joven'); expect(de('un-lugar-que-cambio-algo')).toBeNull(); expect(de('mensaje')).toBeNull(); expect(de('mapa-casas')).toBeNull();
  });
});

describe('fix ronda 1, ítem 2: el cierre de etapa mira el bloque, no solo el tramo propio', () => {
  it('adulto joven no cierra con pareja-como-llego: sigue abierta hasta terminar por-gusto (la última fila del bloque, con tramo null)', () => {
    let s = armarSecuencia(naza(), ANIO);
    let orden = 0;
    while (proxima(s) && proxima(s)!.id !== 'pareja-como-llego') s = avanzar(s, proxima(s)!, orden++);
    s = avanzar(s, proxima(s)!, orden++); // única fila de adulto joven CON tramo propio
    expect(etapaCerrada(s, s.hechas.at(-1)!.objetivo)).toBeNull();
    expect(tocaObjeto(s, proxima(s), false)).toBeNull();
    // quedan un-lugar-que-cambio-algo, amigos-de-siempre y por-gusto (los tres con tramo: null, bloque 'adulto joven')
    expect(ids(s)).toEqual(expect.arrayContaining(['un-lugar-que-cambio-algo', 'amigos-de-siempre', 'por-gusto']));
    while (proxima(s) && proxima(s)!.id !== 'por-gusto') s = avanzar(s, proxima(s)!, orden++);
    const porGusto = proxima(s)!;
    s = avanzar(s, porGusto, orden++);
    expect(etapaCerrada(s, porGusto)).toBe('adulto joven');
    expect(tocaObjeto(s, proxima(s), false)).toBe('adulto joven');
  });
});

describe('tocaObjeto y registrarObjeto', () => {
  it('Naza de punta a punta: el de "hoy" sale una sola vez como de tramo; el final sale igual, marcado final (arreglo final I3)', () => {
    let s = armarSecuencia(naza(), ANIO);
    let orden = 0;
    let ordenObjeto = 101;
    while (proxima(s)) {
      const sig = proxima(s)!;
      const t = tocaObjeto(s, sig, false);
      s = avanzar(s, sig, orden++);
      if (t) s = registrarObjeto(s, t, ordenObjeto++);
    }
    const final = tocaObjeto(s, null, false);
    expect(final).not.toBeNull();
    s = registrarObjeto(s, final!, ordenObjeto++, true);
    const deTramo = s.objetos.filter((o) => !o.final).map((o) => o.tramo);
    expect(new Set(deTramo).size).toBe(deTramo.length);
    expect(s.objetos.filter((o) => o.final)).toHaveLength(1);
    expect(tocaObjeto(s, null, false)).toBeNull();
  });
  it('nunca en el inicio; toca cuando un tramo se cerró y no tiene objeto; uno por tramo; sinFotos apaga; hasta 8; y el final una sola vez', () => {
    let s = armarSecuencia(naza(), ANIO);
    for (let i = 0; i < 5; i++) s = avanzar(s, proxima(s)!, i);
    expect(tocaObjeto(s, proxima(s), false)).toBeNull();
    const { s: s2, orden } = hastaAntesDe(s, 'a-los-quince');
    expect(tocaObjeto(s2, proxima(s2), false)).toBe('infancia');
    expect(tocaObjeto(s2, proxima(s2), true)).toBeNull();
    const s3 = registrarObjeto(s2, 'infancia', 101);
    expect(tocaObjeto(s3, proxima(s3), false)).toBeNull();
    let s4 = s3;
    for (let i = orden; proxima(s4); i++) s4 = avanzar(s4, proxima(s4)!, i);
    expect(tocaObjeto(s4, null, false)).not.toBeNull();
    const s5 = registrarObjeto(s4, tocaObjeto(s4, null, false)!, 102, true);
    expect(tocaObjeto(s5, null, false)).toBeNull();
    let lleno = s5;
    for (let i = 103; lleno.objetos.length < MAX_OBJETOS; i++) lleno = registrarObjeto(lleno, 'hoy', i);
    expect(tocaObjeto(lleno, null, false)).toBeNull();
  });
});
