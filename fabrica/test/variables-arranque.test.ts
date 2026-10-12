// La alarma de variables al arrancar el worker (12/10). Tres veces en una semana el
// código estaba bien y lo apagaba la configuración, sin avisar (la key de Anthropic
// revocada, una lista de plantillas que no existía, MAIL_SOCIOS que faltaba). Al
// arrancar, la fábrica revisa sus variables y, si falta algo, avisa a los socios una
// vez por día (marca en Storage, igual que el entrevistador) con los NOMBRES, nunca los valores.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { avisarVariablesAlArrancar, marcaEnStorage, olvidarAvisosDeVariables, revisarVariables } from '../src/variables.js';

const AHORA = new Date('2026-10-12T13:00:00Z');

function envCompleto(): NodeJS.ProcessEnv {
  return {
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'srk-secreta',
    ANTHROPIC_API_KEY: 'sk-ant-secreta',
    OPENAI_API_KEY: 'sk-openai-secreta',
    RESEND_API_KEY: 're_secreta',
    MAIL_SOCIOS: 'uno@ejemplo.com',
  };
}

/** Un Storage de mentira: el segundo upload del mismo path da 409. */
function storageFalso() {
  const subidos = new Set<string>();
  const upload = vi.fn(async (path: string) => {
    if (subidos.has(path)) return { data: null, error: { message: 'The resource already exists', statusCode: '409' } };
    subidos.add(path);
    return { data: { path }, error: null };
  });
  return { subidos, db: { storage: { from: () => ({ upload }) } } };
}

