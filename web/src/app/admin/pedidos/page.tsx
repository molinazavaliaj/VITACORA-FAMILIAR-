import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { destinatarioDe, envioDe, estadoDelPago, filtrar, lineasDelProducto, numeroDePedido, resumen, seCobro, type Filtro, type PedidoAdmin } from "@/lib/pedidos-admin";
import { leerPedidos } from "@/lib/pedidos-admin-base";
import { Chip, Cifra, Nota, SinDatos, Titulo, fechaCorta } from "../ui";
import { ChipEnvio } from "./envio-ui";

// 03 · Pedidos — «qué se vendió y qué falta despachar». Todas las compras con su número,
// y el filtro de lo que todavía no salió. Cada número abre la ficha con la etiqueta.

export const dynamic = "force-dynamic";

const FILTROS: { id: Filtro; nombre: string }[] = [
  { id: "falta", nombre: "falta despachar" },
  { id: "compras", nombre: "todas las compras" },
  { id: "sin_pagar", nombre: "sin pagar" },
];

function filtroDe(crudo: unknown): Filtro {
  return crudo === "compras" || crudo === "sin_pagar" ? crudo : "falta";
}

const urlDe = (filtro: Filtro, q: string) => {
  const p = new URLSearchParams({ ver: filtro });
  if (q) p.set("q", q);
  return `/admin/pedidos?${p}`;
};

const plata = (monto: number | null, moneda: string | null) => {
  if (monto === null || !moneda) return "—";
  return new Intl.NumberFormat(moneda === "ARS" ? "es-AR" : "es-ES", { style: "currency", currency: moneda }).format(monto);
};

export default async function PantallaPedidos({ searchParams }: PageProps<"/admin/pedidos">) {
  const params = await searchParams;
  const filtro = filtroDe(params.ver);
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const r = await leerPedidos(crearClienteServidor());

  return (
    <div className="adm-entra">
      <Titulo ruta="/admin/pedidos">
        Cada compra tiene su número, el que va en la etiqueta del paquete. Tocá el número para abrir la ficha: ahí está la
        etiqueta y se carga el seguimiento.
      </Titulo>

      {!r.ok ? (
        <p className="adm-alerta">
          {r.falla === "sin_migracion"
            ? "Falta aplicar la migración 20261105000000_numero_de_pedido.sql en Supabase."
            : "No pude leer los pedidos. Probá de nuevo en un rato."}
        </p>
      ) : (
        <Contenido pedidos={r.valor} filtro={filtro} q={q} />
      )}

      <Nota>
        El número lo pone la base apenas entra el pago, y un pedido sin pagar no consume número. «En imprenta» quiere decir
        que la fábrica ya armó los archivos para Bookmundo. «Para despachar» quiere decir que el libro ya llegó. Lo que
        espera a la familia (dirección o frases) va al final de la lista. Las tarjetas impresas del regalo no tienen estado
        de envío: figuran en el producto y su dirección está en la ficha.
      </Nota>
    </div>
  );
}

function Contenido({ pedidos, filtro, q }: { pedidos: PedidoAdmin[]; filtro: Filtro; q: string }) {
  const cuentas = resumen(pedidos);
  const lista = filtrar(pedidos, filtro, q);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra etiqueta="Compras" valor={cuentas.compras} detalle="cobradas, de todos los productos" />
        <Cifra etiqueta="Para despachar" valor={cuentas.paraDespachar} color={cuentas.paraDespachar > 0 ? "ambar" : undefined} detalle="en imprenta o ya en casa" />
        <Cifra etiqueta="Esperando" valor={cuentas.esperando} detalle="la dirección o el libro" />
        <Cifra etiqueta="En camino" valor={cuentas.enCamino} detalle="ya salieron y no llegaron" />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map((f) => (
            <Link key={f.id} href={urlDe(f.id, q)} className="adm-pastilla" aria-current={filtro === f.id ? "true" : undefined}>
              {f.nombre}
            </Link>
          ))}
        </div>
        <form action="/admin/pedidos" className="flex items-center gap-2" role="search">
          <input type="hidden" name="ver" value={filtro} />
          <input className="adm-campo min-w-[230px]" type="search" name="q" defaultValue={q} placeholder="VF-1001, nombre o mail" aria-label="Buscar un pedido" />
          <button type="submit" className="adm-boton adm-boton--hilo">buscar</button>
        </form>
      </div>

      {lista.length === 0 ? (
        <div className="mt-4">
          <SinDatos que={q ? "Ningún pedido coincide con esa búsqueda." : filtro === "falta" ? "No falta despachar nada." : "Todavía no hay pedidos acá."} />
        </div>
      ) : (
        <div className="adm-hoja mt-4 overflow-x-auto">
          <table className="adm-tabla">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Comprador</th>
                <th>Para</th>
                <th>Producto</th>
                <th>Pago</th>
                <th>Envío</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <Fila key={p.id} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Fila({ p }: { p: PedidoAdmin }) {
  const pago = estadoDelPago(p);
  // Los pedidos de prueba y los internos no son ventas: se ven, pero se distinguen.
  const marca = p.extras.prueba ? "prueba" : p.extras.interno ? "interno" : p.extras.piloto ? "piloto" : null;
  return (
    <tr>
      <td className="whitespace-nowrap">
        <Link href={`/admin/pedidos/${p.id}`} className="font-semibold underline decoration-[var(--linea-fuerte)] underline-offset-4">
          {seCobro(p) ? numeroDePedido(p.numero) : "ver"}
        </Link>
      </td>
      <td className="whitespace-nowrap">{fechaCorta(p.created_at, true)}</td>
      <td>
        <span className="block">{p.comprador?.nombre ?? "—"}</span>
        <span className="block text-xs text-[var(--texto-menor)]">{p.comprador?.email ?? ""}</span>
      </td>
      <td>{destinatarioDe(p)}</td>
      <td>
        {lineasDelProducto(p).join(" · ")}
        {marca ? <span className="ml-2"><Chip>{marca}</Chip></span> : null}
      </td>
      <td className="whitespace-nowrap">
        <Chip color={pago.color}>{pago.texto}</Chip>
        <span className="mt-1 block text-xs text-[var(--texto-menor)]">{plata(p.monto, p.moneda)}</span>
      </td>
      <td className="whitespace-nowrap"><ChipEnvio estado={envioDe(p)} /></td>
    </tr>
  );
}
