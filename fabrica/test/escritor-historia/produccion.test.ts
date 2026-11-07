// Task 5.3 del plan de «Vitácora de una historia»: el libro de historia enchufado al worker
// (src/escritor-historia/produccion/libro-historia.ts), con el modelo falso, la historia inventada de Rubén y una base
// falsa en memoria. Cero gasto: nunca se llama a un modelo de verdad. El PDF no se arma (Playwright): es de mentira.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/libro/pdf.js', () => ({ htmlAPdf: vi.fn(async () => Buffer.from('%PDF-1.4 de mentira')) }));
vi.mock('../../src/libro/publicar-frases.js', () => ({ publicarFrases: vi.fn(async () => undefined) }));
// Los textos de tapa todavía no están aprobados: el test pone unos de prueba (salvo `sinTextos`).
const t = vi.hoisted(() => ({ sinTextos: false }));
vi.mock('../../src/escritor-historia/produccion/textos-tapa.js', async () => {
  const real = await vi.importActual<typeof import('../../src/escritor-historia/produccion/textos-tapa.js')>('../../src/escritor-historia/produccion/textos-tapa.js');
  const prueba = { eyebrow: 'TAPA DE PRUEBA', cubierta: { etiqueta: 'Etiqueta de prueba', contra: (n: string) => `Contra de ${n}`, lema: 'Lema de prueba' } };
  return { ...real, textosTapaHistoria: () => (t.sinTextos ? null : prueba) };
});
vi.mock('../../src/config.js', () => ({
  cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com', anthropicApiKey: 'x', supabaseServiceRoleKey: 'secreto-de-prueba' }),
}));

import { anotarUsoEscritorHistoria } from '../../src/costos.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { carpetaDeHistoria } from '../../src/escritor-historia/material/carpeta.js';
import { alEntregarHistoria, colaHistoria, escribirLibroHistoria, escritorHistoriaPrendido, revisarLibrosHistoria, SinMaterialHistoria, topeHistoria, type MotorHistoria } from '../../src/escritor-historia/produccion/libro-historia.js';
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

/** Las salidas sin dudas de datos: el libro sigue de largo (la espera por dudas tiene sus tests propios). */
function sinDudas(): Record<string, string> {
  const reg = JSON.parse(salidasRuben()['1-registro']);
  reg.dudas = [];
  return { ...salidasRuben(), '1-registro': JSON.stringify(reg) };
}

