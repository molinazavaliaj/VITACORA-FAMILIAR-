// La alarma de variables al arrancar el worker (12/10). En una semana pasó tres veces
// lo mismo: el código estaba bien y lo apagaba la configuración, sin avisar (la key de
// Anthropic revocada, una lista de plantillas que no existía en Railway, MAIL_SOCIOS
// que faltaba). Al arrancar, la fábrica revisa las variables que lee y, si falta
// alguna, la anota en el log y manda UN mail a los socios.
//
// Una vez por día aunque Railway se reinicie: en memoria y con la misma marca en
// Storage que usa el entrevistador (entrevistador/src/v3/avisos.ts, marcaEnStorage).
// Nunca frena el arranque y nunca tira.
//
// Regla del proyecto: nunca se muestra el valor de una variable, solo su nombre.
// Las que tienen valor por defecto (URL_BASE, MAIL_FROM, ESCRITOR_*,
// RESPUESTAS_PARA_ANTICIPO, CUENTA_IA) no son una falta.

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { obtenerClienteDb } from './db.js';
import { avisarSocios } from './escritor/produccion/avisos.js';

export type Falta = { variable: string; problema: string };
type Env = NodeJS.ProcessEnv;

const vacia = (env: Env, nombre: string) => !(env[nombre] ?? '').trim();

/** Las que exige cargarConfig (config.ts). La fábrica las pide recién en la primera vuelta, así que arranca igual. */
const OBLIGATORIAS: ReadonlyArray<readonly [string, string]> = [
  ['SUPABASE_URL', 'Es obligatoria. Sin ella la fábrica no lee ni escribe nada y cada vuelta del worker falla.'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'Es obligatoria. Sin ella la fábrica no lee ni escribe nada y cada vuelta del worker falla.'],
  ['ANTHROPIC_API_KEY', 'Es obligatoria. Sin ella no sale ningún libro (escritor, paquete, frases y anticipos fallan).'],
  ['OPENAI_API_KEY', 'Es obligatoria. Sin ella la fábrica no arma su configuración y cada vuelta del worker falla.'],
];

/** Las que no frenan nada pero, si faltan, apagan algo sin avisar. */
const NECESARIAS: ReadonlyArray<readonly [string, string]> = [
  ['RESEND_API_KEY', 'No existe o está vacía. No sale ningún mail de la fábrica (anticipos, libros listos, recordatorio de frases, avisos a los socios).'],
  ['MAIL_SOCIOS', 'No existe o está vacía. Los avisos a los socios quedan solo en el log y el escritor no espera las dudas de datos, el libro sale sin que nadie las vea.'],
];

/** Qué variables faltan, con qué deja de andar por cada una. Puro: solo lee `env`. Nunca devuelve valores. */
export function revisarVariables(env: Env = process.env): Falta[] {
  return [...OBLIGATORIAS, ...NECESARIAS]
    .filter(([nombre]) => vacia(env, nombre))
    .map(([variable, problema]) => ({ variable, problema }));
}

/** 'nueva': primera vez hoy; 'ya': otro arranque ya avisó hoy; 'no-se': no se pudo saber (se avisa igual). */
export type Marca = (dia: string, clave: string) => Promise<'nueva' | 'ya' | 'no-se'>;

/**
 * La marca del aviso en el bucket privado `audios`: `avisos/<día>/<sha1 de la clave>.txt`.
 * Es la misma que la del entrevistador (entrevistador/src/v3/avisos.ts): subir sin pisar
 * es atómico y, si ya existe, Storage contesta 409 y ya se avisó. Con tope de espera.
 */
