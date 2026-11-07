import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { atenderEleccion, eligeAcceso, preguntarAcceso, quienDelBoton, VERSION_ELECCION, vozDeEleccion } from '../src/flujo/acceso.js';
import { avisarSocios } from '../src/v3/avisos.js';
import { redactarHito } from '../src/mail/hitos.js';
import { esPrivado } from '../src/link-respuestas.js';

vi.mock('../src/db/cliente.js', () => ({ db: {} }));
vi.mock('../src/v3/avisos.js', () => ({ avisarSocios: vi.fn().mockResolvedValue(true) }));

beforeEach(() => vi.mocked(avisarSocios).mockClear());

const narrador = (contexto: Record<string, unknown> = { acceso: { elige: true } }) => ({
  id: 'n1', como_le_dicen: 'Marta', telefono_whatsapp: '5491100000000', contexto,
});

/** Una base falsa: la función de guardado contesta `cambio` o falla, y anota lo que le llega. */
function base(cambio = true, falla = false) {
  const llamadas: { nombre: string; args: Record<string, any> }[] = [];
  const db = {
    rpc: async (nombre: string, args: Record<string, any>) => {
      llamadas.push({ nombre, args });
      return falla ? { data: null, error: { message: 'x' } } : { data: cambio, error: null };
    },
  } as unknown as SupabaseClient;
  return { db, llamadas };
}

describe('a quién se le pregunta', () => {
  it('sin la marca no se le pregunta nada: las entrevistas en curso siguen igual', async () => {
    const botones = vi.fn();
    await preguntarAcceso(narrador({ regalo: true }), 'es-AR', botones);
    expect(botones).not.toHaveBeenCalled();
    expect(eligeAcceso(narrador({}))).toBe(false);
  });

  it('con la marca, una pregunta con dos botones, con su nombre', async () => {
    const botones = vi.fn().mockResolvedValue(undefined);
    await preguntarAcceso(narrador(), 'es-AR', botones);
    const [telefono, texto, titulos] = botones.mock.calls[0];
    expect(telefono).toBe('5491100000000');
    expect(texto).toContain('Marta');
    expect(texto).not.toContain('{{');
    expect(titulos).toEqual(['Mi familia', 'Solo yo']);
  });

  it.each(['es-AR', 'es-ES', 'ca'] as const)('%s: entra en los límites de WhatsApp (1024 y 20)', async (voz) => {
    const botones = vi.fn().mockResolvedValue(undefined);
    await preguntarAcceso(narrador(), voz, botones);
    const [, texto, titulos] = botones.mock.calls[0];
    expect((texto as string).length).toBeLessThanOrEqual(1024);
    for (const t of titulos as string[]) expect(t.length).toBeLessThanOrEqual(20);
  });

  it('si ya eligió, no se le vuelve a preguntar', async () => {
    const botones = vi.fn();
    await preguntarAcceso(narrador({ acceso: { elige: true, quien: 'familia' } }), 'es-AR', botones);
    expect(botones).not.toHaveBeenCalled();
  });

  it('si la pregunta no sale, no tira: la entrevista sigue y queda privado', async () => {
    const botones = vi.fn().mockRejectedValue(new Error('Meta caído'));
    await expect(preguntarAcceso(narrador(), 'es-AR', botones)).resolves.toBeUndefined();
    expect(avisarSocios).toHaveBeenCalledWith('acceso-pregunta:n1', expect.any(String), expect.any(String), { unaVez: true });
    expect(esPrivado(narrador().contexto)).toBe(true);
  });
});

describe('la voz del mensaje', () => {
  it('el idioma manda, nunca de usted: si pasa por el guion clásico, va de tú', () => {
    expect(vozDeEleccion({ idioma: 'ca' })).toBe('ca');
    expect(vozDeEleccion({ idioma: 'es-ES' })).toBe('es-ES');
    expect(vozDeEleccion({ regalo: true })).toBe('es-AR');
    expect(vozDeEleccion({ modo: 'historia' })).toBe('es-AR');
    expect(vozDeEleccion({ trato: 'vos' })).toBe('es-AR');
    expect(vozDeEleccion({ trato: 'usted' })).toBe('es-ES');
    expect(vozDeEleccion({})).toBe('es-ES');
  });
});

