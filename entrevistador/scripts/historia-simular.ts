// Simulación de punta a punta del bot de «Vitácora de una historia» (plan 2026-10-21, Task 3.5). Corre el código de
// verdad del entrevistador (bienvenida, entrante, reloj, envío, la fila de historias, respuestas, envios) sobre la base
// en memoria, con un WhatsApp falso, un cazador falso (ninguna llamada a un modelo) y un reloj que avanza. No toca
// ninguna base real y no gasta nada. Narradores INVENTADOS: nunca la vida de un narrador real.
//
//   npm run historia-simular                    # 300 narradores por idioma (es-AR, es-ES y ca)
//   npm run historia-simular -- 50              # otra cantidad por idioma
//   npm run historia-simular -- --semilla 7     # un narrador, mensaje por mensaje, y sus violaciones
//
// Cada narrador sale de su semilla: idioma, los 7 temas, regalo o no, tema abierto (y si duda), 0 a 3 preguntas de
// quien regala, género (también «otro» con trato masculino), audio, texto escrito, «paso», botones, foto, un saludo
// antes del SÍ y un silencio de 3 días. Los controles que tienen que dar 0:
//   - pregunta repetida: se abre dos veces la misma clave;
//   - pregunta de otro tema: se abre una clave que no es del banco de su tema (ni TEMA, FOTO-H, sus PR-H o una
//     repregunta de una de las suyas);
//   - mensaje fuera de horario: sale algo entre las 22 y las 8 de su hora (el narrador solo escribe de día);
//   - entrevista que no termina: a los 90 días no llegó a FIN-H con el narrador completado;
//   - `{{` sin reemplazar en algo que sale;
//   - género que no corresponde: una parte con marcas {{m/f}} salió en la forma del otro género.
//
// Sale con código 1 si hay alguna violación.

import { pathToFileURL } from 'node:url';
import { bienvenidaAlCanjear, bienvenidaPorPlantilla } from '../src/historia/bienvenida.js';
import { esperarCazas } from '../src/historia/cazador.js';
import type { DepsHistoria } from '../src/historia/deps.js';
import { procesarEntranteHistoria } from '../src/historia/entrante.js';
import { leerFila } from '../src/historia/estado.js';
import { bancoHistoria, mensajePorId, preguntaPorId } from '../src/historia/nucleo/entrevista/banco.js';
import type { ClienteModelo } from '../src/historia/nucleo/entrevista/cazador.js';
import { botonesDeClave, deRepregunta, FOTO, PROPIAS } from '../src/historia/nucleo/entrevista/flujo.js';
import { IDIOMAS, type Idioma } from '../src/historia/nucleo/entrevista/idioma.js';
import { TEMAS_HISTORIA, type TemaHistoria } from '../src/historia/nucleo/entrevista/temas.js';
import { renderizar } from '../src/historia/nucleo/entrevista/texto.js';
import { trabajarNarrador } from '../src/historia/reloj.js';
import { CLAVE_TEMA, fichaTexto, type FilaHistoria, type NarradorHistoria } from '../src/historia/tipos.js';
import type { MensajeEntrante } from '../src/whatsapp/webhook.js';
import { crearBaseFalsa, type BaseFalsa } from '../test/historia/base-falsa.js';

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;
const HORIZONTE_DIAS = 90;
const DESDE = Date.parse('2026-11-02T12:00:00Z');
const HORAS_PREFERIDAS = ['09:00:00', '10:30:00', '18:00:00', '20:00:00'];

// ---------------------------------------------------------------- azar con semilla

export function azar(semilla: number) {
  let s = (semilla * 2654435761) >>> 0 || 1;
  const n = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
  return { n, si: (p: number) => n() < p, uno: <T>(xs: readonly T[]): T => xs[Math.floor(n() * xs.length)], entre: (a: number, b: number) => a + Math.floor(n() * (b - a + 1)) };
}

// ---------------------------------------------------------------- lo que dice el narrador

