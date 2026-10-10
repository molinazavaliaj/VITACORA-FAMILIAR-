import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MensajeEntrante } from '../src/whatsapp/webhook.js';

// Mocks compartidos (hoisted: disponibles dentro de las fábricas de vi.mock).
const mocks = vi.hoisted(() => ({
  enviarTexto: vi.fn(),
  descargarAudio: vi.fn(),
  guardarRespuestaAudio: vi.fn(),
  guardarReserva: vi.fn(),
  guardarTemaDeOtraParte: vi.fn(),
  transcribirYActualizar: vi.fn(),
  evaluarRespuesta: vi.fn(),
  detectarReservaYDejarTema: vi.fn(),
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
  recibirFotoFamiliar: vi.fn(),
  pedirObjeto: vi.fn(),
  pedidoAbierto: vi.fn(),
  canjearRegalo: vi.fn(),
  mandarBienvenidaDeRegalo: vi.fn(),
  avisarSocios: vi.fn(),
  estado: { errorV3: null as any, filaV3: null as any, narrador: null as any, enviosRepregunta: [] as any[], capturas: [] as any[], ultimoOrden: 30, tieneAdaptativas: true, ofertas: [] as any[], preguntasHoy: [] as any[], capituloVigente: 'La infancia' },
}));

// Cliente de base falso: un "constructor de consultas" encadenable que resuelve
// según la tabla y la operación, y captura los insert/update para revisarlos.
vi.mock('../src/db/cliente.js', () => {
  function resolver(tabla: string, op: string, filtros: Record<string, any> = {}) {
    if (op === 'insert' && tabla === 'respuestas') return { data: { id: 'r-texto' }, error: null };
    if (op === 'insert' || op === 'update') return { data: null, error: null };
    if (tabla === 'entrevistas_v3') return { data: mocks.estado.filaV3, error: mocks.estado.errorV3 };
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
vi.mock('../src/db/respuestas.js', () => ({ guardarRespuestaAudio: mocks.guardarRespuestaAudio, guardarReserva: mocks.guardarReserva, guardarTemaDeOtraParte: mocks.guardarTemaDeOtraParte }));
vi.mock('../src/ia/transcribir.js', () => ({ transcribirYActualizar: mocks.transcribirYActualizar, transcribir: vi.fn() }));
vi.mock('../src/ia/cerebro.js', () => ({
  evaluarRespuesta: mocks.evaluarRespuesta, detectarIntencion: mocks.detectarIntencion, generarReconocimiento: vi.fn(),
  detectarQueNoTuvo: mocks.detectarQueNoTuvo, detectarReservaYDejarTema: mocks.detectarReservaYDejarTema,
  // La misma regla que la real (21/09): solo una orden de la lista, anterior a la de hoy.
  temaDe: (e: any, hechas: { orden: number }[], actual: number) =>
    Number.isInteger(e.temaDeOrden) && e.temaDeOrden < actual && hechas.some((p) => p.orden === e.temaDeOrden)
      ? { temaDeOrden: e.temaDeOrden, temaMotivo: e.temaMotivo ?? null }
      : null,
  // La misma regla que la real (bitácora 19): un tramo que no está textual reserva todo.
  reservaDe: (e: any, t: string) => e.reservado !== true
    ? { reservada: false, tramo: null }
    : { reservada: true, tramo: typeof e.reservadoTramo === 'string' && e.reservadoTramo && t.includes(e.reservadoTramo) ? e.reservadoTramo : null },
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
  preguntasHechasAntes: async (_id: string, orden: number) =>
    [1, 2, 3, 4, 5, 6, 7, 8].filter((o) => o < orden).map((o) => ({ orden: o, capitulo: o <= 4 ? 'La infancia' : 'El trabajo', texto: `pregunta ${o}` })),
}));
vi.mock('../src/mail/hitos.js', () => ({ mandarHito: mocks.mandarHito }));
// Vitácora de viaje (18/09): lo que toca la base se simula.
vi.mock('../src/flujo/viaje-db.js', () => ({
  crearGuionDelViaje: mocks.crearGuionDelViaje, guardarFotoEntrante: mocks.guardarFotoEntrante, confirmarFoto: mocks.confirmarFoto,
}));
vi.mock('../src/flujo/fotos.js', () => ({ recibirFotoFamiliar: mocks.recibirFotoFamiliar }));
vi.mock('../src/flujo/objetos.js', () => ({ pedirObjeto: mocks.pedirObjeto, pedidoAbierto: mocks.pedidoAbierto }));
// Gift card (08/10): el canje se prueba en regalo.test.ts; acá solo que procesar lo llama.
vi.mock('../src/flujo/regalo.js', () => ({ canjearRegalo: mocks.canjearRegalo, mandarBienvenidaDeRegalo: mocks.mandarBienvenidaDeRegalo }));
vi.mock('../src/v3/avisos.js', () => ({ avisarSocios: mocks.avisarSocios }));
// La pregunta de cierre (18/09): por defecto no hay más vueltas → se despide.
vi.mock('../src/flujo/cierre-abierto.js', () => ({
  faseDeCierre: mocks.faseDeCierre,
  esOrdenDeCierre: (c: any, orden: number) => Array.isArray(c?.cierre?.ordenes) && c.cierre.ordenes.includes(orden),
}));

import { procesarEntrante, leerSiNo } from '../src/flujo/procesar.js';
import { ARRANQUE } from '../src/flujo/regalo-textos.js';

const TEL = '+5491155551234';
const update = (tabla: string) => mocks.estado.capturas.find((c) => c.op === 'update' && c.tabla === tabla);
const insert = (tabla: string) => mocks.estado.capturas.find((c) => c.op === 'insert' && c.tabla === tabla);

beforeEach(() => {
  mocks.estado.narrador = null;
  mocks.estado.filaV3 = null;
  mocks.estado.errorV3 = null;
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
  for (const fn of [mocks.crearGuionDelViaje, mocks.guardarFotoEntrante, mocks.confirmarFoto, mocks.recibirFotoFamiliar]) fn.mockReset();
  mocks.pedirObjeto.mockReset();
  mocks.pedirObjeto.mockResolvedValue(false);   // por defecto, la pregunta no cierra capítulo
  mocks.pedidoAbierto.mockReset();
  mocks.pedidoAbierto.mockResolvedValue(null);  // por defecto, no hay pedido esperando
  mocks.canjearRegalo.mockReset();
  mocks.canjearRegalo.mockResolvedValue('sin_codigo');
  mocks.mandarBienvenidaDeRegalo.mockReset();
  mocks.mandarBienvenidaDeRegalo.mockResolvedValue(true);
  mocks.avisarSocios.mockReset();
  mocks.avisarSocios.mockResolvedValue(true);
  mocks.guardarFotoEntrante.mockResolvedValue('Lisboa');
  for (const fn of [mocks.enviarTexto, mocks.descargarAudio, mocks.guardarRespuestaAudio, mocks.guardarReserva, mocks.transcribirYActualizar, mocks.evaluarRespuesta, mocks.detectarIntencion, mocks.generarPreguntasAdaptativas, mocks.cerrarBitacora, mocks.enviarPregunta]) fn.mockReset();
  mocks.guardarReserva.mockResolvedValue(true);
  mocks.guardarTemaDeOtraParte.mockReset();
  mocks.guardarTemaDeOtraParte.mockResolvedValue(true);
  mocks.detectarReservaYDejarTema.mockReset();
  mocks.detectarReservaYDejarTema.mockResolvedValue({ reserva: { reservada: false, tramo: null }, dejarTema: null });
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
  // Gift card (08/10). El doble responde `envios` (sin tipo oferta/pregunta) con
  // `enviosRepregunta`: vacío = ultimaBienvenida da false.
  it('un número desconocido con texto va al canje del regalo', async () => {
    mocks.estado.narrador = null;
    mocks.canjearRegalo.mockResolvedValue('canjeado');
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'VF-7K3M2Q', waMessageId: 'w' });
    expect(mocks.canjearRegalo).toHaveBeenCalledWith(expect.anything(), { telefono: TEL, texto: 'VF-7K3M2Q' });
  });
  it('un número desconocido que manda audio no se canjea', async () => {
    mocks.estado.narrador = null;
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'm', waMessageId: 'w' } as MensajeEntrante);
    expect(mocks.canjearRegalo).not.toHaveBeenCalled();
  });
  it('un invitado de regalo sin bienvenida la recibe en vez de procesar el SÍ', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, { regalo: true });
    mocks.estado.enviosRepregunta = []; // ultimaBienvenida → false
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'SÍ', waMessageId: 'w' });
    expect(mocks.mandarBienvenidaDeRegalo).toHaveBeenCalledWith(expect.anything(), 'n1', TEL);
    expect(update('narradores')).toBeUndefined();
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });
  it('si la bienvenida de regalo vuelve a fallar, el SÍ no se pierde: sigue el consentimiento', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, { regalo: true, trato: 'vos', genero: 'varon' });
    mocks.estado.enviosRepregunta = [];
    mocks.mandarBienvenidaDeRegalo.mockResolvedValue(false);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'SÍ', waMessageId: 'w' });
      expect(error).toHaveBeenCalledWith(expect.stringContaining('n1'));
    } finally {
      error.mockRestore();
    }
    expect(update('narradores')?.p).toMatchObject({ estado: 'acepto' });
    // No le llegó la bienvenida que pide la voz: su SÍ no vale como ese permiso.
    expect('consentimiento_voz_at' in (update('narradores')?.p as Record<string, unknown>)).toBe(false);
    // Con la ficha completa, el regalo arranca igual: nada se frena.
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
    expect(mocks.enviarPregunta).toHaveBeenCalled();
  });
  it('un número desconocido que ya había canjeado su código (ya_era_suyo) no sigue de largo', async () => {
    mocks.estado.narrador = null;
    mocks.canjearRegalo.mockResolvedValue('ya_era_suyo');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'VF-7K3M2Q', waMessageId: 'w' });
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('no registrado'));
    } finally {
      warn.mockRestore();
    }
  });
  // Un teléfono que el bot ya conoce (un libro terminado, uno sin pagar) manda
  // un código: hoy no puede canjear (dos libros para una persona es el plan que
  // sigue). No se le escribe nada (no hay texto aprobado): se avisa a los socios.
  for (const estado of ['pendiente_pago', 'completado', 'cerrado_anticipado']) {
    it(`un teléfono conocido en '${estado}' que manda un código: aviso a los socios, nada al narrador`, async () => {
      mocks.estado.narrador = narradorEn(estado);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Me regalaron esto: VF-7K3M2Q', waMessageId: 'w' });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('VF-7K3M2Q'));
      } finally {
        warn.mockRestore();
      }
      expect(mocks.canjearRegalo).not.toHaveBeenCalled();
      expect(mocks.enviarTexto).not.toHaveBeenCalled();
      expect(mocks.avisarSocios).toHaveBeenCalledTimes(1);
      const [clave, asunto, detalle] = mocks.avisarSocios.mock.calls[0];
      expect(clave).toContain('n1');
      expect(clave).toContain('VF-7K3M2Q');
      expect(asunto).toMatch(/regalo/i);
      expect(detalle).toContain(TEL);
      expect(detalle).toContain('n1');
      expect(detalle).toContain('VF-7K3M2Q');
    });
  }
  it('un teléfono conocido en completado que escribe sin código: no se avisa', async () => {
    mocks.estado.narrador = narradorEn('completado');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'gracias por todo', waMessageId: 'w' });
    } finally {
      warn.mockRestore();
    }
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });
  it('el SÍ de un invitado de regalo también anota el permiso de voz (la bienvenida del regalo siempre lo pide)', async () => {
    delete process.env.WA_BIENVENIDA_PIDE_VOZ;
    mocks.estado.narrador = narradorEn('invitado', 0, { regalo: true, trato: 'vos', genero: 'varon' });
    mocks.estado.enviosRepregunta = [{ id: 'e-bienvenida' }];
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'SÍ', waMessageId: 'w' });
    const p = update('narradores')?.p as Record<string, unknown>;
    expect(p.estado).toBe('acepto');
    expect(typeof p.consentimiento_voz_at).toBe('string');
    expect(Number.isNaN(Date.parse(p.consentimiento_voz_at as string))).toBe(false);
  });
  it('un invitado de regalo que ya tuvo su bienvenida no la recibe de nuevo: su SÍ lo pasa a acepto y sale la 1', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, { regalo: true, trato: 'vos', genero: 'varon' });
    mocks.estado.enviosRepregunta = [{ id: 'e-bienvenida' }];
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'SÍ', waMessageId: 'w' });
    expect(mocks.mandarBienvenidaDeRegalo).not.toHaveBeenCalled();
    expect(update('narradores')?.p).toMatchObject({ estado: 'acepto' });
    expect(mocks.avisarSocios).not.toHaveBeenCalled();
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ estado: 'acepto' }), 1, { plantilla: false });
  });

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
    // T3.5 (22/09): la transcripción automática va CON la ficha, como la puerta
    // manual. Sin el prompt, los nombres propios salen mal en el libro (#17).
    expect(mocks.transcribirYActualizar).toHaveBeenCalledWith('r-audio', expect.any(Buffer), expect.stringContaining('Don Osvaldo'), 'n1');
  });

  it('(b2) el prompt de la transcripción lleva los datos de la ficha (nombres, lugar, oficio)', async () => {
    mocks.estado.narrador = narradorEn('activo', 3, {
      arbol: { padres: 'Ramón y Haydée', conyuge: 'Élida' },
      lugarNacimiento: 'Avellaneda',
      dondeVive: 'Rosario',
      oficio: 'mecánico',
    });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' } as MensajeEntrante);
    const prompt = mocks.transcribirYActualizar.mock.calls[0][2] as string;
    for (const dato of ['Don Osvaldo', 'Haydée', 'Élida', 'Avellaneda', 'Rosario', 'mecánico']) {
      expect(prompt).toContain(dato);
    }
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
    expect(mocks.detectarQueNoTuvo).toHaveBeenCalledWith('Los hijos', 'PREGUNTA_MOCK', 'No, yo no tengo hijos.', 'n1');
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

  // Bitácora 19: "esto prefiero que no vaya al libro" → queda en la fila de la
  // respuesta, que es lo que la fábrica lee. El tramo va tal como lo dijo.
  it('(c5) si pide reservar algo, se marca la respuesta (con el tramo textual)', async () => {
    mocks.estado.narrador = narradorEn('activo', 12);
    mocks.transcribirYActualizar.mockResolvedValue({ texto: 'Y bueno, locuras de las contables pueden ser por amor. Estas historias prefiero que queden en mi mente.', duracionSegundos: 60 });
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: true, reservado: true, reservadoTramo: 'locuras de las contables pueden ser por amor' });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.guardarReserva).toHaveBeenCalledWith('r-audio', { reservada: true, tramo: 'locuras de las contables pueden ser por amor' });
  });

  it('(c6) una respuesta por texto también puede reservarse, y sin pedido no se marca nada', async () => {
    mocks.estado.narrador = narradorEn('activo', 12);
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: true, reservado: true });
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Eso no lo pongas en el libro.', waMessageId: 'w' });
    expect(mocks.guardarReserva).toHaveBeenCalledWith('r-texto', { reservada: true, tramo: null });

    mocks.guardarReserva.mockClear();
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: true });
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Una casa de adobe con patio.', waMessageId: 'w' });
    expect(mocks.guardarReserva).toHaveBeenCalledWith('r-texto', { reservada: false, tramo: null });
  });

  // El hueco que marcó Naza (20/09): la ampliación de una repregunta y la
  // respuesta al "¿faltó algo?" no se evalúan, pero un "no lo pongas" dicho ahí
  // vale igual. Las marcas se detectan con la llamada corta, sin repreguntar.
  it('(c5 bis) en la ampliación de una repregunta no se evalúa, pero sí se detectan reserva y tema', async () => {
    mocks.estado.narrador = narradorEn('activo', 12, { trato: 'vos' });
    mocks.estado.enviosRepregunta = [{ id: 'e1' }]; // ya hubo repregunta: este audio es la ampliación
    mocks.transcribirYActualizar.mockResolvedValue({ texto: 'Y bueno, eso no lo pongas en el libro.', duracionSegundos: 20 });
    mocks.detectarReservaYDejarTema.mockResolvedValue({ reserva: { reservada: true, tramo: null }, dejarTema: 'su tío' });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.evaluarRespuesta).not.toHaveBeenCalled();
    expect(mocks.detectarReservaYDejarTema).toHaveBeenCalledWith('Y bueno, eso no lo pongas en el libro.', 'vos', { narradorId: 'n1' });
    expect(mocks.guardarReserva).toHaveBeenCalledWith('r-audio', { reservada: true, tramo: null });
    expect(mocks.estado.narrador.contexto.evitar).toContain('su tío');
    expect(mocks.enviarTexto).not.toHaveBeenCalled(); // ninguna repregunta de más
  });

  it('(c5 ter) en la respuesta a la pregunta de cierre, lo mismo', async () => {
    mocks.estado.narrador = narradorEn('activo', 31, { cierre: { ordenes: [31] } });
    mocks.estado.ultimoOrden = 31;
    mocks.transcribirYActualizar.mockResolvedValue({ texto: 'Sí, faltó algo, pero que no vaya al libro.', duracionSegundos: 20 });
    mocks.detectarReservaYDejarTema.mockResolvedValue({ reserva: { reservada: true, tramo: null }, dejarTema: null });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.evaluarRespuesta).not.toHaveBeenCalled();
    expect(mocks.detectarReservaYDejarTema).toHaveBeenCalled();
    expect(mocks.guardarReserva).toHaveBeenCalledWith('r-audio', { reservada: true, tramo: null });
  });

  it('(c5 quater) en una respuesta normal NO se paga la llamada corta: las marcas vienen de la evaluación', async () => {
    mocks.estado.narrador = narradorEn('activo', 5);
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.evaluarRespuesta).toHaveBeenCalled();
    expect(mocks.detectarReservaYDejarTema).not.toHaveBeenCalled();
  });

  // "Esto es de otra parte" (21/09): contesta la 9 y se acuerda de algo de la 2.
  // Es una marca en la fila, y el bot NO reencuadra: no manda ningún texto.
  it('(t1) una respuesta que recuerda un tema anterior se marca con la orden, y el bot no le dice nada', async () => {
    mocks.estado.narrador = narradorEn('activo', 9);
    mocks.transcribirYActualizar.mockResolvedValue({ texto: 'Mi primer trabajo fue en el taller... y me acuerdo de chico, en el patio, con el Rubén.', duracionSegundos: 90 });
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: true, temaDeOrden: 2, temaMotivo: 'los juegos del patio con el Rubén son la pregunta 2' });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    // La evaluación recibió la lista de las preguntas ya hechas, con la orden de hoy.
    const opciones = mocks.evaluarRespuesta.mock.calls[0][5];
    expect(opciones.ordenActual).toBe(9);
    expect(opciones.preguntasHechas.map((p: any) => p.orden)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(mocks.guardarTemaDeOtraParte).toHaveBeenCalledWith('r-audio', { temaDeOrden: 2, temaMotivo: 'los juegos del patio con el Rubén son la pregunta 2' });
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('(t2) si el modelo duda (null) o inventa una orden, no se guarda nada', async () => {
    mocks.estado.narrador = narradorEn('activo', 9);
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: true, temaDeOrden: null, temaMotivo: null });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.guardarTemaDeOtraParte).toHaveBeenCalledWith('r-audio', null);
    mocks.guardarTemaDeOtraParte.mockClear();
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: true, temaDeOrden: 27, temaMotivo: 'inventada' });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.guardarTemaDeOtraParte).toHaveBeenCalledWith('r-audio', null);
  });

  // Bitácora 34: "vamos por otro lado" → el tema entra a contexto.evitar para el
  // resto de la entrevista, y el narrador en memoria ya lo lleva (modo seguido
  // manda la siguiente en este mismo turno).
  it('(c7) si pide dejar un tema, se suma a contexto.evitar y no hay repregunta', async () => {
    mocks.estado.narrador = narradorEn('activo', 7, { evitar: 'No preguntar por su hermano Rubén.' });
    mocks.transcribirYActualizar.mockResolvedValue({ texto: 'Mi tío se drogaba, o sea, vamos por otro lado.', duracionSegundos: 30 });
    mocks.evaluarRespuesta.mockResolvedValue({ suficiente: true, dejarTema: 'su tío y las drogas' });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
    const conEvitar = mocks.estado.capturas.find((c) => c.op === 'update' && c.tabla === 'narradores' && c.p.contexto?.evitar);
    expect(conEvitar?.p.contexto.evitar).toBe('No preguntar por su hermano Rubén.\nsu tío y las drogas (lo pidió él en la entrevista)');
    expect(mocks.estado.narrador.contexto.evitar).toContain('su tío y las drogas');
  });

  it('(c8) sin pedido de dejar un tema, contexto.evitar no se toca', async () => {
    mocks.estado.narrador = narradorEn('activo', 7, { evitar: 'Nada de Rubén.' });
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'media-1', waMessageId: 'w' });
    expect(mocks.estado.capturas.find((c) => c.op === 'update' && c.tabla === 'narradores' && c.p.contexto)).toBeUndefined();
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

  // Hasta el 22/09 este test afirmaba que la foto se IGNORABA. Era el bug
  // escrito como si fuera la regla: una señora mandaba la foto de su casamiento
  // y el bot se hacía el distraído. Ahora se guarda en los dos productos.
  it('(v4) una foto de un narrador del Familiar se guarda en su capítulo, no se tira', async () => {
    mocks.estado.narrador = narradorEn('activo', 3);
    await procesarEntrante({ telefono: TEL, tipo: 'imagen', mediaId: 'img-1', mimeType: 'image/jpeg', texto: 'Mi casamiento', waMessageId: 'w' });
    expect(mocks.recibirFotoFamiliar).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'img-1', 'image/jpeg', 'Mi casamiento');
    expect(mocks.guardarFotoEntrante).not.toHaveBeenCalled(); // esa es la del viaje
    expect(mocks.guardarRespuestaAudio).not.toHaveBeenCalled();
  });

  it('(v5) una foto de un narrador que todavía no aceptó (invitado) no se guarda', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0);
    await procesarEntrante({ telefono: TEL, tipo: 'imagen', mediaId: 'img-1', waMessageId: 'w' });
    expect(mocks.recibirFotoFamiliar).not.toHaveBeenCalled();
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

