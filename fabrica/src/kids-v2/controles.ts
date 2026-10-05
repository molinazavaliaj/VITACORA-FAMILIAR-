// Los controles que corre la simulación sobre TODOS los mensajes de una
// corrida. Cada uno es una regla del diseño (banco.md, mensajes.md,
// flujo-vigente.md, paso-4-huecos-decisiones.md) o un cambio aprobado por
// Naza el 05/10 (A: la foto que vence vuelve al final; B: el final por
// plantilla propia). Puro.

import { armarGuion, type Ficha } from './compra.js';
import type { Corrida, Linea } from './corrida.js';
import { aInstante, aLocal, esDeNoche, finDeLaNoche, sumarDias } from './horas.js';
import type { Mensaje } from './motor.js';
import { CORTO_AUDIO_SEG, CORTO_PALABRAS, SILENCIO_MS } from './reglas.js';

export type Violacion = { control: string; detalle: string };

export const CONTROLES: Record<string, string> = {
  traba: 'nunca se traba: si el chico sigue contestando, llega al final',
  noche: 'nada entre las 22 y las 9 (hora del país del número)',
  plantillas: 'nunca dos plantillas seguidas sin respuesta al número de las preguntas (bienvenida, PREG-NUEVA, el final por plantilla); los recordatorios y TERMINO-PADRE van aparte (decisión 12)',
  marcas: 'ningún texto con "{{"',
  dosPuntos: 'ningún dos puntos en un texto a una persona (salvo lo que escribe el padre y el link)',
  unaVez: 'cada principal sale una sola vez (o se re-manda con [Estamos listos] en canal B) y ninguna se saltea',
  capsula: 'la cápsula no recibe acuses "para el libro" (ACUSE-3, ACUSE-6)',
  escrito: 'si no mandó audio (escribió o mandó solo fotos), ningún acuse dice "escuché"; si mandó solo fotos, acuse de foto',
  despuesDeNo: 'después de [No, eso fue todo] no va ningún acuse',
  orden: 'después de una respuesta: otra puerta → acuse → foto → seguir (al final, la foto vencida va después de [Dale, otra])',
  preocupante: 'después de algo preocupante, hasta la hora del día siguiente solo acuses sobrios',
  recordatorios: 'como mucho 2 recordatorios por silencio, y nunca al chico',
  seguirFinDeCap: 'no sale B-SEGUIR después de la última principal de un capítulo ni después de K47',
  aviso: 'K39 siempre después de B-AVISO-SERIA',
  termino: 'TERMINO-PADRE una sola vez al terminar; en canal B, otro día que FINAL-CHICO',
  botones: 'como mucho 3 botones por mensaje',
  canalB: 'en canal B todo va al número del padre',
  fotoPegada: 'ninguna foto pegada desaparece: se contestó, se tocó un botón suyo, vuelve al final, o el chico cerró con [No, ya está]/[Lo dejamos acá] (o el libro cerró solo con fotos pendientes)',
  retenido: 'si cuenta algo (no corto) en vez de tocar el botón de la bienvenida o de un PREG-NUEVA, primero va el acuse',
};

const bot = (ls: Linea[]) => ls.filter((l): l is Extract<Linea, { de: 'bot' }> => l.de === 'bot');
const ACUSE = /^ACUSE-\d$/;
/** Lo que el bot contesta a lo que mandó el chico (o a un botón de foto). */
const REACCION = /^(ACUSE-\d|ACUSE-FOTO-\d|B-DIAFEO-ACUSE-\d|B-FOTO-NOTENGO|B-FOTO-PLATA|B-NO-PASA-NADA)$/;
const DICEN_ESCUCHE = ['ACUSE-1', 'ACUSE-4', 'ACUSE-6'];
/** Plantillas que esperan que el chico (o el padre en canal B) toque o conteste. */
const esPlantillaQueEspera = (m: Mensaje) => /^(BIEN-CHICO|BIEN-CHICO-PL|BIEN-PADRE|PREG-NUEVA-CHICO|PREG-NUEVA-PADRE)$/.test(m.id) || (/^FINAL-CHICO/.test(m.id) && m.plantilla !== null);

