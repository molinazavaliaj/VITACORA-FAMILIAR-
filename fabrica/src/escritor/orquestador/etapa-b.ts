// fabrica/src/escritor/orquestador/etapa-b.ts
// Etapa B: las correcciones de la familia van a confirmado.xml (llegan a todos los pasos) y Opus rehace registro y plan
// con ellas. Naza 04/11: nada de modelo barato acá. En el libro de prueba de Juan Domingo, Haiku guardó «Ayacucho y
// Uriburu» sin pasarlo a ninguna entrada y el libro lo puso mal; ahorrar USD 1,50 no justifica un dato equivocado.
// Sin correcciones, no se llama a ningún modelo.
//
// La Etapa B arranca SIEMPRE de la carpeta que dejó la Etapa A (carpeta-A.json): agregarConfirmados no es
// idempotente si las correcciones se pisan (una segunda vuelta con [A, B] sobre una carpeta que ya tiene [A]
// deja dos bloques, y C14 cuenta de más). Por eso, si el almacén tiene el snapshot A, etapaB vuelve x.c a ese
// estado antes de empezar (x.c es la misma carpeta: el llamador ve el resultado). Sin snapshot A (la Etapa A
// corrió en otro lado), usa la carpeta que recibe tal cual.
import { salida } from '../lectura.js';
import { agregarConfirmados, type CorreccionFamilia } from '../material/a-carpeta.js';
import { cargarSnapshot, conReintentos, guardarSnapshot, type Contexto } from './contexto.js';

export type ResultadoEtapaB = { ok: true; corregido: 'nada' | 'opus' } | { ok: false; motivo: string };

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
  const a = await cargarSnapshot(x.almacen, 'A');
  if (a) {
    for (const ruta of Object.keys(x.c.aObjeto())) x.c.borrar(ruta);
    for (const [ruta, texto] of Object.entries(a.aObjeto())) x.c.escribir(ruta, texto);
  }
  if (!agregarConfirmados(x.c, correcciones) && !correcciones.some((k) => k.texto.trim())) return terminar(x, { ok: true, corregido: 'nada' });
  x.c.borrar(salida('registro.json'));
  x.c.borrar(salida('plan.json'));
  if (!(await conReintentos(x, 'registro', 'B/'))) return terminar(x, { ok: false, motivo: 'el registro no pasa C14 después de 2 reintentos (Etapa B)' });
  if (!(await conReintentos(x, 'plan', 'B/'))) return terminar(x, { ok: false, motivo: 'el plan no pasa sus controles después de 2 reintentos (Etapa B)' });
  return terminar(x, { ok: true, corregido: 'opus' });
}
