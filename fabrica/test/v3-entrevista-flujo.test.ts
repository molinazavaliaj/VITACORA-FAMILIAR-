import { describe, it, expect } from 'vitest';
import { BANCO, preguntaPorId } from '../src/v3/entrevista/banco.js';
import {
  acuseRotado,
  contradiccionesConFicha,
  cumple,
  esNoCorto,
  esPaso,
  mensajesDespues,
  siguientePregunta,
} from '../src/v3/entrevista/flujo.js';
import { cuentaComoPregunta, preguntasCompletas, preguntasDelNucleo, simularRecorrido, type PasoRecorrido } from '../src/v3/entrevista/seleccion.js';
import { VIDAS_EJEMPLO, type VidaEjemplo } from '../src/v3/entrevista/vidas-ejemplo.js';
import type { FichaV3 } from '../src/v3/ficha.js';

const vida = (clave: VidaEjemplo['clave']) => VIDAS_EJEMPLO.find((v) => v.clave === clave)!;
const recorrer = (v: VidaEjemplo, aceptaExtra = false, familia?: { id: string; texto: string }[], ofrecerExtra = false) =>
  simularRecorrido(v.ficha, (id) => v.respuestas[id], { aceptaExtra, familia, ofrecerExtra });
const ids = (pasos: PasoRecorrido[]) => pasos.flatMap((p) => (p.tipo === 'pregunta' ? [p.pregunta.id] : p.tipo === 'familia' ? [p.pregunta.id] : ['OFERTA']));
const delBloque = (pasos: PasoRecorrido[], bloque: number) =>
  pasos.flatMap((p) => (p.tipo === 'pregunta' && p.pregunta.bloque === bloque ? [p.pregunta.id] : []));

describe('entrevista: "no" corto', () => {
  it.each(['No.', 'no, nunca tuve', 'Nunca me fui', 'No tuve hermanos', 'NO', '¡Jamás!', 'Jamas me casé', '  no  '])('"%s" es un no corto', (r) => {
    expect(esNoCorto(r)).toBe(true);
  });

  it.each([
    'No sabés lo que fue ese viaje, nos fuimos en tren con mi hermano y tardamos tres días en llegar',
    'paso',
    'Paso.',
    'Sí, dos',
    'Tuve una hermana',
    '',
    'Noviembre fue el mes en que nos conocimos',
  ])('"%s" no es un no corto', (r) => {
    expect(esNoCorto(r)).toBe(false);
  });

  // Desde las simulaciones (Naza, 30/09) el tope es "hasta 15" (antes "menos de 15") en una común.
  it('el límite es de 15 palabras en una pregunta común', () => {
    expect(esNoCorto('no ' + 'uno '.repeat(13).trim())).toBe(true); // 14 palabras
    expect(esNoCorto('no ' + 'uno '.repeat(14).trim())).toBe(true); // 15
    expect(esNoCorto('no ' + 'uno '.repeat(15).trim())).toBe(false); // 16
  });

  it('"paso" se reconoce con signos y mayúsculas, y nada más', () => {
    expect(esPaso('Paso')).toBe(true);
    expect(esPaso('paso.')).toBe(true);
    expect(esPaso('paso, gracias')).toBe(true);
    expect(esPaso('Paso, no quiero hablar de eso')).toBe(true);
    expect(esPaso('Bueno, paso')).toBe(true);
    expect(esPaso('Paso a contarte lo del viaje que hicimos con mi hermano a Mendoza en el sesenta')).toBe(false);
  });

  // Revisión del segundo agente (30/09): muletillas, letras estiradas, "pero".
  it.each(['Eh, no', 'Mmm, no.', 'Bueno, nunca', 'Nooo', 'Ninguno', 'Tampoco', 'A ver... no, no tuve'])('"%s" es un no corto', (r) => {
    expect(esNoCorto(r)).toBe(true);
  });
  it.each(['Nunca lo pensé pero me acuerdo que mi abuelo llegó en barco', 'No, aunque una vez casi me fui a Córdoba'])(
    '"%s" no es un no corto (sigue con algo que contar)',
    (r) => {
      expect(esNoCorto(r)).toBe(false);
    },
  );
});

