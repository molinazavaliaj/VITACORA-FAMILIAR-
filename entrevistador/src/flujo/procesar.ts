import type { MensajeEntrante } from '../whatsapp/webhook.js';
import { db } from '../db/cliente.js';
import { enviarTexto } from '../whatsapp/enviar.js';
import { descargarAudio } from '../whatsapp/media.js';
import { variantesDeTelefono } from '../whatsapp/telefonos.js';
import { guardarRespuestaAudio, guardarReserva, guardarTemaDeOtraParte } from '../db/respuestas.js';
import { guardarRepreguntaEnviada } from '../db/envios.js';
import { transcribirYActualizar } from '../ia/transcribir.js';
import { promptDeTranscripcion } from '../manual/puro.js';
import { evaluarRespuesta, detectarIntencion, detectarQueNoTuvo, detectarReservaYDejarTema, reservaDe, temaDe, type ReservaYDejarTema } from '../ia/cerebro.js';
import { generarPreguntasAdaptativas } from '../ia/adaptativas.js';
import { preguntaDeOrden, preguntasHechasAntes, tieneAdaptativas, ultimoOrden } from '../db/guion.js';
import { textoEvitar, sumarTemaEvitado } from '../ia/evitar.js';
import { tratoDe } from '../ia/trato.js';
import { bienvenidaAceptacion, noEntendi, noQuiereTodavia } from '../manual/puro.js';
import { mandarHito } from '../mail/hitos.js';
import { cerrarBitacora } from './cierre.js';
import { esOrdenDeCierre, faseDeCierre } from './cierre-abierto.js';
import { esViaje } from './viaje.js';
import { confirmarFoto, crearGuionDelViaje, guardarFotoEntrante } from './viaje-db.js';
import { recibirFotoFamiliar } from './fotos.js';
import { pedidoAbierto, pedirObjeto } from './objetos.js';
import { bienvenidaViaje } from '../manual/puro.js';
import { CLAVE_DEL_ARBOL, capituloNoAplica, enviarPregunta, ritmoDe, type Narrador } from './preguntar.js';
import { bienvenidaPideVoz } from '../config.js';
import { esNarradorV3 } from '../v3/estado.js';
import { canjearRegalo, mandarBienvenidaDeRegalo } from './regalo.js';
import { idiomaDeRegalo, motivoDeFrenoDelRegalo, textoDeArranque } from './regalo-arranque.js';
import { extraerCodigo } from './regalo-codigo.js';
import { avisarSocios } from '../v3/avisos.js';

const MAXIMO_POR_DIA_DOS = 2; // ritmo 'dos_por_dia': la segunda se ofrece, no se impone

async function buscarNarrador(telefono: string): Promise<Narrador | null> {
  // Con y sin el 9 de celular argentino: Meta y la web no siempre coinciden.
  const { data } = await db.from('narradores').select('*').in('telefono_whatsapp', variantesDeTelefono(telefono)).limit(1).maybeSingle();
  return (data as Narrador | null) ?? null;
}

async function ultimaBienvenida(narradorId: string): Promise<boolean> {
  const { data } = await db.from('envios').select('id').eq('narrador_id', narradorId).eq('tipo', 'bienvenida').limit(1);
  return (data?.length ?? 0) > 0;
}

// ¿Ya se le mandó una repregunta a este narrador para esta pregunta?
async function yaSeRepregunto(narradorId: string, orden: number): Promise<boolean> {
  const { data } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'repregunta').eq('pregunta_orden', orden).limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * ¿Lo que acaba de llegar amplía el día en vez de estrenarlo?
 *
 * Pasa en dos casos: le repreguntamos, o le pedimos un objeto (3t.30) y esto
 * es la historia de ese objeto. En los dos, la respuesta del día ya se evaluó:
 * volver a evaluarla repreguntaría sobre algo que ya contó.
 */
async function esAmpliacionDelDia(narradorId: string, orden: number): Promise<boolean> {
  if (await yaSeRepregunto(narradorId, orden)) return true;
  return (await pedidoAbierto(narradorId)) !== null;
}

async function textoDePregunta(narradorId: string, orden: number): Promise<string> {
  // La pregunta tal como se le mandó (personalizada) si la tenemos; si no, la del guion.
  const n = await db.from('narradores').select('contexto').eq('id', narradorId).maybeSingle();
  const enviada = ((n.data as { contexto?: Record<string, any> } | null)?.contexto?.preguntasEnviadas ?? {})[String(orden)];
  if (typeof enviada === 'string' && enviada.trim()) return enviada;
  return (await preguntaDeOrden(narradorId, orden))?.texto ?? '';
}

