import type Anthropic from '@anthropic-ai/sdk';
import { armarEtapas, repartirEnEtapas, capitulosDeEtapas, ubicarSueltas, type Etapa, type EpocaDeRespuesta } from './etapas.js';
import { numerarRespuestas, materialRepartido } from './reparto.js';
import { escribirCapituloRepartido } from './escribir-capitulo.js';
import { escribirPaginas, armarLibro, controlarLibro } from './paginas.js';
import { medirRepeticion, type Medicion } from './medir-repeticion.js';
import { leerLibro, MODELO_LECTOR } from './lector.js';
import { calcularUsd, type Uso } from '../costos.js';
import type { Quien } from './encargo.js';
import type { InformeRevision } from './revision.js';

// El libro v2 de punta a punta, en UN lugar (biógrafo v2, Task 12): etapas de su vida → reparto de
// cada oración a su etapa → un capítulo por etapa → apertura, cierre y «Sus frases» → el control
// sin modelo → el lector final. Sin base ni Storage: recibe las respuestas ya leídas y devuelve
// todo en memoria. Existe para que el script de prueba y, al conectar, la fábrica corran EXACTAMENTE
// el mismo camino (antes el script tenía la cadena adentro y la fábrica iba a tener otra).

/** Quien escribe (etapas, reparto, capítulos, páginas). El lector es otro modelo, a propósito. */
const MODELO_ESCRITOR = 'claude-fable-5';

// Los precios salen de la tabla única de la fábrica (`costos.ts`, la de GASTOS.md): no se duplican.
const costo = (modelo: string, u: unknown) => calcularUsd(modelo, (u ?? {}) as Uso);

export type EntradaLibroV2 = {
  cliente: Anthropic; quien: Quien;
  respuestas: { orden: number; pregunta: string; texto: string; fuenteId: string }[];
  epocas: EpocaDeRespuesta[]; lineaDeTiempo?: string; nombresCorregidos: string; reservados: string[];
  /** Para escribir cada capítulo (inyectable en tests). */
  escribirCapitulo?: (quien: Quien, nombre: string, material: string, nombres: string) => Promise<{ texto: string; usage: unknown }>;
  alPaso?: (paso: string) => void;
  /** Cada capítulo apenas se escribió: para guardarlo ya (está pago) aunque después algo falle. */
  alCapitulo?: (indice: number, nombre: string, texto: string) => void | Promise<void>;
};

/** Lo que ya se hizo (y se pagó) hasta un momento dado. Un error de `armarLibroV2` lo trae adentro. */
export type ParcialLibroV2 = { salidas: Record<string, string>; capitulos: { nombre: string; texto: string }[]; gastoUsd: number };
export type ErrorLibroV2 = Error & ParcialLibroV2;

/** Lo que conviene leer del camino, además del libro: para el informe de la prueba. */
export type DetalleLibroV2 = {
  /** Oraciones que ubicó el modelo en el reparto. */
  movidas: number;
  /** Líneas del reparto que no se entendieron (no movieron nada). */
  ignoradas: string[];
  /** Oraciones de respuestas sin época que el modelo no ubicó (fueron con el resto de su respuesta, o a la reflexión). */
  sueltas: number;
  /** Oraciones que no quedaron en ningún material (por construcción no debería haber: se verifica igual). */
  afuera: string[];
  /** Frases que el editor propuso para «Sus frases» y no son textuales: se cayeron. */
  caidas: string[];
  /** Cuántas frases quedaron en «Sus frases», o null si el editor no devolvió algo legible. */
  frases: { suyas: number; heredadas: number; muletillas: number } | null;
  /** Cuántas oraciones hay en total (para el informe). */
  oraciones: number;
};

export type SalidaLibroV2 = {
  etapas: Etapa[]; capitulos: { nombre: string; texto: string }[]; materiales: string[];
  libroMarkdown: string | null; medicion: Medicion; informe: InformeRevision; salidas: Record<string, string>; gastoUsd: number;
  detalle: DetalleLibroV2;
  /** El texto tal cual lo devolvió el lector final: para guardarlo (si falló, es lo que dice por qué). */
  lectorCrudo: string;
};

/**
 * Arma el libro v2 entero. Si el modelo no devuelve etapas legibles tira (sin etapas no hay
 * capítulos); lo que el modelo devuelva mal después queda en el informe, que es lo que frena la
 * impresión. Cualquier error (el de las etapas, o la API que se cae en las páginas o el lector) sale
 * con lo ya hecho adentro (`ErrorLibroV2`: salidas, capítulos, gasto): esos capítulos ya se pagaron
 * y quien llama tiene que poder guardarlos.
 */
export async function armarLibroV2(e: EntradaLibroV2): Promise<SalidaLibroV2> {
  const parcial: ParcialLibroV2 = { salidas: {}, capitulos: [], gastoUsd: 0 };
  try {
    return await armar(e, parcial);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    throw Object.assign(error, parcial) as ErrorLibroV2;
  }
}

