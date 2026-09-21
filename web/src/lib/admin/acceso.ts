// Quién entra al panel de la empresa (docs/superpowers/specs/
// 2026-09-21-panel-de-la-empresa-design.md §2): sólo los mails de la variable
// `ADMIN_EMAILS`, del lado del servidor. No hay links a /admin en ningún lado y
// sin la variable cargada no entra nadie (falla cerrado, no abierto).

export function mailsDeAdmin(variable: string | undefined): string[] {
  return (variable ?? "")
    .split(",")
    .map((mail) => mail.trim().toLowerCase())
    .filter(Boolean);
}

export function esAdmin(email: string | null | undefined, permitidos: string[]): boolean {
  const mio = (email ?? "").trim().toLowerCase();
  return mio.length > 0 && permitidos.includes(mio);
}

/** Lo que ve el que no está en la lista. No dice CUÁLES mails están habilitados. */
export function sinPermiso(permitidos: string[]): string {
  return permitidos.length === 0
    ? "El panel todavía no tiene quién pueda entrar: falta cargar ADMIN_EMAILS."
    : `Esta dirección no entra al panel de la empresa (están habilitadas ${permitidos.length}).`;
}
