// El escritor nuevo enchufado al worker (src/escritor/produccion): la cola, la ficha de producción, las
// correcciones, «Su voz», la Etapa A al terminar la entrevista y el libro entero de un pedido, con el modelo
// falso (respuestas de Nélida) y una base falsa en memoria. El PDF no se arma (Playwright): se simula.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/libro/pdf.js', () => ({ htmlAPdf: vi.fn(async (html: string) => Buffer.from(`PDF:${html.length}`)) }));
vi.mock('../../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com', anthropicApiKey: 'x' }) }));

import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import type { Almacen } from '../../src/escritor/almacen/tipos.js';
import { Carpeta } from '../../src/escritor/carpeta.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { fichaXml } from '../../src/escritor/material/ficha-xml.js';
import type { AudioV3 } from '../../src/escritor/material/de-base.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { Cola } from '../../src/escritor/produccion/cola.js';
import {
  colaDelEscritor, escribirLibroV3, fichaParaLibro, fuentesDeFrases, hayLugarParaLibroV3, lanzarLibroV3, leerCorrecciones, revisarEtapaAV3, soloConAudio, type Motor,
} from '../../src/escritor/produccion/libro-v3.js';
import { carpetaNelida, DEFECTOS_NELIDA, salidasModeloNelida } from './ayuda.js';

// ---------------------------------------------------------------- base falsa

type Fila = Record<string, unknown>;
function baseFalsa(o: { tablas?: Record<string, Fila[]>; archivos?: Record<string, string> } = {}) {
  const archivos = new Map<string, string | Buffer>(Object.entries(o.archivos ?? {}));
  const tablas: Record<string, Fila[]> = { narradores: [], pedidos: [], consumo_ia: [], entrevistas_v3: [], ...(o.tablas ?? {}) };
  const updates: { tabla: string; cambios: Fila }[] = [];
  const db = {
    from(tabla: string) {
      const filtros: ((f: Fila) => boolean)[] = [];
      let cambios: Fila | null = null;
      const filas = () => (tablas[tabla] ?? []).filter((f) => filtros.every((x) => x(f)));
      const q: any = {
        select: () => q,
        eq: (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return q; },
        in: (c: string, vs: unknown[]) => { filtros.push((f) => vs.includes(f[c])); return q; },
        insert: async (fila: Fila) => { (tablas[tabla] ??= []).push(fila); return { error: null }; },
        update: (c: Fila) => { cambios = c; return q; },
        maybeSingle: async () => ({ data: filas()[0] ?? null, error: null }),
        then: (ok: any, ko: any) => {
          if (cambios) {
            updates.push({ tabla, cambios });
            for (const f of filas()) Object.assign(f, cambios);
            return Promise.resolve({ data: filas(), error: null }).then(ok, ko);
          }
          return Promise.resolve({ data: filas(), error: null }).then(ok, ko);
        },
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
        list: async (pre: string) => {
          const nombres = new Set<string>();
          for (const k of archivos.keys()) if (k.startsWith(`${pre}/`)) nombres.add(k.slice(pre.length + 1).split('/')[0]);
          return { data: [...nombres].map((name) => ({ name })), error: null };
        },
      }),
    },
  };
  return { db: db as any, archivos, tablas, updates };
}

// ---------------------------------------------------------------- material y motor falsos

/** Las entradas de Nélida, con las etiquetas que deja materialACarpeta (R07 = HO2, R08 = LE1). */
function materialNelida(): Carpeta {
  const c = carpetaNelida(['entradas']);
  c.escribir('entradas/etiquetas.json', JSON.stringify([{ id: 'R07', preguntaId: 'HO2' }, { id: 'R08', preguntaId: 'LE1' }]));
  return c;
}
const AUDIOS: AudioV3[] = [
  { respuestaId: 'resp-ho2', clave: 'HO2', audioPath: 'n1/a.ogg', transcripcion: 'Me gusta el mate amargo, bien caliente, a cualquier hora.', recibidoAt: '2026-10-08T10:00:00Z' },
  { respuestaId: 'resp-le1', clave: 'LE1', audioPath: 'n1/b.ogg', transcripcion: 'Otra cosa que no es la frase.', recibidoAt: '2026-10-08T11:00:00Z' },
];

