import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearBaseFalsa } from './v3/base-falsa.js';
vi.mock('../src/db/cliente.js', () => ({ db: {} }));
import { canjearRegalo, mandarBienvenidaDeRegalo, recordarRegalos, reiniciarLimiteDeCodigos } from '../src/flujo/regalo.js';
import { TEXTOS_REGALO_BOT } from '../src/flujo/regalo-textos.js';
import { bienvenida } from '../src/manual/puro.js';

const TEL = '+5491155551234';
beforeEach(() => reiniciarLimiteDeCodigos());
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

describe('canjearRegalo: arreglos de la revisión', () => {
  it('sin la tabla regalos, con la forma de PostgREST (PGRST205), se queda callado', async () => {
    const { base, deps, enviados } = armar();
    const sinTabla = {
      select: () => sinTabla, eq: () => sinTabla, maybeSingle: () => sinTabla,
      then: (ok: any, ko: any) => Promise.resolve({ data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.regalos' in the schema cache" } }).then(ok, ko),
    };
    const cliente = { from: (t: string) => (t === 'regalos' ? sinTabla : base.cliente.from(t)) } as unknown as typeof deps.db;
    expect(await canjearRegalo({ ...deps, db: cliente }, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('sin_codigo');
    expect(enviados).toEqual([]);
  });

  it('el mismo teléfono que ya lo canjeó (con o sin el 9) no recibe "otro teléfono": silencio', async () => {
    const { deps, enviados } = armar({ usado_at: '2026-10-08T10:00:00Z', usado_por_telefono: '+541155551234' });
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('ya_era_suyo');
    expect(enviados).toEqual([]);
  });

  it('dos mensajes juntos con el mismo código desde el mismo teléfono: una sola bienvenida', async () => {
    const { base, deps, enviados } = armar();
    const resultados = await Promise.all([
      canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' }),
      canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' }),
    ]);
    expect([...resultados].sort()).toEqual(['canjeado', 'ya_era_suyo']);
    expect(enviados).toHaveLength(1);
    expect(enviados[0].texto).toContain('Lucía te hizo un regalo');
    expect(enviados.some((e) => e.texto === TEXTOS_REGALO_BOT.usadoPorOtro)).toBe(false);
    expect(base.tablas.narradores.filter((n) => n.telefono_whatsapp === TEL)).toHaveLength(1);
    expect(base.tablas.envios).toHaveLength(1);
  });

  it('si la base falla al tomar el regalo, tira el error y no dice "otro teléfono"', async () => {
    const { base, deps, enviados } = armar();
    base.fallarProxima.set('regalos', { code: '08006', message: 'conexión caída' });
    await expect(canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).rejects.toMatchObject({ code: '08006' });
    expect(enviados).toEqual([]);
    expect(base.tablas.narradores[0].telefono_whatsapp).toBeNull();
  });

  it('la devolución solo borra la marca si sigue siendo de este teléfono', async () => {
    const { base, deps } = armar({ estado: 'pendiente_pago' });
    // Simula que otro canje pisó la marca entre la toma y la devolución.
    const original = base.cliente.from.bind(base.cliente);
    let updatesNarradores = 0;
    const cliente = {
      from: (t: string) => {
        if (t === 'narradores') {
          const q = original(t) as any;
          const update = q.update.bind(q);
          q.update = (v: any) => {
            updatesNarradores++;
            base.tablas.regalos[0].usado_por_telefono = '+5491100000000';
            return update(v);
          };
          return q;
        }
        return original(t);
      },
    } as unknown as typeof deps.db;
    expect(await canjearRegalo({ ...deps, db: cliente }, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('no_listo');
    expect(updatesNarradores).toBe(1);
    expect(base.tablas.regalos[0].usado_por_telefono).toBe('+5491100000000');
    expect(base.tablas.regalos[0].usado_at).toBeTruthy();
  });

  it('después de 5 "no encuentro ese código" al mismo teléfono en 24 hs, silencio; al día siguiente vuelve a contestar', async () => {
    const { deps, enviados } = armar();
    let reloj = Date.parse('2026-10-08T10:00:00Z');
    const conReloj = { ...deps, ahora: () => reloj };
    for (let i = 0; i < 6; i++) {
      expect(await canjearRegalo(conReloj, { telefono: TEL, texto: 'VF-ZZZZZZ' })).toBe('no_existe');
      reloj += 60_000;
    }
    expect(enviados).toHaveLength(5);
    // Otro teléfono no paga por este.
    expect(await canjearRegalo(conReloj, { telefono: '+5491199998888', texto: 'VF-ZZZZZZ' })).toBe('no_existe');
    expect(enviados).toHaveLength(6);
    reloj += 24 * 3600_000;
    expect(await canjearRegalo(conReloj, { telefono: TEL, texto: 'VF-ZZZZZZ' })).toBe('no_existe');
    expect(enviados).toHaveLength(7);
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

describe('recordarRegalos', () => {
  const ahora = new Date('2026-12-20T12:00:00Z');
  function armarRec(regalo: Record<string, unknown>, estado = 'regalo_pendiente') {
    const base = crearBaseFalsa({
      narradores: [{ id: 'n1', familia_id: 'f1', nombre: 'Héctor', como_le_dicen: 'abuelo', telefono_whatsapp: null, estado, contexto: {} }],
      regalos: [{ id: 'r1', codigo: 'VF-7K3M2Q', narrador_id: 'n1', pedido_id: 'p1', quien_regala: 'Lucía', mensaje: 'x', usado_at: null, recordatorio_at: null, fecha_entrega: null, created_at: '2026-10-01T00:00:00Z', ...regalo }],
    });
    const mandarMail = vi.fn().mockResolvedValue(true);
    return { base, deps: { db: base.cliente, enviarTexto: vi.fn(), mandarMail } };
  }
  it('a los 15 días de la fecha de entrega, una vez', async () => {
    const { base, deps } = armarRec({ fecha_entrega: '2026-12-05' });
    expect(await recordarRegalos(deps, ahora)).toBe(1);
    expect(deps.mandarMail).toHaveBeenCalledWith('f1', expect.stringContaining('abuelo'), expect.any(String), 'n1');
    expect(base.tablas.regalos[0].recordatorio_at).toBeTruthy();
    expect(await recordarRegalos(deps, ahora)).toBe(0);
  });
  it('manda los textos aprobados', async () => {
    const { deps } = armarRec({ fecha_entrega: '2026-12-05' });
    await recordarRegalos(deps, ahora);
    expect(deps.mandarMail).toHaveBeenCalledWith('f1', 'abuelo todavía no abrió su regalo', TEXTOS_REGALO_BOT.recordatorioCuerpo, 'n1');
  });
  it('antes de los 15 días, no', async () => {
    const { deps } = armarRec({ fecha_entrega: '2026-12-10' });
    expect(await recordarRegalos(deps, ahora)).toBe(0);
  });
  it('sin fecha cuenta desde la compra', async () => {
    const { deps } = armarRec({ fecha_entrega: null, created_at: '2026-12-01T00:00:00Z' });
    expect(await recordarRegalos(deps, ahora)).toBe(1);
  });
  it('usado, o narrador sin pagar, no', async () => {
    expect(await recordarRegalos(armarRec({ fecha_entrega: '2026-11-01', usado_at: '2026-11-02T00:00:00Z' }).deps, ahora)).toBe(0);
    expect(await recordarRegalos(armarRec({ fecha_entrega: '2026-11-01' }, 'pendiente_pago').deps, ahora)).toBe(0);
  });
  it('si el mail falla no marca, así se reintenta', async () => {
    const { base, deps } = armarRec({ fecha_entrega: '2026-11-01' });
    deps.mandarMail.mockResolvedValue(false);
    expect(await recordarRegalos(deps, ahora)).toBe(0);
    expect(base.tablas.regalos[0].recordatorio_at).toBeNull();
  });
  it('sin la tabla regalos (migración sin aplicar) devuelve 0 y no tira', async () => {
    const { deps } = armarRec({ fecha_entrega: '2026-11-01' });
    const db = { from: () => ({ select: () => ({ is: () => ({ is: async () => ({ data: null, error: { code: 'PGRST205', message: 'no table' } }) }) }) }) };
    expect(await recordarRegalos({ ...deps, db: db as never }, ahora)).toBe(0);
    expect(deps.mandarMail).not.toHaveBeenCalled();
  });
});
