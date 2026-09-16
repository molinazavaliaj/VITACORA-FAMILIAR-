// Los números argentinos vienen de dos formas: con el 9 de celular después del
// 54 (+54 9 11 …, como los guarda la web al comprar) y sin él (+54 11 …, como
// Meta a veces los manda en el `from` del webhook, y como a veces los acepta
// en la lista de prueba). Para buscar un narrador se prueban las dos; el
// primer elemento es siempre el número tal cual llegó.
export function variantesDeTelefono(telefono: string): string[] {
  const t = telefono.startsWith('+') ? telefono : `+${telefono}`;
  const con9 = /^\+549(\d{10})$/.exec(t);
  if (con9) return [t, `+54${con9[1]}`];
  const sin9 = /^\+54([1-9]\d{9})$/.exec(t);
  if (sin9) return [t, `+549${sin9[1]}`];
  return [t];
}
