// fabrica/src/escritor/orquestador/etapa-b.ts
// Etapa B (spec, decisión 4): las correcciones de la familia van a confirmado.xml (llegan a todos los
// pasos) y al registro con el modelo barato (tarea mecánica). C14 lo verifica; si falla, Opus rehace
// registro y plan. Sin correcciones, no se llama a ningún modelo.
//
// La Etapa B arranca SIEMPRE de la carpeta que dejó la Etapa A (carpeta-A.json): agregarConfirmados no es
// idempotente si las correcciones se pisan (una segunda vuelta con [A, B] sobre una carpeta que ya tiene [A]
// deja dos bloques, y C14 cuenta de más). Por eso, si el almacén tiene el snapshot A, etapaB vuelve x.c a ese
// estado antes de empezar (x.c es la misma carpeta: el llamador ve el resultado). Sin snapshot A (la Etapa A
// corrió en otro lado), usa la carpeta que recibe tal cual.
import { leerJSON, parseJSONTolerante } from '../carpeta.js';
import { controlar } from '../controles/correr.js';
import { aplicarCorreccion, validarPlanCorregido } from '../correccion.js';
import { TopeDeGasto } from '../ejecutor.js';
import { salida } from '../lectura.js';
import { llamadaCorreccion, llamadaCorreccionPlan } from '../llamadas/fabrica.js';
import { agregarConfirmados, type CorreccionFamilia } from '../material/a-carpeta.js';
import { cargarSnapshot, conReintentos, guardarSnapshot, type Contexto } from './contexto.js';

export type ResultadoEtapaB = { ok: true; corregido: 'nada' | 'barato' | 'opus' } | { ok: false; motivo: string };

async function terminar(x: Contexto, r: ResultadoEtapaB): Promise<ResultadoEtapaB> {
  await guardarSnapshot(x, 'B');
  return r;
}

/** El barato pasa las correcciones al plan (entero, mismos capítulos) y los controles del plan lo verifican. */
async function corregirPlanBarato(x: Contexto): Promise<boolean> {
  try {
    const texto = await x.ej.uno({ clave: 'B/correccion-plan', llamada: llamadaCorreccionPlan(x.c), json: true, rol: 'barato' });
    const plan = validarPlanCorregido(leerJSON(x.c, salida('plan.json')), parseJSONTolerante(texto));
    x.c.escribir(salida('plan.json'), JSON.stringify(plan, null, 1));
    const r = controlar(x.c, 'plan');
    x.log(`plan corregido (barato): ${r.resumen.split('\n')[0]}`);
    return r.codigo === 0;
  } catch (err) {
    if (err instanceof TopeDeGasto) throw err;
    x.log(`la corrección barata del plan no sirvió (${(err as Error).message}); rehace Opus`);
    return false;
  }
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
  const a = await cargarSnapshot(x.almacen, 'A');
  if (a) {
    for (const ruta of Object.keys(x.c.aObjeto())) x.c.borrar(ruta);
    for (const [ruta, texto] of Object.entries(a.aObjeto())) x.c.escribir(ruta, texto);
  }
  if (!agregarConfirmados(x.c, correcciones) && !correcciones.some((k) => k.texto.trim())) return terminar(x, { ok: true, corregido: 'nada' });
  try {
    const texto = await x.ej.uno({ clave: 'B/correccion-registro', llamada: llamadaCorreccion(x.c), json: true, rol: 'barato' });
    x.c.escribir(salida('registro.json'), JSON.stringify(aplicarCorreccion(leerJSON(x.c, salida('registro.json')), parseJSONTolerante(texto)), null, 1));
    const r = controlar(x.c, 'registro');
    x.log(`registro corregido (barato): ${r.resumen.split('\n')[0]}`);
    if (r.codigo === 0) {
      if (await corregirPlanBarato(x)) return terminar(x, { ok: true, corregido: 'barato' });
      // El plan lo rehace Opus (el registro corregido queda).
      x.c.borrar(salida('plan.json'));
      if (await conReintentos(x, 'plan', 'B/')) return terminar(x, { ok: true, corregido: 'opus' });
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
