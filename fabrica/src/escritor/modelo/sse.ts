// fabrica/src/escritor/modelo/sse.ts
// Lo que comparten los modelos de otros proveedores (PRUEBA del 07/10/2026, DeepSeek y Gemini): un POST con
// streaming (Server-Sent Events) para que las respuestas largas no corten por tiempo. Cada línea `data: {...}`
// se le pasa a `alRecibir` ya parseada. Un error de red o un HTTP 408/429/5xx es reintentable (el ejecutor espera).
import { ErrorDelModelo } from './tipos.js';

export type RespuestaHttp = { ok: boolean; status: number; text(): Promise<string>; body: AsyncIterable<Uint8Array> | null };
export type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<RespuestaHttp>;

export async function leerSSE(f: Fetch | undefined, quien: string, url: string, headers: Record<string, string>, cuerpo: unknown, alRecibir: (j: unknown) => void): Promise<void> {
  const fetcher = f ?? (globalThis.fetch as unknown as Fetch);
  let r: RespuestaHttp;
  try {
    r = await fetcher(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(cuerpo) });
  } catch (err) {
    throw new ErrorDelModelo(`${quien}: ${(err as Error).message}`, true);
  }
  if (!r.ok || !r.body) {
    const s = r.status;
    throw new ErrorDelModelo(`${quien}: HTTP ${s} ${(await r.text()).slice(0, 300)}`, s === 408 || s === 429 || s >= 500);
  }
  const dec = new TextDecoder();
  let resto = '';
  const linea = (l: string): void => {
    const t = l.trim();
    if (!t.startsWith('data:')) return;
    const dato = t.slice(5).trim();
    if (!dato || dato === '[DONE]') return;
    alRecibir(JSON.parse(dato));
  };
  try {
    for await (const trozo of r.body) {
      resto += dec.decode(trozo, { stream: true });
      const ls = resto.split('\n');
      resto = ls.pop() ?? '';
      ls.forEach(linea);
    }
  } catch (err) {
    throw new ErrorDelModelo(`${quien}: se cortó el stream (${(err as Error).message})`, true);
  }
  if (resto) linea(resto);
}
