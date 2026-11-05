import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com' }) }));

import { AlmacenMemoria } from '../src/escritor/almacen/memoria.js';
import {
  asegurarDestinoDudas, avisarOcultasSinContestar, clasificacionVigente, dudasQueCuentan, dudasVisibles, esPrivado, esperaPorElNarrador, HORAS_PARA_SACAR, leerClasificacion, plazoParaSacar,
} from '../src/escritor/produccion/privacidad.js';
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

describe('a quién se le pregunta cada duda', () => {
  it('lo que no vuelve como familia va al narrador', () => {
    expect(leerClasificacion('```json\n{"dudas":[{"id":"D01","destino":"familia"}]}\n```', [D1, D2]).map((d) => d.destino)).toEqual(['familia', 'narrador']);
    expect(() => leerClasificacion('no sé', [D1])).toThrow();
  });
  it('una Etapa A nueva invalida la clasificación', () => {
    const t = JSON.stringify({ dudas: [{ id: 'D01', pregunta: D1.pregunta, destino: 'familia' }] });
    expect(clasificacionVigente([D1], t)).toBe(true);
    expect(clasificacionVigente([{ id: 'D01', pregunta: 'otra' }], t)).toBe(false);
    expect(dudasVisibles([{ id: 'D01', pregunta: 'otra' }], t)).toEqual([]);
    expect(clasificacionVigente([D1], null)).toBe(false);
  });

  describe('con los mails', () => {
    const mails: { subject: string; text: string }[] = [];
    beforeEach(() => {
      mails.length = 0;
      vi.stubEnv('MAIL_SOCIOS', 'socios@x.com');
      vi.stubGlobal('fetch', vi.fn(async (_u: string, init: { body: string }) => { const b = JSON.parse(init.body) as { subject: string; text: string }; mails.push(b); return { ok: true, status: 200, text: async () => '' }; }));
    });
    afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

    const armar = (contexto: unknown) => {
      const { db } = baseCon({ contexto });
      const almacen = new AlmacenMemoria();
      return { db, almacen };
    };
    const opciones = { quien: 'Marta', archivoDudas: 'dudas-familia.json' };

    it('clasifica, guarda el destino y avisa de las ocultas sin citas ni dudas de más', async () => {
      const { db, almacen } = armar(REGALO);
      await almacen.escribir('dudas-familia.json', JSON.stringify({ dudas: [{ ...D1, citas: [{ id: 'R1', texto: 'cita secreta' }] }, D2] }));
      const pedir = vi.fn(async (_s: string, pedido: string) => { expect(pedido).not.toContain('cita secreta'); return '{"dudas":[{"id":"D01","destino":"familia"},{"id":"D02","destino":"narrador"}]}'; });
      await asegurarDestinoDudas(db, 'n1', almacen, { ...opciones, siFalla: 'esperar', pedir });
      expect(JSON.parse((await almacen.leer('dudas-destino.json'))!).dudas.map((d: { destino: string }) => d.destino)).toEqual(['familia', 'narrador']);
      expect(mails).toHaveLength(1);
      expect(mails[0].subject).toContain('una duda oculta');
      expect(mails[0].text).toContain('D02');
      expect(mails[0].text).not.toContain('D01');
      // La segunda vuelta no vuelve a clasificar ni a avisar.
      await asegurarDestinoDudas(db, 'n1', almacen, { ...opciones, siFalla: 'esperar', pedir });
      expect(pedir).toHaveBeenCalledOnce();
      expect(mails).toHaveLength(1);
    });

    it('si el modelo falla: en el tick espera, con el libro encargado van todas al narrador', async () => {
      const { db, almacen } = armar(REGALO);
      await almacen.escribir('dudas-familia.json', JSON.stringify({ dudas: [D1, D2] }));
      const pedir = vi.fn(async () => { throw new Error('caído'); });
      await asegurarDestinoDudas(db, 'n1', almacen, { ...opciones, siFalla: 'esperar', pedir });
      expect(await almacen.leer('dudas-destino.json')).toBeNull();
      await asegurarDestinoDudas(db, 'n1', almacen, { ...opciones, siFalla: 'alNarrador', pedir });
      expect(JSON.parse((await almacen.leer('dudas-destino.json'))!).dudas.every((d: { destino: string }) => d.destino === 'narrador')).toBe(true);
      expect(mails[0].subject).toContain('2 dudas ocultas');
    });

    it('para mí no clasifica', async () => {
      const { db, almacen } = armar(PROPIA);
      await almacen.escribir('dudas-familia.json', JSON.stringify({ dudas: [D1, D2] }));
      const pedir = vi.fn();
      await asegurarDestinoDudas(db, 'n1', almacen, { ...opciones, siFalla: 'alNarrador', pedir });
      expect(pedir).not.toHaveBeenCalled();
      expect(await almacen.leer('dudas-destino.json')).toBeNull();
    });

    it('antes de escribir el libro: avisa una vez de las ocultas sin contestar, no de las contestadas', async () => {
      const { db, almacen } = armar(REGALO);
      await almacen.escribir('dudas-familia.json', JSON.stringify({ dudas: [D1, D2] }));
      await almacen.escribir('dudas-destino.json', JSON.stringify({ dudas: [{ ...D1, destino: 'familia' }, { ...D2, destino: 'narrador' }] }));
      await avisarOcultasSinContestar(db, 'n1', almacen, { ...opciones, contestadas: new Set(['D02']) });
      expect(mails).toHaveLength(0);
      await avisarOcultasSinContestar(db, 'n1', almacen, { ...opciones, contestadas: new Set() });
      expect(mails).toHaveLength(1);
      expect(mails[0].subject).toContain('Se empieza a escribir');
      await avisarOcultasSinContestar(db, 'n1', almacen, { ...opciones, contestadas: new Set() });
      expect(mails).toHaveLength(1);
    });
  });
});