function motorFalso(salidas: Record<string, string> = salidasModeloNelida()) {
  const modelo = new ModeloFalso(salidas, DEFECTOS_NELIDA);
  const motor: Motor = {
    ejecutor: ({ almacen, log }) => ({ ej: new Ejecutor({ modelo, almacen, log }), usarLote: false }),
    material: async () => ({ c: materialNelida(), audios: AUDIOS }),
  };
  return { motor, modelo };
}

beforeEach(() => {
  // La espera por dudas (24 horas) tiene su test propio: en los demás, el libro sigue de largo.
  vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '0');
  vi.stubEnv('MAIL_SOCIOS', '');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  await colaDelEscritor.esperarTodo();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------- la cola

describe('la cola del escritor', () => {
  it('un trabajo por clave, con un máximo; al terminar libera el lugar', async () => {
    const cola = new Cola(() => 2);
    let soltar!: () => void;
    const espera = new Promise<void>((r) => { soltar = r; });
    expect(cola.lanzar('a', () => espera)).toBe(true);
    expect(cola.lanzar('a', async () => {})).toBe(false);
    expect(cola.lanzar('b', () => espera)).toBe(true);
    expect(cola.hayLugar('c')).toBe(false);
    expect(cola.lanzar('c', async () => {})).toBe(false);
    soltar();
    await cola.esperarTodo();
    expect(cola.cuantos).toBe(0);
    expect(cola.hayLugar('a')).toBe(true);
  });

  it('un trabajo que tira se loguea y no tumba nada', async () => {
    const lineas: string[] = [];
    const cola = new Cola(() => 1, (s) => lineas.push(s));
    cola.lanzar('a', async () => { throw new Error('se cayó la API'); });
    await cola.esperarTodo();
    expect(lineas.join('\n')).toContain('se cayó la API');
    expect(cola.ocupada('a')).toBe(false);
  });
});

// ---------------------------------------------------------------- ficha y correcciones

describe('la ficha de producción', () => {
  const deEntrevista = { nombre: 'Dora', genero: 'mujer' as const };

  it('suma año, lugar y árbol de lo que cargó la familia; datosExtra no va', () => {
    const f = fichaParaLibro(deEntrevista, { anioNacimiento: 1939, lugarNacimiento: 'Cataluña', arbol: { hijos: 'mariano y rodrigo', conyuge: 'no tuvo' }, datosExtra: 'con la madre más o menos' });
    const xml = fichaXml(f);
    expect(xml).toContain('Año de nacimiento: 1939');
    expect(xml).toContain('Lugar donde nació (lo cargó la familia): Cataluña');
    expect(xml).toContain('Hijos (lo cargó la familia): mariano y rodrigo');
    expect(xml).toContain('Parejas (lo cargó la familia): no tuvo');
    expect(xml).toContain('Hermanos: (no se cargó)');
    expect(xml).not.toContain('madre');
  });

  it('sin datos, dice que no se cargaron (nunca "undefined")', () => {
    const xml = fichaXml(fichaParaLibro(deEntrevista, null));
    expect(xml).toContain('Año de nacimiento: (no se cargó)');
    expect(xml).toContain('País donde nació: (no se cargó)');
    expect(xml).not.toContain('undefined');
  });
});

describe('las correcciones (escritor/correcciones.json)', () => {
  const con = async (t: string | null): Promise<Almacen> => { const a = new AlmacenMemoria(); if (t !== null) await a.escribir('correcciones.json', t); return a; };
  it('sin archivo, ninguna; con objeto o lista, las lee; rota, tira', async () => {
    expect(await leerCorrecciones(await con(null))).toEqual([]);
    expect(await leerCorrecciones(await con('{"correcciones": [{"dudaId": "D01", "texto": "Se llamaba Ofelia."}]}'))).toEqual([{ dudaId: 'D01', texto: 'Se llamaba Ofelia.' }]);
    expect(await leerCorrecciones(await con('[{"texto": "Raúl era de Rosario."}]'))).toEqual([{ texto: 'Raúl era de Rosario.' }]);
    await expect(leerCorrecciones(await con('{"correcciones": [{"dudaId": "D01"}]}'))).rejects.toThrow(/texto/);
    await expect(leerCorrecciones(await con('no es json'))).rejects.toThrow();
  });
});

describe('«Su voz»: de qué respuesta se corta cada frase', () => {
  it('la que la dice tal cual (también RP~X y X~2); si ninguna la dice, sin audio', () => {
    const c = materialNelida();
    c.escribir('salidas/sus_frases.json', '{"frases": [{"id": "R07", "texto": "Me gusta el mate amargo, bien caliente"}, {"id": "R08", "texto": "La casa es de todos"}]}');
    expect(fuentesDeFrases(c, AUDIOS)).toEqual({ R07: { respuestaId: 'resp-ho2', preguntaOrden: 0 }, R08: { respuestaId: null, preguntaOrden: 0 } });
    const deRepregunta = [{ ...AUDIOS[0], respuestaId: 'resp-rp', clave: 'RP~HO2' }];
    expect(fuentesDeFrases(c, deRepregunta).R07.respuestaId).toBe('resp-rp');
    const reservado = [{ ...AUDIOS[0], audioPath: null }];
    expect(fuentesDeFrases(c, reservado).R07.respuestaId).toBeNull();
  });
});

// ---------------------------------------------------------------- Etapa A desde el tick

describe('Etapa A al terminar la entrevista (revisarEtapaAV3)', () => {
  it('la lanza una vez, deja carpeta-A y, en el tick siguiente, avisa las dudas a los socios una sola vez', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const { db, archivos } = baseFalsa();
    const { motor, modelo } = motorFalso();
    await revisarEtapaAV3(db, 'n1', { motor });
    await revisarEtapaAV3(db, 'n1', { motor }); // corriendo: no se lanza otra
    await colaDelEscritor.esperarTodo();
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/2-plan', 'A/dudas']);
    expect(archivos.has('n1/escritor/carpeta-A.json')).toBe(true);
    expect(JSON.parse(String(archivos.get('n1/escritor/dudas-familia.json'))).dudas[0].id).toBe('D01');

    await revisarEtapaAV3(db, 'n1', { motor });
    await revisarEtapaAV3(db, 'n1', { motor });
    expect(fetch).toHaveBeenCalledTimes(1);
    const cuerpo = JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(cuerpo.subject).toContain('Dudas de datos');
    expect(cuerpo.text).toContain('¿Cómo se llamaba la Negra');
    expect(cuerpo.text).toContain('n1/escritor/correcciones.json');
    expect(archivos.has('n1/escritor/dudas-avisadas.txt')).toBe(true);
    expect(modelo.llamadas).toHaveLength(3); // ya hecha: no se repite
    vi.unstubAllGlobals();
  });

  it('si no pasa sus controles, deja fallo-A.json, avisa y no se reintenta sola', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    const { db, archivos } = baseFalsa();
    const roto = JSON.parse(salidasModeloNelida()['1-registro']);
    roto.voz.frases = roto.voz.frases.slice(0, 5);
    const { motor, modelo } = motorFalso({ ...salidasModeloNelida(), '1-registro': JSON.stringify(roto) });
    await revisarEtapaAV3(db, 'n1', { motor });
    await colaDelEscritor.esperarTodo();
    expect(JSON.parse(String(archivos.get('n1/escritor/fallo-A.json'))).motivo).toMatch(/C14/);
    const llamadas = modelo.llamadas.length;
    await revisarEtapaAV3(db, 'n1', { motor });
    await colaDelEscritor.esperarTodo();
    expect(modelo.llamadas).toHaveLength(llamadas);
    vi.unstubAllGlobals();
  });

  it('tras un error de la API espera media hora antes de reintentar', async () => {
    const { db } = baseFalsa();
    const { motor, modelo } = motorFalso({});
    await revisarEtapaAV3(db, 'n2', { motor });
    await colaDelEscritor.esperarTodo();
    const n = modelo.llamadas.length;
    await revisarEtapaAV3(db, 'n2', { motor, ahora: Date.now() + 60_000 });
    await colaDelEscritor.esperarTodo();
    expect(modelo.llamadas).toHaveLength(n);
    await revisarEtapaAV3(db, 'n2', { motor, ahora: Date.now() + 31 * 60_000 });
    await colaDelEscritor.esperarTodo();
    expect(modelo.llamadas.length).toBeGreaterThan(n);
  });
});

