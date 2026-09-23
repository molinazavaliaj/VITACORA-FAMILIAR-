import { describe, it, expect, vi } from 'vitest';
import { encargoDelBiografo, controlarTexto, tratoDelPerfil } from '../src/ia/encargo-entrevista.js';
import { armarPromptEvaluar, parsearEvaluacion, evaluarV2, hayCansancio } from '../src/ia/evaluar-v2.js';
import { perfilVacio, type Perfil } from '../src/ia/perfil.js';

// `objetivoDePrueba`: para el control de lugar de la repregunta se pasa el objetivo de la pregunta
// de hoy (Task 6/7); acá alcanza con un núcleo de infancia, no importa el detalle. `as never`
// porque no vale la pena tipar todo `NucleoItem` en el test.
const objetivoDePrueba = { tipo: 'nucleo', id: 'padres', tramo: 'infancia', bloque: 'infancia', tema: '' } as never;

/** Un cliente falso que devuelve, en orden, un texto por llamada (usado por los tests de `evaluarV2`). */
const cliente = (textos: string[]) => {
  const create = vi.fn();
  for (const t of textos) create.mockResolvedValueOnce({ content: [{ type: 'text', text: t }], usage: { input_tokens: 1, output_tokens: 1 } });
  return { cliente: { messages: { create } } as never, create };
};

// El encargo compartido del entrevistador y la evaluación v2 (biógrafo v2, 23/09). La pregunta
// del día y la repregunta tenían cada una sus reglas, escritas en momentos distintos; la
// evaluación era el prompt más parcheado (19 cambios, uno por error). Ahora las dos parten del
// mismo encargo: quién es, cómo se le habla, qué se respeta siempre.

function perfilDe(parcial: Partial<Perfil['persona']> = {}, extra: Partial<Perfil> = {}): Perfil {
  const p = perfilVacio();
  p.persona = { ...p.persona, ...parcial };
  return { ...p, ...extra };
}

describe('encargoDelBiografo', () => {
  it('dice quién es, cómo hablarle y lo que se respeta siempre', () => {
    const t = encargoDelBiografo(perfilDe({ comoHabla: { valor: 'vos', fuente: 'dicho' }, genero: { valor: 'mujer', fuente: 'deducido' } }));
    expect(t).toContain('QUIÉN ES');
    expect(t).toContain('Hablale de vos');
    expect(t).toContain('Es una mujer');
    expect(t).toContain('Nunca le pidas lo que ya contó');
    expect(t).toContain('pidió dejar un tema');
  });

  it('si no se sabe mujer u hombre, pide escribir para los dos', () => {
    expect(encargoDelBiografo(perfilDe())).toContain('sirva para los dos');
  });

  it('lleva los temas que pidió dejar', () => {
    expect(encargoDelBiografo(perfilDe(), ['su tío y las drogas'])).toContain('su tío y las drogas');
  });

  it('si solo se sabe el año de nacimiento, lo dice como año y no como edad', () => {
    expect(encargoDelBiografo(perfilDe({ anioNacimiento: { valor: '1950', fuente: 'ficha' } }))).toContain('Año de nacimiento: 1950');
    expect(encargoDelBiografo(perfilDe({ edad: { valor: '76', fuente: 'dicho' } }))).toContain('Edad: 76');
  });

  it('dice su castellano y ofrece el trato que corresponde', () => {
    const esp = encargoDelBiografo(perfilDe({}, { castellano: 'españa' }));
    expect(esp).toMatch(/castellano de España/);
    expect(esp).not.toMatch(/rioplatense/);
    expect(encargoDelBiografo(perfilDe({}))).toMatch(/rioplatense/);
  });

  it('si hoy fue fuerte, pide reconocerlo antes de preguntar y no tirarle otro tema pesado', () => {
    const t = encargoDelBiografo(perfilDe({}, { hoyFueFuerte: true }));
    expect(t).toMatch(/reconoc[eé]/i);
    expect(t).toMatch(/otro tema pesado/i);
    expect(encargoDelBiografo(perfilDe({}))).not.toMatch(/otro tema pesado/i);
  });

  it('el puente reemplaza al "enganchá": la pregunta va a lo que todavía no contó', () => {
    const t = encargoDelBiografo(perfilDe({}));
    expect(t).not.toMatch(/enganch/i);
    expect(t).toMatch(/sirve de puente/i);
    expect(t).toMatch(/lo que todavía no contó/i);
  });

  it('usa cómo le dicen si se sabe', () => {
    expect(encargoDelBiografo(perfilDe({ comoLeDicen: { valor: 'Tito', fuente: 'dicho' } }))).toContain('Tito');
  });

  it('la presentación admite 90 palabras y no exige signo de pregunta', () => {
    const larga = `${'palabra '.repeat(80)}.`;
    expect(controlarTexto(larga, 'vos').ok).toBe(false);
    expect(controlarTexto(larga, 'vos', { presentacion: true })).toEqual({ ok: true });
    expect(controlarTexto(`${'palabra '.repeat(95)}.`, 'vos', { presentacion: true }).ok).toBe(false);
  });
});

