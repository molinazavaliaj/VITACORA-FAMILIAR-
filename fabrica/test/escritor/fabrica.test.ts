// fabrica/test/escritor/fabrica.test.ts
import { describe, expect, it } from 'vitest';
import { leerJSON } from '../../src/escritor/carpeta.js';
import { aplicarCorreccion, validarPlanCorregido } from '../../src/escritor/correccion.js';
import { dudasDelRegistro, validarDudas } from '../../src/escritor/dudas.js';
import { respuestas } from '../../src/escritor/lectura.js';
import { llamadaCorreccion, llamadaCorreccionPlan, llamadaDisputa, llamadaDudas } from '../../src/escritor/llamadas/fabrica.js';
import { carpetaNelida } from './ayuda.js';

describe('dudas de datos para la familia', () => {
  const c = carpetaNelida();
  const reg = leerJSON(c, 'salidas/registro.json');

  it('salen del registro, sin las que resolvió la ficha, con lo que dijo textual', () => {
    const conResuelta = { ...reg, dudas: [...reg.dudas, { tipo: 'fecha', que: 'el año del casamiento', ids: ['R02'], resuelta_por_ficha: true }] };
    expect(dudasDelRegistro(conResuelta, respuestas(c))).toEqual([
      { id: 'D01', tipo: 'nombre', que: 'No dice el nombre de la Negra', ids: ['R10'], citas: [{ id: 'R10', texto: 'La Negra era mi amiga del barrio. Nos sentábamos en la vereda a tomar mate.' }] },
    ]);
  });

  it('la llamada lleva la ficha, las dudas, el nombre, el idioma de la familia y el esquema', () => {
    const l = llamadaDudas(c, dudasDelRegistro(reg, respuestas(c)));
    expect(l.nombre).toBe('dudas');
    expect(l.docs[0].startsWith('<ficha>')).toBe(true);
    expect(l.docs[1]).toContain('"D01"');
    expect(l.instr).toContain('la familia de Nélida');
    expect(l.instr).toContain('en castellano rioplatense');
    expect(l.instr).toContain('Esquema de salida');
    const ca = carpetaNelida();
    ca.escribir('entradas/ficha.xml', ca.leer('entradas/ficha.xml').replace('</ficha>', 'Idioma del libro: catalán\n</ficha>'));
    expect(llamadaDudas(ca, []).instr).toContain('en catalán');
  });

  it('validarDudas exige una pregunta por duda', () => {
    const dudas = dudasDelRegistro(reg, respuestas(c));
    expect(validarDudas(dudas, { dudas: [{ id: 'D01', pregunta: ' ¿Cómo se llamaba la Negra? ', opciones: ['', 'Ofelia'] }] })[0]).toMatchObject({ pregunta: '¿Cómo se llamaba la Negra?', opciones: ['Ofelia'] });
    expect(() => validarDudas(dudas, { dudas: [] })).toThrow(/D01/);
  });
});

