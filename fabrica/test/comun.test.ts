import { describe, it, expect, vi } from 'vitest';
import {
  armarContextoDeTemas,
  armarMaterial,
  descargarTextoOpcional,
  esErrorDeNoEncontrado,
  esPublicable,
  parsearJsonTolerante,
  subirTexto,
  textoRespuesta,
  type RespuestaPublicable,
} from '../src/libro/comun.js';

function dbConDescarga(resultado: { data: unknown; error: unknown }) {
  const download = vi.fn(() => Promise.resolve(resultado));
  return { db: { storage: { from: () => ({ download }) } } as never, download };
}

function dbConSubida(resultado: { data: unknown; error: unknown } = { data: { path: 'x' }, error: null }) {
  const upload = vi.fn(() => Promise.resolve(resultado));
  return { db: { storage: { from: () => ({ upload }) } } as never, upload };
}

describe('esErrorDeNoEncontrado', () => {
  it('reconoce las formas en que Storage dice "no está"', () => {
    expect(esErrorDeNoEncontrado({ message: 'Object not found' })).toBe(true);
    expect(esErrorDeNoEncontrado({ message: 'The resource was not found', statusCode: '404' })).toBe(true);
    expect(esErrorDeNoEncontrado({ message: 'x', statusCode: 404 })).toBe(true);
    expect(esErrorDeNoEncontrado({ message: 'x', status: 404 })).toBe(true);
    expect(esErrorDeNoEncontrado({ message: 'x', statusCode: '400', error: 'not_found' })).toBe(true);
  });

  it('cualquier otro error no es "no está"', () => {
    expect(esErrorDeNoEncontrado({ message: 'fetch failed' })).toBe(false);
    expect(esErrorDeNoEncontrado({ message: 'Internal server error', statusCode: '500' })).toBe(false);
    expect(esErrorDeNoEncontrado({ message: 'new row violates row-level security policy', statusCode: '403' })).toBe(false);
    expect(esErrorDeNoEncontrado(null)).toBe(false);
    expect(esErrorDeNoEncontrado('no existe')).toBe(false);
  });
});

describe('descargarTextoOpcional', () => {
  it('el archivo está → su texto', async () => {
    const { db } = dbConDescarga({ data: { text: async () => 'hola' }, error: null });
    expect(await descargarTextoOpcional(db, 'n1/paquete/x.md')).toBe('hola');
  });

  it('no está (Object not found) → null', async () => {
    const { db } = dbConDescarga({ data: null, error: { message: 'Object not found', statusCode: '404' } });
    expect(await descargarTextoOpcional(db, 'n1/paquete/x.md')).toBeNull();
  });

  it('un fallo transitorio de Storage tira en vez de hacerse pasar por "no está"', async () => {
    const { db } = dbConDescarga({ data: null, error: { message: 'fetch failed', statusCode: '500' } });
    await expect(descargarTextoOpcional(db, 'n1/paquete/x.md')).rejects.toThrow('No se pudo descargar n1/paquete/x.md: fetch failed');
  });
});

// El bucket `audios` sirve copias cacheadas de los objetos, y lo que sube esta función lo leen
// tres actores (la fábrica, el worker de la PC de audio y la web): se vio en serio que dos
// lecturas seguidas del mismo `frases.json` recién subido devolvieron resultados distintos.
// Por eso TODO lo que sube `subirTexto` va con el cache-control más bajo que acepta el SDK.
describe('subirTexto', () => {
  it('sube sin caché, con el contentType que le pasen (el caso frases.json)', async () => {
    const { db, upload } = dbConSubida();

    await subirTexto(db, 'n1/paquete/frases.json', '{"version":1}', 'application/json');

    expect(upload).toHaveBeenCalledWith('n1/paquete/frases.json', '{"version":1}', {
      contentType: 'application/json',
      cacheControl: '0',
      upsert: true,
    });
  });

  it('sin contentType sube markdown, también sin caché (borradores de capítulo y de libro)', async () => {
    const { db, upload } = dbConSubida();

    await subirTexto(db, 'n1/paquete/borrador_cap_01.md', 'Nací en Rosario.');

    expect(upload).toHaveBeenCalledWith('n1/paquete/borrador_cap_01.md', 'Nací en Rosario.', {
      contentType: 'text/markdown',
      cacheControl: '0',
      upsert: true,
    });
  });

  it('un error de Storage tira con la ruta (un borrador que no sube no puede pasar por cacheado)', async () => {
    const { db } = dbConSubida({ data: null, error: { message: 'fetch failed' } });

    await expect(subirTexto(db, 'n1/paquete/borrador_libro.md', 'texto'))
      .rejects.toThrow('No se pudo subir n1/paquete/borrador_libro.md: fetch failed');
  });
});

