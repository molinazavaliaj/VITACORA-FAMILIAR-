// fabrica/src/escritor/orquestador/etapa-b.ts
// Etapa B (spec, decisión 4): las correcciones de la familia van a confirmado.xml (llegan a todos los
// pasos) y al registro con el modelo barato (tarea mecánica). C14 lo verifica; si falla, Opus rehace
// registro y plan. Sin correcciones, no se llama a ningún modelo.
import { leerJSON, parseJSONTolerante } from '../carpeta.js';
import { controlar } from '../controles/correr.js';
import { aplicarCorreccion } from '../correccion.js';
import { TopeDeGasto } from '../ejecutor.js';
import { salida } from '../lectura.js';
import { llamadaCorreccion } from '../llamadas/fabrica.js';
import { agregarConfirmados, type CorreccionFamilia } from '../material/a-carpeta.js';
import { conReintentos, guardarSnapshot, type Contexto } from './contexto.js';

export type ResultadoEtapaB = { ok: true; corregido: 'nada' | 'barato' | 'opus' } | { ok: false; motivo: string };

async function terminar(x: Contexto, r: ResultadoEtapaB): Promise<ResultadoEtapaB> {
  await guardarSnapshot(x, 'B');
  return r;
}

export async function etapaB(x: Contexto, correcciones: CorreccionFamilia[]): Promise<ResultadoEtapaB> {
  // Lo pagado queda anotado aunque la etapa corte (tope, error de la API); el snapshot, solo si la etapa termina.
  try {
    return await etapaBSinCostos(x, correcciones);
  } finally {
    await x.ej.guardarCostos();
  }
}

async function etapaBSinCostos(x: Contexto, correcciones: CorreccionFamilia[]): Promise<ResultadoEtapaB> {
  if (!agregarConfirmados(x.c, correcciones) && !correcciones.some((k) => k.texto.trim())) return terminar(x, { ok: true, corregido: 'nada' });
  try {
    const texto = await x.ej.uno({ clave: 'B/correccion-registro', llamada: llamadaCorreccion(x.c), json: true, rol: 'barato' });
    x.c.escribir(salida('registro.json'), JSON.stringify(aplicarCorreccion(leerJSON(x.c, salida('registro.json')), parseJSONTolerante(texto)), null, 1));
    const r = controlar(x.c, 'registro');
    x.log(`registro corregido (barato): ${r.resumen.split('\n')[0]}`);
    if (r.codigo === 0) {
      if (await conReintentos(x, 'plan', 'B/')) return terminar(x, { ok: true, corregido: 'barato' });
      return terminar(x, { ok: false, motivo: 'el plan no pasa sus controles con el registro corregido después de 2 reintentos' });
    }
  } catch (err) {
    if (err instanceof TopeDeGasto) throw err;
    x.log(`la corrección barata no sirvió (${(err as Error).message}); rehace Opus`);
  }
  x.c.borrar(salida('registro.json'));
  x.c.borrar(salida('plan.json'));
  if (!(await conReintentos(x, 'registro', 'B/'))) return terminar(x, { ok: false, motivo: 'el registro no pasa C14 después de 2 reintentos (Etapa B)' });
  if (!(await conReintentos(x, 'plan', 'B/'))) return terminar(x, { ok: false, motivo: 'el plan no pasa sus controles después de 2 reintentos (Etapa B)' });
  return terminar(x, { ok: true, corregido: 'opus' });
}
