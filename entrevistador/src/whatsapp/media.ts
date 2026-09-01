import { cargarConfig } from '../config.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

export function pathDeAudio(narradorId: string, orden: number, existentes: string[]): string {
  const dia = String(orden).padStart(2, '0');
  const base = `${narradorId}/dia_${dia}`;
  if (!existentes.includes(`${base}.ogg`)) return `${base}.ogg`;
  let n = 2;
  while (existentes.includes(`${base}_${n}.ogg`)) n++;
  return `${base}_${n}.ogg`;
}

export async function descargarAudio(mediaId: string): Promise<Buffer> {
  const config = cargarConfig();
  const auth = { headers: { Authorization: `Bearer ${config.waToken}` } };
  const meta = await fetch(`${GRAPH}/${mediaId}`, auth);
  if (!meta.ok) throw new Error(`No pude obtener la URL del media ${mediaId}: ${meta.status}`);
  const { url } = await meta.json() as { url: string };
  const archivo = await fetch(url, auth);
  if (!archivo.ok) throw new Error(`No pude descargar el media ${mediaId}: ${archivo.status}`);
  return Buffer.from(await archivo.arrayBuffer());
}