export function revisar(ficha: Ficha, c: Corrida, o: { sigueContestando: boolean }): Violacion[] {
  const v: Violacion[] = [];
  const mal = (control: string, detalle: string) => v.push({ control, detalle });
  const mensajes = bot(c.lineas);
  const hora = (d: Date) => aLocal(d, ficha.zona);
  const cuando = (d: Date) => `${hora(d).fecha} ${hora(d).hora}`;
  const guion = armarGuion(ficha);
  const principales = guion.filter((x) => x.tipo === 'principal').map((x) => x.clave);
  const ultimasDeCap = new Set(guion.filter((x) => x.tipo === 'principal' && x.ultimaDelCap).map((x) => x.clave));
  const terminado = c.estado?.fase.tipo === 'terminado';

  // traba
  if (o.sigueContestando && !terminado) mal('traba', `quedó en ${c.estado?.fase.tipo ?? '-'} (${guion[c.estado?.cursor ?? -1]?.clave ?? '-'})`);

  let ultimaPregunta: string | null = null;
  /**
   * Lo que mandó y el bot todavía no procesó (la ráfaga), para los acuses. `en`: cuándo lo
   * procesa el motor (lo de noche, a las 9, en el orden en que llegó). Un botón de la noche
   * corta la ráfaga ahí: lo que vino después es la ráfaga siguiente.
   */
  let pendiente: { tipo: string | null; en: number; noche: boolean }[] = [];
  let contenidos = new Set<string>();
  let previo: Linea | null = null;
  let plantillasSinRespuesta: string[] = [];
  let sobrioHasta: Date | null = null;
  let recordatorios = 0;
  let avisoAntesDeK39 = false;
  let contoDesdeCierre = false;
  let enExtras = false;
  /** Al final: tocó [Dale, otra] después de la última EXTRAS-OTRA (lo de la noche llega a las 9, mezclado). */
  let pidioOtra = false;
  /** Esperando el botón de una bienvenida o un PREG-NUEVA; `primero`: lo primero que hizo el chico después. */
  let esperaBoton: { id: string; primero: Extract<Linea, { de: 'chico' }> | null } | null = null;
  const enviadas = new Map<string, number>();

  for (const l of c.lineas) {
    if (l.de === 'chico') {
      plantillasSinRespuesta = [];
      recordatorios = 0;
      if (esperaBoton && !esperaBoton.primero) esperaBoton.primero = l;
      const en = finDeLaNoche(l.en, ficha.zona).getTime();
      pendiente.push({ tipo: l.evento.tipo === 'respuesta' ? l.evento.contenido.tipo : null, en, noche: en !== l.en.getTime() });
      if (l.evento.tipo === 'respuesta') contoDesdeCierre = true;
      if (enExtras && l.evento.tipo === 'boton' && l.evento.boton === 'Dale, otra') pidioOtra = true;
      previo = l;
      continue;
    }
    if (l.de === 'marca') {
      if (l.motivo === 'preocupante') sobrioHasta = aInstante(sumarDias(hora(l.en).fecha, 1), ficha.hora, ficha.zona);
      previo = l;
      continue;
    }
    const m: Mensaje = l.mensaje;
    const id = m.id;
    // La ráfaga que procesa este mensaje: hasta el primer botón de la noche que vino después de algo contado.
    // B-FOTO-NOTENGO, B-NO-PASA-NADA, la primera pregunta de una rama (K25-R2)… contestan a un botón:
    // se llevan hasta ese botón, no lo que vino contado después. La otra puerta y el segundo paso de una rama (K12-R2-2), a lo contado.
    const aBoton = /^(B-FOTO-NOTENGO|B-FOTO-PLATA|B-NO-PASA-NADA|B-PASO)$/.test(id) || /^K\d+-R\d+$/.test(id);
    const reacciona = (REACCION.test(id) && !aBoton) || /^K\d+-(OP|R\d+-\d+)$/.test(id);
    let corte = pendiente.length;
    for (let k = 0, conto = false; k < pendiente.length; k++) {
      if (pendiente[k].tipo) conto = true;
      else if (conto && pendiente[k].noche && pendiente[k].en <= l.en.getTime()) {
        corte = k;
        break;
      }
    }
    contenidos = new Set(pendiente.slice(0, corte).flatMap((x) => (x.tipo ? [x.tipo] : [])));
    if (esDeNoche(l.en, ficha.zona)) mal('noche', `${id} a las ${cuando(l.en)}`);
    if (m.texto.includes('{{')) mal('marcas', `${id}: ${m.texto.slice(0, 50)}`);
    const sinLink = m.texto.split(ficha.linkPanel).join('');
    if (!/^PADRE-\d$/.test(id) && sinLink.includes(':')) mal('dosPuntos', `${id}: ${m.texto.slice(0, 60)}`);
    if (m.botones.length > 3) mal('botones', `${id}: ${m.botones.length}`);
    if (ficha.canal === 'B' && m.a !== 'padre') mal('canalB', `${id} fue a ${m.a}`);

    // Al número de las preguntas (el del chico; en canal B, el del padre), nunca dos plantillas que esperan seguidas sin respuesta.
    if (esPlantillaQueEspera(m)) {
      if (plantillasSinRespuesta.length > 0) mal('plantillas', `${id} a las ${cuando(l.en)} sin respuesta a ${plantillasSinRespuesta.join(', ')}`);
      plantillasSinRespuesta.push(id);
    }
    if (/^RECORD-/.test(id)) {
      recordatorios++;
      if (recordatorios > 2) mal('recordatorios', `${id}: el ${recordatorios}º del mismo silencio`);
      if (m.a !== 'padre') mal('recordatorios', `${id} fue al chico`);
    }

    // Algo preocupante: hasta la hora del día siguiente, solo acuses sobrios (TERMINO-PADRE es aviso al padre, no avanza nada).
    if (sobrioHasta) {
      if (l.en >= sobrioHasta) sobrioHasta = null;
      else if (!/^B-DIAFEO-ACUSE-\d$/.test(id) && id !== 'TERMINO-PADRE') mal('preocupante', `${id} el mismo día que algo preocupante (${cuando(l.en)})`);
    }

    // Contó algo (no corto) en vez de tocar el botón de la bienvenida o del PREG-NUEVA: el acuse va primero.
    if (esperaBoton?.primero) {
      const p = esperaBoton.primero;
      if (p.evento.tipo === 'respuesta') {
        const k = p.evento.contenido;
        const corto = k.tipo === 'audio' ? k.seg < CORTO_AUDIO_SEG : k.tipo === 'texto' ? k.texto.trim().split(/\s+/).length < CORTO_PALABRAS : false;
        if (!corto && !REACCION.test(id)) mal('retenido', `${id} sin acuse antes, después de que contó algo en ${esperaBoton.id}`);
      }
      esperaBoton = null;
    }
    if (/^(BIEN-CHICO|BIEN-CHICO-PL|BIEN-PADRE|PREG-NUEVA-CHICO|PREG-NUEVA-PADRE)$/.test(id)) esperaBoton = { id, primero: null };

    if (/^K\d+$/.test(id)) {
      const n = (enviadas.get(id) ?? 0) + 1;
      enviadas.set(id, n);
      const reenvio = previo?.de === 'chico' && previo.evento.tipo === 'boton' && previo.evento.boton === 'Estamos listos';
      if (n > 1 && !reenvio) mal('unaVez', `${id} salió ${n} veces`);
      if (id === 'K39' && !avisoAntesDeK39 && !reenvio) mal('aviso', `K39 sin B-AVISO-SERIA antes (${cuando(l.en)})`);
      if (id === 'K39') avisoAntesDeK39 = false;
    }
    if (id === 'B-AVISO-SERIA') avisoAntesDeK39 = true;
    if (/^CIERRE-/.test(id)) contoDesdeCierre = false;
    if (id === 'EXTRAS-OFERTA') enExtras = true;
    if (id === 'EXTRAS-OFERTA' || id === 'EXTRAS-OTRA') pidioOtra = false;

    const esPreg = /^(K\d+|X\d-\d+|PADRE-\d|CIERRE-.+)$/.test(id);
    if (esPreg) ultimaPregunta = id;
    // Una foto vencida que vuelve al final es lo que se está preguntando: cuenta como su principal (cápsula solo si es del cap. 5).
    const vuelve = enExtras && /^K\d+-FOTO$/.test(id);
    if (vuelve) ultimaPregunta = id.replace('-FOTO', '');
    if (ACUSE.test(id)) {
      const enCapsula = ultimaPregunta !== null && (/^K4[1-7]$/.test(ultimaPregunta) || /^X5-/.test(ultimaPregunta) || ultimaPregunta === 'CIERRE-FINAL');
      if (enCapsula && (id === 'ACUSE-3' || id === 'ACUSE-6')) mal('capsula', `${id} después de ${ultimaPregunta}`);
      // Sin nada registrado no se juzga: pasa solo cuando lo de la noche llega mezclado a las 9 y no se puede saber qué ráfaga fue.
      if (contenidos.size > 0 && !contenidos.has('audio') && DICEN_ESCUCHE.includes(id)) mal('escrito', `${id} sin audio (${[...contenidos].join(', ')}; ${ultimaPregunta})`);
      if (!contoDesdeCierre && previo?.de === 'chico' && previo.evento.tipo === 'boton' && previo.evento.boton === 'No, eso fue todo') mal('despuesDeNo', `${id} después de [No, eso fue todo]`);
    }
    // Solo fotos: acuse de foto (lo sensible, K39 y la extra sensible, lleva los del día feo).
    if (contenidos.size === 1 && contenidos.has('foto') && ACUSE.test(id)) mal('escrito', `${id} después de solo fotos (${ultimaPregunta})`);
    if (/^K\d+-FOTO$/.test(id)) {
      if (vuelve) {
        const pidio = (previo?.de === 'bot' && previo.mensaje.id === 'EXTRAS-SI') || pidioOtra;
        pidioOtra = false;
        if (!pidio) mal('orden', `${id} al final sin [Dale, otra] justo antes (después de ${previo?.de === 'bot' ? previo.mensaje.id : previo?.de})`);
      } else if (ultimaPregunta && !(previo?.de === 'bot' && (ACUSE.test(previo.mensaje.id) || /^ACUSE-FOTO|^B-(PASO|NO-PASA-NADA)$/.test(previo.mensaje.id)))) {
        mal('orden', `${id} sin acuse o paso justo antes (después de ${previo?.de === 'bot' ? previo.mensaje.id : previo?.de})`);
      }
    }
    if (id === 'B-SEGUIR' && previo?.de === 'bot') {
      const antes = previo.mensaje.id;
      if (ACUSE.test(antes) && ultimaPregunta && (ultimasDeCap.has(ultimaPregunta) || ultimaPregunta === 'K47')) mal('seguirFinDeCap', `B-SEGUIR después de ${ultimaPregunta}`);
    }
    // La ráfaga ya se procesó: el bot reaccionó (acuse, otra puerta, rama) o pasaron los 90 s desde lo último.
    // Un mensaje antes de eso (lo que suelta un botón) no la cierra: lo que vino va al acuse que sigue.
    const ultimo = Math.max(0, ...pendiente.filter((x) => x.tipo).map((x) => x.en));
    if (aBoton) pendiente = pendiente.slice(pendiente.findIndex((x) => !x.tipo) + 1);
    else if (reacciona) pendiente = pendiente.slice(corte);
    // Otro mensaje después de un botón de la noche: lo contado antes de ese botón ya se procesó (con acuse o, si era corto, sin nada).
    else if (corte < pendiente.length) pendiente = pendiente.slice(corte + 1);
    else if (l.en.getTime() >= ultimo + SILENCIO_MS) pendiente = [];
    previo = l;
  }

  if (terminado) for (const x of fotosPerdidas(ficha, c.lineas)) mal('fotoPegada', x);

  const terminados = mensajes.filter((x) => x.mensaje.id === 'TERMINO-PADRE');
  const final = mensajes.find((x) => /^FINAL-CHICO/.test(x.mensaje.id));
  if (terminado) {
    if (terminados.length !== 1 && !(ficha.canal === 'B' && c.estado.terminoPadre)) mal('termino', `TERMINO-PADRE salió ${terminados.length} veces`);
    if (ficha.canal === 'B' && final && terminados[0] && hora(terminados[0].en).fecha === hora(final.en).fecha) mal('termino', 'canal B: TERMINO-PADRE el mismo día que FINAL-CHICO');
    for (const k of principales) if (!enviadas.has(k)) mal('unaVez', `${k} nunca salió`);
  } else if (terminados.length > 0 && c.estado?.fase.tipo !== 'retenido') mal('termino', 'TERMINO-PADRE sin haber terminado');
  return v;
}

