// Lo que comparten las tres etapas: la carpeta, el ejecutor, el almacén y los reintentos de registro y plan
// (workflow-libro.js, `conReintentos`: si ya está y pasa, no se rehace; si no, hasta 2 reintentos con el error).
// Una respuesta que no es JSON (ni en el pedido extra del ejecutor) cuenta como un intento fallido más: el
// reintento lleva ese error. El tope de gasto y los errores de la API no se atajan acá.
import { Carpeta } from '../carpeta.js';
import type { Almacen } from '../almacen/tipos.js';
import { controlar } from '../controles/correr.js';
import { ErrorJSON, type Ejecutor } from '../ejecutor.js';
import { salida } from '../lectura.js';
import { llamadaPlan, llamadaRegistro } from '../llamadas/armar.js';

export type Contexto = { c: Carpeta; ej: Ejecutor; almacen: Almacen; log: (s: string) => void; usarLote: boolean };
export type Etapa = 'A' | 'B' | 'C';

/** La carpeta entera al terminar una etapa: la siguiente arranca de acá (y un retomo también). */
export async function guardarSnapshot(x: Contexto, etapa: Etapa): Promise<void> {
  await x.almacen.escribir(`carpeta-${etapa}.json`, JSON.stringify(x.c.aObjeto()));
}

export async function cargarSnapshot(almacen: Almacen, etapa: Etapa): Promise<Carpeta | null> {
  const t = await almacen.leer(`carpeta-${etapa}.json`);
  return t === null ? null : new Carpeta(JSON.parse(t) as Record<string, string>);
}

export async function conReintentos(x: Contexto, paso: 'registro' | 'plan', prefijo: 'A/' | 'B/'): Promise<boolean> {
  const archivo = salida(paso === 'registro' ? 'registro.json' : 'plan.json');
  if (x.c.existe(archivo) && controlar(x.c, paso).codigo === 0) {
    x.log(`${paso}: ya estaba y pasa`);
    return true;
  }
  for (let i = 0; i <= 2; i++) {
    const error = i ? x.c.leer(`controles/${paso}.json`) : undefined;
    const llamada = paso === 'registro' ? llamadaRegistro(x.c, { error }) : llamadaPlan(x.c, { error });
    let texto: string;
    try {
      texto = await x.ej.uno({ clave: `${prefijo}${llamada.nombre}${i ? `#${i + 1}` : ''}`, llamada, json: true, maxTokens: 128000 });
    } catch (err) {
      if (!(err instanceof ErrorJSON)) throw err;
      x.c.escribir(`controles/${paso}.json`, JSON.stringify([{ control: 'JSON', que: 'la respuesta no es un JSON válido (no parsea): devolvé solo el JSON pedido' }], null, 1));
      x.log(`${paso}: ${err.message}`);
      continue;
    }
    x.c.escribir(archivo, texto);
    const r = controlar(x.c, paso);
    x.log(`${paso}: ${r.resumen.split('\n')[0]}`);
    if (r.codigo === 0) return true;
  }
  return false;
}