// ── «Sus objetos preciados» (3t.30) ──
describe('el pedido de objeto al cerrar un capítulo', () => {
  it('se le ofrece al terminar el capítulo, y ese pedido reemplaza el avance del ritmo', async () => {
    mocks.estado.narrador = narradorEn('activo', 4, { ritmo: 'seguido' });
    mocks.pedirObjeto.mockResolvedValue(true);
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'm', waMessageId: 'w' });
    expect(mocks.pedirObjeto).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 4);
    // el modo rápido NO manda además la pregunta siguiente: el pedido es el segundo mensaje
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
  });

  it('si la pregunta no cierra capítulo, el día sigue como siempre', async () => {
    mocks.estado.narrador = narradorEn('activo', 4, { ritmo: 'seguido' });
    mocks.pedirObjeto.mockResolvedValue(false);
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'm', waMessageId: 'w' });
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.anything(), 5, { plantilla: false });
  });

  it('la historia del objeto NO se vuelve a evaluar: es una ampliación del día, no una respuesta nueva', async () => {
    mocks.estado.narrador = narradorEn('activo', 4);
    mocks.pedidoAbierto.mockResolvedValue(101); // hay un pedido esperando
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'm', waMessageId: 'w' });
    expect(mocks.evaluarRespuesta).not.toHaveBeenCalled();
    // pero lo que pidió reservar en esa ampliación vale igual
    expect(mocks.detectarReservaYDejarTema).toHaveBeenCalled();
  });

  it('sobre una ampliación no se vuelve a pedir el objeto', async () => {
    mocks.estado.narrador = narradorEn('activo', 4);
    mocks.pedidoAbierto.mockResolvedValue(101);
    await procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'm', waMessageId: 'w' });
    expect(mocks.pedirObjeto).not.toHaveBeenCalled();
  });
});

