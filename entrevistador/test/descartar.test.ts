import { describe, it, expect } from 'vitest';
import {
  rutaDescartada, rutaOriginal, elegirParaReemplazar, descartarRespuesta, restaurarRespuesta, type BaseDescarte,
} from '../src/db/descartar.js';

// Descartar sin borrar (hallazgo 43). El 17/09 el audio de Ciro quedó en la orden 27 de
// Joaquín porque la puerta manual no tenía cómo sacarlo. Pedido de Naza al acordarlo:
// "que no saque audios de más". Por eso: una respuesta por id, nunca por orden; y el
// audio se MUEVE, nunca se borra.

type Paso = string;

function baseFalsa(opciones: {
  fila?: Record<string, unknown> | null;
  descartada?: Record<string, unknown> | null;
  errorRpc?: string;
  errorMover?: string;
} = {}) {
  const pasos: Paso[] = [];
  const base: BaseDescarte = {
    async leerRespuesta(id) {
      pasos.push(`leer ${id}`);
      return (opciones.fila ?? null) as never;
    },
    async leerDescartada(id) {
      pasos.push(`leer-descartada ${id}`);
      return (opciones.descartada ?? null) as never;
    },
    async moverAudio(desde, hasta) {
      pasos.push(`mover ${desde} -> ${hasta}`);
      if (opciones.errorMover) throw new Error(opciones.errorMover);
    },
    async rpc(nombre, args) {
      pasos.push(`rpc ${nombre} ${JSON.stringify(args)}`);
      if (opciones.errorRpc) throw new Error(opciones.errorRpc);
    },
  };
  return { base, pasos };
}

const FILA_27 = { id: 'r27', narrador_id: 'joaquin', pregunta_orden: 27, audio_path: 'joaquin/dia_27.ogg' };

describe('rutas', () => {
  it('el audio descartado va a una subcarpeta, fuera del alcance del audiolibro', () => {
    expect(rutaDescartada('joaquin/dia_27.ogg')).toBe('joaquin/descartadas/dia_27.ogg');
    expect(rutaOriginal('joaquin/descartadas/dia_27.ogg')).toBe('joaquin/dia_27.ogg');
  });
});

describe('elegirParaReemplazar', () => {
  it('con una sola respuesta en la orden, esa es la que se reemplaza', () => {
    expect(elegirParaReemplazar([FILA_27] as never, 27).id).toBe('r27');
  });

  it('con más de una se niega y lista cuáles son: no adivina', () => {
    const dos = [FILA_27, { ...FILA_27, id: 'r27b', audio_path: 'joaquin/dia_27_2.ogg' }];
    expect(() => elegirParaReemplazar(dos as never, 27)).toThrow(/2 respuestas.*r27.*r27b/s);
  });

  it('sin respuesta no hay nada que reemplazar', () => {
    expect(() => elegirParaReemplazar([], 27)).toThrow(/no tiene respuesta/);
  });
});

describe('descartarRespuesta', () => {
  it('mueve el audio y después mueve la fila, con el audio en su lugar nuevo', async () => {
    const { base, pasos } = baseFalsa({ fila: FILA_27 });
    await descartarRespuesta(base, 'r27', 'audio de Ciro');
    expect(pasos).toEqual([
      'leer r27',
      'mover joaquin/dia_27.ogg -> joaquin/descartadas/dia_27.ogg',
      'rpc descartar_respuesta {"p_id":"r27","p_motivo":"audio de Ciro","p_audio_path":"joaquin/descartadas/dia_27.ogg"}',
    ]);
  });

  it('una respuesta sin audio (texto) se descarta sin tocar Storage', async () => {
    const { base, pasos } = baseFalsa({ fila: { ...FILA_27, audio_path: null } });
    await descartarRespuesta(base, 'r27', 'cargada por error');
    expect(pasos.some((p) => p.startsWith('mover'))).toBe(false);
  });

  it('exige un motivo', async () => {
    const { base, pasos } = baseFalsa({ fila: FILA_27 });
    await expect(descartarRespuesta(base, 'r27', '  ')).rejects.toThrow(/motivo/);
    expect(pasos).toEqual([]);
  });

  it('si la respuesta no existe, no toca nada', async () => {
    const { base, pasos } = baseFalsa({ fila: null });
    await expect(descartarRespuesta(base, 'r99', 'x')).rejects.toThrow(/No existe/);
    expect(pasos).toEqual(['leer r99']);
  });

  it('si la base falla, devuelve el audio a su lugar: nunca queda a medias', async () => {
    const { base, pasos } = baseFalsa({ fila: FILA_27, errorRpc: 'function does not exist' });
    await expect(descartarRespuesta(base, 'r27', 'audio de Ciro')).rejects.toThrow(/function does not exist/);
    expect(pasos.at(-1)).toBe('mover joaquin/descartadas/dia_27.ogg -> joaquin/dia_27.ogg');
  });
});

describe('doble falla', () => {
  it('si falla la base y también la vuelta del audio, lo dice con todas las letras', async () => {
    const pasos: string[] = [];
    let movidas = 0;
    const base: BaseDescarte = {
      async leerRespuesta() { return FILA_27 as never; },
      async leerDescartada() { return null; },
      async moverAudio(desde, hasta) {
        pasos.push(`mover ${desde} -> ${hasta}`);
        if (++movidas === 2) throw new Error('se cortó la red');
      },
      async rpc() { throw new Error('function does not exist'); },
    };
    const error = await descartarRespuesta(base, 'r27', 'audio de Ciro').catch((e: Error) => e);
    expect(String(error)).toMatch(/A MANO/);
    expect(String(error)).toContain('joaquin/descartadas/dia_27.ogg');
    expect(String(error)).toContain('function does not exist');
  });
});

describe('restaurarRespuesta', () => {
  it('devuelve el audio a su carpeta y la fila a respuestas', async () => {
    const { base, pasos } = baseFalsa({ descartada: { ...FILA_27, audio_path: 'joaquin/descartadas/dia_27.ogg' } });
    await restaurarRespuesta(base, 'r27');
    expect(pasos).toEqual([
      'leer-descartada r27',
      'mover joaquin/descartadas/dia_27.ogg -> joaquin/dia_27.ogg',
      'rpc restaurar_respuesta {"p_id":"r27","p_audio_path":"joaquin/dia_27.ogg"}',
    ]);
  });

  it('si la base falla, el audio vuelve a descartadas', async () => {
    const { base, pasos } = baseFalsa({
      descartada: { ...FILA_27, audio_path: 'joaquin/descartadas/dia_27.ogg' }, errorRpc: 'duplicate key',
    });
    await expect(restaurarRespuesta(base, 'r27')).rejects.toThrow(/duplicate key/);
    expect(pasos.at(-1)).toBe('mover joaquin/dia_27.ogg -> joaquin/descartadas/dia_27.ogg');
  });
});
