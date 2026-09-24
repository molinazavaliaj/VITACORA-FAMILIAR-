import { describe, it, expect } from 'vitest';
import { perfilVacio, perfilDesdeFicha, aplicarCambios, parsearCambios, armarPromptPerfil, actualizarPerfil, type Perfil } from '../src/ia/perfil.js';

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
    expect(p.persona.comoLeDicen).toBeNull();
    expect(p.etapas).toEqual([]);
    expect(p.personas).toEqual([]);
    expect(p.castellano).toBe('rioplatense');
    expect(p.cubiertos).toEqual([]);
    expect(p.puertaAbierta).toBeNull();
    expect(p.hoyFueFuerte).toBe(false);
  });
});

describe('perfilDesdeFicha (la ficha de la compra siembra el perfil el día 0)', () => {
  it('toma año de nacimiento, estado civil, árbol, dónde vive, oficio y lugar, todo con fuente ficha', () => {
    const p = perfilDesdeFicha({
      anioNacimiento: 1950, estadoCivil: 'viuda', dondeVive: 'Lanús', oficio: 'costurera', lugarNacimiento: 'Tucumán',
      arbol: { hijos: 'no tuvo', padres: 'Ramón y Haydée' }, trato: 'usted',
    }, 'America/Argentina/Buenos_Aires');
    expect(p.persona.anioNacimiento).toEqual({ valor: '1950', fuente: 'ficha' });
    expect(p.persona.dondeViveHoy?.valor).toBe('Lanús');
    expect(p.persona.comoHabla).toEqual({ valor: 'usted', fuente: 'ficha' });
    expect(p.castellano).toBe('rioplatense');
    expect(p.personas.find((x) => x.vinculo === 'padres')?.nombre).toBe('Ramón y Haydée');
    expect(p.noSabemos).toContain('Si tuvo pareja (la ficha dice viuda: preguntar quién era)');
    expect(p.bisagras).toEqual([]);
  });

  it('hijos "no tuvo" queda dicho por la familia, no como persona', () => {
    const p = perfilDesdeFicha({ arbol: { hijos: 'no tuvo' } });
    expect(p.personas).toEqual([]);
    expect(p.tono).toBe('');
    expect(p.noSabemos).not.toContain('Si tiene hijos');
    expect(JSON.stringify(p)).toContain('no tuvo hijos');
  });

  it('con la ficha vacía es el perfil vacío, con el castellano de la zona', () => {
    const p = perfilDesdeFicha({}, 'Europe/Madrid');
    expect(p.persona.edad).toBeNull();
    expect(p.castellano).toBe('españa');
    expect(p.noSabemos).toEqual(['Edad', 'Cómo prefiere que le hablen', 'Cómo le dicen']);
  });

  it('un narrador de vos en Europe/Madrid es rioplatense (el trato manda)', () => {
    expect(perfilDesdeFicha({ trato: 'vos' }, 'Europe/Madrid').castellano).toBe('rioplatense');
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

describe('aplicarCambios, lo nuevo', () => {
  it('un dato dicho por la persona no lo pisa una deducción posterior; otro dicho sí', () => {
    const p = base();
    p.persona.edad = { valor: '28', fuente: 'dicho' };
    const deducido = aplicarCambios(p, { persona: { edad: { valor: '35', fuente: 'deducido', por: 'x' } } });
    expect(deducido.persona.edad?.valor).toBe('28');
    const dicho = aplicarCambios(p, { persona: { edad: { valor: '29', fuente: 'dicho' } } });
    expect(dicho.persona.edad?.valor).toBe('29');
  });

  it('cubiertos se acumulan sin repetir; puertaAbierta y hoyFueFuerte son de hoy, no se arrastran', () => {
    const uno = aplicarCambios(base(), { cubiertos: ['amigos', 'amigos'], puertaAbierta: 'pruebas', hoyFueFuerte: true });
    expect(uno.cubiertos).toEqual(['amigos']);
    expect(uno.puertaAbierta).toBe('pruebas');
    expect(uno.hoyFueFuerte).toBe(true);
    const dos = aplicarCambios(uno, { cubiertos: ['padres'] });
    expect(dos.cubiertos).toEqual(['amigos', 'padres']);
    expect(dos.puertaAbierta).toBeNull();
    expect(dos.hoyFueFuerte).toBe(false);
  });

  it('una puerta abierta que no es un tema conocido se ignora', () => {
    const p = aplicarCambios(base(), { puertaAbierta: 42 as never });
    expect(p.puertaAbierta).toBeNull();
  });

  it('comoLeDicen dicho por la persona se guarda (la presentación lo pregunta y solo actualizarPerfil lo procesa)', () => {
    const p = aplicarCambios(base(), { persona: { comoLeDicen: { valor: 'Pocho', fuente: 'dicho' } } });
    expect(p.persona.comoLeDicen).toEqual({ valor: 'Pocho', fuente: 'dicho' });
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
  it('lleva la ficha numerada, la pregunta y la respuesta', () => {
    const prompt = armarPromptPerfil(base(), '¿Cómo eran los domingos?', 'Una mierda, amigo.', []);
    expect(prompt).toContain('"Estela"');
    expect(prompt).toContain('¿Cómo eran los domingos?');
    expect(prompt).toContain('Una mierda, amigo.');
    expect(prompt).toContain('SOLO LO QUE CAMBIÓ');
  });

  it('pide las bisagras con la edad adelante ("A los N…"): es lo único que el reparto de preguntas sabe ubicar en un tramo', () => {
    const prompt = armarPromptPerfil(base(), '¿?', '…', []);
    expect(prompt).toMatch(/bisagras[\s\S]*empiezan con la edad/);
    expect(prompt).toContain('"agregarBisagras":["A los 12');
  });
});

describe('armarPromptPerfil, lo nuevo', () => {
  it('pide la edad en cifras, corregir por número, y devuelve cubiertos / puerta abierta / hoy fue fuerte con la lista de pendientes', () => {
    const prompt = armarPromptPerfil(base(), '¿Sus hermanos?', 'Éramos cinco.', [{ id: 'con-quien-crecio', tema: 'las personas con las que creció' }]);
    expect(prompt).toMatch(/edad[\s\S]*en cifras/i);
    expect(prompt).toContain('"cubiertos"');
    expect(prompt).toContain('"puertaAbierta"');
    expect(prompt).toContain('"hoyFueFuerte"');
    expect(prompt).toContain('con-quien-crecio');
    expect(prompt).not.toContain('LO QUE CARGÓ LA FAMILIA');
  });

  it('pide comoLeDicen en la ficha de salida (la presentación lo pregunta y solo actualizarPerfil lo procesa)', () => {
    const prompt = armarPromptPerfil(base(), '¿Cómo le dicen en casa?', 'Pocho, de toda la vida.', []);
    expect(prompt).toContain('comoLeDicen');
  });
});

describe('actualizarPerfil', () => {
  // Piloto de Naza, N6: con 2000 tokens una respuesta con familia entera cortaba el JSON y el
  // perfil no aprendía nada ("salida ilegible"), dos veces seguidas.
  it('pide 8000 tokens: con 2000 el JSON de una respuesta rica no entraba', async () => {
    let pedido: { max_tokens?: number } = {};
    const cliente = {
      messages: {
        create: async (p: { max_tokens: number }) => {
          pedido = p;
          return { content: [{ type: 'text', text: '{}' }], usage: { input_tokens: 1, output_tokens: 1 } };
        },
      },
    } as unknown as Parameters<typeof actualizarPerfil>[0];
    const r = await actualizarPerfil(cliente, perfilVacio(), 'pregunta', 'respuesta', []);
    expect(r.ok).toBe(true);
    expect(pedido.max_tokens).toBe(8000);
  });
});
