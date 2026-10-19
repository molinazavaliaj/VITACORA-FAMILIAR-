import "./entrar.css";

// Mientras carga /entrar (RENDIMIENTO.md §3.1): la forma del formulario —
// etiqueta, título, una línea, el campo y el botón — sobre la misma tinta que
// la página. Sin texto: solo un aviso para lectores de pantalla.

export default function CargandoEntrar() {
  return (
    <div aria-busy="true" className="dir-pagina dir-tinta ent">
      <p role="status" className="sr-only">
        Cargando…
      </p>
      <div aria-hidden className="ent-foto">
        <div className="ent-foto-papel" />
      </div>
      <div className="ent-lado">
        <div className="ent-cuerpo">
          <div aria-hidden className="ent-form flex flex-col motion-safe:animate-pulse">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="mt-5 h-9 w-full rounded-md bg-white/10" />
            <div className="mt-2 h-9 w-2/3 rounded-md bg-white/10" />
            <div className="mt-5 h-4 w-11/12 rounded bg-white/5" />
            <div className="mt-10 h-[54px] w-full rounded-[14px] bg-white/5" />
            <div className="mt-3 h-14 w-full rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
