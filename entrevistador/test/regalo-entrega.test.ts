import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './v3/base-falsa.js';
import { enmascarar, entregarRegalos, fallarEntregaRegalo, type DepsEntrega } from '../src/flujo/regalo-entrega.js';
import { ENTREGA_ABUELO, ENTREGA_COMPRADOR } from '../src/flujo/regalo-textos.js';

// El regalo llega solo el día elegido (spec 2026-10-10): la fase del tick de
// 15 minutos que se lo manda a quien recibe y le avisa a quien compró.

/** Un cliente donde toda consulta a `tabla` (lectura o escritura) da `error`; las demás van a la base falsa. */
function conTablaRota(base: ReturnType<typeof crearBaseFalsa>, tabla: string, error: { code: string; message: string }) {
  const rota: any = new Proxy({}, {
    get: (_t, prop) => prop === 'then'
      ? (ok: any, ko: any) => Promise.resolve({ data: null, error }).then(ok, ko)
      : () => rota,
  });
  return { from: (t: string) => (t === tabla ? rota : base.cliente.from(t)) } as any;
}

// 24/12 a las 10 en Buenos Aires = 13:00 UTC.
const A_LA_HORA = new Date('2026-12-24T13:00:00Z');
const ANTES = new Date('2026-12-24T12:45:00Z');

type Fila = Record<string, unknown>;

function armar(o: {
  regalo?: Fila; narrador?: Fila; region?: string; mailOk?: boolean; plantillaLista?: boolean;
  plantillaFalla?: boolean; numeroPublico?: string | null;
} = {}) {
  const base = crearBaseFalsa({
    familias: [{ id: 'f1', email: 'lucia@ejemplo.com', region: o.region ?? 'AR' }],
    narradores: [{ id: 'n1', familia_id: 'f1', como_le_dicen: 'abuelo', estado: 'regalo_pendiente', telefono_whatsapp: null, contexto: { regalo: true, trato: 'vos', genero: 'varon' }, ...o.narrador }],
    regalos: [{
      id: 'r1', codigo: 'VF-7K3M2Q', narrador_id: 'n1', pedido_id: 'p1', quien_regala: 'Lucía', mensaje: 'Te quiero, abuelo.\nContame todo.',
      audio_path: null, fecha_entrega: '2026-12-24', usado_at: null, usado_por_telefono: null, recordatorio_at: null,
      entrega_canal: 'mail', entrega_contacto: 'abuelo@gmail.com', entrega_hora: 10, entrega_zona: 'America/Argentina/Buenos_Aires',
      entrega_enviada_at: null, entrega_fallo: null, created_at: '2026-10-10T12:00:00Z',
      ...o.regalo,
    }],
    envios: [],
  });
  const mails: { para: string; asunto: string; html: string }[] = [];
  const familia: { familiaId: string; asunto: string; cuerpo: string; narradorId: string; boton?: boolean }[] = [];
  const plantillas: { tel: string; nombre: string; vars: string[]; idiomaMeta: string; botonUrl: string }[] = [];
  const deps: DepsEntrega = {
    db: base.cliente,
    mandarMail: async (para, asunto, html) => { mails.push({ para, asunto, html }); return o.mailOk ?? true; },
    mandarMailFamilia: async (familiaId, asunto, cuerpo, narradorId, op) => {
      familia.push({ familiaId, asunto, cuerpo, narradorId, boton: op?.boton });
      return true;
    },
    enviarPlantilla: async (tel, nombre, vars, idiomaMeta, op) => {
      if (o.plantillaFalla) throw new Error('WhatsApp rechazó el envío');
      plantillas.push({ tel, nombre, vars, idiomaMeta, botonUrl: op.botonUrl });
      return 'wamid.R1';
    },
    urlBase: 'https://www.vitacorafamiliar.com',
    numeroPublico: o.numeroPublico === undefined ? '5491112345678' : o.numeroPublico,
    plantillaLista: () => o.plantillaLista ?? true,
  };
  return { base, deps, mails, familia, plantillas };
}

