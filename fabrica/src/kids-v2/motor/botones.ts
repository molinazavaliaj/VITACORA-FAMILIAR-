// Los botones (banco.md, "Mensajes ya aprobados" y columna Botones;
// mensajes.md). Un botón que no corresponde a lo que se espera (uno viejo,
// tocado dos veces) no hace nada: nunca rompe ni repite.

import { extra as extraDelBanco, pregunta } from '../banco.js';
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
import { extraMsg, fijoA, padreMsgs, preguntaMsg, ramaMsg } from './mensajes.js';
import type { Foto } from '../tipos.js';

const BOTONES_NO_ES_LO_MIO = ['No hago', 'De ninguno', 'No miro'];

/**
 * La foto que se está esperando: una foto vencida que volvió al final (K1-FOTO)
 * lleva los botones de la original (cambio A, 05/10); una extra con foto, [No tengo].
 */
function fotoEnCurso(c: Ctx): Foto | null {
  const e = c.e;
  const vencida = fotoVencidaEnCurso(e);
  if (vencida) return vencida.foto;
  if (e.extra) return { de: e.extra, texto: '', botones: ['No tengo'], noTengo: null };
  const item = e.guion[e.cursor];
  return fotoDelItem(item);
}

/** Canal B: [Estamos listos] (de BIEN-PADRE, PREG-NUEVA-PADRE o RECORD-B) manda lo que está pendiente. */
function estamosListos(c: Ctx): void {
  const e = c.e;
  const f = e.fase;
  const item = e.guion[e.cursor];
  switch (f.tipo) {
    case 'bienvenida':
      return empezarItem(c, 0, false);
    case 'retenido':
      return soltarRetenido(c);
    case 'libre':
      return empezarItem(c, f.siguiente, false);
    case 'aviso-seria':
      if (!e.reenviar) return;
      e.reenviar = false;
      return emitir(c, fijoA(e, 'B-AVISO-SERIA'));
    case 'pregunta': {
      // Solo después de RECORD-B: la pregunta ya está arriba; se manda de nuevo para que quede a mano.
      if (!e.reenviar) return;
      e.reenviar = false;
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
      if (boton === 'No tengo') {
        emitir(c, fijoA(e, foto.noTengo ? 'B-FOTO-PLATA' : 'B-FOTO-NOTENGO'));
        e.fase = { tipo: 'foto-audio', clave: f.clave, desde: c.ahora.toISOString() };
        return;
      }
      if (boton === 'Hoy no la como') {
        // La foto ya le pide contar la última vez que la comió: se espera su audio (05/10).
        e.fase = { tipo: 'foto-audio', clave: f.clave, desde: c.ahora.toISOString() };
        return;
      }
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
