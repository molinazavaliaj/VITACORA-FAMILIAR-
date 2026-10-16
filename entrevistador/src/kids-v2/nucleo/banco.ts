// El banco de Kids V2, tipado. `banco.json` lo genera scripts/kids-v2-json.ts
// desde docs/kids/v2/banco.md y mensajes.md (la fuente); un test chequea que
// esté al día.
//
// Otros idiomas: `banco-es-ES.json` sale de docs/kids/v2/idiomas/banco-es-ES.md
// y trae solo los textos, por ID. `bancoDe(idioma)` es el mismo banco (mismas
// preguntas, ramas, fotos, marcas y orden) con los textos de ese idioma.
//
// El motor razona siempre sobre BANCO (es-AR): sus reglas comparan los botones
// de banco.md. Lo que toca un chico de otro idioma se pasa a ese botón con
// `botonCanonico` (por ID: el K12-B1 de España es el K12-B1 de acá), y lo que
// sale se arma con `bancoDe(idioma)`.

import bancoJson from './banco.json' with { type: 'json' };
import bancoEsEsJson from './banco-es-ES.json' with { type: 'json' };
import type { IdMensaje } from './banco-md.js';
import { IDIOMA_POR_DEFECTO, nombrePlantilla, type IdiomaKids } from './idioma.js';
import type { BancoKids, Extra, MensajeFijo, Pregunta } from './tipos.js';

export type { IdMensaje } from './banco-md.js';

export const BANCO: BancoKids = bancoJson as BancoKids;

const PREGUNTAS = new Map(BANCO.preguntas.map((p) => [p.id, p]));
const MENSAJES = new Map(BANCO.mensajes.map((m) => [m.id, m]));
const EXTRAS = new Map(BANCO.extras.map((x) => [x.id, x]));

/** La principal con ese ID (K1…K47). Tira error si no existe. */
export function pregunta(id: string): Pregunta {
  const p = PREGUNTAS.get(id);
  if (!p) throw new Error(`El banco de kids no tiene la pregunta ${id}`);
  return p;
}

/** El mensaje fijo con ese ID. Tira error si no existe: nunca un mensaje vacío. */
export function fijo(id: IdMensaje): MensajeFijo {
  const m = MENSAJES.get(id);
  if (!m) throw new Error(`El banco de kids no tiene el mensaje ${id}`);
  return m;
}

export function extra(id: string): Extra {
  const x = EXTRAS.get(id);
  if (!x) throw new Error(`El banco de kids no tiene la extra ${id}`);
  return x;
}

// ── Los textos por ID (la notación de docs/kids/v2/idiomas/banco-es-ES.md) ───────────────────────────────

/** El botón genérico de pasar (banco.md: lo llevan todas las principales, las otras puertas y las extras sin foto). */
export const BOTON_PASO = 'Paso';

/** Un texto del banco con su ID. `boton`: es el título de un botón (lo que vuelve cuando el chico lo toca). */
export type Entrada = { id: string; texto: string; boton: boolean };

const idRamaPaso = (p: string, i: number, k: number) => `${p}-R${i + 1}${k > 0 ? `-${k + 1}` : ''}`;

/**
 * Todos los textos del banco, cada uno con su ID, en el orden de banco-es-ES.md: CAP-n, BOTON-PASO, y por cada
 * principal Kn, Kn-Bi (los botones de las ramas), Kn-Ri / Kn-Ri-2 (lo que pregunta la rama), Kn-BPASO (si no
 * es el genérico), Kn-OP, Kn-FOTO, Kn-FOTO-Bi, Kn-FOTO-NOTENGO; las extras Xc-n; los mensajes fijos y sus
 * botones (ID-Bi). Es la lista que tiene que tener cada archivo de idioma.
 */
