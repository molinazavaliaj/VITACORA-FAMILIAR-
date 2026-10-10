import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub de todas las env vars: enviar.ts carga el config completo al ejecutarse.
vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'token-prueba');
vi.stubEnv('WA_PHONE_NUMBER_ID', '999');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

describe('enviar', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ messages: [{ id: 'wamid.ABC' }] }), { status: 200 },
    )));
  });

  it('envía texto libre al endpoint de Meta y devuelve el id', async () => {
    const { enviarTexto } = await import('../src/whatsapp/enviar.js');
    const id = await enviarTexto('+5491155551234', 'Hola Don Roberto');
    expect(id).toBe('wamid.ABC');
    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toContain('/999/messages');
    const body = JSON.parse(init.body);
    expect(body.type).toBe('text');
    expect(body.to).toBe('+5491155551234');
  });

  it('sin timeoutMs no cambia nada (el flujo viejo); con timeoutMs, el pedido lleva un AbortSignal', async () => {
    const { enviarTexto, enviarBotones, enviarPlantilla } = await import('../src/whatsapp/enviar.js');
    await enviarTexto('+5491155551234', 'Hola');
    expect((fetch as any).mock.calls[0][1].signal).toBeUndefined();
    await enviarTexto('+5491155551234', 'Hola', { timeoutMs: 20_000 });
    await enviarBotones('+5491155551234', '¿Sí?', ['Sí'], { timeoutMs: 20_000 });
    await enviarPlantilla('+5491155551234', 'pregunta_diaria_vos', ['x'], 'es', { timeoutMs: 20_000 });
    for (const llamada of (fetch as any).mock.calls.slice(1)) expect(llamada[1].signal).toBeInstanceOf(AbortSignal);
  });

  it('envía plantilla con variables de cuerpo', async () => {
    const { enviarPlantilla } = await import('../src/whatsapp/enviar.js');
    await enviarPlantilla('+5491155551234', 'pregunta_diaria', ['Don Roberto', '¿Cómo era su casa?']);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.type).toBe('template');
    expect(body.template.name).toBe('pregunta_diaria');
    expect(body.template.components[0].parameters).toHaveLength(2);
  });
  it('plantilla con botón de URL: el sufijo va como parámetro del botón 0 (regalo el día elegido)', async () => {
    const { enviarPlantilla } = await import('../src/whatsapp/enviar.js');
    await enviarPlantilla('+5491155551234', 'regalo_entrega_vos', ['abuelo', 'Lucía'], 'es', { botonUrl: 'VF-7K3M2Q' });
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.template.components).toEqual([
      { type: 'body', parameters: [{ type: 'text', text: 'abuelo' }, { type: 'text', text: 'Lucía' }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: 'VF-7K3M2Q' }] },
    ]);
  });
  it('manda botones de respuesta rápida (interactive/button)', async () => {
    const { enviarBotones } = await import('../src/whatsapp/enviar.js');
    await enviarBotones('+5491155551234', '¿Tuviste hermanos?', ['Sí, tuve', 'No tuve hermanos']);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.type).toBe('interactive');
    expect(body.interactive.type).toBe('button');
    expect(body.interactive.body.text).toBe('¿Tuviste hermanos?');
    expect(body.interactive.action.buttons).toEqual([
      { type: 'reply', reply: { id: 'b1', title: 'Sí, tuve' } },
      { type: 'reply', reply: { id: 'b2', title: 'No tuve hermanos' } },
    ]);
  });

  it('la plantilla va en el idioma que se le pide (por defecto, es)', async () => {
    const { enviarPlantilla } = await import('../src/whatsapp/enviar.js');
    await enviarPlantilla('+34600000000', 'pregunta_diaria_ca', ['Com era casa teva?'], 'ca');
    await enviarPlantilla('+5491155551234', 'recordatorio', ['Prueba']);
    expect(JSON.parse((fetch as any).mock.calls[0][1].body).template.language.code).toBe('ca');
    expect(JSON.parse((fetch as any).mock.calls[1][1].body).template.language.code).toBe('es');
  });
});
