// Los pasos de las compras en la dirección «la web es un libro» (14/10): el
// número grande en Playfair cursiva, como el de un capítulo, el nombre en
// Archivo y un hilo que se llena con scaleX (nunca width, MOTION.md 2b). Es la
// versión de papel de Pasos (_ui), que queda como estaba para quien la use.
// En el teléfono solo se lee el nombre del paso actual; los otros quedan para
// los lectores de pantalla. Sin estado: lo pinta el formulario que la usa.

export function PasosLibro({ pasos, actual, etiqueta }: { pasos: readonly string[]; actual: number; etiqueta: string }) {
  const total = Math.max(pasos.length, 1);
  const paso = Math.min(Math.max(actual, 1), total);
  return (
    <nav aria-label={etiqueta} className="chk-pasos" style={{ ["--n" as string]: total }}>
      <ol>
        {pasos.map((nombre, i) => {
          const numero = i + 1;
          const estado = numero === paso ? "actual" : numero < paso ? "hecho" : "luego";
          return (
            <li key={`${numero}-${nombre}`} data-estado={estado} aria-current={estado === "actual" ? "step" : undefined} className="chk-paso">
              <span aria-hidden className="chk-paso-numero">
                {numero}
              </span>
              <span className={`chk-paso-nombre ${estado === "actual" ? "" : "sr-only sm:not-sr-only"}`.trim()}>{nombre}</span>
            </li>
          );
        })}
      </ol>
      <div aria-hidden className="chk-pasos-hilo">
        <div className="m-progreso" style={{ transform: `scaleX(${paso / total})` }} />
      </div>
    </nav>
  );
}
