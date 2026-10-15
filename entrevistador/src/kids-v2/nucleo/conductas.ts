// Chicos inventados para la simulación: cómo contestan (corto, largo,
// escrito, pasando todo, callándose días, de noche, tocando cualquier botón,
// tocando botones viejos o dos veces, contando algo preocupante). Azar con
// semilla: todo se repite. Cada botón que tocan lleva el `envio` del mensaje
// (como lo va a mandar WhatsApp).
//
// Chicos INVENTADOS. Nunca usar acá la vida de un narrador real.

import type { Canal, Ficha, Tema } from './compra.js';
import { TEMAS } from './compra.js';
import type { Accion, Conducta } from './corrida.js';
import { aLocal, aInstante, sumarDias } from './horas.js';
import type { Contenido, Enviado, Mensaje } from './motor.js';

export type Azar = { (): number; entre(a: number, b: number): number; uno<T>(xs: readonly T[]): T; si(p: number): boolean };

export function azar(semilla: number): Azar {
  let s = semilla >>> 0 || 1;
  const f = (() => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Azar;
  f.entre = (a, b) => a + Math.floor(f() * (b - a + 1));
  f.uno = (xs) => xs[Math.floor(f() * xs.length)];
  f.si = (p) => f() < p;
  return f;
}

export const TIPOS_DE_CONDUCTA = ['cuenta-mucho', 'contesta-corto', 'pasa-todo', 'escribe', 'se-calla', 'de-noche', 'toca-cualquier-cosa', 'algo-preocupante', 'toca-viejos'] as const;
export type TipoConducta = (typeof TIPOS_DE_CONDUCTA)[number];

const MIN = 60_000;
const DIA = 86_400_000;

/** Una pregunta que espera respuesta (no un botón suelto). */
export const esPregunta = (m: Mensaje) => /^(K\d+(-R\d+(-\d+)?|-OP)?|X\d-\d+|PADRE-\d)$/.test(m.id) && !(m.botones.length === 1 && m.botones[0] === 'No tengo');
export const esFoto = (m: Mensaje) => m.id.endsWith('-FOTO') || (/^X\d-\d+$/.test(m.id) && m.botones[0] === 'No tengo');

export const FRASE_PREOCUPANTE = 'y mi primo me pega cuando nadie mira';

export function fichaAlAzar(r: Azar, canal?: Canal): Ficha {
  const genero = r.uno(['chico', 'chica'] as const);
  const temas = r.si(0.1) ? [...TEMAS] : TEMAS.filter(() => r.si(0.2));
  const n = r.entre(0, 3);
  return {
    nombre: genero === 'chico' ? 'Bruno Ibáñez' : 'Martina Sosa',
    apodo: genero === 'chico' ? 'Bruno' : 'Tini',
    genero,
    edad: r.entre(10, 12),
    quienRegala: r.uno(['Tu mamá', 'Tu papá', 'Tus papás', 'Tu abuela', 'Tus abuelos', 'tu madrina']),
    canal: canal ?? r.uno(['A', 'B'] as const),
    nombrePadre: 'Laura Sosa',
    linkPanel: 'vitacora.com/panel/abc123',
    hora: r.uno(['09:00', '13:30', '18:00', '19:15', '21:30']),
    zona: r.uno(['America/Argentina/Buenos_Aires', 'Europe/Madrid', 'America/Mexico_City']),
    temasSacados: temas as Tema[],
    fotosConOtrosChicos: r.si(0.5),
    preguntasPadre: Array.from({ length: n }, (_, i) => ({ texto: `Contame la vez número ${i + 1} que nos reímos juntos`, conLinea: r.si(0.7) })),
  };
}

/**
 * Un chico con una conducta. `numeroPreguntas`: en canal B todo llega al
 * padre (es el mismo celular), así que mira todo.
 */
export function chico(tipo: TipoConducta, r: Azar, ficha: Ficha): Conducta {
  const mios = <M extends Mensaje>(ms: M[]) => (ficha.canal === 'B' ? ms : ms.filter((m) => m.a === 'chico'));
  let preocupanteDicho = false;
  /** En qué tanda (paso del motor) le llegó cada mensaje. */
  const tanda = new Map<string, number>();
  let tandas = 0;
  /**
   * Un mensaje quedó atrás si en una tanda posterior le llegó otro con botones (que no
   * sea un recordatorio ni el mismo mensaje vuelto a mandar): ya se espera otra cosa.
   */
  const quedoAtras = (m: Enviado, todo: Enviado[]) =>
    todo.some((n) => (tanda.get(n.envio) ?? 0) > (tanda.get(m.envio) ?? 0) && n.botones.length > 0 && !/^RECORD-/.test(n.id) && n.id !== m.id);

  const tarda = (ahora: Date): number => {
    if (tipo === 'se-calla' && r.si(0.08)) return r.entre(3, 12) * DIA + r.entre(0, 600) * MIN;
    if (tipo === 'de-noche') {
      const { fecha } = aLocal(ahora, ficha.zona);
      const noche = aInstante(fecha, r.uno(['22:20', '23:10', '23:50']), ficha.zona).getTime();
      const t = noche > ahora.getTime() ? noche : aInstante(sumarDias(fecha, 1), '23:10', ficha.zona).getTime();
      return t - ahora.getTime();
    }
    return r.entre(1, 50) * MIN;
  };

  const contar = (): { contenido: Contenido; dice: string }[] => {
    const audio = (seg: number, transcripcion?: string) => ({ contenido: { tipo: 'audio' as const, seg, ...(transcripcion ? { transcripcion } : {}) }, dice: `audio de ${seg} s${transcripcion ? `: "${transcripcion}"` : ''}` });
    switch (tipo) {
      case 'contesta-corto':
        return r.si(0.5) ? [audio(r.entre(3, 12))] : [{ contenido: { tipo: 'texto', texto: 'no sé' }, dice: 'texto: no sé' }];
      case 'escribe': {
        const texto = 'me acuerdo que estábamos en lo de mi abuela y llovía muchísimo y nadie quería salir';
        return [{ contenido: { tipo: 'texto', texto }, dice: `texto: ${texto}` }];
      }
      case 'algo-preocupante':
        if (!preocupanteDicho && r.si(0.15)) {
          preocupanteDicho = true;
          return [audio(r.entre(40, 90), FRASE_PREOCUPANTE)];
        }
        return [audio(r.entre(30, 120))];
      default:
        return r.si(0.2) ? [audio(r.entre(30, 90)), audio(r.entre(20, 60))] : [audio(r.entre(25, 180))];
    }
  };

  const contestar = (t: number): Accion[] =>
    contar().map((x, i) => ({ trasMs: t + i * 20_000, evento: { tipo: 'respuesta', contenido: x.contenido }, dice: x.dice }));
  return (llegaron, { ahora, todo, estado }) => {
    tandas++;
    for (const m of llegaron) tanda.set(m.envio, tandas);
    /** Toca un botón del mensaje `m` (con su envio). `viejo`: el mensaje ya quedó atrás. */
    const tocar = (t: number, boton: string, m: Enviado = u): Accion[] => {
      const viejo = quedoAtras(m, todo);
      return [{ trasMs: t, evento: { tipo: 'boton', boton, aMensaje: m.envio }, dice: `[${boton}]${viejo ? ` (de ${m.id}, viejo)` : ''}`, viejo }];
    };
    const ms = mios(llegaron);
    if (!ms.length) return [];
    const u = ms[ms.length - 1];
    const t = tarda(ahora);
    const acciones: Accion[] = [];
    if (tipo === 'toca-cualquier-cosa' && r.si(0.3)) {
      const viejo = r.uno(mios(todo).filter((m) => m.botones.length));
      if (viejo) acciones.push(...tocar(r.entre(1, 5) * MIN, r.uno(viejo.botones), viejo));
    }
    // Toca botones de mensajes que ya quedaron atrás (el de ayer, el que ya tocó) y a veces toca dos veces el de ahora.
    if (tipo === 'toca-viejos') {
      const viejos = mios(todo).filter((m) => m.botones.length > 0 && quedoAtras(m, todo));
      if (viejos.length && r.si(0.4)) {
        const v = r.uno(viejos);
        acciones.push(...tocar(r.entre(1, 5) * MIN, r.uno(v.botones), v));
      }
      if (u.botones.length && r.si(0.15)) acciones.push(...tocar(r.entre(55, 70) * MIN, r.uno(u.botones), u));
    }
    // Algo preocupante: a veces, el mismo día, toca botones viejos (el motor no tiene que hacer nada con ellos).
    if (tipo === 'algo-preocupante' && /^B-DIAFEO-ACUSE-/.test(u.id) && r.si(0.5)) {
      const viejo = r.uno(mios(todo).filter((m) => m.botones.length));
      if (viejo) return [...acciones, ...tocar(r.entre(1, 30) * MIN, r.uno(viejo.botones), viejo), ...tocar(r.entre(31, 90) * MIN, r.uno(viejo.botones), viejo)];
    }
    if (u.plantilla && u.botones.length) {
      // Se calla con el PREG-NUEVA de las extras: a los 2 días el libro cierra solo (cerro-sin-respuesta); días después lo toca.
      if (tipo === 'se-calla' && estado.fase.tipo === 'retenido' && estado.guion[estado.cursor]?.tipo === 'extras' && r.si(0.6)) {
        return [...acciones, ...tocar(r.entre(3, 6) * DIA + r.entre(0, 300) * MIN, u.botones[0])];
      }
      // A veces, en vez de tocar el botón de la bienvenida o del PREG-NUEVA, cuenta algo (decisión 21: suelta igual; si no es corto, antes el acuse).
      if ((tipo === 'escribe' || tipo === 'cuenta-mucho' || tipo === 'contesta-corto') && r.si(0.2)) return [...acciones, ...contestar(t)];
      return [...acciones, ...tocar(t, u.botones[0])];
    }
    if (esFoto(u)) {
      if (tipo === 'pasa-todo' || r.si(0.3)) return [...acciones, ...tocar(t, r.uno(u.botones))];
      return [...acciones, { trasMs: t, evento: { tipo: 'respuesta', contenido: { tipo: 'foto' } }, dice: 'foto' }];
    }
    if (esPregunta(u)) {
      const ramas = u.botones.slice(0, -1);
      if (tipo === 'pasa-todo' || r.si(0.05)) return [...acciones, ...tocar(t, u.botones[u.botones.length - 1])];
      if (ramas.length && r.si(0.8)) {
        const b = r.uno(ramas);
        return [...acciones, ...tocar(r.entre(1, 3) * MIN, b), ...contestar(t + 5 * MIN)];
      }
      return [...acciones, ...contestar(t)];
    }
    switch (u.id) {
      case 'B-SEGUIR':
        return [...acciones, ...tocar(r.entre(1, 10) * MIN, r.si(0.5) ? 'Dale, otra' : 'Mañana sigo')];
      case 'B-AVISO-SERIA':
        return [...acciones, ...tocar(t, r.si(0.7) ? 'Voy ahora' : 'Mañana mejor')];
      case 'B-TRANQUILA':
        return [...acciones, ...tocar(t, r.si(0.5) ? 'Dale, una tranquila' : 'Mañana sigo')];
      case 'B-UNA-MAS':
        return [...acciones, ...tocar(t, r.si(0.5) ? 'Dale, otra' : 'No, cerramos')];
      case 'EXTRAS-OFERTA':
        if (r.si(0.2)) return acciones; // no contesta: a los 2 días cierra solo
        return [...acciones, ...tocar(t, r.si(0.6) ? 'Dale, otra' : 'No, ya está')];
      case 'EXTRAS-OTRA':
        return [...acciones, ...tocar(t, r.si(0.6) ? 'Dale, otra' : 'Lo dejamos acá')];
      case 'B-FOTO-NOTENGO':
      case 'B-FOTO-PLATA':
        // En las extras del final, a veces cuenta algo preocupante después de [No tengo]: ese día la espera
        // del audio no vence y al otro día la ventana de 24 h puede estar cerrada.
        if (tipo === 'algo-preocupante' && estado.guion[estado.cursor]?.tipo === 'extras' && r.si(0.5)) {
          return [...acciones, { trasMs: r.entre(1, 8) * MIN, evento: { tipo: 'respuesta', contenido: { tipo: 'audio', seg: 40, transcripcion: FRASE_PREOCUPANTE } }, dice: `audio de 40 s: "${FRASE_PREOCUPANTE}"` }];
        }
        return r.si(0.5) ? [...acciones, ...contestar(r.entre(1, 8) * MIN)] : acciones;
    }
    if (/^CIERRE-/.test(u.id)) {
      // Se calla en el cierre final: a la hora del día siguiente vence y la oferta de extras sale sola (en canal B, detrás de un PREG-NUEVA).
      if (tipo === 'se-calla' && u.id === 'CIERRE-FINAL' && r.si(0.5)) return acciones;
      if (r.si(0.25)) return [...acciones, ...tocar(t, 'Sí, hay algo'), ...contestar(t + 3 * MIN)];
      return [...acciones, ...tocar(t, 'No, eso fue todo')];
    }
    return acciones;
  };
}
