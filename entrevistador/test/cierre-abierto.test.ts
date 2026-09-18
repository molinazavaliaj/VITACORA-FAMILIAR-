import { describe, it, expect, vi, beforeEach } from 'vitest';

// La pregunta de cierre (18/09): las tres salidas y el tope de dos vueltas.
const mocks = vi.hoisted(() => ({
  clasificarCierre: vi.fn(),
  enviarPregunta: vi.fn(),
  estado: { ultimoOrden: 30, contexto: {} as Record<string, any>, capturas: [] as any[], pregunta: { id: 'q31', orden: 31 } as any },
}));

vi.mock('../src/db/cliente.js', () => {
  function builder(tabla: string) {
    const b: any = { _op: 'select', _p: null };
    const enc = () => b;
    b.select = enc; b.eq = enc; b.limit = enc; b.order = enc;
    b.insert = (p: any) => { b._op = 'insert'; b._p = p; return b; };
    b.update = (p: any) => { b._op = 'update'; b._p = p; return b; };
    b.delete = () => { b._op = 'delete'; return b; };
    const resolver = () => {
      if (b._op !== 'select') { mocks.estado.capturas.push({ tabla, op: b._op, p: b._p }); return { data: null, error: null }; }
      if (tabla === 'narradores') return { data: { contexto: mocks.estado.contexto } };
      if (tabla === 'respuestas') return { data: [{ id: 'r1', audio_path: 'n1/dia_31.ogg' }] };
      return { data: [] };
    };
    b.maybeSingle = () => Promise.resolve(resolver());
    b.then = (res: any, rej: any) => Promise.resolve(resolver()).then(res, rej);
    return b;
  }
  return { db: { from: (t: string) => builder(t), storage: { from: () => ({ remove: vi.fn(async () => ({ error: null })) }) } } };
});
vi.mock('../src/db/guion.js', () => ({
  ultimoOrden: async () => mocks.estado.ultimoOrden,
  capitulosDe: async () => ['La infancia', 'El oficio', 'Los hijos'],
  preguntaDeOrden: async () => mocks.estado.pregunta,
}));
vi.mock('../src/db/historia.js', () => ({ armarHistoria: async () => 'HISTORIA' }));
vi.mock('../src/ia/cerebro.js', () => ({ clasificarCierre: mocks.clasificarCierre }));
vi.mock('../src/ia/trato.js', () => ({ tratoDe: async () => 'usted' }));
vi.mock('../src/ia/evitar.js', () => ({ textoEvitar: () => '' }));
vi.mock('../src/flujo/preguntar.js', () => ({
  enviarPregunta: mocks.enviarPregunta,
  ritmoDe: (c: any) => (c?.ritmo ?? (c?.modoRapido ? 'seguido' : 'diario')),
}));

import { faseDeCierre, textoDeCierre, VUELTAS_MAXIMO } from '../src/flujo/cierre-abierto.js';

const narrador = (contexto: Record<string, any>) => ({
  id: 'n1', familia_id: 'f', como_le_dicen: 'Babu', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00',
  zona_horaria: 'America/Argentina/Buenos_Aires', contexto, estado: 'activo', dia_actual: 30, ultima_respuesta_at: null, alerta_silencio: false,
});
const inserts = () => mocks.estado.capturas.filter((c) => c.op === 'insert' && c.tabla === 'preguntas');
const updatesPreguntas = () => mocks.estado.capturas.filter((c) => c.op === 'update' && c.tabla === 'preguntas');
const deletes = (t: string) => mocks.estado.capturas.filter((c) => c.op === 'delete' && c.tabla === t);

beforeEach(() => {
  mocks.estado.capturas = [];
  mocks.estado.ultimoOrden = 30;
  mocks.estado.contexto = {};
  mocks.clasificarCierre.mockReset();
  mocks.enviarPregunta.mockReset();
});

