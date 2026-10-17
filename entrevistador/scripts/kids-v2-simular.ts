// Simulación de punta a punta del BOT de Kids V2 (plan-conexion-bot.md, T5): no solo el motor, el código de verdad del
// entrevistador (entrante, reloj, envío, la fila de kids_v2, respuestas, envios) sobre la base en memoria, con un
// WhatsApp falso y un reloj que avanza. Los chicos inventados del simulador del motor (nucleo/conductas.ts) contestan
// lo que les llega por WhatsApp: audio, foto, texto y botones (con el `context.id` del mensaje de verdad que tocaron).
// Por arriba, lo que sale mal en la vida real: Meta que reintenta un webhook, envíos que fallan, transcripciones que
// fallan, audios que no se bajan, el padre que cambia cosas en el panel, mensajes antes del arranque, plantillas que
// se aprueban tarde. Nada contra la base real; no gasta nada. Un tercio de los chicos en castellano de España (es-ES:
// las semillas 2, 3, 8, 9…) y un tercio en catalán (ca: 4, 5, 10, 11…); uno de cada cinco de ellos con el idioma
// solo en la columna kids_v2.idioma, sin ficha.idioma.
//
//   npm run kids-v2-simular                     # 200 chicos (semillas 1 a 200: canal A y B, todas las conductas)
//   npm run kids-v2-simular -- 50               # otra cantidad
//   npm run kids-v2-simular -- --semilla 7      # un chico, mensaje por mensaje, y sus violaciones
//
// Sale con código 1 si hay alguna violación. Chicos INVENTADOS: nunca la vida de un narrador real.

import { pathToFileURL } from 'node:url';
import { IDIOMAS_PLANTILLAS_KIDS, plantillaKidsLista, PLANTILLAS_KIDS } from '../src/config.js';
import type { IdiomaKids } from '../src/kids-v2/nucleo/idioma.js';
import type { DepsKids } from '../src/kids-v2/deps.js';
import { procesarEntranteKids } from '../src/kids-v2/entrante.js';
import { esChicoKids } from '../src/kids-v2/filas.js';
import { PREGUNTA_DEL_TEMA, TEMAS, type Ficha, type Tema } from '../src/kids-v2/nucleo/compra.js';
import { azar, chico, fichaAlAzar, frasePreocupanteDe, TIPOS_DE_CONDUCTA, type Azar, type TipoConducta } from '../src/kids-v2/nucleo/conductas.js';
import { revisar } from '../src/kids-v2/nucleo/controles.js';
import type { Accion, Corrida, Linea as LineaMotor } from '../src/kids-v2/nucleo/corrida.js';
import { aLocal, esDeNoche } from '../src/kids-v2/nucleo/horas.js';
import { proximoDespertar, type Enviado, type Estado, type Evento } from '../src/kids-v2/nucleo/motor.js';
import { VENTANA_MS } from '../src/kids-v2/nucleo/reglas.js';
import { RECONCILIAR_MS } from '../src/kids-v2/entrante.js';
import { tickKids } from '../src/kids-v2/reloj.js';
import type { CambiosPanel, FilaKids, Saliente } from '../src/kids-v2/tipos.js';
import { parsearEntrante, type MensajeEntrante } from '../src/whatsapp/webhook.js';
import { crearBaseFalsa, type BaseFalsa } from '../test/v3/base-falsa.js';

const MIN = 60_000;
const DIA = 86_400_000;
export const DESDE_SIM = '2026-10-06T15:00:00.000Z';
const ENV = 'WA_PLANTILLAS_KIDS_LISTAS';
const TODAS = Object.keys(PLANTILLAS_KIDS);
/** Las plantillas de un idioma que no son del primer mensaje (las que se pueden aprobar tarde sin frenar el arranque). */
const despuesDelArranque = (idioma: IdiomaKids) => {
  const { sufijo } = IDIOMAS_PLANTILLAS_KIDS[idioma];
  const arranque = ['kids_bienvenida', 'kids_bienvenida_plural', 'kids_bienvenida_padre', 'kids_aviso_padre'].map((x) => `${x}${sufijo}`);
  return TODAS.filter((p) => PLANTILLAS_KIDS[p].idioma === idioma && !arranque.includes(p));
};
/** En qué idioma va cada semilla si el plan no lo dice: 1 es-AR, 2 y 3 es-ES, 4 y 5 ca, 6 y 7 es-AR… (no va con el canal, que es par/impar). */
export const idiomaDeSemilla = (semilla: number): IdiomaKids => (['es-AR', 'es-ES', 'ca'] as const)[Math.floor(semilla / 2) % 3];
const HORAS = ['09:00', '13:30', '18:00', '19:15', '21:30'];
/** Cuántos ticks seguidos sin que cambie nada se corren minuto a minuto antes de saltar al próximo evento. */
const TICKS_QUIETOS = 30;

