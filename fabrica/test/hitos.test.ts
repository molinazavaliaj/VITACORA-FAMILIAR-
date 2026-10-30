import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asuntoHito, cuerpoHito, enviarMailHito, CANDADO_POR_HITO, type Hito } from '../src/mail/hitos.js';

// Los seis del cierre del libro, más los tres de lo físico que viaja (3t.26 fase 2).
const HITOS: Hito[] = [
  'terminado',
  'libro_listo',
  'recordatorio_3',
  'recordatorio_7',
  'recordatorio_14',
  'cierre_automatico',
  'falta_direccion',
  'enviado',
  'entregado',
  // Las dudas del escritor (30/10).
  'dudas',
  'dudas_listas',
];

describe('asuntoHito / cuerpoHito', () => {
  it('cada hito tiene asunto con el como_le_dicen y cuerpo con el enlace', () => {
    for (const hito of HITOS) {
      expect(asuntoHito(hito, 'papá')).toContain('papá');
      const cuerpo = cuerpoHito(hito, { comoLeDicen: 'papá', enlace: 'https://x/tablero/n1' });
      expect(cuerpo).toContain('https://x/tablero/n1');
      expect(cuerpo).toContain('En cada familia hay un libro sin escribir.');
    }
  });

  it('escapa el como_le_dicen', () => {
    expect(cuerpoHito('terminado', { comoLeDicen: '<b>', enlace: 'https://x' })).toContain('&lt;b&gt;');
    expect(cuerpoHito('terminado', { comoLeDicen: '<b>', enlace: 'https://x' })).not.toContain('<b>');
  });

  it('«libro listo» sin voz (una historia sin frases con audio): no promete escucharla, en vos y en tú, con el candado de «libro listo»', () => {
    const vos = cuerpoHito('libro_listo_sin_voz', { comoLeDicen: 'mamá', enlace: 'https://x', variante: 'vos' });
    const tu = cuerpoHito('libro_listo_sin_voz', { comoLeDicen: 'mamá', enlace: 'https://x', variante: 'tu' });
    expect(vos).toContain('escrito con sus palabras, para leer cuando quieras.');
    expect(vos).toContain('Entrá cuando quieras a leerlo o descargarlo.');
    expect(tu).toContain('Entra cuando quieras a leerlo o descargarlo.');
    for (const c of [vos, tu]) expect(c).not.toMatch(/voz|escuch/i);
    expect(asuntoHito('libro_listo_sin_voz', 'mamá')).toBe('El libro de tu mamá está listo');
    expect(CANDADO_POR_HITO.libro_listo_sin_voz).toBe(CANDADO_POR_HITO.libro_listo);
  });

  it('cada hito tiene su candado, todos distintos (salvo «libro listo» sin voz, que comparte el suyo)', () => {
    expect(new Set(Object.values(CANDADO_POR_HITO)).size).toBe(HITOS.length);
    expect(CANDADO_POR_HITO.recordatorio_7).toBe('recordatorio_cierre_7.txt');
    expect(CANDADO_POR_HITO.libro_listo).toBe('libro_listo_enviado.txt');
  });
});

