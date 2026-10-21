import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { cuponParaLaCompra } from "@/lib/cupon-base";
import { calcularCompra, catalogo, validarCarrito, type Carrito } from "@/lib/productos";
import { esIdiomaWeb, regionDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_CUPON } from "@/app/_textos/cupon";
import { TEXTOS_COLABORA } from "@/app/_textos/colabora";

// El botón «Aplicar» del checkout (20/10): ¿este código sirve para esta compra
// y cuánto descuenta? Lo calcula el servidor con el mismo catálogo y la misma
// función que /api/compra; el navegador solo muestra lo que vuelve. Al pagar,
// /api/compra lo vuelve a calcular todo (esto no reserva nada).

type Cuerpo = { codigo?: unknown; idiomaWeb?: unknown; productos?: { impresos?: unknown; marcos?: unknown } };

export async function POST(request: NextRequest) {
  let body: Cuerpo;
  try {
    body = (await request.json()) as Cuerpo;
  } catch {
    return NextResponse.json({ error: "El pedido llegó mal formado." }, { status: 400 });
  }
  const idioma: IdiomaWeb = esIdiomaWeb(body.idiomaWeb) ? body.idiomaWeb : "es";
  const T = TEXTOS_CUPON[idioma].checkout;
  const region = regionDeIdioma(idioma);
  const carrito: Carrito = {
    base: "pdf",
    impresos: typeof body.productos?.impresos === "number" ? body.productos.impresos : 0,
    marcos: typeof body.productos?.marcos === "number" ? body.productos.marcos : 0,
  };
  if (!validarCarrito(region, carrito).ok) return NextResponse.json({ error: T.fallo }, { status: 400 });
  const compra = calcularCompra(region, carrito);

  try {
    const r = await cuponParaLaCompra(crearClienteServidor(), body.codigo, compra, catalogo(region));
    if (!r.ok) {
      if ("falla" in r) {
        console.error("cupon validar: no pude revisar el cupón", r.falla);
        return NextResponse.json({ error: T.fallo }, { status: 500 });
      }
      return NextResponse.json({ error: T.motivos[r.motivo], motivo: r.motivo }, { status: 400 });
    }
    // Los dos tipos contestan igual: el código, el importe (0 si un creador no da
    // descuento o la compra no lleva el libro digital), el total y la etiqueta de
    // la línea del resumen. El del creador suma su aviso para el casillero.
    const { descuento: d, creador } = r.compra;
    if (creador) {
      const C = TEXTOS_COLABORA[idioma].checkout;
      return NextResponse.json(
        { codigo: creador.codigo, importe: d?.importe ?? 0, total: r.compra.total, linea: d ? C.linea(creador.codigo, d.porcentaje) : null, aviso: C.aplicado(creador.codigo) },
        { status: 200 },
      );
    }
    return NextResponse.json({ codigo: d!.codigo, importe: d!.importe, total: r.compra.total, linea: T.linea }, { status: 200 });
  } catch (err) {
    console.error("cupon validar: falló", err);
    return NextResponse.json({ error: T.fallo }, { status: 500 });
  }
}