export function marcaEnStorage(db: Pick<SupabaseClient, 'storage'>, esperaMs = 6_000): Marca {
  return async (dia, clave) => {
    try {
      const path = `avisos/${dia}/${createHash('sha1').update(clave).digest('hex')}.txt`;
      let reloj: ReturnType<typeof setTimeout> | undefined;
      const tarde = new Promise<'tarde'>((r) => { reloj = setTimeout(() => r('tarde'), esperaMs); });
      const subida = db.storage.from('audios').upload(path, new Blob([dia]), { contentType: 'text/plain', upsert: false });
      const res = await Promise.race([subida, tarde]).finally(() => clearTimeout(reloj));
      if (res === 'tarde') {
        console.warn('variables: el Storage no contestó a tiempo la marca del aviso; avisa igual.');
        return 'no-se';
      }
      const { error } = res;
      if (!error) return 'nueva';
      const e = error as { message?: string; statusCode?: string | number };
      if (String(e.statusCode) === '409' || /already exists|duplicate/i.test(e.message ?? '')) return 'ya';
      console.warn(`variables: no pude guardar la marca del aviso (${e.message ?? 'sin detalle'}); avisa igual.`);
      return 'no-se';
    } catch (err) {
      console.warn('variables: no pude guardar la marca del aviso; avisa igual.', err instanceof Error ? err.message : err);
      return 'no-se';
    }
  };
}

const YA_AVISADO = new Set<string>();

/** Para los tests. */
export function olvidarAvisosDeVariables(): void {
  YA_AVISADO.clear();
}

export const CLAVE_AVISO_VARIABLES = 'variables-fabrica';
export const ASUNTO_VARIABLES = 'A la fábrica le faltan variables en Railway';

function marcaPorDefecto(): Marca | null {
  try {
    return marcaEnStorage(obtenerClienteDb());
  } catch {
    return null; // sin Supabase no hay marca: queda solo la memoria
  }
}

/**
 * Al arrancar el worker: revisa, anota en el log y avisa a los socios una vez por día
 * (la clave lleva una huella de la lista: si cambia, vuelve a avisar). Sin MAIL_SOCIOS
 * o sin RESEND_API_KEY no hay a quién mandarlo: solo log fuerte. Nunca tira.
 */
export async function avisarVariablesAlArrancar(o: {
  env?: Env;
  avisar?: (asunto: string, detalle: string) => Promise<boolean>;
  /** null: sin marca en Storage (solo memoria). Sin pasar: la del Storage de producción. */
  marca?: Marca | null;
  ahora?: Date;
} = {}): Promise<'ok' | 'avisado' | 'ya-avisado' | 'solo-log'> {
  let llave: string | null = null;
  try {
    const env = o.env ?? process.env;
    const faltas = revisarVariables(env);
    if (faltas.length === 0) {
      console.log('variables: la fábrica tiene todas las variables que necesita.');
      return 'ok';
    }
    const lista = faltas.map((f) => `- ${f.variable}. ${f.problema}`).join('\n');
    console.error(`VARIABLES QUE FALTAN EN LA FÁBRICA (${faltas.length})\n${lista}`);
    if (vacia(env, 'MAIL_SOCIOS') || vacia(env, 'RESEND_API_KEY')) {
      console.error('variables: sin MAIL_SOCIOS o sin RESEND_API_KEY no hay a quién mandar este aviso. Queda solo en este log.');
      return 'solo-log';
    }

    const dia = (o.ahora ?? new Date()).toISOString().slice(0, 10);
    const clave = `${CLAVE_AVISO_VARIABLES}:${createHash('sha1').update(lista).digest('hex').slice(0, 12)}`;
    llave = `${clave}|${dia}`;
    if (YA_AVISADO.has(llave)) return 'ya-avisado';
    YA_AVISADO.add(llave);
    const marca = o.marca === undefined ? marcaPorDefecto() : o.marca;
    let estado: 'nueva' | 'ya' | 'no-se' = 'no-se';
    try {
      if (marca) estado = await marca(dia, clave);
    } catch {
      estado = 'no-se'; // mejor un aviso de más que ninguno
    }
    if (estado === 'ya') return 'ya-avisado';

    const detalle =
      'Al arrancar, la fábrica encontró esto en sus variables de Railway.\n\n' +
      `${lista}\n\n` +
      'Acá van solo los nombres, nunca los valores.\n' +
      'Este aviso sale una vez por día mientras siga igual.';
    const salio = await (o.avisar ?? avisarSocios)(ASUNTO_VARIABLES, detalle);
    if (!salio) YA_AVISADO.delete(llave);
    return salio ? 'avisado' : 'solo-log';
  } catch (err) {
    if (llave) YA_AVISADO.delete(llave);
    console.error('variables: no pude avisar las variables que faltan:', err instanceof Error ? err.message : err);
    return 'solo-log';
  }
}
