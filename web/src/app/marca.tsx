// El Campo V·F y el toroide, inline para que hereden color (currentColor) y
// para que las iniciales usen la Playfair Display que la página ya carga —
// los SVG de marca/ dependen de un @import que no funciona dentro de <img>.
// Geometría: copiada tal cual de marca/logo-campo-vf-negro.svg y
// marca/toroide-negro.svg (la fuente de verdad es docs/design.md §3).

const ANILLOS: ReadonlyArray<readonly [number, number, number]> = [
  [86.14, 13.86, 17.63],
  [73.23, 26.77, 34.07],
  [60.65, 39.35, 50.08],
  [48.29, 51.71, 65.82],
  [36.08, 63.92, 81.36],
  [23.99, 76.01, 96.74],
  [12.0, 88.0, 112.0],
];

function Anillos({ grosor }: { grosor: number }) {
  return (
    <>
      {ANILLOS.map(([cx, rx, ry]) => (
        <g key={cx}>
          <ellipse cx={cx} cy={145} rx={rx} ry={ry} fill="none" stroke="currentColor" strokeWidth={grosor} />
          <ellipse cx={200 - cx} cy={145} rx={rx} ry={ry} fill="none" stroke="currentColor" strokeWidth={grosor} />
        </g>
      ))}
    </>
  );
}

/**
 * El Campo V·F completo. `halo` es el color del fondo sobre el que se apoya:
 * las letras "abren su claro" en el campo tapando las líneas justo detrás.
 * Mínimo 120px de alto (regla del manual).
 */
export function CampoVF({ halo, className }: { halo: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 290"
      className={className}
      role="img"
      aria-label="Vitácora Familiar"
    >
      <line x1="100" y1="20.32" x2="100" y2="269.68" stroke="currentColor" strokeWidth="0.9" strokeDasharray="3 4" opacity="0.55" />
      <path d="M100 12 l5.2 5.2 l-5.2 5.2 l-5.2 -5.2 Z" fill="currentColor" opacity="0.75" />
      <path d="M100 278 l5.2 -5.2 l-5.2 -5.2 l-5.2 5.2 Z" fill="currentColor" opacity="0.75" />
      <Anillos grosor={1.15} />
      <ellipse cx="52" cy="145" rx="33.5" ry="43" fill={halo} />
      <ellipse cx="148" cy="145" rx="33.5" ry="43" fill={halo} />
      <text x="52" y="171" textAnchor="middle" fontFamily="var(--fuente-titulo)" fontWeight="500" fontSize="76" fill="currentColor">V</text>
      <text x="148" y="171" textAnchor="middle" fontFamily="var(--fuente-titulo)" fontWeight="500" fontSize="76" fill="currentColor">F</text>
    </svg>
  );
}

/** El toroide solo, para tamaños chicos (mínimo 24px). */
export function Toroide({ className }: { className?: string }) {
  return (
    <svg viewBox="8 29 184 232" className={className} role="img" aria-label="Vitácora Familiar">
      <Anillos grosor={1.35} />
    </svg>
  );
}
