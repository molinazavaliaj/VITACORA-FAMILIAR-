import { describe, expect, it, vi } from 'vitest';
import { armarFrasesJson, proponerCandidatas, type MaterialDeFrase } from '../src/libro/frases.js';

const cliente = {} as never;

function material(orden: number, texto = `texto ${orden}`, extra: Partial<MaterialDeFrase> = {}): MaterialDeFrase {
  return { orden, respuestaId: `r${orden}`, audioPath: `n1/dia_${orden}.ogg`, texto, ...extra };
}

type ArgsProponer = { nombre: string; capitulo: string; material: MaterialDeFrase[] };
type ArgsElegir = { nombre: string; capitulo: string; candidatas: { texto: string; por_que: string }[] };

/** Los mocks reciben (cliente, args), como las funciones reales. */
function depsFalsas(opciones: {
  proponer: (args: ArgsProponer) => { texto: string; por_que: string }[];
  elegir?: (args: ArgsElegir) => { indices: number[]; porQue: string[] };
}) {
  const proponer = vi.fn(async (_cliente: unknown, args: ArgsProponer) => opciones.proponer(args));
  const elegir = vi.fn(async (_cliente: unknown, args: ArgsElegir) =>
    opciones.elegir
      ? opciones.elegir(args)
      : { indices: args.candidatas.slice(0, 3).map((_, i) => i), porQue: args.candidatas.slice(0, 3).map(() => 'la más suya') }
  );
  return { cliente, proponer, elegir };
}

describe('armarFrasesJson', () => {
  it('deja tres frases elegidas por capítulo y saltea el capítulo sin audios', async () => {
    const deps = depsFalsas({
      proponer: (args) => args.material.slice(0, 5).map((m) => ({ texto: m.texto, por_que: 'se repite en la mesa' })),
    });

    const frases = await armarFrasesJson(
      {
        narradorId: 'n1',
        pedidoId: 'p1',
        nombre: 'Joaquín',
        capitulos: [
          { nombre: 'La infancia', numero: 1, material: [1, 2, 3, 4, 5].map((o) => material(o)) },
          { nombre: 'La familia', numero: 6, material: [] },
        ],
      },
      deps as never
    );

    expect(frases.capitulos).toHaveLength(1);
    expect(frases.capitulos[0].capitulo).toBe('La infancia');
    expect(frases.capitulos[0].candidatas).toHaveLength(5);
    expect(frases.capitulos[0].candidatas.filter((c) => c.elegida)).toHaveLength(3);
    expect(frases.capitulos[0].candidatas[0].id).toBe('c01-01');
    expect(frases.capitulos[0].candidatas[0].por_que).toBe('la más suya');
    expect(frases.capitulos[0].candidatas[0].estado).toBe('pendiente');
    expect(frases.capitulos[0].candidatas[0].respuesta_id).toBe('r1');
    expect(frases.capitulos[0].candidatas[0].pregunta_orden).toBe(1);
    expect(frases.capitulos[0].candidatas[0].audio_path).toBeNull();
    expect(frases.confirmado_at).toBeNull();
    expect(frases.version).toBe(1);
    // El capítulo sin audios ni se le pide al modelo.
    expect(deps.proponer).toHaveBeenCalledTimes(1);
  });

  it('no propone nada de una respuesta reservada (entera o por tramo)', async () => {
    const deps = depsFalsas({
      proponer: (args) => args.material.map((m) => ({ texto: m.texto, por_que: 'x' })),
      elegir: (args) => ({ indices: [0], porQue: args.candidatas.map(() => 'x') }),
    });

    const frases = await armarFrasesJson(
      {
        narradorId: 'n1',
        pedidoId: 'p1',
        nombre: 'Joaquín',
        capitulos: [
          {
            nombre: 'La infancia',
            numero: 1,
            material: [
              material(1, 'uno'),
              material(2, 'dos', { reserva: { reservada: true } }),
              material(3, 'tres', { reserva: { reservado_tramo: 'no lo pongas' } }),
            ],
          },
        ],
      },
      deps as never
    );

    const enviados = (deps.proponer as unknown as { mock: { calls: [unknown, ArgsProponer][] } }).mock.calls[0][1];
    expect(enviados.material.map((m) => m.orden)).toEqual([1]);
    expect(frases.capitulos[0].candidatas.map((c) => c.texto)).toEqual(['uno']);
  });

  it('descarta la cita que el modelo retocó (tiene que estar textual en la transcripción)', async () => {
    // Se prueba la función REAL con un cliente falso: el filtro vive adentro de proponerCandidatas
    // y un mock de `proponer` lo taparía (el mismo bug que un mock que devuelve todo).
    const clienteFalso = {
      messages: {
        create: async () => ({
          content: [
            {
              type: 'text',
              text: 'Acá va:\n```json\n{"candidatas":[{"texto":"el campo","por_que":"textual"},{"texto":"el campo de mi abuelo, que era grande","por_que":"inventada"}]}\n```',
            },
          ],
        }),
      },
    } as unknown as Parameters<typeof proponerCandidatas>[0];

    const candidatas = await proponerCandidatas(clienteFalso, {
      nombre: 'Joaquín',
      capitulo: 'La infancia',
      material: [material(1, 'y ahí estaba el campo, con los caballos')],
    });

    expect(candidatas.map((c) => c.texto)).toEqual(['el campo']);
  });

  it('no llama al modelo cuando todas las respuestas del capítulo están reservadas', async () => {
    const deps = depsFalsas({ proponer: () => [] });

    const frases = await armarFrasesJson(
      {
        narradorId: 'n1',
        pedidoId: 'p1',
        nombre: 'Joaquín',
        capitulos: [{ nombre: 'La infancia', numero: 1, material: [material(1, 'uno', { reserva: { reservada: true } })] }],
      },
      deps as never
    );

    expect(frases.capitulos).toHaveLength(0);
    expect(deps.proponer).not.toHaveBeenCalled();
  });

  it('no le paga al modelo por ordenar cuando hay tres candidatas o menos', async () => {
    let elegirLlamado = 0;
    const deps = {
      cliente,
      proponer: vi.fn(async () => [
        { texto: 'una', por_que: 'a' },
        { texto: 'dos', por_que: 'b' },
      ]),
      elegir: vi.fn(async () => {
        elegirLlamado++;
        return { indices: [0, 1], porQue: ['a', 'b'] };
      }),
    };

    const frases = await armarFrasesJson(
      {
        narradorId: 'n1',
        pedidoId: 'p1',
        nombre: 'Joaquín',
        capitulos: [{ nombre: 'La infancia', numero: 1, material: [material(1, 'una'), material(2, 'dos')] }],
      },
      deps as never
    );

    expect(frases.capitulos[0].candidatas.filter((c) => c.elegida)).toHaveLength(2);
    expect(elegirLlamado).toBe(1); // la función se llama, pero no gasta modelo (corta antes)
  });
});
