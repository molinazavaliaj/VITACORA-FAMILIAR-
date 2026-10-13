import { Cargando, Hueso, TarjetaHueca } from "./esqueleto";

// Mientras carga el Inicio (RENDIMIENTO.md §3.1): el cascarón ya está pintado
// por el layout; acá va la forma de la página — etiqueta, título y una tarjeta
// por historia — para que el clic responda al instante.

export default function CargandoInicio() {
  return (
    <Cargando className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10 md:py-14">
      <Hueso className="h-3 w-16" />
      <Hueso className="mt-4 h-9 w-56 md:h-10" />
      <div className="mt-8 flex flex-col gap-6">
        {[0, 1].map((i) => (
          <TarjetaHueca key={i}>
            <Hueso className="h-3 w-24" />
            <Hueso className="mt-3 h-7 w-64 max-w-full" />
            <Hueso className="mt-3 h-4 w-48 max-w-full" />
            <Hueso className="mt-6 h-2 w-full rounded-full" />
            <Hueso className="mt-6 h-11 w-44 rounded-full" />
          </TarjetaHueca>
        ))}
      </div>
    </Cargando>
  );
}