describe('disputa y corrección del registro', () => {
  it('la disputa lleva los documentos de los hechos tal cual y la pregunta con sus huecos llenos', () => {
    const docs = ['<guia>\ng\n</guia>', '<registro>\nr\n</registro>'];
    const l = llamadaDisputa(docs, { clave: 'cap_1-2', pieza: 'cap_1', n: 2, frase: 'Raúl tenía la mercería', id: 'R02', cita: 'abrimos la mercería con Raúl' });
    expect(l.nombre).toBe('disputa-cap_1-2');
    expect(l.docs).toBe(docs);
    expect(l.instr).toContain('Frase del libro: "Raúl tenía la mercería". Respuesta R02');
  });

  it('la corrección lleva ficha y registro; aplicarCorreccion reemplaza por id, borra y deja lo demás igual', () => {
    const c = carpetaNelida();
    const l = llamadaCorreccion(c);
    expect(l.nombre).toBe('correccion-registro');
    expect(l.docs.map((d) => d.split('\n')[0])).toEqual(['<ficha>', '<registro>']);
    expect(l.instr).toContain('"borrar"');
    const reg = leerJSON(c, 'salidas/registro.json');
    const negra = { ...reg.personas[3], nombre: 'Ofelia Sánchez', apodos: ['la Negra'] };
    const nuevo = aplicarCorreccion(reg, { personas: [negra], linea_de_tiempo: [{ ...reg.linea_de_tiempo[0], cuando: '1949' }], borrar: ['P03'], confirmados: [{ texto: 'La Negra se llamaba Ofelia Sánchez.', usado_en: ['P04'] }] });
    expect(nuevo.personas.map((p: { id: string; nombre: string }) => [p.id, p.nombre])).toEqual([['P01', 'Raúl'], ['P02', 'Marcela'], ['P04', 'Ofelia Sánchez']]);
    expect(nuevo.linea_de_tiempo[0].cuando).toBe('1949');
    expect(nuevo.confirmados).toEqual([{ texto: 'La Negra se llamaba Ofelia Sánchez.', usado_en: ['P04'] }]);
    expect(nuevo.episodios).toEqual(reg.episodios);
    expect(reg.personas[3].nombre).toBe('la Negra');
  });

  it('la corrección del plan lleva ficha, registro y plan; el plan corregido tiene que conservar los capítulos', () => {
    const c = carpetaNelida();
    const l = llamadaCorreccionPlan(c);
    expect(l.nombre).toBe('correccion-plan');
    expect(l.docs.map((d) => d.slice(0, 5))).toEqual(['<fich', '<regi', '<plan']);
    expect(l.instr).toContain('Devolvé el plan ENTERO');
    const plan = leerJSON(c, 'salidas/plan.json');
    expect(validarPlanCorregido(plan, plan)).toBe(plan);
    expect(() => validarPlanCorregido(plan, { ...plan, capitulos: plan.capitulos.slice(1) })).toThrow(/cambió la estructura/);
    expect(() => validarPlanCorregido(plan, {})).toThrow(/no trae capítulos/);
  });

  it('validarPlanCorregido: solo pueden cambiar los textos, no las respuestas, los episodios ni los hilos', () => {
    const plan = leerJSON(carpetaNelida(), 'salidas/plan.json');
    const copia = () => structuredClone(plan);
    const conNombre = copia();
    conNombre.capitulos[0].titulo.texto = 'La persiana de Ofelia Sánchez';
    conNombre.capitulos[0].etapa = 'Echesortu con Ofelia';
    conNombre.capitulos[0].presenta = ['P01', 'P02', 'P09'];
    conNombre.carta.para = 'Marcela y Gustavo Sánchez';
    expect(validarPlanCorregido(plan, conNombre)).toBe(conNombre);
    const hilo = copia();
    hilo.capitulos[0].hilo_ids = ['R02', 'R05'];
    expect(() => validarPlanCorregido(plan, hilo)).toThrow(/capítulo 1/);
    const cruzado = copia();
    [cruzado.capitulos[0].piezas[0], cruzado.capitulos[1].piezas[0]] = [cruzado.capitulos[1].piezas[0], cruzado.capitulos[0].piezas[0]];
    expect(() => validarPlanCorregido(plan, cruzado)).toThrow(/cambió la estructura/);
    const resp = copia();
    resp.capitulos[1].columna.ids = ['R05'];
    expect(() => validarPlanCorregido(plan, resp)).toThrow(/capítulo 2/);
    const piezaDeMas = copia();
    piezaDeMas.capitulos[0].piezas.pop();
    expect(() => validarPlanCorregido(plan, piezaDeMas)).toThrow();
    const afuera = copia();
    afuera.antes_de_cerrar.ids = ['R01'];
    expect(() => validarPlanCorregido(plan, afuera)).toThrow(/fuera de los capítulos/);
  });
});
