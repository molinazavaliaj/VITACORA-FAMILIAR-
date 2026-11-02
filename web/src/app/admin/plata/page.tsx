import { crearClienteServidor } from "@/lib/supabase/servidor";
import { datosDelPanel } from "@/lib/admin/datos";
import { cambioDeEntorno, cuentaDelPeriodo, ventaPorVenta } from "@/lib/admin/plata";
import { Chip, euros, Nota, SinDatos, Tarjeta, Titulo, fechaCorta } from "../ui";

// 06 · Plata — «septiembre, del 1 al 21».
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
    <div className="adm-entra">
      <Titulo ruta="/admin/plata" aclara={`${mes}, del 1 al ${ahora.getUTCDate()}`}>
        Lo que se cobró menos lo que se gastó. La cuenta está escrita como una cuenta para que se lea de un vistazo
        y no haya que confiar en un número suelto.
      </Titulo>

      {cuenta.sinConvertir ? (
        <p className="adm-alerta mb-5">
          Hay plata que no se pudo convertir porque falta el tipo de cambio: esta cuenta está incompleta a propósito.
          Se carga en Vercel (CAMBIO_EUR_ARS y CAMBIO_USD_EUR) y no se inventa.
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
        <Tarjeta>
          <p className="adm-micro">Entró</p>
          <p className="adm-cifra mt-3">{euros(cuenta.entro)}</p>
          <ul className="mt-5 flex flex-col gap-1.5 border-t border-[var(--linea)] pt-4 text-sm text-[var(--texto-suave)]">
            <li className="flex justify-between gap-4">
              <span>Vendido y cobrado en el mes</span>
              <span className="adm-dato shrink-0 whitespace-nowrap">{euros(cuenta.entro)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Sin cobrar todavía</span>
              <span className="adm-dato shrink-0 whitespace-nowrap">{euros(cuenta.porCobrar)}</span>
            </li>
          </ul>
        </Tarjeta>

        <div aria-hidden className="flex items-center justify-center text-4xl italic text-[var(--texto-menor)] [font-family:var(--fuente-titulo)]">−</div>

        <Tarjeta>
          <p className="adm-micro">Se gastó</p>
          <p className="adm-cifra mt-3">{euros(cuenta.gastoIa + cuenta.comisiones + cuenta.fijos)}</p>
          <ul className="mt-5 flex flex-col gap-1.5 border-t border-[var(--linea)] pt-4 text-sm text-[var(--texto-suave)]">
            <li className="flex justify-between gap-4">
              <span>Inteligencia artificial de los libros</span>
              <span className="adm-dato shrink-0 whitespace-nowrap">{euros(cuenta.gastoIa)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Comisiones de cobro</span>
              <span className="adm-dato shrink-0 whitespace-nowrap">{euros(cuenta.comisiones)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Railway, dominio y mails (cargado a mano)</span>
              <span className="adm-dato shrink-0 whitespace-nowrap">{euros(cuenta.fijos)}</span>
            </li>
          </ul>
        </Tarjeta>

        <div aria-hidden className="flex items-center justify-center text-4xl italic text-[var(--texto-menor)] [font-family:var(--fuente-titulo)]">=</div>

        <Tarjeta className="adm-hoja--tinta">
          <p className="adm-micro">Ganancia limpia</p>
          <p className="adm-cifra mt-3">{euros(cuenta.limpia)}</p>
          <ul className="mt-5 flex flex-col gap-1.5 border-t border-[var(--linea)] pt-4 text-sm text-[var(--texto-suave)]">
            <li className="flex justify-between gap-4">
              <span>De cada 100 € que entran, quedan</span>
              <span className="adm-dato shrink-0 whitespace-nowrap">{cuenta.porCada100 === null ? "—" : euros(cuenta.porCada100)}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Descontando los libros vendidos que faltan escribir</span>
              <span className="adm-dato shrink-0 whitespace-nowrap">{euros(cuenta.limpiaDeVerdad)}</span>
            </li>
          </ul>
        </Tarjeta>
      </div>

      {cuenta.entro > 0 ? (
        <div className="adm-hoja mt-3 px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="adm-micro">De cada 100 € que entraron</span>
            <span className="text-[var(--texto-menor)]">
              se fueron <b className="text-[var(--texto)]">{euros(Math.min(100, ((cuenta.gastoIa + cuenta.comisiones + cuenta.fijos) / cuenta.entro) * 100))}</b>{" "}
              · quedaron <b className="text-[var(--texto)]">{cuenta.porCada100 === null ? "—" : euros(cuenta.porCada100)}</b>
            </span>
          </div>
          <div className="adm-barra adm-barra--gruesa mt-3" role="img" aria-label="lo que se gastó y lo que quedó de lo que entró">
            <i className="adm-tono-ambar" style={{ width: `${Math.min(100, ((cuenta.gastoIa + cuenta.comisiones + cuenta.fijos) / cuenta.entro) * 100)}%` }} />
            <i className="adm-tono-verde" style={{ width: `${Math.max(0, 100 - ((cuenta.gastoIa + cuenta.comisiones + cuenta.fijos) / cuenta.entro) * 100)}%` }} />
          </div>
        </div>
      ) : null}

      <Nota>
        Las cifras están en euros, que es la moneda de la casa. Lo cobrado en Argentina y lo gastado en dólares
        (Anthropic, OpenAI, Railway) se convierte con el cambio cargado a mano
        {cambio.fecha ? ` (${fechaCorta(cambio.fecha, true)})` : ""}: 1 € = {cambio.eurArs || "—"} ARS y 1 € ={" "}
        {cambio.usdEur || "—"} USD. El cambio queda siempre a la vista porque, si se mueve, estas cuentas se mueven
        con él.
      </Nota>

      <h2 className="adm-micro mt-12">
        Libro vendido por libro vendido
      </h2>
      {delMes.length === 0 ? (
        <div className="mt-4">
          <SinDatos que="Todavía no hay ninguna venta anotada este mes." />
        </div>
      ) : (
        <div className="adm-hoja mt-3 overflow-x-auto">
          <table className="adm-tabla">
            <thead>
              <tr>
                <th>Familia</th>
                <th>País</th>
                <th>Cobrado con</th>
                <th>Pagó</th>
                <th>Costó su IA</th>
                <th>Quedó</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {delMes.map((v, i) => (
                <tr key={`${v.familia}-${i}`}>
                  <td>{v.familia}</td>
                  <td>{v.region === "AR" ? "Argentina" : v.region === "ES" ? "España" : v.region}</td>
                  <td>{v.pasarela === "mercadopago" ? "Mercado Pago" : "Stripe"}</td>
                  <td>
                    {v.moneda === "EUR" ? euros(v.pago) : `${v.pago} ${v.moneda}`}
                  </td>
                  <td>{v.costoIa === null ? "—" : euros(v.costoIa)}</td>
                  <td>{v.quedo === null ? "—" : euros(v.quedo)}</td>
                  <td>
                    <Chip color={v.estado === "pendiente" ? "ambar" : "verde"}>{v.estado.replace(/_/g, " ")}</Chip>
                  </td>
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
