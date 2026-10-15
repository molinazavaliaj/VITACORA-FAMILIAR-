// El armado del libro de Kids, sin modelo: de las salidas de cada paso a un libro ordenado (LibroKids), que
// después se escribe como libro.md y sobre.md (para leer y para los socios) y como HTML/PDF (salida/html.ts).
// Además, informe.md para los socios: lo que se corrigió, las dudas, lo que el código o el veedor marcaron y no
// se pudo arreglar, las fotos para mirar y el gasto.
import type { Contexto } from '../../escritor/orquestador/contexto.js';
import type { ControlFinal } from '../orquestador.js';
import type { Salidas } from '../controles.js';
import type { SalidaLectura } from '../llamadas.js';
import { salidaKids } from '../material/carpeta.js';
import type { FotoKids, MaterialKids, RespuestaKids } from '../material/tipos.js';
import { todasLasRespuestas } from '../material/de-filas.js';

export type PiezaLibro = { clave: string; titulo: string; texto: string; ids: string[]; linea?: string; pregunta?: string; padre: boolean };
export type FotoLibroKids = { id: string; foto: FotoKids; epigrafe: string };
export type VozLibro = { id: string; respuesta: RespuestaKids; titulo: string; parte: string };
export type LibroKids = {
  nombre: string;
  llamado: string;
  subtitulo: string;
  partes: { n: number; titulo: string; piezas: PiezaLibro[] }[];
  album: { titulo: string; fotos: FotoLibroKids[] };
  suVoz: VozLibro[];
  sobre: { titulo: string; nombre: string; piezas: { clave: string; pregunta: string; texto: string }[] };
};

/** «Capítulo Uno: 11 años» y «Mis cosas a los 11» (decisiones de Naza del 15/10). */
export const subtituloTapa = (edad: number): string => `Capítulo Uno: ${edad} años`;
export const tituloAlbum = (edad: number): string => `Mis cosas a los ${edad}`;

export function armarLibro(m: MaterialKids, s: Salidas, voz: { ids: string[] }): LibroKids {
  const partes = m.partes.map((p) => ({
    n: p.n,
    titulo: p.titulo,
    piezas: (s.partes.get(p.n)?.piezas ?? []).map((pz) => ({ ...pz, padre: /^PADRE-\d+$/.test(pz.clave) })),
  }));
  const porFoto = new Map((s.album?.fotos ?? []).map((f) => [f.id, f]));
  const fotos = m.fotos.map((f) => ({ id: f.id, foto: f, epigrafe: porFoto.get(f.id)?.epigrafe?.trim() ?? '' }));
  const rs = new Map(todasLasRespuestas(m).map((r) => [r.id, r]));
  const suVoz: VozLibro[] = [];
  for (const id of voz.ids) {
    const r = rs.get(id);
    if (!r) continue;
    const parte = partes.find((p) => p.piezas.some((pz) => pz.ids.includes(id)));
    const pieza = parte?.piezas.find((pz) => pz.ids.includes(id));
    if (parte && pieza) { suVoz.push({ id, respuesta: r, titulo: pieza.titulo || pieza.pregunta || '', parte: parte.titulo }); continue; }
    const foto = fotos.find((f) => f.foto.respuestas.some((x) => x.id === id));
    if (foto) suVoz.push({ id, respuesta: r, titulo: foto.epigrafe || tituloAlbum(m.ficha.edad), parte: tituloAlbum(m.ficha.edad) });
  }
  return {
    nombre: m.ficha.nombre,
    llamado: m.ficha.llamado,
    subtitulo: subtituloTapa(m.ficha.edad),
    partes,
    album: { titulo: tituloAlbum(m.ficha.edad), fotos },
    suVoz,
    sobre: { titulo: m.sobre.titulo, nombre: m.ficha.nombre, piezas: (s.sobre?.piezas ?? []).map((p) => ({ clave: p.clave, pregunta: p.pregunta, texto: p.texto })) },
  };
}

export function libroMd(l: LibroKids): string {
  const out: string[] = [`# ${l.nombre}`, '', l.subtitulo, ''];
  for (const p of l.partes) {
    if (!p.piezas.length) continue;
    out.push(`## ${p.titulo}`, '');
    for (const pz of p.piezas) {
      if (pz.padre) {
        if (pz.linea) out.push(`*${pz.linea}*`, '');
        out.push(`**${pz.pregunta ?? ''}**`, '', pz.texto.trim(), '');
      } else out.push(`### ${pz.titulo}`, '', pz.texto.trim(), '');
    }
  }
  if (l.album.fotos.length) {
    out.push(`## ${l.album.titulo}`, '');
    for (const f of l.album.fotos) out.push(`![${f.id}](${f.foto.storagePath})`, ...(f.epigrafe ? [`*${f.epigrafe}*`] : []), '');
  }
  if (l.suVoz.length) {
    out.push('## Su voz', '');
    for (const v of l.suVoz) out.push(`- ${v.parte} · ${v.titulo} · QR al audio de ${v.id}`);
    out.push('');
  }
  return `${out.join('\n').trim()}\n`;
}

