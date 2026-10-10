// fabrica/src/escritor/controles/aplicar-repaso.ts
// Naza, 07/10/2026 (opción B): lo que el repaso de hechos encuentra después del arreglo ya no queda solo en el informe.
// Cada problema nuevo (C26, no los que oscilan ni los que van a disputa) trae la frase del libro y su corrección
// pegada al material; el código reemplaza la frase por la corrección cuando:
//   - la frase está tal cual en la pieza (si no, no se toca: el código nunca adivina dónde va),
//   - la corrección es una frase y no una indicación ("Dejar el párrafo como está…"),
//   - y no es mucho más larga que la frase (una corrección no agrega relato).
// No llama al modelo. Lo que se aplica lo pule después el corrector de estilo (paso 7), que corre a continuación.
// Lo salteado queda abierto en el informe, como antes.
import { leerJSON, type Carpeta } from '../carpeta.js';
import { salida } from '../lectura.js';
import { archivoDe } from '../texto.js';
import type { Json } from '../tipos.js';

const INDICACION = /^(dejar|sacar|borrar|mantener|cambiar|agregar|reemplazar|cerrar|poner|quitar|eliminar|reescribir|corregir|usar)\b/i;

export type ResultadoRepaso = { aplicados: Json[]; salteados: (Json & { motivo: string })[] };

export function aplicarRepaso(c: Carpeta): ResultadoRepaso {
  const res: ResultadoRepaso = { aplicados: [], salteados: [] };
  if (!c.existe('controles/repaso.json')) return res;
  const { nuevos = [] } = leerJSON(c, 'controles/repaso.json') as { nuevos?: Json[] };
  for (const x of nuevos) {
    const frase = String(x.frase || '').trim();
    const corr = String(x.correccion || '').trim();
    const archivo = salida(archivoDe(x.pieza));
    if (!frase || !c.existe(archivo)) { res.salteados.push({ ...x, motivo: 'sin frase o sin pieza' }); continue; }
    if (!corr || INDICACION.test(corr)) { res.salteados.push({ ...x, motivo: 'la corrección es una indicación, no una frase' }); continue; }
    if (corr.length > frase.length * 1.5 + 60) { res.salteados.push({ ...x, motivo: 'la corrección agrega demasiado' }); continue; }
    const texto = c.leer(archivo);
    if (!texto.includes(frase)) { res.salteados.push({ ...x, motivo: 'la frase no está tal cual en la pieza' }); continue; }
    c.escribir(archivo, texto.replace(frase, () => corr));
    res.aplicados.push(x);
  }
  c.escribir('controles/repaso-aplicado.json', JSON.stringify(res, null, 1));
  return res;
}
