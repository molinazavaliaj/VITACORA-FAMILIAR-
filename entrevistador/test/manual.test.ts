import { describe, it, expect } from 'vitest';
import {
  parsearArgs, slug, ordenDeArchivo, archivoCanonico, proximoOrden,
  mensajeDePregunta, despedida, bienvenidaAceptacion, planDeCarga, esAudio, promptDeTranscripcion, primeraDiferencia,
} from '../src/manual/puro.js';

// La puerta manual resuelve con archivos lo que el webhook resuelve con
// `mediaId`. Lo que se testea acá es lo que decide QUÉ hace con cada archivo:
// el orden, el nombre canónico y el texto que sale para el narrador.

describe('parsearArgs', () => {
  it('separa comando, posicionales y flags con y sin valor', () => {
    const a = parsearArgs(['cargar', 'imma', 'dia_03.ogg', '--orden', '3', '--repregunta']);
    expect(a.comando).toBe('cargar');
    expect(a.posicionales).toEqual(['imma', 'dia_03.ogg']);
    expect(a.flags).toEqual({ orden: '3', repregunta: true });
  });

  it('acepta --flag=valor y no se come un flag del valor del anterior', () => {
    const a = parsearArgs(['cargar-carpeta', 'imma', 'audios-crudos/imma', '--desde=7', '--si']);
    expect(a.flags).toEqual({ desde: '7', si: true });
  });

  it('un flag al final sin valor queda en true (no se pierde)', () => {
    expect(parsearArgs(['siguiente', 'imma', '--solo-ver']).flags['solo-ver']).toBe(true);
  });
});

describe('slug', () => {
  it('normaliza el nombre del narrador para la carpeta de audios', () => {
    expect(slug('Pequeña Imma')).toBe('pequena-imma');
    expect(slug('Don Osvaldo')).toBe('don-osvaldo');
    expect(slug('  NAZA  ')).toBe('naza');
  });
});

describe('ordenDeArchivo / archivoCanonico', () => {
  it('lee el orden y el sufijo del nombre canónico', () => {
    expect(ordenDeArchivo('dia_07.ogg')).toEqual({ orden: 7, sufijo: 1 });
    expect(ordenDeArchivo('dia_07_2.ogg')).toEqual({ orden: 7, sufijo: 2 });
    expect(ordenDeArchivo('dia_30.opus')).toEqual({ orden: 30, sufijo: 1 });
  });

  it('devuelve null con una nota de voz recién bajada (ahí manda la base)', () => {
    expect(ordenDeArchivo('PTT-20260914-WA0007.ogg')).toBeNull();
    expect(ordenDeArchivo('audio')).toBeNull();
  });

  it('va y vuelve sin perder el nombre que espera el audiolibro', () => {
    expect(archivoCanonico(7)).toBe('dia_07.ogg');
    expect(archivoCanonico(7, 1)).toBe('dia_07.ogg');
    expect(archivoCanonico(7, 2)).toBe('dia_07_2.ogg');
    expect(archivoCanonico(1, 10)).toBe('dia_01_10.ogg');
    expect(ordenDeArchivo(archivoCanonico(12, 3))).toEqual({ orden: 12, sufijo: 3 });
  });
});

describe('esAudio', () => {
  it('reconoce lo que sale de WhatsApp y lo que exporta un celular', () => {
    expect(esAudio('dia_01.ogg')).toBe(true);
    expect(esAudio('nota.OPUS')).toBe(true);
    expect(esAudio('voz.m4a')).toBe(true);
    expect(esAudio('LEEME.md')).toBe(false);
    expect(esAudio('sin-extension')).toBe(false);
  });
});

describe('proximoOrden', () => {
  it('sin preguntas enviadas todavía, arranca en la 1', () => {
    expect(proximoOrden(0, [])).toBe(1);
  });

  it('si la pregunta vigente sigue sin responder, el audio es de ESA pregunta', () => {
    expect(proximoOrden(4, [1, 2, 3])).toBe(4);
  });

  it('si ya la respondió, el audio que llega es de la siguiente', () => {
    expect(proximoOrden(4, [1, 2, 3, 4])).toBe(5);
  });

  it('la repregunta del mismo día no adelanta el orden', () => {
    // Las repreguntas no entran en la lista de respondidas: por eso sigue en 5.
    expect(proximoOrden(4, [1, 2, 3, 4])).toBe(5);
  });
});

describe('planDeCarga', () => {
  it('reparte el lote consecutivo desde la orden que toca', () => {
    const plan = planDeCarga(['a.ogg', 'b.ogg', 'c.ogg'], 5);
    expect(plan).toEqual([
      { archivo: 'a.ogg', orden: 5, sufijo: 1 },
      { archivo: 'b.ogg', orden: 6, sufijo: 1 },
      { archivo: 'c.ogg', orden: 7, sufijo: 1 },
    ]);
  });

  it('en modo repregunta todos van a la misma orden, con sufijo creciente', () => {
    const plan = planDeCarga(['a.ogg', 'b.ogg'], 5, true);
    expect(plan.map((p) => [p.orden, p.sufijo])).toEqual([[5, 2], [5, 3]]);
  });
});

