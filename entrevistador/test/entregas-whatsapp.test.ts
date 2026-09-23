import { describe, it, expect, vi } from 'vitest';

import { parsearEntregas } from '../src/whatsapp/entregas.js';

// 23/09: el 21 salieron tres bienvenidas, las tres con id de Meta, y las tres
// personas dicen que no les llegó nada. `wa_message_id` solo dice que Meta
// ACEPTÓ el mensaje. Estos avisos son los que dicen si LLEGÓ.
const webhook = (statuses: unknown[]) => ({ entry: [{ changes: [{ value: { statuses } }] }] });

describe('los avisos de entrega de Meta', () => {
  it('traduce los cuatro estados que nos importan', () => {
    const avisos = parsearEntregas(webhook([
      { id: 'wamid.1', status: 'sent', timestamp: '1790000000' },
      { id: 'wamid.2', status: 'delivered', timestamp: '1790000001' },
      { id: 'wamid.3', status: 'read', timestamp: '1790000002' },
      { id: 'wamid.4', status: 'failed', timestamp: '1790000003' },
    ]));
    expect(avisos.map((a) => a.estado)).toEqual(['enviado', 'entregado', 'leido', 'fallido']);
  });

  it('un fallo trae el código y el detalle: es lo que hay que leer para saber por qué no llegó', () => {
    const [a] = parsearEntregas(webhook([{
      id: 'wamid.9', status: 'failed', timestamp: '1790000000',
      errors: [{ code: 131026, title: 'Message undeliverable', error_data: { details: 'Receiver is incapable of receiving this message' } }],
    }]));
    expect(a.errorCodigo).toBe(131026);
    expect(a.errorDetalle).toContain('Message undeliverable');
    expect(a.errorDetalle).toContain('incapable of receiving');
  });

  it('el timestamp de Meta viene en segundos', () => {
    const [a] = parsearEntregas(webhook([{ id: 'w', status: 'delivered', timestamp: '1790000000' }]));
    expect(a.momento).toBe(new Date(1790000000000).toISOString());
  });

  it('sin timestamp vale ahora, no rompe', () => {
    expect(parsearEntregas(webhook([{ id: 'w', status: 'read' }]))[0].momento).toMatch(/^\d{4}-/);
  });

  it('un webhook de mensaje entrante no trae avisos, y no explota', () => {
    expect(parsearEntregas({ entry: [{ changes: [{ value: { messages: [{ id: 'x' }] } }] }] })).toEqual([]);
    expect(parsearEntregas(null)).toEqual([]);
    expect(parsearEntregas({})).toEqual([]);
  });

  it('un estado que no conocemos se ignora en vez de guardarse mal', () => {
    expect(parsearEntregas(webhook([{ id: 'w', status: 'deleted' }, { status: 'read' }]))).toEqual([]);
  });
});
