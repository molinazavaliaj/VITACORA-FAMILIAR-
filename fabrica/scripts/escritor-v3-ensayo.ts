// Ensayo PAGO del escritor V3 por el camino de producción, con un capítulo solo (Naza, 09/10):
//
//   npx tsx --env-file=.env scripts/escritor-v3-ensayo.ts --narrador <id> --material <dir con entradas/> [--capitulo N] [--carpeta <prefijo>] --si
//
// Corre correrEtapaAV3 (la misma función que lanza el worker al terminar una entrevista) con el modelo de
// verdad, Batch, AlmacenSupabase y consumo_ia, y después la Etapa C de UN capítulo sobre ese snapshot A.
// Lo que NO es de producción: el material sale de una carpeta del disco (la entrevista V3 de la web), y todo lo
// que se escribe en Storage va a `{id}/<prefijo>/…` (por defecto `ensayo-escritor-v3`), no a `{id}/escritor/`.
// No toca pedidos. Las llamadas SÍ van a consumo_ia (es plata de verdad). Sin --si no llama a nada.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AlmacenSupabase } from '../src/escritor/almacen/supabase.js';
import { Carpeta } from '../src/escritor/carpeta.js';
import { cargarSnapshot } from '../src/escritor/orquestador/contexto.js';
import { etapaC } from '../src/escritor/orquestador/etapa-c.js';
import { correrEtapaAV3, motorReal, PREFIJO_ESCRITOR, type Motor } from '../src/escritor/produccion/libro-v3.js';

function args() {
  const a = process.argv.slice(2);
  const v = (k: string): string | undefined => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const narrador = v('--narrador');
  const material = v('--material');
  if (!narrador || !material) throw new Error('faltan --narrador <id> y --material <dir>');
  return { narrador, material, capitulo: Number(v('--capitulo') ?? 1), prefijo: v('--carpeta') ?? 'ensayo-escritor-v3', si: a.includes('--si') };
}

/** Storage desviado a `{id}/<prefijo>/`; pedidos no se tocan; lo demás (narradores, consumo_ia) es la base real. */
function baseDesviada(db: SupabaseClient, narrador: string, prefijo: string): SupabaseClient {
  const desviar = (ruta: string): string => (ruta.startsWith(`${narrador}/`) ? `${narrador}/${prefijo}/${ruta.slice(narrador.length + 1)}` : ruta);
  const storage = {
    from: (bucket: string) => {
      const b = db.storage.from(bucket);
      return {
        download: (ruta: string, ...r: unknown[]) => (b.download as (...x: unknown[]) => unknown)(desviar(ruta), ...r),
        upload: (ruta: string, ...r: unknown[]) => (b.upload as (...x: unknown[]) => unknown)(desviar(ruta), ...r),
        list: (ruta: string, ...r: unknown[]) => (b.list as (...x: unknown[]) => unknown)(desviar(ruta), ...r),
      };
    },
  };
  const from = (tabla: string) => {
    if (tabla === 'pedidos') throw new Error('el ensayo no toca pedidos');
    return db.from(tabla);
  };
  return { from, storage } as unknown as SupabaseClient;
}

async function main(): Promise<void> {
  const a = args();
  const c = new Carpeta();
  for (const f of ['ficha.xml', 'respuestas.xml']) c.escribir(`entradas/${f}`, readFileSync(path.join(a.material, 'entradas', f), 'utf8'));
  console.log(`material: ${(c.leer('entradas/respuestas.xml').match(/<respuesta /g) ?? []).length} respuestas · destino ${a.narrador}/${a.prefijo}/`);
  if (!a.si) { console.log('Sin --si no se llama a la API (Etapa A ~USD 2,3 + un capítulo ~0,5, por Batch: horas).'); return; }

  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const desviada = baseDesviada(db, a.narrador, a.prefijo);
  const real = motorReal(desviada);
  const motor: Motor = { ...real, material: async () => ({ c: c.clonar(), audios: [] }) };
  const t0 = Date.now();
  const hora = (): string => `${Math.round((Date.now() - t0) / 60000)} min`;

  console.log(`\n1) Etapa A con correrEtapaAV3 (${new Date().toISOString()})`);
  const r = await correrEtapaAV3(desviada, a.narrador, motor);
  console.log(`   ${hora()} · ${JSON.stringify(r.ok ? { ok: true, capitulos: r.capitulos, dudas: r.dudas.map((d) => d.pregunta) } : r)}`);
  if (!r.ok) return;

  console.log(`\n2) Etapa C, solo el capítulo ${a.capitulo}`);
  const almacen = new AlmacenSupabase(desviada, PREFIJO_ESCRITOR(a.narrador));
  const snap = await cargarSnapshot(almacen, 'A');
  if (!snap) throw new Error('no quedó carpeta-A.json en Storage');
  const log = (s: string): void => console.log(`   ${s}`);
  const { ej, usarLote } = real.ejecutor({ almacen, narradorId: a.narrador, log });
  const rc = await etapaC({ c: snap, ej, almacen, log, usarLote }, { soloCapitulo: a.capitulo });
  const nn = String(a.capitulo).padStart(2, '0');
  const cap = snap.leer(`salidas/capitulo_${nn}.md`);
  const salida = path.join(a.material, `ensayo-capitulo-${nn}.md`);
  writeFileSync(salida, cap, 'utf8');
  console.log(`   ${hora()} · capítulo en ${salida} · ${rc.controlesFinal}`);
  const costos = JSON.parse((await almacen.leer('costos.json')) ?? '{"total_usd":0}') as { total_usd: number };
  console.log(`\nGasto de la Etapa C: USD ${rc.usd.toFixed(2)} · costos.json (C): USD ${costos.total_usd.toFixed(2)} · ver consumo_ia (paso escritor-A / escritor-C).`);
}

main().catch((err) => {
  console.error(`ERROR: ${(err as Error).message}`);
  process.exit(1);
});
