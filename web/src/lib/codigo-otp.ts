// Limpieza del código de 6 dígitos que la familia teclea o pega al entrar.
// La gente pega "123 456" (con el espacio que Gmail mete al copiar) o escribe
// con guiones — todo eso tiene que dar el código pelado antes de verificar.

export function normalizarCodigo(entrada: string): string {
  return entrada.replace(/\D/g, '');
}

// 6 a 10 dígitos: el largo del OTP de Supabase es configurable y un cambio
// de config no puede dejar el botón de entrar muerto (pasó el 2026-09-05
// con códigos de 8 cuando la pantalla exigía exactamente 6).
export function esCodigoCompleto(entrada: string): boolean {
  return /^\d{6,10}$/.test(normalizarCodigo(entrada));
}