// ── El SÍ que no entendíamos (23/09) ───────────────────────────────────────
// Naza y Mariano leyeron la bienvenida —Meta confirmó "leído"— y siguieron en
// `invitado`. El detector del consentimiento era `/^si\b/`, más pobre que el
// `leerSiNo` que ya vivía en este mismo archivo: "Sii", "Dale", "Ok", "Claro" y
// "Vamos" no entraban. Y el bot se quedaba MUDO, así que la persona contestaba,
// no pasaba nada, y no volvía a intentar.
describe('el SÍ de la bienvenida', () => {
  const invitado = () => narradorEn('invitado', 0, { trato: 'vos' });

  for (const texto of ['SÍ', 'Sii', 'Siiii', 'Dale', 'Ok', 'Listo', 'Claro', 'Vamos', 'De una', 'Vale']) {
    it(`«${texto}» arranca la entrevista`, async () => {
      mocks.estado.narrador = invitado();
      await procesarEntrante({ telefono: TEL, tipo: 'texto', texto, waMessageId: 'w' });
      expect(update('narradores')?.p).toMatchObject({ estado: 'acepto' });
    });
  }

  it('lo que no entendemos se contesta, no se ignora — y una sola vez', async () => {
    mocks.estado.narrador = invitado();
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: '¿esto qué es?', waMessageId: 'w' });
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, expect.stringContaining('SÍ'));
    expect(update('narradores')?.p).toMatchObject({ contexto: expect.objectContaining({ sePidioDeNuevo: true }) });

    // La segunda vez ya no se insiste.
    mocks.enviarTexto.mockClear();
    mocks.estado.narrador = narradorEn('invitado', 0, { trato: 'vos', sePidioDeNuevo: true });
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'no entiendo nada', waMessageId: 'w' });
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('a quien dice que no se le deja la puerta abierta, no se lo empuja', async () => {
    mocks.estado.narrador = invitado();
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'ahora no', waMessageId: 'w' });
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, expect.stringContaining('Cuando tengas ganas'));
    expect(update('narradores')?.p).not.toMatchObject({ estado: 'acepto' });
  });
});

