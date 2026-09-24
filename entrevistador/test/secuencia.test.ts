import { describe, it, expect } from 'vitest';
import { armarSecuencia, rearmar, proxima, avanzar, aplicarCubiertos, cubrirDesde, descubrir, conNombrado, etapaCerrada, agregarLibre, tocaObjeto, registrarObjeto, tramoDe, MAX_OBJETOS } from '../src/ia/secuencia.js';
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
    s = { ...s, pendientes: s.pendientes.filter((o) => o.id !== 'la-escuela'), cubiertos: ['la-escuela'] }; // tachada antes del ajuste E
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
    // cupos hasta el techo de un 70 (44; +1 de pendientes es la presentación, que no cuenta para el
    // techo). Ajuste A (24/09): con lugar en Argentina de toda la vida, esta persona de 70 también
    // tiene pandemia y Mundial (fuera del máximo de dos), así que el guion fresco pasa el techo por
    // sí solo y `recortarAlTope` saca un evento "grande" (nunca pandemia ni Mundial) para entrar justo.
    const p0 = aplicarCambios(base, {
      agregarPersonas: [
        persona('Marta', 'marido'), persona('Ana', 'hija'), persona('Bruno', 'hijo'), persona('Cora', 'hijo'),
        persona('Dora', 'hermana'), persona('Emilio', 'hermano'), persona('Facundo', 'hermano'),
        persona('Hugo', 'nieto'), persona('Ines', 'nieto'),
      ],
    });
    const p = aplicarCambios(p0, { corregirPersonas: [{ i: p0.personas.findIndex((x) => x.nombre === 'Facundo'), vive: 'no' }] });
    const fresco = armarSecuencia(p, ANIO);
    expect(fresco.pendientes.length).toBe(tope(70) + 1); // +1: la presentación no cuenta para el techo
    expect(fresco.pendientes.map((o) => o.id)).toEqual(expect.arrayContaining(['historia-grande-pandemia', 'historia-grande-mundial']));

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

/** Una secuencia guardada con el shape de antes del ajuste E: filas ya tachadas como cubiertas (el piloto del 24/09). */
function conCubiertosViejos(s: ReturnType<typeof armarSecuencia>, cubiertos: string[]) {
  return { ...s, pendientes: s.pendientes.filter((o) => !cubiertos.includes(o.id)), cubiertos: [...s.cubiertos, ...cubiertos] };
}

describe('aplicarCubiertos (ajuste E, 25/09: solo las puertas se tachan)', () => {
  it('una puerta que la ficha da por resuelta se cae, con registro; cualquier otra fila sigue en el guion', () => {
    const sinArbol = perfilVacio(); sinArbol.persona.edad = dicho('70');
    const s = aplicarCubiertos(armarSecuencia(sinArbol, ANIO), aplicarCambios(sinArbol, { cubiertos: ['hermanos-puerta', 'abuelos-y-raices', 'mapa-casas', 'cinco-minutos', 'no-existe'] }));
    expect(ids(s)).not.toContain('hermanos-puerta');
    expect(ids(s)).toEqual(expect.arrayContaining(['abuelos-y-raices', 'mapa-casas', 'cinco-minutos']));
    expect(s.cubiertos).toEqual(['hermanos-puerta']);
  });
  it('una fila expandida (hermano-ariel) tampoco se tacha', () => {
    const s = aplicarCubiertos(armarSecuencia(naza(), ANIO), aplicarCambios(naza(), { cubiertos: ['hermano-ariel'] }));
    expect(ids(s)).toContain('hermano-ariel'); expect(s.cubiertos).toEqual([]);
  });
});

