// Parser de docs/viajes-v2/idiomas/banco-<idioma>.md → los textos de ese
// idioma. Lo usa `scripts/viaje-v2-json.ts` para generar banco-<idioma>.json;
// un test compara el json commiteado contra este parseo.
//
// Formato (una línea por texto):
//   ID | texto
//   ID~viaje | texto            (la variante "ya de viaje" de las de antes de salir)
//   FORMATO-impreso | …         (los dos valores de {{formato}})
//   FORMATO-pdf | …
//   PLANTILLA-mensaje | …       (la plantilla de Meta; saltos como <br> o \n escrito)
//   ---                         (de acá para abajo son notas: se ignoran)
//
// Nada de estructura: los IDs, momentos y orden salen de banco.md. Que estén
// todos (y que no sobre ninguno) lo chequea test/viaje-v2-idiomas.test.ts.

export type TextosIdioma = {
  textos: Record<string, string>;
  yaDeViaje: Record<string, string>;
  formato: { impreso: string; pdf: string };
  /** Con saltos de línea reales. */
  plantillaMensaje: string;
};

const SALTO = /<br\s*\/?>|\\n/g;

export function parsearTextosIdiomaMd(md: string): TextosIdioma {
  const textos: Record<string, string> = {};
  const yaDeViaje: Record<string, string> = {};
  const formato: Partial<TextosIdioma['formato']> = {};
  let plantilla: string | undefined;

  for (const linea of md.split(/\r?\n/)) {
    if (/^---\s*$/.test(linea)) break;
    if (!linea.trim()) continue;
    const i = linea.indexOf(' | ');
    const sinTexto = /^\s*\S+\s*\|\s*$/.test(linea);
    if (i < 0 && !sinTexto) throw new Error(`línea suelta (va "ID | texto"): "${linea.slice(0, 60)}"`);
    const id = (i < 0 ? linea.slice(0, linea.indexOf('|')) : linea.slice(0, i)).trim();
    const texto = i < 0 ? '' : linea.slice(i + 3).trim();
    if (texto === '') throw new Error(`${id}: sin texto`);

    if (id === 'FORMATO-impreso' || id === 'FORMATO-pdf') {
      formato[id === 'FORMATO-impreso' ? 'impreso' : 'pdf'] = texto;
      continue;
    }
    if (id === 'PLANTILLA-mensaje') {
      plantilla = texto.replace(SALTO, '\n');
      continue;
    }
    const variante = id.endsWith('~viaje');
    const base = variante ? id.slice(0, -'~viaje'.length) : id;
    const destino = variante ? yaDeViaje : textos;
    if (base in destino) throw new Error(`${id}: ID repetido en el archivo de idioma`);
    destino[base] = texto;
  }

  if (!formato.impreso) throw new Error('Falta FORMATO-impreso');
  if (!formato.pdf) throw new Error('Falta FORMATO-pdf');
  if (plantilla === undefined) throw new Error('Falta PLANTILLA-mensaje');
  return { textos, yaDeViaje, formato: { impreso: formato.impreso, pdf: formato.pdf }, plantillaMensaje: plantilla };
}
