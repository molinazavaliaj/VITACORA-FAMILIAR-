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

export function fichaXml(f: FichaEntrevista): string {
  const idi = idiomaDe(f);
  const lineas = [
    `Nombre: ${f.nombre}${f.apodo ? ` (le dicen ${f.apodo})` : ''}`,
    `Género: ${GENERO[f.genero]}${f.genero === 'otro' && f.formaTrato ? ` (prefiere trato ${f.formaTrato})` : ''}`,
    `Año de nacimiento: ${f.anioNacimiento}`,
    `Trato: ${TRATO[idi]}`,
    `Idioma del libro: ${IDIOMA_LIBRO[idi]}`,
    `Para quién es el libro: ${f.destinatarios?.trim() || '(no se cargó)'}`,
    `País donde nació: ${f.paisNacimiento}`,
    `País donde vive: ${f.paisResidencia}`,
    ...(f.ciudadInfancia ? [`Ciudad de la infancia: ${f.ciudadInfancia}`] : []),
    `Hijos: ${lista(f.hijos, (h) => h.nombre)}`,
    `Hermanos: ${lista(f.hermanos, (h) => h)}`,
    `Parejas: ${lista(f.parejas, (p) => `${p.nombre}${p.actual ? ' (hoy)' : ''}`)}`,
    '(El resto de la ficha no se cargó: sale de sus respuestas.)',
  ];
  // Los textos libres (nombres, lugares, para quién) los cargó la familia: sin < ni > (el XML se arma a mano).
  return `<ficha>\n${lineas.map(esc).join('\n')}\n</ficha>`;
}
