// El motor de un turno de la entrevista V3 en WhatsApp (spec 2026-10-07),
// portado de fabrica/scripts/v3-entrevista-turno.ts. PURO: entra el estado y
// lo que hizo el narrador, sale el estado nuevo con los mensajes a mandar en
// `salientes`. No toca la base ni WhatsApp.
//
// Diferencias con el script, todas por WhatsApp:
//   - no manda la bienvenida (BIEN): el narrador ya está en la conversación;
//   - los audios se juntan en `borrador` hasta que el reloj cierra la
//     respuesta (3' de silencio): `recibirAudio` no avanza;
//   - `cerrarRespuesta` y `avanzar` van separados, para respetar el tope de
//     la tanda del día (el acuse queda pendiente y sale pegado mañana);
//   - guarda la pregunta abierta sin acuse, para reenviarla al día siguiente.
// Lo demás es el script línea por línea (un test lo compara mensaje por mensaje).

import { mensajePorId, nombresBloqueDe, preguntaPorId } from './nucleo/entrevista/banco.js';
import { cazarBloque, fichaCorta, mensajeRepregunta, type ClienteModelo, type ResultadoCaza } from './nucleo/entrevista/cazador.js';
import { alTocarBoton, anotarInferidas, botonesDeClave, mensajesDespues, preguntaDeClave, siguientePregunta } from './nucleo/entrevista/flujo.js';
import { idiomaDe } from './nucleo/entrevista/idioma.js';
import { acuseDeTurno, anotarAcuse, armarTurno, entradaSegunAcuse, preguntaSegunAcuse } from './nucleo/entrevista/mensajes.js';
import { leerBoton, sumarAudio } from './nucleo/entrevista/respuesta.js';
import { renderizar, type FichaTexto } from './nucleo/entrevista/texto.js';
import { MARCA_FOTO, WAMIDS_VISTOS, type EstadoV3, type Parte, type Saliente } from './tipos.js';

function clonar(e: EstadoV3): EstadoV3 {
  return JSON.parse(JSON.stringify(e)) as EstadoV3;
}

/** El texto de un globo como llega por WhatsApp (igual que en el script). */
export function textoDeGlobo(partes: Parte[]): string {
  return partes.map((p, i) => (i === 0 ? '' : partes[i - 1].id === p.id ? '\n\n' : '\n') + p.texto).join('');
}

/** Un mensaje del banco (M22, M23, M30, M8…) en el idioma de la ficha, renderizado. */
export function textoDelBanco(id: string, ficha: FichaTexto): string {
  const m = mensajePorId(id, idiomaDe(ficha));
  if (!m) throw new Error(`El banco (${idiomaDe(ficha)}) no tiene el mensaje ${id}.`);
  return renderizar(m.texto, ficha);
}

function encolarEn(e: EstadoV3, s: Omit<Saliente, 'id'>): void {
  e.seq += 1;
  e.salientes.push({ ...s, id: e.seq });
}

export function encolar(anterior: EstadoV3, s: Omit<Saliente, 'id'>): EstadoV3 {
  const e = clonar(anterior);
  encolarEn(e, s);
  return e;
}

export function quitarSalientes(anterior: EstadoV3, ids: readonly number[]): EstadoV3 {
  const e = clonar(anterior);
  e.salientes = e.salientes.filter((s) => !ids.includes(s.id));
  return e;
}

/** ¿Ese wa_message_id ya se aplicó al estado (o se dejó de lado a propósito)? */
export function yaVisto(e: Pick<EstadoV3, 'wamidsVistos'>, waMessageId: string): boolean {
  return (e.wamidsVistos ?? []).includes(waMessageId);
}

/** Anota el wa_message_id entre los vistos (se guardan los últimos WAMIDS_VISTOS). */
export function anotarVisto(anterior: EstadoV3, waMessageId: string): EstadoV3 {
  const e = clonar(anterior);
  if (!yaVisto(e, waMessageId)) e.wamidsVistos = [...(e.wamidsVistos ?? []), waMessageId].slice(-WAMIDS_VISTOS);
  return e;
}

/** Saca de la cola los M8 que no salieron: el narrador escribió o la pregunta cambió, ya no corresponden. */
export function sinRecordatorios(anterior: EstadoV3): EstadoV3 {
  const e = clonar(anterior);
  e.salientes = e.salientes.filter((s) => s.tipo !== 'recordatorio');
  return e;
}

export type AudioRecibido = { estado: EstadoV3; clave: string | null; abierta: boolean };

/**
 * Un audio (su transcripción). Con una pregunta abierta, se suma al borrador
 * (`abierta: true`: corre el reloj de silencio). Sin abierta (después del tope
 * de la tanda), se suma a la última respuesta.
 */