const DICE: Readonly<Record<Idioma, { si: string; hola: string; duda: string; historia: string; cuenta: string[]; escrito: string; paso: string }>> = {
  'es-AR': {
    si: 'Sí', hola: 'Hola, ¿quién es?', duda: 'no sé', historia: 'La vez que nos fuimos a vivir al campo con mis abuelos',
    cuenta: ['Fue una época larga, me acuerdo de la casa, de la calle y de la gente que estaba conmigo.', 'Me acuerdo del olor de la cocina y de las tardes en el patio con mis hermanos, era otra vida.'],
    escrito: 'Lo escribo porque no puedo mandar audio: fue un tiempo difícil pero aprendí mucho.', paso: 'paso',
  },
  'es-ES': {
    si: 'Sí', hola: 'Hola, ¿quién eres?', duda: 'no sé', historia: 'La vez que nos fuimos a vivir al campo con mis abuelos',
    cuenta: ['Fue una época larga, recuerdo la casa, la calle y la gente que estaba conmigo.', 'Recuerdo el olor de la cocina y las tardes en el patio con mis hermanos, era otra vida.'],
    escrito: 'Lo escribo porque no puedo mandar audio: fue un tiempo difícil pero aprendí mucho.', paso: 'paso',
  },
  ca: {
    si: 'Sí', hola: 'Hola, qui ets?', duda: 'no ho sé', historia: 'La vegada que vam anar a viure al camp amb els avis',
    cuenta: ['Va ser una època llarga, recordo la casa, el carrer i la gent que hi havia amb mi.', "Recordo l'olor de la cuina i les tardes al pati amb els meus germans, era una altra vida."],
    escrito: "Ho escric perquè no puc enviar àudio: va ser un temps difícil però vaig aprendre molt.", paso: 'passo',
  },
};
const NOMBRES = { varon: ['Jorge', 'Pere', 'Osvaldo'], mujer: ['Marta', 'Imma', 'Elena'], otro: ['Alex', 'Noa'] } as const;
const ZONA: Readonly<Record<Idioma, string>> = { 'es-AR': 'America/Argentina/Buenos_Aires', 'es-ES': 'Europe/Madrid', ca: 'Europe/Madrid' };

export type Narrador = {
  semilla: number; idioma: Idioma; tema: TemaHistoria; temaAbierto: boolean; dudaTema: boolean; regalo: boolean;
  propias: string[]; genero: 'varon' | 'mujer' | 'otro'; formaTrato?: 'masculino' | 'femenino'; nombre: string;
  hora: string; saluda: boolean; silencio: number; foto: boolean;
};

export function narradorDe(semilla: number, idioma: Idioma): Narrador {
  const r = azar(semilla * 7 + IDIOMAS.indexOf(idioma));
  const regalo = r.si(0.6);
  const temaAbierto = regalo && r.si(0.25);
  const genero = r.uno(['varon', 'mujer', 'otro'] as const);
  return {
    semilla, idioma, regalo, temaAbierto, dudaTema: temaAbierto && r.si(0.5),
    tema: temaAbierto ? 'otra' : TEMAS_HISTORIA[semilla % TEMAS_HISTORIA.length],
    propias: regalo ? ['¿Qué fue lo que más extrañaste?', '¿Quién te ayudó más en ese tiempo?', '¿Qué le dirías hoy a quien eras entonces?'].slice(0, r.entre(0, 3)) : [],
    genero, ...(genero === 'otro' && r.si(0.5) ? { formaTrato: 'masculino' as const } : {}),
    nombre: r.uno(NOMBRES[genero]), hora: r.uno(HORAS_PREFERIDAS), saluda: r.si(0.15),
    silencio: r.entre(2, 12), foto: r.si(0.5),
  };
}

// ---------------------------------------------------------------- el género

/** La fuente de un mensaje o una pregunta del banco, si tiene marcas de género {{m/f}}. */
function fuenteConGenero(id: string, idioma: Idioma): string | undefined {
  const t = preguntaPorId(id, idioma)?.texto ?? mensajePorId(id, idioma)?.texto;
  return t && /\{\{[^{}/]+\/[^{}/]+\}\}/.test(t) ? t : undefined;
}

/**
 * Las partes de la charla con marcas de género que salieron en la forma del otro género: se renderiza la fuente con
 * los dos géneros (con sus respuestas, por las variantes) y lo mandado no puede ser la forma del otro.
 */