// ---------------------------------------------------------------- el libro de un pedido

const NARRADOR = { id: 'n1', nombre: 'Nélida Ferraro', contexto: { anioNacimiento: 1941 }, foto_url: null, edicion: { titulo: 'La casa es de todos', subtitulo: 'La vida de Nélida' } };

describe('el libro de un pedido (escribirLibroV3)', () => {
  it('A, B y C, plantilla, PDF, «Su voz» y el pedido entregado; cada llamada va a consumo_ia', async () => {
    const { db, archivos, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p1', narrador_id: 'n1', estado: 'generando' }] } });
    const modelo = new ModeloFalso(salidasModeloNelida(), DEFECTOS_NELIDA);
    const { anotarUsoEscritor } = await import('../../src/costos.js');
    const motor: Motor = {
      ejecutor: ({ almacen, log, narradorId }) => ({ ej: new Ejecutor({ modelo, almacen, log, alAnotar: (f) => anotarUsoEscritor(db, narradorId, f) }), usarLote: false }),
      material: async () => ({ c: materialNelida(), audios: AUDIOS }),
    };
    await escribirLibroV3(db, { id: 'p1', narrador_id: 'n1' }, motor);

    expect(tablas.pedidos[0]).toMatchObject({ estado: 'entregado', libro_pdf_path: 'n1/paquete/libro.pdf', audiolibro_paths: null });
    const html = String(archivos.get('n1/paquete/libro.html'));
    expect(html).toContain('El bastidor en la falda');
    expect(html).toContain('La casa es de todos'); // el título de tapa de la dueña
    expect(String(archivos.get('n1/paquete/libro.pdf'))).toMatch(/^PDF:/);
    expect(String(archivos.get('n1/escritor/libro.md'))).toContain('# I · La persiana de madera');
    const frases = JSON.parse(String(archivos.get('n1/paquete/frases.json')));
    expect(frases).toMatchObject({ narrador_id: 'n1', pedido_id: 'p1', confirmado_at: null });
    expect(frases.capitulos[0].candidatas[0]).toMatchObject({ id: 'R07', respuesta_id: 'resp-ho2' });
    expect(archivos.has('n1/paquete/frases_pedido.txt')).toBe(true);
    // Una fila de consumo por llamada, con el paso de su etapa y el servicio de la fábrica.
    expect(tablas.consumo_ia).toHaveLength(modelo.llamadas.length);
    expect(new Set(tablas.consumo_ia.map((f) => f.paso))).toEqual(new Set(['escritor-A', 'escritor-C']));
    expect(tablas.consumo_ia.every((f) => f.servicio === 'fabrica' && f.narrador_id === 'n1' && (f.usd as number) > 0)).toBe(true);
  });

  it('con la Etapa A ya hecha y correcciones, no la repite y corrige en B', async () => {
    const { db, archivos, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p1', narrador_id: 'n1', estado: 'generando' }] } });
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    const negra = { ...reg.personas[3], nombre: 'Ofelia', apodos: ['la Negra'] };
    const { motor, modelo } = motorFalso({
      ...salidasModeloNelida(),
      'correccion-registro': JSON.stringify({ personas: [negra], confirmados: [{ texto: 'La Negra se llamaba Ofelia.', usado_en: ['P04'] }] }),
      'correccion-plan': salidasModeloNelida()['2-plan'],
    });
    await revisarEtapaAV3(db, 'n1', { motor });
    await colaDelEscritor.esperarTodo();
    archivos.set('n1/escritor/correcciones.json', '{"correcciones": [{"dudaId": "D01", "texto": "La Negra se llamaba Ofelia."}]}');
    const antes = modelo.llamadas.length;
    await escribirLibroV3(db, { id: 'p1', narrador_id: 'n1' }, motor);
    const nuevas = modelo.llamadas.slice(antes).map((p) => p.clave);
    expect(nuevas.some((k) => k.startsWith('A/'))).toBe(false);
    expect(nuevas[0]).toBe('B/correccion-registro');
    expect(JSON.parse(String(archivos.get('n1/escritor/carpeta-B.json')))['entradas/confirmado.xml']).toContain('La Negra se llamaba Ofelia.');
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('las correcciones que escribió la familia al cerrar (edicion.correcciones) también van a B (Naza 10/10)', async () => {
    const { db, archivos, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p1', narrador_id: 'n1', estado: 'generando' }] } });
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    const negra = { ...reg.personas[3], nombre: 'Ofelia', apodos: ['la Negra'] };
    const { motor, modelo } = motorFalso({
      ...salidasModeloNelida(),
      'correccion-registro': JSON.stringify({ personas: [negra], confirmados: [{ texto: 'La Negra se llamaba Ofelia.', usado_en: ['P04'] }] }),
      'correccion-plan': salidasModeloNelida()['2-plan'],
    });
    await revisarEtapaAV3(db, 'n1', { motor });
    await colaDelEscritor.esperarTodo();
    tablas.narradores[0].edicion = { titulo: 'Su vida', correcciones: '  La Negra se llamaba Ofelia.  ' };
    const antes = modelo.llamadas.length;
    await escribirLibroV3(db, { id: 'p1', narrador_id: 'n1' }, motor);
    expect(modelo.llamadas.slice(antes)[0].clave).toBe('B/correccion-registro');
    expect(JSON.parse(String(archivos.get('n1/escritor/carpeta-B.json')))['entradas/confirmado.xml']).toContain('La Negra se llamaba Ofelia.');
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('retomar después de un corte no le vuelve a pagar al modelo', async () => {
    const { db, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p1', narrador_id: 'n1', estado: 'generando' }] } });
    const { motor, modelo } = motorFalso();
    await escribirLibroV3(db, { id: 'p1', narrador_id: 'n1' }, motor);
    const pagadas = modelo.llamadas.length;
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, { id: 'p1', narrador_id: 'n1' }, motor);
    expect(modelo.llamadas).toHaveLength(pagadas);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('si algo falla: pedido fallido y aviso a los socios', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const { db, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p1', narrador_id: 'n1', estado: 'generando' }] } });
    const salidas = salidasModeloNelida();
    delete (salidas as Record<string, string>)['3a-primera'];
    const { motor } = motorFalso(salidas);
    await escribirLibroV3(db, { id: 'p1', narrador_id: 'n1' }, motor);
    expect(tablas.pedidos[0].estado).toBe('fallido');
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body).subject).toContain('no salió');
    vi.unstubAllGlobals();
  });

  it('lanzarLibroV3 corre en segundo plano y avisa al terminar', async () => {
    const { db, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p1', narrador_id: 'n1', estado: 'generando' }] } });
    const { motor } = motorFalso();
    const alTerminar = vi.fn();
    expect(lanzarLibroV3(db, { id: 'p1', narrador_id: 'n1' }, alTerminar, motor)).toBe(true);
    expect(lanzarLibroV3(db, { id: 'p2', narrador_id: 'n1' }, alTerminar, motor)).toBe(false); // uno por narrador
    expect(alTerminar).not.toHaveBeenCalled();
    await colaDelEscritor.esperarTodo();
    expect(alTerminar).toHaveBeenCalledTimes(1);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });
});

// ---------------------------------------------------------------- costos

describe('cada llamada del escritor, afuera en el momento (alAnotar → consumo_ia)', () => {
  it('el ejecutor avisa cada llamada pagada (no las que salen de la memoria) y un fallo al anotar no corta nada', async () => {
    const filas: string[] = [];
    const almacen = new AlmacenMemoria();
    const modelo = new ModeloFalso(salidasModeloNelida());
    const { llamadaRegistro } = await import('../../src/escritor/llamadas/armar.js');
    const encargo = { clave: 'A/1-registro', llamada: llamadaRegistro(materialNelida()), json: true };
    await new Ejecutor({ modelo, almacen, alAnotar: (f) => { filas.push(f.clave); } }).uno(encargo);
    await new Ejecutor({ modelo, almacen, alAnotar: (f) => { filas.push(f.clave); } }).uno(encargo); // de la memoria
    expect(filas).toEqual(['A/1-registro']);
    const log: string[] = [];
    await new Ejecutor({ modelo, almacen: new AlmacenMemoria(), log: (s) => log.push(s), alAnotar: () => { throw new Error('sin base'); } }).uno(encargo);
    expect(log.join(' | ')).toContain('no se pudo anotar el uso afuera (sin base)');
  });

  it('anotarUsoEscritor: paso por etapa y el precio del escritor (Batch a mitad), no el de la tabla vieja', async () => {
    const { anotarUsoEscritor } = await import('../../src/costos.js');
    const { db, tablas } = baseFalsa();
    await anotarUsoEscritor(db, 'n1', { clave: 'C/3b-capitulo-02#2', modelo: 'claude-opus-5-5', input: 1000, output: 200, cache_write: 0, cache_read: 50, usd: 0.0042 });
    expect(tablas.consumo_ia).toEqual([expect.objectContaining({ servicio: 'fabrica', paso: 'escritor-C', modelo: 'claude-opus-5-5', proveedor: 'anthropic', narrador_id: 'n1', input_tokens: 1000, output_tokens: 200, cache_read: 50, usd: 0.0042 })]);
  });
});

// ---------------------------------------------------------------- revisión del 08/10

describe('arreglos de la revisión', () => {
  it('si el material cambió desde la Etapa A (una reserva posterior), la A se rehace con el de hoy', async () => {
    const { db, archivos, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p1', narrador_id: 'n1', estado: 'generando' }] } });
    const { motor, modelo } = motorFalso();
    await revisarEtapaAV3(db, 'n1', { motor });
    await colaDelEscritor.esperarTodo();
    const sinReserva = materialNelida();
    sinReserva.escribir('entradas/respuestas.xml', sinReserva.leer('entradas/respuestas.xml').replace('a cualquier hora', ''));
    const antes = modelo.llamadas.length;
    await escribirLibroV3(db, { id: 'p1', narrador_id: 'n1' }, { ...motor, material: async () => ({ c: sinReserva.clonar(), audios: AUDIOS }) });
    expect(modelo.llamadas.slice(antes).map((p) => p.clave).slice(0, 2)).toEqual(['A/1-registro', 'A/2-plan']);
    expect(JSON.parse(String(archivos.get('n1/escritor/carpeta-A.json')))['entradas/respuestas.xml']).not.toContain('a cualquier hora');
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('un error pasajero devuelve el pedido a pagado y el libro espera 15 minutos; al cuarto, fallido', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    const { db, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p7', narrador_id: 'n7', estado: 'generando' }] } });
    const { motor } = motorFalso();
    const caido: Motor = { ...motor, material: async () => { throw new Error('fetch failed (Supabase)'); } };
    for (let i = 1; i <= 3; i++) {
      tablas.pedidos[0].estado = 'generando';
      await escribirLibroV3(db, { id: 'p7', narrador_id: 'n7' }, caido);
      expect(tablas.pedidos[0].estado).toBe('pagado');
    }
    expect(hayLugarParaLibroV3('n7')).toBe(false);
    expect(hayLugarParaLibroV3('n7', Date.now() + 16 * 60_000)).toBe(true);
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, { id: 'p7', narrador_id: 'n7' }, caido);
    expect(tablas.pedidos[0].estado).toBe('fallido');
    vi.unstubAllGlobals();
  });

  it('«Su voz» deja afuera las frases sin audio y elige entre las que suenan', () => {
    const k = (id: string, r: string | null) => ({ id, respuesta_id: r, elegida: true }) as never;
    const f = soloConAudio({ version: 1, narrador_id: 'n', pedido_id: 'p', confirmado_at: null, capitulos: [
      { numero: 1, capitulo: 'I', candidatas: [k('a', null), k('b', 'r1'), k('c', 'r2'), k('d', 'r3'), k('e', 'r4')] },
      { numero: 2, capitulo: 'II', candidatas: [k('f', null)] },
    ] });
    expect(f.capitulos.map((c) => c.candidatas.map((x) => [x.id, x.elegida]))).toEqual([[['b', true], ['c', true], ['d', true], ['e', false]]]);
  });
});

// ---------------------------------------------------------------- alerta de libro demorado

describe('alerta: un libro V3 que a las 48 horas del cierre no salió', () => {
  it('avisa una sola vez; no avisa antes de las 48 horas, ni con el libro entregado, ni a un narrador viejo', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const { alertarLibrosDemorados } = await import('../../src/escritor/produccion/libro-v3.js');
    const ahora = Date.parse('2026-10-10T12:00:00Z');
    const haceHoras = (h: number) => new Date(ahora - h * 3_600_000).toISOString();
    const { db, archivos } = baseFalsa({
      tablas: {
        narradores: [
          { id: 'trabado', libro_aprobado_at: haceHoras(50) },
          { id: 'reciente', libro_aprobado_at: haceHoras(30) },
          { id: 'listo', libro_aprobado_at: haceHoras(60) },
          { id: 'viejo', libro_aprobado_at: haceHoras(60) },
        ],
        pedidos: [
          { id: 'p1', narrador_id: 'trabado', estado: 'generando' },
          { id: 'p2', narrador_id: 'reciente', estado: 'generando' },
          { id: 'p3', narrador_id: 'listo', estado: 'entregado' },
          { id: 'p4', narrador_id: 'listo', estado: 'pagado' },
          { id: 'p5', narrador_id: 'viejo', estado: 'generando' },
        ],
      },
    });
    const v3 = new Set(['trabado', 'reciente', 'listo']);
    await alertarLibrosDemorados(db, v3, ahora);
    await alertarLibrosDemorados(db, v3, ahora);
    expect(fetch).toHaveBeenCalledTimes(1);
    const cuerpo = JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(cuerpo.subject).toContain('El libro de trabado lleva 50 horas sin salir');
    expect(cuerpo.text).toContain("Pedido p1, estado 'generando'");
    expect(archivos.has('trabado/escritor/alerta-libro-demorado.txt')).toBe(true);
    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------- espera por dudas y dos copias a la vez

describe('el libro espera 24 horas si la Etapa A encontró dudas (Naza, 09/10)', () => {
  it('avisa las dudas, devuelve el pedido a pagado y no escribe; pasada la espera, escribe con las correcciones', async () => {
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const { db, archivos, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR, id: 'n8' }], pedidos: [{ id: 'p8', narrador_id: 'n8', estado: 'generando' }] } });
    const { motor, modelo } = motorFalso();
    await escribirLibroV3(db, { id: 'p8', narrador_id: 'n8' }, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/2-plan', 'A/dudas']);
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body).subject).toContain('Dudas de datos');
    expect(hayLugarParaLibroV3('n8')).toBe(false);
    expect(hayLugarParaLibroV3('n8', Date.now() + 25 * 3_600_000)).toBe(true);
    // Pasaron las 24 horas (el aviso quedó con fecha vieja): ahora sí se escribe, sin repagar la A.
    archivos.set('n8/escritor/dudas-avisadas.txt', new Date(Date.now() - 25 * 3_600_000).toISOString());
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, { id: 'p8', narrador_id: 'n8' }, motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
    expect(modelo.llamadas.filter((p) => p.clave.startsWith('A/'))).toHaveLength(3);
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('sin dudas, no espera', async () => {
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
    const { db, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR, id: 'n9' }], pedidos: [{ id: 'p9', narrador_id: 'n9', estado: 'generando' }] } });
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    reg.dudas = [];
    const { motor } = motorFalso({ ...salidasModeloNelida(), '1-registro': JSON.stringify(reg) });
    await escribirLibroV3(db, { id: 'p9', narrador_id: 'n9' }, motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });
});

describe('dos copias de la fábrica a la vez (deploy)', () => {
  it('mientras una copia trabaja deja la marca; otra copia la respeta 10 minutos; al terminar la suelta', async () => {
    const { trabajaOtraCopia } = await import('../../src/escritor/produccion/libro-v3.js');
    const { db, archivos } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p1', narrador_id: 'n1', estado: 'generando' }] } });
    // Una marca fresca de OTRA copia: no se toca.
    archivos.set('n1/escritor/trabajando.json', JSON.stringify({ proceso: 'otra-copia', que: 'libro p1', latido: new Date().toISOString() }));
    expect(await trabajaOtraCopia(db, 'n1')).toBe(true);
    expect(await trabajaOtraCopia(db, 'n1', Date.now() + 11 * 60_000)).toBe(false); // vieja: esa copia murió
    // Una Etapa A no se lanza mientras la otra copia trabaja.
    const { motor, modelo } = motorFalso();
    await revisarEtapaAV3(db, 'n1', { motor });
    await colaDelEscritor.esperarTodo();
    expect(modelo.llamadas).toHaveLength(0);
    // Cuando trabaja ESTA copia, la marca es suya (no se frena a sí misma) y al terminar queda vieja.
    archivos.delete('n1/escritor/trabajando.json');
    lanzarLibroV3(db, { id: 'p1', narrador_id: 'n1' }, () => {}, motor);
    await colaDelEscritor.esperarTodo();
    const marca = JSON.parse(String(archivos.get('n1/escritor/trabajando.json')));
    expect(marca.que).toBe('libro p1');
    expect(Date.parse(marca.latido)).toBe(0);
    expect(await trabajaOtraCopia(db, 'n1')).toBe(false);
  });
});

describe('arreglos de la segunda revisión (09/10)', () => {
  it('si la A se rehízo y el mail de dudas falla, el reintento no toma por avisado el aviso viejo', async () => {
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('caído', { status: 500 })));
    const { db, archivos, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR, id: 'n10' }], pedidos: [{ id: 'p10', narrador_id: 'n10', estado: 'generando' }] } });
    archivos.set('n10/escritor/dudas-avisadas.txt', new Date(Date.now() - 48 * 3_600_000).toISOString()); // de una A anterior
    const { motor, modelo } = motorFalso();
    await escribirLibroV3(db, { id: 'p10', narrador_id: 'n10' }, motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, { id: 'p10', narrador_id: 'n10' }, motor); // el mail sigue caído: sigue esperando
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(modelo.llamadas.some((p) => p.clave.startsWith('C/'))).toBe(false);
    vi.unstubAllGlobals();
  });

  it('sin a quién avisar (falta MAIL_SOCIOS), no espera por las dudas', async () => {
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
    vi.stubEnv('MAIL_SOCIOS', '');
    const { db, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR, id: 'n11' }], pedidos: [{ id: 'p11', narrador_id: 'n11', estado: 'generando' }] } });
    const { motor } = motorFalso();
    await escribirLibroV3(db, { id: 'p11', narrador_id: 'n11' }, motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });
});