describe('cubrirDesde (el candado, piloto 24/09; ajuste E 25/09: lo que pasa el candado queda "nombrado", no se tacha)', () => {
  const fila = (s: ReturnType<typeof armarSecuencia>, id: string) => s.pendientes.find((o) => o.id === id)!;
  /** La ficha de hoy: la de antes más los cubiertos que marcó el modelo con esta respuesta. */
  const conCubiertos = (p: Perfil, cubiertos: string[]) => aplicarCambios(p, { cubiertos });

  it('una secuencia nueva arranca sin nombrados', () => {
    expect(armarSecuencia(naza(), ANIO).nombrados).toEqual({});
  });
  it('una respuesta a un repaso del inicio (mapa-capitulos) no nombra nada: a-los-quince, estudios y oficio se rechazan y salen de la ficha', () => {
    const s = armarSecuencia(naza(), ANIO);
    const r = cubrirDesde(s, [], conCubiertos(naza(), ['a-los-quince', 'estudios', 'oficio']), fila(s, 'mapa-capitulos'));
    expect(ids(r.secuencia)).toEqual(expect.arrayContaining(['a-los-quince', 'estudios', 'oficio']));
    expect(r.secuencia.cubiertos).toEqual([]);
    expect(r.secuencia.nombrados).toEqual({});
    expect(r.perfil.cubiertos).toEqual([]);
    expect(r.rechazados.map((x) => x.id)).toEqual(['a-los-quince', 'estudios', 'oficio']);
    expect(r.rechazados[0].motivo).toMatch(/mapa-capitulos/);
  });
  it('mapa-casas y los-tuyos-hoy tampoco; pero una puerta (saber un dato) sí se resuelve ahí y se tacha', () => {
    const sinArbol = perfilVacio(); sinArbol.persona.edad = dicho('70');
    const s = armarSecuencia(sinArbol, ANIO);
    expect(ids(s)).toEqual(expect.arrayContaining(['hermanos-puerta', 'pareja-puerta']));
    const r = cubrirDesde(s, [], conCubiertos(sinArbol, ['hermanos-puerta', 'la-escuela']), fila(s, 'los-tuyos-hoy'));
    expect(ids(r.secuencia)).not.toContain('hermanos-puerta'); expect(ids(r.secuencia)).toContain('la-escuela');
    expect(r.secuencia.cubiertos).toEqual(['hermanos-puerta']);
    expect(r.cubiertos).toEqual(['hermanos-puerta']);
    expect(r.rechazados.map((x) => x.id)).toEqual(['la-escuela']);
    const m = cubrirDesde(s, [], conCubiertos(sinArbol, ['pareja-puerta', 'abuelos-y-raices']), fila(s, 'mapa-casas'));
    expect(m.secuencia.cubiertos).toEqual(['pareja-puerta']);
    expect(m.rechazados.map((x) => x.id)).toEqual(['abuelos-y-raices']);
  });
  it('la fila de una persona (hermano-ariel) no la nombra otra respuesta: "con mi hermano mayor" en padres-como-eran se rechaza', () => {
    const s = armarSecuencia(naza(), ANIO);
    const r = cubrirDesde(s, [], conCubiertos(naza(), ['hermano-ariel']), fila(s, 'padres-como-eran'));
    expect(ids(r.secuencia)).toContain('hermano-ariel');
    expect(r.rechazados).toEqual([{ id: 'hermano-ariel', motivo: expect.stringMatching(/persona/) }]);
    expect(r.secuencia.nombrados).toEqual({});
    expect(r.perfil.cubiertos).not.toContain('hermano-ariel');
  });
  it('lo mismo con un hijo; hijos-llegada no es de una persona: queda nombrada y se pregunta igual', () => {
    const p = aplicarCambios(naza(), { agregarPersonas: [persona('Lola', 'hija')] });
    const s = armarSecuencia(p, ANIO);
    const r = cubrirDesde(s, [], conCubiertos(p, ['hijo-lola', 'hijos-llegada']), fila(s, 'pareja-como-llego'));
    expect(ids(r.secuencia)).toContain('hijo-lola');
    expect(r.rechazados.map((x) => x.id)).toEqual(['hijo-lola']);
    expect(ids(r.secuencia)).toContain('hijos-llegada');
    expect(r.secuencia.nombrados).toEqual({ 'hijos-llegada': 'pareja-como-llego' });
  });
  it('la reflexión, el futuro y hoy no los nombra ninguna otra respuesta: se rechazan con motivo y salen de la ficha', () => {
    const s = armarSecuencia(naza(), ANIO);
    const r = cubrirDesde(s, [], conCubiertos(naza(), ['cinco-minutos', 'lo-que-te-queda-por-hacer', 'los-tuyos-hoy-como-estan']), fila(s, 'la-escuela'));
    expect(ids(r.secuencia)).toEqual(expect.arrayContaining(['cinco-minutos', 'lo-que-te-queda-por-hacer', 'los-tuyos-hoy-como-estan']));
    expect(r.rechazados.map((x) => x.id)).toEqual(['cinco-minutos', 'lo-que-te-queda-por-hacer', 'los-tuyos-hoy-como-estan']);
    expect(r.perfil.cubiertos).toEqual([]);
  });
  it('ajuste E: la-escuela contada con detalle ya NO tacha la cuadra y los juegos: queda en el guion, nombrada desde la-escuela', () => {
    const s = armarSecuencia(naza(), ANIO);
    const r = cubrirDesde(s, [], conCubiertos(naza(), ['la-cuadra-y-los-juegos']), fila(s, 'la-escuela'));
    expect(ids(r.secuencia)).toEqual(ids(s));
    expect(r.secuencia.cubiertos).toEqual([]);
    expect(r.secuencia.nombrados).toEqual({ 'la-cuadra-y-los-juegos': 'la-escuela' });
    expect(r.nombrados).toEqual(['la-cuadra-y-los-juegos']);
    expect(r.perfil.cubiertos).toEqual(['la-cuadra-y-los-juegos']);
    expect(r.rechazados).toEqual([]);
  });
  it('la primera fila que lo nombró queda: si otra respuesta lo vuelve a marcar, no se pisa', () => {
    const s = armarSecuencia(naza(), ANIO);
    const r1 = cubrirDesde(s, [], conCubiertos(naza(), ['la-cuadra-y-los-juegos']), fila(s, 'la-escuela'));
    const r2 = cubrirDesde(r1.secuencia, [], conCubiertos(naza(), ['la-cuadra-y-los-juegos']), fila(s, 'padres-como-eran'));
    expect(r2.secuencia.nombrados).toEqual({ 'la-cuadra-y-los-juegos': 'la-escuela' });
    expect(r2.nombrados).toEqual([]);
  });
  it('piloto 24/09 (segunda vuelta): la-cuadra-y-los-juegos (infancia) no nombra a-los-quince (juventud): es de otra etapa', () => {
    const s = armarSecuencia(naza(), ANIO);
    const r = cubrirDesde(s, [], conCubiertos(naza(), ['a-los-quince']), fila(s, 'la-cuadra-y-los-juegos'));
    expect(ids(r.secuencia)).toContain('a-los-quince');
    expect(r.rechazados).toEqual([{ id: 'a-los-quince', motivo: expect.stringMatching(/otra etapa/) }]);
    expect(r.secuencia.nombrados).toEqual({});
    expect(r.perfil.cubiertos).not.toContain('a-los-quince');
  });
  it('solo mira los cubiertos NUEVOS de esta respuesta: los de antes quedan como estaban', () => {
    const s = conCubiertosViejos(armarSecuencia(naza(), ANIO), ['abuelos-y-raices']);
    const r = cubrirDesde(s, ['abuelos-y-raices'], conCubiertos(naza(), ['abuelos-y-raices', 'estudios']), fila(s, 'mapa-capitulos'));
    expect(r.perfil.cubiertos).toEqual(['abuelos-y-raices']);
    expect(ids(r.secuencia)).not.toContain('abuelos-y-raices'); expect(ids(r.secuencia)).toContain('estudios');
    expect(r.secuencia.nombrados).toEqual({});
  });
  it('una secuencia guardada sin nombrados (el piloto en vivo) anda igual', () => {
    const { nombrados: _n, ...vieja } = armarSecuencia(naza(), ANIO);
    void _n;
    const s = vieja as ReturnType<typeof armarSecuencia>;
    const r = cubrirDesde(s, [], conCubiertos(naza(), ['la-cuadra-y-los-juegos']), fila(s, 'la-escuela'));
    expect(r.secuencia.nombrados).toEqual({ 'la-cuadra-y-los-juegos': 'la-escuela' });
  });
});