// ── El arranque del regalo en tres idiomas (regalo-idiomas, Task 4) ─────────
// Un regalo va siempre por la V3: los textos del SÍ salen de ARRANQUE en el
// idioma del regalo, y la primera pregunta sale con el SÍ, sea cual sea el ritmo.
describe('el SÍ de un regalo, en su idioma', () => {
  const regaloCa = (extra: Record<string, any> = {}) => narradorEn('invitado', 0, { regalo: true, idioma: 'ca', genero: 'mujer', ritmo: 'diario', ...extra });
  beforeEach(() => { mocks.estado.enviosRepregunta = [{ id: 'e-bienvenida' }]; }); // ya tuvo su bienvenida

  it('«Endavant» lo pasa a acepto, con permiso de voz, en catalán, con el hito y la primera pregunta aunque el ritmo sea diario', async () => {
    delete process.env.WA_BIENVENIDA_PIDE_VOZ;
    mocks.estado.narrador = regaloCa();
    mocks.enviarPregunta.mockResolvedValue(true);
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Endavant', waMessageId: 'w' });
    const p = update('narradores')?.p as Record<string, unknown>;
    expect(p.estado).toBe('acepto');
    expect(typeof p.consentimiento_voz_at).toBe('string');
    expect(mocks.enviarTexto).toHaveBeenCalledTimes(1);
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, ARRANQUE.ca.aceptacion.replace('{{nombre}}', 'Don Osvaldo'));
    expect(mocks.mandarHito).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'acepto');
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1', estado: 'acepto' }), 1, { plantilla: false });
  });

  it('un regalo es-ES con ritmo dos_por_dia también recibe la primera pregunta con el SÍ', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, { regalo: true, idioma: 'es-ES', genero: 'varon', ritmo: 'dos_por_dia' });
    mocks.enviarPregunta.mockResolvedValue(true);
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Venga', waMessageId: 'w' });
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, ARRANQUE['es-ES'].aceptacion.replace('{{nombre}}', 'Don Osvaldo'));
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ estado: 'acepto' }), 1, { plantilla: false });
  });

  it('un regalo sin idioma: los textos de ARRANQUE es-AR, no los de siempre', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, { regalo: true, genero: 'varon' });
    mocks.enviarPregunta.mockResolvedValue(true);
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'SÍ', waMessageId: 'w' });
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, ARRANQUE['es-AR'].aceptacion.replace('{{nombre}}', 'Don Osvaldo'));
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ estado: 'acepto' }), 1, { plantilla: false });
  });

  // Nunca prometer una pregunta que no va a llegar: si el alta V3 se va a
  // frenar (sin género o con un idioma desconocido), el SÍ queda anotado pero
  // no sale la aceptación («ahí te mando la primera pregunta»): avisa a los socios.
  for (const [caso, contexto, motivo] of [
    ['sin género', { regalo: true, idioma: 'ca', ritmo: 'diario' }, 'falta el género'],
    ['con un idioma desconocido', { regalo: true, idioma: 'pt-BR', genero: 'mujer', ritmo: 'diario' }, 'el idioma no es válido'],
  ] as const) {
    it(`un regalo ${caso}: anota el SÍ, no promete la pregunta y avisa a los socios`, async () => {
      delete process.env.WA_BIENVENIDA_PIDE_VOZ;
      mocks.estado.narrador = narradorEn('invitado', 0, { ...contexto });
      mocks.enviarPregunta.mockResolvedValue(true);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'SÍ', waMessageId: 'w' });
      } finally {
        error.mockRestore();
      }
      const p = update('narradores')?.p as Record<string, unknown>;
      expect(p.estado).toBe('acepto');
      expect(typeof p.consentimiento_voz_at).toBe('string');
      expect(mocks.enviarTexto).not.toHaveBeenCalled();
      expect(mocks.enviarPregunta).not.toHaveBeenCalled();
      // El mail «dijo que sí» de un regalo dice «ya le mandamos la primera pregunta»: tampoco.
      expect(mocks.mandarHito).not.toHaveBeenCalled();
      expect(mocks.avisarSocios).toHaveBeenCalledTimes(1);
      const [clave, asunto, detalle] = mocks.avisarSocios.mock.calls[0];
      expect(clave).toContain('n1');
      expect(asunto).toBe(`Regalo frenado: Don Osvaldo dijo que sí pero ${motivo}`);
      expect(detalle).toContain('n1');
      // El paso real para destrabarlo (revisión final, 09/10): completar la ficha y esperar a que escriba.
      expect(detalle).toContain('narradores.contexto');
      expect(detalle).toContain('Esperar a que el narrador escriba');
      expect(detalle).toContain('npm run v3-pasar -- n1');
    });
  }

  it("«Què?» recibe el «no t'he entès» en catalán, una sola vez", async () => {
    mocks.estado.narrador = regaloCa();
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Què?', waMessageId: 'w' });
    expect(mocks.enviarTexto).toHaveBeenCalledTimes(1);
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, ARRANQUE.ca.noEntendi);
    expect(update('narradores')?.p).toMatchObject({ contexto: expect.objectContaining({ sePidioDeNuevo: true }) });
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();

    mocks.enviarTexto.mockClear();
    mocks.estado.narrador = regaloCa({ sePidioDeNuevo: true });
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Què vol dir això?', waMessageId: 'w' });
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('«Ara no» recibe el «cap problema» en catalán y no arranca', async () => {
    mocks.estado.narrador = regaloCa();
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Ara no', waMessageId: 'w' });
    expect(mocks.enviarTexto).toHaveBeenCalledWith(TEL, ARRANQUE.ca.noQuiere.replace('{{nombre}}', 'Don Osvaldo'));
    expect(update('narradores')?.p).not.toMatchObject({ estado: 'acepto' });
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
  });
});

