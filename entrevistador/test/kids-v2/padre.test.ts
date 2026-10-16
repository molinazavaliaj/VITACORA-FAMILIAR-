import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { procesarPadreKids, TEXTO_AL_PADRE, textoAlPadre } from '../../src/kids-v2/padre.js';
import { procesarEntranteKids } from '../../src/kids-v2/entrante.js';
import { tickKids } from '../../src/kids-v2/reloj.js';
import type { FilaKids } from '../../src/kids-v2/tipos.js';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';
import { baseConChico, CHICO, depsKidsDePrueba, FICHA_A, filaKidsNueva, llega, TEL_PADRE } from './deps-prueba.js';

// El padre de un chico de canal A que le escribe al número del bot (decisión de Naza del 15/10). Chicos INVENTADOS.
const fila = (b: ReturnType<typeof baseConChico>, i = 0) => b.tablas.kids_v2[i] as FilaKids;
let n = 0;
const delPadre = (m: Partial<MensajeEntrante> = {}): MensajeEntrante =>
  ({ telefono: TEL_PADRE, tipo: 'texto', texto: 'Hola, ¿cómo va Bruno?', waMessageId: `wamid.padre.${++n}`, ...m });

beforeEach(() => { vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', '*'); });
afterEach(() => { vi.unstubAllEnvs(); });

/** Un chico de canal A que ya arrancó (salieron la bienvenida y el aviso al padre). */
async function arrancado() {
  const b = baseConChico();
  const t = depsKidsDePrueba(b);
  await tickKids(t.deps);
  expect(fila(b).estado).not.toBeNull();
  t.enviados.length = 0;
  t.avisos.length = 0;
  return { b, t };
}

describe('kids: el padre de canal A le escribe al bot', () => {
  it('el texto es el aprobado por Naza, con el apodo', () => {
    expect(TEXTO_AL_PADRE).toBe('Este número es para las preguntas de {apodo}. Lo que cuenta lo ves en tu panel.');
    expect(textoAlPadre('Bruno')).toBe('Este número es para las preguntas de Bruno. Lo que cuenta lo ves en tu panel.');
  });

  it('el padre de un chico en catalán: no hay texto aprobado en catalán, no se le contesta (nunca en castellano) y se avisa', async () => {
    expect(textoAlPadre('Jana', 'ca')).toBeNull();
    expect(textoAlPadre('Lucía', 'es-ES')).toBe('Este número es para las preguntas de Lucía. Lo que cuenta lo ves en tu panel.');
    const b = baseConChico({ ficha: { idioma: 'ca', quienRegala: 'la teva mare', apodo: 'Jana' } });
    b.tablas.kids_v2[0].idioma = 'ca';
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    t.enviados.length = 0;
    t.avisos.length = 0;
    expect(await procesarPadreKids(t.deps, delPadre())).toBe('sin-texto');
    expect(t.enviados).toEqual([]);
    expect(fila(b).estado!.respondioAlPadre).toBeFalsy();
    expect(t.avisos).toHaveLength(1);
    expect(t.avisos[0].detalle).toContain('no hay texto aprobado');
  });

  it('se le contesta una vez, como texto, y los socios se enteran de lo que escribió', async () => {
    const { b, t } = await arrancado();
    expect(await procesarPadreKids(t.deps, delPadre())).toBe('contestado');
    expect(t.enviados).toEqual([{ a: TEL_PADRE, tipo: 'texto', texto: textoAlPadre('Bruno'), wamid: expect.any(String) }]);
    expect(fila(b).estado!.respondioAlPadre).toBe(true);
    expect(b.tablas.envios.filter((e) => e.wa_message_id === t.enviados[0].wamid)).toMatchObject([{ narrador_id: 'k1', tipo: 'kids' }]);
    expect(t.avisos).toHaveLength(1);
    expect(t.avisos[0].detalle).toContain('Hola, ¿cómo va Bruno?');
    expect(t.avisos[0].detalle).toContain(TEL_PADRE);
  });

  it('la segunda vez no se le contesta, pero los socios igual se enteran', async () => {
    const { t } = await arrancado();
    await procesarPadreKids(t.deps, delPadre());
    expect(await procesarPadreKids(t.deps, delPadre({ texto: 'Otra cosa' }))).toBe('ya-contestado');
    expect(t.enviados).toHaveLength(1);
    expect(t.avisos).toHaveLength(2);
    expect(t.avisos[1].detalle).toContain('Otra cosa');
  });

  it('dos mensajes juntos contestan una sola vez', async () => {
    const { t } = await arrancado();
    const r = await Promise.all([procesarPadreKids(t.deps, delPadre()), procesarPadreKids(t.deps, delPadre())]);
    expect(r.sort()).toEqual(['contestado', 'ya-contestado']);
    expect(t.enviados).toHaveLength(1);
  });

  it('lo que manda no entra al motor ni a respuestas', async () => {
    const { b, t } = await arrancado();
    const motorAntes = JSON.stringify(fila(b).estado!.motor);
    await procesarPadreKids(t.deps, delPadre());
    await procesarPadreKids(t.deps, delPadre({ tipo: 'audio', mediaId: 'Un audio del padre', texto: undefined }));
    await procesarPadreKids(t.deps, delPadre({ tipo: 'imagen', mediaId: 'foto', texto: undefined }));
    const f = fila(b);
    expect(JSON.stringify(f.estado!.motor)).toBe(motorAntes);
    expect(f.estado!.recibidos).toEqual([]);
    expect(f.estado!.salida).toEqual([]);
    expect(b.tablas.respuestas).toEqual([]);
    expect(b.tablas.fotos).toEqual([]);
    expect(t.avisos[1].detalle).toContain('Un audio del padre');
    // Y el chico sigue como siempre después.
    await procesarEntranteKids(t.deps, CHICO, llega({ tipo: 'texto', texto: 'Dale', esBoton: true }));
    expect(fila(b).estado!.respondioAlPadre).toBe(true);
  });

  it('si WhatsApp falla, no queda como contestado: el próximo mensaje lo vuelve a intentar', async () => {
    const { b, t } = await arrancado();
    t.fallar(1);
    expect(await procesarPadreKids(t.deps, delPadre())).toBe('fallo-envio');
    expect(fila(b).estado!.respondioAlPadre).toBe(false);
    expect(t.avisos[0].detalle).toMatch(/falló/);
    expect(await procesarPadreKids(t.deps, delPadre())).toBe('contestado');
    expect(t.enviados).toHaveLength(1);
  });

  it('padre de dos chicos de canal A: no se le contesta y se avisa a los socios', async () => {
    const b = baseConChico();
    b.tablas.narradores.push({ id: 'k2', nombre: 'Martina Ibáñez', como_le_dicen: 'Martu', telefono_whatsapp: '+5491150000003', estado: 'invitado', contexto: { modo: 'kids' } });
    b.tablas.kids_v2.push(filaKidsNueva('k2', { ...FICHA_A, nombre: 'Martina Ibáñez', apodo: 'Martu', genero: 'chica' }));
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    t.enviados.length = 0;
    t.avisos.length = 0;
    expect(await procesarPadreKids(t.deps, delPadre())).toBe('varios');
    expect(t.enviados).toEqual([]);
    expect(t.avisos).toHaveLength(1);
    expect(t.avisos[0].detalle).toContain('Bruno');
    expect(t.avisos[0].detalle).toContain('Martu');
    expect(t.avisos[0].detalle).toMatch(/no se le contestó/);
    expect(fila(b, 0).estado!.respondioAlPadre).toBeUndefined();
    expect(fila(b, 1).estado!.respondioAlPadre).toBeUndefined();
  });

  it('el número de Meta sin el 9 también se reconoce', async () => {
    const { t } = await arrancado();
    expect(await procesarPadreKids(t.deps, delPadre({ telefono: TEL_PADRE.replace('+549', '+54') }))).toBe('contestado');
    expect(t.enviados[0].a).toBe(TEL_PADRE);
  });

  it('antes del arranque no se contesta (no hay dónde recordarlo) y se avisa', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    expect(await procesarPadreKids(t.deps, delPadre())).toBe('sin-arrancar');
    expect(t.enviados).toEqual([]);
    expect(t.avisos).toHaveLength(1);
    expect(fila(b).estado).toBeNull();
  });

  it('con el chico en pendiente_pago no es un padre de Kids: sigue como hoy', async () => {
    const b = baseConChico({ estado: 'pendiente_pago' });
    const t = depsKidsDePrueba(b);
    expect(await procesarPadreKids(t.deps, delPadre())).toBe('no-es-padre');
    expect(t.avisos).toEqual([]);
  });

  it('canal B no tiene padre aparte: no es esto', async () => {
    const b = baseConChico({ canal: 'B' });
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    t.enviados.length = 0;
    expect(await procesarPadreKids(t.deps, delPadre())).toBe('no-es-padre');
    expect(t.enviados).toEqual([]);
  });

  it('un número que no es padre de nadie: nada', async () => {
    const { t } = await arrancado();
    expect(await procesarPadreKids(t.deps, delPadre({ telefono: '+5491199999999' }))).toBe('no-es-padre');
    expect(t.enviados).toEqual([]);
    expect(t.avisos).toEqual([]);
  });

  it('sin la migración (kids_v2 no existe) nada cambia', async () => {
    const b = baseConChico();
    b.ausentes.add('kids_v2');
    const t = depsKidsDePrueba(b);
    expect(await procesarPadreKids(t.deps, delPadre())).toBe('no-es-padre');
    expect(t.enviados).toEqual([]);
    expect(t.avisos).toEqual([]);
  });
});
