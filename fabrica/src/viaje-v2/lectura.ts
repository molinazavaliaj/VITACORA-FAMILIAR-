// La entrevista completa de UN viaje INVENTADO, mensaje por mensaje, tal como
// la vería la persona en WhatsApp: día, hora local y quién habla. Usa las
// funciones de verdad (calendario, mensajes, estado, álbum): si una regla
// cambia, la lectura cambia. Puro: devuelve el md; el script lo escribe.
//
// Viaje INVENTADO: Lucía y su hermano Tomás no existen. Nunca usar acá la
// vida de un narrador real.

import { iniciarAlbum, pasoAlbum, type EventoAlbum } from './album.js';
import { armarCalendario, momentoDeLaSiguiente, momentoRecordatorio, pendientesAntes, siguienteDeLaCadena, type IdAntes, type Programado } from './calendario.js';
import { anotarEnvio, anotarRespuesta, contestadasAntes, nochesSinContestar, nuevoEstado, type Estado } from './estado.js';
import { aInstante, aLocal, diaDeSemana, diasEntre, nombreDeZona } from './horas.js';
import { alDecirSi, arranque, preguntaProgramada, reaccion, recordatorioAntes, type QueSeContesta, type Respuesta } from './mensajes.js';
import type { Compra, Mensaje, Zona } from './tipos.js';

export const COMPRA_LECTURA: Compra = {
  nombre: 'Lucía',
  salida: '2026-10-10',
  vuelta: '2026-10-17',
  zonaCasa: 'America/Argentina/Buenos_Aires',
  zonaViaje: 'Europe/Madrid',
  horaNoche: '21:30',
  regalo: { quienRegala: 'Tomás' },
  preguntasPropias: ['¿Qué fue lo primero que comiste allá que te hizo acordar a casa?', '¿Con quién te hubiera gustado estar ahí, aunque sea un rato?'],
  formato: 'impreso',
  fotosAlbum: 20,
};

type Linea = { instante: Date; zona: Zona; de: 'vita' | 'persona' | 'nota'; texto: string; ids?: string[] };

/** Lo que contesta Lucía: cuándo (hora local de esa parte del viaje) y qué. */
type Guion = { hora: string; respuesta: Respuesta; dice: string; fotos?: number };

// Respuestas inventadas, cortas. Clave = la del calendario ("D3-noche").
const GUION: Record<string, Guion[]> = {
  'D0-manana': [{ hora: '10:40', respuesta: { tipo: 'audio' }, dice: 'audio: el mate en la mesada, la valija parada en el pasillo, y la duda de si cerré la ventana del baño' }],
  'D1-manana': [{ hora: '12:15', respuesta: { tipo: 'audio' }, dice: 'audio: del avión me acuerdo de nada; del tren desde el aeropuerto, los campos secos y pensar "ya está, estoy acá"' }],
  'D1-noche': [{ hora: '22:05', respuesta: { tipo: 'audio' }, dice: 'audio: un pañuelo de mi abuela; lo llevo a todos lados desde que ella no está', fotos: 1 }],
  'D2-mediodia': [{ hora: '13:20', respuesta: { tipo: 'foto' }, dice: 'foto' }],
  'D2-noche': [{ hora: '22:30', respuesta: { tipo: 'audio' }, dice: 'audio: unas croquetas en un bar de parados, un mozo que me habló como si fuera del barrio', fotos: 3 }],
  'D3-mediodia': [{ hora: '13:10', respuesta: { tipo: 'paso' }, dice: 'texto: paso' }],
  // D3-noche (la primera propia): no contesta. La noche siguiente llega con ATR.
  'D4-mediodia': [{ hora: '13:40', respuesta: { tipo: 'audio' }, dice: 'audio: diez segundos de campanas y motos' }],
  'D4-noche': [{ hora: '22:50', respuesta: { tipo: 'texto' }, dice: 'texto: hoy me quedé dos horas en una plaza mirando a unos viejos jugar a la petanca, no sé por qué me emocionó' }],
  'D5-mediodia': [
    { hora: '13:05', respuesta: { tipo: 'foto' }, dice: 'foto' },
    { hora: '18:30', respuesta: { tipo: 'foto' }, dice: 'foto suelta: un balcón con ropa colgada' },
  ],
  'D5-noche': [
    { hora: '21:50', respuesta: { tipo: 'audio', audioMal: true }, dice: 'audio cortado, no se entiende' },
    { hora: '22:05', respuesta: { tipo: 'audio' }, dice: 'audio: con mi viejo; le hubiera encantado el mercado' },
  ],
  'D6-mediodia': [{ hora: '14:00', respuesta: { tipo: 'audio' }, dice: 'audio: «vale», lo dicen para todo' }],
  'D6-noche': [{ hora: '22:20', respuesta: { tipo: 'audio' }, dice: 'audio: la señora del hostal que me dio un abrazo al despedirme', fotos: 1 }],
  'D7-mediodia': [{ hora: '13:30', respuesta: { tipo: 'foto' }, dice: 'foto: un frasco de aceitunas envuelto en una remera' }],
  'D8-manana': [{ hora: '11:00', respuesta: { tipo: 'audio' }, dice: 'audio: en la escala, cuando escuché a alguien hablar en porteño' }],
  'D8-noche': [{ hora: '22:10', respuesta: { tipo: 'audio' }, dice: 'audio: que mi casa huele a mi casa; nunca lo había notado' }],
};

