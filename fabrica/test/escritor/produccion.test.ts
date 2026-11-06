// El escritor nuevo enchufado al worker (src/escritor/produccion): la cola, la ficha de producción, las
// correcciones, «Su voz», la Etapa A al terminar la entrevista y el libro entero de un pedido, con el modelo
// falso (respuestas de Nélida) y una base falsa en memoria. El PDF no se arma (Playwright): se simula.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// El libro para Bookmundo levanta Chromium de verdad: tiene sus propios tests (bookmundo.test.ts).
vi.mock('../../src/libro/bookmundo/narrador.js', () => ({ armarBookmundoSinFrenar: vi.fn(async () => undefined) }));
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
  alertarLibrosDemorados, colaDelEscritor, dudasParaLaFamilia, escribirLibroV3, esLibroPropio, fichaParaLibro, fuentesDeFrases, hayLugarParaLibroV3, lanzarLibroV3, leerCorrecciones, revisarEtapaAV3, SinMaterial, soloConAudio, type Motor,
} from '../../src/escritor/produccion/libro-v3.js';
import { regla } from '../../src/escritor/produccion/privacidad.js';
import { carpetaNelida, DEFECTOS_NELIDA, salidasModeloNelida } from './ayuda.js';

// ---------------------------------------------------------------- base falsa

type Fila = Record<string, unknown>;
function baseFalsa(o: { tablas?: Record<string, Fila[]>; archivos?: Record<string, string> } = {}) {
  const archivos = new Map<string, string | Buffer>(Object.entries(o.archivos ?? {}));
  const tablas: Record<string, Fila[]> = { narradores: [], pedidos: [], consumo_ia: [], entrevistas_v3: [], ...(o.tablas ?? {}) };
  // La privacidad del panel (05/11) tiene sus tests en test/privacidad.test.ts: acá, «para mí», sin espera del narrador.
  tablas.narradores = (tablas.narradores.length ? tablas.narradores : [{ id: 'n1' }]).map((n) => ({ ...n, contexto: { vinculoComprador: 'yo mismo', ...(n.contexto as object | undefined) } }));
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

/** Las salidas sin dudas de datos: el libro sigue de largo (la espera por dudas tiene sus tests propios). */
function sinDudas(): Record<string, string> {
  const reg = JSON.parse(salidasModeloNelida()['1-registro']);
  reg.dudas = [];
  return { ...salidasModeloNelida(), '1-registro': JSON.stringify(reg) };
}

function motorFalso(salidas: Record<string, string> = salidasModeloNelida()) {
  const modelo = new ModeloFalso(salidas, DEFECTOS_NELIDA);
  const motor: Motor = {
    ejecutor: ({ almacen, log }) => ({ ej: new Ejecutor({ modelo, almacen, log }), usarLote: false }),
    material: async () => ({ c: materialNelida(), audios: AUDIOS }),
  };
  return { motor, modelo };
}

beforeEach(() => {
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
    expect(cuerpo.text).toContain('n1/escritor/correcciones.json');
    // Corto (Naza, 30/10): cuántas son; las dudas se leen en la pantalla, no en el mail.
    // Sin link: en un privado esa pantalla no le abre a nadie (Naza, 06/11).
    expect(cuerpo.text).toContain('Se las mandamos por WhatsApp a quien contó. Espera hasta 3 días o hasta que estén todas contestadas.');
    expect(cuerpo.text).not.toContain('Para verlas');
    expect(cuerpo.text).not.toContain('/tablero/n1/dudas');
    expect(cuerpo.text).not.toContain('A la familia le llega');
    expect(cuerpo.text).not.toContain('24 horas');
    expect(cuerpo.text).not.toContain('¿Cómo se llamaba la Negra');
    expect(cuerpo.text).not.toContain('no existe');
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
    const modelo = new ModeloFalso(sinDudas(), DEFECTOS_NELIDA);
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
      ...sinDudas(),
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
    const { motor, modelo } = motorFalso(sinDudas());
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
    const salidas = sinDudas();
    delete (salidas as Record<string, string>)['3a-primera'];
    const { motor } = motorFalso(salidas);
    await escribirLibroV3(db, { id: 'p1', narrador_id: 'n1' }, motor);
    expect(tablas.pedidos[0].estado).toBe('fallido');
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body).subject).toContain('no salió');
    vi.unstubAllGlobals();
  });

  it('lanzarLibroV3 corre en segundo plano y avisa al terminar', async () => {
    const { db, tablas } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR }], pedidos: [{ id: 'p1', narrador_id: 'n1', estado: 'generando' }] } });
    const { motor } = motorFalso(sinDudas());
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
    const { motor, modelo } = motorFalso(sinDudas());
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

