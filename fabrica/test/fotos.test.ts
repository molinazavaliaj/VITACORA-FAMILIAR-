import { describe, it, expect, vi } from 'vitest';
import { cargarFotos, mimeDeRuta, normalizarFoco, atributoFoco, LIMITE_BYTES_FOTO } from '../src/libro/fotos.js';

// Nota: `Buffer.from(bytes).buffer.slice(0)` puede devolver el ArrayBuffer
// del pool interno de Node (más grande que los bytes reales) para strings
// cortos, no el recorte exacto. Se arma el Uint8Array primero y se toma SU
// buffer para garantizar el largo exacto.
// Un número en vez de string = archivo de ese tamaño en bytes (para probar las cotas).
function blobFake(bytes: string | number) {
  return {
    arrayBuffer: async () => (typeof bytes === 'number' ? new Uint8Array(bytes).buffer : new Uint8Array(Buffer.from(bytes)).buffer),
  };
}

function construirDb(opciones: {
  fotos: { data: unknown; error: unknown };
  archivos: Record<string, string | number>; // storage_path → bytes; ausente = error de descarga
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

describe('normalizarFoco', () => {
  it('un foco válido se respeta', () => {
    expect(normalizarFoco({ x: 0.3, y: 0.2 })).toEqual({ x: 0.3, y: 0.2 });
    expect(normalizarFoco({ x: 0, y: 1 })).toEqual({ x: 0, y: 1 });
  });

  it('sin la columna (migración sin aplicar) o con null → undefined: no hay foco, la foto va entera', () => {
    // `undefined` es exactamente lo que llega con `select *` cuando la
    // migración 20260918 todavía no está aplicada.
    expect(normalizarFoco(undefined)).toBeUndefined();
    expect(normalizarFoco(null)).toBeUndefined();
  });

  it('un valor que no se entiende se ignora (no cae al centro): texto vacío, número, un eje que no es número, NaN, sin un eje', () => {
    for (const basura of ['', '0.3,0.2', 3, {}, [], { x: 'a', y: 0.2 }, { x: NaN, y: 0.2 }, { x: Infinity, y: 0.5 }, { x: 0.3 }]) {
      expect(normalizarFoco(basura)).toBeUndefined();
    }
  });

  it('fuera de 0..1 se recorta al borde', () => {
    expect(normalizarFoco({ x: 1.7, y: -0.2 })).toEqual({ x: 1, y: 0 });
  });
});

describe('atributoFoco', () => {
  it('con foco escribe el atributo con el punto en porcentaje', () => {
    expect(atributoFoco({ x: 0.3, y: 0.2 })).toBe(' style="object-position: 30% 20%"');
    expect(atributoFoco({ x: 0, y: 1 })).toBe(' style="object-position: 0% 100%"');
  });

  it('sin foco (o con basura) no escribe NADA: el HTML de la foto sale igual que antes de la migración', () => {
    for (const sinFoco of [undefined, null, '', 3, { x: 'a', y: 0.2 }]) {
      expect(atributoFoco(sinFoco)).toBe('');
    }
  });
});

describe('cargarFotos', () => {
  it('lee posicion y foco: la apertura lleva su foco y el capítulo su posición', async () => {
    const db = construirDb({
      fotos: {
        data: [
          { id: 'f1', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/f1.jpg', epigrafe: null, principal: true, orden: 0, posicion: 'abajo', foco: { x: 0.3, y: 0.2 } },
          { id: 'f2', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/f2.jpg', epigrafe: null, principal: false, orden: 1, posicion: 'arriba', foco: { x: 0.9, y: 0.9 } },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/f1.jpg': 'a', 'n1/fotos/f2.jpg': 'b' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('X')!;
    expect(cap.apertura?.foco).toEqual({ x: 0.3, y: 0.2 });
    expect(cap.posicionApertura).toBe('abajo');
    expect(cap.cierre[0].foco).toEqual({ x: 0.9, y: 0.9 });
    expect(fotos.porId.get('f1')?.foco).toEqual({ x: 0.3, y: 0.2 });
  });

  it('una fila sin las columnas nuevas (migración sin aplicar) → sin foco y arriba; una posición desconocida → arriba', async () => {
    const db = construirDb({
      fotos: {
        data: [
          // Sin `posicion` ni `foco`: es como llega la fila con `select *`
          // mientras la migración 20260918 no esté aplicada.
          { id: 'f0', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/f0.jpg', epigrafe: null, principal: true, orden: 0 },
          { id: 'f1', narrador_id: 'n1', capitulo: 'Y', storage_path: 'n1/fotos/f1.jpg', epigrafe: null, principal: true, orden: 0, posicion: 'costado', foco: null },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/f0.jpg': 'a', 'n1/fotos/f1.jpg': 'a' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const sinColumnas = fotos.porCapitulo.get('X')!;
    expect(sinColumnas.apertura?.foco).toBeUndefined();
    expect(sinColumnas.posicionApertura).toBe('arriba');
    const cap = fotos.porCapitulo.get('Y')!;
    expect(cap.apertura?.foco).toBeUndefined();
    expect(cap.posicionApertura).toBe('arriba');
  });

  it('sin la migración aplicada la consulta no nombra posicion ni foco (PostgREST rechazaría el pedido entero) y el libro sale como siempre', async () => {
    // El fake imita a PostgREST: una consulta que nombre una columna que la
    // tabla todavía no tiene se rechaza ENTERA. Si `cargarFotos` pidiera
    // `posicion` y `foco` por nombre, esto tiraría y el pedido caería a
    // `fallido`: no habría libro.
    let ultimoSelect = '';
    const builder = {
      select: (columnas: string) => {
        ultimoSelect = columnas;
        return builder;
      },
      eq: () => builder,
      order: () =>
        Promise.resolve(
          /posicion|foco/.test(ultimoSelect)
            ? { data: null, error: { message: 'column fotos.posicion does not exist' } }
            : {
                data: [
                  { id: 'f1', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/f1.jpg', epigrafe: null, principal: true, orden: 0 },
                ],
                error: null,
              }
        ),
    };
    const download = vi.fn(() => Promise.resolve({ data: blobFake('a'), error: null }));
    const db = { from: vi.fn(() => builder), storage: { from: vi.fn(() => ({ download })) } };

    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('X')!;
    expect(cap.apertura?.dataUri).toBe(`data:image/jpeg;base64,${Buffer.from('a').toString('base64')}`);
    expect(cap.apertura?.foco).toBeUndefined();
    expect(cap.posicionApertura).toBe('arriba');
  });

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
    expect(cap.apertura).toEqual({ dataUri: `data:image/jpeg;base64,${Buffer.from('AAA').toString('base64')}`, epigrafe: null, foco: undefined });
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

  it('si leer el blob descargado tira (arrayBuffer rechaza), se omite con aviso; el resto sigue', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const download = vi.fn((ruta: string) => {
      if (ruta === 'n1/fotos/rota.jpg') {
        return Promise.resolve({
          data: { arrayBuffer: async () => Promise.reject(new Error('blob corrupto')) },
          error: null,
        });
      }
      return Promise.resolve({ data: { arrayBuffer: async () => new Uint8Array(Buffer.from('b')).buffer }, error: null });
    });
    const builder = {
      select: () => builder,
      eq: () => builder,
      order: () =>
        Promise.resolve({
          data: [
            { id: 'a', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/rota.jpg', epigrafe: null, principal: true, orden: 0 },
            { id: 'b', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/b.jpg', epigrafe: 'ok', principal: false, orden: 1 },
          ],
          error: null,
        }),
    };
    const db = { from: vi.fn(() => builder), storage: { from: vi.fn(() => ({ download })) } };

    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('X')!;
    expect(cap.apertura).toBeNull();
    expect(cap.cierre).toHaveLength(1);
    expect(fotos.porId.has('a')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('rota.jpg'));
    warn.mockRestore();
  });

  it('una foto .heic/.heif se omite con aviso sin bajarla: Chromium no la decodifica y saldría una página en blanco', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const db = construirDb({
      fotos: {
        data: [
          { id: 'a', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/a.heic', epigrafe: null, principal: true, orden: 0 },
          { id: 'b', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/b.HEIF', epigrafe: null, principal: false, orden: 1 },
          { id: 'c', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/c.jpg', epigrafe: 'ok', principal: false, orden: 2 },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/a.heic': 'AAA', 'n1/fotos/b.HEIF': 'BBB', 'n1/fotos/c.jpg': 'c' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const cap = fotos.porCapitulo.get('X')!;
    expect(cap.apertura).toBeNull();
    expect(cap.cierre.map((f) => f.epigrafe)).toEqual(['ok']);
    expect(fotos.porId.has('a')).toBe(false);
    expect(fotos.porId.has('b')).toBe(false);
    expect(db.download).not.toHaveBeenCalledWith('n1/fotos/a.heic');
    expect(db.download).not.toHaveBeenCalledWith('n1/fotos/b.HEIF');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('n1/fotos/a.heic'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('n1/fotos/b.HEIF'));
    warn.mockRestore();
  });

  it('una foto que pasa LIMITE_BYTES_FOTO se omite con aviso; las demás siguen', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const db = construirDb({
      fotos: {
        data: [
          { id: 'grande', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/grande.jpg', epigrafe: null, principal: true, orden: 0 },
          { id: 'justa', narrador_id: 'n1', capitulo: 'X', storage_path: 'n1/fotos/justa.jpg', epigrafe: 'justa', principal: false, orden: 1 },
        ],
        error: null,
      },
      archivos: { 'n1/fotos/grande.jpg': LIMITE_BYTES_FOTO + 1, 'n1/fotos/justa.jpg': LIMITE_BYTES_FOTO },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    expect(fotos.porId.has('grande')).toBe(false);
    expect(fotos.porId.has('justa')).toBe(true);
    expect(fotos.porCapitulo.get('X')!.apertura).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('n1/fotos/grande.jpg'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('8.0 MB'));
    warn.mockRestore();
  });

  it('cuando el total embebido pasaría LIMITE_BYTES_TOTAL, esa foto y las que la superen se omiten con aviso', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // 7 fotos de 8 MB = 56 MB; la octava (8 MB) pasaría los 60 MB; una novena chica (1 MB) sí entra.
    const fila = (i: number, bytes: number) => ({
      id: `f${i}`, narrador_id: 'n1', capitulo: 'X', storage_path: `n1/fotos/f${i}.jpg`, epigrafe: null, principal: false, orden: i,
    });
    const tamanos = [...Array.from({ length: 8 }, () => LIMITE_BYTES_FOTO), 1024 * 1024];
    const db = construirDb({
      fotos: { data: tamanos.map((_, i) => fila(i, tamanos[i])), error: null },
      archivos: Object.fromEntries(tamanos.map((bytes, i) => [`n1/fotos/f${i}.jpg`, bytes])),
    });
    const fotos = await cargarFotos(db as never, 'n1');
    expect([...fotos.porId.keys()]).toEqual(['f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f8']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('n1/fotos/f7.jpg'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('60.0 MB'));
    warn.mockRestore();
  });

  it('si la consulta a la tabla falla, tira (eso sí es un error del pedido)', async () => {
    const db = construirDb({ fotos: { data: null, error: { message: 'boom' } }, archivos: {} });
    await expect(cargarFotos(db as never, 'n1')).rejects.toThrow('boom');
  });
});
