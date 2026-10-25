// El motor de un turno de «Vitácora de una historia» en WhatsApp. PURO: entra
// el estado y lo que hizo el narrador, sale el estado nuevo con los mensajes a
// mandar en `salientes`. No toca la base ni WhatsApp.
//
// Es el de src/v3/turno.ts (los audios se juntan en `borrador` hasta que el
// reloj cierra la respuesta a los 3' de silencio; el acuse va pegado arriba de
// lo que sigue; la abierta se guarda para reenviarla) sobre el flujo de
// historia (docs/historia/banco.md, "Reglas del flujo"):
//   - el arranque después del SÍ: TEMA-ABIERTO si el tema quedó abierto
//     (TEMA-LISTA si duda o pide ideas, una vez), y COMO (con TEMA-OK arriba si
//     eligió la historia) antes de la primera pregunta;
//   - FOTO-H, las preguntas de quien regala (PR-H1…PR-H3) y FIN-H, que decide
//     el núcleo (flujo.ts);
//   - el cazador corre al cerrarse cada bloque del banco del narrador (en V3,
//     al contestar el cierre de cada bloque; en historia hay un solo cierre).
// Sin lo de V3: la familia, la segunda oportunidad, el botón «Sí» con M30, las
// frases de entrada de bloque y AMH desde AM0.

import { bancoHistoria, mensajePorId, NOMBRES_BLOQUE, preguntaPorId } from './nucleo/entrevista/banco.js';
import { cazarBloque, fichaCazador, mensajeRepregunta, type ClienteModelo, type ResultadoCaza } from './nucleo/entrevista/cazador.js';
import { alTocarBoton, botonesDeClave, FIN, FOTO, mensajesDespues, preguntaDeClave, siguientePregunta } from './nucleo/entrevista/flujo.js';
import { idiomaDe } from './nucleo/entrevista/idioma.js';
import { acuseDeTurno, anotarAcuse, armarTurno, preguntaSegunAcuse } from './nucleo/entrevista/mensajes.js';
import { interpretar, leerBoton, normalizar, PREGUNTA_COMUN, sumarAudio } from './nucleo/entrevista/respuesta.js';
import { renderizar, type FichaTexto, type OpcionesTexto } from './nucleo/entrevista/texto.js';
import { claveMadre } from './filas.js';
import { respuestasSinSacadas, SIN_SACADAS, sinRepreguntasSacadas, type Sacadas } from './fuera.js';
import { CLAVE_TEMA, MARCA_FOTO, WAMIDS_VISTOS, type EstadoHistoria, type Parte, type Saliente } from './tipos.js';

function clonar(e: EstadoHistoria): EstadoHistoria {
  return JSON.parse(JSON.stringify(e)) as EstadoHistoria;
}

/** El texto de un globo como llega por WhatsApp (como en V3). */
export function textoDeGlobo(partes: Parte[]): string {
  return partes.map((p, i) => (i === 0 ? '' : partes[i - 1].id === p.id ? '\n\n' : '\n') + p.texto).join('');
}

/** Un mensaje del banco (M22, M23, M8, COMO, TEMA-ABIERTO…) en el idioma de la ficha, renderizado. */
export function textoDelBanco(id: string, ficha: FichaTexto, respuestas?: ReadonlyMap<string, string>, opciones?: OpcionesTexto): string {
  const m = mensajePorId(id, idiomaDe(ficha));
  if (!m) throw new Error(`El banco de historia (${idiomaDe(ficha)}) no tiene el mensaje ${id}.`);
  return renderizar(m.texto, ficha, respuestas, opciones);
}

function encolarEn(e: EstadoHistoria, s: Omit<Saliente, 'id'>): void {
  e.seq += 1;
  e.salientes.push({ ...s, id: e.seq });
}

/** Un globo del bot: a la charla y a la cola. */
function decir(e: EstadoHistoria, partes: Parte[], o: { tipo?: Saliente['tipo']; botones?: string[] } = {}): void {
  e.charla.push({ de: 'bio', partes, ...(o.botones ? { botones: o.botones } : {}) });
  encolarEn(e, { texto: textoDeGlobo(partes), tipo: o.tipo ?? 'turno', ...(o.botones ? { botones: o.botones } : {}) });
}

