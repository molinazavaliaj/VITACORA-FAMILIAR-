// Por qué existe: la selección automática de las frases se aprueba con datos, no con opinión.
// Este script corre el prompt REAL contra un libro ya terminado (sus citas y su página «Sus
// frases»), imprime tokens y costo, y deja las elegidas con su "por qué" para que Naza las lea
// (Task 5 del plan `docs/superpowers/plans/2026-09-20-su-voz-fabrica.md`). No escribe NADA en
// Supabase: ni base ni Storage.
//
//   npx tsx scripts/prueba-frases.ts <narradorId> [--salida <ruta>]
//
// El libro lo busca como markdown (`borrador_libro.md`); si ya no está (se borra al entregar),
// lo reconstruye desde el `libro.html` del paquete, que alcanza para las citas y «Sus frases».
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../src/config.js';
import { obtenerClienteDb, type Respuesta } from '../src/db.js';
import { descargarTextoOpcional } from '../src/libro/comun.js';
import { elegirFrases, FRASES_POR_CAPITULO, type FrasesJson, type MaterialDeFrase } from '../src/libro/frases.js';

/** Fable 5, `GASTOS.md:70` (USD por millón de tokens). */
const PRECIO_ENTRADA = 10;
const PRECIO_SALIDA = 50;

type Estructura = { titulo?: string; capitulos: { nombre: string; ordenes: number[] }[] };
type Uso = { llamadas: number; entrada: number; salida: number; pensamiento: number };

/** Un cliente que va contando lo que gasta: es la mitad del punto de este script. */
function clienteQueCuenta(real: Anthropic, uso: Uso): Anthropic {
  return {
    messages: {
      create: async (params: Parameters<Anthropic['messages']['create']>[0]) => {
        const respuesta = (await real.messages.create(params)) as unknown as {
          usage: { input_tokens: number; output_tokens: number; output_tokens_details?: { thinking_tokens?: number } };
        };
        uso.llamadas++;
        uso.entrada += respuesta.usage.input_tokens;
        uso.salida += respuesta.usage.output_tokens;
        uso.pensamiento += respuesta.usage.output_tokens_details?.thinking_tokens ?? 0;
        return respuesta as never;
      },
    },
  } as unknown as Anthropic;
}

const costo = (uso: Uso) => (uso.entrada / 1_000_000) * PRECIO_ENTRADA + (uso.salida / 1_000_000) * PRECIO_SALIDA;

/** Convierte el libro html en algo parecido a su markdown: nos alcanza para citas y «Sus frases». */
function htmlAMarkdown(html: string): string {
  const cuerpo = html.split('</style>').pop() ?? html;
  return cuerpo
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, (_m, t: string) => `\n> ${limpiar(t)}\n`)
    .replace(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/g, (_m, nivel: string, t: string) => `\n${'#'.repeat(Number(nivel))} ${limpiar(t)}\n`)
    .replace(/<\/(p|div|li)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n');
}

function limpiar(fragmento: string): string {
  return fragmento
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function medirFrases(narradorId: string): Promise<{ frases: FrasesJson; uso: Uso; segundos: number; fuente: string }> {
  const db = obtenerClienteDb();
  const { data: narrador, error: errorNarrador } = await db.from('narradores').select('id, nombre').eq('id', narradorId).single();
  if (errorNarrador || !narrador) throw new Error(`No encontré el narrador ${narradorId}: ${errorNarrador?.message ?? 'sin datos'}`);

  const estructuraTexto = await descargarTextoOpcional(db, `${narradorId}/paquete/estructura.json`);
  if (estructuraTexto === null) throw new Error(`No hay estructura.json para ${narradorId}: sin capítulos no hay frases.`);
  const estructura = JSON.parse(estructuraTexto) as Estructura;

  // El libro: markdown si todavía está, si no reconstruido del html del paquete.
  let libroMarkdown = await descargarTextoOpcional(db, `${narradorId}/paquete/borrador_libro.md`);
  let fuente = 'borrador_libro.md';
  if (libroMarkdown === null) {
    const html = await descargarTextoOpcional(db, `${narradorId}/paquete/libro.html`);
    if (html === null) throw new Error(`No hay libro (ni borrador_libro.md ni libro.html) para ${narradorId}.`);
    libroMarkdown = htmlAMarkdown(html);
    fuente = 'libro.html (reconstruido)';
  }

  const { data: respuestas, error: errorRespuestas } = await db.from('respuestas').select('*').eq('narrador_id', narradorId);
  if (errorRespuestas) throw new Error(`No se pudieron leer las respuestas: ${errorRespuestas.message}`);
  const porOrden = new Map<number, Respuesta[]>();
  for (const r of (respuestas ?? []) as Respuesta[]) {
    porOrden.set(r.pregunta_orden, [...(porOrden.get(r.pregunta_orden) ?? []), r]);
  }

  const capitulos = estructura.capitulos.map((capitulo, i) => {
    const material: MaterialDeFrase[] = [];
    for (const orden of capitulo.ordenes) {
      for (const r of porOrden.get(orden) ?? []) {
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

  const uso: Uso = { llamadas: 0, entrada: 0, salida: 0, pensamiento: 0 };
  const cliente = clienteQueCuenta(new Anthropic({ apiKey: cargarConfig().anthropicApiKey }), uso);

  const arranque = Date.now();
  const frases = await elegirFrases(cliente, { narradorId, pedidoId: '-prueba-', nombre: narrador.nombre, libroMarkdown, capitulos });
  return { frases, uso, segundos: (Date.now() - arranque) / 1000, fuente };
}

function imprimir(frases: FrasesJson, uso: Uso, segundos: number, fuente: string): void {
  for (const capitulo of frases.capitulos) {
    console.log(`\n${String(capitulo.numero).padStart(2)}. ${capitulo.capitulo}`);
    for (const candidata of capitulo.candidatas) {
      const etiqueta = candidata.origen === 'sus-frases' ? ` (${candidata.grupo})` : '';
      console.log(`   ${candidata.elegida ? '★' : ' '} «${candidata.texto}»${etiqueta}`);
      if (candidata.elegida) console.log(`      por qué: ${candidata.por_que}`);
    }
  }
  const elegidas = frases.capitulos.reduce((t, c) => t + c.candidatas.filter((x) => x.elegida).length, 0);
  const total = frases.capitulos.reduce((t, c) => t + c.candidatas.length, 0);
  console.log(`\n${frases.capitulos.length} capítulo(s) · ${elegidas} elegida(s) (${FRASES_POR_CAPITULO} por capítulo) · ${total} a cortar`);
  console.log(`Libro: ${fuente}`);
  console.log(
    `Modelo: ${uso.llamadas} llamada(s) · ${uso.entrada} in · ${uso.salida} out (${uso.pensamiento} pensando) · ` +
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

  const { frases, uso, segundos, fuente } = await medirFrases(narradorId);
  await writeFile(ruta, JSON.stringify(frases, null, 2), 'utf8');
  imprimir(frases, uso, segundos, fuente);
  console.log(`\nEl JSON quedó en ${ruta} (no se tocó ni la base ni Storage).`);
}

if (process.argv[1] && process.argv[1].includes('prueba-frases')) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