// ── El mail «dijo que sí» de un regalo sale después de la 1 (revisión final, 09/10) ──
// Su texto dice «ya le mandamos la primera pregunta»: solo puede salir si salió.
describe('el orden del mail «dijo que sí»', () => {
  beforeEach(() => { mocks.estado.enviosRepregunta = [{ id: 'e-bienvenida' }]; }); // ya tuvo su bienvenida
  const orden = (fn: { mock: { invocationCallOrder: number[] } }) => fn.mock.invocationCallOrder[0];

  it('un regalo: primero la 1, después el mail', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, { regalo: true, idioma: 'es-ES', genero: 'mujer' });
    mocks.enviarPregunta.mockResolvedValue(true);
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Vale', waMessageId: 'w' });
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ estado: 'acepto' }), 1, { plantilla: false });
    expect(mocks.mandarHito).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'acepto');
    expect(orden(mocks.enviarPregunta)).toBeLessThan(orden(mocks.mandarHito));
  });

  for (const [caso, preparar] of [
    ['no sale (devuelve false)', () => mocks.enviarPregunta.mockResolvedValue(false)],
    ['tira', () => mocks.enviarPregunta.mockRejectedValue(new Error('Meta caída'))],
  ] as const) {
    it(`un regalo cuya 1 ${caso}: no va el mail y queda en el log`, async () => {
      mocks.estado.narrador = narradorEn('invitado', 0, { regalo: true, idioma: 'ca', genero: 'mujer' });
      preparar();
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: "D'acord", waMessageId: 'w' });
        expect(error.mock.calls.some((c) => String(c[0]).includes('n1') && String(c[0]).includes('dijo que sí'))).toBe(true);
      } finally {
        error.mockRestore();
      }
      expect(update('narradores')?.p).toMatchObject({ estado: 'acepto' });
      expect(mocks.mandarHito).not.toHaveBeenCalled();
    });
  }

  it('un narrador que no es regalo sigue igual: el mail primero, después la 1 (ritmo seguido)', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, { trato: 'vos', ritmo: 'seguido' });
    mocks.enviarPregunta.mockResolvedValue(true);
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Dale', waMessageId: 'w' });
    expect(orden(mocks.mandarHito)).toBeLessThan(orden(mocks.enviarPregunta));
  });

  it('un narrador que no es regalo recibe el mail aunque la 1 no salga', async () => {
    mocks.estado.narrador = narradorEn('invitado', 0, { trato: 'vos', ritmo: 'seguido' });
    mocks.enviarPregunta.mockResolvedValue(false);
    await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'Dale', waMessageId: 'w' });
    expect(mocks.mandarHito).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'acepto');
  });
});

