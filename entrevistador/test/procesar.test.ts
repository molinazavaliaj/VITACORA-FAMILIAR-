import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MensajeEntrante } from '../src/whatsapp/webhook.js';

// Mocks compartidos (hoisted: disponibles dentro de las fábricas de vi.mock).
const mocks = vi.hoisted(() => ({
  enviarTexto: vi.fn(),
  descargarAudio: vi.fn(),
  guardarRespuestaAudio: vi.fn(),
  transcribirYActualizar: vi.fn(),
  evaluarRespuesta: vi.fn(),
  detectarIntencion: vi.fn(),
  generarPreguntasAdaptativas: vi.fn(),
  cerrarBitacora: vi.fn(),
  enviarPregunta: vi.fn(),
  mandarHito: vi.fn(),
  detectarQueNoTuvo: vi.fn(),
  faseDeCierre: vi.fn(),
  crearGuionDelViaje: vi.fn(),
  guardarFotoEntrante: vi.fn(),
  confirmarFoto: vi.fn(),
  estado: { narrador: null as any, enviosRepregunta: [] as any[], capturas: [] as any[], ultimoOrden: 30, tieneAdaptativas: true, ofertas: [] as any[], preguntasHoy: [] as any[], capituloVigente: 'La infancia' },
}));

// Cliente de base falso: un "constructor de consultas" encadenable que resuelve
// según la tabla y la operación, y captura los insert/update para revisarlos.
vi.mock('../src/db/cliente.js', () => {
  function resolver(tabla: string, op: string, filtros: Record<string, any> = {}) {
    if (op === 'insert' && tabla === 'respuestas') return { data: { id: 'r-texto' }, error: null };
    if (op === 'insert' || op === 'update') return { data: null, error: null };
    if (tabla === 'narradores') return { data: mocks.estado.narrador };
    if (tabla === 'envios') {
      if (filtros.tipo === 'oferta_siguiente') return { data: mocks.estado.ofertas };
      if (filtros.tipo === 'pregunta') return { data: mocks.estado.preguntasHoy };
      return { data: mocks.estado.enviosRepregunta };
    }
    if (tabla === 'preguntas') return { data: { texto: 'PREGUNTA_MOCK', orden: mocks.estado.ultimoOrden } };
    return { data: null };
  }
  function crearBuilder(tabla: string) {
    const b: any = { _op: 'select', _filtros: {} as Record<string, any> };
    const cadena = () => b;
    b.select = cadena; b.or = cadena; b.is = cadena; b.order = cadena; b.limit = cadena; b.gte = cadena;
    b.eq = (col: string, val: any) => { b._filtros[col] = val; return b; };
    b.in = (col: string, vals: any[]) => { b._filtros[col] = vals[0]; return b; }; // buscarNarrador: la primera variante es el número tal cual
    b.insert = (p: any) => { b._op = 'insert'; mocks.estado.capturas.push({ op: 'insert', tabla, p }); return b; };
    b.update = (p: any) => { b._op = 'update'; mocks.estado.capturas.push({ op: 'update', tabla, p }); return b; };
    b.single = () => Promise.resolve(resolver(tabla, b._op, b._filtros));
    b.maybeSingle = () => Promise.resolve(resolver(tabla, b._op, b._filtros));
    b.then = (res: any, rej: any) => Promise.resolve(resolver(tabla, b._op, b._filtros)).then(res, rej);
    return b;
  }
  return { db: { from: (t: string) => crearBuilder(t) } };
});

