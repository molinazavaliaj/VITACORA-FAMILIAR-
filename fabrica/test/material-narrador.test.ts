import { describe, it, expect } from 'vitest';
import { cargarMaterialDelNarrador } from '../scripts/material-narrador.js';

// El material que leen `prueba-reparto.ts` (el libro v2 entero) y `releer-libro.ts` (el lector).
// D1 (25/09): lo que la familia excluye o corrige en el tablero (`narradores.edicion`) llega igual
// que en producción, además de lo que se excluye a mano con `--excluir`.

function dbFalsa(narrador: Record<string, unknown>, filas: Record<string, unknown>[]) {
  const builder = (resultado: unknown) => {
    const b: Record<string, unknown> = {
      select: () => b, eq: () => b, is: () => b,
      single: () => Promise.resolve(resultado),
      then: (ok: (v: unknown) => unknown, mal?: (e: unknown) => unknown) => Promise.resolve(resultado).then(ok, mal),
    };
    return b;
  };
  return {
    from: (tabla: string) => {
      if (tabla === 'narradores') return builder({ data: narrador, error: null });
      if (tabla === 'preguntas') return builder({ data: [{ narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'La infancia' }], error: null });
      if (tabla === 'respuestas') return builder({ data: filas, error: null });
      throw new Error(`tabla no mockeada: ${tabla}`);
    },
    storage: { from: () => ({ download: () => Promise.resolve({ data: null, error: { message: 'Object not found', statusCode: '404' } }) }) },
  } as never;
}

const fila = (id: string, transcripcion: string) => ({
  id, pregunta_orden: 1, transcripcion, texto_directo: null, es_repregunta: false, audio_path: `n1/${id}.ogg`, recibido_at: `2026-09-0${id.length}T10:00:00Z`,
});

describe('cargarMaterialDelNarrador', () => {
  it('suma las excluidas del tablero (con sus repreguntas) a las de --excluir y trae las correcciones de la familia', async () => {
    const db = dbFalsa(
      { nombre: 'Rosa', contexto: null, edicion: { excluidas: ['r2'], correcciones: '  Rosa, no Rosana. ' } },
      [fila('r1', 'Nací en Rosario, en la casa de mi abuela.'), fila('r2', 'Esto la familia lo sacó.'), { ...fila('r2b', 'Y esto se va con ella.'), es_repregunta: true }, fila('r3', 'Esto lo saqué a mano.')],
    );
    const m = await cargarMaterialDelNarrador(db, 'n1', ['r3']);
    expect([...m.excluidas].sort()).toEqual(['r2', 'r2b', 'r3']);
    expect(m.respuestas.map((r) => r.texto)).toEqual(['Nací en Rosario, en la casa de mi abuela.']);
    expect(m.correcciones).toBe('Rosa, no Rosana.');
  });

  it('sin edición: nada excluido y sin correcciones', async () => {
    const db = dbFalsa({ nombre: 'Rosa', contexto: null, edicion: null }, [fila('r1', 'Nací en Rosario.')]);
    const m = await cargarMaterialDelNarrador(db, 'n1', []);
    expect(m.excluidas.size).toBe(0);
    expect(m.correcciones).toBeNull();
  });
});