describe('enviarMailHito', () => {
  const fetchOriginal = globalThis.fetch;
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
    process.env.ANTHROPIC_API_KEY = 'k';
    process.env.OPENAI_API_KEY = 'k';
  });
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    delete process.env.RESEND_API_KEY;
  });

  it('sin RESEND_API_KEY devuelve false y no llama a fetch', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as never;
    const ok = await enviarMailHito({ hito: 'libro_listo', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' });
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con clave, POSTea a Resend con el asunto del hito y devuelve true', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as never;
    const ok = await enviarMailHito({ hito: 'recordatorio_3', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' });
    expect(ok).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['a@b.c']);
    expect(body.subject).toBe(asuntoHito('recordatorio_3', 'papá'));
  });

  it('si Resend rechaza, tira', async () => {
    process.env.RESEND_API_KEY = 're_test';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'nope' }) as never;
    await expect(enviarMailHito({ hito: 'terminado', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' })).rejects.toThrow('422');
  });
});

describe('"terminó de contar" de un narrador V3 (Naza, 08/10)', () => {
  it('con vos (Argentina) y con tú (España): sin nombres ni orden de capítulos', async () => {
    const { cuerpoHito, asuntoHito } = await import('../src/mail/hitos.js');
    const vos = cuerpoHito('terminado', { comoLeDicen: 'Babu', enlace: 'https://x', variante: 'vos' });
    expect(vos).toContain('Tu Babu respondió la última pregunta. Su historia está completa.');
    expect(vos).toContain('Ahora te toca a vos. Entrá, elegí la foto y el título de la tapa, y cerrá el libro.');
    expect(vos).toContain('Cuando lo cierres, lo escribimos con sus palabras y te avisamos.');
    const tu = cuerpoHito('terminado', { comoLeDicen: 'Imma', enlace: 'https://x', variante: 'tu' });
    expect(tu).toContain('Ahora te toca a ti. Entra, elige la foto y el título de la tapa, y cierra el libro.');
    for (const t of [vos, tu]) {
      expect(t).not.toContain('nombres');
      expect(t).not.toContain('orden de los capítulos');
      expect(t).toContain('Cerrar el libro');
    }
    expect(asuntoHito('terminado', 'Babu', 'vos')).toBe('Tu Babu terminó de contar');
    // Sin variante, el de siempre; y la variante no toca los demás hitos.
    expect(cuerpoHito('terminado', { comoLeDicen: 'papá', enlace: 'https://x' })).toContain('revisa los nombres');
    expect(cuerpoHito('recordatorio_3', { comoLeDicen: 'papá', enlace: 'https://x' })).toContain('revisar nombres');
  });

  it('los recordatorios y el cierre automático V3: con vos o tú, sin nombres, orden ni propuesta', async () => {
    const { cuerpoHito, asuntoHito } = await import('../src/mail/hitos.js');
    const c = (h: 'recordatorio_3' | 'recordatorio_7' | 'recordatorio_14' | 'cierre_automatico', v: 'vos' | 'tu') => cuerpoHito(h, { comoLeDicen: 'Babu', enlace: 'https://x', variante: v });
    expect(c('recordatorio_3', 'vos')).toContain('Son cinco minutos. Elegí la foto y el título de la tapa, y cerralo.');
    expect(c('recordatorio_3', 'tu')).toContain('Son cinco minutos. Elige la foto y el título de la tapa, y ciérralo.');
    expect(c('recordatorio_7', 'vos')).toContain('Si no querés cambiar nada de la tapa, entrá y cerralo así. Queda perfecto igual.');
    expect(c('recordatorio_7', 'tu')).toContain('Si no quieres cambiar nada de la tapa, entra y ciérralo así. Queda perfecto igual.');
    expect(c('recordatorio_14', 'vos')).toContain('Si en dos semanas más no lo cerrás, lo cerramos nosotros y lo escribimos igual.');
    expect(c('recordatorio_14', 'tu')).toContain('Si en dos semanas más no lo cierras, lo cerramos nosotros y lo escribimos igual.');
    expect(c('cierre_automatico', 'vos')).toContain('el libro seguía abierto, así que lo cerramos nosotros.');
    expect(asuntoHito('cierre_automatico', 'Babu', 'vos')).toBe('Cerramos el libro de tu Babu por vos');
    expect(asuntoHito('cierre_automatico', 'Imma', 'tu')).toBe('Cerramos el libro de tu Imma por ti');
    for (const h of ['recordatorio_3', 'recordatorio_7', 'recordatorio_14', 'cierre_automatico'] as const) {
      for (const v of ['vos', 'tu'] as const) {
        const t = c(h, v);
        expect(t, `${h} ${v}`).not.toMatch(/nombres|orden de los capítulos|propuesta|proponemos/);
      }
    }
    // El libro listo: con vos cambia solo «Entrá»; con tú, el de siempre.
    expect(cuerpoHito('libro_listo', { comoLeDicen: 'Babu', enlace: 'https://x', variante: 'vos' })).toBe(cuerpoHito('libro_listo', { comoLeDicen: 'Babu', enlace: 'https://x' }).replace('Entra cuando', 'Entrá cuando'));
    expect(cuerpoHito('libro_listo', { comoLeDicen: 'Babu', enlace: 'https://x', variante: 'tu' })).toBe(cuerpoHito('libro_listo', { comoLeDicen: 'Babu', enlace: 'https://x' }));
  });
});

describe('los mails de las dudas a la familia (Naza, 30/10)', () => {
  const o = { comoLeDicen: 'papá', enlace: 'https://x/tablero/n1/dudas' };

  it('las dudas: asunto, cuántas son y el trato de cada país', () => {
    expect(asuntoHito('dudas', 'papá', 'vos')).toBe('Unas preguntas sobre lo que contó tu papá');
    const vos = cuerpoHito('dudas', { ...o, variante: 'vos', cantidad: 25 });
    expect(vos).toContain('Al leer lo que contó tu papá nos quedaron algunas dudas. Un nombre que no se entendió, una fecha, un lugar.');
    expect(vos).toContain('Son 25 preguntas cortas. Las podés contestar vos o cualquiera de la familia que invitaste.');
    expect(vos).toContain('Lo que nos digas entra al libro. Contestalas antes de encargarlo.');
    expect(vos).toContain('Contestar las preguntas');
    expect(vos).toContain('https://x/tablero/n1/dudas');
    const tu = cuerpoHito('dudas', { ...o, variante: 'tu', cantidad: 25 });
    expect(tu).toContain('Las puedes contestar tú');
    expect(tu).toContain('Contéstalas antes de encargarlo.');
    // Argentina del flujo viejo cae en los de vos; sin variante, los de tú.
    expect(cuerpoHito('dudas', { ...o, variante: 'vos_viejo', cantidad: 25 })).toBe(vos);
    expect(cuerpoHito('dudas', { ...o, cantidad: 25 })).toBe(tu);
  });

  it('una sola duda va en singular', () => {
    const una = cuerpoHito('dudas', { ...o, variante: 'vos', cantidad: 1 });
    expect(una).toContain('Es una pregunta corta. La podés contestar vos');
    expect(una).toContain('Contestala antes de encargarlo.');
  });

  it('todas contestadas: falta encargar', () => {
    expect(asuntoHito('dudas_listas', 'papá', 'vos')).toBe('Falta un paso para el libro de tu papá');
    const vos = cuerpoHito('dudas_listas', { ...o, variante: 'vos' });
    expect(vos).toContain('Ya tenemos todas las respuestas. Gracias.');
    expect(vos).toContain('Falta un solo paso. Elegí la foto y el título de la tapa, sumá las fotos que quieras adentro y encargá el libro.');
    expect(vos).toContain('Recién ahí empezamos a escribirlo. Te avisamos cuando esté.');
    expect(vos).toContain('Encargar el libro');
    expect(cuerpoHito('dudas_listas', { ...o, variante: 'tu' })).toContain('Elige la foto y el título de la tapa, suma las fotos que quieras adentro y encarga el libro.');
  });

});

describe('mails de la entrega con vos para Argentina (Naza, 09/10)', () => {
  it('falta la dirección y llegó, con vos; con tú, los de siempre; el "va en camino" no cambia', async () => {
    const { cuerpoHito, asuntoHito } = await import('../src/mail/hitos.js');
    const o = { comoLeDicen: 'abuela', enlace: 'https://x' };
    expect(cuerpoHito('falta_direccion', { ...o, variante: 'vos' })).toContain('Son dos minutos. Entrá y dejanos la dirección de quien lo recibe.');
    expect(cuerpoHito('falta_direccion', o)).toContain('entra y déjanos la dirección');
    const llego = cuerpoHito('entregado', { ...o, variante: 'vos' });
    expect(llego).toContain('Acercá el teléfono a los códigos del libro');
    expect(llego).toContain('Si te emocionó, contalo.');
    expect(cuerpoHito('entregado', o)).toContain('Acerca el teléfono');
    expect(cuerpoHito('enviado', { ...o, variante: 'vos', seguimiento: 'AB123' })).toBe(cuerpoHito('enviado', { ...o, seguimiento: 'AB123' }));
    expect(asuntoHito('entregado', 'abuela', 'vos')).toBe(asuntoHito('entregado', 'abuela'));
  });
});

describe('mails de cierre del flujo viejo con vos para Argentina (Naza, 13/10)', () => {
  const sinVariante = (h: Hito) => cuerpoHito(h, { comoLeDicen: 'papá', enlace: 'https://x' });
  const conVos = (h: Hito) => cuerpoHito(h, { comoLeDicen: 'papá', enlace: 'https://x', variante: 'vos_viejo' });
  it('son los de siempre con el verbo conjugado, nada más', () => {
    expect(conVos('terminado')).toBe(sinVariante('terminado').replace('Ahora te toca a ti: entra, revisa los nombres y lugares que anotamos, elige el orden de los capítulos y la foto de la tapa, y cierra el libro.', 'Ahora te toca a vos: entrá, revisá los nombres y lugares que anotamos, elegí el orden de los capítulos y la foto de la tapa, y cerrá el libro.'));
    expect(conVos('recordatorio_3')).toBe(sinVariante('recordatorio_3'));
    expect(conVos('recordatorio_7')).toBe(sinVariante('recordatorio_7').replace('Si no tienes nada que cambiar, entra y ciérralo tal como te lo proponemos', 'Si no tenés nada que cambiar, entrá y cerralo tal como te lo proponemos'));
    expect(conVos('recordatorio_14')).toBe(sinVariante('recordatorio_14').replace('no lo cierras', 'no lo cerrás'));
    expect(conVos('cierre_automatico')).toBe(sinVariante('cierre_automatico'));
    expect(asuntoHito('cierre_automatico', 'papá', 'vos_viejo')).toBe('Cerramos el libro de tu papá por vos');
    expect(asuntoHito('terminado', 'papá', 'vos_viejo')).toBe(asuntoHito('terminado', 'papá'));
  });
  it('los que no son de cierre toman los de vos que ya iban a Argentina', () => {
    for (const h of ['libro_listo', 'falta_direccion', 'entregado', 'enviado'] as Hito[]) {
      expect(conVos(h), h).toBe(cuerpoHito(h, { comoLeDicen: 'papá', enlace: 'https://x', variante: 'vos' }));
    }
  });
  it('no queda ningún verbo en tú en los de vos', () => {
    for (const h of HITOS) expect(conVos(h), h).not.toMatch(/(toca a ti|entra|revisa|elige|cierra|tienes|ciérralo|cierras|por ti|Entra|Acerca|cuéntalo|déjanos)/);
  });
});
