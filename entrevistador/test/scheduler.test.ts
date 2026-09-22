import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  generarPreguntasAdaptativas: vi.fn(),
  enviarPlantilla: vi.fn(),
  enviarTexto: vi.fn(),
  enviarAudioPorLink: vi.fn(),
  generarReconocimiento: vi.fn(),
  generarPreguntaReemplazo: vi.fn(),
  armarHistoria: vi.fn(),
  ultimaTranscripcion: vi.fn(),
  // Filas que devuelve la base falsa, configurables por test.
  filas: {
    narradores: [] as any[],
    envios: [] as any[],
    respuestas: [] as any[],
    preguntas: [{ texto: 'PREGUNTA_1', capitulo: 'La infancia', narrador_id: null }] as any[],
    familias: { nombre: 'Martina' } as any,
  },
  capturas: [] as any[],
  ultimoOrden: 26,
}));

// Base falsa: builder encadenable que recuerda los filtros y resuelve por tabla.
vi.mock('../src/db/cliente.js', () => {
  function crearBuilder(tabla: string) {
    const b: any = { _op: 'select', _filtros: {} as Record<string, any> };
    const eq = (col: string, val: any) => { b._filtros[col] = val; return b; };
    b.select = () => b; b.or = () => b; b.is = () => b; b.order = () => b; b.limit = () => b; b.in = eq;
    b.eq = eq;
    b.insert = (p: any) => { b._op = 'insert'; mocks.capturas.push({ op: 'insert', tabla, p }); return b; };
    b.upsert = (p: any) => { b._op = 'upsert'; mocks.capturas.push({ op: 'upsert', tabla, p }); return b; };
    b.update = (p: any) => { b._op = 'update'; mocks.capturas.push({ op: 'update', tabla, p }); return b; };
    const resolver = () => {
      if (b._op !== 'select') return { data: null, error: null };
      if (tabla === 'narradores') {
        const estados = b._filtros.estado;
        return { data: estados ? mocks.filas.narradores.filter((n) => estados.includes(n.estado)) : mocks.filas.narradores };
      }
      if (tabla === 'familias') return { data: mocks.filas.familias };
      if (tabla === 'preguntas') {
        const fila = mocks.filas.preguntas[0] ?? null;
        return { data: b._filtros.orden !== undefined ? fila : mocks.filas.preguntas };
      }
      if (tabla === 'envios') {
        return { data: mocks.filas.envios.filter((e) =>
          e.tipo === b._filtros.tipo &&
          (b._filtros.pregunta_orden === undefined || e.pregunta_orden === b._filtros.pregunta_orden)) };
      }
      if (tabla === 'respuestas') {
        return { data: mocks.filas.respuestas.filter((r) => r.pregunta_orden === b._filtros.pregunta_orden) };
      }
      return { data: null };
    };
    b.single = () => Promise.resolve(resolver());
    b.maybeSingle = () => Promise.resolve(resolver());
    b.then = (res: any, rej: any) => Promise.resolve(resolver()).then(res, rej);
    return b;
  }
  return {
    db: {
      from: (t: string) => crearBuilder(t),
      storage: { from: () => ({
        upload: vi.fn(async () => ({ error: null })),
        createSignedUrl: vi.fn(async () => ({ data: { signedUrl: 'https://firmada/audio.mp3' } })),
      }) },
    },
  };
});

vi.mock('../src/whatsapp/enviar.js', () => ({
  enviarPlantilla: mocks.enviarPlantilla, enviarAudioPorLink: mocks.enviarAudioPorLink, enviarTexto: mocks.enviarTexto,
}));
vi.mock('../src/ia/cerebro.js', () => ({
  generarReconocimiento: mocks.generarReconocimiento,
  generarPreguntaReemplazo: mocks.generarPreguntaReemplazo,
  evaluarRespuesta: vi.fn(), detectarIntencion: vi.fn(),
}));
vi.mock('../src/ia/adaptativas.js', () => ({
  generarPreguntasAdaptativas: mocks.generarPreguntasAdaptativas,
  PRIMERA_ADAPTATIVA: 27, ULTIMA_ADAPTATIVA: 30,
}));
// El guion propio (14/09): se lee por estas funciones, no con .or() sobre la tabla.
vi.mock('../src/db/guion.js', () => ({
  preguntaDeOrden: async (_id: string, orden: number) => {
    const fila = mocks.filas.preguntas[0] ?? null;
    return fila ? { id: 'p', orden, tipo: 'fija', foto_id: null, ...fila } : null;
  },
  ultimoOrden: async () => mocks.ultimoOrden,
  tieneAdaptativas: async () => mocks.filas.preguntas.some((p: any) => p.tipo === 'adaptativa'),
  capitulosDe: async () => [...new Set(mocks.filas.preguntas.map((p: any) => p.capitulo))],
}));
vi.mock('../src/mail/hitos.js', () => ({ mandarHito: vi.fn() }));
vi.mock('../src/db/historia.js', () => ({
  armarHistoria: mocks.armarHistoria, ultimaTranscripcion: mocks.ultimaTranscripcion, traerRespuestas: vi.fn(),
}));