/** ¿Este orden es la última pregunta que existe para este narrador (su guion propio)? */
async function esLaUltimaPregunta(narradorId: string, orden: number): Promise<boolean> {
  const ultima = await ultimoOrden(narradorId);
  return ultima > 0 && orden >= ultima;
}

/** ¿Hay una oferta de "otra ahora" sin resolver para la pregunta vigente? */
async function ofertaPendiente(narradorId: string, orden: number): Promise<boolean> {
  const { data: oferta } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'oferta_siguiente').eq('pregunta_orden', orden).limit(1);
  if ((oferta?.length ?? 0) === 0) return false;
  const { data: siguiente } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'pregunta').eq('pregunta_orden', orden + 1).limit(1);
  return (siguiente?.length ?? 0) === 0;
}

/** Cuántas preguntas salieron hoy (en la zona del narrador). */
async function preguntasEnviadasHoy(n: Narrador, ahora = new Date()): Promise<number> {
  const desde = new Date(ahora.getTime() - 24 * 3600_000).toISOString();
  const { data } = await db.from('envios').select('enviado_at')
    .eq('narrador_id', n.id).eq('tipo', 'pregunta').gte('enviado_at', desde);
  const hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: n.zona_horaria }).format(ahora);
  return ((data as { enviado_at: string }[] | null) ?? [])
    .filter((e) => new Intl.DateTimeFormat('sv-SE', { timeZone: n.zona_horaria }).format(new Date(e.enviado_at)) === hoy)
    .length;
}

/** "sí" / "no" cortos, sin acentos ni signos: para la oferta de otra pregunta. */
export function leerSiNo(texto: string): 'si' | 'no' | null {
  const limpio = texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, ' ').trim();
  if (!limpio || limpio.split(/\s+/).length > 6) return null;
  // `si+` porque "Sii" y "Siii" son de las formas más comunes y fallaban las dos.
  // Catalán y castellano de España (regalo-idiomas, 09/10): «D'acord» y
  // «Som-hi» llegan como «d acord» y «som hi» (el apóstrofo y el guion ya son espacios).
  if (/^(si+|dale|bueno|ok|okey|oka|claro|de acuerdo|va|vamos|vale|listo|perfecto|obvio|de una|empecemos|arranquemos|empezemos|si dale|si claro|si bueno|si vamos|bueno dale|dale si|d acord|som hi|endavant|vinga|comencem|venga)\b/.test(limpio)) return 'si';
  if (/^(no|ahora no|manana|mañana|despues|mas tarde|hoy no|no gracias|ara no|dema|despres|mes tard|avui no)\b/.test(limpio)) return 'no';
  return null;
}

async function marcarRespondido(narradorId: string): Promise<void> {
  await db.from('narradores')
    .update({ ultima_respuesta_at: new Date().toISOString(), alerta_silencio: false })
    .eq('id', narradorId);
}

// Estima cuánto duraría hablada una respuesta escrita (~130 palabras/min).
function estimarDuracion(texto: string): number {
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((palabras / 130) * 60);
}

