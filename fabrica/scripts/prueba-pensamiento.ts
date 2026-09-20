// Desechable (spike): ¿cuánto ahorra acotar el pensamiento del modelo?
//   python correr-fabrica.py scripts/prueba-pensamiento.ts <narradorId> <capítulo>
// Corre el MISMO prompt de candidatas tres veces —tal cual, con el pensamiento apagado y con un
// tope— e imprime tokens, costo y las frases de cada uno, para comparar el juicio además del
// gasto. No escribe nada en Supabase. Si el resultado convence, el parámetro se agrega a
// `frases.ts` con su test (Task 1 del plan).
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../src/config.js';
import { obtenerClienteDb, type Respuesta } from '../src/db.js';
import { descargarTextoOpcional } from '../src/libro/comun.js';
import { PROMPT_CANDIDATAS, type MaterialDeFrase } from '../src/libro/frases.js';

const PRECIO_ENTRADA = 10;
const PRECIO_SALIDA = 50;

type Config = { nombre: string; extra: Record<string, unknown> };

const CONFIGS: Config[] = [
  { nombre: 'sin tocar (línea base)', extra: {} },
  { nombre: 'adaptativo + effort bajo', extra: { thinking: { type: 'adaptive' }, output_config: { effort: 'low' } } },
  { nombre: 'adaptativo + effort medio', extra: { thinking: { type: 'adaptive' }, output_config: { effort: 'medium' } } },
];

async function main(): Promise<void> {
  const [narradorId, numero] = process.argv.slice(2);
  if (!narradorId || !numero) {
    console.error('Uso: npx tsx scripts/prueba-pensamiento.ts <narradorId> <número de capítulo>');
    process.exit(1);
  }

  const db = obtenerClienteDb();
  const { data: narrador } = await db.from('narradores').select('id, nombre').eq('id', narradorId).single();
  const estructura = JSON.parse((await descargarTextoOpcional(db, `${narradorId}/paquete/estructura.json`)) ?? '{"capitulos":[]}') as {
    capitulos: { nombre: string; ordenes: number[] }[];
  };
  const capitulo = estructura.capitulos[Number(numero) - 1];
  const { data: respuestas } = await db.from('respuestas').select('*').eq('narrador_id', narradorId);
  const porOrden = new Map<number, Respuesta>();
  for (const r of (respuestas ?? []) as Respuesta[]) {
    if (r.audio_path && (r.transcripcion || r.texto_directo)) porOrden.set(r.pregunta_orden, r);
  }
  const material: MaterialDeFrase[] = capitulo.ordenes
    .map((orden) => porOrden.get(orden))
    .filter((r): r is Respuesta => Boolean(r))
    .map((r) => ({
      orden: r.pregunta_orden,
      respuestaId: r.id,
      audioPath: r.audio_path,
      texto: (r.transcripcion || r.texto_directo || '').trim(),
    }));

  const cliente = new Anthropic({ apiKey: cargarConfig().anthropicApiKey });
  const contenido = `${PROMPT_CANDIDATAS(narrador?.nombre ?? 'el narrador', capitulo.nombre)}\n\n--- MATERIAL ---\n${material
    .map((m) => `[${m.orden}] ${m.texto}`)
    .join('\n\n')}`;

  console.log(`Capítulo ${numero}: ${capitulo.nombre} · ${material.length} respuesta(s) · entrada ≈ ${contenido.length / 3.5 | 0} tokens\n`);

  for (const config of CONFIGS) {
    try {
      const arranque = Date.now();
      const respuesta = await cliente.messages.create({
        model: 'claude-fable-5',
        max_tokens: 8000,
        messages: [{ role: 'user', content: contenido }],
        ...config.extra,
      } as never);
      const uso = respuesta.usage as unknown as { input_tokens: number; output_tokens: number; output_tokens_details?: { thinking_tokens?: number } };
      const costo = (uso.input_tokens / 1_000_000) * PRECIO_ENTRADA + (uso.output_tokens / 1_000_000) * PRECIO_SALIDA;
      const texto = respuesta.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { text?: string }).text ?? '')
        .join('');
      let frases: { texto: string; por_que: string }[] = [];
      try {
        frases = (JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)) as { candidatas?: typeof frases }).candidatas ?? [];
      } catch {
        /* se muestra el texto crudo abajo */
      }
      console.log(`── ${config.nombre}`);
      console.log(
        `   ${uso.input_tokens} in · ${uso.output_tokens} out (${uso.output_tokens_details?.thinking_tokens ?? 0} pensando) · ` +
          `USD ${costo.toFixed(4)} · ${((Date.now() - arranque) / 1000).toFixed(0)} s`
      );
      for (const f of frases) console.log(`   · «${f.texto}»`);
      if (frases.length === 0) console.log(`   (sin JSON: «${texto.slice(0, 120)}»)`);
      console.log('');
    } catch (err) {
      console.log(`── ${config.nombre}\n   RECHAZADO o falló: ${(err as Error).message.slice(0, 200)}\n`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
