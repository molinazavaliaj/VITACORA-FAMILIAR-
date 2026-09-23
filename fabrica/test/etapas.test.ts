import { describe, it, expect } from 'vitest';
import { parsearEtapas, capitulosDeEtapas, armarPromptRepartoEtapas, ubicarSueltas, type Etapa } from '../src/libro/etapas.js';
import { numerarRespuestas, materialRepartido } from '../src/libro/reparto.js';

// El libro por etapas de SU vida (decisión de Naza, 23/09): los capítulos dejan de ser los temas
// del guion (La infancia, El amor, El oficio…) y pasan a ser las etapas de esta persona, con
// nombres que salen de lo que contó, más uno final de reflexión. Con los temas, la vida adulta de
// alguien de 76 no tenía dónde caer.

const ETAPAS: Etapa[] = [
  { nombre: 'Tucumán', desde: 0, hasta: 18, deQueTrata: 'la casa de los abuelos' },
  { nombre: 'La pensión de Once', desde: 19, hasta: 26, deQueTrata: 'costurera en un taller' },
  { nombre: 'Rubén y el taller', desde: 27, hasta: 60, deQueTrata: 'casada, tres hijos, su taller' },
  { nombre: 'Lo que aprendí', desde: null, hasta: null, deQueTrata: 'lo que quiere dejar', reflexion: true },
];

describe('parsearEtapas', () => {
  it('lee las etapas, las ordena por edad y agrega la reflexión al final', () => {
    const r = parsearEtapas(JSON.stringify({
      etapas: [
        { nombre: 'La pensión de Once', desde: 19, hasta: 26, deQueTrata: 'x' },
        { nombre: 'Tucumán', desde: 0, hasta: 18, deQueTrata: 'y' },
      ],
      reflexion: { nombre: 'Coser es esperar', deQueTrata: 'lo que aprendió' },
    }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.etapas.map((e) => e.nombre)).toEqual(['Tucumán', 'La pensión de Once', 'Coser es esperar']);
    expect(r.etapas.at(-1)?.reflexion).toBe(true);
  });

  it('sin reflexión, la agrega con un nombre que sirve para cualquiera', () => {
    const r = parsearEtapas(JSON.stringify({ etapas: [{ nombre: 'A', desde: 0, hasta: 10, deQueTrata: '' }, { nombre: 'B', desde: 11, hasta: 30, deQueTrata: '' }] }));
    if (!r.ok) throw new Error('debería leer');
    expect(r.etapas.at(-1)).toMatchObject({ nombre: 'Lo que aprendí', reflexion: true });
  });

  it('con menos de dos etapas, o sin nombres, no sirve', () => {
    expect(parsearEtapas(JSON.stringify({ etapas: [{ nombre: 'Todo', desde: 0, hasta: 80 }] })).ok).toBe(false);
    expect(parsearEtapas(JSON.stringify({ etapas: [{ nombre: '', desde: 0 }, { nombre: 'B', desde: 5 }] })).ok).toBe(false);
    expect(parsearEtapas('no es json').ok).toBe(false);
  });
});

describe('capitulosDeEtapas', () => {
  it('cada respuesta arranca en la etapa de la época de su pregunta; los temas de toda la vida quedan sin capítulo', () => {
    const caps = capitulosDeEtapas(ETAPAS, [
      { orden: 1, capituloGuion: 'La infancia' },
      { orden: 8, capituloGuion: 'La juventud' },
      { orden: 13, capituloGuion: 'El amor' },
      { orden: 24, capituloGuion: 'La sabiduría' },
    ]);
    // La juventud (13-22, el medio es 17) de Élida fue en Tucumán: se fue a los 19.
    expect(caps.map((c) => c.ordenes)).toEqual([[1, 8], [], [], [24]]);
  });
});

describe('armarPromptRepartoEtapas', () => {
  it('muestra las etapas con sus edades y marca "sin capítulo" lo que tiene que ubicar el modelo', () => {
    const respuestas = numerarRespuestas([
      { orden: 1, pregunta: '¿Su casa?', texto: 'La casa de mis abuelos en Tucumán.' },
      { orden: 13, pregunta: '¿El amor?', texto: 'A Rubén lo conocí en el taller.' },
    ]);
    const caps = capitulosDeEtapas(ETAPAS, [{ orden: 1, capituloGuion: 'La infancia' }, { orden: 13, capituloGuion: 'El amor' }]);
    const p = armarPromptRepartoEtapas('Élida', respuestas, caps, ETAPAS);
    expect(p).toContain('1. Tucumán (de 0 a 18 años)');
    expect(p).toContain('4. Lo que aprendí');
    expect(p).toContain('[R1 · capítulo 1');
    expect(p).toContain('[R2 · sin capítulo');
  });
});

describe('ubicarSueltas', () => {
  // El reparto en etapas puede ubicar SOLO UNA PARTE de una respuesta "sin capítulo" (el amor,
  // el oficio…). Antes, la prueba mandaba la respuesta ENTERA a la reflexión: las oraciones ya
  // ubicadas quedaban dos veces en el libro, justo lo que el reparto vino a arreglar.
  const respuestas = numerarRespuestas([
    { orden: 1, pregunta: '¿Su casa?', texto: 'La casa de mis abuelos en Tucumán.' },
    { orden: 13, pregunta: '¿El amor?', texto: 'A Rubén lo conocí en el taller. Nos casamos a los 27. Hoy pienso que el amor es paciencia.' },
    { orden: 17, pregunta: '¿El oficio?', texto: 'Cosí toda la vida. Aprendí a los 14.' },
  ]);
  const caps = capitulosDeEtapas(ETAPAS, [{ orden: 1, capituloGuion: 'La infancia' }, { orden: 13, capituloGuion: 'El amor' }, { orden: 17, capituloGuion: 'El oficio' }]);

  it('lo que el modelo no ubicó va con el resto de su respuesta, y cada oración queda UNA vez', () => {
    const { movidas, sueltas } = ubicarSueltas(respuestas, caps, new Map([['R2.1', 3], ['R2.2', 3]]));
    expect(sueltas).toBe(3); // R2.3 y las dos de R3
    expect(movidas.get('R2.3')).toBe(3);
    const todo = materialRepartido(respuestas, caps, movidas).porCapitulo.join('\n');
    for (const r of respuestas) for (const o of r.oraciones) expect(todo.split(o).length - 1, o).toBe(1);
  });

  it('una respuesta que no ubicó para nada va al último capítulo (la reflexión)', () => {
    const { movidas } = ubicarSueltas(respuestas, caps, new Map());
    expect(movidas.get('R3.1')).toBe(ETAPAS.length);
    expect(movidas.get('R3.2')).toBe(ETAPAS.length);
    expect(materialRepartido(respuestas, caps, movidas).sinCapitulo).toEqual([]);
  });

  it('no toca lo que ya tiene capítulo propio ni lo que el modelo ubicó', () => {
    const { movidas, sueltas } = ubicarSueltas(respuestas, caps, new Map([['R2.1', 2], ['R2.2', 2], ['R2.3', 4], ['R3.1', 3], ['R3.2', 3]]));
    expect(sueltas).toBe(0);
    expect(movidas.get('R2.3')).toBe(4);
    expect(movidas.has('R1.1')).toBe(false);
  });
});