export async function procesarEntrante(m: MensajeEntrante): Promise<void> {
  const narrador = await buscarNarrador(m.telefono);
  if (!narrador) {
    // Gift card (08/10): quien escribe puede ser un narrador con su tarjeta en la mano.
    if (m.tipo === 'texto' && m.texto) {
      const canje = await canjearRegalo({ db, enviarTexto }, { telefono: m.telefono, texto: m.texto });
      if (canje !== 'sin_codigo') return;
    }
    console.warn(`Mensaje de un número no registrado: ${m.telefono}`);
    return;
  }

  // Gift card: un teléfono que ya conocemos (libro terminado, cerrado o sin
  // pagar) manda un código. Hoy no puede canjear: dos libros para una persona
  // es el plan que sigue. No hay texto aprobado para contestarle, así que no
  // se le escribe nada; se avisa a los socios para que lo resuelva una persona.
  if (['pendiente_pago', 'completado', 'cerrado_anticipado'].includes(narrador.estado) && m.tipo === 'texto' && m.texto) {
    const codigo = extraerCodigo(m.texto);
    if (codigo) {
      console.warn(`regalo: ${m.telefono} (narrador ${narrador.id}, '${narrador.estado}') mandó el código ${codigo}; no se canjea, aviso a los socios`);
      await avisarSocios(
        `regalo-telefono-conocido:${narrador.id}:${codigo}`,
        'Un teléfono que ya conocemos mandó un código de regalo',
        `El teléfono ${m.telefono} ya es del narrador ${narrador.id} (estado '${narrador.estado}') y mandó el código ${codigo}. `
          + 'El bot no lo canjea ni le contesta: hay que resolverlo a mano.',
      );
      return;
    }
  }

  // Entrevista V3 (spec 2026-10-07): un narrador con fila en entrevistas_v3 va
  // entero por la V3, antes de las fotos de la familia, de manejarTexto (que
  // llama a un modelo) y de la evaluación con Opus. Sin fila —o sin la
  // migración aplicada— sigue exactamente como hoy. Los imports son dinámicos
  // para no cargar nada de la V3 si nadie la usa.
  if ((narrador.estado === 'activo' || narrador.estado === 'pausado') && (await esNarradorV3(db, narrador.id))) {
    const { procesarEntranteV3 } = await import('../v3/entrante.js');
    const { depsReales } = await import('../v3/deps-reales.js');
    await procesarEntranteV3(depsReales(), narrador, m);
    return;
  }

  // Gift card: un regalo frenado en 'acepto' arranca con cualquier mensaje suyo
  // (la ventana está abierta). Después el mensaje sigue como siempre: una foto
  // se guarda; un texto o un audio en 'acepto' se ignora.
  await recuperarRegaloFrenado(narrador);

  // Una foto por WhatsApp se guarda SIEMPRE, en los dos productos (22/09).
  // En viaje va al álbum del día (la etapa vigente); en el Familiar, al capítulo
  // de la pregunta que está contestando. Antes de hoy la del Familiar se perdía.
  if (m.tipo === 'imagen' && m.mediaId) {
    if (!['activo', 'acepto', 'pausado'].includes(narrador.estado)) return;
    if (esViaje(narrador.contexto)) {
      const capitulo = await guardarFotoEntrante(narrador, m.mediaId, m.mimeType, m.texto);
      await confirmarFoto(narrador, capitulo);
    } else {
      await recibirFotoFamiliar(narrador, m.mediaId, m.mimeType, m.texto);
    }
    return;
  }

  switch (narrador.estado) {
    case 'invitado':
      await manejarConsentimiento(narrador, m);
      return;
    case 'pausado':
      await reactivar(narrador);
      return;
    case 'activo':
      if (m.tipo === 'texto') await manejarTexto(narrador, m);
      else await manejarRespuestaAudio(narrador, m);
      return;
    default:
      // acepto (espera la 1ª pregunta), completado, cerrado_anticipado: no se procesa entrada espontánea
      console.warn(`Entrante en estado '${narrador.estado}' de ${narrador.id}: se ignora`);
      return;
  }
}