/**
 * Cambio A de Naza (05/10): ninguna foto pegada desaparece. Para cada principal
 * con foto: o la foto salió y el chico la contestó (o tocó un botón suyo), o
 * vuelve a salir al final (en las extras, con el ID de su principal), o el
 * chico cerró las extras con [No, ya está]/[Lo dejamos acá], o el libro cerró
 * solo con fotos pendientes (el final por plantilla a los 2 días, o la marca
 * cerro-sin-respuesta). Una foto vencida que vuelve y tampoco se contesta solo
 * se acepta si el libro cerró solo o el chico cerró.
 */
function fotosPerdidas(ficha: Ficha, lineas: Linea[]): string[] {
  const guion = armarGuion(ficha);
  const conFoto = guion.filter((x): x is Extract<typeof x, { tipo: 'principal' }> => x.tipo === 'principal' && x.fotoDe !== null);
  const iOferta = lineas.findIndex((l) => l.de === 'bot' && l.mensaje.id === 'EXTRAS-OFERTA');
  const enExtras = (i: number) => iOferta >= 0 && i > iOferta;
  // Las fotos vencidas salen primero: si ya salió una extra del banco (X1-1…), no quedaba ninguna pendiente.
  const iPrimeraX = lineas.findIndex((l, i) => enExtras(i) && l.de === 'bot' && /^X\d-\d+$/.test(l.mensaje.id));
  const antesDeX = (i: number) => i >= 0 && (iPrimeraX < 0 || i < iPrimeraX);
  const chicoCerro = antesDeX(lineas.findIndex((l, i) => enExtras(i) && l.de === 'chico' && l.evento.tipo === 'boton' && (l.evento.boton === 'No, ya está' || l.evento.boton === 'Lo dejamos acá')));
  const cerroSolo = antesDeX(lineas.findIndex((l) => (l.de === 'marca' && l.motivo === 'cerro-sin-respuesta') || (l.de === 'bot' && /^FINAL-CHICO/.test(l.mensaje.id) && l.mensaje.plantilla !== null)));
  const perdidas: string[] = [];

  /** La foto que salió en lineas[i]: ¿la contestó o tocó un botón suyo? */
  const contestada = (i: number, m: Mensaje): boolean | 'reenviada' => {
    let trajoFoto = false;
    for (let j = i + 1; j < lineas.length; j++) {
      const l = lineas[j];
      if (l.de === 'chico') {
        if (l.evento.tipo === 'boton' && m.botones.includes(l.evento.boton)) return true;
        if (l.evento.tipo === 'respuesta' && l.evento.contenido.tipo === 'foto') trajoFoto = true;
        continue;
      }
      if (l.de === 'marca') continue;
      if (l.mensaje.id === m.id) return 'reenviada';
      if (!REACCION.test(l.mensaje.id)) return false;
      // Reaccionó a lo que mandó. Si saltó algo preocupante, la foto se pierde (salvo que la haya mandado).
      const sig = lineas[j + 1];
      const preocupante = sig?.de === 'marca' && sig.motivo === 'preocupante';
      return !preocupante || trajoFoto;
    }
    return false;
  };

  for (const item of conFoto) {
    const idNormal = `${item.fotoDe}-FOTO`;
    const idVuelve = `${item.clave}-FOTO`;
    const iPregunta = lineas.findIndex((l) => l.de === 'bot' && l.mensaje.id === item.clave);
    let resuelta = false;
    let salio = false;
    for (let i = Math.max(iPregunta, 0); i < lineas.length; i++) {
      const l = lineas[i];
      if (l.de !== 'bot') continue;
      const esNormal = !enExtras(i) && l.mensaje.id === idNormal;
      const esVuelta = enExtras(i) && l.mensaje.id === idVuelve;
      if (!esNormal && !esVuelta) continue;
      salio = true;
      // Volvió al final: alcanza con que haya salido de nuevo (cambio A).
      if (esVuelta || contestada(i, l.mensaje) === true) {
        resuelta = true;
        break;
      }
    }
    if (resuelta || chicoCerro || cerroSolo) continue;
    perdidas.push(`la foto de ${item.clave} (${idNormal}) ${salio ? 'salió y venció' : 'nunca salió'} y no volvió al final`);
  }
  return perdidas;
}