describe('los textos que lee el narrador', () => {
  it('el mensaje es el MISMO que arma el camino de WhatsApp en preguntar.ts', () => {
    expect(mensajeDePregunta('¿Cómo era su escuela?'))
      .toBe('La pregunta de hoy: ¿Cómo era su escuela?\n\nCuando quiera, me responde con un audio. Sin apuro. 🎙️');
  });

  it('el mensaje NO lleva saludo: se sacó el 2026-09-14 (costaba el 70% de la entrevista)', () => {
    const mensaje = mensajeDePregunta('¿Cómo era su casa?');
    expect(mensaje).not.toContain('Ayer');
    expect(mensaje.startsWith('La pregunta de hoy:')).toBe(true);
  });

  it('la despedida es la misma de cierre.ts (acá se imprime, no se manda)', () => {
    expect(despedida('Don Osvaldo')).toContain('Don Osvaldo... llegamos al final del viaje.');
    expect(despedida('Doña Dora')).toContain('Su historia ya está siendo convertida en su libro.');
  });
});

// El caso que motivó todo esto: un narrador porteño diciendo "mi viejo llegando
// de laburar a las 8 de la noche" se transcribía como "llegando de la URA".
// El contexto que arma esta función es lo que lo corrige.
describe('promptDeTranscripcion', () => {
  it('con un narrador sin datos, igual sopla el vocabulario rioplatense', () => {
    const prompt = promptDeTranscripcion({}, 'Joaquín');
    expect(prompt).toContain('laburar');
    expect(prompt).toContain('Joaquín');
    expect(prompt).toContain('castellano rioplatense');
  });

  it('usa el árbol familiar y los datos de vida que ya cargó la familia', () => {
    const prompt = promptDeTranscripcion({
      arbol: { padres: 'Ramón y Haydée', conyuge: 'Élida', hijos: '' },
      lugarNacimiento: 'Avellaneda',
      oficio: 'mecánico',
      anioNacimiento: 1952,
    }, 'Don Osvaldo');
    expect(prompt).toContain('Ramón y Haydée');
    expect(prompt).toContain('Élida');
    expect(prompt).toContain('Avellaneda');
    expect(prompt).toContain('mecánico');
    // Las entradas vacías del árbol no ensucian el prompt.
    expect(prompt).not.toContain('hijos:');
  });

  it('recorta datosExtra: el prompt se corta a ~224 tokens', () => {
    const prompt = promptDeTranscripcion({ datosExtra: 'x'.repeat(5000) }, 'Alguien');
    expect(prompt.length).toBeLessThan(600);
    expect(prompt).toContain('x'.repeat(200));
  });

  it('no mete "no tuvo" en el prompt: eso no es un nombre y ensucia el sesgo', () => {
    // Caso real: el árbol de una narradora trae conyuge: 'no tuvo' y el prompt
    // terminaba diciendo "Personas de su vida: michele es su padre; no tuvo".
    const prompt = promptDeTranscripcion({
      arbol: { padres: 'michele es su padre', conyuge: 'no tuvo', hijos: '', hermanos: 'N/A' },
    }, 'Pequeña Imma');
    expect(prompt).toContain('michele es su padre');
    expect(prompt).not.toContain('no tuvo');
    expect(prompt).not.toContain('N/A');
  });
});

describe('primeraDiferencia', () => {
  it('marca dónde cambió la transcripción al retranscribir', () => {
    expect(primeraDiferencia('llegando de laburar', 'llegando de la URA')).toBe(14);
  });

  it('devuelve -1 cuando el texto es idéntico', () => {
    expect(primeraDiferencia('igual', 'igual')).toBe(-1);
  });

  it('si uno es prefijo del otro, marca el final del corto', () => {
    expect(primeraDiferencia('hola', 'hola mundo')).toBe(4);
  });
});

describe('los seis textos fijos, en los dos tratos', () => {
  it('la cola de la pregunta, en usted', () => {
    expect(mensajeDePregunta('¿Cómo era su casa?')).toBe(
      'La pregunta de hoy: ¿Cómo era su casa?\n\nCuando quiera, me responde con un audio. Sin apuro. 🎙️',
    );
  });

  it('la cola de la pregunta, en vos', () => {
    expect(mensajeDePregunta('¿Cómo era tu casa?', 'vos')).toBe(
      'La pregunta de hoy: ¿Cómo era tu casa?\n\nCuando quieras, me respondés con un audio. Sin apuro. 🎙️',
    );
  });

  it('la despedida, en usted', () => {
    expect(despedida('Don Osvaldo')).toBe(
      'Don Osvaldo... llegamos al final del viaje. Treinta charlas, una vida entera. Fue un honor enorme escucharlo. Su historia ya está siendo convertida en su libro.',
    );
  });

  it('la despedida, en vos', () => {
    expect(despedida('Ciro', 'vos')).toBe(
      'Ciro... llegamos al final del viaje. Treinta charlas, una vida entera. Fue un honor enorme escucharte. Tu historia ya está siendo convertida en tu libro.',
    );
  });

  it('la bienvenida, en usted', () => {
    expect(bienvenidaAceptacion('Don Osvaldo')).toBe(
      '¡Qué alegría, Don Osvaldo! Mañana a la mañana le llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre usted y yo, a su ritmo. 📖',
    );
  });

  it('la bienvenida, en vos', () => {
    expect(bienvenidaAceptacion('Ciro', 'vos')).toBe(
      '¡Qué alegría, Ciro! Mañana a la mañana te llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre vos y yo, a tu ritmo. 📖',
    );
  });
});
