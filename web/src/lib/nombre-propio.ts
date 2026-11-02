// El nombre y el apodo como los ve una persona (Naza, 02/11): la familia a veces los
// carga todo en minúscula («juan domingo mateos», «nitin») y así salían en la página
// del QR. Acá se muestran con mayúscula inicial en cada palabra, sin tocar la base.
//
// Solo se toca lo que está ENTERO en minúscula: si la familia ya puso alguna
// mayúscula («el Negro», «McDonald», «JD»), es a propósito y queda como lo escribió.

/** Las que van en minúscula dentro de un nombre («Juan de la Cruz»), salvo al principio. */
const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y", "i", "e", "da", "das", "do", "dos", "di", "van", "von"]);

const mayusculaInicial = (palabra: string): string => palabra.charAt(0).toLocaleUpperCase("es") + palabra.slice(1);

/** «juan domingo mateos» → «Juan Domingo Mateos»; «maría-josé de la fuente» → «María-José de la Fuente». */
export function nombrePropio(nombre: string | null | undefined): string {
  const limpio = (nombre ?? "").trim().replace(/\s+/g, " ");
  if (limpio !== limpio.toLocaleLowerCase("es")) return limpio;
  return limpio
    .split(" ")
    .map((palabra, i) => (i > 0 && PARTICULAS.has(palabra) ? palabra : palabra.split("-").map(mayusculaInicial).join("-")))
    .join(" ");
}
