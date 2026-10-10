import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AlmacenDisco } from '../../src/escritor/almacen/disco.js';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { AlmacenSupabase } from '../../src/escritor/almacen/supabase.js';
import type { Almacen } from '../../src/escritor/almacen/tipos.js';

async function contrato(a: Almacen): Promise<void> {
  expect(await a.leer('pasos/C/3b-capitulo-01.json')).toBeNull();
  await a.escribir('pasos/C/3b-capitulo-01.json', '{"texto": "hola"}');
  expect(await a.leer('pasos/C/3b-capitulo-01.json')).toBe('{"texto": "hola"}');
  await a.escribir('pasos/C/3b-capitulo-01.json', '{"texto": "chau"}');
  expect(await a.leer('pasos/C/3b-capitulo-01.json')).toBe('{"texto": "chau"}');
}

describe('almacén', () => {
  it('en memoria', async () => contrato(new AlmacenMemoria()));

  it('en disco, con subcarpetas', async () => {
    const raiz = mkdtempSync(path.join(tmpdir(), 'almacen-'));
    await contrato(new AlmacenDisco(raiz));
    expect(readFileSync(path.join(raiz, 'pasos', 'C', '3b-capitulo-01.json'), 'utf8')).toBe('{"texto": "chau"}');
  });

  it('en Supabase Storage (bucket audios, con prefijo del narrador; "no existe" es null)', async () => {
    const archivos = new Map<string, string>();
    const subidas: { ruta: string; contentType?: string }[] = [];
    const db = {
      storage: {
        from: (bucket: string) => {
          expect(bucket).toBe('audios');
          return {
            download: async (ruta: string) => (archivos.has(ruta) ? { data: new Blob([archivos.get(ruta) as string]), error: null } : { data: null, error: { message: 'Object not found' } }),
            upload: async (ruta: string, contenido: string, o: { contentType?: string }) => { archivos.set(ruta, contenido); subidas.push({ ruta, contentType: o.contentType }); return { error: null }; },
          };
        },
      },
    };
    await contrato(new AlmacenSupabase(db as never, 'nar-1/escritor'));
    expect(subidas[0]).toEqual({ ruta: 'nar-1/escritor/pasos/C/3b-capitulo-01.json', contentType: 'application/json' });
  });
});
