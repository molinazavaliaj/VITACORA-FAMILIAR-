/**
 * Las partes puras de la puerta manual: sin base, sin red y sin WhatsApp.
 *
 * Viven separadas del CLI (`scripts/manual.ts`) para poder testearlas sin
 * levantar nada — es el mismo criterio que el resto del módulo, donde la
 * lógica vive en `src/` y el script es sólo la cáscara.
 *
 * Contexto: mientras Meta no habilite la API de WhatsApp, las preguntas salen
 * a mano y los audios vuelven a mano. La puerta manual hace con un archivo del
 * disco lo mismo que `procesar.ts` hace con un `mediaId` del webhook.
 */

import type { Trato } from '../ia/trato.js';

export type Args = {
  comando: string;
  posicionales: string[];
  /** `--orden 3` → '3' · `--repregunta` (sin valor) → true · `--si` → true. */
  flags: Record<string, string | boolean>;
};

/** `cargar imma dia_03.ogg --orden 3 --repregunta` → comando + args + flags. */
export function parsearArgs(argv: string[]): Args {
  const [comando = '', ...resto] = argv;
  const posicionales: string[] = [];
  const flags: Record<string, string | true> = {};

  for (let i = 0; i < resto.length; i++) {
    const token = resto[i];
    if (!token.startsWith('--')) {
      posicionales.push(token);
      continue;
    }
    const [nombre, valorInline] = token.slice(2).split('=');
    if (valorInline !== undefined) {
      flags[nombre] = valorInline;
      continue;
    }
    const siguiente = resto[i + 1];
    if (siguiente !== undefined && !siguiente.startsWith('--')) {
      flags[nombre] = siguiente;
      i++;
    } else {
      flags[nombre] = true;
    }
  }
  return { comando, posicionales, flags };
}

/** 'Pequeña Imma' → 'pequena-imma': el slug que usan las carpetas de audios. */
export function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type NombreCanonico = { orden: number; sufijo: number };

export const EXTENSIONES_AUDIO = ['.ogg', '.opus', '.oga', '.mp3', '.m4a', '.wav', '.aac', '.mp4'];

export function esAudio(nombre: string): boolean {
  const punto = nombre.lastIndexOf('.');
  return punto > 0 && EXTENSIONES_AUDIO.includes(nombre.slice(punto).toLowerCase());
}

/**
 * `dia_07.ogg` → { orden: 7, sufijo: 1 } · `dia_07_2.ogg` → { orden: 7, sufijo: 2 }.
 * Cualquier otro nombre (una nota de voz recién bajada, `PTT-20260914-WA0007.ogg`)
 * devuelve null: ahí el orden lo decide la base, no el nombre.
 */
export function ordenDeArchivo(nombre: string): NombreCanonico | null {
  const m = nombre.match(/^dia_(\d{1,3})(?:_(\d+))?\.[a-z0-9]+$/i);
  if (!m) return null;
  return { orden: Number(m[1]), sufijo: m[2] ? Number(m[2]) : 1 };
}

/**
 * El nombre canónico del archivo de esa respuesta. Es EXACTAMENTE el que espera
 * el audiolibro (`fabrica/src/audio/audiolibro.ts`): sin sufijo la respuesta
 * principal, con sufijo las repreguntas del mismo día.
 */
export function archivoCanonico(orden: number, sufijo = 1): string {
  const base = `dia_${String(orden).padStart(2, '0')}`;
  return sufijo <= 1 ? `${base}.ogg` : `${base}_${sufijo}.ogg`;
}

/**
 * Qué orden le toca a un audio cuando el nombre del archivo no lo dice:
 * la pregunta vigente si sigue sin responder, y si ya está respondida, la que
 * sigue. Con `dia_actual` 0 (todavía no salió ninguna) arranca en la 1.
 */
export function proximoOrden(diaActual: number, ordenesRespondidas: number[]): number {
  if (diaActual < 1) return 1;
  return ordenesRespondidas.includes(diaActual) ? diaActual + 1 : diaActual;
}

/**
 * El texto que se le pega al narrador: la pregunta sola.
 *
 * Hasta el 2026-09-14 esto llevaba adelante un "reconocimiento" generado por el
 * modelo (una o dos frases con un detalle de lo que había contado ayer). Se sacó
 * por decisión de producto de los socios: costaba ~USD 3,36 por narrador —el 70%
 * de la entrevista— porque cada día le pegaba TODA la historia al prompt.
 *
 * Es el mismo texto que arma el camino de WhatsApp en `preguntar.ts` — de hecho
 * ahora es LITERALMENTE el mismo: hasta el 2026-09-15 vivía escrito dos veces,
 * acá y allá, y con dos tratos serían cuatro frases sueltas que divergen el día
 * que se cambie una.
 *
 * ⚠️ La plantilla de Meta (`PLANTILLAS.md`) lleva su propia copia en usted, y
 * esa la aprueba Meta: fuera de la ventana de 24 h el narrador lee la cola en
 * usted aunque su trato sea vos.
 */
