// Mientras carga el checkout (RENDIMIENTO.md §3.1): la forma de la página —
// cabecera, los pasos, el formulario y el resumen al costado — en cajas grises
// con los mismos colores que el checkout. Sin texto: solo un aviso para
// lectores de pantalla. El latido es de opacidad y se apaga si la persona pidió
// menos movimiento.

function Hueso({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`rounded-md bg-[#EBEBE7] motion-safe:animate-pulse ${className}`} />;
}

export default function CargandoCheckout() {
  return (
    <div aria-busy="true" className="flex flex-1 flex-col bg-[#F7F7F5]">
      <p role="status" className="sr-only">
        Cargando…
      </p>
      <div className="border-b border-[#EBEBE7] bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Hueso className="h-6 w-40" />
          <Hueso className="h-4 w-28" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1fr_380px] lg:py-16">
        <div>
          <div className="flex gap-4 sm:gap-8">
            {[0, 1, 2].map((i) => (
              <Hueso key={i} className="h-4 w-20" />
            ))}
          </div>
          <Hueso className="mt-10 h-9 w-72 max-w-full" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Hueso className="h-40 w-full rounded-xl" />
            <Hueso className="h-40 w-full rounded-xl" />
          </div>
          <Hueso className="mt-8 h-12 w-48 rounded-full" />
        </div>
        <Hueso className="hidden h-72 w-full rounded-xl lg:block" />
      </div>
    </div>
  );
}
