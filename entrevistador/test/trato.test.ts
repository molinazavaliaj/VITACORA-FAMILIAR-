import { describe, it, expect, vi, beforeEach } from 'vitest';

// trato.ts importa config (al importarse lee process.env), el SDK y la base.
vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'clave');
vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

const mocks = vi.hoisted(() => ({
  crear: vi.fn(),
  updates: [] as { tabla: string; p: any }[],
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: mocks.crear }; },
}));

vi.mock('../src/db/cliente.js', () => {
  const cadena = (tabla: string) => {
    const q: any = {
      select: () => q,
      eq: () => q,
      maybeSingle: () => q,
      update: (p: any) => { mocks.updates.push({ tabla, p }); return q; },
      then: (resolver: any) => Promise.resolve({ data: null, error: null }).then(resolver),
    };
    return q;
  };
  return { db: { from: (tabla: string) => cadena(tabla) } };
});

const { tratoDe, fichaTieneDatos, esTrato, PROMPT_TRATO } = await import('../src/ia/trato.js');

const dijo = (texto: string) => ({ content: [{ type: 'text', text: texto }] });
const narrador = (contexto: Record<string, any>) =>
  ({ id: 'n1', como_le_dicen: 'Ciro', contexto });

beforeEach(() => {
  mocks.crear.mockReset();
  mocks.updates.length = 0;
});

describe('fichaTieneDatos', () => {
  it('una ficha vacía no tiene con qué decidir', () => {
    expect(fichaTieneDatos({})).toBe(false);
    expect(fichaTieneDatos({ arbol: {} })).toBe(false);
    expect(fichaTieneDatos({ arbol: { padres: '   ' } })).toBe(false);
    // preguntasEnviadas y modoRapido no son ficha: son mecánica del entrevistador
    expect(fichaTieneDatos({ modoRapido: true, preguntasEnviadas: { 1: 'hola' } })).toBe(false);
  });

  it('alcanza con un solo dato de la ficha', () => {
    expect(fichaTieneDatos({ anioNacimiento: 1998 })).toBe(true);
    expect(fichaTieneDatos({ lugarNacimiento: 'Concordia' })).toBe(true);
    expect(fichaTieneDatos({ oficio: 'mecánico' })).toBe(true);
    expect(fichaTieneDatos({ datosExtra: 'algo' })).toBe(true);
    expect(fichaTieneDatos({ vinculoComprador: 'nieto' })).toBe(true);
    expect(fichaTieneDatos({ arbol: { padres: 'Sandra y Aldo' } })).toBe(true);
  });
});

describe('esTrato', () => {
  it('solo usted y vos', () => {
    expect(esTrato('usted')).toBe(true);
    expect(esTrato('vos')).toBe(true);
    expect(esTrato('tu')).toBe(false);
    expect(esTrato(undefined)).toBe(false);
  });
});

describe('tratoDe', () => {
  it('con la ficha vacía va usted y NO le pregunta al modelo', async () => {
    const n = narrador({});
    expect(await tratoDe(n)).toBe('usted');
    expect(mocks.crear).not.toHaveBeenCalled();
    // Tampoco lo guarda: si mañana la familia completa la ficha, se decide ahí.
    expect(mocks.updates).toHaveLength(0);
  });

  it('con ficha le pregunta una vez al modelo y guarda lo que eligió', async () => {
    mocks.crear.mockResolvedValue(dijo('vos'));
    const n = narrador({ anioNacimiento: 1998 });
    expect(await tratoDe(n)).toBe('vos');
    expect(mocks.crear).toHaveBeenCalledTimes(1);
    expect(mocks.updates).toEqual([
      { tabla: 'narradores', p: { contexto: { anioNacimiento: 1998, trato: 'vos' } } },
    ]);
  });

  it('la ficha del narrador entra en el prompt', async () => {
    mocks.crear.mockResolvedValue(dijo('vos'));
    await tratoDe(narrador({ anioNacimiento: 1998, lugarNacimiento: 'Concordia' }));
    const prompt = mocks.crear.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain('Concordia');
    expect(prompt).toContain('1998');
  });

  it('una vez decidido no vuelve a preguntar nunca', async () => {
    const n = narrador({ anioNacimiento: 1998, trato: 'vos' });
    expect(await tratoDe(n)).toBe('vos');
    expect(mocks.crear).not.toHaveBeenCalled();
    expect(mocks.updates).toHaveLength(0);
  });

  it('deja el trato en el objeto que ya tiene en la mano quien lo llamó', async () => {
    // Si no, recordarEnviada() de personalizar.ts pisa el contexto entero con su
    // copia vieja y borra el trato recién guardado.
    mocks.crear.mockResolvedValue(dijo('vos'));
    const n = narrador({ anioNacimiento: 1998 });
    const contextoDeOtro = n.contexto;
    await tratoDe(n);
    expect(contextoDeOtro.trato).toBe('vos');
  });

  it('si el modelo contesta cualquier otra cosa, usted', async () => {
    mocks.crear.mockResolvedValue(dijo('depende del caso'));
    expect(await tratoDe(narrador({ anioNacimiento: 1998 }))).toBe('usted');
  });

  it('tolera puntuación y mayúsculas en la respuesta', async () => {
    mocks.crear.mockResolvedValue(dijo('Vos.'));
    expect(await tratoDe(narrador({ anioNacimiento: 1998 }))).toBe('vos');
  });

  it('si la llamada falla NO guarda nada: se reintenta la próxima vez', async () => {
    mocks.crear.mockRejectedValue(new Error('timeout'));
    expect(await tratoDe(narrador({ anioNacimiento: 1998 }))).toBe('usted');
    expect(mocks.updates).toHaveLength(0);
  });

  it('un trato guardado que no es ni usted ni vos se ignora y se vuelve a decidir', async () => {
    mocks.crear.mockResolvedValue(dijo('vos'));
    expect(await tratoDe(narrador({ anioNacimiento: 1998, trato: 'tu' }))).toBe('vos');
    expect(mocks.crear).toHaveBeenCalledTimes(1);
  });

  it('el prompt pide una sola palabra y deja el default escrito', () => {
    expect(PROMPT_TRATO('El narrador es Ciro.')).toContain('Respondé SOLO con una palabra: usted o vos.');
    expect(PROMPT_TRATO('El narrador es Ciro.')).toContain('Ante la duda, usted');
  });
});
