import { afterEach, describe, it, expect, vi } from 'vitest';

vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com' }) }));

import { AlmacenMemoria } from '../src/escritor/almacen/memoria.js';
import * as privacidad from '../src/escritor/produccion/privacidad.js';
import { avisarDudasSinContestar, sacarRespuestasDeDudasViejas, DUDAS_SIN_CONTESTAR_AVISADAS, dudasAQuienConto, esPrivado, esperaPorElNarrador, HORAS_PARA_SACAR, plazoParaSacar, regla, restaPlazoDudas, volverAMirarEn } from '../src/escritor/produccion/privacidad.js';
import { dudasParaLaFamilia, esperaPorDudas } from '../src/escritor/produccion/libro-v3.js';
import { armarLibroDeImprenta, imprentaFrenada } from '../src/libro/imprenta.js';
import { asuntoRecordatorioFrases, cuerpoRecordatorioFrases } from '../src/mail/frases.js';

// Privacidad del panel en la fábrica (Naza y Joaquín, 05/11).

const REGALO = { vinculoComprador: 'hija' };
const PROPIA = { vinculoComprador: 'yo mismo' };

function baseCon(narrador: Record<string, unknown>, archivos: Record<string, string> = {}) {
  const mapa = new Map(Object.entries(archivos));
  const db = {
    from: () => {
      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.eq = () => q;
      q.maybeSingle = async () => ({ data: narrador, error: null });
      return q;
    },
    storage: {
      from: () => ({
        download: async (ruta: string) => (mapa.has(ruta) ? { data: new Blob([mapa.get(ruta)!]), error: null } : { data: null, error: { message: 'Object not found' } }),
        upload: async (ruta: string, c: string) => { mapa.set(ruta, String(c)); return { error: null }; },
        list: async (pre: string) => ({ data: [...mapa.keys()].filter((k) => k.startsWith(`${pre}/`)).map((k) => ({ name: k.slice(pre.length + 1) })), error: null }),
      }),
    },
  };
  return { db: db as never, mapa };
}

const D1 = { id: 'D01', pregunta: '¿Cómo se escribe el apellido?', opciones: ['Pérez', 'Peres'] };
const D2 = { id: 'D02', pregunta: '¿Quién era la mujer de Tandil?' };
const H = 3_600_000;

describe('la regla', () => {
  it('es la misma de la web', () => {
    expect(esPrivado(REGALO)).toBe(true);
    expect(esPrivado({ modo: 'historia', ...REGALO })).toBe(true);
    expect(esPrivado(null)).toBe(true);
    expect(esPrivado(PROPIA)).toBe(false);
    expect(esPrivado({ modo: 'viaje', ...REGALO })).toBe(false);
    expect(esPrivado({ modo: 'kids', ...REGALO })).toBe(false);
  });
});

describe('las 48 horas del narrador', () => {
  const ultima = '2026-11-01T12:00:00Z';
  const ahora = Date.parse(ultima);
  it('el libro de un regalo espera 48 horas desde su último mensaje', async () => {
    const { db } = baseCon({ contexto: REGALO, ultima_respuesta_at: ultima });
    expect(HORAS_PARA_SACAR).toBe(48);
    expect(await esperaPorElNarrador(db, 'n1', ahora)).toBe(48 * 3600_000);
    expect(await esperaPorElNarrador(db, 'n1', ahora + 47 * 3600_000)).toBe(3600_000);
    expect(await esperaPorElNarrador(db, 'n1', ahora + 49 * 3600_000)).toBe(0);
  });
  it('para mí no espera; sin nada contado tampoco', async () => {
    expect(await esperaPorElNarrador(baseCon({ contexto: PROPIA, ultima_respuesta_at: ultima }).db, 'n1', ahora)).toBe(0);
    expect(await esperaPorElNarrador(baseCon({ contexto: REGALO, ultima_respuesta_at: null }).db, 'n1', ahora)).toBe(0);
    expect(plazoParaSacar({ contexto: PROPIA, ultima_respuesta_at: ultima })).toBeNull();
  });
});

