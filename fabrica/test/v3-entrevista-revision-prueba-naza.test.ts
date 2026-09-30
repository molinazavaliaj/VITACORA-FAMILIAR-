// Revisión de la tanda de la prueba de Naza (30/09): bugs dentro de lo que
// Naza aprobó (sin textos nuevos). AMH en audio se lee como "¿hoy hay alguien
// a tu lado?"; el olvido compara palabras completas de contenido.

import { describe, expect, it } from 'vitest';
import { preguntaPorId } from '../src/v3/entrevista/banco.js';
import { mensajesDespues } from '../src/v3/entrevista/flujo.js';
import { interpretar } from '../src/v3/entrevista/respuesta.js';
import { simularRecorrido } from '../src/v3/entrevista/seleccion.js';

const p = (id: string) => preguntaPorId(id)!;
const que = (id: string, r: string) => interpretar(p(id), r);

describe('AMH en audio: "¿hoy hay alguien a tu lado?"', () => {
  it.each([
    'No, seguimos juntos',
    'No, sigue conmigo',
    'Nos separamos un tiempo pero volvimos',
    'Terminamos, pero hace poco volvimos',
    'Ya no vivimos juntos, seguimos casados',
    'Ya no trabajamos pero seguimos juntos',
    'Ya no, pero volvimos a empezar',
    'No, estoy con otra persona, Hugo',
    'No, ahora estoy con otra persona, Hugo',
    'Sí, aunque ya no vivimos juntos, seguimos',
  ])('"%s" → sigue (sí)', (r) => {
    expect(que('AMH', r)).toBe('conto');
  });

  it.each([
    'Mi marido falleció hace dos años',
    'Se murió mi marido',
    'Quedé viuda',
    'Él falleció',
    'Lamentablemente ya no está',
    'Falleció él',
    'No, ya no, falleció hace dos años',
    'Ya no, nos separamos en el 95',
    'Nos divorciamos hace mucho',
    'No.',
    'Ya no.',
  ])('"%s" → ya no está (no)', (r) => {
    expect(que('AMH', r)).toBe('no');
  });

  it('ante la duda, sigue', () => {
    expect(que('AMH', 'Bueno, es complicado, te cuento.')).toBe('conto');
  });
});

describe('AMH en audio, en el recorrido', () => {
  const ficha = { nombre: 'Elsa', genero: 'mujer' as const };
  const bloque6 = (amh: string, aceptaExtra = false) =>
    simularRecorrido(ficha, (id) => (id === 'AMH' ? amh : undefined), { aceptaExtra }).flatMap((x) => (x.tipo === 'pregunta' && x.pregunta.bloque === 6 ? [x.pregunta] : []));

  it('"No, seguimos juntos": sin AM9 ni AM19', () => {
    const ids = bloque6('No, seguimos juntos').map((q) => q.id);
    expect(ids).not.toContain('AM9');
    expect(ids).not.toContain('AM19');
  });

  it('"Mi marido falleció hace dos años": con AM9 y AM19, y AM7 en pasado', () => {
    const qs = bloque6('Mi marido falleció hace dos años', true);
    const ids = qs.map((q) => q.id);
    expect(ids).toContain('AM9');
    expect(ids).toContain('AM19');
    expect(qs.find((q) => q.id === 'AM7')!.texto).toContain('una frase que repetía,');
  });

  it('"No, ahora estoy con otra persona, Hugo": AM1 va por la de ahora y sin AM9', () => {
    const ids = bloque6('No, ahora estoy con otra persona, Hugo').map((q) => q.id);
    expect(ids).toContain('AM1');
    expect(ids).not.toContain('AM9');
  });
});

describe('olvido: palabras completas de contenido', () => {
  it('CA3 "No me acuerdo, trabajaba de albañil…": olvido a medias (M28.4)', () => {
    const r = 'No me acuerdo, trabajaba de albañil en obras cuando era chico y lo acompañé';
    expect(que('CA3', r)).toBe('olvido-a-medias');
    expect(mensajesDespues(p('CA3'), r)).toEqual(['M28.4']);
  });

  it('AM1 "No me acuerdo bien el día que nos conocimos, dónde fue, quién nos presentó": olvido', () => {
    expect(que('AM1', 'No me acuerdo bien el día que nos conocimos, dónde fue, quién nos presentó')).toBe('olvido');
  });

  it('el caso de Naza en ES2 sigue siendo olvido', () => {
    expect(que('ES2', 'No recuerdo, la verdad, algún maestro o maestra que me haya marcado en la primaria.')).toBe('olvido');
  });
});