// ── Un regalo frenado arranca con su próximo mensaje (revisión final, 09/10) ──
// En 'acepto' sin fila V3, cualquier mensaje abre la ventana: se intenta la 1
// como texto libre. Si la ficha sigue incompleta, altaNuevo lo vuelve a frenar.
describe('un regalo frenado en acepto', () => {
  const frenado = (extra: Record<string, any> = {}) => narradorEn('acepto', 0, { regalo: true, idioma: 'es-ES', genero: 'varon', ...extra });
  const callado = async (fn: () => Promise<unknown>) => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await fn();
    } finally {
      aviso.mockRestore();
      error.mockRestore();
    }
  };

  it('cualquier texto intenta la 1 con la ventana abierta y, si sale, manda el mail «dijo que sí»', async () => {
    mocks.estado.narrador = frenado();
    mocks.enviarPregunta.mockResolvedValue(true);
    await callado(() => procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'hola?', waMessageId: 'w' }));
    expect(mocks.enviarPregunta).toHaveBeenCalledTimes(1);
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1', estado: 'acepto' }), 1, { plantilla: false });
    expect(mocks.mandarHito).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 'acepto');
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('un audio también la intenta', async () => {
    mocks.estado.narrador = frenado();
    mocks.enviarPregunta.mockResolvedValue(true);
    await callado(() => procesarEntrante({ telefono: TEL, tipo: 'audio', mediaId: 'm1', waMessageId: 'w' } as MensajeEntrante));
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 1, { plantilla: false });
  });

  it('una foto la intenta y además se guarda como siempre', async () => {
    mocks.estado.narrador = frenado();
    mocks.enviarPregunta.mockResolvedValue(true);
    await callado(() => procesarEntrante({ telefono: TEL, tipo: 'imagen', mediaId: 'img1', mimeType: 'image/jpeg', waMessageId: 'w' } as MensajeEntrante));
    expect(mocks.enviarPregunta).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }), 1, { plantilla: false });
    expect(mocks.recibirFotoFamiliar).toHaveBeenCalled();
  });

  it('si la ficha sigue incompleta (la 1 no sale), no va el mail y el mensaje se ignora como hoy', async () => {
    mocks.estado.narrador = frenado({ genero: undefined });
    mocks.enviarPregunta.mockResolvedValue(false);
    await callado(() => procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'hola?', waMessageId: 'w' }));
    expect(mocks.enviarPregunta).toHaveBeenCalledTimes(1);
    expect(mocks.mandarHito).not.toHaveBeenCalled();
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });

  it('si la 1 tira, el entrante no se cae ni va el mail', async () => {
    mocks.estado.narrador = frenado();
    mocks.enviarPregunta.mockRejectedValue(new Error('Meta caída'));
    await callado(() => expect(procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'hola?', waMessageId: 'w' })).resolves.toBeUndefined());
    expect(mocks.mandarHito).not.toHaveBeenCalled();
  });

  it('si la base falla al mirar la fila V3 (no por tabla ausente), se anota, no manda nada y el entrante sigue', async () => {
    mocks.estado.narrador = frenado();
    mocks.estado.errorV3 = { code: '57014', message: 'canceling statement due to statement timeout' };
    mocks.enviarPregunta.mockResolvedValue(true);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await expect(
        procesarEntrante({ telefono: TEL, tipo: 'imagen', mediaId: 'img1', mimeType: 'image/jpeg', waMessageId: 'w' } as MensajeEntrante),
      ).resolves.toBeUndefined();
      expect(error).toHaveBeenCalledWith(expect.stringContaining('n1'), expect.anything());
    } finally {
      error.mockRestore();
      aviso.mockRestore();
    }
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
    expect(mocks.mandarHito).not.toHaveBeenCalled();
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
    // El resto del entrante sigue como antes: la foto se guarda igual.
    expect(mocks.recibirFotoFamiliar).toHaveBeenCalled();
  });

  it('un regalo que ya tiene su fila V3 no la intenta de nuevo', async () => {
    mocks.estado.narrador = frenado();
    mocks.estado.filaV3 = { narrador_id: 'n1' };
    await callado(() => procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'hola?', waMessageId: 'w' }));
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
  });

  it('un acepto que no es regalo sigue ignorando los mensajes', async () => {
    mocks.estado.narrador = narradorEn('acepto', 0, { trato: 'vos', genero: 'varon' });
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await procesarEntrante({ telefono: TEL, tipo: 'texto', texto: 'hola?', waMessageId: 'w' });
      expect(aviso).toHaveBeenCalledWith(expect.stringContaining("'acepto'"));
    } finally {
      aviso.mockRestore();
    }
    expect(mocks.enviarPregunta).not.toHaveBeenCalled();
    expect(mocks.mandarHito).not.toHaveBeenCalled();
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });
});

describe('leerSiNo en catalán y de España', () => {
  for (const t of ["D'acord", 'Som-hi!', 'Endavant', 'Vale', 'Venga', 'Vinga', 'Va', 'Comencem']) {
    it(`«${t}» es sí`, () => expect(leerSiNo(t)).toBe('si'));
  }
  for (const t of ['Ara no', 'Demà', 'Després', 'Més tard', 'Avui no']) {
    it(`«${t}» es no`, () => expect(leerSiNo(t)).toBe('no'));
  }
});
