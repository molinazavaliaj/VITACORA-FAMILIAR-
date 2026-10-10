// Etapa A (spec): registro y plan (Opus, con sus controles y reintentos) y las dudas de datos para la
// familia. Después la familia revisa en el dashboard (eso es de Joaquín) y sigue la Etapa B.
import { leerJSON, parseJSONTolerante } from '../carpeta.js';
import { dudasDelRegistro, validarDudas, type DudaParaLaFamilia } from '../dudas.js';
import { TopeDeGasto } from '../ejecutor.js';
import { respuestas, salida } from '../lectura.js';
import { llamadaDudas } from '../llamadas/fabrica.js';
import { conReintentos, guardarSnapshot, type Contexto } from './contexto.js';

export type ResultadoEtapaA = { ok: true; capitulos: number; dudas: DudaParaLaFamilia[] } | { ok: false; motivo: string };

export async function etapaA(x: Contexto): Promise<ResultadoEtapaA> {
  // Lo pagado queda anotado aunque la etapa corte (reintentos agotados, tope, error de la API).
  try {
    return await etapaASinCostos(x);
  } finally {
    await x.ej.guardarCostos();
  }
}

async function etapaASinCostos(x: Contexto): Promise<ResultadoEtapaA> {
  if (!(await conReintentos(x, 'registro', 'A/'))) return { ok: false, motivo: 'el registro no pasa C14 después de 2 reintentos' };
  if (!(await conReintentos(x, 'plan', 'A/'))) return { ok: false, motivo: 'el plan no pasa C12/C13/C19/C20/C33 después de 2 reintentos' };
  const dudas = dudasDelRegistro(leerJSON(x.c, salida('registro.json')), respuestas(x.c));
  let paraFamilia: DudaParaLaFamilia[] = [];
  if (dudas.length) {
    const llamada = llamadaDudas(x.c, dudas);
    try {
      paraFamilia = validarDudas(dudas, parseJSONTolerante(await x.ej.uno({ clave: 'A/dudas', llamada, json: true })));
    } catch (err) {
      if (err instanceof TopeDeGasto) throw err;
      x.log(`dudas: ${(err as Error).message}; se piden otra vez`);
      try {
        paraFamilia = validarDudas(dudas, parseJSONTolerante(await x.ej.uno({ clave: 'A/dudas#2', llamada, json: true })));
      } catch (err2) {
        if (err2 instanceof TopeDeGasto) throw err2;
        return { ok: false, motivo: `las dudas para la familia no salieron: ${(err2 as Error).message}` };
      }
    }
  }
  const json = JSON.stringify({ dudas: paraFamilia }, null, 1);
  x.c.escribir(salida('dudas-familia.json'), json);
  await x.almacen.escribir('dudas-familia.json', json);
  await guardarSnapshot(x, 'A');
  return { ok: true, capitulos: leerJSON(x.c, salida('plan.json')).capitulos.length, dudas: paraFamilia };
}