describe('todas las dudas de un regalo van a quien contó (Naza, 06/11)', () => {
  const dudas = JSON.stringify({ dudas: [D1, D2] });
  const carpeta = 'n1/escritor';
  const ahora = Date.parse('2026-11-10T12:00:00Z');
  const hace = (horas: number) => new Date(ahora - horas * H).toISOString();

  it('ya no hay clasificador', () => {
    for (const n of ['asegurarDestinoDudas', 'dudasQueCuentan', 'dudasVisibles', 'clasificacionVigente', 'leerClasificacion', 'PROMPT_CLASIFICAR_DUDAS', 'avisarOcultasSinContestar', 'DESTINO_DUDAS']) {
      expect(Object.keys(privacidad)).not.toContain(n);
    }
  });

  it('los mails cuentan todas, aunque quede un dudas-destino.json viejo', async () => {
    const { db, mapa } = baseCon({ contexto: REGALO }, {
      [`${carpeta}/carpeta-A.json`]: '{}', [`${carpeta}/dudas-familia.json`]: dudas,
      [`${carpeta}/dudas-destino.json`]: JSON.stringify({ dudas: [{ ...D1, destino: 'familia' }, { ...D2, destino: 'narrador' }] }),
      [`${carpeta}/correcciones.json`]: JSON.stringify({ correcciones: [{ dudaId: 'D01', texto: 'Pérez' }] }),
    });
    expect(await dudasParaLaFamilia(db, 'n1')).toEqual({ cantidad: 2, contestadas: false, plazoVencido: false });
    mapa.delete(`${carpeta}/dudas-destino.json`);
    expect(await dudasParaLaFamilia(db, 'n1')).toEqual({ cantidad: 2, contestadas: false, plazoVencido: false });
  });

  it('una duda que antes era oculta ahora se espera', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir('dudas-familia.json', JSON.stringify({ dudas: [D2] }));
    await almacen.escribir('dudas-avisadas.txt', hace(1));
    await almacen.escribir('dudas-destino.json', JSON.stringify({ dudas: [{ ...D2, destino: 'narrador' }] }));
    expect(await esperaPorDudas(baseCon({ contexto: REGALO }).db, 'n1', almacen, ahora)).toBe(71 * H);
  });

  it('el plazo: 72 horas desde el WhatsApp o, si nunca salió, desde el mail a los socios', async () => {
    const almacen = new AlmacenMemoria();
    expect(await restaPlazoDudas(almacen, hace(10), ahora)).toBe(62 * H);
    await almacen.escribir('dudas-narrador-avisadas.txt', hace(1));
    expect(await restaPlazoDudas(almacen, hace(100), ahora)).toBe(71 * H);
    await almacen.escribir('dudas-narrador-avisadas.txt', hace(72));
    expect(await restaPlazoDudas(almacen, null, ahora)).toBe(0);
  });

  it('el plazo: una marca del futuro se ignora y pasa al respaldo, en cada vuelta: no traba el libro', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir('dudas-narrador-avisadas.txt', new Date(ahora + 500 * H).toISOString());
    expect(await restaPlazoDudas(almacen, hace(10), ahora)).toBe(62 * H);
    expect(await restaPlazoDudas(almacen, hace(10), ahora + 62 * H)).toBe(0);
  });

  it('el plazo: unos minutos de más por el reloj del otro servicio no la invalidan', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir('dudas-narrador-avisadas.txt', new Date(ahora + 60_000).toISOString());
    expect(await restaPlazoDudas(almacen, hace(100), ahora)).toBe(72 * H);
  });

  it('a quién van: privados y «Para mí», no viaje ni kids', () => {
    expect(dudasAQuienConto(REGALO)).toBe(true);
    expect(dudasAQuienConto(null)).toBe(true);
    expect(dudasAQuienConto(PROPIA)).toBe(true);
    expect(dudasAQuienConto({ modo: 'viaje', ...REGALO })).toBe(false);
    expect(dudasAQuienConto({ modo: 'kids', ...REGALO })).toBe(false);
  });

  it('el plazo: una marca vacía o rota no cuenta, y sin ninguna arranca entero', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir('dudas-narrador-avisadas.txt', '');
    expect(await restaPlazoDudas(almacen, hace(10), ahora)).toBe(62 * H);
    await almacen.escribir('dudas-narrador-avisadas.txt', 'rota');
    expect(await restaPlazoDudas(almacen, hace(10), ahora)).toBe(62 * H);
    expect(await restaPlazoDudas(almacen, null, ahora)).toBe(72 * H);
  });

  it('las vueltas de espera miran cada 15 minutos, o antes si falta menos', () => {
    expect(volverAMirarEn(72 * H)).toBe(15 * 60_000);
    expect(volverAMirarEn(60_000)).toBe(60_000);
  });
});

