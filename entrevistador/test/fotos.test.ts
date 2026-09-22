import { describe, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ preguntaDeOrden: vi.fn() }));
vi.mock('../src/db/guion.js', () => ({ preguntaDeOrden: mocks.preguntaDeOrden }));
vi.mock('../src/db/cliente.js', () => ({ db: {} }));
vi.mock('../src/whatsapp/media.js', () => ({ descargarAudio: vi.fn() }));
vi.mock('../src/whatsapp/enviar.js', () => ({ enviarTexto: vi.fn() }));
vi.mock('../src/ia/trato.js', () => ({ tratoDe: vi.fn() }));

const { extensionDe, epigrafeDe, textoFotoGuardada, capituloVigente } = await import('../src/flujo/fotos.js');

const narrador = (dia_actual: number) => ({ id: 'n1', dia_actual }) as any;

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
