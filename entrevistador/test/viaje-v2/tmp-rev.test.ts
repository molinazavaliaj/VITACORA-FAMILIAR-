import { describe, expect, it } from 'vitest';
import { crearBaseFalsa } from '../v3/base-falsa.js';
import { depsViajeDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/viaje-v2/filas.js';
import { estadoInicial, type EstadoBotViaje } from '../../src/viaje-v2/tipos.js';
import { procesarEntranteViajeV2 } from '../../src/viaje-v2/entrante.js';
import type { Compra } from '../../src/viaje-v2/nucleo/tipos.js';
const COMPRA: Compra = { nombre: 'Olga', salida: '2026-11-10', vuelta: '2026-11-16', zonaCasa: 'America/Argentina/Buenos_Aires', zonaViaje: 'Europe/Madrid', horaNoche: '21:30', preguntasPropias: [], formato: 'pdf', fotosAlbum: 20 };
const AHORA = new Date('2026-11-01T13:00:00Z');
async function prep() {
  const n = { id: 'n1', estado: 'invitado', telefono_whatsapp: '+54911', como_le_dicen: 'Olga', contexto: { modo: 'viaje' } };
  const base = crearBaseFalsa({ narradores: [n], viajes_v2: [], respuestas: [], envios: [], fotos: [] });
  await crearFila(base.cliente, { narrador_id: 'n1', idioma: 'es-AR', compra: COMPRA, estado: { ...estadoInicial(), bienvenida: { en: AHORA.toISOString(), por: 'plantilla' } } });
  const p = depsViajeDePrueba(base, { ahora: AHORA });
  const entra = (m: any) => procesarEntranteViajeV2(p.deps, base.tablas.narradores[0] as never, { telefono: '+54911', tipo: 'texto', ...m });
  return { base, p, entra };
}
describe('rev', () => {
  it('12 fotos a la vez', async () => {
    const { base, p, entra } = await prep();
    await entra({ waMessageId: 'si', texto: 'Sí' });
    const res = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => entra({ waMessageId: `f${i}`, tipo: 'imagen', mediaId: `m${i}`, mimeType: 'image/jpeg', sha256: `h${i}` })));
    console.log(res.map((r) => r.status).join(','), res.filter((r) => r.status === 'rejected').map((r: any) => r.reason.message.slice(0, 80)));
    const f = (await leerFila<Compra, EstadoBotViaje>(base.cliente, 'n1'))!;
    console.log('grupo entradas', f.estado.plan?.grupo?.entradas.length, 'album', f.estado.plan?.album?.ids.length, 'resp', base.tablas.respuestas.length, 'sin clave', base.tablas.respuestas.filter((r: any) => !r.clave_viaje).length);
  });
});
