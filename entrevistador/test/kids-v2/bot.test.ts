import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { procesarEntranteKids } from '../../src/kids-v2/entrante.js';
import { tickKids } from '../../src/kids-v2/reloj.js';
import { SIN_CLAVE_KIDS } from '../../src/kids-v2/nucleo/motor.js';
import type { FilaKids } from '../../src/kids-v2/tipos.js';
import { audio, baseConChico, boton, CHICO, depsKidsDePrueba, llega, TEL_CHICO, TEL_PADRE } from './deps-prueba.js';

// El bot de Kids de punta a punta corta: arranque, entrante y envío, con la base falsa. Chicos INVENTADOS.
const fila = (b: ReturnType<typeof baseConChico>) => b.tablas.kids_v2[0] as FilaKids;
const respuestas = (b: ReturnType<typeof baseConChico>) => b.tablas.respuestas as { wa_message_id: string; clave_kids: string | null; texto_directo?: string; audio_path?: string; transcripcion?: string }[];

beforeEach(() => { vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', '*'); });
afterEach(() => { vi.unstubAllEnvs(); });

describe('kids: el arranque', () => {
  it('sin las plantillas de la bienvenida no arranca y avisa a los socios, siempre con la misma clave', async () => {
    vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', 'kids_bienvenida');
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    await tickKids(t.deps);
    expect(fila(b).estado).toBeNull();
    expect(b.tablas.narradores[0].estado).toBe('invitado');
    expect(t.enviados).toEqual([]);
    expect(t.avisos.map((a) => a.clave)).toEqual(['kids-arranque-k1', 'kids-arranque-k1']);
    expect(t.avisos[0].detalle).toContain('kids_aviso_padre');
  });

  it('canal B solo necesita la bienvenida del padre', async () => {
    vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', 'kids_bienvenida_padre');
    const b = baseConChico({ canal: 'B' });
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    expect(t.enviados.map((e) => [e.a, e.plantilla])).toEqual([[TEL_PADRE, 'kids_bienvenida_padre']]);
    expect(t.enviados[0].variables).toEqual(['Laura', 'Bruno']);
  });

  it('un narrador en pendiente_pago no arranca', async () => {
    const b = baseConChico({ estado: 'pendiente_pago' });
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    expect(fila(b).estado).toBeNull();
    expect(t.enviados).toEqual([]);
  });

  it('los de una simulación los saltea el reloj', async () => {
    const b = baseConChico({ contexto: { simulacion: true } });
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    expect(fila(b).estado).toBeNull();
  });

  it('canal A: la bienvenida al chico y el aviso al padre, como plantillas; queda activo con empezo_at', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    const f = fila(b);
    expect(f.empezo_at).toBe(t.deps.ahora().toISOString());
    expect(b.tablas.narradores[0].estado).toBe('activo');
    expect(t.enviados.map((e) => [e.a, e.tipo, e.plantilla, e.idiomaMeta])).toEqual([
      [TEL_CHICO, 'plantilla', 'kids_bienvenida', 'es'],
      [TEL_PADRE, 'plantilla', 'kids_aviso_padre', 'es'],
    ]);
    expect(t.enviados[0].variables).toEqual(['Bruno', 'tu mamá']);
    expect(f.estado!.salida).toEqual([]);
    expect(f.estado!.enviados).toEqual([{ envio: '1', wamid: 'wamid.salida.1' }, { envio: '2', wamid: 'wamid.salida.2' }]);
    expect(b.tablas.envios.map((e) => [e.tipo, e.wa_message_id])).toEqual([['kids', 'wamid.salida.1'], ['kids', 'wamid.salida.2']]);
    expect(f.avance).toEqual({ capitulo: 0, preguntasPadreAbiertas: true, terminado: false });
    expect(f.enviando_hasta).toBeNull();
    // El tick siguiente no la vuelve a mandar.
    await tickKids(t.deps);
    expect(t.enviados).toHaveLength(2);
  });

  it('de noche arranca igual (empezo_at), pero la bienvenida sale a las 9', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b, { ahora: new Date('2026-11-03T02:00:00Z') }); // 23:00 en Buenos Aires
    await tickKids(t.deps);
    expect(fila(b).empezo_at).not.toBeNull();
    expect(t.enviados).toEqual([]);
    expect(fila(b).despertar_at).toBe('2026-11-03T12:00:00.000Z');
    t.fijar(new Date('2026-11-03T12:00:00Z'));
    await tickKids(t.deps);
    expect(t.enviados.map((e) => e.plantilla)).toEqual(['kids_bienvenida', 'kids_aviso_padre']);
  });

  it('un cambio del panel antes del arranque se aplica a la ficha al crear el estado', async () => {
    const b = baseConChico();
    b.tablas.kids_v2[0].cambios_panel = { hora: '19:30', temasSacados: ['mudanza'], pedido_at: '2026-11-02T14:00:00Z' };
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    const f = fila(b);
    expect(f.estado!.motor.ficha.hora).toBe('19:30');
    expect(f.estado!.motor.guion.some((x) => x.clave === 'K38')).toBe(false);
    expect(f.cambios_panel).toBeNull();
    expect(f.cambios_error).toBeNull();
    expect(f.ficha.hora).toBe('18:00'); // la columna queda como lo que se compró
  });
});

