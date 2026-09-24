import { describe, it, expect } from 'vitest';
import { GUION, tope, arbolDe, paisDe, eventosDe, armarGuion, firmaGuion } from '../src/ia/guion-v2.js';
import { perfilVacio, aplicarCambios, type Perfil } from '../src/ia/perfil.js';
import { slug } from '../src/manual/puro.js';

const ANIO = 2026;
const dicho = (valor: string) => ({ valor, fuente: 'dicho' as const });
const persona = (nombre: string, vinculo: string, vive: 'si' | 'no' | 'no se sabe' = 'si') => ({ nombre, vinculo, vive, fuente: 'dicho' as const });

/** Naza: 27, hombre, dos hermanos, de novio, sin hijos, Martínez → Berga. */
function naza(): Perfil {
  const p = perfilVacio();
  p.persona.edad = dicho('27'); p.persona.genero = dicho('hombre');
  p.personas.push(persona('Ariel', 'hermano mayor'), persona('Juan Manuel', 'hermano del medio'), persona('Ima', 'pareja actual'), persona('Meri', 'madre'), persona('Juan Domingo', 'padre'));
  p.etapas.push({ edades: '0 a 22', lugar: 'Martínez, provincia de Buenos Aires', conQuien: 'sus padres', queHacia: 'colegio', fuente: 'dicho' }, { edades: 'desde los 23', lugar: 'Berga, Barcelona, España', conQuien: 'Fran y Ñaco', queHacia: 'música', fuente: 'dicho' });
  return p;
}
/** Élida: 76, mujer, viuda, dos hijos, tres nietos, una hermana, Tucumán → Lanús. */
function elida(): Perfil {
  const p = perfilVacio();
  p.persona.edad = dicho('76'); p.persona.genero = dicho('mujer');
  p.personas.push(persona('Rubén', 'marido', 'no'), persona('Marta', 'hija'), persona('Jorge', 'hijo'), persona('Sofía', 'nieta'), persona('Tomás', 'nieto'), persona('Lucas', 'nieto'), persona('Nélida', 'hermana'), persona('Rosa', 'madre', 'no'), persona('Juan', 'padre', 'no'));
  p.etapas.push({ edades: '0 a 18', lugar: 'Tucumán', conQuien: 'los abuelos', queHacia: 'campo', fuente: 'dicho' }, { edades: 'desde los 19', lugar: 'Lanús, Buenos Aires', conQuien: 'Rubén', queHacia: 'costurera', fuente: 'dicho' });
  return p;
}
const ids = (p: Perfil) => armarGuion(p, ANIO).filas.map((f) => f.id);
const preguntas = (p: Perfil) => armarGuion(p, ANIO).filas.filter((f) => f.id !== 'presentacion').length;

describe('GUION (las filas del guion aprobado, §3)', () => {
  it('tiene los ids del guion, en orden de etapa, con inicio y reflexión inamovibles', () => {
    const l = GUION.map((f) => f.id);
    expect(l.slice(0, 5)).toEqual(['presentacion', 'casa-infancia', 'los-tuyos-hoy', 'mapa-casas', 'mapa-capitulos']);
    expect(l.slice(-6)).toEqual(['pruebas', 'fuerza', 'alegrias', 'lo-que-falta', 'mensaje', 'cinco-minutos']);
    for (const id of ['padres-como-eran', 'hermano', 'abuelos-y-raices', 'la-cuadra-y-los-juegos', 'la-escuela', 'a-los-quince', 'estudios', 'primer-trabajo', 'primer-amor', 'oficio', 'pareja-como-llego', 'hijos-llegada', 'hijo', 'un-lugar-que-cambio-algo', 'amigos-de-siempre', 'el-trabajo-y-la-plata', 'los-hijos-creciendo', 'la-pareja-con-los-anos', 'los-padres-de-grande', 'por-gusto', 'dejar-el-trabajo', 'nietos', 'perdidas', 'un-dia-de-hoy', 'los-tuyos-hoy-como-estan', 'lo-que-te-queda-por-hacer', 'lo-que-esperas-para-los-tuyos']) expect(l).toContain(id);
    expect(GUION.filter((f) => f.inamovible).map((f) => f.etapa)).toEqual(expect.arrayContaining(['inicio', 'reflexion']));
  });
  it('ningún tema supone pareja, hijos ni nietos como hecho, ni habla en masculino', () => {
    for (const f of GUION) {
      expect(f.tema).not.toMatch(/\bsu (esposa|marido)\b/i);
      expect(f.tema).not.toMatch(/\b(él|ella)\b/);
    }
  });
});