export function entradasDelBanco(b: BancoKids = BANCO): Entrada[] {
  const es: Entrada[] = [];
  const t = (id: string, texto: string) => es.push({ id, texto, boton: false });
  const bt = (id: string, texto: string) => es.push({ id, texto, boton: true });
  for (const c of b.capitulos) t(`CAP-${c.n}`, c.titulo);
  bt('BOTON-PASO', b === BANCO ? BOTON_PASO : b.preguntas.find((p) => p.id === 'K1')!.botonPaso);
  for (const p of b.preguntas) {
    t(p.id, p.texto);
    p.ramas.forEach((r, i) => {
      bt(`${p.id}-B${i + 1}`, r.boton);
      if (r.accion.tipo === 'preguntar') r.accion.pasos.forEach((paso, k) => t(idRamaPaso(p.id, i, k), paso));
    });
    if (PREGUNTAS.get(p.id)!.botonPaso !== BOTON_PASO) bt(`${p.id}-BPASO`, p.botonPaso);
    if (p.op) t(`${p.id}-OP`, p.op.texto);
    if (p.foto) {
      t(`${p.id}-FOTO`, p.foto.texto);
      p.foto.botones.forEach((x, i) => bt(`${p.id}-FOTO-B${i + 1}`, x));
      if (p.foto.noTengo) t(`${p.id}-FOTO-NOTENGO`, p.foto.noTengo);
    }
  }
  for (const x of b.extras) t(x.id, x.texto);
  for (const m of b.mensajes) {
    t(m.id, m.texto);
    m.botones.forEach((x, i) => bt(`${m.id}-B${i + 1}`, x));
  }
  return es;
}

const TEXTOS_IDIOMA: Readonly<Record<Exclude<IdiomaKids, 'es-AR'>, Record<string, string>>> = {
  'es-ES': bancoEsEsJson as Record<string, string>,
};

/** El banco de banco.md con los textos de otro idioma. Si falta un ID, tira (nunca un texto en el idioma equivocado). */
export function armarBancoIdioma(textos: Readonly<Record<string, string>>, idioma: IdiomaKids): BancoKids {
  const de = (id: string): string => {
    const x = textos[id];
    if (x === undefined) throw new Error(`${idioma}: falta el texto de ${id}`);
    return x;
  };
  return {
    capitulos: BANCO.capitulos.map((c) => ({ ...c, titulo: de(`CAP-${c.n}`) })),
    preguntas: BANCO.preguntas.map((p): Pregunta => {
      const ramas = p.ramas.map((r, i) => ({
        boton: de(`${p.id}-B${i + 1}`),
        accion: r.accion.tipo === 'preguntar' ? { tipo: 'preguntar' as const, pasos: r.accion.pasos.map((_, k) => de(idRamaPaso(p.id, i, k))) } : r.accion,
      }));
      const iSolo = p.op?.soloRama ? p.ramas.findIndex((r) => r.boton === p.op!.soloRama) : -1;
      return {
        ...p,
        texto: de(p.id),
        ramas,
        botonPaso: p.botonPaso === BOTON_PASO ? de('BOTON-PASO') : de(`${p.id}-BPASO`),
        op: p.op ? { texto: de(`${p.id}-OP`), soloRama: iSolo < 0 ? null : ramas[iSolo].boton } : null,
        foto: p.foto
          ? { ...p.foto, texto: de(`${p.id}-FOTO`), botones: p.foto.botones.map((_, i) => de(`${p.id}-FOTO-B${i + 1}`)), noTengo: p.foto.noTengo ? de(`${p.id}-FOTO-NOTENGO`) : null }
          : null,
      };
    }),
    extras: BANCO.extras.map((x) => ({ ...x, texto: de(x.id) })),
    mensajes: BANCO.mensajes.map((m) => ({
      ...m,
      texto: de(m.id),
      botones: m.botones.map((_, i) => de(`${m.id}-B${i + 1}`)),
      plantilla: m.plantilla ? nombrePlantilla(m.plantilla, idioma) : null,
    })),
  };
}

type Armado = {
  banco: BancoKids;
  preguntas: Map<string, Pregunta>;
  mensajes: Map<string, MensajeFijo>;
  extras: Map<string, Extra>;
  /** Botón de este idioma → el de banco.md. */
  aCanonico: Map<string, string>;
  /** Botón de banco.md → el de este idioma. */
  deCanonico: Map<string, string>;
};

