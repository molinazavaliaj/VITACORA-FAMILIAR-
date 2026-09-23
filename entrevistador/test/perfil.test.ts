import { describe, it, expect } from 'vitest';
import { perfilVacio, parsearPerfil, armarPromptPerfil, type Perfil } from '../src/ia/perfil.js';

// El perfil (biógrafo v2, 23/09): quién es la persona y la línea de tiempo de su vida, armado
// con lo que CUENTA aunque la familia no cargue nada. Pedido de Naza: "es importante que el
// biógrafo entienda el avatar para no errar con quién habla o qué edad tiene; en el caso de que
// el familiar no cargue contexto tiene que saber igual darse cuenta". Lo que no se sabe queda
// dicho como no sabido: suponer es lo que produjo el usted a un pibe de 28 (hallazgo 1), la
// pareja mujer sin saberlo (C12) y la abuela dada por muerta (C2).

const UNO: Perfil = {
  ...perfilVacio(),
  persona: {
    ...perfilVacio().persona,
    comoHabla: { valor: 'vos', fuente: 'deducido', por: 'dice "vos sabés", "boludo"' },
  },
  personas: [{ nombre: 'Estela', vinculo: 'abuela', vive: 'si', fuente: 'dicho', nota: '"está viva todavía"' }],
};

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

describe('parsearPerfil', () => {
  it('lee el JSON aunque venga envuelto en ```json', () => {
    const r = parsearPerfil('```json\n' + JSON.stringify(UNO) + '\n```', perfilVacio());
    expect(r.ok).toBe(true);
    expect(r.perfil.personas[0].nombre).toBe('Estela');
  });

  it('si viene roto, conserva el perfil anterior: nunca se pierde lo que ya se sabía', () => {
    const r = parsearPerfil('no es json', UNO);
    expect(r.ok).toBe(false);
    expect(r.perfil).toBe(UNO);
  });

  it('si le falta una parte, la completa con la anterior en vez de borrarla', () => {
    const { personas, ...sinPersonas } = UNO;
    const r = parsearPerfil(JSON.stringify(sinPersonas), UNO);
    expect(r.perfil.personas).toEqual(UNO.personas);
  });

  it('un "vive" que no es si/no se vuelve "no se sabe": ante la duda, no se da por vivo ni por muerto', () => {
    const raro = { ...UNO, personas: [{ ...UNO.personas[0], vive: 'probablemente' }] };
    expect(parsearPerfil(JSON.stringify(raro), perfilVacio()).perfil.personas[0].vive).toBe('no se sabe');
  });
});

describe('armarPromptPerfil', () => {
  it('lleva el perfil actual, la ficha (o que no hay), la pregunta y la respuesta', () => {
    const prompt = armarPromptPerfil(UNO, null, '¿Cómo eran los domingos?', 'Una mierda, amigo.');
    expect(prompt).toContain('"Estela"');
    expect(prompt).toContain('La familia no cargó nada');
    expect(prompt).toContain('¿Cómo eran los domingos?');
    expect(prompt).toContain('Una mierda, amigo.');
  });
});
