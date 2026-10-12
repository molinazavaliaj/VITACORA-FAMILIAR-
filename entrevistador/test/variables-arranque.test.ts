import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { avisarVariablesAlArrancar, revisarVariables } from '../src/variables.js';

// La alarma de variables al arrancar (12/10). Tres veces en una semana el código
// estaba bien y lo apagaba la configuración, sin avisar: la key de Anthropic
// revocada, WA_PLANTILLAS_V3_LISTAS que no existía en Railway y MAIL_SOCIOS que
// faltaba. Al arrancar, el entrevistador revisa sus variables y, si falta algo,
// avisa a los socios una vez por día con los NOMBRES (nunca los valores).

/** Todo lo que el entrevistador necesita, cargado. Los valores son de mentira. */
function envCompleto(): NodeJS.ProcessEnv {
  return {
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'srk-secreta',
    ANTHROPIC_API_KEY: 'sk-ant-secreta',
    OPENAI_API_KEY: 'sk-openai-secreta',
    WA_TOKEN: 'wa-secreto',
    WA_PHONE_NUMBER_ID: '123',
    WA_VERIFY_TOKEN: 'verifica-secreto',
    RESEND_API_KEY: 're_secreta',
    MAIL_SOCIOS: 'uno@ejemplo.com',
    WHATSAPP_NUMERO_PUBLICO: '5491100000000',
    SUGERIDAS_CLAVE: 'clave-sugeridas-secreta',
    WA_PLANTILLAS_V3_LISTAS: 'es-AR:recordatorio,es-AR:bienvenida',
  };
}

const nombres = (env: NodeJS.ProcessEnv) => revisarVariables(env).map((f) => f.variable);

describe('revisarVariables', () => {
  it('con todo cargado no hay faltas', () => {
    expect(revisarVariables(envCompleto())).toEqual([]);
  });

  it('una variable que falta o está vacía (o solo espacios) es una falta, con qué deja de andar', () => {
    const env = envCompleto();
    delete env.MAIL_SOCIOS;
    env.WA_PLANTILLAS_V3_LISTAS = '   ';
    env.RESEND_API_KEY = '';
    const faltas = revisarVariables(env);
    expect(faltas.map((f) => f.variable).sort()).toEqual(['MAIL_SOCIOS', 'RESEND_API_KEY', 'WA_PLANTILLAS_V3_LISTAS']);
    for (const f of faltas) expect(f.problema.length).toBeGreaterThan(20);
    expect(faltas.find((f) => f.variable === 'WA_PLANTILLAS_V3_LISTAS')!.problema).toMatch(/24 h/);
  });

  it('las obligatorias también se revisan (sin ellas el servicio no arranca)', () => {
    const env = envCompleto();
    delete env.WA_TOKEN;
    expect(nombres(env)).toEqual(['WA_TOKEN']);
  });

  it('los interruptores apagados (o sin cargar) no son una falta', () => {
    const env = envCompleto();
    env.V3_PARA_NUEVOS = '0';
    env.VIAJE_V2_PARA_NUEVOS = '';
    delete env.REGALO_ENTREGA_WHATSAPP;
    delete env.WA_BIENVENIDA_PIDE_VOZ;
    delete env.V3_CAZADOR;
    // La lista de Viaje V2 no hace falta mientras el interruptor esté apagado.
    delete env.WA_PLANTILLAS_VIAJE_V2_LISTAS;
    expect(revisarVariables(env)).toEqual([]);
  });

  it('REGALO_ENTREGA_WHATSAPP prendido sin regalo_entrega en la lista: falta, por idioma', () => {
    const env = envCompleto();
    env.REGALO_ENTREGA_WHATSAPP = '1';
    env.WA_PLANTILLAS_V3_LISTAS = 'es-AR:recordatorio,es-AR:bienvenida,es-AR:regalo_entrega';
    const faltas = revisarVariables(env);
    expect(faltas.map((f) => f.variable)).toEqual(['WA_PLANTILLAS_V3_LISTAS', 'WA_PLANTILLAS_V3_LISTAS']);
    expect(faltas.map((f) => f.problema).join(' ')).toMatch(/es-ES:regalo_entrega/);
    expect(faltas.map((f) => f.problema).join(' ')).toMatch(/ca:regalo_entrega/);
    expect(faltas[0].problema).toMatch(/REGALO_ENTREGA_WHATSAPP/);
  });

  it('V3_PARA_NUEVOS prendido sin la bienvenida es-AR en la lista: falta', () => {
    const env = envCompleto();
    env.V3_PARA_NUEVOS = '1';
    env.WA_PLANTILLAS_V3_LISTAS = 'es-AR:recordatorio';
    const faltas = revisarVariables(env);
    expect(faltas).toHaveLength(1);
    expect(faltas[0].problema).toMatch(/V3_PARA_NUEVOS/);
    expect(faltas[0].problema).toMatch(/es-AR:bienvenida/);
  });

  it('VIAJE_V2_PARA_NUEVOS prendido sin la lista de Viaje V2: falta', () => {
    const env = envCompleto();
    env.VIAJE_V2_PARA_NUEVOS = '1';
    expect(nombres(env)).toContain('WA_PLANTILLAS_VIAJE_V2_LISTAS');
    env.WA_PLANTILLAS_VIAJE_V2_LISTAS = 'es-AR:bienvenida,es-AR:mensaje';
    expect(revisarVariables(env)).toEqual([]);
  });

  it('una entrada que el código no reconoce en una lista de plantillas es una falta (errores de tipeo)', () => {
    const env = envCompleto();
    env.WA_PLANTILLAS_V3_LISTAS = 'es-AR:recordatorio, es-AR:bienvenida,es-AR:regalo_entregaa,';
    env.WA_PLANTILLAS_VIAJE_V2_LISTAS = 'es-AR:mensaje,es-MX:mensaje';
    const faltas = revisarVariables(env);
    expect(faltas.map((f) => f.variable)).toEqual(['WA_PLANTILLAS_V3_LISTAS', 'WA_PLANTILLAS_VIAJE_V2_LISTAS']);
    expect(faltas[0].problema).toMatch(/es-AR:regalo_entregaa/);
    expect(faltas[0].problema).toMatch(/es-AR:regalo_entrega\b(?!a)/); // la sugerencia
    expect(faltas[1].problema).toMatch(/es-MX:mensaje/);
  });

  it('el nombre de Meta en vez de la clave (regalo_entrega_vos) se marca y sugiere la clave', () => {
    const env = envCompleto();
    env.WA_PLANTILLAS_V3_LISTAS = 'es-AR:recordatorio,es-AR:bienvenida,es-AR:regalo_entrega_vos';
    const [f] = revisarVariables(env);
    expect(f.problema).toMatch(/es-AR:regalo_entrega_vos/);
    expect(f.problema).toMatch(/es-AR:regalo_entrega\b(?!_)/);
  });

  it('nunca muestra el valor de una variable', () => {
    const env = envCompleto();
    env.V3_PARA_NUEVOS = '1';
    env.REGALO_ENTREGA_WHATSAPP = '1';
    delete env.MAIL_SOCIOS;
    const texto = JSON.stringify(revisarVariables(env));
    for (const secreto of ['srk-secreta', 'sk-ant-secreta', 're_secreta', 'wa-secreto', 'clave-sugeridas-secreta', 'x.supabase.co']) {
      expect(texto).not.toContain(secreto);
    }
  });
});

