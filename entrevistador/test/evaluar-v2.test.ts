import { describe, it, expect, vi } from 'vitest';
import { encargoDelBiografo } from '../src/ia/encargo-entrevista.js';
import { armarPromptEvaluar, parsearEvaluacion, evaluarV2 } from '../src/ia/evaluar-v2.js';
import { perfilVacio, type Perfil } from '../src/ia/perfil.js';

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

describe('evaluarV2', () => {
  const cliente = (textos: string[]) => {
    const create = vi.fn();
    for (const t of textos) create.mockResolvedValueOnce({ content: [{ type: 'text', text: t }], usage: { input_tokens: 1, output_tokens: 1 } });
    return { cliente: { messages: { create } } as never, create };
  };

  it('si la repregunta rompe el trato, la pide de nuevo diciendo por qué', async () => {
    const { cliente: c, create } = cliente([
      '{"suficiente": false, "repregunta": "¿Cómo se llamaba? Cuénteme de ella."}',
      '{"suficiente": false, "repregunta": "¿Cómo se llamaba? Contame de ella."}',
    ]);
    const r = await evaluarV2(c, perfilDe({ comoHabla: { valor: 'vos', fuente: 'dicho' } }), '¿Su abuela?', 'Sí, mi abuela.', 5, [], []);
    expect(r.evaluacion.repregunta).toBe('¿Cómo se llamaba? Contame de ella.');
    expect(create).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(create.mock.calls[1])).toContain('no sirvió porque');
  });

  it('si alcanza, una sola llamada', async () => {
    const { cliente: c, create } = cliente(['{"suficiente": true}']);
    const r = await evaluarV2(c, perfilDe(), '¿Su casa?', 'Larga respuesta con escenas.', 90, [], []);
    expect(r.evaluacion).toEqual({ suficiente: true });
    expect(create).toHaveBeenCalledTimes(1);
  });
});
