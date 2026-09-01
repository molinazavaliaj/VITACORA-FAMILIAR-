import { describe, it, expect } from 'vitest';
describe('scaffold', () => {
  it('el cliente servidor exige las env vars', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { crearClienteServidor } = await import('../src/lib/supabase/servidor');
    expect(() => crearClienteServidor()).toThrow(/Supabase/);
  });
});