describe('entrevista: una transcripción vacía no cuenta como respuesta', () => {
  const am1 = () => preguntaPorId('AM1')!;
  it.each(['', '   ', '👍'])('AM0 = "%s" no habilita las preguntas de pareja', (r) => {
    expect(cumple(am1(), new Map([['AM0', r]]))).toBe(false);
  });
});

describe('entrevista: condiciones', () => {
  const r = (o: Record<string, string>) => new Map(Object.entries(o));
  const am13 = preguntaPorId('AM13')!;
  const am1 = preguntaPorId('AM1')!;
  const am15 = preguntaPorId('AM15')!;

  it('sin condición, siempre', () => {
    expect(cumple(preguntaPorId('OR1')!, r({}))).toBe(true);
  });

  it('si:X pide que X haya contado algo; sino:X, un "no" corto', () => {
    expect(cumple(am1, r({ AM0: 'Sí, con Marta, cuarenta años.' }))).toBe(true);
    expect(cumple(am1, r({ AM0: 'No.' }))).toBe(false);
    expect(cumple(am15, r({ AM0: 'No.' }))).toBe(true);
    expect(cumple(am15, r({ AM0: 'Sí, con Marta.' }))).toBe(false);
  });

  it('si X no se mandó, no se cumple ni si: ni sino:', () => {
    expect(cumple(am1, r({}))).toBe(false);
    expect(cumple(am15, r({}))).toBe(false);
  });

  it('"paso" no es ni sí ni no (banco.md, Dudas 2)', () => {
    expect(cumple(am1, r({ AM0: 'paso' }))).toBe(false);
    expect(cumple(am15, r({ AM0: 'paso' }))).toBe(false);
    expect(cumple(am13, r({ AM0: 'Sí, una vez.', AM3: 'paso' }))).toBe(false);
  });

  // Hasta las simulaciones AM13 era "sino:AM9 o si:AM16"; desde el 30/09 (Naza, S10) depende de AM3 y va antes de AM8.
  it('AM13: llega si armaron la vida juntos (AM3), sin importar cómo terminó', () => {
    expect(cumple(am13, r({ AM3: 'Sí, nos casamos en el setenta.' }))).toBe(true);
    expect(cumple(am13, r({ AM3: 'Sí, nos casamos en el setenta.', AM9: 'Nos separamos después de muchos años, te cuento.' }))).toBe(true);
    expect(cumple(am13, r({ AM3: 'No, no llegamos a eso.' }))).toBe(false);
  });
});

describe('entrevista: los recorridos del amor (metodo-entrevista.md, "Bloque 6, arreglo…")', () => {
  // Prueba de Naza en la página (30/09): AMH decide si la de ahora o la última sigue al lado; el final (AM9) y
  // "por tu cuenta" (AM19) solo si ya no está; AM21 (las de antes) reemplaza a AM16 y AM20; AM14 solo sin pareja.
  const SIGUE = ['AM0', 'AMH', 'AM1', 'AM3', 'AM4', 'AM13', 'AM8', 'AM21'];
  const YA_NO = ['AM0', 'AMH', 'AM1', 'AM3', 'AM4', 'AM13', 'AM8', 'AM9', 'AM19', 'AM21'];
  const EXTRA_CON_PAREJA = ['AM2', 'AM5', 'AM6', 'AM7', 'AM17'];
  const esperado: Record<VidaEjemplo['clave'], string[]> = {
    'sigue-con-la-primera': SIGUE,
    'separada-sola': YA_NO,
    'separada-de-nuevo-en-pareja': SIGUE,
    'viuda-sola': YA_NO,
    'viuda-rehizo': SIGUE,
    'muchas-parejas': SIGUE,
    'madre-soltera': ['AM0', 'AMH', 'AM1', 'AM3', 'AM8', 'AM9', 'AM21'],
    'nunca-pareja-con-hijos': ['AM0', 'AM14', 'AM15'],
    'nunca-pareja-sin-hijos': ['AM0', 'AM14', 'AM15'],
  };

  it.each(Object.entries(esperado))('%s: solo núcleo', (clave, seq) => {
    // CI6 va siempre en el núcleo (Naza, 30/09, después de leer la entrevista de corrido).
    expect(delBloque(recorrer(vida(clave as VidaEjemplo['clave'])), 6)).toEqual([...seq, 'CI6']);
  });

  it.each(Object.entries(esperado))('%s: con la ronda extra', (clave, seq) => {
    const conPareja = !clave.startsWith('nunca');
    // Madre soltera: AM3 "no", así que no van AM5 (depende de AM3).
    const extra = clave === 'madre-soltera' ? EXTRA_CON_PAREJA.filter((id) => id !== 'AM5') : EXTRA_CON_PAREJA;
    expect(delBloque(recorrer(vida(clave as VidaEjemplo['clave']), true), 6)).toEqual([...seq, 'CI6', ...(conPareja ? extra : [])]);
  });

  it('AM7 dice "repite" si sigue con su pareja (AMH sí) y "repetía" si ya no está (AMH no)', () => {
    const am7 = (v: VidaEjemplo) => {
      const p = recorrer(v, true).find((x) => x.tipo === 'pregunta' && x.pregunta.id === 'AM7');
      return p && p.tipo === 'pregunta' ? p.pregunta.texto : '';
    };
    expect(am7(vida('sigue-con-la-primera'))).toContain('una frase que repite, una costumbre');
    expect(am7(vida('viuda-sola'))).toContain('una frase que repetía, una costumbre');
    // Desde la prueba de Naza, el detalle es de la pareja de ahora: Norma sigue con Julio.
    expect(am7(vida('separada-de-nuevo-en-pareja'))).toContain('una frase que repite, una costumbre');
  });
});

