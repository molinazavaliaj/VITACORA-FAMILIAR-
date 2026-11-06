import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearBaseFalsa } from './v3/base-falsa.js';
import { atenderRevisiones, contestarSiEscribeConDudas, dudasAQuienConto, olvidarRevisiones, queMandar, type DepsRevision, type Situacion } from '../src/flujo/revision-narrador.js';
import { TEXTOS_REVISION } from '../src/flujo/revision-narrador-textos.js';

// El aviso de dudas a quien contó y su recordatorio (plan 2026-11-06-dudas-narrador-sobre-212). El link para sacar
// respuestas lo manda el mensaje final (src/v3/enviar.ts y src/historia/enviar.ts), no este módulo.

const AHORA = new Date('2026-11-10T15:00:00Z'); // 12 en Buenos Aires, 16 en Madrid
const horasAntes = (h: number) => new Date(AHORA.getTime() - h * 3600_000).toISOString();
const JWT = /[\w-]+\.[\w-]+\.[\w-]+/;

/** Para quién firma el token y de qué tipo es. */
const delToken = (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as { narradorId: string; tipo: string };

describe('queMandar', () => {
  const base: Situacion = { hayEtapaA: true, libroEscrito: false, cantidadDudas: 2, todasContestadas: false, dudasAvisadasAt: null, recordada: false };
  const con = (s: Partial<Situacion>) => queMandar({ ...base, ...s }, AHORA);

  it('sin Etapa A: nada, aunque haya un archivo de dudas', () => {
    expect(con({ hayEtapaA: false })).toBeNull();
  });

  it('con Etapa A y sin dudas: nada', () => {
    expect(con({ cantidadDudas: 0 })).toBeNull();
  });

  it('con dudas sin avisar: las dudas', () => {
    expect(con({})).toBe('dudas');
  });

  it('una fecha rota de aviso cuenta como no avisado, igual que en la fábrica', () => {
    expect(con({ dudasAvisadasAt: 'cualquier cosa' })).toBe('dudas');
    expect(con({ dudasAvisadasAt: '' })).toBe('dudas');
  });

  it('el recordatorio sale pasadas las 48 horas y una sola vez', () => {
    expect(con({ dudasAvisadasAt: horasAntes(47) })).toBeNull();
    expect(con({ dudasAvisadasAt: horasAntes(49) })).toBe('recordatorio');
    expect(con({ dudasAvisadasAt: horasAntes(49), recordada: true })).toBeNull();
  });

  it('vencidas las 72 horas del aviso ya no se recuerda: la fábrica sigue sin esperar', () => {
    expect(con({ dudasAvisadasAt: horasAntes(71) })).toBe('recordatorio');
    expect(con({ dudasAvisadasAt: horasAntes(72) })).toBeNull();
    expect(con({ dudasAvisadasAt: horasAntes(100) })).toBeNull();
  });

  it('todas contestadas: nada, ni aviso ni recordatorio', () => {
    expect(con({ todasContestadas: true })).toBeNull();
    expect(con({ todasContestadas: true, dudasAvisadasAt: horasAntes(49) })).toBeNull();
  });

  it('libro escrito: nada, siempre', () => {
    expect(con({ libroEscrito: true })).toBeNull();
    expect(con({ libroEscrito: true, dudasAvisadasAt: horasAntes(49) })).toBeNull();
  });
});

type Fila = Record<string, unknown>;

function narrador(id: string, extra: Fila = {}): Fila {
  return { id, estado: 'completado', telefono_whatsapp: '5491112345678', zona_horaria: 'America/Argentina/Buenos_Aires', como_le_dicen: 'abuelo', contexto: { vinculoComprador: 'hija', acceso: { elige: true } }, ...extra };
}

const DUDAS = JSON.stringify({ dudas: [{ id: 'D1', pregunta: '¿Cómo se llamaba?' }, { id: 'D2', pregunta: '¿En qué año?' }] });
const abierta = (narrador_id = 'n1', idioma = 'es-AR') => ({ narrador_id, idioma, estado: { ultimoEntranteAt: horasAntes(1) } });
const cerrada = (narrador_id = 'n1', idioma = 'es-AR') => ({ narrador_id, idioma, estado: { ultimoEntranteAt: horasAntes(30) } });

function armar(o: {
  narradores?: Fila[]; v3?: Fila[]; historias?: Fila[]; pedidos?: Fila[]; lista?: boolean; metaFalla?: (tel: string) => boolean; sinDudas?: boolean; carpeta?: string;
} = {}) {
  const narradores = o.narradores ?? [narrador('n1')];
  const base = crearBaseFalsa({
    narradores,
    entrevistas_v3: o.v3 ?? [abierta()],
    historias: o.historias ?? [],
    pedidos: o.pedidos ?? [],
    envios: [],
  });
  const textos: { tel: string; texto: string }[] = [];
  const plantillas: { tel: string; nombre: string; vars: string[]; idiomaMeta: string; botonUrl: string }[] = [];
  const socios: { clave: string; asunto: string; detalle: string; unaVez?: boolean }[] = [];
  const tiempos: (number | undefined)[] = [];
  const deps: DepsRevision = {
    db: base.cliente,
    enviarTexto: async (tel, texto, op) => {
      tiempos.push(op.timeoutMs);
      if (o.metaFalla?.(tel)) throw new Error('WhatsApp rechazó el envío');
      textos.push({ tel, texto });
      return 'wamid.T';
    },
    enviarPlantilla: async (tel, nombre, vars, idiomaMeta, op) => {
      tiempos.push(op.timeoutMs);
      if (o.metaFalla?.(tel)) throw new Error('WhatsApp rechazó el envío');
      plantillas.push({ tel, nombre, vars, idiomaMeta, botonUrl: op.botonUrl });
      return 'wamid.P';
    },
    avisarSocios: async (clave, asunto, detalle, op) => { socios.push({ clave, asunto, detalle, unaVez: op?.unaVez }); return true; },
    plantillaLista: () => o.lista ?? true,
    urlBase: 'https://www.vitacorafamiliar.com',
  };
  const archivo = (id: string, nombre: string, carpeta = 'escritor') => base.archivos.get(`audios/${id}/${carpeta}/${nombre}`);
  const poner = (id: string, nombre: string, contenido: string, carpeta = 'escritor') => base.archivos.set(`audios/${id}/${carpeta}/${nombre}`, contenido);
  // Por defecto, todos con Etapa A y dudas sin contestar.
  if (!o.sinDudas) {
    for (const n of narradores) {
      poner(n.id as string, 'carpeta-A.json', '{}', o.carpeta);
      poner(n.id as string, 'dudas-familia.json', DUDAS, o.carpeta);
    }
  }
  return { base, deps, textos, plantillas, socios, tiempos, archivo, poner };
}

describe('atenderRevisiones', () => {
  beforeEach(() => {
    olvidarRevisiones();
    vi.stubEnv('FIRMA_TOKENS', 'secreto-de-prueba');
    vi.stubEnv('ESCRITOR_HISTORIA', '1');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe.each([
    ['sin la marca', { vinculoComprador: 'hija' }],
    ['con «Mi familia»', { vinculoComprador: 'hija', acceso: { elige: true, quien: 'familia' } }],
  ])('un regalo %s no recibe ningún WhatsApp de dudas', (_regalo, REGALO) => {
    it.each([['con la ventana abierta', abierta()], ['con la ventana cerrada', cerrada()]])('%s, en V3: ni texto, ni plantilla, ni marca', async (_caso, fila) => {
      const a = armar({ narradores: [narrador('n1', { contexto: REGALO })], v3: [fila] });
      await atenderRevisiones(a.deps, AHORA);
      expect(a.textos).toEqual([]);
      expect(a.plantillas).toEqual([]);
      expect(a.socios).toEqual([]);
      expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();
    });

    it('en una historia, tampoco', async () => {
      const a = armar({ narradores: [narrador('n1', { contexto: { ...REGALO, modo: 'historia' } })], v3: [], historias: [abierta()], carpeta: 'escritor-historia' });
      await atenderRevisiones(a.deps, AHORA);
      expect(a.textos).toEqual([]);
      expect(a.archivo('n1', 'dudas-narrador-avisadas.txt', 'escritor-historia')).toBeUndefined();
    });

    it('escribiendo con dudas pendientes, tampoco: las contesta la familia en el panel', async () => {
      const n = narrador('n1', { contexto: REGALO }) as Parameters<typeof contestarSiEscribeConDudas>[1];
      const a = armar({ narradores: [n] });
      expect(await contestarSiEscribeConDudas(a.deps, n, AHORA)).toBe(false);
      expect(a.textos).toEqual([]);
    });

    it('se decide por narrador: el privado recibe, el otro no', async () => {
      const a = armar({
        narradores: [narrador('n1'), narrador('n2', { contexto: REGALO, telefono_whatsapp: '5491199999999' })],
        v3: [abierta('n1'), abierta('n2')],
      });
      await atenderRevisiones(a.deps, AHORA);
      expect(a.textos.map((t) => t.tel)).toEqual(['5491112345678']);
      expect(a.archivo('n2', 'dudas-narrador-avisadas.txt')).toBeUndefined();
    });

  });

  it('«para mí» y «Prefiero yo» lo reciben', async () => {
    for (const contexto of [{ vinculoComprador: 'yo mismo' }, { vinculoComprador: 'hija', acceso: { elige: true, quien: 'narrador' } }]) {
      olvidarRevisiones();
      const a = armar({ narradores: [narrador('n1', { contexto })] });
      await atenderRevisiones(a.deps, AHORA);
      expect(a.textos).toHaveLength(1);
    }
  });

  it('a quién van: Viaje y Kids nunca, aunque sean «para mí»', () => {
    expect(dudasAQuienConto({ vinculoComprador: 'yo mismo' })).toBe(true);
    expect(dudasAQuienConto({ modo: 'historia', vinculoComprador: 'yo mismo' })).toBe(true);
    for (const modo of ['viaje', 'kids']) {
      expect(dudasAQuienConto({ modo, vinculoComprador: 'yo mismo' })).toBe(false);
      expect(dudasAQuienConto({ modo, acceso: { elige: true } })).toBe(false);
    }
  });

  it('fuera de 9 a 21 en su zona no manda ni marca', async () => {
    const a = armar();
    await atenderRevisiones(a.deps, new Date('2026-11-10T03:00:00Z')); // las 0 en Buenos Aires
    await atenderRevisiones(a.deps, new Date('2026-11-11T00:00:00Z')); // las 21
    expect(a.textos).toEqual([]);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();
    await atenderRevisiones(a.deps, new Date('2026-11-10T12:00:00Z')); // las 9
    expect(a.textos).toHaveLength(1);
  });

  it('con una zona que no vale usa la de su idioma', async () => {
    const TARDE = new Date('2026-11-10T23:30:00Z'); // 20:30 en Buenos Aires, 0:30 en Madrid
    const fila = (idioma: string) => [{ narrador_id: 'n1', idioma, estado: { ultimoEntranteAt: new Date(TARDE.getTime() - 3600_000).toISOString() } }];
    for (const zona_horaria of ['Marte/Olympus', '', null]) {
      const ar = armar({ narradores: [narrador('n1', { zona_horaria })], v3: fila('es-AR') });
      await atenderRevisiones(ar.deps, TARDE);
      expect(ar.textos).toHaveLength(1);
      const es = armar({ narradores: [narrador('n1', { zona_horaria })], v3: fila('es-ES') });
      await atenderRevisiones(es.deps, TARDE);
      expect(es.textos).toEqual([]);
      const ca = armar({ narradores: [narrador('n1', { zona_horaria })], v3: fila('ca') });
      await atenderRevisiones(ca.deps, TARDE);
      expect(ca.textos).toEqual([]);
    }
  });

  it('ventana abierta: texto con el link de /mi-historia al final, marca y fila en envios; el tick siguiente no repite', async () => {
    const a = armar();
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);
    const { tel, texto } = a.textos[0];
    expect(tel).toBe('5491112345678');
    expect(texto.startsWith(TEXTOS_REVISION['es-AR'].dudas)).toBe(true);
    const link = texto.match(/ https:\/\/www\.vitacorafamiliar\.com\/mi-historia\/(\S+)$/);
    expect(link).not.toBeNull();
    expect(delToken(link![1])).toMatchObject({ narradorId: 'n1', tipo: 'respuestas' });
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBe(AHORA.toISOString());
    expect(a.plantillas).toEqual([]);
    expect(a.base.tablas.envios).toMatchObject([{ narrador_id: 'n1', tipo: 'dudas_narrador', pregunta_orden: null, wa_message_id: 'wamid.T' }]);
    expect(a.tiempos).toEqual([20_000]);
    expect(a.archivo('n1', 'aviso-en-curso.txt')).toBeUndefined();

    await atenderRevisiones(a.deps, new Date(AHORA.getTime() + 15 * 60_000));
    expect(a.textos).toHaveLength(1);
  });

  it('ventana cerrada con plantilla lista: plantilla con su nombre, el token en el botón y fila en envios', async () => {
    const a = armar({ v3: [cerrada()] });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
    expect(a.plantillas).toHaveLength(1);
    const p = a.plantillas[0];
    expect(p).toMatchObject({ nombre: 'dudas_narrador_vos', idiomaMeta: 'es', vars: ['abuelo'] });
    expect(delToken(p.botonUrl)).toMatchObject({ narradorId: 'n1', tipo: 'respuestas' });
    expect(a.tiempos).toEqual([20_000]);
    expect(a.base.tablas.envios).toMatchObject([{ narrador_id: 'n1', tipo: 'dudas_narrador', pregunta_orden: null, wa_message_id: 'wamid.P' }]);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBe(AHORA.toISOString());
  });

  it('sin ultimoEntranteAt la ventana cuenta como cerrada', async () => {
    const a = armar({ v3: [{ narrador_id: 'n1', idioma: 'es-AR', estado: {} }] });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.plantillas).toHaveLength(1);
  });

  it('el idioma de la fila elige texto y plantilla', async () => {
    const a = armar({
      narradores: [narrador('n1'), narrador('n2', { telefono_whatsapp: '34600000000' }), narrador('n3', { telefono_whatsapp: '34600000001' })],
      v3: [cerrada('n1', 'ca'), abierta('n2', 'es-ES'), cerrada('n3', 'es-ES')],
    });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.plantillas[0]).toMatchObject({ nombre: 'dudas_narrador_ca', idiomaMeta: 'ca' });
    expect(a.plantillas[1]).toMatchObject({ nombre: 'dudas_narrador_es_es', idiomaMeta: 'es_ES' });
    expect(a.textos[0].texto.startsWith(TEXTOS_REVISION['es-ES'].dudas)).toBe(true);
  });

  it('ventana cerrada sin plantilla: no sale nada, avisa a los socios, sin marca, sin teléfono ni token', async () => {
    const a = armar({ v3: [cerrada()], lista: false });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.plantillas).toEqual([]);
    expect(a.textos).toEqual([]);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();
    expect(a.socios).toHaveLength(1);
    expect(a.socios[0].detalle).toContain('es-AR:dudas_narrador');
    expect(`${a.socios[0].asunto}${a.socios[0].detalle}`).not.toContain('5491112345678');
    expect(a.socios[0].detalle).not.toMatch(JWT);
  });

  it('un error de Meta no marca, no frena a los demás y no deja el teléfono entero en el log', async () => {
    const error = vi.spyOn(console, 'error');
    const a = armar({
      narradores: [narrador('n1'), narrador('n2', { telefono_whatsapp: '34600000000' })],
      v3: [abierta('n1'), abierta('n2')],
      metaFalla: (tel) => tel === '5491112345678',
    });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();
    expect(a.archivo('n2', 'dudas-narrador-avisadas.txt')).toBe(AHORA.toISOString());
    expect(a.textos.map((t) => t.tel)).toEqual(['34600000000']);
    expect(a.socios.map((s) => s.clave.includes('n1'))).toEqual([true]);
    expect(JSON.stringify(error.mock.calls)).not.toContain('5491112345678');
    expect(JSON.stringify(error.mock.calls)).toContain('549***5678');
  });

  it('salió pero no se pudo anotar la marca: no vuelve a mandar, reintenta la marca', async () => {
    const a = armar();
    const storage = a.base.cliente.storage;
    let roto = true;
    const original = storage.from.bind(storage);
    vi.spyOn(storage, 'from').mockImplementation((bucket: string) => {
      const b = original(bucket);
      return { ...b, upload: async (...args: Parameters<typeof b.upload>) => (roto && args[0].endsWith('dudas-narrador-avisadas.txt') ? { data: null, error: { message: 'caído' } } : b.upload(...args)) } as unknown as typeof b;
    });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();

    await atenderRevisiones(a.deps, new Date(AHORA.getTime() + 15 * 60_000));
    expect(a.textos).toHaveLength(1);

    roto = false;
    await atenderRevisiones(a.deps, new Date(AHORA.getTime() + 30 * 60_000));
    expect(a.textos).toHaveLength(1);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBe(AHORA.toISOString());
    expect(a.archivo('n1', 'aviso-en-curso.txt')).toBeUndefined();
  });

  it('un narrador con libro.md no se vuelve a revisar en ese proceso', async () => {
    const a = armar();
    a.poner('n1', 'libro.md', '# libro');
    const from = vi.spyOn(a.base.cliente.storage, 'from');
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
    expect(from).toHaveBeenCalled();
    from.mockClear();
    await atenderRevisiones(a.deps, new Date(AHORA.getTime() + 15 * 60_000));
    expect(from).not.toHaveBeenCalled();
  });

  it('ventana cerrada y sin nombre: no manda plantilla, avisa una sola vez con el id; con la ventana abierta sale igual', async () => {
    const sinNombre = narrador('n1', { como_le_dicen: '  ' });
    const a = armar({ narradores: [sinNombre], v3: [cerrada()] });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.plantillas).toEqual([]);
    expect(a.socios).toHaveLength(1);
    expect(a.socios[0].unaVez).toBe(true);
    expect(a.socios[0].asunto).toContain('n1');
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();

    const b = armar({ narradores: [sinNombre] });
    await atenderRevisiones(b.deps, AHORA);
    expect(b.textos).toHaveLength(1);
  });

  it('dos llamadas a la vez y dos seguidas sobre la misma base mandan un solo mensaje', async () => {
    const a = armar();
    const enviar = a.deps.enviarTexto;
    a.deps.enviarTexto = async (tel, texto, op) => {
      await new Promise((r) => setTimeout(r, 5));
      return enviar(tel, texto, op);
    };
    await Promise.all([atenderRevisiones(a.deps, AHORA), atenderRevisiones(a.deps, AHORA)]);
    expect(a.textos).toHaveLength(1);
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);
  });

  it('quien llega tarde a la toma vuelve a mirar: si ya salió, no manda', async () => {
    const a = armar();
    const storage = a.base.cliente.storage;
    const original = storage.from.bind(storage);
    let primera = true;
    vi.spyOn(storage, 'from').mockImplementation((bucket: string) => {
      const b = original(bucket);
      return {
        ...b,
        list: async (...args: Parameters<typeof b.list>) => {
          const r = await b.list(...args);
          // El otro proceso termina entre que este listó y este toma.
          if (primera) { primera = false; a.poner('n1', 'dudas-narrador-avisadas.txt', AHORA.toISOString()); }
          return r;
        },
      } as unknown as typeof b;
    });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
    expect(a.archivo('n1', 'aviso-en-curso.txt')).toBeUndefined();
  });

  it('la toma no es una marca: si Meta falla se borra, no hay marca falsa y el tick siguiente reintenta', async () => {
    let falla = true;
    const a = armar({ metaFalla: () => falla });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.archivo('n1', 'aviso-en-curso.txt')).toBeUndefined();
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();
    falla = false;
    await atenderRevisiones(a.deps, new Date(AHORA.getTime() + 15 * 60_000));
    expect(a.textos).toHaveLength(1);
  });

  it('una toma reciente frena; una de hace más de media hora es de un proceso que murió', async () => {
    const a = armar();
    a.poner('n1', 'aviso-en-curso.txt', horasAntes(0.25));
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
    a.poner('n1', 'aviso-en-curso.txt', horasAntes(1));
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);
    expect(a.archivo('n1', 'aviso-en-curso.txt')).toBeUndefined();
  });

  it.each(['entregado', 'generando', 'esperando_voz', 'fallido'])('con un pedido %s no le llega', async (estado) => {
    const a = armar({ pedidos: [{ narrador_id: 'n1', estado }] });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
  });

  it('con un pedido pagado sí le llega', async () => {
    const a = armar({ pedidos: [{ narrador_id: 'n1', estado: 'pagado' }] });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);
  });

  it('un fallo-A.json viejo no apaga el aviso: lo que cuenta es carpeta-A.json', async () => {
    const a = armar();
    a.poner('n1', 'fallo-A.json', '{}');
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);
  });

  it('con fallo-A.json y sin carpeta-A.json no le llega', async () => {
    const a = armar({ sinDudas: true });
    a.poner('n1', 'fallo-A.json', '{}');
    a.poner('n1', 'dudas-familia.json', DUDAS);
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
  });

  describe('escribe por WhatsApp teniendo dudas pendientes', () => {
    const REGALO = { contexto: { vinculoComprador: 'hija', acceso: { elige: true } } };
    const uno = (extra: Fila = REGALO) => narrador('n1', extra) as Parameters<typeof contestarSiEscribeConDudas>[1];

    it.each([
      ['es-AR', 'Gracias. Para que lo que nos digas entre en el libro, contestá las preguntas desde este enlace, escribiendo o dictando con el micrófono del teclado. '],
      ['es-ES', 'Gracias. Para que lo que nos digas entre en el libro, contesta las preguntas desde este enlace, escribiendo o dictando con el micrófono del teclado. '],
      ['ca', "Gràcies. Perquè el que ens diguis entri al llibre, contesta les preguntes des d'aquest enllaç, escrivint o dictant amb el micròfon del teclat. "],
    ])('en %s, el link con su texto, y los socios se enteran', async (idioma, inicio) => {
      const a = armar({ narradores: [uno()], v3: [abierta('n1', idioma)] });
      expect(await contestarSiEscribeConDudas(a.deps, uno(), AHORA)).toBe(true);
      expect(a.textos).toHaveLength(1);
      expect(a.textos[0].texto.startsWith(`${inicio}https://www.vitacorafamiliar.com/mi-historia/`)).toBe(true);
      expect(a.textos[0].texto).not.toContain('{link}');
      expect(delToken(a.textos[0].texto.split('/mi-historia/')[1])).toMatchObject({ narradorId: 'n1', tipo: 'respuestas' });
      expect(a.socios).toHaveLength(1);
      expect(a.socios[0].clave).toBe('escribio-con-dudas|n1');
      expect(a.socios[0].asunto).toContain('abuelo');
    });

    it('una vez por día; al día siguiente, de nuevo', async () => {
      const a = armar({ narradores: [uno()] });
      await contestarSiEscribeConDudas(a.deps, uno(), AHORA);
      expect(await contestarSiEscribeConDudas(a.deps, uno(), AHORA)).toBe(true);
      expect(a.textos).toHaveLength(1);
      await contestarSiEscribeConDudas(a.deps, uno(), new Date(AHORA.getTime() + 24 * 3600_000));
      expect(a.textos).toHaveLength(2);
    });

    it('en una historia lee su carpeta', async () => {
      const n = uno({ contexto: { modo: 'historia', vinculoComprador: 'hija', acceso: { elige: true } } });
      const a = armar({ narradores: [n], v3: [], historias: [abierta()], carpeta: 'escritor-historia' });
      expect(await contestarSiEscribeConDudas(a.deps, n, AHORA)).toBe(true);
      expect(a.textos).toHaveLength(1);
    });

    it('«para mí» también', async () => {
      const n = uno({ contexto: { vinculoComprador: 'yo mismo' } });
      const a = armar({ narradores: [n] });
      expect(await contestarSiEscribeConDudas(a.deps, n, AHORA)).toBe(true);
    });

    it('si Meta lo rechaza, el próximo mensaje lo reintenta y nada se cae', async () => {
      let falla = true;
      const a = armar({ narradores: [uno()], metaFalla: () => falla });
      expect(await contestarSiEscribeConDudas(a.deps, uno(), AHORA)).toBe(true);
      falla = false;
      await contestarSiEscribeConDudas(a.deps, uno(), AHORA);
      expect(a.textos).toHaveLength(1);
    });

    const nada = (a: ReturnType<typeof armar>) => { expect(a.textos).toEqual([]); expect(a.socios).toEqual([]); };

    it('un regalo que no es privado (sin la marca): nada, sigue como hoy', async () => {
      const n = uno({ contexto: { vinculoComprador: 'hija' } });
      const a = armar({ narradores: [n] });
      expect(await contestarSiEscribeConDudas(a.deps, n, AHORA)).toBe(false);
      nada(a);
    });

    it('sin dudas, todas contestadas, sin Etapa A o con el libro escrito: nada', async () => {
      const sin = armar({ narradores: [uno()], sinDudas: true });
      expect(await contestarSiEscribeConDudas(sin.deps, uno(), AHORA)).toBe(false);
      nada(sin);
      const listas = armar({ narradores: [uno()] });
      listas.poner('n1', 'correcciones.json', JSON.stringify({ correcciones: [{ dudaId: 'D1', texto: 'a' }, { dudaId: 'D2', texto: 'b' }] }));
      expect(await contestarSiEscribeConDudas(listas.deps, uno(), AHORA)).toBe(false);
      nada(listas);
      const escrito = armar({ narradores: [uno()] });
      escrito.poner('n1', 'libro.md', '# L');
      expect(await contestarSiEscribeConDudas(escrito.deps, uno(), AHORA)).toBe(false);
      nada(escrito);
    });

    it('fuera de plazo: a las 72 horas del aviso, o del mail a socios si el aviso nunca salió', async () => {
      const a = armar({ narradores: [uno()] });
      a.poner('n1', 'dudas-narrador-avisadas.txt', horasAntes(72));
      expect(await contestarSiEscribeConDudas(a.deps, uno(), AHORA)).toBe(false);
      nada(a);
      const b = armar({ narradores: [uno()] });
      b.poner('n1', 'dudas-avisadas.txt', horasAntes(72));
      expect(await contestarSiEscribeConDudas(b.deps, uno(), AHORA)).toBe(false);
      nada(b);
      const c = armar({ narradores: [uno()] });
      c.poner('n1', 'dudas-narrador-avisadas.txt', horasAntes(71));
      c.poner('n1', 'dudas-avisadas.txt', horasAntes(100));
      expect(await contestarSiEscribeConDudas(c.deps, uno(), AHORA)).toBe(true);
    });

    it('con el libro en marcha, o todavía contando: nada', async () => {
      const a = armar({ narradores: [uno()], pedidos: [{ narrador_id: 'n1', estado: 'generando' }] });
      expect(await contestarSiEscribeConDudas(a.deps, uno(), AHORA)).toBe(false);
      nada(a);
      const b = armar({ narradores: [uno()] });
      expect(await contestarSiEscribeConDudas(b.deps, uno({ ...REGALO, estado: 'activo' }), AHORA)).toBe(false);
      nada(b);
    });
  });

  it('con la fábrica trabajando hace menos de 10 minutos espera; marca vieja, de cierre o rota, no', async () => {
    const latido = (min: number) => JSON.stringify({ proceso: 'p', que: 'etapa A', latido: new Date(AHORA.getTime() - min * 60_000).toISOString() });
    const a = armar();
    a.poner('n1', 'trabajando.json', latido(5));
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
    for (const marca of [latido(11), JSON.stringify({ latido: new Date(0).toISOString() }), '{ roto']) {
      const b = armar();
      b.poner('n1', 'trabajando.json', marca);
      await atenderRevisiones(b.deps, AHORA);
      expect(b.textos).toHaveLength(1);
    }
  });

  it('la marca de trabajo también vale en una historia', async () => {
    const a = armar({ v3: [], historias: [abierta()], carpeta: 'escritor-historia' });
    a.poner('n1', 'trabajando.json', JSON.stringify({ latido: horasAntes(0.05) }), 'escritor-historia');
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
  });

  it('una historia solo con ESCRITOR_HISTORIA prendido para ella; no cae a la V3', async () => {
    for (const [valor, salen] of [['', 0], ['0', 0], ['solo:otro', 0], ['solo:otro, n1', 1], ['1', 1]] as const) {
      olvidarRevisiones();
      vi.stubEnv('ESCRITOR_HISTORIA', valor);
      const a = armar({ v3: [abierta()], historias: [abierta()], carpeta: 'escritor-historia' });
      a.poner('n1', 'carpeta-A.json', '{}');
      a.poner('n1', 'dudas-familia.json', DUDAS);
      await atenderRevisiones(a.deps, AHORA);
      expect(a.textos).toHaveLength(salen);
      expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();
    }
  });

  it('pregunta en tandas de 100 y solo por narradores de V3 o historia', async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `n${i}`);
    const a = armar({
      narradores: [...ids.map((id) => narrador(id)), narrador('kid')],
      v3: ids.map((id) => abierta(id)),
    });
    const consulta = Object.getPrototypeOf(a.base.cliente.from('narradores'));
    const inn = vi.spyOn(consulta, 'in');
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(250);
    expect(inn).toHaveBeenCalled();
    for (const [, valores] of inn.mock.calls as [string, unknown[]][]) {
      expect(valores.length).toBeLessThanOrEqual(100);
      expect(valores).not.toContain('kid');
    }
  });

  it('lee las tablas enteras aunque pasen del corte de 1000 filas', async () => {
    const otros = Array.from({ length: 1500 }, (_, i) => ({ narrador_id: `a${String(i).padStart(4, '0')}`, idioma: 'es-AR', estado: {} }));
    const a = armar({ narradores: [narrador('z1')], v3: [...otros, abierta('z1')] });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);
  });

  it('sin teléfono se saltea', async () => {
    const a = armar({ narradores: [narrador('n1', { telefono_whatsapp: '' })] });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();
  });

  it('sigue entrevistando, o es de Kids o de Viaje (sin fila en V3 ni en historias): nada', async () => {
    const a = armar({ narradores: [narrador('n1', { estado: 'activo' }), narrador('kid'), narrador('viaje')] });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
    expect(a.base.tablas.envios).toEqual([]);
  });

  it('sin la tabla historias sigue con V3', async () => {
    const a = armar();
    a.base.ausentes.add('historias');
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);
  });

  it('una historia usa su carpeta; si tiene las dos filas, gana la historia', async () => {
    const a = armar({ v3: [abierta()], historias: [abierta('n1', 'ca')], carpeta: 'escritor-historia' });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt', 'escritor-historia')).toBe(AHORA.toISOString());
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBeUndefined();
    expect(a.textos[0].texto.startsWith(TEXTOS_REVISION.ca.dudas)).toBe(true);
  });

  it('sin Etapa A: nada, ni baja las dudas ni las correcciones', async () => {
    const a = armar({ sinDudas: true });
    a.poner('n1', 'dudas-familia.json', DUDAS);
    const original = a.base.cliente.storage.from.bind(a.base.cliente.storage);
    const bajados: string[] = [];
    vi.spyOn(a.base.cliente.storage, 'from').mockImplementation((bucket: string) => {
      const b = original(bucket);
      return { ...b, download: async (p: string) => { bajados.push(p); return b.download(p); } } as unknown as typeof b;
    });
    await atenderRevisiones(a.deps, AHORA);
    expect(bajados).toEqual([]);
    expect(a.textos).toEqual([]);
  });

  it('Etapa A sin dudas: no manda nada', async () => {
    const a = armar();
    a.poner('n1', 'dudas-familia.json', JSON.stringify({ dudas: [] }));
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
  });

  it('un libro «para mí» recibe el aviso igual que un regalo', async () => {
    const a = armar({ narradores: [narrador('n1', { contexto: { vinculoComprador: 'yo mismo' } }), narrador('n2', { contexto: { vinculoComprador: 'hija', acceso: { elige: true } } })], v3: [abierta('n1'), abierta('n2')] });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(2);
  });

  it('la marca vacía (Etapa A rehecha) cuenta como no avisada, y el aviso nuevo vacía el recordatorio viejo', async () => {
    const a = armar();
    a.poner('n1', 'dudas-narrador-avisadas.txt', '');
    a.poner('n1', 'dudas-recordadas.txt', horasAntes(100));
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBe(AHORA.toISOString());
    expect(a.archivo('n1', 'dudas-recordadas.txt')).toBe('');
  });

  it('dudas viejas: con dudas-avisadas.txt de más de 72 horas y sin aviso a quien contó no manda', async () => {
    const con = async (marca: string) => {
      olvidarRevisiones();
      const a = armar();
      a.poner('n1', 'dudas-avisadas.txt', marca);
      await atenderRevisiones(a.deps, AHORA);
      return a.textos.length;
    };
    expect(await con(horasAntes(73))).toBe(0);
    expect(await con(horasAntes(71))).toBe(1);
    expect(await con('')).toBe(1);
    expect(await con('cualquier cosa')).toBe(1);
  });

  it('sin recordatorio previo no crea dudas-recordadas.txt', async () => {
    const a = armar();
    await atenderRevisiones(a.deps, AHORA);
    expect(a.archivo('n1', 'dudas-recordadas.txt')).toBeUndefined();
  });

  it('a las 49 horas el recordatorio, con su marca, sin mover el aviso; después nada', async () => {
    const a = armar();
    a.poner('n1', 'dudas-narrador-avisadas.txt', horasAntes(49));
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos[0].texto.startsWith(TEXTOS_REVISION['es-AR'].dudas)).toBe(true);
    expect(a.archivo('n1', 'dudas-recordadas.txt')).toBe(AHORA.toISOString());
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt')).toBe(horasAntes(49));
    await atenderRevisiones(a.deps, new Date(AHORA.getTime() + 15 * 60_000));
    expect(a.textos).toHaveLength(1);
  });

  it('el recordatorio con la ventana cerrada usa la misma plantilla', async () => {
    const a = armar({ v3: [cerrada()] });
    a.poner('n1', 'dudas-narrador-avisadas.txt', horasAntes(49));
    await atenderRevisiones(a.deps, AHORA);
    expect(a.plantillas[0]).toMatchObject({ nombre: 'dudas_narrador_vos' });
    expect(a.archivo('n1', 'dudas-recordadas.txt')).toBe(AHORA.toISOString());
  });

  it('pasadas las 72 horas del aviso no sale el recordatorio', async () => {
    const a = armar();
    a.poner('n1', 'dudas-narrador-avisadas.txt', horasAntes(73));
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toEqual([]);
    expect(a.socios).toEqual([]);
  });

  it('un recordatorio anterior al aviso, vacío o roto no cuenta', async () => {
    for (const marca of [horasAntes(60), '', 'cualquier cosa']) {
      olvidarRevisiones();
      const a = armar();
      a.poner('n1', 'dudas-narrador-avisadas.txt', horasAntes(49));
      a.poner('n1', 'dudas-recordadas.txt', marca);
      await atenderRevisiones(a.deps, AHORA);
      expect(a.textos).toHaveLength(1);
    }
  });

  it('todas contestadas con texto: no recuerda; una en blanco no cuenta', async () => {
    const a = armar();
    a.poner('n1', 'dudas-narrador-avisadas.txt', horasAntes(49));
    a.poner('n1', 'correcciones.json', JSON.stringify({ correcciones: [{ dudaId: 'D1', texto: 'Juan' }, { dudaId: 'D2', texto: '   ' }] }));
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos).toHaveLength(1);

    olvidarRevisiones();
    const b = armar();
    b.poner('n1', 'dudas-narrador-avisadas.txt', horasAntes(49));
    b.poner('n1', 'correcciones.json', JSON.stringify({ correcciones: [{ dudaId: 'D1', texto: 'Juan' }, { dudaId: 'D2', texto: '1950' }] }));
    await atenderRevisiones(b.deps, AHORA);
    expect(b.textos).toEqual([]);
  });

  it('las dudas rotas no mandan nada ni frenan al siguiente', async () => {
    const a = armar({
      narradores: [narrador('n1'), narrador('n2', { telefono_whatsapp: '34600000000' })],
      v3: [abierta('n1'), abierta('n2')],
    });
    a.poner('n1', 'dudas-familia.json', '{ roto');
    await atenderRevisiones(a.deps, AHORA);
    expect(a.textos.map((t) => t.tel)).toEqual(['34600000000']);
  });

  it('en una historia lee y marca en escritor-historia', async () => {
    const a = armar({ v3: [], historias: [abierta()], carpeta: 'escritor-historia' });
    await atenderRevisiones(a.deps, AHORA);
    expect(a.archivo('n1', 'dudas-narrador-avisadas.txt', 'escritor-historia')).toBe(AHORA.toISOString());
  });
});
