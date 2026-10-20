import { describe, expect, it } from 'vitest';
import { nombrePropio, quienLoRegala, vinculoConocido } from '../src/flujo/quien-regala.js';
import { bienvenidaDeRegalo } from '../src/flujo/regalo-arranque.js';
import { PLANTILLAS_V3 } from '../src/config.js';
import { revisarVariables } from '../src/variables.js';

// Naza, 20/10: Amelia desconfió de «una persona que te quiere mucho». La bienvenida dice quién la regala.
describe('quién lo regala', () => {
  it('con un vínculo de familia que se reconoce, el vínculo y el nombre', () => {
    expect(quienLoRegala('es-AR', 'NAZA', 'hijo')).toBe('Tu hijo Naza');
    expect(quienLoRegala('es-ES', 'lucía', 'Su nieta')).toBe('Tu nieta Lucía');
    expect(quienLoRegala('ca', 'Naza', 'hijo')).toBe('El teu fill Naza');
    expect(quienLoRegala('ca', 'Marta', 'filla')).toBe('La teva filla Marta');
    expect(quienLoRegala('es-AR', 'Pau', 'nét')).toBe('Tu nieto Pau');
  });

  it('con un vínculo que no se reconoce, solo el nombre; sin nombre, nada', () => {
    expect(quienLoRegala('es-AR', 'Naza', 'amigo de la familia')).toBe('Naza');
    expect(quienLoRegala('es-AR', 'Naza', undefined)).toBe('Naza');
    expect(quienLoRegala('es-AR', '  ', 'hijo')).toBeNull();
    expect(quienLoRegala('es-AR', null, 'hijo')).toBeNull();
  });

  it('el nombre todo en mayúsculas o en minúsculas pasa a nombre propio; uno ya escrito bien no se toca', () => {
    expect(nombrePropio('NAZA')).toBe('Naza');
    expect(nombrePropio('maría josé')).toBe('María José');
    expect(nombrePropio('MacKenzie')).toBe('MacKenzie');
    expect(vinculoConocido('La Hija')?.es).toBe('hija');
  });

  it('el BIEN del regalo nombra a quien regala en vez de «una persona que te quiere mucho»', () => {
    const con = bienvenidaDeRegalo('es-AR', { nombre: 'Ame', genero: 'mujer', quienRegala: 'Tu hijo Naza' });
    expect(con).toContain('Hola, Ame, ¿cómo estás? Tu hijo Naza te regaló un libro con la historia de tu vida');
    expect(con).not.toContain('Una persona que te quiere mucho');
    const ca = bienvenidaDeRegalo('ca', { nombre: 'Imma', genero: 'mujer', quienRegala: 'La teva filla Marta' });
    expect(ca).toContain("La teva filla Marta t'ha regalat un llibre");
    const sin = bienvenidaDeRegalo('es-ES', { nombre: 'Ana', genero: 'mujer' });
    expect(sin).toContain('Una persona que te quiere mucho te ha regalado');
  });

  it('las plantillas nuevas existen en los tres idiomas y se pueden marcar como aprobadas', () => {
    expect(PLANTILLAS_V3['es-AR'].bienvenida_quien.nombre).toBe('bienvenida_v3_quien_vos');
    expect(PLANTILLAS_V3['es-ES'].bienvenida_quien.nombre).toBe('bienvenida_v3_quien_es_es');
    expect(PLANTILLAS_V3.ca.bienvenida_quien.nombre).toBe('bienvenida_v3_quien_ca');
    const env = { WA_PLANTILLAS_V3_LISTAS: 'es-AR:bienvenida_quien,es-ES:bienvenida_quien,ca:bienvenida_quien' };
    const faltas = revisarVariables(env as NodeJS.ProcessEnv).filter((f) => f.variable === 'WA_PLANTILLAS_V3_LISTAS' && f.problema.includes('bienvenida_quien'));
    expect(faltas).toEqual([]);
  });
});
