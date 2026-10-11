// Vuelve a cazar los bloques cuya caza falló (11/10: la key de Anthropic del
// entrevistador en Railway estaba revocada). Dos pasos, como v3-pasar:
//
//   npm run v3-recazar -- <narradorId>
//       Prueba: lee la entrevista, corre el cazador sobre los bloques con error
//       (paga las llamadas a Anthropic con la key de entrevistador/.env), muestra
//       las repreguntas y las guarda en recazar-<id>.json. NO escribe en la base.
//
//   npm run v3-recazar -- <narradorId> --aplicar recazar-<id>.json
//       Suma esas repreguntas a la entrevista (compare-and-swap, sobre el estado
//       de ese momento) y anota el costo en consumo_ia. No vuelve a pagar.
//
// Nunca imprime keys.

import { readFileSync, writeFileSync } from 'node:fs';
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
const { aplicarRecaza, bloquesConError, sinErrores } = await import('../src/v3/recazar.js');

type Resultado = Awaited<ReturnType<typeof cazarAlCerrar>>;

const [narradorId, ...resto] = process.argv.slice(2);
const iAplicar = resto.indexOf('--aplicar');
if (!narradorId) {
  console.error('Uso: npm run v3-recazar -- <narradorId> [--aplicar recazar-<id>.json]');
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
  let e = sinErrores(fila.estado, bloques);
  const resultados: Resultado[] = [];
  for (const b of bloques) {
    const r = await cazarAlCerrar(e, ficha, b, cliente);
    if (r.error) {
      console.error(`Bloque ${b}: falló otra vez (${r.error}). Corto acá, sin guardar nada.`);
      process.exit(1);
    }
    resultados.push(r);
    e = sumarCaza(e, r);
    console.log(`── Bloque ${b}: ${r.repreguntas.length} repregunta(s), USD ${r.costoUsd.toFixed(3)}${r.motivo ? ` (${r.motivo})` : ''}`);
    for (const rp of r.repreguntas) console.log(`   · «${rp.cita}»\n     → ${rp.pregunta}`);
  }
  const total = resultados.reduce((s, r) => s + r.costoUsd, 0);
  const salida = `recazar-${narradorId.slice(0, 8)}.json`;
  writeFileSync(salida, JSON.stringify({ narradorId, resultados }, null, 2));
  console.log(`\nTotal: ${resultados.reduce((s, r) => s + r.repreguntas.length, 0)} repregunta(s), USD ${total.toFixed(2)}.`);
  console.log(`Guardado en ${salida}. No se cambió nada en la base. Para aplicarlo: npm run v3-recazar -- ${narradorId} --aplicar ${salida}`);
} else {
  const archivo = resto[iAplicar + 1];
  const guardado = JSON.parse(readFileSync(archivo, 'utf8')) as { narradorId: string; resultados: Resultado[] };
  if (guardado.narradorId !== narradorId) {
    console.error('El archivo es de otro narrador.');
    process.exit(1);
  }
  const r = await conReintento(db, narradorId, (f) => ({ cambio: { estado: aplicarRecaza(f.estado, guardado.resultados) }, resultado: true }));
  if (!r) {
    console.error('No pude escribir la entrevista (cambió demasiadas veces seguidas). Probá de nuevo.');
    process.exit(1);
  }
  for (const x of guardado.resultados) {
    if (x.tokens) {
      await registrarUso(db, {
        servicio: 'entrevistador', paso: 'cazador_v3', modelo: MODELO_CAZADOR, proveedor: 'anthropic',
        cuenta: cuentaDeEsteServicio(), narradorId,
        uso: { input_tokens: x.tokens.entrada, output_tokens: x.tokens.salida },
      });
    }
  }
  console.log(`Aplicado: la cola de repreguntas tiene ${(r.fila.estado.repreguntas ?? []).length}. Salen de a una, intercaladas, en los próximos turnos.`);
}