export function recibirAudio(anterior: EstadoV3, texto: string): AudioRecibido {
  const t = texto.replace(/\r\n?/g, '\n').trim();
  const e = clonar(anterior);
  if (t === '' || e.terminada) return { estado: e, clave: null, abierta: false };
  if (e.esperando) {
    e.borrador = sumarAudio(e.borrador ?? '', t);
    return { estado: e, clave: e.esperando, abierta: true };
  }
  const ultima = e.respuestas.at(-1);
  if (!ultima) return { estado: e, clave: null, abierta: false };
  ultima[1] = sumarAudio(ultima[1], t);
  return { estado: e, clave: ultima[0], abierta: false };
}

export type Toque = { estado: EstadoV3; clave: string; cerrar: boolean };

/**
 * Tocó un botón de la pregunta abierta. Null si ese texto no es un botón de la
 * abierta (o si ya tocó "Sí"): el que llama lo trata como texto suelto.
 * "Sí" que pide audio: la marca a `respuestas`, `tocoSi` y M30 a la cola.
 * "No" / "Paso" (y el "Sí" de AMH): la marca al borrador y `cerrar: true`.
 */
export function tocarBoton(anterior: EstadoV3, ficha: FichaTexto, texto: string): Toque | null {
  const id = anterior.esperando;
  if (!id || anterior.tocoSi) return null;
  const botones = botonesDeClave(id, idiomaDe(ficha)) ?? [];
  if (!botones.some((b) => b.texto === texto)) return null;
  const e = clonar(anterior);
  const toque = alTocarBoton({ id, botones }, texto);
  const respuesta = sumarAudio(toque.respuesta, e.borrador ?? '');
  e.charla.push({ de: 'persona', pregunta: id, texto: `[toca: ${texto}]`, boton: texto });
  if (toque.esperaAudio) {
    e.respuestas.push([id, respuesta]);
    e.tocoSi = true;
    e.borrador = undefined;
    const m30 = textoDelBanco(toque.mandar, ficha);
    e.charla.push({ de: 'bio', partes: [{ id: toque.mandar, texto: m30 }] });
    encolarEn(e, { texto: m30, tipo: 'suelto' });
    return { estado: e, clave: id, cerrar: false };
  }
  e.borrador = respuesta;
  return { estado: e, clave: id, cerrar: true };
}

/**
 * Llegó una foto: si la abierta es la de la foto (FO1), queda marcada en el
 * borrador. La ficha da el idioma del banco (sin ficha, es-AR, como el resto
 * del núcleo).
 */
export function marcarFoto(anterior: EstadoV3, ficha?: FichaTexto): { estado: EstadoV3; clave: string } | null {
  const id = anterior.esperando;
  if (!id || preguntaPorId(id, idiomaDe(ficha))?.clase !== 'foto') return null;
  const e = clonar(anterior);
  if (!(e.borrador ?? '').includes(MARCA_FOTO)) e.borrador = sumarAudio(MARCA_FOTO, e.borrador ?? '');
  return { estado: e, clave: id };
}

export type Cierre = { estado: EstadoV3; bloqueCerrado?: number };

/** La respuesta de `esperando` está completa: pasa a `respuestas` y se anota su acuse (como en el script). */
export function cerrarRespuesta(anterior: EstadoV3, ficha: FichaTexto): Cierre {
  const id = anterior.esperando;
  if (!id) throw new Error('cerrarRespuesta: no hay ninguna pregunta esperando respuesta.');
  const borrador = (anterior.borrador ?? '').trim();
  if (!anterior.tocoSi && borrador === '') throw new Error(`cerrarRespuesta: ${id} no tiene nada para cerrar.`);
  // Como el script: después de "Sí" la respuesta se cierra recién con lo que cuente (la marca sola no alcanza).
  if (anterior.tocoSi && borrador === '') throw new Error(`cerrarRespuesta: en ${id} tocó "Sí" y todavía no contó nada.`);
  const e = clonar(anterior);
  if (e.tocoSi) {
    const ultima = e.respuestas.at(-1)!;
    ultima[1] = sumarAudio(ultima[1], borrador);
  } else {
    e.respuestas.push([id, borrador]);
  }
  const dicho = leerBoton(borrador).resto.trim();
  if (dicho) e.charla.push({ de: 'persona', pregunta: id, texto: dicho });
  e.esperando = undefined;
  e.tocoSi = undefined;
  e.borrador = undefined;
  e.preguntaAbierta = undefined;
  e.abiertaPorPlantilla = undefined;
  e.acuse = undefined;
  // Un M8 que no salió era de esta pregunta: ya no corresponde.
  e.salientes = e.salientes.filter((s) => s.tipo !== 'recordatorio');
  const idioma = idiomaDe(ficha);
  const [, r] = e.respuestas.at(-1)!;
  const anteriores = new Map(e.respuestas.slice(0, -1)); // para M29 (tercer olvido seguido)
  const p = preguntaDeClave(id, idioma);
  if (!p) e.acuse = anotarAcuse('M3', e.vueltas); // pregunta de la familia: acuse común
  else for (const fam of mensajesDespues(p, r, anteriores, idioma)) e.acuse = anotarAcuse(fam, e.vueltas);
  const delBanco = preguntaPorId(id, idioma);
  return delBanco?.clase === 'cierre' ? { estado: e, bloqueCerrado: delBanco.bloque } : { estado: e };
}

