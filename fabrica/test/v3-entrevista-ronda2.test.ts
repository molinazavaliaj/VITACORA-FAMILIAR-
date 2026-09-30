// Ronda 2 de simulaciones (docs/v3/entrevista/simulaciones/hallazgos.md,
// "## Ronda 2 (30/09)", puntos 1 a 8; el detalle en ronda-2/lectura-fable-*.md).
// Naza aprobó los 8 arreglos el 30/09.

import { describe, expect, it } from 'vitest';
import { parsearDepende } from '../src/v3/entrevista/banco-md.js';
import { mensajePorId, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { cumple, mensajesDespues } from '../src/v3/entrevista/flujo.js';
import { acuseAntesDe, acuseDeTurno } from '../src/v3/entrevista/mensajes.js';
import { interpretar, respuestaDeBoton, sumarAudio } from '../src/v3/entrevista/respuesta.js';
import { renderizar } from '../src/v3/entrevista/texto.js';

const p = (id: string) => preguntaPorId(id)!;
const que = (id: string, r: string) => interpretar(p(id), r);
const r = (o: Record<string, string>) => new Map(Object.entries(o));
const CUENTA = 'Sí, te cuento: fue una tarde larga que me acuerdo muy bien, con mi familia alrededor.';
const OLVIDO = 'No me acuerdo.';

describe('1. en cierres y LE9, "está todo / es todo / ya está / nada más" al principio es "no"', () => {
  it.each([
    ['CI9', 'Sí, está todo. Fue una vida plena, la verdad.'],
    ['CI5', 'Sí, creo que está todo. Fue una época linda, la verdad.'],
    ['CI4', 'Creo que está todo, gracias.'],
    ['CI12', 'Es todo lo que tengo para contar de eso.'],
    ['LE9', 'Ya está, no me queda nada.'], // antes "Ya está, me parece que no me queda nada.": 7 palabras después de la fórmula, y la revisión pone 6
    ['CI3', 'Nada más, gracias.'],
  ])('%s: "%s"', (id, resp) => {
    expect(que(id, resp)).toBe('no');
  });

  it('Manuel en CI1 (48 palabras, arranca con "No, creo que está todo"): "no", sin el tope de 40', () => {
    const ci1 = 'No, creo que está todo. Las historias que tengo claras de eso son esas. Después empezó mi vida, la mía de verdad, con mis hermanos, la casa. Lo demás es lo que alcanzaban a contarme de vez en cuando, pero lo que te dije es lo que quedó.';
    expect(que('CI1', ci1)).toBe('no');
    expect(mensajesDespues(p('CI1'), ci1)).toEqual(['M25']);
  });

  it('sigue la regla del "pero": en las primeras 5 palabras lo da vuelta', () => {
    expect(que('LE9', 'Está todo, pero quiero agregar lo de mi hermano Pedro.')).toBe('conto');
    expect(que('CI6', 'Es todo, aunque me acordé de un baile en el club.')).toBe('conto');
  });

  it('en una pregunta común no cambia nada', () => {
    expect(que('CA2', 'Sí, está todo bien con ella, la llamo seguido.')).toBe('conto');
  });
});

describe('2. [No, nada así] en CA17, AD15, JU17, TR11 y PE4', () => {
  const botones = (id: string) => (p(id).botones ?? []).map((b) => `${b.texto}=${b.vale}`);
  it.each(['CA17', 'AD15', 'JU17', 'TR11', 'PE4'])('%s: [Paso esta] y [No, nada así]', (id) => {
    expect(botones(id)).toEqual(['Paso esta=paso', 'No, nada así=no']);
    expect(mensajesDespues(p(id), respuestaDeBoton('No, nada así'))).toEqual(['M25']);
  });

  it('PE1 y PE5 siguen solo con [Paso esta]', () => {
    expect(botones('PE1')).toEqual(['Paso esta=paso']);
    expect(botones('PE5')).toEqual(['Paso esta=paso']);
  });
});

describe('3. AM16 y AM20, textos nuevos', () => {
  it('AM16', () => {
    expect(p('AM16').texto).toBe(
      'Y más adelante, ¿hubo otro amor? Si hubo, contame por ahora solo del que compartís hoy, o del último: el día que se conocieron y un momento de los dos que te haya quedado. De las del medio, si hubo, te pregunto después.',
    );
  });

  it('AM20 (el resto igual)', () => {
    expect(p('AM20').texto).toBe(
      'Ahora sí, las del medio. Entre la primera que fue en serio y la de ahora, o la última, ¿hubo otras historias que fueron en serio? Un casamiento, alguien con quien viviste años. Este es su lugar, aunque me las hayas nombrado en el repaso: contame de cada una lo que quieras que quede, cómo se cruzaron y cómo terminó.',
    );
  });
});

describe('4. AM19 solo si convivió (si:AM9 y si:AM3)', () => {
  it('el parser entiende " y " dentro de un "o"', () => {
    expect(parsearDepende('si:AM9 y si:AM3')).toEqual([{ tipo: 'si', de: 'AM9', y: [{ tipo: 'si', de: 'AM3' }] }]);
    expect(parsearDepende('si:AM9 o paso:AM9')).toEqual([
      { tipo: 'si', de: 'AM9' },
      { tipo: 'paso', de: 'AM9' },
    ]);
    expect(p('AM19').depende).toEqual([{ tipo: 'si', de: 'AM9', y: [{ tipo: 'si', de: 'AM3' }] }]);
  });

  it('Aníbal: AM3 [No llegamos a eso] y AM9 contó un final → no va AM19', () => {
    expect(cumple(p('AM19'), r({ AM3: respuestaDeBoton('No llegamos a eso'), AM9: CUENTA }))).toBe(false);
    expect(cumple(p('AM19'), r({ AM3: CUENTA, AM9: CUENTA }))).toBe(true);
  });
});

describe('5. M27.3 sin "Perfecto"', () => {
  it('texto', () => {
    expect(mensajePorId('M27.3')!.texto).toBe('Entiendo, {{nombre}}. No hace falta entrar ahí. Vamos con la que viene.');
  });
});

describe('6. M32: arranca negándose y sigue largo', () => {
  const FI7 =
    'De eso mejor no hablemos. La política es complicada, tiene opiniones fuertes, y no me interesa meterme ahí. Viví en épocas oscuras acá, la dictadura, los desaparecidos. Eso me enseñó a no hablar mucho de eso. Hice mi vida, trabajé, cuidé a mi familia. Eso es lo que importa.';

  it('textos', () => {
    expect(mensajePorId('M32.1')!.texto).toBe('Con lo que me dijiste alcanza, {{nombre}}. Lo demás queda tuyo. Vamos con otra.');
    expect(mensajePorId('M32.2')!.texto).toBe('Está bien. Lo que me contaste queda, y lo que no, no hace falta. Seguimos.');
  });

  it('Manuel en FI7: no es paso, cuenta como "contó algo" y lleva M32 en lugar de M3', () => {
    expect(que('FI7', FI7)).toBe('no-ahondar');
    expect(mensajesDespues(p('FI7'), FI7)).toEqual(['M32']);
    expect(cumple({ depende: [{ tipo: 'si', de: 'FI7' }] }, r({ FI7 }))).toBe(true);
  });

  it('en una sensible, M32 en lugar de M4', () => {
    const pe5 = 'Prefiero no hablar de eso, pero te digo que estuve internada un mes en el noventa y la pasé mal, muy mal, con mis hijas cerca.';
    expect(mensajesDespues(p('PE5'), pe5)).toEqual(['M32']);
  });

  it('rota entre M32.1 y M32.2; delante de un cierre o de LE9 va M26', () => {
    expect([0, 1, 2].map((n) => acuseDeTurno('M32', n, '…', p('CA16')))).toEqual(['M32.1', 'M32.2', 'M32.1']);
    expect(acuseDeTurno('M32', 0, '…', p('CI12'))).toBe('M26');
    expect(acuseDeTurno('M32', 0, '…', p('LE9'))).toBe('M26');
  });

  it('una frase que no es negarse ("Otra vez…", "Esa no era…", "Mejor no ir solo…") sigue con M3', () => {
    for (const x of ['Otra vez fuimos al río con mi papá y mi hermano, y pescamos toda la tarde hasta que se hizo de noche y volvimos', 'Esa no era mi casa, era la de mi tía Rosa, donde pasábamos los veranos con todos los primos del campo', 'Mejor no ir solo, dijo mi mamá, y nos fuimos juntos a la estación a esperar el tren de la tarde'])
      expect(mensajesDespues(p('CA2'), x), x).toEqual(['M3']);
  });
});

describe('7. M28.4: olvido a medias', () => {
  const MEDIAS = 'No me acuerdo bien, pero sé que había un patio grande con un limonero y mi mamá colgaba la ropa ahí.';
  const LARGO = 'No me acuerdo bien de la maestra, era una señora alta que venía en bicicleta desde el pueblo de al lado y nos traía caramelos.';

  it('texto', () => {
    expect(mensajePorId('M28.4')!.texto).toBe('Con ese pedacito me alcanza, {{nombre}}. Gracias.');
  });

  it('arranca con olvido y sigue (con "pero" o más de 20 palabras): olvido a medias, M28.4 en lugar de M3 o M4', () => {
    expect(que('CA1', MEDIAS)).toBe('olvido-a-medias');
    expect(que('ES2', LARGO)).toBe('olvido-a-medias');
    expect(mensajesDespues(p('CA1'), MEDIAS)).toEqual(['M28.4']);
    expect(mensajesDespues(p('CA17'), MEDIAS)).toEqual(['M28.4']);
  });

  it('cuenta como "contó algo" para las que dependen', () => {
    expect(cumple(p('HI9'), r({ HI8: 'No me acuerdo bien cuándo fue, pero el primero nació un invierno y fui corriendo al hospital a conocerlo con mi marido.' }))).toBe(true);
  });

  it('"No sé por dónde empezar…" no es olvido a medias (no se está olvidando de nada)', () => {
    expect(que('CA2', 'No sé por dónde empezar. Mi mamá era muy trabajadora, cosía para afuera y nos criaba a los cuatro sola.')).toBe('conto');
  });

  it('delante de un cierre o de LE9, M26', () => {
    expect(acuseDeTurno('M28.4', 0, '…', p('CI3'))).toBe('M26');
    expect(acuseDeTurno('M28.4', 0, '…', p('CA16'))).toBe('M28.4');
  });

  it('no suma al contador de M29, y tampoco lo corta', () => {
    const orden = ['ES1', 'ES2', 'ES5', 'ES6'];
    const anteriores = new Map<string, string>();
    const acuses = [OLVIDO, LARGO, OLVIDO, OLVIDO].map((resp, i) => {
      const a = mensajesDespues(p(orden[i]), resp, anteriores)[0];
      anteriores.set(orden[i], resp);
      return a;
    });
    expect(acuses).toEqual(['M28', 'M28.4', 'M28', 'M29']);
  });
});

describe('8. AM16 va igual tras paso en AM9; FIN según FO1; M26 delante de AM20', () => {
  it('AM9 [Paso esta] o "paso": no va AM19, AM16 sí', () => {
    for (const am9 of [respuestaDeBoton('Paso esta'), 'Paso']) {
      const resp = r({ AM3: CUENTA, AM9: am9 });
      expect(cumple(p('AM19'), resp)).toBe(false);
      expect(cumple(p('AM16'), resp)).toBe(true);
    }
    expect(cumple(p('AM16'), r({ AM3: CUENTA, AM9: respuestaDeBoton('Seguimos juntos') }))).toBe(false);
  });

  it('FIN sin la frase de la foto si tocó [No tengo foto]; con ella si no', () => {
    const ficha = { nombre: 'Nora', genero: 'mujer' as const };
    const sin = renderizar(p('FIN').texto, ficha, r({ FO1: respuestaDeBoton('No tengo foto') }));
    const con = renderizar(p('FIN').texto, ficha, r({ FO1: sumarAudio('Te la mando.', 'Es del casamiento.') }));
    expect(sin).toBe(
      'Hasta acá llegamos, Nora. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Fue un gusto enorme escucharte.',
    );
    expect(con).toBe(
      'Hasta acá llegamos, Nora. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo. Y si te quedó alguna foto por mandar, mandámela por acá cuando la encuentres: entra igual. Fue un gusto enorme escucharte.',
    );
  });

  it('delante de AM20 el acuse común es M26', () => {
    expect(acuseAntesDe('M3.7', 'M3', p('AM20'))).toBe('M26');
  });
});

// Revisión de la ronda 2 (30/09): la fórmula de cierre tiene que cerrar la frase y vale el tope de 40.
describe('fórmulas de cierre: sin falsos positivos', () => {
  const ci3 = preguntaPorId('CI3')!;
  it.each(['Creo que está todo.', 'Sí, está todo.', 'Nada más, gracias.', 'Ya está, eso es todo lo que me acuerdo.', 'Bueno, es todo por ahora'])('"%s" es no', (r) => {
    expect(interpretar(ci3, r)).toBe('no');
  });
  it.each([
    'Nada más lindo que esos veranos en el río con mis primos, nos tirábamos del puente y mi tía nos esperaba con pan casero.',
    'Ya está, eso es todo lo de la escuela. Ahora que lo pienso, había un chico, Tito, que me llevaba los libros todos los días y un día me regaló una flor que había cortado de la plaza, y la maestra lo vio y lo retó delante de todos, y yo me quería morir de vergüenza.',
  ])('"%s" cuenta algo', (r) => {
    expect(interpretar(ci3, r)).toBe('conto');
  });
});

// Revisión de la ronda 2 (30/09): falsos positivos, con las frases del revisor.
describe('revisión ronda 2: la fórmula de cierre no se come historias', () => {
  it.each([
    'Lo que quiero agregar es todo lo que pasó con mi papá cuando se enfermó',
    'Ya está, quiero agregar lo de mi papá, que murió en el 90',
    'Está todo, sí. Ah, y quiero sumar lo de la abuela Rosa',
    'Nada más, que me acordé de algo: mi tío tenía un taller',
    'Ya está, mi hermano se fue a vivir a Rosario y la casa quedó vacía',
  ])('"%s" cuenta algo (LE9 y CI3)', (resp) => {
    expect(que('LE9', resp)).toBe('conto');
    expect(que('CI3', resp)).toBe('conto');
  });

  it.each(['Creo que está todo.', 'Sí, está todo.', 'Nada más, gracias.', 'Bueno, es todo por ahora', 'Es todo lo que tengo para contar de eso.', 'Sí, está todo. Fue una vida plena.'])(
    '"%s" sigue siendo "no"',
    (resp) => {
      expect(que('LE9', resp)).toBe('no');
      expect(que('CI3', resp)).toBe('no');
    },
  );

  it('los largos que arrancan con "No, creo que está todo…" siguen siendo "no" (Manuel CI1, Nelly CI6)', () => {
    expect(que('CI1', 'No, creo que está todo. Las historias que tengo claras de eso son esas. Después empezó mi vida, la mía de verdad, con mis hermanos, la casa. Lo demás es lo que alcanzaban a contarme de vez en cuando, pero lo que te dije es lo que quedó.')).toBe('no');
    expect(que('CI6', 'No, creo que está todo. La verdad es que mi historia de amor es corta, viste. No fue una vida de película, fue una vida real, simple, con un hijo y trabajo. Está bien así. Ahora tengo mis amigas, mis hijos, mis nietos, mi costura. Eso es lo que llena mi corazón.')).toBe('no');
  });
});

describe('revisión ronda 2: M32.2 no va delante de "Seguimos" o "Pasamos"', () => {
  it('en ese caso va M32.1', () => {
    expect(acuseDeTurno('M32', 1, 'Seguimos con la escuela: la primaria…', p('ES1'))).toBe('M32.1');
    expect(acuseDeTurno('M32', 1, 'Pasamos a tu juventud, Nora…', p('JU1'))).toBe('M32.1');
    expect(acuseDeTurno('M32', 1, 'Contame un día…', p('CA16'))).toBe('M32.2');
  });
});

describe('revisión ronda 2: M32 solo si de verdad se niega', () => {
  it.each([
    'Esa no, la otra casa era la del río. Ahí vivimos hasta que me casé',
    'Otra, dijo mi mamá, y nos sirvió más sopa a todos los chicos',
    'Mejor no, dijo mi tío, y nos fuimos igual a la laguna con las cañas',
    'Me lo guardo, dijo mi papá, y me dio la moneda para el colectivo',
  ])('"%s" cuenta algo, con acuse común', (resp) => {
    expect(que('CA2', resp)).toBe('conto');
    expect(mensajesDespues(p('CA2'), resp)).toEqual(['M3']);
  });

  it('siguen siendo M32', () => {
    expect(mensajesDespues(p('FI7'), 'De eso mejor no hablemos. La política es complicada, tiene opiniones fuertes, y no me interesa meterme ahí para nada.')).toEqual(['M32']);
    expect(mensajesDespues(p('CA2'), 'De eso no. Hay cosas que prefiero guardarme, pero te digo que mi hermano era muy bueno conmigo de chico.')).toEqual(['M32']);
  });
});

describe('revisión ronda 2: olvido corto que cuenta algo es olvido a medias', () => {
  it.each([
    'No me acuerdo, éramos muy chicos y mi mamá nos llevaba a todos lados con el carro del pan.',
    'Ni idea de la fecha, eso sí, me acuerdo de la casa de la calle Sarmiento y del patio.',
  ])('"%s": M28.4', (resp) => {
    expect(que('CA1', resp)).toBe('olvido-a-medias');
    expect(mensajesDespues(p('CA1'), resp)).toEqual(['M28.4']);
  });

  it.each(['No me acuerdo.', 'No me acuerdo bien, pasó hace mucho.', 'Ay, ni idea, querido.', 'Uy, eso no me acuerdo, la memoria me falla.'])('"%s" sigue siendo olvido', (resp) => {
    expect(que('CA1', resp)).toBe('olvido');
  });
});
