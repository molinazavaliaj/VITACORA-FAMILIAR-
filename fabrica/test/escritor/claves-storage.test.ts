// fabrica/test/escritor/claves-storage.test.ts
// Todo lo que el escritor guarda en el almacén tiene que ser una clave válida de Supabase Storage
// (en producción el almacén es el bucket `audios`, bajo `<narradorId>/escritor/`).
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import type { Almacen } from '../../src/escritor/almacen/tipos.js';
import { Ejecutor, type Encargo } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { LoteAnthropic, type ClienteLotes } from '../../src/escritor/modelo/lote-anthropic.js';
import type { Contexto } from '../../src/escritor/orquestador/contexto.js';
import { etapaA } from '../../src/escritor/orquestador/etapa-a.js';
import { etapaB } from '../../src/escritor/orquestador/etapa-b.js';
import { etapaC } from '../../src/escritor/orquestador/etapa-c.js';
import { carpetaNelida, DEFECTOS_NELIDA, salidasModeloNelida } from './ayuda.js';

// Copia exacta de VALID_OBJECT_KEY + isValidKey del servidor de Supabase Storage
// (github.com/supabase/storage, src/storage/limits.ts, líneas 88 y 95-98, rama master, 06/10/2026).
// El cliente instalado (@supabase/storage-js 2.112.4) no trae el validador: lo aplica el servidor.
const VALID_OBJECT_KEY = /^[A-Za-z0-9_/!.*'() &$=@;:+,?-]*$/;
const isValidKey = (key: string): boolean => key.length > 0 && VALID_OBJECT_KEY.test(key);

/** El prefijo de producción: `<narradorId>/escritor/`. */
const PREFIJO = '3f1c2a9e-5b7d-4e21-9a0c-1d2e3f4a5b6c/escritor';

class AlmacenQueValida implements Almacen {
  readonly escritas: string[] = [];
  readonly m = new AlmacenMemoria();
  leer(ruta: string): Promise<string | null> {
    return this.m.leer(ruta);
  }
  async escribir(ruta: string, texto: string): Promise<void> {
    this.escritas.push(ruta);
    await this.m.escribir(ruta, texto);
  }
}
const invalidas = (a: AlmacenQueValida): string[] => a.escritas.filter((r) => !isValidKey(`${PREFIJO}/${r}`));

/** Un cliente de lotes que crea el lote y devuelve todo con error: el ejecutor lo resuelve sin lote. */
const clienteLotes: ClienteLotes = {
  messages: {
    batches: {
      create: async () => ({ id: 'msgbatch_1' }),
      retrieve: async () => ({ processing_status: 'ended' }),
      results: async () => (async function* () {})(),
    },
  },
};

describe('claves del almacén = claves válidas de Supabase Storage', () => {
  it('el validador copiado rechaza lo que rechaza el servidor', () => {
    expect(isValidKey('a/pasos/C/3b-capitulo-06__2.json')).toBe(true);
    expect(isValidKey('a/pasos/C/3b-capitulo-06~2.json')).toBe(false);
    expect(isValidKey('a/pasos/C/3b-capitulo-06#2.json')).toBe(false);
  });

  it('un reintento (clave con #) se guarda con una clave válida y se retoma de la memoria', async () => {
    const almacen = new AlmacenQueValida();
    const salidas = { '4-hechos#2': 'no es json', '4-hechos#2#json': '{"problemas": []}' };
    const enc: Encargo = { clave: 'C/4-hechos#2', llamada: { nombre: '4-hechos', docs: ['<ficha>\nf\n</ficha>'], instr: 'x' }, json: true };
    await new Ejecutor({ modelo: new ModeloFalso(salidas), almacen }).uno(enc);
    expect(almacen.escritas.filter((r) => r.startsWith('pasos/'))).toEqual(['pasos/C/4-hechos__2.json', 'pasos/C/4-hechos__2__json.json']);
    expect(invalidas(almacen)).toEqual([]);
    const m2 = new ModeloFalso({});
    expect(await new Ejecutor({ modelo: m2, almacen }).uno(enc)).toBe('{"problemas": []}');
    expect(m2.llamadas).toHaveLength(0);
  });

  it('las tres etapas (con lote) solo escriben claves válidas', async () => {
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    const negra = { ...reg.personas[3], nombre: 'Ofelia Sánchez', apodos: ['la Negra'] };
    const salidas = {
      ...salidasModeloNelida(),
      'correccion-registro': JSON.stringify({ personas: [negra], confirmados: [{ texto: 'La Negra se llamaba Ofelia Sánchez.', usado_en: ['P04'] }] }),
      'correccion-plan': salidasModeloNelida()['2-plan'],
    };
    const almacen = new AlmacenQueValida();
    const modelo = new ModeloFalso(salidas, DEFECTOS_NELIDA);
    const ej = new Ejecutor({ modelo, lote: new LoteAnthropic(clienteLotes, almacen, { esperar: async () => {} }), almacen, esperar: async () => {} });
    const x: Contexto = { c: carpetaNelida(['entradas']), ej, almacen, log: () => {}, usarLote: true };
    expect((await etapaA(x)).ok).toBe(true);
    expect((await etapaB(x, [{ texto: 'La Negra se llamaba Ofelia Sánchez.', dudaId: 'D01' }])).ok).toBe(true);
    await etapaC(x);
    const tipos = new Set(almacen.escritas.map((r) => r.split('/')[0].replace(/-[ABC]\.json$/, '')));
    for (const t of ['pasos', 'lotes', 'costos.json', 'carpeta', 'dudas-familia.json', 'libro.md', 'informe.md']) expect(tipos, t).toContain(t);
    expect(invalidas(almacen)).toEqual([]);
  }, 60_000);
});