vi.mock('../src/whatsapp/enviar.js', () => ({
  enviarTexto: mocks.enviarTexto, enviarPlantilla: vi.fn(), enviarAudioPorLink: vi.fn(),
}));
vi.mock('../src/whatsapp/media.js', () => ({ descargarAudio: mocks.descargarAudio, pathDeAudio: vi.fn() }));
vi.mock('../src/db/respuestas.js', () => ({ guardarRespuestaAudio: mocks.guardarRespuestaAudio }));
vi.mock('../src/ia/transcribir.js', () => ({ transcribirYActualizar: mocks.transcribirYActualizar, transcribir: vi.fn() }));
vi.mock('../src/ia/cerebro.js', () => ({
  evaluarRespuesta: mocks.evaluarRespuesta, detectarIntencion: mocks.detectarIntencion, generarReconocimiento: vi.fn(),
  detectarQueNoTuvo: mocks.detectarQueNoTuvo,
}));
vi.mock('../src/ia/adaptativas.js', () => ({ generarPreguntasAdaptativas: mocks.generarPreguntasAdaptativas }));
vi.mock('../src/flujo/cierre.js', () => ({ cerrarBitacora: mocks.cerrarBitacora }));
vi.mock('../src/flujo/preguntar.js', () => ({
  enviarPregunta: mocks.enviarPregunta,
  CLAVE_DEL_ARBOL: { 'Los hijos': 'hijos', 'El amor': 'conyuge' },
  capituloNoAplica: (c: any, cap: string) => (cap === 'Los hijos' && c?.arbol?.hijos === 'no tuvo') || (cap === 'El amor' && c?.arbol?.conyuge === 'no tuvo'),
  ritmoDe: (c: any) => (c?.ritmo === 'diario' || c?.ritmo === 'dos_por_dia' || c?.ritmo === 'seguido') ? c.ritmo : (c?.modoRapido === true ? 'seguido' : 'diario'),
}));
// El guion propio (14/09): la última pregunta que existe y si ya hay adaptativas.
vi.mock('../src/db/guion.js', () => ({
  ultimoOrden: async () => mocks.estado.ultimoOrden,
  tieneAdaptativas: async () => mocks.estado.tieneAdaptativas,
  preguntaDeOrden: async () => ({ texto: 'PREGUNTA_MOCK', capitulo: mocks.estado.capituloVigente }),
}));
vi.mock('../src/mail/hitos.js', () => ({ mandarHito: mocks.mandarHito }));
// Vitácora de viaje (18/09): lo que toca la base se simula.
vi.mock('../src/flujo/viaje-db.js', () => ({
  crearGuionDelViaje: mocks.crearGuionDelViaje, guardarFotoEntrante: mocks.guardarFotoEntrante, confirmarFoto: mocks.confirmarFoto,
}));
// La pregunta de cierre (18/09): por defecto no hay más vueltas → se despide.
vi.mock('../src/flujo/cierre-abierto.js', () => ({
  faseDeCierre: mocks.faseDeCierre,
  esOrdenDeCierre: (c: any, orden: number) => Array.isArray(c?.cierre?.ordenes) && c.cierre.ordenes.includes(orden),
}));

import { procesarEntrante } from '../src/flujo/procesar.js';

const TEL = '+5491155551234';
const update = (tabla: string) => mocks.estado.capturas.find((c) => c.op === 'update' && c.tabla === tabla);
const insert = (tabla: string) => mocks.estado.capturas.find((c) => c.op === 'insert' && c.tabla === tabla);

beforeEach(() => {
  mocks.estado.narrador = null;
  mocks.estado.enviosRepregunta = [];
  mocks.estado.capturas = [];
  mocks.estado.ultimoOrden = 30;
  mocks.estado.tieneAdaptativas = true;
  mocks.estado.ofertas = [];
  mocks.estado.preguntasHoy = [];
  mocks.estado.capituloVigente = 'La infancia';
  mocks.mandarHito.mockReset();
  mocks.detectarQueNoTuvo.mockReset();
  mocks.detectarQueNoTuvo.mockResolvedValue('normal');
  mocks.faseDeCierre.mockReset();
  mocks.faseDeCierre.mockResolvedValue(false);
  for (const fn of [mocks.crearGuionDelViaje, mocks.guardarFotoEntrante, mocks.confirmarFoto]) fn.mockReset();
  mocks.guardarFotoEntrante.mockResolvedValue('Lisboa');
  for (const fn of [mocks.enviarTexto, mocks.descargarAudio, mocks.guardarRespuestaAudio, mocks.transcribirYActualizar, mocks.evaluarRespuesta, mocks.detectarIntencion, mocks.generarPreguntasAdaptativas, mocks.cerrarBitacora, mocks.enviarPregunta]) fn.mockReset();
  mocks.enviarTexto.mockResolvedValue('wamid.mock');
  mocks.descargarAudio.mockResolvedValue(Buffer.from('audio-falso'));
  mocks.guardarRespuestaAudio.mockResolvedValue({ id: 'r-audio', audioPath: 'p' });
  mocks.transcribirYActualizar.mockResolvedValue({ texto: 'Una casa de adobe con un patio enorme...', duracionSegundos: 95 });
  mocks.evaluarRespuesta.mockResolvedValue({ suficiente: true });
  mocks.detectarIntencion.mockResolvedValue('normal');
});

