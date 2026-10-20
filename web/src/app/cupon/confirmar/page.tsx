import type { Metadata } from "next";
import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { buscarCuponPorId } from "@/lib/cupon-base";
import { rascaPrendido, vigente, type FilaCupon } from "@/lib/cupon";
import { verificarToken } from "@/lib/token-firmado";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { fechaLegible } from "@/lib/mail-cupon";
import { TEXTOS_CUPON } from "../../_textos/cupon";
import { CascaronCheckout } from "../../_checkout/cascaron";
import { clasesBoton } from "../../_ui";

// Adonde lleva el botón del mail de confirmar (doble opt-in del cupón, 20/10).
// Sin confirmar: un botón que confirma con un POST (/api/cupon/confirmar; los
// antivirus del correo abren los GET solos). Ya confirmado: el código, la fecha
// en que vence y el botón para usarlo. El idioma es el de la fila (la web donde
// se pidió). Dinámica: lee la base.

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cupón de bienvenida", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function leer(c: unknown, t: unknown): Promise<FilaCupon | null> {
  if (typeof c !== "string" || !UUID.test(c) || typeof t !== "string" || !verificarToken("cupon-confirmar", t, c)) return null;
  try {
    const r = await buscarCuponPorId(crearClienteServidor(), c);
    return r.ok ? r.valor : null;
  } catch (err) {
    console.error("cupon confirmar: no pude leer el cupón", err);
    return null;
  }
}

export default async function ConfirmarCupon({ searchParams }: PageProps<"/cupon/confirmar">) {
  const { c, t } = await searchParams;
  const fila = rascaPrendido() ? await leer(c, t) : null;
  const idioma: IdiomaWeb = fila?.idioma ?? "es";
  const P = TEXTOS_CUPON[idioma].paginas;

  let contenido;
  if (!fila) {
    contenido = <p className="chk-bajada">{P.enlaceVencido}</p>;
  } else if (!fila.confirmado_at || !fila.vence_el) {
    contenido = (
      <>
        <h1 className="chk-h1">{P.confirmarTitulo}</h1>
        <p className="chk-bajada">{P.confirmarTexto}</p>
        <form method="post" action="/api/cupon/confirmar">
          <input type="hidden" name="c" value={fila.id} />
          <input type="hidden" name="t" value={String(t)} />
          <button type="submit" className={clasesBoton("primario", "min-h-14 px-8 text-[16px]")}>{P.confirmarBoton}</button>
        </form>
      </>
    );
  } else if (fila.usado_at || !vigente(fila.vence_el, fila.region, new Date())) {
    contenido = (
      <>
        <h1 className="chk-h1">{fila.codigo}</h1>
        <p className="chk-bajada">{P.yaNoVale}</p>
      </>
    );
  } else {
    contenido = (
      <>
        <span className="chk-antetitulo">{P.tuCodigo}</span>
        <h1 className="chk-h1">{P.listoTitulo}</h1>
        <p className="text-[28px] font-semibold tracking-[0.06em] text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">{fila.codigo}</p>
        <p className="chk-bajada">
          {P.vale(fechaLegible(fila.vence_el, idioma))} {P.tambienPorMail}
        </p>
        <Link href={`${ruta(idioma, "/comprar")}?cupon=${encodeURIComponent(fila.codigo)}`} className={clasesBoton("primario", "min-h-14 self-start px-8 text-[16px]")}>
          {P.usar}
        </Link>
      </>
    );
  }

  return (
    <CascaronCheckout idioma={idioma}>
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 pb-28 pt-14 sm:px-8 sm:pt-20">{contenido}</main>
    </CascaronCheckout>
  );
}
