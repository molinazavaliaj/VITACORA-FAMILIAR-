// fabrica/src/escritor/salida/plantilla.ts
// Del libro del escritor v5.5 a lo que pide la plantilla de producción (construirHtmlLibro): el título del
// libro aparte (portada), la primera página sin encabezado, los capítulos "I · Título" como índice, y
// «Su voz» (frases.json) desde salidas/sus_frases.json: cada frase con su respuesta (R..), para que el
// worker de audio la corte. El llamador pone `fuentes` (R.. → respuesta de la base): eso es de Joaquín.
import { Carpeta, leerJSON } from '../carpeta.js';
import { idioma, nombreDePila, piezas, salida } from '../lectura.js';
import { marcas, piezaDeR, planConR } from '../texto.js';
import type { IdiomaLibro, Json } from '../tipos.js';
import { FRASES_POR_CAPITULO, type FraseCandidata, type FrasesJson } from '../../libro/frases.js';

export type ParaPlantilla = { titulo: string; indice: string[]; libroMarkdown: string };
export type FuenteDeFrase = { respuestaId: string | null; preguntaOrden: number };

export function libroParaPlantilla(libroMd: string): ParaPlantilla {
  const lineas = libroMd.replace(/\r\n/g, '\n').split('\n');
  const i = lineas.findIndex((l) => l.startsWith('# '));
  if (i < 0) throw new Error('libro.md sin título (# …)');
  const libroMarkdown = lineas.slice(i + 1).join('\n').replace(/^\n+/, '');
  const indice = libroMarkdown.split('\n').map((l) => l.trim()).filter((l) => /^# [IVXLCDM]+( · .+)?$/.test(l)).map((l) => l.slice(2));
  return { titulo: lineas[i].slice(2).trim(), indice, libroMarkdown };
}

export const paraPlantilla = (c: Carpeta): ParaPlantilla & { nombreNarrador: string; idioma: IdiomaLibro } => ({
  ...libroParaPlantilla(c.leer('libro.md')),
  nombreNarrador: nombreDePila(c),
  idioma: idioma(c),
});

export function frasesParaSuVoz(c: Carpeta, a: { narradorId: string; pedidoId: string; fuentes: Record<string, FuenteDeFrase> }): FrasesJson {
  const frases: { id: string; texto: string }[] = leerJSON(c, salida('sus_frases.json')).frases || [];
  const reg = leerJSON(c, salida('registro.json'));
  const plan = planConR(leerJSON(c, salida('plan.json')), reg);
  const capitulos = plan.capitulos as Json[];
  const caps = piezas(c).filter((p) => p.pieza.startsWith('cap_'));
  const { indice } = libroParaPlantilla(c.leer('libro.md'));
  const ultimo = capitulos[capitulos.length - 1].n as number;
  const capDe = (rid: string): number => {
    const marcada = caps.find((p) => marcas(p.texto).includes(rid));
    if (marcada) return Number(marcada.pieza.slice(4));
    const p = piezaDeR(plan, reg, rid);
    return p.startsWith('cap_') ? Number(p.slice(4)) : ultimo;
  };
  const porCap = new Map<number, FraseCandidata[]>();
  for (const f of frases) {
    const n = capDe(f.id);
    const lista = porCap.get(n) ?? [];
    const fuente = a.fuentes[f.id];
    lista.push({
      id: f.id, texto: String(f.texto).trim(), origen: 'sus-frases', grupo: 'suyas',
      respuesta_id: fuente?.respuestaId ?? null, pregunta_orden: fuente?.preguntaOrden ?? 0, por_que: '',
      elegida: lista.filter((x) => x.elegida).length < FRASES_POR_CAPITULO, elegida_por: 'modelo',
      estado: 'pendiente', audio_path: null, segundos: null, inicio: null, fin: null,
    });
    porCap.set(n, lista);
  }
  return {
    version: 1, narrador_id: a.narradorId, pedido_id: a.pedidoId, confirmado_at: null,
    capitulos: capitulos.filter((x) => porCap.has(x.n as number)).map((x) => ({ numero: x.n as number, capitulo: indice[capitulos.indexOf(x)] ?? `Capítulo ${x.n}`, candidatas: porCap.get(x.n as number) as FraseCandidata[] })),
  };
}
