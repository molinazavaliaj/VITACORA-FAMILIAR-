/**
 * ¿El gasto queda anotado? — una llamada real y barata por el camino de producción.
 *
 * Uso:  npx tsx scripts/prueba-consumo.ts
 *
 * Por qué existe: los scripts `prueba-*.ts` se arman su PROPIO cliente de Anthropic
 * para comparar modelos, así que no pasan por las funciones de producción y no
 * pueden probar que el costo se anote (medido el 21/09: después de correr
 * `prueba-evaluacion` el panel seguía sin filas). Este script llama a la misma
 * función que corre en el servicio —`detectarIntencion` (Opus, tokens)— y
 * después lee la tabla de vuelta.
 *
 * 22/09 (3t.28): probaba además el camino "por unidad" con `generarAudioVoz`
 * (OpenAI, caracteres), pero el entrevistador ya no usa TTS y ese módulo no
 * existe más. El único paso por unidad que queda es la transcripción (por
 * segundos, `src/ia/transcribir.ts`), y no se puede disparar barato desde acá:
 * necesita un audio real. Se verifica sola con la primera respuesta del día.
 *
 * Cuesta centavos: una llamada corta de Opus. Las filas que deja son reales
 * (sin narrador: son de una prueba, no del trabajo de alguien).
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
// El cerebro exige el entorno completo al importarse. Las de WhatsApp están VACÍAS
// en el .env (Meta sin habilitar), así que van con `||=` y no con `??=`.
for (const v of ['WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN']) {
  process.env[v] ||= 'prueba';
}

const { detectarIntencion } = await import('../src/ia/cerebro.js');
const { db } = await import('../src/db/cliente.js');

const antes = await db.from('consumo_ia').select('id');
console.log(`Filas en consumo_ia antes: ${antes.data?.length ?? 'error'}`);

console.log('\n1) Opus, por tokens (detectarIntencion)…');
const intencion = await detectarIntencion('Ya no quiero seguir con esto, muchas gracias.');
console.log(`   veredicto: ${intencion}`);

const despues = await db
  .from('consumo_ia')
  .select('fecha,paso,modelo,proveedor,input_tokens,output_tokens,cantidad,unidad,usd')
  .order('fecha', { ascending: false })
  .limit(4);

console.log('\nÚltimas filas en consumo_ia (leídas de vuelta):');
for (const f of despues.data ?? []) console.log('  ', f);

const nuevas = (despues.data ?? []).filter((f) => f.paso === 'intencion');
if (nuevas.length < 1) {
  console.error('\n✗ FALLÓ: la llamada real no dejó su fila. Mirá los avisos `costos:` de arriba.');
  process.exit(1);
}
console.log(`\n✓ Las ${nuevas.length} filas quedaron anotadas con sus tokens/unidades y su USD.`);