// Hallazgo 19: en el piloto el narrador dijo "estas historias prefiero que queden en
// mi mente, no en mi biografía" y la transcripción entró entera al libro.
describe('lo que el narrador pidió reservar', () => {
  it('sin reserva, el texto sale como siempre (transcripción primero)', () => {
    expect(textoRespuesta({ transcripcion: '  Contó la historia.  ', texto_directo: 'otra cosa' }))
      .toBe('Contó la historia.');
    expect(textoRespuesta({ transcripcion: '  ', texto_directo: 'Lo escribió él.' })).toBe('Lo escribió él.');
    // Sin las columnas (la migración todavía no está aplicada), no cambia nada.
    expect(textoRespuesta({ transcripcion: 'Contó la historia.', texto_directo: null })).toBe('Contó la historia.');
  });

  it('una respuesta entera reservada no se publica', () => {
    expect(textoRespuesta({ transcripcion: 'Estas historias que queden en mi mente.', texto_directo: null, reservada: true }))
      .toBeNull();
    expect(esPublicable({ reservada: true })).toBe(false);
  });

  // El audio no se puede recortar: una reserva parcial también deja el audio afuera,
  // y alcanza con el tramo solo (la columna se puede escribir a mano).
  it('un tramo reservado, solo, también deja el audio afuera', () => {
    expect(esPublicable({ reservado_tramo: 'locuras de las contables pueden ser por amor' })).toBe(false);
    expect(esPublicable({ reservado_tramo: '   ' })).toBe(true);
    expect(esPublicable({})).toBe(true);
  });

  it('un tramo reservado se quita del texto y el resto se publica', () => {
    const texto = 'Trabajaba con las contables: locuras de las contables pueden ser por amor, y después volvía.';
    expect(textoRespuesta({
      transcripcion: texto, texto_directo: null, reservada: true,
      reservado_tramo: 'locuras de las contables pueden ser por amor',
    })).toBe('Trabajaba con las contables: , y después volvía.');
    expect(esPublicable({ reservada: true })).toBe(false);
  });

  // Si el tramo no está textual (el modelo lo parafraseó), sacarlo no sacaría
  // nada y lo reservado se publicaría igual: se reserva la respuesta entera.
  it('un tramo que no aparece en la transcripción reserva la respuesta entera', () => {
    expect(textoRespuesta({
      transcripcion: 'Trabajaba con las contables y hacíamos locuras por amor.',
      texto_directo: null, reservada: true, reservado_tramo: 'las locuras de las contables',
    })).toBeNull();
  });

  it('un tramo vacío reserva la respuesta entera', () => {
    expect(textoRespuesta({ transcripcion: 'Contó algo.', texto_directo: null, reservada: true, reservado_tramo: '   ' }))
      .toBeNull();
  });

  it('armarMaterial (el material del escritor y la historia completa) las saltea', () => {
    const preguntas = new Map([[1, { texto: '¿Y aquella historia?' }]]);
    const respuestas = new Map([[1, [
      { transcripcion: 'Estas historias que queden en mi mente.', texto_directo: null, reservada: true },
      { transcripcion: 'Y después me mudé a Lanús.', texto_directo: null },
    ]]]);

    const material = armarMaterial([1], preguntas, respuestas);

    expect(material).toContain('Y después me mudé a Lanús.');
    expect(material).not.toContain('queden en mi mente');
  });
});