export function generoEquivocado(fila: FilaHistoria): string[] {
  const ficha = fichaTexto(fila);
  const otro = ficha.genero === 'varon' || ficha.formaTrato === 'masculino'
    ? { ...ficha, genero: 'mujer' as const, formaTrato: undefined }
    : { ...ficha, genero: 'varon' as const, formaTrato: undefined };
  const respuestas = new Map(fila.estado.respuestas);
  const malas: string[] = [];
  for (const g of fila.estado.charla) {
    if (g.de !== 'bio') continue;
    for (const p of g.partes) {
      const fuente = fuenteConGenero(p.id, fila.idioma);
      if (!fuente) continue;
      const bien = renderizar(fuente, ficha, respuestas);
      const mal = renderizar(fuente, otro, respuestas);
      if (bien !== mal && p.texto === mal) malas.push(`${p.id}: ${p.texto.slice(0, 100)}`);
    }
  }
  return malas;
}

/** Cuántas partes con marcas de género salieron (para saber que el control miró algo). */
export function partesConGenero(fila: FilaHistoria): number {
  return fila.estado.charla.flatMap((g) => (g.de === 'bio' ? g.partes : [])).filter((p) => fuenteConGenero(p.id, fila.idioma)).length;
}

// ---------------------------------------------------------------- una corrida

export type Salida = { en: Date; texto: string };
export type Linea = { en: Date; de: 'bot' | 'narrador'; texto: string };
export type Violacion = { control: string; detalle: string };
export type Corrida = { narrador: Narrador; violaciones: Violacion[]; charla: Linea[]; preguntas: number; dias: number; terminada: boolean; conGenero: number };

/**
 * Una vida inventada para la lectura corrida: lo que contesta a cada pregunta (por ID; las repreguntas, «RP~ID») y
 * la repregunta que haría el cazador sobre cada respuesta (con su cita textual).
 */
export type Vida = { respuestas: Readonly<Record<string, string>>; repreguntas: Readonly<Record<string, { cita: string; pregunta: string }>> };

/**
 * El cazador falso. En la simulación elige una escena de la última respuesta (cita textual de cuatro palabras); con
 * una vida, la repregunta que trae para la última respuesta que tenga una.
 */
function cazadorFalso(base: BaseFalsa, narradorId: string, idioma: Idioma, vida?: Vida): ClienteModelo {
  return {
    messages: {
      create: async () => {
        const fila = base.tablas.historias?.find((f) => f.narrador_id === narradorId) as FilaHistoria | undefined;
        const delBanco = fila?.estado.respuestas.filter(([k]) => !k.startsWith('RP~') && k !== CLAVE_TEMA && k !== FOTO && !PROPIAS.includes(k)) ?? [];
        let elegidas: { id: string; cita: string; pregunta: string; tema: string }[] = [];
        if (vida) {
          const ultima = delBanco.filter(([k]) => vida.repreguntas[k]).at(-1);
          if (ultima) elegidas = [{ id: ultima[0], ...vida.repreguntas[ultima[0]], tema: ultima[0] }];
        } else {
          const ultima = delBanco.filter(([, t]) => t.split(/\s+/).length >= 6).at(-1);
          const cita = ultima ? ultima[1].split(/\s+/).slice(0, 4).join(' ').replace(/[,.:]$/, '') : '';
          const pregunta = idioma === 'ca' ? 'Recordes algun moment concret d’aquella època?' : '¿Hay algún momento de esa época que recuerdes más que otros?';
          if (ultima) elegidas = [{ id: ultima[0], cita, pregunta, tema: 'esa época' }];
        }
        return { content: [{ type: 'text', text: JSON.stringify({ elegidas, escenas_contadas_bloque: [] }) }], usage: { input_tokens: 8000, output_tokens: 600 } };
      },
    },
  };
}

function horaLocal(en: Date, zona: string): number {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: zona, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(en).split(':').map(Number);
  return h + m / 60;
}

