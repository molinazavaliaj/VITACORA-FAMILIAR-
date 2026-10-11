// Vuelve a cazar los bloques cuya caza falló (11/10: la key de Anthropic del
// entrevistador en Railway estaba revocada). Dos pasos, como v3-pasar:
//
//   npm run v3-recazar -- <narradorId>
//       Prueba: lee la entrevista, corre el cazador sobre los bloques con error
//       (paga las llamadas a Anthropic con la key de entrevistador/.env), muestra
//       las repreguntas y las guarda en un JSON FUERA del repo (carpeta temporal
//       del sistema: lleva citas del narrador). NO escribe en la base.
//
//   npm run v3-recazar -- <narradorId> --aplicar <ese JSON>
//       Suma esas repreguntas a la entrevista (compare-and-swap, sobre el estado
//       de ese momento) y anota en consumo_ia el costo de lo que se aplicó. No
//       vuelve a pagar; aplicarlo dos veces no cambia nada ni duplica el costo.
//
// Nunca imprime keys.

import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cargarEntorno } from './cargar-entorno.js';

cargarEntorno();
const { db } = await import('../src/db/cliente.js');
const { cargarConfig } = await import('../src/config.js');
const { leerFila, conReintento } = await import('../src/v3/estado.js');
const { fichaTexto } = await import('../src/v3/tipos.js');
const { cazarAlCerrar, sumarCaza } = await import('../src/v3/turno.js');
const { clienteCazador } = await import('../src/v3/cazador.js');
const { MODELO_CAZADOR } = await import('../src/v3/nucleo/entrevista/cazador.js');
const { registrarUso, cuentaDeEsteServicio } = await import('../src/costos.js');
const { aplicarRecaza, bloquesAplicables, bloquesConError, sinErrores } = await import('../src/v3/recazar.js');

type Resultado = Awaited<ReturnType<typeof cazarAlCerrar>>;

const USO = 'Uso: npm run v3-recazar -- <narradorId> [--aplicar <archivo.json>]';
const [narradorId, ...resto] = process.argv.slice(2);
const iAplicar = resto.indexOf('--aplicar');
if (!narradorId || narradorId.startsWith('--') || (iAplicar >= 0 && !resto[iAplicar + 1])) {
  console.error(USO);
  process.exit(1);
}

const fila = await leerFila(db, narradorId);
if (!fila) {
  console.error(`No hay entrevista V3 para ${narradorId}.`);
  process.exit(1);
}

if (iAplicar < 0) {
  const bloques = bloquesConError(fila.estado);
  if (bloques.length === 0) {
    console.log('No hay bloques con la caza fallada. Nada que hacer.');
    process.exit(0);
  }
  console.log(`Bloques con error: ${bloques.join(', ')}. Cazando (paga Anthropic)…\n`);
  const cliente = clienteCazador(cargarConfig().anthropicKey);
  const ficha = fichaTexto(fila);
  const salida = join(tmpdir(), `recazar-${narradorId.slice(0, 8)}.json`);
  const guardar = () => writeFileSync(salida, JSON.stringify({ narradorId, resultados }, null, 2));
  let e = sinErrores(fila.estado, bloques);
  const resultados: Resultado[] = [];
  for (const b of bloques) {
    const r = await cazarAlCerrar(e, ficha, b, cliente);
    if (r.error) {
      // Lo de los bloques anteriores ya se pagó: se guarda para aplicarlo igual.
      if (resultados.length) guardar();
      console.error(`Bloque ${b}: falló otra vez (${r.error}). Corto acá.${resultados.length ? ` Lo anterior quedó en ${salida}.` : ''}`);
      process.exit(1);
    }
    resultados.push(r);
    e = sumarCaza(e, r);
    console.log(`── Bloque ${b}: ${r.repreguntas.length} repregunta(s), USD ${r.costoUsd.toFixed(3)}${r.motivo ? ` (${r.motivo})` : ''}`);
    for (const rp of r.repreguntas) console.log(`   · «${rp.cita}»\n     → ${rp.pregunta}`);
  }
  guardar();
  const total = resultados.reduce((s, r) => s + r.costoUsd, 0);
  console.log(`\nTotal: ${resultados.reduce((s, r) => s + r.repreguntas.length, 0)} repregunta(s), USD ${total.toFixed(2)}.`);
  console.log(`Guardado en ${salida} (fuera del repo). No se cambió nada en la base.`);
  console.log(`Para aplicarlo: npm run v3-recazar -- ${narradorId} --aplicar "${salida}"`);
} else {
  const guardado = JSON.parse(readFileSync(resto[iAplicar + 1], 'utf8')) as { narradorId: string; resultados: Resultado[] };
  if (guardado.narradorId !== narradorId) {
    console.error('El archivo es de otro narrador.');
    process.exit(1);
  }
  const r = await conReintento(db, narradorId, (f) => {
    const aplicables = bloquesAplicables(f.estado, guardado.resultados);
    return aplicables.length ? { cambio: { estado: aplicarRecaza(f.estado, guardado.resultados) }, resultado: aplicables } : null;
  });
  if (!r) {
    console.log('No quedó nada para aplicar (ya estaba aplicado, o el bot cazó esos bloques). No se cambió nada.');
    process.exit(0);
  }
  // El costo, solo de lo que se aplicó ahora: aplicar dos veces no lo duplica.
  for (const x of guardado.resultados) {
    if (x.tokens && r.resultado.includes(x.bloque)) {
      await registrarUso(db, {
        servicio: 'entrevistador', paso: 'cazador_v3', modelo: MODELO_CAZADOR, proveedor: 'anthropic',
        cuenta: cuentaDeEsteServicio(), narradorId,
        uso: { input_tokens: x.tokens.entrada, output_tokens: x.tokens.salida },
      });
    }
  }
  console.log(`Aplicado (bloques ${r.resultado.join(', ')}): la cola de repreguntas tiene ${(r.fila.estado.repreguntas ?? []).length}. Salen de a una, intercaladas, en los próximos turnos.`);
}
