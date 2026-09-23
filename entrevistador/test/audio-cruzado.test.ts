import { describe, it, expect } from 'vitest';
import { esLaMismaRespuesta, buscarCruce } from '../src/db/duplicados.js';

// El 17/09, cargando los dos pilotos en paralelo, un audio de Ciro se cargó en
// Joaquín: mismo archivo, 38 segundos, dos minutos después del suyo. Quedó en la
// base y su material entró al libro de Joaquín, que leyó el párrafo y dijo "esto me
// lo inventaron" — no lo había dicho él.
//
// Es el error más grave que puede tener este producto: la historia de otra persona
// dentro de tu libro. Y no lo detecta nadie salvo el narrador leyendo el libro final.

describe('esLaMismaRespuesta', () => {
  it('reconoce el mismo texto aunque cambie el espaciado o las mayúsculas', () => {
    expect(
      esLaMismaRespuesta(
        'Me acuerdo que jugábamos mucho con unos muñecos, con unos juguetes.',
        'me acuerdo  que jugábamos mucho con unos MUÑECOS, con unos juguetes'
      )
    ).toBe(true);
  });

  it('reconoce el mismo audio transcripto dos veces, con diferencias mínimas', () => {
    // El mismo audio transcripto para dos narradores da textos casi iguales: el
    // prompt lleva el contexto de cada uno y corrige nombres distintos.
    const a = 'Siempre jugábamos ahí en el balcón y también nos gustaba tirar cosas por el balcón. También jugábamos con un perrito que teníamos.';
    const b = 'Siempre jugábamos ahí en el balcón y también nos gustaba tirar cosas por el balcon. También jugábamos con un perrito que teniamos.';
    expect(esLaMismaRespuesta(a, b)).toBe(true);
  });

  it('dos respuestas distintas no se confunden aunque hablen del mismo tema', () => {
    expect(
      esLaMismaRespuesta(
        'Me acuerdo que jugábamos con unos muñecos en el balcón de casa.',
        'De chico jugaba al fútbol en la calle con los pibes del barrio.'
      )
    ).toBe(false);
  });

  it('un texto corto no alcanza para decidir: dos "sí" no son el mismo audio', () => {
    expect(esLaMismaRespuesta('Sí, claro.', 'Sí, claro.')).toBe(false);
  });
});

describe('buscarCruce', () => {
  const OTRAS = [
    { narrador_id: 'ciro', pregunta_orden: 3, como_le_dicen: 'Ciro', transcripcion: 'Me acuerdo que jugábamos mucho con unos muñecos, con unos juguetes, unas figuras de plástico, ahí en el balcón.' },
    { narrador_id: 'ciro', pregunta_orden: 4, como_le_dicen: 'Ciro', transcripcion: 'El amigo que más me quedó es el famoso e inigualable Pelado Bausa, lo conocí en segundo año del colegio.' },
  ];

  it('encuentra el audio que ya está cargado en otro narrador', () => {
    const cruce = buscarCruce(
      'Me acuerdo que jugábamos mucho con unos muñecos, con unos juguetes, unas figuras de plástico, ahí en el balcón.',
      OTRAS
    );
    expect(cruce).not.toBeNull();
    expect(cruce!.como_le_dicen).toBe('Ciro');
    expect(cruce!.pregunta_orden).toBe(3);
  });

  it('una respuesta nueva de verdad pasa sin problema', () => {
    expect(buscarCruce('Mi viejo se fue a vivir a Chile y fueron seis meses duros.', OTRAS)).toBeNull();
  });

  it('sin nada cargado todavía, no hay con qué chocar', () => {
    expect(buscarCruce('Lo que sea que diga.', [])).toBeNull();
  });
});
