// La ficha de la compra de Kids (mensajes.md §8, COMPRA-1 a COMPRA-3) y el
// guion efectivo que sale de ella: qué principales salen, en qué orden, con
// qué foto, y dónde van la "una más", los cierres, las preguntas del padre,
// las extras del final y el final. Puro.

import { BANCO, pregunta as preguntaDelBanco } from './banco.js';
import { esHora, NOCHE_DESDE, NOCHE_HASTA, zonaValida } from './horas.js';
import { MAX_PREGUNTAS_PADRE } from './reglas.js';
import { normalizarQuienRegala, type Genero } from './texto.js';
import type { Cap, Extra, Foto, Pregunta } from './tipos.js';

export type Canal = 'A' | 'B';

/** COMPRA-3-TEMAS, en el orden de la pantalla. */
export const TEMAS = ['mama', 'papa', 'abuelo-murio', 'ensamblada', 'mudanza', 'escuela'] as const;
export type Tema = (typeof TEMAS)[number];

/** Qué principal saca cada tema (mensajes.md §8). "escuela" solo saca una extra. */
export const PREGUNTA_DEL_TEMA: Record<Exclude<Tema, 'escuela'>, string> = {
  mama: 'K10',
  papa: 'K11',
  'abuelo-murio': 'K13',
  ensamblada: 'K18',
  mudanza: 'K38',
};

/** El tema de una extra: las de mamá y papá ("si el padre sacó el tema, sus extras tampoco salen") y la del mal momento en la escuela. */
export function temaDeExtra(x: Extra): Tema | null {
  if (x.texto.includes('tu mamá')) return 'mama';
  if (x.texto.includes('tu papá')) return 'papa';
  if (x.sacable) return 'escuela';
  return null;
}

/**
 * Una principal que nombra a mamá y papá y queda aunque se saque uno de los dos
 * temas (K18, Naza 05/10). Cada variante sale SOLO borrando palabras de la frase
 * aprobada en banco.md: nada de redacción nueva. Si la frase cambia en el banco,
 * un test avisa y textoSegunTemas tira error.
 */
export const BORRADOS_POR_TEMA: readonly { pregunta: string; frase: string; borrar: { mama: string; papa: string; ambos: string } }[] = [
  {
    pregunta: 'K18',
    frase: 'como la pareja de tu mamá o de tu papá, o alguien',
    // Lo que se borra de la frase: sin papá → "la pareja de tu mamá, o alguien"; sin mamá → "la pareja de tu papá, o alguien"; sin los dos → "como alguien".
    borrar: { papa: ' o de tu papá', mama: 'de tu mamá o ', ambos: 'la pareja de tu mamá o de tu papá, o ' },
  },
];

/** El texto de una principal según los temas sacados (solo borra; ver BORRADOS_POR_TEMA). */
export function textoSegunTemas(id: string, texto: string, temasSacados: readonly Tema[]): string {
  const b = BORRADOS_POR_TEMA.find((x) => x.pregunta === id);
  if (!b) return texto;
  const sinMama = temasSacados.includes('mama');
  const sinPapa = temasSacados.includes('papa');
  if (!sinMama && !sinPapa) return texto;
  if (!texto.includes(b.frase)) throw new Error(`${id}: en el banco ya no está la frase "${b.frase}" (revisar BORRADOS_POR_TEMA en compra.ts)`);
  const borrar = sinMama && sinPapa ? b.borrar.ambos : sinMama ? b.borrar.mama : b.borrar.papa;
  return texto.replace(b.frase, b.frase.replace(borrar, ''));
}

export type PreguntaPadre = { texto: string; conLinea: boolean };

export type Ficha = {
  /** Su nombre (tapa). */
  nombre: string;
  /** Cómo le dicen: {{1}} al chico y {{2}} en lo que le llega al padre (#31). */
  apodo: string;
  genero: Genero;
  edad: number;
  /** "tu mamá", "tus abuelos", "tu madrina"… (se guarda con "tu" en minúscula). */
  quienRegala: string;
  canal: Canal;
  /** Tu nombre (en el saludo va solo el primero). */
  nombrePadre: string;
  linkPanel: string;
  /** A qué hora le escribimos ('HH:MM'). Entre las 9:00 y las 21:59: nada de noche. */
  hora: string;
  /** Zona IANA del país del número. */
  zona: string;
  temasSacados: Tema[];
  fotosConOtrosChicos: boolean;
  /** Hasta 3. conLinea = false si marcó "sin decir que es mía". */
  preguntasPadre: PreguntaPadre[];
};

