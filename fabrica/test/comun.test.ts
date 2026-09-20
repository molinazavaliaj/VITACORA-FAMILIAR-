import { describe, it, expect, vi } from 'vitest';
import { descargarTextoOpcional, esErrorDeNoEncontrado, textoRespuesta, esPublicable, armarMaterial } from '../src/libro/comun.js';

function dbConDescarga(resultado: { data: unknown; error: unknown }) {
  const download = vi.fn(() => Promise.resolve(resultado));
  return { db: { storage: { from: () => ({ download }) } } as never, download };
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

// Hallazgo 19: en el piloto el narrador dijo "estas historias prefiero que queden
// en mi mente, no en mi biografía" y la transcripción entró entera al libro.
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