const narradorEn = (estado: string, dia_actual = 0, contexto: Record<string, any> = {}) => ({
  id: 'n1', familia_id: 'fam-1', telefono_whatsapp: TEL, como_le_dicen: 'Don Osvaldo', estado, dia_actual, contexto, zona_horaria: 'America/Argentina/Buenos_Aires',
});

describe('procesarEntrante', () => {
  it('(a) un "SÍ" de un invitado lo pasa a acepto y envía la confirmación', async () => {
    mocks.estado.narrador = narradorEn('invitado');
    const m: MensajeEntrante = { telefono: TEL, tipo: 'texto', texto: 'SÍ', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(update('narradores')?.p).toMatchObject({ estado: 'acepto' });
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, expect.stringContaining('Qué alegría'));
  });

  // 3t.15: la voz es dato biométrico. El SÍ vale como permiso SOLO si la
  // bienvenida que salió por Meta ya lo pedía (WA_BIENVENIDA_PIDE_VOZ=1).
  it('(a ter) con la plantilla nueva, el SÍ anota el consentimiento de voz', async () => {
    process.env.WA_BIENVENIDA_PIDE_VOZ = '1';
    try {
      mocks.estado.narrador = narradorEn('invitado');
      await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'sí', waMessageId: 'w' });
      const p = update('narradores')?.p as Record<string, unknown>;
      expect(p.estado).toBe('acepto');
      expect(typeof p.consentimiento_voz_at).toBe('string');
      expect(Number.isNaN(Date.parse(p.consentimiento_voz_at as string))).toBe(false);
    } finally {
      delete process.env.WA_BIENVENIDA_PIDE_VOZ;
    }
  });

  it('(a quater) con la plantilla vieja, el SÍ NO anota consentimiento de voz', async () => {
    delete process.env.WA_BIENVENIDA_PIDE_VOZ;
    mocks.estado.narrador = narradorEn('invitado');
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'SÍ', waMessageId: 'w' });
    const p = update('narradores')?.p as Record<string, unknown>;
    expect(p.estado).toBe('acepto');
    expect('consentimiento_voz_at' in p).toBe(false);
  });

  // Que use la función de puro.ts y no una copia propia: si alguien reescribe
  // el texto acá a mano, este test se cae.
  it('(a bis) la bienvenida sale con el trato del narrador', async () => {
    const { bienvenidaAceptacion } = await import('../src/manual/puro.js');
    mocks.estado.narrador = narradorEn('invitado', 0, { trato: 'vos' });
    const m: MensajeEntrante = { telefono: TEL, tipo: 'texto', texto: 'SÍ', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, bienvenidaAceptacion('Don Osvaldo', 'vos'));
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, expect.stringContaining('entre vos y yo, a tu ritmo'));
  });

  it('(b) un audio de un narrador activo se guarda con el orden de dia_actual y se transcribe', async () => {
    mocks.estado.narrador = narradorEn('activo', 3);
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(mocks.guardarRespuestaAudio).toHaveBeenCalledWith('n1', 3, expect.any(Buffer), false);
    expect(mocks.transcribirYActualizar).toHaveBeenCalledWith('r-audio', expect.any(Buffer));
  });

  it('(c) una respuesta insuficiente dispara exactamente una repregunta', async () => {
    mocks.estado.narrador = narradorEn('activo', 5);
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: false, repregunta: '¿Y qué sentía usted en ese taller?' });
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(mocks.enviarTexto).toHaveBeenCalledTimes(1);
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, expect.stringContaining('sentía'));
    expect(insert('envios')?.p).toMatchObject({ tipo: 'repregunta', pregunta_orden: 5 });
  });

  // Bitácora 35: "no tengo hijos" en la 19 → no se repregunta sobre eso y queda
  // anotado en el árbol, así las que siguen del capítulo se reemplazan.
  it('(c bis) si en «Los hijos» dice que no tuvo, se anota arbol.hijos y no hay repregunta', async () => {
    mocks.estado.narrador = narradorEn('activo', 19, { arbol: { padres: 'Juan y Rosa' } });
    mocks.estado.capituloVigente = 'Los hijos';
    mocks.transcribirYActualizar.mockResolvedValue({ texto: 'No, yo no tengo hijos.', duracionSegundos: 4 });
    mocks.detectarQueNoTuvo.mockResolvedValue('no_tuvo');
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: false, repregunta: '¿Y por qué no tuvo hijos?' });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.detectarQueNoTuvo).toHaveBeenCalledWith('Los hijos', 'PREGUNTA_MOCK', 'No, yo no tengo hijos.');
    expect(mocks.evaluarRespuesta).not.toHaveBeenCalled();
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
    const conArbol = mocks.estado.capturas.find((c) => c.op === 'update' && c.tabla === 'narradores' && c.p.contexto);
    expect(conArbol?.p).toMatchObject({ contexto: { arbol: { padres: 'Juan y Rosa', hijos: 'no tuvo' } } });
  });

  it('(c ter) fuera de «Los hijos» y «El amor» no se pregunta al modelo si tuvo o no', async () => {
    mocks.estado.narrador = narradorEn('activo', 5);
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.detectarQueNoTuvo).not.toHaveBeenCalled();
    expect(mocks.evaluarRespuesta).toHaveBeenCalled();
  });

  it('(c quater) si el árbol ya dice que no tuvo, no se vuelve a preguntar', async () => {
    mocks.estado.narrador = narradorEn('activo', 20, { arbol: { hijos: 'no tuvo' } });
    mocks.estado.capituloVigente = 'Los hijos';
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.detectarQueNoTuvo).not.toHaveBeenCalled();
  });

  // La pregunta de cierre (18/09): al responder la última, antes de despedirse
  // se le pregunta si faltó algo. Si de ahí sale otra pregunta, no cierra.
  it('(f bis) si la fase de cierre manda otra pregunta, no se despide todavía', async () => {
    mocks.estado.narrador = narradorEn('activo', 30);
    mocks.faseDeCierre.mockResolvedValue(true);
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.faseDeCierre).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 30, expect.any(String));
    expect(mocks.cerrarBitacora).not.toHaveBeenCalled();
  });

  it('(f ter) la respuesta a la pregunta de cierre no se evalúa ni se repregunta', async () => {
    mocks.estado.narrador = narradorEn('activo', 31, { cierre: { vueltas: 1, ordenes: [31] } });
    mocks.estado.ultimoOrden = 31;
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: false, repregunta: '¿Y qué más?' });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.evaluarRespuesta).not.toHaveBeenCalled();
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
    expect(mocks.cerrarBitacora).toHaveBeenCalled(); // faseDeCierre devolvió false: se despide
  });

  // ── Vitácora de viaje ──
  const VIAJE = { modo: 'viaje', trato: 'vos', viaje: { salida: '2026-09-20', vuelta: '2026-09-29', etapas: [{ nombre: 'Lisboa' }] } };

  it('(v1) un viajero invitado que escribe "hola" recibe la bienvenida de viaje como texto libre, una sola vez', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, VIAJE);
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'hola!', waMessageId: 'w' });
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, expect.stringContaining('biógrafo de viaje'));
    expect(insert('envios')?.p).toMatchObject({ tipo: 'bienvenida' });
    expect(update('narradores')).toBeUndefined(); // sigue invitado
  });

  it('(v2) el SÍ de un viajero crea el guion del viaje y contesta en vos', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, VIAJE);
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Sí', waMessageId: 'w' });
    expect(mocks.crearGuionDelViaje).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }));
    expect(update('narradores')?.p).toMatchObject({ estado: 'acepto' });
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, expect.stringContaining('Buen viaje'));
  });

  it('(v3) una foto por WhatsApp de un viajero activo se guarda en el álbum del día y se confirma', async () => {
    mocks.estado.narrador = narradorEn('activo', 3, VIAJE);
    await procesarEntrante({ telefono: TEL, tipo: 'imagen', mediaId: 'img-1', mimeType: 'image/jpeg', texto: 'El tranvía 28', waMessageId: 'w' });
    expect(mocks.guardarFotoEntrante).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'img-1', 'image/jpeg', 'El tranvía 28');
    expect(mocks.confirmarFoto).toHaveBeenCalledWith(expect.anything(), 'Lisboa');
    expect(mocks.guardarRespuestaAudio).not.toHaveBeenCalled();
  });

  it('(v4) una foto de un narrador de biografía (no viaje) se ignora', async () => {
    mocks.estado.narrador = narradorEn('activo', 3);
    await procesarEntrante({ telefono: TEL, tipo: 'imagen', mediaId: 'img-1', waMessageId: 'w' });
    expect(mocks.guardarFotoEntrante).not.toHaveBeenCalled();
  });

  it('(e) al responder la ÚLTIMA del guion (sea la 26 o la 23) sin adaptativas, se generan las 4 y NO cierra', async () => {
    mocks.estado.narrador = narradorEn('activo', 23);
    mocks.estado.ultimoOrden = 23;
    mocks.estado.tieneAdaptativas = false;
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    // Cuando se generan, la última pasa a ser la 27.
    mocks.generarPreguntasAdaptativas.mockImplementation(async () => { mocks.estado.ultimoOrden = 27; mocks.estado.tieneAdaptativas = true; });
    await procesarEntrante(m);
    expect(mocks.generarPreguntasAdaptativas).toHaveBeenCalledWith('n1');
    expect(mocks.cerrarBitacora).not.toHaveBeenCalled();
  });

  it('no dispara las adaptativas en una pregunta cualquiera', async () => {
    mocks.estado.narrador = narradorEn('activo', 12);
    mocks.estado.tieneAdaptativas = false;
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(mocks.generarPreguntasAdaptativas).not.toHaveBeenCalled();
  });

  it('los hitos: la primera respuesta y la mitad del guion avisan a la familia por mail', async () => {
    mocks.estado.narrador = narradorEn('activo', 1);
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.mandarHito).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'primera');
    mocks.mandarHito.mockReset();
    mocks.estado.narrador = narradorEn('activo', 15); // 30 / 2
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.mandarHito).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'mitad');
  });

  it('ritmo dos_por_dia: tras una respuesta suficiente se OFRECE otra, y un "sí" la manda', async () => {
    mocks.estado.narrador = narradorEn('activo', 7, { ritmo: 'dos_por_dia' });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, expect.stringContaining('otra pregunta ahora'));
    expect(insert('envios')?.p).toMatchObject({ tipo: 'oferta_siguiente', pregunta_orden: 7 });

    // Llega el "sí": la oferta está pendiente y no salió todavía la 8.
    mocks.estado.ofertas = [{ id: 'o1' }];
    mocks.estado.capturas = [];
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Sí, dale', waMessageId: 'w2' });
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 8, { plantilla: false });
    expect(insert('respuestas')).toBeUndefined(); // el "sí" no es una respuesta a la pregunta
  });

  it('ritmo dos_por_dia: con dos preguntas ya enviadas hoy, no ofrece más', async () => {
    mocks.estado.narrador = narradorEn('activo', 8, { ritmo: 'dos_por_dia' });
    const ahora = new Date().toISOString();
    mocks.estado.preguntasHoy = [{ enviado_at: ahora }, { enviado_at: ahora }];
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('(f) responder la última pregunta dispara el cierre', async () => {
    mocks.estado.narrador = narradorEn('activo', 30);
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(mocks.cerrarBitacora).toHaveBeenCalledWith('n1');
  });

  it('no cierra si todavía quedan preguntas por delante', async () => {
    mocks.estado.narrador = narradorEn('activo', 26);
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(mocks.cerrarBitacora).not.toHaveBeenCalled();
  });

  it('(g) modo rápido: tras una respuesta suficiente, la siguiente pregunta sale al instante', async () => {
    mocks.estado.narrador = narradorEn('activo', 7, { modoRapido: true });
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    await procesarEntrante(m);
    // Como el narrador acaba de escribir, la ventana de 24 hs está abierta: texto libre.
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'n1' }), 8, { plantilla: false },
    );
  });

  it('sin modo rápido, la siguiente pregunta la manda el scheduler al día siguiente', async () => {
    mocks.estado.narrador = narradorEn('activo', 7);
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
  });

  it('modo rápido: si salió una repregunta, NO avanza hasta que la responda', async () => {
    mocks.estado.narrador = narradorEn('activo', 7, { modoRapido: true });
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: false, repregunta: '¿Y qué sentía?' });
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
  });

  it('modo rápido: en la última pregunta cierra y no intenta mandar otra', async () => {
    mocks.estado.narrador = narradorEn('activo', 30, { modoRapido: true });
    const m: MensajeEntrante = { telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(mocks.cerrarBitacora).toHaveBeenCalledWith('n1');
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
  });

  it('(d) un texto "no quiero seguir" pausa al narrador', async () => {
    mocks.estado.narrador = narradorEn('activo', 2);
    mocks.detectarIntencion.mockResolvedValue('quiere_parar');
    const m: MensajeEntrante = { telefono: TEL, tipo: 'texto', texto: 'no quiero seguir con esto', waMessageId: 'w' };
    await procesarEntrante(m);
    expect(update('narradores')?.p).toMatchObject({ estado: 'pausado', alerta_silencio: true });
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, expect.stringContaining('pausa'));
  });
});