describe('faseDeCierre', () => {
  it('al responder la última adaptativa, ofrece la pregunta de cierre (orden 31) y la manda ya en modo seguido', async () => {
    const n = narrador({ ritmo: 'seguido' });
    expect(await faseDeCierre(n, 30, 'lo último que conté')).toBe(true);
    expect(inserts()[0].p).toMatchObject({ orden: 31, tipo: 'adaptativa', texto: textoDeCierre(1, 'usted') });
    expect(n.contexto.cierre).toEqual({ vueltas: 1, ordenes: [31] });
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 31, { plantilla: false });
  });

  it('en ritmo diario la inserta pero no la manda: la manda el scheduler a su hora', async () => {
    const n = narrador({ ritmo: 'diario' });
    expect(await faseDeCierre(n, 30, '…')).toBe(true);
    expect(inserts()).toHaveLength(1);
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
  });

  it('"no, está todo": borra la respuesta y la pregunta, y se despide', async () => {
    const n = narrador({ cierre: { vueltas: 1, ordenes: [31] } });
    mocks.estado.ultimoOrden = 31;
    mocks.clasificarCierre.mockResolvedValue({ tipo: 'nada' });
    expect(await faseDeCierre(n, 31, 'No, está todo.')).toBe(false);
    expect(deletes('respuestas')).toHaveLength(1);
    expect(deletes('preguntas')).toHaveLength(1);
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
  });

  it('contó algo: la pregunta se reescribe con su capítulo y, si quedan vueltas, ofrece "¿algo más?"', async () => {
    const n = narrador({ cierre: { vueltas: 1, ordenes: [31] }, ritmo: 'seguido' });
    mocks.estado.ultimoOrden = 31;
    mocks.clasificarCierre.mockResolvedValue({ tipo: 'conto', pregunta: '¿Cómo era su abuela Rosa?', capitulo: 'La infancia' });
    expect(await faseDeCierre(n, 31, 'Me faltó contarte de mi abuela Rosa, que…')).toBe(true);
    expect(updatesPreguntas()[0].p).toEqual({ texto: '¿Cómo era su abuela Rosa?', capitulo: 'La infancia' });
    expect(deletes('respuestas')).toHaveLength(0);
    expect(inserts()[0].p).toMatchObject({ orden: 32, texto: textoDeCierre(2, 'usted') });
    expect(n.contexto.cierre).toEqual({ vueltas: 2, ordenes: [31, 32] });
  });

  it('nombró un tema: esa misma orden se convierte en la pregunta sobre el tema y sale ya; su "preguntame por…" se borra', async () => {
    const n = narrador({ cierre: { vueltas: 1, ordenes: [31] }, ritmo: 'diario' });
    mocks.estado.ultimoOrden = 31;
    mocks.clasificarCierre.mockResolvedValue({ tipo: 'tema', tema: 'el barco', pregunta: '¿Cómo fueron esos años en el barco?', capitulo: 'El oficio' });
    expect(await faseDeCierre(n, 31, 'Preguntame por el barco.')).toBe(true);
    expect(updatesPreguntas()[0].p).toEqual({ texto: '¿Cómo fueron esos años en el barco?', capitulo: 'El oficio' });
    expect(deletes('respuestas')).toHaveLength(1);
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.anything(), 31, { plantilla: false });
    expect(n.contexto.cierre).toEqual({ vueltas: 1, ordenes: [] }); // ya no es "de cierre": su respuesta se evalúa normal
  });

  it(`después de ${VUELTAS_MAXIMO} vueltas no ofrece más: se despide`, async () => {
    const n = narrador({ cierre: { vueltas: 2, ordenes: [32] } });
    mocks.estado.ultimoOrden = 32;
    mocks.clasificarCierre.mockResolvedValue({ tipo: 'conto', pregunta: '¿…?', capitulo: 'Los hijos' });
    expect(await faseDeCierre(n, 32, 'y también…')).toBe(false);
    expect(inserts()).toHaveLength(0);
  });
});