// Paso 2: el "SÍ" del consentimiento.
async function manejarConsentimiento(narrador: Narrador, m: MensajeEntrante): Promise<void> {
  // Gift card: si la bienvenida del canje falló, sale ahora (escribió: ventana abierta).
  // Si tampoco sale ahora, se sigue como siempre: un SÍ nunca se pierde.
  let regaloSinBienvenida = false;
  if (narrador.contexto?.regalo === true && !(await ultimaBienvenida(narrador.id))) {
    if (await mandarBienvenidaDeRegalo({ db, enviarTexto }, narrador.id, narrador.telefono_whatsapp)) return;
    regaloSinBienvenida = true;
    console.error(`regalo: la bienvenida de ${narrador.id} volvió a fallar; sigue el consentimiento de siempre`);
  }
  if (m.tipo !== 'texto' || !m.texto) return; // en 'invitado' solo cuenta el SÍ escrito
  // Hasta el 23/09 esto tenía su propio `/^si\b/`, más pobre que el `leerSiNo`
  // que ya vivía en este mismo archivo: "Sii", "Dale", "Ok", "Claro" y "Vamos"
  // no entraban. Y el bot se quedaba MUDO, así que la persona leía la
  // bienvenida, contestaba, no pasaba nada y no volvía a intentar.
  const dijoSi = leerSiNo(m.texto) === 'si';
  // Un regalo habla en su idioma (ARRANQUE de regalo-textos.ts) y va siempre
  // por la V3: la bienvenida del banco ya le describió esa entrevista.
  const esRegalo = narrador.contexto?.regalo === true;
  // Un narrador nuevo que recibió la bienvenida V3 (scheduler, V3_PARA_NUEVOS): su SÍ se contesta como el del
  // regalo, en su idioma, y la primera pregunta sale enseguida (10/10).
  const esV3Nuevo = !esRegalo && narrador.contexto?.bienvenidaV3 === true;
  const idiomaRegalo = esRegalo || esV3Nuevo ? idiomaDeRegalo(narrador.contexto) : null;
  if (!dijoSi) {
    // Vitácora de viaje: mientras no haya plantilla aprobada, el viajero escribe
    // primero ("hola") y la bienvenida sale como texto libre, dentro de la ventana.
    if (esViaje(narrador.contexto) && !(await ultimaBienvenida(narrador.id))) {
      const waId = await enviarTexto(narrador.telefono_whatsapp, bienvenidaViaje(narrador.como_le_dicen, { enseguida: ritmoDe(narrador.contexto) === 'seguido' }));
      await db.from('envios').insert({ narrador_id: narrador.id, tipo: 'bienvenida', pregunta_orden: null, wa_message_id: waId });
      return;
    }
    // Escribió algo que no entendimos. El silencio es la peor respuesta: la
    // persona ya hizo su parte y del otro lado no pasa nada, así que no
    // vuelve a intentar. Se le pide de nuevo UNA sola vez — insistir a quien
    // no quiere participar sería peor que no haber preguntado.
    if (narrador.contexto?.sePidioDeNuevo !== true) {
      const dijoNo = leerSiNo(m.texto) === 'no';
      if (idiomaRegalo) {
        await enviarTexto(narrador.telefono_whatsapp, textoDeArranque(idiomaRegalo, dijoNo ? 'noQuiere' : 'noEntendi', narrador.como_le_dicen));
      } else {
        const trato = await tratoDe(narrador);
        await enviarTexto(narrador.telefono_whatsapp, dijoNo
          ? noQuiereTodavia(narrador.como_le_dicen, trato)
          : noEntendi(trato));
      }
      narrador.contexto = { ...(narrador.contexto ?? {}), sePidioDeNuevo: true };
      await db.from('narradores').update({ contexto: narrador.contexto }).eq('id', narrador.id);
    }
    return;
  }
  // Vitácora de viaje: el guion nace acá, una pregunta por día.
  if (esViaje(narrador.contexto)) await crearGuionDelViaje(narrador);
  // El mismo SÍ es el permiso para clonar su voz (dato biométrico, 3t.15) —
  // pero solo si la bienvenida que recibió ya se lo pedía. Sin fecha, la
  // fábrica no clona nunca (supabase/CONTRATO.md).
  const cambios: Record<string, unknown> = { estado: 'acepto' };
  // La bienvenida del regalo (mandarBienvenidaDeRegalo) siempre pide la voz:
  // su SÍ vale como permiso, salvo que esa bienvenida nunca le haya llegado.
  // La bienvenida V3 (plantilla) también la pide: el pedido de SÍ aprobado (ARRANQUE.pedidoSi) va en su cuerpo.
  const regaloPidioVoz = (esRegalo && !regaloSinBienvenida) || esV3Nuevo;
  if (bienvenidaPideVoz() || regaloPidioVoz) cambios.consentimiento_voz_at = new Date().toISOString();
  await db.from('narradores').update(cambios).eq('id', narrador.id);
  // Nunca prometer una pregunta que no va a llegar: si el alta V3 del regalo se
  // va a frenar (sin género, idioma desconocido), el SÍ queda anotado pero no
  // sale la aceptación ni el mail «ya le mandamos la primera pregunta». Una
  // persona completa la ficha; la 1 sale con el próximo mensaje del narrador
  // (recuperarRegaloFrenado) o, sin mensaje, por el scheduler.
  const freno = esRegalo || esV3Nuevo ? motivoDeFrenoDelRegalo(narrador.contexto) : null;
  if (freno) {
    await avisarSocios(
      `regalo-si-frenado:${narrador.id}`,
      `Regalo frenado: ${narrador.como_le_dicen} dijo que sí pero ${freno === 'no tiene género' ? 'falta el género' : 'el idioma no es válido'}`,
      `El narrador ${narrador.id} (regalo) dijo que sí, pero su entrevista V3 está frenada: ${freno}. `
        + "Quedó en 'acepto' con su permiso anotado. No se le mandó la aceptación ni la primera pregunta, "
        + 'y a quien regaló no le llegó el mail «dijo que sí». '
        + 'QUÉ HACER: (1) Completar la ficha en narradores.contexto: genero (varon | mujer | otro) y, si el idioma está mal, '
        + 'idioma ("es-ES", "ca", o sacarlo para es-AR). (2) Esperar a que el narrador escriba: con cualquier mensaje suyo '
        + 'el bot le manda la primera pregunta en ese momento y, si sale, el mail «dijo que sí» a quien regaló. '
        + 'Si no escribe, se le puede escribir a mano para que conteste. '
        + 'Sin mensaje suyo y con la ficha completa, el scheduler lo intenta a su hora preferida: en es-AR la primera pregunta '
        + 'sale por plantilla; en es-ES y ca no hay plantilla V3 aprobada y queda en la cola hasta que el narrador escriba. '
        + 'Por ese camino el mail «dijo que sí» no sale solo: mandarlo a mano cuando la pregunta haya salido. '
        + `También sirve npm run v3-pasar -- ${narrador.id} --genero <varon|mujer|otro> [--idioma es-ES|ca] --aplicar `
        + "(acepta narradores en 'acepto'), pero no completa contexto.genero y no manda nada, ni el mail: crea la fila V3 "
        + 'y la primera pregunta sale en su tanda, con la misma espera por la plantilla en es-ES y ca. Mejor completar la ficha.',
    );
    return;
  }
  // Un regalo recibe su primera pregunta con el SÍ, sea cual sea el ritmo: su
  // aceptación le dice que ya va (la V3 sigue después con su propio reloj).
  const enseguida = idiomaRegalo !== null || (!esViaje(narrador.contexto) && ritmoDe(narrador.contexto) === 'seguido');
  await enviarTexto(
    narrador.telefono_whatsapp,
    idiomaRegalo
      ? textoDeArranque(idiomaRegalo, 'aceptacion', narrador.como_le_dicen)
      : bienvenidaAceptacion(narrador.como_le_dicen, await tratoDe(narrador), { viaje: esViaje(narrador.contexto), enseguida }),
  );
  // Un regalo: el mail «dijo que sí» dice «ya le mandamos la primera pregunta»,
  // así que sale DESPUÉS de la 1, y solo si salió. Si no sale, el narrador
  // queda en 'acepto' sin fila V3 y lo retoma recuperarRegaloFrenado con su
  // próximo mensaje; el mail sale entonces.
  // El nuevo de la V3 igual: la 1 sale ya y el mail «dijo que sí» (el de siempre) recién si salió.
  if (esRegalo || esV3Nuevo) {
    await primeraDelRegalo(narrador, 'consentimiento');
    return;
  }
  await mandarHito(narrador, 'acepto');
  // Ritmo «apenas responde» (pedido de Joaquín, 23/09): la primera pregunta sale
  // con el SÍ. Antes esperaba al scheduler, o sea hasta 24 horas — y en una
  // prueba eso es un día perdido. Acaba de escribir, así que la ventana de 24 hs
  // está abierta y va como texto libre, sin depender de ninguna plantilla.
  if (enseguida) {
    try {
      await enviarPregunta({ ...narrador, estado: 'acepto' }, 1, { plantilla: false });
    } catch (err) {
      console.error(`consentimiento: no pude mandar la 1 enseguida a ${narrador.id}:`, err);
    }
  }
}

