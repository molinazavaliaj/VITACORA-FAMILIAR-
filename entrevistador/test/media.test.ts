import { describe, it, expect } from 'vitest';
import { pathDeAudio } from '../src/whatsapp/media.js';

describe('pathDeAudio', () => {
  it('arma el path con orden a dos dígitos', () => {
    expect(pathDeAudio('abc-123', 4, [])).toBe('abc-123/dia_04.ogg');
  });
  it('agrega sufijo si ya hay audios ese día', () => {
    expect(pathDeAudio('abc-123', 4, ['abc-123/dia_04.ogg'])).toBe('abc-123/dia_04_2.ogg');
    expect(pathDeAudio('abc-123', 4, ['abc-123/dia_04.ogg', 'abc-123/dia_04_2.ogg'])).toBe('abc-123/dia_04_3.ogg');
  });
});
