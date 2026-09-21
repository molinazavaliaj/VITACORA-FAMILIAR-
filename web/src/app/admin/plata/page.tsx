import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosDelPanel } from "@/lib/admin/datos";
import { cambioDeEntorno, cuentaDelPeriodo, ventaPorVenta } from "@/lib/admin/plata";
import { euros, Nota, SinDatos, Tarjeta, Titulo, fechaCorta } from "../ui";

// 03 · Plata — «septiembre, del 1 al 21».
// La cuenta está escrita como una cuenta para que se lea de un vistazo y no haya que
// confiar en un número suelto: Entró − Se gastó = Ganancia limpia, con el cambio a la vista.

export default async function PantallaPlata() {
  const ahora = new Date();
  const datos = await datosDelPanel(crearClienteServidor(), ahora);
  const cambio = cambioDeEntorno(process.env);

  const desde = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
  const cuenta = cuentaDelPeriodo(datos, cambio, desde, ahora);
  const ventas = ventaPorVenta(datos, cambio);
  const delMes = ventas.filter((v) => v.estado !== "fallido");

  const mes = ahora.toLocaleDateString("es-ES", { month: "long", timeZone: "UTC" });

  return (
    <div>
      <Titulo numero="03" nombre="Plata" aclara={`${mes}, del 1 al ${ahora.getUTCDate()}`} />

      <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-[var(--texto-suave)]">
        Lo que se cobró menos lo que se gastó. La cuenta está escrita como una cuenta para que se lea de un vistazo
        y no haya que confiar en un número suelto.
      </p>

      {cuenta.sinConvertir ? (
        <p className="mt-4 rounded border border-[var(--alerta)] px-4 py-3 text-sm text-[var(--alerta)]">
          Hay plata que no se pudo convertir porque falta el tipo de cambio: esta cuenta está incompleta a propósito.
          Se carga en Vercel (CAMBIO_EUR_ARS y CAMBIO_USD_EUR) y no se inventa.
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
        <Tarjeta>
          <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">Entró</p>
          <p className="mt-1 text-3xl [font-family:var(--fuente-titulo)]">{euros(cuenta.entro)}</p>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-[var(--texto-suave)]">
            <li className="flex justify-between gap-4">
              <span>Vendido y cobrado en el mes</span>
              <span>{euros(cuenta.entro)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Sin cobrar todavía</span>
              <span>{euros(cuenta.porCobrar)}</span>
            </li>
          </ul>
        </Tarjeta>

        <div className="hidden items-center text-2xl text-[var(--texto-menor)] lg:flex">−</div>

        <Tarjeta>
          <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">Se gastó</p>
          <p className="mt-1 text-3xl [font-family:var(--fuente-titulo)]">{euros(cuenta.gastoIa + cuenta.comisiones + cuenta.fijos)}</p>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-[var(--texto-suave)]">
            <li className="flex justify-between gap-4">
              <span>Inteligencia artificial de los libros</span>
              <span>{euros(cuenta.gastoIa)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Comisiones de cobro</span>
              <span>{euros(cuenta.comisiones)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Railway, dominio y mails (cargado a mano)</span>
              <span>{euros(cuenta.fijos)}</span>
            </li>
          </ul>
        </Tarjeta>

        <div className="hidden items-center text-2xl text-[var(--texto-menor)] lg:flex">=</div>

        <Tarjeta className="border-[var(--acento)]">
          <p className="text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">Ganancia limpia</p>
          <p className="mt-1 text-3xl text-[var(--acento)] [font-family:var(--fuente-titulo)]">{euros(cuenta.limpia)}</p>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-[var(--texto-suave)]">
            <li className="flex justify-between gap-4">
              <span>De cada 100 € que entran, quedan</span>
              <span>{cuenta.porCada100 === null ? "—" : euros(cuenta.porCada100)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Descontando los libros vendidos que faltan escribir</span>
              <span>{euros(cuenta.limpiaDeVerdad)}</span>
            </li>
          </ul>
        </Tarjeta>
      </div>

      <Nota>
        Las cifras están en euros, que es la moneda de la casa. Lo cobrado en Argentina y lo gastado en dólares
        (Anthropic, OpenAI, Railway) se convierte con el cambio cargado a mano
        {cambio.fecha ? ` (${fechaCorta(cambio.fecha, true)})` : ""}: 1 € = {cambio.eurArs || "—"} ARS y 1 € ={" "}
        {cambio.usdEur || "—"} USD. El cambio queda siempre a la vista porque, si se mueve, estas cuentas se mueven
        con él.
      </Nota>

      <h2 className="mt-8 text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
        Libro vendido por libro vendido
      </h2>
      {delMes.length === 0 ? (
        <div className="mt-3">
          <SinDatos que="Todavía no hay ninguna venta anotada este mes." />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                <th className="border-b border-[var(--linea)] py-2 pr-4">Familia</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">País</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Cobrado con</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Pagó</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Costó su IA</th>
                <th className="border-b border-[var(--linea)] py-2 pr-4">Quedó</th>
                <th className="border-b border-[var(--linea)] py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {delMes.map((v, i) => (
                <tr key={`${v.familia}-${i}`}>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{v.familia}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{v.region === "AR" ? "Argentina" : v.region === "ES" ? "España" : v.region}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{v.pasarela === "mercadopago" ? "Mercado Pago" : "Stripe"}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">
                    {v.moneda === "EUR" ? euros(v.pago) : `${v.pago} ${v.moneda}`}
                  </td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{v.costoIa === null ? "—" : euros(v.costoIa)}</td>
                  <td className="border-b border-[var(--linea)] py-2 pr-4">{v.quedo === null ? "—" : euros(v.quedo)}</td>
                  <td className="border-b border-[var(--linea)] py-2">{v.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Nota>
        El costo de IA de cada venta es lo que costó escribir <em>ese</em> libro, no un promedio: sale de sumar las
        llamadas al modelo que quedaron anotadas a nombre de ese narrador desde que empezó la entrevista. Por eso una
        venta vieja muestra el costo completo y una recién vendida muestra casi cero.
      </Nota>
    </div>
  );
}