/**
 * La primera pregunta de un regalo (alta V3 con la ventana abierta) y, solo si
 * salió, el mail «dijo que sí» a quien regaló (dice que la 1 ya salió;
 * mandarHito no lo repite). Si no sale o tira, queda en el log y no va el mail.
 */
async function primeraDelRegalo(narrador: Narrador, desde: string): Promise<boolean> {
  let salio = false;
  try {
    salio = await enviarPregunta({ ...narrador, estado: 'acepto' }, 1, { plantilla: false });
  } catch (err) {
    console.error(`${desde}: no pude mandar la 1 del regalo ${narrador.id}; no va el mail «dijo que sí»:`, err);
    return false;
  }
  if (!salio) {
    console.error(`${desde}: la 1 del regalo ${narrador.id} no salió (alta V3 frenada); no va el mail «dijo que sí»`);
    return false;
  }
  await mandarHito(narrador, 'acepto');
  return true;
}

/**
 * Un regalo que dijo que sí pero quedó frenado: en 'acepto' y sin fila V3 (la
 * ficha estaba incompleta, o la 1 falló). Cualquier mensaje suyo abre la
 * ventana de 24 h, así que se intenta el alta V3 ahora, como texto libre: si la
 * ficha ya se completó, sale OR1; si no, altaNuevo lo vuelve a frenar (su aviso
 * a los socios sale una vez por día). Vale igual para un nuevo de la V3 (contexto.bienvenidaV3, 10/10); otro 'acepto' no pasa por acá.
 */
async function recuperarRegaloFrenado(narrador: Narrador): Promise<void> {
  if (narrador.estado !== 'acepto' || (narrador.contexto?.regalo !== true && narrador.contexto?.bienvenidaV3 !== true)) return;
  // Si la base falla al mirar la fila V3, no se manda nada y el entrante sigue:
  // con el próximo mensaje se vuelve a intentar.
  let yaEsV3: boolean;
  try {
    yaEsV3 = await esNarradorV3(db, narrador.id);
  } catch (err) {
    console.error(`regalo frenado: no pude saber si ${narrador.id} tiene entrevista V3; no se manda nada`, err);
    return;
  }
  if (yaEsV3) return;
  await primeraDelRegalo(narrador, 'regalo frenado');
}

