import "../../_checkout/checkout.css";

// Mientras carga la confirmación del pago (RENDIMIENTO.md §3.1). Sin esto
// mandaría el esqueleto de más arriba (si lo hubiera), con otra forma, y la
// página aparecería con un salto de color. El mismo cascarón de las compras
// (la tinta arriba, la hoja de papel debajo), una forma mínima y un aviso para
// lectores de pantalla.

export default function CargandoGracias() {
  return (
    <div aria-busy="true" className="dir-pagina chk flex min-h-dvh flex-1 flex-col">
      <div className="dir-tinta chk-cabecera h-[92px] sm:h-[108px]" />
      <div className="dir-deckle chk-hoja flex flex-col">
        <p role="status" className="sr-only">
          Cargando…
        </p>
        <div aria-hidden className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 pt-14 motion-safe:animate-pulse sm:px-8 sm:pt-20">
          <div className="mb-3 h-16 w-16 rounded-full border border-[var(--borde-oscuro-fuerte)]" />
          <div className="h-3 w-40 rounded-sm bg-[var(--tarjeta-alta)]" />
          <div className="mt-2 h-12 w-[28rem] max-w-full rounded-sm bg-[var(--tarjeta-alta)]" />
          <div className="h-4 w-[34rem] max-w-full rounded-sm bg-[var(--tarjeta-alta)]" />
          <div className="h-4 w-[26rem] max-w-full rounded-sm bg-[var(--tarjeta-alta)]" />
        </div>
      </div>
    </div>
  );
}
