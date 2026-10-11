// Cada cliente de Anthropic del entrevistador lleva la alarma del 401 (src/ia/alarma.ts).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// El cerebro crea el cliente Anthropic al importarse (usa cargarConfig): el entorno va antes del import.
vi.hoisted(() => {
  for (const [k, v] of Object.entries({
    SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'clave', ANTHROPIC_API_KEY: 'clave',
    OPENAI_API_KEY: 'clave', WA_TOKEN: 'clave', WA_PHONE_NUMBER_ID: '123', WA_VERIFY_TOKEN: 'verificador',
  })) vi.stubEnv(k, v);
});

const mocks = vi.hoisted(() => ({
  crear: vi.fn(),
  avisarSocios: vi.fn(async (..._a: unknown[]) => true),
}));
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create: mocks.crear }; } }));
vi.mock('../src/v3/avisos.js', () => ({ avisarSocios: mocks.avisarSocios }));

import { evaluarRespuesta } from '../src/ia/cerebro.js';

const RAIZ = join(__dirname, '..', 'src');
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : p.endsWith('.ts') ? [p] : [];
  });
}

beforeEach(() => {
  mocks.crear.mockReset();
  mocks.avisarSocios.mockClear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => vi.unstubAllEnvs());

describe('la alarma del 401 está enganchada', () => {
  it('todo `new Anthropic` de src pasa por vigilarClave (salvo el cazador, que avisa con narrador y bloque)', () => {
    const sinAlarma: string[] = [];
    for (const f of archivos(RAIZ)) {
      if (f.endsWith(join('ia', 'alarma.ts')) || f.endsWith(join('v3', 'cazador.ts'))) continue;
      for (const linea of readFileSync(f, 'utf8').split('\n')) {
        if (linea.includes('new Anthropic(') && !linea.includes('vigilarClave(')) sinAlarma.push(`${f}: ${linea.trim()}`);
      }
    }
    expect(sinAlarma).toEqual([]);
  });

  it('cerebro: un 401 avisa a los socios y la evaluación sigue como antes (vale como suficiente)', async () => {
    mocks.crear.mockRejectedValue(Object.assign(new Error('401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}'), { status: 401 }));
    expect(await evaluarRespuesta('¿Dónde naciste?', 'En un pueblo.', 30, '', 'vos', { pausaMs: 0 })).toEqual({ suficiente: true });
    await vi.waitFor(() => expect(mocks.avisarSocios).toHaveBeenCalled());
    expect(mocks.avisarSocios.mock.calls[0][0]).toBe('anthropic-401-entrevistador');
    expect(mocks.avisarSocios.mock.calls[0][2]).toContain('cerebro');
  });

  it('el servidor prueba la clave al arrancar, sin esperarla (no frena el arranque)', () => {
    const servidor = readFileSync(join(RAIZ, 'servidor.ts'), 'utf8');
    expect(servidor).toMatch(/void chequearClaveAlArrancar\(\)/);
  });
});
