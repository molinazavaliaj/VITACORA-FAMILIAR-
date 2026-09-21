// El link público de «Su voz»: la página que abre el código de la contratapa y el
// QR de cada frase (spec 2026-09-20-su-voz-design).
//
// Mismo esquema que el token del anticipo (`token-anticipo.ts`): JWT HS256 hecho a
// mano con node:crypto, firmado con SUPABASE_SERVICE_ROLE_KEY, sin expiración, para
// que la web lo verifique con el secreto que ya tiene — cero variables nuevas.
//
// El payload lleva `tipo: 'voz'` a propósito. Hermano del token de la muestra
// (`tipo: 'libro'`): el link que la familia reenvía para vender copias impresas
// tiene que seguir mostrando SOLO la muestra, y el link de los saludos
// (`tipo: 'anticipo'`) no puede abrir el archivo de las frases. Son permisos
// distintos y el token lo dice.

import { createHmac } from 'node:crypto';
import { cargarConfig } from '../config.js';

const HEADER = { alg: 'HS256', typ: 'JWT' } as const;
const TIPO = 'voz';

function base64urlDeTexto(texto: string): string {
  return Buffer.from(texto, 'utf8').toString('base64url');
}

export function firmarTokenVoz(narradorId: string): string {
  const secreto = cargarConfig().supabaseServiceRoleKey;
  const encabezado = base64urlDeTexto(JSON.stringify(HEADER));
  const payload = base64urlDeTexto(JSON.stringify({ narradorId, tipo: TIPO }));
  const datos = `${encabezado}.${payload}`;
  const firma = createHmac('sha256', secreto).update(datos).digest('base64url');
  return `${datos}.${firma}`;
}

/**
 * El link de su voz entera: `{urlBase}/voz/{token}`. Es el destino del código de la
 * contratapa — el que abre la página completa, desde el principio.
 */
export function urlVozDeNarrador(narradorId: string): string {
  return `${cargarConfig().urlBase}/voz/${firmarTokenVoz(narradorId)}`;
}

/**
 * El link de UNA frase: la misma página, en la pestaña de las frases y en esa
 * frase (el ancla `#f-<id>` que usa la web). El `id` es único en todo el archivo:
 * es, además, el nombre del mp3 cortado.
 */
export function urlFraseDeVoz(urlVoz: string, id: string): string {
  return `${urlVoz}#f-${id}`;
}
