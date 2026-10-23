// La bienvenida de «Vitácora de una historia» y el SÍ (docs/historia/banco.md, «Arranque» y regla 1). Puro.
//
// La bienvenida es una de tres plantillas de Meta: BIEN-H (para uno mismo), BIEN-HR (regalo con tema) y BIEN-HR-A
// (regalo con el tema abierto). Las variables son las de banco.md: {{1}} cómo le dicen, {{2}} quién regala o la
// historia, {{3}} la historia. «La historia» es el tema en segunda persona («cuando te fuiste a vivir lejos»,
// temas.md, «En la pregunta»), como {{historia}} en HC1. Si el narrador escribe antes de que la bienvenida le haya
// llegado, sale como texto (la ventana está abierta), con las mismas variables.
//
// A lo que no es SÍ se le contesta una sola vez con los textos del arranque del regalo, ya aprobados en los tres
// idiomas (flujo/regalo-textos.ts: `noEntendi`, `noQuiere`); después, silencio y aviso a los socios.

import type { CualPlantillaHistoria } from '../config.js';
import { ARRANQUE } from '../flujo/regalo-textos.js';
import { mensajePorId, nombreDelTema } from './nucleo/entrevista/banco.js';
import { renderizar } from './nucleo/entrevista/texto.js';
import { fichaTexto, type FilaHistoria } from './tipos.js';

/**
 * "sí" / "no" cortos, sin acentos ni signos. Copia de `leerSiNo` de flujo/procesar.ts (que no se importa: carga la
 * base al importarse): «Sii», «Dale», «Ok», «Claro», «D'acord», «Som-hi», «Vale»… son sí.
 */
export function leerSiNo(texto: string): 'si' | 'no' | null {
  const limpio = texto.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, ' ').trim();
  if (!limpio || limpio.split(/\s+/).length > 6) return null;
  if (/^(si+|dale|bueno|ok|okey|oka|claro|de acuerdo|va|vamos|vale|listo|perfecto|obvio|de una|empecemos|arranquemos|empezemos|si dale|si claro|si bueno|si vamos|bueno dale|dale si|d acord|som hi|endavant|vinga|comencem|venga)\b/.test(limpio)) return 'si';
  if (/^(no|ahora no|manana|mañana|despues|mas tarde|hoy no|no gracias|ara no|dema|despres|mes tard|avui no)\b/.test(limpio)) return 'no';
  return null;
}

export type Bienvenida = {
  /** El mensaje del banco: BIEN-H, BIEN-HR o BIEN-HR-A. */
  id: 'BIEN-H' | 'BIEN-HR' | 'BIEN-HR-A';
  /** La plantilla de Meta (PLANTILLAS_HISTORIA). */
  plantilla: Extract<CualPlantillaHistoria, 'bienvenida' | 'bienvenida_regalo' | 'bienvenida_regalo_abierta'>;
  /** {{1}}, {{2}}, {{3}} de la plantilla, en orden. */
  variables: string[];
};

/** Cuál bienvenida le toca: regalo (hay quién regala) con o sin tema abierto, o para uno mismo. */
export function bienvenidaDe(fila: Pick<FilaHistoria, 'ficha' | 'idioma' | 'estado'>): Bienvenida {
  const historia = nombreDelTema(fila.ficha.tema, fila.idioma);
  const quien = fila.ficha.quienRegala?.trim();
  if (!quien) return { id: 'BIEN-H', plantilla: 'bienvenida', variables: [fila.ficha.nombre, historia] };
  if (fila.estado.temaAbierto) return { id: 'BIEN-HR-A', plantilla: 'bienvenida_regalo_abierta', variables: [fila.ficha.nombre, quien] };
  return { id: 'BIEN-HR', plantilla: 'bienvenida_regalo', variables: [fila.ficha.nombre, quien, historia] };
}

/** La bienvenida como texto: el mensaje del banco con {{1}}, {{2}} y {{3}} llenos (las variables van una sola vez). */
export function textoDeBienvenida(fila: Pick<FilaHistoria, 'ficha' | 'idioma' | 'estado'>): string {
  const b = bienvenidaDe(fila);
  const m = mensajePorId(b.id, fila.idioma);
  if (!m) throw new Error(`El banco de historia (${fila.idioma}) no tiene el mensaje ${b.id}.`);
  return m.texto.replace(/\{\{([123])\}\}/g, (marca, n: string) => b.variables[Number(n) - 1] ?? marca);
}

/** Lo que se le contesta, una sola vez, a lo que no es SÍ antes de arrancar. */
export function respuestaAntesDelSi(fila: Pick<FilaHistoria, 'ficha' | 'idioma'>, dijo: 'no' | null): string {
  const t = ARRANQUE[fila.idioma][dijo === 'no' ? 'noQuiere' : 'noEntendi'];
  return renderizar(t, fichaTexto(fila));
}
