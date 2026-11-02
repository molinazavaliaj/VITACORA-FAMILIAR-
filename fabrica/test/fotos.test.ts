import { describe, it, expect, vi } from 'vitest';
import { cargarFotos, mimeDeRuta, normalizarFoco, atributoFoco, LIMITE_BYTES_FOTO, fotosDelAlbum, diferenciaDeFirmas } from '../src/libro/fotos.js';
import type { ProcesarFotos } from '../src/libro/preparar-fotos.js';

// Nota: `Buffer.from(bytes).buffer.slice(0)` puede devolver el ArrayBuffer
// del pool interno de Node (más grande que los bytes reales) para strings
// cortos, no el recorte exacto. Se arma el Uint8Array primero y se toma SU
// buffer para garantizar el largo exacto.
// Un número en vez de string = archivo de ese tamaño en bytes (para probar las cotas). Cada uno distinto: dos
// archivos iguales son la misma foto y entran una sola vez.
let semilla = 0;
function blobFake(bytes: string | number) {
  return {
    arrayBuffer: async () => {
      if (typeof bytes !== 'number') return new Uint8Array(Buffer.from(bytes)).buffer;
      const a = new Uint8Array(bytes);
      a[0] = ++semilla % 256;
      a[1] = Math.floor(semilla / 256) % 256;
      return a.buffer;
    },
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

describe('el álbum: repetidas y fotosDelAlbum (02/11)', () => {
  const fila = (id: string, orden: number, capitulo: string | null = null) => ({
    id, narrador_id: 'n1', capitulo, storage_path: `n1/fotos/${id}.jpg`, epigrafe: null, principal: false, orden,
  });
  // Firma de 16×16 grises: un tono parejo por foto alcanza para el test.
  const firma = (tono: number) => tono.toString(16).padStart(2, '0').repeat(256);

  it('la misma foto subida dos veces (mismos bytes) entra una vez; la otra fila se sigue encontrando por su id', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const db = construirDb({
      fotos: { data: [fila('a', 0), fila('b', 1), fila('c', 2)], error: null },
      archivos: { 'n1/fotos/a.jpg': 'uno', 'n1/fotos/b.jpg': 'dos', 'n1/fotos/c.jpg': 'uno' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    expect(fotos.enOrden.map((f) => f.ids)).toEqual([['a', 'c'], ['b']]);
    expect(fotos.porId.get('c')).toBe(fotos.porId.get('a'));
    warn.mockRestore();
  });

  it('la misma foto en dos tamaños (firma casi igual) queda una, en el lugar de la primera y con los píxeles de la grande', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const db = construirDb({
      fotos: { data: [fila('chica', 0), fila('otra', 1), fila('grande', 2)], error: null },
      archivos: { 'n1/fotos/chica.jpg': 'c', 'n1/fotos/otra.jpg': 'o', 'n1/fotos/grande.jpg': 'g' },
    });
    const procesar: ProcesarFotos = async (fs) => fs.map((f) => {
      const t = f.bytes.toString();
      return { bytes: Buffer.from(t.toUpperCase()), mime: 'image/jpeg', ancho: t === 'g' ? 3000 : 900, alto: 1200, firma: firma(t === 'o' ? 200 : t === 'c' ? 100 : 103) };
    });
    const fotos = await cargarFotos(db as never, 'n1', { procesar });
    expect(fotos.enOrden.map((f) => f.ids)).toEqual([['chica', 'grande'], ['otra']]);
    expect(fotos.enOrden[0].foto.dataUri).toBe(`data:image/jpeg;base64,${Buffer.from('G').toString('base64')}`);
    warn.mockRestore();
  });

  it('una foto que la familia puso en un capítulo no se junta con otra igual', async () => {
    const db = construirDb({
      fotos: { data: [fila('a', 0, 'Infancia'), fila('b', 1)], error: null },
      archivos: { 'n1/fotos/a.jpg': 'igual', 'n1/fotos/b.jpg': 'igual' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    expect(fotos.enOrden.map((f) => f.ids)).toEqual([['a'], ['b']]);
  });

  it('fotosDelAlbum: todas en su orden, menos la de tapa (también si se eligió la repetida) y las que ya van en un capítulo', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const db = construirDb({
      fotos: { data: [fila('a', 0), fila('b', 1), fila('c', 2, 'Infancia'), fila('d', 3), fila('e', 4)], error: null },
      archivos: { 'n1/fotos/a.jpg': '1', 'n1/fotos/b.jpg': '2', 'n1/fotos/c.jpg': '3', 'n1/fotos/d.jpg': '4', 'n1/fotos/e.jpg': '2' },
    });
    const fotos = await cargarFotos(db as never, 'n1');
    const album = fotosDelAlbum(fotos, { tapaId: 'e', capitulosConFotos: ['Infancia'] });
    expect(album).toEqual([fotos.porId.get('a'), fotos.porId.get('d')]);
    expect(fotosDelAlbum(fotos)).toHaveLength(4);
    warn.mockRestore();
  });

  it('diferenciaDeFirmas: la media por píxel; firmas de otro largo no se comparan', () => {
    expect(diferenciaDeFirmas(firma(10), firma(14))).toBe(4);
    expect(diferenciaDeFirmas(firma(10), 'ab')).toBe(Infinity);
  });
});
