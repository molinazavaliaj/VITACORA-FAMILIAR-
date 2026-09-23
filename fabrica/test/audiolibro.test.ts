import { describe, it, expect } from 'vitest';
import {
  subirMp3, subirCompletoSiEntra, entraEnStorage, LIMITE_BYTES_ARCHIVO_STORAGE,
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
