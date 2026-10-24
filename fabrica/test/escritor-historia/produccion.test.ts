// Task 5.3 del plan de «Vitácora de una historia»: el libro de historia enchufado al worker
// (src/escritor-historia/produccion/libro-historia.ts), con el modelo falso, la historia inventada de Rubén y una base
// falsa en memoria. Cero gasto: nunca se llama a un modelo de verdad. El PDF no se arma (Playwright): es de mentira.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/libro/pdf.js', () => ({ htmlAPdf: vi.fn(async () => Buffer.from('%PDF-1.4 de mentira')) }));
vi.mock('../../src/libro/publicar-frases.js', () => ({ publicarFrases: vi.fn(async () => undefined) }));
vi.mock('../../src/config.js', () => ({
  cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com', anthropicApiKey: 'x', supabaseServiceRoleKey: 'secreto-de-prueba' }),
}));

import { anotarUsoEscritorHistoria } from '../../src/costos.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { carpetaDeHistoria } from '../../src/escritor-historia/material/carpeta.js';
import { alEntregarHistoria, colaHistoria, escritorHistoriaPrendido, revisarLibrosHistoria, topeHistoria, type MotorHistoria } from '../../src/escritor-historia/produccion/libro-historia.js';
import { narradoresConHistoria } from '../../src/historia/candado.js';
import { DEFECTOS_RUBEN, RUBEN, salidasRuben } from './ayuda.js';

const ID = '3f6c2a10-8b4e-4d71-9a2c-5e0b7d1f4c88'; // Rubén, inventado
type Fila = Record<string, unknown>;

/** Base falsa en memoria (la de los tests de Kids): tablas por nombre y Storage por ruta. */
function baseFalsa(tablas: Record<string, Fila[]>) {
  const archivos = new Map<string, string | Buffer>();
  const db = {
    from(tabla: string) {
      const filtros: ((f: Fila) => boolean)[] = [];
      let cambios: Fila | null = null;
      let nueva: Fila | null = null;
      const resultado = () => {
        if (!(tabla in tablas)) return { data: null, error: { code: 'PGRST205', message: `could not find the table ${tabla}` } };
        if (nueva) { tablas[tabla].push(nueva); return { data: [nueva], error: null }; }
        const r = tablas[tabla].filter((f) => filtros.every((x) => x(f)));
        if (cambios) for (const f of r) Object.assign(f, cambios);
        return { data: r.map((f) => ({ ...f })), error: null };
      };
      const q: any = {
        select: () => q,
        order: () => q,
        not: () => q,
        eq: (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return q; },
        in: (c: string, vs: unknown[]) => { filtros.push((f) => vs.includes(f[c])); return q; },
        is: (c: string, v: unknown) => { filtros.push((f) => (f[c] ?? null) === v); return q; },
        update: (c: Fila) => { cambios = c; return q; },
        insert: (f: Fila) => { nueva = f; return q; },
        maybeSingle: async () => { const r = resultado(); return { data: r.data?.[0] ?? null, error: r.error }; },
        then: (ok: any, ko: any) => Promise.resolve(resultado()).then(ok, ko),
      };
      return q;
    },
    storage: {
      from: () => ({
        download: async (ruta: string) => {
          const t = archivos.get(ruta);
          return t === undefined ? { data: null, error: { message: 'Object not found' } } : { data: new Blob([t]), error: null };
        },
        upload: async (ruta: string, cuerpo: string | Buffer) => { archivos.set(ruta, cuerpo); return { error: null }; },
        remove: async (rutas: string[]) => { for (const r of rutas) archivos.delete(r); return { error: null }; },
        list: async (pre: string) => {
          const nombres = new Set<string>();
          for (const k of archivos.keys()) if (k.startsWith(`${pre}/`)) nombres.add(k.slice(pre.length + 1).split('/')[0]);
          return { data: [...nombres].map((name) => ({ name })), error: null };
        },
      }),
    },
  };
  return { db: db as any, archivos, tablas };
}

function tablasDeRuben(o: { pedido?: boolean; aprobado?: boolean; estado?: string } = {}): Record<string, Fila[]> {
  return {
    historias: [{ narrador_id: ID }],
    narradores: [{ id: ID, nombre: 'Rubén', como_le_dicen: 'Rubén', estado: o.estado ?? 'completado', libro_aprobado_at: o.aprobado ? '2026-10-24T10:00:00.000Z' : null, contexto: {}, foto_url: null, edicion: null }],
    pedidos: o.pedido ? [{ id: 'p1', narrador_id: ID, estado: 'pagado' }] : [],
    consumo_ia: [],
  };
}

function motorFalso(db: unknown) {
  const modelo = new ModeloFalso(salidasRuben(), DEFECTOS_RUBEN);
  const motor: MotorHistoria = {
    // Con el anotador de verdad: cada llamada va a consumo_ia, con su paso.
    ejecutor: ({ almacen, log }) => ({ ej: new Ejecutor({ modelo, almacen, log, alAnotar: (f) => anotarUsoEscritorHistoria(db as never, ID, f) }), usarLote: false }),
    material: async () => ({ c: carpetaDeHistoria(RUBEN), audios: [], propia: false }),
  };
  return { motor, modelo };
}