export function encolar(anterior: EstadoHistoria, s: Omit<Saliente, 'id'>): EstadoHistoria {
  const e = clonar(anterior);
  encolarEn(e, s);
  return e;
}

export function quitarSalientes(anterior: EstadoHistoria, ids: readonly number[]): EstadoHistoria {
  const e = clonar(anterior);
  e.salientes = e.salientes.filter((s) => !ids.includes(s.id));
  return e;
}

/** ¿Ese wa_message_id ya se aplicó al estado (o se dejó de lado a propósito)? */
export function yaVisto(e: Pick<EstadoHistoria, 'wamidsVistos'>, waMessageId: string): boolean {
  return (e.wamidsVistos ?? []).includes(waMessageId);
}

/** Anota el wa_message_id entre los vistos (se guardan los últimos WAMIDS_VISTOS). */
export function anotarVisto(anterior: EstadoHistoria, waMessageId: string): EstadoHistoria {
  const e = clonar(anterior);
  if (!yaVisto(e, waMessageId)) e.wamidsVistos = [...(e.wamidsVistos ?? []), waMessageId].slice(-WAMIDS_VISTOS);
  return e;
}

/** Saca de la cola los M8 que no salieron: el narrador escribió o la pregunta cambió. */
export function sinRecordatorios(anterior: EstadoHistoria): EstadoHistoria {
  const e = clonar(anterior);
  e.salientes = e.salientes.filter((s) => s.tipo !== 'recordatorio');
  return e;
}

export type AudioRecibido = { estado: EstadoHistoria; clave: string | null; abierta: boolean };

/**
 * Un audio (su transcripción) o un texto. Con algo abierto (una pregunta, TEMA-ABIERTO), se suma al borrador
 * (`abierta: true`: corre el reloj de silencio). Sin abierta no se suma a nada (como en V3: un «Gracias» no puede
 * terminar en el libro): `clave: null`, y la fila queda con SIN_CLAVE_HISTORIA.
 */
export function recibirAudio(anterior: EstadoHistoria, texto: string): AudioRecibido {
  const t = texto.replace(/\r\n?/g, '\n').trim();
  const e = clonar(anterior);
  if (t === '' || e.terminada || !e.esperando) return { estado: e, clave: null, abierta: false };
  e.borrador = sumarAudio(e.borrador ?? '', t);
  return { estado: e, clave: e.esperando, abierta: true };
}

export type Toque = { estado: EstadoHistoria; clave: string };

/**
 * Tocó un botón de lo abierto: [No tengo fotos] en FOTO-H o [Ya lo conté todo] en una repregunta. Los dos valen "no"
 * y cierran la respuesta (en historia no hay botones de «Sí»). Null si ese texto no es un botón de lo abierto: el que
 * llama lo trata como un botón suelto.
 */
export function tocarBoton(anterior: EstadoHistoria, ficha: FichaTexto, texto: string): Toque | null {
  const id = anterior.esperando;
  if (!id) return null;
  const botones = botonesDeClave(id, idiomaDe(ficha)) ?? [];
  if (!botones.some((b) => b.texto === texto)) return null;
  const e = clonar(anterior);
  const toque = alTocarBoton({ botones }, texto);
  e.charla.push({ de: 'persona', pregunta: id, texto: `[toca: ${texto}]`, boton: texto });
  e.borrador = sumarAudio(toque.respuesta, e.borrador ?? '');
  return { estado: e, clave: id };
}

/** Llegó una foto: si lo abierto es FOTO-H, queda marcada en el borrador. */
export function marcarFoto(anterior: EstadoHistoria): { estado: EstadoHistoria; clave: string } | null {
  if (anterior.esperando !== FOTO) return null;
  const e = clonar(anterior);
  if (!(e.borrador ?? '').includes(MARCA_FOTO)) e.borrador = sumarAudio(MARCA_FOTO, e.borrador ?? '');
  return { estado: e, clave: FOTO };
}

// ---------------------------------------------------------------- el tema abierto

