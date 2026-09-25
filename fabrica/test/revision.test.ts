import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hayQueRevisar, mailDeRevision, dejarEnRevision, lineaDelLector, RUTA_REVISION, type InformeRevision } from '../src/libro/revision.js';

const { avisarSociosMock } = vi.hoisted(() => ({ avisarSociosMock: vi.fn().mockResolvedValue(true) }));
vi.mock('../src/mail/socios.js', () => ({ avisarSocios: avisarSociosMock }));

beforeEach(() => {
  avisarSociosMock.mockClear();
});

const base: InformeRevision = { narrador: 'Élida', lector: [], control: [], lectorFallo: false, fecha: '2026-09-24' };

describe('hayQueRevisar', () => {
  it('sin avisos y con el lector sano, no; con un aviso de cualquiera, sí; si el lector no pudo leer, sí', () => {
    expect(hayQueRevisar(base)).toBe(false);
    expect(hayQueRevisar({ ...base, control: ['repite'] })).toBe(true);
    expect(hayQueRevisar({ ...base, lector: [{ capitulo: 'A', frase: 'x', problema: 'inventado', evidencia: 'no está en ningún audio' }] })).toBe(true);
    expect(hayQueRevisar({ ...base, lectorFallo: true })).toBe(true);
  });
});

describe('mailDeRevision', () => {
  it('va a los dueños con el detalle: capítulo, frase, problema, evidencia, y el id del pedido', () => {
    const m = mailDeRevision(
      { ...base, lector: [{ capitulo: 'Tucumán', frase: 'muñecos en el balcón', problema: 'fundido', evidencia: 'dia_03 / dia_27' }], control: ['El libro repite: 4 %'] },
      'ped-1'
    );
    expect(m.asunto).toContain('Élida');
    expect(m.asunto).toMatch(/revis/i);
    for (const x of ['Tucumán', 'muñecos en el balcón', 'fundido', 'dia_03', 'El libro repite', 'ped-1']) expect(m.html).toContain(x);
    expect(m.html).toMatch(/espera/i);
  });

  it('escapa lo que viene de afuera: capítulo, frase, problema, evidencia, narrador y el id del pedido', () => {
    const m = mailDeRevision(
      { ...base, narrador: '<b>Élida</b>', lector: [{ capitulo: '<i>Tucumán</i>', frase: '<script>x</script>', problema: 'otro', evidencia: '<img>' }] },
      '<script>ped</script>'
    );
    expect(m.html).not.toContain('<script>x</script>');
    expect(m.html).not.toContain('<img>');
    expect(m.html).not.toContain('<i>Tucumán</i>');
    expect(m.html).not.toContain('<script>ped</script>');
  });

  it('cuando el lector no pudo leer, avisa que hay que revisar a mano', () => {
    const m = mailDeRevision({ ...base, lectorFallo: true }, 'ped-2');
    expect(m.html).toMatch(/no pudo leerlo/i);
    expect(m.html).toContain('no devolvió una lista');
  });

  it('si se sabe por qué falló el lector, el mail lo dice', () => {
    const m = mailDeRevision({ ...base, lectorFallo: true, lectorMotivo: 'cortada por el tope de tokens' }, 'ped-3');
    expect(m.html).toContain('no pudo leerlo (cortada por el tope de tokens)');
    expect(m.html).not.toContain('no devolvió una lista');
  });
});

describe('lineaDelLector', () => {
  it('sin avisos, con avisos, y cuando falló (con y sin motivo)', () => {
    expect(lineaDelLector(base)).toBe('sin avisos');
    expect(lineaDelLector({ ...base, lector: [{ capitulo: 'A', frase: 'B', problema: 'inventado', evidencia: '' }] })).toBe('1 aviso(s)');
    expect(lineaDelLector({ ...base, lectorFallo: true })).toBe('⚠ no devolvió una lista: revisar a mano');
    expect(lineaDelLector({ ...base, lectorFallo: true, lectorMotivo: 'cortada por el tope de tokens' })).toBe('⚠ el lector final falló: cortada por el tope de tokens');
  });
});

describe('dejarEnRevision', () => {
  function armarDbFalsa(opciones: { pedidosUpdate?: ReturnType<typeof vi.fn>; upload?: ReturnType<typeof vi.fn> } = {}) {
    const pedidosUpdate = opciones.pedidosUpdate ?? vi.fn().mockResolvedValue({ data: null, error: null });
    const upload = opciones.upload ?? vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null });
    const from = vi.fn((tabla: string) => {
      if (tabla !== 'pedidos') throw new Error(`tabla inesperada: ${tabla}`);
      return {
        update: (valores: Record<string, unknown>) => ({
          eq: (_col: string, id: string) => pedidosUpdate(valores, id),
        }),
      };
    });
    const storage = { from: vi.fn(() => ({ upload })) };
    return { db: { from, storage } as unknown as import('@supabase/supabase-js').SupabaseClient, pedidosUpdate, upload };
  }

  it('sube revision.json, deja el pedido en revisión y manda el mail a los socios', async () => {
    const { db, pedidosUpdate, upload } = armarDbFalsa();
    const informe: InformeRevision = { ...base, control: ['El libro repite: 4 %'] };

    await dejarEnRevision(db, 'ped-1', 'narrador-1', informe);

    expect(upload).toHaveBeenCalledTimes(1);
    const [ruta, contenido, opcionesSubida] = upload.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(ruta).toBe(RUTA_REVISION('narrador-1'));
    expect(ruta).toBe('narrador-1/paquete/revision.json');
    expect(JSON.parse(contenido)).toEqual(informe);
    expect(opcionesSubida.contentType).toBe('application/json');

    expect(pedidosUpdate).toHaveBeenCalledWith({ estado: 'revision' }, 'ped-1');

    expect(avisarSociosMock).toHaveBeenCalledTimes(1);
    const [asunto, html] = avisarSociosMock.mock.calls[0] as [string, string];
    expect(asunto).toContain('Élida');
    expect(html).toContain('El libro repite');
  });

  it('si falla el update del pedido, tira y no manda el mail (el pedido no quedó realmente frenado)', async () => {
    const pedidosUpdate = vi.fn().mockResolvedValue({ data: null, error: { message: 'columna revision no existe' } });
    const { db } = armarDbFalsa({ pedidosUpdate });

    await expect(dejarEnRevision(db, 'ped-1', 'narrador-1', base)).rejects.toThrow('ped-1');
    expect(avisarSociosMock).not.toHaveBeenCalled();
  });
});
