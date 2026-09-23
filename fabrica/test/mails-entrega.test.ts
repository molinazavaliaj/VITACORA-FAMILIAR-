import { describe, it, expect } from 'vitest';
import { asuntoHito, cuerpoHito, CANDADO_POR_HITO, type Hito } from '../src/mail/hitos.js';

// Los mails de lo físico (3t.26 fase 2). Textos aprobados por Naza el 23/09; este
// archivo los fija palabra por palabra, como el resto de los textos de la casa: si
// alguien los cambia sin pasar por ella, un test se pone rojo.

const HITOS_NUEVOS: Hito[] = ['falta_direccion', 'enviado', 'entregado'];

describe('los mails de la entrega', () => {
  it('cada hito nuevo tiene su candado propio en Storage', () => {
    for (const hito of HITOS_NUEVOS) {
      expect(CANDADO_POR_HITO[hito]).toMatch(/\.txt$/);
    }
    // Candados distintos: un mail no puede tapar a otro.
    const candados = HITOS_NUEVOS.map((h) => CANDADO_POR_HITO[h]);
    expect(new Set(candados).size).toBe(candados.length);
  });

  it('«falta la dirección» pregunta a dónde va y dice por qué no se imprime todavía', () => {
    expect(asuntoHito('falta_direccion', 'abuela')).toBe('¿A dónde mandamos el libro de tu abuela?');

    const cuerpo = cuerpoHito('falta_direccion', { comoLeDicen: 'abuela', enlace: 'https://x/tablero/1' });
    expect(cuerpo).toContain('está listo para imprimirse, pero todavía no sabemos a dónde mandarlo');
    expect(cuerpo).toContain('Hasta que no esté, no podemos empezar a imprimir');
    expect(cuerpo).toContain('Poner la dirección');
  });

  it('«va en camino» avisa que salió de la imprenta', () => {
    expect(asuntoHito('enviado', 'abuela')).toBe('El libro de tu abuela va en camino');

    const cuerpo = cuerpoHito('enviado', { comoLeDicen: 'abuela', enlace: 'https://x/tablero/1' });
    expect(cuerpo).toContain('Salió de la imprenta');
    expect(cuerpo).toContain('Ver cómo va');
  });

  it('«va en camino» lleva el número de seguimiento cuando existe, y sin él no lo inventa', () => {
    const con = cuerpoHito('enviado', {
      comoLeDicen: 'abuela',
      enlace: 'https://x/tablero/1',
      seguimiento: '1234ABC',
    });
    expect(con).toContain('1234ABC');
    expect(con).toContain('para seguirlo');

    const sin = cuerpoHito('enviado', { comoLeDicen: 'abuela', enlace: 'https://x/tablero/1' });
    expect(sin).not.toContain('para seguirlo');
    // Y sigue siendo un mail que se entiende: la noticia es que salió.
    expect(sin).toContain('Salió de la imprenta');
  });

  it('«llegó» cuenta lo de los códigos y recién al final pide la reseña', () => {
    expect(asuntoHito('entregado', 'abuela')).toBe('El libro de tu abuela ya está en casa');

    const cuerpo = cuerpoHito('entregado', { comoLeDicen: 'abuela', enlace: 'https://x/resena' });
    expect(cuerpo).toContain('en manos de tu familia');
    expect(cuerpo).toContain('Acerca el teléfono a los códigos del libro');
    expect(cuerpo).toContain('Si te emocionó, cuéntalo');
    expect(cuerpo).toContain('Contar cómo fue');

    // El pedido de reseña va después de la emoción, no antes.
    expect(cuerpo.indexOf('códigos del libro')).toBeLessThan(cuerpo.indexOf('Si te emocionó'));
  });

  it('el mail de «libro listo» ya no promete el audiolibro, que se descartó el 20/09', () => {
    const cuerpo = cuerpoHito('libro_listo', { comoLeDicen: 'abuela', enlace: 'https://x/tablero/1' });
    expect(cuerpo).not.toContain('audiolibro');
    expect(cuerpo).toContain('sus mejores frases con su voz real');
  });

  it('los cuatro hablan de «tú», como el resto de los mails de la casa', () => {
    for (const hito of [...HITOS_NUEVOS, 'libro_listo' as Hito]) {
      const cuerpo = cuerpoHito(hito, { comoLeDicen: 'abuela', enlace: 'https://x' });
      expect(cuerpo).not.toMatch(/\b(podés|querés|tenés|entrá|dejanos|acercá|contalo|escuchá)\b/i);
    }
  });

  it('el nombre que le dicen se escapa: un apodo con comillas no rompe el HTML', () => {
    const cuerpo = cuerpoHito('entregado', { comoLeDicen: '<b>abu</b>', enlace: 'https://x' });
    expect(cuerpo).not.toContain('<b>abu</b>');
    expect(cuerpo).toContain('&lt;b&gt;abu&lt;/b&gt;');
  });
});