// La marca `tema_de_orden` (columnas nuevas de `respuestas`, las escribe el
// entrevistador): el narrador contesta una pregunta y adentro cuenta una
// historia de otro tema. El caso real: contesta la 9 y la historia es de la 2 —
// hasta hoy el libro la publicaba en el capítulo equivocado.
describe('la marca tema_de_orden', () => {
  // Un libro de tres capítulos, uno por orden: la 1, la 2 y la 9.
  const capitulos = [{ ordenes: [1] }, { ordenes: [2] }, { ordenes: [9] }];
  const preguntas = new Map([
    [1, { texto: '¿Dónde naciste?' }],
    [2, { texto: '¿Cómo conociste a tu pareja?' }],
    [9, { texto: '¿Qué le dirías a tus nietos?' }],
  ]);
  const historiaDeLa2 = 'La conocí en un baile del club, en el 62.';
  /** El material de hoy, sin marcas: la guardia contra el cambio de comportamiento. */
  const materialDeHoy: Record<number, string> = {
    1: 'P: ¿Dónde naciste?\nR: En Rosario.',
    2: 'P: ¿Cómo conociste a tu pareja?\nR: La conocí bailando.',
    9: `P: ¿Qué le dirías a tus nietos?\nR: ${historiaDeLa2}`,
  };

  /**
   * Las respuestas del libro con la marca que se quiera en la de la orden 9 (la
   * que cuenta una historia de otro tema). Sin marca = como hoy, cuando las
   * columnas todavía no existen.
   */
  function respuestasConMarca(marca: Record<string, unknown>): Map<number, RespuestaPublicable[]> {
    return new Map<number, RespuestaPublicable[]>([
      [1, [{ id: 'r1', transcripcion: 'En Rosario.', texto_directo: null }]],
      [2, [{ id: 'r2', transcripcion: 'La conocí bailando.', texto_directo: null }]],
      [9, [{ id: 'r9', transcripcion: historiaDeLa2, texto_directo: null, ...marca }]],
    ]);
  }

  it('sin marcas (o sin las columnas) el material de cada capítulo es EXACTAMENTE el de hoy', () => {
    const respuestas = respuestasConMarca({});
    const temas = armarContextoDeTemas(capitulos, respuestas);

    for (const orden of [1, 2, 9]) {
      expect(armarMaterial([orden], preguntas, respuestas, temas)).toBe(materialDeHoy[orden]);
      // Byte por byte igual que sin el contexto: el camino de hoy.
      expect(armarMaterial([orden], preguntas, respuestas, temas)).toBe(
        armarMaterial([orden], preguntas, respuestas)
      );
    }

    // `tema_de_orden: null` es "la columna existe pero sin marca": tampoco cambia una letra.
    const conNull = respuestasConMarca({ tema_de_orden: null, tema_motivo: null });
    expect(armarMaterial([9], preguntas, conNull, armarContextoDeTemas(capitulos, conNull))).toBe(
      materialDeHoy[9]
    );

    // La historia completa no cambia ni con la marca puesta: ya tiene todas las
    // respuestas, cada una en su propia pregunta, y no es de nadie más.
    const conMarca = respuestasConMarca({ tema_de_orden: 2, tema_motivo: 'cuenta cómo conoció a su mujer' });
    expect(armarMaterial([1, 2, 9], preguntas, conMarca)).toBe(
      [1, 2, 9].map((orden) => materialDeHoy[orden]).join('\n\n')
    );
  });

  it('la respuesta de la 9 que trata el tema de la 2 se SUMA al capítulo de la 2 y en el de la 9 queda la aclaración', () => {
    const respuestas = respuestasConMarca({ tema_de_orden: 2, tema_motivo: 'cuenta cómo conoció a su mujer' });
    const temas = armarContextoDeTemas(capitulos, respuestas);

    // Sumada al capítulo de su tema: con la pregunta de ESE tema, y avisando que
    // la historia no salió de esa pregunta.
    expect(armarMaterial([2], preguntas, respuestas, temas)).toBe(
      'P: ¿Cómo conociste a tu pareja?\nR: La conocí bailando.\n\n' +
        `P: ¿Cómo conociste a tu pareja? (lo contó respondiendo otra pregunta)\nR: ${historiaDeLa2}`
    );

    // Y sigue estando donde la contó (nunca se mueve ni se saca de ningún lado),
    // con la aclaración de a qué capítulo va.
    expect(armarMaterial([9], preguntas, respuestas, temas)).toBe(
      `${materialDeHoy[9]}\n(recuerdo de otro tema: ya va en el capítulo 2)`
    );

    // El capítulo 1 no la ve: solo suma al capítulo de su tema.
    expect(armarMaterial([1], preguntas, respuestas, temas)).not.toContain('baile del club');
  });

  it('una marca hacia una orden del MISMO capítulo no aclara nada ni repite la historia', () => {
    const capitulosJuntos = [{ ordenes: [1] }, { ordenes: [2, 9] }];
    const respuestas = respuestasConMarca({ tema_de_orden: 2 });
    const temas = armarContextoDeTemas(capitulosJuntos, respuestas);

    const material = armarMaterial([2, 9], preguntas, respuestas, temas);

    expect(material).not.toContain('recuerdo');
    expect(material).not.toContain('respondiendo otra pregunta');
    // Una sola vez: la respuesta ya está en el capítulo por su propia orden.
    expect(material.split(historiaDeLa2).length - 1).toBe(1);
    expect(material).toBe(`${materialDeHoy[2]}\n\n${materialDeHoy[9]}`);
  });

  it('una marca que no se entiende se ignora en silencio, sin tirar', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // `mockRestore` limpia el historial del espía, así que el conteo se guarda adentro.
    let cantidadDeAvisos = 0;

    try {
      // 77 y -1 son enteros de una orden que no está en el libro; 2.5 no es una
      // orden; 'dos' es lo que puede dejar un tipeo humano en una columna nueva.
      for (const marca of [77, -1, 2.5, 'dos']) {
        const respuestas = respuestasConMarca({ tema_de_orden: marca });
        const temas = armarContextoDeTemas(capitulos, respuestas);

        expect(armarMaterial([9], preguntas, respuestas, temas)).toBe(materialDeHoy[9]);
        expect(armarMaterial([2], preguntas, respuestas, temas)).toBe(materialDeHoy[2]);
      }
      cantidadDeAvisos = aviso.mock.calls.length;
    } finally {
      aviso.mockRestore();
    }

    // La marca rara deja rastro para poder buscarla; lo que no hace es tirar.
    expect(cantidadDeAvisos).toBeGreaterThan(0);
  });

  it('una marca hacia una pregunta que no está en ningún capítulo no inventa un número', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // La pregunta 2 existe pero quedó sin responder: no está en ningún capítulo.
    const capitulosSinLa2 = [{ ordenes: [1] }, { ordenes: [9] }];
    const respuestas = respuestasConMarca({ tema_de_orden: 2 });

    try {
      const temas = armarContextoDeTemas(capitulosSinLa2, respuestas);
      expect(armarMaterial([9], preguntas, respuestas, temas)).toBe(materialDeHoy[9]);
      expect(armarMaterial([1], preguntas, respuestas, temas)).not.toContain('baile del club');
    } finally {
      aviso.mockRestore();
    }
  });

  it('una respuesta reservada tampoco se suma al capítulo de su tema (hallazgo 19)', () => {
    const respuestas = respuestasConMarca({ tema_de_orden: 2, reservada: true });
    const temas = armarContextoDeTemas(capitulos, respuestas);

    expect(armarMaterial([2], preguntas, respuestas, temas)).toBe(materialDeHoy[2]);
    // De la respuesta reservada no se publica nada: ni en su capítulo ni en el del tema.
    expect(armarMaterial([9], preguntas, respuestas, temas)).toBe('');
  });
});

// Vivía en voz/conectores.ts (borrado el 23/09) y ahí se probaba por el camino
// de los conectores; ahora lo usa «Su voz» (frases.ts) y se prueba solo.
describe('parsearJsonTolerante', () => {
  it('lee el JSON aunque venga entre fences y con texto alrededor', () => {
    expect(parsearJsonTolerante('Acá va:\n```json\n{"elegidas": [1, 2]}\n```\nListo.')).toEqual({ elegidas: [1, 2] });
  });

  it('tira si no hay ningún objeto', () => {
    expect(() => parsearJsonTolerante('no hay nada')).toThrow('no hay un objeto JSON');
  });
});
