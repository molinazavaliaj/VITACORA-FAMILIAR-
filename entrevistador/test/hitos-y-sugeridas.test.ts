import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  Object.assign(process.env, {
    SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'clave',
    ANTHROPIC_API_KEY: 'clave', OPENAI_API_KEY: 'clave',
    WA_TOKEN: 'clave', WA_PHONE_NUMBER_ID: '123', WA_VERIFY_TOKEN: 'verificador',
  });
});

const estado = vi.hoisted(() => ({ contexto: {} as Record<string, any>, email: 'martina@mail.com' as string | null, region: null as string | null, updates: [] as any[], fetch: vi.fn() }));

vi.mock('../src/db/cliente.js', () => {
  function builder(tabla: string) {
    const b: any = { _op: 'select' };
    b.select = () => b; b.eq = () => b; b.limit = () => b; b.order = () => b; b.is = () => b;
    b.update = (p: any) => { b._op = 'update'; estado.updates.push({ tabla, p }); return b; };
    const resolver = () => {
      if (b._op === 'update') return { data: null, error: null };
      if (tabla === 'narradores') return { data: { contexto: estado.contexto } };
      if (tabla === 'familias') return { data: estado.email ? { email: estado.email, region: estado.region } : null };
      return { data: null };
    };
    b.maybeSingle = () => Promise.resolve(resolver());
    b.then = (res: any) => Promise.resolve(resolver()).then(res);
    return b;
  }
  return { db: { from: (t: string) => builder(t) } };
});

vi.mock('../src/whatsapp/enviar.js', () => ({ enviarTexto: vi.fn(), enviarPlantilla: vi.fn(), enviarAudioPorLink: vi.fn(), enviarImagenPorLink: vi.fn() }));
vi.mock('../src/ia/cerebro.js', () => ({ evaluarRespuesta: vi.fn(), detectarIntencion: vi.fn(), generarPreguntaReemplazo: vi.fn() }));
vi.mock('../src/ia/personalizar.js', () => ({ personalizarPregunta: vi.fn() }));
vi.mock('../src/ia/transcribir.js', () => ({ transcribirYActualizar: vi.fn() }));
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create: vi.fn() }; } }));

import { mandarHito, mandarMailFamilia, redactarHito } from '../src/mail/hitos.js';
import { leerSiNo } from '../src/flujo/procesar.js';
import { parsearSugeridas, PROMPT_SUGERIDAS } from '../src/ia/sugeridas.js';
import { textoEvitar, sumarTemaEvitado } from '../src/ia/evitar.js';

beforeEach(() => {
  estado.contexto = {};
  estado.email = 'martina@mail.com';
  estado.region = null;
  estado.updates = [];
  estado.fetch.mockReset().mockResolvedValue({ ok: true, text: async () => '' });
  vi.stubGlobal('fetch', estado.fetch);
  process.env.RESEND_API_KEY = 'clave';
});

const n = { id: 'n1', nombre: 'Roberto', como_le_dicen: 'Papá', familia_id: 'fam-1', contexto: {} as Record<string, any> };

