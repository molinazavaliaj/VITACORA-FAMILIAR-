// El alta de un narrador de «Vitácora de una historia»: crear su fila en `historias` a partir de lo que escribió la web
// al comprar (CONTRATO, «Vitácora de una historia»; plan, Task 3.3). Como la Viaje V2 (viaje-v2/alta.ts): el bot da el
// alta solo, apenas ve a un narrador nuevo con `contexto.modo = 'historia'` (el tick del scheduler, o procesar.ts si
// escribe primero). Dos a la vez no crean dos filas: la clave primaria es el narrador (crearFila).
//
// `contexto.historia = { tema, temaLibre?, temaAbierto?, preguntasPropias? }`, `contexto.genero` y `contexto.idioma`.
// Con el tema abierto la fila nace con `tema = 'otra'` y `estado.temaAbierto` (lo elige en TEMA-ABIERTO). Si falta
// algo que no se puede suponer (el género, un tema conocido, el nombre de quien regala en un regalo), no se adivina:
// se avisa a los socios y el narrador queda como está; con los datos corregidos, el tick siguiente le da el alta.

import type { DepsHistoria } from './deps.js';
import { crearFila, esNarradorHistoria } from './estado.js';
import { esIdioma, IDIOMA_POR_DEFECTO } from './nucleo/entrevista/idioma.js';
import { MAX_PROPIAS } from './nucleo/entrevista/flujo.js';
import { esGenero, esTema, estadoInicial, type FichaFila, type NarradorHistoria } from './tipos.js';

/** ¿Es de «Vitácora de una historia»? La web le pone `contexto.modo = 'historia'` al comprar. */
export function esModoHistoria(contexto: Record<string, unknown> | null | undefined): boolean {
  return contexto?.modo === 'historia';
}

/** Los estados en que se da el alta: antes del SÍ. Un narrador que ya arrancó otra cosa no se pasa solo. */
const ESTADOS_DEL_ALTA = ['invitado', 'acepto'];

function texto(x: unknown): string | undefined {
  return typeof x === 'string' && x.trim() ? x.trim() : undefined;
}

export type Alta = 'creada' | 'ya-estaba' | 'frenada';

/** El nombre de quien compró (familias.nombre), como `quienRegala` de la V3. */
async function quienRegala(deps: DepsHistoria, familiaId: string): Promise<string | undefined> {
  const { data } = await deps.db.from('familias').select('nombre').eq('id', familiaId).maybeSingle();
  return texto((data as { nombre?: unknown } | null)?.nombre);
}

export async function asegurarAltaHistoria(deps: DepsHistoria, n: NarradorHistoria): Promise<Alta> {
  if (await esNarradorHistoria(deps.db, n.id)) return 'ya-estaba';
  const frenar = async (motivo: string): Promise<Alta> => {
    await deps.avisar(`historia-alta-${n.id}`, `No pude darle el alta a la historia de ${n.como_le_dicen || n.id}`,
      `${n.id} (${n.estado}) es de «Vitácora de una historia» y no arranca: ${motivo}. Con el dato corregido en narradores.contexto, el bot le da el alta solo.`);
    return 'frenada';
  };
  if (!ESTADOS_DEL_ALTA.includes(n.estado)) return frenar(`está en '${n.estado}' sin fila en historias (el alta es antes del SÍ)`);
  const c = n.contexto ?? {};
  const h = (c.historia ?? {}) as Record<string, unknown>;
  if (!esGenero(c.genero)) return frenar('falta contexto.genero (varon, mujer u otro)');
  const temaAbierto = h.temaAbierto === true;
  const tema = temaAbierto ? 'otra' : h.tema;
  if (!esTema(tema)) return frenar(`el tema «${String(h.tema)}» no es uno de docs/historia/temas.md`);
  const idioma = c.idioma === undefined || c.idioma === null || c.idioma === '' ? IDIOMA_POR_DEFECTO : c.idioma;
  if (!esIdioma(idioma)) return frenar(`el idioma «${String(c.idioma)}» no es es-AR, es-ES ni ca`);
  const regala = c.regalo === true ? await quienRegala(deps, n.familia_id) : undefined;
  if (c.regalo === true && !regala) return frenar('es un regalo y no encontré el nombre de quien regala (familias.nombre), que va en la bienvenida');

  const todas = Array.isArray(h.preguntasPropias) ? h.preguntasPropias.map(texto).filter((p): p is string => p !== undefined) : [];
  const propias = todas.slice(0, MAX_PROPIAS);
  const temaLibre = temaAbierto ? undefined : texto(h.temaLibre);
  const ficha: FichaFila = {
    nombre: n.como_le_dicen,
    genero: c.genero,
    ...(c.formaTrato === 'masculino' || c.formaTrato === 'femenino' ? { formaTrato: c.formaTrato } : {}),
    ...(regala ? { quienRegala: regala } : {}),
    tema,
    ...(temaLibre ? { temaLibre } : {}),
  };
  const r = await crearFila(deps.db, {
    narrador_id: n.id, idioma, ficha, compra: { preguntasPropias: propias },
    estado: estadoInicial({ temaAbierto, propias }), ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0,
  });
  if (r === 'ya-existia') return 'ya-estaba';
  if (todas.length > MAX_PROPIAS) {
    await deps.avisar(`historia-propias-${n.id}`, `Llegaron ${todas.length} preguntas de quien regala para ${n.como_le_dicen || n.id}`,
      `La compra de ${n.id} trae ${todas.length} preguntas propias y van hasta ${MAX_PROPIAS}. Se guardaron las primeras ${MAX_PROPIAS}; las que quedaron afuera: ${todas.slice(MAX_PROPIAS).map((p) => `«${p}»`).join(', ')}.`);
  }
  return 'creada';
}
