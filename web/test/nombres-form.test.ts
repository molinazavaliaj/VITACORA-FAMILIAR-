import { describe, it, expect } from 'vitest';
import { construirCorreccionesCambiadas, type EntidadPrefill } from '../src/app/tablero/nombres/acciones';

describe('construirCorreccionesCambiadas', () => {
  it('no colisiona dos entidades con el mismo texto detectado (dos "Juan" distintos)', () => {
    const entidades: EntidadPrefill[] = [
      { texto: 'Juan', contexto: 'el padre', valorInicial: 'Juan' },
      { texto: 'Juan', contexto: 'el vecino', valorInicial: 'Juan' },
    ];
    // Fila 0 (el padre) se corrige a "Juan Pérez", fila 1 (el vecino) a "Juancito".
    const valores = ['Juan Pérez', 'Juancito'];

    const correcciones = construirCorreccionesCambiadas(entidades, valores);

    expect(correcciones).toEqual([
      { original: 'Juan', corregido: 'Juan Pérez' },
      { original: 'Juan', corregido: 'Juancito' },
    ]);
  });

  it('omite las filas que no cambiaron respecto del texto original', () => {
    const entidades: EntidadPrefill[] = [
      { texto: 'Rosorio', contexto: 'ciudad natal', valorInicial: 'Rosorio' },
      { texto: 'Martín', contexto: 'el hermano', valorInicial: 'Martín' },
    ];
    const valores = ['Rosario', 'Martín']; // solo la primera cambió

    const correcciones = construirCorreccionesCambiadas(entidades, valores);

    expect(correcciones).toEqual([{ original: 'Rosorio', corregido: 'Rosario' }]);
  });

  it('omite una fila si el valor quedó vacío (no manda una corrección vacía)', () => {
    const entidades: EntidadPrefill[] = [{ texto: 'Rosorio', contexto: 'ciudad natal', valorInicial: 'Rosorio' }];
    const valores = ['   '];

    expect(construirCorreccionesCambiadas(entidades, valores)).toEqual([]);
  });

  it('trimea el valor antes de compararlo y de mandarlo', () => {
    const entidades: EntidadPrefill[] = [{ texto: 'Rosorio', contexto: 'ciudad natal', valorInicial: 'Rosorio' }];
    const valores = ['  Rosario  '];

    expect(construirCorreccionesCambiadas(entidades, valores)).toEqual([
      { original: 'Rosorio', corregido: 'Rosario' },
    ]);
  });

  it('devuelve vacío si no hay entidades', () => {
    expect(construirCorreccionesCambiadas([], [])).toEqual([]);
  });
});
