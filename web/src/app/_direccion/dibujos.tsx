import type { CSSProperties, ReactNode } from "react";

// Los tres dibujos de «Cómo funciona» (2.ª vuelta, 13/10): una libreta, un
// audio de WhatsApp y un libro abierto, en línea fina como los anillos del
// logo. Decorativos (aria-hidden): el paso lo cuenta el texto. Cada trazo
// tiene pathLength="1" para dibujarse con el mismo truco que el logo cuando
// el paso entra en pantalla (globals.css, .dir-dibujo). Sin JS, ya dibujados.

const k = (n: number) => ({ "--k": n }) as CSSProperties;

function Lienzo({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 160 110"
      aria-hidden
      className="dir-dibujo h-auto w-[136px] sm:w-[190px] lg:w-[210px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Paso 1, «Lo anotas»: una libreta de espiral y un lápiz. */
export function DibujoLibreta() {
  return (
    <Lienzo>
      <g transform="rotate(-5 66 60)">
        <rect className="dir-linea" style={k(0)} x="26" y="20" width="80" height="82" rx="3" pathLength={1} />
        {[38, 50, 62, 74, 86, 98].map((x, i) => (
          <circle key={x} className="dir-linea" style={k(1 + i * 0.3)} cx={x - 2} cy="20" r="3.2" pathLength={1} />
        ))}
        {[42, 54, 66, 78].map((y, i) => (
          <path key={y} className="dir-linea dir-linea--tenue" style={k(3 + i)} d={`M38 ${y} H${i === 3 ? 74 : 94}`} pathLength={1} />
        ))}
        <path
          className="dir-linea"
          style={k(4)}
          d="M40 40 c4 -5 7 4 11 -1 s6 -4 9 1 s7 2 10 -2 s6 -2 9 2"
          pathLength={1}
        />
      </g>
      <path className="dir-linea" style={k(6)} d="M118 98 L142 34 L148 36.5 L124 100.5 Z" pathLength={1} />
      <path className="dir-linea" style={k(7)} d="M118 98 L119.5 106 L124 100.5" pathLength={1} />
    </Lienzo>
  );
}

const BARRAS = [6, 12, 20, 9, 26, 16, 30, 12, 22, 8, 18, 28, 14, 10, 24, 12, 6];

/** Paso 2, «Solo manda audios»: el globo de un audio de WhatsApp. */
export function DibujoAudio() {
  return (
    <Lienzo>
      <path
        className="dir-linea"
        style={k(0)}
        d="M30 26 H136 a10 10 0 0 1 10 10 V70 a10 10 0 0 1 -10 10 H44 L24 94 L30 78 a10 10 0 0 1 -8 -10 V36 a10 10 0 0 1 8 -10 Z"
        pathLength={1}
      />
      <path className="dir-linea" style={k(2)} d="M36 44 L50 53 L36 62 Z" pathLength={1} />
      {BARRAS.map((h, i) => (
        <path
          key={i}
          className="dir-linea"
          style={k(3 + i * 0.25)}
          d={`M${62 + i * 4.6} ${53 - h / 2} V${53 + h / 2}`}
          pathLength={1}
        />
      ))}
    </Lienzo>
  );
}

/** Paso 3, «El biógrafo escribe»: un libro abierto con el toroide en la página. */
export function DibujoLibro() {
  return (
    <Lienzo>
      <path className="dir-linea" style={k(0)} d="M80 30 C66 22 42 20 20 25 V92 C42 87 66 89 80 97" pathLength={1} />
      <path className="dir-linea" style={k(0.5)} d="M80 30 C94 22 118 20 140 25 V92 C118 87 94 89 80 97" pathLength={1} />
      <path className="dir-linea dir-linea--tenue" style={k(1)} d="M80 30 V97" pathLength={1} />
      {[40, 50, 60, 70, 80].map((y, i) => (
        <path
          key={y}
          className="dir-linea dir-linea--tenue"
          style={k(2 + i * 0.5)}
          d={`M30 ${y - 2 + i * 0.2} C44 ${y - 5} 58 ${y - 4} ${i === 4 ? 60 : 72} ${y - 1}`}
          pathLength={1}
        />
      ))}
      {[
        [104, 7, 9],
        [100, 11, 14],
      ].map(([cx, rx, ry], i) => (
        <g key={cx} className="dir-linea--tenue">
          <ellipse className="dir-linea" style={k(4 + i)} cx={cx} cy="58" rx={rx} ry={ry} pathLength={1} />
          <ellipse className="dir-linea" style={k(4 + i)} cx={220 - cx} cy="58" rx={rx} ry={ry} pathLength={1} />
        </g>
      ))}
    </Lienzo>
  );
}
