import { describe, it, expect } from 'vitest';
import { porId } from '../src/viaje-v2/banco.js';
import { renderizar, datosDeCompra, marcasDe } from '../src/viaje-v2/texto.js';
import type { Compra } from '../src/viaje-v2/tipos.js';

const COMPRA: Compra = {
  nombre: 'Lucía',
  salida: '2026-10-10',
  vuelta: '2026-10-17',
  zonaCasa: 'America/Argentina/Buenos_Aires',
  zonaViaje: 'Europe/Madrid',
  regalo: { quienRegala: 'Tomás' },
  preguntasPropias: ['¿qué comiste?'],
  formato: 'impreso',
  fotosAlbum: 20,
};

describe('viaje v2: renderizar', () => {
  it('{{nombre}}, {{quien_regala}} y {{formato}} en BIEN-1R', () => {
    const t = renderizar(porId('BIEN-1R').texto, datosDeCompra(COMPRA));
    expect(t).toMatch(/^Hola, Lucía\. Te escribo porque Tomás te hizo un regalo: un libro impreso con tu viaje/);
    expect(t).not.toContain('{{');
  });

  it('{{formato}} en PDF y {{fotos_album}}', () => {
    const pdf = datosDeCompra({ ...COMPRA, formato: 'pdf', fotosAlbum: 40 });
    expect(renderizar(porId('BIEN-1').texto, pdf)).toContain('tenés un libro en PDF con tu viaje');
    expect(renderizar(porId('AL1').texto, pdf)).toContain('Juntá las 40 fotos del viaje');
  });

  it('{{pregunta}} va tal cual, sin corregir, entre «»', () => {
    const t = renderizar(porId('PR-R').texto, { ...datosDeCompra(COMPRA), pregunta: '¿qué comiste?' });
    expect(t).toBe('Hoy la pregunta no es mía, es de Tomás: «¿qué comiste?». Contale a esa persona, aunque me lo mandes a mí. Si hay foto, va.');
  });

  it('si el texto usa un dato que falta, error claro con el nombre del dato', () => {
    const sinRegalo = datosDeCompra({ ...COMPRA, regalo: undefined });
    expect(() => renderizar(porId('BIEN-1R').texto, sinRegalo)).toThrow(/quien_regala/);
    expect(() => renderizar(porId('PR-P').texto, sinRegalo)).toThrow(/pregunta/);
    expect(() => renderizar('Hola {{apodo}}', sinRegalo)).toThrow(/apodo/);
  });

  it('un texto sin marcas queda igual; marcasDe lista las que usa', () => {
    expect(renderizar(porId('ACM1').texto, datosDeCompra(COMPRA))).toBe('Ya está, gracias.');
    expect(marcasDe(porId('BIEN-1R').texto)).toEqual(['nombre', 'quien_regala', 'formato']);
  });

  it('todos los textos del banco se pueden llenar con una compra completa', () => {
    const datos = { ...datosDeCompra(COMPRA), pregunta: 'x' };
    // Se importa acá para no depender del orden de los describe.
    return import('../src/viaje-v2/banco.js').then(({ BANCO }) => {
      for (const f of BANCO) {
        expect(renderizar(f.texto, datos), f.id).not.toContain('{{');
        if (f.yaDeViaje) expect(renderizar(f.yaDeViaje, datos), f.id).not.toContain('{{');
      }
    });
  });
});
