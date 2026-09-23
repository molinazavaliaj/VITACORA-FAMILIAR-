import { describe, it, expect } from 'vitest';
import { auditarMaterial, type FilaMaterial } from '../src/db/auditar-material.js';

// La prueba de material (biógrafo v2, 23/09). Antes de escribir un libro hay que poder
// afirmar que lo que le damos de comer al escritor es de esta persona. El 17/09 un audio
// de Ciro quedó en la orden 27 de Joaquín y nadie lo vio hasta que él leyó su libro.
// Estos casos están calcados de ese día.

const MUNECOS =
  'Me acuerdo que jugábamos mucho con unos muñecos, con unos juguetes, unas figuras de plástico. ' +
  'Siempre jugábamos ahí en el balcón y también nos gustaba tirar cosas por el balcón.';
const CHILE =
  'No, bueno, mi papá se fue a vivir a Chile y fueron seis meses donde había que administrar la casa, ' +
  'y yo con mi mamá nos quedamos solos, fue un momento difícil para todos nosotros.';

function fila(p: Partial<FilaMaterial> & Pick<FilaMaterial, 'narrador_id' | 'pregunta_orden'>): FilaMaterial {
  return {
    id: `${p.narrador_id}-${p.pregunta_orden}-${p.audio_path ?? 'x'}`,
    audio_path: `${p.narrador_id}/dia_${p.pregunta_orden}.ogg`,
    // Corta a propósito (menos del mínimo para comparar): los casos de cruce ponen su texto.
    transcripcion: `Respuesta ${p.pregunta_orden} de ${p.narrador_id}.`,
    es_repregunta: false,
    recibido_at: '2026-09-10T12:00:00Z',
    ...p,
  };
}

