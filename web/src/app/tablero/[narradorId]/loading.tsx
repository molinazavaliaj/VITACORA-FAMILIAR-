import { Cargando, Hueso } from "../esqueleto";

// Mientras carga una historia (RENDIMIENTO.md §3.1): la misma grilla que la
// página — el riel a la izquierda en pantallas grandes y el recorrido al lado —
// con cajas grises en lugar del contenido.

export default function CargandoHistoria() {
  return (
    <Cargando className="mx-auto flex w-full max-w-6xl gap-10 px-6 py-8 md:px-10 md:py-10">
      <div aria-hidden className="hidden w-60 shrink-0 flex-col gap-3 lg:flex">
        <Hueso className="h-3 w-20" />
        <Hueso className="h-12 w-full rounded-lg" />
        <Hueso className="h-12 w-full rounded-lg" />
        <Hueso className="mt-6 h-3 w-24" />
        {[0, 1, 2, 3].map((i) => (
          <Hueso key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <Hueso className="h-3 w-32" />
        <Hueso className="mt-4 h-9 w-72 max-w-full md:h-10" />
        <Hueso className="mt-4 h-4 w-56 max-w-full" />
        <div className="mt-8 flex flex-wrap gap-3">
          <Hueso className="h-10 w-36 rounded-full" />
          <Hueso className="h-10 w-32 rounded-full" />
        </div>
        <div className="mt-10 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border border-[var(--linea)] p-4 sm:px-5 sm:py-5">
              <Hueso className="h-5 w-3/4" />
              <Hueso className="h-4 w-full" />
              <Hueso className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </Cargando>
  );
}