/** Con `vida` (la lectura corrida) contesta siempre en audio lo de la vida, sin «paso», textos ni silencios. */
export async function correr(nar: Narrador, vida?: Vida): Promise<Corrida> {
  const id = `sim-${nar.idioma}-${nar.semilla}`;
  const tel = `+0${nar.semilla}${IDIOMAS.indexOf(nar.idioma)}`;
  const zona = ZONA[nar.idioma];
  const r = azar(nar.semilla * 31 + 5);
  // Compra o canje de día: entre las 9 y las 15 de Buenos Aires, entre las 13 y las 19 de Madrid.
  let reloj = new Date(DESDE + r.entre(0, 6) * HORA);
  const contexto: Record<string, unknown> = {
    modo: 'historia', genero: nar.genero, ...(nar.formaTrato ? { formaTrato: nar.formaTrato } : {}),
    ...(nar.idioma === 'es-AR' ? {} : { idioma: nar.idioma }), ...(nar.regalo ? { regalo: true } : {}),
    historia: nar.temaAbierto ? { tema: null, temaAbierto: true } : { tema: nar.tema, ...(nar.tema === 'otra' ? { temaLibre: 'Cuando me quebré la pierna' } : {}), preguntasPropias: nar.propias },
  };
  if (nar.temaAbierto) (contexto.historia as Record<string, unknown>).preguntasPropias = nar.propias;
  const base = crearBaseFalsa({
    narradores: [{ id, familia_id: `f-${id}`, como_le_dicen: nar.nombre, telefono_whatsapp: tel, hora_preferida: nar.hora, zona_horaria: zona, contexto, estado: 'invitado', dia_actual: 0, ultima_respuesta_at: null }],
    familias: [{ id: `f-${id}`, nombre: 'Pablo' }],
  }, { ahora: () => reloj });

  const salidas: Salida[] = [];
  const charla: Linea[] = [];
  const v: Violacion[] = [];
  const mal = (control: string, detalle: string) => v.push({ control, detalle });
  let k = 0;
  const salir = (texto: string): Promise<string> => {
    salidas.push({ en: reloj, texto });
    charla.push({ en: reloj, de: 'bot', texto });
    return Promise.resolve(`wamid.sim.${id}.${++k}`);
  };
  const deps: DepsHistoria = {
    db: base.cliente,
    wa: {
      texto: (_a, texto) => salir(texto),
      botones: (_a, texto, botones) => salir(`${texto}\n[${botones.join('] [')}]`),
      plantilla: (_a, nombre, _i, variables) => salir(`(plantilla ${nombre}) ${variables.join(' · ')}`),
      descargar: async (mediaId) => Buffer.from(mediaId, 'utf8'),
    },
    transcribir: async (audio) => ({ texto: audio.toString('utf8'), duracionSegundos: 40 }),
    avisar: async () => {},
    hito: async () => {},
    cazador: cazadorFalso(base, id, nar.idioma, vida),
    ahora: () => reloj,
  };
  const leerN = () => ({ ...base.tablas.narradores[0] }) as NarradorHistoria;
  const fila = async () => (await leerFila(base.cliente, id))!;
  const entra = async (m: Omit<MensajeEntrante, 'telefono' | 'waMessageId'>) => {
    charla.push({ en: reloj, de: 'narrador', texto: m.tipo === 'imagen' ? '[foto]' : m.tipo === 'audio' ? `🎤 ${m.mediaId}` : m.texto ?? '' });
    await procesarEntranteHistoria(deps, leerN(), { telefono: tel, waMessageId: `wamid.in.${id}.${++k}`, ...m });
    await esperarCazas();
  };
  const tick = async () => {
    const n = leerN();
    const f = await leerFila(base.cliente, id);
    if (f) await trabajarNarrador(deps, f, n);
    await esperarCazas();
  };
  const pasar = (ms: number) => { reloj = new Date(reloj.getTime() + ms); };
  /** Pasa a la próxima hora en que el narrador está despierto (9 a 21), corriendo el reloj de hora en hora. */
  const despierto = () => { const h = horaLocal(reloj, zona); return h >= 9 && h < 21; };

  // La bienvenida: para uno mismo, la plantilla del tick; un regalo, el texto al canjear (escribe con el código).
  if (nar.regalo) {
    charla.push({ en: reloj, de: 'narrador', texto: '(canjea el código del regalo)' });
    await bienvenidaAlCanjear(deps, id);
  } else {
    await bienvenidaPorPlantilla(deps, leerN());
  }
  pasar(r.entre(5, 40) * MIN);
  if (nar.saluda) {
    await entra({ tipo: 'texto', texto: DICE[nar.idioma].hola });
    pasar(r.entre(3, 20) * MIN);
  }
  await entra({ tipo: 'texto', texto: DICE[nar.idioma].si });

  // La entrevista: contesta lo abierto un rato después de que le llega, de día; el reloj corre de hora en hora.
  const abiertas: string[] = [];
  let ultimaAbierta: string | undefined;
  let yaDudo = false;
  let silencioHecho = false;
  let respuestas = 0;
  const fin = DESDE + HORIZONTE_DIAS * DIA;
  while (reloj.getTime() < fin) {
    const f = await fila();
    const e = f.estado;
    if (e.esperando && e.esperando !== ultimaAbierta) {
      abiertas.push(e.esperando);
      ultimaAbierta = e.esperando;
    } else if (!e.esperando) ultimaAbierta = undefined;
    if (e.terminada && e.salientes.length === 0) break;

    const quiereContestar = e.esperando && e.salientes.length === 0 && !e.borrador?.trim();
    if (quiereContestar && !vida && !silencioHecho && respuestas === nar.silencio) {
      silencioHecho = true;
      // Tres días sin contestar: el reloj sigue (M8 a los 2 días).
      for (let h = 0; h < 72; h++) { pasar(HORA); await tick(); }
      continue;
    }
    if (!quiereContestar || !despierto()) {
      pasar(r.entre(20, 60) * MIN);
      await tick();
      continue;
    }
    pasar(r.entre(3, 30) * MIN);
    if (!despierto()) continue;
    const abierta = e.esperando!;
    const dice = DICE[nar.idioma];
    const botones = botonesDeClave(abierta, nar.idioma) ?? [];
    if (abierta === CLAVE_TEMA) {
      if (nar.dudaTema && !yaDudo) { yaDudo = true; await entra({ tipo: 'texto', texto: dice.duda }); }
      else await entra({ tipo: 'audio', mediaId: dice.historia });
    } else if (abierta === FOTO) {
      if (nar.foto) await entra({ tipo: 'imagen', mediaId: 'FOTO', mimeType: 'image/jpeg' });
      else await entra({ tipo: 'texto', texto: botones[0]?.texto ?? 'no', esBoton: true });
    } else if (vida) {
      const dicho = vida.respuestas[abierta];
      if (dicho) await entra({ tipo: 'audio', mediaId: dicho });
      else await entra({ tipo: 'texto', texto: botones[0]?.texto ?? dice.paso, ...(botones[0] ? { esBoton: true as const } : {}) });
    } else if (botones.length > 0 && r.si(0.4)) {
      await entra({ tipo: 'texto', texto: r.uno(botones).texto, esBoton: true });
    } else {
      const x = r.n();
      if (x < 0.05) await entra({ tipo: 'texto', texto: dice.paso });
      else if (x < 0.15) await entra({ tipo: 'texto', texto: dice.escrito });
      else {
        await entra({ tipo: 'audio', mediaId: r.uno(dice.cuenta) });
        if (r.si(0.2)) { pasar(MIN); await entra({ tipo: 'audio', mediaId: r.uno(dice.cuenta) }); }
      }
    }
    respuestas++;
    // 3' de silencio y cierra; lo que sigue sale en ese tick.
    pasar(4 * MIN);
    await tick();
  }

  // Los controles.
  const final = await fila();
  const nFinal = leerN();
  const ficha = { tema: nar.tema, idioma: nar.idioma };
  const delBanco = new Set(bancoHistoria(ficha.tema, nar.idioma, { temaAbierto: nar.temaAbierto }).preguntas.map((p) => p.id));
  const propias = new Set(PROPIAS.slice(0, nar.propias.length));
  const vistas = new Set<string>();
  for (const a of abiertas) {
    if (vistas.has(a)) mal('pregunta repetida', a);
    vistas.add(a);
    const origen = deRepregunta(a);
    const valida = a === CLAVE_TEMA || a === FOTO || propias.has(a) || delBanco.has(a) || (origen !== undefined && delBanco.has(origen));
    if (!valida) mal('pregunta de otro tema', `${a} (tema ${nar.tema})`);
  }
  for (const s of salidas) {
    const h = horaLocal(s.en, zona);
    if (h >= 22 || h < 8) mal('mensaje fuera de horario', `${s.en.toISOString()} (${h.toFixed(2)} h): ${s.texto.slice(0, 60)}`);
    if (s.texto.includes('{{')) mal('{{ sin reemplazar', s.texto.slice(0, 120));
  }
  for (const x of generoEquivocado(final)) mal('género que no corresponde', x);
  if (!final.estado.terminada || nFinal.estado !== 'completado') {
    mal('entrevista que no termina', `terminada=${final.estado.terminada}, estado=${nFinal.estado}, esperando=${final.estado.esperando ?? '—'}, cola=${final.estado.salientes.length}`);
  }
  return { narrador: nar, violaciones: v, charla, preguntas: vistas.size, dias: Math.ceil((reloj.getTime() - DESDE) / DIA), terminada: final.estado.terminada, conGenero: partesConGenero(final) };
}