describe('entregarRegalos por mail', () => {
  it('antes de la hora no sale nada', async () => {
    const { deps, mails, base } = armar();
    expect(await entregarRegalos(deps, ANTES)).toBe(0);
    expect(mails).toEqual([]);
    expect(base.tablas.regalos[0].entrega_enviada_at).toBeNull();
  });

  it('a la hora: el mail a quien recibe con el mensaje, el link, el número y el código, y el «Hoy le llegó» sin botón', async () => {
    const { deps, mails, familia, base } = armar();
    expect(await entregarRegalos(deps, A_LA_HORA)).toBe(1);
    expect(mails).toHaveLength(1);
    const t = ENTREGA_ABUELO['es-AR'];
    expect(mails[0].para).toBe('abuelo@gmail.com');
    expect(mails[0].asunto).toBe(t.asunto('Lucía'));
    expect(mails[0].html).toContain(t.titulo('abuelo', 'Lucía'));
    expect(mails[0].html).toContain(t.antesDelMensaje);
    expect(mails[0].html).toContain('Te quiero, abuelo.<br>Contame todo.');
    for (const linea of t.explica) expect(mails[0].html).toContain(linea);
    expect(mails[0].html).toContain('href="https://www.vitacorafamiliar.com/regalo/VF-7K3M2Q"');
    expect(mails[0].html).toContain(t.boton);
    expect(mails[0].html).toContain(t.debajoDelBoton('+5491112345678'));
    expect(mails[0].html).toContain('VF-7K3M2Q');
    expect(mails[0].html).not.toContain(t.siHayAudio);
    expect(familia).toEqual([{
      familiaId: 'f1', asunto: ENTREGA_COMPRADOR.vos.llegoAsunto('abuelo'), cuerpo: ENTREGA_COMPRADOR.vos.llegoCuerpo('abuelo@gmail.com'),
      narradorId: 'n1', boton: false,
    }]);
    expect(base.tablas.regalos[0].entrega_enviada_at).toBe(A_LA_HORA.toISOString());
    expect(base.tablas.regalos[0].entrega_fallo).toBeNull();
  });

  it('un tick después no lo vuelve a mandar', async () => {
    const { deps, mails } = armar();
    await entregarRegalos(deps, A_LA_HORA);
    expect(await entregarRegalos(deps, new Date('2026-12-24T13:15:00Z'))).toBe(0);
    expect(mails).toHaveLength(1);
  });

  it('dos ticks a la vez: sale una sola vez', async () => {
    const { deps, mails } = armar();
    await Promise.all([entregarRegalos(deps, A_LA_HORA), entregarRegalos(deps, A_LA_HORA)]);
    expect(mails).toHaveLength(1);
  });

  it('con audio, la línea del audio', async () => {
    const { deps, mails } = armar({ regalo: { audio_path: 'n1/regalo/mensaje' } });
    await entregarRegalos(deps, A_LA_HORA);
    expect(mails[0].html).toContain(ENTREGA_ABUELO['es-AR'].siHayAudio);
  });

  it('sin el número del bot, sale sin el código ni la línea de abajo del botón', async () => {
    const { deps, mails } = armar({ numeroPublico: null });
    await entregarRegalos(deps, A_LA_HORA);
    expect(mails[0].html).toContain('/regalo/VF-7K3M2Q');
    expect(mails[0].html).not.toContain('Si el botón');
    expect(mails[0].html.match(/VF-7K3M2Q/g)).toHaveLength(1); // solo en el link
  });

  it('el mensaje se escapa', async () => {
    const { deps, mails } = armar({ regalo: { mensaje: '<script>alert(1)</script>' } });
    await entregarRegalos(deps, A_LA_HORA);
    expect(mails[0].html).not.toContain('<script>');
    expect(mails[0].html).toContain('&lt;script&gt;');
  });

  it('ya canjeado: no sale', async () => {
    const { deps, mails } = armar({ regalo: { usado_at: '2026-12-20T10:00:00Z' } });
    expect(await entregarRegalos(deps, A_LA_HORA)).toBe(0);
    expect(mails).toEqual([]);
  });

  it('el narrador ya no está en regalo_pendiente (sin pagar o canjeado): no sale ni se marca', async () => {
    const { deps, mails, base } = armar({ narrador: { estado: 'pendiente_pago' } });
    expect(await entregarRegalos(deps, A_LA_HORA)).toBe(0);
    expect(mails).toEqual([]);
    expect(base.tablas.regalos[0].entrega_enviada_at).toBeNull();
  });

  it('sin canal (se la da en mano): no sale', async () => {
    const { deps, mails } = armar({ regalo: { entrega_canal: null, entrega_contacto: null, entrega_hora: null, entrega_zona: null } });
    expect(await entregarRegalos(deps, A_LA_HORA)).toBe(0);
    expect(mails).toEqual([]);
  });

  it('el mail falla: anota el fallo, avisa «dásela vos» con el botón y no lo reintenta', async () => {
    const { deps, familia, base, mails } = armar({ mailOk: false });
    expect(await entregarRegalos(deps, A_LA_HORA)).toBe(0);
    expect(base.tablas.regalos[0].entrega_fallo).toBe('mail');
    expect(familia).toEqual([{
      familiaId: 'f1', asunto: ENTREGA_COMPRADOR.vos.falloAsunto('abuelo'), cuerpo: ENTREGA_COMPRADOR.vos.falloCuerpo('abuelo@gmail.com'),
      narradorId: 'n1', boton: true,
    }]);
    await entregarRegalos(deps, new Date('2026-12-24T13:15:00Z'));
    expect(mails).toHaveLength(1);
  });

  it('el bot estuvo caído y vuelve el mismo día: sale igual', async () => {
    const { deps, mails } = armar();
    expect(await entregarRegalos(deps, new Date('2026-12-24T22:00:00Z'))).toBe(1); // 19 en Buenos Aires
    expect(mails).toHaveLength(1);
  });

  it('el bot vuelve otro día: no lo manda tarde, le avisa a quien compró', async () => {
    const { deps, mails, familia, base } = armar();
    expect(await entregarRegalos(deps, new Date('2026-12-25T13:00:00Z'))).toBe(0);
    expect(mails).toEqual([]);
    expect(base.tablas.regalos[0].entrega_fallo).toBe('dia_vencido');
    expect(familia[0].asunto).toBe(ENTREGA_COMPRADOR.vos.falloAsunto('abuelo'));
  });

  it('quien compró desde España: los avisos de tú', async () => {
    const { deps, familia } = armar({ region: 'ES' });
    await entregarRegalos(deps, A_LA_HORA);
    expect(familia[0].asunto).toBe(ENTREGA_COMPRADOR.tu.llegoAsunto('abuelo'));
  });

  it('un regalo en catalán: el mail en catalán, a la hora de Madrid', async () => {
    const { deps, mails } = armar({
      narrador: { contexto: { regalo: true, idioma: 'ca', genero: 'mujer' } },
      regalo: { entrega_zona: 'Europe/Madrid' },
    });
    expect(await entregarRegalos(deps, new Date('2026-12-24T08:45:00Z'))).toBe(0);
    expect(await entregarRegalos(deps, new Date('2026-12-24T09:00:00Z'))).toBe(1);
    expect(mails[0].asunto).toBe(ENTREGA_ABUELO.ca.asunto('Lucía'));
    expect(mails[0].html).toContain(ENTREGA_ABUELO.ca.boton);
  });

  it('sin la migración (columna desconocida) o sin la tabla: 0 y no tira', async () => {
    const { deps, base, mails } = armar();
    for (const error of [
      { code: '42703', message: 'column regalos.entrega_canal does not exist' },
      { code: 'PGRST204', message: "Could not find the 'entrega_canal' column of 'regalos'" },
      { code: '42P01', message: 'relation "regalos" does not exist' },
    ]) {
      expect(await entregarRegalos({ ...deps, db: conTablaRota(base, 'regalos', error) }, A_LA_HORA)).toBe(0);
    }
    expect(mails).toEqual([]);
  });

  it('otro error de la base: tira (el scheduler lo anota y sigue)', async () => {
    const { deps, base } = armar();
    await expect(entregarRegalos({ ...deps, db: conTablaRota(base, 'regalos', { code: '57014', message: 'timeout' }) }, A_LA_HORA)).rejects.toBeTruthy();
  });
});

