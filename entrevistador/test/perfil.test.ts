import { describe, it, expect } from 'vitest';
import { perfilVacio, perfilDesdeFicha, aplicarCambios, parsearCambios, armarPromptPerfil, actualizarPerfil, recortarPerfil, TOPES, perfilEnTexto, type Perfil } from '../src/ia/perfil.js';
import { perfilEnTexto as perfilEnTextoDesdeEncargo } from '../src/ia/encargo-entrevista.js';

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

  it('hijos "no tuvo" queda en noTuvo, no como persona', () => {
    const p = perfilDesdeFicha({ arbol: { hijos: 'no tuvo' } });
    expect(p.personas).toEqual([]);
    expect(p.tono).toBe('');
    expect(p.noSabemos).not.toContain('Si tiene hijos');
    expect(p.noTuvo).toEqual(['hijos']);
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

  it('cubiertos se acumulan sin repetir; hoyFueFuerte es de hoy, no se arrastra', () => {
    const uno = aplicarCambios(base(), { cubiertos: ['amigos', 'amigos'], puertaAbierta: 'pruebas', hoyFueFuerte: true });
    expect(uno.cubiertos).toEqual(['amigos']);
    expect(uno.hoyFueFuerte).toBe(true);
    const dos = aplicarCambios(uno, { cubiertos: ['padres'] });
    expect(dos.cubiertos).toEqual(['amigos', 'padres']);
    expect(dos.hoyFueFuerte).toBe(false);
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
  it('pide 8000 tokens (arreglo final I2: el max_tokens que no se usa no se cobra, y una ficha cortada se perdía)', async () => {
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
  const cortado = (content: unknown[], stop_reason: string) => ({
    messages: { create: async () => ({ content, stop_reason, usage: { input_tokens: 1, output_tokens: 1 } }) },
  } as unknown as Parameters<typeof actualizarPerfil>[0]);
  it('con stop_reason max_tokens tira un error claro en vez de descartar la ficha en silencio (I2)', async () => {
    await expect(actualizarPerfil(cortado([{ type: 'text', text: '{"agregarEtapas":[{"edades":"0 a' }], 'max_tokens'), perfilVacio(), 'p', 'r', []))
      .rejects.toThrow(/la respuesta del modelo se cortó/);
  });
  it('sin bloque de texto tira (I2)', async () => {
    await expect(actualizarPerfil(cortado([], 'end_turn'), perfilVacio(), 'p', 'r', [])).rejects.toThrow(/la respuesta del modelo se cortó/);
  });
});

describe('la ficha con topes (esqueleto v2: el perfil del piloto llegó a 12.700 tokens)', () => {
  const largo = (n: number, sep = '. ') => Array.from({ length: n }, (_, i) => `Oración número ${i} de la etapa`).join(sep) + '.';
  it('recorta cada campo de una etapa a 300 caracteres cortando en una oración entera', () => {
    const p = perfilVacio();
    p.etapas.push({ edades: '0 a 12', lugar: 'Martínez', conQuien: 'sus padres', queHacia: largo(40), fuente: 'dicho' });
    const r = recortarPerfil(p);
    expect(r.etapas[0].queHacia.length).toBeLessThanOrEqual(TOPES.etapaCampo);
    expect(r.etapas[0].queHacia.endsWith('.')).toBe(true);
    expect(recortarPerfil(r)).toEqual(r);
  });
  it('bisagras: ≤ 150 caracteres cada una y ≤ 12 en total (se quedan las que tienen edad, después las más nuevas)', () => {
    const p = perfilVacio();
    p.bisagras = [...Array.from({ length: 10 }, (_, i) => `A los ${i + 5} pasó la cosa ${i}`), 'Se fue a España sin decir cuándo', 'Dejó la facultad', 'Volvió al Fátima ' + largo(6, ', ')];
    const r = recortarPerfil(p);
    expect(r.bisagras).toHaveLength(TOPES.bisagras);
    expect(r.bisagras.filter((b) => /^A los/.test(b))).toHaveLength(10);
    expect(r.bisagras.every((b) => b.length <= TOPES.bisagra)).toBe(true);
  });
  it('bisagras: con más de 12 CON edad, se quedan las 12 con edad más nuevas y ninguna sin edad (fix ronda 1)', () => {
    const p = perfilVacio();
    p.bisagras = [...Array.from({ length: 15 }, (_, i) => `A los ${i + 5} pasó la cosa ${i}`), 'Se fue a España sin decir cuándo', 'Dejó la facultad'];
    const r = recortarPerfil(p);
    expect(r.bisagras).toHaveLength(TOPES.bisagras);
    expect(r.bisagras.every((b) => /^A los/.test(b))).toBe(true);
    expect(r.bisagras).toEqual(Array.from({ length: 12 }, (_, i) => `A los ${i + 8} pasó la cosa ${i + 3}`));
  });
  it('personas: la nota a 80 caracteres, y de más de 30 se quedan primero los familiares', () => {
    const p = perfilVacio();
    p.personas.push({ nombre: 'Ariel', vinculo: 'hermano mayor', vive: 'si', fuente: 'dicho', nota: largo(5) });
    for (let i = 0; i < 32; i++) p.personas.push({ nombre: `Amigo ${i}`, vinculo: 'amigo del colegio', vive: 'no se sabe', fuente: 'dicho' });
    p.personas.push({ nombre: 'Meri', vinculo: 'madre', vive: 'si', fuente: 'dicho' });
    const r = recortarPerfil(p);
    expect(r.personas).toHaveLength(TOPES.personas);
    expect(r.personas[0].nota!.length).toBeLessThanOrEqual(TOPES.notaPersona);
    expect(r.personas.map((x) => x.nombre)).toEqual(expect.arrayContaining(['Ariel', 'Meri']));
  });
  it('noSabemos: se quedan los 12 más nuevos; el tono a 300', () => {
    const p = perfilVacio();
    p.noSabemos = Array.from({ length: 20 }, (_, i) => `[infancia] cosa ${i}`);
    p.tono = largo(12);
    const r = recortarPerfil(p);
    expect(r.noSabemos).toHaveLength(TOPES.noSabemos);
    expect(r.noSabemos[0]).toBe('[infancia] cosa 8');
    expect(r.tono.length).toBeLessThanOrEqual(TOPES.tono);
  });
  it('aplicarCambios recorta siempre: una etapa gigante no entra entera', () => {
    const p = aplicarCambios(perfilVacio(), { agregarEtapas: [{ edades: '0 a 12', lugar: largo(30), conQuien: '', queHacia: '', fuente: 'dicho' }] });
    expect(p.etapas[0].lugar.length).toBeLessThanOrEqual(TOPES.etapaCampo);
  });
});

describe('el presupuesto total de la ficha (fix ronda 1: los topes por campo solos no alcanzan)', () => {
  const largo = (n: number, sep = '. ') => Array.from({ length: n }, (_, i) => `Oración número ${i} de la etapa`).join(sep) + '.';
  const notaLarga = (n: number) => Array.from({ length: n }, (_, i) => `dato ${i}`).join(', ');

  // El brief describe "15 etapas de 3×220": ni con el paso h de la ronda 2 (queHacia y conQuien a
  // 60, la última etapa siempre exenta) entran 15 etapas al tope en el presupuesto — el máximo que
  // entra con esta ficha (30 personas, 10 familiares; 12 bisagras; 12 noSabemos; tono 300) es 9 (con
  // 10 ya no entra: 5.852 > 5.750). Ver "Desvíos / notas para Naza" del reporte.
  function fichaEnorme(): Perfil {
    const p = perfilVacio();
    p.persona.edad = { valor: '60', fuente: 'dicho' };
    p.etapas = Array.from({ length: 9 }, (_, i) => ({
      edades: `${i * 5} a ${i * 5 + 5}`,
      lugar: largo(30),
      conQuien: largo(30),
      queHacia: largo(30),
      fuente: 'dicho' as const,
    }));
    p.personas = [
      ...Array.from({ length: 10 }, (_, i) => ({ nombre: `Familiar ${i}`, vinculo: 'hermano', vive: 'si' as const, fuente: 'dicho' as const, nota: notaLarga(20) })),
      ...Array.from({ length: 20 }, (_, i) => ({ nombre: `Amigo ${i}`, vinculo: 'amigo del colegio', vive: 'no se sabe' as const, fuente: 'dicho' as const, nota: notaLarga(20) })),
    ];
    p.bisagras = Array.from({ length: 12 }, (_, i) => `A los ${i + 5} pasó la cosa ${i} ${largo(6, ', ')}`);
    p.noSabemos = Array.from({ length: 12 }, (_, i) => `[infancia] cosa larga número ${i} ${largo(3, ', ')}`);
    p.tono = largo(12);
    return p;
  }

  it('una ficha sintética enorme entra en el presupuesto, conserva a los 10 familiares y a la persona intacta, y es idempotente', () => {
    const p = fichaEnorme();
    const r = recortarPerfil(p);
    expect(perfilEnTexto(r).length).toBeLessThanOrEqual(TOPES.fichaCaracteres);
    expect(r.personas.filter((x) => x.vinculo === 'hermano')).toHaveLength(10);
    expect(r.persona.edad?.valor).toBe('60');
    expect(recortarPerfil(r)).toEqual(r);
  });

  it('el orden: una ficha apenas pasada del presupuesto por notas de no familiares pierde alguna de esas notas primero y conserva todas las personas y todos los noSabemos', () => {
    const p = perfilVacio();
    p.persona.edad = { valor: '50', fuente: 'dicho' };
    p.etapas = Array.from({ length: 3 }, (_, i) => ({ edades: `${i * 5} a ${i * 5 + 5}`, lugar: largo(30), conQuien: largo(30), queHacia: largo(30), fuente: 'dicho' as const }));
    p.personas = [
      { nombre: 'Meri', vinculo: 'madre', vive: 'si', fuente: 'dicho' },
      ...Array.from({ length: 28 }, (_, i) => ({ nombre: `Amigo ${i}`, vinculo: 'amigo del colegio', vive: 'no se sabe' as const, fuente: 'dicho' as const, nota: notaLarga(19) })),
    ];
    p.noSabemos = Array.from({ length: 10 }, (_, i) => `[infancia] cosa ${i}`);
    const r = recortarPerfil(p);
    expect(perfilEnTexto(r).length).toBeLessThanOrEqual(TOPES.fichaCaracteres);
    // el punto de partida (solo con los topes por campo) pasaba el presupuesto: hizo falta podar.
    expect(perfilEnTexto(p).length).toBeGreaterThan(TOPES.fichaCaracteres);
    expect(r.personas).toHaveLength(p.personas.length);
    expect(r.noSabemos).toHaveLength(p.noSabemos.length);
    // se llegó al presupuesto sacando notas de no familiares, no sacando personas ni etapas enteras.
    expect(r.personas.filter((x) => x.nota).length).toBeLessThan(p.personas.filter((x) => x.nota).length);
    expect(r.personas.find((x) => x.vinculo === 'madre')?.nota).toBeUndefined();
  });

  it('una ficha chica no cambia por el presupuesto: queda igual que solo con los topes por campo', () => {
    const p = base();
    const r = recortarPerfil(p);
    expect(perfilEnTexto(r).length).toBeLessThanOrEqual(TOPES.fichaCaracteres);
    expect(r.etapas).toEqual(p.etapas);
    expect(r.personas).toEqual(p.personas);
  });

  it('el paso h (fix ronda 2) solo corre si hace falta después del f: una ficha que ya entra con d+e+f deja queHacia en 120, no en 60', () => {
    const p = perfilVacio();
    p.persona.edad = { valor: '55', fuente: 'dicho' };
    p.etapas = Array.from({ length: 8 }, (_, i) => ({ edades: `${i * 5} a ${i * 5 + 5}`, lugar: largo(30), conQuien: largo(30), queHacia: largo(30), fuente: 'dicho' as const }));
    p.personas = Array.from({ length: 5 }, (_, i) => ({ nombre: `Familiar ${i}`, vinculo: 'hermano', vive: 'si' as const, fuente: 'dicho' as const, nota: notaLarga(20) }));
    p.bisagras = Array.from({ length: 6 }, (_, i) => `A los ${i + 5} pasó la cosa ${i}`);
    p.noSabemos = Array.from({ length: 6 }, (_, i) => `[infancia] cosa ${i}`);
    const r = recortarPerfil(p);
    expect(perfilEnTexto(r).length).toBeLessThanOrEqual(TOPES.fichaCaracteres);
    // hizo falta podar (el punto de partida, solo con los topes por campo, no entraba):
    expect(perfilEnTexto(p).length).toBeGreaterThan(TOPES.fichaCaracteres);
    // con d (más e y f) ya alcanzó el presupuesto ("se corta apenas entra"): el h nunca corrió,
    // así que ningún queHacia (salvo la última etapa, que nunca se toca) bajó de 120 hasta 60.
    expect(r.etapas.slice(0, -1).every((e) => e.queHacia.length > 60)).toBe(true);
    expect(r.etapas.slice(0, -1).some((e) => e.queHacia.length <= 120)).toBe(true);
  });

  it('perfilEnTexto es la misma función, importada desde perfil.js o desde encargo-entrevista.js', () => {
    expect(perfilEnTextoDesdeEncargo).toBe(perfilEnTexto);
  });
});

describe('noTuvo y corregir bisagras (esqueleto v2)', () => {
  it('la ficha "no tuvo hijos" queda en noTuvo (y ya no como texto en noSabemos)', () => {
    const p = perfilDesdeFicha({ arbol: { hijos: 'no tuvo', conyuge: 'Rubén' } }, 'America/Argentina/Buenos_Aires');
    expect(p.noTuvo).toEqual(['hijos']);
    expect(p.noSabemos.some((n) => /no tuvo/.test(n))).toBe(false);
    expect(p.personas[0]).toMatchObject({ nombre: 'Rubén', vinculo: 'conyuge' });
  });
  it('el modelo suma noTuvo sin repetir y solo con vínculos conocidos', () => {
    const p = aplicarCambios(perfilVacio(), { noTuvo: ['pareja', 'pareja', 'mascotas' as never, 'nietos'] });
    expect(p.noTuvo).toEqual(['pareja', 'nietos']);
  });
  it('corregirBisagras pisa la fila por su número (N34, N40: antes quedaban las dos)', () => {
    const base = aplicarCambios(perfilVacio(), { agregarBisagras: ['A los 18 se fue a vivir solo', 'A los 22 se fue a España'] });
    const p = aplicarCambios(base, { corregirBisagras: [{ i: 0, texto: 'A los 22 se mudó por primera vez, con Ciano, a Nordelta' }, { i: 9, texto: 'no existe' }] });
    expect(p.bisagras).toEqual(['A los 22 se mudó por primera vez, con Ciano, a Nordelta', 'A los 22 se fue a España']);
  });
  it('una bisagra nueva con la misma edad y las mismas palabras clave reemplaza a la vieja en vez de sumarse', () => {
    const base = aplicarCambios(perfilVacio(), { agregarBisagras: ['A los 8 pasó del Saint John\'s al Fátima porque la familia se vino a menos'] });
    const p = aplicarCambios(base, { agregarBisagras: ['A los 8 pasó del Saint John\'s al Fátima: le dijeron que era por las materias'] });
    expect(p.bisagras).toHaveLength(1);
    expect(p.bisagras[0]).toMatch(/materias/);
  });
  it('el prompt pide etapas cortas, una bisagra por vuelta de vida, corregirBisagras, noTuvo, noSabemos con la etapa entre corchetes, y ya no pide puertaAbierta', () => {
    const prompt = armarPromptPerfil(perfilVacio(), 'P', 'R', [{ id: 'padres-como-eran', tema: 'Cómo eran' }]);
    expect(prompt).toMatch(/dos oraciones/i);
    expect(prompt).toMatch(/vuelta de vida/i);
    expect(prompt).toContain('"corregirBisagras"');
    expect(prompt).toContain('"noTuvo"');
    expect(prompt).toMatch(/\[infancia\]/);
    expect(prompt).not.toContain('puertaAbierta');
  });
});
