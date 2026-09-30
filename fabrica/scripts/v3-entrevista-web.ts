// Mini app web LOCAL para que Naza pruebe la entrevista V3 como narrador,
// desde el navegador de su PC, como si fuera WhatsApp: contesta con audio
// grabado en la página (o con texto) y toca los botones. Usa el mismo motor
// que las simulaciones (`v3-entrevista-turno.ts`: nuevaEntrevista, responder,
// tocarBoton, charlaMd); acá solo hay HTTP, disco y transcripción.
//
//   npx tsx scripts/v3-entrevista-web.ts [--puerto 5178] [--nombre Naza --genero varon] [--env <ruta .env>] [--datos <carpeta>]
//
// Guarda todo en audios-crudos/v3-web/<nombre>/ (en .gitignore: voces reales):
// estado.json, audios/<NN>-<ID>.webm, transcripciones.jsonl y charla.md.
// La transcripción es PAGA (OpenAI, unos centavos por minuto).
// Guía: docs/v3/entrevista/prueba-web.md

import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type RequestListener, type ServerResponse } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preguntaPorId } from '../src/v3/entrevista/banco.js';
import { leerKeyOpenAI, taparKey, transcribirConOpenAI, type Transcribir } from '../src/v3/entrevista/transcribir.js';
import { charlaMd, nuevaEntrevista, responder, textoDeGlobo, tocarBoton, type EstadoSimulacion, type Globo } from './v3-entrevista-turno.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const HTML = join(AQUI, 'v3-entrevista-web.html');

// ---------------------------------------------------------------- vista

/** Un globo como lo ve el narrador: sin IDs ni títulos de bloque. */
export type GloboVista = { de: 'bio'; texto: string } | { de: 'narrador'; texto: string; audio?: true; boton?: true };

/** Lo que devuelve /api/estado (y todo POST que sale bien). */
export type Vista = {
  hay: boolean;
  nombre?: string;
  globos: GloboVista[];
  /** Los botones de la pregunta abierta (vacío si no tiene, o si ya tocó "Sí"). */
  botones: string[];
  /** La pregunta abierta pide una foto (FO1): en la prueba web se cuenta con audio o texto. */
  esperaFoto: boolean;
  terminada: boolean;
  minutosTranscriptos: number;
  /** Dónde queda la charla con IDs, para el equipo. */
  charla?: string;
};

/** La respuesta de un audio: se guarda en el globo del narrador para mostrarlo como audio. */
type GloboPersonaWeb = Extract<Globo, { de: 'persona' }> & { audio?: string };

/** Los botones que tiene la pregunta que espera (ninguno si ya tocó "Sí" y ahora va el audio). */
export function botonesAbiertos(e: EstadoSimulacion): string[] {
  if (e.terminada || !e.esperando || e.tocoSi) return [];
  return (preguntaPorId(e.esperando)?.botones ?? []).map((b) => b.texto);
}

export function globosParaNarrador(e: EstadoSimulacion): GloboVista[] {
  return e.charla.flatMap((g): GloboVista[] => {
    if (g.de === 'bio') return [{ de: 'bio', texto: textoDeGlobo(g.partes) }];
    if (g.de === 'persona') {
      const p = g as GloboPersonaWeb;
      if (p.boton !== undefined) return [{ de: 'narrador', texto: p.boton, boton: true }];
      if (p.audio) return [{ de: 'narrador', texto: p.texto, audio: true }];
      return [{ de: 'narrador', texto: p.texto }];
    }
    return [];
  });
}

// ---------------------------------------------------------------- disco

/** "Nazareno Pérez" → "nazareno-perez". */
export function carpetaDeNombre(nombre: string): string {
  const s = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return s || 'narrador';
}

/** Escritura atómica: archivo temporal + rename (si se corta la luz, queda el anterior entero). */
function escribirAtomico(ruta: string, contenido: string): void {
  const tmp = `${ruta}.${process.pid}.tmp`;
  writeFileSync(tmp, contenido, 'utf8');
  for (let i = 0; ; i++) {
    try {
      renameSync(tmp, ruta);
      return;
    } catch (err) {
      // Windows: un antivirus o el indexador pueden tener el archivo abierto un instante.
      if (i >= 5 || (err as NodeJS.ErrnoException).code !== 'EPERM') throw err;
    }
  }
}