describe('entregarRegalos: envíos cortados y compras viejas (revisión)', () => {
  it('mientras se manda queda «enviando» y al salir se limpia', async () => {
    const { deps, base } = armar();
    let duranteElEnvio: unknown;
    const mandarMail = deps.mandarMail;
    deps.mandarMail = async (...a) => { duranteElEnvio = base.tablas.regalos[0].entrega_fallo; return mandarMail(...a); };
    await entregarRegalos(deps, A_LA_HORA);
    expect(duranteElEnvio).toBe('enviando');
    expect(base.tablas.regalos[0].entrega_fallo).toBeNull();
  });

  it('un envío cortado (deploy en el medio) se detecta después de 30 minutos y avisa «dásela vos»', async () => {
    const { deps, base, familia, mails } = armar({ regalo: { entrega_enviada_at: '2026-12-24T13:00:00.000Z', entrega_fallo: 'enviando' } });
    await entregarRegalos(deps, new Date('2026-12-24T13:15:00Z'));
    expect(familia).toEqual([]);
    await entregarRegalos(deps, new Date('2026-12-24T13:30:00Z'));
    expect(base.tablas.regalos[0].entrega_fallo).toBe('interrumpido');
    expect(familia).toHaveLength(1);
    expect(familia[0].asunto).toBe(ENTREGA_COMPRADOR.vos.falloAsunto('abuelo'));
    expect(mails).toEqual([]);
  });

  it('una compra sin pagar con fecha de hace días ya no se relee', async () => {
    const { deps, base } = armar({ narrador: { estado: 'pendiente_pago' }, regalo: { fecha_entrega: '2026-12-20' } });
    let lecturas = 0;
    const db = base.cliente as any;
    deps.db = { from: (t: string) => { if (t === 'narradores') lecturas++; return db.from(t); } } as any;
    await entregarRegalos(deps, A_LA_HORA);
    expect(lecturas).toBe(0);
  });
});

