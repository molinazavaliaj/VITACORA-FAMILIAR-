import { describe, it, expect } from 'vitest';
import {
  leerContextoV2, epocaV2, lineaDeTiempoV2, generoV2, epocaDelGuion, materialDeRespuestas, type ContextoV2, type FilaRespuesta,
} from '../scripts/contexto-v2.js';

// Lo puro del script de prueba del libro v2: de `contexto.v2` (lo escribe el entrevistador) a las
// épocas y la línea de tiempo, y de las filas de la base al material (sin reservado ni bloqueado).

const v2: ContextoV2 = {
  perfil: {
    persona: { genero: { valor: 'hombre' } },
    etapas: [
      { edades: '0-12', anios: '1999-2011', lugar: 'Concordia', conQuien: 'sus padres', queHacia: 'la escuela' },
      { edades: '13-18', lugar: 'Buenos Aires', conQuien: '', queHacia: '' },
    ],
    bisagras: ['A los 12 se mudó a Buenos Aires'],
  },
  secuencia: {
    hechas: [
      { id: 'presentacion', orden: 0, tramo: null, objetivo: { tipo: 'nucleo', id: 'presentacion', bloque: 'presentacion' } },
      { id: 'casa-infancia', orden: 1, tramo: 'infancia', objetivo: { tipo: 'nucleo', id: 'casa-infancia', bloque: 'infancia' } },
      { id: 'var-juventud-1', orden: 2, tramo: 'juventud', objetivo: { tipo: 'variable', id: 'var-juventud-1', tramo: 'juventud', desde: 13, hasta: 18 } },
      { id: 'amor', orden: 3, tramo: 'adulto joven', objetivo: { tipo: 'nucleo', id: 'amor', bloque: 'adulto joven' } },
      { id: 'mensaje', orden: 4, tramo: null, objetivo: { tipo: 'nucleo', id: 'mensaje', bloque: 'reflexion' } },
      { id: 'dia-de-hoy', orden: 5, tramo: 'hoy', objetivo: { tipo: 'nucleo', id: 'dia-de-hoy', bloque: 'hoy' } },
    ],
    objetos: [{ orden: 101, tramo: 'infancia' }, { orden: 102, tramo: 'hoy', final: true }],
  },
  preguntasEnviadas: { '1': '¿Cómo era tu casa?' },
};

describe('contexto v2 → épocas', () => {
  it('reconoce el estado v2 solo si tiene perfil y secuencia', () => {
    expect(leerContextoV2({ v2 })).toBe(v2);
    expect(leerContextoV2({ modoRapido: true })).toBeNull();
    expect(leerContextoV2(null)).toBeNull();
    expect(leerContextoV2({ v2: { perfil: {} } })).toBeNull();
  });

  it('cada orden toma la época de su pregunta', () => {
    expect(epocaV2(v2, 0)).toEqual({ orden: 0, desde: null, hasta: null });             // presentación: sin época
    expect(epocaV2(v2, 1)).toEqual({ orden: 1, desde: 0, hasta: 12 });                   // tramo del núcleo
    expect(epocaV2(v2, 2)).toEqual({ orden: 2, desde: 13, hasta: 18 });                  // la variable, su propio rango
    expect(epocaV2(v2, 3)).toEqual({ orden: 3, desde: 23, hasta: 35 });
    expect(epocaV2(v2, 4)).toEqual({ orden: 4, desde: null, hasta: null, reflexion: true });
    expect(epocaV2(v2, 5)).toEqual({ orden: 5, desde: null, hasta: null });             // "hoy" no es una edad
    expect(epocaV2(v2, 101)).toEqual({ orden: 101, desde: 0, hasta: 12 });               // objeto de la infancia
    expect(epocaV2(v2, 102)).toEqual({ orden: 102, desde: null, hasta: null });
    expect(epocaV2(v2, 77)).toEqual({ orden: 77, desde: null, hasta: null });            // no se le preguntó
  });

  it('la línea de tiempo: una etapa por línea, y las bisagras', () => {
    expect(lineaDeTiempoV2(v2)).toBe([
      '- 0-12 (1999-2011): Concordia · con sus padres · la escuela',
      '- 13-18: Buenos Aires',
      '- Bisagra: A los 12 se mudó a Buenos Aires',
    ].join('\n'));
    expect(lineaDeTiempoV2({ perfil: {}, secuencia: {} })).toBe('');
  });

  it('el género, solo si es uno de los dos', () => {
    expect(generoV2(v2)).toBe('hombre');
    expect(generoV2({ perfil: { persona: { genero: null } } })).toBeNull();
  });

  it('el guion viejo (Joaquín) sigue con su mapeo', () => {
    expect(epocaDelGuion(1, 'La Infancia')).toEqual({ orden: 1, desde: 0, hasta: 12 });
    expect(epocaDelGuion(2, 'Las raíces')).toEqual({ orden: 2, desde: 0, hasta: 12 });
    expect(epocaDelGuion(3, 'La juventud')).toEqual({ orden: 3, desde: 13, hasta: 22 });
    expect(epocaDelGuion(9, 'La sabiduría')).toEqual({ orden: 9, desde: null, hasta: null, reflexion: true });
    expect(epocaDelGuion(5, 'El amor')).toEqual({ orden: 5, desde: null, hasta: null });
  });
});

describe('materialDeRespuestas', () => {
  const fila = (id: string, orden: number, texto: string, extra: Partial<FilaRespuesta> = {}): FilaRespuesta => ({
    id, pregunta_orden: orden, es_repregunta: false, audio_path: null, recibido_at: `2026-09-2${orden % 10}`, transcripcion: texto, texto_directo: null, ...extra,
  });

  it('deja afuera lo excluido y lo reservado; lo reservado va a la lista del lector', () => {
    const { respuestas, reservados } = materialDeRespuestas([
      fila('c', 3, 'La tercera.', { es_repregunta: true }),
      fila('a', 1, 'Mi casa era chica. Mi tío era contrabandista.', { reservado_tramo: 'Mi tío era contrabandista.' }),
      fila('b', 2, 'Esto no va.', { reservada: true }),
      fila('x', 4, 'Esto es de otro narrador.'),
      fila('d', 5, 'Con audio.', { audio_path: 'n1/dia_05.ogg' }),
    ], new Set(['x']), (orden, repregunta) => `P${orden}${repregunta ? 'r' : ''}`);
    expect(respuestas).toEqual([
      { orden: 1, pregunta: 'P1', texto: 'Mi casa era chica.', fuenteId: 'orden_1' },
      { orden: 3, pregunta: 'P3r', texto: 'La tercera.', fuenteId: 'orden_3_repregunta' },
      { orden: 5, pregunta: 'P5', texto: 'Con audio.', fuenteId: 'dia_05.ogg' },
    ]);
    expect(reservados).toEqual(['Mi tío era contrabandista.', 'Esto no va.']);
    expect(respuestas.some((r) => r.texto.includes('otro narrador'))).toBe(false);
  });
});