describe('conNombrado (ajuste E: la pregunta de una fila nombrada sabe dónde ya se habló)', () => {
  it('le pone a la fila el tema corto de la fila de origen (ya hecha); sin nombrado, la deja igual', () => {
    let s = armarSecuencia(naza(), ANIO);
    ({ s } = hastaAntesDe(s, 'la-escuela'));
    expect(s.hechas.some((h) => h.id === 'la-cuadra-y-los-juegos')).toBe(true);
    s = { ...s, nombrados: { 'la-escuela': 'la-cuadra-y-los-juegos' } };
    const o = conNombrado(s, proxima(s)!) as { id: string; yaNombradoEn?: string };
    expect(o.id).toBe('la-escuela');
    // La cabeza del tema, sin la consigna para el modelo ni el punto final.
    expect(o.yaNombradoEn).toBe('La cuadra, los juegos y los amigos del barrio');
    expect(o.yaNombradoEn!.length).toBeLessThanOrEqual(80);
    expect(o.yaNombradoEn).not.toMatch(/\n/);
    const otra = s.pendientes[1];
    expect(conNombrado(s, otra)).toBe(otra);
    expect(conNombrado({ ...s, nombrados: undefined as never }, otra)).toBe(otra);
  });
  it('si lo nombró una repregunta, se usa la fila de la que salió', () => {
    let s = armarSecuencia(naza(), ANIO);
    ({ s } = hastaAntesDe(s, 'la-escuela'));
    const conEscuela = conNombrado({ ...s, nombrados: { 'la-escuela': 'la-cuadra-y-los-juegos' } }, proxima(s)!);
    const conRepregunta = conNombrado({ ...s, nombrados: { 'la-escuela': 'la-cuadra-y-los-juegos-repregunta' } }, proxima(s)!);
    expect(conRepregunta).toEqual(conEscuela);
  });
});