async function armar(e: EntradaLibroV2, parcial: ParcialLibroV2): Promise<SalidaLibroV2> {
  const paso = e.alPaso ?? (() => {});
  const { salidas, capitulos } = parcial;
  const gastar = (modelo: string, u: unknown) => { parcial.gastoUsd += costo(modelo, u); };
  const escribir = e.escribirCapitulo ?? escribirCapituloRepartido;

  paso('Etapas…');
  const historia = e.respuestas.map((r) => `P: ${r.pregunta}\nR: ${r.texto}`).join('\n\n');
  const et = await armarEtapas(e.cliente, e.quien, historia, e.lineaDeTiempo ?? '');
  gastar(MODELO_ESCRITOR, et.usage);
  salidas['etapas-salida.txt'] = et.salida;
  if (!et.resultado.ok) throw new Error('El modelo no devolvió etapas legibles: ver etapas-salida.txt');
  const etapas = et.resultado.etapas;

  paso('Reparto en etapas…');
  const numeradas = numerarRespuestas(e.respuestas.map(({ orden, pregunta, texto }) => ({ orden, pregunta, texto })));
  const capitulosEtapas = capitulosDeEtapas(etapas, e.epocas);
  const reparto = await repartirEnEtapas(e.cliente, e.quien, numeradas, capitulosEtapas, etapas);
  gastar(MODELO_ESCRITOR, reparto.usage);
  salidas['reparto-salida.txt'] = reparto.salida;
  // Lo que el modelo no ubicó va con el resto de su respuesta (o a la reflexión): ninguna oración dos veces.
  const ubicadas = ubicarSueltas(numeradas, capitulosEtapas, reparto.movidas);
  const { porCapitulo } = materialRepartido(numeradas, capitulosEtapas, ubicadas.movidas);

  // Cobertura: cada oración en algún material. Es así por construcción; se verifica igual.
  const todo = porCapitulo.join('\n');
  const afuera = numeradas.flatMap((r) => r.oraciones.filter((o) => !todo.includes(o)).map((o) => `${r.id} (orden ${r.orden}): ${o.slice(0, 60)}`));

  const sinMaterial: string[] = [];
  for (let i = 0; i < etapas.length; i++) {
    paso(`Capítulo ${i + 1}/${etapas.length}: ${etapas[i].nombre}…`);
    if (!porCapitulo[i]?.trim()) sinMaterial.push(etapas[i].nombre);
    const { texto, usage } = await escribir(e.quien, etapas[i].nombre, porCapitulo[i] ?? '', e.nombresCorregidos);
    gastar(MODELO_ESCRITOR, usage);
    capitulos.push({ nombre: etapas[i].nombre, texto });
    await e.alCapitulo?.(i, etapas[i].nombre, texto);
  }

  const fuentes = e.respuestas.map((r) => ({ id: r.fuenteId, texto: r.texto }));
  const medicion = medirRepeticion(capitulos, fuentes);

  paso('Apertura, cierre y «Sus frases»…');
  const transcripciones = e.respuestas.map((r) => r.texto);
  const paginas = await escribirPaginas(e.cliente, e.quien, capitulos, transcripciones);
  gastar(MODELO_ESCRITOR, paginas.usage);
  const libroMarkdown = paginas.resultado.ok ? armarLibro(paginas.resultado.paginas, capitulos) : null;

  const control = controlarLibro(capitulos, fuentes, e.quien.genero);
  paso('El lector final…');
  const lectura = await leerLibro(e.cliente, e.quien, libroMarkdown ?? capitulos.map((c) => `# ${c.nombre}\n\n${c.texto}`).join('\n\n'), transcripciones, e.nombresCorregidos, e.reservados);
  gastar(MODELO_LECTOR, lectura.usage);
  const informe: InformeRevision = {
    narrador: e.quien.nombre,
    lector: lectura.resultado.ok ? lectura.resultado.avisos : [],
    control: [
      ...control.avisos,
      ...(paginas.resultado.ok ? [] : ['El editor no devolvió apertura y cierre legibles.']),
      // Un capítulo escrito sin material solo puede ser inventado: que alguien lo mire.
      ...sinMaterial.map((n) => `El capítulo «${n}» se escribió sin material: todo lo que diga es inventado.`),
      ...(afuera.length ? [`${afuera.length} oraciones no quedaron en ningún capítulo.`] : []),
    ],
    lectorFallo: !lectura.resultado.ok,
    ...(lectura.resultado.ok ? {} : { lectorMotivo: lectura.resultado.motivo }),
    fecha: new Date().toISOString().slice(0, 10),
  };
  const detalle: DetalleLibroV2 = {
    movidas: reparto.movidas.size,
    ignoradas: reparto.ignoradas,
    sueltas: ubicadas.sueltas,
    afuera,
    caidas: paginas.resultado.ok ? paginas.resultado.caidas : [],
    frases: paginas.resultado.ok
      ? { suyas: paginas.resultado.paginas.suyas.length, heredadas: paginas.resultado.paginas.heredadas.length, muletillas: paginas.resultado.paginas.muletillas.length }
      : null,
    oraciones: numeradas.reduce((n, r) => n + r.oraciones.length, 0),
  };
  return { etapas, capitulos, materiales: porCapitulo, libroMarkdown, medicion, informe, salidas, gastoUsd: parcial.gastoUsd, detalle, lectorCrudo: lectura.crudo };
}
