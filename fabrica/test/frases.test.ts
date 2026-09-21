import { describe, expect, it, vi } from 'vitest';
import {
  elegirFrases,
  esTextual,
  normalizar,
  seccionesDelLibro,
  type MaterialDeFrase,
} from '../src/libro/frases.js';

const LIBRO = `# A mis lectores

Gracias por leer.

# Volver a arrancar

### La historia de Joaquín, contada por él mismo

# La infancia

Mi infancia fue en la casa de Pelliza.

> el mejor ring que tuve en mi vida fue esa casa

Y después el colegio.

# El oficio

Empecé a trabajar de chico.

> plata y miedo nunca tuve

## Sus frases

*Los dichos, refranes y muletillas de Joaquín, tal cual los dice él.*

### Las suyas

«Soy cada día un poco menos ignorante.»
«Una frase que inventó el modelo y él nunca dijo.»

### Las que heredó

«Salí a buscar lo tuyo.» — su papá, siempre.

### Las muletillas de siempre

«Viste.»
«Al fin y al cabo.»

# El cierre

Hasta acá llegamos.
`;

function material(orden: number, texto: string): MaterialDeFrase {
  return { orden, respuestaId: `r${orden}`, audioPath: `n1/dia_${orden}.ogg`, texto };
}

const CAPITULOS = [
  { numero: 1, nombre: 'La infancia', material: [material(1, 'y ahí estaba el mejor ring que tuve en mi vida fue esa casa con los vidrios')] },
  { numero: 2, nombre: 'El oficio', material: [material(2, 'y plata y miedo nunca tuve literalmente')] },
];

describe('seccionesDelLibro', () => {
  it('saca los capítulos con sus citas y la página «Sus frases», sin contar los títulos de servicio', () => {
    const secciones = seccionesDelLibro(LIBRO);
    // El título del libro y el subtítulo también parecen secciones: el filtro por capítulos
    // conocidos se hace en `elegirFrases` (abajo).
    expect(secciones.capitulos.map((c) => c.nombre)).toEqual([
      'Volver a arrancar',
      'La historia de Joaquín, contada por él mismo',
      'La infancia',
      'El oficio',
    ]);
    expect(secciones.capitulos[2].citas).toEqual(['el mejor ring que tuve en mi vida fue esa casa']);
    expect(secciones.capitulos[3].citas).toEqual(['plata y miedo nunca tuve']);
    // Los subtítulos de la página NO son capítulos (era el bug: apagaban la página entera).
    expect(secciones.capitulos.map((c) => c.nombre)).not.toContain('Las suyas');
    expect(secciones.susFrases.suyas).toEqual([
      'Soy cada día un poco menos ignorante.',
      'Una frase que inventó el modelo y él nunca dijo.',
    ]);
    expect(secciones.susFrases.heredadas).toEqual(['Salí a buscar lo tuyo.']);
    expect(secciones.muletillas).toEqual(['Viste.', 'Al fin y al cabo.']);
  });
});

describe('normalizar y esTextual', () => {
  it('normalizar borra mayúsculas, acentos y puntuación', () => {
    expect(normalizar('El mejor RING, que tuve: ¡en mi vida!')).toBe('el mejor ring que tuve en mi vida');
  });

  it('esTextual acepta la cita con otra puntuación y rechaza la que el modelo inventó', () => {
    const dichos = ['y ahí estaba el mejor ring que tuve en mi vida fue esa casa con los vidrios'];
    expect(esTextual('El mejor ring que tuve en mi vida fue esa casa.', dichos)).toBe(true);
    expect(esTextual('el mejor ring de todos los tiempos', dichos)).toBe(false);
    expect(esTextual('ah', dichos)).toBe(false); // demasiado corta para ser una frase
  });
});

