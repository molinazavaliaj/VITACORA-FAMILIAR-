import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearBaseFalsa } from './v3/base-falsa.js';
vi.mock('../src/db/cliente.js', () => ({ db: {} }));
import { canjearRegalo, mandarBienvenidaDeRegalo, recordarRegalos, reiniciarLimiteDeCodigos } from '../src/flujo/regalo.js';
import { AVISOS, RECORDATORIO, TEXTOS_REGALO_BOT } from '../src/flujo/regalo-textos.js';
import { bienvenidaDeRegalo } from '../src/flujo/regalo-arranque.js';

const TEL = '+5491155551234';
beforeEach(() => reiniciarLimiteDeCodigos());
function armar(o: { estado?: string; usado_at?: string | null; usado_por_telefono?: string | null; contexto?: Record<string, unknown>; zona_horaria?: string } = {}) {
  const base = crearBaseFalsa({
    narradores: [{ id: 'n1', familia_id: 'f1', nombre: 'Héctor', como_le_dicen: 'abuelo', telefono_whatsapp: null, estado: o.estado ?? 'regalo_pendiente', contexto: o.contexto ?? { regalo: true, trato: 'vos', genero: 'varon' }, zona_horaria: o.zona_horaria ?? 'Europe/Madrid' }],
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
  it('canje: teléfono, invitado, regalo usado, bienvenida del banco en es-AR, y envío anotado', async () => {
    const { base, deps, enviados } = armar();
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'Hola, quiero empezar mi libro. VF-7K3M2Q' })).toBe('canjeado');
    expect(base.tablas.narradores[0]).toMatchObject({ telefono_whatsapp: TEL, estado: 'invitado' });
    expect(base.tablas.regalos[0]).toMatchObject({ usado_por_telefono: TEL });
    expect(base.tablas.regalos[0].usado_at).toBeTruthy();
    expect(enviados).toHaveLength(1);
    expect(enviados[0].texto).toBe(bienvenidaDeRegalo('es-AR', { nombre: 'abuelo', genero: 'varon' }));
    expect(enviados[0].texto.startsWith('Hola, abuelo, ¿cómo estás?')).toBe(true);
    expect(enviados[0].texto).toContain('Respondé SÍ');
    expect(base.tablas.envios).toEqual([expect.objectContaining({ narrador_id: 'n1', tipo: 'bienvenida', wa_message_id: 'wa-1' })]);
  });
  it('el ritmo no cambia la bienvenida: la primera pregunta sale siempre con el SÍ', async () => {
    const { deps, enviados } = armar({ contexto: { regalo: true, ritmo: 'diario', genero: 'varon' } });
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('canjeado');
    expect(enviados[0].texto).toBe(bienvenidaDeRegalo('es-AR', { nombre: 'abuelo', genero: 'varon' }));
  });
  it('un regalo en catalán: la bienvenida en catalán', async () => {
    const { deps, enviados } = armar({ contexto: { regalo: true, idioma: 'ca', genero: 'mujer' } });
    expect(await canjearRegalo(deps, { telefono: '+34612345678', texto: 'VF-7K3M2Q' })).toBe('canjeado');
    expect(enviados[0].texto).toBe(bienvenidaDeRegalo('ca', { nombre: 'abuelo', genero: 'mujer' }));
  });
  it('código que no existe desde un +34: se lo dice en castellano de España', async () => {
    const { deps, enviados } = armar();
    expect(await canjearRegalo(deps, { telefono: '+34612345678', texto: 'VF-ZZZZZZ' })).toBe('no_existe');
    expect(enviados).toEqual([{ tel: '+34612345678', texto: AVISOS['es-ES'].noExiste }]);
  });
  it('código que no existe desde un +54: es-AR, el texto aprobado de siempre', async () => {
    const { deps, enviados } = armar();
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-ZZZZZZ' })).toBe('no_existe');
    expect(enviados).toEqual([{ tel: TEL, texto: AVISOS['es-AR'].noExiste }]);
  });
  it('usado por otro teléfono, en el idioma del regalo (catalán)', async () => {
    const { deps, enviados } = armar({ contexto: { regalo: true, idioma: 'ca' }, usado_at: '2026-10-08T10:00:00Z', usado_por_telefono: '+34600000000' });
    expect(await canjearRegalo(deps, { telefono: '+34612345678', texto: 'VF-7K3M2Q' })).toBe('usado_por_otro');
    expect(enviados).toEqual([{ tel: '+34612345678', texto: AVISOS.ca.usadoPorOtro }]);
  });
  it('usado por otro teléfono, en el idioma del regalo (es-ES), aunque escriba un +54', async () => {
    const { deps, enviados } = armar({ contexto: { regalo: true, idioma: 'es-ES' }, usado_at: '2026-10-08T10:00:00Z', usado_por_telefono: '+34600000000' });
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('usado_por_otro');
    expect(enviados).toEqual([{ tel: TEL, texto: AVISOS['es-ES'].usadoPorOtro }]);
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
    expect(enviados[0].texto).toBe(bienvenidaDeRegalo('es-AR', { nombre: 'abuelo', genero: 'varon' }));
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

describe('canjearRegalo: la zona horaria sale del teléfono que canjea', () => {
  it('quien regala está en España, el narrador canjea con +54: Buenos Aires', async () => {
    const { base, deps } = armar({ zona_horaria: 'Europe/Madrid' });
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('canjeado');
    expect(base.tablas.narradores[0]).toMatchObject({ telefono_whatsapp: TEL, estado: 'invitado', zona_horaria: 'America/Argentina/Buenos_Aires' });
  });
  it('quien regala está en Argentina, el narrador canjea con +34: Madrid', async () => {
    const { base, deps } = armar({ zona_horaria: 'America/Argentina/Buenos_Aires' });
    expect(await canjearRegalo(deps, { telefono: '+34612345678', texto: 'VF-7K3M2Q' })).toBe('canjeado');
    expect(base.tablas.narradores[0]).toMatchObject({ estado: 'invitado', zona_horaria: 'Europe/Madrid' });
  });
  it('otro prefijo: la zona queda como estaba', async () => {
    const { base, deps } = armar({ zona_horaria: 'Europe/Madrid' });
    expect(await canjearRegalo(deps, { telefono: '+59899123456', texto: 'VF-7K3M2Q' })).toBe('canjeado');
    expect(base.tablas.narradores[0]).toMatchObject({ estado: 'invitado', zona_horaria: 'Europe/Madrid' });
  });
  it('si el canje no pasa (no se pagó), la zona no se toca', async () => {
    const { base, deps } = armar({ estado: 'pendiente_pago', zona_horaria: 'Europe/Madrid' });
    expect(await canjearRegalo(deps, { telefono: TEL, texto: 'VF-7K3M2Q' })).toBe('no_listo');
    expect(base.tablas.narradores[0].zona_horaria).toBe('Europe/Madrid');
  });
});

describe('mandarBienvenidaDeRegalo', () => {
  it('con idioma ca, manda la bienvenida del banco en catalán', async () => {
    const { deps, enviados } = armar({ contexto: { regalo: true, idioma: 'ca', genero: 'mujer' } });
    expect(await mandarBienvenidaDeRegalo(deps, 'n1', TEL)).toBe(true);
    expect(enviados[0].texto).toBe(bienvenidaDeRegalo('ca', { nombre: 'abuelo', genero: 'mujer' }));
    expect(enviados[0].texto.startsWith('Hola, abuelo, com estàs?')).toBe(true);
  });
  it('sin idioma, la de es-AR (ya no la bienvenida vieja)', async () => {
    const { deps, enviados } = armar({ contexto: { regalo: true } });
    expect(await mandarBienvenidaDeRegalo(deps, 'n1', TEL)).toBe(true);
    expect(enviados[0].texto).toBe(bienvenidaDeRegalo('es-AR', { nombre: 'abuelo', genero: 'otro' }));
    expect(enviados[0].texto).toContain('Una persona que te quiere mucho te regaló');
    expect(enviados[0].texto).not.toContain('Lucía te hizo un regalo');
  });
  it('si no se puede anotar el envío, lo dice y devuelve false', async () => {
    const { base, deps, enviados } = armar();
    base.fallarProxima.set('envios', { code: 'XX000', message: 'caída' });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(await mandarBienvenidaDeRegalo(deps, 'n1', TEL)).toBe(false);
      expect(error).toHaveBeenCalledWith(expect.stringContaining('n1'), expect.anything());
    } finally {
      error.mockRestore();
    }
    expect(enviados).toHaveLength(1);
    expect(base.tablas.envios).toEqual([]);
  });
  it('si WhatsApp falla, devuelve false y no anota el envío', async () => {
    const { base } = armar();
    const deps = { db: base.cliente, enviarTexto: async (): Promise<string> => { throw new Error('Meta caído'); } };
    expect(await mandarBienvenidaDeRegalo(deps, 'n1', TEL)).toBe(false);
    expect(base.tablas.envios).toEqual([]);
  });
});

describe('recordarRegalos', () => {
  const ahora = new Date('2026-12-20T12:00:00Z');
  function armarRec(regalo: Record<string, unknown>, estado = 'regalo_pendiente', familias: Record<string, unknown>[] = []) {
    const base = crearBaseFalsa({
      familias,
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
  it('quien compra en España (familia ES) lo recibe en tú', async () => {
    const { deps } = armarRec({ fecha_entrega: '2026-12-05' }, 'regalo_pendiente', [{ id: 'f1', region: 'ES', email: 'a@b.es' }]);
    expect(await recordarRegalos(deps, ahora)).toBe(1);
    expect(deps.mandarMail).toHaveBeenCalledWith('f1', 'abuelo todavía no ha abierto su regalo',
      'Pasaron unos días desde la fecha que pusiste y la tarjeta sigue sin usar. Si ya se la diste, quizá necesita una mano para escanearla. La tarjeta está en tu tablero.', 'n1');
  });
  it('familia AR o sin región: el texto aprobado de vos, sin cambios', async () => {
    for (const familias of [[{ id: 'f1', region: 'AR', email: 'a@b.ar' }], [{ id: 'f1', region: null, email: 'a@b.ar' }], []]) {
      const { deps } = armarRec({ fecha_entrega: '2026-12-05' }, 'regalo_pendiente', familias);
      expect(await recordarRegalos(deps, ahora)).toBe(1);
      expect(deps.mandarMail).toHaveBeenCalledWith('f1', 'abuelo todavía no abrió su regalo',
        'Pasaron unos días desde la fecha que pusiste y la tarjeta sigue sin usar. Si ya se la diste, capaz necesita una mano para escanearla. La tarjeta está en tu tablero.', 'n1');
    }
  });
  it('el de vos es el mismo texto aprobado (TEXTOS_REGALO_BOT)', () => {
    expect(RECORDATORIO.vos.asunto('abuelo')).toBe(TEXTOS_REGALO_BOT.recordatorioAsunto('abuelo'));
    expect(RECORDATORIO.vos.cuerpo).toBe(TEXTOS_REGALO_BOT.recordatorioCuerpo);
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
  it('dos corridas a la vez no mandan dos veces', async () => {
    const { base, deps } = armarRec({ fecha_entrega: '2026-12-05' });
    const [a, b] = await Promise.all([recordarRegalos(deps, ahora), recordarRegalos(deps, ahora)]);
    expect(a + b).toBe(1);
    expect(deps.mandarMail).toHaveBeenCalledTimes(1);
    expect(base.tablas.regalos[0].recordatorio_at).toBe(ahora.toISOString());
  });
  it('si no se puede tomar el regalo (falla el update), no manda nada', async () => {
    const { base, deps } = armarRec({ fecha_entrega: '2026-11-01' });
    base.fallarProxima.set('regalos', { code: 'XX000', message: 'caída' });
    expect(await recordarRegalos(deps, ahora)).toBe(0);
    expect(deps.mandarMail).not.toHaveBeenCalled();
    expect(base.tablas.regalos[0].recordatorio_at).toBeNull();
  });
  it('un regalo comprado hace menos de 15 días ni se mira (el corte va en la consulta)', async () => {
    // fecha_entrega vieja con compra reciente no pasa en la realidad: sirve para
    // probar que el corte por created_at está en la consulta y no solo en JS.
    const { base, deps } = armarRec({ fecha_entrega: '2026-11-01', created_at: '2026-12-15T00:00:00Z' });
    const from = vi.spyOn(base.cliente, 'from');
    expect(await recordarRegalos(deps, ahora)).toBe(0);
    expect(from.mock.calls.map((c) => c[0])).not.toContain('narradores');
  });
  it('nunca le escribe al narrador por WhatsApp', async () => {
    const { deps } = armarRec({ fecha_entrega: '2026-11-01' });
    expect(await recordarRegalos(deps, ahora)).toBe(1);
    expect(deps.enviarTexto).not.toHaveBeenCalled();
  });
  it('sin la tabla regalos (migración sin aplicar) devuelve 0 y no tira', async () => {
    const { deps } = armarRec({ fecha_entrega: '2026-11-01' });
    const db = { from: () => ({ select: () => ({ is: () => ({ is: () => ({ lte: async () => ({ data: null, error: { code: 'PGRST205', message: 'no table' } }) }) }) }) }) };
    expect(await recordarRegalos({ ...deps, db: db as never }, ahora)).toBe(0);
    expect(deps.mandarMail).not.toHaveBeenCalled();
  });
});
