// El libro de Kids enchufado al worker (src/escritor-kids/produccion/libro-kids.ts), con el modelo falso, el chico
// inventado de los fijos y una base falsa en memoria. Cero gasto: nunca se llama a un modelo de verdad. El PDF no se
// arma (Playwright): se simula con un PDF de mentira de dos páginas.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/libro/pdf.js', () => ({ htmlAPdf: vi.fn(async (html: string) => Buffer.from(`%PDF-1.4 /Type /Pages /Type /Page /Type /Page ${html.length}`)) }));
vi.mock('../../src/config.js', () => ({
  cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com', anthropicApiKey: 'x', supabaseServiceRoleKey: 'secreto-de-prueba' }),
}));

import { anotarUsoEscritorKids } from '../../src/costos.js';
import { mandarEntregasAImprenta } from '../../src/entregas.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { extrasFalsosDe } from '../../src/escritor-kids/cli.js';
import { salidasFalsasKids } from '../../src/escritor-kids/falso.js';
import { carpetaDeFilas, materialDe } from '../../src/escritor-kids/material/carpeta.js';
import { dirDeFijo, filasDeFijo } from '../../src/escritor-kids/material/de-fijo.js';
import { cuerpoMailKids, TEXTOS_MAIL_KIDS, textosMailKids } from '../../src/escritor-kids/produccion/mails.js';
import { colaKids, contarPaginas, faltanTextosKids, olvidarAvisosApagado, revisarLibrosKids, topeKids, type MotorKids } from '../../src/escritor-kids/produccion/libro-kids.js';
import { SinTextosKids } from '../../src/escritor-kids/idioma-textos.js';
import { fuenteDeDisco } from '../../src/escritor-kids/salida/fotos.js';

const ID = '9d2e7b40-1c5f-4a83-b6e0-2f8c3a91d057'; // chico-preocupante (Benja, inventado)
const DIA = 86_400_000;

const LECTURA_PREOCUPANTE = JSON.stringify({
  preocupante: [{ ids: ['R07'], cita: 'Pero cuando se enoja mucho me pega.', por_que: 'dice que su papá le pega cuando se enoja' }],
  dudas: [], su_voz: ['R07', 'R04', 'R02'], notas: '',
});

// ---------------------------------------------------------------- base falsa