describe('elegirFrases', () => {
  it('solo le ofrece al modelo las candidatas textuales y le pasa los capítulos', async () => {
    let pedido = '';
    const clienteFalso = {
      messages: {
        create: async (params: { messages: { content: string }[] }) => {
          pedido = params.messages[0].content;
          return {
            content: [{ type: 'text', text: JSON.stringify({ elegidas: [{ id: 'cita-1', capitulo: 1, por_que: 'su casa' }] }) }],
            stop_reason: 'end_turn',
          };
        },
      },
    } as unknown as Parameters<typeof elegirFrases>[0];

    const frases = await elegirFrases(clienteFalso, {
      narradorId: 'n1',
      pedidoId: 'p1',
      nombre: 'Joaquín',
      libroMarkdown: LIBRO,
      capitulos: CAPITULOS,
    });

    // La inventada del modelo no aparece en lo que se le ofrece ni en el resultado.
    expect(pedido).not.toContain('nunca dijo');
    // «Soy cada día un poco menos ignorante» está en la página pero él no la dijo en ningún audio.
    expect(pedido).not.toContain('menos ignorante');
    expect(pedido).toContain('el mejor ring que tuve en mi vida fue esa casa');
    expect(pedido).toContain('1: La infancia');

    const infancia = frases.capitulos.find((c) => c.numero === 1);
    expect(infancia?.capitulo).toBe('La infancia');
    // Solo los capítulos que la estructura conoce: ni «Volver a arrancar» ni el subtítulo.
    expect(frases.capitulos.map((c) => c.numero)).toEqual([1, 2]);
    expect(infancia?.candidatas[0]).toMatchObject({
      texto: 'el mejor ring que tuve en mi vida fue esa casa',
      origen: 'cita',
      elegida: true,
      respuesta_id: 'r1',
      pregunta_orden: 1,
      por_que: 'su casa',
      audio_path: null,
    });
    expect(frases.confirmado_at).toBeNull();
  });

  it('encuentra de qué respuesta sale una frase de «Sus frases» aunque viva en otro capítulo', async () => {
    const libro = `# La infancia

> una cita del capítulo

# Sus frases

### Las suyas

«Salí a buscar lo tuyo.»
`;
    const capitulos = [
      { numero: 1, nombre: 'La infancia', material: [material(1, 'acá esa frase no está')] },
      { numero: 2, nombre: 'El oficio', material: [material(2, 'y mi viejo me decía: salí a buscar lo tuyo, siempre')] },
    ];
    const clienteFalso = {
      messages: {
        create: async () => ({
          content: [{ type: 'text', text: JSON.stringify({ elegidas: [{ id: 'sf-1', capitulo: 1, por_que: 'x' }] }) }],
          stop_reason: 'end_turn',
        }),
      },
    } as unknown as Parameters<typeof elegirFrases>[0];

    const frases = await elegirFrases(clienteFalso, {
      narradorId: 'n1',
      pedidoId: 'p1',
      nombre: 'Joaquín',
      libroMarkdown: libro,
      capitulos,
    });

    const elegida = frases.capitulos.find((c) => c.numero === 1)?.candidatas.find((c) => c.elegida);
    expect(elegida?.texto).toBe('Salí a buscar lo tuyo.');
    // El audio sale de la respuesta del capítulo 2: sin esto el worker no sabría qué cortar.
    expect(elegida?.respuesta_id).toBe('r2');
    expect(elegida?.pregunta_orden).toBe(2);
  });

  it('no deja más de tres elegidas por capítulo aunque el modelo se entusiasme', async () => {
    const muchos = new Array(6).fill(0).map((_, i) => `[cita-${i + 1}] «y ahí estaba el mejor ring que tuve en mi vida fue esa casa»`);
    const clienteFalso = {
      messages: {
        create: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ elegidas: muchos.map((_, i) => ({ id: `cita-${i + 1}`, capitulo: 1, por_que: 'x' })) }),
            },
          ],
          stop_reason: 'end_turn',
        }),
      },
    } as unknown as Parameters<typeof elegirFrases>[0];

    const frases = await elegirFrases(clienteFalso, {
      narradorId: 'n1',
      pedidoId: 'p1',
      nombre: 'Joaquín',
      libroMarkdown: LIBRO,
      capitulos: CAPITULOS,
    });
    expect(frases.capitulos[0].candidatas.filter((c) => c.elegida).length).toBeLessThanOrEqual(3);
  });

  it('si el modelo no devuelve JSON, el libro sale sin frases y avisa (no explota)', async () => {
    const clienteFalso = {
      messages: {
        create: async () => ({ content: [{ type: 'text', text: 'no puedo ayudarte' }], stop_reason: 'end_turn' }),
      },
    } as unknown as Parameters<typeof elegirFrases>[0];
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const frases = await elegirFrases(clienteFalso, {
      narradorId: 'n1',
      pedidoId: 'p1',
      nombre: 'Joaquín',
      libroMarkdown: LIBRO,
      capitulos: CAPITULOS,
    });

    expect(frases.capitulos.every((c) => c.candidatas.every((x) => !x.elegida))).toBe(true);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });

  it('reintenta cuando el modelo contesta vacío (el pensamiento se come los tokens)', async () => {
    let llamadas = 0;
    const clienteFalso = {
      messages: {
        create: async () => {
          llamadas++;
          return {
            content: [
              {
                type: 'text',
                text: llamadas === 1 ? '' : JSON.stringify({ elegidas: [{ id: 'cita-1', capitulo: 1, por_que: 'su casa' }] }),
              },
            ],
            stop_reason: llamadas === 1 ? 'max_tokens' : 'end_turn',
          };
        },
      },
    } as unknown as Parameters<typeof elegirFrases>[0];

    const frases = await elegirFrases(clienteFalso, {
      narradorId: 'n1',
      pedidoId: 'p1',
      nombre: 'Joaquín',
      libroMarkdown: LIBRO,
      capitulos: CAPITULOS,
    });

    expect(llamadas).toBe(2);
    expect(frases.capitulos[0].candidatas.some((c) => c.elegida)).toBe(true);
  });
});
