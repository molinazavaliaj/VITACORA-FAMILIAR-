import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  preguntaDeOrden: vi.fn(),
  descargarAudio: vi.fn(),
  enviarTexto: vi.fn(),
  tratoDe: vi.fn(),
  pedidoAbierto: vi.fn(),
  filas: [] as any[],
  subidas: [] as string[],
}));
vi.mock('../src/db/guion.js', () => ({ preguntaDeOrden: mocks.preguntaDeOrden }));
vi.mock('../src/flujo/objetos.js', () => ({ pedidoAbierto: mocks.pedidoAbierto }));
vi.mock('../src/whatsapp/media.js', () => ({ descargarAudio: mocks.descargarAudio }));
vi.mock('../src/whatsapp/enviar.js', () => ({ enviarTexto: mocks.enviarTexto }));
vi.mock('../src/ia/trato.js', () => ({ tratoDe: mocks.tratoDe }));
vi.mock('../src/db/cliente.js', () => ({
  db: {
    from: () => ({ insert: (fila: any) => { mocks.filas.push(fila); return Promise.resolve({ error: null }); } }),
    storage: {
      from: () => ({
        upload: (path: string) => { mocks.subidas.push(path); return Promise.resolve({ error: null }); },
        remove: () => Promise.resolve({ error: null }),
      }),
    },
  },
}));

const { extensionDe, epigrafeDe, textoFotoGuardada, capituloVigente, recibirFotoFamiliar } = await import('../src/flujo/fotos.js');

const narrador = (dia_actual: number) => ({ id: 'n1', dia_actual, telefono_whatsapp: '+54911', contexto: {} }) as any;

beforeEach(() => {
  mocks.filas = [];
  mocks.subidas = [];
  for (const f of [mocks.preguntaDeOrden, mocks.descargarAudio, mocks.enviarTexto, mocks.tratoDe, mocks.pedidoAbierto]) f.mockReset();
  mocks.descargarAudio.mockResolvedValue(Buffer.from('jpg falso'));
  mocks.enviarTexto.mockResolvedValue('wamid.1');
  mocks.tratoDe.mockResolvedValue('usted');
  mocks.pedidoAbierto.mockResolvedValue(null);
  mocks.preguntaDeOrden.mockResolvedValue({ orden: 4, capitulo: 'La infancia' });
});

describe('las fotos que llegan por WhatsApp', () => {
  it('la extensión sale del mime de Meta; lo desconocido se guarda como jpg', () => {
    expect(extensionDe('image/png')).toBe('png');
    expect(extensionDe('image/webp')).toBe('webp');
    expect(extensionDe('image/jpeg')).toBe('jpg');
    expect(extensionDe(undefined)).toBe('jpg');
    expect(extensionDe('image/heic')).toBe('jpg');
  });

  it('el epígrafe se recorta a 300 y lo vacío queda en null (no en cadena vacía)', () => {
    expect(epigrafeDe('  El tranvía 28  ')).toBe('El tranvía 28');
    expect(epigrafeDe('   ')).toBeNull();
    expect(epigrafeDe(undefined)).toBeNull();
    expect(epigrafeDe('x'.repeat(400))).toHaveLength(300);
  });

  it('el acuse respeta el trato: a quien tratamos de usted no se le tutea', () => {
    expect(textoFotoGuardada('usted')).toContain('cuénteme');
    expect(textoFotoGuardada('vos')).toContain('contame');
    expect(textoFotoGuardada('usted')).not.toMatch(/\bquerés\b/);
  });

  it('la foto es del capítulo de la pregunta que está contestando', async () => {
    mocks.preguntaDeOrden.mockResolvedValue({ capitulo: 'La infancia' });
    expect(await capituloVigente(narrador(3))).toBe('La infancia');
    expect(mocks.preguntaDeOrden).toHaveBeenCalledWith('n1', 3);
  });

  it('sin pregunta vigente todavía, la foto queda sin capítulo: lo acomoda la familia', async () => {
    expect(await capituloVigente(narrador(0))).toBeNull();
    mocks.preguntaDeOrden.mockResolvedValue(null);
    expect(await capituloVigente(narrador(9))).toBeNull();
  });
});

describe('la foto que contesta un pedido de objeto (3t.30)', () => {
  it('con un pedido abierto, la foto se le ata y hereda SU capítulo, no el del día', async () => {
    mocks.pedidoAbierto.mockResolvedValue(101);
    mocks.preguntaDeOrden.mockResolvedValue({ orden: 101, capitulo: 'Las raíces' });
    await recibirFotoFamiliar(narrador(9), 'img-1', 'image/jpeg', undefined);
    expect(mocks.filas[0]).toMatchObject({ pregunta_orden: 101, capitulo: 'Las raíces', principal: false, subida_por: null });
  });

  it('la foto sola dispara la repregunta corta; la que ya viene con la historia, no', async () => {
    mocks.pedidoAbierto.mockResolvedValue(101);
    await recibirFotoFamiliar(narrador(9), 'img-1', 'image/jpeg', undefined);
    expect(mocks.enviarTexto.mock.calls[0][1]).toContain('¿Y de dónde salió?');

    mocks.enviarTexto.mockClear();
    await recibirFotoFamiliar(narrador(9), 'img-2', 'image/jpeg', 'El reloj de mi viejo');
    expect(mocks.enviarTexto.mock.calls[0][1]).not.toContain('¿Y de dónde salió?');
    expect(mocks.enviarTexto.mock.calls[0][1]).toContain('su libro');
  });

  it('sin pedido abierto, la foto va al capítulo que está contestando y sin atar a nada', async () => {
    await recibirFotoFamiliar(narrador(4), 'img-1', 'image/png', 'Mi casamiento');
    expect(mocks.filas[0]).toMatchObject({ pregunta_orden: null, capitulo: 'La infancia', epigrafe: 'Mi casamiento' });
    expect(mocks.subidas[0]).toMatch(/^n1\/fotos\/.*\.png$/);
    expect(mocks.enviarTexto.mock.calls[0][1]).toContain('cuénteme qué pasaba ahí');
  });
});
