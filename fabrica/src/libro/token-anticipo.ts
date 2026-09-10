// Token del link del anticipo que le mandamos por mail a la familia.
//
// Mismo esquema que `web/src/lib/token-saludo.ts` (JWT HS256 hecho a mano con
// node:crypto, firmado con SUPABASE_SERVICE_ROLE_KEY, sin expiración) para que
// la web pueda verificarlo con el secreto que ya tiene: cero variables nuevas.
//
// El payload lleva `tipo: 'anticipo'` a propósito. Sin eso, un link de saludos
// —que también firma { narradorId } con el mismo secreto— serviría para abrir
// el anticipo y al revés. Son dos permisos distintos y conviene que el token
// lo diga.

import { createHmac } from 'node:crypto';
import { cargarConfig } from '../config.js';

const HEADER = { alg: 'HS256', typ: 'JWT' } as const;
const TIPO = 'anticipo';

function base64urlDeTexto(texto: string): string {
  return Buffer.from(texto, 'utf8').toString('base64url');
}

export function firmarTokenAnticipo(narradorId: string): string {
  const secreto = cargarConfig().supabaseServiceRoleKey;
  const encabezado = base64urlDeTexto(JSON.stringify(HEADER));
  const payload = base64urlDeTexto(JSON.stringify({ narradorId, tipo: TIPO }));
  const datos = `${encabezado}.${payload}`;
  const firma = createHmac('sha256', secreto).update(datos).digest('base64url');
  return `${datos}.${firma}`;
}
