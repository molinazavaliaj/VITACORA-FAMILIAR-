import { describe, it, expect, vi } from 'vitest';
import { crc32 } from 'node:zlib';
import {
  queToca, fechaDeBorrado, soloOriginales, nombreEnZip, enPartes, revisarAudiosOriginales,
  DIAS_AVISO, DIAS_BORRADO,
} from '../src/audios-originales.js';
import { armarZip } from '../src/libro/zip.js';
import { asuntoBorradoAudios, cuerpoBorradoAudios } from '../src/mail/borrado-audios.js';

// El borrado de los audios originales a los 3 meses del libro (18/10), con el mail de
// descarga antes (opción A de Naza).

const dia = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 86_400_000);
const iso = (n: number) => dia(n).toISOString();

describe('queToca', () => {
  it('sin libro listo no pasa nada', () => {
    expect(queToca({}, dia(500))).toBe('nada');
  });
  it('antes del día 76 nada, desde el 76 se avisa', () => {
    expect(queToca({ libroListo: iso(0) }, dia(DIAS_AVISO - 1))).toBe('nada');
    expect(queToca({ libroListo: iso(0) }, dia(DIAS_AVISO))).toBe('avisar');
  });
  it('se borra a los 90 días del libro, y nunca antes de 14 días del aviso', () => {
    expect(queToca({ libroListo: iso(0), aviso: iso(76) }, dia(89))).toBe('nada');
    expect(queToca({ libroListo: iso(0), aviso: iso(76) }, dia(DIAS_BORRADO))).toBe('borrar');
    // El aviso salió tarde (el día 85): el borrado espera hasta el 99.
    expect(queToca({ libroListo: iso(0), aviso: iso(85) }, dia(95))).toBe('nada');
    expect(queToca({ libroListo: iso(0), aviso: iso(85) }, dia(99))).toBe('borrar');
  });
  it('sin aviso nunca se borra, aunque hayan pasado meses', () => {
    expect(queToca({ libroListo: iso(0) }, dia(300))).toBe('avisar');
  });
  it('la descarga se borra a los 45 días del aviso, una vez', () => {
    const c = { libroListo: iso(0), aviso: iso(76), borrado: iso(90) };
    expect(queToca(c, dia(120))).toBe('nada');
    expect(queToca(c, dia(121))).toBe('borrar-descarga');
    expect(queToca({ ...c, descargaBorrada: iso(121) }, dia(200))).toBe('nada');
  });
});

describe('fechaDeBorrado', () => {
  it('90 días del libro, o 14 del aviso si es más tarde', () => {
    expect(fechaDeBorrado(iso(0), dia(76))).toEqual(dia(90));
    expect(fechaDeBorrado(iso(0), dia(85))).toEqual(dia(99));
  });
});

describe('qué se borra', () => {
  it('solo los audios de las respuestas, nunca Su voz ni el paquete', () => {
    const filas = [
      { path: 'n1/dia_05.ogg', orden: 5, repregunta: false, recibido: iso(1) },
      { path: 'n1/voz/frases/f1.mp3', orden: 5, repregunta: false, recibido: iso(1) },
      { path: 'n1/paquete/libro.pdf', orden: 5, repregunta: false, recibido: iso(1) },
    ];
    expect(soloOriginales(filas, 'n1').map((f) => f.path)).toEqual(['n1/dia_05.ogg']);
  });
  it('los nombres dentro del ZIP se entienden y no se pisan', () => {
    const usados = new Set<string>();
    const a = { path: 'n1/x.OGG', orden: 5, repregunta: false, recibido: '2026-09-14T10:00:00Z' };
    expect(nombreEnZip(a, usados)).toBe('2026-09-14 pregunta 05.ogg');
    expect(nombreEnZip(a, usados)).toBe('2026-09-14 pregunta 05 (2).ogg');
    expect(nombreEnZip({ ...a, repregunta: true }, usados)).toBe('2026-09-14 pregunta 05 (repregunta).ogg');
  });
  it('reparte en partes sin pasarse del tope', () => {
    const a = (n: number) => ({ datos: Buffer.alloc(n) });
    expect(enPartes([a(30), a(30), a(30)], 70).map((p) => p.length)).toEqual([2, 1]);
    expect(enPartes([a(100)], 70).map((p) => p.length)).toEqual([1]);
    expect(enPartes([], 70)).toEqual([]);
  });
});