describe('el botón', () => {
  const boton = (texto: string, waMessageId = 'wamid.1') => ({ esBoton: true, texto, waMessageId });

  it('reconoce los dos botones en castellano y catalán, y nada más', () => {
    expect(quienDelBoton('Mi familia')).toBe('familia');
    expect(quienDelBoton('Solo yo')).toBe('narrador');
    expect(quienDelBoton('La meva família')).toBe('familia');
    expect(quienDelBoton('Només jo')).toBe('narrador');
    expect(quienDelBoton('Sí')).toBeNull();
    expect(quienDelBoton(null)).toBeNull();
  });

  it('anota quién, cuándo, el mensaje y la versión: es la prueba del permiso', async () => {
    const { db, llamadas } = base();
    const enviar = vi.fn().mockResolvedValue(undefined);
    const ahora = new Date('2026-11-05T12:00:00Z');
    const n = narrador({ acceso: { elige: true }, regalo: true, otra: 1 });
    expect(await atenderEleccion(db, n, boton('Mi familia'), enviar, ahora)).toBe(true);
    expect(llamadas).toEqual([{ nombre: 'anotar_eleccion_acceso', args: { p_narrador: 'n1', p_acceso: { quien: 'familia', at: ahora.toISOString(), waMessageId: 'wamid.1', version: VERSION_ELECCION } } }]);
    expect(n.contexto).toMatchObject({ regalo: true, otra: 1, acceso: { elige: true, quien: 'familia' } });
    expect(enviar).toHaveBeenCalledOnce();
  });

  it('sin la marca, el mismo botón sigue su camino de siempre', async () => {
    const { db, llamadas } = base();
    expect(await atenderEleccion(db, narrador({}), boton('Mi familia'), vi.fn())).toBe(false);
    expect(llamadas).toHaveLength(0);
  });

  it('un texto escrito o el botón de otra pregunta no son la elección', async () => {
    const { db, llamadas } = base();
    expect(await atenderEleccion(db, narrador(), { esBoton: false, texto: 'Mi familia' }, vi.fn())).toBe(false);
    expect(await atenderEleccion(db, narrador(), boton('Sí'), vi.fn())).toBe(false);
    expect(llamadas).toHaveLength(0);
  });

  it('el mismo botón otra vez (un reenvío de Meta) no contesta, pero no sigue a la entrevista', async () => {
    const { db } = base(false);
    const enviar = vi.fn();
    expect(await atenderEleccion(db, narrador({ acceso: { elige: true, quien: 'familia' } }), boton('Mi familia'), enviar)).toBe(true);
    expect(enviar).not.toHaveBeenCalled();
  });

  it('puede cambiar de opinión con el otro botón: vale el último', async () => {
    const { db } = base();
    const n = narrador({ acceso: { elige: true, quien: 'familia' } });
    expect(await atenderEleccion(db, n, boton('Solo yo'), vi.fn().mockResolvedValue(undefined))).toBe(true);
    expect(esPrivado(n.contexto)).toBe(true);
  });

  it('si no se pudo guardar, no le confirma nada, avisa a los socios y el botón no se vuelve una respuesta', async () => {
    const { db } = base(true, true);
    const enviar = vi.fn();
    const n = narrador();
    expect(await atenderEleccion(db, n, boton('Mi familia'), enviar)).toBe(true);
    expect(enviar).not.toHaveBeenCalled();
    expect(avisarSocios).toHaveBeenCalledOnce();
    expect(esPrivado(n.contexto)).toBe(true);
  });

  it('confirma con el texto aprobado, en su idioma', async () => {
    const { db } = base();
    const enviar = vi.fn().mockResolvedValue(undefined);
    await atenderEleccion(db, narrador({ acceso: { elige: true }, regalo: true }), boton('Mi familia'), enviar);
    expect(enviar.mock.calls[0][1]).toBe('Listo, Marta. Tu familia va a poder ver todo lo que me cuentes, también lo que ya me contaste.');
    await atenderEleccion(db, narrador({ acceso: { elige: true }, idioma: 'ca' }), boton('Només jo'), enviar);
    expect(enviar.mock.calls[1][1]).toContain("D'acord, Marta. El que m'expliquis");
  });

  it.each(['completado', 'cerrado_anticipado'])('con la entrevista %s no cambia nada y lo dice', async (estado) => {
    const { db, llamadas } = base();
    const enviar = vi.fn().mockResolvedValue(undefined);
    const n = { ...narrador({ acceso: { elige: true, quien: 'familia' }, regalo: true }), estado };
    expect(await atenderEleccion(db, n, boton('Solo yo'), enviar)).toBe(true);
    expect(llamadas).toHaveLength(0);
    expect(n.contexto).toMatchObject({ acceso: { quien: 'familia' } });
    expect(enviar.mock.calls[0][1]).toBe('Ya terminamos de contar, Marta. Si querés cambiar esto, escribinos y lo vemos.');
  });

  it('mientras cuenta, la pregunta dice que se puede cambiar', async () => {
    const botones = vi.fn().mockResolvedValue(undefined);
    await preguntarAcceso(narrador(), 'es-ES', botones);
    expect(botones.mock.calls[0][1]).toContain('Puedes cambiarlo mientras contamos, tocando el otro botón.');
  });

  it('si la confirmación no sale, la elección queda igual', async () => {
    const { db, llamadas } = base();
    const enviar = vi.fn().mockRejectedValue(new Error('Meta caído'));
    expect(await atenderEleccion(db, narrador(), boton('Solo yo'), enviar)).toBe(true);
    expect(llamadas[0].args.p_acceso.quien).toBe('narrador');
  });
});
