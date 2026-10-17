// Parser de docs/kids/v2/idiomas/banco-<idioma>.md → los textos de ese idioma, por ID. Lo usa
// scripts/kids-v2-json.ts para generar banco-<idioma>.json; un test compara el json commiteado contra este
// parseo (el md es la fuente: Naza aprueba ahí). Mismo molde que la Viaje V2 (src/viaje-v2/banco-idioma-md.ts).
//
// Formato: lo de antes de «## Textos» es la explicación (tiene tablas con « | » que no son textos) y lo de
// después de la línea `---` son notas; nada de eso se parsea. En el medio, una línea por texto:
//   ID | texto              (los saltos de párrafo, escritos como \n\n)
//
// Los IDs son los de banco.json más la notación de la cabecera del md (K12-B1, BOTON-PASO, CAP-1…): ver
// `entradasDelBanco` en banco.ts. Que estén todos (y que no sobre ninguno) lo chequea test/kids-v2-idiomas.test.ts.

const SALTO = /\\n/g;
const ID = /^[A-ZÑ0-9][A-ZÑ0-9-]*$/;

export function parsearTextosIdiomaKidsMd(md: string): Record<string, string> {
  const textos: Record<string, string> = {};
  let enTextos = false;
  for (const linea of md.split(/\r?\n/)) {
    if (!enTextos) {
      if (/^## Textos\s*$/.test(linea)) enTextos = true;
      continue;
    }
    if (/^---\s*$/.test(linea)) break;
    if (!linea.trim()) continue;
    const i = linea.indexOf(' | ');
    if (i < 0) throw new Error(`línea suelta (va "ID | texto"): "${linea.slice(0, 60)}"`);
    const id = linea.slice(0, i).trim();
    const texto = linea.slice(i + 3).trim().replace(SALTO, '\n');
    if (!ID.test(id)) throw new Error(`ID raro: "${id}"`);
    if (texto === '') throw new Error(`${id}: sin texto`);
    if (id in textos) throw new Error(`${id}: ID repetido en el archivo de idioma`);
    textos[id] = texto;
  }
  if (!enTextos) throw new Error('Falta la sección «## Textos»');
  return textos;
}
