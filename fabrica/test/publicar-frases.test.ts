import { describe, expect, it } from 'vitest';
import {
  FRASES_CON_AUDIO,
  leerFrases,
  publicarFrases,
  RUTA_FRASES_JSON,
  RUTA_FRASES_PEDIDO,
} from '../src/libro/publicar-frases.js';
import type { FrasesJson } from '../src/libro/frases.js';

type Subida = { ruta: string; contenido: string; contentType?: string; cacheControl?: string };

function dbFalso(subidas: Subida[], archivos: Record<string, string> = {}) {
  return {
    storage: {
      from: () => ({
        upload: async (
          ruta: string,
          contenido: unknown,
          opciones?: { contentType?: string; cacheControl?: string }
        ) => {
          subidas.push({
            ruta,
            contenido: String(contenido),
            contentType: opciones?.contentType,
            cacheControl: opciones?.cacheControl,
          });
          return { error: null };
        },
        download: async (ruta: string) =>
          archivos[ruta] !== undefined
            ? { data: { text: async () => archivos[ruta] }, error: null }
            : { data: null, error: { message: 'Object not found' } },
      }),
    },
  } as never;
}

const candidata = {
  id: 'sf-1',
  texto: 'Yo creo en las causalidades y no en las casualidades.',
  origen: 'sus-frases' as const,
  grupo: 'suyas' as const,
  respuesta_id: 'r1',
  pregunta_orden: 3,
  por_que: 'su filosofía',
  elegida: true,
  elegida_por: 'modelo' as const,
  estado: 'pendiente' as const,
  audio_path: null,
  segundos: null,
  inicio: null,
  fin: null,
};

const conFrases: FrasesJson = {
  version: 1,
  narrador_id: 'n1',
  pedido_id: 'p1',
  confirmado_at: null,
  capitulos: [{ numero: 1, capitulo: 'La infancia', candidatas: [candidata] }],
};

const sinFrases: FrasesJson = { ...conFrases, capitulos: [] };

describe('publicarFrases', () => {
  it('sube el JSON y deja el pedido de corte cuando hay algo para cortar', async () => {
    const subidas: Subida[] = [];
    await publicarFrases(dbFalso(subidas), conFrases);

    expect(subidas.map((s) => s.ruta)).toEqual([RUTA_FRASES_JSON('n1'), RUTA_FRASES_PEDIDO('n1')]);
    expect(subidas[0].contentType).toBe('application/json');
    expect(JSON.parse(subidas[0].contenido)).toMatchObject({ narrador_id: 'n1', confirmado_at: null });
    expect(FRASES_CON_AUDIO(conFrases)).toBe(1);
    // Y sin caché: el bucket sirve copias cacheadas y este archivo lo leen también la web y
    // el worker de la PC de audio (una lectura vieja puede hacer que uno pise al otro).
    expect(subidas.map((s) => s.cacheControl)).toEqual(['0', '0']);
  });

  it('sin candidatas sube el JSON pero no deja pedido (no se le pide a la PC un trabajo vacío)', async () => {
    const subidas: Subida[] = [];
    await publicarFrases(dbFalso(subidas), sinFrases);

    expect(subidas.map((s) => s.ruta)).toEqual([RUTA_FRASES_JSON('n1')]);
    expect(subidas[0].cacheControl).toBe('0');
    expect(FRASES_CON_AUDIO(sinFrases)).toBe(0);
  });
});

describe('leerFrases', () => {
  it('devuelve lo que dejó la fábrica (y lo que completó el worker)', async () => {
    const frases = { ...conFrases, capitulos: [{ ...conFrases.capitulos[0], candidatas: [{ ...candidata, audio_path: 'n1/voz/frases/sf_01.mp3', segundos: 9.4, estado: 'cortada' as const }] }] };
    const leidas = await leerFrases(dbFalso([], { [RUTA_FRASES_JSON('n1')]: JSON.stringify(frases) }), 'n1');
    expect(leidas?.capitulos[0].candidatas[0].audio_path).toBe('n1/voz/frases/sf_01.mp3');
    expect(leidas?.capitulos[0].candidatas[0].estado).toBe('cortada');
  });

  it('devuelve null si no está, y también si está roto (un archivo roto no tumba la entrega)', async () => {
    expect(await leerFrases(dbFalso([]), 'n1')).toBeNull();
    expect(await leerFrases(dbFalso([], { [RUTA_FRASES_JSON('n1')]: '{roto' }), 'n1')).toBeNull();
  });
});
