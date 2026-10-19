import { Cargando, Hueso } from "./esqueleto";

// Mientras carga el Inicio (RENDIMIENTO.md §3.1): el cascarón ya está pintado
// por el layout; acá va la forma de la página —el saludo y un libro por
// historia, con su tapa al lado— para que el clic responda al instante.

export default function CargandoInicio() {
  return (
    <Cargando className="mx-auto w-full max-w-[1040px] px-4 pb-16 pt-8 sm:px-8 md:pt-14">
      <Hueso className="h-10 w-64 md:h-14" />
      <Hueso className="mt-4 h-4 w-48" />
      <div className="mt-12 flex flex-col">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-6 border-t border-[var(--linea)] py-8 sm:gap-10">
            <Hueso className="aspect-[148/210] w-[84px] shrink-0 rounded-[2px] sm:w-[120px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <Hueso className="h-7 w-64 max-w-full" />
              <Hueso className="h-4 w-48 max-w-full" />
              <Hueso className="mt-4 h-[2px] w-full" />
              <Hueso className="mt-4 h-11 w-56 max-w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Cargando>
  );
}
