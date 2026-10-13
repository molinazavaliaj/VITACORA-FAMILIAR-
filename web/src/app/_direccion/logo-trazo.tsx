import type { CSSProperties } from "react";

// El Campo V·F dibujándose a lápiz (prototipo de dirección visual, 13/10). La
// geometría es la de CampoVF (marca.tsx), que no se toca: acá se copia para
// poder trazar cada elipse por separado.
//
// Cómo se dibuja: cada anillo es una elipse con pathLength="1", así el
// stroke-dasharray/dashoffset va de 1 a 0 sin medir nada. El lado derecho es el
// izquierdo espejado, así los dos arrancan desde el eje del medio y giran
// iguales, como una mano que repite el gesto. Encima de cada anillo va un
// «repaso» más tenue y apenas corrido, que llega un poco después: es lo que
// hace que parezca lápiz y no un vector. El filtro mete grano (agujeritos) y
// una ondulación mínima en el trazo. Después la V y la F se repasan y se
// rellenan, como tiza, y al final aparece el eje punteado.
//
// Todo es CSS (globals.css, bloque «dir-»): sin JS. Con «menos movimiento» el
// logo está dibujado desde el principio. `modo="scroll"` dibuja el mismo logo
// atado al desplazamiento (el cierre), solo donde hay animation-timeline.

const ANILLOS: ReadonlyArray<readonly [number, number, number]> = [
  [86.14, 13.86, 17.63],
  [73.23, 26.77, 34.07],
  [60.65, 39.35, 50.08],
  [48.29, 51.71, 65.82],
  [36.08, 63.92, 81.36],
  [23.99, 76.01, 96.74],
  [12.0, 88.0, 112.0],
];

const k = (n: number) => ({ "--k": n }) as CSSProperties;

function Lado({ filtro }: { filtro: string }) {
  return (
    <g filter={`url(#${filtro})`}>
      {ANILLOS.map(([cx, rx, ry], i) => (
        <g key={cx}>
          <ellipse className="dir-anillo" style={k(i)} cx={cx} cy={145} rx={rx} ry={ry} pathLength={1} />
          <ellipse
            className="dir-anillo dir-repaso"
            style={k(i)}
            cx={cx + 0.5}
            cy={145.4}
            rx={rx - 0.3}
            ry={ry + 0.4}
            pathLength={1}
          />
        </g>
      ))}
    </g>
  );
}

export function LogoTrazo({
  id,
  modo = "carga",
  halo,
  className = "",
}: {
  /** Único en la página: nombra el filtro de lápiz. */
  id: string;
  modo?: "carga" | "scroll";
  /** El color del fondo: las letras abren su claro tapando los anillos. */
  halo: string;
  className?: string;
}) {
  const filtro = `${id}-lapiz`;
  return (
    <svg
      viewBox="-78 8 356 278"
      className={`dir-logo dir-logo--${modo} ${className}`}
      role="img"
      aria-label="Vitácora Familiar"
    >
      <defs>
        <filter id={filtro} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="ruido" />
          <feDisplacementMap in="SourceGraphic" in2="ruido" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="movido" />
          <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -0.9" result="grano" />
          <feComposite in="movido" in2="grano" operator="in" />
        </filter>
      </defs>

      <g className="dir-eje">
        <line x1="100" y1="20.32" x2="100" y2="269.68" stroke="currentColor" strokeWidth="0.9" strokeDasharray="3 4" opacity="0.55" />
        <path d="M100 12 l5.2 5.2 l-5.2 5.2 l-5.2 -5.2 Z" fill="currentColor" opacity="0.75" />
        <path d="M100 278 l5.2 -5.2 l-5.2 -5.2 l-5.2 5.2 Z" fill="currentColor" opacity="0.75" />
      </g>

      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <Lado filtro={filtro} />
        <g transform="matrix(-1 0 0 1 200 0)">
          <Lado filtro={filtro} />
        </g>
      </g>

      <ellipse cx="52" cy="145" rx="33.5" ry="43" fill={halo} />
      <ellipse cx="148" cy="145" rx="33.5" ry="43" fill={halo} />
      <g className="dir-letras" fontFamily="var(--fuente-titulo)" fontWeight="500" fontSize="76" textAnchor="middle">
        <text className="dir-letra" x="52" y="171">
          V
        </text>
        <text className="dir-letra dir-letra--f" x="148" y="171">
          F
        </text>
      </g>
    </svg>
  );
}
