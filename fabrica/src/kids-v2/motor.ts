// El motor de Vitácora Kids V2 («Mi Primer Capítulo»): una máquina de estados
// pura. paso(estado, evento, ahora) → { estado, salidas }. Sin I/O, sin
// modelos de IA: los textos salen de banco.json (banco.md + mensajes.md).
//
// Quien lo conecte a WhatsApp (Joaquín): guarda el estado, manda las salidas
// (mensaje → texto o plantilla, al número del chico o del padre; marca → panel
// de Naza) y llama `reloj` en proximoDespertar() (o cada minuto).
//
// Ojo: un evento `ficha` (el panel) con datos inválidos (hora mal escrita o
// fuera de 09:00–21:59, un tema que no existe, más de 3 preguntas) TIRA ERROR.
// El estado de quien llama queda intacto (paso trabaja sobre una copia), pero
// hay que validar en el panel o atrapar el error.
//
// Cada `respuesta` o `boton` con `id` (el wa_message_id) saca un `recibido` cuando
// se aplica (lo de la noche, a las 9): con eso se anota a qué item respondió
// (motor/recibido.ts). `termino` y `avance` son para guardar al lado del estado.

import { armarGuion, PREGUNTA_DEL_TEMA, TEMAS, validarFicha, type Tema } from './compra.js';
import { aInstante, aLocal, esDeNoche } from './horas.js';
import { emitir, hoy, type Ctx } from './motor/flujo.js';
import { alBoton } from './motor/botones.js';
import { fijoA, variables } from './motor/mensajes.js';
import { procesarRafaga, sumarARafaga } from './motor/rafaga.js';
import { claveDe, claveDelBoton, idBienvenida, SIN_CLAVE_KIDS } from './motor/recibido.js';
import { alReloj } from './motor/reloj.js';
import type { Estado, Evento, Fase, Salida } from './motor/tipos.js';

export { nuevoEstado } from './motor/estado.js';
export { proximoDespertar } from './motor/reloj.js';
export { SIN_CLAVE_KIDS } from './motor/recibido.js';
export type { Contenido, Enviado, Estado, Evento, Fase, Mensaje, Salida } from './motor/tipos.js';

export function paso(estado: Estado, evento: Evento, ahora: string): { estado: Estado; salidas: Salida[] } {
  const c: Ctx = { e: structuredClone(estado), ahora: new Date(ahora), salidas: [], replay: false };
  marcarPunto(c);
  aplicar(c, evento);
  anotarBotones(c);
  llegoAlgoQueEspera(c);
  return { estado: c.e, salidas: c.salidas };
}

/**
 * Terminó para los dos: el final le llegó al chico (o quedó retenido detrás de
 * un PREG-NUEVA después del cierre solo a los 2 días: le llega cuando vuelva) y
 * TERMINO-PADRE ya salió (en canal B sale al día siguiente, a la hora).
 */
export function termino(e: Estado): boolean {
  const f = e.fase;
  const final = f.tipo === 'terminado' || (f.tipo === 'retenido' && f.luego.tipo === 'terminado');
  return final && e.terminoPadre === null;
}

/** Hasta dónde llegó, para el panel: el capítulo del item en curso (0 antes de K1), si el padre todavía puede mandar sus preguntas, y si terminó. */
export function avance(e: Estado): { capitulo: number; preguntasPadreAbiertas: boolean; terminado: boolean } {
  return { capitulo: e.guion[e.cursor]?.cap ?? 0, preguntasPadreAbiertas: preguntasPadreAbiertas(e), terminado: termino(e) };
}

/** Las preguntas del padre se aceptan hasta que empieza el cap. 4 (#34; la misma regla que usa el evento `ficha`). */
function preguntasPadreAbiertas(e: Estado): boolean {
  const actual = e.guion[e.cursor];
  return !(actual !== undefined && actual.cap >= 4);
}

function marcarPunto(c: Ctx): void {
  c.punto = { fase: JSON.stringify(c.e.fase), tipo: c.e.fase.tipo, salidas: c.salidas.length };
}

/**
 * Decisión 22: qué botones valen. Si desde el último punto cambió lo que se
 * espera (la fase), valen solo los de los mensajes que salieron desde ahí (los
 * de antes son viejos); si no cambió (un recordatorio, la pregunta que se
 * vuelve a mandar con [Estamos listos]), se suman. Un PREG-NUEVA sigue valiendo
 * aunque cambie lo que tiene retenido (el cierre a los 2 días).
 */
