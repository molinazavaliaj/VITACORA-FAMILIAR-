import { describe, it, expect, vi, beforeEach } from 'vitest';

// Base falsa: solo `envios` (select con eq/gt/order/limit, e insert capturado).
const estado = vi.hoisted(() => ({ envios: [] as any[], inserts: [] as any[] }));

vi.mock('../src/db/cliente.js', () => {
  function builder(tabla: string) {
    const eq: Record<string, unknown> = {};
    let mayorQue: { col: string; val: string } | null = null;
    const b: any = {};
    b.select = () => b;
    b.order = () => b;
    b.limit = (n: number) => { b._limite = n; return b; };
    b.eq = (c: string, v: unknown) => { eq[c] = v; return b; };
    b.gt = (c: string, v: unknown) => { mayorQue = { col: c, val: v as string }; return b; };
    b.insert = (fila: unknown) => { estado.inserts.push({ tabla, fila }); return Promise.resolve({ error: null }); };
    b.then = (res: (v: unknown) => unknown) => {
      let data = estado.envios.filter((e) => Object.entries(eq).every(([k, v]) => e[k] === v));
      if (mayorQue) data = data.filter((e) => e[mayorQue!.col] > mayorQue!.val);
      data = [...data].sort((a, b2) => (a.enviado_at < b2.enviado_at ? 1 : -1)); // el más nuevo primero
      if (b._limite) data = data.slice(0, b._limite);
      return Promise.resolve({ data, error: null }).then(res);
    };
    return b;
  }
  return { db: { from: (t: string) => builder(t) } };
});

const mocks = vi.hoisted(() => ({
  enviarTexto: vi.fn(),
  esUltimaDelCapitulo: vi.fn(),
  objetoDelCapitulo: vi.fn(),
  preguntaDeOrden: vi.fn(),
  personalizarPregunta: vi.fn(),
  tratoDe: vi.fn(),
}));
vi.mock('../src/whatsapp/enviar.js', () => ({ enviarTexto: mocks.enviarTexto }));
vi.mock('../src/db/guion.js', () => ({
  esUltimaDelCapitulo: mocks.esUltimaDelCapitulo,
  objetoDelCapitulo: mocks.objetoDelCapitulo,
  preguntaDeOrden: mocks.preguntaDeOrden,
}));
vi.mock('../src/ia/personalizar.js', () => ({ personalizarPregunta: mocks.personalizarPregunta }));
vi.mock('../src/ia/trato.js', () => ({ tratoDe: mocks.tratoDe }));

const { pedidoAbierto, yaSePidio, sinFotos, textoDelPedido, pedirObjeto } = await import('../src/flujo/objetos.js');

const AHORA = new Date('2026-09-23T12:00:00Z');
const haceHoras = (h: number) => new Date(AHORA.getTime() - h * 3600_000).toISOString();
const PEDIDO = 'Mándeme una foto del reloj y cuénteme de dónde salió.';
const narrador = (contexto: Record<string, any> = {}) =>
  ({ id: 'n1', telefono_whatsapp: '+54911', contexto, como_le_dicen: 'papá' }) as any;

beforeEach(() => {
  estado.envios = [];
  estado.inserts = [];
  for (const f of Object.values(mocks)) f.mockReset();
  mocks.enviarTexto.mockResolvedValue('wamid.1');
  mocks.tratoDe.mockResolvedValue('usted');
  mocks.esUltimaDelCapitulo.mockResolvedValue(true);
  mocks.preguntaDeOrden.mockResolvedValue({ orden: 4, capitulo: 'La infancia', tipo: 'fija' });
  mocks.objetoDelCapitulo.mockResolvedValue({ orden: 101, capitulo: 'La infancia', tipo: 'objeto', texto: PEDIDO });
  mocks.personalizarPregunta.mockResolvedValue({ texto: PEDIDO, personalizada: false });
});