/** El álbum: 15 fotos esa noche, 8 a la mañana siguiente, y "sí" al segundo AL2. Hora de casa. */
const GUION_ALBUM: { fecha: string; hora: string; evento: 'foto' | 'si'; cantidad?: number; dice: string }[] = [
  { fecha: '2026-10-18', hora: '22:30', evento: 'foto', cantidad: 15, dice: '15 fotos' },
  { fecha: '2026-10-19', hora: '09:00', evento: 'foto', cantidad: 8, dice: '8 fotos más' },
  { fecha: '2026-10-19', hora: '14:20', evento: 'si', dice: 'texto: sí, ya está' },
];

export function lecturaCorrida(compra: Compra = COMPRA_LECTURA): string {
  const lineas: Linea[] = [];
  let estado: Estado = nuevoEstado();
  const casa = compra.zonaCasa;
  const en = (fecha: string, hora: string, zona: Zona) => aInstante(fecha, hora, zona);
  const vita = (t: Date, zona: Zona, m: Mensaje) => lineas.push({ instante: t, zona, de: 'vita', texto: m.texto, ids: m.ids });
  const persona = (t: Date, zona: Zona, dice: string) => lineas.push({ instante: t, zona, de: 'persona', texto: dice });
  const nota = (t: Date, zona: Zona, texto: string) => lineas.push({ instante: t, zona, de: 'nota', texto });

  // ── Arranque y antes de salir ──
  const compraEn = en('2026-10-01', '18:00', casa);
  vita(compraEn, casa, arranque(compra));
  const si = en('2026-10-01', '18:20', casa);
  persona(si, casa, 'texto: SÍ');
  for (const m of alDecirSi(compra)) vita(si, casa, m);
  estado = anotarEnvio(estado, { clave: 'AS1', tipo: 'cadena', ids: ['AS1'], en: si.toISOString() });

  const cadena: { id: IdAntes; fecha: string; hora: string; respuesta: Respuesta; dice: string }[] = [
    { id: 'AS1', fecha: '2026-10-01', hora: '19:05', respuesta: { tipo: 'audio' }, dice: 'audio: salió de una sobremesa con Tomás, cuando me dijo "¿y si vas de una vez?"' },
    { id: 'AS2', fecha: '2026-10-02', hora: '22:40', respuesta: { tipo: 'audio' }, dice: 'audio: nervios; la ficha me cayó sacando la valija del placard' },
    { id: 'IM1', fecha: '2026-10-03', hora: '09:00', respuesta: { tipo: 'paso' }, dice: 'texto: paso' },
    // VA1 queda colgada: sale REC1 a los 3 días y tampoco contesta. Va la primera noche del viaje.
  ];
  let ultimaEnviada = si;
  for (const c of cadena) {
    const t = en(c.fecha, c.hora, casa);
    persona(t, casa, c.dice);
    estado = anotarRespuesta(estado, c.id, { ...c.respuesta, en: t.toISOString() });
    const sig = siguienteDeLaCadena(c.id);
    const cuando = momentoDeLaSiguiente(t, compra);
    const r = reaccion({ tipo: 'cadena', siguiente: cuando ? sig : null }, c.respuesta, compra, estado.rotacion);
    estado = { ...estado, rotacion: r.rot };
    for (const m of r.mensajes) vita(cuando ?? t, casa, m);
    if (sig && cuando) {
      estado = anotarEnvio(estado, { clave: sig, tipo: 'cadena', ids: [sig], en: cuando.toISOString() });
      ultimaEnviada = cuando;
    }
  }
  const rec = momentoRecordatorio(ultimaEnviada, compra, estado.recordatorioAntes);
  if (rec) {
    nota(rec, casa, 'VA1 lleva 3 días sin respuesta.');
    vita(rec, casa, recordatorioAntes(compra));
    estado = { ...estado, recordatorioAntes: true };
  }

  // ── El viaje ──
  const pendientes = pendientesAntes(contestadasAntes(estado));
  const cal = armarCalendario(compra, pendientes);
  for (const p of cal.programados) {
    const sinContestar = nochesSinContestar(estado);
    const q = preguntaProgramada(p, compra, sinContestar, estado.rotacion);
    estado = { ...estado, rotacion: q.rot };
    if (q.mensaje.ids.some((id) => id.startsWith('ATR'))) nota(p.instante, p.zona, `La noche anterior quedó sin contestar.`);
    vita(p.instante, p.zona, q.mensaje);
    estado = anotarEnvio(estado, { clave: p.clave, tipo: p.tipo, ids: p.ids, en: p.instante.toISOString() });
    for (const g of GUION[p.clave] ?? []) estado = contestar(p, g, estado);
    if (p.tipo === 'CA1') estado = album(estado);
  }
  if (cal.antesQueNoEntran.length) nota(lineas[lineas.length - 1].instante, casa, `No entraron: ${cal.antesQueNoEntran.join(', ')}`);
  if (cal.propiasQueNoEntran.length) nota(lineas[lineas.length - 1].instante, casa, `Propias que no entraron: ${cal.propiasQueNoEntran.join(' · ')}`);

  function contestar(p: Programado, g: Guion, e: Estado): Estado {
    const t = en(p.fecha, g.hora, p.zona);
    persona(t, p.zona, g.fotos ? `${g.dice} + ${g.fotos === 1 ? 'una foto' : `${g.fotos} fotos`}` : g.dice);
    const suelta = g.dice.startsWith('foto suelta');
    const de: QueSeContesta = suelta ? { tipo: 'foto-suelta' } : { tipo: p.tipo };
    const r = reaccion(de, g.respuesta, compra, e.rotacion);
    let e2: Estado = { ...e, rotacion: r.rot, fotosSueltas: e.fotosSueltas + (suelta ? 1 : 0) + (g.fotos ?? 0) };
    if (!suelta) e2 = anotarRespuesta(e2, p.clave, { ...g.respuesta, en: t.toISOString() });
    for (const m of r.mensajes) vita(t, p.zona, m);
    if (r.abreAlbum) e2 = { ...e2, album: iniciarAlbum(t, compra) };
    return e2;
  }

  function album(e: Estado): Estado {
    let a = e.album;
    if (!a) return e;
    const aplicar = (ev: EventoAlbum) => {
      const r = pasoAlbum(a!, ev, compra);
      a = r.estado;
      for (const s of r.salidas) {
        if (s.tipo === 'mensaje') vita(ev.en, casa, s.mensaje);
        else if (s.tipo === 'avisar-naza') nota(ev.en, casa, `Aviso a Naza: ${s.motivo}`);
        else nota(ev.en, casa, `Se cierra el álbum: ${a!.fotos} fotos mandadas, guardadas ${s.guardadas}, afuera ${s.descartadas}.`);
      }
    };
    for (const g of GUION_ALBUM) {
      const t = en(g.fecha, g.hora, casa);
      // Antes de lo que hace ella, el reloj: si venció, sale lo que tenga que salir.
      while (a!.vence && Date.parse(a!.vence) <= t.getTime() && a!.fase !== 'cerrado') aplicar({ tipo: 'reloj', en: new Date(a!.vence) });
      persona(t, casa, g.dice);
      aplicar(g.evento === 'foto' ? { tipo: 'foto', en: t, cantidad: g.cantidad } : { tipo: 'si', en: t });
    }
    return { ...e, album: a };
  }

  return escribirMd(lineas, compra);
}

