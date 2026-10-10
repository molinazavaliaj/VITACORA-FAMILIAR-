import { describe, it, expect } from 'vitest';
import { extraerCodigo } from '../src/flujo/regalo-codigo.js';

describe('extraerCodigo', () => {
  it('lo saca del mensaje que arma el botón Empezar', () => {
    expect(extraerCodigo('Hola, quiero empezar mi libro. VF-7K3M2Q')).toBe('VF-7K3M2Q');
  });
  it('acepta lo que escribe a mano una persona grande', () => {
    expect(extraerCodigo('vf 7k3m2q')).toBe('VF-7K3M2Q');
    expect(extraerCodigo('VF-7K3 M2Q gracias')).toBe('VF-7K3M2Q');
    expect(extraerCodigo('7K3M2Q')).toBe('VF-7K3M2Q');
  });
  it('no inventa códigos en mensajes comunes', () => {
    expect(extraerCodigo('hola')).toBeNull();
    expect(extraerCodigo('Hola, ¿quién es?')).toBeNull();
    expect(extraerCodigo('buenas tardes')).toBeNull();
  });

  // La misma regla que normalizarCodigo de web/src/lib/regalo.ts (son dos servicios).
  describe('igual que la web cuando el mensaje es solo el código', () => {
    it.each([
      ['VF3K2M', 'VF-VF3K2M'], // VF pegado y sin sobrar: es parte del código
      ['VFVF3K2M', 'VF-VF3K2M'], // VF que sobra: es prefijo
      ['VF-7K3M', null], // prefijo y solo 4
      ['vf 7k3m2q', 'VF-7K3M2Q'],
      ['7K3M2Q', 'VF-7K3M2Q'],
      ['VF-7K3M2Q', 'VF-7K3M2Q'],
      [' vf-7k3-m2q ', 'VF-7K3M2Q'],
      ['VF-7K3M2O', null], // la O no está en el alfabeto
    ])('%s da %s', (texto, esperado) => {
      expect(extraerCodigo(texto)).toBe(esperado);
    });
  });

  it('dentro de un mensaje largo aplica la misma regla del VF', () => {
    expect(extraerCodigo('Hola, mi código es VF3K2M')).toBe('VF-VF3K2M');
    expect(extraerCodigo('Hola, mi código es VF7K3M2Q gracias')).toBe('VF-7K3M2Q');
    expect(extraerCodigo('Hola, mi código es VF-7K3M')).toBeNull();
    expect(extraerCodigo('Hola, mi código es VF-7K3M2QX')).toBeNull();
  });

  // Aceptado a propósito: una sola palabra de seis letras del alfabeto se lee
  // como código. Solo pasa con números que no conocemos, y termina en "no
  // encuentro ese código" (ver regalo.test.ts), que para un desconocido está bien.
  it('una palabra sola de seis letras del alfabeto sí se lee como código', () => {
    expect(extraerCodigo('buenas')).toBe('VF-BUENAS');
  });
});
