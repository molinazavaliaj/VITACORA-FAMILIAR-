// Ayudas de los tests del escritor de historia: una historia INVENTADA (Rubén, el de los ejemplos de la receta:
// nada de esto existe), lo que «contesta el modelo» en cada paso y un contexto en memoria. Ninguna llamada real.
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { carpetaDeHistoria } from '../../src/escritor-historia/material/carpeta.js';
import type { EntrevistaHistoria } from '../../src/escritor-historia/material/tipos.js';
import type { ContextoHistoria } from '../../src/escritor-historia/orquestador.js';

export const RUBEN: EntrevistaHistoria = {
  ficha: { nombre: 'Rubén', genero: 'varon', quienRegala: 'Fede', tema: 'mudanza', temaLibre: 'cuando me fui a Valencia con la valija verde' },
  idioma: 'es-AR',
  propias: ['¿Por qué vendiste la guitarra y no me dijiste nada?'],
  panel: [],
  charla: [{ de: 'bio', partes: [{ id: 'HC3', texto: '¿Cómo empezó todo?' }] }],
  respuestas: [
    ['HC1', 'Yo era tornero en Bahía Blanca, en el taller de mi viejo. Los viernes tocaba la guitarra en el club.'],
    ['HC2', 'paso'],
    ['HC3', 'En 2002 cerró el taller y con Graciela decidimos irnos a Valencia con Fede, que tenía 9 años.'],
    ['HM1', 'Me llevé la valija verde de mi padre, la de la cinta roja en la manija. La guitarra no entraba, así que la llevé en la mano.'],
    ['HM3', 'Alquilamos una pieza en Benimaclet a Toni, un jubilado. Era una pieza, pero era nuestra.'],
    ['HC5', 'En febrero de 2003 me echaron de la obra porque no tenía papeles. Esa noche vendí la guitarra en una tienda de la calle Sueca, me dieron ochenta euros. Fede dormía.'],
    ['RP~HC5', 'Volví caminando y no le dije nada a nadie.'],
    ['HC7', 'Toni me dejó el alquiler para más adelante y me consiguió trabajo en el horno de su cuñado Salva.'],
    ['HC8', 'En 2005 me dieron los papeles y fuimos los tres a la playa de la Malvarrosa.'],
    ['PR-H1', 'La vendí porque no teníamos para el alquiler de marzo. No te dije nada porque tenías 9 años.'],
    ['HC10', 'Le diría que la valija no hace falta llenarla tanto, que lo que importa te entra en la mano.'],
    ['FOTO-H', '⟦foto⟧'],
  ],
};

const ep = (id: string, tramo: string, ids: string[], o: Record<string, unknown> = {}) => ({
  id, que: `episodio ${id}`, cuando: '', segura: false, donde: '', personas: [], tipo: 'episodio', tramo, es_escena: true, estado: 'termino',
  momento_clave: '', ids, variantes: [], no_poner: false, a_quien: 'nadie', a_quien_nombres: [], detalles: ['un detalle'], ...o,
});

