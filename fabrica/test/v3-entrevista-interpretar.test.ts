// Qué dijo la persona (docs/v3/entrevista/simulaciones/textos-finales.md,
// reglas 2 a 18; Naza, 30/09): una sola función que interpreta la respuesta
// según la pregunta, con los botones primero y las reglas de respaldo para
// quien contesta en audio. Los casos salen de las 6 simulaciones.

import { describe, expect, it } from 'vitest';
import { BANCO, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { contoAlgo, cumple, esNoCorto, esPaso, respondioNo } from '../src/v3/entrevista/flujo.js';
import { ABREN_TEMA, interpretar, leerBoton, respuestaDeBoton, sumarAudio, topeNoCorto, valeBoton } from '../src/v3/entrevista/respuesta.js';

const p = (id: string) => preguntaPorId(id)!;
const que = (id: string, r: string) => interpretar(p(id), r);
/** n palabras que empiezan con "no". */
const noDe = (n: number) => ['No', ...Array.from({ length: n - 1 }, () => 'uno')].join(' ');

describe('los casos de las simulaciones (PLAN-codigo.md)', () => {
  it('Aníbal en HI0, como lo cita el plan: un "no"', () => {
    expect(que('HI0', 'No, nunca tuve hijos. No se me dio, qué sé yo. Tengo sobrinos…')).toBe('no');
  });

  it('Aníbal en HI0, la respuesta entera (44 palabras, más que el tope aprobado de 40): no se entiende como "no"; para eso está el botón', () => {
    const entera = 'No, nunca tuve hijos. No se me dio, qué sé yo. Tengo sobrinos de mi hermana Olga, dos muchachos, Martín y otro. Los veo de vez en cuando, me llaman. Pero no son lo mío como sería un hijo propio. La vida fue así.';
    expect(que('HI0', entera)).toBe('conto');
    expect(que('HI0', respuestaDeBoton('No tuve hijos'))).toBe('no');
  });

  it('Nelly en AM9: "Paso, mejor no. Ya lo conté…" es paso', () => {
    expect(que('AM9', 'Paso, mejor no. Ya lo conté, viste, se fue y no volvió. Eso fue suficiente.')).toBe('paso');
  });

  it('Manuel en JU17: "De eso no. Hay cosas que prefiero guardarme." es paso', () => {
    expect(que('JU17', 'De eso no. Hay cosas que prefiero guardarme.')).toBe('paso');
  });

  it('Elsa en HI8: "No me acuerdo bien cuándo nació el primero" es un olvido y cuenta como "sí" (llega HI9)', () => {
    expect(que('HI8', 'No me acuerdo bien cuándo nació el primero')).toBe('olvido');
    expect(cumple(p('HI9'), new Map([['HI8', 'No me acuerdo bien cuándo nació el primero']]))).toBe(true);
    expect(respondioNo(new Map([['HI8', 'No me acuerdo bien cuándo nació el primero']]), 'HI8')).toBe(false);
  });

  it('Manuel en AM9: "No, seguimos juntos… pero no nos separamos" es un "no" (el "pero" está lejos)', () => {
    expect(que('AM9', 'No, seguimos juntos. Cuarenta y tantos años. No fue fácil siempre, pero no nos separamos. Ella está ahí todavía.')).toBe('no');
  });

  it('los "No, creo que está todo…" de los cierres son "no" hasta 40 palabras', () => {
    expect(que('CI13', 'No, creo que está todo. Lo importante está ahí, desde que nací hasta ahora, mis momentos de alegría y dolor. Creo que está completo.')).toBe('no');
    // Aníbal en CI4: termina en "paso" y tiene menos de 12 palabras, así que es paso (regla 10); en un cierre da igual: M25.
    expect(que('CI4', 'No, creo que está todo. Paso.')).toBe('paso');
    expect(que('CI1', 'No, creo que está todo. De eso no hay mucho más que contar, vos. La vida en la aldea era tranquila, siempre igual.')).toBe('no');
  });

  it('Nelly en CI6 (52 palabras, más que el tope aprobado de 40): no es "no"; con el botón, sí', () => {
    const ci6 = 'No, creo que está todo. La verdad es que mi historia de amor es corta, viste. No fue una vida de película, fue una vida real, simple, con un hijo y trabajo. Está bien así. Ahora tengo mis amigas, mis hijos, mis nietos, mi costura. Eso es lo que llena mi corazón.';
    expect(que('CI6', ci6)).toBe('conto');
    expect(que('CI6', respuestaDeBoton('No, está todo'))).toBe('no');
  });
});

describe('botones (reglas 2 a 6)', () => {
  it('la marca del botón va al principio y el audio se suma atrás', () => {
    expect(respuestaDeBoton('No tuve hijos')).toBe('⟦botón:No tuve hijos⟧');
    const r = sumarAudio(respuestaDeBoton('Sí, tuve'), 'Mi hija mayor nació en el setenta.');
    expect(r).toBe('⟦botón:Sí, tuve⟧ Mi hija mayor nació en el setenta.');
    expect(leerBoton(r)).toEqual({ boton: 'Sí, tuve', resto: 'Mi hija mayor nació en el setenta.' });
    expect(leerBoton('Sin botón.')).toEqual({ resto: 'Sin botón.' });
    expect(sumarAudio('Primer audio.', 'Segundo.')).toBe('Primer audio. Segundo.');
  });

  it('lo que vale cada botón sale del banco', () => {
    expect(valeBoton(p('HI0'), 'Sí, tuve')).toBe('si');
    expect(valeBoton(p('AM9'), 'Seguimos juntos')).toBe('no');
    expect(valeBoton(p('AM9'), 'Paso esta')).toBe('paso');
    expect(valeBoton(p('CI3'), 'No, está todo')).toBe('no');
    expect(valeBoton(p('FO1'), 'No tengo foto')).toBe('no');
  });

  it('un botón que la pregunta no tiene: "Sí…" vale sí, "Paso esta" paso, lo demás no', () => {
    expect(valeBoton(p('OR1'), 'Sí, claro')).toBe('si');
    expect(valeBoton(p('OR1'), 'Paso esta')).toBe('paso');
    expect(valeBoton(p('OR1'), 'Nada')).toBe('no');
  });

  it('si hay botón, manda el botón, aunque el audio diga otra cosa (regla 6)', () => {
    expect(que('HI0', sumarAudio(respuestaDeBoton('Sí, tuve'), 'No me acuerdo bien el año.'))).toBe('conto');
    expect(que('AM9', sumarAudio(respuestaDeBoton('Seguimos juntos'), 'Nos conocimos en un baile, te cuento todo.'))).toBe('no');
    expect(que('PE1', respuestaDeBoton('Paso esta'))).toBe('paso');
    expect(que('AM0', respuestaDeBoton('Sí, hubo'))).toBe('conto');
  });

  it('las que abren tema son las 9 con botón de "Sí"', () => {
    const conSi = BANCO.filter((q) => q.botones?.some((b) => b.vale === 'si')).map((q) => q.id);
    expect([...ABREN_TEMA]).toEqual(conSi);
    expect(conSi).toEqual(['CA6', 'JU8', 'AM0', 'AM3', 'AM9', 'AM16', 'AM20', 'HI0', 'HI8']);
  });
});

describe('paso (reglas 10 y 11)', () => {
  it.each(['Paso', 'paso.', 'Bueno, paso', 'Paso, no quiero hablar de eso', 'Paso. De eso no hablo.'])('"%s" es paso', (r) => {
    expect(que('CA2', r)).toBe('paso');
  });

  it('"paso" como primera palabra, sin tope de largo', () => {
    const larga = 'Paso, porque ya te conté que me fui de Mendoza cuando era joven y ahí empezó todo, con mi tía y mis primos que me esperaban en la estación.';
    expect(que('JU8', larga)).toBe('paso');
  });

  it('salvo que siga "a", "por", "de" o "que": ahí cuenta algo', () => {
    expect(que('CA2', 'Paso a contarte lo del viaje que hicimos con mi hermano a Mendoza')).toBe('conto');
    expect(que('CA2', 'Paso por la casa de mi abuela todos los días')).toBe('conto');
    expect(que('CA2', 'Paso de largo por esa esquina siempre')).toBe('conto');
    expect(que('CA2', 'Paso que te cuento algo')).toBe('conto');
  });

  it('"paso" como última palabra, en hasta 12 palabras (Aníbal: "No tengo hijos. Paso.")', () => {
    expect(que('HI3', 'No tengo hijos. Paso.')).toBe('paso');
    expect(que('CA2', 'Eso me cuesta mucho, la verdad, así que paso')).toBe('paso');
    expect(que('CA2', 'Uno dos tres cuatro cinco seis siete ocho nueve diez once doce paso')).toBe('conto'); // 13 palabras
  });

  it.each([
    'Siguiente.', 'Otra.', 'Mejor otra.', 'Salteala.', 'Esa no.', 'Eso no. Mejor otra.', 'De eso no.', 'No quiero hablar de eso.',
    'Prefiero no.', 'Mejor no.', 'Eso me lo guardo.', 'Me lo guardo.', 'Dejémoslo ahí.', 'Ahí prefiero no, disculpá.', 'Esa mejor no.', 'De eso mejor no hablemos.',
  ])('la frase "%s" es paso', (r) => {
    expect(que('PG1', r)).toBe('paso');
  });

  it('una frase de la lista en una respuesta larga no es paso: contó algo y se frenó (regla 12)', () => {
    expect(que('PE1', 'Prefiero no hablar mucho de eso, pero te cuento que mi papá se fue un invierno y yo tenía veinte años recién cumplidos.')).toBe('conto');
  });

  it('"pasó" (con tilde) no es "paso": contó algo', () => {
    expect(que('CA17', 'Sí, te cuento lo que pasó.')).toBe('conto');
    expect(que('CA2', 'Pasó que un día se fue.')).toBe('conto');
  });

  it('"paso" no es un "no" corto', () => {
    expect(esNoCorto('paso')).toBe(false);
    expect(esPaso('paso')).toBe(true);
  });
});

describe('"ya te lo conté" (regla 18)', () => {
  it.each(['Ya te lo conté.', 'Eso ya te conté, lo del casamiento.', 'Ya lo conté antes.', 'Ya te lo dije, fue en el sesenta.', 'No, ya te lo conté.'])('"%s"', (r) => {
    expect(que('AM4', r)).toBe('ya-conto');
  });

  it('cuenta como "sí" para las que dependen', () => {
    expect(cumple(p('AM4'), new Map([['AM3', 'Ya te lo conté.']]))).toBe(true);
    expect(contoAlgo(new Map([['AM3', 'Ya te lo conté.']]), 'AM3')).toBe(true);
  });

  it('largo (más de 15 palabras) es contar algo', () => {
    expect(que('AM4', 'Ya te lo conté, pero te cuento de nuevo: fue en la iglesia del pueblo con toda la familia y los vecinos.')).toBe('conto');
  });
});

describe('olvido (reglas 15 y 16)', () => {
  it.each(['No me acuerdo.', 'No recuerdo nada de eso.', 'No sé, la verdad.', 'Ni idea.', 'No tengo idea, era muy chica.', 'Uy, eso se me borró por completo.', 'La memoria ya no me da para tanto.', 'Ay, la cabeza mía, no sé.', 'No, no me acuerdo.'])(
    '"%s" es un olvido',
    (r) => {
      expect(que('ES2', r)).toBe('olvido');
    },
  );

  it('"No, se fue…" (con la coma) no es "no sé"', () => {
    expect(que('ES2', 'No, se fue a vivir a Córdoba.')).toBe('no');
  });

  it('hasta 40 palabras; más largo, contó algo', () => {
    const larga = `No me acuerdo bien, ${'pero sé que había un patio grande y un perro '.repeat(4)}`;
    expect(que('ES2', larga)).toBe('conto');
  });

  it('en una que abre tema, un olvido cuenta como "sí" (llegan las que dependen)', () => {
    expect(que('AM0', 'No sé, no me acuerdo.')).toBe('olvido');
    expect(cumple(p('AM1'), new Map([['AM0', 'No sé, no me acuerdo.']]))).toBe(true);
    expect(cumple(p('AM15'), new Map([['AM0', 'No sé, no me acuerdo.']]))).toBe(false);
  });

  it('un olvido no es "contó algo" (para las dudas de la ficha)', () => {
    expect(contoAlgo(new Map([['HI0', 'No me acuerdo.']]), 'HI0')).toBe(false);
  });
});

describe('"no" corto (reglas 13 y 14)', () => {
  it('hasta 15 palabras en una común (antes: menos de 15)', () => {
    expect(que('CA2', noDe(15))).toBe('no');
    expect(que('CA2', noDe(16))).toBe('conto');
    expect(topeNoCorto(p('CA2'))).toBe(15);
  });

  it.each(['CI1', 'CI11', 'LE9', 'CA17', 'PE5', 'AM9', 'CA6', 'AM3', 'AM20', 'HI8'])('hasta 40 en %s', (id) => {
    expect(topeNoCorto(p(id))).toBe(40);
    expect(que(id, noDe(40))).toBe('no');
    expect(que(id, noDe(41))).toBe('conto');
  });

  it('"pero" o "aunque" en las primeras 5 palabras lo dan vuelta; más lejos, no', () => {
    expect(que('CA2', 'No, pero una vez casi me voy a vivir con ella')).toBe('conto');
    expect(que('CA2', 'Nunca lo pensé, aunque mi abuelo decía que sí')).toBe('conto');
    expect(que('HI0', 'No, nunca tuve. Tuve una novia, pero no pasó nada')).toBe('no');
  });

  it('en los cierres, "pero" no da vuelta el "no"', () => {
    expect(que('CI3', 'No, pero está todo dicho ya')).toBe('no');
  });

  it('sin pregunta, esNoCorto usa el tope de una común', () => {
    expect(esNoCorto(noDe(15))).toBe(true);
    expect(esNoCorto(noDe(20))).toBe(false);
    expect(esNoCorto(noDe(20), p('CI2'))).toBe(true);
  });

  it('respondioNo y la variante «sino:X» miran la pregunta X del banco', () => {
    expect(respondioNo(new Map([['AM9', noDe(30)]]), 'AM9')).toBe(true);
    expect(respondioNo(new Map([['AM9', respuestaDeBoton('Seguimos juntos')]]), 'AM9')).toBe(true);
  });
});

describe('vacío', () => {
  it.each(['', '   ', '👍'])('"%s" no dijo nada', (r) => {
    expect(que('CA2', r)).toBe('vacio');
  });
});

describe('las dependencias con botones', () => {
  it('HI0 [No tuve hijos]: no llegan las de hijos, llega HI10', () => {
    const r = new Map([['HI0', respuestaDeBoton('No tuve hijos')]]);
    expect(cumple(p('HI2'), r)).toBe(false);
    expect(cumple(p('HI8'), r)).toBe(false);
    expect(cumple(p('HI10'), r)).toBe(true);
  });

  it('AM9 [Paso esta]: no van AM19 ni AM16 (regla 4)', () => {
    const r = new Map([['AM9', respuestaDeBoton('Paso esta')]]);
    expect(cumple(p('AM19'), r)).toBe(false);
    expect(cumple(p('AM16'), r)).toBe(false);
  });

  it('HI2 con un "no" corto o "paso" cierra el tema: no van HI3, HS1 ni HI6 (regla 24)', () => {
    for (const hi2 of ['No, no me quiero acordar.', 'Paso']) {
      const r = new Map([['HI0', 'Sí, dos hijas.'], ['HI2', hi2]]);
      for (const id of ['HI3', 'HS1', 'HI6']) expect(cumple(p(id), r), `${hi2} → ${id}`).toBe(false);
    }
  });
});
