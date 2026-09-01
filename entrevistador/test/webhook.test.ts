import { describe, it, expect } from 'vitest';
import { parsearEntrante } from '../src/whatsapp/webhook.js';

const payloadAudio = {
  entry: [{ changes: [{ value: { messages: [{
    from: '5491155551234', id: 'wamid.X1', type: 'audio', audio: { id: 'media-77' },
  }] } }] }],
};
const payloadTexto = {
  entry: [{ changes: [{ value: { messages: [{
    from: '5491155551234', id: 'wamid.X2', type: 'text', text: { body: 'SÍ' },
  }] } }] }],
};
const payloadEstado = { entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.X3', status: 'delivered' }] } }] }] };

describe('parsearEntrante', () => {
  it('extrae un audio con su media id', () => {
    expect(parsearEntrante(payloadAudio)).toEqual({
      telefono: '+5491155551234', tipo: 'audio', mediaId: 'media-77', waMessageId: 'wamid.X1',
    });
  });
  it('extrae un texto', () => {
    expect(parsearEntrante(payloadTexto)).toMatchObject({ tipo: 'texto', texto: 'SÍ' });
  });
  it('ignora las notificaciones de estado (delivered/read)', () => {
    expect(parsearEntrante(payloadEstado)).toBeNull();
  });
});
