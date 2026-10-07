import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';

describe('la base falsa de los tests V3', () => {
  it('inserta, filtra, ordena y devuelve una sola fila', async () => {
    const base = crearBaseFalsa();
    await base.cliente.from('respuestas').insert([{ narrador_id: 'n1', pregunta_orden: 2 }, { narrador_id: 'n1', pregunta_orden: 1 }, { narrador_id: 'n2', pregunta_orden: 1 }]);
    const { data } = await base.cliente.from('respuestas').select('*').eq('narrador_id', 'n1').order('pregunta_orden');
    expect((data as any[]).map((r) => r.pregunta_orden)).toEqual([1, 2]);
    const { data: una } = await base.cliente.from('respuestas').select('*').eq('narrador_id', 'n2').maybeSingle();
    expect((una as any).pregunta_orden).toBe(1);
    const { count } = await base.cliente.from('respuestas').select('id', { count: 'exact', head: true }).eq('narrador_id', 'n1');
    expect(count).toBe(2);
  });

  it('el update con .select() devuelve las filas tocadas (para el compare-and-swap)', async () => {
    const base = crearBaseFalsa({ entrevistas_v3: [{ narrador_id: 'n1', version: 3 }] });
    const gano = await base.cliente.from('entrevistas_v3').update({ version: 4 }).eq('narrador_id', 'n1').eq('version', 3).select('*');
    expect(gano.data).toHaveLength(1);
    const perdio = await base.cliente.from('entrevistas_v3').update({ version: 5 }).eq('narrador_id', 'n1').eq('version', 3).select('*');
    expect(perdio.data).toHaveLength(0);
  });

  it('wa_message_id es único: el segundo insert da 23505', async () => {
    const base = crearBaseFalsa();
    expect((await base.cliente.from('respuestas').insert({ narrador_id: 'n1', wa_message_id: 'w1' })).error).toBeNull();
    expect((await base.cliente.from('respuestas').insert({ narrador_id: 'n1', wa_message_id: 'w1' })).error?.code).toBe('23505');
    expect((await base.cliente.from('respuestas').insert({ narrador_id: 'n1', wa_message_id: null })).error).toBeNull();
    expect((await base.cliente.from('respuestas').insert({ narrador_id: 'n1', wa_message_id: null })).error).toBeNull();
  });

  it('una tabla ausente contesta 42P01, como Postgres sin la migración', async () => {
    const base = crearBaseFalsa();
    base.ausentes.add('entrevistas_v3');
    expect((await base.cliente.from('entrevistas_v3').select('*')).error?.code).toBe('42P01');
  });

  it('el storage guarda, lista y borra', async () => {
    const base = crearBaseFalsa();
    await base.cliente.storage.from('audios').upload('n1/dia_01.ogg', Buffer.from('hola'), { contentType: 'audio/ogg' });
    const { data } = await base.cliente.storage.from('audios').list('n1');
    expect(data).toEqual([{ name: 'dia_01.ogg' }]);
    expect((await base.cliente.storage.from('audios').upload('n1/dia_01.ogg', Buffer.from('x'))).error).not.toBeNull();
    await base.cliente.storage.from('audios').remove(['n1/dia_01.ogg']);
    expect(base.archivos.size).toBe(0);
  });
});
