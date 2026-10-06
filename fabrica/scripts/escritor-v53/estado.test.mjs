// Tests de estado.mjs e informe.mjs (lo que usa el workflow entre pasos). Datos inventados: Nélida, la mercera de la guía.
// Correr: node --test fabrica/scripts/escritor/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { estado } from './estado.mjs';
import { informe } from './informe.mjs';

function carpeta() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'estado-'));
  const w = (f, o) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), typeof o === 'string' ? o : JSON.stringify(o)); };
  w('salidas/plan.json', { capitulos: [{ n: 1 }, { n: 2 }], antes_de_cerrar: { ids: ['R09'] }, faltantes: [{ que: 'la boda no tiene escena', donde: 'capítulo 2' }] });
  w('arreglos/problemas-cap_1.json', [{ n: 1, origen: 'verificador', tipo: 'presente', frase: 'Raúl tiene la mercería' }]);
  w('arreglos/problemas-sus_frases.json', [{ n: 1, origen: 'código C8', tipo: 'boton', frase: 'lo más difícil', que: 'palabras de la pregunta' }]);
  w('controles/c9-cap_1.json', { abiertos: [{ n: 1, estado: 'disputa', id: 'R02', cita: 'tiene la mercería', frase: 'Raúl tiene la mercería' }], identicos: 60 });
  w('controles/repaso.json', { nuevos: [], oscila: [{ pieza: 'cap_1', n: 1, tipo: 'presente', frase: 'Raúl tenía la mercería', ids: ['R02'], material: 'R02 tiene' }], contradice: [] });
  w('controles/piezas-1.json', [{ pieza: 'cap_1', control: 'C2', que: 'cortada', frase: 'y entonces…' }]);
  w('controles/piezas.json', [{ pieza: 'cap_1', control: 'C24', que: 'falta frase de R03: «la nena»', frase: '' }]);
  w('arreglos/disputa-cap_1-1.json', { respalda: false, por_que: 'R02 está en pasado' });
  return dir;
}

test('estado: capítulos, piezas a arreglar (sin sus_frases) y disputas de C9 y C26', () => {
  const dir = carpeta();
  assert.deepEqual(estado(dir, 'capitulos'), { n: [1, 2], antes: true });
  assert.deepEqual(estado(dir, 'arreglos'), { piezas: ['cap_1'], sus_frases: 1 });
  assert.deepEqual(estado(dir, 'disputas').disputas.map((d) => [d.clave, d.id]), [['cap_1-1', 'R02']]);
  assert.deepEqual(estado(dir, 'repaso').disputas.map((d) => [d.clave, d.origen, d.id]), [['repaso-oscila-1', 'oscila', 'R02']]);
});

test('informe: faltantes, antes/después, C24, deriva, disputas y Sus frases', () => {
  const t = informe(carpeta());
  assert.match(t, /la boda no tiene escena/);
  assert.match(t, /\| cap_1 \| 1 \| 0 \|/);
  assert.match(t, /falta frase de R03/);
  assert.match(t, /60 % \(deriva\)/);
  assert.match(t, /no respalda: R02 está en pasado/);
  assert.match(t, /repaso-oscila|C26 oscila/);
  assert.match(t, /Sus frases \(no se arreglan/);
});
