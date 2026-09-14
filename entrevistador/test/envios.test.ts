import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ updates: [] as { tabla: string; p: any }[], falla: false }));

vi.mock('../src/db/cliente.js', () => ({
  db: {
    from: (tabla: string) => ({
      update: (p: any) => {
        mocks.updates.push({ tabla, p });
        return {
          eq: () => Promise.resolve({ error: mocks.falla ? { message: 'boom' } : null }),
        };
      },
    }),
  },
}));

const { guardarRepreguntaEnviada } = await import('../src/db/envios.js');

describe('guardarRepreguntaEnviada', () => {
  beforeEach(() => { mocks.updates = []; mocks.falla = false; });

  it('guarda el texto de la repregunta bajo su orden, sin pisar lo demás del contexto', async () => {
    const n = {
      id: 'n1',
      contexto: { repreguntasEnviadas: { 3: 'vieja' }, preguntasEnviadas: { 1: 'la del día 1' }, modoRapido: true },
    };
    await guardarRepreguntaEnviada(n, 5, '¿Y qué hizo esa mañana en el taller?');

    const guardado = mocks.updates[0].p.contexto;
    expect(mocks.updates[0].tabla).toBe('narradores');
    expect(guardado.repreguntasEnviadas).toEqual({ 3: 'vieja', 5: '¿Y qué hizo esa mañana en el taller?' });
    expect(guardado.preguntasEnviadas).toEqual({ 1: 'la del día 1' });
    expect(guardado.modoRapido).toBe(true);
  });

  it('lo deja también en memoria, para que otro guardado posterior no lo pise', async () => {
    const n = { id: 'n1', contexto: {} as Record<string, any> };
    await guardarRepreguntaEnviada(n, 2, '¿Quién era Rubén para usted?');
    expect(n.contexto.repreguntasEnviadas[2]).toBe('¿Quién era Rubén para usted?');
  });

  it('si la base falla, avisa pero no tira: la entrevista sigue', async () => {
    mocks.falla = true;
    const n = { id: 'n1', contexto: {} };
    await expect(guardarRepreguntaEnviada(n, 1, '¿Y después?')).resolves.toBeUndefined();
  });
});