// ---------------------------------------------------------------- main

async function main(args: string[]): Promise<void> {
  process.env.WA_PLANTILLAS_HISTORIA_LISTAS = IDIOMAS.flatMap((i) => ['bienvenida', 'bienvenida_regalo', 'bienvenida_regalo_abierta'].map((c) => `${i}:${c}`)).join(',');
  process.env.WA_PLANTILLAS_V3_LISTAS = IDIOMAS.flatMap((i) => ['pregunta', 'recordatorio'].map((c) => `${i}:${c}`)).join(',');
  if (args.includes('--semilla')) {
    const semilla = Number(args[args.indexOf('--semilla') + 1]);
    const idioma = (args.includes('--idioma') ? args[args.indexOf('--idioma') + 1] : 'es-AR') as Idioma;
    const c = await correr(narradorDe(semilla, idioma));
    console.log(JSON.stringify(c.narrador));
    for (const l of c.charla) console.log(`[${l.en.toISOString().slice(5, 16)}] ${l.de === 'bot' ? 'BOT' : 'NAR'}: ${l.texto.replace(/\n/g, ' ⏎ ')}`);
    console.log(c.violaciones.length === 0 ? 'Sin violaciones.' : c.violaciones.map((x) => `${x.control}: ${x.detalle}`).join('\n'));
    process.exitCode = c.violaciones.length > 0 ? 1 : 0;
    return;
  }
  const cantidad = Number(args.find((a) => /^\d+$/.test(a)) ?? 300);
  // Lo que el bot anota en el log (el cazador, los avisos) no se muestra: por narrador sale en --semilla.
  const log = console.log;
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  const porControl = new Map<string, string[]>();
  let terminadas = 0;
  let preguntas = 0;
  let dias = 0;
  let conGenero = 0;
  for (const idioma of IDIOMAS) {
    for (let s = 1; s <= cantidad; s++) {
      const nar = narradorDe(s, idioma);
      let c: Corrida;
      try {
        c = await correr(nar);
      } catch (err) {
        porControl.set('error', [...(porControl.get('error') ?? []), `${idioma} semilla ${s}: ${err instanceof Error ? err.message : String(err)}`]);
        continue;
      }
      if (c.terminada) terminadas++;
      preguntas += c.preguntas;
      dias += c.dias;
      conGenero += c.conGenero;
      for (const x of c.violaciones) porControl.set(x.control, [...(porControl.get(x.control) ?? []), `${idioma} semilla ${s} (${nar.tema}${nar.temaAbierto ? ', abierto' : ''}${nar.regalo ? ', regalo' : ''}, ${nar.genero}): ${x.detalle}`]);
    }
  }
  console.log = log;
  const total = cantidad * IDIOMAS.length;
  console.log(`Historia: ${total} narradores (${cantidad} por idioma). Terminaron ${terminadas}. Promedio: ${(preguntas / total).toFixed(1)} preguntas en ${(dias / total).toFixed(1)} días. Partes con marcas de género revisadas: ${conGenero}.`);
  for (const control of ['pregunta repetida', 'pregunta de otro tema', 'mensaje fuera de horario', 'entrevista que no termina', '{{ sin reemplazar', 'género que no corresponde', 'error']) {
    const xs = porControl.get(control) ?? [];
    console.log(`  ${control}: ${xs.length}`);
    for (const x of xs.slice(0, 5)) console.log(`    - ${x}`);
  }
  process.exitCode = [...porControl.values()].flat().length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`ERROR: ${err instanceof Error ? err.stack : String(err)}`);
    process.exit(1);
  });
}