async function vuelta(db: unknown, motor: MotorHistoria): Promise<void> {
  await revisarLibrosHistoria(db as never, { motor });
  await colaHistoria.esperarTodo();
}

let mails: { subject: string; text?: string }[];
beforeEach(() => {
  mails = [];
  vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
  vi.stubEnv('ESCRITOR_HISTORIA', '1');
  vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '0');
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => { mails.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }); }));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  await colaHistoria.esperarTodo();
  alEntregarHistoria(async () => undefined);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const prefijo = (a: string) => `${ID}/escritor-historia/${a}`;

describe('el libro de historia en el worker', () => {
  it('apagado (sin ESCRITOR_HISTORIA) no escribe nada, ni la Etapa A', async () => {
    vi.stubEnv('ESCRITOR_HISTORIA', '');
    const { db, archivos, tablas } = baseFalsa(tablasDeRuben({ pedido: true, aprobado: true }));
    const { motor, modelo } = motorFalso(db);
    await vuelta(db, motor);
    expect(modelo.llamadas).toHaveLength(0);
    expect(archivos.size).toBe(0);
    expect(tablas.pedidos[0].estado).toBe('pagado');
  });

  it('solo:<id> prende a ese narrador y a ningún otro; el tope por defecto es 10', () => {
    vi.stubEnv('ESCRITOR_HISTORIA', `solo:${ID}`);
    expect(escritorHistoriaPrendido(ID)).toBe(true);
    expect(escritorHistoriaPrendido('otro')).toBe(false);
    expect(topeHistoria()).toBe(10);
    vi.stubEnv('ESCRITOR_HISTORIA_TOPE_USD', '4');
    expect(topeHistoria()).toBe(4);
  });

  it('terminó la entrevista → Etapa A sola (el pedido sin el libro cerrado no se toca) y el mail de dudas a los socios', async () => {
    const { db, archivos, tablas } = baseFalsa(tablasDeRuben({ pedido: true }));
    const { motor, modelo } = motorFalso(db);
    await vuelta(db, motor);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/2-plan', 'A/dudas']);
    expect(archivos.has(prefijo('carpeta-A.json'))).toBe(true);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    await vuelta(db, motor);
    expect(mails.filter((m) => m.subject.includes('Dudas de datos del libro de historia de Rubén'))).toHaveLength(1);
    expect(archivos.has(prefijo('dudas-avisadas.txt'))).toBe(true);
    expect(modelo.llamadas).toHaveLength(3);
  });

  it('pedido pagado + libro cerrado → el libro entero: libro.md en su carpeta, PDF y HTML, pedido entregado, costos con su paso', async () => {
    const { db, archivos, tablas } = baseFalsa(tablasDeRuben({ pedido: true, aprobado: true }));
    const { motor, modelo } = motorFalso(db);
    const entregados: string[] = [];
    alEntregarHistoria(async (_db, id) => { entregados.push(id); });
    await vuelta(db, motor);
    expect(tablas.pedidos[0]).toMatchObject({ estado: 'entregado', libro_pdf_path: `${ID}/paquete/libro.pdf` });
    expect(String(archivos.get(prefijo('libro.md')))).toContain('# La valija verde');
    expect(archivos.has(`${ID}/paquete/libro.pdf`) && archivos.has(`${ID}/paquete/libro.html`)).toBe(true);
    expect(String(archivos.get(`${ID}/paquete/libro.html`))).toContain('La valija verde');
    expect(entregados).toEqual([ID]);
    expect(modelo.llamadas.some((p) => p.clave === 'C/3b-capitulo-04')).toBe(true);
    const pasos = new Set(tablas.consumo_ia.map((f) => f.paso));
    expect(pasos).toEqual(new Set(['escritor-historia-A', 'escritor-historia-C']));
    expect(tablas.consumo_ia.every((f) => f.servicio === 'fabrica' && f.narrador_id === ID)).toBe(true);
    // La vuelta siguiente no hace nada: el libro ya está entregado.
    const antes = modelo.llamadas.length;
    await vuelta(db, motor);
    expect(modelo.llamadas).toHaveLength(antes);
  });

  it('una entrevista sin terminar no arranca nada', async () => {
    const { db, archivos } = baseFalsa(tablasDeRuben({ pedido: true, aprobado: true, estado: 'activo' }));
    const { motor, modelo } = motorFalso(db);
    await vuelta(db, motor);
    expect(modelo.llamadas).toHaveLength(0);
    expect(archivos.size).toBe(0);
  });
});

describe('el candado de historia', () => {
  it('lee los narradores de historias; sin la tabla, ninguno; con otro error, tira', async () => {
    expect(await narradoresConHistoria(baseFalsa(tablasDeRuben()).db)).toEqual(new Set([ID]));
    expect(await narradoresConHistoria(baseFalsa({}).db)).toEqual(new Set());
    const roto = { from: () => ({ select: async () => ({ data: null, error: { code: '500', message: 'se cayó' } }) }) };
    await expect(narradoresConHistoria(roto as never)).rejects.toThrow('No pude leer historias: se cayó');
  });
});
