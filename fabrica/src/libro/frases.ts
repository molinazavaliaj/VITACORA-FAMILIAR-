// Por qué existe: el producto dejó de ser un audiolibro y pasó a ser las mejores frases del
// narrador en su voz (spec 2026-09-20-su-voz-design.md). Este módulo las elige **leyendo el libro
// que la fábrica ya escribió** —la sección «Sus frases» (sus dichos y los que heredó) y las citas
// que el escritor marcó con `>` en cada capítulo— y arma el `frases.json` que el worker corta y
// que la web muestra. No toca la base: vive en el paquete del narrador.
//
// Dos reglas que no se negocian:
//  1. **Solo entran citas textuales**: si el modelo pulió una frase, no hay audio que cortar.
//  2. **Las muletillas no se eligen**: «Viste.», «Pumba.» van impresas, no son cápsulas.
//
// Lo que NO hace: no corta audio (eso es del worker, sobre los audios reales) y no narra nada.
import type Anthropic from '@anthropic-ai/sdk';
import { extraerTexto, esPublicable, type ReservaDeRespuesta } from './comun.js';
import { parsearJsonTolerante } from '../voz/conectores.js';

/** Cuántas frases se imprimen por capítulo (decisión de Naza, 20/09). */
export const FRASES_POR_CAPITULO = 3;

export type MaterialDeFrase = {
  orden: number;
  respuestaId: string | null;
  /** El archivo real del que el worker va a cortar: sin esto no hay frase posible. */
  audioPath: string | null;
  texto: string;
  reserva?: Partial<ReservaDeRespuesta>;
};

export type CapituloDelLibro = { nombre: string; citas: string[] };

export type SeccionesDelLibro = {
  capitulos: CapituloDelLibro[];
  /** La página «Sus frases»: lo que él dice siempre y lo que le dejaron los suyos. */
  susFrases: { suyas: string[]; heredadas: string[] };
  muletillas: string[];
};

export type FraseCandidata = {
  id: string;
  texto: string;
  /** De dónde salió: la página «Sus frases» o una cita de un capítulo. */
  origen: 'sus-frases' | 'cita';
  /** `suyas` | `heredadas` cuando sale de la página. */
  grupo: 'suyas' | 'heredadas' | null;
  respuesta_id: string | null;
  pregunta_orden: number;
  por_que: string;
  elegida: boolean;
  elegida_por: 'modelo';
  /** `pendiente` hasta que el worker la corta y escribe `cortada`. */
  estado: 'pendiente';
  audio_path: null;
  segundos: null;
  inicio: null;
  fin: null;
};

export type CapituloConFrases = { numero: number; capitulo: string; candidatas: FraseCandidata[] };

export type FrasesJson = {
  version: 1;
  narrador_id: string;
  pedido_id: string;
  /** Cuándo la familia dio por buena la selección; la impresión espera esto (o los 15 días). */
  confirmado_at: string | null;
  capitulos: CapituloConFrases[];
};

const CRITERIOS = `Los criterios, en orden:
1. Es la que se repetiría en una mesa, años después.
2. Está en SU voz: un dato no es una frase ("nació en 1943" no sirve).
3. Se entiende sola, sin el resto de la historia.
4. No hiere a alguien que está vivo (nombres, peleas, plata).
5. Una por tema: dos veces lo mismo no entra.`;

const TITULOS_IGNORADOS = ['a mis lectores', 'el cierre', 'sus frases', 'indice', 'índice', 'colofon', 'colofón', 'contratapa'];