describe('tope', () => {
  it('40, y 44 desde los 56', () => { expect(tope(27)).toBe(40); expect(tope(55)).toBe(40); expect(tope(56)).toBe(44); expect(tope(null)).toBe(40); });
});

describe('arbolDe', () => {
  it('lee hermanos, hijos, pareja, nietos, padres y pérdidas de los vínculos; y noTuvo', () => {
    const a = arbolDe(aplicarCambios(elida(), { noTuvo: ['hermanos'] }));
    expect(a.hijos).toEqual(['Marta', 'Jorge']);
    expect(a.nietos).toHaveLength(3);
    expect(a.pareja).toEqual(['Rubén']);
    expect(a.hermanos).toEqual(['Nélida']);
    expect(a.padres.map((x) => x.vive)).toEqual(['no', 'no']);
    expect(a.perdidas).toEqual(expect.arrayContaining(['Rubén']));
    expect(a.noTuvo).toEqual(['hermanos']);
  });
  it('"hijo de un amigo" no es un hijo', () => {
    const p = perfilVacio(); p.personas.push(persona('Tomi', 'hijo de un amigo'));
    expect(arbolDe(p).hijos).toEqual([]);
  });
});

describe('paisDe y eventosDe (la historia grande, §4)', () => {
  it('reconoce Argentina y España por la ciudad o el país', () => {
    expect(paisDe('Martínez, provincia de Buenos Aires')).toBe('AR');
    expect(paisDe('Berga, Barcelona, España')).toBe('ES');
    expect(paisDe('Montevideo')).toBeNull();
  });
  it('Naza (1999, Argentina hasta los 22): la pandemia a los 21, en juventud; el 2001 no (tenía 2)', () => {
    const e = eventosDe(naza(), ANIO);
    expect(e.map((x) => x.id)).toEqual(['pandemia']);
    expect(e[0]).toMatchObject({ tramo: 'juventud', edad: 21 });
  });
  it('Élida (1950, Argentina): la dictadura (26) y el 2001 (51); la pandemia queda afuera por el máximo de dos', () => {
    const e = eventosDe(elida(), ANIO);
    expect(e.map((x) => x.id)).toEqual(['dictadura', 'crisis-2001']);
    expect(e[0].tramo).toBe('adulto joven');
    expect(e[1].tramo).toBe('adultez media');
  });
  it('sin edad no hay eventos', () => { expect(eventosDe(perfilVacio(), ANIO)).toEqual([]); });
});

