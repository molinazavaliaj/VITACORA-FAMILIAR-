import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { anotarTranscripcion, guardarAudioV3, guardarFotoV3, guardarTextoV3, marcarRespondido, numeroDeLlegada, ponerClave, yaLlego } from '../../src/v3/filas.js';
import { textoFijo } from '../../src/v3/textos-fijos.js';

describe('las filas de un narrador V3', () => {
  it('el audio se guarda con su número de llegada y su wa_message_id; el reintento de Meta no suma otro', async () => {
    const base = crearBaseFalsa();
    expect(await numeroDeLlegada(base.cliente, 'n1')).toBe(1);
    const fila = await guardarAudioV3(base.cliente, 'n1', 1, Buffer.from('audio'), 'wamid.A');
    expect(fila).not.toBeNull();
    expect(base.tablas.respuestas[0]).toMatchObject({ narrador_id: 'n1', pregunta_orden: 1, audio_path: 'n1/dia_01.ogg', wa_message_id: 'wamid.A' });
    expect(await yaLlego(base.cliente, 'wamid.A')).toBe(true);
    expect(await guardarAudioV3(base.cliente, 'n1', 2, Buffer.from('audio'), 'wamid.A')).toBeNull();
    expect(base.tablas.respuestas).toHaveLength(1);
    expect([...base.archivos.keys()]).toEqual(['audios/n1/dia_01.ogg']); // el archivo del duplicado se borró
    expect(await numeroDeLlegada(base.cliente, 'n1')).toBe(2);
  });

  it('dos audios casi juntos con el mismo número de llegada: los dos se guardan, en archivos distintos', async () => {
    const base = crearBaseFalsa();
    const [a, b] = await Promise.all([
      guardarAudioV3(base.cliente, 'n1', 1, Buffer.from('uno'), 'wamid.X'),
      guardarAudioV3(base.cliente, 'n1', 1, Buffer.from('dos'), 'wamid.Y'),
    ]);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(base.tablas.respuestas.map((r) => r.audio_path).sort()).toEqual(['n1/dia_01.ogg', 'n1/dia_01_2.ogg']);
    expect([...base.archivos.values()].sort()).toEqual(['dos', 'uno']);
  });

  it('transcripción y clave V3 se anotan en la fila', async () => {
    const base = crearBaseFalsa();
    const { id } = (await guardarAudioV3(base.cliente, 'n1', 1, Buffer.from('audio'), 'wamid.B'))!;
    await anotarTranscripcion(base.cliente, id, { texto: 'Nací en un pueblo.', duracionSegundos: 12 });
    await ponerClave(base.cliente, id, 'OR1');
    expect(base.tablas.respuestas[0]).toMatchObject({ transcripcion: 'Nací en un pueblo.', duracion_segundos: 12, clave_v3: 'OR1' });
  });

  it('un botón se guarda como marca en texto_directo, sin transcripción', async () => {
    const base = crearBaseFalsa();
    await guardarTextoV3(base.cliente, 'n1', 3, '⟦botón:No tuve hermanos⟧', { waMessageId: 'wamid.C', clave: 'CA6', esBoton: true });
    expect(base.tablas.respuestas[0]).toMatchObject({ pregunta_orden: 3, texto_directo: '⟦botón:No tuve hermanos⟧', transcripcion: null, clave_v3: 'CA6' });
    expect(await guardarTextoV3(base.cliente, 'n1', 4, 'otro', { waMessageId: 'wamid.C', clave: 'CA6', esBoton: true })).toBeNull();
  });

  it('marcarRespondido apaga la alerta de silencio', async () => {
    const base = crearBaseFalsa({ narradores: [{ id: 'n1', alerta_silencio: true }] });
    await marcarRespondido(base.cliente, 'n1', new Date('2026-10-08T13:00:00Z'));
    expect(base.tablas.narradores[0]).toMatchObject({ alerta_silencio: false, ultima_respuesta_at: '2026-10-08T13:00:00.000Z' });
  });

  it('la foto va al storage y a fotos, sin capítulo y con su número de llegada', async () => {
    const base = crearBaseFalsa();
    const { deps } = depsDePrueba(base);
    const fotoId = await guardarFotoV3(deps, 'n1', 'media-foto', 'image/png', '  En la playa  ', 7);
    expect(base.tablas.fotos[0]).toMatchObject({ id: fotoId, narrador_id: 'n1', capitulo: null, pregunta_orden: 7, epigrafe: 'En la playa', principal: false, storage_path: `n1/fotos/${fotoId}.png` });
    expect(base.archivos.has(`audios/n1/fotos/${fotoId}.png`)).toBe(true);
  });

  it('los textos fijos salen de un solo lugar; lo que no está aprobado no existe', () => {
    expect(textoFijo('fotoSuelta', 'es-AR')).toBe('📷 Guardada.');
    expect(textoFijo('fotoSuelta', 'ca')).toBe('📷 Desada.');
    expect(textoFijo('fotoSuelta', 'es-ES')).toBe('📷 Guardada.');
  });
});
