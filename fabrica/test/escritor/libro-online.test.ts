import { describe, expect, it, vi } from 'vitest';
import { ponerAlDiaLibrosOnline } from '../../src/escritor/produccion/libro-online.js';
import { construirHtmlLibro } from '../../src/libro/plantilla-html.js';

// Una base falsa: narradores cerrados y un Storage en memoria.
function base(cerrados: string[], storage: Record<string, string>) {
  const subidas: string[] = [];
  const db = {
    from: () => ({ select: () => ({ not: async () => ({ data: cerrados.map((id) => ({ id })), error: null }) }) }),
    storage: {
      from: () => ({
        download: async (ruta: string) => (ruta in storage ? { data: new Blob([storage[ruta]]), error: null } : { data: null, error: { message: 'no' } }),
        upload: async (ruta: string, cuerpo: unknown) => { subidas.push(ruta); storage[ruta] = String(cuerpo); return { error: null }; },
      }),
    },
  };
  return { db: db as never, subidas };
}

describe('ponerAlDiaLibrosOnline', () => {
  it('rehace solo el que cambió; el igual y el que todavía no se entregó no se tocan', async () => {
    const { db, subidas } = base(['igual', 'viejo', 'sin-entregar'], {
      'igual/paquete/libro.html': '<html>hoy</html>',
      'viejo/paquete/libro.html': '<html>14/10</html>',
    });
    const pdf = vi.fn(async () => new Uint8Array([1]));
    const armar = vi.fn(async (_db: unknown, id: string) => ({ nombre: id, html: '<html>hoy</html>' }));
    const rehechos = await ponerAlDiaLibrosOnline(db, { armar, pdf });
    expect(rehechos).toEqual(['viejo']);
    expect(subidas).toEqual(['viejo/paquete/libro.html', 'viejo/paquete/libro.pdf']);
    expect(armar).not.toHaveBeenCalledWith(db, 'sin-entregar');
    expect(pdf).toHaveBeenCalledTimes(1);
  });

  it('si uno falla, sigue con los demás', async () => {
    const { db, subidas } = base(['roto', 'viejo'], { 'roto/paquete/libro.html': 'a', 'viejo/paquete/libro.html': 'a' });
    const armar = async (_db: unknown, id: string) => {
      if (id === 'roto') throw new Error('sin material');
      return { nombre: id, html: 'b' };
    };
    expect(await ponerAlDiaLibrosOnline(db, { armar, pdf: async () => new Uint8Array() })).toEqual(['viejo']);
    expect(subidas).toContain('viejo/paquete/libro.html');
  });
});

describe('el colofón', () => {
  it('dice el año del cierre, no el de hoy: rehecho otro año, el libro no cambia', async () => {
    vi.useFakeTimers({ now: new Date('2027-03-01T12:00:00Z'), toFake: ['Date'] });
    try {
      const armar = (anioColofon?: number) => construirHtmlLibro({ titulo: 'La vida de Imma', nombreNarrador: 'Imma', indice: ['I · Uno'], libroMarkdown: ['# I · Uno', '', 'Texto.'].join('\n'), ...(anioColofon ? { anioColofon } : {}) });
      expect(await armar(2026)).toContain('MMXXVI'); // en el colofón va en romanos
      expect(await armar(2026)).not.toContain('MMXXVII');
      expect(await armar()).toContain('MMXXVII'); // sin año del cierre, el de hoy (como antes)
    } finally {
      vi.useRealTimers();
    }
  });
});