describe('el pedido abierto', () => {
  it('el de hace un rato está abierto; el de hace tres días ya no', async () => {
    estado.envios = [{ narrador_id: 'n1', tipo: 'objeto', pregunta_orden: 101, enviado_at: haceHoras(5) }];
    expect(await pedidoAbierto('n1', AHORA)).toBe(101);
    estado.envios = [{ narrador_id: 'n1', tipo: 'objeto', pregunta_orden: 101, enviado_at: haceHoras(72) }];
    expect(await pedidoAbierto('n1', AHORA)).toBeNull();
  });

  it('si ya salió la pregunta del día siguiente, el pedido quedó atrás', async () => {
    estado.envios = [
      { narrador_id: 'n1', tipo: 'objeto', pregunta_orden: 101, enviado_at: haceHoras(20) },
      { narrador_id: 'n1', tipo: 'pregunta', pregunta_orden: 5, enviado_at: haceHoras(2) },
    ];
    expect(await pedidoAbierto('n1', AHORA)).toBeNull();
  });

  it('sin pedidos, null', async () => {
    expect(await pedidoAbierto('n1', AHORA)).toBeNull();
  });

  it('yaSePidio mira ese objeto y no otro', async () => {
    estado.envios = [{ narrador_id: 'n1', tipo: 'objeto', pregunta_orden: 101, enviado_at: haceHoras(300) }];
    expect(await yaSePidio('n1', 101)).toBe(true);
    expect(await yaSePidio('n1', 102)).toBe(false);
  });
});

describe('el texto del pedido', () => {
  it('si el personalizador se olvida de pedir la foto, va el original', async () => {
    mocks.personalizarPregunta.mockResolvedValue({ texto: '¿Qué recuerda de su primer reloj?', personalizada: true });
    expect(await textoDelPedido(narrador(), PEDIDO, 101)).toBe(PEDIDO);
  });

  it('si lo personaliza y sigue pidiendo la foto, va el personalizado', async () => {
    const mejor = 'De aquel reloj que le regaló su papá, ¿lo tiene? Mándeme una foto.';
    mocks.personalizarPregunta.mockResolvedValue({ texto: mejor, personalizada: true });
    expect(await textoDelPedido(narrador(), PEDIDO, 101)).toBe(mejor);
  });

  it('si el personalizador se cae, va el original y no explota', async () => {
    mocks.personalizarPregunta.mockRejectedValue(new Error('API caída'));
    expect(await textoDelPedido(narrador(), PEDIDO, 101)).toBe(PEDIDO);
  });
});

describe('pedirObjeto', () => {
  it('al cerrar el capítulo sale el pedido, con el reconocimiento y la salida por texto', async () => {
    expect(await pedirObjeto(narrador(), 4)).toBe(true);
    const [tel, texto] = mocks.enviarTexto.mock.calls[0];
    expect(tel).toBe('+54911');
    expect(texto).toContain('Con esto cerramos «La infancia»');
    expect(texto).toContain(PEDIDO);
    expect(texto).toContain('Si no lo tiene a mano, cuéntemelo y listo.');
    expect(estado.inserts[0]).toMatchObject({ tabla: 'envios', fila: { tipo: 'objeto', pregunta_orden: 101 } });
  });

  it('en vos, la salida por texto también se tutea', async () => {
    mocks.tratoDe.mockResolvedValue('vos');
    await pedirObjeto(narrador(), 4);
    expect(mocks.enviarTexto.mock.calls[0][1]).toContain('Si no lo tenés a mano, contámelo y listo.');
  });

  it('en el medio de un capítulo no se pide nada', async () => {
    mocks.esUltimaDelCapitulo.mockResolvedValue(false);
    expect(await pedirObjeto(narrador(), 2)).toBe(false);
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('se pide UNA sola vez: si ya salió, no se insiste nunca', async () => {
    estado.envios = [{ narrador_id: 'n1', tipo: 'objeto', pregunta_orden: 101, enviado_at: haceHoras(300) }];
    expect(await pedirObjeto(narrador(), 4)).toBe(false);
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('si la familia borró el pedido del panel, ese capítulo no pide nada', async () => {
    mocks.objetoDelCapitulo.mockResolvedValue(null);
    expect(await pedirObjeto(narrador(), 4)).toBe(false);
  });

  it('con «no pedirle fotos» prendido, no se pide aunque el capítulo cierre', async () => {
    expect(sinFotos({ sinFotos: true })).toBe(true);
    expect(await pedirObjeto(narrador({ sinFotos: true }), 4)).toBe(false);
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('si WhatsApp falla, el día sigue: devuelve false y no rompe la entrevista', async () => {
    mocks.enviarTexto.mockRejectedValue(new Error('Meta caído'));
    expect(await pedirObjeto(narrador(), 4)).toBe(false);
  });
});
