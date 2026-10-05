// Los botones (banco.md, "Mensajes ya aprobados" y columna Botones;
// mensajes.md). Un botón que no corresponde a lo que se espera (uno viejo,
// tocado dos veces) no hace nada: nunca rompe ni repite.

import { extra as extraDelBanco, pregunta, type IdMensaje } from '../banco.js';
import { fotoDelItem } from '../compra.js';
import {
  emitir,
  empezarItem,
  extrasDelFinal,
  extrasDeUnaMas,
  fotoOTerminar,
  fotoVencidaEnCurso,
  hoy,
  manana,
  mandarExtra,
  soltarRetenido,
  terminarItem,
  type Ctx,
} from './flujo.js';
import { extraMsg, fijoA, fotoMsg, opMsg, padreMsgs, preguntaMsg, ramaMsg } from './mensajes.js';
import { enDiaSobrio } from './sobrio.js';
import type { Foto } from '../tipos.js';

const BOTONES_NO_ES_LO_MIO = ['No hago', 'De ninguno', 'No miro'];

/**
 * La foto que se está esperando: una foto vencida que volvió al final (K1-FOTO)
 * lleva los botones de la original (cambio A, 05/10); una extra con foto, [No tengo].
 */
export function fotoEnCurso(c: Ctx): Foto | null {
  const e = c.e;
  const vencida = fotoVencidaEnCurso(e);
  if (vencida) return vencida.foto;
  if (e.extra) return { de: e.extra, texto: '', botones: ['No tengo'], noTengo: null };
  const item = e.guion[e.cursor];
  return fotoDelItem(item);
}

/** [No tengo] en una foto (tocado, o un "no" corto contado: rafaga.ts): su respuesta, y espera el audio. */
export function noTengo(c: Ctx, foto: Foto): void {
  const f = c.e.fase;
  if (f.tipo !== 'foto') return;
  emitir(c, fijoA(c.e, foto.noTengo ? 'B-FOTO-PLATA' : 'B-FOTO-NOTENGO'));
  c.e.fase = { tipo: 'foto-audio', clave: f.clave, desde: c.ahora.toISOString() };
}

/** [Hoy no la como] en la foto de K24 (tocado, o un "no" corto contado: rafaga.ts): la foto ya le pide contar la última vez que la comió; se espera su audio, sin decir nada (05/10). */
export function hoyNoLaComo(c: Ctx): void {
  const f = c.e.fase;
  if (f.tipo !== 'foto') return;
  c.e.fase = { tipo: 'foto-audio', clave: f.clave, desde: c.ahora.toISOString() };
}

/** Canal B: [Estamos listos] (de BIEN-PADRE, PREG-NUEVA-PADRE o RECORD-B) manda lo que está pendiente. */
function estamosListos(c: Ctx): void {
  const e = c.e;
  const f = e.fase;
  const item = e.guion[e.cursor];
  // Solo después de RECORD-B se vuelve a mandar lo que se espera (ya está arriba; así queda a mano). Sirve una vez.
  const reenviar = e.reenviar;
  e.reenviar = false;
  switch (f.tipo) {
    case 'bienvenida':
      return empezarItem(c, 0, false);
    case 'retenido':
      return soltarRetenido(c);
    case 'libre':
      return empezarItem(c, f.siguiente, false);
    case 'aviso-seria':
      if (!reenviar) return;
      return emitir(c, fijoA(e, 'B-AVISO-SERIA'));
    case 'op':
      if (!reenviar) return;
      return emitir(c, opMsg(e, pregunta(f.clave)));
    case 'foto': {
      if (!reenviar) return;
      const vencida = fotoVencidaEnCurso(e);
      if (vencida) return emitir(c, { ...fotoMsg(e, vencida.foto), id: vencida.id });
      if (e.extra) return emitir(c, extraMsg(e, extraDelBanco(e.extra)));
      const foto = fotoDelItem(item);
      if (foto) emitir(c, fotoMsg(e, foto));
      return;
    }
    case 'seguir':
    case 'tranquila':
    case 'una-mas':
    case 'extras-oferta':
    case 'extras-otra': {
      if (!reenviar) return;
      const id = ({ seguir: 'B-SEGUIR', tranquila: 'B-TRANQUILA', 'una-mas': 'B-UNA-MAS', 'extras-oferta': 'EXTRAS-OFERTA', 'extras-otra': 'EXTRAS-OTRA' } as const)[f.tipo];
      return emitir(c, fijoA(e, id));
    }
    case 'cierre':
      if (!reenviar || item.tipo !== 'cierre') return;
      return emitir(c, fijoA(e, item.clave as IdMensaje));
    // 'foto-audio' (espera el audio después de [No tengo]) y 'cierre-cuenta' no tienen un mensaje propio que repetir.
    case 'pregunta': {
      if (!reenviar) return;
      if (e.extra) return emitir(c, extraMsg(e, extraDelBanco(e.extra)));
      if (item.tipo === 'padre') return emitir(c, ...padreMsgs(e, item, false));
      if (item.tipo !== 'principal') return;
      const p = pregunta(item.clave);
      const ri = f.rama === null ? -1 : p.ramas.findIndex((r) => r.boton === f.rama);
      return emitir(c, ri < 0 ? preguntaMsg(e, p) : ramaMsg(e, p, ri, f.pasoRama));
    }
  }
}

