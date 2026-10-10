// fabrica/src/escritor/dudas.ts
// Etapa A (spec, decisión 2): las dudas de datos que encontró el lector del material (registro.dudas:
// nombres, fechas, identidad, contradicciones, transcripción) pasan a la familia, en el dashboard.
// Las dudas narrativas no: van al informe interno.
import type { Json, Respuesta } from './tipos.js';

export type TipoDuda = 'nombre' | 'fecha' | 'identidad' | 'contradiccion' | 'transcripcion';
export type DudaDeDatos = { id: string; tipo: TipoDuda; que: string; ids: string[]; citas: { id: string; texto: string }[] };
export type DudaParaLaFamilia = DudaDeDatos & { pregunta: string; opciones: string[] };

export function dudasDelRegistro(reg: Json, rs: Respuesta[]): DudaDeDatos[] {
  const porId = new Map(rs.map((r) => [r.id, r.texto]));
  return ((reg?.dudas || []) as Json[])
    .filter((d) => !d.resuelta_por_ficha)
    .map((d, i) => {
      const ids = ((d.ids || []) as string[]).filter((x) => porId.has(x));
      return { id: `D${String(i + 1).padStart(2, '0')}`, tipo: d.tipo as TipoDuda, que: String(d.que || ''), ids, citas: ids.map((x) => ({ id: x, texto: porId.get(x) as string })) };
    });
}

export function validarDudas(dudas: DudaDeDatos[], respuesta: Json): DudaParaLaFamilia[] {
  const lista: Json[] = Array.isArray(respuesta?.dudas) ? respuesta.dudas : [];
  return dudas.map((d) => {
    const r = lista.find((x) => x?.id === d.id);
    if (!r || typeof r.pregunta !== 'string' || !r.pregunta.trim()) throw new Error(`la duda ${d.id} vino sin pregunta para la familia`);
    const opciones = Array.isArray(r.opciones) ? (r.opciones as unknown[]).filter((o): o is string => typeof o === 'string' && o.trim() !== '').map((o) => o.trim()) : [];
    return { ...d, pregunta: r.pregunta.trim(), opciones };
  });
}