describe('kids: lo que llega', () => {
  it('canal A: del arranque a la respuesta de K1, con su clave', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    t.pasar(10 * 60_000);
    // Toca [Dale, vamos] en la bienvenida (el context.id es el wamid de la plantilla).
    const dale = boton('Dale, vamos', 'wamid.salida.1');
    await procesarEntranteKids(t.deps, CHICO, dale);
    // La entrada del capítulo (texto) y K1 (con [Paso]): la ventana se acaba de abrir.
    const [entrada, k1] = t.enviados.slice(2);
    expect(entrada).toMatchObject({ a: TEL_CHICO, tipo: 'texto' });
    expect(k1).toMatchObject({ a: TEL_CHICO, tipo: 'botones', botones: ['Paso'] });
    expect(fila(b).estado!.enviados.map((x) => x.envio)).toEqual(['1', '2', '3', '4']);
    expect(fila(b).estado!.motor.fase).toMatchObject({ tipo: 'pregunta', clave: 'K1' });
    expect(respuestas(b).find((r) => r.wa_message_id === dale.waMessageId)).toMatchObject({ clave_kids: 'BIEN-CHICO', texto_directo: '⟦botón:Dale, vamos⟧' });
    // Contesta K1 con un audio: queda guardado, transcripto y con su clave.
    t.pasar(3 * 60_000);
    const a = audio('me gusta jugar a la pelota con mis amigos en el club todos los sábados a la tarde');
    await procesarEntranteKids(t.deps, CHICO, a);
    const r = respuestas(b).find((x) => x.wa_message_id === a.waMessageId)!;
    expect(r.clave_kids).toBe('K1');
    expect(r.audio_path).toMatch(/^k1\/dia_02\.ogg$/);
    expect(r.transcripcion).toContain('pelota');
    expect(b.tablas.narradores[0].ultima_respuesta_at).toBe(t.deps.ahora().toISOString());
    // A los 90 s de silencio, el reloj acusa (texto libre: la ventana está abierta).
    expect(fila(b).despertar_at).toBe(new Date(t.deps.ahora().getTime() + 90_000).toISOString());
    t.pasar(2 * 60_000);
    await tickKids(t.deps);
    expect(t.enviados.length).toBeGreaterThan(4);
    expect(t.enviados.slice(4).every((e) => e.a === TEL_CHICO && e.tipo !== 'plantilla')).toBe(true);
    expect(fila(b).avance).toMatchObject({ capitulo: 1, terminado: false });
  });

  it('el reintento de Meta no suma dos veces', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    const dale = boton('Dale, vamos', 'wamid.salida.1');
    await procesarEntranteKids(t.deps, CHICO, dale);
    await procesarEntranteKids(t.deps, CHICO, dale);
    expect(respuestas(b)).toHaveLength(1);
    expect(t.enviados).toHaveLength(4);
  });

  it('un botón de un mensaje viejo (o que no es nuestro) no hace nada y queda con ∅', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
    const fase = fila(b).estado!.motor.fase;
    // El mismo botón de la bienvenida, otra vez; y uno de un mensaje que no conocemos.
    const otraVez = boton('Dale, vamos', 'wamid.salida.1');
    const ajeno = boton('Paso', 'wamid.de.otro');
    await procesarEntranteKids(t.deps, CHICO, otraVez);
    await procesarEntranteKids(t.deps, CHICO, ajeno);
    expect(fila(b).estado!.motor.fase).toEqual(fase);
    expect(t.enviados).toHaveLength(4);
    for (const m of [otraVez, ajeno]) expect(respuestas(b).find((r) => r.wa_message_id === m.waMessageId)?.clave_kids).toBe(SIN_CLAVE_KIDS);
  });

  it('antes del arranque: se guarda con ∅, se avisa y no se contesta', async () => {
    vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', '');
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    const m = llega({ tipo: 'texto', texto: 'hola' });
    await procesarEntranteKids(t.deps, { ...CHICO, estado: 'invitado' }, m);
    expect(respuestas(b)).toMatchObject([{ wa_message_id: m.waMessageId, clave_kids: SIN_CLAVE_KIDS, texto_directo: 'hola' }]);
    expect(t.avisos.map((a) => a.clave)).toEqual(['kids-antes-k1']);
    expect(t.enviados).toEqual([]);
    expect(fila(b).estado).toBeNull();
  });

  it('un audio que no se pudo bajar: aviso y ninguna fila; el motor no se entera', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
    const antes = JSON.stringify(fila(b).estado!.motor);
    await procesarEntranteKids(t.deps, CHICO, llega({ tipo: 'audio', mediaId: 'NO-BAJA' }));
    expect(respuestas(b)).toHaveLength(1);
    expect(JSON.stringify(fila(b).estado!.motor)).toBe(antes);
    expect(t.avisos.some((a) => a.clave.startsWith('kids-audio-k1-'))).toBe(true);
  });

  it('una transcripción que falla dos veces: el audio entra igual, sin transcripción', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
    const a = audio('FALLA');
    await procesarEntranteKids(t.deps, CHICO, a);
    const r = respuestas(b).find((x) => x.wa_message_id === a.waMessageId)!;
    expect(r.clave_kids).toBe('K1');
    expect(r.transcripcion ?? null).toBeNull();
    expect(fila(b).estado!.motor.rafaga).not.toBeNull();
  });

  it('una foto va a fotos y a respuestas con ⟦foto⟧', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
    const f = llega({ tipo: 'imagen', mediaId: 'img-1', mimeType: 'image/jpeg', texto: 'mi perro' });
    await procesarEntranteKids(t.deps, CHICO, f);
    expect(b.tablas.fotos).toMatchObject([{ narrador_id: 'k1', capitulo: null, subida_por: null }]);
    expect(respuestas(b).find((r) => r.wa_message_id === f.waMessageId)).toMatchObject({ texto_directo: '⟦foto⟧ mi perro', clave_kids: 'K1' });
  });

  it('de noche: la fila queda sin clave hasta las 9, cuando el motor la aplica (y la reconciliación no la toca)', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
    t.fijar(new Date('2026-11-03T02:30:00Z')); // 23:30
    const a = audio('anoche soñé que volaba por arriba de la escuela con mi hermano y era rarísimo');
    await procesarEntranteKids(t.deps, CHICO, a);
    expect(respuestas(b).find((x) => x.wa_message_id === a.waMessageId)?.clave_kids ?? null).toBeNull();
    const enviadosDeNoche = t.enviados.length;
    t.fijar(new Date('2026-11-03T05:00:00Z')); // 02:00: reconciliar mira, pero es de la noche
    await tickKids(t.deps);
    expect(respuestas(b).find((x) => x.wa_message_id === a.waMessageId)?.clave_kids ?? null).toBeNull();
    expect(t.enviados).toHaveLength(enviadosDeNoche);
    t.fijar(new Date('2026-11-03T12:00:00Z')); // 09:00
    await tickKids(t.deps);
    expect(respuestas(b).find((x) => x.wa_message_id === a.waMessageId)?.clave_kids).toBe('K1');
  });
});