export const REGISTRO = {
  historia: { tema: 'Irse a vivir lejos', en_sus_palabras: [], punto_bajo: { episodio: 'E05', ids: ['R06'] }, giro: { episodio: 'E06', ids: ['R07'] } },
  narrador: { como_se_presenta: [], cosas_concretas_suyas: [], repite_sin_que_se_lo_pregunten: [], conclusiones_propias: [] },
  personas: ['Graciela', 'Fede', 'Toni', 'Salva'].map((nombre, i) => ({ id: `P0${i + 1}`, nombre, apodos: [], relacion: '', estado: 'no_se_sabe', estado_ids: [], hechos: [], rasgos_hoy: [] })),
  lugares: [],
  linea_de_tiempo: [],
  episodios: [
    ep('E01', 'antes', ['R01']),
    ep('E02', 'comienzo', ['R03'], { es_escena: false, detalles: [] }),
    ep('E03', 'tema', ['R04']),
    ep('E04', 'tema', ['R05']),
    ep('E05', 'dificil', ['R06', 'R09'], { momento_clave: 'bajo' }),
    ep('E06', 'giro', ['R07'], { momento_clave: 'giro' }),
    ep('E07', 'despues', ['R08']),
    ep('E08', 'cierre', ['R10'], { tipo: 'mensaje', a_quien: 'quien_era', es_escena: false, detalles: [] }),
  ],
  propias: [{ id: 'R09', pregunta: '¿Por qué vendiste la guitarra y no me dijiste nada?', episodio: 'E05' }],
  hoy: [],
  dudas: [{ tipo: 'nombre', que: 'Salva o Salvador', ids: ['R07'], resuelta_por_ficha: false }],
  confirmados: [],
  no_poner: [],
  frases_cortadas: [],
  voz: { frases: [{ id: 'R05', texto: 'Era una pieza, pero era nuestra' }, { id: 'R10', texto: 'lo que importa te entra en la mano' }], palabras_propias: [], dichos: [], trato: 'vos', genero: 'm' },
  sin_lugar: [],
};

const cap = (n: number, etapa: string, piezas: [string, string, string][], o: Record<string, unknown> = {}) => ({
  n, titulo: { texto: '', id: '', armado_con_ids: [] }, etapa, anios: { desde: '', hasta: '', seguros: false }, hilo: `cambia el tramo ${n}`, hilo_ids: ['R01'],
  apertura: { tipo: 'escena', episodio: piezas[0][0] }, cierre: { tipo: 'gesto', episodio: piezas[piezas.length - 1][0], frase_id: '' },
  piezas: piezas.map(([episodio, forma, peso]) => ({ episodio, forma, peso, por_que_aca: '' })), imagen: { episodio: '', ids: [] }, preparacion: [],
  golpe: { episodio: '', preparacion: [], frase_id: '' }, presenta: [], nombra_sin_presentar: [], es_ultimo: false, hilo_de_hoy_ids: [], columna: { texto: '', ids: [] },
  imagen_final: { episodio: '', frase_id: '', que: '' }, ...o,
});

export const PLAN = {
  titulo_libro: { texto: 'La valija verde', id: 'R04', armado_con_ids: [], de_la_ficha: false },
  hilo_libro: { texto: 'Rubén se va de Bahía Blanca con la valija verde, en Valencia pierde el trabajo y la guitarra, y se queda', ids: ['R01', 'R04', 'R06', 'R08'] },
  capitulos: [
    cap(1, 'el taller en Bahía Blanca', [['E01', 'escena', 'normal'], ['E02', 'resumen', 'normal']], { cierre: { tipo: 'dia_comun', episodio: 'E02', frase_id: '' } }),
    cap(2, 'la valija verde y la pieza de Toni', [['E03', 'escena', 'normal'], ['E04', 'escena', 'normal']], { apertura: { tipo: 'objeto', episodio: 'E03' }, cierre: { tipo: 'frase_suya', episodio: 'E04', frase_id: 'R05' } }),
    cap(3, 'la noche de la guitarra', [['E05', 'escena', 'clave']], { apertura: { tipo: 'fecha', episodio: 'E05' }, golpe: { episodio: 'E05', preparacion: ['E01', 'E03'], frase_id: 'R06' } }),
    cap(4, 'el horno de Salva y los papeles', [['E06', 'escena', 'clave'], ['E07', 'escena', 'normal']], {
      apertura: { tipo: 'persona_entra', episodio: 'E06' }, cierre: { tipo: 'escena', episodio: 'E07', frase_id: '' }, es_ultimo: true,
      imagen_final: { episodio: 'E07', frase_id: 'R08', que: 'los tres en la playa' },
    }),
  ],
  sus_frases: [],
  carta: { titulo: '', titulo_id: '', para: 'quien_era', ids: ['E08'], cierre: { id: 'R10', texto: '' } },
  faltantes: [],
};