// Paso 3: pausado → activo con cualquier mensaje.
async function reactivar(narrador: Narrador): Promise<void> {
  await db.from('narradores').update({ estado: 'activo' }).eq('id', narrador.id);
  await enviarTexto(
    narrador.telefono_whatsapp,
    `¡Qué bueno tenerlo de vuelta, ${narrador.como_le_dicen}! Retomamos donde habíamos dejado. Mañana le llega la siguiente pregunta.`,
  );
}

// Paso 4: texto de un narrador activo.
async function manejarTexto(narrador: Narrador, m: MensajeEntrante): Promise<void> {
  const intencion = await detectarIntencion(m.texto ?? '', narrador.id);
  if (intencion === 'quiere_parar') {
    await db.from('narradores').update({ estado: 'pausado', alerta_silencio: true }).eq('id', narrador.id);
    await enviarTexto(
      narrador.telefono_whatsapp,
      `Entiendo perfectamente, ${narrador.como_le_dicen}. Hacemos una pausa, sin ningún problema. Cuando tenga ganas de seguir, me escribe cualquier cosa y retomamos donde dejamos. Su historia queda guardada. 🤝`,
    );
    return;
  }
  if (narrador.dia_actual < 1 || !m.texto) return; // sin pregunta vigente todavía

  const orden = narrador.dia_actual;

  // ¿Le ofrecimos otra pregunta ahora? Un "sí" corto la manda; un "no", la deja para mañana.
  if (await ofertaPendiente(narrador.id, orden)) {
    const respuesta = leerSiNo(m.texto);
    if (respuesta === 'si') {
      await enviarPregunta(narrador, orden + 1, { plantilla: false });
      return;
    }
    if (respuesta === 'no') {
      await enviarTexto(narrador.telefono_whatsapp, `Perfecto, ${narrador.como_le_dicen}. Mañana a la mañana le llega la siguiente. Que descanse. 🌙`);
      return;
    }
    // Ni sí ni no: es una respuesta más a la pregunta vigente.
  }

  const esRepregunta = await esAmpliacionDelDia(narrador.id, orden);
  const { data, error } = await db.from('respuestas')
    .insert({
      narrador_id: narrador.id, pregunta_orden: orden,
      texto_directo: m.texto, transcripcion: m.texto, es_repregunta: esRepregunta,
    })
    .select('id').single();
  if (error) throw new Error(`No pude guardar la respuesta de texto: ${error.message}`);
  await marcarRespondido(narrador.id);
  await trasResponder(narrador, orden, esRepregunta, m.texto, estimarDuracion(m.texto), data.id);
}

// Paso 5: audio de un narrador activo.
async function manejarRespuestaAudio(narrador: Narrador, m: MensajeEntrante): Promise<void> {
  if (narrador.dia_actual < 1 || !m.mediaId) return; // sin pregunta vigente todavía
  const orden = narrador.dia_actual;
  const esRepregunta = await esAmpliacionDelDia(narrador.id, orden);
  const audio = await descargarAudio(m.mediaId);
  const { id } = await guardarRespuestaAudio(narrador.id, orden, audio, esRepregunta);
  // T3.5 (22/09): con la ficha del narrador, como la puerta manual. Sin este
  // prompt el modelo adivina los nombres propios y salen mal en el libro
  // (#17; medido el 14/09: "de la URA" contra "de laburar").
  const { texto, duracionSegundos } = await transcribirYActualizar(
    id, audio, promptDeTranscripcion(narrador.contexto ?? {}, narrador.como_le_dicen), narrador.id,
  );
  await marcarRespondido(narrador.id);
  await trasResponder(narrador, orden, esRepregunta, texto, duracionSegundos, id);
}