describe('auditarMaterial', () => {
  it('marca GRAVE el audio de otro narrador (el caso del 17/09)', () => {
    const filas = [
      fila({ narrador_id: 'ciro', pregunta_orden: 3, transcripcion: MUNECOS, audio_path: 'ciro/dia_03.ogg', recibido_at: '2026-09-17T17:06:00Z' }),
      fila({ narrador_id: 'joaquin', pregunta_orden: 27, transcripcion: MUNECOS, audio_path: 'joaquin/dia_27.ogg', recibido_at: '2026-09-17T17:08:00Z' }),
    ];
    const avisos = auditarMaterial('joaquin', filas, { ciro: 'Ciro' });
    const graves = avisos.filter((a) => a.nivel === 'grave');
    expect(graves).toHaveLength(1);
    expect(graves[0].tipo).toBe('cruce');
    expect(graves[0].orden).toBe(27);
    expect(graves[0].audios).toEqual(['joaquin/dia_27.ogg', 'ciro/dia_03.ogg']);
    expect(graves[0].respuestas).toEqual([filas[1].id]);
    expect(graves[0].detalle).toContain('Ciro');
  });

  it('marca GRAVE el mismo audio cargado dos veces en el mismo narrador', () => {
    const filas = [
      fila({ narrador_id: 'joaquin', pregunta_orden: 4, transcripcion: CHILE, audio_path: 'joaquin/dia_04.ogg' }),
      fila({ narrador_id: 'joaquin', pregunta_orden: 9, transcripcion: CHILE, audio_path: 'joaquin/dia_09.ogg' }),
    ];
    const graves = auditarMaterial('joaquin', filas, {}).filter((a) => a.nivel === 'grave');
    expect(graves).toHaveLength(1);
    expect(graves[0].tipo).toBe('repetida');
  });

  it('marca para REVISAR una carga a menos de 10 minutos de la de otro narrador', () => {
    const filas = [
      fila({ narrador_id: 'ciro', pregunta_orden: 4, recibido_at: '2026-09-17T17:11:00Z' }),
      fila({ narrador_id: 'joaquin', pregunta_orden: 27, transcripcion: CHILE, audio_path: 'joaquin/dia_27_2.ogg', es_repregunta: true, recibido_at: '2026-09-17T17:16:00Z' }),
      fila({ narrador_id: 'joaquin', pregunta_orden: 30, recibido_at: '2026-09-18T09:00:00Z' }),
    ];
    const revisar = auditarMaterial('joaquin', filas, { ciro: 'Ciro' }).filter((a) => a.nivel === 'revisar');
    expect(revisar.map((a) => a.orden)).toEqual([27]);
    expect(revisar[0].tipo).toBe('intercalada');
  });

  it('una pregunta con respuesta y repregunta es solo informativa', () => {
    const filas = [
      fila({ narrador_id: 'joaquin', pregunta_orden: 5, audio_path: 'joaquin/dia_05.ogg' }),
      fila({ narrador_id: 'joaquin', pregunta_orden: 5, audio_path: 'joaquin/dia_05_2.ogg', es_repregunta: true,
        transcripcion: 'Otra cosa totalmente distinta que contó en la repregunta, sobre su tía y lo que le contó hace poco.' }),
    ];
    const avisos = auditarMaterial('joaquin', filas, {});
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ nivel: 'info', tipo: 'varias-en-orden', orden: 5 });
    expect(avisos[0].audios).toEqual(['joaquin/dia_05.ogg', 'joaquin/dia_05_2.ogg']);
  });

  it('una respuesta sin audio es informativa: no se puede verificar escuchando', () => {
    const filas = [fila({ narrador_id: 'joaquin', pregunta_orden: 19, audio_path: null, transcripcion: 'No, no tengo hijos.' })];
    const avisos = auditarMaterial('joaquin', filas, {});
    expect(avisos).toEqual([expect.objectContaining({ nivel: 'info', tipo: 'sin-audio', orden: 19 })]);
  });

  it('muchas respuestas sin audio van en un solo aviso', () => {
    const filas = [3, 1, 2].map((o) => fila({ narrador_id: 'osvaldo', pregunta_orden: o, audio_path: null }));
    const avisos = auditarMaterial('osvaldo', filas, {});
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ tipo: 'sin-audio', orden: 1 });
    expect(avisos[0].detalle).toContain('orden 1, 2, 3');
  });

  it('la carga intercalada nombra la carga ajena más cercana, no la primera', () => {
    const filas = [
      fila({ narrador_id: 'ciro', pregunta_orden: 3, recibido_at: '2026-09-17T17:06:00Z' }),
      fila({ narrador_id: 'ciro', pregunta_orden: 4, recibido_at: '2026-09-17T17:11:00Z' }),
      fila({ narrador_id: 'joaquin', pregunta_orden: 27, recibido_at: '2026-09-17T17:08:00Z' }),
    ];
    const [aviso] = auditarMaterial('joaquin', filas, { ciro: 'Ciro' });
    expect(aviso.detalle).toContain('orden 3');
  });

  it('una respuesta sin audio no mete un audio inventado en la lista a escuchar', () => {
    const filas = [
      fila({ narrador_id: 'ciro', pregunta_orden: 4, recibido_at: '2026-09-17T17:11:00Z' }),
      fila({ narrador_id: 'joaquin', pregunta_orden: 27, audio_path: null, recibido_at: '2026-09-17T17:16:00Z' }),
    ];
    const revisar = auditarMaterial('joaquin', filas, {}).find((a) => a.tipo === 'intercalada')!;
    expect(revisar.audios).toEqual([]);
  });

  it('respuestas cortas iguales ("sí, claro") no son un cruce', () => {
    const filas = [
      fila({ narrador_id: 'ciro', pregunta_orden: 1, transcripcion: 'Sí, claro.', recibido_at: '2026-09-10T12:00:00Z' }),
      fila({ narrador_id: 'joaquin', pregunta_orden: 1, transcripcion: 'Sí, claro.', recibido_at: '2026-09-12T12:00:00Z' }),
    ];
    expect(auditarMaterial('joaquin', filas, {}).filter((a) => a.nivel !== 'info')).toEqual([]);
  });

  it('solo audita al narrador pedido y ordena grave → revisar → info', () => {
    const filas = [
      fila({ narrador_id: 'joaquin', pregunta_orden: 19, audio_path: null }),
      fila({ narrador_id: 'ciro', pregunta_orden: 3, transcripcion: MUNECOS, recibido_at: '2026-09-17T17:06:00Z' }),
      fila({ narrador_id: 'joaquin', pregunta_orden: 27, transcripcion: MUNECOS, recibido_at: '2026-09-17T17:08:00Z' }),
    ];
    const avisos = auditarMaterial('joaquin', filas, { ciro: 'Ciro' });
    expect(avisos.map((a) => a.nivel)).toEqual(['grave', 'revisar', 'info']);
    expect(auditarMaterial('nadie', filas, {})).toEqual([]);
  });
});
