import { describe, it, expect } from 'vitest';
import {
  leerContextoV2, epocaV2, edadV2, preguntaV2, lineaDeTiempoV2, generoV2, epocaDelGuion, materialDeRespuestas, type ContextoV2, type FilaRespuesta,
} from '../scripts/contexto-v2.js';

// Lo puro del script de prueba del libro v2: de `contexto.v2` (lo escribe el entrevistador) a las
// épocas y la línea de tiempo, y de las filas de la base al material (sin reservado ni bloqueado).

const v2: ContextoV2 = {
  perfil: {
    persona: { genero: { valor: 'hombre' }, edad: { valor: '27' } },
    etapas: [
      { edades: '0-12', anios: '1999-2011', lugar: 'Concordia', conQuien: 'sus padres', queHacia: 'la escuela' },
      { edades: '13-18', lugar: 'Buenos Aires', conQuien: '', queHacia: '' },
    ],
    bisagras: ['A los 12 se mudó a Buenos Aires'],
  },
  secuencia: {
    hechas: [
      // Como los guarda el entrevistador: el objetivo del núcleo trae SU tramo (null en los temas que
      // cruzan la vida) y la hecha, el de `tramoDe` (que a esos les pone 'adulto joven').
      { id: 'presentacion', orden: 0, tramo: null, objetivo: { tipo: 'nucleo', id: 'presentacion', tramo: null, bloque: 'presentacion' } },
      { id: 'casa-infancia', orden: 1, tramo: 'infancia', objetivo: { tipo: 'nucleo', id: 'casa-infancia', tramo: 'infancia', bloque: 'inicio' } },
      { id: 'var-juventud-1', orden: 2, tramo: 'juventud', objetivo: { tipo: 'variable', id: 'var-juventud-1', tramo: 'juventud', desde: 13, hasta: 18 } },
      { id: 'amor', orden: 3, tramo: 'adulto joven', objetivo: { tipo: 'nucleo', id: 'amor', tramo: null, bloque: 'adulto joven' } },
      { id: 'mensaje', orden: 4, tramo: null, objetivo: { tipo: 'nucleo', id: 'mensaje', tramo: null, bloque: 'reflexion' } },
      { id: 'un-dia-de-hoy', orden: 5, tramo: 'hoy', objetivo: { tipo: 'nucleo', id: 'un-dia-de-hoy', tramo: 'hoy', bloque: 'hoy' } },
      { id: 'a-los-quince', orden: 6, tramo: 'juventud', objetivo: { tipo: 'nucleo', id: 'a-los-quince', tramo: 'juventud', bloque: 'juventud' } },
      { id: 'oficio', orden: 7, tramo: 'adulto joven', objetivo: { tipo: 'nucleo', id: 'oficio', tramo: null, bloque: 'adulto joven' } },
    ],
    objetos: [{ orden: 101, tramo: 'infancia' }, { orden: 102, tramo: 'hoy', final: true }],
  },
  preguntasEnviadas: { '0': 'Hola, soy tu biógrafo.', '1': '¿Cómo era tu casa?' },
  repreguntasEnviadas: { '1': '¿Y quién cocinaba?' },
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
    expect(epocaV2(v2, 4)).toEqual({ orden: 4, desde: null, hasta: null, reflexion: true });
    expect(epocaV2(v2, 6)).toEqual({ orden: 6, desde: 13, hasta: 22 });
    expect(epocaV2(v2, 101)).toEqual({ orden: 101, desde: 0, hasta: 12 });               // objeto de la infancia
    expect(epocaV2(v2, 77)).toEqual({ orden: 77, desde: null, hasta: null });            // no se le preguntó
  });

  it('los temas que cruzan la vida (tramo null en el núcleo) quedan sin época, aunque la hecha diga adulto joven', () => {
    expect(epocaV2(v2, 3)).toEqual({ orden: 3, desde: null, hasta: null });             // amor
    expect(epocaV2(v2, 7)).toEqual({ orden: 7, desde: null, hasta: null });             // oficio
  });

  it('"hoy" es su edad de hoy; sin edad, sin época', () => {
    expect(edadV2(v2)).toBe(27);
    expect(epocaV2(v2, 5)).toEqual({ orden: 5, desde: 27, hasta: 27 });
    expect(epocaV2(v2, 102)).toEqual({ orden: 102, desde: 27, hasta: 27 });              // objeto final, de hoy
    const sinEdad: ContextoV2 = { ...v2, perfil: { ...v2.perfil, persona: {} } };
    expect(edadV2(sinEdad)).toBeNull();
    expect(epocaV2(sinEdad, 5)).toEqual({ orden: 5, desde: null, hasta: null });
  });

  it('"segunda mitad" llega hasta su edad (no hasta 200); sin edad, sin época', () => {
    const mayor = (persona: NonNullable<NonNullable<ContextoV2['perfil']>['persona']>): ContextoV2 => ({
      perfil: { persona },
      secuencia: {
        hechas: [{ id: 'var-segunda mitad-1', orden: 9, tramo: 'segunda mitad', objetivo: { tipo: 'nucleo', id: 'x', tramo: 'segunda mitad', bloque: 'segunda mitad' } }],
        objetos: [{ orden: 105, tramo: 'segunda mitad' }],
      },
    });
    expect(epocaV2(mayor({ edad: { valor: '76' } }), 9)).toEqual({ orden: 9, desde: 56, hasta: 76 });
    expect(epocaV2(mayor({ edad: { valor: 'entre 70 y 80' } }), 105)).toEqual({ orden: 105, desde: 56, hasta: 75 });
    expect(epocaV2(mayor({ anioNacimiento: { valor: '1950' } }), 9, 2026)).toEqual({ orden: 9, desde: 56, hasta: 76 });
    expect(epocaV2(mayor({}), 9)).toEqual({ orden: 9, desde: null, hasta: null });
    expect(epocaV2(mayor({ edad: { valor: '40' } }), 9)).toEqual({ orden: 9, desde: null, hasta: null });
  });

  it('el texto de la pregunta es el que recibió; la repregunta si la hay', () => {
    expect(preguntaV2(v2, 1, false)).toBe('¿Cómo era tu casa?');
    expect(preguntaV2(v2, 1, true)).toBe('¿Y quién cocinaba?');
    expect(preguntaV2(v2, 0, true)).toBe('Hola, soy tu biógrafo.');                     // sin repregunta: la pregunta
    expect(preguntaV2(v2, 42, false)).toBe('Pregunta 42');
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
