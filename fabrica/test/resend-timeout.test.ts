// Si Resend se cuelga, ningún fetch de la fábrica puede quedarse esperando para siempre: el worker se
// traba y no sale ni un libro más. Cada llamada a Resend lleva AbortSignal.timeout(TIMEOUT_RESEND_MS), y el
// error del timeout se trata como cualquier otro fallo de Resend.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com' }) }));

import { TIMEOUT_RESEND_MS } from '../src/mail/resend.js';
import { enviarMailAnticipo } from '../src/mail/anticipo.js';
import { enviarMailRecordatorioFrases } from '../src/mail/frases.js';
import { enviarMailHito } from '../src/mail/hitos.js';
import { avisarSocios } from '../src/escritor/produccion/avisos.js';
import { avisarCandadoV3 } from '../src/v3/candado.js';

const timeoutOriginal = AbortSignal.timeout.bind(AbortSignal);
let pedidos: number[] = [];

/** Un Resend colgado: nunca contesta; solo se entera si le abortan el signal. */
function fetchColgado(): typeof fetch {
  return vi.fn(
    (_url: unknown, init?: RequestInit) =>
      new Promise<Response>((_ok, ko) => {
        init?.signal?.addEventListener('abort', () => ko(init.signal!.reason));
      })
  ) as unknown as typeof fetch;
}

const fetchOriginal = globalThis.fetch;

beforeEach(() => {
  pedidos = [];
  // El timeout real es de 15 s; en el test se anota cuánto pidió y se corta a los 5 ms.
  vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => {
    pedidos.push(ms);
    return timeoutOriginal(5);
  });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  globalThis.fetch = fetchOriginal;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('timeout de Resend en la fábrica', () => {
  it('es de 15 segundos, como en el entrevistador', () => {
    expect(TIMEOUT_RESEND_MS).toBe(15_000);
  });

  it('enviarMailAnticipo: con Resend colgado se aborta y tira (el worker lo atrapa por narrador)', async () => {
    globalThis.fetch = fetchColgado();
    await expect(
      enviarMailAnticipo({ para: 'a@b.c', comoLeDicen: 'papá', primeraPregunta: '¿Dónde naciste?', enlace: 'https://x' })
    ).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(pedidos).toEqual([TIMEOUT_RESEND_MS]);
  });

  it('enviarMailRecordatorioFrases: con Resend colgado se aborta y tira', async () => {
    globalThis.fetch = fetchColgado();
    await expect(enviarMailRecordatorioFrases({ para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' })).rejects.toMatchObject({
      name: 'TimeoutError',
    });
    expect(pedidos).toEqual([TIMEOUT_RESEND_MS]);
  });

  it('enviarMailHito: con Resend colgado se aborta y tira', async () => {
    globalThis.fetch = fetchColgado();
    await expect(enviarMailHito({ hito: 'terminado', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' })).rejects.toMatchObject({
      name: 'TimeoutError',
    });
    expect(pedidos).toEqual([TIMEOUT_RESEND_MS]);
  });

  it('avisarSocios: con Resend colgado devuelve false y no tira', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const fetch = fetchColgado();
    await expect(avisarSocios('prueba', 'texto', { fetch })).resolves.toBe(false);
    expect(pedidos).toEqual([TIMEOUT_RESEND_MS]);
  });

  it('avisarCandadoV3: con Resend colgado no tira ni deja el candado (reintenta el próximo tick)', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'uno@ejemplo.com');
    const subidos: string[] = [];
    const db = {
      storage: {
        from: () => ({
          download: async () => ({ data: null, error: { message: 'Object not found' } }),
          upload: async (ruta: string) => {
            subidos.push(ruta);
            return { error: null };
          },
        }),
      },
    } as any;
    await expect(avisarCandadoV3(db, 'n1', 'anticipo', { fetch: fetchColgado() })).resolves.toBeUndefined();
    expect(subidos).toEqual([]);
    expect(pedidos).toEqual([TIMEOUT_RESEND_MS]);
  });
});