function fechaParaArchivo(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const EXTENSIONES: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav' };
const TIPOS: Record<string, string> = Object.fromEntries(Object.entries(EXTENSIONES).map(([t, e]) => [e, t]));

// ---------------------------------------------------------------- servidor

export type OpcionesWeb = {
  /** La carpeta donde va cada narrador (audios-crudos/v3-web). */
  datos: string;
  transcribir: Transcribir;
  log?: (linea: string) => void;
  /** Si viene, arranca con este narrador (y con `genero`, crea la entrevista si no hay). */
  nombre?: string;
  genero?: 'varon' | 'mujer';
};

class ErrorHttp extends Error {
  constructor(readonly status: number, mensaje: string, readonly extra: Record<string, unknown> = {}) {
    super(mensaje);
  }
}

const LIMITE_AUDIO = 50 * 1024 * 1024;

export function crearManejador(o: OpcionesWeb): RequestListener {
  const log = (s: string) => (o.log ?? console.log)(taparKey(s));
  mkdirSync(o.datos, { recursive: true });
  const rutaActual = join(o.datos, 'actual.txt');

  let actual: { carpeta: string; estado: EstadoSimulacion } | undefined;
  const dir = () => join(o.datos, actual!.carpeta);

  function cargar(carpeta: string): void {
    const ruta = join(o.datos, carpeta, 'estado.json');
    actual = existsSync(ruta) ? { carpeta, estado: JSON.parse(readFileSync(ruta, 'utf8')) as EstadoSimulacion } : undefined;
  }

  function guardar(estado: EstadoSimulacion): void {
    actual!.estado = estado;
    const d = dir();
    mkdirSync(join(d, 'audios'), { recursive: true });
    escribirAtomico(join(d, 'estado.json'), JSON.stringify(estado, null, 1));
    const md = charlaMd(estado, `Prueba web: ${estado.ficha.nombre}`).replace(
      /^\*\*Qué es:\*\*.*$/m,
      `**Qué es:** la entrevista de ${estado.ficha.nombre}, contestada por quien la vive en la prueba web local (\`fabrica/scripts/v3-entrevista-web.ts\`), con el código de \`fabrica/src/v3/entrevista/\` haciendo de WhatsApp. Los audios y sus transcripciones están al lado, en \`audios/\` y \`transcripciones.jsonl\`.`,
    );
    escribirAtomico(join(d, 'charla.md'), md);
    escribirAtomico(rutaActual, actual!.carpeta);
  }

  function minutosTranscriptos(): number {
    if (!actual) return 0;
    const ruta = join(dir(), 'transcripciones.jsonl');
    if (!existsSync(ruta)) return 0;
    const segundos = readFileSync(ruta, 'utf8')
      .split('\n')
      .filter((l) => l.trim())
      .reduce((s, l) => s + ((JSON.parse(l) as { duracion: number | null }).duracion ?? 0), 0);
    return Math.round((segundos / 60) * 10) / 10;
  }

  function vista(): Vista {
    if (!actual) return { hay: false, globos: [], botones: [], esperaFoto: false, terminada: false, minutosTranscriptos: 0 };
    const e = actual.estado;
    return {
      hay: true,
      nombre: e.ficha.nombre,
      globos: globosParaNarrador(e),
      botones: botonesAbiertos(e),
      esperaFoto: !e.terminada && !!e.esperando && preguntaPorId(e.esperando)?.clase === 'foto',
      terminada: e.terminada,
      minutosTranscriptos: minutosTranscriptos(),
      charla: join(dir(), 'charla.md'),
    };
  }

  function nueva(nombre: string, genero: 'varon' | 'mujer', forzar: boolean): void {
    const carpeta = carpetaDeNombre(nombre);
    const enCurso = actual && !actual.estado.terminada;
    const ruta = join(o.datos, carpeta);
    const existe = existsSync(join(ruta, 'estado.json'));
    if ((enCurso || existe) && !forzar) {
      throw new ErrorHttp(409, existe ? `Ya hay una entrevista de ${nombre}. Si querés empezar de cero, la anterior se guarda con la fecha.` : 'Hay una entrevista en curso.', { enCurso: true });
    }
    if (existsSync(ruta)) {
      // Nunca se borra: la anterior queda con la fecha en el nombre.
      let destino = `${ruta}-${fechaParaArchivo()}`;
      for (let i = 2; existsSync(destino); i++) destino = `${ruta}-${fechaParaArchivo()}-${i}`;
      renameSync(ruta, destino);
      log(`La entrevista anterior quedó en ${destino}`);
    }
    actual = { carpeta, estado: nuevaEntrevista({ nombre, genero }).estado };
    guardar(actual.estado);
    log(`Nueva entrevista: ${nombre} (${carpeta})`);
  }

  function hayQueContestar(): EstadoSimulacion {
    if (!actual) throw new ErrorHttp(409, 'Todavía no hay entrevista: empezá una.');
    if (actual.estado.terminada) throw new ErrorHttp(409, 'La entrevista ya terminó.');
    return actual.estado;
  }

  /** Corre el motor; sus errores (respuesta vacía, botón que no existe) son del que contesta: 400. */
  function motor(f: () => { estado: EstadoSimulacion }): void {
    let r: { estado: EstadoSimulacion };
    try {
      r = f();
    } catch (err) {
      throw new ErrorHttp(400, (err as Error).message);
    }
    guardar(r.estado);
  }

  /** Transcribe un audio ya guardado y lo manda como respuesta. Si falla, el audio queda para reintentar. */
  async function contestarConAudio(archivo: string, pregunta: string, tipo: string): Promise<string> {
    const nombreArchivo = archivo.slice('audios/'.length);
    const audio = readFileSync(join(dir(), archivo));
    let t;
    try {
      t = await o.transcribir(audio, { tipo, nombreArchivo, narrador: actual!.estado.ficha.nombre });
    } catch (err) {
      throw new ErrorHttp(502, taparKey((err as Error).message), { reintentar: archivo });
    }
    appendFileSync(join(dir(), 'transcripciones.jsonl'), JSON.stringify({ archivo, pregunta, texto: t.texto, duracion: t.duracionSegundos, fecha: new Date().toISOString() }) + '\n', 'utf8');
    if (t.texto.trim() === '') throw new ErrorHttp(502, 'El audio llegó sin palabras (¿se grabó el silencio?). Probá de nuevo.', { reintentar: archivo });
    motor(() => {
      const r = responder(actual!.estado, t.texto);
      const ultimo = r.estado.charla.findLast((g) => g.de === 'persona') as GloboPersonaWeb;
      ultimo.audio = archivo;
      return r;
    });
    log(`Audio ${archivo}: ${t.duracionSegundos ?? '?'} s transcriptos`);
    return t.texto;
  }

  // Arranque: el narrador de la línea de comandos, o el último que se usó.
  const inicial = o.nombre ? carpetaDeNombre(o.nombre) : existsSync(rutaActual) ? readFileSync(rutaActual, 'utf8').trim() : undefined;
  if (inicial) cargar(inicial);
  if (!actual && o.nombre && o.genero) nueva(o.nombre, o.genero, false);

  // De a una escritura por vez: dos clicks rápidos no pisan el estado.
  let cola: Promise<unknown> = Promise.resolve();
  const enSerie = <T>(f: () => Promise<T> | T): Promise<T> => {
    const p = cola.then(f);
    cola = p.catch(() => {});
    return p;
  };

  const rutas: Record<string, (cuerpo: Buffer, req: IncomingMessage) => Promise<Record<string, unknown>> | Record<string, unknown>> = {
    '/api/nueva': (c) => {
      const { nombre, genero, forzar } = json(c);
      if (typeof nombre !== 'string' || !nombre.trim()) throw new ErrorHttp(400, 'Falta el nombre.');
      if (genero !== 'varon' && genero !== 'mujer') throw new ErrorHttp(400, 'Elegí varón o mujer.');
      nueva(nombre.trim(), genero, forzar === true);
      return {};
    },
    '/api/texto': (c) => {
      const { texto } = json(c);
      const e = hayQueContestar();
      motor(() => responder(e, typeof texto === 'string' ? texto : ''));
      log(`Texto para ${e.esperando}`);
      return {};
    },
    '/api/boton': (c) => {
      const { texto } = json(c);
      const e = hayQueContestar();
      motor(() => tocarBoton(e, String(texto ?? '')));
      log(`Botón "${texto}" en ${e.esperando}`);
      return {};
    },
    '/api/audio': async (c, req) => {
      const e = hayQueContestar();
      if (c.length === 0) throw new ErrorHttp(400, 'El audio llegó vacío.');
      const tipo = String(req.headers['content-type'] ?? 'audio/webm').split(';')[0].trim().toLowerCase();
      const ext = EXTENSIONES[tipo];
      if (!ext) throw new ErrorHttp(400, `No sé guardar audio de tipo ${tipo}.`);
      const pregunta = e.esperando!;
      mkdirSync(join(dir(), 'audios'), { recursive: true });
      const usados = readdirSync(join(dir(), 'audios')).map((f) => parseInt(f, 10)).filter((x) => !isNaN(x));
      let nn = Math.max(0, ...usados) + 1;
      let archivo = '';
      do archivo = `audios/${String(nn++).padStart(2, '0')}-${pregunta}.${ext}`;
      while (existsSync(join(dir(), archivo))); // nunca se pisa un audio
      writeFileSync(join(dir(), archivo), c);
      return { transcripcion: await contestarConAudio(archivo, pregunta, tipo) };
    },
    '/api/reintentar': async (c) => {
      const archivo = String(json(c).archivo ?? '');
      const e = hayQueContestar();
      const m = /^audios\/\d+-([A-Za-z0-9.]+?)\.([a-z0-9]+)$/.exec(archivo);
      if (!m || !TIPOS[m[2]] || !existsSync(join(dir(), archivo))) throw new ErrorHttp(400, 'Ese audio no está.');
      if (m[1] !== e.esperando) throw new ErrorHttp(409, 'Ese audio era de otra pregunta.');
      return { transcripcion: await contestarConAudio(archivo, m[1], TIPOS[m[2]]) };
    },
  };

  return (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const responderJson = (status: number, cuerpo: unknown) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(taparKey(JSON.stringify(cuerpo)));
    };
    const fallar = (err: unknown) => {
      const e = err instanceof ErrorHttp ? err : new ErrorHttp(500, (err as Error).message);
      log(`ERROR ${e.status} ${url.pathname}: ${e.message}`);
      responderJson(e.status, { error: e.message, ...e.extra });
    };
    try {
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(readFileSync(HTML, 'utf8'));
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/estado') return responderJson(200, vista());
      const ruta = rutas[url.pathname];
      if (req.method !== 'POST' || !ruta) return responderJson(404, { error: 'No existe.' });
      leerCuerpo(req)
        .then((cuerpo) => enSerie(() => ruta(cuerpo, req)))
        .then((extra) => responderJson(200, { ...vista(), ...extra }), fallar);
    } catch (err) {
      fallar(err);
    }
  };
}