/**
 * Los botones de los dos idiomas, emparejados por ID. Tienen que ser una correspondencia uno a uno: si un
 * botón de España valiera por dos de acá (o al revés), no se sabría qué tocó el chico, y se frena.
 */
export function emparejarBotones(b: BancoKids, idioma: IdiomaKids): { aCanonico: Map<string, string>; deCanonico: Map<string, string> } {
  const aCanonico = new Map<string, string>();
  const deCanonico = new Map<string, string>();
  const propias = new Map(entradasDelBanco(b).map((e) => [e.id, e.texto]));
  for (const e of entradasDelBanco(BANCO)) {
    if (!e.boton) continue;
    const suyo = propias.get(e.id);
    if (suyo === undefined) throw new Error(`${idioma}: falta el botón ${e.id}`);
    const ya = aCanonico.get(suyo);
    if (ya !== undefined && ya !== e.texto) throw new Error(`${idioma}: el botón «${suyo}» vale por «${ya}» y por «${e.texto}» (${e.id}); no se sabría cuál tocó`);
    const vuelta = deCanonico.get(e.texto);
    if (vuelta !== undefined && vuelta !== suyo) throw new Error(`${idioma}: el botón «${e.texto}» (${e.id}) sale como «${vuelta}» y como «${suyo}»`);
    aCanonico.set(suyo, e.texto);
    deCanonico.set(e.texto, suyo);
  }
  return { aCanonico, deCanonico };
}

const ARMADOS = new Map<IdiomaKids, Armado>();

function armado(idioma: IdiomaKids): Armado {
  let a = ARMADOS.get(idioma);
  if (!a) {
    const banco = idioma === 'es-AR' ? BANCO : armarBancoIdioma(TEXTOS_IDIOMA[idioma], idioma);
    a = {
      banco,
      preguntas: new Map(banco.preguntas.map((p) => [p.id, p])),
      mensajes: new Map(banco.mensajes.map((m) => [m.id, m])),
      extras: new Map(banco.extras.map((x) => [x.id, x])),
      ...emparejarBotones(banco, idioma),
    };
    ARMADOS.set(idioma, a);
  }
  return a;
}

/** El banco entero en ese idioma (es-AR: BANCO). */
export function bancoDe(idioma: IdiomaKids = IDIOMA_POR_DEFECTO): BancoKids {
  return armado(idioma).banco;
}

/** La principal en ese idioma (mismo ID, mismas ramas y marcas; textos y botones del idioma). */
export function preguntaEn(id: string, idioma: IdiomaKids): Pregunta {
  const p = armado(idioma).preguntas.get(id);
  if (!p) throw new Error(`El banco de kids no tiene la pregunta ${id}`);
  return p;
}

export function fijoEn(id: IdMensaje, idioma: IdiomaKids): MensajeFijo {
  const m = armado(idioma).mensajes.get(id);
  if (!m) throw new Error(`El banco de kids no tiene el mensaje ${id}`);
  return m;
}

export function extraEn(id: string, idioma: IdiomaKids): Extra {
  const x = armado(idioma).extras.get(id);
  if (!x) throw new Error(`El banco de kids no tiene la extra ${id}`);
  return x;
}

/**
 * Lo que tocó el chico, como botón de banco.md (con el que razona el motor). Un texto que no es un botón de
 * su idioma queda como está: el motor lo ignora si no es lo que espera.
 */
export function botonCanonico(idioma: IdiomaKids, boton: string): string {
  if (idioma === 'es-AR') return boton;
  return armado(idioma).aCanonico.get(boton) ?? boton;
}

/** Un botón de banco.md ('Paso', 'No tengo', 'Esta la paso') en el idioma del chico. Tira si ese idioma no lo tiene. */
export function botonEn(idioma: IdiomaKids, canonico: string): string {
  if (idioma === 'es-AR') return canonico;
  const x = armado(idioma).deCanonico.get(canonico);
  if (x === undefined) throw new Error(`${idioma}: no hay botón para «${canonico}»`);
  return x;
}