describe('«Hay un error, avisanos» frena la imprenta', () => {
  const frases = JSON.stringify({ version: 1, narrador_id: 'n1', pedido_id: 'p1', confirmado_at: '2026-11-01T00:00:00Z', capitulos: [] });
  it('con el freno no se arma, aunque esté confirmado', async () => {
    const { db } = baseCon({}, { 'n1/paquete/frases.json': frases, 'n1/paquete/frenar_imprenta.json': '{}' });
    expect(await imprentaFrenada(db, 'n1')).toBe(true);
    expect(await armarLibroDeImprenta(db, 'n1')).toBe(false);
    expect(await imprentaFrenada(baseCon({}).db, 'n1')).toBe(false);
  });
});

describe('el recordatorio de los 15 días cuando el libro es para otra persona', () => {
  const vos = cuerpoRecordatorioFrases({ comoLeDicen: 'abuela', enlace: 'https://x/tablero/1/frases', conImpreso: true, vos: true, privado: true });
  const tu = cuerpoRecordatorioFrases({ comoLeDicen: 'abuela', enlace: 'https://x/tablero/1/frases', conImpreso: true, privado: true });
  it('no ofrece cambiar frases y dice las dos salidas', () => {
    expect(vos).toContain('Está bien, mandar a imprimir');
    expect(vos).toContain('Hay un error, avisanos');
    expect(tu).toContain('Hay un error, avísanos');
    expect(vos).not.toMatch(/cambi[aá]|sacar alguna/);
    expect(vos).toContain('Ver el libro');
  });
  it('el asunto', () => {
    expect(asuntoRecordatorioFrases('abuela', true, true)).toBe('El libro de tu abuela espera tu OK para imprimirse');
    expect(asuntoRecordatorioFrases('abuela', false, true)).toBe('El libro de tu abuela espera tu confirmación para imprimirse');
  });
});

describe('la regla, simulando sus dos respuestas', () => {
  afterEach(() => vi.restoreAllMocks());

  it('en false: dudas a quien contó solo si es «Para mí», y sin plazo para sacar', () => {
    vi.spyOn(regla, 'esPrivado').mockReturnValue(false);
    expect(dudasAQuienConto(REGALO)).toBe(false);
    expect(dudasAQuienConto(null)).toBe(false);
    expect(dudasAQuienConto(PROPIA)).toBe(true);
    expect(plazoParaSacar({ contexto: REGALO, ultima_respuesta_at: '2026-11-05T12:00:00Z' })).toBeNull();
  });

  it('en true: dudas a quien contó y plazo para sacar, con cualquier forma de contexto', () => {
    vi.spyOn(regla, 'esPrivado').mockReturnValue(true);
    expect(dudasAQuienConto({ acceso: { elige: true, quien: 'narrador' } })).toBe(true);
    expect(plazoParaSacar({ contexto: {}, ultima_respuesta_at: '2026-11-05T12:00:00Z' })).not.toBeNull();
  });

  it('la regla sin simular es esPrivado', () => {
    expect(regla.esPrivado).toBe(esPrivado);
  });
});

