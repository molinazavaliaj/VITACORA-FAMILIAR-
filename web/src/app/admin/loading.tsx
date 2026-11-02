// Mientras llegan los datos de una pantalla del panel (leerlos todos tarda un par de
// segundos): el mismo dibujo que va a tener, en esqueleto. El lomo ya está pintado por el
// layout, así que se puede ir a otra pantalla sin esperar.

export default function CargandoPanel() {
  return (
    <div aria-busy="true" aria-label="Cargando la pantalla">
      <div className="adm-esqueleto h-3 w-28" />
      <div className="adm-esqueleto mt-4 h-12 w-64" />
      <div className="adm-esqueleto mt-3 h-5 w-[min(420px,80%)]" />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="adm-esqueleto h-32" />
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="adm-esqueleto h-16" />
        ))}
      </div>
    </div>
  );
}