function motorFalso(db: unknown, salidas: Record<string, string> = salidasRuben()) {
  const modelo = new ModeloFalso(salidas, DEFECTOS_RUBEN);
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
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => { mails.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }); }));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  await colaHistoria.esperarTodo();
  alEntregarHistoria(null);
  t.sinTextos = false;
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
    expect(mails.find((m) => m.subject.includes('Dudas de datos'))?.text).toContain(`/tablero/${ID}/dudas`);
    expect(archivos.has(prefijo('dudas-avisadas.txt'))).toBe(true);
    expect(modelo.llamadas).toHaveLength(3);
  });

  it('pedido pagado + libro cerrado → el libro entero: libro.md en su carpeta, PDF y HTML, pedido entregado, costos con su paso', async () => {
    const { db, archivos, tablas } = baseFalsa(tablasDeRuben({ pedido: true, aprobado: true }));
    const { motor, modelo } = motorFalso(db, sinDudas());
    const entregados: string[] = [];
    alEntregarHistoria(async (_db, id) => { entregados.push(id); });
    await vuelta(db, motor);
    expect(tablas.pedidos[0]).toMatchObject({ estado: 'entregado', libro_pdf_path: `${ID}/paquete/libro.pdf` });
    expect(String(archivos.get(prefijo('libro.md')))).toContain('# La valija verde');
    expect(archivos.has(`${ID}/paquete/libro.pdf`) && archivos.has(`${ID}/paquete/libro.html`)).toBe(true);
    expect(String(archivos.get(`${ID}/paquete/libro.html`))).toContain('La valija verde');
    expect(String(archivos.get(`${ID}/paquete/libro.html`))).toContain('TAPA DE PRUEBA');
    expect(String(archivos.get(`${ID}/paquete/libro.html`))).not.toContain('<div class="tapa-eyebrow">EL LIBRO DE SU VIDA');
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

  it('sin los textos de tapa aprobados: la Etapa A sí, el libro no (el pedido sigue pagado) y un aviso a los socios', async () => {
    t.sinTextos = true;
    const { db, tablas, archivos } = baseFalsa(tablasDeRuben({ pedido: true, aprobado: true }));
    const { motor, modelo } = motorFalso(db);
    await vuelta(db, motor);
    await vuelta(db, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(modelo.llamadas.some((p) => p.clave.startsWith('C/'))).toBe(false);
    expect(mails.filter((m) => m.subject.includes('espera los textos de tapa'))).toHaveLength(1);
    // La Etapa A sí corre mientras tanto.
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/2-plan', 'A/dudas']);
    expect(archivos.has(prefijo('carpeta-A.json'))).toBe(true);
  });

  it('si la imprenta falla después de entregar, el libro queda entregado y los socios reciben cómo rehacerla', async () => {
    const { db, tablas } = baseFalsa(tablasDeRuben({ pedido: true, aprobado: true }));
    const { motor } = motorFalso(db, sinDudas());
    alEntregarHistoria(async () => { throw new Error('Chromium se cayó'); });
    await vuelta(db, motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
    const aviso = mails.find((m) => m.subject.includes('La imprenta del libro de historia de Rubén'));
    expect(aviso?.text).toContain('Chromium se cayó');
    expect(aviso?.text).toContain(`npx tsx scripts/historia-imprenta.ts ${ID}`);
  });

  it('una entrevista sin terminar no arranca nada', async () => {
    const { db, archivos } = baseFalsa(tablasDeRuben({ pedido: true, aprobado: true, estado: 'activo' }));
    const { motor, modelo } = motorFalso(db);
    await vuelta(db, motor);
    expect(modelo.llamadas).toHaveLength(0);
    expect(archivos.size).toBe(0);
  });
});

describe('las dudas de la historia van a quien contó (Naza, 06/11)', () => {
  // Con la marca de la compra, sin que el narrador eligiera: privado.
  const rubenPrivado = (o: Parameters<typeof tablasDeRuben>[0] = {}) => {
    const t0 = tablasDeRuben(o);
    t0.narradores[0].contexto = { acceso: { elige: true } };
    return t0;
  };
  const HORA = 3_600_000;
  const hace = (horas: number): string => new Date(Date.now() - horas * HORA).toISOString();
  const generando = (tablas: Record<string, Fila[]>) => { tablas.pedidos[0].estado = 'generando'; };
  const libro = { id: 'p1', narrador_id: ID };
  const clavesA = ['A/1-registro', 'A/2-plan', 'A/dudas'];
  const conUltima = (tablas: Record<string, Fila[]>, ultima: string) => { tablas.narradores[0].ultima_respuesta_at = ultima; return tablas; };

  it('el tick no lanza la A antes de las 48 horas de quien contó', async () => {
    const { db, tablas } = baseFalsa(conUltima(rubenPrivado(), hace(47)));
    const { motor, modelo } = motorFalso(db);
    await vuelta(db, motor);
    expect(modelo.llamadas).toHaveLength(0);
    tablas.narradores[0].ultima_respuesta_at = hace(48);
    await vuelta(db, motor);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(clavesA);
  });

  it('«Para mí» no espera en el tick', async () => {
    const t0 = rubenPrivado();
    t0.narradores[0].contexto = { vinculoComprador: 'yo mismo' };
    const { db } = baseFalsa(conUltima(t0, hace(1)));
    const { motor, modelo } = motorFalso(db);
    await vuelta(db, motor);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(clavesA);
  });

  it('encargado antes: vuelve a pagado sin pagar nada; si quitó todo, tampoco queda fallido', async () => {
    const { db, tablas } = baseFalsa(conUltima(rubenPrivado({ pedido: true, aprobado: true }), hace(1)));
    const { motor, modelo } = motorFalso(db);
    const sinNada: MotorHistoria = { ...motor, material: async () => { throw new SinMaterialHistoria(ID); } };
    generando(tablas);
    await escribirLibroHistoria(db, libro, sinNada);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(modelo.llamadas).toHaveLength(0);
  });

  it('72 horas: desde el mail a los socios si nunca salió el WhatsApp, y desde el WhatsApp si salió', async () => {
    vi.stubEnv('MAIL_SOCIOS', '');
    const { db, archivos, tablas } = baseFalsa(rubenPrivado({ pedido: true, aprobado: true }));
    const { motor } = motorFalso(db);
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(Number.isFinite(Date.parse(String(archivos.get(prefijo('dudas-avisadas.txt')))))).toBe(true);
    archivos.set(prefijo('dudas-avisadas.txt'), hace(100));
    archivos.set(prefijo('dudas-narrador-avisadas.txt'), hace(2));
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    archivos.set(prefijo('dudas-narrador-avisadas.txt'), hace(72));
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  }, 30_000);

  it('ESCRITOR_ESPERA_DUDAS_HORAS=0 no saltea el plazo, y un mail que no sale no lo traba', async () => {
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '0');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('caído', { status: 500 })));
    const { db, archivos, tablas } = baseFalsa(rubenPrivado({ pedido: true, aprobado: true }));
    const { motor } = motorFalso(db);
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(Number.isFinite(Date.parse(String(archivos.get(prefijo('dudas-avisadas.txt')))))).toBe(true);
  });

  it('con todas contestadas no espera', async () => {
    const { db, archivos, tablas } = baseFalsa(rubenPrivado({ pedido: true, aprobado: true }));
    const { motor, modelo } = motorFalso(db);
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    archivos.set(prefijo('correcciones.json'), JSON.stringify({ correcciones: [{ dudaId: 'D01', texto: 'Salva' }] }));
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(modelo.llamadas.some((p) => p.clave.startsWith('B/'))).toBe(true);
  }, 30_000);

  it('alternar vueltas de espera y errores pasajeros nunca da fallido', async () => {
    const { db, tablas } = baseFalsa(rubenPrivado({ pedido: true, aprobado: true }));
    const { motor } = motorFalso(db);
    let caido = false;
    const conCortes: MotorHistoria = { ...motor, material: async (d, n) => { if (caido) throw new Error('fetch failed'); return motor.material!(d, n); } };
    for (let i = 0; i < 6; i++) {
      for (const c of [false, true]) {
        caido = c;
        generando(tablas);
        await escribirLibroHistoria(db, libro, conCortes);
        expect(tablas.pedidos[0].estado).toBe('pagado');
      }
    }
  });

  it('una vuelta de espera vuelve a mirar a los 15 minutos, no al vencer el plazo', async () => {
    const { db, archivos, tablas } = baseFalsa(rubenPrivado({ pedido: true, aprobado: true }));
    const { motor } = motorFalso(db);
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    await revisarLibrosHistoria(db as never, { motor, ahora: Date.now() + 5 * 60_000 });
    await colaHistoria.esperarTodo();
    expect(archivos.has(prefijo('trabajando.json'))).toBe(false); // todavía no lo reclamó
    await revisarLibrosHistoria(db as never, { motor, ahora: Date.now() + 16 * 60_000 });
    await colaHistoria.esperarTodo();
    expect(archivos.has(prefijo('trabajando.json'))).toBe(true);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(mails.filter((m) => m.subject.includes('Dudas de datos'))).toHaveLength(1);
  });

  it('una A rehecha deja vacías las dos marcas y el plazo arranca de cero', async () => {
    const { db, archivos, tablas } = baseFalsa(rubenPrivado({ pedido: true, aprobado: true }));
    const { motor, modelo } = motorFalso(db);
    archivos.set(prefijo('carpeta-A.json'), JSON.stringify({ 'entradas/respuestas.xml': 'lo de antes' }));
    archivos.set(prefijo('dudas-avisadas.txt'), hace(100));
    archivos.set(prefijo('dudas-narrador-avisadas.txt'), hace(100));
    archivos.set(prefijo('correcciones.json'), JSON.stringify({ correcciones: [{ dudaId: 'D01', texto: 'Vieja' }, { texto: 'Del socio' }] }));
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(clavesA);
    expect(JSON.parse(String(archivos.get(prefijo('correcciones.json')))).correcciones).toEqual([{ texto: 'Del socio' }]);
    expect(String(archivos.get(prefijo('dudas-narrador-avisadas.txt')))).toBe('');
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(Date.now() - Date.parse(String(archivos.get(prefijo('dudas-avisadas.txt'))))).toBeLessThan(HORA);
  });

  it('marcas con fecha del futuro: el libro no se traba, dos vueltas seguidas', async () => {
    const futuro = new Date(Date.now() + 500 * HORA).toISOString();
    const { db, archivos, tablas } = baseFalsa(rubenPrivado({ pedido: true, aprobado: true }));
    const { motor } = motorFalso(db);
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    archivos.set(prefijo('dudas-narrador-avisadas.txt'), futuro);
    archivos.set(prefijo('dudas-avisadas.txt'), futuro);
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(Date.parse(String(archivos.get(prefijo('dudas-avisadas.txt'))))).toBeLessThanOrEqual(Date.now());
    archivos.set(prefijo('dudas-avisadas.txt'), hace(72));
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  }, 30_000);

  it.each(['viaje', 'kids'])('un modo %s queda como antes: 24 horas del mail, con su texto', async (modo) => {
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
    const t0 = rubenPrivado({ pedido: true, aprobado: true });
    t0.narradores[0].contexto = { modo, vinculoComprador: 'hija' };
    const { db, archivos, tablas } = baseFalsa(t0);
    const { motor } = motorFalso(db);
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    const text = mails.find((m) => m.subject.includes('Dudas de datos'))?.text;
    expect(text).toContain('La familia las contesta en este link');
    expect(text).not.toContain('WhatsApp');
    archivos.set(prefijo('dudas-avisadas.txt'), hace(24));
    generando(tablas);
    await escribirLibroHistoria(db, libro, motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  }, 30_000);

  describe('un regalo que no es privado sigue como hoy (sin la marca)', () => {
    const conRegalo = (o: { pedido?: boolean; aprobado?: boolean } = { pedido: true, aprobado: true }) => {
      const t0 = rubenPrivado(o);
      t0.narradores[0].contexto = { vinculoComprador: 'hija' };
      return t0;
    };
    beforeEach(() => {
      vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
    });

    it('24 horas desde el mail, con su texto, y sin aviso de dudas sin contestar al vencer', async () => {
      const { db, archivos, tablas } = baseFalsa(conRegalo());
      const { motor } = motorFalso(db);
      generando(tablas);
      await escribirLibroHistoria(db, libro, motor);
      expect(tablas.pedidos[0].estado).toBe('pagado');
      const text = mails.find((m) => m.subject.includes('Dudas de datos'))?.text;
      expect(text).toContain('La familia las contesta en este link');
      expect(text).not.toContain('WhatsApp');
      archivos.set(prefijo('dudas-narrador-avisadas.txt'), hace(1));
      archivos.set(prefijo('dudas-avisadas.txt'), hace(24));
      generando(tablas);
      await escribirLibroHistoria(db, libro, motor);
      expect(tablas.pedidos[0].estado).toBe('entregado');
      expect(mails.filter((m) => m.text?.includes('Se empieza a escribir'))).toEqual([]);
      expect(archivos.has(prefijo('dudas-sin-contestar-avisadas.txt'))).toBe(false);
    }, 30_000);

    it('con ESCRITOR_ESPERA_DUDAS_HORAS=0 no espera', async () => {
      vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '0');
      const { db, tablas } = baseFalsa(conRegalo());
      generando(tablas);
      await escribirLibroHistoria(db, libro, motorFalso(db).motor);
      expect(tablas.pedidos[0].estado).toBe('entregado');
    }, 30_000);

    it('el tick no espera 48 horas para la lectura', async () => {
      const { db } = baseFalsa(conUltima(conRegalo({}), hace(1)));
      const { motor, modelo } = motorFalso(db);
      await vuelta(db, motor);
      expect(modelo.llamadas.map((p) => p.clave)).toEqual(clavesA);
    });
  });

  describe('si quien contó no contesta, los socios se enteran', () => {
    it.each([['un privado', { vinculoComprador: 'hija', acceso: { elige: true } }], ['«Para mí»', { vinculoComprador: 'yo mismo' }]])('%s: venció el plazo, un mail con cuántas y su marca', async (_caso, contexto) => {
      const t0 = rubenPrivado({ pedido: true, aprobado: true });
      t0.narradores[0].contexto = contexto;
      const { db, archivos, tablas } = baseFalsa(t0);
      const { motor } = motorFalso(db);
      generando(tablas);
      await escribirLibroHistoria(db, libro, motor);
      expect(mails.filter((m) => m.text?.includes('Se empieza a escribir'))).toEqual([]);
      archivos.set(prefijo('dudas-avisadas.txt'), hace(72));
      generando(tablas);
      await escribirLibroHistoria(db, libro, motor);
      expect(tablas.pedidos[0].estado).toBe('entregado');
      const avisos = mails.filter((m) => m.text?.includes('Se empieza a escribir'));
      expect(avisos).toHaveLength(1);
      expect(avisos[0].text).toMatch(/^Se empieza a escribir el libro de Rubén .*con \d+ dudas? sin contestar\. Quien contó no las respondió en el plazo\./);
      expect(archivos.has(prefijo('dudas-sin-contestar-avisadas.txt'))).toBe(true);
    }, 30_000);

    it('si el mail falla, el libro sale igual y no queda la marca', async () => {
      const { db, archivos, tablas } = baseFalsa(rubenPrivado({ pedido: true, aprobado: true }));
      const { motor } = motorFalso(db);
      generando(tablas);
      await escribirLibroHistoria(db, libro, motor);
      archivos.set(prefijo('dudas-avisadas.txt'), hace(72));
      vi.stubGlobal('fetch', vi.fn(async () => new Response('caído', { status: 500 })));
      generando(tablas);
      await escribirLibroHistoria(db, libro, motor);
      expect(tablas.pedidos[0].estado).toBe('entregado');
      expect(archivos.has(prefijo('dudas-sin-contestar-avisadas.txt'))).toBe(false);
    }, 30_000);
  });

  it('un modo viaje con ESCRITOR_ESPERA_DUDAS_HORAS=0 no espera', async () => {
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '0');
    const t0 = rubenPrivado({ pedido: true, aprobado: true });
    t0.narradores[0].contexto = { modo: 'viaje', vinculoComprador: 'hija' };
    const { db, tablas } = baseFalsa(t0);
    generando(tablas);
    await escribirLibroHistoria(db, libro, motorFalso(db).motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  }, 30_000);

  it('el mail a los socios dice que van por WhatsApp a quien contó', async () => {
    const { db } = baseFalsa(rubenPrivado());
    const { motor } = motorFalso(db);
    await vuelta(db, motor);
    await vuelta(db, motor);
    const text = mails.find((m) => m.subject.includes('Dudas de datos'))?.text;
    expect(text).toContain('Se las mandamos por WhatsApp a quien contó. Espera hasta 3 días o hasta que estén todas contestadas.');
    expect(text).not.toContain(`/tablero/${ID}/dudas`);
    expect(text).not.toContain('La familia las contesta');
    expect(text).not.toContain('horas después de este mail');
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