/** Frases de «dame ideas» en TEMA-ABIERTO (el mensaje ofrece ideas si duda). Se comparan con `normalizar`. */
const PIDE_IDEAS = /\b(ideas?|idees?|ejemplos?|exemples?|opciones|opcions|lista)\b/;

/**
 * ¿Lo que contestó en TEMA-ABIERTO es una duda y no una historia? (banco.md, regla 2: «Si duda o pide ideas, va
 * TEMA-LISTA»). Sin modelo: un olvido («no sé»), un "no", un "paso", nada, o un mensaje corto que pide ideas.
 */
export function esDudaDeTema(texto: string, ficha: FichaTexto): boolean {
  const dicho = leerBoton(texto).resto.trim();
  const i = interpretar({ ...PREGUNTA_COMUN, id: CLAVE_TEMA }, dicho, idiomaDe(ficha));
  if (i === 'olvido' || i === 'no' || i === 'paso' || i === 'vacio') return true;
  const palabras = normalizar(dicho).split(' ').filter(Boolean);
  return palabras.length <= 12 && PIDE_IDEAS.test(normalizar(dicho));
}

/** TEMA-ABIERTO (o TEMA-LISTA) abierto: espera la historia. */
function abrirTema(e: EstadoHistoria, ficha: FichaTexto, id: 'TEMA-ABIERTO' | 'TEMA-LISTA'): void {
  const partes = [{ id, texto: textoDelBanco(id, ficha) }];
  decir(e, partes);
  e.preguntaAbierta = { partes };
  e.esperando = CLAVE_TEMA;
  e.fase = 'tema';
}

/** COMO (con TEMA-OK arriba si eligió la historia en TEMA-ABIERTO), y empieza la entrevista. */
function decirComo(e: EstadoHistoria, ficha: FichaTexto): void {
  const eligio = e.respuestas.some(([k]) => k === CLAVE_TEMA);
  const ids = eligio ? ['TEMA-OK', 'COMO'] : ['COMO'];
  decir(e, ids.map((id) => ({ id, texto: textoDelBanco(id, ficha) })));
  e.fase = 'entrevista';
}

export type Avance = { estado: EstadoHistoria; abrio: boolean };

/**
 * Dijo SÍ (banco.md, reglas 1 a 3): con el tema abierto, TEMA-ABIERTO; si no, COMO y la primera pregunta. Lo llama
 * entrante.ts con el narrador recién pasado a activo.
 */
export function arrancar(anterior: EstadoHistoria, ficha: FichaTexto): Avance {
  if (anterior.fase !== 'bienvenida') return { estado: anterior, abrio: false };
  const e = clonar(anterior);
  if (e.temaAbierto && !e.respuestas.some(([k]) => k === CLAVE_TEMA)) {
    abrirTema(e, ficha, 'TEMA-ABIERTO');
    return { estado: e, abrio: true };
  }
  decirComo(e, ficha);
  return avanzar(e, ficha);
}

// ---------------------------------------------------------------- cerrar y seguir

/** El banco del narrador (la parte común y las de su tema, con las variantes en su lugar). */
export function bancoDe(e: Pick<EstadoHistoria, 'temaAbierto'>, ficha: FichaTexto) {
  return bancoHistoria(ficha.tema, idiomaDe(ficha), { temaAbierto: e.temaAbierto }).preguntas;
}

/**
 * ¿Con esta respuesta se cerró su bloque? Sí si es una pregunta del banco y ya no le queda ninguna de ese bloque por
 * contestar (el cazador corre en ese momento). Las repreguntas, FOTO-H y las de quien regala no cierran nada.
 */
function bloqueQueCierra(e: EstadoHistoria, ficha: FichaTexto, id: string): number | undefined {
  const banco = bancoDe(e, ficha);
  const p = banco.find((q) => q.id === id);
  if (!p) return undefined;
  const hechas = new Set([...e.respuestas.map(([k]) => k), ...e.enviados]);
  return banco.some((q) => q.bloque === p.bloque && !hechas.has(q.id)) ? undefined : p.bloque;
}

