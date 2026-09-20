// Por qué existe: la selección automática de las frases se aprueba con datos, no con opinión.
// Este script corre el prompt REAL contra el libro de un narrador ya terminado, imprime tokens y
// costo, y deja las frases elegidas con su "por qué" para que Naza las lea (Task 5 del plan
// `docs/superpowers/plans/2026-09-20-su-voz-fabrica.md`). No escribe NADA en Supabase: ni base
// ni Storage. Es el hermano de `prueba-*.ts` del entrevistador: medir antes de decidir.
//
//   npx tsx scripts/prueba-frases.ts <narradorId> [--salida <ruta>]
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../src/config.js';
import { obtenerClienteDb, type Respuesta } from '../src/db.js';
import { descargarTextoOpcional } from '../src/libro/comun.js';
import {
  armarFrasesJson,
  elegirFinales,
  proponerCandidatas,
  FRASES_POR_CAPITULO,
  type FrasesJson,
  type MaterialDeFrase,
} from '../src/libro/frases.js';

/** Fable 5, `GASTOS.md:70` (USD por millón de tokens). */
const PRECIO_ENTRADA = 10;
const PRECIO_SALIDA = 50;
const RUTA_ESTRUCTURA = (narradorId: string) => `${narradorId}/paquete/estructura.json`;

type Estructura = { titulo?: string; capitulos: { nombre: string; ordenes: number[] }[] };

type Uso = { llamadas: number; entrada: number; salida: number };

/** Un cliente que va contando lo que gasta: es la mitad del punto de este script. */
function clienteQueCuenta(real: Anthropic, uso: Uso): Anthropic {
  return {
    messages: {
      create: async (params: Parameters<Anthropic['messages']['create']>[0]) => {
        // El SDK tipa el retorno como Message o Stream: acá siempre es mensaje (no streameamos).
        const respuesta = (await real.messages.create(params)) as unknown as {
          usage: { input_tokens: number; output_tokens: number };
        };
        uso.llamadas++;
        uso.entrada += respuesta.usage.input_tokens;
        uso.salida += respuesta.usage.output_tokens;
        return respuesta as never;
      },
    },
  } as unknown as Anthropic;
}

function costo(uso: Uso): number {
  return (uso.entrada / 1_000_000) * PRECIO_ENTRADA + (uso.salida / 1_000_000) * PRECIO_SALIDA;
}

export async function medirFrases(narradorId: string): Promise<{ frases: FrasesJson; uso: Uso; segundos: number }> {
  const db = obtenerClienteDb();

  const { data: narrador, error: errorNarrador } = await db
    .from('narradores')
    .select('id, nombre')
    .eq('id', narradorId)
    .single();
  if (errorNarrador || !narrador) throw new Error(`No encontré el narrador ${narradorId}: ${errorNarrador?.message ?? 'sin datos'}`);

  const estructuraTexto = await descargarTextoOpcional(db, RUTA_ESTRUCTURA(narradorId));
  if (estructuraTexto === null) throw new Error(`No hay estructura.json para ${narradorId}: sin capítulos no hay frases.`);
  const estructura = JSON.parse(estructuraTexto) as Estructura;

  const { data: respuestas, error: errorRespuestas } = await db.from('respuestas').select('*').eq('narrador_id', narradorId);
  if (errorRespuestas) throw new Error(`No se pudieron leer las respuestas: ${errorRespuestas.message}`);
  const porOrden = new Map<number, Respuesta[]>();
  for (const respuesta of (respuestas ?? []) as Respuesta[]) {
    porOrden.set(respuesta.pregunta_orden, [...(porOrden.get(respuesta.pregunta_orden) ?? []), respuesta]);
  }

  const capitulos = estructura.capitulos.map((capitulo, i) => {
    const material: MaterialDeFrase[] = [];
    for (const orden of capitulo.ordenes) {
      for (const r of porOrden.get(orden) ?? []) {
        // Sin audio no hay frase que escuchar (y el texto vacío no le sirve al modelo).
        const texto = (r.transcripcion || r.texto_directo || '').trim();
        if (!r.audio_path || texto === '') continue;
        material.push({
          orden,
          respuestaId: r.id,
          audioPath: r.audio_path,
          texto,
          reserva: { reservada: r.reservada, reservado_tramo: r.reservado_tramo },
        });
      }
    }
    return { nombre: capitulo.nombre, numero: i + 1, material };
  });

  const uso: Uso = { llamadas: 0, entrada: 0, salida: 0 };
  const real = new Anthropic({ apiKey: cargarConfig().anthropicApiKey });
  const cliente = clienteQueCuenta(real, uso);

  const arranque = Date.now();
  const frases = await armarFrasesJson(
    { narradorId, pedidoId: '-prueba-', nombre: narrador.nombre, capitulos },
    { cliente, proponer: proponerCandidatas, elegir: elegirFinales }
  );
  return { frases, uso, segundos: (Date.now() - arranque) / 1000 };
}

function imprimir(frases: FrasesJson, uso: Uso, segundos: number): void {
  for (const capitulo of frases.capitulos) {
    console.log(`\n${String(capitulo.numero).padStart(2)}. ${capitulo.capitulo}`);
    for (const candidata of capitulo.candidatas) {
      console.log(`   ${candidata.elegida ? '★' : ' '} «${candidata.texto}»`);
      if (candidata.elegida) console.log(`      por qué: ${candidata.por_que}`);
    }
  }
  const elegidas = frases.capitulos.reduce((total, c) => total + c.candidatas.filter((x) => x.elegida).length, 0);
  console.log(
    `\n${frases.capitulos.length} capítulo(s) · ${elegidas} elegida(s) (${FRASES_POR_CAPITULO} por capítulo) · ` +
      `${frases.capitulos.reduce((t, c) => t + c.candidatas.length, 0)} cortadas por el worker`
  );
  console.log(
    `Modelo: ${uso.llamadas} llamada(s) · ${uso.entrada} tokens de entrada · ${uso.salida} de salida · ` +
      `USD ${costo(uso).toFixed(3)} · ${segundos.toFixed(0)} s`
  );
}

async function main(): Promise<void> {
  const narradorId = process.argv[2];
  if (!narradorId) {
    console.error('Uso: npx tsx scripts/prueba-frases.ts <narradorId> [--salida <ruta>]');
    process.exit(1);
  }
  const iSalida = process.argv.indexOf('--salida');
  const ruta = iSalida >= 0 ? process.argv[iSalida + 1] : path.join(process.cwd(), `prueba-frases-${narradorId}.json`);

  const { frases, uso, segundos } = await medirFrases(narradorId);
  await writeFile(ruta, JSON.stringify(frases, null, 2), 'utf8');
  imprimir(frases, uso, segundos);
  console.log(`\nEl JSON quedó en ${ruta} (no se tocó ni la base ni Storage).`);
}

// Solo corre si es el programa principal (los tests pueden importar `medirFrases` sin gastar).
if (process.argv[1] && process.argv[1].includes('prueba-frases')) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