/** Valida y normaliza. Tira error con el nombre del campo. */
export function validarFicha(f: Ficha): Ficha {
  for (const campo of ['nombre', 'apodo', 'quienRegala', 'nombrePadre', 'linkPanel'] as const) {
    if (!f[campo] || !f[campo].trim()) throw new Error(`Ficha: falta ${campo}`);
  }
  if (f.genero !== 'chico' && f.genero !== 'chica') throw new Error('Ficha: genero es "chico" o "chica"');
  if (f.canal !== 'A' && f.canal !== 'B') throw new Error('Ficha: canal es "A" o "B"');
  if (!esHora(f.hora) || f.hora < NOCHE_HASTA || f.hora >= NOCHE_DESDE) throw new Error(`Ficha: hora ${f.hora} fuera de 09:00–21:59`);
  if (!zonaValida(f.zona)) throw new Error(`Ficha: zona desconocida ${f.zona}`);
  for (const t of f.temasSacados) if (!(TEMAS as readonly string[]).includes(t)) throw new Error(`Ficha: tema desconocido ${t}`);
  const preguntasPadre = f.preguntasPadre.map((p) => ({ texto: p.texto.trim(), conLinea: p.conLinea })).filter((p) => p.texto !== '');
  if (preguntasPadre.length > MAX_PREGUNTAS_PADRE) throw new Error(`Ficha: hasta ${MAX_PREGUNTAS_PADRE} preguntas del padre`);
  return {
    ...f,
    nombre: f.nombre.trim(),
    apodo: f.apodo.trim(),
    nombrePadre: f.nombrePadre.trim(),
    quienRegala: normalizarQuienRegala(f.quienRegala),
    temasSacados: [...new Set(f.temasSacados)],
    preguntasPadre,
  };
}

export type ItemGuion =
  /** fotoDe: de qué principal es la foto que sale pegada (la suya, o la de un tema sacado que se mudó acá). */
  | { tipo: 'principal'; clave: string; cap: Cap; fotoDe: string | null; primeraDelCap: boolean; ultimaDelCap: boolean }
  | { tipo: 'una-mas'; clave: string; cap: Cap }
  | { tipo: 'cierre'; clave: string; cap: Cap }
  | { tipo: 'padre'; clave: string; cap: Cap; n: number; texto: string; conLinea: boolean }
  | { tipo: 'extras'; clave: 'EXTRAS'; cap: Cap }
  | { tipo: 'final'; clave: 'FINAL'; cap: Cap };

/** Las principales que salen (sin las de temas sacados), con su foto: la de un tema sacado pasa a la siguiente del capítulo que no tenga. */
function principalesDelCap(cap: Cap, sacadas: ReadonlySet<string>): { pregunta: Pregunta; fotoDe: string | null }[] {
  const salen: { pregunta: Pregunta; fotoDe: string | null }[] = [];
  const huerfanas: string[] = [];
  for (const p of BANCO.preguntas.filter((x) => x.cap === cap)) {
    if (sacadas.has(p.id)) {
      if (p.foto) huerfanas.push(p.id);
      continue;
    }
    salen.push({ pregunta: p, fotoDe: p.foto ? p.id : (huerfanas.shift() ?? null) });
  }
  return salen;
}

export function armarGuion(f: Ficha): ItemGuion[] {
  const sacadas = new Set(f.temasSacados.filter((t): t is Exclude<Tema, 'escuela'> => t !== 'escuela').map((t) => PREGUNTA_DEL_TEMA[t]));
  const guion: ItemGuion[] = [];
  for (const cap of [1, 2, 3, 4, 5] as Cap[]) {
    const ps = principalesDelCap(cap, sacadas);
    ps.forEach(({ pregunta, fotoDe }, i) =>
      guion.push({ tipo: 'principal', clave: pregunta.id, cap, fotoDe, primeraDelCap: i === 0, ultimaDelCap: i === ps.length - 1 }),
    );
    if (cap < 5) {
      guion.push({ tipo: 'una-mas', clave: `UNA-MAS-${cap}`, cap });
      guion.push({ tipo: 'cierre', clave: `CIERRE-${cap}`, cap });
    }
    if (cap === 4) f.preguntasPadre.forEach((p, i) => guion.push({ tipo: 'padre', clave: `PADRE-${i + 1}`, cap: 4, n: i + 1, texto: p.texto, conLinea: p.conLinea }));
  }
  guion.push({ tipo: 'cierre', clave: 'CIERRE-FINAL', cap: 5 });
  guion.push({ tipo: 'extras', clave: 'EXTRAS', cap: 5 });
  guion.push({ tipo: 'final', clave: 'FINAL', cap: 5 });
  return guion;
}

/** La foto pegada de un item principal (o null). */
export function fotoDelItem(item: ItemGuion): Foto | null {
  return item.tipo === 'principal' && item.fotoDe ? preguntaDelBanco(item.fotoDe).foto : null;
}
