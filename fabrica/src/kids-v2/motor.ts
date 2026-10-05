// El motor de Vitácora Kids V2 («Mi Primer Capítulo»): una máquina de estados
// pura. paso(estado, evento, ahora) → { estado, salidas }. Sin I/O, sin
// modelos de IA: los textos salen de banco.json (banco.md + mensajes.md).
//
// Quien lo conecte a WhatsApp (Joaquín): guarda el estado, manda las salidas
// (mensaje → texto o plantilla, al número del chico o del padre; marca → panel
// de Naza) y llama `reloj` en proximoDespertar() (o cada minuto).

import { armarGuion, validarFicha } from './compra.js';
import { esDeNoche, esHora } from './horas.js';
import { emitir, type Ctx } from './motor/flujo.js';
import { alBoton } from './motor/botones.js';
import { fijoA, variables } from './motor/mensajes.js';
import { procesarRafaga, sumarARafaga } from './motor/rafaga.js';
import { alReloj } from './motor/reloj.js';
import type { Estado, Evento, Salida } from './motor/tipos.js';
import { esPlural } from './texto.js';

export { nuevoEstado } from './motor/estado.js';
export { proximoDespertar } from './motor/reloj.js';
export type { Contenido, Estado, Evento, Fase, Mensaje, Salida } from './motor/tipos.js';

export function paso(estado: Estado, evento: Evento, ahora: string): { estado: Estado; salidas: Salida[] } {
  const c: Ctx = { e: structuredClone(estado), ahora: new Date(ahora), salidas: [], replay: false };
  aplicar(c, evento);
  return { estado: c.e, salidas: c.salidas };
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
      return sumarARafaga(c, ev.contenido);
    case 'boton':
      if (!c.replay) entro(c);
      if (noche) return void e.nocturnos.push(ev);
      // Cualquier otro botón del número de las preguntas también es contestar; [Estamos listos] lo lee y lo apaga él.
      if (!esEstamosListos(e, ev.boton)) e.reenviar = false;
      if (e.rafaga) procesarRafaga(c);
      return alBoton(c, ev.boton);
    case 'reloj':
      if (noche) return;
      if (e.nocturnos.length) {
        const guardados = e.nocturnos;
        e.nocturnos = [];
        c.replay = true;
        for (const g of guardados) aplicar(c, g);
        c.replay = false;
      }
      return alReloj(c);
    case 'ficha':
      return cambiarFicha(c, ev.cambios);
  }
}

const esEstamosListos = (e: Estado, boton: string) => e.ficha.canal === 'B' && boton === 'Estamos listos';

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
    emitir(c, fijoA(e, esPlural(f.quienRegala) ? 'BIEN-CHICO-PL' : 'BIEN-CHICO', { variables: variables.chico(f) }));
    emitir(c, fijoA(e, 'AVISO-PADRE', { variables: variables.avisoPadre(f), paraPadre: true }));
  } else emitir(c, fijoA(e, 'BIEN-PADRE', { variables: variables.padre(f) }));
  e.fase = { tipo: 'bienvenida' };
}

/**
 * El padre cambia algo en el panel (#34). La hora, siempre. Los temas, solo
 * para lo que todavía no salió. Sus preguntas, hasta que empieza el cap. 4.
 * Lo que ya pasó no se toca.
 */
function cambiarFicha(c: Ctx, cambios: Extract<Evento, { tipo: 'ficha' }>['cambios']): void {
  const e = c.e;
  if (cambios.hora !== undefined && esHora(cambios.hora)) e.ficha = validarFicha({ ...e.ficha, hora: cambios.hora });
  const actual = e.guion[e.cursor];
  const empezoCap4 = actual !== undefined && actual.cap >= 4;
  const nueva = validarFicha({
    ...e.ficha,
    temasSacados: cambios.temasSacados ?? e.ficha.temasSacados,
    preguntasPadre: cambios.preguntasPadre && !empezoCap4 ? cambios.preguntasPadre : e.ficha.preguntasPadre,
  });
  const guion = armarGuion(nueva);
  if (!actual) {
    e.ficha = nueva;
    e.guion = guion;
    return;
  }
  const j = guion.findIndex((x) => x.clave === actual.clave);
  if (j < 0) return; // sacó el tema de lo que se está preguntando ahora: ya salió, no se toca
  e.ficha = nueva;
  e.guion = [...e.guion.slice(0, e.cursor + 1), ...guion.slice(j + 1)];
}