describe('entregarRegalos por WhatsApp', () => {
  const WA = { entrega_canal: 'whatsapp', entrega_contacto: '+5491155551234' };

  it('manda la plantilla del idioma con el nombre, quien regala y el código en el botón, y la anota en envios', async () => {
    const { deps, plantillas, base, familia } = armar({ regalo: WA });
    expect(await entregarRegalos(deps, A_LA_HORA)).toBe(1);
    expect(plantillas).toEqual([{ tel: '+5491155551234', nombre: 'regalo_entrega_vos', vars: ['abuelo', 'Lucía'], idiomaMeta: 'es', botonUrl: 'VF-7K3M2Q' }]);
    expect(base.tablas.envios).toEqual([expect.objectContaining({ narrador_id: 'n1', tipo: 'regalo_entrega', wa_message_id: 'wamid.R1' })]);
    expect(familia[0].cuerpo).toBe(ENTREGA_COMPRADOR.vos.llegoCuerpo('+5491155551234'));
  });

  it('en castellano de España, la plantilla es_ES', async () => {
    const { deps, plantillas } = armar({ regalo: { ...WA, entrega_zona: 'Europe/Madrid' }, narrador: { contexto: { regalo: true, idioma: 'es-ES', genero: 'mujer' } } });
    await entregarRegalos(deps, new Date('2026-12-24T09:00:00Z'));
    expect(plantillas[0]).toMatchObject({ nombre: 'regalo_entrega_es_es', idiomaMeta: 'es_ES' });
  });

  it('sin la plantilla aprobada: no manda y avisa «dásela vos»', async () => {
    const { deps, plantillas, base, familia } = armar({ regalo: WA, plantillaLista: false });
    expect(await entregarRegalos(deps, A_LA_HORA)).toBe(0);
    expect(plantillas).toEqual([]);
    expect(base.tablas.regalos[0].entrega_fallo).toBe('sin_plantilla');
    expect(familia[0].asunto).toBe(ENTREGA_COMPRADOR.vos.falloAsunto('abuelo'));
  });

  it('Meta rechaza la plantilla: fallo y «dásela vos»', async () => {
    const { deps, base, familia } = armar({ regalo: WA, plantillaFalla: true });
    expect(await entregarRegalos(deps, A_LA_HORA)).toBe(0);
    expect(base.tablas.regalos[0].entrega_fallo).toBe('whatsapp');
    expect(familia).toHaveLength(1);
  });
});

describe('fallarEntregaRegalo', () => {
  it('Meta avisa el fallo mientras el tick todavía está en «enviando»: igual se anota y se avisa', async () => {
    const { deps, base, familia } = armar({ regalo: { entrega_canal: 'whatsapp', entrega_contacto: '+5491155551234', entrega_enviada_at: '2026-12-24T13:00:00Z', entrega_fallo: 'enviando' } });
    await fallarEntregaRegalo(deps, 'n1', 'meta:131026');
    expect(base.tablas.regalos[0].entrega_fallo).toBe('meta:131026');
    expect(familia).toHaveLength(1);
  });

  it('anota el fallo una sola vez y avisa una sola vez', async () => {
    const { deps, base, familia } = armar({ regalo: { entrega_canal: 'whatsapp', entrega_contacto: '+5491155551234', entrega_enviada_at: '2026-12-24T13:00:00Z' } });
    await fallarEntregaRegalo(deps, 'n1', 'meta:131026');
    await fallarEntregaRegalo(deps, 'n1', 'meta:131026');
    expect(base.tablas.regalos[0].entrega_fallo).toBe('meta:131026');
    expect(familia).toHaveLength(1);
    expect(familia[0].cuerpo).toBe(ENTREGA_COMPRADOR.vos.falloCuerpo('+5491155551234'));
  });
  it('un regalo sin canal no se marca ni avisa', async () => {
    const { deps, base, familia } = armar({ regalo: { entrega_canal: null, entrega_contacto: null, entrega_hora: null, entrega_zona: null } });
    await fallarEntregaRegalo(deps, 'n1', 'meta:1');
    expect(base.tablas.regalos[0].entrega_fallo).toBeNull();
    expect(familia).toEqual([]);
  });
});

describe('enmascarar', () => {
  it('deja ver poco de un correo o un teléfono', () => {
    expect(enmascarar('abuelo@gmail.com')).toBe('ab***@gmail.com');
    expect(enmascarar('+5491155551234')).toBe('+54***1234');
  });
});