// Pasos 6-8: evaluación + repregunta, y disparadores de fase adaptativa / cierre.
async function trasResponder(
  narrador: Narrador, orden: number, esRepregunta: boolean,
  transcripcion: string, duracionSegundos: number, respuestaId: string,
): Promise<void> {
  // Paso 6: solo la PRIMERA respuesta a una pregunta se evalúa (las de la repregunta, no).
  let repreguntaEnviada = false;
  const trato = await tratoDe(narrador);
  // Lo que se anota de CUALQUIER respuesta, se evalúe o no: la reserva ("esto
  // que no vaya al libro", bitácora 19) y el tema que pidió dejar ("vamos por
  // otro lado", bitácora 34). Cuando hay evaluación, salen de ella; cuando no
  // (ampliación de una repregunta, "no tuvo", pregunta de cierre), se detectan
  // con la llamada corta que no juzga ni repregunta — un "no lo pongas" dicho
  // en la ampliación vale exactamente lo mismo que en la respuesta del día.
  let marcas: ReservaYDejarTema;
  if (!esRepregunta) {
    // Los hitos de la familia (§9): la primera respuesta, y la mitad del guion.
    if (orden === 1) await mandarHito(narrador, 'primera');
    const total = await ultimoOrden(narrador.id);
    if (total > 2 && orden === Math.ceil(total / 2)) await mandarHito(narrador, 'mitad');

    const pregunta = await textoDePregunta(narrador.id, orden);
    // Bitácora 35: si en «Los hijos» o «El amor» dice que no tuvo, se anota en el
    // árbol (las que siguen del capítulo se reemplazan) y NO se repregunta sobre eso.
    const noTuvo = await anotarSiNoTuvo(narrador, orden, pregunta, transcripcion);
    // La pregunta de cierre ("¿faltó algo?") no se evalúa ni se repregunta: la lee faseDeCierre.
    const seEvalua = !noTuvo && !esOrdenDeCierre(narrador.contexto, orden);
    // "Esto es de otra parte" (21/09): la evaluación ve las preguntas ya hechas
    // para poder decir a cuál pertenece un recuerdo que aparece tarde. Es una
    // marca en la fila para la fábrica; el bot no reencuadra nada en vivo.
    const preguntasHechas = seEvalua ? await preguntasHechasAntes(narrador.id, orden, narrador.contexto) : [];
    const evaluacion = seEvalua
      ? await evaluarRespuesta(pregunta, transcripcion, duracionSegundos, textoEvitar(narrador.contexto), trato, { narradorId: narrador.id, preguntasHechas, ordenActual: orden })
      : { suficiente: true as const };
    if (seEvalua) await guardarTemaDeOtraParte(respuestaId, temaDe(evaluacion, preguntasHechas, orden));
    marcas = seEvalua
      ? { reserva: reservaDe(evaluacion, transcripcion), dejarTema: evaluacion.dejarTema ?? null }
      : await detectarReservaYDejarTema(transcripcion, trato, { narradorId: narrador.id });
    if (!evaluacion.suficiente && evaluacion.repregunta && !(await yaSeRepregunto(narrador.id, orden))) {
      const waId = await enviarTexto(narrador.telefono_whatsapp, evaluacion.repregunta);
      await db.from('envios').insert({
        narrador_id: narrador.id, tipo: 'repregunta', pregunta_orden: orden, wa_message_id: waId,
      });
      // El texto queda guardado para que el panel muestre qué se le preguntó
      // (la familia ve la respuesta que llegó después; sin esto, no la pregunta).
      await guardarRepreguntaEnviada(narrador, orden, evaluacion.repregunta);
      repreguntaEnviada = true;
    }
  } else {
    marcas = await detectarReservaYDejarTema(transcripcion, trato, { narradorId: narrador.id });
  }
  // Ninguna de las dos puede frenar el día: si fallan, avisan y se sigue.
  await guardarReserva(respuestaId, marcas.reserva);
  await anotarTemaEvitado(narrador, marcas.dejarTema);

  // Paso 8 (§11.2): al responder la ÚLTIMA pregunta que existe en su guion —sea
  // la 26 o la 36, según lo que la familia sacó o sumó— el cerebro estudia toda
  // la historia y escribe las 4 finales a medida (N+1..N+4). Recién si ya las
  // tenía y esta era la última, la entrevista termina.
  if (!esViaje(narrador.contexto) && (await esLaUltimaPregunta(narrador.id, orden)) && !(await tieneAdaptativas(narrador.id))) {
    await generarPreguntasAdaptativas(narrador.id);
  }

  // Paso 7: si acaba de responder la última pregunta que existe para él, antes
  // de despedirse le pregunta si faltó algo (cierre-abierto, hasta dos vueltas).
  // Si de ahí sale otra pregunta, la entrevista sigue; si no, queda 'completado'.
  if (await esLaUltimaPregunta(narrador.id, orden)) {
    if (!esRepregunta && (await faseDeCierre(narrador, orden, transcripcion))) return;
    await cerrarBitacora(narrador.id);
    return;
  }

  // Si salió una repregunta, esperamos su respuesta antes de avanzar.
  if (repreguntaEnviada) return;

  // «Sus objetos preciados» (3t.30): si con esta pregunta se cerró un capítulo,
  // el pedido del objeto sale ahora, como segundo mensaje del día. Va acá —
  // después del cierre y de las adaptativas— para no pisar el final de la
  // entrevista, y devolver true corta el avance del ritmo: el pedido ES el
  // segundo mensaje, no queremos mandar además la pregunta siguiente.
  if (!esRepregunta && (await pedirObjeto(narrador, orden))) return;

  // El ritmo (§6.4). Como el narrador acaba de escribir, la ventana de 24 hs
  // está abierta: lo que salga va como texto libre, sin plantilla.
  //   seguido     → la siguiente sale YA (los pilotos, el "modo rápido").
  //   dos_por_dia → se le OFRECE otra ahora (como mucho dos por día); un "sí" la manda.
  //   diario      → nada: mañana, a su hora, el scheduler manda la siguiente.
  const ritmo = ritmoDe(narrador.contexto);
  if (ritmo === 'seguido') {
    await enviarPregunta(narrador, orden + 1, { plantilla: false });
  } else if (ritmo === 'dos_por_dia' && (await preguntasEnviadasHoy(narrador)) < MAXIMO_POR_DIA_DOS) {
    await ofrecerSiguiente(narrador, orden);
  }
}

