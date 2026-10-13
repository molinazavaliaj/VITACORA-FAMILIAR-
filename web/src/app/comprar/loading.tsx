// Mientras carga el checkout (RENDIMIENTO.md §3.1): la forma de la página —
// cabecera, los pasos, las opciones y el resumen al costado — en cajas sobre el
// fondo oscuro del rediseño, para que no haya un salto de color. Sin texto:
// solo un aviso para lectores de pantalla. El latido es de opacidad y se apaga
// si la persona pidió menos movimiento.

function Hueso({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`rounded-md bg-[var(--tarjeta-alta)] motion-safe:animate-pulse ${className}`} />;
}

export default function CargandoCheckout() {
  return (
    <div aria-busy="true" className="tema-oscuro flex min-h-dvh flex-1 flex-col">
      <p role="status" className="sr-only">
        Cargando…
      </p>
      <div className="border-b border-[var(--linea-oscura)]">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-5 sm:px-6">
          <Hueso className="h-7 w-36" />
          <Hueso className="h-4 w-40" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1180px] px-4 pt-9 sm:px-6">
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <Hueso key={i} className="h-8 w-28" />
          ))}
        </div>
        <div className="mt-9 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <Hueso className="h-10 w-80 max-w-full" />
            <Hueso className="mt-4 h-5 w-96 max-w-full" />
            <Hueso className="mt-8 h-24 w-full rounded-[18px]" />
            <Hueso className="mt-3 h-28 w-full rounded-[18px]" />
            <Hueso className="mt-8 h-14 w-44 rounded-full" />
          </div>
          <Hueso className="hidden h-72 w-full rounded-[22px] lg:block" />
        </div>
      </div>
    </div>
  );
}