describe('las dudas ocultas no cuentan como pendientes', () => {
  const dudas = JSON.stringify({ dudas: [D1, D2] });
  const destino = JSON.stringify({ dudas: [{ ...D1, destino: 'familia' }, { ...D2, destino: 'narrador' }] });
  const carpeta = 'n1/escritor';

  it('dudasQueCuentan: privada solo las visibles, sin clasificar null, para mí todas', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir('dudas-destino.json', destino);
    const privada = baseCon({ contexto: REGALO }).db;
    expect((await dudasQueCuentan(privada, 'n1', almacen, [D1, D2]))?.map((d) => d.id)).toEqual(['D01']);
    expect(await dudasQueCuentan(privada, 'n1', new AlmacenMemoria(), [D1, D2])).toBeNull();
    expect((await dudasQueCuentan(baseCon({ contexto: PROPIA }).db, 'n1', new AlmacenMemoria(), [D1, D2]))?.map((d) => d.id)).toEqual(['D01', 'D02']);
  });

  it('los mails a la familia cuentan solo las visibles, y con la visible contestada ya está', async () => {
    const { db } = baseCon({ contexto: REGALO }, {
      [`${carpeta}/carpeta-A.json`]: '{}', [`${carpeta}/dudas-familia.json`]: dudas, [`${carpeta}/dudas-destino.json`]: destino,
      [`${carpeta}/correcciones.json`]: JSON.stringify({ correcciones: [{ dudaId: 'D01', texto: 'Pérez' }] }),
    });
    expect(await dudasParaLaFamilia(db, 'n1')).toEqual({ cantidad: 1, contestadas: true });
  });

  it('sin clasificar todavía no se manda el mail a la familia (null)', async () => {
    const { db } = baseCon({ contexto: REGALO }, { [`${carpeta}/carpeta-A.json`]: '{}', [`${carpeta}/dudas-familia.json`]: dudas });
    expect(await dudasParaLaFamilia(db, 'n1')).toBeNull();
  });

  it('la espera: solo ocultas, el libro no espera', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir('dudas-familia.json', JSON.stringify({ dudas: [D2] }));
    await almacen.escribir('dudas-destino.json', JSON.stringify({ dudas: [{ ...D2, destino: 'narrador' }] }));
    expect(await esperaPorDudas(baseCon({ contexto: REGALO }).db, 'n1', almacen)).toBe(0);
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
