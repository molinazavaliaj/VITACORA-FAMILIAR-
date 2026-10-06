// v5.3, Paso 7 (corrector de estilo): fabrica/scripts/escritor-v55/estilo.mjs sobre la Carpeta.
import { Carpeta, leerJSON } from '../carpeta.js';
import { salida } from '../lectura.js';
import { archivoDe, marcas, palabras } from '../texto.js';
import type { Json } from '../tipos.js';

// v5.3.1: los números en letras cuentan igual que en cifras ("fútbol once" = "fútbol 11", "piso tres" = "tercer piso").
const EN_LETRAS: Record<string, number> = { dos: 2, segundo: 2, segunda: 2, tres: 3, tercer: 3, tercero: 3, tercera: 3, cuatro: 4, cinco: 5, quinto: 5, quinta: 5, seis: 6, sexto: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, cien: 100,
  // v5.4: catalán ("nou", "set", "deu" y "quart" no entran: también son otras palabras)
  dues: 2, segon: 2, segona: 2, quatre: 4, cinc: 5, sis: 6, vuit: 8, onze: 11, dotze: 12, tretze: 13, catorze: 14, setze: 16, disset: 17, divuit: 18, dinou: 19, vint: 20, trenta: 30, quaranta: 40, cinquanta: 50 };
// "cuarto" no entra (es también una habitación); "uno/un/primer" tampoco (artículos y orden).
const numeros = (t: string): string => [...(t.match(/\d+/g) || []), ...palabras(t.replace(/\[\[[^\]]*\]\]/g, '')).filter((w) => w in EN_LETRAS).map((w) => String(EN_LETRAS[w]))].sort().join(',');
// Nombres propios: palabras con mayúscula que no arrancan una oración ni van después de una raya o comillas.
const nombres = (t: string): string[] => [...t.replace(/\[\[[^\]]*\]\]/g, '').matchAll(/(?<![.!?¿¡—"«:]\s|^)(?<=\s|\()(\p{Lu}[\p{L}]+)/gmu)].map((m) => m[1]);

/** '' si el cambio pasa; si no, el motivo. */
export function barandaEstilo(c: Json, texto: string, conocidos: string[] = []): string {
  const antes = (c.antes || '').trim(), despues = (c.despues || '').trim();
  if (!antes || !texto.includes(antes)) return 'el "antes" no está tal cual en la pieza';
  if (marcas(antes).sort().join(',') !== marcas(despues).sort().join(',')) return 'cambia las marcas [[R..]]';
  // v5.5: en una "repeticion" se puede sacar un número que ya está en otro lugar de la pieza ("a esa edad" en vez de repetir "14 o 15").
  if (numeros(antes) !== numeros(despues)) {
    const resto = numeros(texto.replace(antes, ' ')).split(','), nd = numeros(despues).split(',').filter(Boolean);
    const sacados = numeros(antes).split(',').filter(Boolean).filter((n) => { const i = nd.indexOf(n); if (i >= 0) { nd.splice(i, 1); return false; } return true; });
    const ok = c.por_que === 'repeticion' && !nd.length && sacados.every((n) => resto.includes(n));
    if (!ok) return 'cambia números';
  }
  const nd = ` ${palabras(despues).join(' ')} `;
  // los nombres con mayúscula en medio de la oración, y los del registro (personas y apodos) aunque abran la oración
  const na = ` ${palabras(antes).join(' ')} `;
  const reg = conocidos.map((n) => palabras(n).join(' ')).filter((n) => n && na.includes(` ${n} `));
  const falta = [...nombres(antes).map((n) => palabras(n).join(' ')), ...reg].filter((n) => !nd.includes(` ${n} `));
  if (falta.length) return `se pierden nombres: ${falta.join(', ')}`;
  const a = palabras(antes).length, d = palabras(despues).length;
  if (a >= 8 && (d < a * 0.6 || d > a * 1.4)) return `cambia el largo de ${a} a ${d} palabras`;
  return '';
}

export function aplicarEstilo(texto: string, cambios: Json[], conocidos: string[] = []): { texto: string; aplicados: Json[]; frenados: Json[] } {
  let t = texto;
  const aplicados: Json[] = [], frenados: Json[] = [];
  for (const c of cambios || []) {
    const motivo = barandaEstilo(c, t, conocidos);
    if (motivo) { frenados.push({ ...c, motivo }); continue; }
    t = t.replace(c.antes.trim(), () => c.despues.trim());
    aplicados.push(c);
  }
  return { texto: t, aplicados, frenados };
}

/** El main de estilo.mjs: aplica estilo/cambios-<pieza>[-2].json a la pieza. Devuelve lo que imprimía. */
export function aplicarEstiloPieza(c: Carpeta, pieza: string, ronda: 1 | 2): string {
  const r = ronda === 2 ? '-2' : '';
  const arch = salida(archivoDe(pieza)), cam = `estilo/cambios-${pieza}${r}.json`;
  if (!c.existe(cam)) return `${pieza}: sin cambios de estilo (no hay ${cam})`;
  const viejo = c.leer(arch);
  const reg = c.existe(salida('registro.json')) ? leerJSON(c, salida('registro.json')) : {};
  const conocidos = (reg.personas || []).flatMap((p: Json) => [p.nombre, ...(p.apodos || [])]).filter(Boolean);
  const { texto, aplicados, frenados } = aplicarEstilo(viejo, leerJSON(c, cam).cambios, conocidos);
  c.escribir(`estilo/antes-${pieza}${r}.md`, viejo);
  c.escribir(arch, texto);
  c.escribir(`estilo/aplicado-${pieza}${r}.json`, JSON.stringify({ aplicados, frenados }, null, 1));
  return `${pieza}: estilo${r ? ' (2.ª pasada)' : ''} ${aplicados.length} aplicados, ${frenados.length} frenados${frenados.length ? ` (${[...new Set(frenados.map((f) => f.motivo.split(':')[0]))].join('; ')})` : ''}`;
}