describe('entrevista: hijos y nietos', () => {
  it('sin hijos: HI10 y ninguna de HI1-HS1 (ni HI12, HI13); desde las simulaciones tampoco HI8 (depende de HI0)', () => {
    const b8 = delBloque(recorrer(vida('nunca-pareja-sin-hijos'), true), 8);
    expect(b8).toEqual(['PG1', 'HI0', 'HI10', 'CI8']);
  });

  it('con hijos y sin nietos: nada de HI9 ni NC1, y no va HI10', () => {
    const b8 = delBloque(recorrer(vida('nunca-pareja-con-hijos'), true), 8);
    // HI2b salió del banco (Naza, 30/09, simulaciones).
    // Naza, 30/09 (después de su prueba): OR6, OR6.2, CA10, CA14, ES8, JU13, HI7, HI12, PA3, AS7, HO4, HO10 y G3 pasan de extra al núcleo.
    expect(b8).toEqual(['PG1', 'HI0', 'HI2', 'HI3', 'HS1', 'HI6', 'HI7', 'HI12', 'HI8', 'CI8', 'HI1', 'HI4', 'HI5', 'HI13']);
  });

  it('con hijos y nietos: todo el bloque menos HI10', () => {
    const b8 = delBloque(recorrer(vida('sigue-con-la-primera'), true), 8);
    expect(b8).toContain('HI9');
    expect(b8).toContain('NC1');
    expect(b8).not.toContain('HI10');
  });

  it('sin hermanos ni mudanza: no van CA7, JU10 ni JU11', () => {
    const todo = ids(recorrer(vida('nunca-pareja-sin-hijos'), true));
    for (const id of ['CA7', 'JU10', 'JU11']) expect(todo).not.toContain(id);
    const completa = ids(recorrer(vida('sigue-con-la-primera'), true));
    for (const id of ['CA7', 'JU10', 'JU11']) expect(completa).toContain(id);
  });
});

