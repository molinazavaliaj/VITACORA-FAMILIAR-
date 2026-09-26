// El simulador del banco (propuesta P2 de docs/v3/diseno-v3.md): dada una
// ficha y un tamaño, qué preguntas le llegan a esa persona y con qué texto.
// Sin modelo: gates de la ficha, bandas de edad, sensibles, repeticiones por
// pareja e hijo, singular/plural y género. Todo puro.
//
// Un gate que la ficha no resuelve (vacío o 'no-sabe') se pregunta con la
// pregunta de datos al abrir el bloque (`datosQueFaltan`). Acá no se sabe qué
// va a contestar, así que la pregunta con ese gate NO se cuenta: el simulador
// muestra lo que le llega con la ficha tal como está.

import { BANCO, entraEnTamanio, type PreguntaBanco, type Clase } from './banco.js';
import { edadActual, estado, lista, valor, type FichaV3, type Pareja } from './ficha.js';

export type Sujeto = `pareja:${number}` | `hijo:${number}` | `oficio:${number}`;

export type PreguntaInstanciada = {
  clave: string; // única dentro de la lista: preguntaId o preguntaId#sujeto
  preguntaId: string;
  bloque: number;
  clase: Clase;
  tamanio: PreguntaBanco['tamanio'];
  sensible: boolean;
  texto: string;
  sujeto?: Sujeto;
};

export type OpcionesSeleccion = { anioActual?: number };

const ANIO_POR_DEFECTO = new Date().getFullYear();

/** Corte de edad de la regla de etapas (E-joven) y de LE6. */
export const EDAD_JOVEN = 45;

// ---------------------------------------------------------------- gates

/** true / false si la ficha lo resuelve; null si falta el dato. */
export function resolverGate(ficha: FichaV3, gate: string): boolean | null {
  const deEstado = (v: unknown): boolean | null => {
    const e = estado(v);
    return e === 'lleno' ? true : e === 'no-tiene' ? false : null;
  };
  const padres = valor(ficha.padres);
  const estudios = valor(ficha.estudios);
  switch (gate) {
    case 'APODO':
      return !!ficha.apodo && ficha.apodo.trim().toLowerCase() !== ficha.nombre.trim().toLowerCase();
    case 'HERMANOS': return deEstado(ficha.hermanos);
    case 'RELIGION': return deEstado(ficha.religion);
    case 'ESTUDIOS': return deEstado(ficha.estudios);
    case 'ESTUDIOS_TERMINADOS':
      return estudios ? estudios.terminado === true : deEstado(ficha.estudios) === false ? false : null;
    case 'ESTUDIOS_SIN_TERMINAR':
      return estudios ? estudios.terminado === false : deEstado(ficha.estudios) === false ? false : null;
    case 'MILITAR': return deEstado(ficha.militar);
    case 'MIGRACION': return deEstado(ficha.migracion);
    case 'CAMPO': return deEstado(ficha.campo);
    case 'PAREJA': return deEstado(ficha.parejas);
    case 'OFICIO_AFUERA': {
      const e = estado(ficha.oficios);
      if (e === 'lleno') return lista(ficha.oficios).some((o) => !o.casa);
      return e === 'no-tiene' ? false : null;
    }
    case 'JUBILADO': return deEstado(ficha.dejoDeTrabajar);
    case 'HIJOS': return deEstado(ficha.hijos);
    case 'HIJOS_MAS_DE_4': return deEstado(ficha.hijos) === null ? null : lista(ficha.hijos).length > 4;
    case 'NIETOS': return deEstado(ficha.nietos);
    case 'NIETOS_A_CARGO': return deEstado(ficha.nietosACargo);
    case 'MADRE_FALLECIO': return padres?.madre?.vive === undefined ? null : padres.madre.vive === false;
    case 'PADRE_FALLECIO': return padres?.padre?.vive === undefined ? null : padres.padre.vive === false;
    case 'PERSONA_IMPORTANTE': return deEstado(ficha.personaImportante);
    case 'ENFERMEDAD_LARGA': return deEstado(ficha.enfermedadLarga);
    case 'MUDANZA': return true; // sin pregunta de datos: LU2 va en genérico
    default: return null; // PAREJA_TERMINO / PAREJA_FALLECIO / PAREJA_ACTUAL / HIJO_FALLECIO: por sujeto
  }
}