function json(c: Buffer): Record<string, unknown> {
  try {
    const v = JSON.parse(c.toString('utf8') || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    throw new ErrorHttp(400, 'No entendí lo que mandó la página.');
  }
}

function leerCuerpo(req: IncomingMessage): Promise<Buffer> {
  return new Promise((ok, mal) => {
    const partes: Buffer[] = [];
    let total = 0;
    req.on('data', (d: Buffer) => {
      total += d.length;
      if (total > LIMITE_AUDIO) {
        mal(new ErrorHttp(413, 'El audio es demasiado largo.'));
        req.destroy();
      } else partes.push(d);
    });
    req.on('end', () => ok(Buffer.concat(partes)));
    req.on('error', mal);
  });
}

// ---------------------------------------------------------------- CLI

function opcion(args: string[], nombre: string): string | undefined {
  const i = args.indexOf(nombre);
  return i >= 0 ? args[i + 1] : undefined;
}

export const ENV_POR_DEFECTO = 'C:\\Users\\Naza\\Desktop\\VITACORA FAMILIAR\\fabrica\\.env';

function main(args: string[]): void {
  const puerto = Number(opcion(args, '--puerto') ?? 5178);
  const nombre = opcion(args, '--nombre');
  const genero = opcion(args, '--genero');
  if (genero !== undefined && genero !== 'varon' && genero !== 'mujer') throw new Error('--genero tiene que ser varon o mujer');
  const rutaEnv = opcion(args, '--env') ?? ENV_POR_DEFECTO;
  const datos = resolve(opcion(args, '--datos') ?? join(AQUI, '..', '..', 'audios-crudos', 'v3-web'));
  const manejador = crearManejador({ datos, nombre, genero, transcribir: transcribirConOpenAI({ key: () => leerKeyOpenAI(rutaEnv) }) });
  // Solo en esta PC: no se abre a la red.
  createServer(manejador).listen(puerto, '127.0.0.1', () => {
    console.log(`Entrevista V3 en http://localhost:${puerto}`);
    console.log(`Datos en ${datos}`);
    console.log('Ojo: cada audio se transcribe con OpenAI (pago). Ctrl+C para apagar.');
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(`ERROR: ${taparKey((err as Error).message)}`);
    process.exit(1);
  }
}