describe('mails de hitos', () => {
  it('el «dijo que sí» de un viaje regalado habla del viaje, con vos o con tú', () => {
    const vos = redactarHito('acepto', n, { viaje: true });
    expect(vos.asunto).toBe('Roberto dijo que sí');
    expect(vos.cuerpo).toContain('la primera pregunta de su viaje');
    expect(vos.cuerpo).toContain('/tablero/n1');
    expect(redactarHito('acepto', n, { viaje: true, trato: 'tu' }).asunto).toBe('Roberto ha dicho que sí');
  });

  it('redacta cada hito con el nombre y el link al panel', () => {
    expect(redactarHito('acepto', n).asunto).toBe('Roberto dijo que sí');
    expect(redactarHito('silencio', n).cuerpo).toContain('/tablero/n1');
    expect(redactarHito('mitad', { id: 'n2', como_le_dicen: 'Abuela' }).asunto).toBe('Abuela va por la mitad');
  });

  it('«dijo que sí» de lo que no es regalo: el aprobado el 06/10, de vos o de tú según el país (Naza, 09/10)', () => {
    const r = redactarHito('acepto', n);
    expect(r.asunto).toBe('Roberto dijo que sí');
    expect(r.cuerpo).toBe('<p>Roberto aceptó. Enseguida le llega la primera pregunta por WhatsApp.</p><p>Mientras tanto, podés sumar fotos de cada época o preguntas para su entrevista.</p><p><a href="https://www.vitacorafamiliar.com/tablero/n1?editar=1">https://www.vitacorafamiliar.com/tablero/n1</a></p>');
    expect(redactarHito('acepto', n, { regalo: false, trato: 'tu' }).cuerpo).toBe(r.cuerpo.replace('podés', 'puedes'));
  });

  it('«dijo que sí» de un regalo, de vos: ya le mandamos la primera pregunta, sin guion ni «mañana»', () => {
    const r = redactarHito('acepto', n, { regalo: true, trato: 'vos' });
    expect(r.asunto).toBe('Roberto dijo que sí');
    expect(r.cuerpo).toContain('Roberto dijo que sí y ya le mandamos la primera pregunta por WhatsApp. Lo que vaya contando lo vas a poder escuchar en tu tablero.');
    expect(r.cuerpo).toContain('href="https://www.vitacorafamiliar.com/tablero/n1"');
    expect(r.cuerpo).not.toMatch(/Mañana|guion/);
  });

  it('«dijo que sí» de un regalo, de tú', () => {
    const r = redactarHito('acepto', n, { regalo: true, trato: 'tu' });
    expect(r.asunto).toBe('Roberto ha dicho que sí');
    expect(r.cuerpo).toContain('Roberto ha dicho que sí y ya le hemos mandado la primera pregunta por WhatsApp. Lo que vaya contando lo podrás escuchar en tu tablero.');
    expect(r.cuerpo).toContain('/tablero/n1');
  });

  it('mandarHito elige el trato del regalo por familias.region', async () => {
    // mandarHito relee el contexto de la base: ahí está la marca del regalo.
    estado.contexto = { regalo: true };
    estado.region = 'ES';
    await mandarHito({ ...n, contexto: { regalo: true } }, 'acepto');
    expect(JSON.parse(estado.fetch.mock.calls[0][1].body).subject).toBe('Roberto ha dicho que sí');
    estado.region = 'AR';
    await mandarHito({ ...n, contexto: { regalo: true } }, 'acepto');
    expect(JSON.parse(estado.fetch.mock.calls[1][1].body).html).toContain('ya le mandamos la primera pregunta');
    estado.contexto = {};
    estado.region = 'ES';
    await mandarHito({ ...n, contexto: {} }, 'acepto');
    // Sin regalo, de España: el «dijo que sí» de siempre, con tú.
    expect(JSON.parse(estado.fetch.mock.calls[2][1].body).html).toContain('Enseguida le llega la primera pregunta');
    expect(JSON.parse(estado.fetch.mock.calls[2][1].body).html).toContain('puedes sumar fotos');
  });

  it('manda una sola vez por narrador y lo anota en contexto.mailsEnviados', async () => {
    await mandarHito({ ...n, contexto: {} }, 'primera');
    expect(estado.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(estado.fetch.mock.calls[0][1].body)).toMatchObject({ to: ['martina@mail.com'], subject: 'Ya podés escuchar a Roberto' });
    expect(estado.updates[0].p.contexto.mailsEnviados).toEqual(['primera']);

    estado.contexto = { mailsEnviados: ['primera'] };
    await mandarHito({ ...n, contexto: {} }, 'primera');
    expect(estado.fetch).toHaveBeenCalledTimes(1); // no repite
  });

  it('sin RESEND_API_KEY no manda ni anota; sin mail de la familia tampoco; y nunca tira', async () => {
    delete process.env.RESEND_API_KEY;
    await mandarHito({ ...n, contexto: {} }, 'acepto');
    expect(estado.fetch).not.toHaveBeenCalled();
    expect(estado.updates).toHaveLength(0);
    process.env.RESEND_API_KEY = 'clave';
    estado.email = null;
    await mandarHito({ ...n, contexto: {} }, 'acepto');
    expect(estado.fetch).not.toHaveBeenCalled();
    estado.email = 'martina@mail.com';
    estado.fetch.mockRejectedValue(new Error('caída'));
    await expect(mandarHito({ ...n, contexto: {} }, 'acepto')).resolves.toBeUndefined();
  });
});

