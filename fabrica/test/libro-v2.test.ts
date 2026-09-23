import { describe, it, expect, vi } from 'vitest';
import { armarLibroV2 } from '../src/libro/libro-v2.js';

// El orquestador del libro v2: etapas → reparto → capítulos → páginas → control → lector. Sin base:
// lo usan el script de prueba y, al conectar, la fábrica.

const respuesta = (text: string) => ({ finalMessage: async () => ({ content: [{ type: 'text', text }], usage: { input_tokens: 100, output_tokens: 10 } }) });

describe('armarLibroV2', () => {
  it('encadena los pasos, mide, lee y arma el informe; cada oración queda una vez', async () => {
    const stream = vi.fn()
      .mockReturnValueOnce(respuesta('{"etapas":[{"nombre":"Tucumán","desde":0,"hasta":18,"deQueTrata":"x"},{"nombre":"Lanús","desde":19,"hasta":80,"deQueTrata":"y"}],"reflexion":{"nombre":"Lo que aprendí","deQueTrata":"z"}}'))
      .mockReturnValueOnce(respuesta('R2.1 → 2'))                                  // reparto
      .mockReturnValueOnce(respuesta('{"apertura":"Hola.","cierre":"Chau.","suyas":[],"heredadas":[],"muletillas":[]}'))
      .mockReturnValueOnce(respuesta('{"avisos":[]}'));                            // lector
    const escribirCapitulo = vi.fn(async (_q, nombre, material) => ({ texto: `${nombre}: ${material.replace(/^P:.*\n/gm, '')}`, usage: { input_tokens: 1, output_tokens: 1 } }));
    const r = await armarLibroV2({
      cliente: { messages: { stream } } as never,
      quien: { nombre: 'Élida', genero: 'mujer' },
      respuestas: [
        { orden: 1, pregunta: '¿Su casa?', texto: 'La casa de mis abuelos en Tucumán tenía un patio enorme.', fuenteId: 'dia_01' },
        { orden: 13, pregunta: '¿El amor?', texto: 'A Rubén lo conocí en el taller de Lanús.', fuenteId: 'dia_13' },
      ],
      epocas: [{ orden: 1, desde: 0, hasta: 12 }, { orden: 13, desde: null, hasta: null }],
      nombresCorregidos: '', reservados: [], escribirCapitulo,
    });
    expect(r.etapas.map((e) => e.nombre)).toEqual(['Tucumán', 'Lanús', 'Lo que aprendí']);
    expect(escribirCapitulo).toHaveBeenCalledTimes(3);
    expect(r.capitulos[1].texto).toContain('Rubén');
    expect(r.capitulos[0].texto).not.toContain('Rubén');
    expect(r.libroMarkdown).toContain('# A mis lectores');
    expect(r.informe.lector).toEqual([]);
    expect(r.informe.lectorFallo).toBe(false);
    expect(r.gastoUsd).toBeGreaterThan(0);
    // La reflexión no tuvo material: un capítulo escrito de la nada se avisa (y frena).
    expect(r.informe.control.some((c) => c.includes('«Lo que aprendí» se escribió sin material'))).toBe(true);
    expect(r.detalle.afuera).toEqual([]);
  });

  it('si el lector no devuelve una lista, el informe lo dice (y hay que revisar)', async () => {
    const stream = vi.fn()
      .mockReturnValueOnce(respuesta('{"etapas":[{"nombre":"A","desde":0,"hasta":40,"deQueTrata":""},{"nombre":"B","desde":41,"hasta":80,"deQueTrata":""}]}'))
      .mockReturnValueOnce(respuesta('NADA'))
      .mockReturnValueOnce(respuesta('{"apertura":"a","cierre":"b"}'))
      .mockReturnValueOnce(respuesta('no sé'));
    const r = await armarLibroV2({ cliente: { messages: { stream } } as never, quien: { nombre: 'X', genero: null }, respuestas: [{ orden: 1, pregunta: 'p', texto: 'Texto con cinco palabras de contenido importantes aquí.', fuenteId: 'f' }], epocas: [{ orden: 1, desde: 0, hasta: 12 }], nombresCorregidos: '', reservados: [], escribirCapitulo: async (_q, n, m) => ({ texto: m, usage: {} }) });
    expect(r.informe.lectorFallo).toBe(true);
  });
});
