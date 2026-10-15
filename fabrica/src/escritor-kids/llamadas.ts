// Arma las llamadas de la receta de Kids (docs/kids/v2/escritor/receta.md, sección 2): la línea fija, los
// documentos en el orden de la receta y, al final, las instrucciones del paso con su esquema. No escribe nada.
// El nombre de cada llamada (kids-leer, kids-parte-N…) no cae en ninguna regla especial de rolDe: va con el rol
// por defecto (Opus 5.5, pensamiento medio), que es el que piden el plan y la receta para todos los pasos.
import type { Llamada } from '../escritor/llamadas/armar.js';
import type { FichaKids, FotoKids, ItemKids, MaterialKids, ParteKids, RespuestaKids } from './material/tipos.js';
import { instruccionesKids, lineaFijaKids, type HuecosKids } from './prompts/index.js';

export type PiezaKids = { clave: string; titulo: string; texto: string; ids: string[]; linea?: string; pregunta?: string };
export type AfueraKids = { id: string; por_que: string };
export type SalidaParte = { piezas: PiezaKids[]; afuera: AfueraKids[] };
export type PiezaSobre = { clave: string; pregunta: string; texto: string; ids: string[] };
export type SalidaSobre = { piezas: PiezaSobre[] };
export type EpigrafeKids = { id: string; epigrafe: string; ids: string[] };
export type SalidaAlbum = { fotos: EpigrafeKids[] };
export type Marca = { ids: string[]; cita: string; por_que: string };
export type DudaKids = { ids: string[]; cita: string; que: string };
export type SalidaLectura = { preocupante: Marca[]; dudas: DudaKids[]; su_voz: string[]; notas: string };
export type TipoProblema = 'inventado' | 'falta' | 'suena_a_grande' | 'dos_puntos' | 'estirado' | 'otro';
export type ProblemaKids = { clave: string; tipo: TipoProblema; cita: string; arreglo: string };
export type SalidaVeedor = { problemas: ProblemaKids[] };

export const NOMBRES = {
  leer: 'kids-leer',
  parte: (n: number) => `kids-parte-${n}`,
  sobre: 'kids-sobre',
  album: 'kids-album',
  veedor: (n: number) => `kids-veedor-${n}`,
  arreglo: (n: number) => `kids-arreglo-${n}`,
} as const;

const attr = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\s+/g, ' ').trim();
const cuerpo = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
const siNo = (b: boolean): string => (b ? 'si' : 'no');

export function fichaXml(f: FichaKids): string {
  const l = [
    '<ficha>',
    `<nombre>${cuerpo(f.nombre)}</nombre>`,
    `<se_le_dice>${cuerpo(f.llamado)}</se_le_dice>`,
    `<edad>${f.edad}</edad>`,
    `<genero>${f.genero}</genero>`,
    `<quien_lo_regala>${cuerpo(f.quienRegala)}</quien_lo_regala>`,
  ];
  for (const p of f.preguntasPadre) l.push(`<pregunta_del_padre clave="${p.clave}" quien="${attr(p.quien)}" conLinea="${siNo(p.conLinea)}">${cuerpo(p.texto)}</pregunta_del_padre>`);
  l.push('</ficha>');
  return l.join('\n');
}

export const respuestaXml = (r: RespuestaKids): string => `<respuesta id="${r.id}" clave="${attr(r.clave)}" pregunta="${attr(r.pregunta)}" audio="${siNo(r.audio)}">${cuerpo(r.texto)}</respuesta>`;

export function itemXml(i: ItemKids): string {
  const padre = i.padre ? ` quien="${attr(i.padre.quien)}" conLinea="${siNo(i.padre.conLinea)}"` : '';
  return [`<item clave="${attr(i.clave)}" pregunta="${attr(i.pregunta)}"${padre}>`, ...i.respuestas.map(respuestaXml), '</item>'].join('\n');
}

export const fotoXml = (f: FotoKids): string => [`<foto id="${f.id}" clave="${attr(f.clave)}" pregunta="${attr(f.pregunta)}">`, ...f.respuestas.map(respuestaXml), '</foto>'].join('\n');