export function mensajeDePregunta(pregunta: string, trato: Trato = 'usted'): string {
  const cierre = trato === 'vos'
    ? 'Cuando quieras, me respondés con un audio. Sin apuro. 🎙️'
    : 'Cuando quiera, me responde con un audio. Sin apuro. 🎙️';
  return `La pregunta de hoy: ${pregunta}\n\n${cierre}`;
}

/** La despedida final. Único hogar del texto: `src/flujo/cierre.ts` la importa de acá. */
export function despedida(comoLeDicen: string, trato: Trato = 'usted'): string {
  const final = trato === 'vos'
    ? 'Fue un honor enorme escucharte. Tu historia ya está siendo convertida en tu libro.'
    : 'Fue un honor enorme escucharlo. Su historia ya está siendo convertida en su libro.';
  return `${comoLeDicen}... llegamos al final del viaje. Treinta charlas, una vida entera. ${final}`;
}

/**
 * La presentación del biógrafo: el primer mensaje de todos, antes de que él
 * diga que sí. En usted es LITERALMENTE el cuerpo de la plantilla `bienvenida`
 * de `PLANTILLAS.md` (la que aprueba Meta) — hay un test que lee ese archivo y
 * compara, para que el documento y el código no se separen nunca.
 *
 * La puerta manual no la mandaba (2026-09-15, lo notó Naza con el primer
 * narrador real): `crear` lo ponía en `activo` y `siguiente` imprimía la
 * pregunta a secas. Nadie se había presentado.
 *
 * `enseguida`: en modo rápido la primera pregunta sale apenas dice SÍ, así que
 * no se le promete "mañana".
 *
 * La frase de la voz (2026-09-17, 3t.15): la voz es dato biométrico y la
 * política de privacidad promete pedir permiso. El mismo SÍ con el que acepta
 * participar incluye ese permiso, y `procesar.ts` lo anota en
 * `consentimiento_voz_at` — solo si la bienvenida que salió por Meta ya tenía
 * esta frase (ver `WA_BIENVENIDA_PIDE_VOZ` en config.ts).
 *
 * 3t.25 (2026-09-22): la frase decía que "el audiolibro puede llevar su propia
 * voz, recreada a partir de estos audios". El audiolibro se descartó el 20/09 y
 * nunca hubo voz recreada: lo que existe es «Su voz», recortes de sus audios
 * reales. El permiso se mantiene, con la verdad del mecanismo.
 */
export function bienvenida(
  comoLeDicen: string, quienRegala: string, trato: Trato = 'usted', { enseguida = false } = {},
): string {
  const cuando = enseguida ? '' : ' mañana';
  return trato === 'vos'
    ? `Hola ${comoLeDicen} 👋 Soy tu biógrafo. ${quienRegala} te hizo un regalo muy especial: vamos a escribir juntos el libro de tu vida. Cada mañana te voy a mandar una pregunta, y vos me respondés con un audio, como le contás las cosas a un amigo. Al final, tu historia queda en un libro para tu familia, y tus mejores frases quedan tal cual las contaste: recortes de estos mismos audios, para escucharlas cuando quieran. Al responder SÍ nos das permiso para guardar tus audios y usarlos así. ¿Empezamos? Respondé SÍ y arrancamos${cuando}.`
    : `Hola ${comoLeDicen} 👋 Soy su biógrafo. ${quienRegala} le hizo un regalo muy especial: vamos a escribir juntos el libro de su vida. Cada mañana le voy a mandar una pregunta, y usted me responde con un audio, como le cuenta las cosas a un amigo. Al final, su historia queda en un libro para su familia, y sus mejores frases quedan tal cual las contó: recortes de estos mismos audios, para escucharlas cuando quieran. Al responder SÍ nos da permiso para guardar sus audios y usarlos así. ¿Empezamos? Responda SÍ y arrancamos${cuando}.`;
}

/**
 * Vitácora de viaje: la presentación, en vos. Es el cuerpo de la plantilla
 * `bienvenida_viaje` (PLANTILLAS.md); hasta que Meta la apruebe, sale como texto
 * libre cuando el viajero escribe primero. Incluye el permiso de voz, como la otra.
 */
