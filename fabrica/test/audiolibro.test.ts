import { describe, it, expect } from 'vitest';
import {
  armarListaConcat, subirMp3, subirCompletoSiEntra, entraEnStorage, LIMITE_BYTES_ARCHIVO_STORAGE,
} from '../src/audio/audiolibro.js';

/** Un cliente de Storage falso que registra lo que se subió y puede rechazar por tamaño. */
function storageFalso(error?: { message: string }) {
  const subidas: { ruta: string; bytes: number }[] = [];
  const db = {
    storage: {
      from: () => ({
        upload: (ruta: string, buffer: Buffer) => {
          if (error) return Promise.resolve({ error });
          subidas.push({ ruta, bytes: buffer.length });
          return Promise.resolve({ error: null });
        },
      }),
    },
  } as never;
  return { db, subidas };
}

describe('armarListaConcat', () => {
  it('respeta el orden: dia_NN.ogg antes que dia_NN_2.ogg, ordenes en el orden de la estructura', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [4] }],
    };
    // El archivo _2 aparece ANTES en la lista de Storage a propósito — el
    // orden final tiene que venir de la lógica, no de cómo Storage devolvió
    // los nombres.
    const archivos = ['dia_04_2.ogg', 'dia_04.ogg', 'otro-narrador/dia_04.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_04.ogg', 'dia_04_2.ogg'] },
    ]);
  });

  it('concatena los archivos de varias órdenes de un capítulo en el orden de las órdenes', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [1, 2] }],
    };
    const archivos = ['dia_02.ogg', 'dia_01.ogg', 'dia_01_2.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_01.ogg', 'dia_01_2.ogg', 'dia_02.ogg'] },
    ]);
  });

  it('numera los capítulos en el orden de la estructura, empezando en 1', () => {
    const estructura = {
      capitulos: [
        { nombre: 'Infancia', ordenes: [1] },
        { nombre: 'El amor', ordenes: [2] },
      ],
    };
    const archivos = ['dia_01.ogg', 'dia_02.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_01.ogg'] },
      { capitulo: 'El amor', numero: 2, archivos: ['dia_02.ogg'] },
    ]);
  });

  it('omite las órdenes sin ningún audio disponible, sin tirar', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [1, 2, 3] }],
    };
    // Orden 2 no tiene audio (por ejemplo, respondió por texto).
    const archivos = ['dia_01.ogg', 'dia_03.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_01.ogg', 'dia_03.ogg'] },
    ]);
  });

  it('un capítulo sin ningún audio queda con archivos: []', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [1] }],
    };

    const resultado = armarListaConcat(estructura, []);

    expect(resultado).toEqual([{ capitulo: 'Infancia', numero: 1, archivos: [] }]);
  });

  it('no confunde dia_1.ogg con dia_10.ogg ni con dia_04.ogg', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [4] }],
    };
    const archivos = ['dia_1.ogg', 'dia_10.ogg', 'dia_04.ogg', 'dia_040.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([{ capitulo: 'Infancia', numero: 1, archivos: ['dia_04.ogg'] }]);
  });

  it('ordena por sufijo numérico, no alfabéticamente (dia_04_10.ogg después de dia_04_2.ogg)', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [4] }],
    };
    const archivos = ['dia_04_10.ogg', 'dia_04.ogg', 'dia_04_2.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_04.ogg', 'dia_04_2.ogg', 'dia_04_10.ogg'] },
    ]);
  });
});

// Bitácora 38: el audiolibro de Joaquín (69 min, 66 MB) tumbó el ensamblado dos
// veces el 18/09 — el tope de 50 MB por archivo de Storage. El completo ahora es
// opcional, pero el tope deja de vivir solo ahí: lo mira cualquier subida, y un
// capítulo que no entra lo dice con el número y el tope en vez del texto crudo
// de Storage.
describe('el tope de Storage lo miran todas las subidas', () => {
  it('entraEnStorage acepta justo el tope y rechaza un byte más', () => {
    expect(entraEnStorage(LIMITE_BYTES_ARCHIVO_STORAGE)).toBe(true);
    expect(entraEnStorage(LIMITE_BYTES_ARCHIVO_STORAGE + 1)).toBe(false);
  });

  it('un capítulo que no entra tira con el tamaño y el tope, sin llegar a Storage', async () => {
    const { db, subidas } = storageFalso();
    await expect(subirMp3(db, 'n1/paquete/audiolibro_cap_03.mp3', Buffer.alloc(LIMITE_BYTES_ARCHIVO_STORAGE + 1)))
      .rejects.toThrow(/No entra en Storage: n1\/paquete\/audiolibro_cap_03\.mp3 pesa 50\.0 MB y el tope por archivo es 50\.0 MB/);
    expect(subidas).toHaveLength(0);
  });

  it('un capítulo que entra se sube como siempre', async () => {
    const { db, subidas } = storageFalso();
    await subirMp3(db, 'n1/paquete/audiolibro_cap_03.mp3', Buffer.alloc(1024));
    expect(subidas).toEqual([{ ruta: 'n1/paquete/audiolibro_cap_03.mp3', bytes: 1024 }]);
  });

  it('si Storage igual rechaza por tamaño, el error también dice cuánto pesaba', async () => {
    const { db } = storageFalso({ message: 'The object exceeded the maximum allowed size' });
    await expect(subirMp3(db, 'n1/paquete/audiolibro_cap_03.mp3', Buffer.alloc(1024 * 1024)))
      .rejects.toThrow(/No entra en Storage.*1\.0 MB/);
  });

  it('el completo que no entra se avisa y se entrega sin él (no frena la entrega)', async () => {
    const { db, subidas } = storageFalso();
    const ruta = await subirCompletoSiEntra(db, 'n1/paquete/audiolibro_completo.mp3', Buffer.alloc(LIMITE_BYTES_ARCHIVO_STORAGE + 1));
    expect(ruta).toBeNull();
    expect(subidas).toHaveLength(0);
  });

  it('el completo que entra se sube y devuelve su ruta', async () => {
    const { db, subidas } = storageFalso();
    const ruta = await subirCompletoSiEntra(db, 'n1/paquete/audiolibro_completo.mp3', Buffer.alloc(2048));
    expect(ruta).toBe('n1/paquete/audiolibro_completo.mp3');
    expect(subidas).toEqual([{ ruta: 'n1/paquete/audiolibro_completo.mp3', bytes: 2048 }]);
  });

  it('un error de Storage que NO es de tamaño sigue tirando (no se confunde con "no entra")', async () => {
    const { db } = storageFalso({ message: 'fetch failed' });
    await expect(subirCompletoSiEntra(db, 'n1/paquete/audiolibro_completo.mp3', Buffer.alloc(2048)))
      .rejects.toThrow('No se pudo subir n1/paquete/audiolibro_completo.mp3: fetch failed');
  });
});
