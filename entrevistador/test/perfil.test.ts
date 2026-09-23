import { describe, it, expect } from 'vitest';
import { perfilVacio, aplicarCambios, parsearCambios, armarPromptPerfil, type Perfil } from '../src/ia/perfil.js';

// El perfil (biógrafo v2, 23/09): quién es la persona y la línea de tiempo de su vida, armado
// con lo que CUENTA aunque la familia no cargue nada. Pedido de Naza: "es importante que el
// biógrafo entienda el avatar para no errar con quién habla o qué edad tiene; en el caso de que
// el familiar no cargue contexto tiene que saber igual darse cuenta". Lo que no se sabe queda
// dicho como no sabido: suponer es lo que produjo el usted a un pibe de 28 (hallazgo 1), la
// pareja mujer sin saberlo (C12) y la abuela dada por muerta (C2).
//
// El modelo devuelve SOLO lo que cambió y el código lo aplica: reescribir la ficha entera en cada
// respuesta costaba ~USD 2 por libro, y un error del modelo podía borrar lo que ya se sabía.

function base(): Perfil {
  const p = perfilVacio();
  p.persona.comoHabla = { valor: 'vos', fuente: 'deducido', por: 'dice "mirá", "boludo"' };
  p.etapas = [{ edades: '0 a 12', lugar: 'Concordia', conQuien: 'la madre y la abuela', queHacia: 'la escuela', fuente: 'dicho' }];
  p.personas = [{ nombre: 'Estela', vinculo: 'abuela', vive: 'no se sabe', fuente: 'dicho' }];
  p.noSabemos = ['Edad', 'Si la abuela vive'];
  return p;
}

describe('perfilVacio', () => {
  it('arranca sin suponer nada: todo "no se sabe"', () => {
    const p = perfilVacio();
    expect(p.persona.anioNacimiento).toBeNull();
    expect(p.persona.genero).toBeNull();
    expect(p.persona.comoHabla).toBeNull();
    expect(p.etapas).toEqual([]);
    expect(p.personas).toEqual([]);
  });
});

describe('aplicarCambios', () => {
  it('suma una etapa y corrige una persona por su número', () => {
    const p = aplicarCambios(base(), {
      agregarEtapas: [{ edades: 'desde los 12', lugar: 'Buenos Aires (Núñez)', conQuien: 'el padre', queHacia: '', fuente: 'dicho' }],
      corregirPersonas: [{ i: 0, vive: 'si', nota: '"está viva todavía, no me la mates"' }],
      resueltos: ['Si la abuela vive'],
    });
    expect(p.etapas.map((e) => e.lugar)).toEqual(['Concordia', 'Buenos Aires (Núñez)']);
    expect(p.personas[0]).toMatchObject({ nombre: 'Estela', vive: 'si' });
    expect(p.noSabemos).toEqual(['Edad']);
  });

  it('un dato de la persona se actualiza; un null NO borra lo que ya se sabía', () => {
    const p = aplicarCambios(base(), { persona: { edad: { valor: '28', fuente: 'dicho' }, comoHabla: null } });
    expect(p.persona.edad?.valor).toBe('28');
    expect(p.persona.comoHabla?.valor).toBe('vos');
  });

  it('lo mal armado se ignora: índices que no existen, "vive" dudoso, tipos raros', () => {
    const p = aplicarCambios(base(), {
      corregirPersonas: [{ i: 7, vive: 'no' }, { i: 0, vive: 'probablemente' as never }],
      agregarPersonas: [{ nombre: 'Aldo', vinculo: 'padre', vive: 'quizás' as never, fuente: 'dicho' }],
      agregarEtapas: 'no es una lista' as never,
    });
    expect(p.personas[0].vive).toBe('no se sabe');
    expect(p.personas[1]).toMatchObject({ nombre: 'Aldo', vive: 'no se sabe' });
    expect(p.etapas).toHaveLength(1);
  });

  it('no duplica bisagras ni cosas por preguntar', () => {
    const p = aplicarCambios(base(), { agregarBisagras: ['A los 12 se fue a Buenos Aires', 'A los 12 se fue a Buenos Aires'], agregarNoSabemos: ['Edad', 'Dónde vive hoy'] });
    expect(p.bisagras).toEqual(['A los 12 se fue a Buenos Aires']);
    expect(p.noSabemos).toEqual(['Edad', 'Si la abuela vive', 'Dónde vive hoy']);
  });

  it('el tono se reemplaza solo si viene con algo', () => {
    const conTono = aplicarCambios(base(), { tono: 'Infancia dura, padre ausente.' });
    expect(conTono.tono).toBe('Infancia dura, padre ausente.');
    expect(aplicarCambios(conTono, { tono: '' }).tono).toBe('Infancia dura, padre ausente.');
  });
});

describe('parsearCambios', () => {
  it('lee los cambios aunque vengan envueltos en ```json', () => {
    const r = parsearCambios('```json\n{"agregarBisagras":["A los 12 se fue"]}\n```', base());
    expect(r.ok).toBe(true);
    expect(r.perfil.bisagras).toEqual(['A los 12 se fue']);
  });

  it('"sin cambios" (objeto vacío) deja el perfil igual', () => {
    const r = parsearCambios('{}', base());
    expect(r).toEqual({ ok: true, perfil: base() });
  });

  it('si viene roto, conserva el perfil anterior: nunca se pierde lo que ya se sabía', () => {
    const anterior = base();
    const r = parsearCambios('no es json', anterior);
    expect(r.ok).toBe(false);
    expect(r.perfil).toBe(anterior);
  });
});

describe('armarPromptPerfil', () => {
  it('lleva la ficha numerada, la ficha de la familia (o que no hay), la pregunta y la respuesta', () => {
    const prompt = armarPromptPerfil(base(), null, '¿Cómo eran los domingos?', 'Una mierda, amigo.');
    expect(prompt).toContain('"Estela"');
    expect(prompt).toContain('La familia no cargó nada');
    expect(prompt).toContain('¿Cómo eran los domingos?');
    expect(prompt).toContain('Una mierda, amigo.');
    expect(prompt).toContain('SOLO LO QUE CAMBIÓ');
  });
});