export function bienvenidaViaje(comoLeDicen: string, { enseguida = false } = {}): string {
  const cuando = enseguida ? 'ya' : 'esta noche';
  return `Hola ${comoLeDicen} 👋 Soy tu biógrafo de viaje. Cada noche te voy a mandar una pregunta sobre el día, y vos me respondés con un audio, como le contás a un amigo. Mandame también la foto del día cuando te la pida, o cuando quieras. Al final, tu viaje queda en un libro, y tus mejores frases quedan tal cual las contaste: recortes de estos mismos audios, para escucharlas cuando quieras. Al responder SÍ nos das permiso para guardar tus audios y usarlos así. ¿Arrancamos? Respondé SÍ y empezamos ${cuando}.`;
}

/** Lo que recibe cuando dice que SÍ. Único hogar del texto: `src/flujo/procesar.ts` lo importa de acá. */
export function bienvenidaAceptacion(
  comoLeDicen: string, trato: Trato = 'usted', { viaje = false, enseguida = false } = {},
): string {
  if (viaje) return `¡Buen viaje, ${comoLeDicen}! Esta noche te llega la primera pregunta. Sin apuro y sin respuestas incorrectas: esto es tu bitácora, a tu ritmo. 🧭`;
  // Ritmo «apenas responde» (23/09): la primera pregunta sale con el SÍ, no al
  // día siguiente. El texto tiene que decir lo que va a pasar de verdad — si
  // promete "mañana" y la pregunta entra en el mismo minuto, el bot queda como
  // si no supiera lo que hace.
  if (enseguida) {
    return trato === 'vos'
      ? `¡Qué alegría, ${comoLeDicen}! Te mando la primera pregunta ahora mismo. No hay apuro ni respuestas incorrectas: esto es una charla entre vos y yo, a tu ritmo. 📖`
      : `¡Qué alegría, ${comoLeDicen}! Le mando la primera pregunta ahora mismo. No hay apuro ni respuestas incorrectas: esto es una charla entre usted y yo, a su ritmo. 📖`;
  }
  return trato === 'vos'
    ? `¡Qué alegría, ${comoLeDicen}! Mañana a la mañana te llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre vos y yo, a tu ritmo. 📖`
    : `¡Qué alegría, ${comoLeDicen}! Mañana a la mañana le llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre usted y yo, a su ritmo. 📖`;
}

export type PasoDeCarga = { archivo: string; orden: number; sufijo: number };

/**
 * Reparte una lista de archivos (ya ordenada por fecha, del más viejo al más
 * nuevo) entre las órdenes que siguen a partir de `desde`.
 * En modo repregunta todos van a la MISMA orden, con sufijo creciente.
 */
export function planDeCarga(archivos: string[], desde: number, esRepregunta = false): PasoDeCarga[] {
  return archivos.map((archivo, i) =>
    esRepregunta
      ? { archivo, orden: desde, sufijo: i + 2 }
      : { archivo, orden: desde + i, sufijo: 1 },
  );
}

/**
 * El índice del primer carácter donde dos textos difieren (-1 si son iguales).
 * Sirve para mostrar QUÉ cambió al retranscribir sin imprimir todo de nuevo.
 */