function anotarBotones(c: Ctx): void {
  const e = c.e;
  const p = c.punto;
  if (!p) return marcarPunto(c);
  const nuevos = c.salidas.slice(p.salidas).flatMap((s) => (s.tipo === 'mensaje' && s.botones.length > 0 ? [s.envio] : []));
  const cambio = JSON.stringify(e.fase) !== p.fase && !(p.tipo === 'retenido' && e.fase.tipo === 'retenido');
  e.esperanBoton = cambio ? nuevos : [...e.esperanBoton, ...nuevos];
  marcarPunto(c);
}

/** Fases que esperan al chico (un botón o lo que cuente). */
const ESPERAN: ReadonlySet<Fase['tipo']> = new Set(['pregunta', 'op', 'foto', 'foto-audio', 'seguir', 'aviso-seria', 'tranquila', 'una-mas', 'cierre', 'cierre-cuenta']);

/**
 * Le llegó algo que espera un botón (una pregunta, su foto, B-SEGUIR…): ese día
 * queda hecho. Decisión 6: lo que espera un botón vence a la hora del día
 * SIGUIENTE al que le llegó (también si le llegó a las 9, después de lo de la
 * noche). Decisión 10: si ese día ya le llegó una principal (también la que
 * suelta a la mañana un botón tocado de noche), la hora no manda otra.
 * Los avisos al padre (recordatorios, TERMINO-PADRE) no cuentan.
 */
function llegoAlgoQueEspera(c: Ctx): void {
  if (!ESPERAN.has(c.e.fase.tipo)) return;
  const llego = c.salidas.some((s) => s.tipo === 'mensaje' && s.botones.length > 0 && !/^RECORD-/.test(s.id));
  if (llego) c.e.diaHecho = hoy(c);
}

function aplicar(c: Ctx, ev: Evento): void {
  const e = c.e;
  const noche = esDeNoche(c.ahora, e.ficha.zona) && !c.replay;
  switch (ev.tipo) {
    case 'inicio':
      if (e.fase.tipo !== 'sin-empezar' || e.nocturnos.some((x) => x.tipo === 'inicio')) return;
      if (noche) return void e.nocturnos.push(ev);
      return arrancar(c);
    case 'respuesta':
      if (!c.replay) entro(c);
      if (noche) return void e.nocturnos.push(ev);
      e.reenviar = false; // ya contestó: un [Estamos listos] viejo no repite lo que está arriba
      recibido(c, ev, claveDe(e));
      return sumarARafaga(c, ev.contenido);
    case 'boton':
      if (!c.replay) entro(c);
      if (noche) return void e.nocturnos.push(ev);
      if (e.rafaga) {
        procesarRafaga(c);
        anotarBotones(c);
      }
      // Decisión 22: el botón de un mensaje viejo (o ya tocado) no hace nada. Sin `aMensaje`, vale.
      if (ev.aMensaje !== undefined && !e.esperanBoton.includes(ev.aMensaje)) return recibido(c, ev, SIN_CLAVE_KIDS);
      // Cualquier otro botón del número de las preguntas también es contestar; [Estamos listos] lo lee y lo apaga él.
      if (!esEstamosListos(e, ev.boton)) e.reenviar = false;
      return botonConRecibido(c, ev);
    case 'reloj':
      if (noche) return;
      if (e.nocturnos.length) {
        const guardados = e.nocturnos;
        e.nocturnos = [];
        c.replay = true;
        for (const g of guardados) {
          aplicar(c, g);
          anotarBotones(c);
        }
        c.replay = false;
      }
      return alReloj(c);
    case 'ficha':
      return cambiarFicha(c, ev.cambios);
  }
}

const esEstamosListos = (e: Estado, boton: string) => e.ficha.canal === 'B' && boton === 'Estamos listos';

/** El `recibido` de un evento con id (sin id no sale nada). */
function recibido(c: Ctx, ev: Extract<Evento, { tipo: 'respuesta' | 'boton' }>, clave: string): void {
  if (ev.id !== undefined) c.salidas.push({ tipo: 'recibido', id: ev.id, clave });
}

/**
 * Aplica el botón y saca su `recibido`. Si no sacó nada ni movió el estado (no
 * corresponde a lo que se espera, el día sobrio, un [Estamos listos] sin nada
 * que mandar), va sin clave. Que se apague el reenvío de canal B no cuenta.
 */
function botonConRecibido(c: Ctx, ev: Extract<Evento, { tipo: 'boton' }>): void {
  const e = c.e;
  const clave = claveDelBoton(e, ev.boton);
  const foto = () => JSON.stringify({ ...c.e, reenviar: false });
  const antes = foto();
  const n = c.salidas.length;
  alBoton(c, ev.boton);
  recibido(c, ev, c.salidas.length > n || foto() !== antes ? clave : SIN_CLAVE_KIDS);
}