describe('entrevista: orden del flujo (núcleo, oferta, extra, final, familia)', () => {
  const familia = [
    { id: 'FAM1', texto: '¿Cómo era el abuelo cuando lo conociste?' },
    { id: 'FAM2', texto: '¿Qué te gustaba cocinar para nosotros?' },
  ];

  it('sin respuestas, arranca por OR1 con M1', () => {
    const s = siguientePregunta({ respuestas: new Map() });
    expect(s).toMatchObject({ tipo: 'pregunta', conM1: true, esperaRespuesta: true });
    expect(s.tipo === 'pregunta' && s.pregunta.id).toBe('OR1');
  });

  it('por ahora no se ofrece la ronda extra: después del núcleo de los bloques 1 a 14 va el legado (Naza, 30/09)', () => {
    const seq = ids(recorrer(vida('sigue-con-la-primera'), false, familia));
    expect(seq).not.toContain('OFERTA');
    // Naza, 30/09 (después de su prueba): OR6, OR6.2, CA10, CA14, ES8, JU13, HI7, HI12, PA3, AS7, HO4, HO10 y G3 pasan de extra al núcleo.
    expect(seq[seq.indexOf('G3') + 1]).toBe('CI14');
    expect(seq[seq.indexOf('CI14') + 1]).toBe('LE1');
    expect(siguientePregunta({ respuestas: new Map() }).tipo).toBe('pregunta');
  });

  it('si se activa, la oferta de extra llega después de todo el núcleo de los bloques 1 a 14 y antes de cualquier extra', () => {
    for (const aceptaExtra of [false, true]) {
      const seq = ids(recorrer(vida('sigue-con-la-primera'), aceptaExtra, familia, true));
      const oferta = seq.indexOf('OFERTA');
      expect(oferta).toBeGreaterThan(0);
      const antes = seq.slice(0, oferta).map((id) => preguntaPorId(id)!);
      expect(antes.every((p) => p.parte === 'nucleo' && p.bloque < 15)).toBe(true);
      expect(antes.at(-1)!.id).toBe('CI14'); // la última del núcleo del bloque 14: su cierre
      const despues = seq.slice(oferta + 1);
      expect(despues[0]).toBe(aceptaExtra ? 'CA4' : 'LE1'); // OR6 pasó al núcleo (Naza, 30/09)
    }
  });

  it('las preguntas de la familia van al final: después de LE7, antes de FO1, LE9 y LE8; FIN cierra (Naza, 30/09, ronda 2)', () => {
    for (const aceptaExtra of [false, true]) {
      const seq = ids(recorrer(vida('sigue-con-la-primera'), aceptaExtra, familia));
      const cola = aceptaExtra ? ['LE1', 'LE2', 'LE6', 'FU1', 'LE7'] : ['LE1', 'LE2', 'FU1', 'LE7'];
      expect(seq.slice(-(cola.length + 6))).toEqual([...cola, 'FAM1', 'FAM2', 'FO1', 'LE9', 'LE8', 'FIN']);
    }
  });

  it('una pregunta de la familia que llega tarde (ya pasó FO1) igual va antes de LE9', () => {
    const respuestas = new Map<string, string>();
    for (const p of BANCO) if (p.orden < preguntaPorId('LE9')!.orden) respuestas.set(p.id, 'Sí, te cuento algo largo que pasó.');
    const s = siguientePregunta({ respuestas, rondaExtra: 'rechazada', familia });
    expect(s).toMatchObject({ tipo: 'familia', antes: 'M15', pregunta: { id: 'FAM1' } });
  });

  it('el aviso AV11 y el final no esperan respuesta; la entrevista termina', () => {
    const pasos = recorrer(vida('viuda-sola'));
    const sinRespuesta = pasos.flatMap((p) => (p.tipo === 'pregunta' && p.respuesta === undefined ? [p.pregunta.id] : []));
    expect(sinRespuesta).toEqual(['AV11', 'FIN']);
    expect(ids(pasos).at(-1)).toBe('FIN');
  });

  it('M1 solo va debajo de las preguntas de historia', () => {
    const respuestas = new Map(BANCO.filter((p) => p.orden < preguntaPorId('CI2')!.orden).map((p) => [p.id, 'Sí, te cuento una historia larga.']));
    const s = siguientePregunta({ respuestas });
    expect(s).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'CI2' }, conM1: false });
  });
});