export function alBoton(c: Ctx, boton: string): void {
  const e = c.e;
  const f = e.fase;
  if (enDiaSobrio(c)) return; // algo preocupante: ese día los botones no hacen nada
  if (e.ficha.canal === 'B' && boton === 'Estamos listos') return estamosListos(c);
  const item = e.guion[e.cursor];

  switch (f.tipo) {
    case 'bienvenida':
      if (boton === 'Dale, vamos') empezarItem(c, 0, false);
      return;
    case 'retenido':
      if (boton === 'Dale, mandámela') soltarRetenido(c);
      return;
    case 'pregunta': {
      if (e.extra || item.tipo === 'padre') {
        if (boton !== 'Paso' && boton !== 'Esta la paso') return;
        emitir(c, fijoA(e, 'B-PASO'));
        return terminarItem(c);
      }
      if (item.tipo !== 'principal') return;
      const p = pregunta(item.clave);
      if (boton === p.botonPaso) {
        emitir(c, fijoA(e, 'B-PASO'));
        return fotoOTerminar(c);
      }
      const ri = p.ramas.findIndex((r) => r.boton === boton);
      if (ri < 0 || f.rama !== null) return;
      const accion = p.ramas[ri].accion;
      if (p.id === 'K12') e.hermanos = boton.startsWith('Tengo');
      if (accion.tipo === 'preguntar') {
        emitir(c, ramaMsg(e, p, ri, 0));
        e.fase = { ...f, rama: boton, pasoRama: 0 };
        return;
      }
      emitir(c, fijoA(e, accion.tipo === 'paso' ? 'B-PASO' : 'B-NO-PASA-NADA'));
      return fotoOTerminar(c);
    }
    case 'op':
      if (boton !== 'Paso') return;
      emitir(c, fijoA(e, 'B-PASO'));
      return fotoOTerminar(c);
    case 'foto': {
      const foto = fotoEnCurso(c);
      if (!foto || !foto.botones.includes(boton)) return;
      if (boton === 'No tengo') return noTengo(c, foto);
      if (boton === 'Hoy no la como') return hoyNoLaComo(c);
      if (BOTONES_NO_ES_LO_MIO.includes(boton)) {
        emitir(c, fijoA(e, 'B-NO-PASA-NADA'));
        return terminarItem(c);
      }
      return;
    }
    case 'seguir':
      if (boton === 'Dale, otra') return empezarItem(c, e.cursor + 1, false);
      if (boton === 'Mañana sigo') return manana(c, e.cursor + 1);
      return;
    case 'aviso-seria':
      if (boton === 'Voy ahora' && item.tipo === 'principal') {
        emitir(c, preguntaMsg(e, pregunta(item.clave)));
        e.diaHecho = hoy(c);
        e.fase = { tipo: 'pregunta', clave: item.clave, rama: null, pasoRama: 0 };
        return;
      }
      if (boton === 'Mañana mejor') return manana(c, e.cursor);
      return;
    case 'tranquila':
      if (boton === 'Dale, una tranquila') return empezarItem(c, e.cursor + 1, false);
      if (boton === 'Mañana sigo') return manana(c, e.cursor + 1);
      return;
    case 'una-mas':
      if (boton === 'Dale, otra') {
        const [x] = extrasDeUnaMas(e);
        if (x) return mandarExtra(c, x);
        return empezarItem(c, e.cursor + 1, false);
      }
      if (boton === 'No, cerramos') return empezarItem(c, e.cursor + 1, false);
      return;
    case 'cierre':
      if (boton === 'No, eso fue todo') return terminarItem(c);
      if (boton === 'Sí, hay algo') e.fase = { tipo: 'cierre-cuenta' };
      return;
    case 'extras-oferta':
    case 'extras-otra': {
      const [x] = extrasDelFinal(e);
      if (boton === 'Dale, otra') {
        if (!x) return empezarItem(c, e.cursor + 1, false);
        if (f.tipo === 'extras-oferta') emitir(c, fijoA(e, 'EXTRAS-SI'));
        return mandarExtra(c, x);
      }
      if (boton === 'No, ya está' || boton === 'Lo dejamos acá') return empezarItem(c, e.cursor + 1, false);
      return;
    }
  }
}