describe('mandarMailFamilia (recordatorio del regalo)', () => {
  it('manda al mail de la familia con el cuerpo escapado y el botón «Ver la tarjeta» a la página del regalo', async () => {
    expect(await mandarMailFamilia('fam-1', 'abuelo todavía no abrió su regalo', 'Hola <b>vos</b>', 'n1')).toBe(true);
    const cuerpo = JSON.parse(estado.fetch.mock.calls[0][1].body);
    expect(cuerpo).toMatchObject({ to: ['martina@mail.com'], subject: 'abuelo todavía no abrió su regalo' });
    expect(cuerpo.html).toContain('Hola &lt;b&gt;vos&lt;/b&gt;');
    expect(cuerpo.html).toContain('Ver la tarjeta');
    expect(cuerpo.html).toContain('/tablero/n1/regalo');
  });
  it('false sin mail de la familia, sin RESEND_API_KEY o si Resend falla; nunca tira', async () => {
    estado.email = null;
    expect(await mandarMailFamilia('fam-1', 'a', 'b', 'n1')).toBe(false);
    estado.email = 'martina@mail.com';
    delete process.env.RESEND_API_KEY;
    expect(await mandarMailFamilia('fam-1', 'a', 'b', 'n1')).toBe(false);
    process.env.RESEND_API_KEY = 'clave';
    estado.fetch.mockRejectedValue(new Error('caída'));
    expect(await mandarMailFamilia('fam-1', 'a', 'b', 'n1')).toBe(false);
    expect(estado.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('leerSiNo — la respuesta a "¿otra ahora?"', () => {
  it('entiende síes y noes cortos, con acentos y signos', () => {
    expect(leerSiNo('Sí!')).toBe('si');
    expect(leerSiNo('dale')).toBe('si');
    expect(leerSiNo('Bueno, mandá')).toBe('si');
    expect(leerSiNo('no, mañana')).toBe('no');
    expect(leerSiNo('Ahora no')).toBe('no');
  });
  it('un relato largo no es ni sí ni no: es una respuesta más', () => {
    expect(leerSiNo('si, y además me acuerdo que mi vieja hacía pan los domingos en el horno de barro')).toBeNull();
    expect(leerSiNo('me acuerdo del patio')).toBeNull();
  });
});

describe('sugeridas', () => {
  it('parsea 5, tolera ```json y corrige un capítulo inventado', () => {
    const cinco = JSON.stringify(Array.from({ length: 5 }, (_, i) => ({ texto: `P${i}`, capitulo: i === 4 ? 'Inventado' : 'La infancia' })));
    const r = parsearSugeridas('```json\n' + cinco + '\n```', ['La infancia', 'El amor']);
    expect(r).toHaveLength(5);
    expect(r[4].capitulo).toBe('La infancia');
  });
  it('con menos de 5, falla claro', () => {
    expect(() => parsearSugeridas('[{"texto":"x","capitulo":"y"}]', ['y'])).toThrow(/esperaba 5/);
  });
});

describe('textoEvitar', () => {
  it('vacío si no hay nada; el bloque si la familia escribió algo', () => {
    expect(textoEvitar({})).toBe('');
    expect(textoEvitar({ evitar: '  ' })).toBe('');
    expect(textoEvitar({ evitar: 'No preguntar por Rubén.' })).toContain('No preguntar por Rubén.');
  });
});

// Bitácora 34: "vamos por otro lado" → el tema entra a `evitar`, debajo de lo
// que escribió la familia, marcado para que se sepa de dónde salió.
describe('sumarTemaEvitado', () => {
  it('suma el tema debajo de lo que ya había, con la marca', () => {
    const c = sumarTemaEvitado({ evitar: 'No preguntar por Rubén.', trato: 'vos' }, 'su tío y las drogas.');
    expect(c).toEqual({ trato: 'vos', evitar: 'No preguntar por Rubén.\nsu tío y las drogas (lo pidió él en la entrevista)' });
    // Y el prompt lo lleva junto con lo de la familia.
    expect(textoEvitar(c)).toContain('su tío y las drogas');
  });

  it('con evitar vacío arranca la lista', () => {
    expect(sumarTemaEvitado({}, 'la muerte de su hermano')?.evitar).toBe('la muerte de su hermano (lo pidió él en la entrevista)');
    expect(sumarTemaEvitado(null, 'la muerte de su hermano')?.evitar).toBe('la muerte de su hermano (lo pidió él en la entrevista)');
  });

  it('no anota nada si viene vacío, si es un párrafo, si ya estaba o si no entra en el panel', () => {
    expect(sumarTemaEvitado({}, '')).toBeNull();
    expect(sumarTemaEvitado({}, undefined)).toBeNull();
    expect(sumarTemaEvitado({}, 'x'.repeat(121))).toBeNull();
    expect(sumarTemaEvitado({ evitar: 'Su tío y las drogas (lo pidió él en la entrevista)' }, 'su tío y las drogas')).toBeNull();
    expect(sumarTemaEvitado({ evitar: 'a'.repeat(980) }, 'su tío y las drogas')).toBeNull();
  });
});

describe('el trato en las sugeridas', () => {
  it('con vos pide tutearlo', () => {
    const p = PROMPT_SUGERIDAS('Ciro', 'Contó del taller.', ['¿Cómo era su casa?'], ['La infancia'], '', 'vos');
    expect(p).toContain('Cada pregunta: tratarlo de vos');
    expect(p).not.toContain('tratarlo de usted');
  });

  it('con usted queda como estaba', () => {
    const p = PROMPT_SUGERIDAS('Don Osvaldo', 'Contó del taller.', ['¿Cómo era su casa?'], ['La infancia'], '', 'usted');
    expect(p).toContain('Cada pregunta: tratarlo de usted');
  });

  it('el default sigue siendo usted', () => {
    expect(PROMPT_SUGERIDAS('Don Osvaldo', '', [], ['La infancia'])).toContain('Cada pregunta: tratarlo de usted');
  });
});

describe('mails de hitos con tú para España (Naza, 09/10)', () => {
  it('con tú cambian puedes y quieres; con vos (o sin decir), los de siempre; el silencio no cambia', async () => {
    const { redactarHito } = await import('../src/mail/hitos.js');
    const n = { nombre: 'Imma', como_le_dicen: 'Imma', id: 'n1' };
    expect(redactarHito('acepto', n, { trato: 'tu' }).cuerpo).toContain('Mientras tanto, puedes sumar fotos de cada época o preguntas para su entrevista.');
    expect(redactarHito('acepto', n).cuerpo).toContain('Enseguida le llega la primera pregunta por WhatsApp.</p><p>Mientras tanto, podés sumar fotos');
    expect(redactarHito('acepto', n).cuerpo).not.toContain('guion');
    expect(redactarHito('primera', n, { trato: 'tu' }).asunto).toBe('Ya puedes escuchar a Imma');
    expect(redactarHito('mitad', n, { trato: 'tu' }).cuerpo).toContain('si quieres, pedirle que cuente más');
    expect(redactarHito('silencio', n, { trato: 'tu' })).toEqual(redactarHito('silencio', n, { trato: 'vos' }));
    expect(redactarHito('primera', n).asunto).toBe('Ya podés escuchar a Imma');
    for (const h of ['acepto', 'primera', 'mitad'] as const) expect(redactarHito(h, n, { trato: 'tu' }).cuerpo + redactarHito(h, n, { trato: 'tu' }).asunto).not.toMatch(/podés|querés/);
  });
});