describe('entrevista: conteos', () => {
  const contar = (v: VidaEjemplo, aceptaExtra: boolean) => {
    const preguntas = recorrer(v, aceptaExtra).flatMap((p) => (p.tipo === 'pregunta' ? [p.pregunta] : []));
    return { historia: preguntas.filter(cuentaComoPregunta).length, turnos: preguntas.length };
  };

  // Números del 30/09, con el banco de docs/v3/entrevista/banco.md (salen de
  // `npx tsx scripts/v3-entrevista-recorrido.ts`). "Historia" cuenta la foto
  // (FO1) y no cuenta cierres, aviso ni final; "turnos" cuenta todo lo que
  // se manda (sin acuses ni M1). El borrador decía 84 y 75: desde entonces
  // ES9, CP1, TR8 y CS1 pasaron al núcleo y entró HS1.
  // Simulaciones (Naza, 30/09): sale HI2b (una menos para quien tiene hijos) y HI8 depende de HI0 (una menos para quien no tiene).
  // Prueba de Naza en la página (30/09): entran al núcleo G1, HE2 (si tuvo hermanos) y HO11 (nueva), sale FI6;
  // el bloque 6 de quien sigue en pareja queda en 8 (AMH y AM21 en lugar de AM9 y AM14).
  // Naza, 30/09 (después de su prueba): OR6, OR6.2, CA10, CA14, ES8, JU13, HI7, HI12, PA3, AS7, HO4, HO10 y G3 pasan de extra al núcleo.
  it('vida completa (sigue con su primera pareja, hermanos, se mudó, hijos y nietos): 103 de historia en el núcleo', () => {
    expect(contar(vida('sigue-con-la-primera'), false)).toEqual({ historia: 103, turnos: 119 }); // Naza, 04/10: sale JU5 (la mili). // antes 103 y 119 (JU20 pasó al núcleo, Naza 01/10); antes 90 y 106
    expect(contar(vida('sigue-con-la-primera'), true)).toEqual({ historia: 177, turnos: 193 }); // sin JU5 (Naza, 04/10)
  });

  it('sin pareja ni hijos (sin hermanos, no se mudó): 90 de historia en el núcleo', () => {
    expect(contar(vida('nunca-pareja-sin-hijos'), false)).toEqual({ historia: 90, turnos: 106 }); // Naza, 04/10: sale JU5 (la mili). // antes 90 y 106 (JU20 al núcleo: le llega a todos); antes 79 y 95 (+11 del pase al núcleo; HI7 e HI12 no, sin hijos). // antes 78 y 94 (sin HE2: no tuvo hermanos)
  });

  it('el banco tiene 124 filas en el núcleo y 74 en la extra (todas de historia: los cierres pasaron al núcleo el 30/09)', () => {
    // Naza, 04/10: sale JU5 (la mili).
    // Naza, 30/09 (después de su prueba): OR6, OR6.2, CA10, CA14, ES8, JU13, HI7, HI12, PA3, AS7, HO4, HO10 y G3 pasan de extra al núcleo.
    expect(BANCO.filter((p) => p.parte === 'nucleo')).toHaveLength(124);
    const extra = BANCO.filter((p) => p.parte === 'extra');
    expect(extra).toHaveLength(74);
    expect(extra.filter(cuentaComoPregunta)).toHaveLength(74);
  });

  it('preguntasDelNucleo y preguntasCompletas dan todo lo que podría llegar, renderizado', () => {
    const ficha = { nombre: 'Rogelio', genero: 'varon' as const };
    const nucleo = preguntasDelNucleo(ficha);
    expect(nucleo).toHaveLength(124); // sin JU5 (Naza, 04/10); antes 125: 111 + las 13 que pasaron al núcleo (Naza, 30/09) + JU20 (Naza, 01/10)
    expect(nucleo.map((p) => p.id)).toEqual(expect.arrayContaining(['AM13', 'AM15', 'AMH', 'AM19', 'AM21', 'HI10']));
    expect(preguntasCompletas(ficha)).toHaveLength(198);
    expect(nucleo.find((p) => p.id === 'CA2')!.texto).toContain('cuando eras chico.');
    expect(nucleo.every((p) => !/\{\{(o\/a|padre\/madre|nombre)\}\}/.test(p.texto))).toBe(true);
  });
});

