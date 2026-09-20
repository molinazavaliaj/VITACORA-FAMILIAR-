// Imprime cuánto costó de verdad un libro (lo que se le pagó al modelo),
// leído de `{narradorId}/paquete/costos.json` en el bucket `audios`:
//
//   npx tsx scripts/costos.ts <narradorId>
//
// Corre desde `fabrica/`. Lee `fabrica/.env` si está (SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY); si no, usa las variables del entorno.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUTA_COSTOS, parsearCostos, resumen, type FilaCosto } from '../src/costos.js';
import { obtenerClienteDb } from '../src/db.js';
import { descargarTextoOpcional } from '../src/libro/comun.js';

const USO = 'Uso: npx tsx scripts/costos.ts <narradorId>';

function cargarEnvSiEsta(): void {
  const rutaEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  if (existsSync(rutaEnv)) process.loadEnvFile(rutaEnv);
}

function usd(valor: number): string {
  return `USD ${valor.toFixed(4)}`;
}

function tokens(valor: number): string {
  return valor.toLocaleString('es-AR');
}

async function main(): Promise<void> {
  const [narradorId] = process.argv.slice(2);
  if (!narradorId) {
    console.error(USO);
    process.exit(1);
  }

  cargarEnvSiEsta();
  const db = obtenerClienteDb();
  const texto = await descargarTextoOpcional(db, RUTA_COSTOS(narradorId));
  if (texto === null) {
    console.log(`El narrador ${narradorId} todavía no tiene costos.json (ninguna llamada al modelo anotada).`);
    return;
  }

  const costos: FilaCosto[] = parsearCostos(texto);
  const r = resumen(costos);

  console.log(`Costos del libro de ${narradorId} — ${r.llamadas} llamada(s) al modelo`);
  console.log('');
  console.log('Por paso:');
  for (const [paso, datos] of Object.entries(r.porPaso)) {
    console.log(`  ${paso.padEnd(12)} ${usd(datos.usd).padStart(14)}   (${datos.llamadas} llamada${datos.llamadas === 1 ? '' : 's'})`);
  }
  console.log('');
  console.log(`  ${'TOTAL'.padEnd(12)} ${usd(r.totalUsd).padStart(14)}`);
  console.log('');
  console.log('Detalle:');
  for (const fila of costos) {
    console.log(
      `  ${fila.fecha}  ${fila.paso.padEnd(11)} ${fila.modelo.padEnd(18)} ` +
        `in ${tokens(fila.input)}  out ${tokens(fila.output)}  cache w/r ${tokens(fila.cache_write)}/${tokens(fila.cache_read)}  ${usd(fila.usd)}`
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
