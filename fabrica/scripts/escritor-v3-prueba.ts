// Prueba del escritor V3 del worker con un narrador real (el de prueba de Naza), sin tocar nada de verdad:
//
//   npx tsx scripts/escritor-v3-prueba.ts --narrador <id> [--libro] [--carpeta <prefijo>]
//
// 1. Lee su entrevista V3 de la base con el código de producción (carpetaDeLaBase) y muestra la ficha y
//    cuántas respuestas llegan al escritor. Gratis.
// 2. Con --libro: corre escribirLibroV3 ENTERO (A, B, C, plantilla, PDF de verdad con Chromium, «Su voz»)
//    con el modelo falso (las respuestas guardadas de Nélida: no le paga a nadie) sobre Supabase de verdad,
//    pero:
//      - todo lo que escribe en Storage va a `{id}/<prefijo>/…` (por defecto `prueba-escritor-v3`), no al
//        paquete ni al escritor del narrador;
//      - no toca `pedidos` (el pedido es de mentira y la actualización se anota acá);
//      - no escribe en `consumo_ia` (el modelo falso inventa el uso: ensuciaría el panel de gastos);
//      - no manda mails (sin MAIL_SOCIOS).
//    El material es el de Nélida (con 3 respuestas, el registro de verdad no pasaría sus controles); lo que
//    se prueba de verdad es el camino: Storage (claves, checkpoints, retomar), la plantilla, el PDF y frases.
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Ejecutor } from '../src/escritor/ejecutor.js';
import { ModeloFalso } from '../src/escritor/modelo/falso.js';
import { carpetaDeLaBase, escribirLibroV3, type Motor } from '../src/escritor/produccion/libro-v3.js';
import { carpetaNelida, DEFECTOS_NELIDA, salidasModeloNelida } from '../test/escritor/ayuda.js';

function args(): { narrador: string; libro: boolean; prefijo: string } {
  const a = process.argv.slice(2);
  const i = a.indexOf('--narrador');
  if (i < 0 || !a[i + 1]) throw new Error('falta --narrador <id>');
  const j = a.indexOf('--carpeta');
  return { narrador: a[i + 1], libro: a.includes('--libro'), prefijo: j >= 0 && a[j + 1] ? a[j + 1] : 'prueba-escritor-v3' };
}

/** La base real, con Storage desviado a `{id}/<prefijo>/` y sin escribir en pedidos ni en consumo_ia. */
function baseDesviada(db: SupabaseClient, narrador: string, prefijo: string, anotar: (s: string) => void): SupabaseClient {
  const desviar = (ruta: string): string => (ruta.startsWith(`${narrador}/`) ? `${narrador}/${prefijo}/${ruta.slice(narrador.length + 1)}` : ruta);
  const storage = {
    from: (bucket: string) => {
      const b = db.storage.from(bucket);
      return {
        download: (ruta: string, ...r: unknown[]) => (b.download as (...x: unknown[]) => unknown)(desviar(ruta), ...r),
        upload: (ruta: string, ...r: unknown[]) => { anotar(`subido: ${desviar(ruta)}`); return (b.upload as (...x: unknown[]) => unknown)(desviar(ruta), ...r); },
        list: (ruta: string, ...r: unknown[]) => (b.list as (...x: unknown[]) => unknown)(desviar(ruta), ...r),
      };
    },
  };
  const from = (tabla: string) => {
    if (tabla === 'pedidos') {
      const q: Record<string, unknown> = {};
      q.update = (c: unknown) => { anotar(`pedidos.update (NO se escribe): ${JSON.stringify(c)}`); return q; };
      q.eq = () => q;
      q.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(ok);
      return q;
    }
    if (tabla === 'consumo_ia') return { insert: async () => ({ error: null }) };
    return db.from(tabla);
  };
  return { from, storage } as unknown as SupabaseClient;
}

async function main(): Promise<void> {
  const a = args();
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) throw new Error('faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (fabrica/.env)');
  const db = createClient(url, clave, { auth: { persistSession: false } });

  console.log(`1) La entrevista V3 de ${a.narrador}, leída como la lee el worker:`);
  try {
    const { c, audios } = await carpetaDeLaBase(db, a.narrador);
    console.log(c.leer('entradas/ficha.xml'));
    const etiquetas = JSON.parse(c.leer('entradas/etiquetas.json')) as { id: string; preguntaId: string; paso: boolean; palabras: number }[];
    console.log(`respuestas: ${etiquetas.length} (${etiquetas.filter((e) => !e.paso).length} llegan al escritor) · audios con clave: ${audios.length} (${audios.filter((x) => x.audioPath).length} publicables)`);
    for (const e of etiquetas) console.log(`  ${e.id} ${e.preguntaId}${e.paso ? ' (paso)' : ''} · ${e.palabras} palabras`);
  } catch (err) {
    console.log(`  no se pudo armar: ${(err as Error).message}`);
  }
  if (!a.libro) return;

  console.log(`\n2) El libro entero con el modelo falso, en ${a.narrador}/${a.prefijo}/ (no se paga nada, no se toca el pedido):`);
  const hechos: string[] = [];
  const desviada = baseDesviada(db, a.narrador, a.prefijo, (s) => hechos.push(s));
  const modelo = new ModeloFalso(salidasModeloNelida(), DEFECTOS_NELIDA);
  const material = carpetaNelida(['entradas']);
  material.escribir('entradas/etiquetas.json', JSON.stringify([{ id: 'R07', preguntaId: 'HO2' }, { id: 'R08', preguntaId: 'LE1' }]));
  const motor: Motor = {
    ejecutor: ({ almacen, log }) => ({ ej: new Ejecutor({ modelo, almacen, log }), usarLote: false }),
    material: async () => ({ c: material.clonar(), audios: [{ respuestaId: 'prueba', clave: 'HO2', audioPath: 'x.ogg', transcripcion: 'Me gusta el mate amargo, bien caliente, a cualquier hora.', recibidoAt: '' }] }),
  };
  const t0 = Date.now();
  await escribirLibroV3(desviada, { id: 'pedido-de-prueba', narrador_id: a.narrador }, motor);
  console.log(`  ${modelo.llamadas.length} llamadas al modelo falso · ${Math.round((Date.now() - t0) / 1000)} s`);
  for (const h of hechos.filter((h) => !h.includes('/pasos/'))) console.log(`  ${h}`);
  console.log(`  (más ${hechos.filter((h) => h.includes('/pasos/')).length} checkpoints en pasos/)`);

  console.log('\n3) Otra vez, como si Railway hubiera reiniciado: tiene que salir todo de los checkpoints.');
  const antes = modelo.llamadas.length;
  hechos.length = 0;
  await escribirLibroV3(desviada, { id: 'pedido-de-prueba', narrador_id: a.narrador }, motor);
  console.log(`  llamadas nuevas al modelo: ${modelo.llamadas.length - antes} · ${hechos.filter((h) => h.includes('pedidos.update')).join(' ')}`);
  console.log(`\nEl PDF quedó en Storage: ${a.narrador}/${a.prefijo}/paquete/libro.pdf (${path.basename('libro.pdf')}).`);
}

main().catch((err) => {
  console.error(`ERROR: ${(err as Error).message}`);
  process.exit(1);
});
