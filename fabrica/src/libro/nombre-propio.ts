// El nombre del narrador como va en el libro (Naza, 02/11): la familia a veces lo
// carga todo en minúscula («juan domingo mateos») y así salía en el encabezado de
// cada página, en «Sus frases», en el colofón y en la contratapa impresa. Acá va
// con mayúscula inicial en cada palabra. Copia de `nombrePropio` de
// web/src/lib/nombre-propio.ts: la página del QR y el libro lo escriben igual.
//
// Solo se toca lo que está ENTERO en minúscula: si la familia ya puso alguna
// mayúscula («el Negro», «McDonald», «JD»), es a propósito y queda como lo escribió.

/** Las que van en minúscula dentro de un nombre («Juan de la Cruz»), salvo al principio. */
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'i', 'e', 'da', 'das', 'do', 'dos', 'di', 'van', 'von']);

const mayusculaInicial = (palabra: string): string => palabra.charAt(0).toLocaleUpperCase('es') + palabra.slice(1);

/** «juan domingo mateos» → «Juan Domingo Mateos»; «maría-josé de la fuente» → «María-José de la Fuente». */
export function nombrePropio(nombre: string | null | undefined): string {
  const limpio = (nombre ?? '').trim().replace(/\s+/g, ' ');
  if (limpio !== limpio.toLocaleLowerCase('es')) return limpio;
  return limpio
    .split(' ')
    .map((palabra, i) => (i > 0 && PARTICULAS.has(palabra) ? palabra : palabra.split('-').map(mayusculaInicial).join('-')))
    .join(' ');
}