export function primeraDiferencia(a: string, b: string): number {
  const largo = Math.min(a.length, b.length);
  for (let i = 0; i < largo; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : largo;
}

/**
 * El vocabulario base del habla rioplatense. Es la mitad del sesgo que se le
 * pasa a la transcripción: sin esto, un narrador porteño diciendo "mi viejo
 * llegando de laburar" se oye como "llegando de la URA".
 *
 * Se mantiene CORTO a propósito: Whisper sólo mira los últimos ~224 tokens del
 * prompt, y un glosario largo hace que el modelo "escuche" palabras de la lista
 * que el narrador nunca dijo.
 */
export const GLOSARIO_RIOPLATENSE =
  'laburar, laburo, pileta, mate, pastafrola, milanesas, galgo, barrio, pibe, ' +
  'viejo, vieja, hermano, abuela, escapar, quilombo, colectivo, zapatillas';

/**
 * Lo que NO es un nombre aunque viva en el árbol familiar: la familia escribe
 * "no tuvo" cuando el narrador no tuvo pareja o hijos. Si eso entra al prompt,
 * el modelo empieza a "escuchar" palabras que no están en el audio.
 */
const NO_ES_NOMBRE = /^(no|ninguno|ninguna|no\s+tuvo|no\s+tiene|no\s+aplica|sin\s+datos|n\/a)$/i;

/**
 * Arma el contexto que se le sopla a la transcripción, con lo que YA está en la
 * fila del narrador (nada que cargar a mano): su vocabulario esperable, cómo le
 * dicen, las personas de su árbol y sus datos de vida.
 *
 * Es la diferencia entre transcribir sonidos y transcribir a Joaquín. Y no
 * depende de la conversación: va con el primer audio igual que con el trigésimo.
 */
export type Castellano = 'rioplatense' | 'españa' | 'latinoamerica';

/**
 * Qué castellano esperar, por la zona horaria del narrador (biógrafo v2, 23/09). El prompt estaba
 * fijo en "rioplatense (Argentina)" con glosario argentino, y hay narradores en España: la
 * transcripción los empujaba al argentino. Sin zona, rioplatense (el caso de hoy).
 */
export function castellanoDe(zonaHoraria: string | undefined | null): Castellano {
  if (!zonaHoraria) return 'rioplatense';
  if (/^America\/(Argentina|Montevideo)/.test(zonaHoraria)) return 'rioplatense';
  if (/^(Europe|Atlantic\/Canary|Africa\/Ceuta)/.test(zonaHoraria)) return 'españa';
  if (/^America\//.test(zonaHoraria)) return 'latinoamerica';
  return 'rioplatense';
}

const ENCABEZADO: Record<Castellano, string> = {
  rioplatense: 'Entrevista de historia de vida en castellano rioplatense (Argentina). Transcribí literal, sin corregir la sintaxis.',
  españa: 'Entrevista de historia de vida en castellano de España. Transcribí literal, sin corregir la sintaxis.',
  latinoamerica: 'Entrevista de historia de vida en castellano de Latinoamérica. Transcribí literal, sin corregir la sintaxis.',
};

export function promptDeTranscripcion(contexto: Record<string, any> = {}, comoLeDicen = '', zonaHoraria?: string | null): string {
  const castellano = castellanoDe(zonaHoraria);
  const partes = [ENCABEZADO[castellano]];
  // El glosario es solo del habla rioplatense: a una narradora de Madrid le haría "escuchar"
  // palabras argentinas que no dijo.
  if (castellano === 'rioplatense') partes.push(`Vocabulario frecuente: ${GLOSARIO_RIOPLATENSE}.`);
  if (comoLeDicen) partes.push(`Quien habla es ${comoLeDicen}.`);

  const arbol = contexto?.arbol ?? {};
  const personas = Object.values(arbol)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim().replace(/[,;.]+$/, ''))
    .filter((v) => v !== '' && !NO_ES_NOMBRE.test(v));
  if (personas.length) partes.push(`Personas de su vida: ${personas.join('; ')}.`);
  if (contexto?.lugarNacimiento) partes.push(`Lugar: ${contexto.lugarNacimiento}.`);
  if (typeof contexto?.dondeVive === 'string' && contexto.dondeVive.trim()) partes.push(`Vive en: ${contexto.dondeVive.trim()}.`);
  if (contexto?.oficio) partes.push(`Oficio: ${contexto.oficio}.`);
  // `datosExtra` (el texto libre de la familia) ya NO entra (biógrafo v2, 23/09): la transcripción
  // puede escribir frases de su prompt que la persona nunca dijo, sobre todo en los silencios. Los
  // nombres y lugares de arriba sirven —corrigen la ortografía—; las frases no.
  return partes.join(' ');
}

/**
 * Bitácora 15: una nota de voz bajada de WhatsApp antes de que termine de
 * descargarse pesa 0 bytes, y `cargar` la subía y la mandaba a transcribir.
 * Devuelve el motivo para rechazarla, o null si el archivo sirve. El piso de
 * 1 KB es holgado: una nota de voz de un segundo ya pesa más que eso.
 */
export const AUDIO_MINIMO_BYTES = 1024;
export function motivoParaRechazarAudio(bytes: number, nombre: string): string | null {
  if (bytes === 0) return `${nombre} está vacío (0 bytes): WhatsApp no terminó de bajarlo. Volvé a guardarlo y cargalo de nuevo.`;
  if (bytes < AUDIO_MINIMO_BYTES) return `${nombre} pesa ${bytes} bytes: no es una nota de voz entera. Volvé a bajarlo.`;
  return null;
}

/**
 * Bitácora 3: una respuesta que llegó en varias notas de voz. La lista que lee
 * el demuxer `concat` de ffmpeg (una línea `file '...'` por audio, en el orden
 * en que se van a pegar; la comilla simple se escapa como manda ffmpeg).
 */
export function listaParaConcatenar(rutas: string[]): string {
  return rutas.map((r) => `file '${r.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n') + '\n';
}

/**
 * `ficha --hijos no` / `--pareja "Élida"`: lo que va al árbol. "no", "ninguno",
 * "no tuvo" y "no tiene" significan lo mismo que carga la familia al comprar
 * (`'no tuvo'`, que es lo que mira `capituloNoAplica`); cualquier otra cosa son
 * nombres y se guardan tal cual.
 */
export function valorDelArbol(valor: string): string {
  const limpio = valor.trim();
  return /^(no|ninguno|ninguna|no tuvo|no tiene|no tengo)$/i.test(limpio) ? 'no tuvo' : limpio;
}

/**
 * Bitácora 31: qué hace la puerta manual después de cargar una respuesta a la
 * última pregunta del guion. Si acaba de salir una repregunta, se espera esa
 * respuesta (se cierra al cargarla con --repregunta); si no, se cierra ya:
 * despedida impresa + estado 'completado', sin depender de correr `cerrar`.
 */
export function queHacerAlFinal(esUltima: boolean, repreguntaRecienImpresa: boolean): 'seguir' | 'esperar_repregunta' | 'cerrar' {
  if (!esUltima) return 'seguir';
  return repreguntaRecienImpresa ? 'esperar_repregunta' : 'cerrar';
}

/**
 * El pedido de un objeto preciado, al cerrar un capítulo (3t.30).
 *
 * Sale como segundo mensaje del mismo día, apenas el narrador contesta la
 * última pregunta del capítulo: la ventana de 24 hs está abierta, así que va
 * como texto libre y no necesita plantilla de Meta.
 *
 * El reconocimiento de que el capítulo se cerró no es adorno: sin él, recibir
 * dos preguntas seguidas confunde, sobre todo a un narrador de 85 años.
 *
 * Y la salida por texto ("si no la tiene a mano, cuéntemelo") es la parte más
 * importante del mensaje: quien no sabe mandar una foto tiene que poder
 * contestar igual, sin sentir que falló en algo.
 */
export function mensajeDeObjeto(capitulo: string, pedido: string, trato: Trato = 'usted'): string {
  const cierre = trato === 'vos'
    ? 'Si no lo tenés a mano, contámelo y listo. 📷'
    : 'Si no lo tiene a mano, cuéntemelo y listo. 📷';
  return `Con esto cerramos «${capitulo}». Antes de seguir, una curiosidad.\n\n${pedido}\n\n${cierre}`;
}

/**
 * El acuse de la foto que contesta un pedido de objeto.
 *
 * Si ya vino con la historia (el epígrafe abajo de la foto), no se vuelve a
 * preguntar: el pedido ya decía "y cuénteme de dónde salió", y repetirlo sería
 * no haber escuchado. Si la foto llegó sola, ahí sí, corto.
 */
export function textoObjetoRecibido(trato: Trato, conHistoria: boolean): string {
  if (!conHistoria) return '📷 Qué bueno. ¿Y de dónde salió?';
  return trato === 'vos'
    ? '📷 Qué bueno. Queda guardada en tu libro.'
    : '📷 Qué bueno. Queda guardada en su libro.';
}

/**
 * Cuando el invitado escribe algo que no entendimos (23/09).
 *
 * Antes el bot se quedaba mudo: la persona leía la bienvenida, contestaba
 * "dale" o "listo", y del otro lado no pasaba nada. Nadie insiste con algo que
 * no le contesta, así que ese silencio costaba el narrador entero.
 *
 * Se manda UNA sola vez. Insistirle a quien no quiere participar sería peor
 * que no haber preguntado.
 */
export function noEntendi(trato: Trato = 'usted'): string {
  return trato === 'vos'
    ? 'Perdón, no te entendí 🙈 Para arrancar necesito que me escribas SÍ. ¿Vamos?'
    : 'Perdón, no le entendí 🙈 Para arrancar necesito que me escriba SÍ. ¿Vamos?';
}

/** Dijo que no, o que ahora no. Se le deja la puerta abierta y no se insiste. */
export function noQuiereTodavia(comoLeDicen: string, trato: Trato = 'usted'): string {
  return trato === 'vos'
    ? `Sin problema, ${comoLeDicen}. Cuando tengas ganas me escribís SÍ y arrancamos. Acá voy a estar.`
    : `Sin problema, ${comoLeDicen}. Cuando tenga ganas me escribe SÍ y arrancamos. Acá voy a estar.`;
}