type Fila = Record<string, unknown>;
function baseFalsa(tablas: Record<string, Fila[]>) {
  const archivos = new Map<string, string | Buffer>();
  const db = {
    from(tabla: string) {
      const filtros: ((f: Fila) => boolean)[] = [];
      let cambios: Fila | null = null;
      let nueva: Fila | null = null;
      const resultado = () => {
        if (nueva) { (tablas[tabla] ??= []).push(nueva); return { data: [nueva], error: null }; }
        const r = (tablas[tabla] ?? []).filter((f) => filtros.every((x) => x(f)));
        if (cambios) for (const f of r) Object.assign(f, cambios);
        return { data: r.map((f) => ({ ...f })), error: null };
      };
      const q: any = {
        select: () => q,
        order: () => q,
        eq: (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return q; },
        in: (c: string, vs: unknown[]) => { filtros.push((f) => vs.includes(f[c])); return q; },
        is: (c: string, v: unknown) => { filtros.push((f) => (f[c] ?? null) === v); return q; },
        update: (c: Fila) => { cambios = c; return q; },
        insert: (f: Fila) => { nueva = f; return q; },
        maybeSingle: async () => { const r = resultado(); return { data: r.data[0] ?? null, error: null }; },
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
        // Como Storage: sin upsert, un archivo que ya existe da error (409) y no se pisa.
        upload: async (ruta: string, cuerpo: string | Buffer, o?: { upsert?: boolean }) => {
          if (o?.upsert === false && archivos.has(ruta)) return { error: { message: 'The resource already exists', statusCode: '409' } };
          archivos.set(ruta, cuerpo);
          return { error: null };
        },
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

function tablasDeBenja(o: { pedido?: boolean; estado?: string; termino?: boolean } = {}): Record<string, Fila[]> {
  return {
    kids_v2: [{ narrador_id: ID, ficha: { apodo: 'Benja', linkPanel: 'https://www.vitacorafamiliar.com/kids/panel/benja' }, termino_at: o.termino === false ? null : '2026-09-11T21:53:41.000Z' }],
    narradores: [{ id: ID, estado: o.estado ?? 'completado', familia_id: 'f1', como_le_dicen: 'Benja', libro_aprobado_at: null }],
    familias: [{ id: 'f1', email: 'carolina@ejemplo.com' }],
    pedidos: o.pedido ? [{ id: 'p1', narrador_id: ID, estado: 'pagado', extras: { tipo: 'kids' } }] : [],
    consumo_ia: [],
  };
}

function motorFalso(salidas: Record<string, string> = { 'kids-leer': LECTURA_PREOCUPANTE }) {
  const filas = filasDeFijo('chico-preocupante');
  const m = materialDe(carpetaDeFilas(filas));
  const modelo = new ModeloFalso({ ...salidasFalsasKids(m, extrasFalsosDe(dirDeFijo('chico-preocupante'))), ...salidas });
  const motor: MotorKids = {
    ejecutor: ({ almacen, log }) => ({ ej: new Ejecutor({ modelo, almacen, log }), usarLote: false }),
    material: async () => ({ c: carpetaDeFilas(filas), fotos: fuenteDeDisco(dirDeFijo('chico-preocupante')) }),
  };
  return { motor, modelo };
}

type Mail = { to: string[]; subject: string; text?: string; html?: string };
let mails: Mail[];
const aSocios = () => mails.filter((x) => x.subject.startsWith('[Vitácora escritor]'));
const alPadre = () => mails.filter((x) => !x.subject.startsWith('[Vitácora escritor]'));

async function vuelta(db: unknown, motor: MotorKids, ahora?: number): Promise<void> {
  await revisarLibrosKids(db as never, { motor, ...(ahora ? { ahora } : {}) });
  await colaKids.esperarTodo();
}

beforeEach(() => {
  mails = [];
  olvidarAvisosApagado();
  vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
  vi.stubEnv('ESCRITOR_KIDS', '1');
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => { mails.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }); }));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  await colaKids.esperarTodo();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const real = (a: string) => `${ID}/escritor-kids/real/${a}`;
const kids = (a: string) => `${ID}/escritor-kids/${a}`;
const paquete = (a: string) => `${ID}/paquete/${a}`;

describe('el libro de Kids en el worker', () => {
  it('termino → A → frenado → liberado → libro → listo.json → mail al padre → aprobado → entregado → imprenta; nada se repite', async () => {
    const { db, archivos, tablas } = baseFalsa(tablasDeBenja());
    const { motor, modelo } = motorFalso();

    // 1. Terminó de contar: la lectura (A), una vez. Encuentra algo preocupante: frena y avisa a los socios.
    await vuelta(db, motor);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/kids-leer']);
    expect(archivos.has(real('carpeta-A.json'))).toBe(true);
    const frenado = JSON.parse(String(archivos.get(real('frenado.json'))));
    expect(frenado.preocupante[0].ids).toEqual(['R07']);
    expect(aSocios()).toHaveLength(1);
    expect(aSocios()[0].subject).toContain('Libro de Kids frenado: Benja');
    expect(aSocios()[0].text).toContain(`${ID}/escritor-kids/real/liberado.json`);
    expect(archivos.has(kids('frenado-avisado.txt'))).toBe(true);

    // 2. Frenado, aunque el padre ya pagó: nada (ni modelo, ni mails, ni libro).
    tablas.pedidos.push({ id: 'p1', narrador_id: ID, estado: 'pagado', extras: { tipo: 'kids' } });
    await vuelta(db, motor);
    await vuelta(db, motor);
    expect(modelo.llamadas).toHaveLength(1);
    expect(mails).toHaveLength(1);
    expect(archivos.has(kids('listo.json'))).toBe(false);

    // 3. Naza lo libera a mano: B, C y el armado (la A sale de la carpeta, no se paga de nuevo).
    archivos.set(real('liberado.json'), JSON.stringify({ por: 'Naza', at: '2026-10-16' }));
    await vuelta(db, motor);
    const claves = modelo.llamadas.map((p) => p.clave);
    expect(claves.filter((k) => k === 'A/kids-leer')).toHaveLength(1);
    expect(claves).toContain('B/kids-parte-1');
    expect(claves.some((k) => k.startsWith('C/kids-veedor'))).toBe(true);
    for (const a of ['libro.pdf', 'sobre.pdf', 'libro.html', 'frases.json']) expect(archivos.has(paquete(a)), a).toBe(true);
    expect(archivos.has(paquete('frases_pedido.txt'))).toBe(true); // el worker de audio pasa cada respuesta a mp3
    const listo = JSON.parse(String(archivos.get(kids('listo.json'))));
    expect(listo).toMatchObject({ paginas: 2, sobrePaginas: 2 });
    expect(Number.isFinite(Date.parse(listo.at))).toBe(true);
    expect(tablas.pedidos[0].estado).toBe('pagado'); // todavía no: falta que lo apruebe el padre
    expect(String(archivos.get(real('informe.md')))).toContain('## Algo preocupante (Naza lo liberó)');

    // «Su voz»: el frases.json de siempre, una candidata entera por respuesta elegida (sin la preocupante), para cortar.
    const frases = JSON.parse(String(archivos.get(paquete('frases.json'))));
    const candidatas = frases.capitulos.flatMap((c: { candidatas: Fila[] }) => c.candidatas);
    expect(candidatas.map((c: Fila) => c.id).sort()).toEqual(['R02', 'R04']);
    expect(frases).toMatchObject({ version: 1, narrador_id: ID, pedido_id: 'p1' });
    expect(frases.confirmado_at).not.toBeNull();
    for (const c of candidatas) {
      expect(c).toMatchObject({ estado: 'pendiente', elegida: true, entera: true, inicio: 0, fin: null, audio_path: null });
      expect(typeof c.respuesta_id).toBe('string');
    }

    // 4. Mail al padre: el libro está en su panel para revisar. Una sola vez.
    const llamadas = modelo.llamadas.length;
    await vuelta(db, motor);
    await vuelta(db, motor);
    expect(alPadre()).toHaveLength(1);
    expect(alPadre()[0].to).toEqual(['carolina@ejemplo.com']);
    expect(alPadre()[0].subject).toBe('El libro de Benja está para que lo revises');
    expect(alPadre()[0].html).toContain('https://www.vitacorafamiliar.com/kids/panel/benja');
    expect(modelo.llamadas).toHaveLength(llamadas);
    expect(tablas.pedidos[0].estado).toBe('pagado');

    // 5. A los 14 días sin aprobar: un aviso a los socios, una vez. La fábrica no aprueba sola.
    const socios = aSocios().length;
    await vuelta(db, motor, Date.now() + 13 * DIA);
    expect(aSocios()).toHaveLength(socios);
    await vuelta(db, motor, Date.now() + 15 * DIA);
    await vuelta(db, motor, Date.now() + 16 * DIA);
    expect(aSocios()).toHaveLength(socios + 1);
    expect(aSocios().at(-1)!.subject).toContain('no aprobó el libro de Kids en 14 días');
    expect(tablas.narradores[0].libro_aprobado_at).toBeNull();
    expect(tablas.pedidos[0].estado).toBe('pagado');

    // 6. El padre lo aprueba (la web pone libro_aprobado_at): el pedido pasa a entregado y sale «libro listo».
    tablas.narradores[0].libro_aprobado_at = new Date().toISOString();
    tablas.pedidos.push({ id: 'p2', narrador_id: ID, estado: 'pagado', extras: { tipo: 'kids' } }); // una copia más
    await vuelta(db, motor);
    await vuelta(db, motor);
    expect(tablas.pedidos.map((p) => p.estado)).toEqual(['entregado', 'entregado']);
    expect(tablas.pedidos[0].libro_pdf_path).toBe(`${ID}/paquete/libro.pdf`);
    expect(alPadre()).toHaveLength(2);
    expect(alPadre()[1].subject).toBe('El libro de Benja está listo');
    expect(modelo.llamadas).toHaveLength(llamadas);

    // 7. La imprenta (entregas.ts): el libro y el sobre tal cual, y la entrega a producción.
    tablas.entregas = [{ id: 'e1', narrador_id: ID, pedido_id: null, estado: 'lista' }];
    await mandarEntregasAImprenta(db);
    expect(tablas.entregas[0].estado).toBe('en_produccion');
    expect(String(archivos.get(paquete('libro-imprenta.pdf')))).toBe(String(archivos.get(paquete('libro.pdf'))));
    expect(String(archivos.get(paquete('sobre-imprenta.pdf')))).toBe(String(archivos.get(paquete('sobre.pdf'))));
  });

  it('sin algo preocupante y con el pedido pagado desde el principio: un solo trabajo hace A, B y C', async () => {
    const { db, archivos, tablas } = baseFalsa(tablasDeBenja({ pedido: true }));
    const { motor, modelo } = motorFalso({});
    await vuelta(db, motor);
    expect(modelo.llamadas[0].clave).toBe('A/kids-leer');
    expect(archivos.has(real('frenado.json'))).toBe(false);
    expect(archivos.has(kids('listo.json'))).toBe(true);
    expect(tablas.pedidos[0].estado).toBe('pagado');
    expect(aSocios()).toHaveLength(0);
  });

  it('sin terminar de contar (sin termino_at, o el narrador no está completado) no pasa nada', async () => {
    for (const o of [{ termino: false }, { estado: 'activo' }]) {
      const { db, archivos } = baseFalsa(tablasDeBenja({ ...o, pedido: true }));
      const { motor, modelo } = motorFalso();
      await vuelta(db, motor);
      expect(modelo.llamadas).toHaveLength(0);
      expect(archivos.size).toBe(0);
    }
  });

  it('un chico sin aprobar no va a la imprenta', async () => {
    const { db, archivos, tablas } = baseFalsa({ ...tablasDeBenja(), entregas: [{ id: 'e1', narrador_id: ID, pedido_id: null, estado: 'lista' }] });
    archivos.set(kids('listo.json'), '{}');
    await mandarEntregasAImprenta(db);
    expect(tablas.entregas[0].estado).toBe('lista');
    expect(archivos.has(paquete('libro-imprenta.pdf'))).toBe(false);
  });

  it('sin la tabla kids_v2 no hace nada ni tira', async () => {
    const db = { from: () => ({ select: async () => ({ data: null, error: { code: '42P01', message: 'relation "kids_v2" does not exist' } }) }) };
    await expect(revisarLibrosKids(db as never)).resolves.toBeUndefined();
  });
});

describe('dos copias de la fábrica a la vez', () => {
  type Modulo = typeof import('../../src/escritor-kids/produccion/libro-kids.js');
  /** Dos copias del módulo (cada una con su proceso y su cola), como dos workers prendidos en un deploy. */
  async function dosCopias(): Promise<[Modulo, Modulo]> {
    vi.resetModules();
    const uno = await import('../../src/escritor-kids/produccion/libro-kids.js');
    vi.resetModules();
    const otro = await import('../../src/escritor-kids/produccion/libro-kids.js');
    return [uno, otro];
  }
  async function tickJuntas(db: unknown, copias: [Modulo, Modulo], motores: [MotorKids, MotorKids]): Promise<void> {
    await Promise.all(copias.map((c, i) => c.revisarLibrosKids(db as never, { motor: motores[i] })));
    await Promise.all(copias.map((c) => c.colaKids.esperarTodo()));
  }

  it('en el mismo tick, la Etapa A la lanza una sola', async () => {
    const copias = await dosCopias();
    expect(copias[0]).not.toBe(copias[1]);
    const { db, archivos } = baseFalsa(tablasDeBenja());
    const [a, b] = [motorFalso({}), motorFalso({})];
    await tickJuntas(db, copias, [a.motor, b.motor]);
    expect([...a.modelo.llamadas, ...b.modelo.llamadas].map((p) => p.clave)).toEqual(['A/kids-leer']);
    expect(archivos.has(kids('trabajando.json'))).toBe(false); // al terminar se suelta
  });

  it('en el mismo tick, el libro lo escribe una sola', async () => {
    const copias = await dosCopias();
    const { db, archivos } = baseFalsa(tablasDeBenja({ pedido: true }));
    const [a, b] = [motorFalso({}), motorFalso({})];
    await tickJuntas(db, copias, [a.motor, b.motor]);
    const claves = [...a.modelo.llamadas, ...b.modelo.llamadas].map((p) => p.clave);
    expect(claves.filter((k) => k === 'A/kids-leer')).toHaveLength(1);
    expect(claves.filter((k) => k === 'B/kids-parte-1')).toHaveLength(1);
    expect(a.modelo.llamadas.length === 0 || b.modelo.llamadas.length === 0).toBe(true);
    expect(archivos.has(kids('listo.json'))).toBe(true);
    // Y en el tick siguiente ninguna hace nada: ya está listo.json.
    await tickJuntas(db, copias, [a.motor, b.motor]);
    expect(a.modelo.llamadas.length + b.modelo.llamadas.length).toBe(claves.length);
  });

  it('una marca fresca de otra copia frena; una vieja (copia muerta) se toma', async () => {
    const { db, archivos } = baseFalsa(tablasDeBenja());
    const { motor, modelo } = motorFalso({});
    archivos.set(kids('trabajando.json'), JSON.stringify({ proceso: 'otra', que: 'etapa A', latido: new Date().toISOString() }));
    await vuelta(db, motor);
    expect(modelo.llamadas).toHaveLength(0);
    archivos.set(kids('trabajando.json'), JSON.stringify({ proceso: 'otra', que: 'etapa A', latido: new Date(Date.now() - 11 * 60_000).toISOString() }));
    await vuelta(db, motor);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/kids-leer']);
  });
});

describe('aprobado sin listo.json', () => {
  it('no se reescribe el libro: un aviso a los socios, una vez, y nada más', async () => {
    const t = tablasDeBenja({ pedido: true });
    t.narradores[0].libro_aprobado_at = '2026-10-10T10:00:00.000Z';
    const { db, archivos } = baseFalsa(t);
    const { motor, modelo } = motorFalso({});
    await vuelta(db, motor);
    await vuelta(db, motor);
    expect(modelo.llamadas).toHaveLength(0);
    expect(t.pedidos[0].estado).toBe('pagado');
    expect(aSocios()).toHaveLength(1);
    expect(aSocios()[0].subject).toContain('está aprobado pero falta listo.json');
    expect([...archivos.keys()]).toEqual([kids('aviso-aprobado-sin-listo.txt')]);
  });
});

describe('el interruptor ESCRITOR_KIDS', () => {
  const OTRO = '3f6a2c1e-8b4d-4c7a-9e21-6d5b0a7c4e19';
  /** Benja y otro chico, los dos terminados y con el pedido pagado. */
  const dosChicos = () => {
    const t = tablasDeBenja({ pedido: true });
    t.kids_v2.push({ ...t.kids_v2[0], narrador_id: OTRO });
    t.narradores.push({ ...t.narradores[0], id: OTRO, como_le_dicen: 'Tomi' });
    t.pedidos.push({ id: 'p9', narrador_id: OTRO, estado: 'pagado' });
    return baseFalsa(t);
  };

  it('apagado (sin la variable o con otro valor): ningún modelo, nada subido; un aviso a socios por chico, una vez', async () => {
    for (const valor of [undefined, '0', 'si']) {
      olvidarAvisosApagado();
      mails = [];
      if (valor === undefined) vi.stubEnv('ESCRITOR_KIDS', undefined as unknown as string); else vi.stubEnv('ESCRITOR_KIDS', valor);
      const { db, archivos, tablas } = dosChicos();
      const { motor, modelo } = motorFalso({});
      await vuelta(db, motor);
      await vuelta(db, motor);
      expect(modelo.llamadas).toHaveLength(0);
      expect(archivos.size).toBe(0);
      expect(tablas.pedidos.map((p) => p.estado)).toEqual(['pagado', 'pagado']);
      expect(aSocios().map((m) => m.subject)).toEqual([
        '[Vitácora escritor] Un chico terminó de contar y el escritor de Kids está apagado: Benja',
        '[Vitácora escritor] Un chico terminó de contar y el escritor de Kids está apagado: Tomi',
      ]);
    }
  });

  it('solo:<id> corre solo para ese chico', async () => {
    vi.stubEnv('ESCRITOR_KIDS', `solo:${ID}`);
    const { db, archivos } = dosChicos();
    const { motor } = motorFalso({});
    await vuelta(db, motor);
    expect(archivos.has(kids('listo.json'))).toBe(true);
    expect([...archivos.keys()].some((k) => k.startsWith(OTRO))).toBe(false);
    expect(aSocios().map((m) => m.subject)).toEqual(['[Vitácora escritor] Un chico terminó de contar y el escritor de Kids está apagado: Tomi']);
  });

  it('1 corre para todos', async () => {
    vi.stubEnv('ESCRITOR_KIDS', '1');
    const { db, archivos } = dosChicos();
    const { motor } = motorFalso({});
    await vuelta(db, motor);
    expect(archivos.has(kids('listo.json'))).toBe(true);
    expect(archivos.has(`${OTRO}/escritor-kids/listo.json`)).toBe(true);
    expect(aSocios()).toHaveLength(0);
  });
});

describe('piezas del libro de Kids en producción', () => {
  it('consumo_ia con pasos escritor-kids-A/B/C', async () => {
    const { db, tablas } = baseFalsa({ consumo_ia: [] });
    for (const clave of ['A/kids-leer', 'B/kids-parte-1', 'C/kids-veedor-2'])
      await anotarUsoEscritorKids(db, ID, { clave, modelo: 'claude-opus-5-5', input: 10, output: 5, cache_write: 0, cache_read: 0, usd: 0.01 });
    expect(tablas.consumo_ia.map((f) => f.paso)).toEqual(['escritor-kids-A', 'escritor-kids-B', 'escritor-kids-C']);
  });

  it('el tope por trabajo: ESCRITOR_KIDS_TOPE_USD, 8 por defecto', () => {
    expect(topeKids()).toBe(8);
    vi.stubEnv('ESCRITOR_KIDS_TOPE_USD', '5');
    expect(topeKids()).toBe(5);
    vi.stubEnv('ESCRITOR_KIDS_TOPE_USD', 'no');
    expect(topeKids()).toBe(8);
  });

  it('cuenta las páginas de un PDF', () => {
    expect(contarPaginas(Buffer.from('/Type /Catalog /Type /Pages /Type /Page /Type/Page /Type /Page'))).toBe(3);
  });

  it('los mails al padre: en vos, sin dos puntos', () => {
    for (const t of Object.values(TEXTOS_MAIL_KIDS)) {
      const todo = [t.asunto('Benja'), ...t.parrafos('Benja'), t.boton].join(' ');
      expect(todo).not.toContain(':');
      expect(todo).not.toMatch(/\b(entra|revisa|apruébalo|puedes|tienes)\b/i);
    }
  });

  it('los mails al padre: los textos que aprobó Naza (16/10, tanda 4), literales', () => {
    const { revisar, libro_listo } = TEXTOS_MAIL_KIDS;
    expect(revisar.asunto('Benja')).toBe('El libro de Benja está para que lo revises');
    expect(revisar.parrafos('Benja')).toEqual(['Ya escribimos el libro de Benja con lo que contó. Entrá a tu panel y leelo.', 'Si está bien, aprobalo desde ahí.']);
    expect(revisar.parrafos('Benja').join(' ')).not.toContain('no se imprime');
    expect(revisar.boton).toBe('Ver el libro');
    expect(libro_listo.asunto('Benja')).toBe('El libro de Benja está listo');
    expect(libro_listo.parrafos('Benja')).toEqual([
      'Ya está. El libro de Benja, con sus palabras y con sus audios para escuchar desde los códigos del libro.',
      'Queda en tu panel para leerlo o descargarlo cuando quieras.',
    ]);
    expect(libro_listo.boton).toBe('Ver el libro');
  });

  it('los mails al padre de España: los textos que aprobó Naza (16/10, tanda 8), en tú, literales', () => {
    const { revisar, libro_listo } = textosMailKids('es-ES');
    expect(revisar.asunto('Benja')).toBe('El libro de Benja ya se puede leer. Revísalo antes de aprobarlo');
    expect(revisar.parrafos('Benja')).toEqual(['Ya hemos escrito el libro de Benja con lo que contó. Entra en tu panel y léelo.', 'Si está bien, apruébalo desde ahí.']);
    expect(revisar.boton).toBe('Ver el libro');
    expect(libro_listo.asunto('Benja')).toBe('El libro de Benja está listo');
    expect(libro_listo.parrafos('Benja')).toEqual([
      'Ya está. El libro de Benja, con sus palabras y con sus audios para escuchar desde los códigos del libro.',
      'Se queda en tu panel para leerlo o descargarlo cuando quieras.',
    ]);
    expect(libro_listo.boton).toBe('Ver el libro');
    for (const t of Object.values(textosMailKids('es-ES'))) {
      const todo = [t.asunto('Benja'), ...t.parrafos('Benja'), t.boton].join(' ');
      expect(todo).not.toContain(':');
      expect(todo).not.toMatch(/(entrá|leelo|aprobalo|podés|tenés|escribimos)/i);
    }
    expect(textosMailKids('es-AR')).toBe(TEXTOS_MAIL_KIDS);
    expect(textosMailKids()).toBe(TEXTOS_MAIL_KIDS);
    expect(cuerpoMailKids('revisar', { apodo: 'Benja', enlace: 'https://x.test', idioma: 'es-ES' })).toContain('Entra en tu panel y léelo.');
    expect(cuerpoMailKids('revisar', { apodo: 'Benja', enlace: 'https://x.test' })).toContain('Entrá a tu panel y leelo.');
  });

  it('un chico de España: los dos mails al padre salen en tú (ficha.idioma, si no kids_v2.idioma)', async () => {
    for (const fila of [{ ficha: { idioma: 'es-ES' } }, { idioma: 'es-ES', ficha: {} }]) {
      mails = [];
      const t = tablasDeBenja({ pedido: true });
      t.kids_v2[0] = { ...t.kids_v2[0], ...(fila.idioma ? { idioma: fila.idioma } : {}), ficha: { ...(t.kids_v2[0].ficha as Fila), ...fila.ficha } };
      const { db, archivos, tablas } = baseFalsa(t);
      archivos.set(kids('listo.json'), JSON.stringify({ at: new Date().toISOString(), paginas: 2, sobrePaginas: 2 }));
      const { motor } = motorFalso();
      await vuelta(db, motor);
      expect(alPadre().map((m) => m.subject)).toEqual(['El libro de Benja ya se puede leer. Revísalo antes de aprobarlo']);
      expect(alPadre()[0].html).toContain('Entra en tu panel y léelo.');
      tablas.narradores[0].libro_aprobado_at = new Date().toISOString();
      await vuelta(db, motor);
      expect(alPadre()[1].subject).toBe('El libro de Benja está listo');
      expect(alPadre()[1].html).toContain('Se queda en tu panel');
    }
  });

  it('los mails al padre en catalán: los textos aprobados (16/10, tanda 10), literales, sin dos puntos y con su pie', () => {
    expect(faltanTextosKids('es-AR')).toEqual([]);
    expect(faltanTextosKids('es-ES')).toEqual([]);
    expect(faltanTextosKids('ca')).toEqual([]);
    const { revisar, libro_listo } = textosMailKids('ca');
    expect(revisar.asunto('Jana')).toBe("El llibre de Jana ja es pot llegir. Revisa'l abans d'aprovar-lo");
    expect(revisar.parrafos('Jana')).toEqual(['Ja hem escrit el llibre de Jana amb el que ha explicat. Entra al teu panell i llegeix-lo.', "Si està bé, aprova'l des d'allà."]);
    expect(revisar.boton).toBe('Veure el llibre');
    expect(libro_listo.asunto('Jana')).toBe('El llibre de Jana està llest');
    expect(libro_listo.parrafos('Jana')).toEqual([
      'Ja està. El llibre de Jana, amb les seves paraules i amb els seus àudios per escoltar des dels codis del llibre.',
      'Es queda al teu panell per llegir-lo o descarregar-lo quan vulguis.',
    ]);
    for (const t of Object.values(textosMailKids('ca'))) expect([t.asunto('Jana'), ...t.parrafos('Jana'), t.boton].join(' ')).not.toContain(':');
    const html = cuerpoMailKids('revisar', { apodo: 'Jana', enlace: 'https://x.test', idioma: 'ca' });
    expect(html).toContain('<html lang="ca">');
    expect(html).toContain('A cada família hi ha un llibre per escriure.');
    expect(html).not.toContain('En cada familia');
    expect(cuerpoMailKids('revisar', { apodo: 'Jana', enlace: 'https://x.test' })).toContain('En cada familia hay un libro sin escribir.');
  });

  it('un chico en catalán: los dos mails al padre salen en catalán (ficha.idioma, si no kids_v2.idioma)', async () => {
    for (const fila of [{ ficha: { idioma: 'ca' } }, { idioma: 'ca', ficha: {} }]) {
      mails = [];
      const t = tablasDeBenja({ pedido: true });
      t.kids_v2[0] = { ...t.kids_v2[0], ...(fila.idioma ? { idioma: fila.idioma } : {}), ficha: { ...(t.kids_v2[0].ficha as Fila), ...fila.ficha } };
      const { db, archivos, tablas } = baseFalsa(t);
      archivos.set(kids('listo.json'), JSON.stringify({ at: new Date().toISOString(), paginas: 2, sobrePaginas: 2 }));
      const { motor } = motorFalso();
      await vuelta(db, motor);
      expect(alPadre().map((m) => m.subject)).toEqual(["El llibre de Benja ja es pot llegir. Revisa'l abans d'aprovar-lo"]);
      expect(alPadre()[0].html).toContain('Entra al teu panell i llegeix-lo.');
      expect(archivos.has(kids('aviso-sin-textos-del-idioma.txt'))).toBe(false);
      tablas.narradores[0].libro_aprobado_at = new Date().toISOString();
      await vuelta(db, motor);
      expect(alPadre()[1].subject).toBe('El llibre de Benja està llest');
      expect(alPadre()[1].html).toContain('Es queda al teu panell');
    }
  });
});
