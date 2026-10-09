import { describe, it, expect, vi } from 'vitest';
import { bienvenidaDeRegalo, idiomaDeRegalo, idiomaPorTelefono, textoDeArranque } from '../src/flujo/regalo-arranque.js';
import { ARRANQUE, AVISOS, TEXTOS_REGALO_BOT } from '../src/flujo/regalo-textos.js';

describe('bienvenidaDeRegalo: el BIEN del banco y el pedido de SÍ, en el idioma del regalo', () => {
  it('en catalán', () => {
    const t = bienvenidaDeRegalo('ca', { nombre: 'Joan', genero: 'varon' });
    expect(t.startsWith('Hola, Joan, com estàs?')).toBe(true);
    expect(t.endsWith(`\n\n${ARRANQUE.ca.pedidoSi}`)).toBe(true);
    expect(t).not.toContain('{{');
  });
  it('en castellano de España', () => {
    const t = bienvenidaDeRegalo('es-ES', { nombre: 'Ana', genero: 'mujer' });
    expect(t.startsWith('Hola, Ana, ¿cómo estás?')).toBe(true);
    expect(t.endsWith(`\n\n${ARRANQUE['es-ES'].pedidoSi}`)).toBe(true);
  });
  it('en castellano de Argentina', () => {
    const t = bienvenidaDeRegalo('es-AR', { nombre: 'abuelo', genero: 'varon' });
    expect(t.startsWith('Hola, abuelo, ¿cómo estás?')).toBe(true);
    expect(t).toContain('Una persona que te quiere mucho te regaló');
    expect(t.endsWith(`\n\n${ARRANQUE['es-AR'].pedidoSi}`)).toBe(true);
  });
});

describe('textoDeArranque', () => {
  it('llena {{nombre}}', () => {
    expect(textoDeArranque('ca', 'aceptacion', 'Joan')).toBe("Gràcies, Joan. Ara mateix t'envio la primera pregunta. Sense pressa, i no hi ha respostes incorrectes.");
    expect(textoDeArranque('es-ES', 'noQuiere', 'Ana')).toBe('Sin problema, Ana. Cuando te apetezca me escribes SÍ y empezamos. Aquí estaré.');
    expect(textoDeArranque('es-AR', 'noEntendi', 'abuelo')).toBe(ARRANQUE['es-AR'].noEntendi);
  });
});

describe('idiomaDeRegalo', () => {
  it('el idioma de la ficha, y sin idioma es-AR', () => {
    expect(idiomaDeRegalo({ idioma: 'ca' })).toBe('ca');
    expect(idiomaDeRegalo({ idioma: 'es-ES' })).toBe('es-ES');
    expect(idiomaDeRegalo({})).toBe('es-AR');
    expect(idiomaDeRegalo(undefined)).toBe('es-AR');
  });
  it('un idioma desconocido: es-AR y se avisa por consola', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(idiomaDeRegalo({ idioma: 'fr' })).toBe('es-AR');
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe('idiomaPorTelefono', () => {
  it('+34 es España; cualquier otro, es-AR', () => {
    expect(idiomaPorTelefono('+34600123456')).toBe('es-ES');
    expect(idiomaPorTelefono('+5491155551234')).toBe('es-AR');
    expect(idiomaPorTelefono('+59899123456')).toBe('es-AR');
    expect(idiomaPorTelefono('34600123456')).toBe('es-ES');
  });
});

describe('los avisos', () => {
  it('el es-AR es el aprobado el 07/10, sin cambios', () => {
    expect(AVISOS['es-AR'].noExiste).toBe('No encuentro ese código. Fijate bien en la tarjeta y mandámelo de nuevo, con las letras y los números tal cual.');
    expect(AVISOS['es-AR'].usadoPorOtro).toBe('Ese código ya se usó desde otro teléfono. Avisale a quien te hizo el regalo para que nos escriba.');
    expect(AVISOS['es-AR'].noExiste).toBe(TEXTOS_REGALO_BOT.noExiste);
  });
});