/**
 * Las preguntas de datos (banco: "Preguntas de datos") que se mandarían al
 * abrir cada bloque porque la ficha no trae el dato. En orden de bloque.
 */
export function datosQueFaltan(ficha: FichaV3, opciones: OpcionesSeleccion = {}): string[] {
  const edad = edadActual(ficha, opciones.anioActual ?? ANIO_POR_DEFECTO);
  const padres = valor(ficha.padres);
  const faltan: string[] = [];
  if (!padres?.madre?.nombre || !padres?.padre?.nombre) faltan.push('D1');
  if (padres?.madre?.vive === undefined) faltan.push('D1.1');
  if (padres?.padre?.vive === undefined) faltan.push('D1.2');
  const sinDato = (gate: string) => resolverGate(ficha, gate) === null;
  if (sinDato('HERMANOS')) faltan.push('D2');
  if (sinDato('RELIGION')) faltan.push('D3');
  if (sinDato('ESTUDIOS')) faltan.push('D4');
  if (sinDato('MILITAR')) faltan.push('D5');
  if (sinDato('MIGRACION')) faltan.push('D6');
  if (sinDato('PAREJA')) faltan.push('D7');
  if (sinDato('OFICIO_AFUERA')) faltan.push('D8');
  if (edad >= 45 && sinDato('JUBILADO')) faltan.push('D9');
  if (sinDato('CAMPO')) faltan.push('D10');
  if (sinDato('HIJOS')) faltan.push('D11');
  if (sinDato('NIETOS')) faltan.push('D12');
  if (resolverGate(ficha, 'NIETOS') === true && sinDato('NIETOS_A_CARGO')) faltan.push('D13');
  return faltan;
}

// ---------------------------------------------------------------- texto

