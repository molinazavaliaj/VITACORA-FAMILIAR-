// Parser de los textos de la entrevista en otro idioma (docs/v3/entrevista/
// banco-ca.md; Naza, 04/10). Ese md tiene SOLO textos por ID: la estructura
// (orden, "depende de", botones y lo que vale cada uno, sensibles) sale
// siempre de banco.md, así no se puede desincronizar. Lo usa
// `scripts/v3-entrevista-json.ts` para generar banco-ca.json; un test compara.

import { MAX_LETRAS_BOTON } from './banco-md.js';

export type TextosIdioma = {
  /** Texto de cada pregunta del banco, por ID (con sus marcas: {{nombre}}, {{nen/nena}}, «sino:X: … ‖ …»). */
  preguntas: Record<string, string>;
  /** Los botones de cada pregunta, en el mismo orden que en banco.md. */
  botones: Record<string, string[]>;
  /** Mensajes fijos, entradas de bloque, M33 (la segunda oportunidad) y DD1/DD2. */
  mensajes: Record<string, string>;
  nombresBloque: Record<number, string>;
  /**
   * La repregunta del cazador: el mensaje con {cita} y {pregunta}, y su único
   * botón (en castellano viven en el código: cazador.ts y flujo.ts).
   */
  repregunta: { mensaje: string; boton: string };
};

const ID = /^[A-Z]{1,4}\d*(\.\d+)?b?$/;

function celdas(linea: string): string[] {
  return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/** `<br>` en una celda es un salto de línea en el mensaje (como en banco.md). */
function saltos(texto: string): string {
  return texto.replace(/<br>/g, '\n');
}

/**
 * Recorre el md: "## Bloques" (Bloque | Nombre), "## Preguntas" (ID | Texto),
 * "## Botones" (ID | N | Botón), "## Mensajes" (ID | Texto) y "## Repregunta
 * del cazador" (Qué | Texto, con las filas `mensaje` y `botón`). Tira error si
 * un ID se repite, si un botón pasa de 20 letras o si falta la repregunta.
 */
export function parsearTextosIdiomaMd(md: string): TextosIdioma {
  const t: TextosIdioma = { preguntas: {}, botones: {}, mensajes: {}, nombresBloque: {}, repregunta: { mensaje: '', boton: '' } };
  type Seccion = 'bloques' | 'preguntas' | 'botones' | 'mensajes' | 'repregunta';
  let seccion: Seccion | null = null;
  const secciones: Record<string, Seccion> = {
    Bloques: 'bloques',
    Preguntas: 'preguntas',
    Botones: 'botones',
    Mensajes: 'mensajes',
    'Repregunta del cazador': 'repregunta',
  };
  const poner = (dic: Record<string, string>, id: string, texto: string) => {
    if (id in dic) throw new Error(`${id}: está dos veces`);
    dic[id] = texto;
  };

  for (const linea of md.split(/\r?\n/)) {
    const s = /^## (.+)$/.exec(linea);
    if (s) {
      seccion = secciones[s[1].trim()] ?? null;
      continue;
    }
    if (!linea.startsWith('|') || seccion === null) continue;
    const c = celdas(linea);
    if (/^-+$/.test(c[0] ?? '') || ['ID', 'Bloque', 'Qué'].includes(c[0])) continue; // encabezado o separador

    if (seccion === 'bloques') {
      t.nombresBloque[Number(c[0])] = c[1];
    } else if (seccion === 'repregunta') {
      if (c[0] === 'mensaje') t.repregunta.mensaje = c[1];
      else if (c[0] === 'botón') t.repregunta.boton = c[1];
      else throw new Error(`Repregunta: fila desconocida "${c[0]}" (van mensaje y botón)`);
    } else {
      if (!ID.test(c[0])) throw new Error(`ID mal escrito: "${c[0]}"`);
      if (seccion === 'preguntas') poner(t.preguntas, c[0], c[1]);
      else if (seccion === 'mensajes') poner(t.mensajes, c[0], saltos(c[1]));
      else {
        const [id, n, texto] = c;
        if ([...texto].length > MAX_LETRAS_BOTON) throw new Error(`${id}: el botón "${texto}" tiene más de ${MAX_LETRAS_BOTON} letras`);
        const lista = (t.botones[id] ??= []);
        if (Number(n) !== lista.length + 1) throw new Error(`${id}: el botón ${n} está fuera de orden`);
        lista.push(texto);
      }
    }
  }
  if (!t.repregunta.mensaje.includes('{cita}') || !t.repregunta.mensaje.includes('{pregunta}')) throw new Error('Repregunta: el mensaje tiene que llevar {cita} y {pregunta}');
  if (!t.repregunta.boton || [...t.repregunta.boton].length > MAX_LETRAS_BOTON) throw new Error(`Repregunta: falta el botón o pasa de ${MAX_LETRAS_BOTON} letras`);
  return t;
}
