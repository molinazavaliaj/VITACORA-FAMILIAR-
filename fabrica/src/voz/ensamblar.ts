// El audiolibro con voz clonada, del lado de la fábrica (CONTRATO.md,
// "Salida de la fábrica"): el worker de la PC de Naza dejó en
// `{narrador}/voz/cap_NN.mp3` el cuerpo de cada capítulo, narrado con la voz
// del narrador y SIN intro. Acá se le pega la intro de siempre (TTS, la voz
// del entrevistador: "Capítulo N: nombre"), se sube cada capítulo y el
// completo a `{narrador}/paquete/` — las mismas rutas que el audiolibro con
// los audios reales — y se devuelven las rutas para `pedidos.audiolibro_paths`.

import type { obtenerClienteDb } from '../db.js';
import { concatenarMp3s } from '../audio/ffmpeg.js';
import { armarSegmento, subirMp3, RUTA_CAPITULO, RUTA_COMPLETO } from '../audio/audiolibro.js';

type Db = ReturnType<typeof obtenerClienteDb>;

/** Los nombres de los capítulos, en el orden que narró el worker (el de narracion.json). */
export type EstructuraCapitulos = { capitulos: { nombre: string }[] };

/**
 * Ensambla y sube el audiolibro clonado de un pedido. `capitulosPaths` viene
 * de `narraciones.capitulos_paths` (uno por capítulo, en orden) y
 * `estructura` trae los nombres en ese mismo orden. Reintentable: cada
 * subida es upsert, y si algo falla a mitad de camino quien llama no
 * entrega el pedido — el próximo tick vuelve a empezar de cero (la parte
 * cara, la voz, ya está hecha; acá solo hay TTS de intros y ffmpeg).
 */
export async function ensamblarAudiolibroClonado(
  db: Db,
  args: { narradorId: string; pedidoId: string; capitulosPaths: string[]; estructura: EstructuraCapitulos }
): Promise<{ capitulos: string[]; completo: string }> {
  const { narradorId, pedidoId, capitulosPaths, estructura } = args;
  if (capitulosPaths.length !== estructura.capitulos.length) {
    throw new Error(
      `La narración del pedido ${pedidoId} trae ${capitulosPaths.length} capítulos narrados y el libro tiene ${estructura.capitulos.length}`
    );
  }

  const rutasCapitulos: string[] = [];
  const buffersFinal: Buffer[] = [];

  for (let i = 0; i < estructura.capitulos.length; i++) {
    const numero = i + 1;
    const buffer = await armarSegmento(db, `Capítulo ${numero}: ${estructura.capitulos[i].nombre}`, [capitulosPaths[i]]);
    const ruta = RUTA_CAPITULO(narradorId, numero);
    await subirMp3(db, ruta, buffer);
    rutasCapitulos.push(ruta);
    buffersFinal.push(buffer);
  }

  const rutaCompleto = RUTA_COMPLETO(narradorId);
  await subirMp3(db, rutaCompleto, await concatenarMp3s(buffersFinal));

  return { capitulos: rutasCapitulos, completo: rutaCompleto };
}