/** Lo que puede salir mal, y cuánto. Lo que no se pasa sale de la semilla. */
export type Plan = {
  semilla: number;
  canal?: 'A' | 'B';
  conducta?: TipoConducta;
  /** El idioma del chico (por defecto, idiomaDeSemilla). */
  idioma?: IdiomaKids;
  /** Probabilidad de que un envío a Meta falle. */
  pFalloEnvio?: number;
  /** Probabilidad de que Meta mande dos veces el mismo webhook (a la vez o minutos después). */
  pReintento?: number;
  /** Probabilidad de que la transcripción de un audio falle (las dos veces). */
  pTranscripcionFalla?: number;
  /** Probabilidad de que un audio no se pueda bajar de Meta (se pierde: aviso a los socios). */
  pAudioNoBaja?: number;
  /**
   * Probabilidad de que la base falle justo al guardar el paso de una respuesta (no de un botón): la fila de
   * `respuestas` queda sin clave y el motor no se entera hasta que el reloj la retoma (reconciliar, a los 5 minutos).
   */
  pFallaBase?: number;
  /** Cambios del panel del padre (hora, temas, sus preguntas) en momentos al azar. */
  panel?: boolean;
  /** El chico escribe antes de que arranque. */
  antesDelArranque?: boolean;
  /** Una plantilla (no del arranque) se aprueba recién a los tantos días. */
  plantillaTarde?: { nombre: string; dias: number };
  /** Plantillas aprobadas al arrancar (default todas). */
  aprobadas?: string[];
  dias?: number;
};

/** Lo que salió por el WhatsApp falso. `saliente`: el mensaje del motor que era (el primero de la cola al mandar). */
export type SalidaBot = {
  en: Date; a: string; tipo: 'texto' | 'botones' | 'plantilla'; wamid: string; texto?: string; botones?: string[];
  plantilla?: string; idiomaMeta?: string; variables?: string[]; saliente: Saliente | null; aprobada: boolean;
};
export type EntradaBot = { en: Date; wamid: string; dice: string; reintento: boolean };
export type Violacion = { control: string; detalle: string };

export type ResultadoSim = {
  semilla: number; canal: 'A' | 'B'; idioma: IdiomaKids; conducta: TipoConducta; ficha: Ficha;
  violaciones: Violacion[];
  dias: number; enviados: number; entradas: number; respuestas: number; reintentos: number; fallosEnvio: number; fallasBase: number; preguntasTarde: number;
  panel: number; marcas: string[]; termino: boolean;
  salidas: SalidaBot[]; charla: string[];
  base: BaseFalsa; fila: FilaKids;
};

/** Un "ogg" falso: la cabecera de una página Ogg (con la posición en muestras de 48 kHz = la duración) y lo que "dice". */
export function oggFalso(seg: number, dice: string): Buffer {
  const cab = Buffer.alloc(27);
  cab.write('OggS', 0, 'latin1');
  cab.writeBigUInt64LE(BigInt(Math.round(seg * 48_000)), 6);
  return Buffer.concat([cab, Buffer.from(dice, 'utf8')]);
}

/** El mediaId de un audio de la simulación: `sim|seg|modo|transcripción` (modo: ok, FALLA, NO-BAJA). */
const mediaAudio = (seg: number, modo: string, t?: string) => `sim|${seg}|${modo}|${encodeURIComponent(t ?? '')}`;

function webhook(from: string, id: string, cuerpo: Record<string, unknown>): unknown {
  return { entry: [{ changes: [{ value: { messages: [{ from: from.replace(/^\+/, ''), id, timestamp: '0', ...cuerpo }] } }] }] };
}

const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const ceilMin = (t: number) => Math.ceil(t / MIN) * MIN;