/**
 * Llegó algo del número de las preguntas: abre la ventana de 24 h y corta el silencio.
 * El reenvío de canal B (`reenviar`) se apaga al procesar el evento, no acá: así, de
 * noche, un [Estamos listos] tocado antes de la respuesta se procesa a las 9 en su orden.
 */
function entro(c: Ctx): void {
  c.e.ultimaEntrada = c.ahora.toISOString();
  c.e.recordatorios = 0;
}

/** El arranque (flujo-vigente.md §2; #37: apenas paga, entre las 9 y las 22). */
function arrancar(c: Ctx): void {
  const e = c.e;
  e.inicio = c.ahora.toISOString();
  const f = e.ficha;
  if (f.canal === 'A') {
    emitir(c, fijoA(e, idBienvenida(e), { variables: variables.chico(f) }));
    emitir(c, fijoA(e, 'AVISO-PADRE', { variables: variables.avisoPadre(f), paraPadre: true }));
  } else emitir(c, fijoA(e, 'BIEN-PADRE', { variables: variables.padre(f) }));
  e.fase = { tipo: 'bienvenida' };
}

/**
 * El padre cambia algo en el panel (#34, decisión 27). La hora, siempre. Sus
 * preguntas, hasta que empieza el cap. 4. Los temas, para todo lo que todavía
 * no salió: en la ficha queda el tema sacado tal como lo pidió (así sus extras
 * no salen ni en "una más" ni al final), pero la principal de un tema que ya
 * salió (o que se está preguntando ahora) sigue en el guion como estaba, y su
 * foto no se muda a otra. Todo lo demás del mismo guardado se aplica igual.
 * Datos inválidos (hora fuera de 09:00–21:59 o mal escrita, un tema que no
 * existe) tiran error, sin aplicar nada.
 */
function cambiarFicha(c: Ctx, cambios: Extract<Evento, { tipo: 'ficha' }>['cambios']): void {
  const e = c.e;
  const actual = e.guion[e.cursor];
  const pedida = validarFicha({
    ...e.ficha,
    hora: cambios.hora ?? e.ficha.hora,
    temasSacados: cambios.temasSacados ?? e.ficha.temasSacados,
    preguntasPadre: cambios.preguntasPadre && preguntasPadreAbiertas(e) ? cambios.preguntasPadre : e.ficha.preguntasPadre,
  });
  // Día sobrio: "ese día" dura hasta la hora del día siguiente; si la hora cambia, se corre con ella.
  if (e.sobrioHasta && c.ahora < new Date(e.sobrioHasta) && pedida.hora !== e.ficha.hora) {
    e.sobrioHasta = aInstante(aLocal(new Date(e.sobrioHasta), pedida.zona).fecha, pedida.hora, pedida.zona).toISOString();
  }
  if (!actual) {
    e.ficha = pedida;
    e.guion = armarGuion(pedida);
    return;
  }
  // Hasta dónde llegó, en el orden del guion completo (sin temas sacados).
  const completo = armarGuion({ ...pedida, temasSacados: [] });
  const hasta = completo.findIndex((x) => x.clave === actual.clave);
  const yaSalio = (tema: Tema) => {
    if (tema === 'escuela') return false; // solo saca una extra, que todavía no salió
    return completo.findIndex((x) => x.clave === PREGUNTA_DEL_TEMA[tema]) <= hasta;
  };
  // Para armar el guion: un tema cuya principal ya salió (o se saltó) queda como está en el
  // guion de ahora (sacado si su pregunta no está); los demás, como los pidió. Así el guion
  // nuevo coincide con el viejo hasta lo actual y ninguna foto se muda dos veces.
  const enElGuion = (tema: Exclude<Tema, 'escuela'>) => e.guion.some((x) => x.clave === PREGUNTA_DEL_TEMA[tema]);
  const temasDelGuion = TEMAS.filter((t) => (t !== 'escuela' && yaSalio(t) ? !enElGuion(t) : pedida.temasSacados.includes(t)));
  const guion = armarGuion({ ...pedida, temasSacados: temasDelGuion });
  const j = guion.findIndex((x) => x.clave === actual.clave);
  if (j < 0) throw new Error(`Panel: ${actual.clave} no quedó en el guion nuevo`); // no pasa: lo que ya salió no se saca
  // En la ficha, los temas como los pidió: sus extras todavía no salieron.
  e.ficha = pedida;
  e.guion = [...e.guion.slice(0, e.cursor + 1), ...guion.slice(j + 1)];
}