/** `sinElegir`: ya tuvo TEMA-LISTA y sigue sin elegir su historia (quien llama avisa a los socios, una vez). */
export type Cierre = { estado: EstadoHistoria; bloqueCerrado?: number; temaElegido?: string; sinElegir?: true };

/**
 * La respuesta de `esperando` está completa: pasa a `respuestas` y se anota su acuse (como en V3). En TEMA-ABIERTO:
 * si es una duda y todavía no salió TEMA-LISTA, sale la lista y se sigue esperando; si no, queda elegida
 * (`temaElegido`, que va a `ficha.temaLibre`).
 */
export function cerrarRespuesta(anterior: EstadoHistoria, ficha: FichaTexto): Cierre {
  const id = anterior.esperando;
  if (!id) throw new Error('cerrarRespuesta: no hay nada esperando respuesta.');
  const borrador = (anterior.borrador ?? '').trim();
  if (borrador === '') throw new Error(`cerrarRespuesta: ${id} no tiene nada para cerrar.`);
  const e = clonar(anterior);
  const dicho = leerBoton(borrador).resto.trim();
  if (dicho) e.charla.push({ de: 'persona', pregunta: id, texto: dicho });
  e.esperando = undefined;
  e.borrador = undefined;
  e.preguntaAbierta = undefined;
  e.abiertaPorPlantilla = undefined;
  e.acuse = undefined;
  // Un M8 que no salió era de esta pregunta: ya no corresponde.
  e.salientes = e.salientes.filter((s) => s.tipo !== 'recordatorio');

  if (id === CLAVE_TEMA) {
    if (esDudaDeTema(borrador, ficha)) {
      if (!e.temaLista) {
        e.temaLista = true;
        abrirTema(e, ficha, 'TEMA-LISTA');
        return { estado: e };
      }
      // Ya tuvo la lista y sigue sin elegir: se espera (M8 le recuerda); entrante.ts avisa a los socios una vez.
      e.esperando = CLAVE_TEMA;
      e.preguntaAbierta = anterior.preguntaAbierta;
      return { estado: e, sinElegir: true };
    }
    e.respuestas.push([CLAVE_TEMA, dicho]);
    return { estado: e, temaElegido: dicho };
  }

  e.respuestas.push([id, borrador]);
  const idioma = idiomaDe(ficha);
  const anteriores = new Map(e.respuestas.slice(0, -1)); // para M29 (tercer olvido seguido)
  const p = preguntaDeClave(id, idioma);
  if (!p) e.acuse = anotarAcuse('M3', e.vueltas);
  else for (const fam of mensajesDespues(p, borrador, anteriores, idioma)) e.acuse = anotarAcuse(fam, e.vueltas);
  const bloque = bloqueQueCierra(e, ficha, id);
  return bloque !== undefined ? { estado: e, bloqueCerrado: bloque } : { estado: e };
}

/**
 * Manda todo lo que va hasta lo próximo que espera respuesta (o hasta FIN-H). `sacadas`: lo que la familia sacó del
 * libro desde el panel; una repregunta en cola sobre eso no sale (fuera.ts).
 */