beforeEach(() => {
  olvidarAvisosDeVariables();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('revisarVariables (fábrica)', () => {
  it('con todo cargado no hay faltas', () => {
    expect(revisarVariables(envCompleto())).toEqual([]);
  });

  it('faltante, vacía o solo espacios es una falta, con qué deja de andar', () => {
    const env = envCompleto();
    delete env.MAIL_SOCIOS;
    env.ANTHROPIC_API_KEY = '  ';
    const faltas = revisarVariables(env);
    expect(faltas.map((f) => f.variable).sort()).toEqual(['ANTHROPIC_API_KEY', 'MAIL_SOCIOS']);
    expect(faltas.find((f) => f.variable === 'MAIL_SOCIOS')!.problema).toMatch(/dudas/);
  });

  it('las que tienen valor por defecto no son una falta', () => {
    const env = envCompleto();
    for (const n of ['URL_BASE', 'MAIL_FROM', 'ESCRITOR_TOPE_USD', 'ESCRITOR_LIBROS_EN_PARALELO', 'ESCRITOR_ESPERA_DUDAS_HORAS', 'RESPUESTAS_PARA_ANTICIPO', 'CUENTA_IA']) delete env[n];
    expect(revisarVariables(env)).toEqual([]);
  });

  it('nunca muestra un valor', () => {
    const env = envCompleto();
    delete env.RESEND_API_KEY;
    const texto = JSON.stringify(revisarVariables(env));
    for (const s of ['srk-secreta', 'sk-ant-secreta', 'sk-openai-secreta', 'uno@ejemplo.com', 'x.supabase.co']) expect(texto).not.toContain(s);
  });
});

describe('avisarVariablesAlArrancar (fábrica)', () => {
  it('sin faltas no avisa', async () => {
    const avisar = vi.fn(async () => true);
    expect(await avisarVariablesAlArrancar({ env: envCompleto(), avisar, marca: null, ahora: AHORA })).toBe('ok');
    expect(avisar).not.toHaveBeenCalled();
  });

  it('con faltas manda UN mail con los nombres y sin valores', async () => {
    const env = envCompleto();
    env.OPENAI_API_KEY = '';
    const avisar = vi.fn(async (..._a: unknown[]) => true);
    expect(await avisarVariablesAlArrancar({ env, avisar, marca: null, ahora: AHORA })).toBe('avisado');
    expect(avisar).toHaveBeenCalledTimes(1);
    const [asunto, detalle] = avisar.mock.calls[0] as [string, string];
    expect(asunto).toMatch(/variables/i);
    expect(detalle).toContain('OPENAI_API_KEY');
    expect(detalle).toMatch(/una vez por día/);
    for (const s of ['srk-secreta', 'sk-ant-secreta', 're_secreta', 'uno@ejemplo.com']) expect(detalle).not.toContain(s);
  });

  it('un reinicio el mismo día no lo repite (marca en Storage); al día siguiente sí', async () => {
    const env = envCompleto();
    delete env.OPENAI_API_KEY;
    const s = storageFalso();
    const marca = marcaEnStorage(s.db as never);
    const avisar = vi.fn(async (..._a: unknown[]) => true);
    expect(await avisarVariablesAlArrancar({ env, avisar, marca, ahora: AHORA })).toBe('avisado');
    olvidarAvisosDeVariables(); // Railway se reinició
    expect(await avisarVariablesAlArrancar({ env, avisar, marca, ahora: AHORA })).toBe('ya-avisado');
    expect(avisar).toHaveBeenCalledTimes(1);
    olvidarAvisosDeVariables();
    expect(await avisarVariablesAlArrancar({ env, avisar, marca, ahora: new Date('2026-10-13T13:00:00Z') })).toBe('avisado');
    expect(avisar).toHaveBeenCalledTimes(2);
    // La marca va en avisos/<día>/ y su nombre no muestra la clave.
    for (const p of s.subidos) expect(p).toMatch(/^avisos\/2026-10-1[23]\/[0-9a-f]{40}\.txt$/);
  });

  it('si cambia la lista de faltas, vuelve a avisar el mismo día', async () => {
    const avisar = vi.fn(async (..._a: unknown[]) => true);
    const a = envCompleto();
    delete a.OPENAI_API_KEY;
    const b = envCompleto();
    delete b.ANTHROPIC_API_KEY;
    await avisarVariablesAlArrancar({ env: a, avisar, marca: null, ahora: AHORA });
    await avisarVariablesAlArrancar({ env: b, avisar, marca: null, ahora: AHORA });
    expect(avisar).toHaveBeenCalledTimes(2);
  });

  it('si el mail no salió, no queda marcado en memoria (lo intenta en el próximo arranque)', async () => {
    const env = envCompleto();
    delete env.OPENAI_API_KEY;
    const avisar = vi.fn(async (..._a: unknown[]) => false);
    await avisarVariablesAlArrancar({ env, avisar, marca: null, ahora: AHORA });
    await avisarVariablesAlArrancar({ env, avisar, marca: null, ahora: AHORA });
    expect(avisar).toHaveBeenCalledTimes(2);
  });

  it('sin MAIL_SOCIOS o sin RESEND_API_KEY: solo log fuerte, sin tocar el Storage', async () => {
    const avisar = vi.fn(async () => true);
    const marca = vi.fn(async () => 'nueva' as const);
    const env = envCompleto();
    delete env.MAIL_SOCIOS;
    expect(await avisarVariablesAlArrancar({ env, avisar, marca, ahora: AHORA })).toBe('solo-log');
    const env2 = envCompleto();
    delete env2.RESEND_API_KEY;
    expect(await avisarVariablesAlArrancar({ env: env2, avisar, marca, ahora: AHORA })).toBe('solo-log');
    expect(avisar).not.toHaveBeenCalled();
    expect(marca).not.toHaveBeenCalled();
    const logs = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().join(' ');
    expect(logs).toContain('MAIL_SOCIOS');
  });

  it('si algo tira (el aviso o la marca), no tira', async () => {
    const env = envCompleto();
    delete env.OPENAI_API_KEY;
    const avisar = vi.fn(async () => { throw new Error('Resend caído'); });
    const marca = vi.fn(async () => { throw new Error('Storage caído'); });
    expect(await avisarVariablesAlArrancar({ env, avisar, marca, ahora: AHORA })).toBe('solo-log');
  });
});

describe('está enganchada al arranque del worker', () => {
  it('iniciarWorker la llama sin await', () => {
    const worker = readFileSync(join(__dirname, '..', 'src', 'worker.ts'), 'utf8');
    const inicio = worker.slice(worker.indexOf('export function iniciarWorker'));
    expect(inicio).toMatch(/void avisarVariablesAlArrancar\(\)/);
  });
});