/** "Pablo", "Pablo y Ana", "Pablo, Ana y Juli". */
export function unirNombres(nombres: string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? '';
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

type Contexto = { sujeto?: Sujeto; pareja?: Pareja };

function campos(ficha: FichaV3, ctx: Contexto): Record<string, string | undefined> {
  const padres = valor(ficha.padres);
  const parejas = lista(ficha.parejas);
  const hijos = lista(ficha.hijos);
  const oficios = lista(ficha.oficios);
  const migracion = valor(ficha.migracion);
  const nSujeto = ctx.sujeto ? Number(ctx.sujeto.split(':')[1]) : null;
  const hijoSujeto = ctx.sujeto?.startsWith('hijo:') && nSujeto ? hijos[nSujeto - 1]?.nombre : undefined;
  const principal = oficios.find((o) => !o.casa) ?? oficios[0];
  const lleno = (v: string[]) => (v.length ? unirNombres(v) : undefined);
  return {
    nombre: ficha.nombre,
    apodo: ficha.apodo,
    madre: padres?.madre?.nombre,
    padre: padres?.padre?.nombre,
    hermanos: lleno(lista(ficha.hermanos)),
    ciudad_infancia: ficha.ciudadInfancia,
    lugar_origen: migracion?.de,
    lugar_destino: migracion?.a,
    pareja_1: ctx.pareja?.nombre ?? parejas[0]?.nombre,
    pareja_2: parejas[1]?.nombre,
    pareja_actual: parejas.find((p) => p.actual)?.nombre,
    parejas: lleno(parejas.map((p) => p.nombre)),
    hijos: lleno(hijos.map((h) => h.nombre)),
    hijo_n: hijoSujeto,
    hijo_fallecido: hijoSujeto,
    nietos: lleno(lista(ficha.nietos)),
    nieto_a_cargo: lleno(lista(ficha.nietosACargo)),
    trabajo_principal: principal?.nombre,
    persona_importante: valor(ficha.personaImportante)?.nombre,
    enfermedad: valor(ficha.enfermedadLarga)?.nombre,
    destinatarios: ficha.destinatarios,
  };
}

function cuantosEn(segmento: string, ficha: FichaV3): number {
  if (segmento.includes('{{hermanos}}')) return lista(ficha.hermanos).length;
  if (segmento.includes('{{hijos}}')) return lista(ficha.hijos).length;
  if (segmento.includes('{{nietos}}')) return lista(ficha.nietos).length;
  return 2;
}

/**
 * Llena un texto del banco con la ficha (notación de banco-v3.md):
 * «pl: … ‖ sg: …», {{o/a}}, ", {{madre}}," en aposición, {{campo}} [genérico].
 * Lo que no tiene dato ni genérico queda como {{campo}} (se ve en el reporte).
 */
export function renderizar(texto: string, ficha: FichaV3, ctx: Contexto, anioActual: number): string {
  const valores = campos(ficha, ctx);
  const varon = ficha.genero === 'varon' || (ficha.genero === 'otro' && ficha.formaTrato === 'masculino');
  const joven = edadActual(ficha, anioActual) < EDAD_JOVEN;
  let t = texto;

  // Notas del banco dentro de la celda: LE4 (sin nietos) y LE6 (menos de 45).
  if (!valores.nietos) t = t.replace(/ y en \{\{nietos\}\}/, '');
  t = t.replace(/\s*\(Sin nietos[^)]*\)/, '');
  const variante = /\s*\(Menos de 45 años: "([^"]+)"\)/.exec(t);
  if (variante) {
    t = t.replace(variante[0], '');
    if (joven) t = t.replace(/¿Cómo te gustaría que te recuerden\?/, variante[1]);
  }

  // Singular / plural.
  t = t.replace(/«pl: (.*?) ‖ sg: (.*?)»/g, (_m, pl: string, sg: string) => (cuantosEn(pl + sg, ficha) > 1 ? pl : sg));
  // Género del narrador.
  t = t.replace(/\{\{([^{}/]+)\/([^{}/]+)\}\}/g, (_m, m: string, f: string) => (varon ? m : f));
  // Genérico entre corchetes; contrae "a al" y "de del".
  t = t.replace(/(\b\w+ )?\{\{(\w+)\}\} \[([^\]]+)\]/g, (_m, antes: string | undefined, campo: string, generico: string) => {
    const v = valores[campo];
    if (v) return `${antes ?? ''}${v}`;
    const previa = (antes ?? '').trim();
    if ((previa === 'a' && generico.startsWith('al ')) || (previa === 'de' && generico.startsWith('del '))) return generico;
    return `${antes ?? ''}${generico}`;
  });
  // Aposición: ", {{madre}}" sin dato se borra con su coma.
  t = t.replace(/, \{\{(\w+)\}\}(?=[,:?.])/g, (m, campo: string) => (valores[campo] ? `, ${valores[campo]}` : ''));
  // El resto.
  t = t.replace(/\{\{(\w+)\}\}/g, (m, campo: string) => valores[campo] ?? m);
  return t;
}

// ---------------------------------------------------------------- selección

const REPITE_POR_PAREJA = new Set(['AM1', 'AM2', 'AM3', 'AM4', 'AM5', 'AM6', 'AM7', 'AM8']);
const SEPARACION = new Set(['AM9', 'AM9b', 'AM10']);
const FALLECIMIENTO = new Set(['AM11', 'AM12']);

/**
 * Lista ordenada de preguntas (historia, puertas y válvulas) que recibe esa
 * persona en ese tamaño. Orden: bloque a bloque; dentro del bloque, el del
 * banco con las repeticiones por pareja e hijo en su lugar; cierra la puerta
 * y después la válvula (solo Estándar y Completo).
 */