export type Avance = { estado: EstadoV3; abrio: boolean };

/** Manda todo lo que va hasta la próxima pregunta que espera respuesta (o hasta el final). Igual que `avanzar` del script. */
export function avanzar(anterior: EstadoV3, ficha: FichaTexto): Avance {
  if (anterior.esperando) throw new Error(`avanzar: ${anterior.esperando} todavía espera respuesta.`);
  const e = clonar(anterior);
  if (e.terminada) return { estado: e, abrio: false };
  const idioma = idiomaDe(ficha);
  const respuestas = new Map(e.respuestas);
  const enviados = new Set(e.enviados);
  // Lo que no se manda porque otra respuesta ya lo dijo queda guardado (AMH desde AM0).
  for (const id of anotarInferidas(respuestas, idioma)) e.respuestas.push([id, respuestas.get(id)!]);
  const texto = (id: string) => textoDelBanco(id, ficha);

  type Mandar = { entrada?: string; pregunta: string; conM1?: boolean; ayuda?: boolean; botones?: string[] };
  const mandar = (t: Mandar, textos: Record<string, string>, espera: boolean): void => {
    const siguiente = t.entrada ? texto(t.entrada) : (textos[t.pregunta] ?? texto(t.pregunta));
    const quePregunta = preguntaPorId(t.pregunta, idioma) ?? { id: t.pregunta, clase: 'historia' as const };
    const a = e.acuse;
    const idAcuse = a && acuseDeTurno(a.familia, a.n, siguiente, quePregunta);
    const textoAcuse = idAcuse ? mensajePorId(idAcuse, idioma)?.texto : undefined;
    if (t.entrada) textos[t.entrada] = renderizar(entradaSegunAcuse(mensajePorId(t.entrada, idioma)!.texto, textoAcuse), ficha);
    const delBanco = preguntaPorId(t.pregunta, idioma);
    // La pregunta sin acuse delante: la que se reenvía al día siguiente.
    const sola = delBanco ? renderizar(delBanco.texto, ficha, respuestas) : (textos[t.pregunta] ?? texto(t.pregunta));
    // FO1 va sin el nombre si el acuse pegado ya lo dice.
    if (!t.entrada && delBanco) textos[t.pregunta] = renderizar(preguntaSegunAcuse(t.pregunta, delBanco.texto, textoAcuse), ficha, respuestas);
    const m1 = t.conM1 ? 'M1' : undefined;
    const ayuda = t.ayuda ? 'M31' : undefined;
    const porId = armarTurno({ acuse: idAcuse, familia: a?.familia, entrada: t.entrada, pregunta: t.pregunta, m1, ayuda });
    // Los botones van debajo del mensaje de la pregunta (el último del turno).
    const botones = t.botones ?? delBanco?.botones?.map((b) => b.texto);
    porId.forEach((m, i) => {
      const partes = m.split('\n').map((id) => ({ id, texto: textos[id] ?? texto(id) }));
      const conBotones = botones !== undefined && i === porId.length - 1;
      e.charla.push({ de: 'bio', partes, ...(conBotones ? { botones } : {}) });
      encolarEn(e, { texto: textoDeGlobo(partes), tipo: 'turno', ...(conBotones ? { botones } : {}) });
    });
    if (espera) {
      const partes = armarTurno({ pregunta: t.pregunta, m1, ayuda })[0]
        .split('\n')
        .map((id) => ({ id, texto: id === t.pregunta ? sola : (textos[id] ?? texto(id)) }));
      e.preguntaAbierta = { partes, ...(botones ? { botones } : {}) };
    }
    e.acuse = undefined;
  };

  for (let vuelta = 0; vuelta < 50; vuelta++) {
    const s = siguientePregunta({ respuestas, enviados, rondaExtra: 'rechazada', familia: e.familia, repreguntas: e.repreguntas, idioma });
    if (s.tipo === 'terminada' || s.tipo === 'ofrecer-extra') {
      e.terminada = true; // la ronda extra no se ofrece: 'ofrecer-extra' no puede llegar
      return { estado: e, abrio: false };
    }
    if (s.tipo === 'familia') {
      mandar({ entrada: 'M15', pregunta: s.pregunta.id }, { [s.pregunta.id]: s.pregunta.texto }, true);
      e.esperando = s.pregunta.id;
      return { estado: e, abrio: true };
    }
    if (s.tipo === 'segunda-oportunidad') {
      mandar({ pregunta: s.mensaje }, {}, true); // M33.n va solo; lo que conteste se guarda como X~2
      e.esperando = s.clave;
      return { estado: e, abrio: true };
    }
    if (s.tipo === 'repregunta') {
      const rp = s.repregunta;
      mandar({ pregunta: rp.clave, botones: s.botones.map((b) => b.texto) }, { [rp.clave]: mensajeRepregunta(rp, idioma) }, true);
      e.esperando = rp.clave;
      return { estado: e, abrio: true };
    }
    const p = s.pregunta;
    if (p.bloque !== e.bloqueActual) {
      e.bloqueActual = p.bloque;
      e.charla.push({ de: 'bloque', bloque: p.bloque, nombre: nombresBloqueDe(idioma)[p.bloque] });
    }
    mandar({ entrada: s.entrada, pregunta: p.id, conM1: s.conM1, ayuda: s.ayudaBotones }, { [p.id]: renderizar(p.texto, ficha, respuestas) }, s.esperaRespuesta);
    if (s.esperaRespuesta) {
      e.esperando = p.id;
      return { estado: e, abrio: true };
    }
    // Aviso (AV11) y final (FIN): no esperan respuesta, sigue lo que venga.
    enviados.add(p.id);
    e.enviados.push(p.id);
  }
  throw new Error('avanzar: más de 50 mensajes sin una pregunta que espere respuesta.');
}