describe('el aviso a los socios si quien contó no contesta', () => {
  const DUDAS = JSON.stringify({ dudas: [{ id: 'D01' }, { id: 'D02' }, { id: 'D03' }] });
  const conMail = (status = 200) => {
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    const fetch = vi.fn(async (_url: string, _init: { body: string }) => new Response('{}', { status }));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };
  const avisar = (almacen: AlmacenMemoria, o: { contexto?: unknown; correcciones?: () => Promise<{ dudaId?: string; texto: string }[]> } = {}) =>
    avisarDudasSinContestar(almacen, { contexto: o.contexto ?? REGALO, archivoDudas: 'dudas-familia.json', quien: async () => 'Marta', correcciones: o.correcciones ?? (async () => []) });
  const conDudas = async () => {
    const a = new AlmacenMemoria();
    await a.escribir('dudas-familia.json', DUDAS);
    return a;
  };
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('dice el nombre y cuántas quedaron, sin las preguntas, y sale una sola vez', async () => {
    const fetch = conMail();
    const a = await conDudas();
    await avisar(a, { correcciones: async () => [{ dudaId: 'D01', texto: 'Sí' }, { dudaId: 'D02', texto: '  ' }] });
    await avisar(a);
    expect(fetch).toHaveBeenCalledTimes(1);
    const { text, subject } = JSON.parse(fetch.mock.calls[0][1].body);
    expect(text).toContain('Se empieza a escribir el libro de Marta con 2 dudas sin contestar. Quien contó no las respondió en el plazo.');
    expect(subject).toContain('Marta');
    expect(Number.isFinite(Date.parse(String(await a.leer(DUDAS_SIN_CONTESTAR_AVISADAS))))).toBe(true);
  });

  it('una sola, en singular', async () => {
    const fetch = conMail();
    const a = await conDudas();
    await avisar(a, { correcciones: async () => [{ dudaId: 'D01', texto: 'Sí' }, { dudaId: 'D02', texto: 'Sí' }] });
    expect(JSON.parse(fetch.mock.calls[0][1].body).text).toContain('con 1 duda sin contestar.');
  });

  it('si el mail no sale, no escribe la marca y se reintenta en la vuelta siguiente, sin tirar', async () => {
    const fetch = conMail(500);
    const a = await conDudas();
    await expect(avisar(a)).resolves.toBeUndefined();
    expect(await a.leer(DUDAS_SIN_CONTESTAR_AVISADAS)).toBeNull();
    await avisar(a);
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('una falla leyendo no frena nada', async () => {
    const fetch = conMail();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const a = await conDudas();
    await expect(avisar(a, { correcciones: async () => { throw new Error('roto'); } })).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('una marca vacía (Etapa A rehecha) no cuenta', async () => {
    const fetch = conMail();
    const a = await conDudas();
    await a.escribir(DUDAS_SIN_CONTESTAR_AVISADAS, '');
    await avisar(a);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('nada si están todas contestadas o no hay dudas', async () => {
    const fetch = conMail();
    const a = await conDudas();
    await avisar(a, { correcciones: async () => ['D01', 'D02', 'D03'].map((dudaId) => ({ dudaId, texto: 'Sí' })) });
    await avisar(new AlmacenMemoria());
    expect(fetch).not.toHaveBeenCalled();
  });

  it('un regalo no privado no avisa: ahí esperar a quien contó nunca fue el plazo', async () => {
    const fetch = conMail();
    vi.spyOn(regla, 'esPrivado').mockReturnValue(false);
    const a = await conDudas();
    await avisar(a);
    expect(fetch).not.toHaveBeenCalled();
    await avisar(a, { contexto: PROPIA });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('una Etapa A rehecha y las correcciones viejas', () => {
  const con = async (t: string) => {
    const a = new AlmacenMemoria();
    await a.escribir('correcciones.json', t);
    return a;
  };

  it('saca las que apuntan a una duda y deja las de los socios', async () => {
    const a = await con(JSON.stringify({ correcciones: [{ dudaId: 'D01', texto: 'Ofelia', quien: 'Marta' }, { texto: 'Se llamaba Salva.' }] }));
    await sacarRespuestasDeDudasViejas(a);
    expect(JSON.parse(String(await a.leer('correcciones.json')))).toEqual({ correcciones: [{ texto: 'Se llamaba Salva.' }] });
  });

  it('también con el archivo como lista', async () => {
    const a = await con(JSON.stringify([{ dudaId: 'D01', texto: 'x' }, { texto: 'y' }]));
    await sacarRespuestasDeDudasViejas(a);
    expect(JSON.parse(String(await a.leer('correcciones.json')))).toEqual([{ texto: 'y' }]);
  });

  it('un archivo roto no se pisa, y sin archivo no crea uno', async () => {
    const a = await con('{ esto no es JSON');
    await sacarRespuestasDeDudasViejas(a);
    expect(await a.leer('correcciones.json')).toBe('{ esto no es JSON');
    const b = await con(JSON.stringify({ otra: 'cosa' }));
    await sacarRespuestasDeDudasViejas(b);
    expect(await b.leer('correcciones.json')).toBe(JSON.stringify({ otra: 'cosa' }));
    const c = new AlmacenMemoria();
    await sacarRespuestasDeDudasViejas(c);
    expect(await c.leer('correcciones.json')).toBeNull();
  });
});
