// El código de la gift card dentro de un WhatsApp. Copia del alfabeto y de la
// regla de normalizarCodigo de web/src/lib/regalo.ts (son dos servicios): si
// cambia uno, cambia el otro.

const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LARGO = 6;
const L = `[${ALFABETO}]`;

/** Copia de normalizarCodigo (web): el texto entero es un código, o null. */
function normalizar(texto: string): string | null {
  const arriba = texto.trim().toUpperCase();
  // El VF es prefijo si va separado ("VF-7K3M", "VF 7K3") o si sobra ("VFVF3K2M").
  // Pegado y sin sobrar, es parte del código: "VF3K2M" es VF-VF3K2M escrito pelado.
  const prefijoSeparado = /^VF[\s-]/.test(arriba);
  let limpio = arriba.replace(/[\s-]/g, '');
  if (prefijoSeparado || (limpio.length === LARGO + 2 && limpio.startsWith('VF'))) limpio = limpio.slice(2);
  if (limpio.length !== LARGO) return null;
  for (const ch of limpio) if (!ALFABETO.includes(ch)) return null;
  return `VF-${limpio}`;
}

// Dentro de un mensaje más largo ("Hola, quiero empezar mi libro. VF-7K3M2Q"):
// la VF al principio de una palabra y seis caracteres, con espacios o guiones
// entre medio, sin nada pegado detrás. Un código sin VF en medio de un mensaje
// no se busca: no inventamos códigos en mensajes comunes.
const CON_VF = new RegExp(`(?<![A-Z0-9])VF[\\s-]*((?:${L}[\\s-]*){${LARGO - 1}}${L})(?![A-Z0-9])`);
// "VF3K2M" pegado en un mensaje: como en la web, la VF es parte del código.
const VF_PELADO = new RegExp(`(?<![A-Z0-9])(VF${L}{${LARGO - 2}})(?![A-Z0-9])`);

export function extraerCodigo(texto: string): string | null {
  const entero = normalizar(texto);
  if (entero) return entero;
  const t = texto.toUpperCase();
  const conVF = t.match(CON_VF);
  if (conVF) return `VF-${conVF[1].replace(/[\s-]/g, '')}`;
  const pelado = t.match(VF_PELADO);
  if (pelado) return `VF-${pelado[1]}`;
  return null;
}