export function preguntasPara(ficha: FichaV3, tamanio: 'B' | 'E' | 'C', opciones: OpcionesSeleccion = {}): PreguntaInstanciada[] {
  const anioActual = opciones.anioActual ?? ANIO_POR_DEFECTO;
  const edad = edadActual(ficha, anioActual);
  const joven = edad < EDAD_JOVEN;
  const excluidas = new Set(ficha.noTocar?.preguntas ?? []);
  const bloquesExcluidos = new Set(ficha.noTocar?.bloques ?? []);
  const parejas = lista(ficha.parejas);
  const hijos = lista(ficha.hijos);
  const oficios = lista(ficha.oficios);

  const pasa = (p: PreguntaBanco): boolean => {
    if (excluidas.has(p.id) || bloquesExcluidos.has(p.bloque)) return false;
    if (p.clase !== 'historia') return tamanio !== 'B';
    if (!entraEnTamanio(p, tamanio, joven)) return false;
    if (p.edadMin !== null && edad < p.edadMin) return false;
    if (p.gate && !['PAREJA_TERMINO', 'PAREJA_FALLECIO', 'PAREJA_ACTUAL', 'HIJO_FALLECIO'].includes(p.gate)) {
      const r = resolverGate(ficha, p.gate);
      if (r === null) return false; // sin dato: no se manda (y las sensibles nunca en genérico)
      if (r === p.gateNegado) return false;
    }
    return true;
  };

  const salida: PreguntaInstanciada[] = [];
  const agregar = (p: PreguntaBanco, sujeto?: Sujeto, ctx: Contexto = {}, prefijo = '') => {
    const texto = prefijo + renderizar(p.texto, ficha, { ...ctx, sujeto }, anioActual);
    salida.push({
      clave: sujeto ? `${p.id}#${sujeto}` : p.id,
      preguntaId: p.id, bloque: p.bloque, clase: p.clase, tamanio: p.tamanio, sensible: p.sensible, texto,
      ...(sujeto ? { sujeto } : {}),
    });
  };

  for (let bloque = 1; bloque <= 15; bloque++) {
    const delBloque = BANCO.filter((p) => p.bloque === bloque && pasa(p));

    if (bloque === 6) {
      agregarAmor(delBloque, parejas, agregar);
      continue;
    }
    for (const p of delBloque) {
      if (p.repite === 'hijo') {
        const cuales = p.id === 'HI3' && hijos.length > 4 ? [0, hijos.length - 1] : hijos.map((_h, i) => i);
        for (const i of cuales) agregar(p, `hijo:${i + 1}`);
      } else if (p.gate === 'HIJO_FALLECIO') {
        hijos.forEach((h, i) => h.fallecio && agregar(p, `hijo:${i + 1}`));
      } else if (p.id === 'TR2' && oficios.length) {
        agregar(p, 'oficio:1');
      } else {
        agregar(p);
      }
    }
  }
  return salida;
}

/**
 * Bloque 6: AM1–AM8 (+ CS3 solo la primera) por cada una de las dos primeras
 * parejas, cada una seguida de su cierre (AM9–AM10 si se separaron, AM11–AM12
 * si falleció); después AM13 para la actual y el resto del bloque.
 */
function agregarAmor(
  delBloque: PreguntaBanco[],
  parejas: Pareja[],
  agregar: (p: PreguntaBanco, sujeto?: Sujeto, ctx?: Contexto, prefijo?: string) => void,
): void {
  const porPareja = delBloque.filter((p) => REPITE_POR_PAREJA.has(p.id) || p.id === 'CS3' || SEPARACION.has(p.id) || FALLECIMIENTO.has(p.id));
  parejas.slice(0, 2).forEach((pareja, i) => {
    const sujeto: Sujeto = `pareja:${i + 1}`;
    const prefijo = i === 0 ? '' : `Ahora sobre ${pareja.nombre}: `;
    for (const p of porPareja) {
      if (p.id === 'CS3' && i > 0) continue;
      if (SEPARACION.has(p.id) && pareja.fin !== 'separacion') continue;
      if (FALLECIMIENTO.has(p.id) && pareja.fin !== 'fallecio') continue;
      agregar(p, sujeto, { pareja }, REPITE_POR_PAREJA.has(p.id) ? prefijo : '');
    }
  });
  for (const p of delBloque) {
    if (porPareja.includes(p)) continue;
    if (p.gate === 'PAREJA_ACTUAL') {
      const i = parejas.findIndex((x) => x.actual);
      if (i >= 0) agregar(p, `pareja:${i + 1}`, { pareja: parejas[i] });
      continue;
    }
    agregar(p);
  }
}
