import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { atenderEleccion, eligeAcceso, preguntarAcceso, quienDelBoton, vozDeEleccion } from '../src/flujo/acceso.js';
import { redactarHito } from '../src/mail/hitos.js';
import { esPrivado } from '../src/link-respuestas.js';

vi.mock('../src/db/cliente.js', () => ({ db: {} }));

const narrador = (contexto: Record<string, unknown> = { acceso: { elige: true } }) => ({
  id: 'n1', como_le_dicen: 'Marta', telefono_whatsapp: '5491100000000', contexto,
});

/** Una base falsa: lee `fila` y anota lo que se escribe. */
function base(fila: { contexto: Record<string, unknown> } | null, errores: { leer?: boolean; escribir?: boolean } = {}) {
  const updates: Record<string, any>[] = [];
  const db = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => (errores.leer ? { data: null, error: { message: 'x' } } : { data: fila, error: null }) }) }),
      update: (p: Record<string, any>) => { updates.push(p); return { eq: async () => (errores.escribir ? { error: { message: 'x' } } : { error: null }) }; },
    }),
  } as unknown as SupabaseClient;
  return { db, updates };
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
    expect(titulos).toEqual(['Mi familia', 'Prefiero yo']);
  });

  it.each(['es-AR', 'es-ES', 'ca', 'usted'] as const)('%s: entra en los límites de WhatsApp (1024 y 20)', async (voz) => {
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
    expect(esPrivado(narrador().contexto)).toBe(true);
  });
});

describe('la voz del mensaje', () => {
  it('el idioma manda; el guion clásico va según su trato', () => {
    expect(vozDeEleccion({ idioma: 'ca' })).toBe('ca');
    expect(vozDeEleccion({ idioma: 'es-ES' })).toBe('es-ES');
    expect(vozDeEleccion({ regalo: true })).toBe('es-AR');
    expect(vozDeEleccion({ modo: 'historia' })).toBe('es-AR');
    expect(vozDeEleccion({ trato: 'vos' })).toBe('es-AR');
    expect(vozDeEleccion({ trato: 'usted' })).toBe('usted');
    expect(vozDeEleccion({})).toBe('usted');
  });
});

describe('el botón', () => {
  const boton = (texto: string, waMessageId = 'wamid.1') => ({ esBoton: true, texto, waMessageId });

  it('reconoce los dos botones en castellano y catalán, y nada más', () => {
    expect(quienDelBoton('Mi familia')).toBe('familia');
    expect(quienDelBoton('Prefiero yo')).toBe('narrador');
    expect(quienDelBoton('La meva família')).toBe('familia');
    expect(quienDelBoton('Prefereixo jo')).toBe('narrador');
    expect(quienDelBoton('Sí')).toBeNull();
    expect(quienDelBoton(null)).toBeNull();
  });

  it('anota quién, cuándo, el mensaje y la versión: es la prueba del permiso', async () => {
    const { db, updates } = base({ contexto: { acceso: { elige: true }, regalo: true, otra: 1 } });
    const enviar = vi.fn().mockResolvedValue(undefined);
    const ahora = new Date('2026-11-05T12:00:00Z');
    expect(await atenderEleccion(db, narrador(), boton('Mi familia'), enviar, ahora)).toBe(true);
    expect(updates[0].contexto).toMatchObject({ regalo: true, otra: 1, acceso: { elige: true, quien: 'familia', at: ahora.toISOString(), waMessageId: 'wamid.1', version: '2026-11-05' } });
    expect(enviar).toHaveBeenCalledOnce();
  });

  it('sin la marca, el mismo botón sigue su camino de siempre', async () => {
    const { db, updates } = base({ contexto: {} });
    expect(await atenderEleccion(db, narrador({}), boton('Mi familia'), vi.fn())).toBe(false);
    expect(updates).toHaveLength(0);
  });

  it('un texto escrito o el botón de otra pregunta no son la elección', async () => {
    const { db } = base({ contexto: { acceso: { elige: true } } });
    expect(await atenderEleccion(db, narrador(), { esBoton: false, texto: 'Mi familia' }, vi.fn())).toBe(false);
    expect(await atenderEleccion(db, narrador(), boton('Sí'), vi.fn())).toBe(false);
  });

  it('el mismo botón otra vez (un reenvío de Meta) no escribe ni contesta, pero no sigue a la entrevista', async () => {
    const { db, updates } = base({ contexto: { acceso: { elige: true, quien: 'familia' } } });
    const enviar = vi.fn();
    expect(await atenderEleccion(db, narrador(), boton('Mi familia'), enviar)).toBe(true);
    expect(updates).toHaveLength(0);
    expect(enviar).not.toHaveBeenCalled();
  });

  it('puede cambiar de opinión con el otro botón: vale el último', async () => {
    const { db, updates } = base({ contexto: { acceso: { elige: true, quien: 'familia' } } });
    expect(await atenderEleccion(db, narrador(), boton('Prefiero yo'), vi.fn().mockResolvedValue(undefined))).toBe(true);
    expect(updates[0].contexto.acceso.quien).toBe('narrador');
    expect(esPrivado(updates[0].contexto)).toBe(true);
  });

  it('si la base falla, no pisa nada y el botón tampoco se vuelve una respuesta', async () => {
    const { db, updates } = base(null, { leer: true });
    const enviar = vi.fn();
    expect(await atenderEleccion(db, narrador(), boton('Mi familia'), enviar)).toBe(true);
    expect(updates).toHaveLength(0);
    expect(enviar).not.toHaveBeenCalled();
  });

  it('si no se pudo anotar, no le confirma lo que no quedó', async () => {
    const { db } = base({ contexto: { acceso: { elige: true } } }, { escribir: true });
    const enviar = vi.fn();
    expect(await atenderEleccion(db, narrador(), boton('Mi familia'), enviar)).toBe(true);
    expect(enviar).not.toHaveBeenCalled();
  });

  it('si la confirmación no sale, la elección queda igual', async () => {
    const { db, updates } = base({ contexto: { acceso: { elige: true } } });
    const enviar = vi.fn().mockRejectedValue(new Error('Meta caído'));
    expect(await atenderEleccion(db, narrador(), boton('Prefiero yo'), enviar)).toBe(true);
    expect(updates[0].contexto.acceso.quien).toBe('narrador');
  });
});

describe('los mails a la familia', () => {
  const n = { id: 'n1', como_le_dicen: 'Marta', nombre: 'Marta' };

  it('sin la marca, los de siempre', () => {
    expect(redactarHito('primera', n, {}).asunto).toBe('Ya podés escuchar a Marta');
    expect(redactarHito('acepto', n, { regalo: true }).cuerpo).toContain('lo vas a poder escuchar en tu tablero');
  });

  it('en modo privado no prometen escuchar ni leer', () => {
    for (const trato of ['vos', 'tu'] as const) {
      for (const hito of ['primera', 'mitad'] as const) {
        const { asunto, cuerpo } = redactarHito(hito, n, { privado: true, trato });
        expect(`${asunto} ${cuerpo}`).not.toMatch(/escuch|transcripci|leer lo que hay/i);
      }
      expect(redactarHito('acepto', n, { elige: true, trato }).cuerpo).not.toMatch(/escuch/i);
    }
  });

  it('«Mi familia» vuelve a los de siempre', () => {
    expect(esPrivado({ acceso: { elige: true, quien: 'familia' } })).toBe(false);
    expect(esPrivado({ acceso: { elige: true } })).toBe(true);
    expect(esPrivado({})).toBe(false);
  });
});
