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

// ── El botón del SÍ (23/09) ────────────────────────────────────────────────
// Mariano apretó el «SI» que trae la plantilla de la bienvenida. Su respuesta
// llegó a nuestro número con doble tilde y acá se tiraba a la basura: un botón
// no llega como `text`. Le dimos a la gente el camino más fácil para contestar
// y era el único que no escuchábamos.
const entrante = (mensaje: Record<string, unknown>) =>
  ({ entry: [{ changes: [{ value: { messages: [{ from: '5491156386425', id: 'wamid.1', ...mensaje }] } }] }] });

describe('el botón de la plantilla', () => {
  it('el «SI» de una quick reply entra como texto, que es lo que lee el consentimiento', () => {
    const m = parsearEntrante(entrante({ type: 'button', button: { text: 'SI', payload: 'SI' } }));
    expect(m).toMatchObject({ tipo: 'texto', texto: 'SI', telefono: '+5491156386425' });
  });

  it('sin texto visible vale el payload', () => {
    expect(parsearEntrante(entrante({ type: 'button', button: { payload: 'ACEPTO' } })))
      .toMatchObject({ tipo: 'texto', texto: 'ACEPTO' });
  });

  it('los botones interactivos nuestros también, y gana el título sobre el id', () => {
    expect(parsearEntrante(entrante({ type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'si_1', title: 'Sí, dale' } } })))
      .toMatchObject({ tipo: 'texto', texto: 'Sí, dale' });
    expect(parsearEntrante(entrante({ type: 'interactive', interactive: { type: 'list_reply', list_reply: { id: 'x', title: 'Más tarde' } } })))
      .toMatchObject({ tipo: 'texto', texto: 'Más tarde' });
  });

  it('un botón vacío no inventa un mensaje', () => {
    expect(parsearEntrante(entrante({ type: 'button', button: { text: '   ' } }))).toBeNull();
    expect(parsearEntrante(entrante({ type: 'sticker', sticker: { id: 's1' } }))).toBeNull();
  });
});