// ── El md ────────────────────────────────────────────────────────────────────

function tituloDelDia(fecha: string, zona: Zona, compra: Compra): string {
  const [, m, d] = fecha.split('-').map(Number);
  const cuando = `${diaDeSemana(fecha)} ${d}/${m}`;
  const hora = `hora de ${nombreDeZona(zona)}`;
  const desdeSalida = diasEntre(compra.salida, fecha);
  const n = diasEntre(compra.salida, compra.vuelta);
  let que: string;
  if (desdeSalida < 0) que = 'Antes de salir';
  else if (desdeSalida === 0) que = 'Día 1 · salida';
  else if (desdeSalida === n) que = `Día ${desdeSalida + 1} · vuelta`;
  else if (desdeSalida < n) que = `Día ${desdeSalida + 1} del viaje`;
  else que = 'Ya en casa';
  return `## ${que} · ${cuando} (${hora})`;
}

function escribirMd(lineas: Linea[], compra: Compra): string {
  const orden = lineas.map((l, i) => ({ l, i })).sort((a, b) => a.l.instante.getTime() - b.l.instante.getTime() || a.i - b.i).map((x) => x.l);
  const out: string[] = [
    '# Vitácora de Viaje V2 · Lectura corrida',
    '',
    `Un viaje **inventado**, mensaje por mensaje, como le llegaría por WhatsApp. Generado por \`fabrica/scripts/viaje-v2-lectura.ts\` con el código de \`fabrica/src/viaje-v2/\` y los textos de \`banco.md\`: no editar a mano.`,
    '',
    `- ${compra.nombre}, regalo de su hermano ${compra.regalo?.quienRegala ?? '-'}; ${diasEntre(compra.salida, compra.vuelta) + 1} días (sale el ${compra.salida}, emprende la vuelta el ${compra.vuelta}).`,
    `- Casa: ${nombreDeZona(compra.zonaCasa)}. Viaje: ${nombreDeZona(compra.zonaViaje)}. Noche a las ${compra.horaNoche}. Libro impreso, álbum de ${compra.fotosAlbum}.`,
    `- Preguntas de ${compra.regalo?.quienRegala}: ${compra.preguntasPropias.map((p) => `«${p}»`).join(' · ')}`,
    '- Las respuestas de ella van en cursiva y son inventadas. Al lado de cada mensaje, los IDs del banco de donde sale. Las notas entre paréntesis no las ve nadie: son para leer.',
  ];
  let titulo = '';
  for (const l of orden) {
    const { fecha, hora } = aLocal(l.instante, l.zona);
    const t = tituloDelDia(fecha, l.zona, compra);
    if (t !== titulo) {
      out.push('', t);
      titulo = t;
    }
    out.push('');
    if (l.de === 'nota') {
      out.push(`_(${l.texto})_`);
      continue;
    }
    if (l.de === 'persona') {
      out.push(`**${hora} · ${compra.nombre}**  `, `_[${l.texto}]_`);
      continue;
    }
    out.push(`**${hora} · Vitácora** ${l.ids!.map((id) => `\`${id}\``).join(' + ')}  `);
    out.push(...l.texto.split('\n\n').flatMap((p, i) => (i === 0 ? [`> ${p}`] : ['>', `> ${p}`])));
  }
  return out.join('\n') + '\n';
}