const capitulo = (texto: string) => `${texto}\n---\n{"afuera": []}`;

/** Lo que «contesta el modelo» en cada paso, por nombre de llamada (como lo busca ModeloFalso). */
export function salidasRuben(): Record<string, string> {
  return {
    '1-registro': JSON.stringify(REGISTRO),
    '2-plan': JSON.stringify(PLAN),
    dudas: '{"dudas": [{"id": "D01", "pregunta": "¿El cuñado de Toni se llamaba Salva o Salvador?", "opciones": ["Salva", "Salvador"]}]}',
    '3b-capitulo-01': capitulo('Yo era tornero en Bahía Blanca, en el taller de mi viejo, y los viernes tocaba la guitarra en el club. [[R01]]\n\nEn 2002 cerró el taller y con Graciela decidimos irnos a Valencia con Fede, que tenía 9 años. [[R03]]'),
    '3b-capitulo-02': capitulo('Me llevé la valija verde de mi padre, la de la cinta roja en la manija, y la guitarra en la mano porque no entraba. [[R04]]\n\nEn Benimaclet le alquilamos una pieza a Toni, un jubilado, y era una pieza, pero era nuestra. [[R05]]'),
    '3b-capitulo-03': capitulo('En febrero de 2003 me echaron de la obra porque no tenía papeles. [[R06]]\n\nEsa noche vendí la guitarra en una tienda de la calle Sueca y me dieron ochenta euros mientras Fede dormía, porque no teníamos para el alquiler de marzo. [[R06,R09]]'),
    '3b-capitulo-04': capitulo('Toni me dejó el alquiler para más adelante y me consiguió trabajo en el horno de su cuñado Salva. [[R07]]\n\nEn 2005 me dieron los papeles y fuimos los tres a la playa de la Malvarrosa. [[R08]]'),
    '3c-carta': 'No hace falta llenar tanto la valija, porque lo que importa te entra en la mano. [[R10]]',
    '3e-sus-frases': JSON.stringify({ frases: [
      { id: 'R05', texto: 'era una pieza, pero era nuestra' },
      { id: 'R10', texto: 'lo que importa te entra en la mano' },
      { id: 'R06', texto: 'me dieron ochenta euros' },
      { id: 'R07', texto: 'me consiguió trabajo en el horno de su cuñado Salva' },
      { id: 'R08', texto: 'la valija pesaba poco' },
    ] }),
    '4-hechos': '{"problemas": []}',
    '5c-veedor': '{"problemas": []}',
    '4-hechos-repaso': '{"problemas": []}',
    '3t-titulo-01': '{"titulo": "El taller de mi viejo", "por_que": ""}',
    '3t-titulo-02': '{"titulo": "La valija verde", "por_que": ""}',
    '3t-titulo-03': '{"titulo": "La guitarra", "por_que": ""}',
    '3t-titulo-04': '{"titulo": "La playa de la Malvarrosa", "por_que": ""}',
  };
}
export const DEFECTOS_RUBEN: [string, string][] = [
  ['2h-armador-', '## Historia 1 · Lo de este tramo\n- Cuándo: (el del tramo).'],
  ['3r-resumen-', '- Historias contadas: lo de este capítulo.'],
  ['6-arreglo-', '{"cambios": []}'],
  ['7-estilo-', '{"cambios": []}'],
  ['disputa-', '{"respalda": true}'],
];

export function armarHistoria(o: { entrevista?: EntrevistaHistoria; salidas?: Record<string, string> } = {}) {
  const c = carpetaDeHistoria(o.entrevista ?? RUBEN);
  const modelo = new ModeloFalso({ ...salidasRuben(), ...(o.salidas ?? {}) }, DEFECTOS_RUBEN);
  const almacen = new AlmacenMemoria();
  const lineas: string[] = [];
  const x: ContextoHistoria = { c, ej: new Ejecutor({ modelo, almacen }), almacen, log: (s) => lineas.push(s), usarLote: false };
  return { x, c, modelo, almacen, lineas };
}
