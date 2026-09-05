// Limpieza del código de 6 dígitos que la familia teclea o pega al entrar.
// La gente pega "123 456" (con el espacio que Gmail mete al copiar) o escribe
// con guiones — todo eso tiene que dar el código pelado antes de verificar.

export function normalizarCodigo(entrada: string): string {
  return entrada.replace(/\D/g, '');
}

export function esCodigoCompleto(entrada: string): boolean {
  return /^\d{6}$/.test(normalizarCodigo(entrada));
}
