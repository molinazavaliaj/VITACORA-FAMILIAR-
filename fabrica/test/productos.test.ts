import { describe, it, expect } from 'vitest';
import { productosDelPedido } from '../src/libro/productos.js';

describe('productosDelPedido', () => {
  it('pedido viejo sin clave pdf = pdf + audiolibro real', () => {
    expect(productosDelPedido({ impreso: null, marcos: 0 })).toEqual({ pdf: true, audiolibro: 'real', impreso: null, copias: 0, marcos: 0 });
  });

  it('clonada se lee tal cual', () => {
    expect(productosDelPedido({ pdf: true, audiolibro: 'clonada', impreso: 'bn', copias: 2, marcos: 1 }).audiolibro).toBe('clonada');
  });

  it('un valor raro de audiolibro es null', () => {
    expect(productosDelPedido({ pdf: false, audiolibro: 'lo que sea' }).audiolibro).toBeNull();
  });
});