export function sobreMd(l: LibroKids): string {
  const out: string[] = [`# ${l.sobre.titulo}`, '', l.sobre.nombre, '', l.subtitulo, ''];
  for (const p of l.sobre.piezas) out.push(`**${p.pregunta}**`, '', p.texto.trim(), '');
  return `${out.join('\n').trim()}\n`;
}

export type DatosInforme = { m: MaterialKids; s: Salidas; lectura: SalidaLectura; voz: { ids: string[]; sacadas: { id: string; por_que: string }[] }; final: ControlFinal; gastado: number };

export function informeMd(d: DatosInforme): string {
  const { m, lectura, final } = d;
  const rs = todasLasRespuestas(m);
  const out: string[] = [`# Informe del libro de ${m.ficha.llamado} (${m.ficha.nombre}, ${m.ficha.edad} años)`, ''];
  out.push(`Material: ${rs.length} respuestas con texto (${rs.filter((r) => r.audio).length} con audio), ${m.fotos.length} fotos, ${m.sobre.items.length} items en el sobre.`);
  out.push(`Gasto del escritor: USD ${d.gastado.toFixed(4)}.`, '');
  out.push('## Correcciones de nombres (del panel, aplicadas en la copia)', '');
  out.push(...(m.correcciones.length ? m.correcciones.map((k) => `- «${k.dice}» → «${k.es}» (${k.veces} veces)`) : ['- ninguna']), '');
  if (m.sinLugar.length) out.push('## Lo que no tenía a qué item ir (no llegó al libro)', '', ...m.sinLugar.map((x) => `- ${x.clave}: «${x.texto}»`), '');
  if (lectura.preocupante.length) out.push('## Algo preocupante (Naza lo liberó)', '', ...lectura.preocupante.map((p) => `- ${p.ids.join(', ')} · «${p.cita}» · ${p.por_que}`), '');
  out.push('## Dudas de nombres', '', ...(lectura.dudas.length ? lectura.dudas.map((x) => `- ${x.ids.join(', ')} · «${x.cita}» · ${x.que}`) : ['- ninguna']), '');
  if (lectura.notas.trim()) out.push('## Notas de la lectura', '', lectura.notas.trim(), '');
  out.push('## Su voz', '', `Con QR: ${d.voz.ids.join(', ') || 'ninguna'}.`, ...d.voz.sacadas.map((x) => `- ${x.id} salió de «Su voz» (${x.por_que})`), '');
  out.push('## Veedor', '');
  for (const [n, ps] of Object.entries(final.veedor)) {
    out.push(`Parte ${n}: ${ps.length ? `${ps.length} problemas${final.arregladas.includes(Number(n)) ? ', arreglada una vez' : ''}` : 'sin problemas'}.`);
    for (const p of ps) out.push(`- ${p.clave} · ${p.tipo} · «${p.cita}» · ${p.arreglo}`);
  }
  out.push('');
  const quedan = Object.entries(final.partes).flatMap(([n, ps]) => ps.map((p) => `- parte ${n} · ${p.clave} · ${p.tipo} · «${p.cita}» · ${p.arreglo}`));
  out.push('## Lo que el código sigue marcando después del arreglo', '', ...(quedan.length ? quedan : ['- nada']), '');
  out.push('## Sobre', '', ...(final.sobre.length ? final.sobre.map((x) => `- ${x}`) : ['- sin problemas']), '');
  out.push('## Álbum', '', ...(final.album.length ? final.album.map((x) => `- ${x}`) : ['- sin problemas']), '');
  if (final.ignoradas.length) out.push('## Otros avisos', '', ...final.ignoradas.map((x) => `- ${x}`), '');
  out.push('## Fotos para mirar antes de imprimir', '', 'Las fotos con otros chicos las mira Naza (el escritor no ve las fotos).', ...m.fotos.map((f) => `- ${f.id} · ${f.clave || 'sin pregunta'} · ${f.storagePath}`), '');
  return `${out.join('\n').trim()}\n`;
}

/** Escribe libro.md, sobre.md e informe.md en la carpeta (salidas/) y en el almacén. */
export async function escribirArmado(x: Pick<Contexto, 'c' | 'almacen'>, d: DatosInforme): Promise<LibroKids> {
  const libro = armarLibro(d.m, d.s, d.voz);
  const archivos: Record<string, string> = { 'libro.md': libroMd(libro), 'sobre.md': sobreMd(libro), 'informe.md': informeMd(d) };
  for (const [a, t] of Object.entries(archivos)) {
    x.c.escribir(salidaKids(a), t);
    await x.almacen.escribir(a, t);
  }
  return libro;
}