export function avanzar(anterior: EstadoHistoria, ficha: FichaTexto, sacadas: Sacadas = SIN_SACADAS): Avance {
  if (anterior.esperando) throw new Error(`avanzar: ${anterior.esperando} todavía espera respuesta.`);
  const e = clonar(sinRepreguntasSacadas(anterior, sacadas));
  if (e.terminada || e.fase !== 'entrevista') return { estado: e, abrio: false };
  const idioma = idiomaDe(ficha);
  const respuestas = new Map(e.respuestas);

  type Mandar = {
    id: string;
    /** El texto sin acuse delante (el que se reenvía). */
    solo: string;
    /** El texto según el acuse que va pegado (FOTO-H sin el nombre si el acuse ya lo dice). */
    conAcuse?: (acuseSinRenderizar: string | undefined) => string;
    /** Lo que mira el acuse para elegirse (M26 delante del cierre o de una sensible). */
    siguiente: { id: string; clase: 'historia' | 'cierre'; sensible?: boolean };
    m1?: boolean;
    ayuda?: boolean;
    botones?: string[];
  };
  const mandar = (t: Mandar): void => {
    const a = e.acuse;
    const idAcuse = a && acuseDeTurno(a.familia, a.n, t.solo, t.siguiente);
    const acuseCrudo = idAcuse ? mensajePorId(idAcuse, idioma)?.texto : undefined;
    const textos: Record<string, string> = { [t.id]: t.conAcuse ? t.conAcuse(acuseCrudo) : t.solo };
    const m1 = t.m1 ? 'M1' : undefined;
    const ayuda = t.ayuda ? 'M31' : undefined;
    const porId = armarTurno({ acuse: idAcuse, familia: a?.familia, pregunta: t.id, m1, ayuda });
    porId.forEach((m, i) => {
      const partes = m.split('\n').map((id) => ({ id, texto: textos[id] ?? textoDelBanco(id, ficha) }));
      decir(e, partes, i === porId.length - 1 && t.botones ? { botones: t.botones } : {});
    });
    const sola = armarTurno({ pregunta: t.id, m1, ayuda })[0].split('\n').map((id) => ({ id, texto: id === t.id ? t.solo : textoDelBanco(id, ficha) }));
    e.preguntaAbierta = { partes: sola, ...(t.botones ? { botones: t.botones } : {}) };
    e.acuse = undefined;
    e.esperando = t.id;
  };

  const s = siguientePregunta({ respuestas, enviados: new Set(e.enviados), tema: ficha.tema, temaAbierto: e.temaAbierto, propias: e.propias, panel: e.panel, repreguntas: e.repreguntas, idioma });
  switch (s.tipo) {
    case 'terminada':
      e.terminada = true;
      return { estado: e, abrio: false };
    case 'fin': {
      // Después de HC10 no hay acuse (regla 8): FIN-H sale solo.
      e.acuse = undefined;
      decir(e, [{ id: FIN, texto: textoDelBanco(FIN, ficha, respuestas) }]);
      e.enviados.push(FIN);
      e.terminada = true;
      return { estado: e, abrio: false };
    }
    case 'repregunta': {
      const rp = s.repregunta;
      mandar({ id: rp.clave, solo: mensajeRepregunta(rp, idioma), siguiente: { id: rp.clave, clase: 'historia' }, botones: s.botones.map((b) => b.texto) });
      return { estado: e, abrio: true };
    }
    case 'foto': {
      const crudo = mensajePorId(FOTO, idioma)!.texto;
      mandar({
        id: FOTO,
        solo: renderizar(crudo, ficha, respuestas),
        conAcuse: (acuse) => renderizar(preguntaSegunAcuse(FOTO, crudo, acuse), ficha, respuestas),
        siguiente: { id: FOTO, clase: 'historia' },
        ...(s.botones ? { botones: s.botones.map((b) => b.texto) } : {}),
        ...(s.ayudaBotones ? { ayuda: true } : {}),
      });
      return { estado: e, abrio: true };
    }
    case 'propia':
      mandar({ id: s.clave, solo: textoDelBanco(s.clave, ficha, respuestas, { pregunta: s.pregunta }), siguiente: { id: s.clave, clase: 'historia' } });
      return { estado: e, abrio: true };
    case 'panel':
      // PF-H1 o PF-H2 con la pregunta tal cual; la parte va con la clave F:<id> (el panel la reconoce por eso).
      mandar({ id: s.clave, solo: textoDelBanco(s.mensaje, ficha, respuestas, { pregunta: s.pregunta }), siguiente: { id: s.clave, clase: 'historia' } });
      return { estado: e, abrio: true };
    case 'pregunta': {
      const p = s.pregunta;
      if (p.bloque !== e.bloqueActual) {
        e.bloqueActual = p.bloque;
        e.charla.push({ de: 'bloque', bloque: p.bloque, nombre: NOMBRES_BLOQUE[p.bloque] ?? `Bloque ${p.bloque}` });
      }
      mandar({ id: p.id, solo: renderizar(p.texto, ficha, respuestas), siguiente: p, m1: s.conM1 });
      return { estado: e, abrio: true };
    }
  }
}