describe('entrevista: acuses', () => {
  const p = (id: string) => preguntaPorId(id)!;

  it('M3 común, M4 después de una sensible, M21 después de "paso"', () => {
    expect(mensajesDespues(p('OR1'), 'Nací en el campo, te cuento.')).toEqual(['M3']);
    expect(mensajesDespues(p('AM9'), 'Nos separamos, te cuento.')).toEqual(['M4']);
    expect(mensajesDespues(p('PE1'), 'Sí, a mi papá.')).toEqual(['M4']);
    expect(mensajesDespues(p('OR1'), 'paso')).toEqual(['M21']);
  });

  it('los cierres van con M24, o M25 si se contestan con un "no" corto o "paso"; M10 ya no se usa (Naza, 30/09, ronda 2)', () => {
    expect(mensajesDespues(p('CI2'), 'Sí, una más.')).toEqual(['M24']);
    expect(mensajesDespues(p('CI5'), 'Paso')).toEqual(['M25']); // cierre con paso: acuse neutro
    expect(mensajesDespues(p('CI6'), 'No.')).toEqual(['M25']); // cierre con un "no" corto: acuse neutro
  });

  it('el aviso y el final no llevan acuse', () => {
    expect(mensajesDespues(p('AV11'), '')).toEqual([]);
    expect(mensajesDespues(p('FIN'), '')).toEqual([]);
  });

  it('los acuses rotan', () => {
    expect([0, 1, 7, 8].map((n) => acuseRotado('M3', n))).toEqual(['M3.1', 'M3.2', 'M3.8', 'M3.1']);
    expect([0, 3, 4].map((n) => acuseRotado('M4', n))).toEqual(['M4.1', 'M4.4', 'M4.1']);
  });
});

describe('entrevista: la ficha contra las respuestas', () => {
  const base: FichaV3 = { nombre: 'Elvira', anioNacimiento: 1950, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina' };
  const r = (o: Record<string, string>) => new Map(Object.entries(o));

  it('la ficha dice que tiene y contestó que no', () => {
    const ficha: FichaV3 = { ...base, hijos: [{ nombre: 'Lucas' }], hermanos: ['Rosa'], parejas: [{ nombre: 'Juan', actual: true, fin: null }] };
    expect(contradiccionesConFicha(ficha, r({ HI0: 'No.', CA6: 'Nunca tuve', AM0: 'Sí, con Juan.' })).map((d) => d.texto)).toEqual([
      'La ficha dice que tiene hermanos y en la entrevista contestó que no (CA6).',
      'La ficha dice que tiene hijos y en la entrevista contestó que no (HI0).',
    ]);
  });

  it('la ficha dice que no tiene y contó algo', () => {
    const ficha: FichaV3 = { ...base, nietos: 'no-tiene', migracion: 'no-tiene' };
    expect(contradiccionesConFicha(ficha, r({ HI8: 'Sí, el primero nació en invierno y fui a verlo.', JU8: 'No.' }))).toEqual([
      { tema: 'nietos', pregunta: 'HI8', texto: 'La ficha dice que no tiene nietos y en la entrevista contó algo (HI8).', mensaje: 'DD2', temaTexto: 'tus nietos' },
    ]);
  });

  it('sin dato en la ficha, con "paso" o sin respuesta, no hay duda', () => {
    expect(contradiccionesConFicha(base, r({ HI0: 'No.', AM0: 'No.' }))).toEqual([]);
    const ficha: FichaV3 = { ...base, hijos: [{ nombre: 'Lucas' }], parejas: 'no-tiene' };
    expect(contradiccionesConFicha(ficha, r({ HI0: 'paso' }))).toEqual([]);
  });
});

describe('entrevista: "paso" en una pregunta que abre tema (Naza, 30/09)', () => {
  it('AM0 "paso": no van las de pareja, y el cierre del bloque 6 llega en el núcleo', () => {
    const v = vida('sigue-con-la-primera');
    const pasos = simularRecorrido(v.ficha, (id) => (id === 'AM0' ? 'Paso' : v.respuestas[id]), {});
    // Desde la prueba de Naza en la página (30/09) AM14 depende de "sino:AM0": con "paso" tampoco va.
    expect(delBloque(pasos, 6)).toEqual(['AM0', 'CI6']);
  });
  it('sin "paso", el cierre del bloque 6 igual llega: todos los cierres van en el núcleo (Naza, 30/09)', () => {
    expect(delBloque(recorrer(vida('sigue-con-la-primera')), 6).at(-1)).toBe('CI6');
  });
});
