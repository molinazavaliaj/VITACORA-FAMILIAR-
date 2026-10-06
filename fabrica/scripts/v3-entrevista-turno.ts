// Hace de WhatsApp para simular la entrevista con narradores INVENTADOS
// (docs/v3/entrevista/simulaciones/PLAN.md). Guarda el estado en un JSON;
// cada llamada recibe la respuesta del narrador y devuelve los mensajes de
// WhatsApp que siguen, exactamente como llegarían: usa el código real de
// `src/v3/entrevista/` (`siguientePregunta`, `mensajesDespues`, `anotarAcuse`,
// `acuseDeTurno`, `entradaSegunAcuse`, `armarTurno`, `renderizar`) y arma cada turno igual que `v3-entrevista-lectura.ts` (un
// test lo compara mensaje por mensaje). Sin modelos ni API: nada pago.
//
//   npx tsx scripts/v3-entrevista-turno.ts nueva <estado.json> --nombre <Nombre> --genero <varon|mujer> [--idioma ca|es-ES] [--familia "<pregunta>"]…
//   npx tsx scripts/v3-entrevista-turno.ts responder <estado.json> [--respuesta "<texto>"]   (sin --respuesta, la lee de stdin)
//   npx tsx scripts/v3-entrevista-turno.ts responder <estado.json> --boton "<texto del botón>"
//   … responder … --cazador [--env <ruta .env>]   (GASTA PLATA: al cerrar un bloque llama al cazador de escenas; tope USD 3 por entrevista)
//   npx tsx scripts/v3-entrevista-turno.ts md <estado.json> <salida.md> [--titulo "<título>"]
//
// Botones (Naza, 30/09, simulaciones): van debajo del mensaje como
// "[botones: (Sí, tuve) (No tuve hijos)]". Con un botón de "Sí" llega M30 solo
// y la pregunta sigue esperando: el texto siguiente se suma a esa respuesta.
// Con "No" o "Prefiero no contarla" (y el "Sí" de AMH) la respuesta queda cerrada y sigue la charla.

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { mensajePorId, nombresBloqueDe, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { idiomaDe } from '../src/v3/entrevista/idioma.js';
import { cazarBloque, fichaCorta, mensajeRepregunta, type ClienteModelo, type Descartada, type ResultadoCaza } from '../src/v3/entrevista/cazador.js';
import { alTocarBoton, anotarInferidas, botonesDeClave, mensajesDespues, preguntaDeClave, siguientePregunta, type PreguntaFamilia, type Repregunta } from '../src/v3/entrevista/flujo.js';
import { acuseDeTurno, anotarAcuse, armarTurno, entradaSegunAcuse, preguntaSegunAcuse, vueltasEnCero, type AcusePendiente, type Vueltas } from '../src/v3/entrevista/mensajes.js';
import { leerInferida, sumarAudio } from '../src/v3/entrevista/respuesta.js';
import { taparKey } from '../src/v3/entrevista/transcribir.js';
import { renderizar, type FichaTexto } from '../src/v3/entrevista/texto.js';

/** Lo que se anota de cada llamada al cazador (tokens, costo, qué eligió y qué descartó). */
export type RegistroCaza = {
  bloque: number;
  llamo: boolean;
  motivo?: ResultadoCaza['motivo'];
  repreguntas: string[];
  descartadas: Descartada[];
  tokens?: { entrada: number; salida: number };
  costoUsd: number;
  error?: string;
};

/** Una línea de un mensaje, con el ID de donde sale. */
export type Parte = { id: string; texto: string };
/** Un globo del chat. Los títulos de bloque y los IDs son para el equipo: el narrador no los ve (los botones sí). */
export type Globo =
  | { de: 'bio'; partes: Parte[]; botones?: string[] }
  | { de: 'persona'; pregunta: string; texto: string; boton?: string }
  | { de: 'bloque'; bloque: number; nombre: string };

/** Todo lo que hace falta para seguir la charla en la próxima llamada. Se guarda como JSON. */
export type EstadoSimulacion = {
  version: 1;
  ficha: FichaTexto;
  familia: PreguntaFamilia[];
  /** Respuestas en el orden en que llegaron: [ID de la pregunta, texto]. */
  respuestas: [string, string][];
  /** Lo que se mandó y no espera respuesta (AV11, FIN). */
  enviados: string[];
  vueltas: Vueltas;
  /** El acuse de la última respuesta: se arma con lo que se manda después. */
  acuse?: AcusePendiente;
  /** El ID de la pregunta que espera respuesta (del banco o de la familia). */
  esperando?: string;
  /** Tocó un botón de "Sí" en `esperando`: su respuesta ya está (la marca del botón) y el texto que llegue se le suma. */
  tocoSi?: boolean;
  bloqueActual: number;
  terminada: boolean;
  charla: Globo[];
  /** La cola de repreguntas del cazador (solo con --cazador; Naza, 01/10). */
  repreguntas?: Repregunta[];
  /** Lo que lleva el cazador en esta entrevista: el gasto (tope USD 3), las escenas que ya vio contadas y cada llamada. */
  cazador?: { gastoUsd: number; escenasContadas: string[]; registro: RegistroCaza[] };
};

/**
 * Lo que devuelve cada llamada: los mensajes de WhatsApp nuevos (texto tal
 * cual) y el estado. `bloqueCerrado`: la respuesta fue al cierre de ese
 * bloque (CIn): con el cazador prendido, es cuando se lo llama.
 */
export type Resultado = { estado: EstadoSimulacion; mensajes: string[]; bloqueCerrado?: number };

/** El texto de un globo como llega por WhatsApp: los párrafos de un mismo mensaje (BIEN) van separados por una línea en blanco. */
export function textoDeGlobo(partes: Parte[]): string {
  return partes.map((p, i) => (i === 0 ? '' : partes[i - 1].id === p.id ? '\n\n' : '\n') + p.texto).join('');
}

function clonar(e: EstadoSimulacion): EstadoSimulacion {
  return JSON.parse(JSON.stringify(e)) as EstadoSimulacion;
}

/** Arranca la entrevista: la bienvenida y la primera pregunta. */
export function nuevaEntrevista(ficha: FichaTexto, familia: PreguntaFamilia[] = []): Resultado {
  const estado: EstadoSimulacion = {
    version: 1,
    ficha,
    familia,
    respuestas: [],
    enviados: [],
    vueltas: vueltasEnCero(),
    bloqueActual: 0,
    terminada: false,
    charla: [],
  };
  const desde = estado.charla.length;
  // La bienvenida es un solo mensaje con párrafos (M6 ya no se manda).
  estado.charla.push({ de: 'bio', partes: renderizar(mensajePorId('BIEN', idiomaDe(ficha))!.texto, ficha).split('\n\n').map((t) => ({ id: 'BIEN', texto: t })) });
  avanzar(estado);
  return { estado, mensajes: mensajesDesde(estado, desde) };
}

/** Recibe la respuesta del narrador a la pregunta que está esperando y manda lo que sigue. */
export function responder(anterior: EstadoSimulacion, respuesta: string): Resultado {
  if (anterior.terminada) throw new Error('La entrevista ya terminó: no espera más respuestas.');
  if (!anterior.esperando) throw new Error('No hay ninguna pregunta esperando respuesta.');
  const r = respuesta.replace(/\r\n?/g, '\n').trim(); // CRLF de Windows: no ensucia el md
  if (r === '') throw new Error('La respuesta está vacía.');
  const estado = clonar(anterior);
  const id = estado.esperando!;
  const desde = estado.charla.length;
  estado.charla.push({ de: 'persona', pregunta: id, texto: r });
  if (estado.tocoSi) {
    // Después de "Sí" (y de M30), el audio se suma a esa misma respuesta.
    const ultima = estado.respuestas.at(-1)!;
    ultima[1] = sumarAudio(ultima[1], r);
  } else {
    estado.respuestas.push([id, r]);
  }
  cerrarRespuesta(estado);
  return conBloqueCerrado({ estado, mensajes: mensajesDesde(estado, desde) }, id);
}

/** Si la respuesta fue a un cierre (CIn), avisa qué bloque se cerró: ahí se llama al cazador (plan, B4). */
function conBloqueCerrado(r: Resultado, id: string): Resultado {
  const p = preguntaPorId(id);
  return p?.clase === 'cierre' ? { ...r, bloqueCerrado: p.bloque } : r;
}

/**
 * Toca un botón de la pregunta que está esperando. "Sí": llega M30 solo y se
 * sigue esperando la misma pregunta. "No" o "Prefiero no contarla": la respuesta queda
 * cerrada y sigue la charla (alTocarBoton en flujo.ts).
 */
export function tocarBoton(anterior: EstadoSimulacion, texto: string): Resultado {
  if (anterior.terminada) throw new Error('La entrevista ya terminó: no espera más respuestas.');
  if (!anterior.esperando) throw new Error('No hay ninguna pregunta esperando respuesta.');
  if (anterior.tocoSi) throw new Error('Ya tocó "Sí" en esta pregunta: ahora va el audio (--respuesta).');
  const id = anterior.esperando;
  // En una repregunta del cazador, el botón es [Ya lo conté todo] (Naza, 01/10).
  const botones = botonesDeClave(id, idiomaDe(anterior.ficha)) ?? [];
  if (!botones.some((b) => b.texto === texto)) {
    const hay = botones.length > 0 ? botones.map((b) => `(${b.texto})`).join(' ') : 'ninguno';
    throw new Error(`${id} no tiene el botón "${texto}". Botones: ${hay}`);
  }
  const estado = clonar(anterior);
  const desde = estado.charla.length;
  const toque = alTocarBoton({ id, botones }, texto);
  estado.charla.push({ de: 'persona', pregunta: id, texto: `[toca: ${texto}]`, boton: texto });
  estado.respuestas.push([id, toque.respuesta]);
  if (toque.esperaAudio) {
    // M30 va solo, sin acuse; la pregunta sigue abierta (regla 30).
    estado.tocoSi = true;
    estado.charla.push({ de: 'bio', partes: [{ id: toque.mandar, texto: renderizar(mensajePorId(toque.mandar, idiomaDe(estado.ficha))!.texto, estado.ficha) }] });
    return { estado, mensajes: mensajesDesde(estado, desde) };
  }
  cerrarRespuesta(estado);
  return conBloqueCerrado({ estado, mensajes: mensajesDesde(estado, desde) }, id);
}

/** La respuesta de `esperando` ya está completa (la última de `respuestas`): anota el acuse y manda lo que sigue. */
function cerrarRespuesta(estado: EstadoSimulacion): void {
  const [id, r] = estado.respuestas.at(-1)!;
  const anteriores = new Map(estado.respuestas.slice(0, -1)); // para M29 (tercer olvido seguido)
  estado.esperando = undefined;
  estado.tocoSi = undefined;
  estado.acuse = undefined;
  // Las claves CA16~2 (segunda oportunidad) y RP~X (repregunta) también tienen su pregunta (Naza, 01/10).
  const idioma = idiomaDe(estado.ficha);
  const p = preguntaDeClave(id, idioma);
  if (!p) {
    // Pregunta de la familia: acuse común, como en la lectura corrida.
    estado.acuse = anotarAcuse('M3', estado.vueltas);
  } else {
    estado.vueltas.M27 ??= 0; // estados de antes de las simulaciones
    estado.vueltas.M32 ??= 0; // y de antes de la ronda 2
    estado.vueltas['M28.4'] ??= 0; // y de antes de la prueba de Naza en la página
    for (const fam of mensajesDespues(p, r, anteriores, idioma)) estado.acuse = anotarAcuse(fam, estado.vueltas);
  }
  avanzar(estado);
}

/** Cómo se ven los botones debajo del mensaje. */
function lineaBotones(botones: string[]): string {
  return `[botones: ${botones.map((b) => `(${b})`).join(' ')}]`;
}

function mensajesDesde(e: EstadoSimulacion, desde: number): string[] {
  return e.charla.slice(desde).flatMap((g) => (g.de === 'bio' ? [textoDeGlobo(g.partes) + (g.botones ? `\n${lineaBotones(g.botones)}` : '')] : []));
}

/** Manda todo lo que va hasta la próxima pregunta que espera respuesta (o hasta el final). */
function avanzar(e: EstadoSimulacion): void {
  const respuestas = new Map(e.respuestas);
  const enviados = new Set(e.enviados);
  const idioma = idiomaDe(e.ficha);
  // Lo que no se manda porque otra respuesta ya lo dijo queda guardado (AMH desde AM0; Naza, 06/10).
  for (const id of anotarInferidas(respuestas, idioma)) e.respuestas.push([id, respuestas.get(id)!]);
  const texto = (id: string) => renderizar(mensajePorId(id, idioma)!.texto, e.ficha);

  /** Igual que `mandar` en v3-entrevista-lectura.ts. */
  const mandar = (t: { entrada?: string; pregunta: string; conM1?: boolean; ayuda?: boolean; botones?: string[] }, textos: Record<string, string>): void => {
    const siguiente = t.entrada ? texto(t.entrada) : (textos[t.pregunta] ?? texto(t.pregunta));
    const quePregunta = preguntaPorId(t.pregunta, idioma) ?? { id: t.pregunta, clase: 'historia' as const };
    const a = e.acuse;
    const idAcuse = a && acuseDeTurno(a.familia, a.n, siguiente, quePregunta);
    const textoAcuse = idAcuse ? mensajePorId(idAcuse, idioma)?.texto : undefined;
    if (t.entrada) textos[t.entrada] = renderizar(entradaSegunAcuse(mensajePorId(t.entrada, idioma)!.texto, textoAcuse), e.ficha);
    // FO1 va sin el nombre si el acuse pegado ya lo dice (prueba de Naza en la página, 30/09).
    const delBanco = preguntaPorId(t.pregunta, idioma);
    if (!t.entrada && delBanco) textos[t.pregunta] = renderizar(preguntaSegunAcuse(t.pregunta, delBanco.texto, textoAcuse), e.ficha, respuestas);
    const porId = armarTurno({ acuse: idAcuse, familia: a?.familia, entrada: t.entrada, pregunta: t.pregunta, m1: t.conM1 ? 'M1' : undefined, ayuda: t.ayuda ? 'M31' : undefined });
    for (const m of porId) e.charla.push({ de: 'bio', partes: m.split('\n').map((id) => ({ id, texto: textos[id] ?? texto(id) })) });
    // Los botones van debajo del mensaje de la pregunta (el último del turno).
    const botones = t.botones ?? preguntaPorId(t.pregunta, idioma)?.botones?.map((b) => b.texto);
    const ultimo = e.charla.at(-1)!;
    if (botones && ultimo.de === 'bio') ultimo.botones = botones;
    e.acuse = undefined;
  };

  for (let vuelta = 0; vuelta < 50; vuelta++) {
    const s = siguientePregunta({ respuestas, enviados, rondaExtra: 'rechazada', familia: e.familia, repreguntas: e.repreguntas, idioma });
    if (s.tipo === 'terminada' || s.tipo === 'ofrecer-extra') {
      // La ronda extra por ahora no se ofrece: no puede llegar 'ofrecer-extra'.
      e.terminada = true;
      return;
    }
    if (s.tipo === 'familia') {
      mandar({ entrada: 'M15', pregunta: s.pregunta.id }, { [s.pregunta.id]: s.pregunta.texto });
      e.esperando = s.pregunta.id;
      return;
    }
    if (s.tipo === 'segunda-oportunidad') {
      // M33.n va solo (sin acuse delante: mensajesDespues no dejó ninguno); lo que conteste se guarda como CA16~2 (Naza, 01/10).
      mandar({ pregunta: s.mensaje }, {});
      e.esperando = s.clave;
      return;
    }
    if (s.tipo === 'repregunta') {
      // La repregunta del cazador (Naza, 01/10): mitad fijo, mitad escrito, con [Ya lo conté todo]; se guarda como RP~X.
      const rp = s.repregunta;
      mandar({ pregunta: rp.clave, botones: s.botones.map((b) => b.texto) }, { [rp.clave]: mensajeRepregunta(rp, idioma) });
      e.esperando = rp.clave;
      return;
    }
    const p = s.pregunta;
    if (p.bloque !== e.bloqueActual) {
      e.bloqueActual = p.bloque;
      e.charla.push({ de: 'bloque', bloque: p.bloque, nombre: nombresBloqueDe(idioma)[p.bloque] });
    }
    mandar({ entrada: s.entrada, pregunta: p.id, conM1: s.conM1, ayuda: s.ayudaBotones }, { [p.id]: renderizar(p.texto, e.ficha, respuestas) });
    if (s.esperaRespuesta) {
      e.esperando = p.id;
      return;
    }
    // Aviso y final: no esperan respuesta, sigue lo que venga.
    enviados.add(p.id);
    e.enviados.push(p.id);
  }
  throw new Error('avanzar: más de 50 mensajes sin una pregunta que espere respuesta.');
}

// ---------------------------------------------------------------- cazador

/** La pregunta como se le mandó (las partes de la charla con ese ID; si no está, la del banco renderizada). */
export function textoMandado(e: EstadoSimulacion, id: string): string {
  let texto: string | undefined;
  for (const g of e.charla) {
    if (g.de !== 'bio') continue;
    const partes = g.partes.filter((p) => p.id === id).map((p) => p.texto);
    if (partes.length > 0) texto = partes.join('\n\n'); // si se mandó dos veces, vale la última
  }
  const delBanco = preguntaPorId(id, idiomaDe(e.ficha));
  return texto ?? (delBanco ? renderizar(delBanco.texto, e.ficha) : '');
}

/**
 * Llama al cazador por el bloque que se cerró, con lo que lleva la
 * entrevista (lo ya repreguntado, las escenas contadas y el gasto, para el
 * tope de USD 3). No toca el estado: lo que devuelve se suma con `sumarCaza`.
 */
export function cazarAlCerrar(e: EstadoSimulacion, bloque: number, cliente: ClienteModelo): Promise<ResultadoCaza> {
  return cazarBloque({
    cliente,
    ficha: fichaCorta(e.ficha),
    bloque,
    respuestas: new Map(e.respuestas),
    textoPregunta: (id) => textoMandado(e, id),
    yaRepreguntado: e.repreguntas ?? [],
    escenasContadas: e.cazador?.escenasContadas ?? [],
    gastoUsd: e.cazador?.gastoUsd ?? 0,
    idioma: idiomaDe(e.ficha),
  });
}

/** Suma lo que devolvió el cazador: las repreguntas entran a la cola (sin repetir clave), y se anotan el gasto, las escenas y la llamada. */
export function sumarCaza(anterior: EstadoSimulacion, r: ResultadoCaza): EstadoSimulacion {
  const e = clonar(anterior);
  if (!r.llamo) return e;
  const cola = e.repreguntas ?? [];
  for (const rp of r.repreguntas) if (!cola.some((x) => x.clave === rp.clave)) cola.push(rp);
  e.repreguntas = cola;
  const c = (e.cazador ??= { gastoUsd: 0, escenasContadas: [], registro: [] });
  c.gastoUsd += r.costoUsd;
  c.escenasContadas.push(...r.escenasContadas);
  c.registro.push({
    bloque: r.bloque,
    llamo: r.llamo,
    ...(r.motivo ? { motivo: r.motivo } : {}),
    repreguntas: r.repreguntas.map((x) => x.clave),
    descartadas: r.descartadas,
    ...(r.tokens ? { tokens: r.tokens } : {}),
    costoUsd: r.costoUsd,
    ...(r.error ? { error: r.error } : {}),
  });
  return e;
}

/** Una línea para la consola: qué cazó y cuánto va. */
export function lineaCaza(r: ResultadoCaza): string {
  const que = r.llamo ? `${r.repreguntas.length} repregunta(s)${r.descartadas.length ? `, ${r.descartadas.length} descartada(s)` : ''}${r.motivo ? ` (${r.motivo})` : ''}` : `no llamó (${r.motivo})`;
  // 02/10 (prueba de Joaquín): sin el porqué, un "(error)" o una descartada no se pueden diagnosticar. La key nunca se imprime.
  const porque = [
    ...(r.error ? [`error: ${taparKey(r.error)}`] : []),
    ...r.descartadas.map((d) => `descartada ${d.id}: ${d.fallas.join(', ')}`),
  ];
  return `cazador, bloque ${r.bloque}: ${que} · USD ${r.costoUsd.toFixed(2)} · acumulado USD ${r.gastoUsd.toFixed(2)}${porque.length ? ` — ${porque.join(' | ')}` : ''}`;
}

// ---------------------------------------------------------------- md

/** La charla entera para el equipo: mensajes del biógrafo con sus IDs, respuestas del narrador y títulos de bloque. */
export function charlaMd(e: EstadoSimulacion, titulo = `Simulación: ${e.ficha.nombre}`): string {
  // Sin las que no se le preguntaron (AMH inferida de AM0; Naza, 06/10).
  const preguntas = new Set(e.respuestas.filter(([, r]) => leerInferida(r) === undefined).map(([id]) => id).filter((id) => preguntaPorId(id)?.clase === 'historia' || preguntaPorId(id)?.clase === 'foto'));
  const mensajesBio = e.charla.filter((g) => g.de === 'bio').length;
  const lineas: string[] = [
    `# ${titulo}`,
    '',
    `**Qué es:** la entrevista de un narrador **inventado** (${e.ficha.nombre}), contestada por un agente de IA en personaje, con el código de \`fabrica/src/v3/entrevista/\` haciendo de WhatsApp (\`fabrica/scripts/v3-entrevista-turno.ts\`). Plan: [\`PLAN.md\`](PLAN.md).`,
    '',
    `**Cuenta:** ${preguntas.size} preguntas del banco contestadas + ${e.familia.length} de la familia · **${mensajesBio} mensajes de WhatsApp del biógrafo** · ${e.terminada ? 'terminó con el mensaje final' : '**no terminó**'}.`,
    '',
    'Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas van juntas en ese mensaje); **Narrador** es lo que contestó. Los títulos de bloque y los IDs (entre corchetes) son para el equipo: el narrador no los ve.',
    '',
  ];
  for (const g of e.charla) {
    if (g.de === 'bloque') lineas.push(`## Bloque ${g.bloque} · ${g.nombre}`, '');
    else if (g.de === 'persona') lineas.push(`**Narrador** \`[${g.pregunta}]\`: ${g.texto}`, '');
    else {
      lineas.push(`**Biógrafo** \`[${[...new Set(g.partes.map((x) => x.id))].join(' + ')}]\`:`);
      const citas = g.partes.map((x) => `> ${x.texto}`);
      if (g.botones) citas.push(`> ${lineaBotones(g.botones)}`);
      lineas.push(citas.join('\n>\n'), '');
    }
  }
  return lineas.join('\n');
}

// ---------------------------------------------------------------- CLI

/** Lo que ve el narrador en la terminal: los mensajes, sin IDs. */
export function salidaParaNarrador(r: Resultado): string {
  const n = r.mensajes.length;
  const bloques = r.mensajes.map((m, i) => `[mensaje ${i + 1} de ${n}]\n${m}`);
  const pie = r.estado.terminada ? '>> La entrevista terminó. No hay que contestar nada más.' : '>> Te toca contestar.';
  return [...bloques, '', pie].join('\n');
}

function opcion(args: string[], nombre: string): string | undefined {
  const i = args.indexOf(nombre);
  return i >= 0 ? args[i + 1] : undefined;
}

function opciones(args: string[], nombre: string): string[] {
  return args.flatMap((a, i) => (a === nombre && args[i + 1] !== undefined ? [args[i + 1]] : []));
}

const leer = (ruta: string) => JSON.parse(readFileSync(ruta, 'utf8')) as EstadoSimulacion;
const guardar = (ruta: string, e: EstadoSimulacion) => writeFileSync(ruta, JSON.stringify(e, null, 1), 'utf8');

export function main(args: string[]): string {
  const [comando, ruta] = args;
  const USO = 'Uso: v3-entrevista-turno.ts nueva|responder|md <estado.json> …';
  if (!ruta) throw new Error(USO);
  if (comando === 'nueva') {
    const nombre = opcion(args, '--nombre');
    const genero = opcion(args, '--genero');
    if (!nombre || (genero !== 'varon' && genero !== 'mujer')) throw new Error('nueva: faltan --nombre y --genero varon|mujer');
    const familia = opciones(args, '--familia').map((texto, i) => ({ id: `FAM${i + 1}`, texto }));
    // --idioma ca: la entrevista en catalán (Naza, 04/10); --idioma es-ES: en castellano de España, de tú (Naza, 05/10). Sin --idioma, la de siempre.
    const idioma = idiomaDe({ idioma: opcion(args, '--idioma') });
    const r = nuevaEntrevista(idioma === 'es-AR' ? { nombre, genero } : { nombre, genero, idioma }, familia);
    guardar(ruta, r.estado);
    return salidaParaNarrador(r);
  }
  if (comando === 'responder' && args.includes('--boton')) {
    const boton = opcion(args, '--boton');
    if (boton === undefined) throw new Error('responder: --boton sin texto');
    const r = tocarBoton(leer(ruta), boton);
    guardar(ruta, r.estado);
    return salidaParaNarrador(r);
  }
  if (comando === 'responder') {
    // Con --respuesta sin valor no se cae a stdin: en una terminal se quedaría esperando.
    if (args.includes('--respuesta') && opcion(args, '--respuesta') === undefined) throw new Error('responder: --respuesta sin texto');
    const respuesta = opcion(args, '--respuesta') ?? readFileSync(0, 'utf8');
    const r = responder(leer(ruta), respuesta);
    guardar(ruta, r.estado);
    return salidaParaNarrador(r);
  }
  if (comando === 'md') {
    const salida = args[2];
    if (!salida) throw new Error('md: falta <salida.md>');
    writeFileSync(salida, charlaMd(leer(ruta), opcion(args, '--titulo')), 'utf8');
    return `Charla escrita en ${salida}`;
  }
  throw new Error(USO);
}

/** Si lo último que contestó fue un cierre y el cazador todavía no miró ese bloque, el bloque; si no, undefined. */
export function bloqueSinCazar(e: EstadoSimulacion): number | undefined {
  const ultima = e.respuestas.at(-1)?.[0];
  const p = ultima ? preguntaPorId(ultima) : undefined;
  if (p?.clase !== 'cierre') return undefined;
  return e.cazador?.registro.some((x) => x.bloque === p.bloque) ? undefined : p.bloque;
}

export const ENV_POR_DEFECTO = 'C:\\Users\\Naza\\Desktop\\VITACORA FAMILIAR\\fabrica\\.env';

/**
 * Con --cazador (apagado por defecto; GASTA PLATA, Opus 5, tope USD 3 por
 * entrevista): si la respuesta cerró un bloque, llama al cazador y mete lo
 * que devuelve en la cola. La key sale del .env (--env), nunca se imprime.
 */
async function cazarCli(args: string[]): Promise<string | undefined> {
  const ruta = args[1];
  const e = leer(ruta);
  const bloque = bloqueSinCazar(e);
  if (bloque === undefined) return undefined;
  process.loadEnvFile(opcion(args, '--env') ?? ENV_POR_DEFECTO);
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const r = await cazarAlCerrar(e, bloque, new Anthropic() as unknown as ClienteModelo);
  guardar(ruta, sumarCaza(e, r));
  return lineaCaza(r);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  try {
    console.log(main(args));
    if (args[0] === 'responder' && args.includes('--cazador')) {
      cazarCli(args).then(
        (linea) => linea && console.error(linea),
        (err) => {
          console.error(`ERROR del cazador: ${(err as Error).message}`);
          process.exit(1);
        },
      );
    }
  } catch (err) {
    console.error(`ERROR: ${(err as Error).message}`);
    process.exit(1);
  }
}
