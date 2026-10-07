import { describe, it, expect } from 'vitest';
import { esGenero, estadoInicial, fichaTexto, MARCA_FOTO } from '../../src/v3/tipos.js';

describe('tipos de la entrevista V3', () => {
  it('el estado inicial no tiene nada contestado ni nada en la cola', () => {
    const e = estadoInicial();
    expect(e).toMatchObject({ formato: 1, respuestas: [], enviados: [], bloqueActual: 0, terminada: false, familia: [], charla: [], salientes: [], seq: 0, fallosEnvio: 0 });
    expect(e.vueltas.M3).toBe(0);
    expect(e.esperando).toBeUndefined();
  });

  it('la ficha de texto lleva el idioma solo si no es es-AR (la de siempre)', () => {
    const ficha = { nombre: 'Prueba', genero: 'mujer' as const };
    expect(fichaTexto({ ficha, idioma: 'es-AR' })).toEqual({ nombre: 'Prueba', genero: 'mujer' });
    expect(fichaTexto({ ficha: { ...ficha, quienRegala: 'Laura' }, idioma: 'ca' })).toEqual({ nombre: 'Prueba', genero: 'mujer', quienRegala: 'Laura', idioma: 'ca' });
  });

  it('el género tiene tres valores', () => {
    expect(['varon', 'mujer', 'otro'].every(esGenero)).toBe(true);
    expect(esGenero('hombre')).toBe(false);
    expect(esGenero(undefined)).toBe(false);
  });

  it('la marca de foto es la misma que lee la fábrica', () => {
    expect(MARCA_FOTO).toBe('⟦foto⟧');
  });
});