/** Un título de capítulo, en minúsculas y sin adornos, para comparar. */
function tituloLimpio(linea: string): string {
  return linea.replace(/^#+\s*/, '').replace(/\*/g, '').trim();
}

/**
 * Parte el libro en capítulos con sus citas y saca la página «Sus frases». Puro a propósito:
 * es la parte que más se rompe cuando cambia el markdown del libro, así que se testea sola.
 */
export function seccionesDelLibro(libroMarkdown: string): SeccionesDelLibro {
  const capitulos: CapituloDelLibro[] = [];
  const susFrases: SeccionesDelLibro['susFrases'] = { suyas: [], heredadas: [] };
  const muletillas: string[] = [];

  let capituloActual: CapituloDelLibro | null = null;
  let enSusFrases = false;
  let grupo: 'suyas' | 'heredadas' | 'muletillas' | null = null;

  for (const linea of libroMarkdown.split(/\r?\n/)) {
    const esTitulo = /^#{1,3}\s+\S/.test(linea);
    if (esTitulo) {
      const titulo = tituloLimpio(linea);
      const clave = titulo.toLowerCase();
      // Los subtítulos de la propia página («Las suyas», «Las que heredó», «Las muletillas de
      // siempre») NO son capítulos ni apagan la página: son los grupos de las frases.
      const subgrupo = /^las suyas/.test(clave)
        ? 'suyas'
        : /^las que hered/.test(clave)
          ? 'heredadas'
          : /^las muletillas/.test(clave)
            ? 'muletillas'
            : null;
      if (clave === 'sus frases') {
        enSusFrases = true;
        grupo = null;
        capituloActual = null;
        continue;
      }
      if (enSusFrases && subgrupo) {
        grupo = subgrupo;
        continue;
      }
      enSusFrases = false;
      grupo = null;
      if (TITULOS_IGNORADOS.includes(clave)) {
        capituloActual = null;
      } else {
        capituloActual = { nombre: titulo, citas: [] };
        capitulos.push(capituloActual);
      }
      continue;
    }

    if (enSusFrases) {
      for (const frase of linea.matchAll(/«([^»]{3,300})»/g)) {
        const texto = frase[1].trim();
        if (grupo === 'suyas') susFrases.suyas.push(texto);
        else if (grupo === 'heredadas') susFrases.heredadas.push(texto);
        else if (grupo === 'muletillas') muletillas.push(texto);
      }
      continue;
    }

    const cita = linea.match(/^\s*>\s*(.+)$/);
    if (cita && capituloActual) {
      const texto = cita[1].replace(/^["«]|["»]$/g, '').trim();
      if (texto.length > 0) capituloActual.citas.push(texto);
    }
  }

  return { capitulos, susFrases, muletillas };
}

/** Para comparar contra la transcripción: minúsculas, sin acentos, sin puntuación. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Una cita entra solo si está TAL CUAL en alguna transcripción (aunque cambien mayúsculas o
 * puntuación): el audio solo se puede cortar si él dijo exactamente eso.
 */
export function esTextual(cita: string, transcripciones: string[]): boolean {
  const limpia = normalizar(cita);
  if (limpia.length < 4) return false;
  return transcripciones.some((t) => normalizar(t).includes(limpia));
}

export const PROMPT_ELEGIR = (nombre: string, candidatas: string, capitulos: string) => `Sos el editor del libro de ${nombre}. Te paso las frases candidatas para que su familia las escuche en su voz, para siempre: primero las de la sección «Sus frases» del libro (las suyas y las que heredó) y después las citas de cada capítulo.
Elegí ${FRASES_POR_CAPITULO} por capítulo, ${FRASES_POR_CAPITULO * capitulos.split('\n').length} en total.
${CRITERIOS}
Reglas que no se rompen:
- TODAS las candidatas ya están verificadas como textuales (él las dijo así): podés elegirlas sin miedo.
- Las de «Sus frases» tienen prioridad: son las que dice de siempre o las que le dejaron los suyos.
- Cada elegida va al capítulo donde vive (las heredadas, al capítulo donde las cuenta).
- Las muletillas NO se eligen: van impresas, no son cápsulas para escuchar.
- No repitas tema entre capítulos.
Devolvé SOLO un JSON: {"elegidas":[{"id":"...","capitulo":1,"por_que":"una línea"}]} — el \`id\` que te paso entre corchetes y el número del capítulo.

CANDIDATAS:
${candidatas}

CAPÍTULOS (número: nombre):
${capitulos}`;

/** Una llamada al modelo, con el parseo tolerante y el respaldo que ya probamos en producción. */
async function llamar(cliente: Anthropic, contenido: string): Promise<unknown> {
  const pedir = async (extra: string): Promise<{ texto: string; stop: string | null }> => {
    const respuesta = await cliente.messages.create({
      model: 'claude-fable-5',
      // OJO: acá el pensamiento del modelo cuenta DENTRO de max_tokens. Con 2000 y el libro entero
      // se come el presupuesto pensando y devuelve texto vacío (medido el 20/09) — por eso 16000.
      max_tokens: 16000,
      messages: [{ role: 'user', content: `${contenido}${extra}` }],
    });
    return {
      texto: extraerTexto(respuesta.content as Array<{ type: string; text?: string }>),
      stop: respuesta.stop_reason ?? null,
    };
  };

  try {
    const primera = await pedir('');
    return parsearJsonTolerante(primera.texto);
  } catch (errPrimera) {
    // Un modelo que contesta en prosa (o que se quedó sin presupuesto) no puede tumbar la entrega
    // (misma regla que en el entrevistador, bitácora 14): una vez más con la orden pelada, y si
    // vuelve a fallar el libro sale sin frases en vez de romperse.
    const segunda = await pedir('\n\nSOLO el JSON, sin explicar nada: empezá con { y terminá con }.');
    try {
      return parsearJsonTolerante(segunda.texto);
    } catch (errSegunda) {
      console.warn(
        `Frases: el modelo no devolvió JSON (${(errSegunda as Error).message}; la primera vez: ` +
          `${(errPrimera as Error).message}; stop_reason: ${segunda.stop}). Dijo: «${segunda.texto.slice(0, 200)}». ` +
          'El libro sale sin frases.'
      );
      return {};
    }
  }
}

/**
 * La selección completa: arma las candidatas textuales del libro (página «Sus frases» + citas por
 * capítulo), le pide al modelo las de cada capítulo y devuelve el `frases.json`. Las que el modelo
 * elija se cruzan con el material del capítulo para saber de qué respuesta y de qué audio salen.
 */
export async function elegirFrases(
  cliente: Anthropic,
  args: {
    narradorId: string;
    pedidoId: string;
    nombre: string;
    libroMarkdown: string;
    capitulos: { numero: number; nombre: string; material: MaterialDeFrase[] }[];
  }
): Promise<FrasesJson> {
  const secciones = seccionesDelLibro(args.libroMarkdown);
  // El parser devuelve todo lo que parezca una sección, incluidos el título del libro, el
  // subtítulo y la contratapa: solo nos quedan los capítulos que la estructura conoce.
  const capítulosDelLibro = secciones.capitulos.filter((c) =>
    args.capitulos.some((capitulo) => normalizar(capitulo.nombre) === normalizar(c.nombre))
  );
  const transcripciones = args.capitulos.flatMap((c) =>
    c.material.filter((m) => esPublicable(m.reserva ?? {})).map((m) => m.texto)
  );

  // Candidatas: la página primero (con su grupo), las citas de cada capítulo después. Solo las
  // textuales: una frase que el modelo pulió no tiene audio que cortar.
  type Candidata = { id: string; texto: string; origen: 'sus-frases' | 'cita'; grupo: 'suyas' | 'heredadas' | null; numeroCapitulo: number };
  const candidatas: Candidata[] = [];
  const agregar = (texto: string, origen: Candidata['origen'], grupo: Candidata['grupo'], numeroCapitulo: number) => {
    if (!esTextual(texto, transcripciones)) return;
    if (candidatas.some((c) => normalizar(c.texto) === normalizar(texto))) return;
    candidatas.push({ id: `${origen === 'sus-frases' ? 'sf' : 'cita'}-${candidatas.length + 1}`, texto, origen, grupo, numeroCapitulo });
  };

  // La página «Sus frases» no dice en qué capítulo vive cada frase: eso lo decide el modelo.
  for (const texto of [...secciones.susFrases.suyas, ...secciones.susFrases.heredadas]) {
    agregar(texto, 'sus-frases', secciones.susFrases.suyas.includes(texto) ? 'suyas' : 'heredadas', 0);
  }
  for (const capitulo of capítulosDelLibro) {
    const numero = args.capitulos.find((c) => normalizar(c.nombre) === normalizar(capitulo.nombre))?.numero ?? 0;
    for (const texto of capitulo.citas) agregar(texto, 'cita', null, numero);
  }

  if (candidatas.length === 0) {
    return { version: 1, narrador_id: args.narradorId, pedido_id: args.pedidoId, confirmado_at: null, capitulos: [] };
  }

  const listadoCandidatas = candidatas
    .map((c) => `[${c.id}] (${c.origen}${c.grupo ? `/${c.grupo}` : ''}) «${c.texto}»`)
    .join('\n');
  const listadoCapitulos = args.capitulos.map((c) => `${c.numero}: ${c.nombre}`).join('\n');

  const crudo = (await llamar(cliente, PROMPT_ELEGIR(args.nombre, listadoCandidatas, listadoCapitulos))) as {
    elegidas?: { id?: unknown; capitulo?: unknown; por_que?: unknown }[];
  };

  // El capítulo de cada candidata: el que dijo el modelo si es válido, si no el de origen.
  const porCapitulo = new Map<number, FraseCandidata[]>();
  for (const elegida of crudo.elegidas ?? []) {
    const candidata = candidatas.find((c) => c.id === elegida.id);
    if (!candidata) continue;
    const numero = typeof elegida.capitulo === 'number' && args.capitulos.some((c) => c.numero === elegida.capitulo)
      ? elegida.capitulo
      : candidata.numeroCapitulo || args.capitulos[0]?.numero;
    if (!numero) continue;
    const yaTiene = porCapitulo.get(numero) ?? [];
    if (yaTiene.length >= FRASES_POR_CAPITULO) continue;
    const origen = args.capitulos.find((c) => c.numero === numero)?.material.find((m) => m.texto.includes(candidata.texto));
    yaTiene.push({
      id: `${candidata.id}`,
      texto: candidata.texto,
      origen: candidata.origen,
      grupo: candidata.grupo,
      respuesta_id: origen?.respuestaId ?? null,
      pregunta_orden: origen?.orden ?? 0,
      por_que: typeof elegida.por_que === 'string' ? elegida.por_que.trim() : '',
      elegida: true,
      elegida_por: 'modelo',
      estado: 'pendiente',
      audio_path: null,
      segundos: null,
      inicio: null,
      fin: null,
    });
    porCapitulo.set(numero, yaTiene);
  }

  // Las demás candidatas textuales del capítulo quedan como alternativas para el panel familiar.
  const capitulos: CapituloConFrases[] = args.capitulos.map((capitulo) => {
    const elegidas = porCapitulo.get(capitulo.numero) ?? [];
    const usadas = new Set(elegidas.map((e) => normalizar(e.texto)));
    const alternativas = candidatas
      .filter((c) => normalizar(c.texto) !== '' && !usadas.has(normalizar(c.texto)))
      .filter((c) => c.numeroCapitulo === capitulo.numero || c.origen === 'sus-frases')
      .slice(0, FRASES_POR_CAPITULO * 2)
      .map((c) => {
        const origen = capitulo.material.find((m) => m.texto.includes(c.texto));
        return {
          id: c.id,
          texto: c.texto,
          origen: c.origen,
          grupo: c.grupo,
          respuesta_id: origen?.respuestaId ?? null,
          pregunta_orden: origen?.orden ?? 0,
          por_que: '',
          elegida: false,
          elegida_por: 'modelo' as const,
          estado: 'pendiente' as const,
          audio_path: null,
          segundos: null,
          inicio: null,
          fin: null,
        };
      });
    return { numero: capitulo.numero, capitulo: capitulo.nombre, candidatas: [...elegidas, ...alternativas] };
  });

  return { version: 1, narrador_id: args.narradorId, pedido_id: args.pedidoId, confirmado_at: null, capitulos };
}
