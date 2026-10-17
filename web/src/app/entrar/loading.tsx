// Mientras carga /entrar (RENDIMIENTO.md §3.1): la forma del formulario —
// título, una línea, el campo y el botón — en gris, con el mismo fondo y ancho
// que la página. Sin texto: solo un aviso para lectores de pantalla.

export default function CargandoEntrar() {
  return (
    <div aria-busy="true" className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-24">
      <p role="status" className="sr-only">
        Cargando…
      </p>
      <div aria-hidden className="flex w-full max-w-sm flex-col items-center motion-safe:animate-pulse">
        <div className="h-7 w-24 rounded-md bg-zinc-200" />
        <div className="mt-3 h-4 w-64 max-w-full rounded-md bg-zinc-100" />
        <div className="mt-8 h-12 w-full rounded-lg bg-zinc-100" />
        <div className="mt-3 h-12 w-full rounded-full bg-zinc-200" />
      </div>
    </div>
  );
}