/**
 * Bitácora 35. Solo mira las preguntas de «Los hijos» y «El amor» cuyo capítulo
 * todavía aplica. Si el narrador dice que nunca tuvo, escribe `arbol.hijos` /
 * `arbol.conyuge = 'no tuvo'` (releyendo el contexto para no pisar a nadie) y lo
 * refleja en el narrador en memoria, así la siguiente pregunta —que en modo
 * seguido sale en este mismo turno— ya se reemplaza. Si el modelo falla, sigue
 * como si nada: es una mejora, no una puerta.
 */
async function anotarSiNoTuvo(narrador: Narrador, orden: number, pregunta: string, transcripcion: string): Promise<boolean> {
  try {
    const fila = await preguntaDeOrden(narrador.id, orden);
    const clave = fila ? CLAVE_DEL_ARBOL[fila.capitulo] : undefined;
    if (!fila || !clave || capituloNoAplica(narrador.contexto, fila.capitulo)) return false;
    if ((await detectarQueNoTuvo(fila.capitulo, pregunta, transcripcion, narrador.id)) !== 'no_tuvo') return false;

    const { data } = await db.from('narradores').select('contexto').eq('id', narrador.id).maybeSingle();
    const contexto = { ...(((data as { contexto?: Record<string, any> } | null)?.contexto) ?? {}) };
    contexto.arbol = { ...(contexto.arbol ?? {}), [clave]: 'no tuvo' };
    await db.from('narradores').update({ contexto }).eq('id', narrador.id);
    narrador.contexto = { ...narrador.contexto, arbol: contexto.arbol };
    console.log(`procesar: ${narrador.id} dijo que no tuvo ${clave} (orden ${orden}); el capítulo «${fila.capitulo}» se reemplaza de acá en más.`);
    return true;
  } catch (err) {
    console.error(`procesar: no pude evaluar si ${narrador.id} dijo que no tuvo:`, err);
    return false;
  }
}

/**
 * Bitácora 34. El narrador pidió dejar un tema y la evaluación lo nombró: se
 * suma a `contexto.evitar` releyendo el contexto de la base (para no pisar lo
 * que la familia escribió en el panel mientras tanto) y se refleja en el
 * narrador en memoria, así la siguiente pregunta —que en modo seguido sale en
 * este mismo turno— ya lo respeta. Si falla, sigue: es una mejora, no una puerta.
 */
async function anotarTemaEvitado(narrador: Narrador, tema: unknown): Promise<void> {
  if (typeof tema !== 'string' || !tema.trim()) return;
  try {
    const { data } = await db.from('narradores').select('contexto').eq('id', narrador.id).maybeSingle();
    const enBase = ((data as { contexto?: Record<string, any> } | null)?.contexto) ?? narrador.contexto ?? {};
    const contexto = sumarTemaEvitado(enBase, tema);
    if (!contexto) return;
    const { error } = await db.from('narradores').update({ contexto }).eq('id', narrador.id);
    if (error) throw new Error(error.message);
    narrador.contexto = { ...narrador.contexto, evitar: contexto.evitar };
    console.log(`procesar: ${narrador.id} pidió dejar un tema («${tema.trim()}»); queda en contexto.evitar.`);
  } catch (err) {
    console.error(`procesar: no pude anotar el tema que ${narrador.id} pidió dejar:`, err);
  }
}

/** La oferta de "otra ahora" (§11.4). Queda en `envios` como 'oferta_siguiente' para leer su respuesta. */
async function ofrecerSiguiente(narrador: Narrador, orden: number): Promise<void> {
  const waId = await enviarTexto(
    narrador.telefono_whatsapp,
    `Qué lindo lo que contó, ${narrador.como_le_dicen}. ¿Tiene ganas de seguir con otra pregunta ahora? Si me dice que sí, se la mando. Si prefiere, mañana a la mañana le llega la siguiente.`,
  );
  await db.from('envios').insert({
    narrador_id: narrador.id, tipo: 'oferta_siguiente', pregunta_orden: orden, wa_message_id: waId,
  });
}
