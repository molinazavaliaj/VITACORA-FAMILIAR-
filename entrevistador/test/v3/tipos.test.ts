import { describe, it, expect } from 'vitest';
import { esGenero, estadoInicial, fichaTexto, MARCA_FOTO, nombreDePila } from '../../src/v3/tipos.js';

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

  it('el nombre de pila (solo OR6) pasa a la ficha de texto si está', () => {
    expect(fichaTexto({ ficha: { nombre: 'Babu', nombrePila: 'Dora', genero: 'mujer' }, idioma: 'es-AR' })).toEqual({ nombre: 'Babu', nombrePila: 'Dora', genero: 'mujer' });
  });

  it('nombre de pila: la primera palabra de narradores.nombre, con mayúscula inicial; nada si falta o da como le dicen', () => {
    expect(nombreDePila('IMMACULADA COLELL', 'Imma')).toBe('Immaculada');
    expect(nombreDePila('Dora', 'Babu')).toBe('Dora');
    expect(nombreDePila('  mariano  perez ', 'Marian')).toBe('Mariano');
    expect(nombreDePila('JEAN-PIERRE DUPONT', 'Juampi')).toBe('Jean-Pierre');
    expect(nombreDePila('ÁNGELES', 'Geli')).toBe('Ángeles');
    expect(nombreDePila('Mariano', 'mariano')).toBeUndefined();
    expect(nombreDePila(null, 'Babu')).toBeUndefined();
    expect(nombreDePila(undefined, 'Babu')).toBeUndefined();
    expect(nombreDePila('   ', 'Babu')).toBeUndefined();
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
