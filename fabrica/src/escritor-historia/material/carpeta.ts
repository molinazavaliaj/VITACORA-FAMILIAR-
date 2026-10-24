// El material de una historia en la Carpeta del escritor, con las rutas de Familiar (así corren sus controles, su
// ejecutor y su armado sin tocarlos): entradas/ficha.xml, entradas/respuestas.xml (sin las «paso») y, propios de
// historia, entradas/material.json (tema, la historia en sus palabras, quién regala y todas las filas) y
// entradas/etiquetas.json (lo que quedó afuera por «paso»).
import { Carpeta, leerJSON } from '../../escritor/carpeta.js';
import { agregarConfirmados, type CorreccionFamilia } from '../../escritor/material/a-carpeta.js';
import { fichaHistoriaXml, materialDeHistoria, respuestasHistoriaXml } from './filas.js';
import type { EntrevistaHistoria, MaterialHistoria } from './tipos.js';

export const RUTA_MATERIAL = 'entradas/material.json';

export function carpetaDeHistoria(e: EntrevistaHistoria, o: { confirmados?: CorreccionFamilia[] } = {}): Carpeta {
  const m = materialDeHistoria(e);
  const c = new Carpeta();
  c.escribir(RUTA_MATERIAL, JSON.stringify(m, null, 1));
  c.escribir('entradas/ficha.xml', fichaHistoriaXml(e, m));
  c.escribir('entradas/respuestas.xml', respuestasHistoriaXml(m.filas));
  c.escribir('entradas/etiquetas.json', JSON.stringify(m.filas.map(({ id, clave, tramo, paso }) => ({ id, clave, ...(tramo ? { tramo } : {}), paso })), null, 1));
  if (o.confirmados?.length) agregarConfirmados(c, o.confirmados);
  return c;
}

export const materialDe = (c: Carpeta): MaterialHistoria => leerJSON(c, RUTA_MATERIAL) as MaterialHistoria;
