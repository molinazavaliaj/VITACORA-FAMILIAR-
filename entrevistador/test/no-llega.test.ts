import { describe, it, expect, vi } from 'vitest';
import { crearBaseFalsa } from './v3/base-falsa.js';
vi.mock('../src/db/cliente.js', () => ({ db: {} }));
import { avisarFamiliaNoLlega, NO_LLEGA, semanaIso } from '../src/mail/no-llega.js';

// Cuando Meta no le puede entregar al abuelo y lo destraba la familia (130472:
// número «en experimento», que escriba él; 131026: sin WhatsApp, versión vieja o
// nos bloqueó), le llega un mail a quien compró. Textos aprobados por Naza (11/10).

function armar(o: { region?: string; contexto?: Record<string, unknown>; marca?: 'nueva' | 'ya' | 'no-se'; mailOk?: boolean } = {}) {
  const base = crearBaseFalsa({
    familias: [{ id: 'f1', email: 'lucia@ejemplo.com', region: o.region ?? 'AR' }],
    narradores: [{ id: 'n1', familia_id: 'f1', como_le_dicen: 'Babu', contexto: o.contexto ?? { vinculoComprador: 'nieto' } }],
  });
  const mails: { familiaId: string; asunto: string; cuerpo: string; narradorId: string; boton?: boolean }[] = [];
  const marcas: [string, string][] = [];
  const deps = {
    db: base.cliente,
    mandarMailFamilia: async (familiaId: string, asunto: string, cuerpo: string, narradorId: string, op?: { boton?: boolean }) => {
      mails.push({ familiaId, asunto, cuerpo, narradorId, boton: op?.boton });
      return o.mailOk ?? true;
    },
    marca: async (periodo: string, clave: string) => { marcas.push([periodo, clave]); return o.marca ?? 'nueva'; },
    ahora: new Date('2026-10-11T13:00:00Z'),
  };
  return { deps, mails, marcas };
}

describe('textos aprobados (11/10)', () => {
  it('de vos', () => {
    expect(NO_LLEGA.vos.asunto('Babu')).toBe('A Babu no le están llegando los mensajes');
    expect(NO_LLEGA.vos.cuerpo(130472, 'Babu')).toBe('Le mandamos un mensaje a Babu por WhatsApp y no le llegó. Pasa con algunos números y se arregla fácil. Pedile que nos mande un mensaje cualquiera, con un hola alcanza, y le llega enseguida.');
    expect(NO_LLEGA.vos.cuerpo(131026, 'Babu')).toBe('Le mandamos un mensaje a Babu por WhatsApp y no le llegó. Puede ser que ese número no tenga WhatsApp, que tenga una versión vieja o que nos haya bloqueado sin querer. ¿Te fijás con Babu? Si el número está mal, escribinos a hola@vitacorafamiliar.com y lo cambiamos.');
  });
  it('de tú', () => {
    expect(NO_LLEGA.tu.asunto('Babu')).toBe('A Babu no le están llegando los mensajes');
    expect(NO_LLEGA.tu.cuerpo(130472, 'Babu')).toBe('Le hemos enviado un mensaje a Babu por WhatsApp y no le ha llegado. Pasa con algunos números y se arregla fácil. Pídele que nos envíe un mensaje cualquiera, con un hola basta, y le llega enseguida.');
    expect(NO_LLEGA.tu.cuerpo(131026, 'Babu')).toBe('Le hemos enviado un mensaje a Babu por WhatsApp y no le ha llegado. Puede ser que ese número no tenga WhatsApp, que tenga una versión antigua o que nos haya bloqueado sin querer. ¿Lo miras con Babu? Si el número está mal, escríbenos a hola@vitacorafamiliar.com y lo cambiamos.');
  });
});

describe('avisarFamiliaNoLlega', () => {
  it('130472: le manda a la familia el mail de «que nos escriba», sin botón', async () => {
    const { deps, mails } = armar();
    expect(await avisarFamiliaNoLlega(deps, 'n1', 130472)).toBe(true);
    expect(mails).toEqual([{ familiaId: 'f1', asunto: NO_LLEGA.vos.asunto('Babu'), cuerpo: NO_LLEGA.vos.cuerpo(130472, 'Babu'), narradorId: 'n1', boton: false }]);
  });
  it('131026: el de «fijate el número», y de tú si compró desde España', async () => {
    const { deps, mails } = armar({ region: 'ES' });
    await avisarFamiliaNoLlega(deps, 'n1', 131026);
    expect(mails[0].cuerpo).toBe(NO_LLEGA.tu.cuerpo(131026, 'Babu'));
  });
  it('otros códigos (131047, 131049…) no le escriben a la familia', async () => {
    const { deps, mails } = armar();
    for (const c of [131047, 131049, 0]) expect(await avisarFamiliaNoLlega(deps, 'n1', c)).toBe(false);
    expect(mails).toEqual([]);
  });
  it('una vez por semana: la marca va por narrador y semana', async () => {
    const { deps, mails, marcas } = armar({ marca: 'ya' });
    expect(await avisarFamiliaNoLlega(deps, 'n1', 130472)).toBe(false);
    expect(mails).toEqual([]);
    expect(marcas).toEqual([['semana-2026-W41', 'familia-no-llega:n1']]);
  });
  it('«La mía» (compró su propio libro): no se le escribe «pedile que nos escriba»', async () => {
    const { deps, mails } = armar({ contexto: { vinculoComprador: 'yo mismo' } });
    expect(await avisarFamiliaNoLlega(deps, 'n1', 130472)).toBe(false);
    expect(mails).toEqual([]);
  });
  it('un narrador que no existe: nada, sin tirar', async () => {
    const { deps, mails } = armar();
    expect(await avisarFamiliaNoLlega(deps, 'otro', 130472)).toBe(false);
    expect(mails).toEqual([]);
  });
});

describe('semanaIso', () => {
  it('la semana ISO (lunes a domingo)', () => {
    expect(semanaIso(new Date('2026-10-11T13:00:00Z'))).toBe('2026-W41'); // domingo
    expect(semanaIso(new Date('2026-10-12T13:00:00Z'))).toBe('2026-W42'); // lunes
    expect(semanaIso(new Date('2027-01-01T13:00:00Z'))).toBe('2026-W53');
  });
});
