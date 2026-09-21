// La promo en pantalla (8.7): el precio de lista tachado, el "-N %" y el precio
// final. Sin promo, solo el final. Sirve en la landing y en los checkouts; el
// cobro nunca sale de acá (siempre es el precio real, en el servidor).

export function Tachado({ lista, porcentaje, className = "" }: { lista: string; porcentaje: number; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <s className="text-[0.6em] font-normal text-[#83837A] [font-family:var(--fuente-micro)] tabular-nums">{lista}</s>
      <span className="rounded-full bg-[#5D3FD3] px-2 py-0.5 text-[0.4em] font-medium text-white [font-family:var(--fuente-micro)] [letter-spacing:0.05em]">−{porcentaje} %</span>
    </span>
  );
}