export type Seguir = { estado: EstadoHistoria; abrio: boolean; bloqueCerrado?: number; temaElegido?: string; sinElegir?: true };

/**
 * Cierra lo abierto y manda lo que sigue (si contesta, le llega la siguiente siempre, como en V3 desde el 10/10). Con
 * `temaElegido`, quien llama guarda `ficha.temaLibre`: lo que sigue (COMO y HC1-A) ya sale con la ficha nueva.
 */
export function cerrarYSeguir(anterior: EstadoHistoria, ficha: FichaTexto, sacadas: Sacadas = SIN_SACADAS): Seguir {
  const c = cerrarRespuesta(anterior, ficha);
  if (c.estado.esperando) return { estado: c.estado, abrio: true, ...(c.sinElegir ? { sinElegir: true as const } : {}) }; // salió TEMA-LISTA, o sigue sin elegir
  if (c.temaElegido !== undefined) {
    const conTema = { ...ficha, temaLibre: c.temaElegido };
    const e = clonar(c.estado);
    decirComo(e, conTema);
    const a = avanzar(e, conTema, sacadas);
    return { estado: a.estado, abrio: a.abrio, temaElegido: c.temaElegido };
  }
  const a = avanzar(c.estado, ficha, sacadas);
  return { estado: a.estado, abrio: a.abrio, ...(c.bloqueCerrado !== undefined ? { bloqueCerrado: c.bloqueCerrado } : {}) };
}

/** Lo abierto otra vez, solo (sin el acuse de antes). */
export function reenviarAbierta(anterior: EstadoHistoria): EstadoHistoria {
  const e = clonar(anterior);
  const p = e.preguntaAbierta;
  if (!e.esperando || !p) return e;
  e.abiertaPorPlantilla = undefined; // sale ahora, en la ventana, con sus botones
  decir(e, p.partes, p.botones ? { botones: p.botones } : {});
  return e;
}

// ---------------------------------------------------------------- cazador

/** La pregunta como se le mandó; si todavía no salió, como va a salir. */
export function textoMandado(e: EstadoHistoria, ficha: FichaTexto, id: string): string {
  let texto: string | undefined;
  for (const g of e.charla) {
    if (g.de !== 'bio') continue;
    const partes = g.partes.filter((p) => p.id === id).map((p) => p.texto);
    if (partes.length > 0) texto = partes.join('\n\n'); // si se mandó dos veces, vale la última
  }
  const delBanco = preguntaPorId(id, idiomaDe(ficha));
  return texto ?? (delBanco ? renderizar(delBanco.texto, ficha) : '');
}

/** ¿Pidió que esa respuesta no vaya al libro? (también la de su pregunta madre). */
export function esReservada(e: Pick<EstadoHistoria, 'reservadas'>, clave: string): boolean {
  const r = e.reservadas ?? [];
  return r.includes(clave) || r.includes(claveMadre(clave));
}

export function cazarAlCerrar(e: EstadoHistoria, ficha: FichaTexto, bloque: number, cliente: ClienteModelo, sacadas: Sacadas = SIN_SACADAS): Promise<ResultadoCaza> {
  return cazarBloque({
    cliente,
    ficha: fichaCazador(ficha),
    bloque,
    banco: bancoDe(e, ficha),
    // Lo que pidió que no vaya al libro tampoco va al modelo, ni lo que sacó la familia.
    respuestas: new Map(respuestasSinSacadas(e.respuestas, sacadas).filter(([k]) => !esReservada(e, k))),
    textoPregunta: (id) => textoMandado(e, ficha, id),
    yaRepreguntado: e.repreguntas ?? [],
    escenasContadas: e.cazador?.escenasContadas ?? [],
    gastoUsd: e.cazador?.gastoUsd ?? 0,
    idioma: idiomaDe(ficha),
  });
}

/** Suma lo que devolvió el cazador (como en V3): la cola sin repetir clave, el gasto, las escenas y la llamada. */
export function sumarCaza(anterior: EstadoHistoria, r: ResultadoCaza): EstadoHistoria {
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