/** Corre un chico de punta a punta por el bot. */
export async function simularChico(plan: Plan): Promise<ResultadoSim> {
  const semilla = plan.semilla;
  const r = azar(semilla);
  const p: Azar = azar(semilla * 7919 + 17);
  const canal = plan.canal ?? (semilla % 2 === 0 ? 'A' : 'B');
  const tipo = plan.conducta ?? TIPOS_DE_CONDUCTA[semilla % TIPOS_DE_CONDUCTA.length];
  const idioma = plan.idioma ?? idiomaDeSemilla(semilla);
  const ficha = fichaAlAzar(r, canal, idioma === 'es-AR' ? undefined : idioma);
  // Uno de cada cinco de España o de Catalunya llega con el idioma solo en la columna (la ficha sin el campo): lo completa el arranque.
  const fichaCompra: Ficha = idioma !== 'es-AR' && semilla % 5 === 0 ? (({ idioma: _i, ...resto }) => resto)(ficha) : ficha;
  const conducta = chico(tipo, r, ficha);
  const pFallo = plan.pFalloEnvio ?? 0.02;
  const pReintento = plan.pReintento ?? 0.08;
  const pTranscripcion = plan.pTranscripcionFalla ?? 0.03;
  const pNoBaja = plan.pAudioNoBaja ?? 0.01;
  const pFallaBase = plan.pFallaBase ?? 0.01;
  const conPanel = plan.panel ?? p.si(0.5);
  const antesDelArranque = plan.antesDelArranque ?? p.si(0.1);
  const plantillaTarde = plan.plantillaTarde ?? (p.si(0.1) ? { nombre: p.uno(despuesDelArranque(idioma)), dias: p.entre(1, 20) } : undefined);
  const id = `kids-sim-${semilla}`;
  const num = String(semilla).padStart(6, '0');
  const telChico = `+549110${num}1`;
  const telPadre = `+549110${num}2`;
  const telPreguntas = canal === 'A' ? telChico : telPadre;
  const desde = new Date(DESDE_SIM).getTime();
  const fin = desde + (plan.dias ?? 365) * DIA;
  let reloj = new Date(desde);
  const v: Violacion[] = [];
  const mal = (control: string, detalle: string): void => { v.push({ control, detalle }); };
  const charla: string[] = [];
  const cuando = (d: Date) => { const h = aLocal(d, ficha.zona); return `${h.fecha} ${h.hora}`; };

  // Las plantillas aprobadas, en el momento (la variable se lee al mandar).
  const aprobadasAhora = () => {
    let lista = plan.aprobadas ?? TODAS;
    if (plantillaTarde && reloj.getTime() < desde + plantillaTarde.dias * DIA) lista = lista.filter((x) => x !== plantillaTarde.nombre);
    return lista.join(',');
  };
  const ponerEnv = () => { process.env[ENV] = aprobadasAhora(); };

  // La compra: la fila de kids_v2 y el narrador como los deja la web.
  const base = crearBaseFalsa({
    narradores: [{ id, nombre: ficha.nombre, como_le_dicen: ficha.apodo, telefono_whatsapp: telPreguntas, estado: 'invitado', contexto: { modo: 'kids' } }],
    kids_v2: [{
      narrador_id: id, idioma, canal, telefono_padre: telPadre, ficha: fichaCompra, estado: null, cambios_panel: null, cambios_error: null,
      avance: {}, marcas: [], version: 0, enviando_hasta: null, despertar_at: null, creada_at: reloj.toISOString(), empezo_at: null, termino_at: null,
    }],
    respuestas: [], envios: [], fotos: [],
  }, { ahora: () => reloj });
  const fila = () => base.tablas.kids_v2[0] as FilaKids;
  const narrador = () => base.tablas.narradores[0] as { id: string; estado: string; telefono_whatsapp: string; alerta_silencio?: boolean };

  // WhatsApp falso.
  const salidas: SalidaBot[] = [];
  let nSalida = 0;
  let fallosEnvio = 0;
  let forzarFallos = 0;
  const salir = (a: string, datos: Omit<SalidaBot, 'en' | 'a' | 'wamid' | 'saliente' | 'aprobada'>): Promise<string> => {
    if (forzarFallos > 0 || p.si(pFallo)) {
      if (forzarFallos > 0) forzarFallos--;
      fallosEnvio++;
      return Promise.reject(new Error('WhatsApp rechazó el envío (simulación)'));
    }
    const s = fila().estado?.salida[0] ?? null;
    const wamid = `wamid.${id}.s${++nSalida}`;
    const aprobada = datos.tipo !== 'plantilla' || plantillaKidsLista(datos.plantilla!);
    salidas.push({ en: new Date(reloj), a, wamid, ...datos, saliente: s ? copia(s) : null, aprobada });
    return Promise.resolve(wamid);
  };
  const avisos: { en: Date; clave: string; asunto: string }[] = [];
  const deps: DepsKids = {
    db: base.cliente,
    wa: {
      texto: (a, texto) => salir(a, { tipo: 'texto', texto }),
      botones: (a, texto, botones) => salir(a, { tipo: 'botones', texto, botones }),
      plantilla: (a, plantilla, idiomaMeta, variables) => salir(a, { tipo: 'plantilla', plantilla, idiomaMeta, variables }),
      descargar: async (mediaId) => {
        if (!mediaId.startsWith('sim|')) return Buffer.from(`foto ${mediaId}`, 'utf8');
        const [, seg, modo, t] = mediaId.split('|');
        if (modo === 'NO-BAJA') throw new Error('Meta no dio el audio (simulación)');
        return oggFalso(Number(seg), `${modo}|${decodeURIComponent(t)}`);
      },
    },
    transcribir: async (audio, o) => {
      if (o.idioma !== idioma) mal('idioma', `se transcribió en ${o.idioma} un audio de un chico en ${idioma}`);
      const seg = Number(audio.readBigUInt64LE(6)) / 48_000;
      const [modo, ...resto] = audio.subarray(27).toString('utf8').split('|');
      if (modo === 'FALLA') throw new Error('La transcripción falló (simulación)');
      return { texto: resto.join('|'), duracionSegundos: seg };
    },
    avisar: async (clave, asunto) => { avisos.push({ en: new Date(reloj), clave, asunto }); },
    ahora: () => reloj,
  };

  // Lo que pasa, en orden de tiempo.
  type Cosa = { en: number; n: number; hacer: () => Promise<void> };
  const cola: Cosa[] = [];
  let nCosa = 0;
  const agendar = (en: number, hacer: () => Promise<void>) => {
    cola.push({ en, n: ++nCosa, hacer });
    cola.sort((a, b) => a.en - b.en || a.n - b.n);
  };

  // Lo que mandó cada número (para la ventana de 24 h) y lo que llegó.
  const ultimaDe = new Map<string, number>();
  const entradas: EntradaBot[] = [];
  const lineas: LineaMotor[] = [];
  const recibidos: Corrida['recibidos'] = [];
  const vistosRecibidos = new Set<string>();
  const todo: Enviado[] = [];
  const envioAWamid = new Map<string, string>();
  const dichoPreocupante = new Set<string>();
  let reintentos = 0;
  let fallasBase = 0;
  /** Preguntas del padre que llegaron con el capítulo 4 empezado (cambios_error = preguntas-cerradas). */
  let preguntasTarde = 0;
  let nEntrada = 0;
  let pedidosPanel = 0;

  const flujo = (e: Estado | undefined) => JSON.stringify(e ? [e.fase, e.cursor, e.extra, e.fotosVencidas, e.reenviar] : null);

  /** Lo que llega por el webhook, como lo pasa procesar.ts (que lo desvía a Kids). */
  const entrar = async (cuerpo: unknown, reintento: boolean) => {
    const m = parsearEntrante(cuerpo) as MensajeEntrante | null;
    if (!m) return mal('webhook', `parsearEntrante no entendió ${JSON.stringify(cuerpo)}`);
    if (m.telefono !== telPreguntas) return mal('webhook', `llegó de ${m.telefono}, no del número de las preguntas`);
    ultimaDe.set(m.telefono, reloj.getTime());
    const n = narrador();
    if (n.estado === 'pendiente_pago' || !(await esChicoKids(base.cliente, n.id))) return mal('desvio', 'procesar.ts no lo mandaría a Kids');
    if (!reintento) entradas.push({ en: new Date(reloj), wamid: m.waMessageId, dice: m.tipo === 'texto' ? (m.esBoton ? `[${m.texto}]` : `texto: ${m.texto}`) : m.tipo, reintento });
    await procesarEntranteKids(deps, { id: n.id, estado: n.estado, telefono_whatsapp: n.telefono_whatsapp }, m);
  };

  /** Una acción del chico, como webhook (y, a veces, Meta lo manda dos veces). */
  const hacer = (a: Accion & { reenviado?: boolean }) => async (): Promise<void> => {
    const wamid = `wamid.${id}.e${++nEntrada}`;
    const ev = a.evento;
    let cuerpo: Record<string, unknown>;
    let evento: Evento;
    if (ev.tipo === 'boton') {
      const cita = ev.aMensaje !== undefined ? envioAWamid.get(ev.aMensaje) : undefined;
      if (ev.aMensaje !== undefined && !cita) mal('webhook', `el chico tocó un botón del envío ${ev.aMensaje}, que nunca salió`);
      const deMeta = todo.find((x) => x.envio === ev.aMensaje)?.plantilla;
      cuerpo = deMeta
        ? { type: 'button', button: { text: ev.boton, payload: ev.boton }, ...(cita ? { context: { id: cita } } : {}) }
        : { type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: `b-${ev.boton}`, title: ev.boton } }, ...(cita ? { context: { id: cita } } : {}) };
      evento = { ...ev, id: wamid };
    } else if (ev.tipo === 'respuesta') {
      const c = ev.contenido;
      if (c.tipo === 'audio') {
        const modo = !a.reenviado && p.si(pNoBaja) ? 'NO-BAJA' : p.si(pTranscripcion) ? 'FALLA' : 'ok';
        if (modo === 'NO-BAJA') {
          // Se pierde (Meta no lo da): el motor no se entera, los socios reciben el aviso, y el chico, que no ve
          // respuesta, lo vuelve a mandar al rato.
          charla.push(`${cuando(reloj)}    ${a.dice} (no se pudo bajar)`);
          await entrar(webhook(telPreguntas, wamid, { type: 'audio', audio: { id: mediaAudio(c.seg, modo), mime_type: 'audio/ogg; codecs=opus' } }), false);
          agendar(reloj.getTime() + p.entre(5, 30) * MIN, hacer({ ...a, reenviado: true }));
          return;
        }
        if (modo === 'ok' && c.transcripcion?.includes(frasePreocupanteDe(idioma))) dichoPreocupante.add(wamid);
        cuerpo = { type: 'audio', audio: { id: mediaAudio(c.seg, modo, c.transcripcion), mime_type: 'audio/ogg; codecs=opus' } };
      } else if (c.tipo === 'foto') {
        cuerpo = { type: 'image', image: { id: `foto-${wamid}`, mime_type: 'image/jpeg', sha256: `sha-${wamid}` } };
      } else {
        cuerpo = { type: 'text', text: { body: c.texto } };
      }
      evento = { ...ev, id: wamid };
    } else {
      return mal('conducta', `una acción que no es del chico: ${ev.tipo}`);
    }
    const w = webhook(telPreguntas, wamid, cuerpo);
    const motorAntes = fila().estado?.motor;
    const conRafaga = (motorAntes?.rafaga ?? null) !== null;
    const antes = flujo(motorAntes);
    const enviosAntes = motorAntes?.envios ?? 0;
    const linea: Extract<LineaMotor, { de: 'chico' }> = { en: new Date(reloj), de: 'chico', dice: a.dice, evento, viejo: a.viejo ?? false, efecto: false, conRafaga };
    lineas.push(linea);
    charla.push(`${cuando(reloj)}    ${a.dice}`);
    if (ev.tipo === 'respuesta' && p.si(pFallaBase)) {
      // La base falla en la escritura del paso: el webhook termina con error (y Meta lo puede reintentar: ya llegó).
      fallasBase++;
      base.fallarProxima.set('kids_v2', { code: 'XX000', message: 'la base falló (simulación)' });
      await entrar(w, false).catch(() => {});
      base.fallarProxima.delete('kids_v2');
      if (p.si(0.5)) agendar(reloj.getTime() + 30_000, () => entrar(w, true));
    } else if (p.si(pReintento)) {
      reintentos++;
      if (p.si(0.5)) {
        await Promise.all([entrar(w, false), entrar(w, true)]);
      } else {
        await entrar(w, false);
        agendar(reloj.getTime() + p.entre(0, 10) * MIN + 1_000, () => entrar(w, true));
      }
    } else {
      await entrar(w, false);
    }
    // Hizo algo si el motor sacó mensajes o movió el flujo (no por lo que había quedado en la cola y salió ahora).
    linea.efecto = (fila().estado?.motor.envios ?? 0) > enviosAntes || antes !== flujo(fila().estado?.motor);
  };

  /** Un cambio del panel, como lo escribe la web: fusiona en `cambios_panel` sin tocar `version`. */
  const pedirAlPanel = (cambios: CambiosPanel) => async () => {
    const f = fila();
    if (f.termino_at) return;
    pedidosPanel++;
    f.cambios_panel = { ...(f.cambios_panel ?? {}), ...cambios, pedido_at: reloj.toISOString() };
    charla.push(`${cuando(reloj)}    (panel) ${JSON.stringify(cambios)}`);
  };

  /** Después de cada cosa: lo que salió le llega al chico (y decide), lo que aplicó el panel, los recibidos y las marcas. */
  let vistasSalidas = 0;
  const decidido = new Map<string, Date>();
  let marcasVistas = 0;
  let panelAntes: CambiosPanel | null = null;
  let avanceAntes: FilaKids['avance'] = {};
  let horaVieja = ficha.hora;
  /** El padre cambió la hora: el control de lo preocupante del motor usa la hora de la ficha (la final) y no aplica. */
  let cambioLaHora = false;
  const despues = () => {
    const f = fila();
    // El panel: si se tomó, que haya quedado lo pedido.
    if (panelAntes && f.cambios_panel === null) {
      const motor = f.estado?.motor;
      const err = f.cambios_error;
      if (motor) {
        if (err && err !== 'preguntas-cerradas') mal('panel', `el motor rechazó un cambio válido ${JSON.stringify(panelAntes)}: ${err}`);
        if (!err || err === 'preguntas-cerradas') {
          if (panelAntes.hora && panelAntes.hora !== horaVieja) cambioLaHora = true;
          if (panelAntes.hora && motor.ficha.hora !== panelAntes.hora) mal('panel', `pidió la hora ${panelAntes.hora} y quedó ${motor.ficha.hora}`);
          if (panelAntes.temasSacados && [...motor.ficha.temasSacados].sort().join() !== [...panelAntes.temasSacados].sort().join()) mal('panel', `pidió sacar [${panelAntes.temasSacados}] y quedó [${motor.ficha.temasSacados}]`);
        }
        if (panelAntes.preguntasPadre) {
          const quedo = motor.ficha.preguntasPadre.map((x) => x.texto).join('|');
          const pidio = panelAntes.preguntasPadre.map((x) => x.texto).join('|');
          const abiertas = 'preguntasPadreAbiertas' in avanceAntes ? avanceAntes.preguntasPadreAbiertas : true;
          if (err === 'preguntas-cerradas') preguntasTarde++;
          if (err === 'preguntas-cerradas' && abiertas) mal('panel', 'dijo preguntas-cerradas con las preguntas abiertas');
          if (!err && quedo !== pidio) mal('panel', `pidió las preguntas [${pidio}] y quedaron [${quedo}]`);
        }
      }
    }
    panelAntes = f.cambios_panel ? copia(f.cambios_panel) : null;
    horaVieja = f.estado?.motor.ficha.hora ?? ficha.hora;
    avanceAntes = copia(f.avance);
    // Recibidos (los nuevos de esta cosa).
    for (const x of f.estado?.recibidos ?? []) {
      if (vistosRecibidos.has(x.id)) continue;
      vistosRecibidos.add(x.id);
      recibidos.push({ en: new Date(reloj), id: x.id, clave: x.clave });
    }
    // Marcas.
    for (const m of f.marcas.slice(marcasVistas)) {
      lineas.push({ en: new Date(m.at), de: 'marca', motivo: m.motivo, detalle: m.detalle });
      charla.push(`${cuando(new Date(m.at))}    MARCA ${m.motivo}`);
    }
    marcasVistas = f.marcas.length;
    // Cuándo lo decidió el motor (entró a la cola): para sus controles cuenta eso; para la noche y la ventana, cuándo salió.
    for (const x of f.estado?.salida ?? []) if (!decidido.has(x.envio)) decidido.set(x.envio, new Date(reloj));
    // Lo que salió.
    const llegaron: Enviado[] = [];
    for (const s of salidas.slice(vistasSalidas)) {
      if (!s.saliente) {
        mal('unaVez', `salió ${s.wamid} sin mensaje del motor en la cola`);
        continue;
      }
      const m = s.saliente;
      envioAWamid.set(m.envio, s.wamid);
      llegaron.push(m);
      todo.push(m);
      lineas.push({ en: decidido.get(m.envio) ?? s.en, de: 'bot', mensaje: m });
      charla.push(`${cuando(s.en)} →  ${m.a} ${m.id}${s.tipo === 'plantilla' ? ` (plantilla ${s.plantilla})` : ''} [${m.botones.join('|')}]`);
    }
    vistasSalidas = salidas.length;
    if (llegaron.length && f.estado) {
      for (const a of conducta(llegaron, { estado: f.estado.motor, ahora: new Date(reloj), todo })) agendar(reloj.getTime() + a.trasMs, hacer(a));
    }
  };

  // Lo agendado de entrada: el mensaje antes del arranque y los cambios del panel.
  if (antesDelArranque) {
    agendar(desde + 20_000, async () => {
      const wamid = `wamid.${id}.antes`;
      charla.push(`${cuando(reloj)}    (antes del arranque) texto: hola`);
      await entrar(webhook(telPreguntas, wamid, { type: 'text', text: { body: 'hola' } }), false);
    });
  }
  if (conPanel) {
    for (let i = p.entre(1, 3); i > 0; i--) {
      const en = desde + p.entre(0, 20) * DIA + p.entre(0, 1439) * MIN;
      const que = p.uno(['hora', 'temas', 'preguntas'] as const);
      const cambios: CambiosPanel = que === 'hora' ? { hora: p.uno(HORAS) }
        : que === 'temas' ? { temasSacados: TEMAS.filter(() => p.si(0.25)) as Tema[] }
        : { preguntasPadre: Array.from({ length: p.entre(1, 3) }, (_, k) => ({ texto: `Contame la vez número ${k + 1} que fuimos a la plaza`, conLinea: p.si(0.5) })) };
      agendar(en, pedirAlPanel(cambios));
    }
  }

  // El reloj de producción: un tick por minuto (acá, solo en los minutos en que hay algo que hacer).
  // La web crea la fila en `desde`; el primer tick que la ve es el del minuto siguiente.
  let ultimoTick = desde;
  let quietos = 0;
  const proximoTick = (): number => {
    const f = fila();
    let t = Infinity;
    if (!f.estado || f.cambios_panel) t = reloj.getTime();
    if (f.despertar_at) t = Math.min(t, Date.parse(f.despertar_at));
    for (const x of base.tablas.respuestas) if (x.clave_kids == null) t = Math.min(t, Date.parse(x.recibido_at) + RECONCILIAR_MS + 1);
    if (!Number.isFinite(t)) return t;
    let en = Math.max(ceilMin(t), ultimoTick + MIN);
    if (quietos >= TICKS_QUIETOS) {
      // Una cola trabada (una plantilla sin aprobar, un envío que falla): el tick de cada minuto no cambia nada hasta
      // que pasa algo de afuera o lo que espera el motor; se salta hasta ahí.
      const motor = f.estado?.motor;
      const delMotor = motor ? proximoDespertar(motor, reloj)?.getTime() ?? Infinity : Infinity;
      const aprobacion = plantillaTarde ? desde + plantillaTarde.dias * DIA : Infinity;
      const salto = Math.min(cola[0]?.en ?? Infinity, Math.max(delMotor, reloj.getTime() + MIN), aprobacion > reloj.getTime() ? aprobacion : Infinity);
      if (Number.isFinite(salto)) en = Math.max(en, ceilMin(salto));
    }
    return en;
  };

  for (;;) {
    const tick = proximoTick();
    const cosa = cola[0];
    const siguiente = Math.min(tick, cosa?.en ?? Infinity);
    if (!Number.isFinite(siguiente) || siguiente > fin) break;
    reloj = new Date(Math.max(siguiente, reloj.getTime()));
    ponerEnv();
    if (cosa && cosa.en <= tick) {
      cola.shift();
      await cosa.hacer();
    } else {
      ultimoTick = tick;
      // Quieto: no salió nada y no cambió nada más que la toma (que se toma y se suelta en cada intento de mandar).
      const lo = () => { const x = fila(); return JSON.stringify([x.estado, x.despertar_at, x.cambios_panel, x.marcas.length, x.termino_at]); };
      const antes = lo();
      const nSal = salidas.length;
      await tickKids(deps);
      quietos = salidas.length === nSal && lo() === antes ? quietos + 1 : 0;
    }
    despues();
  }

  // Los controles del bot.
  const f = fila();
  const motor = f.estado?.motor;
  const n = narrador();
  const zona = ficha.zona;
  const plantillas = (s: SalidaBot) => s.tipo === 'plantilla';
  for (const s of salidas) {
    const m = s.saliente;
    if (esDeNoche(s.en, zona)) mal('noche', `${m?.id ?? s.wamid} salió a las ${cuando(s.en)}`);
    if (!plantillas(s)) {
      const u = ultimaDe.get(s.a);
      if (u === undefined || s.en.getTime() - u >= VENTANA_MS) mal('ventana', `${m?.id} salió como texto libre a ${s.a === telPadre ? 'el padre' : 'el chico'} el ${cuando(s.en)} con la ventana cerrada (lo último de ese número: ${u === undefined ? 'nunca' : cuando(new Date(u))})`);
    }
    if (plantillas(s) && !s.aprobada) mal('plantillas', `salió la plantilla ${s.plantilla} sin estar aprobada`);
    const { sufijo, idiomaMeta } = IDIOMAS_PLANTILLAS_KIDS[idioma];
    if (plantillas(s) && (s.idiomaMeta !== idiomaMeta || !s.plantilla!.endsWith(sufijo) || PLANTILLAS_KIDS[s.plantilla!]?.idioma !== idioma)) {
      mal('idioma', `salió la plantilla ${s.plantilla} (${s.idiomaMeta}) a un chico en ${idioma}`);
    }
    if (!m) continue;
    if (Boolean(m.plantilla) !== plantillas(s)) mal('forma', `${m.id} salió como ${s.tipo} y el motor lo pidió ${m.plantilla ? 'como plantilla' : 'como texto'}`);
    if (m.plantilla && (s.plantilla !== m.plantilla.nombre || JSON.stringify(s.variables) !== JSON.stringify(m.plantilla.variables))) mal('forma', `${m.id}: la plantilla no es la que pidió el motor`);
    if (!m.plantilla && (s.texto !== m.texto || JSON.stringify(s.botones ?? []) !== JSON.stringify(m.botones))) mal('forma', `${m.id}: el texto o los botones no son los del motor`);
    const destino = m.a === 'padre' ? telPadre : canal === 'A' ? telChico : telPadre;
    if (s.a !== destino) mal('destino', `${m.id} (para ${m.a}) fue a ${s.a}`);
    if (canal === 'B' && s.a !== telPadre) mal('destino', `canal B: ${m.id} no fue al padre`);
  }
  const porEnvio = new Map<string, number>();
  for (const s of salidas) if (s.saliente) porEnvio.set(s.saliente.envio, (porEnvio.get(s.saliente.envio) ?? 0) + 1);
  for (const [envio, k] of porEnvio) if (k > 1) mal('unaVez', `el envío ${envio} salió ${k} veces`);
  if (motor) {
    for (let i = 1; i <= motor.envios; i++) if (!porEnvio.has(String(i))) mal('unaVez', `el envío ${i} del motor nunca salió`);
    if (f.estado!.salida.length) mal('unaVez', `quedaron ${f.estado!.salida.length} mensajes en la cola (${f.estado!.salida.map((s) => s.id).join(', ')})`);
  }
  const envios = base.tablas.envios.filter((e) => e.tipo === 'kids').map((e) => e.wa_message_id as string).sort();
  const mandados = salidas.map((s) => s.wamid).sort();
  if (JSON.stringify(envios) !== JSON.stringify(mandados)) mal('envios', `envios tipo kids (${envios.length}) no coincide con lo mandado (${mandados.length})`);
  if (base.tablas.envios.some((e) => e.narrador_id !== id || e.tipo !== 'kids')) mal('envios', 'hay envios de otro tipo o de otro narrador');
  const rs = base.tablas.respuestas;
  for (const x of rs) if (x.clave_kids == null) mal('clave', `la respuesta ${x.wa_message_id} quedó sin clave_kids`);
  const ids = rs.map((x) => x.wa_message_id as string);
  if (new Set(ids).size !== ids.length) mal('clave', 'hay dos filas de respuestas con el mismo wa_message_id');
  for (const e of entradas) if (!ids.includes(e.wamid) && !avisos.some((a) => a.clave === `kids-audio-${id}-${e.wamid}`)) mal('clave', `lo que mandó (${e.dice}, ${e.wamid}) no quedó en respuestas ni se avisó`);
  if (!f.termino_at) mal('termino', `no terminó: quedó en ${motor?.fase.tipo ?? 'sin arrancar'} (${motor?.guion[motor.cursor]?.clave ?? '-'})`);
  if (f.termino_at && n.estado !== 'completado') mal('termino', `terminó y el narrador quedó «${n.estado}»`);
  if (f.termino_at && !(f.avance as { terminado?: boolean }).terminado) mal('termino', 'terminó y avance.terminado no es true');
  if (f.enviando_hasta) mal('toma', 'quedó tomado el turno');
  // Las marcas: cada una avisada una vez, sin repetir, la alerta de silencio con la suya, lo preocupante marcado.
  const claves = new Set<string>();
  f.marcas.forEach((m, i) => {
    const clave = `kids-${id}-${m.motivo}-${i + 1}`;
    if (!avisos.some((a) => a.clave === clave)) mal('marcas', `la marca ${m.motivo} n.º ${i + 1} no se avisó a los socios`);
    const k = `${m.motivo}@${m.at}`;
    if (claves.has(k)) mal('marcas', `la marca ${m.motivo} está dos veces (${m.at})`);
    claves.add(k);
  });
  const conSilencio = f.marcas.some((m) => m.motivo === 'silencio-8-dias');
  if (conSilencio !== (n.alerta_silencio === true)) mal('marcas', `alerta_silencio ${n.alerta_silencio} y marca de silencio ${conSilencio}`);
  const aplicadoPreocupante = [...dichoPreocupante].some((w) => { const c = rs.find((x) => x.wa_message_id === w)?.clave_kids; return c && c !== '∅'; });
  if (aplicadoPreocupante && !f.marcas.some((m) => m.motivo === 'preocupante')) mal('marcas', 'contó algo preocupante y no quedó la marca');
  for (const a of avisos) {
    if (/^kids-ventana-/.test(a.clave)) mal('ventana', `aviso: ${a.asunto}`);
    if (/^kids-plantilla-/.test(a.clave) && !(plantillaTarde && a.clave === `kids-plantilla-${plantillaTarde.nombre}`)) mal('plantillas', `aviso: ${a.asunto}`);
    if (/^kids-panel-/.test(a.clave)) mal('panel', `aviso: ${a.asunto}`);
    if (/^kids-ficha-/.test(a.clave)) mal('ficha', `aviso: ${a.asunto}`);
  }
  // Los controles del motor, sobre lo que de verdad salió por WhatsApp y cuándo (con la ficha final: el panel la cambia).
  if (motor && motor.ficha.idioma !== (idioma === 'es-AR' ? undefined : idioma)) mal('idioma', `el motor arrancó con idioma ${motor.ficha.idioma ?? '(sin campo)'} y el chico es ${idioma}`);
  if (motor) {
    const corrida: Corrida = { lineas: [...lineas].sort((a, b) => a.en.getTime() - b.en.getTime()), estado: motor, pasos: 0, recibidos };
    for (const x of revisar(fichaDelGuion(motor), corrida, { sigueContestando: true })) {
      if (x.control === 'preocupante' && cambioLaHora) continue;
      mal(`motor:${x.control}`, x.detalle);
    }
  }

  const ultima = Math.max(...salidas.map((s) => s.en.getTime()), f.termino_at ? Date.parse(f.termino_at) : desde);
  return {
    semilla, canal, idioma, conducta: tipo, ficha, violaciones: v,
    dias: Math.ceil((ultima - desde) / DIA), enviados: salidas.length, entradas: entradas.length, respuestas: rs.length, reintentos, fallosEnvio, fallasBase, preguntasTarde,
    panel: pedidosPanel, marcas: f.marcas.map((m) => m.motivo), termino: !!f.termino_at,
    salidas, charla, base, fila: f,
  };
}

