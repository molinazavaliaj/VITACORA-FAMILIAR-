// La ficha V3 en el formato que lee el escritor (entradas/ficha.xml): una línea por dato, como la ficha
// de Joaquín. El escritor saca de acá el nombre de pila ("Nombre: X"), el idioma del libro
// ("Idioma del libro: catalán") y el trato. Lo que no se cargó lo dice: el escritor no inventa.
import { estado, type Opcional } from '../../v3/ficha.js';
import { idiomaDe, type Idioma } from '../../v3/entrevista/idioma.js';
import type { FichaEntrevista } from '../../v3/entrevista/texto.js';
import { esc } from './de-entrevista.js';

const GENERO: Record<FichaEntrevista['genero'], string> = { varon: 'varón', mujer: 'mujer', otro: 'otro' };
// "tu" sin tilde también en castellano de España: C10 compara el trato del registro con 'tu' (ver controles/correr.ts).
const TRATO: Record<Idioma, string> = { 'es-AR': 'vos', 'es-ES': 'tu', ca: 'tu' };
const IDIOMA_LIBRO: Record<Idioma, string> = { 'es-AR': 'castellano', 'es-ES': 'castellano de España', ca: 'catalán' };

function lista<T>(v: Opcional<T[]>, fmt: (x: T) => string): string {
  const e = estado(v);
  if (e === 'no-tiene') return 'no tiene';
  if (e === 'no-sabe') return '(no se cargó)';
  return (v as T[]).map(fmt).join(', ');
}

/**
 * La ficha de producción (escritor en el worker): la de `entrevistas_v3` trae nombre, género y trato, y el
 * resto sale de lo que cargó la familia al registrarse (`narradores.contexto`). Por eso el año y los países
 * pueden faltar, y el árbol llega como texto libre ("mariano y rodrigo", "no tuvo"): va tal cual.
 */
export type FichaParaXml = Omit<FichaEntrevista, 'anioNacimiento' | 'paisNacimiento' | 'paisResidencia'> & {
  anioNacimiento?: number;
  paisNacimiento?: string;
  paisResidencia?: string;
  lugarNacimiento?: string;
  arbolTexto?: { padres?: string; hermanos?: string; conyuge?: string; hijos?: string };
};

const NO_SE_CARGO = '(no se cargó)';
const conTexto = (t: string | undefined): string | undefined => (typeof t === 'string' && t.trim() ? t.trim() : undefined);

export function fichaXml(f: FichaParaXml): string {
  const idi = idiomaDe(f);
  const arbol = f.arbolTexto ?? {};
  const lineas = [
    `Nombre: ${f.nombre}${f.apodo ? ` (le dicen ${f.apodo})` : ''}`,
    `Género: ${GENERO[f.genero]}${f.genero === 'otro' && f.formaTrato ? ` (prefiere trato ${f.formaTrato})` : ''}`,
    `Año de nacimiento: ${f.anioNacimiento ?? NO_SE_CARGO}`,
    `Trato: ${TRATO[idi]}`,
    `Idioma del libro: ${IDIOMA_LIBRO[idi]}`,
    `Para quién es el libro: ${f.destinatarios?.trim() || '(no se cargó)'}`,
    `País donde nació: ${conTexto(f.paisNacimiento) ?? NO_SE_CARGO}`,
    ...(conTexto(f.lugarNacimiento) ? [`Lugar donde nació (lo cargó la familia): ${conTexto(f.lugarNacimiento)}`] : []),
    `País donde vive: ${conTexto(f.paisResidencia) ?? NO_SE_CARGO}`,
    ...(f.ciudadInfancia ? [`Ciudad de la infancia: ${f.ciudadInfancia}`] : []),
    ...(conTexto(arbol.padres) ? [`Padres (lo cargó la familia): ${conTexto(arbol.padres)}`] : []),
    conTexto(arbol.hijos) && f.hijos === undefined ? `Hijos (lo cargó la familia): ${conTexto(arbol.hijos)}` : `Hijos: ${lista(f.hijos, (h) => h.nombre)}`,
    conTexto(arbol.hermanos) && f.hermanos === undefined ? `Hermanos (lo cargó la familia): ${conTexto(arbol.hermanos)}` : `Hermanos: ${lista(f.hermanos, (h) => h)}`,
    conTexto(arbol.conyuge) && f.parejas === undefined ? `Parejas (lo cargó la familia): ${conTexto(arbol.conyuge)}` : `Parejas: ${lista(f.parejas, (p) => `${p.nombre}${p.actual ? ' (hoy)' : ''}`)}`,
    '(El resto de la ficha no se cargó: sale de sus respuestas.)',
  ];
  // Los textos libres (nombres, lugares, para quién) los cargó la familia: sin < ni > (el XML se arma a mano).
  return `<ficha>\n${lineas.map(esc).join('\n')}\n</ficha>`;
}
