import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { contestarLinkSiLoPide, esPrivado, fechaDelPlazo, firmarTokenRespuestas, pideMisRespuestas, plazoParaSacar, textoDelLink, urlRespuestas } from '../src/link-respuestas.js';
import { pedidoDe as pedidoHistoria } from '../src/historia/pedidos.js';

const AHORA = new Date('2026-11-05T12:00:00Z');
const FICHA = { nombre: 'Marta', genero: 'mujer' as const };

beforeEach(() => { process.env.FIRMA_TOKENS = 'secreto'; });
afterEach(() => { delete process.env.FIRMA_TOKENS; });

describe('el token', () => {
  it('va firmado, con su tipo y vence a los 7 días', () => {
    const [enc, pay, firma] = firmarTokenRespuestas('n1', AHORA).split('.');
    expect(createHmac('sha256', 'secreto').update(`${enc}.${pay}`).digest('base64url')).toBe(firma);
    const datos = JSON.parse(Buffer.from(pay, 'base64url').toString());
    expect(datos).toEqual({ narradorId: 'n1', tipo: 'respuestas', exp: AHORA.getTime() + 7 * 86_400_000 });
  });
  it('la url', () => { expect(urlRespuestas('n1', AHORA)).toMatch(/^https:\/\/www\.vitacorafamiliar\.com\/mis-respuestas\/.+\..+\..+$/); });
});

describe('pedirlo', () => {
  it('frases cortas, por idioma', () => {
    expect(pideMisRespuestas('Quiero ver mis respuestas', 'es-AR')).toBe(true);
    expect(pideMisRespuestas('¿Me mandás el link?', 'es-AR')).toBe(false);
    expect(pideMisRespuestas('Mandame el link', 'es-AR')).toBe(true);
    expect(pideMisRespuestas('Quiero quitar algo', 'es-ES')).toBe(true);
    expect(pideMisRespuestas("Envia'm l'enllaç", 'ca')).toBe(true);
    expect(pideMisRespuestas('Vull esborrar alguna cosa', 'ca')).toBe(true);
    expect(pideMisRespuestas('Hoy no puedo, mañana te cuento de mi mamá', 'es-AR')).toBe(false);
  });
  it('historia lo reconoce igual', () => {
    expect(pedidoHistoria('mis respuestas', 'es-AR', false)).toBeNull();
    expect(pedidoHistoria('mis respuestas', 'es-AR', true)).toMatchObject({ link: true, reserva: false, pausa: false });
    expect(pedidoHistoria('esto que no vaya al libro', 'es-AR', false)).toMatchObject({ reserva: true });
  });
});

describe('el mensaje', () => {
  const ultima = '2026-11-05T10:00:00Z';
  it('contando: dura 7 días. Terminó: hasta cuándo. Sin plazo: que ya no se puede', () => {
    const contando = textoDelLink({ estado: 'activo', ultima_respuesta_at: ultima }, 'n1', 'es-AR', FICHA, AHORA)!;
    expect(contando).toContain('El link dura 7 días');
    expect(contando).toContain('Marta');
    const final = textoDelLink({ estado: 'completado', ultima_respuesta_at: ultima, zona_horaria: 'America/Argentina/Buenos_Aires' }, 'n1', 'es-AR', FICHA, AHORA)!;
    expect(final).toContain('Tenés tiempo hasta el');
    expect(final).toContain('sábado 7 de noviembre a las 07:00');
    expect(final).not.toContain('{{');
    const cerrado = textoDelLink({ estado: 'completado', ultima_respuesta_at: ultima }, 'n1', 'es-ES', FICHA, new Date('2026-11-08T12:00:00Z'))!;
    expect(cerrado).toContain('Ya no se puede quitar nada');
  });
  it('tres idiomas, sin dos puntos ni usted', () => {
    for (const idioma of ['es-AR', 'es-ES', 'ca'] as const) {
      for (const estado of ['activo', 'completado']) {
        const t = textoDelLink({ estado, ultima_respuesta_at: ultima }, 'n1', idioma, FICHA, AHORA)!.split('\n\n')[0];
        expect(t.replace(/\d\d:\d\d/, '')).not.toContain(':');
        expect(t).not.toMatch(/\busted\b/i);
      }
    }
  });
  it('48 horas desde su último mensaje', () => {
    expect(plazoParaSacar({ ultima_respuesta_at: ultima })).toBe(Date.parse(ultima) + 48 * 3_600_000);
    expect(plazoParaSacar({ ultima_respuesta_at: null })).toBeNull();
  });
  it('la fecha en su hora y su idioma', () => {
    expect(fechaDelPlazo(Date.parse('2026-11-07T21:30:00Z'), 'Europe/Madrid', 'es-ES')).toBe('sábado 7 de noviembre a las 22:30');
    expect(fechaDelPlazo(Date.parse('2026-11-07T21:30:00Z'), 'Europe/Madrid', 'ca')).toBe('dissabte 7 de novembre a les 22:30');
  });
  it('la regla es la de la web', () => {
    expect(esPrivado({ acceso: { elige: true } })).toBe(true);
    expect(esPrivado({ acceso: { elige: true, quien: 'narrador' } })).toBe(true);
    expect(esPrivado({ acceso: { elige: true, quien: 'familia' } })).toBe(false);
    expect(esPrivado({ vinculoComprador: 'hija' })).toBe(false); // sin la marca: una entrevista anterior
    expect(esPrivado({ vinculoComprador: 'yo mismo' })).toBe(false);
    expect(esPrivado({ modo: 'viaje' })).toBe(false);
  });
});

describe('si ya terminó y lo pide', () => {
  const base = (estado = 'completado', contexto: unknown = { vinculoComprador: 'hijo', acceso: { elige: true } }) => ({
    from: (t: string) => {
      const q: Record<string, unknown> = {};
      q.select = () => q; q.eq = () => q;
      q.maybeSingle = async () => ({ data: t === 'narradores' ? { estado, contexto, ultima_respuesta_at: '2026-11-05T10:00:00Z' } : { idioma: 'es-AR', ficha: FICHA }, error: null });
      return q;
    },
  }) as never;
  it('le contesta con el link; a otra cosa, no', async () => {
    const salidas: string[] = [];
    expect(await contestarLinkSiLoPide(base(), { id: 'n1', contexto: { vinculoComprador: 'hijo', acceso: { elige: true } } }, 'mis respuestas', async (t) => { salidas.push(t); }, AHORA)).toBe(true);
    expect(salidas[0]).toContain('/mis-respuestas/');
    expect(await contestarLinkSiLoPide(base(), { id: 'n1', contexto: { vinculoComprador: 'hijo', acceso: { elige: true } } }, 'Hola, ¿cómo están?', async () => {}, AHORA)).toBe(false);
  });
  it('para mí, no', async () => {
    expect(await contestarLinkSiLoPide(base(), { id: 'n1', contexto: { vinculoComprador: 'yo mismo' } }, 'mis respuestas', async () => {}, AHORA)).toBe(false);
  });
});