/**
 * La ficha cuyo guion es el que tiene el motor: si el padre sacó un tema cuando su pregunta ya había salido, el motor
 * la deja en el guion (y su foto no se muda) aunque la ficha diga que está sacado. Los controles del motor arman el
 * guion con la ficha: se les pasa esta.
 */
export function fichaDelGuion(e: Estado): Ficha {
  const enElGuion = new Set(e.guion.map((x) => x.clave));
  const temas = TEMAS.filter((t) => (t === 'escuela' ? e.ficha.temasSacados.includes(t) : !enElGuion.has(PREGUNTA_DEL_TEMA[t])));
  return { ...e.ficha, temasSacados: temas as Tema[] };
}

/** Muchos chicos, en orden de semilla (de a uno: la variable de las plantillas es del proceso). */
export async function simularMuchos(n: number, o: Omit<Plan, 'semilla'> = {}, desde = 1): Promise<ResultadoSim[]> {
  const previo = process.env[ENV];
  const rs: ResultadoSim[] = [];
  try {
    for (let s = desde; s < desde + n; s++) rs.push(await simularChico({ ...o, semilla: s }));
  } finally {
    if (previo === undefined) delete process.env[ENV];
    else process.env[ENV] = previo;
  }
  return rs;
}

async function main() {
  const arg = process.argv.slice(2);
  // Lo del bot que se loguea (console.warn/error) es lo esperable de lo que sale mal a propósito: se calla.
  const callar = !arg.includes('--ruido');
  const log = { warn: console.warn, error: console.error };
  if (callar) { console.warn = () => {}; console.error = () => {}; }
  try {
    if (arg[0] === '--semilla') {
      const [r] = await simularMuchos(1, {}, Number(arg[1]));
      console.log(`semilla ${r.semilla}: ${r.conducta}, ${r.idioma}, canal ${r.canal}, hora ${r.ficha.hora}, ${r.ficha.zona}, temas [${r.ficha.temasSacados.join(', ')}]`);
      for (const l of r.charla) console.log(l);
      console.log(r.violaciones.length ? r.violaciones : 'sin violaciones');
      if (r.violaciones.length) process.exitCode = 1;
      return;
    }
    const n = Number(arg.find((a) => /^\d+$/.test(a)) ?? 200);
    const t0 = Date.now();
    const rs = await simularMuchos(n);
    const porControl = new Map<string, string[]>();
    for (const r of rs) for (const x of r.violaciones) porControl.set(x.control, [...(porControl.get(x.control) ?? []), `semilla ${r.semilla} (${r.conducta}, ${r.canal}, ${r.idioma}): ${x.detalle}`]);
    const dias = rs.map((r) => r.dias).sort((a, b) => a - b);
    const suma = (k: keyof ResultadoSim) => rs.reduce((a, r) => a + (r[k] as number), 0);
    const marcas = new Map<string, number>();
    for (const r of rs) for (const m of r.marcas) marcas.set(m, (marcas.get(m) ?? 0) + 1);
    console.log(`Kids V2 · simulación del bot: ${n} chicos (canal A ${rs.filter((r) => r.canal === 'A').length}, B ${rs.filter((r) => r.canal === 'B').length}; es-AR ${rs.filter((r) => r.idioma === 'es-AR').length}, es-ES ${rs.filter((r) => r.idioma === 'es-ES').length}, ca ${rs.filter((r) => r.idioma === 'ca').length}; ${TIPOS_DE_CONDUCTA.length} conductas)`);
    console.log(`- Terminaron: ${rs.filter((r) => r.termino).length} de ${n}. Días de punta a punta: mediana ${dias[Math.floor(n / 2)]}, máximo ${dias[n - 1]}.`);
    console.log(`- Mensajes del bot: ${suma('enviados')}; mensajes de los chicos: ${suma('entradas')} (Meta reintentó ${suma('reintentos')}); envíos que fallaron: ${suma('fallosEnvio')}; la base falló ${suma('fallasBase')} (lo retomó el reloj); cambios del panel: ${suma('panel')} (preguntas del padre tarde: ${suma('preguntasTarde')}).`);
    console.log(`- Marcas: ${[...marcas].map(([k, x]) => `${k} ${x}`).join(', ') || 'ninguna'}.`);
    for (const [k, xs] of porControl) {
      console.log(`\n## ${k} (${xs.length})`);
      for (const x of xs.slice(0, 8)) console.log(`- ${x}`);
    }
    const total = [...porControl.values()].flat().length;
    console.log(`\n${total === 0 ? 'cero violaciones' : `${total} violaciones`} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    if (total) process.exitCode = 1;
  } finally {
    console.warn = log.warn;
    console.error = log.error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main();
