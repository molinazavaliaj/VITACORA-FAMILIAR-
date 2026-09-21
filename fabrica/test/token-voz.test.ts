import { describe, expect, it, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { firmarTokenAnticipo } from '../src/libro/token-anticipo.js';
import { firmarTokenVoz, urlFraseDeVoz, urlVozDeNarrador } from '../src/libro/token-voz.js';

const SECRETO = 'clave-service-role';

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = SECRETO;
  process.env.ANTHROPIC_API_KEY = 'clave-anthropic';
  process.env.OPENAI_API_KEY = 'clave-openai';
  process.env.URL_BASE = 'https://www.vitacorafamiliar.com';
});

/**
 * Verifica el token como lo hace la web (`verificarToken(token, 'voz')` de
 * `web/src/lib/token-libro.ts`, la parte pura): HMAC del secreto, y el payload
 * tiene que traer el `tipo` que se pide. Si la fábrica firmara distinto —otro
 * orden de campos, otro header—, la página del QR daría 404 y nadie se enteraría
 * hasta que un cliente escaneara el libro impreso.
 */
function verificar(token: string, tipo: string): { narradorId: string; tipo: string } {
  const [encabezado, payload, firma] = token.split('.');
  const esperada = createHmac('sha256', SECRETO).update(`${encabezado}.${payload}`).digest('base64url');
  expect(firma).toBe(esperada);
  const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { narradorId: string; tipo: string };
  expect(datos.tipo).toBe(tipo);
  return datos;
}

describe('firmarTokenVoz', () => {
  it('lo que la web espera: HS256, header JWT y payload {narradorId, tipo: "voz"}', () => {
    const token = firmarTokenVoz('3691baf4-ee78-4c6b-9238-4cbed1872be7');
    const [encabezado] = token.split('.');
    expect(token.split('.')).toHaveLength(3);
    expect(JSON.parse(Buffer.from(encabezado, 'base64url').toString('utf8'))).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(verificar(token, 'voz')).toEqual({
      narradorId: '3691baf4-ee78-4c6b-9238-4cbed1872be7',
      tipo: 'voz',
    });
  });

  it('no es el token del anticipo aunque sea el mismo narrador y el mismo secreto', () => {
    // El tipo va DENTRO del payload firmado: por eso los dos tokens no coinciden.
    expect(firmarTokenVoz('n1')).not.toBe(firmarTokenAnticipo('n1'));
    expect(verificar(firmarTokenAnticipo('n1'), 'anticipo').tipo).toBe('anticipo');
  });

  it('dos narradores distintos no comparten token', () => {
    expect(firmarTokenVoz('n1')).not.toBe(firmarTokenVoz('n2'));
  });
});

describe('los links de Su voz', () => {
  it('la página entera cuelga de urlBase y el token viaja en la ruta', () => {
    const url = urlVozDeNarrador('n1');
    expect(url.startsWith('https://www.vitacorafamiliar.com/voz/')).toBe(true);
    expect(verificar(url.split('/voz/')[1], 'voz').narradorId).toBe('n1');
  });

  it('el link de una frase es el mismo link con su ancla', () => {
    const url = urlVozDeNarrador('n1');
    expect(urlFraseDeVoz(url, 'c03-01')).toBe(`${url}#f-c03-01`);
  });
});