export type Seguir = { estado: EstadoV3; abrio: boolean; bloqueCerrado?: number };

/** Cierra la abierta y, si la tanda no llegó al tope (`puedeAbrir`), manda lo que sigue. */
export function cerrarYSeguir(anterior: EstadoV3, ficha: FichaTexto, puedeAbrir: boolean): Seguir {
  const c = cerrarRespuesta(anterior, ficha);
  const bloque = c.bloqueCerrado !== undefined ? { bloqueCerrado: c.bloqueCerrado } : {};
  if (!puedeAbrir) return { estado: c.estado, abrio: false, ...bloque };
  const a = avanzar(c.estado, ficha);
  return { estado: a.estado, abrio: a.abrio, ...bloque };
}

/** La pregunta abierta otra vez, sola (sin el acuse ni la entrada de ayer). */
export function reenviarAbierta(anterior: EstadoV3): EstadoV3 {
  const e = clonar(anterior);
  const p = e.preguntaAbierta;
  if (!e.esperando || !p) return e;
  e.abiertaPorPlantilla = undefined; // sale ahora, en la ventana, con sus botones
  e.charla.push({ de: 'bio', partes: p.partes, ...(p.botones ? { botones: p.botones } : {}) });
  encolarEn(e, { texto: textoDeGlobo(p.partes), tipo: 'turno', ...(p.botones ? { botones: p.botones } : {}) });
  return e;
}

// ---------------------------------------------------------------- cazador

/** La pregunta como se le mandó (igual que en el script). */
export function textoMandado(e: EstadoV3, ficha: FichaTexto, id: string): string {
  let texto: string | undefined;
  for (const g of e.charla) {
    if (g.de !== 'bio') continue;
    const partes = g.partes.filter((p) => p.id === id).map((p) => p.texto);
    if (partes.length > 0) texto = partes.join('\n\n'); // si se mandó dos veces, vale la última
  }
  const delBanco = preguntaPorId(id, idiomaDe(ficha));
  return texto ?? (delBanco ? renderizar(delBanco.texto, ficha) : '');
}

export function cazarAlCerrar(e: EstadoV3, ficha: FichaTexto, bloque: number, cliente: ClienteModelo): Promise<ResultadoCaza> {
  return cazarBloque({
    cliente,
    ficha: fichaCorta(ficha),
    bloque,
    respuestas: new Map(e.respuestas),
    textoPregunta: (id) => textoMandado(e, ficha, id),
    yaRepreguntado: e.repreguntas ?? [],
    escenasContadas: e.cazador?.escenasContadas ?? [],
    gastoUsd: e.cazador?.gastoUsd ?? 0,
    idioma: idiomaDe(ficha),
  });
}

/** Suma lo que devolvió el cazador (igual que en el script): la cola sin repetir clave, el gasto, las escenas y la llamada. */
export function sumarCaza(anterior: EstadoV3, r: ResultadoCaza): EstadoV3 {
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