import { tick, esHoraDeEnviar, fechaLocal } from '../src/flujo/scheduler.js';
import { capituloNoAplica, edadDe } from '../src/flujo/preguntar.js';

const ZONA = 'America/Argentina/Buenos_Aires';
// 2026-09-01 13:05 UTC = 10:05 en Buenos Aires (dentro de la ventana de las 10:00).
const A_LAS_10_05 = new Date('2026-09-01T13:05:00Z');

const narrador = (extra: Record<string, any> = {}) => ({
  id: 'n1', familia_id: 'f1', como_le_dicen: 'Don Osvaldo', telefono_whatsapp: '+5491155551234',
  hora_preferida: '10:00:00', zona_horaria: ZONA, contexto: {}, estado: 'activo',
  dia_actual: 0, ultima_respuesta_at: null, alerta_silencio: false, ...extra,
});
const update = (tabla: string) => mocks.capturas.find((c) => c.op === 'update' && c.tabla === tabla);
const inserts = (tabla: string) => mocks.capturas.filter((c) => c.op === 'insert' && c.tabla === tabla);

beforeEach(() => {
  mocks.filas.narradores = [];
  mocks.filas.envios = [];
  mocks.filas.respuestas = [];
  mocks.filas.preguntas = [{ texto: 'PREGUNTA_1', capitulo: 'La infancia', narrador_id: null }];
  mocks.capturas = [];
  mocks.ultimoOrden = 26;
  for (const fn of Object.values(mocks)) if (typeof fn === 'function' && 'mockReset' in fn) (fn as any).mockReset();
  mocks.enviarPlantilla.mockResolvedValue('wamid.p');
  mocks.enviarTexto.mockReset().mockResolvedValue('wamid.t');
  mocks.enviarAudioPorLink.mockResolvedValue('wamid.a');
  mocks.generarReconocimiento.mockResolvedValue('Qué historia la del taller.');
  mocks.armarHistoria.mockResolvedValue('');
  mocks.ultimaTranscripcion.mockResolvedValue('');
});

describe('helpers de tiempo', () => {
  it('la ventana de envío son los 15 min siguientes a la hora preferida', () => {
    expect(esHoraDeEnviar('10:00:00', ZONA, A_LAS_10_05)).toBe(true);
    expect(esHoraDeEnviar('10:00:00', ZONA, new Date('2026-09-01T13:20:00Z'))).toBe(false); // 10:20
    expect(esHoraDeEnviar('10:00:00', ZONA, new Date('2026-09-01T12:50:00Z'))).toBe(false); // 09:50
  });
  it('la fecha local respeta la zona horaria', () => {
    // 2026-09-02 01:00 UTC sigue siendo el 1 de septiembre en Buenos Aires.
    expect(fechaLocal(new Date('2026-09-02T01:00:00Z'), ZONA)).toBe('2026-09-01');
  });
  it('detecta los capítulos que no aplican a esta vida', () => {
    expect(capituloNoAplica({ arbol: { hijos: 'no tuvo' } }, 'Los hijos')).toBe(true);
    expect(capituloNoAplica({ arbol: { conyuge: 'no tuvo' } }, 'El amor')).toBe(true);
    expect(capituloNoAplica({ arbol: { hijos: 'Ana, Pedro' } }, 'Los hijos')).toBe(false);
  });

  // Bitácora 20-27: las fijas suponen boda, hijos y nietos. Con la ficha
  // (año de nacimiento) se puede saber ANTES de preguntar que no aplica.
  describe('capituloNoAplica con la ficha (edad)', () => {
    const HOY = new Date('2026-09-20T12:00:00Z');
    it('la edad sale del año de nacimiento; sin año, no se sabe', () => {
      expect(edadDe({ anioNacimiento: 1998 }, HOY)).toBe(28);
      expect(edadDe({ anioNacimiento: '1939' }, HOY)).toBe(87);
      expect(edadDe({}, HOY)).toBeNull();
      expect(edadDe({ anioNacimiento: 1800 }, HOY)).toBeNull(); // un dato roto no decide nada
    });
    it('menor de 25 sin hijos en el árbol: «Los hijos» no aplica', () => {
      expect(capituloNoAplica({ anioNacimiento: 2004 }, 'Los hijos', HOY)).toBe(true);
      expect(capituloNoAplica({ anioNacimiento: 2004, arbol: { padres: 'Juan y Rosa' } }, 'Los hijos', HOY)).toBe(true);
    });
    it('pero si la familia cargó hijos, la edad no manda', () => {
      expect(capituloNoAplica({ anioNacimiento: 2004, arbol: { hijos: 'Mateo' } }, 'Los hijos', HOY)).toBe(false);
    });
    it('a los 28 sin hijos cargados no se decide por la edad: ante la duda, no toca nada', () => {
      expect(capituloNoAplica({ anioNacimiento: 1998 }, 'Los hijos', HOY)).toBe(false);
    });
    it('menor de 18: tampoco «El amor», salvo que la familia haya cargado pareja', () => {
      expect(capituloNoAplica({ anioNacimiento: 2010 }, 'El amor', HOY)).toBe(true);
      expect(capituloNoAplica({ anioNacimiento: 2010, arbol: { conyuge: 'Sofi' } }, 'El amor', HOY)).toBe(false);
      expect(capituloNoAplica({ anioNacimiento: 1998 }, 'El amor', HOY)).toBe(false);
    });
    it('los demás capítulos nunca se descartan', () => {
      expect(capituloNoAplica({ anioNacimiento: 2010 }, 'La infancia', HOY)).toBe(false);
    });
  });
});