describe('el control con un narrador de tú (España)', () => {
  it('el perfil con tú da un trato controlable; la puerta manual no lo conoce, pero el control sí', () => {
    expect(tratoDelPerfil(perfilDe({ comoHabla: { valor: 'tú', fuente: 'dicho' } }))).toBe('tu');
    expect(tratoDelPerfil(perfilDe({ comoHabla: { valor: 'vos', fuente: 'deducido' } }))).toBe('vos');
    expect(tratoDelPerfil(perfilDe())).toBeNull();
  });

  it('a un narrador de tú no le deja pasar el usted, y no confunde el tú con el vos', () => {
    expect(controlarTexto('Cuénteme de su casa: ¿qué veía al entrar?', 'tu').ok).toBe(false);
    expect(controlarTexto('Cuéntame de tu casa: ¿qué veías al entrar, sabes?', 'tu')).toEqual({ ok: true });
  });
});

describe('armarPromptEvaluar', () => {
  it('lleva el encargo, la pregunta, la respuesta y lo último que hablaron (con la pregunta)', () => {
    const p = armarPromptEvaluar(perfilDe(), '¿Y sus abuelos?', 'No sé nada de mis abuelos.', 20, [{ pregunta: '¿Su casa?', respuesta: 'Mi abuela cocinaba todos los días.' }], []);
    expect(p).toContain('QUIÉN ES');
    expect(p).toContain('¿Y sus abuelos?');
    expect(p).toContain('No sé nada de mis abuelos.');
    expect(p).toContain('P: ¿Su casa?');
    expect(p).toContain('Mi abuela cocinaba');
  });
});

describe('parsearEvaluacion', () => {
  it('lee el JSON y, si viene roto, da por suficiente (hoy no hay repregunta: el día no se corta)', () => {
    expect(parsearEvaluacion('```json\n{"suficiente": false, "repregunta": "¿Y después?"}\n```')).toEqual({ suficiente: false, repregunta: '¿Y después?' });
    expect(parsearEvaluacion('hola')).toEqual({ suficiente: true });
  });
});

describe('parsearEvaluacion valida por campo', () => {
  it('ignora lo que viene con el tipo equivocado', () => {
    const r = parsearEvaluacion('{"suficiente": false, "repregunta": 42, "reservado": "sí", "dejarTema": true, "hoyNo": "no", "quiereParar": true}');
    expect(r).toEqual({ suficiente: false, quiereParar: true });
  });

  it('lee hoyNo y quiereParar', () => {
    expect(parsearEvaluacion('{"suficiente": true, "hoyNo": true}')).toEqual({ suficiente: true, hoyNo: true });
  });
});

describe('hayCansancio', () => {
  it('las dos últimas repreguntas sin contestar → cansancio; una sola, no', () => {
    expect(hayCansancio([{ contestada: true }, { contestada: false }, { contestada: false }])).toBe(true);
    expect(hayCansancio([{ contestada: false }, { contestada: true }])).toBe(false);
    expect(hayCansancio([])).toBe(false);
  });
});

describe('el prompt de la evaluación', () => {
  it('distingue "hoy no" de "no quiero seguir" y de "vamos por otro lado"', () => {
    const p = armarPromptEvaluar(perfilDe(), '¿?', '…', 5, [], []);
    expect(p).toContain('"hoyNo"');
    expect(p).toContain('"quiereParar"');
    expect(p).toContain('"dejarTema"');
  });
});

describe('evaluarV2', () => {
  it('si la repregunta rompe el trato, la pide de nuevo diciendo por qué', async () => {
    const { cliente: c, create } = cliente([
      '{"suficiente": false, "repregunta": "¿Cómo se llamaba? Cuénteme de ella."}',
      '{"suficiente": false, "repregunta": "¿Cómo se llamaba? Contame de ella."}',
    ]);
    const r = await evaluarV2(c, perfilDe({ comoHabla: { valor: 'vos', fuente: 'dicho' } }), objetivoDePrueba, '¿Su abuela?', 'Sí, mi abuela.', 5, [], []);
    expect(r.evaluacion.repregunta).toBe('¿Cómo se llamaba? Contame de ella.');
    expect(create).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(create.mock.calls[1])).toContain('no sirvió porque');
  });

  it('si alcanza, una sola llamada', async () => {
    const { cliente: c, create } = cliente(['{"suficiente": true}']);
    const r = await evaluarV2(c, perfilDe(), objetivoDePrueba, '¿Su casa?', 'Larga respuesta con escenas.', 90, [], []);
    expect(r.evaluacion).toEqual({ suficiente: true });
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe('evaluarV2 con marca', () => {
  it('si la repregunta falla tres veces, queda marcada y se devuelve igual', async () => {
    const malo = '{"suficiente": false, "repregunta": "¿Cómo se llamaba? Cuénteme de ella."}';
    const { cliente: c, create } = cliente([malo, malo, malo]);
    const r = await evaluarV2(c, perfilDe({ comoHabla: { valor: 'vos', fuente: 'dicho' } }), objetivoDePrueba, '¿Su abuela?', 'Sí.', 5, [], []);
    expect(create).toHaveBeenCalledTimes(3);
    expect(r.marca).toMatchObject({ control: 'trato', intentos: 3 });
    expect(r.evaluacion.repregunta).toContain('Cuénteme');
  });
});