describe('armarZip', () => {
  it('arma un ZIP válido: cabeceras, CRC y directorio', () => {
    const datos = Buffer.from('hola abuela');
    const zip = armarZip([{ nombre: 'año 1.ogg', datos }], new Date(2026, 9, 18, 12, 0, 0));
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    expect(zip.readUInt32LE(14)).toBe(crc32(datos) >>> 0);
    const largoNombre = zip.readUInt16LE(26);
    expect(zip.subarray(30, 30 + largoNombre).toString('utf8')).toBe('año 1.ogg');
    expect(zip.subarray(30 + largoNombre, 30 + largoNombre + datos.length).equals(datos)).toBe(true);
    const fin = zip.length - 22;
    expect(zip.readUInt32LE(fin)).toBe(0x06054b50);
    expect(zip.readUInt16LE(fin + 10)).toBe(1);
    expect(zip.readUInt32LE(zip.readUInt32LE(fin + 16))).toBe(0x02014b50);
  });
});

describe('el mail', () => {
  it('dice la fecha, que el libro y Su voz quedan, y sin dos puntos en lo que lee la familia', () => {
    expect(asuntoBorradoAudios('abuela', dia(90))).toBe('Los audios de tu abuela se borran el 1 de abril');
    const html = cuerpoBorradoAudios({ comoLeDicen: 'abuela', fecha: dia(90), enlaces: ['https://x/1', 'https://x/2'], vos: true });
    expect(html).toContain('descargalos desde acá');
    expect(html).toContain('Son 2 archivos');
    expect(html).toContain('(2 de 2)');
    expect(html).toContain('no se borran');
    const texto = html.replace(/<[^>]+>/g, ' ').replace(/https?:\/\/\S+/g, '');
    expect(texto.includes(': ')).toBe(false);
  });
});

describe('revisarAudiosOriginales', () => {
  it('apagado no lee nada', async () => {
    const db = { from: vi.fn() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await revisarAudiosOriginales(db as any, { env: {}, candadoLibroListo: 'libro_listo_enviado.txt' });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('prendido, a los 90 días borra los originales y deja el candado', async () => {
    const borrados: string[][] = [];
    const subidos: string[] = [];
    const respuestas = [
      { audio_path: 'n1/dia_01.ogg', pregunta_orden: 1, es_repregunta: false, recibido_at: iso(-30) },
      { audio_path: 'n1/voz/frases/f1.mp3', pregunta_orden: 1, es_repregunta: false, recibido_at: iso(-30) },
    ];
    const consulta = (data: unknown) => {
      const c = { select: () => c, eq: () => c, not: () => c, order: () => Promise.resolve({ data, error: null }), then: (ok: (r: unknown) => unknown) => ok({ data, error: null }) };
      return c;
    };
    const db = {
      from: (tabla: string) => consulta(tabla === 'pedidos' ? [{ narrador_id: 'n1' }] : respuestas),
      storage: {
        from: () => ({
          list: async () => ({ data: [{ name: 'libro_listo_enviado.txt', created_at: iso(0) }, { name: 'aviso_borrado_audios.txt', created_at: iso(76) }], error: null }),
          remove: async (r: string[]) => { borrados.push(r); return { error: null }; },
          upload: async (ruta: string) => { subidos.push(ruta); return { data: {}, error: null }; },
        }),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cuenta = await revisarAudiosOriginales(db as any, { env: { BORRADO_AUDIOS_ORIGINALES: '1' }, ahora: dia(90), candadoLibroListo: 'libro_listo_enviado.txt' });
    expect(cuenta.borrar).toBe(1);
    expect(borrados).toEqual([['n1/dia_01.ogg']]);
    expect(subidos).toEqual(['n1/paquete/audios_borrados.txt']);
  });
});
