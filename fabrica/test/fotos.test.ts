import { describe, it, expect, vi } from 'vitest';
import { cargarFotos, mimeDeRuta } from '../src/libro/fotos.js';

// Nota: `Buffer.from(bytes).buffer.slice(0)` puede devolver el ArrayBuffer
// del pool interno de Node (más grande que los bytes reales) para strings
// cortos, no el recorte exacto. Se arma el Uint8Array primero y se toma SU
// buffer para garantizar el largo exacto.
function blobFake(bytes: string) {
  return { arrayBuffer: async () => new Uint8Array(Buffer.from(bytes)).buffer };
}

function construirDb(opciones: {
  fotos: { data: unknown; error: unknown };
  archivos: Record<string, string>; // storage_path → bytes; ausente = error de descarga
}) {
  const download = vi.fn((ruta: string) => {
    const bytes = opciones.archivos[ruta];
    return Promise.resolve(
      bytes === undefined ? { data: null, error: { message: 'Object not found' } } : { data: blobFake(bytes), error: null }
    );
  });
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => Promise.resolve(opciones.fotos),
  };
  return {
    from: vi.fn(() => builder),
    storage: { from: vi.fn(() => ({ download })) },
    download,
  };
}

describe('mimeDeRuta', () => {
  it('jpg/jpeg/png/webp; desconocido → image/jpeg', () => {
    expect(mimeDeRuta('n/fotos/a.jpg')).toBe('image/jpeg');
    expect(mimeDeRuta('n/fotos/a.JPEG')).toBe('image/jpeg');
    expect(mimeDeRuta('n/fotos/a.png')).toBe('image/png');
    expect(mimeDeRuta('n/fotos/a.webp')).toBe('image/webp');
    expect(mimeDeRuta('n/fotos/a')).toBe('image/jpeg');
  });
});

describe('cargarFotos', () => {
  it('sin fotos → mapas vacíos', async () => {
    const db = construirDb({ fotos: { data: [], error: null }, archivos: {} });
    const fotos = await cargarFotos(db as never, 'n1');
    expect(fotos.porCapitulo.size).toBe(0);
    expect(fotos.porId.size).toBe(0);
  });

  it('la principal abre, las demás cierran en su orden, con epígrafe y data URI', async () => {
    const db = construirDb({
      fotos: {
        data: [
          { id: 'f2', narrador_id: 'n1', capitulo: 'La infancia', storage_path: 'n1/fotos/f2.png', epigrafe: 'En el patio', principal: false, orden: 2 },
          { id: 'f1', narrador_id: 'n1', capitulo: 'La infancia', storage_path: 'n1/fotos/f1.jpg', epigrafe: null, principal: true, orden: 0 },
          { id: 'f3', narrador_id: 'n1', capitulo: 'La infancia', storage_path: 'n1/fotos/f3.jpg', epigrafe: 'Con mamá', principal: false, orden: 1 },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/f1.jpg': 'AAA', 'n1/fotos/f2.png': 'BBB', 'n1/fotos/f3.jpg': 'CCC' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('La infancia')!;
    expect(cap.apertura).toEqual({ dataUri: `data:image/jpeg;base64,${Buffer.from('AAA').toString('base64')}`, epigrafe: null });
    expect(cap.cierre.map((f) => f.epigrafe)).toEqual(['Con mamá', 'En el patio']);
    expect(cap.cierre[1].dataUri.startsWith('data:image/png;base64,')).toBe(true);
    expect(fotos.porId.get('f3')?.epigrafe).toBe('Con mamá');
  });

  it('con dos principales en el mismo capítulo, abre la de menor orden y la otra cierra', async () => {
    const db = construirDb({
      fotos: {
        data: [
          { id: 'a', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/a.jpg', epigrafe: null, principal: true, orden: 5 },
          { id: 'b', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/b.jpg', epigrafe: null, principal: true, orden: 1 },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/a.jpg': 'a', 'n1/fotos/b.jpg': 'b' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('X')!;
    expect(cap.apertura?.dataUri).toContain(Buffer.from('b').toString('base64'));
    expect(cap.cierre).toHaveLength(1);
  });

  it('una foto que no se puede bajar se omite con aviso; el resto sigue', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const db = construirDb({
      fotos: {
        data: [
          { id: 'a', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/rota.jpg', epigrafe: null, principal: true, orden: 0 },
          { id: 'b', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/b.jpg', epigrafe: 'ok', principal: false, orden: 1 },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/b.jpg': 'b' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('X')!;
    expect(cap.apertura).toBeNull();
    expect(cap.cierre).toHaveLength(1);
    expect(fotos.porId.has('a')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('rota.jpg'));
    warn.mockRestore();
  });

  it('si la consulta a la tabla falla, tira (eso sí es un error del pedido)', async () => {
    const db = construirDb({ fotos: { data: null, error: { message: 'boom' } }, archivos: {} });
    await expect(cargarFotos(db as never, 'n1')).rejects.toThrow('boom');
  });
});
