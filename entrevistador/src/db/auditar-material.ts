// La prueba de material (biógrafo v2, 23/09).
//
// El mejor prompt del mundo, con el audio de otra persona, escribe el libro de otra
// persona. El 17/09 un audio de Ciro quedó en la orden 27 de Joaquín: quien cargaba se
// dio cuenta, cargó encima el correcto, pero el malo quedó en la base con la misma forma
// que cualquier par respuesta + repregunta, y la fábrica lo usó. Nadie lo vio hasta que
// Joaquín leyó su libro.
//
// Esto no decide nada: señala qué audios hay que ESCUCHAR antes de escribir el libro.
// Verificar contra la transcripción solo prueba que el libro es fiel a la base; si el
// dato entró mal, lo único que lo desmiente es el audio.
//
//   grave   — el mismo audio en otro narrador, o dos veces en este. Escuchar sí o sí.
//   revisar — cargada a minutos de una de otro narrador: la ventana en la que pasó.
//   info    — preguntas con varias respuestas, respuestas sin audio. No es un error;
//             es lo que hay que tener a mano si el narrador dice "esto no lo dije yo".

import { esLaMismaRespuesta } from './duplicados.js';

export type FilaMaterial = {
  id: string;
  narrador_id: string;
  pregunta_orden: number;
  audio_path: string | null;
  transcripcion: string | null;
  es_repregunta: boolean;
  recibido_at: string;
};

export type Aviso = {
  nivel: 'grave' | 'revisar' | 'info';
  tipo: 'cruce' | 'repetida' | 'intercalada' | 'varias-en-orden' | 'sin-audio';
  orden: number;
  /** Los audios a escuchar: primero el de este narrador. */
  audios: string[];
  detalle: string;
};

/** El 17/09 el cruce fue a los dos minutos; las cargas intercaladas de ese día, a menos de diez. */
const VENTANA_INTERCALADA_MS = 10 * 60 * 1000;

const PESO = { grave: 0, revisar: 1, info: 2 } as const;

function hora(iso: string): string {
  return iso.slice(5, 16).replace('T', ' ');
}

/**
 * Los avisos de un narrador, de lo más grave a lo informativo. `todas` son las
 * respuestas de todos los narradores (hacen falta para ver cruces e intercaladas);
 * `nombres` traduce ids a cómo le dicen, para que el aviso se entienda.
 */
export function auditarMaterial(
  narradorId: string,
  todas: FilaMaterial[],
  nombres: Record<string, string>
): Aviso[] {
  const mias = todas.filter((f) => f.narrador_id === narradorId);
  const ajenas = todas.filter((f) => f.narrador_id !== narradorId);
  const nombre = (id: string) => nombres[id] ?? id.slice(0, 8);
  // Solo audios reales: lo que va acá se baja de Storage para escucharlo.
  const audios = (...fs: FilaMaterial[]) => fs.map((f) => f.audio_path).filter((p): p is string => Boolean(p));
  const avisos: Aviso[] = [];

  for (const f of mias) {
    const otra = ajenas.find((a) => esLaMismaRespuesta(f.transcripcion ?? '', a.transcripcion ?? ''));
    if (otra) {
      avisos.push({
        nivel: 'grave',
        tipo: 'cruce',
        orden: f.pregunta_orden,
        audios: audios(f, otra),
        detalle: `La misma respuesta está cargada en ${nombre(otra.narrador_id)}, orden ${otra.pregunta_orden}.`,
      });
    }
  }

  for (let i = 0; i < mias.length; i++) {
    for (let j = i + 1; j < mias.length; j++) {
      const [a, b] = [mias[i], mias[j]];
      if (esLaMismaRespuesta(a.transcripcion ?? '', b.transcripcion ?? '')) {
        avisos.push({
          nivel: 'grave',
          tipo: 'repetida',
          orden: b.pregunta_orden,
          audios: audios(b, a),
          detalle: `Es la misma respuesta que la de la orden ${a.pregunta_orden}: el mismo audio cargado dos veces.`,
        });
      }
    }
  }

  for (const f of mias) {
    const t = new Date(f.recibido_at).getTime();
    const distancia = (a: FilaMaterial) => Math.abs(new Date(a.recibido_at).getTime() - t);
    const cerca = ajenas
      .filter((a) => distancia(a) < VENTANA_INTERCALADA_MS)
      .sort((a, b) => distancia(a) - distancia(b))[0];
    if (cerca) {
      avisos.push({
        nivel: 'revisar',
        tipo: 'intercalada',
        orden: f.pregunta_orden,
        audios: audios(f),
        detalle: `Cargada ${hora(f.recibido_at)}, a minutos de una de ${nombre(cerca.narrador_id)} ` +
          `(orden ${cerca.pregunta_orden}, ${hora(cerca.recibido_at)}). Confirmar que la voz es de este narrador.`,
      });
    }
  }

  const porOrden = new Map<number, FilaMaterial[]>();
  for (const f of mias) porOrden.set(f.pregunta_orden, [...(porOrden.get(f.pregunta_orden) ?? []), f]);
  for (const [orden, filas] of porOrden) {
    if (filas.length < 2) continue;
    const enOrden = [...filas].sort((a, b) => a.recibido_at.localeCompare(b.recibido_at));
    avisos.push({
      nivel: 'info',
      tipo: 'varias-en-orden',
      orden,
      audios: audios(...enOrden),
      detalle: `${filas.length} respuestas en la misma pregunta (${enOrden.map((f) => (f.es_repregunta ? 'repregunta' : 'respuesta')).join(' + ')}). ` +
        'Todas entran al libro: si una no va, hoy no hay forma de marcarla.',
    });
  }

  // Un solo aviso con todas: un narrador cargado entero como texto (el set dorado) no
  // tiene que tapar lo demás.
  const sinAudio = mias.filter((f) => !f.audio_path).map((f) => f.pregunta_orden).sort((a, b) => a - b);
  if (sinAudio.length) {
    avisos.push({
      nivel: 'info',
      tipo: 'sin-audio',
      orden: sinAudio[0],
      audios: [],
      detalle: `${sinAudio.length === 1 ? 'Cargada' : `${sinAudio.length} cargadas`} como texto ` +
        `(orden ${sinAudio.join(', ')}): no hay audio contra el cual verificar${sinAudio.length === 1 ? 'la' : 'las'}.`,
    });
  }

  return avisos.sort((a, b) => PESO[a.nivel] - PESO[b.nivel] || a.orden - b.orden);
}
