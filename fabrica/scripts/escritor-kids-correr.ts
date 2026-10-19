// Corre la receta del libro de Kids sobre un chico del disco (un fijo de test/fijos/escritor-kids o una carpeta con
// el mismo formato). Sin --si y sin --falso NO llama a nada: muestra la estimación y sale.
//
//   npx tsx scripts/escritor-kids-correr.ts --fijo chico-inventado | --carpeta <dir> [--si] [--sin-lote] [--tope USD] [--falso]
//
// --falso: todo con ModeloFalso (cero gasto). --si: el modelo de verdad (ANTHROPIC_API_KEY; nunca se imprime).
// Deja en fabrica/salidas/escritor-kids/<chico>/: libro.pdf, sobre.pdf, informe.md, libro.md, sobre.md, los HTML,
// y los checkpoints en falso/ o real/ (pasos/, lotes/, carpeta-A/B/C.json, costos.json). Separados a propósito:
// lo falso nunca sirve de memoria para una corrida paga. Si el libro se frena por algo preocupante, sigue con
// real/liberado.json (lo pone Naza).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { AlmacenDisco } from '../src/escritor/almacen/disco.js';
import { guardarCarpeta, sinClave } from '../src/escritor/cli.js';
import { Ejecutor, OPCIONES_CLIENTE } from '../src/escritor/ejecutor.js';
import { ModeloAnthropic, type ClienteMensajes } from '../src/escritor/modelo/anthropic.js';
import { LoteFalso, ModeloFalso } from '../src/escritor/modelo/falso.js';
import { LoteAnthropic, type ClienteLotes } from '../src/escritor/modelo/lote-anthropic.js';
import { DIR_SALIDAS_KIDS, extrasFalsosDe, leerArgsKids, urlAudioDePrueba } from '../src/escritor-kids/cli.js';
import { estimarKids, textoEstimacionKids } from '../src/escritor-kids/estimar.js';
import { salidasFalsasKids } from '../src/escritor-kids/falso.js';
import { carpetaDeFilas, materialDe } from '../src/escritor-kids/material/carpeta.js';
import { filasDeCarpeta } from '../src/escritor-kids/material/de-fijo.js';
import { correrKids, salidasDe, type ContextoKids } from '../src/escritor-kids/orquestador.js';
import { suVozValida } from '../src/escritor-kids/controles.js';
import { fuenteDeDisco } from '../src/escritor-kids/salida/fotos.js';
import { armarLibro } from '../src/escritor-kids/salida/libro-md.js';
import { pdfsKids } from '../src/escritor-kids/salida/pdf.js';
import type { SalidaLectura } from '../src/escritor-kids/llamadas.js';

async function main(): Promise<void> {
  const a = leerArgsKids(process.argv.slice(2));
  const c = carpetaDeFilas(filasDeCarpeta(a.dir));
  const m = materialDe(c);
  console.log(`${a.nombre}: ${m.ficha.llamado}, ${m.ficha.edad} años · ${m.partes.reduce((s, p) => s + p.items.length, 0)} items en las partes 1 a 4, ${m.sobre.items.length} en el sobre, ${m.fotos.length} fotos`);
  for (const l of textoEstimacionKids(estimarKids(c), { lote: a.lote, topeUsd: a.topeUsd })) console.log(l);
  if (!a.si && !a.falso) {
    console.log('No se llamó a nada. Para probar sin gastar: --falso. Para correr de verdad (paga): --si.');
    return;
  }
  const salida = path.join(DIR_SALIDAS_KIDS, a.nombre);
  const almacen = new AlmacenDisco(path.join(salida, a.falso ? 'falso' : 'real'));
  let ej: Ejecutor;
  if (a.falso) {
    const modelo = new ModeloFalso(salidasFalsasKids(m, extrasFalsosDe(a.dir)), [], { input_tokens: 0, output_tokens: 0 });
    ej = new Ejecutor({ modelo, lote: new LoteFalso(modelo), almacen, topeUsd: a.topeUsd, log: (s) => console.log(s) });
  } else {
    const cliente = new Anthropic(OPCIONES_CLIENTE);
    ej = new Ejecutor({
      modelo: new ModeloAnthropic(cliente as unknown as ClienteMensajes),
      lote: a.lote ? new LoteAnthropic(cliente as unknown as ClienteLotes, almacen, { log: (s) => console.log(s) }) : undefined,
      todoPorLote: a.lote, almacen, topeUsd: a.topeUsd, log: (s) => console.log(s),
    });
  }
  const x: ContextoKids = { c, ej, almacen, log: (s) => console.log(s), usarLote: a.lote, avisar: async (asunto, texto) => console.log(`AVISO A LOS SOCIOS · ${asunto}\n${texto}`) };
  try {
    const r = await correrKids(x);
    console.log(JSON.stringify(r.estado === 'frenado' ? { estado: r.estado, preocupante: r.frenado.preocupante } : r, null, 1));
    if (r.estado !== 'listo') return;
    const lectura = JSON.parse(c.leer('salidas/lectura.json')) as SalidaLectura;
    const libro = armarLibro(m, salidasDe(x, m), suVozValida(m, lectura));
    const p = await pdfsKids(libro, { fotos: fuenteDeDisco(a.dir, (s) => console.log(s)), urlDeAudio: (v) => urlAudioDePrueba(m.ficha.narradorId, v.respuesta.respuestaId) });
    mkdirSync(salida, { recursive: true });
    const archivos: Record<string, string | Buffer> = {
      'libro.pdf': p.libro, 'sobre.pdf': p.sobre, 'libro.html': p.libroHtml, 'sobre.html': p.sobreHtml,
      'libro.md': c.leer('salidas/libro.md'), 'sobre.md': c.leer('salidas/sobre.md'), 'informe.md': c.leer('salidas/informe.md'),
    };
    for (const [n, t] of Object.entries(archivos)) writeFileSync(path.join(salida, n), t);
    console.log(`Listo: ${salida} (libro.pdf ${Math.round(p.libro.length / 1024)} KB, sobre.pdf ${Math.round(p.sobre.length / 1024)} KB)`);
  } finally {
    guardarCarpeta(c, path.join(salida, a.falso ? 'falso' : 'real', 'carpeta'));
    await ej.guardarCostos();
    const nuevas = ej.filas.filter((f) => !f.de_memoria);
    console.log(`Gasto: USD ${ej.gastado.toFixed(4)} · ${nuevas.length} llamadas nuevas (${nuevas.filter((f) => f.lote).length} por lote)${a.falso ? ' · modelo falso, sin gasto' : ''}`);
  }
}

main().catch((err) => {
  console.error(`ERROR: ${sinClave((err as Error).message)}`);
  process.exit(1);
});