describe('tick', () => {
  it('(a) a su hora le llega la pregunta siguiente y dia_actual avanza', async () => {
    mocks.filas.narradores = [narrador({ estado: 'acepto', dia_actual: 0 })];
    await tick(A_LAS_10_05);
    expect(mocks.enviarPlantilla).toHaveBeenCalledWith(
      '+5491155551234', 'pregunta_diaria', ['PREGUNTA_1'],
    );
    expect(update('narradores')?.p).toMatchObject({ dia_actual: 1, estado: 'activo' });
    expect(inserts('envios')[0].p).toMatchObject({ tipo: 'pregunta', pregunta_orden: 1 });
  });

  // 22/09 (decisión de Joaquín): la pregunta del día va SOLO en texto. El audio
  // venía de arrastre del primer scheduler (1/09) y nunca se decidió: duplicaba
  // el mensaje, costaba TTS por pregunta y rompió la primera noche de Nako.
  it('(a0) la pregunta del día va solo en texto: no se manda ningún audio', async () => {
    mocks.filas.narradores = [narrador({ estado: 'acepto', dia_actual: 0 })];
    await tick(A_LAS_10_05);
    expect(mocks.enviarPlantilla).toHaveBeenCalledTimes(1);
    expect(mocks.enviarAudioPorLink).not.toHaveBeenCalled();
  });

  // 21/09: las plantillas de la cuenta nueva están en revisión. Si Meta rechaza la
  // plantilla, la pregunta se reintenta como texto: si el narrador escribió en las
  // últimas 24 hs (Nako escribe "hola" y SÍ la misma noche), Meta lo acepta.
  it('(a2) si la plantilla falla, la pregunta sale como texto y el envío queda registrado', async () => {
    mocks.filas.narradores = [narrador({ estado: 'acepto', dia_actual: 0 })];
    mocks.enviarPlantilla.mockRejectedValue(new Error('WhatsApp rechazó el envío: Template name does not exist'));
    await tick(A_LAS_10_05);
    expect(mocks.enviarTexto).toHaveBeenCalledTimes(1);
    expect(mocks.enviarTexto.mock.calls[0][0]).toBe('+5491155551234');
    expect(mocks.enviarTexto.mock.calls[0][1]).toContain('PREGUNTA_1');
    expect(update('narradores')?.p).toMatchObject({ dia_actual: 1, estado: 'activo' });
    expect(inserts('envios')[0].p).toMatchObject({ tipo: 'pregunta', pregunta_orden: 1 });
  });

  it('(a3) si la plantilla falla y el texto también (ventana cerrada), no se registra nada', async () => {
    mocks.filas.narradores = [narrador({ estado: 'acepto', dia_actual: 0 })];
    mocks.enviarPlantilla.mockRejectedValue(new Error('WhatsApp rechazó el envío: template'));
    mocks.enviarTexto.mockRejectedValue(new Error('WhatsApp rechazó el envío: Re-engagement message'));
    await tick(A_LAS_10_05);
    expect(inserts('envios')).toEqual([]);
    expect(update('narradores')).toBeUndefined();
  });

  it('(b) si ya se envió esa pregunta hoy, no se reenvía (idempotencia del cron)', async () => {
    mocks.filas.narradores = [narrador({ estado: 'activo', dia_actual: 0 })];
    mocks.filas.envios = [{ tipo: 'pregunta', pregunta_orden: 1, enviado_at: '2026-09-01T13:00:00Z' }];
    await tick(A_LAS_10_05);
    expect(mocks.enviarPlantilla).not.toHaveBeenCalled();
  });

  it('(c) si la pregunta vigente no fue respondida, reenvía la MISMA y no avanza', async () => {
    mocks.filas.narradores = [narrador({ estado: 'activo', dia_actual: 4 })];
    mocks.filas.respuestas = []; // la 4 sigue sin respuesta
    mocks.filas.envios = [{ tipo: 'pregunta', pregunta_orden: 4, enviado_at: '2026-08-31T13:00:00Z' }]; // ayer
    await tick(A_LAS_10_05);
    expect(inserts('envios')[0].p).toMatchObject({ tipo: 'pregunta', pregunta_orden: 4 });
    expect(update('narradores')?.p).toMatchObject({ dia_actual: 4 });
  });

  it('(e) si un narrador falla, los demás reciben igual su pregunta', async () => {
    mocks.filas.narradores = [
      narrador({ id: 'roto', estado: 'activo', dia_actual: 0, telefono_whatsapp: '+5491100000000' }),
      narrador({ id: 'sano', estado: 'activo', dia_actual: 0, telefono_whatsapp: '+5491155551234' }),
    ];
    // El primero explota (token vencido, WhatsApp lo rechaza); el segundo tiene que salir igual.
    mocks.enviarPlantilla
      .mockRejectedValueOnce(new Error('WhatsApp rechazó el envío: token vencido'))
      .mockResolvedValue('wamid.p');
    await tick(A_LAS_10_05);
    expect(mocks.enviarPlantilla).toHaveBeenCalledTimes(2);
    expect(mocks.enviarPlantilla).toHaveBeenLastCalledWith(
      '+5491155551234', 'pregunta_diaria', expect.any(Array),
    );
  });

  it('(d) tres días de silencio prenden la alerta para la familia', async () => {
    mocks.filas.narradores = [narrador({
      estado: 'activo', dia_actual: 7, ultima_respuesta_at: '2026-08-27T10:00:00Z', alerta_silencio: false,
    })];
    mocks.filas.envios = [{ tipo: 'pregunta', pregunta_orden: 7, enviado_at: '2026-09-01T13:00:00Z' }];
    await tick(A_LAS_10_05);
    const alerta = mocks.capturas.filter((c) => c.op === 'update' && c.tabla === 'narradores')
      .find((c) => c.p.alerta_silencio === true);
    expect(alerta).toBeTruthy();
  });

  it('(f) si faltan las adaptativas, las regenera en vez de dejarlo clavado en el día 26', async () => {
    mocks.filas.narradores = [narrador({ estado: 'activo', dia_actual: 26 })];
    mocks.filas.respuestas = [{ pregunta_orden: 26 }]; // ya respondió la 26 → toca la 27
    mocks.filas.preguntas = [];                        // pero las 27-30 no se generaron
    // Al regenerarlas aparecen en la base: el envío tiene que salir igual.
    mocks.generarPreguntasAdaptativas.mockImplementation(async () => {
      mocks.filas.preguntas = [{ texto: 'PREGUNTA_27', capitulo: 'Las raíces', narrador_id: 'n1' }];
    });
    await tick(A_LAS_10_05);
    expect(mocks.generarPreguntasAdaptativas).toHaveBeenCalledWith('n1');
    expect(mocks.enviarPlantilla).toHaveBeenCalledWith(
      '+5491155551234', 'pregunta_diaria', ['PREGUNTA_27'],
    );
  });
});

describe('el latido del tick', () => {
  it('se anota ANTES de las fases: el servicio no puede verse caído mientras trabaja', async () => {
    mocks.filas.narradores = [narrador({ estado: 'activo', dia_actual: 5 })];

    await tick(A_LAS_10_05);

    expect(mocks.capturas[0]).toMatchObject({ op: 'upsert', tabla: 'latidos' });
    expect(mocks.capturas[0].p).toMatchObject({ servicio: 'entrevistador' });
  });
});