const parteAdentro = (p: ParteKids): string => p.items.map(itemXml).join('\n\n');
export const parteXml = (p: ParteKids): string => `<parte n="${p.n}" titulo="${attr(p.titulo)}">\n${parteAdentro(p)}\n</parte>`;
export const sobreXml = (m: MaterialKids): string => `<sobre titulo="${attr(m.sobre.titulo)}">\n${m.sobre.items.map(itemXml).join('\n\n')}\n</sobre>`;
export const fotosXml = (m: MaterialKids): string => `<fotos>\n${m.fotos.map(fotoXml).join('\n\n')}\n</fotos>`;

export function materialXml(m: MaterialKids): string {
  const partes = m.partes.map(parteXml);
  partes.push(`<parte n="5" titulo="${attr(m.sobre.titulo)}">\n${m.sobre.items.map(itemXml).join('\n\n')}\n</parte>`);
  return `<material>\n${partes.join('\n\n')}\n\n${fotosXml(m)}\n</material>`;
}

const huecos = (m: MaterialKids, p?: ParteKids): HuecosKids => ({
  NOMBRE: m.ficha.llamado, EDAD: String(m.ficha.edad), GENERO: m.ficha.genero,
  ...(p ? { PARTE: String(p.n), TITULO_PARTE: p.titulo } : {}),
});
const conError = (instr: string, error?: string): string => (error ? `${instr}\n\nTu respuesta anterior no pasó estos controles. Devolvé el JSON completo corregido.\n${error}` : instr);
const parteN = (m: MaterialKids, n: number): ParteKids => {
  const p = m.partes.find((x) => x.n === n);
  if (!p) throw new Error(`el material no tiene la parte ${n}`);
  return p;
};

export const llamadaLeer = (m: MaterialKids, o: { error?: string } = {}): Llamada => ({
  nombre: NOMBRES.leer, docs: [lineaFijaKids(), fichaXml(m.ficha), materialXml(m)], instr: conError(instruccionesKids('### Kids · Leer todo', huecos(m)), o.error),
});

export function llamadaParte(m: MaterialKids, n: number, o: { error?: string } = {}): Llamada {
  const p = parteN(m, n);
  return { nombre: NOMBRES.parte(n), docs: [lineaFijaKids(), fichaXml(m.ficha), parteXml(p)], instr: conError(instruccionesKids('### Kids · Parte', huecos(m, p)), o.error) };
}

export const llamadaSobre = (m: MaterialKids, o: { error?: string } = {}): Llamada => ({
  nombre: NOMBRES.sobre, docs: [lineaFijaKids(), fichaXml(m.ficha), sobreXml(m)], instr: conError(instruccionesKids('### Kids · Sobre', huecos(m)), o.error),
});

export const llamadaAlbum = (m: MaterialKids, o: { error?: string } = {}): Llamada => ({
  nombre: NOMBRES.album, docs: [lineaFijaKids(), fichaXml(m.ficha), fotosXml(m)], instr: conError(instruccionesKids('### Kids · Álbum', huecos(m)), o.error),
});

export function llamadaVeedor(m: MaterialKids, n: number, piezas: SalidaParte): Llamada {
  const p = parteN(m, n);
  return { nombre: NOMBRES.veedor(n), docs: [lineaFijaKids(), fichaXml(m.ficha), parteXml(p), `<piezas>\n${JSON.stringify(piezas, null, 1)}\n</piezas>`], instr: instruccionesKids('### Kids · Veedor', huecos(m, p)) };
}

export function llamadaArreglo(m: MaterialKids, n: number, conProblemas: PiezaKids[], problemas: ProblemaKids[]): Llamada {
  const p = parteN(m, n);
  const porClave: Record<string, Omit<ProblemaKids, 'clave'>[]> = {};
  for (const x of problemas) (porClave[x.clave] ??= []).push({ tipo: x.tipo, cita: x.cita, arreglo: x.arreglo });
  return {
    nombre: NOMBRES.arreglo(n),
    docs: [
      lineaFijaKids(), fichaXml(m.ficha), parteXml(p),
      `<piezas_con_problemas>\n${JSON.stringify({ piezas: conProblemas }, null, 1)}\n</piezas_con_problemas>`,
      `<problemas>\n${JSON.stringify(porClave, null, 1)}\n</problemas>`,
    ],
    instr: instruccionesKids('### Kids · Arreglo', huecos(m, p)),
  };
}