describe('kids: el envío', () => {
  async function chicoEnK1() {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
    return { b, t };
  }

  it('una plantilla que no está aprobada queda en la cola y se avisa; sale cuando se aprueba', async () => {
    vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', 'kids_bienvenida');
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    // La bienvenida está; el aviso al padre no: igual no arranca (las dos son del primer mensaje).
    await tickKids(t.deps);
    expect(fila(b).estado).toBeNull();
    vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', 'kids_bienvenida,kids_aviso_padre');
    await tickKids(t.deps);
    expect(t.enviados).toHaveLength(2);
  });

  it('una plantilla que se des-aprobó después del arranque: queda, aviso, y sale después', async () => {
    const { b, t } = await chicoEnK1();
    // Cuatro días sin respuesta: el recordatorio al padre es plantilla.
    vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', 'kids_bienvenida,kids_aviso_padre');
    t.fijar(new Date('2026-11-06T21:30:00Z')); // 18:30 del cuarto día
    await tickKids(t.deps);
    const cola = fila(b).estado!.salida;
    expect(cola.length).toBeGreaterThan(0);
    expect(cola[0].plantilla?.nombre).toMatch(/^kids_/);
    expect(t.avisos.some((a) => a.clave === `kids-plantilla-${cola[0].plantilla!.nombre}`)).toBe(true);
    expect(fila(b).despertar_at! <= t.deps.ahora().toISOString()).toBe(true); // el reloj vuelve a pasar
    vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', '*');
    await tickKids(t.deps);
    expect(fila(b).estado!.salida).toEqual([]);
    expect(t.enviados.some((e) => e.a === TEL_PADRE && e.plantilla === 'kids_recordatorio_padre')).toBe(true);
  });

  it('un texto libre con la ventana cerrada no sale: queda y se avisa', async () => {
    const { b, t } = await chicoEnK1();
    const f = fila(b);
    // Se fuerza lo que el motor no hace: un texto para el padre en canal A.
    f.estado!.salida.push({ a: 'padre', id: 'ACUSE-1', texto: 'algo', botones: [], plantilla: null, envio: '99' });
    f.despertar_at = t.deps.ahora().toISOString();
    const n = t.enviados.length;
    await tickKids(t.deps);
    expect(t.enviados).toHaveLength(n);
    expect(fila(b).estado!.salida.map((s) => s.envio)).toEqual(['99']);
    expect(t.avisos.some((a) => a.clave === 'kids-ventana-k1-99')).toBe(true);
  });

  it('fallos de envío: queda en la cola, a los 3 avisa una vez, y cuando sale se limpia', async () => {
    const { b, t } = await chicoEnK1();
    t.pasar(60_000);
    t.fallar(10);
    await procesarEntranteKids(t.deps, CHICO, audio('me gusta mucho dibujar y armar cosas con mis primos los domingos'));
    t.pasar(2 * 60_000);
    for (let i = 0; i < 4; i++) {
      await tickKids(t.deps);
      t.pasar(60_000);
    }
    expect(fila(b).estado!.salida.length).toBeGreaterThan(0);
    expect(fila(b).estado!.fallosEnvio).toBeGreaterThanOrEqual(3);
    expect(t.avisos.filter((a) => a.clave === 'kids-envios-k1')).toHaveLength(1);
    t.fallar(0);
    await tickKids(t.deps);
    expect(fila(b).estado!.salida).toEqual([]);
    expect(fila(b).estado!.fallosEnvio).toBe(0);
  });
});
