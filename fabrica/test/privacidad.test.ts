import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com' }) }));

import { AlmacenMemoria } from '../src/escritor/almacen/memoria.js';
import * as privacidad from '../src/escritor/produccion/privacidad.js';
import { dudasAQuienConto, esPrivado, esperaPorElNarrador, HORAS_PARA_SACAR, plazoParaSacar, restaPlazoDudas, volverAMirarEn } from '../src/escritor/produccion/privacidad.js';
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