describe('descubrir (devolver filas cubiertas por error)', () => {
  it('vuelven al guion en su lugar, salen de los cubiertos de la secuencia y de la ficha, sin duplicar', () => {
    let s = armarSecuencia(naza(), ANIO);
    const orden = ids(s);
    const p = aplicarCambios(naza(), { cubiertos: ['a-los-quince', 'estudios', 'hermano-ariel', 'la-escuela'] });
    s = conCubiertosViejos(s, p.cubiertos);
    expect(ids(s)).not.toContain('estudios');
    const r = descubrir(s, p, ['a-los-quince', 'estudios', 'hermano-ariel'], ANIO);
    if ('error' in r) throw new Error(r.error);
    expect(ids(r.secuencia)).toEqual(orden.filter((id) => id !== 'la-escuela'));
    expect(r.secuencia.cubiertos).toEqual(['la-escuela']);
    expect(r.perfil.cubiertos).toEqual(['la-escuela']);
  });
  it('ajuste E: también saca una fila de los nombrados (y de la ficha)', () => {
    const s0 = armarSecuencia(naza(), ANIO);
    const p = aplicarCambios(naza(), { cubiertos: ['la-cuadra-y-los-juegos', 'estudios'] });
    const s = { ...s0, nombrados: { 'la-cuadra-y-los-juegos': 'la-escuela', estudios: 'a-los-quince' } };
    const r = descubrir(s, p, ['la-cuadra-y-los-juegos'], ANIO);
    if ('error' in r) throw new Error(r.error);
    expect(r.secuencia.nombrados).toEqual({ estudios: 'a-los-quince' });
    expect(r.perfil.cubiertos).toEqual(['estudios']);
    expect(ids(r.secuencia).filter((id) => id === 'la-cuadra-y-los-juegos')).toHaveLength(1);
  });
  it('una que ya estaba pendiente solo sale de la ficha; una que ya se hizo no vuelve', () => {
    let s = armarSecuencia(naza(), ANIO);
    const p = aplicarCambios(naza(), { cubiertos: ['los-tuyos-hoy-como-estan'] });
    s = aplicarCubiertos(s, p); // no es puerta: sigue pendiente, pero quedó en la ficha
    const r = descubrir(s, p, ['los-tuyos-hoy-como-estan'], ANIO);
    if ('error' in r) throw new Error(r.error);
    expect(ids(r.secuencia).filter((id) => id === 'los-tuyos-hoy-como-estan')).toHaveLength(1);
    expect(r.perfil.cubiertos).toEqual([]);
    const hecha = avanzar(s, proxima(s)!, 0);
    const h = descubrir(hecha, p, ['presentacion'], ANIO);
    expect('error' in h && h.error).toMatch(/ya se preguntó/);
  });
  it('un id que no existe frena todo, sin tocar nada', () => {
    const s = conCubiertosViejos(armarSecuencia(naza(), ANIO), ['estudios']);
    const r = descubrir(s, naza(), ['estudios', 'no-existe'], ANIO);
    expect('error' in r && r.error).toMatch(/no-existe/);
  });
  it('respeta el techo y nunca duplica', () => {
    const base = perfilVacio(); base.persona.edad = dicho('70');
    base.etapas.push({ edades: '0 a 70', lugar: 'Buenos Aires, Argentina', conQuien: '', queHacia: '', fuente: 'dicho' });
    const p = aplicarCambios(base, { agregarPersonas: [persona('Marta', 'marido'), persona('Ana', 'hija'), persona('Bruno', 'hijo'), persona('Cora', 'hijo'), persona('Dora', 'hermana'), persona('Emilio', 'hermano'), persona('Hugo', 'nieto')] });
    const cubiertos = ['abuelos-y-raices', 'la-escuela', 'estudios'];
    const pc = aplicarCambios(p, { cubiertos });
    const s = conCubiertosViejos(armarSecuencia(p, ANIO), cubiertos);
    const r = descubrir(s, pc, cubiertos, ANIO);
    if ('error' in r) throw new Error(r.error);
    expect(r.secuencia.pendientes.length - 1).toBeLessThanOrEqual(tope(70));
    expect(new Set(ids(r.secuencia)).size).toBe(ids(r.secuencia).length);
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
