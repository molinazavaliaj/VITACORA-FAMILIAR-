import { describe, it, expect, vi } from 'vitest';
import { crearBaseFalsa } from './v3/base-falsa.js';
vi.mock('../src/db/cliente.js', () => ({ db: {} }));
import { canjearRegalo, mandarBienvenidaDeRegalo } from '../src/flujo/regalo.js';
import { TEXTOS_REGALO_BOT } from '../src/flujo/regalo-textos.js';
import { bienvenida } from '../src/manual/puro.js';

const TEL = '+5491155551234';
function armar(o: { estado?: string; usado_at?: string | null; usado_por_telefono?: string | null; contexto?: Record<string, unknown> } = {}) {
  const base = crearBaseFalsa({
    narradores: [{ id: 'n1', familia_id: 'f1', nombre: 'Héctor', como_le_dicen: 'abuelo', telefono_whatsapp: null, estado: o.estado ?? 'regalo_pendiente', contexto: o.contexto ?? { regalo: true, trato: 'vos', genero: 'varon' } }],
    regalos: [{ id: 'r1', codigo: 'VF-7K3M2Q', narrador_id: 'n1', pedido_id: 'p1', quien_regala: 'Lucía', mensaje: 'Te quiero', usado_at: o.usado_at ?? null, usado_por_telefono: o.usado_por_telefono ?? null }],
    envios: [],
  });
  const enviados: { tel: string; texto: string }[] = [];
  const deps = { db: base.cliente, enviarTexto: async (tel: string, texto: string) => { enviados.push({ tel, texto }); return `wa-${enviados.length}`; } };
  return { base, deps, enviados };
}

describe('canjearRegalo', () => {
  it('sin código no contesta nada', async () => {
    const { deps, enviados } = armar();
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'hola' })).toBe('sin_codigo');
    expect(enviados).toEqual([]);
  });
  it('código que no existe: se lo dice', async () => {
    const { deps, enviados } = armar();
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-ZZZZZZ' })).toBe('no_existe');
    expect(enviados).toEqual([{ tel: TEL, texto: TEXTOS_REGALO_BOT.noExiste }]);
  });
  it('una palabra sola de seis letras del alfabeto termina en "no encuentro ese código" (aceptado)', async () => {
    const { deps, enviados } = armar();
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'buenas' })).toBe('no_existe');
    expect(enviados).toEqual([{ tel: TEL, texto: TEXTOS_REGALO_BOT.noExiste }]);
  });
  it('canje: teléfono, invitado, regalo usado, bienvenida de vos con quien regala, y envío anotado', async () => {
    const { base, deps, enviados } = armar();
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'Hola, quiero empezar mi libro. VF-7K3M2Q' })).toBe('canjeado');
    expect(base.tablas.narradores[0]).toMatchObject({ telefono_whatsapp: TEL, estado: 'invitado' });
    expect(base.tablas.regalos[0]).toMatchObject({ usado_por_telefono: TEL });
    expect(base.tablas.regalos[0].usado_at).toBeTruthy();
    expect(enviados).toHaveLength(1);
    expect(enviados[0].texto).toBe(bienvenida('abuelo', 'Lucía', 'vos', { enseguida: false }));
    expect(enviados[0].texto).toContain('Hola abuelo');
    expect(enviados[0].texto).toContain('Lucía te hizo un regalo');
    expect(enviados[0].texto).toContain('Respondé SÍ');
    expect(base.tablas.envios).toEqual([expect.objectContaining({ narrador_id: 'n1', tipo: 'bienvenida', wa_message_id: 'wa-1' })]);
  });
  it('con ritmo seguido, la bienvenida no promete "mañana"', async () => {
    const { deps, enviados } = armar({ contexto: { regalo: true, ritmo: 'seguido' } });
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('canjeado');
    expect(enviados[0].texto).toBe(bienvenida('abuelo', 'Lucía', 'vos', { enseguida: true }));
  });
  it('usado por otro teléfono: se lo dice y no toca nada', async () => {
    const { base, deps, enviados } = armar({ usado_at: '2026-10-08T10:00:00Z', usado_por_telefono: '+5491100000000' });
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('usado_por_otro');
    expect(enviados).toEqual([{ tel: TEL, texto: TEXTOS_REGALO_BOT.usadoPorOtro }]);
    expect(base.tablas.narradores[0].telefono_whatsapp).toBeNull();
  });
  it('si el narrador no está en regalo_pendiente (no se pagó), deshace la marca y no contesta', async () => {
    const { base, deps, enviados } = armar({ estado: 'pendiente_pago' });
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('no_listo');
    expect(base.tablas.regalos[0].usado_at).toBeNull();
    expect(base.tablas.regalos[0].usado_por_telefono).toBeNull();
    expect(enviados).toEqual([]);
  });
  it('sin la tabla regalos (migración sin aplicar) se queda callado', async () => {
    const { base, deps, enviados } = armar();
    base.ausentes.add('regalos');
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('sin_codigo');
    expect(enviados).toEqual([]);
  });
});

describe('mandarBienvenidaDeRegalo', () => {
  it('si WhatsApp falla, devuelve false y no anota el envío', async () => {
    const { base } = armar();
    const deps = { db: base.cliente, enviarTexto: async (): Promise<string> => { throw new Error('Meta caído'); } };
    expect(await mandarBienvenidaDeRegalo(deps, 'n1', TEL)).toBe(false);
    expect(base.tablas.envios).toEqual([]);
  });
});