describe('avisarVariablesAlArrancar', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('sin faltas no avisa', async () => {
    const avisar = vi.fn(async () => true);
    expect(await avisarVariablesAlArrancar({ env: envCompleto(), avisar })).toBe('ok');
    expect(avisar).not.toHaveBeenCalled();
  });

  it('con faltas manda UN aviso con la lista de nombres, sin valores', async () => {
    const env = envCompleto();
    delete env.WA_PLANTILLAS_V3_LISTAS;
    delete env.WHATSAPP_NUMERO_PUBLICO;
    const avisar = vi.fn(async (..._a: unknown[]) => true);
    expect(await avisarVariablesAlArrancar({ env, avisar })).toBe('avisado');
    expect(avisar).toHaveBeenCalledTimes(1);
    const [clave, asunto, detalle] = avisar.mock.calls[0] as [string, string, string];
    expect(clave).toMatch(/^variables-entrevistador/);
    expect(asunto).toMatch(/variables/i);
    expect(detalle).toContain('WA_PLANTILLAS_V3_LISTAS');
    expect(detalle).toContain('WHATSAPP_NUMERO_PUBLICO');
    expect(detalle).toMatch(/una vez por día/);
    for (const secreto of ['srk-secreta', 'sk-ant-secreta', 're_secreta', 'wa-secreto', 'uno@ejemplo.com']) {
      expect(detalle).not.toContain(secreto);
    }
    expect(console.error).toHaveBeenCalled();
  });

  it('la clave del aviso cambia si cambia la lista de faltas (arreglar una y que falte otra vuelve a avisar)', async () => {
    const avisar = vi.fn(async (..._a: unknown[]) => true);
    const a = envCompleto();
    delete a.WA_PLANTILLAS_V3_LISTAS;
    const b = envCompleto();
    delete b.WHATSAPP_NUMERO_PUBLICO;
    await avisarVariablesAlArrancar({ env: a, avisar });
    await avisarVariablesAlArrancar({ env: b, avisar });
    expect(avisar.mock.calls[0][0]).not.toBe(avisar.mock.calls[1][0]);
  });

  it('sin MAIL_SOCIOS o sin RESEND_API_KEY no intenta el mail: solo log fuerte', async () => {
    const avisar = vi.fn(async () => true);
    const env = envCompleto();
    delete env.MAIL_SOCIOS;
    expect(await avisarVariablesAlArrancar({ env, avisar })).toBe('solo-log');
    const env2 = envCompleto();
    delete env2.RESEND_API_KEY;
    expect(await avisarVariablesAlArrancar({ env: env2, avisar })).toBe('solo-log');
    expect(avisar).not.toHaveBeenCalled();
    const logs = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().join(' ');
    expect(logs).toContain('MAIL_SOCIOS');
    expect(logs).toContain('RESEND_API_KEY');
  });

  it('si el aviso tira, no tira (el arranque sigue)', async () => {
    const env = envCompleto();
    delete env.WA_PLANTILLAS_V3_LISTAS;
    const avisar = vi.fn(async () => { throw new Error('Resend caído'); });
    expect(await avisarVariablesAlArrancar({ env, avisar })).toBe('solo-log');
  });
});

describe('está enganchada al arranque', () => {
  it('el servidor la llama sin await (no frena el arranque), después de configurar la marca en Storage', () => {
    const servidor = readFileSync(join(__dirname, '..', 'src', 'servidor.ts'), 'utf8');
    expect(servidor).toMatch(/void avisarVariablesAlArrancar\(\)/);
    expect(servidor.indexOf('usarMarcaPersistente(')).toBeLessThan(servidor.indexOf('void avisarVariablesAlArrancar()'));
  });
});
