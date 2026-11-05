// Los audios que entran al libro y se vuelven líneas. Diseño propio, solo CSS.
// Es ilustración: aria-hidden. Con «menos movimiento» queda todo a la vista.
const ONDAS = [
  "M1 7v0M6 3v8M11 5v4M16 1v12M21 4v6M26 2v10M31 5v4M36 3v8M41 6v2",
  "M1 6v2M6 2v10M11 5v4M16 3v8M21 1v12M26 5v4M31 2v10M36 4v6M41 6v2",
  "M1 5v4M6 3v8M11 1v12M16 5v4M21 2v10M26 4v6M31 1v12M36 5v4M41 6v2",
];
const DURACIONES = ["2:14", "4:51", "3:40"];

export function AudiosLibro({ capitulos }: { capitulos: [string, string] }) {
  return (
    <div className="acu-escena" aria-hidden>
      <div className="acu-abierto">
        {capitulos.map((c) => (
          <div key={c} className="acu-hoja">
            <small>{c}</small>
            <i /><i /><i />
          </div>
        ))}
      </div>
      {ONDAS.map((d, i) => (
        <div key={d} className={`acu-audio acu-audio--${i + 1}`}>
          <svg viewBox="0 0 46 14"><path d={d} stroke="currentColor" strokeWidth="2" /></svg>
          {DURACIONES[i]}
        </div>
      ))}
    </div>
  );
}
