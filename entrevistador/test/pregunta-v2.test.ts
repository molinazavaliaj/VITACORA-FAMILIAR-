import { describe, it, expect, vi } from 'vitest';
import { NUCLEO, armarPromptPregunta, controlarPregunta, escribirPregunta, objetivoEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { perfilVacio, type Perfil } from '../src/ia/perfil.js';

// La pregunta del día, v2 (biógrafo v2, 23/09). Cambia el ENCARGO —de "decorá esta pregunta
// del guion" a "decidí cómo preguntarle esto a ESTA persona"—, la ENTRADA —el perfil y cada
// respuesta con la pregunta que la originó, que es lo que resolvió C6— y el CONTROL —se revisa
// lo que devuelve antes de mandarlo, que es lo que resolvió C11—.

function perfilDe(parcial: Partial<Perfil['persona']>, extra: Partial<Perfil> = {}): Perfil {
  const p = perfilVacio();
  p.persona = { ...p.persona, ...parcial };
  return { ...p, ...extra };
}

const nucleo = (i: number): Objetivo => ({ tipo: 'nucleo', ...NUCLEO[i] });

describe('NUCLEO (21 temas fijos + la presentación)', () => {
  it('tiene los 22 ids del diseño, en ese orden', () => {
    expect(NUCLEO.map((n) => n.id)).toEqual([
      'presentacion', 'casa-infancia', 'mapa-casas', 'mapa-capitulos', 'padres', 'con-quien-crecio', 'juegos',
      'a-los-quince', 'primer-trabajo', 'amor', 'con-quien-hizo-su-vida', 'oficio', 'por-gusto', 'amigos', 'un-lugar',
      'un-dia-de-hoy', 'pruebas', 'fuerza', 'alegrias', 'lo-que-falta', 'mensaje', 'cinco-minutos',
    ]);
  });

  it('ningún tema dice "él" ni "ella" ni da por hecho hijos, nietos, boda, esposa o marido', () => {
    for (const n of NUCLEO) {
      expect(n.tema, n.id).not.toMatch(/\b(él|ella)\b/);
      expect(n.tema, n.id).not.toMatch(/\b(su esposa|su marido|sus hijos|sus nietos|la boda|su mujer)\b/i);
    }
  });

  it('la presentación no es una pregunta del día: pide el trato, la edad si falta y cómo le dicen', () => {
    const p = NUCLEO.find((n) => n.id === 'presentacion')!;
    expect(p.bloque).toBe('presentacion');
    expect(p.tema).toMatch(/cómo le dicen/i);
    expect(p.tema).toMatch(/solo si/i);
  });

  it('a-los-quince no supone salidas; con-quien-crecio pregunta de dónde venía la familia', () => {
    expect(NUCLEO.find((n) => n.id === 'a-los-quince')!.tema).not.toMatch(/sábado/i);
    expect(NUCLEO.find((n) => n.id === 'con-quien-crecio')!.tema).toMatch(/de dónde venía/i);
  });
});

describe('objetivoEnTexto', () => {
  it('una variable lleva su tramo, sus anclas y la regla de la historia grande de su país', () => {
    const t = objetivoEnTexto({ tipo: 'variable', id: 'var-1', tramo: 'adultez media', desde: 36, hasta: 55, anclas: ['Lanús — su taller (27 a 60)'] }, perfilDe({}));
    expect(t).toContain('entre los 36 y los 55');
    expect(t).toContain('Lanús — su taller');
    expect(t).toMatch(/algo grande en su país o su ciudad/i);
    expect(t).toMatch(/sin dar por hecho de qué lado/i);
  });
  it('un objeto pide UNA cosa de esa época con foto y de dónde salió, y avisa que no se insiste', () => {
    const t = objetivoEnTexto({ tipo: 'objeto', id: 'objeto-juventud', tramo: 'juventud' }, perfilDe({}));
    expect(t).toMatch(/foto/i);
    expect(t).toMatch(/de dónde salió/i);
    expect(t).toMatch(/no se insiste|si no tiene, no pasa nada/i);
  });
  it('la presentación ofrece tú/usted en España y vos/usted en el resto', () => {
    const p = NUCLEO[0];
    expect(objetivoEnTexto({ tipo: 'nucleo', ...p }, perfilDe({}, { castellano: 'españa' }))).toContain('tú o de usted');
    expect(objetivoEnTexto({ tipo: 'nucleo', ...p }, perfilDe({}))).toContain('vos o de usted');
  });
  it('la presentación no pide la edad si la ficha ya la trajo', () => {
    const p = NUCLEO[0];
    expect(objetivoEnTexto({ tipo: 'nucleo', ...p }, perfilDe({ anioNacimiento: { valor: '1950', fuente: 'ficha' } }))).not.toMatch(/cuántos años/i);
  });
});

describe('armarPromptPregunta', () => {
  const conversacion = [{ pregunta: '¿Cómo eran los sábados a la noche en Buenos Aires?', respuesta: 'Salíamos de miércoles a domingo.' }];

  it('le pasa cada respuesta CON su pregunta (C6: sin la pregunta, Buenos Aires no existía)', () => {
    const p = armarPromptPregunta(perfilDe({}), nucleo(5), conversacion, []);
    expect(p).toContain('¿Cómo eran los sábados a la noche en Buenos Aires?');
    expect(p).toContain('Salíamos de miércoles a domingo.');
  });

  it('una variable lleva su tramo y sus anclas', () => {
    const v: Objetivo = { tipo: 'variable', id: 'var-1', tramo: 'adultez media', desde: 36, hasta: 55, anclas: ['Lanús — su taller (27 a 60)'] };
    const p = armarPromptPregunta(perfilDe({}), v, [], []);
    expect(p).toContain('entre los 36 y los 55');
    expect(p).toContain('Lanús — su taller');
  });

  it('si no se sabe cómo habla, lo dice en vez de elegir por él', () => {
    expect(armarPromptPregunta(perfilDe({}), nucleo(0), [], [])).toContain('no sabés cómo prefiere que le hablen');
    expect(armarPromptPregunta(perfilDe({ comoHabla: { valor: 'vos', fuente: 'deducido' } }), nucleo(0), [], [])).toContain('Hablale de vos');
  });
});

describe('controlarPregunta', () => {
  it('rechaza el trato mezclado (C11)', () => {
    expect(controlarPregunta('Mirá, vos dijiste que... ¿cómo conoció al amor de su vida? Lléveme a ese día.', 'vos').ok).toBe(false);
  });

  it('rechaza sin pregunta, o demasiado larga para leer en el celular', () => {
    expect(controlarPregunta('Contame de tu casa.', 'vos').ok).toBe(false);
    expect(controlarPregunta(`${'palabra '.repeat(60)}?`, 'vos').ok).toBe(false);
  });

  it('acepta una buena', () => {
    expect(controlarPregunta('Contame de la casa de Pelliza: si cerrás los ojos y entrás, ¿qué ves?', 'vos')).toEqual({ ok: true });
  });

  it('sin trato conocido, solo controla la forma', () => {
    expect(controlarPregunta('¿Cómo era la casa donde pasó su infancia?', null).ok).toBe(true);
  });
});

describe('escribirPregunta', () => {
  it('le pasa al modelo los temas que la persona pidió dejar (antes no llegaban: solo la evaluación los recibía)', async () => {
    const create = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '¿Cómo era la plaza con Chupín y Chombita?' }], usage: { input_tokens: 1, output_tokens: 1 } });
    const r = await escribirPregunta({ messages: { create } } as never, perfilDe({ comoHabla: { valor: 'vos', fuente: 'dicho' } }), nucleo(5), [], [], ['su tío y las drogas']);
    expect(r.ok).toBe(true);
    expect(JSON.stringify(create.mock.calls[0])).toContain('su tío y las drogas');
  });

  it('controla el trato con la ficha: a un narrador de tú no le deja pasar el usted', async () => {
    const create = vi.fn()
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Cuénteme de su casa: ¿qué veía al entrar?' }], usage: { input_tokens: 1, output_tokens: 1 } })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'Cuéntame de tu casa: ¿qué veías al entrar?' }], usage: { input_tokens: 1, output_tokens: 1 } });
    const r = await escribirPregunta({ messages: { create } } as never, perfilDe({ comoHabla: { valor: 'tú', fuente: 'dicho' } }), nucleo(0), [], []);
    expect(r.ok).toBe(true);
    expect(r.texto).toBe('Cuéntame de tu casa: ¿qué veías al entrar?');
    expect(create).toHaveBeenCalledTimes(2);
  });
});