describe('el libro espera hasta 72 horas si la Etapa A encontró dudas (Naza, 06/11)', () => {
  const H = 3_600_000;
  const hace = (horas: number): string => new Date(Date.now() - horas * H).toISOString();
  const pedidoDe = (id: string, n: Fila = {}) => ({ tablas: { narradores: [{ ...NARRADOR, id, ...n }], pedidos: [{ id: `p-${id}`, narrador_id: id, estado: 'generando' }] } });
  const libro = (id: string) => ({ id: `p-${id}`, narrador_id: id });
  const idsDudas = (archivos: Map<string, string | Buffer>, id: string) => (JSON.parse(String(archivos.get(`${id}/escritor/dudas-familia.json`))).dudas as { id: string }[]).map((d) => d.id);

  afterEach(() => vi.unstubAllGlobals());

  it('avisa, vuelve a pagado sin escribir; a las 71 horas sigue esperando y a las 72 escribe sin repagar la A', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const { db, archivos, tablas } = baseFalsa(pedidoDe('n8'));
    const { motor, modelo } = motorFalso();
    await escribirLibroV3(db, libro('n8'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/2-plan', 'A/dudas']);
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body).subject).toContain('Dudas de datos');
    archivos.set('n8/escritor/dudas-avisadas.txt', hace(71));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n8'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    archivos.set('n8/escritor/dudas-avisadas.txt', hace(72));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n8'), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
    expect(modelo.llamadas.filter((p) => p.clave.startsWith('A/'))).toHaveLength(3);
    expect(fetch).toHaveBeenCalledTimes(2); // el de las dudas y, vencido el plazo, el de que quedaron sin contestar
  });

  it('vale igual para «Para mí» y para un regalo', async () => {
    for (const contexto of [{ vinculoComprador: 'yo mismo' }, { vinculoComprador: 'hija' }]) {
      const { db, tablas } = baseFalsa(pedidoDe('n8b', { contexto }));
      await escribirLibroV3(db, libro('n8b'), motorFalso().motor);
      expect(tablas.pedidos[0].estado).toBe('pagado');
    }
  });

  it('corre desde el WhatsApp a quien contó, no desde el mail a los socios', async () => {
    const { db, archivos, tablas } = baseFalsa(pedidoDe('n12'));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('n12'), motor);
    archivos.set('n12/escritor/dudas-avisadas.txt', hace(100));
    archivos.set('n12/escritor/dudas-narrador-avisadas.txt', hace(2));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n12'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    archivos.set('n12/escritor/dudas-narrador-avisadas.txt', hace(72));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n12'), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('con todas contestadas no espera; con una sin contestar, sí', async () => {
    const { db, archivos, tablas } = baseFalsa(pedidoDe('n11'));
    const { motor, modelo } = motorFalso();
    await escribirLibroV3(db, libro('n11'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    const ids = idsDudas(archivos, 'n11');
    expect(ids.length).toBeGreaterThan(0);
    archivos.set('n11/escritor/correcciones.json', JSON.stringify({ correcciones: ids.map((id, i) => ({ dudaId: id, texto: i === 0 ? '  ' : 'Sí' })) }));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n11'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(modelo.llamadas.some((p) => p.clave.startsWith('B/'))).toBe(false);
    archivos.set('n11/escritor/correcciones.json', JSON.stringify({ correcciones: ids.map((id) => ({ dudaId: id, texto: 'Sí' })) }));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n11'), motor);
    expect(tablas.pedidos[0].estado).not.toBe('pagado');
    expect(modelo.llamadas.some((p) => p.clave.startsWith('B/'))).toBe(true);
  });

  it('esperando, vuelve a mirar a los 15 minutos: la última respuesta libera el libro enseguida', async () => {
    const { db, tablas } = baseFalsa(pedidoDe('n13'));
    await escribirLibroV3(db, libro('n13'), motorFalso().motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(hayLugarParaLibroV3('n13')).toBe(false);
    expect(hayLugarParaLibroV3('n13', Date.now() + 16 * 60_000)).toBe(true);
  });

  it('sin dudas, no espera', async () => {
    const { db, tablas } = baseFalsa(pedidoDe('n9'));
    await escribirLibroV3(db, libro('n9'), motorFalso(sinDudas()).motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('ESCRITOR_ESPERA_DUDAS_HORAS=0 no saltea el plazo', async () => {
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '0');
    const { db, tablas } = baseFalsa(pedidoDe('n14'));
    await escribirLibroV3(db, libro('n14'), motorFalso().motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
  });

  it('sin MAIL_SOCIOS espera igual, con la marca escrita: a las 72 horas sigue', async () => {
    vi.stubEnv('MAIL_SOCIOS', '');
    const { db, tablas, archivos } = baseFalsa(pedidoDe('n15'));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('n15'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(Number.isFinite(Date.parse(String(archivos.get('n15/escritor/dudas-avisadas.txt'))))).toBe(true);
    archivos.set('n15/escritor/dudas-avisadas.txt', hace(72));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n15'), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('un mail a los socios que no sale no traba el libro: la marca se escribe igual', async () => {
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('caído', { status: 500 })));
    const { db, tablas, archivos } = baseFalsa(pedidoDe('n16'));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('n16'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(Number.isFinite(Date.parse(String(archivos.get('n16/escritor/dudas-avisadas.txt'))))).toBe(true);
    archivos.set('n16/escritor/dudas-avisadas.txt', hace(72));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n16'), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('una marca del mail rota se reescribe: el plazo no arranca de cero para siempre', async () => {
    const { db, tablas, archivos } = baseFalsa(pedidoDe('n17'));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('n17'), motor);
    archivos.set('n17/escritor/dudas-avisadas.txt', 'rota');
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n17'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(Number.isFinite(Date.parse(String(archivos.get('n17/escritor/dudas-avisadas.txt'))))).toBe(true);
  });

  it('marcas con fecha del futuro: el libro no se traba, dos vueltas seguidas', async () => {
    const futuro = new Date(Date.now() + 500 * H).toISOString();
    const { db, tablas, archivos } = baseFalsa(pedidoDe('n19'));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('n19'), motor);
    archivos.set('n19/escritor/dudas-narrador-avisadas.txt', futuro);
    archivos.set('n19/escritor/dudas-avisadas.txt', futuro);
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n19'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(Date.parse(String(archivos.get('n19/escritor/dudas-avisadas.txt')))).toBeLessThanOrEqual(Date.now()); // la reescribió
    archivos.set('n19/escritor/dudas-avisadas.txt', hace(72));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('n19'), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  describe.each(['viaje', 'kids'])('un modo %s con fila V3 queda como antes', (modo) => {
    const contexto = { modo, vinculoComprador: 'hija' };
    const id = `m-${modo}`;

    it('espera las 24 horas del mail, con su texto', async () => {
      vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
      vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
      const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
      vi.stubGlobal('fetch', fetch);
      const { db, tablas, archivos } = baseFalsa(pedidoDe(id, { contexto }));
      const { motor } = motorFalso();
      await escribirLibroV3(db, libro(id), motor);
      expect(tablas.pedidos[0].estado).toBe('pagado');
      const { text } = JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body);
      expect(text).toContain('A la familia le llega un mail para contestarlas.');
      expect(text).not.toContain('WhatsApp');
      archivos.set(`${id}/escritor/dudas-avisadas.txt`, hace(24));
      tablas.pedidos[0].estado = 'generando';
      await escribirLibroV3(db, libro(id), motor);
      expect(tablas.pedidos[0].estado).toBe('entregado');
    });

    it('con ESCRITOR_ESPERA_DUDAS_HORAS=0 o sin a quién avisar, no espera', async () => {
      vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '0');
      vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
      const a = baseFalsa(pedidoDe(`${id}-a`, { contexto }));
      await escribirLibroV3(a.db, libro(`${id}-a`), motorFalso().motor);
      expect(a.tablas.pedidos[0].estado).toBe('entregado');
      vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
      vi.stubEnv('MAIL_SOCIOS', '');
      const b = baseFalsa(pedidoDe(`${id}-b`, { contexto }));
      await escribirLibroV3(b.db, libro(`${id}-b`), motorFalso().motor);
      expect(b.tablas.pedidos[0].estado).toBe('entregado');
    });

    it('si el mail no sale, no da por avisado', async () => {
      vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
      vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
      vi.stubGlobal('fetch', vi.fn(async () => new Response('caído', { status: 500 })));
      const { db, tablas, archivos } = baseFalsa(pedidoDe(`${id}-c`, { contexto }));
      await escribirLibroV3(db, libro(`${id}-c`), motorFalso().motor);
      expect(tablas.pedidos[0].estado).toBe('pagado');
      expect(String(archivos.get(`${id}-c/escritor/dudas-avisadas.txt`) ?? '')).toBe('');
    });
  });

  it('una A rehecha deja vacías las dos marcas antes de pagar, y el plazo arranca de cero', async () => {
    const { db, archivos, tablas } = baseFalsa(pedidoDe('n18'));
    const { motor, modelo } = motorFalso();
    await revisarEtapaAV3(db, 'n18', { motor });
    await colaDelEscritor.esperarTodo();
    archivos.set('n18/escritor/dudas-avisadas.txt', hace(100));
    archivos.set('n18/escritor/dudas-narrador-avisadas.txt', hace(100));
    const cambiado = materialNelida();
    cambiado.escribir('entradas/respuestas.xml', cambiado.leer('entradas/respuestas.xml').replace('a cualquier hora', ''));
    const antes = modelo.llamadas.length;
    await escribirLibroV3(db, libro('n18'), { ...motor, material: async () => ({ c: cambiado.clonar(), audios: AUDIOS }) });
    expect(modelo.llamadas.slice(antes).map((p) => p.clave).slice(0, 2)).toEqual(['A/1-registro', 'A/2-plan']);
    expect(String(archivos.get('n18/escritor/dudas-narrador-avisadas.txt'))).toBe('');
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(Date.now() - Date.parse(String(archivos.get('n18/escritor/dudas-avisadas.txt')))).toBeLessThan(H);
  });
});

describe('las 48 horas de quien contó antes de pagar la lectura (Naza, 06/11)', () => {
  const H = 3_600_000;
  const hace = (horas: number): string => new Date(Date.now() - horas * H).toISOString();
  const REGALO = { vinculoComprador: 'hija' };
  const pedidoDe = (id: string, ultima: string) => ({ tablas: { narradores: [{ ...NARRADOR, id, contexto: REGALO, ultima_respuesta_at: ultima }], pedidos: [{ id: `p-${id}`, narrador_id: id, estado: 'generando' }] } });
  const libro = (id: string) => ({ id: `p-${id}`, narrador_id: id });

  it('el tick no lanza la Etapa A a las 47 horas; a las 48, sí', async () => {
    const { db, tablas, archivos } = baseFalsa(pedidoDe('e1', hace(47)));
    const { motor, modelo } = motorFalso();
    await revisarEtapaAV3(db, 'e1', { motor });
    await colaDelEscritor.esperarTodo();
    expect(modelo.llamadas).toHaveLength(0);
    expect(archivos.has('e1/escritor/carpeta-A.json')).toBe(false);
    tablas.narradores[0].ultima_respuesta_at = hace(48);
    await revisarEtapaAV3(db, 'e1', { motor });
    await colaDelEscritor.esperarTodo();
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/2-plan', 'A/dudas']);
  });

  it('«Para mí» no espera en el tick', async () => {
    const { db } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR, id: 'e2', contexto: { vinculoComprador: 'yo mismo' }, ultima_respuesta_at: hace(1) }] } });
    const { motor, modelo } = motorFalso();
    await revisarEtapaAV3(db, 'e2', { motor });
    await colaDelEscritor.esperarTodo();
    expect(modelo.llamadas.length).toBeGreaterThan(0);
  });

  it('encargado antes: vuelve a pagado sin pagar nada y mira a los 15 minutos, no a las 48 horas', async () => {
    const { db, tablas } = baseFalsa(pedidoDe('e3', hace(1)));
    const { motor, modelo } = motorFalso();
    await escribirLibroV3(db, libro('e3'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(modelo.llamadas).toHaveLength(0);
    expect(hayLugarParaLibroV3('e3')).toBe(false);
    expect(hayLugarParaLibroV3('e3', Date.now() + 16 * 60_000)).toBe(true);
  });

  it('si quita todas sus respuestas durante la espera, sigue pagado: no se lee el material', async () => {
    const { db, tablas } = baseFalsa(pedidoDe('e4', hace(1)));
    const sinNada: Motor = { ...motorFalso().motor, material: async () => { throw new SinMaterial('e4'); } };
    await escribirLibroV3(db, libro('e4'), sinNada);
    expect(tablas.pedidos[0].estado).toBe('pagado');
  });

  it.each([
    ['las 48 horas', 1],
    ['las dudas', 49],
  ])('alternar vueltas sanas por %s y errores pasajeros nunca da fallido', async (_caso, horas) => {
    const { motor } = motorFalso();
    let caido = false;
    const conCortes: Motor = { ...motor, material: async (d, n) => { if (caido) throw new Error('fetch failed'); return motor.material!(d, n); } };
    const id = `e5-${horas}`;
    const b = baseFalsa(pedidoDe(id, hace(horas)));
    for (let i = 0; i < 6; i++) {
      caido = true;
      // Con las 48 horas corriendo el material no se lee: el error pasajero tiene que venir de otra vuelta.
      b.tablas.narradores[0].ultima_respuesta_at = hace(49);
      b.tablas.pedidos[0].estado = 'generando';
      await escribirLibroV3(b.db, libro(id), conCortes);
      expect(b.tablas.pedidos[0].estado).toBe('pagado');
      caido = false;
      b.tablas.narradores[0].ultima_respuesta_at = hace(horas);
      b.tablas.pedidos[0].estado = 'generando';
      await escribirLibroV3(b.db, libro(id), conCortes);
      expect(b.tablas.pedidos[0].estado).toBe('pagado');
    }
  });
});

