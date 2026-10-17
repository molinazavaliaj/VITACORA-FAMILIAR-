import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { correr } from '../src/kids-v2/corrida.js';
import { chicaDeLaLectura, corridaDeLaLectura, DESDE_LECTURA, FICHA_LECTURA, lecturaCorrida } from '../src/kids-v2/lectura.js';

const md = lecturaCorrida();
const corrida = corridaDeLaLectura();

describe('kids v2: lectura corrida (una chica inventada)', () => {
  it('es la chica pedida: Tini, canal A, se lo regalan sus abuelos, sin el tema papá, dos preguntas de la mamá', () => {
    expect(FICHA_LECTURA).toMatchObject({ apodo: 'Tini', genero: 'chica', canal: 'A', quienRegala: 'Tus abuelos', temasSacados: ['papa'] });
    expect(FICHA_LECTURA.preguntasPadre.map((p) => p.conLinea)).toEqual([true, false]);
  });

  it('llega al final', () => {
    expect(corrida.estado.fase).toEqual({ tipo: 'terminado' });
  });

  it('no queda ninguna marca sin llenar y habla en femenino', () => {
    expect(md).not.toContain('{{');
    expect(md).toContain('Empezamos por cuando eras más chica.');
  });

  it('aparece todo lo que tiene que aparecer', () => {
    for (const id of [
      'BIEN-CHICO-PL', 'AVISO-PADRE', 'ENTRADA-1', 'ENTRADA-2', 'ENTRADA-3', 'ENTRADA-4', 'ENTRADA-5',
      'K2-OP', 'B-FOTO-NOTENGO', 'B-PASO', 'K12-R2', 'K12-R2-2', 'K13-R1', 'B-NO-PASA-NADA', 'K11-FOTO',
      'PREG-NUEVA-CHICO', 'RECORD-A-4', 'K20-R1', 'B-UNA-MAS', 'CIERRE-1', 'CIERRE-2', 'CIERRE-3', 'CIERRE-4',
      'B-AVISO-SERIA', 'K39', 'B-DIAFEO-ACUSE-1', 'B-TRANQUILA', 'B-MAÑANA', 'PADRE-PREG-LINEA', 'PADRE-1', 'PADRE-2',
      'CIERRE-FINAL', 'EXTRAS-OFERTA', 'EXTRAS-SI', 'EXTRAS-OTRA', 'FINAL-CHICO-PL', 'TERMINO-PADRE',
    ]) {
      expect(md, id).toContain(`\`${id}\``);
    }
    expect(md).not.toContain('`K11`'); // la mamá sacó el tema papá
    expect(md).toContain('Marca para Naza en el panel: preocupante');
  });

  it('la pregunta del padre sin línea llega sola; el aviso de la seria sale dos veces (dijo "mañana mejor")', () => {
    // La mamá dijo que la primera la manda ella (arreglo 2, 05/10): "te la manda tu mamá", no "tus abuelos".
    expect(md.match(/`PADRE-PREG-LINEA`/g)).toHaveLength(1);
    expect(md).not.toContain('`PADRE-PREG-LINEA-PL`');
    expect(md).toContain('Esta pregunta te la manda tu mamá, con sus palabras.');
    expect(md.match(/`B-AVISO-SERIA`/g)).toHaveLength(2);
  });

  it('un encabezado por día, con las fechas en orden', () => {
    const dias = md.split('\n').filter((l) => l.startsWith('## '));
    expect(dias.length).toBeGreaterThan(25);
    expect(dias[0]).toBe('## martes 6/10');
  });
});

describe('kids v2: lectura corrida, el doc y la corrida', () => {
  it('el md commiteado es exactamente lo que genera el motor hoy', () => {
    const ruta = fileURLToPath(new URL('../../docs/kids/v2/lectura-corrida.md', import.meta.url));
    const enDisco = readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n');
    expect(enDisco === md, 'docs/kids/v2/lectura-corrida.md quedó viejo: correr `npx tsx scripts/kids-v2-lectura.ts` desde fabrica/').toBe(true);
  });

  it('el encabezado le habla a Naza: "Se lo regalan sus abuelos"', () => {
    expect(md).toContain('Se lo regalan sus abuelos.');
    expect(FICHA_LECTURA.quienRegala).toBe('Tus abuelos');
  });

  it('si llega al tope de pasos, tira error en vez de cortar callada', () => {
    expect(() => correr(FICHA_LECTURA, chicaDeLaLectura(), { desde: DESDE_LECTURA, dias: 90, maxPasos: 5 })).toThrow(/tope de 5 pasos/);
  });
});
