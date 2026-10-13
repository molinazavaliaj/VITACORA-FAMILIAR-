// Mientras carga la confirmación del pago (RENDIMIENTO.md §3.1). Sin esto
// mandaría el esqueleto de más arriba (si lo hubiera), con otra forma, y la página,
// que es oscura, aparecería con un salto de color. Mismo fondo, una forma
// mínima en el centro y un aviso para lectores de pantalla.

export default function CargandoGracias() {
  return (
    <div aria-busy="true" className="tema-oscuro flex min-h-dvh flex-1 flex-col items-center justify-center px-6 py-24">
      <p role="status" className="sr-only">
        Cargando…
      </p>
      <div aria-hidden className="flex w-full max-w-lg flex-col items-center gap-4 motion-safe:animate-pulse">
        <div className="h-24 w-24 rounded-full bg-[var(--tarjeta-alta)]" />
        <div className="mt-6 h-9 w-72 max-w-full rounded-md bg-[var(--tarjeta-alta)]" />
        <div className="h-4 w-80 max-w-full rounded-md bg-[var(--tarjeta-alta)]" />
        <div className="h-4 w-64 max-w-full rounded-md bg-[var(--tarjeta-alta)]" />
      </div>
    </div>
  );
}