describe('la alerta de libro demorado con las esperas nuevas (Naza, 06/11)', () => {
  const H = 3_600_000;
  const ahora = Date.parse('2026-11-10T12:00:00Z');
  const haceH = (h: number) => new Date(ahora - h * H).toISOString();
  const armar = (n: Fila, archivos: Record<string, string> = {}) => baseFalsa({
    tablas: { narradores: [{ id: 'a1', ...n }], pedidos: [{ id: 'p-a1', narrador_id: 'a1', estado: 'pagado' }] },
    archivos,
  });
  const REGALO = { contexto: { vinculoComprador: 'hija' } };
  const conMail = () => {
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };
  afterEach(() => vi.unstubAllGlobals());

  it('privado: no avisa a las 119 horas; a las 120, sí, con el texto corregido', async () => {
    const fetch = conMail();
    await alertarLibrosDemorados(armar({ ...REGALO, libro_aprobado_at: haceH(119) }).db, new Set(['a1']), ahora);
    expect(fetch).not.toHaveBeenCalled();
    await alertarLibrosDemorados(armar({ ...REGALO, libro_aprobado_at: haceH(120) }).db, new Set(['a1']), ahora);
    const { text } = JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(text).toContain('más hasta 3 días si hay dudas sin contestar');
    expect(text).not.toContain('más 24 si hubo dudas');
  });

  it('privado: el reloj arranca cuando terminan las 48 horas de quien contó', async () => {
    const fetch = conMail();
    const cerrado = { ...REGALO, libro_aprobado_at: haceH(200) };
    await alertarLibrosDemorados(armar({ ...cerrado, ultima_respuesta_at: haceH(167) }).db, new Set(['a1']), ahora);
    expect(fetch).not.toHaveBeenCalled();
    await alertarLibrosDemorados(armar({ ...cerrado, ultima_respuesta_at: haceH(168) }).db, new Set(['a1']), ahora);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('privado con la Etapa A hecha y cero dudas: vuelve a las 48 horas; con dudas, a las 120', async () => {
    const fetch = conMail();
    const conA = { 'a1/escritor/carpeta-A.json': '{}' };
    await alertarLibrosDemorados(armar({ ...REGALO, libro_aprobado_at: haceH(119) }, { ...conA, 'a1/escritor/dudas-familia.json': '{"dudas":[{"id":"D01"}]}' }).db, new Set(['a1']), ahora);
    expect(fetch).not.toHaveBeenCalled();
    await alertarLibrosDemorados(armar({ ...REGALO, libro_aprobado_at: haceH(47) }, conA).db, new Set(['a1']), ahora);
    expect(fetch).not.toHaveBeenCalled();
    await alertarLibrosDemorados(armar({ ...REGALO, libro_aprobado_at: haceH(48) }, conA).db, new Set(['a1']), ahora);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['viaje', 'kids'])('un modo %s queda como antes: a las 48 horas, aunque tenga dudas', async (modo) => {
    const fetch = conMail();
    const contexto = { modo, vinculoComprador: 'hija' };
    await alertarLibrosDemorados(armar({ contexto, libro_aprobado_at: haceH(48) }, { 'a1/escritor/dudas-familia.json': '{"dudas":[{"id":"D01"}]}' }).db, new Set(['a1']), ahora);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('«Para mí»: a las 48 horas sin dudas; con dudas, a las 120, porque también las espera', async () => {
    const fetch = conMail();
    const dudas = { 'a1/escritor/dudas-familia.json': '{"dudas":[{"id":"D01"}]}' };
    await alertarLibrosDemorados(armar({ libro_aprobado_at: haceH(119) }, dudas).db, new Set(['a1']), ahora);
    expect(fetch).not.toHaveBeenCalled();
    await alertarLibrosDemorados(armar({ libro_aprobado_at: haceH(120) }, dudas).db, new Set(['a1']), ahora);
    expect(fetch).toHaveBeenCalledTimes(1);
    await alertarLibrosDemorados(armar({ libro_aprobado_at: haceH(48) }).db, new Set(['a1']), ahora);
    expect(fetch).toHaveBeenCalledTimes(2);
    await alertarLibrosDemorados(armar({ libro_aprobado_at: haceH(48) }, { 'a1/escritor/dudas-familia.json': '{"dudas":[]}' }).db, new Set(['a1']), ahora);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe('dudasParaLaFamilia: el plazo vencido', () => {
  const H = 3_600_000;
  const hace = (horas: number): string => new Date(Date.now() - horas * H).toISOString();

  it('por el WhatsApp o por el respaldo; recién avisadas, no', async () => {
    const { db, archivos } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR, id: 'f1' }] } });
    await revisarEtapaAV3(db, 'f1', { motor: motorFalso().motor });
    await colaDelEscritor.esperarTodo();
    expect((await dudasParaLaFamilia(db, 'f1'))?.plazoVencido).toBe(false);
    archivos.set('f1/escritor/dudas-avisadas.txt', hace(73));
    expect((await dudasParaLaFamilia(db, 'f1'))?.plazoVencido).toBe(true);
    archivos.set('f1/escritor/dudas-narrador-avisadas.txt', hace(1));
    expect((await dudasParaLaFamilia(db, 'f1'))?.plazoVencido).toBe(false);
    archivos.set('f1/escritor/dudas-narrador-avisadas.txt', hace(72));
    expect((await dudasParaLaFamilia(db, 'f1'))?.plazoVencido).toBe(true);
  });

  it('sin dudas, no hay plazo que venza', async () => {
    const { db, archivos } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR, id: 'f2' }] } });
    await revisarEtapaAV3(db, 'f2', { motor: motorFalso(sinDudas()).motor });
    await colaDelEscritor.esperarTodo();
    archivos.set('f2/escritor/dudas-avisadas.txt', hace(100));
    expect(await dudasParaLaFamilia(db, 'f2')).toEqual({ cantidad: 0, contestadas: false, plazoVencido: false });
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

// «Para mí» (15/10): el mismo criterio que esPropia en la web (vinculoComprador = "yo mismo").
describe('esLibroPropio', () => {
  it('solo cuando quien compró eligió «Para mí»', () => {
    expect(esLibroPropio({ vinculoComprador: 'yo mismo' })).toBe(true);
    expect(esLibroPropio({ vinculoComprador: 'hija' })).toBe(false);
    expect(esLibroPropio({})).toBe(false);
    expect(esLibroPropio(null)).toBe(false);
    expect(esLibroPropio(undefined)).toBe(false);
  });
});

describe('un regalo que no es privado sigue como hoy (la regla en false, Joaquín 06/11)', () => {
  const H = 3_600_000;
  const hace = (horas: number): string => new Date(Date.now() - horas * H).toISOString();
  const REGALO = { vinculoComprador: 'hija' };
  const pedidoDe = (id: string, n: Fila = {}) => ({ tablas: { narradores: [{ ...NARRADOR, id, contexto: REGALO, ...n }], pedidos: [{ id: `p-${id}`, narrador_id: id, estado: 'generando' }] } });
  const libro = (id: string) => ({ id: `p-${id}`, narrador_id: id });
  const conMail = (status = 200) => {
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    const fetch = vi.fn(async (_url: string, _init: { body: string }) => new Response('{}', { status }));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };
  const mails = (fetch: ReturnType<typeof conMail>) => fetch.mock.calls.map((c) => JSON.parse(c[1].body) as { subject: string; text: string });

  beforeEach(() => { vi.spyOn(regla, 'esPrivado').mockReturnValue(false); });
  afterEach(() => vi.unstubAllGlobals());

  it('espera ESCRITOR_ESPERA_DUDAS_HORAS desde el mail, con su texto, y se retoma al vencer, no a los 15 minutos', async () => {
    const fetch = conMail();
    const { db, tablas, archivos } = baseFalsa(pedidoDe('r1'));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('r1'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    const { text } = mails(fetch)[0];
    expect(text).toContain('A la familia le llega un mail para contestarlas.');
    expect(text).toContain('espera 24 horas desde este mail');
    expect(text).not.toContain('WhatsApp');
    expect(hayLugarParaLibroV3('r1', Date.now() + 16 * 60_000)).toBe(false);
    expect(hayLugarParaLibroV3('r1', Date.now() + 25 * H)).toBe(true);
    archivos.set('r1/escritor/dudas-avisadas.txt', hace(24));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('r1'), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('la marca del WhatsApp no cuenta: manda dudas-avisadas.txt', async () => {
    conMail();
    const { db, tablas, archivos } = baseFalsa(pedidoDe('r2'));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('r2'), motor);
    archivos.set('r2/escritor/dudas-narrador-avisadas.txt', hace(1));
    archivos.set('r2/escritor/dudas-avisadas.txt', hace(24));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('r2'), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
  });

  it('con ESCRITOR_ESPERA_DUDAS_HORAS=0 o sin a quién avisar, no espera', async () => {
    conMail();
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '0');
    const a = baseFalsa(pedidoDe('r3'));
    await escribirLibroV3(a.db, libro('r3'), motorFalso().motor);
    expect(a.tablas.pedidos[0].estado).toBe('entregado');
    vi.stubEnv('ESCRITOR_ESPERA_DUDAS_HORAS', '24');
    vi.stubEnv('MAIL_SOCIOS', '');
    const b = baseFalsa(pedidoDe('r4'));
    await escribirLibroV3(b.db, libro('r4'), motorFalso().motor);
    expect(b.tablas.pedidos[0].estado).toBe('entregado');
  });

  it('si el mail no sale, no da por avisado', async () => {
    conMail(500);
    const { db, tablas, archivos } = baseFalsa(pedidoDe('r5'));
    await escribirLibroV3(db, libro('r5'), motorFalso().motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(String(archivos.get('r5/escritor/dudas-avisadas.txt') ?? '')).toBe('');
  });

  it('la Etapa A no espera 48 horas, y el pedido tampoco', async () => {
    const { db } = baseFalsa({ tablas: { narradores: [{ ...NARRADOR, id: 'r6', contexto: REGALO, ultima_respuesta_at: hace(1) }] } });
    const { motor, modelo } = motorFalso();
    await revisarEtapaAV3(db, 'r6', { motor });
    await colaDelEscritor.esperarTodo();
    expect(modelo.llamadas.length).toBeGreaterThan(0);
    const b = baseFalsa(pedidoDe('r7', { ultima_respuesta_at: hace(1) }));
    const m2 = motorFalso(sinDudas());
    await escribirLibroV3(b.db, libro('r7'), m2.motor);
    expect(b.tablas.pedidos[0].estado).toBe('entregado');
  });

  it('venció la espera con dudas sin contestar: se escribe sin avisar nada a los socios', async () => {
    const fetch = conMail();
    const { db, tablas, archivos } = baseFalsa(pedidoDe('r8'));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('r8'), motor);
    archivos.set('r8/escritor/dudas-avisadas.txt', hace(24));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('r8'), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
    expect(mails(fetch).filter((m) => /sin contestar/.test(m.text))).toEqual([]);
    expect(archivos.has('r8/escritor/dudas-sin-contestar-avisadas.txt')).toBe(false);
  });

  it('la alerta de demora: a las 48 horas, aunque tenga dudas, con su texto de siempre', async () => {
    const fetch = conMail();
    const ahora = Date.parse('2026-11-10T12:00:00Z');
    const { db } = baseFalsa({
      tablas: { narradores: [{ id: 'r9', contexto: REGALO, libro_aprobado_at: new Date(ahora - 48 * H).toISOString() }], pedidos: [{ id: 'p-r9', narrador_id: 'r9', estado: 'pagado' }] },
      archivos: { 'r9/escritor/dudas-familia.json': '{"dudas":[{"id":"D01"}]}' },
    });
    await alertarLibrosDemorados(db, new Set(['r9']), ahora);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mails(fetch)[0].text).toContain('La familia cerró el libro hace 48 horas');
    expect(mails(fetch)[0].text).toContain('más 24 si hubo dudas');
  });

  it('con la regla en true, el mismo contexto va a quien contó: la prueba de que nada mira el vínculo', async () => {
    const fetch = conMail();
    vi.mocked(regla.esPrivado).mockReturnValue(true);
    const { db, tablas, archivos } = baseFalsa(pedidoDe('r10'));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('r10'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(mails(fetch)[0].text).toContain('Se las mandamos por WhatsApp a quien contó.');
    archivos.set('r10/escritor/dudas-avisadas.txt', hace(24));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('r10'), motor);
    expect(tablas.pedidos[0].estado).toBe('pagado');
  });
});

describe('si quien contó no contesta, los socios se enteran (Joaquín, 06/11)', () => {
  const H = 3_600_000;
  const hace = (horas: number): string => new Date(Date.now() - horas * H).toISOString();
  const pedidoDe = (id: string, contexto: Fila) => ({ tablas: { narradores: [{ ...NARRADOR, id, contexto }], pedidos: [{ id: `p-${id}`, narrador_id: id, estado: 'generando' }] } });
  const libro = (id: string) => ({ id: `p-${id}`, narrador_id: id });
  const conMail = (status = 200) => {
    vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
    const fetch = vi.fn(async (_url: string, _init: { body: string }) => new Response('{}', { status }));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };
  const delAviso = (fetch: ReturnType<typeof conMail>) => fetch.mock.calls.map((c) => JSON.parse(c[1].body) as { text: string }).filter((m) => m.text.includes('Se empieza a escribir'));
  afterEach(() => vi.unstubAllGlobals());

  it.each([['un privado', { vinculoComprador: 'hija' }], ['«Para mí»', { vinculoComprador: 'yo mismo' }]])('%s: venció el plazo, un mail con cuántas y su marca, y el libro sale', async (_caso, contexto) => {
    const fetch = conMail();
    const id = `s-${contexto.vinculoComprador === 'hija' ? 'a' : 'b'}`;
    const { db, tablas, archivos } = baseFalsa(pedidoDe(id, contexto));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro(id), motor);
    expect(delAviso(fetch)).toEqual([]);
    const total = (JSON.parse(String(archivos.get(`${id}/escritor/dudas-familia.json`))).dudas as unknown[]).length;
    archivos.set(`${id}/escritor/dudas-avisadas.txt`, hace(72));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro(id), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
    expect(delAviso(fetch)).toHaveLength(1);
    expect(delAviso(fetch)[0].text).toMatch(new RegExp(`^Se empieza a escribir el libro de .+ con ${total} dudas? sin contestar\\. Quien contó no las respondió en el plazo\\.`));
    expect(archivos.has(`${id}/escritor/dudas-sin-contestar-avisadas.txt`)).toBe(true);
  });

  it('si el mail falla, el libro sale igual y no queda la marca', async () => {
    conMail(500);
    const { db, tablas, archivos } = baseFalsa(pedidoDe('s-c', { vinculoComprador: 'hija' }));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('s-c'), motor);
    archivos.set('s-c/escritor/dudas-avisadas.txt', hace(72));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('s-c'), motor);
    expect(tablas.pedidos[0].estado).toBe('entregado');
    expect(archivos.has('s-c/escritor/dudas-sin-contestar-avisadas.txt')).toBe(false);
  });

  it('con todas contestadas, nada', async () => {
    const fetch = conMail();
    const { db, tablas, archivos } = baseFalsa(pedidoDe('s-d', { vinculoComprador: 'hija' }));
    const { motor } = motorFalso();
    await escribirLibroV3(db, libro('s-d'), motor);
    const ids = (JSON.parse(String(archivos.get('s-d/escritor/dudas-familia.json'))).dudas as { id: string }[]).map((d) => d.id);
    archivos.set('s-d/escritor/correcciones.json', JSON.stringify({ correcciones: ids.map((dudaId) => ({ dudaId, texto: 'Sí' })) }));
    tablas.pedidos[0].estado = 'generando';
    await escribirLibroV3(db, libro('s-d'), motor);
    expect(delAviso(fetch)).toEqual([]);
  });

  it('una A rehecha saca las respuestas viejas a las dudas antes de pagarla, y deja las de los socios', async () => {
    conMail();
    const { db, archivos } = baseFalsa(pedidoDe('s-f', { vinculoComprador: 'hija' }));
    const { motor } = motorFalso();
    await revisarEtapaAV3(db, 's-f', { motor });
    await colaDelEscritor.esperarTodo();
    archivos.set('s-f/escritor/correcciones.json', JSON.stringify({ correcciones: [{ dudaId: 'D01', texto: 'Vieja' }, { texto: 'Del socio' }] }));
    const cambiado = materialNelida();
    cambiado.escribir('entradas/respuestas.xml', cambiado.leer('entradas/respuestas.xml').replace('a cualquier hora', ''));
    await escribirLibroV3(db, libro('s-f'), { ...motor, material: async () => ({ c: cambiado.clonar(), audios: AUDIOS }) });
    expect(JSON.parse(String(archivos.get('s-f/escritor/correcciones.json'))).correcciones).toEqual([{ texto: 'Del socio' }]);
  });

  it('una A rehecha deja la marca sin valor', async () => {
    conMail();
    const { db, archivos, tablas } = baseFalsa(pedidoDe('s-e', { vinculoComprador: 'hija' }));
    const { motor } = motorFalso();
    await revisarEtapaAV3(db, 's-e', { motor });
    await colaDelEscritor.esperarTodo();
    archivos.set('s-e/escritor/dudas-sin-contestar-avisadas.txt', hace(100));
    const cambiado = materialNelida();
    cambiado.escribir('entradas/respuestas.xml', cambiado.leer('entradas/respuestas.xml').replace('a cualquier hora', ''));
    await escribirLibroV3(db, libro('s-e'), { ...motor, material: async () => ({ c: cambiado.clonar(), audios: AUDIOS }) });
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(String(archivos.get('s-e/escritor/dudas-sin-contestar-avisadas.txt'))).toBe('');
  });
});