describe('armarGuion', () => {
  it('Naza: 30 preguntas (el guion §5 dice 29 porque no contó la pandemia), un hermano por hermano, la pareja resuelta, sin hijos, sin adultez media', () => {
    const { filas, caidas } = armarGuion(naza(), ANIO);
    expect(preguntas(naza())).toBe(30);
    const l = filas.map((f) => f.id);
    expect(l).toContain(`hermano-${slug('Ariel')}`); expect(l).toContain(`hermano-${slug('Juan Manuel')}`);
    expect(l).toContain('pareja-como-llego'); expect(l).not.toContain('hijos-llegada'); expect(l).not.toContain('el-trabajo-y-la-plata');
    expect(l).toContain('historia-grande-pandemia');
    expect(l.indexOf('por-gusto')).toBeLessThan(l.indexOf('un-dia-de-hoy'));
    expect(l.slice(-6)).toEqual(['pruebas', 'fuerza', 'alegrias', 'lo-que-falta', 'mensaje', 'cinco-minutos']);
    expect(caidas.map((c) => c.id)).toEqual(expect.arrayContaining(['hijos-llegada', 'nietos', 'dejar-el-trabajo']));
  });
  it('Élida: 40 preguntas justas, con dos hijos, la pérdida de Rubén, los padres de grande y los nietos', () => {
    expect(preguntas(elida())).toBe(40);
    const l = ids(elida());
    expect(l).toEqual(expect.arrayContaining([`hijo-${slug('Marta')}`, `hijo-${slug('Jorge')}`, 'perdidas', 'los-padres-de-grande', 'nietos', 'la-pareja-con-los-anos', 'dejar-el-trabajo', 'historia-grande-dictadura', 'historia-grande-crisis-2001']));
    expect(l).not.toContain('hermanos-todos');
  });
  it('si no se sabe si hubo hermanos, la fila se vuelve puerta; si dijo que no tuvo, se cae con motivo y los hijos tienen su variante', () => {
    const sin = perfilVacio(); sin.persona.edad = dicho('40');
    const puerta = armarGuion(sin, ANIO).filas.find((f) => f.id === 'hermanos-puerta');
    expect(puerta?.tema).toMatch(/únic/i);
    const no = aplicarCambios(sin, { noTuvo: ['hermanos', 'hijos'] });
    const g = armarGuion(no, ANIO);
    expect(g.filas.some((f) => f.id.startsWith('hermano'))).toBe(false);
    expect(g.caidas).toEqual(expect.arrayContaining([{ id: 'hermano', motivo: 'dijo que no tuvo hermanos' }]));
    expect(g.filas.find((f) => f.id === 'quienes-fueron-tu-familia')).toBeDefined();
  });
  it('cuatro hermanos: uno "de todos" y uno por el primero', () => {
    const p = naza(); p.personas.push(persona('Pedro', 'hermano'), persona('Pablo', 'hermano'));
    const l = ids(p);
    expect(l).toContain('hermanos-todos'); expect(l).toContain(`hermano-${slug('Ariel')}`); expect(l).not.toContain(`hermano-${slug('Pablo')}`);
  });
  it('la vida más llena posible (82, tres hermanos, tres hijos, pareja, nietos, pérdidas, dos eventos) se queda cerca del techo de 44 y no lo pasa', () => {
    // Contado a mano contra el guion (40 filas fijas sin presentación: 35 siempre/condicionales +
    // hermano + hijo + 3 historia-grande): el máximo natural es 35 + 3 hermanos + 3 hijos (el tope
    // de la expansión "uno por uno", guion §3) + 2 historia-grande (máximo del libro, §4) = 43, no
    // 44: el techo de 44 es una cota (para cuando el guion crezca), no algo que esta persona
    // alcance hoy. Desvío del brief anotado en el reporte de la tarea 4.
    const p = elida(); p.persona.edad = dicho('82');
    p.personas.push(persona('Ana', 'hija'), persona('Pedro', 'hermano'), persona('Elsa', 'hermana'));
    const { filas, caidas } = armarGuion(p, ANIO);
    expect(filas.filter((f) => f.id !== 'presentacion').length).toBe(43);
    expect(caidas.some((c) => /techo/.test(c.motivo))).toBe(false);
    expect(filas.map((f) => f.id)).toEqual(expect.arrayContaining(['cinco-minutos', 'lo-que-te-queda-por-hacer', 'un-dia-de-hoy', `hijo-${slug('Ana')}`, `hermano-${slug('Elsa')}`]));
  });
  it('cada fila lleva tramo y bloque para la fábrica: futuro y reflexión sin tramo, oficio en adulto joven', () => {
    const f = armarGuion(naza(), ANIO).filas;
    expect(f.find((x) => x.id === 'oficio')).toMatchObject({ tramo: 'adulto joven', bloque: 'adulto joven' });
    expect(f.find((x) => x.id === 'lo-que-te-queda-por-hacer')).toMatchObject({ tramo: null, bloque: 'futuro' });
    expect(f.find((x) => x.id === 'mensaje')).toMatchObject({ tramo: null, bloque: 'reflexion' });
    expect(f.find((x) => x.id === 'presentacion')).toMatchObject({ bloque: 'presentacion' });
  });
  it('la firma cambia cuando cambia la edad o el árbol, no cuando cambia una bisagra', () => {
    const p = naza();
    const a = firmaGuion(p, ANIO);
    expect(firmaGuion(aplicarCambios(p, { agregarBisagras: ['A los 20 dejó la facultad'] }), ANIO)).toBe(a);
    expect(firmaGuion(aplicarCambios(p, { agregarPersonas: [persona('Lola', 'hija')] }), ANIO)).not.toBe(a);
  });
});
